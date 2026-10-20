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

export const PARAMETRES_VARIABLES_COMMUNS: VariableParameterSpec[] = [
  {
    id: 'param_nb_joueurs',
    cleVariante: 'nbJoueurs',
    nom: 'Nombre de Joueurs (Couronne modulable)',
    unite: 'joueurs',
    min: 3,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Détermine le nombre de secteurs assemblés autour de la Tuile Cœur (1 + 2×J tuiles) et le nombre de lancers 2D6 de Machines par tour.',
    impactMateriel:
      'Assemblez J secteurs de 2 tuiles autour du Cœur et distribuez J gobelets 2D6.',
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
      'Chaque joueur prend n pions en bois de sa couleur et les pose sur son secteur.',
  },
  {
    id: 'param_forets_secteur',
    cleVariante: 'foretsParCaseSecteur',
    nom: 'Forêts initiales par Tuile de Secteur',
    unite: 'arbres / tuile',
    min: 2,
    max: 6,
    pas: 1,
    valeurReference: 4,
    description:
      'Nombre de pions Forêt en bois posés au départ sur chaque tuile Intérieure et Lisière.',
    impactMateriel:
      'Posez ce nombre de pions Forêt verts sur chacune des 2×J tuiles périphériques.',
  },
  {
    id: 'param_forets_coeur',
    cleVariante: 'foretsCoeur',
    nom: 'Forêts initiales sur la Tuile Cœur Central',
    unite: 'arbres',
    min: 3,
    max: 8,
    pas: 1,
    valeurReference: 6,
    description:
      'Réserve d’arbres du sanctuaire central vers lequel convergent les Machines en tactique Percée.',
    impactMateriel:
      'Posez ces pions Forêt au centre sur la grande Tuile Cœur.',
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
      'Posez M0 à M(k-1) sur les tuiles Lisière et laissez les autres sur la zone Chantier.',
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

export const VERSIONS_JEU_INITIALES: GameVersionSpec[] = [
  {
    id: '0.1',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.1 — Socle Double Piste & Programmation Séquentielle',
    statut: 'active',
    dateCreation: '2026-10-19',
    pitch:
      'Socle fondateur du jeu coopératif (3 à 6 joueurs) : plateau modulable en couronne, Peuples Défenseurs symétriques, 6 Machines pilotées par une double piste publique (Tactique 2–12 par la somme, Machine 0–5 par l’écart) qui apprend à chaque coupe, tirage 2D6 secret sous gobelet et double programmation séquentielle.',
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
      'idea-prog-reactive',
      'idea-sabotage-alliance',
      'idea-barrage-entree',
      'idea-gobelet-physique',
    ],
    optionsRegles: OPTIONS_REGLES_COMMUNES,
    parametresVariables: PARAMETRES_VARIABLES_COMMUNS,
    composantsBoite: COMPOSANTS_BOITE_V01,
    etapesMiseEnPlace: ETAPES_MISE_EN_PLACE_V01,
  },
  {
    id: '0.2',
    nomJeu: 'Défenseurs de la forêt',
    titreVersion: 'Version 0.2 — Éclaireur & Spécialisation des Peuples (Chantier Labo)',
    statut: 'en_preparation',
    dateCreation: '2026-10-20',
    pitch:
      'Deuxième version du Jeu intégrant les premières idées retenues du Labo : ajout du Jeton Éclaireur (signalisation silencieuse d’une tuile menacée) et spécialisation asymétrique optionnelle des Peuples de Défenseurs face à une pression accrue des Machines.',
    invariantsConception: [
      'Conserve intégralement le socle matériel V0.1 (Double piste 2–12 / 0–5, gobelets 2D6, couronne modulable).',
      'Ajoute les modules issus du Labo sous forme d’interrupteurs activables sans casser la compatibilité du Moteur.',
    ],
    evolutionsDepuisPrecedente: [
      'Introduction du module « Jeton Éclaireur » (issu du post-it Labo sur la communication silencieuse).',
      'Introduction du module « Spécialisation Asymétrique des Peuples » (issu du post-it Labo sur les Peuples).',
      'Activation par défaut de la 4e carte « Replanter » face à 5 Machines initiales.',
    ],
    ideesLaboIds: ['idea-peuples-asym', 'idea-sabotage-alliance'],
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
    optionsRegles: [
      ...OPTIONS_REGLES_COMMUNES,
      ...OPTIONS_REGLES_V02_MODULES,
    ],
    parametresVariables: [...PARAMETRES_VARIABLES_COMMUNS],
    composantsBoite: [...COMPOSANTS_BOITE_V01, ...composantsSupp],
    etapesMiseEnPlace: [...ETAPES_MISE_EN_PLACE_V01],
  };

  const varianteSocle: VariantV01 = {
    id: `v_${codeVersion.replace(/\./g, '')}_socle`,
    nom: `V${codeVersion} Socle — ${titreVersion}`,
    version: codeVersion,
    description: pitch,
    origine: 'socle',
    statutViabilite: 'non_teste',
    modeProgrammation: 'alternee_1_par_1',
    modeResolution: 'entrelacee_coupe_fin',
    effetProteger: 'barrage_entree_et_coupe',
    effetSaboter: 'individuel_chantier',
    actionReplanterActive: true,
    deplacementDoubleActif: false,
    rythmeApprentissage: 'chaque_machine',
    porteeTactiques: 'voisinage',
    peuplesAsymetriquesActifs: true,
    jetonEclaireurActif: true,
    nbJoueurs: 4,
    defenseursParJoueur: 2,
    foretsParCaseSecteur: 4,
    foretsCoeur: 6,
    nbTours: 4,
    machinesInitiales: 4,
  };

  return { nouvelleVersion, varianteSocle };
}
