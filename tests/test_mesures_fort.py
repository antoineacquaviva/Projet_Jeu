"""Étape 3.3 : les quatre mesures qui attendaient le bot fort (tape-taupe, gain du bot libre,
dilemmes, chef unique), le réglage « juger » du bot MC et le programme « mesures3 »."""
import pytest

from foret import batterie as B
from foret.bots import fabriquer
from foret.maquette import charger
from foret.mesures import (MESURES, chef_depuis_synthese, chef_unique, classer_decision, coordination_depuis_synthese,
                           gain_libre, part_dilemmes, tape_taupe, verdict)
from foret.moteur import Partie


# ------------------------------------------------------------------ fonctions pures
def test_tape_taupe_ecart_au_meilleur_taux_du_glouton():
    """[mesure:tape_taupe] Écart en points entre le bot fort et le glouton à son meilleur taux."""
    r = tape_taupe([90, 92, 94], {0.0: [70, 72, 74], 1.0: [78, 80, 82]})
    assert r["taux_taupe"] == 1.0 and r["ecart"] == pytest.approx(12)
    assert r["verdict"] == "vert"
    assert tape_taupe([80, 81], {0.0: [79, 80]})["verdict"] == "rouge"     # < 3 points : parer suffit


def test_gain_libre_sur_le_meilleur_taux_fixe():
    """[mesure:gain_libre] 100 (libre - meilleur fixe) / meilleur fixe."""
    r = gain_libre([84, 84], {0.0: [70, 70], 0.5: [80, 80], 1.0: [75, 75]})
    assert r["taux"] == 0.5 and r["gain"] == pytest.approx(5)
    assert r["verdict"] == "vert"
    assert gain_libre([80, 80], {0.0: [80, 80]})["verdict"] == "rouge"


def test_chef_unique_bandes():
    """[mesure:chef] Vert de 5 à 20 %, rouge sous 2 % (solitaire à plusieurs) ou au-dessus de 35 %."""
    assert chef_unique([90, 90], [80, 80])["gain"] == pytest.approx(12.5)
    assert chef_unique([90, 90], [80, 80])["verdict"] == "vert"
    assert chef_unique([81, 81], [80, 80])["verdict"] == "rouge"
    assert chef_unique([90, 90], [60, 60])["verdict"] == "rouge"
    assert verdict("chef", 3) == "orange"


def test_classer_une_decision():
    """[mesure:dilemmes] Forcée, indifférente, dilemme, évidente (plan d'action, qualité des choix)."""
    assert classer_decision([80]) == "forcee"
    assert classer_decision([80, 81, 79]) == "indifferente"          # tout tient en moins de 3 points
    assert classer_decision([90, 89.5, 80]) == "dilemme"             # deux options proches, nettement au-dessus de la pire
    assert classer_decision([90, 85, 80]) == "evidente"              # une option écrase les autres


def test_part_des_dilemmes_hors_mise_en_place():
    """[mesure:dilemmes] Part parmi les décisions non forcées ; la mise en place et les traces sont à part."""
    j = [{"type": "action", "valeurs": [90, 89.5, 80]}, {"type": "action", "valeurs": [90, 80]},
         {"type": "aller", "valeurs": [80, 80.5]}, {"type": "presence", "valeurs": [90, 89.9, 70]},
         {"type": "trace", "valeurs": [80, 80, 80]}]
    r = part_dilemmes(j)
    assert r["decisions"] == 3 and r["part"] == pytest.approx(100 / 3)
    assert r["classes"] == {"dilemme": 33.3, "evidente": 33.3, "indifferente": 33.3}
    assert r["par_type"]["presence"]["dilemme"] == 100.0
    assert r["verdict"] == "vert"


def _syn(detail):
    return {"detail": {f"{bloc} | {var} | mc | {{}}": {"foret_pct": m, "foret_pct_ic95": 1.0}
                       for (bloc, var), m in detail.items()}}


def test_chef_et_coordination_depuis_une_synthese_de_campagne():
    """[mesure:chef] [mesure:coordination] Campagne à blocs « soi » (trois communications) et « central »."""
    s = _syn({("soi", "comm_aucun_signe"): 80, ("soi", "defaut"): 84, ("soi", "comm_tout_dire"): 90,
              ("central", "defaut"): 92})
    ch = chef_depuis_synthese(s)
    assert ch["gain"] == pytest.approx(100 * 8 / 84, abs=0.01) and ch["verdict"] == "vert"
    assert chef_depuis_synthese(s, "comm_tout_dire")["verdict"] == "orange"
    co = coordination_depuis_synthese(s)
    assert co["part"] == pytest.approx(40) and co["verdict"] == "vert"
    assert chef_depuis_synthese(_syn({("soi", "defaut"): 80})) is None


def test_les_mesures_du_bot_fort_ont_bandes_et_temoins():
    """Plus aucune mesure n'attend le bot fort : chacune a ses bandes et un témoin."""
    for m in ("tape_taupe", "gain_libre", "dilemmes", "chef"):
        assert MESURES[m]["bot"] != "fort" and "vert" in MESURES[m] and MESURES[m]["temoins"]


# ------------------------------------------------------------------ le bot MC qui juge
def test_le_bot_mc_juge_ses_decisions():
    """[mesure:dilemmes] Avec juger=1, chaque décision cherchée est jugée : une valeur par option."""
    m = charger("v1")
    bots = [fabriquer({"type": "mc", "params": {"budget": 2, "max_options": 3, "juger": 1.0, "suites_juge": 1}}, k)
            for k in range(2)]
    Partie(m, ["oiseaux", "insectes"], bots, graine=3).jouer()
    j = bots[0].jugements
    assert j and all(2 <= len(x["valeurs"]) <= 3 for x in j)
    assert all(0 <= v <= 100 for x in j for v in x["valeurs"])
    assert bots[0].stats["recherches"] == len(j)


def test_sans_juger_le_bot_mc_ne_change_pas():
    """Le réglage juger=0 (défaut) ne tire aucun nombre de plus : mêmes parties qu'avant."""
    m = charger("v1")
    res = []
    for params in ({"budget": 2, "max_options": 3}, {"budget": 2, "max_options": 3, "juger": 0.0}):
        bots = [fabriquer({"type": "mc", "params": params}, k) for k in range(2)]
        res.append(Partie(m, ["oiseaux", "insectes"], bots, graine=5).jouer()["resultat"])
    assert res[0] == res[1]


def test_temoin_sans_reve_aucune_carte_en_reve():
    """Témoin du gain du bot libre : la limite de rêves à 0 interdit de programmer un rêve."""
    m = charger("v1", "temoin_sans_reve")
    bots = [fabriquer({"type": "glouton", "params": {"reves_par_tour": 1.0}}, k) for k in range(2)]
    b = Partie(m, ["oiseaux", "insectes"], bots, graine=1).jouer()
    assert b["cartes_en_reve"] == 0


# ------------------------------------------------------------------ le programme mesures3
def test_le_programme_mesures3():
    t = B.taches("m3_v1")
    exps = {x["exp"] for x in t}
    assert exps == {"tables", "taupe", "dilemmes"}
    assert all(x["bots"][0]["type"] == "glouton" for x in t if x["exp"] == "taupe")
    assert {tuple(x["peuples"]) for x in t if x["exp"] == "taupe" and len(x["peuples"]) == 3} == set(B.TRIOS3)
    assert all(x["bots"][0]["params"]["juger"] == B.JUGE3 for x in t if x["exp"] == "dilemmes")
    assert {x["etiquette"] for x in B.taches("m3_v1_sans_reve") if x["exp"] == "reves"} == \
        {"taux:0.0", "taux:0.5", "taux:1.0"}
    assert len(B.plan_complet([k for k in B.PLAN_M3 if k != "m3_v2r"])) == 1020
    assert set(B.PROGRAMMES) == {"phase1", "phase3", "mesures3", "p3"}   # p3 : protocole P3 (étape a.3)


@pytest.fixture
def mesures3(monkeypatch, tmp_path):
    """Le programme réduit à trois peuples et un MC minuscule, pour que le test soit rapide."""
    mc = {"type": "mc", "params": {"budget": 2, "savoir": "soi", "max_options": 2, "suites_juge": 1}}
    monkeypatch.setattr(B, "PEUPLES", ["oiseaux", "insectes", "humains"])
    monkeypatch.setattr(B, "TAUX3", [0.0, 1.0])
    monkeypatch.setattr(B, "PLAN_M3", {"essai_m3": ("v1", "defaut", mc, ("tables_duos", "taupe_duos", "reves_duos",
                                                                         "dilemmes"), 2)})
    monkeypatch.setattr(B, "PROGRAMMES", dict(B.PROGRAMMES, mesures3=B.PLAN_M3))
    monkeypatch.setattr(B, "DOSSIER", str(tmp_path / "res"))
    return tmp_path


def test_le_programme_se_joue_et_se_mesure(mesures3):
    """[mesure:tape_taupe] [mesure:gain_libre] [mesure:dilemmes] Les trois mesures sortent du rapport."""
    B.executer("essai_m3", processus=2, bavard=False)
    c = B.evaluer_config("essai_m3")
    assert c["erreurs"] == 0
    assert c["tape_taupe"]["tables"] == 3 and c["tape_taupe"]["verdict"] in ("vert", "orange", "rouge")
    assert set(c["tape_taupe"]["glouton_par_taux"]) == {"0.0", "1.0"}
    assert c["gain_libre"]["tables"] == 3 and c["gain_libre"]["valeur"] is not None
    assert c["dilemmes"]["decisions"] > 0 and c["dilemmes"]["parties"] == 6


def test_les_mesures_du_bot_fort_ne_sortent_pas_avec_le_glouton():
    """Le glouton n'est pas le bot fort : ni tape-taupe ni gain du bot libre."""
    parties = [{"exp": "tables", "etiquette": "equipe", "peuples": ["a", "b"], "pct": 80},
               {"exp": "taupe", "etiquette": "taux:0.0", "peuples": ["a", "b"], "pct": 70},
               {"exp": "reves", "etiquette": "taux:0.0", "peuples": ["a", "b"], "pct": 70}]
    assert B.mesures_taupe(parties, B.G0) == {} and B.mesures_gain_libre(parties, B.G0) == {}
    assert B.mesures_taupe(parties, B.MC64)["tape_taupe"]["valeur"] == 10
