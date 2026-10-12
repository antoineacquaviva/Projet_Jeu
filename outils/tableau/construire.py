"""Construit les données du tableau de bord à partir de resultats/batterie/rapport.json."""
import json
import sys

RAPPORT = sys.argv[1]
SORTIE = sys.argv[2]
r = json.load(open(RAPPORT, encoding="utf-8"))
C = r["configs"]
COLS = [("v1_g1", "v1", "rêve 1/tour"), ("v1_g0", "v1", "sans rêve"),
        ("v2_g1", "V2 proposée", "rêve 1/tour"), ("v2_g0", "V2 proposée", "sans rêve")]
NOMS = {"oiseaux": "Oiseaux", "mammiferes": "Mammifères", "reptiles": "Reptiles", "insectes": "Insectes",
        "humains": "Humains", "entites": "Entités"}


def f(x, d=1, suf=""):
    if x is None:
        return None
    s = f"{x:.{d}f}".replace(".", ",")
    return s + suf


def cell(txt, verdict=None, detail=None):
    return {"t": txt, "v": verdict, "d": detail}


def g(c, *k):
    for x in k:
        if c is None:
            return None
        c = c.get(x) if isinstance(c, dict) else None
    return c


rows = []


def ligne(groupe, id_, nom, etiquette, bande, fn, note=None, attente=False):
    cells = {}
    for key, _, _ in COLS:
        c = C[key]
        cells[key] = cell("bot fort", "attente") if attente else fn(c)
    rows.append({"groupe": groupe, "id": id_, "nom": nom, "etiquette": etiquette, "bande": bande,
                 "cells": cells, "note": note})


# ------------------------------------------------------------ niveau 1
G1 = "Jouabilité (niveau 1)"
ligne(G1, "robustesse", "Robustesse", "mesure", "vert : 0 plantage, 0 incohérence",
      lambda c: cell((lambda n: f"0 plantage · {'aucune incohérence' if n == 0 else f'{n} incohérences'} en {c['parties']:,} parties".replace(",", "\u202f"))(sum(g(c,'robustesse','incoherences').values())),
                     g(c, "robustesse", "verdict"),
                     ", ".join(f"{k} {v}" for k, v in g(c, "robustesse", "incoherences").items())),
      note="Décision B4 : « voir_trahi » (un rêve change la tuile vue par un oiseau) et « barrage_contourne » en v1 (la Machine abat en chemin) sont des cas permis, comptés à part. Le barrage contourné reste une incohérence pour le témoin v0.")
ligne(G1, "lacunes", "Lacunes", "mesure", "lecture",
      lambda c: cell(f"{f(g(c,'lacunes','par_partie'))} par partie", None,
                     ", ".join(f"{k} {f(v,2)}" for k, v in list(g(c, 'lacunes', 'principales').items())[:3])))
ligne(G1, "charge", "Charge de règles", "mesure", "lecture : départages par partie",
      lambda c: cell(f"{f(g(c,'charge','par_partie'))} par partie"))
ligne(G1, "duree", "Durée estimée", "indice", "jamais un filtre",
      lambda c: cell(f"{round(g(c,'duree','minutes'))} min", None,
                     f"{f(g(c,'duree','tours'))} tours ; 9 parties sur 10 sous {round(g(c,'duree','minutes_q90'))} min"),
      note="Modèle de temps à recaler sur les premiers tests humains : 15 s par décision, 60 s d'ouverture du conseil, 20 s par ordre du Méchant.")
ligne(G1, "attente", "Attente · densité", "indice", "lecture",
      lambda c: cell(f"{round(g(c,'attente','attente_pct'))} % · {round(g(c,'attente','decisions_par_heure'))} déc./h"))
ligne(G1, "forcees", "Choix forcés", "indice", "lecture",
      lambda c: cell(f"{f(g(c,'forcees','total_pct'))} %", None,
                     f"choix d'action : {f(g(c,'forcees','par_type','action'))} % forcés"))

# ------------------------------------------------------------ objectif 1
G = "Objectif 1 · la menace est lisible mais jamais résolue"
ligne(G, "concentration", "Concentration de la menace", "mesure", "vert 50–80 % · rouge < 35 ou > 90",
      lambda c: cell(f"{f(g(c,'concentration','valeur'))} %", g(c, "concentration", "verdict")))
ligne(G, "surprise", "Surprise", "mesure", "vert 20–45 % · rouge < 10 ou > 60",
      lambda c: cell(f"{f(g(c,'surprise','valeur'))} %", g(c, "surprise", "verdict"),
                     f"Machine désignée : {f(g(c,'surprise','machines'))} %" if g(c, 'surprise', 'machines') else None))
ligne(G, "tape_taupe", "Tape-taupe", "indice", "vert ≥ 10 points", None, attente=True)

# ------------------------------------------------------------ objectif 2
G = "Objectif 2 · défendre ou rêver reste un dilemme"


def reve(c):
    rv = c.get("reve_fixe")
    if not rv:
        return cell("même expérience que la colonne « rêve »", None)
    m = rv["meilleur"]
    return cell(f"meilleur : {f(m, 2)} carte/tour (le maximum)" if m == rv["maximum_teste"] else f"meilleur : {f(m,2)}",
                rv["verdict"], "forêt : " + " · ".join(f"{f(float(k),2)} → {f(v)} %" for k, v in rv["par_taux"].items()))


ligne(G, "reve_fixe", "Meilleur taux de rêve fixe", "indice", "rouge : 0 ou le maximum", reve)
ligne(G, "gain_libre", "Gain du bot libre", "indice", "vert ≥ 5 %", None, attente=True)
ligne(G, "dilemmes", "Dilemmes", "indice", "vert ≥ 30 %", None, attente=True)

# ------------------------------------------------------------ objectif 3
G = "Objectif 3 · chaque peuple compte, aucun ne suffit"


def shap(c):
    rp = g(c, "shapley", "rapports")
    lo, hi = min(rp, key=rp.get), max(rp, key=rp.get)
    return cell(f"{f(rp[lo],2)} ({NOMS[lo]}) à {f(rp[hi],2)} ({NOMS[hi]})", g(c, "shapley", "verdict"))


ligne(G, "shapley", "Shapley, rapport à la moyenne", "mesure", "vert 0,7–1,3 · rouge hors 0,5–1,5", shap)
ligne(G, "synergies", "Synergies : le duo bat son meilleur seul", "mesure", "vert ≥ 12 sur 15 · rouge < 8",
      lambda c: cell(f"{g(c,'synergies','valeur')} duos sur 15", g(c, "synergies", "verdict"),
                     (lambda n: f"tétraèdre : {n} duo{'s' if n > 1 else ''} complet{'s' if n > 1 else ''} sur 3 dans le premier tiers")(g(c,'synergies','tetraedre','complets_dans_le_premier_tiers'))),
      note="Décision B2 : le jeu s'adapte au nombre de joueurs, la synergie additive de la phase 0 était négative par construction. Un duo compte s'il garde plus de forêt que son meilleur peuple joué seul.")
ligne(G, "pire_table", "Pire table / meilleure", "mesure", "vert ≥ 70 % · rouge < 50",
      lambda c: cell(f"{f(g(c,'pire_table','valeur'))} %", g(c, "pire_table", "verdict"),
                     f"pire duo : {' + '.join(NOMS[p] for p in g(c,'pire_table','duos','pire')[0])} ({f(g(c,'pire_table','duos','pire')[1])} %)"))


def spect(c):
    sp = c.get("spectateur", {})
    rp = sp.get("rapports", {})
    if not rp:
        return cell("—")
    lo = min(rp, key=lambda k: rp[k] if rp[k] is not None else 9)
    pts = sp.get("impact_points", {})
    return cell(f"{NOMS[lo]} : {f(rp[lo],2)}", sp.get("verdict"),
                f"perte quand ce peuple ne fait rien : {f(pts[lo])} points")


ligne(G, "spectateur", "Aucun spectateur", "indice", "vert ≥ 0,5 · rouge < 0,25", spect,
      note="Décision B3 : le siège est tenu par un bot qui ne fait rien. Sans rêve, les insectes joués par le glouton font perdre de la forêt : le siège vide fait mieux. Défaut du bot, à revoir en phase 2.")


def coord(c):
    co = c.get("coordination")
    if not co:
        return cell("—")
    a = co.get("annonce", {})
    return cell("non mesurable", "nonmes", f"aucun signe {f(a.get('aucun_signe'))} % · tout dire {f(a.get('tout_dire'))} %")


ligne(G, "coordination", "Coordination", "indice", "vert 40–80 % de l'écart", coord,
      note="Le glouton ne se sert pas des signes : « aucun signe » et « tout dire » donnent le même résultat. La mesure attend le bot fort.")
ligne(G, "chef", "Chef unique", "indice", "vert 5–20 %", None, attente=True)

# ------------------------------------------------------------ objectif 4
G = "Objectif 4 · la bataille se joue jusqu'au dénouement"
ligne(G, "predictibilite", "Partie jouée d'avance (tour 2)", "mesure", "vert < 65 % · rouge > 80",
      lambda c: cell(f"{f(g(c,'predictibilite','valeur'))} %", g(c, "predictibilite", "verdict"),
                     f"AUC {f(g(c,'predictibilite','auc'),2)}"))
ligne(G, "incertitude", "Incertitude au dernier tiers", "mesure", "vert ≥ 0,5 · rouge < 0,25",
      lambda c: cell(f(g(c, 'incertitude', 'valeur'), 2), g(c, "incertitude", "verdict"),
                     f"parties déjà finies : {f(g(c,'incertitude','finies_avant_tour_5_pct'))} %"))
ligne(G, "fins_precoces", "Fins avant la mi-partie", "mesure", "vert ≤ 20 % · rouge > 40",
      lambda c: cell(f"{f(g(c,'fins_precoces','valeur'))} %", g(c, "fins_precoces", "verdict")))


def menace(c):
    m = c["menace_croissante"]
    if m["valeur"] is None:
        return cell("aucune partie au tour 5", "nonmes")
    return cell(f(m["valeur"], 2), m["verdict"],
                f"ordres réussis {f(m['ordres_reussis'],2)} · Machines en marche {f(m['machines_actives'],2)}")


ligne(G, "menace_croissante", "Menace croissante", "mesure", "vert ≥ 1 · rouge < 0,67", menace)

# ------------------------------------------------------------ garde-fou et lecture
G = "Garde-fou · aucun effort n'est vain"
ligne(G, "plancher", "Plancher (pire dixième)", "mesure", "vert ≥ 40 % · rouge < 25",
      lambda c: cell(f"{f(g(c,'plancher','valeur'))} %", g(c, "plancher", "verdict")))
ligne(G, "echelle_bots", "Échelle des bots", "mesure", "chaque marche significative",
      lambda c: cell(f"aléatoire {f(g(c,'echelle_bots','aleatoire'))} → glouton {f(g(c,'echelle_bots','glouton'))} %",
                     g(c, "echelle_bots", "verdict")))
G = "Lecture"
FINS = {"sommeil": "sommeil", "reveil": "réveil", "nuit": "nuit", "silence": "silence"}
ligne(G, "foret", "Forêt restante (duos et trios)", "mesure", "résultat",
      lambda c: cell(f"{f(c['foret_pct'])} %", None, f"± {f(c['foret_ic95'],2)} (95 %)"))
ligne(G, "fins", "Fins", "indice", "lecture",
      lambda c: cell(" · ".join(f"{FINS.get(k,k)} {round(v)} %" for k, v in c["fins"].items() if k != "tour_moyen" and v >= 0.5),
                     None, f"tour moyen de fin : {f(c['fins']['tour_moyen'])}"))
ligne(G, "apprentissage", "Le Méchant apprend cette équipe", "indice", "lecture",
      lambda c: cell(f"{f(g(c,'apprentissage','propre_a_l_equipe'),2)} case", None,
                     f"cases changées depuis le départ : {f(g(c,'apprentissage','depuis_le_depart'))}"),
      note="Non validée : le témoin sans apprentissage donne la même valeur.")

# ------------------------------------------------------------ témoins
EXPL = {
    ("apprentissage", "v1_sans_apprentissage", "« propre à l'équipe » plus bas qu'avec apprentissage"):
        "0,17 case avec ou sans apprentissage : avec le glouton, les pistes finales ne dépendent pas de l'équipe. Partie de la mesure non validée.",
    ("menace_croissante", "v1_essoufflement", None):
        "0,74 contre 0,87 pour la v1 : la mesure va dans le bon sens mais reste orange. Les parties où toutes les Machines tombent finissent par le silence avant le tour 5 et sortent de la mesure.",
    ("shapley", "v2_hanter_illimite", None):
        "Rouge, mais à cause des reptiles (1,61), déjà rouges sans le témoin. Les entités montent de 0,73 à 1,29 : le glouton n'utilise pas Hanter à chaque étape.",
    ("shapley", "v1_mammiferes_sans_pouvoir", None):
        "Les mammifères montent de 0,83 à 1,02. Le glouton joue Tenir dans moins de 1 % des parties, et Renverser l'entraîne à saboter, ce qui lui coûte de la forêt (seuls : 52 % avec pouvoirs, 69 % sans). Défaut du bot.",
    ("pire_table", "v1_hanter_illimite", None):
        "72 %, vert : le glouton ne profite pas assez de Hanter sans limite pour creuser l'écart entre tables.",
}
NOMS_T = {
    "v1_une_tactique": "v1 · une seule tactique", "v2_une_tactique": "V2 · une seule tactique",
    "v1_des_fixes": "v1 · dés truqués", "v2_des_fixes": "V2 · dés truqués",
    "v1_sans_apprentissage": "v1 · Méchant qui n'apprend plus", "v2_sans_apprentissage": "V2 · Méchant qui n'apprend plus",
    "v1_essoufflement": "v1 · Méchant qui s'essouffle", "v2_essoufflement": "V2 · Méchant qui s'essouffle",
    "v1_assaut": "v1 · cinq Machines d'emblée", "v1_hanter_illimite": "v1 · Hanter sans limite",
    "v2_hanter_illimite": "V2 · Hanter sans limite", "v1_mammiferes_sans_pouvoir": "v1 · mammifères sans pouvoir",
    "v1_spectateur": "v1 · humains spectateurs", "v1_reves_illimites": "v1 · rêves sans limite (glouton qui rêve 3)",
    "v1_barrage_v0": "v1 · barrage contourné (v0)", "v1_sans_pouvoirs": "v1 · aucun pouvoir",
}
NOMS_M = {row["id"]: row["nom"] for row in rows}
NOMS_M.update({"tactiques": "Tactiques", "couverture": "Couverture", "fins": "Fins"})
temoins = []
for t in r["temoins"]:
    e = EXPL.get((t["mesure"], t["temoin"], t["attendu"])) or EXPL.get((t["mesure"], t["temoin"], None))
    temoins.append({"mesure": NOMS_M.get(t["mesure"], t["mesure"]), "temoin": NOMS_T.get(t["temoin"], t["temoin"]),
                    "attendu": t["attendu"], "ok": t["ok"], "explication": None if t["ok"] else e})

# ------------------------------------------------------------ graphiques
reves = {k: [[float(x), y] for x, y in C[k]["reve_fixe"]["par_taux"].items()] for k in ("v1_g1", "v2_g1")}
tailles = {}
for key, _, _ in COLS:
    ve = C[key]["valeurs_equipes"]
    by = {}
    for eq, v in ve.items():
        by.setdefault(len(eq.split("/")), []).append(v)
    pts = [[0, C[key]["shapley"]["v_vide"]]] + [[k, round(sum(v) / len(v), 1)] for k, v in sorted(by.items())]
    tailles[key] = pts
shapley = {key: {p: [C[key]["shapley"]["rapports"][p]] + C[key]["shapley"]["ic95"][p] for p in NOMS} for key, _, _ in COLS}
rares = {}
for key, _, _ in COLS:
    cov = C[key]["couverture"]
    rares[key] = [[k, v] for k, v in cov.items() if v < 5]

data = {"date": r["date"], "moteur": r["moteur"], "parties": sum(c["parties_jouees"] for c in C.values()),
        "cols": [{"key": k, "maquette": m, "bot": b} for k, m, b in COLS], "rows": rows, "temoins": temoins,
        "reves": reves, "voies": C["v2_g1"]["reve_fixe"].get("par_voie"), "tailles": tailles,
        "shapley": shapley, "peuples": NOMS, "rares": rares,
        "solo": {key: C[key]["synergies"]["solo"] for key, _, _ in COLS}}
json.dump(data, open(SORTIE, "w", encoding="utf-8"), ensure_ascii=False)
print("ok", len(rows), "lignes", len(temoins), "témoins", sum(1 for t in temoins if t["ok"]), "réussis")
