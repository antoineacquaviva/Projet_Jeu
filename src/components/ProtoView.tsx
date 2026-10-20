import React, { useState, useEffect, useMemo } from 'react';
import {
  ActionDefenseurType,
  BotProfileId,
  EtatJeuV01,
  SousPhaseTour,
  VariantV01,
} from '../shared/types';
import {
  avancerSousPhaseResolution,
  calculerPourcentageForetSauvee,
  casesAccessiblesDefenseur,
  clonerEtatJeu,
  construireGuidePhysique,
  COULEURS_PEUPLES_V01,
  creerEtatInitialV01,
  formaterNomSiege,
  genererLivretPhysiqueVariante,
  NOMS_TACTIQUES,
} from '../shared/moteur';
import {
  calculerProgrammationBot,
  CATALOGUE_BOTS_V01,
  predireCibleDeMonLancerSecret,
} from '../shared/bots';
import { PhysicalBoardV01, TurnPhaseStepper } from './PhysicalBoardV01';

export type SiegeProtoType = 'humain' | BotProfileId;

interface ProtoViewProps {
  variante: VariantV01;
  etatInitialExterne?: EtatJeuV01 | null;
  onClearEtatExterne?: () => void;
}

const PROFILS_BOTS_DEFAUT_TABLE: SiegeProtoType[] = [
  'humain',
  'deductif',
  'expectimax_bayesien',
  'beam_rollout',
  'ismcts',
  'glouton',
];

function construireSiegesDefaut(
  nbJoueurs: number,
  precedents?: SiegeProtoType[]
): SiegeProtoType[] {
  return Array.from(
    { length: nbJoueurs },
    (_, i) => precedents?.[i] || PROFILS_BOTS_DEFAUT_TABLE[i] || 'deductif'
  );
}

function libelleActionResolution(sousPhase: SousPhaseTour, tourActuel: number, nbTours: number): {
  badge: string;
  consigne: string;
  bouton: string;
} {
  switch (sousPhase) {
    case 'resolution_actions_1':
      return {
        badge: 'ÉTAPE 3/6 — 1res ACTIONS DES DÉFENSEURS',
        consigne:
          'Toutes les cartes sont posées. Cliquez à droite pour déplacer les Défenseurs et activer les 1res actions (Action I) sur le plateau.',
        bouton: 'Exécuter les 1res Actions (Action I) →',
      };
    case 'resolution_ciblage_machines':
      return {
        badge: 'ÉTAPE 4/6 — RÉVÉLATION 2D6 & CIBLAGE MACHINES',
        consigne:
          'On soulève tous les gobelets 2D6 ! Les Machines se déplacent vers leurs cibles selon les pistes (sans couper d’arbre pour l’instant).',
        bouton: 'Révéler les 2D6 & Déplacer les Machines →',
      };
    case 'resolution_actions_2':
      return {
        badge: 'ÉTAPE 5/6 — 2es ACTIONS DES DÉFENSEURS',
        consigne:
          'Dernière ligne de défense avant la coupe : exécutez les cartes Action II (Boucliers 🛡️ et Sabotages ⚡).',
        bouton: 'Exécuter les 2es Actions (Action II) →',
      };
    case 'resolution_coupe_et_apprentissage':
      return {
        badge: 'ÉTAPE 6/6 — COUPE DES FORÊTS & APPRENTISSAGE',
        consigne:
          'Toute Machine non contrée abat 1 Forêt 🪓, puis le Méchant permute ses pistes vers 7 (Tactique) et 1 (Machine).',
        bouton: 'Résoudre la Coupe & l’Apprentissage →',
      };
    case 'bilan_tour':
      return {
        badge: `FIN DU TOUR ${tourActuel}/${nbTours}`,
        consigne:
          tourActuel >= nbTours
            ? 'Le dernier tour est terminé. Cliquez pour afficher le bilan final de la partie.'
            : `Le Tour ${tourActuel} est terminé. Cliquez pour distribuer les nouveaux dés secrets 2D6 du Tour ${tourActuel + 1}.`,
        bouton:
          tourActuel >= nbTours
            ? 'Voir le bilan de fin de partie →'
            : `Passer au Tour ${tourActuel + 1} →`,
      };
    case 'fin_de_partie':
      return {
        badge: 'PARTIE TERMINÉE — DÉCOMPTE DES FORÊTS',
        consigne:
          'La partie est terminée ! Consultez le pourcentage de forêt préservée ou lancez une nouvelle donne.',
        bouton: 'Nouvelle donne',
      };
    default:
      return {
        badge: 'EN COURS',
        consigne: 'Suivez les consignes ci-dessous.',
        bouton: 'Continuer →',
      };
  }
}

export const ProtoView: React.FC<ProtoViewProps> = ({
  variante,
  etatInitialExterne,
  onClearEtatExterne,
}) => {
  const [graine, setGraine] = useState<number>(20261019);
  const [sieges, setSieges] = useState<SiegeProtoType[]>(() =>
    construireSiegesDefaut(variante.nbJoueurs)
  );
  const [etat, setEtat] = useState<EtatJeuV01>(() =>
    etatInitialExterne
      ? clonerEtatJeu(etatInitialExterne)
      : creerEtatInitialV01(variante, 20261019)
  );
  const [modeBotsAuto, setModeBotsAuto] = useState<boolean>(true);
  const [gobeletSouleve, setGobeletSouleve] = useState<boolean>(true);
  const [pionSelectionneId, setPionSelectionneId] = useState<number | null>(0);
  const [etapeEdition, setEtapeEdition] = useState<1 | 2>(1);

  // Panneaux complémentaires optionnels (fermés par défaut pour simplifier l'interface)
  const [afficherReglageSieges, setAfficherReglageSieges] =
    useState<boolean>(false);
  const [afficherJournalComplet, setAfficherJournalComplet] =
    useState<boolean>(false);
  const [afficherLivretPhysique, setAfficherLivretPhysique] =
    useState<boolean>(false);

  // Synchroniser quand la variante change ou qu'un état externe arrive depuis Démo
  useEffect(() => {
    if (etatInitialExterne) {
      setEtat(clonerEtatJeu(etatInitialExterne));
      if (onClearEtatExterne) onClearEtatExterne();
      return;
    }
    setSieges((prev) => construireSiegesDefaut(variante.nbJoueurs, prev));
    const nouvelEtat = creerEtatInitialV01(variante, graine);
    setEtat(nouvelEtat);
    setPionSelectionneId(nouvelEtat.defenseurs[0]?.id ?? null);
    setEtapeEdition(1);
  }, [variante, graine, etatInitialExterne]);

  const joueurActif = etat.joueurActifProgrammation;
  const siegeActif = sieges[joueurActif] || 'humain';
  const infoSiegeActif = useMemo(
    () => formaterNomSiege(joueurActif, sieges),
    [joueurActif, sieges]
  );

  const enProgrammation =
    etat.sousPhase === 'programmation_1' ||
    etat.sousPhase === 'programmation_2';

  const pionsDuJoueurActif = useMemo(
    () => etat.defenseurs.filter((d) => d.joueur === joueurActif),
    [etat.defenseurs, joueurActif]
  );

  const pionCourant = useMemo(
    () =>
      pionsDuJoueurActif.find((d) => d.id === pionSelectionneId) ||
      pionsDuJoueurActif[0] ||
      null,
    [pionsDuJoueurActif, pionSelectionneId]
  );

  // Calculer la position simulée du pion à l'étape d'édition
  const caseDepartPourEtape = useMemo(() => {
    if (!pionCourant) return 0;
    if (etapeEdition === 1) return pionCourant.caseId;
    const progJ = etat.programmations[joueurActif] || [];
    const act1 = progJ.find(
      (a) => a.pionId === pionCourant.id && a.etape === 1
    );
    if (act1?.type === 'deplacer' && act1.caseCible !== null) {
      return act1.caseCible;
    }
    return pionCourant.caseId;
  }, [pionCourant, etapeEdition, etat.programmations, joueurActif]);

  const casesAccessiblesPion = useMemo(
    () => casesAccessiblesDefenseur(etat, caseDepartPourEtape),
    [etat, caseDepartPourEtape]
  );

  const predictionGobeletActif = useMemo(
    () => predireCibleDeMonLancerSecret(etat, joueurActif),
    [etat, joueurActif]
  );

  const livretPhysique = useMemo(
    () => genererLivretPhysiqueVariante(etat.variante),
    [etat.variante]
  );

  const recommencerPartie = (nouvelleGraine?: number) => {
    const g = nouvelleGraine ?? graine;
    setGraine(g);
    const neuf = creerEtatInitialV01(variante, g);
    setEtat(neuf);
    setPionSelectionneId(neuf.defenseurs[0]?.id ?? null);
    setEtapeEdition(1);
  };

  // Enregistrer une carte Action sur l'emplacement I ou II d'un Défenseur
  const definirActionPion = (
    pionId: number,
    etape: 1 | 2,
    type: ActionDefenseurType,
    caseCible: number | null = null
  ) => {
    setEtat((prev) => {
      const next = clonerEtatJeu(prev);
      const listeActuelle = (next.programmations[joueurActif] || []).filter(
        (a) => !(a.pionId === pionId && a.etape === etape)
      );

      let destination = caseCible;
      if (type === 'deplacer' && destination === null) {
        const pion = next.defenseurs.find((d) => d.id === pionId);
        const dep = pion ? casesAccessiblesDefenseur(next, pion.caseId) : [];
        destination = dep.find((c) => c !== pion?.caseId) ?? pion?.caseId ?? 0;
      }

      listeActuelle.push({
        pionId,
        etape,
        type,
        caseCible: type === 'deplacer' ? destination : null,
        machineCible: null,
      });

      next.programmations[joueurActif] = listeActuelle;
      return next;
    });
  };

  // Quand on clique sur une tuile du plateau SVG en phase de programmation
  const handleSelectCasePlateau = (caseId: number) => {
    if (!enProgrammation || !pionCourant) return;
    const etapeCible: 1 | 2 =
      etat.sousPhase === 'programmation_2' ? 2 : etapeEdition;

    if (caseId === caseDepartPourEtape) {
      definirActionPion(pionCourant.id, etapeCible, 'proteger', null);
    } else if (casesAccessiblesPion.includes(caseId)) {
      definirActionPion(pionCourant.id, etapeCible, 'deplacer', caseId);
    }
  };

  // Valider la programmation du joueur actif (ou faire jouer le Bot du siège actif)
  const validerTourDeTableJoueurActif = (utiliserBotPourHumain?: BotProfileId) => {
    setEtat((prev) => {
      const next = clonerEtatJeu(prev);
      const j = next.joueurActifProgrammation;
      const profilBot: BotProfileId | null =
        utiliserBotPourHumain ||
        (sieges[j] !== 'humain' ? (sieges[j] as BotProfileId) : null);

      const modeProg = next.variante.modeProgrammation;
      const etapeForc =
        next.sousPhase === 'programmation_2'
          ? 2
          : modeProg === '2e_apres_ciblage' || modeProg === 'un_seul_ordre'
          ? 1
          : undefined;

      if (profilBot) {
        const res = calculerProgrammationBot(next, j, profilBot, etapeForc);
        next.programmations[j] = res.actions;
        next.etatRng = res.nextRngState;
      } else {
        const etapesRequises: (1 | 2)[] = etapeForc ? [etapeForc] : [1, 2];
        const existantes = next.programmations[j] || [];
        for (const p of next.defenseurs.filter((d) => d.joueur === j)) {
          for (const et of etapesRequises) {
            if (!existantes.some((a) => a.pionId === p.id && a.etape === et)) {
              existantes.push({
                pionId: p.id,
                etape: et,
                type: 'proteger',
                caseCible: null,
                machineCible: null,
              });
            }
          }
        }
        next.programmations[j] = existantes;
      }

      if (j + 1 < next.variante.nbJoueurs) {
        next.joueurActifProgrammation = j + 1;
        const premierPionSuivant = next.defenseurs.find(
          (d) => d.joueur === j + 1
        );
        if (premierPionSuivant) {
          setPionSelectionneId(premierPionSuivant.id);
        }
      } else {
        next.joueurActifProgrammation = 0;
        const monPremierPion = next.defenseurs.find((d) => d.joueur === 0);
        if (monPremierPion) {
          setPionSelectionneId(monPremierPion.id);
        }
        if (next.sousPhase === 'programmation_2') {
          next.sousPhase = 'resolution_actions_2';
        } else {
          next.sousPhase = 'resolution_actions_1';
        }
      }

      next.guidePhysiqueActuel = construireGuidePhysique(
        next.sousPhase,
        next.variante,
        next.joueurActifProgrammation,
        next.tourActuel
      );
      return next;
    });
  };

  // Avancement automatique des Bots alliés lorsque modeBotsAuto est actif
  useEffect(() => {
    if (!enProgrammation || !modeBotsAuto) return;
    if (siegeActif === 'humain') return;

    const timer = setTimeout(() => {
      validerTourDeTableJoueurActif();
    }, 380);

    return () => clearTimeout(timer);
  }, [
    enProgrammation,
    modeBotsAuto,
    siegeActif,
    joueurActif,
    etat.sousPhase,
    etat.tourActuel,
  ]);

  const lancerDuJoueurActif = etat.lancersSecretsDuTour[joueurActif];
  const scoreSauvePct = calculerPourcentageForetSauvee(etat);
  const infoRes = libelleActionResolution(
    etat.sousPhase,
    etat.tourActuel,
    variante.nbTours
  );

  return (
    <div className="space-y-4">
      {/* 1. BARRE SUPÉRIEURE COMPACTE : Essentiel + Interrupteur Bots Auto/Pas-à-pas + Boutons des tiroirs optionnels */}
      <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#16211B]">
              Proto — « {variante.nom} »
            </h2>
            <p className="text-xs text-[#55645B]">
              Forêt préservée :{' '}
              <strong className="font-mono-tabular text-[#256B45]">
                {scoreSauvePct} %
              </strong>{' '}
              · {variante.nbJoueurs} sièges (
              {sieges
                .map((_, idx) => formaterNomSiege(idx, sieges).nomCourt)
                .join(', ')}
              )
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interrupteur Auto / Pas-à-pas pour les Bots alliés */}
          <div className="flex items-center bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5] text-xs">
            <span className="px-2 font-semibold text-[#55645B]">
              Tour des Bots :
            </span>
            <button
              type="button"
              onClick={() => setModeBotsAuto(true)}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                modeBotsAuto
                  ? 'bg-[#256B45] text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              ⚡ Auto (focus sur Moi)
            </button>
            <button
              type="button"
              onClick={() => setModeBotsAuto(false)}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                !modeBotsAuto
                  ? 'bg-indigo-700 text-white'
                  : 'text-[#16211B] hover:bg-white'
              }`}
            >
              👣 Pas-à-pas
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAfficherReglageSieges((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              afficherReglageSieges
                ? 'bg-[#1E3528] text-white border-[#1E3528]'
                : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
            }`}
          >
            ⚙️ Sièges & Bots {afficherReglageSieges ? '▲' : '▼'}
          </button>

          <button
            type="button"
            onClick={() => setAfficherJournalComplet((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              afficherJournalComplet
                ? 'bg-[#1E3528] text-white border-[#1E3528]'
                : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
            }`}
          >
            📜 Journal ({etat.journal.length}) {afficherJournalComplet ? '▲' : '▼'}
          </button>

          <button
            type="button"
            onClick={() => setAfficherLivretPhysique((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              afficherLivretPhysique
                ? 'bg-[#1E3528] text-white border-[#1E3528]'
                : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
            }`}
          >
            📖 Règles {afficherLivretPhysique ? '▲' : '▼'}
          </button>

          <button
            type="button"
            onClick={() => recommencerPartie(graine + 1)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap"
          >
            ↻ Nouvelle donne
          </button>
        </div>
      </div>

      {/* TIROIR OPTIONNEL 1 : Réglage des sièges autour de la table */}
      {afficherReglageSieges && (
        <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#16211B]">
            Attribution des {variante.nbJoueurs} sièges autour de la table (Moi + Bots alliés) :
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sieges.map((sType, idx) => {
              const info = formaterNomSiege(idx, sieges);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                    enProgrammation && joueurActif === idx
                      ? 'bg-emerald-50 border-[#256B45] ring-1 ring-[#256B45]'
                      : 'bg-[#F4F5F0] border-[#D8DFD5]'
                  }`}
                >
                  <span
                    style={{
                      backgroundColor:
                        COULEURS_PEUPLES_V01[idx % COULEURS_PEUPLES_V01.length],
                    }}
                    className="w-2.5 h-2.5 rounded-full inline-block"
                  />
                  <span className="font-bold text-[#16211B]">
                    {info.nomCourt} :
                  </span>
                  <select
                    value={sType}
                    onChange={(e) => {
                      const val = e.target.value as SiegeProtoType;
                      setSieges((prev) =>
                        prev.map((old, i) => (i === idx ? val : old))
                      );
                    }}
                    className="bg-white border border-[#D8DFD5] rounded px-1.5 py-0.5 text-xs font-medium text-[#16211B]"
                  >
                    <option value="humain">Moi (Humain)</option>
                    {CATALOGUE_BOTS_V01.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nom.split(' (')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FRISE VISUELLE DES 6 ÉTAPES DU TOUR */}
      <TurnPhaseStepper
        sousPhase={etat.sousPhase}
        tourActuel={etat.tourActuel}
        nbTours={variante.nbTours}
        nomJoueurActif={infoSiegeActif.nomCourt}
        estTourHumain={infoSiegeActif.estHumain}
      />

      {/* 3. BANDEAU D'ACTION CONTEXTUEL : "QUI JOUE & QUE FAIRE MAINTENANT" */}
      {enProgrammation ? (
        infoSiegeActif.estHumain ? (
          <div className="bg-[#256B45] text-white rounded-xl p-4 border-2 border-[#16211B] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-white text-[#165B36] text-xs font-extrabold uppercase tracking-wide">
                  🟢 À VOUS DE JOUER ({infoSiegeActif.nomCourt.toUpperCase()})
                </span>
                <span className="text-xs font-mono-tabular text-emerald-100">
                  {etat.sousPhase === 'programmation_2'
                    ? 'Programmation de la 2e Action (Action II)'
                    : 'Programmation de vos Défenseurs'}
                </span>
              </div>
              <p className="text-sm font-medium text-white leading-snug">
                1) Consultez votre gobelet 2D6 ci-dessous · 2) Choisissez les cartes Action pour{' '}
                <strong>MOI #1</strong> et <strong>MOI #2</strong> (ou cliquez sur une zone verte du plateau) · 3) Validez votre tour.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => validerTourDeTableJoueurActif('deductif')}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800/90 border border-emerald-400/50 text-emerald-100 hover:bg-emerald-900 transition-colors whitespace-nowrap"
              >
                🤖 Aide : Faire programmer par Bot Déd.
              </button>
              <button
                type="button"
                onClick={() => validerTourDeTableJoueurActif()}
                className="px-5 py-2 text-xs font-extrabold rounded-lg bg-amber-400 text-[#16211B] hover:bg-amber-300 shadow-xs transition-colors whitespace-nowrap"
              >
                Valider mes actions ({infoSiegeActif.nomCourt}) →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-950 text-white rounded-xl p-4 border-2 border-indigo-400 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-300 text-indigo-950 text-xs font-extrabold uppercase">
                  🤖 TOUR DU BOT ALLIÉ : {infoSiegeActif.nomCourt}
                </span>
                <span className="text-xs text-indigo-200 font-mono-tabular">
                  Siège {joueurActif + 1}/{variante.nbJoueurs}
                </span>
              </div>
              <p className="text-sm text-indigo-100">
                {modeBotsAuto
                  ? `${infoSiegeActif.nomCourt} analyse les pistes et pose ses cartes automatiquement...`
                  : `Mode Pas-à-pas actif : cliquez à droite pour faire jouer ${infoSiegeActif.nomCourt} et observer ses flèches sur le plateau.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => validerTourDeTableJoueurActif()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-400 text-indigo-950 hover:bg-indigo-300 transition-colors whitespace-nowrap"
              >
                Faire jouer {infoSiegeActif.nomCourt} maintenant →
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-[#1E3528] text-white rounded-xl p-4 border-2 border-amber-400 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-400 text-[#16211B] text-xs font-extrabold uppercase">
                ⚙️ {infoRes.badge}
              </span>
            </div>
            <p className="text-sm text-emerald-50 font-medium">
              {infoRes.consigne}
            </p>
          </div>

          <div className="shrink-0">
            {etat.sousPhase !== 'fin_de_partie' ? (
              <button
                type="button"
                onClick={() =>
                  setEtat((prev) => avancerSousPhaseResolution(prev))
                }
                className="px-5 py-2.5 text-xs font-extrabold rounded-lg bg-amber-400 text-[#16211B] hover:bg-amber-300 shadow-xs transition-colors whitespace-nowrap"
              >
                {infoRes.bouton}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => recommencerPartie(graine + 1)}
                className="px-5 py-2.5 text-xs font-extrabold rounded-lg bg-emerald-400 text-[#16211B] hover:bg-emerald-300 transition-colors whitespace-nowrap"
              >
                ↻ Rejouer une partie
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. PLATEAU DE JEU INTERACTIF + PISTE DU MÉCHANT */}
      <PhysicalBoardV01
        etat={etat}
        sieges={sieges}
        caseSelectionneeId={enProgrammation ? caseDepartPourEtape : null}
        casesSurligneesIds={enProgrammation ? casesAccessiblesPion : []}
        pionSelectionneId={enProgrammation ? pionCourant?.id ?? null : null}
        onSelectCase={handleSelectCasePlateau}
        onSelectPion={(pid) => {
          const p = etat.defenseurs.find((d) => d.id === pid);
          if (p && p.joueur === joueurActif) {
            setPionSelectionneId(pid);
          }
        }}
        surlignerSommePiste={
          enProgrammation && gobeletSouleve
            ? lancerDuJoueurActif?.somme ?? null
            : null
        }
        surlignerEcartPiste={
          enProgrammation && gobeletSouleve
            ? lancerDuJoueurActif?.ecart ?? null
            : null
        }
      />

      {/* 5. POSTE DE COMMANDE COMPACT : MON GOBELET 2D6 & MES CARTES D'ACTION (OU BILAN DE RÉSOLUTION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Colonne Gauche (8 cols) : Contrôles directs de programmation de MOI (ou du siège actif) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-4 border border-[#D8DFD5]">
          {enProgrammation ? (
            <div className="space-y-3.5">
              {/* Gobelet 2D6 secret du siège actif */}
              {lancerDuJoueurActif && (
                <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#16211B]">
                        🎲 Gobelet 2D6 secret de {infoSiegeActif.nomCourt} :
                      </span>
                      {gobeletSouleve && (
                        <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D8DFD5] text-[#16211B]">
                          Dés [{lancerDuJoueurActif.d1}] & [{lancerDuJoueurActif.d2}] → Somme{' '}
                          <span className="text-[#991B1B]">
                            {lancerDuJoueurActif.somme}
                          </span>{' '}
                          · Écart{' '}
                          <span className="text-[#92400E]">
                            {lancerDuJoueurActif.ecart}
                          </span>
                        </span>
                      )}
                    </div>
                    {gobeletSouleve && predictionGobeletActif ? (
                      <div className="text-xs text-[#16211B] mt-1">
                        Menace annoncée par ce gobelet :{' '}
                        <strong className="text-[#92400E]">
                          Machine M{predictionGobeletActif.machineId}
                        </strong>{' '}
                        ({predictionGobeletActif.tactique}) va cibler{' '}
                        <strong className="text-[#C2412D] underline">
                          {etat.cases[predictionGobeletActif.caseCible]?.nom}
                        </strong>
                        .
                      </div>
                    ) : (
                      <div className="text-xs text-[#55645B] italic mt-0.5">
                        Gobelet masqué.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGobeletSouleve((v) => !v)}
                    className="px-2.5 py-1 text-xs font-semibold rounded border border-[#D8DFD5] bg-white text-[#16211B] shrink-0"
                  >
                    {gobeletSouleve ? 'Cacher 2D6' : 'Voir 2D6'}
                  </button>
                </div>
              )}

              {/* Cartes Action des Défenseurs du siège actif */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pionsDuJoueurActif.map((pion) => {
                  const progJ = etat.programmations[joueurActif] || [];
                  const act1 = progJ.find(
                    (a) => a.pionId === pion.id && a.etape === 1
                  );
                  const act2 = progJ.find(
                    (a) => a.pionId === pion.id && a.etape === 2
                  );
                  const estPionSelectionne = pionCourant?.id === pion.id;
                  const codePion = infoSiegeActif.estHumain
                    ? `MOI #${pion.numeroPion}`
                    : `${infoSiegeActif.codePion} #${pion.numeroPion}`;

                  const etapesAffichees: (1 | 2)[] =
                    etat.sousPhase === 'programmation_2'
                      ? [2]
                      : variante.modeProgrammation === '2e_apres_ciblage' ||
                        variante.modeProgrammation === 'un_seul_ordre'
                      ? [1]
                      : [1, 2];

                  return (
                    <div
                      key={pion.id}
                      onClick={() => setPionSelectionneId(pion.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        estPionSelectionne
                          ? 'bg-emerald-50/50 border-2 border-[#256B45]'
                          : 'bg-[#F4F5F0]/70 border-[#D8DFD5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{
                              backgroundColor:
                                COULEURS_PEUPLES_V01[
                                  joueurActif % COULEURS_PEUPLES_V01.length
                                ],
                            }}
                            className="px-2 py-0.5 rounded text-white font-mono-tabular text-xs font-bold"
                          >
                            {codePion}
                          </span>
                          <span className="text-xs font-semibold text-[#16211B]">
                            sur{' '}
                            <strong className="text-[#256B45]">
                              {etat.cases[pion.caseId]?.nom}
                            </strong>
                          </span>
                        </div>
                        {estPionSelectionne && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            Actif sur plateau
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {etapesAffichees.map((numEtape) => {
                          const actCourante = numEtape === 1 ? act1 : act2;
                          const typeActuel = actCourante?.type || 'proteger';
                          const caseDep =
                            numEtape === 2 &&
                            act1?.type === 'deplacer' &&
                            act1.caseCible !== null
                              ? act1.caseCible
                              : pion.caseId;
                          const voisines = casesAccessiblesDefenseur(
                            etat,
                            caseDep
                          ).filter((cid) => cid !== caseDep);

                          return (
                            <div
                              key={numEtape}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPionSelectionneId(pion.id);
                                setEtapeEdition(numEtape);
                              }}
                              className={`p-2 rounded-lg bg-white border ${
                                estPionSelectionne && etapeEdition === numEtape
                                  ? 'border-[#16211B] ring-1 ring-[#16211B]'
                                  : 'border-[#D8DFD5]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono-tabular font-bold text-[#55645B] mb-1.5">
                                <span>ACTION {numEtape === 1 ? 'I' : 'II'}</span>
                                <span className="text-[#16211B]">
                                  Départ : {etat.cases[caseDep]?.nom}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {(
                                  [
                                    { id: 'deplacer', label: '➔ Déplacer' },
                                    { id: 'proteger', label: '🛡️ Protéger' },
                                    { id: 'saboter', label: '⚡ Saboter' },
                                    ...(variante.actionReplanterActive
                                      ? [{ id: 'replanter', label: '🌱 Replanter' }]
                                      : []),
                                  ] as {
                                    id: ActionDefenseurType;
                                    label: string;
                                  }[]
                                ).map((btn) => (
                                  <button
                                    key={btn.id}
                                    type="button"
                                    onClick={() =>
                                      definirActionPion(
                                        pion.id,
                                        numEtape,
                                        btn.id,
                                        btn.id === 'deplacer'
                                          ? voisines[0] ?? caseDep
                                          : null
                                      )
                                    }
                                    className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors whitespace-nowrap ${
                                      typeActuel === btn.id
                                        ? 'bg-[#256B45] text-white border-[#256B45]'
                                        : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5]'
                                    }`}
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>

                              {typeActuel === 'deplacer' && (
                                <div className="flex items-center gap-1.5 text-xs mt-2 pt-1.5 border-t border-[#D8DFD5]">
                                  <span className="text-[#55645B] font-medium">
                                    Destination :
                                  </span>
                                  <select
                                    value={
                                      actCourante?.caseCible ?? voisines[0] ?? 0
                                    }
                                    onChange={(e) =>
                                      definirActionPion(
                                        pion.id,
                                        numEtape,
                                        'deplacer',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="bg-[#F4F5F0] border border-[#D8DFD5] rounded px-2 py-0.5 text-xs font-bold text-[#16211B]"
                                  >
                                    {voisines.map((cid) => (
                                      <option key={cid} value={cid}>
                                        {etat.cases[cid]?.nom}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#55645B]">
                Récapitulatif des actions programmées autour de la table (Tour {etat.tourActuel}) :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: variante.nbJoueurs }, (_, j) => {
                  const acts = etat.programmations[j] || [];
                  const info = formaterNomSiege(j, sieges);
                  return (
                    <div
                      key={j}
                      className={`p-2.5 rounded-lg border text-xs ${
                        info.estHumain
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-[#F4F5F0] border-[#D8DFD5]'
                      }`}
                    >
                      <div className="font-bold text-[#16211B] mb-1 flex items-center justify-between">
                        <span>{info.nomCourt}</span>
                        <span className="font-mono-tabular text-[11px] text-[#55645B]">
                          {etat.lancersReveles
                            ? `2D6 [${etat.lancersSecretsDuTour[j]?.d1},${etat.lancersSecretsDuTour[j]?.d2}] (S:${etat.lancersSecretsDuTour[j]?.somme} É:${etat.lancersSecretsDuTour[j]?.ecart})`
                            : 'Dés secrets'}
                        </span>
                      </div>
                      <ul className="space-y-0.5 text-[#55645B]">
                        {acts.map((a, idx) => {
                          const pion = etat.defenseurs.find(
                            (d) => d.id === a.pionId
                          );
                          return (
                            <li key={idx}>
                              • #{pion?.numeroPion} (Act. {a.etape === 1 ? 'I' : 'II'}) :{' '}
                              <strong className="text-[#16211B]">
                                {a.type}
                              </strong>
                              {a.caseCible !== null
                                ? ` → ${etat.cases[a.caseCible]?.nom}`
                                : ''}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite (4 cols) : Poses observées autour de la table (Déduction) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-[#16211B] mb-1">
              État des Sièges Autour de la Table
            </h3>
            <p className="text-xs text-[#55645B] mb-2.5">
              Suivez qui a déjà programmé ses Défenseurs ce tour
            </p>

            <div className="space-y-2">
              {Array.from({ length: variante.nbJoueurs }, (_, j) => {
                const info = formaterNomSiege(j, sieges);
                const acts = etat.programmations[j] || [];
                const estActif = enProgrammation && joueurActif === j;
                const aJoue =
                  !enProgrammation || j < joueurActif || acts.length > 0;

                return (
                  <div
                    key={j}
                    className={`p-2.5 rounded-lg border text-xs ${
                      estActif
                        ? 'bg-emerald-50 border-[#256B45] ring-1 ring-[#256B45]'
                        : 'bg-[#F4F5F0] border-[#D8DFD5]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#16211B]">
                        <span
                          style={{
                            backgroundColor:
                              COULEURS_PEUPLES_V01[
                                j % COULEURS_PEUPLES_V01.length
                              ],
                          }}
                          className="w-2.5 h-2.5 rounded-full inline-block"
                        />
                        <span>{info.nomCourt}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          estActif
                            ? 'bg-[#256B45] text-white'
                            : aJoue
                            ? 'bg-stone-200 text-[#16211B]'
                            : 'bg-stone-100 text-[#55645B]'
                        }`}
                      >
                        {estActif
                          ? 'Joue maintenant'
                          : aJoue
                          ? 'Cartes posées ✓'
                          : 'En attente'}
                      </span>
                    </div>

                    {acts.length > 0 && (
                      <div className="mt-1 text-[11px] text-[#55645B]">
                        {acts
                          .map((a) => {
                            const p = etat.defenseurs.find(
                              (d) => d.id === a.pionId
                            );
                            return `#${p?.numeroPion} (${
                              a.etape === 1 ? 'I' : 'II'
                            }): ${a.type}${
                              a.caseCible !== null
                                ? ` → ${etat.cases[a.caseCible]?.nom}`
                                : ''
                            }`;
                          })
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TIROIR OPTIONNEL 2 : Journal complet & Gestes physiques */}
      {afficherJournalComplet && (
        <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8DFD5] pb-2">
            <h3 className="font-display text-sm font-bold text-[#16211B]">
              📜 Journal complet de la partie & Gestes sur table physique
            </h3>
            <button
              type="button"
              onClick={() => setAfficherJournalComplet(false)}
              className="text-xs font-semibold text-[#55645B] hover:text-[#16211B]"
            >
              Fermer ✕
            </button>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {etat.journal
              .slice()
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs"
                >
                  <div className="font-medium text-[#16211B]">
                    {entry.message.replace(/J(\d+)/g, (_m, numStr) => {
                      const idx = Number(numStr) - 1;
                      return formaterNomSiege(idx, sieges).nomCourt;
                    })}
                  </div>
                  <div className="text-[11px] text-[#55645B] mt-0.5">
                    Geste sur table : {entry.gestePhysique}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TIROIR OPTIONNEL 3 : Livret de règles physiques */}
      {afficherLivretPhysique && (
        <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
          <div className="border-b border-[#D8DFD5] pb-2.5 mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-[#16211B]">
                📖 Livret de Règles Physiques — Variante « {variante.nom} »
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAfficherLivretPhysique(false)}
              className="text-xs font-semibold text-[#55645B] hover:text-[#16211B]"
            >
              Fermer ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {livretPhysique.map((sec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]"
              >
                <h4 className="font-display text-xs font-bold text-[#16211B] mb-1">
                  {sec.section}
                </h4>
                <div className="text-[11px] text-[#256B45] font-medium mb-1.5">
                  Matériel : {sec.materielConcerne}
                </div>
                <p className="text-xs text-[#16211B] whitespace-pre-line leading-relaxed">
                  {sec.texteRegle}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
