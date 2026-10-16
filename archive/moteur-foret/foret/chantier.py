"""Ordres de chantier (R4.5). Chaque ordre rend True s'il a eu un effet."""
from .registre import Registre

CHANTIER = Registre("ordre de chantier")
ORDRE_REPARATION = ("moteur", "chenilles", "phares")


@CHANTIER("reparer")
def reparer(partie, params):
    reparer_hs = params.get("hs", True)
    cands = [m for m in partie.machines
             if m.etat == "plateau" and any(m.organes.values()) and (reparer_hs or not m.hs)]
    if not cands:
        partie.stat("reparer_sans_cible")
        return False
    m = min(cands, key=lambda x: (-sum(x.organes.values()), x.numero))
    etait_hs = m.hs
    o = next(o for o in ORDRE_REPARATION if m.organes.get(o))
    m.organes[o] = False
    if o == "phares":
        m.egaree = False
    if etait_hs:
        partie.lacune("reparer_relance_hs", m.nom)
    partie.stat("reparations")
    partie.log(f"  Réparer : {o} de {m.nom}")
    return True


@CHANTIER("renfort")
def renfort(partie, params):
    reserve = [m for m in partie.machines if m.etat == "reserve"]
    if not reserve:
        partie.stat("renfort_sans_reserve")
        return False
    m = reserve[0]
    m.etat, m.zone = "plateau", m.entree or partie.departager(partie.plateau.lisiere, compter=False)
    partie.stat("renforts")
    partie.log(f"  Renfort : {m.nom} entre en {m.zone}")
    return True
