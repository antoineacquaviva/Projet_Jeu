"""Les règles brisées des peuples (R6).

Un pouvoir est une classe déclarée dans le registre POUVOIRS. La maquette
attribue les pouvoirs aux moitiés de carte des peuples (section « peuples ») et
fixe leurs paramètres (section « pouvoirs »). Le moteur crée une instance par
partie et par (peuple, moitié), plus une par trait permanent, puis appelle ses
points d'accroche aux moments prévus. Par défaut, un point d'accroche ne fait
rien : un nouveau pouvoir n'écrit que ceux dont il a besoin.

Paramètres communs : actif (false = la moitié n'a plus de pouvoir),
par_tour (nombre d'utilisations par tour, null = illimité).
"""
from .registre import Registre
from .erreurs import ErreurMaquette

POUVOIRS = Registre("pouvoir")
ORGANES = ("moteur", "chenilles", "phares")


class Pouvoir:
    silencieux = False   # pour la règle du bruit (hors maquette v1)
    modes = None         # valeurs admises du paramètre « mode », si le pouvoir en a un

    def __init__(self, partie, peuple, moitie, nom, params):
        self.partie = partie
        self.peuple = peuple
        self.moitie = moitie        # "haut", "bas" ou None pour un trait permanent
        self.nom = nom
        self.p = dict(params)
        self.utilises = 0
        self.valider(nom, self.p)

    @classmethod
    def valider(cls, nom, params):
        """Contrôle des paramètres, appelé aussi au chargement de la maquette."""
        if cls.modes is not None and params.get("mode") not in cls.modes:
            raise ErreurMaquette(f"{nom} : mode {params.get('mode')!r} inconnu (admis : {cls.modes})")
        lim = params.get("par_tour")
        if lim is not None and (not isinstance(lim, int) or lim < 0):
            raise ErreurMaquette(f"{nom} : par_tour doit être un entier >= 0 ou null")

    @property
    def siege(self):
        return self.partie.par_peuple[self.peuple]

    def disponible(self):
        lim = self.p.get("par_tour")
        return lim is None or self.utilises < lim

    # -- conseil ---------------------------------------------------------
    def debut_tour(self):
        self.utilises = 0

    def conseil(self, siege):
        """Avant la programmation (Voir)."""

    def mode_autorise(self, siege, deja):
        """Cette moitié peut-elle encore être programmée ce tour ? deja = les
        cartes déjà programmées par ce joueur ce tour."""
        return True

    def options_hote(self, siege, etape):
        """Sièges sous la carte desquels cette carte peut se glisser (S'unir)."""
        return []

    # -- révélation -------------------------------------------------------
    def destinations(self, src):
        """Zones atteignables par Aller depuis src (None = les zones voisines)."""
        return None

    def differe(self, jeu):
        """La carte agit-elle après le tirage des dés (embuscade) ?"""
        return False

    def sabotage_seul(self, organe):
        return False

    def apres_action(self, jeu):
        """Une fois l'action de la carte choisie."""

    def apres_neutralisation(self, jeu, machine, organe):
        pass

    def machine_hs(self, machine, jeu):
        """Appelé pour tous les pouvoirs en jeu quand une Machine tombe HS."""

    # -- traits permanents ---------------------------------------------------
    def invisible(self):
        """La présence de ce peuple échappe-t-elle aux critères ?"""
        return False

    def tient_passivement(self, zone):
        return False

    def barres_passives(self):
        """Zones barrées à chaque étape sans qu'aucune carte soit jouée."""
        return set()

    def utiliser(self, jeu, contexte=None):
        """Demande au joueur s'il utilise ce pouvoir maintenant (décision
        « pouvoir »), en respectant la limite par tour. Rend True si utilisé."""
        if not self.disponible():
            return False
        if self.partie.decider(self.siege, "pouvoir", [False, True], pouvoir=self.nom,
                               jeu=jeu, contexte=contexte):
            self.utilises += 1
            self.partie.stat("pouvoir_" + self.nom)
            return True
        return False


@POUVOIRS("voir")
class Voir(Pouvoir):
    """R6.2 : poser des cartes face visible et lancer les dés de leur étape."""

    def conseil(self, siege):
        P = self.partie
        for e in P.etapes:
            if not siege.main or not self.disponible():
                break
            if siege.idx in P.prog[e]:
                continue
            carte = P.decider(siege, "voir", [None] + list(siege.main), etape=e)
            if carte is not None:
                self.utilises += 1
                P.poser_voir(siege, carte, self.moitie, e)


@POUVOIRS("voler")
class Voler(Pouvoir):
    """R6.3 : Aller vers n'importe quelle zone."""

    def destinations(self, src):
        return set(self.partie.plateau.zones) - {src}


@POUVOIRS("tenir")
class Tenir(Pouvoir):
    """R6.4. Modes :
    - zones_presence (v1) : la carte barre toutes les zones où les mammifères
      sont présents, pendant son étape ;
    - passif : ces zones sont barrées à chaque étape, sans carte ;
    - barrer_en_plus : la carte barre sa zone, en plus de son action ;
    - v0_carte, v0_passive : une Machine qui entre s'arrête et aucune n'y abat
      (zone de la carte, ou toute zone de présence)."""
    modes = ("zones_presence", "passif", "barrer_en_plus", "v0_carte", "v0_passive")

    def apres_action(self, jeu):
        P, mode = self.partie, self.p["mode"]
        if mode == "barrer_en_plus":
            P.ee.barres.add(jeu.zone)
        elif mode == "zones_presence":
            P.ee.barres.update(P.zones_presence(self.peuple))
            P.stat("tenir_zones", len(P.zones_presence(self.peuple)))
        elif mode == "v0_carte":
            P.ee.tenues.add(jeu.zone)

    def barres_passives(self):
        if self.p["mode"] == "passif":
            return set(self.partie.zones_presence(self.peuple))
        return set()

    def tient_passivement(self, zone):
        return self.p["mode"] == "v0_passive" and self.partie.presence[self.peuple][zone] > 0


class Specialiste(Pouvoir):
    """R6.1 : sabote seul les organes listés (paramètre organes, ou "tous")."""

    @classmethod
    def valider(cls, nom, params):
        super().valider(nom, params)
        org = params.get("organes", [])
        if org != "tous" and (not isinstance(org, list) or any(o not in ORGANES for o in org)):
            raise ErreurMaquette(f"{nom} : organes inconnus {org}")

    @property
    def organes(self):
        org = self.p.get("organes", [])
        return set(ORGANES) if org == "tous" else set(org)

    def sabotage_seul(self, organe):
        return organe in self.organes


@POUVOIRS("renverser")
class Renverser(Specialiste):
    pass


@POUVOIRS("enrayer")
class Enrayer(Specialiste):
    silencieux = True


@POUVOIRS("egarer")
class Egarer(Specialiste):
    """R6.5 : une Machine HS dont les phares ont été égarés quitte le plateau
    et fait rêver le Méchant."""
    silencieux = True

    def apres_neutralisation(self, jeu, machine, organe):
        if organe == "phares":
            machine.egaree = True

    def machine_hs(self, machine, jeu):
        if machine.egaree and machine.etat == "plateau":
            P = self.partie
            if P.R["egarer"] == "chantier":                 # [v2:B3] elle rentre au chantier, remise en état
                machine.etat, machine.zone, machine.egaree = "reserve", None, False
                for o in machine.organes:
                    machine.organes[o] = False
                P.log(f"  {machine.nom} s'égare et rentre au chantier")
            else:
                machine.etat, machine.zone = "retiree", None
                P.log(f"  {machine.nom} s'égare et entre dans la tête du Méchant")
            P.stat("machines_egarees")
            P.faire_rever(self.siege, "egarer")


@POUVOIRS("attendre")
class Attendre(Pouvoir):
    """R6.6 : embuscade. La carte agit après le tirage des dés, avant que la
    Machine bouge. Paramètres :
    - embuscades_par_tour : nombre de cartes en embuscade par tour (null = illimité) ;
    - immobiliser : l'embuscade peut immobiliser la Machine désignée si elle est
      dans une zone de présence reptile ou va y entrer ;
    - par_tour : nombre d'immobilisations par tour (null = illimité) ;
    - duree : "etape" (v0 : l'ordre échoue) ou "tour" (v1 : la Machine reste
      immobile jusqu'à la fin du tour)."""

    @classmethod
    def valider(cls, nom, params):
        super().valider(nom, params)
        if params.get("duree", "etape") not in ("etape", "tour"):
            raise ErreurMaquette("attendre : duree = etape | tour")

    def mode_autorise(self, siege, deja):
        lim = self.p.get("embuscades_par_tour")
        return lim is None or sum(1 for j in deja if j.mode == self.moitie) < lim

    def differe(self, jeu):
        return True

    def options_immobiliser(self, jeu, info):
        P = self.partie
        if not self.p.get("immobiliser") or not self.disponible():
            return []
        if info and "action" in info:                       # [v2:A2a] [v2:A2b] machines désignées
            out = []
            for m, zs in P.zones_de_l_ordre(info):
                out += [("immobiliser", z, m.uid) for z in P.plateau.tries(z for z in zs if z)
                        if P.presence[self.peuple][z] > 0]
            return out
        if not info or info.get("machine") is None:
            return []
        m = info["machine"]
        zs = {m.zone}
        n = P.pas_suivant(m, info["cible"], compter=False)
        if n:
            zs.add(n)
        return [("immobiliser", z, m.uid) for z in P.plateau.tries(zs)
                if P.presence[self.peuple][z] > 0]

    def immobiliser(self, machine):
        self.utilises += 1
        self.partie.immobiliser(machine, self.p.get("duree", "etape"))


@POUVOIRS("se_fondre")
class SeFondre(Pouvoir):
    """R6.7 (moitié plateau) : Aller le long d'une rivière, aussi loin que voulu."""

    def destinations(self, src):
        P = self.partie.plateau
        return P.adj[src] | P.par_riviere(src)


@POUVOIRS("invisible")
class Invisible(Pouvoir):
    """R6.7 (trait permanent) : présence invisible aux critères."""

    def invisible(self):
        return True


@POUVOIRS("s_unir")
class SUnir(Pouvoir):
    """R6.8 : glisser sa carte sous l'étape d'un autre joueur."""

    def options_hote(self, siege, etape):
        return [s.idx for s in self.partie.sieges if s.idx != siege.idx]


@POUVOIRS("tromper")
class Tromper(Pouvoir):
    """R6.9 : peut inverser ce que le Méchant apprend à cette étape."""

    def apres_action(self, jeu):
        tr = self.partie.ee.trompeurs
        if self.siege not in tr:
            tr.append(self.siege)


@POUVOIRS("parler")
class Parler(Pouvoir):
    """R6.10 : déplacer une carte cachée d'une étape suivante."""

    def apres_action(self, jeu):
        P = self.partie
        opts = P.options_parler(jeu)
        if opts:
            choix = P.decider(self.siege, "parler", [None] + opts, jeu=jeu)
            if choix is not None:
                P.deplacer_carte(*choix[1:])


@POUVOIRS("hanter")
class Hanter(Pouvoir):
    """R6.11 : quand la carte agit, le joueur peut annuler l'ordre de l'étape
    (par_tour fois par tour). Paramètre choix : false = utilisé d'office dès
    que possible (comportement v0)."""

    def apres_action(self, jeu):
        if self.partie.ee.annule:
            return
        if self.p.get("choix", True):
            if self.utiliser(jeu):
                self.partie.ee.annule = True
        elif self.disponible():
            self.utilises += 1
            self.partie.ee.annule = True
