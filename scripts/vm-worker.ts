/**
 * Démon & Exécuteur de Campagnes VM Oracle Cloud (Atelier V1 — V0.1 / V0.2 / V0.3)
 *
 * Permet de faire tourner en tâche de fond ou via cron sur votre VM Oracle Cloud :
 * 1. La génération automatique de nouvelles variantes exploratoires (notamment V0.3 géométries de plateau),
 * 2. Le filtre éliminatoire coupe-circuit 3.1 (purgeant immédiatement les variantes non viables),
 * 3. L'évaluation complète 3.2 sur l'échelle des 9 bots (jusqu'à Expectimax Bayésien, Beam Rollout et IS-MCTS) + Banc 3, 4, 5 et 6 joueurs,
 * 4. La synthèse analytique Gemini et la génération des variantes hybrides recommandées + rapport Markdown.
 *
 * Usage sur votre VM Oracle Cloud :
 *   npx tsx scripts/vm-worker.ts --once
 *   npx tsx scripts/vm-worker.ts --daemon
 */

import {
  chargerEtatAtelier,
  genererAnalyseGeminiOuFallback,
  sauvegarderEtatAtelier,
} from '../server';
import {
  evaluerViabiliteVariante31,
  executerCampagneSelection33,
  genererVariantesExploratoiresV01,
} from '../src/shared/tests-engine';

async function executerCycleVM() {
  console.log(
    `[VM Oracle Cloud - ${new Date().toISOString()}] Démarrage du cycle intensif V0.1 · V0.2 · V0.3 (9 Bots + Banc 3–6J)...`
  );
  const state = chargerEtatAtelier();

  for (const sched of state.campagnesPlanifieesVM) {
    if (!sched.actif) continue;

    console.log(`\n---> Exécution de la tâche planifiée : ${sched.nom}`);
    sched.statut = 'en_cours';

    const versionsCibles =
      sched.versionsCibles && sched.versionsCibles.length > 0
        ? sched.versionsCibles
        : ['0.1', '0.2', '0.3'];

    // 1. Générer de nouvelles variantes exploratoires si configuré
    const nbGen = sched.nbVariantesAGenerer ?? 4;
    if (nbGen > 0) {
      const verGen = versionsCibles.includes('0.3')
        ? '0.3'
        : versionsCibles[0] || '0.3';
      const nouvelles = genererVariantesExploratoiresV01(
        nbGen,
        state.variantes.length + 1,
        verGen
      );
      let viablesCount = 0;
      for (const v of nouvelles) {
        const rapV = evaluerViabiliteVariante31(v, sched.nbPartiesViabilite);
        state.rapportsViabilite = [
          rapV,
          ...state.rapportsViabilite.filter((r) => r.varianteId !== v.id),
        ];
        if (rapV.viable) {
          v.statutViabilite = 'viable';
          v.bandeSante = 'vert';
          viablesCount++;
        } else {
          v.statutViabilite = 'eliminee';
          v.motifElimination = rapV.motifElimination;
          v.bandeSante = 'rouge';
        }
      }
      state.variantes = [...nouvelles, ...state.variantes];
      console.log(
        `   [Filtre 3.1] ${nouvelles.length} variantes V${verGen} générées -> ${viablesCount} viables, ${
          nouvelles.length - viablesCount
        } éliminées.`
      );
    }

    // 2. Purger automatiquement les variantes non viables si demandé
    if (sched.eliminerNonViablesAuto) {
      const avant = state.variantes.length;
      state.variantes = state.variantes.filter(
        (v) => v.statutViabilite !== 'eliminee'
      );
      const purgees = avant - state.variantes.length;
      if (purgees > 0) {
        console.log(
          `   [Purge 3.1] ${purgees} variantes non viables supprimées du registre.`
        );
      }
    }

    // 3. Lancer la campagne 3.3 sur les variantes viables des versions cibles
    const cibles = state.variantes.filter(
      (v) => v.statutViabilite !== 'eliminee'
    );

    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      `[VM Auto] ${sched.nom}`,
      sched.nbPartiesViabilite,
      sched.nbPartiesInteret,
      versionsCibles
    );

    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    state.variantes = state.variantes.map((v) => mapMaj.get(v.id) || v);
    state.campagnesSelection.unshift(campagne);

    for (const rv of campagne.rapportsViabilite) {
      state.rapportsViabilite = [
        rv,
        ...state.rapportsViabilite.filter((r) => r.varianteId !== rv.varianteId),
      ];
    }
    for (const ri of campagne.rapportsInteret) {
      state.rapportsInteret = [
        ri,
        ...state.rapportsInteret.filter((r) => r.varianteId !== ri.varianteId),
      ];
    }

    // 4. Générer la synthèse analytique Gemini et sauvegarder le rapport Markdown
    const analyse = await genererAnalyseGeminiOuFallback(campagne);
    state.analysesGemini = [
      analyse,
      ...(state.analysesGemini || []).filter(
        (a) => a.campagneId !== campagne.id
      ),
    ];

    sched.statut = 'terminee';
    sched.derniereExecution = new Date().toISOString();
    sched.dernierResultatId = campagne.id;
    const meilleure = campagne.rapportsInteret[0];
    const logLine = `[${new Date().toLocaleTimeString('fr-FR')}] Cycle VM terminé (${versionsCibles
      .map((v) => `V${v}`)
      .join('+')}) : ${campagne.nbVariantesViables} viables classées. N°1 : ${
      meilleure ? `${meilleure.varianteNom} (${meilleure.scoreInteretGlobal}/100)` : 'N/A'
    }. Rapport Gemini mis à jour.`;
    sched.journalVM.unshift(logLine);
    console.log(`   ${logLine}`);
  }

  sauvegarderEtatAtelier(state);
  console.log(
    `[VM Oracle Cloud] État et rapport Gemini sauvegardés dans resultats/atelier-v1-state.json et resultats/derniere-analyse-gemini.md.`
  );
}

const args = process.argv.slice(2);
if (args.includes('--daemon')) {
  console.log(
    'Démon VM Oracle Cloud actif (exécution toutes les 6 heures)...'
  );
  executerCycleVM();
  setInterval(() => {
    executerCycleVM();
  }, 6 * 3600 * 1000);
} else {
  executerCycleVM();
}
