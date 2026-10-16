"""Jouer une partie et afficher son journal.

    python -m foret.partie --peuples oiseaux insectes --bot glouton --graine 3
    python -m foret.partie --maquette v0 --variante fin_de_tour --peuples reptiles entites --bot aleatoire
    python -m foret.partie --peuples mammiferes humains --bot glouton --params '{"reves_par_tour": 1}'
    python -m foret.partie --peuples oiseaux humains --decisions decisions.jsonl   # journal des décisions
"""
import argparse
import json

from .maquette import charger
from .moteur import Partie, CASES
from .bots import fabriquer
from .observateurs import JournalDecisions


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--maquette", default="v1")
    ap.add_argument("--variante", default="defaut")
    ap.add_argument("--peuples", nargs="+", default=["oiseaux", "insectes"])
    ap.add_argument("--bot", default="glouton")
    ap.add_argument("--params", default="{}", help="paramètres du bot, en JSON")
    ap.add_argument("--graine", type=int, default=1)
    ap.add_argument("--bilan", action="store_true", help="afficher aussi le bilan complet (JSON)")
    ap.add_argument("--decisions", metavar="FICHIER", help="écrire le journal des décisions (JSONL) et le résumer")
    args = ap.parse_args()

    m = charger(args.maquette, args.variante)
    spec = {"type": args.bot, "params": json.loads(args.params)}
    bots = [fabriquer(spec, args.graine * 100 + i) for i in range(len(args.peuples))]
    jd = JournalDecisions() if args.decisions else None
    p = Partie(m, args.peuples, bots, graine=args.graine, journal=True, observateurs=[jd] if jd else ())
    print(f"Maquette {m['nom']} ({m['variante']}), graine {args.graine}")
    print("Piste :", " ".join(f"{c}:{p.piste[c].nom}" for c in CASES))
    print("Présence :", {k: dict(v) for k, v in p.presence.items()})
    b = p.jouer()
    print("\n".join(p.journal.lignes))
    print(f"\nFin : {b['fin']} au tour {b['tour']}, forêt {b['foret']}/{b['foret_initiale']}")
    if jd:
        jd.ecrire(args.decisions)
        print(f"\n{len(jd.entrees)} décisions écrites dans {args.decisions}")
        for t, r in sorted(jd.resume().items()):
            print(f"  {t:17s} {r['decisions']:4d} décisions, {100 * r['part_forcee']:5.1f} % forcées, "
                  f"{r['options_moyennes']:5.1f} options en moyenne")
    if args.bilan:
        print(json.dumps(b, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
