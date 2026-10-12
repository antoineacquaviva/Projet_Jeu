"""Tables mixtes et bot bruité (phase 2) : un bot par siège, et le coût d'un joueur faible."""
from foret.bots import fabriquer, fabriquer_table
from foret.bots.bruite import Bruite
from foret.bots.glouton import Glouton
from foret.maquette import charger
from foret.moteur import Partie
from foret.sim import jouer_une


def test_une_table_mixte_donne_un_bot_par_siege():
    spec = {"type": "table", "params": {"sieges": [{"type": "glouton"}, {"type": "aleatoire"}]}}
    bots = fabriquer_table(spec, 3, 500)
    assert [type(b).nom for b in bots] == ["glouton", "aleatoire", "glouton"]
    assert [b.graine for b in bots] == [500, 501, 502]


def test_un_bot_ordinaire_garde_ses_graines():
    assert [b.graine for b in fabriquer_table({"type": "glouton"}, 2, 300)] == [300, 301]


def test_bruit_nul_ne_change_rien():
    m = charger("v1", "defaut")
    a = Partie(m, ["oiseaux", "insectes"], [Glouton(10), Glouton(11)], graine=2).jouer()
    b = Partie(m, ["oiseaux", "insectes"], [Bruite(10, bruit=0.0), Bruite(11, bruit=0.0)], graine=2).jouer()
    assert (a["foret"], a["fin"], a["tour"]) == (b["foret"], b["fin"], b["tour"])


def test_une_campagne_joue_une_table_mixte():
    spec = {"type": "table", "params": {"sieges": [{"type": "glouton"},
                                                   {"type": "bruite", "params": {"bruit": 1.0}}]}}
    r = jouer_une(("essai", "v1", "defaut", spec, ("mammiferes", "humains"), 0))
    assert "erreur" not in r and r["bot"] == "table"
