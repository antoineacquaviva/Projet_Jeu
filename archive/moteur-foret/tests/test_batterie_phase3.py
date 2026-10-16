"""Le plan réduit de la phase 3 (décisions du 13 oct.) : seuls, duos, 5 trios, « personne »,
siège spectateur, taux de rêve fixes ; Shapley restreint aux tables de 1 et 2 peuples."""
import itertools

import pytest

from foret import batterie as B
from foret.mesures import shapley, shapley_restreint

# Le même plan, joué par le glouton pour que le test soit rapide.
ESSAI3 = {"essai_p3": ("v1", "defaut", B.G0, B.TOUT3, 2)}


@pytest.fixture
def plan3(monkeypatch, tmp_path):
    monkeypatch.setattr(B, "PLAN3", dict(B.PLAN3, **ESSAI3))
    monkeypatch.setattr(B, "DOSSIER", str(tmp_path / "res"))
    return tmp_path


def test_le_plan_reduit_contient_ce_qui_a_ete_decide():
    t = B.taches("p3_v1")
    equipes = {tuple(x["peuples"]) for x in t if x["exp"] == "tables" and x["etiquette"] == "equipe"}
    assert sum(1 for e in equipes if len(e) == 1) == 6
    assert sum(1 for e in equipes if len(e) == 2) == 15
    assert {e for e in equipes if len(e) == 3} == set(B.TRIOS3)
    assert all(x["bots"][0] == B.MC64 or x["bots"][0] == B.INERTE for x in t if x["exp"] == "tables")
    assert all(x.get("politique_sondes") == B.G0 for x in t if x.get("sondes"))
    assert {x["etiquette"] for x in t if x["exp"] == "reves"} == {"taux:0.0", "taux:0.5", "taux:1.0"}
    assert len(B.plan_complet(["p3_v1", "p3_v2"])) == 676
    assert B.PLAN3["p3_v2r"][2]["params"]["politique"]["params"]["reves_par_tour"] == 1.0


def test_le_plan_reduit_se_joue_et_se_mesure(plan3):
    B.executer("essai_p3", processus=2, bavard=False)
    c = B.evaluer_config("essai_p3")
    assert c["erreurs"] == 0
    assert c["shapley"]["methode"].startswith("restreinte")
    assert c["synergies"]["valeur"] is not None
    assert "spectateur" in c and "reve_fixe" in c
    assert set(c["reve_fixe"]["par_taux"]) == {"0.0", "0.5", "1.0"}


def test_shapley_restreint_coincide_avec_shapley_sans_effet_au_dela_de_deux():
    """[mesure:shapley] Si les tables de 3 peuples et plus n'ajoutent rien de propre à chacun
    (v additive au-delà de deux), Shapley restreint et Shapley exact coïncident."""
    joueurs = ["a", "b", "c", "d"]
    poids = {"a": 1.0, "b": 2.0, "c": 3.0, "d": 4.0}
    v = {frozenset(S): sum(poids[x] for x in S) for k in range(5) for S in itertools.combinations(joueurs, k)}
    exact, restreint = shapley(v, joueurs), shapley_restreint(v, joueurs)
    assert all(abs(exact[j] - restreint[j]) < 1e-9 for j in joueurs)
