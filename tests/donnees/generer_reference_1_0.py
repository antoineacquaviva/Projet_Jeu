"""Génère reference_1_0.json : l'empreinte de bilans du moteur 1.0 (identiques en 1.1).

À ne relancer qu'avec un moteur qui joue comme la 1.0 : il a servi une fois, le
12 oct. 2026, avec le moteur 1.1 avant l'ajout de la communication et du
présage. Le test test_reference_1_0_rejouee (tests/test_communication.py)
vérifie qu'avec la communication et le présage coupés, et les nouvelles
options du glouton coupées, le moteur rejoue ces parties à l'identique.

    python -m tests.donnees.generer_reference_1_0
"""
import hashlib
import json
import os

from foret import charger, Partie, fabriquer

VARIANTES = ["defaut", "fin_de_tour", "effets_organes", "un_esprit_depart", "retour_v0_mise_en_place", "alliance_conjointe"]
BOTS = [{"type": "aleatoire"},
        {"type": "glouton", "params": {"reves_par_tour": 0.0}},
        {"type": "glouton", "params": {"reves_par_tour": 1.0}},
        {"type": "glouton", "params": {"reves_par_tour": 3.0}}]
TABLES = [["oiseaux", "insectes"], ["mammiferes", "reptiles", "humains"],
          ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"], ["entites", "oiseaux"]]


APRES_1_0 = ("resultat", "cercle", "cercle_capacite")   # clés du bilan ajoutées après la 1.0 (moteur 1.3)


# Moteur 1.5 (décision B4 du 12 oct.) : deux incohérences de la 1.0 sont devenues des cas permis,
# comptés en stats. On les remet sous leur ancien nom pour comparer avec les bilans de la 1.0.
RECLASSES_1_5 = {"voir_detourne": "voir_trahi", "coupe_en_chemin_cible_barree": "barrage_contourne"}


def _comme_en_1_0(b):
    b = dict(b)
    stats, inc = dict(b.get("stats", {})), dict(b.get("incoherences", {}))
    for nouveau, ancien in RECLASSES_1_5.items():
        if nouveau in stats:
            inc[ancien] = inc.get(ancien, 0) + stats.pop(nouveau)
    b["stats"], b["incoherences"] = stats, inc
    return b


def empreinte(b):
    b = {k: v for k, v in _comme_en_1_0(b).items() if k not in APRES_1_0}
    return hashlib.sha256(json.dumps(b, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def parties():
    for v in VARIANTES:
        for bot in BOTS:
            for t in TABLES:
                for g in (1, 2):
                    yield v, bot, t, g


def jouer(v, bot, t, g, m=None):
    m = m or charger("v1", v)
    bots = [fabriquer(bot, g * 100 + i) for i in range(len(t))]
    return Partie(m, list(t), bots, graine=g).jouer()


if __name__ == "__main__":
    out = []
    for v, bot, t, g in parties():
        b = jouer(v, bot, t, g)
        out.append({"variante": v, "bot": bot, "peuples": t, "graine": g,
                    "fin": b["fin"], "tour": b["tour"], "foret": b["foret"], "empreinte": empreinte(b)})
    chemin = os.path.join(os.path.dirname(__file__), "reference_1_0.json")
    with open(chemin, "w", encoding="utf-8") as f:
        f.write("[\n" + ",\n".join(json.dumps(e, ensure_ascii=False) for e in out) + "\n]\n")
    print(len(out), "parties ->", chemin)
