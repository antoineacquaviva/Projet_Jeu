import React, { useState, useMemo } from 'react';
import { EtatJeuV01, GameVersionSpec, VariantV01 } from '../shared/types';
import {
  avancerSousPhaseResolution,
  clonerEtatJeu,
  creerEtatInitialV01,
  DESCRIPTIONS_PHYSIQUES_TACTIQUES,
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

export const DemoView: React.FC<DemoViewProps> = ({
  variante,
  versionSpec,
  onOpenInProto,
}) => {
  const [subTab, setSubTab] = useState<DemoSubTab>('tour_guide');
  const [etapeMiseEnPlace, setEtapeMiseEnPlace] = useState<number>(0);
  const [indexEtapeTour, setIndexEtapeTour] = useState<number>(0);
  const [afficherDetailsPedagogiques, setAfficherDetailsPedagogiques] =
    useState<boolean>(false);

  // Construire les 6 états successifs d'un tour de démonstration complet pour la variante active
  const etapesTourDemo = useMemo(() => {
    const etats: {
      titre: string;
      resumeEssentiel: string;
      descriptionPedagogique: string;
      gestePhysique: string;
      etat: EtatJeuV01;
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
    });

    // Étape 1 : Programmation séquentielle et déduction autour de la table
    const e1 = clonerEtatJeu(e0);
    for (let j = 0; j < variante.nbJoueurs; j++) {
      const prog = calculerProgrammationBot(e1, j, 'deductif');
      e1.programmations[j] = prog.actions;
      e1.etatRng = prog.nextRngState;
    }
    e1.sousPhase = 'programmation_1';
    etats.push({
      titre: '2. Programmation séquentielle (MOI puis les Bots alliés)',
      resumeEssentiel:
        'Chacun pose ses cartes Action I et II à tour de rôle. Les flèches sur le plateau montrent où MOI et les Bots alliés dirigent leurs Défenseurs.',
      descriptionPedagogique:
        'Dans le sens horaire, MOI pose ses cartes Action I et Action II, suivi par les Bots alliés (Bot Déd., Bot Bayes, Bot Beam...). Chaque allié voit vers quelle zone les joueurs précédents engagent leurs pions, en déduit que cette menace est couverte, et oriente ses pions vers la menace de son propre gobelet.',
      gestePhysique:
        'Chaque joueur, à son tour de table, pose ses cartes sur ses emplacements « Action I » et « Action II » devant son plateau Peuple.',
      etat: clonerEtatJeu(e1),
    });

    // Étape 2 : Résolution des 1res actions des Défenseurs
    const e1Pret = clonerEtatJeu(e1);
    e1Pret.sousPhase = 'resolution_actions_1';
    const e2 = avancerSousPhaseResolution(e1Pret);
    etats.push({
      titre: '3. Exécution des 1res actions des Défenseurs (Action I)',
      resumeEssentiel:
        'Les cartes Action I sont résolues : les Défenseurs se déplacent vers les zones menacées, lèvent leur bouclier 🛡️ ou sabotent ⚡ une Machine présente.',
      descriptionPedagogique:
        'On retourne les cartes de l’emplacement Action I : les Défenseurs se déplacent vers les tuiles menacées, lèvent leurs boucliers ou sabotent les Machines déjà présentes à portée.',
      gestePhysique:
        'Retournez toutes les cartes « Action I » et déplacez physiquement les pions Défenseurs en bois sur les tuiles correspondantes.',
      etat: clonerEtatJeu(e2),
    });

    // Étape 3 : Révélation des gobelets 2D6 & Ciblage des Machines au milieu (sans coupe !)
    const e3 = avancerSousPhaseResolution(e2);
    etats.push({
      titre: '4. Ciblage & Déplacement des Machines (sans couper d’arbre)',
      resumeEssentiel:
        'Les gobelets 2D6 sont levés ! Chaque Machine désignée par l’Écart rejoint sa zone cible selon sa Tactique (cercles rouges 🎯), mais ne coupe pas encore.',
      descriptionPedagogique:
        'Tous les gobelets 2D6 sont soulevés ! Pour chaque paire de dés, la Machine désignée par l’Écart applique la Tactique désignée par la Somme et se déplace sur sa tuile cible. Elle annonce sa coupe, mais n’abat encore aucun arbre.',
      gestePhysique:
        'Soulevez les gobelets 2D6. Déplacez chaque figurine Machine (M0 à M5) vers la tuile désignée par sa carte Tactique. Ne touchez pas encore aux pions Forêt en bois !',
      etat: clonerEtatJeu(e3),
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
      titre: '5. Exécution des 2es actions des Défenseurs (Action II)',
      resumeEssentiel:
        'Les cartes Action II sont résolues : les Défenseurs activent leur protection 🛡️ PROTÉGÉ ou sabotent ⚡ les Machines qui viennent d’atterrir.',
      descriptionPedagogique:
        'On retourne les cartes de l’emplacement Action II : les Défenseurs finalisent leur protection ou sabotent les Machines qui viennent d’atterrir sur leur tuile avant qu’elles ne puissent couper.',
      gestePhysique:
        'Retournez toutes les cartes « Action II », couchez en posture Bouclier les Défenseurs qui protègent, et renvoyez au Chantier les Machines sabotées.',
      etat: clonerEtatJeu(e4),
    });

    // Étape 5 : Coupe des Forêts après les 2es actions & Apprentissage sur les 2 pistes
    let e5 = clonerEtatJeu(e4);
    if (e5.sousPhase === 'resolution_coupe_et_apprentissage') {
      e5 = avancerSousPhaseResolution(e5);
    }
    etats.push({
      titre: '6. Coupe des Forêts & Apprentissage statistique du Méchant',
      resumeEssentiel:
        'Chaque Machine non contrée abat 1 Forêt 🪓. Puis le Méchant apprend : succès → glisse vers 7 (Tactique) et vers 1 (Piste Machine 1–2–3–0–4–5).',
      descriptionPedagogique:
        'Toute Machine non sabotée se trouvant sur une tuile non protégée abat 1 pion Forêt en bois. Ensuite, le Méchant apprend sur ses deux pistes publiques : les Tactiques et Machines ayant réussi à couper glissent vers les valeurs les plus probables (Somme 7, et vers la gauche de la Piste Machine 1, 2, 3, 0, 4, 5).',
      gestePhysique:
        'Retirez 1 pion Forêt en bois pour chaque Machine non contrée. Puis permutez d’un cran sur la Piste Tactique (vers 7 en cas de coupe) et sur la Piste Machine (vers la gauche en direction du 1 en cas de coupe, ou vers la droite en direction du 5 en cas de parade).',
      etat: clonerEtatJeu(e5),
    });

    return etats;
  }, [variante]);

  const totalForetsBoite =
    variante.foretsCoeur +
    variante.nbJoueurs * 2 * variante.foretsParCaseSecteur;

  const etapeCourante =
    etapesTourDemo[Math.min(indexEtapeTour, etapesTourDemo.length - 1)];

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
              Matériel de la boîte
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

      {/* VOLET PRINCIPAL (PAR DÉFAUT) : DÉMONSTRATION PAS-À-PAS D'UN TOUR COMPLET */}
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

          <PhysicalBoardV01
            etat={etapeCourante.etat}
            surlignerSommePiste={
              etapeCourante.etat.lancersSecretsDuTour[0]?.somme || null
            }
            surlignerEcartPiste={
              etapeCourante.etat.lancersSecretsDuTour[0]?.ecart ?? null
            }
          />
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
                  texte: `Prenez vos ${variante.defenseursParJoueur} pions Défenseurs (MOI) et ceux des alliés sur les Clairières. Posez les Machines M0 à M${variante.machinesInitiales - 1} sur les Lisières.`,
                },
                {
                  titre: '3. Installer les 2 Pistes du Méchant',
                  texte:
                    'Alignez les 11 tuiles Tactiques sur les cases 2 à 12 et les 6 cartes Machines sur la Piste Machine ordonnée 1, 2, 3, 0, 4, 5.',
                },
                {
                  titre: '4. Distribuer Cartes & Gobelets 2D6',
                  texte:
                    'Remettez à chaque joueur ses cartes Action (Se déplacer, Protéger, Saboter' +
                    (variante.actionReplanterActive ? ', Replanter' : '') +
                    ') et 1 gobelet avec 2 dés.',
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

            <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
              <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                DÉFENSEURS · MOI & ALLIÉS ({variante.nbJoueurs * variante.defenseursParJoueur} PIONS)
              </div>
              <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
                {variante.defenseursParJoueur} Défenseurs / joueur & Cartes I / II
              </h3>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Cartes d’ordres : <em>Se déplacer</em>, <em>Protéger la case</em>, <em>Saboter une Machine</em>
                {variante.actionReplanterActive ? ' et Replanter' : ''}.
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
