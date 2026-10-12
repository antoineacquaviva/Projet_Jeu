"""Résumé Markdown d'une synthèse de campagne (pour l'onglet « Résumé » d'un run GitHub Actions).

    python scripts/resume_campagne.py resultats/essai >> "$GITHUB_STEP_SUMMARY"
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from foret.comparer import INDICATEURS, valeur, _f  # noqa: E402


def main(dossier):
    with open(os.path.join(dossier, "synthese.json"), encoding="utf-8") as f:
        S = json.load(f)
    m = S["meta"]
    out = [f"## Campagne « {m['campagne']} » sur {m['maquette']['nom']}", ""]
    out.append(f"- **Parties** : {m['parties']} ({m['erreurs']} en erreur)")
    if "lots" in m:
        out.append(f"- **Lots** : {m['lots']} ; durée du plus long : {m['duree_s']} s ; "
                   f"calcul cumulé : {m['duree_cumulee_coeurs_s']} s-cœur")
        out.append(f"- **Vitesse** : {m['parties_par_s_par_coeur']} parties par seconde et par cœur")
    else:
        out.append(f"- **Durée** : {m['duree_s']} s")
    out += ["", "| Bloc | " + " | ".join(lib for _, lib, _ in INDICATEURS) + " |",
            "|---|" + "---|" * len(INDICATEURS)]
    for bloc, agg in S["campagnes"].items():
        out.append(f"| {bloc} | " + " | ".join(_f(valeur(agg, cle), dec) for cle, _, dec in INDICATEURS) + " |")
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
