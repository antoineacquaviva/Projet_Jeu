"""Le plateau : zones, forêts, liaisons, rivières, distances."""
from collections import deque

from .erreurs import ErreurMaquette


def bfs(depart, graphe):
    d = {depart: 0}
    file = deque([depart])
    while file:
        z = file.popleft()
        for n in sorted(graphe[z]):
            if n not in d:
                d[n] = d[z] + 1
                file.append(n)
    return d


class Plateau:
    def __init__(self, spec):
        Z = spec["zones"]
        if not Z:
            raise ErreurMaquette("plateau sans zone")
        self.zones = list(Z)                       # l'ordre donne le numéro
        self.numero = {z: i + 1 for i, z in enumerate(self.zones)}
        self.foret0 = {z: int(v["foret"]) for z, v in Z.items()}
        self.foret = dict(self.foret0)
        self.prof = {z: int(v["profondeur"]) for z, v in Z.items()}
        self.adj = {z: set() for z in self.zones}
        for a, b in spec["adjacences"]:
            self._lier(self.adj, a, b, "liaison")
        self.riv = {z: set() for z in self.zones}
        for a, b in spec.get("rivieres", []):
            self._lier(self.riv, a, b, "rivière")
        self.dist = {z: bfs(z, self.adj) for z in self.zones}
        if any(len(d) != len(self.zones) for d in self.dist.values()):
            raise ErreurMaquette("plateau non connexe")
        self.fleches = dict(spec.get("fleches", {}))   # [v2:E1] [v2:A3] flèches de percée
        self.lisiere = [z for z in self.zones if self.prof[z] == 0]
        if not self.lisiere:
            raise ErreurMaquette("aucune zone de lisière (profondeur 0)")

    def _lier(self, graphe, a, b, quoi):
        if a not in graphe or b not in graphe or a == b:
            raise ErreurMaquette(f"{quoi} invalide : {a}-{b}")
        graphe[a].add(b)
        graphe[b].add(a)

    def tries(self, zs):
        return sorted(zs, key=self.numero.get)

    def par_riviere(self, z):
        """Zones atteignables en suivant les rivières depuis z (z exclue)."""
        return set(bfs(z, self.riv)) - {z}

    @property
    def total(self):
        return sum(self.foret.values())

    @property
    def total0(self):
        return sum(self.foret0.values())
