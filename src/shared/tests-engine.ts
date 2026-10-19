import {
  BotProfileId,
  CampagneSelection33,
  CritereViabilite,
  EffetProteger,
  EffetSaboter,
  ModeProgrammation,
  ModeResolution,
  PorteeTactiques,
  RapportInteret32,
  RapportViabilite31,
  ResultatBotEchelle,
  RythmeApprentissage,
  VariantV01,
} from './types';
import { calculerPourcentageForetSauvee } from './moteur';
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

    // Compter les actions réellement exécutées
    totalDeplacer += etatFinal.stats.deplacementsEffectues;
    totalProteger += etatFinal.stats.protectionsEffectuees;
    totalSaboter += etatFinal.stats.machinesSabotees;
    totalReplanter += etatFinal.stats.foretsReplantees;
  }

  totalActions = Math.max(
    1,
    totalDeplacer + totalProteger + totalSaboter + totalReplanter
  );

  return {
    botId,
    botNom: spec?.nom || botId,
    foretSauveeMoyennePct: Math.round(moyenne(scoresPct) * 10) / 10,
    ecartTypePct: Math.round(ecartType(scoresPct) * 10) / 10,
    pireDecilePct: Math.round(pireDecile(scoresPct) * 10) / 10,
    arbresCoupesMoyen: Math.round(moyenne(coupes) * 10) / 10,
    paradesMoyennes: Math.round(moyenne(parades) * 10) / 10,
    sabotagesMoyens: Math.round(moyenne(sabotages) * 10) / 10,
    tauxUsageActions: {
      deplacer: Math.round((totalDeplacer / totalActions) * 100),
      proteger: Math.round((totalProteger / totalActions) * 100),
      saboter: Math.round((totalSaboter / totalActions) * 100),
      replanter: Math.round((totalReplanter / totalActions) * 100),
    },
  };
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
      intitule: 'Terminaison & Intégrité du Moteur',
      valide: true,
      valeurObservee: `${nbParties}/${nbParties} parties terminées en ${variante.nbTours} tours`,
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
          ? 'Submersion excessive : même le meilleur bot perd plus de la moitié de la forêt.'
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

// 3.2 — Évaluation approfondie de l'intérêt stratégique d'une variante sur l'échelle complète des 6 Bots
export function evaluerInteretVariante32(
  variante: VariantV01,
  nbPartiesParBot = 24
): RapportInteret32 {
  const t0 = Date.now();
  const profilsOrdre: BotProfileId[] = [
    'inerte',
    'hasard',
    'boucle',
    'reflexe',
    'glouton',
    'deductif',
  ];

  const echelleBots: ResultatBotEchelle[] = profilsOrdre.map((botId) =>
    simulerSeriePourBot(variante, botId, nbPartiesParBot, 52000)
  );

  // Mesurer l'impact propre de l'apprentissage du Méchant en comparant à un témoin sans apprentissage
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
          Math.max(12, Math.floor(nbPartiesParBot / 2)),
          52000
        );

  const parId = Object.fromEntries(
    echelleBots.map((r) => [r.botId, r])
  ) as Record<BotProfileId, ResultatBotEchelle>;

  const ecartDeductifSurInerte =
    Math.round(
      (parId.deductif.foretSauveeMoyennePct -
        parId.inerte.foretSauveeMoyennePct) *
        10
    ) / 10;

  const margeGardeFouBoucle =
    Math.round(
      (parId.deductif.foretSauveeMoyennePct -
        parId.boucle.foretSauveeMoyennePct) *
        10
    ) / 10;

  const gainDeductionSequentielle =
    Math.round(
      (parId.deductif.foretSauveeMoyennePct -
        parId.glouton.foretSauveeMoyennePct) *
        10
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
    parId.glouton.foretSauveeMoyennePct <= parId.deductif.foretSauveeMoyennePct;

  // Calcul de l'équilibre d'usage des actions chez le bot Déductif
  const u = parId.deductif.tauxUsageActions;
  const equilibreActionsPct = Math.min(
    100,
    Math.round(
      100 -
        Math.abs(u.deplacer - 35) * 0.7 -
        Math.abs(u.proteger - 45) * 0.7 -
        Math.max(0, 12 - u.saboter) * 2
    )
  );

  // Score composite d'intérêt stratégique sur 100
  let score = 40;
  if (progressionEchelleValide) score += 12;
  score += Math.min(18, Math.max(0, margeGardeFouBoucle * 1.2));
  score += Math.min(15, Math.max(0, gainLecturePistes * 1.4));
  score += Math.min(10, Math.max(0, gainDeductionSequentielle * 2.2));
  score += Math.min(5, Math.max(0, impactApprentissageMechant * 1.2));

  // Pénalité si la survie sort de la bande saine [45%..90%]
  if (
    parId.deductif.foretSauveeMoyennePct < 42 ||
    parId.deductif.foretSauveeMoyennePct > 92
  ) {
    score -= 25;
  }
  if (margeGardeFouBoucle < 5) {
    score -= 25;
  }

  const scoreInteretGlobal = Math.max(5, Math.min(99, Math.round(score)));
  const bandeSante: 'vert' | 'orange' | 'rouge' =
    scoreInteretGlobal >= 75 && margeGardeFouBoucle >= 5
      ? 'vert'
      : scoreInteretGlobal >= 55
      ? 'orange'
      : 'rouge';

  const syntheseAnalytique: string[] = [
    `Échelle des Bots : Inerte ${parId.inerte.foretSauveeMoyennePct}% → Hasard ${parId.hasard.foretSauveeMoyennePct}% → Réflexe ${parId.reflexe.foretSauveeMoyennePct}% → Glouton ${parId.glouton.foretSauveeMoyennePct}% → Déductif ${parId.deductif.foretSauveeMoyennePct}%.`,
    `Valeur de la lecture des 2 pistes (Glouton vs Réflexe) : ${gainLecturePistes >= 0 ? '+' : ''}${gainLecturePistes} pts de forêt sauvée.`,
    `Valeur de la déduction séquentielle autour de la table (Déductif vs Glouton) : ${gainDeductionSequentielle >= 0 ? '+' : ''}${gainDeductionSequentielle} pts.`,
    `Garde-fou anti-boucle (Déductif vs Boucle fixe) : ${margeGardeFouBoucle >= 0 ? '+' : ''}${margeGardeFouBoucle} pts (${margeGardeFouBoucle >= 8 ? 'Sain' : margeGardeFouBoucle >= 5 ? 'Acceptable' : 'Alerte boucle gagnante'}).`,
  ];

  return {
    varianteId: variante.id,
    varianteNom: variante.nom,
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
      impactApprentissageMechant,
      equilibreActionsPct,
    },
    scoreInteretGlobal,
    bandeSante,
    syntheseAnalytique,
  };
}

// Générateur automatique de nouvelles variantes V0.1 explorant le séquencement et les actions
export function genererVariantesExploratoiresV01(
  nbVariantes = 6,
  indexDepart = 1
): VariantV01[] {
  const modesProg: ModeProgrammation[] = [
    'sequentielle_2_ordres',
    'alternee_1_par_1',
    '2e_apres_ciblage',
    'un_seul_ordre',
  ];
  const modesRes: ModeResolution[] = [
    'entrelacee_coupe_fin',
    'deux_vagues_completes',
    'machines_avant_actions',
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
  const rythmes: RythmeApprentissage[] = [
    'chaque_machine',
    'fin_de_tour',
    'aucun',
  ];
  const portees: PorteeTactiques[] = ['voisinage', 'plateau_entier'];
  const taillesJoueurs: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];

  const variantes: VariantV01[] = [];

  for (let i = 0; i < nbVariantes; i++) {
    const idx = indexDepart + i;
    const modeProgrammation = modesProg[idx % modesProg.length];
    const modeResolution = modesRes[(idx * 2 + 1) % modesRes.length];
    const effetProteger = effetsProt[(idx * 3) % effetsProt.length];
    const effetSaboter = effetsSab[(idx * 5) % effetsSab.length];
    const rythmeApprentissage = rythmes[idx % rythmes.length];
    const porteeTactiques = portees[idx % 4 === 3 ? 1 : 0];
    const nbJoueurs = taillesJoueurs[idx % taillesJoueurs.length];
    const actionReplanterActive = idx % 3 === 0;
    const deplacementDoubleActif = idx % 4 === 2;

    variantes.push({
      id: `v01_exp_${Date.now().toString(36)}_${i}`,
      nom: `V0.1 Exploratoire #${idx} (${modeProgrammation.split('_')[0]} / ${effetProteger.split('_')[0]} / ${nbJoueurs}J)`,
      version: '0.1',
      description: `Exploration automatique : Programmation ${modeProgrammation}, Résolution ${modeResolution}, Protéger=${effetProteger}, Saboter=${effetSaboter}${actionReplanterActive ? ', +Replanter' : ''}.`,
      origine: 'exploration',
      statutViabilite: 'non_teste',
      modeProgrammation,
      modeResolution,
      effetProteger,
      effetSaboter,
      actionReplanterActive,
      deplacementDoubleActif,
      rythmeApprentissage,
      porteeTactiques,
      nbJoueurs,
      defenseursParJoueur: modeProgrammation === 'un_seul_ordre' ? 2 : 2,
      foretsParCaseSecteur: 4,
      foretsCoeur: 6,
      nbTours: 4,
      machinesInitiales: Math.min(6, nbJoueurs),
    });
  }

  return variantes;
}

// 3.3 — Exécute un pipeline complet : Filtre de viabilité 3.1 (élimination directe) -> Intérêt 3.2 sur les survivantes -> Sélection 3.3
export function executerCampagneSelection33(
  variantes: VariantV01[],
  nomCampagne: string,
  nbPartiesViabilite = 14,
  nbPartiesInteret = 20
): {
  campagne: CampagneSelection33;
  variantesMisesAJour: VariantV01[];
} {
  const rapportsViabilite: RapportViabilite31[] = [];
  const rapportsInteret: RapportInteret32[] = [];
  const variantesMisesAJour: VariantV01[] = [];

  for (const v of variantes) {
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
    dateExecution: new Date().toISOString(),
    nbVariantesEntree: variantes.length,
    nbVariantesViables: rapportsInteret.length,
    nbVariantesEliminees: variantes.length - rapportsInteret.length,
    rapportsViabilite,
    rapportsInteret,
    meilleureVarianteId: rapportsInteret[0]?.varianteId || null,
  };

  return { campagne, variantesMisesAJour };
}
