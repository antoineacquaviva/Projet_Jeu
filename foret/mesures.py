"""Batterie d'évaluation : les mesures (moteur 1.4, phase 1d).

Ce module définit les mesures des niveaux 1 et 2 du plan d'action, celles des
quatre objectifs d'expérience et du garde-fou qui ne demandent pas le bot fort,
et le volet coordination. Les bandes provisoires viennent de « Objectifs,
invariants et catalogue » (section 2, décisions A5 à A9).

Trois briques :
- Mesureur : un observateur qui relève, partie par partie, ce dont les mesures
  ont besoin (menace avant chaque étape, ordres tirés, décisions, piste
  finale…). Il ne change rien à la partie (test : même bilan avec ou sans lui).
- Sondeur : un observateur qui, à des points choisis, joue des copies de la
  partie avec un autre hasard (prédictibilité, incertitude restante).
- Des fonctions d'agrégation pures (Shapley, synergies, bandes…), testées sur
  des cas construits.

Chaque mesure est décrite dans MESURES : son objectif, son étiquette (mesure,
indice, humain seulement), ses bandes, le bot dont elle a besoin, et ses
témoins : des variantes dont on connaît le défaut et le verdict attendu. Les
renvois [mesure:<id>] relient le code et les tests à cette liste
(python -m foret.conformite --mesures).
"""
import json
import math
import zlib
from collections import Counter, defaultdict
from itertools import combinations

from .moteur import CASES, PROBA
from .observateurs import Observateur

# Écart des deux dés : nombre de tirages sur 36 pour 0, 1, … 5
ECARTS = {0: 6, 1: 10, 2: 8, 3: 6, 4: 4, 5: 2}

# Lacunes qui sont des départages ou des cas particuliers à trancher à la table
CHARGE = ("egalite_critere", "egalite_arbitraire", "egalite_machine", "chemin_multiple", "egalite_rayon",
          "percee_rasee", "rayon_sans_foret", "critere_sans_cible", "percee_au_bout",
          "represailles_sans_attaque", "represailles_ancienne")

# Décisions prises en même temps par tous (conseil) ou l'une après l'autre (résolution)
SIMULTANEES = {"programmer_carte", "programmer_mode", "voir", "hote", "trace", "partage", "lune"}
SEQUENTIELLES = {"aller", "action", "embuscade", "pouvoir", "reve", "parler", "tromper"}
MISE_EN_PLACE = {"presence"}

# [mesure:duree] Hypothèses de temps (indice, à recaler sur les premiers tests humains)
TEMPS = {
    "decision": 15,          # s, décision non forcée
    "forcee": 2,             # s, décision forcée (une seule option)
    "conseil": 60,           # s, ouverture du conseil, à chaque tour
    "signe": 5,              # s, par trace posée ou jeton pris ou rendu
    "mechant": 20,           # s, par étape : dés, ordre, apprentissage
    "mise_en_place": 300,    # s, une fois
}


# =================================================================== relevés par partie
def _proba_noms(partie):
    """Probabilité de chaque tuile d'ordre (par nom), lue sur la piste des pensées."""
    p = Counter()
    for c in CASES:
        t = partie.piste[c]
        if t.genre != "esprit":
            p[t.nom] += PROBA[c]
    return p


def _proba_machines(partie):
    """[v2:A2a] Probabilité que chaque Machine soit désignée, lue sur la piste des
    Machines (doublé du favori : case 1 ; sixième Machine : case 0)."""
    if partie.R["plan"] != "qui_ou":
        return None
    double = partie._double()
    p = Counter()
    for g, n in ECARTS.items():
        if g == 0:
            if double in ("branle_bas", "hesite"):
                continue
            case = 1 if double == "favori" else 0
        else:
            case = g
        m = partie.piste_m.get(case)
        if m is not None:
            p[m.nom] += n / 36
    return p


def _hors_des_deux(p, nom):
    """Vrai si nom n'est pas parmi les deux plus probables (ex aequo du deuxième compris)."""
    vals = sorted(p.values(), reverse=True)
    if not vals:
        return False
    seuil = vals[1] if len(vals) > 1 else vals[0]
    return p.get(nom, 0) < seuil - 1e-12


def concentration(menace, k):
    """[mesure:concentration] Part de la menace portée par les k zones les plus menacées."""
    tot = sum(menace.values())
    if tot <= 0:
        return None
    return sum(sorted(menace.values(), reverse=True)[:k]) / tot


class Mesureur(Observateur):
    """[mesure:concentration] [mesure:surprise] [mesure:menace_croissante]
    [mesure:tactiques] [mesure:duree] [mesure:charge] [mesure:apprentissage]

    Relève, sans effet sur la partie, ce dont les mesures ont besoin, et
    l'écrit dans bilan["mesures"] (dict JSON compact)."""

    def __init__(self):
        self.k = None
        self.conc = [0.0, 0]                 # somme des parts, étapes
        self.surp_t = [0, 0]                 # ordres, hors des deux tactiques les plus probables
        self.surp_m = [0, 0]                 # ordres désignant une Machine, hors des deux plus probables
        self.par_tour = defaultdict(lambda: [0, 0, 0, 0, 0])   # ordres, réussis, abattues, Machines actives, étapes
        self.tactiques = defaultdict(lambda: [0, 0, 0])        # tirés, réussis, abattues
        self.machines = defaultdict(lambda: [0, 0, 0])
        self.dec = defaultdict(lambda: [0, 0])                 # type -> [décisions, forcées]
        self.dec_tour = defaultdict(lambda: defaultdict(lambda: [0, 0]))  # (tour) -> siège -> [simult., séq.] en s
        self.seq_siege = Counter()          # temps de décisions séquentielles par siège (s)
        self.non_forcees_siege = Counter()
        self.signes = 0
        self.charge = 0
        self.lacunes = Counter()
        self.reussis_points = []             # (tour, étape) des ordres réussis

    # -------------------------------------------------------------- relevés
    def point(self, partie, seg):
        if self.k is None:
            self.k = min(len(partie.sieges), len(partie.plateau.foret))
        if seg[0] != "etape":
            return
        with partie.muet():
            menace = partie.prevision()
        t = self.par_tour[seg[1]]
        t[3] += sum(1 for m in partie.machines if m.tourne)
        t[4] += 1
        c = concentration(menace, self.k)
        if c is not None:
            self.conc[0] += c
            self.conc[1] += 1

    def ordre(self, partie, info, reussite, abattues):
        tuile = info.get("tuile")
        if tuile is None:
            return
        t = self.par_tour[partie.tour]
        t[0] += 1
        t[1] += bool(reussite)
        t[2] += abattues
        nom = tuile.nom
        r = self.tactiques[nom]
        r[0] += 1
        r[1] += bool(reussite)
        r[2] += abattues
        self.surp_t[0] += 1
        self.surp_t[1] += _hors_des_deux(_proba_noms(partie), nom)
        m = info.get("machine")
        if m is not None and info.get("case_machine") is not None:
            pm = _proba_machines(partie)
            if pm:
                self.surp_m[0] += 1
                self.surp_m[1] += _hors_des_deux(pm, m.nom)
        if m is not None:
            r = self.machines[m.nom]
            r[0] += 1
            r[1] += bool(reussite)
            r[2] += abattues

    def decision(self, partie, siege, type_, options, indice, ctx, impose):
        forcee = len(options) == 1
        d = self.dec[type_]
        d[0] += 1
        d[1] += forcee
        if type_ in MISE_EN_PLACE:
            return
        s = TEMPS["forcee"] if forcee else TEMPS["decision"]
        if not forcee:
            self.non_forcees_siege[siege.idx] += 1
        if type_ in ("trace", "partage", "lune") and options[indice] is not None:
            self.signes += 1
        if type_ in SIMULTANEES:
            self.dec_tour[partie.tour][siege.idx][0] += s
        else:
            self.dec_tour[partie.tour][siege.idx][1] += s
            self.seq_siege[siege.idx] += s

    def evenement(self, partie, categorie, code, n, detail):
        if categorie == "lacune":
            self.lacunes[code] += n
            if code in CHARGE:
                self.charge += n

    # -------------------------------------------------------------- écriture
    def fin(self, partie, bilan):
        n = len(partie.sieges)
        # durée estimée (indice) : conseil (le plus lent des joueurs) + résolution (séquentielle)
        t_conseil = t_seq = 0.0
        for tour, par_siege in self.dec_tour.items():
            t_conseil += TEMPS["conseil"] + max((v[0] for v in par_siege.values()), default=0)
            t_seq += sum(v[1] for v in par_siege.values())
        t_conseil += TEMPS["signe"] * self.signes
        etapes = sum(v[4] for v in self.par_tour.values())
        t_mechant = TEMPS["mechant"] * etapes
        total = TEMPS["mise_en_place"] + t_conseil + t_seq + t_mechant
        attente = [(t_seq - self.seq_siege[i]) / total for i in range(n)] if total else [0] * n
        bilan["mesures"] = {
            "k": self.k,
            "conc": [round(self.conc[0], 4), self.conc[1]],
            "surp_t": self.surp_t, "surp_m": self.surp_m,
            "par_tour": {str(k): v for k, v in sorted(self.par_tour.items())},
            "tactiques": dict(self.tactiques), "machines": dict(self.machines),
            "dec": dict(self.dec),
            "non_forcees_siege": [self.non_forcees_siege[i] for i in range(n)],
            "temps_s": round(total), "attente": [round(a, 3) for a in attente],
            "charge": self.charge,
            "piste": [partie.piste[c].nom for c in CASES],
            "piste_m": [(partie.piste_m[c].nom if partie.piste_m.get(c) is not None else None)
                        for c in sorted(partie.piste_m)] if getattr(partie, "piste_m", None) else None,
            "cercle": len(partie.cercle),
        }


class Sondeur(Observateur):
    """[mesure:predictibilite] [mesure:incertitude]

    Aux points choisis (début d'un segment), joue `copies` copies de la partie
    avec un autre hasard (mêmes bots) jusqu'au bout et note la forêt restante
    de chacune (en % de la forêt initiale). bilan["sondes"] = {nom: [..]}."""

    def __init__(self, points, copies=16, graine=0, politique=None):
        self.points = dict(points)           # segment -> nom
        self.copies = copies
        self.graine = graine
        self.politique = politique           # bot des copies (None : les bots de la partie) ; phase 3 :
        self.sondes = {}                     # le glouton, pour que le bot fort ne joue pas 16 suites entières

    def point(self, partie, seg):
        nom = self.points.get(seg)
        if nom is None:
            return
        out = []
        for r in range(self.copies):
            h = self.graine * 7919 + r * 104729 + zlib.crc32(nom.encode()) % 1000
            bots = None
            if self.politique is not None:
                from .bots import fabriquer
                bots = [fabriquer(self.politique, h + k) for k in range(len(partie.sieges))]
            c = partie.copie(bots=bots, hasard=h)
            b = c.jouer()
            out.append(round(100 * b["resultat"] / b["foret_initiale"], 2))
        self.sondes[nom] = out

    def fin(self, partie, bilan):
        bilan["sondes"] = self.sondes


# =================================================================== agrégation
def moyenne(xs):
    xs = list(xs)
    return sum(xs) / len(xs) if xs else None


def variance(xs):
    xs = list(xs)
    if len(xs) < 2:
        return 0.0
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)


def ic95(xs):
    xs = list(xs)
    return 1.96 * math.sqrt(variance(xs) / len(xs)) if len(xs) > 1 else None


def shapley(v, joueurs):
    """[mesure:shapley] Valeur de Shapley exacte. v : dict frozenset -> valeur,
    défini pour toutes les coalitions (vide comprise)."""
    n = len(joueurs)
    f = math.factorial
    out = {}
    for i in joueurs:
        autres = [j for j in joueurs if j != i]
        s = 0.0
        for k in range(n):
            w = f(k) * f(n - k - 1) / f(n)
            for S in combinations(autres, k):
                S = frozenset(S)
                s += w * (v[S | {i}] - v[S])
        out[i] = s
    return out


def shapley_restreint(v, joueurs):
    """[mesure:shapley] Plan réduit de la phase 3 (seules les tables de 1 et 2 peuples sont jouées
    pour tous les peuples) : la moyenne des contributions marginales d'un peuple quand il arrive
    en premier ou en deuxième, c'est-à-dire la valeur de Shapley du jeu arrêté aux tables de deux.
    φ_i = ½ [v(i) − v(∅)] + ½ moyenne_j [v(i, j) − v(j)]. Approximation documentée dans
    docs/mesures.md ; elle coïncide avec Shapley quand les tables de 3 peuples et plus
    n'ajoutent rien de propre à chaque peuple."""
    vide = v[frozenset()]
    out = {}
    for i in joueurs:
        seul = v[frozenset((i,))] - vide
        duos = [v[frozenset((i, j))] - v[frozenset((j,))] for j in joueurs if j != i]
        out[i] = 0.5 * seul + 0.5 * sum(duos) / len(duos)
    return out


# =================================================================== mesures du bot fort (phase 3)
def _ecart(a, b):
    """Écart des moyennes de deux échantillons (a - b) et sa marge à 95 %."""
    a, b = list(a), list(b)
    marge = 1.96 * ((variance(a) / len(a)) + (variance(b) / len(b))) ** 0.5 if len(a) > 1 and len(b) > 1 else None
    return moyenne(a) - moyenne(b), marge


def _meilleur(par_taux):
    """Le taux dont la moyenne est la plus haute : (taux, échantillon)."""
    t = max(par_taux, key=lambda k: moyenne(par_taux[k]))
    return t, par_taux[t]


def tape_taupe(fort, taupe_par_taux):
    """[mesure:tape_taupe] Écart, en points de forêt, entre le bot fort et un bot qui pare toujours
    la menace la plus probable : le glouton (saboter si possible, sinon barrer la zone la plus
    menacée), pris à son meilleur taux de rêve fixe, sur les mêmes tables.
    fort : forêts (%) du bot fort ; taupe_par_taux : {taux: forêts (%) du glouton}.
    Petit écart : parer au plus probable suffit, les critères du Méchant ne sont pas en tension."""
    t, taupe = _meilleur(taupe_par_taux)
    d, marge = _ecart(fort, taupe)
    return {"fort": moyenne(fort), "taupe": moyenne(taupe), "taux_taupe": t, "ecart": d, "marge": marge,
            "verdict": verdict("tape_taupe", d)}


def gain_libre(libre, par_taux):
    """[mesure:gain_libre] Gain (%) du bot fort libre sur le même bot à son meilleur taux de rêve
    fixe : 100 (libre − meilleur fixe) / meilleur fixe. Petit gain : une stratégie pure
    (toujours rêver autant) vaut le jeu au cas par cas, le dilemme est tranché d'avance."""
    t, fixe = _meilleur(par_taux)
    d, marge = _ecart(libre, fixe)
    m = moyenne(fixe)
    g = 100 * d / m if m else None
    return {"libre": moyenne(libre), "meilleur_fixe": m, "taux": t, "gain": g,
            "marge": 100 * marge / m if (marge is not None and m) else None,
            "verdict": verdict("gain_libre", g) if g is not None else None}


def chef_unique(central, soi):
    """[mesure:chef] Gain (%) d'un chef unique (bot fort central, qui voit tout et décide pour
    tous) sur « chacun pour soi » (le même bot, qui ne sait que ce que sait son siège et
    communique selon la maquette) : 100 (central − soi) / soi."""
    d, marge = _ecart(central, soi)
    m = moyenne(soi)
    g = 100 * d / m if m else None
    return {"central": moyenne(central), "soi": m, "gain": g,
            "marge": 100 * marge / m if (marge is not None and m) else None,
            "verdict": verdict("chef", g) if g is not None else None}


def _bloc(syn, bloc, variante):
    """L'agrégat d'une synthèse de campagne (foret.sim) pour un bloc et une variante (un seul bot)."""
    for k, a in syn.get("detail", {}).items():
        morceaux = k.split(" | ")
        if morceaux[0] == bloc and morceaux[1] == variante:
            return a
    return None


def _moy_ic(a):
    return a.get("resultat_pct", a["foret_pct"]), a.get("foret_pct_ic95") or 0.0


def chef_depuis_synthese(syn, variante="defaut"):
    """[mesure:chef] Gain du chef unique dans une campagne à deux blocs, « central » (variante
    defaut) et « soi » (la variante demandée : defaut pour la mesure, comm_tout_dire pour le
    témoin), comme coordination_mc_2. La marge combine les demi-intervalles à 95 % des deux."""
    c, s = _bloc(syn, "central", "defaut"), _bloc(syn, "soi", variante)
    if not c or not s:
        return None
    (mc, ic_c), (ms, ic_s) = _moy_ic(c), _moy_ic(s)
    g = 100 * (mc - ms) / ms
    return {"central": mc, "soi": ms, "gain": round(g, 2),
            "marge": round(100 * (ic_c ** 2 + ic_s ** 2) ** 0.5 / ms, 2), "verdict": verdict("chef", g)}


def coordination_depuis_synthese(syn, bloc="soi"):
    """[mesure:coordination] Part de l'écart « aucun signe → tout dire » récupérée par la
    communication de la maquette, dans une campagne qui joue les trois (bloc « soi »)."""
    a, f, t = (_bloc(syn, bloc, v) for v in ("comm_aucun_signe", "defaut", "comm_tout_dire"))
    if not (a and f and t):
        return None
    (ma, ia), (mf, _), (mt, it) = _moy_ic(a), _moy_ic(f), _moy_ic(t)
    ecart, marge = mt - ma, (ia ** 2 + it ** 2) ** 0.5
    part = 100 * (mf - ma) / ecart if ecart > marge else None
    return {"aucun_signe": ma, "forme": mf, "tout_dire": mt, "ecart": round(ecart, 2), "marge": round(marge, 2),
            "part": None if part is None else round(part, 1),
            "verdict": verdict("coordination", part) if part is not None else "non mesurable"}


def jeu_restreint_depuis_synthese(syn, peuples=("oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites")):
    """[mesure:jeu_restreint] Perte (points de forêt) quand une action ou une moitié de carte est
    interdite (variantes « interdire:… »), par rapport au même bot sans restriction (bloc
    « reference »), sur les mêmes tables : toutes celles du bloc « reference » pour un bloc qui
    ne porte pas le nom d'un peuple, sinon celles qui comptent ce peuple. Perte nulle : l'élément
    est inutile ou remplaçable ; perte énorme : il est indispensable, peut-être dominant."""
    ref = {}
    for k, a in syn.get("par_peuples", {}).items():
        morceaux = k.split(" | ")
        if morceaux[0] == "reference":
            ref[frozenset(json.loads(morceaux[-1]))] = _moy_ic(a)[0]
    r_all = _bloc(syn, "reference", "defaut")
    if not ref or not r_all:
        return None
    ic_ref = _moy_ic(r_all)[1]
    out = {}
    for k, a in syn["detail"].items():
        bloc, var = k.split(" | ")[:2]
        if not var.startswith("interdire:"):
            continue
        tables = [t for t in ref if bloc not in peuples or bloc in t]
        if not tables:
            continue
        m_ref = sum(ref[t] for t in tables) / len(tables)
        m, ic = _moy_ic(a)
        out[var[len("interdire:"):]] = {
            "perte": round(m_ref - m, 2), "reference": round(m_ref, 1), "restreint": round(m, 1),
            "marge": round((ic ** 2 + (ic_ref ** 2) * len(ref) / len(tables)) ** 0.5, 2), "tables": len(tables)}
    return out


# [mesure:dilemmes] Seuils de classement des décisions, en points de forêt (% de la forêt
# initiale). Provisoires (13 oct.) : à confirmer par l'auteur avec les premiers résultats.
PROCHE, NET = 1.0, 3.0
HORS_DILEMMES = {"trace", "partage"}      # communication : le bot ne la valorise pas (voir part_dilemmes)


def classer_decision(valeurs, proche=PROCHE, net=NET):
    """[mesure:dilemmes] Classe une décision d'après la valeur estimée de chaque option (forêt
    finale moyenne, en %, quand on la prend) :
    - forcée : une seule option ;
    - indifférente : la meilleure et la pire sont à moins de `net` points (tout se vaut) ;
    - dilemme : au moins deux options à moins de `proche` points de la meilleure ;
    - évidente : sinon (une option écrase les autres)."""
    if len(valeurs) < 2:
        return "forcee"
    haut = max(valeurs)
    if haut - min(valeurs) < net:
        return "indifferente"
    if sum(1 for v in valeurs if v >= haut - proche) >= 2:
        return "dilemme"
    return "evidente"


def part_dilemmes(jugements, proche=PROCHE, net=NET):
    """[mesure:dilemmes] Part (%) des dilemmes parmi les décisions non forcées jugées, et le détail
    par classe et par type de décision. jugements : [{"type": ..., "valeurs": [...]}, ...].
    La mise en place (placer sa présence) est détaillée par type mais hors de la part : elle
    n'est pas un choix du jeu en cours. Les traces et le partage aussi (13 oct.) : sans le réglage
    « annonces », personne ne les lit dans les suites du bot, toutes leurs options se valent et
    elles gonfleraient les décisions indifférentes."""
    classes = Counter()
    par_type = defaultdict(Counter)
    for j in jugements:
        c = classer_decision(j["valeurs"], proche, net)
        par_type[j["type"]][c] += 1
        if j["type"] not in MISE_EN_PLACE | HORS_DILEMMES:
            classes[c] += 1
    n = sum(v for k, v in classes.items() if k != "forcee")
    part = 100 * classes["dilemme"] / n if n else None
    return {"decisions": n, "part": part,
            "classes": {k: round(100 * classes[k] / n, 1) if n else None
                        for k in ("dilemme", "evidente", "indifferente")},
            "par_type": {t: {"n": sum(c.values()), "dilemme": round(100 * c["dilemme"] / sum(c.values()), 1)}
                         for t, c in sorted(par_type.items())},
            "seuils": {"proche": proche, "net": net},
            "verdict": verdict("dilemmes", part) if part is not None else None}


def synergies(v, joueurs):
    """[mesure:synergies] v(i, j) - v(i) - v(j) + v(∅), pour chaque paire."""
    vide = v[frozenset()]
    return {(a, b): v[frozenset((a, b))] - v[frozenset((a,))] - v[frozenset((b,))] + vide
            for a, b in combinations(joueurs, 2)}


def duo_contre_meilleur_seul(solo, duos):
    """[mesure:synergies] Décision B2 : pour chaque duo, sa forêt moins celle du meilleur de ses
    deux peuples joué seul. Positif : « aucun ne suffit » tient pour ce duo."""
    return {k: v - max(solo[k[0]], solo[k[1]]) for k, v in duos.items()}


def synergies_relatives(duos):
    """[mesure:synergies] Décision B2 (test du tétraèdre) : écart de chaque duo à ce qu'annoncent
    ses deux peuples dans les autres duos (v(i,j) - v̄i - v̄j + v̄)."""
    vbar = sum(duos.values()) / len(duos)
    peuples = sorted({p for k in duos for p in k})
    vi = {p: sum(v for k, v in duos.items() if p in k) / sum(1 for k in duos if p in k) for p in peuples}
    return {k: v - vi[k[0]] - vi[k[1]] + vbar for k, v in duos.items()}


def duos_complets(maquette):
    """Paires de peuples qui couvrent les quatre compartiments (le tétraèdre)."""
    comp = {p: {spec["haut"]["compartiment"], spec["bas"]["compartiment"]}
            for p, spec in maquette["peuples"].items()}
    tous = set().union(*comp.values())
    return {tuple(sorted((a, b))) for a, b in combinations(sorted(comp), 2) if comp[a] | comp[b] == tous}


def exactitude_equilibree(predits, reels, seuil):
    """Exactitude équilibrée de la règle « prédit > seuil » pour « réel > seuil »."""
    vp = sum(1 for p, r in zip(predits, reels) if p > seuil and r > seuil)
    fn = sum(1 for p, r in zip(predits, reels) if p <= seuil and r > seuil)
    vn = sum(1 for p, r in zip(predits, reels) if p <= seuil and r <= seuil)
    fp = sum(1 for p, r in zip(predits, reels) if p > seuil and r <= seuil)
    if vp + fn == 0 or vn + fp == 0:
        return None
    return (vp / (vp + fn) + vn / (vn + fp)) / 2


def auc(predits, reels, seuil):
    """Probabilité qu'une partie au-dessus du seuil ait une prédiction plus haute
    qu'une partie au-dessous (0,5 : aucune information ; 1 : tout est joué)."""
    haut = [p for p, r in zip(predits, reels) if r > seuil]
    bas = [p for p, r in zip(predits, reels) if r <= seuil]
    if not haut or not bas:
        return None
    s = 0.0
    for h in haut:
        for b in bas:
            s += 1.0 if h > b else (0.5 if h == b else 0.0)
    return s / (len(haut) * len(bas))


def distance_pistes(a, b):
    """[mesure:apprentissage] Nombre de cases dont la tuile diffère."""
    return sum(1 for x, y in zip(a, b) if x != y)


def quantile(xs, q):
    xs = sorted(xs)
    if not xs:
        return None
    i = (len(xs) - 1) * q
    lo, hi = math.floor(i), math.ceil(i)
    return xs[lo] + (xs[hi] - xs[lo]) * (i - lo)


# =================================================================== bandes
# ------------------------------------------------------------------ choix morts et apprentissage (plan vers la V1, 0.5 et 0.6)
SEUIL_PRIS = 5.0          # % : en dessous, un élément offert est presque jamais pris
OFFERT_MIN = 20           # occasions au moins pour juger


def choix_morts(usage, pertes=None, seuil_pris=SEUIL_PRIS, offert_min=OFFERT_MIN):
    """[mesure:choix_morts] Un élément de choix est « mort » si le bot fort ne le prend presque jamais quand
    il est offert (moins de seuil_pris %), ou si l'interdire ne coûte rien de mesurable (perte au jeu
    restreint « négligeable », foret/stats.py). usage : agrégat {clé: {"offert", "pris"}} ; pertes : {clé:
    verdict apparié} (facultatif). Rend {"morts": [...], "n": nombre, "detail": {clé: raison}}."""
    detail = {}
    for k, u in (usage or {}).items():
        if u["offert"] >= offert_min and 100 * u["pris"] / u["offert"] < seuil_pris:
            detail[k] = f"pris {100 * u['pris'] / u['offert']:.1f} % des fois offert"
    for k, v in (pertes or {}).items():
        if v == "négligeable":
            detail[k] = (detail[k] + " ; " if k in detail else "") + "l'interdire ne coûte rien"
    return {"morts": sorted(detail), "n": len(detail), "detail": detail}


def gain_apprentissage(ecart_apparie):
    """[mesure:apprentissage_mechant] Points de forêt que l'apprentissage fait gagner au Méchant : forêt du
    témoin « Méchant qui n'apprend plus » moins forêt de la maquette, apparié (mêmes tables, mêmes graines).
    ecart_apparie : écart (témoin − maquette) tel que rendu par foret.stats.ecart_apparie."""
    if not ecart_apparie or ecart_apparie.get("ecart") is None:
        return None
    return {"gain": ecart_apparie["ecart"], "ic95": ecart_apparie["ic95"], "verdict_ecart": ecart_apparie["verdict"]}


def intervalle(lo=None, hi=None):
    return (lo, hi)


def dans(x, iv):
    lo, hi = iv
    return (lo is None or x >= lo) and (hi is None or x <= hi)


def bande(x, vert, rouge):
    """Verdict d'une valeur : vert si dans l'intervalle vert, rouge si dans l'un
    des intervalles rouges, orange sinon. None si la valeur manque."""
    if x is None:
        return None
    if dans(x, vert):
        return "vert"
    if any(dans(x, r) for r in rouge):
        return "rouge"
    return "orange"


# Bandes provisoires (phase 0, A6 à A9). Les seuils rouges stricts (« moins de 35 % »)
# s'écrivent avec une borne exclue approchée par un epsilon.
E = 1e-9
MESURES = {
    # ---------------------------------------------------------------- niveau 1
    "robustesse": dict(
        niveau=1, objectif="filtre", nom="Robustesse : parties plantées et incohérences",
        etiquette="mesure", unite="par partie", bot="tous",
        vert=(0, 0), rouge=[(E, None)],
        temoins=[("v1", "retour_v0_barrage", "glouton", "incoherences > 0 (barrage contourné)")]),
    "lacunes": dict(
        niveau=1, objectif="filtre", nom="Lacunes : questions que la table se posera",
        etiquette="mesure", unite="par partie", bot="tous", descriptive=True, temoins=[]),
    "couverture": dict(
        niveau=1, objectif="filtre", nom="Couverture : part des parties où chaque règle s'applique",
        etiquette="indice", unite="% des parties", bot="glouton", descriptive=True,
        temoins=[("v1", "sans_pouvoirs", "glouton", "aucun pouvoir appliqué")]),
    "charge": dict(
        niveau=1, objectif="filtre", nom="Charge de règles : départages et cas particuliers",
        etiquette="mesure", unite="par partie", bot="tous", descriptive=True, temoins=[]),
    "duree": dict(
        niveau=1, objectif="lecture", nom="Durée estimée",
        etiquette="indice", unite="min", bot="glouton", descriptive=True, temoins=[]),
    "attente": dict(
        niveau=1, objectif="lecture", nom="Attente et densité",
        etiquette="indice", unite="% du temps ; décisions par heure", bot="glouton", descriptive=True,
        temoins=[]),
    "forcees": dict(
        niveau=1, objectif="lecture", nom="Choix forcés",
        etiquette="indice", unite="% des décisions", bot="glouton", descriptive=True, temoins=[]),
    # ---------------------------------------------------------------- objectif 1
    "concentration": dict(
        niveau=2, objectif="1", nom="Concentration de la menace sur les k zones les plus menacées",
        etiquette="mesure", unite="%", bot="tous",
        vert=(50, 80), rouge=[(None, 35 - E), (90 + E, None)],
        temoins=[("v1", "temoin_une_tactique", "glouton", "rouge (résolue)"),
                 ("v2", "temoin_une_tactique", "glouton", "rouge (résolue)")]),
    "surprise": dict(
        niveau=2, objectif="1", nom="Surprise : ordres hors des deux tactiques les plus probables",
        etiquette="mesure", unite="%", bot="tous",
        vert=(20, 45), rouge=[(None, 10 - E), (60 + E, None)],
        temoins=[("v1", "temoin_une_tactique", "glouton", "rouge (aucune surprise)"),
                 ("v2", "temoin_une_tactique", "glouton", "rouge (aucune surprise)")]),
    "tape_taupe": dict(
        niveau=3, objectif="1", nom="Tape-taupe : écart entre parer la menace la plus probable et le bot fort",
        etiquette="indice", unite="points de forêt", bot="fort (MC 64) et glouton",
        vert=(10, None), rouge=[(None, 3 - E)],
        temoins=[("v1", "temoin_une_tactique", "MC 64 et glouton", "écart plus petit que dans la v1")]),
    # ---------------------------------------------------------------- objectif 2
    "reve_fixe": dict(
        niveau=2, objectif="2", nom="Meilleur taux de rêve fixe",
        etiquette="indice", unite="cartes par tour", bot="glouton (puis fort)", categorique=True,
        temoins=[("v1", "retour_v0_reves_illimites", "glouton", "rouge (le maximum)")]),
    "gain_libre": dict(
        niveau=2, objectif="2", nom="Gain du bot libre sur le meilleur taux fixe",
        etiquette="indice", unite="%", bot="fort (MC 64)",
        vert=(5, None), rouge=[(None, 1 - E)],
        temoins=[("v1", "temoin_sans_reve", "MC 64", "rouge (aucun rêve possible : tous les taux se valent)")]),
    "choix_morts": dict(
        niveau=3, objectif="2", nom="Choix morts : éléments presque jamais pris, ou qu'on interdit sans perte",
        etiquette="indice", unite="éléments", bot="fort (puis contrôle)",
        vert=(0, 0), rouge=[(3, None)],
        temoins=[("v1", "temoin_mammiferes_sans_pouvoir", "fort", "Tenir et Renverser comptés morts")]),
    "apprentissage_mechant": dict(
        niveau=3, objectif="1", nom="Gain d'apprentissage du Méchant (témoin sans apprentissage − maquette)",
        etiquette="indice", unite="points de forêt", bot="fort (puis contrôle)",
        vert=(5, None), rouge=[(None, 1 - E)],
        temoins=[("v0.3", "temoin_une_tactique", "fort", "gain plus petit que celui de la V0.3 (une seule tactique : moins à réordonner)")]),
    "dilemmes": dict(
        niveau=3, objectif="2", nom="Dilemmes parmi les décisions non forcées (REMPLACÉE par profil_delta, décision C3)",
        etiquette="indice", unite="%", bot="fort (MC 64, sur échantillon)", remplacee_par="profil_delta",
        vert=(30, None), rouge=[(None, 10 - E)],
        temoins=[("v1", "temoin_essoufflement", "MC 64", "plus de décisions indifférentes que la v1 (supposé)")]),
    # Décisions C2 à C4 (14 oct.) : leçon du rêve (projet/3-pilotage/choix-strategique.md), lecture seule.
    "profil_delta": dict(
        niveau=3, objectif="2", nom="Profil de Δ : part des situations où chaque option gagne nettement (T4)",
        etiquette="indice", unite="% des situations ; régime (disputé, dominé, indifférent)",
        bot="fort (jugements étiquetés, manche 2 de la confirmation)", descriptive=True,
        bandes_proposees={"vert": "chaque côté ≥ 20 %, neutre ≤ 50 %", "rouge": "un côté < 5 % ou neutre > 80 %"},
        temoins=[("v0.3", "defaut", "MC64R", "rêver ou défendre : dominé par rêver"),
                 ("v0.4", "defaut", "MC64R", "rêver ou défendre : dominé par défendre, ou indifférent")]),
    "lisibilite": dict(
        niveau=3, objectif="2", nom="Lisibilité : un, puis deux indices publics prédisent l'option gagnante (T5)",
        etiquette="indice", unite="% bien prédits (validation croisée)", bot="fort (jugements étiquetés)",
        descriptive=True,
        bandes_proposees={"vert": "un indice ≥ 65 % et gain du deuxième ≥ 5 points, plafond < 95 %",
                          "rouge": "un indice au niveau du hasard"}, temoins=[]),
    "mecanismes": dict(
        niveau=1, objectif="garde-fou", nom="Mécanismes voulus : fréquence par partie (T1)",
        etiquette="mesure", unite="occurrences par partie", bot="tous", descriptive=True,
        bandes_proposees={"alerte": "moins de 0,5 par partie pour un mécanisme noté 8 ou 9 qui concerne toutes les tables"},
        temoins=[("v0.4", "defaut", "MC64R", "tir à la corde presque absent (0,05 à 0,09 par partie)")]),
    # ---------------------------------------------------------------- objectif 3
    "shapley": dict(
        niveau=2, objectif="3", nom="Contributions de Shapley des six peuples (rapport à la moyenne)",
        etiquette="mesure", unite="× la moyenne", bot="glouton (puis fort)",
        temoins=[("v1", "temoin_hanter_illimite", "glouton", "rouge (les entités gagnent seules)"),
                 ("v2", "temoin_hanter_illimite", "glouton", "rouge (les entités gagnent seules)"),
                 ("v1", "temoin_mammiferes_sans_pouvoir", "glouton", "mammifères sous la moyenne")]),
    "synergies": dict(
        niveau=2, objectif="3", nom="Synergies : duos qui battent leur meilleur peuple seul (décision B2)",
        etiquette="mesure", unite="duos sur 15", bot="glouton (puis fort)",
        vert=(12, None), rouge=[(None, 8 - E)],
        temoins=[("v1", "temoin_hanter_illimite", "glouton", "rouge (un peuple suffit : saturation)")]),
    "pire_table": dict(
        niveau=2, objectif="3", nom="Pire table / meilleure table (duos et trios)",
        etiquette="mesure", unite="%", bot="glouton (puis fort)",
        vert=(70, None), rouge=[(None, 50 - E)],
        temoins=[("v1", "temoin_hanter_illimite", "glouton", "hors du vert")]),
    "spectateur": dict(
        niveau=2, objectif="3", nom="Aucun spectateur : perte quand un peuple ne fait rien",
        etiquette="indice", unite="× l'impact moyen", bot="glouton (puis fort)",
        vert=(0.5, None), rouge=[(None, 0.25 - E)],
        temoins=[("v1", "temoin_spectateur", "glouton", "rouge (les humains ne font rien)")]),
    "coordination": dict(
        niveau=2, objectif="3", nom="Coordination : part de l'écart « aucun signe → tout dire » récupérée",
        etiquette="indice", unite="%", bot="glouton (puis fort)",
        vert=(40, 80), rouge=[(None, 20 - E), (95 + E, None)],
        temoins=[("v1", "comm_aucun_signe", "glouton", "0 % par définition"),
                 ("v1", "comm_tout_dire", "glouton", "100 % par définition")]),
    "chef": dict(
        niveau=3, objectif="3", nom="Gain d'un chef unique sur « chacun pour soi »",
        etiquette="indice", unite="%", bot="fort (MC 64 central et chacun pour soi)",
        vert=(5, 20), rouge=[(None, 2 - E), (35 + E, None)],
        temoins=[("v1", "comm_tout_dire", "MC 64", "rouge (tout se dit : un chef n'apporte rien)")]),
    "fins": dict(
        niveau=2, objectif="lecture", nom="Équilibre des fins",
        etiquette="indice", unite="% des parties", bot="glouton (puis fort)", descriptive=True,
        temoins=[("v1", "retour_v0_reves_illimites", "glouton rêve 3", "la nuit disparaît")]),
    "tactiques": dict(
        niveau=2, objectif="lecture", nom="Tactiques et Machines du Méchant : réussite et dégâts",
        etiquette="indice", unite="% réussis ; forêts par ordre", bot="glouton (puis fort)", descriptive=True,
        temoins=[("v1", "temoin_une_tactique", "glouton", "une seule tactique tirée")]),
    # ---------------------------------------------------------------- objectif 4
    "predictibilite": dict(
        niveau=2, objectif="4", nom="Partie jouée d'avance : issue prédite à la fin du tour 2",
        etiquette="mesure", unite="% (exactitude équilibrée)", bot="glouton (puis fort)",
        vert=(None, 65), rouge=[(80 + E, None)],
        temoins=[("v1", "temoin_des_fixes", "glouton", "rouge (tout est joué)"),
                 ("v2", "temoin_des_fixes", "glouton", "rouge (tout est joué)")]),
    "incertitude": dict(
        niveau=2, objectif="4", nom="Incertitude restante au début du dernier tiers",
        etiquette="mesure", unite="part de l'incertitude initiale", bot="glouton (puis fort)",
        vert=(0.5, None), rouge=[(None, 0.25 - E)],
        temoins=[("v1", "temoin_des_fixes", "glouton", "rouge (plus rien à décider)"),
                 ("v2", "temoin_des_fixes", "glouton", "rouge (plus rien à décider)")]),
    "fins_precoces": dict(
        niveau=2, objectif="4", nom="Fins avant la mi-partie (tours 1 à 3)",
        etiquette="mesure", unite="% des parties", bot="glouton (puis fort)",
        vert=(None, 20), rouge=[(40 + E, None)],
        temoins=[("v1", "retour_v0_reves_illimites", "glouton rêve 3", "rouge")]),
    "menace_croissante": dict(
        niveau=2, objectif="4", nom="Menace croissante : dernier tiers / premier tiers",
        etiquette="mesure", unite="rapport", bot="glouton (puis fort)",
        vert=(1, None), rouge=[(None, 2 / 3 - E)],
        temoins=[("v1", "temoin_essoufflement", "glouton", "rouge (le Méchant s'essouffle)"),
                 ("v2", "temoin_essoufflement", "glouton", "rouge (le Méchant s'essouffle)")]),
    # ---------------------------------------------------------------- niveau 3 : actions sans intérêt
    "jeu_restreint": dict(
        niveau=3, objectif="lecture", nom="Jeu restreint : perte quand une action ou une moitié de carte est interdite",
        etiquette="indice", unite="points de forêt", bot="fort (MC 64)", descriptive=True, temoins=[]),
    # ---------------------------------------------------------------- garde-fou
    "plancher": dict(
        niveau=2, objectif="garde-fou", nom="Plancher : forêt gardée par le pire décile",
        etiquette="mesure", unite="%", bot="glouton (puis fort)",
        vert=(40, None), rouge=[(None, 25 - E)],
        temoins=[("v1", "temoin_assaut", "glouton", "plus bas que la v1")]),
    "echelle_bots": dict(
        niveau=2, objectif="garde-fou", nom="Échelle des bots : aléatoire < glouton (< MCTS en phase 2)",
        etiquette="mesure", unite="points de forêt", bot="aléatoire, glouton", categorique=True, temoins=[],
        phase2=True),
    # ---------------------------------------------------------------- garde-fou C1 (14 oct., lecture seule ; foret/boucles.py)
    # Les quatre mesures sont descriptives tant que l'auteur n'a pas confirmé les bandes proposées.
    "boucle_gagnante": dict(
        niveau=3, objectif="garde-fou", nom="Écart entre le bot fort et la meilleure stratégie répétée (pire taille)",
        etiquette="indice", unite="points de forêt", bot="bibliothèque (repete) et fort, appariés", descriptive=True,
        bandes_proposees={"vert": (10, None), "rouge": [(None, 3 - E)]},
        temoins=[("v2", "défaut (V2 proposée, sans lunes)", "bibliothèque et MC64R", "rouge (rêver à chaque tour domine)"),
                 ("v1", "retour_v0_reves_illimites", "bibliothèque et MC 64", "rouge (rêver sans limite suffit)")]),
    "convention_table": dict(
        niveau=3, objectif="garde-fou", nom="Aucune convention de table ne suffit (pire composition)",
        etiquette="indice", unite="points de forêt", bot="conventions (tables mixtes de repete) et fort", descriptive=True,
        bandes_proposees={"vert": (10, None), "rouge": [(None, 3 - E)]}, temoins=[]),
    "action_suffit": dict(
        niveau=3, objectif="garde-fou", nom="Une action ne suffit pas (« X partout » rapporté au bot fort)",
        etiquette="indice", unite="points de forêt ; part du bot fort", bot="bibliothèque et fort", descriptive=True,
        bandes_proposees={"vert": "au plus 90 % du bot fort", "rouge": "à moins de 3 points du bot fort"}, temoins=[]),
    "echelle_lecture": dict(
        niveau=3, objectif="garde-fou", nom="Échelle de la lecture : boucle ouverte → réflexe → bot fort",
        etiquette="indice", unite="points de forêt (plus petite marche)", bot="bibliothèque, gloutons, fort", descriptive=True,
        bandes_proposees={"vert": (3, None), "rouge": [(None, 1 - E)]}, temoins=[]),
    "apprentissage": dict(
        niveau=3, objectif="lecture", nom="Le Méchant apprend-il cette équipe ? (pistes finales)",
        etiquette="indice", unite="cases", bot="glouton (puis fort)", descriptive=True,
        temoins=[("v1", "temoin_sans_apprentissage", "glouton", "distance nulle"),
                 ("v2", "temoin_sans_apprentissage", "glouton", "distance nulle")]),
}


def verdict(cle, x):
    spec = MESURES[cle]
    if "vert" not in spec:
        return None
    return bande(x, spec["vert"], spec["rouge"])
