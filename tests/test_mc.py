"""Bot Monte-Carlo (moteur 1.7, phase 2) : il joue n'importe quelle maquette, de façon reproductible,
et sa répartition du budget garde la meilleure option."""
import pytest

from foret.bots import fabriquer
from foret.bots.mc import MonteCarlo
from foret.maquette import charger
from foret.moteur import Partie


def _partie(maquette, budget, graine=3, peuples=("oiseaux", "insectes")):
    bots = [fabriquer({"type": "mc", "params": {"budget": budget}}, graine * 100 + i) for i in range(len(peuples))]
    return Partie(charger(maquette, "defaut"), list(peuples), bots, graine=graine), bots


@pytest.mark.parametrize("maquette", ["v1", "v2"])
def test_le_bot_mc_joue_une_partie_entiere(maquette):
    p, bots = _partie(maquette, 2)
    assert p.reprises                      # photo à chaque segment : copies rapides
    b = p.jouer()
    assert 0 <= b["foret"] <= b["foret_initiale"]
    assert sum(bot.stats["recherches"] for bot in bots) > 0


def test_le_bot_mc_est_reproductible():
    a = _partie("v1", 2, graine=5, peuples=("reptiles", "humains"))[0].jouer()
    b = _partie("v1", 2, graine=5, peuples=("reptiles", "humains"))[0].jouer()
    assert (a["foret"], a["fin"], a["tour"]) == (b["foret"], b["fin"], b["tour"])


def test_le_halving_garde_la_meilleure_option(monkeypatch):
    bot = MonteCarlo(0, budget=16)
    valeurs = {0: 0.40, 1: 0.55, 2: 0.70, 3: 0.52, 4: 0.10}
    monkeypatch.setattr(bot, "_suite", lambda partie, i, hasard: valeurs[i])
    assert bot._halving(None, list(valeurs)) == 2


def test_le_halving_compare_les_options_sur_les_memes_des(monkeypatch):
    bot = MonteCarlo(0, budget=12)
    vus = {}
    monkeypatch.setattr(bot, "_suite", lambda partie, i, hasard: vus.setdefault(i, []).append(hasard) or 0.5)
    bot._halving(None, [0, 1, 2])
    assert vus[0][:len(vus[2])] == vus[2][:len(vus[0])]    # nombres aléatoires communs, tour par tour


def test_savoir_autre_que_tout_refuse_pour_l_instant():
    with pytest.raises(ValueError):
        MonteCarlo(0, savoir="soi")
