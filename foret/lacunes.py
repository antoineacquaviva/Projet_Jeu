"""Registre des situations que le moteur signale.

- LACUNES : ce que les règles ne disent pas (ou disaient mal). Statut :
  « ouverte » (choix par défaut provisoire) ou « tranchée » (une règle v1 la
  fixe désormais ; le moteur continue de compter ses occurrences, pour suivre
  l'effet des décisions).
- INCOHERENCES : situations produites par les règles qui semblent contraires à
  leur intention.

Le moteur refuse de signaler un code absent de ce registre : toute nouvelle
situation doit y être décrite.
"""


def _l(titre, defaut, statut="ouverte", alternatives="", regle=None):
    return dict(titre=titre, defaut=defaut, statut=statut, alternatives=alternatives, regle=regle)


LACUNES = {
    # ---------------------------------------------------- situations de jeu
    "egalite_critere": _l(
        "Plusieurs zones satisfont le critère",
        "Plus boisée, puis plus proche d'une Machine en marche, puis plus petit numéro.",
        "tranchée", regle="R7.1"),
    "egalite_arbitraire": _l(
        "Égalité qui ne se tranche qu'au numéro de zone",
        "Plus petit numéro.", "tranchée", regle="R7.1"),
    "egalite_machine": _l(
        "Plusieurs Machines à la même distance de la zone visée",
        "La plus avancée, puis le plus petit numéro.", "tranchée", regle="R7.2"),
    "chemin_multiple": _l(
        "Plusieurs pas possibles vers la zone visée",
        "Une zone non barrée, puis R7.1.", "tranchée", regle="R4.4"),
    "critere_sans_cible": _l(
        "Plus aucune zone boisée",
        "Le critère s'applique à toutes les zones.",
        alternatives="Ordre annulé."),
    "rayon_sans_foret": _l(
        "[v2:A2a] Plus aucune forêt dans le rayon de la Machine désignée",
        "La tactique choisit sa propre zone (rien à abattre : le plan échoue).",
        alternatives="Le rayon s'étend à la zone boisée la plus proche."),
    "percee_rasee": _l(
        "[v2:A3] La flèche de percée mène à une zone rasée",
        "La Machine reste dans sa zone et y abat.",
        alternatives="Elle entre dans la zone rasée et le plan échoue."),
    "egalite_rayon": _l(
        "[v2:A3] Plusieurs zones du rayon satisfont la tactique",
        "Sa propre zone si elle en est, puis la plus boisée, puis le plus petit numéro.", "tranchée"),
    "reves_table_depasses": _l(
        "[v2:D1] Plus de cartes en travers que la limite de la table (programmation simultanée)",
        "Les rêves se font dans l'ordre des étapes et des joueurs ; les cartes en trop ne rêvent pas et "
        "reviennent en main à la fin du tour.",
        alternatives="Elles sont perdues ; ou la limite se règle au conseil (les lunes)."),
    "trace_intenable": _l(
        "Une trace qui engage ne peut pas être tenue (pas de carte, pas de moitié permise, zone hors d'atteinte)",
        "La carte est libre.", alternatives="La carte est perdue ; la trace ne pouvait pas être posée.",
        regle="R2.5"),
    "represailles_sans_attaque": _l(
        "Représailles tirée alors qu'aucun organe n'a encore été neutralisé",
        "Comme Cupidité.", "tranchée", regle="R4.2"),
    "represailles_ancienne": _l(
        "Représailles vise une attaque d'un tour précédent",
        "Acceptée (aucune limite de temps).",
        alternatives="Fenêtre limitée au tour (paramètre fenetre)."),
    "percee_au_bout": _l(
        "Percée : la Machine la plus avancée est déjà au cœur",
        "Elle vise sa propre zone.", "tranchée", regle="R4.2",
        alternatives="La zone voisine la plus boisée."),
    "sans_machine": _l(
        "Un ordre est tiré alors qu'aucune Machine ne tourne",
        "Ordre sans effet : échec.",
        alternatives="Pas d'apprentissage."),
    "unir_sans_hote": _l(
        "Carte d'insecte glissée sous une étape où l'autre joueur n'a pas de carte (ou rêve)",
        "Elle agit seule, dans une zone de présence des insectes.", "tranchée", regle="R6.8"),
    "main_vide": _l(
        "Un joueur n'a plus aucune carte (toutes parties en rêve)",
        "Il ne joue plus ; la partie continue.",
        alternatives="Il récupère une carte ; il ne peut pas envoyer sa dernière carte en rêve."),
    "silence_avec_reserve": _l(
        "Plus aucune Machine ne tourne sur le plateau alors que la réserve n'est pas vide",
        "Silence atteint.",
        alternatives="Silence seulement si la réserve est vide (paramètre silence_reserve_vide)."),
    "reparer_relance_hs": _l(
        "Réparer remet en marche une Machine HS",
        "Permis.", "tranchée", regle="R4.5",
        alternatives="Une Machine HS est définitivement hors jeu (paramètre hs de Réparer)."),
    "parler_conflit_glissee": _l(
        "Parler déplacerait une carte vers une étape où son joueur a déjà une carte glissée "
        "(ou y emmènerait une carte d'insecte glissée dont le joueur occupe déjà cette étape)",
        "Ce déplacement n'est pas permis.",
        alternatives="Les cartes glissées s'échangent aussi ; la carte glissée se détache et reste sur son étape."),
    "reve_sans_option": _l(
        "Un rêve doit avoir lieu mais aucun esprit ne peut entrer ni avancer",
        "Le rêve est perdu.",
        alternatives="Interdire le rêve dans ce cas."),
    "ordre_contre_immobile": _l(
        "L'ordre désigne une Machine immobilisée par une embuscade",
        "Elle reste désignée : elle ne bouge ni n'abat, l'ordre échoue.",
        alternatives="On désigne la Machine en marche suivante."),
    "tuile_deplacee_avant_apprentissage": _l(
        "La tuile tirée a bougé (ou a été oubliée) entre le tirage et l'apprentissage",
        "L'apprentissage s'applique à la tuile là où elle est ; oubliée : pas d'apprentissage.",
        alternatives="Différer les rêves déclenchés pendant les embuscades à la fin de l'étape."),

    # ---------------------------------------------- points relevés en codant
    "main_depart": _l(
        "Paquet de 7 pour une main de 5 sans pioche",
        "5 cartes tirées au hasard ; les 2 autres ne servent pas.",
        alternatives="Choisir ses 5 cartes ; paquet de 5 ; repiocher (paramètre reprendre_du_paquet)."),
    "definition_criteres": _l(
        "Représailles (« viennent d'être attaquées »), Percée (« droit devant »), Opportunisme (« défendue »)",
        "Dernière attaque sans limite de temps ; zone voisine plus profonde ; pions de présence visibles.",
        alternatives="Liste des critères à revoir (notée 4)."),
    "reparer_renfort": _l(
        "Réparer : quelle Machine ? Renfort : où entre la Machine ?",
        "La plus endommagée, moteur d'abord ; lisière, selon R7.1.", "tranchée", regle="R4.5"),
    "hanter_forme": _l(
        "Hanter : « faire rêver tout de suite » sur la piste",
        "Annulation de l'ordre de l'étape, au choix du joueur, une fois par tour.",
        alternatives="Un esprit avance de deux cases."),
    "embuscade_portee": _l(
        "Embuscade : quelle Machine peut être immobilisée, et que devient-elle ?",
        "La Machine désignée, si elle est dans une zone de présence reptile ou va y entrer ; "
        "immobile jusqu'à la fin du tour ; une immobilisation par tour.", "tranchée", regle="R6.6"),
    "voler_porter_semer": _l(
        "Voler : porter un autre peuple, semer",
        "Non modélisés (propres à des personnages).",
        alternatives="Porter une présence alliée."),
    "escalade": _l(
        "Escalade de la menace en fin de partie",
        "Non implémentée (à repenser avec la piste)."),
    "bilan_echelle": _l(
        "Échelle de résultats du bilan",
        "Le moteur rend la forêt restante et le type de fin, sans paliers."),
    "plateau_provisoire": _l(
        "Plateau, Machines et piste de départ",
        "Plateau asymétrique de 7 zones, 3 Machines + 2 en réserve, piste fixe (R1.1 à R1.3).",
        "tranchée", regle="R1.1"),
}

INCOHERENCES = {
    "sommeil_par_echec": "Un esprit atteint le centre parce qu'une tactique a échoué en case 7 et a échangé sa place avec lui : contrer le Méchant l'endort.",
    "esprit_pousse_par_echec": "Une tactique qui échoue côté rêve fait avancer l'esprit avec lequel elle s'échange.",
    "esprit_cote_eveil": "Un esprit se retrouve côté éveil (2-6), ce que les règles ne prévoient pas.",
    "centre_quitte_sans_sommeil": "Un esprit a atteint le centre puis en a été chassé avant la vérification de fin de tour.",
    # "voir_trahi" (la tuile vue par les oiseaux a changé avant l'ordre) n'est plus une incohérence :
    # R6.2 garde les dés, pas la tuile (décision B4 du 12 oct.) ; compté en stat « voir_detourne ».
    "barrage_contourne": "La zone visée était barrée, mais la Machine a contourné le barrage et abattu ailleurs "
                         "(barrage v0 seulement ; en v1, abattre en chemin est permis par R4.3, décision B4).",
    "tactique_disparue": "Toutes les tuiles d'une tactique ont été oubliées.",
    "silence_impossible": "La table ne peut pas neutraliser certains organes (aucun spécialiste et pas d'alliance possible) : le silence est inatteignable.",
}
