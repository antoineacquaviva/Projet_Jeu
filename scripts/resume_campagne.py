"""Résumé Markdown d'une synthèse de campagne (pour l'onglet « Résumé » d'un run GitHub Actions).

    python scripts/resume_campagne.py resultats/essai >> "$GITHUB_STEP_SUMMARY"
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from foret.comparer import INDICATEURS, valeur, _f  # noqa: E402
from foret.mesures import chef_depuis_synthese, coordination_depuis_synthese  # noqa: E402


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
    out += mesures_coordination(S)
    print("\n".join(out))


def mesures_coordination(S):
    """Campagnes de coordination (blocs « soi » et « central ») : part récupérée et chef unique."""
    lignes = []
    co = coordination_depuis_synthese(S)
    if co:
        lignes.append(f"- **Coordination** (part de l'écart récupérée) : {_f(co['part'], 1)} % "
                      f"(aucun signe {_f(co['aucun_signe'], 1)}, maquette {_f(co['forme'], 1)}, "
                      f"tout dire {_f(co['tout_dire'], 1)} ; écart {_f(co['ecart'], 1)} ± {_f(co['marge'], 1)}) : "
                      f"{co['verdict']}")
    for var, lib in (("defaut", "Chef unique"), ("comm_tout_dire", "Chef unique, témoin « tout dire »")):
        ch = chef_depuis_synthese(S, var)
        if ch:
            lignes.append(f"- **{lib}** : {_f(ch['gain'], 1)} % ± {_f(ch['marge'], 1)} "
                          f"(central {_f(ch['central'], 1)}, chacun pour soi {_f(ch['soi'], 1)}) : {ch['verdict']}")
    return ["", *lignes] if lignes else []


if __name__ == "__main__":
    main(sys.argv[1])
