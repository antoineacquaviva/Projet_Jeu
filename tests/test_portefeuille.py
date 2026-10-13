"""Bot à portefeuille et bot de contrôle (plan vers la V1, étapes 0.7 et 0.8)."""
import time

from foret import charger, Partie
from foret.bots import fabriquer
from foret.batterie import PORTEFEUILLE, MCP64, CONTROLE


def petit(portefeuille=PORTEFEUILLE[:3]):
    return {"type": "mc", "params": {"budget": 4, "savoir": "soi", "suites_choix": 2, "portefeuille": portefeuille}}


def test_portefeuille_choisit_une_politique_par_tour():
    """Étape 0.7 : au premier coup de chaque tour, le bot choisit une politique de son portefeuille ;
    le choix est compté dans les statistiques de la partie (portefeuille_<nom>)."""
    bots = [fabriquer(petit(), 10 + i) for i in range(2)]
    r = Partie(charger("v0.3"), ["oiseaux", "insectes"], bots, graine=3).jouer()
    choix = {k: v for k, v in r["stats"].items() if k.startswith("portefeuille_")}
    assert 2 * r["tour"] <= sum(choix.values()) <= 2 * (r["tour"] + 1)   # un choix par siège et par tour (mise en place comprise)
    assert all(k[len("portefeuille_"):] in {p["nom"] for p in PORTEFEUILLE[:3]} for k in choix)


def test_portefeuille_d_une_politique():
    """Un portefeuille d'une seule politique la choisit toujours (le bot est alors un MC avec cette politique,
    à ses tirages au sort près)."""
    pol = PORTEFEUILLE[2]
    r = Partie(charger("v0.3"), ["reptiles", "humains"], [fabriquer(petit([pol]), 5 + i) for i in range(2)],
               graine=4).jouer()
    choix = {k for k in r["stats"] if k.startswith("portefeuille_")}
    assert choix == {"portefeuille_" + pol["nom"]}


def test_bots_declares():
    """Étape 0.8 : le bot de contrôle a plus de suites et une politique de plus (bruitée) que le bot fort."""
    assert MCP64["params"]["budget"] == 64 and CONTROLE["params"]["budget"] == 256
    assert {p["nom"] for p in CONTROLE["params"]["portefeuille"]} > {p["nom"] for p in PORTEFEUILLE}
    fabriquer(MCP64, 1), fabriquer(CONTROLE, 1)
