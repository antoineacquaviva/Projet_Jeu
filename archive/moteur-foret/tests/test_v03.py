"""Jeu V0.3 (13 oct. 2026) : la v2 fixée par l'auteur (décision 3.7, ETAT.md section 8).

[v0.3] = « V2 proposée » (maquettes/v2.json) + le module des lunes [v2:D5], 2 lunes, à toutes les
tailles de table. Code d'atelier : c:A2a,d_fav,C2a,D2v_choix|m:C3,D5|p:.
"""
import pytest

from foret import charger, Partie
from foret.sim import fabriquer_table

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
CODE_V03 = "c:A2a,d_fav,C2a,D2v_choix|m:C3,D5|p:"
CLES = ("regles", "piste", "tuiles", "machines", "cartes", "presence", "pouvoirs", "tours", "etapes", "plateau")


def test_v03_egale_le_code_de_l_atelier():
    """[v0.3] [v2:D5] La maquette v0.3 est exactement le code d'atelier fixé le 13 oct. (V2 proposée + lunes)."""
    a, b = charger("v0.3"), charger("v2", "code:" + CODE_V03)
    assert a["atelier"] == CODE_V03
    for k in CLES:
        assert a[k] == b[k], k


def test_v03_deux_lunes_un_reve_par_joueur():
    """[v2:D5] [v2:D1] Deux lunes au conseil ; seul un joueur qui tient une lune rêve, une carte au plus."""
    r = charger("v0.3")["regles"]
    assert r["lunes"] == 2
    assert r["reves_par_joueur_et_tour"] == 1 and r["reves_par_tour_table"] is None


def test_v03_sans_lunes_egale_v2_proposee():
    """[v0.3] La variante « sans_lunes » redonne « V2 proposée » (maquettes/v2.json), pour comparer."""
    a, b = charger("v0.3", "sans_lunes"), charger("v2")
    for k in CLES:
        assert a[k] == b[k], k


def test_v03_herite_des_variantes_v2():
    """Les témoins de la v2 restent disponibles sur la V0.3 (héritage des variantes)."""
    m = charger("v0.3", "temoin_une_tactique")
    assert m["regles"]["lunes"] == 2
    assert set(m["piste"]["disposition"]) == {"Cupidite"}


@pytest.mark.parametrize("n", [2, 3, 4, 5, 6])
def test_v03_se_joue_de_2_a_6_joueurs(n):
    """[v0.3] Critère du 13 oct. (plan vers la V1, section 7 bis) : la V0.3 se joue jusqu'au bout à toutes
    les tailles de table, de 2 à 6 joueurs."""
    m = charger("v0.3")
    for g in range(3):
        bots = fabriquer_table({"type": "glouton", "params": {"reves_par_tour": 1}}, n, g * 100)
        r = Partie(m, PEUPLES[:n], bots, graine=g).jouer()
        assert r["fin"] in ("sommeil", "reveil", "nuit")
        assert 0 <= r["foret"] <= r["foret_initiale"]
