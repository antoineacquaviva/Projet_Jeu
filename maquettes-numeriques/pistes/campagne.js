/* Outil de campagne, d'évaluation automatique et de génération de tableau de bord pour « Couronne aux deux pistes ».
   Usage :
     node maquettes-numeriques/pistes/campagne.js [plan.json] [--echelle 1.0] [--sortie resultats/pistes]
   Produit :
     - <sortie>/<nom>_synthese.json
     - <sortie>/<nom>_rapport.md
     - maquettes-numeriques/pistes/laboratoire.html (tableau de bord interactif) */
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./moteur.js');
const B = require('./bots.js');

const { RIEN, GARDER, ALLER, SABOTER } = K;

// ------------------------------------------------------------ 1. Bots témoins (boucles, ablations, jeu restreint)

// Boucle 1 : Sentinelle — ne se déplace jamais, garde toujours ses cases de départ à tour de rôle sans lire les pistes
function botSentinelle(p, pl, e, cartes, joueurs) {
  for (const j of joueurs) {
    const inds = B.individusDe(p, j);
    for (let v = 0; v < p.E; v++) {
      const i = inds[(e.tour + v) % inds.length];
      cartes[j][v] = { i, o: [GARDER, e.individus[i]] };
    }
  }
}

// Boucle 2 : Marquage — sabote si sur une Machine, sinon avance vers la Machine la plus proche (sans lire les pistes)
function botMarquage(p, pl, e, cartes, joueurs) {
  const machPos = e.machines.filter((m) => m >= 0);
  for (const j of joueurs) {
    const inds = B.individusDe(p, j);
    for (let v = 0; v < p.E; v++) {
      const pos = K.positionsPrevues(p, e, cartes, v);
      let choisi = null;
      // 1. saboter si possible
      if (p.sabotage !== 'aucun') {
        for (const i of inds) {
          const m = e.machines.findIndex((mc) => mc === pos[i]);
          if (m >= 0) { choisi = { i, o: [SABOTER, m] }; break; }
        }
      }
      // 2. sinon rapprocher le premier individu de la Machine la plus proche
      if (!choisi && machPos.length) {
        const i = inds[v % inds.length];
        const c0 = pos[i];
        let bestC = null, bestD = Infinity;
        for (const c of pl.voisins[c0]) {
          const d = Math.min(...machPos.map((m) => pl.dist[c][m]));
          if (d < bestD) { bestD = d; bestC = c; }
        }
        const dAct = Math.min(...machPos.map((m) => pl.dist[c0][m]));
        if (bestC !== null && bestD < dAct) choisi = { i, o: [ALLER, bestC] };
      }
      if (!choisi) {
        const i = inds[v % inds.length];
        choisi = { i, o: [GARDER, pos[i]] };
      }
      cartes[j][v] = choisi;
    }
  }
}

// Boucle 3 : Regroupement — converge vers le Cœur (case 0) et son anneau intérieur, puis garde sans lire les pistes
function botRegroupement(p, pl, e, cartes, joueurs) {
  for (const j of joueurs) {
    const inds = B.individusDe(p, j);
    for (let v = 0; v < p.E; v++) {
      const pos = K.positionsPrevues(p, e, cartes, v);
      const i = inds[(e.tour + v) % inds.length];
      const c0 = pos[i];
      if (pl.dist[0][c0] > 1) {
        const versCoeur = pl.voisins[c0].find((c) => pl.dist[0][c] < pl.dist[0][c0]);
        if (versCoeur !== undefined) { cartes[j][v] = { i, o: [ALLER, versCoeur] }; continue; }
      }
      cartes[j][v] = { i, o: [GARDER, c0] };
    }
  }
}

// Glouton paramétrable (pour ablations : immobile, sans_sabotage, aveugle aux pistes, myope)
function jouerGloutonVariante(opts) {
  return function (p, pl, e, cartes, joueurs, rng, ctx) {
    const S = opts.S || 10;
    // Si aveugle : le bot croit que les pistes sont mélangées aléatoirement à chaque tirage
    const eSim = K.copie(e);
    const echant = [];
    for (let s = 0; s < S; s++) {
      const t = K.tirerTour(p, rng);
      if (!opts.aveugle && ctx && ctx.connus) t[0].forEach((l, k) => { l.d = ctx.connus[k].slice(); });
      echant.push(t);
    }
    const pr0 = opts.aveugle ? new Array(pl.N).fill(1 / pl.N) : K.menaceParCase(p, pl, e);
    const prof0 = K.profils(e);

    const optionsFiltrees = (essai, j, v) => {
      const pos = K.positionsPrevues(p, e, essai, v);
      const out = [];
      for (const i of B.individusDe(p, j)) {
        for (const o of K.ordresPossibles(p, pl, e, i, pos[i])) {
          if (opts.immobile && o[0] === ALLER) continue;
          if (opts.sansSabotage && o[0] === SABOTER) continue;
          out.push({ i, o });
        }
      }
      if (!out.length) out.push(null);
      return out;
    };

    const bonusTie = (cs) => {
      let b = 0;
      for (let v = 0; v < cs.length; v++) {
        const c = cs[v]; if (!c) continue;
        if (c.o[0] === GARDER) b += 0.001 * (1 + pr0[c.o[1]]);
        else if (c.o[0] === SABOTER) b += 0.001 * (1 + (opts.aveugle ? 6 / 36 : prof0[c.o[1]].chances / 36));
        else if (c.o[0] === ALLER) b += 0.0005 * (1 + pr0[c.o[1]] + 0.1 / (1 + pl.dist[0][c.o[1]]));
      }
      return b;
    };

    const evalEssai = (essai) => {
      let tot = 0;
      for (let s = 0; s < echant.length; s++) {
        const f = K.copie(eSim);
        if (opts.aveugle) {
          f.pensees = [-1, -1].concat(rng.melange([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
          f.pisteM = rng.melange([0, 1, 2, 3, 4, 5]);
        }
        tot += K.paradesEtapes(K.jouerTour(p, pl, f, essai, echant[s]));
      }
      return tot / echant.length;
    };

    if (opts.myope && p.E === 2) {
      // Choisit l'étape 1 seule sur la vague 1, puis l'étape 2 comme si la vague 1 n'avait pas déplacé les Machines
      const p1 = Object.assign({}, p, { E: 1 });
      const ech1 = echant.map((t) => [t[0]]);
      const ech2 = echant.map((t) => [t[1]]);
      for (const j of joueurs) {
        let best1 = null;
        const essai1 = K.cartesVides(p1);
        for (let jj = 0; jj < p.J; jj++) essai1[jj][0] = cartes[jj][0];
        for (const c of optionsFiltrees( cartes, j, 0)) {
          essai1[j][0] = c;
          let tot = 0;
          for (const t of ech1) { const f = K.copie(e); tot += K.paradesEtapes(K.jouerTour(p1, pl, f, essai1, t)); }
          const val = tot / ech1.length + bonusTie([c]);
          if (!best1 || val > best1.v + 1e-9) best1 = { v: val, c };
        }
        cartes[j][0] = best1.c;
        // Étape 2 évaluée sur l'état de départ (avec seulement le déplacement propre du joueur en étape 1)
        const posApres1 = K.positionsPrevues(p, e, cartes, 1);
        const eFige = K.copie(e); eFige.individus = posApres1;
        let best2 = null;
        const essai2 = K.cartesVides(p1);
        for (const c of optionsFiltrees(cartes, j, 1)) {
          essai2[j][0] = c;
          let tot = 0;
          for (const t of ech2) { const f = K.copie(eFige); tot += K.paradesEtapes(K.jouerTour(p1, pl, f, essai2, t)); }
          const val = tot / ech2.length + bonusTie([c]);
          if (!best2 || val > best2.v + 1e-9) best2 = { v: val, c };
        }
        cartes[j][1] = best2.c;
      }
      return;
    }

    for (const j of joueurs) {
      let best = null;
      const essai = cartes.map((cs) => cs.slice());
      const parcourir = (v) => {
        if (v === p.E) {
          const val = evalEssai(essai) + bonusTie(essai[j]);
          if (!best || val > best.v + 1e-9) best = { v: val, cs: essai[j].slice() };
          return;
        }
        for (const c of optionsFiltrees(essai, j, v)) { essai[j][v] = c; parcourir(v + 1); }
        essai[j][v] = null;
      };
      parcourir(0);
      cartes[j] = best.cs;
    }
  };
}

const CATALOGUE_BOTS = {
  hasard: (p, pl, e, cs, js, rng) => B.BOTS.hasard.jouer(p, pl, e, cs, js, rng),
  sentinelle: botSentinelle,
  marquage: botMarquage,
  regroupement: botRegroupement,
  reflexe: (p, pl, e, cs, js, rng, ctx) => B.BOTS.reflexe.jouer(p, pl, e, cs, js, rng, ctx),
  glouton_aveugle: jouerGloutonVariante({ aveugle: true, S: 6 }),
  glouton_immobile: jouerGloutonVariante({ immobile: true, S: 6 }),
  glouton_sans_sabotage: jouerGloutonVariante({ sansSabotage: true, S: 6 }),
  glouton_myope: jouerGloutonVariante({ myope: true, S: 6 }),
  glouton: (p, pl, e, cs, js, rng, ctx) => B.BOTS.stratege.jouer(p, pl, e, cs, js, rng, ctx, 6),
  prevoyant: (p, pl, e, cs, js, rng, ctx) => B.BOTS.prevoyant.jouer(p, pl, e, cs, js, rng, ctx, 8, 1),
};

// ------------------------------------------------------------ 2. Simulation d'une partie et collecte des compteurs (T1)

function jouerPartieBot(reglages, nomBot) {
  const { p, pl, e, tirages } = K.nouvellePartie(reglages);
  const rb = K.generateur(p.graine * 7919 + 17);
  const tous = Array.from({ length: p.J }, (_, j) => j);
  const parJoueur = new Array(p.J).fill(0);
  let parades = 0, pareGarde = 0, pareSabotage = 0, horsTuile = 0, perdus = 0;
  let entreesChantier = 0, echangesPistes = 0, replis = 0;
  const ordres = { garder: 0, aller: 0, saboter: 0, rien: 0 };

  for (let t = 0; t < p.tours; t++) {
    const cartes = K.cartesVides(p);
    const ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice()) } : null;
    CATALOGUE_BOTS[nomBot](p, pl, e, cartes, tous, rb, ctx);
    for (const cs of cartes) for (const c of cs) {
      if (!c || c.o[0] === RIEN) ordres.rien++;
      else ordres[c.o[0]] = (ordres[c.o[0]] || 0) + 1;
    }
    const etapes = K.jouerTour(p, pl, e, cartes, tirages[t]);
    for (const et of etapes) {
      perdus += et.perdus.length;
      for (const ap of et.appris) {
        if (ap.pensees[1] !== null) echangesPistes++;
        if (ap.machines[1] !== null) echangesPistes++;
      }
      for (const v of et.evts) {
        if (v.entree !== undefined) entreesChantier++;
        if (v.repli) replis++;
        if (v.issue !== 'abattu' && v.appris) {
          if (v.appris.pensees[1] !== null) echangesPistes++;
          if (v.appris.machines[1] !== null) echangesPistes++;
        } else if (v.issue === 'abattu' && v.appris) {
          if (v.appris.pensees[1] !== null) echangesPistes++;
          if (v.appris.machines[1] !== null) echangesPistes++;
        }
        if (v.issue === 'abattu') continue;
        parades++;
        if (v.issue === 'gardee') pareGarde++;
        if (v.issue === 'sabotee') pareSabotage++;
        const j = K.proprietaire(p, v.qui);
        parJoueur[j]++;
        if (pl.tuile[v.lieu] !== j) horsTuile++;
      }
    }
  }
  const totalOrdres = p.ordresParTour * p.tours;
  return {
    parades,
    taux: 100 * parades / totalOrdres,
    foret: 100 * K.foret(e) / p.c0,
    agence: 100 * parJoueur.filter((x) => x > 0).length / p.J,
    couplage: parades ? 100 * horsTuile / parades : 0,
    perdus,
    perdus_pct: 100 * perdus / totalOrdres,
    pareGarde,
    pareSabotage,
    entreesChantier,
    echangesPistes,
    replis,
    ordres,
  };
}

// ------------------------------------------------------------ 3. Test T4 du choix disputé Δ(s) par joueur

function mesurerDisputeT4(reglagesBase, nbParties = 12, S = 10) {
  let decPlacer = 0, gagnePlacer = 0, gagneProteger = 0, neutrePlacer = 0;
  let decSabot = 0, gagneSabot = 0, gagneGarde = 0, neutreSabot = 0;
  const seuil = 0.25; // au moins 0,25 parade d'écart attendu sur son tour (soit ~3 points de taux de parade)

  for (let g = 0; g < nbParties; g++) {
    const { p, pl, e, tirages } = K.nouvellePartie(Object.assign({}, reglagesBase, { graine: 9000 + g }));
    const rb = K.generateur(p.graine * 313 + 7);
    const tous = Array.from({ length: p.J }, (_, j) => j);

    for (let t = 0; t < p.tours; t++) {
      const cartesBase = K.cartesVides(p);
      const ctx = p.presage ? { connus: tirages[t][0].map((l) => l.d.slice()) } : null;
      B.BOTS.stratege.jouer(p, pl, e, cartesBase, tous, rb, ctx, 8);
      const echant = B.echantillons(p, rb, S, ctx);

      // Pour chaque joueur, comparer sur les mêmes tirages :
      // (A) meilleur programme contenant au moins un ALLER vs (B) meilleur programme sans ALLER
      for (let j = 0; j < p.J; j++) {
        let maxAller = -Infinity, maxSansAller = -Infinity;
        let maxSabot = -Infinity, maxSansSabot = -Infinity;
        const aMachineSurPion = B.individusDe(p, j).some((i) => e.machines.includes(e.individus[i]));
        const essai = cartesBase.map((cs) => cs.slice());

        const parcourir = (v) => {
          if (v === p.E) {
            const val = B.valeur(p, pl, e, essai, echant);
            const contientAller = essai[j].some((c) => c && c.o[0] === ALLER);
            const contientSabot = essai[j].some((c) => c && c.o[0] === SABOTER);
            if (contientAller) { if (val > maxAller) maxAller = val; }
            else { if (val > maxSansAller) maxSansAller = val; }
            if (aMachineSurPion) {
              if (contientSabot) { if (val > maxSabot) maxSabot = val; }
              else { if (val > maxSansSabot) maxSansSabot = val; }
            }
            return;
          }
          const pos = K.positionsPrevues(p, e, essai, v);
          for (const i of B.individusDe(p, j)) {
            for (const o of K.ordresPossibles(p, pl, e, i, pos[i])) {
              essai[j][v] = { i, o };
              parcourir(v + 1);
            }
          }
          essai[j][v] = null;
        };
        parcourir(0);

        if (maxAller > -Infinity && maxSansAller > -Infinity) {
          decPlacer++;
          const delta = maxAller - maxSansAller;
          if (delta >= seuil) gagnePlacer++;
          else if (delta <= -seuil) gagneProteger++;
          else neutrePlacer++;
        }
        if (aMachineSurPion && maxSabot > -Infinity && maxSansSabot > -Infinity) {
          decSabot++;
          const delta = maxSabot - maxSansSabot;
          if (delta >= seuil) gagneSabot++;
          else if (delta <= -seuil) gagneGarde++;
          else neutreSabot++;
        }
      }
      K.jouerTour(p, pl, e, cartesBase, tirages[t]);
    }
  }
  return {
    placer_vs_proteger: decPlacer ? {
      decisions: decPlacer,
      placer_pct: Math.round(100 * gagnePlacer / decPlacer),
      proteger_pct: Math.round(100 * gagneProteger / decPlacer),
      neutre_pct: Math.round(100 * neutrePlacer / decPlacer),
    } : null,
    saboter_vs_garder: decSabot ? {
      decisions: decSabot,
      saboter_pct: Math.round(100 * gagneSabot / decSabot),
      garder_pct: Math.round(100 * gagneGarde / decSabot),
      neutre_pct: Math.round(100 * neutreSabot / decSabot),
    } : null,
  };
}

// ------------------------------------------------------------ 4. Statistiques appariées, mesures et bandes

const SEUILS = {
  lecture:    [10.0, 3.0],   // prevoyant − meilleure boucle (garde-fou C1)
  profondeur: [4.0, 1.0],    // prevoyant − reflexe
  info:       [4.0, 1.0],    // glouton − glouton_aveugle (lire les pistes sert-il ?)
  placement:  [4.0, 1.0],    // glouton − glouton_immobile (se déplacer sert-il ?)
  maitrise:   [2.0, 0.5],    // prevoyant − glouton (planifier à 2 tours sert-il ?)
};
const DIFFICULTE = [25.0, 75.0, 15.0, 90.0]; // vert entre 25 et 75 %

function moy(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function ecartType(xs) {
  if (xs.length < 2) return 0;
  const m = moy(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1));
}
function apparie(xs, ys) {
  const d = xs.map((x, i) => x - ys[i]);
  return { m: moy(d), ic: d.length > 1 ? 1.96 * ecartType(d) / Math.sqrt(d.length) : 0 };
}
function noteLin(x, vert, rouge) {
  if (x === null || x === undefined) return null;
  if (x >= vert) return 1.0;
  if (x <= rouge) return 0.0;
  return (x - rouge) / (vert - rouge);
}
function noteDiff(x, bas, haut, zbas, zhaut) {
  if (x >= bas && x <= haut) return 1.0;
  if (x < bas) return Math.max(0.0, (x - zbas) / (bas - zbas));
  return Math.max(0.0, (zhaut - x) / (zhaut - haut));
}

function evaluerVariante(reglages, botsListe, nbParties, g0) {
  const parBot = {};
  for (const b of botsListe) parBot[b] = [];
  for (let g = 0; g < nbParties; g++) {
    const reg = Object.assign({}, reglages, { graine: g0 + g });
    for (const b of botsListe) {
      parBot[b].push(jouerPartieBot(reg, b));
    }
  }
  const taux = {};
  for (const b of botsListe) taux[b] = moy(parBot[b].map((x) => x.taux));

  const fort = botsListe.includes('prevoyant') ? 'prevoyant' : 'glouton';
  const tFort = parBot[fort].map((x) => x.taux);
  const m = {
    taux,
    fort,
    taux_fort: taux[fort],
    foret_finale: moy(parBot[fort].map((x) => x.foret)),
    agence: moy(parBot[fort].map((x) => x.agence)),
    couplage: moy(parBot[fort].map((x) => x.couplage)),
    perdus_pct: moy(parBot[fort].map((x) => x.perdus_pct)),
    T1: {
      parades_garde: moy(parBot[fort].map((x) => x.pareGarde)),
      parades_sabotage: moy(parBot[fort].map((x) => x.pareSabotage)),
      entrees_chantier: moy(parBot[fort].map((x) => x.entreesChantier)),
      echanges_pistes: moy(parBot[fort].map((x) => x.echangesPistes)),
      ordres_aller: moy(parBot[fort].map((x) => x.ordres.aller)),
      ordres_garder: moy(parBot[fort].map((x) => x.ordres.garder)),
      ordres_saboter: moy(parBot[fort].map((x) => x.ordres.saboter)),
    },
    T4: mesurerDisputeT4(reglages, Math.min(12, nbParties)),
  };

  // Boucles
  const boucles = ['sentinelle', 'marquage', 'regroupement'].filter((b) => botsListe.includes(b));
  if (boucles.length) {
    const meilleure = boucles.reduce((a, b) => (taux[a] >= taux[b] ? a : b));
    m.meilleure_boucle = meilleure;
    const ap = apparie(tFort, parBot[meilleure].map((x) => x.taux));
    m.lecture = ap.m; m.lecture_ic = ap.ic;
  }
  if (botsListe.includes('reflexe')) {
    const ap = apparie(tFort, parBot.reflexe.map((x) => x.taux));
    m.profondeur = ap.m; m.profondeur_ic = ap.ic;
  }
  if (botsListe.includes('glouton') && botsListe.includes('glouton_aveugle')) {
    const ap = apparie(parBot.glouton.map((x) => x.taux), parBot.glouton_aveugle.map((x) => x.taux));
    m.info = ap.m; m.info_ic = ap.ic;
  }
  if (botsListe.includes('glouton') && botsListe.includes('glouton_immobile')) {
    const ap = apparie(parBot.glouton.map((x) => x.taux), parBot.glouton_immobile.map((x) => x.taux));
    m.placement = ap.m; m.placement_ic = ap.ic;
  }
  if (botsListe.includes('prevoyant') && botsListe.includes('glouton')) {
    const ap = apparie(parBot.prevoyant.map((x) => x.taux), parBot.glouton.map((x) => x.taux));
    m.maitrise = ap.m; m.maitrise_ic = ap.ic;
  }
  if (botsListe.includes('prevoyant') && botsListe.includes('glouton_myope')) {
    const ap = apparie(parBot.prevoyant.map((x) => x.taux), parBot.glouton_myope.map((x) => x.taux));
    m.plan_2etapes = ap.m; m.plan_2etapes_ic = ap.ic;
  }
  if (botsListe.includes('glouton') && botsListe.includes('glouton_sans_sabotage')) {
    const ap = apparie(parBot.glouton.map((x) => x.taux), parBot.glouton_sans_sabotage.map((x) => x.taux));
    m.gain_sabotage = ap.m; m.gain_sabotage_ic = ap.ic;
  }

  // Notes et bandes
  const notes = {};
  for (const [cle, [vert, rouge]] of Object.entries(SEUILS)) {
    if (m[cle] !== undefined) notes[cle] = noteLin(m[cle], vert, rouge);
  }
  notes.difficulte = noteDiff(m.taux_fort, ...DIFFICULTE);
  m.notes = notes;
  m.score = Math.min(...Object.values(notes));
  m.bande = {};
  for (const [cle, x] of Object.entries(notes)) {
    m.bande[cle] = x >= 1 ? 'vert' : x <= 0 ? 'rouge' : 'orange';
  }
  return m;
}

// ------------------------------------------------------------ 5. Génération des variantes d'un plan et rapports

function construireVariantes(plan) {
  const base = Object.assign({}, K.DEFAUTS, plan.base || {});
  const out = {};
  if (plan.type === 'liste' || !plan.type) {
    for (const [nom, choix] of Object.entries(plan.variantes)) {
      const d = Object.assign({}, base, choix);
      const p = K.params(d);
      if (p.erreurs.length) throw new Error(`Variante invalide ${nom} : ${p.erreurs.join(', ')}`);
      out[nom] = d;
    }
  } else if (plan.type === 'voisinage') {
    out.base = base;
    for (const [cle, vals] of Object.entries(plan.espace)) {
      for (const v of vals) {
        if (base[cle] === v) continue;
        const d = Object.assign({}, base, { [cle]: v });
        if (K.params(d).erreurs.length === 0) out[`${cle}=${v}`] = d;
      }
    }
  } else if (plan.type === 'criblage') {
    const rng = K.generateur(plan.graine || 1);
    const cles = Object.keys(plan.espace).sort();
    let essais = 0;
    while (Object.keys(out).length < plan.configs && essais < 200 * plan.configs) {
      essais++;
      const d = Object.assign({}, base);
      for (const c of cles) d[c] = rng.choix(plan.espace[c]);
      if (K.params(d).erreurs.length === 0) out[`c${String(Object.keys(out).length).padStart(3, '0')}`] = d;
    }
  }
  return out;
}

function decrireDiff(d, base) {
  const diffs = [];
  for (const cle of ['joueurs', 'etapes', 'tours', 'rythme', 'presage', 'lancersEnPlus', 'apprentissage', 'sabotage', 'tuileL', 'tuileP', 'individusParJoueur', 'coeurArbres']) {
    if (d[cle] !== base[cle]) diffs.push(`${cle}=${d[cle]}`);
  }
  return diffs.join(', ') || '(référence)';
}

const f1 = (x) => (x === undefined || x === null ? '–' : x.toFixed(1).replace('.', ','));
const f2 = (x) => (x === undefined || x === null ? '–' : x.toFixed(2).replace('.', ','));

function genererRapportMd(syn) {
  const vs = syn.variantes;
  const base = Object.assign({}, K.DEFAUTS, syn.plan.base || {});
  const lignes = [];
  lignes.push(`# ${syn.plan.nom || 'Campagne Couronne aux deux pistes'}`);
  lignes.push('');
  lignes.push(`*Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} en ${syn.duree_s} s. ${Object.keys(vs).length} variantes × ${syn.parties} parties appariées par bot. Toutes les mesures sont en points de taux de parade (0 à 100 %).*`);
  lignes.push('');
  if (syn.plan.description) {
    lignes.push(`> ${syn.plan.description}`);
    lignes.push('');
  }

  lignes.push('## 1. Synthèse des variantes (triées par score d\'intérêt)');
  lignes.push('');
  lignes.push('| Variante | Réglages | Score | Taux fort | Forêt | Lecture | Profondeur | Info (pistes) | Placement | Maîtrise | Plan 2 ét. | Gain Sabot. | Perdus | Couplage |');
  lignes.push('| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  const ids = Object.keys(vs).sort((a, b) => vs[b].mesures.score - vs[a].mesures.score);
  for (const id of ids) {
    const v = vs[id]; const m = v.mesures;
    const bIcon = (cle) => m.bande[cle] === 'vert' ? '🟢' : m.bande[cle] === 'rouge' ? '🔴' : '🟠';
    lignes.push(`| **${id}** | \`${decrireDiff(v.params, base)}\` | **${f2(m.score)}** | ${f1(m.taux_fort)} % ${bIcon('difficulte')} | ${f1(m.foret_finale)} % | ${f1(m.lecture)} ${bIcon('lecture')} | ${f1(m.profondeur)} ${bIcon('profondeur')} | ${f1(m.info)} ${bIcon('info')} | ${f1(m.placement)} ${bIcon('placement')} | ${f1(m.maitrise)} ${bIcon('maitrise')} | ${f1(m.plan_2etapes)} | ${f1(m.gain_sabotage)} | ${f1(m.perdus_pct)} % | ${f1(m.couplage)} % |`);
  }
  lignes.push('');

  lignes.push('## 2. Fréquence des mécanismes par partie ($T_1$) et Choix disputé ($T_4$)');
  lignes.push('');
  lignes.push('| Variante | Parades Garde / partie | Parades Sabotage / partie | Entrées Chantier / partie | Échanges pistes / partie | $T_4$ Se placer / Protéger / Neutre | $T_4$ Saboter / Garder / Neutre |');
  lignes.push('| :--- | :---: | :---: | :---: | :---: | :---: | :---: |');
  for (const id of ids) {
    const m = vs[id].mesures; const t1 = m.T1; const t4 = m.T4;
    const sPl = t4 && t4.placer_vs_proteger ? `${t4.placer_vs_proteger.placer_pct} % / ${t4.placer_vs_proteger.proteger_pct} % / ${t4.placer_vs_proteger.neutre_pct} %` : '–';
    const sSa = t4 && t4.saboter_vs_garder ? `${t4.saboter_vs_garder.saboter_pct} % / ${t4.saboter_vs_garder.garder_pct} % / ${t4.saboter_vs_garder.neutre_pct} %` : '–';
    lignes.push(`| **${id}** | ${f1(t1.parades_garde)} | ${f1(t1.parades_sabotage)} | ${f1(t1.entrees_chantier)} | ${f1(t1.echanges_pistes)} | ${sPl} | ${sSa} |`);
  }
  lignes.push('');

  lignes.push('## 3. Échelle complète des bots (taux de parade en %)');
  lignes.push('');
  const bots = syn.plan.bots;
  lignes.push('| Variante | ' + bots.join(' | ') + ' |');
  lignes.push('| :--- | ' + bots.map(() => ':---:').join(' | ') + ' |');
  for (const id of ids) {
    const t = vs[id].mesures.taux;
    lignes.push(`| **${id}** | ` + bots.map((b) => f1(t[b])).join(' | ') + ' |');
  }
  lignes.push('');
  return lignes.join('\n');
}

function genererLaboratoireHtml(syn, cheminHtml) {
  const dataJson = JSON.stringify(syn).replace(/<\/script/g, '<\\/script');
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Laboratoire d'évaluation — La Forêt qui rêve (Campagne 3)</title>
<style>
  :root { --bg: #f6f3ec; --card: #ffffff; --ink: #1f241d; --muted: #5a6256; --line: #d8d2c5;
          --vert: #2a7b4c; --vert-bg: #e3f3e8; --orange: #b86b14; --orange-bg: #fef1dc; --rouge: #b8332a; --rouge-bg: #fde4e1; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: var(--bg); color: var(--ink); padding: 18px 24px; }
  header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 12px; border-bottom: 2px solid var(--line); padding-bottom: 12px; margin-bottom: 16px; }
  h1 { margin: 0; font-size: 22px; }
  .sub { color: var(--muted); font-size: 13px; }
  .bar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  input, select, button { font: inherit; font-size: 13px; padding: 6px 10px; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
  button.primary { background: #2d5a3c; color: #fff; border-color: #2d5a3c; cursor: pointer; font-weight: 600; }
  button.primary:hover { background: #22462e; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { padding: 7px 8px; text-align: right; border-bottom: 1px solid #eee9de; white-space: nowrap; }
  th { background: #f0ece1; color: #2c3329; font-weight: 700; cursor: pointer; user-select: none; position: sticky; top: 0; }
  th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left; }
  tr:hover td { background: #faf7f0; }
  .pill { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11.5px; }
  .vert { background: var(--vert-bg); color: var(--vert); }
  .orange { background: var(--orange-bg); color: var(--orange); }
  .rouge { background: var(--rouge-bg); color: var(--rouge); }
  .play-btn { text-decoration: none; padding: 3px 8px; border-radius: 5px; background: #2d5a3c; color: #fff; font-size: 11.5px; font-weight: 600; }
  .play-btn:hover { background: #1e3f29; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 1000px) { .grid2 { grid-template-columns: 1fr; } }
  h2 { font-size: 16px; margin: 0 0 10px 0; }
</style>
</head>
<body>
<header>
  <div>
    <h1 id="titre">🔬 Laboratoire d'évaluation — Couronne aux deux pistes</h1>
    <div class="sub" id="meta"></div>
  </div>
  <div>
    <a href="pistes.html" class="play-btn" style="font-size:13px;padding:7px 12px;">🌲 Ouvrir la maquette jouable</a>
  </div>
</header>

<div class="bar">
  <label>Filtrer : <input type="text" id="filtre" placeholder="ex: J=3, presage, fige..."></label>
  <label>Trier par :
    <select id="tri">
      <option value="score">Score global (note min)</option>
      <option value="taux_fort">Taux de parade (Prévoyant)</option>
      <option value="foret_finale">Forêt sauvée (%)</option>
      <option value="profondeur">Profondeur (Prévoyant − Réflexe)</option>
      <option value="info">Information (Glouton − Aveugle)</option>
      <option value="placement">Placement (Glouton − Immobile)</option>
      <option value="gain_sabotage">Utilité du Sabotage</option>
      <option value="couplage">Couplage inter-tuiles (%)</option>
      <option value="perdus_pct">Ordres perdus (%)</option>
    </select>
  </label>
</div>

<div class="card">
  <h2>1. Comparaison des variantes & Porte de conception</h2>
  <table id="tabPrincipale">
    <thead>
      <tr>
        <th>Variante</th>
        <th>Réglages</th>
        <th>Score</th>
        <th>Taux fort</th>
        <th>Forêt</th>
        <th>Lecture (vs Boucle)</th>
        <th>Profondeur (vs Réfl.)</th>
        <th>Info (Pistes)</th>
        <th>Placement</th>
        <th>Maîtrise</th>
        <th>Plan 2 ét.</th>
        <th>Gain Sabot.</th>
        <th>Perdus</th>
        <th>Couplage</th>
        <th>Tester</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>

<div class="grid2">
  <div class="card">
    <h2>2. Fréquence des mécanismes ($T_1$, par partie)</h2>
    <table id="tabT1">
      <thead>
        <tr>
          <th>Variante</th>
          <th>Parades Garde</th>
          <th>Parades Sabot.</th>
          <th>Entrées Chantier</th>
          <th>Échanges Pistes</th>
          <th>Ordres Aller</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
  <div class="card">
    <h2>3. Choix disputé ($T_4$ — Profil de $\\Delta(s)$)</h2>
    <table id="tabT4">
      <thead>
        <tr>
          <th>Variante</th>
          <th>Se placer / Protéger / Neutre</th>
          <th>Saboter / Garder / Neutre</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script>
const SYN = ${dataJson};
const f1 = (x) => (x === undefined || x === null ? '–' : x.toFixed(1).replace('.', ','));
const f2 = (x) => (x === undefined || x === null ? '–' : x.toFixed(2).replace('.', ','));
document.getElementById('titre').textContent = '🔬 ' + (SYN.plan.nom || 'Laboratoire');
document.getElementById('meta').textContent = Object.keys(SYN.variantes).length + ' variantes × ' + SYN.parties + ' parties appariées par bot (' + SYN.duree_s + ' s) — ' + (SYN.plan.description || '');

function diffTexte(p) {
  const b = SYN.plan.base || {};
  const out = [];
  for (const k of ['joueurs','etapes','tours','rythme','presage','lancersEnPlus','apprentissage','sabotage','coeurArbres']) {
    if (p[k] !== undefined && p[k] !== b[k]) out.push(k + '=' + p[k]);
  }
  return out.join(', ') || '(référence)';
}

function pill(val, bande, suf='') {
  if (val === undefined || val === null) return '–';
  return '<span class="pill ' + (bande || '') + '">' + f1(val) + suf + '</span>';
}

function afficher() {
  const q = document.getElementById('filtre').value.toLowerCase();
  const cleTri = document.getElementById('tri').value;
  const entrees = Object.entries(SYN.variantes).filter(([id, v]) => {
    const txt = (id + ' ' + diffTexte(v.params)).toLowerCase();
    return !q || txt.includes(q);
  });
  entrees.sort((a, b) => (b[1].mesures[cleTri] || 0) - (a[1].mesures[cleTri] || 0));

  const tb1 = document.querySelector('#tabPrincipale tbody');
  const tbT1 = document.querySelector('#tabT1 tbody');
  const tbT4 = document.querySelector('#tabT4 tbody');
  tb1.innerHTML = ''; tbT1.innerHTML = ''; tbT4.innerHTML = '';

  for (const [id, v] of entrees) {
    const m = v.mesures, p = v.params;
    const urlParams = new URLSearchParams({
      joueurs: p.joueurs, etapes: p.etapes, tours: p.tours, rythme: p.rythme,
      presage: p.presage ? '1' : '0', lancersEnPlus: p.lancersEnPlus
    }).toString();
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><b>' + id + '</b></td>' +
      '<td><code>' + diffTexte(p) + '</code></td>' +
      '<td><b>' + f2(m.score) + '</b></td>' +
      '<td>' + pill(m.taux_fort, m.bande.difficulte, ' %') + '</td>' +
      '<td>' + f1(m.foret_finale) + ' %</td>' +
      '<td>' + pill(m.lecture, m.bande.lecture) + '</td>' +
      '<td>' + pill(m.profondeur, m.bande.profondeur) + '</td>' +
      '<td>' + pill(m.info, m.bande.info) + '</td>' +
      '<td>' + pill(m.placement, m.bande.placement) + '</td>' +
      '<td>' + pill(m.maitrise, m.bande.maitrise) + '</td>' +
      '<td>' + f1(m.plan_2etapes) + '</td>' +
      '<td>' + f1(m.gain_sabotage) + '</td>' +
      '<td>' + f1(m.perdus_pct) + ' %</td>' +
      '<td>' + f1(m.couplage) + ' %</td>' +
      '<td><a class="play-btn" href="pistes.html?' + urlParams + '">▶️ Jouer</a></td>';
    tb1.appendChild(tr);

    const tr1 = document.createElement('tr');
    tr1.innerHTML =
      '<td><b>' + id + '</b></td>' +
      '<td>' + f1(m.T1.parades_garde) + '</td>' +
      '<td>' + f1(m.T1.parades_sabotage) + '</td>' +
      '<td>' + f1(m.T1.entrees_chantier) + '</td>' +
      '<td>' + f1(m.T1.echanges_pistes) + '</td>' +
      '<td>' + f1(m.T1.ordres_aller) + '</td>';
    tbT1.appendChild(tr1);

    const pvp = m.T4 && m.T4.placer_vs_proteger;
    const svg = m.T4 && m.T4.saboter_vs_garder;
    const tr4 = document.createElement('tr');
    tr4.innerHTML =
      '<td><b>' + id + '</b></td>' +
      '<td>' + (pvp ? pvp.placer_pct + ' % / ' + pvp.proteger_pct + ' % / ' + pvp.neutre_pct + ' %' : '–') + '</td>' +
      '<td>' + (svg ? svg.saboter_pct + ' % / ' + svg.garder_pct + ' % / ' + svg.neutre_pct + ' %' : '–') + '</td>';
    tbT4.appendChild(tr4);
  }
}
document.getElementById('filtre').addEventListener('input', afficher);
document.getElementById('tri').addEventListener('change', afficher);
afficher();
</script>
</body>
</html>`;
  fs.writeFileSync(cheminHtml, html, 'utf8');
}

const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (!isMainThread && workerData && workerData.mode === 'evalVariante') {
  const { id, reglages, bots, nbParties, g0 } = workerData;
  const t0 = Date.now();
  const m = evaluerVariante(reglages, bots, nbParties, g0);
  parentPort.postMessage({ id, m, dt: ((Date.now() - t0) / 1000).toFixed(1) });
  process.exit(0);
}

async function executerCampagne(cheminPlan, echelle = 1.0, dossierSortie = 'resultats/pistes') {
  const plan = JSON.parse(fs.readFileSync(cheminPlan, 'utf8'));
  const vs = construireVariantes(plan);
  const nbParties = Math.max(4, Math.round((plan.parties || 24) * echelle));
  const g0 = (plan.graine || 1) * 10000;
  const bots = plan.bots || Object.keys(CATALOGUE_BOTS);

  const t0 = Date.now();
  const syn = { plan, parties: nbParties, variantes: {} };
  const noms = Object.keys(vs);
  for (const id of noms) syn.variantes[id] = { params: vs[id], mesures: null };

  const nbWorkers = Math.min(noms.length, Math.max(1, (os.cpus() ? os.cpus().length : 4) - 1));
  console.log(`Lancement de ${noms.length} variantes × ${nbParties} parties (${bots.length} bots) sur ${nbWorkers} cœurs...`);

  let cursor = 0, finis = 0;
  await new Promise((resolve, reject) => {
    const lancerSuivant = () => {
      if (cursor >= noms.length) {
        if (finis === noms.length) resolve();
        return;
      }
      const id = noms[cursor++];
      const w = new Worker(__filename, {
        workerData: { mode: 'evalVariante', id, reglages: vs[id], bots, nbParties, g0 },
      });
      w.on('message', (msg) => {
        syn.variantes[msg.id].mesures = msg.m;
        finis++;
        process.stdout.write(`  [${finis}/${noms.length}] ${msg.id} : score=${f2(msg.m.score)}, taux=${f1(msg.m.taux_fort)}% (${msg.dt}s)\n`);
        lancerSuivant();
      });
      w.on('error', reject);
    };
    for (let k = 0; k < nbWorkers; k++) lancerSuivant();
  });

  syn.duree_s = Number(((Date.now() - t0) / 1000).toFixed(1));

  fs.mkdirSync(dossierSortie, { recursive: true });
  const baseNom = path.basename(cheminPlan, '.json');
  const fJson = path.join(dossierSortie, `${baseNom}_synthese.json`);
  const fMd = path.join(dossierSortie, `${baseNom}_rapport.md`);
  const fHtml = path.join('maquettes-numeriques/pistes', 'laboratoire.html');

  fs.writeFileSync(fJson, JSON.stringify(syn, null, 2), 'utf8');
  fs.writeFileSync(fMd, genererRapportMd(syn), 'utf8');
  genererLaboratoireHtml(syn, fHtml);
  console.log(`\nTerminé en ${syn.duree_s}s :\n  - ${fJson}\n  - ${fMd}\n  - ${fHtml}`);
  return syn;
}

if (require.main === module && isMainThread) {
  const args = process.argv.slice(2);
  let planPath = 'campagnes/pistes_campagne3.json';
  let echelle = 1.0;
  let sortie = 'resultats/pistes';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--echelle') echelle = parseFloat(args[++i]);
    else if (args[i] === '--sortie') sortie = args[++i];
    else planPath = args[i];
  }
  executerCampagne(planPath, echelle, sortie).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { CATALOGUE_BOTS, jouerPartieBot, evaluerVariante, executerCampagne };
