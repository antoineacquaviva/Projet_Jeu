"""Garde-fou « aucune boucle gagnante » : bibliothèque de stratégies répétées, campagne, analyse.

Décision C1 de l'auteur (14 oct. 2026) ; spécification : projet/3-pilotage/garde-fou-boucles-gagnantes.md.
Une action, une suite d'actions répétée, ou une convention de table appliquée sans lire le jeu, ne doit
pas constituer une stratégie gagnante. **Lecture seule** tant que l'auteur n'a pas confirmé les bandes :
les mesures sont calculées et rapportées, avec la couleur qu'elles auraient, mais elles ne jugent pas et
n'entrent pas dans le score de la recherche.

La bibliothèque (bibliotheque(n)) est jouée par le bot « repete » (foret/bots/repete.py), au coût d'un
glouton. Les stratégies collectives sont des tables mixtes ({"type": "table", "params": {"sieges": […]}}),
une par taille de table. Les références sont appariées (mêmes tables, mêmes graines) :
- le réflexe : les trois gloutons du cycle (rêve 0, 0,5, 1), le meilleur à chaque taille ;
- le bot fort : les parties d'une autre campagne jouée sur les mêmes tables et les mêmes graines
  (confirmation d'un cycle, ou campagne de calibration), le plus fort de ses bots.

    python -m foret.boucles campagne --maquette v0.4 --tables-de campagnes/calibration_v04.json \\
        --sortie campagnes/boucles_v04.json
    python -m foret.boucles analyser --boucles synthese.json --fort synthese_fort.json --sortie boucles.md

Mesures (registre foret/mesures.py, toutes descriptives pour l'instant) :
[mesure:boucle_gagnante] [mesure:convention_table] [mesure:action_suffit] [mesure:echelle_lecture]
"""
import argparse
import gzip
import itertools
import json
from collections import defaultdict

from .stats import ecart_apparie, moyenne

GLOUTONS = [{"type": "glouton", "params": {"reves_par_tour": r}} for r in (0.0, 0.5, 1.0)]
# Étape 3 quater (14 oct., décisions C2 et C3 ; projet/3-pilotage/choix-strategique.md) :
# - horaires (principe 7 : « l'horloge n'est pas une situation ») : rêver seulement à partir du tour k, ou
#   jusqu'au tour k ; ce sont des stratégies répétées, comptées parmi les boucles ;
# - réflexes de rêve (test T3 léger) : le même glouton, qui ne rêve que si une condition simple est vraie
#   (foret/choix.py, CONDITIONS_REVE). Ils lisent la situation : ce ne sont pas des boucles. Si l'un bat la
#   meilleure politique d'horloge (taux fixes et horaires), juger rapporte, même pour un joueur moyen.
HORAIRES = [{"type": "glouton", "params": {"reves_par_tour": r, "tours_reve": t}}
            for r in (0.5, 1.0) for t in [[k, 99] for k in range(2, 6)] + [[1, k] for k in range(2, 6)]]
JUGEMENTS = [{"type": "glouton", "params": {"reves_par_tour": r, "reve_si": c}}
             for r, c in [(1.0, ["esprit_proche"]), (2.0, ["esprit_proche"]), (1.0, ["calme"]), (1.0, ["hors_portee"]),
                          (1.0, ["presage_esprit"]), (1.0, ["esprit_proche", "presage_esprit"]),
                          (1.0, ["calme", "esprit_proche"])]]


def _references():
    """Les politiques de référence jouées avec la bibliothèque : gloutons à taux fixe, horaires, réflexes de rêve."""
    return GLOUTONS + HORAIRES + JUGEMENTS
BANDES = {"vert": 10.0, "rouge": 3.0}     # points de forêt (bandes proposées, décision C1 : provisoires)
ACTION_PROCHE = 3.0                       # « une action ne suffit pas » : rouge si X partout est à moins de 3 points
ACTION_PART = 0.90                        # … vert si X partout garde au plus 90 % de la forêt du bot fort
MARCHE_VERTE, MARCHE_ROUGE = 3.0, 1.0     # échelle de la lecture : chaque marche, en points

ORDRES = {"saboter": ["saboter", "barrer", "soutenir"], "barrer": ["barrer", "soutenir", "saboter"],
          "soutenir": ["soutenir", "barrer", "saboter"]}


def _r(nom, famille, ouverte=True, **script):
    return {"type": "repete", "params": {"nom": nom, "famille": famille, "ouverte": ouverte, **script}}


def _motifs(longueur_max=3, valeurs=(0, 1, 2)):
    """Motifs primitifs (pas la répétition d'un motif plus court) de longueur 1 à longueur_max."""
    out = []
    for n in range(1, longueur_max + 1):
        for m in itertools.product(valeurs, repeat=n):
            if any(n % d == 0 and m == m[:d] * (n // d) for d in range(1, n)):
                continue
            out.append(list(m))
    return out


def _txt(m):
    return "".join(str(x) for x in m)


def bibliotheque(n):
    """Stratégies répétées pour une table de n joueurs : liste de spécifications de bots.
    Individuelles (le même script à tous les sièges : c'est aussi le « miroir ») et collectives."""
    out = []
    # 1. Une action partout (repli fixe), deux règles de zone, deux moitiés, avec ou sans rêve
    for a, ordre in ORDRES.items():
        for z in ("depart", "fixe"):
            for mode in ("machines", "plateau"):
                for rv in ([0], [1]):
                    out.append(_r(f"action:{a}|zone:{z}|mode:{mode}|reves:{_txt(rv)}", "une_action",
                                  actions=ordre, zone=z, mode=mode, reves=rv))
    # 2. Toujours la même moitié de carte (haut ou bas)
    for mode in ("haut", "bas"):
        for rv in ([0], [1]):
            out.append(_r(f"moitie:{mode}|reves:{_txt(rv)}", "moitie", mode=mode, reves=rv))
    # 3. Rythme de rêve : tous les motifs primitifs de longueur 1 à 3, rêves en début ou en fin de tour
    for m in _motifs():
        for pos in ("debut", "fin"):
            out.append(_r(f"rythme:{_txt(m)}|{pos}", "rythme", reves=m, reve_etapes=pos))
    # 4. Motif sur les trois étapes (étapes laissées vides)
    for et in ([1, 0, 1], [0, 1, 1], [1, 1, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]):
        for rv in ([0], [1]):
            out.append(_r(f"etapes:{_txt(et)}|reves:{_txt(rv)}", "etapes", etapes=et, reves=rv))
    # 5. Exploiter le Méchant (Tromper toujours ou jamais) et la voie du rêve
    for t in ("toujours", "jamais"):
        for rv in ([0], [1]):
            out.append(_r(f"tromper:{t}|reves:{_txt(rv)}", "mechant", tromper=t, reves=rv))
    for v in ("reveil", "alterne"):
        for rv in ([1], [2]):
            out.append(_r(f"voie:{v}|reves:{_txt(rv)}", "mechant", voie=v, reves=rv))
    # 6. Réflexes (lisent la menace du moment : pas des boucles ouvertes)
    for a in ("saboter", "barrer"):
        for rv in ([0], [1], [0, 1]):
            out.append(_r(f"reflexe:{a}|reves:{_txt(rv)}", "reflexe", ouverte=False,
                          actions=ORDRES[a], zone="menace", presence="menace", reves=rv))
    # 7. Conventions de table (collectives)
    out += conventions(n)
    return out


def _table(nom, sieges, ouverte=True):
    return {"type": "table", "params": {"nom": nom, "famille": "convention", "ouverte": ouverte,
                                         "collective": True, "sieges": sieges}}


def conventions(n):
    """Conventions de table décidées avant la partie, appliquées sans lire le jeu (n sièges)."""
    def s(**kw):
        return {"type": "repete", "params": kw}
    out = []
    for rv in (2, 1):            # un seul rêveur, les autres défendent
        out.append(_table(f"convention:reveur_unique|reves:{rv}", [s(reves=[rv])] + [s(reves=[0])] * (n - 1)))
    out.append(_table("convention:saboteur_unique",
                      [s(actions=ORDRES["saboter"], aller="cible")] + [s(actions=ORDRES["barrer"])] * (n - 1)))
    for rv in (1, 2):            # relais : le rêveur tourne d'un siège à chaque tour
        motif = [rv] + [0] * (n - 1)
        out.append(_r(f"convention:relais|reves:{_txt(motif)}", "convention", reves=motif, relais=True))
        out[-1]["params"]["collective"] = True
    for z in ("depart", "fixe"):     # alliance perpétuelle : tous vers la même zone, saboter ensemble
        for rv in ([0], [1]) if z == "depart" else ([0],):
            out.append(_r(f"convention:alliance|zone:{z}|reves:{_txt(rv)}", "convention",
                          aller="cible", zone=z, actions=ORDRES["saboter"], reves=rv))
            out[-1]["params"]["collective"] = True
    for rv in ([0], [1]):        # barrage et sabotage couplés, dans la même zone
        a = s(actions=ORDRES["barrer"], aller="cible", reves=rv)
        b = s(actions=ORDRES["saboter"], aller="cible", reves=rv)
        out.append(_table(f"convention:barrage_sabotage|reves:{_txt(rv)}", [a, b] * 3))
    return out


# ------------------------------------------------------------------ campagne
def tables_de(campagne):
    """Tables (listes de peuples) et parties d'une campagne existante, pour l'apparier."""
    out, parties = [], None
    for b in campagne["blocs"]:
        for t in b["tables"]:
            if "liste" in t:
                out += [tuple(x) for x in t["liste"]]
                parties = t.get("parties", b.get("parties", parties))
    return sorted(set(out), key=lambda t: (len(t), t)), parties, campagne["blocs"][0].get("graine0", 0)


def blocs(variantes, tables, parties, graine0=0, references=True):
    """Un bloc par taille de table : la bibliothèque de cette taille, et les références (gloutons à taux fixe,
    horaires, réflexes de rêve)."""
    par_n = defaultdict(list)
    for t in tables:
        par_n[len(t)].append(list(t))
    out = []
    for n in sorted(par_n):
        out.append({"nom": f"boucles_n{n}", "variantes": list(variantes),
                    "bots": bibliotheque(n) + (_references() if references else []),
                    "tables": [{"liste": par_n[n], "parties": parties}], "graine0": graine0})
    return out


def campagne(nom, maquette, variantes, tables, parties, graine0=0, description=""):
    return {"nom": nom, "maquette": maquette, "description": description,
            "blocs": blocs(variantes, tables, parties, graine0)}


# ------------------------------------------------------------------ analyse
def lignes(pc):
    """parties_compactes → liste de dicts."""
    cols = pc["colonnes"]
    return [dict(zip(cols, l)) for l in pc["lignes"]]


def etiquette(ligne):
    """Nom lisible d'un bot (stratégie de la bibliothèque, glouton ou bot fort) et sa famille."""
    p = json.loads(ligne.get("bot_params") or "{}")
    if ligne["bot"] in ("repete", "table") and p.get("nom"):
        return p["nom"], p.get("famille", ""), bool(p.get("ouverte", True)), bool(p.get("collective"))
    if ligne["bot"] == "glouton" and p.get("tours_reve"):
        a, b = p["tours_reve"]
        return f"horaire:reves={p.get('reves_par_tour', 0)}|tours={a}-{b if b < 99 else 'fin'}", "horaire", False, False
    if ligne["bot"] == "glouton" and p.get("reve_si"):
        return f"jugement:si={'+'.join(p['reve_si'])}|reves={p.get('reves_par_tour', 0)}", "jugement", False, False
    if ligne["bot"] == "glouton":
        return f"glouton:reves={p.get('reves_par_tour', 0)}", "glouton", False, False
    if ligne["bot"] == "mc":
        if p.get("portefeuille"):
            d = f"MC{p.get('budget')}P"
        else:
            r = (p.get("politique") or {}).get("params", {}).get("reves_par_tour")
            d = f"MC{p.get('budget')}" + (f"R{r:g}" if r is not None else "")
        if p.get("annonces"):
            d += "A"
        if p.get("savoir", "soi") != "soi":           # le chef unique voit tout : ce n'est pas un joueur de référence
            return f"chef:{d}", "chef", False, False
        return "fort:" + d, "fort", False, False
    return ligne["bot"] + ":" + json.dumps(p, sort_keys=True)[:40], "autre", False, False


def _cle(l):
    return f"{l['peuples']}#{l['graine']}"


def _bande(x, vert=BANDES["vert"], rouge=BANDES["rouge"]):
    if x is None:
        return "–"
    return "vert" if x >= vert else ("rouge" if x < rouge else "orange")


def analyser(pc_boucles, pc_fort=None):
    """Mesures du garde-fou par variante. pc_* : parties_compactes. Le bot fort de référence est, pour
    chaque variante, le plus fort (forêt moyenne) des bots MC de pc_fort ; sans pc_fort, les mesures
    qui le demandent valent None. Rend {variante: {...}} (voir docs/mesures.md, « Garde-fou »)."""
    data = defaultdict(lambda: defaultdict(dict))          # variante -> bot -> clé -> forêt
    meta = {}
    for src in (pc_boucles, pc_fort):
        if not src:
            continue
        for l in lignes(src):
            nom, fam, ouv, coll = etiquette(l)
            if src is pc_fort and fam not in ("fort", "chef"):
                continue
            data[l["variante"]][nom][_cle(l)] = l["foret_pct"]
            meta[nom] = {"famille": fam, "ouverte": ouv, "collective": coll}
    jouees = {l["variante"] for l in lignes(pc_boucles)}
    out = {}
    for v, bots in data.items():
        if v not in jouees:
            continue
        out[v] = _analyser_variante(bots, meta, _choisir_fort(bots, meta))
    return out


def _choisir_fort(bots, meta):
    """Le bot fort de référence : parmi les bots MC qui couvrent (presque) toutes les parties de la
    bibliothèque, le plus fort en forêt moyenne sur ces parties."""
    cles = set()
    for b, x in bots.items():
        if meta[b]["famille"] not in ("fort", "glouton", "autre", "chef"):
            cles |= set(x)
    forts = {b: x for b, x in bots.items() if meta[b]["famille"] == "fort"}
    if not forts or not cles:
        return None
    couv = {b: len(cles & set(x)) for b, x in forts.items()}
    m = max(couv.values())
    cands = [b for b in forts if couv[b] >= 0.9 * m]
    return max(cands, key=lambda b: moyenne(forts[b][k] for k in cles & set(forts[b])))


def _taille(cle):
    return len(cle.split("#")[0].split("+"))


def _par_taille(vals):
    d = defaultdict(dict)
    for k, x in vals.items():
        d[_taille(k)][k] = x
    return d


def _analyser_variante(bots, meta, fort):
    biblio = [b for b in bots if meta[b]["famille"] not in ("fort", "glouton", "autre", "chef", "horaire", "jugement")]
    tailles = sorted({_taille(k) for b in biblio for k in bots[b]})
    res = {"fort": fort, "tailles": {}, "strategies": len(biblio)}
    pires = []
    for n in tailles:
        vals = {b: _par_taille(bots[b]).get(n, {}) for b in bots}
        moy = {b: moyenne(x.values()) for b, x in vals.items() if x}

        def meilleur(filtre):
            c = [b for b in biblio if b in moy and filtre(b)]
            return max(c, key=lambda b: moy[b]) if c else None
        gl = [b for b in moy if meta[b]["famille"] == "glouton"]
        hor = [b for b in moy if meta[b]["famille"] == "horaire"]
        jug = [b for b in moy if meta[b]["famille"] == "jugement"]
        # la meilleure boucle compte aussi les gloutons et les horaires : « parer au plus probable à rythme de
        # rêve fixe » est une politique répétée (le tape-taupe en est le cas particulier), un horaire aussi
        best = max([b for b in biblio if b in moy] + gl + hor, key=lambda b: moy[b], default=None)
        ouverte = meilleur(lambda b: meta[b]["ouverte"])
        coll = meilleur(lambda b: meta[b]["collective"])
        reflexe = max(gl + hor + jug + [b for b in biblio if b in moy and not meta[b]["ouverte"]],
                      key=lambda b: moy[b], default=None)
        t = {"meilleure": best, "foret_meilleure": _rd(moy.get(best)),
             "meilleure_ouverte": ouverte, "foret_ouverte": _rd(moy.get(ouverte)),
             "meilleure_collective": coll, "foret_collective": _rd(moy.get(coll)),
             "reflexe": reflexe, "foret_reflexe": _rd(moy.get(reflexe)),
             "foret_fort": _rd(moy.get(fort)) if fort else None, "parties": len(vals.get(best, {}))}
        horloge = max(gl + hor, key=lambda b: moy[b], default=None)
        regle = max(jug, key=lambda b: moy[b], default=None)
        if horloge and regle:                                # T3 léger : une règle simple bat-elle l'horloge ?
            t["jugement_simple"] = {"horloge": horloge, "foret_horloge": _rd(moy[horloge]), "regle": regle,
                                    "foret_regle": _rd(moy[regle]), "ecart": ecart_apparie(vals[horloge], vals[regle])}
        if fort and fort in moy:
            ec = ecart_apparie(vals[best], vals[fort])          # fort − meilleure boucle
            t["ecart"] = ec
            pires.append((ec["ecart"], n))
            # échelle de la lecture : ouverte → réflexe → fort
            t["marches"] = {"ouverte_reflexe": _rd(moy[reflexe] - moy[ouverte]) if reflexe and ouverte else None,
                            "reflexe_fort": _rd(moy[fort] - moy[reflexe]) if reflexe else None}
            # une action ne suffit pas
            act = {}
            for a in ORDRES:
                c = [b for b in biblio if b.startswith(f"action:{a}|") and b in moy]
                if c:
                    x = max(c, key=lambda b: moy[b])
                    act[a] = {"strategie": x, "foret": _rd(moy[x]), "part_du_fort": _rd(moy[x] / moy[fort], 3) if moy[fort] else None,
                              "ecart": _rd(moy[fort] - moy[x])}
            t["actions"] = act
            # conventions de table, composition par composition
            comp = defaultdict(dict)
            for b in biblio:
                if not meta[b]["collective"]:
                    continue
                for k, x in vals[b].items():
                    comp[k.split("#")[0]].setdefault(b, []).append(x)
            f_comp = defaultdict(list)
            for k, x in vals[fort].items():
                f_comp[k.split("#")[0]].append(x)
            pire_c = None
            for c, par_b in comp.items():
                if c not in f_comp:
                    continue
                b = max(par_b, key=lambda y: moyenne(par_b[y]))
                e = moyenne(f_comp[c]) - moyenne(par_b[b])
                if pire_c is None or e < pire_c["ecart"]:
                    pire_c = {"composition": c, "convention": b, "ecart": _rd(e), "parties": len(par_b[b])}
            t["pire_composition"] = pire_c
        res["tailles"][str(n)] = t
    if pires:
        e, n = min(pires)
        res["ecart_pire_taille"] = {"ecart": e, "taille": n, "bande_proposee": _bande(e)}
    comps = [t["pire_composition"] for t in res["tailles"].values() if t.get("pire_composition")]
    if comps:
        p = min(comps, key=lambda c: c["ecart"])
        res["convention_pire"] = dict(p, bande_proposee=_bande(p["ecart"]))
    acts = [(a, n, x) for n, t in res["tailles"].items() for a, x in t.get("actions", {}).items()]
    if acts:
        a, n, x = min(acts, key=lambda y: y[2]["ecart"])
        coul = "rouge" if x["ecart"] < ACTION_PROCHE else ("vert" if x["part_du_fort"] <= ACTION_PART else "orange")
        res["action_pire"] = {"action": a, "taille": int(n), **x, "bande_proposee": coul}
    marches = [m for t in res["tailles"].values() for m in (t.get("marches") or {}).values() if m is not None]
    if marches:
        m = min(marches)
        res["marche_min"] = {"points": m, "bande_proposee": "vert" if m >= MARCHE_VERTE else ("rouge" if m < MARCHE_ROUGE else "orange")}
    return res


def _rd(x, k=2):
    return None if x is None else round(x, k)


def alertes(analyse):
    """Alerte de conception (lecture seule) : une boucle à moins de 3 points du bot fort, à une taille."""
    out = []
    for v, r in analyse.items():
        e = r.get("ecart_pire_taille")
        if e and e["ecart"] is not None and e["ecart"] < BANDES["rouge"]:
            t = r["tailles"][str(e["taille"])]
            out.append(f"**boucle gagnante (garde-fou C1, lecture seule)** : {_nom(v)}, à {e['taille']} joueurs, "
                       f"la stratégie répétée « {t['meilleure']} » est à {_f(e['ecart'])} points du bot fort.")
        c = r.get("convention_pire")
        if c and c["ecart"] < BANDES["rouge"]:
            out.append(f"**convention de table gagnante (C1, lecture seule)** : {_nom(v)}, table {c['composition']}, "
                       f"« {c['convention']} » à {_f(c['ecart'])} points du bot fort ({c['parties']} parties).")
    return out


def _nom(v):
    return "l'ancre" if v == "defaut" else (v if len(v) < 60 else v[:57] + "…")


def _f(x, f="+.1f"):
    return "–" if x is None else format(x, f).replace(".", ",")


def markdown(analyse, titre="Garde-fou : aucune boucle gagnante (lecture seule)"):
    L = [f"## {titre}", "",
         "*Décision C1 (14 oct.) ; spécification `projet/3-pilotage/garde-fou-boucles-gagnantes.md`. Bandes proposées, "
         "provisoires : elles ne jugent pas. Écart = bot fort − meilleure stratégie répétée, apparié (mêmes tables, mêmes "
         "graines) ; vert ≥ 10 points, rouge < 3. Indice : un vert dit seulement qu'aucune boucle de la bibliothèque ne gagne.*", ""]
    for v, r in analyse.items():
        L += [f"### {_nom(v)} (bot fort de référence : {r.get('fort') or 'aucun'} ; {r['strategies']} stratégies)", "",
              "| Joueurs | Bot fort | Meilleure boucle | Écart apparié | Meilleure boucle ouverte | Meilleure convention | Réflexe | Marches ouverte → réflexe → fort |",
              "|---|---|---|---|---|---|---|---|"]
        for n, t in sorted(r["tailles"].items()):
            ec = t.get("ecart") or {}
            ic = ec.get("ic95")
            eca = f"{_f(ec.get('ecart'))} [{_f(ic[0], '.1f')} ; {_f(ic[1], '.1f')}]" if ic else _f(ec.get("ecart"))
            mm = t.get("marches") or {}
            L.append(f"| {n} | {_f(t['foret_fort'], '.1f')} | {t['meilleure']} : {_f(t['foret_meilleure'], '.1f')} | {eca} | "
                     f"{t['meilleure_ouverte']} : {_f(t['foret_ouverte'], '.1f')} | {t['meilleure_collective']} : {_f(t['foret_collective'], '.1f')} | "
                     f"{t['reflexe']} : {_f(t['foret_reflexe'], '.1f')} | {_f(mm.get('ouverte_reflexe'))} / {_f(mm.get('reflexe_fort'))} |")
        L.append("")
        e, c, a, m = r.get("ecart_pire_taille"), r.get("convention_pire"), r.get("action_pire"), r.get("marche_min")
        if e:
            L.append(f"- **Écart à la meilleure boucle** (pire taille, {e['taille']} joueurs) : {_f(e['ecart'])} points → {e['bande_proposee']} (proposé).")
        if c:
            L.append(f"- **Aucune convention de table ne suffit** (pire composition, {c['composition']}, {c['parties']} parties) : "
                     f"« {c['convention']} », {_f(c['ecart'])} points → {c['bande_proposee']} (proposé).")
        if a:
            L.append(f"- **Une action ne suffit pas** (la plus proche : {a['action']} partout, {a['taille']} joueurs) : "
                     f"{_f(a['ecart'])} points, {_f(100 * a['part_du_fort'], '.0f')} % du bot fort → {a['bande_proposee']} (proposé).")
        if m:
            L.append(f"- **Échelle de la lecture** (plus petite marche) : {_f(m['points'])} points → {m['bande_proposee']} (proposé).")
        js = [(n, t["jugement_simple"]) for n, t in sorted(r["tailles"].items()) if t.get("jugement_simple")]
        if js:
            morceaux = []
            for n, j in js:
                e = j["ecart"]
                morceaux.append(f"{n} j. : « {j['regle']} » − « {j['horloge']} » = {_f(e.get('ecart'))} ({e.get('verdict')})")
            L.append("- **Réflexes de rêve, test T3 léger** (la meilleure règle simple qui lit la situation, contre la meilleure "
                     "politique d'horloge, taux fixes et horaires ; apparié) : " + " ; ".join(morceaux) + ".")
        L.append("")
    al = alertes(analyse)
    L += ["**Alertes (lecture seule)** : " + ("aucune." if not al else ""), ""] + [f"- {x}" for x in al] + ([""] if al else [])
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------ ligne de commande
def _lire(chemin):
    op = gzip.open if chemin.endswith(".gz") else open
    with op(chemin, "rt", encoding="utf-8") as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="action", required=True)
    c = sp.add_parser("campagne", help="écrire la campagne de la bibliothèque, appariée à une campagne existante")
    c.add_argument("--maquette", required=True)
    c.add_argument("--tables-de", required=True, help="campagne dont on reprend les tables, les parties et les graines")
    c.add_argument("--variantes", default="defaut", help="variantes, séparées par des virgules")
    c.add_argument("--nom")
    c.add_argument("--sortie", required=True)
    a = sp.add_parser("analyser", help="mesures du garde-fou depuis une synthèse (et celle du bot fort)")
    a.add_argument("--boucles", required=True, help="synthese.json (ou .gz) de la campagne de la bibliothèque")
    a.add_argument("--fort", help="synthese.json (ou .gz) jouée par le bot fort sur les mêmes tables et graines")
    a.add_argument("--sortie", help="fichier Markdown (sinon la sortie standard)")
    a.add_argument("--json", help="fichier JSON des mesures")
    x = ap.parse_args()
    if x.action == "campagne":
        src = _lire(x.tables_de)
        tables, parties, g0 = tables_de(src)
        nom = x.nom or f"boucles_{x.maquette.replace('.', '')}"
        camp = campagne(nom, x.maquette, x.variantes.split(","), tables, parties, g0,
                        f"Garde-fou « aucune boucle gagnante » (décision C1, lecture seule) : la bibliothèque de stratégies "
                        f"répétées sur les tables et graines de « {src.get('nom')} » ({len(tables)} tables, {parties} parties), "
                        f"pour l'apparier au bot fort de cette campagne.")
        with open(x.sortie, "w", encoding="utf-8") as f:
            json.dump(camp, f, ensure_ascii=False, indent=1)
        n = sum(len(b["bots"]) * len(b["tables"][0]["liste"]) * parties * len(b["variantes"]) for b in camp["blocs"])
        print(f"{x.sortie} : {n} parties")
    else:
        sb = _lire(x.boucles)
        sf = _lire(x.fort) if x.fort else None
        res = analyser(sb["parties_compactes"], sf["parties_compactes"] if sf else None)
        texte = markdown(res)
        if x.json:
            with open(x.json, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False, indent=1)
        if x.sortie:
            with open(x.sortie, "w", encoding="utf-8") as f:
                f.write(texte)
        else:
            print(texte)


if __name__ == "__main__":
    main()
