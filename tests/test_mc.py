"""Bot Monte-Carlo (moteur 1.7, phase 2) : il joue n'importe quelle maquette, de façon reproductible,
et sa répartition du budget garde la meilleure option."""
import pytest

from foret.bots import fabriquer
from foret.bots.mc import MonteCarlo
from foret.maquette import charger
from foret.moteur import Partie


def _partie(maquette, budget, graine=3, peuples=("oiseaux", "insectes")):
    bots = [fabriquer({"type": "mc", "params": {"budget": budget}}, graine * 100 + i) for i in range(len(peuples))]
    return Partie(charger(maquette, "defaut"), list(peuples), bots, graine=graine), bots


@pytest.mark.parametrize("maquette", ["v1", "v2"])
def test_le_bot_mc_joue_une_partie_entiere(maquette):
    p, bots = _partie(maquette, 2)
    assert p.reprises                      # photo à chaque segment : copies rapides
    b = p.jouer()
    assert 0 <= b["foret"] <= b["foret_initiale"]
    assert sum(bot.stats["recherches"] for bot in bots) > 0


def test_le_bot_mc_est_reproductible():
    a = _partie("v1", 2, graine=5, peuples=("reptiles", "humains"))[0].jouer()
    b = _partie("v1", 2, graine=5, peuples=("reptiles", "humains"))[0].jouer()
    assert (a["foret"], a["fin"], a["tour"]) == (b["foret"], b["fin"], b["tour"])


def test_le_halving_garde_la_meilleure_option(monkeypatch):
    bot = MonteCarlo(0, budget=16)
    valeurs = {0: 0.40, 1: 0.55, 2: 0.70, 3: 0.52, 4: 0.10}
    monkeypatch.setattr(bot, "_suite", lambda partie, i, hasard: valeurs[i])
    assert bot._halving(None, list(valeurs)) == 2


def test_le_halving_compare_les_options_sur_les_memes_des(monkeypatch):
    bot = MonteCarlo(0, budget=12)
    vus = {}
    monkeypatch.setattr(bot, "_suite", lambda partie, i, hasard: vus.setdefault(i, []).append(hasard) or 0.5)
    bot._halving(None, [0, 1, 2])
    assert vus[0][:len(vus[2])] == vus[2][:len(vus[0])]    # nombres aléatoires communs, tour par tour


def test_savoir_inconnu_refuse():
    with pytest.raises(ValueError):
        MonteCarlo(0, savoir="rien")


@pytest.mark.parametrize("taux, attendu", [(0.0, 0), (1.0, 1)])
def test_taux_de_reve_impose(taux, attendu):
    """Comme le glouton à taux fixe (mesure reve_fixe) : 0 ou 1 carte en rêve par tour et par joueur,
    en gardant 2 cartes en main (paramètre garde du glouton) : au plus 3 rêves avec une main de 5."""
    peuples = ("mammiferes", "humains")
    bots = [fabriquer({"type": "mc", "params": {"budget": 2, "reves_par_tour": taux}}, 40 + i) for i in range(2)]
    b = Partie(charger("v1", "defaut"), list(peuples), bots, graine=4).jouer()
    tours = b["tour"]
    for n in b["cartes_en_reve_par_siege"]:
        assert n <= min(attendu * tours, 3)
        if attendu:
            assert n >= min(tours, 3) - 1   # au plus un rêve manqué (étape laissée vide, fin en cours de tour)
        else:
            assert n == 0


def test_le_devin_joue_les_suites_avec_les_vrais_des(monkeypatch):
    vus = []
    bot = MonteCarlo(0, budget=2, devin=True)

    class Copie:
        def jouer(self):
            return {"resultat": 1, "foret_initiale": 2}

    class Faux:
        sieges = [0, 1]

        def copie(self, bots, hasard, imposer, brouiller=None):
            vus.append(hasard)
            return Copie()
    assert bot._suite(Faux(), 0, 123) == 0.5
    assert vus == [None]


def test_chacun_pour_soi_retire_au_sort_les_programmes_caches(monkeypatch):
    """Partie.brouiller (savoir="soi") : appelé au point des copies, il défait et refait les
    programmes encore cachés des autres, sans casser les invariants (cartes, étapes, rêves)."""
    appels = []
    vrai = Partie.brouiller

    def espion(self, sait):
        avant = [(i, j.etape, j.mode) for i, js in (self._provisoire or {}).items() if i != sait for j in js]
        avant += [(i, e, j.mode) for e, v in self.prog.items() for i, j in v.items() if i != sait and e > self.etape]
        vrai(self, sait)
        apres = [(i, j.etape, j.mode) for i, js in (self._provisoire or {}).items() if i != sait for j in js]
        apres += [(i, e, j.mode) for e, v in self.prog.items() for i, j in v.items() if i != sait and e > self.etape]
        appels.append((self.etape, bool(avant), sorted(avant) != sorted(apres)))
        self.controler()
    monkeypatch.setattr(Partie, "brouiller", espion)
    peuples = ["insectes", "humains", "reptiles"]
    bots = [fabriquer({"type": "mc", "params": {"budget": 2, "savoir": "soi",
                                                "politique": {"type": "aleatoire"}}}, 60 + i) for i in range(3)]
    Partie(charger("v1", "defaut"), peuples, bots, graine=12).jouer()
    assert any(e == 0 for e, _, _ in appels) and any(e > 0 for e, _, _ in appels)
    assert any(change for _, _, change in appels)


def test_annonces_traduit_les_traces_en_contraintes():
    """Partie.annonces (R2.5, savoir="soi") : traces datées et non datées."""
    p = Partie(charger("v1", "defaut"), ["oiseaux", "insectes"], [fabriquer({"type": "glouton"}, i) for i in range(2)],
               graine=1)
    p.traces = {0: [(1, "reve"), (3, "Z5")], 1: [(None, "reve"), (None, "Z2"), (None, "Z4")]}
    assert p.annonces(0, [1, 2, 3]) == {1: "reve", 3: "carte"}
    assert p.annonces(0, [2, 3]) == {3: "carte"}
    assert p.annonces(1, [1, 2, 3]) == {1: "reve", 2: "carte", 3: "carte"}
    assert p.annonces(1, [2, 3]) == {2: "reve", 3: "carte"}


def test_le_bot_qui_annonce_tient_ses_traces():
    """annonces=True : chaque trace datée qu'il pose est tenue à la programmation."""
    tenues = []
    vrai = Partie.conseil

    def espion(self):
        vrai(self)
        if self is not originale[0]:          # les suites (copies) jouent la politique, pas le bot
            return
        for idx, ts in self.traces.items():
            for e, z in ts:
                if e is None:
                    continue
                j = self.prog[e].get(idx) or next((g for g in self.glisses if g.siege == idx and g.etape == e), None)
                tenues.append(j is not None and (j.mode == "reve") == (z == "reve"))
    import foret.moteur as M
    originale = [None]
    M.Partie.conseil = espion
    try:
        bots = [fabriquer({"type": "mc", "params": {"budget": 2, "savoir": "soi", "annonces": True}}, 80 + i)
                for i in range(2)]
        originale[0] = Partie(charger("v1", "comm_traces"), ["oiseaux", "mammiferes"], bots, graine=5)
        originale[0].jouer()
    finally:
        M.Partie.conseil = vrai
    assert tenues and all(tenues)
