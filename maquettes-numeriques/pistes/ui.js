/* Page « Couronne aux deux pistes » : préparation, partie pas à pas (humains et bots, deux cartes par joueur, lancer par
   lancer), séries de bots, parties enregistrées dans la base de l'artefact. L'état d'une partie est un objet JSON
   simple (S), rejouable : tous les tirages sont faits au départ à partir de la graine. */
(function () {
  'use strict';
  const K = window.PISTES, B = window.PISTESBOTS;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (x) => Math.round(100 * x) + ' %';
  const f1 = (x) => x.toFixed(1).replace('.', ',');
  const COUL = (j) => `var(--j${j + 1})`;
  const SIEGES = { humain: 'Humain', prevoyant: 'Bot prévoyant', reflexe: 'Bot réflexe', stratege: 'Bot glouton', hasard: 'Bot hasard' };
  const NT = K.NOMS_TACTIQUES;
  const COURT = { cupidite: 'Cupi', percee: 'Perc', opportunisme: 'Oppo', represailles: 'Repr' };
  const MN = (m) => K.MACHINES[m].nom;

  let cfg = { reglages: Object.assign({}, K.DEFAUTS, { graine: 1 + Math.floor(Math.random() * 99999) }),
    sieges: ['humain', 'prevoyant', 'prevoyant', 'prevoyant', 'prevoyant', 'prevoyant'], aide: true };
  try { const m = JSON.parse(localStorage.getItem('pistes-cfg') || 'null'); if (m && m.reglages && m.sieges) cfg = Object.assign(cfg, m); } catch (e) { /* stockage indisponible */ }
  const garderCfg = () => { try { localStorage.setItem('pistes-cfg', JSON.stringify(cfg)); } catch (e) { /* rien */ } };

  let S = null;                 // la partie en cours
  let P = null, PL = null;      // réglages calculés et plateau
  const UI = { db: null, dl: null, sel: null, index: [], geo: null, serie: null };

  // ------------------------------------------------------------------ outils
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2800); }
  const nomC = (c) => B.nomCase(P, PL, c);
  const nomI = (i) => B.nomInd(P, i);
  const tour = () => S.e.tour;
  const ordreTexte = (o) => B.ordreTexte(P, PL, o);
  const carteTexte = (c) => (c ? nomI(c.i) + ' ' + ordreTexte(c.o) : 'rien');
  function log(k, txt, why, tag) { S.journal.push({ k, txt, why: why || '', tag: tag || '' }); }
  function de(n) {
    const P9 = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[n];
    return `<span class="die" role="img" aria-label="${n}">${P9.map((k) => `<i style="grid-area:${1 + Math.floor((k - 1) / 3)}/${1 + (k - 1) % 3}"></i>`).join('')}</span>`;
  }
  const des = (d) => de(d[0]) + de(d[1]);
  const ctxBots = () => (P.presage ? { connus: S.tirages[tour()][0].map((l) => l.d.slice()) } : null);

  // ------------------------------------------------------------------ géométrie de la couronne (comme le kit)
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

  function positions(e) {
    const par = {};
    e.machines.forEach((c, j) => { if (c >= 0) (par[c] = par[c] || []).push('m' + j); });
    e.individus.forEach((c, i) => { (par[c] = par[c] || []).push('i' + i); });
    const pos = {};
    for (const c in par) {
      const g = UI.geo.cells[c]; const ids = par[c]; const n = ids.length;
      const parRang = c == 0 ? 4 : Math.max(1, Math.min(4, Math.floor((g.arc - 4) / 23)));
      ids.forEach((id, k) => {
        const rang = Math.floor(k / parRang), col = k % parRang, dansRang = Math.min(parRang, n - rang * parRang);
        const off = (col - (dansRang - 1) / 2) * 23, offR = (rang - (Math.ceil(n / parRang) - 1) / 2) * 19;
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
    h += '</g><g id="gThr">';
    h += `<circle id="thr0" class="thr" cx="${CX}" cy="${CY}" r="${RH}"/>`;
    for (const x of g.cells.slice(1)) h += `<path id="thr${x.c}" class="thr" d="${x.path}"/>`;
    h += '</g><g id="gSeps">';
    for (const [x1, y1, x2, y2] of g.seps) h += `<line class="tile-sep" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    g.noms.forEach(([x, y], t) => { h += `<text class="tile-name" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${COUL(t)}">Joueur ${t + 1}</text>`; });
    h += '</g><g id="gLabels">';
    h += `<text id="cn0" class="cname" x="${CX}" y="${CY - 30}" text-anchor="middle">Cœur</text><text id="nt0" class="ntree" x="${CX}" y="${CY + 38}" text-anchor="middle"></text>`;
    for (const x of g.cells.slice(1)) {
      h += `<text id="nt${x.c}" class="ntree" x="${x.nx.toFixed(1)}" y="${x.ny.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"></text>`;
      h += `<text id="cn${x.c}" class="cname" x="${x.lx.toFixed(1)}" y="${x.ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" data-nom="${x.w > 30 && x.arc > 30 ? B.nomCase(p, pl, x.c) : ''}"></text>`;
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
      const th = opts.menace ? opts.menace[c] : 0;
      $('thr' + c).style.fillOpacity = th > 0.01 ? Math.min(0.6, 0.12 + th * 0.75).toFixed(2) : '0';
      const cn = $('cn' + c);
      if (c > 0) {
        if (th >= 0.1) { cn.textContent = pct(th); cn.setAttribute('class', 'cname thrtxt'); }
        else { cn.textContent = cn.getAttribute('data-nom'); cn.setAttribute('class', 'cname'); }
      } else { cn.textContent = th >= 0.1 ? 'Cœur · ' + pct(th) : 'Cœur'; cn.setAttribute('class', th >= 0.1 ? 'cname thrtxt' : 'cname'); }
    }
    let fl = '';
    const fleche = (a, b, cls) => {
      const ga = UI.geo.cells[a], gb = UI.geo.cells[b];
      if (a === b) return `<circle class="fleche ${cls}" cx="${ga.cx.toFixed(1)}" cy="${ga.cy.toFixed(1)}" r="14"/>`;
      const mx = (ga.cx + gb.cx) / 2 + (CX - (ga.cx + gb.cx) / 2) * 0.12, my = (ga.cy + gb.cy) / 2 + (CY - (ga.cy + gb.cy) / 2) * 0.12;
      return `<path class="fleche ${cls}" d="M${ga.cx.toFixed(1)},${ga.cy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${gb.cx.toFixed(1)},${gb.cy.toFixed(1)}" marker-end="url(#${cls.includes('aller') ? 'teteV' : 'tete'})"/>`;
    };
    for (const a of opts.allers || []) fl += fleche(a[0], a[1], 'aller' + (a[2] ? ' deux' : ''));
    if (opts.trajet) fl += fleche(opts.trajet[0], opts.trajet[1], '');
    $('gFleches').innerHTML = fl;
    const tk = $('gToks');
    if (!UI.tokBuilt) {
      let h = '';
      e.machines.forEach((_, j) => { h += `<g id="m${j}" class="tok mach"><rect x="-12" y="-9" width="24" height="18" rx="4"/><text text-anchor="middle" dominant-baseline="central">${K.MACHINES[j].court}</text></g>`; });
      e.individus.forEach((_, i) => { const pj = K.proprietaire(P, i); h += `<g id="i${i}" class="tok ind" data-i="${i}"><circle r="8.5" fill="${COUL(pj)}"/><text text-anchor="middle" dominant-baseline="central">${String.fromCharCode(97 + (i % P.ipj))}</text></g>`; });
      tk.innerHTML = h; UI.tokBuilt = true; UI.vus = {};
    }
    const pos = positions(e);
    e.machines.forEach((c, j) => {
      const g = $('m' + j);
      if (c < 0) { g.style.display = 'none'; UI.vus[j] = false; return; }
      const [x, y] = pos['m' + j];
      if (!UI.vus[j]) { g.style.transition = 'none'; g.style.display = ''; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); void g.getBBox; requestAnimationFrame(() => { g.style.transition = ''; }); UI.vus[j] = true; }
      else g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      g.setAttribute('class', 'tok mach' + (opts.actif === j ? ' actif' : ''));
    });
    e.individus.forEach((_, i) => {
      const g = $('i' + i); const [x, y] = pos['i' + i]; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      g.setAttribute('class', 'tok ind' + (UI.sel === i ? ' sel' : '') + (opts.cliquables && opts.cliquables.has(i) ? ' cliquable' : ''));
    });
    $('legend').innerHTML = '<span><i style="background:var(--f3)"></i>case boisée (le chiffre : ses arbres)</span><span><i style="background:var(--f0)"></i>case rasée</span>'
      + '<span><i style="background:var(--machine)"></i>Machine sur le plateau</span>'
      + (opts.menace ? `<span><i style="background:var(--danger);opacity:.55"></i>chance qu'au moins une menace de la vague frappe la case (pourcentage dès 10 %)</span>` : '')
      + '<span><i style="background:var(--accent)"></i>déplacement programmé</span>';
  }

  // ------------------------------------------------------------------ la tête du Méchant : les deux pistes
  function rendreMechant(opts) {
    opts = opts || {};
    const e = S ? S.e : opts.e; if (!e) return;
    const ev = opts.ev; const ap = ev && ev.appris ? ev.appris : null; const apV = opts.appVague || [];
    const bougeP = new Set(), bougeM = new Set();
    for (const a of (ap ? [ap] : []).concat(apV)) { if (a.pensees[1] !== null) { bougeP.add(a.pensees[0]); bougeP.add(a.pensees[1]); } if (a.machines[1] !== null) { bougeM.add(a.machines[0]); bougeM.add(a.machines[1]); } }
    let h = '<div class="trk-h"><span class="eyebrow">Piste des pensées</span><span class="small">la <b>somme</b> des deux dés désigne la tactique</span></div><div class="track trk-p">';
    for (let s = 2; s <= 12; s++) {
      const t = K.tactiqueEn(e, s); const ch = K.CHANCES_SOMME(s);
      h += `<div class="tc ${ev && ev.somme === s ? 'vise' : ''} ${bougeP.has(s) ? 'bouge' : ''} ${s === 7 ? 'sept' : ''}"><span class="n">${s}</span><span class="dots" aria-label="${ch} chances sur 36">${'<i></i>'.repeat(ch)}</span><span class="tile ${t}" title="${NT[t]}">${COURT[t]}</span></div>`;
    }
    h += '</div><p class="small sens">Réussite : vers le 7. Échec : vers le bord (au 7, vers le 8).</p>';
    const prof = K.profils(e);
    h += '<div class="trk-h"><span class="eyebrow">Piste des Machines</span><span class="small">l\'<b>écart</b> des deux dés désigne la Machine</span></div><div class="track trk-m">';
    K.ECARTS.forEach((d, pos) => {
      const m = e.pisteM[pos]; const pr = prof[m]; const lieu = e.machines[m] < 0 ? 'au chantier' : 'en ' + nomC(e.machines[m]);
      const bar = K.TACTIQUES.filter((t) => pr.tactiques[t]).map((t) => `<span class="${t}" style="flex:${pr.tactiques[t]}" title="${NT[t]} ${pr.tactiques[t]}/36"></span>`).join('');
      const agit = opts.L ? `<span class="agit">${pct(K.auMoinsUneFois(K.CHANCES_ECART[d], opts.L))} dans la vague</span>` : '';
      h += `<div class="tc mc ${ev && ev.ecart === d ? 'vise' : ''} ${bougeM.has(pos) ? 'bouge' : ''}"><span class="n">écart ${d}</span><span class="ch num">${K.CHANCES_ECART[d]}/36</span><span class="mtag ${e.machines[m] < 0 ? 'off' : ''}">${K.MACHINES[m].court}</span><span class="mn">${esc(MN(m))}</span><span class="lieu">${esc(lieu)}</span><span class="pbar" aria-label="tactiques possibles">${bar}</span>${agit}</div>`;
    });
    h += '</div><p class="small sens">← côté probable · réussite vers la gauche, échec vers la droite · côté rare →</p>';
    h += '<div class="tleg">' + K.TACTIQUES.map((t) => `<span><span class="tile ${t}">${COURT[t]}</span> ${NT[t]}</span>`).join('') + '<span class="small">La barre sous chaque Machine : les tactiques qu\'elle peut recevoir.</span></div>';
    if (opts.presage) h += `<div class="presage"><span class="eyebrow">Présage · les dés de la vague 1</span><div class="dl">${opts.presage.map((d) => { const L = K.lire(e, d); return `<span class="dp">${des(d)}<span class="small">${COURT[L.tactique]} · ${K.MACHINES[L.machine].court}</span></span>`; }).join('')}</div><p class="small">Lus sur les pistes actuelles. ${P.rythme === 'lancer' ? 'Les pistes bougent après chaque lancer : la lecture des derniers dés peut changer.' : 'Les pistes ne bougent qu\'à la fin de la vague : cette lecture tiendra.'}</p></div>`;
    if (ev) h += `<div class="dernier"><span class="dl">${des(ev.d)}</span><span>somme <b>${ev.somme}</b> : ${NT[ev.tactique]} · écart <b>${ev.ecart}</b> : ${esc(MN(ev.machine))}</span></div>`;
    $('mech').innerHTML = h;
  }

  // ------------------------------------------------------------------ préparation
  function apercu() {
    P = K.params(cfg.reglages); PL = K.plateau(P);
    construirePlateau(P, PL);
    const rng = K.generateur(cfg.reglages.graine);
    const e = K.miseEnPlace(P, PL, rng); e.individus = K.placementHeuristique(P, PL, e);
    dessinerPlateau(e, { menace: cfg.aide ? menaceVague(e) : null });
    rendreMechant({ e, L: P.L });
  }
  const menaceVague = (e) => K.menaceParCase(P, PL, e).map((x) => 1 - Math.pow(1 - x, P.L));

  function rendrePreparation() {
    const r = cfg.reglages; const J = r.joueurs; const p = K.params(r);
    let h = '<div class="eyebrow">Nouvelle partie</div><h2>Préparer la table</h2>';
    h += '<p class="ctx">Chaque siège est un joueur humain ou un bot. Un humain peut tenir plusieurs sièges : il pose alors les cartes de chacun, à tour de rôle.</p>';
    h += `<div class="params"><label for="pJ">Joueurs<select id="pJ">${[2, 3, 4, 5, 6].map((x) => `<option ${x === J ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>`;
    h += '<div class="setup" id="seats">';
    for (let j = 0; j < J; j++) {
      h += `<div class="seat"><span class="dot" style="background:${COUL(j)}"></span><span>Joueur ${j + 1}</span><select id="s${j}" aria-label="Joueur ${j + 1}">`
        + Object.entries(SIEGES).map(([k, v]) => `<option value="${k}" ${cfg.sieges[j] === k ? 'selected' : ''}>${v}</option>`).join('') + '</select></div>';
    }
    h += '</div><details><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:800">Réglages</summary><div class="params" style="margin-top:8px">';
    const sel = (id, lab, val, opts) => `<label for="${id}">${lab}<select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    h += sel('pE', 'Cartes par joueur et par tour', r.etapes, [[2, 'deux (deux étapes)'], [1, 'une (témoin)']]);
    h += sel('pL', 'Lancers par vague', r.lancersEnPlus, [[1, 'un de plus que de joueurs'], [2, 'deux de plus que de joueurs']]);
    h += sel('pY', 'Les pistes apprennent', r.rythme, [['lancer', 'après chaque lancer'], ['vague', 'à la fin de chaque vague']]);
    h += sel('pP', 'Présage', r.presage ? 1 : 0, [[0, 'non'], [1, 'les dés de la vague 1 sont montrés']]);
    h += sel('pT', 'Tuile', r.tuileL + 'x' + r.tuileP, [['3x3', '3 × 3 cases'], ['3x4', '3 × 4 cases'], ['4x4', '4 × 4 cases']]);
    h += sel('pI', 'Individus par joueur', r.individusParJoueur, [[2, '2'], [3, '3']]);
    h += sel('pA', 'Arbres par case', r.arbres, [[2, '2'], [3, '3'], [4, '4']]);
    h += sel('pR', 'Tours', r.tours, (r.etapes === 2 ? [3, 4, 5] : [6, 8, 10]).map((x) => [x, String(x)]));
    h += `<label for="pG">Graine (même graine, mêmes dés)<input type="number" id="pG" min="1" value="${r.graine}"></label>`;
    h += '</div><p class="small">Par défaut : deux cartes, un lancer de plus que de joueurs par vague, les pistes apprennent après chaque lancer, pas de présage, 4 tours. Avec une carte, la partie passe à 8 tours : même nombre d\'ordres et de lancers.</p></details>';
    h += `<div class="resume num"><span><b>${1 + J * r.tuileL * r.tuileP}</b> cases</span><span><b>${p.I}</b> individus</span><span><b>${p.ordresParTour}</b> ordres par tour</span><span><b>${p.lancersParTour}</b> lancers par tour</span><span><b>${p.surPlateau}</b> Machines sur le plateau, ${6 - p.surPlateau} au chantier</span><span><b>${p.c0}</b> arbres</span></div>`;
    if (p.erreurs.length) h += `<div class="hint warn">${esc(p.erreurs.join(' ; '))}.</div>`;
    h += `<div class="btn-row"><button class="btn" id="go" ${p.erreurs.length ? 'disabled' : ''}>Commencer la partie</button><button class="btn sec" id="newSeed">Autre graine</button></div>`;
    $('ask').innerHTML = h;
    ['plBox', 'jBox'].forEach((id) => { $(id).hidden = true; });
    $('status').innerHTML = '';
    const maj = (ev) => {
      const [l, q] = $('pT').value.split('x').map(Number);
      const E = +$('pE').value;
      let tours = +$('pR').value;
      if (ev && ev.target.id === 'pE') tours = E === 2 ? 4 : 8;
      cfg.reglages = Object.assign({}, cfg.reglages, { joueurs: +$('pJ').value, etapes: E, lancersEnPlus: +$('pL').value, rythme: $('pY').value, presage: $('pP').value === '1',
        tuileL: l, tuileP: q, individusParJoueur: +$('pI').value, arbres: +$('pA').value, tours, graine: Math.max(1, +$('pG').value || 1) });
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
    const np = K.nouvellePartie(reg);
    P = np.p; PL = np.pl;
    if (P.erreurs.length) { toast(P.erreurs.join(' ; ')); return; }
    S = { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), date: new Date().toISOString(), reglages: reg,
      sieges: cfg.sieges.slice(0, P.J), e: np.e, depart: K.copie(np.e), tirages: np.tirages, phase: 'cartes', v: 0, pas: 0,
      cartes: null, raisons: {}, par: {}, fait: [], courant: null, slot: 0, brouillon: null, pose: null, attente: [], vague: [],
      etapesTour: [], dernier: null, appVague: [], historique: [], journal: [], parJoueur: new Array(P.J).fill(0), hors: 0, S: 0, perdus: 0, enregistre: false };
    UI.sel = null;
    construirePlateau(P, PL);
    debutTour();
  }

  function debutTour() {
    const t = tour();
    S.cartes = K.cartesVides(P);
    S.raisons = {}; S.par = {}; S.fait = []; S.pose = null; S.v = 0; S.pas = 0; S.vague = []; S.etapesTour = []; S.dernier = null; S.appVague = [];
    S.phase = 'cartes'; UI.sel = null;
    log('tour', `Tour ${t + 1} sur ${P.tours}`);
    if (P.presage) log('ann', 'Présage : les dés de la vague 1 sont ' + S.tirages[t][0].map((l) => `${l.d[0]}-${l.d[1]}`).join(', ') + '.');
    suiteCartes();
  }

  const humainSuivant = () => { for (let j = 0; j < P.J; j++) if (S.sieges[j] === 'humain' && !S.fait.includes(j)) return j; return null; };

  function suiteCartes() {
    const j = humainSuivant();
    if (j !== null) { S.courant = j; S.slot = 0; S.brouillon = S.cartes[j].slice(); rendre(); return; }
    const t = tour();
    Object.keys(B.BOTS).forEach((type, n) => {
      const qui = []; for (let k = 0; k < P.J; k++) if (S.sieges[k] === type) qui.push(k);
      if (!qui.length) return;
      const rb = K.generateur(S.reglages.graine * 1009 + t * 31 + n + 1);
      const raisons = B.BOTS[type].jouer(P, PL, S.e, S.cartes, qui, rb, ctxBots());
      for (const k of qui) { S.raisons[k] = raisons[k] || ''; S.par[k] = type; }
    });
    for (let k = 0; k < P.J; k++) {
      log('ordre', `Joueur ${k + 1} : ` + S.cartes[k].map((c, v) => (P.E > 1 ? `carte ${v + 1} ` : '') + carteTexte(c)).join(' · '), S.par[k] !== 'humain' ? S.raisons[k] : '', SIEGES[S.sieges[k]]);
    }
    S.courant = null;
    revelerEtape(0);
  }

  function revelerEtape(v) {
    S.v = v; S.pas = 0; S.vague = []; S.attente = []; S.dernier = null; S.appVague = [];
    const prog = K.programmeEtape(P, S.cartes, v);
    S.pose = K.reveler(P, PL, S.e, prog);
    const vus = S.cartes.map((cs) => cs[v]).filter((c) => c);
    log('etape', `${P.E > 1 ? `Étape ${v + 1} : on révèle les cartes ${v + 1}` : 'On révèle les cartes'}${vus.length ? ' (' + vus.map(carteTexte).join(', ') + ')' : ''}.`);
    for (const x of S.pose.perdus) { log('perdu', `Ordre perdu : ${nomI(x.i)} ${ordreTexte(x.o)} (${x.pourquoi}).`); S.perdus++; }
    S.phase = 'vague';
    rendre();
  }

  function texteLancer(ev) {
    const m = MN(ev.machine); const rep = ev.repli ? ' (repli : plus d\'arbre autour d\'elle)' : '';
    let s = `Dés ${ev.d[0]} et ${ev.d[1]} : somme ${ev.somme}, ${NT[ev.tactique]} ; écart ${ev.ecart}, ${m}. `;
    if (ev.entree !== undefined) {
      s += `${m} sort du chantier et entre en ${nomC(ev.entree)}`;
      if (ev.issue === 'abattu') s += ev.cible !== ev.entree ? `, puis abat en ${nomC(ev.cible)}${rep}.` : ' et y abat un arbre.';
      else s += `, gardée par ${nomI(ev.qui)} : parée.`;
    } else if (ev.issue === 'abattu') s += `${m} entre en ${nomC(ev.cible)} et abat un arbre${rep}.`;
    else if (ev.issue === 'gardee') s += `${m} vise ${nomC(ev.cible)}, gardée par ${nomI(ev.qui)} : parée.`;
    else s += `${m} est sabotée par ${nomI(ev.qui)} : elle va en ${nomC(ev.cible)} sans abattre.`;
    return s;
  }
  function texteAppris(a, tactique, machine) {
    const p = a.pensees[1] === null ? `${NT[tactique]} reste en ${a.pensees[0]}` : `${NT[tactique]} ${a.pensees[0]} → ${a.pensees[1]}`;
    const m = a.machines[1] === null ? `${MN(machine)} reste sur l'écart ${K.ECARTS[a.machines[0]]}` : `${MN(machine)} écart ${K.ECARTS[a.machines[0]]} → ${K.ECARTS[a.machines[1]]}`;
    return `${p} ; ${m}.`;
  }

  function lancerSuivant() {
    const t = tour(); const l = S.tirages[t][S.v][S.pas];
    const ev = K.executerLancer(P, PL, S.e, S.pose, l, S.attente);
    S.vague.push(ev); S.pas++; S.dernier = ev;
    if (ev.issue === 'abattu') log('abattu', texteLancer(ev));
    else { const j = K.proprietaire(P, ev.qui); S.parJoueur[j]++; S.S++; if (PL.tuile[ev.lieu] !== j) S.hors++; log('pare', texteLancer(ev)); }
    if (ev.appris) log('appris', (ev.issue === 'abattu' ? 'Réussite, il apprend : ' : 'Échec, il apprend : ') + texteAppris(ev.appris, ev.tactique, ev.machine));
    if (S.pas === P.L) finVague(); else rendre();
  }

  function finVague() {
    const appris = K.finVague(P, S.e, S.attente);
    if (appris.length) {
      log('appris', 'Fin de la vague, il apprend : ' + appris.map((a, k) => texteAppris(a, S.vague[k].tactique, S.vague[k].machine)).join(' '));
      S.appVague = appris;
    }
    S.etapesTour.push({ etape: S.v + 1, perdus: S.pose.perdus, evenements: S.vague, appris });
    const par = S.vague.filter((x) => x.issue !== 'abattu').length;
    log('bilan', `Vague ${S.v + 1} : ${par} parade(s), ${P.L - par} arbre(s) abattu(s).`);
    if (S.v + 1 < P.E) { S.phase = 'inter'; rendre(); } else finTour();
  }

  function finTour() {
    const t = tour(); S.e.tour++;
    const par = S.etapesTour.reduce((s, x) => s + x.evenements.filter((v) => v.issue !== 'abattu').length, 0);
    S.historique.push({ tour: t + 1, des: S.tirages[t].map((w) => w.map((l) => l.d)),
      cartes: Array.from({ length: P.J }, (_, j) => ({ joueur: j + 1, siege: S.sieges[j], cartes: S.cartes[j], raison: S.raisons[j] || '' })),
      etapes: S.etapesTour, parades: par, foret: K.foret(S.e), pensees: S.e.pensees.slice(2).map((x) => K.TUILES[x]), pisteMachines: S.e.pisteM.map(MN) });
    log('bilan', `Fin du tour ${t + 1} : ${par} parade(s), ${P.lancersParTour - par} arbre(s) abattu(s). Forêt : ${K.foret(S.e)} arbres.`);
    if (S.e.tour >= P.tours) { S.phase = 'fin'; log('fin', `Fin de la partie : ${K.foret(S.e)} arbres sur ${P.c0} (${pct(K.foret(S.e) / P.c0)}), ${S.S} parades pour ${P.ordresParTour * P.tours} ordres.`); enregistrer(); }
    else S.phase = 'entre';
    rendre();
  }

  function toutLaVague() { const v = S.v; while (S.phase === 'vague' && S.v === v) lancerSuivant(); }
  function toutLeTour() { let g = 50; while ((S.phase === 'vague' || S.phase === 'inter') && g--) { if (S.phase === 'inter') revelerEtape(S.v + 1); else toutLaVague(); } }
  function jusquAuBout() { let g = 200; while (S.phase !== 'fin' && g--) { if (S.phase === 'entre') debutTour(); else if (S.phase === 'vague' || S.phase === 'inter') toutLeTour(); else break; } }

  // ------------------------------------------------------------------ cartes des humains
  function cartesAvecBrouillon() { const cs = S.cartes.map((x) => x.slice()); cs[S.courant] = S.brouillon.slice(); return cs; }
  function posPrevues(v) { return K.positionsPrevues(P, S.e, cartesAvecBrouillon(), v); }
  function optionsSlot(i, v) { return K.ordresPossibles(P, PL, S.e, i, posPrevues(v)[i]); }
  // une carte qui ne tient plus après un changement d'une carte précédente est retirée
  function verifierSuite(depuis) {
    for (let v = depuis + 1; v < P.E; v++) {
      const c = S.brouillon[v]; if (!c) continue;
      if (!optionsSlot(c.i, v).some((o) => o[0] === c.o[0] && o[1] === c.o[1])) { S.brouillon[v] = null; toast(`La carte ${v + 1} ne tenait plus : retirée.`); }
    }
  }
  function choisir(i, o) {
    S.brouillon[S.slot] = { i, o }; verifierSuite(S.slot);
    if (S.slot < P.E - 1) S.slot++;
    UI.sel = i; rendre();
  }
  function validerCartes() {
    const j = S.courant;
    S.cartes[j] = S.brouillon.slice();
    S.par[j] = 'humain'; S.fait.push(j); UI.sel = null; S.brouillon = null;
    suiteCartes();
  }
  function clicIndividu(i) {
    if (!S || S.phase !== 'cartes' || S.courant === null) return;
    if (K.proprietaire(P, i) !== S.courant) return;
    UI.sel = UI.sel === i ? null : i; rendre();
  }
  function clicCase(c) {
    if (!S || S.phase !== 'cartes' || S.courant === null || UI.sel === null) return;
    const i = UI.sel; const pos = posPrevues(S.slot)[i];
    if (c === pos) choisir(i, [K.GARDER, pos]);
    else if (PL.dist[pos][c] === 1) choisir(i, [K.ALLER, c]);
  }

  // ------------------------------------------------------------------ rendu de la partie
  function rendre() {
    if (!S) { rendrePreparation(); apercu(); return; }
    const opts = {};
    let mopts = { ev: null };
    if (S.phase === 'cartes' && S.courant !== null) {
      const cs = cartesAvecBrouillon();
      const pos = K.positionsPrevues(P, S.e, cs, S.slot);
      if (cfg.aide) { const f = K.copie(S.e); f.individus = pos; opts.menace = S.slot === 0 && P.presage ? null : menaceVague(f); }
      const allers = [];
      cs.forEach((x) => x.forEach((c, v) => { if (c && c.o[0] === K.ALLER) allers.push([K.positionsPrevues(P, S.e, cs, v)[c.i], c.o[1], v > 0]); }));
      opts.allers = allers;
      opts.cliquables = new Set(B.individusDe(P, S.courant));
      if (UI.sel !== null) opts.cand = new Set([pos[UI.sel]].concat(PL.voisins[pos[UI.sel]]));
      mopts = { L: P.L, presage: P.presage ? S.tirages[tour()][0].map((l) => l.d) : null };
    } else if (S.phase === 'vague') {
      const ev = S.dernier;
      if (ev) { opts.actif = ev.machine; if (ev.issue === 'abattu') opts.cible = ev.cible; else opts.pare = ev.lieu; if (ev.de >= 0 && ev.de !== ev.cible && ev.issue !== 'gardee') opts.trajet = [ev.de, ev.cible]; }
      mopts = { ev };
    } else if (S.phase === 'inter') {
      if (cfg.aide) opts.menace = menaceVague(S.e);
      const allers = []; S.cartes.forEach((cs) => { const c = cs[S.v + 1]; if (c && c.o[0] === K.ALLER) allers.push([S.e.individus[c.i], c.o[1], true]); });
      opts.allers = allers;
      mopts = { L: P.L, appVague: S.appVague, ev: P.rythme === 'vague' ? null : S.dernier };
    } else if (S.phase === 'entre' || S.phase === 'fin') {
      mopts = { appVague: S.appVague, ev: P.rythme === 'vague' ? null : S.dernier };
    }
    dessinerPlateau(S.e, opts);
    rendreMechant(mopts);
    rendreStatus(); rendreAsk(); rendreJoueurs(); rendreJournal();
  }

  function rendreStatus() {
    const tt = Math.min(tour() + (S.phase === 'entre' || S.phase === 'fin' ? 0 : 1), P.tours);
    $('status').innerHTML = `<span>Tour <b>${tt}</b>/${P.tours}</span><span>Forêt <b>${K.foret(S.e)}</b>/${P.c0}</span><span>Parades <b>${S.S}</b></span><button class="opt" id="quit">Nouvelle partie</button>`;
    $('quit').addEventListener('click', () => { S = null; UI.sel = null; rendre(); });
  }

  function rendreAsk() {
    let h = '';
    if (S.phase === 'cartes' && S.courant !== null) {
      const j = S.courant; const v = S.slot;
      h += `<div class="eyebrow" style="color:${COUL(j)}">Joueur ${j + 1} · à toi</div><h2>${P.E > 1 ? 'Tes deux cartes du tour' : 'Ta carte du tour'}</h2>`;
      h += `<p class="ctx">${P.E > 1 ? 'La carte 1 est révélée avant la première vague de lancers, la carte 2 avant la seconde. Entre les deux, les Machines bougent et les pistes apprennent. ' : ''}Clique un de tes pions puis sa case pour <b>garder</b>, ou une case voisine pour y <b>aller</b> ; ou choisis ci-dessous.</p>`;
      if (P.E > 1) {
        h += '<div class="slots">' + S.brouillon.map((c, k) => `<button class="slot ${k === v ? 'on' : ''}" aria-pressed="${k === v}" data-slot="${k}"><span class="eyebrow">Carte ${k + 1} · étape ${k + 1}</span><span>${esc(carteTexte(c))}</span></button>`).join('') + '</div>';
      }
      const pos = posPrevues(v);
      const lu = cfg.aide ? B.lectureEtape(P, PL, S.e, pos, v, ctxBots()) : null;
      const autres = S.cartes.map((cs, k) => (k === j ? null : cs[v])).filter((c) => c);
      const dejaG = (c) => autres.filter((x) => x.o[0] === K.GARDER && x.o[1] === c).length;
      const dejaS = (m) => autres.filter((x) => x.o[0] === K.SABOTER && x.o[1] === m).length;
      for (const i of B.individusDe(P, j)) {
        const ops = optionsSlot(i, v);
        const btn = (o) => {
          const c = S.brouillon[v]; const on = c && c.i === i && c.o[0] === o[0] && c.o[1] === o[1];
          let aide = '';
          if (lu) {
            if (o[0] === K.GARDER) aide = pct(lu.garde(o[1], dejaG(o[1])));
            else if (o[0] === K.SABOTER) aide = pct(lu.sabot(o[1], dejaS(o[1])));
            else aide = 'menace ' + pct(1 - Math.pow(1 - lu.pr[o[1]], P.L));
          }
          return `<button class="opt k-${o[0]}" aria-pressed="${!!on}" data-i="${i}" data-o="${o[0]}" data-a="${o[1]}">${esc(ordreTexte(o))}${aide ? `<span class="val">${aide}</span>` : ''}</button>`;
        };
        const moved = pos[i] !== S.e.individus[i];
        h += `<div class="indrow"><span class="pion" style="background:${COUL(j)}">${String.fromCharCode(97 + (i % P.ipj))}</span><div><div class="small"><b>${nomI(i)}</b> ${moved ? `sera en ${nomC(pos[i])} (après sa carte ${v})` : `en ${nomC(pos[i])}`}, ${S.e.arbres[pos[i]]} arbres</div><div class="btn-row" style="margin-top:4px">${ops.map(btn).join('')}</div></div></div>`;
      }
      if (lu) h += `<p class="small">${lu.certain ? 'Présage : 100 % veut dire qu\'un des dés montrés désigne cette Machine ou cette case (lus sur les pistes actuelles).' : `Garder : chance qu'au moins une menace de la vague frappe la case. Saboter : chance que la Machine agisse dans la vague (${P.L} lancers). Estimations sur les pistes et positions ${v ? 'prévues, sans ce que la vague 1 changera' : 'actuelles'}.`}</p>`;
      h += `<label class="small"><input type="checkbox" id="aide" ${cfg.aide ? 'checked' : ''}> afficher les chances (aide à la lecture des pistes)</label>`;
      const nb = S.brouillon.filter((c) => c).length;
      h += `<div class="btn-row"><button class="btn" id="valider">${nb ? `Valider ${P.E > 1 ? 'mes cartes' : 'ma carte'}` : 'Ne rien faire ce tour'}</button>${S.brouillon[v] ? '<button class="btn sec" id="retirer">Retirer cette carte</button>' : ''}</div>`;
      $('ask').innerHTML = h;
      $('ask').querySelectorAll('button[data-o]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.a === 'null' ? null : +b.dataset.a; choisir(+b.dataset.i, [b.dataset.o, a]); }));
      $('ask').querySelectorAll('button[data-slot]').forEach((b) => b.addEventListener('click', () => { S.slot = +b.dataset.slot; rendre(); }));
      $('aide').addEventListener('change', () => { cfg.aide = $('aide').checked; garderCfg(); rendre(); });
      $('valider').addEventListener('click', validerCartes);
      if ($('retirer')) $('retirer').addEventListener('click', () => { S.brouillon[v] = null; verifierSuite(v); rendre(); });
      return;
    }
    const auto = !S.sieges.includes('humain');
    if (S.phase === 'vague') {
      const ev = S.dernier;
      h += `<div class="eyebrow">${P.E > 1 ? `Vague ${S.v + 1} · ` : ''}lancer ${Math.min(S.pas + 1, P.L)} sur ${P.L}</div>`;
      if (ev) h += `<h2>${ev.issue === 'abattu' ? 'Un arbre tombe' : 'Menace parée'}</h2><p class="ctx">${esc(texteLancer(ev))}</p>${ev.appris ? `<p class="ctx">${ev.issue === 'abattu' ? 'Réussite' : 'Échec'} : ${esc(texteAppris(ev.appris, ev.tactique, ev.machine))}</p>` : ''}`;
      else h += `<h2>Cartes ${P.E > 1 ? S.v + 1 + ' ' : ''}révélées</h2><p class="ctx">Les déplacements ont eu lieu, les gardes et les sabotages sont posés pour cette vague. Le Méchant lance les dés ${P.L} fois : la somme désigne une tactique, l'écart une Machine.</p>`;
      if (S.pose.perdus.length && !ev) h += `<div class="hint warn">${S.pose.perdus.map((x) => esc(`${nomI(x.i)} : ${ordreTexte(x.o)} perdu (${x.pourquoi}).`)).join('<br>')}</div>`;
      h += `<div class="btn-row"><button class="btn" id="suiv">Lancer les dés</button><button class="btn sec" id="vg">Toute la vague</button>${auto ? '<button class="btn sec" id="bout">Jouer jusqu\'au bout</button>' : ''}</div>`;
      $('ask').innerHTML = h;
      $('suiv').addEventListener('click', lancerSuivant); $('vg').addEventListener('click', () => { toutLaVague(); });
      if (auto) $('bout').addEventListener('click', () => { jusquAuBout(); rendre(); });
      return;
    }
    if (S.phase === 'inter') {
      const last = S.etapesTour[S.etapesTour.length - 1]; const par = last.evenements.filter((x) => x.issue !== 'abattu').length;
      h += `<div class="eyebrow">Vague ${S.v + 1} terminée</div><h2>${par} parade${par > 1 ? 's' : ''}, ${P.L - par} arbre${P.L - par > 1 ? 's' : ''} abattu${P.L - par > 1 ? 's' : ''}</h2>`;
      h += `<p class="ctx">Les gardes et les sabotages de l'étape ${S.v + 1} tombent. Les Machines ont bougé et les pistes ont appris : regarde ce qui a changé avant de révéler les cartes ${S.v + 2}. Un sabotage dont la Machine a quitté la case sera perdu.</p>`;
      h += `<div class="btn-row"><button class="btn" id="rev">Révéler les cartes ${S.v + 2}</button>${auto ? '<button class="btn sec" id="bout">Jouer jusqu\'au bout</button>' : ''}</div>`;
      $('ask').innerHTML = h;
      $('rev').addEventListener('click', () => revelerEtape(S.v + 1));
      if (auto) $('bout').addEventListener('click', () => { jusquAuBout(); rendre(); });
      return;
    }
    if (S.phase === 'entre') {
      const last = S.historique[S.historique.length - 1];
      h += `<div class="eyebrow">Tour ${last.tour} terminé</div><h2>${last.parades} parade${last.parades > 1 ? 's' : ''}, ${P.lancersParTour - last.parades} arbre${P.lancersParTour - last.parades > 1 ? 's' : ''} abattu${P.lancersParTour - last.parades > 1 ? 's' : ''}</h2>`;
      h += `<div class="btn-row"><button class="btn" id="next">Tour suivant</button>${auto ? '<button class="btn sec" id="auto">Jouer jusqu\'au bout</button>' : ''}</div>`;
      $('ask').innerHTML = h;
      $('next').addEventListener('click', () => { debutTour(); });
      if (auto) $('auto').addEventListener('click', () => { jusquAuBout(); rendre(); });
      return;
    }
    if (S.phase === 'fin') {
      const r = K.foret(S.e);
      h += `<div class="eyebrow">Partie terminée</div><h2>${r} arbres sur ${P.c0} (${pct(r / P.c0)})</h2>`;
      h += `<p class="ctx">${S.S} parades pour ${P.ordresParTour * P.tours} ordres, soit <b>${pct(S.S / (P.ordresParTour * P.tours))}</b> des ordres qui ont sauvé un arbre. ${S.perdus} ordre${S.perdus > 1 ? 's' : ''} perdu${S.perdus > 1 ? 's' : ''}. ${S.S ? `${pct(S.hors / S.S)} des parades faites hors de sa propre tuile.` : ''}</p>`;
      const mx = Math.max(1, ...S.parJoueur);
      h += '<div class="bars">' + S.parJoueur.map((x, j) => `<div class="barl"><span>Joueur ${j + 1}</span><span class="bart"><span style="width:${(100 * x / mx).toFixed(0)}%;background:${COUL(j)}"></span></span><span class="num">${x}</span></div>`).join('') + '</div>';
      h += `<p class="small">${S.enregistre ? 'Partie enregistrée.' : (UI.db ? 'Enregistrement…' : 'Enregistrement indisponible dans cette vue : exportez la partie depuis l\'onglet « Parties enregistrées ».')}</p>`;
      h += '<div class="btn-row"><button class="btn" id="again">Nouvelle partie</button><button class="btn sec" id="same">Rejouer la même graine</button></div>';
      $('ask').innerHTML = h;
      $('again').addEventListener('click', () => { cfg.reglages.graine = 1 + Math.floor(Math.random() * 99999); garderCfg(); S = null; rendre(); });
      $('same').addEventListener('click', () => { demarrer(); });
    }
  }

  function rendreJoueurs() {
    $('plBox').hidden = false;
    const revele = (v) => S.phase !== 'cartes' && (v < S.v || (v === S.v));
    $('players').innerHTML = S.sieges.map((s, j) => {
      let cartes;
      if (S.phase === 'cartes' && !S.fait.includes(j)) cartes = S.courant === j ? 'pose ses cartes…' : 'attend';
      else cartes = S.cartes[j].map((c, v) => `<span class="${S.phase !== 'cartes' && !revele(v) ? 'cache' : ''}">${P.E > 1 ? `${v + 1}. ` : ''}${esc(carteTexte(c))}</span>`).join(' ');
      return `<div class="pl ${S.courant === j ? 'actif' : ''}"><span class="dot" style="background:${COUL(j)}"></span><span>Joueur ${j + 1} <span class="who">${SIEGES[s]}</span><br><span class="ord">${cartes}</span></span><span class="num small">${S.parJoueur[j]} parade${S.parJoueur[j] > 1 ? 's' : ''}</span></div>`;
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
    return { id: S.id, type: 'partie', modele: 'pistes', date: S.date, version: 1, reglages: S.reglages, sieges: S.sieges, depart: S.depart, tours: S.historique,
      resultat: { foret: K.foret(S.e), c0: P.c0, parades: S.S, taux: S.S / (P.ordresParTour * P.tours), perdus: S.perdus, parJoueur: S.parJoueur, horsTuile: S.hors } };
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
    $('dbState').textContent = UI.db ? 'Chaque partie terminée et chaque série sont enregistrées avec leur journal : réglages, graine, dés, cartes, raisons des bots, lancers, parades et échanges sur les pistes. Claude peut les relire pour les analyser.'
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
  async function exporter(coll, id) { const r = await lire(coll, id); if (r) sauver(`couronne-pistes-${id}.json`, r); else toast('Introuvable.'); }
  $('expAll').addEventListener('click', async () => {
    const tout = [];
    for (const x of (UI.index.length ? UI.index : (UI.local || []).map(resume))) { const r = await lire(x.type === 'serie' ? 'series' : 'parties', x.id); if (r) tout.push(r); }
    sauver('couronne-pistes-tout.json', tout);
  });

  // ------------------------------------------------------------------ séries de bots
  function lancerSerie() {
    if (UI.serie) return;
    const N = +$('serN').value; const Js = $('serJ').value === 'all' ? [2, 3, 4, 5, 6] : [cfg.reglages.joueurs];
    const bots = ['hasard', 'reflexe', 'stratege', 'prevoyant'];
    const taches = []; for (const J of Js) for (let g = 1; g <= N; g++) for (const b of bots) taches.push([J, g, b]);
    const acc = {}; let k = 0;
    UI.serie = true; $('runSerie').disabled = true;
    const pas = () => {
      const t0 = performance.now();
      while (k < taches.length && performance.now() - t0 < 40) {
        const [J, g, b] = taches[k++];
        const reg = Object.assign({}, cfg.reglages, { joueurs: J, graine: 1000 + g });
        const r = B.partieAuto(reg, b);
        const a = acc[J + '|' + b] = acc[J + '|' + b] || { J, b, n: 0, taux: 0, foret: 0, agence: 0, couplage: 0, perdus: 0 };
        a.n++; a.taux += r.taux; a.foret += r.foret; a.agence += r.agence; a.couplage += r.couplage; a.perdus += r.perdus;
      }
      $('serieProg').textContent = `${Math.floor(k / bots.length)} / ${taches.length / bots.length} tables`;
      if (k < taches.length) { setTimeout(pas, 0); return; }
      UI.serie = null; $('runSerie').disabled = false;
      const lignes = Object.values(acc).map((a) => ({ joueurs: a.J, bot: a.b, parties: a.n, taux: a.taux / a.n, foret: a.foret / a.n, agence: a.agence / a.n, couplage: a.couplage / a.n, perdus: a.perdus / a.n }));
      afficherSerie(lignes, Js);
      const rec = { id: 's' + Date.now().toString(36), type: 'serie', modele: 'pistes', date: new Date().toISOString(), reglages: cfg.reglages, parties: N, lignes };
      UI.local = UI.local || []; UI.local.unshift(rec);
      if (UI.db) UI.db.collection('series').doc(rec.id).set(rec).then(() => UI.db.collection('index').doc(rec.id).set(resume(rec))).then(() => toast('Série enregistrée.')).catch(() => {});
      else rendreArchives();
    };
    pas();
  }
  function afficherSerie(lignes, Js) {
    const NB = { hasard: 'Hasard', reflexe: 'Réflexe', stratege: 'Glouton', prevoyant: 'Prévoyant' };
    let h = '<div class="eyebrow">Résultats</div><h2>Ordres qui ont paré une menace</h2><div class="tw"><table class="res num"><thead><tr><th>Joueurs</th>'
      + Object.values(NB).map((n) => `<th>${n}</th>`).join('') + '<th>Forêt*</th><th>Perdus*</th><th>Agence*</th><th>Couplage*</th></tr></thead><tbody>';
    for (const J of Js) {
      const L = (b) => lignes.find((x) => x.joueurs === J && x.bot === b);
      const pv = L('prevoyant');
      h += `<tr><td>${J}</td>` + Object.keys(NB).map((b) => `<td>${pct(L(b).taux)}</td>`).join('') + `<td>${pct(pv.foret)}</td><td>${f1(pv.perdus)}</td><td>${pct(pv.agence)}</td><td>${pct(pv.couplage)}</td></tr>`;
    }
    h += '</tbody></table></div><p class="small">* pour le bot prévoyant. Forêt : arbres restants en fin de partie. Perdus : ordres perdus par partie (un sabotage dont la Machine est partie). Agence : part des joueurs qui ont paré au moins une menace. Couplage : part des parades faites hors de sa tuile.</p>';
    const ecarts = Js.map((J) => { const a = lignes.find((x) => x.joueurs === J && x.bot === 'prevoyant'), b = lignes.find((x) => x.joueurs === J && x.bot === 'reflexe'); return 100 * (a.taux - b.taux); });
    h += `<div class="verdict">Prévoyant moins Réflexe : ${ecarts.map((x, n) => `${Js[n]} joueurs ${x >= 0 ? '+' : ''}${f1(x)} pt`).join(' · ')}. C'est ce que rapporte de prévoir la vague suivante et le tour suivant.</div>`;
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
    if (data && data.S && data.S.tirages) { S = data.S; cfg = data.cfg || cfg; P = K.params(S.reglages); PL = K.plateau(P); construirePlateau(P, PL); }
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
