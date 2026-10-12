"""Outils des tests : un bot piloté par script et des raccourcis de mise en place."""
from collections import Counter

from foret import charger, Partie, Bot
from foret.moteur import Jeu, Carte, EtatEtape


class Scripte(Bot):
    """Bot de test : regles = {type de décision: valeur ou fonction(partie, siege,
    options, ctx)} ; sans règle, il prend la première option. Il garde la trace
    des décisions qu'on lui a demandées."""
    nom = "scripte"

    def __init__(self, regles=None, graine=0):
        super().__init__(graine)
        self.regles = regles or {}
        self.vus = []

    def decider(self, partie, siege, type_, options, ctx):
        self.vus.append((type_, list(options), dict(ctx)))
        r = self.regles.get(type_)
        if r is None:
            return options[0]
        return r(partie, siege, options, ctx) if callable(r) else r


def partie(peuples=("oiseaux", "insectes"), maquette="v1", variante=None, regles=None, graine=1, **kw):
    """Partie avec des bots scriptés (mêmes règles pour tous, sauf dict par peuple)."""
    m = charger(maquette, variante)
    bots = []
    for p in peuples:
        r = regles.get(p, regles) if isinstance(regles, dict) and p in regles else regles
        bots.append(Scripte(r))
    return Partie(m, list(peuples), bots, graine=graine, **kw)


def presence(p, **zones):
    """presence(p, oiseaux={"Z1": 2, "Z4": 1}) : remplace la présence d'un peuple."""
    for peuple, d in zones.items():
        p.presence[peuple] = Counter(d)


def jeu(p, peuple, mode, zone=None, action=None, etape=1, cible=None):
    s = p.par_peuple[peuple]
    j = Jeu(s.idx, Carte(f"t{len(p.ee.actifs)}", peuple), mode, etape)
    j.pouvoir = p.pouvoir_moitie.get((peuple, mode))
    j.regle = p.M["peuples"][peuple][mode].get("pouvoir")
    j.zone, j.action, j.cible = zone, action, cible
    return j


def tuile(p, nom):
    for t in p.piste.values():
        if t.nom == nom:
            return t
    return p._tuile(nom)


def machine(p, nom):
    return next(m for m in p.machines if m.nom == nom)


def ordre(p, nom, cible=None, machine_=None):
    """Prépare l'ordre d'une tactique comme le ferait le tirage des dés."""
    t = tuile(p, nom)
    info = {"tuile": t, "case": next((c for c, x in p.piste.items() if x is t), 0), "cible": cible, "machine": machine_}
    if t.genre == "tactique":
        if cible is None:
            info["cible"] = p.cible(t)
        if machine_ is None:
            info["machine"] = p.machine_pour(info["cible"])
    return info


def nouvelle_etape(p):
    p.ee = EtatEtape()
