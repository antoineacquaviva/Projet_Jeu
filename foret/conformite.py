"""Contrôle de conformité : chaque règle écrite a-t-elle son code et ses tests ?

    python -m foret.conformite                       # règles de la maquette v1
    python -m foret.conformite --regles docs/regles_v1.md --sortie conformite.md
    python -m foret.conformite --v2                  # nœuds de l'atelier v2 (docs/noeuds_v2.md)
    python -m foret.conformite --mesures             # mesures de la batterie ↔ témoins ↔ code ↔ tests

Les règles sont repérées dans le document par leur identifiant en gras
(« **R4.4 Barrage.** »). Le code et les tests y renvoient en citant
l'identifiant (commentaire, docstring). Le contrôle rend une matrice règle →
fonctions du moteur → tests, et signale :
- les règles sans test ;
- les identifiants cités dans le code ou les tests mais absents des règles
  (règle renumérotée ou supprimée).
Il ne prouve pas que le code est juste : il garantit que chaque règle a été
traduite et vérifiée quelque part, et que rien ne renvoie à une règle disparue.
"""
import argparse
import os
import re
from collections import defaultdict

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOTIF_REGLE = re.compile(r"\*\*(R\d+\.\d+)\s+([^*]+?)\.?\*\*")
MOTIF_REF = re.compile(r"\bR(\d+\.\d+)\b")
MOTIF_DEF = re.compile(r"^\s*(?:def|class)\s+(\w+)")
# Maquette v2 : nœuds de l'atelier, « **[v2:A2a] Titre.** *(non codé)* » dans docs/noeuds_v2.md,
# cités « [v2:A2a] » dans le code et les tests.
MOTIF_NOEUD_DOC = re.compile(r"\*\*\[v2:(\w+)\]\s+([^*]+?)\.?\*\*(?:\s*\*\(([^)]*)\)\*)?")
MOTIF_NOEUD = re.compile(r"\[v2:(\w+)\]")
# Batterie d'évaluation (moteur 1.4) : mesures de foret/mesures.py, citées « [mesure:concentration] »
MOTIF_MESURE = re.compile(r"\[mesure:(\w+)\]")


def matrice_mesures(dossier_code, dossier_tests):
    """Chaque mesure : un renvoi dans le code, au moins un test, au moins un
    témoin (sauf les mesures descriptives et celles qui attendent le bot fort)."""
    from .mesures import MESURES
    code = references(dossier_code, motif=MOTIF_MESURE, prefixe="")
    tests = references(dossier_tests, motif=MOTIF_MESURE, prefixe="")
    connus = set(MESURES) | {"temoins"}
    lignes = ["| Mesure | Étiquette | Code | Tests | Témoins |", "|---|---|---|---|---|"]
    sans_test, sans_temoin, attente, sans_code = [], [], [], []
    for mid, spec in MESURES.items():
        c = sorted({f for _, f in code.get(mid, [])})
        t = sorted({f for _, f in tests.get(mid, [])})
        en_attente = spec.get("bot") == "fort"
        if en_attente:
            attente.append(mid)
        else:
            if not t:
                sans_test.append(mid)
            if not c:
                sans_code.append(mid)
            if not spec["temoins"] and not spec.get("descriptive") and not spec.get("phase2"):
                sans_temoin.append(mid)
        lignes.append(f"| {mid} | {spec['etiquette']} | {', '.join(c[:4]) or '–'} | "
                      f"{'bot fort (phase 2)' if en_attente else str(len(t)) + ' test(s)'} | "
                      f"{len(spec['temoins']) or ('descriptive' if spec.get('descriptive') else '–')} |")
    for x in ("temoins",):
        if not tests.get(x):
            sans_test.append(x)
    orphelins = sorted((set(code) | set(tests)) - connus)
    return MESURES, "\n".join(lignes), sans_test, sans_temoin, orphelins, attente, sans_code


def regles(chemin):
    with open(chemin, encoding="utf-8") as f:
        txt = f.read()
    return {m.group(1): m.group(2).strip() for m in MOTIF_REGLE.finditer(txt)}


def references(dossier, motif_fichier=".py", motif=MOTIF_REF, prefixe="R"):
    """{identifiant: [(fichier, fonction englobante)]}"""
    refs = defaultdict(list)
    for base, _, fichiers in os.walk(dossier):
        if "__pycache__" in base:
            continue
        for nom in sorted(fichiers):
            if not nom.endswith(motif_fichier):
                continue
            chemin = os.path.join(base, nom)
            courant = "(module)"
            with open(chemin, encoding="utf-8") as f:
                for ligne in f:
                    d = MOTIF_DEF.match(ligne)
                    if d:
                        if not ligne[0].isspace() or ligne.startswith("    def ") or ligne.startswith("    class "):
                            courant = d.group(1)
                    elif ligne[:1].strip() and not ligne.startswith(("#", "@", ")", "]", "}")):
                        courant = "(module)"
                    for r in motif.findall(ligne):
                        module = os.path.splitext(nom)[0]
                        loc = (os.path.relpath(chemin, RACINE),
                               module if courant == "(module)" else f"{module}.{courant}")
                        if loc not in refs[prefixe + r]:
                            refs[prefixe + r].append(loc)
    return refs


def matrice(chemin_regles, dossier_code, dossier_tests):
    R = regles(chemin_regles)
    code = references(dossier_code)
    tests = references(dossier_tests)
    lignes = ["| Règle | Code | Tests |", "|---|---|---|"]
    sans_test, sans_code = [], []
    for rid, titre in R.items():
        c = sorted({f for _, f in code.get(rid, [])})
        t = sorted({f for _, f in tests.get(rid, [])})
        if not t:
            sans_test.append(rid)
        if not c:
            sans_code.append(rid)
        lignes.append(f"| {rid} {titre} | {', '.join(c) or '–'} | {len(t)} test(s) |")
    orphelins = sorted((set(code) | set(tests)) - set(R))
    return R, "\n".join(lignes), sans_test, sans_code, orphelins


def noeuds(chemin):
    """{nœud: (titre, statut)} ; statut « non codé » : exclu des contrôles."""
    with open(chemin, encoding="utf-8") as f:
        txt = f.read()
    return {m.group(1): (m.group(2).strip(), (m.group(3) or "").strip()) for m in MOTIF_NOEUD_DOC.finditer(txt)}


def matrice_v2(chemin_doc, dossier_code, dossier_tests):
    N = noeuds(chemin_doc)
    code = references(dossier_code, motif=MOTIF_NOEUD, prefixe="")
    tests = references(dossier_tests, motif=MOTIF_NOEUD, prefixe="")
    lignes = ["| Nœud | Code | Tests |", "|---|---|---|"]
    sans_test, sans_code, non_codes = [], [], []
    for nid, (titre, statut) in N.items():
        c = sorted({f for _, f in code.get(nid, [])})
        t = sorted({f for _, f in tests.get(nid, [])})
        if statut == "non codé":
            non_codes.append(nid)
        else:
            if not t:
                sans_test.append(nid)
            if not c:
                sans_code.append(nid)
        lignes.append(f"| {nid} {titre}{' (non codé)' if statut == 'non codé' else ''} | "
                      f"{', '.join(c[:6]) + (' …' if len(c) > 6 else '') or '–'} | {len(t)} test(s) |")
    orphelins = sorted((set(code) | set(tests)) - set(N))
    return N, "\n".join(lignes), sans_test, sans_code, orphelins, non_codes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--regles", default=os.path.join(RACINE, "docs", "regles_v1.md"))
    ap.add_argument("--sortie")
    ap.add_argument("--v2", action="store_true", help="nœuds de l'atelier v2 (docs/noeuds_v2.md)")
    ap.add_argument("--mesures", action="store_true", help="mesures de la batterie (foret/mesures.py)")
    args = ap.parse_args()
    if args.mesures:
        M, tab, sans_test, sans_temoin, orphelins, attente, sans_code = matrice_mesures(
            os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
        rapport = [f"{len(M)} mesures dans foret/mesures.py ({len(attente)} attendent le bot fort)", "", tab, ""]
        rapport.append(f"Mesures sans test : {', '.join(sans_test) or 'aucune'}")
        rapport.append(f"Mesures sans témoin : {', '.join(sans_temoin) or 'aucune'}")
        rapport.append(f"Mesures sans renvoi dans le code : {', '.join(sans_code) or 'aucune'}")
        rapport.append(f"Renvois vers des mesures absentes : {', '.join(orphelins) or 'aucun'}")
        rapport.append(f"En attente du bot fort (phase 2) : {', '.join(attente) or 'aucune'}")
        txt = "\n".join(rapport)
        if args.sortie:
            with open(args.sortie, "w", encoding="utf-8") as f:
                f.write(txt + "\n")
        print(txt)
        raise SystemExit(1 if (sans_test or sans_temoin or orphelins or sans_code) else 0)
    if args.v2:
        doc = os.path.join(RACINE, "docs", "noeuds_v2.md")
        N, tab, sans_test, sans_code, orphelins, non_codes = matrice_v2(
            doc, os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
        rapport = [f"{len(N)} nœuds dans docs/noeuds_v2.md ({len(non_codes)} non codés)", "", tab, ""]
        rapport.append(f"Nœuds codés sans test : {', '.join(sans_test) or 'aucun'}")
        rapport.append(f"Nœuds codés sans renvoi dans le code : {', '.join(sans_code) or 'aucun'}")
        rapport.append(f"Renvois vers des nœuds absents : {', '.join(orphelins) or 'aucun'}")
        rapport.append(f"Non codés : {', '.join(non_codes) or 'aucun'}")
        txt = "\n".join(rapport)
        if args.sortie:
            with open(args.sortie, "w", encoding="utf-8") as f:
                f.write(txt + "\n")
        print(txt)
        raise SystemExit(1 if (sans_test or orphelins) else 0)
    R, tab, sans_test, sans_code, orphelins = matrice(
        args.regles, os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
    rapport = [f"{len(R)} règles dans {os.path.relpath(args.regles, RACINE)}", "", tab, ""]
    rapport.append(f"Règles sans test : {', '.join(sans_test) or 'aucune'}")
    rapport.append(f"Règles sans renvoi dans le code : {', '.join(sans_code) or 'aucune'}")
    rapport.append(f"Renvois vers des règles absentes : {', '.join(orphelins) or 'aucun'}")
    txt = "\n".join(rapport)
    if args.sortie:
        with open(args.sortie, "w", encoding="utf-8") as f:
            f.write(txt + "\n")
    print(txt)
    raise SystemExit(1 if (sans_test or orphelins) else 0)


if __name__ == "__main__":
    main()
