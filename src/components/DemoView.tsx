import React, { useState, useMemo, useEffect } from 'react';
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
  estVarianteEpureeV05,
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

function styleCarteAction(
  type: ActionDefenseurType,
  estV04 = false,
  estV05 = false
): {
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
        titre: 'Se déplacer (1 case voisine)',
        bg: 'bg-emerald-50',
        border: 'border-emerald-400',
        badgeBg: 'bg-[#256B45] text-white',
      };
    case 'attendre':
      return {
        icone: estV05 ? '⏸' : estV04 ? '🛑' : '⏸',
        titre: estV05
          ? 'Rester sur place (Position de Parade)'
          : estV04
          ? 'Rester sur place (Barrage / Coalition)'
          : 'Rester sur place',
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

  const estV05 = estVarianteEpureeV05(variante);
  const estV04 = estVariantePlacementV04(variante);
  const estV05Lineaire =
    estV05 && variante.modeResolution === 'lineaire_2c_fin';

  const seuilParadeLabelCourt =
    variante.seuilParadeV05 === '2_peuples'
      ? 'Coalition ≥ 2 Peuples différents'
      : variante.seuilParadeV05 === 'gradue_1_bloque_2_chantier'
      ? 'Seuil Gradué (1 Déf. bloque / 2 Peuples → Chantier)'
      : '1 Défenseur suffit (Parade autonome)';

  const effetParadeLabelCourt =
    variante.seuilParadeV05 === 'gradue_1_bloque_2_chantier'
      ? 'Gradué : Sur place à 1 Déf., Chantier à ≥ 2 Peuples'
      : variante.effetParadeV05 === 'renvoyer_chantier'
      ? 'Machine parée renvoyée au Chantier'
      : 'Machine parée reste sur place en forêt';

  const [nbJoueursDemo, setNbJoueursDemo] = useState<3 | 4 | 5 | 6>(
    variante.nbJoueurs || 4
  );

  const varDemo = useMemo<VariantV01>(() => {
    return {
      ...variante,
      nbJoueurs: nbJoueursDemo,
      machinesInitiales:
        nbJoueursDemo === 3 ? 3 : variante.machinesInitiales || 4,
    };
  }, [variante, nbJoueursDemo]);

  useEffect(() => {
    setIndexEtapeTour(0);
  }, [variante.id, variante.modeResolution, nbJoueursDemo]);

  // Construire les étapes successives d'un tour de démonstration complet (5 étapes en V0.5 Linéaire 2C, 6 étapes sinon)
  const etapesTourDemo = useMemo(() => {
    const etats: {
      titre: string;
      resumeEssentiel: string;
      descriptionPedagogique: string;
      gestePhysique: string;
      etat: EtatJeuV01;
      etatPrecedent: EtatJeuV01 | null;
    }[] = [];

    // Étape 1 : Début du tour — Tirages secrets 2D6 sous les gobelets
    const e0 = creerEtatInitialV01(varDemo, 20261019);
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

    // Étape 2 : Programmation publique séquentielle
    const e1 = clonerEtatJeu(e0);
    for (let j = 0; j < varDemo.nbJoueurs; j++) {
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
            ? (estV05
                ? caseAvecMachine ?? caseCoeur ?? voisines[0]
                : estV04
                ? caseLibre ?? voisines[0]
                : caseAvecMachine ?? voisines[0]) ?? pion.caseId
            : (estV04
                ? caseAvecMachine ?? caseCoeur
                : caseCoeur ?? voisines[1]) ??
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
            explicationBot: estV05
              ? `Déplacement I : mouvement libre vers ${e1.cases[cibleDeplacement]?.nom} pour couvrir la trajectoire anticipée de son gobelet 2D6.`
              : estV04
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
          const act2Demo: ActionProgrammee = estV05
            ? {
                pionId: pion.id,
                etape: 2,
                type: 'attendre',
                caseCible: null,
                machineCible: null,
                explicationBot:
                  variante.seuilParadeV05 === '2_peuples'
                    ? `Déplacement II : reste sur ${e1.cases[cibleDeplacement]?.nom} pour former une Coalition (≥ 2 Peuples différents) et parer la coupe.`
                    : `Déplacement II : maintien sur ${e1.cases[cibleDeplacement]?.nom} pour parer la coupe (${seuilParadeLabelCourt}).`,
              }
            : estV04
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
      titre: estV05
        ? '2. Programmation publique des Déplacements (I & II) — Pur Placement V0.5'
        : estV04
        ? '2. Programmation publique des Déplacements (I & II) — Pur Placement V0.4'
        : '2. Programmation publique des Cartes Action (I & II) pour chaque Défenseur',
      resumeEssentiel: estV05
        ? `Chacun à son tour, vous annoncez publiquement les 2 déplacements (0 ou 1 case adjacente) de vos ${variante.defenseursParJoueur} Défenseurs. Zéro carte Action, zéro blocage de mouvement : la trajectoire choisie est votre seul signal de déduction !`
        : estV04
        ? 'Chacun à son tour, vous annoncez publiquement la destination de vos 2 Défenseurs (Déplacement I avant les Machines = Barrage ; Déplacement II après les Machines = Coalition). Aucune carte Action requise !'
        : 'Chacun à son tour, vous posez publiquement (face visible) vos cartes Action I et II devant chaque Défenseur pour permettre à vos coéquipiers de déduire votre gobelet 2D6.',
      descriptionPedagogique: estV05
        ? `Dans le Cœur Unifié V0.5, les Défenseurs ont pour unique action de se déplacer d’une case adjacente ou de rester sur place (Étape I puis Étape II). Aucun Mouvement Contrarié ni Barrage d’Entrée ne vient polluer vos intentions : en observant où vos alliés positionnent leurs pions, vous déduisez les menaces cachées sous leurs gobelets (${seuilParadeLabelCourt}).`
        : estV04
        ? 'En V0.4 (« Pur Placement & Coalition »), les Défenseurs ont pour unique action de se déplacer (ou rester sur place). En observant vers quelles cases vos coéquipiers dirigent leurs pions en Étape I (pour barrer l’entrée d’une Machine) et en Étape II (pour former une Coalition de 2 Peuples différents contre une Machine présente), vous déduisez les menaces cachées sous leurs gobelets !'
        : 'Chaque pion Défenseur (MOI 1, MOI 2...) possède sa propre ligne avec deux emplacements : « Carte Action I » et « Carte Action II ». Les cartes sont posées face visible à tour de rôle.',
      gestePhysique: estV04
        ? 'À tour de rôle et publiquement, indiquez la destination (Déplacement I puis Déplacement II) de chacun de vos 2 pions Défenseurs. Les flèches en pointillés sur le plateau montrent les trajets programmés !'
        : 'À tour de rôle, posez publiquement (face visible) vos 2 cartes sur la ligne du Défenseur #1 et vos 2 cartes sur la ligne du Défenseur #2.',
      etat: clonerEtatJeu(e1),
      etatPrecedent: clonerEtatJeu(e0Obs),
    });

    // Étape 3 : Résolution des 1res actions des Défenseurs
    const e1Pret = clonerEtatJeu(e1);
    e1Pret.sousPhase = 'resolution_actions_1';
    const e2 = avancerSousPhaseResolution(e1Pret);
    etats.push({
      titre: estV05
        ? '3. Exécution du Déplacement I des Défenseurs (Mouvement 100 % libre)'
        : estV04
        ? '3. Exécution du Déplacement I des Défenseurs (Formation des Barrages 🛑)'
        : '3. Exécution des 1res actions des Défenseurs (Cartes Action I)',
      resumeEssentiel: estV05
        ? 'Tous les Défenseurs exécutent leur Déplacement I librement le long des flèches vertes : aucune limite de capacité ni Mouvement Contrarié en V0.5 !'
        : estV04
        ? 'Vos Défenseurs effectuent leur 1er déplacement ! Toute case occupée par au moins 1 Défenseur devient un BARRAGE 🛑 : aucune Machine ne pourra y entrer à l’étape suivante.'
        : 'On applique la « Carte Action I » de chaque Défenseur : les pions se déplacent le long des flèches pleines vers leurs nouvelles zones !',
      descriptionPedagogique: estV05
        ? 'En V0.5, le Mouvement Contrarié (type Colt Express) est intégralement supprimé du cœur de règles : chaque Défenseur rejoint librement sa case voisine programmée en Étape I, ce qui prépare sa portée pour le Déplacement II.'
        : estV04
        ? 'C’est le 1er pilier de la V0.4 : il suffit d’UN SEUL Défenseur sur une case pour interdire à toute Machine d’y entrer lors du ciblage (Étape 4). Un joueur qui a lu son gobelet 2D6 peut donc bloquer seul l’arrivée de sa Machine en se plaçant sur sa case cible dès le Déplacement I !'
        : 'Toutes les cartes posées publiquement sur l’emplacement « Action I » s’activent : les flèches pleines sur le plateau montrent les déplacements réalisés.',
      gestePhysique: estV05
        ? 'Déplacez physiquement tous les pions Défenseurs sur le plateau selon leur Déplacement I.'
        : estV04
        ? 'Déplacez physiquement les pions Défenseurs sur le plateau selon leur Déplacement I. Chaque case occupée par au moins 1 Défenseur fait désormais barrage aux Machines.'
        : 'Appliquez la carte « Action I » de chacun de vos Défenseurs et déplacez physiquement les pions en bois sur le plateau.',
      etat: clonerEtatJeu(e2),
      etatPrecedent: clonerEtatJeu(e1),
    });

    // CAS A : V0.5 CURSEUR 1 CHOIX B — LINÉAIRE 2C (5 ÉTAPES AU TOTAL)
    if (estV05Lineaire) {
      // Étape 4 (sur 5) : Exécution immédiate du Déplacement II avant toute révélation des gobelets !
      const e3Lin = avancerSousPhaseResolution(e2);
      etats.push({
        titre:
          '4. Exécution du Déplacement II (Positionnement final avant Révélation 2D6)',
        resumeEssentiel: `Vos Défenseurs effectuent immédiatement leur 2e déplacement et prennent leur position finale de Parade (${seuilParadeLabelCourt}) avant que les gobelets 2D6 ne soient soulevés !`,
        descriptionPedagogique:
          'En V0.5 Curseur 1 Choix B (Option 2C Linéaire), les deux étapes de déplacement des Défenseurs s’enchaînent fluidement avant l’activation des Machines. Toute la tension repose sur l’anticipation de la case finale où atterrira chaque Machine lors de la levée des gobelets.',
        gestePhysique:
          'Déplacez physiquement tous les pions Défenseurs selon leur Déplacement II. Les positions des Défenseurs sur le plateau sont désormais définitives pour ce tour.',
        etat: clonerEtatJeu(e3Lin),
        etatPrecedent: clonerEtatJeu(e2),
      });

      // Étape 5 (sur 5) : Révélation Gobelet par Gobelet (Déplacement Machine + Verdict Coupe + Apprentissage)
      const e4Lin = avancerSousPhaseResolution(e3Lin);
      etats.push({
        titre:
          '5. Révélation 2D6 Gobelet par Gobelet : Déplacement Machine, Verdict Coupe & Pistes',
        resumeEssentiel: `On soulève les gobelets 2D6 un par un : chaque Machine rejoint librement sa cible (sans barrage d’entrée). Si le seuil (${seuilParadeLabelCourt}) est atteint sur la case, la coupe est parée (${effetParadeLabelCourt}) ; sinon 1 Forêt est abattue 🪓 !`,
        descriptionPedagogique: `En Option 2C Linéaire, la fin de tour se résout gobelet par gobelet dans l’ordre du tour : (1) on lit la Somme (Tactique) et l’Écart (Machine), (2) la Machine se déplace librement vers sa case cible, (3) on vérifie immédiatement le Seuil de Parade (${seuilParadeLabelCourt}) et le Sort de la Machine (${effetParadeLabelCourt}), puis (4) la Tête du Méchant permute ses pistes d’apprentissage.`,
        gestePhysique:
          'Soulevez chaque gobelet 2D6 l’un après l’autre : déplacez la Machine désignée vers sa cible, appliquez immédiatement la Parade ou retirez 1 pion Forêt en bois, puis mettez à jour la Piste Tactique (vers 7 ou vers 2/12) et la Piste Machine (vers 1 ou vers 5).',
        etat: clonerEtatJeu(e4Lin),
        etatPrecedent: clonerEtatJeu(e3Lin),
      });

      return etats;
    }

    // CAS B : SÉQUENCEMENT ENTRELACÉ EN 6 ÉTAPES (V0.5 Option 2A/2B, V0.4, ou V0.1–V0.3)
    const e3 = avancerSousPhaseResolution(e2);
    etats.push({
      titre: estV05
        ? '4. Révélation 2D6 & Entrée libre des Machines (Sans Barrage d’Entrée en V0.5)'
        : estV04
        ? '4. Révélation 2D6 & Déplacement des Machines (Bloquées par vos Barrages 🛑)'
        : '4. Ciblage & Déplacement des Machines (sans couper d’arbre)',
      resumeEssentiel: estV05
        ? 'Les gobelets 2D6 sont levés ! En V0.5 Épurée, il n’y a AUCUN Barrage d’Entrée : les Machines entrent librement sur leur case cible (sans couper d’arbre pour l’instant).'
        : estV04
        ? 'Les gobelets 2D6 sont levés ! Les Machines tentent de rejoindre leur cible, mais toute case occupée par au moins 1 Défenseur leur est interdite (déplacement annulé ou dévié selon la variante).'
        : 'Les gobelets 2D6 sont levés ! Les flèches oranges 🎯 montrent le déplacement des Machines vers leurs cibles selon les pistes (elles ne coupent pas encore).',
      descriptionPedagogique: estV05
        ? 'En V0.5 Curseur 1 Choix A (Entrelacé 2A/2B), la règle de Barrage d’Entrée de la V0.4 est supprimée : même si un Défenseur se trouve déjà sur la case, la Machine désignée par l’Écart applique sa Tactique et entre librement sur sa case cible. La confrontation aura lieu à l’Étape 6 après le Déplacement II !'
        : estV04
        ? 'Tous les gobelets 2D6 sont soulevés. Pour chaque paire de dés, la Machine désignée par l’Écart applique la Tactique désignée par la Somme. Si sa case cible contient au moins 1 Défenseur (Barrage 🛑), la Machine ne peut pas y entrer ! Si la case cible est libre, la Machine s’y déplace (sans couper d’arbre pour l’instant).'
        : 'Tous les gobelets 2D6 sont soulevés ! Pour chaque paire de dés, la Machine désignée par l’Écart applique la Tactique désignée par la Somme et se déplace sur sa zone cible.',
      gestePhysique: estV05
        ? 'Soulevez tous les gobelets 2D6 et déplacez librement chaque Machine activée vers la case désignée par sa Tactique (aucune coupe n’a lieu à cette étape).'
        : estV04
        ? 'Soulevez les gobelets 2D6. Pour chaque lancer, vérifiez si la case cible est libre de tout Défenseur : si oui, déplacez-y la Machine ; si au moins 1 Défenseur s’y trouve, son entrée est bloquée !'
        : 'Soulevez les gobelets 2D6. Déplacez chaque figurine Machine (M0 à M5) vers la zone désignée par sa carte Tactique.',
      etat: clonerEtatJeu(e3),
      etatPrecedent: clonerEtatJeu(e2),
    });

    // Étape 5 : Résolution des 2es actions des Défenseurs
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
      titre: estV05
        ? `5. Exécution du Déplacement II (Convergence pour atteindre le Seuil : ${seuilParadeLabelCourt})`
        : estV04
        ? '5. Exécution du Déplacement II (Formation des Coalitions Inter-Peuples 🤝)'
        : '5. Exécution des 2es actions des Défenseurs (Cartes Action II)',
      resumeEssentiel: estV05
        ? `Vos Défenseurs exécutent leur 2e déplacement libre pour converger sur les cases occupées par les Machines et atteindre le seuil de Parade (${seuilParadeLabelCourt}).`
        : estV04
        ? 'Vos Défenseurs effectuent leur 2e déplacement ! Pour empêcher une Machine présente sur une case de couper une forêt, il faut réunir au moins 2 Défenseurs de PEUPLES DIFFÉRENTS 🤝 sur sa case.'
        : 'On applique la « Carte Action II » de chaque Défenseur : MOI 1 sabote ⚡ la Machine M0 et MOI 2 lève son bouclier 🛡️ PROTÉGÉ sur le Cœur !',
      descriptionPedagogique: estV05
        ? `Grâce au Déplacement I effectué à l’Étape 3, vos Défenseurs sont à portée pour rejoindre en Étape II les zones où les Machines viennent d’entrer. Selon le Curseur 2 actif (${seuilParadeLabelCourt}), votre présence finale sur la case permettra de parer la coupe à l’Étape 6.`
        : estV04
        ? 'C’est le 2e pilier de la V0.4 : une fois qu’une Machine est sur une case (parce qu’elle y était déjà ou vient d’entrer sur une case libre), un joueur seul ne peut pas l’arrêter (même avec ses 2 pions du même Peuple). Il faut impérativement une COALITION d’au moins 2 Défenseurs de Peuples (joueurs) différents sur la case !'
        : 'Les cartes de l’emplacement « Action II » s’activent : les Défenseurs activent leur posture Bouclier (🛡️ PROTÉGÉ) ou sabotent (⚡) les Machines présentes sur leur zone.',
      gestePhysique: estV05
        ? `Effectuez librement le Déplacement II de chaque pion Défenseur pour couvrir les cases où se trouvent les Machines (${seuilParadeLabelCourt}).`
        : estV04
        ? 'Effectuez le Déplacement II des pions Défenseurs afin de converger à deux Peuples différents sur les cases occupées par des Machines.'
        : 'Appliquez toutes les cartes « Action II », couchez en posture Bouclier les Défenseurs qui protègent, et renvoyez au Chantier les Machines sabotées.',
      etat: clonerEtatJeu(e4),
      etatPrecedent: clonerEtatJeu(e3),
    });

    // Étape 6 : Coupe des Forêts après les 2es actions & Apprentissage sur les 2 pistes
    let e5 = clonerEtatJeu(e4);
    if (e5.sousPhase === 'resolution_coupe_et_apprentissage') {
      e5 = avancerSousPhaseResolution(e5);
    }
    etats.push({
      titre: estV05
        ? '6. Verdict de Coupe (Curseurs 2 & 3) & Apprentissage statistique du Méchant'
        : '6. Coupe des Forêts & Apprentissage statistique du Méchant',
      resumeEssentiel: estV05
        ? `Verdict sur chaque case occupée par une Machine : si le seuil (${seuilParadeLabelCourt}) est atteint, la coupe est parée (${effetParadeLabelCourt}) ! Sinon, 1 Forêt est abattue 🪓 et la Tête du Méchant apprend.`
        : estV04
        ? 'Toute Machine sur une case contenant 2 Défenseurs de Peuples différents 🤝 est bloquée ! Les autres abattent 1 Forêt 🪓, puis le Méchant apprend sur ses 2 pistes.'
        : 'Chaque Machine non contrée abat 1 Forêt 🪓. Puis le Méchant apprend : succès → glisse vers 7 (Tactique) et vers 1 (Piste Machine 1–2–3–0–4–5).',
      descriptionPedagogique: estV05
        ? `Pour chaque Machine sur le plateau : si la condition du Curseur 2 (${seuilParadeLabelCourt}) est remplie, la coupe est bloquée, on applique le Curseur 3 (${effetParadeLabelCourt}), et la Machine recule vers l’Écart 5 sur la Piste Machine. Sinon, elle abat 1 pion Forêt en bois et progresse vers la Somme 7 et l’Écart 1.`
        : estV04
        ? 'Pour chaque Machine sur le plateau : si au moins 2 Défenseurs de Peuples différents occupent sa case (Coalition 🤝), la coupe est bloquée (et la Machine recule sur la Piste Machine vers 5). Sinon, elle abat 1 pion Forêt en bois et progresse vers les tirages les plus probables (Somme 7 et Écart 1).'
        : 'Toute Machine non sabotée se trouvant sur une zone non protégée abat 1 pion Forêt en bois. Ensuite, le Méchant apprend sur ses deux pistes publiques.',
      gestePhysique: estV05
        ? `Vérifiez chaque Machine selon le Curseur 2 (${seuilParadeLabelCourt}) : si la case est parée, appliquez le Curseur 3 (${effetParadeLabelCourt}) ; sinon, retirez 1 pion Forêt en bois. Mettez ensuite à jour les deux pistes du Méchant.`
        : estV04
        ? 'Vérifiez chaque Machine : s’il y a 2 Défenseurs de couleurs différentes sur sa case, la forêt est sauvée ! Sinon, retirez 1 pion Forêt en bois. Mettez ensuite à jour les deux pistes du Méchant.'
        : 'Retirez 1 pion Forêt en bois pour chaque Machine non contrée. Puis permutez d’un cran sur la Piste Tactique et sur la Piste Machine.',
      etat: clonerEtatJeu(e5),
      etatPrecedent: clonerEtatJeu(e4),
    });

    return etats;
  }, [
    varDemo,
    estV04,
    estV05,
    estV05Lineaire,
    seuilParadeLabelCourt,
    effetParadeLabelCourt,
  ]);

  const nbSecteursFixes = nbJoueursDemo <= 4 ? 4 : 6;
  const totalForetsBoite =
    variante.foretsCoeur +
    nbSecteursFixes * 2 * variante.foretsParCaseSecteur;

  const etapeCourante =
    etapesTourDemo[Math.min(indexEtapeTour, etapesTourDemo.length - 1)];

  // État des programmations à afficher sur les plateaux individuels (à partir de l'étape 2, on affiche les ordres de e1)
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
      {/* Barre supérieure de la Démo avec sélecteur de table 3 à 6 joueurs */}
      <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8DFD5] pb-2.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold text-[#16211B]">
                Démo Interactive — « {variante.nom} » (V{variante.version})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                Table Démo : {nbJoueursDemo} Joueurs · Face {nbJoueursDemo <= 4 ? 'Recto (9 zones, 38 forêts)' : 'Verso (13 zones, 54 forêts)'}
              </span>
            </div>
            <p className="text-xs text-[#55645B]">
              Jeu universel 3 à 6 joueurs · Table actuelle : {nbJoueursDemo} joueurs (MOI + {nbJoueursDemo - 1} Bots alliés) ·{' '}
              {totalForetsBoite} Forêts en bois
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5] text-xs">
            <span className="px-1.5 font-bold text-[#16211B]">Configuration de table :</span>
            {([3, 4, 5, 6] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNbJoueursDemo(n)}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  nbJoueursDemo === n
                    ? 'bg-[#256B45] text-white shadow-xs'
                    : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-stone-100'
                }`}
                title={`Démonstration à ${n} joueurs`}
              >
                {n} Joueurs {n === 4 ? '★' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
            <button
              onClick={() => setSubTab('tour_guide')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'tour_guide'
                  ? 'bg-[#256B45] text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              ▶ Tour guidé en {etapesTourDemo.length} étapes
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
              {estV04 ? `Matériel & Boîte V${variante.version}` : 'Matériel & Cartes Action'}
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
          {/* Frise visuelle interactive des étapes du tour */}
          <TurnPhaseStepper
            sousPhase={etapeCourante.etat.sousPhase}
            tourActuel={1}
            nbTours={variante.nbTours}
            variante={variante}
            indexEtapeForce={indexEtapeTour}
            onSelectEtape={(idx) => setIndexEtapeTour(idx)}
          />

          {/* Bandeau synthétique de l'étape en cours + Navigation rapide + Détails optionnels */}
          <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-mono-tabular font-bold rounded bg-emerald-100 text-[#165B36]">
                    ÉTAPE {indexEtapeTour + 1} / {etapesTourDemo.length}
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

          {/* Encart spécifique V0.5 : Cœur Unifié Pur Placement sans Barrage d'Entrée & 3 Curseurs */}
          {estV05 ? (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/60 rounded-xl p-3.5 border-2 border-[#256B45] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#165B36] flex items-center gap-1.5">
                  <span>✨</span> Cœur Unifié V0.5 — Pur Placement Épuré (Zéro Barrage d’Entrée · Zéro Mouvement Contrarié) & 3 Curseurs Actifs
                </span>
                <span className="text-[11px] font-mono-tabular font-bold px-2.5 py-0.5 rounded bg-[#1E3528] text-white">
                  RÈGLES OFFICIELLES V0.5
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white/95 border border-emerald-300">
                  <div className="font-bold text-[#16211B] flex items-center justify-between gap-1">
                    <span>🎯 Curseur 1 — Timing Machines</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-[#165B36]">
                      {estV05Lineaire ? 'Choix B (2C Linéaire)' : 'Choix A (Entrelacé)'}
                    </span>
                  </div>
                  <p className="text-[#55645B] mt-1 leading-snug">
                    {estV05Lineaire ? (
                      <>
                        <strong className="text-[#16211B]">Fin de tour (5 étapes) :</strong>{' '}
                        Dépl. I → Dépl. II → Révélation 2D6 gobelet par gobelet (Dépl. Machine + Verdict Coupe + Pistes).
                      </>
                    ) : (
                      <>
                        <strong className="text-[#16211B]">Entrelacé mi-tour (6 étapes) :</strong>{' '}
                        Dépl. I → Entrée libre des Machines (sans barrage) → Dépl. II → Verdict Coupe & Pistes.
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/95 border border-teal-300">
                  <div className="font-bold text-[#16211B] flex items-center justify-between gap-1">
                    <span>🛡️ Curseur 2 — Seuil de Parade</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-900">
                      {variante.seuilParadeV05 === '2_peuples'
                        ? 'Choix B (≥ 2 Peuples)'
                        : variante.seuilParadeV05 === 'gradue_1_bloque_2_chantier'
                        ? 'Choix C (Gradué 1/2)'
                        : 'Choix A (≥ 1 Défenseur)'}
                    </span>
                  </div>
                  <p className="text-[#55645B] mt-1 leading-snug">
                    <strong className="text-[#16211B]">{seuilParadeLabelCourt} :</strong>{' '}
                    {variante.seuilParadeV05 === '2_peuples'
                      ? 'Exige au moins 2 Défenseurs de Peuples (joueurs) différents sur la case de la Machine pour bloquer la coupe.'
                      : variante.seuilParadeV05 === 'gradue_1_bloque_2_chantier'
                      ? '1 Défenseur suffit à bloquer la coupe (Machine sur place) ; ≥ 2 Peuples différents la renvoient au Chantier.'
                      : 'La présence d’au moins 1 Défenseur sur la case de la Machine au moment de la coupe suffit à protéger la Forêt.'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/95 border border-amber-300">
                  <div className="font-bold text-[#16211B] flex items-center justify-between gap-1">
                    <span>⚙️ Curseur 3 — Sort de la Machine</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      {variante.seuilParadeV05 === 'gradue_1_bloque_2_chantier'
                        ? 'Couplé au Curseur 2'
                        : variante.effetParadeV05 === 'renvoyer_chantier'
                        ? 'Choix B (Chantier)'
                        : 'Choix A (Sur place)'}
                    </span>
                  </div>
                  <p className="text-[#55645B] mt-1 leading-snug">
                    <strong className="text-[#16211B]">{effetParadeLabelCourt} :</strong>{' '}
                    dans tous les cas, une Machine dont la coupe est parée recule d’un cran vers l’Écart 5 (2/36) sur la Piste Machine.
                  </p>
                </div>
              </div>
            </div>
          ) : estV04 ? (
            /* Encart spécifique V0.4 : Les 3 Règles d'Or du Pur Placement & Résolution V0.4 */
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-xl p-3.5 border border-emerald-300 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#165B36] flex items-center gap-1.5">
                  <span>🌲</span> Noyau V0.4 (Archive) — Règles de Résolution Spatiale & Risque Opérationnel
                </span>
                <span className="text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-[#165B36]">
                  RÈGLES ARCHIVE V0.4
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
          ) : null}

          {/* Plateau de jeu agrandi avec flèches d'intentions (Étape 2) et flèches de mouvements réalisés */}
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

          {/* PLATEAUX INDIVIDUELS & PROGRAMMATION ASSOCIÉE À CHAQUE DÉFENSEUR */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8DFD5] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#1E3528] text-white text-xs font-bold">
                    {estV04
                      ? `PUR PLACEMENT V${variante.version} — DÉPLACEMENTS I & II`
                      : 'CARTES ACTION & ASSOCIATION AUX DÉFENSEURS'}
                  </span>
                  <h3 className="font-display text-base font-bold text-[#16211B]">
                    {estV04
                      ? 'Comment les 2 Déplacements (Étape I & Étape II) sont programmés pour chaque Pion Défenseur'
                      : 'Comment les Cartes Action sont associées à chaque Pion Défenseur'}
                  </h3>
                </div>
                <p className="text-xs text-[#55645B] mt-1">
                  {estV05 ? (
                    <>
                      Chaque joueur possède <strong>{variante.defenseursParJoueur} pions Défenseurs numérotés</strong> (ex. <strong>MOI 1</strong> et <strong>MOI 2</strong>) et programme publiquement 2 étapes de déplacement (0 ou 1 case adjacente) : <strong>Déplacement I</strong> (exécuté à l’Étape 3) et <strong>Déplacement II</strong> (exécuté à l’Étape {estV05Lineaire ? '4' : '5'}). Aucune carte Action n’est utilisée ! Cliquez sur un pion ci-dessous pour le mettre en focus sur le plateau.
                    </>
                  ) : estV04 ? (
                    <>
                      Chaque joueur possède <strong>{variante.defenseursParJoueur} pions Défenseurs numérotés</strong> (ex. <strong>MOI 1</strong> et <strong>MOI 2</strong>) et programme publiquement <strong>Déplacement I</strong> (exécuté à l’Étape 3 pour former un Barrage) et <strong>Déplacement II</strong> (exécuté à l’Étape 5 pour former une Coalition). Cliquez sur un pion ci-dessous pour le mettre en focus sur le plateau !
                    </>
                  ) : (
                    <>
                      Chaque joueur possède <strong>{variante.defenseursParJoueur} pions Défenseurs numérotés</strong> (ex. <strong>MOI 1</strong> et <strong>MOI 2</strong>). Sur son plateau individuel, <strong>chaque Défenseur a sa propre ligne</strong> comportant 2 emplacements : <strong>Carte Action I</strong> (exécutée à l’Étape 3) et <strong>Carte Action II</strong> (exécutée à l’Étape 5). Cliquez sur un pion ci-dessous pour le mettre en focus sur le plateau !
                    </>
                  )}
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
                      ? estV04
                        ? 'Ordres à annoncer (Étape 2)'
                        : 'Cartes encore en main'
                      : indexEtapeTour === 1
                      ? estV04
                        ? 'Déplacements I & II programmés'
                        : 'Cartes posées (Étape 2)'
                      : indexEtapeTour === 2 || (!estV05Lineaire && indexEtapeTour === 3)
                      ? estV04
                        ? 'Déplacement I exécuté ✓'
                        : 'Action I exécutée ✓'
                      : estV04
                      ? 'Déplacements I & II exécutés ✓'
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
                              {
                                num: 2,
                                act: act2,
                                etapeExec: estV05Lineaire ? 3 : 4,
                              },
                            ].map(({ num, act, etapeExec }) => {
                              if (!act) return null;
                              const st = styleCarteAction(
                                act.type,
                                estV04,
                                estV05
                              );
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
                                      {estV04
                                        ? `ORDRE DE DÉPLACEMENT ${num === 1 ? 'I' : 'II'}`
                                        : `EMPLACEMENT CARTE ${num === 1 ? 'I' : 'II'}`}
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
                                        ? 'À programmer (Étape 2)'
                                        : enCoursExec
                                        ? '⚡ EXÉCUTÉ ICI'
                                        : dejaExecutee
                                        ? '✓ Résolu'
                                        : 'Programmé (Étape 2)'}
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
                    {estV04
                      ? 'Déplacements I & II programmés par les Bots alliés (Déduction autour de la table)'
                      : 'Cartes Action posées par les Bots alliés (Déduction autour de la table)'}
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
                              {indexEtapeTour >= (estV05Lineaire ? 4 : 3)
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
                                      {estV04 ? 'Dépl. I :' : 'Carte I :'}
                                    </span>{' '}
                                    <strong className="text-[#16211B]">
                                      {a1
                                        ? styleCarteAction(a1.type, estV04, estV05)
                                            .icone
                                        : ''}{' '}
                                      {a1?.type === 'attendre'
                                        ? 'Sur place'
                                        : a1?.type === 'deplacer'
                                        ? 'Déplacer'
                                        : a1?.type || 'Sur place'}
                                    </strong>
                                    {a1?.caseCible !== null &&
                                    a1?.caseCible !== undefined
                                      ? ` ➔ ${etapeCourante.etat.cases[a1.caseCible]?.nom}`
                                      : ''}
                                  </div>
                                  <div>
                                    <span className="font-mono-tabular font-bold text-[#55645B]">
                                      {estV04 ? 'Dépl. II :' : 'Carte II :'}
                                    </span>{' '}
                                    <strong className="text-[#16211B]">
                                      {a2
                                        ? styleCarteAction(a2.type, estV04, estV05)
                                            .icone
                                        : ''}{' '}
                                      {a2?.type === 'attendre'
                                        ? 'Sur place'
                                        : a2?.type === 'deplacer'
                                        ? 'Déplacer'
                                        : a2?.type || 'Sur place'}
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
                  titre: estV04
                    ? '4. Distribuer Pions Défenseurs & Gobelets 2D6'
                    : '4. Distribuer Cartes & Gobelets 2D6',
                  texte: estV04
                    ? `Remettez à chaque joueur ses ${variante.defenseursParJoueur} pions Défenseurs à sa couleur, son aide-mémoire Pur Placement (Déplacements I & II sans Cartes Action) et 1 gobelet opaque avec 2D6.`
                    : 'Remettez à chaque joueur son Plateau Individuel (Lignes Défenseur #1 et #2), ses Cartes Action (Se déplacer, Protéger, Saboter' +
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
                Retirés un par un lorsqu’une Machine active n’est pas parée sur sa case au moment du verdict de coupe.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-[#256B45] bg-emerald-50/40">
              <div className="text-xs font-mono-tabular text-[#256B45] font-bold mb-1">
                {estV04
                  ? `DÉFENSEURS PUR PLACEMENT (${variante.nbJoueurs * variante.defenseursParJoueur} PIONS — ZÉRO CARTE ACTION)`
                  : `DÉFENSEURS & CARTES ACTION (${variante.nbJoueurs * variante.defenseursParJoueur} PIONS)`}
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                {estV04
                  ? 'Pions Défenseurs & Réglette Individuelle Déplacement I / II'
                  : 'Plateau Individuel à 2 Lignes & Cartes Action I / II'}
              </h3>
              <p className="text-xs text-[#16211B] leading-relaxed">
                {estV04 ? (
                  <>
                    Chaque joueur dispose de <strong>{variante.defenseursParJoueur} pions numérotés (#1 et #2)</strong> qui agissent exclusivement par leur positionnement sur le plateau (Déplacement I puis Déplacement II de 0 ou 1 case adjacente), sans aucune carte Action.
                  </>
                ) : (
                  <>
                    Chaque joueur dispose de <strong>{variante.defenseursParJoueur} pions numérotés (#1 et #2)</strong> et d’un plateau personnel divisé en <strong>2 lignes</strong> (Ligne Défenseur #1 et Ligne Défenseur #2), chacune dotée de 2 emplacements : <strong>Action I</strong> et <strong>Action II</strong>.
                  </>
                )}
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
                {estV05Lineaire
                  ? 'S’activent gobelet par gobelet en fin de tour (Étape 5) : déplacement libre vers la cible puis verdict immédiat de coupe.'
                  : 'Se déplacent au milieu du tour (Étape 4) et abattent les Forêts non parées à l’Étape 6.'}
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
