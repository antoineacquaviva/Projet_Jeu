"""Tests T3 léger, T4 et T5 du choix stratégique (décisions C2 et C3 de l'auteur, 14 oct. 2026).

Leçon du rêve (projet/3-pilotage/choix-strategique.md) : un choix est stratégique s'il est **disputé** :
chaque option est la meilleure dans une part notable des situations, l'écart compte, et la frontière se lit
sur des indices publics sans se réduire à une seule règle. On note Δ(s) l'écart de valeur entre deux options
dans la situation s.

- [mesure:profil_delta] **T4, profil de Δ** : sur les décisions que le bot fort a jugées en entier (chaque
  option estimée par les mêmes suites), la part des situations où l'option A gagne nettement (plus de S points
  et plus de deux erreurs types de l'écart apparié), où l'option B gagne nettement, et la zone neutre ou
  incertaine. Le bruit des suites ne peut donc pas fabriquer un dilemme. Régimes : disputé, dominé, indifférent.
  Remplace la mesure des « dilemmes », qui comptait l'indifférence comme un dilemme.
- [mesure:lisibilite] **T5, lisibilité et profondeur** : un arbre de décision à un puis deux indices publics
  prédit-il le signe de Δ ? Validation croisée en deux moitiés tirées au sort (graine fixe), contre le hasard
  (la classe la plus fréquente).
- Les **indices publics** d'une situation (indices_publics) et les **réflexes de rêve** du glouton
  (condition_reve : test T3 léger, étape `boucles` ; foret/boucles.py).

Lecture seule : rien ne juge tant que l'auteur n'a pas confirmé les seuils proposés sur leurs témoins.
"""
import random
from collections import Counter, defaultdict

S = 2.0                   # points de forêt : en deçà, la situation est neutre
SEUIL_MENACE = 0.15       # comme le glouton (seuil_menace)

# choix étudiés : (type de décision, étiquettes de A, étiquettes de B, nom de A, nom de B)
# Le choix « rêver ou défendre » est un choix de RYTHME : un rêve ne vaut que par ceux qui suivent, si bien que son
# profil décision par décision dépend de la politique des suites du bot (campagnes 22 à 30, 14 oct.) et ne sépare
# pas les témoins V0.3 et V0.4. Il reste calculé pour information ; le test qui fait foi est gain_jugement (T3
# complet, au niveau de la partie). Les choix sans rythme (saboter ou barrer, moitié) gardent le même profil quel
# que soit l'instrument : T4 s'y applique.
RYTHME = {"rever_ou_defendre"}
CHOIX = {
    "rever_ou_defendre": ("programmer_mode", {"reve"}, {"haut", "bas"}, "rêver", "défendre"),
    "saboter_ou_barrer": ("action", {"saboter"}, {"barrer"}, "saboter", "barrer"),
    "moitie_haute_ou_basse": ("programmer_mode", {"haut"}, {"bas"}, "moitié haute", "moitié basse"),
}
INDICES = ("tour", "etape", "main", "pas_esprit", "manque_cercle", "menace_max", "menace_ici",
           "zone_menacee_a_portee", "presage_devant_esprit", "tactiques_8_9")
BANDES_PROPOSEES = {"profil": "chaque côté ≥ 20 % des situations, zone neutre ≤ 50 %, S = 2 points",
                    "lisibilite": "un indice ≥ 65 % ; gain du deuxième ≥ 5 points ; plafond < 95 %"}


# ------------------------------------------------------------------ situation
def _zones_a_portee(partie, siege):
    zs = set(partie.zones_presence(siege.peuple))
    return zs | {n for z in list(zs) for n in partie.plateau.adj[z]}


def indices_publics(partie, siege=None):
    """Ce que toute la table voit de la situation (sans effet de bord). Nombres seulement."""
    with partie.muet():
        es = [c for c in partie.esprits() if c > 7]
        prev = partie.prevision()
        d = None
        e0 = partie.etapes[0]
        if partie.des_source.get(e0) == "presage" and e0 in partie.des_vus:
            d = sum(partie.des_vus[e0])
        try:
            manque = partie.capacite_cercle() - len(partie.cercle) if partie.R.get("voies_reve") else None
        except Exception:  # noqa: BLE001 - maquette sans Cercle
            manque = None
        ind = {"tour": partie.tour, "etape": partie.etape or 0,
               "pas_esprit": min(c - 7 for c in es) if es else 6,
               "manque_cercle": manque if manque is not None else 99,
               "menace_max": round(max(prev.values()), 3) if prev else 0.0,
               "presage_devant_esprit": int(d is not None and ((d + 1) in es or (d == 12 and 12 not in es))),
               "tactiques_8_9": sum(1 for c in (8, 9) if partie.piste[c].genre == "tactique")}
        if siege is not None:
            portee = _zones_a_portee(partie, siege)
            ind["main"] = len(siege.main)
            ind["menace_ici"] = round(max((prev[z] for z in portee), default=0.0), 3)
            zmax = max(prev, key=lambda z: (prev[z], -partie.plateau.numero[z])) if prev else None
            ind["zone_menacee_a_portee"] = int(zmax in portee) if zmax is not None else 1
        return ind


CONDITIONS_REVE = ("esprit_proche", "calme", "hors_portee", "presage_esprit")


def condition_reve(nom, partie, siege):
    """Réflexes de rêve du glouton (paramètre reve_si) : des règles simples qui lisent la situation."""
    ind = indices_publics(partie, siege)
    if nom == "esprit_proche":           # le sommeil ou le réveil est à un pas
        return ind["pas_esprit"] <= 1 or ind["manque_cercle"] <= 1
    if nom == "calme":                   # rien à défendre à portée
        return ind["menace_ici"] < SEUIL_MENACE
    if nom == "hors_portee":             # la zone la plus menacée est hors de portée
        return ind["menace_max"] > SEUIL_MENACE and not ind["zone_menacee_a_portee"]
    if nom == "presage_esprit":          # le présage désigne la case devant un esprit (R2.6)
        return bool(ind["presage_devant_esprit"])
    raise ValueError(f"réflexe de rêve inconnu : {nom!r} ({', '.join(CONDITIONS_REVE)})")


def etiquette_option(o):
    """Nom court d'une option du moteur, pour classer les jugements."""
    if o is None:
        return "rien"
    if isinstance(o, (str, bool, int)):
        return str(o)
    if isinstance(o, tuple) and o and isinstance(o[0], str):
        return o[0]
    if hasattr(o, "uid"):
        return "carte"
    return type(o).__name__


# ------------------------------------------------------------------ T4 : profil de Δ
def _erreur(da, db):
    """Erreur type de la moyenne des écarts appariés (mêmes hasards), ou None."""
    d = [x - y for x, y in zip(da, db)]
    k = len(d)
    if k < 2:
        return None
    m = sum(d) / k
    return (sum((x - m) ** 2 for x in d) / (k - 1) / k) ** 0.5


def deltas(jugements, choix):
    """[(Δ, indices, erreur type de Δ ou None)] des jugements où les deux classes d'options sont présentes.
    A et B prennent chacun leur meilleure option (par la moyenne des suites)."""
    type_, a, b = CHOIX[choix][:3]
    out = []
    for j in jugements:
        if j.get("type") != type_ or "options" not in j:
            continue
        ia = [i for i, o in enumerate(j["options"]) if o in a]
        ib = [i for i, o in enumerate(j["options"]) if o in b]
        if not ia or not ib:
            continue
        va = max(ia, key=lambda i: j["valeurs"][i])
        vb = max(ib, key=lambda i: j["valeurs"][i])
        se = _erreur(j["suites"][va], j["suites"][vb]) if j.get("suites") else None
        out.append((j["valeurs"][va] - j["valeurs"][vb], j.get("indices") or {}, se))
    return out


def _cote(d, se, s):
    """+1 si A gagne nettement (au-delà de S et de deux erreurs types), −1 pour B, 0 sinon (neutre ou incertain)."""
    seuil = max(s, 2 * se) if se is not None else s
    return 1 if d > seuil else (-1 if d < -seuil else 0)


def profil(ds, s=S):
    """Une situation compte pour A (ou B) si A gagne de plus de S points **et** de plus de deux erreurs types :
    le bruit des suites ne peut pas fabriquer un dilemme. Le reste est « neutre ou incertain »."""
    ds = [x if len(x) == 3 else (x[0], x[1], None) for x in ds]
    n = len(ds)
    if not n:
        return {"n": 0}
    xs = [d for d, _, _ in ds]
    cotes = [_cote(d, se, s) for d, _, se in ds]
    pa = 100 * sum(1 for c in cotes if c > 0) / n
    pb = 100 * sum(1 for c in cotes if c < 0) / n
    neutre = 100 - pa - pb
    ses = [se for _, _, se in ds if se is not None]
    if neutre > 50:
        regime = "indifférent"
    elif pa >= 20 and pb >= 20:
        regime = "disputé"
    else:
        regime = "dominé par A" if pa > pb else "dominé par B"
    return {"n": n, "part_a": round(pa, 1), "part_b": round(pb, 1), "neutre": round(neutre, 1),
            "delta_moyen": round(sum(xs) / n, 2), "ecart_absolu_moyen": round(sum(abs(x) for x in xs) / n, 2),
            "erreur_type_moyenne": round(sum(ses) / len(ses), 2) if ses else None, "regime": regime}


# ------------------------------------------------------------------ T5 : lisibilité
def _seuils(xs):
    vs = sorted(set(xs))
    return [(a + b) / 2 for a, b in zip(vs, vs[1:])]


def _majorite(ys):
    return Counter(ys).most_common(1)[0][0] if ys else 1


def _souche(X, ys, indices):
    """Meilleure règle à un indice sur (X, ys) : (indice, seuil, classe si ≤, classe si >, bien classés)."""
    best = None
    for f in indices:
        col = [x.get(f, 0) for x in X]
        for t in _seuils(col):
            g = [y for c, y in zip(col, ys) if c <= t]
            d = [y for c, y in zip(col, ys) if c > t]
            cg, cd = _majorite(g), _majorite(d)
            ok = sum(1 for y in g if y == cg) + sum(1 for y in d if y == cd)
            if best is None or ok > best[4]:
                best = (f, t, cg, cd, ok)
    return best


def _predire1(r, x):
    f, t, cg, cd, _ = r
    return cg if x.get(f, 0) <= t else cd


def _arbre2(X, ys, indices):
    r = _souche(X, ys, indices)
    if r is None:
        return None
    f, t = r[0], r[1]
    g = [(x, y) for x, y in zip(X, ys) if x.get(f, 0) <= t]
    d = [(x, y) for x, y in zip(X, ys) if x.get(f, 0) > t]
    sg = _souche([x for x, _ in g], [y for _, y in g], indices) if len(g) > 1 else None
    sd = _souche([x for x, _ in d], [y for _, y in d], indices) if len(d) > 1 else None
    return (r, sg, sd)


def _predire2(a, x):
    r, sg, sd = a
    s = sg if x.get(r[0], 0) <= r[1] else sd
    return _predire1(s, x) if s is not None else _predire1(r, x)


def lisibilite(ds, s=S, indices=INDICES):
    """Précision (validation croisée en deux moitiés) d'une règle à un indice, puis à deux, pour prédire
    quelle option gagne, sur les situations non neutres. Comparée à la classe la plus fréquente."""
    ds = [x if len(x) == 3 else (x[0], x[1], None) for x in ds]
    pts = [(ind, 1 if c > 0 else 0) for d, ind, se in ds for c in [_cote(d, se, s)] if c != 0 and ind]
    n = len(pts)
    if n < 10 or len({y for _, y in pts}) < 2:
        return {"n": n}
    ordre = list(range(n))
    random.Random(0).shuffle(ordre)                 # deux moitiés tirées au sort (graine fixe), pas par parité
    plis = [[pts[i] for i in ordre[0::2]], [pts[i] for i in ordre[1::2]]]
    base = acc1 = acc2 = 0
    for k in (0, 1):
        app, test = plis[1 - k], plis[k]
        X, ys = [x for x, _ in app], [y for _, y in app]
        maj = _majorite(ys)
        r1 = _souche(X, ys, indices)
        a2 = _arbre2(X, ys, indices)
        base += sum(1 for _, y in test if y == maj)
        acc1 += sum(1 for x, y in test if r1 and _predire1(r1, x) == y)
        acc2 += sum(1 for x, y in test if a2 and _predire2(a2, x) == y)
    r_tout = _souche([x for x, _ in pts], [y for _, y in pts], indices)
    return {"n": n, "hasard": round(100 * base / n, 1), "un_indice": round(100 * acc1 / n, 1),
            "deux_indices": round(100 * acc2 / n, 1),
            "regle": None if r_tout is None else {"indice": r_tout[0], "seuil": r_tout[1],
                                                   "si_inferieur": "A" if r_tout[2] else "B",
                                                   "si_superieur": "A" if r_tout[3] else "B"}}


# ------------------------------------------------------------------ synthèse
def analyser(resultats, s=S):
    """{variante: {choix: {"profil", "lisibilite"}}} depuis les parties (avec « jugements »)."""
    par_v = defaultdict(list)
    for r in resultats:
        if "erreur" not in r and r.get("jugements"):
            par_v[r["variante"]] += r["jugements"]
    out = {}
    for v, jug in par_v.items():
        out[v] = {}
        for c in CHOIX:
            ds = deltas(jug, c)
            if ds:
                out[v][c] = {"profil": profil(ds, s), "lisibilite": lisibilite(ds, s)}
    return out


def _f(x, f=".0f"):
    return "–" if x is None else format(x, f).replace(".", ",")


def markdown(analyse, titre="Choix stratégiques : profil de Δ et lisibilité (T4, T5 ; lecture seule)"):
    L = [f"## {titre}", "",
         f"*Décisions C2 et C3 (14 oct.). Δ = valeur de A − valeur de B dans une situation, estimée par le bot fort "
         f"(mêmes suites pour chaque option). Une situation compte pour A (ou B) si l'écart dépasse {_f(S, '.0f')} points et deux erreurs types (mêmes suites appariées) ; sinon elle est neutre ou incertaine. Seuils proposés, "
         f"non confirmés : {BANDES_PROPOSEES['profil']} ; lisibilité : {BANDES_PROPOSEES['lisibilite']}.*", "",
         "| Variante | Choix (A ou B) | Situations | A gagne | B gagne | Neutre | Δ moyen | Régime | Hasard | 1 indice | 2 indices | Règle à un indice |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for v, par_c in analyse.items():
        nv = "l'ancre" if v == "defaut" else (v if len(v) < 40 else v[:37] + "…")
        for c, r in par_c.items():
            p, li = r["profil"], r["lisibilite"]
            _, _, _, na, nb = CHOIX[c]
            regle = li.get("regle")
            rg = (f"{regle['indice']} ≤ {_f(regle['seuil'], '.2f')} → {na if regle['si_inferieur'] == 'A' else nb}"
                  if regle else "–")
            regime = p.get('regime', '–') + (" (choix de rythme : non applicable, voir T3)" if c in RYTHME else "")
            L.append(f"| {nv} | {na} ou {nb} | {p.get('n', 0)} | {_f(p.get('part_a'))} % | {_f(p.get('part_b'))} % | "
                     f"{_f(p.get('neutre'))} % | {_f(p.get('delta_moyen'), '+.1f')} | {regime} | "
                     f"{_f(li.get('hasard'))} % | {_f(li.get('un_indice'))} % | {_f(li.get('deux_indices'))} % | {rg} |")
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------ T3 complet : un choix de rythme (le rêve)
def _role_bot(bot, params):
    """« libre » (portefeuille), « fixe_<taux> » (taux de rêve imposé ou suites à taux fixe), ou None."""
    if bot != "mc":
        return None
    if params.get("portefeuille"):
        return "libre"
    if "reves_par_tour" in params:
        return f"fixe_{params['reves_par_tour']:g}"
    r = (params.get("politique") or {}).get("params", {}).get("reves_par_tour")
    return f"suites_{r:g}" if r is not None else None


def gain_jugement(pc):
    """[mesure:gain_libre] Test T3 complet, au niveau de la partie, pour un choix dont la valeur dépend du rythme
    (le rêve) : la décision par décision (T4) ne s'y applique pas, parce qu'un rêve ne vaut que par ceux qui
    suivent (étape 3 quater c, campagnes 22 à 30). On compare, sur les mêmes tables et graines :
    - les deux politiques fixes (rêve 0 et rêve 1, imposés ou dans les suites) : leur écart dit si une option domine ;
    - le bot libre à portefeuille, qui juge à chaque tour : son gain sur la meilleure politique fixe dit si juger rapporte.
    Régime : « disputé » si le gain du jugement est sûr et positif ; sinon « dominé par rêver » ou « dominé par
    défendre » si l'écart entre les deux politiques fixes est sûr ; sinon « indifférent »."""
    import json as _json
    from .stats import ecart_apparie
    cols = pc["colonnes"]
    vals = defaultdict(dict)
    for l in pc["lignes"]:
        r = dict(zip(cols, l))
        role = _role_bot(r["bot"], _json.loads(r.get("bot_params") or "{}"))
        if role:
            vals[(r["variante"], role)][f"{r['peuples']}#{r['graine']}"] = r["foret_pct"]
    out = {}
    for v in sorted({v for v, _ in vals}):
        roles = {role: x for (vv, role), x in vals.items() if vv == v}
        fixes = {k: x for k, x in roles.items() if k.endswith(("_0", "_1"))}
        zero = next((x for k, x in fixes.items() if k.endswith("_0")), None)
        un = next((x for k, x in fixes.items() if k.endswith("_1")), None)
        if zero is None or un is None:
            continue
        dom = ecart_apparie(zero, un)                           # rêve 1 − rêve 0
        meilleur = un if sum(un.values()) / len(un) >= sum(zero.values()) / len(zero) else zero
        res = {"reve1_moins_reve0": dom, "meilleur_fixe": "rêve 1" if meilleur is un else "rêve 0"}
        if "libre" in roles:
            g = ecart_apparie(meilleur, roles["libre"])         # libre − meilleur fixe
            res["gain_du_jugement"] = g
        g = res.get("gain_du_jugement")
        if g and g["verdict"] == "sûr" and g["ecart"] > 0:
            res["regime"] = "disputé (juger rapporte)"
        elif dom["verdict"] == "sûr":
            res["regime"] = "dominé par rêver" if dom["ecart"] > 0 else "dominé par défendre"
        else:
            res["regime"] = "indifférent"
        out[v] = res
    return out


def markdown_jugement(res, titre="Rêver ou défendre : test T3 complet, au niveau de la partie"):
    L = [f"## {titre}", "",
         "*Mêmes tables et graines ; écarts appariés en points de forêt. Rêve 1 − rêve 0 : une option domine-t-elle ? "
         "Libre − meilleur fixe : juger rapporte-t-il ? (étape 3 quater c, 14 oct.)*", "",
         "| Variante | Rêve 1 − rêve 0 | Meilleur fixe | Libre − meilleur fixe | Régime |", "|---|---|---|---|---|"]
    for v, r in res.items():
        d, g = r["reve1_moins_reve0"], r.get("gain_du_jugement") or {}
        fmt = lambda e: "–" if not e or e.get("ecart") is None else (  # noqa: E731
            f"{_f(e['ecart'], '+.1f')} [{_f(e['ic95'][0], '.1f')} ; {_f(e['ic95'][1], '.1f')}] ({e['verdict']})")
        nv = "l'ancre" if v == "defaut" else (v if len(v) < 40 else v[:37] + "…")
        L.append(f"| {nv} | {fmt(d)} | {r['meilleur_fixe']} | {fmt(g)} | {r['regime']} |")
    return "\n".join(L) + "\n"
