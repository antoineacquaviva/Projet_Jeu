/* Tests du moteur du kit : node maquettes-numeriques/kit/test_moteur.js
   1. Il rejoue les parties de référence du moteur Python (reference.json) et doit retrouver, tour après tour,
      les mêmes parades, arbres, Machines et individus.
   2. Il vérifie la géométrie de la couronne, les bornes du tour (P5.1, P5.2) et que les bots ne donnent que
      des ordres permis, sur des parties complètes. */
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./moteur.js');
const B = require('./bots.js');

let echecs = 0, controles = 0;
function ok(cond, msg) { controles++; if (!cond) { echecs++; console.error('ÉCHEC :', msg); } }
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. rejouer le moteur Python
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference.json'), 'utf8'));
for (const [n, r] of ref.entries()) {
  const p = K.params(r.reglages); const pl = K.plateau(p);
  ok(p.erreurs.length === 0, `réglages valides (${n})`);
  const e = { arbres: r.depart.arbres.slice(), machines: r.depart.machines.slice(), individus: r.depart.individus.slice(), tour: 0 };
  ok(K.foret(e) === p.c0, `forêt initiale (${n})`);
  if (r.bot !== 'aleatoire') ok(egal(K.placementHeuristique(p, pl, e), r.depart.individus), `placement de départ identique au Python (${n})`);
  r.tours.forEach((t, k) => {
    const prog = t.programme.map((o) => [o[0], o[1]]);
    const ann = t.executees.map((x) => [x[0], x[1]]);
    const evts = K.jouerTour(p, pl, e, ann, prog, ann.map((_, i) => i));
    ok(K.parades(evts) === t.parades, `parades partie ${n} (${r.bot}) tour ${k + 1} : ${K.parades(evts)} contre ${t.parades}`);
    ok(egal(e.arbres, t.arbres) && egal(e.machines, t.machines) && egal(e.individus, t.individus), `état partie ${n} (${r.bot}) tour ${k + 1}`);
  });
}

// 2. géométrie, bornes, bots
{
  const p = K.params({ joueurs: 3, tuileL: 3, tuileP: 4 }); const pl = K.plateau(p);
  ok(pl.N === 37, 'couronne de 3 tuiles 3 × 4 : 37 cases');
  ok(egal(pl.voisins[0], [1, 2, 3, 13, 14, 15, 25, 26, 27]), 'le Cœur touche les rangées intérieures');
  ok(pl.voisins[3].includes(13) && pl.voisins[27].includes(1), 'les tuiles voisines se touchent, la couronne se referme');
  ok(egal(pl.lisieres[1], [22, 23, 24]), 'lisière de la tuile 2');
}
for (const J of [2, 3, 4, 5, 6]) for (const bot of Object.keys(B.BOTS)) for (const reg of [{}, { machinesEnPlus: 1, tuileP: 4, individusParJoueur: 2 }]) {
  const p = K.params(Object.assign({ joueurs: J, graine: 7 + J }, reg)); const pl = K.plateau(p);
  ok(p.erreurs.length === 0, `réglages valides J=${J}`);
  const rng = K.generateur(p.graine); const rb = K.generateur(p.graine + 1);
  const e = K.miseEnPlace(p, pl, rng);
  e.machines.forEach((m, j) => ok(j >= p.J || pl.lisieres[j].includes(m), 'Machine sur la lisière de sa tuile'));
  e.individus = K.placementHeuristique(p, pl, e);
  e.individus.forEach((c, i) => ok(pl.tuile[c] === K.proprietaire(p, i), 'individu sur sa tuile'));
  let S = 0;
  for (let t = 0; t < p.tours; t++) {
    const ann = K.tirerAnnonces(p, rng); const ex = K.tirerExecution(p, rng);
    const prog = Array.from({ length: p.I }, () => [K.RIEN, null]);
    const raisons = B.BOTS[bot].jouer(p, pl, e, ann, prog, Array.from({ length: J }, (_, j) => j), rb);
    ok(K.permis(p, prog), `${bot} J=${J} : programme permis`);
    ok(Object.keys(raisons).length === J, `${bot} J=${J} : une raison par joueur`);
    const avant = K.foret(e);
    const par = K.parades(K.jouerTour(p, pl, e, ann, prog, ex));
    const perte = avant - K.foret(e);
    ok(perte === p.n - par && perte >= p.n - p.k && perte <= p.n, `P5.1 ${bot} J=${J}`);
    S += par;
  }
  ok(K.foret(e) === p.c0 - p.n * p.tours + S && K.foret(e) > 0, `P5.2 ${bot} J=${J}`);
}
console.log(`${controles - echecs} / ${controles} contrôles réussis (${ref.length} parties Python rejouées)`);
process.exit(echecs ? 1 : 0);
