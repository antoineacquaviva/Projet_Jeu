"""Test T1 : les mécanismes voulus par la conception se produisent-ils ? (décision C4 de l'auteur, 14 oct. 2026)

[mesure:mecanismes] Leçon du rêve (projet/3-pilotage/choix-strategique.md, principe 6 : « un mécanisme qui ne se
produit pas n'existe pas »). Chaque interaction voulue par la conception est reliée aux compteurs que le moteur
tient déjà (stats_par_partie des synthèses) ; on lit sa fréquence par partie, variante par variante. Une alerte
de conception est levée quand un mécanisme noté 8 ou 9 dans la synthèse des idées, et qui concerne toutes les
tables, se produit moins de SEUIL fois par partie.

Lecture seule : rien ici ne change une règle ni la qualité d'une variante. Les mécanismes propres à un peuple
(l'embuscade des reptiles, Hanter des entités…) sont rapportés sans alerte, puisque leur fréquence dépend des
tables jouées. Un mécanisme sans compteur est signalé comme tel (compteur à ajouter : le moteur ne doit pas
changer de statistiques sans mise à jour du test de non-régression).

    python -m foret.mecanismes synthese.json [synthese2.json …]
"""
import argparse
import gzip
import json
from collections import defaultdict

SEUIL = 0.5          # occurrences par partie (décision C4)

# id : (nom lisible, idée de la synthèse et sa note, compteurs, portée)
# portée « toutes » : concerne toutes les tables, donc soumis à l'alerte ; sinon le peuple concerné.
MECANISMES = {
    "tir_a_la_corde": ("Le rêve disputé par l'apprentissage (tir à la corde, cauchemar)", "Le tir à la corde", 8,
                       ["tir_a_la_corde", "cauchemar_recul"], "toutes"),
    "reve_annule": ("Un ordre annulé parce que les dés tombent sur un esprit", "Rêver sur la piste", 8,
                    ["reves_tires"], "toutes"),
    "reve_presage": ("Un rêve qui détourne le présage", "Le cœur de la décision", 8,
                     ["presage_detourne"], "toutes"),
    "oubli": ("Une tactique oubliée en 12", "L'oubli côté rêve", 8, ["oubli_tactique"], "toutes"),
    "apprentissage": ("Le Méchant apprend (échanges sur la piste)", "Le Méchant apprend par renforcement", 8,
                      ["echanges_piste"], "toutes"),
    "contrer": ("Contrer : une Machine arrêtée par un barrage", "Trois façons d'agir", 8,
                ["bloquee_par_barrage"], "toutes"),
    "desarmer": ("Désarmer : un organe neutralisé", "Trois façons d'agir", 8, ["organes_neutralises"], "toutes"),
    "rever": ("Rêver : un esprit qui entre ou avance, ou un rêve au Cercle", "Trois façons d'agir", 8,
              ["esprits_carte", "cercle_carte"], "toutes"),
    "alliance": ("Deux peuples alliés dans la même zone", "L'alliance", 8, [], "toutes"),
    "embuscade": ("L'embuscade", "Les reptiles, l'embuscade", 8, ["embuscades"], "reptiles"),
    "hanter": ("Un ordre hanté", "Les entités magiques", 7, ["ordres_hantes"], "entites"),
    "voir": ("Voir", "Les oiseaux, le regard", 6, ["voir"], "oiseaux"),
    "tromper": ("Tromper le Méchant", "Les humains, la parole", 6, ["tromperies"], "humains"),
}


def _variante(cle):
    """Clé de « detail » d'une synthèse : « bloc | variante | bot | params »."""
    parts = cle.split(" | ")
    return parts[1] if len(parts) > 1 else cle


def frequences(syn):
    """{variante: {mécanisme: occurrences par partie (None sans compteur)}} depuis syn["detail"], toutes les
    parties de la variante ensemble (pondérées par leur nombre)."""
    somme = defaultdict(lambda: defaultdict(float))
    n = defaultdict(int)
    for cle, a in (syn.get("detail") or {}).items():
        k = a.get("parties", 0) - a.get("erreurs", 0)
        if k <= 0:
            continue
        v = _variante(cle)
        n[v] += k
        for c, x in (a.get("stats_par_partie") or {}).items():
            somme[v][c] += x * k
    out = {}
    for v in n:
        out[v] = {}
        for m, (_, _, _, compteurs, _) in MECANISMES.items():
            out[v][m] = round(sum(somme[v][c] for c in compteurs) / n[v], 3) if compteurs else None
    return out


def alertes(freqs, seuil=SEUIL):
    out = []
    for v, f in freqs.items():
        for m, x in f.items():
            nom, idee, note, compteurs, portee = MECANISMES[m]
            if portee == "toutes" and note >= 8 and x is not None and x < seuil:
                out.append(f"**mécanisme voulu presque absent (T1, décision C4)** : {_nom(v)}, « {nom} » "
                           f"({idee}, noté {note}) : {format(x, '.2f').replace('.', ',')} par partie (seuil {str(seuil).replace('.', ',')}).")
    return out


def _nom(v):
    return "l'ancre" if v == "defaut" else (v if len(v) < 60 else v[:57] + "…")


def markdown(freqs, titre="Mécanismes voulus : fréquence par partie (T1, décision C4)"):
    vs = list(freqs)
    L = [f"## {titre}", "",
         f"*Lecture seule. Alerte sous {str(SEUIL).replace('.', ',')} occurrence par partie pour un mécanisme noté 8 ou 9 qui "
         "concerne toutes les tables. Les mécanismes propres à un peuple dépendent des tables jouées.*", "",
         "| Mécanisme | Idée (note) | " + " | ".join(_nom(v) for v in vs) + " |",
         "|---|---|" + "---|" * len(vs)]
    for m, (nom, idee, note, compteurs, portee) in MECANISMES.items():
        cases = []
        for v in vs:
            x = freqs[v].get(m)
            if x is None:
                cases.append("pas de compteur")
            else:
                t = format(x, ".2f").replace(".", ",")
                cases.append(f"**{t}** ⚠" if portee == "toutes" and note >= 8 and x < SEUIL else t)
        L.append(f"| {nom}{'' if portee == 'toutes' else f' ({portee})'} | {idee} ({note}) | " + " | ".join(cases) + " |")
    L.append("")
    al = alertes(freqs)
    L += ["**Alertes** : " + ("aucune." if not al else ""), ""] + [f"- {a}" for a in al] + ([""] if al else [])
    return "\n".join(L) + "\n"


def _lire(chemin):
    op = gzip.open if chemin.endswith(".gz") else open
    with op(chemin, "rt", encoding="utf-8") as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("syntheses", nargs="+")
    a = ap.parse_args()
    for s in a.syntheses:
        syn = _lire(s)
        print(markdown(frequences(syn), f"Mécanismes voulus : {syn.get('meta', {}).get('campagne', s)}"))


if __name__ == "__main__":
    main()
