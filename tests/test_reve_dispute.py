"""Variante d'essai « le rêve disputé » (14 oct. 2026) : proposition projet/2-maquettes/proposition-le-reve-dispute.md,
testée avec l'accord de l'auteur ; non adoptée. Maquette `v0.4rd` = V0.4 + deux changements :
- un rêve, un pas : reves_par_pas = 1 (retrait du sablier, [v2:D1]) ;
- [reve_dispute:cauchemar] quand une tactique du côté du rêve (cases 8 à 12) réussit, l'esprit le plus avancé
  recule d'une case ; pas de second recul si la tactique a déjà repoussé un esprit en apprenant (R5.2).
La V0.4 elle-même ne change pas (cauchemar faux, sablier de 2).
"""
from collections import Counter

from foret import charger, Partie
from foret.sim import fabriquer_table

PEUPLES = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
G1 = {"type": "glouton", "params": {"reves_par_tour": 1}}


def table(maquette, n=2, graine=1):
    p = Partie(charger(maquette), PEUPLES[:n], fabriquer_table(G1, n, graine * 100), graine=graine)
    p.stats = Counter()
    stat = p.stat
    def compter(code, n=1):
        p.stats[code] += n
        stat(code, n)
    p.stat = compter
    return p


def piste_avec_esprit(p, case_esprit):
    """Place un esprit en case_esprit (côté rêve) ; la tuile qui y était va en 12 à la place de l'ancienne."""
    t = p.piste[case_esprit]
    p.piste[case_esprit] = p._tuile("Esprit")
    p.piste[12] = t if case_esprit != 12 else p.piste[12]
    return t


def test_la_variante_ne_change_que_deux_regles():
    """[reve_dispute:cauchemar] v0.4rd = v0.4 + reves_par_pas 1 + cauchemar ; la V0.4 reste sans cauchemar."""
    a, b = charger("v0.4"), charger("v0.4rd")
    assert a["regles"]["cauchemar"] is False and a["regles"]["reves_par_pas"] == 2
    assert b["regles"]["cauchemar"] is True and b["regles"]["reves_par_pas"] == 1
    diff = {k for k in a["regles"] if a["regles"][k] != b["regles"][k]}
    assert diff == {"cauchemar", "reves_par_pas"}
    for k in ("piste", "tuiles", "machines", "cartes", "presence", "pouvoirs", "tours", "etapes", "plateau"):
        assert a[k] == b[k], k


def test_cauchemar_une_reussite_cote_reve_fait_reculer_l_esprit():
    """[reve_dispute:cauchemar] Une tactique qui réussit en 10 fait reculer l'esprit le plus avancé (en 8 → 9)."""
    p = table("v0.4rd")
    piste_avec_esprit(p, 8)
    t10 = p.piste[10]
    p.apprendre(10, True)                       # la tactique monte de 10 à 9, puis le cauchemar
    assert p.piste[9].genre == "esprit" and p.piste[8] is not None and p.piste[8].genre != "esprit"
    assert t10 is p.piste[8]                    # la tactique (montée en 9) a été échangée avec l'esprit qui recule
    assert p.stats["cauchemar_recul"] == 1


def test_cauchemar_cote_eveil_et_echec_ne_font_rien():
    """[reve_dispute:cauchemar] Le côté éveil (2 à 6), le centre et les échecs ne repoussent pas l'esprit."""
    p = table("v0.4rd")
    piste_avec_esprit(p, 9)
    p.apprendre(5, True)                        # côté éveil
    p.apprendre(7, True)                        # centre : elle reste
    p.apprendre(11, False)                      # échec côté rêve
    assert p.piste[9].genre == "esprit"
    assert p.stats.get("cauchemar_recul", 0) == 0


def test_pas_de_second_recul_apres_le_tir_a_la_corde():
    """[reve_dispute:cauchemar] R5.2 : la tactique en 10 qui réussit repousse déjà l'esprit en 9 (tir à la corde) ;
    le cauchemar n'ajoute pas un second recul."""
    p = table("v0.4rd")
    piste_avec_esprit(p, 9)
    p.apprendre(10, True)
    assert p.piste[10].genre == "esprit"
    assert p.stats["tir_a_la_corde"] == 1 and p.stats.get("cauchemar_recul", 0) == 0


def test_sans_cauchemar_la_v04_ne_recule_pas():
    """[v0.4] Sans la règle, la même réussite ne fait pas reculer l'esprit."""
    p = table("v0.4")
    piste_avec_esprit(p, 8)
    p.apprendre(10, True)
    assert p.piste[8].genre == "esprit"
    assert p.stats.get("cauchemar_recul", 0) == 0


def test_esprit_en_12_ou_bloque_ne_recule_pas():
    """[reve_dispute:cauchemar] Un esprit en 12, ou suivi d'un autre esprit, ne recule pas."""
    p = table("v0.4rd")
    p.piste[12] = p._tuile("Esprit")
    p.apprendre(10, True)
    assert p.piste[12].genre == "esprit"
    assert p.stats.get("cauchemar_sans_effet", 0) == 1


def test_un_reve_un_pas():
    """[v2:D1] Avec reves_par_pas = 1, chaque rêve fait entrer ou avancer un esprit tout de suite (pas de sablier)."""
    p = table("v0.4rd")
    avant = len(p.esprits())
    p.rever(("entrer",))
    assert len(p.esprits()) == avant + 1 and p.piste[12].genre == "esprit"


def test_des_parties_completes_sans_erreur():
    """[reve_dispute:cauchemar] La variante se joue de bout en bout, de 2 à 6 joueurs."""
    for n in range(2, 7):
        b = table("v0.4rd", n, graine=n).jouer()
        assert b["incoherences"] == {} or sum(b["incoherences"].values()) == 0


def test_programme_rd_apparie_a_la_batterie_7():
    """[reve_dispute:cauchemar] Le programme « rd » joue la variante avec les mêmes expériences et les mêmes graines
    que pro3_v04 : seule la maquette change."""
    import foret.batterie as B
    assert B.PROGRAMMES["rd"] is B.PLAN_RD
    a, b = B.taches("pro3_v04"), B.taches("rd_v04rd")
    assert len(a) == len(b) == 668
    cle = lambda t: (t["exp"], tuple(t["peuples"]), t["graine"], t["etiquette"], str(t["bots"]))
    assert [cle(t) for t in a] == [cle(t) for t in b]
    assert {t["maquette"] for t in b} == {"v0.4rd"}
