"""Protocole P3 (plan vers la V1, étape a.3, 14 oct. 2026) : la V0.4 et son ancre V0.3 sous le bot fort MC64R,
avec les mesures des objectifs 1 à 3 (tape-taupe, taux de rêve fixe, gain du bot libre, duos, Shapley)."""
import foret.batterie as B
from foret.maquette import charger


def test_plan_p3_deux_maquettes_et_bot_fort():
    assert set(B.PLAN_P3) == {"pro3_v04", "pro3_v03"}
    assert B.PLAN_P3["pro3_v04"][0] == "v0.4"
    assert B.PLAN_P3["pro3_v03"][0] == "v0.3"           # l'ancre
    for nom, (mq, var, bot, exps, n) in B.PLAN_P3.items():
        assert bot == B.MC64R                            # bot fort de la V0.4 (campagne 18)
        assert set(exps) == set(B.PROTO3_EXPS)
        charger(mq, var)                                 # la maquette existe et se charge


def test_programme_p3_accessible_par_la_batterie():
    assert B.PROGRAMMES["p3"] is B.PLAN_P3
    assert B._config("pro3_v04")[0] == "v0.4"
    assert len(B.plan_complet(list(B.PLAN_P3))) == 1336


def test_taches_p3_contiennent_les_mesures_des_objectifs_1_a_3():
    taches = B.taches("pro3_v04", echelle=0.1)
    etiquettes = {t["exp"] for t in taches}
    assert {"tables", "spectateur", "reves", "taupe"} <= etiquettes
    # tape-taupe : glouton à taux fixes contre les 15 duos et les 5 trios
    taux = {t["etiquette"] for t in taches if t["exp"] == "taupe"}
    assert taux == {"taux:0.0", "taux:0.5", "taux:1.0"}
