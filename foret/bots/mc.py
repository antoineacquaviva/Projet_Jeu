"""Bot Monte-Carlo (moteur 1.7, phase 2) : il choisit en jouant la suite de la partie.

Pour chaque décision à plusieurs options, il copie la partie (Partie.copie),
impose une option, joue la copie jusqu'au bout avec une *politique de jeu*
(par défaut le glouton, à tous les sièges) et un *autre hasard* (les dés à venir
sont tirés au sort : c'est la déterminisation), puis garde l'option qui laisse le
plus de forêt en moyenne. Il ne connaît aucune règle : il joue n'importe quelle
maquette ou variante sans être réécrit, ce que demande la recherche de variantes.

Répartition du budget : *sequential halving* (Karnin, Koren, Somekh 2013). Le
budget (nombre de suites jouées par décision) est partagé en tours ; à chaque
tour, les options encore en lice sont jouées sur les mêmes hasards (nombres
aléatoires communs, ce qui réduit le bruit des comparaisons), puis la moitié la
moins bonne est écartée. Le budget est le curseur de force : il donne l'échelle
des bots du plan (MC 8, 32, 128…).

Ce que le bot sait (paramètre « savoir ») :
- "tout" : la copie voit tout, dont les mains et les cartes programmées des
  partenaires. C'est le mode *central* du plan (un seul cerveau pour l'équipe) :
  la borne haute, et l'image du joueur dominant.
- les autres modes (chacun pour soi, communication partielle) demandent de
  tirer au sort ce que le joueur ignore ; ils viendront avec 2c.

Une politique de jeu meilleure que le glouton rendrait le bot plus fort ; le
bot est par construction au moins aussi bon que sa politique, à la variance des
suites près (amélioration de politique en un coup).

Le bot ne lit pas l'avenir : chaque suite tire de nouveaux dés. Le « devin »
(valeur de l'information) sera la variante qui joue les suites avec le vrai
hasard de la partie.
"""
import math
import random

from .base import Bot, BOTS, fabriquer
from ..moteur import _indice


@BOTS("mc")
class MonteCarlo(Bot):
    nom = "mc"
    reprises = True          # la partie prend une photo à chaque segment : copies plus rapides
    PARAMS = {
        "budget": 32,                     # suites jouées par décision (au plus)
        "politique": {"type": "glouton"},  # bot qui joue les suites, à tous les sièges
        "savoir": "tout",                 # "tout" = mode central (voir plus haut)
        "ignorer": [],                    # types de décision laissés à la politique (sans recherche)
        "max_options": 24,                # au-delà : le choix de la politique et des options tirées au sort
        "devin": False,                   # True : les suites gardent les vrais dés à venir (valeur de l'information)
        "reves_par_tour": None,           # None = libre ; un nombre = taux de rêve imposé (comme le glouton)
    }

    def __init__(self, graine=0, **params):
        super().__init__(graine, **params)
        if self.p["savoir"] != "tout":
            raise ValueError("savoir : seul « tout » (mode central) est codé pour l'instant")
        pol = dict(self.p["politique"])
        if self.p["reves_par_tour"] is not None and pol.get("type") == "glouton":
            pol["params"] = dict(pol.get("params", {}), reves_par_tour=self.p["reves_par_tour"])
        self._spec_politique = pol
        self._politique = fabriquer(pol, graine)
        self._quota = {}                  # (lignée, tour, siège) -> [rêves à faire, rêves faits]
        self.stats = {"recherches": 0, "suites": 0}

    # ------------------------------------------------------------------ décision
    def decider(self, partie, siege, type_, options, ctx):
        permis = list(range(len(options)))
        if type_ == "programmer_mode" and self.p["reves_par_tour"] is not None:
            permis = self._taux_impose(partie, siege, options, ctx["etape"])
        choix = options[self._chercher(partie, siege, type_, options, ctx, permis)]
        if type_ == "programmer_mode" and choix == "reve" and self.p["reves_par_tour"] is not None:
            self._quota[(partie.lignee, partie.tour, siege.idx)][1] += 1
        return choix

    def _taux_impose(self, partie, siege, options, etape):
        """Taux de rêve imposé : k rêves ce tour (k tiré comme le glouton), aux étapes que le bot choisit."""
        cle = (partie.lignee, partie.tour, siege.idx)
        if cle not in self._quota:
            r = self.p["reves_par_tour"]
            k = int(r) + (1 if self.rng.random() < r - int(r) else 0)
            garde = self._spec_politique.get("params", {}).get("garde", 2)
            k = max(0, min(k, len(siege.main) - garde))        # comme le glouton : garder des cartes
            self._quota = {cle: [k, 0]}
        k, faits = self._quota[cle]
        tous = list(range(len(options)))
        if "reve" not in options:
            return tous
        reve = options.index("reve")
        reste = k - faits
        etapes_restantes = sum(1 for e in partie.etapes if e >= etape)
        if reste <= 0:
            return [i for i in tous if i != reve] or tous
        if reste >= etapes_restantes:
            return [reve]
        return tous

    def _chercher(self, partie, siege, type_, options, ctx, permis):
        """Rend l'indice (dans options, la liste du moteur) de l'option retenue parmi permis."""
        if len(permis) == 1:
            return permis[0]
        if type_ in self.p["ignorer"] or len(permis) > self.p["max_options"]:
            prefere = self._prefere(partie, siege, type_, options, ctx, permis)
            if type_ in self.p["ignorer"]:
                return prefere
            autres = [i for i in permis if i != prefere]
            self.rng.shuffle(autres)
            permis = [prefere] + autres[:self.p["max_options"] - 1]
        return self._halving(partie, permis)

    def _prefere(self, partie, siege, type_, options, ctx, permis):
        """Le choix de la politique (sans effet sur les compteurs), s'il est permis ; sinon le premier permis."""
        with partie.muet():
            i = _indice(options, self._politique.decider(partie, siege, type_, options, ctx))
        return i if i in permis else permis[0]

    def _suite(self, partie, i, hasard):
        bots = [fabriquer(self._spec_politique, hasard + k) for k in range(len(partie.sieges))]
        c = partie.copie(bots=bots, hasard=None if self.p["devin"] else hasard, imposer=[i])
        b = c.jouer()
        self.stats["suites"] += 1
        return b["resultat"] / b["foret_initiale"]

    def _halving(self, partie, cands):
        """Sequential halving sur les indices d'options cands ; rend l'indice retenu."""
        self.stats["recherches"] += 1
        budget = max(self.p["budget"], len(cands))
        tours = max(1, math.ceil(math.log2(len(cands))))
        somme = {i: 0.0 for i in cands}
        n = {i: 0 for i in cands}
        restants = list(cands)
        for t in range(tours):
            par_option = max(1, budget // (len(restants) * tours))
            for _ in range(par_option):
                hasard = self.rng.randrange(1 << 30)       # même hasard pour toutes les options du tour
                for i in restants:
                    somme[i] += self._suite(partie, i, hasard)
                    n[i] += 1
            restants.sort(key=lambda i: -somme[i] / n[i])
            if len(restants) == 1:
                break
            restants = restants[:max(1, math.ceil(len(restants) / 2))]
        return restants[0]
