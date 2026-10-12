"""Bot glouton : heuristique d'une seule étape, sans anticipation.

Saboter si c'est possible et légal ; sinon barrer la zone la plus menacée ;
sinon se tenir près d'une Machine pour servir d'allié. Envoie un nombre
réglable de cartes en rêve par tour. C'est le bot du moteur v0, porté sur
l'interface de décision ; ses paramètres permettent déjà de varier un peu
son style (voir PARAMS).

Moteur 1.2 (R2.5, R2.6), deux options, coupées pour rejouer la référence 1.0 :
- communique :
  "non" : il ne pose ni trace ni jeton ;
  "annonce" (par défaut) : au conseil, il annonce ses intentions (traces : où
  il compte saboter, rêver ou barrer ; partage : la Machine qu'il peut saboter
  seul, ou celle qu'un spécialiste tient déjà), mais n'utilise pas celles des
  autres ;
  "complet" : en plus, à la résolution, il compte sur les alliés annoncés pour
  l'étape (traces datées, jetons du partage) pour saboter, et, quand rien n'est
  menacé là où il est, rejoint la zone d'une Machine qu'un autre a annoncée.
  Mesuré le 12 oct. (duos, maquette v1) : « complet » perd 3 à 5 points de
  forêt sur « annonce » ; coordonner les sabotages coûte de la forêt quand
  Barrer domine. D'où le défaut « annonce » : avec ce bot, la forme de
  communication ne change pas le résultat (la mesure attend le bot fort) ;
- des_connus : quand les dés de l'étape sont connus (présage, Voir), la menace
  de l'étape est celle de l'ordre annoncé, et non une moyenne sur les dés.
Il ne lit pas les mains ni les programmes visibles en « tout dire ».

Moteur 1.3 (maquette v2) :
- voie (« auto », « sommeil » ou « reveil ») : quand un rêve choisit sa voie
  [v2:D2v_choix], « auto » prend la voie la plus proche de sa fin (cases qui
  manquent au Cercle contre pas de l'esprit le plus avancé jusqu'au 7) ;
- les lunes [v2:D5] : il prend une lune au centre si son plan du tour prévoit
  un rêve, la rend sinon ; il n'en prend jamais devant un autre joueur ;
- la menace se lit avec le plan de la maquette (partie.zones_menacees).
"""
from collections import Counter

from .base import Bot, BOTS
from ..erreurs import ErreurMoteur


@BOTS("glouton")
class Glouton(Bot):
    nom = "glouton"
    PARAMS = {
        "reves_par_tour": 0.0,   # cartes en rêve par tour (fraction = probabilité)
        "garde": 2,              # cartes à garder en main au minimum
        "voir": True,            # oiseaux : engager une carte en Voir à l'étape 1
        "hanter": True,          # entités : utiliser Hanter dès que possible
        "seuil_menace": 0.15,    # menace au-delà de laquelle on reste ou on va défendre
        # moitiés préférées quand aucune Machine n'est à portée, par nom de pouvoir
        "preferences": ["attendre", "hanter", "tromper"],
        "presence": "menace",    # mise en place : "menace" ou "hasard"
        "communique": "annonce", # "non", "annonce" ou "complet" (R2.5, voir plus haut)
        "des_connus": True,      # se servir des dés déjà vus pour l'étape en cours (R2.6, R6.2)
        "voie": "auto",          # [v2:D2v_choix] "auto", "sommeil" ou "reveil"
    }

    def __init__(self, graine=0, **params):
        super().__init__(graine, **params)
        self._plan = {}
        c = {False: "non", True: "complet"}.get(self.p["communique"], self.p["communique"])
        if c not in ("non", "annonce", "complet"):
            raise ErreurMoteur(f"glouton : communique = {c!r} (non, annonce, complet)")
        self._annonce, self._lit = c != "non", c == "complet"

    # ---------------------------------------------------------------- outils
    def _machines_a_portee(self, partie, siege):
        """Machines en marche, dans une zone de présence ou voisine, dont un
        organe que ce peuple sabote seul est intact."""
        org = partie.organes_specialiste(siege.peuple)
        if not org:
            return []
        zs = set(partie.zones_presence(siege.peuple))
        zs |= {n for z in list(zs) for n in partie.plateau.adj[z]}
        return [m for m in partie.machines_tournantes()
                if m.zone in zs and any(o in m.organes and not m.organes[o] for o in org)]

    def _sabotages_legaux(self, partie, jeu, options):
        allies = {k.zone for k in partie.ee.actifs if k.carte.peuple != jeu.carte.peuple}
        if self._lit:
            allies |= self._zones_annoncees(partie, jeu.siege, jeu.etape)
        return [o for o in options if o[0] == "saboter"
                and (partie.peut_saboter_seul(jeu, o[3]) or o[1] in allies)]

    def _zones_annoncees(self, partie, idx, etape):
        """Zones où un autre joueur a annoncé agir à cette étape : trace datée de
        cette étape, ou jeton du partage (la Machine dont il s'occupe ce tour).
        Une trace non datée (conseil parlé) ne dit pas l'étape : il n'en tient
        pas compte pour une alliance."""
        return {g["lieu"] for g in partie.signes()
                if g["siege"] != idx and g["lieu"] != "reve"
                and (g["etape"] == etape or (g["etape"] is None and g["machine"] is not None))}

    def _menace(self, partie):
        """Menace de l'étape en cours : l'ordre annoncé si les dés sont connus."""
        if self.p["des_connus"] and partie.etape:
            info = partie.ordre_connu(partie.etape)
            if info is not None:
                with partie.muet():
                    return Counter({z: float(n) for z, n in partie.zones_menacees(info).items()})
        return partie.prevision()

    def _intentions(self, partie, siege, datees):
        """Ce que le glouton annonce : [(étape ou None, lieu)], le plus utile d'abord."""
        plan = self._plan_du_tour(partie, siege)
        sab, rev, defense = [], [], []
        menace = partie.prevision()
        a_portee = self._machines_a_portee(partie, siege)
        mien = partie.zones_presence(siege.peuple)
        for e in sorted(plan):
            _, mode, hote = plan[e]
            if hote is not None:
                continue
            if mode == "reve":
                rev.append((e, "reve"))
            elif a_portee and mode == partie.moitie(siege.peuple, "machines"):
                sab.append((e, a_portee[0].zone))
            elif mien:
                z = max(mien, key=lambda x: (menace[x], -partie.plateau.numero[x]))
                if menace[z] > 0:
                    defense.append((menace[z], e, z))
        out = sab + rev + [(e, z) for _, e, z in sorted(defense, key=lambda t: -t[0])]
        if not datees:
            vus, nd = set(), []
            for _, z in out:
                if z not in vus:
                    vus.add(z)
                    nd.append((None, z))
            out = nd
        return out

    def _mode(self, partie, siege):
        p = siege.peuple
        if not partie.R["pouvoirs"]:
            return "haut"
        mach = partie.moitie(p, "machines")
        if mach and self._machines_a_portee(partie, siege):
            return mach
        spec = partie.M["peuples"][p]
        for pref in self.p["preferences"]:
            if pref == "hanter" and not self.p["hanter"]:
                continue
            for m in ("haut", "bas"):
                if spec[m].get("pouvoir") == pref:
                    return m
        return partie.moitie(p, "plateau") or "haut"

    def _nb_reves(self, siege):
        r = self.p["reves_par_tour"]
        k = int(r) + (1 if self.rng.random() < r - int(r) else 0)
        return max(0, min(k, len(siege.main) - self.p["garde"]))

    def _planifier(self, partie, siege):
        main = list(siege.main)
        k = self._nb_reves(siege)
        cap = partie.R["reves_par_joueur_et_tour"]
        if cap is not None:
            k = min(k, cap)
        autres = sorted((s for s in partie.sieges if s.idx != siege.idx), key=lambda s: -len(s.main))
        plan = {}
        for e in partie.etapes:
            if siege.idx in partie.prog[e]:          # carte de Voir
                continue
            if not main:
                break
            c = main.pop(0).uid          # par identifiant : le plan reste valable dans une copie
            if k > 0:
                plan[e] = (c, "reve", None)
                k -= 1
                continue
            mode = self._mode(partie, siege)
            hote = None
            spec = partie.M["peuples"][siege.peuple][mode]
            if spec.get("pouvoir") == "s_unir" and partie.R["pouvoirs"] and autres:
                hote = autres[0].idx
            plan[e] = (c, mode, hote)
        return plan

    def _plan_du_tour(self, partie, siege):
        cle = (partie.lignee, partie.tour, siege.idx)
        if cle not in self._plan:
            self._plan = {cle: self._planifier(partie, siege)}
        return self._plan[cle]

    # ---------------------------------------------------------------- décisions
    def d_trace(self, partie, siege, options, ronde, rang, anciennes):
        if not self._annonce:
            return None
        datees = any(o is not None and o[0] is not None for o in options)
        voulues = self._intentions(partie, siege, datees)
        deja = set(partie.traces.get(siege.idx, ()))
        for t in voulues:
            if t not in deja:
                return t if t in options else None
        return None

    def d_partage(self, partie, siege, options, ronde):
        if not self._annonce:
            return None
        prises = [o for o in options if o is not None and o[0] == "prendre"]
        if not prises:
            return None
        a_portee = {m.uid for m in self._machines_a_portee(partie, siege)}
        specialistes = {s.idx for s in partie.sieges if partie.organes_specialiste(s.peuple)}

        def score(o):
            _, u, src = o
            if u in a_portee:                               # je peux la saboter seul
                return 3 if src == "centre" else (2 if src not in specialistes else -1)
            m = partie.machine(u)
            proche = set(partie.zones_presence(siege.peuple))
            proche |= {n for z in list(proche) for n in partie.plateau.adj[z]}
            tenu_par_specialiste = any(x in specialistes for x in partie.jetons[u] if x is not None)
            if m.zone in proche and tenu_par_specialiste and src == "centre":
                return 1                                    # servir d'allié
            return -1
        meilleur = max(prises, key=score)
        return meilleur if score(meilleur) > 0 else None

    def d_presence(self, partie, siege, options, pion):
        if self.p["presence"] == "hasard":
            return self.rng.choice(options)
        menace = partie.prevision()
        mien = partie.presence[siege.peuple]
        return max(options, key=lambda z: (menace[z] - 0.2 * mien[z], -partie.plateau.numero[z]))

    def d_voir(self, partie, siege, options, etape):
        if self.p["voir"] and etape == partie.etapes[0] and len(siege.main) >= 4:
            return siege.main[0]
        return None

    def d_programmer_carte(self, partie, siege, options, etape):
        prevu = self._plan_du_tour(partie, siege).get(etape)
        if not prevu:
            return None
        return next((o for o in options if o is not None and o.uid == prevu[0]), None)

    def d_programmer_mode(self, partie, siege, options, etape, carte):
        prevu = self._plan_du_tour(partie, siege).get(etape)
        if prevu and prevu[1] in options:
            return prevu[1]
        mode = self._mode(partie, siege)
        if mode in options:
            return mode
        return next((o for o in options if o != "reve"), options[0])

    def d_hote(self, partie, siege, options, etape):
        prevu = self._plan_du_tour(partie, siege).get(etape)
        return prevu[2] if prevu and prevu[2] in options else None

    def d_reve(self, partie, siege, options, source):
        sommeil = [o for o in options if o[0] != "reveil"]
        if ("reveil",) in options:                       # [v2:D2v_choix] choisir sa voie
            v = self.p["voie"]
            if v == "auto":
                manque = partie.capacite_cercle() - len(partie.cercle)
                es = [c for c in partie.esprits() if c > 7]
                pas = min(c - 7 for c in es) if es else 6
                v = "reveil" if manque <= pas or not sommeil else "sommeil"
            if v == "reveil" or not sommeil:
                return ("reveil",)
        avancees = [o for o in sommeil if o[0] == "avancer"]
        if avancees:
            return min(avancees, key=lambda o: abs(o[1] - 7))
        return sommeil[0]

    def d_lune(self, partie, siege, options, ronde):
        """[v2:D5]"""
        veut = any(m == "reve" for _, m, _ in self._plan_du_tour(partie, siege).values())
        if veut and ("prendre", "centre") in options:
            return ("prendre", "centre")
        if not veut and ("rendre",) in options:
            return ("rendre",)
        return None

    def d_aller(self, partie, siege, options, jeu):
        reels = [o for o in options if o is not None]
        if not reels:
            return None
        if self._sabotages_legaux(partie, jeu, partie.options_agir(jeu)):
            return None
        menace = self._menace(partie)
        seuil = self.p["seuil_menace"]
        ici = set(partie.zones_presence(siege.peuple))
        if any(menace[z] > seuil for z in ici):
            return None
        if self._lit:                                    # rien à défendre ici : rejoindre un allié annoncé
            rejoindre = self._zones_a_rejoindre(partie, siege, jeu)
            cands = [o for o in reels if o[2] in rejoindre]
            if cands and not rejoindre & ici:
                return cands[0]
        cibles = {m.zone for m in self._machines_a_portee(partie, siege)} - ici
        if not cibles:
            cibles = {z for z in menace if menace[z] > seuil} - ici
        cands = [o for o in reels if o[2] in cibles]
        if not cands:
            return None
        return max(cands, key=lambda o: (menace[o[2]] - menace[o[1]], -partie.plateau.numero[o[2]]))

    def _zones_a_rejoindre(self, partie, siege, jeu):
        """Zones d'une Machine en marche où un autre joueur a annoncé agir à
        cette étape : y être présent fait de lui un saboteur avec allié."""
        zm = {m.zone for m in partie.machines_tournantes()}
        return self._zones_annoncees(partie, siege.idx, jeu.etape) & zm

    def d_action(self, partie, siege, options, jeu):
        sab = self._sabotages_legaux(partie, jeu, options)
        if sab:
            def restant(o):
                return sum(1 for n in partie.machine(o[2]).organes.values() if not n)
            return min(sab, key=restant)
        menace = self._menace(partie)
        barrer = [o for o in options if o[0] == "barrer"]
        if self._lit and not any(menace[o[1]] > self.p["seuil_menace"] for o in barrer):
            rejoindre = self._zones_a_rejoindre(partie, siege, jeu)    # rien d'urgent : servir d'allié
            ici = [o for o in options if o[0] in ("barrer", "soutenir") and o[1] in rejoindre]
            if ici:
                return ici[0]
        if barrer:
            meilleur = max(barrer, key=lambda o: menace[o[1]])
            if menace[meilleur[1]] > 0:
                return meilleur
        zones_m = {m.zone for m in partie.machines_tournantes()}
        soutien = [o for o in options if o[0] == "soutenir" and o[1] in zones_m]
        if soutien:
            return soutien[0]
        pres = [o for o in barrer if o[1] in zones_m]
        if pres:
            return pres[0]
        return options[0]

    def d_parler(self, partie, siege, options, jeu):
        return None

    def d_embuscade(self, partie, siege, options, jeu, info):
        if info and (info.get("machine") is not None or info.get("machines")):
            imm = [o for o in options if o[0] == "immobiliser"]
            if imm:
                return imm[0]
            with partie.muet():
                zs = partie.zones_menacees(info)
            if "action" not in info:                       # v1 : la zone du pas de la Machine
                m = info["machine"]
                zs = {partie.pas_suivant(m, info["cible"], compter=False) or m.zone: 1}
            b = [o for o in options if o[0] == "barrer" and o[1] in zs]
            if b:
                return max(b, key=lambda o: zs[o[1]])
        agir = [o for o in options if o[0] not in ("aller", "immobiliser")]
        if not agir:
            return options[0]
        return self.d_action(partie, siege, agir, jeu)

    def d_tromper(self, partie, siege, options, reussite):
        return reussite

    def d_pouvoir(self, partie, siege, options, pouvoir, **ctx):
        if pouvoir == "hanter":
            return self.p["hanter"]
        return True
