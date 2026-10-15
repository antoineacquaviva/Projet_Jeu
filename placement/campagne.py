"""Campagnes du modèle « placement » : criblage, liste de variantes, voisinage d'une variante.

Un plan (campagnes/placement_*.json) décrit les variantes à jouer, les bots, le Méchant et le nombre de parties.
Chaque tâche = (variante, graine) : tous les bots y jouent la même graine (comparaisons appariées).

    python -m placement.campagne campagnes/placement_criblage.json --sortie res/          # tout, en local
    python -m placement.campagne <plan> --lot 3/20 --sortie lots/                          # un lot (GitHub)
    python -m placement.campagne <plan> --fusionner lots/ --sortie res/                    # fusion
    python -m placement.campagne <plan> --echelle 0.1 ...                                  # 10 % des parties

Types de plan :
- "criblage"  : `configs` variantes tirées au hasard dans `espace` (valeurs discrètes), graine du plan ;
- "liste"     : `variantes` = {nom: {paramètre: valeur}} ;
- "voisinage" : la variante `base` et toutes celles qui en diffèrent d'un cran sur un paramètre de `espace`.
"""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from multiprocessing import Pool

from .regles import Params
from .partie import jouer_partie
from .bots import fabriquer_gentil, fabriquer_mechant
from . import VERSION


def _appliquer(base: dict, choix: dict):
    d = dict(base)
    for cle, v in choix.items():
        if cle == "plateau" and isinstance(v, (list, tuple)):   # raccourci [largeur, hauteur]
            d["largeur"], d["hauteur"] = v
        else:
            d[cle] = v
    return d


def _valide(d):
    try:
        Params.depuis(d).valider()
        return True
    except (ValueError, TypeError):
        return False


def variantes(plan):
    """{id: dict de paramètres complets}, dans un ordre stable."""
    base = Params().en_dict()
    base = _appliquer(base, plan.get("base", {}))
    typ = plan.get("type", "liste")
    out = {}
    if typ == "liste":
        for nom, choix in plan["variantes"].items():
            d = _appliquer(base, choix)
            Params.depuis(d).valider()
            out[nom] = d
    elif typ == "criblage":
        rng = random.Random(plan.get("graine", 1))
        espace = plan["espace"]
        cles = sorted(espace)
        essais = 0
        while len(out) < plan["configs"]:
            essais += 1
            if essais > 200 * plan["configs"]:
                raise RuntimeError("espace trop contraint")
            choix = {c: rng.choice(espace[c]) for c in cles}
            # k est tiré relatif à n : "k_rel" = fraction de n (arrondie, entre 1 et n-1)
            if "k_rel" in choix:
                kr = choix.pop("k_rel")
                n = choix.get("n", base["n"])
                choix["k"] = max(1, min(n - 1, round(kr * n)))
            if "annonces_rel" in choix:
                ar = choix.pop("annonces_rel")
                n = choix.get("n", base["n"])
                choix["annonces"] = 0 if ar == 0 else n + ar - 1   # 1 -> m = n, 2 -> m = n + 1, ...
            if "individus_rel" in choix:
                ir = choix.pop("individus_rel")
                choix["individus"] = choix.get("k", base["k"]) + ir
            d = _appliquer(base, choix)
            if not _valide(d):
                continue
            out[f"c{len(out):04d}"] = d
    elif typ == "voisinage":
        out["base"] = base
        Params.depuis(base).valider()
        for cle, valeurs in plan["espace"].items():
            for v in valeurs:
                d = _appliquer(base, {cle: v})
                if d == base or not _valide(d):
                    continue
                nom = f"{cle}={json.dumps(v, separators=(',', ':'))}"
                out[nom] = d
    else:
        raise ValueError(f"type de plan inconnu : {typ}")
    return out


def taches(plan, echelle=1.0):
    vs = variantes(plan)
    nb = max(1, round(plan["parties"] * echelle))
    g0 = plan.get("graine", 1) * 100000
    return vs, [(vid, g0 + g) for vid in vs for g in range(nb)]


def _jouer(args):
    plan, vid, d, graine = args
    p = Params.depuis(d)
    res = {}
    mechant = plan.get("mechant", "hasard")
    for nom, spec in plan["bots"].items():
        if isinstance(spec, dict) and "mechant" in spec:     # un bot peut fixer son Méchant
            spec = dict(spec)
            mech = spec.pop("mechant")
        else:
            mech = mechant
        t0 = time.perf_counter()
        st = jouer_partie(p, fabriquer_gentil(spec), fabriquer_mechant(mech), graine)
        st["duree"] = time.perf_counter() - t0
        res[nom] = st
    return vid, graine, res


def _agreger(vs, resultats, plan):
    syn = {"plan": plan, "version": VERSION, "variantes": {}}
    for vid, d in vs.items():
        syn["variantes"][vid] = {"params": d, "graines": [], "bots": {}}
    for vid, graine, res in sorted(resultats, key=lambda x: (x[0], x[1])):
        v = syn["variantes"][vid]
        v["graines"].append(graine)
        for nom, st in res.items():
            b = v["bots"].setdefault(nom, {"parades": [], "duree": 0.0, "ordres": {}, "pare_garde": 0,
                                           "pare_sabotage": 0, "replis": 0, "compteurs": {}, "c0": st["c0"]})
            b["parades"].append(st["parades"])
            b["duree"] += st["duree"]
            for t, nb in st["ordres"].items():
                b["ordres"][t] = b["ordres"].get(t, 0) + nb
            for cle in ("pare_garde", "pare_sabotage", "replis"):
                b[cle] += st.get(cle, 0)
            for cle, x in st["compteurs"].items():
                b["compteurs"][cle] = b["compteurs"].get(cle, 0) + x
            if "parades_joueur" in st:                 # P3.4 bis : agence et couplage
                pj = st["parades_joueur"]
                b.setdefault("agence", []).append(sum(1 for x in pj if x > 0) / len(pj))
                b["hors_tuile"] = b.get("hors_tuile", 0) + st.get("hors_tuile", 0)
    for v in syn["variantes"].values():
        p = Params.depuis(v["params"])
        for b in v["bots"].values():
            nb = len(b["parades"])
            b["taux"] = 100 * sum(b["parades"]) / (nb * p.k * p.tours) if nb else None
    return syn


def executer(plan, echelle=1.0, lot=None, processus=None):
    vs, ts = taches(plan, echelle)
    if lot:
        i, n = lot
        ts = [t for j, t in enumerate(ts) if j % n == i]
    args = [(plan, vid, vs[vid], g) for vid, g in ts]
    processus = processus or os.cpu_count() or 1
    if processus > 1 and len(args) > 1:
        with Pool(processus) as po:
            resultats = list(po.imap_unordered(_jouer, args, chunksize=4))
    else:
        resultats = [_jouer(a) for a in args]
    return vs, resultats


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--sortie", required=True)
    ap.add_argument("--echelle", type=float, default=1.0)
    ap.add_argument("--lot", default=None, help="i/N")
    ap.add_argument("--fusionner", default=None, help="dossier des lots à fusionner")
    ap.add_argument("--processus", type=int, default=None)
    a = ap.parse_args(argv)
    chemin = a.plan if a.plan.endswith(".json") else os.path.join("campagnes", a.plan + ".json")
    with open(chemin, encoding="utf-8") as f:
        plan = json.load(f)
    os.makedirs(a.sortie, exist_ok=True)
    t0 = time.time()
    if a.fusionner:
        vs, _ = taches(plan, a.echelle)
        resultats = []
        for nom in sorted(os.listdir(a.fusionner)):
            if nom.startswith("lot_") and nom.endswith(".json"):
                with open(os.path.join(a.fusionner, nom), encoding="utf-8") as f:
                    resultats += [tuple(x) for x in json.load(f)["resultats"]]
        syn = _agreger(vs, resultats, plan)
        syn["echelle"] = a.echelle
        with open(os.path.join(a.sortie, "synthese.json"), "w", encoding="utf-8") as f:
            json.dump(syn, f, ensure_ascii=False)
        print(f"fusion : {len(resultats)} tâches, {len(vs)} variantes")
        return
    lot = tuple(int(x) for x in a.lot.split("/")) if a.lot else None
    vs, resultats = executer(plan, a.echelle, lot, a.processus)
    if lot:
        # résultats bruts compacts : on ne garde que ce que l'agrégation lit
        brut = []
        for vid, g, res in resultats:
            brut.append((vid, g, {n: {k: st[k] for k in ("parades", "duree", "ordres", "pare_garde", "pare_sabotage",
                                                        "replis", "compteurs", "c0", "parades_joueur", "hors_tuile")
                                     if k in st}
                                  for n, st in res.items()}))
        with open(os.path.join(a.sortie, f"lot_{lot[0]:03d}.json"), "w", encoding="utf-8") as f:
            json.dump({"resultats": brut}, f)
        print(f"lot {lot[0]}/{lot[1]} : {len(resultats)} tâches en {time.time() - t0:.0f} s")
        return
    syn = _agreger(vs, resultats, plan)
    syn["echelle"] = a.echelle
    syn["duree_s"] = round(time.time() - t0, 1)
    with open(os.path.join(a.sortie, "synthese.json"), "w", encoding="utf-8") as f:
        json.dump(syn, f, ensure_ascii=False)
    print(f"{len(resultats)} tâches, {len(vs)} variantes, {time.time() - t0:.0f} s -> {a.sortie}/synthese.json")


if __name__ == "__main__":
    main()
