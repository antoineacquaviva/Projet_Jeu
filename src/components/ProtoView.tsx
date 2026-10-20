import React, { useState, useEffect, useMemo } from 'react';
import {
  ActionDefenseurType,
  ActionProgrammee,
  BotProfileId,
  EtatJeuV01,
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
  genererLivretPhysiqueVariante,
  NOMS_PEUPLES_V01,
  NOMS_TACTIQUES,
} from '../shared/moteur';
import {
  calculerProgrammationBot,
  CATALOGUE_BOTS_V01,
  predireCibleDeMonLancerSecret,
} from '../shared/bots';
import { PhysicalBoardV01 } from './PhysicalBoardV01';

export type SiegeProtoType = 'humain' | BotProfileId;

interface ProtoViewProps {
  variante: VariantV01;
  etatInitialExterne?: EtatJeuV01 | null;
  onClearEtatExterne?: () => void;
}

export const ProtoView: React.FC<ProtoViewProps> = ({
  variante,
  etatInitialExterne,
  onClearEtatExterne,
}) => {
  const [graine, setGraine] = useState<number>(20261019);
  const [sieges, setSieges] = useState<SiegeProtoType[]>(() =>
    Array.from({ length: variante.nbJoueurs }, (_, i) =>
      i === 0 ? 'humain' : 'deductif'
    )
  );
  const [etat, setEtat] = useState<EtatJeuV01>(() =>
    etatInitialExterne
      ? clonerEtatJeu(etatInitialExterne)
      : creerEtatInitialV01(variante, 20261019)
  );
  const [gobeletSouleve, setGobeletSouleve] = useState<boolean>(true);
  const [pionSelectionneId, setPionSelectionneId] = useState<number | null>(0);
  const [etapeEdition, setEtapeEdition] = useState<1 | 2>(1);
  const [afficherLivretPhysique, setAfficherLivretPhysique] =
    useState<boolean>(true);

  // Synchroniser quand la variante change ou qu'un état externe arrive depuis Démo
  useEffect(() => {
    if (etatInitialExterne) {
      setEtat(clonerEtatJeu(etatInitialExterne));
      if (onClearEtatExterne) onClearEtatExterne();
      return;
    }
    setSieges((prev) =>
      Array.from({ length: variante.nbJoueurs }, (_, i) =>
        prev[i] || (i === 0 ? 'humain' : 'deductif')
      )
    );
    const nouvelEtat = creerEtatInitialV01(variante, graine);
    setEtat(nouvelEtat);
    setPionSelectionneId(nouvelEtat.defenseurs[0]?.id ?? null);
    setEtapeEdition(1);
  }, [variante, graine, etatInitialExterne]);

  const joueurActif = etat.joueurActifProgrammation;
  const siegeActif = sieges[joueurActif] || 'humain';

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
    if (
      etat.sousPhase !== 'programmation_1' &&
      etat.sousPhase !== 'programmation_2'
    ) {
      return;
    }
    if (!pionCourant) return;
    const etapeCible: 1 | 2 =
      etat.sousPhase === 'programmation_2' ? 2 : etapeEdition;

    if (caseId === caseDepartPourEtape) {
      // Cliquer sur sa propre case programme Protéger
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
        // S'assurer que chaque pion du joueur humain a bien une carte posée (par défaut Protéger)
        const etapesRequises: (1 | 2)[] = etapeForc
          ? [etapeForc]
          : [1, 2];
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

      // Passer au joueur suivant autour de la table ou passer à la résolution
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

  const enProgrammation =
    etat.sousPhase === 'programmation_1' ||
    etat.sousPhase === 'programmation_2';

  const lancerDuJoueurActif = etat.lancersSecretsDuTour[joueurActif];
  const scoreSauvePct = calculerPourcentageForetSauvee(etat);

  return (
    <div className="space-y-5">
      {/* Barre supérieure de configuration de la table physique (Proto) */}
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            Proto — Prototype Jouable & Projection Matérielle (« {variante.nom} »)
          </h2>
          <p className="text-xs text-[#55645B]">
             Séquencement : <strong className="text-[#16211B]">{variante.modeProgrammation}</strong> ·{' '}
            Résolution : <strong className="text-[#16211B]">{variante.modeResolution}</strong> ·{' '}
            Forêt préservée : <strong className="font-mono-tabular text-[#256B45]">{scoreSauvePct} %</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAfficherLivretPhysique((v) => !v)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
          >
            {afficherLivretPhysique
              ? 'Masquer le Livret de règles physiques'
              : 'Afficher le Livret de règles physiques'}
          </button>
          <button
            onClick={() => recommencerPartie(graine + 1)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap shrink-0"
          >
            Nouvelle donne (Graine #{graine + 1})
          </button>
        </div>
      </div>

      {/* Attribution des sièges autour de la table (3 à 6 joueurs) */}
      <div className="bg-white rounded-xl p-3.5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[#16211B]">
          Sièges autour de la table ({variante.nbJoueurs} joueurs) :
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sieges.map((sType, idx) => (
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
              <span className="font-semibold text-[#16211B]">J{idx + 1}</span>
              <select
                value={sType}
                onChange={(e) => {
                  const val = e.target.value as SiegeProtoType;
                  setSieges((prev) =>
                    prev.map((old, i) => (i === idx ? val : old))
                  );
                }}
                className="bg-transparent text-xs font-medium text-[#16211B] focus:outline-none"
              >
                <option value="humain">Humain</option>
                {CATALOGUE_BOTS_V01.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom.split(' (')[0]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* BANDEAU DIRECTEUR : GESTES SUR LA TABLE PHYSIQUE */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="text-xs font-mono-tabular font-bold text-[#92400E]">
            PROJECTION SUR LA TABLE PHYSIQUE · {etat.guidePhysiqueActuel.titreEtape}
          </div>
          <div className="text-xs text-[#92400E]">
            Matériel manipulé :{' '}
            <strong>{etat.guidePhysiqueActuel.composantsPhysiques.join(' · ')}</strong>
          </div>
        </div>
        <p className="text-sm font-medium text-[#16211B] leading-relaxed">
          {etat.guidePhysiqueActuel.gesteSurTable}
        </p>
        <div className="mt-1.5 text-xs text-[#55645B]">
          {etat.guidePhysiqueActuel.regleDeReference}
        </div>
      </div>

      {/* Plateau de jeu physique + Double piste publique du Méchant */}
      <PhysicalBoardV01
        etat={etat}
        caseSelectionneeId={caseDepartPourEtape}
        casesSurligneesIds={enProgrammation ? casesAccessiblesPion : []}
        pionSelectionneId={pionCourant?.id ?? null}
        onSelectCase={handleSelectCasePlateau}
        onSelectPion={(pid) => setPionSelectionneId(pid)}
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

      {/* PANNEAU DE CONTRÔLE DU TOUR : PROGRAMMATION PHYSIQUE OU RÉSOLUTION PAS-À-PAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Colonne Gauche (7 cols) : Plateau individuel du Joueur Actif ou Contrôles de Résolution */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-[#D8DFD5]">
          {enProgrammation ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D8DFD5]">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      backgroundColor:
                        COULEURS_PEUPLES_V01[
                          joueurActif % COULEURS_PEUPLES_V01.length
                        ],
                    }}
                    className="w-3.5 h-3.5 rounded-full inline-block"
                  />
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#16211B]">
                      Tour de table : Joueur {joueurActif + 1} (
                      {NOMS_PEUPLES_V01[joueurActif % NOMS_PEUPLES_V01.length]})
                    </h3>
                    <p className="text-xs text-[#55645B]">
                      Siège :{' '}
                      <strong>
                        {siegeActif === 'humain'
                          ? 'Joueur Humain'
                          : `Bot (${siegeActif})`}
                      </strong>{' '}
                      · Posez vos cartes Action devant vos Défenseurs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => validerTourDeTableJoueurActif('deductif')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Faire jouer ce siège par le Bot Déductif
                  </button>
                  <button
                    onClick={() => validerTourDeTableJoueurActif()}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors whitespace-nowrap shrink-0"
                  >
                    Valider la pose du Joueur {joueurActif + 1} →
                  </button>
                </div>
              </div>

              {/* 1. Le Gobelet 2D6 secret du Joueur Actif */}
              {lancerDuJoueurActif && (
                <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#16211B]">
                      Gobelet 2D6 secret du Joueur {joueurActif + 1} :
                    </div>
                    {gobeletSouleve ? (
                      <div className="mt-1 text-xs text-[#16211B] space-y-0.5">
                        <div className="font-mono-tabular font-semibold">
                          🎲 Dés : [{lancerDuJoueurActif.d1}] et [
                          {lancerDuJoueurActif.d2}] → Somme ={' '}
                          <span className="text-[#991B1B]">
                            {lancerDuJoueurActif.somme}
                          </span>{' '}
                          ({NOMS_TACTIQUES[etat.pisteTactique[lancerDuJoueurActif.somme]]}) · Écart ={' '}
                          <span className="text-[#92400E]">
                            {lancerDuJoueurActif.ecart}
                          </span>{' '}
                          (Machine M{etat.pisteMachine[lancerDuJoueurActif.ecart]})
                        </div>
                        {predictionGobeletActif && (
                          <div className="text-[#55645B]">
                            Menace déduite de votre gobelet :{' '}
                            <strong className="text-[#16211B]">
                              Machine M{predictionGobeletActif.machineId}
                            </strong>{' '}
                            ciblera{' '}
                            <strong className="text-[#C2412D]">
                              {etat.cases[predictionGobeletActif.caseCible]?.nomPhysique}
                            </strong>
                            .
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[#55645B] italic mt-1">
                        Gobelet abaissé (cliquez à droite pour regarder secrètement vos dés).
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setGobeletSouleve((v) => !v)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#D8DFD5] bg-white text-[#16211B] whitespace-nowrap shrink-0"
                  >
                    {gobeletSouleve
                      ? 'Cacher mon gobelet 2D6'
                      : 'Regarder sous mon gobelet 2D6'}
                  </button>
                </div>
              )}

              {/* 2. Emplacements physiques des Cartes Action pour chaque pion Défenseur du joueur */}
              <div className="space-y-3">
                {pionsDuJoueurActif.map((pion) => {
                  const progJ = etat.programmations[joueurActif] || [];
                  const act1 = progJ.find(
                    (a) => a.pionId === pion.id && a.etape === 1
                  );
                  const act2 = progJ.find(
                    (a) => a.pionId === pion.id && a.etape === 2
                  );
                  const estPionSelectionne = pionCourant?.id === pion.id;

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
                      className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        estPionSelectionne
                          ? 'bg-emerald-50/40 border-[#256B45]'
                          : 'bg-[#F4F5F0]/60 border-[#D8DFD5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="text-xs font-semibold text-[#16211B]">
                          Pion Défenseur #{pion.numeroPion} — Actuellement sur :{' '}
                          <span className="text-[#256B45]">
                            {etat.cases[pion.caseId]?.nomPhysique}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#55645B]">
                          {estPionSelectionne
                            ? 'Sélectionné (cliquez sur une tuile du plateau pour déplacer)'
                            : 'Cliquer pour sélectionner'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              className={`p-2.5 rounded-md bg-white border ${
                                estPionSelectionne && etapeEdition === numEtape
                                  ? 'border-[#16211B] ring-1 ring-[#16211B]'
                                  : 'border-[#D8DFD5]'
                              }`}
                            >
                              <div className="text-[11px] font-mono-tabular font-semibold text-[#55645B] mb-1.5">
                                EMPLACEMENT CARTE ACTION {numEtape === 1 ? 'I' : 'II'}
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {(
                                  [
                                    { id: 'deplacer', label: 'Se déplacer' },
                                    { id: 'proteger', label: 'Protéger' },
                                    { id: 'saboter', label: 'Saboter' },
                                    ...(variante.actionReplanterActive
                                      ? [{ id: 'replanter', label: 'Replanter' }]
                                      : []),
                                  ] as { id: ActionDefenseurType; label: string }[]
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
                                    className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
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
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-[#55645B]">Vers :</span>
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
                                    className="bg-[#F4F5F0] border border-[#D8DFD5] rounded px-2 py-0.5 text-xs font-medium text-[#16211B]"
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
            /* Phase de Résolution pas-à-pas sur la table physique */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D8DFD5]">
                <div>
                  <h3 className="font-display text-base font-semibold text-[#16211B]">
                    Résolution physique du Tour {etat.tourActuel}/{variante.nbTours}
                  </h3>
                  <p className="text-xs text-[#55645B]">
                    Sous-phase actuelle :{' '}
                    <strong className="text-[#16211B]">{etat.sousPhase}</strong>
                  </p>
                </div>

                {etat.sousPhase !== 'fin_de_partie' ? (
                  <button
                    onClick={() =>
                      setEtat((prev) => avancerSousPhaseResolution(prev))
                    }
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors whitespace-nowrap shrink-0"
                  >
                    Exécuter cette étape sur la table →
                  </button>
                ) : (
                  <button
                    onClick={() => recommencerPartie(graine + 1)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#16211B] text-white whitespace-nowrap shrink-0"
                  >
                    Rejouer une partie
                  </button>
                )}
              </div>

              {/* Récapitulatif de toutes les cartes programmées autour de la table */}
              <div>
                <div className="text-xs font-semibold text-[#16211B] mb-2">
                  Cartes Action posées autour de la table ce tour :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Array.from({ length: variante.nbJoueurs }, (_, j) => {
                    const acts = etat.programmations[j] || [];
                    return (
                      <div
                        key={j}
                        className="p-2.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs"
                      >
                        <div className="font-semibold text-[#16211B] mb-1">
                          Joueur {j + 1} (Dés :{' '}
                          {etat.lancersReveles
                            ? `[${etat.lancersSecretsDuTour[j]?.d1}, ${etat.lancersSecretsDuTour[j]?.d2}] Somme ${etat.lancersSecretsDuTour[j]?.somme} / Écart ${etat.lancersSecretsDuTour[j]?.ecart}`
                            : 'Sous gobelet'}
                          )
                        </div>
                        <ul className="space-y-0.5 text-[#55645B]">
                          {acts.map((a, idx) => {
                            const pion = etat.defenseurs.find(
                              (d) => d.id === a.pionId
                            );
                            return (
                              <li key={idx}>
                                • Déf. #{pion?.numeroPion} (Act. {a.etape}) :{' '}
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
            </div>
          )}
        </div>

        {/* Colonne Droite (5 cols) : Fil de déduction / Journal des gestes physiques */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#16211B] mb-1">
              Fil d’Observation & Journal de Table
            </h3>
            <p className="text-xs text-[#55645B] mb-3">
              Observez les poses des coéquipiers précédents et suivez chaque geste physique exécuté
            </p>

            {/* Poses déjà effectuées par les joueurs précédents dans le tour de table */}
            {enProgrammation && joueurActif > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                <div className="font-semibold text-[#256B45] mb-1">
                  Poses déjà observées autour de la table (Indices de déduction) :
                </div>
                <ul className="space-y-1 text-[#16211B]">
                  {Array.from({ length: joueurActif }, (_, jPrec) => {
                    const acts = etat.programmations[jPrec] || [];
                    return (
                      <li key={jPrec}>
                        <strong>Joueur {jPrec + 1} :</strong>{' '}
                        {acts
                          .map((a) => {
                            const p = etat.defenseurs.find(
                              (d) => d.id === a.pionId
                            );
                            return `Déf.#${p?.numeroPion} Act.${a.etape}: ${a.type}${
                              a.caseCible !== null
                                ? ` (${etat.cases[a.caseCible]?.nom})`
                                : ''
                            }`;
                          })
                          .join(' · ')}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {etat.journal
                .slice()
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs"
                  >
                    <div className="font-medium text-[#16211B]">
                      {entry.message}
                    </div>
                    <div className="text-[11px] text-[#55645B] mt-0.5">
                      Geste sur table : {entry.gestePhysique}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Livret de règles physiques dynamique généré pour la variante active */}
      {afficherLivretPhysique && (
        <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
          <div className="border-b border-[#D8DFD5] pb-3 mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-[#16211B]">
                Livret de Règles Physiques — Variante « {variante.nom} »
              </h3>
              <p className="text-xs text-[#55645B]">
                Règles rédigées pour le jeu sur table physique (désignant chaque pièce de la boîte et la manipulation exacte)
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-[#55645B]">
              Version 0.1 · {variante.nbJoueurs} joueurs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {livretPhysique.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-display text-sm font-semibold text-[#16211B] mb-1">
                    {sec.section}
                  </h4>
                  <div className="text-[11px] text-[#256B45] font-medium mb-2">
                    Matériel : {sec.materielConcerne}
                  </div>
                  <p className="text-xs text-[#16211B] whitespace-pre-line leading-relaxed">
                    {sec.texteRegle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
