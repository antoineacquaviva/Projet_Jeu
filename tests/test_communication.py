"""R2.1, R2.5, R2.6 : le conseil aligné sur le livret (communication, présage),
les formes de communication de la v2, et la non-régression de la référence 1.0."""
import json
import os

import pytest

from foret import charger, fusionner, Partie, fabriquer, ErreurMaquette, JournalDecisions
from foret.maquette import valider
from tests.outils import partie, Scripte
from tests.donnees.generer_reference_1_0 import parties, empreinte

DUO = ["oiseaux", "insectes"]
TRIO = ["mammiferes", "reptiles", "humains"]
SIX = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
COMMS = ["defaut", "comm_aucun_signe", "comm_traces", "comm_traces_engagent", "comm_partage", "comm_tout_dire",
         "sans_presage", "reference_1_0"]


def _regles(maquette="v1", variante=None, **regles):
    m = fusionner(charger(maquette, variante), {"regles": regles})
    return valider(m)


def _conseil_seul(p):
    p.tour = 1
    p.conseil()
    return p


# ------------------------------------------------------------------ R2.1 : l'ordre du conseil
def test_ordre_du_conseil():
    """R2.1 : Voir, puis la communication, puis le présage, puis la programmation."""
    vus = []

    def noter(t):
        return lambda p, s, o, c: (vus.append(t), o[1] if t == "trace" and len(o) > 1 and c["rang"] == 0
                                   and c["ronde"] == 0 else (None if None in o else o[0]))[1]
    regles = {t: noter(t) for t in ("voir", "trace", "programmer_carte", "programmer_mode")}
    p = partie(DUO, regles=regles)
    _conseil_seul(p)
    premiers = [vus.index(t) for t in ("voir", "trace", "programmer_carte")]
    assert premiers == sorted(premiers)
    assert p.des_source[1] == "presage" and p.compteur.comptes["stat"]["presages"] == 1


# ------------------------------------------------------------------ R2.6 : le présage
def test_presage_lance_les_des_de_la_premiere_etape():
    """R2.6 : les dés du présage servent à l'étape 1 ; sans présage, rien n'est lancé au conseil."""
    p = _conseil_seul(partie(TRIO))
    d = p.des_vus[1]
    info = p.ordre_connu(1)
    assert info["case"] == sum(d) and info["tuile"] is p.piste[sum(d)]
    p.etape = 1
    p.resoudre_etape(1)
    assert p.ee.info is None or p.ee.info["case"] == sum(d)
    q = _conseil_seul(partie(TRIO, variante="sans_presage"))
    assert q.des_vus == {} and q.ordre_connu(1) is None


def test_presage_ne_relance_pas_apres_voir():
    """R2.6 : si un oiseau a déjà lancé les dés de l'étape 1 (Voir), on ne relance pas."""
    p = partie(DUO, regles={"oiseaux": {"voir": lambda p, s, o, c: o[1] if c["etape"] == 1 else None}})
    _conseil_seul(p)
    assert p.des_source[1] == "voir"
    assert p.compteur.comptes["stat"]["presage_deja_vu"] == 1 and "presages" not in p.compteur.comptes["stat"]


def test_presage_sans_effet_sur_le_hasard():
    """R2.6 : le présage tire les dés de l'étape 1 plus tôt, sans changer la suite des dés :
    des bots qui l'ignorent jouent la même partie avec ou sans présage. (Sauf quand l'ordre
    de l'étape 1 est annulé par Hanter : sans présage, ses dés ne sont alors jamais lancés,
    et la suite des dés se décale ; d'où une table sans entités.)"""
    for g in range(1, 6):
        m1 = _regles(communication="aucun_signe", presage=True)
        m0 = _regles(communication="aucun_signe", presage=False)
        bots = lambda: [fabriquer({"type": "glouton", "params": {"des_connus": False, "communique": False}}, g * 10 + i)
                        for i in range(3)]
        b1 = Partie(m1, TRIO, bots(), graine=g).jouer()
        b0 = Partie(m0, TRIO, bots(), graine=g).jouer()
        for b in (b0, b1):
            b["stats"].pop("presages", None)
            b["stats"].pop("presage_detourne", None)
            b["stats"].pop("presage_deja_vu", None)
            b["incoherences"].pop("voir_trahi", None)
            b.pop("variante")
        assert b0 == b1


# ------------------------------------------------------------------ R2.5 : les formes de communication
def test_conseil_parle_traces_non_datees():
    """R2.5 : le conseil parlé (v1) est approché par 3 traces non datées au plus."""
    j = JournalDecisions()
    p = partie(DUO, regles={"trace": lambda p, s, o, c: o[-1]}, observateurs=[j])
    _conseil_seul(p)
    traces = [e for e in j.entrees if e["type"] == "trace"]
    assert traces and all(o is None or o[0] is None for e in traces for o in e["options"])
    assert all(len(v) == 3 and len({z for _, z in v}) == 3 for v in p.traces.values())


def test_traces_datees_et_signes_publics():
    """R2.5 : traces numérotées par étape, 2 au plus, une par étape ; lisibles par tous."""
    p = partie(DUO, variante="comm_traces", regles={"trace": lambda p, s, o, c: o[1]})
    _conseil_seul(p)
    for i, v in p.traces.items():
        assert len(v) == 2 and len({e for e, _ in v}) == 2 and all(e is not None for e, _ in v)
    assert len(p.signes()) == 4 and {g["siege"] for g in p.signes()} == {0, 1}


def test_les_rondes_s_arretent_quand_rien_ne_bouge():
    """R2.5 : on pose, reprend et déplace jusqu'à ce que plus rien ne bouge."""
    j = JournalDecisions()
    p = partie(DUO, variante="comm_traces", regles={"trace": lambda p, s, o, c: o[1]}, observateurs=[j])
    _conseil_seul(p)
    assert {e["contexte"]["ronde"] for e in j.entrees if e["type"] == "trace"} == {0, 1}
    assert p.compteur.comptes["stat"]["rondes_conseil"] == 1


def test_traces_qui_engagent():
    """R2.5 : une trace qui engage oblige à poser une carte à cette étape et à la faire agir dans
    cette zone ; sur le rêve, à rêver."""
    zone = "Z4"

    def trace(p, s, o, c):
        voulu = (1, zone) if c["rang"] == 0 else (2, "reve")
        return voulu if voulu in o else None
    j = JournalDecisions()
    p = partie(DUO, variante="comm_traces_engagent", regles={"trace": trace}, observateurs=[j])
    _conseil_seul(p)
    cartes = [e for e in j.entrees if e["type"] == "programmer_carte" and e["contexte"]["etape"] in (1, 2)]
    assert cartes and all(None not in e["options"] for e in cartes)
    modes = {(e["siege"], e["contexte"]["etape"]): e["options"] for e in j.entrees if e["type"] == "programmer_mode"}
    for s in (0, 1):
        assert modes[(s, 2)] == ["reve"] and "reve" not in modes[(s, 1)]
    p.etape = 1
    p.resoudre_etape(1)
    for k in p.ee.actifs:
        if k.hote is None and k.etape == 1:
            assert k.zone == zone or p.compteur.comptes["lacune"]["trace_intenable"] > 0


def test_engagement_demande_des_traces_datees():
    with pytest.raises(ErreurMaquette):
        _regles(communication="traces", traces_datees=False, traces_engagent=True)
    with pytest.raises(ErreurMaquette):
        _regles(communication="parle", traces_engagent=True)


def test_partage():
    """R2.5 : deux jetons par Machine en marche ; au plus 2 devant soi, un seul par Machine ;
    on peut prendre au centre ou devant un autre joueur."""
    def prendre(p, s, o, c):
        reels = [x for x in o if x is not None and x[0] == "prendre"]
        autres = [x for x in reels if x[2] != "centre"]
        return (autres or reels or [None])[0]
    j = JournalDecisions()
    p = partie(TRIO, variante="comm_partage", regles={"partage": prendre}, observateurs=[j])
    _conseil_seul(p)
    assert len(p.jetons) == len(p.machines_tournantes())
    for i in range(3):
        assert sum(1 for h in p.jetons.values() if i in h) <= 2
    assert all(h[0] is None or h[0] != h[1] for h in p.jetons.values())
    assert any(o[2] != "centre" for e in j.entrees if e["type"] == "partage" for o in
               [x for x in e["options"] if x and x[0] == "prendre"])
    assert any(g["machine"] is not None for g in p.signes())
    p.controler()


def test_aucun_signe():
    """R2.5 : aucun signe, aucune décision de communication."""
    j = JournalDecisions()
    p = partie(DUO, variante="comm_aucun_signe", observateurs=[j])
    _conseil_seul(p)
    assert not any(e["type"] in ("trace", "partage") for e in j.entrees) and p.signes() == []


def test_tout_dire():
    """R2.5 : tout dire : une trace datée par étape au plus, et les programmes déjà faits visibles."""
    vus = []
    regles = {"trace": lambda p, s, o, c: o[1],
              "programmer_carte": lambda p, s, o, c: (vus.append((s.idx, dict(p.programmes_visibles()))), o[1])[1]}
    p = partie(TRIO, variante="comm_tout_dire", regles=regles)
    _conseil_seul(p)
    assert all(len(v) == 3 for v in p.traces.values())
    assert vus[0][1] == {} and set(vus[-1][1]) == {p.ordre[0], p.ordre[1]}
    assert partie(TRIO).programmes_visibles() == {}


@pytest.mark.parametrize("variante", COMMS)
@pytest.mark.parametrize("bot", [{"type": "aleatoire"}, {"type": "glouton"}, {"type": "glouton", "params": {"reves_par_tour": 1}}])
def test_toutes_les_formes_se_jouent(variante, bot):
    """R2.5 : chaque forme se joue jusqu'au bout, invariants contrôlés, à 2, 3 et 6 peuples."""
    m = charger("v1", variante)
    for peuples in (DUO, TRIO, SIX):
        for g in (1, 2):
            b = Partie(m, peuples, [fabriquer(bot, g * 7 + i) for i in range(len(peuples))], graine=g).jouer()
            assert b["fin"] in ("nuit", "sommeil", "silence") and not b["incoherences"].get("esprit_cote_eveil")


def test_le_glouton_communique():
    """Le glouton pose des traces, prend des jetons, et rejoint parfois une zone annoncée."""
    traces, jetons = 0, 0
    for g in range(1, 6):
        b = Partie(charger("v1", "comm_traces"), TRIO, [fabriquer({"type": "glouton"}, g * 3 + i) for i in range(3)],
                   graine=g).jouer()
        traces += b["stats"].get("traces_posees", 0)
        b = Partie(charger("v1", "comm_partage"), SIX, [fabriquer({"type": "glouton"}, g * 3 + i) for i in range(6)],
                   graine=g).jouer()
        jetons += b["stats"].get("jetons_pris", 0)
    assert traces > 0 and jetons > 0


def test_niveaux_de_communication_du_glouton():
    """non : aucun signe posé ; annonce : des signes, sans s'en servir ; complet : il s'en sert
    (le jeu change au moins une fois sur cinq parties)."""
    def jouer(c, g):
        bots = [fabriquer({"type": "glouton", "params": {"communique": c}}, g * 3 + i) for i in range(3)]
        return Partie(charger("v1", "comm_traces"), TRIO, bots, graine=g).jouer()
    assert all(jouer("non", g)["stats"].get("traces_posees", 0) == 0 for g in range(1, 4))
    differe = 0
    for g in range(1, 6):
        a, c = jouer("annonce", g), jouer("complet", g)
        assert a["stats"].get("traces_posees", 0) > 0
        differe += (a["foret"], a["fin"], a["stats"].get("organes_neutralises")) != \
                   (c["foret"], c["fin"], c["stats"].get("organes_neutralises"))
    assert differe >= 1
    with pytest.raises(Exception):
        fabriquer({"type": "glouton", "params": {"communique": "parfois"}})


def test_copie_avec_communication():
    """La copie d'état (phase 1a) rejoue aussi les décisions de communication."""
    for v in ("comm_traces", "comm_partage", "defaut"):
        p = Partie(charger("v1", v), TRIO, [fabriquer({"type": "aleatoire"}, i) for i in range(3)], graine=4)
        c = p.copie()
        assert c.jouer() == p.jouer()


# ------------------------------------------------------------------ non-régression
def test_reference_1_0_rejouee():
    """R2.1 : sans communication ni présage (variante reference_1_0) et avec le glouton réglé
    comme en 1.0, le moteur rejoue à l'identique 192 parties du moteur 1.0."""
    chemin = os.path.join(os.path.dirname(__file__), "donnees", "reference_1_0.json")
    with open(chemin, encoding="utf-8") as f:
        attendu = json.load(f)
    assert len(attendu) == 192
    for e, (v, bot, t, g) in zip(attendu, parties()):
        assert (e["variante"], e["peuples"], e["graine"]) == (v, t, g)
        m = _regles("v1", v, communication="aucun_signe", presage=False)
        if bot["type"] == "glouton":
            bot = {"type": "glouton", "params": {**bot["params"], "communique": False, "des_connus": False}}
        b = Partie(m, list(t), [fabriquer(bot, g * 100 + i) for i in range(len(t))], graine=g).jouer()
        assert empreinte(b) == e["empreinte"], (v, bot, t, g)


def test_variante_reference_1_0():
    m = charger("v1", "reference_1_0")
    assert m["regles"]["communication"] == "aucun_signe" and m["regles"]["presage"] is False
    assert charger("v1")["regles"]["communication"] == "parle" and charger("v1")["regles"]["presage"] is True
    assert charger("v0")["regles"]["communication"] == "aucun_signe" and charger("v0")["regles"]["presage"] is False
