import React, { useState, useMemo } from 'react';
import { EtatJeuV01, VariantV01 } from '../shared/types';
import {
  avancerSousPhaseResolution,
  clonerEtatJeu,
  creerEtatInitialV01,
  DESCRIPTIONS_PHYSIQUES_TACTIQUES,
  NOMS_TACTIQUES,
} from '../shared/moteur';
import { calculerProgrammationBot } from '../shared/bots';
import { PhysicalBoardV01 } from './PhysicalBoardV01';

interface DemoViewProps {
  variante: VariantV01;
  onOpenInProto: (etat: EtatJeuV01) => void;
}

type DemoSubTab = 'boite' | 'mise_en_place' | 'tour_guide';

export const DemoView: React.FC<DemoViewProps> = ({
  variante,
  onOpenInProto,
}) => {
  const [subTab, setSubTab] = useState<DemoSubTab>('boite');
  const [etapeMiseEnPlace, setEtapeMiseEnPlace] = useState<number>(0);
  const [indexEtapeTour, setIndexEtapeTour] = useState<number>(0);

  // Construire les 6 états successifs d'un tour de démonstration complet pour la variante active
  const etapesTourDemo = useMemo(() => {
    const etats: {
      titre: string;
      descriptionPedagogique: string;
      gestePhysique: string;
      etat: EtatJeuV01;
    }[] = [];

    // Étape 0 : Début du tour — Tirages secrets 2D6 sous les gobelets
    const e0 = creerEtatInitialV01(variante, 20261019);
    etats.push({
      titre: '1. Tirage secret des 2D6 sous les gobelets',
      descriptionPedagogique: `Chaque joueur lance 2D6 sous son gobelet personnel et regarde ses dés en secret. Par exemple, le Joueur 1 voit [${e0.lancersSecretsDuTour[0]?.d1}, ${e0.lancersSecretsDuTour[0]?.d2}] : la somme (${e0.lancersSecretsDuTour[0]?.somme}) désigne la Tactique « ${NOMS_TACTIQUES[e0.pisteTactique[e0.lancersSecretsDuTour[0]?.somme || 7]]} » et l'écart (${e0.lancersSecretsDuTour[0]?.ecart}) désigne la Machine M${e0.pisteMachine[e0.lancersSecretsDuTour[0]?.ecart || 1]}.`,
      gestePhysique:
        'Soulevez légèrement votre gobelet 2D6 pour lire vos 2 dés, repérez la Somme sur la Piste Tactique (2–12) et l’Écart sur la Piste Machine (0–5), puis reposez votre gobelet sans prononcer un mot.',
      etat: clonerEtatJeu(e0),
    });

    // Étape 1 : Programmation séquentielle et déduction autour de la table
    const e1 = clonerEtatJeu(e0);
    for (let j = 0; j < variante.nbJoueurs; j++) {
      const prog = calculerProgrammationBot(e1, j, 'deductif');
      e1.programmations[j] = prog.actions;
      e1.etatRng = prog.nextRngState;
    }
    e1.sousPhase = 'resolution_actions_1';
    etats.push({
      titre: '2. Programmation séquentielle & Déduction par les actes',
      descriptionPedagogique:
        'Dans le sens horaire, chaque joueur pose ses cartes Action I et Action II devant lui. Le Joueur 2 voit vers quelle tuile le Joueur 1 engage ses Défenseurs, en déduit que cette zone est déjà prise en charge, et oriente ses propres pions vers la menace de son gobelet.',
      gestePhysique:
        'Chaque joueur, à son tour de table, pose ses cartes sur ses emplacements « Action I » et « Action II » devant son plateau Peuple.',
      etat: clonerEtatJeu(e1),
    });

    // Étape 2 : Résolution des 1res actions des Défenseurs
    const e2 = avancerSousPhaseResolution(e1);
    etats.push({
      titre: '3. Exécution des 1res actions des Défenseurs',
      descriptionPedagogique:
        'On retourne les cartes de l’emplacement Action I : les Défenseurs se déplacent vers les tuiles menacées, lèvent leurs boucliers ou sabotent les Machines déjà présentes à portée.',
      gestePhysique:
        'Retournez toutes les cartes « Action I » et déplacez physiquement les pions Défenseurs en bois sur les tuiles correspondantes.',
      etat: clonerEtatJeu(e2),
    });

    // Étape 3 : Révélation des gobelets 2D6 & Ciblage des Machines au milieu (sans coupe !)
    const e3 = avancerSousPhaseResolution(e2);
    etats.push({
      titre: '4. Ciblage & Déplacement des Machines au milieu (sans coupe)',
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
      titre: '5. Exécution des 2es actions des Défenseurs (Interception)',
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
      titre: '6. Coupe des Forêts & Apprentissage du Méchant',
      descriptionPedagogique:
        'C’est le moment de vérité : toute Machine non sabotée se trouvant sur une tuile non protégée abat 1 pion Forêt en bois. Ensuite, le Méchant apprend sur ses deux pistes publiques : les Tactiques et Machines ayant réussi à couper glissent vers les valeurs les plus probables (Somme 7, Écart 1).',
      gestePhysique:
        'Retirez 1 pion Forêt en bois pour chaque Machine non contrée. Puis permutez d’un cran sur la Piste Tactique (vers 7 en cas de coupe, loin de 7 en cas de parade) et sur la Piste Machine (vers 1 en cas de coupe).',
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
    <div className="space-y-6">
      {/* Sous-navigation de la Démo */}
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            4. Démo — Présentation matérielle & Démonstrateur de « Défenseurs de la forêt » (V0.1)
          </h2>
          <p className="text-xs text-[#55645B]">
            Variante présentée : <strong className="text-[#16211B]">{variante.nom}</strong> ·{' '}
            {variante.nbJoueurs} joueurs · {totalForetsBoite} pions Forêt en bois
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
          <button
            onClick={() => setSubTab('boite')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'boite'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            1. Contenu de la boîte
          </button>
          <button
            onClick={() => setSubTab('mise_en_place')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'mise_en_place'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            2. Mise en place sur table
          </button>
          <button
            onClick={() => setSubTab('tour_guide')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'tour_guide'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            3. Démo pas-à-pas d’un tour
          </button>
        </div>
      </div>

      {/* VOLET 1 : CONTENU DE LA BOÎTE DE JEU PHYSIQUE */}
      {subTab === 'boite' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  MATÉRIEL DE PLATEAU · {1 + variante.nbJoueurs * 2} TUILES EN CARTON ÉPAIS
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  Tuile Cœur Central & {variante.nbJoueurs} Secteurs Modulables
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  Le plateau s’adapte exactement au nombre de joueurs (3 à 6). Au centre trône la{' '}
                  <strong>Tuile Cœur de la Forêt</strong>, entourée de{' '}
                  <strong>{variante.nbJoueurs} Tuiles Secteur</strong> divisées chacune en une{' '}
                  <em>Clairière Intérieure</em> et une <em>Lisière Extérieure</em> (zone d’entrée des Machines).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Manipulation : Assemblez en couronne autant de secteurs que de joueurs autour du Cœur.
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  RESSOURCE COMMUNE · {totalForetsBoite} PIÈCES EN BOIS VERT
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  Pions Forêt en Bois ({variante.foretsCoeur} au Cœur, {variante.foretsParCaseSecteur} par case)
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  Les arbres en bois sont posés directement sur les tuiles du plateau. Chaque fois qu’une Machine active n’est ni sabotée ni bloquée par un Défenseur en protection à la fin du tour, on retire physiquement 1 pion Forêt de sa tuile.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Objectif : Sauver un maximum d’arbres debout à la fin du {variante.nbTours}e tour.
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  JOUEURS · {variante.nbJoueurs} PEUPLES IDENTIQUES EN V0.1
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  {variante.nbJoueurs * variante.defenseursParJoueur} Pions Défenseurs & Cartes Action
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  Chaque joueur dispose de <strong>{variante.defenseursParJoueur} pions Défenseurs</strong> à sa couleur sur le plateau, d’un plateau individuel comportant les emplacements <strong>Action I</strong> et <strong>Action II</strong>, et d’un jeu de cartes d’ordres : <em>Se déplacer</em>, <em>Protéger la case</em>, <em>Saboter une Machine</em>{variante.actionReplanterActive ? ' et Replanter' : ''}.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Manipulation : Posez vos cartes sur les emplacements I et II, couchez le pion pour indiquer une Protection.
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  AUTOMATE · 6 FIGURINES NUMÉROTÉES 0 À 5
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  Les 6 Machines du Méchant (M0 à M5)
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  6 pions Machines aux caractéristiques indifférenciées dans la V0.1. Au départ,{' '}
                  <strong>{variante.machinesInitiales} Machines</strong> sont posées sur les Lisières du plateau et{' '}
                  <strong>{6 - variante.machinesInitiales}</strong> attendent dans la zone <em>Chantier (Réserve)</em>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Manipulation : Avancez-les au milieu du tour ; remettez-les au Chantier lorsqu’elles sont sabotées.
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  CERVEAU DU MÉCHANT · DOUBLE PISTE PUBLIQUE
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  Piste Tactique (2–12) & Piste Machine (0–5)
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  Sur les 11 cases numérotées de <strong>2 à 12</strong> reposent les tuiles Tactiques (lues par la <em>somme</em> de deux D6). Sur les 6 cases numérotées de <strong>0 à 5</strong> reposent les 6 cartes Machines (lues par la <em>différence/écart</em> des deux D6).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Apprentissage : Échangez deux tuiles adjacentes pour rapprocher du 7 (et du 1) ce qui a réussi à couper.
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular text-[#55645B] mb-1">
                  DÉDUCTION COOPÉRATIVE · {variante.nbJoueurs} GOBELETS & {variante.nbJoueurs * 2} DÉS D6
                </div>
                <h3 className="font-display text-base font-semibold text-[#16211B] mb-2">
                  Lancers 2D6 Secrets sous Gobelet
                </h3>
                <p className="text-sm text-[#55645B] leading-relaxed">
                  Au début du tour, chaque joueur secoue 2D6 sous son gobelet et regarde secrètement le futur ordre d’une Machine. Sans aucun indice parlé, c’est l’observation des actions programmées tour à tour par les alliés qui révèle où frappera le Méchant.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D8DFD5] text-xs text-[#16211B] font-medium">
                Révélation : Tous les gobelets sont levés au milieu du tour lors du ciblage des Machines.
              </div>
            </div>
          </div>

          {/* Catalogue des 4 cartes Tactiques de la V0.1 */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <h3 className="font-display text-base font-semibold text-[#16211B] mb-3">
              Les 4 Cartes Tactiques de la Piste 2–12 (Applicables dans toute configuration)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(NOMS_TACTIQUES) as (keyof typeof NOMS_TACTIQUES)[]).map(
                (t) => (
                  <div
                    key={t}
                    className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]"
                  >
                    <div className="font-semibold text-sm text-[#16211B] mb-1">
                      {NOMS_TACTIQUES[t]}
                    </div>
                    <p className="text-xs text-[#55645B] leading-relaxed">
                      {DESCRIPTIONS_PHYSIQUES_TACTIQUES[t]}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* VOLET 2 : MISE EN PLACE INITIALE SUR TABLE */}
      {subTab === 'mise_en_place' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  Guide d’installation physique sur la table ({variante.nbJoueurs} joueurs)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Suivez ces 4 gestes dans l’ordre pour installer une partie physique de la variante « {variante.nom} »
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setEtapeMiseEnPlace(step)}
                    className={`px-3 py-1.5 text-xs font-mono-tabular font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      etapeMiseEnPlace === step
                        ? 'bg-[#16211B] text-white border-[#16211B]'
                        : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
                    }`}
                  >
                    Étape {step + 1}/4
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                {
                  titre: '1. Assembler la Couronne & les Forêts',
                  texte: `Posez la Tuile Cœur au centre avec ${variante.foretsCoeur} pions Forêt en bois. Entourez-la de ${variante.nbJoueurs} Tuiles Secteur et placez ${variante.foretsParCaseSecteur} pions Forêt sur chaque Clairière et chaque Lisière.`,
                },
                {
                  titre: '2. Placer les Défenseurs & les Machines',
                  texte: `Chaque joueur prend ${variante.defenseursParJoueur} pions Défenseurs de sa couleur et les pose dans sa Clairière Intérieure. Posez les figurines Machines M0 à M${variante.machinesInitiales - 1} sur les Lisières et les autres dans le Chantier.`,
                },
                {
                  titre: '3. Installer les 2 Pistes du Méchant',
                  texte:
                    'À côté du plateau, posez le tablier « Tête du Méchant ». Alignez les 11 tuiles Tactiques sur les cases 2 à 12 et les 6 cartes Machines (M0 à M5) sur les cases 0 à 5.',
                },
                {
                  titre: '4. Distribuer Cartes & Gobelets 2D6',
                  texte:
                    'Remettez à chaque joueur ses cartes Action (Se déplacer, Protéger, Saboter' +
                    (variante.actionReplanterActive ? ', Replanter' : '') +
                    ') ainsi qu’un gobelet contenant 2 dés à 6 faces.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setEtapeMiseEnPlace(idx)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    etapeMiseEnPlace === idx
                      ? 'bg-emerald-50/70 border-[#256B45]'
                      : 'bg-[#F4F5F0] border-[#D8DFD5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#16211B] mb-1.5">
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

      {/* VOLET 3 : DÉMONSTRATION PAS-À-PAS D'UN TOUR DE JEU */}
      {subTab === 'tour_guide' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D8DFD5]">
              <div>
                <div className="text-xs font-mono-tabular text-[#256B45] font-semibold">
                  DÉROULÉ INTERACTIF D’UN TOUR COMPLET · ÉTAPE {indexEtapeTour + 1} SUR {etapesTourDemo.length}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#16211B]">
                  {etapeCourante.titre}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setIndexEtapeTour((prev) => Math.max(0, prev - 1))
                  }
                  disabled={indexEtapeTour === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  ← Étape précédente
                </button>
                <button
                  onClick={() =>
                    setIndexEtapeTour((prev) =>
                      Math.min(etapesTourDemo.length - 1, prev + 1)
                    )
                  }
                  disabled={indexEtapeTour === etapesTourDemo.length - 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#256B45] text-white disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  Étape suivante →
                </button>
                <button
                  onClick={() => onOpenInProto(etapeCourante.etat)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap shrink-0"
                >
                  Jouer cette situation dans Proto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                <div className="text-xs font-semibold text-[#16211B] mb-1">
                  Explication du mécanisme (Moteur V0.1) :
                </div>
                <p className="text-xs text-[#55645B] leading-relaxed">
                  {etapeCourante.descriptionPedagogique}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-300">
                <div className="text-xs font-semibold text-[#92400E] mb-1">
                  Geste correspondant sur la table physique :
                </div>
                <p className="text-xs text-[#16211B] leading-relaxed">
                  {etapeCourante.gestePhysique}
                </p>
              </div>
            </div>
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
    </div>
  );
};
