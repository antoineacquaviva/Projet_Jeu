import {
  ParametresCalcules,
  Plateau,
  EtatJeu,
  Carte,
  Ordre,
  Tactique,
  Reglages,
} from '../types';
import * as K from './engine';

export function nomCase(p: ParametresCalcules, pl: Plateau, c: number): string {
  if (c === 0) return 'Cœur';
  return 'ABCDEF'[pl.tuile[c]] + (pl.rang[c] * p.l + pl.col[c] + 1);
}

export const nomInd = (p: ParametresCalcules, i: number): string =>
  'J' + (K.proprietaire(p, i) + 1) + String.fromCharCode(97 + (i % p.ipj));

export const nomM = (m: number): string => K.MACHINES[m].nom;
export const pc = (x: number): string => Math.round(100 * x) + ' %';
export const f1 = (x: number): string => x.toFixed(1).replace('.', ',');
export const f2 = (x: number): string => x.toFixed(2).replace('.', ',');

export const individusDe = (p: ParametresCalcules, j: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < p.I; i++) if (K.proprietaire(p, i) === j) out.push(i);
  return out;
};

export function ordreTexte(p: ParametresCalcules, pl: Plateau, o: Ordre | null): string {
  if (!o || o[0] === K.RIEN) return 'rien';
  if (o[0] === K.GARDER && typeof o[1] === 'number') return 'garde ' + nomCase(p, pl, o[1]);
  if (o[0] === K.ALLER && typeof o[1] === 'number') return 'va en ' + nomCase(p, pl, o[1]);
  if (o[0] === K.SABOTER && typeof o[1] === 'number') return 'sabote ' + nomM(o[1]);
  return 'rien';
}

export function queueBinomiale(n: number, q: number, r: number): number {
  if (r <= 0) return 1;
  let s = 0;
  let c = 1;
  for (let x = 0; x <= n; x++) {
    if (x >= r) s += c * Math.pow(q, x) * Math.pow(1 - q, n - x);
    c = (c * (n - x)) / (x + 1);
  }
  return s;
}

export function echantillons(
  p: ParametresCalcules,
  rng: K.RNG,
  S: number,
  ctx?: { connus?: [number, number][] } | null
) {
  const out = [];
  for (let s = 0; s < S; s++) {
    const t = K.tirerTour(p, rng);
    if (ctx && ctx.connus) {
      t[0].forEach((l, k) => {
        if (ctx.connus && ctx.connus[k]) l.d = ctx.connus[k].slice() as [number, number];
      });
    }
    out.push(t);
  }
  return out;
}

export function valeur(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  echant: any[]
): number {
  let tot = 0;
  for (const t of echant) {
    const f = K.copie(e);
    tot += K.paradesEtapes(K.jouerTour(p, pl, f, cartes, t));
  }
  return tot / echant.length;
}

export const copieCartes = (cartes: (Carte | null)[][]): (Carte | null)[][] =>
  cartes.map((cs) => cs.slice());

export function lectureEtape(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  pos: number[],
  v: number,
  ctx?: { connus?: [number, number][] } | null
) {
  const f = K.copie(e);
  f.individus = pos.slice();
  if (v === 0 && ctx && ctx.connus) {
    const hc: Record<number, number> = {};
    const hm: Record<number, number> = {};
    for (const d of ctx.connus) {
      const L = K.lire(f, d);
      hm[L.machine] = (hm[L.machine] || 0) + 1;
      if (f.machines[L.machine] >= 0) {
        const c = K.destination(p, pl, f, L.machine, L.tactique)[0];
        hc[c] = (hc[c] || 0) + 1;
      }
    }
    return {
      garde: (c: number, deja: number) => ((hc[c] || 0) > deja ? 1 : 0),
      sabot: (m: number, deja: number) => ((hm[m] || 0) > deja ? 1 : 0),
      pr: K.menaceParCase(p, pl, f),
      certain: true,
    };
  }
  const pr = K.menaceParCase(p, pl, f);
  const prof = K.profils(f);
  return {
    garde: (c: number, deja: number) => queueBinomiale(p.L, pr[c], deja + 1),
    sabot: (m: number, deja: number) => queueBinomiale(p.L, prof[m].chances / 36, deja + 1),
    pr,
    certain: false,
  };
}

export function reflexe(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  joueurs: number[],
  _rng: K.RNG,
  ctx?: { connus?: [number, number][] } | null
): Record<number, string> {
  const raisons: Record<number, string> = {};
  for (const j of joueurs) {
    const morceaux: string[] = [];
    for (let v = 0; v < p.E; v++) {
      const pos = K.positionsPrevues(p, e, cartes, v);
      const lu = lectureEtape(p, pl, e, pos, v, ctx);
      const gardes: Record<number, number> = {};
      const sabs: Record<number, number> = {};
      cartes.forEach((cs) => {
        const c = cs[v];
        if (!c) return;
        if (c.o[0] === K.GARDER && typeof c.o[1] === 'number') {
          gardes[c.o[1]] = (gardes[c.o[1]] || 0) + 1;
        }
        if (c.o[0] === K.SABOTER && typeof c.o[1] === 'number') {
          sabs[c.o[1]] = (sabs[c.o[1]] || 0) + 1;
        }
      });
      let best: { v: number; i: number; o: Ordre } | null = null;
      for (const i of individusDe(p, j)) {
        const c = pos[i];
        const vg = lu.garde(c, gardes[c] || 0);
        if (!best || vg > best.v + 1e-9) best = { v: vg, i, o: [K.GARDER, c] };
        e.machines.forEach((m, k) => {
          if (m !== c) return;
          const vs = lu.sabot(k, sabs[k] || 0) + 0.001;
          if (!best || vs > best.v + 1e-9) best = { v: vs, i, o: [K.SABOTER, k] };
        });
      }
      const etq = p.E > 1 ? `Étape ${v + 1} : ` : '';
      if (best && best.v >= 0.2) {
        cartes[j][v] = { i: best.i, o: best.o };
        const pourquoi = lu.certain
          ? "le présage montre qu'une menace y arrivera"
          : best.o[0] === K.GARDER
          ? `${pc(best.v)} de chances qu'au moins une menace de la vague frappe là`
          : `${pc(best.v)} de chances que cette Machine agisse dans la vague`;
        morceaux.push(`${etq}${nomInd(p, best.i)} ${ordreTexte(p, pl, best.o)} (${pourquoi}).`);
        continue;
      }
      // se placer
      const tenues = new Set(pos);
      let mv: { g: number; i: number; c: number } | null = null;
      for (const i of individusDe(p, j)) {
        for (const c of pl.voisins[pos[i]]) {
          if (tenues.has(c)) continue;
          const gain = lu.pr[c] - lu.pr[pos[i]];
          if (gain > 0.02 && (!mv || gain > mv.g)) mv = { g: gain, i, c };
        }
      }
      if (mv) {
        cartes[j][v] = { i: mv.i, o: [K.ALLER, mv.c] };
        morceaux.push(
          `${etq}${nomInd(p, mv.i)} va en ${nomCase(p, pl, mv.c)}, plus menacée (${pc(
            lu.pr[mv.c]
          )} par lancer) : il s'y place.`
        );
      } else {
        morceaux.push(`${etq}aucun ordre utile.`);
      }
    }
    raisons[j] = morceaux.join(' ');
  }
  return raisons;
}

export function optionsCartes(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  j: number,
  v: number
): (Carte | null)[] {
  const pos = K.positionsPrevues(p, e, cartes, v);
  const out: (Carte | null)[] = [null];
  for (const i of individusDe(p, j)) {
    for (const o of K.ordresPossibles(p, pl, e, i, pos[i])) {
      out.push({ i, o });
    }
  }
  return out;
}

export function decrireCartes(
  p: ParametresCalcules,
  pl: Plateau,
  cs: (Carte | null)[]
): string {
  return cs
    .map(
      (c, v) =>
        `${p.E > 1 ? `étape ${v + 1}, ` : ''}${
          c ? nomInd(p, c.i) + ' ' + ordreTexte(p, pl, c.o) : 'rien'
        }`
    )
    .join(' ; ');
}

export function stratege(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  joueurs: number[],
  rng: K.RNG,
  ctx?: { connus?: [number, number][] } | null,
  S?: number
): Record<number, string> {
  S = S || 10;
  const raisons: Record<number, string> = {};
  const echant = echantillons(p, rng, S, ctx);
  for (const j of joueurs) {
    let bestVal = -Infinity;
    let bestCs: (Carte | null)[] | null = null;
    const essai = copieCartes(cartes);
    const parcourir = (v: number) => {
      if (v === p.E) {
        const nonNullCount = essai[j].filter((c): c is Carte => c !== null).length;
        const val = valeur(p, pl, e, essai, echant) - 0.001 * nonNullCount;
        if (bestCs === null || val > bestVal + 1e-9) {
          bestVal = val;
          bestCs = essai[j].slice();
        }
        return;
      }
      for (const c of optionsCartes(p, pl, e, essai, j, v)) {
        essai[j][v] = c;
        parcourir(v + 1);
      }
      essai[j][v] = null;
    };
    parcourir(0);
    if (bestCs) {
      const finalCs: (Carte | null)[] = bestCs;
      cartes[j] = finalCs;
      const count = finalCs.filter((c): c is Carte => c !== null).length;
      raisons[j] = `${decrireCartes(p, pl, finalCs)} : la meilleure paire de cartes de ce joueur, ${f2(
        bestVal + 0.001 * count
      )} parade(s) attendue(s) sur ${S} tirages des pistes, ses partenaires étant fixés.`;
    }
  }
  return raisons;
}

export function prevoyant(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  joueurs: number[],
  rng: K.RNG,
  ctx?: { connus?: [number, number][] } | null,
  R?: number,
  H?: number
): Record<number, string> {
  R = R || 12;
  H = H === undefined ? 1 : H;
  const base = copieCartes(cartes);
  const cands: {
    cs: (Carte | null)[][];
    raisons: Record<number, string>;
    nom: string;
    v?: number;
  }[] = [];

  const meme = (a: (Carte | null)[][], b: (Carte | null)[][]) =>
    a.every((cs, j) =>
      cs.every(
        (c, v) =>
          (c === null && b[j][v] === null) ||
          (c &&
            b[j][v] &&
            c.i === b[j][v]!.i &&
            c.o[0] === b[j][v]!.o[0] &&
            c.o[1] === b[j][v]!.o[1])
      )
    );

  const ajoute = (cs: (Carte | null)[][], r: Record<number, string>, nom: string) => {
    if (!cands.some((x) => meme(x.cs, cs))) cands.push({ cs, raisons: r, nom });
  };

  const c1 = copieCartes(base);
  ajoute(c1, reflexe(p, pl, e, c1, joueurs, rng, ctx), 'réflexe');

  const c2 = copieCartes(base);
  const r2 = stratege(p, pl, e, c2, joueurs, rng, ctx, 8);
  ajoute(c2, r2, 'glouton');

  for (const j of joueurs) {
    const v = p.E - 1;
    const cs = copieCartes(c2);
    const pos = K.positionsPrevues(p, e, cs, v);
    const f = K.copie(e);
    f.individus = pos;
    const pr = K.menaceParCase(p, pl, f);
    let mv: { g: number; i: number; c: number } | null = null;
    for (const i of individusDe(p, j)) {
      for (const c of pl.voisins[pos[i]]) {
        if (!pos.includes(c) && (!mv || pr[c] > mv.g)) mv = { g: pr[c], i, c };
      }
    }
    if (!mv) continue;
    cs[j][v] = { i: mv.i, o: [K.ALLER, mv.c] };
    const rCopy = Object.assign({}, r2);
    rCopy[j] = `${decrireCartes(p, pl, cs[j])} : se placer en ${nomCase(p, pl, mv.c)} pour le tour suivant.`;
    ajoute(cs, rCopy, 'placement');
  }

  const ech = echantillons(p, rng, R, ctx);
  const suites: any[] = [];
  for (let k = 0; k < R; k++) suites.push(K.tirerTour(p, rng));
  const tous = Array.from({ length: p.J }, (_, j) => j);

  for (const c of cands) {
    let tot = 0;
    for (let k = 0; k < R; k++) {
      const f = K.copie(e);
      tot += K.paradesEtapes(K.jouerTour(p, pl, f, c.cs, ech[k]));
      for (let h = 0; h < H && f.tour < p.tours; h++) {
        const cs = K.cartesVides(p);
        reflexe(p, pl, f, cs, tous, rng, null);
        tot += K.paradesEtapes(K.jouerTour(p, pl, f, cs, suites[k]));
      }
    }
    c.v = tot / R;
  }

  cands.sort((a, b) => (b.v || 0) - (a.v || 0));
  const best = cands[0];
  best.cs.forEach((cs, j) => {
    cartes[j] = cs.slice();
  });
  const refl = cands.find((x) => x.nom === 'réflexe');
  const raisons: Record<number, string> = {};
  for (const j of joueurs) {
    raisons[j] =
      (best.raisons[j] || decrireCartes(p, pl, best.cs[j])) +
      ` [Programme ${best.nom} retenu parmi ${cands.length} : ${f2(
        best.v || 0
      )} parades attendues sur ce tour et le suivant${
        refl && refl !== best ? `, contre ${f2(refl.v || 0)} pour le réflexe` : ''
      }.]`;
  }
  return raisons;
}

export function hasard(
  p: ParametresCalcules,
  pl: Plateau,
  e: EtatJeu,
  cartes: (Carte | null)[][],
  joueurs: number[],
  rng: K.RNG
): Record<number, string> {
  const raisons: Record<number, string> = {};
  for (const j of joueurs) {
    for (let v = 0; v < p.E; v++) {
      const pos = K.positionsPrevues(p, e, cartes, v);
      const i = rng.choix(individusDe(p, j));
      cartes[j][v] = { i, o: rng.choix(K.ordresPossibles(p, pl, e, i, pos[i])) };
    }
    raisons[j] = `${decrireCartes(p, pl, cartes[j])} : tiré au hasard.`;
  }
  return raisons;
}

export const BOTS = {
  reflexe: {
    nom: 'Réflexe',
    decrit: 'garde la case la plus menacée ou sabote la Machine la plus probable, étape par étape',
    jouer: reflexe,
  },
  prevoyant: {
    nom: 'Prévoyant',
    decrit: 'compare quelques programmes en jouant ce tour et le suivant',
    jouer: prevoyant,
  },
  stratege: {
    nom: 'Glouton',
    decrit: 'la meilleure paire de cartes pour ce tour, sur des tirages des pistes',
    jouer: stratege,
  },
  hasard: {
    nom: 'Hasard',
    decrit: 'des cartes permises au hasard (témoin)',
    jouer: hasard,
  },
};

export function partieAuto(reglages: Partial<Reglages>, bot: keyof typeof BOTS) {
  const { p, pl, e, tirages } = K.nouvellePartie(reglages);
  const rb = K.generateur(p.graine * 7919 + 17);
  const parJoueur = new Array(p.J).fill(0);
  let S = 0;
  let hors = 0;
  let perdus = 0;
  const tous = Array.from({ length: p.J }, (_, j) => j);

  for (let t = 0; t < p.tours; t++) {
    const cartes = K.cartesVides(p);
    const ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice() as [number, number]) } : null;
    BOTS[bot].jouer(p, pl, e, cartes, tous, rb, ctx);
    for (const et of K.jouerTour(p, pl, e, cartes, tirages[t])) {
      perdus += et.perdus.length;
      for (const v of et.evts) {
        if (v.issue === 'abattu') continue;
        S++;
        if (typeof v.qui === 'number') {
          const j = K.proprietaire(p, v.qui);
          parJoueur[j]++;
          if (typeof v.lieu === 'number' && pl.tuile[v.lieu] !== j) hors++;
        }
      }
    }
  }

  return {
    taux: S / (p.ordresParTour * p.tours),
    foret: K.foret(e) / p.c0,
    agence: parJoueur.filter((x) => x > 0).length / p.J,
    couplage: S ? hors / S : 0,
    parades: S,
    perdus,
  };
}
