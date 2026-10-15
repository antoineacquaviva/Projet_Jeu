"""Parties de référence du moteur Python (placement/) sur la couronne, pour vérifier le moteur JavaScript.

    python3 maquettes-numeriques/kit/generer_reference.py   (depuis la racine du dépôt)

Écrit maquettes-numeriques/kit/reference.json : réglages, état de départ, et pour chaque tour les annonces,
le programme, les menaces exécutées dans l'ordre, les parades et l'état d'arrivée.
"""
import json
import pathlib
import random
import sys

RACINE = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RACINE))
from placement.regles import Params, mise_en_place, tirer_annonces, tirer_execution, jouer_tour  # noqa: E402
from placement.partie import plateau  # noqa: E402
from placement.bots import fabriquer_gentil  # noqa: E402


def partie(reg, bot, graine):
    J = reg["joueurs"]
    M = J + reg["machinesEnPlus"]
    p = Params(plateau="couronne", joueurs=J, tuile_l=reg["tuileL"], tuile_p=reg["tuileP"],
               individus=reg["individusParJoueur"] * J, k=J, machines=M, n=M * reg["menacesParMachine"],
               annonces=M * reg["menacesParMachine"], menaces_par_machine=reg["menacesParMachine"],
               tours=reg["tours"]).valider()
    pl = plateau(p)
    rng = random.Random(graine)
    rb = random.Random(graine + 1)
    g = fabriquer_gentil(bot)
    g.debut()
    e = mise_en_place(p, pl, rng)
    e.individus = list(g.placer(p, pl, e, rb))
    out = {"reglages": reg, "bot": bot if isinstance(bot, str) else bot["type"], "depart": {
        "arbres": e.arbres[:], "machines": e.machines[:], "individus": e.individus[:]}, "tours": []}
    for _ in range(p.tours):
        ann = tirer_annonces(p, rng)
        ex = tirer_execution(p, rng)
        prog = g.jouer(p, pl, e, ann, rb)
        par = jouer_tour(p, pl, e, ann, prog, ex)
        out["tours"].append({"annonces": ann, "programme": prog, "executees": [ann[j] for j in ex], "parades": par,
                             "arbres": e.arbres[:], "machines": e.machines[:], "individus": e.individus[:]})
    return out


def main():
    regs = [dict(joueurs=2, machinesEnPlus=2, menacesParMachine=1, tuileL=3, tuileP=3, individusParJoueur=3, tours=8),
            dict(joueurs=4, machinesEnPlus=1, menacesParMachine=1, tuileL=3, tuileP=4, individusParJoueur=2, tours=8),
            dict(joueurs=6, machinesEnPlus=2, menacesParMachine=2, tuileL=4, tuileP=4, individusParJoueur=3, tours=6),
            dict(joueurs=3, machinesEnPlus=1, menacesParMachine=1, tuileL=3, tuileP=3, individusParJoueur=2, tours=8)]
    parties = []
    for i, reg in enumerate(regs):
        for bot in ("reflexe", "glouton", "aleatoire"):
            parties.append(partie(reg, bot, 100 + i))
    chemin = pathlib.Path(__file__).resolve().parent / "reference.json"
    chemin.write_text(json.dumps(parties), encoding="utf-8")
    print(f"{len(parties)} parties -> {chemin}")


if __name__ == "__main__":
    main()
