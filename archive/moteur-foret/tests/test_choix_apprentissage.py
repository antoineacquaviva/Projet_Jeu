"""Mesures « choix morts » et « gain d'apprentissage du Méchant » (plan vers la V1, étapes 0.5 et 0.6).

[mesure:choix_morts] [mesure:apprentissage_mechant]
"""
from foret import charger, Partie
from foret.observateurs import Usage
from foret.mesures import choix_morts, gain_apprentissage, MESURES, verdict
from foret.sim import fabriquer_table, lancer
from foret.stats import ecart_apparie

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1}}


def test_usage_compte_offres_et_choix():
    """[mesure:choix_morts] L'observateur Usage compte, pour chaque élément, les fois où il est offert et pris."""
    u = Usage()
    r = Partie(charger("v0.3"), PEUPLES[:3], fabriquer_table(G1, 3, 0), graine=2, observateurs=[u]).jouer()
    us = r["usage"]
    assert any(k.startswith("action:") for k in us) and any(k.startswith("moitie:") for k in us)
    assert all(o >= p >= 0 for o, p in us.values())
    assert "reve" in us and us["reve"][1] > 0          # le glouton qui rêve prend le rêve


def test_choix_morts_regle():
    """[mesure:choix_morts] Mort : pris moins de 5 % des fois offert (au moins 20 occasions), ou interdit sans
    perte (écart apparié « négligeable »)."""
    usage = {"action:saboter": {"offert": 100, "pris": 2}, "action:barrer": {"offert": 100, "pris": 60},
             "moitie:voler": {"offert": 10, "pris": 0}}
    r = choix_morts(usage, pertes={"moitie:parler": "négligeable", "action:barrer": "sûr"})
    assert r["morts"] == ["action:saboter", "moitie:parler"]
    assert "moitie:voler" not in r["morts"]             # trop peu d'occasions pour juger
    assert verdict("choix_morts", 0) == "vert" and verdict("choix_morts", 3) == "rouge"


def test_usage_dans_la_synthese(tmp_path):
    """[mesure:choix_morts] Les campagnes agrègent l'usage (offert, pris, taux) par bloc et variante."""
    camp = {"nom": "essai_usage", "maquette": "v0.3", "blocs": [
        {"nom": "b", "variantes": ["defaut"], "bots": [G1],
         "tables": [{"liste": [["oiseaux", "insectes"]], "parties": 3}]}]}
    syn, _ = lancer(camp, sortie=str(tmp_path), processus=1, bavard=False)
    us = next(iter(syn["detail"].values()))["usage"]
    assert us["reve"]["offert"] > 0 and 0 <= us["reve"]["taux"] <= 100


def test_gain_apprentissage():
    """[mesure:apprentissage_mechant] Gain = forêt du témoin sans apprentissage − forêt de la maquette,
    apparié ; vert à 5 points ou plus, rouge sous 1 point."""
    sans = {k: 80.0 + k % 3 for k in range(30)}
    avec = {k: v - 6 for k, v in sans.items()}
    g = gain_apprentissage(ecart_apparie(avec, sans))
    assert g["gain"] == 6.0 and g["verdict_ecart"] == "sûr"
    assert verdict("apprentissage_mechant", 6) == "vert" and verdict("apprentissage_mechant", 0.5) == "rouge"
    assert gain_apprentissage(None) is None


def test_temoins_declares():
    """Chaque nouvelle mesure a son témoin (validé sur GitHub avec le protocole P2, étape 0.11)."""
    assert MESURES["choix_morts"]["temoins"] and MESURES["apprentissage_mechant"]["temoins"]
    charger("v1", "temoin_mammiferes_sans_pouvoir")
    charger("v0.3", "temoin_une_tactique")
    charger("v0.3", "temoin_sans_apprentissage")
