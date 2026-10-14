"""Bot « repete » : une stratégie répétée, décrite par un script (garde-fou « aucune boucle gagnante »).

[mesure:boucle_gagnante] Le garde-fou (décision C1 de l'auteur, 14 oct. 2026 ;
projet/3-pilotage/garde-fou-boucles-gagnantes.md) demande qu'aucune action, suite d'actions
répétée ou convention de table appliquée sans lire le jeu ne constitue une stratégie gagnante.
Ce bot joue une telle stratégie. Il ne cherche rien : il applique son script à chaque décision.

Le script (paramètres) :
- actions : ordre de priorité des actions d'une carte révélée, parmi « saboter », « barrer »,
  « soutenir » (la première qui a une option l'emporte ; sinon la première option, ordre fixe) ;
- zone : comment choisir la zone parmi les options de cette action :
  « fixe » (la zone de plus petit numéro), « depart » (la plus menacée au premier coup d'œil de la
  partie, retenue ensuite), « menace » (la plus menacée maintenant : c'est un réflexe, qui lit le jeu) ;
- aller : « jamais », « cible » (se rapprocher de la zone cible, choisie par la règle de zone sur tout
  le plateau ; tous les sièges du même script visent la même zone : c'est l'alliance perpétuelle) ;
- mode : moitié jouée quand la carte ne rêve pas : « haut », « bas », « machines », « plateau », ou le
  nom d'un pouvoir (la moitié qui le porte) ; repli sur « haut » ;
- reves : motif du nombre de cartes en rêve par tour, répété (ex. [1], [0, 1], [2, 0, 0]) ;
- relais : décaler le motif du numéro de siège (le rêveur tourne d'un siège à chaque tour) ;
- reve_etapes : « debut » ou « fin » (les étapes qui reçoivent les rêves) ;
- etapes : motif des étapes remplies (ex. [1, 0, 1] : la deuxième étape reste vide) ;
- garde : cartes gardées en main au minimum (un rêve quitte la main pour la partie, R3.6) ;
- voie : « sommeil », « reveil » ou « alterne » quand le rêve choisit sa voie [v2:D2v_choix] ;
- voir, pouvoirs, tromper : Voir à l'étape 1, Hanter dès que possible, Tromper (« jamais »,
  « toujours », « reussite » : comme le glouton) ;
- presence : règle de zone pour les pions de présence de la mise en place.
- nom, famille, ouverte, collective : étiquettes pour les rapports ; ouverte = le script ne lit pas le
  jeu (zone « fixe » ou « depart ») ; collective = convention de table. Elles n'ont aucun effet sur le jeu.

Le bot ne communique pas (ni trace, ni partage, ni Parler). Le hasard ne sert qu'aux décisions qu'il
ne connaît pas (Bot.defaut).
"""
from collections import deque

from .base import Bot, BOTS
from ..erreurs import ErreurMoteur

REGLES_ZONE = ("fixe", "depart", "menace")
ACTIONS = ("saboter", "barrer", "soutenir")


@BOTS("repete")
class Repete(Bot):
    nom = "repete"
    PARAMS = {
        "nom": "",
        "famille": "",
        "ouverte": True,
        "collective": False,
        "actions": ["saboter", "barrer", "soutenir"],
        "zone": "depart",
        "aller": "jamais",
        "mode": "machines",
        "reves": [0],
        "relais": False,
        "reve_etapes": "debut",
        "etapes": [1],
        "garde": 2,
        "voie": "sommeil",
        "voir": False,
        "pouvoirs": True,
        "tromper": "reussite",
        "presence": "depart",
    }

    def __init__(self, graine=0, **params):
        super().__init__(graine, **params)
        p = self.p
        if p["zone"] not in REGLES_ZONE or p["presence"] not in REGLES_ZONE:
            raise ErreurMoteur(f"repete : règle de zone inconnue ({p['zone']!r}, {p['presence']!r})")
        if any(a not in ACTIONS for a in p["actions"]):
            raise ErreurMoteur(f"repete : action inconnue dans {p['actions']!r}")
        if p["aller"] not in ("jamais", "cible"):
            raise ErreurMoteur(f"repete : aller = {p['aller']!r} (jamais, cible)")
        if not p["reves"] or not p["etapes"]:
            raise ErreurMoteur("repete : les motifs « reves » et « etapes » ne peuvent pas être vides")
        if p["voie"] not in ("sommeil", "reveil", "alterne"):
            raise ErreurMoteur(f"repete : voie = {p['voie']!r}")
        self._plan = {}
        self._depart = {}
        self._reves_faits = 0

    # ---------------------------------------------------------------- zones
    def _ordre_depart(self, partie):
        """Zones classées par menace au premier regard du bot sur cette partie (retenu ensuite)."""
        cle = partie.lignee
        if cle not in self._depart:
            with partie.muet():
                m = partie.prevision()
            self._depart = {cle: sorted(partie.plateau.zones, key=lambda z: (-m[z], partie.plateau.numero[z]))}
        return self._depart[cle]

    def _cle_zone(self, partie, regle):
        """Fonction de tri : la meilleure zone d'abord (plus petite clé)."""
        num = partie.plateau.numero
        if regle == "fixe":
            return lambda z: num[z]
        if regle == "depart":
            rang = {z: i for i, z in enumerate(self._ordre_depart(partie))}
            return lambda z: (rang.get(z, 99), num[z])
        with partie.muet():
            m = partie.prevision()
        return lambda z: (-m[z], num[z])

    def _cible(self, partie):
        return min(partie.plateau.zones, key=self._cle_zone(partie, self.p["zone"]))

    @staticmethod
    def _distances(partie, depuis):
        d, f = {depuis: 0}, deque([depuis])
        while f:
            z = f.popleft()
            for n in partie.plateau.adj[z]:
                if n not in d:
                    d[n] = d[z] + 1
                    f.append(n)
        return d

    # ---------------------------------------------------------------- programmation
    def _mode(self, partie, peuple, options=None):
        voulu = self.p["mode"]
        if voulu in ("haut", "bas"):
            m = voulu
        elif voulu in ("machines", "plateau"):
            m = partie.moitie(peuple, voulu) or "haut"
        else:
            spec = partie.M["peuples"][peuple]
            m = next((x for x in ("haut", "bas") if spec[x].get("pouvoir") == voulu), "haut")
        if options is not None and m not in options:
            m = next((o for o in ("haut", "bas") if o in options), None) or next(o for o in options if o != "reve")
        return m

    def _nb_reves(self, partie, siege):
        motif = self.p["reves"]
        i = (partie.tour - 1) + (siege.idx if self.p["relais"] else 0)
        k = int(motif[i % len(motif)])
        cap = partie.R["reves_par_joueur_et_tour"]
        if cap is not None:
            k = min(k, cap)
        return max(0, min(k, len(siege.main) - self.p["garde"]))

    def _planifier(self, partie, siege):
        main = list(siege.main)
        motif = self.p["etapes"]
        actives = [e for j, e in enumerate(partie.etapes)
                   if motif[j % len(motif)] and siege.idx not in partie.prog[e]]
        actives = actives[:len(main)]
        k = min(self._nb_reves(partie, siege), len(actives))
        en_reve = set(actives[:k] if self.p["reve_etapes"] == "debut" else actives[len(actives) - k:])
        autres = sorted((s for s in partie.sieges if s.idx != siege.idx), key=lambda s: -len(s.main))
        plan = {}
        for e in actives:
            c = main.pop(0).uid
            if e in en_reve:
                plan[e] = (c, "reve", None)
                continue
            mode = self._mode(partie, siege.peuple)
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
    def d_presence(self, partie, siege, options, pion):
        return min(options, key=self._cle_zone(partie, self.p["presence"]))

    def d_trace(self, partie, siege, options, **ctx):
        return None

    def d_partage(self, partie, siege, options, **ctx):
        return None

    def d_parler(self, partie, siege, options, **ctx):
        return None

    def d_voir(self, partie, siege, options, etape):
        if self.p["voir"] and etape == partie.etapes[0] and len(siege.main) >= 4 \
                and any(o is siege.main[0] for o in options):
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
        return self._mode(partie, siege.peuple, options)

    def d_hote(self, partie, siege, options, etape):
        prevu = self._plan_du_tour(partie, siege).get(etape)
        return prevu[2] if prevu and prevu[2] in options else None

    def d_lune(self, partie, siege, options, ronde):
        """[v2:D5] prendre une lune au centre si le script rêve ce tour, la rendre sinon."""
        veut = any(m == "reve" for _, m, _ in self._plan_du_tour(partie, siege).values())
        if veut and ("prendre", "centre") in options:
            return ("prendre", "centre")
        if not veut and ("rendre",) in options:
            return ("rendre",)
        return None

    def d_reve(self, partie, siege, options, source):
        sommeil = [o for o in options if o[0] != "reveil"]
        voie = self.p["voie"]
        if voie == "alterne":
            voie = "reveil" if self._reves_faits % 2 else "sommeil"
        self._reves_faits += 1
        if ("reveil",) in options and (voie == "reveil" or not sommeil):
            return ("reveil",)
        avancees = [o for o in sommeil if o[0] == "avancer"]
        if avancees:
            return min(avancees, key=lambda o: abs(o[1] - 7))
        return sommeil[0] if sommeil else options[0]

    def d_aller(self, partie, siege, options, jeu):
        reels = [o for o in options if o is not None]
        if self.p["aller"] == "jamais" or not reels:
            return None
        cible = self._cible(partie)
        d = self._distances(partie, cible)
        ici = min((d.get(z, 99) for z in partie.zones_presence(siege.peuple)), default=99)
        meilleur = min(reels, key=lambda o: (d.get(o[2], 99), partie.plateau.numero[o[2]]))
        return meilleur if d.get(meilleur[2], 99) < ici else None

    def _legal(self, partie, jeu, o):
        if o[0] != "saboter":
            return True
        if partie.peut_saboter_seul(jeu, o[3]):
            return True
        return any(k.zone == o[1] and k.carte.peuple != jeu.carte.peuple for k in partie.ee.actifs)

    def d_action(self, partie, siege, options, jeu):
        cle = self._cle_zone(partie, self.p["zone"])
        for a in self.p["actions"]:
            cands = [o for o in options if o[0] == a and self._legal(partie, jeu, o)]
            if cands:
                return min(cands, key=lambda o: (cle(o[1]),) + tuple(str(x) for x in o[2:]))
        return options[0]

    def d_embuscade(self, partie, siege, options, jeu, info):
        imm = [o for o in options if o[0] == "immobiliser"]
        if imm:
            return imm[0]
        agir = [o for o in options if o[0] not in ("aller", "immobiliser")]
        return self.d_action(partie, siege, agir, jeu) if agir else options[0]

    def d_tromper(self, partie, siege, options, reussite):
        t = self.p["tromper"]
        if t == "toujours":
            return True if True in options else options[0]
        if t == "jamais":
            return False if False in options else options[0]
        return reussite

    def d_pouvoir(self, partie, siege, options, pouvoir, **ctx):
        return bool(self.p["pouvoirs"]) if bool(self.p["pouvoirs"]) in options else options[0]
