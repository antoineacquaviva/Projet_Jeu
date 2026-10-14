"""Un cycle de recherche de bout en bout, en petit (plan vers la V1, étapes 0.9 et 0.10 ; foret/cycle.py)."""
import json
import os

from foret import charger
from foret.cycle import (preparer, integrer, rapport, lire_json, ecrire_json, variante_de, patch_de, nb_par_table,
                         trajectoires, metriques_variantes, score_duree, score_difficulte, alertes, MAX_PAR_TABLE)
from foret.sim import lancer
import random

ESPACE = [
    {"nom": "cercle", "chemin": ["regles", "cercle_par_joueur"], "niveaux": [3, 2, 4, {"2": 4, "4": 3}]},
    {"nom": "lunes", "chemin": ["regles", "lunes"], "niveaux": [2, 1, "n-1"]},
    {"nom": "pas_esprit", "chemin": ["regles", "reves_par_pas"], "niveaux": [1, 2]},
    {"nom": "tours", "chemin": ["tours"], "niveaux": [6, 7]},
]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1.0}}
PLAN = {"cycle": "essai", "maquette": "v0.3", "graine": 3, "espace": ESPACE,
        "bots_glouton": [G1], "tables_glouton": [{"liste": [["oiseaux", "insectes"], ["reptiles", "humains", "entites"]], "parties": 2}],
        "tables_fort": [["oiseaux", "insectes"], ["mammiferes", "reptiles", "humains"]],
        "criblage": {"trajectoires": 2, "retenir": 3},
        "exploration": {"population": 3, "generations_max": 2},
        "confirmation": {"candidats": 3, "parties": [1, 1], "garder": [2, 2]},
        "controle": {"finalistes": 1, "parties": 1},
        "bot_fort": G1, "bot_controle": {"type": "glouton", "params": {"reves_par_tour": 0.5}}}


def test_variante_et_patch():
    assert variante_de([0, 0, 0, 0], ESPACE) == "defaut"
    v = variante_de([1, 2, 0, 1], ESPACE)
    assert v.startswith("patch:") and patch_de([1, 2, 0, 1], ESPACE) == {"regles": {"cercle_par_joueur": 2, "lunes": "n-1"}, "tours": 7}
    m = charger("v0.3", v)
    assert m["regles"]["lunes"] == "n-1" and m["tours"] == 7
    assert nb_par_table([3, 2, 0, 0], ESPACE) == 2 and MAX_PAR_TABLE == 4


def test_trajectoires_de_morris():
    """Chaque pas d'une trajectoire change exactement une variable, et chacune une fois."""
    for t in trajectoires(ESPACE, 3, random.Random(1), "v0.3"):
        assert len(t) == len(ESPACE) + 1
        changees = [next(i for i in range(len(a)) if a[i] != b[i]) for a, b in zip(t, t[1:])]
        assert sorted(changees) == list(range(len(ESPACE)))


def test_scores():
    """Durée : 1 jusqu'à 20 % de fins avant la mi-partie, 0 à 40 % (A9). Difficulté : 1 entre 50 et 80 % de forêt."""
    assert score_duree(10) == 1 and score_duree(30) == 0.5 and score_duree(45) == 0
    assert score_difficulte(65) == 1 and score_difficulte(35) == 0 and score_difficulte(95) == 0
    assert abs(score_difficulte(87.5) - 0.5) < 1e-9


def _etape(plan, etat, tmp):
    camp = preparer(plan, etat)
    e = lire_json(os.path.join(etat, "etat.json"))
    if camp is None:
        return e, None
    syn, _ = lancer(camp, sortie=str(tmp / camp["nom"]), processus=1, bavard=False)
    e = integrer(plan, etat, syn)
    ecrire_json(os.path.join(etat, "etat.json"), e)
    return e, camp


def test_cycle_complet(tmp_path):
    """Criblage, exploration (deux générations), confirmation (deux manches), contrôle, boucles, puis rapport :
    l'état avance seul d'une étape à l'autre, et le rapport porte les alertes et les tableaux."""
    etat = str(tmp_path / "etat")
    os.makedirs(etat)
    vues = []
    for _ in range(10):
        e = lire_json(os.path.join(etat, "etat.json"))
        if e and e["etape"] == "rapport":
            break
        e, camp = _etape(PLAN, etat, tmp_path)
        vues.append(camp["nom"])
    assert vues[0] == "essai_criblage" and vues[1] == "essai_exploration_g1"
    assert "essai_confirmation_m1" in vues and "essai_confirmation_m2" in vues and vues[-2] == "essai_controle_m1"
    assert vues[-1] == "essai_boucles"          # garde-fou C1 (14 oct.), lecture seule : entre le contrôle et le rapport
    cr = lire_json(os.path.join(etat, "criblage.json"))
    assert len(cr["retenues"]) == 3 and set(cr["rangs"]) <= {v["nom"] for v in ESPACE}
    assert lire_json(os.path.join(etat, "archive.json"))
    txt = rapport(PLAN, etat)
    assert "Alertes de conception" in txt and "Criblage" in txt and "Contrôle" in txt
    assert "aucune boucle gagnante" in txt and lire_json(os.path.join(etat, "boucles.json"))
    assert isinstance(alertes(PLAN, etat), list)


def test_metriques_meilleur_bot():
    """À chaque taille de table, on garde le bot (le rythme de rêve) qui garde le plus de forêt."""
    pc = {"colonnes": ["campagne", "variante", "bot", "peuples", "graine", "foret_pct", "tour", "fin", "cartes_en_reve",
                       "tours_max", "bot_params"],
          "lignes": [["b", "defaut", "glouton", "a+b", 0, 60.0, 6, "nuit", 0, 6, "r0"],
                     ["b", "defaut", "glouton", "a+b", 0, 90.0, 2, "reveil", 3, 6, "r1"],
                     ["b", "defaut", "glouton", "a+b+c", 0, 70.0, 6, "nuit", 0, 6, "r0"]]}
    m = metriques_variantes(pc)["defaut"]
    assert m["tailles"]["2"]["foret"] == 90.0 and m["tailles"]["2"]["precoces"] == 100.0
    assert m["score_duree"] == 0 and m["qualite"] == 0
