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

// Ordre statistique monotone de la Piste Machine (du plus probable 10/36 au moins probable 2/36, avec 0 à côté de 3 à 6/36)
export const ORDRE_PISTE_MACHINE: number[] = [1, 2, 3, 0, 4, 5];

export const CODES_COURTS_BOTS: Record<
  string,
  { nomCourt: string; codePion: string }
> = {
  humain: { nomCourt: 'Moi', codePion: 'MOI' },
  deductif: { nomCourt: 'Bot Déd.', codePion: 'DÉD' },
  ismcts: { nomCourt: 'Bot MCTS', codePion: 'MCTS' },
  beam_rollout: { nomCourt: 'Bot Beam', codePion: 'BEAM' },
  expectimax_bayesien: { nomCourt: 'Bot Bayes', codePion: 'BAY' },
  glouton: { nomCourt: 'Bot Glout.', codePion: 'GLOU' },
  reflexe: { nomCourt: 'Bot Réfl.', codePion: 'RÉF' },
  hasard: { nomCourt: 'Bot Aléa', codePion: 'ALÉA' },
  boucle: { nomCourt: 'Bot Bouc.', codePion: 'BOUC' },
  inerte: { nomCourt: 'Bot Inerte', codePion: 'INER' },
};

export function formaterNomSiege(
  joueurIndex: number,
  sieges?: string[]
): { nomCourt: string; codePion: string; estHumain: boolean } {
  const defautBots = [
    'humain',
    'deductif',
    'expectimax_bayesien',
    'beam_rollout',
    'ismcts',
    'glouton',
  ];
  const typeSiege =
    sieges?.[joueurIndex] || defautBots[joueurIndex] || 'deductif';
  const info = CODES_COURTS_BOTS[typeSiege] || {
    nomCourt: typeSiege === 'humain' ? 'Moi' : `Bot ${typeSiege.slice(0, 4)}`,
    codePion:
      typeSiege === 'humain' ? 'MOI' : typeSiege.slice(0, 4).toUpperCase(),
  };

  if (typeSiege !== 'humain' && sieges) {
    const totalMemes = sieges.filter((s) => s === typeSiege).length;
    if (totalMemes > 1) {
      const rang =
        sieges.slice(0, joueurIndex).filter((s) => s === typeSiege).length + 1;
      return {
        nomCourt: `${info.nomCourt}${rang}`,
        codePion: `${info.codePion}${rang}`,
        estHumain: false,
      };
    }
  }

  return {
    nomCourt: info.nomCourt,
    codePion: info.codePion,
    estHumain: typeSiege === 'humain',
  };
}

export function estVariantePlacementV04(variante: VariantV01): boolean {
  return Boolean(
    variante.placementUniquementV04 || variante.version === '0.4'
  );
}

export const NOMS_TACTIQUES: Record<TactiqueType, string> = {
  cupidite: 'Cupidité (Plus boisée)',
  percee: 'Percée (Vers le Cœur)',
  opportunisme: 'Opportunisme (Moins gardée)',
  represailles: 'Représailles (Plus défendue)',
  acharnement: 'Acharnement (Coupe rase)',
};

export const DESCRIPTIONS_PHYSIQUES_TACTIQUES: Record<TactiqueType, string> = {
  cupidite:
    'La Machine cible la case accessible portant le plus grand nombre de pions Forêt en bois.',
  percee:
    'La Machine avance d’une case en direction du Cœur Central (ou reste sur le Cœur si elle y est déjà).',
  opportunisme:
    'La Machine cible la case boisée accessible la plus isolée des Défenseurs (moins de Défenseurs sur la case et ses voisines).',
  represailles:
    'La Machine cible la case boisée accessible comptant le plus de pions Défenseurs (en V0.4 optionnelle, peut forcer 1 Défenseur isolé).',
  acharnement:
    'Nouvelle tactique V0.4 : la Machine cible la case boisée ayant le MOINS d’arbres restants (> 0) afin d’achever et de raser complètement une clairière entamée.',
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

export const PISTE_TACTIQUE_V04_ACHARNEMENT: Record<number, TactiqueType> = {
  2: 'percee',
  3: 'acharnement',
  4: 'percee',
  5: 'opportunisme',
  6: 'cupidite',
  7: 'opportunisme',
  8: 'cupidite',
  9: 'acharnement',
  10: 'percee',
  11: 'cupidite',
  12: 'acharnement',
};

export const PISTE_TACTIQUE_V04_3_TACTIQUES: Record<number, TactiqueType> = {
  2: 'percee',
  3: 'cupidite',
  4: 'percee',
  5: 'opportunisme',
  6: 'cupidite',
  7: 'opportunisme',
  8: 'cupidite',
  9: 'percee',
  10: 'opportunisme',
  11: 'cupidite',
  12: 'percee',
};

export function creerPisteTactiqueInitialePourVariante(
  variante: VariantV01
): Record<number, TactiqueType> {
  if (estVariantePlacementV04(variante)) {
    const palette =
      variante.paletteTactiques ??
      variante.profilTactiquesV04 ??
      '4_tactiques_acharnement';
    if (palette === '3_tactiques_sans_represailles') {
      return { ...PISTE_TACTIQUE_V04_3_TACTIQUES };
    }
    if (
      palette === '4_tactiques_represailles_perce_1' ||
      palette === '4_tactiques_represailles_contours'
    ) {
      return { ...PISTE_TACTIQUE_INITIALE };
    }
    return { ...PISTE_TACTIQUE_V04_ACHARNEMENT };
  }
  return { ...PISTE_TACTIQUE_INITIALE };
}

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
    id: 'v04_socle_placement_coalition',
    nom: 'V0.4 Socle — Pur Placement, Barrage Annulation & Coalition Sur Place (4 Tactiques Acharnement)',
    version: '0.4',
    description:
      'Noyau de référence V0.4 sur Plateau Double Face : les Défenseurs peuvent uniquement se déplacer (1 case). Toute case avec ≥ 1 Défenseur annule le déplacement de la Machine qui la cible ; ≥ 2 Défenseurs de Peuples différents sur la case d’une Machine bloquent sa coupe.',
    origine: 'socle',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 94,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_coalition_chantier',
    nom: 'V0.4 Coalition Démantelante (Renvoi au Chantier à 2 Peuples) & Double Plateau',
    version: '0.4',
    description:
      'Variante V0.4 où réunir 2 Défenseurs de Peuples différents sur la case d’une Machine non seulement bloque sa coupe, mais démonte la Machine et la renvoie au Chantier.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 92,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'renvoyer_au_chantier',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 5,
  },
  {
    id: 'v04_3_tactiques_epure',
    nom: 'V0.4 Épurée à 3 Tactiques (Cupidité, Percée, Opportunisme) & Barrage Strict',
    version: '0.4',
    description:
      'Évalue l’option à 3 Tactiques uniquement (sans Représailles ni Acharnement) sur la piste 2–12, combinée au barrage d’annulation stricte et à la coalition sur place.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 90,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '3_tactiques_sans_represailles',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_sentiers_cols_report',
    nom: 'V0.4 Clairières & Sentiers (3 Cols) + Report des Machines sur Cible Libre',
    version: '0.4',
    description:
      'Sur le graphe organique à 3 Cols de Vallée, verrouiller un Col avec 1 Défenseur force la Machine à se reporter sur une autre clairière voisine libre.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 91,
    bandeSante: 'vert',
    geometriePlateau: 'clairieres_sentiers',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'report_cible_libre',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_hex19_coalition_chantier',
    nom: 'V0.4 Grille Hexagonale 19 Cases + Coalition Renvoi au Chantier',
    version: '0.4',
    description:
      'Teste le pur placement sur les 19 hexagones (2 couronnes) : les 6 connexions par hexagone facilitent les coalitions à 2 Peuples pour renvoyer les Machines au Chantier.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 89,
    bandeSante: 'vert',
    geometriePlateau: 'hex_couronne_19',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'renvoyer_au_chantier',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_reactive_apres_ciblage',
    nom: 'V0.4 Programmation Réactive (Déplacement I Barrage → Machines → Déplacement II Coalition)',
    version: '0.4',
    description:
      'Les joueurs programment leur Déplacement I sur la foi de leurs 2D6 pour barrer l’entrée aux Machines ; les Machines bougent ; puis les joueurs programment le Déplacement II à vue pour former les coalitions.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 87,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: '2e_apres_ciblage',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'report_cible_libre',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 5,
  },
  {
    id: 'v04_represailles_perce_barrage',
    nom: 'V0.4 Représailles Brise-Barrage (Force 1 Défenseur isolé) & Jeton Éclaireur',
    version: '0.4',
    description:
      'Évalue la variante où la tactique Représailles peut entrer sur une case tenue par 1 seul Défenseur isolé (exigeant 2 Défenseurs pour barrer), compensée par le Jeton Éclaireur.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 88,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_represailles_perce_1',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: true,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_coalition_graduee_3_peuples',
    nom: 'V0.4 Coalition Graduée (2 Peuples = Bloque sur place · 3 Peuples = Chantier)',
    version: '0.4',
    description:
      '2 Peuples différents sur la case d’une Machine empêchent sa coupe ; réunir 3 Peuples différents la démonte vers le Chantier. Calibré pour 4 à 6 joueurs.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 90,
    bandeSante: 'vert',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'chantier_a_3_peuples',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 5,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 5,
  },
  {
    id: 'v04_sentiers_goulots_contrarie',
    nom: 'V0.4 Sentiers à Goulots (15 Zones, Cap. 1) & Mouvement Contrarié en Cascade',
    version: '0.4',
    description:
      'Sur le graphe à 15 zones doté de 4 Cols Goulots à capacité unique (1 Défenseur max), un pion qui tente d’entrer dans un goulot déjà occupé voit son 1er mouvement contrarié et son 2e mouvement automatiquement annulé !',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 93,
    bandeSante: 'vert',
    geometriePlateau: 'sentiers_goulots_15',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    regleMouvementContrarie: 'goulot_sentier_strict',
    capaciteMaxCase: 2,
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_compact_9_saturation',
    nom: 'V0.4 Micro-Plateau Compact (9 Zones) & Saturation de Clairière (Max 2 Défenseurs)',
    version: '0.4',
    description:
      'Plateau hyper-dense de 9 zones où aucune clairière ne peut accueillir plus de 2 Défenseurs simultanément : génère une tension maximale sur chaque choix de placement et force la coordination.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 91,
    bandeSante: 'vert',
    geometriePlateau: 'compact_9_cases',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'renvoyer_au_chantier',
    paletteTactiques: '4_tactiques_acharnement',
    regleMouvementContrarie: 'capacite_max_tuile',
    capaciteMaxCase: 2,
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_reseau_etendu_21_6j',
    nom: 'V0.4 Grand Réseau Étendu (21 Zones · 5–6 Joueurs · 3 Défenseurs/J)',
    version: '0.4',
    description:
      'Grand plateau à 21 clairières et sous-bois médians conçu pour 5 et 6 joueurs avec 3 Défenseurs par joueur : valorise les plans anticipés à plusieurs coups.',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 90,
    bandeSante: 'vert',
    geometriePlateau: 'reseau_etendu_21',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    regleMouvementContrarie: 'capacite_max_tuile',
    capaciteMaxCase: 3,
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 6,
    defenseursParJoueur: 3,
    foretsParCaseSecteur: 4,
    foretsCoeur: 7,
    nbTours: 5,
    machinesInitiales: 5,
  },
  {
    id: 'v04_interception_machine',
    nom: 'V0.4 Interception par Machine Active & Assauts Coordonnés (Option 4)',
    version: '0.4',
    description:
      'Les clairières n’ont aucun plafond arbitraire entre alliés. En revanche, entrer sur une clairière tenue par une Machine active nécessite un assaut coordonné d’au moins deux peuples distincts : tout défenseur solitaire est intercepté et repoussé, brisant son plan de mouvement !',
    origine: 'exploration',
    statutViabilite: 'viable',
    scoreInteretDernierTest: 94,
    bandeSante: 'vert',
    geometriePlateau: 'clairieres_sentiers',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    regleMouvementContrarie: 'interception_machine',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  },
  {
    id: 'v04_temoin_sous_effectif_1_pion',
    nom: 'V0.4 Témoin Éliminé — Sous-Effectif à 1 Seul Défenseur par Joueur & 1 Ordre',
    version: '0.4',
    description:
      'Variante de stress-test V0.4 avec 1 seul pion Défenseur par joueur, 1 seul déplacement par tour et 6 Machines à portée globale : impossible de barrer et de former des coalitions simultanément.',
    origine: 'exploration',
    statutViabilite: 'eliminee',
    motifElimination:
      'Échec Viabilité 3.1 : Sous-effectif critique pour former des coalitions à 2 Peuples différents tout en maintenant des barrages d’entrée face à 6 Machines.',
    scoreInteretDernierTest: 24,
    bandeSante: 'rouge',
    geometriePlateau: 'hex_couronne_19',
    modeProgrammation: 'un_seul_ordre',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'report_cible_libre',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_represailles_perce_1',
    effetProteger: 'protection_collective',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'plateau_entier',
    jetonEclaireurActif: false,
    nbJoueurs: 3,
    defenseursParJoueur: 1,
    foretsParCaseSecteur: 2,
    foretsCoeur: 3,
    nbTours: 5,
    machinesInitiales: 6,
  },
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

  // 4. ARCHITECTURE V0.4 : MICRO-PLATEAU COMPACT 9 CASES (1 Cœur + 4 Intérieurs + 4 Lisières)
  if (geom === 'compact_9_cases') {
    const cases: CasePlateau[] = [];
    cases.push({
      id: 0,
      nom: 'Cœur Sacré',
      nomPhysique: 'Micro-Plateau 9 — Cœur Sacré',
      secteurJoueur: null,
      anneau: 'coeur',
      voisins: [1, 2, 3, 4],
      foretsMax: variante.foretsCoeur,
      x: 0,
      y: 0,
      formeRendu: 'clairiere',
      rayonRendu: 44,
    });
    const dirs = ['Nord', 'Est', 'Sud', 'Ouest'];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 - Math.PI / 2;
      const rInt = 96;
      const iPrec = 1 + ((i + 3) % 4);
      const iSuiv = 1 + ((i + 1) % 4);
      const lisA = 5 + i;
      const lisB = 5 + ((i + 3) % 4);
      cases.push({
        id: 1 + i,
        nom: `Clairière ${dirs[i]}`,
        nomPhysique: `Clairière Intérieure ${dirs[i]}`,
        secteurJoueur: i % J,
        anneau: 'interieur',
        voisins: [0, iPrec, iSuiv, lisA, lisB],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rInt),
        y: Math.round(Math.sin(angle) * rInt),
        formeRendu: 'clairiere',
        rayonRendu: 38,
      });
    }
    const dirsLis = ['Nord-Est', 'Sud-Est', 'Sud-Ouest', 'Nord-Ouest'];
    for (let l = 0; l < 4; l++) {
      const angle = (l * Math.PI) / 2 + Math.PI / 4 - Math.PI / 2;
      const rLis = 190;
      const intA = 1 + l;
      const intB = 1 + ((l + 1) % 4);
      const lPrec = 5 + ((l + 3) % 4);
      const lSuiv = 5 + ((l + 1) % 4);
      cases.push({
        id: 5 + l,
        nom: `Lisière ${dirsLis[l]}`,
        nomPhysique: `Lisière Extérieure ${dirsLis[l]}`,
        secteurJoueur: l % J,
        anneau: 'lisiere',
        voisins: [intA, intB, lPrec, lSuiv],
        foretsMax: Math.max(2, variante.foretsParCaseSecteur - 1),
        x: Math.round(Math.cos(angle) * rLis),
        y: Math.round(Math.sin(angle) * rLis),
        formeRendu: 'clairiere',
        rayonRendu: 35,
      });
    }
    return cases;
  }

  // 5. ARCHITECTURE V0.4 : SENTIERS À GOULOTS D'ÉTRANGLEMENT 15 CASES (Capacité 1 sur les cols)
  if (geom === 'sentiers_goulots_15') {
    const cases: CasePlateau[] = [];
    cases.push({
      id: 0,
      nom: 'Sanctuaire Cœur',
      nomPhysique: 'Goulots 15 — Clairière du Cœur',
      secteurJoueur: null,
      anneau: 'coeur',
      voisins: [1, 2, 3, 4],
      foretsMax: variante.foretsCoeur,
      x: 0,
      y: 0,
      formeRendu: 'clairiere',
      rayonRendu: 42,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 - Math.PI / 2;
      const rInt = 86;
      const goulot = 5 + i;
      const iPrec = 1 + ((i + 3) % 4);
      const iSuiv = 1 + ((i + 1) % 4);
      cases.push({
        id: 1 + i,
        nom: `Sous-Bois ${['Nord', 'Est', 'Sud', 'Ouest'][i]}`,
        nomPhysique: `Sous-Bois Intérieur ${['Nord', 'Est', 'Sud', 'Ouest'][i]}`,
        secteurJoueur: i % J,
        anneau: 'interieur',
        voisins: [0, iPrec, iSuiv, goulot],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rInt),
        y: Math.round(Math.sin(angle) * rInt),
        formeRendu: 'clairiere',
        rayonRendu: 35,
      });
    }
    for (let g = 0; g < 4; g++) {
      const angle = (g * Math.PI) / 2 - Math.PI / 2;
      const rGoulot = 150;
      const intRelie = 1 + g;
      const lisA = 9 + g;
      const lisB = 9 + ((g + 1) % 6);
      cases.push({
        id: 5 + g,
        nom: `Goulot ${['Nord', 'Est', 'Sud', 'Ouest'][g]} (Cap. 1)`,
        nomPhysique: `Col Étroit ${['Nord', 'Est', 'Sud', 'Ouest'][g]} — Capacité 1`,
        secteurJoueur: g % J,
        anneau: 'interieur',
        voisins: [intRelie, lisA, lisB],
        foretsMax: Math.max(2, Math.round(variante.foretsParCaseSecteur * 0.75)),
        x: Math.round(Math.cos(angle) * rGoulot),
        y: Math.round(Math.sin(angle) * rGoulot),
        formeRendu: 'clairiere',
        rayonRendu: 26,
      });
    }
    for (let l = 0; l < 6; l++) {
      const angle = (l * Math.PI) / 3 - Math.PI / 2;
      const rLis = 224;
      const goulotA = 5 + (l % 4);
      const goulotB = 5 + ((l + 3) % 4);
      const lPrec = 9 + ((l + 5) % 6);
      const lSuiv = 9 + ((l + 1) % 6);
      cases.push({
        id: 9 + l,
        nom: `Orée L${l + 1}`,
        nomPhysique: `Lisière Périphérique L${l + 1}`,
        secteurJoueur: l % J,
        anneau: 'lisiere',
        voisins: [goulotA, goulotB, lPrec, lSuiv],
        foretsMax: Math.max(2, variante.foretsParCaseSecteur - 1),
        x: Math.round(Math.cos(angle) * rLis),
        y: Math.round(Math.sin(angle) * rLis),
        formeRendu: 'clairiere',
        rayonRendu: 32,
      });
    }
    return cases;
  }

  // 6. ARCHITECTURE V0.4 : GRAND RÉSEAU ÉTENDU 21 CASES (Pour 5-6 joueurs)
  if (geom === 'reseau_etendu_21') {
    const cases: CasePlateau[] = [];
    cases.push({
      id: 0,
      nom: 'Grand Sanctuaire Cœur',
      nomPhysique: 'Grand Réseau 21 — Sanctuaire Ancien',
      secteurJoueur: null,
      anneau: 'coeur',
      voisins: [1, 2, 3, 4, 5, 6],
      foretsMax: variante.foretsCoeur + 1,
      x: 0,
      y: 0,
      formeRendu: 'clairiere',
      rayonRendu: 45,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      const rInt = 88;
      const iPrec = 1 + ((i + 5) % 6);
      const iSuiv = 1 + ((i + 1) % 6);
      const sbA = 7 + i;
      const sbB = 7 + ((i + 5) % 6);
      cases.push({
        id: 1 + i,
        nom: `Clairière C${i + 1}`,
        nomPhysique: `Clairière Intérieure ${i + 1}`,
        secteurJoueur: i % J,
        anneau: 'interieur',
        voisins: [0, iPrec, iSuiv, sbA, sbB],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rInt),
        y: Math.round(Math.sin(angle) * rInt),
        formeRendu: 'clairiere',
        rayonRendu: 34,
      });
    }
    for (let s = 0; s < 6; s++) {
      const angle = (s * Math.PI) / 3 + Math.PI / 6 - Math.PI / 2;
      const rMed = 156;
      const cA = 1 + s;
      const cB = 1 + ((s + 1) % 6);
      const lisA = 13 + (s % 8);
      const lisB = 13 + ((s + 1) % 8);
      cases.push({
        id: 7 + s,
        nom: `Sous-Bois M${s + 1}`,
        nomPhysique: `Sous-Bois Médian ${s + 1}`,
        secteurJoueur: (s + 2) % J,
        anneau: 'interieur',
        voisins: [cA, cB, lisA, lisB],
        foretsMax: variante.foretsParCaseSecteur,
        x: Math.round(Math.cos(angle) * rMed),
        y: Math.round(Math.sin(angle) * rMed),
        formeRendu: 'clairiere',
        rayonRendu: 32,
      });
    }
    for (let l = 0; l < 8; l++) {
      const angle = (l * Math.PI) / 4 - Math.PI / 2;
      const rLis = 228;
      const sbAss = 7 + (l % 6);
      const lPrec = 13 + ((l + 7) % 8);
      const lSuiv = 13 + ((l + 1) % 8);
      cases.push({
        id: 13 + l,
        nom: `Lisière L${l + 1}`,
        nomPhysique: `Lisière Profonde L${l + 1}`,
        secteurJoueur: l % J,
        anneau: 'lisiere',
        voisins: [sbAss, lPrec, lSuiv],
        foretsMax: Math.max(2, variante.foretsParCaseSecteur - 1),
        x: Math.round(Math.cos(angle) * rLis),
        y: Math.round(Math.sin(angle) * rLis),
        formeRendu: 'clairiere',
        rayonRendu: 30,
      });
    }
    return cases;
  }

  // 7. ARCHITECTURE HISTORIQUE V0.1/V0.2 : COURONNE MODULABLE (1 Cœur + 2×J cases)
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
  const estV04 = estVariantePlacementV04(variante);
  switch (sousPhase) {
    case 'observation_2d6':
      return {
        titreEtape: `Tour ${tourActuel} — 1. Coup d'œil secret sous les Gobelets 2D6`,
        composantsPhysiques: [
          `${variante.nbJoueurs} paires de dés 2D6`,
          `${variante.nbJoueurs} gobelets opaques`,
          'Plateau « Tête du Méchant » (Piste Tactique 2–12 & Piste Machine 1–2–3–0–4–5)',
        ],
        gesteSurTable:
          'Chaque joueur lance 2D6 sous son gobelet et regarde secrètement ses dés en silence. Repérez sur la Piste Tactique la case de votre SOMME (2 à 12) et sur la Piste Machine (1–2–3–0–4–5) la case de votre ÉCART (0 à 5).',
        regleDeReference:
          'Règle §1 — Information secrète : Aucun joueur ne peut nommer ses chiffres. Vos déplacements publics seront votre seul langage.',
      };
    case 'programmation_1':
      return {
        titreEtape: estV04
          ? `Tour ${tourActuel} — 2. Programmation publique des Déplacements (Joueur ${joueurActif + 1})`
          : `Tour ${tourActuel} — 2. Programmation sur table (Joueur ${joueurActif + 1})`,
        composantsPhysiques: estV04
          ? [
              `Pions Défenseurs du Joueur ${joueurActif + 1}`,
              'Emplacements de destination « Déplacement I » et « Déplacement II »',
            ]
          : [
              'Cartes Action du Peuple',
              'Emplacements physiques « Action I » et « Action II » devant soi',
              `Pions Défenseurs du Joueur ${joueurActif + 1}`,
            ],
        gesteSurTable: estV04
          ? `Joueur ${joueurActif + 1} : Annoncez publiquement la case adjacente visée par chacun de vos ${variante.defenseursParJoueur} Défenseurs (Déplacement I pour barrer l'entrée aux Machines, Déplacement II pour former une coalition à 2 Peuples).`
          : variante.modeProgrammation === 'alternee_1_par_1'
          ? `Joueur ${joueurActif + 1} : Choisissez 1 carte Action pour chacun de vos ${variante.defenseursParJoueur} Défenseurs et posez-la face visible sur l’emplacement « Action I ».`
          : `Joueur ${joueurActif + 1} : À votre tour de table, posez publiquement vos cartes sur les emplacements « Action I » et « Action II ».`,
        regleDeReference: estV04
          ? 'Règle V0.4 §2 — Pur Placement Public : Les Défenseurs ne font que se déplacer (1 case adjacente). Les coéquipiers observent vos choix pour déduire votre gobelet.'
          : 'Règle V0.1 §2 — Programmation séquentielle publique.',
      };
    case 'programmation_2':
      return {
        titreEtape: `Tour ${tourActuel} — 2bis. Programmation du 2e Déplacement (Joueur ${joueurActif + 1})`,
        composantsPhysiques: [
          `Pions Défenseurs du Joueur ${joueurActif + 1}`,
          'Emplacement « Déplacement II »',
        ],
        gesteSurTable: `Joueur ${joueurActif + 1} : Indiquez publiquement le 2e déplacement de vos Défenseurs afin de converger à 2 Peuples différents sur les cases occupées par des Machines.`,
        regleDeReference:
          'Règle §2bis — Second temps de programmation.',
      };
    case 'resolution_actions_1':
      return {
        titreEtape: estV04
          ? `Tour ${tourActuel} — 3. Exécution du 1er Déplacement (Barrages d'Entrée)`
          : `Tour ${tourActuel} — 3. Résolution des 1res Actions des Défenseurs`,
        composantsPhysiques: ['Pions Défenseurs en bois'],
        gesteSurTable: estV04
          ? 'Déplacez physiquement les pions Défenseurs selon leur Déplacement I. Rappel V0.4 : toute case contenant désormais au moins 1 Défenseur est BARRÉE et interdite d’entrée aux Machines !'
          : 'Appliquez les cartes de l’emplacement « Action I » (posées face visible lors de la programmation).',
        regleDeReference: estV04
          ? 'Règle V0.4 §3 — Barrage de position : ≥ 1 Défenseur sur une case interdit aux Machines d’y entrer.'
          : 'Règle V0.1 §3 — Premières actions.',
      };
    case 'resolution_ciblage_machines':
      return {
        titreEtape: `Tour ${tourActuel} — 4. Révélation des 2D6 & Déplacement des Machines (sans coupe)`,
        composantsPhysiques: [
          'Gobelets 2D6 soulevés',
          'Piste Tactique (2–12) & Piste Machine (1–2–3–0–4–5)',
          '6 Figurines Machines M0 à M5',
        ],
        gesteSurTable: estV04
          ? 'Soulevez tous les gobelets 2D6 ! Pour chaque paire de dés, identifiez la Machine (Écart) et sa Tactique (Somme). Si la case visée contient au moins 1 Défenseur, la Machine ne peut pas y entrer (son déplacement est annulé ou reporté selon la variante). Ne retirez aucun arbre maintenant !'
          : 'Soulevez tous les gobelets 2D6 ! Déplacez chaque figurine Machine désignée sur sa tuile cible, mais NE RETIREZ AUCUN ARBRE POUR L’INSTANT.',
        regleDeReference:
          'Règle V0.4 §4 — Déplacement des Machines : Interdiction d’entrer sur une case gardée par ≥ 1 Défenseur.',
      };
    case 'resolution_actions_2':
      return {
        titreEtape: estV04
          ? `Tour ${tourActuel} — 5. Exécution du 2e Déplacement (Formation des Coalitions)`
          : `Tour ${tourActuel} — 5. Résolution des 2es Actions des Défenseurs`,
        composantsPhysiques: [
          'Pions Défenseurs',
          'Figurines Machines sur les cases menacées',
        ],
        gesteSurTable: estV04
          ? 'Déplacez vos pions Défenseurs selon leur Déplacement II pour rejoindre les cases où se trouvent des Machines : il faut au moins 2 Défenseurs de Peuples (couleurs) différents sur la même case qu’une Machine pour bloquer sa coupe !'
          : 'Appliquez les secondes actions des Défenseurs.',
        regleDeReference: estV04
          ? 'Règle V0.4 §5 — Coalition Multi-Peuples : 2 Défenseurs de couleurs différentes sur la case d’une Machine neutralisent sa coupe.'
          : 'Règle V0.1 §5 — Secondes actions.',
      };
    case 'resolution_coupe_et_apprentissage':
      return {
        titreEtape: `Tour ${tourActuel} — 6. Coupe des Forêts & Apprentissage Statistique`,
        composantsPhysiques: [
          'Pions Forêt en bois vert',
          'Tuiles de la Piste Tactique (2–12)',
          'Tuiles de la Piste Machine (1–2–3–0–4–5)',
        ],
        gesteSurTable: estV04
          ? 'Pour chaque Machine appelée ce tour : si au moins 2 Défenseurs de Peuples différents occupent sa case, sa coupe est BLOQUÉE (et ses tuiles reculent sur les pistes). Sinon, elle abat 1 Forêt et ses tuiles avancent vers le 7 et vers la gauche de la piste 1–2–3–0–4–5 !'
          : 'Sur chaque tuile où se trouve une Machine non contrée, retirez 1 pion Forêt et permutez les pistes.',
        regleDeReference:
          'Règle V0.4 §6 — Bilan des Coalitions & Apprentissage Statistique.',
      };
    case 'bilan_tour':
      return {
        titreEtape: `Fin du Tour ${tourActuel} — Préparation du tour suivant`,
        composantsPhysiques: ['Gobelets 2D6'],
        gesteSurTable:
          'Les pions Défenseurs et Machines restent sur leurs cases actuelles. Tous les joueurs secouent leur gobelet 2D6 pour le tour suivant.',
        regleDeReference: 'Règle §7 — Fin de tour.',
      };
    case 'fin_de_partie':
      return {
        titreEtape: 'Fin de la Partie — Décompte des Forêts Préservées',
        composantsPhysiques: ['Pions Forêt en bois restants sur le plateau'],
        gesteSurTable:
          'Comptez les pions Forêt encore debout sur l’ensemble du plateau et rapportez ce total au nombre initial d’arbres.',
        regleDeReference: 'Règle §8 — Score coopératif de préservation.',
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
        postureProtection: estVariantePlacementV04(variante),
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
    pisteTactique: creerPisteTactiqueInitialePourVariante(variante),
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

// Compte le nombre de Peuples (joueurs) distincts présents sur une case
export function compterPeuplesDistinctsSurCase(
  etat: EtatJeuV01,
  caseId: number
): number {
  const joueurs = new Set<number>();
  for (const d of etat.defenseurs) {
    if (d.caseId === caseId) {
      joueurs.add(d.joueur);
    }
  }
  return joueurs.size;
}

// Vérifie si une case est protégée contre la coupe des Machines (Coalition >= 2 Peuples en V0.4, ou posture Bouclier en V0.1-V0.3)
export function caseEstProtegeeContreCoupe(
  etat: EtatJeuV01,
  caseId: number
): boolean {
  if (estVariantePlacementV04(etat.variante)) {
    return compterPeuplesDistinctsSurCase(etat, caseId) >= 2;
  }
  const defenseursEnProtection = etat.defenseurs.filter(
    (d) => d.caseId === caseId && d.postureProtection
  );
  if (etat.variante.effetProteger === 'protection_collective') {
    return defenseursEnProtection.length >= 2;
  }
  return defenseursEnProtection.length >= 1;
}

// Vérifie si une case est interdite d'entrée aux Machines (Barrage >= 1 Défenseur en V0.4)
export function caseEstBarreeEntree(
  etat: EtatJeuV01,
  caseId: number,
  tactique?: TactiqueType
): boolean {
  if (estVariantePlacementV04(etat.variante)) {
    const nbDef = etat.defenseurs.filter((d) => d.caseId === caseId).length;
    const palette =
      etat.variante.paletteTactiques ?? etat.variante.profilTactiquesV04;
    if (
      tactique === 'represailles' &&
      palette === '4_tactiques_represailles_perce_1'
    ) {
      return nbDef >= 2;
    }
    return nbDef >= 1;
  }
  if (etat.variante.effetProteger !== 'barrage_entree_et_coupe') return false;
  return etat.defenseurs.some((d) => d.caseId === caseId && d.postureProtection);
}

// Trie une liste de cases candidates selon le critère de la Tactique (Cupidité, Acharnement, Percée, Opportunisme, Représailles)
function trierCasesSelonTactique(
  etat: EtatJeuV01,
  cibles: number[],
  tactique: TactiqueType
): number[] {
  const nbDefSurCase = (cid: number) =>
    etat.defenseurs.filter((d) => d.caseId === cid).length;

  const nbDefVoisinage = (cid: number) => {
    const c = etat.cases[cid];
    if (!c) return nbDefSurCase(cid);
    return (
      nbDefSurCase(cid) * 2 +
      c.voisins.reduce((acc, v) => acc + nbDefSurCase(v), 0)
    );
  };

  const distAuCoeur = (cid: number) => {
    const anneau = etat.cases[cid]?.anneau;
    if (anneau === 'coeur') return 0;
    if (anneau === 'interieur') return 1;
    return 2;
  };

  return [...cibles].sort((a, b) => {
    if (tactique === 'cupidite') {
      // Case ayant le PLUS de Forêts
      if (etat.forets[b] !== etat.forets[a]) {
        return etat.forets[b] - etat.forets[a];
      }
      return distAuCoeur(a) - distAuCoeur(b);
    }
    if (tactique === 'acharnement') {
      // Nouvelle tactique V0.4 : Case boisée (>0) ayant le MOINS de Forêts restantes pour achever une clairière entamée
      const fA = etat.forets[a] > 0 ? etat.forets[a] : 99;
      const fB = etat.forets[b] > 0 ? etat.forets[b] : 99;
      if (fA !== fB) {
        return fA - fB;
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
      // Case avec le moins de Défenseurs (et voisinage le moins gardé), puis le plus de Forêts
      if (nbDefSurCase(a) !== nbDefSurCase(b)) {
        return nbDefSurCase(a) - nbDefSurCase(b);
      }
      if (nbDefVoisinage(a) !== nbDefVoisinage(b)) {
        return nbDefVoisinage(a) - nbDefVoisinage(b);
      }
      return etat.forets[b] - etat.forets[a];
    }
    // 'represailles' : Case avec le plus de Défenseurs
    if (nbDefSurCase(b) !== nbDefSurCase(a)) {
      return nbDefSurCase(b) - nbDefSurCase(a);
    }
    return etat.forets[b] - etat.forets[a];
  });
}

// Détermine la case cible d'une Machine selon la Tactique active et les options de variante
export function calculerCibleMachine(
  etat: EtatJeuV01,
  machine: PionMachine,
  tactique: TactiqueType,
  secteurPreferentiel = 0,
  ignorerBarragePourCibleInitiale = false
): number {
  let candidats: number[] = [];
  const lisieresIds = etat.cases
    .filter((c) => c.anneau === 'lisiere')
    .map((c) => c.id);
  if (machine.caseId === null) {
    candidats = lisieresIds.length > 0 ? lisieresIds : etat.cases.map((c) => c.id);
  } else if (
    etat.variante.porteeTactiques === 'plateau_entier' ||
    etat.variante.porteeTactiques === 'global_plateau'
  ) {
    candidats = etat.cases.map((c) => c.id);
  } else {
    const cActuelle = etat.cases[machine.caseId];
    candidats = [machine.caseId, ...(cActuelle ? cActuelle.voisins : [])];
  }

  const compBarrage =
    etat.variante.comportementBarrageMachine ??
    etat.variante.comportementBarrageV04 ??
    'annulation_stricte';

  // En mode V0.4 'annulation_stricte' lorsque ignorerBarragePourCibleInitiale=true, on calcule la cible théorique avant de vérifier si un Défenseur bloque l'entrée
  const filtrerBarrage =
    !ignorerBarragePourCibleInitiale &&
    (!estVariantePlacementV04(etat.variante) ||
      compBarrage === 'report_cible_libre');

  const accessibles = filtrerBarrage
    ? candidats.filter(
        (cid) =>
          cid === machine.caseId || !caseEstBarreeEntree(etat, cid, tactique)
      )
    : candidats;

  const pool =
    accessibles.length > 0
      ? accessibles
      : machine.caseId !== null
      ? [machine.caseId]
      : candidats;

  const boisees = pool.filter((cid) => etat.forets[cid] > 0);
  const cibles = boisees.length > 0 ? boisees : pool;
  const ciblesTriees = trierCasesSelonTactique(etat, cibles, tactique);

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
  const estV04 = estVariantePlacementV04(etat.variante);

  if (etape === 1 && !estV04) {
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

  // 1. Exécuter tous les déplacements
  for (const { joueur, action } of actionsEtape) {
    if (action.type !== 'deplacer') continue;
    const pion = etat.defenseurs.find((d) => d.id === action.pionId);
    if (!pion || action.caseCible === null) continue;

    // A. En Étape 2 : Vérification si le 1er déplacement de ce pion a été contrarié
    if (etape === 2) {
      const action1Pion = etat.programmations[joueur]?.find(
        (a) => a.pionId === action.pionId && a.etape === 1
      );
      if (action1Pion?.contrariee) {
        action.contrariee = true;
        action.motifContrariete =
          'Mouvement annulé en cascade : le 1er déplacement ayant été contrarié, le plan de déplacement est rompu.';
        etat.stats.mouvementsContraries =
          (etat.stats.mouvementsContraries || 0) + 1;
        etat.journal.push({
          id: `dep-contrarie-cascade-${etat.tourActuel}-${etape}-${pion.id}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_actions_2',
          message: `Plan brisé pour J${joueur + 1} (Défenseur #${pion.numeroPion}) : son 2e déplacement vers ${etat.cases[action.caseCible]?.nom || `Case ${action.caseCible}`} est ANNULÉ suite à la contrariété du 1er mouvement !`,
          gestePhysique: `Le pion Défenseur #${pion.numeroPion} reste immobile sur la ${etat.cases[pion.caseId]?.nomPhysique} : son plan initial est caduc.`,
          type: 'defenseur',
        });
        continue;
      }
    }

    // B. Vérification de saturation & contrariété de mouvement (Règles V0.4 : Option 1, Option 2, Option 4)
    const nomCaseCible = etat.cases[action.caseCible]?.nom || '';
    const estColOuGoulot =
      nomCaseCible.includes('Goulot') || nomCaseCible.includes('Col');
    const machineSurCible = etat.machines.some(
      (m) => m.caseId === action.caseCible && !m.neutraliseeCeTour
    );
    const regleContrarie = etat.variante.regleMouvementContrarie || 'aucun';

    // 1) Option 4 : Interception par Machine active en l'absence d'assaut coordonné (>= 2 peuples)
    const appliqueInterception =
      regleContrarie === 'interception_machine' ||
      regleContrarie === 'barrage_machine_active' ||
      regleContrarie === 'goulots_et_interception';

    if (appliqueInterception && machineSurCible && action.caseCible !== pion.caseId) {
      // Un assaut coordonné exige qu'un autre Peuple soit déjà présent OU converge à cette même étape
      const allieDejaSurCase = etat.defenseurs.some(
        (d) => d.caseId === action.caseCible && d.joueur !== joueur
      );
      const allieConvergeant = actionsEtape.some(
        (act) =>
          act.joueur !== joueur &&
          act.action.type === 'deplacer' &&
          act.action.caseCible === action.caseCible &&
          !act.action.contrariee
      );

      if (!allieDejaSurCase && !allieConvergeant) {
        action.contrariee = true;
        action.motifContrariete =
          "Interception par Machine active : assaut solitaire repoussé (coalition d'au moins 2 peuples requise).";
        etat.stats.mouvementsContraries =
          (etat.stats.mouvementsContraries || 0) + 1;
        etat.journal.push({
          id: `dep-intercepte-${etat.tourActuel}-${etape}-${pion.id}`,
          tour: etat.tourActuel,
          sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
          message: `Mouvement CONTRARIÉ pour J${joueur + 1} (Défenseur #${pion.numeroPion}) vers ${etat.cases[action.caseCible]?.nom} : INTERCEPTÉ par la Machine active ! Un assaut solitaire est impossible, un renfort allié est requis. Le pion reste sur ${etat.cases[pion.caseId]?.nom}.`,
          gestePhysique: `Le pion Défenseur #${pion.numeroPion} du Joueur ${joueur + 1} est repoussé par la Machine et reste sur la ${etat.cases[pion.caseId]?.nomPhysique}.`,
          type: 'defenseur',
        });
        continue;
      }
    }

    // 2) Option 1 & Option 2 : Capacité maximale et saturation
    let capMax = 99;
    if (regleContrarie === 'capacite_max_tuile') {
      capMax = estColOuGoulot ? 1 : (etat.variante.capaciteMaxCase || 2);
    } else if (
      regleContrarie === 'goulots_sentiers_seuls' ||
      regleContrarie === 'goulot_sentier_strict' ||
      regleContrarie === 'goulots_et_interception'
    ) {
      // Option 2 : Clairières libres, SEULS les cols et goulots de sentiers sont limités à 1 pion
      capMax = estColOuGoulot ? 1 : 99;
    } else if (estColOuGoulot && nomCaseCible.includes('Goulot')) {
      capMax = 1;
    }

    const nbDefSurCible = etat.defenseurs.filter(
      (d) => d.caseId === action.caseCible
    ).length;

    if (nbDefSurCible >= capMax && action.caseCible !== pion.caseId) {
      action.contrariee = true;
      action.motifContrariete = `Case saturée : capacité maximale atteinte (${capMax} Défenseur${capMax > 1 ? 's' : ''} max).`;
      etat.stats.mouvementsContraries =
        (etat.stats.mouvementsContraries || 0) + 1;
      etat.journal.push({
        id: `dep-sature-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `Mouvement CONTRARIÉ pour J${joueur + 1} (Défenseur #${pion.numeroPion}) vers ${etat.cases[action.caseCible]?.nom} : clairière saturée (${capMax} max) ! Le pion reste sur ${etat.cases[pion.caseId]?.nom}.`,
        gestePhysique: `Le pion Défenseur #${pion.numeroPion} du Joueur ${joueur + 1} ne peut pas entrer et reste sur la ${etat.cases[pion.caseId]?.nomPhysique}.`,
        type: 'defenseur',
      });
      continue;
    }

    // C. Vérification d'accessibilité depuis la case actuelle
    const accessibles = casesAccessiblesDefenseur(etat, pion.caseId);
    if (!accessibles.includes(action.caseCible)) {
      action.contrariee = true;
      action.motifContrariete = `Case non accessible depuis la position actuelle du pion.`;
      etat.stats.mouvementsContraries =
        (etat.stats.mouvementsContraries || 0) + 1;
      etat.journal.push({
        id: `dep-inaccessible-${etat.tourActuel}-${etape}-${pion.id}`,
        tour: etat.tourActuel,
        sousPhase: etape === 1 ? 'resolution_actions_1' : 'resolution_actions_2',
        message: `Déplacement impossible pour J${joueur + 1} (Défenseur #${pion.numeroPion}) : la case ${etat.cases[action.caseCible]?.nom} n'est pas adjacente à sa position (${etat.cases[pion.caseId]?.nom}).`,
        gestePhysique: `Le pion reste sur la ${etat.cases[pion.caseId]?.nomPhysique}.`,
        type: 'defenseur',
      });
      continue;
    }

    // D. Exécution valide du déplacement
    if (action.caseCible !== pion.caseId) {
      const ancienneCase = etat.cases[pion.caseId]?.nom || `Case ${pion.caseId}`;
      const nouvelleCase = etat.cases[action.caseCible]?.nom || `Case ${action.caseCible}`;
      pion.caseId = action.caseCible;
      pion.postureProtection = estV04;
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

  // En V0.4 (Pur Placement), les Défenseurs n'ont que l'action de déplacement : le barrage (≥1 Déf.) et la coalition (≥2 Peuples) découlent automatiquement de leur position !
  if (estV04) {
    for (const d of etat.defenseurs) {
      d.postureProtection = true;
    }
    for (const c of etat.cases) {
      const nbPeuples = compterPeuplesDistinctsSurCase(etat, c.id);
      const nbDef = etat.defenseurs.filter((d) => d.caseId === c.id).length;
      if (etape === 1 && nbDef >= 1) {
        etat.stats.protectionsEffectuees += 1;
      } else if (etape === 2 && nbPeuples >= 2) {
        etat.stats.protectionsEffectuees += 1;
      }
    }
    return etat;
  }

  // 2. Exécuter les postures Protéger (V0.1-V0.3)
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

  // 3. Exécuter les Sabotages (V0.1-V0.3)
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

  // 4. Exécuter Replanter (V0.1-V0.3)
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

  // 2. Piste Machine : ordonnée statistiquement du plus au moins probable : [1, 2, 3, 0, 4, 5]
  // Probabilités respectives : 1 (10/36), 2 (8/36), 3 (6/36), 0 (6/36), 4 (4/36), 5 (2/36).
  // Succès rapproche du début de piste (vers 1, indice - 1) ; échec recule vers la fin de piste (vers 5, indice + 1).
  const idxActuel = ORDRE_PISTE_MACHINE.indexOf(ecart);
  let idxCible = idxActuel;
  if (idxActuel !== -1) {
    if (succesCoupe && idxActuel > 0) {
      idxCible = idxActuel - 1;
    } else if (!succesCoupe && idxActuel < ORDRE_PISTE_MACHINE.length - 1) {
      idxCible = idxActuel + 1;
    }
  }
  const cibleEcart =
    idxCible !== -1 ? ORDRE_PISTE_MACHINE[idxCible] : ecart;

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
      explicationPhysique: `Sur la Piste Machine (1–2–3–0–4–5), échangez la carte Écart ${ecart} (M${mCourante}) avec sa voisine ${
        succesCoupe ? 'plus probable' : 'moins probable'
      } Écart ${cibleEcart} (M${mVoisine}).`,
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
  const estV04 = estVariantePlacementV04(etat.variante);

  const indices =
    indicesLancers || etat.lancersSecretsDuTour.map((_, idx) => idx);

  for (const idx of indices) {
    const lancer = etat.lancersSecretsDuTour[idx];
    if (!lancer) continue;

    const tactique = etat.pisteTactique[lancer.somme];
    const machineId = etat.pisteMachine[lancer.ecart];
    const machine = etat.machines.find((m) => m.id === machineId);
    if (!machine) continue;

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
    const provenance =
      machine.caseId === null
        ? 'le Chantier (Réserve)'
        : etat.cases[machine.caseId]?.nom || `Case ${machine.caseId}`;

    // En V0.4 avec 'annulation_stricte' : on regarde d'abord la case cible voulue par la Tactique
    const compBarrage =
      etat.variante.comportementBarrageMachine ??
      etat.variante.comportementBarrageV04 ??
      'annulation_stricte';
    if (estV04 && compBarrage === 'annulation_stricte') {
      const cibleVoulue = calculerCibleMachine(
        etat,
        machine,
        tactique,
        lancer.joueurObservateur,
        true
      );
      if (
        cibleVoulue !== machine.caseId &&
        caseEstBarreeEntree(etat, cibleVoulue, tactique)
      ) {
        const nomCibleBarrage =
          etat.cases[cibleVoulue]?.nom || `Case ${cibleVoulue}`;
        machine.cibleDeclaree = machine.caseId;
        machine.tactiqueDeclaree = tactique;
        etat.stats.protectionsEffectuees += 1;
        etat.journal.push({
          id: `m-barrage-${etat.tourActuel}-${idx}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_ciblage_machines',
          message: `🛡️ BARRAGE sur ${nomCibleBarrage} : Dés J${lancer.joueurObservateur + 1} [${lancer.d1},${lancer.d2}] (${NOMS_TACTIQUES[tactique]}) → ${machine.nom} ne peut pas entrer sur ${nomCibleBarrage} (occupée par ≥ 1 Défenseur) et reste sur ${provenance} !`,
          gestePhysique: `La case ${nomCibleBarrage} contenant au moins 1 Défenseur, le déplacement de ${machine.nom} est annulé : laissez ${machine.nom} sur ${provenance}.`,
          type: 'defenseur',
        });
        continue;
      }
    }

    const caseCible = calculerCibleMachine(
      etat,
      machine,
      tactique,
      lancer.joueurObservateur,
      false
    );

    if (
      estV04 &&
      caseCible !== machine.caseId &&
      caseEstBarreeEntree(etat, caseCible, tactique)
    ) {
      const nomCibleBarrage = etat.cases[caseCible]?.nom || `Case ${caseCible}`;
      machine.cibleDeclaree = machine.caseId;
      machine.tactiqueDeclaree = tactique;
      etat.stats.protectionsEffectuees += 1;
      etat.journal.push({
        id: `m-barrage-tot-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_ciblage_machines',
        message: `🛡️ BARRAGE COMPLET : toutes les entrées vers ${nomCibleBarrage} sont gardées par des Défenseurs, ${machine.nom} reste sur ${provenance} !`,
        gestePhysique: `Toutes les cases accessibles étant gardées, ${machine.nom} ne bouge pas.`,
        type: 'defenseur',
      });
      continue;
    }

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
  const estV04 = estVariantePlacementV04(etat.variante);

  for (let idx = 0; idx < etat.lancersSecretsDuTour.length; idx++) {
    const lancer = etat.lancersSecretsDuTour[idx];
    const machineId = etat.pisteMachine[lancer.ecart];
    const machine = etat.machines.find((m) => m.id === machineId);

    if (!machine || machine.caseId === null || machine.neutraliseeCeTour) {
      etat.journal.push({
        id: `coupe-sab-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_coupe_et_apprentissage',
        message: `${machine?.nom || 'Machine'} bloquée hors plateau ou neutralisée avant la coupe : le Méchant recule cette combinaison sur ses pistes.`,
        gestePhysique: `La Machine désignée au lancer ${idx + 1} n'ayant pu agir, faites reculer sa tuile Tactique (case ${lancer.somme}) et sa carte Machine (case ${lancer.ecart}).`,
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
      const nbPeuples = compterPeuplesDistinctsSurCase(etat, caseId);
      const effetCoal =
        etat.variante.effetCoalitionSurMachine ??
        etat.variante.effetCoalitionV04 ??
        'bloquer_coupe_sur_place';
      const renvoyerAuChantier =
        estV04 &&
        (effetCoal === 'renvoyer_au_chantier' ||
          effetCoal === 'renvoi_chantier' ||
          (effetCoal === 'chantier_a_3_peuples' && nbPeuples >= 3));

      if (renvoyerAuChantier) {
        machine.caseId = null;
        machine.cibleDeclaree = null;
        machine.neutraliseeCeTour = true;
        etat.stats.machinesSabotees += 1;
        etat.journal.push({
          id: `coupe-coal-chantier-${etat.tourActuel}-${idx}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_coupe_et_apprentissage',
          message: `🤝⚡ COALITION (${nbPeuples} Peuples) sur ${nomCase} : ${machine.nom} est bloquée ET démantelée vers le Chantier !`,
          gestePhysique: `${nbPeuples} Peuples différents entourent ${machine.nom} sur ${nomPhys} : aucun arbre n'est coupé, renvoyez ${machine.nom} au Chantier et reculez ses tuiles sur les pistes.`,
          type: 'defenseur',
        });
      } else {
        etat.stats.machinesSabotees += estV04 ? 1 : 0;
        etat.journal.push({
          id: `coupe-prot-${etat.tourActuel}-${idx}`,
          tour: etat.tourActuel,
          sousPhase: 'resolution_coupe_et_apprentissage',
          message: estV04
            ? `🤝🛡️ COALITION (${nbPeuples} Peuples différents) sur ${nomCase} : ${machine.nom} est neutralisée et n'abat aucun arbre !`
            : `Protection sur ${nomCase} : ${machine.nom} est bloquée par les Défenseurs et n'abat aucun arbre !`,
          gestePhysique: estV04
            ? `Les ${nbPeuples} Défenseurs de couleurs différentes sur ${nomPhys} empêchent ${machine.nom} de couper. Reculez sa tuile Tactique (case ${lancer.somme}) et sa carte Machine (case ${lancer.ecart}).`
            : `Les Défenseurs en posture Bouclier sur la ${nomPhys} empêchent ${machine.nom} de couper. Éloignez la tuile Tactique (case ${lancer.somme}) du 7.`,
          type: 'defenseur',
        });
      }
      appliquerApprentissagePistes(etat, lancer.somme, lancer.ecart, false);
    } else if (etat.forets[caseId] > 0) {
      etat.forets[caseId] -= 1;
      etat.stats.arbresCoupes += 1;
      etat.journal.push({
        id: `coupe-abattage-${etat.tourActuel}-${idx}`,
        tour: etat.tourActuel,
        sousPhase: 'resolution_coupe_et_apprentissage',
        message: `${machine.nom} coupe 1 Forêt sur ${nomCase} (reste ${etat.forets[caseId]} Forêts).`,
        gestePhysique: `Retirez 1 pion Forêt en bois de la ${nomPhys}. Le Méchant apprend : rapprochez sa tuile Tactique (case ${lancer.somme}) du 7 et sa carte Machine (case ${lancer.ecart}) de la gauche (case 1).`,
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
  const estV04 = estVariantePlacementV04(etat.variante);
  for (const d of etat.defenseurs) {
    d.postureProtection = estV04;
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
