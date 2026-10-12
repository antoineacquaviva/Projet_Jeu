"""Interface commune des bots.

Le moteur ne pose qu'une question : Partie.decider(siege, type, options, **ctx).
Il appelle bot.decider(partie, siege, type, options, ctx), qui doit rendre un
élément de options. Le catalogue des types est dans foret/decisions.py.

Écrire un bot :
- hériter de Bot ;
- écrire une méthode d_<type>(self, partie, siege, options, **ctx) pour chaque
  type de décision que le bot veut traiter ;
- les types non traités sont choisis au hasard (méthode defaut), ce qui permet
  d'ajouter une règle (donc un type de décision) sans casser les bots existants ;
- déclarer la classe dans le registre : @BOTS("nom").

Les paramètres d'un bot viennent de la campagne (JSON) : {"type": "glouton",
"params": {...}}. Bot.PARAMS déclare les paramètres admis et leurs valeurs par
défaut : un paramètre inconnu est une erreur (faute de frappe dans une campagne).

Lecture du jeu : un bot peut lire l'état de la partie (plateau, piste,
présence, Machines…), qui est public. Il ne doit pas lire les cartes
programmées par les autres joueurs pendant le conseil (partie.prog n'est rempli
qu'après la programmation de tous). Pour une lecture sans effet de bord sur les
compteurs, utiliser « with partie.muet(): ».

Copies (moteur 1.1) : un bot peut copier la partie pendant sa décision
(partie.copie(...), voir moteur.py) pour essayer des options. Un bot qui garde
un plan d'un appel à l'autre le rattache à partie.lignee (commun à une partie
et à ses copies) et désigne les cartes par carte.uid, pas par l'objet.
"""
import random

from ..registre import Registre
from ..erreurs import ErreurMoteur

BOTS = Registre("bot")


class Bot:
    PARAMS = {}

    def __init__(self, graine=0, **params):
        inconnus = set(params) - set(self.PARAMS)
        if inconnus:
            raise ErreurMoteur(f"bot {type(self).__name__} : paramètres inconnus {sorted(inconnus)}")
        self.p = {**self.PARAMS, **params}
        self.rng = random.Random(graine)
        self.graine = graine

    def decider(self, partie, siege, type_, options, ctx):
        f = getattr(self, "d_" + type_, None)
        if f is None:
            return self.defaut(partie, siege, type_, options, ctx)
        choix = f(partie, siege, options, **ctx)
        if choix is None and None not in options:
            # « ne rien faire » n'est pas permis ici (trace qui engage, R2.5) :
            # première option, sans tirage, pour ne pas changer le hasard du bot.
            return options[0]
        return choix

    def defaut(self, partie, siege, type_, options, ctx):
        return self.rng.choice(options)

    def decrire(self):
        return {"type": type(self).nom, "params": dict(self.p)}


def fabriquer_table(spec, n, graine=0):
    """Les bots d'une table de n sièges : le siège i reçoit la graine graine + i.
    spec ordinaire : le même bot à tous les sièges ; {"type": "table", "params": {"sieges": [spec, …]}} :
    une table mixte (phase 2), le siège i joue sieges[i % len(sieges)]."""
    if isinstance(spec, dict) and spec.get("type") == "table":
        sieges = spec["params"]["sieges"]
        return [fabriquer(sieges[i % len(sieges)], graine + i) for i in range(n)]
    return [fabriquer(spec, graine + i) for i in range(n)]


def fabriquer(spec, graine=0):
    """spec : {"type": nom, "params": {...}} ou (nom, params)."""
    if isinstance(spec, (list, tuple)):
        nom, params = spec
    else:
        nom, params = spec["type"], spec.get("params", {})
    if nom not in BOTS:
        raise ErreurMoteur(f"bot inconnu : {nom} (connus : {sorted(BOTS)})")
    return BOTS[nom](graine, **(params or {}))
