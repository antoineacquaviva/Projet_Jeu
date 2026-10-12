"""Décisions de l'auteur à la fin de la phase 1 (12 oct. 2026), qui touchent les règles.

B4 : deux cas que le moteur comptait comme incohérences sont permis par les règles
écrites, et comptés à part.
"""
from foret.bots import fabriquer
from foret.maquette import charger
from foret.moteur import Partie

from .outils import partie, machine, ordre


def test_r43_abat_en_chemin_si_la_cible_est_barree():
    """R4.3 (décision B4) : la zone visée est barrée, la Machine encore à deux pas fait un pas
    libre et abat là où elle s'arrête. Permis : compté à part, pas une incohérence."""
    p = partie()
    b = machine(p, "Bouteur")
    assert b.zone == "Z1"
    p.ee.barres = {"Z6"}
    avant = p.plateau.foret["Z4"]
    assert p.executer(ordre(p, "Cupidite", "Z6", b)) is True
    assert b.zone == "Z4" and p.plateau.foret["Z4"] == avant - 1
    assert p.compteur.comptes["incoherence"]["barrage_contourne"] == 0
    assert p.compteur.comptes["stat"]["coupe_en_chemin_cible_barree"] == 1


def test_r43_le_temoin_v0_garde_son_incoherence():
    """R4.3 : avec le barrage v0 (témoin), contourner reste une incohérence."""
    p = partie(maquette="v0")
    b = machine(p, "Bouteur")
    p.ee.barres = {"Z4"}
    p.executer(ordre(p, "Cupidite", "Z4", b))
    assert p.compteur.comptes["incoherence"]["barrage_contourne"] == 1


def test_r62_voir_detourne_permis():
    """R6.2 (décision B4) : un rêve de l'étape peut changer la tuile vue par les oiseaux ; c'est
    permis, compté « voir_detourne », jamais en incohérence."""
    m = charger("v1")
    vus = 0
    for g in range(40):
        bots = [fabriquer({"type": "glouton", "params": {"reves_par_tour": 1.0}}, g * 10 + i) for i in range(2)]
        b = Partie(m, ["oiseaux", "humains"], bots, graine=g).jouer()
        assert "voir_trahi" not in b["incoherences"]
        vus += b["stats"].get("voir_detourne", 0)
    assert vus > 0
