"""Phase 1, outils : copie d'une partie en cours et journal des décisions.

Ces outils ne changent aucune règle : une partie jouée avec eux donne le même
bilan qu'avant (vérifié aussi par la campagne de référence réduite)."""
import copy
import json

import pytest

from foret import charger, Partie, fabriquer, Bot, ErreurMoteur, JournalDecisions, Observateur

DUO = ["oiseaux", "insectes"]
TRIO = ["mammiferes", "reptiles", "humains"]
SIX = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]

BOTS_TEST = {
    "glouton": {"type": "glouton"},
    "glouton_reve": {"type": "glouton", "params": {"reves_par_tour": 1}},
    "aleatoire": {"type": "aleatoire"},
}


def _bots(spec, n, graine):
    return [fabriquer(BOTS_TEST[spec], graine * 100 + i) for i in range(n)]


def _partie(peuples, spec, graine, maquette="v1", variante=None, **kw):
    return Partie(charger(maquette, variante), list(peuples), _bots(spec, len(peuples), graine), graine=graine, **kw)


class Espion(Bot):
    """Enveloppe un bot ; à la k-ième décision de la partie, fait une copie
    (avec des copies des bots internes) et la range dans le dépôt."""
    nom = "espion"

    def __init__(self, interne, quand, depot, **copie_kw):
        super().__init__()
        self.interne, self.quand, self.depot, self.copie_kw = interne, quand, depot, copie_kw

    def decider(self, partie, siege, type_, options, ctx):
        if len(partie._decisions) == self.quand and "copie" not in self.depot:
            bots = [copy.deepcopy(s.bot.interne) for s in partie.sieges]
            self.depot["copie"] = partie.copie(bots=bots, **self.copie_kw)
            self.depot["type"] = type_
            self.depot["options"] = len(options)
        return self.interne.decider(partie, siege, type_, options, ctx)


def _avec_espions(peuples, spec, graine, quand, reprises, maquette="v1", variante=None, **copie_kw):
    depot = {}
    internes = _bots(spec, len(peuples), graine)
    bots = [Espion(b, quand, depot, **copie_kw) for b in internes]
    p = Partie(charger(maquette, variante), list(peuples), bots, graine=graine, reprises=reprises)
    return p, depot


# ------------------------------------------------------------------ copie pendant une décision
@pytest.mark.parametrize("reprises", [False, True])
@pytest.mark.parametrize("spec", ["glouton", "glouton_reve", "aleatoire"])
@pytest.mark.parametrize("peuples", [DUO, TRIO, SIX])
def test_copie_pendant_une_decision_rejoue_a_l_identique(peuples, spec, reprises):
    """Une copie faite à n'importe quelle décision, jouée avec les mêmes bots et
    le même hasard, finit exactement comme l'original (bilan et compteurs)."""
    faites = 0
    for graine in (1, 2):
        for quand in (0, 3, 17, 60, 150):
            p, depot = _avec_espions(peuples, spec, graine, quand, reprises)
            b = p.jouer()
            if "copie" not in depot:
                continue                      # partie plus courte que quand
            faites += 1
            assert depot["copie"].jouer() == b, (graine, quand)
    assert faites >= 6


@pytest.mark.parametrize("maquette,variante", [("v0", None), ("v1", "retour_v0_mise_en_place"), ("v1", "un_esprit_depart")])
def test_copie_autres_maquettes(maquette, variante):
    for quand in (0, 25, 90):
        p, depot = _avec_espions(DUO, "glouton_reve", 4, quand, True, maquette, variante)
        b = p.jouer()
        if "copie" in depot:
            assert depot["copie"].jouer() == b


def test_copie_d_une_copie():
    p, depot = _avec_espions(TRIO, "aleatoire", 5, 10, False)
    b = p.jouer()
    c1 = depot["copie"]
    depot2 = {}
    for s in c1.sieges:                       # la copie fera elle-même une copie plus loin
        s.bot = Espion(s.bot, 80, depot2)
    assert c1.jouer() == b
    assert depot2["copie"].jouer() == b


def test_copie_depuis_la_photo_ou_depuis_le_debut():
    """Avec reprises=True, la copie repart de la photo du segment (peu de décisions
    à rejouer) ; sans, elle repart du début de la partie (seule la mise en place,
    jouée dans le constructeur, est déjà rejouée : 3 pions par joueur)."""
    for reprises in (False, True):
        p, depot = _avec_espions(DUO, "glouton", 2, 120, reprises)
        b = p.jouer()
        c = depot["copie"]
        deja = len(c._decisions)               # décisions déjà dans l'état de départ de la copie
        assert (6 < deja <= 120) if reprises else (deja == 6)
        assert c.jouer() == b


def test_copie_pendant_la_mise_en_place():
    """v1 : la présence se pose par choix, dans le constructeur (décisions 0 à 5 en duo)."""
    p, depot = _avec_espions(DUO, "glouton", 3, 2, False)
    assert depot["type"] == "presence"
    assert depot["copie"].jouer() == p.jouer()


# ------------------------------------------------------------------ copie au début d'un segment
class Photographe(Observateur):
    def __init__(self, segment, **kw):
        self.segment, self.kw, self.copie, self.vus = segment, kw, None, []

    def point(self, partie, segment):
        self.vus.append(segment)
        if segment == self.segment:
            self.copie = partie.copie(**self.kw)


@pytest.mark.parametrize("segment", [("conseil", 1), ("etape", 1, 1), ("etape", 2, 3), ("fin_tour", 2), ("conseil", 4)])
def test_copie_au_debut_d_un_segment(segment):
    ph = Photographe(segment)
    p = _partie(TRIO, "glouton", 6, observateurs=[ph])
    b = p.jouer()
    assert ph.copie is not None and ph.copie.position == segment
    assert ph.copie.jouer() == b


def test_segments_dans_l_ordre():
    ph = Photographe(None)
    p = _partie(DUO, "aleatoire", 1, observateurs=[ph])
    b = p.jouer()
    attendus = []
    for t in range(1, 7):
        attendus += [("conseil", t)] + [("etape", t, e) for e in (1, 2, 3)] + [("fin_tour", t)]
    assert ph.vus == attendus[:len(ph.vus)]
    if b["fin"] == "nuit":
        assert ph.vus == attendus


def test_copie_independante():
    p = _partie(DUO, "glouton", 2)
    c = p.copie()
    foret0, piste0 = dict(p.plateau.foret), [t.nom for t in p.piste.values()]
    b = p.jouer()
    assert c.plateau.foret == foret0 and [t.nom for t in c.piste.values()] == piste0
    assert c.M is p.M                        # la maquette est partagée, pas recopiée
    assert c.jouer() == b


# ------------------------------------------------------------------ hasard et choix imposés
def test_nouveau_hasard():
    """Même passé, autre avenir : des hasards différents donnent des fins différentes
    (au moins une fois sur 20) ; le même hasard donne deux fois la même fin."""
    fins = set()
    for h in range(20):
        ph = Photographe(("conseil", 3), hasard=h)
        p = _partie(TRIO, "glouton", 7, observateurs=[ph])
        p.jouer()
        c = ph.copie
        assert c.tour == 2                   # le passé est celui de l'original
        fins.add(json.dumps(c.jouer(), sort_keys=True))
    assert len(fins) > 1
    ph1, ph2 = Photographe(("conseil", 3), hasard=5), Photographe(("conseil", 3), hasard=5)
    _partie(TRIO, "glouton", 7, observateurs=[ph1]).jouer()
    _partie(TRIO, "glouton", 7, observateurs=[ph2]).jouer()
    assert ph1.copie.jouer() == ph2.copie.jouer()


def test_nouveau_hasard_pendant_une_decision():
    resultats = set()
    for h in range(10):
        p, depot = _avec_espions(DUO, "glouton", 8, 40, True, hasard=h)
        p.jouer()
        resultats.add(json.dumps(depot["copie"].jouer(), sort_keys=True))
    assert len(resultats) > 1


def test_imposer_un_choix():
    """La copie prend l'option imposée pour la décision en cours, puis rend la main."""
    p, depot = _avec_espions(DUO, "aleatoire", 3, 30, False)
    p.jouer()
    n, type_ = depot["options"], depot["type"]
    assert n >= 2
    for i in range(n):
        p, depot = _avec_espions(DUO, "aleatoire", 3, 30, False, imposer=[i])
        p.jouer()
        jd = JournalDecisions()
        c = depot["copie"]
        c.observateurs.append(jd)
        c.jouer()
        premiere = jd.entrees[0]
        assert premiere["type"] == type_ and premiere["indice"] == i and premiere["imposee"]
        assert not any(e["imposee"] for e in jd.entrees[1:])


# ------------------------------------------------------------------ garde-fous
def test_pas_de_copie_ni_de_rejeu_apres_la_fin():
    p = _partie(DUO, "aleatoire", 1)
    p.jouer()
    with pytest.raises(ErreurMoteur):
        p.copie()
    with pytest.raises(ErreurMoteur):
        p.jouer()


def test_pas_de_copie_au_milieu_d_un_segment():
    class Intrus(Observateur):
        def evenement(self, partie, categorie, code, n, detail):
            if categorie == "stat" and partie.tour == 1 and partie.etape == 2:
                partie.copie()
    with pytest.raises(ErreurMoteur):
        _partie(DUO, "glouton", 1, observateurs=[Intrus()]).jouer()


def test_rejeu_divergent_detecte():
    p, depot = _avec_espions(DUO, "glouton", 1, 50, False)
    p.jouer()
    c = depot["copie"]
    t, i = c._rejeu[10]
    c._rejeu[10] = ("tromper" if t != "tromper" else "aller", i)
    with pytest.raises(ErreurMoteur):
        c.jouer()


# ------------------------------------------------------------------ journal des décisions
def test_journal_des_decisions(tmp_path):
    jd = JournalDecisions()
    p = _partie(SIX, "glouton_reve", 3, observateurs=[jd])
    b = p.jouer()
    assert len(jd.entrees) == sum(b["decisions"].values()) == len(p._decisions)
    assert sum(1 for e in jd.entrees if e["forcee"]) == sum(b["decisions_forcees"].values())
    for e in jd.entrees:
        assert 0 <= e["indice"] < e["nb_options"] == len(e["options"])
        assert e["choix"] == e["options"][e["indice"]]
        assert e["forcee"] == (e["nb_options"] == 1) and not e["imposee"]
    assert {e["type"] for e in jd.entrees} == set(b["decisions"])
    r = b["journal_decisions"]
    assert sum(v["decisions"] for v in r.values()) == len(jd.entrees)
    f = tmp_path / "decisions.jsonl"
    jd.ecrire(f)
    relues = [json.loads(l) for l in f.read_text(encoding="utf-8").splitlines()]
    assert relues == json.loads(json.dumps(jd.entrees))


def test_journal_leger_et_sans_effet():
    """Le journal ne change pas la partie ; sans les options, il n'en garde que le nombre."""
    jd = JournalDecisions(options=False)
    b1 = _partie(TRIO, "glouton", 9, observateurs=[jd]).jouer()
    b2 = _partie(TRIO, "glouton", 9).jouer()
    b1.pop("journal_decisions")
    assert b1 == b2
    assert jd.entrees and all("options" not in e for e in jd.entrees)
