/* La Forêt qui rêve : moteur du noyau N1.
   Règles : docs/regles_noyau.md (identifiants N1.1 à N7.2, cités en commentaire).
   Pur JavaScript, sans DOM : la page l'anime, Node le teste (node test_moteur.js).
   Le moteur ne décide rien : chaque choix passe par decider(), qui interroge un bot (NoyauBots)
   ou un humain (io.ask). Tout ce qui se passe est écrit dans le journal (this.ev), qui est aussi
   l'enregistrement de la partie. */
(function (G) {
  'use strict';

  const VERSION = 'N1.0';

  // N1.1 plateau
  const ZONES = {
    1: { nom: 'Lisière', f: 2, prof: 0 },
    2: { nom: 'Clairière', f: 1, prof: 0 },
    3: { nom: 'Várzea', f: 2, prof: 0 },
    4: { nom: 'Igapó', f: 3, prof: 1 },
    5: { nom: 'Sources', f: 4, prof: 1 },
    6: { nom: 'Colline aux aras', f: 4, prof: 2 },
    7: { nom: 'Samaúma', f: 5, prof: 2 },
  };
  const VOISINS = { 1: [2, 4], 2: [1, 3, 4, 5], 3: [2, 5], 4: [1, 2, 5, 6], 5: [2, 3, 4, 6, 7], 6: [4, 5, 7], 7: [5, 6] };
  const FLECHE = { 1: 4, 2: 5, 3: 5, 4: 6, 5: 7, 6: null, 7: null };
  const NZ = [1, 2, 3, 4, 5, 6, 7];

  // N1.2 Machines
  const MACHINES = [
    { id: 1, nom: 'Grosse Gueule', organes: ['moteur', 'chenilles'], entree: 1 },
    { id: 2, nom: 'Rapiat', organes: ['moteur', 'chenilles', 'phares'], entree: 2 },
    { id: 3, nom: 'Mâchoire', organes: ['moteur', 'phares'], entree: 3 },
    { id: 4, nom: 'Tonton Débard', organes: ['moteur', 'chenilles'], entree: 1 },
    { id: 5, nom: 'Ripaille', organes: ['moteur', 'chenilles', 'phares'], entree: 3 },
  ];

  // N1.3 piste des pensées
  const PISTE0 = { 2: 'Percée', 3: 'Représailles', 4: 'Percée', 5: 'Représailles', 6: 'Opportunisme', 7: 'Cupidité',
    8: 'Opportunisme', 9: 'Représailles', 10: 'Percée', 11: 'Cupidité', 12: 'Cupidité' };

  // N5 peuples
  const PEUPLES = {
    oiseaux: { nom: 'Oiseaux', pouvoir: 'Voir', court: 'Les dés de la 2e étape sont connus au conseil.' },
    mammiferes: { nom: 'Mammifères', pouvoir: 'Renverser', court: 'Sabotent seuls, sans allié.' },
    reptiles: { nom: 'Reptiles', pouvoir: 'Attendre', court: 'Choisissent leur action après les dés (Aller ou Barrer).' },
    insectes: { nom: 'Insectes', pouvoir: "S'unir", court: "Agissent dans la zone d'une autre carte de l'étape ; choisissent en dernier." },
    humains: { nom: 'Humains', pouvoir: 'Tromper', court: "Peuvent inverser ce qu'apprend le Méchant à l'étape de leur carte." },
    entites: { nom: 'Entités', pouvoir: 'Égarer', court: 'Sabotent seules ; une Machine mise hors service par elles quitte le jeu et fait rêver.' },
  };
  const ORDRE_PEUPLES = ['oiseaux', 'mammiferes', 'reptiles', 'insectes', 'humains', 'entites'];
  const SPECIALISTES = { mammiferes: true, entites: true };       // N5.2, N5.6

  // N8 réglages
  // valeurs par défaut choisies le 15 oct. après un calibrage local aux bots (docs/regles_noyau.md, section 8)
  const PARAMS = { tours: 6, main: 4, machines_depart: 3, reves_par_tour: 1, reve_annule: true, presage: true,
    ordres_par_etape: 'n/2', avances_par_tour: 1, barrage: 'entrer_abattre', pions: 3 };
  // ordres_par_etape : un nombre, ou une formule « n-1 », « n/2 » (n = nombre de joueurs, au moins 1)
  function valeurTable(x, n) {
    if (typeof x === 'number') return x;
    if (x === 'n') return n;
    if (x === 'n-1') return Math.max(1, n - 1);
    if (x === 'n/2') return Math.max(1, Math.ceil(n / 2));
    return 1;
  }

  function generateur(graine) {                                  // mulberry32 : parties reproductibles
    let a = graine >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const nomZ = (z) => ZONES[z].nom;
  const vers7 = (c) => (c < 7 ? c + 1 : c > 7 ? c - 1 : c);
  const versBord = (c) => (c < 7 ? Math.max(2, c - 1) : Math.min(12, c + 1));

  class Partie {
    /* cfg : {sieges: [{peuple, type: 'humain' | 'bot', profil}], params, graine}
       io  : {ask(demande) -> Promise<id ou programme>, show(evenement) -> Promise} (facultatifs) */
    constructor(cfg, io) {
      this.version = VERSION;
      this.params = Object.assign({}, PARAMS, cfg.params || {});
      this.graine = cfg.graine != null ? cfg.graine >>> 0 : Math.floor(Math.random() * 2 ** 31);
      this.alea = generateur(this.graine);
      this.sieges = cfg.sieges.map((s) => Object.assign({ type: 'bot', profil: 'lecteur' }, s));
      this.peuples = this.sieges.map((s) => s.peuple);
      this.io = io || {};
      this.bots = cfg.bots || G.NoyauBots;
      this.ev = [];
      this.decisions = 0;
      this.stats = { ordres: 0, reussis: 0, echoues: 0, sans_effet: 0, annules_par_reve: 0, reves_aux_des: 0,
        reves_cartes: 0, reves_egarer: 0, esprits_entres: 0, oublis: 0, tir_a_la_corde: 0, sabotages: 0,
        sabotages_rates: 0, machines_hs: 0, machines_egarees: 0, entrees: 0, remorquages: 0, barrages: 0,
        ordres_bloques: 0, tromperies: 0, forets_abattues: 0, presages_annules: 0 };
      this.etat = this.initial();
    }

    initial() {
      const P = this.params, f = {}, piste = {}, pions = {}, main = {}, reves = {};
      NZ.forEach((z) => { f[z] = ZONES[z].f; });
      for (let c = 2; c <= 12; c++) piste[c] = { k: 'tactique', nom: PISTE0[c] };
      const mach = MACHINES.map((m) => ({ id: m.id, nom: m.nom, entree: m.entree,
        org: Object.fromEntries(m.organes.map((o) => [o, true])),
        etat: m.id <= P.machines_depart ? 'marche' : 'chantier', zone: m.id <= P.machines_depart ? m.entree : null }));
      this.peuples.forEach((p) => { pions[p] = []; main[p] = P.main; reves[p] = 0; });
      return { tour: 0, etape: 0, premier: 0, f, mach, piste, pisteM: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
        pions, main, reves, des: {}, prog: {}, barres: [], cartes: [], decl: [], fin: null, nEsprits: 0, avances: {} };
    }

    // ---------------------------------------------------------------- lectures
    siege(p) { return this.sieges.find((s) => s.peuple === p); }
    ordre() { const n = this.peuples.length, d = this.etat.premier; return this.peuples.map((_, i) => this.peuples[(i + d) % n]); }
    presence(z) { let n = 0; for (const p of this.peuples) n += this.etat.pions[p].filter((x) => x === z).length; return n; }
    present(p, z) { return this.etat.pions[p].includes(z); }
    foret() { return NZ.reduce((s, z) => s + this.etat.f[z], 0); }
    machine(id) { return this.etat.mach.find((m) => m.id === id); }
    lancer() { return [1 + Math.floor(this.alea() * 6), 1 + Math.floor(this.alea() * 6)]; }
    esprits() { const out = []; for (let c = 8; c <= 12; c++) if (this.etat.piste[c].k === 'esprit') out.push(c); return out; }
    distanceSommeil() { const e = this.esprits(); return e.length ? Math.min(...e) - 7 : 6; }

    // N6.1 à N6.3 : le plan que donnent deux dés, dans l'état présent
    plan(des) {
      const E = this.etat, [a, b] = des, somme = a + b, ecart = Math.abs(a - b), caseM = ecart === 0 ? 1 : ecart;
      const tuile = E.piste[somme], mid = E.pisteM[caseM], m = this.machine(mid);
      const p = { des: [a, b], somme, ecart, caseM, machine: m ? m.id : null, nomMachine: m ? m.nom : null,
        tactique: tuile.k === 'esprit' ? 'esprit' : tuile.nom };
      if (tuile.k === 'esprit') { p.type = 'reve'; return p; }
      if (!m || m.etat === 'egaree') { p.type = 'rien'; p.raison = 'la Machine de cette case s\'est égarée'; p.apprend = false; return p; }
      if (m.etat === 'chantier') { p.type = 'entree'; p.cible = m.entree; return p; }
      if (m.etat === 'hs') { p.type = 'remorquage'; p.depuis = m.zone; return p; }
      p.depuis = m.zone;
      const c = this.cible(m.zone, tuile.nom);
      if (c == null) { p.type = 'rien'; p.raison = 'plus aucune forêt dans son rayon'; p.apprend = true; return p; }
      p.type = 'abattre'; p.cible = c; return p;
    }

    cible(z, tac) {
      const E = this.etat, cand = [z, ...VOISINS[z]].filter((x) => E.f[x] > 0);
      if (!cand.length) return null;
      const tri = (score) => cand.slice().sort((x, y) =>
        (score(y) - score(x)) || (E.f[y] - E.f[x]) || ((y === z) - (x === z)) || (x - y))[0];
      if (tac === 'Cupidité') return tri((x) => E.f[x]);
      if (tac === 'Opportunisme') return tri((x) => -this.presence(x));
      if (tac === 'Représailles') return tri((x) => this.presence(x));
      const fl = FLECHE[z];                                       // Percée
      if (fl && E.f[fl] > 0) return fl;
      return E.f[z] > 0 ? z : tri((x) => E.f[x]);
    }

    decrirePlan(p) {
      if (!p) return '';
      const d = `${p.des[0]}-${p.des[1]} (somme ${p.somme}, écart ${p.ecart})`;
      if (p.type === 'reve') return `${d} : la somme tombe sur un esprit, le Méchant rêve`;
      if (p.type === 'rien') return `${d} : ${p.nomMachine || 'aucune Machine'} par ${p.tactique}, sans effet (${p.raison})`;
      if (p.type === 'entree') return `${d} : ${p.nomMachine} entre en ${nomZ(p.cible)}`;
      if (p.type === 'remorquage') return `${d} : ${p.nomMachine}, hors service, est remorquée au chantier`;
      const trajet = p.cible === p.depuis ? `abat en ${nomZ(p.cible)}` : `va de ${nomZ(p.depuis)} en ${nomZ(p.cible)} et y abat`;
      return `${d} : ${p.nomMachine} par ${p.tactique} ${trajet}`;
    }

    // ---------------------------------------------------------------- journal
    async note(k, txt, data) {
      const E = this.etat;
      const ev = Object.assign({ i: this.ev.length, k, t: E.tour, e: E.etape, txt }, data || {});
      this.ev.push(ev);
      if (this.io.show) await this.io.show(ev, this);
      return ev;
    }

    async decider(p, type, options, ctx) {
      ctx = ctx || {};
      const s = this.siege(p);
      let r;
      if (options.length === 1) r = { choix: options[0], pourquoi: 'Seul choix possible.', auto: true };
      else if (s.type === 'bot') r = this.bots.decider(this, p, type, options, ctx);
      else {
        const id = await this.io.ask({ p, type, options, ctx });
        r = { choix: options.find((o) => o.id === id) || options[0], pourquoi: '' };
      }
      this.decisions++;
      await this.note('decision', `${PEUPLES[p].nom} : ${r.choix.label}`, { p, type, choix: r.choix.id,
        label: r.choix.label, options: options.map((o) => o.label), pourquoi: r.pourquoi || '',
        joueur: s.type === 'bot' ? s.profil : 'humain', auto: !!r.auto });
      return r.choix;
    }

    // ---------------------------------------------------------------- partie
    async jouer() {
      const P = this.params;
      await this.note('debut', `Nouvelle partie (noyau ${VERSION}), graine ${this.graine} : ${this.peuples.map((p) => PEUPLES[p].nom).join(', ')}.`,
        { graine: this.graine, params: P, sieges: this.sieges });
      await this.placement();
      for (let t = 1; t <= P.tours && !this.etat.fin; t++) await this.tour(t);
      if (!this.etat.fin) this.etat.fin = { type: 'nuit', tour: P.tours };
      const r = this.resume();
      await this.note('fin', r.fin.type === 'sommeil'
        ? `Le Méchant s'endort au tour ${r.fin.tour}. Forêt restante : ${r.foret} sur 21 (${String(r.pct).replace('.', ',')} %).`
        : `La nuit tombe. Forêt restante : ${r.foret} sur 21 (${String(r.pct).replace('.', ',')} %).`, { resume: r });
      return r;
    }

    async placement() {                                            // N1.6
      this.etat.tour = 0; this.etat.etape = 0;
      await this.note('phase', 'Mise en place : chacun pose ses trois pions de présence, à tour de rôle.');
      for (let r = 0; r < this.params.pions; r++) {
        for (const p of this.ordre()) {
          const opts = NZ.map((z) => ({ id: 'z' + z, zone: z, label: `Poser un pion en ${nomZ(z)}` }));
          const c = await this.decider(p, 'placer', opts, { rang: r });
          this.etat.pions[p].push(c.zone);
          await this.note('pion', `${PEUPLES[p].nom} pose un pion en ${nomZ(c.zone)}.`, { p, zone: c.zone });
        }
      }
    }

    async tour(t) {
      const E = this.etat, P = this.params;
      E.tour = t; E.etape = 0; E.des = {}; E.prog = {}; E.avances = {};
      await this.note('phase', `Tour ${t} sur ${P.tours}. Premier joueur : ${PEUPLES[this.ordre()[0]].nom}.`);
      if (P.presage) {                                                 // N2.1
        E.des[1] = this.lancer();
        const p = this.plan(E.des[1]);
        await this.note('presage', `Présage de l'étape 1 : ${this.decrirePlan(p)}.`, { etapeDes: 1, plan: p });
      }
      if (this.peuples.includes('oiseaux')) {                          // N5.1
        E.des[2] = this.lancer();
        const p = this.plan(E.des[2]);
        await this.note('voir', `Les oiseaux voient l'étape 2 : ${this.decrirePlan(p)}.`, { etapeDes: 2, plan: p });
      }
      await this.programmation();
      for (let e = 1; e <= 3 && !E.fin; e++) await this.etape(e);
      if (E.fin) return;
      E.premier = (E.premier + 1) % this.peuples.length;               // N2.5
      await this.note('fin_tour', `Fin du tour ${t} : les cartes qui ont agi reviennent en main ; ${this.peuples.map((p) => `${PEUPLES[p].nom} ${E.main[p]}`).join(', ')}.`);
    }

    // N2.2, N2.3 : chaque joueur pose au plus une carte par étape, au plus un rêve par tour
    programmeValide(p, prog) {
      if (!Array.isArray(prog) || prog.length !== 3) return false;
      const n = prog.filter(Boolean).length, r = prog.filter((x) => x === 'rever').length;
      return n <= this.etat.main[p] && r <= this.params.reves_par_tour && prog.every((x) => !x || x === 'agir' || x === 'rever');
    }

    async programmation() {
      const E = this.etat;
      await this.note('phase', 'Programmation : chacun pose ses cartes en secret.');
      const bots = this.ordre().filter((p) => this.siege(p).type === 'bot');
      const humains = this.ordre().filter((p) => this.siege(p).type !== 'bot');
      for (const p of humains) {
        let prog = await this.io.ask({ p, type: 'programme', options: [], ctx: { main: E.main[p], reves: this.params.reves_par_tour } });
        if (!this.programmeValide(p, prog)) prog = [null, null, null];
        E.prog[p] = prog;
        this.decisions++;
        await this.note('decision', `${PEUPLES[p].nom} a programmé.`, { p, type: 'programme', prog, cache: true, joueur: 'humain', pourquoi: '' });
      }
      if (bots.length) {
        const plan = this.bots.programmer(this, bots);
        for (const p of bots) {
          let prog = plan[p].prog;
          if (!this.programmeValide(p, prog)) prog = [null, null, null];
          E.prog[p] = prog;
          this.decisions++;
          await this.note('decision', `${PEUPLES[p].nom} a programmé.`, { p, type: 'programme', prog, cache: true,
            joueur: this.siege(p).profil, pourquoi: plan[p].pourquoi.join(' ') });
        }
      }
    }

    async etape(e) {
      const E = this.etat, P = this.params;
      E.etape = e; E.barres = []; E.decl = [];
      const cartes = this.ordre().filter((p) => E.prog[p] && E.prog[p][e - 1]).map((p) => ({ p, mode: E.prog[p][e - 1] }));
      E.cartes = cartes;
      await this.note('revele', cartes.length
        ? `Étape ${e} : ${cartes.map((c) => `${PEUPLES[c.p].nom} ${c.mode === 'rever' ? 'rêve' : 'agit'}`).join(', ')}.`
        : `Étape ${e} : aucune carte.`, { cartes });

      // 2. les rêves (N3)
      const reveurs = cartes.filter((c) => c.mode === 'rever');
      for (const c of reveurs) {
        E.main[c.p]--; E.reves[c.p]++; this.stats.reves_cartes++;
        await this.rever(c.p, 'carte');
        if (E.fin) return;
      }
      const nOrdres = valeurTable(P.ordres_par_etape, this.peuples.length);
      let aAnnuler = P.reve_annule ? Math.min(reveurs.length, nOrdres) : 0;     // N3.2 : un ordre annulé par carte en rêve
      const annule = aAnnuler >= nOrdres;                                       // tous les ordres de l'étape sont annulés

      // 3. les actions : les autres, puis les insectes (N5.4) ; les reptiles attendent les dés (N5.3)
      const agissent = cartes.filter((c) => c.mode === 'agir');
      for (const c of agissent.filter((c) => c.p !== 'reptiles' && c.p !== 'insectes')) await this.agir(c.p, { annule, annules: aAnnuler });
      for (const c of agissent.filter((c) => c.p === 'insectes')) await this.agir(c.p, { annule, annules: aAnnuler });

      // 4. les sabotages (N4.3)
      await this.sabotages();
      if (E.fin) return;

      // 5. les dés et les ordres (N6) : le premier ordre de l'étape utilise les dés connus (présage, Voir)
      const plans = [];
      for (let j = 1; j <= nOrdres; j++) {
        const connus = j === 1 ? E.des[e] : null;
        if (aAnnuler > 0) {
          aAnnuler--; this.stats.annules_par_reve++;
          const pl = connus ? this.plan(connus) : null;
          if (pl) this.stats.presages_annules++;
          await this.note('annule', pl
            ? `Le Méchant rêve : l'ordre ${nOrdres > 1 ? j + ' ' : ''}de l'étape ${e} est annulé (il aurait été : ${this.decrirePlan(pl)}).`
            : `Le Méchant rêve : l'ordre ${nOrdres > 1 ? j + ' ' : ''}de l'étape ${e} est annulé, on ne lance pas ses dés.`, { plan: pl, j });
          continue;
        }
        const des = connus || this.lancer();
        if (j === 1) E.des[e] = des;
        const pl = this.plan(des);
        plans.push({ j, des, pl });
        await this.note('des', `Les dés ${nOrdres > 1 ? `de l'ordre ${j} ` : ''}de l'étape ${e} : ${this.decrirePlan(pl)}.`, { plan: pl, j });
      }
      // 6. les reptiles (N5.3) : ils connaissent les plans de l'étape
      for (const c of agissent.filter((c) => c.p === 'reptiles')) await this.agir(c.p, { annule, plan: plans.length ? plans[0].pl : null, plans: plans.map((x) => x.pl) });

      // 7. exécution et apprentissage, ordre par ordre ; le plan est relu au moment d'exécuter
      let trompe = false;
      for (const o of plans) {
        if (E.fin) return;
        const plan = this.plan(o.des);
        if (plan.type === 'reve') { this.stats.reves_aux_des++; await this.note('ordre', 'Pas d\'ordre : la somme tombe sur un esprit, le Méchant rêve.', { ok: null, j: o.j }); continue; }
        if (plan.type === 'rien' && plan.apprend === false) { await this.note('ordre', `Pas d'ordre : ${plan.raison}.`, { ok: null, j: o.j }); continue; }
        this.stats.ordres++;
        const res = this.executer(plan);
        if (res.ok) this.stats.reussis++; else this.stats.echoues++;
        await this.note('ordre', res.txt, { ok: res.ok, plan, mouvement: res.mouvement || null, bloque: res.bloque || null, j: o.j });
        let ok = res.ok;
        if (!trompe && agissent.some((c) => c.p === 'humains')) {                    // N5.5 : une fois par étape
          const c = await this.decider('humains', 'tromper', [
            { id: 'oui', label: ok ? 'Tromper : le Méchant croit avoir échoué' : 'Tromper : le Méchant croit avoir réussi' },
            { id: 'non', label: 'Ne pas tromper' }], { ok });
          if (c.id === 'oui') { ok = !ok; trompe = true; this.stats.tromperies++; }
        }
        await this.apprendre(plan, ok);
      }
    }

    // options d'action d'une carte (N4, N5)
    optionsAction(p, ctx) {
      const E = this.etat, out = [], zones = [...new Set(E.pions[p])].sort((a, b) => a - b);
      const peutSaboter = p !== 'reptiles';
      const zonesAction = new Set(zones);
      if (p === 'insectes') E.decl.forEach((d) => { if (d.p !== p) zonesAction.add(d.zone); });   // N5.4
      for (const z of zones) for (const v of VOISINS[z]) out.push({ id: `aller-${z}-${v}`, kind: 'aller', de: z, zone: v, label: `Aller de ${nomZ(z)} en ${nomZ(v)}` });
      for (const z of [...zonesAction].sort((a, b) => a - b)) {
        out.push({ id: `barrer-${z}`, kind: 'barrer', zone: z, label: `Barrer ${nomZ(z)}${E.barres.includes(z) ? ' (déjà barrée)' : ''}` });
        if (!peutSaboter) continue;
        for (const m of E.mach) {
          if (m.etat !== 'marche' || m.zone !== z) continue;
          if (!Object.values(m.org).some(Boolean)) continue;
          out.push({ id: `saboter-${m.id}`, kind: 'saboter', zone: z, machine: m.id, label: `Saboter ${m.nom} en ${nomZ(z)}` });
        }
      }
      return out;
    }

    async agir(p, ctx) {
      const E = this.etat, opts = this.optionsAction(p, ctx);
      if (!opts.length) { await this.note('info', `${PEUPLES[p].nom} n'a aucune action possible.`); return; }
      const c = await this.decider(p, 'action', opts, ctx);
      const d = { p, kind: c.kind, zone: c.zone, machine: c.machine || null, de: c.de || null };
      if (c.kind === 'aller') {
        const i = E.pions[p].indexOf(c.de); E.pions[p][i] = c.zone;
        await this.note('aller', `${PEUPLES[p].nom} va de ${nomZ(c.de)} en ${nomZ(c.zone)}.`, { p, de: c.de, zone: c.zone });
      } else if (c.kind === 'barrer') {
        if (!E.barres.includes(c.zone)) { E.barres.push(c.zone); this.stats.barrages++; }
        await this.note('barrer', `${PEUPLES[p].nom} barre ${nomZ(c.zone)} pour l'étape.`, { p, zone: c.zone });
      } else {
        await this.note('saboter_decl', `${PEUPLES[p].nom} s'attaque à ${this.machine(c.machine).nom} en ${nomZ(c.zone)}.`, { p, zone: c.zone, machine: c.machine });
      }
      E.decl.push(d);
    }

    async sabotages() {                                               // N4.3, N4.4
      const E = this.etat;
      for (const d of E.decl.filter((x) => x.kind === 'saboter')) {
        const m = this.machine(d.machine);
        const allie = E.decl.find((x) => x.p !== d.p && x.zone === d.zone);
        if (!SPECIALISTES[d.p] && !allie) {
          this.stats.sabotages_rates++;
          await this.note('sabotage', `Le sabotage des ${PEUPLES[d.p].nom.toLowerCase()} échoue : aucun allié en ${nomZ(d.zone)}.`, { p: d.p, ok: false, machine: m.id });
          continue;
        }
        if (m.etat !== 'marche') continue;
        const o = Object.keys(m.org).find((k) => m.org[k]);
        if (!o) continue;
        m.org[o] = false; this.stats.sabotages++;
        const par = SPECIALISTES[d.p] && !allie ? 'seuls' : `avec les ${PEUPLES[allie.p].nom.toLowerCase()}`;
        await this.note('sabotage', `Les ${PEUPLES[d.p].nom.toLowerCase()} neutralisent ${o === 'phares' ? 'les phares' : o === 'chenilles' ? 'les chenilles' : 'le moteur'} de ${m.nom} (${par}).`, { p: d.p, ok: true, machine: m.id, organe: o });
        if (!Object.values(m.org).some(Boolean)) {
          if (d.p === 'entites') {                                       // N5.6
            m.etat = 'egaree'; m.zone = null; this.stats.machines_egarees++; this.stats.reves_egarer++;
            await this.note('egaree', `${m.nom} s'égare : elle quitte le jeu et fait rêver le Méchant.`, { machine: m.id });
            await this.rever('entites', 'egarer');
            if (E.fin) return;
          } else {
            m.etat = 'hs'; this.stats.machines_hs++;
            await this.note('hs', `${m.nom} est hors service.`, { machine: m.id });
          }
        }
      }
    }

    // N3.1, N3.4
    async rever(p, source) {
      const E = this.etat, ev = this.esprits(), opts = [];
      if (E.piste[12].k !== 'esprit') opts.push({ id: 'entrer', label: `Un esprit entre en 12 (le Méchant oublie ${E.piste[12].nom})` });
      for (const c of ev) {
        if (E.piste[c - 1].k === 'esprit') continue;
        if ((E.avances[E.piste[c].n] || 0) >= this.params.avances_par_tour) continue;     // N3.1 bis
        opts.push({ id: 'avancer-' + c, case: c, label: `L'esprit en ${c} avance en ${c - 1}` });
      }
      if (!opts.length) { await this.note('info', 'Aucun esprit ne peut bouger.'); return; }
      const qui = source === 'egarer' ? 'entites' : p;
      const c = await this.decider(qui, 'esprit', opts, { source });
      if (c.id === 'entrer') {
        const oubli = E.piste[12].nom;
        E.piste[12] = { k: 'esprit', n: ++E.nEsprits };
        E.avances[E.nEsprits] = 1;
        this.stats.esprits_entres++; this.stats.oublis++;
        await this.note('reve', `Le Méchant rêve : un esprit entre en 12, ${oubli} est oubliée.`, { p, source, de: null, vers: 12, oubli });
      } else {
        const a = c.case, tmp = E.piste[a - 1];
        E.avances[E.piste[a].n] = (E.avances[E.piste[a].n] || 0) + 1;
        E.piste[a - 1] = E.piste[a]; E.piste[a] = tmp;
        await this.note('reve', `Le Méchant rêve : l'esprit passe de ${a} à ${a - 1}${a - 1 === 7 ? '' : ` (${tmp.nom} recule en ${a})`}.`, { p, source, de: a, vers: a - 1 });
        if (a - 1 === 7) { E.fin = { type: 'sommeil', tour: E.tour, etape: E.etape }; await this.note('sommeil', 'Un esprit atteint le 7 : le Méchant s\'endort.'); }
      }
    }

    // N6.2, N6.4
    executer(p) {
      const E = this.etat, B = E.barres, m = this.machine(p.machine);
      if (p.type === 'rien') { this.stats.sans_effet++; return { ok: false, txt: `${m.nom} ne fait rien : ${p.raison}.` }; }
      if (p.type === 'entree') {
        if (B.includes(p.cible)) { this.stats.ordres_bloques++; return { ok: false, bloque: p.cible, txt: `${m.nom} ne peut pas entrer : ${nomZ(p.cible)} est barrée. L'ordre échoue.` }; }
        m.etat = 'marche'; m.zone = p.cible; this.stats.entrees++;
        return { ok: true, mouvement: { machine: m.id, de: null, vers: p.cible }, txt: `${m.nom} entre en ${nomZ(p.cible)}.` };
      }
      if (p.type === 'remorquage') {
        m.etat = 'chantier'; m.zone = null; Object.keys(m.org).forEach((k) => { m.org[k] = true; }); this.stats.remorquages++;
        return { ok: true, txt: `${m.nom} est remorquée au chantier et remise en état.` };
      }
      const z = m.zone, c = p.cible;
      const sortieBloquee = this.params.barrage === 'complet' ? B.includes(z) : (c === z && B.includes(z));   // N4.2
      if (sortieBloquee) { this.stats.ordres_bloques++; return { ok: false, bloque: z, txt: `${m.nom} est bloquée : ${nomZ(z)} est barrée. L'ordre échoue.` }; }
      if (c !== z && B.includes(c)) { this.stats.ordres_bloques++; return { ok: false, bloque: c, txt: `${m.nom} ne peut pas entrer en ${nomZ(c)}, barrée. L'ordre échoue.` }; }
      m.zone = c; E.f[c]--; this.stats.forets_abattues++;
      return { ok: true, mouvement: { machine: m.id, de: z, vers: c }, txt: `${m.nom} ${c === z ? '' : `va en ${nomZ(c)} et `}abat une forêt en ${nomZ(c)} (il en reste ${E.f[c]}).` };
    }

    // N6.5
    async apprendre(p, ok) {
      const E = this.etat, c = p.somme, t = ok ? vers7(c) : versBord(c);
      const morceaux = [];
      if (t !== c) {
        const voisin = E.piste[t];
        if (voisin.k === 'esprit' && !ok) morceaux.push(`${E.piste[c].nom} reste en ${c} (un échec ne fait pas avancer l'esprit)`);
        else {
          E.piste[t] = E.piste[c]; E.piste[c] = voisin;
          if (voisin.k === 'esprit') { this.stats.tir_a_la_corde++; morceaux.push(`${E.piste[t].nom} monte en ${t} et repousse l'esprit en ${c} : tir à la corde`); }
          else morceaux.push(`${E.piste[t].nom} passe de ${c} à ${t}${ok ? ', vers le centre' : ', vers le bord'}`);
        }
      } else morceaux.push(`${E.piste[c].nom} reste en ${c}`);
      const cm = p.caseM, tm = ok ? Math.max(1, cm - 1) : Math.min(5, cm + 1);
      if (tm !== cm) {
        const a = E.pisteM[cm]; E.pisteM[cm] = E.pisteM[tm]; E.pisteM[tm] = a;
        morceaux.push(`${this.machine(a).nom} passe en case ${tm} des Machines`);
      }
      await this.note('apprend', `Le Méchant apprend (${ok ? 'réussite' : 'échec'}) : ${morceaux.join(' ; ')}.`, { ok, de: c, vers: t });
    }

    // ---------------------------------------------------------------- bilan
    resume() {
      const E = this.etat, fo = this.foret();
      return { version: VERSION, graine: this.graine, params: this.params,
        sieges: this.sieges.map((s) => ({ peuple: s.peuple, type: s.type, profil: s.type === 'bot' ? s.profil : null })),
        fin: E.fin || { type: 'en cours', tour: E.tour }, foret: fo, pct: Math.round((fo / 21) * 1000) / 10,
        reves: Object.assign({}, E.reves), main_finale: Object.assign({}, E.main), stats: Object.assign({}, this.stats),
        decisions: this.decisions };
    }
  }

  const Noyau = { valeurTable, VERSION, ZONES, VOISINS, FLECHE, MACHINES, PISTE0, PEUPLES, ORDRE_PEUPLES, PARAMS, SPECIALISTES, Partie, generateur, nomZ };
  G.Noyau = Noyau;
  if (typeof module !== 'undefined') module.exports = Noyau;
})(typeof globalThis !== 'undefined' ? globalThis : this);
