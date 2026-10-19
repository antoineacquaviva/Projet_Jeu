export type Tactique = 'cupidite' | 'percee' | 'opportunisme' | 'represailles';

export type OrdreType = 'rien' | 'garder' | 'aller' | 'saboter';

export type Ordre = [OrdreType, number | null];

export interface MachineInfo {
  nom: string;
  court: string;
}

export interface Reglages {
  joueurs: number;
  etapes: number;
  lancersEnPlus: number;
  rythme: 'lancer' | 'vague';
  presage: boolean;
  tuileL: number;
  tuileP: number;
  individusParJoueur: number;
  arbres: number;
  coeurArbres?: number;
  tours: number;
  graine: number;
}

export interface ParametresCalcules {
  J: number;
  l: number;
  q: number;
  a: number;
  coeurArbres: number;
  I: number;
  ipj: number;
  E: number;
  k: number;
  L: number;
  surPlateau: number;
  rythme: 'lancer' | 'vague';
  presage: boolean;
  tours: number;
  graine: number;
  reglages: Reglages;
  lancersParTour: number;
  ordresParTour: number;
  c0: number;
  erreurs: string[];
}

export interface Plateau {
  N: number;
  voisins: number[][];
  dist: number[][];
  coeur: number[];
  tuile: number[];
  rang: number[];
  col: number[];
  lisieres: number[][];
  idx: (t: number, r: number, c: number) => number;
}

export interface CellGeo {
  c: number;
  path: string | null;
  cx: number;
  cy: number;
  r?: number;
  nx: number;
  ny: number;
  lx: number;
  ly: number;
  tan: [number, number];
  rad: [number, number];
  arc: number;
  w: number;
}

export interface Geometrie {
  cells: CellGeo[];
  seps: [number, number, number, number][];
  noms: [number, number][];
}

export interface EtatJeu {
  arbres: number[];
  machines: number[];
  individus: number[];
  tour: number;
  pensees: number[];
  pisteM: number[];
}

export interface LancerTirage {
  d: [number, number];
  t: number;
  c: number;
}

export interface EchangePiste {
  pensees: [number, number | null];
  machines: [number, number | null];
}

export interface EvenementLancer {
  d: [number, number];
  somme: number;
  ecart: number;
  tuile: number;
  tactique: Tactique;
  machine: number;
  de: number;
  entree?: number;
  cible: number;
  repli: boolean;
  issue: 'abattu' | 'gardee' | 'sabotee';
  qui?: number;
  lieu?: number;
  appris?: EchangePiste;
}

export interface OrdrePerdu {
  i: number;
  o: Ordre;
  pourquoi: string;
}

export interface Carte {
  i: number;
  o: Ordre;
}

export interface JournalEntry {
  k: 'tour' | 'ann' | 'ordre' | 'etape' | 'abattu' | 'pare' | 'appris' | 'perdu' | 'bilan' | 'fin';
  txt: string;
  why?: string;
  tag?: string;
}

export interface EtapeResultat {
  etape: number;
  perdus: OrdrePerdu[];
  evenements: EvenementLancer[];
  appris: EchangePiste[];
}

export interface HistoriqueTour {
  tour: number;
  des: [number, number][][];
  cartes: {
    joueur: number;
    siege: string;
    cartes: (Carte | null)[];
    raison: string;
  }[];
  etapes: EtapeResultat[];
  parades: number;
  foret: number;
  pensees: Tactique[];
  pisteMachines: string[];
}

export type SiegeType = 'humain' | 'prevoyant' | 'reflexe' | 'stratege' | 'hasard';

export interface PartieState {
  id: string;
  date: string;
  reglages: Reglages;
  sieges: SiegeType[];
  e: EtatJeu;
  depart: EtatJeu;
  tirages: LancerTirage[][][];
  phase: 'cartes' | 'vague' | 'inter' | 'entre' | 'fin';
  v: number;
  pas: number;
  cartes: (Carte | null)[][];
  raisons: Record<number, string>;
  par: Record<number, string>;
  fait: number[];
  courant: number | null;
  slot: number;
  brouillon: (Carte | null)[] | null;
  pose: {
    gardes: Record<number, number>;
    sab: Record<number, number>;
    quiG: Record<number, number[]>;
    quiS: Record<number, number[]>;
    perdus: OrdrePerdu[];
  } | null;
  attente: { tuile: number; machine: number; reussite: boolean }[];
  vague: EvenementLancer[];
  etapesTour: EtapeResultat[];
  dernier: EvenementLancer | null;
  appVague: EchangePiste[];
  historique: HistoriqueTour[];
  journal: JournalEntry[];
  parJoueur: number[];
  hors: number;
  S: number;
  perdus: number;
  enregistre: boolean;
  p: ParametresCalcules;
  pl: Plateau;
}

export interface SerieLigne {
  joueurs: number;
  bot: string;
  parties: number;
  taux: number;
  foret: number;
  agence: number;
  couplage: number;
  perdus: number;
}

export interface Enregistrement {
  id: string;
  type: 'partie' | 'serie';
  date: string;
  titre: string;
  donnees?: any;
}
