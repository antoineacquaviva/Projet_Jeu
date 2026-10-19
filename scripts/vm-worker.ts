/**
 * Worker CLI & Ordonnanceur autonome pour la VM Oracle Cloud
 * Usage sur la VM Oracle Cloud :
 *   npm run vm:worker
 *   npm run vm:worker -- --generate=8 --viabilite=24 --interet=50 --push
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VARIANTES_INITIALES_V01 } from '../src/shared/moteur';
import {
  executerCampagneSelection33,
  genererVariantesExploratoiresV01,
} from '../src/shared/tests-engine';
import { VariantV01 } from '../src/shared/types';

const STATE_FILE = path.resolve(
  process.cwd(),
  'resultats',
  'atelier-v1-state.json'
);

function parseArg(prefix: string, defaultVal: number): number {
  const found = process.argv.find((a) => a.startsWith(`--${prefix}=`));
  if (!found) return defaultVal;
  const n = Number(found.split('=')[1]);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

function main() {
  const nbGen = parseArg('generate', 4);
  const nbViab = parseArg('viabilite', 20);
  const nbInteret = parseArg('interet', 40);
  const autoPush =
    process.argv.includes('--push') || process.env.AUTO_GIT_PUSH === '1';

  console.log('==============================================================');
  console.log(' ATELIER DE CONCEPTION V1 — WORKER VM ORACLE CLOUD');
  console.log(' Jeu : Défenseurs de la forêt (V0.1)');
  console.log('==============================================================');

  let variantes: VariantV01[] = [...VARIANTES_INITIALES_V01];
  let existingState: Record<string, unknown> = {};

  if (fs.existsSync(STATE_FILE)) {
    try {
      existingState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (Array.isArray(existingState.variantes)) {
        variantes = existingState.variantes as VariantV01[];
      }
    } catch (e) {
      console.warn('État existant non lisible, utilisation du socle V0.1.');
    }
  }

  if (nbGen > 0) {
    const nouvelles = genererVariantesExploratoiresV01(
      nbGen,
      variantes.length + 1
    );
    console.log(
      `[+] ${nouvelles.length} nouvelles variantes exploratoires générées (séquencement & actions).`
    );
    variantes = [...nouvelles, ...variantes];
  }

  console.log(
    `[*] Lancement du Filtre de Viabilité (3.1 : ${nbViab} parties/bot) puis Intérêt (3.2 : ${nbInteret} parties/bot)...`
  );

  const { campagne, variantesMisesAJour } = executerCampagneSelection33(
    variantes,
    `Campagne VM Oracle Cloud (${new Date().toISOString().slice(0, 16)})`,
    nbViab,
    nbInteret
  );

  console.log('--------------------------------------------------------------');
  console.log(`Variantes inspectées : ${campagne.nbVariantesEntree}`);
  console.log(`Variantes VIABLES    : ${campagne.nbVariantesViables}`);
  console.log(
    `Variantes ÉLIMINÉES  : ${campagne.nbVariantesEliminees} (écartées directement par le filtre 3.1)`
  );
  console.log('--------------------------------------------------------------');

  for (const r of campagne.rapportsInteret.slice(0, 5)) {
    console.log(
      `  [VIABLE - ${r.bandeSante.toUpperCase()}] ${r.varianteNom} -> Score d'intérêt : ${r.scoreInteretGlobal}/100 (Marge anti-boucle: +${r.indicateurs.margeGardeFouBoucle} pts)`
    );
  }

  const outDir = path.dirname(STATE_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const updatedState = {
    ...existingState,
    derniereSauvegarde: new Date().toISOString(),
    variantes: variantesMisesAJour,
    rapportsViabilite: campagne.rapportsViabilite,
    rapportsInteret: campagne.rapportsInteret,
    campagnesSelection: [
      campagne,
      ...(Array.isArray(existingState.campagnesSelection)
        ? existingState.campagnesSelection.slice(0, 9)
        : []),
    ],
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(updatedState, null, 2), 'utf-8');
  console.log(`[OK] État sauvegardé dans ${STATE_FILE}`);

  if (autoPush) {
    try {
      execSync(
        'git add resultats/atelier-v1-state.json && git commit -m "chore(vm): mise à jour automatique des tests V0.1 depuis la VM Oracle Cloud" && git push',
        { stdio: 'inherit' }
      );
      console.log('[OK] Résultats committés et poussés sur GitHub.');
    } catch (gitErr) {
      console.warn('[Info] Git push ignoré ou aucun changement à committer.');
    }
  }
}

main();
