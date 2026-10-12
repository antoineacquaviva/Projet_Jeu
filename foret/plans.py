"""Les plans du Méchant de la maquette v2 (moteur 1.3).

Mixin de Partie : tout ce qui transforme deux dés en ordre quand la maquette
n'utilise pas la piste unique de la v1 (regles.plan = "qui_ou" ou "ou_comment").
La piste unique (v1) reste dans moteur.py, inchangée.

Les renvois [v2:<nœud>] désignent les nœuds de l'atelier v2 (docs/noeuds_v2.md) :
- [v2:A2a] deux pistes, qui et où : la somme désigne une tactique, l'écart une
  Machine sur la piste des Machines ; la Machine agit dans son rayon ;
- [v2:A2a_d] le doublé (favori, branle-bas, il hésite, sixième Machine) ;
- [v2:A2b] deux pistes, où et comment : l'écart désigne une manœuvre ;
- [v2:A3] les tactiques dans le rayon ; [v2:A4] l'escalade du soir.

Un ordre interprété est un dict « info » :
  des, case (somme), tuile, ecart, action, machine, cible, machines (branle-bas),
  case_machine (piste des Machines) ou case_manoeuvre et manoeuvre (où et comment).
action : "reve" (esprit tiré), "hesite", "vide" (case sans Machine), "rien"
(Machine HS, réglage rien), "entrer", "remorquer", "reparer_organe",
"tactique", "branle_bas", "manoeuvre".
"""
from collections import Counter

from .chantier import CHANTIER, ORDRE_REPARATION
from .criteres import CRITERES
from .erreurs import FinDePartie

DES = [(a, b) for a in range(1, 7) for b in range(1, 7)]
PAIRES = [((a, b), 1 if a == b else 2) for a in range(1, 7) for b in range(a, 7)]   # 21 paires et leur poids sur 36


class Plans:
    # ------------------------------------------------------------------ mise en place
    def _init_pistes_v2(self):
        """[v2:A2a] piste des Machines : chaque Machine sur la case de son numéro
        (case 0 : la sixième Machine). [v2:A2b] piste des manœuvres, cases 0 à 5."""
        self.piste_m = {}
        self.manoeuvres = {}
        plan = self.R["plan"]
        if plan == "qui_ou":
            for k in range(1, 6):
                self.piste_m[k] = next((m for m in self.machines if m.numero == k and m is not self.sixieme), None)
            if self.sixieme is not None:
                self.piste_m[0] = self.sixieme
        elif plan == "ou_comment":
            from .moteur import Tuile
            for k, nom in enumerate(self.M["manoeuvres"]["disposition"]):
                self.manoeuvres[k] = Tuile("manoeuvre", nom, self._uid_suivant())

    # ------------------------------------------------------------------ lecture des dés
    def interpreter(self, d, compter=True):
        """Ordre que donnent les dés d = (a, b), lu sur l'état actuel, sans effet."""
        a, b = d
        s, g = a + b, abs(a - b)
        tuile = self.piste[s]
        info = {"des": d, "case": s, "tuile": tuile, "ecart": g, "action": None,
                "machine": None, "cible": None, "machines": []}
        if tuile.genre == "esprit":
            info["action"] = "reve"
            return info
        if self.R["plan"] == "ou_comment":
            return self._interpreter_ou_comment(info, compter)
        return self._interpreter_qui_ou(info, compter)

    def _double(self):
        """[v2:A2a_d] [v2:A4] : l'escalade change le doublé en branle-bas."""
        esc = self.R["escalade"]
        if esc is not None and self.tour >= esc:
            return "branle_bas"
        return self.R["double"]

    def _interpreter_qui_ou(self, info, compter):
        """[v2:A2a]"""
        g = info["ecart"]
        case_m = g
        if g == 0:                       # [v2:d_fav] [v2:d_bb] [v2:d_hes] [v2:d_six]
            mode = self._double()
            if mode == "hesite":
                info["action"] = "hesite"
                return info
            if mode == "branle_bas":
                info["action"] = "branle_bas"
                info["machines"] = [self.piste_m[k] for k in sorted(self.piste_m)
                                    if self.piste_m[k] is not None and self.piste_m[k].tourne]
                return info
            case_m = 1 if mode == "favori" else 0
        info["case_machine"] = case_m
        m = self.piste_m.get(case_m)
        if m is None:
            info["action"] = "vide"
            return info
        info["machine"] = m
        if m.etat == "reserve":
            info["action"], info["cible"] = "entrer", m.entree
        elif m.etat != "plateau":
            info["action"] = "vide"
        elif m.hs:
            info["action"] = {"remorquee": "remorquer", "organe": "reparer_organe",
                              "rien": "rien"}[self.R["machine_hs_designee"]]
        else:
            info["action"] = "tactique"
            info["cible"] = self.cible_pour(info["tuile"], m, compter)
        return info

    def _interpreter_ou_comment(self, info, compter):
        """[v2:A2b] la tactique vise une zone sur tout le plateau ; l'écart donne
        la manœuvre ; la Machine en marche la plus proche l'exécute."""
        man = self.manoeuvres[info["ecart"]]
        info["action"], info["manoeuvre"], info["case_manoeuvre"] = "manoeuvre", man, info["ecart"]
        if man.nom in ("Reparer", "Renfort"):
            return info
        if compter:
            info["cible"] = self.cible(info["tuile"])
            info["machine"] = self.machine_pour(info["cible"])
        else:
            with self.muet():
                info["cible"] = self.cible(info["tuile"])
                info["machine"] = self.machine_pour(info["cible"])
        return info

    # ------------------------------------------------------------------ tactiques
    def cible_pour(self, tuile, m, compter=True):
        """Zone choisie par la tactique pour la Machine m : dans son rayon
        ([v2:A3]) ou sur tout le plateau (portée plateau, critères v1)."""
        if self.R["portee"] == "rayon":
            return self.cible_rayon(tuile, m, compter)
        if compter:
            return self.cible(tuile)
        with self.muet():
            return self.cible(tuile)

    def rayon(self, m):
        """[v2:A2a] sa zone et les zones voisines qui ont encore de la forêt."""
        P = self.plateau
        return [z for z in [m.zone] + P.tries(P.adj[m.zone]) if P.foret[z] > 0]

    def cible_rayon(self, tuile, m, compter=True):
        """[v2:A3] Cupidité : la plus boisée ; Opportunisme : la moins défendue ;
        Représailles : la plus défendue (ou la dernière zone du rayon attaquée) ;
        Percée : la flèche de sa zone (au cœur, sa zone). Égalité : sa zone si
        elle en est, puis la plus boisée, puis le plus petit numéro."""
        P = self.plateau
        R = self.rayon(m)
        if not R:
            if compter:
                self.lacune("rayon_sans_foret", m.nom)
            return m.zone
        spec = tuile.spec
        crit = spec["critere"]
        if crit == "devant_la_plus_avancee":
            f = P.fleches.get(m.zone)
            if f is None:
                return m.zone
            if f not in R:
                if compter:
                    self.lacune("percee_rasee", f"{m.zone}->{f}")
                return m.zone
            return f
        if crit == "derniere_attaque":
            cands = [z for z, _, _ in reversed(self.attaques) if z in R][:1]
            if not cands:
                if compter:
                    self.lacune("represailles_sans_attaque")
                cands = CRITERES[spec.get("params", {}).get("repli") or "plus_boisee"](self, R, {})
        else:
            cands = CRITERES[crit](self, R, spec.get("params", {}))
        if not cands:
            return m.zone
        if m.zone in cands:
            return m.zone
        if len(cands) > 1 and compter:
            self.lacune("egalite_rayon", cands)
        best = max(P.foret[z] for z in cands)
        return min((z for z in cands if P.foret[z] == best), key=P.numero.get)

    # ------------------------------------------------------------------ menace
    def zones_menacees(self, info):
        """Forêts que cet ordre abattrait, par zone, sans tenir compte des
        barrages ni des embuscades. Lecture sans effet."""
        out = Counter()
        if info is None:
            return out
        P = self.plateau
        if self.R["plan"] == "une_piste" or "action" not in info:
            m = info.get("machine")
            if info["tuile"].genre != "tactique" or m is None:
                return out
            n = self.pas_suivant(m, info["cible"], avec_barrages=False, compter=False)
            z = n or m.zone
            if P.foret[z] > 0:
                out[z] += 1
            return out
        a = info["action"]
        if a == "tactique":
            m = info["machine"]
            z = info["cible"] if self.R["portee"] == "rayon" else \
                (self.pas_suivant(m, info["cible"], avec_barrages=False, compter=False) or m.zone)
            if z is not None and P.foret[z] > 0:
                out[z] += 1
        elif a == "branle_bas":
            for m in info["machines"]:
                z = self.cible_pour(info["tuile"], m, compter=False) if self.R["portee"] == "rayon" else \
                    (self.pas_suivant(m, self.cible_pour(info["tuile"], m, False), avec_barrages=False,
                                      compter=False) or m.zone)
                if P.foret[z] > 0:
                    out[z] += 1
        elif a == "manoeuvre":
            nom, m = info["manoeuvre"].nom, info["machine"]
            if m is None or nom in ("Reparer", "Renfort"):
                return out
            z = m.zone
            pas = {"Avancer": 1, "Encercler": 1, "Foncer": 2, "Raser": 0}[nom]
            for _ in range(pas):
                n = self.pas_suivant_depuis(z, info["cible"])
                if n is None:
                    break
                z = n
            if P.foret[z] > 0:
                out[z] += 2 if nom == "Raser" and P.foret[z] >= 2 else 1
        return out

    def pas_suivant_depuis(self, z, cible):
        """Pas vers la cible depuis une zone, sans barrages (lecture)."""
        if z == cible or cible is None:
            return None
        D = self.plateau.dist
        nexts = [n for n in self.plateau.adj[z] if D[n][cible] == D[z][cible] - 1]
        return self.departager(nexts, compter=False) if nexts else None

    def prevision_v2(self):
        menace = Counter()
        with self.muet():
            for d, w in PAIRES:
                for z, n in self.zones_menacees(self.interpreter(d, compter=False)).items():
                    menace[z] += n * w / 36
        return menace

    # ------------------------------------------------------------------ exécution
    def _bloquee(self, z):
        return z in self.ee.barres or self.zone_tenue(z)

    def executer_v2(self, info):
        """Rend True (l'ordre a eu un effet), False, ou None (rien n'apprend)."""
        a = info["action"]
        if a == "hesite":
            self.stat("doubles_hesites")
            self.log("  doublé : le Méchant hésite")
            return None
        if a in ("vide", "rien"):
            self.stat("ordres_sans_machine" if a == "vide" else "machine_hs_laissee")
            return False
        if a == "entrer":
            return self._entrer(info["machine"])
        if a == "remorquer":
            m = info["machine"]
            m.etat, m.zone, m.egaree = "reserve", None, False
            for o in m.organes:
                m.organes[o] = False
            self.stat("remorquages")
            self.log(f"  {m.nom} est remorquée au chantier, remise en état")
            return True
        if a == "reparer_organe":
            m = info["machine"]
            o = next(o for o in ORDRE_REPARATION if m.organes.get(o))
            m.organes[o] = False
            if o == "phares":
                m.egaree = False
            self.stat("reparations")
            self.log(f"  {m.nom} : {o} réparé")
            return True
        if a == "tactique":
            return self._executer_tactique(info["machine"], info["cible"], info)
        if a == "branle_bas":
            self.stat("branle_bas")
            coupe = False
            for m in info["machines"]:
                if not m.tourne:
                    continue
                cible = self.cible_pour(info["tuile"], m)
                coupe |= bool(self._executer_tactique(m, cible, info))
            return coupe
        if a == "manoeuvre":
            return self._executer_manoeuvre(info)
        raise AssertionError(a)

    def _entrer(self, m):
        """[v2:A2a] Machine au chantier désignée : elle entre par sa zone d'entrée."""
        z = m.entree
        if self.immobilisee(m):
            self.lacune("ordre_contre_immobile", m.nom)
            return False
        if self._bloquee(z):
            self.stat("bloquee_par_barrage")
            self.log(f"  {m.nom} ne peut pas entrer en {z} : barrage")
            return False
        m.etat, m.zone = "plateau", z
        self.stat("entrees")
        self.log(f"  {m.nom} entre en {z}")
        return True

    def _executer_tactique(self, m, cible, info):
        if not m.tourne:
            self.stat("machine_hs_avant_ordre")
            return False
        if self.immobilisee(m):
            self.lacune("ordre_contre_immobile", m.nom)
            self.log(f"  {m.nom} est immobilisée")
            return False
        if self.R["portee"] != "rayon":                    # [v2:A2a] portée plateau : comme la v1
            return self.executer({"tuile": info["tuile"], "case": info["case"], "cible": cible, "machine": m})
        if cible != m.zone:                                # [v2:A2a] elle entre dans la zone choisie
            if self.R["barrage_sortie"] and m.zone in self.ee.barres:   # [v2:B2]
                self.stat("bloquee_par_barrage")
                self.log(f"  {m.nom} ne peut pas sortir de sa zone barrée")
                return False
            if cible in self.ee.barres:
                self.stat("bloquee_par_barrage")
                self.log(f"  {m.nom} ne peut pas entrer en {cible} : barrage")
                return False
            if self.R["effets_organes"] and m.organes.get("chenilles"):
                return False
            if not self._avancer(m, cible):
                return False
        return self._abattre(m, cible)

    def _executer_manoeuvre(self, info):
        """[v2:A2b]"""
        nom, m, cible = info["manoeuvre"].nom, info["machine"], info["cible"]
        self.stat("manoeuvre_" + nom)
        if nom == "Reparer":
            return CHANTIER["reparer"](self, {"hs": True})
        if nom == "Renfort":
            return CHANTIER["renfort"](self, {})
        if m is None:
            self.lacune("sans_machine")
            return False
        if not m.tourne:
            self.stat("machine_hs_avant_ordre")
            return False
        if nom == "Encercler":
            for x in self.machines_tournantes():
                if x is not m and not self.immobilisee(x) and not (self.R["barrage_sortie"] and x.zone in self.ee.barres):
                    n = self.pas_suivant(x, cible)
                    if n is not None:
                        self._avancer(x, n)
            m = self.machine_pour(cible) or m
            return self.executer({"tuile": info["tuile"], "case": info["case"], "cible": cible, "machine": m})
        if nom == "Avancer":
            return self.executer({"tuile": info["tuile"], "case": info["case"], "cible": cible, "machine": m})
        if self.immobilisee(m):
            self.lacune("ordre_contre_immobile", m.nom)
            return False
        if nom == "Raser":
            ok = self._abattre(m, m.zone)
            if ok:
                self._abattre(m, m.zone)
            return ok
        # Foncer : deux pas, puis abattre
        for _ in range(2):
            if m.zone == cible:
                break
            if self.R["barrage_sortie"] and m.zone in self.ee.barres:
                self.stat("bloquee_par_barrage")
                return False
            n = self.pas_suivant(m, cible)
            if n is None:
                self.stat("bloquee_par_barrage")
                return False
            if not self._avancer(m, n):
                return False
        return self._abattre(m, cible)

    # ------------------------------------------------------------------ apprentissage
    def apprendre_ordinale(self, piste, case, reussite, nom):
        """[v2:A2a] [v2:A2b] Piste des Machines ou des manœuvres : réussite, vers la
        case 1 (en 1, reste ; en 0, passe en 1) ; échec, vers la case 5 (en 5 et
        en 0, reste)."""
        if not self.R["apprentissage"]:                    # [mesure:temoins] le Méchant n'apprend plus
            self.stat("apprentissage_coupe")
            return
        if reussite:
            dest = None if case == 1 else (1 if case == 0 else case - 1)
        else:
            dest = None if case in (0, 5) else case + 1
        if dest is None:
            self.stat(f"apprentissage_{nom}_sans_mouvement")
            return
        piste[case], piste[dest] = piste.get(dest), piste[case]
        self.stat(f"echanges_piste_{nom}")
        self.log(f"  piste des {nom} : case {case} -> {dest}")

    def executer_et_apprendre_v2(self, info):
        avant = self.plateau.total
        reussite = self.executer_v2(info)
        self._noter_ordre(info, reussite, avant)
        if reussite is None:                               # il hésite : rien n'apprend
            return
        self.stat("ordres_reussis" if reussite else "ordres_echoues")
        for s in self.ee.trompeurs:                        # R6.9 : le verdict des deux tuiles
            if self.decider(s, "tromper", [False, True], reussite=reussite):
                reussite = not reussite
                self.stat("tromperies")
                self.log("  tromperie : le résultat appris est inversé")
                break
        tuile, case = info["tuile"], info["case"]
        if self.piste[case] is not tuile:
            ou = [c for c in self.piste if self.piste[c] is tuile]
            self.lacune("tuile_deplacee_avant_apprentissage", f"{tuile} {case}->{ou}")
            case = ou[0] if ou else None
        if case is not None:
            self.apprendre(case, reussite)
        if info["action"] == "branle_bas":                 # [v2:A2a_d] seule la tactique apprend
            return
        if info.get("case_machine") is not None and self.piste_m.get(info["case_machine"]) is not None:
            m = info["machine"]
            c = next((k for k, x in self.piste_m.items() if x is m), None)
            if c is not None:
                self.apprendre_ordinale(self.piste_m, c, reussite, "machines")
        elif info.get("case_manoeuvre") is not None:
            t = info["manoeuvre"]
            c = next(k for k, x in self.manoeuvres.items() if x is t)
            self.apprendre_ordinale(self.manoeuvres, c, reussite, "manoeuvres")

    def zones_de_l_ordre(self, info):
        """Pour l'embuscade (R6.6) : [(Machine, zones où elle est ou va entrer)]."""
        out = []
        if info is None:
            return out
        a = info.get("action")
        if a == "tactique":
            m = info["machine"]
            dest = info["cible"] if self.R["portee"] == "rayon" else \
                self.pas_suivant(m, info["cible"], compter=False)
            out.append((m, {m.zone} | ({dest} if dest else set())))
        elif a == "entrer":
            out.append((info["machine"], {info["machine"].entree}))
        elif a == "branle_bas":
            for m in info["machines"]:
                out.append((m, {m.zone, self.cible_pour(info["tuile"], m, compter=False)}))
        elif a == "manoeuvre" and info["machine"] is not None:
            m = info["machine"]
            n = self.pas_suivant(m, info["cible"], compter=False)
            out.append((m, {m.zone} | ({n} if n else set())))
        return out

    def dernier_sursaut_v2(self):
        """[v2:D6] le Méchant se débat : ses plans s'exécutent encore, jusqu'à un esprit."""
        for _ in range(self.R["sursaut_max"] or 0):
            d = self.lancer_des()
            info = self.interpreter(d)
            if info["action"] == "reve":
                break
            self.stat("ordres_sursaut")
            try:
                self.executer_v2(info)
            except FinDePartie:
                break
