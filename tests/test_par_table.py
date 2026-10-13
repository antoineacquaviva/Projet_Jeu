"""Valeurs par taille de table et avance de l'esprit (plan vers la V1, étape 0.4 ; section 7 bis).

[v2:D1] reves_par_pas : il faut k rêves vers le sommeil pour un pas de l'esprit (1 = la règle R5.3).
Valeurs par taille de table : nombre, dict {"2": …} ou formule « n-1 » (foret/maquette.py, PAR_TABLE).
"""
import pytest

from foret import charger, Partie, ErreurMaquette
from foret.maquette import valeur_table, est_par_table, resoudre_table
from foret.sim import fabriquer_table
from tests.outils import Scripte

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1}}


def table(m, n, graine=1):
    return Partie(m, PEUPLES[:n], fabriquer_table(G1, n, graine * 100), graine=graine)


def test_valeur_table_formes():
    assert valeur_table(2, 5) == 2 and valeur_table(None, 3) is None
    assert valeur_table("n-1", 4) == 3 and valeur_table("n", 2) == 2 and valeur_table("n+1", 6) == 7
    assert valeur_table("n-3", 2) == 0                           # ramené à 0 au moins
    d = {"2": 1, "4": 2, "6": 3}
    assert [valeur_table(d, n) for n in range(1, 7)] == [1, 1, 1, 2, 2, 3]   # taille inférieure la plus proche
    assert est_par_table("n - 1") and not est_par_table("deux") and not est_par_table({"7": 1})


def test_lunes_une_de_moins_que_de_joueurs():
    """Plan vers la V1, 7 bis (accord de l'auteur du 13 oct.) : les lunes selon la taille de la table, par
    exemple une de moins que de joueurs."""
    m = charger("v0.3", 'regles:lunes="n-1"')
    for n in range(2, 7):
        p = table(m, n)
        assert p.R["lunes"] == n - 1
        p.jouer()


def test_maquette_sans_valeur_par_table_inchangee():
    """Sans valeur par taille de table, la maquette n'est pas recopiée (partage avec les copies du bot fort)."""
    m = charger("v0.3")
    assert resoudre_table(m, 4) is m


def test_cercle_et_main_par_table():
    m = charger("v0.3", 'regles:cercle_par_joueur={"2":4,"5":3}')
    assert table(m, 2).capacite_cercle() == 8 and table(m, 4).capacite_cercle() == 16
    assert table(m, 6).capacite_cercle() == 18
    m2 = charger("v0.3")
    m2 = dict(m2, cartes=dict(m2["cartes"], main={"2": 6, "4": 5}))
    assert all(len(s.main) == 6 for s in table(m2, 3).sieges)
    assert all(len(s.main) == 5 for s in table(m2, 5).sieges)


def test_valeur_invalide_a_une_taille_refusee():
    """La validation porte sur chaque taille de table : « n-1 » cases de Cercle par joueur est invalide en solo."""
    with pytest.raises(ErreurMaquette, match="1 joueurs"):
        charger("v0.3", 'regles:cercle_par_joueur="n-1"')


def test_reves_par_pas_retarde_l_esprit():
    """[v2:D1] reves_par_pas = 2 : le premier rêve vers le sommeil ne fait rien bouger, le second fait
    entrer l'esprit en 12 (R5.3)."""
    m = charger("v0.3", "regles:reves_par_pas=2")
    p = Partie(m, ["oiseaux", "insectes"], [Scripte(), Scripte()], graine=1)
    p.tour, p.etape = 1, 1
    s = p.sieges[0]
    p.faire_rever(s, "carte")
    assert p.esprits() == [] and p.sablier == 1
    p.faire_rever(s, "carte")
    assert p.esprits() == [12] and p.sablier == 0


def test_reves_par_pas_un_egale_la_regle():
    """[v2:D1] reves_par_pas = 1 (défaut) : chaque rêve vers le sommeil fait entrer ou avancer un esprit (R5.3)."""
    assert charger("v0.3")["regles"]["reves_par_pas"] == 1
    p = Partie(charger("v0.3"), ["oiseaux", "insectes"], [Scripte(), Scripte()], graine=1)
    p.tour, p.etape = 1, 1
    p.faire_rever(p.sieges[0], "carte")
    assert p.esprits() == [12]


@pytest.mark.parametrize("n", [2, 3, 4, 5, 6])
def test_reglages_freins_jouables(n):
    """Les réglages qui freinent le rêve se jouent jusqu'au bout à toutes les tailles de table."""
    m = charger("v0.3", 'regles:lunes="n-1",reves_par_pas=2')
    r = table(m, n).jouer()
    assert r["fin"] in ("sommeil", "reveil", "nuit")


def test_ordres_par_etape():
    """Plan vers la V1, 7 bis : ordres_par_etape = 2, le Méchant donne un ordre de plus à chaque étape, avec
    des dés neufs (ni présage, ni Voir, ni Hanter, ni embuscade ; les barrages de l'étape, si)."""
    m1, m2 = charger("v0.3"), charger("v0.3", "regles:ordres_par_etape=2")
    r1, r2 = table(m1, 4).jouer(), table(m2, 4).jouer()
    assert r2["stats"].get("ordres_supplementaires", 0) > 0
    assert "ordres_supplementaires" not in r1["stats"]


def test_ordres_par_etape_par_table():
    m = charger("v0.3", 'regles:ordres_par_etape={"2":1,"5":2}')
    assert table(m, 3).R["ordres_par_etape"] == 1 and table(m, 6).R["ordres_par_etape"] == 2


def test_machines_en_jeu():
    """[v2:E2] machines_en_jeu : les premières Machines de la réserve entrent en jeu au départ, par leur zone
    d'entrée ; null = la maquette (3 en jeu, 2 au chantier)."""
    p = table(charger("v0.3"), 2)
    assert sum(1 for x in p.machines if x.zone) == 3
    p5 = table(charger("v0.3", 'regles:machines_en_jeu={"2":3,"5":5}'), 5)
    en_jeu = [x for x in p5.machines if x.zone]
    assert len(en_jeu) == 5
    assert {x.nom: x.zone for x in en_jeu}["Tonton Débard"] == "Z1"
    p5.jouer()
    p2 = table(charger("v0.3", "regles:machines_en_jeu=2"), 2)
    assert sum(1 for x in p2.machines if x.zone) == 2
