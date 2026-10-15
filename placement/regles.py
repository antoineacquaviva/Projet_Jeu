"""Le modèle « placement » : la mécanique de base seule (règles P1 à P6, docs/regles_placement.md).

Un plateau en grille, des arbres par case, des Machines (le Méchant) et des individus (le Gentil).
Chaque tour : le Méchant annonce m menaces (hasard contrôlé), le Gentil donne k ordres,
puis n menaces s'exécutent sans autre choix. Une menace non parée abat exactement un arbre ;
un ordre pare au plus une menace. D'où la borne n - k <= perte du tour <= n (P5.1).

Pur Python, sans dépendance. Les structures sont des listes d'entiers pour que la copie
d'un état (simulations des bots) reste bon marché.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field, asdict, replace

TACTIQUES = ("cupidite", "percee", "opportunisme", "represailles")

# Types d'ordres du Gentil (P3.2)
RIEN, GARDER, ALLER, SABOTER, POSTER = "rien", "garder", "aller", "saboter", "poster"


@dataclass(frozen=True)
class Params:
    """Paramètres d'une variante (P6). Les valeurs par défaut sont la configuration de départ de l'étude."""
    largeur: int = 5
    hauteur: int = 5
    voisinage: int = 4             # 4 (orthogonal) ou 8 (avec diagonales)
    arbres: int = 3                # arbres par case (moyenne)
    profil: str = "uniforme"       # uniforme | coeur (plus au centre) | bosquets (au hasard, graine)
    machines: int = 3              # M
    entree: str = "front"          # front (une lisière, rangée 0) | bords (cases du bord au hasard)
    individus: int = 3             # p
    n: int = 3                     # menaces exécutées par tour
    k: int = 2                     # ordres du Gentil par tour (un au plus par individu)
    tours: int = 8                 # t
    annonces: int = 5              # m >= n ; 0 = aucune annonce (les menaces sont tirées à l'exécution)
    tactiques: tuple = (("cupidite", 1), ("percee", 1), ("opportunisme", 1), ("represailles", 1))
    portee: int = 1                # cases franchies par Aller
    aller_garder: bool = False     # Poster : aller puis garder la case d'arrivée, en un seul ordre
    sabotage: str = "echappe"      # aucun | fige (la Machine reste) | echappe (elle avance sans abattre) | allie (deux saboteurs)
    garde_portee: int = 0          # 0 : la garde protège sa case ; 1 : sa case et les voisines (une seule parade)
    joueurs: int = 0               # P3.4 bis : 0 = Gentil unique ; J > 0 = individus répartis entre J joueurs,
                                   # chacun donnant au plus ceil(k / J) ordres, à ses propres individus

    def valider(self):
        err = []
        if self.voisinage not in (4, 8):
            err.append("voisinage 4 ou 8")
        if not (1 <= self.k < self.n):
            err.append("il faut 1 <= k < n (la perte du tour est d'au moins un arbre, P5.1)")
        if self.k > self.individus:
            err.append("k <= individus (un ordre au plus par individu)")
        if self.annonces and self.annonces < self.n:
            err.append("annonces = 0 ou annonces >= n")
        if self.sabotage not in ("aucun", "fige", "echappe", "allie"):
            err.append("sabotage inconnu")
        if self.profil not in ("uniforme", "coeur", "bosquets"):
            err.append("profil inconnu")
        if self.entree not in ("front", "bords"):
            err.append("entrée inconnue")
        if self.joueurs and not (1 <= self.joueurs <= self.individus):
            err.append("1 <= joueurs <= individus (chaque joueur a au moins un individu)")
        if self.foret_initiale() <= self.n * self.tours:
            err.append("forêt initiale <= n x t : r > 0 ne serait pas garanti (P5.2)")
        for nom, poids in self.tactiques:
            if nom not in TACTIQUES or poids < 0:
                err.append(f"tactique {nom!r}")
        if err:
            raise ValueError("; ".join(err))
        return self

    # La forêt initiale ne dépend pas de la graine pour les profils uniforme et coeur ;
    # pour « bosquets », le total est conservé (on redistribue).
    def foret_initiale(self):
        return self.largeur * self.hauteur * self.arbres

    def avec(self, **kw):
        if "tactiques" in kw and isinstance(kw["tactiques"], dict):
            kw["tactiques"] = tuple(sorted(kw["tactiques"].items()))
        return replace(self, **kw)

    def en_dict(self):
        d = asdict(self)
        d["tactiques"] = dict(self.tactiques)
        return d

    @staticmethod
    def depuis(d):
        d = dict(d)
        if "tactiques" in d and isinstance(d["tactiques"], dict):
            d["tactiques"] = tuple(sorted(d["tactiques"].items()))
        return Params(**d)


class Plateau:
    """La géométrie, calculée une fois par variante : voisins, distances, centre."""

    def __init__(self, p: Params):
        self.W, self.H = p.largeur, p.hauteur
        self.N = self.W * self.H
        diag = p.voisinage == 8
        self.voisins = []
        for c in range(self.N):
            x, y = c % self.W, c // self.W
            v = []
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if (dx, dy) == (0, 0) or (not diag and dx and dy):
                        continue
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < self.W and 0 <= yy < self.H:
                        v.append(yy * self.W + xx)
            self.voisins.append(tuple(v))
        # distances en pas (BFS depuis chaque case ; plateau sans obstacle)
        self.dist = []
        for c in range(self.N):
            d = [-1] * self.N
            d[c] = 0
            file = [c]
            for u in file:
                for w in self.voisins[u]:
                    if d[w] < 0:
                        d[w] = d[u] + 1
                        file.append(w)
            self.dist.append(d)
        cx, cy = (self.W - 1) / 2, (self.H - 1) / 2
        # distance au cœur (centre géométrique), en demi-pas entiers pour des égalités stables
        self.coeur = [int(round(2 * (abs(c % self.W - cx) + abs(c // self.W - cy)))) for c in range(self.N)]
        self.portee_cache = {}

    def a_portee(self, c, r):
        """Cases à r pas au plus de c (c compris)."""
        cle = (c, r)
        if cle not in self.portee_cache:
            self.portee_cache[cle] = tuple(w for w in range(self.N) if self.dist[c][w] <= r)
        return self.portee_cache[cle]

    def bord(self):
        return [c for c in range(self.N) if c % self.W in (0, self.W - 1) or c // self.W in (0, self.H - 1)]


@dataclass
class Etat:
    """Une configuration (P1) : arbres par case, position des Machines et des individus, tour."""
    arbres: list
    machines: list
    individus: list
    tour: int = 0

    def copie(self):
        return Etat(self.arbres[:], self.machines[:], self.individus[:], self.tour)

    def foret(self):
        return sum(self.arbres)


def mise_en_place(p: Params, pl: Plateau, rng: random.Random):
    """P1.1 à P1.3. Les individus sont placés ensuite par le Gentil (P1.4)."""
    if p.profil == "uniforme":
        arbres = [p.arbres] * pl.N
    elif p.profil == "coeur":
        # plus d'arbres au cœur, moins en lisière, même total
        poids = [max(pl.coeur) + 1 - pl.coeur[c] for c in range(pl.N)]
        total = p.arbres * pl.N
        brut = [w * total / sum(poids) for w in poids]
        arbres = [max(1, int(b)) for b in brut]
        reste = total - sum(arbres)
        ordre = sorted(range(pl.N), key=lambda c: (brut[c] - int(brut[c])), reverse=True)
        i = 0
        while reste > 0:
            arbres[ordre[i % pl.N]] += 1
            reste -= 1
            i += 1
        while reste < 0:
            c = max(range(pl.N), key=lambda c: arbres[c])
            arbres[c] -= 1
            reste += 1
    else:  # bosquets : répartition au hasard, au moins 1 par case, même total
        total = p.arbres * pl.N
        arbres = [1] * pl.N
        for _ in range(total - pl.N):
            arbres[rng.randrange(pl.N)] += 1
    if p.entree == "front":
        lisiere = list(range(p.largeur))  # rangée 0
    else:
        lisiere = pl.bord()
    rng.shuffle(lisiere)
    machines = [lisiere[i % len(lisiere)] for i in range(p.machines)]
    return Etat(arbres, machines, [])


def tirer_annonces(p: Params, rng: random.Random):
    """P2.1 : le Méchant annonce m menaces (Machine au dé, tactique selon la composition de son jeu)."""
    m = p.annonces if p.annonces else p.n
    noms = [t for t, w in p.tactiques if w > 0]
    poids = [w for t, w in p.tactiques if w > 0]
    return [(rng.randrange(p.machines), rng.choices(noms, poids)[0]) for _ in range(m)]


def tirer_execution(p: Params, rng: random.Random):
    """P2.2 (Méchant au hasard) : les n menaces exécutées parmi les m annoncées, et leur ordre."""
    m = p.annonces if p.annonces else p.n
    return rng.sample(range(m), p.n)


def destination(p: Params, pl: Plateau, e: Etat, machine: int, tactique: str):
    """P4.2 et P4.3 : la case où la Machine veut abattre, lue sur la configuration du moment."""
    pos = e.machines[machine]
    arbres = e.arbres
    rayon = [c for c in (pos,) + pl.voisins[pos] if arbres[c] > 0]
    if not rayon:
        # P4.4 repli : la case boisée la plus proche (il en reste toujours, P5.2)
        d = pl.dist[pos]
        boisees = [c for c in range(pl.N) if arbres[c] > 0]
        return min(boisees, key=lambda c: (d[c], -arbres[c], pl.coeur[c], c)), True
    if tactique == "cupidite":
        cle = lambda c: (-arbres[c], pl.coeur[c], c != pos, c)
    elif tactique == "percee":
        cle = lambda c: (pl.coeur[c], -arbres[c], c != pos, c)
    else:
        pres = presence(e)
        if tactique == "opportunisme":
            cle = lambda c: (pres.get(c, 0), -arbres[c], pl.coeur[c], c)
        else:  # represailles
            cle = lambda c: (-pres.get(c, 0), -arbres[c], pl.coeur[c], c)
    return min(rayon, key=cle), False


def presence(e: Etat):
    pres = {}
    for c in e.individus:
        pres[c] = pres.get(c, 0) + 1
    return pres


def ordres_possibles(p: Params, pl: Plateau, e: Etat, i: int):
    """P3.2 : les ordres qu'un individu peut recevoir."""
    pos = e.individus[i]
    ops = [(RIEN, None), (GARDER, pos)]
    if p.sabotage != "aucun":
        for j, mpos in enumerate(e.machines):
            if mpos == pos:
                ops.append((SABOTER, j))
    for c in pl.a_portee(pos, p.portee):
        if c != pos:
            ops.append((ALLER, c))
            if p.aller_garder:
                ops.append((POSTER, c))
    return ops


def nb_ordres(programme):
    return sum(1 for o in programme if o[0] != RIEN)


def proprietaire(p: Params, i):
    """P3.4 bis : le joueur qui commande l'individu i (blocs contigus, aussi égaux que possible)."""
    return i * p.joueurs // p.individus if p.joueurs else 0


def ordres_par_joueur(p: Params):
    """P3.4 bis : chaque joueur donne au plus ceil(k / J) ordres (un seul dès que k <= J)."""
    return -(-p.k // p.joueurs) if p.joueurs else p.k


def permis(p: Params, programme):
    """Le programme respecte P3.1 (au plus k ordres) et P3.4 bis (la part de chaque joueur)."""
    if nb_ordres(programme) > p.k:
        return False
    if p.joueurs:
        lim = ordres_par_joueur(p)
        compte = {}
        for i, o in enumerate(programme):
            if o[0] != RIEN:
                j = proprietaire(p, i)
                compte[j] = compte.get(j, 0) + 1
                if compte[j] > lim:
                    return False
    return True


def reparer(p: Params, programme):
    """Rend un programme permis en retirant les ordres en trop (dans l'ordre des individus)."""
    if permis(p, programme):
        return programme
    prog = list(programme)
    lim = ordres_par_joueur(p)
    compte, total = {}, 0
    for i, o in enumerate(prog):
        if o[0] == RIEN:
            continue
        j = proprietaire(p, i)
        if total >= p.k or compte.get(j, 0) >= lim:
            prog[i] = (RIEN, None)
            continue
        compte[j] = compte.get(j, 0) + 1
        total += 1
    return prog


def appliquer_programme(p: Params, pl: Plateau, e: Etat, programme):
    """P3.3 : déplacements, puis gardes et sabotages posés. Renvoie (gardes, sabotages) : capacités restantes."""
    if nb_ordres(programme) > p.k:
        raise ValueError("plus de k ordres")
    if not permis(p, programme):
        raise ValueError("un joueur donne plus que sa part d'ordres (P3.4 bis)")
    gardes = {}
    saboteurs = {}
    for i, (typ, arg) in enumerate(programme):
        if typ in (ALLER, POSTER):
            if pl.dist[e.individus[i]][arg] > p.portee:
                raise ValueError("Aller hors de portée")
            e.individus[i] = arg
    for i, (typ, arg) in enumerate(programme):
        if typ == GARDER or typ == POSTER:
            c = e.individus[i]
            if typ == GARDER and arg != c:
                raise ValueError("Garder ailleurs que sa case")
            gardes[c] = gardes.get(c, 0) + 1
        elif typ == SABOTER:
            if e.machines[arg] != e.individus[i]:
                raise ValueError("Saboter une Machine absente")
            saboteurs[arg] = saboteurs.get(arg, 0) + 1
    sabotages = {}
    for j, nb in saboteurs.items():
        cap = nb // 2 if p.sabotage == "allie" else nb
        if cap:
            sabotages[j] = cap
    return gardes, sabotages


def garde_couvrante(p: Params, pl: Plateau, gardes, cible):
    """La garde qui pare une menace sur `cible` (P3.4) : celle de la case, sinon (garde_portee 1) une voisine."""
    if gardes.get(cible, 0) > 0:
        return cible
    if p.garde_portee:
        for c in pl.voisins[cible]:
            if gardes.get(c, 0) > 0:
                return c
    return None


def executer(p: Params, pl: Plateau, e: Etat, menaces, gardes, sabotages, stats=None):
    """P4 : les menaces s'exécutent une à une. Renvoie le nombre de parades.

    `menaces` : liste ordonnée de (machine, tactique). `gardes`, `sabotages` : capacités, consommées ici.
    """
    parades = 0
    for machine, tactique in menaces:
        cible, repli = destination(p, pl, e, machine, tactique)
        if stats is not None:
            stats["tactique_" + tactique] = stats.get("tactique_" + tactique, 0) + 1
            if repli:
                stats["replis"] = stats.get("replis", 0) + 1
        if sabotages.get(machine, 0) > 0:          # P4.5 sabotage d'abord
            sabotages[machine] -= 1
            parades += 1
            if stats is not None:
                stats["pare_sabotage"] = stats.get("pare_sabotage", 0) + 1
            if p.sabotage == "echappe":
                e.machines[machine] = cible
            continue
        g = garde_couvrante(p, pl, gardes, cible)
        if g is not None:                          # P4.6 la garde : la Machine n'entre pas
            gardes[g] -= 1
            parades += 1
            if stats is not None:
                stats["pare_garde"] = stats.get("pare_garde", 0) + 1
            continue
        e.machines[machine] = cible               # P4.7 elle entre et abat un arbre
        e.arbres[cible] -= 1
    return parades


def jouer_tour(p, pl, e, annonces, programme, execution, stats=None):
    """Un tour complet sur l'état `e` (modifié). `execution` : indices ordonnés des menaces exécutées
    parmi les annonces, ou liste explicite de menaces si `annonces` est vide."""
    gardes, sabotages = appliquer_programme(p, pl, e, programme)
    menaces = [annonces[j] for j in execution]
    parades = executer(p, pl, e, menaces, gardes, sabotages, stats)
    e.tour += 1
    return parades
