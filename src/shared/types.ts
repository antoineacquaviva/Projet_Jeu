export type AtelierComponentId =
  | 'jeu'
  | 'demo'
  | 'proto'
  | 'moteur_bots'
  | 'tests'
  | 'labo';

export type GameVersionId = string; // ex. '0.1', '0.2', '0.3'

export type TactiqueType = 'cupidite' | 'percee' | 'opportunisme' | 'represailles';

export type ActionDefenseurType = 'deplacer' | 'proteger' | 'saboter' | 'replanter' | 'attendre';

// Nouvelles architectures géométriques de plateau (introduites en V0.3, rétrocompatibles V0.1/V0.2)
export type GeometriePlateau =
  | 'modulaire_secteurs'   // Socle V0.1/V0.2 : 1 Tuile Cœur + 2 tuiles par joueur assemblées en couronne
  | 'double_plateau_34_56' // V0.3 : Plateau fixe Recto (3-4 joueurs, 9 zones) / Verso (5-6 joueurs, 13 zones)
  | 'hex_couronne_19'      // V0.3 : Grille hexagonale fixe à 19 hexagones (1 Cœur + 6 Intérieurs + 12 Lisières)
  | 'clairieres_sentiers'; // V0.3 : Réseau de 13 clairières et sentiers à embranchements (3 cols stratégiques)

// Options de séquencement de la programmation
export type ModeProgrammation =
  | 'sequentielle_2_ordres' // Référence : chaque joueur programme ses 2 actions d'affilée à son tour
  | 'alternee_1_par_1'      // Tour de table pour Action I, puis 2e tour de table pour Action II
  | '2e_apres_ciblage'      // Action I programmée -> 1res actions + Ciblage Machines -> Action II programmée en réaction
  | 'un_seul_ordre';        // 1 seule action par Défenseur et par tour

// Options de séquencement de la résolution
export type ModeResolution =
  | 'entrelacee_coupe_fin'   // Référence confirmée : 1res actions -> Ciblage/Déplacement Machines -> 2es actions -> Coupe des Forêts & Apprentissage
  | 'deux_vagues_completes'  // Vague I (1res actions + moitié des Machines ciblent et coupent) -> Vague II (2es actions + reste des Machines)
  | 'machines_avant_actions'; // Les Machines ciblent et se déplacent en premier -> 1res et 2es actions Défenseurs -> Coupe des Forêts

// Options sur les actions
export type EffetProteger =
  | 'coupe_seule'             // Référence : empêche la coupe de Forêt sur la case ce tour
  | 'barrage_entree_et_coupe' // Empêche aussi une Machine d'entrer sur la case ET bloque la coupe
  | 'protection_collective';  // Exige au moins 2 Défenseurs sur la case pour bloquer la coupe

export type EffetSaboter =
  | 'individuel_chantier'     // Référence : 1 Défenseur renvoie 1 Machine présente dans la Réserve/Chantier
  | 'alliance_requise'        // Exige au moins 2 Défenseurs présents sur la case pour renvoyer la Machine au Chantier
  | 'immobiliser_sur_place';  // La Machine reste sur la case mais est couchée (ne coupe pas ce tour)

export type RythmeApprentissage =
  | 'chaque_machine'          // La piste Tactique et la piste Machine apprennent dès le verdict de chaque Machine
  | 'fin_de_tour'             // Apprentissage groupé en toute fin de résolution du tour
  | 'aucun';                  // Témoin sans apprentissage

export type PorteeTactiques =
  | 'voisinage'               // La Machine choisit parmi sa case actuelle et ses cases adjacentes
  | 'plateau_entier';         // La Machine peut bondir sur n'importe quelle case du plateau répondant au critère

export type StatutViabilite = 'non_teste' | 'viable' | 'eliminee';

export interface VariantV01 {
  id: string;
  nom: string;
  version: GameVersionId; // '0.1', '0.2', '0.3', etc.
  description: string;
  origine: 'socle' | 'exploration' | 'utilisateur' | 'hybride_gemini';
  statutViabilite: StatutViabilite;
  motifElimination?: string;
  scoreInteretDernierTest?: number;
  bandeSante?: 'vert' | 'orange' | 'rouge';

  // Architecture géométrique du plateau (V0.3+, défaut 'modulaire_secteurs' pour V0.1/V0.2)
  geometriePlateau?: GeometriePlateau;

  // Règles de séquencement
  modeProgrammation: ModeProgrammation;
  modeResolution: ModeResolution;

  // Règles d'actions
  effetProteger: EffetProteger;
  effetSaboter: EffetSaboter;
  actionReplanterActive: boolean;
  deplacementDoubleActif: boolean;

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
}

export interface TroisAxesPrioritaires {
  interetStrategique: number;      // /100
  lisibiliteErgonomie: number;     // /100
  equilibreJoueurs36: number;      // /100
  detailStrategie: string;
  detailErgonomie: string;
  detailEquilibre36: string;
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
  };
  equilibreParJoueurs?: Record<3 | 4 | 5 | 6, BilanJoueurs36>;
  troisAxesPrioritaires?: TroisAxesPrioritaires;
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
  cronExpression: string; // ex. "0 2 * * *" (tous les jours à 02:00 sur la VM Oracle Cloud)
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
