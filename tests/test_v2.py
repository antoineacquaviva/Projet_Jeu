"""Maquette v2 (moteur 1.3) : un test au moins par nœud de l'atelier, cité [v2:<nœud>].

État de départ de la v2 (« V2 proposée ») : piste des pensées 2 Percée, 3 Représailles,
4 Percée, 5 Représailles, 6 Opportunisme, 7 Cupidité, 8 Opportunisme, 9 Représailles,
10 Percée, 11 Cupidité, 12 Cupidité ; piste des Machines 1 Grosse Gueule (Z1), 2 Rapiat (Z2),
3 Mâchoire (Z3), 4 Tonton Débard et 5 Ripaille (au chantier). Zones : Z1 Lisière (2 forêts),
Z2 Clairière (1), Z3 Várzea (2), Z4 Igapó (3), Z5 Sources (4), Z6 Colline aux aras (4),
Z7 Samaúma (5).
"""
import itertools
from collections import Counter

import pytest

from foret import charger, Partie, fabriquer, ErreurMaquette, FinDePartie
from foret.atelier import patch, decoder, encoder, code_preset, PRESETS, PARAMS
from foret.plans import DES
from foret.moteur import EtatEtape
from tests.outils import partie, presence, Scripte

DUO = ["oiseaux", "insectes"]
TRIO = ["mammiferes", "reptiles", "humains"]
SIX = ["oiseaux", "mammiferes", "reptiles", "insectes", "humains", "entites"]
V2 = "c:A2a,d_fav,C2a,D2v_choix|m:C3|p:"


def v2(code=None, peuples=DUO, regles=None, graine=1, **kw):
    """Partie v2 (ou variante par code) avec des bots scriptés, prête pour un ordre au tour 1."""
    p = partie(peuples, maquette="v2", variante=("code:" + code) if code else None, regles=regles, graine=graine, **kw)
    p.tour, p.etape = 1, 1
    p.ee = EtatEtape()
    return p


def M(p, nom):
    return next(m for m in p.machines if m.nom == nom)


def case_de(p, nom):
    return next(c for c, t in p.piste.items() if t.nom == nom)


def ordre(p, d):
    info = p.interpreter(d)
    p.executer_et_apprendre(info)
    return info


# ------------------------------------------------------------------ atelier et maquette
def test_code_v2_proposee_egale_v2_json():
    """[v2:A2a] [v2:C2a] [v2:C3] [v2:D2v_choix] [v2:d_fav] : le code « V2 proposée » de l'atelier donne
    exactement maquettes/v2.json."""
    assert code_preset("v2") == V2
    a, b = charger("v2"), charger("v2", "code:" + V2)
    for k in ("regles", "piste", "tuiles", "machines", "cartes", "presence", "pouvoirs", "tours", "etapes", "plateau"):
        assert a[k] == b[k], k


def test_prereglages():
    for nom in PRESETS:
        m = charger("v2", "code:" + code_preset(nom))
        assert m["regles"]["silence_du_chantier"] is False
    assert charger("v2", "gang")["regles"]["communication"] == "partage"
    assert charger("v2", "gang")["regles"]["lunes"] == 2
    h = charger("v2", "heritage_v1")
    assert h["regles"]["plan"] == "une_piste" and h["regles"]["bonus_fin"] == 10
    assert h["tuiles"]["Represailles"]["critere"] == "derniere_attaque" and h["piste"]["disposition"][0] == "Renfort"


@pytest.mark.parametrize("code", [
    "A2a",                                          # pas de « c: »
    "c:A2z|m:|p:",                                  # option inconnue
    "c:A2a|m:Z9|p:",                                # module inconnu
    "c:A2a|m:|p:seuil=9",                           # valeur hors liste
    "c:A2c,C2b|m:|p:",                              # le partage demande la piste des Machines
    "c:A2b|m:A4|p:",                                # l'escalade aussi
    "c:A2a|m:B4|p:",                                # [v2:B4] pas encore codé
    "c:A2a|m:|p:plateau=g1",                        # [v2:E1] gabarit pas dessiné
])
def test_codes_refuses(code):
    with pytest.raises(ErreurMaquette):
        charger("v2", "code:" + code)


def test_modules_verrouilles_ignores():
    """[v2:A6] [v2:A7] [v2:B5] [v2:D7] : idées verrouillées ou retirées, ignorées au décodage."""
    c, m, p = decoder("c:A2a|m:A6,A7,B5,D7,C3|p:")
    assert m == {"C3"}


def test_codes_aller_retour():
    """[v2:A2] [v2:C2] [v2:D2v] Les choix de l'atelier se codent et se décodent."""
    c, m, p = decoder("c:A2b,d_bb,C2b,D2v_deux|m:C3,D5|p:seuil=4,lunes=3")
    assert encoder(c, m, p) == "c:A2b,d_bb,C2b,D2v_deux|m:C3,D5|p:seuil=4,lunes=3"


# ------------------------------------------------------------------ [v2:A2a] deux pistes : qui et où
def test_pyramide():
    """[v2:A2a] Une Machine en case d ne reçoit que les tactiques des cases 7 ± (5 − d), de deux en
    deux, toutes avec la même chance ; écart : 0 (6/36), 1 (10), 2 (8), 3 (6), 4 (4), 5 (2)."""
    par_ecart = Counter(abs(a - b) for a, b in DES)
    assert [par_ecart[g] for g in range(6)] == [6, 10, 8, 6, 4, 2]
    for g in range(1, 6):
        sommes = Counter(a + b for a, b in DES if abs(a - b) == g)
        assert sorted(sommes) == list(range(7 - (5 - g), 7 + (5 - g) + 1, 2))
        assert len(set(sommes.values())) == 1


def test_menace_de_depart_conforme_a_l_atelier():
    """[v2:A2a] [v2:A2a_d] Calcul exact de l'atelier (plateau v1, départ, sans défense) : forêts
    abattues par plan 0,83 (favori), 1,17 (branle-bas), 0,67 (il hésite), v1 0,92 ; 6 chances sur 36
    qu'une Machine entre ; 53 % de la menace sur les deux zones les plus menacées (v1 : 100 %)."""
    def calc(maquette, code=None):
        p = partie(DUO, maquette=maquette, variante=("code:" + code) if code else None)
        p.tour = 1
        for k in p.presence:
            p.presence[k] = Counter()
        men = p.prevision()
        tot = sum(men.values())
        top2 = sum(sorted(men.values(), reverse=True)[:2]) / tot
        entrees = 0
        if p.R["plan"] == "qui_ou":
            with p.muet():
                entrees = sum(1 for d in DES if p.interpreter(d, False)["action"] == "entrer")
        return round(tot, 2), entrees, round(100 * top2)
    assert calc("v2") == (0.83, 6, 53)
    assert calc("v2", "c:A2a,d_bb|m:|p:")[0] == 1.17
    assert calc("v2", "c:A2a,d_hes|m:|p:")[0] == 0.67
    v1 = calc("v1")
    assert v1[0] == 0.92 and v1[2] == 100


def test_exemple_de_l_atelier_reussite():
    """[v2:A2a] Exemple de l'atelier : dés 2 et 4, somme 6 (Opportunisme), écart 2 (Rapiat, en Z2).
    Son rayon : Z2, Z1, Z3, Z4, Z5 ; la moins défendue est Z3 : Rapiat y entre et abat. Le plan
    réussit : Opportunisme passe en 7, Cupidité en 6 ; Rapiat en case 1, Grosse Gueule en 2."""
    p = v2()
    presence(p, oiseaux={"Z1": 1, "Z2": 1, "Z4": 1}, insectes={"Z5": 2, "Z2": 1})
    info = ordre(p, (2, 4))
    assert info["action"] == "tactique" and info["machine"].nom == "Rapiat" and info["cible"] == "Z3"
    assert M(p, "Rapiat").zone == "Z3" and p.plateau.foret["Z3"] == 1
    assert p.piste[7].nom == "Opportunisme" and p.piste[6].nom == "Cupidite"
    assert p.piste_m[1].nom == "Rapiat" and p.piste_m[2].nom == "Grosse Gueule"


def test_exemple_de_l_atelier_echec():
    """[v2:A2a] Si Z3 est barrée, le plan échoue : Opportunisme passe en 5, Rapiat en case 3."""
    p = v2()
    presence(p, oiseaux={"Z1": 1, "Z2": 1, "Z4": 1}, insectes={"Z5": 2, "Z2": 1})
    p.ee.barres.add("Z3")
    ordre(p, (2, 4))
    assert M(p, "Rapiat").zone == "Z2" and p.plateau.foret["Z3"] == 2
    assert p.piste[5].nom == "Opportunisme" and p.piste_m[3].nom == "Rapiat" and p.piste_m[2].nom == "Mâchoire"


def test_barrer_la_zone_de_la_machine():
    """[v2:A2a] [v2:B2] Barrage « tout » : la Machine ne sort pas de sa zone barrée ; barrage « entrée » :
    elle peut en sortir."""
    for code, sort in ((None, False), ("c:A2a|m:|p:barrage=entree", True)):
        p = v2(code)
        presence(p, oiseaux={"Z1": 1, "Z2": 1, "Z4": 1}, insectes={"Z5": 2, "Z2": 1})
        p.ee.barres.add("Z2")
        ordre(p, (2, 4))
        assert (M(p, "Rapiat").zone == "Z3") == sort


def test_cycle_des_machines():
    """[v2:A2a] Au chantier, la Machine désignée entre par sa zone d'entrée ; hors service, elle est
    remorquée au chantier et remise en état ; une entrée et un remorquage sont des réussites."""
    p = v2()
    info = ordre(p, (2, 6))                                  # écart 4 : Tonton Débard, au chantier
    assert info["action"] == "entrer" and M(p, "Tonton Débard").zone == "Z1"
    assert p.piste_m[3].nom == "Tonton Débard"               # réussite : vers la case 1
    gg = M(p, "Grosse Gueule")
    for o in gg.organes:
        gg.organes[o] = True
    info = ordre(p, (3, 4))                                  # écart 1 : Grosse Gueule, HS
    assert info["action"] == "remorquer" and gg.etat == "reserve" and gg.zone is None
    assert not any(gg.organes.values())
    p2 = v2()
    p2.ee.barres.add("Z1")
    ordre(p2, (2, 6))
    assert M(p2, "Tonton Débard").etat == "reserve"           # entrée barrée : échec
    assert p2.piste_m[5].nom == "Tonton Débard"


@pytest.mark.parametrize("hs,action,etat", [("organe", "reparer_organe", "plateau"), ("rien", "rien", "plateau")])
def test_machine_hs_designee(hs, action, etat):
    """[v2:A2a] Réglage hs : réparée d'un organe (réussite), ou rien (échec)."""
    p = v2(f"c:A2a|m:|p:hs={hs}")
    gg = M(p, "Grosse Gueule")
    for o in gg.organes:
        gg.organes[o] = True
    info = ordre(p, (3, 4))
    assert info["action"] == action and gg.etat == etat
    assert (not gg.organes["moteur"]) == (hs == "organe")
    assert p.piste_m[1 if hs == "organe" else 2] is gg


def test_portee_plateau():
    """[v2:A2a] Portée plateau : la tactique vise une zone sur tout le plateau ; la Machine désignée
    fait un pas vers elle, puis abat là où elle est."""
    p = v2("c:A2a|m:|p:portee=plateau")
    info = ordre(p, (3, 4))                                  # Cupidité : Z7 (5 forêts), Grosse Gueule
    assert info["cible"] == "Z7" and M(p, "Grosse Gueule").zone == "Z4" and p.plateau.foret["Z4"] == 2


def test_case_sans_machine():
    """[v2:E2] [v2:A2a] Moins de Machines au chantier : les cases vides ne donnent pas d'ordre, le plan
    échoue (la tactique apprend l'échec)."""
    p = v2("c:A2a|m:|p:m_chantier=0")
    assert p.piste_m[4] is None and p.piste_m[5] is None
    info = ordre(p, (1, 6))                                  # somme 7, écart 5 : case vide
    assert info["action"] == "vide" and p.piste[8].nom == "Cupidite"


# ------------------------------------------------------------------ [v2:A3] les tactiques dans le rayon
def test_tactiques_dans_le_rayon():
    """[v2:A3] Cupidité : la plus boisée ; Opportunisme : la moins défendue ; Représailles : la plus
    défendue ; Percée : la flèche de sa zone ; égalité : sa propre zone d'abord."""
    p = v2()
    presence(p, oiseaux={"Z4": 2, "Z1": 1}, insectes={"Z3": 1, "Z5": 2})
    rap = M(p, "Rapiat")                                     # Z2 : rayon Z2, Z1, Z3, Z4, Z5
    T = {t.nom: t for t in p.piste.values()}
    assert p.cible_rayon(T["Cupidite"], rap) == "Z5"
    assert p.cible_rayon(T["Opportunisme"], rap) == "Z2"     # Z2 non défendue : sa zone d'abord
    assert p.cible_rayon(T["Represailles"], rap) == "Z5"     # Z4 et Z5 : 2 présences ; Z5 plus boisée
    assert p.cible_rayon(T["Percee"], rap) == "Z5"           # flèche Clairière -> Sources
    gg = M(p, "Grosse Gueule")
    assert p.cible_rayon(T["Percee"], gg) == "Z4"            # Lisière -> Igapó
    gg.zone = "Z7"
    assert p.cible_rayon(T["Percee"], gg) == "Z7"            # au cœur : sa zone


def test_represailles_attaque_dans_le_rayon():
    """[v2:A3] Réglage represailles=attaque : la dernière zone du rayon où un organe a été neutralisé."""
    p = v2("c:A2a|m:|p:represailles=attaque")
    T = {t.nom: t for t in p.piste.values()}
    rap = M(p, "Rapiat")
    p.attaques = [("Z7", 1, 1), ("Z3", 1, 1), ("Z6", 1, 2)]
    assert p.cible_rayon(T["Represailles"], rap) == "Z3"
    p.attaques = []
    assert p.cible_rayon(T["Represailles"], rap) == "Z5"     # aucune : comme Cupidité


def test_percee_vers_une_zone_rasee():
    """[v2:A3] Flèche vers une zone rasée : la Machine reste dans sa zone (lacune percee_rasee)."""
    p = v2()
    T = {t.nom: t for t in p.piste.values()}
    p.plateau.foret["Z4"] = 0
    assert p.cible_rayon(T["Percee"], M(p, "Grosse Gueule")) == "Z1"
    assert p.compteur.comptes["lacune"]["percee_rasee"] == 1


# ------------------------------------------------------------------ [v2:A2a_d] le doublé
def test_double_favori():
    """[v2:d_fav] Sur un double, la Machine de la case 1 obéit."""
    p = v2()
    info = ordre(p, (3, 3))
    assert info["machine"].nom == "Grosse Gueule" and info["case_machine"] == 1


def test_double_branle_bas():
    """[v2:d_bb] Toutes les Machines en marche exécutent la tactique, de la case 1 à la case 5 ; seule
    la tactique apprend."""
    p = v2("c:A2a,d_bb|m:|p:")
    avant = dict(p.piste_m)
    info = ordre(p, (3, 3))                                  # somme 6 : Opportunisme ; sans présence, chacune reste
    assert info["action"] == "branle_bas" and len(info["machines"]) == 3
    assert p.plateau.total == 21 - 3
    assert p.piste_m == avant and p.piste[7].nom == "Opportunisme"


def test_double_il_hesite():
    """[v2:d_hes] Sur un double, pas d'ordre et rien n'apprend."""
    p = v2("c:A2a,d_hes|m:|p:")
    avant_p, avant_m = dict(p.piste), dict(p.piste_m)
    info = ordre(p, (2, 2))
    assert info["action"] == "hesite" and p.piste == avant_p and p.piste_m == avant_m and p.plateau.total == 21


def test_double_sixieme_machine():
    """[v2:d_six] La case 0 porte Zizanie, au chantier au départ ; elle apprend ; en 0, une Machine qui
    échoue reste en place."""
    p = v2("c:A2a,d_six|m:|p:")
    assert p.piste_m[0].nom == "Zizanie" and p.piste_m[0].etat == "reserve"
    p.ee.barres.add(p.piste_m[0].entree)
    ordre(p, (2, 2))                                         # entrée barrée : échec
    assert p.piste_m[0].nom == "Zizanie"
    p.ee = EtatEtape()
    ordre(p, (2, 2))                                         # elle entre : réussite, vers la case 1
    assert p.piste_m[1].nom == "Zizanie" and p.piste_m[0].nom == "Grosse Gueule"


def test_escalade_du_soir():
    """[v2:A4] À partir du tour choisi, un doublé fait obéir toutes les Machines en marche."""
    p = v2("c:A2a|m:A4|p:escalade=4")
    assert p.interpreter((3, 3))["action"] == "tactique"
    p.tour = 4
    assert p.interpreter((3, 3))["action"] == "branle_bas"


# ------------------------------------------------------------------ [v2:A2b] où et comment
def test_ou_et_comment():
    """[v2:A2b] L'écart désigne une manœuvre (0 Encercler, 1 Avancer, 2 Foncer, 3 Raser, 4 Réparer,
    5 Renfort) ; la Machine en marche la plus proche de la zone visée l'exécute ; la manœuvre apprend."""
    p = v2("c:A2b|m:|p:")
    assert [p.manoeuvres[k].nom for k in range(6)] == ["Encercler", "Avancer", "Foncer", "Raser", "Reparer", "Renfort"]
    info = ordre(p, (2, 5))                                  # somme 7 Cupidité (Z7), écart 3 : Raser
    assert info["manoeuvre"].nom == "Raser" and info["machine"].nom == "Rapiat"   # la plus proche de Z7
    assert p.plateau.foret["Z2"] == 0 and p.plateau.total == 20                 # deux forêts au plus : il n'y en avait qu'une
    assert p.manoeuvres[2].nom == "Raser"                    # réussite : vers la case 1
    q = v2("c:A2b|m:|p:")
    info = ordre(q, (1, 6))                                  # écart 5 : Renfort
    assert sum(1 for m in q.machines if m.etat == "plateau") == 4
    r = v2("c:A2b|m:|p:")
    info = ordre(r, (3, 5))                                  # somme 8 Opportunisme, écart 2 : Foncer
    m = info["machine"]
    assert info["manoeuvre"].nom == "Foncer" and r.plateau.dist[m.zone][info["cible"]] <= 1


def test_heritage_v1_une_piste():
    """[v2:A2c] Une seule piste : l'ordre de la v1 (Renfort et Réparer sur la piste), avec les fins de la v2."""
    p = v2("c:A2c,C2c|m:C3|p:represailles=attaque,bonus=10")
    assert p.piste[2].nom == "Renfort" and p.piste_m == {} and not p.R["silence_du_chantier"]
    info = p.tirer_ordre(1)
    assert info is None or "action" not in info


# ------------------------------------------------------------------ apprentissage
def test_apprentissage_piste_des_machines():
    """[v2:A2a] Réussite : la Machine s'échange avec sa voisine côté case 1 (en 1, elle reste) ; échec :
    côté case 5 (en 5, elle reste)."""
    p = v2()
    pm = p.piste_m
    gg, rip = pm[1], pm[5]
    p.apprendre_ordinale(pm, 1, True, "machines")
    assert pm[1] is gg
    p.apprendre_ordinale(pm, 5, False, "machines")
    assert pm[5] is rip
    p.apprendre_ordinale(pm, 1, False, "machines")
    assert pm[2] is gg


def test_tromper_inverse_les_deux_tuiles():
    """[v2:B3] Tromper inverse le verdict pour les deux tuiles."""
    p = v2(peuples=["humains", "insectes"], regles={"tromper": lambda p, s, o, c: True})
    presence(p, humains={"Z1": 1, "Z2": 1, "Z4": 1}, insectes={"Z5": 2, "Z2": 1})
    p.ee.trompeurs.append(p.par_peuple["humains"])
    ordre(p, (2, 4))                                         # réussit, mais appris comme un échec
    assert p.piste[5].nom == "Opportunisme" and p.piste_m[3].nom == "Rapiat"


def test_embuscade_immobilise_la_machine_designee():
    """[v2:B3] Attendre : immobiliser la Machine désignée si elle est dans une zone des reptiles ou va y entrer."""
    p = v2(peuples=["reptiles", "insectes"])
    presence(p, reptiles={"Z4": 1, "Z6": 1, "Z7": 1}, insectes={"Z5": 2, "Z2": 1})
    info = p.interpreter((2, 4))                             # Opportunisme : Rapiat vers Z4 (reptiles invisibles)
    assert info["cible"] == "Z4"
    inst = next(i for i in p.instances if i.nom == "attendre")
    opts = inst.options_immobiliser(None, info)
    assert opts == [("immobiliser", "Z4", M(p, "Rapiat").uid)]


# ------------------------------------------------------------------ peuples et réglages
def test_egarer_v2():
    """[v2:B3] Une Machine mise HS alors que ses phares sont égarés rentre aussitôt au chantier, remise
    en état, et fait rêver le Méchant : rêve gratuit, voie au choix, hors limite."""
    p = v2(peuples=["entites", "insectes"], regles={"reve": lambda p, s, o, c: ("reveil",)})
    m = M(p, "Mâchoire")
    m.organes["moteur"] = True
    inst = next(i for i in p.instances if i.nom == "egarer")
    from tests.outils import jeu
    j = jeu(p, "entites", inst.moitie, zone="Z3", action="saboter", cible=(m.uid, "phares"))
    j.pouvoir = inst
    p.neutraliser(m, "phares", j)
    assert m.etat == "reserve" and not any(m.organes.values()) and len(p.cercle) == 1


def test_reglages_simples():
    """[v2:B1] [v2:C1] [v2:B2] [v2:B3] [v2:E1] [v2:E2] Réglages repris de l'atelier."""
    m = charger("v2", "code:c:A2a|m:|p:main=4,paquet=6,presence=2,tours=5,etapes=2,alliance=conjointe,"
                       "voir=1,hanter=2,immob=2,m_chantier=1")
    assert (m["cartes"]["main"], m["cartes"]["paquet"], m["presence"]["pions"], m["tours"], m["etapes"]) == (4, 6, 2, 5, 2)
    assert m["regles"]["alliance"] == "conjointe" and len(m["machines"]["reserve"]) == 1
    assert (m["pouvoirs"]["voir"]["par_tour"], m["pouvoirs"]["hanter"]["par_tour"], m["pouvoirs"]["attendre"]["par_tour"]) == (1, 2, 2)
    assert charger("v2")["plateau"]["fleches"]["Z1"] == "Z4"
    p = v2("c:A2a|m:|p:esprits_depart=1")
    assert p.piste[12].genre == "esprit"                     # [v2:A1]
    q = v2("c:A2a|m:|p:piste_place=hasard", graine=3)
    assert sorted(t.nom for t in q.piste.values()) == sorted(charger("v2")["piste"]["disposition"])


def test_bruit():
    """[v2:A5] Une Machine mise HS par Renverser (ou en alliance) fait reculer l'esprit le plus proche du 7."""
    p = v2("c:A2a|m:A5|p:", peuples=["mammiferes", "insectes"])
    p.piste[9], p.piste[10] = p._tuile("Esprit"), p.piste[9]
    m = M(p, "Grosse Gueule")
    m.organes["moteur"] = True
    from tests.outils import jeu
    inst = next(i for i in p.instances if i.nom == "renverser")
    j = jeu(p, "mammiferes", inst.moitie, zone="Z1", action="saboter", cible=(m.uid, "chenilles"))
    j.pouvoir = inst
    p.neutraliser(m, "chenilles", j)
    assert p.piste[10].genre == "esprit"


# ------------------------------------------------------------------ rêves et fins
def test_deux_voies_au_choix():
    """[v2:D2] [v2:D2v_choix] Le rêve choisit sa voie : sommeil (un esprit entre ou avance) ou réveil
    (la carte rejoint le Cercle)."""
    vus = []
    p = v2(regles={"reve": lambda p, s, o, c: (vus.append(list(o)), ("reveil",))[1]})
    p.faire_rever(p.sieges[0], "carte")
    assert ("reveil",) in vus[0] and ("entrer",) in vus[0] and len(p.cercle) == 1 and p.esprits() == []


def test_deux_voies_a_la_fois():
    """[v2:D2v_deux] Chaque rêve fait entrer ou avancer un esprit, et rejoint le Cercle."""
    p = v2("c:A2a,D2v_deux|m:|p:")
    p.faire_rever(p.sieges[0], "carte")
    assert len(p.cercle) == 1 and p.esprits() == [12]


def test_le_reveil_de_la_foret():
    """[v2:D2] [v2:D3] Le Cercle compte seuil cases par joueur ; plein, la partie s'arrête (réveil)."""
    p = v2("c:A2a|m:|p:seuil=2", regles={"reve": lambda p, s, o, c: ("reveil",)})
    assert p.capacite_cercle() == 4
    for _ in range(3):
        p.faire_rever(p.sieges[0], "carte")
    with pytest.raises(FinDePartie):
        p.faire_rever(p.sieges[1], "carte")
    assert p.fin[0] == "reveil"


def test_pas_de_silence_du_chantier():
    """[v2:D3] Le silence du chantier est retiré : toutes les Machines HS, la partie continue."""
    p = v2()
    for m in p.machines:
        for o in m.organes:
            m.organes[o] = True
    p.verifier_silence()
    assert p.fin is None
    p.controler()


def test_bilan_et_bonus():
    """[v2:D4] Le résultat est la forêt restante ; le bonus (réglage) s'ajoute pour le sommeil ou le réveil."""
    for bonus, fin, attendu in (("0", "reveil", 21), ("10", "reveil", 23.1), ("25", "sommeil", 26.25), ("25", "nuit", 21)):
        p = v2(f"c:A2a|m:|p:bonus={bonus}")
        p.fin = (fin, 3, 1)
        assert p.bilan()["resultat"] == pytest.approx(attendu)


def test_limite_de_table():
    """[v2:D1] Limite de table : au-delà, les cartes en travers ne rêvent pas et reviennent en main."""
    p = partie(TRIO, maquette="v2", variante="code:c:A2a|m:|p:reves_limite=table2",
               regles={"programmer_mode": lambda p, s, o, c: "reve" if "reve" in o else o[0],
                       "programmer_carte": lambda p, s, o, c: o[1] if c["etape"] == 1 else None,
                       "reve": lambda p, s, o, c: ("reveil",)})
    p.tour = 1
    p.conseil()
    p.etape = 1
    p.resoudre_etape(1)
    assert len(p.cercle) == 2 and p.compteur.comptes["lacune"]["reves_table_depasses"] == 1


def test_lunes():
    """[v2:D5] Seul un joueur qui tient une lune peut rêver ; une lune au plus devant soi."""
    def lune(p, s, o, c):
        return ("prendre", "centre") if ("prendre", "centre") in o else None
    vus = {}
    p = partie(TRIO, maquette="v2", variante="code:c:A2a|m:D5|p:lunes=1",
               regles={"lune": lune, "programmer_mode": lambda p, s, o, c: (vus.setdefault(s.idx, list(o)), o[0])[1]})
    p.tour = 1
    p.conseil()
    porteur = p.lunes[0]
    assert porteur is not None
    assert all(("reve" in o) == (i == porteur) for i, o in vus.items())


def test_dernier_sursaut_v2():
    """[v2:D6] Quand le Méchant s'endort, ses derniers plans s'exécutent encore."""
    p = v2("c:A2a|m:D6|p:sursaut=3")
    p.fin = ("sommeil", 1, 1)
    p.dernier_sursaut()
    assert 0 < p.compteur.comptes["stat"]["ordres_sursaut"] <= 3 or p.piste[sum((1, 1))].genre == "esprit"


# ------------------------------------------------------------------ communication et présage dans la v2
def test_communication_v2():
    """[v2:C2a] [v2:C2b] [v2:C2c] [v2:C2d] [v2:C2e] [v2:C3] Les cinq formes et le présage, par code."""
    attendu = {"C2a": "traces", "C2b": "partage", "C2c": "parle", "C2d": "aucun_signe", "C2e": "tout_dire"}
    for o, forme in attendu.items():
        m = charger("v2", f"code:c:A2a,{o}|m:C3|p:")
        assert m["regles"]["communication"] == forme and m["regles"]["presage"] is True
    m = charger("v2", "code:c:A2a,C2a|m:|p:traces_n=3,traces_datees=non")
    assert m["regles"]["traces_par_joueur"] == 3 and m["regles"]["traces_datees"] is False
    assert charger("v2", "code:c:A2a,C2b|m:|p:partage_max=1")["regles"]["partage_max"] == 1
    assert charger("v2", "code:c:A2a,C2a|m:|p:traces_eng=oui")["regles"]["traces_engagent"] is True


def test_conformite_v2():
    """Chaque nœud codé de docs/noeuds_v2.md a un renvoi dans le code et un test ; aucun renvoi orphelin."""
    import os
    from foret.conformite import matrice_v2, RACINE
    N, _, sans_test, sans_code, orphelins, non_codes = matrice_v2(
        os.path.join(RACINE, "docs", "noeuds_v2.md"), os.path.join(RACINE, "foret"), os.path.join(RACINE, "tests"))
    assert len(N) >= 40 and set(non_codes) == {"A6", "A7", "B4", "B5", "D7"}
    assert not sans_test and not sans_code and not orphelins, (sans_test, sans_code, orphelins)


# ------------------------------------------------------------------ parties complètes
@pytest.mark.parametrize("code", [V2, code_preset("coeur"), code_preset("gang"), code_preset("v1"),
                                  "c:A2b,d_fav,C2a,D2v_deux|m:C3,A5|p:seuil=2",
                                  "c:A2a,d_bb,C2e,D2v_choix|m:C3,A4,D6|p:hs=organe,portee=plateau",
                                  "c:A2a,d_six,C2d,D2v_choix|m:D5|p:m_chantier=1,reves_limite=table3,lunes=3",
                                  "c:A2a,d_hes,C2a,D2v_choix|m:C3|p:traces_eng=oui,barrage=entree,etapes=4,tours=8"])
@pytest.mark.parametrize("bot", [{"type": "aleatoire"}, {"type": "glouton"}, {"type": "glouton", "params": {"reves_par_tour": 1}}])
def test_parties_completes_v2(code, bot):
    """[v2:D3] Toute variante se joue jusqu'au bout, à 1 à 6 peuples, invariants contrôlés."""
    m = charger("v2", "code:" + code)
    for peuples in (["humains"], DUO, TRIO, SIX):
        for g in (1, 2):
            b = Partie(m, peuples, [fabriquer(bot, g * 7 + i) for i in range(len(peuples))], graine=g).jouer()
            assert b["fin"] in ("nuit", "sommeil", "reveil") and b["resultat"] >= b["foret"]


def test_copie_en_v2():
    """La copie d'état rejoue aussi la v2."""
    m = charger("v2", "gang")
    p = Partie(m, SIX, [fabriquer({"type": "aleatoire"}, i) for i in range(6)], graine=3)
    c = p.copie()
    assert c.jouer() == p.jouer()
