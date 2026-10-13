"""Batterie d'évaluation : expériences et rapport (moteur 1.4, phase 1d).

    python -m foret.batterie phase1                  # tout le plan de la phase 1 (reprend là où il s'est arrêté)
    python -m foret.batterie phase1 --echelle 0.2    # essai rapide (20 % des parties)
    python -m foret.batterie phase1 --seulement v2_g1   # une seule configuration du plan
    python -m foret.batterie rapport                 # recalcule rapport.json depuis les parties enregistrées
    python -m foret.batterie phase1 --lot 3/8 --sortie lots/   # le lot 3 sur 8 (machines différentes)
    python -m foret.batterie phase1 --fusionner lots/          # rassemble les lots, puis le rapport

Une *configuration* = une maquette, une variante, un bot. Pour chacune, les
expériences du plan :
- « tables » : toutes les équipes de 1 à 6 peuples (63), plus « personne »
  (un peuple joué par le bot inerte : v(∅)), chacune N fois, avec le Mesureur ;
  les duos sont aussi sondés (copies jouées depuis la fin du tour 2 et le
  début du tour 5) ;
- « spectateur » : duos et trios où un siège est joué au hasard ;
- « reves » : le glouton à taux de rêve fixes, duos et trios ;
- « coordination » : aucun signe, la forme de la variante, tout dire ;
- « echelle » : aléatoire contre glouton.
Les parties brutes vont dans resultats/batterie/<config>/<expérience>.jsonl ;
le rapport (mesures, bandes, témoins) dans resultats/batterie/rapport.json.

Par lots (moteur 1.6) : toutes les parties du plan sont numérotées dans un ordre
fixe ; le lot i sur n joue les parties i, i+n, i+2n… La fusion vérifie que les
lots viennent du même plan (même empreinte) et qu'aucune partie ne manque ni
n'est en double, puis écrit exactement les fichiers qu'aurait écrits un calcul
d'un seul tenant : le rapport est le même.

Toutes les mesures faites avec le glouton sont des *indices* sur le jeu : elles
décrivent aussi le glouton. Le plan les refera avec le bot fort (phase 2).
"""
import argparse
import glob
import gzip
import itertools
import json
import os
import random
import statistics
import time
import traceback
from collections import Counter, defaultdict
from multiprocessing import Pool

from .bots import fabriquer
from .maquette import charger, lire
from .mesures import (MESURES, Mesureur, Sondeur, auc, distance_pistes, duo_contre_meilleur_seul, duos_complets,
                      shapley_restreint, gain_libre, part_dilemmes, tape_taupe,
                      exactitude_equilibree, synergies_relatives,
                      ic95, moyenne, quantile, shapley, synergies, variance, verdict)
from .moteur import Partie, VERSION

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(RACINE, "resultats", "batterie")
PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]

G0 = {"type": "glouton", "params": {"reves_par_tour": 0.0}}
G1 = {"type": "glouton", "params": {"reves_par_tour": 1.0}}
G3 = {"type": "glouton", "params": {"reves_par_tour": 3.0}}
ALEA = {"type": "aleatoire"}
INERTE = {"type": "inerte"}

# --------------------------------------------------------------------------- le plan de la phase 1
# nom : (maquette, variante, bot, expériences, nombre de parties par équipe)
TOUT = ("tables", "spectateur", "reves", "coordination", "echelle")
PLAN = {
    "v1_g1": ("v1", "defaut", G1, TOUT, 60),
    "v1_g0": ("v1", "defaut", G0, ("tables", "spectateur", "echelle"), 60),
    "v2_g1": ("v2", "defaut", G1, TOUT, 60),
    "v2_g0": ("v2", "defaut", G0, ("tables", "spectateur", "echelle"), 60),
    # témoins (une mesure doit reconnaître leur défaut)
    "v1_une_tactique": ("v1", "temoin_une_tactique", G0, ("petites",), 30),
    "v2_une_tactique": ("v2", "temoin_une_tactique", G0, ("petites",), 30),
    "v1_des_fixes": ("v1", "temoin_des_fixes", G0, ("petites",), 30),
    "v2_des_fixes": ("v2", "temoin_des_fixes", G0, ("petites",), 30),
    "v1_sans_apprentissage": ("v1", "temoin_sans_apprentissage", G0, ("petites",), 30),
    "v2_sans_apprentissage": ("v2", "temoin_sans_apprentissage", G0, ("petites",), 30),
    "v1_essoufflement": ("v1", "temoin_essoufflement", G0, ("petites",), 30),
    "v2_essoufflement": ("v2", "temoin_essoufflement", G0, ("petites",), 30),
    "v1_assaut": ("v1", "temoin_assaut", G0, ("petites",), 30),
    "v1_hanter_illimite": ("v1", "temoin_hanter_illimite", G0, ("tables",), 40),
    "v2_hanter_illimite": ("v2", "temoin_hanter_illimite", G0, ("tables",), 40),
    "v1_mammiferes_sans_pouvoir": ("v1", "temoin_mammiferes_sans_pouvoir", G0, ("tables",), 40),
    "v1_spectateur": ("v1", "temoin_spectateur", G0, ("tables", "spectateur"), 40),
    "v1_sans_pouvoirs": ("v1", "sans_pouvoirs", G0, ("petites",), 30),
    "v1_barrage_v0": ("v1", "retour_v0_barrage", G0, ("petites",), 30),
    "v1_reves_illimites": ("v1", "retour_v0_reves_illimites", G3, ("petites", "reves"), 30),
}
TAUX = {"limite": [0.0, 0.25, 0.5, 0.75, 1.0], "illimite": [0.0, 1.0, 2.0, 3.0]}

# --------------------------------------------------------------------------- le plan réduit de la phase 3
# Décisions de l'auteur du 13 oct. : bot de référence MC 64 chacun pour soi ; 15 duos et 5 trios,
# 4 parties par table. Les trios : les 4 « triangles » (un compartiment sans spécialiste) et une
# « étoile » (les trois peuples du compartiment du Méchant).
MC64 = {"type": "mc", "params": {"budget": 64, "savoir": "soi"}}
# Le même bot dont les suites rêvent une carte par tour (glouton qui rêve). Ajouté le 13 oct. (étape 3.3) :
# en V2, le bot de référence, dont les suites ne rêvent pas, rêve peu et garde moins de forêt que le
# glouton qui rêve (tape-taupe négatif) ; avec des suites qui rêvent, MC 128 passait de 87,8 à 92,5 %
# (phase 2). En v1, c'est l'inverse (94,3 contre 92,2 %) : MC64 reste la référence de la v1.
MC64R = {"type": "mc", "params": {"budget": 64, "savoir": "soi",
                                  "politique": {"type": "glouton", "params": {"reves_par_tour": 1.0}}}}
TRIOS3 = [("oiseaux", "reptiles", "humains"), ("mammiferes", "reptiles", "insectes"),
          ("oiseaux", "mammiferes", "entites"), ("insectes", "humains", "entites"),
          ("oiseaux", "humains", "entites")]
TOUT3 = ("tables3", "spectateur3", "reves3")
PLAN3 = {
    "p3_v1": ("v1", "defaut", MC64, TOUT3, 4),
    "p3_v2": ("v2", "defaut", MC64, TOUT3, 4),
    "p3_v2r": ("v2", "defaut", MC64R, TOUT3, 4),
}
TAUX3 = [0.0, 0.5, 1.0]

# --------------------------------------------------------------------------- les mesures du bot fort (étape 3.3)
# Programme « mesures3 » : les quatre mesures qui attendaient le bot fort, et leurs témoins.
# - tape-taupe : le glouton (il pare la menace la plus probable) à taux de rêve fixes, contre le
#   bot fort, sur les mêmes duos ;
# - gain du bot libre : le bot fort libre contre le même bot à taux fixes (dans le plan réduit, et
#   ici pour le témoin sans rêve) ;
# - dilemmes : le bot fort juge en entier une décision sur quatre (réglage « juger ») ;
# - chef unique : campagne coordination_mc_2 (central contre chacun pour soi), pas ici.
JUGE3 = 0.25
PLAN_M3 = {
    "m3_v1": ("v1", "defaut", MC64, ("tables_duos", "taupe", "dilemmes"), 4),
    "m3_v2": ("v2", "defaut", MC64, ("tables_duos", "taupe", "dilemmes"), 4),
    "m3_v2r": ("v2", "defaut", MC64R, ("tables_duos", "taupe", "dilemmes"), 4),
    # témoins
    "m3_v1_une_tactique": ("v1", "temoin_une_tactique", MC64, ("tables_duos", "taupe"), 4),
    "m3_v1_sans_reve": ("v1", "temoin_sans_reve", MC64, ("tables_duos", "reves_duos"), 4),
    "m3_v1_essoufflement": ("v1", "temoin_essoufflement", MC64, ("dilemmes",), 4),
}
PROGRAMMES = {"phase1": PLAN, "phase3": PLAN3, "mesures3": PLAN_M3}


def _config(nom):
    """(maquette, variante, bot, expériences, parties) d'une configuration de l'un des programmes."""
    for plan in (PLAN, PLAN3, PLAN_M3):          # lus à l'appel (les tests les remplacent)
        if nom in plan:
            return plan[nom]
    raise KeyError(nom)
SONDES = {("conseil", 3): "t2", ("conseil", 5): "t5"}


# --------------------------------------------------------------------------- une partie
def jouer(tache):
    """tache : dict (maquette, variante, bots, peuples, graine, sondes, copies)."""
    t = tache
    out = {k: t[k] for k in ("exp", "peuples", "graine", "etiquette")}
    try:
        m = charger(t["maquette"], t["variante"])
        bots = [fabriquer(b, t["graine"] * 100 + i) for i, b in enumerate(t["bots"])]
        obs = [Mesureur()]
        if t.get("sondes"):
            obs.append(Sondeur(SONDES, copies=t.get("copies", 16), graine=t["graine"],
                               politique=t.get("politique_sondes")))
        b = Partie(m, list(t["peuples"]), bots, graine=t["graine"], observateurs=obs).jouer()
        jug = [dict(j, siege=i) for i, bot in enumerate(bots) for j in getattr(bot, "jugements", ())]
        if jug:                                                   # [mesure:dilemmes]
            out["jugements"] = jug
        out.update({
            "fin": b["fin"], "tour": b["tour"], "foret": b["foret"], "foret_initiale": b["foret_initiale"],
            "pct": round(100 * b["resultat"] / b["foret_initiale"], 3),
            "foret_pct": round(100 * b["foret"] / b["foret_initiale"], 3),
            "machines_hs": b["machines_hs"], "cartes_en_reve": b["cartes_en_reve"],
            "mesures": b["mesures"], "stats": b["stats"], "lacunes": b["lacunes"],
            "incoherences": b["incoherences"], "sondes": b.get("sondes")})
    except Exception as e:  # noqa: BLE001
        out["erreur"] = f"{type(e).__name__}: {e}"
        out["trace"] = traceback.format_exc(limit=6)
    return out


def _bot_texte(b):
    p = b.get("params", {})
    return b["type"] + ("" if not p else " " + ",".join(f"{k}={v}" for k, v in sorted(p.items())))


# --------------------------------------------------------------------------- les expériences
def taches(nom, echelle=1.0):
    maquette, variante, bot, exps, n = _config(nom)
    n = max(2, round(n * echelle))
    base = dict(maquette=maquette, variante=variante)
    out = []

    def ajouter(exp, peuples, bots, graines, etiquette, **kw):
        for g in graines:
            out.append(dict(base, exp=exp, peuples=list(peuples), bots=bots, graine=g, etiquette=etiquette, **kw))

    if "tables" in exps or "petites" in exps:
        tailles = range(1, 7) if "tables" in exps else (2, 3)
        nb_sondes = max(2, round(8 * echelle))
        for k in tailles:
            for eq in itertools.combinations(PEUPLES, k):
                if k == 2:
                    ajouter("tables", eq, [bot] * k, range(nb_sondes), "equipe", sondes=True, copies=16)
                    ajouter("tables", eq, [bot] * k, range(nb_sondes, n), "equipe")
                else:
                    ajouter("tables", eq, [bot] * k, range(n), "equipe")
        if "tables" in exps:
            for p in PEUPLES:
                ajouter("tables", [p], [{"type": "inerte"}], range(n), "personne")
    if "spectateur" in exps:
        ns = max(2, round(n / 2))
        for remplacant, et in ((INERTE, "inerte"), (ALEA, "hasard")):
            for k in (2, 3):
                for eq in itertools.combinations(PEUPLES, k):
                    for i in range(k):
                        bots = [bot] * k
                        bots[i] = remplacant
                        ajouter("spectateur", eq, bots, range(ns), f"{et}:{eq[i]}")
    if "reves" in exps:
        illimite = charger(maquette, variante)["regles"]["reves_par_joueur_et_tour"] is None
        for taux in TAUX["illimite" if illimite else "limite"]:
            b = {"type": "glouton", "params": dict(bot.get("params", {}), reves_par_tour=taux)}
            for k in (2, 3):
                for eq in itertools.combinations(PEUPLES, k):
                    ajouter("reves", eq, [b] * k, range(max(2, round(n / 3))), f"taux:{taux}")
        if charger(maquette, variante)["regles"].get("voies_reve"):          # v2 et ses descendantes (V0.3…)
            for voie in ("sommeil", "reveil"):
                b = {"type": "glouton", "params": dict(bot.get("params", {}), voie=voie)}
                for k in (2, 3):
                    for eq in itertools.combinations(PEUPLES, k):
                        ajouter("reves", eq, [b] * k, range(max(2, round(n / 3))), f"voie:{voie}")
    if "coordination" in exps:
        for var in ("comm_aucun_signe", "defaut", "comm_tout_dire"):
            for niveau in ("annonce", "complet"):
                b = {"type": "glouton", "params": dict(bot.get("params", {}), communique=niveau)}
                for k in (2, 3):
                    for eq in itertools.combinations(PEUPLES, k):
                        t0 = len(out)
                        ajouter("coordination", eq, [b] * k, range(max(2, round(n / 2))), f"{var}|{niveau}")
                        for t in out[t0:]:
                            t["variante"] = var if variante == "defaut" else variante
    if "tables3" in exps:                     # plan réduit : seuls, duos, 5 trios, « personne »
        nb_sondes = max(1, round(2 * echelle))
        for p in PEUPLES:
            ajouter("tables", [p], [bot], range(n), "equipe")
            ajouter("tables", [p], [INERTE], range(n), "personne")
        for eq in itertools.combinations(PEUPLES, 2):
            ajouter("tables", eq, [bot] * 2, range(nb_sondes), "equipe", sondes=True, copies=16,
                    politique_sondes=bot.get("params", {}).get("politique", G0))   # la politique des suites du bot
            ajouter("tables", eq, [bot] * 2, range(nb_sondes, n), "equipe")
        for eq in TRIOS3:
            ajouter("tables", eq, [bot] * 3, range(n), "equipe")
    if "spectateur3" in exps:
        ns = max(2, round(n / 2))
        for eq in list(itertools.combinations(PEUPLES, 2)) + TRIOS3:
            for i in range(len(eq)):
                bots = [bot] * len(eq)
                bots[i] = INERTE
                ajouter("spectateur", eq, bots, range(ns), f"inerte:{eq[i]}")
    if "reves3" in exps:
        nr = max(2, round(n / 2))
        for taux in TAUX3:
            b = {"type": bot["type"], "params": dict(bot.get("params", {}), reves_par_tour=taux)}
            for eq in list(itertools.combinations(PEUPLES, 2)) + TRIOS3:
                ajouter("reves", eq, [b] * len(eq), range(nr), f"taux:{taux}")
    duos = list(itertools.combinations(PEUPLES, 2))
    nd = max(2, round(n / 2))
    if "tables_duos" in exps:                 # le bot de la configuration, libre, sur les 15 duos
        for eq in duos:
            ajouter("tables", eq, [bot] * 2, range(nd), "equipe")
    if "taupe" in exps or "taupe_duos" in exps:   # [mesure:tape_taupe] le glouton à taux fixes
        tables = duos + (TRIOS3 if "taupe" in exps else [])
        for taux in TAUX3:
            b = {"type": "glouton", "params": {"reves_par_tour": taux}}
            for eq in tables:
                ajouter("taupe", eq, [b] * len(eq), range(n), f"taux:{taux}")
    if "reves_duos" in exps:                  # [mesure:gain_libre] le bot de la configuration à taux fixes
        for taux in TAUX3:
            b = {"type": bot["type"], "params": dict(bot.get("params", {}), reves_par_tour=taux)}
            for eq in duos:
                ajouter("reves", eq, [b] * 2, range(nd), f"taux:{taux}")
    if "dilemmes" in exps:                    # [mesure:dilemmes] le bot fort juge une décision sur quatre
        b = {"type": bot["type"], "params": dict(bot.get("params", {}), juger=JUGE3)}
        for eq in duos:
            ajouter("dilemmes", eq, [b] * 2, range(nd), "juge")
    if "echelle" in exps:
        for b, et in ((ALEA, "aleatoire"), (bot, "glouton")):
            for k in (2, 3):
                for eq in itertools.combinations(PEUPLES, k):
                    ajouter("echelle", eq, [b] * k, range(max(2, round(n / 2))), et)
    return out


def _signature(taches_exp):
    """Empreinte d'une liste de tâches : si elle change, l'expérience est rejouée."""
    import hashlib
    h = hashlib.sha256()
    for t in taches_exp:
        h.update(json.dumps(t, sort_keys=True, ensure_ascii=False).encode())
    return h.hexdigest()[:16]


def _ordre(t):
    """Les parties les plus longues d'abord (plus de peuples, sondes), pour répartir la charge."""
    return -len(t["peuples"]) - (8 if t.get("sondes") else 0)


def _ecrire_experience(dossier, nom, exp, liste, res, echelle, duree, **extra):
    """Écrit <exp>.jsonl (une ligne par partie, dans l'ordre de _ordre) et <exp>.meta.json.
    liste : les tâches dans l'ordre du plan (pour l'empreinte) ; res : les résultats dans l'ordre trié."""
    with open(os.path.join(dossier, f"{exp}.jsonl"), "w", encoding="utf-8") as f:
        for r in res:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    maquette, variante, bot, exps, n = _config(nom)
    with open(os.path.join(dossier, f"{exp}.meta.json"), "w", encoding="utf-8") as f:
        json.dump(dict({"nom": nom, "experience": exp, "maquette": maquette, "variante": variante, "bot": bot,
                        "echelle": echelle, "parties": len(liste), "erreurs": sum("erreur" in r for r in res),
                        "duree_s": round(duree), "moteur": VERSION, "signature": _signature(liste)}, **extra),
                  f, ensure_ascii=False, indent=1)


def executer(nom, echelle=1.0, processus=None, bavard=True):
    """Joue les parties d'une configuration, expérience par expérience, et les
    enregistre (resultats/batterie/<config>/<expérience>.jsonl, une ligne par
    partie). Une expérience déjà jouée avec les mêmes tâches et le même moteur
    n'est pas rejouée."""
    tt = taches(nom, echelle)
    dossier = os.path.join(DOSSIER, nom)
    os.makedirs(dossier, exist_ok=True)
    _migrer(dossier)
    par_exp = defaultdict(list)
    for t in tt:
        par_exp[t["exp"]].append(t)
    for exp, liste in par_exp.items():
        chemin = os.path.join(dossier, f"{exp}.jsonl")
        meta = os.path.join(dossier, f"{exp}.meta.json")
        sig = _signature(liste)
        if os.path.exists(meta) and os.path.exists(chemin):
            with open(meta, encoding="utf-8") as f:
                m = json.load(f)
            if m.get("signature") == sig and m.get("moteur") == VERSION:
                if bavard:
                    print(f"{nom}/{exp} : déjà fait ({len(liste)} parties)", flush=True)
                continue
        triee = sorted(liste, key=_ordre)
        t0 = time.time()
        if bavard:
            print(f"{nom}/{exp} : {len(liste)} parties…", flush=True)
        with Pool(processus or os.cpu_count()) as pool:
            res = pool.map(jouer, triee, chunksize=8)
        _ecrire_experience(dossier, nom, exp, liste, res, echelle, time.time() - t0)
        if bavard:
            print(f"{nom}/{exp} : {len(liste)} parties en {time.time() - t0:.0f} s, "
                  f"{sum('erreur' in r for r in res)} erreurs", flush=True)


# --------------------------------------------------------------------------- par lots
def plan_complet(noms, echelle=1.0):
    """Toutes les parties du plan, dans un ordre fixe : [(configuration, tâche)]."""
    return [(nom, t) for nom in noms for t in taches(nom, echelle)]


def empreinte_plan(noms, echelle=1.0):
    """Empreinte du plan complet et du moteur : deux lots ne se fusionnent que si elle est la même."""
    import hashlib
    h = hashlib.sha256(VERSION.encode())
    for nom, t in plan_complet(noms, echelle):
        h.update(nom.encode())
        h.update(json.dumps(t, sort_keys=True, ensure_ascii=False).encode())
    return h.hexdigest()[:16]


def nom_lot(i, n):
    return f"batterie_lot_{i:04d}_sur_{n:04d}"


def jouer_lot(i, n, noms=None, echelle=1.0, sortie="lots", processus=None, bavard=True):
    """Joue le lot i (de 0 à n-1) sur n : les parties d'indice i, i+n, i+2n… du plan.
    Écrit <sortie>/batterie_lot_XXXX_sur_YYYY.jsonl.gz (une ligne {"n": indice, "r": résultat})
    et .meta.json. Un lot déjà écrit pour le même plan n'est pas rejoué."""
    if not 0 <= i < n:
        raise SystemExit(f"lot {i}/{n} invalide : il faut 0 <= i < n")
    noms = list(noms or PLAN)
    tout = plan_complet(noms, echelle)
    emp = empreinte_plan(noms, echelle)
    base = os.path.join(sortie, nom_lot(i, n))
    if os.path.exists(base + ".meta.json") and os.path.exists(base + ".jsonl.gz"):
        with open(base + ".meta.json", encoding="utf-8") as f:
            if json.load(f).get("empreinte") == emp:
                if bavard:
                    print(f"lot {i}/{n} : déjà fait ({base}.jsonl.gz)", flush=True)
                return None
    indices = sorted(range(i, len(tout), n), key=lambda k: _ordre(tout[k][1]))
    if bavard:
        print(f"batterie, lot {i}/{n} : {len(indices)} parties sur {len(tout)} ({len(noms)} configurations)",
              flush=True)
    t0 = time.time()
    with Pool(processus or os.cpu_count()) as pool:
        res = pool.map(jouer, [tout[k][1] for k in indices], chunksize=4)
    duree = time.time() - t0
    os.makedirs(sortie, exist_ok=True)
    with gzip.open(base + ".jsonl.gz", "wt", encoding="utf-8", compresslevel=6) as f:
        for k, r in zip(indices, res):
            f.write(json.dumps({"n": k, "r": r}, ensure_ascii=False, separators=(",", ":")) + "\n")
    meta = {"lot": i, "sur": n, "parties": len(indices), "total": len(tout), "noms": noms, "echelle": echelle,
            "moteur": VERSION, "empreinte": emp, "duree_s": round(duree, 2), "coeurs": processus or os.cpu_count(),
            "erreurs": sum("erreur" in r for r in res)}
    with open(base + ".meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)
    if bavard:
        cps = len(indices) / duree / meta["coeurs"] if duree else 0
        print(f"lot {i}/{n} terminé en {duree:.0f} s ({cps:.1f} parties/s/cœur), {meta['erreurs']} erreurs ; "
              f"{base}.jsonl.gz", flush=True)
    return meta


def fusionner(dossier, noms=None, echelle=1.0, bavard=True):
    """Rassemble les lots de <dossier> dans resultats/batterie/<config>/<expérience>.jsonl,
    comme un calcul d'un seul tenant. Refuse des lots d'un autre plan, un lot manquant
    ou en double, une partie manquante ou en double. Rend le résumé de la fusion."""
    noms = list(noms or PLAN)
    tout = plan_complet(noms, echelle)
    emp = empreinte_plan(noms, echelle)
    metas = []
    for chemin in sorted(glob.glob(os.path.join(dossier, "**", "batterie_lot_*.meta.json"), recursive=True)):
        with open(chemin, encoding="utf-8") as f:
            metas.append(json.load(f))
    if not metas:
        raise SystemExit(f"aucun lot de batterie dans {dossier}")
    autres = [m for m in metas if m.get("empreinte") != emp]
    if autres:
        raise SystemExit(f"{len(autres)} lot(s) d'un autre plan (configurations, échelle ou moteur différents) : "
                         f"empreinte {autres[0].get('empreinte')} au lieu de {emp}")
    sur = {m["sur"] for m in metas}
    if len(sur) > 1:
        raise SystemExit(f"lots de découpages différents : {sorted(sur)}")
    n = sur.pop()
    vus = Counter(m["lot"] for m in metas)
    doubles = sorted(k for k, c in vus.items() if c > 1)
    manquants = [k for k in range(n) if k not in vus]
    if doubles or manquants:
        raise SystemExit(f"fusion impossible : lots manquants {manquants or 'aucun'}, en double {doubles or 'aucun'} "
                         f"(sur {n}). Rejouer seulement les lots manquants : --lot <i>/{n}")
    par_indice = {}
    for chemin in sorted(glob.glob(os.path.join(dossier, "**", "batterie_lot_*.jsonl.gz"), recursive=True)):
        with gzip.open(chemin, "rt", encoding="utf-8") as f:
            for ligne in f:
                d = json.loads(ligne)
                if d["n"] in par_indice:
                    raise SystemExit(f"partie {d['n']} présente deux fois : {chemin}")
                par_indice[d["n"]] = d["r"]
    absentes = [k for k in range(len(tout)) if k not in par_indice]
    if absentes or len(par_indice) != len(tout):
        raise SystemExit(f"fusion impossible : {len(absentes)} partie(s) manquante(s) sur {len(tout)}, "
                         f"{len(par_indice) - len(tout) + len(absentes)} en trop")
    groupes = defaultdict(list)
    for k, (nom, t) in enumerate(tout):
        groupes[(nom, t["exp"])].append(k)
    duree_cum = sum(m["duree_s"] * m["coeurs"] for m in metas)
    for (nom, exp), ks in groupes.items():
        dossier_c = os.path.join(DOSSIER, nom)
        os.makedirs(dossier_c, exist_ok=True)
        liste = [tout[k][1] for k in ks]
        triee = sorted(ks, key=lambda k: _ordre(tout[k][1]))
        _ecrire_experience(dossier_c, nom, exp, liste, [par_indice[k] for k in triee], echelle, 0, lots=n)
    resume = {"lots": n, "parties": len(tout), "erreurs": sum("erreur" in r for r in par_indice.values()),
              "duree_max_s": round(max(m["duree_s"] for m in metas)), "duree_cumulee_coeurs_s": round(duree_cum),
              "parties_par_s_par_coeur": round(len(tout) / duree_cum, 1) if duree_cum else None,
              "configurations": noms, "echelle": echelle, "empreinte": emp, "moteur": VERSION}
    os.makedirs(DOSSIER, exist_ok=True)
    with open(os.path.join(DOSSIER, "fusion.json"), "w", encoding="utf-8") as f:
        json.dump(resume, f, ensure_ascii=False, indent=1)
    if bavard:
        print(f"{n} lots fusionnés : {len(tout)} parties, {resume['erreurs']} en erreur, "
              f"{resume['parties_par_s_par_coeur']} parties/s/cœur ; {DOSSIER}", flush=True)
    return resume


def _migrer(dossier, echelle=1.0):
    """Ancien format (un seul parties.jsonl par configuration) : découpé par expérience."""
    ancien = os.path.join(dossier, "parties.jsonl")
    if not os.path.exists(ancien):
        return
    nom = os.path.basename(dossier)
    with open(ancien, encoding="utf-8") as f:
        res = [json.loads(x) for x in f]
    par = defaultdict(list)
    for r in res:
        par[r["exp"]].append(r)
    taches_exp = defaultdict(list)
    for t in taches(nom, echelle):
        taches_exp[t["exp"]].append(t)
    for exp, rs in par.items():
        with open(os.path.join(dossier, f"{exp}.jsonl"), "w", encoding="utf-8") as f:
            for r in rs:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        ok = len(rs) == len(taches_exp.get(exp, []))
        with open(os.path.join(dossier, f"{exp}.meta.json"), "w", encoding="utf-8") as f:
            json.dump({"nom": nom, "experience": exp, "parties": len(rs), "moteur": VERSION,
                       "signature": _signature(taches_exp[exp]) if ok else None, "migre": True}, f, indent=1)
    os.rename(ancien, ancien + ".migre")
    if os.path.exists(os.path.join(dossier, "meta.json")):
        os.rename(os.path.join(dossier, "meta.json"), os.path.join(dossier, "meta.json.migre"))


def lire_parties(nom):
    dossier = os.path.join(DOSSIER, nom)
    if not os.path.isdir(dossier):
        return None
    _migrer(dossier)
    out = []
    for f_ in sorted(os.listdir(dossier)):
        if f_.endswith(".jsonl"):
            with open(os.path.join(dossier, f_), encoding="utf-8") as f:
                out += [json.loads(x) for x in f]
    return out or None


# --------------------------------------------------------------------------- les mesures
def _cle(peuples):
    return frozenset(peuples)


def _r(x, d=1):
    return None if x is None else round(x, d)


def _ref(parties):
    """Population de référence : duos et trios de l'expérience « tables », sans erreur."""
    return [r for r in parties if r["exp"] == "tables" and r["etiquette"] == "equipe"
            and len(r["peuples"]) in (2, 3) and "erreur" not in r]


def mesures_parties(ref, maquette, variante):
    """Mesures partie par partie, agrégées sur la population de référence :
    [mesure:robustesse] [mesure:lacunes] [mesure:couverture] [mesure:charge] [mesure:duree]
    [mesure:attente] [mesure:forcees] [mesure:concentration] [mesure:surprise] [mesure:fins]
    [mesure:fins_precoces] [mesure:menace_croissante] [mesure:plancher] [mesure:tactiques]
    [mesure:apprentissage]"""
    out = {}
    n = len(ref)
    out["parties"] = n
    out["foret_pct"] = _r(moyenne(r["pct"] for r in ref))
    out["foret_ic95"] = _r(ic95(r["pct"] for r in ref), 2)
    # -- niveau 1
    out["robustesse"] = {"incoherences_par_partie": _r(moyenne(sum(r["incoherences"].values()) for r in ref), 3),
                         "incoherences": dict(sum((Counter(r["incoherences"]) for r in ref), Counter()))}
    out["robustesse"]["verdict"] = verdict("robustesse", out["robustesse"]["incoherences_par_partie"])
    lac = sum((Counter(r["lacunes"]) for r in ref), Counter())
    out["lacunes"] = {"par_partie": _r(sum(lac.values()) / n, 2),
                      "principales": {k: _r(v / n, 2) for k, v in lac.most_common(6)}}
    cov = Counter()
    for r in ref:
        for k, v in r["stats"].items():
            if v > 0:
                cov[k] += 1
    out["couverture"] = {k: _r(100 * v / n) for k, v in sorted(cov.items(), key=lambda kv: -kv[1])}
    out["charge"] = {"par_partie": _r(moyenne(r["mesures"]["charge"] for r in ref), 2)}
    temps = [r["mesures"]["temps_s"] / 60 for r in ref]
    nf = [moyenne(r["mesures"]["non_forcees_siege"]) for r in ref]
    out["duree"] = {"minutes": _r(moyenne(temps)), "minutes_q90": _r(quantile(temps, 0.9)),
                    "tours": _r(moyenne(r["tour"] for r in ref), 2),
                    "decisions_non_forcees_par_joueur": _r(moyenne(nf))}
    out["attente"] = {"attente_pct": _r(100 * moyenne(moyenne(r["mesures"]["attente"]) for r in ref)),
                      "decisions_par_heure": _r(moyenne(a / (t / 60) for a, t in zip(nf, temps)))}
    dec = defaultdict(lambda: [0, 0])
    for r in ref:
        for k, (a, b) in r["mesures"]["dec"].items():
            dec[k][0] += a
            dec[k][1] += b
    tot = sum(a for k, (a, b) in dec.items() if k != "presence")
    forc = sum(b for k, (a, b) in dec.items() if k != "presence")
    out["forcees"] = {"total_pct": _r(100 * forc / max(1, tot)),
                      "par_type": {k: _r(100 * b / a) for k, (a, b) in sorted(dec.items()) if a}}
    # -- objectif 1
    conc = [r["mesures"]["conc"][0] / r["mesures"]["conc"][1] for r in ref if r["mesures"]["conc"][1]]
    out["concentration"] = {"valeur": _r(100 * moyenne(conc)) if conc else None,
                            "ic95": _r(100 * ic95(conc), 2) if conc else None}
    out["concentration"]["verdict"] = verdict("concentration", out["concentration"]["valeur"])
    st = [sum(r["mesures"]["surp_t"][i] for r in ref) for i in (0, 1)]
    sm = [sum(r["mesures"]["surp_m"][i] for r in ref) for i in (0, 1)]
    out["surprise"] = {"valeur": _r(100 * st[1] / st[0]) if st[0] else None, "ordres": st[0],
                       "machines": _r(100 * sm[1] / sm[0]) if sm[0] else None}
    out["surprise"]["verdict"] = verdict("surprise", out["surprise"]["valeur"])
    # -- équilibre des fins, fins précoces
    fins = Counter(r["fin"] for r in ref)
    out["fins"] = {k: _r(100 * v / n) for k, v in fins.most_common()}
    out["fins"]["tour_moyen"] = _r(moyenne(r["tour"] for r in ref), 2)
    prec = sum(1 for r in ref if r["fin"] != "nuit" and r["tour"] <= 3)
    out["fins_precoces"] = {"valeur": _r(100 * prec / n)}
    out["fins_precoces"]["verdict"] = verdict("fins_precoces", out["fins_precoces"]["valeur"])
    # -- menace croissante (parties qui atteignent le tour 5)
    tard = [r for r in ref if any(t in r["mesures"]["par_tour"] for t in ("5", "6"))]
    def taux(parties, tours, i):
        num = sum(r["mesures"]["par_tour"].get(t, [0] * 5)[i] for r in parties for t in tours)
        den = sum(r["mesures"]["par_tour"].get(t, [0] * 5)[4] for r in parties for t in tours)
        return num / den if den else None
    rr = [taux(tard, ("5", "6"), 1), taux(tard, ("1", "2"), 1)]
    ma = [taux(tard, ("5", "6"), 3), taux(tard, ("1", "2"), 3)]
    rap_o = rr[0] / rr[1] if tard and rr[1] else None
    rap_m = ma[0] / ma[1] if tard and ma[1] else None
    vals = [x for x in (rap_o, rap_m) if x is not None]
    out["menace_croissante"] = {"ordres_reussis": _r(rap_o, 2), "machines_actives": _r(rap_m, 2),
                                "valeur": _r(min(vals), 2) if vals else None,
                                "parties_au_tour_5_pct": _r(100 * len(tard) / n)}
    out["menace_croissante"]["verdict"] = verdict("menace_croissante", out["menace_croissante"]["valeur"])
    # -- plancher
    pcts = sorted(r["pct"] for r in ref)
    dec10 = pcts[:max(1, len(pcts) // 10)]
    out["plancher"] = {"valeur": _r(moyenne(dec10))}
    out["plancher"]["verdict"] = verdict("plancher", out["plancher"]["valeur"])
    # -- tactiques et Machines
    def pool(cle):
        d = defaultdict(lambda: [0, 0, 0])
        for r in ref:
            for k, v in r["mesures"][cle].items():
                for i in range(3):
                    d[k][i] += v[i]
        tot = sum(v[0] for v in d.values())
        return {k: {"tires_pct": _r(100 * v[0] / tot), "reussis_pct": _r(100 * v[1] / v[0]),
                    "forets_par_ordre": _r(v[2] / v[0], 2)} for k, v in sorted(d.items(), key=lambda kv: -kv[1][0])}
    out["tactiques"] = {"tactiques": pool("tactiques"), "machines": pool("machines")}
    # -- apprentissage : pistes finales
    m = charger(maquette, variante)
    init = m["piste"]["disposition"]
    par_table = defaultdict(list)
    for r in ref:
        par_table[tuple(r["peuples"])].append(r["mesures"]["piste"])
    rng = random.Random(1)
    intra, inter = [], []
    tables = list(par_table)
    for t in tables:
        ps = par_table[t]
        for a, b in itertools.combinations(ps[:10], 2):
            intra.append(distance_pistes(a, b))
    for _ in range(2000):
        t1, t2 = rng.sample(tables, 2)
        inter.append(distance_pistes(rng.choice(par_table[t1]), rng.choice(par_table[t2])))
    out["apprentissage"] = {"depuis_le_depart": _r(moyenne(distance_pistes(r["mesures"]["piste"], init) for r in ref), 2),
                            "entre_equipes": _r(moyenne(inter), 2), "meme_equipe": _r(moyenne(intra), 2)}
    out["apprentissage"]["propre_a_l_equipe"] = _r(out["apprentissage"]["entre_equipes"]
                                                   - out["apprentissage"]["meme_equipe"], 2)
    return out


def mesures_sondes(parties):
    """[mesure:predictibilite] [mesure:incertitude] sur les duos sondés."""
    son = [r for r in parties if r["exp"] == "tables" and r.get("sondes") is not None and "erreur" not in r]
    if not son:
        return {}
    reels = [r["pct"] for r in son]
    seuil = statistics.median(reels)
    pred = [moyenne(r["sondes"]["t2"]) if "t2" in r["sondes"] else r["pct"] for r in son]
    ex = exactitude_equilibree(pred, reels, seuil)
    a = auc(pred, reels, seuil)
    # Cas dégénéré (révision du 12 oct., témoin des dés truqués en v1) : toutes les issues sont
    # égales. La partie est alors jouée d'avance : prédiction exacte si les copies l'annoncent.
    if ex is None and len(set(reels)) == 1:
        ex = 1.0 if all(abs(p - r) < 1e-9 for p, r in zip(pred, reels)) else None
    # incertitude initiale : variance des issues au sein d'une même équipe (tous les duos de l'expérience)
    duos = defaultdict(list)
    for r in parties:
        if r["exp"] == "tables" and r["etiquette"] == "equipe" and len(r["peuples"]) == 2 and "erreur" not in r:
            duos[tuple(r["peuples"])].append(r["pct"])
    v0 = moyenne(variance(v) for v in duos.values() if len(v) > 1)
    vr = moyenne(variance(r["sondes"]["t5"]) if "t5" in r["sondes"] else 0.0 for r in son)
    out = {"predictibilite": {"valeur": _r(100 * ex) if ex is not None else None, "auc": _r(a, 2),
                              "fin_avant_tour_3_pct": _r(100 * sum(1 for r in son if "t2" not in r["sondes"]) / len(son)),
                              "parties": len(son)},
           "incertitude": {"valeur": _r(vr / v0, 2) if v0 else (0.0 if v0 == 0 and vr == 0 else None),
                           "variance_initiale": _r(v0),
                           "variance_tour_5": _r(vr),
                           "finies_avant_tour_5_pct": _r(100 * sum(1 for r in son if "t5" not in r["sondes"]) / len(son))}}
    out["predictibilite"]["verdict"] = verdict("predictibilite", out["predictibilite"]["valeur"])
    out["incertitude"]["verdict"] = verdict("incertitude", out["incertitude"]["valeur"])
    return out


def valeurs_equipes(parties):
    """v(S) : forêt moyenne (%) de chaque équipe ; v(∅) : les tables « personne »."""
    g = defaultdict(list)
    vide = []
    for r in parties:
        if r["exp"] != "tables" or "erreur" in r:
            continue
        if r["etiquette"] == "personne":
            vide.append(r["pct"])
        else:
            g[_cle(r["peuples"])].append(r["pct"])
    return g, vide


def mesures_equipes(parties, maquette, variante, bootstrap=200):
    """[mesure:shapley] [mesure:synergies] [mesure:pire_table]"""
    g, vide = valeurs_equipes(parties)
    out = {}
    duos = {k: moyenne(v) for k, v in g.items() if len(k) == 2}
    trios = {k: moyenne(v) for k, v in g.items() if len(k) == 3}
    pt = {}
    for nom, d in (("duos", duos), ("trios", trios)):
        if d:
            lo, hi = min(d, key=d.get), max(d, key=d.get)
            pt[nom] = {"rapport": _r(100 * d[lo] / d[hi]), "pire": [sorted(lo), _r(d[lo])],
                       "meilleure": [sorted(hi), _r(d[hi])]}
    if pt:
        val = min(x["rapport"] for x in pt.values())
        out["pire_table"] = dict(pt, valeur=val, verdict=verdict("pire_table", val))
    complet = len(g) >= 63
    seuls_duos = all(frozenset((p,)) in g for p in PEUPLES) and \
        all(frozenset(d) in g for d in itertools.combinations(PEUPLES, 2))
    if not vide or not (complet or seuls_duos):
        return out
    m = lire(maquette)

    def evaluer(gg, vv):
        v = {k: moyenne(x) for k, x in gg.items()}
        v[frozenset()] = moyenne(vv)
        phi = shapley(v, PEUPLES) if complet else shapley_restreint(v, PEUPLES)
        moy = moyenne(phi.values())
        syn = synergies(v, PEUPLES)
        return v, phi, moy, syn

    v, phi, moy, syn = evaluer(g, vide)
    rapports = {p: phi[p] / moy for p in PEUPLES}
    # incertitude par rééchantillonnage des parties de chaque équipe
    rng = random.Random(7)
    boot = defaultdict(list)
    for _ in range(bootstrap):
        gb = {k: [rng.choice(x) for _ in x] for k, x in g.items()}
        vb = [rng.choice(vide) for _ in vide]
        _, pb, mb, _ = evaluer(gb, vb)
        for p in PEUPLES:
            boot[p].append(pb[p] / mb)
    lo_hi = {p: (_r(quantile(boot[p], 0.025), 2), _r(quantile(boot[p], 0.975), 2)) for p in PEUPLES}
    pire = max(abs(x - 1) for x in rapports.values())
    if all(0.7 <= x <= 1.3 for x in rapports.values()):
        vd = "vert"
    elif any(x < 0.5 or x > 1.5 for x in rapports.values()):
        vd = "rouge"
    else:
        vd = "orange"
    out["shapley"] = {"rapports": {p: _r(x, 2) for p, x in rapports.items()}, "ic95": lo_hi,
                      "points": {p: _r(x, 2) for p, x in phi.items()}, "v_vide": _r(v[frozenset()]),
                      "v_tous": _r(v.get(frozenset(PEUPLES))), "ecart_max": _r(pire, 2), "verdict": vd,
                      "methode": "exacte (63 équipes)" if complet else "restreinte aux tables de 1 et 2 peuples (plan réduit)"}
    # [mesure:synergies] Décision B2 du 12 oct. : le jeu s'adapte au nombre de joueurs (un peuple
    # seul garde déjà l'essentiel de la forêt), la synergie additive est donc négative par
    # construction. « Aucun ne suffit » : le duo bat-il son meilleur peuple joué seul ? (verdict)
    # Le tétraèdre : synergie relative entre duos (écart de chaque duo à ce qu'annoncent ses deux
    # peuples dans les autres duos) ; les trois duos complets doivent être dans le premier tiers.
    complets = duos_complets(m)
    duos_v = {tuple(sorted(k)): moyenne(x) for k, x in g.items() if len(k) == 2}
    solo = {next(iter(k)): moyenne(x) for k, x in g.items() if len(k) == 1}
    bat = duo_contre_meilleur_seul(solo, duos_v)
    n_bat = sum(1 for x in bat.values() if x > 0)
    resid = synergies_relatives(duos_v)
    cl = sorted(resid.items(), key=lambda kv: -kv[1])
    top = {k for k, _ in cl[:5]}
    n_complets = sum(1 for c in complets if c in top)
    classes = sorted(syn.items(), key=lambda kv: -kv[1])
    out["synergies"] = {
        "valeur": n_bat, "verdict": verdict("synergies", n_bat),
        "duo_bat_son_meilleur_seul": {"nombre": n_bat, "detail": [[list(k), _r(x)] for k, x in
                                                                  sorted(bat.items(), key=lambda kv: -kv[1])]},
        "tetraedre": {"complets_dans_le_premier_tiers": n_complets, "duos_complets": sorted(list(c) for c in complets),
                      "classement": [[list(k), _r(x)] for k, x in cl],
                      "verdict": "vert" if n_complets == 3 else "orange"},
        "additive": {"positives": sum(1 for _, x in syn.items() if x > 0),
                     "classement": [[sorted(k), _r(x)] for k, x in classes]},
        "solo": {p: _r(x) for p, x in solo.items()}}
    eff = {}
    for k in (2, 3):
        tk = {kk: moyenne(x) for kk, x in g.items() if len(kk) == k}
        eff[str(k)] = {p: _r(moyenne(v for t, v in tk.items() if p in t) - moyenne(v for t, v in tk.items() if p not in t))
                       for p in PEUPLES}
    out["shapley"]["effet_par_taille"] = eff
    out["valeurs_equipes"] = {"/".join(sorted(k)): _r(moyenne(x)) for k, x in sorted(g.items(), key=lambda kv: (len(kv[0]), sorted(kv[0])))}
    return out


def mesures_spectateur(parties):
    """[mesure:spectateur] Perte quand un siège ne fait rien (bot inerte, verdict) ou joue au
    hasard (information : le bot aléatoire rêve, ce qui rapporte en soi)."""
    base = defaultdict(list)
    for r in parties:
        if r["exp"] == "tables" and r["etiquette"] == "equipe" and len(r["peuples"]) in (2, 3) and "erreur" not in r:
            base[tuple(r["peuples"])].append(r["pct"])
    out = {}
    for et in ("inerte", "hasard"):
        alt = defaultdict(list)
        for r in parties:
            if r["exp"] == "spectateur" and "erreur" not in r and r["etiquette"].startswith(et + ":"):
                alt[(tuple(r["peuples"]), r["etiquette"].split(":")[1])].append(r["pct"])
        if not alt:
            continue
        impact = defaultdict(list)
        for (t, p), v in alt.items():
            if t in base:
                impact[p].append(moyenne(base[t]) - moyenne(v))
        imp = {p: moyenne(v) for p, v in impact.items()}
        moy = moyenne(imp.values())
        rap = {p: (x / moy if moy and moy > 0 else None) for p, x in imp.items()}
        vals = [x for x in rap.values() if x is not None]
        mini = min(vals) if vals else None
        out[et] = {"impact_points": {p: _r(x) for p, x in imp.items()},
                   "rapports": {p: _r(x, 2) for p, x in rap.items()}, "valeur": _r(mini, 2),
                   "verdict": verdict("spectateur", mini) if mini is not None else "non mesurable"}
    if not out:
        return {}
    res = dict(out.get("inerte", {}))
    res["au_hasard"] = out.get("hasard")
    return {"spectateur": res}


def mesures_reves(parties, maquette, variante):
    """[mesure:reve_fixe]"""
    g = defaultdict(list)
    fins = defaultdict(Counter)
    for r in parties:
        if r["exp"] == "reves" and "erreur" not in r:
            g[r["etiquette"]].append(r["pct"])
            fins[r["etiquette"]][r["fin"]] += 1
    if not g:
        return {}
    taux = {float(k.split(":")[1]): moyenne(v) for k, v in g.items() if k.startswith("taux:")}
    meilleur = max(taux, key=taux.get)
    extremes = (min(taux), max(taux))
    # Révision du 12 oct. (témoin des rêves sans limite) : un optimum « intermédiaire » doit battre
    # les deux taux extrêmes au-delà de la marge à 95 % de l'écart ; sinon, un extrême vaut le meilleur.
    gt = {float(k.split(":")[1]): v for k, v in g.items() if k.startswith("taux:")}

    def marge(a, b):
        return 1.96 * ((variance(gt[a]) / len(gt[a])) + (variance(gt[b]) / len(gt[b]))) ** 0.5
    extreme_egal = [e for e in extremes if e != meilleur and taux[meilleur] - taux[e] <= marge(meilleur, e)]
    vd = "rouge" if (meilleur in extremes or extreme_egal) else "vert"
    out = {"reve_fixe": {"par_taux": {str(k): _r(v) for k, v in sorted(taux.items())},
                         "ic95": _r(max((x for x in (ic95(v) for v in g.values()) if x is not None), default=None), 2),
                         "meilleur": meilleur, "maximum_teste": extremes[1],
                         "extremes_aussi_bons": extreme_egal, "verdict": vd}}
    voies = {k.split(":")[1]: moyenne(v) for k, v in g.items() if k.startswith("voie:")}
    if voies:
        out["reve_fixe"]["par_voie"] = {k: _r(v) for k, v in voies.items()}
        out["reve_fixe"]["fins_par_voie"] = {k.split(":")[1]: {f: _r(100 * c / sum(fc.values())) for f, c in fc.items()}
                                             for k, fc in fins.items() if k.startswith("voie:")}
    return out


def _fort(bot):
    """Le bot de la configuration est-il le bot fort (Monte-Carlo) ?"""
    return bot.get("type") == "mc"


def _par_table(parties, exp, etiquette=None):
    """{table: [forêts %]} des parties d'une expérience (et d'une étiquette)."""
    g = defaultdict(list)
    for r in parties:
        if r["exp"] == exp and "erreur" not in r and (etiquette is None or r["etiquette"] == etiquette):
            g[_cle(r["peuples"])].append(r["pct"])
    return g


def mesures_gain_libre(parties, bot):
    """[mesure:gain_libre] Le bot fort libre (« tables », équipes) contre lui-même à taux de rêve
    fixes (« reves »), sur les tables jouées des deux façons."""
    if not _fort(bot):
        return {}
    libre = _par_table(parties, "tables", "equipe")
    taux = defaultdict(lambda: defaultdict(list))
    for r in parties:
        if r["exp"] == "reves" and "erreur" not in r and r["etiquette"].startswith("taux:"):
            taux[float(r["etiquette"].split(":")[1])][_cle(r["peuples"])].append(r["pct"])
    communes = set(libre).intersection(*[set(t) for t in taux.values()]) if taux else set()
    if not communes:
        return {}
    a = [x for k in communes for x in libre[k]]
    par_taux = {t: [x for k in communes for x in g[k]] for t, g in taux.items()}
    res = gain_libre(a, par_taux)
    return {"gain_libre": {"valeur": _r(res["gain"], 2), "libre": _r(res["libre"]), "meilleur_fixe": _r(res["meilleur_fixe"]),
                           "taux": res["taux"], "marge": _r(res["marge"], 2), "tables": len(communes),
                           "verdict": res["verdict"]}}


def mesures_taupe(parties, bot):
    """[mesure:tape_taupe] Le bot fort (« tables », équipes) contre le glouton à son meilleur taux
    fixe (« taupe »), sur les tables jouées des deux façons."""
    if not _fort(bot):
        return {}
    fort = _par_table(parties, "tables", "equipe")
    taux = defaultdict(lambda: defaultdict(list))
    for r in parties:
        if r["exp"] == "taupe" and "erreur" not in r:
            taux[float(r["etiquette"].split(":")[1])][_cle(r["peuples"])].append(r["pct"])
    if not taux:
        return {}
    glouton = {t: {"/".join(sorted(k)): _r(moyenne(v)) for k, v in sorted(g.items(), key=lambda kv: sorted(kv[0]))}
               for t, g in taux.items()}
    out = {"tape_taupe": {"glouton_par_taux": {str(t): _r(moyenne([x for v in g.values() for x in v]))
                                               for t, g in sorted(taux.items())},
                          "glouton_par_table": {str(t): v for t, v in sorted(glouton.items())}}}
    communes = set(fort).intersection(*[set(g) for g in taux.values()])
    if not communes:
        out["tape_taupe"]["verdict"] = "non mesurable (pas de table jouée par le bot fort)"
        return out
    a = [x for k in communes for x in fort[k]]
    res = tape_taupe(a, {t: [x for k in communes for x in g[k]] for t, g in taux.items()})
    out["tape_taupe"].update({"valeur": _r(res["ecart"], 2), "fort": _r(res["fort"]), "taupe": _r(res["taupe"]),
                              "taux_taupe": res["taux_taupe"], "marge": _r(res["marge"], 2),
                              "tables": len(communes), "verdict": res["verdict"]})
    return out


def mesures_dilemmes(parties):
    """[mesure:dilemmes] Les décisions jugées par le bot fort (réglage « juger »)."""
    jug = [j for r in parties if r["exp"] == "dilemmes" and "erreur" not in r for j in r.get("jugements", ())]
    if not jug:
        return {}
    res = part_dilemmes(jug)
    parties_d = sum(1 for r in parties if r["exp"] == "dilemmes" and "erreur" not in r)
    return {"dilemmes": dict(res, valeur=_r(res["part"]), part=_r(res["part"]), parties=parties_d)}


def mesures_coordination(parties, variante_nom):
    """[mesure:coordination]"""
    g = defaultdict(list)
    for r in parties:
        if r["exp"] == "coordination" and "erreur" not in r:
            g[r["etiquette"]].append(r["pct"])
    if not g:
        return {}
    out = {}
    for niveau in ("annonce", "complet"):
        a, f, t = (g.get(f"{v}|{niveau}") for v in ("comm_aucun_signe", "defaut", "comm_tout_dire"))
        if not (a and f and t):
            continue
        ecart = moyenne(t) - moyenne(a)
        marge = 1.96 * ((variance(t) / len(t)) + (variance(a) / len(a))) ** 0.5
        part = 100 * (moyenne(f) - moyenne(a)) / ecart if abs(ecart) > marge and ecart > 0 else None
        out[niveau] = {"aucun_signe": _r(moyenne(a)), "forme": _r(moyenne(f)), "tout_dire": _r(moyenne(t)),
                       "ecart": _r(ecart, 2), "marge": _r(marge, 2), "part": _r(part),
                       "verdict": verdict("coordination", part) if part is not None else "non mesurable"}
    return {"coordination": out}


def mesures_echelle(parties):
    """[mesure:echelle_bots]"""
    g = defaultdict(list)
    for r in parties:
        if r["exp"] == "echelle" and "erreur" not in r:
            g[r["etiquette"]].append(r["pct"])
    if not g:
        return {}
    a, b = g["aleatoire"], g["glouton"]
    d = moyenne(b) - moyenne(a)
    marge = 1.96 * ((variance(a) / len(a)) + (variance(b) / len(b))) ** 0.5
    return {"echelle_bots": {"aleatoire": _r(moyenne(a)), "glouton": _r(moyenne(b)), "marche": _r(d),
                             "marge": _r(marge, 2), "verdict": "vert" if d > marge else "rouge"}}


def evaluer_config(nom, parties=None):
    maquette, variante, bot, exps, n = _config(nom)
    parties = parties if parties is not None else lire_parties(nom)
    if parties is None:
        return None
    err = [r for r in parties if "erreur" in r]
    out = {"config": nom, "maquette": maquette, "variante": variante, "bot": _bot_texte(bot),
           "parties_jouees": len(parties), "erreurs": len(err)}
    if err:
        out["exemple_erreur"] = err[0]["erreur"]
    ref = _ref(parties)
    if ref:
        out.update(mesures_parties(ref, maquette, variante))
    out.update(mesures_sondes(parties))
    out.update(mesures_equipes(parties, maquette, variante))
    out.update(mesures_spectateur(parties))
    out.update(mesures_reves(parties, maquette, variante))
    out.update(mesures_gain_libre(parties, bot))
    out.update(mesures_taupe(parties, bot))
    out.update(mesures_dilemmes(parties))
    out.update(mesures_coordination(parties, variante))
    out.update(mesures_echelle(parties))
    return out


# --------------------------------------------------------------------------- les témoins
def _g(c, *cles):
    for k in cles:
        if c is None:
            return None
        c = c.get(k) if isinstance(c, dict) else None
    return c


# (mesure, configuration témoin, référence ou None, ce qu'on attend, test)
TEMOINS = [
    ("concentration", "v1_une_tactique", None, "rouge (résolue)", lambda t, r: _g(t, "concentration", "verdict") == "rouge"),
    ("concentration", "v2_une_tactique", None, "rouge (résolue)", lambda t, r: _g(t, "concentration", "verdict") == "rouge"),
    ("surprise", "v1_une_tactique", None, "rouge (aucune surprise)", lambda t, r: _g(t, "surprise", "verdict") == "rouge"),
    ("surprise", "v2_une_tactique", None, "rouge (aucune surprise)", lambda t, r: _g(t, "surprise", "verdict") == "rouge"),
    ("tactiques", "v1_une_tactique", None, "une seule tactique tirée",
     lambda t, r: list(_g(t, "tactiques", "tactiques") or {}) == ["Cupidite"]),
    ("predictibilite", "v1_des_fixes", None, "rouge (tout est joué)", lambda t, r: _g(t, "predictibilite", "verdict") == "rouge"),
    ("predictibilite", "v2_des_fixes", None, "rouge (tout est joué)", lambda t, r: _g(t, "predictibilite", "verdict") == "rouge"),
    ("incertitude", "v1_des_fixes", None, "rouge (plus rien à décider)", lambda t, r: _g(t, "incertitude", "verdict") == "rouge"),
    ("incertitude", "v2_des_fixes", None, "rouge (plus rien à décider)", lambda t, r: _g(t, "incertitude", "verdict") == "rouge"),
    # Révision du 12 oct. : sans apprentissage, la piste bouge encore par les esprits (rêves, Égarer) ;
    # l'attente « piste inchangée » était fausse. On attend un mouvement 10 fois moindre.
    ("apprentissage", "v1_sans_apprentissage", "v1_g0", "la piste bouge 10 fois moins (seuls les esprits)",
     lambda t, r: _g(t, "apprentissage", "depuis_le_depart") < 0.1 * _g(r, "apprentissage", "depuis_le_depart")),
    ("apprentissage", "v2_sans_apprentissage", "v2_g0", "la piste bouge 10 fois moins (seuls les esprits)",
     lambda t, r: _g(t, "apprentissage", "depuis_le_depart") < 0.1 * _g(r, "apprentissage", "depuis_le_depart")),
    ("apprentissage", "v1_sans_apprentissage", "v1_g0", "« propre à l'équipe » plus bas qu'avec apprentissage",
     lambda t, r: _g(t, "apprentissage", "propre_a_l_equipe") < _g(r, "apprentissage", "propre_a_l_equipe") - 0.1),
    ("menace_croissante", "v1_essoufflement", "v1_g0", "rouge (le Méchant s'essouffle)",
     lambda t, r: _g(t, "menace_croissante", "verdict") == "rouge"),
    ("menace_croissante", "v2_essoufflement", "v2_g0", "rouge (le Méchant s'essouffle)",
     lambda t, r: _g(t, "menace_croissante", "verdict") == "rouge"),
    ("plancher", "v1_assaut", "v1_g0", "plus bas que la v1 (même bot)",
     lambda t, r: (_g(t, "plancher", "valeur") or 999) < (_g(r, "plancher", "valeur") or 0)),
    ("shapley", "v1_hanter_illimite", "v1_g0", "rouge, entités en tête",
     lambda t, r: _g(t, "shapley", "verdict") == "rouge"
     and max(_g(t, "shapley", "rapports").items(), key=lambda kv: kv[1])[0] == "entites"),
    ("shapley", "v2_hanter_illimite", "v2_g0", "rouge, entités en tête",
     lambda t, r: _g(t, "shapley", "verdict") == "rouge"
     and max(_g(t, "shapley", "rapports").items(), key=lambda kv: kv[1])[0] == "entites"),
    ("shapley", "v1_mammiferes_sans_pouvoir", "v1_g0", "mammifères sous la moyenne et plus bas que dans la v1",
     lambda t, r: _g(t, "shapley", "rapports", "mammiferes") < min(1, _g(r, "shapley", "rapports", "mammiferes"))),
    ("synergies", "v1_hanter_illimite", "v1_g0", "rouge (un peuple suffit)",
     lambda t, r: _g(t, "synergies", "verdict") == "rouge"),
    ("pire_table", "v1_hanter_illimite", "v1_g0", "hors du vert",
     lambda t, r: _g(t, "pire_table", "verdict") in ("orange", "rouge")),
    ("spectateur", "v1_spectateur", "v1_g0", "rouge (les humains ne font rien)",
     lambda t, r: _g(t, "spectateur", "verdict") == "rouge"),
    ("reve_fixe", "v1_reves_illimites", None, "rouge (le plus haut taux gagne)",
     lambda t, r: _g(t, "reve_fixe", "verdict") == "rouge"),
    ("fins_precoces", "v1_reves_illimites", None, "rouge", lambda t, r: _g(t, "fins_precoces", "verdict") == "rouge"),
    ("fins", "v1_reves_illimites", "v1_g0", "la nuit presque disparaît (moins de 10 %)",
     lambda t, r: (_g(t, "fins", "nuit") or 0) < 10),
    ("robustesse", "v1_barrage_v0", "v1_g0", "beaucoup plus d'incohérences (barrage contourné)",
     lambda t, r: _g(t, "robustesse", "incoherences_par_partie") > 3 * _g(r, "robustesse", "incoherences_par_partie")),
    # Étape 3.3 (bot fort, programme mesures3)
    ("tape_taupe", "m3_v1_une_tactique", "m3_v1", "écart plus petit que dans la v1 (menace résolue : parer suffit)",
     lambda t, r: _g(t, "tape_taupe", "valeur") < _g(r, "tape_taupe", "valeur")),
    ("gain_libre", "m3_v1_sans_reve", None, "rouge (aucun rêve possible : tous les taux se valent)",
     lambda t, r: _g(t, "gain_libre", "verdict") == "rouge"),
    ("dilemmes", "m3_v1_essoufflement", "m3_v1", "plus de décisions indifférentes que la v1 (supposé)",
     lambda t, r: _g(t, "dilemmes", "classes", "indifferente") > _g(r, "dilemmes", "classes", "indifferente")),
    ("couverture", "v1_sans_pouvoirs", "v1_g0", "aucun pouvoir appliqué",
     lambda t, r: not any(k.startswith("pouvoir_") and v > 0 for k, v in (_g(t, "couverture") or {}).items())),
]


def verifier_temoins(configs):
    """Chaque témoin tombe-t-il là où il doit ? (A5 : sinon, la mesure est à revoir)"""
    out = []
    for mesure, nom, ref, attendu, test in TEMOINS:
        t, r = configs.get(nom), configs.get(ref) if ref else None
        if t is None or (ref and r is None):
            ok, err = None, "configuration absente"
        else:
            try:
                ok, err = bool(test(t, r)), None
            except Exception as e:  # noqa: BLE001
                ok, err = False, f"{type(e).__name__}: {e}"
        out.append({"mesure": mesure, "temoin": nom, "reference": ref, "attendu": attendu, "ok": ok,
                    "erreur": err})
    return out


def rapport(noms=None):
    noms = noms or list(PLAN)
    configs = {}
    for nom in noms:
        r = evaluer_config(nom)
        if r is not None:
            configs[nom] = r
    rap = {"moteur": VERSION, "date": time.strftime("%Y-%m-%d %H:%M"),
           "mesures": {k: {kk: vv for kk, vv in v.items() if kk not in ("temoins",)} | {"temoins": [list(t) for t in v["temoins"]]}
                       for k, v in MESURES.items()},
           "configs": configs}
    rap["temoins"] = [t for t in verifier_temoins(configs) if t["erreur"] != "configuration absente"]
    os.makedirs(DOSSIER, exist_ok=True)
    with open(os.path.join(DOSSIER, "rapport.json"), "w", encoding="utf-8") as f:
        json.dump(rap, f, ensure_ascii=False, indent=1, default=list)
    return rap


def _lot(texte):
    try:
        i, n = (int(x) for x in texte.split("/"))
    except ValueError:
        raise argparse.ArgumentTypeError("format attendu : i/n (par exemple 3/8)")
    return i, n


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("quoi", choices=list(PROGRAMMES) + ["rapport", "plan"])
    ap.add_argument("--programme", choices=list(PROGRAMMES), default=None,
                    help="plan et rapport : le programme (phase1 par défaut ; phase3 : plan réduit du bot fort ; "
                         "mesures3 : les mesures du bot fort et leurs témoins)")
    ap.add_argument("--echelle", type=float, default=1.0)
    ap.add_argument("--seulement", nargs="+")
    ap.add_argument("--processus", type=int)
    ap.add_argument("--lot", type=_lot, help="un programme : ne jouer que le lot i/n et l'écrire dans --sortie")
    ap.add_argument("--fusionner", metavar="DOSSIER",
                    help="un programme : rassembler les lots de ce dossier, puis le rapport")
    ap.add_argument("--sortie", default="lots", help="dossier des lots (avec --lot)")
    a = ap.parse_args()
    programme = a.quoi if a.quoi in PROGRAMMES else (a.programme or "phase1")
    plan = {"phase1": PLAN, "phase3": PLAN3, "mesures3": PLAN_M3}[programme]
    noms = a.seulement or list(plan)
    inconnus = [x for x in noms if x not in plan]
    if inconnus:
        ap.error(f"configuration(s) inconnue(s) pour {programme} : {', '.join(inconnus)}")
    if (a.lot or a.fusionner) and a.quoi not in PROGRAMMES:
        ap.error("--lot et --fusionner vont avec un programme (" + ", ".join(PROGRAMMES) + ")")
    if a.lot and a.fusionner:
        ap.error("--lot et --fusionner s'excluent")
    if a.quoi == "plan":
        for nom in noms:
            print(f"{nom:28s} {len(taches(nom, a.echelle)):6d} parties")
        print(f"{'total':28s} {len(plan_complet(noms, a.echelle)):6d} parties")
        return
    if a.lot:
        jouer_lot(a.lot[0], a.lot[1], noms, a.echelle, a.sortie, a.processus)
        return
    if a.fusionner:
        fusionner(a.fusionner, noms, a.echelle)
    elif a.quoi in PROGRAMMES:
        for nom in noms:
            executer(nom, a.echelle, a.processus)
    r = rapport(list(plan))
    print(f"rapport : {os.path.join(DOSSIER, 'rapport.json')} ({len(r['configs'])} configurations)")


if __name__ == "__main__":
    main()
