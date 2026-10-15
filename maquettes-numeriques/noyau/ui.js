/* La Forêt qui rêve, noyau N1 : la page jouable (plateau animé, saisie, séries, enregistrement). */
(function () {
  'use strict';
  const N = window.Noyau, B = window.NoyauBots;
  const { ZONES, VOISINS, FLECHE, PEUPLES, ORDRE_PEUPLES, nomZ } = N;
  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs, html) => { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PROFILS = B.PROFILS;
  const POS = { 1: [95, 140], 2: [320, 130], 3: [545, 140], 4: [190, 295], 5: [450, 295], 6: [190, 455], 7: [450, 455] };
  const R = 66;
  const ABR = { 'Cupidité': ['Cupid.', 'cup'], 'Opportunisme': ['Oppor.', 'opp'], 'Représailles': ['Repré.', 'rep'], 'Percée': ['Percée', 'per'] };
  const ABANDON = new Error('abandon');
  const fr = (x) => String(x).replace('.', ',');

  // ------------------------------------------------------------ état de la page
  const UI = {
    partie: null, mode: 'setup', vitesse: 'normal', pending: null, abort: false, next: null, vise: null, pvise: null,
    ordreTrace: null, cfg: null, enregistre: false, derniere: null, db: null, dl: null, index: [], session: [],
  };
  const VITESSES = { pas: { nom: 'Pas à pas', ms: 0 }, lent: { nom: 'Lent', ms: 1100 }, normal: { nom: 'Normal', ms: 550 }, rapide: { nom: 'Rapide', ms: 160 }, instant: { nom: 'Instantané', ms: 0 } };
  const MAJEURS = new Set(['presage', 'voir', 'revele', 'reve', 'annule', 'des', 'ordre', 'apprend', 'sabotage', 'hs', 'egaree', 'barrer', 'aller', 'saboter_decl', 'sommeil', 'fin', 'pion']);

  function cfgDefaut() {
    return {
      sieges: ORDRE_PEUPLES.map((p) => ({ peuple: p, actif: ['oiseaux', 'mammiferes', 'reptiles'].includes(p), type: p === 'oiseaux' ? 'humain' : 'bot', profil: 'lecteur' })),
      params: Object.assign({}, N.PARAMS), graine: '',
    };
  }
  try { UI.vitesse = localStorage.getItem('noyau.vitesse') || 'normal'; } catch (e) { /* pas de stockage */ }
  if (!VITESSES[UI.vitesse]) UI.vitesse = 'normal';
  UI.cfg = cfgDefaut();

  function toast(t) { const x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { x.hidden = true; }, 3200); }

  // ------------------------------------------------------------ onglets
  document.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener('click', () => ouvrirOnglet(b.id.slice(4))));
  function ouvrirOnglet(nom) {
    document.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.id === 'tab-' + nom)));
    document.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== 'pan-' + nom; });
    if (nom === 'archives') renderArchives();
  }
  if (['series', 'archives', 'regles'].includes(location.hash.slice(1))) ouvrirOnglet(location.hash.slice(1));

  // ------------------------------------------------------------ plateau (SVG)
  const svg = $('#plateau');
  function construirePlateau() {
    let h = `<defs><marker id="tete" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--danger)"/></marker>
      <marker id="fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--wake)"/></marker></defs>`;
    h += `<rect class="svg-chantier" x="8" y="6" width="624" height="46" rx="10"/><text class="svg-small" x="20" y="24">CHANTIER</text><text class="svg-small" x="20" y="40">et Machines égarées</text>`;
    const vus = new Set();
    for (const a in VOISINS) for (const b of VOISINS[a]) {
      const k = Math.min(a, b) + '-' + Math.max(a, b); if (vus.has(k)) continue; vus.add(k);
      const [x1, y1] = POS[a], [x2, y2] = POS[b];
      h += `<line class="svg-link" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    for (const a in FLECHE) {
      const b = FLECHE[a]; if (!b) continue;
      const [x1, y1] = POS[a], [x2, y2] = POS[b], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
      const ux = dx / d, uy = dy / d, mx = x1 + dx / 2, my = y1 + dy / 2;
      h += `<line class="svg-fleche" x1="${mx - ux * 14}" y1="${my - uy * 14}" x2="${mx + ux * 14}" y2="${my + uy * 14}" marker-end="url(#fl)"/>`;
    }
    for (let z = 1; z <= 7; z++) {
      const [x, y] = POS[z];
      h += `<g data-zone="${z}"><circle id="zc${z}" class="svg-zone d${ZONES[z].prof}" cx="${x}" cy="${y}" r="${R}"><title>${esc(nomZ(z))} (zone ${z})</title></circle>
        <text class="svg-name" x="${x}" y="${y - 42}" text-anchor="middle">${z} · ${esc(nomZ(z))}</text></g>`;
    }
    h += `<g id="dyn"></g><g id="trace"></g><g id="machs"></g>`;
    svg.innerHTML = h;
    for (const m of N.MACHINES) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'm' + m.id); g.setAttribute('class', 'svg-mach');
      g.innerHTML = `<rect x="0" y="0" width="104" height="21" rx="6"/><text x="6" y="14.5">${esc(m.nom)}</text><g class="orgs"></g>`;
      $('#machs').appendChild(g);
    }
    svg.addEventListener('click', (ev) => {
      const g = ev.target.closest && ev.target.closest('[data-zone]');
      if (!g || !UI.pending) return;
      const z = +g.getAttribute('data-zone');
      const opts = UI.pending.req.options.filter((o) => o.zone === z && (UI.pending.req.type === 'placer'));
      if (opts.length === 1) repondre(opts[0].id);
    });
  }

  function renderPlateau() {
    const P = UI.partie, E = P ? P.etat : null;
    const f = E ? E.f : Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((z) => [z, ZONES[z].f]));
    let h = '';
    const cands = new Set(UI.pending && UI.pending.req.type === 'placer' ? UI.pending.req.options.map((o) => o.zone) : []);
    for (let z = 1; z <= 7; z++) {
      const c = $('#zc' + z);
      c.setAttribute('class', `svg-zone d${ZONES[z].prof}${cands.has(z) ? ' cand' : ''}${UI.vise && UI.vise.cible === z ? ' cible' : ''}`);
      const [x, y] = POS[z], tot = ZONES[z].f, reste = f[z];
      const larg = tot * 12, x0 = x - larg / 2 + 6;
      for (let i = 0; i < tot; i++) {
        const cx = x0 + i * 12, cy = y - 22;
        h += i < reste ? `<path class="svg-tree" d="M${cx},${cy - 9} L${cx + 5},${cy + 3} L${cx - 5},${cy + 3} Z"/>` : `<rect class="svg-stump" x="${cx - 3}" y="${cy - 1}" width="6" height="4" rx="1"/>`;
      }
      if (E && E.barres.includes(z)) h += `<circle class="svg-barre" cx="${x}" cy="${y}" r="${R + 5}"/><text class="svg-small" x="${x}" y="${y + R + 4}" text-anchor="middle" style="fill:var(--danger)">barrée</text>`;
      if (E) {
        const pions = [];
        P.peuples.forEach((p) => E.pions[p].forEach((pz) => { if (pz === z) pions.push(p); }));
        const n = pions.length, w = Math.min(15, 104 / Math.max(1, n));
        pions.forEach((p, i) => {
          const cx = x - ((n - 1) * w) / 2 + i * w;
          h += `<circle cx="${cx}" cy="${y - 4}" r="6.5" fill="var(--p-${p})" stroke="var(--card)" stroke-width="1.5"><title>${esc(PEUPLES[p].nom)}</title></circle>`;
        });
      }
    }
    $('#dyn').innerHTML = h;
    // trace de l'ordre en cours
    let t = '';
    if (UI.vise && UI.vise.type === 'abattre' && UI.vise.depuis) {
      const [x1, y1] = POS[UI.vise.depuis], [x2, y2] = POS[UI.vise.cible];
      if (UI.vise.depuis !== UI.vise.cible) {
        const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
        t += `<line class="svg-ordre" x1="${x1 + (dx / d) * 30}" y1="${y1 + (dy / d) * 30}" x2="${x2 - (dx / d) * 40}" y2="${y2 - (dy / d) * 40}"/>`;
      }
    } else if (UI.vise && UI.vise.type === 'entree') {
      const [x2, y2] = POS[UI.vise.cible];
      t += `<line class="svg-ordre" x1="${x2}" y1="52" x2="${x2}" y2="${y2 - R - 6}"/>`;
    }
    $('#trace').innerHTML = t;
    // Machines
    const parZone = {}; let nCh = 0;
    for (const m of N.MACHINES) {
      const g = $('#m' + m.id);
      const mm = E ? E.mach.find((x) => x.id === m.id) : { etat: m.id <= 3 ? 'marche' : 'chantier', zone: m.id <= 3 ? m.entree : null, org: Object.fromEntries(m.organes.map((o) => [o, true])) };
      let x, y;
      if (mm.etat === 'marche' || mm.etat === 'hs') {
        const i = (parZone[mm.zone] = (parZone[mm.zone] || 0) + 1) - 1;
        x = POS[mm.zone][0] - 52; y = POS[mm.zone][1] + 10 + i * 24;
      } else { x = 150 + nCh * 96; y = 18; nCh++; }
      g.style.transform = `translate(${x}px,${y}px)`;
      g.setAttribute('class', 'svg-mach' + (mm.etat === 'hs' || mm.etat === 'egaree' ? ' hs' : ''));
      g.style.opacity = mm.etat === 'egaree' ? '.45' : '1';
      const orgs = Object.keys(mm.org);
      g.querySelector('.orgs').innerHTML = orgs.map((o, i) => `<circle class="svg-org${mm.org[o] ? '' : ' off'}" cx="${96 - (orgs.length - 1 - i) * 9}" cy="10.5" r="3.3"><title>${o}${mm.org[o] ? '' : ' neutralisé'}</title></circle>`).join('');
      g.querySelector('text').textContent = m.nom + (mm.etat === 'hs' ? ' (HS)' : mm.etat === 'egaree' ? ' (égarée)' : '');
      g.querySelector('rect').setAttribute('width', mm.etat === 'egaree' || mm.etat === 'hs' ? 120 : 104);
    }
  }

  function renderPistes() {
    const P = UI.partie, E = P ? P.etat : null;
    let h = '';
    for (let c = 2; c <= 12; c++) {
      const t = E ? E.piste[c] : { k: 'tactique', nom: N.PISTE0[c] };
      const [ab, cl] = t.k === 'esprit' ? ['Esprit', 'esp'] : ABR[t.nom];
      h += `<div class="case ${cl}${c === 7 ? ' c7' : ''}${UI.pvise && UI.pvise.somme === c ? ' vise' : ''}" title="${esc(t.k === 'esprit' ? 'Esprit' : t.nom)} en ${c}"><span class="n">${c}</span>${ab}</div>`;
    }
    $('#piste').innerHTML = h;
    h = '';
    for (let c = 1; c <= 5; c++) {
      const id = E ? E.pisteM[c] : c, m = E ? E.mach.find((x) => x.id === id) : { nom: N.MACHINES[c - 1].nom, etat: c <= 3 ? 'marche' : 'chantier' };
      const cl = m.etat === 'hs' || m.etat === 'egaree' ? ' hs' : m.etat === 'chantier' ? ' ch' : '';
      h += `<div class="case mach${cl}${UI.pvise && UI.pvise.caseM === c ? ' vise' : ''}" title="${esc(m.nom)} (${m.etat})"><span class="n">${c}${c === 1 ? ' · favori' : ''}</span>${esc(m.nom)}</div>`;
    }
    $('#pisteM').innerHTML = h;
    // dés connus
    let d = '';
    if (E && E.des) {
      for (const e of [1, 2, 3]) if (E.des[e]) d += `<span>Étape ${e}</span><span class="de${e <= 2 && E.etape < e ? ' p' : ''}">${E.des[e][0]}</span><span class="de${e <= 2 && E.etape < e ? ' p' : ''}">${E.des[e][1]}</span>`;
    }
    $('#des').innerHTML = d || '<span>Aucun dé lancé.</span>';
    const dist = E ? P.distanceSommeil() : 6;
    $('#dlbl').textContent = E && P.esprits().length ? `esprit de tête à ${dist} case${dist > 1 ? 's' : ''} du sommeil` : 'aucun esprit';
  }

  function renderStatus() {
    const P = UI.partie;
    if (!P) { $('#status').innerHTML = '<span>Préparation</span>'; return; }
    const E = P.etat;
    $('#status').innerHTML = `<span>Tour <b>${E.tour || '–'}</b>/${P.params.tours}</span><span>Étape <b>${E.etape || '–'}</b></span><span>Forêt <b>${P.foret()}</b>/21</span><span>Ordres par étape <b>${N.valeurTable(P.params.ordres_par_etape, P.peuples.length)}</b></span>`;
  }

  function renderJoueurs() {
    const P = UI.partie, box = $('#players');
    if (!P) {
      const actifs = UI.cfg.sieges.filter((s) => s.actif);
      box.innerHTML = actifs.map((s) => `<div class="pl"><span class="dot" style="background:var(--p-${s.peuple})"></span><span>${PEUPLES[s.peuple].nom} <span class="who">${s.type === 'humain' ? 'vous' : 'bot ' + PROFILS[s.profil].nom}</span></span><span class="small">${PEUPLES[s.peuple].pouvoir}</span></div>`).join('') || '<div class="small">Aucun peuple choisi.</div>';
      return;
    }
    const E = P.etat, cur = UI.pending ? UI.pending.req.p : null;
    box.innerHTML = P.ordre().map((p, i) => {
      const s = P.siege(p), prog = E.prog[p] || [null, null, null];
      const cartes = [1, 2, 3].map((e) => {
        const m = prog[e - 1];
        const vu = m && (e < E.etape || (e === E.etape && E.cartes.some((c) => c.p === p)) || P.etat.fin);
        const cls = !m ? '' : vu ? (m === 'rever' ? 'r' : 'a') : '';
        const lbl = !m ? '' : vu ? (m === 'rever' ? 'R' : 'A') : '?';
        return `<i class="${cls}${E.etape === e && E.tour ? ' cur' : ''}" title="étape ${e}">${lbl}</i>`;
      }).join('');
      return `<div class="pl${cur === p ? ' actif' : ''}"><span class="dot" style="background:var(--p-${p})"></span>
        <span>${i === 0 ? '<b>' : ''}${PEUPLES[p].nom}${i === 0 ? '</b> · 1er' : ''} <span class="who">${s.type === 'humain' ? 'vous' : 'bot ' + PROFILS[s.profil].nom} · main ${E.main[p]} · rêves ${E.reves[p]} · ${PEUPLES[p].pouvoir}</span></span>
        <span class="cards">${cartes}</span></div>`;
    }).join('');
  }

  // ------------------------------------------------------------ journal
  function ligneJournal(ev) {
    const d = el('div', { class: `jl k-${ev.k}${ev.k === 'ordre' ? (ev.ok ? ' ok' : ev.ok === false ? ' ko' : '') : ''}` });
    let h = '';
    if (ev.k === 'decision') {
      const tag = ev.auto ? '<span class="tag auto">auto</span>' : ev.joueur === 'humain' ? '<span class="tag">vous</span>' : `<span class="tag bot">bot ${esc(PROFILS[ev.joueur] ? PROFILS[ev.joueur].nom : ev.joueur)}</span>`;
      h = tag + esc(ev.txt);
      if (ev.pourquoi && ev.joueur !== 'humain' && !ev.auto) {
        h += ev.type === 'programme'
          ? `<details class="why"><summary>raisonnement (révèle le programme : ${ev.prog.map((x) => x === 'rever' ? 'rêve' : x === 'agir' ? 'agit' : '—').join(' / ')})</summary>${esc(ev.pourquoi)}</details>`
          : `<span class="why">${esc(ev.pourquoi)}</span>`;
      }
    } else h = esc(ev.txt);
    d.innerHTML = h;
    return d;
  }
  function renderJournal(complet) {
    const j = $('#journal');
    if (complet) { j.innerHTML = ''; if (UI.partie) UI.partie.ev.forEach((ev) => j.appendChild(ligneJournal(ev))); }
    j.classList.toggle('nowhy', !$('#showWhy').checked);
    j.querySelectorAll('.why').forEach((w) => { w.hidden = !$('#showWhy').checked; });
  }
  $('#showWhy').addEventListener('change', () => renderJournal(false));

  // ------------------------------------------------------------ panneau « à faire »
  function controles() {
    const v = Object.entries(VITESSES).map(([k, x]) => `<option value="${k}"${k === UI.vitesse ? ' selected' : ''}>${x.nom}</option>`).join('');
    return `<div class="btn-row"><label class="small" for="vit">Vitesse</label><select id="vit">${v}</select>
      ${UI.vitesse === 'pas' && UI.next ? '<button class="btn" id="suivant">Suivant</button>' : ''}
      ${UI.vitesse !== 'pas' && UI.mode === 'jeu' ? '<button class="btn sec" id="pause">Pause</button>' : ''}
      ${UI.mode === 'jeu' ? '<button class="btn sec" id="abandon">Abandonner</button>' : ''}</div>`;
  }
  function brancherControles() {
    const v = $('#vit'); if (v) v.addEventListener('change', () => { UI.vitesse = v.value; try { localStorage.setItem('noyau.vitesse', v.value); } catch (e) { /* rien */ } if (UI.vitesse !== 'pas' && UI.next) { const n = UI.next; UI.next = null; n(); } renderAsk(); });
    const s = $('#suivant'); if (s) s.addEventListener('click', () => { const n = UI.next; UI.next = null; if (n) n(); });
    const pz = $('#pause'); if (pz) pz.addEventListener('click', () => { UI.vitesse = 'pas'; renderAsk(); });
    const a = $('#abandon'); if (a) a.addEventListener('click', () => { if (a.dataset.ok) { abandonner(); } else { a.dataset.ok = '1'; a.textContent = 'Confirmer l\'abandon'; } });
  }

  function renderAsk() {
    const box = $('#ask');
    if (UI.mode === 'setup') { renderSetup(box); return; }
    if (UI.mode === 'fini') { renderFin(box); return; }
    const pe = UI.pending;
    if (!pe) {
      const P = UI.partie, E = P.etat;
      box.className = 'box ask';
      box.innerHTML = `<div class="eyebrow">Le jeu avance tout seul</div><p class="ctx">${UI.vitesse === 'pas' ? 'Cliquez sur « Suivant » pour voir l\'événement suivant.' : 'Les bots jouent et la page applique les règles ; tout est écrit dans le journal.'} Tour ${E.tour || 0}, étape ${E.etape || '–'}.</p>${controles()}`;
      brancherControles();
      return;
    }
    const { req } = pe, p = req.p, P = UI.partie, E = P.etat;
    box.className = 'box ask p-humain';
    let h = `<div class="eyebrow" style="color:var(--p-${p})">${esc(PEUPLES[p].nom)} · à vous</div>`;
    if (req.type === 'placer') {
      h += `<h2>Posez un pion (${E.pions[p].length + 1} sur ${P.params.pions})</h2><p class="ctx">Cliquez une zone du plateau ou un bouton.</p><div class="opts">${req.options.map((o) => `<button class="opt" data-id="${o.id}">${esc(nomZ(o.zone))} <span class="small">· ${P.presence(o.zone)} pion${P.presence(o.zone) > 1 ? 's' : ''}</span></button>`).join('')}</div>`;
    } else if (req.type === 'programme') {
      h += programmeHTML(req);
    } else if (req.type === 'action') {
      h += actionHTML(req);
    } else if (req.type === 'esprit') {
      h += `<h2>Le Méchant rêve : quel esprit ?</h2><p class="ctx">Un même esprit bouge au plus ${P.params.avances_par_tour} fois par tour ; un nouvel esprit fait oublier la tuile du 12.</p><div class="opts">${req.options.map((o) => `<button class="opt" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>`;
    } else if (req.type === 'tromper') {
      h += `<h2>Tromper le Méchant ?</h2><p class="ctx">L'ordre a ${req.ctx.ok ? '<b>réussi</b>' : '<b>échoué</b>'}. En le trompant, sa tactique apprend l'inverse.</p><div class="opts">${req.options.map((o) => `<button class="opt" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>`;
    }
    if (req.type !== 'programme') h += `<div class="btn-row"><button class="btn sec" id="conseil">Que ferait le bot Lecteur ?</button></div><div id="conseilTxt"></div>`;
    h += controles();
    box.innerHTML = h;
    box.querySelectorAll('.opt[data-id]').forEach((b) => b.addEventListener('click', () => repondre(b.dataset.id)));
    const c = $('#conseil');
    if (c) c.addEventListener('click', () => {
      const r = B.decider(P, p, req.type, req.options, req.ctx || {});
      $('#conseilTxt').innerHTML = `<div class="hint"><b>${esc(r.choix.label)}</b> : ${esc(r.pourquoi)}</div>`;
    });
    if (req.type === 'programme') brancherProgramme(req);
    brancherControles();
  }

  function planTexte(e) {
    const P = UI.partie, E = P.etat;
    if (!E.des[e]) return '<span class="small">dés inconnus</span>';
    return `<span class="small">${esc(P.decrirePlan(P.plan(E.des[e])))}</span>`;
  }
  function programmeHTML(req) {
    const P = UI.partie, E = P.etat, p = req.p;
    UI.prog = [null, null, null];
    let h = `<h2>Programmez vos cartes</h2><p class="ctx">Main : <b>${E.main[p]}</b> carte${E.main[p] > 1 ? 's' : ''}. Au plus une carte par étape, au plus ${P.params.reves_par_tour} rêve par tour. Une carte qui agit revient en main ; une carte qui rêve est perdue, mais annule un ordre de son étape.</p><div class="prog">`;
    for (const e of [1, 2, 3]) {
      h += `<div class="prow"><span>Étape ${e}</span><div><div class="seg" data-e="${e}"><button data-v="" aria-pressed="true">Rien</button><button data-v="agir" aria-pressed="false">Agir</button><button class="r" data-v="rever" aria-pressed="false">Rêver</button></div>${planTexte(e)}</div></div>`;
    }
    h += `</div><div class="btn-row"><button class="btn" id="valider">Valider le programme</button><button class="btn sec" id="conseilProg">Que ferait le bot Lecteur ?</button></div><div id="conseilTxt"></div><p class="small" id="progMsg"></p>`;
    return h;
  }
  function brancherProgramme(req) {
    const P = UI.partie, E = P.etat, p = req.p;
    const maj = () => {
      const n = UI.prog.filter(Boolean).length, r = UI.prog.filter((x) => x === 'rever').length;
      document.querySelectorAll('.seg[data-e]').forEach((s) => {
        const e = +s.dataset.e;
        s.querySelectorAll('button').forEach((b) => {
          const v = b.dataset.v || null;
          b.setAttribute('aria-pressed', String(UI.prog[e - 1] === v));
          const ajoute = v && !UI.prog[e - 1];
          b.disabled = (ajoute && n >= E.main[p]) || (v === 'rever' && UI.prog[e - 1] !== 'rever' && r >= P.params.reves_par_tour);
        });
      });
      $('#progMsg').textContent = `${n} carte${n > 1 ? 's' : ''} posée${n > 1 ? 's' : ''}, dont ${r} en rêve.`;
    };
    document.querySelectorAll('.seg[data-e] button').forEach((b) => b.addEventListener('click', () => { const e = +b.parentNode.dataset.e; UI.prog[e - 1] = b.dataset.v || null; maj(); }));
    $('#valider').addEventListener('click', () => repondre(UI.prog.slice()));
    $('#conseilProg').addEventListener('click', () => {
      const r = B.programmer(P, [p])[p];
      $('#conseilTxt').innerHTML = `<div class="hint"><b>${r.prog.map((x, i) => `Étape ${i + 1} : ${x === 'rever' ? 'rêver' : x === 'agir' ? 'agir' : 'rien'}`).join(' · ')}</b><br>${esc(r.pourquoi.join(' '))}</div>`;
    });
    maj();
  }
  function actionHTML(req) {
    const P = UI.partie, E = P.etat, e = E.etape, ctx = req.ctx || {};
    let connu = '';
    if (ctx.plans && ctx.plans.length) connu = ctx.plans.map((pl) => esc(P.decrirePlan(pl))).join(' ; ');
    else if (E.des[e] && !(ctx.annules > 0)) connu = esc(P.decrirePlan(P.plan(E.des[e])));
    const allies = E.decl.filter((d) => d.p !== req.p).map((d) => `${PEUPLES[d.p].nom} en ${nomZ(d.zone)}`);
    let h = `<h2>Étape ${e} : que fait votre carte ?</h2><p class="ctx">${ctx.annule ? '<b>Tous les ordres de l\'étape sont annulés par un rêve.</b> ' : ctx.annules ? `<b>${ctx.annules} ordre${ctx.annules > 1 ? 's' : ''} annulé${ctx.annules > 1 ? 's' : ''} par un rêve.</b> ` : ''}${connu ? `Ordre connu : ${connu}.` : 'Les dés de cette étape ne sont pas encore connus.'}${allies.length ? `<br>Déjà joués : ${esc(allies.join(', '))}.` : ''}${req.p === 'reptiles' && ctx.plans ? '<br>Vous avez attendu les dés.' : ''}</p>`;
    const groupes = [['barrer', 'Barrer'], ['saboter', 'Saboter'], ['aller', 'Aller']];
    for (const [k, nom] of groupes) {
      const o = req.options.filter((x) => x.kind === k);
      if (!o.length) continue;
      h += `<div class="grp"><span>${nom}</span><div class="opts">${o.map((x) => `<button class="opt k-${k}" data-id="${x.id}">${esc(x.label.replace(/^(Barrer|Saboter|Aller de) /, ''))}</button>`).join('')}</div></div>`;
    }
    return h;
  }

  function repondre(val) {
    const pe = UI.pending; if (!pe) return;
    UI.pending = null;
    pe.res(val);
    renderTout(false);
  }

  // ------------------------------------------------------------ préparation
  function renderSetup(box) {
    box.className = 'box ask';
    const c = UI.cfg;
    let h = `<div class="eyebrow">Nouvelle partie</div><h2>Qui est à la table ?</h2><p class="ctx">De 2 à 6 peuples. Choisissez « vous » pour les peuples que vous jouez (vous pouvez les jouer tous), ou un profil de bot.</p><div class="setup">`;
    c.sieges.forEach((s, i) => {
      h += `<div class="seat"><label><input type="checkbox" data-i="${i}" class="actif"${s.actif ? ' checked' : ''}><span class="dot" style="width:12px;height:12px;border-radius:50%;background:var(--p-${s.peuple})"></span></label>
        <div><div>${PEUPLES[s.peuple].nom}</div><div class="pw">${PEUPLES[s.peuple].pouvoir} : ${esc(PEUPLES[s.peuple].court)}</div></div>
        <select data-i="${i}" class="qui" aria-label="Qui joue les ${PEUPLES[s.peuple].nom}">${['humain', 'lecteur', 'defenseur', 'reveur', 'hasard'].map((k) => `<option value="${k}"${(s.type === 'humain' ? 'humain' : s.profil) === k ? ' selected' : ''}>${k === 'humain' ? 'Vous' : 'Bot ' + PROFILS[k].nom}</option>`).join('')}</select></div>`;
    });
    h += `</div><details class="reg"><summary>Réglages d'étude</summary><div class="params" style="margin-top:8px">${formParams(c.params, 'p')}</div></details>
      <div class="btn-row"><label class="small" for="graine">Graine</label><input type="text" id="graine" placeholder="au hasard" value="${esc(c.graine)}" style="width:9em"><button class="btn" id="go">Commencer la partie</button><span class="small" id="setupMsg"></span></div>${controles()}`;
    box.innerHTML = h;
    box.querySelectorAll('.actif').forEach((x) => x.addEventListener('change', () => { c.sieges[+x.dataset.i].actif = x.checked; renderJoueurs(); }));
    box.querySelectorAll('.qui').forEach((x) => x.addEventListener('change', () => { const s = c.sieges[+x.dataset.i]; if (x.value === 'humain') s.type = 'humain'; else { s.type = 'bot'; s.profil = x.value; } renderJoueurs(); }));
    brancherParams(box, c.params, 'p');
    $('#graine').addEventListener('input', (e) => { c.graine = e.target.value.trim(); });
    $('#go').addEventListener('click', () => {
      const n = c.sieges.filter((s) => s.actif).length;
      if (n < 2) { $('#setupMsg').textContent = 'Il faut au moins deux peuples.'; return; }
      lancerPartie();
    });
    brancherControles();
  }
  const CHAMPS = [
    ['tours', 'Tours', [4, 5, 6, 7, 8]], ['main', 'Cartes en main', [3, 4, 5]], ['pions', 'Pions de présence', [2, 3, 4]],
    ['machines_depart', 'Machines en jeu au départ', [2, 3, 4, 5]],
    ['ordres_par_etape', 'Ordres par étape', [['n/2', 'moitié des joueurs'], [1, '1'], [2, '2'], ['n-1', 'joueurs moins 1']]],
    ['avances_par_tour', 'Avances d\'un esprit par tour', [1, 2, [9, 'sans limite']]], ['reves_par_tour', 'Rêves par joueur et par tour', [1, 2]],
    ['barrage', 'Barrage', [['entrer_abattre', 'entrer et abattre'], ['complet', 'complet (aussi sortir)']]],
    ['reve_annule', 'Le rêve annule un ordre', [[true, 'oui'], [false, 'non']]], ['presage', 'Présage', [[true, 'oui'], [false, 'non']]],
  ];
  function formParams(params, pre) {
    return CHAMPS.map(([k, nom, vals]) => `<label>${nom}<select id="${pre}-${k}" data-k="${k}">${vals.map((v) => { const [val, lib] = Array.isArray(v) ? v : [v, String(v)]; return `<option value='${JSON.stringify(val)}'${JSON.stringify(params[k]) === JSON.stringify(val) ? ' selected' : ''}>${lib}${JSON.stringify(N.PARAMS[k]) === JSON.stringify(val) ? ' (défaut)' : ''}</option>`; }).join('')}</select></label>`).join('');
  }
  function brancherParams(box, params, pre) {
    box.querySelectorAll(`select[id^="${pre}-"]`).forEach((s) => s.addEventListener('change', () => { params[s.dataset.k] = JSON.parse(s.value); }));
  }

  // ------------------------------------------------------------ déroulement
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let compteur = 0;
  const io = {
    async show(ev) {
      if (UI.abort) throw ABANDON;
      if (ev.k === 'des' || ev.k === 'presage' || ev.k === 'voir' || ev.k === 'annule') { UI.vise = ev.plan || null; UI.pvise = ev.plan || null; }
      if (ev.k === 'revele' || ev.k === 'phase') { UI.vise = null; UI.pvise = null; }
      $('#journal').appendChild(ligneJournal(ev));
      renderJournal(false);
      const j = $('#journal'); j.scrollTop = j.scrollHeight;
      const majeur = MAJEURS.has(ev.k) || (ev.k === 'decision' && ev.joueur !== 'humain' && ev.type !== 'programme');
      if (UI.vitesse === 'instant') { if (++compteur % 40 === 0) { renderTout(false); await sleep(0); } }
      else {
        renderTout(false);
        if (majeur) {
          if (UI.vitesse === 'pas') { await new Promise((r) => { UI.next = r; renderAsk(); }); }
          else await sleep(VITESSES[UI.vitesse].ms * (ev.k === 'decision' || ev.k === 'pion' ? 0.6 : 1));
        }
      }
      if (UI.abort) throw ABANDON;
      if (ev.k === 'ordre') { UI.vise = null; }
    },
    ask(req) {
      if (UI.abort) return Promise.reject(ABANDON);
      return new Promise((res, rej) => { UI.pending = { req, res, rej }; renderTout(false); $('#ask').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    },
  };

  async function lancerPartie(graineForcee) {
    const c = UI.cfg;
    const sieges = c.sieges.filter((s) => s.actif).map((s) => ({ peuple: s.peuple, type: s.type, profil: s.type === 'humain' ? 'lecteur' : s.profil }));
    const g = graineForcee != null ? graineForcee : (c.graine && !isNaN(+c.graine) ? +c.graine : undefined);
    UI.partie = new N.Partie({ sieges, params: Object.assign({}, c.params), graine: g }, io);
    UI.mode = 'jeu'; UI.abort = false; UI.pending = null; UI.next = null; UI.vise = null; UI.pvise = null; UI.enregistre = false;
    renderJournal(true); renderTout(true);
    try {
      await UI.partie.jouer();
      UI.mode = 'fini';
      await enregistrer(UI.partie, 'terminée');
    } catch (e) {
      if (e !== ABANDON) { console.error(e); toast('Erreur du moteur : ' + e.message); }
      UI.mode = 'fini';
      if (UI.partie && UI.partie.ev.length > 5) await enregistrer(UI.partie, e === ABANDON ? 'abandonnée' : 'erreur');
    }
    renderTout(false);
  }
  function abandonner() {
    UI.abort = true;
    if (UI.pending) { const p = UI.pending; UI.pending = null; p.rej(ABANDON); }
    if (UI.next) { const n = UI.next; UI.next = null; n(); }
  }

  function renderFin(box) {
    const P = UI.partie, r = P.resume();
    box.className = 'box ask';
    box.innerHTML = `<div class="eyebrow">Partie ${UI.derniere ? esc(UI.derniere.statut) : 'terminée'}</div>
      <h2>${r.fin.type === 'sommeil' ? `Le Méchant s'endort au tour ${r.fin.tour}` : r.fin.type === 'nuit' ? 'La nuit tombe' : 'Partie interrompue'}</h2>
      <p class="ctx">Forêt restante : <b>${r.foret}</b> sur 21 (<b>${fr(r.pct)} %</b>). Ordres : ${r.stats.ordres} exécutés, ${r.stats.reussis} réussis, ${r.stats.annules_par_reve} annulés par un rêve, ${r.stats.reves_aux_des} tombés sur un esprit. Rêves joués : ${r.stats.reves_cartes}. Tir à la corde : ${r.stats.tir_a_la_corde}. Machines hors service : ${r.stats.machines_hs + r.stats.machines_egarees}.</p>
      <p class="small">${UI.derniere && UI.derniere.ok ? 'Partie enregistrée (onglet « Parties enregistrées »).' : UI.db ? 'Enregistrement en cours ou impossible.' : 'Enregistrement indisponible dans cette vue : utilisez l\'export.'} Graine ${r.graine}.</p>
      <div class="btn-row"><button class="btn" id="rejouer">Rejouer la même graine</button><button class="btn sec" id="nouvelle">Nouvelle partie</button><button class="btn sec" id="expUne">Exporter (JSON)</button></div>`;
    $('#rejouer').addEventListener('click', () => lancerPartie(r.graine));
    $('#nouvelle').addEventListener('click', () => { UI.mode = 'setup'; UI.partie = null; renderJournal(true); renderTout(true); });
    $('#expUne').addEventListener('click', () => exporter(`noyau-partie-${r.graine}.json`, enregistrement(P, UI.derniere ? UI.derniere.statut : 'terminée')));
  }

  function renderTout() { renderPlateau(); renderPistes(); renderStatus(); renderJoueurs(); renderAsk(); }

  // ------------------------------------------------------------ enregistrement
  function compacter(ev) {
    const o = { i: ev.i, k: ev.k, t: ev.t, e: ev.e, txt: ev.txt };
    for (const k of ['p', 'type', 'choix', 'label', 'pourquoi', 'joueur', 'auto', 'prog', 'ok', 'zone', 'de', 'vers', 'machine', 'j', 'oubli', 'source']) if (ev[k] !== undefined && ev[k] !== '') o[k] = ev[k];
    if (ev.k === 'decision' && ev.type !== 'placer' && ev.options) o.options = ev.options;
    if (ev.plan) { const p = ev.plan; o.plan = { des: p.des, somme: p.somme, ecart: p.ecart, machine: p.machine, tactique: p.tactique, type: p.type, cible: p.cible, depuis: p.depuis }; }
    if (ev.cartes) o.cartes = ev.cartes;
    return o;
  }
  function enregistrement(P, statut) {
    const r = P.resume(), date = new Date().toISOString();
    let journal = P.ev.map(compacter);
    let rec = { id: `p-${date.replace(/[^0-9]/g, '').slice(0, 14)}-${r.graine}`, quoi: 'partie', version: r.version, date, statut, graine: r.graine,
      params: r.params, sieges: r.sieges, fin: r.fin, foret: r.foret, pct: r.pct, stats: r.stats, reves: r.reves, main_finale: r.main_finale, decisions: r.decisions, journal };
    if (JSON.stringify(rec).length > 240000) { rec.journal = journal.map((x) => { const y = Object.assign({}, x); delete y.options; return y; }); rec.allege = true; }
    return rec;
  }
  async function enregistrer(P, statut) {
    const rec = enregistrement(P, statut);
    UI.derniere = { statut, ok: false };
    UI.session.unshift(rec);
    if (!UI.db) { renderArchives(); return; }
    try {
      await UI.db.collection('parties').doc(rec.id).set(rec);
      await UI.db.collection('index').doc(rec.id).set(indexDe(rec));
      UI.derniere.ok = true;
      toast('Partie enregistrée.');
    } catch (e) { toast('Enregistrement impossible : ' + (e.message || e.code)); }
    renderArchives();
  }
  function indexDe(rec) {
    if (rec.quoi === 'serie') return { quoi: 'serie', date: rec.date, version: rec.version, titre: rec.titre, parties: rec.lignes.length, resume: rec.resume };
    return { quoi: 'partie', date: rec.date, version: rec.version, statut: rec.statut, graine: rec.graine, pct: rec.pct, fin: rec.fin,
      table: rec.sieges.map((s) => s.peuple + ':' + (s.type === 'humain' ? 'humain' : s.profil)).join(','), reves: rec.stats.reves_cartes };
  }
  async function exporter(nom, obj) {
    if (!UI.dl) { toast('Export indisponible dans cette vue.'); return; }
    try { await UI.dl.save({ filename: nom, data: JSON.stringify(obj, null, 1) }); }
    catch (e) { if (e && e.code !== 'declined') toast('Export impossible : ' + (e.message || e.code)); }
  }

  function renderArchives() {
    const box = $('#saved');
    $('#dbState').textContent = UI.db
      ? 'Chaque partie terminée ou abandonnée est enregistrée avec tout son journal : réglages, graine, décisions et raisons des bots, dés, ordres. Les séries de parties aussi. Claude peut les relire pour les analyser.'
      : 'L\'enregistrement partagé n\'est pas disponible dans cette vue (il faut être connecté à claude.ai). Les parties de cette session restent listées ici et peuvent être exportées.';
    const lignes = UI.db ? UI.index : UI.session.map((r) => Object.assign({ id: r.id }, indexDe(r)));
    if (!lignes.length) { box.innerHTML = '<div class="empty">Aucune partie enregistrée pour l\'instant. Jouez une partie dans l\'onglet « Partie », ou lancez une série de parties : elles apparaîtront ici.</div>'; return; }
    box.innerHTML = lignes.map((x) => x.quoi === 'serie'
      ? `<div class="sv"><div>Série : ${esc(x.titre)}<div class="m">${new Date(x.date).toLocaleString('fr-FR')} · ${x.parties} parties · ${esc(x.version)}</div></div><button class="btn sec" data-id="${esc(x.id)}" data-c="series">Exporter</button></div>`
      : `<div class="sv"><div>${fr(x.pct)} % de forêt · ${x.fin && x.fin.type === 'sommeil' ? 'sommeil au tour ' + x.fin.tour : x.fin ? x.fin.type : ''} · ${esc(x.statut)}<div class="m">${new Date(x.date).toLocaleString('fr-FR')} · ${esc(String(x.table).replace(/,/g, ', '))} · graine ${x.graine} · ${x.reves} rêves</div></div><button class="btn sec" data-id="${esc(x.id)}" data-c="parties">Exporter</button></div>`).join('');
    box.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', async () => {
      const loc = UI.session.find((r) => r.id === b.dataset.id);
      let rec = loc;
      if (!rec && UI.db) { try { const s = await UI.db.collection(b.dataset.c).doc(b.dataset.id).get(); rec = s.exists ? s.data() : null; } catch (e) { rec = null; } }
      if (rec) exporter(`noyau-${b.dataset.id}.json`, rec); else toast('Document introuvable.');
    }));
  }
  $('#expAll').addEventListener('click', async () => {
    let tout = UI.session.slice();
    if (UI.db) {
      try {
        const [pa, se] = await Promise.all([UI.db.collection('parties').get(), UI.db.collection('series').get()]);
        tout = pa.docs.map((d) => d.data()).concat(se.docs.map((d) => d.data()));
      } catch (e) { toast('Lecture impossible : ' + (e.message || e.code)); }
    }
    if (!tout.length) { toast('Rien à exporter pour l\'instant.'); return; }
    exporter('noyau-parties.json', { version: N.VERSION, exporte_le: new Date().toISOString(), documents: tout });
  });

  // ------------------------------------------------------------ séries
  const SERIE = { tables: 'toutes', parties: 10, profils: { lecteur: true, defenseur: true, reveur: true, hasard: false }, graine: 1000, params: Object.assign({}, N.PARAMS) };
  function renderSerieForm() {
    const f = $('#serieForm');
    f.innerHTML = `<label>Tables<select id="s-tables"><option value="toutes">toutes les compositions de 2 à 6 (30 tables)</option><option value="2">duos (6 tables)</option><option value="3">trios (6)</option><option value="4">4 joueurs (6)</option><option value="5">5 joueurs (6)</option><option value="6">la table de six</option><option value="choisie">la table de l'onglet Partie</option></select></label>
      <label>Parties par table<select id="s-parties">${[4, 10, 20, 40].map((n) => `<option${n === SERIE.parties ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Première graine<input type="number" id="s-graine" value="${SERIE.graine}"></label>
      <fieldset style="border:0;padding:0;margin:0;display:grid;gap:4px"><legend class="small" style="font-weight:700">Profils comparés</legend>${Object.keys(PROFILS).map((k) => `<label style="display:flex;gap:6px;align-items:center;font:600 14px var(--f-ui);color:var(--ink)"><input type="checkbox" data-pr="${k}"${SERIE.profils[k] ? ' checked' : ''}> ${PROFILS[k].nom} <span class="small">${esc(PROFILS[k].texte)}</span></label>`).join('')}</fieldset>
      <details class="reg" style="grid-column:1/-1"><summary>Réglages d'étude de la série</summary><div class="params" style="margin-top:8px">${formParams(SERIE.params, 's')}</div></details>`;
    $('#s-tables').value = SERIE.tables;
    $('#s-tables').addEventListener('change', (e) => { SERIE.tables = e.target.value; });
    $('#s-parties').addEventListener('change', (e) => { SERIE.parties = +e.target.value; });
    $('#s-graine').addEventListener('change', (e) => { SERIE.graine = +e.target.value || 0; });
    f.querySelectorAll('[data-pr]').forEach((x) => x.addEventListener('change', () => { SERIE.profils[x.dataset.pr] = x.checked; }));
    brancherParams(f, SERIE.params, 's');
  }
  function tablesSerie() {
    const PEU = ORDRE_PEUPLES, out = [];
    if (SERIE.tables === 'choisie') { const t = UI.cfg.sieges.filter((s) => s.actif).map((s) => s.peuple); return t.length >= 2 ? [t] : []; }
    const tailles = SERIE.tables === 'toutes' ? [2, 3, 4, 5, 6] : [+SERIE.tables];
    for (const n of tailles) {
      if (n === 6) { out.push(PEU.slice()); continue; }
      for (let k = 0; k < 6; k++) out.push(PEU.slice(k).concat(PEU.slice(0, k)).slice(0, n));
    }
    return out;
  }
  $('#runSerie').addEventListener('click', async () => {
    const btn = $('#runSerie'), profils = Object.keys(SERIE.profils).filter((k) => SERIE.profils[k]), tables = tablesSerie();
    if (!profils.length || !tables.length) { $('#serieProg').textContent = 'Choisissez au moins un profil et une table.'; return; }
    btn.disabled = true;
    const total = profils.length * tables.length * SERIE.parties, lignes = [];
    let fait = 0;
    for (const pr of profils) for (const t of tables) for (let g = 0; g < SERIE.parties; g++) {
      const pa = new N.Partie({ sieges: t.map((p) => ({ peuple: p, type: 'bot', profil: pr })), params: Object.assign({}, SERIE.params), graine: SERIE.graine + g }, {});
      const r = await pa.jouer();
      lignes.push([pr, t.join('+'), SERIE.graine + g, r.pct, r.fin.type, r.fin.tour, r.stats.reves_cartes, r.stats.annules_par_reve, r.stats.reussis, r.stats.ordres, r.stats.tir_a_la_corde, r.stats.sabotages]);
      if (++fait % 25 === 0) { $('#serieProg').textContent = `${fait} parties sur ${total}…`; await sleep(0); }
    }
    $('#serieProg').textContent = `${total} parties jouées.`;
    btn.disabled = false;
    const res = analyserSerie(lignes, profils);
    renderSerieRes(res, lignes);
    const date = new Date().toISOString();
    const rec = { id: `s-${date.replace(/[^0-9]/g, '').slice(0, 14)}`, quoi: 'serie', version: N.VERSION, date,
      titre: `${profils.map((k) => PROFILS[k].nom).join(', ')} · ${tables.length} table${tables.length > 1 ? 's' : ''} × ${SERIE.parties}`,
      params: SERIE.params, graine: SERIE.graine, tables: tables.map((t) => t.join('+')),
      colonnes: ['profil', 'table', 'graine', 'foret_pct', 'fin', 'tour_fin', 'reves', 'annules_par_reve', 'ordres_reussis', 'ordres', 'tir_a_la_corde', 'sabotages'],
      lignes: lignes.slice(0, 3500), resume: res.resume };
    UI.session.unshift(rec);
    if (UI.db) {
      try { await UI.db.collection('series').doc(rec.id).set(rec); await UI.db.collection('index').doc(rec.id).set(indexDe(rec)); toast('Série enregistrée.'); }
      catch (e) { toast('Enregistrement impossible : ' + (e.message || e.code)); }
    }
    UI.derniereSerie = rec;
  });
  function analyserSerie(lignes, profils) {
    const moy = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    const par = {};
    for (const pr of profils) {
      const L = lignes.filter((l) => l[0] === pr);
      const tailles = {};
      for (let n = 2; n <= 6; n++) { const x = L.filter((l) => l[1].split('+').length === n); if (x.length) tailles[n] = moy(x.map((l) => l[3])); }
      par[pr] = { n: L.length, foret: moy(L.map((l) => l[3])), sommeil: L.filter((l) => l[4] === 'sommeil').length / (L.length || 1), reves: moy(L.map((l) => l[6])), annules: moy(L.map((l) => l[7])), reussis: moy(L.map((l) => l[8])), tir: moy(L.map((l) => l[10])), tailles };
    }
    // écart apparié Lecteur − meilleure stratégie fixe (Défenseur, Rêveur)
    let juger = null;
    const fixes = ['defenseur', 'reveur'].filter((k) => profils.includes(k));
    if (profils.includes('lecteur') && fixes.length) {
      const best = fixes.reduce((a, b) => (par[a].foret >= par[b].foret ? a : b));
      const cle = (l) => l[1] + '|' + l[2];
      const ref = new Map(lignes.filter((l) => l[0] === best).map((l) => [cle(l), l[3]]));
      const d = lignes.filter((l) => l[0] === 'lecteur' && ref.has(cle(l))).map((l) => l[3] - ref.get(cle(l)));
      const m = moy(d), sd = Math.sqrt(moy(d.map((x) => (x - m) ** 2)) * d.length / Math.max(1, d.length - 1)), ic = 1.96 * sd / Math.sqrt(d.length || 1);
      juger = { contre: best, ecart: m, ic, n: d.length };
    }
    return { par, juger, resume: { profils: Object.fromEntries(Object.entries(par).map(([k, v]) => [k, { foret: +v.foret.toFixed(1), sommeil: +(v.sommeil * 100).toFixed(0), reves: +v.reves.toFixed(2) }])), juger: juger ? { contre: juger.contre, ecart: +juger.ecart.toFixed(1), ic95: +juger.ic.toFixed(1) } : null } };
  }
  function renderSerieRes(res, lignes) {
    const f1 = (x) => x.toFixed(1).replace('.', ',');
    const pr = Object.keys(res.par), max = Math.max(...pr.map((k) => res.par[k].foret));
    let h = `<div class="eyebrow">Résultats de la série (indices : des bots simples)</div>`;
    if (res.juger) {
      const j = res.juger, sur = Math.abs(j.ecart) > j.ic;
      h += `<div class="verdict${j.ecart >= 5 && sur ? '' : ' warn'}">Juger rapporte <b>${j.ecart >= 0 ? '+' : ''}${f1(j.ecart)} points</b> de forêt (± ${f1(j.ic)}, ${j.n} paires) par rapport à la meilleure stratégie fixe, « ${PROFILS[j.contre].nom} ». ${j.ecart >= 5 && sur ? 'Le choix rêver ou défendre a de l\'enjeu pour ces bots.' : sur ? 'L\'écart est réel mais sous le seuil de 5 points.' : 'L\'écart n\'est pas distinguable du hasard.'}</div>`;
    }
    h += `<div class="tw"><table class="res num"><thead><tr><th>Profil</th><th>Forêt</th><th></th><th>2 j.</th><th>3 j.</th><th>4 j.</th><th>5 j.</th><th>6 j.</th><th>Sommeil</th><th>Rêves</th><th>Annulés</th><th>Tir à la corde</th></tr></thead><tbody>`;
    for (const k of pr) {
      const v = res.par[k];
      h += `<tr class="${v.foret === max ? 'best' : ''}"><td>${PROFILS[k].nom}</td><td>${f1(v.foret)} %</td><td style="min-width:70px"><div class="bar" style="width:${Math.max(2, v.foret * 0.7)}px"></div></td>${[2, 3, 4, 5, 6].map((n) => `<td>${v.tailles[n] != null ? f1(v.tailles[n]) : '–'}</td>`).join('')}<td>${Math.round(v.sommeil * 100)} %</td><td>${f1(v.reves)}</td><td>${f1(v.annules)}</td><td>${f1(v.tir)}</td></tr>`;
    }
    h += `</tbody></table></div><p class="small">Forêt : moyenne de la forêt restante, en % des 21 forêts. Rêves et annulés : par partie. Les mêmes tables et graines sont jouées par chaque profil.</p><div class="btn-row"><button class="btn sec" id="expSerie">Exporter la série (JSON)</button></div>`;
    $('#serieRes').innerHTML = h;
    $('#expSerie').addEventListener('click', () => exporter(`noyau-serie-${Date.now()}.json`, UI.derniereSerie || { lignes }));
  }

  // ------------------------------------------------------------ règles (Markdown léger)
  function md(src) {
    const inl = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
    const L = src.split('\n'), out = [];
    let i = 0;
    while (i < L.length) {
      const l = L[i];
      if (/^#\s/.test(l)) { out.push(`<h2>${inl(l.slice(2))}</h2>`); i++; continue; }
      if (/^##\s/.test(l)) { out.push(`<h2>${inl(l.slice(3))}</h2>`); i++; continue; }
      if (/^###\s/.test(l)) { out.push(`<h3>${inl(l.slice(4))}</h3>`); i++; continue; }
      if (/^\|/.test(l)) {
        const rows = []; while (i < L.length && /^\|/.test(L[i])) { rows.push(L[i]); i++; }
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        let t = '<div class="tw"><table><thead><tr>' + cells(rows[0]).map((c) => `<th>${inl(c)}</th>`).join('') + '</tr></thead><tbody>';
        rows.slice(2).forEach((r) => { t += '<tr>' + cells(r).map((c) => `<td>${inl(c)}</td>`).join('') + '</tr>'; });
        out.push(t + '</tbody></table></div>'); continue;
      }
      if (/^\s*(-|\d+\.)\s/.test(l)) {
        const ol = /^\s*\d+\./.test(l), items = [];
        while (i < L.length && /^\s*(-|\d+\.)\s/.test(L[i])) { items.push(L[i].replace(/^\s*(-|\d+\.)\s/, '')); i++; }
        out.push(`<${ol ? 'ol' : 'ul'}>${items.map((x) => `<li>${inl(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`); continue;
      }
      if (!l.trim()) { i++; continue; }
      const para = []; while (i < L.length && L[i].trim() && !/^(#|\||\s*-\s|\s*\d+\.\s)/.test(L[i])) { para.push(L[i]); i++; }
      out.push(`<p>${inl(para.join(' '))}</p>`);
    }
    return out.join('\n');
  }
  $('#regles').innerHTML = md(window.REGLES_NOYAU || 'Règles indisponibles.');

  // ------------------------------------------------------------ capacités (enregistrement partagé, export)
  if (window.claude && window.claude.use) {
    window.claude.use('db').then((db) => {
      UI.db = db;
      if (!db) { renderArchives(); return; }
      db.collection('index').orderBy('date', 'desc').limit(200).onSnapshot((snap) => {
        UI.index = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        renderArchives();
      }, (e) => { $('#dbState').textContent = 'Lecture des parties impossible : ' + (e.message || e.code); });
    }).catch(() => renderArchives());
    window.claude.use('downloads').then((d) => { UI.dl = d; }).catch(() => {});
  }

  construirePlateau();
  renderSerieForm();
  renderJournal(true);
  renderTout(true);
  renderArchives();
})();
