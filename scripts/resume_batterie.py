"""Résumé Markdown d'un rapport de batterie (onglet « Résumé » d'un run GitHub Actions, et resume.md).

    python scripts/resume_batterie.py resultats/batterie >> "$GITHUB_STEP_SUMMARY"
"""
import json
import os
import sys

PRINCIPALES = [("v1_g1", "v1, rêve"), ("v1_g0", "v1, sans rêve"), ("v2_g1", "V2, rêve"), ("v2_g0", "V2, sans rêve")]
LIGNES = ["robustesse", "concentration", "surprise", "reve_fixe", "shapley", "synergies", "pire_table", "spectateur",
          "predictibilite", "incertitude", "fins_precoces", "menace_croissante", "plancher", "echelle_bots"]
PASTILLE = {"vert": "🟢", "orange": "🟠", "rouge": "🔴"}


def _num(x):
    if not isinstance(x, (int, float)) or isinstance(x, bool):
        return ""
    return (f"{x:.2f}" if abs(x) < 10 else f"{x:.1f}").replace(".", ",")


def main(dossier):
    with open(os.path.join(dossier, "rapport.json"), encoding="utf-8") as f:
        r = json.load(f)
    fusion = {}
    if os.path.exists(os.path.join(dossier, "fusion.json")):
        with open(os.path.join(dossier, "fusion.json"), encoding="utf-8") as f:
            fusion = json.load(f)
    C = r["configs"]
    out = [f"## Batterie d'évaluation (moteur {r['moteur']}, {r['date']})", ""]
    parties = sum(c["parties_jouees"] for c in C.values())
    erreurs = sum(c["erreurs"] for c in C.values())
    out.append(f"- **Configurations** : {len(C)} ; **parties** : {parties} ({erreurs} en erreur)")
    if fusion:
        out.append(f"- **Lots** : {fusion['lots']} ; échelle {fusion['echelle']} ; plus long lot : "
                   f"{fusion['duree_max_s']} s ; calcul cumulé : {fusion['duree_cumulee_coeurs_s']} s-cœur "
                   f"({fusion['parties_par_s_par_coeur']} parties/s/cœur)")
    temoins = r.get("temoins", [])
    ok = [t for t in temoins if t["ok"]]
    out.append(f"- **Témoins réussis** : {len(ok)} sur {len(temoins)}")
    cols = [(k, lib) for k, lib in PRINCIPALES if k in C]
    if cols:
        out += ["", "Verdicts (indices du bot qui a joué) :", "",
                "| Mesure | " + " | ".join(lib for _, lib in cols) + " |", "|---|" + "---|" * len(cols)]
        for m in LIGNES:
            cells = []
            for k, _ in cols:
                v = C[k].get(m) or {}
                verdict = v.get("verdict")
                cells.append((PASTILLE.get(verdict, "") + " " + _num(v.get("valeur"))).strip() or "–")
            nom = r["mesures"].get(m, {}).get("nom", m)
            out.append(f"| {nom} | " + " | ".join(cells) + " |")
    rates = [t for t in temoins if not t["ok"]]
    if rates:
        out += ["", "Témoins ratés :", ""]
        out += [f"- {t['mesure']} sur {t['temoin']} : attendu {t['attendu']}"
                + (f" ({t['erreur']})" if t.get("erreur") else "") for t in rates]
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
