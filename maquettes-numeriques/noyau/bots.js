/* La Forêt qui rêve : joueurs virtuels du noyau N1, qui expliquent chaque choix.
   Profils :
   - lecteur   : lit le présage et la menace ; rêve quand l'ordre annoncé est hors de portée de la table,
                 quand une carte en trop ne coûte rien, quand le sommeil est à portée, ou au dernier tour ;
   - defenseur : ne rêve jamais (témoin « ne jamais rêver ») ;
   - reveur    : rêve une carte par tour, à heure fixe (témoin « horaire ») ;
   - hasard    : joue au hasard parmi les coups permis (témoin du plancher).
   Les bots d'une même table se concertent au conseil, comme le fait une table qui parle : leur programme est
   décidé ensemble. Ils ne connaissent pas le programme des joueurs humains.
   Les nombres des explications sont des estimations du bot (menace calculée sur les 36 tirages, dans l'état
   présent), pas des vérités du jeu. */
(function (G) {
  'use strict';
  const N = G.Noyau || (typeof require !== 'undefined' ? require('./moteur.js') : null);
  const { PEUPLES, SPECIALISTES, nomZ } = N;
  const NZ = [1, 2, 3, 4, 5, 6, 7];
  const VALEUR_ACTION = 0.35;    // forêt moyenne qu'une action sauve, estimation du bot (sert au coût d'un rêve)
  const pct = (x) => Math.round(x * 100) + ' %';
  const f1 = (x) => (Math.round(x * 100) / 100).toString().replace('.', ',');
  const nomP = (p) => PEUPLES[p].nom;

  // menace de l'étape à venir : pour chaque zone, la part des 36 tirages qu'un barrage là ferait échouer
  function menace(partie) {
    const bloc = {}, abat = {};
    NZ.forEach((z) => { bloc[z] = 0; abat[z] = 0; });
    let reve = 0, danger = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const p = partie.plan([a, b]), w = 1 / 36;
      if (p.type === 'abattre') {
        abat[p.cible] += w; danger += w;
        zonesBloquantes(p, partie).forEach((z) => { bloc[z] += w; });
      }
      else if (p.type === 'entree') { bloc[p.cible] += 0.6 * w; danger += 0.6 * w; }
      else if (p.type === 'reve') reve += w;
    }
    return { bloc, abat, reve, danger };
  }
  function zonesBloquantes(pl, partie) {
    if (!pl) return [];
    const complet = !partie || partie.params.barrage === 'complet';
    if (pl.type === 'abattre') return complet ? [...new Set([pl.depuis, pl.cible])] : [pl.cible];
    if (pl.type === 'entree') return [pl.cible];
    return [];
  }
  const gainPlan = (pl) => (pl.type === 'abattre' ? 1 : pl.type === 'entree' ? 0.6 : 0);
  function court(partie, pl) {
    if (pl.type === 'abattre') return `${pl.nomMachine} par ${pl.tactique} sur ${nomZ(pl.cible)}`;
    if (pl.type === 'entree') return `${pl.nomMachine} entre en ${nomZ(pl.cible)}`;
    return partie.decrirePlan(pl);
  }

  // ------------------------------------------------------------ programmation concertée des bots
  function programmer(partie, bots) {
    const E = partie.etat, P = partie.params, out = {};
    bots.forEach((p) => { out[p] = { prog: [null, null, null], pourquoi: [], reves: 0 }; });
    const prof = (p) => partie.siege(p).profil;
    const restants = P.tours - E.tour;                       // tours après celui-ci
    const utilisees = (p) => out[p].prog.filter(Boolean).length;
    const libre = (p, e) => !out[p].prog[e - 1] && utilisees(p) < E.main[p];
    const peutRever = (p, e) => libre(p, e) && out[p].reves < P.reves_par_tour;
    const rever = (p, e, txt) => { out[p].prog[e - 1] = 'rever'; out[p].reves++; out[p].pourquoi.push(txt); };
    const agir = (p, e, txt) => { out[p].prog[e - 1] = 'agir'; if (txt) out[p].pourquoi.push(txt); };
    // coût futur d'une carte perdue : une action de moins par tour, si la main passe sous 3
    const coutCarte = (p) => ((E.main[p] - out[p].reves - 1) < 3 ? VALEUR_ACTION * restants : 0);
    const m = menace(partie);
    const meilleurBloc = (p) => Math.max(0, ...E.pions[p].map((z) => m.bloc[z]));

    // le témoin au hasard
    for (const p of bots.filter((p) => prof(p) === 'hasard')) {
      for (let e = 1; e <= 3; e++) {
        if (!libre(p, e)) continue;
        const r = partie.alea();
        if (r < 0.15 && peutRever(p, e)) rever(p, e, `Étape ${e} : rêve (au hasard).`);
        else if (r < 0.85) agir(p, e, `Étape ${e} : agit (au hasard).`);
      }
    }
    const S = bots.filter((p) => prof(p) !== 'hasard');

    // 1. les étapes dont on connaît les dés (présage, Voir)
    for (let e = 1; e <= 3; e++) {
      if (!E.des[e]) continue;
      const pl = partie.plan(E.des[e]), zb = zonesBloquantes(pl, partie);
      if (!zb.length) { S.forEach((p) => out[p].pourquoi.push(`Étape ${e} : l'ordre annoncé est sans danger (${partie.decrirePlan(pl)}).`)); continue; }
      const def = S.find((p) => libre(p, e) && zb.some((z) => partie.present(p, z)));
      if (def) {
        agir(def, e, `Étape ${e} : l'ordre annoncé (${court(partie, pl)}) passe par ${zb.map(nomZ).join(' et ')}, où j'ai un pion : je le barrerai.`);
        continue;
      }
      if (!P.reve_annule) continue;
      const cand = S.filter((p) => prof(p) === 'lecteur' && peutRever(p, e)).map((p) => ({ p, cout: coutCarte(p) })).sort((a, b) => a.cout - b.cout);
      if (!cand.length) continue;
      const gain = gainPlan(pl) + 0.15;                        // + l'avance de l'esprit
      if (cand[0].cout <= gain) {
        rever(cand[0].p, e, `Étape ${e} : l'ordre annoncé (${court(partie, pl)}) est hors de portée de la table : je rêve pour l'annuler (gain estimé ${f1(gain)} forêt, coût de la carte perdue ${f1(cand[0].cout)}).`);
      } else {
        out[cand[0].p].pourquoi.push(`Étape ${e} : l'ordre annoncé (${court(partie, pl)}) est hors de portée, mais perdre une carte coûterait plus (${f1(cand[0].cout)}) qu'il ne sauve (${f1(gain)}).`);
      }
    }

    // 2. le long sommeil à portée ce tour
    if (P.reve_annule || true) {
      const d = partie.distanceSommeil();
      const lecteurs = S.filter((p) => prof(p) === 'lecteur');
      const possibles = lecteurs.filter((p) => [1, 2, 3].some((e) => peutRever(p, e)));
      if (d <= possibles.length && d <= 3 * lecteurs.length) {
        let reste = d;
        for (const p of possibles) {
          if (!reste) break;
          const e = [1, 2, 3].find((x) => peutRever(p, x));
          rever(p, e, `Étape ${e} : le long sommeil est à portée ce tour (${d} rêve${d > 1 ? 's' : ''} suffisent) ; il arrête la partie avec la forêt qui reste.`);
          reste--;
        }
      }
    }

    // 3. le rêveur à heure fixe
    for (const p of S.filter((p) => prof(p) === 'reveur')) {
      if (out[p].reves >= P.reves_par_tour) continue;
      const e = [1, 2, 3].find((x) => peutRever(p, x));
      if (e) rever(p, e, `Étape ${e} : je rêve une carte par tour, à heure fixe (stratégie de témoin).`);
    }

    // 4. le lecteur : une carte en trop, ou le dernier tour, rendent le rêve bon marché
    if (P.reve_annule) {
      const prises = new Set();
      [1, 2, 3].forEach((e) => { if (S.some((p) => out[p].prog[e - 1] === 'rever')) prises.add(e); });
      for (const p of S.filter((p) => prof(p) === 'lecteur')) {
        if (out[p].reves >= P.reves_par_tour) continue;
        let best = null;
        for (let e = 1; e <= 3; e++) {
          if (!peutRever(p, e) || prises.has(e) || E.des[e]) continue;
          const vReve = m.danger + 0.15, vAgir = meilleurBloc(p), cout = coutCarte(p);
          const net = vReve - vAgir - cout;
          if (!best || net > best.net) best = { e, net, vReve, vAgir, cout };
        }
        if (best && best.net > 0.2) {
          prises.add(best.e);
          rever(p, best.e, `Étape ${best.e} : rêver annule un ordre où qu'il tombe (il abattrait ou ferait entrer une Machine dans ${pct(m.danger)} des tirages) et fait avancer l'esprit, soit ${f1(best.vReve)} forêt estimée ; agir là où je suis en vaut ${f1(best.vAgir)} ; la carte perdue coûte ${f1(best.cout)}${restants === 0 ? ' (dernier tour)' : (E.main[p] > 3 ? ' (j\'ai une carte de plus que d\'étapes)' : '')}. Je rêve.`);
        }
      }
    }

    // 5. le reste : agir sur les étapes encore libres
    for (const p of S) {
      const agies = [];
      for (let e = 1; e <= 3; e++) if (libre(p, e)) { agir(p, e); agies.push(e); }
      if (agies.length) out[p].pourquoi.push(`Étape${agies.length > 1 ? 's' : ''} ${agies.join(', ')} : j'agirai selon ce que je verrai (barrer la zone la plus menacée, saboter si un allié est là).`);
      const vides = [1, 2, 3].filter((e) => !out[p].prog[e - 1]);
      if (vides.length) out[p].pourquoi.push(`Plus assez de cartes pour l'étape ${vides.join(', ')} (main : ${E.main[p]}).`);
    }
    return out;
  }

  // ------------------------------------------------------------ décisions ponctuelles
  function decider(partie, p, type, options, ctx) {
    const prof = partie.siege(p).profil;
    if (prof === 'hasard' && type !== 'esprit') {
      const c = options[Math.floor(partie.alea() * options.length)];
      return { choix: c, pourquoi: 'Au hasard (témoin).' };
    }
    if (type === 'placer') return placer(partie, p, options);
    if (type === 'action') return action(partie, p, options, ctx);
    if (type === 'esprit') return esprit(partie, p, options);
    if (type === 'tromper') return ctx.ok
      ? { choix: options.find((o) => o.id === 'oui'), pourquoi: 'L\'ordre a réussi : je le fais passer pour un échec, sa tactique recule vers le bord.' }
      : { choix: options.find((o) => o.id === 'non'), pourquoi: 'L\'ordre a échoué : le Méchant l\'apprend bien tout seul.' };
    return { choix: options[0], pourquoi: '' };
  }

  function placer(partie, p, options) {
    const m = menace(partie);
    let best = null;
    for (const o of options) {
      const z = o.zone, dej = partie.presence(z);
      const v = m.bloc[z] / (1 + 0.8 * dej) + 0.01 * partie.etat.f[z];
      if (!best || v > best.v) best = { o, v, z, dej };
    }
    return { choix: best.o, pourquoi: `${nomZ(best.z)} : un barrage là ferait échouer ${pct(m.bloc[best.z])} des ordres possibles, et ${best.dej === 1 ? 'il n\'y a qu\'un pion' : best.dej ? `il n'y a que ${best.dej} pions` : 'personne n\'y est encore'}.` };
  }

  function action(partie, p, options, ctx) {
    const E = partie.etat, e = E.etape, m = menace(partie);
    // ce que l'on sait des ordres de l'étape : les plans tirés (reptiles), ou le présage s'il n'est pas annulé
    let plans = ctx.plans && ctx.plans.length ? ctx.plans : null;
    if (!plans && E.des[e] && !(ctx.annules > 0)) plans = [partie.plan(E.des[e])];
    const pl = plans ? plans[0] : null;
    const zb = plans ? [...new Set(plans.flatMap((x) => zonesBloquantes(x, partie)))] : null;
    const unSeulConnu = plans && !ctx.plans && partie.params.ordres_par_etape > 1;   // le 2e ordre reste inconnu
    const notes = [];
    for (const o of options) {
      let v = 0, why = '';
      if (o.kind === 'barrer') {
        if (ctx.annule) { v = 0.01; why = 'l\'ordre de l\'étape est déjà annulé par un rêve'; }
        else if (E.barres.includes(o.zone)) { v = 0; why = 'déjà barrée'; }
        else if (zb) {
          const dans = zb.includes(o.zone);
          v = (dans ? 1 : 0.02) + (unSeulConnu ? m.bloc[o.zone] : 0);
          why = dans ? `l'ordre connu (${court(partie, pl)}) passe par là : il échouera` : 'l\'ordre connu ne passe pas par là';
          if (unSeulConnu) why += ` ; l'autre ordre de l'étape y échouerait dans ${pct(m.bloc[o.zone])} des tirages`;
        }
        else { v = m.bloc[o.zone]; why = `${pct(v)} des tirages possibles échoueraient`; }
      } else if (o.kind === 'saboter') {
        const mach = partie.machine(o.machine), reste = Object.values(mach.org).filter(Boolean).length;
        const allie = SPECIALISTES[p] || E.decl.some((d) => d.p !== p && d.zone === o.zone);
        if (!allie) { v = 0.03; why = 'aucun allié encore dans la zone : le sabotage risque d\'échouer'; }
        else {
          v = 0.25 + (reste === 1 ? 0.35 : 0);
          why = reste === 1 ? `dernier organe : ${mach.nom} sera hors service` : `un organe de moins pour ${mach.nom} (il lui en restera ${reste - 1})`;
          if (pl && pl.machine === mach.id && pl.type === 'abattre' && reste === 1 && !ctx.annule) { v += 1; why += ', et c\'est elle que l\'ordre connu désigne'; }
          if (SPECIALISTES[p]) why += ` (les ${nomP(p).toLowerCase()} sabotent seuls)`;
        }
      } else if (o.kind === 'aller') {
        v = 0.3 * (m.bloc[o.zone] - m.bloc[o.de]);
        why = `se rapprocher de la menace (${pct(m.bloc[o.zone])} contre ${pct(m.bloc[o.de])})`;
      }
      notes.push({ o, v, why });
    }
    notes.sort((a, b) => b.v - a.v);
    const best = notes[0], second = notes.find((n) => n.o.kind !== best.o.kind || n.o.zone !== best.o.zone);
    let txt = `${best.o.label} : ${best.why}.`;
    if (second && second.v > 0.05) txt += ` Autre choix envisagé : « ${second.o.label} » (${second.why}).`;
    if (pl && !ctx.annule && p === 'reptiles') txt = `J'ai attendu les dés. ${txt}`;
    return { choix: best.o, pourquoi: txt };
  }

  function esprit(partie, p, options) {
    const av = options.filter((o) => o.id.startsWith('avancer')).sort((a, b) => a.case - b.case);
    if (av.length) return { choix: av[0], pourquoi: `L'esprit de tête avance : il sera à ${av[0].case - 1 - 7} case${av[0].case - 8 > 1 ? 's' : ''} du sommeil.` };
    return { choix: options[0], pourquoi: 'Aucun esprit sur la piste : un esprit entre, et le Méchant oublie la tuile du 12.' };
  }

  const NoyauBots = { programmer, decider, menace, zonesBloquantes, PROFILS: {
    lecteur: { nom: 'Lecteur', texte: 'Lit le présage et la menace ; rêve quand cela rapporte.' },
    defenseur: { nom: 'Défenseur', texte: 'Ne rêve jamais (témoin).' },
    reveur: { nom: 'Rêveur', texte: 'Rêve une carte par tour à heure fixe (témoin).' },
    hasard: { nom: 'Hasard', texte: 'Joue au hasard (témoin du plancher).' } } };
  G.NoyauBots = NoyauBots;
  if (typeof module !== 'undefined') module.exports = NoyauBots;
})(typeof globalThis !== 'undefined' ? globalThis : this);
