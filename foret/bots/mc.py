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
        "max_options": 24,                # au-delà, on ne garde que les options préférées de la politique… et des tirages
    }

    def __init__(self, graine=0, **params):
        super().__init__(graine, **params)
        if self.p["savoir"] != "tout":
            raise ValueError("savoir : seul « tout » (mode central) est codé pour l'instant")
        self._politique = fabriquer(self.p["politique"], graine)
        self.stats = {"recherches": 0, "suites": 0}

    # ------------------------------------------------------------------ décision
    def decider(self, partie, siege, type_, options, ctx):
        if len(options) == 1:
            return options[0]
        if type_ in self.p["ignorer"]:
            return self._politique.decider(partie, siege, type_, options, ctx)
        cands = list(range(len(options)))
        if len(cands) > self.p["max_options"]:
            cands = self._preselection(partie, siege, type_, options, ctx)
        return options[self._halving(partie, cands)]

    def _preselection(self, partie, siege, type_, options, ctx):
        """Trop d'options pour le budget : le choix de la politique, plus des options tirées au sort."""
        with partie.muet():
            prefere = _indice(options, self._politique.decider(partie, siege, type_, options, ctx)) or 0
        autres = [i for i in range(len(options)) if i != prefere]
        self.rng.shuffle(autres)
        return [prefere] + autres[:self.p["max_options"] - 1]

    def _suite(self, partie, i, hasard):
        bots = [fabriquer(self.p["politique"], hasard + k) for k in range(len(partie.sieges))]
        c = partie.copie(bots=bots, hasard=hasard, imposer=[i])
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
