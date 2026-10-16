/* Bots de « Couronne aux deux pistes », siège par siège. Ils ne voient pas les dés : ils lisent les deux pistes (ce que
   voient les joueurs) et, avec le présage, les dés de la première vague. Chaque bot décide pour les joueurs qu'on lui
   confie, après les humains et en voyant leurs cartes (une équipe bien coordonnée), et explique ses choix (`raison`).
   - Réflexe : à chaque étape, garde la case la plus menacée ou sabote la Machine la plus probable, depuis la position
     prévue ; il ne tient pas compte de ce que la première vague va changer.
   - Glouton : essaie toutes les paires de cartes de chaque joueur et garde celle qui pare le plus sur des tirages des
     pistes (le tour complet est simulé, apprentissage compris).
   - Prévoyant : compare quelques programmes (réflexe, glouton, variantes où un joueur se place) en jouant ce tour et le
     suivant, sur les mêmes tirages ; garde le meilleur.
   - Hasard : des cartes permises au hasard (témoin). */
(function (G) {
  'use strict';
  const K = (typeof module !== 'undefined' && module.exports) ? require('./moteur.js') : G.PISTES;
  const { RIEN, GARDER, ALLER, SABOTER, NOMS_TACTIQUES, MACHINES } = K;

  function nomCase(p, pl, c) {
    if (c === 0) return 'Cœur';
    return 'ABCDEF'[pl.tuile[c]] + (pl.rang[c] * p.l + pl.col[c] + 1);
  }
  const nomInd = (p, i) => 'J' + (K.proprietaire(p, i) + 1) + String.fromCharCode(97 + (i % p.ipj));
  const nomM = (m) => MACHINES[m].nom;
  const pc = (x) => Math.round(100 * x) + ' %';
  const f2 = (x) => x.toFixed(2).replace('.', ',');
  const individusDe = (p, j) => { const out = []; for (let i = 0; i < p.I; i++) if (K.proprietaire(p, i) === j) out.push(i); return out; };

  function ordreTexte(p, pl, o) {
    if (!o || o[0] === RIEN) return 'rien';
    if (o[0] === GARDER) return 'garde ' + nomCase(p, pl, o[1]);
    if (o[0] === ALLER) return 'va en ' + nomCase(p, pl, o[1]);
    return 'sabote ' + nomM(o[1]);
  }

  function queueBinomiale(n, q, r) {               // P(X ≥ r), X ~ Bin(n, q)
    if (r <= 0) return 1;
    let s = 0, c = 1;
    for (let x = 0; x <= n; x++) { if (x >= r) s += c * Math.pow(q, x) * Math.pow(1 - q, n - x); c = c * (n - x) / (x + 1); }
    return s;
  }

  // tirages des pistes pour évaluer un programme ; avec le présage, les dés de la vague 1 sont connus
  function echantillons(p, rng, S, ctx) {
    const out = [];
    for (let s = 0; s < S; s++) {
      const t = K.tirerTour(p, rng);
      if (ctx && ctx.connus) t[0].forEach((l, k) => { l.d = ctx.connus[k].slice(); });
      out.push(t);
    }
    return out;
  }
  function valeur(p, pl, e, cartes, echant) {
    let tot = 0;
    for (const t of echant) { const f = K.copie(e); tot += K.paradesEtapes(K.jouerTour(p, pl, f, cartes, t)); }
    return tot / echant.length;
  }
  const copieCartes = (cartes) => cartes.map((cs) => cs.slice());

  // ------------------------------------------------------------ Réflexe
  // menace d'une étape vue depuis les positions prévues : par case (lancers qui y frappent) et par Machine (appels)
  function lectureEtape(p, pl, e, pos, v, ctx) {
    const f = K.copie(e); f.individus = pos.slice();
    if (v === 0 && ctx && ctx.connus) {           // présage : les dés de la vague 1 sont connus
      const hc = {}, hm = {};
      for (const d of ctx.connus) {
        const L = K.lire(f, d);
        hm[L.machine] = (hm[L.machine] || 0) + 1;
        if (f.machines[L.machine] >= 0) { const c = K.destination(p, pl, f, L.machine, L.tactique)[0]; hc[c] = (hc[c] || 0) + 1; }
      }
      return { garde: (c, deja) => ((hc[c] || 0) > deja ? 1 : 0), sabot: (m, deja) => ((hm[m] || 0) > deja ? 1 : 0),
        pr: K.menaceParCase(p, pl, f), certain: true };
    }
    const pr = K.menaceParCase(p, pl, f); const prof = K.profils(f);
    return { garde: (c, deja) => queueBinomiale(p.L, pr[c], deja + 1), sabot: (m, deja) => queueBinomiale(p.L, prof[m].chances / 36, deja + 1),
      pr, certain: false };
  }

  function reflexe(p, pl, e, cartes, joueurs, rng, ctx) {
    const raisons = {};
    for (const j of joueurs) {
      const morceaux = [];
      for (let v = 0; v < p.E; v++) {
        const pos = K.positionsPrevues(p, e, cartes, v);
        const lu = lectureEtape(p, pl, e, pos, v, ctx);
        const gardes = {}, sabs = {};
        cartes.forEach((cs) => { const c = cs[v]; if (!c) return; if (c.o[0] === GARDER) gardes[c.o[1]] = (gardes[c.o[1]] || 0) + 1; if (c.o[0] === SABOTER) sabs[c.o[1]] = (sabs[c.o[1]] || 0) + 1; });
        let best = null;
        for (const i of individusDe(p, j)) {
          const c = pos[i];
          const vg = lu.garde(c, gardes[c] || 0);
          if (!best || vg > best.v + 1e-9) best = { v: vg, i, o: [GARDER, c] };
          e.machines.forEach((m, k) => {
            if (m !== c) return;
            const vs = lu.sabot(k, sabs[k] || 0) + 0.001;
            if (vs > best.v + 1e-9) best = { v: vs, i, o: [SABOTER, k] };
          });
        }
        const etq = p.E > 1 ? `Étape ${v + 1} : ` : '';
        if (best && best.v >= 0.2) {
          cartes[j][v] = { i: best.i, o: best.o };
          const pourquoi = lu.certain ? 'le présage montre qu\'une menace y arrivera'
            : (best.o[0] === GARDER ? `${pc(best.v)} de chances qu'au moins une menace de la vague frappe là` : `${pc(best.v)} de chances que cette Machine agisse dans la vague`);
          morceaux.push(`${etq}${nomInd(p, best.i)} ${ordreTexte(p, pl, best.o)} (${pourquoi}).`);
          continue;
        }
        // rien d'assez menacé : se placer sur la case voisine la plus menacée, non tenue
        const tenues = new Set(pos);
        let mv = null;
        for (const i of individusDe(p, j)) for (const c of pl.voisins[pos[i]]) {
          if (tenues.has(c)) continue;
          const gain = lu.pr[c] - lu.pr[pos[i]];
          if (gain > 0.02 && (!mv || gain > mv.g)) mv = { g: gain, i, c };
        }
        if (mv) { cartes[j][v] = { i: mv.i, o: [ALLER, mv.c] }; morceaux.push(`${etq}${nomInd(p, mv.i)} va en ${nomCase(p, pl, mv.c)}, plus menacée (${pc(lu.pr[mv.c])} par lancer) : il s'y place.`); }
        else morceaux.push(`${etq}aucun ordre utile.`);
      }
      raisons[j] = morceaux.join(' ');
    }
    return raisons;
  }

  // ------------------------------------------------------------ Glouton
  function optionsCartes(p, pl, e, cartes, j, v) {
    const pos = K.positionsPrevues(p, e, cartes, v);
    const out = [null];
    for (const i of individusDe(p, j)) for (const o of K.ordresPossibles(p, pl, e, i, pos[i])) out.push({ i, o });
    return out;
  }
  function decrireCartes(p, pl, cs) {
    return cs.map((c, v) => `${p.E > 1 ? `étape ${v + 1}, ` : ''}${c ? nomInd(p, c.i) + ' ' + ordreTexte(p, pl, c.o) : 'rien'}`).join(' ; ');
  }

  function stratege(p, pl, e, cartes, joueurs, rng, ctx, S) {
    S = S || 10;
    const raisons = {};
    const echant = echantillons(p, rng, S, ctx);
    for (const j of joueurs) {
      let best = null;
      const essai = copieCartes(cartes);
      const parcourir = (v) => {
        if (v === p.E) {
          const val = valeur(p, pl, e, essai, echant) - 0.001 * essai[j].filter((c) => c).length;
          if (!best || val > best.v + 1e-9) best = { v: val, cs: essai[j].slice() };
          return;
        }
        for (const c of optionsCartes(p, pl, e, essai, j, v)) { essai[j][v] = c; parcourir(v + 1); }
        essai[j][v] = null;
      };
      parcourir(0);
      cartes[j] = best.cs;
      raisons[j] = `${decrireCartes(p, pl, best.cs)} : la meilleure paire de cartes de ce joueur, ${f2(best.v + 0.001 * best.cs.filter((c) => c).length)} parade(s) attendue(s) sur ${S} tirages des pistes, ses partenaires étant fixés.`;
    }
    return raisons;
  }

  // ------------------------------------------------------------ Prévoyant
  function prevoyant(p, pl, e, cartes, joueurs, rng, ctx, R, H) {
    R = R || 12; H = H === undefined ? 1 : H;
    const base = copieCartes(cartes);
    const cands = [];
    const meme = (a, b) => a.every((cs, j) => cs.every((c, v) => (c === null && b[j][v] === null) || (c && b[j][v] && c.i === b[j][v].i && c.o[0] === b[j][v].o[0] && c.o[1] === b[j][v].o[1])));
    const ajoute = (cs, raisons, nom) => { if (!cands.some((x) => meme(x.cs, cs))) cands.push({ cs, raisons, nom }); };
    const c1 = copieCartes(base); ajoute(c1, reflexe(p, pl, e, c1, joueurs, rng, ctx), 'réflexe');
    const c2 = copieCartes(base); const r2 = stratege(p, pl, e, c2, joueurs, rng, ctx, 8); ajoute(c2, r2, 'glouton');
    // variantes : un joueur remplace sa dernière carte par un pas vers la case la plus menacée (se placer)
    for (const j of joueurs) {
      const v = p.E - 1;
      const cs = copieCartes(c2);
      const pos = K.positionsPrevues(p, e, cs, v);
      const f = K.copie(e); f.individus = pos; const pr = K.menaceParCase(p, pl, f);
      let mv = null;
      for (const i of individusDe(p, j)) for (const c of pl.voisins[pos[i]]) if (!pos.includes(c) && (!mv || pr[c] > mv.g)) mv = { g: pr[c], i, c };
      if (!mv) continue;
      cs[j][v] = { i: mv.i, o: [ALLER, mv.c] };
      const raisons = Object.assign({}, r2);
      raisons[j] = `${decrireCartes(p, pl, cs[j])} : se placer en ${nomCase(p, pl, mv.c)} pour le tour suivant.`;
      ajoute(cs, raisons, 'placement');
    }
    const ech = echantillons(p, rng, R, ctx);
    const suites = []; for (let k = 0; k < R; k++) suites.push(K.tirerTour(p, rng));
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
    cands.sort((a, b) => b.v - a.v);
    const best = cands[0];
    best.cs.forEach((cs, j) => { cartes[j] = cs.slice(); });
    const refl = cands.find((x) => x.nom === 'réflexe');
    const raisons = {};
    for (const j of joueurs) raisons[j] = (best.raisons[j] || decrireCartes(p, pl, best.cs[j])) + ` [Programme ${best.nom} retenu parmi ${cands.length} : ${f2(best.v)} parades attendues sur ce tour et le suivant${refl && refl !== best ? `, contre ${f2(refl.v)} pour le réflexe` : ''}.]`;
    return raisons;
  }

  // ------------------------------------------------------------ Hasard
  function hasard(p, pl, e, cartes, joueurs, rng) {
    const raisons = {};
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

  const BOTS = {
    reflexe: { nom: 'Réflexe', decrit: 'garde la case la plus menacée ou sabote la Machine la plus probable, étape par étape', jouer: reflexe },
    prevoyant: { nom: 'Prévoyant', decrit: 'compare quelques programmes en jouant ce tour et le suivant', jouer: prevoyant },
    stratege: { nom: 'Glouton', decrit: 'la meilleure paire de cartes pour ce tour, sur des tirages des pistes', jouer: stratege },
    hasard: { nom: 'Hasard', decrit: 'des cartes permises au hasard (témoin)', jouer: hasard },
  };

  // une partie entière jouée par un bot à tous les sièges (séries de la page) ; mêmes tirages du jeu pour tous les bots
  // à graine égale (comparaisons appariées)
  function partieAuto(reglages, bot) {
    const { p, pl, e, tirages } = K.nouvellePartie(reglages);
    const rb = K.generateur(p.graine * 7919 + 17);
    const parJoueur = new Array(p.J).fill(0); let S = 0, hors = 0, perdus = 0;
    const tous = Array.from({ length: p.J }, (_, j) => j);
    for (let t = 0; t < p.tours; t++) {
      const cartes = K.cartesVides(p);
      const ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice()) } : null;
      BOTS[bot].jouer(p, pl, e, cartes, tous, rb, ctx);
      for (const et of K.jouerTour(p, pl, e, cartes, tirages[t])) {
        perdus += et.perdus.length;
        for (const v of et.evts) {
          if (v.issue === 'abattu') continue;
          S++; const j = K.proprietaire(p, v.qui); parJoueur[j]++;
          if (pl.tuile[v.lieu] !== j) hors++;
        }
      }
    }
    return { taux: S / (p.ordresParTour * p.tours), foret: K.foret(e) / p.c0, agence: parJoueur.filter((x) => x > 0).length / p.J,
      couplage: S ? hors / S : 0, parades: S, perdus };
  }

  const API = { BOTS, nomCase, nomInd, nomM, ordreTexte, individusDe, valeur, echantillons, lectureEtape, queueBinomiale, partieAuto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.PISTESBOTS = API;
})(typeof window !== 'undefined' ? window : globalThis);
