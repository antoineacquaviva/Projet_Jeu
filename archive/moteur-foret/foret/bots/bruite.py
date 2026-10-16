"""Bot bruité (phase 2) : un autre bot qui, parfois, choisit au hasard.

Sert aux styles du panel (Nadia, la novice : « bruit élevé ») et aux tables
mixtes : le coût d'un joueur faible pour l'équipe. Avec la probabilité « bruit »,
une décision non forcée est prise au hasard parmi les options légales ; sinon, le
bot de base décide. Le tirage du bruit a son propre hasard : le bot de base garde
exactement le sien.

    {"type": "bruite", "params": {"base": {"type": "glouton"}, "bruit": 0.3}}
"""
import random

from .base import Bot, BOTS, fabriquer


@BOTS("bruite")
class Bruite(Bot):
    nom = "bruite"
    PARAMS = {"base": {"type": "glouton"}, "bruit": 0.3}

    def __init__(self, graine=0, **params):
        super().__init__(graine, **params)
        self._base = fabriquer(self.p["base"], graine)
        self._bruit = random.Random(graine * 7919 + 17)
        self.reprises = getattr(self._base, "reprises", False)

    def decider(self, partie, siege, type_, options, ctx):
        if len(options) > 1 and self._bruit.random() < self.p["bruit"]:
            return self._bruit.choice(options)
        return self._base.decider(partie, siege, type_, options, ctx)
