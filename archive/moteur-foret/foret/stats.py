"""Statistiques appariées et intervalles par rééchantillonnage (plan vers la V1, étape 0.3).

Deux variantes jouées sur les mêmes tables et les mêmes graines (même peuples, même graine, même bot)
forment des **paires** : la partie A et la partie B ne diffèrent que par la règle changée. L'écart
moyen des paires a une marge bien plus étroite que la différence de deux moyennes indépendantes,
parce que le hasard commun (dés, mains) s'annule. Les marges sont des intervalles à 95 % obtenus par
rééchantillonnage (bootstrap percentile), sans hypothèse de loi normale ; la graine du
rééchantillonnage est fixe, si bien que le calcul est reproductible.

**Règle de l'écart sûr** (docs/mesures.md, « Statistiques appariées ») :
- « sûr » : l'intervalle à 95 % de l'écart apparié exclut 0 ;
- « négligeable » : l'intervalle tient entièrement dans ± SEUIL_NEGLIGEABLE points ;
- « incertain » : sinon (il faut plus de parties pour conclure).
"""
import json
import random
from collections import defaultdict

TIRAGES = 2000
SEUIL_NEGLIGEABLE = 1.0     # points de forêt (en % de la forêt initiale)


def moyenne(xs):
    xs = list(xs)
    return sum(xs) / len(xs) if xs else None


def ic_bootstrap(xs, tirages=TIRAGES, niveau=0.95, graine=0):
    """Intervalle percentile de la moyenne de xs par rééchantillonnage. None si moins de 2 valeurs."""
    xs = list(xs)
    n = len(xs)
    if n < 2:
        return None
    rng = random.Random(graine)
    moys = sorted(sum(xs[rng.randrange(n)] for _ in range(n)) / n for _ in range(tirages))
    a = (1 - niveau) / 2
    return moys[int(a * tirages)], moys[min(tirages - 1, int((1 - a) * tirages))]


def verdict(ic, seuil=SEUIL_NEGLIGEABLE):
    """Règle de l'écart sûr appliquée à un intervalle (bas, haut)."""
    if ic is None:
        return "incertain"
    bas, haut = ic
    if bas > 0 or haut < 0:
        return "sûr"
    if -seuil <= bas and haut <= seuil:
        return "négligeable"
    return "incertain"


def ecart_apparie(a, b, **kw):
    """a, b : dict clé de table → valeur. Écart (b − a) sur les clés communes.

    Rend {"paires", "ecart", "ic95", "verdict", "ic95_independant"} ; ic95_independant est l'intervalle
    qu'on obtiendrait sans apparier (différence de deux moyennes rééchantillonnées), pour montrer le gain."""
    cles = sorted(set(a) & set(b))
    d = [b[k] - a[k] for k in cles]
    if not d:
        return {"paires": 0, "ecart": None, "ic95": None, "verdict": "incertain", "ic95_independant": None}
    ic = ic_bootstrap(d, **kw)
    ind = None
    xa, xb = [a[k] for k in cles], [b[k] for k in cles]
    if len(cles) >= 2:
        ia, ib = ic_bootstrap(xa, graine=1), ic_bootstrap(xb, graine=2)
        ma, mb = moyenne(xa), moyenne(xb)
        # demi-largeurs combinées (somme quadratique), centrées sur la différence des moyennes
        da, db = (ia[1] - ia[0]) / 2, (ib[1] - ib[0]) / 2
        h = (da ** 2 + db ** 2) ** 0.5
        ind = (mb - ma - h, mb - ma + h)
    r = lambda x: None if x is None else round(x, 2)  # noqa: E731
    return {"paires": len(d), "ecart": r(moyenne(d)), "ic95": ic and [r(ic[0]), r(ic[1])],
            "verdict": verdict(ic), "ic95_independant": ind and [r(ind[0]), r(ind[1])]}


def cle_table(r):
    """Clé d'appariement d'une partie : peuples (dans l'ordre), graine."""
    return "+".join(r["peuples"]) + "#" + str(r["graine"])


def foret_pct(r):
    return 100 * r["foret"] / r["foret_initiale"]


def apparier(resultats, reference="defaut", mesure=foret_pct, groupe=("campagne", "bot", "bot_params")):
    """Compare chaque variante à la variante de référence, groupe par groupe (même bloc, même bot).

    reference : un nom de variante, ou un dict bloc → nom de variante (références_par_bloc).
    Rend {groupe: {"reference": nom, "ecarts": {variante: ecart_apparie}}}. Les parties en erreur sont ignorées."""
    par = defaultdict(lambda: defaultdict(dict))
    for r in resultats:
        if "erreur" in r:
            continue
        g = " | ".join(json.dumps(r[c], sort_keys=True, ensure_ascii=False) if isinstance(r[c], (dict, list))
                       else str(r[c]) for c in groupe)
        par[g][r["variante"]][cle_table(r)] = mesure(r)
    blocs = {}
    for r in resultats:
        if "erreur" not in r:
            g = " | ".join(json.dumps(r[c], sort_keys=True, ensure_ascii=False) if isinstance(r[c], (dict, list))
                           else str(r[c]) for c in groupe)
            blocs[g] = r["campagne"]
    out = {}
    for g, variantes in par.items():
        ref_nom = reference.get(blocs[g]) if isinstance(reference, dict) else reference
        if ref_nom not in variantes or len(variantes) < 2:
            continue
        ref = variantes[ref_nom]
        out[g] = {"reference": ref_nom,
                  "ecarts": {v: ecart_apparie(ref, vals) for v, vals in variantes.items() if v != ref_nom}}
    return out


def references_par_bloc(campagne):
    """Variante de référence de chaque bloc : clé « reference » du bloc, sinon de la campagne,
    sinon « defaut » si le bloc la joue, sinon sa première variante."""
    out = {}
    for b in campagne.get("blocs", []):
        vs = b.get("variantes", [])
        out[b["nom"]] = b.get("reference") or campagne.get("reference") or ("defaut" if "defaut" in vs else (vs[0] if vs else None))
    return out


def parties_compactes(resultats):
    """Une ligne par partie, pour réanalyser une campagne sans la rejouer (par taille de table, par paire…).

    Rend {"colonnes": [...], "lignes": [[...], ...]} ; les parties en erreur sont omises."""
    cols = ["campagne", "variante", "bot", "peuples", "graine", "foret_pct", "tour", "fin", "cartes_en_reve",
            "tours_max", "bot_params"]
    lignes = []
    for r in resultats:
        if "erreur" in r:
            continue
        lignes.append([r["campagne"], r["variante"], r["bot"], "+".join(r["peuples"]), r["graine"],
                       round(foret_pct(r), 2), r["tour"], r["fin"], r.get("cartes_en_reve"),
                       r.get("tours_max"), json.dumps(r.get("bot_params", {}), sort_keys=True)])
    return {"colonnes": cols, "lignes": lignes}
