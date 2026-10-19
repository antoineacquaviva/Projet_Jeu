import {
  ActionDefenseurType,
  ActionProgrammee,
  BotProfileId,
  BotProfileSpec,
  EtatJeuV01,
  PionDefenseur,
  VariantV01,
} from './types';
import {
  avancerSousPhaseResolution,
  calculerCibleMachine,
  casesAccessiblesDefenseur,
  clonerEtatJeu,
  creerEtatInitialV01,
  NOMS_TACTIQUES,
  nextRng,
  PROBA_ECART_2D6,
  PROBA_SOMME_2D6,
} from './moteur';

export const CATALOGUE_BOTS_V01: BotProfileSpec[] = [
  {
    id: 'inerte',
    nom: 'Bot Inerte (Plancher)',
    roleDansTests: 'Mesure le plancher de survie sans aucune action des joueurs.',
    description:
      'Les Défenseurs restent immobiles sur leur tuile de départ sans protéger ni saboter.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'hasard',
    nom: 'Bot Hasard (Bruité)',
    roleDansTests: 'Vérifie qu’agir au hasard fait mieux qu’être inerte mais moins bien qu’un jeu pensé.',
    description:
      'Choisit uniformément parmi les actions légales (Se déplacer, Protéger, Saboter, Replanter) sans lire les pistes.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'boucle',
    nom: 'Bot Boucle Fixe (Garde-fou)',
    roleDansTests: 'Détecte les failles de règles où une routine aveugle suffit à gagner sans lire le jeu.',
    description:
      'Applique une routine mécanique invariable (Protéger ou Replanter sur place en boucle) sans jamais regarder ni les dés ni les Machines.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'reflexe',
    nom: 'Bot Réflexe (Tape-taupe)',
    roleDansTests: 'Mesure le score d’un joueur qui réagit aux Machines déjà posées sans lire les pistes 2D6.',
    description:
      'Se dirige vers les Machines déjà visibles sur le plateau pour protéger ou saboter, en ignorant les pistes et son gobelet 2D6.',
    utiliseTirageSecret: false,
    utiliseDeductionAllies: false,
  },
  {
    id: 'glouton',
    nom: 'Bot Glouton (Pistes + Dés personnels)',
    roleDansTests: 'Évalue le gain procuré par la lecture des deux pistes publiques et de son propre gobelet 2D6.',
    description:
      'Lit son lancer secret 2D6 sur la Piste Tactique (2–12) et la Piste Machine (0–5), anticipe la case cible exacte de sa Machine et programme ses 2 actions pour la contrer.',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: false,
  },
  {
    id: 'deductif',
    nom: 'Bot Déductif & Coordonné (Référence Forte)',
    roleDansTests: 'Mesure la profondeur maximale : lecture des pistes, déduction des dés alliés par leurs poses successives et alliances.',
    description:
      'Combine son tirage secret 2D6, l’espérance mathématique des pistes publiques et la déduction des actions déjà posées tour à tour par les coéquipiers (évite les doublons et forme les alliances requises).',
    utiliseTirageSecret: true,
    utiliseDeductionAllies: true,
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
      menaces[cible] += pSomme * pEcart;
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
} {
  const casesDejaCouvertes = new Set<number>();
  const casesAttendantAlliance = new Set<number>();
  const destinationsAllies = new Map<number, number>();

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
  };
}

// Choisit un pas de déplacement vers une case cible
function choisirPasVersCible(
  etat: EtatJeuV01,
  caseDepart: number,
  caseObjectif: number
): number {
  if (caseDepart === caseObjectif) return caseDepart;
  const accessibles = casesAccessiblesDefenseur(etat, caseDepart);
  if (accessibles.includes(caseObjectif)) return caseObjectif;

  // Sinon chercher un voisin qui est voisin de caseObjectif
  const cObj = etat.cases[caseObjectif];
  if (cObj) {
    for (const acc of accessibles) {
      if (cObj.voisins.includes(acc)) {
        return acc;
      }
    }
  }
  return accessibles[1] ?? caseDepart;
}

// Décide des actions programmées pour un joueur selon son profil de Bot
export function calculerProgrammationBot(
  etat: EtatJeuV01,
  joueur: number,
  profil: BotProfileId,
  etapeUniquement?: 1 | 2
): { actions: ActionProgrammee[]; nextRngState: number } {
  let rng = etat.etatRng + joueur * 97 + etat.tourActuel * 31;
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

  // Garder trace des cases déjà prises en charge par les propres pions de ce joueur
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
      // 1. BOT INERTE
      if (profil === 'inerte') {
        nouvellesActions.push({
          pionId: pion.id,
          etape,
          type: 'attendre',
          caseCible: null,
          machineCible: null,
          explicationBot: 'Inerte : reste immobile sans agir.',
        });
        continue;
      }

      // 2. BOT BOUCLE FIXE (Garde-fou : fait toujours la même routine sur place)
      if (profil === 'boucle') {
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

      // 3. BOT HASARD
      if (profil === 'hasard') {
        const r = nextRng(rng);
        rng = r.nextState;
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

      // 4. BOT RÉFLEXE (ne regarde que les Machines actuellement posées sur le plateau)
      if (profil === 'reflexe') {
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
          // Cherche une case voisine contenant une Machine
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

      // Évaluer l'intérêt de chaque case du plateau comme destination/cible pour ce pion
      const evaluerCaseObjectif = (cid: number): number => {
        let score = 0;
        const foretsRestantes = etat.forets[cid] || 0;
        if (foretsRestantes === 0) return -10;

        // Menace issue de mon propre lancer 2D6 secret
        if (maPrediction && maPrediction.caseCible === cid) {
          score += 5.0;
        }

        // Menace probabiliste des deux pistes publiques
        score += menacesPistes[cid] * 3.5;

        // Machines déjà présentes ou ayant déclaré cette cible (si ciblage déjà révélé)
        const nbMachinesPresentes = etat.machines.filter(
          (m) =>
            (m.caseId === cid || m.cibleDeclaree === cid) &&
            !m.neutraliseeCeTour
        ).length;
        score += nbMachinesPresentes * 2.2;

        // Valeur stratégique du Cœur
        if (cid === 0) score += 0.6;

        // Si Déductif : ajuste selon les actions posées par les alliés précédents
        if (estDeductif) {
          if (analyseAllies.casesAttendantAlliance.has(cid)) {
            // Un allié y va mais a besoin d'un 2e Défenseur pour l'alliance ! Priorité maximale
            score += 6.5;
          } else if (analyseAllies.casesDejaCouvertes.has(cid)) {
            // Déjà protégée/couverte par un allié : éviter le doublon
            score -= 4.5;
          }
        }

        // Éviter que mes 2 propres pions fassent doublon (sauf si alliance requise)
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
        // À l'étape 1 : faut-il se déplacer vers une case très menacée, ou agir immédiatement sur place ?
        let meilleureCase = caseSimulee;
        let meilleurScore = evaluerCaseObjectif(caseSimulee);

        // Considérer toutes les cases du plateau accessibles en 1 ou 2 pas
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
          // Déjà sur la meilleure case à l'étape 1
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
        // Étape 2 : Les Machines ont ciblé au milieu ! Il faut maintenant protéger ou saboter avant la coupe
        // Si le ciblage a déjà eu lieu (mode 2e_apres_ciblage), on regarde les vraies Machines présentes
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
            machineCible: machinesMenacantesIci[0]?.id ?? maPrediction?.machineId ?? null,
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
        // Tour de table pour l'étape 1, puis tour de table pour l'étape 2
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
        // Séquentiel (2 ordres ou 1 seul ordre)
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
