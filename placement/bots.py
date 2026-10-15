"""Les joueurs virtuels du modèle « placement ».

Gentil (de la plus faible à la plus forte) :
- `aleatoire`   : ordres légaux au hasard (plancher) ;
- `sentinelle`  : boucle ouverte, les mêmes individus gardent leur case à chaque tour, sans jamais bouger ;
- `marquage`    : boucle ouverte, chaque individu suit « sa » Machine et la sabote quand il la rejoint ;
- `regroupement`: boucle ouverte, tous se rejoignent au cœur et y gardent ;
- `reflexe`     : lit l'annonce sur la configuration du moment et garde là où ça va frapper (règle simple) ;
- `glouton`     : maximise les parades attendues *de ce tour* (simulation des tirages), puis se rapproche ;
- `mc`          : Monte-Carlo à un coup : chaque programme candidat est joué jusqu'à H tours plus loin ;
- témoins : `oracle` (sait quelles menaces partiront), et tout bot en mode `aveugle` (ignore l'annonce).

Méchant :
- `hasard`      : le vrai jeu, n menaces au hasard parmi les m annoncées ;
- `adverse`     : force réglable beta, évite les menaces exposées aux individus (sans voir le programme) ;
- `omniscient`  : voit le programme et choisit les menaces les moins parées (borne).
"""
from __future__ import annotations

import math
import random
from itertools import permutations

from .regles import (RIEN, GARDER, ALLER, SABOTER, POSTER, destination, ordres_possibles,
                     jouer_tour, nb_ordres, tirer_annonces, tirer_execution,
                     permis, reparer, cases_depart)


# --------------------------------------------------------------------------- outils communs

def menaces_ponderees(p, pl, e, annonces):
    """Ce que le Gentil sait des menaces du tour : liste de (machine, tactique, probabilité d'exécution)."""
    if annonces:
        q = p.n / len(annonces)
        return [(m, t, q) for m, t in annonces]
    total = sum(w for _, w in p.tactiques)
    return [(m, t, p.n * w / total / p.machines) for m in range(p.machines) for t, w in p.tactiques if w > 0]


def tirages(p, annonces, rng, nb):
    """`nb` exécutions possibles (indices ordonnés) ; sans annonce, des menaces tirées dans le jeu du Méchant."""
    if annonces:
        return [tuple(rng.sample(range(len(annonces)), p.n)) for _ in range(nb)]
    noms = [t for t, w in p.tactiques if w > 0]
    poids = [w for t, w in p.tactiques if w > 0]
    return [tuple((rng.randrange(p.machines), rng.choices(noms, poids)[0]) for _ in range(p.n)) for _ in range(nb)]


def valeur(p, pl, e, annonces, programme, echantillons):
    """Parades attendues du programme sur les exécutions échantillonnées (nombres aléatoires communs)."""
    tot = 0
    for ex in echantillons:
        f = e.copie()
        if annonces:
            tot += jouer_tour(p, pl, f, annonces, programme, ex)
        else:
            tot += jouer_tour(p, pl, f, list(ex), programme, range(p.n))
    return tot / len(echantillons)


def placement_heuristique(p, pl, e, rng):
    """Placement initial commun (P1.4) : devant les Machines, sur des cases boisées, sans s'empiler."""
    pris = []
    for i in range(p.individus):
        def score(c):
            s = sum(max(0, 3 - pl.dist[m][c]) for m in e.machines)
            return s + 0.05 * e.arbres[c] - 3 * pris.count(c) - 0.01 * pl.coeur[c]
        meilleur = max(cases_depart(p, pl, i), key=lambda c: (score(c), -c))
        pris.append(meilleur)
    return pris


def pas_vers(p, pl, depuis, cible):
    """La case à portée qui rapproche le plus de `cible`."""
    return min(pl.a_portee(depuis, p.portee), key=lambda c: (pl.dist[c][cible], c))


def attraction(p, pl, e):
    """Où il faudra être au prochain tour : cases boisées au contact des Machines."""
    a = [0.0] * pl.N
    for m in e.machines:
        for c in (m,) + pl.voisins[m]:
            if e.arbres[c] > 0:
                a[c] += 1.0
    return a


def deplacements_libres(p, pl, e, prog, rng=None):
    """Complète le programme : les individus sans ordre (dans la limite de k) vont vers l'attraction
    la plus forte qui n'est pas déjà tenue."""
    restant = p.k - nb_ordres(prog)
    if restant <= 0:
        return prog
    a = attraction(p, pl, e)
    tenues = set(e.individus[i] for i, o in enumerate(prog) if o[0] != ALLER)
    tenues |= set(o[1] for o in prog if o[0] in (ALLER, POSTER))
    candidats = []
    for i, o in enumerate(prog):
        if o[0] != RIEN:
            continue
        pos = e.individus[i]
        if a[pos] > 0 and pos not in tenues:
            continue  # déjà bien placé
        cibles = [c for c in range(pl.N) if a[c] > 0 and c not in tenues]
        if not cibles:
            continue
        cible = min(cibles, key=lambda c: (pl.dist[pos][c] - 0.3 * a[c], c))
        pas = pas_vers(p, pl, pos, cible)
        if pas != pos:
            candidats.append((pl.dist[pos][cible], i, pas))
    candidats.sort()
    for _, i, pas in candidats:
        if restant <= 0:
            break
        essai = prog[:]
        essai[i] = (ALLER, pas)
        if not permis(p, essai):
            continue
        prog = essai
        restant -= 1
        tenues.add(pas)
    return prog


# --------------------------------------------------------------------------- bots du Gentil

class Gentil:
    nom = "?"
    oracle = False

    def __init__(self, aveugle=False, **kw):
        self.aveugle = aveugle
        self.kw = kw
        self.compteurs = {}

    def debut(self):
        self.compteurs = {}

    def compter(self, cle, v=1):
        self.compteurs[cle] = self.compteurs.get(cle, 0) + v

    def placer(self, p, pl, e, rng):
        return placement_heuristique(p, pl, e, rng)

    def jouer(self, p, pl, e, annonces, rng, verite=None):
        return reparer(p, self.programme(p, pl, e, None if self.aveugle else annonces, rng, verite))

    def programme(self, p, pl, e, annonces, rng, verite=None):
        raise NotImplementedError


class Aleatoire(Gentil):
    nom = "aleatoire"

    def placer(self, p, pl, e, rng):
        return [rng.choice(list(cases_depart(p, pl, i))) for i in range(p.individus)]

    def programme(self, p, pl, e, annonces, rng, verite=None):
        prog = [(RIEN, None)] * p.individus
        for i in rng.sample(range(p.individus), p.k):
            ops = [o for o in ordres_possibles(p, pl, e, i) if o[0] != RIEN]
            prog[i] = rng.choice(ops)
        return prog


class Sentinelle(Gentil):
    """Boucle ouverte : les k premiers individus gardent leur case, toujours."""
    nom = "sentinelle"

    def programme(self, p, pl, e, annonces, rng, verite=None):
        prog = [(RIEN, None)] * p.individus
        for i in range(p.individus):              # les premiers individus de chaque joueur d'abord (P3.4 bis)
            essai = prog[:]
            essai[i] = (GARDER, e.individus[i])
            if permis(p, essai):
                prog = essai
        return prog


class Marquage(Gentil):
    """Boucle ouverte (convention de table) : l'individu i suit la Machine i mod M et la sabote quand il la rejoint."""
    nom = "marquage"

    def programme(self, p, pl, e, annonces, rng, verite=None):
        prog = [(RIEN, None)] * p.individus
        voeux = []
        for i in range(p.individus):
            j = i % p.machines
            pos, mpos = e.individus[i], e.machines[j]
            if pos == mpos and p.sabotage != "aucun":
                voeux.append((0, i, (SABOTER, j)))
            elif pos == mpos:
                voeux.append((1, i, (GARDER, pos)))
            else:
                voeux.append((2 + pl.dist[pos][mpos], i, (ALLER, pas_vers(p, pl, pos, mpos))))
        voeux.sort()
        for _, i, o in voeux:
            essai = prog[:]
            essai[i] = o
            if permis(p, essai):
                prog = essai
        return prog


class Regroupement(Gentil):
    """Boucle ouverte : tous les individus se rejoignent au cœur de la forêt et y gardent."""
    nom = "regroupement"

    def placer(self, p, pl, e, rng):
        self.point = min(range(pl.N), key=lambda c: (pl.coeur[c], -e.arbres[c], c))
        return placement_heuristique(p, pl, e, rng)

    def programme(self, p, pl, e, annonces, rng, verite=None):
        prog = [(RIEN, None)] * p.individus
        n = 0
        for i, pos in enumerate(e.individus):
            if pos == self.point and n < p.k and permis(p, prog[:i] + [(GARDER, pos)] + prog[i + 1:]):
                prog[i] = (GARDER, pos)
                n += 1
        for i, pos in enumerate(e.individus):
            o = (ALLER, pas_vers(p, pl, pos, self.point))
            if pos != self.point and n < p.k and permis(p, prog[:i] + [o] + prog[i + 1:]):
                prog[i] = o
                n += 1
        return prog


class Reflexe(Gentil):
    """Lit l'annonce sur la configuration du moment : garde où ça frappe, sabote la Machine annoncée,
    sinon se rapproche. Règle simple, sans simulation."""
    nom = "reflexe"

    def programme(self, p, pl, e, annonces, rng, verite=None):
        pond = menaces_ponderees(p, pl, e, annonces)
        w = {}
        wm = {}
        for m, t, q in pond:
            c, _ = destination(p, pl, e, m, t)
            w[c] = w.get(c, 0) + q
            wm[m] = wm.get(m, 0) + q
        cand = []
        for i, pos in enumerate(e.individus):
            if w.get(pos, 0) > 0:
                cand.append((min(w[pos], 1.0), i, (GARDER, pos)))
            if p.sabotage not in ("aucun", "allie"):
                for j, mpos in enumerate(e.machines):
                    if mpos == pos and wm.get(j, 0) > 0:
                        cand.append((min(wm[j], 1.0) + 0.01, i, (SABOTER, j)))
        cand.sort(key=lambda x: (-x[0], x[1]))
        prog = [(RIEN, None)] * p.individus
        couvert = {}
        n = 0
        for v, i, o in cand:
            if n >= p.k or prog[i][0] != RIEN:
                continue
            limite = math.ceil((w.get(o[1], 0) if o[0] == GARDER else wm.get(o[1], 0)) - 1e-9)
            if couvert.get(o, 0) >= max(1, limite):
                continue
            couvert[o] = couvert.get(o, 0) + 1
            prog[i] = o
            n += 1
        # aller vers les cases menacées non tenues (à portée), sinon vers l'attraction
        if n < p.k and w:
            libres = [i for i in range(p.individus) if prog[i][0] == RIEN]
            visees = sorted((c for c in w if c not in set(e.individus)), key=lambda c: -w[c])
            for c in visees:
                if n >= p.k or not libres:
                    break
                i = min(libres, key=lambda i: pl.dist[e.individus[i]][c])
                if pl.dist[e.individus[i]][c] <= p.portee:
                    prog[i] = (POSTER, c) if p.aller_garder else (ALLER, c)
                    libres.remove(i)
                    n += 1
        return deplacements_libres(p, pl, e, reparer(p, prog))


class Glouton(Gentil):
    """Maximise les parades attendues du tour (S tirages communs), ordre par ordre, puis complète par des
    déplacements vers les Machines. Il ne voit pas plus loin que le tour."""
    nom = "glouton"

    def __init__(self, echantillons=16, deplacer=True, interdits=(), **kw):
        super().__init__(**kw)
        self.S = echantillons
        self.deplacer = deplacer
        self.interdits = set(interdits)

    def options(self, p, pl, e, i):
        return [o for o in ordres_possibles(p, pl, e, i) if o[0] not in self.interdits]

    def meilleur_immediat(self, p, pl, e, annonces, ech):
        prog = [(RIEN, None)] * p.individus
        base = 0.0
        opts = [self.options(p, pl, e, i) for i in range(p.individus)]
        for _ in range(p.k):
            best = (1e-9, None, None)
            for i in range(p.individus):
                if prog[i][0] != RIEN:
                    continue
                for o in opts[i]:
                    if o[0] in (RIEN, ALLER):
                        continue  # Aller ne pare rien ce tour-ci (sauf effet de présence, vu plus bas)
                    essai = prog[:]
                    essai[i] = o
                    if not permis(p, essai):
                        continue
                    v = valeur(p, pl, e, annonces, essai, ech)
                    if v - base > best[0]:
                        best = (v - base, i, o)
            if best[1] is None:
                break
            prog[best[1]] = best[2]
            base += best[0]
        # une passe d'amélioration (y compris Aller, pour les effets de présence sur opportunisme et représailles ;
        # inutile si aucune menace possible ne lit la présence)
        presence_lue = any(t in ("opportunisme", "represailles") for _, t, _ in menaces_ponderees(p, pl, e, annonces))
        for i in range(p.individus):
            for o in opts[i]:
                if o == prog[i] or (o[0] == ALLER and not presence_lue):
                    continue
                essai = prog[:]
                essai[i] = o
                if not permis(p, essai):
                    continue
                v = valeur(p, pl, e, annonces, essai, ech)
                if v > base + 1e-9:
                    prog, base = essai, v
        return prog, base

    def programme(self, p, pl, e, annonces, rng, verite=None):
        if verite is not None:
            ech = [verite]
        else:
            ech = tirages(p, annonces, rng, self.S)
        prog, _ = self.meilleur_immediat(p, pl, e, annonces, ech)
        if self.deplacer and ALLER not in self.interdits:
            prog = deplacements_libres(p, pl, e, prog)
        return prog


class Oracle(Glouton):
    """Témoin : sait quelles menaces partiront, et dans quel ordre (borne de la valeur de l'information)."""
    nom = "oracle"
    oracle = True


class MC(Glouton):
    """Monte-Carlo à un coup. Candidats : le programme glouton, le réflexe, et des variantes qui échangent
    une parade contre un déplacement (investissement) ou déplacent autrement. Chaque candidat est joué R fois :
    le tour en cours, puis H tours de plus avec le réflexe (Gentil) et le Méchant au hasard. On garde le meilleur."""
    nom = "mc"

    def __init__(self, budget=128, horizon=3, candidats=12, **kw):
        super().__init__(**kw)
        self.budget = budget
        self.H = horizon
        self.C = candidats
        self.suite = Reflexe()

    def candidats(self, p, pl, e, annonces, ech, rng):
        base, v0 = self.meilleur_immediat(p, pl, e, annonces, ech)
        cands = []

        def ajoute(prog):
            if permis(p, prog) and prog not in cands:
                cands.append(prog)

        ajoute(deplacements_libres(p, pl, e, base[:]) if ALLER not in self.interdits else base[:])
        ajoute(base[:])
        ajoute(self.suite.programme(p, pl, e, annonces, rng))
        # variantes : remplacer un ordre par un déplacement, ou donner un déplacement à un individu sans ordre
        variantes = []
        for i in range(p.individus):
            for o in self.options(p, pl, e, i):
                if o == base[i]:
                    continue
                essai = base[:]
                essai[i] = o
                if not permis(p, essai):
                    # libérer l'ordre le moins utile d'un autre individu
                    for j in range(p.individus):
                        if j != i and essai[j][0] != RIEN:
                            e2 = essai[:]
                            e2[j] = (RIEN, None)
                            variantes.append(e2)
                    continue
                variantes.append(essai)
        rng.shuffle(variantes)
        for v in variantes:
            if len(cands) >= self.C:
                break
            ajoute(v)
        return cands, v0

    def programme(self, p, pl, e, annonces, rng, verite=None):
        ech = tirages(p, annonces, rng, self.S)
        cands, v0 = self.candidats(p, pl, e, annonces, ech, rng)
        R = max(1, self.budget // len(cands))
        graines = [rng.randrange(1 << 30) for _ in range(R)]
        execs = tirages(p, annonces, rng, R)
        meilleur, vmax = cands[0], -1.0
        notes = []
        for prog in cands:
            tot = 0.0
            for r in range(R):
                f = e.copie()
                if annonces:
                    tot += jouer_tour(p, pl, f, annonces, prog, execs[r])
                else:
                    tot += jouer_tour(p, pl, f, list(execs[r]), prog, range(p.n))
                tot += self.suite_jouee(p, pl, f, random.Random(graines[r]))
            notes.append(tot / R)
            if tot / R > vmax + 1e-9:
                meilleur, vmax = prog, tot / R
        # mesure : sacrifie-t-on de la parade immédiate pour se placer ?
        vi = valeur(p, pl, e, annonces, meilleur, ech)
        self.compter("decisions")
        if v0 - vi > 0.05:
            self.compter("investissements")
            self.compter("parade_sacrifiee", v0 - vi)
        self.compter("ecart_candidats", max(notes) - min(notes))
        return meilleur

    def suite_jouee(self, p, pl, f, rr):
        tot = 0
        for _ in range(min(self.H, p.tours - f.tour)):
            ann = tirer_annonces(p, rr)
            ex = tirer_execution(p, rr)
            prog = self.suite.programme(p, pl, f, ann if p.annonces else None, rr)
            tot += jouer_tour(p, pl, f, ann, prog, ex)
        return tot


# --------------------------------------------------------------------------- bots du Méchant

class Mechant:
    nom = "hasard"

    def choisir(self, p, pl, e, annonces, programme, tirage, rng):
        return tirage


class Adverse(Mechant):
    """Force réglable : poids exp(-beta x exposition) ; exposition = un individu sur la case visée ou sur la
    Machine (1), à portée de la case visée (0,5), sinon 0. Il ne voit pas le programme."""
    nom = "adverse"

    def __init__(self, beta=2.0):
        self.beta = beta

    def choisir(self, p, pl, e, annonces, programme, tirage, rng):
        if not p.annonces or self.beta == 0:
            return tirage
        expo = []
        indiv = e.individus
        for m, t in annonces:
            c, _ = destination(p, pl, e, m, t)
            if c in indiv or e.machines[m] in indiv:
                x = 1.0
            elif any(pl.dist[i][c] <= max(1, p.portee) for i in indiv):
                x = 0.5
            else:
                x = 0.0
            expo.append(x)
        restant = list(range(len(annonces)))
        choix = []
        for _ in range(p.n):
            poids = [math.exp(-self.beta * expo[j]) for j in restant]
            j = rng.choices(restant, poids)[0]
            restant.remove(j)
            choix.append(j)
        return choix


class Omniscient(Mechant):
    """Borne : voit le programme et choisit les n menaces (et leur ordre) qui laissent le moins de parades."""
    nom = "omniscient"

    def choisir(self, p, pl, e, annonces, programme, tirage, rng):
        if not p.annonces:
            return tirage
        best, vbest = None, 1e9
        for ex in permutations(range(len(annonces)), p.n):
            f = e.copie()
            v = jouer_tour(p, pl, f, annonces, programme, ex)
            if v < vbest:
                best, vbest = ex, v
                if v == 0:
                    break
        return list(best)


# --------------------------------------------------------------------------- registre

def fabriquer_gentil(spec):
    """spec : nom ou dict {"type": ..., "params": {...}}."""
    if isinstance(spec, str):
        spec = {"type": spec}
    t = spec["type"]
    kw = dict(spec.get("params", {}))
    classes = {"aleatoire": Aleatoire, "sentinelle": Sentinelle, "marquage": Marquage,
               "regroupement": Regroupement, "reflexe": Reflexe,
               "glouton": Glouton, "oracle": Oracle, "mc": MC}
    return classes[t](**kw)


def fabriquer_mechant(spec):
    if isinstance(spec, str):
        spec = {"type": spec}
    t = spec["type"]
    kw = dict(spec.get("params", {}))
    return {"hasard": Mechant, "adverse": Adverse, "omniscient": Omniscient}[t](**kw)
