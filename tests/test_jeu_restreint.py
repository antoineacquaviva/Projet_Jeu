"""Étape 3.4 : le jeu restreint (règle « interdits », variantes « interdire:… ») et les campagnes
jeu_restreint, jeu_restreint_v2 et v2_options_mc."""
import pytest

from foret.bots import fabriquer
from foret.erreurs import ErreurMaquette
from foret.maquette import charger
from foret.mesures import jeu_restreint_depuis_synthese
from foret.moteur import Partie
from foret.observateurs import Observateur
from foret.sim import lire_campagne, taches


class Choix(Observateur):
    def __init__(self):
        self.vus = []

    def decision(self, partie, siege, type_, options, indice, ctx, impose):
        self.vus.append((siege.peuple, type_, options[indice], list(options)))


def _jouer(variante, peuples, maquette="v1", graine=3, bot=None):
    obs = Choix()
    bots = [fabriquer(bot or {"type": "glouton", "params": {"reves_par_tour": 0.5}}, i) for i in range(len(peuples))]
    Partie(charger(maquette, variante), peuples, bots, graine=graine, observateurs=[obs]).jouer()
    return obs.vus


def test_la_variante_interdire_pose_la_regle():
    """[mesure:jeu_restreint] « interdire:a+b » devient la règle interdits = [a, b]."""
    m = charger("v2", "interdire:action:saboter+moitie:voir")
    assert m["regles"]["interdits"] == ["action:saboter", "moitie:voir"]
    assert charger("v1")["regles"]["interdits"] == []
    with pytest.raises(ErreurMaquette):
        charger("v1", "interdire:n_importe_quoi")


@pytest.mark.parametrize("maquette", ["v1", "v2"])
def test_saboter_interdit(maquette):
    """[mesure:jeu_restreint] Plus aucune option Saboter n'est offerte, à personne."""
    vus = _jouer("interdire:action:saboter", ["oiseaux", "insectes"], maquette)
    assert not any(isinstance(o, tuple) and o[0] == "saboter" for _, t, _, opts in vus for o in opts
                   if t in ("action", "embuscade"))
    vus0 = _jouer("defaut", ["oiseaux", "insectes"], maquette)
    assert any(isinstance(o, tuple) and o[0] == "saboter" for _, t, _, opts in vus0 for o in opts
               if t in ("action", "embuscade"))


def test_aller_interdit():
    """[mesure:jeu_restreint] Aller : la décision n'offre plus que « rester »."""
    vus = _jouer("interdire:aller", ["reptiles", "humains"])
    assert all(c is None for _, t, c, _ in vus if t == "aller")
    assert not any(isinstance(c, tuple) and c[0] == "aller" for _, t, c, _ in vus if t in ("action", "embuscade"))


def test_moitie_interdite():
    """[mesure:jeu_restreint] La moitié qui porte Tenir n'est jamais jouée ; l'autre moitié et le rêve restent."""
    m = charger("v1")
    haut_tenir = m["peuples"]["mammiferes"]["haut"]["pouvoir"] == "tenir"
    tenir = "haut" if haut_tenir else "bas"
    vus = _jouer("interdire:moitie:tenir", ["mammiferes", "humains"])
    modes = [c for p, t, c, _ in vus if p == "mammiferes" and t == "programmer_mode"]
    assert modes and tenir not in modes
    autres = [c for p, t, c, _ in vus if p == "humains" and t == "programmer_mode"]
    assert {"haut", "bas"} & set(autres)


def test_voir_interdit_coupe_aussi_la_decision_voir():
    """[mesure:jeu_restreint] Sans la moitié Voir, les oiseaux n'engagent plus de carte en Voir (R6.2)."""
    vus = _jouer("interdire:moitie:voir", ["oiseaux", "insectes"])
    assert all(c is None for p, t, c, _ in vus if t == "voir")


def test_jeu_restreint_depuis_une_synthese():
    """[mesure:jeu_restreint] Perte par rapport à la référence, sur les tables du bloc."""
    import json

    def pp(bloc, duo, v):
        return f"{bloc} | {{}} | {json.dumps(duo)}", {"foret_pct": v}
    par = dict([pp("reference", ["oiseaux", "insectes"], 90), pp("reference", ["mammiferes", "humains"], 80)])
    syn = {"par_peuples": par,
           "detail": {"reference | defaut | mc | {}": {"foret_pct": 85, "foret_pct_ic95": 2.0},
                      "actions | interdire:action:saboter | mc | {}": {"foret_pct": 75, "foret_pct_ic95": 2.0},
                      "oiseaux | interdire:moitie:voir | mc | {}": {"foret_pct": 88, "foret_pct_ic95": 2.0}}}
    r = jeu_restreint_depuis_synthese(syn)
    assert r["action:saboter"]["perte"] == 10 and r["action:saboter"]["tables"] == 2
    assert r["moitie:voir"]["perte"] == 2 and r["moitie:voir"]["reference"] == 90 and r["moitie:voir"]["tables"] == 1


def test_les_campagnes_de_l_etape_3_4():
    for nom, n in (("jeu_restreint", 480), ("jeu_restreint_v2", 480), ("v2_options_mc", 960)):
        c = lire_campagne(nom)
        t, ignorees = taches(c, c["maquette"])
        assert len(t) == n and not ignorees
    c = lire_campagne("jeu_restreint")
    interdits = {v for b in c["blocs"] for v in b["variantes"] if v.startswith("interdire:")}
    assert len(interdits) == 3 + 12
    for b in c["blocs"]:
        for v in b["variantes"]:
            charger(c["maquette"], v)
