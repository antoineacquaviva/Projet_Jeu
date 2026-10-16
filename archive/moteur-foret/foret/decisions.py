"""Catalogue des décisions que le moteur demande aux joueurs.

Toutes les décisions passent par Partie.decider(siege, type, options, **ctx) :
le moteur énumère les options légales, le bot en choisit une. Un bot qui ne
connaît pas un type de décision choisit au hasard (bots/base.py) : ajouter une
règle qui crée une décision ne casse donc aucun bot.

Le moteur refuse un type absent de ce catalogue.
"""

DECISIONS = {
    "presence": dict(
        regle="R1.5", options="zones (str)",
        contexte="pion : numéro du pion posé (0, 1, 2…)",
        role="Où poser un pion de présence à la mise en place."),
    "voir": dict(
        regle="R6.2", options="None, ou une carte de la main",
        contexte="etape",
        role="Engager une carte face visible sur cette étape et lancer ses dés."),
    "programmer_carte": dict(
        regle="R2.1", options="None (étape vide), ou une carte de la main",
        contexte="etape",
        role="Quelle carte poser sur cette étape."),
    "programmer_mode": dict(
        regle="R2.1, R2.2", options='"haut", "bas", "reve" (selon ce qui est encore permis)',
        contexte="etape, carte",
        role="Orientation de la carte, ou rêve."),
    "hote": dict(
        regle="R6.8", options="None, ou l'indice d'un autre siège",
        contexte="etape",
        role="Glisser la carte sous l'étape d'un autre joueur."),
    "aller": dict(
        regle="R3.2", options='None, ou ("aller", zone_depart, zone_arrivee)',
        contexte="jeu",
        role="Se déplacer d'abord (sinon, choisir une autre action ensuite)."),
    "action": dict(
        regle="R3.1", options='("barrer", zone), ("saboter", zone, uid_machine, organe), ("soutenir", zone) si permis',
        contexte="jeu",
        role="Action et zone d'une carte révélée."),
    "embuscade": dict(
        regle="R6.6", options='comme action + aller, plus ("immobiliser", zone, uid_machine) si permis',
        contexte="jeu, info (ordre tiré : tuile, cible, machine)",
        role="Action d'une carte en embuscade, l'ordre étant connu."),
    "pouvoir": dict(
        regle="R6.11", options="False, True",
        contexte="pouvoir (nom), jeu",
        role="Utiliser maintenant un pouvoir limité en nombre (Hanter)."),
    "reve": dict(
        regle="R5.3, v2:D2", options='("entrer",) ou ("avancer", case) : voie du sommeil ; ("reveil",) : voie du réveil (le Cercle), si la maquette a deux voies au choix',
        contexte="source : carte ou egarer",
        role="Comment le Méchant rêve."),
    "parler": dict(
        regle="R6.10", options='None, ou ("deplacer", siege, etape_depart, etape_arrivee)',
        contexte="jeu",
        role="Déplacer une carte cachée d'une étape suivante."),
    "trace": dict(
        regle="R2.5", options='None (ne plus poser), ou (etape, lieu) ; lieu = une zone ou "reve" ; '
                              'etape = None si les traces ne sont pas datées (conseil parlé)',
        contexte="ronde, rang (numéro de la trace posée dans la ronde), anciennes (traces de la ronde précédente)",
        role="Poser une trace : « à cette étape (ou ce tour), j'agirai ici » ; sur « reve » : « je rêve »."),
    "partage": dict(
        regle="R2.5", options='None (passer), ("prendre", uid_machine, source) avec source = "centre" ou un siège, '
                              'ou ("rendre", uid_machine)',
        contexte="ronde",
        role="Prendre ou rendre un jeton du partage : « ce tour, je m'occupe de cette Machine »."),
    "lune": dict(
        regle="v2:D5", options='None (rien), ("prendre", "centre" ou un siège), ("rendre",)',
        contexte="ronde",
        role="Les lunes : seul un joueur qui tient une lune peut rêver ce tour."),
    "tromper": dict(
        regle="R6.9", options="False, True",
        contexte="reussite : ce que le Méchant s'apprête à apprendre",
        role="Inverser ce que le Méchant apprend."),
}
