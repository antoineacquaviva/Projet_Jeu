import {
  ActionDefenseurType,
  ActionProgrammee,
  BotProfileId,
  BotProfileSpec,
  EtatJeuV01,
  LancerSecret2D6,
  VariantV01,
} from './types';
import {
  avancerSousPhaseResolution,
  calculerCibleMachine,
  calculerPourcentageForetSauvee,
  casesAccessiblesDefenseur,
  clonerEtatJeu,
  compterPeuplesDistinctsSurCase,
  creerEtatInitialV01,
  estVariantePlacementV04,
  NOMS_TACTIQUES,
  nextRng,
  PROBA_ECART_2D6,
  PROBA_SOMME_2D6,
  tirerDe6,
} from './moteur';

export const CATALOGUE_BOTS_V01: BotProfileSpec[] = [
  {
    id: 'inerte',
    nom: 'Bot Inerte (Plancher)',
    algorithme: 'Passif total',
    roleDansTests: 'Mesure le plancher de survie sans aucune action des joueurs.',
    description:
      'Les Défenseurs restent immobiles sur leur tuile de départ sans protéger ni saboter.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'hasard',
    nom: 'Bot Hasard (Bruité)',
    algorithme: 'Tirage uniforme pseudo-aléatoire',
    roleDansTests: 'Vérifie qu’agir au hasard fait mieux qu’être inerte mais moins bien qu’un jeu pensé.',
    description:
      'Choisit uniformément parmi les actions légales (Se déplacer, Protéger, Saboter, Replanter) sans lire les pistes.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'boucle',
    nom: 'Bot Boucle Fixe (Garde-fou)',
    algorithme: 'Automate cyclique aveugle',
    roleDansTests: 'Détecte les failles de règles où une routine aveugle suffit à gagner sans lire le jeu.',
    description:
      'Applique une routine mécanique invariable (Protéger ou Replanter sur place en boucle) sans jamais regarder ni les dés ni les Machines.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'reflexe',
    nom: 'Bot Réflexe (Tape-taupe)',
    algorithme: 'Heuristique locale sans lecture des pistes',
    roleDansTests: 'Mesure le score d’un joueur qui réagit aux Machines déjà posées sans lire les pistes 2D6.',
    description:
      'Se dirige vers les Machines déjà visibles sur le plateau pour protéger ou saboter, en ignorant les pistes et son gobelet 2D6.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'glouton',
    nom: 'Bot Glouton (Pistes + Dés personnels)',
    algorithme: 'Maximisation locale (A priori 36 tirages + 2D6 personnel)',
    roleDansTests: 'Évalue le gain procuré par la lecture des deux pistes publiques et de son propre gobelet 2D6.',
    description:
      'Lit son lancer secret 2D6 sur la Piste Tactique (2–12) et la Piste Machine (0–5), anticipe la case cible exacte de sa Machine et programme ses 2 actions pour la contrer.',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: false,
  },
  {
    id: 'deductif',
    nom: 'Bot Déductif & Coordonné (Référence Classique)',
    algorithme: 'Heuristique séquentielle de coordination',
    roleDansTests: 'Mesure le gain de la coordination implicite : évite les doublons et complète les alliances.',
    description:
      'Combine son tirage secret 2D6, l’espérance mathématique des pistes publiques et l’observation des actions déjà posées par les coéquipiers.',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: true,
  },
  {
    id: 'expectimax_bayesien',
    nom: 'Bot Expectimax Bayésien (Inférence des Dés Alliés)',
    algorithme: 'Inférence Bayésienne P(2D6 | Actes) + Expectimax sur portefeuille d’actions',
    roleDansTests: 'Évalue la profondeur de déduction probabiliste fine à partir des cartes posées autour de la table.',
    description:
      'Met à jour par règle de Bayes la distribution de probabilité des gobelets 2D6 alliés au vu de leurs mouvements, puis maximise l’espérance mathématique conjointe de ses pions.',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: true,
    estPointe: true,
  },
  {
    id: 'beam_rollout',
    nom: 'Bot Planificateur Multi-Tours (Beam Search Rollout)',
    algorithme: 'Beam Search (Largeur K=8) + Projection de l’Apprentissage des Pistes',
    roleDansTests: 'Mesure la valeur de la planification multi-tours et du contrôle de l’apprentissage du Méchant.',
    description:
      'Explore en faisceau les combinaisons conjointes (Action I + Action II) en simulant la résolution complète du tour et en pénalisant les coups qui rapprochent les cartes du Méchant des pics 7 et 1.',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: true,
    estPointe: true,
  },
  {
    id: 'ismcts',
    nom: 'Bot IS-MCTS (Monte Carlo à Information Imparfaite)',
    algorithme: 'Information Set MCTS (Déterminisations Bayésiennes + Sélection UCB1)',
    roleDansTests: 'Plafond théorique de référence : exploite la topologie du plateau, les alliances et l’information cachée.',
    description:
      'Échantillonne des mondes possibles (déterminisations des gobelets cachés compatibles avec les poses alliées) et sélectionne les actions par arbre de recherche Monte Carlo (UCB1).',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: true,
    estPointe: true,
  },
];

// Calcule un score de menace a priori par case en combinant les 36 tirages possibles sur les deux pistes
export function estimerMenacePistesParCase(etat: EtatJeuV01): number[] {
  const menaces = etat.cases.map(() => 0);

  for (let somme = 2; somme <= 12; somme++) {
    const pSomme = PROBA_SOMME_2D6[somme] / 36;
    const tactique = etat.pisteTactique[somme];
    for (let ecart = 0; ecart <= 5; ecart++) {
      const pEcart = PROBA_ECART_2D6[ecart] / 36;
      const machineId = etat.pisteMachine[ecart];
      const machine = etat.machines.find((m) => m.id === machineId);
      if (!machine) continue;
      const cible = calculerCibleMachine(etat, machine, tactique, 0);
      if (cible >= 0 && cible < menaces.length) {
        menaces[cible] += pSomme * pEcart;
      }
    }
  }

  return menaces;
}

// Calcule pour un joueur précis la case que ciblera le lancer secret sous son propre gobelet
export function predireCibleDeMonLancerSecret(
  etat: EtatJeuV01,
  joueur: number
): {
  caseCible: number;
  machineId: number;
  tactique: string;
  somme: number;
  ecart: number;
} | null {
  const lancer = etat.lancersSecretsDuTour[joueur];
  if (!lancer) return null;
  const tactique = etat.pisteTactique[lancer.somme];
  const machineId = etat.pisteMachine[lancer.ecart];
  const machine = etat.machines.find((m) => m.id === machineId);
  if (!machine) return null;
  const caseCible = calculerCibleMachine(etat, machine, tactique, joueur);
  return {
    caseCible,
    machineId,
    tactique: NOMS_TACTIQUES[tactique],
    somme: lancer.somme,
    ecart: lancer.ecart,
  };
}

// Analyse les actions déjà posées par les joueurs précédents pour en déduire les cases couvertes ou ayant besoin d'alliance
export function analyserPosesAlliesPrecedents(
  etat: EtatJeuV01,
  joueurCourant: number
): {
  casesDejaCouvertes: Set<number>;
  casesAttendantAlliance: Set<number>;
  destinationsAllies: Map<number, number>; // caseId -> nb de défenseurs alliés qui s'y rendent ou y agissent
  peuplesParCaseEtape1: Map<number, Set<number>>;
  peuplesParCaseEtape2: Map<number, Set<number>>;
} {
  const casesDejaCouvertes = new Set<number>();
  const casesAttendantAlliance = new Set<number>();
  const destinationsAllies = new Map<number, number>();
  const peuplesParCaseEtape1 = new Map<number, Set<number>>();
  const peuplesParCaseEtape2 = new Map<number, Set<number>>();

  const estV04 = estVariantePlacementV04(etat.variante);

  if (estV04) {
    // En V0.4, tout pion présent ou programmé sur une case apporte la présence de son Peuple
    for (const d of etat.defenseurs) {
      if (d.joueur === joueurCourant) continue;
      const prog = etat.programmations[d.joueur] || [];
      const act1 = prog.find((a) => a.pionId === d.id && a.etape === 1);
      const act2 = prog.find((a) => a.pionId === d.id && a.etape === 2);

      let caseE1 = d.caseId;
      if (act1?.type === 'deplacer' && act1.caseCible !== null) {
        caseE1 = act1.caseCible;
      }
      let caseE2 = caseE1;
      if (act2?.type === 'deplacer' && act2.caseCible !== null) {
        caseE2 = act2.caseCible;
      }

      if (!peuplesParCaseEtape1.has(caseE1)) {
        peuplesParCaseEtape1.set(caseE1, new Set());
      }
      peuplesParCaseEtape1.get(caseE1)!.add(d.joueur);

      if (!peuplesParCaseEtape2.has(caseE2)) {
        peuplesParCaseEtape2.set(caseE2, new Set());
      }
      peuplesParCaseEtape2.get(caseE2)!.add(d.joueur);

      // Si le joueur allié a déjà programmé ce tour (ou si on est en programmation_2)
      if (prog.length > 0 || etat.sousPhase === 'programmation_2') {
        const compteActuel = destinationsAllies.get(caseE2) || 0;
        destinationsAllies.set(caseE2, compteActuel + 1);
      }
    }

    // Évaluer pour chaque case si elle est déjà barrée ou si elle attend un 2e Peuple pour Coalition
    for (const c of etat.cases) {
      const peuplesE1 = peuplesParCaseEtape1.get(c.id) || new Set<number>();
      const peuplesE2 = peuplesParCaseEtape2.get(c.id) || new Set<number>();
      const machineDejaSurCase = etat.machines.some(
        (m) =>
          (m.caseId === c.id || m.cibleDeclaree === c.id) && !m.neutraliseeCeTour
      );

      if (machineDejaSurCase) {
        // Une machine est sur place (ou y arrive) : il faut 2 Peuples distincts en Étape 2 pour la Coalition !
        if (peuplesE2.size === 1 && !peuplesE2.has(joueurCourant)) {
          casesAttendantAlliance.add(c.id);
        } else if (peuplesE2.size >= 2) {
          casesDejaCouvertes.add(c.id);
        }
      } else {
        // Pas encore de machine sur place : 1 seul Défenseur en Étape 1 suffit à faire Barrage !
        if (peuplesE1.size >= 1) {
          casesDejaCouvertes.add(c.id);
        }
      }
    }

    return {
      casesDejaCouvertes,
      casesAttendantAlliance,
      destinationsAllies,
      peuplesParCaseEtape1,
      peuplesParCaseEtape2,
    };
  }

  const besoinAlliance =
    etat.variante.effetSaboter === 'alliance_requise' ||
    etat.variante.effetProteger === 'protection_collective';

  for (let j = 0; j < etat.variante.nbJoueurs; j++) {
    if (j === joueurCourant) continue;
    const prog = etat.programmations[j] || [];
    if (prog.length === 0) continue;

    for (const p of etat.defenseurs.filter((d) => d.joueur === j)) {
      const act1 = prog.find((a) => a.pionId === p.id && a.etape === 1);
      const act2 = prog.find((a) => a.pionId === p.id && a.etape === 2);

      let caseFinalePion = p.caseId;
      if (act1?.type === 'deplacer' && act1.caseCible !== null) {
        caseFinalePion = act1.caseCible;
      }
      if (act2?.type === 'deplacer' && act2.caseCible !== null) {
        caseFinalePion = act2.caseCible;
      }

      const compteActuel = destinationsAllies.get(caseFinalePion) || 0;
      destinationsAllies.set(caseFinalePion, compteActuel + 1);

      const agitSurCase =
        act1?.type === 'proteger' ||
        act1?.type === 'saboter' ||
        act2?.type === 'proteger' ||
        act2?.type === 'saboter';

      if (agitSurCase) {
        if (besoinAlliance && compteActuel + 1 < 2) {
          casesAttendantAlliance.add(caseFinalePion);
        } else {
          casesDejaCouvertes.add(caseFinalePion);
          casesAttendantAlliance.delete(caseFinalePion);
        }
      }
    }
  }

  return {
    casesDejaCouvertes,
    casesAttendantAlliance,
    destinationsAllies,
    peuplesParCaseEtape1,
    peuplesParCaseEtape2,
  };
}

// Plus court chemin (BFS) sur n'importe quelle topologie de plateau (Modulaire, Double Face, Hex 19, Sentiers)
export function choisirPasVersCible(
  etat: EtatJeuV01,
  caseDepart: number,
  caseObjectif: number
): number {
  if (caseDepart === caseObjectif) return caseDepart;
  const accessibles = casesAccessiblesDefenseur(etat, caseDepart);
  if (accessibles.includes(caseObjectif)) return caseObjectif;

  // BFS depuis caseObjectif pour trouver quel case dans `accessibles` minimise la distance restante
  const dist = new Array(etat.cases.length).fill(999);
  const queue: number[] = [caseObjectif];
  dist[caseObjectif] = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const dCurr = dist[curr];
    for (const v of etat.cases[curr]?.voisins || []) {
      if (dist[v] > dCurr + 1) {
        dist[v] = dCurr + 1;
        queue.push(v);
      }
    }
  }

  let meilleurPas = accessibles[1] ?? caseDepart;
  let meilleureDist = 999;
  for (const acc of accessibles) {
    if (acc === caseDepart) continue;
    if (dist[acc] < meilleureDist) {
      meilleureDist = dist[acc];
      meilleurPas = acc;
    }
  }
  return meilleurPas;
}

// ============================================================================
// ALGORITHMES DE POINTE (V0.3 / V0.4) : INFÉRENCE BAYÉSIENNE, BEAM ROLLOUT & IS-MCTS
// ============================================================================

/**
 * Calcule la distribution de menace Bayésienne a posteriori par case et par Machine :
 * - Pour le joueur courant : son tirage 2D6 est connu avec certitude (P = 1).
 * - Pour les alliés ayant déjà posé leurs cartes : réévalue par règle de Bayes les couples (somme, écart)
 *   qui expliquent leurs déplacements/protections observés.
 * - Pour les alliés n'ayant pas encore posé : utilise la distribution exacte a priori des 36 lancers.
 */
export function calculerMenaceBayesiennePosteriori(
  etat: EtatJeuV01,
  joueurObservateur: number
): {
  menaceParCase: number[];
  ciblesProbablesMachines: Map<number, number>; // caseId -> machineId probable
} {
  const menaceParCase = etat.cases.map(() => 0);
  const ciblesProbablesMachines = new Map<number, number>();

  for (let j = 0; j < etat.variante.nbJoueurs; j++) {
    if (j === joueurObservateur) {
      const pred = predireCibleDeMonLancerSecret(etat, j);
      if (pred && pred.caseCible >= 0 && pred.caseCible < menaceParCase.length) {
        menaceParCase[pred.caseCible] += 1.35; // Certitude issue de mon propre gobelet
        ciblesProbablesMachines.set(pred.caseCible, pred.machineId);
      }
      continue;
    }

    const progAllie = etat.programmations[j] || [];
    const casesViseesParAllie = new Set<number>();
    if (progAllie.length > 0) {
      for (const d of etat.defenseurs.filter((p) => p.joueur === j)) {
        let pos = d.caseId;
        for (const a of progAllie.filter((x) => x.pionId === d.id)) {
          if (a.type === 'deplacer' && a.caseCible !== null) pos = a.caseCible;
        }
        casesViseesParAllie.add(pos);
      }
    }

    // Distribution de vraisemblance Bayésienne P(somme, ecart | poses de j)
    let sommePoids = 0;
    const hypotheses: { cible: number; machineId: number; poids: number }[] = [];

    for (let somme = 2; somme <= 12; somme++) {
      const pPriorSomme = PROBA_SOMME_2D6[somme] / 36;
      const tactique = etat.pisteTactique[somme];
      for (let ecart = 0; ecart <= 5; ecart++) {
        const pPriorEcart = PROBA_ECART_2D6[ecart] / 36;
        const machineId = etat.pisteMachine[ecart];
        const machine = etat.machines.find((m) => m.id === machineId);
        if (!machine) continue;
        const cible = calculerCibleMachine(etat, machine, tactique, j);

        // Si l'allié j a déjà programmé et se dirige vers `cible`, forte vraisemblance Bayésienne !
        const vraisemblance =
          casesViseesParAllie.size > 0
            ? casesViseesParAllie.has(cible)
              ? 6.0
              : 0.35
            : 1.0;

        const poids = pPriorSomme * pPriorEcart * vraisemblance;
        sommePoids += poids;
        hypotheses.push({ cible, machineId, poids });
      }
    }

    if (sommePoids > 0) {
      for (const h of hypotheses) {
        const probPost = h.poids / sommePoids;
        if (h.cible >= 0 && h.cible < menaceParCase.length) {
          menaceParCase[h.cible] += probPost;
          if (probPost > 0.22 && !ciblesProbablesMachines.has(h.cible)) {
            ciblesProbablesMachines.set(h.cible, h.machineId);
          }
        }
      }
    }
  }

  return { menaceParCase, ciblesProbablesMachines };
}

/**
 * Génère un portefeuille de plans candidats diversifiés et intelligents pour les pions du joueur courant.
 * Utilisé par Expectimax Bayésien, Beam Rollout et IS-MCTS.
 */
function genererPortefeuillePlansCandidats(
  etat: EtatJeuV01,
  joueur: number,
  etapesACalculer: (1 | 2)[],
  actionsExistantes: ActionProgrammee[]
): ActionProgrammee[][] {
  const estV04 = estVariantePlacementV04(etat.variante);
  const pionsJoueur = etat.defenseurs.filter((d) => d.joueur === joueur);
  const { menaceParCase, ciblesProbablesMachines } =
    calculerMenaceBayesiennePosteriori(etat, joueur);
  const analyseAllies = analyserPosesAlliesPrecedents(etat, joueur);
  const besoinAlliance =
    estV04 ||
    etat.variante.effetSaboter === 'alliance_requise' ||
    etat.variante.effetProteger === 'protection_collective';

  // Identifier les 6 cases les plus stratégiques du plateau à ce tour
  const casesTriees = etat.cases
    .map((c) => {
      let urgence = menaceParCase[c.id] * 4.5;
      const machsPresentes = etat.machines.filter(
        (m) =>
          (m.caseId === c.id || m.cibleDeclaree === c.id) && !m.neutraliseeCeTour
      ).length;
      urgence += machsPresentes * 3.2;
      if (c.anneau === 'coeur') urgence += 1.2;
      if (analyseAllies.casesAttendantAlliance.has(c.id)) urgence += 7.5;
      if (analyseAllies.casesDejaCouvertes.has(c.id)) urgence -= 4.2;
      if ((etat.forets[c.id] || 0) === 0) urgence -= 12;
      return { caseId: c.id, urgence };
    })
    .sort((a, b) => b.urgence - a.urgence)
    .slice(0, 6);

  // Pour chaque pion du joueur, construire 4 à 6 séquences d'actions cohérentes
  const sequencesParPion: ActionProgrammee[][][] = pionsJoueur.map(
    (pion, idxPion) => {
      const seqs: ActionProgrammee[][] = [];
      let caseDepart = pion.caseId;
      const act1Deja = actionsExistantes.find(
        (a) => a.pionId === pion.id && a.etape === 1
      );
      if (act1Deja?.type === 'deplacer' && act1Deja.caseCible !== null) {
        caseDepart = act1Deja.caseCible;
      }

      const ciblesCandidates = [
        caseDepart,
        ...casesTriees.map((ct) => ct.caseId).filter((cid) => cid !== caseDepart),
      ].slice(0, 5);

      if (estV04) {
        // En V0.4 (Pur Placement) : chaque étape est soit un déplacement vers une case voisine, soit rester sur place ('attendre')
        for (const objCase of ciblesCandidates) {
          const seq: ActionProgrammee[] = [];
          let posCourante = caseDepart;

          for (const etape of etapesACalculer) {
            if (posCourante !== objCase) {
              const pas = choisirPasVersCible(etat, posCourante, objCase);
              if (pas !== posCourante) {
                posCourante = pas;
                seq.push({
                  pionId: pion.id,
                  etape,
                  type: 'deplacer',
                  caseCible: pas,
                  machineCible: null,
                  explicationBot:
                    etape === 1
                      ? `Déplacement I (Barrage) vers ${etat.cases[pas]?.nom} (menace ${(menaceParCase[pas] || 0).toFixed(2)}).`
                      : `Déplacement II (Coalition) vers ${etat.cases[pas]?.nom}.`,
                });
              } else {
                seq.push({
                  pionId: pion.id,
                  etape,
                  type: 'attendre',
                  caseCible: null,
                  machineCible: null,
                  explicationBot: `Maintien de position sur ${etat.cases[posCourante]?.nom}.`,
                });
              }
            } else {
              // Déjà arrivé sur objCase à l'étape 1 : en étape 2, soit rester en Coalition/Barrage, soit pivoter vers un voisin critique
              if (etape === 2) {
                const voisinsCritiques = (etat.cases[posCourante]?.voisins || [])
                  .filter((v) => analyseAllies.casesAttendantAlliance.has(v))
                  .sort((a, b) => (menaceParCase[b] || 0) - (menaceParCase[a] || 0));
                const dejaEnCoalitionIci =
                  (analyseAllies.peuplesParCaseEtape2.get(posCourante)?.size || 0) >= 1 &&
                  etat.machines.some((m) => m.caseId === posCourante);

                if (!dejaEnCoalitionIci && voisinsCritiques.length > 0 && idxPion === 1) {
                  const vCible = voisinsCritiques[0];
                  posCourante = vCible;
                  seq.push({
                    pionId: pion.id,
                    etape: 2,
                    type: 'deplacer',
                    caseCible: vCible,
                    machineCible: null,
                    explicationBot: `Déplacement II : rejoint ${etat.cases[vCible]?.nom} pour former une Coalition Inter-Peuples.`,
                  });
                } else {
                  seq.push({
                    pionId: pion.id,
                    etape: 2,
                    type: 'attendre',
                    caseCible: null,
                    machineCible: null,
                    explicationBot: `Maintien sur ${etat.cases[posCourante]?.nom} (Barrage / Coalition).`,
                  });
                }
              } else {
                seq.push({
                  pionId: pion.id,
                  etape: 1,
                  type: 'attendre',
                  caseCible: null,
                  machineCible: null,
                  explicationBot: `Barrage sur place sur ${etat.cases[posCourante]?.nom}.`,
                });
              }
            }
          }
          seqs.push(seq);
        }

        // Ajouter aussi une séquence "Barrage Étape 1 sur Cible A puis Pivot Étape 2 sur Cible B voisine"
        if (etapesACalculer.length === 2 && ciblesCandidates.length >= 2) {
          const pas1 = choisirPasVersCible(etat, caseDepart, ciblesCandidates[1]);
          const voisinsPas1 = etat.cases[pas1]?.voisins || [];
          const meilleurVoisin2 = voisinsPas1
            .filter((v) => (etat.forets[v] || 0) > 0)
            .sort((a, b) => (menaceParCase[b] || 0) - (menaceParCase[a] || 0))[0];
          if (meilleurVoisin2 !== undefined) {
            seqs.push([
              {
                pionId: pion.id,
                etape: 1,
                type: pas1 !== caseDepart ? 'deplacer' : 'attendre',
                caseCible: pas1 !== caseDepart ? pas1 : null,
                machineCible: null,
                explicationBot: `Barrage Étape I sur ${etat.cases[pas1]?.nom}.`,
              },
              {
                pionId: pion.id,
                etape: 2,
                type: 'deplacer',
                caseCible: meilleurVoisin2,
                machineCible: null,
                explicationBot: `Pivot Étape II vers ${etat.cases[meilleurVoisin2]?.nom}.`,
              },
            ]);
          }
        }

        return seqs;
      }

      for (const objCase of ciblesCandidates) {
        const seq: ActionProgrammee[] = [];
        let posCourante = caseDepart;

        for (const etape of etapesACalculer) {
          if (posCourante !== objCase && etape === 1) {
            const pas = choisirPasVersCible(etat, posCourante, objCase);
            posCourante = pas;
            seq.push({
              pionId: pion.id,
              etape,
              type: 'deplacer',
              caseCible: pas,
              machineCible: null,
              explicationBot: `Cible prioritaire ${etat.cases[pas]?.nom} (menace Bayésienne ${(menaceParCase[pas] || 0).toFixed(2)}).`,
            });
          } else {
            // Déjà sur la case cible : choisir entre Saboter, Protéger et Replanter
            const machsIci = etat.machines.filter(
              (m) =>
                (m.caseId === posCourante || m.cibleDeclaree === posCourante) &&
                !m.neutraliseeCeTour
            );
            const machProbable =
              machsIci[0]?.id ?? ciblesProbablesMachines.get(posCourante) ?? null;
            const nbAlliesIci =
              etat.defenseurs.filter((d) => d.caseId === posCourante).length +
              (analyseAllies.destinationsAllies.get(posCourante) || 0);

            const peutSaboter =
              (machsIci.length > 0 || (etape === 2 && machProbable !== null)) &&
              (etat.variante.effetSaboter !== 'alliance_requise' ||
                nbAlliesIci >= 2 ||
                besoinAlliance);

            if (peutSaboter && (idxPion % 2 === 1 || etape === 1)) {
              seq.push({
                pionId: pion.id,
                etape,
                type: 'saboter',
                caseCible: null,
                machineCible: machProbable,
                explicationBot: `Sabotage tactique sur ${etat.cases[posCourante]?.nom}.`,
              });
            } else if (
              etat.variante.actionReplanterActive &&
              etape === 1 &&
              machsIci.length === 0 &&
              (etat.forets[posCourante] || 0) <
                (etat.cases[posCourante]?.foretsMax || 4)
            ) {
              seq.push({
                pionId: pion.id,
                etape,
                type: 'replanter',
                caseCible: null,
                machineCible: null,
                explicationBot: `Replantation préventive sur ${etat.cases[posCourante]?.nom}.`,
              });
            } else {
              seq.push({
                pionId: pion.id,
                etape,
                type: 'proteger',
                caseCible: null,
                machineCible: null,
                explicationBot: `Bouclier de protection sur ${etat.cases[posCourante]?.nom}.`,
              });
            }
          }
        }
        seqs.push(seq);

        // Ajouter une variante "Protéger + Saboter combinés" sur la case cible si on s'y trouve
        if (etapesACalculer.length === 2 && objCase === caseDepart) {
          seqs.push([
            {
              pionId: pion.id,
              etape: 1,
              type: 'proteger',
              caseCible: null,
              machineCible: null,
              explicationBot: `Verrouillage Bouclier Étape I sur ${etat.cases[caseDepart]?.nom}.`,
            },
            {
              pionId: pion.id,
              etape: 2,
              type: 'saboter',
              caseCible: null,
              machineCible: ciblesProbablesMachines.get(caseDepart) ?? null,
              explicationBot: `Sabotage Étape II sur ${etat.cases[caseDepart]?.nom}.`,
            },
          ]);
        }
      }

      return seqs;
    }
  );

  // Produit cartésien des séquences des pions du joueur (limité à 12 plans conjoints)
  if (sequencesParPion.length === 0) return [[...actionsExistantes]];
  if (sequencesParPion.length === 1) {
    return sequencesParPion[0].map((s) => [...actionsExistantes, ...s]);
  }

  const plansConjoints: ActionProgrammee[][] = [];
  const seqsP0 = sequencesParPion[0];
  const seqsP1 = sequencesParPion[1];
  const seqsRestants = sequencesParPion.slice(2).map((s) => s[0] || []);

  for (let i = 0; i < seqsP0.length; i++) {
    for (let j = 0; j < seqsP1.length; j++) {
      // En V0.4, 2 pions du MÊME joueur sur la même case ne suffisent pas à former une Coalition (il faut 2 Peuples distincts !)
      const c0 =
        seqsP0[i].find((a) => a.type === 'deplacer')?.caseCible ??
        pionsJoueur[0].caseId;
      const c1 =
        seqsP1[j].find((a) => a.type === 'deplacer')?.caseCible ??
        pionsJoueur[1].caseId;
      if ((estV04 || !besoinAlliance) && c0 === c1 && i !== 0 && j !== 0) continue;

      const plan = [
        ...actionsExistantes,
        ...seqsP0[i],
        ...seqsP1[j],
        ...seqsRestants.flat(),
      ];
      plansConjoints.push(plan);
      if (plansConjoints.length >= 12) break;
    }
    if (plansConjoints.length >= 12) break;
  }

  return plansConjoints.length > 0
    ? plansConjoints
    : [[...actionsExistantes, ...(sequencesParPion[0]?.[0] || [])]];
}

/**
 * Évalue la qualité multi-tours d'un état de jeu après résolution d'un tour :
 * - Forêts préservées (%)
 * - Intégrité du Cœur Central
 * - Sabotages, Barrages et Coalitions réussis
 * - Contrôle de l'apprentissage du Méchant (pénalise si Percée ou Cupidité occupent les cases 6, 7, 8)
 */
function evaluerEtatHorizonMultiTours(etat: EtatJeuV01): number {
  const pctForet = calculerPourcentageForetSauvee(etat);
  const foretsCoeur = etat.forets[0] || 0;
  const machinesAuChantier = etat.machines.filter((m) => m.caseId === null).length;

  // Mesurer le danger futur de la Piste Tactique (pics 6, 7, 8)
  let penalitePiste = 0;
  for (const casePic of [6, 7, 8]) {
    const tac = etat.pisteTactique[casePic];
    if (tac === 'percee' || tac === 'cupidite' || tac === 'acharnement') {
      penalitePiste += casePic === 7 ? 2.4 : 1.4;
    }
  }

  // Bonus de couverture spatiale en V0.4 (pions répartis sur des cases boisées distinctes ou en coalition sur une Machine)
  let bonusPlacementV04 = 0;
  if (estVariantePlacementV04(etat.variante)) {
    for (const c of etat.cases) {
      if ((etat.forets[c.id] || 0) === 0) continue;
      const nbPeuples = compterPeuplesDistinctsSurCase(etat, c.id);
      const aMachine = etat.machines.some((m) => m.caseId === c.id);
      if (aMachine && nbPeuples >= 2) {
        bonusPlacementV04 += 2.2;
      } else if (!aMachine && nbPeuples >= 1) {
        bonusPlacementV04 += 0.6;
      }
    }
  }

  return (
    pctForet * 1.2 +
    foretsCoeur * 1.5 +
    machinesAuChantier * 2.8 +
    etat.stats.coupesEviteesParProtection * 1.8 +
    etat.stats.machinesSabotees * 2.5 +
    bonusPlacementV04 -
    penalitePiste
  );
}

/**
 * Simule la fin du tour courant à partir d'un état où le joueur `joueur` applique `planJoueur`,
 * en complétant les joueurs non encore programmés par la politique Déductive rapide.
 */
function simulerFinDuTourAvecPlan(
  etatDepart: EtatJeuV01,
  joueur: number,
  planJoueur: ActionProgrammee[],
  lancersDeterminises?: LancerSecret2D6[]
): EtatJeuV01 {
  let sim = clonerEtatJeu(etatDepart);
  if (lancersDeterminises) {
    sim.lancersSecretsDuTour = lancersDeterminises.map((l) => ({ ...l }));
  }
  sim.programmations[joueur] = planJoueur.map((a) => ({ ...a }));

  // Compléter les programmations manquantes des coéquipiers avec le bot déductif rapide
  for (let j = 0; j < sim.variante.nbJoueurs; j++) {
    if (j === joueur) continue;
    const exist = sim.programmations[j] || [];
    const nbAttendus =
      sim.variante.modeProgrammation === 'un_seul_ordre'
        ? sim.variante.defenseursParJoueur
        : sim.variante.defenseursParJoueur * 2;
    if (exist.length < nbAttendus) {
      const complemente = calculerProgrammationBotClassique(sim, j, 'deductif');
      sim.programmations[j] = complemente.actions;
    }
  }

  const tourInitial = sim.tourActuel;
  let iter = 0;
  if (sim.sousPhase === 'programmation_1') {
    sim.sousPhase = 'resolution_actions_1';
  } else if (sim.sousPhase === 'programmation_2') {
    sim.sousPhase = 'resolution_actions_2';
  }

  while (
    sim.sousPhase !== 'fin_de_partie' &&
    sim.tourActuel === tourInitial &&
    iter < 12
  ) {
    iter++;
    if (sim.sousPhase === 'programmation_2') {
      for (let j = 0; j < sim.variante.nbJoueurs; j++) {
        const exist = sim.programmations[j] || [];
        if (!exist.some((a) => a.etape === 2)) {
          const res2 = calculerProgrammationBotClassique(sim, j, 'deductif', 2);
          sim.programmations[j] = res2.actions;
        }
      }
      sim.sousPhase = 'resolution_actions_2';
    } else {
      sim = avancerSousPhaseResolution(sim);
    }
  }

  return sim;
}

// Décide des actions programmées pour les 6 bots classiques (Inerte -> Déductif)
function calculerProgrammationBotClassique(
  etat: EtatJeuV01,
  joueur: number,
  profil: BotProfileId,
  etapeUniquement?: 1 | 2
): { actions: ActionProgrammee[]; nextRngState: number } {
  let rng = etat.etatRng + joueur * 97 + etat.tourActuel * 31;
  const estV04 = estVariantePlacementV04(etat.variante);
  const pionsJoueur = etat.defenseurs.filter((d) => d.joueur === joueur);
  const etapesACalculer: (1 | 2)[] = etapeUniquement
    ? [etapeUniquement]
    : etat.variante.modeProgrammation === 'un_seul_ordre'
    ? [1]
    : [1, 2];

  const actionsExistantes = (etat.programmations[joueur] || []).filter(
    (a) => !etapesACalculer.includes(a.etape)
  );
  const nouvellesActions: ActionProgrammee[] = [...actionsExistantes];

  const menacesPistes = estimerMenacePistesParCase(etat);
  const maPrediction = predireCibleDeMonLancerSecret(etat, joueur);
  const analyseAllies = analyserPosesAlliesPrecedents(etat, joueur);
  const casesPrisesParMesPions = new Set<number>();

  for (const pion of pionsJoueur) {
    let caseSimulee = pion.caseId;
    const act1DejaPosee = actionsExistantes.find(
      (a) => a.pionId === pion.id && a.etape === 1
    );
    if (act1DejaPosee?.type === 'deplacer' && act1DejaPosee.caseCible !== null) {
      caseSimulee = act1DejaPosee.caseCible;
    }

    for (const etape of etapesACalculer) {
      if (profil === 'inerte') {
        nouvellesActions.push({
          pionId: pion.id,
          etape,
          type: 'attendre',
          caseCible: null,
          machineCible: null,
          explicationBot: 'Inerte : reste immobile sans se déplacer.',
        });
        continue;
      }

      if (profil === 'boucle') {
        if (estV04) {
          // En V0.4, la boucle aveugle fait un va-et-vient mécanique vers le 1er voisin sans lire les pistes
          const voisins = etat.cases[caseSimulee]?.voisins || [];
          const cibleBoucle = voisins[(etat.tourActuel + etape) % Math.max(1, voisins.length)] ?? caseSimulee;
          caseSimulee = cibleBoucle;
          nouvellesActions.push({
            pionId: pion.id,
            etape,
            type: 'deplacer',
            caseCible: cibleBoucle,
            machineCible: null,
            explicationBot: `Boucle fixe : va-et-vient mécanique vers ${etat.cases[cibleBoucle]?.nom} sans lire ni dés ni plateau.`,
          });
          continue;
        }
        const typeBoucle: ActionDefenseurType =
          etat.variante.actionReplanterActive && etape === 1
            ? 'replanter'
            : 'proteger';
        nouvellesActions.push({
          pionId: pion.id,
          etape,
          type: typeBoucle,
          caseCible: null,
          machineCible: null,
          explicationBot: `Boucle fixe : répète « ${typeBoucle} » sur place sans lire ni dés ni plateau.`,
        });
        continue;
      }

      if (profil === 'hasard') {
        const r = nextRng(rng);
        rng = r.nextState;
        if (estV04) {
          const acc = casesAccessiblesDefenseur(etat, caseSimulee);
          const cibleCase = acc[Math.floor(r.val * acc.length)] ?? caseSimulee;
          if (cibleCase !== caseSimulee) {
            caseSimulee = cibleCase;
            nouvellesActions.push({
              pionId: pion.id,
              etape,
              type: 'deplacer',
              caseCible: cibleCase,
              machineCible: null,
              explicationBot: 'Hasard : déplacement tiré aléatoirement.',
            });
          } else {
            nouvellesActions.push({
              pionId: pion.id,
              etape,
              type: 'attendre',
              caseCible: null,
              machineCible: null,
              explicationBot: 'Hasard : reste sur place aléatoirement.',
            });
          }
          continue;
        }
        const poolTypes: ActionDefenseurType[] = [
          'deplacer',
          'proteger',
          'saboter',
        ];
        if (etat.variante.actionReplanterActive) poolTypes.push('replanter');
        const choixType =
          poolTypes[Math.floor(r.val * poolTypes.length)] || 'proteger';
        let cibleCase: number | null = null;
        if (choixType === 'deplacer') {
          const acc = casesAccessiblesDefenseur(etat, caseSimulee).filter(
            (c) => c !== caseSimulee
          );
          const r2 = nextRng(rng);
          rng = r2.nextState;
          cibleCase = acc[Math.floor(r2.val * acc.length)] ?? caseSimulee;
          caseSimulee = cibleCase;
        }
        nouvellesActions.push({
          pionId: pion.id,
          etape,
          type: choixType,
          caseCible: cibleCase,
          machineCible: null,
          explicationBot: 'Hasard : action tirée aléatoirement.',
        });
        continue;
      }

      if (profil === 'reflexe') {
        if (estV04) {
          const machinesSurMaCase = etat.machines.filter(
            (m) => m.caseId === caseSimulee && !m.neutraliseeCeTour
          );
          if (machinesSurMaCase.length > 0) {
            nouvellesActions.push({
              pionId: pion.id,
              etape,
              type: 'attendre',
              caseCible: null,
              machineCible: null,
              explicationBot: `Réflexe : reste sur ${etat.cases[caseSimulee]?.nom} où se trouve une Machine visible.`,
            });
          } else {
            const acc = casesAccessiblesDefenseur(etat, caseSimulee);
            const voisineAvecMachine = acc.find((cid) =>
              etat.machines.some((m) => m.caseId === cid && !m.neutraliseeCeTour)
            );
            if (voisineAvecMachine !== undefined) {
              caseSimulee = voisineAvecMachine;
              nouvellesActions.push({
                pionId: pion.id,
                etape,
                type: 'deplacer',
                caseCible: voisineAvecMachine,
                machineCible: null,
                explicationBot: `Réflexe : rejoint ${etat.cases[voisineAvecMachine]?.nom} où se trouve une Machine visible.`,
              });
            } else {
              nouvellesActions.push({
                pionId: pion.id,
                etape,
                type: 'attendre',
                caseCible: null,
                machineCible: null,
                explicationBot: `Réflexe : aucune Machine voisine visible, reste sur ${etat.cases[caseSimulee]?.nom}.`,
              });
            }
          }
          continue;
        }
        const machinesSurMaCase = etat.machines.filter(
          (m) => m.caseId === caseSimulee && !m.neutraliseeCeTour
        );
        if (machinesSurMaCase.length > 0) {
          const typeChoisi: ActionDefenseurType =
            etape === 1 && etat.variante.effetSaboter === 'individuel_chantier'
              ? 'saboter'
              : 'proteger';
          nouvellesActions.push({
            pionId: pion.id,
            etape,
            type: typeChoisi,
            caseCible: null,
            machineCible: machinesSurMaCase[0].id,
            explicationBot: `Réflexe : Machine visible sur ${etat.cases[caseSimulee]?.nom}, joue ${typeChoisi}.`,
          });
        } else {
          const acc = casesAccessiblesDefenseur(etat, caseSimulee);
          const voisineAvecMachine = acc.find((cid) =>
            etat.machines.some((m) => m.caseId === cid && !m.neutraliseeCeTour)
          );
          if (voisineAvecMachine !== undefined && etape === 1) {
            caseSimulee = voisineAvecMachine;
            nouvellesActions.push({
              pionId: pion.id,
              etape,
              type: 'deplacer',
              caseCible: voisineAvecMachine,
              machineCible: null,
              explicationBot: `Réflexe : rejoint ${etat.cases[voisineAvecMachine]?.nom} où se trouve une Machine.`,
            });
          } else {
            nouvellesActions.push({
              pionId: pion.id,
              etape,
              type: 'proteger',
              caseCible: null,
              machineCible: null,
              explicationBot: `Réflexe : protège sa position actuelle (${etat.cases[caseSimulee]?.nom}).`,
            });
          }
        }
        continue;
      }

      // 5. BOT GLOUTON & 6. BOT DÉDUCTIF
      const estDeductif = profil === 'deductif';

      if (estV04) {
        // Logique V0.4 (Pur Placement & Coalition) :
        // Étape 1 : Barrage préventif sur la cible prédite par les dés 2D6 (1 seul Défenseur suffit à bloquer l'entrée)
        // Étape 2 : Coalition Inter-Peuples (2 Peuples distincts requis) sur les cases où une Machine est présente ou arrive
        const evaluerCasePlacementV04 = (cid: number): number => {
          let score = 0;
          const foretsRestantes = etat.forets[cid] || 0;
          if (foretsRestantes === 0) return -10;

          const machinesIci = etat.machines.filter(
            (m) =>
              (m.caseId === cid || m.cibleDeclaree === cid) &&
              !m.neutraliseeCeTour
          );

          if (etape === 1) {
            // En Étape 1, priorité au Barrage sur la case visée par mon gobelet 2D6 (si aucune Machine n'y est déjà)
            if (maPrediction && maPrediction.caseCible === cid) {
              score += machinesIci.length === 0 ? 6.2 : 4.5;
            }
            score += (menacesPistes[cid] || 0) * 3.8;
            score += machinesIci.length * 2.5;
          } else {
            // En Étape 2, le ciblage Machine a déjà eu lieu (ou va se résoudre) : priorité aux Coalitions sur les Machines présentes !
            score += machinesIci.length * 5.2;
            if (maPrediction && maPrediction.caseCible === cid) {
              score += 3.5;
            }
            score += (menacesPistes[cid] || 0) * 2.4;
          }

          if (cid === 0) score += 0.8;

          if (estDeductif) {
            if (analyseAllies.casesAttendantAlliance.has(cid)) {
              score += 7.5; // Rejoindre un allié d'un autre Peuple pour former une Coalition !
            } else if (analyseAllies.casesDejaCouvertes.has(cid)) {
              score -= 4.8; // Déjà barrée ou déjà en coalition : ne pas gaspiller un pion !
            }
          }

          // En V0.4, envoyer ses 2 propres pions du MÊME Peuple sur la même case est inutile (ne crée pas de Coalition !)
          if (casesPrisesParMesPions.has(cid)) {
            score -= 5.0;
          }

          return score;
        };

        const accessibles = casesAccessiblesDefenseur(etat, caseSimulee);
        let meilleureCase = caseSimulee;
        let meilleurScore = evaluerCasePlacementV04(caseSimulee);

        for (const c of etat.cases) {
          const sc = evaluerCasePlacementV04(c.id);
          const penaliteDist = accessibles.includes(c.id) ? 0.08 : 0.85;
          if (sc - penaliteDist > meilleurScore) {
            meilleurScore = sc - penaliteDist;
            meilleureCase = c.id;
          }
        }

        if (meilleureCase !== caseSimulee) {
          const pas = choisirPasVersCible(etat, caseSimulee, meilleureCase);
          caseSimulee = pas;
          casesPrisesParMesPions.add(caseSimulee);
          nouvellesActions.push({
            pionId: pion.id,
            etape,
            type: 'deplacer',
            caseCible: pas,
            machineCible: null,
            explicationBot: estDeductif
              ? `Déductif (V0.4) : se déplace vers ${etat.cases[pas]?.nom} (${etape === 1 ? 'Barrage anti-entrée' : 'Coalition Inter-Peuples'}).`
              : `Glouton (V0.4) : se déplace vers ${etat.cases[pas]?.nom} pour contrer son dé (${maPrediction?.tactique}).`,
          });
        } else {
          casesPrisesParMesPions.add(caseSimulee);
          nouvellesActions.push({
            pionId: pion.id,
            etape,
            type: 'attendre',
            caseCible: null,
            machineCible: null,
            explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} (V0.4) : maintient sa position sur ${etat.cases[caseSimulee]?.nom} (${etape === 1 ? 'Barrage' : 'Coalition'}).`,
          });
        }
        continue;
      }

      const evaluerCaseObjectif = (cid: number): number => {
        let score = 0;
        const foretsRestantes = etat.forets[cid] || 0;
        if (foretsRestantes === 0) return -10;

        if (maPrediction && maPrediction.caseCible === cid) {
          score += 5.0;
        }
        score += (menacesPistes[cid] || 0) * 3.5;

        const nbMachinesPresentes = etat.machines.filter(
          (m) =>
            (m.caseId === cid || m.cibleDeclaree === cid) &&
            !m.neutraliseeCeTour
        ).length;
        score += nbMachinesPresentes * 2.2;

        if (cid === 0) score += 0.6;

        if (estDeductif) {
          if (analyseAllies.casesAttendantAlliance.has(cid)) {
            score += 6.5;
          } else if (analyseAllies.casesDejaCouvertes.has(cid)) {
            score -= 4.5;
          }
        }

        const besoinAlliance =
          etat.variante.effetSaboter === 'alliance_requise' ||
          etat.variante.effetProteger === 'protection_collective';

        if (casesPrisesParMesPions.has(cid)) {
          score += besoinAlliance ? 2.5 : -3.5;
        }

        return score;
      };

      const accessibles = casesAccessiblesDefenseur(etat, caseSimulee);

      if (etape === 1) {
        let meilleureCase = caseSimulee;
        let meilleurScore = evaluerCaseObjectif(caseSimulee);

        for (const c of etat.cases) {
          const sc = evaluerCaseObjectif(c.id);
          const penaliteDist = accessibles.includes(c.id) ? 0.1 : 0.8;
          if (sc - penaliteDist > meilleurScore) {
            meilleurScore = sc - penaliteDist;
            meilleureCase = c.id;
          }
        }

        if (meilleureCase !== caseSimulee) {
          const pas = choisirPasVersCible(etat, caseSimulee, meilleureCase);
          caseSimulee = pas;
          nouvellesActions.push({
            pionId: pion.id,
            etape: 1,
            type: 'deplacer',
            caseCible: pas,
            machineCible: null,
            explicationBot: estDeductif
              ? `Déductif : se déplace vers ${etat.cases[pas]?.nom} (dés secrets Somme ${maPrediction?.somme}/Écart ${maPrediction?.ecart} + lecture des poses alliées).`
              : `Glouton : se déplace vers ${etat.cases[pas]?.nom} pour intercepter la menace de son dé (${maPrediction?.tactique}).`,
          });
        } else {
          const machinesSurPlace = etat.machines.filter(
            (m) => m.caseId === caseSimulee && !m.neutraliseeCeTour
          );
          const nbDefSurPlace =
            etat.defenseurs.filter((d) => d.caseId === caseSimulee).length +
            (analyseAllies.destinationsAllies.get(caseSimulee) || 0);

          const peutSaboter =
            machinesSurPlace.length > 0 &&
            (etat.variante.effetSaboter !== 'alliance_requise' ||
              nbDefSurPlace >= 2);

          if (peutSaboter) {
            casesPrisesParMesPions.add(caseSimulee);
            nouvellesActions.push({
              pionId: pion.id,
              etape: 1,
              type: 'saboter',
              caseCible: null,
              machineCible: machinesSurPlace[0].id,
              explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} : sabote immédiatement ${machinesSurPlace[0].nom} sur ${etat.cases[caseSimulee]?.nom} avant le ciblage.`,
            });
          } else if (
            etat.variante.actionReplanterActive &&
            machinesSurPlace.length === 0 &&
            etat.forets[caseSimulee] < (etat.cases[caseSimulee]?.foretsMax || 4)
          ) {
            nouvellesActions.push({
              pionId: pion.id,
              etape: 1,
              type: 'replanter',
              caseCible: null,
              machineCible: null,
              explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} : replante +1 Forêt sur ${etat.cases[caseSimulee]?.nom} pendant que la voie est libre.`,
            });
          } else {
            casesPrisesParMesPions.add(caseSimulee);
            nouvellesActions.push({
              pionId: pion.id,
              etape: 1,
              type: 'proteger',
              caseCible: null,
              machineCible: null,
              explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} : verrouille la protection sur ${etat.cases[caseSimulee]?.nom}.`,
            });
          }
        }
      } else {
        const machinesMenacantesIci = etat.machines.filter(
          (m) =>
            (m.caseId === caseSimulee || m.cibleDeclaree === caseSimulee) &&
            !m.neutraliseeCeTour
        );

        const nbAlliesAttendusIci =
          (analyseAllies.destinationsAllies.get(caseSimulee) || 0) +
          (casesPrisesParMesPions.has(caseSimulee) ? 2 : 1);

        const sabotagePossibleEtRentable =
          (machinesMenacantesIci.length === 1 ||
            (maPrediction && maPrediction.caseCible === caseSimulee)) &&
          (etat.variante.effetSaboter !== 'alliance_requise' ||
            nbAlliesAttendusIci >= 2);

        casesPrisesParMesPions.add(caseSimulee);

        if (sabotagePossibleEtRentable && pion.numeroPion === 2) {
          nouvellesActions.push({
            pionId: pion.id,
            etape: 2,
            type: 'saboter',
            caseCible: null,
            machineCible:
              machinesMenacantesIci[0]?.id ?? maPrediction?.machineId ?? null,
            explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} : sabote la Machine arrivée sur ${etat.cases[caseSimulee]?.nom} avant l'abattage.`,
          });
        } else {
          nouvellesActions.push({
            pionId: pion.id,
            etape: 2,
            type: 'proteger',
            caseCible: null,
            machineCible: null,
            explicationBot: `${estDeductif ? 'Déductif' : 'Glouton'} : protège ${etat.cases[caseSimulee]?.nom} pour bloquer la coupe des Forêts en fin de tour.`,
          });
        }
      }
    }
  }

  return { actions: nouvellesActions, nextRngState: rng };
}

// Point d'entrée principal : calcule la programmation d'un Bot (9 profils disponibles)
export function calculerProgrammationBot(
  etat: EtatJeuV01,
  joueur: number,
  profil: BotProfileId,
  etapeUniquement?: 1 | 2
): { actions: ActionProgrammee[]; nextRngState: number } {
  // Si profil classique (1 à 6), déléguer directement
  if (
    profil !== 'expectimax_bayesien' &&
    profil !== 'beam_rollout' &&
    profil !== 'ismcts'
  ) {
    return calculerProgrammationBotClassique(
      etat,
      joueur,
      profil,
      etapeUniquement
    );
  }

  let rng = etat.etatRng + joueur * 131 + etat.tourActuel * 53;
  const etapesACalculer: (1 | 2)[] = etapeUniquement
    ? [etapeUniquement]
    : etat.variante.modeProgrammation === 'un_seul_ordre'
    ? [1]
    : [1, 2];

  const actionsExistantes = (etat.programmations[joueur] || []).filter(
    (a) => !etapesACalculer.includes(a.etape)
  );

  const plansCandidats = genererPortefeuillePlansCandidats(
    etat,
    joueur,
    etapesACalculer,
    actionsExistantes
  );

  // Ajouter également le plan du bot Déductif comme candidat de référence dans le portefeuille
  const planDeductifRef = calculerProgrammationBotClassique(
    etat,
    joueur,
    'deductif',
    etapeUniquement
  ).actions;
  plansCandidats.unshift(planDeductifRef);

  // 7. BOT EXPECTIMAX BAYÉSIEN : Évalue l'espérance mathématique sur la distribution Bayésienne a posteriori
  if (profil === 'expectimax_bayesien') {
    const { menaceParCase } = calculerMenaceBayesiennePosteriori(etat, joueur);
    const analyseAllies = analyserPosesAlliesPrecedents(etat, joueur);

    let meilleurPlan = plansCandidats[0];
    let meilleurScore = -9999;

    for (const plan of plansCandidats) {
      let utiliteEsperee = 0;
      const casesCouvertesParPlan = new Set<number>();

      for (const pion of etat.defenseurs.filter((d) => d.joueur === joueur)) {
        let pos = pion.caseId;
        const actsPion = plan.filter((a) => a.pionId === pion.id);
        for (const a of actsPion) {
          if (a.type === 'deplacer' && a.caseCible !== null) pos = a.caseCible;
          if (a.type === 'proteger') {
            const pMenace = menaceParCase[pos] || 0;
            const dejaCouvert =
              analyseAllies.casesDejaCouvertes.has(pos) ||
              casesCouvertesParPlan.has(pos);
            utiliteEsperee += dejaCouvert ? pMenace * 0.6 : pMenace * 6.2;
            if (analyseAllies.casesAttendantAlliance.has(pos)) {
              utiliteEsperee += 5.5;
            }
            casesCouvertesParPlan.add(pos);
          } else if (a.type === 'saboter') {
            const pMenace = menaceParCase[pos] || 0;
            const machPresente = etat.machines.some(
              (m) => m.caseId === pos && !m.neutraliseeCeTour
            );
            utiliteEsperee += machPresente ? 6.8 : pMenace * 5.0;
          } else if (a.type === 'replanter') {
            utiliteEsperee +=
              (etat.forets[pos] || 0) < (etat.cases[pos]?.foretsMax || 4)
                ? 3.4
                : -2.0;
          }
        }
      }

      // Vérification rapide par 1 simulation déterministe sur un tirage médian
      const etatProjete = simulerFinDuTourAvecPlan(etat, joueur, plan);
      utiliteEsperee += evaluerEtatHorizonMultiTours(etatProjete) * 0.35;

      if (utiliteEsperee > meilleurScore) {
        meilleurScore = utiliteEsperee;
        meilleurPlan = plan;
      }
    }

    return {
      actions: meilleurPlan.map((a) => ({
        ...a,
        explicationBot: `Expectimax Bayésien : maximise l'espérance postérieure E[U]=${meilleurScore.toFixed(1)} (${a.explicationBot || a.type}).`,
      })),
      nextRngState: rng,
    };
  }

  // 8. BOT PLANIFICATEUR MULTI-TOURS (BEAM SEARCH ROLLOUT)
  if (profil === 'beam_rollout') {
    const largeurFaisceau = Math.min(6, plansCandidats.length);
    let meilleurPlan = plansCandidats[0];
    let meilleureValeurHorizon = -9999;

    for (let k = 0; k < largeurFaisceau; k++) {
      const plan = plansCandidats[k];
      let sommeValeurs = 0;

      // Évaluer sur 2 scénarios de dés alliés (dont 1 déterminisation Bayésienne)
      for (let s = 0; s < 2; s++) {
        const lancersScen = etat.lancersSecretsDuTour.map((l, idxJ) => {
          if (idxJ === joueur || etat.lancersReveles) return l;
          const r1 = tirerDe6(rng + k * 19 + s * 37 + idxJ * 7);
          const r2 = tirerDe6(r1.nextState);
          rng = r2.nextState;
          return {
            joueurObservateur: idxJ,
            d1: r1.de,
            d2: r2.de,
            somme: r1.de + r2.de,
            ecart: Math.abs(r1.de - r2.de),
          };
        });

        const finTour1 = simulerFinDuTourAvecPlan(
          etat,
          joueur,
          plan,
          lancersScen
        );
        sommeValeurs += evaluerEtatHorizonMultiTours(finTour1);
      }

      const valeurMoyenne = sommeValeurs / 2;
      if (valeurMoyenne > meilleureValeurHorizon) {
        meilleureValeurHorizon = valeurMoyenne;
        meilleurPlan = plan;
      }
    }

    return {
      actions: meilleurPlan.map((a) => ({
        ...a,
        explicationBot: `Beam Rollout (K=${largeurFaisceau}) : valeur multi-tours V=${meilleureValeurHorizon.toFixed(1)} (${a.type}).`,
      })),
      nextRngState: rng,
    };
  }

  // 9. BOT IS-MCTS (INFORMATION SET MONTE CARLO TREE SEARCH AVEC SÉLECTION UCB1)
  const nbCandidats = Math.min(6, plansCandidats.length);
  const visites = new Array(nbCandidats).fill(0);
  const recompensesTotales = new Array(nbCandidats).fill(0);
  const nbIterationsMCTS = Math.max(12, nbCandidats * 2);
  const constanteExplorationC = 14.0;

  for (let iter = 0; iter < nbIterationsMCTS; iter++) {
    // 1. Sélection du bras (plan candidat) par formule UCB1
    let idxChoisi = 0;
    if (iter < nbCandidats) {
      idxChoisi = iter; // Explorer chaque candidat au moins 1 fois
    } else {
      let meilleurUCB = -999999;
      for (let i = 0; i < nbCandidats; i++) {
        const moyenne = recompensesTotales[i] / Math.max(1, visites[i]);
        const bonusExploration =
          constanteExplorationC *
          Math.sqrt(Math.log(iter + 1) / Math.max(1, visites[i]));
        const ucb = moyenne + bonusExploration;
        if (ucb > meilleurUCB) {
          meilleurUCB = ucb;
          idxChoisi = i;
        }
      }
    }

    // 2. Déterminisation de l'ensemble d'information (Information Set) :
    // Mon propre gobelet 2D6 reste fixe ; les gobelets cachés des autres joueurs sont échantillonnés
    // en privilégiant les tirages compatibles avec les poses déjà observées.
    const lancersDeterminises: LancerSecret2D6[] =
      etat.lancersSecretsDuTour.map((l, idxJ) => {
        if (idxJ === joueur || etat.lancersReveles) return l;

        const r1 = tirerDe6(rng);
        const r2 = tirerDe6(r1.nextState);
        rng = r2.nextState;

        // Si le joueur idxJ a déjà programmé un mouvement, vérifier si un second tirage est plus cohérent
        const progJ = etat.programmations[idxJ] || [];
        if (progJ.length > 0) {
          const destAllie = progJ.find((a) => a.type === 'deplacer')?.caseCible;
          if (destAllie !== undefined && destAllie !== null) {
            const som1 = r1.de + r2.de;
            const ec1 = Math.abs(r1.de - r2.de);
            const m1 = etat.machines.find(
              (m) => m.id === etat.pisteMachine[ec1]
            );
            const cib1 = m1
              ? calculerCibleMachine(etat, m1, etat.pisteTactique[som1], idxJ)
              : -1;
            if (cib1 !== destAllie) {
              const r3 = tirerDe6(rng);
              const r4 = tirerDe6(r3.nextState);
              rng = r4.nextState;
              return {
                joueurObservateur: idxJ,
                d1: r3.de,
                d2: r4.de,
                somme: r3.de + r4.de,
                ecart: Math.abs(r3.de - r4.de),
              };
            }
          }
        }

        return {
          joueurObservateur: idxJ,
          d1: r1.de,
          d2: r2.de,
          somme: r1.de + r2.de,
          ecart: Math.abs(r1.de - r2.de),
        };
      });

    // 3. Simulation (Rollout) et 4. Rétropropagation
    const etatFinTour = simulerFinDuTourAvecPlan(
      etat,
      joueur,
      plansCandidats[idxChoisi],
      lancersDeterminises
    );
    const recompense = evaluerEtatHorizonMultiTours(etatFinTour);
    visites[idxChoisi] += 1;
    recompensesTotales[idxChoisi] += recompense;
  }

  // Choisir le plan ayant la meilleure récompense moyenne (Robust / Max-Value child)
  let meilleurIdx = 0;
  let meilleureMoyenne = -999999;
  for (let i = 0; i < nbCandidats; i++) {
    const moy = recompensesTotales[i] / Math.max(1, visites[i]);
    if (moy > meilleureMoyenne) {
      meilleureMoyenne = moy;
      meilleurIdx = i;
    }
  }

  return {
    actions: plansCandidats[meilleurIdx].map((a) => ({
      ...a,
      explicationBot: `IS-MCTS (${nbIterationsMCTS} déterminisations UCB1, Q=${meilleureMoyenne.toFixed(1)}) : ${a.explicationBot || a.type}.`,
    })),
    nextRngState: rng,
  };
}

// Simule une partie complète de bout en bout avec les profils de Bots choisis
export function simulerPartieCompleteV01(
  variante: VariantV01,
  profilsParJoueur: BotProfileId[],
  graine = 20261019
): EtatJeuV01 {
  let etat = creerEtatInitialV01(variante, graine);
  let gardeFouIterations = 0;

  while (etat.sousPhase !== 'fin_de_partie' && gardeFouIterations < 200) {
    gardeFouIterations += 1;

    if (etat.sousPhase === 'programmation_1') {
      if (variante.modeProgrammation === 'alternee_1_par_1') {
        for (let j = 0; j < variante.nbJoueurs; j++) {
          const res = calculerProgrammationBot(
            etat,
            j,
            profilsParJoueur[j] || 'glouton',
            1
          );
          etat.programmations[j] = res.actions;
          etat.etatRng = res.nextRngState;
        }
        for (let j = 0; j < variante.nbJoueurs; j++) {
          const res = calculerProgrammationBot(
            etat,
            j,
            profilsParJoueur[j] || 'glouton',
            2
          );
          etat.programmations[j] = res.actions;
          etat.etatRng = res.nextRngState;
        }
      } else if (variante.modeProgrammation === '2e_apres_ciblage') {
        for (let j = 0; j < variante.nbJoueurs; j++) {
          const res = calculerProgrammationBot(
            etat,
            j,
            profilsParJoueur[j] || 'glouton',
            1
          );
          etat.programmations[j] = res.actions;
          etat.etatRng = res.nextRngState;
        }
      } else {
        for (let j = 0; j < variante.nbJoueurs; j++) {
          const res = calculerProgrammationBot(
            etat,
            j,
            profilsParJoueur[j] || 'glouton'
          );
          etat.programmations[j] = res.actions;
          etat.etatRng = res.nextRngState;
        }
      }
      etat.sousPhase = 'resolution_actions_1';
    } else if (etat.sousPhase === 'programmation_2') {
      for (let j = 0; j < variante.nbJoueurs; j++) {
        const res = calculerProgrammationBot(
          etat,
          j,
          profilsParJoueur[j] || 'glouton',
          2
        );
        etat.programmations[j] = res.actions;
        etat.etatRng = res.nextRngState;
      }
      etat.sousPhase = 'resolution_actions_2';
    } else {
      etat = avancerSousPhaseResolution(etat);
    }
  }

  return etat;
}
