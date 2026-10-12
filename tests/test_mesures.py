"""Batterie d'évaluation (moteur 1.4, phase 1d) : mesures, témoins, agrégation.

Chaque test cite la mesure qu'il vérifie : [mesure:<id>] (foret/mesures.py,
python -m foret.conformite --mesures). Les témoins eux-mêmes (des variantes
cassées exprès) sont vérifiés par la batterie (resultats/batterie/rapport.json) ;
ici, on vérifie que les règles de témoin font ce qu'elles disent et que les
formules donnent les valeurs attendues sur des cas construits.
"""
import math
import unittest
from collections import Counter

from foret.batterie import (PEUPLES, mesures_coordination, mesures_echelle, mesures_equipes, mesures_parties,
                            mesures_reves, mesures_sondes, mesures_spectateur, jouer)
from foret.bots import fabriquer
from foret.maquette import charger
from foret.mesures import (MESURES, Mesureur, Sondeur, _hors_des_deux, auc, bande, concentration,
                           duo_contre_meilleur_seul, synergies_relatives,
                           distance_pistes, duos_complets, exactitude_equilibree, quantile, shapley, synergies,
                           verdict)
from foret.moteur import Partie, CASES

G0 = {"type": "glouton", "params": {"reves_par_tour": 0.0}}
G1 = {"type": "glouton", "params": {"reves_par_tour": 1.0}}


def partie(maquette="v1", variante=None, peuples=("oiseaux", "mammiferes"), bot=G0, graine=1, obs=()):
    m = charger(maquette, variante)
    bots = [fabriquer(bot, graine * 100 + i) for i in range(len(peuples))]
    return Partie(m, list(peuples), bots, graine=graine, observateurs=list(obs))


class TestObservateurs(unittest.TestCase):
    def test_mesureur_et_sondeur_sans_effet(self):
        """[mesure:concentration] [mesure:surprise] [mesure:predictibilite] [mesure:incertitude]
        Le Mesureur et le Sondeur ne changent rien à la partie (même bilan, v1 et v2)."""
        for mq in ("v1", "v2"):
            for g in range(3):
                for bot in (G0, G1):
                    b0 = partie(mq, bot=bot, graine=g).jouer()
                    b1 = partie(mq, bot=bot, graine=g,
                                obs=[Mesureur(), Sondeur({("conseil", 3): "t2"}, copies=2, graine=g)]).jouer()
                    b1.pop("mesures")
                    b1.pop("sondes")
                    self.assertEqual(b0, b1, (mq, g, bot))

    def test_un_releve_par_ordre(self):
        """[mesure:tactiques] [mesure:menace_croissante] Chaque ordre exécuté est relevé une fois."""
        for mq in ("v1", "v2"):
            for g in range(4):
                me = Mesureur()
                b = partie(mq, graine=g, obs=[me]).jouer()
                n = sum(v[0] for v in b["mesures"]["par_tour"].values())
                self.assertEqual(n, b["stats"].get("ordres", 0), (mq, g))
                self.assertEqual(n, sum(v[0] for v in b["mesures"]["tactiques"].values()))

    def test_sondeur_tire_un_autre_hasard(self):
        """[mesure:predictibilite] Les copies jouent un autre hasard : leurs issues varient."""
        so = Sondeur({("conseil", 3): "t2"}, copies=8, graine=5)
        b = partie("v1", graine=5, obs=[so]).jouer()
        self.assertEqual(len(b["sondes"]["t2"]), 8)
        self.assertGreater(len(set(b["sondes"]["t2"])), 1)

    def test_duree_et_attente(self):
        """[mesure:duree] [mesure:attente] [mesure:forcees] Temps estimé et attente cohérents."""
        b = partie("v2", peuples=("oiseaux", "mammiferes", "humains"), obs=[Mesureur()]).jouer()
        me = b["mesures"]
        self.assertGreater(me["temps_s"], 300)
        self.assertEqual(len(me["attente"]), 3)
        self.assertTrue(all(0 <= a < 1 for a in me["attente"]))
        self.assertTrue(all(n > 0 for n in me["non_forcees_siege"]))
        self.assertIn("programmer_carte", me["dec"])

    def test_charge_compte_les_departages(self):
        """[mesure:charge] La charge compte les égalités tranchées par le moteur."""
        b = partie("v1", "temoin_une_tactique", obs=[Mesureur()]).jouer()
        self.assertGreater(b["mesures"]["charge"], 0)
        self.assertEqual(b["mesures"]["charge"], b["lacunes"].get("egalite_machine", 0)
                         + sum(v for k, v in b["lacunes"].items() if k.startswith(("egalite_critere", "egalite_arbitraire",
                                                                                     "chemin_multiple", "egalite_rayon"))))


class TestConcentrationSurprise(unittest.TestCase):
    def test_concentration_depart(self):
        """[mesure:concentration] Au départ, sans défense (présence retirée) : v1, toute la menace
        sur deux zones (100 %) ; v2 « V2 proposée », 53 % (calcul de l'atelier). Avec la présence
        posée par le glouton, Opportunisme vise ailleurs et la v2 monte à 80 %."""
        def sans_defense(p):
            for k in p.presence:
                p.presence[k] = Counter()
            return p
        p1 = sans_defense(partie("v1"))
        self.assertAlmostEqual(concentration(p1.prevision(), 2), 1.0)
        p2 = partie("v2")
        self.assertAlmostEqual(concentration(p2.prevision(), 2), 0.8, delta=0.006)
        self.assertAlmostEqual(concentration(sans_defense(p2).prevision(), 2), 0.53, delta=0.006)
        self.assertIsNone(concentration(Counter(), 2))

    def test_une_tactique_est_resolue(self):
        """[mesure:concentration] [mesure:surprise] [mesure:temoins] Témoin « une seule tactique » :
        aucune surprise ; menace sur une seule zone (v1) ou très concentrée (v2)."""
        for mq in ("v1", "v2"):
            b = partie(mq, "temoin_une_tactique", obs=[Mesureur()]).jouer()
            me = b["mesures"]
            self.assertEqual(me["surp_t"][1], 0)
            self.assertGreater(me["surp_t"][0], 0)
            self.assertEqual(set(me["tactiques"]), {"Cupidite"})
            self.assertGreater(me["conc"][0] / me["conc"][1], 0.9 if mq == "v1" else 0.6)

    def test_hors_des_deux(self):
        """[mesure:surprise] Ex aequo au deuxième rang : comptés parmi les deux plus probables."""
        p = {"a": 0.4, "b": 0.3, "c": 0.3, "d": 0.1}
        self.assertFalse(_hors_des_deux(p, "a"))
        self.assertFalse(_hors_des_deux(p, "c"))
        self.assertTrue(_hors_des_deux(p, "d"))
        self.assertFalse(_hors_des_deux({"a": 1.0}, "a"))


class TestTemoins(unittest.TestCase):
    def test_des_fixes(self):
        """[mesure:temoins] Dés truqués : chaque lancer donne les faces imposées ; ailleurs, rien ne change."""
        p = partie("v1", "temoin_des_fixes")
        self.assertEqual({p.lancer_des() for _ in range(20)}, {(3, 4)})
        p = partie("v1")
        self.assertGreater(len({p.lancer_des() for _ in range(50)}), 5)

    def test_des_fixes_partie_jouee_d_avance(self):
        """[mesure:predictibilite] [mesure:incertitude] Avec des dés truqués, les copies finissent toutes pareil."""
        so = Sondeur({("conseil", 3): "t2", ("conseil", 5): "t5"}, copies=4, graine=2)
        b = partie("v2", "temoin_des_fixes", graine=2, obs=[so]).jouer()
        for v in b["sondes"].values():
            self.assertEqual(len(set(v)), 1)

    def test_sans_apprentissage(self):
        """[mesure:apprentissage] [mesure:temoins] Le Méchant qui n'apprend plus garde sa piste (sans rêve)."""
        for mq in ("v1", "v2"):
            m = charger(mq, "temoin_sans_apprentissage")
            p = partie(mq, "temoin_sans_apprentissage", obs=[Mesureur()])
            pm0 = dict(getattr(p, "piste_m", {}) or {})
            b = p.jouer()
            self.assertEqual(b["mesures"]["piste"], m["piste"]["disposition"])
            self.assertGreater(b["stats"].get("apprentissage_coupe", 0), 0)
            if pm0:
                self.assertEqual(p.piste_m, pm0)
            self.assertEqual(distance_pistes(b["mesures"]["piste"], m["piste"]["disposition"]), 0)

    def test_variantes_temoins_chargent(self):
        """[mesure:temoins] [mesure:menace_croissante] [mesure:plancher] [mesure:shapley] [mesure:spectateur]
        Chaque témoin du plan se charge et se joue."""
        for mq, v in [("v1", "temoin_essoufflement"), ("v2", "temoin_essoufflement"), ("v1", "temoin_assaut"),
                      ("v1", "temoin_hanter_illimite"), ("v2", "temoin_hanter_illimite"),
                      ("v1", "temoin_mammiferes_sans_pouvoir"), ("v1", "temoin_spectateur")]:
            b = partie(mq, v, peuples=("humains", "mammiferes", "entites")).jouer()
            self.assertIn(b["fin"], ("nuit", "sommeil", "silence", "reveil"))
        m = charger("v1", "temoin_essoufflement")
        self.assertNotIn("Renfort", m["piste"]["disposition"])
        self.assertNotIn("Reparer", m["piste"]["disposition"])
        self.assertEqual(len(charger("v1", "temoin_assaut")["machines"]["en_jeu"]), 5)
        self.assertEqual(charger("v1", "temoin_spectateur")["peuples"]["humains"]["actions"], [])

    def test_inerte_ne_joue_rien(self):
        """[mesure:shapley] [mesure:spectateur] Le bot inerte (v(∅)) ne programme rien et ne rêve pas."""
        for mq in ("v1", "v2"):
            m = charger(mq)
            b = Partie(m, ["oiseaux"], [fabriquer({"type": "inerte"})], graine=3).jouer()
            self.assertEqual(b["fin"], "nuit")
            self.assertEqual(b["cartes_en_reve"], 0)
            self.assertEqual(b["stats"].get("ordres_echoues", 0) + b["stats"].get("ordres_reussis", 0),
                             b["stats"].get("ordres", 0) - b["stats"].get("doubles_hesites", 0))


class TestAgregation(unittest.TestCase):
    def test_shapley_additif(self):
        """[mesure:shapley] Jeu additif : chacun reçoit son poids ; la somme vaut v(N) - v(∅)."""
        w = {p: i + 1 for i, p in enumerate(PEUPLES)}
        v = {}
        from itertools import combinations
        for k in range(7):
            for S in combinations(PEUPLES, k):
                v[frozenset(S)] = 10 + sum(w[p] for p in S)
        phi = shapley(v, PEUPLES)
        for p in PEUPLES:
            self.assertAlmostEqual(phi[p], w[p])

    def test_shapley_gants(self):
        """[mesure:shapley] Jeu des gants (1 gauche, 2 droits) : 2/3, 1/6, 1/6."""
        J = ["G", "D1", "D2"]
        v = {frozenset(): 0}
        from itertools import combinations
        for k in range(1, 4):
            for S in combinations(J, k):
                v[frozenset(S)] = 1 if "G" in S and ("D1" in S or "D2" in S) else 0
        phi = shapley(v, J)
        self.assertAlmostEqual(phi["G"], 2 / 3)
        self.assertAlmostEqual(phi["D1"], 1 / 6)

    def test_synergies(self):
        """[mesure:synergies] Additif : synergies nulles ; complémentaires : positives."""
        v = {frozenset(): 0, frozenset("a"): 1, frozenset("b"): 2, frozenset("ab"): 3}
        self.assertEqual(synergies(v, ["a", "b"])[("a", "b")], 0)
        v[frozenset("ab")] = 5
        self.assertEqual(synergies(v, ["a", "b"])[("a", "b")], 2)

    def test_synergies_decision_b2(self):
        """[mesure:synergies] Décision B2 : un duo « compte » s'il bat son meilleur peuple seul ;
        la synergie relative repère les duos meilleurs que leurs peuples ne l'annoncent."""
        solo = {"a": 60, "b": 50, "c": 70}
        duos = {("a", "b"): 70, ("a", "c"): 65, ("b", "c"): 75}
        d = duo_contre_meilleur_seul(solo, duos)
        self.assertEqual(d, {("a", "b"): 10, ("a", "c"): -5, ("b", "c"): 5})
        r = synergies_relatives(duos)
        self.assertEqual(r, {("a", "b"): 0.0, ("a", "c"): -2.5, ("b", "c"): 2.5})
        self.assertEqual(max(r, key=r.get), ("b", "c"))
        self.assertEqual(verdict("synergies", 12), "vert")
        self.assertEqual(verdict("synergies", 9), "orange")
        self.assertEqual(verdict("synergies", 7), "rouge")

    def test_duos_complets_du_tetraedre(self):
        """[mesure:synergies] Les trois duos qui couvrent les quatre compartiments."""
        d = duos_complets(charger("v1"))
        self.assertEqual(d, {("insectes", "oiseaux"), ("humains", "mammiferes"), ("entites", "reptiles")})

    def test_bandes(self):
        """[mesure:concentration] [mesure:fins_precoces] [mesure:pire_table] Bandes provisoires de la phase 0."""
        self.assertEqual(verdict("concentration", 60), "vert")
        self.assertEqual(verdict("concentration", 85), "orange")
        self.assertEqual(verdict("concentration", 95), "rouge")
        self.assertEqual(verdict("concentration", 30), "rouge")
        self.assertEqual(verdict("concentration", 35), "orange")
        self.assertEqual(verdict("fins_precoces", 20), "vert")
        self.assertEqual(verdict("fins_precoces", 40), "orange")
        self.assertEqual(verdict("fins_precoces", 41), "rouge")
        self.assertEqual(verdict("pire_table", 49), "rouge")
        self.assertEqual(verdict("menace_croissante", 0.5), "rouge")
        self.assertEqual(verdict("incertitude", 0.3), "orange")
        self.assertEqual(verdict("predictibilite", 90), "rouge")
        self.assertIsNone(verdict("lacunes", 3))
        self.assertIsNone(bande(None, (0, 1), []))

    def test_predictibilite_formules(self):
        """[mesure:predictibilite] Exactitude équilibrée et AUC sur des cas construits."""
        reels = [10, 20, 30, 40]
        self.assertEqual(exactitude_equilibree([10, 20, 30, 40], reels, 25), 1.0)
        self.assertEqual(exactitude_equilibree([30, 30, 30, 30], reels, 25), 0.5)
        self.assertEqual(auc([1, 2, 3, 4], reels, 25), 1.0)
        self.assertEqual(auc([1, 1, 1, 1], reels, 25), 0.5)
        self.assertEqual(quantile([1, 2, 3, 4, 5], 0.5), 3)

    def test_toutes_les_mesures_ont_bandes_ou_statut(self):
        """[mesure:robustesse] [mesure:lacunes] [mesure:couverture] [mesure:reve_fixe] [mesure:echelle_bots]
        [mesure:coordination] [mesure:fins] Chaque mesure a une étiquette et, si elle juge, des bandes."""
        for k, spec in MESURES.items():
            self.assertIn(spec["etiquette"], ("mesure", "indice", "humain seulement"), k)
            if "vert" in spec:
                self.assertTrue(spec["rouge"], k)


class TestRevisions(unittest.TestCase):
    """Révisions du 12 oct., après le passage des témoins (docs/mesures.md)."""

    def test_reve_fixe_extreme_aussi_bon(self):
        """[mesure:reve_fixe] Un optimum intermédiaire qui ne bat pas un extrême au-delà de la marge : rouge."""
        def p(taux, pct):
            return {"exp": "reves", "etiquette": f"taux:{taux}", "pct": pct, "fin": "sommeil"}
        parties = [p(0.0, x) for x in (60, 62, 61, 63)] + [p(2.0, x) for x in (90, 92, 91, 93)] + \
                  [p(3.0, x) for x in (89, 93, 90, 92)]
        r = mesures_reves(parties, "v1", "defaut")["reve_fixe"]
        self.assertEqual(r["meilleur"], 2.0)
        self.assertEqual(r["extremes_aussi_bons"], [3.0])
        self.assertEqual(r["verdict"], "rouge")
        parties = [p(0.0, x) for x in (60, 62, 61, 63)] + [p(2.0, x) for x in (90, 92, 91, 93)] + \
                  [p(3.0, x) for x in (70, 72, 71, 73)]
        self.assertEqual(mesures_reves(parties, "v1", "defaut")["reve_fixe"]["verdict"], "vert")

    def test_sondes_issues_toutes_egales(self):
        """[mesure:predictibilite] [mesure:incertitude] Toutes les issues égales et annoncées par les
        copies : partie jouée d'avance (100 %), plus d'incertitude (0)."""
        r = {"exp": "tables", "etiquette": "equipe", "peuples": ["oiseaux", "humains"], "pct": 100.0,
             "sondes": {"t2": [100.0, 100.0], "t5": [100.0, 100.0]}}
        out = mesures_sondes([dict(r), dict(r)])
        self.assertEqual(out["predictibilite"]["valeur"], 100.0)
        self.assertEqual(out["predictibilite"]["verdict"], "rouge")
        self.assertEqual(out["incertitude"]["valeur"], 0.0)


class TestConformiteMesures(unittest.TestCase):
    def test_chaque_mesure_a_code_test_temoin(self):
        """[mesure:temoins] Contrôle de conformité des mesures (python -m foret.conformite --mesures)."""
        import os
        from foret.conformite import RACINE, matrice_mesures
        _, _, sans_test, sans_temoin, orphelins, attente, sans_code = matrice_mesures(
            os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
        self.assertEqual((sans_test, sans_temoin, orphelins, sans_code), ([], [], [], []))
        self.assertEqual(sorted(attente), ["chef", "dilemmes", "gain_libre", "tape_taupe"])


class TestBatterie(unittest.TestCase):
    """La chaîne complète sur quelques parties : de la tâche au rapport."""

    @classmethod
    def setUpClass(cls):
        cls.parties = []
        for exp, eq, bots, et, g, son in [
            ("tables", ["oiseaux", "mammiferes"], [G0, G0], "equipe", 0, True),
            ("tables", ["oiseaux", "mammiferes"], [G0, G0], "equipe", 1, False),
            ("tables", ["oiseaux", "humains"], [G0, G0], "equipe", 0, True),
            ("tables", ["oiseaux", "humains", "entites"], [G0] * 3, "equipe", 0, False),
            ("spectateur", ["oiseaux", "humains"], [G0, {"type": "aleatoire"}], "hasard:humains", 0, False),
            ("spectateur", ["oiseaux", "humains"], [{"type": "aleatoire"}, G0], "hasard:oiseaux", 0, False),
            ("spectateur", ["oiseaux", "humains"], [G0, {"type": "inerte"}], "inerte:humains", 0, False),
            ("spectateur", ["oiseaux", "humains"], [{"type": "inerte"}, G0], "inerte:oiseaux", 0, False),
            ("reves", ["oiseaux", "humains"], [G0, G0], "taux:0.0", 0, False),
            ("reves", ["oiseaux", "humains"], [G1, G1], "taux:1.0", 0, False),
            ("echelle", ["oiseaux", "humains"], [{"type": "aleatoire"}] * 2, "aleatoire", 0, False),
            ("echelle", ["oiseaux", "humains"], [G0, G0], "glouton", 0, False),
        ]:
            cls.parties.append(jouer(dict(maquette="v1", variante="defaut", exp=exp, peuples=eq, bots=bots,
                                          graine=g, etiquette=et, sondes=son, copies=3)))

    def test_rapport_partiel(self):
        """[mesure:plancher] [mesure:fins_precoces] [mesure:tactiques] [mesure:spectateur] [mesure:reve_fixe]
        [mesure:echelle_bots] [mesure:pire_table] [mesure:predictibilite] [mesure:couverture]"""
        self.assertFalse([r for r in self.parties if "erreur" in r])
        ref = [r for r in self.parties if r["exp"] == "tables"]
        out = mesures_parties(ref, "v1", "defaut")
        for k in ("concentration", "surprise", "fins", "fins_precoces", "plancher", "tactiques", "duree",
                  "forcees", "couverture", "apprentissage", "menace_croissante"):
            self.assertIn(k, out)
        self.assertIn(out["plancher"]["verdict"], ("vert", "orange", "rouge"))
        self.assertIn("pire_table", mesures_equipes(self.parties, "v1", "defaut"))
        sp = mesures_spectateur(self.parties)["spectateur"]
        self.assertEqual(set(sp["impact_points"]), {"oiseaux", "humains"})
        self.assertIn("au_hasard", sp)
        self.assertEqual(mesures_reves(self.parties, "v1", "defaut")["reve_fixe"]["maximum_teste"], 1.0)
        self.assertIn("echelle_bots", mesures_echelle(self.parties))
        self.assertIn("predictibilite", mesures_sondes(self.parties))
        self.assertEqual(mesures_coordination(self.parties, "defaut"), {})


if __name__ == "__main__":
    unittest.main()
