/**
 * Exécuteur CLI à la Demande de Campagnes Combinatoires Exhaustives — VM Oracle Cloud
 *
 * Zéro cron / zéro démon périodique : ce script se lance uniquement à la demande
 * pour mettre à profit la puissance de calcul et la stabilité de la VM Oracle sur
 * des campagnes longues (500 à 2 500+ parties par variante).
 *
 * Il partage exactement le même pipeline que l'interface Web :
 * 1. Génération du produit cartésien complet de la version cible (ex. 120 variantes pour V0.4),
 * 2. Criblage éliminatoire de viabilité (5 invariants coupe-circuit),
 * 3. Évaluation approfondie sur l'échelle des 9 bots (jusqu'à IS-MCTS, Expectimax Bayésien 2D6, Beam Rollout)
 *    et le banc multi-joueurs (tables de 3, 4, 5 et 6 joueurs),
 * 4. Journalisation intégrale de chaque partie dans resultats/logs/campagne-<id>.jsonl,
 * 5. Mise à jour en temps réel de resultats/campaign-job-status.json (suivi en direct dans l'UI Web),
 * 6. Extraction du Front de Pareto sur les 5 critères pondérés et synthèse analytique Gemini.
 *
 * Exemples d'utilisation en SSH sur la VM Oracle (dans tmux / screen / nohup) :
 *   npx tsx scripts/vm-worker.ts --version 0.4 --calibre 500
 *   npx tsx scripts/vm-worker.ts --version 0.4 --calibre 1000
 *   npx tsx scripts/vm-worker.ts --version 0.4 --calibre 2500
 */

import { executerJobCampagneExhaustiveAsync } from '../server';
import { POIDS_CRITERES_DEFAUT } from '../src/shared/tests-engine';
import { GameVersionId } from '../src/shared/types';

function parseArgValue(args: string[], flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultVal;
}

async function main() {
  const args = process.argv.slice(2);
  const versionCible = parseArgValue(args, '--version', '0.4') as GameVersionId;
  const calibreRaw = parseArgValue(
    args,
    '--calibre',
    args.includes('--exhaustive-v04') ? '500' : '500'
  );
  const calibrePartiesParVariante = Math.max(
    120,
    Math.min(5000, parseInt(calibreRaw, 10) || 500)
  );

  console.log(
    `\n================================================================================`
  );
  console.log(
    `  CAMPAGNE COMBINATOIRE EXHAUSTIVE À LA DEMANDE — VM ORACLE CLOUD`
  );
  console.log(`  Version cible              : V${versionCible}`);
  console.log(
    `  Calibre par variante       : ${calibrePartiesParVariante} parties / variante viable`
  );
  console.log(
    `  Critères pondérés          : Stratégie ${POIDS_CRITERES_DEFAUT.profondeurStrategique}% · Tension ${POIDS_CRITERES_DEFAUT.tensionChoix}% · Coopération ${POIDS_CRITERES_DEFAUT.dynamiqueCooperative}% · Équilibre 3–6J ${POIDS_CRITERES_DEFAUT.equilibreMultiJoueurs}% · Ergonomie ${POIDS_CRITERES_DEFAUT.ergonomieLisibilite}%`
  );
  console.log(
    `================================================================================\n`
  );

  const t0 = Date.now();
  const { campagne, analyseGemini } = await executerJobCampagneExhaustiveAsync({
    versionCible,
    calibrePartiesParVariante,
    poidsCriteres: POIDS_CRITERES_DEFAUT,
    sourceLancement: 'cli_vm_ssh',
    nomCampagne: `[CLI VM Oracle] Campagne Exhaustive V${versionCible} (${calibrePartiesParVariante} parties/variante)`,
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const top3 = campagne.rapportsInteret.slice(0, 3);

  console.log(
    `\n================================================================================`
  );
  console.log(`  BILAN DE LA CAMPAGNE EXHAUSTIVE V${versionCible} (${elapsed}s)`);
  console.log(
    `================================================================================`
  );
  console.log(
    `  Variantes évaluées         : ${campagne.nbVariantesEntree} (${campagne.nbVariantesViables} viables · ${campagne.nbVariantesEliminees} éliminées)`
  );
  console.log(
    `  Total parties simulées     : ${(campagne.totalPartiesSimulees || 0).toLocaleString('fr-FR')} parties`
  );
  console.log(
    `  Journal JSONL sur disque   : ${campagne.cheminFichierJSONL} (${Math.round((campagne.tailleFichierJSONLOctets || 0) / 1024)} Ko)`
  );
  console.log(`  Modèle synthèse IA         : ${analyseGemini.modeleUtilise}\n`);

  console.log(`  PODIUM MULTI-CRITÈRES & FRONT DE PARETO :`);
  top3.forEach((r, idx) => {
    const c = r.cinqCriteresPonderes;
    console.log(
      `   #${idx + 1} ${r.varianteNom} — Score Global : ${r.scoreInteretGlobal}/100 ${c?.estParetoOptimal ? '[PARETO OPTIMAL]' : ''}`
    );
    if (c) {
      console.log(
        `      Stratégie: ${c.profondeurStrategique}/100 | Tension: ${c.tensionChoix}/100 | Coop: ${c.dynamiqueCooperative}/100 | 3–6J: ${c.equilibreMultiJoueurs}/100 | Ergo: ${c.ergonomieLisibilite}/100`
      );
    }
  });
  console.log(
    `\n  Fichiers mis à jour : resultats/atelier-v1-state.json & resultats/derniere-analyse-gemini.md`
  );
  console.log(
    `================================================================================\n`
  );
}

main().catch((err) => {
  console.error('Erreur lors de la campagne CLI VM :', err);
  process.exit(1);
});
