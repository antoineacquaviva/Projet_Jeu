"""Lecture de la grille de réglage du rêve disputé (campagne `reve_dispute_grille`, 14 oct. 2026).

    python scripts/analyse_grille_reve.py <synthese.json> [--md sortie.md]

Pour chaque réglage : test T3 complet (foret.choix.gain_jugement : rêve 1 − rêve 0, libre − meilleur fixe,
régime), fréquence des reculs d'esprit (tir à la corde + cauchemar, T1) et des ordres du somnambule (critère de
riposte : reculs + ordres du somnambule, au moins 1 par partie ; 14 oct. 2026, 23 h), part des parties finies par le long
sommeil avant le tour 4, forêt moyenne du bot libre ; puis verdict sur les trois critères de la proposition."""
import json
import sys
from collections import defaultdict

sys.path.insert(0, __import__("os").path.dirname(__file__) + "/..")
from foret.choix import gain_jugement, _role_bot  # noqa: E402
from foret.mecanismes import frequences  # noqa: E402

GAIN_MIN, RECUL_MIN, SOMMEIL_TOT_MAX = 5.0, 1.0, 0.20


NOMS = {"lunes": "{} lunes", "cauchemar_cases": "cauchemar {}", "reves_par_pas": "{} rêve(s)/pas",
        "somnambule": "somnambule", "somnambule_apprend": "qui apprend", "presages": "{} présages",
        "cauchemar": "cauchemar"}
DEFAUT = {"lunes": 3, "cauchemar_cases": 1, "reves_par_pas": 1}


def nom(v):
    """Nom lisible d'une variante « regles:… » de v0.4rd (grille du 14 oct., puis essai du somnambule)."""
    if v == "defaut":
        return "v0.4rd (3 lunes, cauchemar 1, 1 rêve/pas)"
    r = {}
    for m in v[len("regles:"):].split(","):
        k, _, x = m.partition("=")
        r[k] = json.loads(x)
    if set(r) <= set(DEFAUT):                                    # la grille 2 × 2 × 2
        g = {**DEFAUT, **r}
        return f"{g['lunes']} lunes, cauchemar {g['cauchemar_cases']}, {g['reves_par_pas']} rêve(s)/pas"
    parts = []
    for k, x in r.items():
        if x is False:
            parts.append("sans " + NOMS.get(k, k).format(x))
        elif x is True:
            parts.append(NOMS.get(k, k))
        else:
            parts.append(NOMS.get(k, k + " {}").format(x))
    return "v0.4rd + " + ", ".join(parts)


def stats_variante(syn, cle):
    """Moyenne par partie d'un compteur du moteur pour chaque variante (tous instruments confondus)."""
    acc = defaultdict(lambda: [0, 0.0])
    for k, d in syn["detail"].items():
        v = k.split(" | ")[1]
        n = d.get("parties", 0)
        acc[v][0] += n
        acc[v][1] += n * (d.get("stats_par_partie") or {}).get(cle, 0.0)
    return {v: (x[1] / x[0] if x[0] else 0.0) for v, x in acc.items()}


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
    somn = stats_variante(syn, "somnambule_ordres")
    somn_ok = stats_variante(syn, "somnambule_reussis")
    out = {}
    for v, r in t3.items():
        g = r.get("gain_du_jugement") or {}
        recul = (fr.get(v) or {}).get("tir_a_la_corde")
        riposte = (recul or 0.0) + somn.get(v, 0.0)          # reculs d'esprit + ordres du somnambule (14 oct.)
        n = sum(x[0] for (vv, _), x in fi.items() if vv == v)
        tot = sum(x[1] for (vv, _), x in fi.items() if vv == v)
        libre = fi.get((v, "libre"))
        crit = {
            "gain": bool(g) and g.get("verdict") == "sûr" and g.get("ecart", 0) >= GAIN_MIN,
            "riposte": riposte >= RECUL_MIN,
            "sommeil": n > 0 and tot / n < SOMMEIL_TOT_MAX,
        }
        out[v] = {**r, "reculs_par_partie": recul, "somnambule_par_partie": round(somn.get(v, 0.0), 2),
                  "somnambule_reussis": round(somn_ok.get(v, 0.0), 2), "sommeil_avant_t4": round(tot / n, 3) if n else None,
                  "foret_libre": round(libre[2] / libre[0], 1) if libre else None, "criteres": crit,
                  "retenu": all(crit.values())}
    return out


def _e(e):
    if not e or e.get("ecart") is None:
        return "–"
    f = lambda x: format(x, "+.1f" if x is e["ecart"] else ".1f").replace(".", ",")  # noqa: E731
    return f"{f(e['ecart'])} [{f(e['ic95'][0])} ; {f(e['ic95'][1])}] ({e['verdict']})"


def markdown(res):
    somn = any(r.get("somnambule_par_partie") for r in res.values())
    L = ["| Réglage | Rêve 1 − rêve 0 | Libre − meilleur fixe | Régime | Reculs / partie"
         + (" | Somnambule / partie (réussis)" if somn else "") + " | Sommeil avant T4 | Forêt (libre) | Critères |",
         "|---|---|---|---|---|" + ("---|" if somn else "") + "---|---|---|"]
    for v, r in sorted(res.items(), key=lambda kv: -(kv[1].get("gain_du_jugement") or {}).get("ecart", -99)):
        c = r["criteres"]
        ok = "**3/3**" if r["retenu"] else f"{sum(c.values())}/3 ({', '.join(k for k, x in c.items() if not x)} manque)"
        rec = "–" if r["reculs_par_partie"] is None else format(r["reculs_par_partie"], ".2f").replace(".", ",")
        som = "–" if r["sommeil_avant_t4"] is None else f"{round(100 * r['sommeil_avant_t4'])} %"
        fl = "–" if r["foret_libre"] is None else f"{r['foret_libre']:.1f} %".replace(".", ",")
        sb = (f" | {r['somnambule_par_partie']:.2f} ({r['somnambule_reussis']:.2f})".replace(".", ",") if somn else "")
        L.append(f"| {nom(v)} | {_e(r['reve1_moins_reve0'])} | {_e(r.get('gain_du_jugement'))} | {r['regime']} | {rec}{sb} | {som} | {fl} | {ok} |")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    syn = json.load(open(sys.argv[1]))
    res = analyser(syn)
    md = markdown(res)
    if "--md" in sys.argv:
        open(sys.argv[sys.argv.index("--md") + 1], "w").write(md)
    print(md)
    print("Retenus :", [nom(v) for v, r in res.items() if r["retenu"]] or "aucun")
