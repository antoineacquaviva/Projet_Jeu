"""Garde-fou « aucune boucle gagnante » (décision C1 de l'auteur, 14 oct. 2026).

[mesure:boucle_gagnante] [mesure:convention_table] [mesure:action_suffit] [mesure:echelle_lecture]
Spécification : projet/3-pilotage/garde-fou-boucles-gagnantes.md.
"""
import json
import os
import tempfile
import unittest

from foret import boucles, cycle
from foret.bots import fabriquer_table
from foret.bots.repete import Repete
from foret.erreurs import ErreurMoteur
from foret.sim import jouer_une, taches


def _partie(spec, peuples=("oiseaux", "insectes"), graine=0, maquette="v0.4"):
    r = jouer_une(("t", maquette, "defaut", spec, tuple(peuples), graine))
    assert "erreur" not in r, r.get("trace")
    return r


class TestBotRepete(unittest.TestCase):
    def test_parametres_controles(self):
        for mauvais in ({"zone": "partout"}, {"actions": ["voler"]}, {"aller": "souvent"}, {"reves": []},
                        {"voie": "ailleurs"}, {"inconnu": 1}):
            with self.assertRaises(ErreurMoteur):
                Repete(0, **mauvais)

    def test_toute_la_bibliotheque_joue(self):
        """Chaque stratégie de la bibliothèque joue une partie sans erreur, à 2 et 3 joueurs (V0.4)."""
        for n, peuples in ((2, ("mammiferes", "reptiles")), (3, ("oiseaux", "humains", "entites"))):
            for spec in boucles.bibliotheque(n):
                _partie(spec, peuples)

    def test_determinisme(self):
        spec = boucles.bibliotheque(3)[0]
        a = _partie(spec, ("oiseaux", "humains", "entites"), 7)
        b = _partie(spec, ("oiseaux", "humains", "entites"), 7)
        self.assertEqual((a["foret"], a["tour"], a["fin"]), (b["foret"], b["tour"], b["fin"]))

    def test_motif_de_reve(self):
        """R3.6 : une carte en rêve quitte la main ; le motif [0] ne rêve jamais, le motif [2] rêve."""
        sans = _partie({"type": "repete", "params": {"reves": [0]}}, graine=1)
        avec = _partie({"type": "repete", "params": {"reves": [2], "garde": 1}}, graine=1)
        self.assertEqual(sans["cartes_en_reve"], 0)
        self.assertGreater(avec["cartes_en_reve"], 0)

    def test_etape_vide(self):
        """Motif d'étapes [0] : aucune carte programmée, donc aucune action ni aucun rêve."""
        r = _partie({"type": "repete", "params": {"etapes": [0], "reves": [1]}}, graine=2)
        self.assertEqual(r["cartes_en_reve"], 0)


class TestBibliotheque(unittest.TestCase):
    def test_noms_uniques_et_etiquettes(self):
        for n in range(2, 7):
            b = boucles.bibliotheque(n)
            noms = [s["params"]["nom"] for s in b]
            self.assertEqual(len(noms), len(set(noms)))
            for s in b:
                fabriquer_table(s, n, 0)
                p = s["params"]
                if s["type"] == "repete":
                    # ouverte ⇔ le script ne lit pas la menace du moment
                    self.assertEqual(p["ouverte"], p.get("zone", "depart") != "menace", p["nom"])
            self.assertTrue(any(s["params"].get("collective") for s in b))

    def test_motifs_primitifs(self):
        m = boucles._motifs()
        self.assertIn([0, 1], m)
        self.assertNotIn([1, 1], m)          # répétition de [1]
        self.assertEqual(len(m), 3 + 6 + 24)

    def test_campagne_appariee(self):
        """La campagne reprend les tables, les parties et les graines de la campagne du bot fort."""
        src = {"nom": "x", "blocs": [{"nom": "b", "variantes": ["defaut"], "bots": [], "graine0": 2000,
                                       "tables": [{"liste": [["oiseaux", "insectes"], ["oiseaux", "humains", "entites"]],
                                                   "parties": 2}]}]}
        tables, parties, g0 = boucles.tables_de(src)
        camp = boucles.campagne("c", "v0.4", ["defaut"], tables, parties, g0)
        self.assertEqual([b["nom"] for b in camp["blocs"]], ["boucles_n2", "boucles_n3"])
        tt, _ = taches(camp, "v0.4")
        self.assertEqual({t[5] for t in tt}, {2000, 2001})
        self.assertEqual(len(tt), (len(boucles.bibliotheque(2)) + len(boucles.bibliotheque(3)) + 2 * len(boucles._references())) * 2)


def _pc(lignes):
    cols = ["campagne", "variante", "bot", "peuples", "graine", "foret_pct", "tour", "fin", "cartes_en_reve",
            "tours_max", "bot_params"]
    return {"colonnes": cols, "lignes": [[x.get(c) for c in cols] for x in lignes]}


def _ligne(bot, params, foret, peuples="oiseaux+insectes", graine=0, variante="defaut"):
    return {"campagne": "b", "variante": variante, "bot": bot, "peuples": peuples, "graine": graine,
            "foret_pct": foret, "tour": 6, "fin": "nuit", "cartes_en_reve": 0, "tours_max": 6,
            "bot_params": json.dumps(params, sort_keys=True)}


class TestAnalyse(unittest.TestCase):
    def _jeu(self, ecart_boucle):
        fort, boucle, gl = [], [], []
        mc = {"budget": 64, "savoir": "soi", "politique": {"type": "glouton", "params": {"reves_par_tour": 1.0}}}
        for g in range(6):
            base = 70 + g
            fort.append(_ligne("mc", mc, base))
            boucle.append(_ligne("repete", {"nom": "action:barrer|zone:depart|mode:machines|reves:0",
                                            "famille": "une_action", "ouverte": True}, base - ecart_boucle, graine=g))
            boucle.append(_ligne("table", {"nom": "convention:relais", "famille": "convention", "ouverte": True,
                                           "collective": True, "sieges": []}, base - 20, graine=g))
            gl.append(_ligne("glouton", {"reves_par_tour": 0.0}, base - ecart_boucle - 2, graine=g))
        for i, l in enumerate(fort):
            l["graine"] = i
        return _pc(boucle + gl), _pc(fort)

    def test_ecart_et_bandes(self):
        pb, pf = self._jeu(12)
        r = boucles.analyser(pb, pf)["defaut"]
        self.assertEqual(r["fort"], "fort:MC64R1")
        self.assertAlmostEqual(r["ecart_pire_taille"]["ecart"], 12)
        self.assertEqual(r["ecart_pire_taille"]["bande_proposee"], "vert")
        self.assertEqual(r["tailles"]["2"]["meilleure_collective"], "convention:relais")
        self.assertEqual(r["convention_pire"]["bande_proposee"], "vert")
        self.assertEqual(r["action_pire"]["action"], "barrer")
        self.assertEqual(boucles.alertes({"defaut": r}), [])

    def test_boucle_gagnante_alerte(self):
        pb, pf = self._jeu(1)
        r = boucles.analyser(pb, pf)
        self.assertEqual(r["defaut"]["ecart_pire_taille"]["bande_proposee"], "rouge")
        self.assertEqual(r["defaut"]["action_pire"]["bande_proposee"], "rouge")
        self.assertEqual(len(boucles.alertes(r)), 1)
        self.assertIn("lecture seule", boucles.markdown(r))

    def test_glouton_compte_parmi_les_boucles(self):
        """Parer au plus probable à rythme de rêve fixe est une politique répétée (cas du tape-taupe)."""
        pb, pf = self._jeu(12)
        for l in pb["lignes"]:
            if l[2] == "glouton":
                l[5] += 13                                  # le glouton dépasse la boucle de la bibliothèque
        r = boucles.analyser(pb, pf)["defaut"]
        self.assertTrue(r["tailles"]["2"]["meilleure"].startswith("glouton"))
        self.assertAlmostEqual(r["ecart_pire_taille"]["ecart"], 1)

    def test_chef_exclu_de_la_reference(self):
        pb, pf = self._jeu(5)
        chef = _ligne("mc", {"budget": 64, "savoir": "tout"}, 99)
        pf["lignes"].append([chef.get(c) for c in pf["colonnes"]])
        self.assertTrue(boucles.analyser(pb, pf)["defaut"]["fort"].startswith("fort:"))


class TestCycle(unittest.TestCase):
    """Le cycle joue l'étape « boucles » entre le contrôle et le rapport (lecture seule)."""

    def setUp(self):
        self.plan = {"cycle": "t", "maquette": "v0.4", "espace": [], "graine": 1,
                     "confirmation": {"parties": [4, 8], "garder": [6, 3], "candidats": 12},
                     "controle": {"parties": 4, "finalistes": 3},
                     "tables_fort": [["oiseaux", "insectes"], ["oiseaux", "humains", "entites"]]}
        self.dir = tempfile.mkdtemp()

    def _etat(self, etape):
        cycle.ecrire_json(os.path.join(self.dir, "etat.json"),
                          {"cycle": "t", "etape": etape, "gen": 1, "statut": "en cours", "historique": []})

    def test_enchainement(self):
        self._etat("controle")
        e = cycle.integrer(self.plan, self.dir, {"parties_compactes": _pc([])})
        self.assertEqual(e["etape"], "boucles")
        cycle.ecrire_json(os.path.join(self.dir, "etat.json"), e)
        cycle.ecrire_json(os.path.join(self.dir, "controle_candidats.json"), ["patch:{}"])
        camp = cycle.preparer(self.plan, self.dir)
        self.assertEqual(camp["nom"], "t_boucles")
        self.assertEqual({b["graine0"] for b in camp["blocs"]}, {2000})          # graines de la manche 2
        self.assertEqual(camp["blocs"][0]["variantes"], ["defaut", "patch:{}"])
        self.assertEqual(camp["blocs"][0]["tables"][0]["parties"], 8)
        pb, pf = TestAnalyse()._jeu(2)
        cycle.ecrire_json(os.path.join(self.dir, "confirmation_parties_m2.json"), pf)
        e = cycle.integrer(self.plan, self.dir, {"parties_compactes": pb})
        self.assertEqual(e["etape"], "rapport")
        cycle.ecrire_json(os.path.join(self.dir, "etat.json"), e)
        self.assertTrue(any("boucle gagnante" in a for a in cycle.alertes(self.plan, self.dir)))
        self.assertIn("aucune boucle gagnante", cycle.rapport(self.plan, self.dir))

    def test_etape_sautee(self):
        self._etat("controle")
        e = cycle.integrer(dict(self.plan, boucles=False), self.dir, {"parties_compactes": _pc([])})
        self.assertEqual(e["etape"], "rapport")


if __name__ == "__main__":
    unittest.main()
