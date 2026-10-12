"""Comparer deux synthèses de campagne (même campagne, deux maquettes ou deux
versions du moteur).

    python -m foret.comparer resultats/reference__v0 resultats/reference__v1
    python -m foret.comparer A B --noms v0 v1 --detail --sortie comparaison.md

Rend un tableau Markdown : indicateurs par bloc, puis (option --detail) par
(bloc, variante, bot), puis lacunes et incohérences par bloc.
"""
import argparse
import json
import os

INDICATEURS = [
    ("parties", "Parties", None),
    ("erreurs", "Erreurs", None),
    ("fin.nuit", "Nuit %", 1),
    ("fin.sommeil", "Sommeil %", 1),
    ("fin.silence", "Silence %", 1),
    ("tour_fin_moyen", "Tour de fin", 2),
    ("fin_tour_1_pct", "Fin au tour 1 %", 1),
    ("foret_pct", "Forêt restante %", 1),
    ("ordres_reussis_pct", "Ordres réussis %", 1),
    ("cartes_en_reve_moy", "Cartes en rêve", 2),
]


def charger(chemin):
    if os.path.isdir(chemin):
        chemin = os.path.join(chemin, "synthese.json")
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def valeur(agg, cle):
    v = agg
    for k in cle.split("."):
        if not isinstance(v, dict):
            return None
        v = v.get(k, 0 if k in ("nuit", "sommeil", "silence") else None)
    return v


def _f(v, dec):
    if v is None:
        return "–"
    if dec is None:
        return str(v)
    return f"{v:.{dec}f}".replace(".", ",")


def _delta(a, b, dec):
    if a is None or b is None or dec is None:
        return ""
    d = b - a
    return ("+" if d > 0 else "") + _f(d, dec)


def tableau_indicateurs(aggs, noms, titre_ligne):
    lignes = [f"| {titre_ligne} | Indicateur | " + " | ".join(noms) + " | Écart |",
              "|---|---|" + "---|" * (len(noms) + 1)]
    for nom_ligne, paire in aggs:
        for cle, lib, dec in INDICATEURS:
            vals = [valeur(a, cle) if a else None for a in paire]
            lignes.append(f"| {nom_ligne} | {lib} | " + " | ".join(_f(v, dec) for v in vals)
                          + f" | {_delta(vals[0], vals[-1], dec)} |")
            nom_ligne = ""
    return "\n".join(lignes)


def tableau_codes(A, B, noms, quoi):
    out = []
    for bloc in sorted(set(A["campagnes"]) | set(B["campagnes"])):
        a = A["campagnes"].get(bloc, {}).get(quoi, {})
        b = B["campagnes"].get(bloc, {}).get(quoi, {})
        codes = sorted(set(a) | set(b), key=lambda c: -max(a.get(c, {}).get("pct_parties", 0),
                                                           b.get(c, {}).get("pct_parties", 0)))
        if not codes:
            continue
        out.append(f"\n**{bloc}** (% des parties concernées ; par partie)\n")
        out.append(f"| Code | {noms[0]} | {noms[1]} |")
        out.append("|---|---|---|")
        for c in codes:
            def cell(d):
                if c not in d:
                    return "–"
                return f"{_f(d[c]['pct_parties'], 1)} ; {_f(d[c]['par_partie'], 2)}"
            out.append(f"| {c} | {cell(a)} | {cell(b)} |")
    return "\n".join(out)


def comparer(A, B, noms=("A", "B"), detail=False):
    parts = [f"# Comparaison {noms[0]} → {noms[1]}\n"]
    for nom, S in zip(noms, (A, B)):
        m = S.get("meta", {})
        parts.append(f"- **{nom}** : campagne {m.get('campagne', '?')}, maquette "
                     f"{(m.get('maquette') or {}).get('nom', '?')}, moteur {m.get('moteur', '?')}, "
                     f"{m.get('parties', '?')} parties, {m.get('erreurs', '?')} erreurs")
    blocs = sorted(set(A["campagnes"]) | set(B["campagnes"]))
    parts.append("\n## Par bloc\n")
    parts.append(tableau_indicateurs([(b, (A["campagnes"].get(b), B["campagnes"].get(b))) for b in blocs],
                                     noms, "Bloc"))
    if detail:
        cles = [k for k in A["detail"] if k in B["detail"]]
        parts.append("\n## Par bloc, variante et bot\n")
        parts.append(tableau_indicateurs([(k, (A["detail"][k], B["detail"][k])) for k in cles], noms,
                                         "Bloc | variante | bot"))
        seules = sorted(set(A["detail"]) ^ set(B["detail"]))
        if seules:
            parts.append("\nPrésentes d'un seul côté : " + " ; ".join(seules))
    parts.append("\n## Lacunes\n")
    parts.append(tableau_codes(A, B, noms, "lacunes"))
    parts.append("\n## Incohérences\n")
    parts.append(tableau_codes(A, B, noms, "incoherences"))
    return "\n".join(parts) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("a")
    ap.add_argument("b")
    ap.add_argument("--noms", nargs=2, default=None)
    ap.add_argument("--detail", action="store_true")
    ap.add_argument("--sortie")
    args = ap.parse_args()
    A, B = charger(args.a), charger(args.b)
    noms = args.noms or [os.path.basename(os.path.normpath(args.a)), os.path.basename(os.path.normpath(args.b))]
    txt = comparer(A, B, noms, args.detail)
    if args.sortie:
        with open(args.sortie, "w", encoding="utf-8") as f:
            f.write(txt)
    print(txt)


if __name__ == "__main__":
    main()
