"""Critères des tactiques (R4.2).

Un critère reçoit la partie, les zones éligibles et ses paramètres (section
« criteres » de la maquette) ; il rend la liste des zones candidates, que le
moteur départage (R7.1). Il rend None quand il ne désigne rien.
"""
from .registre import Registre

CRITERES = Registre("critère")


@CRITERES("plus_boisee")
def plus_boisee(partie, zones, params):
    f = partie.plateau.foret
    m = max(f[z] for z in zones)
    return [z for z in zones if f[z] == m]


@CRITERES("moins_defendue")
def moins_defendue(partie, zones, params):
    m = min(partie.defense(z) for z in zones)
    return [z for z in zones if partie.defense(z) == m]


@CRITERES("plus_defendue")
def plus_defendue(partie, zones, params):
    """[v2:A3] Représailles dans la v2 : la zone la plus défendue (présences visibles)."""
    m = max(partie.defense(z) for z in zones)
    return [z for z in zones if partie.defense(z) == m]


@CRITERES("derniere_attaque")
def derniere_attaque(partie, zones, params):
    """Paramètres : repli (nom d'un autre critère, utilisé s'il n'y a pas
    encore eu d'attaque, avec repli_params) ; fenetre (null = sans limite,
    "tour" = ce tour seulement)."""
    att = partie.derniere_attaque
    if att is not None and params.get("fenetre") == "tour" and att[1] != partie.tour:
        att = None
    if att is None:
        partie.lacune("represailles_sans_attaque")
        repli = params.get("repli")
        if not repli:
            return None
        return CRITERES[repli](partie, zones, params.get("repli_params", {}))
    if att[1] != partie.tour:
        partie.lacune("represailles_ancienne")
    return [att[0]]


@CRITERES("devant_la_plus_avancee")
def devant_la_plus_avancee(partie, zones, params):
    m = partie.machine_la_plus_avancee()
    if m is None:
        return None
    P = partie.plateau
    devant = [n for n in P.adj[m.zone] if P.prof[n] == P.prof[m.zone] + 1 and n in zones]
    if not devant:
        partie.lacune("percee_au_bout")
        return [m.zone]
    return devant
