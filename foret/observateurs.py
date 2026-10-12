"""Observateurs : ils reçoivent tout ce que le moteur signale.

Pour ajouter un détecteur (un cas problématique à repérer, une mesure),
écrire un Observateur et le passer à Partie(observateurs=[...]) ou à la
campagne ; le moteur n'a pas à être modifié.

Catégories signalées : "lacune", "incoherence", "stat", "decision",
"decision_forcee" (une seule option), "journal".

Deux méthodes facultatives (phase 1) :
- decision(partie, siege, type, options, indice, ctx, impose) : chaque décision
  prise par un bot ou imposée, avec toutes les options offertes (pas les
  décisions rejouées par une copie) ;
- point(partie, segment) : au début de chaque segment (conseil, étape, fin de
  tour), là où une copie de la partie est possible.
"""
import json
from collections import Counter


class Observateur:
    def evenement(self, partie, categorie, code, n, detail):
        pass

    def fin(self, partie, bilan):
        """Peut compléter le bilan (dict) en fin de partie."""

    def decision(self, partie, siege, type_, options, indice, ctx, impose):
        pass

    def point(self, partie, segment):
        pass


def _court(o):
    """Écriture courte et stable d'une option ou d'un objet du contexte."""
    if o is None or isinstance(o, (bool, int, float, str)):
        return o
    if isinstance(o, tuple):
        return [_court(x) for x in o]
    if isinstance(o, dict):
        return {k: _court(v) for k, v in o.items()}
    return repr(o)


class JournalDecisions(Observateur):
    """Journal des décisions : pour chacune, le moment, le siège, le type, les
    options offertes, l'option prise, le contexte, et si elle était forcée
    (une seule option) ou imposée (copie).

    options=False ne garde que leur nombre (journal léger pour les campagnes).
    Les entrées sont des dict simples (JSON) : rien n'y renvoie aux objets de
    la partie, qui continuent de changer."""

    def __init__(self, options=True):
        self.garder_options = options
        self.entrees = []

    def decision(self, partie, siege, type_, options, indice, ctx, impose):
        e = {
            "n": len(self.entrees),
            "tour": partie.tour, "etape": partie.etape,
            "siege": siege.idx, "peuple": siege.peuple,
            "type": type_, "nb_options": len(options), "indice": indice,
            "choix": _court(options[indice]),
            "forcee": len(options) == 1, "imposee": impose,
            "contexte": {k: _court(v) for k, v in ctx.items()},
        }
        if self.garder_options:
            e["options"] = [_court(o) for o in options]
        self.entrees.append(e)

    def resume(self):
        """Par type : nombre de décisions, part forcée, nombre moyen d'options."""
        par = {}
        for e in self.entrees:
            r = par.setdefault(e["type"], {"decisions": 0, "forcees": 0, "options": 0})
            r["decisions"] += 1
            r["forcees"] += e["forcee"]
            r["options"] += e["nb_options"]
        for r in par.values():
            r["part_forcee"] = round(r["forcees"] / r["decisions"], 3)
            r["options_moyennes"] = round(r["options"] / r["decisions"], 2)
            del r["options"]
        return par

    def ecrire(self, chemin):
        """Une décision par ligne (JSONL)."""
        with open(chemin, "w", encoding="utf-8") as f:
            for e in self.entrees:
                f.write(json.dumps(e, ensure_ascii=False) + "\n")

    def fin(self, partie, bilan):
        bilan["journal_decisions"] = self.resume()


class Compteur(Observateur):
    def __init__(self):
        self.comptes = {c: Counter() for c in ("lacune", "incoherence", "stat", "decision", "decision_forcee")}

    def evenement(self, partie, categorie, code, n, detail):
        if categorie in self.comptes:
            self.comptes[categorie][code] += n

    def fin(self, partie, bilan):
        bilan["lacunes"] = dict(self.comptes["lacune"])
        bilan["incoherences"] = dict(self.comptes["incoherence"])
        bilan["stats"] = dict(self.comptes["stat"])
        bilan["decisions"] = dict(self.comptes["decision"])
        bilan["decisions_forcees"] = dict(self.comptes["decision_forcee"])


class Journal(Observateur):
    def __init__(self):
        self.lignes = []

    def evenement(self, partie, categorie, code, n, detail):
        pref = f"[T{partie.tour}E{partie.etape}] "
        if categorie == "journal":
            self.lignes.append(pref + detail)
        elif categorie == "lacune":
            self.lignes.append(pref + f"  ? lacune {code} {detail}")
        elif categorie == "incoherence":
            self.lignes.append(pref + f"  ! incohérence {code} {detail}")
