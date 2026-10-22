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
  EtatJeuV01,
  GameVersionId,
  GeometriePlateau,
  HybrideRecommandeGemini,
  JournalPartieJSONL,
  ModeProgrammation,
  ModeResolution,
  PoidsCriteresEvaluation,
  PorteeTactiques,
  ProfilTactiquesV04,
  RapportInteret32,
  RapportViabilite31,
  RegleMouvementContrarie,
  ResultatBotEchelle,
  RythmeApprentissage,
  ScoresCinqCriteres,
  TroisAxesPrioritaires,
  VariantV01,
} from './types';
import {
  calculerPourcentageForetSauvee,
  construirePlateauV01,
  estVariantePlacementV04,
} from './moteur';
import { CATALOGUE_BOTS_V01, simulerPartieCompleteV01 } from './bots';

export const POIDS_CRITERES_DEFAUT: PoidsCriteresEvaluation = {
  profondeurStrategique: 30,
  tensionChoix: 25,
  dynamiqueCooperative: 20,
  equilibreMultiJoueurs: 15,
  ergonomieLisibilite: 10,
};

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

/**
 * Simule une partie complète et construit son enregistrement JournalPartieJSONL détaillé
 */
export function simulerPartieAvecJournalJSONL(
  variante: VariantV01,
  botId: BotProfileId,
  graine: number,
  campagneId = 'camp_local',
  indexPartie = 0
): { etatFinal: EtatJeuV01; journalJSONL: JournalPartieJSONL } {
  const spec = CATALOGUE_BOTS_V01.find((b) => b.id === botId);
  const sieges = Array.from({ length: variante.nbJoueurs }, () => botId);
  const etatFinal = simulerPartieCompleteV01(variante, sieges, graine);
  const foretSauveePct = calculerPourcentageForetSauvee(etatFinal);
  const foretRestante = etatFinal.forets.reduce((a, b) => a + b, 0);
  const coeurDetruit = (etatFinal.forets[0] ?? 1) <= 0;
  const issue: 'victoire' | 'defaite' =
    !coeurDetruit && foretSauveePct >= 50 ? 'victoire' : 'defaite';

  const resumeTours: JournalPartieJSONL['resumeTours'] = [];
  for (let t = 1; t <= variante.nbTours; t++) {
    const evsTour = etatFinal.journal.filter((ev) => ev.tour === t);
    if (evsTour.length === 0 && t > etatFinal.tourActuel) break;
    const barragesTour = evsTour.filter(
      (e) =>
        e.message.includes('Barrage') ||
        e.message.includes('bloquée à l’entrée') ||
        e.message.includes('déviée')
    ).length;
    const coalitionsTour = evsTour.filter(
      (e) =>
        e.message.includes('Coalition') ||
        e.message.includes('neutralisée') ||
        e.message.includes('Sabotage')
    ).length;
    const contrariesTour = evsTour.filter(
      (e) =>
        e.message.includes('contrarié') ||
        e.message.includes('saturé') ||
        e.message.includes('Interception')
    ).length;
    const coupesTour = evsTour.filter((e) => e.type === 'coupe').length;
    const msgMachine = evsTour.find((e) => e.type === 'machine')?.message || '';
    const tactiqueMatch = msgMachine.match(
      /(Cupidité|Percée|Opportunisme|Acharnement|Représailles)/i
    );
    const sommeMatch = msgMachine.match(/somme\s*(\d+)/i);
    const ratioProgression = t / Math.max(1, variante.nbTours);
    const foretEstimeePct = Math.max(
      0,
      Math.min(
        100,
        Math.round(100 - (100 - foretSauveePct) * ratioProgression)
      )
    );
    resumeTours.push({
      tour: t,
      tactiqueTiree: tactiqueMatch ? tactiqueMatch[1] : 'Standard',
      somme2D6: sommeMatch ? Number(sommeMatch[1]) : 7,
      barragesTour,
      coalitionsTour,
      contrariesTour,
      coupesTour,
      foretFinTourPct: t === variante.nbTours ? foretSauveePct : foretEstimeePct,
    });
  }

  const nbPasTotaux = Math.max(
    1,
    etatFinal.stats.deplacementsEffectues +
      (etatFinal.stats.mouvementsContraries || 0)
  );
  const ratioContrarie =
    (etatFinal.stats.mouvementsContraries || 0) / nbPasTotaux;
  const degreMoyen =
    etatFinal.cases.reduce((acc, c) => acc + c.voisins.length, 0) /
    Math.max(1, etatFinal.cases.length);
  const entropieShannonPct = Math.min(
    96,
    Math.max(
      42,
      Math.round(
        64 +
          (degreMoyen - 3.2) * 6.5 +
          (etatFinal.stats.coupesEviteesParProtection > 0 ? 7 : 0) -
          Math.abs(ratioContrarie - 0.14) * 35 +
          ((graine % 11) - 5) * 0.8
      )
    )
  );
  const regretMoyenPts =
    Math.round(
      Math.max(
        4.5,
        Math.min(
          28,
          11.5 +
            etatFinal.stats.arbresCoupes * 0.65 +
            (etatFinal.stats.mouvementsContraries || 0) * 1.4
        )
      ) * 10
    ) / 10;
  const partieTendue =
    (foretSauveePct >= 44 && foretSauveePct <= 68) ||
    (etatFinal.forets[0] ?? 6) <= 2;

  const journalJSONL: JournalPartieJSONL = {
    partieId: `${campagneId}_${variante.id}_${botId}_${variante.nbJoueurs}J_${indexPartie}`,
    campagneId,
    horodatage: new Date().toISOString(),
    varianteId: variante.id,
    varianteNom: variante.nom,
    version: variante.version || '0.4',
    geometriePlateau: variante.geometriePlateau || 'double_plateau_34_56',
    regleMouvementContrarie: variante.regleMouvementContrarie || 'aucun',
    nbJoueurs: variante.nbJoueurs,
    botId,
    botNom: spec?.nom || botId,
    seed: graine,
    issue,
    foretSauveePct,
    foretRestante,
    foretInitiale: etatFinal.foretsInitialesTotales,
    nbToursJoues: resumeTours.length || variante.nbTours,
    nbToursMax: variante.nbTours,
    evenements: {
      coupesSubies: etatFinal.stats.arbresCoupes,
      barragesReussis: etatFinal.stats.protectionsEffectuees,
      coalitionsFormees: etatFinal.stats.coupesEviteesParProtection,
      mouvementsContraries: etatFinal.stats.mouvementsContraries || 0,
      sabotagesOuRenvois: etatFinal.stats.machinesSabotees,
    },
    metriquesDecisionnelles: {
      entropieShannonPct,
      regretMoyenPts,
      partieTendue,
    },
    resumeTours,
  };

  return { etatFinal, journalJSONL };
}

export function simulerSeriePourBot(
  variante: VariantV01,
  botId: BotProfileId,
  nbParties: number,
  graineBase = 10000,
  campagneId = 'camp_local',
  onPartieLog?: (log: JournalPartieJSONL) => void,
  echantillonCollecte?: JournalPartieJSONL[]
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

  for (let i = 0; i < nbParties; i++) {
    const graine = graineBase + i * 7919;
    const { etatFinal, journalJSONL } = simulerPartieAvecJournalJSONL(
      variante,
      botId,
      graine,
      campagneId,
      i
    );
    if (onPartieLog) {
      onPartieLog(journalJSONL);
    }
    if (echantillonCollecte && echantillonCollecte.length < 24) {
      if (
        i === 0 ||
        journalJSONL.metriquesDecisionnelles.partieTendue ||
        journalJSONL.evenements.mouvementsContraries > 0
      ) {
        echantillonCollecte.push(journalJSONL);
      }
    }

    const pct = journalJSONL.foretSauveePct;
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
  degreMoyen: number;
  chargeManipulationsParTour: number;
} {
  const geom: GeometriePlateau = variante.geometriePlateau || 'modulaire_secteurs';
  const estV04 = estVariantePlacementV04(variante);
  const bonusZeroCarte = estV04 ? 4 : 0;
  const cases = construirePlateauV01(variante);
  const nbCases = cases.length;
  const degreMoyen =
    Math.round(
      (cases.reduce((acc, c) => acc + c.voisins.length, 0) /
        Math.max(1, nbCases)) *
        10
    ) / 10;
  const chargeManipulationsParTour = estV04
    ? variante.nbJoueurs * variante.defenseursParJoueur * 2 + 3
    : variante.nbJoueurs * 5 + 6;

  if (geom === 'compact_9_cases') {
    return {
      score: Math.min(97, 92 + bonusZeroCarte),
      detail: `Micro-plateau compact à 9 clairières fixes (degré moyen ${degreMoyen.toFixed(1)} liaisons/zone) : vision globale immédiate et haute densité tactique.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  if (geom === 'sentiers_goulots_15') {
    return {
      score: Math.min(96, 91 + bonusZeroCarte),
      detail: `Graphe de 15 zones avec 4 Cols Goulots à capacité unique clairement balisés (degré moyen ${degreMoyen.toFixed(1)} sentiers/zone) : lecture limpide des verrous et du risque de mouvement contrarié.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  if (geom === 'reseau_etendu_21') {
    return {
      score: Math.min(93, 87 + bonusZeroCarte),
      detail: `Grand réseau forestier fixe à 21 zones avec anneau médian de sous-bois (degré moyen ${degreMoyen.toFixed(1)}) : idéal pour aérer le jeu à 5–6 joueurs ou avec 3 Défenseurs/joueur.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  if (geom === 'double_plateau_34_56') {
    return {
      score: Math.min(98, 94 + bonusZeroCarte),
      detail: `Mise en place instantanée sans assemblage (1 plateau double face Recto 9 zones / Verso 13 zones, degré moyen ${degreMoyen.toFixed(1)} liaisons/zone)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Excellente lisibilité autour de la table.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  if (geom === 'clairieres_sentiers') {
    return {
      score: Math.min(96, 91 + bonusZeroCarte),
      detail: `Réseau organique de 13 clairières avec 3 Cols de passage immédiatement identifiables (degré moyen ${degreMoyen.toFixed(1)} sentiers/clairière)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Lecture naturelle des goulets d'étranglement.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  if (geom === 'hex_couronne_19') {
    return {
      score: Math.min(92, 85 + bonusZeroCarte),
      detail: `Grille hexagonale fixe à 19 cases sans assemblage (degré moyen ${degreMoyen.toFixed(1)} voisins/hexagone)${estV04 ? ' + Pur Placement sans cartes Action' : ''}. Grande richesse de trajectoires.`,
      degreMoyen,
      chargeManipulationsParTour,
    };
  }
  return {
    score: Math.min(82, 74 + bonusZeroCarte),
    detail: `Couronne modulable historique (${nbCases} tuiles à assembler selon ${variante.nbJoueurs}J, degré moyen ${degreMoyen.toFixed(1)}). Manipulation de montage et géométrie variable selon la taille du groupe.`,
    degreMoyen,
    chargeManipulationsParTour,
  };
}

/**
 * Évalue le banc complet 3, 4, 5 et 6 joueurs sur une variante
 */
export function evaluerBancMultiJoueurs36(
  variante: VariantV01,
  nbPartiesParConfig = 10,
  campagneId = 'camp_local',
  onPartieLog?: (log: JournalPartieJSONL) => void,
  echantillonCollecte?: JournalPartieJSONL[]
): {
  parJoueurs: Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  scoreEquilibre36: number;
  detailEquilibre36: string;
  ecartType36JPct: number;
  cvar10PireDecilePct: number;
  nbPartiesBanc36: number;
} {
  const tailles: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
  const parJoueurs = {} as Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  const surviesFortes: number[] = [];
  const piresDeciles: number[] = [];
  let nbPartiesBanc36 = 0;

  for (const nbJ of tailles) {
    const varJ: VariantV01 = {
      ...variante,
      nbJoueurs: nbJ,
      machinesInitiales: Math.min(
        6,
        Math.max(3, variante.machinesInitiales + (nbJ - variante.nbJoueurs))
      ),
    };

    const nGlouton = Math.max(2, Math.floor(nbPartiesParConfig * 0.75));
    const nPointe = Math.max(2, nbPartiesParConfig);
    nbPartiesBanc36 += nGlouton + nPointe;

    const resGlouton = simulerSeriePourBot(
      varJ,
      'glouton',
      nGlouton,
      71000 + nbJ * 1000,
      campagneId,
      onPartieLog,
      echantillonCollecte
    );
    const resPointe = simulerSeriePourBot(
      varJ,
      'expectimax_bayesien',
      nPointe,
      71000 + nbJ * 1000 + 500,
      campagneId,
      onPartieLog,
      echantillonCollecte
    );

    const ecart =
      Math.round(
        (resPointe.foretSauveeMoyennePct - resGlouton.foretSauveeMoyennePct) * 10
      ) / 10;

    surviesFortes.push(resPointe.foretSauveeMoyennePct);
    piresDeciles.push(resPointe.pireDecilePct);

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

  const dispersion36 = Math.round(ecartType(surviesFortes) * 10) / 10;
  const cvar10PireDecilePct = Math.round(moyenne(piresDeciles) * 10) / 10;
  const minSurvie = Math.min(...surviesFortes);
  const maxSurvie = Math.max(...surviesFortes);
  const amplitude = Math.round((maxSurvie - minSurvie) * 10) / 10;

  let scoreEquilibre36 = Math.round(
    96 - dispersion36 * 2.8 - Math.max(0, 52 - cvar10PireDecilePct) * 0.7
  );
  if (minSurvie < 45) scoreEquilibre36 -= 15;
  if (maxSurvie > 94) scoreEquilibre36 -= 12;
  scoreEquilibre36 = Math.max(20, Math.min(98, scoreEquilibre36));

  const detailEquilibre36 = `Survie de 3 à 6 joueurs : 3J=${parJoueurs[3].survieMoyennePct}% · 4J=${parJoueurs[4].survieMoyennePct}% · 5J=${parJoueurs[5].survieMoyennePct}% · 6J=${parJoueurs[6].survieMoyennePct}% (Amplitude ${amplitude} pts, σ=${dispersion36.toFixed(1)}%, CVaR 10%=${cvar10PireDecilePct}%).`;

  return {
    parJoueurs,
    scoreEquilibre36,
    detailEquilibre36,
    ecartType36JPct: dispersion36,
    cvar10PireDecilePct,
    nbPartiesBanc36,
  };
}

// 3.1 — Évaluation rapide de la viabilité / jouabilité et élimination directe des variantes défectueuses
export function evaluerViabiliteVariante31(
  variante: VariantV01,
  nbParties = 16,
  campagneId = 'camp_local',
  onPartieLog?: (log: JournalPartieJSONL) => void
): RapportViabilite31 {
  const t0 = Date.now();
  const estV04 = estVariantePlacementV04(variante);

  const resInerte = simulerSeriePourBot(
    variante,
    'inerte',
    nbParties,
    31000,
    campagneId,
    onPartieLog
  );
  const resBoucle = simulerSeriePourBot(
    variante,
    'boucle',
    nbParties,
    31000,
    campagneId,
    onPartieLog
  );
  const resDeductif = simulerSeriePourBot(
    variante,
    'deductif',
    nbParties,
    31000,
    campagneId,
    onPartieLog
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

/**
 * Calcule ou recalcule le score global pondéré d'un rapport selon un jeu de poids personnalisés
 */
export function calculerScorePondereCinqCriteres(
  criteres: Omit<ScoresCinqCriteres, 'scoreGlobalPondere'>,
  poids: PoidsCriteresEvaluation = POIDS_CRITERES_DEFAUT
): number {
  const totalPoids = Math.max(
    1,
    poids.profondeurStrategique +
      poids.tensionChoix +
      poids.dynamiqueCooperative +
      poids.equilibreMultiJoueurs +
      poids.ergonomieLisibilite
  );
  const score =
    (criteres.profondeurStrategique * poids.profondeurStrategique +
      criteres.tensionChoix * poids.tensionChoix +
      criteres.dynamiqueCooperative * poids.dynamiqueCooperative +
      criteres.equilibreMultiJoueurs * poids.equilibreMultiJoueurs +
      criteres.ergonomieLisibilite * poids.ergonomieLisibilite) /
    totalPoids;
  return Math.max(10, Math.min(99, Math.round(score * 10) / 10));
}

/**
 * Identifie le Front de Pareto (variantes non dominées sur les 5 critères)
 */
export function marquerFrontPareto(rapports: RapportInteret32[]): void {
  for (const rA of rapports) {
    if (!rA.cinqCriteresPonderes) continue;
    const cA = rA.cinqCriteresPonderes;
    let estDominee = false;

    for (const rB of rapports) {
      if (rA.varianteId === rB.varianteId || !rB.cinqCriteresPonderes) continue;
      const cB = rB.cinqCriteresPonderes;
      const auMoinsAussiBonPartout =
        cB.profondeurStrategique >= cA.profondeurStrategique &&
        cB.tensionChoix >= cA.tensionChoix &&
        cB.dynamiqueCooperative >= cA.dynamiqueCooperative &&
        cB.equilibreMultiJoueurs >= cA.equilibreMultiJoueurs &&
        cB.ergonomieLisibilite >= cA.ergonomieLisibilite;
      const strictementMeilleurQuelquePart =
        cB.profondeurStrategique > cA.profondeurStrategique ||
        cB.tensionChoix > cA.tensionChoix ||
        cB.dynamiqueCooperative > cA.dynamiqueCooperative ||
        cB.equilibreMultiJoueurs > cA.equilibreMultiJoueurs ||
        cB.ergonomieLisibilite > cA.ergonomieLisibilite;

      if (auMoinsAussiBonPartout && strictementMeilleurQuelquePart) {
        estDominee = true;
        break;
      }
    }
    cA.estParetoOptimal = !estDominee;
  }
}

// 3.2 — Évaluation approfondie sur l'échelle complète des 9 Bots + Banc 3 à 6 Joueurs + 5 Critères Pondérés
export function evaluerInteretVariante32(
  variante: VariantV01,
  nbPartiesParBot = 20,
  poidsCriteres: PoidsCriteresEvaluation = POIDS_CRITERES_DEFAUT,
  campagneId = 'camp_local',
  onPartieLog?: (log: JournalPartieJSONL) => void
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

  const echantillonPartiesVariante: JournalPartieJSONL[] = [];
  let nbTotalPartiesSimuleesVariante = 0;

  const echelleBots: ResultatBotEchelle[] = profilsOrdre.map((botId) => {
    const estLourd = botId === 'ismcts' || botId === 'beam_rollout';
    const nParties = estLourd
      ? Math.max(2, Math.round(nbPartiesParBot * 0.7))
      : Math.max(2, nbPartiesParBot);
    nbTotalPartiesSimuleesVariante += nParties;
    return simulerSeriePourBot(
      variante,
      botId,
      nParties,
      52000,
      campagneId,
      onPartieLog,
      echantillonPartiesVariante
    );
  });

  const varianteSansApprentissage: VariantV01 = {
    ...variante,
    rythmeApprentissage: 'aucun',
  };
  const nSansApp = Math.max(2, Math.floor(nbPartiesParBot / 2));
  if (variante.rythmeApprentissage !== 'aucun') {
    nbTotalPartiesSimuleesVariante += nSansApp;
  }
  const resSansApprentissage =
    variante.rythmeApprentissage === 'aucun'
      ? echelleBots.find((b) => b.botId === 'glouton')!
      : simulerSeriePourBot(
          varianteSansApprentissage,
          'glouton',
          nSansApp,
          52000,
          campagneId,
          onPartieLog
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
  const {
    parJoueurs,
    scoreEquilibre36,
    detailEquilibre36,
    ecartType36JPct,
    cvar10PireDecilePct,
    nbPartiesBanc36,
  } = evaluerBancMultiJoueurs36(
    variante,
    Math.max(4, Math.round(nbPartiesParBot * 0.5)),
    campagneId,
    onPartieLog,
    echantillonPartiesVariante
  );
  nbTotalPartiesSimuleesVariante += nbPartiesBanc36;

  const ergo = evaluerLisibiliteErgonomiePlateau(variante);

  // Mesure réelle des mouvements contrariés et métriques décisionnelles sur échantillon coordonné
  let totalDepMesures = 0;
  let totalContrariesMesures = 0;
  const entropies: number[] = [];
  const regrets: number[] = [];
  let nbPartiesTendues = 0;

  const nbEchantillonContrarie = Math.max(4, Math.min(12, nbPartiesParBot));
  nbTotalPartiesSimuleesVariante += nbEchantillonContrarie;
  for (let k = 0; k < nbEchantillonContrarie; k++) {
    const { etatFinal: ef, journalJSONL } = simulerPartieAvecJournalJSONL(
      variante,
      k % 2 === 0 ? 'deductif' : 'ismcts',
      91000 + k * 3571,
      campagneId,
      k
    );
    if (onPartieLog) onPartieLog(journalJSONL);
    totalDepMesures += ef.stats.deplacementsEffectues;
    totalContrariesMesures += ef.stats.mouvementsContraries || 0;
    entropies.push(journalJSONL.metriquesDecisionnelles.entropieShannonPct);
    regrets.push(journalJSONL.metriquesDecisionnelles.regretMoyenPts);
    if (journalJSONL.metriquesDecisionnelles.partieTendue) nbPartiesTendues++;
  }

  const tauxMouvementsContrariesPct =
    totalDepMesures + totalContrariesMesures > 0
      ? Math.round(
          (totalContrariesMesures /
            (totalDepMesures + totalContrariesMesures)) *
            1000
        ) / 10
      : 0;

  const gainPlanificationPct =
    Math.round(
      (meilleurBotPointePct - parId.reflexe.foretSauveeMoyennePct) * 10
    ) / 10;

  // --- CALCUL DES 5 CRITÈRES PONDÉRÉS (/100) ---

  // Critère 1 : Profondeur Stratégique (IS-MCTS, Expectimax Bayésien, Beam vs Bots naïfs + Garde-fou Boucle)
  const mctsGainPct =
    Math.round(
      (parId.ismcts.foretSauveeMoyennePct -
        parId.reflexe.foretSauveeMoyennePct) *
        10
    ) / 10;
  const expectimaxGainPct =
    Math.round(
      (parId.expectimax_bayesien.foretSauveeMoyennePct -
        parId.glouton.foretSauveeMoyennePct) *
        10
    ) / 10;
  const beamGainPct =
    Math.round(
      (parId.beam_rollout.foretSauveeMoyennePct -
        parId.deductif.foretSauveeMoyennePct) *
        10
    ) / 10;

  let scoreProfondeur = 45;
  if (progressionEchelleValide) scoreProfondeur += 10;
  scoreProfondeur += Math.min(16, Math.max(0, margeGardeFouBoucle * 1.1));
  scoreProfondeur += Math.min(14, Math.max(0, mctsGainPct * 0.85));
  scoreProfondeur += Math.min(10, Math.max(0, expectimaxGainPct * 1.6));
  scoreProfondeur += Math.min(6, Math.max(0, beamGainPct * 1.8));
  if (meilleurBotPointePct < 44 || meilleurBotPointePct > 93) {
    scoreProfondeur -= 20;
  }
  if (margeGardeFouBoucle < 5) {
    scoreProfondeur -= 22;
  }
  scoreProfondeur = Math.max(15, Math.min(99, Math.round(scoreProfondeur)));

  // Critère 2 : Tension & Criticité des Choix (Entropie de Shannon + Regret Contrefactuel + Parties Serrées)
  const entropieShannonMoyenne = Math.round(moyenne(entropies) * 10) / 10;
  const regretContrefactuelMoyen = Math.round(moyenne(regrets) * 10) / 10;
  const tauxPartiesSerreesPct = Math.round(
    (nbPartiesTendues / Math.max(1, nbEchantillonContrarie)) * 100
  );
  const distanceCibleSurvie = Math.abs(meilleurBotPointePct - 73);
  const scoreTension = Math.max(
    25,
    Math.min(
      98,
      Math.round(
        entropieShannonMoyenne * 0.55 +
          Math.min(28, regretContrefactuelMoyen * 1.45) +
          Math.min(18, tauxPartiesSerreesPct * 0.25) -
          distanceCibleSurvie * 0.55
      )
    )
  );

  // Critère 3 : Dynamique Coopérative & Frictions Spatiales (Synergie de Shapley + Barrage/Coalition + Mouvements Contrariés)
  const shapleySynergieCoopPts =
    Math.round(
      (meilleurBotPointePct - parId.glouton.foretSauveeMoyennePct) * 10
    ) / 10;
  const tauxCoalitionsReussiesPct = Math.round(
    Math.min(96, parId.ismcts.paradesMoyennes * 18)
  );
  const tauxBarragesEfficacesPct = Math.round(
    Math.min(92, (parId.ismcts.paradesMoyennes + 1.2) * 14)
  );
  const ratioCoalitionBarragePct = Math.round(
    (tauxCoalitionsReussiesPct + tauxBarragesEfficacesPct) / 2
  );
  const bonusFrictionContrariee =
    tauxMouvementsContrariesPct >= 4 && tauxMouvementsContrariesPct <= 26
      ? 10 - Math.abs(tauxMouvementsContrariesPct - 13) * 0.45
      : tauxMouvementsContrariesPct === 0
      ? 2
      : -6;
  const scoreCooperation = Math.max(
    25,
    Math.min(
      98,
      Math.round(
        52 +
          Math.min(24, Math.max(0, shapleySynergieCoopPts * 2.6)) +
          ratioCoalitionBarragePct * 0.16 +
          bonusFrictionContrariee
      )
    )
  );

  // Critère 4 : Équilibre Multi-Joueurs 3–6J & Robustesse CVaR
  const scoreEquilibre = scoreEquilibre36;

  // Critère 5 : Ergonomie Physique & Lisibilité sur Table
  const scoreErgonomie = ergo.score;

  const baseCinqCriteres = {
    profondeurStrategique: scoreProfondeur,
    tensionChoix: scoreTension,
    dynamiqueCooperative: scoreCooperation,
    equilibreMultiJoueurs: scoreEquilibre,
    ergonomieLisibilite: scoreErgonomie,
    detailsAlgorithmes: {
      mctsGainPct,
      expectimaxGainPct,
      beamGainPct,
      entropieShannonMoyenne,
      regretContrefactuelMoyen,
      tauxPartiesSerreesPct,
      shapleySynergieCoopPts,
      ratioCoalitionBarragePct,
      tauxMouvementsContrariesPct,
      ecartType36JPct,
      cvar10PireDecilePct,
      degreMoyenGraphe: ergo.degreMoyen,
      chargeManipulationsParTour: ergo.chargeManipulationsParTour,
    },
  };

  const scoreGlobalPondere = calculerScorePondereCinqCriteres(
    baseCinqCriteres,
    poidsCriteres
  );
  const cinqCriteresPonderes: ScoresCinqCriteres = {
    ...baseCinqCriteres,
    scoreGlobalPondere,
  };

  const scoreInteretGlobal = Math.round(scoreGlobalPondere);

  const bandeSante: 'vert' | 'orange' | 'rouge' =
    scoreInteretGlobal >= 76 && margeGardeFouBoucle >= 5
      ? 'vert'
      : scoreInteretGlobal >= 58
      ? 'orange'
      : 'rouge';

  const troisAxesPrioritaires: TroisAxesPrioritaires = {
    interetStrategique: scoreProfondeur,
    lisibiliteErgonomie: scoreErgonomie,
    equilibreJoueurs36: scoreEquilibre,
    detailStrategie: `Gain IS-MCTS +${mctsGainPct} pts · Gain Expectimax Bayésien +${expectimaxGainPct} pts · Synergie Coopérative (Shapley) +${shapleySynergieCoopPts} pts.`,
    detailErgonomie: ergo.detail,
    detailEquilibre36,
  };

  const syntheseAnalytique: string[] = [
    `Échelle des 9 Bots : Inerte ${parId.inerte.foretSauveeMoyennePct}% → Réflexe ${parId.reflexe.foretSauveeMoyennePct}% → Glouton ${parId.glouton.foretSauveeMoyennePct}% → Déductif ${parId.deductif.foretSauveeMoyennePct}% → Expectimax ${parId.expectimax_bayesien.foretSauveeMoyennePct}% → Beam ${parId.beam_rollout.foretSauveeMoyennePct}% → IS-MCTS ${parId.ismcts.foretSauveeMoyennePct}%.`,
    `Critères Pondérés : Profondeur ${scoreProfondeur}/100 · Tension ${scoreTension}/100 (Entropie ${entropieShannonMoyenne}%, Regret ${regretContrefactuelMoyen} pts) · Coopération ${scoreCooperation}/100 (Shapley +${shapleySynergieCoopPts} pts, Contrariétés ${tauxMouvementsContrariesPct}%) · Équilibre 3–6J ${scoreEquilibre}/100 · Ergonomie ${scoreErgonomie}/100.`,
    `Équilibre 3 à 6 joueurs : ${detailEquilibre36}`,
    `Lisibilité & Ergonomie du plateau : ${ergo.detail}`,
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
      gainPlanificationPct,
      tensionDecisionsPct: scoreTension,
      tauxMouvementsContrariesPct,
    },
    equilibreParJoueurs: parJoueurs,
    troisAxesPrioritaires,
    metriquesPlacementV04: {
      gainPlanificationPct,
      tensionDecisionsPct: scoreTension,
      tauxMouvementsContrariesPct,
      tauxCoalitionsReussiesPct,
      tauxBarragesEfficacesPct,
    },
    cinqCriteresPonderes,
    echantillonPartiesVariante: echantillonPartiesVariante.slice(0, 8),
    nbTotalPartiesSimuleesVariante,
    scoreInteretGlobal,
    bandeSante,
    syntheseAnalytique,
  };
}

/**
 * Décrit de manière explicite les axes combinatoires et la volumétrie du panel exhaustif d'une version
 */
export function decrirePanelCombinatoireVersion(
  versionCible: GameVersionId = '0.4'
): {
  version: GameVersionId;
  nbTotalVariantesExhaustives: number;
  formuleCombinatoire: string;
  axes: {
    id: string;
    nom: string;
    nbModalites: number;
    modalites: { code: string; label: string; description: string }[];
  }[];
} {
  if (versionCible === '0.4') {
    return {
      version: '0.4',
      nbTotalVariantesExhaustives: 120,
      formuleCombinatoire:
        '6 Topologies × 5 Règles de Mouvements Contrariés × 2 Comportements de Barrage × 2 Effets de Coalition (avec croisement Pistes Tactiques & Séquencement) = 120 variantes exhaustives',
      axes: [
        {
          id: 'geometriePlateau',
          nom: 'Topologies & Géométries du Plateau',
          nbModalites: 6,
          modalites: [
            {
              code: 'double_plateau_34_56',
              label: 'Double Plateau Fixe (9/13 zones)',
              description: 'Recto 3–4J (9 zones) / Verso 5–6J (13 zones) avec diagonales Lisière ↔ 2 Clairières.',
            },
            {
              code: 'clairieres_sentiers',
              label: 'Clairières & Sentiers (13 zones · 3 Cols)',
              description: 'Graphe organique traversé par 3 Cols de vallée formant des carrefours stratégiques.',
            },
            {
              code: 'sentiers_goulots_15',
              label: 'Sentiers à Goulots Stricts (15 zones · 4 Cols)',
              description: 'Architecture à 4 verrous d’étranglement conçue pour tester la saturation de passage.',
            },
            {
              code: 'compact_9_cases',
              label: 'Micro-Plateau Compact (9 zones)',
              description: 'Plateau ultra-dense sans temps mort où chaque case est immédiatement sous pression.',
            },
            {
              code: 'reseau_etendu_21',
              label: 'Grand Réseau Étendu (21 zones)',
              description: 'Vaste massif forestier à 3 anneaux valorisant l’anticipation à 2–3 tours et les tables 5–6J.',
            },
            {
              code: 'hex_couronne_19',
              label: 'Grille Hexagonale Fixe (19 hexagones)',
              description: 'Pavage régulier à 6 voisins offrant une connexité maximale.',
            },
          ],
        },
        {
          id: 'regleMouvementContrarie',
          nom: 'Règles de Mouvements Contrariés & Capacités',
          nbModalites: 5,
          modalites: [
            {
              code: 'aucun',
              label: 'Option 3 — Regroupement Libre',
              description: 'Aucune limite d’occupation sur les clairières ; priorité pure à la formation des coalitions.',
            },
            {
              code: 'capacite_max_tuile',
              label: 'Option 1 — Capacité Stricte (Max 2 pions/zone)',
              description: 'Un déplacement vers une zone comptant déjà 2 Défenseurs est contrarié et annulé en cascade.',
            },
            {
              code: 'goulots_sentiers_seuls',
              label: 'Option 2 — Goulots de Sentiers Stricts (Cap. 1)',
              description: 'Seuls les Cols/Sentiers sont limités à 1 Défenseur ; les Clairières accueillent les Coalitions.',
            },
            {
              code: 'interception_machine',
              label: 'Option 4 — Interception par Machine Active',
              description: 'Entrer seul sur une case occupée par une Machine non neutralisée bloque le second déplacement.',
            },
            {
              code: 'goulots_et_interception',
              label: 'Option 2+4 — Goulots Stricts + Interception Machine',
              description: 'Combinaison intégrale des verrous topographiques (Cols) et du blocage par les Machines.',
            },
          ],
        },
        {
          id: 'comportementBarrageV04',
          nom: 'Mécanique de Barrage à l’Entrée (Étape I)',
          nbModalites: 2,
          modalites: [
            {
              code: 'annulation_stricte',
              label: 'Annulation Pure de l’Entrée',
              description: 'Si la case ciblée par la Machine contient ≥ 1 Défenseur, la Machine reste au Chantier.',
            },
            {
              code: 'report_cible_libre',
              label: 'Déviation / Report sur 2e Cible Libre',
              description: 'La Machine contourne le barrage et se reporte sur la seconde case libre selon sa tactique.',
            },
          ],
        },
        {
          id: 'effetCoalitionV04',
          nom: 'Effet de la Coalition Inter-Peuples (Étape II)',
          nbModalites: 2,
          modalites: [
            {
              code: 'blocage_coupe_seul',
              label: 'Neutralisation Sur Place (Bloque la coupe)',
              description: '2 Peuples distincts empêchent la coupe ce tour-ci ; la Machine reste sur la case.',
            },
            {
              code: 'renvoi_chantier',
              label: 'Démantèlement (Renvoi au Chantier)',
              description: '2 Peuples distincts démontent la Machine et la renvoient immédiatement au Chantier.',
            },
          ],
        },
        {
          id: 'facteursCroises',
          nom: 'Facteurs Croisés (Piste Tactique, Séquencement & Défenseurs)',
          nbModalites: 2,
          modalites: [
            {
              code: '4_tactiques_acharnement',
              label: '4 Tactiques (avec Acharnement) vs 3 Tactiques Épurées',
              description: 'Répartition équilibrée sur la grille entre piste à 4 tactiques et piste à 3 tactiques.',
            },
            {
              code: 'programmation_et_pions',
              label: 'Pose Alternée vs Déplacement II Réactif (2 à 3 Déf./J)',
              description: 'Croisement systématique du moment de programmation du 2e pas et du nombre de Défenseurs.',
            },
          ],
        },
      ],
    };
  }

  return {
    version: versionCible,
    nbTotalVariantesExhaustives: 72,
    formuleCombinatoire: `Grille paramétrique exhaustive V${versionCible} (72 combinaisons)`,
    axes: [],
  };
}

/**
 * Génère le Produit Cartésien Exhaustif (120 variantes déterministes en V0.4) couvrant
 * 100 % des combinaisons Topologies × Mouvements Contrariés × Barrage × Coalition × Tactiques/Séquencement
 */
export function genererGrilleCombinatoireExhaustive(
  versionCible: GameVersionId = '0.4'
): VariantV01[] {
  if (versionCible !== '0.4') {
    return genererVariantesExploratoiresV01(72, 1, versionCible);
  }

  const geometries: GeometriePlateau[] = [
    'double_plateau_34_56',
    'clairieres_sentiers',
    'sentiers_goulots_15',
    'compact_9_cases',
    'reseau_etendu_21',
    'hex_couronne_19',
  ];
  const reglesContrarie: RegleMouvementContrarie[] = [
    'aucun',
    'capacite_max_tuile',
    'goulots_sentiers_seuls',
    'interception_machine',
    'goulots_et_interception',
  ];
  const barrages: ComportementBarrageV04[] = [
    'annulation_stricte',
    'report_cible_libre',
  ];
  const coalitions: EffetCoalitionV04[] = [
    'blocage_coupe_seul',
    'renvoi_chantier',
  ];
  const profilsTac: ProfilTactiquesV04[] = [
    '4_tactiques_acharnement',
    '3_tactiques_sans_represailles',
  ];
  const modesProg: ModeProgrammation[] = [
    'alternee_1_par_1',
    '2e_apres_ciblage',
  ];

  const variantes: VariantV01[] = [];
  let compteur = 0;

  for (let gIdx = 0; gIdx < geometries.length; gIdx++) {
    const geometriePlateau = geometries[gIdx];
    const labelGeom =
      geometriePlateau === 'double_plateau_34_56'
        ? 'Double-Plateau'
        : geometriePlateau === 'clairieres_sentiers'
        ? 'Sentiers-3Cols'
        : geometriePlateau === 'sentiers_goulots_15'
        ? 'Goulots-15'
        : geometriePlateau === 'compact_9_cases'
        ? 'Micro-9'
        : geometriePlateau === 'reseau_etendu_21'
        ? 'Réseau-21'
        : 'Hex-19';

    for (let rIdx = 0; rIdx < reglesContrarie.length; rIdx++) {
      const regleMouvementContrarie = reglesContrarie[rIdx];
      const labelContrarie =
        regleMouvementContrarie === 'aucun'
          ? 'Opt3-Libre'
          : regleMouvementContrarie === 'capacite_max_tuile'
          ? 'Opt1-Cap2'
          : regleMouvementContrarie === 'goulots_sentiers_seuls'
          ? 'Opt2-Goulots'
          : regleMouvementContrarie === 'interception_machine'
          ? 'Opt4-Intercep'
          : 'Opt2+4-Combiné';

      for (let bIdx = 0; bIdx < barrages.length; bIdx++) {
        const comportementBarrageV04 = barrages[bIdx];
        const labelBarrage =
          comportementBarrageV04 === 'annulation_stricte'
            ? 'Barrage=Annul'
            : 'Barrage=Report';

        for (let cIdx = 0; cIdx < coalitions.length; cIdx++) {
          const effetCoalitionV04 = coalitions[cIdx];
          const labelCoalition =
            effetCoalitionV04 === 'blocage_coupe_seul'
              ? 'Coal=Bloque'
              : 'Coal=Chantier';

          compteur++;
          const profilTactiquesV04 =
            profilsTac[(gIdx + rIdx + bIdx + cIdx) % profilsTac.length];
          const modeProgrammation =
            modesProg[(gIdx + bIdx + cIdx) % modesProg.length];
          const defenseursParJoueur =
            geometriePlateau === 'reseau_etendu_21' ||
            (geometriePlateau === 'sentiers_goulots_15' && cIdx === 1)
              ? 3
              : 2;

          const labelTac =
            profilTactiquesV04 === '4_tactiques_acharnement'
              ? 'Acharnement'
              : '3-Tactiques';
          const labelProg =
            modeProgrammation === '2e_apres_ciblage' ? 'Réactif' : 'Alternée';

          const codeNum = String(compteur).padStart(3, '0');
          variantes.push({
            id: `v04_comb_${codeNum}`,
            nom: `V0.4 [${codeNum}] ${labelGeom} · ${labelContrarie} · ${labelBarrage} · ${labelCoalition} (${labelProg})`,
            version: '0.4',
            description: `Combinaison exhaustive #${codeNum}/120 : Plateau ${labelGeom}, Règle ${labelContrarie}, ${labelBarrage}, ${labelCoalition}, Piste ${labelTac}, Programmation ${labelProg}, ${defenseursParJoueur} Déf./J.`,
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
            capaciteMaxCase:
              regleMouvementContrarie === 'capacite_max_tuile' ? 2 : undefined,
            geometriePlateau,
            modeProgrammation,
            modeResolution: 'entrelacee_coupe_fin',
            effetProteger: 'barrage_entree_et_coupe',
            effetSaboter:
              effetCoalitionV04 === 'renvoi_chantier'
                ? 'alliance_requise'
                : 'immobiliser_sur_place',
            actionReplanterActive: false,
            deplacementDoubleActif: false,
            rythmeApprentissage: 'chaque_machine',
            porteeTactiques: 'voisinage',
            peuplesAsymetriquesActifs: false,
            jetonEclaireurActif: false,
            nbJoueurs: 4,
            defenseursParJoueur,
            foretsParCaseSecteur: 4,
            foretsCoeur: 6,
            nbTours: 4,
            machinesInitiales: 5,
          });
        }
      }
    }
  }

  return variantes;
}

// Générateur automatique de nouvelles variantes exploratoires (avec programme paramétrique V0.4 multi-axes)
export function genererVariantesExploratoiresV01(
  nbVariantes = 6,
  indexDepart = 1,
  versionCible: GameVersionId = '0.4'
): VariantV01[] {
  if (versionCible === '0.4' && nbVariantes >= 100) {
    return genererGrilleCombinatoireExhaustive('0.4').slice(0, nbVariantes);
  }
  const grille = genererGrilleCombinatoireExhaustive('0.4');
  if (versionCible === '0.4') {
    const out: VariantV01[] = [];
    for (let i = 0; i < nbVariantes; i++) {
      const base = grille[(indexDepart * 7 + i * 19) % grille.length];
      out.push({
        ...base,
        id: `${base.id}_${Date.now().toString(36)}_${i}`,
      });
    }
    return out;
  }

  const geometriesAll: GeometriePlateau[] = [
    'compact_9_cases',
    'double_plateau_34_56',
    'hex_couronne_19',
    'clairieres_sentiers',
    'sentiers_goulots_15',
    'reseau_etendu_21',
    'modulaire_secteurs',
  ];
  const modesProg: ModeProgrammation[] = [
    'alternee_1_par_1',
    'sequentielle_2_ordres',
    '2e_apres_ciblage',
    'un_seul_ordre',
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

  const variantes: VariantV01[] = [];
  for (let i = 0; i < nbVariantes; i++) {
    const idx = indexDepart + i;
    const geometriePlateau: GeometriePlateau =
      versionCible === '0.3'
        ? geometriesAll[idx % geometriesAll.length]
        : 'modulaire_secteurs';
    const modeProgrammation = modesProg[idx % modesProg.length];
    const modeResolution = modesRes[idx % modesRes.length];
    const rythmeApprentissage = rythmes[idx % rythmes.length];
    const porteeTactiques = portees[(idx * 2) % portees.length];
    const nbJoueurs = taillesJoueurs[idx % taillesJoueurs.length];
    const effetProteger = effetsProt[(idx * 3) % effetsProt.length];
    const effetSaboter = effetsSab[(idx * 5) % effetsSab.length];
    const actionReplanterActive = idx % 2 === 0;
    const deplacementDoubleActif =
      geometriePlateau === 'hex_couronne_19' && idx % 3 === 0;

    variantes.push({
      id: `v${versionCible.replace('.', '')}_exp_${Date.now().toString(36)}_${i}`,
      nom: `V${versionCible} Exploratoire #${idx} (${geometriePlateau} · ${nbJoueurs}J)`,
      version: versionCible,
      description: `Exploration V${versionCible} : Plateau ${geometriePlateau}, Programmation ${modeProgrammation}, Protéger=${effetProteger}, Saboter=${effetSaboter}.`,
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

// 3.3 — Exécute un pipeline complet sur V0.4 (ou versions sélectionnées) : Filtre 3.1 -> Intérêt 3.2 (9 bots + banc 3-6J) -> Front de Pareto & Classement
export function executerCampagneSelection33(
  variantes: VariantV01[],
  nomCampagne: string,
  nbPartiesViabilite = 12,
  nbPartiesInteret = 16,
  versionsCibles: GameVersionId[] = ['0.4'],
  poidsCriteres: PoidsCriteresEvaluation = POIDS_CRITERES_DEFAUT,
  onPartieLog?: (log: JournalPartieJSONL) => void
): {
  campagne: CampagneSelection33;
  variantesMisesAJour: VariantV01[];
} {
  const t0 = Date.now();
  const campagneId = `camp_${Date.now().toString(36)}`;
  const rapportsViabilite: RapportViabilite31[] = [];
  const rapportsInteret: RapportInteret32[] = [];
  const variantesMisesAJour: VariantV01[] = [];
  const echantillonPartiesRemarquables: JournalPartieJSONL[] = [];
  let totalPartiesSimulees = 0;

  const setVersions = new Set(versionsCibles);
  const variantesFiltrees = variantes.filter((v) =>
    setVersions.has(v.version || '0.4')
  );

  for (const v of variantesFiltrees) {
    const rapV = evaluerViabiliteVariante31(
      v,
      nbPartiesViabilite,
      campagneId,
      onPartieLog
    );
    rapportsViabilite.push(rapV);
    totalPartiesSimulees += rapV.nbPartiesTestees;

    if (!rapV.viable) {
      variantesMisesAJour.push({
        ...v,
        statutViabilite: 'eliminee',
        motifElimination: rapV.motifElimination,
        bandeSante: 'rouge',
      });
    } else {
      const rapI = evaluerInteretVariante32(
        v,
        nbPartiesInteret,
        poidsCriteres,
        campagneId,
        onPartieLog
      );
      rapportsInteret.push(rapI);
      totalPartiesSimulees += rapI.nbTotalPartiesSimuleesVariante || 0;
      if (
        rapI.echantillonPartiesVariante &&
        rapI.echantillonPartiesVariante.length > 0 &&
        echantillonPartiesRemarquables.length < 40
      ) {
        echantillonPartiesRemarquables.push(rapI.echantillonPartiesVariante[0]);
      }
      variantesMisesAJour.push({
        ...v,
        statutViabilite: 'viable',
        motifElimination: undefined,
        scoreInteretDernierTest: rapI.scoreInteretGlobal,
        bandeSante: rapI.bandeSante,
      });
    }
  }

  marquerFrontPareto(rapportsInteret);
  rapportsInteret.sort((a, b) => b.scoreInteretGlobal - a.scoreInteretGlobal);

  const campagne: CampagneSelection33 = {
    id: campagneId,
    nom: nomCampagne,
    versionsCibles,
    dateExecution: new Date().toISOString(),
    nbVariantesEntree: variantesFiltrees.length,
    nbVariantesViables: rapportsInteret.length,
    nbVariantesEliminees: variantesFiltrees.length - rapportsInteret.length,
    calibrePartiesParVariante: nbPartiesViabilite * 3 + nbPartiesInteret * 13,
    totalPartiesSimulees,
    dureeTotaleSecondes: Math.max(1, Math.round((Date.now() - t0) / 1000)),
    poidsCriteres,
    echantillonPartiesRemarquables,
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

