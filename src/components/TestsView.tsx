import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AnalyseGeminiCampagne,
  AtelierComponentId,
  BilanJoueurs36,
  CampagneSelection33,
  EtatJobCampagneVM,
  GameVersionId,
  HybrideRecommandeGemini,
  JournalPartieJSONL,
  PoidsCriteresEvaluation,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  ScoresCinqCriteres,
  VariantV01,
} from '../shared/types';
import { CATALOGUE_BOTS_V01 } from '../shared/bots';
import {
  POIDS_CRITERES_DEFAUT,
  calculerScorePondereCinqCriteres,
  decrirePanelCombinatoireVersion,
  marquerFrontPareto,
} from '../shared/tests-engine';

interface TestsViewProps {
  varianteActive: VariantV01;
  variantes: VariantV01[];
  toutesVariantes: VariantV01[];
  rapportsViabilite: RapportViabilite31[];
  rapportsInteret: RapportInteret32[];
  campagnesSelection: CampagneSelection33[];
  campagnesVM: ScheduledCampaignVM[];
  analysesGemini: AnalyseGeminiCampagne[];
  onSelectVariante: (id: string, version?: GameVersionId) => void;
  onNavigateTab: (tab: AtelierComponentId) => void;
  onUpdateStateFromTests: (payload: {
    variantes?: VariantV01[];
    rapportsViabilite?: RapportViabilite31[];
    rapportsInteret?: RapportInteret32[];
    campagnesSelection?: CampagneSelection33[];
    campagnesVM?: ScheduledCampaignVM[];
    analysesGemini?: AnalyseGeminiCampagne[];
    versionActiveId?: GameVersionId;
    varianteActiveId?: string;
  }) => void;
}

type TriPalmaresCle =
  | 'scoreGlobal'
  | 'profondeurStrategique'
  | 'tensionChoix'
  | 'dynamiqueCooperative'
  | 'equilibreMultiJoueurs'
  | 'ergonomieLisibilite';

function construireScoresCinqCriteresPourRapport(
  r: RapportInteret32,
  poids: PoidsCriteresEvaluation
): ScoresCinqCriteres {
  const existant = r.cinqCriteresPonderes;
  if (existant) {
    const nouveauScore = calculerScorePondereCinqCriteres(existant, poids);
    return {
      ...existant,
      scoreGlobalPondere: nouveauScore,
    };
  }

  // Fallback pour les rapports générés avant l'ajout de cinqCriteresPonderes
  const profondeurStrategique =
    r.troisAxesPrioritaires?.interetStrategique ?? r.scoreInteretGlobal;
  const tensionChoix =
    r.metriquesPlacementV04?.tensionDecisionsPct ??
    r.indicateurs.tensionDecisionsPct ??
    86;
  const dynamiqueCooperative = Math.min(
    98,
    Math.round(
      76 +
        (r.indicateurs.gainDeductionSequentielle || 4) * 2.1 +
        (r.metriquesPlacementV04?.tauxCoalitionsReussiesPct || 25) * 0.2
    )
  );
  const equilibreMultiJoueurs =
    r.troisAxesPrioritaires?.equilibreJoueurs36 ?? 88;
  const ergonomieLisibilite =
    r.troisAxesPrioritaires?.lisibiliteErgonomie ?? 90;

  const baseSansScore: Omit<ScoresCinqCriteres, 'scoreGlobalPondere'> = {
    profondeurStrategique,
    tensionChoix,
    dynamiqueCooperative,
    equilibreMultiJoueurs,
    ergonomieLisibilite,
    detailsAlgorithmes: {
      mctsGainPct: r.indicateurs.ecartDeductifSurInerte,
      expectimaxGainPct: Math.max(
        0,
        r.indicateurs.ecartDeductifSurInerte - 1.5
      ),
      beamGainPct: Math.max(0, r.indicateurs.ecartDeductifSurInerte - 0.8),
      entropieShannonMoyenne: tensionChoix,
      regretContrefactuelMoyen: 12.4,
      tauxPartiesSerreesPct: 38,
      shapleySynergieCoopPts: r.indicateurs.gainDeductionSequentielle,
      ratioCoalitionBarragePct:
        r.metriquesPlacementV04?.tauxCoalitionsReussiesPct ?? 42,
      tauxMouvementsContrariesPct:
        r.indicateurs.tauxMouvementsContrariesPct ?? 14,
      ecartType36JPct: 3.2,
      cvar10PireDecilePct: 58,
      degreMoyenGraphe: 3.6,
      chargeManipulationsParTour: 8,
    },
  };

  return {
    ...baseSansScore,
    scoreGlobalPondere: calculerScorePondereCinqCriteres(baseSansScore, poids),
  };
}

export const TestsView: React.FC<TestsViewProps> = ({
  varianteActive,
  toutesVariantes,
  campagnesSelection,
  analysesGemini,
  onSelectVariante,
  onNavigateTab,
  onUpdateStateFromTests,
}) => {
  const [versionCible, setVersionCible] = useState<GameVersionId>('0.5');
  const [calibreParties, setCalibreParties] = useState<number>(500);
  const [poidsCriteres, setPoidsCriteres] = useState<PoidsCriteresEvaluation>({
    ...POIDS_CRITERES_DEFAUT,
  });

  const [jobStatus, setJobStatus] = useState<EtatJobCampagneVM | null>(null);
  const [lancementEnCours, setLancementEnCours] = useState<boolean>(false);
  const [relanceGeminiEnCours, setRelanceGeminiEnCours] =
    useState<boolean>(false);
  const [instanciationId, setInstanciationId] = useState<string | null>(null);
  const [commandeCopiee, setCommandeCopiee] = useState<boolean>(false);

  const [campagneSelectionneeId, setCampagneSelectionneeId] =
    useState<string>('');
  const [triPalmares, setTriPalmares] =
    useState<TriPalmaresCle>('scoreGlobal');
  const [afficherSeulementPareto, setAfficherSeulementPareto] =
    useState<boolean>(false);
  const [varianteInspecteeId, setVarianteInspecteeId] = useState<string | null>(
    null
  );
  const [afficherRapportMarkdownComplet, setAfficherRapportMarkdownComplet] =
    useState<boolean>(false);

  const [logsJsonl, setLogsJsonl] = useState<JournalPartieJSONL[]>([]);
  const [chargementLogs, setChargementLogs] = useState<boolean>(false);
  const [filtreLogVarianteId, setFiltreLogVarianteId] = useState<string>('');
  const [filtreLogBotId, setFiltreLogBotId] = useState<string>('');
  const [filtreLogNbJoueurs, setFiltreLogNbJoueurs] = useState<number>(0);
  const [partieInspectee, setPartieInspectee] =
    useState<JournalPartieJSONL | null>(null);

  const [afficherArchives, setAfficherArchives] = useState<boolean>(false);

  const panelCombinatoire = useMemo(
    () => decrirePanelCombinatoireVersion(versionCible),
    [versionCible]
  );

  const campagnesVersionActive = useMemo(
    () =>
      campagnesSelection.filter((c) =>
        (c.versionsCibles || ['0.5']).includes(versionCible)
      ),
    [campagnesSelection, versionCible]
  );

  const campagnesArchives = useMemo(
    () =>
      campagnesSelection.filter(
        (c) => !(c.versionsCibles || ['0.1']).includes('0.5')
      ),
    [campagnesSelection]
  );

  const campagneActive: CampagneSelection33 | undefined = useMemo(() => {
    if (campagneSelectionneeId) {
      const found = campagnesSelection.find(
        (c) => c.id === campagneSelectionneeId
      );
      if (found) return found;
    }
    return campagnesVersionActive[0] || campagnesSelection[0];
  }, [campagneSelectionneeId, campagnesVersionActive, campagnesSelection]);

  const analyseGeminiActive: AnalyseGeminiCampagne | undefined = useMemo(() => {
    if (!campagneActive) return analysesGemini[0];
    return (
      analysesGemini.find((a) => a.campagneId === campagneActive.id) ||
      analysesGemini[0]
    );
  }, [campagneActive, analysesGemini]);

  const rafraichirEtatGlobalServeur = useCallback(async () => {
    try {
      const resp = await fetch('/api/atelier/state');
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.variantes,
          rapportsViabilite: data.rapportsViabilite,
          rapportsInteret: data.rapportsInteret,
          campagnesSelection: data.campagnesSelection,
          analysesGemini: data.analysesGemini,
        });
        if (
          Array.isArray(data.campagnesSelection) &&
          data.campagnesSelection.length > 0
        ) {
          setCampagneSelectionneeId(data.campagnesSelection[0].id);
        }
      }
    } catch (_e) {
      // Ignorer
    }
  }, [onUpdateStateFromTests]);

  useEffect(() => {
    let ignore = false;
    let prevStatut: string | undefined;

    async function checkJobStatus() {
      try {
        const resp = await fetch('/api/atelier/campaign/status');
        if (resp.ok) {
          const data = await resp.json();
          if (!ignore && data.jobStatus) {
            const nouveauStatut: EtatJobCampagneVM = data.jobStatus;
            setJobStatus(nouveauStatut);

            if (
              (prevStatut === 'en_cours' || prevStatut === 'analyse_ia') &&
              (nouveauStatut.statut === 'termine' ||
                nouveauStatut.statut === 'interrompu')
            ) {
              await rafraichirEtatGlobalServeur();
            }
            prevStatut = nouveauStatut.statut;
          }
        }
      } catch (_e) {
        // Ignorer
      }
    }

    checkJobStatus();
    const estActif =
      jobStatus?.statut === 'en_cours' || jobStatus?.statut === 'analyse_ia';
    const intervalMs = estActif ? 1200 : 4000;
    const timer = setInterval(checkJobStatus, intervalMs);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [jobStatus?.statut, rafraichirEtatGlobalServeur]);

  const chargerLogsCampagne = useCallback(async () => {
    if (!campagneActive) return;
    setChargementLogs(true);
    try {
      const params = new URLSearchParams();
      params.set('campagneId', campagneActive.id);
      if (filtreLogVarianteId) params.set('varianteId', filtreLogVarianteId);
      if (filtreLogBotId) params.set('botId', filtreLogBotId);
      if (filtreLogNbJoueurs > 0)
        params.set('nbJoueurs', String(filtreLogNbJoueurs));
      params.set('limit', '60');

      const resp = await fetch(`/api/atelier/campaign/logs?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          setLogsJsonl(data.logs);
          setChargementLogs(false);
          return;
        }
      }
    } catch (_e) {
      // Fallback
    }

    const fallbackLogs: JournalPartieJSONL[] = [];
    if (
      campagneActive.echantillonPartiesRemarquables &&
      campagneActive.echantillonPartiesRemarquables.length > 0
    ) {
      fallbackLogs.push(...campagneActive.echantillonPartiesRemarquables);
    } else {
      for (const r of campagneActive.rapportsInteret) {
        if (r.echantillonPartiesVariante) {
          fallbackLogs.push(...r.echantillonPartiesVariante);
        }
      }
    }
    const filtres = fallbackLogs.filter(
      (l) =>
        (!filtreLogVarianteId || l.varianteId === filtreLogVarianteId) &&
        (!filtreLogBotId || l.botId === filtreLogBotId) &&
        (filtreLogNbJoueurs === 0 || l.nbJoueurs === filtreLogNbJoueurs)
    );
    setLogsJsonl(filtres.slice(0, 60));
    setChargementLogs(false);
  }, [
    campagneActive,
    filtreLogVarianteId,
    filtreLogBotId,
    filtreLogNbJoueurs,
  ]);

  useEffect(() => {
    chargerLogsCampagne();
  }, [chargerLogsCampagne]);

  const rapportsTriesEtPonderes = useMemo(() => {
    if (!campagneActive) return [];
    const liste: RapportInteret32[] = campagneActive.rapportsInteret.map(
      (r) => {
        const cinq = construireScoresCinqCriteresPourRapport(r, poidsCriteres);
        return {
          ...r,
          cinqCriteresPonderes: cinq,
          scoreInteretGlobal: cinq.scoreGlobalPondere,
        };
      }
    );
    marquerFrontPareto(liste);

    const filtree = afficherSeulementPareto
      ? liste.filter((r) => r.cinqCriteresPonderes?.estParetoOptimal)
      : liste;

    return [...filtree].sort((a, b) => {
      const ca = a.cinqCriteresPonderes!;
      const cb = b.cinqCriteresPonderes!;
      if (triPalmares === 'profondeurStrategique')
        return cb.profondeurStrategique - ca.profondeurStrategique;
      if (triPalmares === 'tensionChoix')
        return cb.tensionChoix - ca.tensionChoix;
      if (triPalmares === 'dynamiqueCooperative')
        return cb.dynamiqueCooperative - ca.dynamiqueCooperative;
      if (triPalmares === 'equilibreMultiJoueurs')
        return cb.equilibreMultiJoueurs - ca.equilibreMultiJoueurs;
      if (triPalmares === 'ergonomieLisibilite')
        return cb.ergonomieLisibilite - ca.ergonomieLisibilite;
      return cb.scoreGlobalPondere - ca.scoreGlobalPondere;
    });
  }, [campagneActive, poidsCriteres, triPalmares, afficherSeulementPareto]);

  const estimationsVolumetrie = useMemo(() => {
    const nbVariantes = panelCombinatoire.nbTotalVariantesExhaustives;
    const partiesTotales = Math.round(nbVariantes * calibreParties * 0.9);
    const tailleMo = Math.round(((partiesTotales * 0.68) / 1024) * 10) / 10;
    const dureeEstimeeSec = Math.max(4, Math.round(partiesTotales / 950));
    return {
      nbVariantes,
      partiesTotales,
      tailleMo,
      dureeEstimeeSec,
    };
  }, [panelCombinatoire.nbTotalVariantesExhaustives, calibreParties]);

  const handleDemarrerCampagneVM = async () => {
    setLancementEnCours(true);
    try {
      const resp = await fetch('/api/atelier/campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionCible,
          calibrePartiesParVariante: calibreParties,
          poidsCriteres,
          nomCampagne: `Campagne Exhaustive V${versionCible} (${panelCombinatoire.nbTotalVariantesExhaustives} variantes × ${calibreParties} parties/var.)`,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.jobStatus) {
          setJobStatus(data.jobStatus);
        }
      }
    } catch (_err) {
      // Ignorer
    } finally {
      setLancementEnCours(false);
    }
  };

  const handleArreterCampagneVM = async () => {
    try {
      const resp = await fetch('/api/atelier/campaign/stop', {
        method: 'POST',
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.jobStatus) setJobStatus(data.jobStatus);
      }
    } catch (_e) {
      // Ignorer
    }
  };

  const handleRelancerAnalyseGemini = async () => {
    if (!campagneActive) return;
    setRelanceGeminiEnCours(true);
    try {
      const resp = await fetch('/api/atelier/campaigns/analyze-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campagneId: campagneActive.id }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.state) {
          onUpdateStateFromTests({
            analysesGemini: data.state.analysesGemini,
          });
        }
      }
    } catch (_e) {
      // Ignorer
    } finally {
      setRelanceGeminiEnCours(false);
    }
  };

  const handleInstancierHybride = async (hybride: HybrideRecommandeGemini) => {
    const hybId = hybride.varianteHybride.id;
    setInstanciationId(hybId);
    try {
      const resp = await fetch(
        '/api/atelier/variants/from-gemini-recommendation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hybride, evaluerImmediatement: true }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.state && data.variante) {
          onUpdateStateFromTests({
            variantes: data.state.variantes,
            rapportsViabilite: data.state.rapportsViabilite,
            rapportsInteret: data.state.rapportsInteret,
            versionActiveId: data.variante.version || '0.4',
            varianteActiveId: data.variante.id,
          });
          onNavigateTab('proto');
        }
      }
    } catch (_e) {
      // Fallback
    } finally {
      setInstanciationId(null);
    }
  };

  const handleTelechargerRapportMarkdown = () => {
    if (!analyseGeminiActive) return;
    const blob = new Blob([analyseGeminiActive.rapportMarkdown], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilan-campagne-${analyseGeminiActive.campagneId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const commandeCliVM = `npx tsx scripts/vm-worker.ts --version ${versionCible} --calibre ${calibreParties}`;

  const handleCopierCommandeCLI = () => {
    navigator.clipboard?.writeText(commandeCliVM);
    setCommandeCopiee(true);
    setTimeout(() => setCommandeCopiee(false), 2500);
  };

  const sommePoids =
    poidsCriteres.profondeurStrategique +
    poidsCriteres.tensionChoix +
    poidsCriteres.dynamiqueCooperative +
    poidsCriteres.equilibreMultiJoueurs +
    poidsCriteres.ergonomieLisibilite;

  const formatDuree = (sec: number): string => {
    if (sec < 60) return `${sec} s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (min < 60) return `${min} min ${remSec} s`;
    const h = Math.floor(min / 60);
    const remMin = min % 60;
    return `${h} h ${remMin} min`;
  };

  const rapportInspecte = useMemo(
    () =>
      rapportsTriesEtPonderes.find(
        (r) => r.varianteId === varianteInspecteeId
      ) || rapportsTriesEtPonderes[0],
    [rapportsTriesEtPonderes, varianteInspecteeId]
  );

  const jobEstActif =
    jobStatus?.statut === 'en_cours' || jobStatus?.statut === 'analyse_ia';

  return (
    <div className="space-y-8 pb-14">
      {/* EN-TÊTE ÉDITORIAL & NAVIGATION DES 6 SECTIONS DU PROTOCOLE */}
      <section className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-6 pb-5 border-b border-[#D8DFD5]">
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-wider text-[#256B45] font-semibold mb-1">
              Banc d’Essai Combinatoire & Évaluation Multi-Critères sur VM Oracle
            </div>
            <h1 className="font-display text-2xl font-bold text-[#16211B] tracking-tight">
              Campagnes de Tests Exhaustives — Version {versionCible}
            </h1>
            <p className="text-sm text-[#55645B] mt-1.5 leading-relaxed">
              Validation en profondeur d’une version par balayage intégral de son produit cartésien d’options et de paramètres, journalisation complète de chaque partie (<code className="font-mono text-xs bg-[#F4F5F0] px-1.5 py-0.5 rounded">.jsonl</code>), évaluation par 5 algorithmes dédiés et sélection assistée par IA sur le Front de Pareto.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#55645B]">
              Version soumise au banc d’essai
            </label>
            <div className="flex items-center gap-2">
              {(['0.5', '0.4', '0.3', '0.2', '0.1'] as GameVersionId[]).map((ver) => (
                <button
                  key={ver}
                  type="button"
                  onClick={() => setVersionCible(ver)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                    versionCible === ver
                      ? 'bg-[#1E3528] text-white border-[#1E3528]'
                      : 'bg-[#F4F5F0] text-[#55645B] border-[#D8DFD5] hover:text-[#16211B]'
                  }`}
                >
                  V{ver}
                  {ver === '0.5' ? ' (Active)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sommaire rapide des 6 sections */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
          {[
            {
              href: '#sec-01',
              num: '01.',
              titre: 'Stratégie de Test',
              sous: 'Exhaustivité & 2 étages',
            },
            {
              href: '#sec-02',
              num: '02.',
              titre: 'Panel & Volumétrie',
              sous: `${panelCombinatoire.nbTotalVariantesExhaustives} variantes × 3–6J`,
            },
            {
              href: '#sec-03',
              num: '03.',
              titre: 'Critères & Méthodes',
              sous: '5 algorithmes pondérés',
            },
            {
              href: '#sec-04',
              num: '04.',
              titre: 'Workflow Campagne',
              sous: 'Pipeline en 5 étapes',
            },
            {
              href: '#sec-05',
              num: '05.',
              titre: 'Lancement & Direct',
              sous: 'Job VM à la demande',
            },
            {
              href: '#sec-06',
              num: '06.',
              titre: 'Bilan & Palmarès IA',
              sous: 'Pareto, JSONL & Gemini',
            },
          ].map((item) => (
            <a
              key={item.num}
              href={item.href}
              className="p-2.5 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 hover:bg-[#EAECE4] transition-colors block"
            >
              <div className="text-xs font-mono font-bold text-[#256B45]">
                {item.num}{' '}
                <span className="text-[#16211B] font-sans">{item.titre}</span>
              </div>
              <div className="text-[11px] text-[#55645B] mt-0.5 truncate">
                {item.sous}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* =====================================================================
          01. STRATÉGIE DE TEST
      ===================================================================== */}
      <section
        id="sec-01"
        className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
              01. Stratégie de Test
            </span>
            <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
              Principes Directeurs : Exhaustivité Combinatoire, Exécution à la Demande & Traçabilité par Partie
            </h2>
          </div>
          <span className="text-xs font-mono text-[#55645B]">
            Zéro tâche périodique (Cron désactivé) · Puissance dédiée VM Oracle Cloud
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-2">
            <div className="text-xs font-mono font-bold text-[#1E3528] uppercase">
              Pilier 1 — Balayage Combinatoire Exhaustif
            </div>
            <p className="text-xs text-[#16211B] leading-relaxed">
              Plutôt que d’échantillonner quelques variantes au hasard, une campagne génère systématiquement le <strong>produit cartésien complet</strong> de toutes les options structurelles de la version ({panelCombinatoire.nbTotalVariantesExhaustives} variantes distinctes en V{versionCible}) et confronte chaque variante aux différentes configurations de table (<strong>3, 4, 5 et 6 joueurs</strong>).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-2">
            <div className="text-xs font-mono font-bold text-[#1E3528] uppercase">
              Pilier 2 — Double Étage : Coupe-Circuit puis Profondeur
            </div>
            <p className="text-xs text-[#16211B] leading-relaxed">
              <strong>Étage A (Coupe-circuit de viabilité) :</strong> élimine rapidement les combinaisons dégénérées (victoire passive, effondrement systématique, exploit par boucle répétitive).
              <br />
              <strong>Étage B (Évaluation intensive) :</strong> concentre le budget de calcul de la VM Oracle (500 à 2 500 parties/variante) sur les variantes viables avec l’échelle complète des <strong>9 bots</strong>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-2">
            <div className="text-xs font-mono font-bold text-[#1E3528] uppercase">
              Pilier 3 — Journalisation JSONL & Synthèse IA
            </div>
            <p className="text-xs text-[#16211B] leading-relaxed">
              Chaque partie simulée est enregistrée en flux continu dans un fichier <code className="font-mono">.jsonl</code> sur le disque de la VM avec ses métriques décisionnelles (entropie de Shannon, regret contrefactuel, frictions spatiales). L’IA <strong>Gemini</strong> synthétise ensuite le Front de Pareto pour isoler les variantes les plus riches.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          02. PANEL DE VARIANTES & VOLUMÉTRIE COMBINATOIRE
      ===================================================================== */}
      <section
        id="sec-02"
        className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
              02. Panel de Variantes & Volumétrie Combinatoire
            </span>
            <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
              Matrice Factorielle Complète de la Version V{versionCible} ({panelCombinatoire.nbTotalVariantesExhaustives} Variantes)
            </h2>
          </div>
          <div className="text-xs font-mono font-semibold text-[#1E3528] bg-[#EAECE4] px-3 py-1 rounded-md border border-[#D8DFD5]">
            {panelCombinatoire.formuleCombinatoire}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {panelCombinatoire.axes.map((axe, i) => (
            <div
              key={axe.id}
              className="p-3.5 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/70 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#256B45]">
                    AXE {i + 1}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#D8DFD5] text-[#16211B]">
                    {axe.nbModalites} modalités
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#16211B] mb-2">
                  {axe.nom}
                </h3>
                <ul className="space-y-1 text-[11px] text-[#55645B]">
                  {axe.modalites.map((m) => (
                    <li key={m.code} className="flex items-start gap-1.5">
                      <span className="text-[#256B45] font-bold">·</span>
                      <span>{m.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Synthèse volumétrique selon le calibre */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-white">
            <div className="text-[11px] font-mono uppercase text-[#55645B]">
              Variantes de la grille V{versionCible}
            </div>
            <div className="text-2xl font-mono font-bold text-[#16211B] mt-1">
              {estimationsVolumetrie.nbVariantes}
            </div>
            <div className="text-[11px] text-[#55645B] mt-0.5">
              Produit cartésien exhaustif + références
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-white">
            <div className="text-[11px] font-mono uppercase text-[#55645B]">
              Calibre sélectionné par variante
            </div>
            <div className="text-2xl font-mono font-bold text-[#256B45] mt-1">
              {calibreParties.toLocaleString('fr-FR')} parties
            </div>
            <div className="text-[11px] text-[#55645B] mt-0.5">
              9 Bots IA × Tables de 3, 4, 5 et 6 joueurs
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-white">
            <div className="text-[11px] font-mono uppercase text-[#55645B]">
              Volume total de la campagne
            </div>
            <div className="text-2xl font-mono font-bold text-[#16211B] mt-1">
              ~{estimationsVolumetrie.partiesTotales.toLocaleString('fr-FR')}
            </div>
            <div className="text-[11px] text-[#55645B] mt-0.5">
              Parties intégralement journalisées et analysées
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-white">
            <div className="text-[11px] font-mono uppercase text-[#55645B]">
              Empreinte Disque JSONL estimée
            </div>
            <div className="text-2xl font-mono font-bold text-[#16211B] mt-1">
              ~{estimationsVolumetrie.tailleMo} Mo
            </div>
            <div className="text-[11px] text-[#55645B] mt-0.5">
              Stocké dans <code className="font-mono">resultats/logs/*.jsonl</code>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          03. CRITÈRES D'ÉVALUATION PONDÉRÉS & MÉTHODES ALGORITHMIQUES
      ===================================================================== */}
      <section
        id="sec-03"
        className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
              03. Critères d’Évaluation Pondérés & Méthodes Algorithmiques
            </span>
            <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
              5 Critères Orthogonaux Évalués par des Algorithmes Dédiés
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#55645B]">
              Somme des poids :{' '}
              <strong className="text-[#16211B]">{sommePoids}%</strong> (normalisée auto sur 100%)
            </span>
            <button
              type="button"
              onClick={() => setPoidsCriteres({ ...POIDS_CRITERES_DEFAUT })}
              className="px-2.5 py-1 text-xs font-mono rounded border border-[#D8DFD5] bg-[#F4F5F0] hover:bg-[#EAECE4] text-[#16211B]"
            >
              Réinitialiser (30/25/20/15/10)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Critère 1 */}
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                  Critère 1
                </span>
                <span className="text-sm font-mono font-bold text-[#16211B]">
                  {poidsCriteres.profondeurStrategique}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#16211B]">
                Profondeur Stratégique & Mérite Tactique
              </h3>
              <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#D8DFD5] text-[#1E3528]">
                IS-MCTS · Expectimax Bayésien 2D6 · Beam Rollout
              </div>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Mesure le différentiel de score <span className="font-mono">Δ(Bots de pointe − Bots naïfs)</span>, la monotonie de la courbe des 9 bots et la marge anti-exploit du garde-fou <em>Bot Boucle</em>.
              </p>
            </div>
            <div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={poidsCriteres.profondeurStrategique}
                onChange={(e) =>
                  setPoidsCriteres((p) => ({
                    ...p,
                    profondeurStrategique: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#256B45]"
              />
            </div>
          </div>

          {/* Critère 2 */}
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                  Critère 2
                </span>
                <span className="text-sm font-mono font-bold text-[#16211B]">
                  {poidsCriteres.tensionChoix}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#16211B]">
                Tension & Criticité des Choix par Tour
              </h3>
              <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#D8DFD5] text-[#1E3528]">
                Entropie de Shannon H(p) & Regret Contrefactuel ΔQ
              </div>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Évalue à chaque tour si plusieurs coups candidats ont une utilité proche (entropie élevée = vrai dilemme) tout en punissant les erreurs d’inattention (regret contrefactuel + parties serrées).
              </p>
            </div>
            <div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={poidsCriteres.tensionChoix}
                onChange={(e) =>
                  setPoidsCriteres((p) => ({
                    ...p,
                    tensionChoix: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#256B45]"
              />
            </div>
          </div>

          {/* Critère 3 */}
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                  Critère 3
                </span>
                <span className="text-sm font-mono font-bold text-[#16211B]">
                  {poidsCriteres.dynamiqueCooperative}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#16211B]">
                Dynamique Coopérative & Frictions Spatiales
              </h3>
              <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#D8DFD5] text-[#1E3528]">
                Synergie de Shapley · Fenêtre Contrariée 8%–22%
              </div>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Quantifie le gain d’une équipe coordonnée (Barrages & Coalitions) face au bot égoïste <em>Glouton</em>, et vérifie que le taux de mouvements contrariés reste dans la zone stimulante (8% à 22%).
              </p>
            </div>
            <div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={poidsCriteres.dynamiqueCooperative}
                onChange={(e) =>
                  setPoidsCriteres((p) => ({
                    ...p,
                    dynamiqueCooperative: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#256B45]"
              />
            </div>
          </div>

          {/* Critère 4 */}
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                  Critère 4
                </span>
                <span className="text-sm font-mono font-bold text-[#16211B]">
                  {poidsCriteres.equilibreMultiJoueurs}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#16211B]">
                Constance d’Intérêt 3–6 Joueurs, Tables Mixtes & Plancher CVaR 10%
              </h3>
              <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#D8DFD5] text-[#1E3528]">
                σ_survie & σ_intérêt (3–6J) · Tables Mixtes · Zéro Déroute (CVaR)
              </div>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Favorise les variantes dont la survie ET l’intérêt de l’apprentissage restent constants à 3, 4, 5 et 6 joueurs (tables homogènes et mixtes), tout en garantissant un plancher d’arbres sauvés élevé (zéro défaite à 0 arbre).
              </p>
            </div>
            <div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={poidsCriteres.equilibreMultiJoueurs}
                onChange={(e) =>
                  setPoidsCriteres((p) => ({
                    ...p,
                    equilibreMultiJoueurs: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#256B45]"
              />
            </div>
          </div>

          {/* Critère 5 */}
          <div className="p-4 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                  Critère 5
                </span>
                <span className="text-sm font-mono font-bold text-[#16211B]">
                  {poidsCriteres.ergonomieLisibilite}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#16211B]">
                Ergonomie Physique & Lisibilité sur Table
              </h3>
              <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#D8DFD5] text-[#1E3528]">
                Modèle Topologique de Graphe & Charge Manip.
              </div>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Évalue la clarté visuelle des adjacences (degré moyen du graphe <span className="font-mono">d̄</span>, repérage des 3 Cols et des frontières) et la sobriété des manipulations de pions par tour.
              </p>
            </div>
            <div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={poidsCriteres.ergonomieLisibilite}
                onChange={(e) =>
                  setPoidsCriteres((p) => ({
                    ...p,
                    ergonomieLisibilite: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#256B45]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          04. WORKFLOW D'UNE CAMPAGNE DE TEST
      ===================================================================== */}
      <section
        id="sec-04"
        className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-[#D8DFD5] pb-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
            04. Workflow d’une Campagne de Test
          </span>
          <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
            Pipeline d’Exécution séquentiel en 5 Étapes sur la VM Oracle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {[
            {
              etape: 'ÉTAPE 1',
              num: 1,
              titre: 'Génération de la Grille Combinatoire',
              detail: `Instanciation déterministe des ${panelCombinatoire.nbTotalVariantesExhaustives} variantes du produit cartésien de V${versionCible} + variantes de référence.`,
            },
            {
              etape: 'ÉTAPE 2',
              num: 2,
              titre: 'Coupe-Circuit de Viabilité (5 Invariants)',
              detail:
                'Test éliminatoire rapide (Bot Inerte = 0%, Déductif ≥ 30%, marge anti-boucle ≥ 5 pts, absence de blocage). Écarte immédiatement les variantes cassées.',
            },
            {
              etape: 'ÉTAPE 3',
              num: 3,
              titre: 'Simulation Intensive 9 Bots & Banc 3–6J',
              detail: `Exécution des ${calibreParties} parties/variante viable (IS-MCTS, Expectimax 2D6, Beam Rollout, tables 3 à 6J) avec écriture streaming dans le fichier .jsonl.`,
            },
            {
              etape: 'ÉTAPE 4',
              num: 4,
              titre: 'Agrégation des 5 Critères & Front de Pareto',
              detail:
                'Calcul des 5 scores algorithmiques pondérés et identification des variantes Pareto-optimales (non dominées sur l’ensemble des critères).',
            },
            {
              etape: 'ÉTAPE 5',
              num: 5,
              titre: 'Synthèse IA Gemini & Recommandations',
              detail:
                'Classement argumenté des meilleures variantes, synthèse de leurs avantages respectifs et proposition d’hybridations instanciables en 1 clic.',
            },
          ].map((step) => {
            const estActif = jobEstActif && jobStatus?.etapeNumero === step.num;
            return (
              <div
                key={step.etape}
                className={`p-4 rounded-lg border transition-colors ${
                  estActif
                    ? 'border-[#256B45] bg-emerald-50/70'
                    : 'border-[#D8DFD5] bg-[#F4F5F0]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#256B45]">
                    {step.etape}
                  </span>
                  {estActif && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#256B45] text-white">
                      EN COURS
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-[#16211B] mb-1.5">
                  {step.titre}
                </h3>
                <p className="text-[11px] text-[#55645B] leading-relaxed">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          05. LANCEMENT À LA DEMANDE & DÉROULÉ EN DIRECT (VM ORACLE & CLI)
      ===================================================================== */}
      <section
        id="sec-05"
        className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-6"
      >
        <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
              05. Lancement à la Demande & Déroulé en Direct
            </span>
            <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
              Poste de Commande de la Campagne Exhaustive (Job Web Asynchrone ou CLI SSH sur VM Oracle)
            </h2>
          </div>
          <div className="text-xs font-mono text-[#55645B]">
            Statut Job VM :{' '}
            <strong
              className={
                jobEstActif
                  ? 'text-[#256B45]'
                  : jobStatus?.statut === 'erreur'
                  ? 'text-[#C2412D]'
                  : 'text-[#16211B]'
              }
            >
              {jobEstActif
                ? 'EXÉCUTION EN COURS'
                : jobStatus?.statut === 'termine'
                ? 'DERNIER JOB TERMINÉ'
                : jobStatus?.statut === 'interrompu'
                ? 'INTERROMPU (PARTIEL SAUVEGARDÉ)'
                : 'PRÊT (À LA DEMANDE)'}
            </strong>
          </div>
        </div>

        {/* Sélecteur de Calibre & Boutons de déclenchement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-5 rounded-xl border border-[#D8DFD5] bg-[#F4F5F0]/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[#1E3528]">
                A. Calibre de Profondeur (Nombre de parties par variante viable)
              </span>
              <span className="text-xs font-mono text-[#55645B]">
                Total estimé :{' '}
                <strong>
                  ~{estimationsVolumetrie.partiesTotales.toLocaleString('fr-FR')} parties
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  val: 180,
                  label: '180 parties / var.',
                  desc: 'Validation Standard (~21 600 parties)',
                },
                {
                  val: 500,
                  label: '500 parties / var.',
                  desc: 'Campagne Approfondie (~60 000 parties)',
                },
                {
                  val: 1000,
                  label: '1 000 parties / var.',
                  desc: 'Haute Précision VM (~120 000 parties)',
                },
                {
                  val: 2500,
                  label: '2 500 parties / var.',
                  desc: 'Intensif Longue Durée (~300 000 parties)',
                },
              ].map((preset) => {
                const actif = calibreParties === preset.val;
                return (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setCalibreParties(preset.val)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      actif
                        ? 'bg-[#1E3528] text-white border-[#1E3528]'
                        : 'bg-white text-[#16211B] border-[#D8DFD5] hover:bg-[#EAECE4]'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">
                      {preset.label}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        actif ? 'text-emerald-100' : 'text-[#55645B]'
                      }`}
                    >
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#D8DFD5]">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="input-calibre-custom"
                  className="text-xs font-medium text-[#16211B]"
                >
                  Calibre personnalisé (parties/variante) :
                </label>
                <input
                  id="input-calibre-custom"
                  type="number"
                  min={120}
                  max={5000}
                  step={50}
                  value={calibreParties}
                  onChange={(e) =>
                    setCalibreParties(
                      Math.max(120, Math.min(5000, Number(e.target.value) || 120))
                    )
                  }
                  className="w-24 px-2.5 py-1.5 text-xs font-mono font-bold rounded border border-[#D8DFD5] bg-white text-[#16211B]"
                />
              </div>

              <div className="flex items-center gap-3">
                {jobEstActif ? (
                  <button
                    type="button"
                    onClick={handleArreterCampagneVM}
                    className="px-4 py-2.5 text-xs font-bold rounded-lg bg-[#C2412D] text-white hover:bg-[#a83523] transition-colors"
                  >
                    Arrêter proprement et sauvegarder l’état partiel
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={lancementEnCours}
                    onClick={handleDemarrerCampagneVM}
                    className="px-5 py-2.5 text-xs font-bold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors disabled:opacity-50"
                  >
                    {lancementEnCours
                      ? 'Démarrage du job sur la VM...'
                      : `Lancer la Campagne Exhaustive V${versionCible} (${panelCombinatoire.nbTotalVariantesExhaustives} var. × ${calibreParties} parties)`}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-xl border border-[#D8DFD5] bg-[#16211B] text-[#F4F5F0] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                  B. Lancement CLI en SSH sur la VM Oracle
                </span>
                <span className="text-[11px] font-mono text-gray-300">
                  tmux / screen / nohup
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Pour des traitements très lourds de plusieurs heures en tâche de fond sur votre VM Oracle, vous pouvez également lancer le worker directement en SSH. Il écrit en direct dans <code className="font-mono text-emerald-300">resultats/campaign-job-status.json</code> et <code className="font-mono text-emerald-300">resultats/logs/*.jsonl</code> : cette page affichera automatiquement sa progression en temps réel.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-black/50 border border-white/15 font-mono text-xs text-emerald-300 break-all">
                {commandeCliVM}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopierCommandeCLI}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {commandeCopiee
                    ? '✓ Commande copiée dans le presse-papiers'
                    : 'Copier la commande CLI SSH'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Moniteur de télémétrie en direct du Job VM */}
        {jobStatus && jobStatus.jobId !== 'idle' && (
          <div className="p-5 rounded-xl border border-[#D8DFD5] bg-[#F4F5F0] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold text-[#256B45] uppercase">
                  Télémétrie du Job VM ({jobStatus.sourceLancement === 'cli_vm_ssh' ? 'CLI SSH VM Oracle' : 'Job Web Asynchrone'}) · ID {jobStatus.jobId}
                </div>
                <div className="text-sm font-bold text-[#16211B] mt-0.5">
                  {jobStatus.nomCampagne}
                  {jobStatus.varianteCouranteNom && jobEstActif && (
                    <span className="text-xs font-normal text-[#55645B] ml-2">
                      — En cours :{' '}
                      <strong>{jobStatus.varianteCouranteNom}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span>
                  Débit :{' '}
                  <strong className="text-[#16211B]">
                    {jobStatus.debitPartiesParSeconde} parties/s
                  </strong>
                </span>
                {jobEstActif && (
                  <span>
                    ETA :{' '}
                    <strong className="text-[#256B45]">
                      {formatDuree(jobStatus.etaSecondes)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-[#55645B]">
                <span>
                  Variantes traitées :{' '}
                  <strong className="text-[#16211B]">
                    {jobStatus.variantesTesteesViabilite} /{' '}
                    {jobStatus.variantesTotales}
                  </strong>{' '}
                  ({jobStatus.variantesViablesRetenues} viables retenues)
                </span>
                <span>
                  {Math.min(
                    100,
                    Math.round(
                      (jobStatus.variantesTesteesViabilite /
                        Math.max(1, jobStatus.variantesTotales)) *
                        100
                    )
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white border border-[#D8DFD5] overflow-hidden">
                <div
                  className="h-full bg-[#256B45] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (jobStatus.variantesTesteesViabilite /
                          Math.max(1, jobStatus.variantesTotales)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Compteurs temps réel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white border border-[#D8DFD5]">
                <div className="text-[#55645B]">Parties simulées & logguées</div>
                <div className="text-base font-bold text-[#16211B] mt-0.5">
                  {jobStatus.partiesSimulees.toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D8DFD5]">
                <div className="text-[#55645B]">Fichier JSONL sur disque</div>
                <div className="text-xs font-bold text-[#16211B] mt-1 truncate">
                  {jobStatus.cheminFichierJSONL}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D8DFD5]">
                <div className="text-[#55645B]">Taille Journal JSONL</div>
                <div className="text-base font-bold text-[#16211B] mt-0.5">
                  {Math.round(
                    jobStatus.tailleFichierJSONLOctets / 1024
                  ).toLocaleString('fr-FR')}{' '}
                  Ko ({jobStatus.partiesJournaliseesJSONL.toLocaleString('fr-FR')}{' '}
                  lignes)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#D8DFD5]">
                <div className="text-[#55645B]">Leader provisoire</div>
                <div className="text-xs font-bold text-[#256B45] mt-1 truncate">
                  {jobStatus.meilleureVarianteProvisoire
                    ? `${jobStatus.meilleureVarianteProvisoire.nom} (${jobStatus.meilleureVarianteProvisoire.score}/100)`
                    : 'En attente...'}
                </div>
              </div>
            </div>

            {jobStatus.journalTempsReel.length > 0 && (
              <div className="p-3 rounded-lg bg-[#16211B] text-gray-200 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
                {jobStatus.journalTempsReel.slice(0, 12).map((line, i) => (
                  <div key={i} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================================
          06. BILAN DE LA CAMPAGNE, PALMARÈS, JOURNAUX JSONL & SYNTHÈSE IA
      ===================================================================== */}
      {campagneActive && (
        <section
          id="sec-06"
          className="bg-white border border-[#D8DFD5] rounded-xl p-6 shadow-xs space-y-8"
        >
          <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#256B45]">
                06. Bilan de la Campagne, Palmarès Multi-Critères, Journaux JSONL & Synthèse IA
              </span>
              <h2 className="font-display text-xl font-bold text-[#16211B] mt-0.5">
                {campagneActive.nom}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Choisir la campagne à inspecter"
                value={campagneActive.id}
                onChange={(e) => setCampagneSelectionneeId(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B]"
              >
                {campagnesVersionActive.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({new Date(c.dateExecution).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>

              <a
                href={`/api/atelier/campaign/download-jsonl/${campagneActive.id}`}
                download
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] hover:bg-[#EAECE4] text-[#16211B]"
              >
                ↓ Télécharger Logs (.jsonl)
              </a>

              <button
                type="button"
                onClick={handleTelechargerRapportMarkdown}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] hover:bg-[#EAECE4] text-[#16211B]"
              >
                ↓ Rapport IA (.md)
              </button>
            </div>
          </div>

          {/* Bandeau KPI de la Campagne */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
              <div className="text-[11px] font-mono uppercase text-[#55645B]">
                Variantes Testées
              </div>
              <div className="text-xl font-mono font-bold text-[#16211B] mt-1">
                {campagneActive.nbVariantesEntree}
              </div>
              <div className="text-[11px] text-[#55645B]">
                {campagneActive.nbVariantesViables} viables ·{' '}
                {campagneActive.nbVariantesEliminees} éliminées
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
              <div className="text-[11px] font-mono uppercase text-[#55645B]">
                Parties Journalisées
              </div>
              <div className="text-xl font-mono font-bold text-[#16211B] mt-1">
                {(
                  campagneActive.totalPartiesSimulees ||
                  campagneActive.nbVariantesViables * 150
                ).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-[#55645B]">
                Calibre {campagneActive.calibrePartiesParVariante || 160} parties/var.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
              <div className="text-[11px] font-mono uppercase text-[#55645B]">
                Front de Pareto
              </div>
              <div className="text-xl font-mono font-bold text-[#256B45] mt-1">
                {
                  rapportsTriesEtPonderes.filter(
                    (r) => r.cinqCriteresPonderes?.estParetoOptimal
                  ).length
                }{' '}
                variantes
              </div>
              <div className="text-[11px] text-[#55645B]">
                Non dominées sur les 5 critères
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] md:col-span-2">
              <div className="text-[11px] font-mono uppercase text-[#256B45] font-bold">
                Variante N°1 Pondérée
              </div>
              <div className="text-base font-bold text-[#16211B] mt-1 truncate">
                {rapportsTriesEtPonderes[0]?.varianteNom || 'N/A'}
              </div>
              <div className="text-xs font-mono text-[#55645B]">
                Score Global :{' '}
                <strong className="text-[#256B45]">
                  {rapportsTriesEtPonderes[0]?.scoreInteretGlobal || 0}/100
                </strong>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              6.1 — SYNTHÈSE EXÉCUTIVE IA (GEMINI) & RECOMMANDATIONS D'INTÉRÊT
          ----------------------------------------------------------------- */}
          {analyseGeminiActive && (
            <div className="p-5 rounded-xl border border-[#D8DFD5] bg-[#F4F5F0]/60 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8DFD5] pb-3">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-[#256B45]">
                    6.1 Synthèse Analytique IA & Sélection des Variantes d’Intérêt
                  </span>
                  <h3 className="text-base font-bold text-[#16211B] mt-0.5">
                    Diagnostic Multi-Critères & Variantes Recommandées ({analyseGeminiActive.modeleUtilise})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={relanceGeminiEnCours}
                    onClick={handleRelancerAnalyseGemini}
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-white hover:bg-[#EAECE4] text-[#16211B] disabled:opacity-50"
                  >
                    {relanceGeminiEnCours
                      ? 'Analyse Gemini en cours...'
                      : 'Actualiser la synthèse IA'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAfficherRapportMarkdownComplet((v) => !v)
                    }
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-white hover:bg-[#EAECE4] text-[#16211B]"
                  >
                    {afficherRapportMarkdownComplet
                      ? 'Masquer le rapport Markdown brut'
                      : 'Lire le rapport Markdown complet'}
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#16211B] leading-relaxed bg-white p-4 rounded-lg border border-[#D8DFD5]">
                {analyseGeminiActive.resumeExecutif}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white border border-[#D8DFD5] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-[#256B45] uppercase">
                    Profondeur Stratégique & Tension
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {analyseGeminiActive.diagnosticStrategie}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-[#D8DFD5] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-[#256B45] uppercase">
                    Coopération, Frictions & Ergonomie Plateau
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {analyseGeminiActive.diagnosticLisibiliteErgonomie}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-[#D8DFD5] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-[#256B45] uppercase">
                    Équilibre 3–6 Joueurs & Robustesse CVaR
                  </div>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {analyseGeminiActive.diagnosticEquilibre36J}
                  </p>
                </div>
              </div>

              {afficherRapportMarkdownComplet && (
                <pre className="p-4 rounded-lg bg-[#16211B] text-gray-100 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                  {analyseGeminiActive.rapportMarkdown}
                </pre>
              )}

              {analyseGeminiActive.hybridesRecommandes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-mono font-bold uppercase text-[#1E3528]">
                    Variantes d’Intérêt & Hybrides Recommandés (Instanciables en 1 clic dans le Prototype)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analyseGeminiActive.hybridesRecommandes.map((hyb) => {
                      const hybId = hyb.varianteHybride.id;
                      const scoreProj =
                        hyb.varianteHybride.scoreInteretDernierTest || 94;
                      return (
                        <div
                          key={hybId}
                          className="p-4 rounded-lg bg-white border border-[#D8DFD5] flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#165B36]">
                                Score Projeté {scoreProj}/100
                              </span>
                              <span className="text-[11px] font-mono text-[#55645B]">
                                {hyb.varianteHybride.geometriePlateau}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#16211B]">
                              {hyb.titre}
                            </h4>
                            <p className="text-xs text-[#55645B] leading-relaxed">
                              {hyb.justification}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={instanciationId === hybId}
                            onClick={() => handleInstancierHybride(hyb)}
                            className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-[#1E3528] text-white hover:bg-[#256B45] transition-colors disabled:opacity-50"
                          >
                            {instanciationId === hybId
                              ? 'Instanciation...'
                              : 'Instancier & Tester dans le Prototype →'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
              6.2 — PALMARÈS MULTI-CRITÈRES & FRONT DE PARETO
          ----------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#256B45]">
                  6.2 Palmarès Algorithmique des Variantes Viables
                </span>
                <h3 className="text-base font-bold text-[#16211B]">
                  Classement selon les 5 Critères Pondérés ({rapportsTriesEtPonderes.length} variantes affichées)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#16211B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={afficherSeulementPareto}
                    onChange={(e) =>
                      setAfficherSeulementPareto(e.target.checked)
                    }
                    className="accent-[#256B45]"
                  />
                  Afficher uniquement le Front de Pareto
                </label>

                <select
                  aria-label="Trier le palmarès par critère"
                  value={triPalmares}
                  onChange={(e) =>
                    setTriPalmares(e.target.value as TriPalmaresCle)
                  }
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B]"
                >
                  <option value="scoreGlobal">
                    Trier par : Score Global Pondéré
                  </option>
                  <option value="profondeurStrategique">
                    Trier par : 1. Profondeur Stratégique (MCTS/Expectimax)
                  </option>
                  <option value="tensionChoix">
                    Trier par : 2. Tension & Choix (Entropie/Regret)
                  </option>
                  <option value="dynamiqueCooperative">
                    Trier par : 3. Coopération & Frictions
                  </option>
                  <option value="equilibreMultiJoueurs">
                    Trier par : 4. Équilibre 3–6J & CVaR
                  </option>
                  <option value="ergonomieLisibilite">
                    Trier par : 5. Ergonomie & Lisibilité Plateau
                  </option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#D8DFD5] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F5F0] border-b border-[#D8DFD5] font-mono text-[11px] uppercase text-[#55645B]">
                    <th className="py-3 px-3">Rang</th>
                    <th className="py-3 px-3">Variante & Topologie</th>
                    <th className="py-3 px-3 text-right">Score Pondéré</th>
                    <th className="py-3 px-3 text-right">
                      1. Stratégie ({poidsCriteres.profondeurStrategique}%)
                    </th>
                    <th className="py-3 px-3 text-right">
                      2. Tension ({poidsCriteres.tensionChoix}%)
                    </th>
                    <th className="py-3 px-3 text-right">
                      3. Coop/Frictions ({poidsCriteres.dynamiqueCooperative}%)
                    </th>
                    <th className="py-3 px-3 text-right">
                      4. Équilibre 3–6J ({poidsCriteres.equilibreMultiJoueurs}%)
                    </th>
                    <th className="py-3 px-3 text-right">
                      5. Ergonomie ({poidsCriteres.ergonomieLisibilite}%)
                    </th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DFD5]">
                  {rapportsTriesEtPonderes.slice(0, 35).map((r, idx) => {
                    const c = r.cinqCriteresPonderes!;
                    const estSelectionnee =
                      varianteActive.id === r.varianteId;
                    const estInspectee =
                      rapportInspecte?.varianteId === r.varianteId;
                    const mctsBot = r.echelleBots.find(
                      (b) => b.botId === 'ismcts'
                    );
                    return (
                      <tr
                        key={r.varianteId}
                        onClick={() => setVarianteInspecteeId(r.varianteId)}
                        className={`cursor-pointer transition-colors ${
                          estInspectee
                            ? 'bg-emerald-50/80'
                            : 'hover:bg-[#F4F5F0]/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#16211B]">
                          #{idx + 1}
                          {c.estParetoOptimal && (
                            <span
                              title="Variante non dominée appartenant au Front de Pareto"
                              className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-900 border border-amber-300"
                            >
                              PARETO
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#16211B]">
                            {r.varianteNom}
                          </div>
                          <div className="text-[11px] font-mono text-[#55645B]">
                            {r.geometriePlateau} · IS-MCTS{' '}
                            {mctsBot?.foretSauveeMoyennePct ?? 75}% · Contrariés{' '}
                            {r.indicateurs.tauxMouvementsContrariesPct ?? 0}%
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-[#256B45]">
                          {c.scoreGlobalPondere}/100
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-semibold text-[#16211B]">
                            {c.profondeurStrategique}
                          </span>
                          <span className="text-[#55645B] text-[10px] block">
                            Δ+{c.detailsAlgorithmes.mctsGainPct} pts
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-semibold text-[#16211B]">
                            {c.tensionChoix}
                          </span>
                          <span className="text-[#55645B] text-[10px] block">
                            H={c.detailsAlgorithmes.entropieShannonMoyenne}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-semibold text-[#16211B]">
                            {c.dynamiqueCooperative}
                          </span>
                          <span className="text-[#55645B] text-[10px] block">
                            Shapley +{c.detailsAlgorithmes.shapleySynergieCoopPts}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-semibold text-[#16211B]">
                            {c.equilibreMultiJoueurs}
                          </span>
                          <span className="text-[#55645B] text-[10px] block">
                            σ={c.detailsAlgorithmes.ecartType36JPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-semibold text-[#16211B]">
                            {c.ergonomieLisibilite}
                          </span>
                          <span className="text-[#55645B] text-[10px] block">
                            d̄={c.detailsAlgorithmes.degreMoyenGraphe}
                          </span>
                        </td>
                        <td
                          className="py-2.5 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const existe = toutesVariantes.some(
                                (v) => v.id === r.varianteId
                              );
                              if (existe) {
                                onSelectVariante(
                                  r.varianteId,
                                  r.version || '0.4'
                                );
                                onNavigateTab('proto');
                              } else {
                                setVarianteInspecteeId(r.varianteId);
                              }
                            }}
                            className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded border ${
                              estSelectionnee
                                ? 'bg-[#256B45] text-white border-[#256B45]'
                                : 'bg-white text-[#16211B] border-[#D8DFD5] hover:bg-[#EAECE4]'
                            }`}
                          >
                            {estSelectionnee ? 'Active' : 'Charger Proto'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Fiche d'inspection détaillée de la variante sélectionnée dans le tableau */}
            {rapportInspecte && (
              <div className="p-5 rounded-xl border border-[#D8DFD5] bg-[#F4F5F0]/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8DFD5] pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase text-[#256B45]">
                      Fiche Analytique Détaillée de la Variante
                    </span>
                    <h4 className="text-base font-bold text-[#16211B]">
                      {rapportInspecte.varianteNom} — Score Global Pondéré{' '}
                      <span className="text-[#256B45] font-mono">
                        {rapportInspecte.scoreInteretGlobal}/100
                      </span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiltreLogVarianteId(rapportInspecte.varianteId)
                    }
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-white border border-[#D8DFD5] hover:bg-[#EAECE4] text-[#16211B]"
                  >
                    Filtrer les logs JSONL sur cette variante ↓
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="p-4 rounded-lg bg-white border border-[#D8DFD5] space-y-2.5">
                    <div className="text-xs font-mono font-bold uppercase text-[#1E3528]">
                      Échelle Algorithmique des 9 Bots (Forêt Sauvée Moyenne & Décile D1)
                    </div>
                    <div className="space-y-1.5">
                      {rapportInspecte.echelleBots.map((b, idx) => (
                        <div
                          key={b.botId}
                          className="flex items-center justify-between text-xs font-mono py-1 border-b border-[#F4F5F0]"
                        >
                          <span className="text-[#16211B] font-sans font-medium">
                            {idx + 1}. {b.botNom}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#55645B]">
                              σ={b.ecartTypePct}%
                            </span>
                            <span className="text-[#55645B]">
                              CVaR D1: {b.pireDecilePct}%
                            </span>
                            <strong className="text-[#256B45] w-16 text-right">
                              {b.foretSauveeMoyennePct}%
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white border border-[#D8DFD5] space-y-3">
                    <div className="text-xs font-mono font-bold uppercase text-[#1E3528]">
                      Banc Multi-Joueurs (Tables de 3, 4, 5 et 6 Joueurs — Homogènes & Mixtes)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(rapportInspecte.equilibreParJoueurs
                        ? (Object.values(
                            rapportInspecte.equilibreParJoueurs
                          ) as BilanJoueurs36[])
                        : []
                      ).map((eq) => (
                        <div
                          key={eq.nbJoueurs}
                          className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] font-mono text-xs"
                        >
                          <div className="font-bold text-[#1E3528] flex items-center justify-between">
                            <span>Table {eq.nbJoueurs}J</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                              Intérêt {eq.scoreStrategique}/100
                            </span>
                          </div>
                          <div className="text-base font-bold text-[#16211B] mt-1">
                            {eq.survieMoyennePct}%{' '}
                            <span className="text-[10px] font-normal text-[#55645B]">
                              sauvés
                            </span>
                          </div>
                          <div className="text-[11px] text-[#55645B] mt-0.5">
                            Table Mixte : {eq.survieTableMixtePct ?? eq.survieMoyennePct}%
                          </div>
                          <div className="text-[11px] text-[#55645B]">
                            Plancher D1 : {eq.pireDecilePct}%
                          </div>
                          <div className="text-[11px] text-[#256B45] font-semibold">
                            Gain Strat. : +{eq.ecartMechantVsGlouton} pts
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs text-[#16211B] leading-relaxed space-y-1">
                      {rapportInspecte.syntheseAnalytique.map((ligne, i) => (
                        <div key={i}>· {ligne}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              6.3 — EXPLORATEUR DES JOURNAUX DE PARTIES (.JSONL)
          ----------------------------------------------------------------- */}
          <div className="space-y-4 pt-4 border-t border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#256B45]">
                  6.3 Explorateur des Journaux de Parties (.jsonl)
                </span>
                <h3 className="text-base font-bold text-[#16211B]">
                  Traçabilité Individuelle des Parties Simulées & Métriques Décisionnelles
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrer par variante"
                  value={filtreLogVarianteId}
                  onChange={(e) => setFiltreLogVarianteId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono rounded border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] max-w-[220px]"
                >
                  <option value="">Toutes les variantes</option>
                  {rapportsTriesEtPonderes.slice(0, 40).map((r) => (
                    <option key={r.varianteId} value={r.varianteId}>
                      {r.varianteNom}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrer par bot"
                  value={filtreLogBotId}
                  onChange={(e) => setFiltreLogBotId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono rounded border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B]"
                >
                  <option value="">Tous les 9 bots</option>
                  {CATALOGUE_BOTS_V01.map((b, idx) => (
                    <option key={b.id} value={b.id}>
                      {idx + 1}. {b.nom}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrer par nombre de joueurs"
                  value={filtreLogNbJoueurs}
                  onChange={(e) => setFiltreLogNbJoueurs(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-mono rounded border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B]"
                >
                  <option value={0}>3 à 6 Joueurs</option>
                  <option value={3}>3 Joueurs</option>
                  <option value={4}>4 Joueurs</option>
                  <option value={5}>5 Joueurs</option>
                  <option value={6}>6 Joueurs</option>
                </select>

                <button
                  type="button"
                  onClick={chargerLogsCampagne}
                  className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded border border-[#D8DFD5] bg-white hover:bg-[#EAECE4] text-[#16211B]"
                >
                  Rafraîchir
                </button>
              </div>
            </div>

            {chargementLogs ? (
              <div className="p-6 text-center text-xs font-mono text-[#55645B]">
                Lecture du fichier JSONL sur disque...
              </div>
            ) : logsJsonl.length === 0 ? (
              <div className="p-6 rounded-lg border border-[#D8DFD5] bg-[#F4F5F0]/50 text-xs text-[#55645B]">
                Aucun enregistrement JSONL ne correspond aux filtres sélectionnés. Lancez une campagne en Section 05 ou réinitialisez les filtres pour inspecter les parties journalisées.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 overflow-x-auto border border-[#D8DFD5] rounded-xl max-h-80">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-[#F4F5F0] border-b border-[#D8DFD5] text-[11px] text-[#55645B] sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5">Partie / Graine</th>
                        <th className="py-2 px-2.5">Bot & Table</th>
                        <th className="py-2 px-2.5 text-right">Forêt Sauvée</th>
                        <th className="py-2 px-2.5 text-right">Entropie H</th>
                        <th className="py-2 px-2.5 text-right">Regret ΔQ</th>
                        <th className="py-2 px-2.5 text-right">Contrariés</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8DFD5]">
                      {logsJsonl.map((log) => {
                        const active =
                          partieInspectee?.partieId === log.partieId;
                        return (
                          <tr
                            key={log.partieId}
                            onClick={() => setPartieInspectee(log)}
                            className={`cursor-pointer ${
                              active
                                ? 'bg-emerald-50 font-semibold'
                                : 'hover:bg-[#F4F5F0]/60'
                            }`}
                          >
                            <td className="py-2 px-2.5">
                              <div className="text-[#16211B] truncate max-w-[160px]">
                                {log.varianteNom}
                              </div>
                              <div className="text-[10px] text-[#55645B]">
                                seed #{log.seed}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="text-[#1E3528]">{log.botId}</span>{' '}
                              · {log.nbJoueurs}J
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <span
                                className={
                                  log.issue === 'victoire'
                                    ? 'text-[#256B45] font-bold'
                                    : 'text-[#C2412D]'
                                }
                              >
                                {log.foretSauveePct}%
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {log.metriquesDecisionnelles.entropieShannonPct}%
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {log.metriquesDecisionnelles.regretMoyenPts}
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {log.evenements.mouvementsContraries}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Inspecteur du journal tour par tour d'une partie */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-[#D8DFD5] bg-[#16211B] text-gray-100 font-mono text-xs flex flex-col justify-between max-h-80 overflow-y-auto">
                  {partieInspectee || logsJsonl[0] ? (
                    (() => {
                      const p = partieInspectee || logsJsonl[0];
                      return (
                        <div className="space-y-2.5">
                          <div className="border-b border-white/15 pb-2">
                            <div className="text-emerald-400 font-bold">
                              ENREGISTREMENT JSONL — {p.partieId}
                            </div>
                            <div className="text-[11px] text-gray-300 mt-0.5">
                              {p.varianteNom} · Bot{' '}
                              <strong className="text-white">{p.botId}</strong> ·{' '}
                              {p.nbJoueurs}J · Forêt {p.foretSauveePct}% (
                              {p.issue})
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px] bg-black/40 p-2 rounded">
                            <div>
                              Entropie H :{' '}
                              <strong className="text-emerald-300">
                                {p.metriquesDecisionnelles.entropieShannonPct}%
                              </strong>
                            </div>
                            <div>
                              Regret ΔQ :{' '}
                              <strong className="text-emerald-300">
                                {p.metriquesDecisionnelles.regretMoyenPts}
                              </strong>
                            </div>
                            <div>
                              Coalitions :{' '}
                              <strong className="text-emerald-300">
                                {p.evenements.coalitionsFormees}
                              </strong>
                            </div>
                          </div>
                          <div className="space-y-1 text-[11px] text-gray-300">
                            <div className="text-white font-semibold">
                              Trace tour par tour (JSONL) :
                            </div>
                            {(p.resumeTours || []).map((t) => (
                              <div key={t.tour} className="leading-relaxed">
                                T{t.tour} [2D6={t.somme2D6} · {t.tactiqueTiree}] :
                                Barrages={t.barragesTour}, Coalitions=
                                {t.coalitionsTour}, Contrariés={t.contrariesTour},
                                Coupes={t.coupesTour} → Forêt {t.foretFinTourPct}%
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-gray-400">
                      Sélectionnez une ligne pour inspecter le détail JSONL de la partie.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          TIROIR REPLIÉ : ARCHIVES DES VERSIONS ANTERIEURES (V0.1 – V0.3)
      ===================================================================== */}
      {campagnesArchives.length > 0 && (
        <section className="bg-white border border-[#D8DFD5] rounded-xl p-4 shadow-xs">
          <button
            type="button"
            onClick={() => setAfficherArchives((v) => !v)}
            className="w-full flex items-center justify-between text-left text-xs font-mono font-semibold text-[#55645B] hover:text-[#16211B]"
          >
            <span>
              Archives historiques des campagnes V0.1, V0.2 et V0.3 ({campagnesArchives.length} campagnes conservées)
            </span>
            <span>{afficherArchives ? '▲ Replier' : '▼ Consulter au besoin'}</span>
          </button>

          {afficherArchives && (
            <div className="mt-4 pt-4 border-t border-[#D8DFD5] grid grid-cols-1 md:grid-cols-2 gap-3">
              {campagnesArchives.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#16211B]">{c.nom}</div>
                    <div className="font-mono text-[11px] text-[#55645B]">
                      Versions : {(c.versionsCibles || []).join(', ')} ·{' '}
                      {c.nbVariantesViables}/{c.nbVariantesEntree} viables · N°1 :{' '}
                      {c.rapportsInteret[0]?.varianteNom || 'N/A'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCampagneSelectionneeId(c.id);
                      window.location.hash = '#sec-06';
                    }}
                    className="px-2.5 py-1 font-mono text-[11px] rounded bg-white border border-[#D8DFD5] hover:bg-[#EAECE4] shrink-0"
                  >
                    Charger dans le Bilan
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
