"""Lecteur du code de variante de l'atelier v2 (« Atelier de la Forêt qui rêve »).

Un code note une variante : « c:<options>|m:<modules>|p:<réglage>=<valeur>,... ».
Exemple, le préréglage « V2 proposée » : c:A2a,d_fav,C2a,D2v_choix|m:C3|p:
(les options sont triées par nom de choix ; seuls les réglages qui diffèrent de
la valeur proposée sont écrits).

    python -m foret.atelier "c:A2a,d_bb,C2a,D2v_choix|m:C3,D5|p:lunes=3"
    python -m foret.atelier --presets

patch(code) rend le morceau de maquette à fusionner sur maquettes/v2.json ;
charger("v2", "code:<code>") le fait directement, et une campagne peut citer
une variante « code:<code> ». Les nœuds et réglages viennent de l'atelier du
12 oct. 2026 ; les renvois [v2:<nœud>] relient chaque nœud au moteur et aux
tests (docs/noeuds_v2.md, python -m foret.conformite --v2).
"""
import argparse
import json

from .erreurs import ErreurMaquette

# --------------------------------------------------------------------------- l'arbre
CHOIX = {                       # choix -> options
    "A2": ("A2a", "A2b", "A2c"),
    "A2a_d": ("d_fav", "d_bb", "d_hes", "d_six"),
    "C2": ("C2a", "C2b", "C2c", "C2d", "C2e"),
    "D2v": ("D2v_choix", "D2v_deux"),
}
OPTION_DE = {o: c for c, os in CHOIX.items() for o in os}
MODULES = ("A4", "A5", "B4", "C3", "D5", "D6")
VERROUILLES = ("A6", "A7", "B5", "D7")          # idées non rédigées ou retirées : ignorés au décodage
NON_CODES = ("B4",)                             # modules que le moteur ne sait pas encore jouer
EXIGE = {"C2b": ("A2a",), "A4": ("A2a",), "B4": ("C2a",)}
BASE = {"A2": "A2a", "A2a_d": "d_fav", "C2": "C2a", "D2v": "D2v_choix"}

PARAMS = {                      # réglage -> (nœud, valeur proposée, valeurs admises)
    "piste_place": ("A1", "fixe", ("fixe", "hasard")),
    "esprits_depart": ("A1", "0", ("0", "1")),
    "portee": ("A2a", "rayon", ("rayon", "plateau")),
    "hs": ("A2a", "remorquee", ("remorquee", "organe", "rien")),
    "represailles": ("A3", "defendue", ("defendue", "attaque")),
    "escalade": ("A4", "5", ("4", "5")),
    "main": ("B1", "5", ("4", "5", "6")),
    "paquet": ("B1", "7", ("5", "6", "7")),
    "presence": ("B1", "3", ("2", "3", "4")),
    "barrage": ("B2", "tout", ("tout", "entree")),
    "alliance": ("B2", "presence", ("presence", "conjointe")),
    "voir": ("B3", "illimite", ("illimite", "1", "2")),
    "hanter": ("B3", "1", ("1", "2")),
    "immob": ("B3", "1", ("1", "2")),
    "tours": ("C1", "6", ("4", "5", "6", "7", "8")),
    "etapes": ("C1", "3", ("2", "3", "4")),
    "traces_n": ("C2a", "2", ("1", "2", "3")),
    "traces_datees": ("C2a", "oui", ("oui", "non")),
    "traces_eng": ("C2a", "non", ("non", "oui")),
    "partage_max": ("C2b", "2", ("1", "2")),
    "reves_limite": ("D1", "joueur", ("joueur", "table2", "table3")),
    "seuil": ("D2", "3", ("2", "3", "4")),
    "bonus": ("D4", "0", ("0", "10", "25")),
    "lunes": ("D5", "2", ("1", "2", "3")),
    "sursaut": ("D6", "3", ("1", "2", "3")),
    "plateau": ("E1", "v1", ("v1", "g1")),
    "m_chantier": ("E2", "2", ("0", "1", "2")),
}

PRESETS = {
    "coeur": ("Le cœur seul", {**BASE}, (), {}),
    "v2": ("V2 proposée", {**BASE}, ("C3",), {}),
    "gang": ("Façon The Gang", {**BASE, "C2": "C2b"}, ("C3", "D5"), {}),
    "v1": ("Héritage v1", {**BASE, "A2": "A2c", "C2": "C2c"}, ("C3",), {"represailles": "attaque", "bonus": "10"}),
}

PISTE_V2 = ["Percee", "Represailles", "Percee", "Represailles", "Opportunisme", "Cupidite",
            "Opportunisme", "Represailles", "Percee", "Cupidite", "Cupidite"]            # [v2:A2a]
PISTE_V1 = ["Renfort", "Reparer", "Percee", "Represailles", "Opportunisme", "Cupidite",
            "Opportunisme", "Represailles", "Percee", "Cupidite", "Cupidite"]            # [v2:A2c]
RESERVE = [{"nom": "Tonton Débard", "organes": ["moteur", "chenilles"], "entree": "Z1"},
           {"nom": "Ripaille", "organes": ["moteur", "chenilles", "phares"], "entree": "Z3"}]   # [v2:E2]


# --------------------------------------------------------------------------- code
def encoder(choix, modules, params):
    c = [choix[k] for k in sorted(choix)]
    m = sorted(x for x in modules if x not in VERROUILLES)
    p = [f"{k}={params[k]}" for k in PARAMS if k in params and params[k] != PARAMS[k][1]]
    return "c:" + ",".join(c) + "|m:" + ",".join(m) + "|p:" + ",".join(p)


def decoder(code):
    """(choix, modules, params) complets, valeurs proposées par défaut."""
    parts = {}
    for seg in str(code).strip().split("|"):
        i = seg.find(":")
        if i > 0:
            parts[seg[:i]] = seg[i + 1:]
    if "c" not in parts:
        raise ErreurMaquette(f"code de variante sans « c: » : {code}")
    choix = dict(BASE)
    for o in filter(None, parts["c"].split(",")):
        if o not in OPTION_DE:
            raise ErreurMaquette(f"code de variante : option inconnue {o}")
        choix[OPTION_DE[o]] = o
    modules = set()
    for x in filter(None, parts.get("m", "").split(",")):
        if x in VERROUILLES:
            continue
        if x not in MODULES:
            raise ErreurMaquette(f"code de variante : module inconnu {x}")
        modules.add(x)
    params = {k: v[1] for k, v in PARAMS.items()}
    for kv in filter(None, parts.get("p", "").split(",")):
        k, _, v = kv.partition("=")
        if k not in PARAMS or v not in PARAMS[k][2]:
            raise ErreurMaquette(f"code de variante : réglage invalide {kv}")
        params[k] = v
    return choix, modules, params


def actifs(choix, modules):
    """Nœuds actifs (options choisies, avec leurs parents choisis, et modules)."""
    on = set(modules)
    for c, o in choix.items():
        if c == "A2a_d" and choix["A2"] != "A2a":
            continue
        on.add(o)
    return on


def patch(code):
    """Morceau de maquette à fusionner sur maquettes/v2.json."""
    choix, modules, P = decoder(code)
    on = actifs(choix, modules)
    for n, req in EXIGE.items():
        if n in on and not all(r in on for r in req):
            raise ErreurMaquette(f"code de variante : {n} demande {', '.join(req)}")
    pas_codes = [n for n in NON_CODES if n in on]
    if pas_codes:
        raise ErreurMaquette(f"le moteur ne sait pas encore jouer : {', '.join(pas_codes)}")
    if P["plateau"] != "v1":
        raise ErreurMaquette("plateau g1 : gabarit pas encore dessiné")

    plan = {"A2a": "qui_ou", "A2b": "ou_comment", "A2c": "une_piste"}[choix["A2"]]     # [v2:A2]
    R = {"plan": plan}
    R["portee"] = P["portee"] if plan == "qui_ou" else "plateau"
    R["double"] = {"d_fav": "favori", "d_bb": "branle_bas", "d_hes": "hesite", "d_six": "sixieme"}[choix["A2a_d"]]
    R["machine_hs_designee"] = P["hs"]
    R["egarer"] = "chantier" if plan == "qui_ou" else "retiree"                         # [v2:B3]
    R["escalade"] = int(P["escalade"]) if "A4" in on else None                          # [v2:A4]
    R["bruit"] = "A5" in on                                                             # [v2:A5]
    R["presage"] = "C3" in on                                                           # [v2:C3]
    R["dernier_sursaut"] = "D6" in on                                                   # [v2:D6]
    R["sursaut_max"] = int(P["sursaut"])
    R["voies_reve"] = {"D2v_choix": "choix", "D2v_deux": "deux"}[choix["D2v"]]         # [v2:D2v_choix] [v2:D2v_deux]
    R["cercle_par_joueur"] = int(P["seuil"])                                            # [v2:D2]
    R["silence_du_chantier"] = False                                                    # [v2:D3]
    R["bonus_fin"] = int(P["bonus"])                                                    # [v2:D4]
    if "D5" in on:                                                                      # [v2:D5]
        R["lunes"], R["reves_par_joueur_et_tour"], R["reves_par_tour_table"] = int(P["lunes"]), 1, None
    else:                                                                               # [v2:D1]
        R["lunes"] = None
        lim = P["reves_limite"]
        R["reves_par_joueur_et_tour"] = 1 if lim == "joueur" else None
        R["reves_par_tour_table"] = None if lim == "joueur" else int(lim[-1])
    R["barrage_sortie"] = P["barrage"] == "tout"                                        # [v2:B2]
    R["alliance"] = P["alliance"]
    c2 = choix["C2"]                                                                    # [v2:C2]
    R["communication"] = {"C2a": "traces", "C2b": "partage", "C2c": "parle", "C2d": "aucun_signe",
                          "C2e": "tout_dire"}[c2]
    if c2 == "C2a":
        R["traces_par_joueur"] = int(P["traces_n"])
        R["traces_datees"] = P["traces_datees"] == "oui"
        R["traces_engagent"] = P["traces_eng"] == "oui"
    else:
        R["traces_par_joueur"] = 3 if c2 == "C2c" else 2
        R["traces_datees"] = c2 != "C2c"
        R["traces_engagent"] = False
    R["partage_max"] = int(P["partage_max"])

    disposition = list(PISTE_V1 if plan == "une_piste" else PISTE_V2)                   # [v2:A1]
    tirage = {"tuiles": list(disposition), "esprits_depart": 0}
    if P["esprits_depart"] == "1":
        disposition[-1] = "Esprit"
        tirage = {"tuiles": disposition[:-1], "esprits_depart": 1}
    represailles = ({"critere": "plus_defendue"} if P["represailles"] == "defendue"     # [v2:A3]
                    else {"critere": "derniere_attaque", "params": {"repli": "plus_boisee", "fenetre": None}})
    return {
        "regles": R,
        "tours": int(P["tours"]), "etapes": int(P["etapes"]),                           # [v2:C1]
        "piste": {"placement": P["piste_place"], "disposition": disposition, "tirage": tirage},
        "tuiles": {"Represailles": represailles},
        "cartes": {"main": int(P["main"]), "paquet": int(P["paquet"])},                 # [v2:B1]
        "presence": {"pions": int(P["presence"])},
        "machines": {"reserve": RESERVE[:int(P["m_chantier"])]},                        # [v2:E2]
        "pouvoirs": {"voir": {"par_tour": None if P["voir"] == "illimite" else int(P["voir"])},   # [v2:B3]
                     "hanter": {"par_tour": int(P["hanter"])},
                     "attendre": {"par_tour": int(P["immob"])}},
    }


def code_preset(nom):
    _, c, m, p = PRESETS[nom]
    return encoder(c, m, {**{k: v[1] for k, v in PARAMS.items()}, **p})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("code", nargs="?")
    ap.add_argument("--presets", action="store_true", help="codes des préréglages de l'atelier")
    a = ap.parse_args()
    if a.presets or not a.code:
        for k, (titre, *_r) in PRESETS.items():
            print(f"{titre:18s} code:{code_preset(k)}")
        return
    print(json.dumps(patch(a.code), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
