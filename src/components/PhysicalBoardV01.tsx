import React, { useState, useMemo } from 'react';
import {
  EtatJeuV01,
  GeometriePlateau,
  SousPhaseTour,
  TactiqueType,
} from '../shared/types';
import {
  caseEstProtegeeContreCoupe,
  COULEURS_PEUPLES_V01,
  formaterNomSiege,
  ORDRE_PISTE_MACHINE,
  PROBA_ECART_2D6,
  PROBA_SOMME_2D6,
} from '../shared/moteur';

export interface TurnPhaseStepperProps {
  sousPhase: SousPhaseTour;
  tourActuel: number;
  nbTours: number;
  indexEtapeForce?: number;
  onSelectEtape?: (index: number) => void;
  nomJoueurActif?: string;
  estTourHumain?: boolean;
}

export const ETAPES_TOUR_VISUELLES = [
  {
    numero: 1,
    code: 'observation_2d6',
    titreCourt: '1. Dés secrets',
    detail: '2D6 sous gobelet',
  },
  {
    numero: 2,
    code: 'programmation_1',
    titreCourt: '2. Programmation',
    detail: 'Pose des cartes I & II',
  },
  {
    numero: 3,
    code: 'resolution_actions_1',
    titreCourt: '3. 1res Actions',
    detail: 'Exécution Action I',
  },
  {
    numero: 4,
    code: 'resolution_ciblage_machines',
    titreCourt: '4. Ciblage Machines',
    detail: 'Révélation 2D6 & dépl.',
  },
  {
    numero: 5,
    code: 'resolution_actions_2',
    titreCourt: '5. 2es Actions',
    detail: 'Exécution Action II',
  },
  {
    numero: 6,
    code: 'resolution_coupe_et_apprentissage',
    titreCourt: '6. Coupe & Pistes',
    detail: 'Abattage & apprentissage',
  },
];

export function determinerIndexEtapeTour(sousPhase: SousPhaseTour): number {
  switch (sousPhase) {
    case 'observation_2d6':
      return 0;
    case 'programmation_1':
      return 1;
    case 'resolution_actions_1':
      return 2;
    case 'resolution_ciblage_machines':
      return 3;
    case 'programmation_2':
    case 'resolution_actions_2':
      return 4;
    case 'resolution_coupe_et_apprentissage':
    case 'bilan_tour':
    case 'fin_de_partie':
      return 5;
    default:
      return 1;
  }
}

export const TurnPhaseStepper: React.FC<TurnPhaseStepperProps> = ({
  sousPhase,
  tourActuel,
  nbTours,
  indexEtapeForce,
  onSelectEtape,
  nomJoueurActif,
  estTourHumain,
}) => {
  const indexActif =
    indexEtapeForce !== undefined
      ? indexEtapeForce
      : determinerIndexEtapeTour(sousPhase);

  return (
    <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#1E3528] text-white font-mono-tabular text-xs font-bold">
            TOUR {tourActuel} / {nbTours}
          </span>
          <span className="text-xs font-semibold text-[#16211B]">
            Progression dans le tour de jeu :
          </span>
          <span className="text-xs font-bold text-[#256B45]">
            Étape {indexActif + 1} sur 6 —{' '}
            {ETAPES_TOUR_VISUELLES[indexActif]?.titreCourt.replace(/^\d+\.\s*/, '')}
          </span>
        </div>

        {nomJoueurActif &&
          (sousPhase === 'programmation_1' || sousPhase === 'programmation_2') && (
            <div
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                estTourHumain
                  ? 'bg-emerald-100 text-[#165B36] border border-emerald-400'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  estTourHumain ? 'bg-emerald-600 animate-ping' : 'bg-indigo-600'
                }`}
              />
              <span>
                {estTourHumain
                  ? 'À VOUS DE JOUER (MOI)'
                  : `Tour allié : ${nomJoueurActif}`}
              </span>
            </div>
          )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ETAPES_TOUR_VISUELLES.map((etape, idx) => {
          const estCourante = idx === indexActif;
          const estPassee = idx < indexActif;
          const cliquable = Boolean(onSelectEtape);

          return (
            <button
              key={etape.code}
              type="button"
              disabled={!cliquable}
              onClick={() => onSelectEtape && onSelectEtape(idx)}
              className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${
                cliquable ? 'cursor-pointer' : 'cursor-default'
              } ${
                estCourante
                  ? 'bg-[#256B45] text-white border-[#16211B] ring-2 ring-[#256B45]/40 shadow-xs'
                  : estPassee
                  ? 'bg-emerald-50/70 text-[#1E3528] border-emerald-300'
                  : 'bg-[#F4F5F0] text-[#55645B] border-[#D8DFD5]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold leading-tight">
                  {etape.titreCourt}
                </span>
                <span
                  className={`text-[10px] font-mono-tabular font-bold px-1.5 py-0.2 rounded ${
                    estCourante
                      ? 'bg-white/20 text-white'
                      : estPassee
                      ? 'bg-emerald-200/80 text-[#165B36]'
                      : 'bg-stone-200 text-[#55645B]'
                  }`}
                >
                  {estCourante ? 'EN COURS' : estPassee ? '✓' : `${idx + 1}/6`}
                </span>
              </div>
              <div
                className={`text-[11px] mt-0.5 truncate ${
                  estCourante ? 'text-emerald-100' : 'text-[#55645B]'
                }`}
              >
                {etape.detail}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface PhysicalBoardV01Props {
  etat: EtatJeuV01;
  sieges?: string[];
  caseSelectionneeId?: number | null;
  casesSurligneesIds?: number[];
  pionSelectionneId?: number | null;
  onSelectCase?: (caseId: number) => void;
  onSelectPion?: (pionId: number) => void;
  surlignerSommePiste?: number | null;
  surlignerEcartPiste?: number | null;
}

const COULEUR_TACTIQUE: Record<
  TactiqueType,
  { bg: string; text: string; border: string }
> = {
  cupidite: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  percee: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  opportunisme: { bg: '#E0E7FF', text: '#1E40AF', border: '#6366F1' },
  represailles: { bg: '#F3E8FF', text: '#6B21A8', border: '#A855F7' },
};

function pointsHexagone(rayon: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = Math.round(rayon * Math.cos(angle) * 10) / 10;
    const py = Math.round(rayon * Math.sin(angle) * 10) / 10;
    pts.push(`${px},${py}`);
  }
  return pts.join(' ');
}

function titreGeometriePlateau(
  geometrie: GeometriePlateau | undefined,
  nbJoueurs: number,
  nbCases: number
): {
  titre: string;
  sousTitre: string;
} {
  switch (geometrie) {
    case 'double_plateau_34_56':
      return {
        titre:
          nbJoueurs <= 4
            ? `Plateau Double-Face — Face Recto 3–4J (${nbCases} zones)`
            : `Plateau Double-Face — Face Verso 5–6J (${nbCases} zones)`,
        sousTitre:
          nbJoueurs <= 4
            ? '1 Cœur + 4 Vallées croisées + 4 Lisières'
            : '1 Cœur + 6 Vallées + 6 Lisières',
      };
    case 'hex_couronne_19':
      return {
        titre: `Plateau Hexagonal Fixe (${nbCases} hexagones)`,
        sousTitre: '1 Cœur + 6 Couronne I + 12 Lisières',
      };
    case 'clairieres_sentiers':
      return {
        titre: `Réseau de Clairières & Sentiers (${nbCases} clairières)`,
        sousTitre: '1 Sanctuaire + 3 Cols de Vallée + 6 Lisières',
      };
    default:
      return {
        titre: `Plateau Modulable (${nbJoueurs} Secteurs + Cœur · ${nbCases} zones)`,
        sousTitre: 'Cliquez sur un pion ou sur une zone en surbrillance',
      };
  }
}

export const PhysicalBoardV01: React.FC<PhysicalBoardV01Props> = ({
  etat,
  sieges,
  caseSelectionneeId = null,
  casesSurligneesIds = [],
  pionSelectionneId = null,
  onSelectCase,
  onSelectPion,
  surlignerSommePiste = null,
  surlignerEcartPiste = null,
}) => {
  const [afficherRappelTactiques, setAfficherRappelTactiques] =
    useState<boolean>(false);
  const [afficherIntentionsProgrammees, setAfficherIntentionsProgrammees] =
    useState<boolean>(true);

  const machinesEnReserve = etat.machines.filter((m) => m.caseId === null);
  const geometrie: GeometriePlateau =
    etat.variante.geometriePlateau || 'modulaire_secteurs';
  const infoGeo = titreGeometriePlateau(
    geometrie,
    etat.variante.nbJoueurs,
    etat.cases.length
  );

  // Calculer les vecteurs de déplacements programmés et postures programmées pour la lisibilité sur le plateau
  const vecteursProgrammes = useMemo(() => {
    const fleches: {
      id: string;
      fromId: number;
      toId: number;
      etape: 1 | 2;
      couleur: string;
      label: string;
      estMoi: boolean;
    }[] = [];

    const badgesSurPlace: Record<
      number,
      { label: string; couleur: string; type: string }[]
    > = {};

    for (let j = 0; j < etat.variante.nbJoueurs; j++) {
      const acts = etat.programmations[j] || [];
      if (acts.length === 0) continue;
      const infoSiege = formaterNomSiege(j, sieges);
      const couleur =
        COULEURS_PEUPLES_V01[j % COULEURS_PEUPLES_V01.length];
      const pionsJ = etat.defenseurs.filter((d) => d.joueur === j);

      for (const pion of pionsJ) {
        let posCourante = pion.caseId;
        const act1 = acts.find((a) => a.pionId === pion.id && a.etape === 1);
        const act2 = acts.find((a) => a.pionId === pion.id && a.etape === 2);

        // Si on est encore avant la résolution de l'Action I
        const montrerEtape1 =
          etat.sousPhase === 'programmation_1' ||
          etat.sousPhase === 'resolution_actions_1';
        const montrerEtape2 =
          montrerEtape1 ||
          etat.sousPhase === 'programmation_2' ||
          etat.sousPhase === 'resolution_actions_2';

        if (act1 && montrerEtape1) {
          if (
            act1.type === 'deplacer' &&
            act1.caseCible !== null &&
            act1.caseCible !== posCourante
          ) {
            fleches.push({
              id: `f1-${pion.id}`,
              fromId: posCourante,
              toId: act1.caseCible,
              etape: 1,
              couleur,
              label: `${infoSiege.codePion}#${pion.numeroPion} (I)`,
              estMoi: infoSiege.estHumain,
            });
            posCourante = act1.caseCible;
          } else if (act1.type !== 'attendre') {
            if (!badgesSurPlace[posCourante]) badgesSurPlace[posCourante] = [];
            badgesSurPlace[posCourante].push({
              label: `${
                act1.type === 'proteger'
                  ? '🛡️'
                  : act1.type === 'saboter'
                  ? '⚡'
                  : '🌱'
              }I ${infoSiege.codePion}`,
              couleur,
              type: act1.type,
            });
          }
        } else if (
          act1 &&
          act1.type === 'deplacer' &&
          act1.caseCible !== null
        ) {
          posCourante = pion.caseId;
        }

        if (act2 && montrerEtape2) {
          if (
            act2.type === 'deplacer' &&
            act2.caseCible !== null &&
            act2.caseCible !== posCourante
          ) {
            fleches.push({
              id: `f2-${pion.id}`,
              fromId: posCourante,
              toId: act2.caseCible,
              etape: 2,
              couleur,
              label: `${infoSiege.codePion}#${pion.numeroPion} (II)`,
              estMoi: infoSiege.estHumain,
            });
          } else if (act2.type !== 'attendre') {
            if (!badgesSurPlace[posCourante]) badgesSurPlace[posCourante] = [];
            badgesSurPlace[posCourante].push({
              label: `${
                act2.type === 'proteger'
                  ? '🛡️'
                  : act2.type === 'saboter'
                  ? '⚡'
                  : '🌱'
              }II ${infoSiege.codePion}`,
              couleur,
              type: act2.type,
            });
          }
        }
      }
    }

    return { fleches, badgesSurPlace };
  }, [
    etat.programmations,
    etat.defenseurs,
    etat.sousPhase,
    etat.variante.nbJoueurs,
    sieges,
  ]);

  // Extraire les dernières actions réalisées du tour courant pour les afficher clairement
  const dernieresActionsRealisees = useMemo(() => {
    const entreesTour = etat.journal.filter(
      (e) => e.tour === etat.tourActuel && !e.id.startsWith('init-') && !e.id.startsWith('tour-start-')
    );
    return entreesTour.slice(-5).map((e) => {
      // Remplacer J1, J2... dans le message par le nom court du siège (Moi / Bot Code)
      const msgFormate = e.message.replace(/J(\d+)/g, (_m, numStr) => {
        const idx = Number(numStr) - 1;
        return formaterNomSiege(idx, sieges).nomCourt;
      });
      return {
        ...e,
        messageFormate: msgFormate,
      };
    });
  }, [etat.journal, etat.tourActuel, sieges]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
      {/* Zone gauche : Tapis de jeu en feutre forestier (7 colonnes) */}
      <div className="xl:col-span-7 bg-[#1E3528] text-[#F4F5F0] rounded-xl p-4 border border-[#14241B] flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/10">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              {infoGeo.titre}
            </h3>
            <p className="text-xs text-emerald-200/80">{infoGeo.sousTitre}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAfficherIntentionsProgrammees((v) => !v)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                afficherIntentionsProgrammees
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                  : 'bg-white/5 border-white/15 text-emerald-200/70'
              }`}
            >
              {afficherIntentionsProgrammees
                ? '👁️ Flèches d’actions : Visibles'
                : '👁️ Flèches d’actions : Masquées'}
            </button>
            <div className="text-right font-mono-tabular text-xs text-emerald-100 shrink-0">
              <span>
                🌲{' '}
                <strong className="text-white text-sm">
                  {etat.forets.reduce((a, b) => a + b, 0)}
                </strong>
                /{etat.foretsInitialesTotales}
              </span>
            </div>
          </div>
        </div>

        {/* Bandeau synthétique des Actions Réalisées lors de ce tour */}
        {dernieresActionsRealisees.length > 0 && (
          <div className="mt-2.5 bg-black/25 border border-white/10 rounded-lg px-3 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center justify-between">
              <span>⚡ Dernières actions réalisées sur le plateau :</span>
              <span className="text-emerald-200/70 font-normal">
                Tour {etat.tourActuel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dernieresActionsRealisees.map((act) => (
                <span
                  key={act.id}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                    act.type === 'coupe'
                      ? 'bg-red-950/90 border-red-400 text-red-200'
                      : act.type === 'machine'
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                      : act.type === 'apprentissage'
                      ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                      : 'bg-emerald-950/90 border-emerald-400 text-emerald-100'
                  }`}
                >
                  {act.type === 'coupe'
                    ? '🪓 '
                    : act.type === 'machine'
                    ? '🎯 '
                    : act.type === 'apprentissage'
                    ? '📈 '
                    : '🛡️ '}
                  {act.messageFormate}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SVG du plateau selon l'architecture géométrique */}
        <div className="relative flex items-center justify-center my-2">
          <svg
            viewBox="-300 -295 600 590"
            className="w-full max-w-[580px] h-auto select-none"
          >
            <defs>
              <marker
                id="arrow-plan-moi"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#34D399" />
              </marker>
              <marker
                id="arrow-plan-bot"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#FDE047" />
              </marker>
            </defs>

            {/* Guides de fond selon la géométrie */}
            {geometrie === 'hex_couronne_19' ? (
              <>
                <polygon
                  points={pointsHexagone(245)}
                  fill="rgba(16, 36, 24, 0.35)"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <polygon
                  points={pointsHexagone(135)}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </>
            ) : geometrie === 'clairieres_sentiers' ? (
              <>
                <circle
                  cx={0}
                  cy={0}
                  r={220}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.14)"
                  strokeWidth={2}
                  strokeDasharray="3 6"
                />
                <polygon
                  points="0,-95 82,47 -82,47"
                  fill="rgba(52, 211, 153, 0.04)"
                  stroke="rgba(52, 211, 153, 0.16)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              </>
            ) : (
              <>
                <circle
                  cx={0}
                  cy={0}
                  r={215}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <circle
                  cx={0}
                  cy={0}
                  r={115}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </>
            )}

            {/* Chemins d'adjacence / Sentiers entre zones */}
            {etat.cases.map((c) =>
              c.voisins
                .filter((vId) => vId > c.id)
                .map((vId) => {
                  const v = etat.cases[vId];
                  if (!v) return null;
                  const estSentier = geometrie === 'clairieres_sentiers';
                  const estLienActionPossible =
                    caseSelectionneeId !== null &&
                    ((c.id === caseSelectionneeId &&
                      casesSurligneesIds.includes(v.id)) ||
                      (v.id === caseSelectionneeId &&
                        casesSurligneesIds.includes(c.id)));

                  return (
                    <g key={`edge-${c.id}-${vId}`}>
                      {estSentier && (
                        <line
                          x1={c.x}
                          y1={c.y}
                          x2={v.x}
                          y2={v.y}
                          stroke="rgba(217, 155, 22, 0.28)"
                          strokeWidth={7}
                          strokeLinecap="round"
                        />
                      )}
                      <line
                        x1={c.x}
                        y1={c.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={
                          estLienActionPossible
                            ? '#34D399'
                            : estSentier
                            ? 'rgba(254, 243, 199, 0.55)'
                            : geometrie === 'hex_couronne_19'
                            ? 'rgba(167, 243, 208, 0.18)'
                            : 'rgba(255,255,255,0.24)'
                        }
                        strokeWidth={
                          estLienActionPossible ? 3.5 : estSentier ? 2.2 : 2.5
                        }
                        strokeDasharray={
                          estLienActionPossible
                            ? '6 4'
                            : estSentier
                            ? '5 4'
                            : undefined
                        }
                      />
                    </g>
                  );
                })
            )}

            {/* Zones / Cases du plateau */}
            {etat.cases.map((c) => {
              const nbForets = etat.forets[c.id] || 0;
              const defsIci = etat.defenseurs.filter((d) => d.caseId === c.id);
              const machsIci = etat.machines.filter((m) => m.caseId === c.id);
              const machsCiblantIci = etat.machines.filter(
                (m) => m.cibleDeclaree === c.id && !m.neutraliseeCeTour
              );
              const estProtegee = caseEstProtegeeContreCoupe(etat, c.id);
              const estSelectionnee = caseSelectionneeId === c.id;
              const estAccessible = casesSurligneesIds.includes(c.id);
              const badgesIci = vecteursProgrammes.badgesSurPlace[c.id] || [];

              const rayonTuile =
                c.rayonRendu ||
                (geometrie === 'hex_couronne_19'
                  ? 38
                  : c.anneau === 'coeur'
                  ? 48
                  : 40);

              const couleurFondTuile =
                nbForets === 0
                  ? '#3B2F2F'
                  : c.anneau === 'coeur'
                  ? '#1F4E37'
                  : c.anneau === 'interieur'
                  ? '#28593E'
                  : '#314939';

              const couleurBordure = estSelectionnee
                ? '#FBBF24'
                : estAccessible
                ? '#34D399'
                : estProtegee
                ? '#34D399'
                : c.secteurJoueur !== null
                ? COULEURS_PEUPLES_V01[
                    c.secteurJoueur % COULEURS_PEUPLES_V01.length
                  ]
                : '#A7F3D0';

              const estHex =
                c.formeRendu === 'hexagone' || geometrie === 'hex_couronne_19';
              const estClairiere =
                c.formeRendu === 'clairiere' ||
                geometrie === 'clairieres_sentiers';

              return (
                <g
                  key={`tile-${c.id}`}
                  transform={`translate(${c.x}, ${c.y})`}
                  onClick={() => onSelectCase && onSelectCase(c.id)}
                  className="cursor-pointer"
                >
                  {/* Halo de sélection ou d'action possible */}
                  {(estSelectionnee || estAccessible) &&
                    (estHex ? (
                      <polygon
                        points={pointsHexagone(rayonTuile + 6)}
                        fill={
                          estAccessible && !estSelectionnee
                            ? 'rgba(52, 211, 153, 0.14)'
                            : 'rgba(251, 191, 36, 0.14)'
                        }
                        stroke={estSelectionnee ? '#FBBF24' : '#34D399'}
                        strokeWidth={3.5}
                        strokeDasharray={
                          estAccessible && !estSelectionnee ? '6 3' : undefined
                        }
                      />
                    ) : (
                      <circle
                        r={rayonTuile + 7}
                        fill={
                          estAccessible && !estSelectionnee
                            ? 'rgba(52, 211, 153, 0.14)'
                            : 'rgba(251, 191, 36, 0.14)'
                        }
                        stroke={estSelectionnee ? '#FBBF24' : '#34D399'}
                        strokeWidth={3.5}
                        strokeDasharray={
                          estAccessible && !estSelectionnee ? '6 3' : undefined
                        }
                      />
                    ))}

                  {/* Halo de menace Machine déclarée */}
                  {machsCiblantIci.length > 0 &&
                    (estHex ? (
                      <polygon
                        points={pointsHexagone(rayonTuile + 3)}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth={3}
                      />
                    ) : (
                      <circle
                        r={rayonTuile + 3.5}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth={3}
                      />
                    ))}

                  {/* Corps de la Case selon la géométrie */}
                  {estHex ? (
                    <polygon
                      points={pointsHexagone(rayonTuile)}
                      fill={couleurFondTuile}
                      stroke={couleurBordure}
                      strokeWidth={
                        estProtegee || estSelectionnee || estAccessible
                          ? 3.2
                          : 2.2
                      }
                    />
                  ) : estClairiere ? (
                    <>
                      <circle
                        r={rayonTuile + 2}
                        fill="rgba(20, 36, 27, 0.55)"
                      />
                      <circle
                        r={rayonTuile}
                        fill={couleurFondTuile}
                        stroke={couleurBordure}
                        strokeWidth={
                          estProtegee || estSelectionnee || estAccessible
                            ? 3.5
                            : 2.4
                        }
                      />
                    </>
                  ) : (
                    <circle
                      r={rayonTuile}
                      fill={couleurFondTuile}
                      stroke={couleurBordure}
                      strokeWidth={
                        estProtegee || estSelectionnee || estAccessible
                          ? 3.5
                          : 2.2
                      }
                    />
                  )}

                  {/* Nom de la zone */}
                  <text
                    y={-rayonTuile + (estHex ? 13 : 12)}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize={estHex ? 8.8 : 9.5}
                    fontWeight={700}
                  >
                    {c.nom}
                  </text>

                  {/* Pions Forêt en bois vert */}
                  <g transform="translate(0, -7)">
                    <rect
                      x={-23}
                      y={-8}
                      width={46}
                      height={16}
                      rx={4}
                      fill="rgba(0,0,0,0.42)"
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      fill={nbForets > 0 ? '#86EFAC' : '#FCA5A5'}
                      fontSize={estHex ? 10.5 : 11.5}
                      fontWeight={700}
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      🌲 {nbForets}/{c.foretsMax}
                    </text>
                  </g>

                  {/* Indicateur de Protection active ou d'Action Possible au clic */}
                  {estProtegee ? (
                    <g transform="translate(0, -21)">
                      <rect
                        x={-25}
                        y={-6}
                        width={50}
                        height={11}
                        rx={3}
                        fill="#065F46"
                        stroke="#34D399"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill="#A7F3D0"
                        fontSize={7.5}
                        fontWeight={800}
                      >
                        🛡️ PROTÉGÉ
                      </text>
                    </g>
                  ) : estAccessible && !estSelectionnee ? (
                    <g transform="translate(0, -21)">
                      <rect
                        x={-27}
                        y={-6}
                        width={54}
                        height={11}
                        rx={3}
                        fill="#064E3B"
                        stroke="#34D399"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill="#6EE7B7"
                        fontSize={7.2}
                        fontWeight={800}
                      >
                        ➔ ALLER ICI
                      </text>
                    </g>
                  ) : estSelectionnee && casesSurligneesIds.length > 0 ? (
                    <g transform="translate(0, -21)">
                      <rect
                        x={-26}
                        y={-6}
                        width={52}
                        height={11}
                        rx={3}
                        fill="#78350F"
                        stroke="#FBBF24"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        fill="#FDE68A"
                        fontSize={7.2}
                        fontWeight={800}
                      >
                        🛡️ SUR PLACE
                      </text>
                    </g>
                  ) : null}

                  {/* Badges d'actions sur place programmées */}
                  {afficherIntentionsProgrammees && badgesIci.length > 0 && (
                    <g transform={`translate(0, ${-rayonTuile - 6})`}>
                      {badgesIci.slice(0, 2).map((b, bIdx) => (
                        <g
                          key={bIdx}
                          transform={`translate(${
                            (bIdx - (Math.min(2, badgesIci.length) - 1) / 2) *
                            38
                          }, 0)`}
                        >
                          <rect
                            x={-18}
                            y={-6}
                            width={36}
                            height={12}
                            rx={3}
                            fill="#0F172A"
                            stroke={b.couleur}
                            strokeWidth={1.2}
                          />
                          <text
                            x={0}
                            y={2.5}
                            textAnchor="middle"
                            fill="#F8FAFC"
                            fontSize={7}
                            fontWeight={700}
                          >
                            {b.label}
                          </text>
                        </g>
                      ))}
                    </g>
                  )}

                  {/* Pions Défenseurs présents sur la zone (Agrandis + MOI ou Code Bot) */}
                  {defsIci.map((d, idx) => {
                    const espacement = estHex ? 22 : 25;
                    const offsetX = (idx - (defsIci.length - 1) / 2) * espacement;
                    const estPionSel = pionSelectionneId === d.id;
                    const infoSiege = formaterNomSiege(d.joueur, sieges);
                    const couleurJ =
                      COULEURS_PEUPLES_V01[
                        d.joueur % COULEURS_PEUPLES_V01.length
                      ];
                    const textePion = infoSiege.estHumain
                      ? `MOI ${d.numeroPion}`
                      : infoSiege.codePion;

                    return (
                      <g
                        key={`def-${d.id}`}
                        transform={`translate(${offsetX}, ${estHex ? 10 : 12})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPion) onSelectPion(d.id);
                        }}
                        className="cursor-pointer"
                      >
                        {estPionSel && (
                          <rect
                            x={-16}
                            y={-11}
                            width={32}
                            height={20}
                            rx={9}
                            fill="none"
                            stroke="#FDE047"
                            strokeWidth={2.5}
                          />
                        )}
                        <rect
                          x={-14}
                          y={-9}
                          width={28}
                          height={16}
                          rx={8}
                          fill={couleurJ}
                          stroke={
                            estPionSel
                              ? '#FDE047'
                              : d.postureProtection
                              ? '#6EE7B7'
                              : '#FFFFFF'
                          }
                          strokeWidth={estPionSel ? 2.4 : 1.6}
                        />
                        <text
                          y={2}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={7.2}
                          fontWeight={800}
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {d.postureProtection ? `🛡️${textePion}` : textePion}
                        </text>
                      </g>
                    );
                  })}

                  {/* Figurines Machines présentes sur la zone */}
                  {machsIci.map((m, idx) => {
                    const offsetX = (idx - (machsIci.length - 1) / 2) * 26;
                    const estCibleActive =
                      m.cibleDeclaree === c.id && !m.neutraliseeCeTour;
                    return (
                      <g
                        key={`mach-${m.id}`}
                        transform={`translate(${offsetX}, ${
                          estHex ? 26 : 30
                        })`}
                      >
                        <rect
                          x={-12}
                          y={-8}
                          width={24}
                          height={15}
                          rx={3.5}
                          fill={
                            m.neutraliseeCeTour
                              ? '#475569'
                              : estCibleActive
                              ? '#EF4444'
                              : '#F59E0B'
                          }
                          stroke="#09090B"
                          strokeWidth={1.6}
                        />
                        <text
                          y={2.5}
                          textAnchor="middle"
                          fill={
                            m.neutraliseeCeTour || estCibleActive
                              ? '#FFFFFF'
                              : '#09090B'
                          }
                          fontSize={8}
                          fontWeight={800}
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {m.neutraliseeCeTour ? `⚡M${m.id}` : `M${m.id}`}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Flèches vectorielles des déplacements programmés (Intentions) */}
            {afficherIntentionsProgrammees &&
              vecteursProgrammes.fleches.map((fl) => {
                const cFrom = etat.cases[fl.fromId];
                const cTo = etat.cases[fl.toId];
                if (!cFrom || !cTo) return null;
                const dx = cTo.x - cFrom.x;
                const dy = cTo.y - cFrom.y;
                const dist = Math.hypot(dx, dy) || 1;
                const ux = dx / dist;
                const uy = dy / dist;
                const x1 = cFrom.x + ux * 24;
                const y1 = cFrom.y + uy * 24;
                const x2 = cTo.x - ux * 28;
                const y2 = cTo.y - uy * 28;
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;

                return (
                  <g
                    key={fl.id}
                    className="pointer-events-none"
                  >
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={fl.estMoi ? '#34D399' : '#FDE047'}
                      strokeWidth={fl.estMoi ? 3 : 2.2}
                      strokeDasharray={fl.etape === 1 ? '6 3' : '3 3'}
                      markerEnd={
                        fl.estMoi
                          ? 'url(#arrow-plan-moi)'
                          : 'url(#arrow-plan-bot)'
                      }
                    />
                    <rect
                      x={mx - 20}
                      y={my - 7}
                      width={40}
                      height={13}
                      rx={3}
                      fill="#0F172A"
                      stroke={fl.estMoi ? '#34D399' : '#FDE047'}
                      strokeWidth={1}
                    />
                    <text
                      x={mx}
                      y={my + 2}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={6.8}
                      fontWeight={700}
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {fl.label}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* Barre inférieure du plateau : Réserve / Chantier des Machines & Légende claire */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-200 font-medium">
              Chantier (Réserve) :
            </span>
            {machinesEnReserve.length === 0 ? (
              <span className="text-emerald-300/70">
                Aucune (toutes en forêt)
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                {machinesEnReserve.map((m) => (
                  <span
                    key={m.id}
                    className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-200 rounded font-mono-tabular font-semibold"
                  >
                    M{m.id}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-emerald-200/90 flex flex-wrap items-center gap-2.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-800/80 border border-emerald-400/50 text-white font-bold">
              MOI = Vos pions
            </span>
            <span>·</span>
            <span>DÉD / MCTS / BEAM = Bots alliés</span>
            <span>·</span>
            <span className="text-amber-300 font-semibold">
              M0–M5 = Machines
            </span>
          </div>
        </div>
      </div>

      {/* Zone droite : Plateau physique « La Tête du Méchant » (5 colonnes) */}
      <div className="xl:col-span-5 bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between border-b border-[#D8DFD5] pb-2.5 mb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-[#16211B]">
                Plateau « Tête du Méchant » — Double Piste Publique
              </h3>
              <p className="text-xs text-[#55645B]">
                Somme 2D6 (2–12) = Tactique · Écart |D1−D2| = Machine activée
              </p>
            </div>
            <span className="text-xs font-mono-tabular px-2 py-0.5 rounded bg-[#F4F5F0] border border-[#D8DFD5] text-[#16211B] font-semibold">
              {etat.variante.rythmeApprentissage}
            </span>
          </div>

          {/* Piste 1 : Piste Tactique (Somme 2 à 12, pic au centre sur 7) */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-[#16211B] mb-1.5">
              <span>1. Piste Tactique (Somme 2 à 12 — Pic central sur 7)</span>
              <span className="text-[11px] text-[#55645B] font-normal">
                Coupe → vers <strong>7 (6/36)</strong> · Parade → vers 2 ou 12
              </span>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((somme) => {
                const tact = etat.pisteTactique[somme];
                const styleT = COULEUR_TACTIQUE[tact];
                const prob = PROBA_SOMME_2D6[somme];
                const estSurlignee = surlignerSommePiste === somme;
                const estPic7 = somme === 7;
                return (
                  <div
                    key={`tact-${somme}`}
                    style={{
                      backgroundColor: styleT.bg,
                      borderColor: estSurlignee ? '#16211B' : styleT.border,
                    }}
                    className={`rounded-md p-1.5 border text-center flex flex-col justify-between min-h-[74px] transition-transform ${
                      estSurlignee
                        ? 'ring-2 ring-[#16211B] -translate-y-0.5 shadow-xs'
                        : estPic7
                        ? 'ring-1 ring-amber-500'
                        : ''
                    }`}
                  >
                    <div className="font-mono-tabular text-xs font-bold text-[#16211B]">
                      {somme}
                    </div>
                    <div
                      style={{ color: styleT.text }}
                      className="text-[10px] font-bold leading-tight my-1 break-words"
                    >
                      {tact === 'cupidite'
                        ? 'Cupid.'
                        : tact === 'percee'
                        ? 'Percée'
                        : tact === 'opportunisme'
                        ? 'Opport.'
                        : 'Représ.'}
                    </div>
                    <div className="font-mono-tabular text-[10px] text-[#55645B]">
                      {prob}/36
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Piste 2 : Piste Machine ordonnée statistiquement [1, 2, 3, 0, 4, 5] */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-[#16211B] mb-1.5">
              <span>
                2. Piste Machine — Ordre statistique : 1, 2, 3, 0, 4, 5
              </span>
              <span className="text-[11px] text-[#256B45] font-semibold">
                ← Coupe glisse vers 1 (10/36) · Parade recule vers 5 (2/36) →
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {ORDRE_PISTE_MACHINE.map((ecart, rangIdx) => {
                const mId = etat.pisteMachine[ecart];
                const machineObj = etat.machines.find((m) => m.id === mId);
                const surPlateau = machineObj && machineObj.caseId !== null;
                const nomPosition = surPlateau
                  ? etat.cases[machineObj.caseId!]?.nom
                  : 'Chantier';
                const prob = PROBA_ECART_2D6[ecart];
                const estSurlignee = surlignerEcartPiste === ecart;

                return (
                  <div
                    key={`mach-track-${ecart}`}
                    className={`rounded-lg p-2 border text-center flex flex-col justify-between transition-transform ${
                      estSurlignee
                        ? 'bg-amber-100 border-amber-800 ring-2 ring-amber-800 -translate-y-0.5'
                        : surPlateau
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-stone-100 border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono-tabular font-semibold text-[#16211B]">
                      <span>Écart {ecart}</span>
                      <span className="px-1 rounded bg-black/10 text-[#16211B]">
                        {prob}/36
                      </span>
                    </div>
                    <div className="my-1.5 font-mono-tabular text-sm font-bold text-[#16211B]">
                      M{mId}
                    </div>
                    <div className="text-[10px] text-[#55645B] truncate font-medium">
                      {nomPosition}
                    </div>
                    <div className="text-[9px] text-[#55645B] mt-0.5 font-mono-tabular">
                      {rangIdx === 0
                        ? '★ Max'
                        : ecart === 0
                        ? 'Doubles'
                        : rangIdx === 5
                        ? 'Min'
                        : `Rang ${rangIdx + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Derniers mouvements d'apprentissage + Rappel optionnel des Tactiques */}
        <div className="space-y-2">
          {etat.mouvementsApprentissageTour.length > 0 && (
            <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-200">
              <div className="text-xs font-semibold text-[#92400E] mb-1">
                📈 Permutations d’apprentissage sur les pistes :
              </div>
              <ul className="space-y-1 text-xs text-[#16211B]">
                {etat.mouvementsApprentissageTour.slice(-3).map((m, i) => (
                  <li key={i}>• {m.explicationPhysique}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-[#F4F5F0] rounded-lg p-2.5 border border-[#D8DFD5]">
            <button
              type="button"
              onClick={() => setAfficherRappelTactiques((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#16211B]"
            >
              <span>ℹ️ Aide-mémoire des 4 Cartes Tactiques</span>
              <span className="text-[#256B45]">
                {afficherRappelTactiques ? 'Masquer ▲' : 'Afficher ▼'}
              </span>
            </button>
            {afficherRappelTactiques && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#55645B] mt-2 pt-2 border-t border-[#D8DFD5]">
                <div>
                  <strong className="text-[#92400E]">Cupidité :</strong> vise la
                  zone la plus boisée.
                </div>
                <div>
                  <strong className="text-[#991B1B]">Percée :</strong> se
                  rapproche du Cœur Central.
                </div>
                <div>
                  <strong className="text-[#1E40AF]">Opportunisme :</strong>{' '}
                  vise une zone sans Défenseur.
                </div>
                <div>
                  <strong className="text-[#6B21A8]">Représailles :</strong>{' '}
                  vise la zone la plus défendue.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
