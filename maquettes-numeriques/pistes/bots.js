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

  // tirages des pistes pour évaluer un programme ; avec le présage ou les indices croisés 1B, la vague 1 est contrainte
  function echantillons(p, rng, S, ctx) {
    const out = [];
    for (let s = 0; s < S; s++) {
      const t = K.tirerTour(p, rng);
      if (ctx && ctx.connus) {
        t[0].forEach((l, k) => { l.d = ctx.connus[k].slice(); });
      } else if (ctx && ctx.indices1B && ctx.e) {
        const { vague0, reveles, jObs } = ctx.indices1B;
        const etats = K.etatAttaques1B(p, ctx.pl, ctx.e, vague0, reveles, jObs);
        t[0].forEach((l, k) => {
          const st = etats[k];
          if (!st) return;
          if (st.connaisM && st.connaisT) {
            l.d = st.d.slice();
            l.t = st.t; l.c = st.c;
          } else if (st.connaisM) {
            // Tirer un dé compatible avec l'écart connu de la Machine
            const cands = K.ISSUES.filter((d) => Math.abs(d[0] - d[1]) === st.ecart);
            if (cands.length) l.d = rng.choix(cands).slice();
          } else if (st.connaisT) {
            // Tirer un dé compatible avec la tactique connue
            const cands = K.ISSUES.filter((d) => K.tactiqueEn(ctx.e, d[0] + d[1]) === st.tactique);
            if (cands.length) l.d = rng.choix(cands).slice();
          }
        });
      }
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
    if (v === 0 && ctx && ctx.indices1B) {        // Mécanique 1B : indices croisés publics + secret du joueur jObs
      const mv = K.menaceVague1B(p, pl, f, ctx.indices1B.vague0, ctx.indices1B.reveles, ctx.indices1B.jObs);
      return {
        garde: (c, deja) => (deja === 0 ? mv.probCaseAuMoins1[c] : Math.max(0, mv.espCase[c] - deja)),
        sabot: (m, deja) => (deja === 0 ? mv.probMachineAuMoins1[m] : Math.max(0, mv.espMachine[m] - deja)),
        pr: mv.espCase.map((x) => x / p.L),
        probVagueCase: mv.probCaseAuMoins1,
        certain: false,
        indices1B: true
      };
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
        if (mv) { cartes[j][v] = { i: mv.i, o: [ALLER, mv.c] }; morceaux.push(`${etq}${nomInd(p, mv.i)} va en ${nomCase(p, pl, mv.c)}, plus menacée (${pc(lu.pr[mv.c])} par lancer) : il s'y place.`); continue; }
        // sinon se rapprocher du Cœur ou garder sa case plutôt que de passer
        let rap = null;
        for (const i of individusDe(p, j)) for (const c of pl.voisins[pos[i]]) {
          if (tenues.has(c)) continue;
          const d0 = pl.dist[0][pos[i]] - pl.dist[0][c];
          if (d0 > 0 && (!rap || lu.pr[c] > rap.p)) rap = { p: lu.pr[c], i, c };
        }
        if (rap && (!best || best.v < 0.05)) {
          cartes[j][v] = { i: rap.i, o: [ALLER, rap.c] };
          morceaux.push(`${etq}${nomInd(p, rap.i)} va en ${nomCase(p, pl, rap.c)} (se rapproche du Cœur).`);
        } else if (best) {
          cartes[j][v] = { i: best.i, o: best.o };
          morceaux.push(`${etq}${nomInd(p, best.i)} ${ordreTexte(p, pl, best.o)} (garde préventive, ${pc(best.v)}).`);
        } else morceaux.push(`${etq}aucun ordre utile.`);
      }
      raisons[j] = morceaux.join(' ');
    }
    return raisons;
  }

  // ------------------------------------------------------------ Glouton
  function optionsCartes(p, pl, e, cartes, j, v) {
    const pos = K.positionsPrevues(p, e, cartes, v);
    const out = [];
    for (const i of individusDe(p, j)) for (const o of K.ordresPossibles(p, pl, e, i, pos[i])) out.push({ i, o });
    if (!out.length) out.push(null);
    return out;
  }
  function decrireCartes(p, pl, cs) {
    return cs.map((c, v) => `${p.E > 1 ? `étape ${v + 1}, ` : ''}${c ? nomInd(p, c.i) + ' ' + ordreTexte(p, pl, c.o) : 'rien'}`).join(' ; ');
  }

  function stratege(p, pl, e, cartes, joueurs, rng, ctx, S) {
    S = S || 10;
    const raisons = {};
    const echant = echantillons(p, rng, S, ctx);
    const pr0 = K.menaceParCase(p, pl, e), prof0 = K.profils(e);
    for (const j of joueurs) {
      let best = null;
      const essai = copieCartes(cartes);
      const bonusTie = (cs) => {
        let b = 0;
        for (let v = 0; v < cs.length; v++) {
          const c = cs[v]; if (!c) continue;
          if (c.o[0] === GARDER) b += 0.001 * (1 + pr0[c.o[1]]);
          else if (c.o[0] === SABOTER) b += 0.001 * (1 + (prof0[c.o[1]].chances / 36));
          else if (c.o[0] === ALLER) b += 0.0005 * (1 + pr0[c.o[1]] + 0.1 / (1 + pl.dist[0][c.o[1]]));
        }
        return b;
      };
      const parcourir = (v) => {
        if (v === p.E) {
          const raw = valeur(p, pl, e, essai, echant);
          const val = raw + bonusTie(essai[j]);
          if (!best || val > best.v + 1e-9) best = { v: val, raw, cs: essai[j].slice() };
          return;
        }
        for (const c of optionsCartes(p, pl, e, essai, j, v)) { essai[j][v] = c; parcourir(v + 1); }
        essai[j][v] = null;
      };
      parcourir(0);
      cartes[j] = best.cs;
      raisons[j] = `${decrireCartes(p, pl, best.cs)} : la meilleure paire de cartes de ce joueur, ${f2(best.raw)} parade(s) attendue(s) sur ${S} tirages des pistes, ses partenaires étant fixés.`;
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

  // ------------------------------------------------------------ Choix de l'indice à révéler en Mécanique 1B
  // Le joueur j détient :
  //   - Indice 0 : la Machine de l'Attaque j (sur la piste des Machines)
  //   - Indice 1 : la Tactique de l'Attaque (j + 1) % J (sur la piste des Pensées)
  function choisirRevelation1B(p, pl, e, vague0, j, botType, rng) {
    const info = K.indicesTour1B(p, e, vague0);
    const indM = info.mains[j][0];
    const indT = info.mains[j][1];
    if (botType === 'hasard' && rng) {
      const ch = rng.entier(2);
      return {
        choix: ch,
        raison: ch === 0
          ? `Révèle au hasard la Machine de l'Attaque ${indM.attCode} (${nomM(indM.machine)}).`
          : `Révèle au hasard la Tactique de l'Attaque ${indT.attCode} (${NOMS_TACTIQUES[indT.tactique]}).`,
        conseil0: '',
        conseil1: ''
      };
    }

    const mesInds = individusDe(p, j);
    const mesCases = new Set(mesInds.map((i) => e.individus[i]));
    const posM = e.machines[indM.machine];
    const mSurMonPion = posM >= 0 && mesCases.has(posM);
    const mSurMaTuile = posM >= 0 && pl.tuile[posM] === j;
    const mChezAllie = posM >= 0 && pl.tuile[posM] !== j;

    // Probabilité a priori de cette Machine et de cette Tactique sur les pistes publiques
    const probM = indM.chances / 36;
    let chancesTacTot = 0;
    for (let s = 2; s <= 12; s++) if (K.tactiqueEn(e, s) === indT.tactique) chancesTacTot += K.CHANCES_SOMME(s);
    const probT = chancesTacTot / 36;

    // Score d'intérêt coopératif pour révéler la Machine (0) vs la Tactique (1)
    const surpriseM = 1 - probM;
    const surpriseT = 1 - probT;
    let scoreM = surpriseM + (mChezAllie ? 0.55 : 0) - (mSurMonPion ? 0.65 : 0);
    let scoreT = surpriseT + 0.25 + (mSurMonPion ? 0.45 : 0);

    const voisinT = ((j + 1) % p.J) + 1;
    const lieuM = posM >= 0 ? `en ${nomCase(p, pl, posM)} (Tuile J${pl.tuile[posM] + 1})` : 'au Chantier';

    const conseil0 = mSurMonPion
      ? `Tu as déjà un pion sur la case de ${nomM(indM.machine)} (${lieuM}) : tu peux la gérer toi-même en la gardant secrète.`
      : (mChezAllie
        ? `${nomM(indM.machine)} est chez un coéquipier (${lieuM}) : la révéler l'alerte directement !`
        : `${nomM(indM.machine)} est sur ta tuile (${lieuM}, probabilité piste ${indM.chances}/36).`);

    const conseil1 = `Révéler ${NOMS_TACTIQUES[indT.tactique]} sur l'Attaque ${indT.attCode} permet au Joueur ${voisinT} (qui connaît la Machine ${indT.attCode}) de connaître à 100 % la cible exacte de l'Attaque ${indT.attCode} !`;

    const choix = scoreM >= scoreT ? 0 : 1;
    let raison;
    if (choix === 0) {
      raison = `Révèle la Machine de l'Attaque ${indM.attCode} (${nomM(indM.machine)}, ${lieuM}) : `
        + (mChezAllie ? `elle menace directement la tuile d'un allié` : `indice plus rare sur la piste (${indM.chances}/36)`)
        + ` — et garde en secret la Tactique de l'Attaque ${indT.attCode} (${NOMS_TACTIQUES[indT.tactique]}).`;
    } else {
      raison = `Révèle la Tactique de l'Attaque ${indT.attCode} (${NOMS_TACTIQUES[indT.tactique]}) pour compléter le puzzle du Joueur ${voisinT}`
        + (mSurMonPion ? ` (car J${j + 1} a déjà un pion sur ${nomM(indM.machine)} pour la gérer en secret)` : ` (${NOMS_TACTIQUES[indT.tactique]} vaut ${chancesTacTot}/36 sur la piste)`)
        + ` — et garde en secret la Machine de l'Attaque ${indM.attCode} (${nomM(indM.machine)}).`;
    }

    return { choix, raison, scoreM, scoreT, conseil0, conseil1 };
  }

  // une partie entière jouée par un bot à tous les sièges (séries de la page) ; mêmes tirages du jeu pour tous les bots
  // à graine égale (comparaisons appariées)
  function partieAuto(reglages, bot) {
    const { p, pl, e, tirages } = K.nouvellePartie(reglages);
    const rb = K.generateur(p.graine * 7919 + 17);
    const parJoueur = new Array(p.J).fill(0); let S = 0, hors = 0, perdus = 0;
    const tous = Array.from({ length: p.J }, (_, j) => j);
    for (let t = 0; t < p.tours; t++) {
      const cartes = K.cartesVides(p);
      let ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice()) } : null;
      if (reglages && reglages.comm1B && !p.presage) {
        const reveles = tous.map((j) => choisirRevelation1B(p, pl, e, tirages[t][0], j, bot, rb).choix);
        for (const j of tous) {
          const ctxJ = { e, pl, indices1B: { vague0: tirages[t][0], reveles, jObs: j } };
          BOTS[bot].jouer(p, pl, e, cartes, [j], rb, ctxJ);
        }
      } else {
        BOTS[bot].jouer(p, pl, e, cartes, tous, rb, ctx);
      }
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

  const API = { BOTS, nomCase, nomInd, nomM, ordreTexte, individusDe, valeur, echantillons, lectureEtape, queueBinomiale, choisirRevelation1B, partieAuto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.PISTESBOTS = API;
})(typeof window !== 'undefined' ? window : globalThis);
