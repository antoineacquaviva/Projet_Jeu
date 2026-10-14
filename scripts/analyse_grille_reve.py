"""Lecture de la grille de réglage du rêve disputé (campagne `reve_dispute_grille`, 14 oct. 2026).

    python scripts/analyse_grille_reve.py <synthese.json> [--md sortie.md]

Pour chaque réglage : test T3 complet (foret.choix.gain_jugement : rêve 1 − rêve 0, libre − meilleur fixe,
régime), fréquence des reculs d'esprit (tir à la corde + cauchemar, T1), part des parties finies par le long
sommeil avant le tour 4, forêt moyenne du bot libre ; puis verdict sur les trois critères de la proposition."""
import json
import sys
from collections import defaultdict

sys.path.insert(0, __import__("os").path.dirname(__file__) + "/..")
from foret.choix import gain_jugement, _role_bot  # noqa: E402
from foret.mecanismes import frequences  # noqa: E402

GAIN_MIN, RECUL_MIN, SOMMEIL_TOT_MAX = 5.0, 1.0, 0.20


def nom(v):
    if v == "defaut":
        return "v0.4rd (3 lunes, cauchemar 1, 1 rêve/pas)"
    r = {"lunes": 3, "cauchemar_cases": 1, "reves_par_pas": 1}
    for m in v[len("regles:"):].split(","):
        k, _, x = m.partition("=")
        r[k] = int(x)
    return f"{r['lunes']} lunes, cauchemar {r['cauchemar_cases']}, {r['reves_par_pas']} rêve(s)/pas"


def fins(pc):
    cols = pc["colonnes"]
    acc = defaultdict(lambda: [0, 0, 0.0])                      # (variante, rôle) -> parties, sommeil tôt, forêt
    for l in pc["lignes"]:
        r = dict(zip(cols, l))
        role = _role_bot(r["bot"], json.loads(r.get("bot_params") or "{}")) or "?"
        a = acc[(r["variante"], role)]
        a[0] += 1
        a[1] += int(r["fin"] == "sommeil" and r["tour"] < 4)
        a[2] += r["foret_pct"]
    return acc


def analyser(syn):
    pc = syn["parties_compactes"]
    t3, fr, fi = gain_jugement(pc), frequences(syn), fins(pc)
    out = {}
    for v, r in t3.items():
        g = r.get("gain_du_jugement") or {}
        recul = (fr.get(v) or {}).get("tir_a_la_corde")
        n = sum(x[0] for (vv, _), x in fi.items() if vv == v)
        tot = sum(x[1] for (vv, _), x in fi.items() if vv == v)
        libre = fi.get((v, "libre"))
        crit = {
            "gain": bool(g) and g.get("verdict") == "sûr" and g.get("ecart", 0) >= GAIN_MIN,
            "recul": recul is not None and recul >= RECUL_MIN,
            "sommeil": n > 0 and tot / n < SOMMEIL_TOT_MAX,
        }
        out[v] = {**r, "reculs_par_partie": recul, "sommeil_avant_t4": round(tot / n, 3) if n else None,
                  "foret_libre": round(libre[2] / libre[0], 1) if libre else None, "criteres": crit,
                  "retenu": all(crit.values())}
    return out


def _e(e):
    if not e or e.get("ecart") is None:
        return "–"
    f = lambda x: format(x, "+.1f" if x is e["ecart"] else ".1f").replace(".", ",")  # noqa: E731
    return f"{f(e['ecart'])} [{f(e['ic95'][0])} ; {f(e['ic95'][1])}] ({e['verdict']})"


def markdown(res):
    L = ["| Réglage | Rêve 1 − rêve 0 | Libre − meilleur fixe | Régime | Reculs / partie | Sommeil avant T4 | Forêt (libre) | Critères |",
         "|---|---|---|---|---|---|---|---|"]
    for v, r in sorted(res.items(), key=lambda kv: -(kv[1].get("gain_du_jugement") or {}).get("ecart", -99)):
        c = r["criteres"]
        ok = "**3/3**" if r["retenu"] else f"{sum(c.values())}/3 ({', '.join(k for k, x in c.items() if not x)} manque)"
        rec = "–" if r["reculs_par_partie"] is None else format(r["reculs_par_partie"], ".2f").replace(".", ",")
        som = "–" if r["sommeil_avant_t4"] is None else f"{round(100 * r['sommeil_avant_t4'])} %"
        fl = "–" if r["foret_libre"] is None else f"{r['foret_libre']:.1f} %".replace(".", ",")
        L.append(f"| {nom(v)} | {_e(r['reve1_moins_reve0'])} | {_e(r.get('gain_du_jugement'))} | {r['regime']} | {rec} | {som} | {fl} | {ok} |")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    syn = json.load(open(sys.argv[1]))
    res = analyser(syn)
    md = markdown(res)
    if "--md" in sys.argv:
        open(sys.argv[sys.argv.index("--md") + 1], "w").write(md)
    print(md)
    print("Retenus :", [nom(v) for v, r in res.items() if r["retenu"]] or "aucun")
