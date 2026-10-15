/* Moteur du « kit par joueur » : les règles du modèle placement sur la couronne (docs/regles_placement.md,
   P1 à P5 avec P1.1 bis, P1.3 bis, P1.4 bis, P2.1 bis, P3.4 bis). Sans interface. Même résolution que le
   moteur Python (placement/regles.py) : vérifié en rejouant des parties Python (test_moteur.js). */
(function (G) {
  'use strict';
  const TACTIQUES = ['cupidite', 'percee', 'opportunisme', 'represailles'];
  const NOMS_TACTIQUES = { cupidite: 'Cupidité', percee: 'Percée', opportunisme: 'Opportunisme', represailles: 'Représailles' };
  const RIEN = 'rien', GARDER = 'garder', ALLER = 'aller', SABOTER = 'saboter';

  const DEFAUTS = { joueurs: 3, machinesEnPlus: 2, menacesParMachine: 1, tuileL: 3, tuileP: 3, individusParJoueur: 3,
    arbres: 3, coeurArbres: 0, tours: 8, graine: 1 };

  function generateur(graine) {                       // mulberry32 : parties reproductibles
    let a = (graine >>> 0) || 1;
    const r = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.entier = (n) => Math.floor(r() * n);
    r.choix = (xs) => xs[r.entier(xs.length)];
    r.melange = (xs) => { const ys = xs.slice(); for (let i = ys.length - 1; i > 0; i--) { const j = r.entier(i + 1); [ys[i], ys[j]] = [ys[j], ys[i]]; } return ys; };
    return r;
  }

  function params(reglages) {
    const r = Object.assign({}, DEFAUTS, reglages || {});
    const p = {
      J: r.joueurs, l: r.tuileL, q: r.tuileP, a: r.arbres, coeurArbres: r.coeurArbres || r.arbres,
      M: r.joueurs + r.machinesEnPlus, mpm: r.menacesParMachine, I: r.individusParJoueur * r.joueurs,
      ipj: r.individusParJoueur, k: r.joueurs, tours: r.tours, graine: r.graine, reglages: r,
    };
    p.n = p.M * p.mpm;
    p.c0 = p.J * p.l * p.q * p.a + p.coeurArbres;
    const err = [];
    if (p.J < 1 || p.J > 6) err.push('de 1 à 6 joueurs');
    if (p.k >= p.n) err.push('il faut plus de menaces que d\'ordres (P5.1)');
    if (p.c0 <= p.n * p.tours) err.push('la forêt de départ doit dépasser n × t (P5.2)');
    p.erreurs = err;
    return p;
  }

  // P1.1 bis : J tuiles l × q autour du Cœur (case 0). Rangée 0 contre le Cœur, rangée q − 1 en lisière ;
  // la dernière colonne d'une tuile touche la première de la suivante, rangée par rangée.
  function plateau(p) {
    const { J, l, q } = p;
    const N = 1 + J * l * q;
    const idx = (t, r, c) => 1 + t * l * q + r * l + c;
    const adj = Array.from({ length: N }, () => new Set());
    const lier = (a, b) => { if (a !== b) { adj[a].add(b); adj[b].add(a); } };
    for (let t = 0; t < J; t++) {
      for (let r = 0; r < q; r++) {
        for (let c = 0; c < l; c++) {
          if (r + 1 < q) lier(idx(t, r, c), idx(t, r + 1, c));
          if (c + 1 < l) lier(idx(t, r, c), idx(t, r, c + 1));
        }
        if (J >= 2) lier(idx(t, r, l - 1), idx((t + 1) % J, r, 0));
      }
      for (let c = 0; c < l; c++) lier(0, idx(t, 0, c));
    }
    const voisins = adj.map((s) => Array.from(s).sort((x, y) => x - y));
    const dist = [];
    for (let c = 0; c < N; c++) {
      const d = new Array(N).fill(-1); d[c] = 0; const file = [c];
      for (let i = 0; i < file.length; i++) { const u = file[i]; for (const w of voisins[u]) if (d[w] < 0) { d[w] = d[u] + 1; file.push(w); } }
      dist.push(d);
    }
    const coeur = dist[0].map((x) => 2 * x);
    const tuile = [-1]; const rang = [-1]; const col = [-1];
    for (let t = 0; t < J; t++) for (let r = 0; r < q; r++) for (let c = 0; c < l; c++) { tuile.push(t); rang.push(r); col.push(c); }
    const lisieres = [];
    for (let t = 0; t < J; t++) { const li = []; for (let c = 0; c < l; c++) li.push(idx(t, q - 1, c)); lisieres.push(li); }
    return { N, voisins, dist, coeur, tuile, rang, col, lisieres, idx };
  }

  const proprietaire = (p, i) => Math.floor(i * p.J / p.I);

  // P1.2, P1.3 bis
  function miseEnPlace(p, pl, rng) {
    const arbres = new Array(pl.N).fill(p.a); arbres[0] = p.coeurArbres;
    const machines = [];
    for (let j = 0; j < p.M; j++) {
      const li = j < p.J ? pl.lisieres[j] : pl.lisieres[rng.entier(p.J)];
      machines.push(rng.choix(li));
    }
    return { arbres, machines, individus: [], tour: 0 };
  }

  const copie = (e) => ({ arbres: e.arbres.slice(), machines: e.machines.slice(), individus: e.individus.slice(), tour: e.tour });
  const foret = (e) => e.arbres.reduce((s, x) => s + x, 0);

  // P2.1 bis : chaque Machine fait q menaces ; une tactique tirée pour chacune, toutes montrées
  function tirerAnnonces(p, rng) {
    const out = [];
    for (let j = 0; j < p.M; j++) for (let k = 0; k < p.mpm; k++) out.push([j, rng.choix(TACTIQUES)]);
    return out;
  }
  const tirerExecution = (p, rng) => rng.melange(Array.from({ length: p.n }, (_, i) => i));

  function presence(e) { const m = {}; for (const c of e.individus) m[c] = (m[c] || 0) + 1; return m; }

  function cmp(a, b) { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; }
  function minPar(xs, cle) { let best = xs[0], kb = cle(xs[0]); for (const x of xs.slice(1)) { const k = cle(x); if (cmp(k, kb) < 0) { best = x; kb = k; } } return best; }

  // P4.2 à P4.4 : la case visée, lue sur la configuration du moment ; renvoie [case, repli]
  function destination(p, pl, e, machine, tactique) {
    const pos = e.machines[machine]; const A = e.arbres;
    const rayon = [pos].concat(pl.voisins[pos]).filter((c) => A[c] > 0);
    if (!rayon.length) {
      const d = pl.dist[pos]; const boisees = [];
      for (let c = 0; c < pl.N; c++) if (A[c] > 0) boisees.push(c);
      return [minPar(boisees, (c) => [d[c], -A[c], pl.coeur[c], c]), true];
    }
    let cle;
    if (tactique === 'cupidite') cle = (c) => [-A[c], pl.coeur[c], c !== pos ? 1 : 0, c];
    else if (tactique === 'percee') cle = (c) => [pl.coeur[c], -A[c], c !== pos ? 1 : 0, c];
    else {
      const pres = presence(e);
      if (tactique === 'opportunisme') cle = (c) => [pres[c] || 0, -A[c], pl.coeur[c], c];
      else cle = (c) => [-(pres[c] || 0), -A[c], pl.coeur[c], c];
    }
    return [minPar(rayon, cle), false];
  }

  // P3.2 : les ordres possibles d'un individu
  function ordresPossibles(p, pl, e, i) {
    const pos = e.individus[i];
    const ops = [[RIEN, null], [GARDER, pos]];
    e.machines.forEach((m, j) => { if (m === pos) ops.push([SABOTER, j]); });
    for (const c of pl.voisins[pos]) ops.push([ALLER, c]);
    return ops;
  }

  // P3.1, P3.4 bis : au plus un ordre par joueur, à l'un de ses individus
  function permis(p, prog) {
    const vu = new Set(); let n = 0;
    for (let i = 0; i < prog.length; i++) {
      if (prog[i][0] === RIEN) continue;
      const j = proprietaire(p, i); if (vu.has(j)) return false; vu.add(j); n++;
    }
    return n <= p.k;
  }

  // P3.3 : déplacements, puis gardes et sabotages posés
  function appliquer(p, pl, e, prog) {
    if (!permis(p, prog)) throw new Error('un joueur donne plus d\'un ordre (P3.4 bis)');
    const gardes = {}, sab = {}, quiG = {}, quiS = {};
    prog.forEach(([typ, arg], i) => {
      if (typ === ALLER) { if (pl.dist[e.individus[i]][arg] !== 1) throw new Error('Aller hors de portée'); e.individus[i] = arg; }
    });
    prog.forEach(([typ, arg], i) => {
      if (typ === GARDER) {
        const c = e.individus[i]; if (arg !== c) throw new Error('Garder ailleurs que sa case');
        gardes[c] = (gardes[c] || 0) + 1; (quiG[c] = quiG[c] || []).push(i);
      } else if (typ === SABOTER) {
        if (e.machines[arg] !== e.individus[i]) throw new Error('Saboter une Machine absente');
        sab[arg] = (sab[arg] || 0) + 1; (quiS[arg] = quiS[arg] || []).push(i);
      }
    });
    return { gardes, sab, quiG, quiS };
  }

  // P4 : une menace ; renvoie l'événement (pour le pas à pas et le journal)
  function executerMenace(p, pl, e, pose, machine, tactique) {
    const [cible, repli] = destination(p, pl, e, machine, tactique);
    const de = e.machines[machine];
    if ((pose.sab[machine] || 0) > 0) {                  // P4.5 : sabotage d'abord, la Machine s'échappe
      pose.sab[machine]--; const qui = pose.quiS[machine].shift();
      e.machines[machine] = cible;
      return { machine, tactique, de, cible, repli, issue: 'sabotee', qui, lieu: de };
    }
    if ((pose.gardes[cible] || 0) > 0) {                 // P4.6 : la garde, la Machine reste
      pose.gardes[cible]--; const qui = pose.quiG[cible].shift();
      return { machine, tactique, de, cible, repli, issue: 'gardee', qui, lieu: cible };
    }
    e.machines[machine] = cible; e.arbres[cible]--;      // P4.7
    return { machine, tactique, de, cible, repli, issue: 'abattu' };
  }

  function jouerTour(p, pl, e, annonces, prog, execution) {
    const pose = appliquer(p, pl, e, prog);
    const evts = execution.map((j) => executerMenace(p, pl, e, pose, annonces[j][0], annonces[j][1]));
    e.tour++;
    return evts;
  }
  const parades = (evts) => evts.filter((x) => x.issue !== 'abattu').length;

  const CASES_DEPART = (p, pl, i) => { const j = proprietaire(p, i); const out = []; for (let c = 0; c < pl.N; c++) if (pl.tuile[c] === j) out.push(c); return out; };

  // Placement initial commun (P1.4 bis) : sur sa tuile, devant les Machines, sans s'empiler
  function placementHeuristique(p, pl, e) {
    const pris = [];
    for (let i = 0; i < p.I; i++) {
      const score = (c) => e.machines.reduce((s, m) => s + Math.max(0, 3 - pl.dist[m][c]), 0) + 0.05 * e.arbres[c]
        - 3 * pris.filter((x) => x === c).length - 0.01 * pl.coeur[c];
      let best = null, sb = -Infinity;
      for (const c of CASES_DEPART(p, pl, i)) { const s = score(c); if (s > sb || (s === sb && c < best)) { best = c; sb = s; } }
      pris.push(best);
    }
    return pris;
  }

  const API = { TACTIQUES, NOMS_TACTIQUES, RIEN, GARDER, ALLER, SABOTER, DEFAUTS, generateur, params, plateau, proprietaire,
    miseEnPlace, copie, foret, tirerAnnonces, tirerExecution, destination, ordresPossibles, permis, appliquer, executerMenace,
    jouerTour, parades, casesDepart: CASES_DEPART, placementHeuristique, presence };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.KIT = API;
})(typeof window !== 'undefined' ? window : globalThis);
