"""Bot inerte (moteur 1.4, phase 1d) : il ne joue rien.

Il laisse toutes ses étapes vides, ne rêve pas, ne pose ni trace ni jeton,
n'utilise aucun pouvoir. Il pose sa présence là où on le lui demande (première
option) parce que la mise en place l'impose.

Ce n'est pas un joueur : c'est une référence de mesure.
- [mesure:shapley] la valeur de « personne ne défend » v(∅) : une table d'un
  seul peuple joué par le bot inerte ;
- [mesure:spectateur] le siège qui ne fait rien.
"""
from .base import Bot, BOTS


@BOTS("inerte")
class Inerte(Bot):
    nom = "inerte"
    PARAMS = {}

    def defaut(self, partie, siege, type_, options, ctx):
        if None in options:
            return None
        if False in options:
            return False
        return options[0]
