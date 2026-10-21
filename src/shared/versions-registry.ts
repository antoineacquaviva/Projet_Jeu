import {
  BoxComponentSpec,
  GameVersionSpec,
  LabIdea,
  RuleOptionSpec,
  SetupStepSpec,
  VariableParameterSpec,
  VariantV01,
} from './types';

export const OPTIONS_REGLES_COMMUNES: RuleOptionSpec[] = [
  {
    id: 'opt_mode_programmation',
    cleVariante: 'modeProgrammation',
    nom: 'Séquencement de la Programmation',
    categorie: 'Séquencement de la Programmation',
    introduiteEnVersion: '0.1',
    description:
      'Détermine dans quel ordre les joueurs posent leurs cartes d’action après avoir consulté leur gobelet 2D6 secret.',
    choix: [
      {
        valeur: 'sequentielle_2_ordres',
        label: 'Séquentielle (Action I + II d’affilée par joueur)',
        estReference: true,
        description:
          'Chaque joueur programme à son tour les 2 actions de ses Défenseurs, puis passe la main au joueur suivant.',
        impactPhysique:
          'Posez vos 2 cartes face cachée devant chaque pion Défenseur avant que le voisin de gauche ne joue.',
      },
      {
        valeur: 'alternee_1_par_1',
        label: 'Alternée en 2 tours de table (Action I puis Action II)',
        description:
          'Un 1er tour de table complet pour poser l’Action I de tous les joueurs, puis un 2e tour de table pour l’Action II.',
        impactPhysique:
          'Chaque joueur pose uniquement sa carte Action I ; une fois le tour de table fini, chacun pose sa carte Action II.',
      },
      {
        valeur: '2e_apres_ciblage',
        label: 'Réactive (2e action programmée après le ciblage des Machines)',
        description:
          'Les joueurs programment l’Action I ; on résout Action I et le déplacement des Machines ; puis les joueurs programment l’Action II à vue.',
        impactPhysique:
          'Conservez votre paquet en main après l’Action I : vous choisirez votre carte Action II après avoir vu où atterrissent les Machines.',
      },
      {
        valeur: 'un_seul_ordre',
        label: 'Simplifiée (1 seule action par Défenseur et par tour)',
        description:
          'Chaque Défenseur ne reçoit qu’un seul ordre par tour de jeu (mode rapide ou test de viabilité).',
        impactPhysique:
          'On n’utilise que l’emplacement « Action I » des plateaux individuels.',
      },
    ],
  },
  {
    id: 'opt_mode_resolution',
    cleVariante: 'modeResolution',
    nom: 'Séquencement de la Résolution & des Coupes',
    categorie: 'Séquencement de la Résolution',
    introduiteEnVersion: '0.1',
    description:
      'Fixe le moment exact où les Machines se déplacent et abattent les Forêts par rapport aux actions des Défenseurs.',
    choix: [
      {
        valeur: 'entrelacee_coupe_fin',
        label: 'Entrelacée (Machines ciblent au milieu, coupent en fin de tour)',
        estReference: true,
        description:
          '1res actions Défenseurs → Déplacement/Ciblage des Machines → 2es actions Défenseurs → Coupe des Forêts & Apprentissage.',
        impactPhysique:
          'Au milieu du tour, déplacez les figurines Machines sans toucher aux arbres ; retirez les pions Forêt uniquement après l’Action II.',
      },
      {
        valeur: 'deux_vagues_completes',
        label: 'Deux Vagues de Coupe Successives (Mi-tour + Fin de tour)',
        description:
          'La moitié des dés de Machines cible et coupe dès la fin de l’Action I ; la seconde moitié cible et coupe après l’Action II.',
        impactPhysique:
          'Révélez la moitié des gobelets après l’Action I (déplacement + coupe immédiate), puis le reste après l’Action II.',
      },
      {
        valeur: 'machines_avant_actions',
        label: 'Machines d’abord (Ciblage avant les 2 actions des Défenseurs)',
        description:
          'Les Machines annoncent et rejoignent leurs cibles dès le début de la résolution, suivies des Actions I et II puis de la coupe.',
        impactPhysique:
          'Soulevez tous les gobelets et déplacez les Machines avant de retourner la moindre carte Action Défenseur.',
      },
    ],
  },
  {
    id: 'opt_effet_proteger',
    cleVariante: 'effetProteger',
    nom: 'Portée de l’action « Protéger »',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.1',
    description:
      'Précise comment la posture Bouclier d’un Défenseur bloque l’action des Machines sur sa tuile.',
    choix: [
      {
        valeur: 'coupe_seule',
        label: 'Bouclier anti-coupe (1 Défenseur empêche la coupe sur sa tuile)',
        estReference: true,
        description:
          'Les Machines peuvent entrer sur la tuile mais leur lame est bloquée au moment du bilan des coupes.',
        impactPhysique:
          'Couchez le pion Défenseur sur sa tranche : aucun pion Forêt de cette tuile ne peut être retiré ce tour.',
      },
      {
        valeur: 'barrage_entree_et_coupe',
        label: 'Barrage complet (Bloque l’entrée des Machines ET la coupe)',
        description:
          'Une tuile protégée dès l’Action I est interdite d’accès aux Machines qui doivent se rabattre sur une autre tuile.',
        impactPhysique:
          'Placez le pion Défenseur couché à cheval sur la frontière de la tuile pour interdire l’entrée des figurines Machines.',
      },
      {
        valeur: 'protection_collective',
        label: 'Protection collective (Exige 2 Défenseurs sur la tuile)',
        description:
          'Un Défenseur seul ne suffit plus : il faut réunir au moins 2 pions Défenseurs (dont 1 en posture Bouclier) pour empêcher la coupe.',
        impactPhysique:
          'Vérifiez qu’au moins 2 pions Défenseurs occupent la tuile avant d’annuler la coupe des Machines.',
      },
    ],
  },
  {
    id: 'opt_effet_saboter',
    cleVariante: 'effetSaboter',
    nom: 'Mécanique de l’action « Saboter »',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.1',
    description:
      'Définit la condition et la conséquence matérielle du sabotage d’une Machine présente sur la tuile.',
    choix: [
      {
        valeur: 'individuel_chantier',
        label: 'Sabotage individuel (Renvoie 1 Machine au Chantier)',
        estReference: true,
        description:
          'Un seul Défenseur sur la tuile suffit pour démonter une Machine et la renvoyer dans la zone Chantier/Réserve.',
        impactPhysique:
          'Prenez la figurine Machine sur la tuile et replacez-la dans la zone « Chantier / Réserve » hors plateau.',
      },
      {
        valeur: 'alliance_requise',
        label: 'Sabotage en alliance (Exige 2 Défenseurs sur la tuile)',
        description:
          'Le sabotage ne réussit que si au moins 2 pions Défenseurs (du même joueur ou alliés) occupent la tuile de la Machine.',
        impactPhysique:
          'Deux pions Défenseurs doivent entourer la figurine Machine sur la tuile pour l’expulser vers le Chantier.',
      },
      {
        valeur: 'immobiliser_sur_place',
        label: 'Immobilisation sur place (Machine couchée pour le tour)',
        description:
          'La Machine n’est pas renvoyée au Chantier mais couchée sur la tuile : elle ne coupe pas ce tour et repartira de là au tour suivant.',
        impactPhysique:
          'Couchez la figurine Machine sur le flanc directement sur sa tuile ; redressez-la en fin de tour.',
      },
    ],
  },
  {
    id: 'opt_replanter',
    cleVariante: 'actionReplanterActive',
    nom: 'Carte Action « Replanter une Forêt »',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.1',
    description:
      'Ajoute ou retire une 4e carte Action permettant de remettre en jeu un pion Forêt sur sa tuile (dans la limite de sa capacité).',
    choix: [
      {
        valeur: 'false',
        label: 'Désactivée (Socle strict à 3 actions : Déplacer, Protéger, Saboter)',
        estReference: true,
        description:
          'Chaque perte de Forêt est définitive : la tension repose intégralement sur la parade et le sabotage.',
        impactPhysique:
          'Retirez la carte « Replanter » des mains des joueurs (3 cartes par Défenseur).',
      },
      {
        valeur: 'true',
        label: 'Activée (4e carte « Replanter » disponible)',
        description:
          'Permet d’ajouter 1 pion Forêt de la réserve sur sa tuile si aucune Machine active ne s’y trouve.',
        impactPhysique:
          'Distribuez la 4e carte « Replanter » à chaque joueur ; prenez 1 pion Forêt dans la réserve pour le poser sur la tuile.',
      },
    ],
  },
  {
    id: 'opt_deplacement_double',
    cleVariante: 'deplacementDoubleActif',
    nom: 'Amplitude de l’action « Se Déplacer »',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.1',
    description:
      'Détermine si un ordre de déplacement permet de franchir 1 seule frontière ou jusqu’à 2 tuiles adjacentes.',
    choix: [
      {
        valeur: 'false',
        label: 'Marche normale (1 tuile adjacente)',
        estReference: true,
        description:
          'Le Défenseur se déplace vers une tuile directement reliée (1 frontière franchie).',
        impactPhysique:
          'Glissez le pion Défenseur sur une tuile immédiatement voisine.',
      },
      {
        valeur: 'true',
        label: 'Course forestière (Jusqu’à 2 tuiles de distance)',
        description:
          'Le Défenseur peut traverser une tuile intermédiaire en une seule action programmée.',
        impactPhysique:
          'Déplacez le pion Défenseur d’une ou deux tuiles le long des liaisons du plateau.',
      },
    ],
  },
  {
    id: 'opt_rythme_apprentissage',
    cleVariante: 'rythmeApprentissage',
    nom: 'Apprentissage du Méchant sur la Double Piste',
    categorie: 'Automatismes du Méchant',
    introduiteEnVersion: '0.1',
    description:
      'Règle la façon dont les cartes Tactiques (2–12) et Machines (0–5) glissent vers les pics de probabilité.',
    choix: [
      {
        valeur: 'chaque_machine',
        label: 'Continu (Permutation après chaque Machine résolue)',
        estReference: true,
        description:
          'Chaque Machine qui coupe fait immédiatement glisser sa Tactique vers 7 et sa carte Machine vers 1.',
        impactPhysique:
          'Échangez immédiatement la carte Tactique et la tuile Machine d’un cran sur leur piste respective après chaque verdict.',
      },
      {
        valeur: 'fin_de_tour',
        label: 'Groupé en fin de tour (Après toutes les coupes)',
        description:
          'Toutes les coupes sont d’abord comptabilisées, puis on applique les permutations sur les deux pistes en une seule étape.',
        impactPhysique:
          'Attendez que les N Machines aient agi avant de faire glisser les cartes sur les pistes Tactique et Machine.',
      },
      {
        valeur: 'aucun',
        label: 'Désactivé (Pistes statiques — témoin de test)',
        description:
          'Les pistes restent figées dans leur configuration initiale toute la partie (sert à mesurer l’impact de l’apprentissage en 3.2).',
        impactPhysique:
          'Ne déplacez aucune carte sur les pistes Tactique et Machine en fin de tour.',
      },
    ],
  },
  {
    id: 'opt_portee_tactiques',
    cleVariante: 'porteeTactiques',
    nom: 'Portée de ciblage des Machines',
    categorie: 'Automatismes du Méchant',
    introduiteEnVersion: '0.1',
    description:
      'Définit si une Machine choisit sa cible parmi son voisinage immédiat ou sur tout le plateau.',
    choix: [
      {
        valeur: 'voisinage',
        label: 'Locale (Tuile actuelle + tuiles adjacentes)',
        estReference: true,
        description:
          'La Machine évalue sa Tactique uniquement sur sa tuile et les tuiles directement reliées.',
        impactPhysique:
          'Comparez uniquement la tuile où se trouve la Machine et ses voisines immédiates.',
      },
      {
        valeur: 'plateau_entier',
        label: 'Globale (Saut sur n’importe quelle tuile du plateau)',
        description:
          'La Machine peut bondir directement sur la tuile du plateau qui maximise son critère Tactique.',
        impactPhysique:
          'Inspectez l’ensemble des tuiles du plateau pour y poser directement la figurine Machine.',
      },
    ],
  },
];

export const OPTIONS_REGLES_V02_MODULES: RuleOptionSpec[] = [
  {
    id: 'opt_jeton_eclaireur',
    cleVariante: 'jetonEclaireurActif',
    nom: 'Jeton Éclaireur (Indice partagé de secteur)',
    categorie: 'Modules Avancés (Labo)',
    introduiteEnVersion: '0.2',
    description:
      'Issue du Labo : une fois par tour, un joueur peut poser le Jeton Éclaireur sur une tuile pour signaler une menace critique sans parler.',
    choix: [
      {
        valeur: 'false',
        label: 'Désactivé (Déduction 100 % silencieuse par les cartes)',
        description:
          'Aucun jeton d’indice : seules les programmations posées servent de signal.',
        impactPhysique: 'Laissez le Jeton Éclaireur dans la boîte.',
      },
      {
        valeur: 'true',
        label: 'Activé (1 Jeton Éclaireur posable par tour)',
        estReference: true,
        description:
          'Le premier joueur à programmer peut poser le Jeton Éclaireur en bois sur une tuile menacée par son gobelet.',
        impactPhysique:
          'Posez le Jeton Éclaireur jaune sur une tuile du plateau avant de programmer votre Action I.',
      },
    ],
  },
  {
    id: 'opt_peuples_asymetriques',
    cleVariante: 'peuplesAsymetriquesActifs',
    nom: 'Spécialisation Asymétrique des Peuples',
    categorie: 'Modules Avancés (Labo)',
    introduiteEnVersion: '0.2',
    description:
      'Issue du Labo : confère à chaque Peuple de Défenseurs une affinité matérielle distincte (mobilité, bouclier renforcé, sabotage).',
    choix: [
      {
        valeur: 'false',
        label: 'Peuples identiques (Symétrie V0.1)',
        estReference: true,
        description:
          'Tous les joueurs disposent exactement des mêmes capacités de Défenseurs.',
        impactPhysique:
          'Utilisez la face standard identique des plateaux Peuple.',
      },
      {
        valeur: 'true',
        label: 'Peuples asymétriques (Face spécialisée V0.2)',
        description:
          'Chaque Peuple retourne son plateau sur sa face spécialisée (Marcheurs des Cimes, Gardiens d’Écorce, Saboteurs de Ronce...).',
        impactPhysique:
          'Retournez chaque plateau individuel Peuple sur sa face « Spécialisation V0.2 ».',
      },
    ],
  },
];

export const OPTIONS_REGLES_V03_PLATEAU: RuleOptionSpec[] = [
  {
    id: 'opt_geometrie_plateau',
    cleVariante: 'geometriePlateau',
    nom: 'Architecture Géométrique du Plateau (Chantier V0.3)',
    categorie: 'Géométrie & Topologie du Plateau',
    introduiteEnVersion: '0.3',
    description:
      'Remplace l’assemblage modulaire d’une tuile par joueur par des architectures de plateau fixes, calibrées pour l’intérêt stratégique, la lisibilité sur table et l’équilibre de 3 à 6 joueurs.',
    choix: [
      {
        valeur: 'double_plateau_34_56',
        label: 'Plateau Double Face Fixe (Recto 3–4J à 9 zones / Verso 5–6J à 13 zones)',
        estReference: true,
        description:
          'Deux plateaux fixes dédiés : le Recto (9 zones : 1 Cœur, 4 Clairières, 4 Lisières) est calibré pour 3 et 4 joueurs ; le Verso (13 zones : 1 Cœur, 6 Clairières, 6 Lisières) pour 5 et 6 joueurs, avec diagonales d’entraide.',
        impactPhysique:
          'Dépliez le grand plateau central sur sa face « 3–4 Joueurs » ou « 5–6 Joueurs » : aucun assemblage de tuiles requis.',
      },
      {
        valeur: 'hex_couronne_19',
        label: 'Grille Hexagonale Fixe en Couronnes (19 hexagones : 1 + 6 + 12)',
        description:
          'Un plateau unique de 19 cases hexagonales (1 Cœur central, 6 hexagones en Couronne Intérieure, 12 hexagones en Lisière Extérieure). Chaque case intérieure possède 6 voisins directs.',
        impactPhysique:
          'Posez le plateau hexagonal à 19 cases : les déplacements suivent les 6 côtés de chaque hexagone.',
      },
      {
        valeur: 'clairieres_sentiers',
        label: 'Réseau de Clairières & Sentiers à Embranchements (13 nœuds & 3 Cols)',
        description:
          'Carte forestière point-à-point composée de 6 Lisières d’entrée convergeant vers 3 Cols de Vallée et 3 Sanctuaires Intérieurs autour du Cœur. Crée des carrefours stratégiques très lisibles.',
        impactPhysique:
          'Suivez les sentiers forestiers tracés sur le plateau entre les clairières et verrouillez les 3 Cols de passage.',
      },
      {
        valeur: 'modulaire_secteurs',
        label: 'Couronne Modulable Historique V0.1 (1 Cœur + 2 tuiles par joueur)',
        description:
          'Témoin de référence V0.1 : on assemble exactement J secteurs de 2 tuiles autour de la Tuile Cœur Central.',
        impactPhysique:
          'Encastrez 2 tuiles par joueur présent autour de la Tuile Cœur.',
      },
    ],
  },
];

export const PARAMETRES_VARIABLES_COMMUNS: VariableParameterSpec[] = [
  {
    id: 'param_nb_joueurs',
    cleVariante: 'nbJoueurs',
    nom: 'Nombre de Joueurs autour de la table',
    unite: 'joueurs',
    min: 3,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Détermine le nombre de Peuples en jeu (3 à 6 joueurs), la face du plateau utilisée (en mode Double Face) et le nombre de lancers 2D6 de Machines par tour.',
    impactMateriel:
      'Distribuez 1 plateau Peuple et 1 gobelet 2D6 à chacun des J joueurs.',
  },
  {
    id: 'param_defenseurs_par_joueur',
    cleVariante: 'defenseursParJoueur',
    nom: 'Pions Défenseurs par Joueur (n)',
    unite: 'pions / joueur',
    min: 1,
    max: 3,
    pas: 1,
    valeurReference: 2,
    description:
      'Nombre de pions Défenseurs que chaque joueur contrôle et programme à chaque tour.',
    impactMateriel:
      'Chaque joueur prend n pions en bois de sa couleur et les pose sur sa zone de départ.',
  },
  {
    id: 'param_forets_secteur',
    cleVariante: 'foretsParCaseSecteur',
    nom: 'Forêts initiales par Case / Clairière périphérique',
    unite: 'arbres / case',
    min: 2,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Nombre de pions Forêt en bois posés au départ sur chaque case Intérieure et Lisière.',
    impactMateriel:
      'Posez ce nombre de pions Forêt verts sur chacune des cases périphériques du plateau.',
  },
  {
    id: 'param_forets_coeur',
    cleVariante: 'foretsCoeur',
    nom: 'Forêts initiales sur le Cœur Central',
    unite: 'arbres',
    min: 3,
    max: 8,
    pas: 1,
    valeurReference: 6,
    description:
      'Réserve d’arbres du sanctuaire central vers lequel convergent les Machines en tactique Percée.',
    impactMateriel:
      'Posez ces pions Forêt au centre sur la case Cœur de la Forêt.',
  },
  {
    id: 'param_machines_initiales',
    cleVariante: 'machinesInitiales',
    nom: 'Machines déployées sur le plateau au départ',
    unite: 'machines (sur 6)',
    min: 2,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Nombre de figurines Machines placées en Lisière dès le début de la partie (les autres démarrent au Chantier).',
    impactMateriel:
      'Posez M0 à M(k-1) sur les cases Lisière et laissez les autres sur la zone Chantier.',
  },
  {
    id: 'param_nb_tours',
    cleVariante: 'nbTours',
    nom: 'Durée de la partie',
    unite: 'tours complets',
    min: 3,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Nombre de tours de jeu complets à tenir avant le décompte final des Forêts préservées.',
    impactMateriel:
      'Placez le marqueur Tour sur la case 1 de la piste de compte-tours (arrêt au tour N).',
  },
];

export const COMPOSANTS_BOITE_V01: BoxComponentSpec[] = [
  {
    id: 'comp_tuiles_plateau',
    categorie: 'Plateau Modulable',
    nom: '1 Tuile Cœur Central + 12 Tuiles de Secteur (6 Intérieures, 6 Lisières)',
    quantiteFormule: 'dynamique_joueurs',
    descriptionMat:
      'Tuiles hexagonales en carton épais 2,5 mm avec encoches d’assemblage modulables pour 3, 4, 5 ou 6 joueurs.',
    usageRegle:
      'On assemble le Cœur Central et 2 tuiles par joueur présent autour de la table.',
  },
  {
    id: 'comp_pions_foret',
    categorie: 'Écosystème Forestier',
    nom: 'Pions Forêt en bois (Arbres)',
    quantiteFormule: 'dynamique_forets',
    descriptionMat:
      'Pions cylindriques ou silhouettes d’arbres en bois peint vert sapin.',
    usageRegle:
      'Répartis sur chaque tuile au départ ; retirés un par un lors de la phase de coupe des Machines.',
  },
  {
    id: 'comp_pions_defenseurs',
    categorie: 'Peuples Défenseurs',
    nom: 'Pions Défenseurs en bois & Plateaux Peuples',
    quantiteFormule: 'dynamique_defenseurs',
    descriptionMat:
      'Meeples en bois aux couleurs des 6 Peuples (identiques en V0.1) + 1 plateau individuel par joueur avec emplacements Action I et Action II.',
    usageRegle:
      'Debout pour se déplacer ou saboter ; couché sur le flanc pour indiquer la posture « Protéger (Bouclier) ».',
  },
  {
    id: 'comp_machines',
    categorie: 'Forces du Méchant',
    nom: '6 Figurines Machines numérotées (M0 à M5) & 6 Tuiles Piste Machine',
    quantiteFormule: '6 figurines + 6 tuiles',
    descriptionMat:
      '6 pions/figurines métalliques ou bois anthracite gravés M0 à M5, accompagnés de leurs 6 tuiles pour la Piste Machine (cases 0 à 5).',
    usageRegle:
      'Placées sur les tuiles Lisière ou dans la zone « Chantier / Réserve ». Désignées par l’écart |d1 - d2|.',
  },
  {
    id: 'comp_piste_tactique',
    categorie: 'Automatismes & Apprentissage',
    nom: 'Plateau Double Piste du Méchant + 11 Cartes Tactiques',
    quantiteFormule: '1 plateau + 11 cartes',
    descriptionMat:
      'Plateau affichant la Piste Tactique (cases 2 à 12 avec probabilités sur 36) et la Piste Machine (cases 0 à 5).',
    usageRegle:
      'La somme (d1 + d2) désigne la Tactique ; l’écart |d1 - d2| désigne la Machine. Les cartes glissent vers 7 et 1 quand le Méchant réussit à couper.',
  },
  {
    id: 'comp_gobelets_et_cartes',
    categorie: 'Programmation & Déduction',
    nom: 'Gobelets Opaques, Dés 2D6 & Cartes de Programmation',
    quantiteFormule: 'dynamique_gobelets',
    descriptionMat:
      'Pour chaque joueur : 1 gobelet opaque, 2 dés à 6 faces, et 1 jeu de cartes d’action par pion Défenseur.',
    usageRegle:
      'Chaque joueur regarde ses 2D6 sous son gobelet en silence, puis pose ses cartes d’action à son tour de table.',
  },
];

export const ETAPES_MISE_EN_PLACE_V01: SetupStepSpec[] = [
  {
    numero: 1,
    titre: 'Assembler la Couronne Modulable du Plateau',
    materiel: 'Tuile Cœur Central + 2 tuiles Secteur par joueur',
    consigne:
      'Posez la Tuile Cœur au centre de la table, puis encastrez autour d’elle autant de secteurs (Intérieur + Lisière) qu’il y a de joueurs.',
    astuceTable:
      'Les tuiles des secteurs surnuméraires restent dans la boîte de jeu.',
  },
  {
    numero: 2,
    titre: 'Planter les Pions Forêt en Bois',
    materiel: 'Pions Forêt en bois verts',
    consigne:
      'Placez le nombre de pions Forêt prévu par la variante sur la Tuile Cœur et sur chaque tuile de secteur.',
    astuceTable:
      'Regroupez les arbres bien en évidence sur chaque tuile pour que les joueurs identifient immédiatement les tuiles les plus boisées (cibles de Cupidité).',
  },
  {
    numero: 3,
    titre: 'Installer la Double Piste Publique du Méchant',
    materiel: 'Plateau Double Piste + 11 cartes Tactiques + 6 tuiles Machine',
    consigne:
      'Étalez les 11 cartes Tactiques sur les cases 2 à 12 de la Piste Tactique et les 6 tuiles M0 à M5 sur les cases 0 à 5 de la Piste Machine.',
    astuceTable:
      'Assurez-vous que les probabilités (6/36 sur la case 7, 10/36 sur l’écart 1) soient bien lisibles par tous autour de la table.',
  },
  {
    numero: 4,
    titre: 'Positionner les 6 Figurines Machines (Lisières & Chantier)',
    materiel: 'Figurines M0 à M5',
    consigne:
      'Placez les Machines initiales sur les tuiles de Lisière périphériques et les autres dans la zone « Chantier / Réserve ».',
    astuceTable:
      'Une Machine au Chantier entrera automatiquement en Lisière dès que son numéro sera appelé par un écart de dés.',
  },
  {
    numero: 5,
    titre: 'Placer les Défenseurs & Distribuer Gobelets et Cartes',
    materiel: 'Pions Défenseurs, Plateaux Peuple, Gobelets 2D6 et Cartes Action',
    consigne:
      'Chaque joueur pose ses pions Défenseurs sur son secteur, prend son jeu de cartes d’action et place son gobelet avec 2 dés devant lui.',
    astuceTable:
      'La partie est prête : tous les joueurs secouent simultanément leur gobelet 2D6 pour ouvrir le Tour 1 !',
  },
];

export const COMPOSANTS_BOITE_V03: BoxComponentSpec[] = [
  {
    id: 'comp_plateau_v03',
    categorie: 'Plateaux Fixes V0.3 (Remplacent les tuiles modulaires)',
    nom: '1 Grand Plateau Pliable Double Face (3–4J / 5–6J) + Calques Topologiques (Hexagones 19 & Sentiers)',
    quantiteFormule: '1 plateau recto-verso (9 ou 13 zones) / 19 hexagones / 13 clairières',
    descriptionMat:
      'Plateau central rigide éliminant l’assemblage d’une tuile par joueur : Face A calibrée pour 3–4 joueurs (9 zones), Face B pour 5–6 joueurs (13 zones), ou variantes Grille Hexagonale (19 hexagones) et Réseau de Clairières & Sentiers (13 nœuds et 3 cols).',
    usageRegle:
      'Dépliez directement le plateau correspondant à la géométrie V0.3 testée : les connexions et distances au Cœur sont immédiatement lisibles.',
    nouveauteVersion: true,
  },
  ...COMPOSANTS_BOITE_V01.slice(1),
];

export const ETAPES_MISE_EN_PLACE_V03: SetupStepSpec[] = [
  {
    numero: 1,
    titre: 'Déplier le Plateau Fixe V0.3 (Double Face 3–4J/5–6J, Hexagones 19 ou Clairières & Sentiers)',
    materiel: 'Grand Plateau V0.3 au centre de la table',
    consigne:
      'En mode Double Face, choisissez la face « 3–4 Joueurs » (9 zones) ou « 5–6 Joueurs » (13 zones). En mode Hexagonal (19 cases) ou Clairières & Sentiers (13 nœuds), posez le plateau fixe correspondant.',
    astuceTable:
      'Aucun assemblage de tuiles par joueur : la mise en place du plateau prend 5 secondes et la géométrie reste stable quel que soit le nombre de joueurs.',
  },
  ...ETAPES_MISE_EN_PLACE_V01.slice(1),
];

export const OPTIONS_REGLES_V04_PLACEMENT: RuleOptionSpec[] = [
  {
    id: 'opt_geometrie_plateau_v04',
    cleVariante: 'geometriePlateau',
    nom: 'Architecture Géométrique & Dimension du Plateau (V0.4)',
    categorie: 'Géométrie & Topologie du Plateau',
    introduiteEnVersion: '0.4',
    description:
      'Six architectures fixes et dimensions explorées en V0.4 (9 à 21 zones) : détermine les goulots d’étranglement pour barrer les Machines à 1 Défenseur, la saturation de clairière et les carrefours de Coalition.',
    choix: [
      {
        valeur: 'double_plateau_34_56',
        label: 'Plateau Double Face Fixe (Recto 3–4J à 9 zones / Verso 5–6J à 13 zones)',
        estReference: true,
        description:
          'Recto 9 zones pour 3–4J et Verso 13 zones pour 5–6J, avec diagonales d’entraide permettant à 2 Peuples voisins de se rejoindre en 1 seul déplacement.',
        impactPhysique:
          'Dépliez le plateau central sur la face « 3–4 Joueurs » ou « 5–6 Joueurs ».',
      },
      {
        valeur: 'compact_9_cases',
        label: 'Micro-Plateau Compact 9 Zones (1 Cœur + 4 Clairières + 4 Lisières)',
        description:
          'Dimension ultra-dense à 9 zones quel que soit le nombre de joueurs : favorise les collisions rapides, la saturation des clairières et une tension immédiate à chaque choix.',
        impactPhysique:
          'Utilisez la face compacte à 9 clairières : les pions se croisent dès le premier déplacement.',
      },
      {
        valeur: 'clairieres_sentiers',
        label: 'Réseau de Clairières & Sentiers à Embranchements (13 nœuds & 3 Cols)',
        description:
          '6 Lisières convergent vers 3 Cols de Vallée et 3 Sous-Bois avant le Cœur : placer 1 Défenseur sur un Col bloque l’accès au Cœur.',
        impactPhysique:
          'Posez le plateau Clairières & Sentiers : repérez les 3 Cols stratégiques.',
      },
      {
        valeur: 'sentiers_goulots_15',
        label: 'Sentiers à Goulots d’Étranglement 15 Zones (4 Cols à Capacité 1)',
        description:
          '15 zones comprenant 4 Cols Goulots étroits qui n’acceptent qu’un seul Défenseur en transit : si 2 joueurs visent le même col, le second voit son mouvement contrarié et son 2e ordre annulé !',
        impactPhysique:
          'Les 4 Cols étroits portent un pictogramme « Max 1 Défenseur hors Machine » : tout second pion arrivant sur un col occupé reste sur sa case de départ.',
      },
      {
        valeur: 'hex_couronne_19',
        label: 'Grille Hexagonale Fixe en Couronnes (19 hexagones : 1 + 6 + 12)',
        description:
          '19 cases hexagonales offrant 6 directions par case intérieure : maximise les manœuvres d’encerclement mais demande une couverture attentive.',
        impactPhysique:
          'Posez le plateau hexagonal à 19 cases.',
      },
      {
        valeur: 'reseau_etendu_21',
        label: 'Grand Réseau Étendu 21 Zones (1 Cœur + 6 Clairières + 6 Sous-Bois + 8 Lisières)',
        description:
          'Macro-dimension à 21 zones conçue pour 5 à 6 joueurs ou pour jouer avec 3 Défenseurs par joueur : valorise la planification à plusieurs coups d’avance.',
        impactPhysique:
          'Dépliez le grand plateau forestier à 21 zones avec anneau médian de sous-bois.',
      },
    ],
  },
  {
    id: 'opt_mouvement_contrarie_v04',
    cleVariante: 'regleMouvementContrarie',
    nom: 'Risque de « Mouvement Contrarié » & Annulation en Cascade',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.4',
    description:
      'Détermine dans quels cas le 1er déplacement programmé d’un Défenseur peut être bloqué en cours de résolution, ce qui annule automatiquement son 2e déplacement programmé (plan brisé).',
    choix: [
      {
        valeur: 'capacite_max_tuile',
        label: 'Option 1 : Saturation de Clairière (Plafond Global : Max 2 Défenseurs par case)',
        estReference: true,
        description:
          'Une clairière accueille au maximum 2 Défenseurs (le juste nombre pour une Coalition). Si un 3e Défenseur tente d’y entrer à l’Étape 1, son mouvement est contrarié : il reste sur sa case de départ et son Déplacement II est annulé !',
        impactPhysique:
          'Si la case visée compte déjà 2 pions Défenseurs, laissez votre pion sur sa case d’origine et ignorez son 2e déplacement programmé.',
      },
      {
        valeur: 'goulots_sentiers_seuls',
        label: 'Option 2 : Goulots de Sentier Uniquement (Clairières libres, Cols étroits limités à 1)',
        description:
          'Les clairières n’ont aucune limite de saturation entre alliés. En revanche, les cols et sentiers étroits ne laissent passer qu’un seul Défenseur à la fois. Tenter d’entrer dans un col déjà occupé bloque le pion sur place et annule en cascade son 2e mouvement.',
        impactPhysique:
          'Clairières sans plafond. Sur un Col étroit, seul 1 pion Défenseur peut stationner ou transiter : tout 2e pion rebondit sur sa case d’origine.',
      },
      {
        valeur: 'interception_machine',
        label: 'Option 4 : Interception par Machine Active (Assaut solitaire repoussé, coalition requise)',
        description:
          'Clairières libres entre alliés. Mais si une Machine active occupe une clairière, un Défenseur isolé qui tente d’y entrer seul est intercepté et repoussé (son 2e mouvement est annulé). Pour pénétrer sur la Machine, au moins 2 peuples distincts doivent y converger à la même étape (assaut coordonné) !',
        impactPhysique:
          'Une Machine active repousse tout défenseur solitaire. Si deux peuples distincts entrent ensemble à la même étape, l’assaut perce et verrouille la Machine.',
      },
      {
        valeur: 'goulots_et_interception',
        label: 'Options 2 & 4 Combinées (Goulots étroits à 1 ET Interception par Machine active)',
        description:
          'Combine la topologie des passages étroits (cols limités à 1 pion) et le danger des Machines actives (repoussent les assauts solitaires non coordonnés).',
        impactPhysique:
          'Cols étroits limités à 1 pion ET entrée sur case de Machine active réservée aux assauts coordonnés à 2 peuples.',
      },
      {
        valeur: 'aucun',
        label: 'Option 3 : Déplacement Libre sans Contrainte (Capacité illimitée, pas d’interception)',
        description:
          'Témoin sans contrainte de capacité ni interception : les Défenseurs ne se bloquent jamais et tout déplacement adjacent programmé réussit toujours.',
        impactPhysique:
          'Aucune limite de pions Défenseurs par case et aucune interception par les Machines.',
      },
    ],
  },
  {
    id: 'opt_barrage_machine_v04',
    cleVariante: 'comportementBarrageMachine',
    nom: 'Barrage d’Entrée des Machines (Case avec ≥ 1 Défenseur)',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.4',
    description:
      'En V0.4, une Machine ne peut jamais entrer sur une case occupée par au moins 1 Défenseur. Cette option règle ce que fait la Machine lorsque sa case cible théorique est gardée.',
    choix: [
      {
        valeur: 'annulation_stricte',
        label: 'Annulation stricte du déplacement (La Machine reste sur place)',
        estReference: true,
        description:
          'Si la case cible désignée par la Tactique contient au moins 1 Défenseur, le déplacement programmé de la Machine est annulé : elle reste sur sa case de départ (ou au Chantier si elle devait entrer).',
        impactPhysique:
          'Vérifiez la case visée par la Machine : s’il y a au moins 1 pion Défenseur dessus, ne bougez pas la figurine Machine !',
      },
      {
        valeur: 'report_cible_libre',
        label: 'Report sur la meilleure case voisine libre de Défenseur',
        description:
          'La Machine contourne les cases occupées par des Défenseurs et choisit la meilleure case voisine non gardée selon sa Tactique (si toutes sont gardées, elle ne bouge pas).',
        impactPhysique:
          'Ignorez les cases voisines contenant un Défenseur et déplacez la Machine vers la meilleure case libre restante.',
      },
    ],
  },
  {
    id: 'opt_coalition_v04',
    cleVariante: 'effetCoalitionSurMachine',
    nom: 'Coalition Multi-Peuples contre la Coupe (≥ 2 Peuples différents)',
    categorie: 'Actions des Défenseurs',
    introduiteEnVersion: '0.4',
    description:
      'Deux Défenseurs appartenant à des Peuples (joueurs) différents présents sur la même case qu’une Machine l’empêchent de couper une forêt en fin de tour. Cette option règle le sort de la Machine neutralisée.',
    choix: [
      {
        valeur: 'bloquer_coupe_sur_place',
        label: 'Neutralisation de la coupe sur place (La Machine reste sur la case)',
        estReference: true,
        description:
          'La coalition d’au moins 2 Peuples différents bloque la coupe d’arbre (et provoque un apprentissage négatif sur les pistes), mais la Machine demeure sur cette case pour le tour suivant.',
        impactPhysique:
          'Si au moins 2 pions Défenseurs de couleurs différentes entourent la Machine, ne retirez aucun arbre et laissez la Machine sur la case.',
      },
      {
        valeur: 'renvoyer_au_chantier',
        label: 'Démantèlement vers le Chantier (Bloque la coupe ET renvoie en Réserve)',
        description:
          'La coalition d’au moins 2 Peuples différents bloque la coupe ET démonte la Machine, qui est renvoyée au Chantier hors plateau.',
        impactPhysique:
          'Si au moins 2 pions Défenseurs de couleurs différentes occupent la case de la Machine, retirez la figurine Machine et posez-la au Chantier.',
      },
      {
        valeur: 'chantier_a_3_peuples',
        label: 'Graduée (2 Peuples bloquent la coupe sur place · 3 Peuples renvoient au Chantier)',
        description:
          '2 Peuples différents suffisent pour empêcher la coupe sur place ; réunir 3 Peuples différents sur la même case démonte la Machine vers le Chantier.',
        impactPhysique:
          '2 couleurs différentes = pas d’arbre coupé ; 3 couleurs différentes = Machine renvoyée au Chantier.',
      },
    ],
  },
  {
    id: 'opt_palette_tactiques_v04',
    cleVariante: 'paletteTactiques',
    nom: 'Palette des Tactiques du Méchant (Piste 2 à 12)',
    categorie: 'Automatismes du Méchant',
    introduiteEnVersion: '0.4',
    description:
      'Compare 3 configurations de la Piste Tactique adaptées au jeu de pur placement où 1 Défenseur interdit l’entrée d’une case.',
    choix: [
      {
        valeur: '4_tactiques_acharnement',
        label: '4 Tactiques avec « Acharnement / Coupe Rase » (Remplace Représailles)',
        estReference: true,
        description:
          'Nouvelle 4e tactique « Acharnement » : cible la case boisée ayant le MOINS d’arbres restants (> 0) pour achever de raser une clairière entamée. Forme un quatuor 100 % cohérent avec Cupidité (+ d’arbres), Percée (vers le Cœur) et Opportunisme (zone la plus dégarnie).',
        impactPhysique:
          'Remplacez les cartes Représailles par « Acharnement » (cible la case ayant 1 ou 2 arbres restants pour la raser).',
      },
      {
        valeur: '3_tactiques_sans_represailles',
        label: '3 Tactiques Épurées (Cupidité, Percée, Opportunisme — sans Représailles)',
        description:
          'La piste 2–12 n’utilise que les 3 tactiques fondamentales : Cupidité (forêt dense), Percée (vers le Cœur) et Opportunisme (loin des Défenseurs). Lecture immédiate.',
        impactPhysique:
          'Utilisez uniquement les 11 cartes réparties entre Cupidité, Percée et Opportunisme sur la piste 2–12.',
      },
      {
        valeur: '4_tactiques_represailles_perce_1',
        label: '4 Tactiques avec « Représailles Brise-Barrage » (Force 1 Défenseur isolé)',
        description:
          'Conserve Représailles : c’est la seule tactique autorisant une Machine à entrer sur une case tenue par 1 seul Défenseur isolé (il faut alors 2 Défenseurs pour lui barrer l’entrée).',
        impactPhysique:
          'En Représailles uniquement, la Machine peut entrer sur une case où se trouve 1 seul Défenseur.',
      },
    ],
  },
  {
    id: 'opt_mode_programmation_v04',
    cleVariante: 'modeProgrammation',
    nom: 'Séquencement Public des Déplacements',
    categorie: 'Séquencement de la Programmation',
    introduiteEnVersion: '0.4',
    description:
      'Définit comment les joueurs annoncent publiquement à tour de rôle les déplacements de leurs Défenseurs après avoir regardé leurs 2D6 sous le gobelet.',
    choix: [
      {
        valeur: 'alternee_1_par_1',
        label: 'Alternée en 2 tours de table (Déplacement I puis Déplacement II)',
        estReference: true,
        description:
          '1er tour de table public pour programmer le Déplacement I (barrage d’entrée), puis 2e tour de table public pour le Déplacement II (coalitions à 2 Peuples).',
        impactPhysique:
          'Chacun son tour, indiquez publiquement le Déplacement I de vos Défenseurs ; puis faites un 2e tour de table pour le Déplacement II.',
      },
      {
        valeur: 'sequentielle_2_ordres',
        label: 'Séquentielle (Déplacement I + II d’affilée par joueur)',
        description:
          'Chaque joueur programme publiquement à son tour la trajectoire complète (Déplacement I puis II) de ses Défenseurs avant de passer au joueur suivant.',
        impactPhysique:
          'À votre tour, annoncez publiquement les 2 déplacements successifs de vos pions Défenseurs.',
      },
      {
        valeur: '2e_apres_ciblage',
        label: 'Réactive (Déplacement I avant Machines → Déplacement II programmé à vue après ciblage)',
        description:
          'On programme et exécute le Déplacement I (pour barrer l’entrée), les Machines se déplacent, puis les joueurs programment le Déplacement II à vue pour former les coalitions à 2 Peuples.',
        impactPhysique:
          'Programmez et jouez le Déplacement I, déplacez les Machines, puis programmez le Déplacement II en voyant où sont les Machines.',
      },
      {
        valeur: 'un_seul_ordre',
        label: 'Simplifiée (1 seul déplacement par Défenseur et par tour)',
        description:
          'Chaque Défenseur n’effectue qu’un seul déplacement par tour : il faut choisir entre barrer une case libre ou rejoindre un allié sur une Machine.',
        impactPhysique:
          'Un seul tour de table de déplacement par tour.',
      },
    ],
  },
  {
    id: 'opt_rythme_apprentissage_v04',
    cleVariante: 'rythmeApprentissage',
    nom: 'Apprentissage du Méchant sur la Double Piste (7 & Ordre 1–2–3–0–4–5)',
    categorie: 'Automatismes du Méchant',
    introduiteEnVersion: '0.4',
    description:
      'Règle la façon dont les cartes Tactiques (vers 7) et Machines (vers la gauche de la piste statistique 1–2–3–0–4–5) permutent selon le succès ou l’échec de la coupe.',
    choix: [
      {
        valeur: 'chaque_machine',
        label: 'Continu (Permutation après chaque Machine résolue)',
        estReference: true,
        description:
          'Chaque coupe réussie rapproche la Tactique de 7 et la Machine du 1 (à gauche sur 1–2–3–0–4–5) ; chaque coupe bloquée par coalition les éloigne.',
        impactPhysique:
          'Permutez immédiatement la carte Tactique et la tuile Machine d’un cran après le verdict de chaque Machine.',
      },
      {
        valeur: 'fin_de_tour',
        label: 'Groupé en fin de tour (Après toutes les coupes)',
        description:
          'On résout d’abord toutes les coupes du tour, puis on applique les permutations sur les deux pistes.',
        impactPhysique:
          'Appliquez les échanges sur les pistes Tactique et Machine une fois toutes les Machines résolues.',
      },
      {
        valeur: 'aucun',
        label: 'Désactivé (Pistes statiques — témoin de test)',
        description:
          'Les pistes restent fixes toute la partie (permet d’isoler la valeur pure de l’apprentissage).',
        impactPhysique:
          'Ne déplacez aucune tuile sur les pistes.',
      },
    ],
  },
  {
    id: 'opt_portee_tactiques_v04',
    cleVariante: 'porteeTactiques',
    nom: 'Portée de Déplacement des Machines',
    categorie: 'Automatismes du Méchant',
    introduiteEnVersion: '0.4',
    description:
      'Définit si une Machine choisit sa cible parmi son voisinage immédiat ou sur tout le plateau.',
    choix: [
      {
        valeur: 'voisinage',
        label: 'Locale (Case actuelle + cases adjacentes)',
        estReference: true,
        description:
          'La Machine évalue sa Tactique uniquement sur sa case et les cases directement reliées.',
        impactPhysique:
          'Comparez uniquement la case de la Machine et ses voisines immédiates.',
      },
      {
        valeur: 'plateau_entier',
        label: 'Globale (Saut sur n’importe quelle case du plateau)',
        description:
          'La Machine peut bondir sur n’importe quelle case du plateau répondant à sa Tactique.',
        impactPhysique:
          'Inspectez tout le plateau pour déplacer la Machine.',
      },
    ],
  },
  {
    id: 'opt_jeton_eclaireur_v04',
    cleVariante: 'jetonEclaireurActif',
    nom: 'Jeton Éclaireur (Indice silencieux partagé)',
    categorie: 'Modules Avancés (Labo)',
    introduiteEnVersion: '0.4',
    description:
      'Permet de tester si un jeton d’indice silencieux posé une fois par tour enrichit ou non la déduction dans un jeu 100 % placement.',
    choix: [
      {
        valeur: 'false',
        label: 'Désactivé (Déduction 100 % par les déplacements publics)',
        estReference: true,
        description:
          'Aucun jeton d’indice : seules les trajectoires choisies publiquement par chaque joueur servent de signal aux alliés.',
        impactPhysique:
          'Laissez le Jeton Éclaireur dans la boîte.',
      },
      {
        valeur: 'true',
        label: 'Activé (1 Jeton Éclaireur posable par tour)',
        description:
          'Un joueur par tour peut poser le Jeton Éclaireur sur une case menacée par son gobelet.',
        impactPhysique:
          'Posez le Jeton Éclaireur doré sur une case menacée.',
      },
    ],
  },
];

export const COMPOSANTS_BOITE_V04: BoxComponentSpec[] = [
  {
    id: 'comp_plateau_v04',
    categorie: 'Plateaux Fixes V0.4',
    nom: '1 Grand Plateau Double Face (Recto 3–4J / Verso 5–6J) + Variantes Topologiques (Sentiers & Hexagones 19)',
    quantiteFormule: '1 plateau recto-verso (9 ou 13 zones)',
    descriptionMat:
      'Plateau central rigide avec liaisons et diagonales d’entraide clairement tracées pour visualiser immédiatement les barrages à 1 Défenseur et les coalitions à 2 Peuples.',
    usageRegle:
      '1 Défenseur sur une case interdit l’entrée des Machines ; 2 Défenseurs de Peuples différents sur la case d’une Machine bloquent sa coupe.',
    nouveauteVersion: true,
  },
  {
    id: 'comp_pions_defenseurs_v04',
    categorie: 'Peuples Défenseurs (Pur Placement)',
    nom: 'Pions Défenseurs en bois aux couleurs des 6 Peuples + Marqueurs de Programmation (I & II)',
    quantiteFormule: 'dynamique_defenseurs',
    descriptionMat:
      'Pions Défenseurs de couleurs et silhouettes distinctes par Peuple (plus besoin de cartes Action Protéger/Saboter/Replanter ni de coucher les pions).',
    usageRegle:
      'Se déplacent d’une case adjacente par étape. Leur seule présence physique crée le barrage (≥ 1 pion) ou la coalition anti-coupe (≥ 2 couleurs différentes).',
    nouveauteVersion: true,
  },
  {
    id: 'comp_piste_tactique_v04',
    categorie: 'Automatismes & Apprentissage Statistique',
    nom: 'Plateau Double Piste du Méchant (Tactique 2–12 & Piste Machine Statistique 1–2–3–0–4–5)',
    quantiteFormule: '1 plateau + 11 tuiles Tactiques + 6 tuiles Machine',
    descriptionMat:
      'Piste Tactique (2 à 12, pic au 7) incluant la nouvelle tactique « Acharnement » et Piste Machine ordonnée du plus au moins probable : 1 (10/36), 2 (8/36), 3 (6/36), 0 (6/36), 4 (4/36), 5 (2/36).',
    usageRegle:
      'Quand une Machine coupe, ses tuiles glissent vers le 7 et vers la gauche (case 1). Quand une coalition de 2 Peuples bloque sa coupe, elles reculent !',
    nouveauteVersion: true,
  },
  COMPOSANTS_BOITE_V01[1], // Pions Forêt en bois
  COMPOSANTS_BOITE_V01[3], // 6 Figurines Machines M0 à M5
  {
    id: 'comp_gobelets_v04',
    categorie: 'Dés Secrets & Déduction',
    nom: 'Gobelets Opaques & Paires de Dés 2D6 (Sans paquet de cartes Action)',
    quantiteFormule: 'dynamique_gobelets',
    descriptionMat:
      '1 gobelet opaque et 2 dés à 6 faces par joueur. Le matériel est épuré de tout paquet de cartes d’action complexe.',
    usageRegle:
      'Chaque joueur consulte ses 2D6 en secret sous son gobelet, puis programme publiquement les déplacements de ses pions à son tour.',
  },
];

export const ETAPES_MISE_EN_PLACE_V04: SetupStepSpec[] = [
  {
    numero: 1,
    titre: 'Déplier le Plateau Fixe V0.4 (Double Face 3–4J / 5–6J, Sentiers ou Hexagones 19)',
    materiel: 'Plateau Central V0.4',
    consigne:
      'Posez le plateau central sur sa face « 3–4 Joueurs » (9 zones) ou « 5–6 Joueurs » (13 zones), ou utilisez le plateau Sentiers (3 Cols) / Hexagones (19 cases) selon la variante.',
    astuceTable:
      'Repérez d’un coup d’œil les carrefours qui permettent à deux Peuples voisins de se rejoindre en un déplacement.',
  },
  {
    numero: 2,
    titre: 'Planter les Pions Forêt en Bois',
    materiel: 'Pions Forêt verts',
    consigne:
      'Placez les pions Forêt initiaux sur le Cœur Central et sur chaque zone périphérique.',
    astuceTable:
      'Les zones les plus boisées attirent « Cupidité », tandis que les zones entamées (1–2 arbres) attirent la nouvelle tactique « Acharnement » !',
  },
  {
    numero: 3,
    titre: 'Installer la Double Piste Statistique (2–12 et 1–2–3–0–4–5)',
    materiel: 'Plateau Double Piste + Tuiles Tactiques & Machines',
    consigne:
      'Placez les tuiles Tactiques sur les cases 2 à 12 et les 6 tuiles Machines sur la piste ordonnée 1 – 2 – 3 – 0 – 4 – 5 (du plus probable 10/36 à gauche au moins probable 2/36 à droite).',
    astuceTable:
      'Notez bien que l’écart 0 (les doubles, 6/36) se situe juste à droite de l’écart 3 (6/36).',
  },
  {
    numero: 4,
    titre: 'Positionner les Machines (Lisières & Chantier) et les Pions Défenseurs',
    materiel: 'Figurines M0 à M5, Pions Défenseurs et Gobelets 2D6',
    consigne:
      'Posez les Machines initiales en Lisière (les autres au Chantier), placez vos pions Défenseurs sur votre Clairière de départ et prenez votre gobelet 2D6 : aucun paquet de cartes Action n’est nécessaire !',
    astuceTable:
      'Rappel d’or V0.4 : 1 Défenseur sur une case interdit à toute Machine d’y entrer ; 2 Défenseurs de couleurs différentes sur la case d’une Machine bloquent sa coupe.',
  },
];

export const VERSIONS_JEU_INITIALES: GameVersionSpec[] = [
  {
    id: '0.4',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.4 — Pur Placement, Barrage de Position (≥1 Déf.) & Coalition Multi-Peuples (≥2 Peuples)',
    statut: 'active',
    dateCreation: '2026-10-20',
    pitch:
      'Refonte épurée centrée à 100 % sur le placement coopératif et la déduction : les Défenseurs peuvent uniquement se déplacer (1 case adjacente). Une Machine ne peut pas entrer sur une case occupée par au moins 1 Défenseur (ce qui annule ou détourne son déplacement), et 2 Défenseurs de Peuples différents sur la même case qu’une Machine l’empêchent de couper une forêt.',
    invariantsConception: [
      'Action unique des Défenseurs : Se déplacer d’une case adjacente (ou rester sur place) — suppression des cartes Protéger, Saboter et Replanter du socle.',
      'Barrage de position : toute case contenant au moins 1 Défenseur est interdite d’entrée aux Machines.',
      'Coalition multi-peuples : au moins 2 Défenseurs de Peuples (joueurs) différents sur la case d’une Machine bloquent sa coupe en fin de tour.',
      'Piste Machine ordonnée statistiquement de gauche à droite : 1 (10/36) – 2 (8/36) – 3 (6/36) – 0 (6/36) – 4 (4/36) – 5 (2/36).',
      'Séquencement entrelacé : Déplacement I (barrage d’entrée) → Ciblage & Déplacement des Machines → Déplacement II (convergence en coalition) → Coupe & Apprentissage.',
    ],
    evolutionsDepuisPrecedente: [
      'Archivage des versions V0.1, V0.2 et V0.3 pour dégager l’Atelier et concentrer les tests sur la V0.4.',
      'Remplacement des actions Protéger/Saboter/Replanter par deux règles spatiales émergentes : Barrage d’entrée à 1 Défenseur et Coalition anti-coupe à 2 Peuples différents.',
      'Création de la nouvelle 4e Tactique « Acharnement / Coupe Rase » (cible la case boisée ayant le moins d’arbres restants) et option à 3 Tactiques sans Représailles.',
      'Programme de test paramétrique intensif variabilisant le comportement de barrage, l’effet de coalition, la palette de tactiques, les 3 plateaux fixes, le séquencement et les effectifs (3–6J, 1–3 pions/J, 2–6 Machines).',
    ],
    ideesLaboIds: [
      'idea-v03-double-plateau',
      'idea-v03-clairieres-sentiers',
      'idea-sabotage-alliance',
      'idea-bots-pointe-ismcts',
    ],
    optionsRegles: OPTIONS_REGLES_V04_PLACEMENT,
    parametresVariables: PARAMETRES_VARIABLES_COMMUNS,
    composantsBoite: COMPOSANTS_BOITE_V04,
    etapesMiseEnPlace: ETAPES_MISE_EN_PLACE_V04,
  },
  {
    id: '0.3',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.3 (Archivée) — Architectures de Plateau (Double Face 3–4J/5–6J, Hexagones 19 & Sentiers)',
    statut: 'archivee',
    dateCreation: '2026-10-20',
    pitch:
      '[Version archivée] Troisième version dédiée à la refonte géométrique et ergonomique du plateau : comparaison de trois architectures fixes sur l’intérêt stratégique, la lisibilité sur table et l’équilibrage de 3 à 6 joueurs.',
    invariantsConception: [
      'Dérivée directement du socle mécanique V0.1 (Peuples symétriques, Double Piste 2–12 / 0–5, Gobelets 2D6 secrets, 2 actions programmées).',
      'Remplace la couronne modulaire 1 tuile/joueur par une topologie de plateau explicite évaluée sur 3, 4, 5 et 6 joueurs.',
      'Mesure systématique des 3 priorités : Intérêt Stratégique (9 bots dont IS-MCTS), Lisibilité & Ergonomie, et Équilibre selon le nombre de joueurs (3 à 6J).',
    ],
    evolutionsDepuisPrecedente: [
      'Architecture 1 : Plateau Double Face Fixe — Recto calibré pour 3–4 joueurs (9 zones) et Verso calibré pour 5–6 joueurs (13 zones avec diagonales d’entraide).',
      'Architecture 2 : Grille Hexagonale Fixe en Couronnes (19 hexagones : 1 Cœur central, 6 hexagones Intérieurs à 6 connexions, 12 hexagones de Lisière).',
      'Architecture 3 : Réseau de Clairières & Sentiers à Embranchements (13 clairières reliées par des sentiers forestiers formant 3 Cols stratégiques vers le Cœur).',
      'Intégration de 3 bots de pointe (Expectimax Bayésien, Beam Rollout, IS-MCTS) et de l’analyse comparative par Gemini.',
    ],
    ideesLaboIds: [
      'idea-v03-double-plateau',
      'idea-v03-hex-19',
      'idea-v03-clairieres-sentiers',
      'idea-bots-pointe-ismcts',
    ],
    optionsRegles: [...OPTIONS_REGLES_V03_PLATEAU, ...OPTIONS_REGLES_COMMUNES],
    parametresVariables: PARAMETRES_VARIABLES_COMMUNS,
    composantsBoite: COMPOSANTS_BOITE_V03,
    etapesMiseEnPlace: ETAPES_MISE_EN_PLACE_V03,
  },
  {
    id: '0.2',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.2 (Archivée) — Éclaireur & Spécialisation des Peuples (Chantier Labo)',
    statut: 'archivee',
    dateCreation: '2026-10-20',
    pitch:
      '[Version archivée] Deuxième version du Jeu intégrant les premières idées retenues du Labo : ajout du Jeton Éclaireur et spécialisation asymétrique optionnelle des Peuples de Défenseurs.',
    invariantsConception: [
      'Conserve intégralement le socle matériel V0.1 (Double piste 2–12 / 0–5, gobelets 2D6, couronne modulable).',
      'Ajoute les modules issus du Labo sous forme d’interrupteurs activables sans casser la compatibilité du Moteur.',
    ],
    evolutionsDepuisPrecedente: [
      'Introduction du module « Jeton Éclaireur » (issu du post-it Labo sur la communication silencieuse).',
      'Introduction du module « Spécialisation Asymétrique des Peuples » (issu du post-it Labo sur les Peuples).',
      'Activation par défaut de la 4e carte « Replanter » face à 5 Machines initiales.',
    ],
    ideesLaboIds: ['idea-jeton-eclaireur-v02', 'idea-peuples-asym', 'idea-sabotage-alliance'],
    optionsRegles: [...OPTIONS_REGLES_COMMUNES, ...OPTIONS_REGLES_V02_MODULES],
    parametresVariables: PARAMETRES_VARIABLES_COMMUNS,
    composantsBoite: [
      ...COMPOSANTS_BOITE_V01,
      {
        id: 'comp_jeton_eclaireur_v02',
        categorie: 'Module V0.2 (Issu du Labo)',
        nom: '1 Jeton Éclaireur en bois doré + Plateaux Peuples Recto-Verso (Face Asymétrique)',
        quantiteFormule: '1 jeton + J plateaux verso',
        descriptionMat:
          'Jeton octogonal gravé d’un œil d’éclaireur et face verso des plateaux individuels Peuple avec pouvoir asymétrique.',
        usageRegle:
          'Permet de désigner silencieusement 1 tuile menacée par tour et d’activer la spécialité de chaque Peuple.',
        nouveauteVersion: true,
      },
    ],
    etapesMiseEnPlace: [
      ...ETAPES_MISE_EN_PLACE_V01,
      {
        numero: 6,
        titre: 'Mise en place V0.2 : Jeton Éclaireur & Face Peuple',
        materiel: 'Jeton Éclaireur + Plateaux Peuples',
        consigne:
          'Placez le Jeton Éclaireur près de la Tuile Cœur et choisissez la face (Standard ou Asymétrique V0.2) des plateaux Peuple selon la variante.',
        astuceTable:
          'Le Jeton Éclaireur est récupéré en fin de tour pour être réutilisé au tour suivant.',
      },
    ],
  },
  {
    id: '0.1',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.1 (Archivée) — Socle Double Piste & Programmation Séquentielle',
    statut: 'archivee',
    dateCreation: '2026-10-19',
    pitch:
      '[Version archivée] Socle fondateur du jeu coopératif (3 à 6 joueurs) : plateau modulable en couronne, Peuples Défenseurs symétriques, 6 Machines pilotées par une double piste publique.',
    invariantsConception: [
      'Plateau modulable en couronne (3 à 6 joueurs) centré sur la Tuile Cœur.',
      'Double piste publique du Méchant : Somme 2D6 (2–12) → Tactique, Écart 2D6 (0–5) → Machine.',
      'Apprentissage physique par permutation vers les pics de probabilité (Somme 7 et Écart 1).',
      'Observation secrète d’une paire de 2D6 par joueur (N joueurs = N Machines activées).',
      'Programmation tour à tour de 2 actions par Défenseur permettant la déduction par les actes.',
    ],
    evolutionsDepuisPrecedente: [
      'Refondation complète sur une architecture générique supportant les options de séquencement et d’actions.',
      'Remplacement des anciens prototypes isolés par un socle unique paramétrable.',
    ],
    ideesLaboIds: [
      'idea-seq-entrelace',
      'idea-prog-alternee',
      'idea-prog-reaction-ouverte',
      'idea-sabotage-alliance',
    ],
    optionsRegles: OPTIONS_REGLES_COMMUNES,
    parametresVariables: PARAMETRES_VARIABLES_COMMUNS,
    composantsBoite: COMPOSANTS_BOITE_V01,
    etapesMiseEnPlace: ETAPES_MISE_EN_PLACE_V01,
  },
];

/**
 * Permet de créer dynamiquement une nouvelle version du Jeu dans l'Atelier
 * à partir d'une sélection de post-it du Labo, sans redévelopper l'Atelier.
 */
export function creerNouvelleVersionDepuisLabo(
  codeVersion: string,
  titreVersion: string,
  pitch: string,
  ideesSelectionnees: LabIdea[],
  versionParente: GameVersionSpec
): { nouvelleVersion: GameVersionSpec; varianteSocle: VariantV01 } {
  const today = new Date().toISOString().slice(0, 10);
  const evolutions =
    ideesSelectionnees.length > 0
      ? ideesSelectionnees.map(
          (i) => `Intégration du post-it Labo « ${i.titre} » (${i.categorie}).`
        )
      : ['Nouvelle itération créée depuis l’Atelier de conception.'];

  const composantsSupp: BoxComponentSpec[] = ideesSelectionnees
    .filter((i) => i.categorie === 'Matériel Physique' || i.cible === 'Jeu')
    .slice(0, 2)
    .map((i, idx) => ({
      id: `comp_${codeVersion}_${idx}`,
      categorie: `Nouveauté V${codeVersion} (Labo)`,
      nom: `Matériel associé : ${i.titre}`,
      quantiteFormule: '1 module',
      descriptionMat: i.description,
      usageRegle: `Introduit en version ${codeVersion} depuis le Labo.`,
      nouveauteVersion: true,
    }));

  const nouvelleVersion: GameVersionSpec = {
    id: codeVersion,
    nomJeu: versionParente.nomJeu,
    titreVersion: `Version ${codeVersion} — ${titreVersion}`,
    statut: 'en_preparation',
    dateCreation: today,
    pitch,
    invariantsConception: [...versionParente.invariantsConception],
    evolutionsDepuisPrecedente: evolutions,
    ideesLaboIds: ideesSelectionnees.map((i) => i.id),
    optionsRegles: [...OPTIONS_REGLES_V04_PLACEMENT],
    parametresVariables: [...PARAMETRES_VARIABLES_COMMUNS],
    composantsBoite: [...COMPOSANTS_BOITE_V04, ...composantsSupp],
    etapesMiseEnPlace: [...ETAPES_MISE_EN_PLACE_V04],
  };

  const varianteSocle: VariantV01 = {
    id: `v_${codeVersion.replace(/\./g, '')}_socle`,
    nom: `V${codeVersion} Socle — ${titreVersion}`,
    version: codeVersion,
    description: pitch,
    origine: 'socle',
    statutViabilite: 'non_teste',
    geometriePlateau: 'double_plateau_34_56',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    placementUniquementV04: true,
    comportementBarrageMachine: 'annulation_stricte',
    effetCoalitionSurMachine: 'bloquer_coupe_sur_place',
    paletteTactiques: '4_tactiques_acharnement',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'alliance_requise',
    actionReplanterActive: false,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    peuplesAsymetriquesActifs: false,
    jetonEclaireurActif: false,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  };

  return { nouvelleVersion, varianteSocle };
}
