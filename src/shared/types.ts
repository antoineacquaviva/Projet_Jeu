export type AtelierComponentId =
  | 'jeu'
  | 'demo'
  | 'proto'
  | 'moteur_bots'
  | 'tests'
  | 'labo';

export type GameVersionId = string; // ex. '0.1', '0.2', '0.3', '0.4'

export type TactiqueType =
  | 'cupidite'
  | 'percee'
  | 'opportunisme'
  | 'represailles'
  | 'acharnement';

export type ActionDefenseurType = 'deplacer' | 'proteger' | 'saboter' | 'replanter' | 'attendre';

// Architectures géométriques et dimensions de plateau explorées
export type GeometriePlateau =
  | 'modulaire_secteurs'   // Socle V0.1/V0.2 : 1 Tuile Cœur + 2 tuiles par joueur assemblées en couronne
  | 'double_plateau_34_56' // V0.3/V0.4 : Plateau fixe Recto (3-4 joueurs, 9 zones) / Verso (5-6 joueurs, 13 zones)
  | 'hex_couronne_19'      // V0.3/V0.4 : Grille hexagonale fixe à 19 hexagones (1 Cœur + 6 Intérieurs + 12 Lisières)
  | 'clairieres_sentiers'  // V0.3/V0.4 : Réseau de 13 clairières et sentiers à embranchements (3 cols stratégiques)
  | 'compact_9_cases'      // V0.4 Micro-dimension : 9 clairières hyper-denses (fortes collisions et blocages rapides)
  | 'sentiers_goulots_15'  // V0.4 Goulots : 15 zones avec 4 sentiers étroits à sens critique
  | 'reseau_etendu_21';    // V0.4 Macro-dimension : 21 clairières étendues pour 5-6 joueurs avec sous-bois profonds

// Options de séquencement de la programmation
export type ModeProgrammation =
  | 'sequentielle_2_ordres' // Référence : chaque joueur programme ses 2 actions d'affilée à son tour
  | 'alternee_1_par_1'      // Tour de table pour Action I, puis 2e tour de table pour Action II
  | '2e_apres_ciblage'      // Action I programmée -> 1res actions + Ciblage Machines -> Action II programmée en réaction
  | 'un_seul_ordre';        // 1 seule action par Défenseur et par tour

// Options de séquencement de la résolution
export type ModeResolution =
  | 'entrelacee_coupe_fin'   // Référence V0.1-V0.4 : 1res actions -> Ciblage/Déplacement Machines -> 2es actions -> Coupe des Forêts & Apprentissage
  | 'lineaire_2c_fin'        // Référence V0.5 (Option 2C) : Déplacement I -> Déplacement II -> Chaque Machine se déplace et coupe immédiatement
  | 'deux_vagues_completes'  // Vague I (1res actions + moitié des Machines ciblent et coupent) -> Vague II (2es actions + reste des Machines)
  | 'machines_avant_actions'; // Les Machines ciblent et se déplacent en premier -> 1res et 2es actions Défenseurs -> Coupe des Forêts

// Options V0.5 — Cœur Unifié Pur Placement (3 Curseurs sans Barrage d'entrée ni Mouvement contrarié)
export type OptionResolutionV05 =
  | '2C_lineaire_1_temps'     // Curseur 1 - Choix B (Option 2C) : Déplacement I -> Déplacement II -> Machines bougent et coupent directement
  | '2B_entrelacee_seuil_pur' // Curseur 1 - Choix A (Option 2B) : Déplacement I -> Machines bougent -> Déplacement II -> Verdict des coupes
  | '2A_entrelacee_coalition'; // Curseur 1 - Choix A (Option 2A) : Déplacement I -> Machines bougent -> Déplacement II -> Verdict Coalition 2 Peuples

export type SeuilParadeV05 =
  | '1_defenseur'  // Curseur 2 - Choix A : 1 seul Défenseur présent sur la case suffit à bloquer la coupe
  | '2_peuples'    // Curseur 2 - Choix B : 2 Défenseurs de Peuples différents (Coalition) requis pour bloquer la coupe
  | 'gradue_1_bloque_2_chantier' // Curseur 2 - Choix C (Gradué) : 1 Défenseur bloque sur place, 2 Peuples différents démontent vers le Chantier
  | '2_defenseurs'; // Alias de compatibilité : 2 Défenseurs sur la case

export type EffetParadeV05 =
  | 'bloquer_sur_place'          // Curseur 3 - Choix A : La Machine contrée reste sur place (neutralisée pour ce tour)
  | 'renvoyer_chantier'          // Curseur 3 - Choix B : La Machine contrée est renvoyée au Chantier (Réserve)
  | 'gradue_1_bloque_2_chantier'; // Effet associé au Curseur 2 Choix C (Gradué) : 1 Défenseur bloque sur place, 2 Peuples différents renvoient au Chantier

// Options sur les actions (V0.1–V0.3)
export type EffetProteger =
  | 'coupe_seule'             // Référence : empêche la coupe de Forêt sur la case ce tour
  | 'barrage_entree_et_coupe' // Empêche aussi une Machine d'entrer sur la case ET bloque la coupe
  | 'protection_collective';  // Exige au moins 2 Défenseurs sur la case pour bloquer la coupe

export type EffetSaboter =
  | 'individuel_chantier'     // Référence : 1 Défenseur renvoie 1 Machine présente dans la Réserve/Chantier
  | 'alliance_requise'        // Exige au moins 2 Défenseurs présents sur la case pour renvoyer la Machine au Chantier
  | 'immobiliser_sur_place';  // La Machine reste sur la case mais est couchée (ne coupe pas ce tour)

// Options V0.4 — Pur Placement & Coalition
export type ComportementBarrageV04 =
  | 'aucun_barrage_v05'   // V0.5 : Suppression du Barrage d'entrée (les Machines entrent toujours sur leur case cible)
  | 'annulation_stricte'  // Référence V0.4 : si la case ciblée contient >= 1 Défenseur, le déplacement de la Machine est annulé (elle reste sur place)
  | 'report_cible_libre'; // Variante V0.4 : la Machine se reporte sur la meilleure case voisine libre de tout Défenseur

export type EffetCoalitionV04 =
  | 'blocage_coupe_seul'      // >= 2 Défenseurs de Peuples différents empêchent la coupe (Machine reste sur place)
  | 'renvoi_chantier'         // >= 2 Défenseurs de Peuples différents empêchent la coupe ET renvoient la Machine au Chantier
  | 'bloquer_coupe_sur_place' // Alias sémantique identique à blocage_coupe_seul
  | 'renvoyer_au_chantier'    // Alias sémantique identique à renvoi_chantier
  | 'chantier_a_3_peuples';   // 2 Peuples bloquent sur place, 3 Peuples renvoient au Chantier

export type PaletteTactiquesV04 =
  | '4_tactiques_acharnement'          // Référence V0.4 : Cupidité, Acharnement (Coupe rase), Percée, Opportunisme
  | '3_tactiques_sans_represailles'    // Variante V0.4/V0.5 : 3 Tactiques épurées (sans Représailles)
  | '4_tactiques_represailles_contours' // Représailles privilégie lisières et contournements
  | '4_tactiques_represailles_perce_1'; // Représailles brise-barrage (peut entrer sur 1 seul Défenseur isolé)

export type ProfilTactiquesV04 = PaletteTactiquesV04;

// Règles de Mouvement Contrarié (V0.4)
export type RegleMouvementContrarie =
  | 'aucun'                  // Option 3 / V0.5 : Déplacement libre sans contrariété dans le cœur
  | 'capacite_max_tuile'     // Option 1 : Plafond physique global (max 2 défenseurs par clairière)
  | 'goulots_sentiers_seuls' // Option 2 : Clairières libres, seuls les cols et sentiers étroits ont une capacité de 1
  | 'goulot_sentier_strict'  // Alias pour Option 2
  | 'interception_machine'   // Option 4 : Interception par Machine active si assaut non coordonné (< 2 peuples)
  | 'barrage_machine_active' // Alias pour Option 4
  | 'goulots_et_interception'; // Combinaison : Goulots à 1 ET Interception par Machine active

export type RythmeApprentissage =
  | 'chaque_machine'          // La piste Tactique et la piste Machine apprennent dès le verdict de chaque Machine
  | 'fin_de_tour'             // Apprentissage groupé en toute fin de résolution du tour
  | 'aucun';                  // Témoin sans apprentissage

export type PorteeTactiques =
  | 'voisinage'               // La Machine choisit parmi sa case actuelle et ses cases adjacentes
  | 'plateau_entier'          // La Machine peut bondir sur n'importe quelle case du plateau
  | 'global_plateau';         // Alias pour plateau_entier

export type StatutViabilite = 'non_teste' | 'viable' | 'eliminee';

export interface VariantV01 {
  id: string;
  nom: string;
  version: GameVersionId; // '0.1', '0.2', '0.3', '0.4', '0.5'
  description: string;
  origine: 'socle' | 'exploration' | 'utilisateur' | 'hybride_gemini';
  statutViabilite: StatutViabilite;
  motifElimination?: string;
  scoreInteretDernierTest?: number;
  bandeSante?: 'vert' | 'orange' | 'rouge';

  // Architecture géométrique du plateau
  geometriePlateau?: GeometriePlateau;

  // Règles de séquencement
  modeProgrammation: ModeProgrammation;
  modeResolution: ModeResolution;

  // Règles d'actions (V0.1-V0.3)
  effetProteger: EffetProteger;
  effetSaboter: EffetSaboter;
  actionReplanterActive: boolean;
  deplacementDoubleActif: boolean;

  // Règles V0.4 — Pur Placement & Coalition
  placementUniquementV04?: boolean;
  comportementBarrageMachine?: ComportementBarrageV04;
  comportementBarrageV04?: ComportementBarrageV04;
  effetCoalitionSurMachine?: EffetCoalitionV04;
  effetCoalitionV04?: EffetCoalitionV04;
  paletteTactiques?: PaletteTactiquesV04;
  profilTactiquesV04?: ProfilTactiquesV04;

  // Règles V0.5 — Cœur Épuré (Sans Barrage d'entrée & Options 2A / 2B / 2C)
  optionResolutionV05?: OptionResolutionV05;
  seuilParadeV05?: SeuilParadeV05;
  effetParadeV05?: EffetParadeV05;

  // Mécanique de contrariété de mouvement & saturation
  regleMouvementContrarie?: RegleMouvementContrarie;
  capaciteMaxCase?: number; // Ex: 2 Défenseurs max par case (ou 1 sur goulot)

  // Règles du Méchant
  rythmeApprentissage: RythmeApprentissage;
  porteeTactiques: PorteeTactiques;

  // Options additionnelles de versions ultérieures (ex. V0.2+)
  peuplesAsymetriquesActifs?: boolean;
  jetonEclaireurActif?: boolean;

  // Paramètres numériques (3 à 6 joueurs)
  nbJoueurs: 3 | 4 | 5 | 6;
  defenseursParJoueur: number;       // n pions Défenseurs par joueur (1 à 3)
  foretsParCaseSecteur: number;      // Forêts initiales par case de secteur (2 à 6)
  foretsCoeur: number;               // Forêts initiales sur la Tuile Cœur (3 à 8)
  nbTours: number;                   // Durée de la partie en tours (3 à 6)
  machinesInitiales: number;         // Nombre de Machines sur le plateau au départ sur les 6 disponibles (2 à 6)
}

/**
 * Contrat générique d'une Version du Jeu dans l'Atelier de conception.
 * Toute nouvelle version (V0.1, V0.2, V0.3...) déclare ce manifeste et bénéficie
 * automatiquement de l'ensemble des composants de l'Atelier (Le Jeu, Démo, Proto, Moteur & Bots, Tests, Labo).
 */
export interface RuleChoiceSpec {
  valeur: string;
  label: string;
  estReference?: boolean;
  description: string;
  impactPhysique: string;
}

export interface RuleOptionSpec {
  id: string;
  cleVariante: keyof VariantV01;
  nom: string;
  categorie:
    | 'Géométrie & Topologie du Plateau'
    | 'Séquencement de la Programmation'
    | 'Séquencement de la Résolution'
    | 'Actions des Défenseurs'
    | 'Automatismes du Méchant'
    | 'Modules Avancés (Labo)';
  introduiteEnVersion: GameVersionId;
  description: string;
  choix: RuleChoiceSpec[];
}

export interface VariableParameterSpec {
  id: string;
  cleVariante:
    | 'nbJoueurs'
    | 'defenseursParJoueur'
    | 'foretsParCaseSecteur'
    | 'foretsCoeur'
    | 'nbTours'
    | 'machinesInitiales';
  nom: string;
  unite: string;
  min: number;
  max: number;
  pas: number;
  valeurReference: number;
  description: string;
  impactMateriel: string;
}

export interface BoxComponentSpec {
  id: string;
  categorie: string;
  nom: string;
  quantiteFormule: 'dynamique_joueurs' | 'dynamique_forets' | string;
  descriptionMat: string;
  usageRegle: string;
  nouveauteVersion?: boolean;
}

export interface SetupStepSpec {
  numero: number;
  titre: string;
  materiel: string;
  consigne: string;
  astuceTable: string;
}

export interface GameVersionSpec {
  id: GameVersionId; // ex. '0.1', '0.2', '0.3'
  nomJeu: string;    // "Défenseurs de la forêt"
  titreVersion: string;
  statut: 'active' | 'en_preparation' | 'archivee';
  dateCreation: string;
  pitch: string;
  invariantsConception: string[];
  evolutionsDepuisPrecedente: string[];
  ideesLaboIds: string[];
  optionsRegles: RuleOptionSpec[];
  parametresVariables: VariableParameterSpec[];
  composantsBoite: BoxComponentSpec[];
  etapesMiseEnPlace: SetupStepSpec[];
}

export interface CasePlateau {
  id: number;
  nom: string;
  nomPhysique: string; // ex. "Tuile Cœur Central", "Hexagone Couronne N1", "Clairière du Col Nord"
  secteurJoueur: number | null; // null pour le Cœur (0), 0..J-1 pour les secteurs joueurs
  anneau: 'coeur' | 'interieur' | 'lisiere';
  voisins: number[];
  foretsMax: number;
  x: number;
  y: number;
  formeRendu?: 'cercle' | 'hexagone' | 'clairiere' | 'plateau_fixe';
  rayonRendu?: number;
}

export interface PionDefenseur {
  id: number;
  joueur: number;
  numeroPion: number; // 1..n
  caseId: number;
  postureProtection: boolean;
}

export interface PionMachine {
  id: number; // 0 à 5 (les 6 Machines indifférenciées)
  nom: string;
  caseId: number | null; // null = en Réserve / Chantier
  cibleDeclaree: number | null; // Case ciblée au milieu du tour avant la coupe
  tactiqueDeclaree: TactiqueType | null;
  neutraliseeCeTour: boolean; // Sabotée ou immobilisée
}

export interface ActionProgrammee {
  pionId: number;
  etape: 1 | 2;
  type: ActionDefenseurType;
  caseCible: number | null; // pour 'deplacer'
  machineCible: number | null; // pour 'saboter'
  explicationBot?: string;
  contrariee?: boolean; // V0.4 : Indique si le mouvement a été contrarié (capacité saturée, interception)
  motifContrariete?: string; // Motif physique de l'annulation ou du blocage
}

export interface LancerSecret2D6 {
  joueurObservateur: number;
  d1: number;
  d2: number;
  somme: number; // 2..12 -> Piste Tactique
  ecart: number; // 0..5 -> Piste Machine
}

export interface MouvementPisteApprentissage {
  piste: 'tactique' | 'machine';
  deCase: number;
  versCase: number;
  element: string;
  verdict: 'succes_coupe' | 'echec_parade';
  explicationPhysique: string;
}

export interface PhysicalStepGuide {
  titreEtape: string;
  composantsPhysiques: string[];
  gesteSurTable: string;
  regleDeReference: string;
}

export type SousPhaseTour =
  | 'observation_2d6'
  | 'programmation_1'
  | 'programmation_2'
  | 'resolution_actions_1'
  | 'resolution_ciblage_machines'
  | 'resolution_actions_2'
  | 'resolution_coupe_et_apprentissage'
  | 'bilan_tour'
  | 'fin_de_partie';

export interface JournalEvenement {
  id: string;
  tour: number;
  sousPhase: SousPhaseTour;
  message: string;
  gestePhysique: string;
  type: 'info' | 'defenseur' | 'machine' | 'coupe' | 'apprentissage' | 'deduction';
}

export interface EtatJeuV01 {
  variante: VariantV01;
  graine: number;
  etatRng: number;
  tourActuel: number;
  sousPhase: SousPhaseTour;
  joueurActifProgrammation: number;

  // Configuration du plateau (Forêts, Défenseurs, Machines)
  cases: CasePlateau[];
  forets: number[]; // indexé par caseId
  foretsInitialesTotales: number;
  defenseurs: PionDefenseur[];
  machines: PionMachine[]; // 6 machines (id 0..5)

  // Double piste publique du Méchant
  pisteTactique: Record<number, TactiqueType>; // clés 2 à 12
  pisteMachine: Record<number, number>;        // clés 0 à 5 -> id de Machine (0..5)

  // Lancers 2D6 du tour (observés secrètement chacun par un joueur)
  lancersSecretsDuTour: LancerSecret2D6[];
  lancersReveles: boolean;

  // Programmations posées tour à tour par les joueurs (visibles comme gestes posés)
  programmations: Record<number, ActionProgrammee[]>; // joueur -> actions programmées

  // Historique et métriques de la partie
  mouvementsApprentissageTour: MouvementPisteApprentissage[];
  guidePhysiqueActuel: PhysicalStepGuide;
  journal: JournalEvenement[];

  // Compteurs statistiques pour les Tests 3.1 / 3.2
  stats: {
    arbresCoupes: number;
    coupesEviteesParProtection: number;
    protectionsEffectuees: number;
    machinesSabotees: number;
    foretsReplantees: number;
    deplacementsEffectues: number;
    mouvementsContraries?: number;
    apprentissagesPositifs: number;
    apprentissagesNegatifs: number;
  };
}

export type BotProfileId =
  | 'inerte'
  | 'hasard'
  | 'boucle'
  | 'reflexe'
  | 'glouton'
  | 'deductif'
  | 'expectimax_bayesien'
  | 'beam_rollout'
  | 'ismcts';

export interface BotProfileSpec {
  id: BotProfileId;
  nom: string;
  roleDansTests: string;
  description: string;
  algorithme?: string;
  utiliseTirageSecret: boolean;
  utiliseDeductionAllies: boolean;
  estPointe?: boolean;
}

export interface CritereViabilite {
  code: string;
  intitule: string;
  valide: boolean;
  valeurObservee: string;
  seuilAttendu: string;
  detail: string;
}

export interface RapportViabilite31 {
  varianteId: string;
  varianteNom: string;
  dateExecution: string;
  nbPartiesTestees: number;
  dureeMs: number;
  viable: boolean;
  motifElimination?: string;
  criteres: CritereViabilite[];
}

export interface ResultatBotEchelle {
  botId: BotProfileId;
  botNom: string;
  foretSauveeMoyennePct: number;
  ecartTypePct: number;
  pireDecilePct: number;
  arbresCoupesMoyen: number;
  paradesMoyennes: number;
  sabotagesMoyens: number;
  tempsMoyenMsParPartie?: number;
  tauxUsageActions: {
    deplacer: number;
    proteger: number;
    saboter: number;
    replanter: number;
  };
}

export interface BilanJoueurs36 {
  nbJoueurs: 3 | 4 | 5 | 6;
  survieMoyennePct: number;
  pireDecilePct: number;
  scoreStrategique: number;
  sabotagesMoyens: number;
  ecartMechantVsGlouton: number;
  survieTableMixtePct?: number;
  impactApprentissagePts?: number;
}

export interface TroisAxesPrioritaires {
  interetStrategique: number;      // /100
  lisibiliteErgonomie: number;     // /100
  equilibreJoueurs36: number;      // /100
  detailStrategie: string;
  detailErgonomie: string;
  detailEquilibre36: string;
}

export interface PoidsCriteresEvaluation {
  profondeurStrategique: number; // Défaut: 30%
  tensionChoix: number;          // Défaut: 25%
  dynamiqueCooperative: number;  // Défaut: 20%
  equilibreMultiJoueurs: number; // Défaut: 15%
  ergonomieLisibilite: number;   // Défaut: 10%
}

export interface ScoresCinqCriteres {
  profondeurStrategique: number; // /100
  tensionChoix: number;          // /100
  dynamiqueCooperative: number;  // /100
  equilibreMultiJoueurs: number; // /100
  ergonomieLisibilite: number;   // /100
  scoreGlobalPondere: number;    // /100
  estParetoOptimal?: boolean;
  detailsAlgorithmes: {
    mctsGainPct: number;
    expectimaxGainPct: number;
    beamGainPct: number;
    entropieShannonMoyenne: number;
    regretContrefactuelMoyen: number;
    tauxPartiesSerreesPct: number;
    shapleySynergieCoopPts: number;
    ratioCoalitionBarragePct: number;
    tauxMouvementsContrariesPct: number;
    ecartType36JPct: number;
    cvar10PireDecilePct: number;
    degreMoyenGraphe: number;
    chargeManipulationsParTour: number;
  };
}

export interface JournalPartieJSONL {
  partieId: string;
  campagneId: string;
  horodatage: string;
  varianteId: string;
  varianteNom: string;
  version: GameVersionId;
  geometriePlateau: GeometriePlateau;
  regleMouvementContrarie: RegleMouvementContrarie;
  nbJoueurs: 3 | 4 | 5 | 6;
  botId: BotProfileId;
  botNom: string;
  seed: number;
  issue: 'victoire' | 'defaite';
  foretSauveePct: number;
  foretRestante: number;
  foretInitiale: number;
  nbToursJoues: number;
  nbToursMax: number;
  evenements: {
    coupesSubies: number;
    barragesReussis: number;
    coalitionsFormees: number;
    mouvementsContraries: number;
    sabotagesOuRenvois: number;
  };
  metriquesDecisionnelles: {
    entropieShannonPct: number;
    regretMoyenPts: number;
    partieTendue: boolean;
  };
  resumeTours: {
    tour: number;
    tactiqueTiree: string;
    somme2D6: number;
    barragesTour: number;
    coalitionsTour: number;
    contrariesTour: number;
    coupesTour: number;
    foretFinTourPct: number;
  }[];
}

export interface EtatJobCampagneVM {
  jobId: string;
  campagneId: string;
  nomCampagne: string;
  versionCible: GameVersionId;
  sourceLancement: 'web_ui' | 'cli_vm_ssh';
  statut: 'inactif' | 'en_cours' | 'analyse_ia' | 'termine' | 'interrompu' | 'erreur';
  etapeNumero: 1 | 2 | 3 | 4 | 5;
  etapeLibelle: string;
  calibrePartiesParVariante: number;
  poidsCriteres: PoidsCriteresEvaluation;
  variantesTotales: number;
  variantesTesteesViabilite: number;
  variantesViablesRetenues: number;
  variantesEvalueesProfondeur: number;
  varianteCouranteId?: string;
  varianteCouranteNom?: string;
  partiesSimulees: number;
  partiesTotalesPrevues: number;
  partiesJournaliseesJSONL: number;
  debitPartiesParSeconde: number;
  dateDebut: string;
  dateFin?: string;
  dureeEcouleeSecondes: number;
  etaSecondes: number;
  cheminFichierJSONL: string;
  tailleFichierJSONLOctets: number;
  journalTempsReel: string[];
  meilleureVarianteProvisoire?: { id: string; nom: string; score: number };
}

export interface RapportInteret32 {
  varianteId: string;
  varianteNom: string;
  version?: GameVersionId;
  geometriePlateau?: GeometriePlateau;
  dateExecution: string;
  nbPartiesParBot: number;
  dureeMs: number;
  echelleBots: ResultatBotEchelle[];
  indicateurs: {
    progressionEchelleValide: boolean;
    ecartDeductifSurInerte: number;
    margeGardeFouBoucle: number;          // score(ismcts|deductif) - score(boucle)
    gainDeductionSequentielle: number;    // score(deductif) - score(glouton)
    gainLecturePistes: number;            // score(glouton) - score(reflexe)
    gainBotsPointeSurDeductif?: number;   // score(ismcts) - score(deductif)
    impactApprentissageMechant: number;   // écart avec/sans apprentissage
    equilibreActionsPct: number;          // entropie / équilibre entre déplacer, protéger, saboter
    // Métriques spécifiques V0.4 (Placement & Anticipation)
    gainPlanificationPct?: number;        // Écart entre prévision multi-coups et jeu réflexe (intérêt d'anticiper)
    tensionDecisionsPct?: number;         // Équilibre et dilemme entre les options de déplacement candidates (absence de coup trivial)
    tauxMouvementsContrariesPct?: number; // % des déplacements programmés annulés suite à un blocage ou saturation
  };
  equilibreParJoueurs?: Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  troisAxesPrioritaires?: TroisAxesPrioritaires;
  metriquesPlacementV04?: {
    gainPlanificationPct: number;
    tensionDecisionsPct: number;
    tauxMouvementsContrariesPct: number;
    tauxCoalitionsReussiesPct: number;
    tauxBarragesEfficacesPct: number;
  };
  cinqCriteresPonderes?: ScoresCinqCriteres;
  echantillonPartiesVariante?: JournalPartieJSONL[];
  nbTotalPartiesSimuleesVariante?: number;
  scoreInteretGlobal: number; // 0 à 100
  bandeSante: 'vert' | 'orange' | 'rouge';
  syntheseAnalytique: string[];
}

export interface CampagneSelection33 {
  id: string;
  nom: string;
  versionsCibles?: GameVersionId[];
  dateExecution: string;
  nbVariantesEntree: number;
  nbVariantesViables: number;
  nbVariantesEliminees: number;
  calibrePartiesParVariante?: number;
  totalPartiesSimulees?: number;
  dureeTotaleSecondes?: number;
  cheminFichierJSONL?: string;
  tailleFichierJSONLOctets?: number;
  poidsCriteres?: PoidsCriteresEvaluation;
  echantillonPartiesRemarquables?: JournalPartieJSONL[];
  rapportsViabilite: RapportViabilite31[];
  rapportsInteret: RapportInteret32[]; // triés par scoreInteretGlobal décroissant
  meilleureVarianteId: string | null;
}

export interface HybrideRecommandeGemini {
  titre: string;
  justification: string;
  inspirationVersions: string;
  pointsFortsAttendus: string[];
  varianteHybride: VariantV01;
}

export interface AnalyseGeminiCampagne {
  id: string;
  dateCreation: string;
  campagneId: string;
  campagneNom: string;
  versionsAnalysees: GameVersionId[];
  modeleUtilise: string;
  resumeExecutif: string;
  diagnosticStrategie: string;
  diagnosticLisibiliteErgonomie: string;
  diagnosticEquilibre36J: string;
  comparatifGeometries: {
    geometrie: GeometriePlateau;
    nom: string;
    verdict: string;
    noteStrategie: number;
    noteErgonomie: number;
    noteEquilibre36: number;
  }[];
  hybridesRecommandes: HybrideRecommandeGemini[];
  rapportMarkdown: string;
}

export interface ScheduledCampaignVM {
  id: string;
  nom: string;
  cibleExecution: 'vm_oracle_cloud' | 'serveur_local';
  cronExpression: string;
  actif: boolean;
  nbVariantesAGenerer?: number;
  nbPartiesViabilite: number;
  nbPartiesInteret: number;
  eliminerNonViablesAuto: boolean;
  autoCommitGithub: boolean;
  versionsCibles?: GameVersionId[];
  inclureBotsPointe?: boolean;
  testerEquilibre36J?: boolean;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'erreur';
  derniereExecution?: string;
  prochaineExecutionEstimee: string;
  dernierResultatId?: string;
  journalVM: string[];
}

export type LabIdeaCible = 'Jeu' | 'Atelier';
export type LabIdeaPriorite = 'Haute' | 'Moyenne' | 'Basse';
export type LabIdeaMaturite =
  | 'Idée brute'
  | 'En étude'
  | 'Prête à tester'
  | 'Intégrée V0.1'
  | 'Intégrée V0.2'
  | 'Intégrée V0.3'
  | 'Intégrée V0.4'
  | 'Intégrée V0.5'
  | 'Différée';

export interface LabIdea {
  id: string;
  titre: string;
  cible: LabIdeaCible;
  versionCible?: GameVersionId; // ex. '0.1', '0.2', '0.3'
  categorie:
    | 'Méchant & Pistes'
    | 'Défenseurs & Actions'
    | 'Séquencement & Tour'
    | 'Matériel Physique'
    | 'Tests & VM'
    | 'Différé (Rêve / Peuples)';
  description: string;
  auteur: 'Auteur' | 'Gemini';
  priorite: LabIdeaPriorite;
  maturite: LabIdeaMaturite;
  interet: number; // 1 à 10
  varianteLieeId?: string;
  dateCreation: string;
  dateMaj: string;
}
