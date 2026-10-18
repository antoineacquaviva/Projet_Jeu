/* Tests de « Couronne aux deux pistes » : node maquettes-numeriques/pistes/test_moteur.js
   1. Les pistes : probabilités de la somme et de l'écart, pyramide des plans, disposition de départ.
   2. L'apprentissage : sens des échanges sur les deux pistes, bords, rythme « vague ».
   3. Les bornes : à chaque vague, la perte vaut lancers − parades, au moins lancers − ordres ; la forêt finale vaut
      c0 − lancers + parades et reste positive ; les pistes restent des permutations.
   4. Les bots : cartes permises, une raison par joueur, reproductibilité ; temps de décision. */
'use strict';
const K = require('./moteur.js');
const B = require('./bots.js');

let echecs = 0, controles = 0;
function ok(cond, msg) { controles++; if (!cond) { echecs++; console.error('ÉCHEC :', msg); } }
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. pistes
{
  const ec = {}, so = {};
  for (const [a, b] of K.ISSUES) { const d = Math.abs(a - b); ec[d] = (ec[d] || 0) + 1; so[a + b] = (so[a + b] || 0) + 1; }
  ok(egal(ec, { 0: 6, 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 }), 'chances de l\'écart : 6, 10, 8, 6, 4, 2');
  for (let s = 2; s <= 12; s++) ok(so[s] === K.CHANCES_SOMME(s), 'chances de la somme ' + s);
  ok(egal(K.ECARTS.map((d) => K.CHANCES_ECART[d]), [10, 8, 6, 6, 4, 2]), 'piste des Machines imprimée dans l\'ordre des probabilités');
  const p = K.params({ joueurs: 2 }); const pl = K.plateau(p); const e = K.miseEnPlace(p, pl, K.generateur(3));
  ok(egal(e.pisteM, [0, 1, 5, 2, 3, 4]), 'départ : Grosse Gueule 1, Rapiat 2, Zizanie 0, Mâchoire 3, Tonton Débard 4, Ripaille 5');
  ok(e.machines.filter((m) => m >= 0).length === 3 && e.machines[3] < 0 && e.machines[5] < 0, '2 joueurs : 3 Machines sur le plateau (1, 2, 3), les autres au chantier');
  const prof = K.profils(e);
  ok(prof[3].tactiques.opportunisme === 4 && prof[3].chances === 4, 'la Machine de la case 4 est toujours opportuniste');
  ok(prof[4].tactiques.cupidite === 2 && prof[4].chances === 2, 'la Machine de la case 5 joue toujours la case 7 (Cupidité)');
  ok(prof[0].tactiques.represailles === 6 && prof[0].tactiques.cupidite === 4, 'la case 1 : Représailles 6, Cupidité 4');
  ok(prof[5].chances === 6 && prof[5].tactiques.percee === 3, 'Zizanie (case 0) : 6 chances, dont 3 en Percée');
  const p6 = K.params({ joueurs: 6 }); const pl6 = K.plateau(p6); const e6 = K.miseEnPlace(p6, pl6, K.generateur(3));
  ok(e6.machines.every((m) => m >= 0), '6 joueurs : les six Machines sur le plateau');
  const pr = K.menaceParCase(p, pl, Object.assign(K.copie(e), { individus: K.placementHeuristique(p, pl, e) }));
  ok(Math.abs(pr.reduce((s, x) => s + x, 0) - 1) < 1e-9, 'la menace d\'un lancer se répartit sur les cases (somme 1)');
}

// 2. apprentissage
{
  const p = K.params({ joueurs: 2 }); const pl = K.plateau(p); const e = K.miseEnPlace(p, pl, K.generateur(3));
  const t6 = e.pensees[6], t5 = e.pensees[5];
  let r = K.apprendre(e, t6, 1, false);
  ok(e.pensees[5] === t6 && e.pensees[6] === t5, 'échec côté éveil : la tactique va vers le 2');
  ok(egal(e.pisteM, [0, 5, 1, 2, 3, 4]) && egal(r.machines, [1, 2]), 'échec : Rapiat descend vers le côté rare (case 0)');
  r = K.apprendre(e, e.pensees[7], 1, false);
  ok(egal(r.pensees, [7, 8]), 'échec au 7 : vers le 8');
  r = K.apprendre(e, e.pensees[12], 4, false);
  ok(r.pensees[1] === null && r.machines[1] === null, 'échec au bord : rien ne bouge');
  const t9 = e.pensees[9]; K.apprendre(e, t9, 0, true);
  ok(e.pensees[8] === t9, 'réussite côté rêve : vers le 7');
  ok(egal(e.pisteM.slice(0, 1), [0]), 'réussite en tête : la Machine reste');
}

// 3. bornes et rythme, sur des parties complètes, avec tous les bots
const temps = {};
for (const J of [2, 3, 4, 5, 6]) for (const bot of Object.keys(B.BOTS)) for (const reg of [{}, { rythme: 'vague', presage: true }, { etapes: 1, tours: 8, lancersEnPlus: 2 }]) {
  const { p, pl, e, tirages } = K.nouvellePartie(Object.assign({ joueurs: J, graine: 11 + J }, reg));
  ok(p.erreurs.length === 0, `réglages valides J=${J} ${JSON.stringify(reg)}`);
  ok(K.foret(e) === p.c0, 'forêt initiale');
  e.individus.forEach((c, i) => ok(pl.tuile[c] === K.proprietaire(p, i), 'individu sur sa tuile'));
  const rb = K.generateur(5 + J);
  let S = 0, n = 0;
  for (let t = 0; t < p.tours; t++) {
    const cartes = K.cartesVides(p);
    const ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice()) } : null;
    const t0 = Date.now();
    const raisons = B.BOTS[bot].jouer(p, pl, e, cartes, Array.from({ length: J }, (_, j) => j), rb, ctx);
    temps[bot + J] = (temps[bot + J] || 0) + Date.now() - t0;
    ok(Object.keys(raisons).length === J, `${bot} J=${J} : une raison par joueur`);
    cartes.forEach((cs, j) => cs.forEach((c) => ok(!c || K.proprietaire(p, c.i) === j, `${bot} : chacun ne commande que les siens`)));
    const avant = K.foret(e);
    const etapes = K.jouerTour(p, pl, e, cartes, tirages[t]);
    for (const et of etapes) {
      const par = et.evts.filter((v) => v.issue !== 'abattu').length;
      ok(et.evts.length === p.L && par <= p.k, `au plus un ordre par joueur et par étape pare (${bot} J=${J})`);
      if (p.rythme === 'vague') ok(et.appris.length === p.L && et.evts.every((v) => !v.appris), 'rythme « vague » : les échanges à la fin de la vague');
      else ok(et.evts.every((v) => v.appris), 'rythme « lancer » : un échange après chaque lancer');
      S += par; n += et.evts.length;
      if (bot !== 'hasard') ok(et.perdus.every((x) => x.o[0] === K.SABOTER), `${bot} : seul un sabotage peut être perdu`);
    }
    const perte = avant - K.foret(e);
    ok(perte === p.lancersParTour - K.paradesEtapes(etapes) && perte >= p.lancersParTour - p.ordresParTour, `perte du tour (${bot} J=${J})`);
    ok(egal(e.pensees.slice(2).slice().sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) && egal(e.pisteM.slice().sort(), [0, 1, 2, 3, 4, 5]), 'les pistes restent des permutations');
  }
  ok(K.foret(e) === p.c0 - n + S && K.foret(e) > 0, `forêt finale (${bot} J=${J})`);
}

// 4. reproductibilité des séries
{
  const a = B.partieAuto({ joueurs: 3, graine: 42 }, 'prevoyant'), b = B.partieAuto({ joueurs: 3, graine: 42 }, 'prevoyant');
  ok(egal(a, b), 'même graine, même partie (prévoyant)');
}

// 5. mécanique 1B (Pistes publiques & Attaques croisées) et détail didactique
{
  const { p, pl, e, tirages } = K.nouvellePartie({ joueurs: 3, graine: 77 });
  const vague0 = tirages[0][0];
  const indices = K.indicesTour1B(p, e, vague0);
  ok(indices.mains.length === 3 && indices.attaques.length === p.L, '1B : 3 joueurs => 3 paires d\'indices croisés');
  for (let j = 0; j < 3; j++) {
    ok(indices.mains[j][0].attIdx === j && indices.mains[j][0].type === 'machine', `1B J${j} indice 0 = Machine de l'attaque ${j}`);
    ok(indices.mains[j][1].attIdx === (j + 1) % 3 && indices.mains[j][1].type === 'tactique', `1B J${j} indice 1 = Tactique de l'attaque ${(j + 1) % 3}`);
  }
  const reveles = [null, null, null];
  for (let j = 0; j < 3; j++) {
    const ch = B.choisirRevelation1B(p, pl, e, vague0, j, 'prevoyant', K.generateur(10 + j));
    ok(ch.choix === 0 || ch.choix === 1, `1B choix valide pour J${j}`);
    ok(typeof ch.raison === 'string' && ch.raison.length > 10, `1B explication fournie pour J${j}`);
    reveles[j] = ch.choix;
  }
  const attJ0 = K.etatAttaques1B(p, pl, e, vague0, reveles, 0);
  ok(attJ0.length === p.L, '1B : etatAttaques1B couvre les L attaques');
  ok(attJ0[3].embuscade === true && !attJ0[3].connaisM && !attJ0[3].connaisT, '1B : la (J+1)-ième attaque est une embuscade cachée');
  const men = K.menaceVague1B(p, pl, e, vague0, reveles, 0);
  ok(Math.abs(men.espMachine.reduce((a, b) => a + b, 0) - p.L) < 1e-6, '1B : somme des espérances de machines = L');
  const det = K.detailDestination(p, pl, e, 0, 'cupidite');
  ok(det.candidats.length > 0 && det.cible === K.destination(p, pl, e, 0, 'cupidite')[0], 'detailDestination cohérent avec destination()');
  const cartes = K.cartesVides(p);
  const raisons1B = B.BOTS.prevoyant.jouer(p, pl, e, cartes, [0, 1, 2], K.generateur(99), {
    indices1B: { vague0, reveles }
  });
  ok(Object.keys(raisons1B).length === 3, 'Bot prévoyant joue avec contexte 1B');
}
console.log(`${controles - echecs} / ${controles} contrôles réussis`);
console.log('Temps de décision par partie (ms) :', Object.entries(temps).map(([k, v]) => `${k} ${v}`).join(' · '));
process.exit(echecs ? 1 : 0);


