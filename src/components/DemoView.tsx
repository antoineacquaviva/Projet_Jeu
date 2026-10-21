import React, { useState, useMemo } from 'react';
import {
  ActionDefenseurType,
  ActionProgrammee,
  EtatJeuV01,
  GameVersionSpec,
  VariantV01,
} from '../shared/types';
import {
  avancerSousPhaseResolution,
  casesAccessiblesDefenseur,
  clonerEtatJeu,
  COULEURS_PEUPLES_V01,
  creerEtatInitialV01,
  DESCRIPTIONS_PHYSIQUES_TACTIQUES,
  estVariantePlacementV04,
  formaterNomSiege,
  NOMS_TACTIQUES,
} from '../shared/moteur';
import { calculerProgrammationBot } from '../shared/bots';
import { PhysicalBoardV01, TurnPhaseStepper } from './PhysicalBoardV01';

interface DemoViewProps {
  variante: VariantV01;
  versionSpec?: GameVersionSpec;
  onOpenInProto: (etat: EtatJeuV01) => void;
}

type DemoSubTab = 'tour_guide' | 'mise_en_place' | 'boite';

function styleCarteAction(type: ActionDefenseurType, estV04 = false): {
  icone: string;
  titre: string;
  bg: string;
  border: string;
  badgeBg: string;
} {
  switch (type) {
    case 'deplacer':
      return {
        icone: '➔',
        titre: 'Se déplacer',
        bg: 'bg-emerald-50',
        border: 'border-emerald-400',
        badgeBg: 'bg-[#256B45] text-white',
      };
    case 'attendre':
      return {
        icone: estV04 ? '🛑' : '⏸',
        titre: estV04 ? 'Rester sur place (Barrage / Coalition)' : 'Rester sur place',
        bg: 'bg-sky-50',
        border: 'border-sky-400',
        badgeBg: 'bg-sky-700 text-white',
      };
    case 'saboter':
      return {
        icone: '⚡',
        titre: 'Saboter Machine',
        bg: 'bg-amber-50',
        border: 'border-amber-400',
        badgeBg: 'bg-amber-600 text-white',
      };
    case 'replanter':
      return {
        icone: '🌱',
        titre: 'Replanter +1 Forêt',
        bg: 'bg-lime-50',
        border: 'border-lime-400',
        badgeBg: 'bg-lime-700 text-white',
      };
    case 'proteger':
    default:
      return {
        icone: '🛡️',
        titre: 'Protéger la zone',
        bg: 'bg-sky-50',
        border: 'border-sky-400',
        badgeBg: 'bg-sky-700 text-white',
      };
  }
}

export const DemoView: React.FC<DemoViewProps> = ({
  variante,
  versionSpec,
  onOpenInProto,
}) => {
  const [subTab, setSubTab] = useState<DemoSubTab>('tour_guide');
  const [etapeMiseEnPlace, setEtapeMiseEnPlace] = useState<number>(0);
  const [indexEtapeTour, setIndexEtapeTour] = useState<number>(0);
  const [pionDemoFocusId, setPionDemoFocusId] = useState<number | null>(0);
  const [afficherDetailsPedagogiques, setAfficherDetailsPedagogiques] =
    useState<boolean>(false);

  const estV04 = estVariantePlacementV04(variante);

  // Construire les 6 états successifs d'un tour de démonstration complet
  const etapesTourDemo = useMemo(() => {
    const etats: {
      titre: string;
      resumeEssentiel: string;
      descriptionPedagogique: string;
      gestePhysique: string;
      etat: EtatJeuV01;
      etatPrecedent: EtatJeuV01 | null;
    }[] = [];

    // Étape 0 : Début du tour — Tirages secrets 2D6 sous les gobelets
    const e0 = creerEtatInitialV01(variante, 20261019);
    const e0Obs = clonerEtatJeu(e0);
    e0Obs.sousPhase = 'observation_2d6';
    etats.push({
      titre: '1. Tirage secret des 2D6 sous les gobelets',
      resumeEssentiel: `Vous (MOI) regardez vos dés secrets [${e0.lancersSecretsDuTour[0]?.d1}, ${e0.lancersSecretsDuTour[0]?.d2}] : Somme ${e0.lancersSecretsDuTour[0]?.somme} (${NOMS_TACTIQUES[e0.pisteTactique[e0.lancersSecretsDuTour[0]?.somme || 7]]}) + Écart ${e0.lancersSecretsDuTour[0]?.ecart} (Machine M${e0.pisteMachine[e0.lancersSecretsDuTour[0]?.ecart ?? 1]}).`,
      descriptionPedagogique: `Chaque joueur lance 2D6 sous son gobelet personnel et regarde ses dés en secret. Ici, MOI voit [${e0.lancersSecretsDuTour[0]?.d1}, ${e0.lancersSecretsDuTour[0]?.d2}] : la somme (${e0.lancersSecretsDuTour[0]?.somme}) désigne la Tactique « ${NOMS_TACTIQUES[e0.pisteTactique[e0.lancersSecretsDuTour[0]?.somme || 7]]} » et l'écart (${e0.lancersSecretsDuTour[0]?.ecart}) désigne la Machine M${e0.pisteMachine[e0.lancersSecretsDuTour[0]?.ecart ?? 1]} sur la piste statistique (1, 2, 3, 0, 4, 5).`,
      gestePhysique:
        'Soulevez légèrement votre gobelet 2D6 pour lire vos 2 dés, repérez la Somme sur la Piste Tactique (2–12) et l’Écart sur la Piste Machine (1, 2, 3, 0, 4, 5), puis reposez votre gobelet sans prononcer un mot.',
      etat: e0Obs,
      etatPrecedent: null,
    });

    // Étape 1 : Programmation publique séquentielle
    const e1 = clonerEtatJeu(e0);
    for (let j = 0; j < variante.nbJoueurs; j++) {
      const prog = calculerProgrammationBot(e1, j, 'deductif');
      const pionsJ = e1.defenseurs.filter((d) => d.joueur === j);
      const actionsEnrichies: ActionProgrammee[] = [...prog.actions];

      pionsJ.forEach((pion, pIdx) => {
        const voisines = casesAccessiblesDefenseur(e1, pion.caseId).filter(
          (cid) => cid !== pion.caseId
        );
        const caseAvecMachine = voisines.find((cid) =>
          e1.machines.some((m) => m.caseId === cid)
        );
        const caseLibre = voisines.find(
          (cid) => !e1.machines.some((m) => m.caseId === cid)
        );
        const caseCoeur = voisines.find(
          (cid) => e1.cases[cid]?.anneau === 'coeur'
        );
        const cibleDeplacement =
          pIdx === 0
            ? (estV04 ? caseLibre ?? voisines[0] : caseAvecMachine ?? voisines[0]) ??
              pion.caseId
            : (estV04 ? caseAvecMachine ?? caseCoeur : caseCoeur ?? voisines[1]) ??
              voisines[0] ??
              pion.caseId;

        const aDejaDeplacement = actionsEnrichies.some(
          (a) => a.pionId === pion.id && a.type === 'deplacer'
        );

        if (
          !aDejaDeplacement &&
          cibleDeplacement !== pion.caseId &&
          (j <= 2 || pIdx === 0)
        ) {
          const idx1 = actionsEnrichies.findIndex(
            (a) => a.pionId === pion.id && a.etape === 1
          );
          const act1Demo: ActionProgrammee = {
            pionId: pion.id,
            etape: 1,
            type: 'deplacer',
            caseCible: cibleDeplacement,
            machineCible: null,
            explicationBot: estV04
              ? `Déplacement I : rejoint ${e1.cases[cibleDeplacement]?.nom} pour former un Barrage d'entrée.`
              : `Se déplace vers ${e1.cases[cibleDeplacement]?.nom} pour intercepter la menace.`,
          };
          if (idx1 >= 0) actionsEnrichies[idx1] = act1Demo;
          else actionsEnrichies.push(act1Demo);

          const machineSurCible = e1.machines.find(
            (m) => m.caseId === cibleDeplacement
          );
          const idx2 = actionsEnrichies.findIndex(
            (a) => a.pionId === pion.id && a.etape === 2
          );
          const act2Demo: ActionProgrammee = estV04
            ? {
                pionId: pion.id,
                etape: 2,
                type: 'attendre',
                caseCible: null,
                machineCible: null,
                explicationBot: machineSurCible
                  ? `Maintien sur ${e1.cases[cibleDeplacement]?.nom} en Coalition Inter-Peuples (2 Peuples distincts bloquent la coupe).`
                  : `Maintien du Barrage sur ${e1.cases[cibleDeplacement]?.nom}.`,
              }
            : {
                pionId: pion.id,
                etape: 2,
                type:
                  machineSurCible && variante.effetSaboter !== 'alliance_requise'
                    ? 'saboter'
                    : 'proteger',
                caseCible: null,
                machineCible: machineSurCible?.id ?? null,
                explicationBot: machineSurCible
                  ? `Sabote ${machineSurCible.nom} sur ${e1.cases[cibleDeplacement]?.nom}.`
                  : `Protège ${e1.cases[cibleDeplacement]?.nom} en posture Bouclier.`,
              };
          if (idx2 >= 0) actionsEnrichies[idx2] = act2Demo;
          else actionsEnrichies.push(act2Demo);
        }
      });

      e1.programmations[j] = actionsEnrichies;
      e1.etatRng = prog.nextRngState;
    }
    e1.sousPhase = 'programmation_1';
    etats.push({
      titre: estV04
        ? '2. Programmation publique des Déplacements (I & II) — Pur Placement V0.4'
        : '2. Programmation publique des Cartes Action (I & II) pour chaque Défenseur',
      resumeEssentiel: estV04
        ? 'Chacun à son tour, vous annoncez publiquement la destination de vos 2 Défenseurs (Déplacement I avant les Machines = Barrage ; Déplacement II après les Machines = Coalition). Aucune carte Action requise !'
        : 'Chacun à son tour, vous posez publiquement (face visible) vos cartes Action I et II devant chaque Défenseur pour permettre à vos coéquipiers de déduire votre gobelet 2D6.',
      descriptionPedagogique: estV04
        ? 'En V0.4 (« Pur Placement & Coalition »), les Défenseurs ont pour unique action de se déplacer (ou rester sur place). En observant vers quelles cases vos coéquipiers dirigent leurs pions en Étape I (pour barrer l’entrée d’une Machine) et en Étape II (pour former une Coalition de 2 Peuples différents contre une Machine présente), vous déduisez les menaces cachées sous leurs gobelets !'
        : 'Chaque pion Défenseur (MOI 1, MOI 2...) possède sa propre ligne avec deux emplacements : « Carte Action I » et « Carte Action II ». Les cartes sont posées face visible à tour de rôle.',
      gestePhysique: estV04
        ? 'À tour de rôle et publiquement, indiquez la destination (Déplacement I puis Déplacement II) de chacun de vos 2 pions Défenseurs. Les flèches en pointillés sur le plateau montrent les trajets programmés !'
        : 'À tour de rôle, posez publiquement (face visible) vos 2 cartes sur la ligne du Défenseur #1 et vos 2 cartes sur la ligne du Défenseur #2.',
      etat: clonerEtatJeu(e1),
      etatPrecedent: clonerEtatJeu(e0Obs),
    });

    // Étape 2 : Résolution des 1res actions des Défenseurs
    const e1Pret = clonerEtatJeu(e1);
    e1Pret.sousPhase = 'resolution_actions_1';
    const e2 = avancerSousPhaseResolution(e1Pret);
    etats.push({
      titre: estV04
        ? '3. Exécution du Déplacement I des Défenseurs (Formation des Barrages 🛑)'
        : '3. Exécution des 1res actions des Défenseurs (Cartes Action I)',
      resumeEssentiel: estV04
        ? 'Vos Défenseurs effectuent leur 1er déplacement ! Toute case occupée par au moins 1 Défenseur devient un BARRAGE 🛑 : aucune Machine ne pourra y entrer à l’étape suivante.'
        : 'On applique la « Carte Action I » de chaque Défenseur : les pions se déplacent le long des flèches pleines vers leurs nouvelles zones !',
      descriptionPedagogique: estV04
        ? 'C’est le 1er pilier de la V0.4 : il suffit d’UN SEUL Défenseur sur une case pour interdire à toute Machine d’y entrer lors du ciblage (Étape 4). Un joueur qui a lu son gobelet 2D6 peut donc bloquer seul l’arrivée de sa Machine en se plaçant sur sa case cible dès le Déplacement I !'
        : 'Toutes les cartes posées publiquement sur l’emplacement « Action I » s’activent : les flèches pleines sur le plateau montrent les déplacements réalisés.',
      gestePhysique: estV04
        ? 'Déplacez physiquement les pions Défenseurs sur le plateau selon leur Déplacement I. Chaque case occupée par au moins 1 Défenseur fait désormais barrage aux Machines.'
        : 'Appliquez la carte « Action I » de chacun de vos Défenseurs et déplacez physiquement les pions en bois sur le plateau.',
      etat: clonerEtatJeu(e2),
      etatPrecedent: clonerEtatJeu(e1),
    });

    // Étape 3 : Révélation des gobelets 2D6 & Ciblage des Machines au milieu (sans coupe !)
    const e3 = avancerSousPhaseResolution(e2);
    etats.push({
      titre: estV04
        ? '4. Révélation 2D6 & Déplacement des Machines (Bloquées par vos Barrages 🛑)'
        : '4. Ciblage & Déplacement des Machines (sans couper d’arbre)',
      resumeEssentiel: estV04
        ? 'Les gobelets 2D6 sont levés ! Les Machines tentent de rejoindre leur cible, mais toute case occupée par au moins 1 Défenseur leur est interdite (déplacement annulé ou dévié selon la variante).'
        : 'Les gobelets 2D6 sont levés ! Les flèches oranges 🎯 montrent le déplacement des Machines vers leurs cibles selon les pistes (elles ne coupent pas encore).',
      descriptionPedagogique: estV04
        ? 'Tous les gobelets 2D6 sont soulevés. Pour chaque paire de dés, la Machine désignée par l’Écart applique la Tactique désignée par la Somme. Si sa case cible contient au moins 1 Défenseur (Barrage 🛑), la Machine ne peut pas y entrer ! Si la case cible est libre, la Machine s’y déplace (sans couper d’arbre pour l’instant).'
        : 'Tous les gobelets 2D6 sont soulevés ! Pour chaque paire de dés, la Machine désignée par l’Écart applique la Tactique désignée par la Somme et se déplace sur sa zone cible.',
      gestePhysique: estV04
        ? 'Soulevez les gobelets 2D6. Pour chaque lancer, vérifiez si la case cible est libre de tout Défenseur : si oui, déplacez-y la Machine ; si au moins 1 Défenseur s’y trouve, son entrée est bloquée !'
        : 'Soulevez les gobelets 2D6. Déplacez chaque figurine Machine (M0 à M5) vers la zone désignée par sa carte Tactique.',
      etat: clonerEtatJeu(e3),
      etatPrecedent: clonerEtatJeu(e2),
    });

    // Étape 4 : Résolution des 2es actions des Défenseurs
    let e4 = clonerEtatJeu(e3);
    if (e4.sousPhase === 'programmation_2') {
      for (let j = 0; j < variante.nbJoueurs; j++) {
        const prog = calculerProgrammationBot(e4, j, 'deductif', 2);
        e4.programmations[j] = prog.actions;
      }
      e4.sousPhase = 'resolution_actions_2';
    }
    if (e4.sousPhase === 'resolution_actions_2') {
      e4 = avancerSousPhaseResolution(e4);
    }
    etats.push({
      titre: estV04
        ? '5. Exécution du Déplacement II (Formation des Coalitions Inter-Peuples 🤝)'
        : '5. Exécution des 2es actions des Défenseurs (Cartes Action II)',
      resumeEssentiel: estV04
        ? 'Vos Défenseurs effectuent leur 2e déplacement ! Pour empêcher une Machine présente sur une case de couper une forêt, il faut réunir au moins 2 Défenseurs de PEUPLES DIFFÉRENTS 🤝 sur sa case.'
        : 'On applique la « Carte Action II » de chaque Défenseur : MOI 1 sabote ⚡ la Machine M0 et MOI 2 lève son bouclier 🛡️ PROTÉGÉ sur le Cœur !',
      descriptionPedagogique: estV04
        ? 'C’est le 2e pilier de la V0.4 : une fois qu’une Machine est sur une case (parce qu’elle y était déjà ou vient d’entrer sur une case libre), un joueur seul ne peut pas l’arrêter (même avec ses 2 pions du même Peuple). Il faut impérativement une COALITION d’au moins 2 Défenseurs de Peuples (joueurs) différents sur la case !'
        : 'Les cartes de l’emplacement « Action II » s’activent : les Défenseurs activent leur posture Bouclier (🛡️ PROTÉGÉ) ou sabotent (⚡) les Machines présentes sur leur zone.',
      gestePhysique: estV04
        ? 'Effectuez le Déplacement II des pions Défenseurs afin de converger à deux Peuples différents sur les cases occupées par des Machines.'
        : 'Appliquez toutes les cartes « Action II », couchez en posture Bouclier les Défenseurs qui protègent, et renvoyez au Chantier les Machines sabotées.',
      etat: clonerEtatJeu(e4),
      etatPrecedent: clonerEtatJeu(e3),
    });

    // Étape 5 : Coupe des Forêts après les 2es actions & Apprentissage sur les 2 pistes
    let e5 = clonerEtatJeu(e4);
    if (e5.sousPhase === 'resolution_coupe_et_apprentissage') {
      e5 = avancerSousPhaseResolution(e5);
    }
    etats.push({
      titre: '6. Coupe des Forêts & Apprentissage statistique du Méchant',
      resumeEssentiel: estV04
        ? 'Toute Machine sur une case contenant 2 Défenseurs de Peuples différents 🤝 est bloquée ! Les autres abattent 1 Forêt 🪓, puis le Méchant apprend sur ses 2 pistes.'
        : 'Chaque Machine non contrée abat 1 Forêt 🪓. Puis le Méchant apprend : succès → glisse vers 7 (Tactique) et vers 1 (Piste Machine 1–2–3–0–4–5).',
      descriptionPedagogique: estV04
        ? 'Pour chaque Machine sur le plateau : si au moins 2 Défenseurs de Peuples différents occupent sa case (Coalition 🤝), la coupe est bloquée (et la Machine recule sur la Piste Machine vers 5). Sinon, elle abat 1 pion Forêt en bois et progresse vers les tirages les plus probables (Somme 7 et Écart 1).'
        : 'Toute Machine non sabotée se trouvant sur une zone non protégée abat 1 pion Forêt en bois. Ensuite, le Méchant apprend sur ses deux pistes publiques.',
      gestePhysique: estV04
        ? 'Vérifiez chaque Machine : s’il y a 2 Défenseurs de couleurs différentes sur sa case, la forêt est sauvée ! Sinon, retirez 1 pion Forêt en bois. Mettez ensuite à jour les deux pistes du Méchant.'
        : 'Retirez 1 pion Forêt en bois pour chaque Machine non contrée. Puis permutez d’un cran sur la Piste Tactique et sur la Piste Machine.',
      etat: clonerEtatJeu(e5),
      etatPrecedent: clonerEtatJeu(e4),
    });

    return etats;
  }, [variante, estV04]);

  const totalForetsBoite =
    variante.foretsCoeur +
    variante.nbJoueurs * 2 * variante.foretsParCaseSecteur;

  const etapeCourante =
    etapesTourDemo[Math.min(indexEtapeTour, etapesTourDemo.length - 1)];

  // État des programmations à afficher sur les plateaux individuels (à partir de l'étape 2, on affiche les cartes de e1)
  const programmationsDemo = useMemo(() => {
    return etapesTourDemo[1]?.etat.programmations || {};
  }, [etapesTourDemo]);

  const pionSelectionneObj = useMemo(() => {
    if (pionDemoFocusId === null) return null;
    return (
      etapeCourante.etat.defenseurs.find((d) => d.id === pionDemoFocusId) ||
      null
    );
  }, [etapeCourante.etat.defenseurs, pionDemoFocusId]);

  const casesSurligneesDemo = useMemo(() => {
    if (!pionSelectionneObj) return [];
    // Si on est à l'étape 2 (Programmation), surligner la destination programmée de ce pion
    const actsJ = programmationsDemo[pionSelectionneObj.joueur] || [];
    const cibles = actsJ
      .filter((a) => a.pionId === pionSelectionneObj.id && a.caseCible !== null)
      .map((a) => a.caseCible as number);
    if (cibles.length > 0) return cibles;
    return casesAccessiblesDefenseur(
      etapeCourante.etat,
      pionSelectionneObj.caseId
    );
  }, [pionSelectionneObj, programmationsDemo, etapeCourante.etat]);

  return (
    <div className="space-y-4">
      {/* Barre supérieure compacte de la Démo */}
      <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-[#16211B]">
            Démo Interactive — « {variante.nom} » (V{variante.version})
          </h2>
          <p className="text-xs text-[#55645B]">
            {variante.nbJoueurs} joueurs (MOI + {variante.nbJoueurs - 1} Bots alliés) ·{' '}
            {totalForetsBoite} Forêts en bois · Piste Machine statistique (1, 2, 3, 0, 4, 5)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
            <button
              onClick={() => setSubTab('tour_guide')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'tour_guide'
                  ? 'bg-[#256B45] text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              ▶ Tour guidé en 6 étapes
            </button>
            <button
              onClick={() => setSubTab('mise_en_place')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'mise_en_place'
                  ? 'bg-[#256B45] text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              Mise en place (4 gestes)
            </button>
            <button
              onClick={() => setSubTab('boite')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'boite'
                  ? 'bg-[#256B45] text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              Matériel & Cartes Action
            </button>
          </div>

          <button
            onClick={() => onOpenInProto(etapeCourante.etat)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap shrink-0"
          >
            Prendre la main dans Proto →
          </button>
        </div>
      </div>

      {/* VOLET PRINCIPAL : DÉMONSTRATION PAS-À-PAS D'UN TOUR COMPLET */}
      {subTab === 'tour_guide' && (
        <div className="space-y-4">
          {/* Frise visuelle interactive des 6 étapes du tour */}
          <TurnPhaseStepper
            sousPhase={etapeCourante.etat.sousPhase}
            tourActuel={1}
            nbTours={variante.nbTours}
            indexEtapeForce={indexEtapeTour}
            onSelectEtape={(idx) => setIndexEtapeTour(idx)}
          />

          {/* Bandeau synthétique de l'étape en cours + Navigation rapide + Détails optionnels */}
          <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-mono-tabular font-bold rounded bg-emerald-100 text-[#165B36]">
                    ÉTAPE {indexEtapeTour + 1} / 6
                  </span>
                  <h3 className="font-display text-base font-bold text-[#16211B]">
                    {etapeCourante.titre}
                  </h3>
                </div>
                <p className="text-sm text-[#16211B] font-medium leading-snug">
                  {etapeCourante.resumeEssentiel}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    setIndexEtapeTour((prev) => Math.max(0, prev - 1))
                  }
                  disabled={indexEtapeTour === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] disabled:opacity-40 whitespace-nowrap"
                >
                  ← Précédente
                </button>
                <button
                  onClick={() =>
                    setIndexEtapeTour((prev) =>
                      Math.min(etapesTourDemo.length - 1, prev + 1)
                    )
                  }
                  disabled={indexEtapeTour === etapesTourDemo.length - 1}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#256B45] text-white disabled:opacity-40 whitespace-nowrap"
                >
                  Étape suivante →
                </button>
                <button
                  onClick={() => setAfficherDetailsPedagogiques((v) => !v)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-white text-[#55645B] hover:text-[#16211B] whitespace-nowrap"
                >
                  {afficherDetailsPedagogiques
                    ? 'Masquer détails ▲'
                    : '+ Détails & Geste sur table ▼'}
                </button>
              </div>
            </div>

            {afficherDetailsPedagogiques && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3 border-t border-[#D8DFD5]">
                <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                  <div className="text-xs font-semibold text-[#16211B] mb-1">
                    Explication détaillée du mécanisme :
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {etapeCourante.descriptionPedagogique}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-300">
                  <div className="text-xs font-semibold text-[#92400E] mb-1">
                    Manipulation correspondante sur la table physique :
                  </div>
                  <p className="text-xs text-[#16211B] leading-relaxed">
                    {etapeCourante.gestePhysique}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Encart spécifique V0.4 : Les 3 Règles d'Or du Pur Placement & Résolution */}
          {estV04 && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-xl p-3.5 border border-emerald-300 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#165B36] flex items-center gap-1.5">
                  <span>🌲</span> Noyau V0.4 — Règles de Résolution Spatiale & Risque Opérationnel
                </span>
                <span className="text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-[#165B36]">
                  RÈGLES OFFICIELLES V0.4
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white/90 border border-emerald-200">
                  <div className="font-bold text-[#16211B] flex items-center gap-1">
                    <span>🛑</span> 1. Barrage d'Entrée
                  </div>
                  <p className="text-[#55645B] mt-0.5 leading-snug">
                    <strong className="text-[#16211B]">≥ 1 Défenseur</strong> présent sur une case interdit à toute Machine d’y pénétrer. Son déplacement est annulé ou reporté.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 border border-rose-200">
                  <div className="font-bold text-rose-900 flex items-center gap-1">
                    <span>⚠️</span> 2. Mouvement Contrarié & Cascade
                  </div>
                  <p className="text-[#55645B] mt-0.5 leading-snug">
                    Si le 1er déplacement est <strong className="text-rose-700">bloqué</strong> (saturation max ou goulot), le pion reste sur place : son 2e déplacement est <strong className="text-rose-700">automatiquement annulé</strong> !
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 border border-sky-200">
                  <div className="font-bold text-sky-900 flex items-center gap-1">
                    <span>🤝</span> 3. Coalition Inter-Peuples
                  </div>
                  <p className="text-[#55645B] mt-0.5 leading-snug">
                    Pour empêcher une Machine de couper, il faut <strong className="text-[#16211B]">≥ 2 Peuples différents</strong> sur sa case. Deux pions du même joueur ne suffisent pas !
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plateau de jeu agrandi avec flèches d'intentions (Étape 2) et flèches de mouvements réalisés (Étapes 3 et 4) */}
          <PhysicalBoardV01
            etat={etapeCourante.etat}
            etatPrecedent={etapeCourante.etatPrecedent}
            pionSelectionneId={pionDemoFocusId}
            caseSelectionneeId={pionSelectionneObj?.caseId ?? null}
            casesSurligneesIds={casesSurligneesDemo}
            onSelectPion={(pid) =>
              setPionDemoFocusId((prev) => (prev === pid ? null : pid))
            }
            surlignerSommePiste={
              etapeCourante.etat.lancersSecretsDuTour[0]?.somme || null
            }
            surlignerEcartPiste={
              etapeCourante.etat.lancersSecretsDuTour[0]?.ecart ?? null
            }
          />

          {/* PLATEAUX INDIVIDUELS & CARTES ACTION ASSOCIÉES À CHAQUE DÉFENSEUR (Visible dans la Démo !) */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8DFD5] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#1E3528] text-white text-xs font-bold">
                    CARTES ACTION & ASSOCIATION AUX DÉFENSEURS
                  </span>
                  <h3 className="font-display text-base font-bold text-[#16211B]">
                    Comment les Cartes Action sont associées à chaque Pion Défenseur
                  </h3>
                </div>
                <p className="text-xs text-[#55645B] mt-1">
                  Chaque joueur possède <strong>{variante.defenseursParJoueur} pions Défenseurs numérotés</strong> (ex. <strong>MOI 1</strong> et <strong>MOI 2</strong>). Sur son plateau individuel, <strong>chaque Défenseur a sa propre ligne</strong> comportant 2 emplacements : <strong>Carte Action I</strong> (exécutée à l’Étape 3) et <strong>Carte Action II</strong> (exécutée à l’Étape 5). Cliquez sur un pion ci-dessous pour le mettre en focus sur le plateau !
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Plateau Individuel de MOI (6 colonnes) */}
              <div className="lg:col-span-6 rounded-xl border-2 border-[#256B45] bg-emerald-50/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#256B45] text-white text-xs font-extrabold">
                      MON PLATEAU INDIVIDUEL (MOI)
                    </span>
                    <span className="text-xs text-[#16211B] font-mono-tabular font-semibold">
                      🎲 Gobelet secret : [{etapesTourDemo[0].etat.lancersSecretsDuTour[0]?.d1},{' '}
                      {etapesTourDemo[0].etat.lancersSecretsDuTour[0]?.d2}]
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#256B45]">
                    {indexEtapeTour === 0
                      ? 'Cartes encore en main'
                      : indexEtapeTour === 1
                      ? 'Cartes posées (Étape 2)'
                      : indexEtapeTour === 2 || indexEtapeTour === 3
                      ? 'Action I exécutée ✓'
                      : 'Actions I & II exécutées ✓'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {etapeCourante.etat.defenseurs
                    .filter((d) => d.joueur === 0)
                    .map((pion) => {
                      const actsMoi = programmationsDemo[0] || [];
                      const act1 = actsMoi.find(
                        (a) => a.pionId === pion.id && a.etape === 1
                      );
                      const act2 = actsMoi.find(
                        (a) => a.pionId === pion.id && a.etape === 2
                      );
                      const estFocus = pionDemoFocusId === pion.id;
                      const posDepart =
                        etapesTourDemo[0].etat.defenseurs.find(
                          (d) => d.id === pion.id
                        )?.caseId ?? pion.caseId;

                      return (
                        <div
                          key={pion.id}
                          onClick={() => setPionDemoFocusId(pion.id)}
                          className={`p-3 rounded-lg bg-white border-2 transition-all cursor-pointer ${
                            estFocus
                              ? 'border-[#16211B] ring-2 ring-amber-400 shadow-xs'
                              : 'border-[#D8DFD5] hover:border-[#256B45]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#256B45] text-white font-mono-tabular text-xs font-extrabold border border-amber-300">
                                Pion MOI {pion.numeroPion}
                              </span>
                              <span className="text-xs text-[#55645B]">
                                Départ :{' '}
                                <strong className="text-[#16211B]">
                                  {etapeCourante.etat.cases[posDepart]?.nom}
                                </strong>
                                {pion.caseId !== posDepart && (
                                  <>
                                    {' '}
                                    ➔ Position actuelle :{' '}
                                    <strong className="text-[#256B45]">
                                      {etapeCourante.etat.cases[pion.caseId]?.nom}
                                    </strong>
                                  </>
                                )}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-[#256B45]">
                              {estFocus ? '★ En focus sur le plateau' : 'Cliquer pour focus'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                              { num: 1, act: act1, etapeExec: 2 },
                              { num: 2, act: act2, etapeExec: 4 },
                            ].map(({ num, act, etapeExec }) => {
                              if (!act) return null;
                              const st = styleCarteAction(act.type);
                              const dejaExecutee = indexEtapeTour >= etapeExec;
                              const enCoursExec = indexEtapeTour === etapeExec;
                              const pasEncorePosee = indexEtapeTour === 0;

                              return (
                                <div
                                  key={num}
                                  className={`p-2.5 rounded-lg border-2 flex flex-col justify-between ${
                                    pasEncorePosee
                                      ? 'bg-stone-100 border-dashed border-stone-300 opacity-75'
                                      : enCoursExec
                                      ? `${st.bg} border-[#16211B] ring-2 ring-amber-400`
                                      : `${st.bg} ${st.border}`
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-mono-tabular font-extrabold uppercase text-[#55645B]">
                                      EMPLACEMENT CARTE {num === 1 ? 'I' : 'II'}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                        pasEncorePosee
                                          ? 'bg-stone-200 text-stone-600'
                                          : enCoursExec
                                          ? 'bg-amber-400 text-[#16211B]'
                                          : dejaExecutee
                                          ? 'bg-emerald-700 text-white'
                                          : 'bg-white/90 text-[#16211B] border border-stone-300'
                                      }`}
                                    >
                                      {pasEncorePosee
                                        ? 'À poser (Étape 2)'
                                        : enCoursExec
                                        ? '⚡ EXÉCUTÉE ICI'
                                        : dejaExecutee
                                        ? '✓ Résolue'
                                        : 'Posée (Étape 2)'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 my-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-extrabold ${st.badgeBg}`}
                                    >
                                      {st.icone} {st.titre}
                                    </span>
                                    {act.caseCible !== null && (
                                      <span className="text-xs font-extrabold text-[#16211B]">
                                        ➔{' '}
                                        {
                                          etapeCourante.etat.cases[
                                            act.caseCible
                                          ]?.nom
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {act.explicationBot && (
                                    <div className="text-[11px] text-[#55645B] mt-1 leading-snug">
                                      {act.explicationBot}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Plateaux des Bots Alliés (6 colonnes) */}
              <div className="lg:col-span-6 rounded-xl border border-[#D8DFD5] bg-[#F4F5F0] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#16211B]">
                    Cartes Action posées par les Bots alliés (Déduction autour de la table)
                  </span>
                  <span className="text-[11px] text-[#55645B]">
                    Cliquez sur un allié pour voir ses pions sur le plateau
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.from(
                    { length: Math.max(0, variante.nbJoueurs - 1) },
                    (_, idx) => idx + 1
                  ).map((j) => {
                    const info = formaterNomSiege(j);
                    const actsJ = programmationsDemo[j] || [];
                    const pionsJ = etapeCourante.etat.defenseurs.filter(
                      (d) => d.joueur === j
                    );
                    const couleur =
                      COULEURS_PEUPLES_V01[j % COULEURS_PEUPLES_V01.length];

                    return (
                      <div
                        key={j}
                        className="p-2.5 rounded-lg bg-white border border-[#D8DFD5]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: couleur }}
                              className="px-2 py-0.5 rounded text-white font-mono-tabular text-xs font-bold"
                            >
                              {info.nomCourt}
                            </span>
                            <span className="text-[11px] text-[#55645B] font-mono-tabular">
                              {indexEtapeTour >= 3
                                ? `Dés révélés : [${etapesTourDemo[0].etat.lancersSecretsDuTour[j]?.d1}, ${etapesTourDemo[0].etat.lancersSecretsDuTour[j]?.d2}]`
                                : 'Gobelet 2D6 secret'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pionsJ.map((pion) => {
                            const a1 = actsJ.find(
                              (a) => a.pionId === pion.id && a.etape === 1
                            );
                            const a2 = actsJ.find(
                              (a) => a.pionId === pion.id && a.etape === 2
                            );
                            const estSel = pionDemoFocusId === pion.id;

                            return (
                              <div
                                key={pion.id}
                                onClick={() => setPionDemoFocusId(pion.id)}
                                className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                                  estSel
                                    ? 'bg-amber-50 border-[#16211B] ring-1 ring-amber-400'
                                    : 'bg-[#F4F5F0]/80 border-[#D8DFD5] hover:bg-white'
                                }`}
                              >
                                <div className="font-bold text-[#16211B] mb-1 flex items-center justify-between">
                                  <span>
                                    Pion {info.codePion}#{pion.numeroPion}
                                  </span>
                                  <span className="text-[10px] text-[#256B45]">
                                    sur {etapeCourante.etat.cases[pion.caseId]?.nom}
                                  </span>
                                </div>
                                <div className="space-y-0.5 text-[11px]">
                                  <div>
                                    <span className="font-mono-tabular font-bold text-[#55645B]">
                                      Carte I :
                                    </span>{' '}
                                    <strong className="text-[#16211B]">
                                      {a1 ? styleCarteAction(a1.type).icone : ''}{' '}
                                      {a1?.type || 'proteger'}
                                    </strong>
                                    {a1?.caseCible !== null &&
                                    a1?.caseCible !== undefined
                                      ? ` ➔ ${etapeCourante.etat.cases[a1.caseCible]?.nom}`
                                      : ''}
                                  </div>
                                  <div>
                                    <span className="font-mono-tabular font-bold text-[#55645B]">
                                      Carte II :
                                    </span>{' '}
                                    <strong className="text-[#16211B]">
                                      {a2 ? styleCarteAction(a2.type).icone : ''}{' '}
                                      {a2?.type || 'proteger'}
                                    </strong>
                                    {a2?.caseCible !== null &&
                                    a2?.caseCible !== undefined
                                      ? ` ➔ ${etapeCourante.etat.cases[a2.caseCible]?.nom}`
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOLET 2 : MISE EN PLACE INITIALE SUR TABLE */}
      {subTab === 'mise_en_place' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  Guide d’installation physique sur la table ({variante.nbJoueurs} joueurs)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Suivez ces 4 gestes dans l’ordre pour installer « {variante.nom} »
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setEtapeMiseEnPlace(step)}
                    className={`px-3 py-1 text-xs font-mono-tabular font-semibold rounded-md border transition-colors ${
                      etapeMiseEnPlace === step
                        ? 'bg-[#16211B] text-white border-[#16211B]'
                        : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
                    }`}
                  >
                    Geste {step + 1}/4
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                {
                  titre: '1. Déplier le Plateau & les Forêts',
                  texte: `Placez le Cœur au centre avec ${variante.foretsCoeur} pions Forêt en bois, et posez ${variante.foretsParCaseSecteur} pions Forêt sur chaque Clairière et Lisière.`,
                },
                {
                  titre: '2. Poser MOI, Bots & Machines',
                  texte: `Prenez vos ${variante.defenseursParJoueur} pions Défenseurs (MOI 1, MOI 2) et ceux des alliés sur les Clairières. Posez les Machines M0 à M${variante.machinesInitiales - 1} sur les Lisières.`,
                },
                {
                  titre: '3. Installer les 2 Pistes du Méchant',
                  texte:
                    'Alignez les 11 tuiles Tactiques sur les cases 2 à 12 et les 6 cartes Machines sur la Piste Machine ordonnée 1, 2, 3, 0, 4, 5.',
                },
                {
                  titre: '4. Distribuer Cartes & Gobelets 2D6',
                  texte:
                    'Remettez à chaque joueur son Plateau Individuel (Lignes Défenseur #1 et #2), ses Cartes Action (Se déplacer, Protéger, Saboter' +
                    (variante.actionReplanterActive ? ', Replanter' : '') +
                    ') et 1 gobelet 2D6.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setEtapeMiseEnPlace(idx)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    etapeMiseEnPlace === idx
                      ? 'bg-emerald-50/70 border-[#256B45]'
                      : 'bg-[#F4F5F0] border-[#D8DFD5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#16211B] mb-1">
                    {item.titre}
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {item.texte}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <PhysicalBoardV01 etat={etapesTourDemo[0].etat} />
        </div>
      )}

      {/* VOLET 3 : CONTENU DE LA BOÎTE DE JEU PHYSIQUE */}
      {subTab === 'boite' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                PLATEAU · {etapesTourDemo[0].etat.cases.length} ZONES
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Plateau Forestier ({variante.geometriePlateau || 'Modulaire'})
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Comprend le Cœur de la Forêt, les zones Intérieures de départ des Défenseurs et les Lisières d’entrée des Machines.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                RESSOURCE COMMUNE · {totalForetsBoite} ARBRES EN BOIS
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Pions Forêt ({variante.foretsCoeur} au Cœur, {variante.foretsParCaseSecteur}/case)
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Retirés un par un lorsqu’une Machine active n’est ni sabotée ni bloquée par un Bouclier en fin de tour.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-[#256B45] bg-emerald-50/40">
              <div className="text-xs font-mono-tabular text-[#256B45] font-bold mb-1">
                DÉFENSEURS & CARTES ACTION ({variante.nbJoueurs * variante.defenseursParJoueur} PIONS)
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Plateau Individuel à 2 Lignes & Cartes Action I / II
              </h3>
              <p className="text-xs text-[#16211B] leading-relaxed">
                Chaque joueur dispose de <strong>{variante.defenseursParJoueur} pions numérotés (#1 et #2)</strong> et d’un plateau personnel divisé en <strong>2 lignes</strong> (Ligne Défenseur #1 et Ligne Défenseur #2), chacune dotée de 2 emplacements : <strong>Action I</strong> et <strong>Action II</strong>.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                AUTOMATE · 6 FIGURINES M0 À M5
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Les 6 Machines ({variante.machinesInitiales} en Lisière, {6 - variante.machinesInitiales} au Chantier)
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Se déplacent au milieu du tour (Étape 4) et abattent les Forêts non protégées à l’Étape 6.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                DOUBLE PISTE PUBLIQUE DU MÉCHANT
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Piste Tactique (2–12) & Piste Machine (1, 2, 3, 0, 4, 5)
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                La Piste Machine est ordonnée de la plus forte probabilité (Écart 1 : 10/36) à la plus faible (Écart 5 : 2/36), avec l’Écart 0 (6/36) placé à côté du 3 (6/36).
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                DÉDUCTION SILENCIEUSE · {variante.nbJoueurs} GOBELETS 2D6
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                Lancers 2D6 Secrets sous Gobelet
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Chaque joueur observe secrètement une paire de 2D6 et déduit les menaces alliées en observant leurs flèches d’action.
              </p>
            </div>

            {versionSpec?.composantsBoite
              .filter((c) => c.nouveauteVersion)
              .map((comp) => (
                <div
                  key={comp.id}
                  className="bg-emerald-50/70 rounded-xl p-4 border-2 border-[#256B45]"
                >
                  <div className="text-xs font-mono-tabular text-[#256B45] font-bold uppercase mb-1">
                    {comp.categorie}
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                    {comp.nom}
                  </h3>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {comp.descriptionMat}
                  </p>
                </div>
              ))}
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
            <h3 className="font-display text-sm font-bold text-[#16211B] mb-2.5">
              Les 4 Cartes Tactiques de la Piste 2–12
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                Object.keys(NOMS_TACTIQUES) as (keyof typeof NOMS_TACTIQUES)[]
              ).map((t) => (
                <div
                  key={t}
                  className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]"
                >
                  <div className="font-semibold text-xs text-[#16211B] mb-1">
                    {NOMS_TACTIQUES[t]}
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {DESCRIPTIONS_PHYSIQUES_TACTIQUES[t]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
