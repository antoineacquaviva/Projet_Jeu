import React, { useState } from 'react';
import {
  AnalyseGeminiCampagne,
  AtelierComponentId,
  BilanJoueurs36,
  CampagneSelection33,
  GameVersionId,
  GeometriePlateau,
  HybrideRecommandeGemini,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from '../shared/types';
import {
  construireAnalyseCampagneStructurer,
  evaluerInteretVariante32,
  evaluerViabiliteVariante31,
  executerCampagneSelection33,
  genererVariantesExploratoiresV01,
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
  onSelectVariante: (id: string, versionId?: GameVersionId) => void;
  onNavigateTab?: (tab: AtelierComponentId) => void;
  onUpdateStateFromTests: (payload: {
    variantes?: VariantV01[];
    rapportsViabilite?: RapportViabilite31[];
    rapportsInteret?: RapportInteret32[];
    campagnesSelection?: CampagneSelection33[];
    campagnesVM?: ScheduledCampaignVM[];
    analysesGemini?: AnalyseGeminiCampagne[];
    varianteActiveId?: string;
    versionActiveId?: GameVersionId;
  }) => void;
}

type TestsSubTab =
  | 'viabilite_31'
  | 'interet_32'
  | 'selection_vm_33'
  | 'analyse_gemini_34';

function libelleGeometrieCourt(geo?: GeometriePlateau): string {
  switch (geo) {
    case 'double_plateau_34_56':
      return 'Double Plateau 3–4J / 5–6J';
    case 'hex_couronne_19':
      return 'Grille Hexagonale 19 cases';
    case 'clairieres_sentiers':
      return 'Clairières & Sentiers (3 Cols)';
    default:
      return 'Modulaire (1 Secteur/J)';
  }
}

export const TestsView: React.FC<TestsViewProps> = ({
  varianteActive,
  toutesVariantes,
  rapportsViabilite,
  rapportsInteret,
  campagnesSelection,
  campagnesVM,
  analysesGemini,
  onSelectVariante,
  onNavigateTab,
  onUpdateStateFromTests,
}) => {
  const [subTab, setSubTab] = useState<TestsSubTab>('selection_vm_33');
  const [enCours, setEnCours] = useState<boolean>(false);
  const [hybrideEnCoursTitre, setHybrideEnCoursTitre] = useState<string | null>(
    null
  );
  const [notificationToast, setNotificationToast] = useState<{
    id: string;
    nom: string;
    score: number;
    geometrie: string;
  } | null>(null);
  const [messageSucces, setMessageSucces] = useState<string>('');
  const [nbPartiesViab, setNbPartiesViab] = useState<number>(16);
  const [nbPartiesInteret, setNbPartiesInteret] = useState<number>(18);
  const [inclureBotsPointe, setInclureBotsPointe] = useState<boolean>(true);
  const [testerEquilibre36J, setTesterEquilibre36J] = useState<boolean>(true);
  const [versionsCampagne, setVersionsCampagne] = useState<GameVersionId[]>([
    '0.1',
    '0.2',
    '0.3',
  ]);
  const [analyseSelectionneeId, setAnalyseSelectionneeId] = useState<string>(
    analysesGemini[0]?.id || ''
  );

  // Formulaire nouvelle tâche planifiée VM Oracle Cloud
  const [nouveauNomVM, setNouveauNomVM] = useState<string>(
    'Grand Banc Comparatif VM Oracle Cloud — V0.1 vs V0.2 vs V0.3 (9 Bots + 3–6J)'
  );
  const [nouveauCronVM, setNouveauCronVM] = useState<string>('0 2 * * *');

  const rapportViabActif =
    rapportsViabilite.find((r) => r.varianteId === varianteActive.id) || null;
  const rapportInteretActif =
    rapportsInteret.find((r) => r.varianteId === varianteActive.id) || null;

  const analyseActive =
    analysesGemini.find((a) => a.id === analyseSelectionneeId) ||
    analysesGemini[0] ||
    null;

  const toggleVersionCampagne = (ver: GameVersionId) => {
    setVersionsCampagne((prev) => {
      if (prev.includes(ver)) {
        if (prev.length === 1) return prev;
        return prev.filter((v) => v !== ver);
      }
      return [...prev, ver].sort();
    });
  };

  // 3.1 : Tester la viabilité de la variante active
  const handleRunViabiliteActive = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/tests/viabilite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          varianteId: varianteActive.id,
          nbParties: nbPartiesViab,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
        });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Exécution isomorphe directe en secours
    }
    const rap = evaluerViabiliteVariante31(varianteActive, nbPartiesViab);
    const majVars = toutesVariantes.map((v) =>
      v.id === varianteActive.id
        ? {
            ...v,
            statutViabilite: (rap.viable ? 'viable' : 'eliminee') as
              | 'viable'
              | 'eliminee',
            motifElimination: rap.motifElimination,
          }
        : v
    );
    onUpdateStateFromTests({
      variantes: majVars,
      rapportsViabilite: [
        rap,
        ...rapportsViabilite.filter((r) => r.varianteId !== varianteActive.id),
      ],
    });
    setEnCours(false);
  };

  // Générer 4 nouvelles variantes exploratoires (pour la version active) et éliminer immédiatement les non-viables
  const handleGenererEtFiltrerLot = async () => {
    setEnCours(true);
    const verCible = varianteActive.version || '0.3';
    try {
      const resp = await fetch('/api/atelier/variants/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nbVariantes: 4,
          filtrerImmediatement: true,
          versionCible: verCible,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
        });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const nouvelles = genererVariantesExploratoiresV01(
      4,
      toutesVariantes.length + 1,
      verCible
    );
    const nouvRaps: RapportViabilite31[] = [];
    for (const v of nouvelles) {
      const r = evaluerViabiliteVariante31(v, 12);
      nouvRaps.push(r);
      v.statutViabilite = r.viable ? 'viable' : 'eliminee';
      v.motifElimination = r.motifElimination;
    }
    onUpdateStateFromTests({
      variantes: [...nouvelles, ...toutesVariantes],
      rapportsViabilite: [...nouvRaps, ...rapportsViabilite],
    });
    setEnCours(false);
  };

  // Purger toutes les variantes éliminées
  const handlePurgerEliminees = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/variants/eliminated', {
        method: 'DELETE',
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({ variantes: data.state.variantes });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const restantes = toutesVariantes.filter(
      (v) => v.statutViabilite !== 'eliminee'
    );
    onUpdateStateFromTests({ variantes: restantes });
    setEnCours(false);
  };

  // 3.2 : Tester l'intérêt sur l'échelle des 9 bots + banc 3-6 joueurs
  const handleRunInteretActive = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/tests/interet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          varianteId: varianteActive.id,
          nbPartiesParBot: nbPartiesInteret,
          inclureBotsPointe,
          testerEquilibre36J,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsInteret: data.state.rapportsInteret,
        });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const rap = evaluerInteretVariante32(varianteActive, nbPartiesInteret);
    const majVars = toutesVariantes.map((v) =>
      v.id === varianteActive.id
        ? {
            ...v,
            scoreInteretDernierTest: rap.scoreInteretGlobal,
            bandeSante: rap.bandeSante,
          }
        : v
    );
    onUpdateStateFromTests({
      variantes: majVars,
      rapportsInteret: [
        rap,
        ...rapportsInteret.filter((r) => r.varianteId !== varianteActive.id),
      ],
    });
    setEnCours(false);
  };

  // 3.3 : Lancer une campagne complète de sélection multi-versions (V0.1, V0.2, V0.3) + Analyse Gemini
  const handleRunCampagneComplete = async () => {
    setEnCours(true);
    const nomCampagne = `Campagne Multi-Versions ${versionsCampagne
      .map((v) => `V${v}`)
      .join(' · ')} (${inclureBotsPointe ? '9 Bots dont IS-MCTS' : '6 Bots'}${
      testerEquilibre36J ? ' + Banc 3–6J' : ''
    })`;
    try {
      const resp = await fetch('/api/atelier/tests/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomCampagne,
          nbPartiesViabilite: nbPartiesViab,
          nbPartiesInteret: nbPartiesInteret,
          inclureDejaEliminees: false,
          versionsCibles: versionsCampagne,
          inclureBotsPointe,
          testerEquilibre36J,
          lancerAnalyseGemini: true,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
          rapportsInteret: data.state.rapportsInteret,
          campagnesSelection: data.state.campagnesSelection,
          analysesGemini: data.state.analysesGemini,
        });
        if (data.analyseGemini) {
          setAnalyseSelectionneeId(data.analyseGemini.id);
        }
        setMessageSucces(
          `Campagne ${versionsCampagne.map((v) => `V${v}`).join(' + ')} terminée et analysée par Gemini !`
        );
        setTimeout(() => setMessageSucces(''), 6000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const cibles = toutesVariantes.filter(
      (v) => v.statutViabilite !== 'eliminee'
    );
    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      nomCampagne,
      nbPartiesViab,
      nbPartiesInteret,
      versionsCampagne
    );
    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    const toutesMaj = toutesVariantes.map((v) => mapMaj.get(v.id) || v);
    const analyseLocale = construireAnalyseCampagneStructurer(campagne);
    setAnalyseSelectionneeId(analyseLocale.id);
    onUpdateStateFromTests({
      variantes: toutesMaj,
      rapportsViabilite: [...campagne.rapportsViabilite, ...rapportsViabilite],
      rapportsInteret: [...campagne.rapportsInteret, ...rapportsInteret],
      campagnesSelection: [campagne, ...campagnesSelection],
      analysesGemini: [analyseLocale, ...analysesGemini],
    });
    setEnCours(false);
  };

  // Exécuter immédiatement une tâche VM Oracle Cloud
  const handleRunVMNow = async (scheduleId: string) => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/vm/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
          rapportsInteret: data.state.rapportsInteret,
          campagnesSelection: data.state.campagnesSelection,
          campagnesVM: data.state.campagnesPlanifieesVM,
          analysesGemini: data.state.analysesGemini,
        });
        if (data.analyseGemini) {
          setAnalyseSelectionneeId(data.analyseGemini.id);
        }
        setMessageSucces(
          'Campagne VM Oracle Cloud exécutée avec succès et synthèse Gemini mise à jour !'
        );
        setTimeout(() => setMessageSucces(''), 6000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback
    }
    await handleRunCampagneComplete();
  };

  // Relancer une analyse Gemini sur une campagne donnée
  const handleRelancerAnalyseGemini = async (campagneId?: string) => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/campaigns/analyze-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campagneId: campagneId || campagnesSelection[0]?.id,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          analysesGemini: data.state.analysesGemini,
        });
        if (data.analyse?.id) {
          setAnalyseSelectionneeId(data.analyse.id);
        }
        setMessageSucces('Analyse Gemini régénérée avec succès !');
        setTimeout(() => setMessageSucces(''), 5000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const camp =
      campagnesSelection.find((c) => c.id === campagneId) ||
      campagnesSelection[0];
    if (camp) {
      const ana = construireAnalyseCampagneStructurer(camp);
      setAnalyseSelectionneeId(ana.id);
      onUpdateStateFromTests({
        analysesGemini: [ana, ...analysesGemini],
      });
    }
    setEnCours(false);
  };

  // Instancier en 1 clic une variante hybride recommandée par Gemini
  const handleCreerHybrideUnClic = async (hybride: HybrideRecommandeGemini) => {
    setEnCours(true);
    setHybrideEnCoursTitre(hybride.titre);
    try {
      const resp = await fetch(
        '/api/atelier/variants/from-gemini-recommendation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hybride,
            evaluerImmediatement: true,
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const score = data.variante.scoreInteretDernierTest ?? 90;
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
          rapportsInteret: data.state.rapportsInteret,
          varianteActiveId: data.variante.id,
          versionActiveId: data.variante.version || '0.3',
        });
        onSelectVariante(data.variante.id, data.variante.version || '0.3');
        const msg = `Variante hybride « ${data.variante.nom} » créée, évaluée (Score ${score}/100) et activée !`;
        setMessageSucces(msg);
        setNotificationToast({
          id: data.variante.id,
          nom: data.variante.nom,
          score,
          geometrie: data.variante.geometriePlateau || 'double_plateau_34_56',
        });
        setTimeout(() => setMessageSucces(''), 8000);
        setEnCours(false);
        setHybrideEnCoursTitre(null);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const nouv: VariantV01 = {
      ...hybride.varianteHybride,
      id:
        hybride.varianteHybride?.id ||
        `v03_hybride_${Date.now().toString(36)}`,
      version: hybride.varianteHybride?.version || '0.3',
      origine: 'hybride_gemini',
      statutViabilite: 'viable',
    };
    const rapViab = evaluerViabiliteVariante31(nouv, 4);
    const rapInt = evaluerInteretVariante32(nouv, 4);
    nouv.scoreInteretDernierTest = rapInt.scoreInteretGlobal;
    nouv.bandeSante = rapInt.bandeSante;
    const majVariantes = [
      nouv,
      ...toutesVariantes.filter((v) => v.id !== nouv.id),
    ];
    onUpdateStateFromTests({
      variantes: majVariantes,
      rapportsViabilite: [
        rapViab,
        ...rapportsViabilite.filter((r) => r.varianteId !== nouv.id),
      ],
      rapportsInteret: [
        rapInt,
        ...rapportsInteret.filter((r) => r.varianteId !== nouv.id),
      ],
      varianteActiveId: nouv.id,
      versionActiveId: nouv.version || '0.3',
    });
    onSelectVariante(nouv.id, nouv.version || '0.3');
    const msg = `Variante hybride « ${nouv.nom} » créée et activée (Score ${nouv.scoreInteretDernierTest}/100) !`;
    setMessageSucces(msg);
    setNotificationToast({
      id: nouv.id,
      nom: nouv.nom,
      score: nouv.scoreInteretDernierTest ?? 90,
      geometrie: nouv.geometriePlateau || 'double_plateau_34_56',
    });
    setTimeout(() => setMessageSucces(''), 8000);
    setEnCours(false);
    setHybrideEnCoursTitre(null);
  };

  // Télécharger le rapport Markdown Gemini
  const handleDownloadMarkdown = (analyse: AnalyseGeminiCampagne) => {
    const blob = new Blob([analyse.rapportMarkdown], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-gemini-${analyse.campagneId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ajouter une nouvelle planification VM Oracle Cloud
  const handleAddScheduleVM = async () => {
    if (!nouveauNomVM.trim()) return;
    const nouv: ScheduledCampaignVM = {
      id: `vm_sched_${Date.now().toString(36)}`,
      nom: nouveauNomVM.trim(),
      cibleExecution: 'vm_oracle_cloud',
      cronExpression: nouveauCronVM,
      actif: true,
      nbVariantesAGenerer: 6,
      nbPartiesViabilite: nbPartiesViab,
      nbPartiesInteret: nbPartiesInteret,
      eliminerNonViablesAuto: true,
      autoCommitGithub: false,
      versionsCibles: versionsCampagne,
      inclureBotsPointe: true,
      testerEquilibre36J: true,
      prochaineExecutionEstimee: 'Cette nuit à 02:00 (VM Oracle Cloud)',
      statut: 'planifiee',
      journalVM: [
        `[${new Date().toLocaleTimeString('fr-FR')}] Tâche planifiée multi-versions (${versionsCampagne
          .map((v) => `V${v}`)
          .join(', ')}) enregistrée pour le démon VM Oracle Cloud (scripts/vm-worker.ts).`,
      ],
    };
    try {
      const resp = await fetch('/api/atelier/vm/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouv),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          campagnesVM: data.state.campagnesPlanifieesVM,
        });
        return;
      }
    } catch (_e) {
      // Fallback
    }
    onUpdateStateFromTests({ campagnesVM: [nouv, ...campagnesVM] });
  };

  const nbEliminees = toutesVariantes.filter(
    (v) => v.statutViabilite === 'eliminee'
  ).length;
  const nbViables = toutesVariantes.filter(
    (v) => v.statutViabilite === 'viable'
  ).length;

  const listeEquilibre36: BilanJoueurs36[] = rapportInteretActif?.equilibreParJoueurs
    ? ([3, 4, 5, 6] as const).map(
        (n) => rapportInteretActif.equilibreParJoueurs![n]
      )
    : [];

  return (
    <div className="space-y-6">
      {/* En-tête du composant Tests */}
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            Tests — Banc Multi-Versions (V0.1 · V0.2 · V0.3), 9 Bots de Pointe, Équilibre 3–6J & Synthèse Gemini
          </h2>
          <p className="text-xs text-[#55645B]">
            Évaluez la Stratégie (9 bots jusqu’à IS-MCTS), la Lisibilité/Ergonomie des nouvelles géométries V0.3 et l’Équilibre de 3 à 6 joueurs, puis générez des variantes hybrides recommandées par Gemini.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-tabular">
          <div>
            Variantes Viables :{' '}
            <strong className="text-[#256B45]">{nbViables}</strong>
          </div>
          <div>
            Éliminées :{' '}
            <strong className="text-[#C2412D]">{nbEliminees}</strong>
          </div>
          {nbEliminees > 0 && (
            <button
              onClick={handlePurgerEliminees}
              disabled={enCours}
              className="px-3 py-1.5 rounded-lg bg-[#C2412D] text-white font-sans font-semibold hover:bg-red-800 whitespace-nowrap shrink-0"
            >
              Purger les {nbEliminees} éliminées
            </button>
          )}
        </div>
      </div>

      {messageSucces && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#256B45] text-xs font-semibold text-[#16211B] flex items-center justify-between">
          <span>{messageSucces}</span>
          <button
            onClick={() => setMessageSucces('')}
            className="text-[#55645B] hover:text-[#16211B] font-mono-tabular"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Navigation des 4 sous-sections du composant Tests */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8DFD5] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('viabilite_31')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'viabilite_31'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.1 Viabilité & Coupe-Circuit
          </button>
          <button
            onClick={() => setSubTab('interet_32')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'interet_32'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.2 Intérêt (9 Bots), Ergonomie & Banc 3–6J
          </button>
          <button
            onClick={() => setSubTab('selection_vm_33')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'selection_vm_33'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.3 Campagnes V0.1 · V0.2 · V0.3 & VM Oracle
          </button>
          <button
            onClick={() => setSubTab('analyse_gemini_34')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'analyse_gemini_34'
                ? 'bg-[#256B45] text-white'
                : 'bg-emerald-50 text-[#1E3528] border border-[#256B45]/40 hover:bg-emerald-100'
            }`}
          >
            3.4 Analyse & Recommandations Gemini ({analysesGemini.length})
          </button>
        </div>

        {/* Sélecteur rapide de la variante inspectée */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#55645B] font-medium">Variante inspectée :</span>
          <select
            value={varianteActive.id}
            onChange={(e) => onSelectVariante(e.target.value)}
            className="px-2.5 py-1.5 border border-[#D8DFD5] rounded-lg bg-white font-semibold text-[#16211B] max-w-[290px]"
          >
            {toutesVariantes.map((v) => (
              <option key={v.id} value={v.id}>
                [V{v.version || '0.1'}] {v.statutViabilite === 'eliminee' ? '✗ ' : '✓ '}
                {v.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================================
          SOUS-ONGLET 3.1 : TESTS DE VIABILITÉ & ÉLIMINATION DIRECTE
          ===================================================================== */}
      {subTab === 'viabilite_31' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#256B45] font-semibold">
                SOUS-SECTION 3.1 — FILTRE COUPE-CIRCUIT DE VIABILITÉ
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                {varianteActive.nom} (Version {varianteActive.version || '0.1'} ·{' '}
                {libelleGeometrieCourt(varianteActive.geometriePlateau)})
              </h3>
              <p className="text-xs text-[#55645B] mt-0.5">
                Vérifie les 5 invariants éliminatoires : Terminaison, Plancher Inerte (&lt; 65 %), Plafond Déductif (&gt; 42 %), Gain de compétence (≥ +12 pts) et Anti-Boucle aveugle (≥ +6 pts).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#55645B]">Parties / bot :</span>
                <input
                  type="number"
                  min={6}
                  max={60}
                  value={nbPartiesViab}
                  onChange={(e) => setNbPartiesViab(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-[#D8DFD5] rounded font-mono-tabular text-center"
                />
              </div>
              <button
                onClick={handleRunViabiliteActive}
                disabled={enCours}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
              >
                {enCours ? 'Test en cours...' : 'Lancer Test 3.1 sur cette variante'}
              </button>
              <button
                onClick={handleGenererEtFiltrerLot}
                disabled={enCours}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
              >
                Générer + Filtrer 4 variantes V{varianteActive.version || '0.3'}
              </button>
            </div>
          </div>

          {rapportViabActif && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div
                className={`lg:col-span-4 rounded-xl p-5 border flex flex-col justify-between ${
                  rapportViabActif.viable
                    ? 'bg-emerald-50/70 border-[#256B45]'
                    : 'bg-red-50/80 border-[#C2412D]'
                }`}
              >
                <div>
                  <div className="text-xs font-mono-tabular uppercase font-bold text-[#55645B]">
                    VERDICT DU COUPE-CIRCUIT 3.1
                  </div>
                  <div
                    className={`font-display text-2xl font-bold mt-1 ${
                      rapportViabActif.viable
                        ? 'text-[#256B45]'
                        : 'text-[#C2412D]'
                    }`}
                  >
                    {rapportViabActif.viable
                      ? 'VARIANTE VIABLE'
                      : 'ÉLIMINÉE (NON VIABLE)'}
                  </div>
                  <p className="text-xs text-[#16211B] mt-2 leading-relaxed">
                    {rapportViabActif.motifElimination ||
                      'Tous les critères éliminatoires sont validés.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-xs font-mono-tabular">
                  <span>Parties testées : {rapportViabActif.nbPartiesTestees}</span>
                  <span>Durée : {rapportViabActif.dureeMs} ms</span>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-[#D8DFD5]">
                <h4 className="font-display text-sm font-semibold text-[#16211B] mb-3">
                  Détail des 5 Invariants Éliminatoires (Protocole 3.1)
                </h4>
                <div className="space-y-2.5">
                  {rapportViabActif.criteres.map((c) => (
                    <div
                      key={c.code}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-4 ${
                        c.valide
                          ? 'bg-[#F4F5F0] border-[#D8DFD5]'
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#16211B]">
                          {c.valide ? '✓ ' : '✗ '}
                          {c.intitule}
                        </div>
                        <div className="text-xs text-[#55645B] mt-0.5">
                          {c.detail}
                        </div>
                      </div>
                      <div className="text-right font-mono-tabular shrink-0">
                        <div
                          className={`text-xs font-bold ${
                            c.valide ? 'text-[#256B45]' : 'text-[#C2412D]'
                          }`}
                        >
                          {c.valeurObservee}
                        </div>
                        <div className="text-[10px] text-[#55645B]">
                          Seuil : {c.seuilAttendu}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SOUS-ONGLET 3.2 : INTÉRÊT STRATÉGIQUE (9 BOTS), ERGONOMIE & BANC 3–6J
          ===================================================================== */}
      {subTab === 'interet_32' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#256B45] font-semibold">
                SOUS-SECTION 3.2 — ÉCHELLE DES 9 BOTS (DONT IS-MCTS), ERGONOMIE & BANC 3–6 JOUEURS
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                {varianteActive.nom} · {libelleGeometrieCourt(varianteActive.geometriePlateau)}
              </h3>
              <p className="text-xs text-[#55645B] mt-0.5">
                Évalue vos 3 priorités : Intérêt Stratégique (gain des algorithmes de pointe), Lisibilité & Ergonomie du plateau, et Équilibre de 3 à 6 joueurs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#55645B]">Parties / bot :</span>
                <input
                  type="number"
                  min={8}
                  max={80}
                  value={nbPartiesInteret}
                  onChange={(e) => setNbPartiesInteret(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-[#D8DFD5] rounded font-mono-tabular text-center"
                />
              </div>
              <button
                onClick={handleRunInteretActive}
                disabled={enCours}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
              >
                {enCours
                  ? 'Simulation en cours...'
                  : 'Évaluer (9 Bots + Banc 3–6J)'}
              </button>
            </div>
          </div>

          {!rapportInteretActif ? (
            <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] text-center">
              <p className="text-sm text-[#55645B] mb-3">
                Aucun rapport d’évaluation 3.2 n’a encore été généré pour «{' '}
                <strong>{varianteActive.nom}</strong> ».
              </p>
              <button
                onClick={handleRunInteretActive}
                disabled={enCours}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637]"
              >
                Lancer l’évaluation 9 Bots + 3–6 Joueurs maintenant
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Bandeau des 3 Axes Prioritaires de Conception (Stratégie, Lisibilité/Ergonomie, Équilibre 3-6J) */}
              {rapportInteretActif.troisAxesPrioritaires && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-[#256B45]/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular uppercase font-bold text-[#256B45]">
                        PRIORITÉ 1 · INTÉRÊT STRATÉGIQUE
                      </span>
                      <span className="font-mono-tabular text-xl font-bold text-[#16211B]">
                        {rapportInteretActif.troisAxesPrioritaires.interetStrategique}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5">
                      {rapportInteretActif.troisAxesPrioritaires.detailStrategie}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#256B45]/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular uppercase font-bold text-[#256B45]">
                        PRIORITÉ 2 · LISIBILITÉ & ERGONOMIE
                      </span>
                      <span className="font-mono-tabular text-xl font-bold text-[#16211B]">
                        {rapportInteretActif.troisAxesPrioritaires.lisibiliteErgonomie}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5">
                      {rapportInteretActif.troisAxesPrioritaires.detailErgonomie}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#256B45]/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular uppercase font-bold text-[#256B45]">
                        PRIORITÉ 3 · ÉQUILIBRE 3 À 6 JOUEURS
                      </span>
                      <span className="font-mono-tabular text-xl font-bold text-[#16211B]">
                        {rapportInteretActif.troisAxesPrioritaires.equilibreJoueurs36}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5">
                      {rapportInteretActif.troisAxesPrioritaires.detailEquilibre36}
                    </p>
                  </div>
                </div>
              )}

              {/* Graphique de progression de l'échelle des 9 Bots */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-[#16211B]">
                      Échelle de Compétence des {rapportInteretActif.echelleBots.length} Bots (% moyen de Forêt sauvée)
                    </h4>
                    <p className="text-xs text-[#55645B]">
                      Une variante profonde montre un escalier croissant régulier depuis le Bot Inerte jusqu’aux algorithmes Expectimax Bayésien, Beam Rollout et IS-MCTS.
                    </p>
                  </div>
                  <div className="font-mono-tabular text-sm font-bold text-[#256B45]">
                    Score Global : {rapportInteretActif.scoreInteretGlobal}/100
                  </div>
                </div>

                <div className="space-y-2.5">
                  {rapportInteretActif.echelleBots.map((b, idx) => {
                    const estPointe =
                      b.botId === 'expectimax_bayesien' ||
                      b.botId === 'beam_rollout' ||
                      b.botId === 'ismcts';
                    const couleurBarre =
                      b.botId === 'boucle'
                        ? 'bg-amber-600'
                        : estPointe
                        ? 'bg-[#1E3528]'
                        : idx >= 4
                        ? 'bg-[#256B45]'
                        : 'bg-slate-600';
                    return (
                      <div
                        key={b.botId}
                        className="grid grid-cols-12 items-center gap-3 text-xs"
                      >
                        <div className="col-span-4 sm:col-span-3 font-medium text-[#16211B] truncate">
                          {idx + 1}. {b.botNom}
                        </div>
                        <div className="col-span-5 sm:col-span-6 bg-[#EAECE4] h-5 rounded overflow-hidden relative">
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(2, b.foretSauveeMoyennePct)
                              )}%`,
                            }}
                            className={`h-full ${couleurBarre}`}
                          />
                        </div>
                        <div className="col-span-3 font-mono-tabular text-right text-[#16211B]">
                          <strong>{b.foretSauveeMoyennePct}%</strong>{' '}
                          <span className="text-[#55645B] text-[11px]">
                            (±{b.ecartTypePct} · D1:{b.pireDecilePct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Banc d'Équilibre 3, 4, 5 et 6 Joueurs */}
              {listeEquilibre36.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-display text-sm font-semibold text-[#16211B]">
                        Banc d’Équilibrage selon le Nombre de Joueurs (3, 4, 5 et 6 Joueurs)
                      </h4>
                      <p className="text-xs text-[#55645B]">
                        {rapportInteretActif.troisAxesPrioritaires?.detailEquilibre36}
                      </p>
                    </div>
                    <div className="font-mono-tabular text-xs text-[#256B45] font-bold">
                      Score Équilibre 3–6J :{' '}
                      {rapportInteretActif.troisAxesPrioritaires?.equilibreJoueurs36 ?? 84}/100
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                          <th className="py-2 pr-3">Configuration</th>
                          <th className="py-2 px-3">Survie Moyenne Forêt</th>
                          <th className="py-2 px-3">Pire Décile (D1)</th>
                          <th className="py-2 px-3">Sabotages Moyens</th>
                          <th className="py-2 px-3">Gain Coopération (vs Glouton)</th>
                          <th className="py-2 pl-3">Score Stratégique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAECE4] font-mono-tabular">
                        {listeEquilibre36.map((row) => (
                          <tr key={row.nbJoueurs}>
                            <td className="py-2.5 pr-3 font-sans font-semibold text-[#16211B]">
                              {row.nbJoueurs} Joueurs
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#16211B]">
                              {row.survieMoyennePct}%
                            </td>
                            <td className="py-2.5 px-3">{row.pireDecilePct}%</td>
                            <td className="py-2.5 px-3">{row.sabotagesMoyens}</td>
                            <td className="py-2.5 px-3 text-[#256B45] font-semibold">
                              +{row.ecartMechantVsGlouton} pts
                            </td>
                            <td className="py-2.5 pl-3 font-bold text-[#256B45]">
                              {row.scoreStrategique}/100
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SOUS-ONGLET 3.3 : CAMPAGNES MULTI-VERSIONS (V0.1 · V0.2 · V0.3) & VM
          ===================================================================== */}
      {subTab === 'selection_vm_33' && (
        <div className="space-y-6">
          {/* Lancement d'une campagne multi-versions V0.1, V0.2, V0.3 */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#256B45] font-semibold">
                  SOUS-SECTION 3.3 — CAMPAGNE INTENSIVE MULTI-VERSIONS (V0.1 · V0.2 · V0.3)
                </div>
                <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                  Banc Comparatif des Versions et Géométries de Plateau + Synthèse Gemini Automatique
                </h3>
                <p className="text-xs text-[#55645B]">
                  Comparez simultanément les variantes des versions 0.1, 0.2 et 0.3 avec les 9 bots (dont IS-MCTS, Beam Rollout et Expectimax Bayésien) et le banc 3–6 joueurs.
                </p>
              </div>

              <button
                onClick={handleRunCampagneComplete}
                disabled={enCours}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
              >
                {enCours
                  ? 'Calcul intensif VM en cours...'
                  : `Lancer Campagne (${versionsCampagne
                      .map((v) => `V${v}`)
                      .join(' + ')}) & Analyse Gemini`}
              </button>
            </div>

            <div className="pt-3 border-t border-[#EAECE4] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-[#16211B]">
                  Versions incluses :
                </span>
                {(['0.1', '0.2', '0.3'] as GameVersionId[]).map((ver) => (
                  <label
                    key={ver}
                    className="flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={versionsCampagne.includes(ver)}
                      onChange={() => toggleVersionCampagne(ver)}
                    />
                    <span>Version {ver}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={inclureBotsPointe}
                    onChange={(e) => setInclureBotsPointe(e.target.checked)}
                  />
                  <span>Activer les 3 Bots de Pointe (IS-MCTS / Beam / Bayes)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={testerEquilibre36J}
                    onChange={(e) => setTesterEquilibre36J(e.target.checked)}
                  />
                  <span>Banc complet 3, 4, 5 et 6 Joueurs</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tableau de classement de la dernière campagne */}
          {campagnesSelection.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#16211B]">
                    Palmarès Multi-Versions — {campagnesSelection[0].nom}
                  </h4>
                  <p className="text-xs text-[#55645B]">
                    {campagnesSelection[0].nbVariantesViables} variantes viables retenues sur{' '}
                    {campagnesSelection[0].nbVariantesEntree} testées.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab('analyse_gemini_34')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1E3528] text-white hover:bg-black whitespace-nowrap shrink-0"
                >
                  Ouvrir l’Analyse Gemini & Hybrides Recommandés →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                      <th className="py-2 pr-2">Rang</th>
                      <th className="py-2 px-2">Ver.</th>
                      <th className="py-2 px-2">Variante</th>
                      <th className="py-2 px-2">Géométrie Plateau</th>
                      <th className="py-2 px-2">Stratégie</th>
                      <th className="py-2 px-2">Ergonomie</th>
                      <th className="py-2 px-2">Équilibre 3–6J</th>
                      <th className="py-2 px-2">Gain IA Pointe</th>
                      <th className="py-2 px-2">Score Global</th>
                      <th className="py-2 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECE4]">
                    {campagnesSelection[0].rapportsInteret.map((r, i) => (
                      <tr
                        key={r.varianteId}
                        className={
                          r.varianteId === varianteActive.id
                            ? 'bg-emerald-50/70'
                            : 'hover:bg-[#F4F5F0]'
                        }
                      >
                        <td className="py-2.5 pr-2 font-mono-tabular font-bold text-[#16211B]">
                          #{i + 1}
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular font-semibold text-[#256B45]">
                          V{r.version || '0.1'}
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-[#16211B]">
                          {r.varianteNom}
                        </td>
                        <td className="py-2.5 px-2 text-[#55645B]">
                          {libelleGeometrieCourt(r.geometriePlateau)}
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular font-semibold">
                          {r.troisAxesPrioritaires?.interetStrategique ??
                            r.scoreInteretGlobal}
                          /100
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular font-semibold">
                          {r.troisAxesPrioritaires?.lisibiliteErgonomie ?? 80}
                          /100
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular font-semibold">
                          {r.troisAxesPrioritaires?.equilibreJoueurs36 ?? 82}
                          /100
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular text-[#256B45] font-semibold">
                          +{r.indicateurs.gainBotsPointeSurDeductif ?? 0} pts
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular font-bold text-[#1E3528]">
                          {r.scoreInteretGlobal}/100
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          <button
                            onClick={() => {
                              onSelectVariante(r.varianteId);
                              setSubTab('interet_32');
                            }}
                            className="text-xs font-semibold text-[#256B45] hover:underline"
                          >
                            Inspecter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Planificateur VM Oracle Cloud */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-sm font-bold text-[#16211B]">
                  Tâches Planifiées sur votre VM Oracle Cloud (`scripts/vm-worker.ts`)
                </h4>
                <p className="text-xs text-[#55645B]">
                  Exécutez immédiatement un banc lourd sur votre VM ou planifiez des campagnes nocturnes automatiques.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nouveauNomVM}
                  onChange={(e) => setNouveauNomVM(e.target.value)}
                  placeholder="Nom de la tâche VM"
                  className="px-3 py-1.5 text-xs border border-[#D8DFD5] rounded-lg w-64"
                />
                <input
                  type="text"
                  value={nouveauCronVM}
                  onChange={(e) => setNouveauCronVM(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg w-28"
                />
                <button
                  onClick={handleAddScheduleVM}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
                >
                  + Planifier sur la VM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campagnesVM.map((cvm) => (
                <div
                  key={cvm.id}
                  className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-[#16211B]">
                        {cvm.nom}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-[#256B45] font-semibold">
                        Cron : {cvm.cronExpression}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#55645B] font-mono-tabular mt-1">
                      Versions :{' '}
                      {(cvm.versionsCibles || ['0.1', '0.2', '0.3'])
                        .map((v: GameVersionId) => `V${v}`)
                        .join(', ')}{' '}
                      · Viabilité : {cvm.nbPartiesViabilite}p · Intérêt :{' '}
                      {cvm.nbPartiesInteret}p/bot
                    </div>
                    {cvm.journalVM && cvm.journalVM.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-white border border-[#D8DFD5] text-[11px] text-[#55645B] font-mono-tabular">
                        {cvm.journalVM[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D8DFD5]">
                    <span className="text-[11px] text-[#55645B]">
                      {cvm.prochaineExecutionEstimee}
                    </span>
                    <button
                      onClick={() => handleRunVMNow(cvm.id)}
                      disabled={enCours}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637]"
                    >
                      Exécuter maintenant sur la VM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SOUS-ONGLET 3.4 : ANALYSE & RECOMMANDATIONS GEMINI (HYBRIDES 1-CLIC)
          ===================================================================== */}
      {subTab === 'analyse_gemini_34' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#256B45] font-semibold">
                SOUS-SECTION 3.4 — SYNTHÈSE ANALYTIQUE GEMINI & RECOMMANDATIONS D’HYBRIDATION
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                Diagnostic Croisé V0.1 · V0.2 · V0.3 (Stratégie, Lisibilité/Ergonomie, Équilibre 3–6J)
              </h3>
              <p className="text-xs text-[#55645B]">
                Analyse des résultats de campagne et création en 1 clic de variantes hybrides combinant les meilleures géométries V0.3 avec les mécaniques V0.1 et V0.2.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {analysesGemini.length > 1 && (
                <select
                  value={analyseActive?.id || ''}
                  onChange={(e) => setAnalyseSelectionneeId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  {analysesGemini.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.campagneNom} ({new Date(a.dateCreation).toLocaleTimeString('fr-FR')})
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() =>
                  handleRelancerAnalyseGemini(campagnesSelection[0]?.id)
                }
                disabled={enCours}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
              >
                {enCours
                  ? 'Analyse Gemini en cours...'
                  : 'Relancer l’Analyse Gemini sur la dernière campagne'}
              </button>
              {analyseActive && (
                <button
                  onClick={() => handleDownloadMarkdown(analyseActive)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
                >
                  Télécharger le Rapport (.md)
                </button>
              )}
            </div>
          </div>

          {analyseActive && (
            <>
              {/* Résumé exécutif & 3 Axes Prioritaires */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAECE4] pb-3">
                  <div>
                    <span className="text-xs font-mono-tabular text-[#256B45] font-bold">
                      CAMPAGNE ANALYSÉE : {analyseActive.campagneNom}
                    </span>
                    <div className="text-[11px] text-[#55645B] font-mono-tabular">
                      Moteur d’analyse : {analyseActive.modeleUtilise} · Versions :{' '}
                      {analyseActive.versionsAnalysees
                        .map((v) => `V${v}`)
                        .join(', ')}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#16211B] leading-relaxed font-medium">
                  {analyseActive.resumeExecutif}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      1. INTÉRÊT STRATÉGIQUE & BOTS DE POINTE
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActive.diagnosticStrategie}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      2. LISIBILITÉ & ERGONOMIE DU PLATEAU
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActive.diagnosticLisibiliteErgonomie}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      3. ÉQUILIBRE SELON LE NOMBRE DE JOUEURS (3–6J)
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActive.diagnosticEquilibre36J}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparatif des 4 Architectures Géométriques de Plateau */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
                <h4 className="font-display text-sm font-bold text-[#16211B] mb-3">
                  Matrice Comparative des 4 Architectures de Plateau (V0.3 vs Couronne Modulaire V0.1)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                        <th className="py-2 pr-3">Architecture Géométrique</th>
                        <th className="py-2 px-3">Intérêt Stratégique</th>
                        <th className="py-2 px-3">Lisibilité & Ergonomie</th>
                        <th className="py-2 px-3">Équilibre 3–6 Joueurs</th>
                        <th className="py-2 pl-3">Verdict Analytique</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAECE4]">
                      {analyseActive.comparatifGeometries.map((g) => (
                        <tr key={g.geometrie}>
                          <td className="py-3 pr-3 font-semibold text-[#16211B]">
                            {g.nom}
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold text-[#1E3528]">
                            {g.noteStrategie}/100
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold text-[#256B45]">
                            {g.noteErgonomie}/100
                          </td>
                          <td className="py-3 px-3 font-mono-tabular font-bold text-[#256B45]">
                            {g.noteEquilibre36}/100
                          </td>
                          <td className="py-3 pl-3 text-[#55645B] leading-relaxed">
                            {g.verdict}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommandations d'Hybridation avec instanciation en 1 clic */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#16211B]">
                    Variantes Hybrides Recommandées (Instanciation & Évaluation en 1 Clic)
                  </h4>
                  <p className="text-xs text-[#55645B]">
                    Cliquez sur « Créer & Tester cet Hybride en 1 clic » pour ajouter la variante au registre V0.3, lancer son test 9 bots + 3–6J et l’ouvrir dans l’Atelier.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {analyseActive.hybridesRecommandes.map((hyb, idx) => {
                    const existante = toutesVariantes.find(
                      (v) =>
                        (hyb.varianteHybride?.id &&
                          v.id === hyb.varianteHybride.id) ||
                        v.nom === hyb.varianteHybride?.nom ||
                        v.nom === hyb.titre
                    );
                    const estActive =
                      existante && existante.id === varianteActive.id;
                    const estEnCoursCeBouton =
                      hybrideEnCoursTitre === hyb.titre;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                          estActive
                            ? 'bg-emerald-50/90 border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                            : existante
                            ? 'bg-[#F9FBF8] border-emerald-400'
                            : 'bg-emerald-50/40 border-[#256B45]/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono-tabular font-bold text-[#256B45]">
                              HYBRIDE #{idx + 1} · {hyb.inspirationVersions}
                            </span>
                            {existante && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white font-mono-tabular">
                                ✓ ACTIF {existante.scoreInteretDernierTest ?? 90}/100
                              </span>
                            )}
                          </div>
                          <h5 className="font-display text-sm font-bold text-[#16211B]">
                            {hyb.titre}
                          </h5>
                          <p className="text-xs text-[#55645B] leading-relaxed">
                            {hyb.justification}
                          </p>
                          <ul className="space-y-1 pt-1 text-xs text-[#16211B]">
                            {hyb.pointsFortsAttendus.map((pt, i) => (
                              <li key={i}>• {pt}</li>
                            ))}
                          </ul>
                        </div>

                        {existante ? (
                          <div className="pt-2 border-t border-[#D8DFD5] space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-[#1E3528]">
                              <span>Déjà créé dans l’Atelier</span>
                              <span className="font-mono-tabular text-emerald-700">
                                Score {existante.scoreInteretDernierTest ?? 90}/100
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  onSelectVariante(
                                    existante.id,
                                    existante.version || '0.3'
                                  );
                                  if (onNavigateTab) onNavigateTab('proto');
                                }}
                                className="py-1.5 px-2 rounded-lg bg-[#256B45] text-white text-xs font-semibold hover:bg-[#1E5637] text-center"
                              >
                                Tester dans le Proto →
                              </button>
                              <button
                                onClick={() => {
                                  onSelectVariante(
                                    existante.id,
                                    existante.version || '0.3'
                                  );
                                  if (onNavigateTab) onNavigateTab('demo');
                                }}
                                className="py-1.5 px-2 rounded-lg bg-[#16211B] text-white text-xs font-semibold hover:bg-black text-center"
                              >
                                Démo animée
                              </button>
                            </div>
                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              <button
                                onClick={() => {
                                  onSelectVariante(
                                    existante.id,
                                    existante.version || '0.3'
                                  );
                                  setSubTab('interet_32');
                                }}
                                className="font-semibold text-[#256B45] hover:underline"
                              >
                                Échelle 9 Bots & 3–6J
                              </button>
                              <button
                                onClick={() => handleCreerHybrideUnClic(hyb)}
                                disabled={enCours}
                                className="text-[#55645B] hover:text-[#16211B] hover:underline"
                              >
                                {estEnCoursCeBouton
                                  ? 'Calcul...'
                                  : 'Ré-évaluer'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreerHybrideUnClic(hyb)}
                            disabled={enCours}
                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition-all ${
                              estEnCoursCeBouton
                                ? 'bg-amber-600 animate-pulse cursor-wait'
                                : 'bg-[#256B45] hover:bg-[#1E5637] shadow-sm'
                            }`}
                          >
                            {estEnCoursCeBouton ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <span className="inline-block animate-spin">⏳</span>
                                <span>Évaluation 9 bots & banc 3–6J...</span>
                              </span>
                            ) : (
                              '+ Créer & Tester cet Hybride en 1 clic'
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rapport Markdown complet */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-sm font-bold text-[#16211B]">
                    Rapport Consolidé Markdown (`resultats/derniere-analyse-gemini.md`)
                  </h4>
                  <button
                    onClick={() => handleDownloadMarkdown(analyseActive)}
                    className="text-xs font-semibold text-[#256B45] hover:underline"
                  >
                    Exporter en fichier .md
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs font-mono-tabular text-[#16211B] whitespace-pre-wrap overflow-x-auto max-h-[420px]">
                  {analyseActive.rapportMarkdown}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast flottant haute visibilité pour confirmer immédiatement la création */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#1E3528] text-white shadow-2xl border border-emerald-500/60 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <span>✓</span> HYBRIDE CRÉÉ ET ACTIVÉ DANS L'ATELIER
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {notificationToast.nom}
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Évalué avec succès · Score Global :{' '}
                <strong className="text-white font-mono-tabular">
                  {notificationToast.score}/100
                </strong>{' '}
                ({libelleGeometrieCourt(notificationToast.geometrie as GeometriePlateau)})
              </div>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-emerald-400 hover:text-white text-xs font-mono p-1"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-700/60 flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => {
                onSelectVariante(notificationToast.id, '0.3');
                if (onNavigateTab) onNavigateTab('proto');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
            >
              Tester dans le Proto →
            </button>
            <button
              onClick={() => {
                onSelectVariante(notificationToast.id, '0.3');
                if (onNavigateTab) onNavigateTab('demo');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-700"
            >
              Démo
            </button>
            <button
              onClick={() => {
                onSelectVariante(notificationToast.id, '0.3');
                setSubTab('interet_32');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-700"
            >
              Voir Échelle 9 Bots
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
