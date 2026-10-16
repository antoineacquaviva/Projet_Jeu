"""Une règle de docs/regles_v1.md = au moins un test. L'identifiant de la règle
est cité dans la docstring : c'est ce que lit le contrôle de conformité."""
import itertools
import random

import pytest

from foret import FinDePartie, ErreurMoteur
from foret.moteur import CASES, Jeu
from tests.outils import partie, presence, jeu, tuile, machine, ordre, nouvelle_etape

DISPOSITION = ["Renfort", "Reparer", "Percee", "Represailles", "Opportunisme", "Cupidite",
               "Opportunisme", "Represailles", "Percee", "Cupidite", "Cupidite"]


# =========================================================================== 1. Mise en place
def test_plateau():
    """R1.1 : 7 zones, 21 forêts, trois profondeurs, une rivière ; plateau sans symétrie."""
    p = partie()
    P = p.plateau
    assert P.zones == [f"Z{i}" for i in range(1, 8)]
    assert P.foret0 == {"Z1": 2, "Z2": 1, "Z3": 2, "Z4": 3, "Z5": 4, "Z6": 4, "Z7": 5}
    assert [P.prof[z] for z in P.zones] == [0, 0, 0, 1, 1, 2, 2]
    assert P.adj["Z4"] == {"Z1", "Z2", "Z5", "Z6"} and P.adj["Z7"] == {"Z5", "Z6"}
    assert P.par_riviere("Z3") == {"Z5", "Z7", "Z6", "Z4"}
    aretes = {frozenset((a, b)) for a in P.zones for b in P.adj[a]}
    for perm in itertools.permutations(P.zones):
        f = dict(zip(P.zones, perm))
        if f == {z: z for z in P.zones}:
            continue
        if all(P.foret0[z] == P.foret0[f[z]] and P.prof[z] == P.prof[f[z]] for z in P.zones) and \
                {frozenset(f[x] for x in e) for e in aretes} == aretes:
            pytest.fail(f"symétrie trouvée : {f}")


def test_machines_depart():
    """R1.2 : trois Machines en lisière, une par zone ; deux en réserve."""
    p = partie()
    sur = [(m.nom, m.zone, sorted(m.organes)) for m in p.machines if m.etat == "plateau"]
    assert sur == [("Bouteur", "Z1", ["chenilles", "moteur"]),
                   ("Abatteuse", "Z2", ["chenilles", "moteur", "phares"]),
                   ("Pelleteuse", "Z3", ["moteur", "phares"])]
    assert [m.nom for m in p.machines if m.etat == "reserve"] == ["Debardeuse", "Broyeuse"]
    assert [m.numero for m in p.machines] == [1, 2, 3, 4, 5]


def test_piste_depart():
    """R1.3 : disposition fixe, aucun esprit ; chances de départ."""
    p = partie()
    assert [p.piste[c].nom for c in CASES] == DISPOSITION
    assert not p.esprits()
    chances = {}
    for c in CASES:
        chances[p.piste[c].nom] = chances.get(p.piste[c].nom, 0) + (6 - abs(c - 7))
    assert chances == {"Opportunisme": 10, "Cupidite": 9, "Represailles": 8, "Percee": 6, "Reparer": 2, "Renfort": 1}


def test_cartes_main():
    """R1.4 : paquet de 7, main de 5 tirée au hasard, pas de pioche."""
    p = partie()
    for s in p.sieges:
        assert len(s.deck) == 7 and len(s.main) == 5 and len(s.paquet) == 2
    s = p.sieges[0]
    s.joues = s.main[:3]
    s.main = s.main[3:]
    p.fin_de_tour()
    assert len(s.main) == 5 and len(s.paquet) == 2


def test_presence_posee_a_tour_de_role():
    """R1.5 : chacun pose un pion à tour de rôle, dans la zone de son choix, 3 pions."""
    choix = {"oiseaux": "Z4", "insectes": "Z6"}
    p = partie(regles={"presence": lambda P, s, o, c: choix[s.peuple]})
    assert dict(p.presence["oiseaux"]) == {"Z4": 3} and dict(p.presence["insectes"]) == {"Z6": 3}
    ordre_pose = [s.peuple for s in p.sieges for t in s.bot.vus if t[0] == "presence"]
    assert sorted(ordre_pose) == ["insectes"] * 3 + ["oiseaux"] * 3
    vus = [(t[2]["pion"]) for t in p.sieges[0].bot.vus if t[0] == "presence"]
    assert vus == [0, 1, 2]


# =========================================================================== 2. Le tour
def _programme(etapes_cartes):
    """Règles de bot : poser la première carte sur les étapes listées, avec un mode donné."""
    return {
        "programmer_carte": lambda P, s, o, c: o[1] if c["etape"] in etapes_cartes else None,
        "programmer_mode": lambda P, s, o, c: etapes_cartes[c["etape"]] if etapes_cartes[c["etape"]] in o else o[0],
        "voir": None, "hote": None,
    }


def test_programmation_une_carte_par_etape():
    """R2.1 : au plus une carte par étape, étapes vides permises, carte orientée ou en rêve."""
    p = partie(regles={"oiseaux": {**_programme({1: "bas", 3: "reve"}), "voir": None},
                       "insectes": _programme({2: "haut"})})
    p.tour = 1
    p.conseil()
    o, i = p.par_peuple["oiseaux"].idx, p.par_peuple["insectes"].idx
    assert p.prog[1][o].mode == "bas" and o not in p.prog[2] and p.prog[3][o].mode == "reve"
    assert list(p.prog[2]) == [i] and p.prog[2][i].mode == "haut"
    modes = [t[1] for t in p.sieges[o].bot.vus if t[0] == "programmer_mode"][0]
    assert set(modes) == {"haut", "bas", "reve"}


def test_un_reve_par_tour():
    """R2.2 : au plus une carte en rêve par joueur et par tour."""
    p = partie()
    s = p.sieges[0]
    assert "reve" in p.modes_autorises(s, [])
    deja = [Jeu(s.idx, s.main[0], "reve", 1)]
    assert "reve" not in p.modes_autorises(s, deja)
    p2 = partie(variante="retour_v0_reves_illimites")
    assert "reve" in p2.modes_autorises(p2.sieges[0], deja * 2)


def test_ordre_de_resolution():
    """R2.3 : les déplacements d'abord (un allié arrivé compte), puis les actions et
    sabotages, puis les dés ; les embuscades agissent après le tirage."""
    regles = {
        "oiseaux": {**_programme({1: "bas"}), "aller": lambda P, s, o, c: ("aller", "Z1", "Z2")},
        "insectes": {**_programme({1: "haut"}),
                     "aller": None,
                     "action": lambda P, s, o, c: ("saboter", "Z2", machine(P, "Abatteuse").uid, "chenilles")},
        "reptiles": {**_programme({1: "haut"}),
                     "embuscade": lambda P, s, o, c: next(x for x in o if x[0] == "barrer")},
    }
    p = partie(peuples=("oiseaux", "insectes", "reptiles"), regles=regles)
    presence(p, oiseaux={"Z1": 3}, insectes={"Z2": 3}, reptiles={"Z7": 3})
    p.tour = 1
    p.conseil()
    p.des_vus[1] = (3, 4)                          # case 7 : Cupidité
    p.resoudre_etape(1)
    assert machine(p, "Abatteuse").organes["chenilles"]          # allié arrivé par Aller
    emb = [t for t in p.par_peuple["reptiles"].bot.vus if t[0] == "embuscade"][0]
    assert emb[2]["info"]["tuile"].nom == "Cupidite"            # l'ordre est connu


def test_fin_du_tour():
    """R2.4 : les cartes jouées reviennent en main, sauf celles en rêve ; le premier joueur change."""
    p = partie()
    s = p.sieges[0]
    rev = s.main.pop()
    s.reves.append(rev)
    s.joues = [s.main.pop()]
    avant = list(p.ordre)
    p.fin_de_tour()
    assert len(s.main) == 4 and rev not in s.main
    assert p.ordre == avant[1:] + avant[:1]


# =========================================================================== 3. Les personnages
def test_agir_dans_une_zone_de_presence():
    """R3.1 : une carte agit dans une zone où son peuple est présent ; trois actions."""
    p = partie()
    presence(p, insectes={"Z2": 1, "Z6": 2})
    j = jeu(p, "insectes", "bas")
    zones = {o[1] for o in p.options_agir(j)}
    assert zones == {"Z2", "Z6"}
    assert {o[0] for o in p.options_agir(j)} == {"barrer", "saboter"}
    assert {o[0] for o in p.options_aller(j)} == {"aller"}


def test_aller_vers_une_zone_voisine():
    """R3.2 : Aller vers une zone voisine ; on agit dans la zone d'arrivée."""
    p = partie()
    presence(p, insectes={"Z1": 3})
    j = jeu(p, "insectes", "haut")
    assert {o[2] for o in p.options_aller(j)} == {"Z2", "Z4"}
    p.appliquer_aller(j, ("aller", "Z1", "Z4"))
    assert j.zone == "Z4" and p.presence["insectes"]["Z4"] == 1 and p.presence["insectes"]["Z1"] == 2


def test_barrer_entrer_sortir_abattre():
    """R3.3 : une Machine ne peut ni entrer dans une zone barrée, ni en sortir, ni y abattre."""
    for barres in ({"Z5"}, {"Z2"}):                 # entrer / sortir
        p = partie()
        p.ee.barres = barres
        info = ordre(p, "Cupidite", "Z7", machine(p, "Abatteuse"))
        assert p.executer(info) is False
        assert machine(p, "Abatteuse").zone == "Z2" and p.plateau.total == 21
    p = partie()                                    # abattre sur place
    p.ee.barres = {"Z2"}
    assert p.executer(ordre(p, "Cupidite", "Z2", machine(p, "Abatteuse"))) is False


def test_saboter_allie_ou_specialiste():
    """R3.4 : saboter demande un allié, sauf au spécialiste."""
    p = partie()
    m = machine(p, "Abatteuse")
    i = jeu(p, "insectes", "bas", "Z2", "saboter", cible=(m.uid, "moteur"))
    p.ee.actifs = [i]
    p.resoudre_sabotage(i)
    assert m.organes["moteur"]                      # spécialiste seul
    o = jeu(p, "oiseaux", "bas", "Z2", "saboter", cible=(m.uid, "chenilles"))
    p.ee.actifs = [o]
    p.resoudre_sabotage(o)
    assert not m.organes["chenilles"]               # seul, non spécialiste


def test_alliance_chacun_son_action():
    """R3.5 : deux alliés qui sabotent neutralisent deux organes, quel que soit l'ordre."""
    p = partie()
    m = machine(p, "Abatteuse")
    o = jeu(p, "oiseaux", "bas", "Z2", "saboter", cible=(m.uid, "chenilles"))
    i = jeu(p, "insectes", "haut", "Z2", "saboter", cible=(m.uid, "phares"))
    p.ee.actifs = [o, i]
    for j in (o, i):
        p.resoudre_sabotage(j)
    assert m.organes["chenilles"] and m.organes["phares"] and not m.organes["moteur"]


def test_rever_quitte_la_main():
    """R3.6 : une carte en rêve quitte la main pour la partie et fait rêver le Méchant."""
    p = partie(regles={"oiseaux": {**_programme({1: "reve"})}, "insectes": _programme({})})
    p.tour = 1
    p.conseil()
    p.des_vus[1] = (1, 1)
    p.resoudre_etape(1)
    s = p.par_peuple["oiseaux"]
    assert len(s.reves) == 1 and p.piste[12].genre == "esprit"
    p.fin_de_tour()
    assert len(s.main) == 4


def test_moitie_active_la_regle_brisee():
    """R3.7 : la moitié jouée active la règle brisée de son compartiment."""
    p = partie(peuples=("mammiferes", "insectes"))
    assert p.pouvoir_moitie[("mammiferes", "bas")].nom == "renverser"
    assert p.peut_saboter_seul(jeu(p, "mammiferes", "bas"), "phares")
    assert not p.peut_saboter_seul(jeu(p, "mammiferes", "haut"), "chenilles")


def test_machine_hs_inerte():
    """R3.8 : une Machine HS reste sur le plateau, inerte : elle n'est plus désignée."""
    p = partie()
    m = machine(p, "Abatteuse")
    for o in m.organes:
        m.organes[o] = True
    assert m.etat == "plateau" and m.zone == "Z2" and not m.tourne
    assert p.machine_pour("Z2") is not m


# =========================================================================== 4. L'ordre
def test_esprit_tire():
    """R4.1 : un esprit tiré : pas d'ordre, pas d'apprentissage."""
    p = partie()
    p.piste[12] = p._tuile("Esprit")
    p.des_vus[1] = (6, 6)
    avant = [t.uid for t in p.piste.values()]
    assert p.tirer_ordre(1) is None
    assert [t.uid for t in p.piste.values()] == avant


def test_criteres():
    """R4.2 : Cupidité, Opportunisme (présence visible), Représailles (repli Cupidité), Percée."""
    p = partie(peuples=("oiseaux", "reptiles"))
    assert p.cible(tuile(p, "Cupidite")) == "Z7"
    presence(p, oiseaux={"Z1": 1, "Z2": 1, "Z3": 1}, reptiles={"Z4": 1, "Z5": 1, "Z6": 1})
    # sans défense visible : Z4 à Z7 ; la plus boisée l'emporte (R7.1)
    assert p.cible(tuile(p, "Opportunisme")) == "Z7"
    presence(p, oiseaux={"Z7": 1, "Z6": 1, "Z5": 1})
    assert p.cible(tuile(p, "Opportunisme")) == "Z4"
    assert p.cible(tuile(p, "Represailles")) == "Z7"          # pas encore d'attaque
    p.derniere_attaque = ("Z3", 1, 1)
    assert p.cible(tuile(p, "Represailles")) == "Z3"
    assert p.cible(tuile(p, "Percee")) == "Z4"                # devant le Bouteur (n° 1)
    machine(p, "Abatteuse").zone = "Z5"
    assert p.cible(tuile(p, "Percee")) == "Z7"                # Z6 ou Z7 : la plus boisée


def test_execution_un_pas_puis_abattre():
    """R4.3 : la Machine la plus proche fait un pas puis abat là où elle est."""
    p = partie()
    info = ordre(p, "Cupidite")
    assert info["cible"] == "Z7" and info["machine"].nom == "Abatteuse"
    assert p.executer(info) is True
    assert info["machine"].zone == "Z5" and p.plateau.foret["Z5"] == 3


def test_ordre_empeche():
    """R4.4 : pas barré, zone barrée ou Machine immobilisée : l'ordre échoue ; un autre
    chemin libre est pris s'il existe."""
    p = partie()
    p.ee.barres = {"Z2"}
    b = machine(p, "Bouteur")
    assert p.executer(ordre(p, "Cupidite", "Z5", b)) is True and b.zone == "Z4"
    nouvelle_etape(p)
    p.immobiliser(b, "tour")
    assert p.executer(ordre(p, "Cupidite", "Z6", b)) is False and b.zone == "Z4"


def test_ordres_de_chantier():
    """R4.5 : Réparer la plus endommagée (même HS), moteur d'abord ; Renfort en lisière."""
    p = partie()
    b, a = machine(p, "Bouteur"), machine(p, "Abatteuse")
    b.organes.update(moteur=True, chenilles=True)
    a.organes["phares"] = True
    assert p.executer(ordre(p, "Reparer")) is True
    assert not b.organes["moteur"] and b.organes["chenilles"] and b.tourne
    assert p.executer(ordre(p, "Renfort")) is True
    d = machine(p, "Debardeuse")
    assert d.etat == "plateau" and d.zone in p.plateau.lisiere


def test_reussite_effet():
    """R4.6 : réussite = l'ordre a eu un effet ; sinon échec (même pour un ordre de chantier)."""
    p = partie()
    assert p.executer(ordre(p, "Reparer")) is False               # rien à réparer
    for _ in range(2):
        assert p.executer(ordre(p, "Renfort")) is True
    assert p.executer(ordre(p, "Renfort")) is False               # réserve vide
    case = 2                                                      # Renfort en 2 : échec, reste au bord
    p.executer_et_apprendre({"tuile": p.piste[case], "case": case, "cible": None, "machine": None})
    assert p.piste[2].nom == "Renfort"
    p.executer_et_apprendre({"tuile": p.piste[3], "case": 3, "cible": None, "machine": None})
    assert p.piste[2].nom == "Reparer"                            # Réparer sans cible : échec


# =========================================================================== 5. La piste
def test_cotes_de_la_piste():
    """R5.1 : côté éveil (2-6), centre (7), côté rêve (8-12) : le bord est 2 ou 12."""
    p = partie()
    p.apprendre(4, False)
    assert p.piste[3].nom == "Percee"
    p.apprendre(9, False)
    assert p.piste[10].nom == "Represailles"


def test_apprendre():
    """R5.2 : réussite vers le 7 (au 7 elle reste ; un esprit recule) ; échec vers le bord
    (du 7 en 8 ; au bord elle reste ; face à un esprit, elle reste)."""
    p = partie()
    p.apprendre(5, True)
    assert p.piste[6].nom == "Represailles" and p.piste[5].nom == "Opportunisme"
    avant = [t.uid for t in p.piste.values()]
    p.apprendre(7, True)
    p.apprendre(2, False)
    p.apprendre(12, False)
    assert [t.uid for t in p.piste.values()] == avant
    p.apprendre(7, False)
    assert p.piste[8].nom == "Cupidite" and p.piste[7].nom == "Opportunisme"
    p = partie()
    p.piste[9] = p._tuile("Esprit")
    p.apprendre(8, False)                                         # face à un esprit : reste
    assert p.piste[8].nom == "Opportunisme" and p.piste[9].genre == "esprit"
    p.apprendre(10, True)                                         # tir à la corde
    assert p.piste[9].nom == "Percee" and p.piste[10].genre == "esprit"


def test_faire_rever():
    """R5.3 : entrer en 12 (oubli) ou avancer d'une case ; jamais sur un esprit."""
    p = partie()
    assert p.options_reve() == [("entrer",)]
    p.rever(("entrer",))
    assert p.piste[12].genre == "esprit" and sum(1 for t in p.piste.values() if t.nom == "Cupidite") == 2
    assert p.options_reve() == [("avancer", 12)]                  # 12 occupé : avancer
    p.rever(("avancer", 12))
    assert p.piste[11].genre == "esprit" and p.piste[12].nom == "Cupidite"
    p.piste[10] = p._tuile("Esprit")
    assert ("avancer", 11) not in p.options_reve()


def test_long_sommeil_immediat():
    """R5.4 : dès qu'un esprit atteint le 7, le Méchant s'endort."""
    p = partie()
    p.piste[8] = p._tuile("Esprit")
    with pytest.raises(FinDePartie):
        p.rever(("avancer", 8))
        p.verifier_sommeil()
    assert p.fin[0] == "sommeil"


# =========================================================================== 6. Les peuples
def test_specialistes():
    """R6.1 : seuls, mammifères tout organe, insectes le moteur, entités les phares."""
    p = partie(peuples=("mammiferes", "insectes", "entites"))
    assert p.organes_specialiste("mammiferes") == {"moteur", "chenilles", "phares"}
    assert p.organes_specialiste("insectes") == {"moteur"}
    assert p.organes_specialiste("entites") == {"phares"}
    p2 = partie(peuples=("mammiferes", "oiseaux"), variante="retour_v0_renverser")
    assert p2.organes_specialiste("mammiferes") == {"chenilles"}


def test_voir():
    """R6.2 : carte face visible pendant le conseil ; les dés de l'étape sont lancés tout de suite."""
    def voir(P, s, o, c):
        return o[1] if c["etape"] == 2 else None
    p = partie(regles={"oiseaux": {"voir": voir, "programmer_carte": None}, "insectes": {"programmer_carte": None}})
    p.tour = 1
    p.conseil()
    j = p.prog[2][p.par_peuple["oiseaux"].idx]
    assert j.voir and j.mode == "haut" and 2 in p.des_vus
    d = p.des_vus[2]
    info = p.tirer_ordre(2)
    assert info is None or info["case"] == sum(d)


def test_voler():
    """R6.3 : les oiseaux (moitié plateau) vont dans n'importe quelle zone."""
    p = partie()
    presence(p, oiseaux={"Z1": 3})
    assert {o[2] for o in p.options_aller(jeu(p, "oiseaux", "bas"))} == set(p.plateau.zones) - {"Z1"}
    assert {o[2] for o in p.options_aller(jeu(p, "oiseaux", "haut"))} == {"Z2", "Z4"}


def test_tenir():
    """R6.4 : la carte barre toutes les zones où les mammifères sont présents, pendant l'étape."""
    p = partie(peuples=("mammiferes", "oiseaux"))
    presence(p, mammiferes={"Z4": 1, "Z5": 2})
    j = jeu(p, "mammiferes", "haut", "Z4", "barrer")
    j.pouvoir.apres_action(j)
    assert {"Z4", "Z5"} <= p.ee.barres
    assert p.executer(ordre(p, "Cupidite", "Z7", machine(p, "Abatteuse"))) is False
    nouvelle_etape(p)
    assert not p.ee.barres


def test_egarer():
    """R6.5 : une Machine HS aux phares égarés quitte le plateau et fait rêver, hors limite R2.2."""
    p = partie(peuples=("entites", "oiseaux"))
    m = machine(p, "Pelleteuse")
    m.organes["moteur"] = True
    e = jeu(p, "entites", "bas", "Z3", "saboter", cible=(m.uid, "phares"))
    p.ee.actifs = [e]
    p.resoudre_sabotage(e)
    assert m.etat == "retiree" and m.zone is None and p.piste[12].genre == "esprit"
    s = p.par_peuple["entites"]
    assert "reve" in p.modes_autorises(s, [])


def test_attendre_immobiliser():
    """R6.6 : l'embuscade agit après les dés ; elle immobilise la Machine désignée si elle
    est (ou va) dans une zone de présence reptile, jusqu'à la fin du tour ; une fois par tour."""
    p = partie(peuples=("reptiles", "oiseaux"))
    presence(p, reptiles={"Z5": 3})
    a = machine(p, "Abatteuse")
    info = ordre(p, "Cupidite", "Z7", a)                          # pas vers Z5
    j = jeu(p, "reptiles", "haut")
    assert j.pouvoir.differe(j)
    opts = j.pouvoir.options_immobiliser(j, info)
    assert opts == [("immobiliser", "Z5", a.uid)]
    j.pouvoir.immobiliser(a)
    assert p.executer(info) is False
    nouvelle_etape(p)
    assert p.executer(ordre(p, "Cupidite", "Z7", a)) is False     # toujours immobile
    assert j.pouvoir.options_immobiliser(j, info) == []           # une fois par tour
    p.fin_de_tour()
    for inst in p.instances:
        inst.debut_tour()
    nouvelle_etape(p)
    assert p.executer(ordre(p, "Cupidite", "Z7", a)) is True
    presence(p, reptiles={"Z1": 3})
    assert j.pouvoir.options_immobiliser(j, ordre(p, "Cupidite", "Z7", a)) == []


def test_se_fondre():
    """R6.7 : présence invisible aux critères ; moitié plateau : Aller le long d'une rivière."""
    p = partie(peuples=("reptiles", "oiseaux"))
    presence(p, reptiles={"Z3": 3}, oiseaux={"Z1": 3})
    assert p.defense("Z3") == 0 and p.defense("Z1") == 3
    dest = {o[2] for o in p.options_aller(jeu(p, "reptiles", "bas"))}
    assert dest == {"Z2", "Z5", "Z7", "Z6", "Z4"}
    assert {o[2] for o in p.options_aller(jeu(p, "reptiles", "haut"))} == {"Z2", "Z5"}


def test_s_unir():
    """R6.8 : la carte glissée agit dans la zone de son hôte, en alliance, sans présence ;
    sans hôte, elle agit seule."""
    regles = {
        "oiseaux": {**_programme({1: "bas"}), "aller": None,
                    "action": lambda P, s, o, c: ("barrer", "Z2")},
        "insectes": {**_programme({1: "haut"}), "hote": lambda P, s, o, c: o[1],
                     "action": lambda P, s, o, c: next((x for x in o if x[0] == "saboter" and x[3] == "chenilles"), o[0])},
    }
    p = partie(regles=regles)
    presence(p, oiseaux={"Z2": 3}, insectes={"Z7": 3})
    p.tour = 1
    p.conseil()
    g = p.glisses[0]
    assert g.lie and g.hote[0] == p.par_peuple["oiseaux"].idx
    p.des_vus[1] = (1, 1)
    p.resoudre_etape(1)
    assert g.zone == "Z2" and machine(p, "Abatteuse").organes["chenilles"]
    regles["oiseaux"] = _programme({})
    p = partie(regles=regles)
    presence(p, insectes={"Z7": 3})
    p.tour = 1
    p.conseil()
    p.des_vus[1] = (1, 1)
    p.resoudre_etape(1)
    assert not p.glisses[0].lie and p.glisses[0].zone == "Z7"


def test_tromper():
    """R6.9 : l'humain peut inverser ce que le Méchant apprend."""
    p = partie(peuples=("humains", "oiseaux"), regles={"tromper": True})
    p.ee.trompeurs = [p.par_peuple["humains"]]
    info = ordre(p, "Cupidite")
    info["case"] = 11
    info["tuile"] = p.piste[11]
    p.executer_et_apprendre(info)                                 # réussite, apprise comme échec
    assert p.piste[12].uid == info["tuile"].uid


def test_parler():
    """R6.10 : déplacer une carte cachée d'une étape suivante ; échange ; l'insecte glissé
    suit ; pas deux cartes d'un joueur sur une étape."""
    p = partie(peuples=("humains", "oiseaux", "insectes"))
    h, o, i = (p.par_peuple[x].idx for x in ("humains", "oiseaux", "insectes"))
    p.prog = {1: {}, 2: {}, 3: {}}
    hote = p.poser(p.sieges[o], p.sieges[o].main[0], "bas", 2)
    p.prog[2][o] = hote
    g = p.poser(p.sieges[i], p.sieges[i].main[0], "haut", 2, hote=(o, 2))
    g.lie = True
    hote.attaches.append(g)
    p.glisses = [g]
    propre = p.poser(p.sieges[i], p.sieges[i].main[0], "bas", 3)
    p.prog[3][i] = propre
    parleur = jeu(p, "humains", "bas", etape=1)
    opts = p.options_parler(parleur)
    assert ("deplacer", o, 2, 3) not in opts                      # l'insecte aurait deux cartes en 3
    assert ("deplacer", i, 3, 2) not in opts
    del p.prog[3][i]
    assert ("deplacer", o, 2, 3) in p.options_parler(parleur)
    p.deplacer_carte(o, 2, 3)
    assert p.prog[3][o] is hote and g.etape == 3
    hote.voir = True                                              # une carte de Voir n'est pas cachée
    assert all(x[1:3] != (o, 3) for x in p.options_parler(parleur))


def test_hanter():
    """R6.11 : l'entité peut annuler l'ordre (pas de dés), une fois par tour."""
    p = partie(peuples=("entites", "oiseaux"), regles={"pouvoir": True})
    h = jeu(p, "entites", "haut")
    h.pouvoir.apres_action(h)
    etat = p.rng.getstate()
    assert p.ee.annule and p.tirer_ordre(1) is None
    assert p.rng.getstate() == etat
    nouvelle_etape(p)
    h.pouvoir.apres_action(h)
    assert not p.ee.annule
    p2 = partie(peuples=("entites", "oiseaux"), regles={"pouvoir": False})
    h2 = jeu(p2, "entites", "haut")
    h2.pouvoir.apres_action(h2)
    assert not p2.ee.annule and h2.pouvoir.disponible()


def test_reptiles_ne_sabotent_pas():
    """R6.12 : les reptiles ne sabotent jamais, même en alliance."""
    p = partie(peuples=("reptiles", "mammiferes"))
    presence(p, reptiles={"Z2": 3})
    for mode in ("haut", "bas"):
        assert all(o[0] != "saboter" for o in p.options_agir(jeu(p, "reptiles", mode)))
    r = jeu(p, "reptiles", "bas", "Z2", "saboter", cible=(machine(p, "Abatteuse").uid, "moteur"))
    with pytest.raises(ErreurMoteur):
        p.resoudre_sabotage(r)


# =========================================================================== 7. Égalités
def test_egalites_zones():
    """R7.1 : la plus boisée, puis la plus proche d'une Machine en marche, puis le plus petit numéro."""
    p = partie()
    assert p.departager(["Z4", "Z7"]) == "Z7"
    assert p.departager(["Z5", "Z6"]) == "Z5"           # 4 forêts chacune ; Z5 est plus proche
    assert p.departager(["Z3", "Z1"]) == "Z1"           # même forêt, même distance


def test_egalites_machines():
    """R7.2 : à même distance, la plus avancée, puis le plus petit numéro."""
    p = partie()
    assert p.machine_pour("Z5").nom == "Abatteuse"      # Z2 et Z3 à distance 1
    machine(p, "Bouteur").zone = "Z4"
    assert p.machine_pour("Z5").nom == "Bouteur"        # aussi à 1, mais plus avancé


# =========================================================================== 8. Fin
def test_trois_fins():
    """R8.1 : silence aussitôt la dernière Machine HS ; nuit après 6 tours."""
    p = partie()
    with pytest.raises(FinDePartie):
        for m in p.machines:
            if m.etat == "plateau":
                for o in m.organes:
                    m.organes[o] = True
        p.verifier_silence()
    assert p.fin[0] == "silence"
    p = partie(regles={"programmer_carte": None})
    b = p.jouer()
    assert b["fin"] == "nuit" and b["tour"] == 6


def test_bilan():
    """R8.2 : le bilan compte la forêt restante."""
    p = partie(regles={"programmer_carte": None})
    b = p.jouer()
    assert b["foret"] == p.plateau.total and b["foret_initiale"] == 21 and b["foret"] < 21
