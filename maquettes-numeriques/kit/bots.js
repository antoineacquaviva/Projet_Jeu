/* Bots du kit, siège par siège. Chaque bot décide pour les joueurs qu'on lui confie, après les humains et en
   voyant leurs ordres (une équipe bien coordonnée), et explique chaque choix (`raison`).
   - Réflexe : garde là où une menace annoncée frappera, sabote la Machine annoncée, sinon se rapproche.
   - Stratège : estime les parades de chaque ordre sur des ordres d'exécution tirés au hasard (comme le glouton
     du moteur Python), garde le meilleur, et place les joueurs sans parade utile devant les Machines.
   - Hasard : un ordre permis au hasard (témoin). */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && module.exports) ? require('./moteur.js') : G.KIT;
  const { RIEN, GARDER, ALLER, SABOTER, NOMS_TACTIQUES } = K;

  function nomCase(p, pl, c) {
    if (c === 0) return 'Cœur';
    return 'ABCDEF'[pl.tuile[c]] + (pl.rang[c] * p.l + pl.col[c] + 1);
  }
  const nomInd = (p, i) => 'J' + (K.proprietaire(p, i) + 1) + String.fromCharCode(97 + (i % p.ipj));

  // ce que vise chaque menace annoncée, lu sur la configuration du moment (sans tenir compte de l'ordre)
  function cibles(p, pl, e, annonces) {
    return annonces.map(([m, t]) => ({ m, t, c: K.destination(p, pl, e, m, t)[0] }));
  }

  function attraction(p, pl, e) {
    const a = new Array(pl.N).fill(0);
    for (const m of e.machines) for (const c of [m].concat(pl.voisins[m])) if (e.arbres[c] > 0) a[c] += 1;
    return a;
  }
  const pasVers = (pl, depuis, cible) => [depuis].concat(pl.voisins[depuis]).reduce((b, c) =>
    (pl.dist[c][cible] < pl.dist[b][cible] || (pl.dist[c][cible] === pl.dist[b][cible] && c < b)) ? c : b);

  const individusDe = (p, j) => { const out = []; for (let i = 0; i < p.I; i++) if (K.proprietaire(p, i) === j) out.push(i); return out; };

  // se placer : vers la case boisée au contact d'une Machine, non tenue, la plus proche
  function seRapprocher(p, pl, e, prog, j) {
    const a = attraction(p, pl, e);
    const tenues = new Set();
    prog.forEach((o, i) => { tenues.add(o[0] === ALLER ? o[1] : e.individus[i]); });
    let best = null;
    for (const i of individusDe(p, j)) {
      const pos = e.individus[i];
      if (a[pos] > 0) continue;              // déjà au contact d'une Machine
      for (let c = 0; c < pl.N; c++) {
        if (a[c] <= 0 || tenues.has(c) || c === pos) continue;
        const d = pl.dist[pos][c] - 0.3 * a[c];
        if (!best || d < best.d || (d === best.d && c < best.c)) best = { i, c, d, pas: pasVers(pl, pos, c) };
      }
    }
    if (!best || best.pas === e.individus[best.i]) return null;
    return { i: best.i, o: [ALLER, best.pas], raison: `${nomInd(p, best.i)} va en ${nomCase(p, pl, best.pas)} pour se placer devant une Machine (vers ${nomCase(p, pl, best.c)}).` };
  }

  function reflexe(p, pl, e, annonces, prog, joueurs) {
    const raisons = {};
    const vis = cibles(p, pl, e, annonces);
    for (const j of joueurs) {
      // poids encore non couverts : menaces sur chaque case et de chaque Machine
      const w = {}, wm = {};
      for (const v of vis) { w[v.c] = (w[v.c] || 0) + 1; wm[v.m] = (wm[v.m] || 0) + 1; }
      prog.forEach((o, i) => {
        if (o[0] === GARDER) w[o[1]] = (w[o[1]] || 0) - 1;
        if (o[0] === SABOTER) wm[o[1]] = (wm[o[1]] || 0) - 1;
      });
      const cand = [];
      for (const i of individusDe(p, j)) {
        const pos = e.individus[i];
        if ((w[pos] || 0) > 0) cand.push({ v: w[pos], i, o: [GARDER, pos], raison: `${nomInd(p, i)} garde ${nomCase(p, pl, pos)} : ${w[pos]} menace(s) annoncée(s) y frappe(nt).` });
        e.machines.forEach((m, k) => { if (m === pos && (wm[k] || 0) > 0) cand.push({ v: wm[k] + 0.01, i, o: [SABOTER, k], raison: `${nomInd(p, i)} sabote M${k + 1}, qui est sur sa case et menace ce tour.` }); });
      }
      cand.sort((a, b) => b.v - a.v || a.i - b.i);
      if (cand.length) { prog[cand[0].i] = cand[0].o; raisons[j] = cand[0].raison; continue; }
      // aller sur une case visée non tenue, à un pas
      const tenues = new Set(e.individus);
      let pris = null;
      for (const v of vis) {
        if (tenues.has(v.c)) continue;
        for (const i of individusDe(p, j)) if (pl.dist[e.individus[i]][v.c] === 1) { pris = { i, c: v.c, v }; break; }
        if (pris) break;
      }
      if (pris) { prog[pris.i] = [ALLER, pris.c]; raisons[j] = `${nomInd(p, pris.i)} va en ${nomCase(p, pl, pris.c)}, visée par M${pris.v.m + 1} (${NOMS_TACTIQUES[pris.v.t]}) : il y sera pour le tour suivant.`; continue; }
      const r = seRapprocher(p, pl, e, prog, j);
      if (r) { prog[r.i] = r.o; raisons[j] = r.raison; } else raisons[j] = 'Aucun ordre utile : ses individus sont déjà bien placés.';
    }
    return raisons;
  }

  function valeur(p, pl, e, annonces, prog, echant) {
    let tot = 0;
    for (const ex of echant) { const f = K.copie(e); tot += K.parades(K.jouerTour(p, pl, f, annonces, prog, ex)); }
    return tot / echant.length;
  }

  function stratege(p, pl, e, annonces, prog, joueurs, rng, S) {
    S = S || 16;
    const raisons = {};
    const echant = []; for (let s = 0; s < S; s++) echant.push(K.tirerExecution(p, rng));
    let base = valeur(p, pl, e, annonces, prog, echant);
    const libres = new Set(joueurs);
    while (libres.size) {
      let best = null;
      for (const j of libres) for (const i of individusDe(p, j)) for (const o of K.ordresPossibles(p, pl, e, i)) {
        if (o[0] === RIEN || o[0] === ALLER) continue;
        const essai = prog.slice(); essai[i] = o;
        const v = valeur(p, pl, e, annonces, essai, echant) - base;
        if (v > 1e-9 && (!best || v > best.v + 1e-9)) best = { v, i, o, j };
      }
      if (!best) break;
      prog[best.i] = best.o; base += best.v; libres.delete(best.j);
      const quoi = best.o[0] === GARDER ? `garde ${nomCase(p, pl, best.o[1])}` : `sabote M${best.o[1] + 1}`;
      raisons[best.j] = `${nomInd(p, best.i)} ${quoi} : le meilleur ordre de ce joueur, il pare ${best.v.toFixed(2).replace('.', ',')} menace en moyenne sur ${S} ordres d'exécution tirés.`;
    }
    for (const j of libres) {
      const r = seRapprocher(p, pl, e, prog, j);
      if (r) { prog[r.i] = r.o; raisons[j] = r.raison + ' Aucune garde ni sabotage ne parait rien ce tour-ci.'; }
      else raisons[j] = 'Aucun ordre utile ce tour-ci.';
    }
    return raisons;
  }

  // Prévoyant : compare quelques programmes complets (réflexe, glouton, et des variantes où un joueur se place au
  // lieu de parer) en jouant le tour puis H tours de plus au réflexe, sur les mêmes tirages ; garde le meilleur.
  function prevoyant(p, pl, e, annonces, prog, joueurs, rng, R, H) {
    R = R || 24; H = H === undefined ? 2 : H;
    const base = prog.slice();
    const cands = [];
    const ajoute = (pr, raisons, nom) => { if (!cands.some((c) => c.pr.every((o, i) => o[0] === pr[i][0] && o[1] === pr[i][1]))) cands.push({ pr, raisons, nom }); };
    const p1 = base.slice(); ajoute(p1, reflexe(p, pl, e, annonces, p1, joueurs), 'réflexe');
    const p2 = base.slice(); const r2 = stratege(p, pl, e, annonces, p2, joueurs, rng, 12); ajoute(p2, r2, 'glouton');
    for (const j of joueurs) {
      const v = p2.slice(); const raisons = Object.assign({}, r2);
      for (const i of individusDe(p, j)) v[i] = base[i];
      const r = seRapprocher(p, pl, e, v, j);
      if (!r) continue;
      v[r.i] = r.o; raisons[j] = r.raison; ajoute(v, raisons, 'placement');
    }
    const graines = []; for (let k = 0; k < R; k++) graines.push(1 + rng.entier(2147483646));
    const execs = []; for (let k = 0; k < R; k++) execs.push(K.tirerExecution(p, rng));
    const tous = Array.from({ length: p.J }, (_, j) => j);
    for (const c of cands) {
      let tot = 0, immediat = 0;
      for (let k = 0; k < R; k++) {
        const f = K.copie(e);
        const x = K.parades(K.jouerTour(p, pl, f, annonces, c.pr, execs[k])); tot += x; immediat += x;
        const rr = K.generateur(graines[k]);
        for (let h = 0; h < H && f.tour < p.tours; h++) {
          const ann = K.tirerAnnonces(p, rr); const ex = K.tirerExecution(p, rr);
          const pr = Array.from({ length: p.I }, () => [RIEN, null]);
          reflexe(p, pl, f, ann, pr, tous);
          tot += K.parades(K.jouerTour(p, pl, f, ann, pr, ex));
        }
      }
      c.v = tot / R; c.imm = immediat / R;
    }
    cands.sort((a, b) => b.v - a.v);
    const best = cands[0];
    best.pr.forEach((o, i) => { prog[i] = o; });
    const f2 = (x) => x.toFixed(2).replace('.', ',');
    const refl = cands.find((c) => c.nom === 'réflexe');
    const raisons = {};
    for (const j of joueurs) raisons[j] = (best.raisons[j] || '') + ` [Programme ${best.nom} retenu parmi ${cands.length} : ${f2(best.v)} parades attendues sur ce tour et les ${H} suivants${refl && refl !== best ? `, contre ${f2(refl.v)} pour le réflexe` : ''}.]`;
    return raisons;
  }

  function hasard(p, pl, e, annonces, prog, joueurs, rng) {
    const raisons = {};
    for (const j of joueurs) {
      const i = rng.choix(individusDe(p, j));
      const o = rng.choix(K.ordresPossibles(p, pl, e, i).filter((x) => x[0] !== RIEN));
      prog[i] = o; raisons[j] = `${nomInd(p, i)} : ordre tiré au hasard (${o[0]}).`;
    }
    return raisons;
  }

  const BOTS = {
    reflexe: { nom: 'Réflexe', decrit: 'garde là où ça frappe, sabote la Machine annoncée, sinon se rapproche', jouer: reflexe },
    prevoyant: { nom: 'Prévoyant', decrit: 'compare quelques programmes en jouant ce tour et les deux suivants', jouer: prevoyant },
    stratege: { nom: 'Glouton', decrit: 'le meilleur ordre pour ce tour seulement, puis se place', jouer: stratege },
    hasard: { nom: 'Hasard', decrit: 'un ordre permis au hasard (témoin)', jouer: hasard },
  };

  // une partie entière jouée par un bot à tous les sièges (séries de la page) ; mêmes tirages du jeu pour tous les
  // bots à graine égale (comparaisons appariées)
  function partieAuto(reglages, bot) {
    const p = K.params(reglages); const pl = K.plateau(p);
    const rng = K.generateur(p.graine); const rb = K.generateur(p.graine * 7919 + 17);
    const e = K.miseEnPlace(p, pl, rng);
    e.individus = K.placementHeuristique(p, pl, e);
    const parJoueur = new Array(p.J).fill(0); let S = 0, hors = 0;
    for (let t = 0; t < p.tours; t++) {
      const ann = K.tirerAnnonces(p, rng); const ex = K.tirerExecution(p, rng);
      const prog = Array.from({ length: p.I }, () => [RIEN, null]);
      BOTS[bot].jouer(p, pl, e, ann, prog, Array.from({ length: p.J }, (_, j) => j), rb);
      for (const v of K.jouerTour(p, pl, e, ann, prog, ex)) {
        if (v.issue === 'abattu') continue;
        S++; const j = K.proprietaire(p, v.qui); parJoueur[j]++;
        if (pl.tuile[v.lieu] !== j) hors++;
      }
    }
    return { taux: S / (p.k * p.tours), foret: K.foret(e) / p.c0, agence: parJoueur.filter((x) => x > 0).length / p.J,
      couplage: S ? hors / S : 0, parades: S };
  }

  const API = { BOTS, nomCase, nomInd, cibles, individusDe, valeur, partieAuto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.KITBOTS = API;
})(typeof window !== 'undefined' ? window : globalThis);
