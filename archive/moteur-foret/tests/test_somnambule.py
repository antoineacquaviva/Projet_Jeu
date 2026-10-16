"""Essai « le somnambule » et présages supplémentaires (14 oct. 2026, 23 h ; accord de l'auteur pour coder et tester ;
pistes : projet/2-maquettes/reve-dispute-problematique-et-pistes.md). Non adopté : règles fausses par défaut.
- [reve_dispute:somnambule] quand un esprit avance, la tuile qu'il dépasse s'exécute (le favori agit, après les
  barrages et sabotages de l'étape) ; `somnambule_apprend` : cet ordre fait aussi apprendre la tuile ;
- [reve_dispute:presages] `presages` = nombre d'étapes annoncées au conseil (R2.6 : 1).
"""
from collections import Counter

import pytest

from foret import charger, Partie
from foret.erreurs import FinDePartie
from foret.moteur import EtatEtape
from foret.sim import fabriquer_table

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1}}


def table(variante="defaut", n=2, graine=1, maquette="v0.4rd"):
    p = Partie(charger(maquette, variante), PEUPLES[:n], fabriquer_table(G1, n, graine * 100), graine=graine)
    p.stats = Counter()
    stat = p.stat
    def compter(code, k=1):
        p.stats[code] += k
        stat(code, k)
    p.stat = compter
    p.ee = EtatEtape()
    return p


def esprit_en(p, case):
    t = p.piste[case]
    p.piste[case] = p._tuile("Esprit")
    return t


def test_regles_fausses_par_defaut_et_v04rd_inchangee():
    """Les nouvelles règles sont absentes de la V0.4 et de v0.4rd : la référence ne bouge pas."""
    for m in ("v0.4", "v0.4rd"):
        R = charger(m)["regles"]
        assert R["somnambule"] is False and R["somnambule_apprend"] is False and R["presages"] == 1


def test_un_esprit_qui_avance_fait_executer_la_tuile_depassee():
    """[reve_dispute:somnambule] L'esprit passe de 12 à 11 ; la tuile de 11 (désormais en 12) s'exécute."""
    p = table("regles:somnambule=true")
    esprit_en(p, 12)
    t11 = p.piste[11]
    p.faire_rever(p.sieges[0], "carte")                 # seule option : faire avancer l'esprit de 12
    assert p.piste[11].genre == "esprit" and p.piste[12] is t11
    assert p.somn_attente == [t11] and p.stats["somnambule_ordres"] == 0
    p.somnambule()
    assert p.somn_attente == [] and p.stats["somnambule_ordres"] == 1
    assert p.piste[12] is t11                           # sans apprentissage, la piste ne bouge pas


def test_entrer_en_12_ne_reveille_rien():
    """[reve_dispute:somnambule] Un esprit qui entre en 12 fait oublier la tuile : rien ne s'exécute."""
    p = table("regles:somnambule=true")
    assert not p.esprits()                              # piste sans esprit : seule option, entrer en 12
    p.faire_rever(p.sieges[0], "carte")
    assert p.piste[12].genre == "esprit" and p.somn_attente == []


def test_sans_la_regle_rien_ne_s_execute():
    """Sans `somnambule`, un rêve n'exécute rien (v0.4rd telle quelle)."""
    p = table()
    esprit_en(p, 12)
    p.faire_rever(p.sieges[0], "carte")
    assert p.somn_attente == []
    p.somnambule()
    assert p.stats["somnambule_ordres"] == 0


def test_une_reussite_qui_apprend_fait_reculer_l_esprit():
    """[reve_dispute:somnambule] Avec `somnambule_apprend`, une réussite fait monter la tuile vers le 7 :
    elle échange sa place avec l'esprit qui vient de la dépasser (tir à la corde)."""
    vu = False
    for g in range(1, 30):
        p = table("regles:somnambule=true,somnambule_apprend=true", graine=g)
        esprit_en(p, 12)
        t = p.piste[11]
        p.faire_rever(p.sieges[0], "carte")
        p.somnambule()
        if p.stats["somnambule_reussis"]:
            assert p.piste[11] is t and p.piste[12].genre == "esprit" and p.stats["tir_a_la_corde"] == 1
            vu = True
            break
    assert vu


def test_le_sommeil_attend_la_tuile_depassee():
    """[reve_dispute:somnambule] L'esprit qui atteint le 7 endort le Méchant après l'exécution de la tuile
    qu'il a dépassée (la dernière avancée reste exposée)."""
    p = table("regles:somnambule=true")
    for c in (8, 9, 10, 11, 12):
        esprit_en(p, c)
    t7 = p.piste[7]
    p.faire_rever(p.sieges[0], "carte")                 # seule option : l'esprit de 8 passe au 7
    assert p.piste[7].genre == "esprit" and p.fin is None and p.somn_attente == [t7]
    with pytest.raises(FinDePartie):
        p.somnambule()
    assert p.fin[0] == "sommeil" and p.stats["somnambule_ordres"] == 1


@pytest.mark.parametrize("n", [1, 2, 3])
def test_presages_annoncent_n_etapes(n):
    """[reve_dispute:presages] Le présage annonce les dés des n premières étapes."""
    p = table(f"regles:presages={n}")
    p.des_vus.clear()
    p.presager()
    assert sorted(p.des_vus) == sorted(p.etapes[:n])
    assert all(p.des_source[e] == "presage" for e in p.etapes[:n])


@pytest.mark.parametrize("variante", ["regles:somnambule=true", "regles:somnambule=true,presages=3",
                                      "regles:somnambule=true,somnambule_apprend=true"])
def test_parties_completes_sans_incoherence(variante):
    """Les variantes de l'essai se jouent jusqu'au bout, de 2 à 6 joueurs, sans erreur ni incohérence."""
    tot = Counter()
    for n in range(2, 7):
        for g in range(1, 4):
            p = Partie(charger("v0.4rd", variante), PEUPLES[:n], fabriquer_table(G1, n, g * 100), graine=g)
            b = p.jouer()
            assert b["fin"] in ("sommeil", "nuit", "reveil")
            assert not b.get("incoherences"), b.get("incoherences")
            tot.update(b.get("stats") or {})
    assert tot["somnambule_ordres"] > 0
