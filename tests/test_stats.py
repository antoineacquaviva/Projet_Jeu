"""Statistiques appariées (plan vers la V1, étape 0.3 ; docs/mesures.md, « Statistiques appariées »)."""
import json
import os
import random
import subprocess
import sys

from foret.stats import ic_bootstrap, verdict, ecart_apparie, apparier, references_par_bloc, parties_compactes
from foret.sim import lancer

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_ic_reproductible_et_centre():
    xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    a, b = ic_bootstrap(xs), ic_bootstrap(xs)
    assert a == b                                   # graine fixe : calcul reproductible
    assert a[0] < 5.5 < a[1]
    assert ic_bootstrap([3]) is None


def test_regle_de_l_ecart_sur():
    """Règle de l'écart sûr : sûr si l'intervalle exclut 0 ; négligeable s'il tient dans ± 1 point ; sinon incertain."""
    assert verdict((0.2, 3.0)) == "sûr"
    assert verdict((-4.0, -0.1)) == "sûr"
    assert verdict((-0.8, 0.9)) == "négligeable"
    assert verdict((-2.0, 3.0)) == "incertain"
    assert verdict(None) == "incertain"


def test_apparier_resserre_la_marge():
    """Témoin : deux variantes qui partagent le hasard de chaque table (forte variance commune) et ne diffèrent
    que de +2 points. L'écart apparié est « sûr » ; sans apparier, la marge est bien plus large."""
    rng = random.Random(7)
    a, b = {}, {}
    for k in range(40):
        commun = rng.gauss(80, 10)
        a[k] = commun + rng.gauss(0, 1)
        b[k] = commun + 2 + rng.gauss(0, 1)
    e = ecart_apparie(a, b)
    assert e["paires"] == 40 and e["verdict"] == "sûr"
    larg = e["ic95"][1] - e["ic95"][0]
    larg_ind = e["ic95_independant"][1] - e["ic95_independant"][0]
    assert larg * 4 < larg_ind
    assert 1 < e["ecart"] < 3


def test_temoin_sans_effet_est_negligeable_ou_incertain():
    """Témoin : deux variantes identiques (écart réel nul) ne donnent jamais un écart « sûr » ici."""
    rng = random.Random(3)
    a = {k: rng.gauss(80, 10) for k in range(60)}
    b = dict(a)
    assert ecart_apparie(a, b)["verdict"] == "négligeable"


def test_references_par_bloc():
    c = {"blocs": [{"nom": "x", "variantes": ["defaut", "v"]}, {"nom": "y", "variantes": ["a", "b"]},
                   {"nom": "z", "variantes": ["a", "b"], "reference": "b"}]}
    assert references_par_bloc(c) == {"x": "defaut", "y": "a", "z": "b"}


def test_campagne_reelle_apparie_et_resume(tmp_path):
    """Une petite campagne réelle sur la V0.3 : la synthèse porte les écarts appariés et les parties
    compactes, et le résumé Markdown les affiche."""
    camp = {"nom": "essai_apparie", "maquette": "v0.3", "blocs": [
        {"nom": "lunes", "variantes": ["defaut", "sans_lunes"],
         "bots": [{"type": "glouton", "params": {"reves_par_tour": 1}}],
         "tables": [{"liste": [["oiseaux", "insectes"], ["reptiles", "humains", "entites"]], "parties": 6}]}]}
    syn, res = lancer(camp, echelle=1.0, sortie=str(tmp_path), processus=1, bavard=False)
    g = next(iter(syn["apparie"].values()))
    assert g["reference"] == "defaut"
    assert g["ecarts"]["sans_lunes"]["paires"] == 12
    pc = syn["parties_compactes"]
    assert len(pc["lignes"]) == 24 and pc["colonnes"][5] == "foret_pct"
    out = subprocess.run([sys.executable, os.path.join(RACINE, "scripts", "resume_campagne.py"), str(tmp_path)],
                         capture_output=True, text=True, check=True).stdout
    assert "Écarts appariés" in out and "sans_lunes" in out
