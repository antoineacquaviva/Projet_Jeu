"""Tableaux de synthèse : comparer.py et scripts/resume_campagne.py montrent les fins de la v1 et de la v2."""
import json
import os
import subprocess
import sys
import tempfile

from foret.comparer import INDICATEURS, valeur

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_les_fins_v1_et_v2_ont_chacune_leur_colonne():
    cles = [cle for cle, _, _ in INDICATEURS]
    for fin in ("nuit", "sommeil", "silence", "reveil"):
        assert "fin." + fin in cles


def test_une_fin_absente_vaut_zero():
    agg = {"fin": {"nuit": 40.0, "sommeil": 35.0}}
    assert valeur(agg, "fin.reveil") == 0
    assert valeur(agg, "fin.silence") == 0
    assert valeur(agg, "fin.nuit") == 40.0


def test_le_resume_affiche_le_reveil():
    synthese = {
        "meta": {"campagne": "essai", "maquette": {"nom": "v2"}, "parties": 10, "erreurs": 0, "duree_s": 1},
        "campagnes": {"glouton": {"parties": 10, "erreurs": 0,
                                  "fin": {"nuit": 30.0, "sommeil": 30.0, "reveil": 40.0}}},
    }
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "synthese.json"), "w", encoding="utf-8") as f:
            json.dump(synthese, f)
        sortie = subprocess.run([sys.executable, os.path.join(RACINE, "scripts", "resume_campagne.py"), d],
                                capture_output=True, text=True, check=True).stdout
    assert "Réveil %" in sortie
    assert "40,0" in sortie
