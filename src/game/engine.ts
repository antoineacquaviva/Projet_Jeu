import {
  Tactique,
  Ordre,
  MachineInfo,
  Reglages,
  ParametresCalcules,
  Plateau,
  EtatJeu,
  LancerTirage,
  EchangePiste,
  EvenementLancer,
  OrdrePerdu,
  Carte,
  Geometrie,
  CellGeo,
} from '../types';

export const TACTIQUES: Tactique[] = ['cupidite', 'percee', 'opportunisme', 'represailles'];

export const NOMS_TACTIQUES: Record<Tactique, string> = {
  cupidite: 'Cupidité',
  percee: 'Percée',
  opportunisme: 'Opportunisme',
  represailles: 'Représailles',
};

export const COURT_TACTIQUE: Record<Tactique, string> = {
  cupidite: 'Cupi',
  percee: 'Perc',
  opportunisme: 'Oppo',
  represailles: 'Repr',
};

export const RIEN = 'rien';
export const GARDER = 'garder';
export const ALLER = 'aller';
export const SABOTER = 'saboter';

export const PENSEES_DEPART: Record<number, Tactique> = {
  2: 'percee',
  3: 'represailles',
  4: 'percee',
  5: 'represailles',
  6: 'opportunisme',
  7: 'cupidite',
  8: 'opportunisme',
  9: 'represailles',
  10: 'percee',
  11: 'cupidite',
  12: 'cupidite',
};

export const CHANCES_SOMME = (s: number): number => 6 - Math.abs(s - 7);

export const ECARTS = [1, 2, 0, 3, 4, 5];
export const CHANCES_ECART: Record<number, number> = { 0: 6, 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 };

export const MACHINES: MachineInfo[] = [
  { nom: 'Grosse Gueule', court: 'GG' },
  { nom: 'Rapiat', court: 'Ra' },
  { nom: 'Mâchoire', court: 'Mâ' },
  { nom: 'Tonton Débard', court: 'TD' },
  { nom: 'Ripaille', court: 'Ri' },
  { nom: 'Zizanie', court: 'Zi' },
];

export const ECART_DEPART = [1, 2, 3, 4, 5, 0];
export const NM = MACHINES.length;

export const TUILES: Tactique[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => PENSEES_DEPART[s]);

export const DEFAUTS: Reglages = {
  joueurs: 3,
  etapes: 2,
  lancersEnPlus: 1,
  rythme: 'lancer',
  presage: false,
  tuileL: 3,
  tuileP: 3,
  individusParJoueur: 3,
  arbres: 3,
  coeurArbres: 0,
  tours: 4,
  graine: 1,
};

export interface RNG {
  (): number;
  entier: (n: number) => number;
  choix: <T>(xs: T[]) => T;
  melange: <T>(xs: T[]) => T[];
}

export function generateur(graine: number): RNG {
  let a = (graine >>> 0) || 1;
  const r = function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  } as RNG;

  r.entier = (n: number) => Math.floor(r() * n);
  r.choix = <T>(xs: T[]): T => xs[r.entier(xs.length)];
  r.melange = <T>(xs: T[]): T[] => {
    const ys = xs.slice();
    for (let i = ys.length - 1; i > 0; i--) {
      const j = r.entier(i + 1);
      [ys[i], ys[j]] = [ys[j], ys[i]];
    }
    return ys;
  };
  return r;
}

export function params(reglages?: Partial<Reglages>): ParametresCalcules {
  const r: Reglages = Object.assign({}, DEFAUTS, reglages || {});
  const p: ParametresCalcules = {
    J: r.joueurs,
    l: r.tuileL,
    q: r.tuileP,
    a: r.arbres,
    coeurArbres: r.coeurArbres || r.arbres,
    I: r.individusParJoueur * r.joueurs,
    ipj: r.individusParJoueur,
    E: r.etapes,
    k: r.joueurs,
    L: r.joueurs + r.lancersEnPlus,
    surPlateau: Math.min(r.joueurs + 1, NM),
    rythme: r.rythme,
    presage: !!r.presage,
    tours: r.tours,
    graine: r.graine,
    reglages: r,
    lancersParTour: 0,
    ordresParTour: 0,
    c0: 0,
    erreurs: [],
  };
  p.lancersParTour = p.L * p.E;
  p.ordresParTour = p.k * p.E;
  p.c0 = p.J * p.l * p.q * p.a + p.coeurArbres;

  const err: string[] = [];
  if (p.J < 1 || p.J > 6) err.push('de 1 à 6 joueurs');
  if (p.E < 1 || p.E > 2) err.push('une ou deux étapes');
  if (p.L <= p.k) err.push("il faut plus de lancers que d'ordres par vague");
  if (p.c0 <= p.lancersParTour * p.tours) {
    err.push('la forêt de départ doit dépasser le nombre total de lancers');
  }
  if (p.rythme !== 'lancer' && p.rythme !== 'vague') {
    err.push('rythme : « lancer » ou « vague »');
  }
  p.erreurs = err;
  return p;
}

export function plateau(p: ParametresCalcules): Plateau {
  const { J, l, q } = p;
  const N = 1 + J * l * q;
  const idx = (t: number, r: number, c: number) => 1 + t * l * q + r * l + c;
  const adj = Array.from({ length: N }, () => new Set<number>());
  const lier = (a: number, b: number) => {
    if (a !== b) {
      adj[a].add(b);
      adj[b].add(a);
    }
  };

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
  const dist: number[][] = [];
  for (let c = 0; c < N; c++) {
    const d = new Array(N).fill(-1);
    d[c] = 0;
    const file = [c];
    for (let i = 0; i < file.length; i++) {
      const u = file[i];
      for (const w of voisins[u]) {
        if (d[w] < 0) {
          d[w] = d[u] + 1;
          file.push(w);
        }
      }
    }
    dist.push(d);
  }

  const coeur = dist[0].map((x) => 2 * x);
  const tuile = [-1];
  const rang = [-1];
  const col = [-1];
  for (let t = 0; t < J; t++) {
    for (let r = 0; r < q; r++) {
      for (let c = 0; c < l; c++) {
        tuile.push(t);
        rang.push(r);
        col.push(c);
      }
    }
  }

  const lisieres: number[][] = [];
  for (let t = 0; t < J; t++) {
    const li: number[] = [];
    for (let c = 0; c < l; c++) li.push(idx(t, q - 1, c));
    lisieres.push(li);
  }

  return { N, voisins, dist, coeur, tuile, rang, col, lisieres, idx };
}

export const proprietaire = (p: ParametresCalcules, i: number): number => Math.floor((i * p.J) / p.I);

export function miseEnPlace(p: ParametresCalcules, pl: Plateau, rng: RNG): EtatJeu {
  const arbres = new Array(pl.N).fill(p.a);
  arbres[0] = p.coeurArbres;
  const machines = new Array(NM).fill(-1);
  for (let m = 0; m < p.surPlateau; m++) {
    const li = m < p.J ? pl.lisieres[m] : pl.lisieres[rng.entier(p.J)];
    machines[m] = rng.choix(li);
  }
  const pensees = new Array(13).fill(-1);
  for (let s = 2; s <= 12; s++) pensees[s] = s - 2;
  const pisteM = ECARTS.map((d) => ECART_DEPART.indexOf(d));
  return { arbres, machines, individus: [], tour: 0, pensees, pisteM };
}

export const copie = (e: EtatJeu): EtatJeu => ({
  arbres: e.arbres.slice(),
  machines: e.machines.slice(),
  individus: e.individus.slice(),
  tour: e.tour,
  pensees: e.pensees.slice(),
  pisteM: e.pisteM.slice(),
});

export const foret = (e: EtatJeu): number => e.arbres.reduce((s, x) => s + x, 0);

export const tactiqueEn = (e: EtatJeu, s: number): Tactique => TUILES[e.pensees[s]];

export function tirerLancer(p: ParametresCalcules, rng: RNG): LancerTirage {
  return {
    d: [1 + rng.entier(6), 1 + rng.entier(6)] as [number, number],
    t: rng.entier(p.J),
    c: rng.entier(p.l),
  };
}

export function tirerTour(p: ParametresCalcules, rng: RNG): LancerTirage[][] {
  const out: LancerTirage[][] = [];
  for (let v = 0; v < p.E; v++) {
    const w: LancerTirage[] = [];
    for (let k = 0; k < p.L; k++) w.push(tirerLancer(p, rng));
    out.push(w);
  }
  return out;
}

export function lire(e: EtatJeu, d: [number, number]) {
  const somme = d[0] + d[1];
  const ecart = Math.abs(d[0] - d[1]);
  const pos = ECARTS.indexOf(ecart);
  return {
    somme,
    ecart,
    tuile: e.pensees[somme],
    tactique: TUILES[e.pensees[somme]],
    pos,
    machine: e.pisteM[pos],
  };
}

export function presence(e: EtatJeu): Record<number, number> {
  const m: Record<number, number> = {};
  for (const c of e.individus) m[c] = (m[c] || 0) + 1;
  return m;
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

function minPar<T>(xs: T[], cle: (x: T) => number[]): T {
  let best = xs[0];
  let kb = cle(xs[0]);
  for (const x of xs.slice(1)) {
    const k = cle(x);
    if (cmp(k, kb) < 0) {
      best = x;
      kb = k;
    }
  }
  return best;
}

export function plusProcheBoisee(pl: Plateau, e: EtatJeu, depuis: number): number {
  const d = pl.dist[depuis];
  const A = e.arbres;
  const boisees: number[] = [];
  for (let c = 0; c < pl.N; c++) if (A[c] > 0) boisees.push(c);
  return minPar(boisees, (c) => [d[c], -A[c], pl.coeur[c], c]);
}

export function destination(
  _p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  machine: number,
  tactique: Tactique
): [number, boolean] {
  const pos = e.machines[machine];
  const A = e.arbres;
  const rayon = [pos].concat(pl.voisins[pos]).filter((c) => A[c] > 0);
  if (!rayon.length) return [plusProcheBoisee(pl, e, pos), true];

  let cle: (c: number) => number[];
  if (tactique === 'cupidite') {
    cle = (c) => [-A[c], pl.coeur[c], c !== pos ? 1 : 0, c];
  } else if (tactique === 'percee') {
    cle = (c) => [pl.coeur[c], -A[c], c !== pos ? 1 : 0, c];
  } else {
    const pres = presence(e);
    if (tactique === 'opportunisme') {
      cle = (c) => [pres[c] || 0, -A[c], pl.coeur[c], c];
    } else {
      cle = (c) => [-(pres[c] || 0), -A[c], pl.coeur[c], c];
    }
  }
  return [minPar(rayon, cle), false];
}

export function entree(
  _p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  lancer: { t: number; c: number }
): [number, number] {
  const e0 = pl.lisieres[lancer.t][lancer.c];
  return [e0, e.arbres[e0] > 0 ? e0 : plusProcheBoisee(pl, e, e0)];
}

export function apprendre(
  e: EtatJeu,
  tuile: number,
  machine: number,
  reussite: boolean
): EchangePiste {
  const s = e.pensees.indexOf(tuile);
  let n: number | null = null;
  if (reussite) {
    n = s < 7 ? s + 1 : s > 7 ? s - 1 : null;
  } else {
    n = s < 7 ? (s > 2 ? s - 1 : null) : s > 7 ? (s < 12 ? s + 1 : null) : 8;
  }
  if (n !== null) {
    const x = e.pensees[s];
    e.pensees[s] = e.pensees[n];
    e.pensees[n] = x;
  }
  const pos = e.pisteM.indexOf(machine);
  let np: number | null = reussite ? (pos > 0 ? pos - 1 : null) : pos < NM - 1 ? pos + 1 : null;
  if (np !== null) {
    const x = e.pisteM[pos];
    e.pisteM[pos] = e.pisteM[np];
    e.pisteM[np] = x;
  }
  return { pensees: [s, n], machines: [pos, np] };
}

export function ordresPossibles(
  _p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  _i: number,
  pos?: number
): Ordre[] {
  if (pos === undefined) pos = e.individus[_i];
  const ops: Ordre[] = [[GARDER, pos]];
  e.machines.forEach((m, j) => {
    if (m === pos) ops.push([SABOTER, j]);
  });
  for (const c of pl.voisins[pos]) ops.push([ALLER, c]);
  return ops;
}

export const cartesVides = (p: ParametresCalcules): (Carte | null)[][] =>
  Array.from({ length: p.J }, () => new Array(p.E).fill(null));

export function positionsPrevues(
  _p: ParametresCalcules,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  v: number
): number[] {
  const pos = e.individus.slice();
  for (let w = 0; w < v; w++) {
    for (const cs of cartes) {
      const c = cs[w];
      if (c && c.o[0] === ALLER && typeof c.o[1] === 'number') {
        pos[c.i] = c.o[1];
      }
    }
  }
  return pos;
}

export function programmeEtape(
  p: ParametresCalcules,
  cartes: (Carte | null)[][],
  v: number
): Ordre[] {
  const prog: Ordre[] = Array.from({ length: p.I }, () => [RIEN, null]);
  cartes.forEach((cs, j) => {
    const c = cs[v];
    if (c) {
      if (proprietaire(p, c.i) !== j) throw new Error("un joueur commande l'individu d'un autre");
      prog[c.i] = c.o;
    }
  });
  return prog;
}

export function reveler(
  _p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  prog: Ordre[]
) {
  const gardes: Record<number, number> = {};
  const sab: Record<number, number> = {};
  const quiG: Record<number, number[]> = {};
  const quiS: Record<number, number[]> = {};
  const perdus: OrdrePerdu[] = [];

  prog.forEach(([typ, arg], i) => {
    if (typ !== ALLER || typeof arg !== 'number') return;
    if (pl.dist[e.individus[i]][arg] !== 1) {
      perdus.push({ i, o: [typ, arg], pourquoi: 'case hors de portée' });
      return;
    }
    e.individus[i] = arg;
  });

  prog.forEach(([typ, arg], i) => {
    if (typ === GARDER && typeof arg === 'number') {
      const c = e.individus[i];
      if (arg !== c) {
        perdus.push({ i, o: [typ, arg], pourquoi: "l'individu n'est pas sur cette case" });
        return;
      }
      gardes[c] = (gardes[c] || 0) + 1;
      (quiG[c] = quiG[c] || []).push(i);
    } else if (typ === SABOTER && typeof arg === 'number') {
      if (e.machines[arg] !== e.individus[i]) {
        perdus.push({ i, o: [typ, arg], pourquoi: 'la Machine a quitté la case' });
        return;
      }
      sab[arg] = (sab[arg] || 0) + 1;
      (quiS[arg] = quiS[arg] || []).push(i);
    }
  });

  return { gardes, sab, quiG, quiS, perdus };
}

export function executerLancer(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  pose: {
    gardes: Record<number, number>;
    sab: Record<number, number>;
    quiG: Record<number, number[]>;
    quiS: Record<number, number[]>;
  },
  lancer: LancerTirage,
  attente: { tuile: number; machine: number; reussite: boolean }[]
): EvenementLancer {
  const L = lire(e, lancer.d);
  const m = L.machine;
  const ev: EvenementLancer = {
    d: lancer.d,
    somme: L.somme,
    ecart: L.ecart,
    tuile: L.tuile,
    tactique: L.tactique,
    machine: m,
    de: e.machines[m],
    cible: 0,
    repli: false,
    issue: 'abattu',
  };

  if (e.machines[m] < 0) {
    const [e0, cible] = entree(p, pl, e, lancer);
    ev.entree = e0;
    ev.cible = cible;
    ev.repli = cible !== e0;
    if ((pose.gardes[cible] || 0) > 0) {
      pose.gardes[cible]--;
      e.machines[m] = e0;
      ev.issue = 'gardee';
      ev.qui = pose.quiG[cible].shift();
      ev.lieu = cible;
    } else {
      e.machines[m] = cible;
      e.arbres[cible]--;
      ev.issue = 'abattu';
    }
  } else {
    const [cible, repli] = destination(p, pl, e, m, L.tactique);
    ev.cible = cible;
    ev.repli = repli;
    if ((pose.sab[m] || 0) > 0) {
      pose.sab[m]--;
      const de = e.machines[m];
      e.machines[m] = cible;
      ev.issue = 'sabotee';
      ev.qui = pose.quiS[m].shift();
      ev.lieu = de;
    } else if ((pose.gardes[cible] || 0) > 0) {
      pose.gardes[cible]--;
      ev.issue = 'gardee';
      ev.qui = pose.quiG[cible].shift();
      ev.lieu = cible;
    } else {
      e.machines[m] = cible;
      e.arbres[cible]--;
      ev.issue = 'abattu';
    }
  }

  const verdict = { tuile: L.tuile, machine: m, reussite: ev.issue === 'abattu' };
  if (p.rythme === 'lancer') {
    ev.appris = apprendre(e, verdict.tuile, verdict.machine, verdict.reussite);
  } else {
    attente.push(verdict);
  }
  return ev;
}

export function finVague(
  _p: ParametresCalcules,
  e: EtatJeu,
  attente: { tuile: number; machine: number; reussite: boolean }[]
): EchangePiste[] {
  return attente.splice(0).map((v) => apprendre(e, v.tuile, v.machine, v.reussite));
}

export function jouerTour(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  tirage: LancerTirage[][]
) {
  const etapes = [];
  for (let v = 0; v < p.E; v++) {
    const pose = reveler(p, pl, e, programmeEtape(p, cartes, v));
    const attente: { tuile: number; machine: number; reussite: boolean }[] = [];
    const evts = tirage[v].map((l) => executerLancer(p, pl, e, pose, l, attente));
    const appris = finVague(p, e, attente);
    etapes.push({ perdus: pose.perdus, evts, appris });
  }
  e.tour++;
  return etapes;
}

export const paradesEtapes = (
  etapes: { evts: EvenementLancer[] }[]
): number =>
  etapes.reduce((s, x) => s + x.evts.filter((v) => v.issue !== 'abattu').length, 0);

export const ISSUES: [number, number][] = [];
for (let a = 1; a <= 6; a++) {
  for (let b = 1; b <= 6; b++) ISSUES.push([a, b]);
}

export function profils(e: EtatJeu) {
  const out = MACHINES.map(() => ({
    chances: 0,
    tactiques: { cupidite: 0, percee: 0, opportunisme: 0, represailles: 0 } as Record<Tactique, number>,
  }));
  for (const d of ISSUES) {
    const L = lire(e, d);
    out[L.machine].chances++;
    out[L.machine].tactiques[L.tactique]++;
  }
  return out;
}

export function menaceParCase(p: ParametresCalcules, pl: Plateau, e: EtatJeu): number[] {
  const pr = new Array(pl.N).fill(0);
  const nl = p.J * p.l;
  for (const d of ISSUES) {
    const L = lire(e, d);
    if (e.machines[L.machine] >= 0) {
      pr[destination(p, pl, e, L.machine, L.tactique)[0]] += 1 / 36;
    } else {
      for (let t = 0; t < p.J; t++) {
        for (let c = 0; c < p.l; c++) {
          pr[entree(p, pl, e, { t, c })[1]] += 1 / 36 / nl;
        }
      }
    }
  }
  return pr;
}

export const auMoinsUneFois = (chances: number, L: number): number =>
  1 - Math.pow(1 - chances / 36, L);

export const CASES_DEPART = (p: ParametresCalcules, pl: Plateau, i: number): number[] => {
  const j = proprietaire(p, i);
  const out: number[] = [];
  for (let c = 0; c < pl.N; c++) if (pl.tuile[c] === j) out.push(c);
  return out;
};

export function placementHeuristique(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu
): number[] {
  const pris: number[] = [];
  const surPl = e.machines.filter((m) => m >= 0);
  for (let i = 0; i < p.I; i++) {
    const score = (c: number) =>
      surPl.reduce((s, m) => s + Math.max(0, 3 - pl.dist[m][c]), 0) +
      0.05 * e.arbres[c] -
      3 * pris.filter((x) => x === c).length -
      0.01 * pl.coeur[c];
    let best = -1;
    let sb = -Infinity;
    for (const c of CASES_DEPART(p, pl, i)) {
      const s = score(c);
      if (s > sb || (s === sb && (best < 0 || c < best))) {
        best = c;
        sb = s;
      }
    }
    pris.push(best);
  }
  return pris;
}

export function nouvellePartie(reglages?: Partial<Reglages>) {
  const p = params(reglages);
  const pl = plateau(p);
  const rng = generateur(p.graine);
  const e = miseEnPlace(p, pl, rng);
  e.individus = placementHeuristique(p, pl, e);
  const tirages: LancerTirage[][][] = [];
  for (let t = 0; t < p.tours; t++) tirages.push(tirerTour(p, rng));
  return { p, pl, e, tirages };
}

// SVG radial geometry
export const CX = 320;
export const CY = 320;
export const RH = 54;
export const R0 = 54;
export const R1 = 286;

export function geometrie(p: ParametresCalcules, pl: Plateau): Geometrie {
  const A = (2 * Math.PI) / p.J;
  const a0 = -Math.PI / 2 - A / 2;
  const w = (R1 - R0) / p.q;
  const pt = (r: number, a: number): [number, number] => [
    CX + r * Math.cos(a),
    CY + r * Math.sin(a),
  ];

  const cells: CellGeo[] = [
    {
      c: 0,
      path: null,
      cx: CX,
      cy: CY,
      r: RH,
      tan: [1, 0],
      rad: [0, 1],
      nx: CX,
      ny: CY + 38,
      lx: CX,
      ly: CY - 30,
      arc: 2 * Math.PI * RH,
      w: RH,
    },
  ];

  for (let c = 1; c < pl.N; c++) {
    const t = pl.tuile[c];
    const r = pl.rang[c];
    const k = pl.col[c];
    const ga = a0 + t * A + (k * A) / p.l;
    const gb = ga + A / p.l;
    const ra = R0 + r * w;
    const rb = ra + w;
    const [x1, y1] = pt(ra, ga);
    const [x2, y2] = pt(rb, ga);
    const [x3, y3] = pt(rb, gb);
    const [x4, y4] = pt(ra, gb);
    const big = gb - ga > Math.PI ? 1 : 0;
    const path = `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${rb},${rb} 0 ${big} 1 ${x3.toFixed(1)},${y3.toFixed(1)} L${x4.toFixed(1)},${y4.toFixed(1)} A${ra},${ra} 0 ${big} 0 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
    const am = (ga + gb) / 2;
    const rm = (ra + rb) / 2;
    const [cx, cy] = pt(rm, am);
    const [nx, ny] = pt(rb - 9, am);
    const [lx, ly] = pt(ra + 8, am);
    cells.push({
      c,
      path,
      cx,
      cy,
      nx,
      ny,
      lx,
      ly,
      tan: [-Math.sin(am), Math.cos(am)],
      rad: [Math.cos(am), Math.sin(am)],
      arc: rm * (gb - ga),
      w,
    });
  }

  const seps: [number, number, number, number][] = [];
  for (let t = 0; t < p.J; t++) {
    const a = a0 + t * A;
    const [x1, y1] = pt(R0 - 4, a);
    const [x2, y2] = pt(R1 + 4, a);
    seps.push([x1, y1, x2, y2]);
  }

  const noms: [number, number][] = [];
  for (let t = 0; t < p.J; t++) {
    const [x, y] = pt(R1 + 18, a0 + (t + 0.5) * A);
    noms.push([x, y]);
  }

  return { cells, seps, noms };
}

export function positions(
  geo: Geometrie,
  e: EtatJeu
): Record<string, [number, number]> {
  const par: Record<number, string[]> = {};
  e.machines.forEach((c, j) => {
    if (c >= 0) (par[c] = par[c] || []).push('m' + j);
  });
  e.individus.forEach((c, i) => {
    (par[c] = par[c] || []).push('i' + i);
  });

  const pos: Record<string, [number, number]> = {};
  for (const cStr in par) {
    const c = +cStr;
    const g = geo.cells[c];
    if (!g) continue;
    const ids = par[c];
    const n = ids.length;
    const parRang = c === 0 ? 4 : Math.max(1, Math.min(4, Math.floor((g.arc - 4) / 23)));
    ids.forEach((id, k) => {
      const rang = Math.floor(k / parRang);
      const col = k % parRang;
      const dansRang = Math.min(parRang, n - rang * parRang);
      const off = (col - (dansRang - 1) / 2) * 23;
      const offR = (rang - (Math.ceil(n / parRang) - 1) / 2) * 19;
      pos[id] = [
        g.cx + g.tan[0] * off + g.rad[0] * offR,
        g.cy + g.tan[1] * off + g.rad[1] * offR,
      ];
    });
  }
  return pos;
}
