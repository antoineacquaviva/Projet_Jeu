"""Étape 3 quater (décisions C2 à C4 de l'auteur, 14 oct. 2026) : tests du choix stratégique.

[mesure:mecanismes] [mesure:profil_delta] [mesure:lisibilite] [mesure:boucle_gagnante]
Leçon du rêve : projet/3-pilotage/choix-strategique.md.
"""
import json
import os
import random
import re
import tempfile
import unittest

from foret import boucles, choix, cycle, mecanismes
from foret.bots import fabriquer_table
from foret.sim import jouer_une, synthetiser

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _partie(spec, peuples=("oiseaux", "insectes"), graine=0, maquette="v0.4"):
    r = jouer_une(("t", maquette, "defaut", spec, tuple(peuples), graine))
    assert "erreur" not in r, r.get("trace")
    return r


class TestMecanismes(unittest.TestCase):
    def test_compteurs_connus_du_moteur(self):
        """Chaque compteur du registre est émis par le moteur (nom exact, ou préfixe dynamique « oubli_ »…)."""
        src = open(os.path.join(RACINE, "foret", "moteur.py"), encoding="utf-8").read()
        emis = set(re.findall(r'stat\("([a-z_]+)"', src)) | set(re.findall(r'reculer_esprit\("([a-z_]+)"', src))
        prefixes = set(re.findall(r'stat\("([a-z_]+_)" \+', src))
        for m, (_, _, _, compteurs, _) in mecanismes.MECANISMES.items():
            for c in compteurs:
                self.assertTrue(c in emis or any(c.startswith(p) for p in prefixes), (m, c))

    def test_frequences_et_alerte(self):
        syn = {"detail": {
            "b | defaut | mc | {}": {"parties": 10, "erreurs": 0,
                                     "stats_par_partie": {"tir_a_la_corde": 0.05, "reves_tires": 2.0, "embuscades": 0.1}},
            "b | defaut | glouton | {}": {"parties": 10, "erreurs": 0,
                                          "stats_par_partie": {"tir_a_la_corde": 0.15, "reves_tires": 1.0}}}}
        f = mecanismes.frequences(syn)["defaut"]
        self.assertAlmostEqual(f["tir_a_la_corde"], 0.1)
        self.assertAlmostEqual(f["reve_annule"], 1.5)
        self.assertIsNone(f["alliance"])                      # pas de compteur : signalé, pas d'alerte
        al = mecanismes.alertes({"defaut": f})
        self.assertTrue(any("tir à la corde" in a for a in al))
        self.assertFalse(any("embuscade" in a.lower() for a in al))     # propre aux reptiles : pas d'alerte
        self.assertIn("pas de compteur", mecanismes.markdown({"defaut": f}))


def _jug(delta, ind, se_bruit=0.5, k=8, graine=0):
    rng = random.Random(graine)
    a = [70 + delta + rng.gauss(0, se_bruit) for _ in range(k)]
    b = [70 + rng.gauss(0, se_bruit) for _ in range(k)]
    va, vb = sum(a) / k, sum(b) / k
    return {"type": "programmer_mode", "options": ["haut", "bas", "reve"], "valeurs": [vb, vb - 5, va],
            "suites": [b, [x - 5 for x in b], a], "indices": ind}


class TestProfilDelta(unittest.TestCase):
    def test_trois_regimes(self):
        domine = [_jug(6, {"pas_esprit": 3}, graine=i) for i in range(40)]
        indiff = [_jug(0.3, {"pas_esprit": 3}, graine=i) for i in range(40)]
        dispute = [_jug(6 if i % 2 else -6, {"pas_esprit": 1 if i % 2 else 4}, graine=i) for i in range(40)]
        self.assertEqual(choix.profil(choix.deltas(domine, "rever_ou_defendre"))["regime"], "dominé par A")
        self.assertEqual(choix.profil(choix.deltas(indiff, "rever_ou_defendre"))["regime"], "indifférent")
        self.assertEqual(choix.profil(choix.deltas(dispute, "rever_ou_defendre"))["regime"], "disputé")

    def test_le_bruit_ne_fabrique_pas_de_dilemme(self):
        """Un écart moyen nul mais bruité (suites très dispersées) reste « neutre ou incertain »."""
        bruit = [_jug(0, {"pas_esprit": 3}, se_bruit=12, graine=i) for i in range(60)]
        p = choix.profil(choix.deltas(bruit, "rever_ou_defendre"))
        self.assertNotEqual(p["regime"], "disputé")

    def test_lisibilite_trouve_l_indice(self):
        dispute = [_jug(6 if i % 2 else -6, {"pas_esprit": 1 if i % 2 else 4, "tour": i % 6}, graine=i) for i in range(60)]
        li = choix.lisibilite(choix.deltas(dispute, "rever_ou_defendre"))
        self.assertEqual(li["regle"]["indice"], "pas_esprit")
        self.assertGreaterEqual(li["un_indice"], 95)
        self.assertLess(li["hasard"], 60)

    def test_etiquettes(self):
        self.assertEqual(choix.etiquette_option(None), "rien")
        self.assertEqual(choix.etiquette_option("reve"), "reve")
        self.assertEqual(choix.etiquette_option(("saboter", "a", 1, "moteur")), "saboter")

    def test_jugements_etiquetes_dans_une_partie(self):
        """Le bot MC qui juge note les options, les suites appariées et les indices publics ; la synthèse les lit."""
        spec = {"type": "mc", "params": {"budget": 4, "savoir": "soi", "juger": 0.3, "suites_juge": 2,
                                         "politique": {"type": "glouton", "params": {"reves_par_tour": 1.0}}}}
        r = _partie(spec, ("oiseaux", "insectes"), 1, "v0.3")
        j = next(x for x in r["jugements"] if "options" in x)
        self.assertEqual(len(j["options"]), len(j["valeurs"]))
        self.assertEqual(len(j["suites"][0]), 2)
        self.assertTrue(set(choix.INDICES) <= set(j["indices"]))
        syn = synthetiser([r], {"nom": "t", "blocs": []}, "v0.3", [], 1)
        self.assertIn("defaut", syn["choix"])


class TestReflexesEtHoraires(unittest.TestCase):
    def test_horaire_hors_partie(self):
        r = _partie({"type": "glouton", "params": {"reves_par_tour": 1.0, "tours_reve": [99, 99]}}, graine=3)
        self.assertEqual(r["cartes_en_reve"], 0)

    def test_reflexes_jouent(self):
        for c in choix.CONDITIONS_REVE:
            _partie({"type": "glouton", "params": {"reves_par_tour": 1.0, "reve_si": [c]}}, graine=4)
        with self.assertRaises(ValueError):
            _partie_err = {"type": "glouton", "params": {"reves_par_tour": 1.0, "reve_si": ["jamais_vu"]}}
            r = jouer_une(("t", "v0.4", "defaut", _partie_err, ("oiseaux", "insectes"), 0))
            raise ValueError(r.get("erreur", ""))

    def test_references_et_familles(self):
        refs = boucles._references()
        for s in refs:
            fabriquer_table(s, 2, 0)
        fam = {boucles.etiquette({"bot": "glouton", "bot_params": json.dumps(s["params"])})[1] for s in refs}
        self.assertEqual(fam, {"glouton", "horaire", "jugement"})

    def test_t3_leger_et_jugement_hors_des_boucles(self):
        """Un réflexe de rêve n'est pas une boucle : il ne compte pas pour « la meilleure boucle »."""
        cols = ["campagne", "variante", "bot", "peuples", "graine", "foret_pct", "tour", "fin", "cartes_en_reve",
                "tours_max", "bot_params"]

        def ligne(bot, params, f, g):
            return ["b", "defaut", bot, "oiseaux+insectes", g, f, 6, "nuit", 0, 6, json.dumps(params, sort_keys=True)]
        L = []
        for g in range(6):
            L.append(ligne("glouton", {"reves_par_tour": 0.0}, 60 + g, g))
            L.append(ligne("glouton", {"reves_par_tour": 1.0, "tours_reve": [3, 99]}, 62 + g, g))
            L.append(ligne("glouton", {"reves_par_tour": 1.0, "reve_si": ["esprit_proche"]}, 75 + g, g))
            L.append(ligne("repete", {"nom": "rythme:1|debut", "famille": "rythme", "ouverte": True}, 50 + g, g))
            L.append(ligne("mc", {"budget": 64, "savoir": "soi"}, 80 + g, g))
        r = boucles.analyser({"colonnes": cols, "lignes": L})["defaut"]["tailles"]["2"]
        self.assertTrue(r["meilleure"].startswith("horaire"))
        self.assertTrue(r["jugement_simple"]["regle"].startswith("jugement"))
        self.assertAlmostEqual(r["jugement_simple"]["ecart"]["ecart"], 13)
        self.assertIn("T3 léger", boucles.markdown(boucles.analyser({"colonnes": cols, "lignes": L})))


class TestCycle(unittest.TestCase):
    def test_derniere_manche_juge_et_rapport(self):
        plan = {"cycle": "t", "maquette": "v0.4", "espace": [], "graine": 1,
                "bot_fort": {"type": "mc", "params": {"budget": 64, "savoir": "soi"}},
                "confirmation": {"parties": [4, 8], "garder": [6, 3], "candidats": 12},
                "controle": {"parties": 4, "finalistes": 3}, "tables_fort": [["oiseaux", "insectes"]]}
        d = tempfile.mkdtemp()
        cycle.ecrire_json(os.path.join(d, "confirmation_candidats.json"), ["patch:{}"])
        for gen, attendu in ((1, None), (2, 0.1)):
            cycle.ecrire_json(os.path.join(d, "etat.json"), {"cycle": "t", "etape": "confirmation", "gen": gen,
                                                             "statut": "en cours", "historique": []})
            camp = cycle.preparer(plan, d)
            self.assertEqual(camp["blocs"][0]["bots"][0]["params"].get("juger"), attendu)
        jug = [_jug(6 if i % 2 else -6, {"pas_esprit": 1 if i % 2 else 4}, graine=i) for i in range(30)]
        syn = {"parties_compactes": {"colonnes": [], "lignes": []},
               "detail": {"b | defaut | mc | {}": {"parties": 4, "erreurs": 0, "stats_par_partie": {"tir_a_la_corde": 0.0}}},
               "choix": {"defaut": {"rever_ou_defendre": {"profil": choix.profil(choix.deltas(jug, "rever_ou_defendre")),
                                                          "lisibilite": choix.lisibilite(choix.deltas(jug, "rever_ou_defendre"))}}}}
        e = cycle.integrer(plan, d, syn)
        self.assertEqual(e["etape"], "controle")                         # la manche 2 était la dernière
        txt = cycle.rapport(plan, d)
        self.assertIn("Mécanismes voulus", txt)
        self.assertIn("profil de Δ", txt)
        self.assertTrue(any("tir à la corde" in a for a in cycle.alertes(plan, d)))


if __name__ == "__main__":
    unittest.main()


class TestGainJugement(unittest.TestCase):
    """[mesure:gain_libre] T3 complet du rêve, au niveau de la partie (étape 3 quater c)."""

    def _pc(self, r1, r0, libre, n=12):
        cols = ["campagne", "variante", "bot", "peuples", "graine", "foret_pct", "tour", "fin", "cartes_en_reve",
                "tours_max", "bot_params"]
        rng = random.Random(3)
        L = []
        for g in range(n):
            base = 70 + rng.gauss(0, 5)
            for params, d in (({"budget": 64, "politique": {"type": "glouton", "params": {"reves_par_tour": 1.0}}}, r1),
                              ({"budget": 64, "politique": {"type": "glouton", "params": {"reves_par_tour": 0.0}}}, r0),
                              ({"budget": 64, "portefeuille": [{"nom": "a"}]}, libre)):
                L.append(["b", "defaut", "mc", "a+b", g, base + d + rng.gauss(0, 0.5), 6, "nuit", 0, 6,
                          json.dumps(params, sort_keys=True)])
        return {"colonnes": cols, "lignes": L}

    def test_regimes(self):
        self.assertEqual(choix.gain_jugement(self._pc(6, 0, 5))["defaut"]["regime"], "dominé par rêver")
        self.assertEqual(choix.gain_jugement(self._pc(-7, 0, -1))["defaut"]["regime"], "dominé par défendre")
        self.assertEqual(choix.gain_jugement(self._pc(0, 0, 0))["defaut"]["regime"], "indifférent")
        self.assertTrue(choix.gain_jugement(self._pc(0, 0, 5))["defaut"]["regime"].startswith("disputé"))
        self.assertIn("Régime", choix.markdown_jugement(choix.gain_jugement(self._pc(6, 0, 5))))

    def test_campagne_jugement_reve(self):
        c = json.load(open(os.path.join(RACINE, "campagnes", "jugement_reve.json"), encoding="utf-8"))
        roles = {choix._role_bot(b["type"], b["params"]) for b in c["blocs"][0]["bots"]}
        self.assertEqual(roles, {"suites_1", "suites_0", "libre"})
