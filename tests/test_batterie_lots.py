"""La batterie par lots (moteur 1.6) : les lots rassemblés donnent exactement les
fichiers et le rapport d'un calcul d'un seul tenant ; la fusion refuse un plan
incomplet, en double ou différent."""
import json
import os

import pytest

from foret import batterie as B

# Un petit plan d'essai : l'expérience « échelle » (aléatoire contre glouton), duos et trios, 2 parties.
ESSAI = {"essai_v1": ("v1", "defaut", B.G0, ("echelle",), 4),
         "essai_v2": ("v2", "defaut", B.G0, ("echelle",), 4)}


@pytest.fixture
def plan(monkeypatch, tmp_path):
    monkeypatch.setattr(B, "PLAN", dict(B.PLAN, **ESSAI))
    return tmp_path


def _fichiers(dossier):
    out = {}
    for racine, _, fichiers in os.walk(dossier):
        for f in fichiers:
            if f.endswith(".jsonl"):
                with open(os.path.join(racine, f), encoding="utf-8") as h:
                    out[os.path.relpath(os.path.join(racine, f), dossier)] = h.read()
    return out


def test_les_lots_rendent_le_calcul_d_un_seul_tenant(plan, monkeypatch):
    noms = list(ESSAI)
    monkeypatch.setattr(B, "DOSSIER", str(plan / "seul"))
    for nom in noms:
        B.executer(nom, processus=2, bavard=False)
    seul = _fichiers(plan / "seul")
    metas_seul = {n: json.load(open(plan / "seul" / n / "echelle.meta.json")) for n in noms}

    monkeypatch.setattr(B, "DOSSIER", str(plan / "lots_fusion"))
    for i in range(3):
        B.jouer_lot(i, 3, noms, sortie=str(plan / "lots"), processus=2, bavard=False)
    resume = B.fusionner(str(plan / "lots"), noms, bavard=False)
    assert resume["parties"] == len(B.plan_complet(noms)) == 2 * (15 + 20) * 2 * 2
    assert _fichiers(plan / "lots_fusion") == seul
    for n in noms:
        m = json.load(open(plan / "lots_fusion" / n / "echelle.meta.json"))
        assert m["signature"] == metas_seul[n]["signature"] and m["lots"] == 3
    # le rapport tiré des lots est celui du calcul d'un seul tenant
    a = B.evaluer_config("essai_v1")
    monkeypatch.setattr(B, "DOSSIER", str(plan / "seul"))
    assert B.evaluer_config("essai_v1") == a


def test_chaque_partie_dans_un_seul_lot(plan):
    noms = list(ESSAI)
    total = len(B.plan_complet(noms))
    vus = []
    for i in range(5):
        vus += list(range(i, total, 5))
    assert sorted(vus) == list(range(total))


def test_la_fusion_refuse_un_lot_manquant_ou_un_autre_plan(plan, monkeypatch):
    noms = ["essai_v1"]
    monkeypatch.setattr(B, "DOSSIER", str(plan / "res"))
    B.jouer_lot(0, 2, noms, sortie=str(plan / "lots"), processus=1, bavard=False)
    with pytest.raises(SystemExit, match=r"lots manquants \[1\]"):
        B.fusionner(str(plan / "lots"), noms, bavard=False)
    B.jouer_lot(1, 2, noms, sortie=str(plan / "lots"), processus=1, bavard=False)
    with pytest.raises(SystemExit, match="autre plan"):
        B.fusionner(str(plan / "lots"), noms, echelle=3, bavard=False)
    assert B.fusionner(str(plan / "lots"), noms, bavard=False)["lots"] == 2


def test_un_lot_deja_fait_n_est_pas_rejoue(plan):
    noms = ["essai_v1"]
    assert B.jouer_lot(0, 4, noms, sortie=str(plan / "lots"), processus=1, bavard=False) is not None
    assert B.jouer_lot(0, 4, noms, sortie=str(plan / "lots"), processus=1, bavard=False) is None


def test_lot_invalide(plan):
    with pytest.raises(SystemExit):
        B.jouer_lot(4, 4, ["essai_v1"], sortie=str(plan / "lots"), bavard=False)
