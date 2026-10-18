/* Moteur de « Couronne aux deux pistes » : le kit par joueur (docs/regles_placement.md, P1 à P5 avec la couronne)
   où l'annonce est remplacée par les deux pistes du Méchant, lues sur deux dés, et où chaque joueur programme deux
   ordres révélés en deux étapes (projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md). Sans interface.

   Un tour : programmation (une carte par étape et par joueur) → étape 1 → vague 1 (L lancers) → étape 2 → vague 2.
   Un lancer : somme des dés → tuile de la piste des pensées (une tactique) ; écart → case de la piste des Machines.
   Apprendre : la tuile de tactique et la Machine désignées s'échangent avec une voisine, selon le même verdict. */
(function (G) {
  'use strict';
  const TACTIQUES = ['cupidite', 'percee', 'opportunisme', 'represailles'];
  const NOMS_TACTIQUES = { cupidite: 'Cupidité', percee: 'Percée', opportunisme: 'Opportunisme', represailles: 'Représailles' };
  const RIEN = 'rien', GARDER = 'garder', ALLER = 'aller', SABOTER = 'saboter';

  // Piste des pensées, cases 2 à 12 : la disposition de départ de l'atelier v2 (nœud A2a), sans esprit.
  const PENSEES_DEPART = { 2: 'percee', 3: 'represailles', 4: 'percee', 5: 'represailles', 6: 'opportunisme', 7: 'cupidite',
    8: 'opportunisme', 9: 'represailles', 10: 'percee', 11: 'cupidite', 12: 'cupidite' };
  const CHANCES_SOMME = (s) => 6 - Math.abs(s - 7);          // sur 36
  // Piste des Machines : six cases imprimées dans l'ordre des probabilités (décision du 16 oct., 13 h 11).
  const ECARTS = [1, 2, 0, 3, 4, 5];
  const CHANCES_ECART = { 0: 6, 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 };
  // Les six Machines (noms de l'atelier) ; la Machine m part sur la case d'écart ECART_DEPART[m].
  const MACHINES = [
    { nom: 'Grosse Gueule', court: 'GG' }, { nom: 'Rapiat', court: 'Ra' }, { nom: 'Mâchoire', court: 'Mâ' },
    { nom: 'Tonton Débard', court: 'TD' }, { nom: 'Ripaille', court: 'Ri' }, { nom: 'Zizanie', court: 'Zi' }];
  const ECART_DEPART = [1, 2, 3, 4, 5, 0];
  const NM = MACHINES.length;

  const DEFAUTS = { joueurs: 3, etapes: 2, lancersEnPlus: 1, rythme: 'lancer', presage: false, tuileL: 3, tuileP: 3,
    individusParJoueur: 3, arbres: 3, coeurArbres: 0, tours: 4, apprentissage: true, sabotage: 'echappe', graine: 1 };

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
      I: r.individusParJoueur * r.joueurs, ipj: r.individusParJoueur, E: r.etapes, k: r.joueurs,
      L: r.joueurs + r.lancersEnPlus, surPlateau: Math.min(r.joueurs + 1, NM), rythme: r.rythme, presage: !!r.presage,
      apprentissage: r.apprentissage !== false, sabotage: r.sabotage || 'echappe',
      tours: r.tours, graine: r.graine, reglages: r,
    };
    p.lancersParTour = p.L * p.E;
    p.ordresParTour = p.k * p.E;
    p.c0 = p.J * p.l * p.q * p.a + p.coeurArbres;
    const err = [];
    if (p.J < 1 || p.J > 6) err.push('de 1 à 6 joueurs');
    if (p.E < 1 || p.E > 2) err.push('une ou deux étapes');
    if (p.L <= p.k) err.push('il faut plus de lancers que d\'ordres par vague');
    if (p.c0 <= p.lancersParTour * p.tours) err.push('la forêt de départ doit dépasser le nombre total de lancers');
    if (p.rythme !== 'lancer' && p.rythme !== 'vague') err.push('rythme : « lancer » ou « vague »');
    if (!['echappe', 'fige', 'chantier', 'aucun'].includes(p.sabotage)) err.push('sabotage : echappe, fige, chantier ou aucun');
    p.erreurs = err;
    return p;
  }

  // P1.1 bis : J tuiles l × q autour du Cœur (case 0) ; identique au kit.
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

  // Tuiles de la piste des pensées : 11 tuiles numérotées (identité), chacune porte une tactique.
  const TUILES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => PENSEES_DEPART[s]);

  // Mise en place : arbres ; min(J + 1, 6) Machines sur le plateau, posées dans l'ordre 1, 2, 3, 4, 5, 0 (la Machine j < J
  // sur la lisière de la tuile j, les autres sur une lisière tirée) ; les autres au chantier (−1). Pistes de départ.
  function miseEnPlace(p, pl, rng) {
    const arbres = new Array(pl.N).fill(p.a); arbres[0] = p.coeurArbres;
    const machines = new Array(NM).fill(-1);
    for (let m = 0; m < p.surPlateau; m++) {
      const li = m < p.J ? pl.lisieres[m] : pl.lisieres[rng.entier(p.J)];
      machines[m] = rng.choix(li);
    }
    const pensees = new Array(13).fill(-1);
    for (let s = 2; s <= 12; s++) pensees[s] = s - 2;                 // la tuile n° s − 2 en case s
    const pisteM = ECARTS.map((d) => ECART_DEPART.indexOf(d));         // position → Machine
    return { arbres, machines, individus: [], tour: 0, pensees, pisteM };
  }

  const copie = (e) => ({ arbres: e.arbres.slice(), machines: e.machines.slice(), individus: e.individus.slice(), tour: e.tour,
    pensees: e.pensees.slice(), pisteM: e.pisteM.slice() });
  const foret = (e) => e.arbres.reduce((s, x) => s + x, 0);
  const tactiqueEn = (e, s) => TUILES[e.pensees[s]];

  // Les tirages d'un tour : pour chaque étape, L lancers ; un lancer = deux dés et une entrée (tuile, colonne) qui ne sert
  // que si la Machine désignée est au chantier. Tous les tirages du jeu sont faits au début de la partie.
  function tirerLancer(p, rng) { return { d: [1 + rng.entier(6), 1 + rng.entier(6)], t: rng.entier(p.J), c: rng.entier(p.l) }; }
  function tirerTour(p, rng) {
    const out = [];
    for (let v = 0; v < p.E; v++) { const w = []; for (let k = 0; k < p.L; k++) w.push(tirerLancer(p, rng)); out.push(w); }
    return out;
  }

  // Ce que désigne un lancer sur les pistes du moment
  function lire(e, d) {
    const somme = d[0] + d[1], ecart = Math.abs(d[0] - d[1]);
    const pos = ECARTS.indexOf(ecart);
    return { somme, ecart, tuile: e.pensees[somme], tactique: TUILES[e.pensees[somme]], pos, machine: e.pisteM[pos] };
  }

  function presence(e) { const m = {}; for (const c of e.individus) m[c] = (m[c] || 0) + 1; return m; }
  function cmp(a, b) { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; }
  function minPar(xs, cle) { let best = xs[0], kb = cle(xs[0]); for (const x of xs.slice(1)) { const k = cle(x); if (cmp(k, kb) < 0) { best = x; kb = k; } } return best; }

  function plusProcheBoisee(pl, e, depuis) {
    const d = pl.dist[depuis]; const A = e.arbres; const boisees = [];
    for (let c = 0; c < pl.N; c++) if (A[c] > 0) boisees.push(c);
    return minPar(boisees, (c) => [d[c], -A[c], pl.coeur[c], c]);
  }

  // P4.2 à P4.4 : la case visée par une Machine du plateau, lue sur la configuration du moment ; [case, repli]
  function destination(p, pl, e, machine, tactique) {
    const pos = e.machines[machine]; const A = e.arbres;
    const rayon = [pos].concat(pl.voisins[pos]).filter((c) => A[c] > 0);
    if (!rayon.length) return [plusProcheBoisee(pl, e, pos), true];
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

  // Une Machine appelée au chantier entre sur la case de lisière tirée et y abat (ou, sans arbre, sur la case boisée
  // la plus proche) ; [case d'entrée, case visée]
  function entree(p, pl, e, lancer) {
    const e0 = pl.lisieres[lancer.t][lancer.c];
    return [e0, e.arbres[e0] > 0 ? e0 : plusProcheBoisee(pl, e, e0)];
  }

  // Apprendre (verdict partagé, décision du 16 oct., 13 h 09) : la tuile de tactique et la Machine s'échangent avec une
  // voisine. Réussite : vers le 7 / vers le côté probable. Échec : vers le bord (au 7, vers le 8) / vers le côté rare.
  // On cherche la tuile et la Machine par leur identité : avec le rythme « vague », elles ont pu bouger entre-temps.
  function apprendre(e, tuile, machine, reussite) {
    const s = e.pensees.indexOf(tuile);
    let n = null;
    if (reussite) n = s < 7 ? s + 1 : (s > 7 ? s - 1 : null);
    else n = s < 7 ? (s > 2 ? s - 1 : null) : (s > 7 ? (s < 12 ? s + 1 : null) : 8);
    if (n !== null) { const x = e.pensees[s]; e.pensees[s] = e.pensees[n]; e.pensees[n] = x; }
    const pos = e.pisteM.indexOf(machine);
    let np = reussite ? (pos > 0 ? pos - 1 : null) : (pos < NM - 1 ? pos + 1 : null);
    if (np !== null) { const x = e.pisteM[pos]; e.pisteM[pos] = e.pisteM[np]; e.pisteM[np] = x; }
    return { pensees: [s, n], machines: [pos, np] };
  }

  // Les ordres possibles d'un individu à une étape, depuis sa position prévue (pos) ; saboter vise une Machine qui est
  // sur cette case au moment où l'on programme.
  function ordresPossibles(p, pl, e, i, pos) {
    if (pos === undefined) pos = e.individus[i];
    const ops = [[GARDER, pos]];
    if (p.sabotage !== 'aucun') e.machines.forEach((m, j) => { if (m === pos) ops.push([SABOTER, j]); });
    for (const c of pl.voisins[pos]) ops.push([ALLER, c]);
    return ops;
  }

  // Les cartes : cartes[j] = [carte de l'étape 1, carte de l'étape 2], chacune {i, o} ou null.
  const cartesVides = (p) => Array.from({ length: p.J }, () => new Array(p.E).fill(null));
  // position prévue de chaque individu avant l'étape v (un individu ne bouge que par ses propres ordres)
  function positionsPrevues(p, e, cartes, v) {
    const pos = e.individus.slice();
    for (let w = 0; w < v; w++) for (const cs of cartes) { const c = cs[w]; if (c && c.o[0] === ALLER) pos[c.i] = c.o[1]; }
    return pos;
  }
  function programmeEtape(p, cartes, v) {
    const prog = Array.from({ length: p.I }, () => [RIEN, null]);
    cartes.forEach((cs, j) => { const c = cs[v]; if (c) { if (proprietaire(p, c.i) !== j) throw new Error('un joueur commande l\'individu d\'un autre'); prog[c.i] = c.o; } });
    return prog;
  }

  // Révéler une étape : déplacements, puis gardes et sabotages posés (P3.3). Un ordre devenu impossible est perdu.
  function reveler(p, pl, e, prog) {
    const gardes = {}, sab = {}, quiG = {}, quiS = {}, perdus = [];
    prog.forEach(([typ, arg], i) => {
      if (typ !== ALLER) return;
      if (pl.dist[e.individus[i]][arg] !== 1) { perdus.push({ i, o: [typ, arg], pourquoi: 'case hors de portée' }); return; }
      e.individus[i] = arg;
    });
    prog.forEach(([typ, arg], i) => {
      if (typ === GARDER) {
        const c = e.individus[i];
        if (arg !== c) { perdus.push({ i, o: [typ, arg], pourquoi: 'l\'individu n\'est pas sur cette case' }); return; }
        gardes[c] = (gardes[c] || 0) + 1; (quiG[c] = quiG[c] || []).push(i);
      } else if (typ === SABOTER) {
        if (e.machines[arg] !== e.individus[i]) { perdus.push({ i, o: [typ, arg], pourquoi: 'la Machine a quitté la case' }); return; }
        sab[arg] = (sab[arg] || 0) + 1; (quiS[arg] = quiS[arg] || []).push(i);
      }
    });
    return { gardes, sab, quiG, quiS, perdus };
  }

  // Un lancer ; renvoie l'événement complet (pour le pas à pas, le journal et l'apprentissage)
  function executerLancer(p, pl, e, pose, lancer, attente) {
    const L = lire(e, lancer.d); const m = L.machine;
    const ev = { d: lancer.d, somme: L.somme, ecart: L.ecart, tuile: L.tuile, tactique: L.tactique, machine: m, de: e.machines[m] };
    if (e.machines[m] < 0) {                               // au chantier : elle entre
      const [e0, cible] = entree(p, pl, e, lancer);
      Object.assign(ev, { entree: e0, cible, repli: cible !== e0 });
      if ((pose.gardes[cible] || 0) > 0) {
        pose.gardes[cible]--; e.machines[m] = e0;
        Object.assign(ev, { issue: 'gardee', qui: pose.quiG[cible].shift(), lieu: cible });
      } else { e.machines[m] = cible; e.arbres[cible]--; ev.issue = 'abattu'; }
    } else {
      const [cible, repli] = destination(p, pl, e, m, L.tactique);
      Object.assign(ev, { cible, repli });
      if ((pose.sab[m] || 0) > 0) {                        // P4.5 : sabotage d'abord
        pose.sab[m]--; const de = e.machines[m];
        if (p.sabotage === 'fige') e.machines[m] = de;
        else if (p.sabotage === 'chantier') e.machines[m] = -1;
        else e.machines[m] = cible;
        Object.assign(ev, { issue: 'sabotee', qui: pose.quiS[m].shift(), lieu: de });
      } else if ((pose.gardes[cible] || 0) > 0) {          // P4.6 : la garde, la Machine reste
        pose.gardes[cible]--;
        Object.assign(ev, { issue: 'gardee', qui: pose.quiG[cible].shift(), lieu: cible });
      } else { e.machines[m] = cible; e.arbres[cible]--; ev.issue = 'abattu'; }
    }
    const verdict = { tuile: L.tuile, machine: m, reussite: ev.issue === 'abattu' };
    const app = (v) => p.apprentissage ? apprendre(e, v.tuile, v.machine, v.reussite)
      : { pensees: [e.pensees.indexOf(v.tuile), null], machines: [e.pisteM.indexOf(v.machine), null] };
    if (p.rythme === 'lancer') ev.appris = app(verdict);
    else attente.push(verdict);
    return ev;
  }
  // fin de vague (rythme « vague ») : les échanges en attente, dans l'ordre des lancers
  function finVague(p, e, attente) {
    return attente.splice(0).map((v) => p.apprentissage ? apprendre(e, v.tuile, v.machine, v.reussite)
      : { pensees: [e.pensees.indexOf(v.tuile), null], machines: [e.pisteM.indexOf(v.machine), null] });
  }

  // Un tour complet, sans pas à pas (bots, séries, tests) ; renvoie les événements, étape par étape
  function jouerTour(p, pl, e, cartes, tirage) {
    const etapes = [];
    for (let v = 0; v < p.E; v++) {
      const pose = reveler(p, pl, e, programmeEtape(p, cartes, v));
      const attente = [];
      const evts = tirage[v].map((l) => executerLancer(p, pl, e, pose, l, attente));
      const appris = finVague(p, e, attente);
      etapes.push({ perdus: pose.perdus, evts, appris });
    }
    e.tour++;
    return etapes;
  }
  const paradesEtapes = (etapes) => etapes.reduce((s, x) => s + x.evts.filter((v) => v.issue !== 'abattu').length, 0);

  // ------------------------------------------------------------ lecture des pistes (ce que voient les joueurs)
  // Les 36 issues des dés : pour chacune, la tactique et la Machine désignées.
  const ISSUES = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) ISSUES.push([a, b]);
  // chances (sur 36) que la prochaine menace soit le fait de chaque Machine, et le profil de ses tactiques
  function profils(e) {
    const out = MACHINES.map(() => ({ chances: 0, tactiques: { cupidite: 0, percee: 0, opportunisme: 0, represailles: 0 } }));
    for (const d of ISSUES) { const L = lire(e, d); out[L.machine].chances++; out[L.machine].tactiques[L.tactique]++; }
    return out;
  }
  // probabilité qu'un lancer frappe chaque case, sur la configuration du moment (les entrées du chantier sont réparties
  // sur toutes les cases de lisière)
  function menaceParCase(p, pl, e) {
    const pr = new Array(pl.N).fill(0);
    const nl = p.J * p.l;
    for (const d of ISSUES) {
      const L = lire(e, d);
      if (e.machines[L.machine] >= 0) pr[destination(p, pl, e, L.machine, L.tactique)[0]] += 1 / 36;
      else for (let t = 0; t < p.J; t++) for (let c = 0; c < p.l; c++) pr[entree(p, pl, e, { t, c })[1]] += 1 / 36 / nl;
    }
    return pr;
  }
  // chance qu'une Machine agisse au moins une fois dans une vague de L lancers (pistes figées)
  const auMoinsUneFois = (chances, L) => 1 - Math.pow(1 - chances / 36, L);

  const CASES_DEPART = (p, pl, i) => { const j = proprietaire(p, i); const out = []; for (let c = 0; c < pl.N; c++) if (pl.tuile[c] === j) out.push(c); return out; };

  // Placement initial commun : sur sa tuile, devant les Machines du plateau, sans s'empiler (comme le kit)
  function placementHeuristique(p, pl, e) {
    const pris = [];
    const surPl = e.machines.filter((m) => m >= 0);
    for (let i = 0; i < p.I; i++) {
      const score = (c) => surPl.reduce((s, m) => s + Math.max(0, 3 - pl.dist[m][c]), 0) + 0.05 * e.arbres[c]
        - 3 * pris.filter((x) => x === c).length - 0.01 * pl.coeur[c];
      let best = null, sb = -Infinity;
      for (const c of CASES_DEPART(p, pl, i)) { const s = score(c); if (s > sb || (s === sb && c < best)) { best = c; sb = s; } }
      pris.push(best);
    }
    return pris;
  }

  // Explication détaillée du ciblage d'une Machine (pour le mode didactique et l'inspection)
  function detailDestination(p, pl, e, machine, tactique) {
    const pos = e.machines[machine];
    if (pos < 0) return { depart: -1, cible: -1, repli: false, candidats: [] };
    const A = e.arbres;
    const pres = presence(e);
    const voisins = [pos].concat(pl.voisins[pos]);
    const rayon = voisins.filter((c) => A[c] > 0);
    const [cible, repli] = destination(p, pl, e, machine, tactique);
    const candidats = rayon.map((c) => ({
      c,
      arbres: A[c],
      distCoeur: pl.dist[0][c],
      individus: pres[c] || 0,
      surPlace: c === pos,
      choisi: c === cible
    }));
    return { depart: pos, cible, repli, rayon, tousVoisins: voisins, candidats };
  }

  // ------------------------------------------------------------ Mécanique 1B : Pistes publiques & Attaques Croisées
  // Au début du tour, les L attaques de la Vague 1 sont posées face cachée sous forme de paires (Carte Machine, Carte Tactique).
  // Pour k < J :
  //   - Le Joueur k regarde secrètement la Carte Machine de l'Attaque k (Indice 0) ;
  //   - Le Joueur k regarde secrètement la Carte Tactique de l'Attaque (k + 1) % J (Indice 1) ;
  //   - Chaque joueur retourne 1 de ses 2 cartes face visible (reveles[k] = 0 pour Machine_k, 1 pour Tactique_{(k+1)%J}).
  // S'il y a L > J attaques (ex. L = J + 1), l'Attaque J est une « Attaque d'Embuscade » non inspectée par les éclaireurs.
  function indicesTour1B(p, e, vague0) {
    const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const attaques = vague0.map((l, k) => {
      const L = lire(e, l.d);
      const embuscade = k >= p.J;
      const joueurM = embuscade ? null : k;
      const joueurT = embuscade ? null : (k - 1 + p.J) % p.J;
      return {
        k,
        code: ROMAINS[k] || String(k + 1),
        d: l.d.slice(),
        t: l.t,
        c: l.c,
        somme: L.somme,
        ecart: L.ecart,
        pos: L.pos,
        rangM: L.pos + 1,
        tuile: L.tuile,
        tactique: L.tactique,
        machine: L.machine,
        chancesM: CHANCES_ECART[L.ecart],
        chancesT: CHANCES_SOMME(L.somme),
        embuscade,
        joueurM,
        joueurT
      };
    });

    const mains = [];
    for (let j = 0; j < p.J; j++) {
      const attM = attaques[j];
      const attT = attaques[(j + 1) % p.J];
      mains.push([
        {
          slot: 0,
          type: 'machine',
          attIdx: attM.k,
          attCode: attM.code,
          machine: attM.machine,
          pos: attM.pos,
          rangM: attM.rangM,
          ecart: attM.ecart,
          chances: attM.chancesM
        },
        {
          slot: 1,
          type: 'tactique',
          attIdx: attT.k,
          attCode: attT.code,
          tactique: attT.tactique,
          somme: attT.somme,
          tuile: attT.tuile,
          chances: attT.chancesT
        }
      ]);
    }
    return { attaques, mains };
  }

  // État de connaissance de chaque attaque de la Vague 1 du point de vue de `jObservateur`
  // (`jObservateur` = 0..J-1 pour un joueur, -1 pour la vue strictement publique, 'omniscient' pour tout voir)
  function etatAttaques1B(p, pl, e, vague0, reveles, jObservateur) {
    const info = indicesTour1B(p, e, vague0);
    const rev = reveles || [];
    return info.attaques.map((att) => {
      const mPub = !att.embuscade && rev[att.joueurM] === 0;
      const mSec = !att.embuscade && !mPub && (jObservateur === att.joueurM || jObservateur === 'omniscient');
      const statutM = mPub ? 'public' : (mSec ? 'secret' : 'cache');

      const tPub = !att.embuscade && rev[att.joueurT] === 1;
      const tSec = !att.embuscade && !tPub && (jObservateur === att.joueurT || jObservateur === 'omniscient');
      const statutT = tPub ? 'public' : (tSec ? 'secret' : 'cache');

      const connaisM = statutM !== 'cache';
      const connaisT = statutT !== 'cache';

      // Calcul de la distribution des cases cibles et des Machines possibles pour cette attaque selon ce que sait jObservateur
      const probCibles = new Array(pl.N).fill(0);
      const probMachines = new Array(NM).fill(0);
      const nl = p.J * p.l;

      const ajouterCouple = (m, tac, poids) => {
        probMachines[m] += poids;
        if (e.machines[m] >= 0) {
          const c = destination(p, pl, e, m, tac)[0];
          probCibles[c] += poids;
        } else {
          for (let t = 0; t < p.J; t++) for (let c = 0; c < p.l; c++) probCibles[entree(p, pl, e, { t, c })[1]] += poids / nl;
        }
      };

      if (connaisM && connaisT) {
        ajouterCouple(att.machine, att.tactique, 1);
      } else if (connaisM && !connaisT) {
        for (let s = 2; s <= 12; s++) {
          ajouterCouple(att.machine, tactiqueEn(e, s), CHANCES_SOMME(s) / 36);
        }
      } else if (!connaisM && connaisT) {
        ECARTS.forEach((ec, pos) => {
          ajouterCouple(e.pisteM[pos], att.tactique, CHANCES_ECART[ec] / 36);
        });
      } else {
        for (const d of ISSUES) {
          const L = lire(e, d);
          ajouterCouple(L.machine, L.tactique, 1 / 36);
        }
      }

      return Object.assign({}, att, {
        statutM,
        statutT,
        connaisM,
        connaisT,
        complet: connaisM && connaisT,
        completPublic: mPub && tPub,
        probCibles,
        probMachines
      });
    });
  }

  // Probabilité qu'au moins une attaque de la Vague 1 frappe chaque case (et chaque Machine), compte tenu des indices 1B connus par jObservateur
  function menaceVague1B(p, pl, e, vague0, reveles, jObservateur) {
    const etats = etatAttaques1B(p, pl, e, vague0, reveles, jObservateur);
    const nonFrappeCase = new Array(pl.N).fill(1);
    const nonAgitMachine = new Array(NM).fill(1);
    const espCase = new Array(pl.N).fill(0);
    const espMachine = new Array(NM).fill(0);

    for (const att of etats) {
      for (let c = 0; c < pl.N; c++) {
        nonFrappeCase[c] *= (1 - att.probCibles[c]);
        espCase[c] += att.probCibles[c];
      }
      for (let m = 0; m < NM; m++) {
        nonAgitMachine[m] *= (1 - att.probMachines[m]);
        espMachine[m] += att.probMachines[m];
      }
    }
    return {
      etats,
      probCaseAuMoins1: nonFrappeCase.map((x) => 1 - x),
      probMachineAuMoins1: nonAgitMachine.map((x) => 1 - x),
      espCase,
      espMachine
    };
  }

  // Une partie entière avec ses tirages (faits d'avance à partir de la graine)
  function nouvellePartie(reglages) {
    const p = params(reglages); const pl = plateau(p);
    const rng = generateur(p.graine);
    const e = miseEnPlace(p, pl, rng);
    e.individus = placementHeuristique(p, pl, e);
    const tirages = []; for (let t = 0; t < p.tours; t++) tirages.push(tirerTour(p, rng));
    return { p, pl, e, tirages };
  }

  const API = { TACTIQUES, NOMS_TACTIQUES, RIEN, GARDER, ALLER, SABOTER, DEFAUTS, PENSEES_DEPART, CHANCES_SOMME, ECARTS, CHANCES_ECART,
    MACHINES, ECART_DEPART, TUILES, generateur, params, plateau, proprietaire, miseEnPlace, copie, foret, tactiqueEn,
    tirerLancer, tirerTour, lire, destination, detailDestination, entree, apprendre, ordresPossibles, cartesVides, positionsPrevues, programmeEtape,
    reveler, executerLancer, finVague, jouerTour, paradesEtapes, ISSUES, profils, menaceParCase, auMoinsUneFois,
    indicesTour1B, etatAttaques1B, menaceVague1B,
    casesDepart: CASES_DEPART, placementHeuristique, presence, nouvellePartie };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.PISTES = API;
})(typeof window !== 'undefined' ? window : globalThis);
