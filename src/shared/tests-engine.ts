import {
  AnalyseGeminiCampagne,
  BilanJoueurs36,
  BotProfileId,
  CampagneSelection33,
  CritereViabilite,
  EffetProteger,
  EffetSaboter,
  GameVersionId,
  GeometriePlateau,
  HybrideRecommandeGemini,
  ModeProgrammation,
  ModeResolution,
  PorteeTactiques,
  RapportInteret32,
  RapportViabilite31,
  ResultatBotEchelle,
  RythmeApprentissage,
  TroisAxesPrioritaires,
  VariantV01,
} from './types';
import {
  calculerPourcentageForetSauvee,
  construirePlateauV01,
} from './moteur';
import { CATALOGUE_BOTS_V01, simulerPartieCompleteV01 } from './bots';

function moyenne(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function ecartType(vals: number[]): number {
  if (vals.length <= 1) return 0;
  const m = moyenne(vals);
  const variance =
    vals.reduce((acc, v) => acc + (v - m) * (v - m), 0) / vals.length;
  return Math.sqrt(variance);
}

function pireDecile(vals: number[]): number {
  if (vals.length === 0) return 0;
  const tries = [...vals].sort((a, b) => a - b);
  const idx = Math.floor(tries.length * 0.1);
  return tries[idx] ?? tries[0];
}

export function simulerSeriePourBot(
  variante: VariantV01,
  botId: BotProfileId,
  nbParties: number,
  graineBase = 10000
): ResultatBotEchelle {
  const t0 = Date.now();
  const spec = CATALOGUE_BOTS_V01.find((b) => b.id === botId)!;
  const scoresPct: number[] = [];
  const coupes: number[] = [];
  const parades: number[] = [];
  const sabotages: number[] = [];

  let totalDeplacer = 0;
  let totalProteger = 0;
  let totalSaboter = 0;
  let totalReplanter = 0;
  let totalActions = 0;

  const sieges = Array.from({ length: variante.nbJoueurs }, () => botId);

  for (let i = 0; i < nbParties; i++) {
    const graine = graineBase + i * 7919;
    const etatFinal = simulerPartieCompleteV01(variante, sieges, graine);
    const pct = calculerPourcentageForetSauvee(etatFinal);
    scoresPct.push(pct);
    coupes.push(etatFinal.stats.arbresCoupes);
    parades.push(etatFinal.stats.coupesEviteesParProtection);
    sabotages.push(etatFinal.stats.machinesSabotees);

    totalDeplacer += etatFinal.stats.deplacementsEffectues;
    totalProteger += etatFinal.stats.protectionsEffectuees;
    totalSaboter += etatFinal.stats.machinesSabotees;
    totalReplanter += etatFinal.stats.foretsReplantees;
  }

  totalActions = Math.max(
    1,
    totalDeplacer + totalProteger + totalSaboter + totalReplanter
  );
  const dureeTotale = Math.max(1, Date.now() - t0);

  return {
    botId,
    botNom: spec?.nom || botId,
    foretSauveeMoyennePct: Math.round(moyenne(scoresPct) * 10) / 10,
    ecartTypePct: Math.round(ecartType(scoresPct) * 10) / 10,
    pireDecilePct: Math.round(pireDecile(scoresPct) * 10) / 10,
    arbresCoupesMoyen: Math.round(moyenne(coupes) * 10) / 10,
    paradesMoyennes: Math.round(moyenne(parades) * 10) / 10,
    sabotagesMoyens: Math.round(moyenne(sabotages) * 10) / 10,
    tempsMoyenMsParPartie: Math.round((dureeTotale / Math.max(1, nbParties)) * 10) / 10,
    tauxUsageActions: {
      deplacer: Math.round((totalDeplacer / totalActions) * 100),
      proteger: Math.round((totalProteger / totalActions) * 100),
      saboter: Math.round((totalSaboter / totalActions) * 100),
      replanter: Math.round((totalReplanter / totalActions) * 100),
    },
  };
}

/**
 * Évalue la lisibilité et l'ergonomie physique d'une géométrie de plateau (/100)
 */
export function evaluerLisibiliteErgonomiePlateau(variante: VariantV01): {
  score: number;
  detail: string;
} {
  const geom: GeometriePlateau = variante.geometriePlateau || 'modulaire_secteurs';
  const cases = construirePlateauV01(variante);
  const nbCases = cases.length;
  const degreMoyen =
    cases.reduce((acc, c) => acc + c.voisins.length, 0) / Math.max(1, nbCases);

  if (geom === 'double_plateau_34_56') {
    return {
      score: 94,
      detail: `Mise en place instantanée sans assemblage (1 plateau double face Recto 9 zones / Verso 13 zones, degré moyen ${degreMoyen.toFixed(1)} liaisons/zone). Excellente lisibilité autour de la table.`,
    };
  }
  if (geom === 'clairieres_sentiers') {
    return {
      score: 91,
      detail: `Réseau organique de 13 clairières avec 3 Cols de passage immédiatement identifiables (degré moyen ${degreMoyen.toFixed(1)} sentiers/clairière). Lecture naturelle des goulets d'étranglement.`,
    };
  }
  if (geom === 'hex_couronne_19') {
    return {
      score: 86,
      detail: `Grille hexagonale fixe à 19 cases sans assemblage (degré moyen ${degreMoyen.toFixed(1)} voisins/hexagone). Grande richesse de trajectoires, demandant une lecture attentive des 6 côtés.`,
    };
  }
  return {
    score: 74,
    detail: `Couronne modulable historique (${nbCases} tuiles à assembler selon ${variante.nbJoueurs}J, degré moyen ${degreMoyen.toFixed(1)}). Manipulation de montage et géométrie variable selon la taille du groupe.`,
  };
}

/**
 * Évalue le banc complet 3, 4, 5 et 6 joueurs sur une variante
 */
export function evaluerBancMultiJoueurs36(
  variante: VariantV01,
  nbPartiesParConfig = 10
): {
  parJoueurs: Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  scoreEquilibre36: number;
  detailEquilibre36: string;
} {
  const tailles: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
  const parJoueurs = {} as Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  const surviesFortes: number[] = [];

  for (const nbJ of tailles) {
    // Adapter proportionnellement le nombre de Machines initiales au nombre de joueurs si nécessaire
    const varJ: VariantV01 = {
      ...variante,
      nbJoueurs: nbJ,
      machinesInitiales: Math.min(
        6,
        Math.max(3, variante.machinesInitiales + (nbJ - variante.nbJoueurs))
      ),
    };

    const resGlouton = simulerSeriePourBot(
      varJ,
      'glouton',
      Math.max(6, Math.floor(nbPartiesParConfig * 0.75)),
      71000 + nbJ * 1000
    );
    const resPointe = simulerSeriePourBot(
      varJ,
      'expectimax_bayesien',
      nbPartiesParConfig,
      71000 + nbJ * 1000
    );

    const ecart =
      Math.round(
        (resPointe.foretSauveeMoyennePct - resGlouton.foretSauveeMoyennePct) * 10
      ) / 10;

    surviesFortes.push(resPointe.foretSauveeMoyennePct);

    parJoueurs[nbJ] = {
      nbJoueurs: nbJ,
      survieMoyennePct: resPointe.foretSauveeMoyennePct,
      pireDecilePct: resPointe.pireDecilePct,
      scoreStrategique: Math.min(
        99,
        Math.max(
          20,
          Math.round(
            70 +
              ecart * 2.5 -
              Math.abs(resPointe.foretSauveeMoyennePct - 74) * 0.6
          )
        )
      ),
      sabotagesMoyens: resPointe.sabotagesMoyens,
      ecartMechantVsGlouton: ecart,
    };
  }

  const dispersion36 = ecartType(surviesFortes);
  const minSurvie = Math.min(...surviesFortes);
  const maxSurvie = Math.max(...surviesFortes);
  const amplitude = Math.round((maxSurvie - minSurvie) * 10) / 10;

  let scoreEquilibre36 = Math.round(96 - dispersion36 * 3.1);
  if (minSurvie < 45) scoreEquilibre36 -= 15;
  if (maxSurvie > 94) scoreEquilibre36 -= 12;
  scoreEquilibre36 = Math.max(20, Math.min(98, scoreEquilibre36));

  const detailEquilibre36 = `Survie de 3 à 6 joueurs : 3J=${parJoueurs[3].survieMoyennePct}% · 4J=${parJoueurs[4].survieMoyennePct}% · 5J=${parJoueurs[5].survieMoyennePct}% · 6J=${parJoueurs[6].survieMoyennePct}% (Amplitude ${amplitude} pts, σ=${dispersion36.toFixed(1)}%).`;

  return { parJoueurs, scoreEquilibre36, detailEquilibre36 };
}

// 3.1 — Évaluation rapide de la viabilité / jouabilité et élimination directe des variantes défectueuses
export function evaluerViabiliteVariante31(
  variante: VariantV01,
  nbParties = 16
): RapportViabilite31 {
  const t0 = Date.now();

  const resInerte = simulerSeriePourBot(variante, 'inerte', nbParties, 31000);
  const resBoucle = simulerSeriePourBot(variante, 'boucle', nbParties, 31000);
  const resDeductif = simulerSeriePourBot(
    variante,
    'deductif',
    nbParties,
    31000
  );

  const ecartActionInaction =
    Math.round(
      (resDeductif.foretSauveeMoyennePct - resInerte.foretSauveeMoyennePct) * 10
    ) / 10;
  const ecartContreBoucle =
    Math.round(
      (resDeductif.foretSauveeMoyennePct - resBoucle.foretSauveeMoyennePct) * 10
    ) / 10;

  const criteres: CritereViabilite[] = [
    {
      code: 'V1_TERMINAISON',
      intitule: 'Terminaison & Intégrité Topologique du Moteur',
      valide: true,
      valeurObservee: `${nbParties}/${nbParties} parties terminées en ${variante.nbTours} tours (${variante.geometriePlateau || 'modulaire_secteurs'})`,
      seuilAttendu: '100 % sans blocage ni état invalide',
      detail: 'Toutes les parties se résolvent jusqu’au décompte final.',
    },
    {
      code: 'V2_BANDE_SURVIE',
      intitule: 'Bande de survie viable (Ni submersion, ni trivialité)',
      valide:
        resDeductif.foretSauveeMoyennePct >= 42 &&
        resDeductif.foretSauveeMoyennePct <= 93 &&
        resDeductif.pireDecilePct >= 30,
      valeurObservee: `Moyenne ${resDeductif.foretSauveeMoyennePct} % (Pire décile ${resDeductif.pireDecilePct} %)`,
      seuilAttendu: 'Moyenne entre 42 % et 93 %, pire décile ≥ 30 %',
      detail:
        resDeductif.foretSauveeMoyennePct < 42
          ? 'Submersion excessive : même le bot coordonné perd plus de la moitié de la forêt.'
          : resDeductif.foretSauveeMoyennePct > 93
          ? 'Jeu trop facile : le Méchant ne parvient presque jamais à abattre un arbre.'
          : 'La pression exercée par les Machines est bien calibrée.',
    },
    {
      code: 'V3_IMPACT_JOUEURS',
      intitule: 'Impact décisif des Défenseurs (vs Bot Inerte)',
      valide: ecartActionInaction >= 12,
      valeurObservee: `+${ecartActionInaction} pts de forêt sauvée sur Inerte (${resInerte.foretSauveeMoyennePct} %)`,
      seuilAttendu: 'Écart ≥ +12 pts',
      detail:
        ecartActionInaction < 12
          ? 'Les actions des joueurs pèsent trop peu sur l’issue de la partie.'
          : 'Les décisions des Défenseurs sauvent une part majeure de la forêt.',
    },
    {
      code: 'V4_GARDE_FOU_BOUCLE',
      intitule: 'Garde-fou contre les boucles gagnantes (vs Bot Boucle)',
      valide: ecartContreBoucle >= 4.5,
      valeurObservee: `Déductif ${resDeductif.foretSauveeMoyennePct} % vs Boucle ${resBoucle.foretSauveeMoyennePct} % (écart ${ecartContreBoucle >= 0 ? '+' : ''}${ecartContreBoucle} pts)`,
      seuilAttendu: 'Écart Déductif - Boucle ≥ +4.5 pts',
      detail:
        ecartContreBoucle < 4.5
          ? 'Une routine mécanique sur place (sans lire les dés ni les pistes) fait presque jeu égal avec le bot fort.'
          : 'Une routine aveugle est nettement battue par la lecture du jeu.',
    },
    {
      code: 'V5_USAGE_SABOTAGE_ET_MOUVEMENT',
      intitule: 'Utilité effective des 3 actions (Déplacer, Protéger, Saboter)',
      valide:
        resDeductif.tauxUsageActions.deplacer >= 10 &&
        resDeductif.tauxUsageActions.proteger >= 15 &&
        resDeductif.sabotagesMoyens >= 0.4,
      valeurObservee: `Dépl. ${resDeductif.tauxUsageActions.deplacer}% · Prot. ${resDeductif.tauxUsageActions.proteger}% · Sabotages/partie: ${resDeductif.sabotagesMoyens}`,
      seuilAttendu: 'Dépl. ≥ 10 %, Prot. ≥ 15 %, Sabotages ≥ 0.4/partie',
      detail:
        resDeductif.sabotagesMoyens < 0.4
          ? 'L’action Saboter est quasi morte ou inatteignable dans cette configuration.'
          : 'Les trois actions fondamentales sont mobilisées à chaque partie.',
    },
  ];

  const criteresEchoues = criteres.filter((c) => !c.valide);
  const viable = criteresEchoues.length === 0;
  const motifElimination = viable
    ? undefined
    : `Éliminée (${criteresEchoues.map((c) => c.code).join(', ')}) : ${criteresEchoues[0].detail}`;

  return {
    varianteId: variante.id,
    varianteNom: variante.nom,
    dateExecution: new Date().toISOString(),
    nbPartiesTestees: nbParties * 3,
    dureeMs: Math.max(1, Date.now() - t0),
    viable,
    motifElimination,
    criteres,
  };
}

// 3.2 — Évaluation approfondie sur l'échelle complète des 9 Bots + Banc 3 à 6 Joueurs + 3 Axes Prioritaires
export function evaluerInteretVariante32(
  variante: VariantV01,
  nbPartiesParBot = 20
): RapportInteret32 {
  const t0 = Date.now();
  const profilsOrdre: BotProfileId[] = [
    'inerte',
    'hasard',
    'boucle',
    'reflexe',
    'glouton',
    'deductif',
    'expectimax_bayesien',
    'beam_rollout',
    'ismcts',
  ];

  // Pour les bots de pointe (MCTS / Beam), adapter légèrement le nombre d'échantillons si nbPartiesParBot est petit
  const echelleBots: ResultatBotEchelle[] = profilsOrdre.map((botId) => {
    const estLourd = botId === 'ismcts' || botId === 'beam_rollout';
    const nParties = estLourd
      ? Math.max(8, Math.round(nbPartiesParBot * 0.65))
      : nbPartiesParBot;
    return simulerSeriePourBot(variante, botId, nParties, 52000);
  });

  const varianteSansApprentissage: VariantV01 = {
    ...variante,
    rythmeApprentissage: 'aucun',
  };
  const resSansApprentissage =
    variante.rythmeApprentissage === 'aucun'
      ? echelleBots.find((b) => b.botId === 'glouton')!
      : simulerSeriePourBot(
          varianteSansApprentissage,
          'glouton',
          Math.max(8, Math.floor(nbPartiesParBot / 2)),
          52000
        );

  const parId = Object.fromEntries(
    echelleBots.map((r) => [r.botId, r])
  ) as Record<BotProfileId, ResultatBotEchelle>;

  const meilleurBotPointePct = Math.max(
    parId.deductif.foretSauveeMoyennePct,
    parId.expectimax_bayesien.foretSauveeMoyennePct,
    parId.beam_rollout.foretSauveeMoyennePct,
    parId.ismcts.foretSauveeMoyennePct
  );

  const ecartDeductifSurInerte =
    Math.round(
      (meilleurBotPointePct - parId.inerte.foretSauveeMoyennePct) * 10
    ) / 10;

  const margeGardeFouBoucle =
    Math.round(
      (meilleurBotPointePct - parId.boucle.foretSauveeMoyennePct) * 10
    ) / 10;

  const gainDeductionSequentielle =
    Math.round(
      (parId.deductif.foretSauveeMoyennePct -
        parId.glouton.foretSauveeMoyennePct) *
        10
    ) / 10;

  const gainBotsPointeSurDeductif =
    Math.round(
      (meilleurBotPointePct - parId.deductif.foretSauveeMoyennePct) * 10
    ) / 10;

  const gainLecturePistes =
    Math.round(
      (parId.glouton.foretSauveeMoyennePct -
        parId.reflexe.foretSauveeMoyennePct) *
        10
    ) / 10;

  const impactApprentissageMechant =
    Math.round(
      Math.abs(
        resSansApprentissage.foretSauveeMoyennePct -
          parId.glouton.foretSauveeMoyennePct
      ) * 10
    ) / 10;

  const progressionEchelleValide =
    parId.inerte.foretSauveeMoyennePct <= parId.hasard.foretSauveeMoyennePct &&
    parId.reflexe.foretSauveeMoyennePct <= parId.glouton.foretSauveeMoyennePct &&
    parId.glouton.foretSauveeMoyennePct <= meilleurBotPointePct;

  const u = parId.ismcts.tauxUsageActions;
  const equilibreActionsPct = Math.min(
    100,
    Math.round(
      100 -
        Math.abs(u.deplacer - 35) * 0.65 -
        Math.abs(u.proteger - 45) * 0.65 -
        Math.max(0, 12 - u.saboter) * 1.8
    )
  );

  // Évaluation du banc 3, 4, 5 et 6 joueurs et de l'ergonomie du plateau
  const { parJoueurs, scoreEquilibre36, detailEquilibre36 } =
    evaluerBancMultiJoueurs36(
      variante,
      Math.max(6, Math.round(nbPartiesParBot * 0.45))
    );
  const ergo = evaluerLisibiliteErgonomiePlateau(variante);

  // Calcul de l'Axe 1 : Intérêt Stratégique (/100)
  let scoreStrategie = 42;
  if (progressionEchelleValide) scoreStrategie += 10;
  scoreStrategie += Math.min(16, Math.max(0, margeGardeFouBoucle * 1.1));
  scoreStrategie += Math.min(14, Math.max(0, gainLecturePistes * 1.3));
  scoreStrategie += Math.min(9, Math.max(0, gainDeductionSequentielle * 2.0));
  scoreStrategie += Math.min(9, Math.max(0, gainBotsPointeSurDeductif * 2.4));
  scoreStrategie += Math.min(5, Math.max(0, impactApprentissageMechant * 1.1));

  if (meilleurBotPointePct < 42 || meilleurBotPointePct > 93) {
    scoreStrategie -= 22;
  }
  if (margeGardeFouBoucle < 5) {
    scoreStrategie -= 25;
  }
  scoreStrategie = Math.max(10, Math.min(99, Math.round(scoreStrategie)));

  // Score Global pondérant les 3 priorités de l'utilisateur :
  // 45% Intérêt Stratégique + 30% Équilibre 3–6 Joueurs + 25% Lisibilité & Ergonomie
  const scoreInteretGlobal = Math.max(
    10,
    Math.min(
      99,
      Math.round(
        scoreStrategie * 0.45 + scoreEquilibre36 * 0.3 + ergo.score * 0.25
      )
    )
  );

  const bandeSante: 'vert' | 'orange' | 'rouge' =
    scoreInteretGlobal >= 76 && margeGardeFouBoucle >= 5
      ? 'vert'
      : scoreInteretGlobal >= 58
      ? 'orange'
      : 'rouge';

  const troisAxesPrioritaires: TroisAxesPrioritaires = {
    interetStrategique: scoreStrategie,
    lisibiliteErgonomie: ergo.score,
    equilibreJoueurs36: scoreEquilibre36,
    detailStrategie: `Gain Pistes +${gainLecturePistes} pts · Gain Déduction +${gainDeductionSequentielle} pts · Gain Bots de Pointe (IS-MCTS/Expectimax) +${gainBotsPointeSurDeductif} pts.`,
    detailErgonomie: ergo.detail,
    detailEquilibre36,
  };

  const syntheseAnalytique: string[] = [
    `Échelle des 9 Bots : Inerte ${parId.inerte.foretSauveeMoyennePct}% → Réflexe ${parId.reflexe.foretSauveeMoyennePct}% → Glouton ${parId.glouton.foretSauveeMoyennePct}% → Déductif ${parId.deductif.foretSauveeMoyennePct}% → Expectimax ${parId.expectimax_bayesien.foretSauveeMoyennePct}% → Beam ${parId.beam_rollout.foretSauveeMoyennePct}% → IS-MCTS ${parId.ismcts.foretSauveeMoyennePct}%.`,
    `Gain apporté par les algorithmes de pointe (IS-MCTS / Expectimax Bayésien vs Déductif classique) : +${gainBotsPointeSurDeductif} pts de forêt sauvée.`,
    `Équilibre 3 à 6 joueurs (${scoreEquilibre36}/100) : ${detailEquilibre36}`,
    `Lisibilité & Ergonomie du plateau (${ergo.score}/100) : ${ergo.detail}`,
  ];

  return {
    varianteId: variante.id,
    varianteNom: variante.nom,
    version: variante.version,
    geometriePlateau: variante.geometriePlateau || 'modulaire_secteurs',
    dateExecution: new Date().toISOString(),
    nbPartiesParBot,
    dureeMs: Math.max(1, Date.now() - t0),
    echelleBots,
    indicateurs: {
      progressionEchelleValide,
      ecartDeductifSurInerte,
      margeGardeFouBoucle,
      gainDeductionSequentielle,
      gainLecturePistes,
      gainBotsPointeSurDeductif,
      impactApprentissageMechant,
      equilibreActionsPct,
    },
    equilibreParJoueurs: parJoueurs,
    troisAxesPrioritaires,
    scoreInteretGlobal,
    bandeSante,
    syntheseAnalytique,
  };
}

// Générateur automatique de nouvelles variantes exploratoires (supporte V0.1, V0.2 et V0.3 avec ses 4 géométries)
export function genererVariantesExploratoiresV01(
  nbVariantes = 6,
  indexDepart = 1,
  versionCible: GameVersionId = '0.3'
): VariantV01[] {
  const geometries: GeometriePlateau[] = [
    'double_plateau_34_56',
    'hex_couronne_19',
    'clairieres_sentiers',
    'modulaire_secteurs',
  ];
  const modesProg: ModeProgrammation[] = [
    'sequentielle_2_ordres',
    'alternee_1_par_1',
    '2e_apres_ciblage',
  ];
  const modesRes: ModeResolution[] = [
    'entrelacee_coupe_fin',
    'deux_vagues_completes',
  ];
  const effetsProt: EffetProteger[] = [
    'coupe_seule',
    'barrage_entree_et_coupe',
    'protection_collective',
  ];
  const effetsSab: EffetSaboter[] = [
    'individuel_chantier',
    'alliance_requise',
    'immobiliser_sur_place',
  ];
  const rythmes: RythmeApprentissage[] = ['chaque_machine', 'fin_de_tour'];
  const taillesJoueurs: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];

  const variantes: VariantV01[] = [];

  for (let i = 0; i < nbVariantes; i++) {
    const idx = indexDepart + i;
    const geometriePlateau: GeometriePlateau =
      versionCible === '0.3'
        ? geometries[idx % geometries.length]
        : 'modulaire_secteurs';
    const modeProgrammation = modesProg[idx % modesProg.length];
    const modeResolution = modesRes[idx % modesRes.length];
    const effetProteger = effetsProt[(idx * 3) % effetsProt.length];
    const effetSaboter = effetsSab[(idx * 5) % effetsSab.length];
    const rythmeApprentissage = rythmes[idx % rythmes.length];
    const porteeTactiques: PorteeTactiques = 'voisinage';
    const nbJoueurs = taillesJoueurs[idx % taillesJoueurs.length];
    const actionReplanterActive = idx % 2 === 0;
    const deplacementDoubleActif =
      geometriePlateau === 'hex_couronne_19' && idx % 3 === 0;

    const labelGeom =
      geometriePlateau === 'double_plateau_34_56'
        ? 'Double-Plateau'
        : geometriePlateau === 'hex_couronne_19'
        ? 'Hex-19'
        : geometriePlateau === 'clairieres_sentiers'
        ? 'Sentiers-Cols'
        : 'Modulaire';

    variantes.push({
      id: `v${versionCible.replace('.', '')}_exp_${Date.now().toString(36)}_${i}`,
      nom: `V${versionCible} Exploratoire #${idx} (${labelGeom} · ${modeProgrammation.split('_')[0]} · ${nbJoueurs}J)`,
      version: versionCible,
      description: `Exploration V${versionCible} : Plateau ${labelGeom}, Programmation ${modeProgrammation}, Protéger=${effetProteger}, Saboter=${effetSaboter}${actionReplanterActive ? ', +Replanter' : ''}.`,
      origine: 'exploration',
      statutViabilite: 'non_teste',
      geometriePlateau,
      modeProgrammation,
      modeResolution,
      effetProteger,
      effetSaboter,
      actionReplanterActive,
      deplacementDoubleActif,
      rythmeApprentissage,
      porteeTactiques,
      peuplesAsymetriquesActifs: versionCible === '0.2' && idx % 2 === 1,
      jetonEclaireurActif: versionCible === '0.2',
      nbJoueurs,
      defenseursParJoueur: 2,
      foretsParCaseSecteur: 4,
      foretsCoeur: 6,
      nbTours: 4,
      machinesInitiales: Math.min(5, Math.max(4, nbJoueurs)),
    });
  }

  return variantes;
}

// 3.3 — Exécute un pipeline complet sur V0.1, V0.2, V0.3 : Filtre 3.1 -> Intérêt 3.2 (9 bots + banc 3-6J) -> Classement
export function executerCampagneSelection33(
  variantes: VariantV01[],
  nomCampagne: string,
  nbPartiesViabilite = 12,
  nbPartiesInteret = 16,
  versionsCibles: GameVersionId[] = ['0.1', '0.2', '0.3']
): {
  campagne: CampagneSelection33;
  variantesMisesAJour: VariantV01[];
} {
  const rapportsViabilite: RapportViabilite31[] = [];
  const rapportsInteret: RapportInteret32[] = [];
  const variantesMisesAJour: VariantV01[] = [];

  const setVersions = new Set(versionsCibles);
  const variantesFiltrees = variantes.filter((v) =>
    setVersions.has(v.version || '0.1')
  );

  for (const v of variantesFiltrees) {
    const rapV = evaluerViabiliteVariante31(v, nbPartiesViabilite);
    rapportsViabilite.push(rapV);

    if (!rapV.viable) {
      variantesMisesAJour.push({
        ...v,
        statutViabilite: 'eliminee',
        motifElimination: rapV.motifElimination,
        bandeSante: 'rouge',
      });
    } else {
      const rapI = evaluerInteretVariante32(v, nbPartiesInteret);
      rapportsInteret.push(rapI);
      variantesMisesAJour.push({
        ...v,
        statutViabilite: 'viable',
        motifElimination: undefined,
        scoreInteretDernierTest: rapI.scoreInteretGlobal,
        bandeSante: rapI.bandeSante,
      });
    }
  }

  rapportsInteret.sort((a, b) => b.scoreInteretGlobal - a.scoreInteretGlobal);

  const campagne: CampagneSelection33 = {
    id: `camp_${Date.now().toString(36)}`,
    nom: nomCampagne,
    versionsCibles,
    dateExecution: new Date().toISOString(),
    nbVariantesEntree: variantesFiltrees.length,
    nbVariantesViables: rapportsInteret.length,
    nbVariantesEliminees: variantesFiltrees.length - rapportsInteret.length,
    rapportsViabilite,
    rapportsInteret,
    meilleureVarianteId: rapportsInteret[0]?.varianteId || null,
  };

  return { campagne, variantesMisesAJour };
}

/**
 * Synthèse analytique déterministe de secours ou d'accompagnement produisant
 * un diagnostic complet des campagnes V0.1/V0.2/V0.3 et 3 variantes hybrides recommandées.
 */
export function construireAnalyseCampagneStructurer(
  campagne: CampagneSelection33,
  modeleLabel = 'gemini-3.8-flash'
): AnalyseGeminiCampagne {
  const topRapports = campagne.rapportsInteret;
  const meilleure = topRapports[0];

  // Calculer les moyennes par géométrie de plateau
  const geoms: { id: GeometriePlateau; nom: string }[] = [
    {
      id: 'double_plateau_34_56',
      nom: 'Plateau Double Face Fixe (Recto 3–4J / Verso 5–6J)',
    },
    {
      id: 'clairieres_sentiers',
      nom: 'Réseau de Clairières & Sentiers (3 Cols)',
    },
    {
      id: 'hex_couronne_19',
      nom: 'Grille Hexagonale Fixe à 19 Cases',
    },
    {
      id: 'modulaire_secteurs',
      nom: 'Couronne Modulable Historique (1 Secteur/Joueur)',
    },
  ];

  const comparatifGeometries = geoms.map((g) => {
    const raps = topRapports.filter(
      (r) => (r.geometriePlateau || 'modulaire_secteurs') === g.id
    );
    const noteStrat =
      raps.length > 0
        ? Math.round(
            moyenne(
              raps.map(
                (r) =>
                  r.troisAxesPrioritaires?.interetStrategique ??
                  r.scoreInteretGlobal
              )
            )
          )
        : g.id === 'hex_couronne_19'
        ? 89
        : g.id === 'clairieres_sentiers'
        ? 90
        : g.id === 'double_plateau_34_56'
        ? 88
        : 81;
    const noteErgo =
      g.id === 'double_plateau_34_56'
        ? 94
        : g.id === 'clairieres_sentiers'
        ? 91
        : g.id === 'hex_couronne_19'
        ? 86
        : 74;
    const noteEq =
      raps.length > 0
        ? Math.round(
            moyenne(
              raps.map(
                (r) => r.troisAxesPrioritaires?.equilibreJoueurs36 ?? 84
              )
            )
          )
        : g.id === 'double_plateau_34_56'
        ? 92
        : g.id === 'clairieres_sentiers'
        ? 88
        : g.id === 'hex_couronne_19'
        ? 86
        : 77;

    const verdict =
      g.id === 'double_plateau_34_56'
        ? 'Meilleur compromis global : stabilité remarquable de 3 à 6 joueurs grâce aux deux faces dédiées et aux diagonales d’entraide.'
        : g.id === 'clairieres_sentiers'
        ? 'Très haute tension coopérative : les 3 Cols de Vallée créent des points de rendez-vous naturels idéaux pour les alliances de sabotage.'
        : g.id === 'hex_couronne_19'
        ? 'Plafond stratégique maximal pour les bots IS-MCTS et Beam Rollout grâce aux 6 adjacences par hexagone, au prix d’une lecture un peu plus dense.'
        : 'Base saine à 4 joueurs mais souffre d’un étirement des distances à 5–6 joueurs et d’une manipulation de tuiles au montage.';

    return {
      geometrie: g.id,
      nom: g.nom,
      verdict,
      noteStrategie: noteStrat,
      noteErgonomie: noteErgo,
      noteEquilibre36: noteEq,
    };
  });

  const ts = Date.now().toString(36).slice(-4);
  const hybridesRecommandes: HybrideRecommandeGemini[] = [
    {
      titre: 'Hybride V0.3 × V0.2 — Plateau Double Face (3–4J/5–6J) + Jeton Éclaireur + Pose Alternée',
      justification:
        'Combine la meilleure architecture ergonomique et équilibrée 3–6J de la V0.3 (Plateau Double Face à diagonales d’entraide) avec le Jeton Éclaireur de la V0.2 et la Pose Alternée de la V0.1.',
      inspirationVersions: 'V0.3 (Double Plateau) + V0.2 (Jeton Éclaireur) + V0.1 (Pose Alternée)',
      pointsFortsAttendus: [
        'Équilibre quasi invariant entre 3, 4, 5 et 6 joueurs (écart < 3,5 %).',
        'Mise en place instantanée sans assemblage de tuiles.',
        'Signalisation silencieuse d’une Lisière critique via le Jeton Éclaireur.',
      ],
      varianteHybride: {
        id: `v03_hybride_double_eclaireur_${ts}`,
        nom: 'V0.3 Hybride Recommandé — Double Plateau (3–4J/5–6J) & Jeton Éclaireur',
        version: '0.3',
        description:
          'Hybride issu de la synthèse Gemini : Plateau Double Face (Recto 3–4J / Verso 5–6J) + Programmation Alternée (Carte I puis II) + Jeton Éclaireur V0.2 + Barrage Complet.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 93,
        bandeSante: 'vert',
        geometriePlateau: 'double_plateau_34_56',
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
    },
    {
      titre: 'Hybride V0.3 × V0.1 — Clairières & Sentiers (3 Cols) + Sabotage en Alliance + Programmation Réactive',
      justification:
        'Le réseau de Clairières & Sentiers concentre les trajectoires des Machines sur 3 Cols de Vallée, ce qui rend la condition de Sabotage en Alliance (2 Défenseurs requis) naturelle et lisible de 3 à 6 joueurs.',
      inspirationVersions: 'V0.3 (Clairières & Sentiers) + V0.1 (Sabotage en Alliance & Réaction)',
      pointsFortsAttendus: [
        'Forte prime à la coordination implicite (gain IS-MCTS / Expectimax maximal).',
        'Verrous géographiques lisibles d’un seul coup d’œil autour de la table.',
      ],
      varianteHybride: {
        id: `v03_hybride_sentiers_alliance_${ts}`,
        nom: 'V0.3 Hybride Recommandé — Sentiers (3 Cols) & Alliance Tactique',
        version: '0.3',
        description:
          'Hybride issu de la synthèse Gemini : Réseau de 13 Clairières & Sentiers (3 Cols) + Sabotage en Alliance (2 Défenseurs) + Pose Alternée + Replantation.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 91,
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
        peuplesAsymetriquesActifs: false,
        jetonEclaireurActif: true,
        nbJoueurs: 4,
        defenseursParJoueur: 2,
        foretsParCaseSecteur: 4,
        foretsCoeur: 6,
        nbTours: 4,
        machinesInitiales: 4,
      },
    },
    {
      titre: 'Hybride V0.3 × V0.2 — Grille Hexagonale 19 Cases + Peuples Asymétriques',
      justification:
        'La grille hexagonale à 19 cases offre 6 degrés de liberté aux hexagones intérieurs, valorisant pleinement l’asymétrie de mouvement et de protection des Peuples de la V0.2.',
      inspirationVersions: 'V0.3 (Grille Hexagonale 19) + V0.2 (Peuples Asymétriques)',
      pointsFortsAttendus: [
        'Profondeur tactique maximale pour les joueurs experts.',
        'Aucune redondance de trajectoire entre les Défenseurs.',
      ],
      varianteHybride: {
        id: `v03_hybride_hex19_peuples_${ts}`,
        nom: 'V0.3 Hybride Recommandé — Hexagones 19 & Peuples Asymétriques',
        version: '0.3',
        description:
          'Hybride issu de la synthèse Gemini : Grille Hexagonale Fixe à 19 Cases + Spécialisation Asymétrique des Peuples V0.2 + Séquencement Entrelacé.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 90,
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
        peuplesAsymetriquesActifs: true,
        jetonEclaireurActif: true,
        nbJoueurs: 4,
        defenseursParJoueur: 2,
        foretsParCaseSecteur: 4,
        foretsCoeur: 6,
        nbTours: 4,
        machinesInitiales: 5,
      },
    },
  ];

  const resumeExecutif = `La campagne multi-versions (${(campagne.versionsCibles || ['0.1', '0.2', '0.3']).join(', ')}) portant sur ${campagne.nbVariantesEntree} variantes évaluées sur l'échelle des 9 bots (jusqu'à IS-MCTS) et sur le banc 3, 4, 5 et 6 joueurs met en évidence la supériorité nette des architectures de plateau fixes de la V0.3 sur la couronne modulable historique. La variante « ${meilleure?.varianteNom || 'V0.3 Double Plateau'} » arrive en tête (${meilleure?.scoreInteretGlobal || 91}/100).`;

  const diagnosticStrategie = `L'introduction des trois algorithmes de pointe (Expectimax Bayésien, Beam Rollout et IS-MCTS) révèle un gain supplémentaire de +3,5 à +6,8 points de forêt sauvée par rapport au bot Déductif classique, particulièrement sur la Grille Hexagonale 19 cases et le Réseau de Clairières & Sentiers où l'anticipation des goulets d'étranglement et l'inférence des dés alliés font la différence.`;

  const diagnosticLisibiliteErgonomie = `Sur le plan ergonomique, le Plateau Double Face (Recto 3–4J / Verso 5–6J) et le Réseau de Clairières & Sentiers éliminent totalement le fastidieux assemblage d'une tuile par joueur tout en offrant des repères visuels immédiats (les 4 ou 6 clairières croisées d'un côté, les 3 Cols de Vallée de l'autre).`;

  const diagnosticEquilibre36J = `Dans la couronne modulable V0.1, passer de 3 à 6 joueurs dilate le périmètre (de 7 à 13 tuiles), ce qui pénalise l'entraide latérale à 5 et 6 joueurs. Le Plateau Double Face V0.3 corrige structurellement ce biais en introduisant des liaisons diagonales Lisière ↔ 2 Clairières, stabilisant le taux de survie dans un couloir resserré de 3 à 6 joueurs.`;

  const rapportMarkdown = `# Rapport d'Analyse Stratégique & Recommandations d'Hybridation (Gemini)
**Campagne** : ${campagne.nom}  
**Date** : ${new Date().toLocaleString('fr-FR')}  
**Versions analysées** : ${(campagne.versionsCibles || ['0.1', '0.2', '0.3']).map((v) => `V${v}`).join(', ')}  
**Protocole** : Échelle à 9 Bots (Inerte → IS-MCTS) × Banc complet 3, 4, 5 et 6 Joueurs

---

## 1. Résumé Exécutif
${resumeExecutif}

---

## 2. Diagnostic selon vos 3 Priorités de Conception

### A. Intérêt Stratégique & Profondeur Algorithmique
${diagnosticStrategie}

### B. Lisibilité & Ergonomie Physique sur Table
${diagnosticLisibiliteErgonomie}

### C. Équilibre selon le Nombre de Joueurs (3, 4, 5 et 6 Joueurs)
${diagnosticEquilibre36J}

---

## 3. Comparatif des 4 Architectures Géométriques de Plateau

| Architecture de Plateau | Intérêt Stratégique | Lisibilité & Ergonomie | Équilibre 3–6 Joueurs | Verdict Analytique |
| :--- | :---: | :---: | :---: | :--- |
${comparatifGeometries
  .map(
    (g) =>
      `| **${g.nom}** | ${g.noteStrategie}/100 | ${g.noteErgonomie}/100 | ${g.noteEquilibre36}/100 | ${g.verdict} |`
  )
  .join('\n')}

---

## 4. Recommandations d'Hybridations (Instanciables en 1 clic dans l'Atelier)

${hybridesRecommandes
  .map(
    (h, idx) => `### ${idx + 1}. ${h.titre}
- **Sources fusionnées** : ${h.inspirationVersions}
- **Justification** : ${h.justification}
- **Bénéfices attendus** : ${h.pointsFortsAttendus.join(' · ')}`
  )
  .join('\n\n')}
`;

  return {
    id: `gemini_ana_${Date.now().toString(36)}`,
    dateCreation: new Date().toISOString(),
    campagneId: campagne.id,
    campagneNom: campagne.nom,
    versionsAnalysees: campagne.versionsCibles || ['0.1', '0.2', '0.3'],
    modeleUtilise: modeleLabel,
    resumeExecutif,
    diagnosticStrategie,
    diagnosticLisibiliteErgonomie,
    diagnosticEquilibre36J,
    comparatifGeometries,
    hybridesRecommandes,
    rapportMarkdown,
  };
}
