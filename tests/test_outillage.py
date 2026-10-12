"""Maquettes, bots, campagnes, déterminisme, modes hérités de v0."""
import itertools
import json
import os

import pytest

from foret import charger, lire, Partie, fabriquer, ErreurMaquette, ErreurMoteur, Bot, BOTS
from foret.decisions import DECISIONS
from foret.lacunes import LACUNES, INCOHERENCES
from foret.sim import taches, lire_campagne, jouer_une, agreger
from foret.conformite import matrice, RACINE
from tests.outils import partie, presence, jeu, machine, ordre

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]


# ------------------------------------------------------------------ maquettes
def test_toutes_les_variantes_se_chargent():
    for nom in ("v0", "v1"):
        for v in ["defaut"] + sorted(lire(nom)["variantes"]):
            charger(nom, v)


def test_heritage_v1():
    m = charger("v1")
    assert m["herite_de"] == "v0" and m["tours"] == 6
    assert m["regles"]["barrage"] == "bloque" and m["regles"]["alliance"] == "presence"
    assert "sans_esprit_depart" not in m["variantes"] and "un_esprit_depart" in m["variantes"]


@pytest.mark.parametrize("patch", [
    {"regles": {"barage": "bloque"}},                      # faute de frappe
    {"regles": {"barrage": "parfois"}},                   # valeur hors liste
    {"pouvoirs": {"tenir": {"mode": "?"}}},
    {"peuples": {"reptiles": {"actions": ["voler"]}}},
    {"piste": {"disposition": ["Cupidite"] * 10}},
    {"tuiles": {"Cupidite": {"critere": "inconnu"}}},
])
def test_maquette_invalide(tmp_path, patch):
    f = tmp_path / "mauvaise.json"
    f.write_text(json.dumps({"nom": "mauvaise", "base": "v1", **patch}), encoding="utf-8")
    with pytest.raises(ErreurMaquette):
        m = charger(str(f))
        Partie(m, ["oiseaux", "insectes"], [fabriquer({"type": "aleatoire"}) for _ in range(2)])


def test_variante_inconnue():
    with pytest.raises(ErreurMaquette):
        charger("v1", "nexiste_pas")


# ------------------------------------------------------------------ bots
def test_bots_connus_et_parametres():
    assert {"aleatoire", "glouton"} <= set(BOTS)
    with pytest.raises(ErreurMoteur):
        fabriquer({"type": "glouton", "params": {"reves": 1}})
    with pytest.raises(ErreurMoteur):
        fabriquer({"type": "inconnu"})


def test_un_bot_sans_methode_choisit_au_hasard():
    class Minimal(Bot):
        nom = "minimal"
    m = charger("v1")
    b = Partie(m, PEUPLES, [Minimal(i) for i in range(6)], graine=3).jouer()
    assert b["fin"] in ("nuit", "sommeil", "silence")
    assert set(b["decisions"]) <= set(DECISIONS)


def test_choix_illegal_refuse():
    class Tricheur(Bot):
        nom = "tricheur"

        def d_presence(self, partie, siege, options, pion):
            return "Z99"
    with pytest.raises(ErreurMoteur):
        Partie(charger("v1"), ["oiseaux"], [Tricheur()])


# ------------------------------------------------------------------ registres
def test_registres_documentes():
    for code, d in LACUNES.items():
        assert d["titre"] and d["defaut"] and d["statut"] in ("ouverte", "tranchée")
    assert all(INCOHERENCES.values())
    for t, d in DECISIONS.items():
        assert d["regle"] and d["role"]


# ------------------------------------------------------------------ campagnes
def test_campagne_reference_meme_taille_qu_en_v0():
    c = lire_campagne("reference")
    for mq in ("v0", "v1"):
        tt, ignorees = taches(c, mq)
        assert len(tt) == 112350
        assert len(ignorees) == 1


def test_campagne_rejouable():
    c = lire_campagne("reference")
    tt, _ = taches(c, "v1", echelle=0.01)
    r1 = [jouer_une(t) for t in tt[::40]]
    r2 = [jouer_une(t) for t in tt[::40]]
    assert r1 == r2 and not any("erreur" in r for r in r1)
    a = agreger(r1)
    assert a["erreurs"] == 0 and 0 <= a["foret_pct"] <= 100


# ------------------------------------------------------------------ parties entières
@pytest.mark.parametrize("maquette", ["v0", "v1"])
@pytest.mark.parametrize("bot", ["aleatoire", "glouton"])
def test_parties_sans_erreur(maquette, bot):
    m = charger(maquette)
    for k in (1, 2, 3, 6):
        for combo in itertools.islice(itertools.combinations(PEUPLES, k), 5):
            for g in range(8):
                bots = [fabriquer({"type": bot}, g * 100 + i) for i in range(k)]
                b = Partie(m, list(combo), bots, graine=g).jouer()
                assert b["fin"] in ("nuit", "sommeil", "silence")
                assert 0 <= b["foret"] <= b["foret_initiale"]


def test_determinisme():
    def une():
        bots = [fabriquer({"type": "aleatoire"}, 7 + i) for i in range(3)]
        return Partie(charger("v1"), ["oiseaux", "reptiles", "humains"], bots, graine=7).jouer()
    assert une() == une()


# ------------------------------------------------------------------ modes hérités de v0
def test_v0_barrage_contourne():
    p = partie(maquette="v0")
    b = machine(p, "Bouteur")
    p.ee.barres = {"Z4"}
    assert p.executer(ordre(p, "Cupidite", "Z4", b)) is True and b.zone == "Z1"
    assert p.compteur.comptes["incoherence"]["barrage_contourne"] == 1


def test_v0_echec_pousse_l_esprit():
    p = partie(maquette="v0")
    for c in list(p.piste):
        if p.piste[c].genre == "esprit":
            p.piste[c] = p._tuile("Cupidite")
    p.piste[8] = p._tuile("Esprit")
    from foret import FinDePartie
    with pytest.raises(FinDePartie):
        p.apprendre(7, False)
    assert p.fin[0] == "sommeil"


def test_v0_tenir_carte_et_renverser_chenilles():
    p = partie(peuples=("mammiferes", "oiseaux"), maquette="v0")
    assert p.organes_specialiste("mammiferes") == {"chenilles"}
    j = jeu(p, "mammiferes", "haut", "Z4", "barrer")
    j.pouvoir.apres_action(j)
    assert p.ee.tenues == {"Z4"}


# ------------------------------------------------------------------ conformité
def test_conformite_complete():
    """Chaque règle de docs/regles_v1.md a au moins un test et un renvoi dans le code."""
    R, _, sans_test, sans_code, orphelins = matrice(
        os.path.join(RACINE, "docs", "regles_v1.md"), os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
    assert len(R) >= 40
    assert not sans_test, f"règles sans test : {sans_test}"
    assert not orphelins, f"renvois vers des règles absentes : {orphelins}"
