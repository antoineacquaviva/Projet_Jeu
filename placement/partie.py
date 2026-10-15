"""Jouer une partie du modèle « placement » et en tirer les statistiques.

Graines : le hasard du jeu (mise en place, annonces, tirage des menaces exécutées) a son propre générateur,
indépendant des décisions des bots. Deux bots joués sur la même graine affrontent donc les mêmes annonces et
les mêmes tirages : les comparaisons sont appariées (sauf contre un Méchant qui choisit, par construction).

Usage : python -m placement.partie [--bot glouton] [--graine 1] [--param n=4 ...]
"""
from __future__ import annotations

import argparse
import json
import random

from .regles import Params, Plateau, mise_en_place, tirer_annonces, tirer_execution, jouer_tour, RIEN
from .bots import fabriquer_gentil, fabriquer_mechant

_PLATEAUX = {}


def plateau(p: Params):
    cle = (p.largeur, p.hauteur, p.voisinage)
    if cle not in _PLATEAUX:
        _PLATEAUX[cle] = Plateau(p)
    return _PLATEAUX[cle]


def jouer_partie(p: Params, gentil, mechant, graine: int, journal=None):
    """Joue une partie. `gentil`, `mechant` : objets bots (ou specs). Renvoie un dict de statistiques."""
    if not hasattr(gentil, "jouer"):
        gentil = fabriquer_gentil(gentil)
    if not hasattr(mechant, "choisir"):
        mechant = fabriquer_mechant(mechant)
    pl = plateau(p)
    rng_jeu = random.Random(graine)
    rng_bot = random.Random(graine * 7919 + 17)
    rng_mechant = random.Random(graine * 104729 + 3)
    gentil.debut()
    e = mise_en_place(p, pl, rng_jeu)
    e.individus = list(gentil.placer(p, pl, e, rng_bot))
    c0 = e.foret()
    stats = {"pertes": [], "ordres": {}}
    S = 0
    for t in range(p.tours):
        annonces = tirer_annonces(p, rng_jeu)
        tirage = tirer_execution(p, rng_jeu)
        verite = None
        if gentil.oracle:
            verite = tuple(tirage) if p.annonces else tuple(annonces[j] for j in tirage)
        prog = gentil.jouer(p, pl, e, annonces if p.annonces else None, rng_bot, verite)
        for typ, _ in prog:
            if typ != RIEN:
                stats["ordres"][typ] = stats["ordres"].get(typ, 0) + 1
        execution = mechant.choisir(p, pl, e, annonces, prog, tirage, rng_mechant)
        avant = e.foret()
        parades = jouer_tour(p, pl, e, annonces, prog, execution, stats)
        perte = avant - e.foret()
        # P5.1 : chaque menace non parée abat exactement un arbre ; au plus k parades
        assert perte == p.n - parades, (perte, parades)
        assert p.n - p.k <= perte <= p.n, perte
        S += parades
        stats["pertes"].append(perte)
        if journal is not None:
            journal.append({"tour": t + 1, "machines": e.machines[:], "individus": e.individus[:],
                            "annonces": annonces if p.annonces else None,
                            "executees": [annonces[j] for j in execution], "programme": prog,
                            "parades": parades, "arbres": e.arbres[:]})
    r = e.foret()
    assert r > 0  # P5.2
    stats.update({"c0": c0, "r": r, "parades": S, "taux": S / (p.k * p.tours), "foret": r / c0,
                  "compteurs": dict(gentil.compteurs)})
    return stats


def main(argv=None):
    ap = argparse.ArgumentParser(description="Une partie commentée du modèle placement")
    ap.add_argument("--bot", default="glouton")
    ap.add_argument("--mechant", default="hasard")
    ap.add_argument("--graine", type=int, default=1)
    ap.add_argument("--param", action="append", default=[], help="nom=valeur (JSON), par ex. n=4")
    a = ap.parse_args(argv)
    kw = {}
    for s in a.param:
        k, v = s.split("=", 1)
        try:
            kw[k] = json.loads(v)
        except json.JSONDecodeError:
            kw[k] = v
    p = Params().avec(**kw).valider()
    pl = plateau(p)
    j = []
    st = jouer_partie(p, a.bot, a.mechant, a.graine, journal=j)

    def dessin(arbres, machines, individus):
        lignes = []
        for y in range(p.hauteur):
            cases = []
            for x in range(p.largeur):
                c = y * p.largeur + x
                s = str(arbres[c])
                s += "M" * machines.count(c) + "g" * individus.count(c)
                cases.append(s.ljust(4))
            lignes.append(" ".join(cases))
        return "\n".join(lignes)

    for t in j:
        print(f"--- tour {t['tour']} : annonces {t['annonces']}")
        print(f"    programme {t['programme']}")
        print(f"    exécutées {t['executees']} -> {t['parades']} parade(s)")
        print(dessin(t["arbres"], t["machines"], t["individus"]))
    print(json.dumps({k: v for k, v in st.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
