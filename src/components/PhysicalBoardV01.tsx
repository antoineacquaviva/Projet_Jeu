import React from 'react';
import {
  EtatJeuV01,
  TactiqueType,
} from '../shared/types';
import {
  caseEstProtegeeContreCoupe,
  COULEURS_PEUPLES_V01,
  NOMS_TACTIQUES,
  PROBA_ECART_2D6,
  PROBA_SOMME_2D6,
} from '../shared/moteur';

interface PhysicalBoardV01Props {
  etat: EtatJeuV01;
  caseSelectionneeId?: number | null;
  casesSurligneesIds?: number[];
  pionSelectionneId?: number | null;
  onSelectCase?: (caseId: number) => void;
  onSelectPion?: (pionId: number) => void;
  surlignerSommePiste?: number | null;
  surlignerEcartPiste?: number | null;
}

const COULEUR_TACTIQUE: Record<TactiqueType, { bg: string; text: string; border: string }> = {
  cupidite: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  percee: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  opportunisme: { bg: '#E0E7FF', text: '#1E40AF', border: '#6366F1' },
  represailles: { bg: '#F3E8FF', text: '#6B21A8', border: '#A855F7' },
};

export const PhysicalBoardV01: React.FC<PhysicalBoardV01Props> = ({
  etat,
  caseSelectionneeId = null,
  casesSurligneesIds = [],
  pionSelectionneId = null,
  onSelectCase,
  onSelectPion,
  surlignerSommePiste = null,
  surlignerEcartPiste = null,
}) => {
  const machinesEnReserve = etat.machines.filter((m) => m.caseId === null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
      {/* Zone gauche : Tapis de jeu en feutre forestier (Plateau modulable 3-6J) */}
      <div className="xl:col-span-7 bg-[#1E3528] text-[#F4F5F0] rounded-xl p-4 border border-[#14241B] flex flex-col justify-between">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Plateau Modulable ({etat.variante.nbJoueurs} Secteurs + Tuile Cœur)
            </h3>
            <p className="text-xs text-emerald-200/80">
              Cliquez sur un pion Défenseur ou sur une tuile pour programmer une action physique
            </p>
          </div>
          <div className="text-right font-mono-tabular text-xs text-emerald-100">
            <span>
              Forêts debout :{' '}
              <strong className="text-white">
                {etat.forets.reduce((a, b) => a + b, 0)}
              </strong>{' '}
              / {etat.foretsInitialesTotales}
            </span>
            <span className="mx-2">·</span>
            <span>
              Tour <strong className="text-white">{etat.tourActuel}</strong>/
              {etat.variante.nbTours}
            </span>
          </div>
        </div>

        {/* SVG du plateau circulaire modulable */}
        <div className="relative flex items-center justify-center my-2">
          <svg
            viewBox="-290 -285 580 570"
            className="w-full max-w-[540px] h-auto select-none"
          >
            {/* Cercles guides d'anneaux physiques */}
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

            {/* Chemins d'adjacence entre tuiles */}
            {etat.cases.map((c) =>
              c.voisins
                .filter((vId) => vId > c.id)
                .map((vId) => {
                  const v = etat.cases[vId];
                  if (!v) return null;
                  return (
                    <line
                      key={`edge-${c.id}-${vId}`}
                      x1={c.x}
                      y1={c.y}
                      x2={v.x}
                      y2={v.y}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth={2.5}
                    />
                  );
                })
            )}

            {/* Tuiles du plateau */}
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

              const rayonTuile = c.anneau === 'coeur' ? 50 : 41;
              const couleurFondTuile =
                nbForets === 0
                  ? '#3B2F2F'
                  : c.anneau === 'coeur'
                  ? '#26533B'
                  : c.anneau === 'interieur'
                  ? '#2B5B40'
                  : '#324B3A';

              return (
                <g
                  key={`tile-${c.id}`}
                  transform={`translate(${c.x}, ${c.y})`}
                  onClick={() => onSelectCase && onSelectCase(c.id)}
                  className="cursor-pointer"
                >
                  {/* Halo de sélection ou d'accessibilité */}
                  {(estSelectionnee || estAccessible) && (
                    <circle
                      r={rayonTuile + 6}
                      fill="none"
                      stroke={estSelectionnee ? '#FBBF24' : '#34D399'}
                      strokeWidth={3}
                      strokeDasharray={estAccessible && !estSelectionnee ? '5 3' : undefined}
                    />
                  )}

                  {/* Halo de menace Machine déclarée */}
                  {machsCiblantIci.length > 0 && (
                    <circle
                      r={rayonTuile + 3}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Corps de la Tuile en carton épais */}
                  <circle
                    r={rayonTuile}
                    fill={couleurFondTuile}
                    stroke={
                      estProtegee
                        ? '#34D399'
                        : c.secteurJoueur !== null
                        ? COULEURS_PEUPLES_V01[c.secteurJoueur % COULEURS_PEUPLES_V01.length]
                        : '#A7F3D0'
                    }
                    strokeWidth={estProtegee ? 3.5 : 2}
                  />

                  {/* Nom de la tuile */}
                  <text
                    y={-rayonTuile + 13}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize={9.5}
                    fontWeight={600}
                  >
                    {c.nom}
                  </text>

                  {/* Pions Forêt en bois vert (représentés par de petits arbres/cylindres) */}
                  <g transform="translate(0, -6)">
                    <rect
                      x={-24}
                      y={-9}
                      width={48}
                      height={18}
                      rx={4}
                      fill="rgba(0,0,0,0.28)"
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill={nbForets > 0 ? '#86EFAC' : '#FCA5A5'}
                      fontSize={12}
                      fontWeight={700}
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      🌲 {nbForets}/{c.foretsMax}
                    </text>
                  </g>

                  {/* Indicateur de Protection active */}
                  {estProtegee && (
                    <text
                      x={0}
                      y={-21}
                      textAnchor="middle"
                      fill="#6EE7B7"
                      fontSize={9}
                      fontWeight={700}
                    >
                      BOUCLIER ACTIF
                    </text>
                  )}

                  {/* Pions Défenseurs présents sur la tuile */}
                  {defsIci.map((d, idx) => {
                    const offsetX = (idx - (defsIci.length - 1) / 2) * 20;
                    const estPionSel = pionSelectionneId === d.id;
                    const couleurJ =
                      COULEURS_PEUPLES_V01[d.joueur % COULEURS_PEUPLES_V01.length];
                    return (
                      <g
                        key={`def-${d.id}`}
                        transform={`translate(${offsetX}, 14)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPion) onSelectPion(d.id);
                        }}
                      >
                        <circle
                          r={9.5}
                          fill={couleurJ}
                          stroke={
                            estPionSel
                              ? '#FDE047'
                              : d.postureProtection
                              ? '#6EE7B7'
                              : '#FFFFFF'
                          }
                          strokeWidth={estPionSel ? 3 : 1.8}
                        />
                        <text
                          y={3.5}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={8.5}
                          fontWeight={700}
                        >
                          J{d.joueur + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Figurines Machines présentes sur la tuile */}
                  {machsIci.map((m, idx) => {
                    const offsetX = (idx - (machsIci.length - 1) / 2) * 22;
                    return (
                      <g
                        key={`mach-${m.id}`}
                        transform={`translate(${offsetX}, 31)`}
                      >
                        <rect
                          x={-11}
                          y={-8}
                          width={22}
                          height={15}
                          rx={3}
                          fill={m.neutraliseeCeTour ? '#64748B' : '#D99B16'}
                          stroke="#18181B"
                          strokeWidth={1.5}
                        />
                        <text
                          y={3}
                          textAnchor="middle"
                          fill="#18181B"
                          fontSize={8.5}
                          fontWeight={800}
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          M{m.id}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Barre inférieure du plateau : Réserve / Chantier des Machines & Légende physique */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-200 font-medium">
              Chantier (Réserve Machines) :
            </span>
            {machinesEnReserve.length === 0 ? (
              <span className="text-emerald-300/70">
                Aucune (les 6 Machines sont sur le plateau)
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
          <div className="text-emerald-200/80 flex items-center gap-3">
            <span>🌲 Pion Forêt bois</span>
            <span>·</span>
            <span>J1–J{etat.variante.nbJoueurs} Pions Défenseurs</span>
            <span>·</span>
            <span>M0–M5 Figurines Machines</span>
          </div>
        </div>
      </div>

      {/* Zone droite : Plateau physique « La Tête du Méchant » (Double piste publique 2–12 et 0–5) */}
      <div className="xl:col-span-5 bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between border-b border-[#D8DFD5] pb-2.5 mb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-[#16211B]">
                Plateau « Tête du Méchant » — Double Piste Publique
              </h3>
              <p className="text-xs text-[#55645B]">
                Somme 2D6 (2 à 12) = Carte Tactique · Écart |d1−d2| (0 à 5) = Carte Machine
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-[#55645B]">
              Apprentissage : {etat.variante.rythmeApprentissage}
            </span>
          </div>

          {/* Piste 1 : Piste Tactique (Somme 2 à 12) */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#16211B] mb-1.5">
              <span>1. Piste Tactique (Somme des deux D6 : 2 à 12)</span>
              <span className="text-[#55645B] font-normal">
                Succès → glisse vers 7 · Parade → recule vers 2 ou 12
              </span>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((somme) => {
                const tact = etat.pisteTactique[somme];
                const styleT = COULEUR_TACTIQUE[tact];
                const prob = PROBA_SOMME_2D6[somme];
                const estSurlignee = surlignerSommePiste === somme;
                return (
                  <div
                    key={`tact-${somme}`}
                    style={{
                      backgroundColor: styleT.bg,
                      borderColor: estSurlignee ? '#16211B' : styleT.border,
                    }}
                    className={`rounded-md p-1.5 border text-center flex flex-col justify-between min-h-[74px] transition-transform ${
                      estSurlignee ? 'ring-2 ring-[#16211B] -translate-y-0.5' : ''
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

          {/* Piste 2 : Piste Machine (Écart 0 à 5) */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#16211B] mb-1.5">
              <span>2. Piste Machine (Écart |D1 − D2| : 0 à 5)</span>
              <span className="text-[#55645B] font-normal">
                Succès → glisse vers 1 (10/36) · Parade → recule vers 5
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((ecart) => {
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
                    className={`rounded-lg p-2 border text-center flex flex-col justify-between ${
                      estSurlignee
                        ? 'bg-amber-100 border-amber-700 ring-2 ring-amber-800'
                        : surPlateau
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-stone-100 border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#55645B]">
                      <span>Écart {ecart}</span>
                      <span>{prob}/36</span>
                    </div>
                    <div className="my-1.5 font-mono-tabular text-sm font-bold text-[#16211B]">
                      M{mId}
                    </div>
                    <div className="text-[10px] text-[#55645B] truncate">
                      {nomPosition}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Légende des 4 cartes Tactiques physiques */}
        <div className="bg-[#F4F5F0] rounded-lg p-3 border border-[#D8DFD5]">
          <div className="text-xs font-semibold text-[#16211B] mb-1.5">
            Rappel des Cartes Tactiques (applicables en toute configuration) :
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#55645B]">
            <div>
              <strong className="text-[#92400E]">Cupidité :</strong> vise la tuile la plus boisée.
            </div>
            <div>
              <strong className="text-[#991B1B]">Percée :</strong> se rapproche du Cœur Central.
            </div>
            <div>
              <strong className="text-[#1E40AF]">Opportunisme :</strong> vise une tuile sans Défenseur.
            </div>
            <div>
              <strong className="text-[#6B21A8]">Représailles :</strong> vise la tuile la plus défendue.
            </div>
          </div>

          {etat.mouvementsApprentissageTour.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[#D8DFD5]">
              <div className="text-xs font-semibold text-[#16211B] mb-1">
                Derniers échanges physiques sur les pistes (Apprentissage) :
              </div>
              <ul className="space-y-1 text-xs text-[#55645B]">
                {etat.mouvementsApprentissageTour.slice(-4).map((m, i) => (
                  <li key={i}>
                    • {m.explicationPhysique}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
