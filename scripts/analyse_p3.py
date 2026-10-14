"""Analyse apparie du protocole P3 (plan vers la V1, étape a.3) : V0.4 contre son ancre V0.3.

    python scripts/analyse_p3.py <synthese V0.4 (campagne ligne_base_p2 sur v0.4)> <synthese V0.3 (ancre)> [nom_a nom_b]

Les deux noms (facultatifs) étiquettent les versions : par défaut « V0.4 » (premier fichier) et « V0.3 (ancre) ».
Essai du rêve disputé : python scripts/analyse_p3.py <synthese v0.4rd> <synthese v0.4> V0.4rd V0.4

Écrit en Markdown sur la sortie standard : forêt gardée par taille de table (bot fort MC64R, les deux
versions), écart apparié V0.4 − V0.3 (global puis par taille de table ; mêmes tables et mêmes graines).
"""
import gzip
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from foret.cycle import metriques_variantes, TAILLES  # noqa: E402
from foret.stats import ecart_apparie  # noqa: E402


def lire(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt", encoding="utf-8") as f:
        return json.load(f)


def fr(x, f=".1f"):
    return "–" if x is None else format(x, f).replace(".", ",")


def mc64r(S):
    """Lignes du bot fort (MC64R : glouton qui rêve une carte par tour, pas le portefeuille) du bloc « bots »."""
    pc = S["parties_compactes"]
    col = {c: i for i, c in enumerate(pc["colonnes"])}
    lignes = [l for l in pc["lignes"] if l[col["campagne"]] == "bots" and l[col["variante"]] == "defaut"
              and "portefeuille" not in str(l[col["bot_params"]])]
    return {"colonnes": pc["colonnes"], "lignes": lignes}


def cle_table(l, col):
    return f"{l[col['peuples']]}#{l[col['graine']]}"


def par_table(pc, taille=None):
    col = {c: i for i, c in enumerate(pc["colonnes"])}
    out = {}
    for l in pc["lignes"]:
        n = len(str(l[col["peuples"]]).split("+"))
        if taille is None or n == taille:
            out[cle_table(l, col)] = l[col["foret_pct"]]
    return out


def tableau(titre, mets):
    L = [f"**{titre}**", "", "| Taille | " + " | ".join(f"{n} j." for n in TAILLES) + " |",
         "|---|" + "---|" * len(TAILLES)]
    for v, m in mets.items():
        cells = []
        for n in TAILLES:
            t = m["tailles"].get(str(n))
            cells.append(f"{fr(t['foret'], '.1f')} % (tour {fr(t['tour'])})" if t else "–")
        L.append(f"| {v} | " + " | ".join(cells) + " |")
    return L + [""]


def main(p4, p3, nom4="V0.4", nom3="V0.3 (ancre)"):
    V4, V3 = lire(p4), lire(p3)
    a, b = mc64r(V3), mc64r(V4)
    out = [f"# Analyse appariée : {nom4} contre {nom3}", "",
           "*Généré par `scripts/analyse_p3.py` à partir de deux campagnes ligne_base_p2 (mêmes tables, mêmes graines). "
           "Bot fort : MC64R. Indices : 4 parties par table.*", ""]
    out += tableau("Forêt gardée par taille de table (bot fort MC64R)",
                   {nom3: metriques_variantes(a, meilleur_bot=False)["defaut"],
                    nom4: metriques_variantes(b, meilleur_bot=False)["defaut"]})
    out += [f"**Écart apparié {nom4} − {nom3} (points de forêt, intervalle à 95 % apparié)**", "",
            "| Taille | Paires | Écart | Intervalle 95 % | Verdict |", "|---|---|---|---|---|"]
    e = ecart_apparie(par_table(a), par_table(b))
    out.append(f"| toutes | {e['paires']} | {fr(e['ecart'], '+.1f')} | {e['ic95']} | {e['verdict']} |")
    for n in TAILLES:
        e = ecart_apparie(par_table(a, n), par_table(b, n))
        if e["paires"]:
            out.append(f"| {n} j. | {e['paires']} | {fr(e['ecart'], '+.1f')} | {e['ic95']} | {e['verdict']} |")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    if len(sys.argv) not in (3, 5):
        sys.exit(__doc__)
    sys.stdout.write(main(*sys.argv[1:]))
