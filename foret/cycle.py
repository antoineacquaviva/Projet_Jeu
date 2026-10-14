"""Un cycle de recherche, de bout en bout, sans session Claude (plan vers la V1, étapes 0.9 et 0.10).

Un cycle est décrit par un plan (`cycles/<cycle>.json`) : la maquette de départ, l'espace des variables,
les budgets, les bots. Il enchaîne des **étapes**, chacune une campagne de foret.sim jouée par lots sur
GitHub (workflow `cycle.yml`), puis intégrée dans l'**état** du cycle (un dossier, publié sur la branche
`resultats` dans `cycles/<cycle>/`) :

1. `criblage` : plan de Morris sur toutes les variables, joué par trois gloutons (rêve 0, 0,5, 1 carte
   par tour ; à chaque taille de table, on garde le meilleur des trois, comme une table qui choisit son
   rythme). Rend l'influence de chaque variable sur chaque objectif, et retient les plus influentes.
2. `exploration` (générations 1, 2…) : MAP-Elites sur les variables retenues (les autres gardent la
   valeur de la maquette), avec une recherche au hasard à budget égal comme étalon. Arrêt quand le
   score de la carte stagne trois générations, ou au budget.
3. `confirmation` (manches 1 et 2) : les meilleures variantes de la carte et l'ancre (la maquette de
   départ), au bot fort, en course d'élimination ; écarts appariés à l'ancre.
4. `controle` : les finalistes et l'ancre avec le bot de contrôle.
5. `boucles` : garde-fou « aucune boucle gagnante » (décision C1 de l'auteur, 14 oct. ; foret/boucles.py),
   en lecture seule : la bibliothèque de stratégies répétées joue les finalistes et l'ancre sur les tables
   et les graines de la dernière manche de confirmation, ce qui l'apparie au bot fort. Les mesures sont
   rapportées et peuvent lever une alerte, mais n'entrent pas dans la qualité. `"boucles": false` dans le
   plan saute l'étape.
6. `rapport` : `rapport.md`, avec les alertes de conception.

Étape 3 quater (14 oct., décisions C2 à C4 de l'auteur ; projet/3-pilotage/choix-strategique.md), en lecture seule :
- chaque étape intégrée garde la **fréquence des mécanismes voulus** (T1, foret/mecanismes.py) ; le rapport la
  donne pour la dernière manche de confirmation, et lève une alerte sous 0,5 par partie ;
- dans la **dernière manche de confirmation**, le bot fort juge une décision sur dix en entier (réglage
  `juger_confirmation` du plan, 0,1 par défaut ; 0 pour ne pas juger) : le rapport donne le **profil de Δ et la
  lisibilité** des choix (T4, T5, foret/choix.py) ;
- l'étape `boucles` joue aussi les horaires et les réflexes de rêve (T2, T3 léger).

Qualité d'une variante (choix technique de Claude, plan vers la V1, sections 7 et 7 bis ; provisoire) :
le plus faible de deux scores, chacun pris à la taille de table où il est le plus faible :
- durée : 1 si au plus 20 % des parties finissent avant la mi-partie (bande verte de l'objectif 4,
  décision A9), 0 à 40 % (rouge), linéaire entre les deux ;
- difficulté : 1 si la forêt gardée est entre 50 et 80 % (le bot fort doit garder au plus 75 %, profil
  Jean-Marc ; plancher 40 %, garde-fou), 0 à 35 % et à 95 %, linéaire entre.
Les autres objectifs (menace, dilemme, peuples) sont lus à la confirmation et dans le rapport.

    python -m foret.cycle preparer --plan cycles/c1.json --etat etat/ --sortie campagne.json
    python -m foret.cycle integrer --plan cycles/c1.json --etat etat/ --synthese synthese.json
    python -m foret.cycle rapport --plan cycles/c1.json --etat etat/
"""
import argparse
import datetime
import itertools
import json
import math
import os
import random
from collections import defaultdict

from . import boucles as _boucles
from . import choix as _choix
from . import mecanismes as _mecanismes
from .maquette import charger, est_par_table, valeur_table
from .stats import ecart_apparie

PEUPLES = ("oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites")
TAILLES = (2, 3, 4, 5, 6)
GLOUTONS = [{"type": "glouton", "params": {"reves_par_tour": r}} for r in (0.0, 0.5, 1.0)]
# parties par table pour les gloutons : chaque taille de table pèse à peu près autant (15 à 20 parties)
TABLES_GLOUTON = [{"tailles": [2], "parties": 1}, {"tailles": [3], "parties": 1}, {"tailles": [4], "parties": 1},
                  {"tailles": [5], "parties": 3}, {"tailles": [6], "parties": 15}]
# coût estimé d'une partie, en secondes-cœur (sert à prévoir la fin d'une étape et à armer le réveil)
COUT = {"glouton": 0.1, "mc64": 150.0, "mc256": 3700.0}      # MC64R mesuré le 13 oct. : 228 s en moyenne (2 à 6 joueurs) ; MC 256 à portefeuille : ~3 700 s (Campagne 18, déduit : 282 549 s-cœur / 64 jeux de 4 bots, moins 3 bots de budget 64 à ~230 s)
MAX_PAR_TABLE = 4            # décision de l'auteur du 13 oct. : au plus 4 éléments propres au nombre de joueurs


# ------------------------------------------------------------------ variables et variantes
def niveau_defaut(var):
    return 0                  # par construction, le premier niveau est la valeur de la maquette de départ


def patch_de(genome, espace):
    """Morceau de maquette d'un génome (indices de niveaux, un par variable de l'espace)."""
    patch = {}
    for var, i in zip(espace, genome):
        if i == niveau_defaut(var):
            continue
        o = patch
        for k in var["chemin"][:-1]:
            o = o.setdefault(k, {})
        o[var["chemin"][-1]] = var["niveaux"][i]
    return patch


def variante_de(genome, espace):
    p = patch_de(genome, espace)
    return "defaut" if not p else "patch:" + json.dumps(p, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def nb_par_table(genome, espace):
    return sum(1 for var, i in zip(espace, genome) if est_par_table(var["niveaux"][i]))


def valide(genome, espace, maquette):
    if nb_par_table(genome, espace) > MAX_PAR_TABLE:
        return False
    try:
        charger(maquette, variante_de(genome, espace))
        return True
    except Exception:  # noqa: BLE001 - une combinaison invalide est simplement écartée
        return False


def au_hasard(espace, rng, libres=None):
    libres = range(len(espace)) if libres is None else libres
    g = [0] * len(espace)
    for i in libres:
        g[i] = rng.randrange(len(espace[i]["niveaux"]))
    return g


# ------------------------------------------------------------------ criblage de Morris
def trajectoires(espace, r, rng, maquette):
    """r trajectoires de Morris : un point de départ au hasard, puis chaque variable changée une fois, dans
    un ordre au hasard. Rend [[génome, …] × r] ; les points invalides sont retirés au sort à nouveau."""
    out = []
    essais = 0
    while len(out) < r and essais < 50 * r:
        essais += 1
        x = au_hasard(espace, rng)
        if not valide(x, espace, maquette):
            continue
        t = [list(x)]
        ok = True
        for i in rng.sample(range(len(espace)), len(espace)):
            y = list(t[-1])
            autres = [j for j in range(len(espace[i]["niveaux"])) if j != y[i]]
            rng.shuffle(autres)
            for j in autres:
                y[i] = j
                if valide(y, espace, maquette):
                    break
            else:
                ok = False
                break
            t.append(y)
        if ok:
            out.append(t)
    return out


def effets_morris(trajs, valeurs, espace, metriques):
    """Effets élémentaires : pour chaque pas d'une trajectoire, la variable changée et l'écart de chaque
    métrique. Rend {variable: {métrique: {"mu_etoile", "sigma", "n"}}}."""
    ee = defaultdict(lambda: defaultdict(list))
    for t in trajs:
        for a, b in zip(t, t[1:]):
            i = next(k for k in range(len(a)) if a[k] != b[k])
            va, vb = valeurs.get(variante_de(a, espace)), valeurs.get(variante_de(b, espace))
            if not va or not vb:
                continue
            for m in metriques:
                if va.get(m) is not None and vb.get(m) is not None:
                    ee[espace[i]["nom"]][m].append(vb[m] - va[m])
    out = {}
    for v, d in ee.items():
        out[v] = {}
        for m, xs in d.items():
            moy = sum(xs) / len(xs)
            out[v][m] = {"mu_etoile": round(sum(abs(x) for x in xs) / len(xs), 4),
                         "sigma": round((sum((x - moy) ** 2 for x in xs) / max(1, len(xs) - 1)) ** 0.5, 4),
                         "n": len(xs)}
    return out


# ------------------------------------------------------------------ qualité d'une variante
def _lin(x, bon_bas, bon_haut, zero_bas, zero_haut):
    if x is None:
        return 0.0
    if bon_bas <= x <= bon_haut:
        return 1.0
    if x < bon_bas:
        return max(0.0, (x - zero_bas) / (bon_bas - zero_bas)) if bon_bas > zero_bas else 0.0
    return max(0.0, (zero_haut - x) / (zero_haut - bon_haut)) if zero_haut > bon_haut else 0.0


def score_duree(precoces_pct):
    return _lin(precoces_pct, -1, 20, -1, 40)


def score_difficulte(foret_pct):
    return _lin(foret_pct, 50, 80, 35, 95)


def metriques_variantes(pc, meilleur_bot=True):
    """Depuis parties_compactes d'une synthèse : pour chaque variante, à chaque taille de table, la forêt,
    la part des fins avant la mi-partie et le tour de fin, du meilleur bot (le plus de forêt) si
    meilleur_bot, sinon de tous les bots ensemble ; puis les scores et la qualité."""
    col = {c: i for i, c in enumerate(pc["colonnes"])}
    acc = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))   # variante -> taille -> bot -> lignes
    for l in pc["lignes"]:
        n = len(l[col["peuples"]].split("+"))
        bot = (l[col["bot"]], l[col["bot_params"]]) if "bot_params" in col else l[col["bot"]]
        acc[l[col["variante"]]][n][bot if meilleur_bot else "tous"].append(l)
    out = {}
    for v, par_n in acc.items():
        tailles = {}
        for n, par_bot in par_n.items():
            stats = {}
            for b, ls in par_bot.items():
                fo = sum(x[col["foret_pct"]] for x in ls) / len(ls)
                tm = [x[col["tours_max"]] for x in ls]
                prec = 100 * sum(1 for x, t in zip(ls, tm) if x[col["fin"]] != "nuit" and t and x[col["tour"]] <= t / 2) / len(ls)
                stats[b] = {"foret": round(fo, 2), "precoces": round(prec, 1), "parties": len(ls),
                            "tour": round(sum(x[col["tour"]] for x in ls) / len(ls), 2),
                            "fins": _fins([x[col["fin"]] for x in ls])}
            best = max(stats.values(), key=lambda s: s["foret"])
            tailles[str(n)] = best
        sd = min(score_duree(t["precoces"]) for t in tailles.values())
        sf = min(score_difficulte(t["foret"]) for t in tailles.values())
        forets = [t["foret"] for t in tailles.values()]
        out[v] = {"tailles": tailles, "score_duree": round(sd, 3), "score_difficulte": round(sf, 3),
                  "qualite": round(min(sd, sf), 3),
                  "tour_moyen": round(sum(t["tour"] for t in tailles.values()) / len(tailles), 2),
                  "ecart_tailles": round(max(forets) - min(forets), 2),
                  "foret_min": round(min(forets), 2),
                  "precoces_max": max(t["precoces"] for t in tailles.values())}
    return out


def _fins(fs):
    n = len(fs)
    return {k: round(100 * fs.count(k) / n, 1) for k in sorted(set(fs))}


# ------------------------------------------------------------------ MAP-Elites
BORNES_TOUR = [2.5, 3.5, 4.5, 5.5, 6.5]          # tour moyen de fin : < 2,5 | 2,5-3,5 | … | ≥ 6,5
BORNES_ECART = [5, 10, 20, 35]                    # écart de forêt entre tailles de table, en points


def case_de(m):
    a = sum(1 for b in BORNES_TOUR if m["tour_moyen"] >= b)
    e = sum(1 for b in BORNES_ECART if m["ecart_tailles"] >= b)
    return f"{a}-{e}"


def integrer_archive(archive, genomes, mets, espace):
    """Ajoute à la carte (dict case -> élite) les génomes évalués ; garde le meilleur de chaque case."""
    ameliorees = 0
    for g in genomes:
        v = variante_de(g, espace)
        m = mets.get(v)
        if not m:
            continue
        c = case_de(m)
        e = archive.get(c)
        cle = (m["qualite"], m["foret_min"])
        if e is None or cle > (e["qualite"], e["foret_min"]):
            archive[c] = {"genome": g, "variante": v, **{k: m[k] for k in ("qualite", "score_duree", "score_difficulte",
                          "tour_moyen", "ecart_tailles", "foret_min", "precoces_max")}, "tailles": m["tailles"]}
            ameliorees += 1
    return ameliorees


def score_carte(archive):
    return round(sum(e["qualite"] for e in archive.values()), 3)


def enfants(archive, espace, libres, n, rng, maquette):
    """n génomes : une élite au hasard, croisée une fois sur trois avec une autre, puis mutée (chaque
    variable libre change avec la probabilité 2/k, au moins une). Sans élite : au hasard."""
    elites = [e["genome"] for e in archive.values()]
    out, essais = [], 0
    while len(out) < n and essais < 50 * n:
        essais += 1
        if not elites:
            g = au_hasard(espace, rng, libres)
        else:
            g = list(rng.choice(elites))
            if len(elites) > 1 and rng.random() < 1 / 3:
                h = rng.choice(elites)
                g = [g[i] if rng.random() < 0.5 else h[i] for i in range(len(g))]
            p = min(1.0, 2 / max(1, len(libres)))
            change = [i for i in libres if rng.random() < p] or [rng.choice(list(libres))]
            for i in change:
                autres = [j for j in range(len(espace[i]["niveaux"])) if j != g[i]]
                g[i] = rng.choice(autres)
        if valide(g, espace, maquette):
            out.append(g)
    return out


# ------------------------------------------------------------------ état d'un cycle
def lire_json(chemin, defaut=None):
    if not os.path.exists(chemin):
        return defaut
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def ecrire_json(chemin, obj):
    os.makedirs(os.path.dirname(chemin) or ".", exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def maintenant():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()


def etat_initial(plan):
    return {"cycle": plan["cycle"], "etape": "criblage", "gen": 0, "statut": "en cours",
            "historique": [], "debut": maintenant()}


def _campagne(plan, nom, blocs, description):
    return {"nom": f"{plan['cycle']}_{nom}", "maquette": plan["maquette"], "description": description,
            "blocs": blocs}


def _tables_echantillon(plan):
    """Tables du bot fort : un échantillon équilibré par peuple à chaque taille (plan, section 7 bis)."""
    if "tables_fort" in plan:
        return [tuple(t) for t in plan["tables_fort"]]
    rng = random.Random(plan.get("graine", 1))
    nb = {2: 6, 3: 4, 4: 3, 5: 2, 6: 1}
    out = []
    for n, k in nb.items():
        tables = list(itertools.combinations(PEUPLES, n))
        rng.shuffle(tables)
        out += tables[:k]
    return out


def estimer_duree_s(campagne, lots, coeurs=4):
    """Durée estimée d'une campagne sur GitHub (s) : coût des parties / (lots × cœurs), plus 4 min de frais."""
    from .sim import taches
    tt, _ = taches(campagne, campagne["maquette"])
    total = 0.0
    for _, _, _, bot, table, _ in tt:
        if bot["type"] == "mc":
            c = COUT["mc256"] if bot["params"].get("budget", 32) > 128 else COUT["mc64"]
            total += c * (1 + 0.6 * (len(table) - 2))           # une table de 6 coûte environ 3,4 fois un duo
        else:
            total += COUT["glouton"] * (1 + 0.3 * (len(table) - 2))
    return round(total / (lots * coeurs) + 240), len(tt)


def preparer(plan, etat_dir):
    """La campagne de l'étape en cours (ou None si l'étape n'en demande pas)."""
    e = lire_json(os.path.join(etat_dir, "etat.json")) or etat_initial(plan)
    rng = random.Random(f"{plan.get('graine', 1)}-{e['etape']}-{e['gen']}")
    espace, maq = plan["espace"], plan["maquette"]
    if e["etape"] == "criblage":
        trajs = trajectoires(espace, plan["criblage"]["trajectoires"], rng, maq)
        ecrire_json(os.path.join(etat_dir, "criblage_plan.json"), trajs)
        variantes = sorted({variante_de(g, espace) for t in trajs for g in t})
        return _campagne(plan, "criblage", [{"nom": "criblage", "variantes": variantes, "bots": plan.get("bots_glouton", GLOUTONS),
                                             "tables": plan.get("tables_glouton", TABLES_GLOUTON)}],
                         f"Cycle {plan['cycle']}, criblage de Morris : {len(trajs)} trajectoires, {len(variantes)} variantes, trois gloutons, 2 à 6 joueurs.")
    if e["etape"] == "exploration":
        cr = lire_json(os.path.join(etat_dir, "criblage.json"))
        libres = [i for i, v in enumerate(espace) if v["nom"] in cr["retenues"]]
        arch = lire_json(os.path.join(etat_dir, "archive.json"), {})
        hasard = lire_json(os.path.join(etat_dir, "archive_hasard.json"), {})
        n = plan["exploration"]["population"]
        gs = enfants(arch, espace, libres, n, rng, maq)
        hs = []
        while len(hs) < n:
            g = au_hasard(espace, rng, libres)
            if valide(g, espace, maq):
                hs.append(g)
        ecrire_json(os.path.join(etat_dir, "generation.json"), {"gen": e["gen"], "enfants": gs, "hasard": hs})
        variantes = sorted({variante_de(g, espace) for g in gs + hs})
        return _campagne(plan, f"exploration_g{e['gen']}", [{"nom": "exploration", "variantes": variantes,
                                                              "bots": plan.get("bots_glouton", GLOUTONS),
                                                              "tables": plan.get("tables_glouton", TABLES_GLOUTON)}],
                         f"Cycle {plan['cycle']}, exploration, génération {e['gen']} : {len(gs)} enfants et {len(hs)} au hasard (étalon).")
    if e["etape"] in ("confirmation", "controle"):
        cand = lire_json(os.path.join(etat_dir, f"{e['etape']}_candidats.json"))
        bot = plan["bot_fort"] if e["etape"] == "confirmation" else plan["bot_controle"]
        juger = plan.get("juger_confirmation", 0.1)
        if e["etape"] == "confirmation" and e["gen"] == len(plan["confirmation"]["parties"]) and juger \
                and bot.get("type") == "mc":              # T4 et T5 : la dernière manche juge une décision sur dix
            bot = {**bot, "params": {**bot.get("params", {}), "juger": juger}}
        parties = plan["confirmation"]["parties"][e["gen"] - 1] if e["etape"] == "confirmation" else plan["controle"]["parties"]
        tables = [{"liste": [list(t) for t in _tables_echantillon(plan)], "parties": parties}]
        graine0 = 1000 * e["gen"]                               # manches suivantes : graines nouvelles
        return _campagne(plan, f"{e['etape']}_m{e['gen']}", [{
            "nom": e["etape"], "variantes": ["defaut"] + [c for c in cand if c != "defaut"], "bots": [bot],
            "tables": tables, "reference": "defaut", "graine0": graine0}],
            f"Cycle {plan['cycle']}, {e['etape']} (manche {e['gen']}) : {len(cand)} variantes et l'ancre, {parties} parties par table.")
    if e["etape"] == "boucles":
        cand = lire_json(os.path.join(etat_dir, "controle_candidats.json"), [])
        manches = len(plan["confirmation"]["parties"])
        variantes = ["defaut"] + [c for c in cand if c != "defaut"]
        return _campagne(plan, "boucles", _boucles.blocs(variantes, _tables_echantillon(plan),
                                                         plan["confirmation"]["parties"][-1], graine0=1000 * manches),
                         f"Cycle {plan['cycle']}, garde-fou « aucune boucle gagnante » (C1, lecture seule) : "
                         f"{len(variantes)} variantes, bibliothèque de stratégies répétées, tables et graines de la manche {manches}.")
    return None


def _suivante(plan, e, **maj):
    e = dict(e, **maj)
    e["historique"].append({"etape": maj.get("etape"), "gen": maj.get("gen"), "date": maintenant()})
    return e


def integrer(plan, etat_dir, syn):
    """Intègre la synthèse de l'étape en cours dans l'état ; passe à l'étape suivante. Rend le nouvel état."""
    e = lire_json(os.path.join(etat_dir, "etat.json")) or etat_initial(plan)
    espace = plan["espace"]
    mets = metriques_variantes(syn["parties_compactes"])
    if e["etape"] == "criblage":
        trajs = lire_json(os.path.join(etat_dir, "criblage_plan.json"))
        metr = ["qualite", "score_duree", "score_difficulte", "tour_moyen", "ecart_tailles", "foret_min", "precoces_max"]
        eff = effets_morris(trajs, mets, espace, metr)
        rangs = sorted(eff, key=lambda v: -(eff[v].get("qualite", {}).get("mu_etoile", 0)
                                            + 0.5 * eff[v].get("score_duree", {}).get("mu_etoile", 0)
                                            + 0.5 * eff[v].get("score_difficulte", {}).get("mu_etoile", 0)))
        k = plan["criblage"].get("retenir", 10)
        retenues = rangs[:k]
        archive = {}
        integrer_archive(archive, [g for t in trajs for g in t], mets, espace)
        ecrire_json(os.path.join(etat_dir, "criblage.json"), {"effets": eff, "rangs": rangs, "retenues": retenues,
                                                              "variantes": mets})
        ecrire_json(os.path.join(etat_dir, "archive.json"), archive)
        ecrire_json(os.path.join(etat_dir, "suivi.json"), {"score_carte": [score_carte(archive)], "score_hasard": [0]})
        return _suivante(plan, e, etape="exploration", gen=1)
    if e["etape"] == "exploration":
        gen = lire_json(os.path.join(etat_dir, "generation.json"))
        arch = lire_json(os.path.join(etat_dir, "archive.json"), {})
        hasard = lire_json(os.path.join(etat_dir, "archive_hasard.json"), {})
        integrer_archive(arch, gen["enfants"], mets, espace)
        integrer_archive(hasard, gen["hasard"], mets, espace)
        suivi = lire_json(os.path.join(etat_dir, "suivi.json"), {"score_carte": [], "score_hasard": []})
        suivi["score_carte"].append(score_carte(arch))
        suivi["score_hasard"].append(score_carte(hasard))
        ecrire_json(os.path.join(etat_dir, "archive.json"), arch)
        ecrire_json(os.path.join(etat_dir, "archive_hasard.json"), hasard)
        ecrire_json(os.path.join(etat_dir, "suivi.json"), suivi)
        sc = suivi["score_carte"]
        stagne = len(sc) >= 4 and sc[-1] <= sc[-4] * 1.01
        if e["gen"] >= plan["exploration"]["generations_max"] or stagne:
            ecrire_json(os.path.join(etat_dir, "confirmation_candidats.json"), meilleures(arch, hasard, plan))
            return _suivante(plan, e, etape="confirmation", gen=1)
        return _suivante(plan, e, etape="exploration", gen=e["gen"] + 1)
    if e["etape"] == "confirmation":
        res = lire_json(os.path.join(etat_dir, "confirmation.json"), {})
        res[f"m{e['gen']}"] = {"metriques": mets, "apparie": syn.get("apparie"), "usage": _usage(syn),
                               "mecanismes": _mecanismes.frequences(syn), "choix": syn.get("choix")}
        ecrire_json(os.path.join(etat_dir, "confirmation.json"), res)
        # parties de la manche, pour apparier le garde-fou « aucune boucle gagnante » au bot fort
        ecrire_json(os.path.join(etat_dir, f"confirmation_parties_m{e['gen']}.json"), syn["parties_compactes"])
        manches = len(plan["confirmation"]["parties"])
        cand = lire_json(os.path.join(etat_dir, "confirmation_candidats.json"))
        garder = plan["confirmation"]["garder"][e["gen"] - 1]
        classes = sorted([c for c in cand if c in mets], key=lambda c: -mets[c]["qualite"])[:garder]
        if e["gen"] < manches:
            ecrire_json(os.path.join(etat_dir, "confirmation_candidats.json"), classes)
            return _suivante(plan, e, etape="confirmation", gen=e["gen"] + 1)
        ecrire_json(os.path.join(etat_dir, "controle_candidats.json"), classes[:plan["controle"]["finalistes"]])
        return _suivante(plan, e, etape="controle", gen=1)
    if e["etape"] == "controle":
        ecrire_json(os.path.join(etat_dir, "controle.json"), {"metriques": mets, "apparie": syn.get("apparie"),
                                                              "usage": _usage(syn),
                                                              "mecanismes": _mecanismes.frequences(syn)})
        if plan.get("boucles", True):
            return _suivante(plan, e, etape="boucles", gen=1)
        return _suivante(plan, e, etape="rapport", gen=0)
    if e["etape"] == "boucles":
        manches = len(plan["confirmation"]["parties"])
        fort = lire_json(os.path.join(etat_dir, f"confirmation_parties_m{manches}.json"))
        ecrire_json(os.path.join(etat_dir, "boucles.json"), _boucles.analyser(syn["parties_compactes"], fort))
        return _suivante(plan, e, etape="rapport", gen=0)
    return e


def _usage(syn):
    return {k: v.get("usage") for k, v in syn.get("detail", {}).items() if v.get("usage")}


def meilleures(arch, hasard, plan):
    """Candidats de la confirmation : les meilleures élites des deux cartes (MAP-Elites et étalon), sans
    doublon, une par case d'abord, par qualité décroissante."""
    tous = sorted(list(arch.values()) + list(hasard.values()), key=lambda x: (-x["qualite"], -x["foret_min"]))
    out = []
    for x in tous:
        if x["variante"] not in out:
            out.append(x["variante"])
        if len(out) >= plan["confirmation"]["candidats"]:
            break
    return out


# ------------------------------------------------------------------ rapport
def _nom_court(v, espace=None):
    if v == "defaut":
        return "ancre (maquette de départ)"
    try:
        p = json.loads(v[len("patch:"):])
    except ValueError:
        return v[:80]
    morceaux = []

    def plat(d, pre=""):
        for k, x in d.items():
            if isinstance(x, dict) and not est_par_table(x):
                plat(x, pre + k + ".")
            else:
                morceaux.append(f"{pre}{k}={json.dumps(x, ensure_ascii=False, separators=(',', ':'))}")
    plat(p)
    return ", ".join(morceaux)


def alertes(plan, etat_dir):
    """Règle automatique (plan vers la V1, section 6) : un objectif est hors de portée des paramètres si
    aucune variante explorée ne le sort du rouge (score nul) à toutes les tailles de table, ou si le criblage
    ne trouve aucune variable qui le fasse bouger nettement."""
    out = []
    cr = lire_json(os.path.join(etat_dir, "criblage.json"), {})
    vus = dict(cr.get("variantes", {}))
    for nom in ("archive.json", "archive_hasard.json"):
        for x in lire_json(os.path.join(etat_dir, nom), {}).values():
            vus.setdefault(x["variante"], x)
    for cle, lib in (("score_duree", "durée (fins avant la mi-partie)"), ("score_difficulte", "difficulté (forêt gardée)")):
        if vus and max(x.get(cle, 0) for x in vus.values()) <= 0:
            out.append(f"**{lib}** : aucune des {len(vus)} variantes essayées ne sort du rouge à toutes les tailles de table.")
        eff = cr.get("effets", {})
        if eff and max((d.get(cle, {}).get("mu_etoile", 0) for d in eff.values()), default=0) < 0.05:
            out.append(f"**{lib}** : aucune variable ne la fait bouger nettement au criblage (effet moyen < 0,05).")
    # par taille de table : une taille où aucune variante n'atteint un score de durée positif
    par_taille = defaultdict(float)
    for x in vus.values():
        for n, t in x.get("tailles", {}).items():
            par_taille[n] = max(par_taille[n], min(score_duree(t["precoces"]), score_difficulte(t["foret"])))
    for n, best in sorted(par_taille.items()):
        if best <= 0:
            out.append(f"**table de {n} joueurs** : aucune variante n'y est jouable dans les bandes (durée et difficulté).")
    out += _boucles.alertes(lire_json(os.path.join(etat_dir, "boucles.json"), {}))
    conf = lire_json(os.path.join(etat_dir, "confirmation.json"), {})
    if conf:
        derniere = conf[max(conf, key=lambda k: int(k[1:]))]
        if derniere.get("mecanismes"):
            out += _mecanismes.alertes({_nom_court(v): f for v, f in derniere["mecanismes"].items()})
    return out


def rapport(plan, etat_dir):
    e = lire_json(os.path.join(etat_dir, "etat.json"), {})
    cr = lire_json(os.path.join(etat_dir, "criblage.json"), {})
    suivi = lire_json(os.path.join(etat_dir, "suivi.json"), {})
    conf = lire_json(os.path.join(etat_dir, "confirmation.json"), {})
    ctl = lire_json(os.path.join(etat_dir, "controle.json"), {})
    L = [f"# Rapport automatique du cycle {plan['cycle']} ({plan['maquette']})", "",
         f"*Écrit par `foret/cycle.py` le {maintenant()} ; à analyser par Claude (étape g). Tout ce qui suit est mesuré "
         f"par les bots indiqués ; la qualité est provisoire (docstring de foret/cycle.py).*", ""]
    al = alertes(plan, etat_dir)
    L += ["## Alertes de conception", ""] + ([f"- {a}" for a in al] if al else ["- Aucune selon la règle automatique."]) + [""]
    if cr:
        L += ["## Criblage : influence des variables (μ*, effet élémentaire absolu moyen)", "",
              "| Variable | Qualité | Durée | Difficulté | Tour moyen | Écart entre tailles | Retenue |", "|---|---|---|---|---|---|---|"]
        for v in cr["rangs"]:
            d = cr["effets"][v]
            f = lambda m, k=2: f"{d.get(m, {}).get('mu_etoile', 0):.{k}f}".replace(".", ",")  # noqa: E731
            L.append(f"| {v} | {f('qualite')} | {f('score_duree')} | {f('score_difficulte')} | {f('tour_moyen')} | "
                     f"{f('ecart_tailles', 1)} | {'oui' if v in cr['retenues'] else ''} |")
        L.append("")
    if suivi:
        L += ["## Exploration", "", f"- Score de la carte (MAP-Elites) par génération : {suivi.get('score_carte')}",
              f"- Étalon au hasard, même budget : {suivi.get('score_hasard')}", ""]
    for nom, bloc in [(f"Confirmation, manche {k[1:]}", v) for k, v in sorted(conf.items())] + ([("Contrôle", ctl)] if ctl else []):
        mets = bloc["metriques"]
        L += [f"## {nom} (bot : {'fort' if nom.startswith('Confirmation') else 'contrôle'})", "",
              "| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |",
              "|---|---|---|---|---|---|"]
        ap = next(iter((bloc.get("apparie") or {}).values()), {}).get("ecarts", {})
        for v in sorted(mets, key=lambda x: -mets[x]["qualite"]):
            m = mets[v]
            fr = lambda x, f: format(x, f).replace(".", ",")  # noqa: E731
            fo = " / ".join(fr(m['tailles'][str(n)]['foret'], ".0f") if str(n) in m["tailles"] else "–" for n in TAILLES)
            e_ = ap.get(v)
            ea = (f"{fr(e_['ecart'], '+.1f')} ({e_['verdict']})" if e_ and e_.get("ecart") is not None else "–")
            L.append(f"| {_nom_court(v)} | {fr(m['qualite'], '.2f')} | {fo} | {fr(m['precoces_max'], '.0f')} % | "
                     f"{fr(m['tour_moyen'], '.1f')} | {ea} |")
        L.append("")
    if conf:
        derniere = conf[max(conf, key=lambda k: int(k[1:]))]
        if derniere.get("mecanismes"):
            L.append(_mecanismes.markdown({_nom_court(v): f for v, f in derniere["mecanismes"].items()},
                                          "Mécanismes voulus, dernière manche de confirmation (T1, décision C4)"))
        if derniere.get("choix"):
            L.append(_choix.markdown({_nom_court(v): c for v, c in derniere["choix"].items()}))
    bc = lire_json(os.path.join(etat_dir, "boucles.json"))
    if bc:
        L.append(_boucles.markdown({_nom_court(v): r for v, r in bc.items()}))
    L += ["## Étapes", ""] + [f"- {h['date']} : {h['etape']} {h.get('gen') or ''}" for h in e.get("historique", [])]
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------ ligne de commande
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action", choices=("preparer", "integrer", "rapport", "etat", "pipeline"))
    ap.add_argument("--plan", required=True)
    ap.add_argument("--etat", required=True, help="dossier d'état du cycle")
    ap.add_argument("--sortie", help="preparer : fichier de campagne ; rapport : fichier Markdown")
    ap.add_argument("--synthese", help="integrer : synthese.json de l'étape")
    ap.add_argument("--lots", type=int, default=20)
    a = ap.parse_args()
    plan = lire_json(a.plan)
    os.makedirs(a.etat, exist_ok=True)
    if a.action == "preparer":
        e = lire_json(os.path.join(a.etat, "etat.json")) or etat_initial(plan)
        ecrire_json(os.path.join(a.etat, "etat.json"), e)
        camp = preparer(plan, a.etat)
        if camp is None:
            print(json.dumps({"etape": e["etape"], "campagne": None}))
            return
        duree, n = estimer_duree_s(camp, a.lots)
        lots = max(1, min(a.lots, n))
        ecrire_json(a.sortie, camp)
        fin = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=duree)).replace(microsecond=0)
        e.update(statut="en cours", fin_estimee=fin.isoformat(), parties=n, maj=maintenant())
        ecrire_json(os.path.join(a.etat, "etat.json"), e)
        print(json.dumps({"etape": e["etape"], "gen": e["gen"], "campagne": camp["nom"], "parties": n,
                          "lots": lots, "duree_estimee_s": duree, "fin_estimee": fin.isoformat()}))
    elif a.action == "integrer":
        syn = lire_json(a.synthese)
        e = integrer(plan, a.etat, syn)
        e["maj"] = maintenant()
        if e["etape"] == "rapport":
            e["statut"] = "rapport prêt"
        ecrire_json(os.path.join(a.etat, "etat.json"), e)
        print(json.dumps({"etape": e["etape"], "gen": e["gen"], "statut": e["statut"]}))
    elif a.action == "rapport":
        texte = rapport(plan, a.etat)
        with open(a.sortie or os.path.join(a.etat, "rapport.md"), "w", encoding="utf-8") as f:
            f.write(texte)
    elif a.action == "pipeline":
        # resultats/etat_pipeline.json : quelques lignes que les passages de Claude lisent d'abord
        e = lire_json(os.path.join(a.etat, "etat.json"), {})
        ecrire_json(a.sortie, {"cycle": plan["cycle"], "etape": e.get("etape"), "gen": e.get("gen"),
                               "statut": e.get("statut"), "fin_estimee": e.get("fin_estimee"),
                               "rapport": f"cycles/{plan['cycle']}/rapport.md" if e.get("statut") == "rapport prêt" else None,
                               "maj": maintenant()})
    else:
        print(json.dumps(lire_json(os.path.join(a.etat, "etat.json")), ensure_ascii=False))


if __name__ == "__main__":
    main()
