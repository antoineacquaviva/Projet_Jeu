"""Tests du modèle « placement » (docs/regles_placement.md). Chaque test cite la règle qu'il vérifie."""
import json
import os
import random

import pytest

from placement.regles import (Params, Plateau, Etat, RIEN, GARDER, ALLER, SABOTER, POSTER, destination,
                              jouer_tour, appliquer_programme, executer, ordres_possibles, mise_en_place)
from placement.partie import jouer_partie, plateau
from placement.bots import fabriquer_gentil, fabriquer_mechant, Omniscient
from placement import campagne, analyse

BOTS = ["aleatoire", "sentinelle", "marquage", "regroupement", "reflexe", "glouton", "oracle",
        {"type": "glouton", "params": {"aveugle": True}},
        {"type": "mc", "params": {"budget": 24, "horizon": 2}}]


def petit():
    return Params(largeur=4, hauteur=4, arbres=2, machines=2, individus=2, n=3, k=2, tours=4, annonces=4)


def test_p6_validation():
    """P6 : k < n, k <= individus, m = 0 ou m >= n, forêt initiale > n x t (r > 0 garanti, P5.2)."""
    Params().valider()
    with pytest.raises(ValueError):
        Params(n=2, k=2).valider()
    with pytest.raises(ValueError):
        Params(individus=1, k=2).valider()
    with pytest.raises(ValueError):
        Params(annonces=2, n=3).valider()
    with pytest.raises(ValueError):
        Params(largeur=3, hauteur=3, arbres=1, n=3, tours=8).valider()


@pytest.mark.parametrize("bot", BOTS)
def test_p5_borne_de_perte_et_foret_restante(bot):
    """P5.1 : n - k <= perte du tour <= n, perte = n - parades ; P5.2 : r > 0. Vérifiés par assertion dans
    jouer_partie, sur plusieurs variantes de règles."""
    variantes = [petit(), petit().avec(sabotage="fige"), petit().avec(sabotage="allie", voisinage=8),
                 petit().avec(aller_garder=True, portee=2), petit().avec(annonces=0),
                 petit().avec(garde_portee=1, profil="bosquets", entree="bords")]
    for p in variantes:
        for g in range(3):
            st = jouer_partie(p.valider(), fabriquer_gentil(bot), "hasard", g)
            assert all(p.n - p.k <= x <= p.n for x in st["pertes"])
            assert st["r"] == st["c0"] - p.n * p.tours + st["parades"]
            assert st["r"] > 0


def test_graines_appariees():
    """Le hasard du jeu ne dépend pas du bot : mêmes annonces et mêmes tirages pour deux bots (appariement)."""
    p = Params()
    j1, j2 = [], []
    jouer_partie(p, fabriquer_gentil("aleatoire"), "hasard", 5, journal=j1)
    jouer_partie(p, fabriquer_gentil("glouton"), "hasard", 5, journal=j2)
    assert [t["annonces"] for t in j1] == [t["annonces"] for t in j2]
    st1 = jouer_partie(p, fabriquer_gentil("glouton"), "hasard", 5)
    st2 = jouer_partie(p, fabriquer_gentil("glouton"), "hasard", 5)
    assert st1["parades"] == st2["parades"]


def _etat_ligne():
    # plateau 3 x 1 : cases 0 - 1 - 2
    p = Params(largeur=3, hauteur=1, arbres=9, machines=1, individus=2, n=2, k=1, tours=1, annonces=2)
    pl = Plateau(p)
    return p, pl


def test_p4_tactiques():
    """P4.3 : cupidité = la plus boisée du rayon ; opportunisme = la moins défendue ; représailles = la plus
    défendue ; percée = vers le cœur."""
    p, pl = _etat_ligne()
    e = Etat([3, 1, 5], [1], [0, 0])
    assert destination(p, pl, e, 0, "cupidite")[0] == 2
    assert destination(p, pl, e, 0, "percee")[0] == 1
    assert destination(p, pl, e, 0, "represailles")[0] == 0
    assert destination(p, pl, e, 0, "opportunisme")[0] == 2


def test_p4_repli():
    """P4.4 : sans arbre dans le rayon, la Machine vise la case boisée la plus proche."""
    p = Params(largeur=5, hauteur=1, arbres=9, machines=1, individus=1, n=2, k=1, tours=1, annonces=2)
    pl = Plateau(p)
    e = Etat([0, 0, 0, 0, 2], [0], [0])
    c, repli = destination(p, pl, e, 0, "cupidite")
    assert (c, repli) == (4, True)


def test_p3_garde_une_seule_parade():
    """P3.2 et P4.6 : une garde pare la première menace sur sa case, une seule ; la Machine n'entre pas."""
    p, pl = _etat_ligne()
    e = Etat([3, 1, 5], [1], [2, 0])
    g, s = appliquer_programme(p, pl, e, [(GARDER, 2), (RIEN, None)])
    pare = executer(p, pl, e, [(0, "cupidite"), (0, "cupidite")], g, s)
    assert pare == 1
    assert e.arbres == [3, 1, 4] and e.machines == [2]


def test_p4_sabotage_echappe_et_fige():
    """P4.5 : le sabotage pare la première menace de la Machine ; « échappe » : elle avance sans abattre ;
    « fige » : elle reste."""
    for mode, case in (("echappe", 2), ("fige", 1)):
        p, pl = _etat_ligne()
        p = p.avec(sabotage=mode)
        e = Etat([3, 1, 5], [1], [1, 0])
        g, s = appliquer_programme(p, pl, e, [(SABOTER, 0), (RIEN, None)])
        pare = executer(p, pl, e, [(0, "cupidite")], g, s)
        assert pare == 1 and e.machines == [case] and sum(e.arbres) == 9


def test_p4_sabotage_allie():
    """P4.5 : avec « allié », il faut deux saboteurs pour une parade."""
    p, pl = _etat_ligne()
    p = p.avec(sabotage="allie", k=1)
    e = Etat([3, 1, 5], [1], [1, 1])
    g, s = appliquer_programme(p, pl, e, [(SABOTER, 0), (RIEN, None)])
    assert s == {}
    p2 = p.avec(n=3, k=2)
    g, s = appliquer_programme(p2, pl, e, [(SABOTER, 0), (SABOTER, 0)])
    assert s == {0: 1}


def test_p3_aller_ne_pare_pas_et_poster():
    """P3.2 : Aller déplace sans garder ; Poster (variante aller_garder) déplace puis garde."""
    p, pl = _etat_ligne()
    e = Etat([3, 1, 5], [1], [1, 0])
    g, _ = appliquer_programme(p, pl, e.copie(), [(ALLER, 2), (RIEN, None)])
    assert g == {}
    p2 = p.avec(aller_garder=True)
    f = e.copie()
    g, _ = appliquer_programme(p2, pl, f, [(POSTER, 2), (RIEN, None)])
    assert g == {2: 1} and f.individus[0] == 2
    assert (POSTER, 2) in ordres_possibles(p2, pl, e, 0)


def test_p3_garde_portee():
    """Variante garde_portee 1 : une garde pare aussi une menace sur une case voisine (une seule parade)."""
    p, pl = _etat_ligne()
    p = p.avec(garde_portee=1)
    e = Etat([3, 1, 5], [1], [1, 0])
    g, s = appliquer_programme(p, pl, e, [(GARDER, 1), (RIEN, None)])
    assert executer(p, pl, e, [(0, "cupidite"), (0, "cupidite")], g, s) == 1


def test_p3_au_plus_k_ordres():
    """P3.1 : au plus k ordres par tour."""
    p, pl = _etat_ligne()
    e = Etat([3, 1, 5], [1], [0, 2])
    with pytest.raises(ValueError):
        appliquer_programme(p, pl, e, [(GARDER, 0), (GARDER, 2)])


def test_mechant_omniscient_borne():
    """Le Méchant omniscient ne laisse jamais plus de parades que le Méchant au hasard (même programme)."""
    p = petit()
    pl = plateau(p)
    rng = random.Random(3)
    e = mise_en_place(p, pl, rng)
    g = fabriquer_gentil("glouton")
    e.individus = g.placer(p, pl, e, rng)
    from placement.regles import tirer_annonces
    for _ in range(10):
        ann = tirer_annonces(p, rng)
        prog = g.programme(p, pl, e, ann, rng)
        pire = Omniscient().choisir(p, pl, e, ann, prog, None, rng)
        v_pire = jouer_tour(p, pl, e.copie(), ann, prog, pire)
        for ex in ([0, 1, 2], [3, 2, 1], [1, 3, 0]):
            assert v_pire <= jouer_tour(p, pl, e.copie(), ann, prog, ex)


def test_adverse_beta_zero_egale_hasard():
    """Méchant adverse de force 0 = Méchant au hasard (le vrai jeu)."""
    p = petit()
    a = jouer_partie(p, fabriquer_gentil("reflexe"), "hasard", 11)
    b = jouer_partie(p, fabriquer_gentil("reflexe"), {"type": "adverse", "params": {"beta": 0}}, 11)
    assert a["parades"] == b["parades"]


def test_campagne_lots_et_fusion(tmp_path):
    """Les lots fusionnés donnent la même synthèse que la campagne jouée d'un bloc."""
    plan = {"nom": "t", "type": "voisinage", "graine": 3, "parties": 3, "base": {"tours": 4, "largeur": 4, "hauteur": 4},
            "espace": {"n": [4], "sabotage": ["fige"]},
            "bots": {"reflexe": "reflexe", "sentinelle": "sentinelle"}}
    chemin = tmp_path / "plan.json"
    chemin.write_text(json.dumps(plan))
    campagne.main([str(chemin), "--sortie", str(tmp_path / "bloc"), "--processus", "1"])
    for i in range(2):
        campagne.main([str(chemin), "--sortie", str(tmp_path / "lots"), "--lot", f"{i}/2", "--processus", "1"])
    campagne.main([str(chemin), "--sortie", str(tmp_path / "fus"), "--fusionner", str(tmp_path / "lots")])
    a = json.loads((tmp_path / "bloc" / "synthese.json").read_text())
    b = json.loads((tmp_path / "fus" / "synthese.json").read_text())
    assert set(a["variantes"]) == {"base", "n=4", "sabotage=\"fige\""}
    for vid in a["variantes"]:
        for bot in ("reflexe", "sentinelle"):
            assert a["variantes"][vid]["bots"][bot]["parades"] == b["variantes"][vid]["bots"][bot]["parades"]
    m = analyse.mesures(a["variantes"]["base"])
    assert "lecture" in m and m["score"] is not None


def test_plans_du_depot_valides():
    """Chaque plan campagnes/placement_*.json produit des variantes valides."""
    racine = os.path.join(os.path.dirname(__file__), "..", "campagnes")
    plans = [f for f in os.listdir(racine) if f.startswith("placement_") and f.endswith(".json")]
    assert plans
    for f in plans:
        with open(os.path.join(racine, f), encoding="utf-8") as fh:
            plan = json.load(fh)
        vs = campagne.variantes(plan)
        assert vs
        for d in vs.values():
            Params.depuis(d).valider()
