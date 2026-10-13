"""Jeu V0.4 (13 oct. 2026, 23 h 27) : adoptée par l'auteur à la fin du cycle 1 (ETAT.md, section 8 ;
projet/4-bilans/cycle-1-bilan.md, section 7, variante A).

[v0.4] = V0.3 + Cercle 4 cases par joueur à 2 et 3 joueurs, 3 à partir de 4 [v2:D2] ; 3 lunes [v2:D5] ;
sablier des rêves, 2 rêves pour un pas de l'esprit [v2:D1] ; ordres du Méchant 1 par étape à 2 et 3 joueurs,
2 à partir de 4 [v0.3:ordres] ; les 5 Machines en jeu au départ [v2:E2] ; escalade du soir dès le tour 5 [v2:A4].
Deux éléments propres au nombre de joueurs (au plus 4, décision du 13 oct., 14 h 31).
"""
import json

import pytest

from foret import charger, Partie
from foret.sim import fabriquer_table

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1}}
CODE_V04 = "c:A2a,d_fav,C2a,D2v_choix|m:C3,D5,A4|p:escalade=5,lunes=3"
HORS_ATELIER = {"cercle_par_joueur": {"2": 4, "4": 3}, "machines_en_jeu": 5,
                "ordres_par_etape": {"2": 1, "4": 2}, "reves_par_pas": 2}
# la variante A du cycle 1, telle que jouée par le pipeline (cycles/c1/rapport.md)
PATCH_C1_A = {"regles": {"cercle_par_joueur": {"2": 4, "4": 3}, "escalade": 5, "lunes": 3, "machines_en_jeu": 5,
                         "ordres_par_etape": {"2": 1, "4": 2}, "reves_par_pas": 2}}
CLES = ("regles", "piste", "tuiles", "machines", "cartes", "presence", "pouvoirs", "tours", "etapes", "plateau")


def table(m, n, graine=1):
    return Partie(m, PEUPLES[:n], fabriquer_table(G1, n, graine * 100), graine=graine)


def test_v04_egale_la_variante_adoptee():
    """[v0.4] La maquette v0.4 est exactement la variante A du cycle 1, adoptée par l'auteur le 13 oct."""
    a, b = charger("v0.4"), charger("v0.3", "patch:" + json.dumps(PATCH_C1_A))
    assert a["atelier"] == CODE_V04
    for k in CLES:
        assert a[k] == b[k], k


def test_v04_egale_code_atelier_plus_reglages():
    """[v0.4] [v2:A4] Code d'atelier (module A4, escalade 5, 3 lunes) plus les quatre réglages hors atelier."""
    a, c = charger("v0.4"), charger("v2", "code:" + CODE_V04)
    for k in CLES:
        if k != "regles":
            assert a[k] == c[k], k
    diff = {k for k in a["regles"] if a["regles"][k] != c["regles"].get(k)}
    assert diff == set(HORS_ATELIER)
    for k, v in HORS_ATELIER.items():
        assert a["regles"][k] == v


def test_v04_reglages_communs():
    """[v2:D5] 3 lunes ; [v2:A4] escalade dès le tour 5 ; [v2:D1] 2 rêves pour un pas ; [v2:E2] 5 Machines ;
    inchangés : 6 tours, 5 cartes, 2 traces (D8)."""
    m = charger("v0.4")
    r = m["regles"]
    assert r["lunes"] == 3 and r["escalade"] == 5 and r["reves_par_pas"] == 2 and r["machines_en_jeu"] == 5
    assert m["tours"] == 6 and m["cartes"]["main"] == 5 and r["traces_par_joueur"] == 2


@pytest.mark.parametrize("n, cercle, ordres", [(2, 4, 1), (3, 4, 1), (4, 3, 2), (5, 3, 2), (6, 3, 2)])
def test_v04_elements_propres_a_la_table(n, cercle, ordres):
    """[v0.4] Tableau du livret : cases du Cercle par joueur 4/4/3/3/3 ; ordres par étape 1/1/2/2/2."""
    p = table(charger("v0.4"), n)
    assert p.capacite_cercle() == cercle * n
    assert p.R["ordres_par_etape"] == ordres
    assert sum(1 for x in p.machines if x.zone) == 5


def test_v04_au_plus_quatre_elements_par_table():
    """Décision de l'auteur du 13 oct., 14 h 31 : au plus 4 éléments propres au nombre de joueurs."""
    from foret.maquette import est_par_table, PAR_TABLE
    m = charger("v0.4")
    n = 0
    for chemin in PAR_TABLE:
        o = m
        for k in chemin:
            o = o.get(k) if isinstance(o, dict) else None
        n += bool(o is not None and est_par_table(o))
    assert n == 2


def test_v04_sans_variante_sans_lunes():
    """La variante « sans_lunes » de la V0.3 n'a pas de sens sur la V0.4 : elle n'est pas héritée."""
    assert "sans_lunes" not in charger("v0.4")["variantes"]
    assert charger("v0.4", "temoin_une_tactique")["regles"]["lunes"] == 3


@pytest.mark.parametrize("n", [2, 3, 4, 5, 6])
def test_v04_se_joue_de_2_a_6_joueurs(n):
    """[v0.4] La V0.4 se joue jusqu'au bout à toutes les tailles de table (plan vers la V1, section 7 bis)."""
    m = charger("v0.4")
    for g in range(2):
        r = table(m, n, g + 1).jouer()
        assert r["fin"] in ("sommeil", "reveil", "nuit")
        assert 0 <= r["foret"] <= r["foret_initiale"]
