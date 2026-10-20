import {
  ActionDefenseurType,
  ActionProgrammee,
  CasePlateau,
  EtatJeuV01,
  JournalEvenement,
  LancerSecret2D6,
  MouvementPisteApprentissage,
  PhysicalStepGuide,
  PionDefenseur,
  PionMachine,
  SousPhaseTour,
  TactiqueType,
  VariantV01,
} from './types';

// Probabilités sur 36 d'une somme de 2D6 (cases 2 à 12)
export const PROBA_SOMME_2D6: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

// Probabilités sur 36 de l'écart |d1 - d2| de 2D6 (cases 0 à 5)
export const PROBA_ECART_2D6: Record<number, number> = {
  0: 6,
  1: 10,
  2: 8,
  3: 6,
  4: 4,
  5: 2,
};

export const NOMS_TACTIQUES: Record<TactiqueType, string> = {
  cupidite: 'Cupidité (Plus boisée)',
  percee: 'Percée (Vers le Cœur)',
  opportunisme: 'Opportunisme (Sans Défenseur)',
  represailles: 'Représailles (Plus défendue)',
};

export const DESCRIPTIONS_PHYSIQUES_TACTIQUES: Record<TactiqueType, string> = {
  cupidite:
    'La Machine cible la tuile accessible portant le plus grand nombre de pions Forêt en bois.',
  percee:
    'La Machine avance d’une tuile en direction de la Tuile Cœur Central (ou reste sur le Cœur si elle y est déjà).',
  opportunisme:
    'La Machine cible la tuile boisée accessible où ne se trouve aucun pion Défenseur (à défaut, la moins défendue).',
  represailles:
    'La Machine cible la tuile boisée accessible comptant le plus de pions Défenseurs présents.',
};

export const NOMS_PEUPLES_V01 = [
  'Peuple Émeraude (Nord)',
  'Peuple Ambre (Nord-Est)',
  'Peuple Azur (Sud-Est)',
  'Peuple Ocre (Sud)',
  'Peuple Lichen (Sud-Ouest)',
  'Peuple Corail (Nord-Ouest)',
];

export const COULEURS_PEUPLES_V01 = [
  '#256B45',
  '#B45309',
  '#1D4ED8',
  '#A16207',
  '#0F766E',
  '#BE123C',
];

export const PISTE_TACTIQUE_INITIALE: Record<number, TactiqueType> = {
  2: 'percee',
  3: 'represailles',
  4: 'percee',
  5: 'opportunisme',
  6: 'cupidite',
  7: 'opportunisme',
  8: 'cupidite',
  9: 'represailles',
  10: 'percee',
  11: 'cupidite',
  12: 'represailles',
};

export const PISTE_MACHINE_INITIALE: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

export const VARIANTES_INITIALES_V01: VariantV01[] = [
  {
    id: 'v01_socle_reference',
    nom: 'V0.1 Socle — Séquencement Entrelacé (Référence)',
    version: '0.1',
    description:
      'Séquencement confirmé : programmation séquentielle de 2 actions après tirage 2D6 secret ; 1res actions -> ciblage Machines au milieu -> 2es actions -> coupe des Forêts en fin de tour et apprentissage.',
    origine: 'socle',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 84,
    bandeSante: 'vert',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v01_alternee_barrage',
    nom: 'V0.1 Pose Alternée (I puis II) & Barrage Complet',
    version: '0.1',
    description:
      'Les joueurs posent leur carte Action I à tour de rôle, puis leur carte Action II lors d’un second tour de table. Protéger bloque à la fois l’entrée des Machines et la coupe.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 88,
    bandeSante: 'vert',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v01_reaction_intermediaire',
    nom: 'V0.1 Programmation de la 2e Action après Ciblage Machine',
    version: '0.1',
    description:
      'Les joueurs programment l’Action I sur la base de leur dé secret ; les 1res actions et le déplacement/ciblage des Machines ont lieu ; puis les joueurs programment l’Action II en réaction ouverte avant la coupe.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 79,
    bandeSante: 'vert',
    modeProgrammation: '2e_apres_ciblage',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'fin_de_tour',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v01_alliance_replanter',
    nom: 'V0.1 Sabotage en Alliance & Action Replanter',
    version: '0.1',
    description:
      'Saboter exige 2 Défenseurs sur la même tuile pour renvoyer une Machine au chantier, mais les Défenseurs disposent d’une 4e carte « Replanter » permettant de régénérer une Forêt.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 81,
    bandeSante: 'vert',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: true,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v01_deux_vagues_completes',
    nom: 'V0.1 Résolution en Deux Vagues de Coupe Successives',
    version: '0.1',
    description:
      'Au lieu de regrouper les coupes en fin de tour, la moitié des lancers de Machines cible et coupe dès la fin de la Vague I, et la seconde moitié après la Vague II.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 67,
    bandeSante: 'orange',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'deux_vagues_completes',
    effetProteger: 'coupe_seule',
    effetSaboter: 'immobiliser_sur_place',
    actionReplanterActive: false,
    deplacementDoubleActif: true,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v01_temoin_boucle_gagnante',
    nom: 'V0.1 Variante Éliminée — Boucle de Replantation Infinie',
    version: '0.1',
    description:
      'Variante de test avec 1 seul ordre, 2 Machines initiales et Replantation active : une simple boucle « Protéger / Replanter sur place » gagne sans lire les pistes.',
    origine: 'exploration',
    statutViabilite: 'eliminee',
    motifElimination:
      'Échec Garde-fou 3.1 : Le bot Boucle fixe atteint 96 % de forêt sauvée et fait jeu égal avec le bot Déductif (écart < 3 %).',
    scoreInteretDernierTest: 22,
    bandeSante: 'rouge',
    modeProgrammation: 'un_seul_ordre',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: true,
    deplacementDoubleActif: true,
    rythmeApprentissage: 'aucun',
    porteeTactiques: 'voisinage',
    nbJoueurs: 3,
    defenseursParJoueur: 3,
    foretsParCaseSecteur: 5,
    foretsCoeur: 7,
    nbTours: 3,
    machinesInitiales: 2,
  },
  {
    id: 'v01_temoin_ecrasement',
    nom: 'V0.1 Variante Éliminée — Submersion Globale à 1 Ordre',
    version: '0.1',
    description:
      'Variante combinant 1 seul ordre par tour, protection et sabotage exigeant chacun 2 Défenseurs, et Machines à portée globale : les joueurs sont submergés sans parade viable.',
    origine: 'exploration',
    statutViabilite: 'eliminee',
    motifElimination:
      'Échec Viabilité 3.1 : Plancher de survie insuffisant (le meilleur bot perd > 72 % des forêts) et taux de sabotage quasi nul (alliance impossible à 1 ordre).',
    scoreInteretDernierTest: 18,
    bandeSante: 'rouge',
    modeProgrammation: 'un_seul_ordre',
    modeResolution: 'machines_avant_actions',
    effetProteger: 'protection_collective',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'plateau_entier',
    nbJoueurs: 4,
    defenseursParJoueur: 1,
    foretsParCaseSecteur: 2,
    foretsCoeur: 3,
    nbTours: 5,
    machinesInitiales: 6,
  },
  {
    id: 'v02_socle_eclaireur',
    nom: 'V0.2 Socle — Jeton Éclaireur & Replantation Active',
    version: '0.2',
    description:
      'Évolution V0.2 issue du Labo : ajoute le Jeton Éclaireur (1 indice de secteur partagé par tour) et l’action Replanter active par défaut face à 5 Machines.',
    origine: 'socle',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 87,
    bandeSante: 'vert',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: true,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    peuplesAsymetriquesActifs: false,
    jetonEclaireurActif: true,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 5,
  },
  {
    id: 'v02_peuples_asymetriques',
    nom: 'V0.2 Peuples Asymétriques & Alliance de Sabotage',
    version: '0.2',
    description:
      'Évolution V0.2 issue du Labo : spécialisation des Peuples Défenseurs (mobilité rapide et replantation) combinée au sabotage en alliance.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 85,
    bandeSante: 'vert',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: true,
    deplacementDoubleActif: true,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    peuplesAsymetriquesActifs: true,
    jetonEclaireurActif: true,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 5,
    machinesInitiales: 5,
  },
  {
    id: 'v03_double_plateau_reference',
    nom: 'V0.3 Socle — Plateau Double Face Fixe (3–4J / 5–6J) & Pose Alternée',
    version: '0.3',
    description:
      'Plateau rigide double face remplaçant l’assemblage d’une tuile par joueur : Recto 9 zones calibré pour 3–4 joueurs avec diagonales d’entraide ; Verso 13 zones calibré pour 5–6 joueurs.',
    origine: 'socle',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 91,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v03_hexagones_19_couronne',
    nom: 'V0.3 Grille Hexagonale Fixe à 19 Cases (2 Couronnes) & Barrage',
    version: '0.3',
    description:
      'Pavage hexagonal fixe de 19 hexagones (1 Cœur central, 6 hexagones en Couronne Intérieure à 6 connexions, 12 hexagones en Lisière). Maximise les manœuvres latérales et les tenailles.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 89,
    bandeSante: 'vert',
    geometriePlateau: 'hex_couronne_19',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: true,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v03_clairieres_sentiers_cols',
    nom: 'V0.3 Réseau de Clairières & Sentiers (3 Cols Stratégiques) & Alliance',
    version: '0.3',
    description:
      'Graphe organique de 13 clairières reliées par des sentiers à embranchements : 6 Lisières convergent vers 3 Cols de Vallée et 3 Sous-Bois avant le Cœur. Idéal pour les alliances de sabotage.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 90,
    bandeSante: 'vert',
    geometriePlateau: 'clairieres_sentiers',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: true,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v03_temoin_modulaire_v01',
    nom: 'V0.3 Témoin — Couronne Modulable Historique (1 Secteur / Joueur)',
    version: '0.3',
    description:
      'Variante témoin en V0.3 conservant l’assemblage modulaire d’un secteur de 2 tuiles par joueur afin de mesurer l’écart d’équilibrage 3–6J face aux 3 nouveaux plateaux.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 84,
    bandeSante: 'vert',
    geometriePlateau: 'modulaire_secteurs',
    modeProgrammation: 'sequentielle_2_ordres',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'coupe_seule',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
];

// Générateur pseudo-aléatoire déterministe Mulberry32
export function nextRng(etatRng: number): { val: number; nextState: number } {
  let t = (etatRng + 0x6d2b79f5) | 0;
  const nextState = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { val, nextState };
}

export function tirerDe6(etatRng: number): { de: number; nextState: number } {
  const { val, nextState } = nextRng(etatRng);
  return { de: 1 + Math.floor(val * 6), nextState };
}

// Construction géométrique et topologique du plateau selon l'architecture (V0.1/V0.2/V0.3)
export function construirePlateauV01(variante: VariantV01): CasePlateau[] {
  const J = variante.nbJoueurs;
  const geom = variante.geometriePlateau || 'modulaire_secteurs';

  // 1. ARCHITECTURE V0.3 : PLATEAU DOUBLE FACE FIXE (Recto 3–4J à 9 zones / Verso 5–6J à 13 zones)
  if (geom === 'double_plateau_34_56') {
    const nbSecteursFixes = J <= 4 ? 4 : 6;
    const cases: CasePlateau[] = [];
    const voisinsCoeur = Array.from({ length: nbSecteursFixes }, (_, i) => 1 + i);

    cases.push({
      id: 0,
      nom: 'Cœur de la Forêt',
      nomPhysique:
        nbSecteursFixes === 4
          ? 'Plateau Recto (3–4J) — Sanctuaire Cœur Central'
          : 'Plateau Verso (5–6J) — Sanctuaire Cœur Central',
      secteurJoueur: null,
      anneau: 'coeur',
      voisins: voisinsCoeur,
      foretsMax: variante.foretsCoeur,
      x: 0,
      y: 0,
      formeRendu: 'plateau_fixe',
      rayonRendu: 48,
    });

    // Anneau intérieur : 4 Clairières (Recto 3-4J) ou 6 Clairières (Verso 5-6J)
    for (let s = 0; s < nbSecteursFixes; s++) {
      const idInt = 1 + s;
      const sPrec = (s + nbSecteursFixes - 1) % nbSecteursFixes;
      const sSuiv = (s + 1) % nbSecteursFixes;
      const idLisDirecte = 1 + nbSecteursFixes + s;
      const idLisCroisee = 1 + nbSecteursFixes + sPrec;

      const angle = (s * 2 * Math.PI) / nbSecteursFixes - Math.PI / 2;
      const rInt = 112;

      cases.push({
        id: idInt,
        nom: `Clairière ${['Nord', 'Est', 'Sud', 'Ouest', 'Sud-Ouest', 'Nord-Ouest'][s] || `C${s + 1}`}`,
        nomPhysique: `Plateau ${nbSecteursFixes === 4 ? '3–4J' : '5–6J'} — Clairière Intérieure ${s + 1}`,
        secteurJoueur: s % J,
        anneau: 'interieur',
        // Chaque clairière est reliée au Cœur, aux 2 clairières latérales ET à 2 Lisières (diagonale d'entraide)
        voisins: [0, 1 + sPrec, 1 + sSuiv, idLisDirecte, idLisCroisee],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rInt),
        y: Math.round(Math.sin(angle) * rInt),
        formeRendu: 'plateau_fixe',
        rayonRendu: 40,
      });
    }

    // Anneau extérieur décalé de demi-angle : chaque Lisière irrigue 2 Clairières intérieures !
    for (let s = 0; s < nbSecteursFixes; s++) {
      const idLis = 1 + nbSecteursFixes + s;
      const sPrec = (s + nbSecteursFixes - 1) % nbSecteursFixes;
      const sSuiv = (s + 1) % nbSecteursFixes;
      const idIntA = 1 + s;
      const idIntB = 1 + sSuiv;
      const idLisPrec = 1 + nbSecteursFixes + sPrec;
      const idLisSuiv = 1 + nbSecteursFixes + sSuiv;

      const angle = ((s + 0.5) * 2 * Math.PI) / nbSecteursFixes - Math.PI / 2;
      const rLis = 212;

      cases.push({
        id: idLis,
        nom: `Lisière ${['N-E', 'S-E', 'S-O', 'N-O', 'Ouest', 'Nord'][s] || `L${s + 1}`}`,
        nomPhysique: `Plateau ${nbSecteursFixes === 4 ? '3–4J' : '5–6J'} — Lisière d'Entrée ${s + 1}`,
        secteurJoueur: s % J,
        anneau: 'lisiere',
        voisins: [idIntA, idIntB, idLisPrec, idLisSuiv],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rLis),
        y: Math.round(Math.sin(angle) * rLis),
        formeRendu: 'plateau_fixe',
        rayonRendu: 38,
      });
    }

    return cases;
  }

  // 2. ARCHITECTURE V0.3 : GRILLE HEXAGONALE FIXE À 19 CASES EN COURONNES (1 + 6 + 12)
  if (geom === 'hex_couronne_19') {
    // Coordonnées axiales (q, r) des 19 hexagones (rayon 2)
    const coordsAxiales: { q: number; r: number; anneau: 'coeur' | 'interieur' | 'lisiere'; label: string }[] = [
      { q: 0, r: 0, anneau: 'coeur', label: 'Hex Cœur' },
      // Couronne 1 (6 hexagones intérieurs)
      { q: 0, r: -1, anneau: 'interieur', label: 'Hex Int N' },
      { q: 1, r: -1, anneau: 'interieur', label: 'Hex Int NE' },
      { q: 1, r: 0, anneau: 'interieur', label: 'Hex Int SE' },
      { q: 0, r: 1, anneau: 'interieur', label: 'Hex Int S' },
      { q: -1, r: 1, anneau: 'interieur', label: 'Hex Int SO' },
      { q: -1, r: 0, anneau: 'interieur', label: 'Hex Int NO' },
      // Couronne 2 (12 hexagones de lisière)
      { q: 0, r: -2, anneau: 'lisiere', label: 'Hex Lis N' },
      { q: 1, r: -2, anneau: 'lisiere', label: 'Hex Lis NNE' },
      { q: 2, r: -2, anneau: 'lisiere', label: 'Hex Lis NE' },
      { q: 2, r: -1, anneau: 'lisiere', label: 'Hex Lis ENE' },
      { q: 2, r: 0, anneau: 'lisiere', label: 'Hex Lis SE' },
      { q: 1, r: 1, anneau: 'lisiere', label: 'Hex Lis SSE' },
      { q: 0, r: 2, anneau: 'lisiere', label: 'Hex Lis S' },
      { q: -1, r: 2, anneau: 'lisiere', label: 'Hex Lis SSO' },
      { q: -2, r: 2, anneau: 'lisiere', label: 'Hex Lis SO' },
      { q: -2, r: 1, anneau: 'lisiere', label: 'Hex Lis OSO' },
      { q: -2, r: 0, anneau: 'lisiere', label: 'Hex Lis NO' },
      { q: -1, r: -1, anneau: 'lisiere', label: 'Hex Lis NNO' },
    ];

    const tailleHex = 62;
    const dirs = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];

    const foretsLis = Math.max(2, Math.round(variante.foretsParCaseSecteur * 0.75));

    return coordsAxiales.map((hc, idx) => {
      const voisins: number[] = [];
      for (const [dq, dr] of dirs) {
        const vIdx = coordsAxiales.findIndex(
          (other) => other.q === hc.q + dq && other.r === hc.r + dr
        );
        if (vIdx >= 0) voisins.push(vIdx);
      }

      // Conversion flat-top axial -> pixel (x, y)
      const x = Math.round(tailleHex * (1.5 * hc.q));
      const y = Math.round(tailleHex * (Math.sqrt(3) * (hc.r + hc.q / 2)));

      return {
        id: idx,
        nom: hc.label,
        nomPhysique: `Plateau Hexagonal 19 — ${hc.label}`,
        secteurJoueur: idx === 0 ? null : (idx - 1) % J,
        anneau: hc.anneau,
        voisins,
        foretsMax:
          hc.anneau === 'coeur'
            ? variante.foretsCoeur
            : hc.anneau === 'interieur'
            ? variante.foretsParCaseSecteur
            : foretsLis,
        x,
        y,
        formeRendu: 'hexagone',
        rayonRendu: 31,
      };
    });
  }

  // 3. ARCHITECTURE V0.3 : RÉSEAU DE CLAIRIÈRES & SENTIERS À EMBRANCHEMENTS (13 Nœuds & 3 Cols)
  if (geom === 'clairieres_sentiers') {
    const cases: CasePlateau[] = [];

    // 0 : Cœur Central, accessible uniquement par les 3 Cols Stratégiques (1, 2, 3)
    cases.push({
      id: 0,
      nom: 'Sanctuaire Cœur',
      nomPhysique: 'Clairière Centrale du Sanctuaire',
      secteurJoueur: null,
      anneau: 'coeur',
      voisins: [1, 2, 3],
      foretsMax: variante.foretsCoeur,
      x: 0,
      y: 0,
      formeRendu: 'clairiere',
      rayonRendu: 46,
    });

    // 1..3 : Les 3 Cols de Vallée (verrous intérieurs donnant sur le Cœur)
    const nomsCols = ['Col du Nord', 'Col du Levant', 'Col du Couchant'];
    for (let c = 0; c < 3; c++) {
      const angle = (c * 2 * Math.PI) / 3 - Math.PI / 2;
      const rCol = 98;
      const sousBoisG = 4 + ((c + 2) % 3);
      const sousBoisD = 4 + c;
      const lisA = 7 + c * 2;
      const lisB = 7 + c * 2 + 1;

      cases.push({
        id: 1 + c,
        nom: nomsCols[c],
        nomPhysique: `Sentier Forestier — ${nomsCols[c]} (Verrou du Cœur)`,
        secteurJoueur: c % J,
        anneau: 'interieur',
        voisins: [0, sousBoisG, sousBoisD, lisA, lisB],
        foretsMax: variante.foretsParCaseSecteur + 1,
        x: Math.round(Math.cos(angle) * rCol),
        y: Math.round(Math.sin(angle) * rCol),
        formeRendu: 'clairiere',
        rayonRendu: 37,
      });
    }

    // 4..6 : 3 Carrefours de Sous-Bois reliant les Cols entre eux et aux Lisières
    const nomsSousBois = ['Sous-Bois Est', 'Sous-Bois Sud', 'Sous-Bois Ouest'];
    for (let sb = 0; sb < 3; sb++) {
      const angle = ((sb + 0.5) * 2 * Math.PI) / 3 - Math.PI / 2;
      const rSb = 142;
      const colA = 1 + sb;
      const colB = 1 + ((sb + 1) % 3);
      const lisA = 7 + sb * 2 + 1;
      const lisB = 7 + (((sb + 1) * 2) % 6);

      cases.push({
        id: 4 + sb,
        nom: nomsSousBois[sb],
        nomPhysique: `Carrefour de ${nomsSousBois[sb]}`,
        secteurJoueur: (sb + 3) % J,
        anneau: 'interieur',
        voisins: [colA, colB, lisA, lisB],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rSb),
        y: Math.round(Math.sin(angle) * rSb),
        formeRendu: 'clairiere',
        rayonRendu: 34,
      });
    }

    // 7..12 : 6 Campements de Lisière périphériques
    for (let l = 0; l < 6; l++) {
      const idLis = 7 + l;
      const angle = ((l - 0.25) * 2 * Math.PI) / 6 - Math.PI / 2;
      const rLis = 222;
      const colAss = 1 + Math.floor(l / 2);
      const sbAss = l % 2 === 1 ? 4 + Math.floor(l / 2) : 4 + ((Math.floor(l / 2) + 2) % 3);
      const lisPrec = 7 + ((l + 5) % 6);
      const lisSuiv = 7 + ((l + 1) % 6);

      cases.push({
        id: idLis,
        nom: `Orée S${l + 1}`,
        nomPhysique: `Campement d'Orée ${l + 1}`,
        secteurJoueur: l % J,
        anneau: 'lisiere',
        voisins: [colAss, sbAss, lisPrec, lisSuiv],
        foretsMax: Math.max(2, variante.foretsParCaseSecteur - 1),
        x: Math.round(Math.cos(angle) * rLis),
        y: Math.round(Math.sin(angle) * rLis),
        formeRendu: 'clairiere',
        rayonRendu: 33,
      });
    }

    return cases;
  }

  // 4. ARCHITECTURE HISTORIQUE V0.1/V0.2 : COURONNE MODULABLE (1 Cœur + 2×J cases)
  const cases: CasePlateau[] = [];
  const voisinsCoeur: number[] = [];
  for (let s = 0; s < J; s++) {
    voisinsCoeur.push(1 + s * 2);
  }

  cases.push({
    id: 0,
    nom: 'Cœur de la Forêt',
    nomPhysique: 'Tuile Cœur Central',
    secteurJoueur: null,
    anneau: 'coeur',
    voisins: voisinsCoeur,
    foretsMax: variante.foretsCoeur,
    x: 0,
    y: 0,
    formeRendu: 'cercle',
    rayonRendu: 50,
  });

  for (let s = 0; s < J; s++) {
    const idInterieur = 1 + s * 2;
    const idLisiere = 2 + s * 2;
    const sPrec = (s + J - 1) % J;
    const sSuiv = (s + 1) % J;

    const idIntPrec = 1 + sPrec * 2;
    const idIntSuiv = 1 + sSuiv * 2;
    const idLisPrec = 2 + sPrec * 2;
    const idLisSuiv = 2 + sSuiv * 2;

    const angle = (s * 2 * Math.PI) / J - Math.PI / 2;
    const rInt = 115;
    const rLis = 215;

    cases.push({
      id: idInterieur,
      nom: `Clairière S${s + 1}`,
      nomPhysique: `Tuile Secteur ${s + 1} — Clairière Intérieure`,
      secteurJoueur: s,
      anneau: 'interieur',
      voisins: [0, idLisiere, idIntPrec, idIntSuiv],
      foretsMax: variante.foretsParCaseSecteur,
      x: Math.round(Math.cos(angle) * rInt),
      y: Math.round(Math.sin(angle) * rInt),
      formeRendu: 'cercle',
      rayonRendu: 41,
    });

    cases.push({
      id: idLisiere,
      nom: `Lisière S${s + 1}`,
      nomPhysique: `Tuile Secteur ${s + 1} — Lisière Extérieure`,
      secteurJoueur: s,
      anneau: 'lisiere',
      voisins: [idInterieur, idLisPrec, idLisSuiv],
      foretsMax: variante.foretsParCaseSecteur,
      x: Math.round(Math.cos(angle) * rLis),
      y: Math.round(Math.sin(angle) * rLis),
      formeRendu: 'cercle',
      rayonRendu: 41,
    });
  }

  return cases;
}

export function casesAccessiblesDefenseur(
  etat: EtatJeuV01,
  caseDepart: number
): number[] {
  const c = etat.cases[caseDepart];
  if (!c) return [caseDepart];
  const niveau1 = new Set<number>([caseDepart, ...c.voisins]);
  if (!etat.variante.deplacementDoubleActif) {
    return Array.from(niveau1);
  }
  const niveau2 = new Set<number>(niveau1);
  for (const v of c.voisins) {
    for (const v2 of etat.cases[v]?.voisins || []) {
      niveau2.add(v2);
    }
  }
  return Array.from(niveau2);
}

// Tirage des lancers secrets 2D6 au début du tour (1 lancer par joueur autour de la table)
export function genererLancersSecretsTour(
  nbJoueurs: number,
  etatRngInitial: number
): { lancers: LancerSecret2D6[]; nextState: number } {
  let rng = etatRngInitial;
  const lancers: LancerSecret2D6[] = [];
  for (let j = 0; j < nbJoueurs; j++) {
    const r1 = tirerDe6(rng);
    rng = r1.nextState;
    const r2 = tirerDe6(rng);
    rng = r2.nextState;
    lancers.push({
      joueurObservateur: j,
      d1: r1.de,
      d2: r2.de,
      somme: r1.de + r2.de,
      ecart: Math.abs(r1.de - r2.de),
    });
  }
  return { lancers, nextState: rng };
}

export function construireGuidePhysique(
  sousPhase: SousPhaseTour,
  variante: VariantV01,
  joueurActif: number,
  tourActuel: number
): PhysicalStepGuide {
  switch (sousPhase) {
    case 'observation_2d6':
      return {
        titreEtape: `Tour ${tourActuel} — 1. Coup d'œil secret sous les Gobelets 2D6`,
        composantsPhysiques: [
          `${variante.nbJoueurs} paires de dés 2D6`,
          `${variante.nbJoueurs} gobelets ou paravents individuels`,
          'Plateau « Tête du Méchant » (Piste Tactique 2–12 & Piste Machine 0–5)',
        ],
        gesteSurTable:
          'Chaque joueur lance 2D6 sous son gobelet et regarde secrètement ses dés sans rien dire à voix haute. Repérez du regard sur la Piste Tactique la case correspondant à la SOMME de vos dés (2 à 12) et sur la Piste Machine la case correspondant à leur ÉCART (0 à 5).',
        regleDeReference:
          'Règle V0.1 §1 — Information secrète : Aucun joueur ne peut nommer ses chiffres ni pointer une tuile. Vos choix de programmation successifs seront votre seul langage.',
      };
    case 'programmation_1':
      return {
        titreEtape: `Tour ${tourActuel} — 2. Programmation sur table (Joueur ${joueurActif + 1})`,
        composantsPhysiques: [
          'Cartes Action du Peuple',
          'Emplacements physiques « Action I » et « Action II » devant soi',
          `Pions Défenseurs du Joueur ${joueurActif + 1}`,
        ],
        gesteSurTable:
          variante.modeProgrammation === 'alternee_1_par_1'
            ? `Joueur ${joueurActif + 1} : Choisissez 1 carte Action pour chacun de vos ${variante.defenseursParJoueur} Défenseurs et posez-la sur l’emplacement « Action I » en indiquant la tuile visée. Les joueurs suivants observent votre pose avant de choisir la leur.`
            : variante.modeProgrammation === '2e_apres_ciblage'
            ? `Joueur ${joueurActif + 1} : Posez uniquement votre carte sur l’emplacement « Action I ». Vous programmerez l’emplacement « Action II » après le déplacement des Machines.`
            : variante.modeProgrammation === 'un_seul_ordre'
            ? `Joueur ${joueurActif + 1} : Posez votre unique carte Action du tour devant chacun de vos Défenseurs.`
            : `Joueur ${joueurActif + 1} : À votre tour de table, posez vos cartes sur les emplacements « Action I » et « Action II » pour chacun de vos ${variante.defenseursParJoueur} Défenseurs. Les coéquipiers suivants observent où vous engagez vos pions pour déduire votre tirage secret.`,
        regleDeReference:
          'Règle V0.1 §2 — Programmation séquentielle : La pose s’effectue joueur après joueur dans le sens horaire.',
      };
    case 'programmation_2':
      return {
        titreEtape: `Tour ${tourActuel} — 2bis. Programmation de la 2e Action (Joueur ${joueurActif + 1})`,
        composantsPhysiques: [
          'Cartes Action du Peuple',
          'Emplacement physique « Action II »',
        ],
        gesteSurTable: `Joueur ${joueurActif + 1} : Posez maintenant votre carte sur l’emplacement « Action II » pour chacun de vos Défenseurs, en tenant compte des actions déjà posées ou du ciblage des Machines.`,
        regleDeReference:
          'Règle V0.1 §2bis — Second temps de programmation (Variante active).',
      };
    case 'resolution_actions_1':
      return {
        titreEtape: `Tour ${tourActuel} — 3. Résolution des 1res Actions des Défenseurs`,
        composantsPhysiques: [
          'Cartes de l’emplacement « Action I »',
          'Pions Défenseurs en bois',
          'Figurines Machines (si Sabotage)',
        ],
        gesteSurTable:
          'Retournez face visible toutes les cartes de l’emplacement « Action I ». Déplacez les pions Défenseurs sur les tuiles voisines, couchez sur le bouclier ceux qui protègent leur tuile, et retirez vers le Chantier (ou couchez) les Machines sabotées.',
        regleDeReference:
          'Règle V0.1 §3 — Premières actions : Exécutées avant que les Machines ne se déplacent.',
      };
    case 'resolution_ciblage_machines':
      return {
        titreEtape: `Tour ${tourActuel} — 4. Révélation des 2D6 & Ciblage des Machines (sans coupe)`,
        composantsPhysiques: [
          'Gobelets 2D6 soulevés',
          'Piste Tactique (2–12) & Piste Machine (0–5)',
          '6 Figurines Machines numérotées 0 à 5',
        ],
        gesteSurTable:
          variante.modeResolution === 'deux_vagues_completes'
            ? 'Soulevez les gobelets de la 1re vague : lisez l’Écart (0–5) pour identifier la Machine et la Somme (2–12) pour sa Tactique. Déplacez la figurine Machine vers sa tuile cible : dans cette variante en 2 vagues, elle coupe immédiatement 1 Forêt si la tuile n’est pas protégée.'
            : 'Soulevez tous les gobelets 2D6 ! Pour chaque paire de dés, lisez l’Écart (0–5) sur la Piste Machine et la Somme (2–12) sur la Piste Tactique. Déplacez chaque figurine Machine désignée sur sa tuile cible (ou faites-la entrer depuis le Chantier), mais NE RETIREZ AUCUN ARBRE POUR L’INSTANT.',
        regleDeReference:
          'Règle V0.1 §4 — Ciblage au milieu : Les Machines prennent position et annoncent leur menace avant la 2e action des Défenseurs.',
      };
    case 'resolution_actions_2':
      return {
        titreEtape: `Tour ${tourActuel} — 5. Résolution des 2es Actions des Défenseurs`,
        composantsPhysiques: [
          'Cartes de l’emplacement « Action II »',
          'Pions Défenseurs',
          'Figurines Machines sur les tuiles menacées',
        ],
        gesteSurTable:
          'Retournez toutes les cartes de l’emplacement « Action II ». Déplacez vos pions Défenseurs en renfort, activez les protections de dernière minute ou sabotez les Machines qui viennent d’atterrir sur vos tuiles !',
        regleDeReference:
          'Règle V0.1 §5 — Secondes actions : Dernière opportunité d’intercepter ou neutraliser les Machines avant l’abattage.',
      };
    case 'resolution_coupe_et_apprentissage':
      return {
        titreEtape: `Tour ${tourActuel} — 6. Coupe des Forêts & Apprentissage du Méchant`,
        composantsPhysiques: [
          'Pions Forêt en bois vert',
          'Tuiles de la Piste Tactique (2–12)',
          'Cartes de la Piste Machine (0–5)',
        ],
        gesteSurTable:
          'Sur chaque tuile où se trouve une Machine active non sabotée et non protégée par un Défenseur, retirez 1 pion Forêt en bois par Machine. Puis faites apprendre le Méchant : si une Machine a coupé, glissez sa tuile Tactique d’un cran vers le 7 et sa carte Machine d’un cran vers le 1 ; si elle a été contrée, éloignez-les d’un cran !',
        regleDeReference:
          'Règle V0.1 §6 — Abattage & Renforcement : Les coupes s’appliquent après les 2es actions, suivies de la permutation physique des tuiles sur les deux pistes.',
      };
    case 'bilan_tour':
      return {
        titreEtape: `Fin du Tour ${tourActuel} — Remise en main des cartes`,
        composantsPhysiques: ['Cartes Action', 'Pions Défenseurs redressés'],
        gesteSurTable:
          'Redressez les pions Défenseurs qui étaient en posture de protection, reprenez vos cartes Action en main et passez au tour suivant.',
        regleDeReference: 'Règle V0.1 §7 — Entretien de fin de tour.',
      };
    case 'fin_de_partie':
      return {
        titreEtape: 'Fin de la Partie — Décompte des Forêts Debout',
        composantsPhysiques: ['Tous les pions Forêt en bois restants sur les tuiles'],
        gesteSurTable:
          'Comptez le nombre total de pions Forêt en bois encore présents sur la Tuile Cœur et les Tuiles Secteur. Comparez ce total à la forêt initiale pour obtenir votre score de préservation.',
        regleDeReference: 'Règle V0.1 §8 — Victoire collective et score de préservation.',
      };
  }
}

export function creerEtatInitialV01(
  variante: VariantV01,
  graine = 20261019
): EtatJeuV01 {
  const cases = construirePlateauV01(variante);
  const forets = cases.map((c) => c.foretsMax);
  const foretsInitialesTotales = forets.reduce((acc, v) => acc + v, 0);

  // Placement initial des Défenseurs : répartis équitablement sur les Clairières Intérieures quelle que soit la géométrie
  const casesInterieures = cases.filter((c) => c.anneau === 'interieur');
  const defenseurs: PionDefenseur[] = [];
  let pionId = 0;
  for (let j = 0; j < variante.nbJoueurs; j++) {
    const caseSecteurInt =
      casesInterieures[j % Math.max(1, casesInterieures.length)]?.id ?? 0;
    for (let n = 1; n <= variante.defenseursParJoueur; n++) {
      defenseurs.push({
        id: pionId++,
        joueur: j,
        numeroPion: n,
        caseId: caseSecteurInt,
        postureProtection: false,
      });
    }
  }

  // Placement initial des 6 Machines (M0..M5) : réparties sur les Lisières Extérieures du plateau
  const casesLisieres = cases.filter((c) => c.anneau === 'lisiere');
  const machines: PionMachine[] = [];
  for (let m = 0; m < 6; m++) {
    let caseInit: number | null = null;
    if (m < variante.machinesInitiales && casesLisieres.length > 0) {
      const pasRepartition = Math.max(
        1,
        Math.floor(casesLisieres.length / Math.max(1, variante.machinesInitiales))
      );
      caseInit = casesLisieres[(m * pasRepartition) % casesLisieres.length].id;
    }
    machines.push({
      id: m,
      nom: `Machine M${m}`,
      caseId: caseInit,
      cibleDeclaree: null,
      tactiqueDeclaree: null,
      neutraliseeCeTour: false,
    });
  }

  const tirage = genererLancersSecretsTour(variante.nbJoueurs, graine);

  const programmations: Record<number, ActionProgrammee[]> = {};
  for (let j = 0; j < variante.nbJoueurs; j++) {
    programmations[j] = [];
  }

  const sousPhaseInitiale: SousPhaseTour =
    variante.modeResolution === 'machines_avant_actions'
      ? 'resolution_ciblage_machines'
      : 'programmation_1';

  return {
    variante,
    graine,
    etatRng: tirage.nextState,
    tourActuel: 1,
    sousPhase: sousPhaseInitiale,
    joueurActifProgrammation: 0,
    cases,
    forets,
    foretsInitialesTotales,
    defenseurs,
    machines,
    pisteTactique: { ...PISTE_TACTIQUE_INITIALE },
    pisteMachine: { ...PISTE_MACHINE_INITIALE },
    lancersSecretsDuTour: tirage.lancers,
    lancersReveles: variante.modeResolution === 'machines_avant_actions',
    programmations,
    mouvementsApprentissageTour: [],
    guidePhysiqueActuel: construireGuidePhysique(
      sousPhaseInitiale,
      variante,
      0,
      1
    ),
    journal: [
      {
        id: 'init-1',
        tour: 1,
        sousPhase: sousPhaseInitiale,
        message: `Mise en place de « ${variante.nom} » (${variante.nbJoueurs} joueurs, ${foretsInitialesTotales} Forêts en bois, ${variante.machinesInitiales}/6 Machines sur les lisières).`,
        gestePhysique: `Placez la Tuile Cœur au centre avec ${variante.foretsCoeur} arbres en bois, entourez-la de ${variante.nbJoueurs} Tuiles Secteur (${variante.foretsParCaseSecteur} arbres par case), posez ${variante.defenseursParJoueur} pions Défenseurs par joueur sur leur Clairière et ${variante.machinesInitiales} figurines Machines sur les Lisières.`,
        type: 'info',
      },
    ],
    stats: {
      arbresCoupes: 0,
      coupesEviteesParProtection: 0,
      protectionsEffectuees: 0,
      machinesSabotees: 0,
      foretsReplantees: 0,
      deplacementsEffectues: 0,
      apprentissagesPositifs: 0,
      apprentissagesNegatifs: 0,
    },
  };
}

export function clonerEtatJeu(etat: EtatJeuV01): EtatJeuV01 {
  return {
    ...etat,
    cases: etat.cases.map((c) => ({ ...c, voisins: [...c.voisins] })),
    forets: [...etat.forets],
    defenseurs: etat.defenseurs.map((d) => ({ ...d })),
    machines: etat.machines.map((m) => ({ ...m })),
    pisteTactique: { ...etat.pisteTactique },
    pisteMachine: { ...etat.pisteMachine },
    lancersSecretsDuTour: etat.lancersSecretsDuTour.map((l) => ({ ...l })),
    programmations: Object.fromEntries(
      Object.entries(etat.programmations).map(([k, v]) => [
        Number(k),
        v.map((a) => ({ ...a })),
      ])
    ),
    mouvementsApprentissageTour: etat.mouvementsApprentissageTour.map((m) => ({
      ...m,
    })),
    guidePhysiqueActuel: { ...etat.guidePhysiqueActuel },
    journal: etat.journal.slice(-60),
    stats: { ...etat.stats },
  };
}

// Vérifie si une case est protégée contre les Machines selon l'option `effetProteger`
export function caseEstProtegeeContreCoupe(
  etat: EtatJeuV01,
  caseId: number
): boolean {
  const defenseursEnProtection = etat.defenseurs.filter(
    (d) => d.caseId === caseId && d.postureProtection
  );
  if (etat.variante.effetProteger === 'protection_collective') {
    return defenseursEnProtection.length >= 2;
  }
  return defenseursEnProtection.length >= 1;
}

export function caseEstBarreeEntree(etat: EtatJeuV01, caseId: number): boolean {
  if (etat.variante.effetProteger !== 'barrage_entree_et_coupe') return false;
  return etat.defenseurs.some((d) => d.caseId === caseId && d.postureProtection);
}

// Détermine la case cible d'une Machine selon la Tactique active et les options de variante
export function calculerCibleMachine(
  etat: EtatJeuV01,
  machine: PionMachine,
  tactique: TactiqueType,
  secteurPreferentiel = 0
): number {
  // Si la Machine est en Réserve/Chantier (caseId === null), elle entre par une Lisière extérieure du plateau
  let candidats: number[] = [];
  const lisieresIds = etat.cases
    .filter((c) => c.anneau === 'lisiere')
    .map((c) => c.id);
  if (machine.caseId === null) {
    candidats = lisieresIds.length > 0 ? lisieresIds : etat.cases.map((c) => c.id);
  } else if (etat.variante.porteeTactiques === 'plateau_entier') {
    candidats = etat.cases.map((c) => c.id);
  } else {
    const cActuelle = etat.cases[machine.caseId];
    candidats = [machine.caseId, ...(cActuelle ? cActuelle.voisins : [])];
  }

  // Filtrer les cases barrées à l'entrée (sauf la case où la Machine se trouve déjà)
  const accessibles = candidats.filter(
    (cid) => cid === machine.caseId || !caseEstBarreeEntree(etat, cid)
  );
  const pool = accessibles.length > 0 ? accessibles : candidats;

  // Privilégier les cases ayant encore au moins 1 Forêt
  const boisees = pool.filter((cid) => etat.forets[cid] > 0);
  const cibles = boisees.length > 0 ? boisees : pool;

  const nbDefSurCase = (cid: number) =>
    etat.defenseurs.filter((d) => d.caseId === cid).length;

  const distAuCoeur = (cid: number) => {
    const anneau = etat.cases[cid]?.anneau;
    if (anneau === 'coeur') return 0;
    if (anneau === 'interieur') return 1;
    return 2;
  };

  const ciblesTriees = [...cibles].sort((a, b) => {
    if (tactique === 'cupidite') {
      // Case ayant le plus de Forêts
      if (etat.forets[b] !== etat.forets[a]) {
        return etat.forets[b] - etat.forets[a];
      }
      return distAuCoeur(a) - distAuCoeur(b);
    }
    if (tactique === 'percee') {
      // Case la plus proche du Cœur (anneau coeur < interieur < lisiere)
      if (distAuCoeur(a) !== distAuCoeur(b)) {
        return distAuCoeur(a) - distAuCoeur(b);
      }
      return etat.forets[b] - etat.forets[a];
    }
    if (tactique === 'opportunisme') {
      // Case avec le moins de Défenseurs, puis le plus de Forêts
      if (nbDefSurCase(a) !== nbDefSurCase(b)) {
        return nbDefSurCase(a) - nbDefSurCase(b);
      }
      return etat.forets[b] - etat.forets[a];
    }
    // 'represailles' : Case avec le plus de Défenseurs
    if (nbDefSurCase(b) !== nbDefSurCase(a)) {
      return nbDefSurCase(b) - nbDefSurCase(a);
    }
    return etat.forets[b] - etat.forets[a];
  });

  return (
    ciblesTriees[0] ??
    lisieresIds[secteurPreferentiel % Math.max(1, lisieresIds.length)] ??
    0
  );
}

// Exécution d'une vague d'actions des Défenseurs (étape 1 ou 2)
export function executerActionsDefenseursEtape(
  etatOrigine: EtatJeuV01,
  etape: 1 | 2
): EtatJeuV01 {
  const etat = clonerEtatJeu(etatOrigine);

  // En début d'étape, réinitialiser la posture de protection de l'étape précédente si étape 1
  if (etape === 1) {
    for (const d of etat.defenseurs) {
      d.postureProtection = false;
    }
  }

  const actionsEtape: { joueur: number; action: ActionProgrammee }[] = [];
  for (let j = 0; j < etat.variante.nbJoueurs; j++) {
    const progJ = etat.programmations[j] || [];
    for (const act of progJ) {
      if (act.etape === etape) {
        actionsEtape.push({ joueur: j, action: act });
      }
    }
  }

  // 1. Exécuter d'abord tous les déplacements
  for (const { joueur, action } of actionsEtape) {
    if (action.type !== 'deplacer') continue;
    const pion = etat.defenseurs.find((d) => d.id === action.pionId);
    if (!pion || action.caseCible === null) continue;
    const accessibles = casesAccessiblesDefenseur(etat, pion.caseId);
    if (accessibles.includes(action.caseCible) && action.caseCible !== pion.caseId) {
      const ancienneCase = etat.cases[pion.caseId]?.nom || `Case ${pion.caseId}`;
      const nouvelleCase = etat.cases[action.caseCible]?.nom || `Case ${action.caseCible}`;
      pion.caseId = action.caseCible;
      pion.postureProtection = false;
      etat.stats.deplacementsEffectues += 1;
      etat.journal.push({
        id: `dep-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `J${joueur + 1} (Défenseur #${pion.numeroPion}) se déplace : ${ancienneCase} → ${nouvelleCase}.`,
        gestePhysique: `Déplacez le pion Défenseur #${pion.numeroPion} du Joueur ${joueur + 1} vers la ${etat.cases[action.caseCible]?.nomPhysique}.`,
        type: 'defenseur',
      });
    }
  }

  // 2. Exécuter les postures Protéger
  for (const { joueur, action } of actionsEtape) {
    if (action.type !== 'proteger') continue;
    const pion = etat.defenseurs.find((d) => d.id === action.pionId);
    if (!pion) continue;
    pion.postureProtection = true;
    etat.stats.protectionsEffectuees += 1;
    etat.journal.push({
      id: `prot-${etat.tourActuel}-${etape}-${pion.id}`,
      tour: etat.tourActuel,
      sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
      message: `J${joueur + 1} (Défenseur #${pion.numeroPion}) protège ${etat.cases[pion.caseId]?.nom}.`,
      gestePhysique: `Placez le pion Défenseur #${pion.numeroPion} du Joueur ${joueur + 1} en posture Bouclier sur la ${etat.cases[pion.caseId]?.nomPhysique}.`,
      type: 'defenseur',
    });
  }

  // 3. Exécuter les Sabotages
  for (const { joueur, action } of actionsEtape) {
    if (action.type !== 'saboter') continue;
    const pion = etat.defenseurs.find((d) => d.id === action.pionId);
    if (!pion) continue;
    const machinesSurCase = etat.machines.filter(
      (m) => m.caseId === pion.caseId && !m.neutraliseeCeTour
    );
    if (machinesSurCase.length === 0) continue;

    const nbDefenseursSurCase = etat.defenseurs.filter(
      (d) => d.caseId === pion.caseId
    ).length;

    if (
      etat.variante.effetSaboter === 'alliance_requise' &&
      nbDefenseursSurCase < 2
    ) {
      etat.journal.push({
        id: `sab-fail-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `Sabotage impossible sur ${etat.cases[pion.caseId]?.nom} : l'alliance exige au moins 2 Défenseurs présents.`,
        gestePhysique: `Aucun effet : il faut au moins 2 pions Défenseurs sur la tuile pour saboter en mode Alliance.`,
        type: 'info',
      });
      continue;
    }

    const cibleM =
      machinesSurCase.find((m) => m.id === action.machineCible) ||
      machinesSurCase[0];

    etat.stats.machinesSabotees += 1;
    if (etat.variante.effetSaboter === 'immobiliser_sur_place') {
      cibleM.neutraliseeCeTour = true;
      etat.journal.push({
        id: `sab-imm-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `J${joueur + 1} enraye ${cibleM.nom} sur ${etat.cases[pion.caseId]?.nom} (immobilisée ce tour) !`,
        gestePhysique: `Couchez la figurine ${cibleM.nom} sur le flanc sur la ${etat.cases[pion.caseId]?.nomPhysique} : elle ne coupera pas d'arbre ce tour.`,
        type: 'defenseur',
      });
    } else {
      cibleM.caseId = null;
      cibleM.cibleDeclaree = null;
      cibleM.neutraliseeCeTour = true;
      etat.journal.push({
        id: `sab-ok-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `J${joueur + 1} sabote ${cibleM.nom} et la renvoie au Chantier !`,
        gestePhysique: `Retirez la figurine ${cibleM.nom} du plateau et replacez-la dans la Réserve (Chantier).`,
        type: 'defenseur',
      });
    }
  }

  // 4. Exécuter Replanter (si activé par la variante)
  if (etat.variante.actionReplanterActive) {
    for (const { joueur, action } of actionsEtape) {
      if (action.type !== 'replanter') continue;
      const pion = etat.defenseurs.find((d) => d.id === action.pionId);
      if (!pion) continue;
      const machineActivePresente = etat.machines.some(
        (m) => m.caseId === pion.caseId && !m.neutraliseeCeTour
      );
      const plafond =
        etat.variante.id === 'v01_temoin_boucle_gagnante'
          ? (etat.cases[pion.caseId]?.foretsMax || 4) + 2
          : etat.cases[pion.caseId]?.foretsMax || 4;
      if (!machineActivePresente && etat.forets[pion.caseId] < plafond) {
        etat.forets[pion.caseId] += 1;
        etat.stats.foretsReplantees += 1;
        etat.journal.push({
          id: `rep-${etat.tourActuel}-${etape}-${pion.id}`,
          tour: etat.tourActuel,
          sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
          message: `J${joueur + 1} replante +1 Forêt sur ${etat.cases[pion.caseId]?.nom} (${etat.forets[pion.caseId]} arbres).`,
          gestePhysique: `Prenez 1 pion Forêt en bois dans la réserve et posez-le sur la ${etat.cases[pion.caseId]?.nomPhysique}.`,
          type: 'defenseur',
        });
      }
    }
  }

  return etat;
}

// Apprentissage sur la Piste Tactique (2..12) et la Piste Machine (0..5)
export function appliquerApprentissagePistes(
  etat: EtatJeuV01,
  somme: number,
  ecart: number,
  succesCoupe: boolean
): void {
  if (etat.variante.rythmeApprentissage === 'aucun') return;

  // 1. Piste Tactique (2..12) : succès rapproche de 7, échec éloigne de 7
  let cibleSomme = somme;
  if (succesCoupe) {
    if (somme < 7) cibleSomme = somme + 1;
    else if (somme > 7) cibleSomme = somme - 1;
  } else {
    if (somme <= 7 && somme > 2) cibleSomme = somme - 1;
    else if (somme > 7 && somme < 12) cibleSomme = somme + 1;
  }

  if (cibleSomme !== somme) {
    const tCourante = etat.pisteTactique[somme];
    const tVoisine = etat.pisteTactique[cibleSomme];
    etat.pisteTactique[somme] = tVoisine;
    etat.pisteTactique[cibleSomme] = tCourante;

    if (succesCoupe) etat.stats.apprentissagesPositifs += 1;
    else etat.stats.apprentissagesNegatifs += 1;

    etat.mouvementsApprentissageTour.push({
      piste: 'tactique',
      deCase: somme,
      versCase: cibleSomme,
      element: NOMS_TACTIQUES[tCourante],
      verdict: succesCoupe ? 'succes_coupe' : 'echec_parade',
      explicationPhysique: `Sur la Piste Tactique, échangez la tuile de la case ${somme} (${NOMS_TACTIQUES[tCourante]}) avec celle de la case ${cibleSomme} (${NOMS_TACTIQUES[tVoisine]}).`,
    });
  }

  // 2. Piste Machine (0..5) : l'écart 1 est le plus fréquent (10/36), 5 le plus rare (2/36)
  // Succès rapproche de la case 1 ; échec recule vers 5 (ou 0 si en 1)
  let cibleEcart = ecart;
  if (succesCoupe) {
    if (ecart > 1) cibleEcart = ecart - 1;
    else if (ecart === 0) cibleEcart = 1;
  } else {
    if (ecart < 5) cibleEcart = ecart + 1;
  }

  if (cibleEcart !== ecart) {
    const mCourante = etat.pisteMachine[ecart];
    const mVoisine = etat.pisteMachine[cibleEcart];
    etat.pisteMachine[ecart] = mVoisine;
    etat.pisteMachine[cibleEcart] = mCourante;

    etat.mouvementsApprentissageTour.push({
      piste: 'machine',
      deCase: ecart,
      versCase: cibleEcart,
      element: `Machine M${mCourante}`,
      verdict: succesCoupe ? 'succes_coupe' : 'echec_parade',
      explicationPhysique: `Sur la Piste Machine, échangez la carte de la case ${ecart} (M${mCourante}) avec celle de la case ${cibleEcart} (M${mVoisine}).`,
    });
  }
}

// Ciblage et déplacement des Machines au milieu du tour (sans coupe immédiate, sauf en mode deux_vagues_completes)
export function executerCiblageMachines(
  etatOrigine: EtatJeuV01,
  indicesLancers?: number[],
  couperImmediatement = false
): EtatJeuV01 {
  const etat = clonerEtatJeu(etatOrigine);
  etat.lancersReveles = true;

  const indices =
    indicesLancers || etat.lancersSecretsDuTour.map((_, idx) => idx);

  for (const idx of indices) {
    const lancer = etat.lancersSecretsDuTour[idx];
    if (!lancer) continue;

    const tactique = etat.pisteTactique[lancer.somme];
    const machineId = etat.pisteMachine[lancer.ecart];
    const machine = etat.machines.find((m) => m.id === machineId);
    if (!machine) continue;

    // Si la Machine a été sabotée à la 1re action, le lancer la remet en jeu à la Lisière ou échoue
    if (machine.neutraliseeCeTour && machine.caseId !== null) {
      etat.journal.push({
        id: `m-skip-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_ciblage_machines',
        message: `Dés [${lancer.d1}+${lancer.d2}=${lancer.somme}, écart ${lancer.ecart}] → ${machine.nom} est immobilisée ce tour et ne bouge pas.`,
        gestePhysique: `${machine.nom} étant couchée, elle ignore cet ordre.`,
        type: 'machine',
      });
      continue;
    }

    machine.neutraliseeCeTour = false;
    const caseCible = calculerCibleMachine(
      etat,
      machine,
      tactique,
      lancer.joueurObservateur
    );
    const provenance =
      machine.caseId === null
        ? 'le Chantier (Réserve)'
        : etat.cases[machine.caseId]?.nom || `Case ${machine.caseId}`;

    machine.caseId = caseCible;
    machine.cibleDeclaree = caseCible;
    machine.tactiqueDeclaree = tactique;

    const nomCible = etat.cases[caseCible]?.nom || `Case ${caseCible}`;
    const nomPhysCible =
      etat.cases[caseCible]?.nomPhysique || `Tuile ${caseCible}`;

    etat.journal.push({
      id: `m-cible-${etat.tourActuel}-${idx}`,
      tour: etat.tourActuel,
      sousPhase: 'resolution_ciblage_machines',
      message: `Dés J${lancer.joueurObservateur + 1} [${lancer.d1}, ${lancer.d2}] : Somme ${lancer.somme} (${NOMS_TACTIQUES[tactique]}) · Écart ${lancer.ecart} (${machine.nom}) → ${provenance} vers ${nomCible}.`,
      gestePhysique: `Prenez la figurine ${machine.nom} depuis ${provenance} et posez-la sur la ${nomPhysCible} (elle menace d'abattre 1 Forêt).`,
      type: 'machine',
    });

    if (couperImmediatement) {
      if (caseEstProtegeeContreCoupe(etat, caseCible)) {
        etat.stats.coupesEviteesParProtection += 1;
        etat.journal.push({
          id: `m-parade-vague-${etat.tourActuel}-${idx}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_ciblage_machines',
          message: `Parade réussie sur ${nomCible} : les Défenseurs bloquent la coupe de ${machine.nom} !`,
          gestePhysique: `La tuile étant protégée, aucun pion Forêt n'est retiré.`,
          type: 'defenseur',
        });
        appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, false);
      } else if (etat.forets[caseCible] > 0) {
        etat.forets[caseCible] -= 1;
        etat.stats.arbresCoupes += 1;
        etat.journal.push({
          id: `m-coupe-vague-${etat.tourActuel}-${idx}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_ciblage_machines',
          message: `${machine.nom} abat 1 Forêt sur ${nomCible} (reste ${etat.forets[caseCible]}).`,
          gestePhysique: `Retirez 1 pion Forêt en bois de la ${nomPhysCible}.`,
          type: 'coupe',
        });
        appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, true);
      }
    }
  }

  return etat;
}

// Coupe des Forêts après les 2es actions et apprentissage sur les deux pistes
export function executerCoupesEtApprentissageFinTour(
  etatOrigine: EtatJeuV01
): EtatJeuV01 {
  const etat = clonerEtatJeu(etatOrigine);
  etat.mouvementsApprentissageTour = [];

  for (let idx = 0; idx < etat.lancersSecretsDuTour.length; idx++) {
    const lancer = etat.lancersSecretsDuTour[idx];
    const machineId = etat.pisteMachine[lancer.ecart];
    const machine = etat.machines.find((m) => m.id === machineId);

    if (!machine || machine.caseId === null || machine.neutraliseeCeTour) {
      // La Machine a été sabotée avant de pouvoir couper -> Échec pour le Méchant, apprentissage négatif
      etat.journal.push({
        id: `coupe-sab-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_coupe_et_apprentissage',
        message: `${machine?.nom || 'Machine'} neutralisée avant la coupe : le Méchant recule cette combinaison sur ses pistes.`,
        gestePhysique: `La Machine désignée au lancer ${idx + 1} ayant été neutralisée, faites reculer sa tuile Tactique (case ${lancer.somme}) et sa carte Machine (case ${lancer.ecart}).`,
        type: 'apprentissage',
      });
      appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, false);
      continue;
    }

    const caseId = machine.caseId;
    const nomCase = etat.cases[caseId]?.nom || `Case ${caseId}`;
    const nomPhys = etat.cases[caseId]?.nomPhysique || `Tuile ${caseId}`;

    if (caseEstProtegeeContreCoupe(etat, caseId)) {
      etat.stats.coupesEviteesParProtection += 1;
      etat.journal.push({
        id: `coupe-prot-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_coupe_et_apprentissage',
        message: `Protection sur ${nomCase} : ${machine.nom} est bloquée par les Défenseurs et n'abat aucun arbre !`,
        gestePhysique: `Les Défenseurs en posture Bouclier sur la ${nomPhys} empêchent ${machine.nom} de couper. Éloignez la tuile Tactique (case ${lancer.somme}) du 7.`,
        type: 'defenseur',
      });
      appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, false);
    } else if (etat.forets[caseId] > 0) {
      etat.forets[caseId] -= 1;
      etat.stats.arbresCoupes += 1;
      etat.journal.push({
        id: `coupe-abattage-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_coupe_et_apprentissage',
        message: `${machine.nom} coupe 1 Forêt sur ${nomCase} (reste ${etat.forets[caseId]} Forêts).`,
        gestePhysique: `Retirez 1 pion Forêt en bois de la ${nomPhys}. Le Méchant apprend : rapprochez sa tuile Tactique (case ${lancer.somme}) du 7 et sa carte Machine (case ${lancer.ecart}) du 1.`,
        type: 'coupe',
      });
      appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, true);
    } else {
      // Case déjà rasée
      appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, false);
    }
  }

  return etat;
}

// Passage au tour suivant ou fin de partie
export function passerAuTourSuivant(etatOrigine: EtatJeuV01): EtatJeuV01 {
  const etat = clonerEtatJeu(etatOrigine);
  const totalForetsRestantes = etat.forets.reduce((a, b) => a + b, 0);

  if (etat.tourActuel >= etat.variante.nbTours || totalForetsRestantes === 0) {
    etat.sousPhase = 'fin_de_partie';
    etat.guidePhysiqueActuel = construireGuidePhysique(
      'fin_de_partie',
      etat.variante,
      0,
      etat.tourActuel
    );
    return etat;
  }

  etat.tourActuel += 1;
  etat.joueurActifProgrammation = 0;
  for (const d of etat.defenseurs) {
    d.postureProtection = false;
  }
  for (const m of etat.machines) {
    m.cibleDeclaree = null;
    m.tactiqueDeclaree = null;
    m.neutraliseeCeTour = false;
  }
  for (let j = 0; j < etat.variante.nbJoueurs; j++) {
    etat.programmations[j] = [];
  }

  const tirage = genererLancersSecretsTour(
    etat.variante.nbJoueurs,
    etat.etatRng
  );
  etat.lancersSecretsDuTour = tirage.lancers;
  etat.etatRng = tirage.nextState;
  etat.lancersReveles =
    etat.variante.modeResolution === 'machines_avant_actions';

  etat.sousPhase =
    etat.variante.modeResolution === 'machines_avant_actions'
      ? 'resolution_ciblage_machines'
      : 'programmation_1';

  etat.guidePhysiqueActuel = construireGuidePhysique(
    etat.sousPhase,
    etat.variante,
    0,
    etat.tourActuel
  );

  etat.journal.push({
    id: `tour-start-${etat.tourActuel}`,
    tour: etat.tourActuel,
    sousPhase: etat.sousPhase,
    message: `Début du Tour ${etat.tourActuel}/${etat.variante.nbTours} — Nouveaux lancers 2D6 sous les gobelets.`,
    gestePhysique: `Redressez tous les pions Défenseurs et lancez 2D6 sous chacun des ${etat.variante.nbJoueurs} gobelets.`,
    type: 'info',
  });

  return etat;
}

// Avance d'un cran dans la machine à états de résolution d'un tour (pour Proto et Démo)
export function avancerSousPhaseResolution(etatOrigine: EtatJeuV01): EtatJeuV01 {
  let etat = clonerEtatJeu(etatOrigine);
  const { modeProgrammation, modeResolution } = etat.variante;

  if (etat.sousPhase === 'resolution_actions_1') {
    etat = executerActionsDefenseursEtape(etat, 1);
    if (modeResolution === 'machines_avant_actions') {
      etat.sousPhase =
        modeProgrammation === 'un_seul_ordre'
          ? 'resolution_coupe_et_apprentissage'
          : 'resolution_actions_2';
    } else {
      etat.sousPhase = 'resolution_ciblage_machines';
    }
  } else if (etat.sousPhase === 'resolution_ciblage_machines') {
    if (modeResolution === 'deux_vagues_completes') {
      const moitie = Math.ceil(etat.lancersSecretsDuTour.length / 2);
      const indicesVague1 = Array.from({ length: moitie }, (_, i) => i);
      etat = executerCiblageMachines(etat, indicesVague1, true);
      etat.sousPhase = 'resolution_actions_2';
    } else {
      etat = executerCiblageMachines(etat, undefined, false);
      if (modeProgrammation === '2e_apres_ciblage') {
        etat.joueurActifProgrammation = 0;
        etat.sousPhase = 'programmation_2';
      } else if (modeProgrammation === 'un_seul_ordre') {
        etat.sousPhase = 'resolution_coupe_et_apprentissage';
      } else if (modeResolution === 'machines_avant_actions') {
        etat.sousPhase = 'programmation_1';
      } else {
        etat.sousPhase = 'resolution_actions_2';
      }
    }
  } else if (etat.sousPhase === 'resolution_actions_2') {
    etat = executerActionsDefenseursEtape(etat, 2);
    if (modeResolution === 'deux_vagues_completes') {
      const moitie = Math.ceil(etat.lancersSecretsDuTour.length / 2);
      const indicesVague2 = Array.from(
        { length: etat.lancersSecretsDuTour.length - moitie },
        (_, i) => moitie + i
      );
      etat = executerCiblageMachines(etat, indicesVague2, true);
      etat.sousPhase = 'bilan_tour';
    } else {
      etat.sousPhase = 'resolution_coupe_et_apprentissage';
    }
  } else if (etat.sousPhase === 'resolution_coupe_et_apprentissage') {
    etat = executerCoupesEtApprentissageFinTour(etat);
    etat.sousPhase = 'bilan_tour';
  } else if (etat.sousPhase === 'bilan_tour') {
    etat = passerAuTourSuivant(etat);
  }

  etat.guidePhysiqueActuel = construireGuidePhysique(
    etat.sousPhase,
    etat.variante,
    etat.joueurActifProgrammation,
    etat.tourActuel
  );
  return etat;
}

export function calculerPourcentageForetSauvee(etat: EtatJeuV01): number {
  const restant = etat.forets.reduce((a, b) => a + b, 0);
  if (etat.foretsInitialesTotales <= 0) return 0;
  return Math.round((restant / etat.foretsInitialesTotales) * 1000) / 10;
}

// Génère le livret de règles physiques dynamique adapté à la variante active
export function genererLivretPhysiqueVariante(variante: VariantV01): {
  section: string;
  materielConcerne: string;
  texteRegle: string;
}[] {
  return [
    {
      section: '1. Matériel & Mise en place sur la table',
      materielConcerne: `1 Tuile Cœur Central (${variante.foretsCoeur} arbres), ${variante.nbJoueurs} Tuiles Secteur (${variante.foretsParCaseSecteur} arbres par case), ${variante.nbJoueurs * variante.defenseursParJoueur} Pions Défenseurs, 6 Figurines Machines (M0 à M5).`,
      texteRegle: `Posez la Tuile Cœur au centre avec ${variante.foretsCoeur} pions Forêt en bois. Disposez autour d'elle ${variante.nbJoueurs} Tuiles Secteur (chacune comporte une Clairière Intérieure et une Lisière Extérieure avec ${variante.foretsParCaseSecteur} Forêts chacune). Chaque joueur place ses ${variante.defenseursParJoueur} pions Défenseurs dans sa Clairière. Placez ${variante.machinesInitiales} figurines Machines sur les Lisières et les ${6 - variante.machinesInitiales} autres dans le Chantier (Réserve).`,
    },
    {
      section: '2. Les Deux Pistes Publiques du Méchant',
      materielConcerne:
        'Plateau Tête du Méchant : Piste Tactique (cases 2 à 12) + Piste Machine (cases 0 à 5) + 2D6 par joueur sous gobelet.',
      texteRegle:
        'Au début de chaque tour, chaque joueur lance 2D6 sous son gobelet et les consulte en secret. La SOMME des 2 dés (2 à 12) désigne la tuile Tactique que suivra la Machine ; l’ÉCART entre les 2 dés (0 à 5) désigne la figurine Machine qui s’activera. Interdiction de révéler ses chiffres à voix haute.',
    },
    {
      section: '3. Phase de Programmation & Déduction autour de la table',
      materielConcerne:
        'Cartes Action du Peuple posées sur les emplacements « Action I » et « Action II ».',
      texteRegle:
        variante.modeProgrammation === 'alternee_1_par_1'
          ? 'Faites un premier tour de table horaire où chaque joueur programme l’Action I de ses Défenseurs, puis un second tour de table pour programmer l’Action II.'
          : variante.modeProgrammation === '2e_apres_ciblage'
          ? 'Chaque joueur programme d’abord uniquement l’Action I de ses Défenseurs. L’Action II sera programmée au milieu du tour après le déplacement des Machines.'
          : variante.modeProgrammation === 'un_seul_ordre'
          ? 'À tour de rôle dans le sens horaire, chaque joueur programme 1 seule carte Action pour chacun de ses Défenseurs.'
          : 'À tour de rôle dans le sens horaire, chaque joueur programme les emplacements « Action I » et « Action II » de ses Défenseurs. Observez attentivement vers quelles tuiles vos coéquipiers dirigent leurs pions pour déduire les menaces qu’ils ont vues sous leur gobelet !',
    },
    {
      section: '4. Actions physiques des Défenseurs',
      materielConcerne: 'Pions Défenseurs, Figurines Machines, Pions Forêt en bois.',
      texteRegle: [
        `• SE DÉPLACER : Déplacez le pion Défenseur sur une tuile adjacente${variante.deplacementDoubleActif ? ' (ou à 2 tuiles de distance grâce au Déplacement Double)' : ''}.`,
        `• PROTÉGER LA CASE : Couchez votre pion sur son bouclier. ${
          variante.effetProteger === 'barrage_entree_et_coupe'
            ? 'Aucune Machine ne peut entrer sur cette tuile ni y couper de Forêt ce tour.'
            : variante.effetProteger === 'protection_collective'
            ? 'S’il y a au moins 2 Défenseurs en protection sur la tuile, toutes les coupes y sont bloquées.'
            : 'Empêche toute coupe de Forêt sur cette tuile lors de la phase d’abattage.'
        }`,
        `• SABOTER UNE MACHINE : ${
          variante.effetSaboter === 'alliance_requise'
            ? 'Exige au moins 2 Défenseurs présents sur la tuile : retirez 1 figurine Machine présente et remettez-la dans le Chantier.'
            : variante.effetSaboter === 'immobiliser_sur_place'
            ? 'Couchez 1 figurine Machine présente sur la tuile : elle reste sur place mais est neutralisée pour le reste du tour.'
            : 'Retirez 1 figurine Machine présente sur la tuile et remettez-la dans le Chantier (Réserve).'
        }`,
        ...(variante.actionReplanterActive
          ? [
              '• REPLANTER : S’il n’y a aucune Machine active sur la tuile, ajoutez 1 pion Forêt en bois depuis la réserve sur la tuile.',
            ]
          : []),
      ].join('\n'),
    },
    {
      section: '5. Séquence de Résolution & Apprentissage du Méchant',
      materielConcerne:
        'Figurines Machines, Pions Forêt en bois, Tuiles Tactiques (2–12) et Cartes Machine (0–5).',
      texteRegle:
        variante.modeResolution === 'deux_vagues_completes'
          ? 'Résolvez la Vague I (Action I des Défenseurs + moitié des gobelets 2D6 avec déplacement et coupe immédiate), puis la Vague II (Action II des Défenseurs + seconde moitié des gobelets 2D6 avec déplacement et coupe).'
          : variante.modeResolution === 'machines_avant_actions'
          ? 'Les gobelets 2D6 sont révélés d’emblée et les Machines se déplacent vers leurs cibles. Les Défenseurs résolvent ensuite leurs actions avant la coupe finale des Forêts.'
          : '1) Exécutez les 1res actions des Défenseurs. 2) Soulevez les gobelets 2D6 : déplacez chaque Machine désignée vers sa tuile cible selon sa Tactique (SANS couper d’arbre). 3) Exécutez les 2es actions des Défenseurs. 4) Chaque Machine non neutralisée sur une tuile non protégée abat 1 pion Forêt en bois. Enfin, sur les pistes du Méchant, rapprochez du centre (7 et 1) les tuiles ayant réussi à couper, et éloignez celles qui ont été contrées.',
    },
  ];
}
