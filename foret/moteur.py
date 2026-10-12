"""Moteur de règles v1 : « Le Méchant qui rêve ».

Partie(maquette, peuples, bots, graine).jouer() rend un bilan (dict).

Organisation :
- les règles et le matériel viennent de la maquette (maquette.py, JSON) ;
- les critères, ordres de chantier et pouvoirs viennent de registres
  (criteres.py, chantier.py, pouvoirs.py), cités par nom dans la maquette ;
- toute décision d'un joueur passe par Partie.decider (decisions.py) ;
- tout ce qui est signalé (lacunes, incohérences, statistiques, journal)
  passe par Partie.signaler et part vers les observateurs (observateurs.py).

Outils de la phase 1 (hors règles) :
- Partie.copie() : une copie indépendante d'une partie en cours, au début d'un
  segment (conseil, étape, fin de tour) ou pendant une décision, que l'on
  peut jouer jusqu'au bout avec d'autres bots, un autre hasard, ou en imposant
  les prochains choix (voir la docstring de copie) ;
- chaque décision prise est notée (type, indice de l'option choisie) pour
  pouvoir la rejouer ; les observateurs qui ont une méthode decision()
  reçoivent les options offertes et le choix (journal des décisions,
  observateurs.JournalDecisions) ; ceux qui ont une méthode point() sont
  appelés au début de chaque segment.

Les commentaires « Rx.y » renvoient aux règles de docs/regles_v1.md.
"""
import copy
import itertools
import random
from collections import Counter, deque
from dataclasses import dataclass, field

from .erreurs import ErreurMoteur, FinDePartie
from .plateau import Plateau
from .criteres import CRITERES
from .chantier import CHANTIER
from .pouvoirs import POUVOIRS, ORGANES
from .lacunes import LACUNES, INCOHERENCES
from .decisions import DECISIONS
from .observateurs import Compteur, Journal
from .plans import Plans

VERSION = "1.7"
CENTRE = 7                      # R5.1 : 2-6 éveil, 7 centre, 8-12 rêve
CASES = tuple(range(2, 13))
PROBA = {c: (6 - abs(c - CENTRE)) / 36 for c in CASES}
MOITIES = ("haut", "bas")
ACTIONS = ("aller", "barrer", "saboter")
_LIGNEES = itertools.count(1)


def _memo_maquette(M):
    """Mémo pour copy.deepcopy : la maquette (et tout ce qu'elle contient) est
    partagée entre une partie et ses copies, jamais recopiée."""
    memo = {}
    pile = [M]
    while pile:
        o = pile.pop()
        if id(o) in memo:
            continue
        memo[id(o)] = o
        if isinstance(o, dict):
            pile.extend(o.values())
        elif isinstance(o, (list, tuple, set, frozenset)):
            pile.extend(o)
    return memo


def _indice(options, choix):
    """Indice de l'option choisie (l'objet lui-même d'abord, puis une option égale)."""
    for i, o in enumerate(options):
        if o is choix:
            return i
    for i, o in enumerate(options):
        if o == choix:
            return i
    return None


# --------------------------------------------------------------------------- objets
@dataclass(eq=False)
class Tuile:
    genre: str          # "tactique", "chantier", "esprit"
    nom: str
    uid: int
    spec: dict = None   # définition de la tuile dans la maquette

    def __repr__(self):
        return f"{self.nom}#{self.uid}"


@dataclass(eq=False)
class Machine:
    uid: int
    numero: int
    nom: str
    organes: dict       # organe -> True si neutralisé
    zone: object
    etat: str           # "plateau", "reserve", "retiree"
    egaree: bool = False
    entree: str = None  # [v2:E2] zone d'entrée (piste des Machines)

    @property
    def hs(self):
        """R3.8 : tous les organes neutralisés."""
        return all(self.organes.values())

    @property
    def tourne(self):
        return self.etat == "plateau" and not self.hs

    def __repr__(self):
        org = ",".join(o + ("x" if n else "") for o, n in self.organes.items())
        return f"{self.nom}[{self.zone}|{org}]"


@dataclass(eq=False)
class Carte:
    uid: str
    peuple: str

    def __repr__(self):
        return self.uid


@dataclass(eq=False)
class Jeu:
    """Une carte programmée sur une étape."""
    siege: int
    carte: Carte
    mode: str                   # "haut", "bas", "reve"
    etape: int
    hote: tuple = None          # (siège, étape) : carte d'insecte glissée (R6.8)
    voir: bool = False
    lie: bool = False
    pouvoir: object = None      # instance du pouvoir de la moitié jouée (ou None)
    regle: str = None           # nom de la règle brisée de cette moitié (même inactive)
    attaches: list = field(default_factory=list)
    action: str = None
    zone: str = None
    cible: tuple = None

    def __repr__(self):
        return f"{self.carte}/{self.mode}@{self.etape}"


@dataclass(eq=False)
class Siege:
    idx: int
    peuple: str
    bot: object
    main: list
    paquet: list
    deck: list
    reves: list = field(default_factory=list)
    joues: list = field(default_factory=list)


class EtatEtape:
    """Ce qui ne vit que le temps d'une étape."""

    def __init__(self):
        self.barres = set()
        self.tenues = set()          # Tenir, modes v0
        self.immobilisees = set()    # Attendre, option v0
        self.actifs = []             # cartes qui ont agi
        self.annule = False          # Hanter
        self.trompeurs = []
        self.info = None             # ordre tiré


# --------------------------------------------------------------------------- partie
class Partie(Plans):
    def __init__(self, maquette, peuples, bots, graine=0, journal=False, controle=True, observateurs=(),
                 reprises=False, _reprise=None):
        """reprises=True : une photo de l'état est prise au début de chaque
        segment, ce qui rend les copies faites pendant une décision plus
        rapides (rejeu depuis la photo au lieu du début de la partie).
        _reprise : usage interne de copie()."""
        R0 = _reprise or {}
        self._decisions = []                 # [(type, indice)] depuis le début
        self._rejeu = R0.get("rejeu")        # décisions à rejouer (copie)
        self._attendu = R0.get("attendu")    # (type, nb d'options) de la décision en attente
        self._hasard_a_la_main = R0.get("hasard")
        self._imposes = deque(R0.get("imposer", ()))
        self._en_cours = None                # décision en cours (pendant l'appel au bot)
        self._sur = False                    # au début d'un segment (copie directe possible)
        self._photo = None
        self.reprises = reprises
        self.lignee = R0.get("lignee") or next(_LIGNEES)
        self._init_args = (list(peuples), graine, controle)
        self._memo_m = None                  # calculé à la première copie
        self._pos = ("conseil", 1) if maquette["tours"] >= 1 else None
        M = self.M = maquette
        self.R = maquette["regles"]
        if len(peuples) != len(bots):
            raise ErreurMoteur("un bot par peuple")
        if len(set(peuples)) != len(peuples):
            raise ErreurMoteur("un peuple ne peut être joué qu'une fois")
        for p in peuples:
            if p not in M["peuples"]:
                raise ErreurMoteur(f"peuple inconnu dans la maquette {M['nom']} : {p}")
        self.graine = graine
        self.rng = random.Random(graine)
        self.compteur = Compteur()
        self.journal = Journal() if journal else None
        self.observateurs = [self.compteur] + ([self.journal] if journal else []) + list(observateurs)
        self.controle = controle
        self._muet = 0
        self._uid = 0
        self.fin = None
        self.tour = 0
        self.etape = 0
        self.etapes = tuple(range(1, M["etapes"] + 1))
        self.esprit_vu_au_centre = False
        self.derniere_attaque = None      # (zone, tour, étape)
        self.attaques = []                # [(zone, tour, étape)] : Représailles dans le rayon [v2:A3]
        self.cercle = []                  # [v2:D2] la voie du réveil : [(peuple, source)]
        self.reves_tour = 0               # [v2:D1] rêves de la table ce tour
        self.lunes = []                   # [v2:D5] porteur de chaque lune (None = au centre)
        self.immobiles_tour = set()       # Machines immobilisées jusqu'à la fin du tour (R6.6)
        self.ee = EtatEtape()
        self.prog = {e: {} for e in self.etapes}
        self.glisses = []
        self.des_vus = {}
        self.tuile_vue = {}
        self.des_source = {}              # étape -> "voir" ou "presage" (R6.2, R2.6)
        self.traces = {}                  # siège -> [(étape ou None, lieu)] (R2.5)
        self.jetons = {}                  # uid Machine -> [siège ou None, siège ou None] (R2.5, partage)
        self.programmes_vus = {}          # tout dire : siège -> [(étape, carte, mode)] déjà programmés
        self._provisoire = None           # programmes faits pendant le conseil, avant leur dépôt
        self._memo_prevision = None       # prévision gardée pendant les rondes de traces
        self._memo_defense = None         # défense par zone, gardée pendant une prévision
        self.plateau = Plateau(M["plateau"])
        self._init_machines()
        self._init_piste()
        self._init_pistes_v2()
        self._init_sieges(peuples, bots)
        self.ordre = [s.idx for s in self.sieges]
        if any(getattr(s.bot, "reprises", False) for s in self.sieges):
            self.reprises = True             # bots qui copient la partie (mc) : photo à chaque segment
        self._init_pouvoirs()
        self._init_presence()
        self._verifier_silence_possible()
        self._sur = True

    # =================================================================== mise en place
    def _uid_suivant(self):
        self._uid += 1
        return self._uid

    def _init_machines(self):
        """R1.2"""
        self.machines = []
        specs = [(s, s["zone"], "plateau") for s in self.M["machines"]["en_jeu"]]
        specs += [(s, None, "reserve") for s in self.M["machines"].get("reserve", [])]
        n_pistes = len(specs)
        if self.R["plan"] == "qui_ou" and self.R["double"] == "sixieme":      # [v2:A2a_d] Zizanie
            specs.append((self.M["machines"]["sixieme"], None, "reserve"))
        for num, (spec, zone, etat) in enumerate(specs, 1):
            self.machines.append(Machine(self._uid_suivant(), num, spec["nom"],
                                         {o: False for o in spec["organes"]}, zone, etat,
                                         entree=spec.get("entree")))
        self.sixieme = self.machines[-1] if len(specs) > n_pistes else None

    def _tuile(self, nom):
        if nom == "Esprit":
            return Tuile("esprit", "Esprit", self._uid_suivant())
        spec = self.M["tuiles"][nom]
        return Tuile(spec["genre"], nom, self._uid_suivant(), spec)

    def _init_piste(self):
        """R1.3"""
        P = self.M["piste"]
        if P["placement"] == "fixe":
            self.piste = {c: self._tuile(n) for c, n in zip(CASES, P["disposition"])}
        else:
            noms = list(P["tirage"]["tuiles"])
            self.rng.shuffle(noms)
            n_esp = P["tirage"].get("esprits_depart", 0)
            self.piste = {12 - i: self._tuile("Esprit") for i in range(n_esp)}
            libres = [c for c in CASES if c not in self.piste]
            for c, n in zip(libres, noms):
                self.piste[c] = self._tuile(n)
            if self.piste[CENTRE].genre == "esprit":
                raise ErreurMoteur("un esprit au centre dès la mise en place")

    def _init_sieges(self, peuples, bots):
        """R1.4"""
        C = self.M["cartes"]
        self.sieges = []
        for i, (p, bot) in enumerate(zip(peuples, bots)):
            deck = [Carte(f"{p[:3]}{k + 1}", p) for k in range(C["paquet"])]
            melange = list(deck)
            self.rng.shuffle(melange)
            n = C["main"]
            self.sieges.append(Siege(i, p, bot, melange[:n], melange[n:], deck))
        self.par_peuple = {s.peuple: s for s in self.sieges}

    def _init_pouvoirs(self):
        """R3.7 : un pouvoir par moitié de carte, plus les traits permanents."""
        self.instances = []
        self.pouvoir_moitie = {}
        self.traits = {}
        for s in self.sieges:
            spec = self.M["peuples"][s.peuple]
            for moitie in MOITIES:
                self.pouvoir_moitie[(s.peuple, moitie)] = self._creer_pouvoir(s.peuple, moitie, spec[moitie].get("pouvoir"))
            traits = [self._creer_pouvoir(s.peuple, None, t) for t in spec.get("traits", [])]
            self.traits[s.peuple] = [t for t in traits if t is not None]

    def _creer_pouvoir(self, peuple, moitie, nom):
        if not nom or not self.R["pouvoirs"]:
            return None
        params = self.M["pouvoirs"].get(nom, {})
        if not params.get("actif", True):
            return None
        inst = POUVOIRS[nom](self, peuple, moitie, nom, params)
        self.instances.append(inst)
        return inst

    def _init_presence(self):
        """R1.5"""
        P = self.M["presence"]
        n = P["pions"]
        self.presence = {s.peuple: Counter() for s in self.sieges}
        if P["placement"] == "hasard":
            for s in self.sieges:
                zs = list(self.plateau.zones)
                self.rng.shuffle(zs)
                for k in range(n):
                    self.presence[s.peuple][zs[k % len(zs)]] += 1
        else:
            for k in range(n):
                for idx in self.ordre:
                    s = self.sieges[idx]
                    z = self.decider(s, "presence", list(self.plateau.zones), pion=k)
                    self.presence[s.peuple][z] += 1

    def _verifier_silence_possible(self):
        possibles = set()
        for inst in self.instances:
            possibles |= {o for o in ORGANES if inst.sabotage_seul(o)}
        if len(self.sieges) >= 2:
            possibles |= set(ORGANES)
        presents = {o for m in self.machines for o in m.organes}
        if presents - possibles:
            self.incoherence("silence_impossible", sorted(presents - possibles))

    # =================================================================== signaux
    def signaler(self, categorie, code, n=1, detail=""):
        if self._muet:
            return
        for o in self.observateurs:
            o.evenement(self, categorie, code, n, detail)

    def lacune(self, code, detail=""):
        if code not in LACUNES:
            raise ErreurMoteur(f"lacune non répertoriée : {code}")
        self.signaler("lacune", code, 1, str(detail))

    def incoherence(self, code, detail=""):
        if code not in INCOHERENCES:
            raise ErreurMoteur(f"incohérence non répertoriée : {code}")
        self.signaler("incoherence", code, 1, str(detail))

    def stat(self, code, n=1):
        self.signaler("stat", code, n)

    def lancer_des(self):
        """Deux dés. Témoin [mesure:temoins] des_fixes : les faces sont imposées
        (le hasard est tiré quand même, pour que le reste de la partie consomme
        le même flux)."""
        d = (self.rng.randint(1, 6), self.rng.randint(1, 6))
        f = self.R["des_fixes"]
        return (f[0], f[1]) if f else d

    def _noter_ordre(self, info, reussite, avant):
        """Moteur 1.4 : signale aux observateurs qui ont une méthode
        ordre(partie, info, reussite, abattues) chaque ordre exécuté, avant
        l'apprentissage (la piste est encore celle du tirage)."""
        if self._muet:
            return
        ab = avant - self.plateau.total
        for o in self.observateurs:
            f = getattr(o, "ordre", None)
            if f is not None:
                f(self, info, reussite, ab)

    def log(self, *msg):
        if self.journal is not None and not self._muet:
            self.signaler("journal", "", 0, " ".join(str(m) for m in msg))

    class _Muet:
        def __init__(self, partie):
            self.p = partie

        def __enter__(self):
            self.p._muet += 1

        def __exit__(self, *a):
            self.p._muet -= 1

    def muet(self):
        """Bloc sans effet de bord sur les compteurs (lectures des bots)."""
        return Partie._Muet(self)

    # =================================================================== décisions
    def decider(self, siege, type_, options, **ctx):
        """Seul point où un joueur décide. La décision est notée (type, indice)
        pour pouvoir être rejouée par une copie ; les observateurs qui ont une
        méthode decision() la reçoivent avec les options offertes."""
        if type_ not in DECISIONS:
            raise ErreurMoteur(f"décision non répertoriée : {type_}")
        if not options:
            raise ErreurMoteur(f"aucune option pour la décision {type_}")
        self.signaler("decision", type_)
        if len(options) == 1:
            self.signaler("decision_forcee", type_)
        k = len(self._decisions)
        rej = self._rejeu
        if rej is not None and k < len(rej):          # copie : rejeu du passé
            t, i = rej[k]
            if t != type_ or i >= len(options):
                raise ErreurMoteur(f"rejeu divergent à la décision {k} : {t}/{i} contre {type_}/{len(options)} options")
            self._decisions.append((type_, i))
            return options[i]
        if rej is not None:                           # copie : on arrive au point de copie
            if self._attendu is not None and self._attendu != (type_, len(options)):
                raise ErreurMoteur(f"rejeu divergent au point de copie : {self._attendu} contre {(type_, len(options))}")
            self._passer_la_main()
        if self._imposes:
            i = self._imposes.popleft()
            if not 0 <= i < len(options):
                raise ErreurMoteur(f"choix imposé hors des options pour {type_} : {i} / {len(options)}")
            choix, impose = options[i], True
        else:
            self._en_cours = (siege, type_, options, ctx)
            try:
                choix = siege.bot.decider(self, siege, type_, options, ctx)
            finally:
                self._en_cours = None
            i = _indice(options, choix)
            if i is None:
                raise ErreurMoteur(f"choix illégal pour {type_} ({siege.peuple}) : {choix!r}")
            impose = False
        self._decisions.append((type_, i))
        if not self._muet:
            for o in self.observateurs:
                f = getattr(o, "decision", None)
                if f is not None:
                    f(self, siege, type_, options, i, ctx, impose)
        return choix

    # =================================================================== copies
    def _passer_la_main(self):
        """Fin du rejeu d'une copie : les bots décident désormais, et le hasard
        à venir est retiré si on l'a demandé."""
        self._rejeu = None
        self._attendu = None
        if self._hasard_a_la_main is not None:
            self.rng = random.Random(self._hasard_a_la_main)
            self._hasard_a_la_main = None
        if getattr(self, "_brouiller", None) is not None:
            sait, self._brouiller = self._brouiller, None
            self.brouiller(sait)

    def _cloner(self):
        """Copie profonde de l'état, sans les bots, les observateurs ni la photo
        (la maquette est partagée)."""
        if self._memo_m is None:
            self._memo_m = _memo_maquette(self.M)
        gardes = (self.observateurs, self.journal, self._photo, self._memo_m)
        bots = [s.bot for s in self.sieges]
        try:
            self.observateurs, self.journal, self._photo, self._memo_m = [], None, None, None
            for s in self.sieges:
                s.bot = None
            c = copy.deepcopy(self, dict(gardes[3]))
        finally:
            self.observateurs, self.journal, self._photo, self._memo_m = gardes
            for s, b in zip(self.sieges, bots):
                s.bot = b
        c._memo_m = self._memo_m
        c.observateurs = [c.compteur]
        return c

    def _photographier(self):
        if self.reprises:
            self._photo = self._cloner()

    def copie(self, bots=None, hasard=None, imposer=(), journal=False, observateurs=(), reprises=False,
              brouiller=None):
        """Copie indépendante de la partie, à jouer avec copie.jouer().

        Quand : au début d'un segment (avant jouer(), ou depuis la méthode
        point() d'un observateur), ou pendant une décision (depuis un bot,
        typiquement pour évaluer les options : recherche arborescente).

        bots : un bot par siège ; par défaut, des copies des bots actuels (la
          copie joue alors exactement comme l'original, si hasard est None).
        hasard : None = le même hasard à venir que l'original (mêmes dés) ;
          un entier = un nouveau hasard à partir du point de copie (le passé,
          y compris les dés déjà vus, ne change pas).
        imposer : indices des options à prendre pour les prochaines décisions,
          à commencer par la décision en cours le cas échéant.
        brouiller : un siège ; au point de copie, ce que ce siège ne sait pas (les
          programmes encore cachés des autres) est retiré au sort par leurs bots
          (Partie.brouiller). Sans effet pour une copie faite hors décision.

        Pendant une décision, la copie repart de la dernière photo (si la
        partie a été créée avec reprises=True) ou du début de la partie, et
        rejoue les décisions déjà prises jusqu'au point de copie : elle n'est
        donc au point de copie qu'une fois jouer() lancé.

        Information cachée : la copie voit tout (mains des autres, ordre des
        paquets). Les bots qui ne doivent pas tout savoir devront tirer au sort
        ce qu'ils ignorent (phase 2).
        """
        if self.fin is not None:
            raise ErreurMoteur("copie d'une partie terminée")
        if self._rejeu is not None:
            raise ErreurMoteur("copie d'une copie qui n'a pas fini son rejeu")
        if bots is None:
            bots = [copy.deepcopy(s.bot) for s in self.sieges]
        if len(bots) != len(self.sieges):
            raise ErreurMoteur("un bot par siège")
        if self._en_cours is None:
            if not self._sur:
                raise ErreurMoteur("copie possible au début d'un segment ou pendant une décision seulement")
            c = self._cloner()
            if hasard is not None:
                c.rng = random.Random(hasard)
            c._imposes = deque(imposer)
        else:
            _, type_, options, _ = self._en_cours
            reprise = {"rejeu": list(self._decisions), "attendu": (type_, len(options)),
                       "hasard": hasard, "imposer": imposer, "lignee": self.lignee}
            if self._photo is not None:
                c = self._photo._cloner()
                c._rejeu, c._attendu = reprise["rejeu"], reprise["attendu"]
                c._hasard_a_la_main, c._imposes = hasard, deque(imposer)
            else:
                peuples, graine, controle = self._init_args
                c = Partie(self.M, peuples, bots, graine=graine, controle=controle, _reprise=reprise)
        for s, b in zip(c.sieges, bots):
            s.bot = b
        c.reprises = reprises
        c._brouiller = brouiller if self._en_cours is not None else None
        c._photo = None
        c.journal = Journal() if journal else None
        c.observateurs = [c.compteur] + ([c.journal] if journal else []) + list(observateurs)
        return c

    # =================================================================== lectures
    def en_jeu(self, peuple):
        return peuple in self.par_peuple

    def siege(self, jeu):
        return self.sieges[jeu.siege]

    def moitie(self, peuple, compartiment):
        spec = self.M["peuples"][peuple]
        for m in MOITIES:
            if spec[m]["compartiment"] == compartiment:
                return m
        return None

    def organes_specialiste(self, peuple):
        """Organes que ce peuple sabote seul (sur sa moitié Machines)."""
        out = set()
        for m in MOITIES:
            inst = self.pouvoir_moitie.get((peuple, m))
            if inst:
                out |= {o for o in ORGANES if inst.sabotage_seul(o)}
        return out

    def machines_tournantes(self):
        return [m for m in self.machines if m.tourne]

    def machine(self, uid):
        for m in self.machines:
            if m.uid == uid:
                return m
        raise ErreurMoteur(f"Machine inconnue : {uid}")

    def invisible(self, peuple):
        return any(t.invisible() for t in self.traits.get(peuple, ()))

    def actions_permises(self, peuple):
        """R3.1 : actions de base du peuple (les reptiles ne sabotent pas, R6.12)."""
        return self.M["peuples"][peuple].get("actions", ACTIONS)

    def immobilisee(self, m):
        return m.uid in self.ee.immobilisees or m.uid in self.immobiles_tour

    def immobiliser(self, m, duree):
        (self.immobiles_tour if duree == "tour" else self.ee.immobilisees).add(m.uid)
        self.stat("immobilisations")
        self.log(f"  {m.nom} est immobilisée ({'jusqu’à la fin du tour' if duree == 'tour' else 'pour l’étape'})")

    def defense(self, z):
        """R4.2 Opportunisme : pions de présence visibles."""
        memo = self._memo_defense
        if memo is not None:
            if z not in memo:
                memo[z] = sum(c[z] for p, c in self.presence.items() if not self.invisible(p))
            return memo[z]
        return sum(c[z] for p, c in self.presence.items() if not self.invisible(p))

    def zones_presence(self, peuple):
        return [z for z in self.plateau.zones if self.presence[peuple][z] > 0]

    def zone_tenue(self, z):
        return z in self.ee.tenues or any(i.tient_passivement(z) for i in self.instances)

    def esprits(self):
        return [c for c in CASES if self.piste[c].genre == "esprit"]

    # =================================================================== égalités
    def departager(self, zs, compter=True):
        """R7.1"""
        zs = list(zs)
        if len(zs) == 1:
            return zs[0]
        if compter:
            self.lacune("egalite_critere", zs)
        P = self.plateau
        ms = self.machines_tournantes()
        cles = {
            "foret": lambda z: -P.foret[z],
            "proximite": lambda z: min((P.dist[m.zone][z] for m in ms), default=0),
        }
        restants = zs
        for k in self.R["departage_zones"]:
            if k == "numero" or len(restants) == 1:
                continue
            best = min(cles[k](z) for z in restants)
            restants = [z for z in restants if cles[k](z) == best]
        if len(restants) > 1 and compter:
            self.lacune("egalite_arbitraire", restants)
        return min(restants, key=P.numero.get)

    def departager_machines(self, cands):
        """R7.2"""
        for k in self.R["departage_machines"]:
            if k == "avancee" and len(cands) > 1:
                pmax = max(self.plateau.prof[m.zone] for m in cands)
                cands = [m for m in cands if self.plateau.prof[m.zone] == pmax]
        return min(cands, key=lambda m: m.numero)

    # =================================================================== critères
    def zones_eligibles(self):
        if self.R["criteres_ignorent_zones_rasees"]:
            zs = [z for z in self.plateau.zones if self.plateau.foret[z] > 0]
            if zs:
                return zs
            self.lacune("critere_sans_cible")
        return list(self.plateau.zones)

    def cible(self, tuile):
        """R4.2 : zone désignée par le critère de la tactique, départagée (R7.1)."""
        spec = tuile.spec
        cands = CRITERES[spec["critere"]](self, self.zones_eligibles(), spec.get("params", {}))
        if not cands:
            return None
        return self.departager(cands)

    def machine_la_plus_avancee(self):
        ms = self.machines_tournantes()
        if not ms:
            return None
        pmax = max(self.plateau.prof[m.zone] for m in ms)
        cands = [m for m in ms if self.plateau.prof[m.zone] == pmax]
        if len(cands) > 1:
            self.lacune("egalite_machine", "Percée")
        return min(cands, key=lambda m: m.numero)

    def machine_pour(self, cible):
        """R4.3 : la Machine en marche la plus proche (R7.2)."""
        ms = self.machines_tournantes()
        if not ms or cible is None:
            return None
        D = self.plateau.dist
        d = min(D[m.zone][cible] for m in ms)
        cands = [m for m in ms if D[m.zone][cible] == d]
        if len(cands) > 1:
            self.lacune("egalite_machine", cands)
        return self.departager_machines(cands)

    def pas_suivant(self, m, cible, avec_barrages=True, compter=True):
        """R4.3-R4.4 : zone du pas de la Machine vers la cible (None : pas de pas)."""
        if m.zone == cible:
            return None
        D = self.plateau.dist
        d = D[m.zone][cible]
        nexts = [n for n in self.plateau.adj[m.zone] if D[n][cible] == d - 1]
        if avec_barrages:
            nexts = [n for n in nexts if n not in self.ee.barres]
        if not nexts:
            return None
        if len(nexts) > 1:
            if compter:
                self.lacune("chemin_multiple", nexts)
            return self.departager(nexts, compter=False)
        return nexts[0]

    # =================================================================== piste
    def echanger(self, a, b):
        self.piste[a], self.piste[b] = self.piste[b], self.piste[a]
        self.stat("echanges_piste")
        for c in CASES:
            if c < CENTRE and self.piste[c].genre == "esprit":
                self.incoherence("esprit_cote_eveil", f"case {c}")

    def options_reve(self):
        """R5.3"""
        opts = []
        if self.piste[12].genre != "esprit":
            opts.append(("entrer",))
        for c in self.esprits():
            if c == CENTRE:
                continue
            d = c - 1 if c > CENTRE else c + 1
            if self.piste[d].genre != "esprit":
                opts.append(("avancer", c))
        return opts

    def rever(self, choix):
        if choix not in self.options_reve():
            raise ErreurMoteur(f"rêve illégal : {choix}")
        if choix[0] == "entrer":
            self.oublier(self.piste[12])
            self.piste[12] = self._tuile("Esprit")
            self.log("  rêve : un esprit entre en 12")
        else:
            c = choix[1]
            d = c - 1 if c > CENTRE else c + 1
            self.echanger(c, d)
            self.log(f"  rêve : l'esprit avance de {c} à {d}")

    def faire_rever(self, siege, source):
        voies = self.R["voies_reve"]                       # [v2:D2v] comment un rêve nourrit les voies
        opts = self.options_reve()
        if voies == "choix":                               # [v2:D2v_choix] le joueur choisit sa voie
            choix = self.decider(siege, "reve", opts + [("reveil",)], source=source)
            if choix == ("reveil",):
                self.rejoindre_cercle(siege, source)
                return
        else:
            if not opts:
                self.lacune("reve_sans_option", source)
                if voies == "deux":
                    self.rejoindre_cercle(siege, source)
                return
            choix = self.decider(siege, "reve", opts, source=source)
        self.rever(choix)
        self.stat("esprits_" + source)
        self.verifier_sommeil()
        if voies == "deux":                                # [v2:D2v_deux] les deux voies à la fois
            self.rejoindre_cercle(siege, source)

    def capacite_cercle(self):
        """[v2:D2] le Cercle compte cercle_par_joueur cases par joueur."""
        return self.R["cercle_par_joueur"] * len(self.sieges)

    def rejoindre_cercle(self, siege, source):
        """[v2:D2] la voie du réveil : le rêve rejoint le Cercle ; plein, la forêt
        se réveille (fin immédiate, [v2:D3])."""
        self.cercle.append((siege.peuple, source))
        self.stat("cercle_" + source)
        self.log(f"  {siege.peuple} rejoint le Cercle ({len(self.cercle)}/{self.capacite_cercle()})")
        if len(self.cercle) >= self.capacite_cercle():
            self.terminer("reveil")

    def oublier(self, tuile):
        if tuile.genre == "esprit":
            raise ErreurMoteur("un esprit ne s'oublie pas")
        self.stat("oubli_" + tuile.genre)
        self.log(f"  le Méchant oublie {tuile}")
        if tuile.genre == "tactique":
            if not any(self.piste[c] is not tuile and self.piste[c].nom == tuile.nom for c in CASES):
                self.incoherence("tactique_disparue", tuile.nom)

    def apprendre(self, case, reussite):
        """R5.2"""
        t = self.piste[case]
        if t.genre == "esprit":
            raise ErreurMoteur("un esprit n'apprend pas")
        if not self.R["apprentissage"]:                    # [mesure:temoins] le Méchant n'apprend plus
            self.stat("apprentissage_coupe")
            return
        if reussite:
            dest = None if case == CENTRE else (case - 1 if case > CENTRE else case + 1)
        elif case == CENTRE:
            dest = CENTRE + 1
        elif case > CENTRE:
            dest = case + 1 if case < 12 else None
        else:
            dest = case - 1 if case > 2 else None
        quoi = "réussite" if reussite else "échec"
        if dest is None:
            self.stat("apprentissage_sans_mouvement")
            self.log(f"  {t} reste en {case} ({quoi})")
            return
        autre = self.piste[dest]
        if autre.genre == "esprit" and not reussite and self.R["echec_face_esprit"] == "reste":
            self.stat("echec_bloque_par_esprit")
            self.log(f"  {t} reste en {case} (échec, un esprit en {dest})")
            return
        self.echanger(case, dest)
        self.log(f"  apprentissage ({quoi}) : {t} {case}->{dest}, {autre} {dest}->{case}")
        if autre.genre == "esprit":
            if reussite:
                self.stat("tir_a_la_corde")
            else:
                self.incoherence("esprit_pousse_par_echec")
                if case == CENTRE:
                    self.incoherence("sommeil_par_echec")
        self.verifier_sommeil()

    # =================================================================== fins
    def verifier_sommeil(self):
        """R5.4, R8.1 : le long sommeil, dès qu'un esprit atteint le 7."""
        if self.piste[CENTRE].genre == "esprit":
            self.esprit_vu_au_centre = True
            if self.R["fin_de_partie"] == "immediate":
                self.terminer("sommeil")

    def silence_atteint(self):
        if not self.R["silence_du_chantier"]:              # [v2:D3] retiré en v2
            return False
        if any(m.tourne for m in self.machines):
            return False
        if any(m.etat == "reserve" for m in self.machines):
            if self.R["silence_reserve_vide"]:
                return False
            self.lacune("silence_avec_reserve")
        return True

    def verifier_silence(self):
        """R8.1 : le silence du chantier."""
        if self.R["fin_de_partie"] == "immediate" and self.silence_atteint():
            self.terminer("silence")

    def terminer(self, genre):
        """R8.1 : la partie s'arrête aussitôt."""
        if self.fin is None:
            self.fin = (genre, self.tour, self.etape)
            self.log(f"*** FIN : {genre} ***")
        raise FinDePartie()

    # =================================================================== Machines
    def peut_saboter_seul(self, jeu, organe):
        return jeu.pouvoir is not None and jeu.pouvoir.sabotage_seul(organe)

    def allie(self, jeu):
        """R3.5"""
        for k in self.ee.actifs:
            if k is jeu or k.zone != jeu.zone or k.carte.peuple == jeu.carte.peuple:
                continue
            if self.R["alliance"] == "conjointe" and k.action != "saboter":
                continue
            return True
        return False

    def resoudre_sabotage(self, jeu):
        """R3.4"""
        if "saboter" not in self.actions_permises(jeu.carte.peuple):
            raise ErreurMoteur(f"{jeu.carte.peuple} ne peut pas saboter")
        muid, organe = jeu.cible
        m = self.machine(muid)
        if m.etat != "plateau" or m.zone != jeu.zone or m.organes.get(organe, True):
            self.stat("sabotage_sans_effet")
            return
        if self.peut_saboter_seul(jeu, organe) or self.allie(jeu):
            self.neutraliser(m, organe, jeu)
        else:
            self.stat("sabotage_sans_allie")
            self.log(f"  {jeu.carte} : sabotage impossible sans allié")

    def neutraliser(self, m, organe, jeu):
        """R3.4, R3.8, R6.5, R8.1"""
        m.organes[organe] = True
        self.derniere_attaque = (m.zone, self.tour, self.etape)
        self.attaques.append(self.derniere_attaque)
        self.stat("organes_neutralises")
        if jeu.pouvoir:
            jeu.pouvoir.apres_neutralisation(jeu, m, organe)
        self.log(f"  {jeu.carte} neutralise {organe} de {m.nom} en {m.zone}")
        if m.hs:
            self.stat("machines_hs")
            silencieux = jeu.pouvoir is not None and jeu.pouvoir.silencieux and jeu.pouvoir.sabotage_seul(organe)
            for inst in list(self.instances):
                inst.machine_hs(m, jeu)       # R6.5 Égarer
            if self.R["bruit"] and not silencieux and m.etat == "plateau":
                self.bruit()
            self.verifier_silence()

    def bruit(self):
        """Hors maquette v1 : une Machine mise HS bruyamment fait reculer l'esprit le plus avancé."""
        es = [c for c in self.esprits() if c > CENTRE]
        if es:
            c = min(es)
            if c < 12 and self.piste[c + 1].genre != "esprit":
                self.echanger(c, c + 1)
                self.stat("bruit_recul")

    # =================================================================== conseil
    def poser(self, siege, carte, mode, etape, hote=None, voir=False):
        """R2.1 : une carte posée sur une étape, orientée ou en rêve."""
        if carte not in siege.main:
            raise ErreurMoteur(f"{carte} n'est pas dans la main de {siege.peuple}")
        if etape not in self.etapes or mode not in ("haut", "bas", "reve"):
            raise ErreurMoteur(f"programmation invalide : {mode} @ {etape}")
        j = Jeu(siege.idx, carte, mode, etape, hote=hote, voir=voir)
        if mode != "reve":
            j.pouvoir = self.pouvoir_moitie.get((siege.peuple, mode))
            j.regle = self.M["peuples"][siege.peuple][mode].get("pouvoir")
        siege.main.remove(carte)
        siege.joues.append(carte)
        return j

    def poser_voir(self, siege, carte, moitie, e):
        """R6.2"""
        if siege.idx in self.prog[e]:
            raise ErreurMoteur("Voir : étape déjà occupée")
        self.prog[e][siege.idx] = self.poser(siege, carte, moitie, e, voir=True)
        d = self.lancer_des()
        self.des_vus[e] = d
        self.tuile_vue[e] = self.piste[sum(d)]
        self.des_source[e] = "voir"
        self.stat("voir")
        self.log(f"Voir : étape {e}, dés {sum(d)} -> {self.piste[sum(d)]}")

    def modes_autorises(self, siege, deja):
        modes = []
        for m in MOITIES:
            inst = self.pouvoir_moitie.get((siege.peuple, m))
            if inst is None or inst.mode_autorise(siege, deja):
                modes.append(m)
        cap = self.R["reves_par_joueur_et_tour"]            # R2.2
        lune = self.R["lunes"] is None or siege.idx in self.lunes   # [v2:D5]
        if lune and (cap is None or sum(1 for j in deja if j.mode == "reve") < cap):
            modes.append("reve")
        return modes

    def _programmer(self, s, etapes=None, deja=()):
        """R2.1 ; etapes : seulement ces étapes ; deja : jeux de ce siège déjà faits ce tour
        (pour la limite de rêves). Rend les nouveaux jeux."""
        jeux = list(deja)
        n0 = len(jeux)
        for e in (self.etapes if etapes is None else etapes):
            if s.idx in self.prog[e]:          # carte de Voir
                continue
            if not s.main:
                break
            eng = self.trace_engageante(s.idx, e)                    # R2.5 : traces qui engagent
            cartes = [None] + list(s.main) if eng is None else list(s.main)
            carte = self.decider(s, "programmer_carte", cartes, etape=e)
            if carte is None:
                continue
            modes = self.modes_autorises(s, jeux)
            if eng is not None:
                voulus = [m for m in modes if (m == "reve") == (eng == "reve")]
                if voulus:
                    modes = voulus
                else:
                    self.lacune("trace_intenable", f"{s.peuple} étape {e} : {eng}")
            mode = self.decider(s, "programmer_mode", modes, etape=e, carte=carte)
            hote = None
            inst = self.pouvoir_moitie.get((s.peuple, mode)) if mode != "reve" else None
            if inst is not None:
                opts = inst.options_hote(s, e)
                if opts:
                    idx = self.decider(s, "hote", [None] + opts, etape=e)
                    hote = None if idx is None else (idx, e)
            jeux.append(self.poser(s, carte, mode, e, hote=hote))
        return jeux[n0:]

    def conseil(self):
        """R2.1 : Voir (oiseaux), la communication (R2.5), le présage (R2.6),
        puis la programmation en silence."""
        self.prog = {e: {} for e in self.etapes}
        self.glisses = []
        self.des_vus = {}
        self.tuile_vue = {}
        self.des_source = {}
        self.traces = {s.idx: [] for s in self.sieges}
        self.jetons = {}
        self.programmes_vus = {}
        self.reves_tour = 0
        self.lunes = []
        for inst in self.instances:
            inst.debut_tour()
        for s in self.sieges:
            if not s.main:
                self.lacune("main_vide", s.peuple)
        for idx in self.ordre:                       # pouvoirs du conseil (Voir)
            s = self.sieges[idx]
            for m in MOITIES:
                inst = self.pouvoir_moitie.get((s.peuple, m))
                if inst is not None:
                    inst.conseil(s)
        self.communiquer()
        if self.R["lunes"] is not None:
            self._prendre_lunes()
        if self.R["presage"]:
            self.presager()
        # Programmation secrète et simultanée : chacun programme sans voir les
        # cartes des autres ; on ne réunit qu'à la fin. Tout dire (R2.5) : les
        # programmes déjà faits sont visibles (programmes_visibles).
        provisoire = self._provisoire = {}
        for idx in self.ordre:
            provisoire[idx] = self._programmer(self.sieges[idx])
            if self.R["communication"] == "tout_dire":
                self.programmes_vus[idx] = [(j.etape, j.carte.uid, j.mode) for j in provisoire[idx]]
        self._provisoire = None
        for idx, jeux in provisoire.items():
            self._ranger(idx, jeux)
        self._lier_glisses(self.glisses)
        self.log("Programme :", {e: list(v.values()) for e, v in self.prog.items()}, "glissées :", self.glisses)

    def _ranger(self, idx, jeux):
        for j in jeux:
            if j.hote is not None:
                self.glisses.append(j)
            else:
                self.prog[j.etape][idx] = j

    def _lier_glisses(self, glisses):
        for g in glisses:                            # R6.8
            h = self.prog[g.etape].get(g.hote[0])
            if h is not None and h.mode != "reve":
                h.attaches.append(g)
                g.lie = True

    # =================================================================== information cachée (phase 2)
    def brouiller(self, sait):
        """Déterminisation : ce que le siège `sait` ne peut pas savoir est retiré au sort.
        Les programmes encore cachés des autres joueurs (cartes face cachée des étapes
        à venir, cartes glissées) sont défaits et reprogrammés par leurs bots (dans une
        copie : la politique de jeu). Les cartes d'un même peuple ne diffèrent que par
        leur nom (leurs effets propres ne sont pas joués) : reste caché ce que chacun a
        programmé, à quelle étape, sur quelle moitié, et s'il rêve.
        À appeler au point d'une copie (Partie.copie(..., brouiller=siège)).
        Rien n'est caché en « tout dire » (R2.5)."""
        if self.R["communication"] == "tout_dire":
            return
        imposes, self._imposes = self._imposes, deque()       # les choix imposés sont pour `sait`
        try:
            if self.etape == 0 and self._provisoire is not None:          # pendant la programmation
                for idx, jeux in list(self._provisoire.items()):
                    if idx == sait or not jeux:
                        continue
                    s = self.sieges[idx]
                    for j in jeux:
                        s.joues.remove(j.carte)
                        s.main.append(j.carte)
                    self._provisoire[idx] = self._programmer(s)
                    self.stat("brouillage")
            elif self.etape > 0:                                          # pendant la résolution
                caches = [e for e in self.etapes if e > self.etape]
                if not caches:
                    return
                for s in self.sieges:
                    if s.idx == sait:
                        continue
                    defaits = []
                    for e in caches:
                        j = self.prog[e].get(s.idx)
                        if j is not None and not j.voir:
                            del self.prog[e][s.idx]
                            for a in j.attaches:                         # cartes glissées sous elle : à leur joueur
                                a.lie = False
                            j.attaches = []
                            defaits.append(j)
                    for g in [g for g in self.glisses if g.siege == s.idx and g.etape in caches]:
                        self.glisses.remove(g)
                        h = self.prog[g.etape].get(g.hote[0])
                        if h is not None and g in h.attaches:
                            h.attaches.remove(g)
                        defaits.append(g)
                    if not defaits:
                        continue
                    for j in defaits:
                        s.joues.remove(j.carte)
                        s.main.append(j.carte)
                    restes = [j for v in self.prog.values() for j in v.values() if j.siege == s.idx]
                    restes += [g for g in self.glisses if g.siege == s.idx]
                    libres = [e for e in caches if s.idx not in self.prog[e]]
                    nouveaux = self._programmer(s, etapes=libres, deja=restes)
                    self._ranger(s.idx, nouveaux)
                    self.stat("brouillage")
                # les cartes glissées (de tous) sous une carte reprogrammée se relient
                self._lier_glisses([g for g in self.glisses if g.etape in caches and not g.lie])
        finally:
            self._imposes = imposes

    # =================================================================== communication (R2.5)
    def communiquer(self):
        """R2.5 : la forme de communication vient de la maquette : [v2:C2a] traces,
        [v2:C2b] partage, [v2:C2c] parle, [v2:C2d] aucun_signe, [v2:C2e] tout_dire."""
        c = self.R["communication"]
        if c in ("traces", "parle", "tout_dire"):
            # Les traces ne changent ni le plateau ni la piste (elles ne comptent pas comme
            # des présences) : la prévision est la même pendant toutes les rondes (calcul gardé).
            self._memo_prevision = {}
            try:
                self._poser_traces(c)
            finally:
                self._memo_prevision = None
        elif c == "partage":
            self._partager()

    def _poser_traces(self, c):
        """R2.5 : sans ordre de tour, chacun pose, reprend ou déplace ses traces ;
        modèle : des rondes dans l'ordre des joueurs, où chacun repose toutes
        ses traces, jusqu'à ce que rien ne bouge (au plus rondes_conseil)."""
        datees = c == "tout_dire" or (c == "traces" and self.R["traces_datees"])
        n = len(self.etapes) if c == "tout_dire" else self.R["traces_par_joueur"]
        lieux = list(self.plateau.zones) + ["reve"]
        for ronde in range(self.R["rondes_conseil"]):
            bouge = False
            for idx in self.ordre:
                s = self.sieges[idx]
                anciennes = list(self.traces[idx])
                self.traces[idx] = []
                for rang in range(n):
                    mes = self.traces[idx]
                    if datees:
                        prises = {e for e, _ in mes}
                        opts = [(e, z) for e in self.etapes if e not in prises for z in lieux]
                    else:
                        prises = {z for _, z in mes}
                        opts = [(None, z) for z in lieux if z not in prises]
                    if not opts:
                        break
                    choix = self.decider(s, "trace", [None] + opts, ronde=ronde, rang=rang, anciennes=anciennes)
                    if choix is None:
                        break
                    mes.append(choix)
                if self.traces[idx] != anciennes:
                    bouge = True
            if not bouge:
                break
            self.stat("rondes_conseil")
        poses = sum(len(v) for v in self.traces.values())
        self.stat("traces_posees", poses)
        if poses:
            self.log("Traces :", {self.sieges[i].peuple: v for i, v in self.traces.items() if v})

    def _partager(self):
        """R2.5, le partage : deux jetons par Machine en marche ; chacun prend un
        jeton au centre ou devant un autre joueur (au plus partage_max devant
        soi, un seul par Machine), ou en rend un ; modèle : une action par
        joueur et par ronde, jusqu'à ce que personne ne bouge."""
        self.jetons = {m.uid: [None, None] for m in self.machines_tournantes()}
        maxi = self.R["partage_max"]
        for ronde in range(self.R["rondes_conseil"]):
            bouge = False
            for idx in self.ordre:
                s = self.sieges[idx]
                tenus = [u for u, h in self.jetons.items() if idx in h]
                opts = [None]
                if len(tenus) < maxi:
                    for u, h in self.jetons.items():
                        if idx in h:
                            continue
                        if None in h:
                            opts.append(("prendre", u, "centre"))
                        opts += [("prendre", u, x) for x in sorted({x for x in h if x is not None})]
                opts += [("rendre", u) for u in tenus]
                choix = self.decider(s, "partage", opts, ronde=ronde)
                if choix is None:
                    continue
                bouge = True
                h = self.jetons[choix[1]]
                if choix[0] == "prendre":
                    h[h.index(None if choix[2] == "centre" else choix[2])] = idx
                    self.stat("jetons_pris" if choix[2] == "centre" else "jetons_repris")
                else:
                    h[h.index(idx)] = None
                    self.stat("jetons_rendus")
            if not bouge:
                break
            self.stat("rondes_conseil")
        if self.jetons:
            self.log("Partage :", {self.machine(u).nom: [None if x is None else self.sieges[x].peuple for x in h]
                                   for u, h in self.jetons.items()})

    def _prendre_lunes(self):
        """[v2:D5] les lunes : chacun peut prendre une lune au centre ou devant un
        autre joueur (une au plus devant soi), ou la rendre ; seul un joueur qui
        tient une lune peut rêver ce tour. Modèle : des rondes comme pour la
        communication, après elle."""
        self.lunes = [None] * self.R["lunes"]
        for ronde in range(self.R["rondes_conseil"]):
            bouge = False
            for idx in self.ordre:
                s = self.sieges[idx]
                if idx in self.lunes:
                    opts = [None, ("rendre",)]
                else:
                    opts = [None] + ([("prendre", "centre")] if None in self.lunes else [])
                    opts += [("prendre", x) for x in sorted({x for x in self.lunes if x is not None})]
                if len(opts) == 1:
                    continue
                choix = self.decider(s, "lune", opts, ronde=ronde)
                if choix is None:
                    continue
                bouge = True
                if choix[0] == "rendre":
                    self.lunes[self.lunes.index(idx)] = None
                else:
                    self.lunes[self.lunes.index(None if choix[1] == "centre" else choix[1])] = idx
                    self.stat("lunes_prises" if choix[1] == "centre" else "lunes_reprises")
            if not bouge:
                break
        self.log("Lunes :", [None if x is None else self.sieges[x].peuple for x in self.lunes])

    def trace_engageante(self, idx, etape):
        """R2.5 : lieu (zone ou "reve") où la trace datée de ce siège l'engage à
        cette étape, si les traces engagent ; sinon None."""
        if not self.R["traces_engagent"]:
            return None
        for e, z in self.traces.get(idx, ()):
            if e == etape:
                return z
        return None

    def _engagement(self, jeu):
        """Zone où une carte révélée doit agir (R2.5), ou None."""
        if jeu.hote is not None:
            return None
        z = self.trace_engageante(jeu.siege, jeu.etape)
        return None if z == "reve" else z

    def _tenir_engagement(self, jeu, opts, zone_de):
        """Restreint des options à la zone d'engagement ; si c'est impossible,
        la carte est libre (lacune trace_intenable)."""
        z = self._engagement(jeu)
        if z is None:
            return opts
        ok = [o for o in opts if o is not None and zone_de(o) == z]
        if ok:
            return ok
        self.lacune("trace_intenable", f"{jeu.carte} : {z}")
        return opts

    def signes(self):
        """Lecture publique des signes du conseil (R2.5), pour les bots :
        [{"siege", "etape" (None si non datée), "lieu" (zone ou "reve"), "machine" (uid ou None)}]."""
        out = [{"siege": i, "etape": e, "lieu": z, "machine": None}
               for i, ts in self.traces.items() for e, z in ts]
        for u, h in self.jetons.items():
            m = self.machine(u)
            out += [{"siege": i, "etape": None, "lieu": m.zone, "machine": u} for i in h if i is not None]
        return out

    def programmes_visibles(self):
        """Tout dire (R2.5) : les programmes déjà faits ce conseil ; sinon {}."""
        return dict(self.programmes_vus)

    # =================================================================== présage (R2.6)
    def presager(self):
        """R2.6 : quand la communication est close, on lance les dés de la
        première étape ; ils serviront à cette étape. S'ils sont déjà lancés
        (Voir), on ne relance pas."""
        e = self.etapes[0]
        if e in self.des_vus:
            self.stat("presage_deja_vu")
            return
        d = self.lancer_des()
        self.des_vus[e] = d
        self.tuile_vue[e] = self.piste[sum(d)]
        self.des_source[e] = "presage"
        self.stat("presages")
        self.log(f"Présage : étape {e}, dés {sum(d)} -> {self.piste[sum(d)]}")

    def ordre_connu(self, etape):
        """Ce que les dés déjà vus (Voir, présage) annoncent pour cette étape, lu
        maintenant et sans effet de bord : {"case", "tuile", "cible", "machine"},
        ou None si les dés ne sont pas connus."""
        d = self.des_vus.get(etape)
        if d is None:
            return None
        if self.R["plan"] != "une_piste":
            with self.muet():
                return self.interpreter(d, compter=False)
        case = sum(d)
        t = self.piste[case]
        info = {"case": case, "tuile": t, "cible": None, "machine": None}
        if t.genre == "tactique":
            with self.muet():
                info["cible"] = self.cible(t)
                info["machine"] = self.machine_pour(info["cible"])
        return info

    # =================================================================== résolution
    def jouer(self):
        """Joue la partie (ou la copie) jusqu'au bout et rend le bilan.

        La partie avance par segments : conseil d'un tour, chaque étape, fin du
        tour. Au début de chaque segment (point sûr), une photo est prise si
        reprises=True, et les observateurs qui ont une méthode point() sont
        appelés : ils peuvent y faire une copie de la partie."""
        if self.fin is not None:
            raise ErreurMoteur("partie déjà terminée")
        try:
            while self._pos is not None:
                seg = self._pos
                self._sur = True
                self._photographier()
                if not self._muet:
                    for o in self.observateurs:
                        f = getattr(o, "point", None)
                        if f is not None:
                            f(self, seg)
                self._sur = False
                self._segment(seg)
                self._pos = self._suivant(seg)
            self.terminer("nuit")
        except FinDePartie:
            self._pos = None
            self._sur = False
        if self.fin[0] == "sommeil" and self.R["dernier_sursaut"]:
            self.dernier_sursaut()
        if self.controle:
            self.controler()
        return self.bilan()

    @property
    def position(self):
        """Segment à jouer : ("conseil", tour), ("etape", tour, étape),
        ("fin_tour", tour) ; None si la partie est finie."""
        return self._pos

    def _segment(self, seg):
        if seg[0] == "conseil":
            self.tour, self.etape = seg[1], 0
            self.conseil()
        elif seg[0] == "etape":
            self.tour, self.etape = seg[1], seg[2]
            self.resoudre_etape(seg[2])
            if self.controle:
                self.controler()
        else:
            self.tour, self.etape = seg[1], 0
            self.fin_de_tour()
            if self.controle:
                self.controler()

    def _suivant(self, seg):
        t = seg[1]
        if seg[0] == "conseil":
            return ("etape", t, self.etapes[0]) if self.etapes else ("fin_tour", t)
        if seg[0] == "etape":
            k = self.etapes.index(seg[2])
            return ("etape", t, self.etapes[k + 1]) if k + 1 < len(self.etapes) else ("fin_tour", t)
        return ("conseil", t + 1) if t < self.M["tours"] else None

    def resoudre_etape(self, e):
        """R2.3 : résolution d'une étape, dans l'ordre des règles."""
        self.ee = EtatEtape()
        propres = [self.prog[e][i] for i in self.ordre if i in self.prog[e]]
        seules = [g for g in self.glisses if g.etape == e and not g.lie]
        for g in seules:
            self.lacune("unir_sans_hote", g)
        tous = propres + seules
        reves = [j for j in tous if j.mode == "reve"]
        embusques = [j for j in tous if j.mode != "reve" and j.pouvoir and j.pouvoir.differe(j)]
        normaux = [j for j in tous if j.mode != "reve" and j not in embusques]
        self.log("Révélation :", tous)

        # 2. Aller d'abord
        for j in normaux:
            opts = self.options_aller(j)
            z = self._engagement(j)                                  # R2.5 : trace qui engage
            if z is not None and opts:
                vers = [o for o in opts if o[2] == z]
                ici = z in self.zones_presence(j.carte.peuple)
                if vers and not ici:                                 # la carte doit aller en z
                    self.appliquer_aller(j, self.decider(self.siege(j), "aller", vers, jeu=j))
                    continue
                if ici:
                    opts = vers                                      # rester, ou amener un autre pion en z
                # sinon intenable : la carte est libre (compté à l'action)
            if opts:
                choix = self.decider(self.siege(j), "aller", [None] + opts, jeu=j)
                if choix is not None:
                    self.appliquer_aller(j, choix)
        # 3. Rêves (R3.6, R5.3)
        for j in reves:
            s = self.siege(j)
            lim = self.R["reves_par_tour_table"]             # [v2:D1] limite pour la table
            if lim is not None and self.reves_tour >= lim:
                self.lacune("reves_table_depasses", f"{j.carte}")
                self.log(f"{j.carte} ne peut plus rêver : la table a atteint sa limite")
                continue
            self.reves_tour += 1
            s.joues.remove(j.carte)
            s.reves.append(j.carte)
            self.log(f"{j.carte} part en rêve")
            self.faire_rever(s, "carte")
        # 4. Autres actions, pouvoirs, cartes glissées ; puis barrages et sabotages
        for inst in self.instances:
            self.ee.barres |= inst.barres_passives()
        for j in normaux:
            if j.action is None:
                self.declarer(j)
            if j.pouvoir:
                j.pouvoir.apres_action(j)
            for a in j.attaches:
                self.declarer(a, zones=[j.zone])
                if a.pouvoir:
                    a.pouvoir.apres_action(a)
        for j in self.ee.actifs:
            if j.action == "barrer":
                self.ee.barres.add(j.zone)
        for j in list(self.ee.actifs):
            if j.action == "saboter":
                self.resoudre_sabotage(j)
        # 5. L'ordre du Méchant
        info = self.ee.info = self.tirer_ordre(e)
        # 6. Embuscades
        for j in embusques:
            self.embuscade(j, info)
        # 7. Exécution et apprentissage
        if info is not None:
            self.executer_et_apprendre(info)

    def options_aller(self, jeu):
        """R3.2 (+ Voler, Se fondre)"""
        P = self.plateau
        opts = []
        if "aller" not in self.actions_permises(jeu.carte.peuple):
            return opts
        for src in self.zones_presence(jeu.carte.peuple):
            dsts = jeu.pouvoir.destinations(src) if jeu.pouvoir else None
            if dsts is None:
                dsts = P.adj[src]
            opts += [("aller", src, d) for d in P.tries(dsts)]
        return opts

    def options_agir(self, jeu, zones=None):
        """R3.1, R3.3, R3.4"""
        if zones is None:
            zones = self.zones_presence(jeu.carte.peuple)
        permises = self.actions_permises(jeu.carte.peuple)
        opts = []
        for z in self.plateau.tries(zones):
            if self.R["action_soutenir"]:
                opts.append(("soutenir", z))
            if "barrer" in permises:
                opts.append(("barrer", z))
            if "saboter" in permises:
                for m in self.machines:
                    if m.tourne and m.zone == z:
                        opts += [("saboter", z, m.uid, o) for o, n in m.organes.items() if not n]
        if not opts:
            # Aucune action possible (peuple sans action dans ces zones) : la
            # carte reste dans sa zone, sans effet, et compte pour l'alliance.
            opts = [("soutenir", z) for z in self.plateau.tries(zones)]
        return opts

    def options_parler(self, jeu):
        """R6.10 : un déplacement qui mettrait deux cartes d'un même joueur sur
        une étape (à cause d'une carte d'insecte glissée) n'est pas permis."""
        suivantes = [e for e in self.etapes if e > jeu.etape]
        opts, exclus = [], 0
        for e2 in suivantes:
            for s in sorted(self.prog[e2]):
                if self.prog[e2][s].voir:          # face visible : pas « encore cachée »
                    continue
                for e3 in suivantes:
                    if e3 == e2:
                        continue
                    if self._parler_conflit(s, e2, e3):
                        exclus += 1
                    else:
                        opts.append(("deplacer", s, e2, e3))
        if exclus:
            self.lacune("parler_conflit_glissee", f"{exclus} déplacement(s) exclu(s)")
        return opts

    def _parler_conflit(self, s, e2, e3):
        a = self.prog[e2][s]
        b = self.prog[e3].get(s)
        bouges = {id(a): e3}
        for g in a.attaches:
            bouges[id(g)] = e3
        if b is not None and b.voir:
            return True                            # on n'échange pas avec une carte visible
        if b is not None:
            bouges[id(b)] = e2
            for g in b.attaches:
                bouges[id(g)] = e2
        tous = [j for v in self.prog.values() for j in v.values()] + self.glisses
        apres = Counter()
        for j in tous:
            apres[(j.siege, bouges.get(id(j), j.etape))] += 1
        return any(n > 1 for n in apres.values())

    def appliquer_aller(self, jeu, choix):
        _, src, dst = choix
        c = self.presence[jeu.carte.peuple]
        c[src] -= 1
        if c[src] == 0:
            del c[src]
        c[dst] += 1
        jeu.action, jeu.zone = "aller", dst
        self.ee.actifs.append(jeu)
        self.log(f"  {jeu.carte} : présence {src}->{dst}")

    def declarer(self, jeu, zones=None):
        opts = self.options_agir(jeu, zones)
        if zones is None:
            opts = self._tenir_engagement(jeu, opts, lambda o: o[1])  # R2.5
        choix = self.decider(self.siege(jeu), "action", opts, jeu=jeu)
        jeu.action, jeu.zone = choix[0], choix[1]
        jeu.cible = choix[2:] if choix[0] == "saboter" else None
        self.ee.actifs.append(jeu)
        self.log(f"  {jeu.carte} ({jeu.regle}) : {choix}")

    def deplacer_carte(self, s, e2, e3):
        a = self.prog[e2].pop(s)
        b = self.prog[e3].pop(s, None)
        a.etape = e3
        self.prog[e3][s] = a
        if b is not None:
            b.etape = e2
            self.prog[e2][s] = b
        for j in (a, b):
            if j is not None:
                for g in j.attaches:
                    g.etape = j.etape
        self.stat("parler")
        self.log(f"  parler : carte de {self.sieges[s].peuple} {e2}->{e3}")

    def embuscade(self, jeu, info):
        """R6.6 : la carte agit après le tirage, l'ordre étant connu."""
        s = self.siege(jeu)
        opts = (self.options_agir(jeu) + self.options_aller(jeu)
                + jeu.pouvoir.options_immobiliser(jeu, info))
        opts = self._tenir_engagement(jeu, opts, lambda o: o[2] if o[0] == "aller" else o[1])  # R2.5
        choix = self.decider(s, "embuscade", opts, jeu=jeu, info=info)
        self.stat("embuscades")
        self.log(f"  embuscade {jeu.carte} : {choix}")
        if choix[0] == "aller":
            self.appliquer_aller(jeu, choix)
        else:
            jeu.action, jeu.zone = choix[0], choix[1]
            jeu.cible = choix[2:] if choix[0] == "saboter" else None
            self.ee.actifs.append(jeu)
            if choix[0] == "barrer":
                self.ee.barres.add(jeu.zone)
            elif choix[0] == "immobiliser":
                jeu.pouvoir.immobiliser(self.machine(choix[2]))
            elif choix[0] == "saboter":
                self.resoudre_sabotage(jeu)
        jeu.pouvoir.apres_action(jeu)
        for a in jeu.attaches:
            self.declarer(a, zones=[jeu.zone])
            if a.pouvoir:
                a.pouvoir.apres_action(a)
            if a.action == "barrer":
                self.ee.barres.add(a.zone)
            elif a.action == "saboter":
                self.resoudre_sabotage(a)

    # =================================================================== ordre
    def tirer_ordre(self, e):
        """R4.1 : la tuile désignée par les dés ; un esprit : pas d'ordre (R6.11 : Hanter, pas de dés)."""
        if self.ee.annule:
            self.stat("ordres_hantes")
            self.log("  hanté : l'ordre est annulé")
            return None
        d = self.des_vus.get(e) or self.lancer_des()
        if self.R["plan"] != "une_piste":
            return self._tirer_ordre_v2(e, d)
        case = sum(d)
        tuile = self.piste[case]
        if e in self.tuile_vue and self.tuile_vue[e] is not tuile:
            if self.des_source.get(e) == "presage":
                self.stat("presage_detourne")                    # R2.6 : un rêve a changé la case annoncée
            else:
                self.stat("voir_detourne")                       # R6.2 : permis (décision B4 du 12 oct.)
        self.log(f"Dés : {case} -> {tuile}")
        if tuile.genre == "esprit":
            self.stat("reves_tires")
            self.log("  esprit tiré : le Méchant rêve")
            return None
        self.stat("ordres")
        info = {"tuile": tuile, "case": case, "cible": None, "machine": None}
        if tuile.genre == "tactique":
            info["cible"] = self.cible(tuile)
            info["machine"] = self.machine_pour(info["cible"])
            self.log(f"  {tuile.nom} vise {info['cible']} ; Machine : {info['machine']}")
        return info

    def _tirer_ordre_v2(self, e, d):
        """[v2:A2a] [v2:A2b] : la somme et l'écart des dés."""
        info = self.interpreter(d)
        tuile = info["tuile"]
        if e in self.tuile_vue and self.tuile_vue[e] is not tuile:
            if self.des_source.get(e) == "presage":
                self.stat("presage_detourne")
            else:
                self.stat("voir_detourne")                       # R6.2 : permis (décision B4 du 12 oct.)
        self.log(f"Dés : {d[0]}+{d[1]} -> {tuile}, écart {info['ecart']} : {info['action']}"
                 + (f" {info['machine'].nom}" if info["machine"] else "")
                 + (f" ({info['manoeuvre'].nom})" if info.get("manoeuvre") else "")
                 + (f" vers {info['cible']}" if info["cible"] else ""))
        if info["action"] == "reve":
            self.stat("reves_tires")
            return None
        self.stat("ordres")
        return info

    def executer(self, info):
        t = info["tuile"]
        if t.genre == "chantier":
            return CHANTIER[t.spec["ordre"]](self, t.spec.get("params", {}))
        m, cible = info["machine"], info["cible"]
        if m is None:
            self.lacune("sans_machine")
            return False
        if not m.tourne:
            self.stat("machine_hs_avant_ordre")
            self.log(f"  {m.nom} a été mise HS avant d'agir")
            return False
        if self.immobilisee(m):                             # R6.6
            self.lacune("ordre_contre_immobile", m.nom)
            self.log(f"  {m.nom} est immobilisée : elle ne bouge ni n'abat")
            return False
        immobile = self.R["effets_organes"] and m.organes.get("chenilles")
        z = m.zone
        if self.R["barrage"] == "bloque":                   # R4.4
            if z in self.ee.barres and (self.R["barrage_sortie"] or z == cible or immobile):   # [v2:B2]
                self.stat("bloquee_par_barrage")
                self.log(f"  {m.nom} est bloquée dans sa zone barrée")
                return False
            if z != cible and not immobile:
                n = self.pas_suivant(m, cible)
                if n is None:
                    self.stat("bloquee_par_barrage")
                    self.log(f"  {m.nom} ne peut pas avancer : barrage")
                    return False
                if not self._avancer(m, n):
                    return False
        else:                                               # v0 : la Machine contourne
            if not immobile:
                n = self.pas_suivant(m, cible)
                if n is not None:
                    if not self._avancer(m, n):
                        return False
                elif z != cible:
                    self.stat("bloquee_par_barrage")
        return self._abattre(m, cible)

    def _avancer(self, m, n):
        m.zone = n
        self.log(f"  {m.nom} avance en {n}")
        if self.zone_tenue(n):
            self.stat("arrets_tenir")
            self.log(f"  {m.nom} est arrêtée par les mammifères")
            return False
        return True

    def _abattre(self, m, cible):
        z = m.zone
        P = self.plateau
        if z in self.ee.barres or self.zone_tenue(z):
            return False
        if P.foret[z] == 0:
            self.stat("abattage_zone_rasee")
            return False
        if self.R["effets_organes"] and m.organes.get("moteur"):
            return False
        P.foret[z] -= 1
        self.log(f"  {m.nom} abat 1 forêt en {z} (reste {P.foret[z]})")
        if z != cible:
            self.stat("coupe_hors_cible")
            if cible in self.ee.barres:
                if self.R["barrage"] == "v0":                 # témoin v0 : la Machine contourne le barrage
                    self.incoherence("barrage_contourne", f"cible {cible}, coupe en {z}")
                else:                                         # R4.3 : abattre en chemin est permis (décision B4)
                    self.stat("coupe_en_chemin_cible_barree")
        if P.foret[z] == 0:
            self.stat("zones_rasees")
        return True

    def executer_et_apprendre(self, info):
        if self.R["plan"] != "une_piste":
            return self.executer_et_apprendre_v2(info)
        tuile = info["tuile"]
        avant = self.plateau.total
        reussite = self.executer(info)                     # R4.6
        self._noter_ordre(info, reussite, avant)
        self.stat("ordres_reussis" if reussite else "ordres_echoues")
        if tuile.genre == "chantier" and self.R["reussite"] == "foret":
            reussite = False
        for s in self.ee.trompeurs:                        # R6.9
            if self.decider(s, "tromper", [False, True], reussite=reussite):
                reussite = not reussite
                self.stat("tromperies")
                self.log("  tromperie : le résultat appris est inversé")
                break
        case = info["case"]
        if self.piste[case] is not tuile:
            ou = [c for c in CASES if self.piste[c] is tuile]
            self.lacune("tuile_deplacee_avant_apprentissage", f"{tuile} {case}->{ou}")
            if not ou:
                return
            case = ou[0]
        self.apprendre(case, reussite)

    # =================================================================== fin du tour
    def fin_de_tour(self):
        """R2.4 (et R6.6 : fin des immobilisations)."""
        self.immobiles_tour = set()
        C = self.M["cartes"]
        for s in self.sieges:
            s.main.extend(s.joues)
            s.joues = []
            if C.get("reprendre_du_paquet"):
                while len(s.main) < C["main"] and s.paquet:
                    s.main.append(s.paquet.pop())
        if self.R["fin_de_partie"] == "fin_de_tour":
            if self.piste[CENTRE].genre == "esprit":
                self.terminer("sommeil")
            if self.esprit_vu_au_centre:
                self.incoherence("centre_quitte_sans_sommeil")
                self.esprit_vu_au_centre = False
            if self.silence_atteint():
                self.terminer("silence")
        if self.R["premier_joueur_tournant"]:
            self.ordre = self.ordre[1:] + self.ordre[:1]

    def dernier_sursaut(self):
        """Hors maquette v1 ; [v2:D6]."""
        self.ee = EtatEtape()
        if self.R["plan"] != "une_piste":
            return self.dernier_sursaut_v2()
        for _ in range(self.R["sursaut_max"] or 0):
            case = sum(self.lancer_des())
            t = self.piste[case]
            if t.genre == "esprit":
                break
            self.stat("ordres_sursaut")
            info = {"tuile": t, "case": case, "cible": None, "machine": None}
            if t.genre == "tactique":
                info["cible"] = self.cible(t)
                info["machine"] = self.machine_pour(info["cible"])
            try:
                self.executer(info)
            except FinDePartie:
                break

    # =================================================================== invariants
    def controler(self):
        if sorted(self.piste) != list(CASES):
            raise ErreurMoteur("piste : cases manquantes")
        uids = [t.uid for t in self.piste.values()]
        if len(set(uids)) != len(uids):
            raise ErreurMoteur("piste : tuile en double")
        P = self.plateau
        for z, f in P.foret.items():
            if not 0 <= f <= P.foret0[z]:
                raise ErreurMoteur(f"forêt hors bornes en {z} : {f}")
        for m in self.machines:
            if (m.etat == "plateau") != (m.zone is not None) or (m.zone is not None and m.zone not in P.adj):
                raise ErreurMoteur(f"{m} : position incohérente")
        n = self.M["presence"]["pions"]
        for p, c in self.presence.items():
            if sum(c.values()) != n or any(v < 0 for v in c.values()):
                raise ErreurMoteur(f"présence de {p} incohérente : {dict(c)}")
        for s in self.sieges:
            tout = s.main + s.joues + s.reves + s.paquet
            if sorted(c.uid for c in tout) != sorted(c.uid for c in s.deck):
                raise ErreurMoteur(f"cartes de {s.peuple} incohérentes")
        cap = self.R["reves_par_joueur_et_tour"]
        jeux = [j for v in self.prog.values() for j in v.values()] + self.glisses
        for s in self.sieges:
            mine = [j for j in jeux if j.siege == s.idx]
            if cap is not None and sum(1 for j in mine if j.mode == "reve") > cap:
                raise ErreurMoteur(f"{s.peuple} : plus de {cap} rêve(s) ce tour")
            if len({j.etape for j in mine}) != len(mine):
                raise ErreurMoteur(f"{s.peuple} : deux cartes sur une même étape")
        for inst in self.instances:
            lim = inst.p.get("par_tour")
            if lim is not None and inst.utilises > lim:
                raise ErreurMoteur(f"{inst.nom} utilisé {inst.utilises} fois ce tour")
            lim_emb = inst.p.get("embuscades_par_tour")
            if isinstance(inst, POUVOIRS["attendre"]) and lim_emb is not None:
                emb = sum(1 for j in jeux if j.pouvoir is inst)
                if emb > lim_emb:
                    raise ErreurMoteur(f"{emb} embuscades ce tour")
        if self.R["plan"] == "qui_ou":                              # [v2:A2a]
            ms = [m for m in self.piste_m.values() if m is not None]
            if len({id(m) for m in ms}) != len(ms) or len(ms) != len(self.machines):
                raise ErreurMoteur("piste des Machines incohérente")
        if self.R["plan"] == "ou_comment" and len({t.uid for t in self.manoeuvres.values()}) != 6:
            raise ErreurMoteur("piste des manœuvres incohérente")
        if len(self.cercle) > self.capacite_cercle() or (len(self.cercle) == self.capacite_cercle() and self.fin is None):
            raise ErreurMoteur("Cercle plein sans fin de partie")
        if self.R["lunes"] is not None and self.lunes:
            tenues = [x for x in self.lunes if x is not None]
            if len(tenues) != len(set(tenues)):
                raise ErreurMoteur("deux lunes devant un même joueur")
        c = self.R["communication"]                                 # R2.5
        n = len(self.etapes) if c == "tout_dire" else self.R["traces_par_joueur"]
        for i, ts in self.traces.items():
            if len(ts) > n or len(set(ts)) != len(ts):
                raise ErreurMoteur(f"traces de {self.sieges[i].peuple} incohérentes : {ts}")
            if ts and c not in ("traces", "parle", "tout_dire"):
                raise ErreurMoteur("traces posées sans communication par traces")
        for u, h in self.jetons.items():
            if len(h) != 2 or (h[0] is not None and h[0] == h[1]):
                raise ErreurMoteur(f"jetons du partage incohérents : {h}")
        for i in range(len(self.sieges)):
            if sum(1 for h in self.jetons.values() if i in h) > self.R["partage_max"]:
                raise ErreurMoteur(f"{self.sieges[i].peuple} tient trop de jetons")
        for s in self.sieges:
            if "saboter" not in self.actions_permises(s.peuple):
                if any(j.action == "saboter" and j.carte.peuple == s.peuple for j in self.ee.actifs):
                    raise ErreurMoteur(f"{s.peuple} a saboté alors que la maquette l'interdit")
        if self.R["fin_de_partie"] == "immediate" and self.fin is None:
            if self.piste[CENTRE].genre == "esprit":
                raise ErreurMoteur("esprit au centre sans fin de partie")
            with self.muet():
                if self.silence_atteint():
                    raise ErreurMoteur("silence sans fin de partie")

    # =================================================================== aide aux bots
    def prevision(self):
        """Probabilité qu'un ordre abatte dans chaque zone à la prochaine étape,
        sans tenir compte des barrages. Lecture sans effet de bord."""
        memo = getattr(self, "_memo_prevision", None)
        if memo is not None:
            if "p" not in memo:
                memo["p"] = self._prevision()
            return Counter(memo["p"])
        return self._prevision()

    def _prevision(self):
        # pendant une prévision (lecture sans effet de bord), la présence ne bouge pas
        self._memo_defense = {}
        try:
            return self._prevision_brute()
        finally:
            self._memo_defense = None

    def _prevision_brute(self):
        if self.R["plan"] != "une_piste":
            return self.prevision_v2()
        menace = Counter()
        with self.muet():
            for c in CASES:
                t = self.piste[c]
                if t.genre != "tactique":
                    continue
                cible = self.cible(t)
                m = self.machine_pour(cible)
                if m is None:
                    continue
                n = self.pas_suivant(m, cible, avec_barrages=False, compter=False)
                z = n or m.zone
                if self.plateau.foret[z] > 0:
                    menace[z] += PROBA[c]
        return menace

    # =================================================================== bilan
    def bilan(self):
        """R8.2 : la forêt restante (et de quoi analyser la partie)."""
        genre, tour, etape = self.fin
        P = self.plateau
        b = {
            "graine": self.graine,
            "maquette": self.M["nom"],
            "variante": self.M.get("variante", "defaut"),
            "peuples": [s.peuple for s in self.sieges],
            "fin": genre, "tour": tour, "etape": etape,
            "foret": P.total, "foret_initiale": P.total0,
            "zones_rasees": sum(1 for f in P.foret.values() if f == 0),
            "machines_hs": sum(1 for m in self.machines if m.etat == "plateau" and m.hs),
            "machines_retirees": sum(1 for m in self.machines if m.etat == "retiree"),
            "esprits": self.esprits(),
            "tactiques": dict(Counter(t.nom for t in self.piste.values() if t.genre == "tactique")),
            "tactiques_eveil": sum(1 for c in CASES if c < CENTRE and self.piste[c].genre == "tactique"),
            "tactiques_reve": sum(1 for c in CASES if c > CENTRE and self.piste[c].genre == "tactique"),
            "cartes_en_reve": sum(len(s.reves) for s in self.sieges),
            "cartes_en_reve_par_siege": [len(s.reves) for s in self.sieges],
        }
        # [v2:D4] le résultat : la forêt restante, plus le bonus selon la fin (0 par défaut, A12)
        bonus = P.total0 * self.R["bonus_fin"] / 100 if genre in ("sommeil", "reveil") else 0
        b["resultat"] = P.total + bonus
        b["cercle"] = len(self.cercle)
        b["cercle_capacite"] = self.capacite_cercle()
        for o in self.observateurs:
            o.fin(self, b)
        return b
