"""Le choix « protéger ou se placer » est-il disputé ? (tests T4 et T5 de projet/3-pilotage/choix-strategique.md)

À chaque décision d'une partie jouée par le Monte-Carlo, on compare deux programmes :
- **protéger** : le meilleur programme sans déplacement (gardes et sabotages seulement, glouton) ;
- **se placer** : le meilleur programme qui contient au moins un déplacement (parmi les candidats du Monte-Carlo,
  ou, à défaut, le programme « protéger » dont l'ordre le moins utile devient un déplacement vers les Machines).
Chacun est estimé par R suites appariées (le tour, puis H tours au réflexe). Δ = se placer − protéger, en parades.

T4 : part des situations où se placer gagne de plus de s, où protéger gagne de plus de s, et zone neutre.
T5 : un seul indice public prédit-il le signe de Δ ? (meilleur seuil sur chaque indice, précision)

    python -m placement.dispute [--parties 12] [--param n=4 ...] [--json sortie.json]
"""
from __future__ import annotations

import argparse
import json
import random
from statistics import mean

from .regles import Params, RIEN, ALLER, POSTER, GARDER, SABOTER, mise_en_place, tirer_annonces, tirer_execution, \
    jouer_tour, destination, nb_ordres
from .partie import plateau
from .bots import MC, Reflexe, tirages, deplacements_libres, valeur


def _a_deplacement(prog):
    return any(o[0] in (ALLER, POSTER) for o in prog)


def estimer(p, pl, e, annonces, prog, R, H, graine):
    rng = random.Random(graine)
    execs = tirages(p, annonces, rng, R)
    graines = [rng.randrange(1 << 30) for _ in range(R)]
    suite = Reflexe()
    tot = 0.0
    for r in range(R):
        f = e.copie()
        tot += jouer_tour(p, pl, f, annonces, prog, execs[r])
        rr = random.Random(graines[r])
        for _ in range(min(H, p.tours - f.tour)):
            ann = tirer_annonces(p, rr)
            ex = tirer_execution(p, rr)
            tot += jouer_tour(p, pl, f, ann, suite.programme(p, pl, f, ann, rr), ex)
    return tot / R


def indices(p, pl, e, annonces):
    """Indices publics de la situation."""
    pres = set(e.individus)
    menacees = [destination(p, pl, e, m, t)[0] for m, t in annonces]
    a_portee = sum(1 for c in menacees if c in pres)
    dist_m = mean(min(pl.dist[i][m] for m in e.machines) for i in e.individus)
    return {"tour": e.tour + 1, "menaces_sur_individus": a_portee, "distance_aux_machines": round(dist_m, 2),
            "machines_au_contact": sum(1 for m in e.machines if any(pl.dist[i][m] <= 1 for i in e.individus))}


def profil(p, parties=12, R=96, H=3, s=0.15, graine=1):
    pl = plateau(p)
    bot = MC(budget=256, horizon=H)
    lignes = []
    for g in range(parties):
        rng_jeu = random.Random(graine * 1000 + g)
        rng = random.Random(graine * 7919 + g)
        e = mise_en_place(p, pl, rng_jeu)
        e.individus = bot.placer(p, pl, e, rng)
        for t in range(p.tours):
            ann = tirer_annonces(p, rng_jeu)
            tirage = tirer_execution(p, rng_jeu)
            ech = tirages(p, ann, rng, 16)
            cands, _ = bot.candidats(p, pl, e, ann, ech, rng)
            proteger, _ = bot.meilleur_immediat(p, pl, e, ann, ech)
            proteger = [o if o[0] not in (ALLER, POSTER) else (RIEN, None) for o in proteger]
            places = [c for c in cands if _a_deplacement(c)]
            if not places:
                essai = proteger[:]
                ordres = [i for i, o in enumerate(essai) if o[0] != RIEN]
                if ordres:
                    i = min(ordres, key=lambda i: valeur(p, pl, e, ann, essai[:i] + [(RIEN, None)] + essai[i + 1:], ech))
                    essai[i] = (RIEN, None)
                places = [deplacements_libres(p, pl, e, essai)]
                places = [c for c in places if _a_deplacement(c)]
            ind = indices(p, pl, e, ann)
            if places:
                gr = rng.randrange(1 << 30)
                vp = estimer(p, pl, e, ann, proteger, R, H, gr)
                vs = [estimer(p, pl, e, ann, c, R, H, gr) for c in places[:4]]
                ind["delta"] = max(vs) - vp
                lignes.append(ind)
            prog = bot.programme(p, pl, e, ann, rng)
            jouer_tour(p, pl, e, ann, prog, tirage)
    deltas = [x["delta"] for x in lignes]
    n = len(deltas)
    res = {"decisions": n, "seuil_s": s,
           "placer_gagne": 100 * sum(d > s for d in deltas) / n,
           "proteger_gagne": 100 * sum(d < -s for d in deltas) / n,
           "neutre": 100 * sum(abs(d) <= s for d in deltas) / n,
           "delta_moyen": mean(deltas), "abs_delta_moyen": mean(abs(d) for d in deltas)}
    # valeur du jugement (en parades par décision) : max situation par situation - meilleure option fixe
    res["valeur_jugement"] = mean(max(d, 0) for d in deltas) - max(mean(deltas), 0)
    # T5 léger : meilleur seuil sur un indice pour prédire le signe de Δ (hors zone neutre)
    tranches = [x for x in lignes if abs(x["delta"]) > s]
    t5 = {}
    for cle in ("tour", "menaces_sur_individus", "distance_aux_machines", "machines_au_contact"):
        meilleur = 0
        for seuil in sorted({x[cle] for x in tranches}):
            for sens in (1, -1):
                ok = sum(1 for x in tranches if ((x[cle] >= seuil) == (sens == 1)) == (x["delta"] > 0))
                meilleur = max(meilleur, ok)
        t5[cle] = 100 * meilleur / len(tranches) if tranches else None
    majorite = 100 * max(sum(x["delta"] > 0 for x in tranches), sum(x["delta"] < 0 for x in tranches)) / len(tranches) if tranches else None
    res["t5_precision_un_indice"] = t5
    res["t5_majorite"] = majorite
    return res, lignes


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--parties", type=int, default=12)
    ap.add_argument("--param", action="append", default=[])
    ap.add_argument("--json", default=None)
    ap.add_argument("--graine", type=int, default=1)
    a = ap.parse_args(argv)
    kw = {}
    for x in a.param:
        k, v = x.split("=", 1)
        try:
            kw[k] = json.loads(v)
        except json.JSONDecodeError:
            kw[k] = v
    p = Params().avec(**kw).valider()
    res, lignes = profil(p, a.parties, graine=a.graine)
    print(json.dumps(res, ensure_ascii=False, indent=1))
    if a.json:
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump({"params": p.en_dict(), "resultat": res, "decisions": lignes}, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
