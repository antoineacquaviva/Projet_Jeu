/* Tests du moteur du noyau N1 : node maquettes-numeriques/noyau/test_moteur.js
   Vérifie les règles citées (N…), la reproductibilité par graine, et joue des séries de parties. */
'use strict';
const assert = require('assert');
const N = require('./moteur.js');
const B = require('./bots.js');
const { Partie } = N;

const table = (peuples, profil) => peuples.map((p) => ({ peuple: p, type: 'bot', profil }));
async function jouer(peuples, profil, graine, params) {
  const pa = new Partie({ sieges: table(peuples, profil), graine, params }, {});
  return { r: await pa.jouer(), pa };
}

(async () => {
  // N1.1 à N1.4 : mise en place
  const p0 = new Partie({ sieges: table(['oiseaux', 'insectes'], 'lecteur'), graine: 1 }, {});
  assert.strictEqual(p0.foret(), 21, 'N1.1 : 21 forêts');
  assert.deepStrictEqual(p0.etat.mach.map((m) => m.etat), ['marche', 'marche', 'marche', 'chantier', 'chantier'], 'N1.2');
  assert.strictEqual(p0.etat.piste[7].nom, 'Cupidité', 'N1.3');

  // N6.1 : un double désigne le favori (case 1)
  let pl = p0.plan([3, 3]);
  assert.strictEqual(pl.caseM, 1); assert.strictEqual(pl.machine, 1);
  // N6.3 Cupidité dans le rayon de Grosse Gueule (zone 1 : 1, 2, 4) -> Igapó (3 forêts)
  pl = p0.plan([4, 3]);                          // somme 7 Cupidité, écart 1 -> Grosse Gueule
  assert.strictEqual(pl.type, 'abattre'); assert.strictEqual(pl.cible, 4);
  // N6.2 Machine au chantier : elle entre
  pl = p0.plan([5, 1]);                          // écart 4 -> Tonton Débard au chantier
  assert.strictEqual(pl.type, 'entree'); assert.strictEqual(pl.cible, 1);
  // N6.4 barrage
  p0.etat.barres = [4];
  let res = p0.executer(p0.plan([4, 3]));
  assert.strictEqual(res.ok, false, 'N6.4 : zone visée barrée');
  p0.etat.barres = [];
  res = p0.executer(p0.plan([4, 3]));
  assert.strictEqual(res.ok, true); assert.strictEqual(p0.etat.f[4], 2);

  // N6.5 : un échec ne fait jamais avancer un esprit ; une réussite le repousse (tir à la corde)
  const p1 = new Partie({ sieges: table(['oiseaux', 'insectes'], 'lecteur'), graine: 2 }, {});
  p1.etat.piste[10] = { k: 'esprit', n: 1 };
  await p1.apprendre({ somme: 9, caseM: 2 }, false);       // échec en 9 : voisine côté bord = esprit
  assert.strictEqual(p1.etat.piste[10].k, 'esprit', 'échec : l\'esprit reste');
  await p1.apprendre({ somme: 11, caseM: 2 }, true);       // réussite en 11 : échange avec l'esprit en 10
  assert.strictEqual(p1.etat.piste[11].k, 'esprit'); assert.strictEqual(p1.stats.tir_a_la_corde, 1);

  // N3.4 : six rêves mènent au long sommeil
  const p2 = new Partie({ sieges: table(['oiseaux', 'insectes'], 'lecteur'), graine: 3, params: { avances_par_tour: 9 } }, {});
  for (let i = 0; i < 6; i++) await p2.rever('oiseaux', 'carte');
  assert.strictEqual(p2.etat.fin.type, 'sommeil');
  // N3.1 bis : un esprit bouge une fois par tour ; le deuxième rêve fait entrer un autre esprit... seulement si le 12 est libre
  const p3 = new Partie({ sieges: table(['oiseaux', 'insectes'], 'lecteur'), graine: 3 }, {});
  await p3.rever('oiseaux', 'carte'); await p3.rever('oiseaux', 'carte');
  assert.strictEqual(p3.esprits().length, 1, 'le 12 est occupé et l\'esprit a déjà bougé');
  p3.etat.avances = {};
  await p3.rever('oiseaux', 'carte');
  assert.deepStrictEqual(p3.esprits(), [11]);
  // N4.2 : barrage « entrer et abattre » (défaut) : une Machine quitte une zone barrée ; « complet » l'en empêche
  for (const [forme, attendu] of [['entrer_abattre', true], ['complet', false]]) {
    const q = new Partie({ sieges: table(['oiseaux', 'insectes'], 'lecteur'), graine: 4, params: { barrage: forme } }, {});
    q.etat.barres = [1];
    assert.strictEqual(q.executer(q.plan([4, 3])).ok, attendu, 'barrage ' + forme);
  }
  // N2.4 : ordres par étape selon la table
  assert.strictEqual(N.valeurTable('n/2', 2), 1); assert.strictEqual(N.valeurTable('n/2', 5), 3);

  // reproductibilité
  const a = await jouer(['oiseaux', 'reptiles', 'humains'], 'lecteur', 42);
  const b = await jouer(['oiseaux', 'reptiles', 'humains'], 'lecteur', 42);
  assert.deepStrictEqual(a.r, b.r, 'même graine, même partie');
  assert.strictEqual(a.pa.ev.length, b.pa.ev.length);

  // séries : aucune erreur, résultats par profil et par taille de table
  const PEU = N.ORDRE_PEUPLES;
  const combos = [];
  for (let n = 2; n <= 6; n++) for (let k = 0; k < 6; k++) {
    const t = PEU.slice(k).concat(PEU.slice(0, k)).slice(0, n);
    combos.push(t);
  }
  const res2 = {};
  const t0 = Date.now();
  for (const profil of ['lecteur', 'defenseur', 'reveur', 'hasard']) {
    let s = 0, n = 0, som = 0, rv = 0, ann = 0, ev = 0;
    for (const c of combos) for (let g = 0; g < 20; g++) {
      const { r, pa } = await jouer(c, profil, 1000 + g);
      s += r.pct; n++; if (r.fin.type === 'sommeil') som++; rv += r.stats.reves_cartes; ann += r.stats.annules_par_reve; ev += pa.ev.length;
    }
    res2[profil] = { foret: (s / n).toFixed(1), sommeil: ((som / n) * 100).toFixed(0) + ' %', reves: (rv / n).toFixed(2), annules: (ann / n).toFixed(2), evts: Math.round(ev / n) };
  }
  console.table(res2);
  console.log(`${4 * combos.length * 20} parties en ${Date.now() - t0} ms`);
  // un exemple d'explications
  const ex = await jouer(['oiseaux', 'mammiferes', 'reptiles'], 'lecteur', 7);
  ex.pa.ev.filter((x) => x.k === 'decision' && x.pourquoi).slice(0, 14).forEach((x) => console.log(`T${x.t}E${x.e} ${x.txt} -> ${x.pourquoi}`));
  console.log('Tests OK');
})().catch((e) => { console.error(e); process.exit(1); });
