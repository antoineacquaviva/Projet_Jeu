"""Maquettes : les règles et le matériel, décrits en JSON (dossier maquettes/).

- Une maquette peut hériter d'une autre (clé "base") et n'écrire que ses
  différences : c'est la façon prévue de faire une nouvelle itération.
- Une maquette déclare ses variantes (clé "variantes") : des modifications
  nommées, que les campagnes peuvent tester.
- Toute maquette est validée au chargement : une clé inconnue (faute de
  frappe dans une variante, par exemple) est une erreur, pas un réglage ignoré.
"""
import copy
import re
import json
import os

from .erreurs import ErreurMaquette

DOSSIER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "maquettes")
CLES = {"nom", "description", "document", "base", "tours", "etapes", "plateau", "machines", "piste",
        "tuiles", "cartes", "presence", "peuples", "pouvoirs", "regles", "variantes", "manoeuvres", "atelier",
        "variantes_heritees"}
MANOEUVRES = ("Encercler", "Avancer", "Foncer", "Raser", "Reparer", "Renfort")
ORGANES = ("moteur", "chenilles", "phares")
COMPARTIMENTS = ("mechant", "plans", "plateau", "machines")
ACTIONS = ("aller", "barrer", "saboter")


def _choix(*vals):
    def v(x):
        return x in vals
    v.doc = " | ".join(map(repr, vals))
    return v


def _bool(x):
    return isinstance(x, bool)
_bool.doc = "true | false"


def _entier_ou_rien(x):
    return x is None or (isinstance(x, int) and not isinstance(x, bool) and x >= 0)
_entier_ou_rien.doc = "entier >= 0 ou null"


def _entier_pos(x):
    return isinstance(x, int) and not isinstance(x, bool) and x >= 1
_entier_pos.doc = "entier >= 1"


def _entier_nat(x):
    return isinstance(x, int) and not isinstance(x, bool) and x >= 0
_entier_nat.doc = "entier >= 0"


def _des_fixes(x):
    return x is None or (isinstance(x, list) and len(x) == 2 and
                         all(isinstance(d, int) and not isinstance(d, bool) and 1 <= d <= 6 for d in x))
_des_fixes.doc = "null ou [a, b] (deux faces de 1 à 6)"


def _liste_de(*vals):
    def v(x):
        return isinstance(x, list) and all(e in vals for e in x)
    v.doc = f"liste parmi {vals}"
    return v


def _interdits(x):
    """[mesure:jeu_restreint] Le jeu restreint (étape 3.4) : « action:<nom> » (Saboter, Barrer…, aussi en
    embuscade), « aller », « moitie:<pouvoir> » (la moitié de carte qui porte ce pouvoir n'est
    jamais jouée), « reve »."""
    return isinstance(x, list) and all(
        isinstance(e, str) and (e in ("aller", "reve") or re.fullmatch(r"(action|moitie):[a-z_]+", e)) for e in x)
_interdits.doc = "liste de « action:<nom> », « aller », « moitie:<pouvoir> », « reve »"


REGLES = {
    "pouvoirs": _bool,
    "fin_de_partie": _choix("immediate", "fin_de_tour"),
    "barrage": _choix("bloque", "v0"),
    "echec_face_esprit": _choix("reste", "echange"),
    "reves_par_joueur_et_tour": _entier_ou_rien,
    "reussite": _choix("effet", "foret"),
    "alliance": _choix("presence", "conjointe"),
    "action_soutenir": _bool,
    "effets_organes": _bool,
    "silence_reserve_vide": _bool,
    "criteres_ignorent_zones_rasees": _bool,
    "departage_zones": _liste_de("foret", "proximite", "numero"),
    "departage_machines": _liste_de("avancee", "numero"),
    "premier_joueur_tournant": _bool,
    "bruit": _bool,
    "cauchemar": _bool,                # [reve_dispute:cauchemar] proposition du 14 oct. 2026, à tester
    "cauchemar_cases": _entier_pos,    # [reve_dispute:grille] cases de recul par cauchemar (absent = 1) ; grille du 14 oct.
    "dernier_sursaut": _bool,
    "sursaut_max": _entier_ou_rien,
    # R2.5, R2.6 (moteur 1.2) : communication au conseil et présage
    "communication": _choix("aucun_signe", "traces", "partage", "parle", "tout_dire"),
    "presage": _bool,
    "traces_par_joueur": _entier_pos,
    "traces_datees": _bool,
    "traces_engagent": _bool,
    "partage_max": _entier_pos,
    "rondes_conseil": _entier_pos,       # modélisation : tours de pose sans ordre de tour (hors recherche)
    # Maquette v2 (moteur 1.3) : renvois [v2:<nœud de l'atelier>]
    "plan": _choix("une_piste", "qui_ou", "ou_comment"),          # [v2:A2c] [v2:A2a] [v2:A2b]
    "double": _choix("favori", "branle_bas", "hesite", "sixieme"),  # [v2:A2a_d]
    "portee": _choix("plateau", "rayon"),                          # [v2:A2a]
    "machine_hs_designee": _choix("remorquee", "organe", "rien"),  # [v2:A2a]
    "escalade": _entier_ou_rien,                                   # [v2:A4] tour de début, null = sans
    "voies_reve": _choix("sommeil", "choix", "deux"),              # [v2:D2]
    "cercle_par_joueur": _entier_pos,                              # [v2:D2]
    "silence_du_chantier": _bool,                                  # [v2:D3]
    "bonus_fin": _entier_nat,                                      # [v2:D4] % de la forêt initiale
    "reves_par_tour_table": _entier_ou_rien,                       # [v2:D1]
    "lunes": _entier_ou_rien,                                      # [v2:D5]
    "reves_par_pas": _entier_pos,
    "ordres_par_etape": _entier_pos,
    "machines_en_jeu": _entier_ou_rien,                            # [v2:E2] Machines en jeu au départ (null = la maquette)                               # [v0.3:ordres] ordres du Méchant par étape                                  # [v0.3:pas] rêves pour un pas de l'esprit
    "egarer": _choix("retiree", "chantier"),                       # [v2:B3]
    "barrage_sortie": _bool,                                       # [v2:B2]
    # Témoins de mesure (moteur 1.4, phase 1d) : jamais proposés comme règles du jeu
    "des_fixes": _des_fixes,           # [mesure:temoins] dés truqués : chaque lancer donne ces deux faces
    "apprentissage": _bool,            # [mesure:temoins] false = le Méchant n'apprend plus
    "interdits": _interdits,           # [mesure:jeu_restreint] jeu restreint : options retirées à tous
}


# ------------------------------------------------------------------ valeurs par taille de table
# Plan vers la V1, section 7 bis (critère du 13 oct. 2026) : certaines valeurs peuvent dépendre du
# nombre de joueurs. Forme : un nombre (comme avant), un dict {"2": …, "6": …} (clés de "1" à "6" ;
# une taille absente prend la valeur de la plus proche taille inférieure donnée, sinon la plus petite),
# ou une formule « n », « n-1 », « n+2 » (n = nombre de joueurs ; résultat ramené à 0 au moins).
PAR_TABLE = (("regles", "lunes"), ("regles", "cercle_par_joueur"), ("regles", "reves_par_pas"),
             ("regles", "reves_par_tour_table"), ("regles", "reves_par_joueur_et_tour"),
             ("regles", "escalade"), ("regles", "ordres_par_etape"), ("regles", "machines_en_jeu"),
             ("tours",), ("cartes", "main"))
TAILLES = range(1, 7)
_FORMULE = re.compile(r"n([+-][0-9]+)?")


def est_par_table(x):
    if isinstance(x, str):
        return bool(_FORMULE.fullmatch(x.replace(" ", "")))
    return (isinstance(x, dict) and bool(x) and all(k in {str(t) for t in TAILLES} for k in x))


def valeur_table(x, n):
    """Valeur d'un réglage pour une table de n joueurs (x : nombre, dict par taille ou formule)."""
    if isinstance(x, str) and est_par_table(x):
        f = _FORMULE.fullmatch(x.replace(" ", ""))
        return max(0, n + int(f.group(1) or 0))
    if isinstance(x, dict) and est_par_table(x):
        tailles = sorted(int(k) for k in x)
        bas = [t for t in tailles if t <= n]
        return x[str(bas[-1] if bas else tailles[0])]
    return x


def _lire_chemin(m, chemin):
    o = m
    for k in chemin:
        if not isinstance(o, dict) or k not in o:
            return None, False
        o = o[k]
    return o, True


def a_des_valeurs_par_table(m):
    return any(est_par_table(_lire_chemin(m, c)[0]) for c in PAR_TABLE)


def resoudre_table(m, n):
    """Maquette pour une table de n joueurs : les valeurs par taille de table remplacées par leur valeur.
    Rend la maquette elle-même (même objet) si elle n'en contient aucune."""
    if not a_des_valeurs_par_table(m):
        return m
    out = dict(m)
    for chemin in PAR_TABLE:
        v, ok = _lire_chemin(m, chemin)
        if not ok or not est_par_table(v):
            continue
        if len(chemin) == 1:
            out[chemin[0]] = valeur_table(v, n)
        else:
            out[chemin[0]] = dict(out[chemin[0]])
            out[chemin[0]][chemin[1]] = valeur_table(v, n)
    out["par_table"] = {"joueurs": n}
    return out


# ------------------------------------------------------------------ fusion
def fusionner(base, patch):
    """Fusion récursive : les dictionnaires se fusionnent, le reste est remplacé."""
    out = copy.deepcopy(base)
    for k, v in (patch or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict) and not est_par_table(v):
            out[k] = fusionner(out[k], v)                     # une valeur par taille de table se remplace d'un bloc
        else:
            out[k] = copy.deepcopy(v)
    return out


def _chemin(nom):
    if os.path.exists(nom):
        return nom
    p = os.path.join(DOSSIER, nom if nom.endswith(".json") else nom + ".json")
    if not os.path.exists(p):
        raise ErreurMaquette(f"maquette introuvable : {nom}")
    return p


def lire(nom, _vus=()):
    """Lit une maquette et résout son héritage, sans appliquer de variante."""
    p = _chemin(nom)
    if p in _vus:
        raise ErreurMaquette(f"héritage circulaire : {p}")
    with open(p, encoding="utf-8") as f:
        data = json.load(f)
    if "base" in data:
        parent = lire(data["base"], _vus + (p,))
        variantes = dict(parent.get("variantes", {})) if data.get("variantes_heritees", True) else {}
        for k, v in data.get("variantes", {}).items():
            if v is None:
                variantes.pop(k, None)
            else:
                variantes[k] = v
        enfant = {k: v for k, v in data.items() if k not in ("base", "variantes")}
        data = fusionner({k: v for k, v in parent.items() if k != "variantes"}, enfant)
        data["variantes"] = variantes
        data["herite_de"] = parent["nom"]
    data.setdefault("variantes", {})
    return data


def _morceaux(texte):
    """Découpe « a=1,b={"2":1,"4":2},c="n-1" » aux virgules hors accolades, crochets et guillemets."""
    out, prof, guill, cur = [], 0, False, ""
    for ch in texte:
        if ch == '"':
            guill = not guill
        elif not guill and ch in "{[":
            prof += 1
        elif not guill and ch in "}]":
            prof -= 1
        if ch == "," and prof == 0 and not guill:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def charger(nom, variante=None):
    """Maquette prête à jouer : héritage résolu, variante appliquée, validée.

    Une variante peut être un nom de la maquette, « code:<code de l'atelier> »
    (maquette v2 : foret/atelier.py), « interdire:<interdit>[+<interdit>…] » (jeu
    restreint, règle « interdits ») ou « regles:<règle>=<valeur JSON>[,…] » (par exemple
    « regles:bonus_fin=10 », la vérification de robustesse A12). Une variante nommée peut elle-même porter
    un code d'atelier (clé « atelier »)."""
    m = lire(nom)
    if variante and variante != "defaut":
        if variante.startswith("code:"):
            patch = {"atelier": variante[len("code:"):]}
        elif variante.startswith("patch:"):                  # plan vers la V1 : « patch:<objet JSON> » (criblage, exploration)
            patch = json.loads(variante[len("patch:"):])
            if not isinstance(patch, dict):
                raise ErreurMaquette(f"variante patch : objet JSON attendu ({variante[:60]}…)")
        elif variante.startswith("interdire:"):              # [mesure:jeu_restreint] « interdire:a+b »
            patch = {"regles": {"interdits": variante[len("interdire:"):].split("+")}}
        elif variante.startswith("regles:"):                 # « regles:bonus_fin=10,lunes=3 » (valeurs JSON)
            patch = {"regles": {}}
            for morceau in _morceaux(variante[len("regles:"):]):
                k, _, v = morceau.partition("=")
                try:
                    patch["regles"][k] = json.loads(v)
                except ValueError:
                    patch["regles"][k] = v
        elif variante not in m["variantes"]:
            raise ErreurMaquette(f"variante inconnue pour {m['nom']} : {variante} "
                                 f"(connues : {sorted(m['variantes'])})")
        else:
            patch = m["variantes"][variante]
        if "atelier" in patch:
            from .atelier import patch as patch_atelier
            m = fusionner(m, patch_atelier(patch["atelier"]))
            m["atelier"] = patch["atelier"]
            patch = {k: v for k, v in patch.items() if k != "atelier"}
        m = fusionner(m, patch)
        m["variante"] = variante
    else:
        m["variante"] = "defaut"
    valider(m)
    return m


# ------------------------------------------------------------------ validation
def valider(m):
    """Valide une maquette ; si elle a des valeurs par taille de table, la valide pour chaque taille."""
    if a_des_valeurs_par_table(m):
        for n in TAILLES:
            try:
                _valider(resoudre_table(m, n))
            except ErreurMaquette as e:
                raise ErreurMaquette(f"{e} (table de {n} joueurs)") from None
        return m
    return _valider(m)


def _valider(m):
    from .criteres import CRITERES
    from .chantier import CHANTIER
    from .pouvoirs import POUVOIRS

    def err(msg):
        raise ErreurMaquette(f"maquette {m.get('nom')} ({m.get('variante')}) : {msg}")

    inconnues = set(m) - CLES - {"herite_de", "variante", "par_table"}
    if inconnues:
        err(f"clés inconnues {sorted(inconnues)}")
    for k in ("tours", "etapes"):
        if not isinstance(m.get(k), int) or m[k] < 1:
            err(f"{k} doit être un entier >= 1")

    # règles
    R = m.get("regles", {})
    for k in R:
        if k not in REGLES:
            err(f"règle inconnue : {k}")
    for k, v in REGLES.items():
        if k not in R:
            err(f"règle manquante : {k}")
        if not v(R[k]):
            err(f"règle {k} = {R[k]!r} invalide (attendu : {v.doc})")

    if R["traces_engagent"] and not (R["traces_datees"] and R["communication"] == "traces"):
        err("traces_engagent demande des traces datées (communication = traces, traces_datees = true)")
    if R["portee"] == "rayon" and R["plan"] != "qui_ou":
        err("portee = rayon demande plan = qui_ou")
    if R["escalade"] is not None and R["plan"] != "qui_ou":
        err("l'escalade demande plan = qui_ou")
    if R["plan"] == "qui_ou":
        n = len(m["machines"]["en_jeu"]) + len(m["machines"].get("reserve", []))
        if n > 5:
            err("plan qui_ou : 5 Machines au plus (cases 1 à 5 de la piste des Machines)")
        if R["double"] == "sixieme" and not m["machines"].get("sixieme"):
            err("double = sixieme demande machines.sixieme")
        for spec in m["machines"]["en_jeu"] + m["machines"].get("reserve", []) + \
                ([m["machines"]["sixieme"]] if m["machines"].get("sixieme") else []):
            if spec.get("entree") not in m["plateau"]["zones"]:
                err(f"plan qui_ou : zone d'entrée manquante ou inconnue pour {spec.get('nom')}")
    if R["plan"] == "ou_comment":
        d = m.get("manoeuvres", {}).get("disposition")
        if not d or sorted(d) != sorted(MANOEUVRES):
            err(f"plan ou_comment : manoeuvres.disposition doit ranger les 6 manœuvres {MANOEUVRES} (cases 0 à 5)")
    fl = m["plateau"].get("fleches", {})
    for a, b in fl.items():
        Z = m["plateau"]["zones"]
        if a not in Z or b not in Z or Z[b]["profondeur"] <= Z[a]["profondeur"] or \
                not any({a, b} == set(x) for x in m["plateau"]["adjacences"]):
            err(f"flèche de percée invalide : {a} -> {b} (voisine plus profonde attendue)")

    # plateau et Machines
    zones = m["plateau"]["zones"]
    for spec in m["machines"]["en_jeu"] + m["machines"].get("reserve", []):
        org = spec.get("organes", [])
        if not org or len(set(org)) != len(org) or any(o not in ORGANES for o in org):
            err(f"organes invalides : {spec}")
    for spec in m["machines"]["en_jeu"]:
        if spec.get("zone") not in zones:
            err(f"Machine dans une zone inconnue : {spec}")

    # tuiles et piste
    for nom, t in m["tuiles"].items():
        if t.get("genre") == "tactique":
            if t.get("critere") not in CRITERES:
                err(f"tuile {nom} : critère inconnu {t.get('critere')}")
            if t.get("critere") == "derniere_attaque" and t.get("params", {}).get("repli") not in (None, *CRITERES):
                err(f"tuile {nom} : critère de repli inconnu")
        elif t.get("genre") == "chantier":
            if t.get("ordre") not in CHANTIER:
                err(f"tuile {nom} : ordre de chantier inconnu {t.get('ordre')}")
        else:
            err(f"tuile {nom} : genre inconnu {t.get('genre')}")
    P = m["piste"]
    if P.get("placement") not in ("fixe", "hasard"):
        err("piste.placement : fixe | hasard")
    if P["placement"] == "fixe":
        if "disposition" not in P:
            err("piste : placement fixe sans « disposition »")
        noms = P["disposition"]
        if len(noms) != 11:
            err("piste : la disposition doit compter 11 tuiles (cases 2 à 12)")
        if noms[5] == "Esprit":
            err("piste : un esprit au centre dès la mise en place")
    else:
        if "tirage" not in P:
            err("piste : placement au hasard sans « tirage »")
        noms = P["tirage"]["tuiles"]
        if len(noms) + P["tirage"].get("esprits_depart", 0) != 11:
            err("piste : tuiles + esprits de départ doivent faire 11")
    for n in noms:
        if n != "Esprit" and n not in m["tuiles"]:
            err(f"piste : tuile inconnue {n}")

    # cartes, présence
    C = m["cartes"]
    if not (1 <= C["main"] <= C["paquet"]):
        err("cartes : il faut 1 <= main <= paquet")
    if m["presence"].get("placement") not in ("choix", "hasard"):
        err("presence.placement : choix | hasard")

    # peuples et pouvoirs
    for p, spec in m["peuples"].items():
        comps = []
        for moitie in ("haut", "bas"):
            d = spec.get(moitie)
            if not d or d.get("compartiment") not in COMPARTIMENTS:
                err(f"peuple {p} : moitié {moitie} sans compartiment valide")
            comps.append(d["compartiment"])
            if d.get("pouvoir") is not None and d["pouvoir"] not in POUVOIRS:
                err(f"peuple {p} : pouvoir inconnu {d['pouvoir']}")
        if comps[0] == comps[1]:
            err(f"peuple {p} : deux moitiés sur le même compartiment")
        for t in spec.get("traits", []):
            if t not in POUVOIRS:
                err(f"peuple {p} : trait inconnu {t}")
        acts = spec.get("actions", list(ACTIONS))
        if not isinstance(acts, list) or any(a not in ACTIONS for a in acts):
            err(f"peuple {p} : actions parmi {ACTIONS}")
    for nom, params in m["pouvoirs"].items():
        if nom not in POUVOIRS:
            err(f"paramètres pour un pouvoir inconnu : {nom}")
        try:
            POUVOIRS[nom].valider(nom, params)
        except ErreurMaquette as e:
            err(str(e))
    return m


def resume(m):
    """Quelques lignes pour les journaux et les synthèses."""
    return {"nom": m["nom"], "variante": m.get("variante"), "herite_de": m.get("herite_de"),
            "zones": len(m["plateau"]["zones"]), "foret": sum(z["foret"] for z in m["plateau"]["zones"].values()),
            "machines": len(m["machines"]["en_jeu"]), "reserve": len(m["machines"].get("reserve", []))}
