"""Campagnes de simulation décrites en JSON (dossier campagnes/).

    python -m foret.sim campagnes/reference.json                 # maquette de la campagne
    python -m foret.sim campagnes/reference.json --maquette v0   # même campagne, autre maquette
    python -m foret.sim campagnes/reference.json --echelle 0.1   # 10 % des parties (essai rapide)

Calcul par lots (pour répartir une campagne sur plusieurs machines) :

    python -m foret.sim reference --lot 3/16 --sortie lots/       # joue le lot 3 sur 16 (numéroté de 0)
    python -m foret.sim reference --fusionner lots/ --sortie res/ # fusionne les 16 lots en une synthèse

Les parties sont réparties entre les lots par entrelacement (partie n -> lot n % N) : les lots ont
la même taille, à une partie près, et la même difficulté en moyenne. La fusion vérifie que toutes
les parties de la campagne sont présentes, une fois chacune ; la synthèse obtenue est identique à
celle d'une exécution unique (hors date et durée).

Une campagne est une liste de blocs. Un bloc croise :
- des variantes de la maquette (noms ; "defaut" = sans variante ; un nom
  inconnu de la maquette est ignoré et signalé dans la synthèse) ;
- des bots (une spécification de bot, appliquée à tous les sièges) ;
- des tables : {"tailles": [2, 3]} (toutes les combinaisons de peuples de ces
  tailles) ou {"liste": [["oiseaux", "insectes"], ...]}, chacune avec son
  nombre de parties (sinon celui du bloc).

Sorties (dossier resultats/<campagne>__<maquette>/) :
- synthese.json : agrégats par bloc, par (bloc, variante, bot), par (bloc, bot, table) ;
- erreurs.jsonl : chaque partie plantée, avec de quoi la rejouer
  (python -m foret.partie --maquette … --variante … --peuples … --bot … --graine …).
"""
import argparse
import datetime
import functools
import glob
import gzip
import itertools
import json
import os
import time
import traceback
from collections import Counter, defaultdict
from multiprocessing import Pool

from .maquette import charger, lire, resume
from .moteur import Partie, VERSION
from .bots import fabriquer_table

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------- tâches
def _tables(spec, peuples):
    if "liste" in spec:
        return [tuple(t) for t in spec["liste"]]
    out = []
    for k in spec["tailles"]:
        out += list(itertools.combinations(peuples, k))
    return out


def lire_campagne(chemin):
    if not os.path.exists(chemin):
        alt = os.path.join(RACINE, "campagnes", chemin if chemin.endswith(".json") else chemin + ".json")
        chemin = alt
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def taches(campagne, maquette, echelle=1.0):
    """Liste des parties à jouer, et variantes ignorées (absentes de la maquette)."""
    m = lire(maquette)
    peuples = list(m["peuples"])
    connues = set(m["variantes"]) | {"defaut"}
    out, ignorees = [], set()
    for bloc in campagne["blocs"]:
        for v in bloc["variantes"]:
            if v not in connues and not v.startswith(("code:", "interdire:")):
                ignorees.add(v)
                continue
            for bot in bloc["bots"]:
                for tspec in bloc["tables"]:
                    n = max(1, round(tspec.get("parties", bloc.get("parties", 100)) * echelle))
                    for table in _tables(tspec, peuples):
                        for g in range(n):
                            out.append((bloc["nom"], maquette, v, bot, table, g))
    return out, sorted(ignorees)


@functools.lru_cache(maxsize=None)
def _maquette(nom, variante):
    return charger(nom, variante)


def jouer_une(tache):
    bloc, maquette, variante, bot, peuples, graine = tache
    base = {"campagne": bloc, "maquette": maquette, "variante": variante, "bot": bot["type"],
            "bot_params": bot.get("params", {}), "peuples": list(peuples), "graine": graine}
    try:
        m = _maquette(maquette, variante)
        bots = fabriquer_table(bot, len(peuples), graine * 100)
        base.update(Partie(m, list(peuples), bots, graine=graine).jouer())
    except Exception as e:  # noqa: BLE001 - tout attraper : c'est le but de la campagne
        base["erreur"] = f"{type(e).__name__}: {e}"
        base["trace"] = traceback.format_exc(limit=8)
    return base


# ---------------------------------------------------------------- agrégation
def _moy(xs):
    xs = list(xs)
    return round(sum(xs) / len(xs), 3) if xs else None


def agreger(resultats):
    ok = [r for r in resultats if "erreur" not in r]
    n = len(ok)
    a = {"parties": len(resultats), "erreurs": len(resultats) - n}
    if not n:
        return a
    a["fin"] = {k: round(100 * v / n, 1) for k, v in Counter(r["fin"] for r in ok).most_common()}
    a["tour_fin_moyen"] = _moy(r["tour"] for r in ok)
    a["fin_tour_1_pct"] = round(100 * sum(1 for r in ok if r["tour"] == 1 and r["fin"] != "nuit") / n, 1)
    a["tours"] = dict(sorted(Counter(str(r["tour"]) for r in ok).items()))
    a["foret_moyenne"] = _moy(r["foret"] for r in ok)
    a["foret_initiale"] = ok[0]["foret_initiale"]
    a["foret_pct"] = round(100 * sum(r["foret"] for r in ok) / sum(r["foret_initiale"] for r in ok), 1)
    pcts = [100 * r["foret"] / r["foret_initiale"] for r in ok]          # moteur 1.3
    if n > 1:
        moy = sum(pcts) / n
        et = (sum((x - moy) ** 2 for x in pcts) / (n - 1)) ** 0.5
        a["foret_pct_ic95"] = round(1.96 * et / n ** 0.5, 2)            # demi-largeur de l'intervalle à 95 %
    if all("resultat" in r for r in ok):                                  # [v2:D4]
        a["resultat_pct"] = round(100 * sum(r["resultat"] for r in ok) / sum(r["foret_initiale"] for r in ok), 1)
    a["cartes_en_reve_moy"] = _moy(r["cartes_en_reve"] for r in ok)
    a["tactiques_eveil_fin"] = _moy(r["tactiques_eveil"] for r in ok)
    a["tactiques_reve_fin"] = _moy(r["tactiques_reve"] for r in ok)
    ordres = sum(r["stats"].get("ordres", 0) for r in ok)
    a["ordres_reussis_pct"] = round(100 * sum(r["stats"].get("ordres_reussis", 0) for r in ok) / max(1, ordres), 1)
    for cle in ("lacunes", "incoherences"):
        d = defaultdict(lambda: [0, 0])
        for r in ok:
            for k, v in r[cle].items():
                d[k][0] += 1
                d[k][1] += v
        a[cle] = {k: {"pct_parties": round(100 * c / n, 1), "par_partie": round(s / n, 3)}
                  for k, (c, s) in sorted(d.items(), key=lambda kv: -kv[1][0])}
    s = Counter()
    for r in ok:
        s.update(r["stats"])
    a["stats_par_partie"] = {k: round(v / n, 3) for k, v in sorted(s.items())}
    dec, forc = Counter(), Counter()
    for r in ok:
        dec.update(r.get("decisions", {}))
        forc.update(r.get("decisions_forcees", {}))
    a["decisions_par_partie"] = {k: round(v / n, 2) for k, v in sorted(dec.items())}
    a["decisions_forcees_pct"] = {k: round(100 * forc[k] / v, 1) for k, v in sorted(dec.items()) if v}
    return a


def _cle(r, champs):
    return " | ".join(json.dumps(r[c], sort_keys=True, ensure_ascii=False) if isinstance(r[c], (dict, list))
                      else str(r[c]) for c in champs)


def grouper(resultats, champs):
    g = defaultdict(list)
    for r in resultats:
        g[_cle(r, champs)].append(r)
    return g


def synthetiser(resultats, campagne, maquette, ignorees, duree, extra_meta=None):
    syn = {
        "meta": {
            "campagne": campagne.get("nom"), "maquette": resume(charger(maquette)),
            "moteur": VERSION, "date": datetime.datetime.now().isoformat(timespec="seconds"),
            "parties": len(resultats), "erreurs": sum(1 for r in resultats if "erreur" in r),
            "duree_s": round(duree), "variantes_ignorees": ignorees, "spec": campagne,
            **(extra_meta or {}),
        },
        "campagnes": {k: agreger(v) for k, v in grouper(resultats, ["campagne"]).items()},
        "detail": {k: agreger(v) for k, v in grouper(resultats, ["campagne", "variante", "bot", "bot_params"]).items()},
        "par_peuples": {k: agreger(v) for k, v in
                        grouper([r for r in resultats if r["variante"] == "defaut"],
                                ["campagne", "bot_params", "peuples"]).items()},
    }
    return syn


def _ecrire_sorties(sortie, syn, resultats):
    os.makedirs(sortie, exist_ok=True)
    with open(os.path.join(sortie, "synthese.json"), "w", encoding="utf-8") as f:
        json.dump(syn, f, ensure_ascii=False, indent=1)
    with open(os.path.join(sortie, "erreurs.jsonl"), "w", encoding="utf-8") as f:
        for r in resultats:
            if "erreur" in r:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")


def _jouer_taches(tt, processus):
    if processus == 1:
        return [jouer_une(t) for t in tt]
    with Pool(processus or os.cpu_count()) as pool:
        return pool.map(jouer_une, tt, chunksize=100)


# ---------------------------------------------------------------- une campagne entière
def lancer(campagne, maquette=None, echelle=1.0, sortie=None, processus=None, bavard=True):
    maquette = maquette or campagne.get("maquette", "v1")
    tt, ignorees = taches(campagne, maquette, echelle)
    if bavard:
        print(f"{campagne.get('nom')} sur {maquette} : {len(tt)} parties"
              + (f" (variantes ignorées : {ignorees})" if ignorees else ""), flush=True)
    t0 = time.time()
    resultats = _jouer_taches(tt, processus)
    duree = time.time() - t0
    syn = synthetiser(resultats, campagne, maquette, ignorees, duree)
    if sortie is None:
        sortie = os.path.join(RACINE, "resultats", f"{campagne.get('nom')}__{maquette}")
    _ecrire_sorties(sortie, syn, resultats)
    if bavard:
        print(f"terminé en {duree:.0f} s ; {syn['meta']['erreurs']} parties en erreur ; {sortie}", flush=True)
    return syn, resultats


# ---------------------------------------------------------------- calcul par lots
def _nom_lot(i, n):
    return f"lot_{i:04d}_sur_{n:04d}"


def lancer_lot(campagne, i, n, maquette=None, echelle=1.0, sortie=".", processus=None, bavard=True):
    """Joue le lot i (de 0 à n-1) sur n : les parties d'indice i, i+n, i+2n…
    Écrit lot_XXXX_sur_YYYY.jsonl.gz (une ligne {"n": indice, "r": résultat} par partie)
    et lot_XXXX_sur_YYYY.meta.json (nombre de parties, durée, cœurs)."""
    if not 0 <= i < n:
        raise SystemExit(f"lot {i}/{n} invalide : il faut 0 <= i < n")
    maquette = maquette or campagne.get("maquette", "v1")
    tt, ignorees = taches(campagne, maquette, echelle)
    indices = list(range(i, len(tt), n))
    if bavard:
        print(f"{campagne.get('nom')} sur {maquette}, lot {i}/{n} : {len(indices)} parties sur {len(tt)}", flush=True)
    t0 = time.time()
    resultats = _jouer_taches([tt[k] for k in indices], processus)
    duree = time.time() - t0
    os.makedirs(sortie, exist_ok=True)
    base = os.path.join(sortie, _nom_lot(i, n))
    with gzip.open(base + ".jsonl.gz", "wt", encoding="utf-8", compresslevel=6) as f:
        for k, r in zip(indices, resultats):
            f.write(json.dumps({"n": k, "r": r}, ensure_ascii=False, separators=(",", ":")) + "\n")
    meta = {"lot": i, "sur": n, "parties": len(indices), "duree_s": round(duree, 2),
            "coeurs": processus or os.cpu_count(), "erreurs": sum(1 for r in resultats if "erreur" in r),
            "total_campagne": len(tt)}
    with open(base + ".meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f)
    if bavard:
        cps = len(indices) / duree / meta["coeurs"] if duree else 0
        print(f"lot {i}/{n} terminé en {duree:.1f} s ({cps:.0f} parties/s/cœur) ; {base}.jsonl.gz", flush=True)
    return meta


def fusionner_lots(campagne, dossier, maquette=None, echelle=1.0, sortie=None, bavard=True):
    """Fusionne les lots d'un dossier en synthese.json. Échoue si une partie manque ou est en double."""
    maquette = maquette or campagne.get("maquette", "v1")
    tt, ignorees = taches(campagne, maquette, echelle)
    fichiers = sorted(glob.glob(os.path.join(dossier, "**", "lot_*.jsonl.gz"), recursive=True))
    if not fichiers:
        raise SystemExit(f"aucun lot dans {dossier}")
    par_indice = {}
    for chemin in fichiers:
        with gzip.open(chemin, "rt", encoding="utf-8") as f:
            for ligne in f:
                d = json.loads(ligne)
                if d["n"] in par_indice:
                    raise SystemExit(f"partie {d['n']} présente deux fois (lot en double ?) : {chemin}")
                par_indice[d["n"]] = d["r"]
    manquantes = [k for k in range(len(tt)) if k not in par_indice]
    en_trop = [k for k in par_indice if not 0 <= k < len(tt)]
    if manquantes or en_trop:
        raise SystemExit(f"fusion impossible : {len(manquantes)} partie(s) manquante(s) sur {len(tt)}, "
                         f"{len(en_trop)} en trop (lots incomplets, ou échelle différente ?)")
    resultats = [par_indice[k] for k in range(len(tt))]
    metas = []
    for chemin in sorted(glob.glob(os.path.join(dossier, "**", "lot_*.meta.json"), recursive=True)):
        with open(chemin, encoding="utf-8") as f:
            metas.append(json.load(f))
    duree_max = max((m["duree_s"] for m in metas), default=0)
    duree_cum = sum(m["duree_s"] * m["coeurs"] for m in metas)
    extra = {"lots": len(fichiers), "duree_cumulee_coeurs_s": round(duree_cum),
             "parties_par_s_par_coeur": round(len(tt) / duree_cum, 1) if duree_cum else None}
    syn = synthetiser(resultats, campagne, maquette, ignorees, duree_max, extra)
    if sortie is None:
        sortie = os.path.join(RACINE, "resultats", f"{campagne.get('nom')}__{maquette}")
    _ecrire_sorties(sortie, syn, resultats)
    if bavard:
        print(f"{len(fichiers)} lots fusionnés : {len(resultats)} parties, {syn['meta']['erreurs']} en erreur ; "
              f"{extra['parties_par_s_par_coeur']} parties/s/cœur ; {sortie}", flush=True)
    return syn


def _lot(texte):
    try:
        i, n = (int(x) for x in texte.split("/"))
    except ValueError:
        raise argparse.ArgumentTypeError("format attendu : i/n (par exemple 3/16)")
    return i, n


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("campagne", help="fichier JSON (ou nom dans campagnes/)")
    ap.add_argument("--maquette", help="remplace la maquette indiquée par la campagne")
    ap.add_argument("--echelle", type=float, default=1.0, help="facteur sur le nombre de parties")
    ap.add_argument("--sortie", help="dossier de sortie")
    ap.add_argument("--processus", type=int, default=None)
    ap.add_argument("--lot", type=_lot, help="ne jouer que le lot i/n et l'écrire dans --sortie")
    ap.add_argument("--fusionner", metavar="DOSSIER", help="fusionner les lots de ce dossier en une synthèse")
    args = ap.parse_args()
    campagne = lire_campagne(args.campagne)
    if args.lot and args.fusionner:
        ap.error("--lot et --fusionner s'excluent")
    if args.lot:
        i, n = args.lot
        lancer_lot(campagne, i, n, args.maquette, args.echelle, args.sortie or ".", args.processus)
    elif args.fusionner:
        fusionner_lots(campagne, args.fusionner, args.maquette, args.echelle, args.sortie)
    else:
        lancer(campagne, args.maquette, args.echelle, args.sortie, args.processus)


if __name__ == "__main__":
    main()
