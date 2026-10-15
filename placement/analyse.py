"""Lecture d'une synthèse de campagne « placement » : mesures, score d'intérêt, effets des paramètres.

    python -m placement.analyse <synthese.json> [--md rapport.md] [--top 15]

Toutes les mesures sont en points du taux de parade (0 à 100 : part des k x t ordres qui ont paré une menace).
Les seuils ci-dessous sont des **seuils de lecture provisoires** (indices) : ils ne jugent aucune version du jeu.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from statistics import mean, stdev

from .regles import Params

# (vert, rouge) : vert si la valeur atteint le premier seuil, rouge si elle reste sous le second
SEUILS = {
    "lecture":    (10.0, 3.0),   # bot fort - meilleure boucle ouverte (garde-fou « aucune boucle gagnante »)
    "profondeur": (5.0, 1.0),    # bot fort - réflexe (une règle simple ne suffit pas)
    "info":       (5.0, 1.0),    # glouton - glouton aveugle (l'annonce donne une prise)
    "placement":  (5.0, 1.0),    # glouton - glouton immobile (se déplacer compte)
    "maitrise":   (4.0, 1.0),    # MC - glouton (voir plus loin que le tour compte)
}
DIFFICULTE = (35.0, 75.0, 20.0, 90.0)  # taux du bot fort : vert entre 35 et 75, rouge sous 20 ou au-dessus de 90

BOUCLES = ("sentinelle", "marquage", "regroupement")


def _lin(x, vert, rouge):
    if x is None:
        return None
    if x >= vert:
        return 1.0
    if x <= rouge:
        return 0.0
    return (x - rouge) / (vert - rouge)


def _diff(x, bas, haut, zbas, zhaut):
    if x is None:
        return None
    if bas <= x <= haut:
        return 1.0
    if x < bas:
        return max(0.0, (x - zbas) / (bas - zbas))
    return max(0.0, (zhaut - x) / (zhaut - haut))


def apparie(a, b, echelle):
    """Écart moyen apparié (a - b) en points, et demi-largeur de l'IC à 95 %."""
    d = [(x - y) * echelle for x, y in zip(a, b)]
    if len(d) < 2:
        return (mean(d) if d else None), None
    return mean(d), 1.96 * stdev(d) / math.sqrt(len(d))


def mesures(v):
    """Mesures d'une variante (dict de la synthèse)."""
    p = Params.depuis(v["params"])
    ech = 100.0 / (p.k * p.tours)
    b = v["bots"]
    taux = {nom: x["taux"] for nom, x in b.items()}
    fort = next((n for n in ("mc", "glouton", "reflexe") if n in b), None)
    m = {"taux": taux, "fort": fort, "taux_fort": taux.get(fort)}
    boucles = [n for n in BOUCLES if n in b]
    if boucles:
        meilleure = max(boucles, key=lambda n: taux[n])
        m["meilleure_boucle"] = meilleure
        m["lecture"], m["lecture_ic"] = apparie(b[fort]["parades"], b[meilleure]["parades"], ech)
    if "reflexe" in b and fort != "reflexe":
        m["profondeur"], m["profondeur_ic"] = apparie(b[fort]["parades"], b["reflexe"]["parades"], ech)
    if "glouton" in b and "glouton_aveugle" in b and p.annonces:
        m["info"], m["info_ic"] = apparie(b["glouton"]["parades"], b["glouton_aveugle"]["parades"], ech)
    if "glouton" in b and "glouton_immobile" in b:
        m["placement"], m["placement_ic"] = apparie(b["glouton"]["parades"], b["glouton_immobile"]["parades"], ech)
    if "mc" in b and "glouton" in b:
        m["maitrise"], m["maitrise_ic"] = apparie(b["mc"]["parades"], b["glouton"]["parades"], ech)
    if "oracle" in b and "glouton" in b:
        m["incertitude"], m["incertitude_ic"] = apparie(b["oracle"]["parades"], b["glouton"]["parades"], ech)
    if "mc_immobile" in b and "mc" in b:
        m["placement_mc"], m["placement_mc_ic"] = apparie(b["mc"]["parades"], b["mc_immobile"]["parades"], ech)
    if "mc" in b:
        c = b["mc"]["compteurs"]
        if c.get("decisions"):
            m["investissement"] = 100 * c.get("investissements", 0) / c["decisions"]
    if fort in b and len(b[fort]["parades"]) > 1:
        m["ecart_type_fort"] = stdev(b[fort]["parades"]) * ech
    # part de la compétence : le bot fort fait mieux que le réflexe sur la même graine
    if "reflexe" in b and fort != "reflexe":
        g = list(zip(b[fort]["parades"], b["reflexe"]["parades"]))
        gagne = sum(1 for x, y in g if x > y) + 0.5 * sum(1 for x, y in g if x == y)
        m["competence"] = 100 * gagne / len(g)
    # notes et score
    notes = {}
    for cle, (vert, rouge) in SEUILS.items():
        if cle in m and m[cle] is not None:
            notes[cle] = _lin(m[cle], vert, rouge)
    if not p.annonces:
        notes["info"] = 0.0   # sans annonce, le hasard ne donne aucune prise (exigence du modèle, P2.1)
    notes["difficulte"] = _diff(m["taux_fort"], *DIFFICULTE)
    m["notes"] = notes
    m["score"] = min(notes.values()) if notes else None
    m["bande"] = {cle: ("vert" if x >= 1 else "rouge" if x <= 0 else "orange") for cle, x in notes.items()}
    return m


def effets(syn, cles_mesures=("score", "lecture", "profondeur", "info", "placement", "taux_fort")):
    """Moyenne de chaque mesure par niveau de chaque paramètre (lecture d'un criblage au hasard)."""
    vs = syn["variantes"]
    ms = {vid: mesures(v) for vid, v in vs.items()}
    params = sorted(next(iter(vs.values()))["params"])
    out = {}
    for prm in params:
        niveaux = {}
        for vid, v in vs.items():
            val = v["params"][prm]
            cle = json.dumps(val, sort_keys=True)
            niveaux.setdefault(cle, []).append(vid)
        if len(niveaux) < 2:
            continue
        out[prm] = {}
        for niv, ids in sorted(niveaux.items()):
            out[prm][niv] = {"n": len(ids)}
            for c in cles_mesures:
                xs = [ms[i].get(c) for i in ids if ms[i].get(c) is not None]
                out[prm][niv][c] = mean(xs) if xs else None
    return out, ms


def _f(x, nd=1):
    return "–" if x is None else f"{x:.{nd}f}"


def resume_variante(d):
    """Une ligne lisible : ce qui distingue la variante."""
    base = Params().en_dict()
    morceaux = []
    if (d["largeur"], d["hauteur"]) != (base["largeur"], base["hauteur"]):
        morceaux.append(f"{d['largeur']}x{d['hauteur']}")
    for cle in ("voisinage", "arbres", "profil", "machines", "entree", "individus", "n", "k", "tours", "annonces",
                "portee", "aller_garder", "sabotage", "garde_portee"):
        if d[cle] != base[cle]:
            morceaux.append(f"{cle}={d[cle]}")
    if dict(d["tactiques"]) != dict(base["tactiques"]):
        morceaux.append("tactiques=" + ",".join(f"{t[:3]}{w}" for t, w in sorted(dict(d["tactiques"]).items())))
    return " ".join(morceaux) or "(base)"


def rapport_md(syn, top=15):
    eff, ms = effets(syn)
    vs = syn["variantes"]
    lignes = [f"# Campagne {syn['plan'].get('nom', '?')}", ""]
    nb = len(next(iter(vs.values()))["graines"])
    lignes.append(f"{len(vs)} variantes, {nb} parties par bot et par variante (graines appariées). "
                  f"Bots : {', '.join(syn['plan']['bots'])}. Méchant : {syn['plan'].get('mechant', 'hasard')}.")
    lignes.append("")
    lignes.append("## Les meilleures variantes (score = la note la plus faible)")
    lignes.append("")
    lignes.append("| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |")
    lignes.append("|---|---|---|---|---|---|---|---|---|---|---|")
    ordre = sorted(vs, key=lambda i: -(ms[i]["score"] if ms[i]["score"] is not None else -1))
    for vid in ordre[:top]:
        m = ms[vid]
        lignes.append(f"| {vid} | {resume_variante(vs[vid]['params'])} | {_f(m['score'], 2)} | {_f(m['taux_fort'])} | "
                      f"{_f(m.get('lecture'))} | {_f(m.get('profondeur'))} | {_f(m.get('info'))} | "
                      f"{_f(m.get('placement'))} | {_f(m.get('maitrise'))} | {_f(m.get('investissement'), 0)} | {_f(m.get('incertitude'))} |")
    lignes.append("")
    lignes.append("## Bandes sur l'ensemble des variantes")
    lignes.append("")
    lignes.append("| Mesure | vert | orange | rouge |")
    lignes.append("|---|---|---|---|")
    for cle in list(SEUILS) + ["difficulte"]:
        c = {"vert": 0, "orange": 0, "rouge": 0}
        for m in ms.values():
            if cle in m["bande"]:
                c[m["bande"][cle]] += 1
        if sum(c.values()):
            lignes.append(f"| {cle} | {c['vert']} | {c['orange']} | {c['rouge']} |")
    lignes.append("")
    lignes.append("## Effet des paramètres (moyenne par niveau)")
    lignes.append("")
    for prm, niveaux in eff.items():
        lignes.append(f"**{prm}**")
        lignes.append("")
        lignes.append("| niveau | n | score | taux fort | lecture | profondeur | info | placement |")
        lignes.append("|---|---|---|---|---|---|---|---|")
        for niv, x in niveaux.items():
            lignes.append(f"| {niv} | {x['n']} | {_f(x['score'], 2)} | {_f(x['taux_fort'])} | {_f(x['lecture'])} | "
                          f"{_f(x['profondeur'])} | {_f(x['info'])} | {_f(x['placement'])} |")
        lignes.append("")
    return "\n".join(lignes)


BOTS_CONFIRMATION = {
    "sentinelle": "sentinelle",
    "marquage": "marquage",
    "regroupement": "regroupement",
    "reflexe": "reflexe",
    "glouton": "glouton",
    "glouton_aveugle": {"type": "glouton", "params": {"aveugle": True}},
    "glouton_immobile": {"type": "glouton", "params": {"deplacer": False, "interdits": ["aller", "poster"]}},
    "mc": {"type": "mc", "params": {"budget": 256, "horizon": 3}},
    "mc_immobile": {"type": "mc", "params": {"budget": 256, "horizon": 3, "deplacer": False,
                                             "interdits": ["aller", "poster"]}},
}


def plan_election(syn, nb, nom, parties=32, graine=31):
    """Élection : les `nb` meilleures variantes d'un criblage, rejouées avec le Monte-Carlo (plan « liste »)."""
    ms = {vid: mesures(v) for vid, v in syn["variantes"].items()}
    ordre = sorted(ms, key=lambda i: -(ms[i]["score"] or 0))[:nb]
    base = Params().en_dict()
    variantes = {}
    for vid in ordre:
        d = syn["variantes"][vid]["params"]
        variantes[vid] = {c: v for c, v in d.items() if v != base[c]}
    return {"nom": nom, "description": f"Élection : les {nb} meilleures variantes de {syn['plan'].get('nom')}, "
                                       "rejouées avec le Monte-Carlo (MC 256, horizon 3).",
            "type": "liste", "graine": graine, "parties": parties, "mechant": "hasard",
            "bots": BOTS_CONFIRMATION, "variantes": variantes}


ECHELONS = {
    "largeur": [4, 5, 6, 7], "hauteur": [4, 5, 6, 7], "voisinage": [4, 8], "arbres": [1, 2, 3, 4, 5],
    "machines": [2, 3, 4, 5, 6], "individus": [1, 2, 3, 4, 5, 6], "n": [2, 3, 4, 5, 6], "k": [1, 2, 3, 4, 5],
    "tours": [6, 8, 10, 12], "portee": [1, 2], "aller_garder": [False, True],
    "sabotage": ["aucun", "fige", "echappe", "allie"], "garde_portee": [0, 1],
    "profil": ["uniforme", "coeur", "bosquets"], "entree": ["front", "bords"],
}


def plan_voisinage(params, nom, parties=32, graine=41):
    """Optimisation locale : la variante et toutes ses voisines à un cran (plan « voisinage »)."""
    espace = {}
    for cle, niveaux in ECHELONS.items():
        v = params[cle]
        if v in niveaux:
            i = niveaux.index(v)
            espace[cle] = [niveaux[j] for j in (i - 1, i + 1) if 0 <= j < len(niveaux)]
        else:
            espace[cle] = niveaux
        if cle in ("aller_garder", "voisinage", "garde_portee", "entree"):
            espace[cle] = [x for x in niveaux if x != v]
        if cle in ("sabotage", "profil"):
            espace[cle] = [x for x in niveaux if x != v]
    m = params["annonces"]
    espace["annonces"] = sorted({x for x in (0, params["n"], m - 1, m + 1, m + 2) if x == 0 or x >= params["n"]} - {m})
    tac = dict(params["tactiques"])
    variantes_tac = []
    for t in ("cupidite", "percee", "opportunisme", "represailles"):
        for dw in (-1, 1):
            d = dict(tac)
            d[t] = max(0, d.get(t, 0) + dw)
            d = {x: w for x, w in d.items() if w > 0}
            if d and d != tac:
                variantes_tac.append(d)
    espace["tactiques"] = variantes_tac
    base = {c: v for c, v in params.items() if v != Params().en_dict()[c]}
    return {"nom": nom, "description": "Optimisation locale : la variante élue et ses voisines à un cran, "
                                       "jouées avec le Monte-Carlo.",
            "type": "voisinage", "graine": graine, "parties": parties, "mechant": "hasard",
            "bots": BOTS_CONFIRMATION, "base": base, "espace": espace}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("synthese")
    ap.add_argument("--md", default=None)
    ap.add_argument("--top", type=int, default=15)
    ap.add_argument("--elire", type=int, default=0, help="écrire un plan d'élection des N meilleures")
    ap.add_argument("--voisinage", default=None, help="écrire le plan de voisinage de cette variante")
    ap.add_argument("--plan-sortie", default=None)
    ap.add_argument("--parties", type=int, default=32)
    a = ap.parse_args(argv)
    with open(a.synthese, encoding="utf-8") as f:
        syn = json.load(f)
    if a.elire or a.voisinage:
        nom = os.path.splitext(os.path.basename(a.plan_sortie))[0]
        if a.elire:
            plan = plan_election(syn, a.elire, nom, a.parties)
        else:
            plan = plan_voisinage(syn["variantes"][a.voisinage]["params"], nom, a.parties)
        with open(a.plan_sortie, "w", encoding="utf-8") as f:
            json.dump(plan, f, ensure_ascii=False, indent=1)
        print(f"plan écrit : {a.plan_sortie}")
        return
    md = rapport_md(syn, a.top)
    if a.md:
        with open(a.md, "w", encoding="utf-8") as f:
            f.write(md)
    print(md)


if __name__ == "__main__":
    main()
