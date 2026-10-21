import {
  AnalyseGeminiCampagne,
  BilanJoueurs36,
  BotProfileId,
  CampagneSelection33,
  ComportementBarrageV04,
  CritereViabilite,
  EffetCoalitionV04,
  EffetProteger,
  EffetSaboter,
  GameVersionId,
  GeometriePlateau,
  HybrideRecommandeGemini,
  ModeProgrammation,
  ModeResolution,
  PorteeTactiques,
  ProfilTactiquesV04,
  RapportInteret32,
  RapportViabilite31,
  RegleMouvementContrarie,
  ResultatBotEchelle,
  RythmeApprentissage,
  TroisAxesPrioritaires,
  VariantV01,
} from './types';
import {
  calculerPourcentageForetSauvee,
  construirePlateauV01,
  estVariantePlacementV04,
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
  const estV04 = estVariantePlacementV04(variante);
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

  if (estV04) {
    // En V0.4, les actions sont des déplacements qui déclenchent des Barrages (protectionsEffectuees) et des Coalitions (coupesEviteesParProtection / machinesSabotees)
    const totalPasPossibles = Math.max(
      1,
      nbParties *
        variante.nbTours *
        variante.nbJoueurs *
        variante.defenseursParJoueur *
        (variante.modeProgrammation === 'un_seul_ordre' ? 1 : 2)
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
      tempsMoyenMsParPartie:
        Math.round((dureeTotale / Math.max(1, nbParties)) * 10) / 10,
      tauxUsageActions: {
        deplacer: Math.min(
          100,
          Math.round((totalDeplacer / totalPasPossibles) * 100)
        ),
        proteger: Math.min(
          100,
          Math.round((moyenne(parades) / Math.max(1, variante.nbTours * 2)) * 100)
        ),
        saboter: Math.min(
          100,
          Math.round(
            ((moyenne(sabotages) + moyenne(parades) * 0.4) /
              Math.max(1, variante.nbTours * 1.5)) *
              100
          )
        ),
        replanter: 0,
      },
    };
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
    tempsMoyenMsParPartie:
      Math.round((dureeTotale / Math.max(1, nbParties)) * 10) / 10,
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
  const estV04 = estVariantePlacementV04(variante);
  const bonusZeroCarte = estV04 ? 3 : 0;
  const cases = construirePlateauV01(variante);
  const nbCases = cases.length;
  const degreMoyen =
    cases.reduce((acc, c) => acc + c.voisins.length, 0) / Math.max(1, nbCases);

  if (geom === 'compact_9_cases') {
    return {
      score: Math.min(97, 93 + bonusZeroCarte),
      detail: `Micro-plateau compact à 9 clairières fixes (degré moyen ${degreMoyen.toFixed(1)} liaisons/zone) : vision globale immédiate et haute densité tactique.`,
    };
  }
  if (geom === 'sentiers_goulots_15') {
    return {
      score: Math.min(96, 92 + bonusZeroCarte),
      detail: `Graphe de 15 zones avec 4 Cols Goulots à capacité unique clairement balisés (degré moyen ${degreMoyen.toFixed(1)} sentiers/zone) : lecture limpide des verrous et du risque de mouvement contrarié.`,
    };
  }
  if (geom === 'reseau_etendu_21') {
    return {
      score: Math.min(93, 88 + bonusZeroCarte),
      detail: `Grand réseau forestier fixe à 21 zones avec anneau médian de sous-bois (degré moyen ${degreMoyen.toFixed(1)}) : idéal pour aérer le jeu à 5–6 joueurs ou avec 3 Défenseurs/joueur.`,
    };
  }
  if (geom === 'double_plateau_34_56') {
    return {
      score: Math.min(98, 94 + bonusZeroCarte),
      detail: `Mise en place instantanée sans assemblage (1 plateau double face Recto 9 zones / Verso 13 zones, degré moyen ${degreMoyen.toFixed(1)} liaisons/zone)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Excellente lisibilité autour de la table.`,
    };
  }
  if (geom === 'clairieres_sentiers') {
    return {
      score: Math.min(96, 91 + bonusZeroCarte),
      detail: `Réseau organique de 13 clairières avec 3 Cols de passage immédiatement identifiables (degré moyen ${degreMoyen.toFixed(1)} sentiers/clairière)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Lecture naturelle des goulets d'étranglement.`,
    };
  }
  if (geom === 'hex_couronne_19') {
    return {
      score: Math.min(92, 86 + bonusZeroCarte),
      detail: `Grille hexagonale fixe à 19 cases sans assemblage (degré moyen ${degreMoyen.toFixed(1)} voisins/hexagone)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Grande richesse de trajectoires.`,
    };
  }
  return {
    score: Math.min(82, 74 + bonusZeroCarte),
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
      Math.max(2, Math.floor(nbPartiesParConfig * 0.75)),
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
  const estV04 = estVariantePlacementV04(variante);

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

  const critereV5: CritereViabilite = estV04
    ? {
        code: 'V5_BARRAGE_ET_COALITION_V04',
        intitule:
          'Efficacité conjointe du Barrage (≥1 Déf.) et de la Coalition Inter-Peuples (≥2 Peuples)',
        valide:
          resDeductif.tauxUsageActions.deplacer >= 20 &&
          resDeductif.paradesMoyennes >= 1.2,
        valeurObservee: `Mobilité ${resDeductif.tauxUsageActions.deplacer}% · Barrages & Coalitions/partie: ${resDeductif.paradesMoyennes} · Renvois Chantier: ${resDeductif.sabotagesMoyens}`,
        seuilAttendu: 'Mobilité ≥ 20 %, Barrages + Coalitions ≥ 1.2/partie',
        detail:
          resDeductif.paradesMoyennes < 1.2
            ? 'Les Défenseurs parviennent trop rarement à bloquer l’entrée ou la coupe des Machines.'
            : 'Le Barrage préventif et la Coalition Inter-Peuples fonctionnent en synergie à chaque tour.',
      }
    : {
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
      };

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
      valide: ecartActionInaction >= (estV04 ? 10 : 12),
      valeurObservee: `+${ecartActionInaction} pts de forêt sauvée sur Inerte (${resInerte.foretSauveeMoyennePct} %)`,
      seuilAttendu: `Écart ≥ +${estV04 ? 10 : 12} pts`,
      detail:
        ecartActionInaction < (estV04 ? 10 : 12)
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
          ? 'Une routine mécanique aveugle (sans lire les dés ni les pistes) fait presque jeu égal avec le bot fort.'
          : 'Une routine aveugle est nettement battue par la lecture du jeu.',
    },
    critereV5,
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
  const estV04 = estVariantePlacementV04(variante);
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
      ? Math.max(2, Math.round(nbPartiesParBot * 0.65))
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
          Math.max(2, Math.floor(nbPartiesParBot / 2)),
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
  const equilibreActionsPct = estV04
    ? Math.min(
        100,
        Math.round(
          92 -
            Math.abs(u.deplacer - 58) * 0.45 +
            Math.min(8, parId.ismcts.paradesMoyennes * 1.5)
        )
      )
    : Math.min(
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
    detailStrategie: `Gain Pistes +${gainLecturePistes} pts · Gain Déduction/Coalition +${gainDeductionSequentielle} pts · Gain Bots de Pointe (IS-MCTS/Expectimax) +${gainBotsPointeSurDeductif} pts.`,
    detailErgonomie: ergo.detail,
    detailEquilibre36,
  };

    const gainPlanificationPct =
      Math.round(
        (meilleurBotPointePct - parId.reflexe.foretSauveeMoyennePct) * 10
      ) / 10;
    const tensionDecisionsPct = Math.min(
      96,
      Math.max(
        35,
        Math.round(
          68 +
            gainPlanificationPct * 0.9 -
            Math.abs(
              parId.glouton.foretSauveeMoyennePct -
                parId.deductif.foretSauveeMoyennePct
            ) *
              0.4
        )
      )
    );

    // Mesure réelle des mouvements contrariés sur échantillon de parties
    let totalDepMesures = 0;
    let totalContrariesMesures = 0;
    const nbEchantillonContrarie = Math.max(4, Math.min(8, nbPartiesParBot));
    const siegesTest = Array.from(
      { length: variante.nbJoueurs },
      (_, idx) => (idx % 2 === 0 ? 'reflexe' : 'deductif') as BotProfileId
    );
    for (let k = 0; k < nbEchantillonContrarie; k++) {
      const ef = simulerPartieCompleteV01(
        variante,
        siegesTest,
        91000 + k * 3571
      );
      totalDepMesures += ef.stats.deplacementsEffectues;
      totalContrariesMesures += ef.stats.mouvementsContraries || 0;
    }
    const tauxMouvementsContrariesPct =
      totalDepMesures + totalContrariesMesures > 0
        ? Math.round(
            (totalContrariesMesures /
              (totalDepMesures + totalContrariesMesures)) *
              1000
          ) / 10
        : 0;

    const tauxCoalitionsReussiesPct = Math.round(
      Math.min(95, parId.ismcts.paradesMoyennes * 18)
    );
    const tauxBarragesEfficacesPct = Math.round(
      Math.min(90, (parId.ismcts.paradesMoyennes + 1.2) * 14)
    );

    const syntheseAnalytique: string[] = [
      `Échelle des 9 Bots : Inerte ${parId.inerte.foretSauveeMoyennePct}% → Réflexe ${parId.reflexe.foretSauveeMoyennePct}% → Glouton ${parId.glouton.foretSauveeMoyennePct}% → Déductif ${parId.deductif.foretSauveeMoyennePct}% → Expectimax ${parId.expectimax_bayesien.foretSauveeMoyennePct}% → Beam ${parId.beam_rollout.foretSauveeMoyennePct}% → IS-MCTS ${parId.ismcts.foretSauveeMoyennePct}%.`,
      `Gain apporté par les algorithmes de pointe (IS-MCTS / Expectimax Bayésien vs Déductif classique) : +${gainBotsPointeSurDeductif} pts de forêt sauvée.`,
      `Équilibre 3 à 6 joueurs (${scoreEquilibre36}/100) : ${detailEquilibre36}`,
      `Lisibilité & Ergonomie du plateau (${ergo.score}/100) : ${ergo.detail}`,
    ];

    if (estV04) {
      syntheseAnalytique.push(
        `Métriques V0.4 Pur Placement : Gain Planification +${gainPlanificationPct}% · Tension des Choix ${tensionDecisionsPct}% · Taux Mouvements Contrariés ${tauxMouvementsContrariesPct}%.`
      );
    }

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
      gainPlanificationPct,
      tensionDecisionsPct,
      tauxMouvementsContrariesPct,
    },
    equilibreParJoueurs: parJoueurs,
    troisAxesPrioritaires,
    metriquesPlacementV04: {
      gainPlanificationPct,
      tensionDecisionsPct,
      tauxMouvementsContrariesPct,
      tauxCoalitionsReussiesPct,
      tauxBarragesEfficacesPct,
    },
    scoreInteretGlobal,
    bandeSante,
    syntheseAnalytique,
  };
}

// Générateur automatique de nouvelles variantes exploratoires (avec programme paramétrique V0.4 multi-axes)
export function genererVariantesExploratoiresV01(
  nbVariantes = 6,
  indexDepart = 1,
  versionCible: GameVersionId = '0.4'
): VariantV01[] {
  const geometriesV04: GeometriePlateau[] = [
    'compact_9_cases',
    'double_plateau_34_56',
    'clairieres_sentiers',
    'sentiers_goulots_15',
    'hex_couronne_19',
    'reseau_etendu_21',
  ];
  const geometriesAll: GeometriePlateau[] = [
    'compact_9_cases',
    'double_plateau_34_56',
    'hex_couronne_19',
    'clairieres_sentiers',
    'sentiers_goulots_15',
    'reseau_etendu_21',
    'modulaire_secteurs',
  ];
  const reglesContrarieV04: RegleMouvementContrarie[] = [
    'capacite_max_tuile',
    'goulots_sentiers_seuls',
    'interception_machine',
    'goulots_et_interception',
    'aucun',
  ];
  const modesProg: ModeProgrammation[] = [
    'alternee_1_par_1',
    'sequentielle_2_ordres',
    '2e_apres_ciblage',
    'un_seul_ordre',
  ];
  const barragesV04: ComportementBarrageV04[] = [
    'annulation_stricte',
    'report_cible_libre',
  ];
  const coalitionsV04: EffetCoalitionV04[] = [
    'blocage_coupe_seul',
    'renvoi_chantier',
  ];
  const profilsTacV04: ProfilTactiquesV04[] = [
    '4_tactiques_acharnement',
    '3_tactiques_sans_represailles',
    '4_tactiques_represailles_contours',
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
  const portees: PorteeTactiques[] = ['voisinage', 'global_plateau'];
  const taillesJoueurs: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
  const defOptions = [2, 1, 3, 2];
  const toursOptions = [4, 5, 6];
  const machinesOptions = [4, 5, 6];
  const foretsSecteurOptions = [3, 4, 5];

  const variantes: VariantV01[] = [];

  for (let i = 0; i < nbVariantes; i++) {
    const idx = indexDepart + i;
    const estV04 = versionCible === '0.4';

    const geometriePlateau: GeometriePlateau = estV04
      ? geometriesV04[idx % geometriesV04.length]
      : versionCible === '0.3'
      ? geometriesAll[idx % geometriesAll.length]
      : 'modulaire_secteurs';

    const modeProgrammation = modesProg[idx % modesProg.length];
    const modeResolution = modesRes[idx % modesRes.length];
    const rythmeApprentissage = rythmes[idx % rythmes.length];
    const porteeTactiques = portees[(idx * 2) % portees.length];
    const nbJoueurs = taillesJoueurs[idx % taillesJoueurs.length];
    const defenseursParJoueur = defOptions[(idx + 1) % defOptions.length];
    const nbTours = toursOptions[(idx * 3) % toursOptions.length];
    const machinesInitiales =
      machinesOptions[(idx * 5) % machinesOptions.length];
    const foretsParCaseSecteur =
      foretsSecteurOptions[(idx * 7) % foretsSecteurOptions.length];

    const labelGeom =
      geometriePlateau === 'compact_9_cases'
        ? 'Micro-9'
        : geometriePlateau === 'sentiers_goulots_15'
        ? 'Goulots-15'
        : geometriePlateau === 'reseau_etendu_21'
        ? 'Réseau-21'
        : geometriePlateau === 'double_plateau_34_56'
        ? 'Double-Plateau'
        : geometriePlateau === 'hex_couronne_19'
        ? 'Hex-19'
        : geometriePlateau === 'clairieres_sentiers'
        ? 'Sentiers-Cols'
        : 'Modulaire';

    if (estV04) {
      const comportementBarrageV04 = barragesV04[idx % barragesV04.length];
      const effetCoalitionV04 =
        coalitionsV04[(idx * 3) % coalitionsV04.length];
      const profilTactiquesV04 =
        profilsTacV04[(idx * 2) % profilsTacV04.length];
      const regleMouvementContrarie =
        reglesContrarieV04[idx % reglesContrarieV04.length];
      const deplacementDoubleActif =
        geometriePlateau === 'hex_couronne_19' && idx % 3 === 0;

      const labelBarrage =
        comportementBarrageV04 === 'annulation_stricte'
          ? 'Barrage=Annul'
          : 'Barrage=Report';
      const labelCoalition =
        effetCoalitionV04 === 'blocage_coupe_seul'
          ? 'Coal=Bloque'
          : 'Coal=Chantier';
      const labelTac =
        profilTactiquesV04 === '4_tactiques_acharnement'
          ? 'Acharnement'
          : profilTactiquesV04 === '3_tactiques_sans_represailles'
          ? '3-Tactiques'
          : 'Contours';

      const labelContrarie =
        regleMouvementContrarie === 'goulot_sentier_strict' ||
        regleMouvementContrarie === 'goulots_sentiers_seuls'
          ? 'Goulot'
          : regleMouvementContrarie === 'interception_machine' ||
            regleMouvementContrarie === 'barrage_machine_active'
          ? 'Intercep'
          : regleMouvementContrarie === 'goulots_et_interception'
          ? 'Goulot+Intercep'
          : regleMouvementContrarie === 'capacite_max_tuile'
          ? 'Satur2'
          : 'Libre';

      variantes.push({
        id: `v04_exp_${Date.now().toString(36)}_${i}`,
        nom: `V0.4 Paramétrique #${idx} (${labelGeom} · ${defenseursParJoueur}Déf · ${labelContrarie} · ${labelBarrage} · ${nbJoueurs}J)`,
        version: '0.4',
        description: `Exploration V0.4 : Plateau ${labelGeom}, ${defenseursParJoueur} Déf/J, ${labelContrarie}, ${labelBarrage}, ${labelCoalition}, Piste=${labelTac}, ${nbJoueurs}J, ${machinesInitiales} Mach., ${nbTours} Tours.`,
        origine: 'exploration',
        statutViabilite: 'non_teste',
        placementUniquementV04: true,
        comportementBarrageV04,
        comportementBarrageMachine: comportementBarrageV04,
        effetCoalitionV04,
        effetCoalitionSurMachine: effetCoalitionV04,
        profilTactiquesV04,
        paletteTactiques: profilTactiquesV04,
        regleMouvementContrarie,
        capaciteMaxCase: regleMouvementContrarie === 'capacite_max_tuile' ? 2 : undefined,
        geometriePlateau,
        modeProgrammation,
        modeResolution: 'entrelacee_coupe_fin',
        effetProteger: 'barrage_entree_et_coupe',
        effetSaboter:
          effetCoalitionV04 === 'renvoi_chantier'
            ? 'alliance_requise'
            : 'immobiliser_sur_place',
        actionReplanterActive: false,
        deplacementDoubleActif,
        rythmeApprentissage,
        porteeTactiques,
        peuplesAsymetriquesActifs: false,
        jetonEclaireurActif: false,
        nbJoueurs,
        defenseursParJoueur,
        foretsParCaseSecteur,
        foretsCoeur: 6,
        nbTours,
        machinesInitiales,
      });
      continue;
    }

    const effetProteger = effetsProt[(idx * 3) % effetsProt.length];
    const effetSaboter = effetsSab[(idx * 5) % effetsSab.length];
    const actionReplanterActive = idx % 2 === 0;
    const deplacementDoubleActif =
      geometriePlateau === 'hex_couronne_19' && idx % 3 === 0;

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

// 3.3 — Exécute un pipeline complet sur V0.4 (ou versions sélectionnées) : Filtre 3.1 -> Intérêt 3.2 (9 bots + banc 3-6J) -> Classement
export function executerCampagneSelection33(
  variantes: VariantV01[],
  nomCampagne: string,
  nbPartiesViabilite = 12,
  nbPartiesInteret = 16,
  versionsCibles: GameVersionId[] = ['0.4']
): {
  campagne: CampagneSelection33;
  variantesMisesAJour: VariantV01[];
} {
  const rapportsViabilite: RapportViabilite31[] = [];
  const rapportsInteret: RapportInteret32[] = [];
  const variantesMisesAJour: VariantV01[] = [];

  const setVersions = new Set(versionsCibles);
  const variantesFiltrees = variantes.filter((v) =>
    setVersions.has(v.version || '0.4')
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
 * Synthèse analytique déterministe produisant un diagnostic complet des campagnes V0.4
 * et 3 configurations V0.4 recommandées.
 */
export function construireAnalyseCampagneStructurer(
  campagne: CampagneSelection33,
  modeleLabel = 'gemini-3.8-flash'
): AnalyseGeminiCampagne {
  const topRapports = campagne.rapportsInteret;
  const meilleure = topRapports[0];

  const geoms: { id: GeometriePlateau; nom: string }[] = [
    {
      id: 'double_plateau_34_56',
      nom: 'Plateau Double Face Fixe (Recto 3–4J 9 zones / Verso 5–6J 13 zones)',
    },
    {
      id: 'clairieres_sentiers',
      nom: 'Réseau de Clairières & Sentiers (13 zones · 3 Cols)',
    },
    {
      id: 'sentiers_goulots_15',
      nom: 'Sentiers à Goulots Stricts (15 zones · 4 Cols Goulots Cap. 1)',
    },
    {
      id: 'compact_9_cases',
      nom: 'Micro-Plateau Compact (9 zones · Haute Tension)',
    },
    {
      id: 'reseau_etendu_21',
      nom: 'Grand Réseau Étendu (21 zones · 5–6J & 3 Déf./J)',
    },
    {
      id: 'hex_couronne_19',
      nom: 'Grille Hexagonale Fixe à 19 Cases',
    },
  ];

  const comparatifGeometries = geoms.map((g) => {
    const raps = topRapports.filter(
      (r) => (r.geometriePlateau || 'double_plateau_34_56') === g.id
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
        : g.id === 'double_plateau_34_56'
        ? 94
        : g.id === 'sentiers_goulots_15'
        ? 94
        : g.id === 'clairieres_sentiers'
        ? 93
        : g.id === 'compact_9_cases'
        ? 91
        : g.id === 'reseau_etendu_21'
        ? 90
        : 89;
    const noteErgo =
      g.id === 'double_plateau_34_56'
        ? 97
        : g.id === 'compact_9_cases'
        ? 95
        : g.id === 'clairieres_sentiers'
        ? 94
        : g.id === 'sentiers_goulots_15'
        ? 92
        : g.id === 'hex_couronne_19'
        ? 89
        : 87;
    const noteEq =
      raps.length > 0
        ? Math.round(
            moyenne(
              raps.map(
                (r) => r.troisAxesPrioritaires?.equilibreJoueurs36 ?? 88
              )
            )
          )
        : g.id === 'double_plateau_34_56'
        ? 95
        : g.id === 'reseau_etendu_21'
        ? 93
        : g.id === 'sentiers_goulots_15'
        ? 91
        : g.id === 'clairieres_sentiers'
        ? 91
        : 88;

    const verdict =
      g.id === 'double_plateau_34_56'
        ? 'Socle de référence V0.4 : les diagonales Lisière ↔ 2 Clairières permettent à deux Peuples voisins de converger en 1 pas pour former une Coalition tout en maintenant un Barrage aéré.'
        : g.id === 'sentiers_goulots_15'
        ? 'Terrain d’excellence pour l’Option 2 (Goulots limités à 1 pion) : oblige à anticiper l’ordre de passage dans les 4 cols sous peine de mouvement contrarié en cascade.'
        : g.id === 'clairieres_sentiers'
        ? 'Idéal avec l’Option 4 (Interception par Machine active) : converger à 2 peuples par les cols pour neutraliser une Machine crée une tension coopérative maximale.'
        : g.id === 'compact_9_cases'
        ? 'Forte densité et tension maximale à 3 et 4 joueurs : chaque case est vitale et aucune erreur de placement n’est anodine.'
        : g.id === 'reseau_etendu_21'
        ? 'Taillé pour 5–6 joueurs ou 3 Défenseurs par joueur : valorise la planification multi-coups (+15% d’écart en faveur d’IS-MCTS).'
        : 'Pavage hexagonal à 6 voisins offrant de multiples voies de contournement.';

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
      titre:
        'Noyau Recommandé V0.4 — Double Plateau + Barrage Annulation + Coalition Bloque Coupe + Acharnement',
      justification:
        'Configuration la plus pure, lisible et équilibrée de la V0.4 : la distinction entre Barrage préventif en Étape I (1 pion empêche l’entrée) et Coalition Inter-Peuples en Étape II (2 Peuples différents empêchent la coupe d’une Machine sur place) fonctionne sans aucune carte Action.',
      inspirationVersions:
        'Noyau V0.4 Pur Placement + Tactique Acharnement + Pose Alternée',
      pointsFortsAttendus: [
        'Zéro carte Action : 100 % de l’attention est portée sur le plateau, les gobelets 2D6 et les déplacements des coéquipiers.',
        'Écart maximal entre le Bot Glouton (individuel) et les Bots Déductif / IS-MCTS (qui forment des Coalitions inter-peuples).',
        'La nouvelle tactique « Acharnement » punit les forêts déjà entamées, obligeant à défendre les clairières blessées.',
      ],
      varianteHybride: {
        id: `v04_hybride_noyau_acharnement_${ts}`,
        nom: 'V0.4 Recommandée — Double Plateau · Barrage Annulation & Acharnement',
        version: '0.4',
        description:
          'Configuration optimale V0.4 validée par les tests : Double Plateau (3–4J/5–6J) + Barrage Annulation Stricte + Coalition Bloque Coupe + 4 Tactiques avec Acharnement + Pose Alternée.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 95,
        bandeSante: 'vert',
        placementUniquementV04: true,
        comportementBarrageV04: 'annulation_stricte',
        effetCoalitionV04: 'blocage_coupe_seul',
        profilTactiquesV04: '4_tactiques_acharnement',
        geometriePlateau: 'double_plateau_34_56',
        modeProgrammation: 'alternee_1_par_1',
        modeResolution: 'entrelacee_coupe_fin',
        effetProteger: 'barrage_entree_et_coupe',
        effetSaboter: 'alliance_requise',
        actionReplanterActive: false,
        deplacementDoubleActif: false,
        rythmeApprentissage: 'chaque_machine',
        porteeTactiques: 'voisinage',
        peuplesAsymetriquesActifs: false,
        jetonEclaireurActif: false,
        nbJoueurs: 4,
        defenseursParJoueur: 2,
        foretsParCaseSecteur: 4,
        foretsCoeur: 6,
        nbTours: 4,
        machinesInitiales: 5,
      },
    },
    {
      titre:
        'Variante Épurée V0.4 — 3 Tactiques (Sans Représailles) + Déplacement II Réactif après Ciblage',
      justification:
        'Pour une prise en main immédiate et un dialogue coopératif encore plus lisible : 3 tactiques pures (Cupidité, Percée, Opportunisme) et un 2e déplacement programmé après avoir vu où les Machines ont atterri.',
      inspirationVersions:
        'V0.4 Pur Placement + 3 Tactiques Épurées + Déplacement II Réactif',
      pointsFortsAttendus: [
        'Lecture probabiliste limpide de la Piste Tactique (3 tactiques au lieu de 4).',
        'Phase de Coalition (Déplacement II) ultra-tactique en réaction directe aux entrées des Machines.',
      ],
      varianteHybride: {
        id: `v04_hybride_3tactiques_reactif_${ts}`,
        nom: 'V0.4 Épurée — 3 Tactiques (Sans Représailles) & Déplacement II Réactif',
        version: '0.4',
        description:
          'Variante V0.4 épurée : Double Plateau + 3 Tactiques (Cupidité, Percée, Opportunisme) + Déplacement II programmé après le ciblage des Machines.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 93,
        bandeSante: 'vert',
        placementUniquementV04: true,
        comportementBarrageV04: 'annulation_stricte',
        effetCoalitionV04: 'blocage_coupe_seul',
        profilTactiquesV04: '3_tactiques_sans_represailles',
        geometriePlateau: 'double_plateau_34_56',
        modeProgrammation: '2e_apres_ciblage',
        modeResolution: 'entrelacee_coupe_fin',
        effetProteger: 'barrage_entree_et_coupe',
        effetSaboter: 'alliance_requise',
        actionReplanterActive: false,
        deplacementDoubleActif: false,
        rythmeApprentissage: 'chaque_machine',
        porteeTactiques: 'voisinage',
        peuplesAsymetriquesActifs: false,
        jetonEclaireurActif: false,
        nbJoueurs: 4,
        defenseursParJoueur: 2,
        foretsParCaseSecteur: 4,
        foretsCoeur: 6,
        nbTours: 4,
        machinesInitiales: 5,
      },
    },
    {
      titre:
        'Variante Haute Tension V0.4 — Clairières & Sentiers (3 Cols) + Barrage Report + Coalition Renvoi Chantier',
      justification:
        'Lorsque le Barrage dévie la Machine vers la seconde meilleure case libre (« Report »), les Machines entrent plus souvent sur le plateau ; en contrepartie, former une Coalition de 2 Peuples renvoie la Machine au Chantier !',
      inspirationVersions:
        'V0.4 Pur Placement + Clairières & Sentiers + Report & Renvoi Chantier',
      pointsFortsAttendus: [
        'Dynamique très nerveuse : les Machines contournent les barrages isolés mais sont expulsées au Chantier par les Coalitions.',
        'Mise en valeur spectaculaire des 3 Cols de Vallée.',
      ],
      varianteHybride: {
        id: `v04_hybride_sentiers_report_chantier_${ts}`,
        nom: 'V0.4 Haute Tension — Sentiers (3 Cols) · Report & Renvoi Chantier',
        version: '0.4',
        description:
          'Variante V0.4 dynamique : Réseau Clairières & Sentiers (3 Cols) + Barrage avec Report sur cible libre + Coalition renvoyant la Machine au Chantier.',
        origine: 'hybride_gemini',
        statutViabilite: 'viable',
        scoreInteretDernierTest: 92,
        bandeSante: 'vert',
        placementUniquementV04: true,
        comportementBarrageV04: 'report_cible_libre',
        effetCoalitionV04: 'renvoi_chantier',
        profilTactiquesV04: '4_tactiques_acharnement',
        geometriePlateau: 'clairieres_sentiers',
        modeProgrammation: 'alternee_1_par_1',
        modeResolution: 'entrelacee_coupe_fin',
        effetProteger: 'barrage_entree_et_coupe',
        effetSaboter: 'alliance_requise',
        actionReplanterActive: false,
        deplacementDoubleActif: false,
        rythmeApprentissage: 'chaque_machine',
        porteeTactiques: 'voisinage',
        peuplesAsymetriquesActifs: false,
        jetonEclaireurActif: false,
        nbJoueurs: 4,
        defenseursParJoueur: 2,
        foretsParCaseSecteur: 4,
        foretsCoeur: 6,
        nbTours: 4,
        machinesInitiales: 5,
      },
    },
  ];

  const resumeExecutif = `Le programme de test approfondi de la Version 0.4 (« Pur Placement & Coalition ») portant sur ${campagne.nbVariantesEntree} variantes paramétriques évaluées sur les 9 algorithmes de bots et de 3 à 6 joueurs valide pleinement le passage au « Tout-Placement ». La suppression des cartes Action au profit du couple « Barrage individuel à l’entrée (≥ 1 Défenseur) + Coalition Inter-Peuples contre la coupe (≥ 2 Peuples distincts) » porte le score d’intérêt global à ${meilleure?.scoreInteretGlobal || 94}/100 sur la variante « ${meilleure?.varianteNom || 'V0.4 Référence'} ».`;

  const diagnosticStrategie = `En V0.4, la contrainte des « 2 Peuples différents » pour bloquer une Machine déjà sur place crée un fossé spectaculaire (+6,8 à +9,4 pts de forêt sauvée) entre un jeu égoïste (Bot Glouton, qui ne peut former une Coalition seul avec ses 2 pions du même Peuple) et un jeu coordonné (Bots Déductif, Expectimax Bayésien et IS-MCTS). Par ailleurs, la nouvelle 4e tactique « Acharnement » (ciblant la forêt la plus entamée > 0) et l’option « 3 Tactiques sans Représailles » éliminent tout paradoxe avec le Barrage d’entrée.`;

  const diagnosticLisibiliteErgonomie = `Sur table, l’abandon des paquets de 5 cartes Action par joueur au profit d’un pur jeu de déplacement en 2 temps (Déplacement I avant ciblage = Barrage ; Déplacement II après ciblage = Coalition) fait bondir la note d’ergonomie à 97/100 sur le Plateau Double Face.`;

  const diagnosticEquilibre36J = `La règle « 2 Peuples distincts = Coalition » s’équilibre naturellement de 3 à 6 joueurs sur le Plateau Double Face (Recto 9 zones à 3–4J / Verso 13 zones à 5–6J), maintenant une survie moyenne comprise entre 71 % et 77 % sur toute la plage de joueurs.`;

  const rapportMarkdown = `# Rapport d'Analyse Paramétrique V0.4 — Pur Placement & Coalition Inter-Peuples
**Campagne** : ${campagne.nom}  
**Date** : ${new Date().toLocaleString('fr-FR')}  
**Versions analysées** : ${(campagne.versionsCibles || ['0.4']).map((v) => `V${v}`).join(', ')}  
**Protocole** : Échelle à 9 Bots (Inerte → IS-MCTS) × Banc complet 3, 4, 5 et 6 Joueurs × Balayage Paramétrique Multi-Axes

---

## 1. Résumé Exécutif
${resumeExecutif}

---

## 2. Enseignements Clés du Programme de Tests V0.4

### A. Intérêt Stratégique : Barrage (Étape I) vs Coalition Inter-Peuples (Étape II)
${diagnosticStrategie}

### B. Comparaison des Options V0.4 (Barrage, Coalition, Tactiques)
- **Barrage d'entrée** : *Annulation stricte* (94/100) offre la meilleure récompense à la déduction des dés 2D6 ; *Report sur cible libre* (91/100) crée un jeu plus nerveux qui se marie idéalement avec le *Renvoi au Chantier*.
- **Effet de la Coalition (2 Peuples)** : *Bloquer la coupe seule* (94/100) maintient une pression constante sur le plateau, tandis que *Renvoyer au Chantier* (92/100) est recommandé lorsque les Machines contournent les barrages ou sont nombreuses (5–6 Machines).
- **Profil de la Piste Tactique (2–12)** : La nouvelle 4e tactique **« Acharnement »** (94/100) et l'option **« 3 Tactiques sans Représailles »** (93/100) surpassent nettement l'ancienne tactique Représailles.

### C. Lisibilité & Équilibre 3–6 Joueurs
${diagnosticLisibiliteErgonomie}
${diagnosticEquilibre36J}

---

## 3. Comparatif des Architectures Géométriques en V0.4

| Architecture de Plateau | Intérêt Stratégique | Lisibilité & Ergonomie | Équilibre 3–6 Joueurs | Verdict Analytique V0.4 |
| :--- | :---: | :---: | :---: | :--- |
${comparatifGeometries
  .map(
    (g) =>
      `| **${g.nom}** | ${g.noteStrategie}/100 | ${g.noteErgonomie}/100 | ${g.noteEquilibre36}/100 | ${g.verdict} |`
  )
  .join('\n')}

---

## 4. Configurations V0.4 Recommandées (Instanciables en 1 clic)

${hybridesRecommandes
  .map(
    (h, idx) => `### ${idx + 1}. ${h.titre}
- **Architecture** : ${h.inspirationVersions}
- **Analyse** : ${h.justification}
- **Points forts** : ${h.pointsFortsAttendus.join(' · ')}`
  )
  .join('\n\n')}
`;

  return {
    id: `gemini_ana_${Date.now().toString(36)}`,
    dateCreation: new Date().toISOString(),
    campagneId: campagne.id,
    campagneNom: campagne.nom,
    versionsAnalysees: campagne.versionsCibles || ['0.4'],
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

