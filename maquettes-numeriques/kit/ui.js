/* Page « Forêt en couronne » : préparation, partie pas à pas (humains et bots), séries de bots, parties
   enregistrées dans la base de l'artefact. L'état d'une partie est un objet JSON simple (S), rejouable. */
(function () {
  'use strict';
  const K = window.KIT, B = window.KITBOTS;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (x) => (100 * x).toFixed(0) + ' %';
  const f1 = (x) => x.toFixed(1).replace('.', ',');
  const COUL = (j) => `var(--j${j + 1})`;
  const SIEGES = { humain: 'Humain', prevoyant: 'Bot prévoyant', reflexe: 'Bot réflexe', stratege: 'Bot glouton', hasard: 'Bot hasard' };
  const NT = K.NOMS_TACTIQUES;

  let cfg = { reglages: Object.assign({}, K.DEFAUTS, { graine: 1 + Math.floor(Math.random() * 99999) }),
    sieges: ['humain', 'prevoyant', 'prevoyant', 'prevoyant', 'prevoyant', 'prevoyant'] };
  try { const m = JSON.parse(localStorage.getItem('kit-cfg') || 'null'); if (m && m.reglages && m.sieges) cfg = m; } catch (e) { /* stockage indisponible */ }
  const garderCfg = () => { try { localStorage.setItem('kit-cfg', JSON.stringify(cfg)); } catch (e) { /* rien */ } };

  let S = null;                 // la partie en cours
  let P = null, PL = null;      // réglages calculés et plateau
  const UI = { db: null, dl: null, sel: null, index: [], geo: null, serie: null };

  // ------------------------------------------------------------------ outils
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600); }
  const nomC = (c) => B.nomCase(P, PL, c);
  const nomI = (i) => B.nomInd(P, i);
  const tour = () => S.e.tour;
  function ordreTexte(o) {
    if (!o || o[0] === K.RIEN) return 'aucun ordre';
    if (o[0] === K.GARDER) return 'garde ' + nomC(o[1]);
    if (o[0] === K.ALLER) return 'va en ' + nomC(o[1]);
    return 'sabote M' + (o[1] + 1);
  }
  function ordreDuJoueur(j) {
    const i = S.prog.findIndex((o, k) => o[0] !== K.RIEN && K.proprietaire(P, k) === j);
    return i < 0 ? null : { i, o: S.prog[i] };
  }
  function log(k, txt, why, tag) { S.journal.push({ k, txt, why: why || '', tag: tag || '' }); }

  // ------------------------------------------------------------------ géométrie de la couronne
  const CX = 320, CY = 320, RH = 54, R0 = 54, R1 = 286;
  function geometrie(p, pl) {
    const A = 2 * Math.PI / p.J, a0 = -Math.PI / 2 - A / 2, w = (R1 - R0) / p.q;
    const pt = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    const cells = [{ c: 0, path: null, cx: CX, cy: CY, r: RH, tan: [1, 0], rad: [0, 1] }];
    for (let c = 1; c < pl.N; c++) {
      const t = pl.tuile[c], r = pl.rang[c], k = pl.col[c];
      const ga = a0 + t * A + k * A / p.l, gb = ga + A / p.l, ra = R0 + r * w, rb = ra + w;
      const [x1, y1] = pt(ra, ga), [x2, y2] = pt(rb, ga), [x3, y3] = pt(rb, gb), [x4, y4] = pt(ra, gb);
      const big = (gb - ga) > Math.PI ? 1 : 0;
      const path = `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${rb},${rb} 0 ${big} 1 ${x3.toFixed(1)},${y3.toFixed(1)} L${x4.toFixed(1)},${y4.toFixed(1)} A${ra},${ra} 0 ${big} 0 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
      const am = (ga + gb) / 2, rm = (ra + rb) / 2;
      const [cx, cy] = pt(rm, am);
      const [nx, ny] = pt(rb - 9, am), [lx, ly] = pt(ra + 8, am);
      cells.push({ c, path, cx, cy, nx, ny, lx, ly, tan: [-Math.sin(am), Math.cos(am)], rad: [Math.cos(am), Math.sin(am)], arc: rm * (gb - ga), w });
    }
    const seps = [];
    for (let t = 0; t < p.J; t++) { const a = a0 + t * A; const [x1, y1] = pt(R0 - 4, a), [x2, y2] = pt(R1 + 4, a); seps.push([x1, y1, x2, y2]); }
    const noms = [];
    for (let t = 0; t < p.J; t++) { const [x, y] = pt(R1 + 18, a0 + (t + 0.5) * A); noms.push([x, y]); }
    return { cells, seps, noms };
  }

  // position des pions dans une case : Machines puis individus, en rang le long de la couronne
  function positions(e) {
    const par = {};
    e.machines.forEach((c, j) => { (par[c] = par[c] || []).push('m' + j); });
    e.individus.forEach((c, i) => { (par[c] = par[c] || []).push('i' + i); });
    const pos = {};
    for (const c in par) {
      const g = UI.geo.cells[c]; const ids = par[c]; const n = ids.length;
      const parRang = c == 0 ? 4 : Math.max(1, Math.min(4, Math.floor((g.arc - 4) / 21)));
      ids.forEach((id, k) => {
        const rang = Math.floor(k / parRang), col = k % parRang, dansRang = Math.min(parRang, n - rang * parRang);
        const off = (col - (dansRang - 1) / 2) * 21, offR = (rang - (Math.ceil(n / parRang) - 1) / 2) * 19;
        pos[id] = [g.cx + g.tan[0] * off + g.rad[0] * offR, g.cy + g.tan[1] * off + g.rad[1] * offR];
      });
    }
    return pos;
  }

  function construirePlateau(p, pl) {
    UI.geo = geometrie(p, pl);
    const g = UI.geo; const svg = $('plateau');
    let h = '<defs><marker id="tete" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--danger)"/></marker>'
      + '<marker id="teteV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker></defs><g id="gCells">';
    h += `<circle id="cell0" class="cell a3" cx="${CX}" cy="${CY}" r="${RH}" data-c="0"/>`;
    for (const x of g.cells.slice(1)) h += `<path id="cell${x.c}" class="cell" d="${x.path}" data-c="${x.c}"/>`;
    h += '</g><g id="gSeps">';
    for (const [x1, y1, x2, y2] of g.seps) h += `<line class="tile-sep" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    g.noms.forEach(([x, y], t) => { h += `<text class="tile-name" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${COUL(t)}">Joueur ${t + 1}</text>`; });
    h += '</g><g id="gLabels">';
    h += `<text class="cname" x="${CX}" y="${CY - 30}" text-anchor="middle">Cœur</text><text id="nt0" class="ntree" x="${CX}" y="${CY + 38}" text-anchor="middle"></text>`;
    for (const x of g.cells.slice(1)) {
      h += `<text id="nt${x.c}" class="ntree" x="${x.nx.toFixed(1)}" y="${x.ny.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"></text>`;
      if (x.w > 30 && x.arc > 30) h += `<text class="cname" x="${x.lx.toFixed(1)}" y="${x.ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${B.nomCase(p, pl, x.c)}</text>`;
    }
    h += '</g><g id="gFleches"></g><g id="gToks"></g>';
    svg.innerHTML = h;
    $('gCells').addEventListener('click', (ev) => { const c = ev.target.getAttribute && ev.target.getAttribute('data-c'); if (c !== null && c !== undefined) clicCase(+c); });
    $('gToks').addEventListener('click', (ev) => { const t = ev.target.closest && ev.target.closest('[data-i]'); if (t) clicIndividu(+t.getAttribute('data-i')); });
    UI.tokBuilt = false;
  }

  function dessinerPlateau(e, opts) {
    opts = opts || {};
    for (let c = 0; c < PL.N; c++) {
      const el = $('cell' + c); if (!el) continue;
      el.setAttribute('class', 'cell a' + Math.min(5, e.arbres[c]) + (opts.cand && opts.cand.has(c) ? ' cand' : '') + (opts.cible === c ? ' cible' : '') + (opts.pare === c ? ' pare' : ''));
      $('nt' + c).textContent = e.arbres[c];
    }
    // flèches : menaces annoncées (vers la case visée sur la forêt du moment), déplacements ordonnés
    let fl = '';
    const fleche = (a, b, cls) => {
      const ga = UI.geo.cells[a], gb = UI.geo.cells[b];
      if (a === b) return `<circle class="fleche ${cls}" cx="${ga.cx.toFixed(1)}" cy="${ga.cy.toFixed(1)}" r="14"/>`;
      const mx = (ga.cx + gb.cx) / 2 + (CX - (ga.cx + gb.cx) / 2) * 0.12, my = (ga.cy + gb.cy) / 2 + (CY - (ga.cy + gb.cy) / 2) * 0.12;
      return `<path class="fleche ${cls}" d="M${ga.cx.toFixed(1)},${ga.cy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${gb.cx.toFixed(1)},${gb.cy.toFixed(1)}" marker-end="url(#${cls === 'aller' ? 'teteV' : 'tete'})"/>`;
    };
    for (const v of opts.menaces || []) fl += fleche(e.machines[v.m], v.c, '');
    for (const a of opts.allers || []) fl += fleche(a[0], a[1], 'aller');
    $('gFleches').innerHTML = fl;
    // pions (créés une fois, puis déplacés : la transition anime les Machines et les individus)
    const tk = $('gToks');
    if (!UI.tokBuilt) {
      let h = '';
      e.machines.forEach((_, j) => { h += `<g id="m${j}" class="tok mach"><rect x="-11" y="-9" width="22" height="18" rx="4"/><text text-anchor="middle" dominant-baseline="central">M${j + 1}</text></g>`; });
      e.individus.forEach((_, i) => { const pj = K.proprietaire(P, i); h += `<g id="i${i}" class="tok ind" data-i="${i}"><circle r="8.5" fill="${COUL(pj)}"/><text text-anchor="middle" dominant-baseline="central">${String.fromCharCode(97 + (i % P.ipj))}</text></g>`; });
      tk.innerHTML = h; UI.tokBuilt = true;
    }
    const pos = positions(e);
    e.machines.forEach((_, j) => { const g = $('m' + j); const [x, y] = pos['m' + j]; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); g.setAttribute('class', 'tok mach' + (opts.actif === j ? ' actif' : '')); });
    e.individus.forEach((_, i) => {
      const g = $('i' + i); const [x, y] = pos['i' + i]; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      g.setAttribute('class', 'tok ind' + (UI.sel === i ? ' sel' : '') + (opts.cliquables && opts.cliquables.has(i) ? ' cliquable' : ''));
    });
    $('legend').innerHTML = '<span><i style="background:var(--f3)"></i>case boisée (le chiffre : ses arbres)</span><span><i style="background:var(--f0)"></i>case rasée</span>'
      + '<span><i style="background:var(--machine)"></i>Machine</span><span><i style="border:2px dashed var(--danger)"></i>menace annoncée et sa cible</span>'
      + '<span><i style="background:var(--accent)"></i>déplacement ordonné</span>';
  }

  // ------------------------------------------------------------------ préparation
  function apercu() {
    P = K.params(cfg.reglages); PL = K.plateau(P);
    construirePlateau(P, PL);
    const rng = K.generateur(cfg.reglages.graine);
    const e = K.miseEnPlace(P, PL, rng); e.individus = K.placementHeuristique(P, PL, e);
    dessinerPlateau(e);
  }

  function rendrePreparation() {
    const r = cfg.reglages; const J = r.joueurs; const p = K.params(r);
    let h = '<div class="eyebrow">Nouvelle partie</div><h2>Préparer la table</h2>';
    h += '<p class="ctx">Chaque siège est un joueur humain ou un bot. Un humain peut tenir plusieurs sièges : il donne alors un ordre pour chacun, à tour de rôle.</p>';
    h += `<div class="params"><label for="pJ">Joueurs<select id="pJ">${[2, 3, 4, 5, 6].map((x) => `<option ${x === J ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>`;
    h += '<div class="setup" id="seats">';
    for (let j = 0; j < J; j++) {
      h += `<div class="seat"><span class="dot" style="background:${COUL(j)}"></span><span>Joueur ${j + 1}</span><select id="s${j}" aria-label="Joueur ${j + 1}">`
        + Object.entries(SIEGES).map(([k, v]) => `<option value="${k}" ${cfg.sieges[j] === k ? 'selected' : ''}>${v}</option>`).join('') + '</select></div>';
    }
    h += '</div><details><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:800">Réglages du kit</summary><div class="params" style="margin-top:8px">';
    const sel = (id, lab, val, opts) => `<label for="${id}">${lab}<select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    h += sel('pM', 'Machines', r.machinesEnPlus, [[1, 'une par joueur, plus une'], [2, 'une par joueur, plus deux']]);
    h += sel('pQ', 'Menaces par Machine', r.menacesParMachine, [[1, 'une par tour'], [2, 'deux par tour']]);
    h += sel('pT', 'Tuile', r.tuileL + 'x' + r.tuileP, [['3x3', '3 × 3 cases'], ['3x4', '3 × 4 cases'], ['4x4', '4 × 4 cases']]);
    h += sel('pI', 'Individus par joueur', r.individusParJoueur, [[2, '2'], [3, '3']]);
    h += sel('pA', 'Arbres par case', r.arbres, [[2, '2'], [3, '3'], [4, '4']]);
    h += sel('pR', 'Tours', r.tours, [[6, '6'], [8, '8'], [10, '10']]);
    h += `<label for="pG">Graine (même graine, mêmes tirages)<input type="number" id="pG" min="1" value="${r.graine}"></label>`;
    h += '</div><p class="small">Par défaut : deux Machines en plus, une menace par Machine, tuiles 3 × 3, 3 individus. C\'est le réglage qui a tenu tous les critères de 2 à 6 joueurs dans la campagne 2.</p></details>';
    h += `<div class="resume num"><span><b>${1 + J * r.tuileL * r.tuileP}</b> cases</span><span><b>${p.I}</b> individus</span><span><b>${p.k}</b> ordres par tour</span><span><b>${p.M}</b> Machines</span><span><b>${p.n}</b> menaces par tour</span><span><b>${p.c0}</b> arbres</span></div>`;
    if (p.erreurs.length) h += `<div class="hint warn">${esc(p.erreurs.join(' ; '))}.</div>`;
    h += `<div class="btn-row"><button class="btn" id="go" ${p.erreurs.length ? 'disabled' : ''}>Commencer la partie</button><button class="btn sec" id="newSeed">Autre graine</button></div>`;
    $('ask').innerHTML = h;
    ['annBox', 'plBox', 'jBox'].forEach((id) => { $(id).hidden = true; });
    $('status').innerHTML = '';
    const maj = () => {
      const [l, q] = $('pT').value.split('x').map(Number);
      cfg.reglages = Object.assign({}, cfg.reglages, { joueurs: +$('pJ').value, machinesEnPlus: +$('pM').value, menacesParMachine: +$('pQ').value,
        tuileL: l, tuileP: q, individusParJoueur: +$('pI').value, arbres: +$('pA').value, tours: +$('pR').value, graine: Math.max(1, +$('pG').value || 1) });
      for (let j = 0; j < 6; j++) if ($('s' + j)) cfg.sieges[j] = $('s' + j).value;
      garderCfg(); rendrePreparation(); apercu();
    };
    $('ask').querySelectorAll('select,input').forEach((x) => x.addEventListener('change', maj));
    $('go').addEventListener('click', demarrer);
    $('newSeed').addEventListener('click', () => { cfg.reglages.graine = 1 + Math.floor(Math.random() * 99999); garderCfg(); rendrePreparation(); apercu(); });
  }

  // ------------------------------------------------------------------ partie
  function demarrer() {
    const reg = Object.assign({}, cfg.reglages);
    P = K.params(reg); PL = K.plateau(P);
    if (P.erreurs.length) { toast(P.erreurs.join(' ; ')); return; }
    const rng = K.generateur(reg.graine);
    const e = K.miseEnPlace(P, PL, rng);
    e.individus = K.placementHeuristique(P, PL, e);
    const annonces = [], executions = [];
    for (let t = 0; t < P.tours; t++) { annonces.push(K.tirerAnnonces(P, rng)); executions.push(K.tirerExecution(P, rng)); }
    S = { id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), date: new Date().toISOString(), reglages: reg,
      sieges: cfg.sieges.slice(0, P.J), e, depart: K.copie(e), annonces, executions, phase: 'ordres', fait: [], prog: null, raisons: {}, par: {},
      pose: null, pas: 0, evts: [], historique: [], journal: [], parJoueur: new Array(P.J).fill(0), hors: 0, S: 0, enregistre: false };
    UI.sel = null;
    construirePlateau(P, PL);
    debutTour();
  }

  function debutTour() {
    const t = tour();
    S.prog = Array.from({ length: P.I }, () => [K.RIEN, null]);
    S.raisons = {}; S.par = {}; S.fait = []; S.pose = null; S.pas = 0; S.evts = []; S.phase = 'ordres'; UI.sel = null;
    log('tour', `Tour ${t + 1} sur ${P.tours}`);
    const vis = B.cibles(P, PL, S.e, S.annonces[t]);
    log('ann', 'Annonce : ' + vis.map((v) => `M${v.m + 1} ${NT[v.t]} (vise ${nomC(v.c)})`).join(' · '));
    suiteOrdres();
  }

  const humainSuivant = () => { for (let j = 0; j < P.J; j++) if (S.sieges[j] === 'humain' && !S.fait.includes(j)) return j; return null; };

  function suiteOrdres() {
    const j = humainSuivant();
    if (j !== null) { S.courant = j; S.choix = null; rendre(); return; }
    // les bots décident, par type de bot, en voyant les ordres des humains
    const t = tour();
    Object.keys(B.BOTS).forEach((type, n) => {
      const qui = []; for (let k = 0; k < P.J; k++) if (S.sieges[k] === type) qui.push(k);
      if (!qui.length) return;
      const rb = K.generateur(S.reglages.graine * 1009 + t * 31 + n + 1);
      const raisons = B.BOTS[type].jouer(P, PL, S.e, S.annonces[t], S.prog, qui, rb);
      for (const k of qui) { S.raisons[k] = raisons[k] || ''; S.par[k] = type; }
    });
    for (let k = 0; k < P.J; k++) {
      const od = ordreDuJoueur(k);
      log('ordre', `Joueur ${k + 1} : ${od ? nomI(od.i) + ' ' + ordreTexte(od.o) : 'aucun ordre'}`, S.par[k] !== 'humain' ? S.raisons[k] : '', SIEGES[S.sieges[k]]);
    }
    S.etatAvant = K.copie(S.e);
    S.pose = K.appliquer(P, PL, S.e, S.prog);     // les déplacements ont lieu d'abord (P3.3)
    S.phase = 'resolution'; S.courant = null;
    rendre();
  }

  function validerOrdre(rien) {
    const j = S.courant;
    if (!rien && S.choix) { S.prog[S.choix.i] = S.choix.o; }
    S.par[j] = 'humain'; S.fait.push(j); UI.sel = null; S.choix = null;
    suiteOrdres();
  }

  function clicIndividu(i) {
    if (!S || S.phase !== 'ordres' || S.courant === null) return;
    if (K.proprietaire(P, i) !== S.courant) return;
    UI.sel = UI.sel === i ? null : i; rendre();
  }
  function clicCase(c) {
    if (!S || S.phase !== 'ordres' || UI.sel === null) return;
    const i = UI.sel; const pos = S.e.individus[i];
    if (c === pos) S.choix = { i, o: [K.GARDER, pos] };
    else if (PL.dist[pos][c] === 1) S.choix = { i, o: [K.ALLER, c] };
    else return;
    rendre();
  }

  function menaceSuivante() {
    const t = tour(); const jx = S.executions[t][S.pas]; const [m, tac] = S.annonces[t][jx];
    const ev = K.executerMenace(P, PL, S.e, S.pose, m, tac); S.evts.push(ev); S.pas++;
    const rep = ev.repli ? ' (repli : rien à abattre autour d\'elle)' : '';
    if (ev.issue === 'abattu') log('abattu', `M${m + 1} ${NT[tac]} : entre en ${nomC(ev.cible)} et abat un arbre${rep}.`);
    else {
      const j = K.proprietaire(P, ev.qui); S.parJoueur[j]++; S.S++; if (PL.tuile[ev.lieu] !== j) S.hors++;
      log('pare', ev.issue === 'gardee' ? `M${m + 1} ${NT[tac]} : vise ${nomC(ev.cible)}, gardée par ${nomI(ev.qui)}. Parée.` : `M${m + 1} ${NT[tac]} : sabotée par ${nomI(ev.qui)} ; elle va en ${nomC(ev.cible)} sans abattre.`);
    }
    if (S.pas === P.n) finTour(); else rendre(ev);
  }

  function finTour() {
    const t = tour(); S.e.tour++;
    const par = K.parades(S.evts);
    S.historique.push({ tour: t + 1, annonces: S.annonces[t], execution: S.executions[t],
      ordres: Array.from({ length: P.J }, (_, j) => { const od = ordreDuJoueur(j); return { joueur: j + 1, siege: S.sieges[j], individu: od ? od.i : null, ordre: od ? od.o : [K.RIEN, null], raison: S.raisons[j] || '' }; }),
      evenements: S.evts, parades: par, foret: K.foret(S.e) });
    log('bilan', `Fin du tour ${t + 1} : ${par} parade(s), ${P.n - par} arbre(s) abattu(s). Forêt : ${K.foret(S.e)} arbres.`);
    if (S.e.tour >= P.tours) { S.phase = 'fin'; log('fin', `Fin de la partie : ${K.foret(S.e)} arbres sur ${P.c0} (${pct(K.foret(S.e) / P.c0)}), ${S.S} parades sur ${P.k * P.tours} ordres.`); enregistrer(); }
    else S.phase = 'entre';
    rendre();
  }

  function toutResoudre() { while (S.phase === 'resolution') menaceSuivante(); }
  function jouerTourAuto() { if (S.phase === 'entre') debutTour(); if (S.phase === 'resolution') toutResoudre(); }
  function jusquAuBout() { let garde = 100; while (S.phase !== 'fin' && garde--) { if (S.phase === 'entre') debutTour(); else if (S.phase === 'resolution') toutResoudre(); else break; } }

  // ------------------------------------------------------------------ rendu de la partie
  function rendre(ev) {
    if (!S) { rendrePreparation(); apercu(); return; }
    const t = Math.min(tour(), P.tours - 1);
    const vis = S.phase === 'ordres' ? B.cibles(P, PL, S.e, S.annonces[t]) : [];
    const opts = { menaces: vis };
    if (S.phase === 'ordres') {
      const allers = []; S.prog.forEach((o, i) => { if (o[0] === K.ALLER) allers.push([S.e.individus[i], o[1]]); });
      if (S.choix && S.choix.o[0] === K.ALLER) allers.push([S.e.individus[S.choix.i], S.choix.o[1]]);
      opts.allers = allers;
      if (S.courant !== null) {
        opts.cliquables = new Set(B.individusDe(P, S.courant));
        if (UI.sel !== null) { const pos = S.e.individus[UI.sel]; opts.cand = new Set([pos].concat(PL.voisins[pos])); }
      }
    }
    if (S.phase === 'resolution' || S.phase === 'entre' || S.phase === 'fin') {
      if (ev) { opts.actif = ev.machine; if (ev.issue === 'abattu') opts.cible = ev.cible; else opts.pare = ev.lieu; }
      if (S.phase === 'resolution') {
        const rest = S.executions[t].slice(S.pas).map((jx) => S.annonces[t][jx]);
        opts.menaces = rest.map(([m, tac]) => ({ m, t: tac, c: K.destination(P, PL, S.e, m, tac)[0] }));
      }
    }
    dessinerPlateau(S.e, opts);
    rendreStatus(); rendreAsk(ev); rendreAnnonce(); rendreJoueurs(); rendreJournal();
  }

  function rendreStatus() {
    $('status').innerHTML = `<span>Tour <b>${Math.min(tour() + (S.phase === 'entre' || S.phase === 'fin' ? 0 : 1), P.tours)}</b>/${P.tours}</span><span>Forêt <b>${K.foret(S.e)}</b>/${P.c0}</span><span>Parades <b>${S.S}</b></span><button class="opt" id="quit">Nouvelle partie</button>`;
    $('quit').addEventListener('click', () => { S = null; UI.sel = null; rendre(); });
  }

  function rendreAsk(ev) {
    let h = '';
    if (S.phase === 'ordres' && S.courant !== null) {
      const j = S.courant;
      h += `<div class="eyebrow" style="color:${COUL(j)}">Joueur ${j + 1} · à toi</div><h2>Un ordre pour l'un de tes individus</h2>`;
      h += '<p class="ctx">Clique sur un de tes pions, puis sur sa case pour <b>garder</b> ou sur une case voisine pour y <b>aller</b>. Tu peux aussi choisir ci-dessous. Toutes les menaces annoncées partiront ; seul leur ordre est caché.</p>';
      for (const i of B.individusDe(P, j)) {
        const pos = S.e.individus[i];
        const ops = K.ordresPossibles(P, PL, S.e, i).filter((o) => o[0] !== K.RIEN);
        const btn = (o) => { const on = S.choix && S.choix.i === i && S.choix.o[0] === o[0] && S.choix.o[1] === o[1];
          return `<button class="opt k-${o[0]}" aria-pressed="${on}" data-i="${i}" data-o="${o[0]}" data-a="${o[1]}">${esc(ordreTexte(o))}</button>`; };
        h += `<div class="indrow"><span class="pion" style="background:${COUL(j)}">${String.fromCharCode(97 + (i % P.ipj))}</span><div><div class="small"><b>${nomI(i)}</b> en ${nomC(pos)} (${S.e.arbres[pos]} arbres)</div><div class="btn-row" style="margin-top:4px">${ops.map(btn).join('')}</div></div></div>`;
      }
      const choisi = S.choix ? `${nomI(S.choix.i)} ${ordreTexte(S.choix.o)}` : 'aucun';
      h += `<div class="btn-row"><button class="btn" id="valider" ${S.choix ? '' : 'disabled'}>Valider : ${esc(choisi)}</button><button class="btn sec" id="rien">Ne rien faire</button></div>`;
      $('ask').innerHTML = h;
      $('ask').querySelectorAll('button[data-o]').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i; const a = b.dataset.a === 'null' ? null : +b.dataset.a; S.choix = { i, o: [b.dataset.o, a] }; UI.sel = i; rendre(); }));
      $('valider').addEventListener('click', () => validerOrdre(false));
      $('rien').addEventListener('click', () => validerOrdre(true));
      return;
    }
    if (S.phase === 'resolution') {
      h += `<div class="eyebrow">Résolution · menace ${S.pas + 1} sur ${P.n}</div>`;
      if (ev) h += `<h2>${ev.issue === 'abattu' ? 'Un arbre tombe' : 'Menace parée'}</h2><p class="ctx">${esc(S.journal[S.journal.length - 1].txt)}</p>`;
      else h += '<h2>Les ordres sont donnés</h2><p class="ctx">Les déplacements ont eu lieu. Les menaces vont partir une à une, dans un ordre tiré au hasard ; chaque Machine choisit sa case sur la forêt du moment.</p>';
      const auto = !S.sieges.includes('humain');
      h += `<div class="btn-row"><button class="btn" id="suiv">Menace suivante</button><button class="btn sec" id="tout">Tout résoudre</button>${auto ? '<button class="btn sec" id="bout">Jouer jusqu\'au bout</button>' : ''}</div>`;
      $('ask').innerHTML = h;
      $('suiv').addEventListener('click', menaceSuivante); $('tout').addEventListener('click', () => { toutResoudre(); });
      if (auto) $('bout').addEventListener('click', () => { toutResoudre(); jusquAuBout(); rendre(); });
      return;
    }
    if (S.phase === 'entre') {
      const last = S.historique[S.historique.length - 1];
      const humains = S.sieges.includes('humain');
      h += `<div class="eyebrow">Tour ${last.tour} terminé</div><h2>${last.parades} parade${last.parades > 1 ? 's' : ''}, ${P.n - last.parades} arbre${P.n - last.parades > 1 ? 's' : ''} abattu${P.n - last.parades > 1 ? 's' : ''}</h2>`;
      h += `<div class="btn-row"><button class="btn" id="next">Tour suivant</button>${humains ? '' : '<button class="btn sec" id="auto">Jouer jusqu\'au bout</button>'}</div>`;
      $('ask').innerHTML = h;
      $('next').addEventListener('click', () => { debutTour(); });
      if (!humains) $('auto').addEventListener('click', () => { jusquAuBout(); rendre(); });
      return;
    }
    if (S.phase === 'fin') {
      const r = K.foret(S.e);
      h += `<div class="eyebrow">Partie terminée</div><h2>${r} arbres sur ${P.c0} (${pct(r / P.c0)})</h2>`;
      h += `<p class="ctx">${S.S} parades pour ${P.k * P.tours} ordres, soit <b>${pct(S.S / (P.k * P.tours))}</b> des ordres qui ont sauvé un arbre. ${S.S ? `${pct(S.hors / S.S)} des parades faites hors de sa propre tuile.` : ''}</p>`;
      const mx = Math.max(1, ...S.parJoueur);
      h += '<div class="bars">' + S.parJoueur.map((x, j) => `<div class="barl"><span>Joueur ${j + 1}</span><span class="bart"><span style="width:${(100 * x / mx).toFixed(0)}%;background:${COUL(j)}"></span></span><span class="num">${x}</span></div>`).join('') + '</div>';
      h += `<p class="small">${S.enregistre ? 'Partie enregistrée.' : (UI.db ? 'Enregistrement…' : 'Enregistrement indisponible dans cette vue : exportez la partie depuis l\'onglet « Parties enregistrées ».')}</p>`;
      h += '<div class="btn-row"><button class="btn" id="again">Nouvelle partie</button><button class="btn sec" id="same">Rejouer la même graine</button></div>';
      $('ask').innerHTML = h;
      $('again').addEventListener('click', () => { cfg.reglages.graine = 1 + Math.floor(Math.random() * 99999); garderCfg(); S = null; rendre(); });
      $('same').addEventListener('click', () => { demarrer(); });
    }
  }

  function rendreAnnonce() {
    $('annBox').hidden = false;
    const t = Math.min(tour() - (S.phase === 'entre' || S.phase === 'fin' ? 1 : 0), P.tours - 1);
    const ann = S.annonces[t];
    const ordre = S.executions[t];
    const faits = S.phase === 'ordres' ? [] : (S.phase === 'resolution' ? ordre.slice(0, S.pas) : ordre);
    let h = '';
    if (S.phase === 'ordres') {
      const vis = B.cibles(P, PL, S.e, ann);
      h = vis.map((v) => `<div class="anl"><span class="mtag">M${v.m + 1}</span><span class="tac ${v.t}">${NT[v.t]}</span><span class="small">vise ${nomC(v.c)} sur la forêt actuelle</span></div>`).join('');
      h += '<p class="small">Les cibles peuvent changer : chaque menace lit la forêt au moment où elle part.</p>';
    } else {
      h = faits.map((jx, k) => { const ev = S.evts[k] || (S.historique[t] && S.historique[t].evenements[k]); const [m, tac] = ann[jx];
        return `<div class="anl fait"><span class="mtag">M${m + 1}</span><span class="tac ${tac}">${NT[tac]}</span><span class="small">${k + 1}. ${ev ? (ev.issue === 'abattu' ? 'abat en ' + nomC(ev.cible) : 'parée') : ''}</span></div>`; }).join('');
      const reste = S.phase === 'resolution' ? ordre.slice(S.pas).sort((a, b) => a - b) : [];   // dans l'ordre de l'annonce : l'ordre d'exécution reste caché
      h += reste.map((jx) => { const [m, tac] = ann[jx]; return `<div class="anl"><span class="mtag">M${m + 1}</span><span class="tac ${tac}">${NT[tac]}</span><span class="small">à venir</span></div>`; }).join('');
    }
    $('ann').innerHTML = h;
  }

  function rendreJoueurs() {
    $('plBox').hidden = false;
    $('players').innerHTML = S.sieges.map((s, j) => {
      const od = ordreDuJoueur(j);
      const montre = S.phase !== 'ordres' || S.fait.includes(j);
      return `<div class="pl ${S.courant === j ? 'actif' : ''}"><span class="dot" style="background:${COUL(j)}"></span><span>Joueur ${j + 1} <span class="who">${SIEGES[s]}</span><br><span class="ord">${montre ? (od ? esc(nomI(od.i) + ' ' + ordreTexte(od.o)) : 'aucun ordre') : (S.courant === j ? 'décide…' : 'attend')}</span></span><span class="num small">${S.parJoueur[j]} parade${S.parJoueur[j] > 1 ? 's' : ''}</span></div>`;
    }).join('');
  }

  function rendreJournal() {
    $('jBox').hidden = false;
    const why = $('showWhy').checked;
    $('journal').innerHTML = S.journal.map((l) => `<div class="jl k-${l.k}">${l.tag ? `<span class="tag">${esc(l.tag)}</span>` : ''}${esc(l.txt)}${why && l.why ? `<span class="why">${esc(l.why)}</span>` : ''}</div>`).join('');
    $('journal').scrollTop = $('journal').scrollHeight;
  }
  $('showWhy').addEventListener('change', () => { if (S) rendreJournal(); });

  // ------------------------------------------------------------------ enregistrement
  function resume(rec) {
    if (rec.type === 'serie') return { id: rec.id, type: 'serie', date: rec.date, titre: `Série : ${rec.lignes.length} lignes, ${rec.parties} parties par bot et par taille` };
    return { id: rec.id, type: 'partie', date: rec.date, titre: `${rec.reglages.joueurs} joueurs (${rec.sieges.map((s) => SIEGES[s]).join(', ')}) : ${rec.resultat.foret}/${rec.resultat.c0} arbres, ${pct(rec.resultat.taux)} de parades` };
  }
  function recordPartie() {
    return { id: S.id, type: 'partie', date: S.date, version: 1, reglages: S.reglages, sieges: S.sieges, depart: S.depart, tours: S.historique,
      resultat: { foret: K.foret(S.e), c0: P.c0, parades: S.S, taux: S.S / (P.k * P.tours), parJoueur: S.parJoueur, horsTuile: S.hors } };
  }
  async function enregistrer() {
    const rec = recordPartie(); UI.local = UI.local || []; UI.local.unshift(rec);
    if (!UI.db) { rendreArchives(); return; }
    try { await UI.db.collection('parties').doc(rec.id).set(rec); await UI.db.collection('index').doc(rec.id).set(resume(rec)); S.enregistre = true; toast('Partie enregistrée.'); }
    catch (e) { toast('La partie n\'a pas pu être enregistrée : ' + (e && e.message ? e.message : 'erreur')); }
    if (S && S.phase === 'fin') rendreAsk();
  }

  function rendreArchives() {
    const lignes = UI.index.length ? UI.index : (UI.local || []).map(resume);
    $('dbState').textContent = UI.db ? 'Chaque partie terminée et chaque série sont enregistrées avec leur journal : réglages, graine, ordres, raisons des bots, menaces et parades. Claude peut les relire pour les analyser.'
      : 'L\'enregistrement partagé n\'est pas disponible dans cette vue. Les parties de cette session restent listées ici et peuvent être exportées.';
    $('saved').innerHTML = lignes.length ? lignes.map((x) => `<div class="sv"><span>${esc(x.titre)}<br><span class="m">${new Date(x.date).toLocaleString('fr-FR')} · ${x.type === 'serie' ? 'série' : 'partie'}</span></span><button class="opt" data-id="${esc(x.id)}" data-c="${x.type === 'serie' ? 'series' : 'parties'}">Exporter</button></div>`).join('')
      : '<div class="empty">Aucune partie enregistrée pour l\'instant. Les parties terminées et les séries de bots apparaîtront ici.</div>';
    $('saved').querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', () => exporter(b.dataset.c, b.dataset.id)));
  }
  async function lire(coll, id) {
    const loc = (UI.local || []).find((r) => r.id === id); if (loc) return loc;
    if (!UI.db) return null;
    try { const s = await UI.db.collection(coll).doc(id).get(); return s.exists ? s.data() : null; } catch (e) { return null; }
  }
  async function sauver(nom, obj) {
    if (!UI.dl) { toast('Le téléchargement n\'est pas disponible dans cette vue.'); return; }
    try { await UI.dl.save({ filename: nom, data: JSON.stringify(obj, null, 1) }); } catch (e) { /* refusé par le lecteur */ }
  }
  async function exporter(coll, id) { const r = await lire(coll, id); if (r) sauver(`foret-couronne-${id}.json`, r); else toast('Introuvable.'); }
  $('expAll').addEventListener('click', async () => {
    const tout = [];
    for (const x of (UI.index.length ? UI.index : (UI.local || []).map(resume))) { const r = await lire(x.type === 'serie' ? 'series' : 'parties', x.id); if (r) tout.push(r); }
    sauver('foret-couronne-tout.json', tout);
  });

  // ------------------------------------------------------------------ séries de bots
  function lancerSerie() {
    if (UI.serie) return;
    const N = +$('serN').value; const Js = $('serJ').value === 'all' ? [2, 3, 4, 5, 6] : [cfg.reglages.joueurs];
    const bots = ['hasard', 'reflexe', 'stratege', 'prevoyant'];
    const taches = []; for (const J of Js) for (let g = 1; g <= N; g++) taches.push([J, g]);
    const acc = {}; let k = 0;
    UI.serie = true; $('runSerie').disabled = true;
    const pas = () => {
      const t0 = performance.now();
      while (k < taches.length && performance.now() - t0 < 40) {
        const [J, g] = taches[k++];
        for (const b of bots) {
          const r = B.partieAuto(Object.assign({}, cfg.reglages, { joueurs: J, graine: 1000 + g }), b);
          const a = acc[J + '|' + b] = acc[J + '|' + b] || { J, b, n: 0, taux: 0, foret: 0, agence: 0, couplage: 0 };
          a.n++; a.taux += r.taux; a.foret += r.foret; a.agence += r.agence; a.couplage += r.couplage;
        }
      }
      $('serieProg').textContent = `${k} / ${taches.length} tables`;
      if (k < taches.length) { setTimeout(pas, 0); return; }
      UI.serie = null; $('runSerie').disabled = false;
      const lignes = Object.values(acc).map((a) => ({ joueurs: a.J, bot: a.b, parties: a.n, taux: a.taux / a.n, foret: a.foret / a.n, agence: a.agence / a.n, couplage: a.couplage / a.n }));
      afficherSerie(lignes, Js);
      const rec = { id: 's' + Date.now().toString(36), type: 'serie', date: new Date().toISOString(), reglages: cfg.reglages, parties: N, lignes };
      UI.local = UI.local || []; UI.local.unshift(rec);
      if (UI.db) UI.db.collection('series').doc(rec.id).set(rec).then(() => UI.db.collection('index').doc(rec.id).set(resume(rec))).then(() => toast('Série enregistrée.')).catch(() => {});
      else rendreArchives();
    };
    pas();
  }
  function afficherSerie(lignes, Js) {
    const NB = { hasard: 'Hasard', reflexe: 'Réflexe', stratege: 'Glouton', prevoyant: 'Prévoyant' };
    let h = '<div class="eyebrow">Résultats</div><h2>Ordres qui ont paré une menace</h2><div class="tw"><table class="res num"><thead><tr><th>Joueurs</th>'
      + Object.values(NB).map((n) => `<th>${n}</th>`).join('') + '<th>Forêt*</th><th>Agence*</th><th>Couplage*</th></tr></thead><tbody>';
    for (const J of Js) {
      const L = (b) => lignes.find((x) => x.joueurs === J && x.bot === b);
      const pv = L('prevoyant');
      h += `<tr><td>${J}</td>` + Object.keys(NB).map((b) => `<td>${pct(L(b).taux)}</td>`).join('') + `<td>${pct(pv.foret)}</td><td>${pct(pv.agence)}</td><td>${pct(pv.couplage)}</td></tr>`;
    }
    h += '</tbody></table></div><p class="small">* pour le bot prévoyant. Forêt : arbres restants en fin de partie. Agence : part des joueurs qui ont paré au moins une menace. Couplage : part des parades faites hors de sa tuile.</p>';
    const ecarts = Js.map((J) => { const a = lignes.find((x) => x.joueurs === J && x.bot === 'prevoyant'), b = lignes.find((x) => x.joueurs === J && x.bot === 'reflexe'); return 100 * (a.taux - b.taux); });
    h += `<div class="verdict">Prévoyant moins Réflexe : ${ecarts.map((x, n) => `${Js[n]} joueurs ${x >= 0 ? '+' : ''}${f1(x)} pt`).join(' · ')}. C'est ce que rapporte de voir au-delà du tour ; le moteur Python mesure le même écart avec un bot plus fort.</div>`;
    $('serieRes').innerHTML = h;
  }
  $('runSerie').addEventListener('click', lancerSerie);

  // ------------------------------------------------------------------ onglets, base, reprise
  document.querySelectorAll('.tabs [role="tab"]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs [role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('section[role="tabpanel"]').forEach((s) => { s.hidden = s.id !== b.getAttribute('aria-controls'); });
    if (b.id === 'tab-archives') rendreArchives();
  }));

  function demarrerPage(data) {
    if (data && data.S) { S = data.S; cfg = data.cfg || cfg; P = K.params(S.reglages); PL = K.plateau(P); construirePlateau(P, PL); }
    rendre();
    rendreArchives();
  }
  if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({ S, cfg }));
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(demarrerPage);
  else demarrerPage((window.claude && window.claude.hot && window.claude.hot.data) || {});

  if (window.claude && window.claude.use) {
    window.claude.use('db').then((db) => {
      if (!db) return; UI.db = db;
      db.collection('index').orderBy('date', 'desc').limit(200).onSnapshot((snap) => {
        UI.index = snap.docs.map((d) => d.data()); if (!$('pan-archives').hidden) rendreArchives();
      }, () => {});
      rendreArchives();
    }).catch(() => {});
    window.claude.use('downloads').then((d) => { UI.dl = d; }).catch(() => {});
  }
})();
