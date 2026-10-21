import React, { useState, useMemo } from 'react';
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
  RegleMouvementContrarie,
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
    case 'compact_9_cases':
      return 'Micro-Plateau 9 zones';
    case 'sentiers_goulots_15':
      return 'Sentiers Goulots 15 zones';
    case 'reseau_etendu_21':
      return 'Grand Réseau 21 zones';
    case 'double_plateau_34_56':
      return 'Double Plateau 3–4J / 5–6J';
    case 'hex_couronne_19':
      return 'Grille Hex 19 cases';
    case 'clairieres_sentiers':
      return 'Clairières & Sentiers (3 Cols)';
    default:
      return 'Modulaire (Secteurs)';
  }
}

function libelleRegleContrarieCourt(regle?: RegleMouvementContrarie): string {
  switch (regle) {
    case 'capacite_max_tuile':
      return 'Opt.1 Saturation (Max 2)';
    case 'goulots_sentiers_seuls':
    case 'goulot_sentier_strict':
      return 'Opt.2 Goulots Seuls (Cap. 1)';
    case 'interception_machine':
    case 'barrage_machine_active':
      return 'Opt.4 Interception Machine';
    case 'goulots_et_interception':
      return 'Opt.2+4 Goulots & Interception';
    case 'aucun':
    default:
      return 'Opt.3 Libre';
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
  const [nbPartiesViab, setNbPartiesViab] = useState<number>(14);
  const [nbPartiesInteret, setNbPartiesInteret] = useState<number>(16);
  const [nbNouvellesExplorationsV04, setNbNouvellesExplorationsV04] =
    useState<number>(4);
  const [inclureBotsPointe, setInclureBotsPointe] = useState<boolean>(true);
  const [testerEquilibre36J, setTesterEquilibre36J] = useState<boolean>(true);

  // Séparation stricte : Périmètre Actif V0.4 vs Archives V0.1–V0.3
  const variantesV04 = useMemo(
    () => toutesVariantes.filter((v) => v.version === '0.4'),
    [toutesVariantes]
  );
  const variantesHistoriques = useMemo(
    () => toutesVariantes.filter((v) => v.version !== '0.4'),
    [toutesVariantes]
  );

  const campagnesV04 = useMemo(
    () =>
      campagnesSelection.filter((c) =>
        (c.versionsCibles || []).includes('0.4')
      ),
    [campagnesSelection]
  );
  const campagnesHistoriques = useMemo(
    () =>
      campagnesSelection.filter(
        (c) => !(c.versionsCibles || []).includes('0.4')
      ),
    [campagnesSelection]
  );

  const analysesV04 = useMemo(
    () =>
      analysesGemini.filter((a) =>
        (a.versionsAnalysees || []).includes('0.4')
      ),
    [analysesGemini]
  );
  const analysesHistoriques = useMemo(
    () =>
      analysesGemini.filter(
        (a) => !(a.versionsAnalysees || []).includes('0.4')
      ),
    [analysesGemini]
  );

  const campagnesVMV04 = useMemo(
    () =>
      campagnesVM.filter((c) => (c.versionsCibles || []).includes('0.4')),
    [campagnesVM]
  );
  const campagnesVMHistoriques = useMemo(
    () =>
      campagnesVM.filter((c) => !(c.versionsCibles || []).includes('0.4')),
    [campagnesVM]
  );

  const [analyseSelectionneeId, setAnalyseSelectionneeId] = useState<string>(
    analysesV04[0]?.id || analysesGemini[0]?.id || ''
  );

  // Formulaire nouvelle tâche planifiée VM Oracle Cloud (V0.4)
  const [nouveauNomVM, setNouveauNomVM] = useState<string>(
    'Exploration Nocturne V0.4 — 6 Topologies, Options Contrariées 1·2·4 & Banc 3–6J'
  );
  const [nouveauCronVM, setNouveauCronVM] = useState<string>('0 2 * * *');

  const rapportViabActif =
    rapportsViabilite.find((r) => r.varianteId === varianteActive.id) || null;
  const rapportInteretActif =
    rapportsInteret.find((r) => r.varianteId === varianteActive.id) || null;

  const analyseActiveV04 =
    analysesV04.find((a) => a.id === analyseSelectionneeId) ||
    analysesV04[0] ||
    analysesGemini[0] ||
    null;

  const campagneActiveV04 = campagnesV04[0] || campagnesSelection[0] || null;

  // Map des variantes pour enrichir les lignes du palmarès avec leurs paramètres V0.4
  const mapVariantes = useMemo(
    () => new Map(toutesVariantes.map((v) => [v.id, v])),
    [toutesVariantes]
  );

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

  // Générer un lot de nouvelles variantes exploratoires V0.4 et éliminer immédiatement les non-viables
  const handleGenererEtFiltrerLotV04 = async (nbAGenerer = 4) => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/variants/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nbVariantes: nbAGenerer,
          filtrerImmediatement: true,
          versionCible: '0.4',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
        });
        setMessageSucces(
          `${nbAGenerer} nouvelles variantes exploratoires V0.4 générées et passées au filtre coupe-circuit 3.1 !`
        );
        setTimeout(() => setMessageSucces(''), 5000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const nouvelles = genererVariantesExploratoiresV01(
      nbAGenerer,
      toutesVariantes.length + 1,
      '0.4'
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
    setMessageSucces(
      `${nbAGenerer} nouvelles variantes exploratoires V0.4 générées et filtrées !`
    );
    setTimeout(() => setMessageSucces(''), 5000);
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

  // 3.2 : Tester l'intérêt sur l'échelle des 9 bots + banc 3-6 joueurs + métriques V0.4
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

  // 3.3 : Lancer une campagne V0.4 (Génération d'un lot exploratoire V0.4 + Évaluation complète V0.4 + Synthèse Gemini)
  const handleRunCampagneV04 = async (nbExplo = nbNouvellesExplorationsV04) => {
    setEnCours(true);
    const suffixeExplo =
      nbExplo > 0 ? `+${nbExplo} Explorations · ` : 'Catalogue V0.4 · ';
    const nomCampagne = `Campagne V0.4 Pur Placement (${suffixeExplo}${
      inclureBotsPointe ? '9 Bots dont IS-MCTS' : '6 Bots'
    }${testerEquilibre36J ? ' + Banc 3–6J' : ''})`;

    try {
      const resp = await fetch('/api/atelier/tests/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomCampagne,
          nbPartiesViabilite: nbPartiesViab,
          nbPartiesInteret: nbPartiesInteret,
          inclureDejaEliminees: false,
          versionsCibles: ['0.4'],
          nbNouvellesExplorationsV04: nbExplo,
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
          nbExplo > 0
            ? `${nbExplo} nouvelles variantes V0.4 générées et Campagne V0.4 complète terminée avec synthèse Gemini !`
            : 'Campagne V0.4 sur le catalogue existant terminée et analysée par Gemini !'
        );
        setTimeout(() => setMessageSucces(''), 6000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local isomorphe
    }

    let poolVariantes = [...toutesVariantes];
    if (nbExplo > 0) {
      const nouvelles = genererVariantesExploratoiresV01(
        nbExplo,
        toutesVariantes.length + 1,
        '0.4'
      );
      poolVariantes = [...nouvelles, ...poolVariantes];
    }

    const cibles = poolVariantes.filter(
      (v) => v.version === '0.4' && v.statutViabilite !== 'eliminee'
    );
    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      nomCampagne,
      nbPartiesViab,
      nbPartiesInteret,
      ['0.4']
    );
    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    const toutesMaj = poolVariantes.map((v) => mapMaj.get(v.id) || v);
    const analyseLocale = construireAnalyseCampagneStructurer(campagne);
    setAnalyseSelectionneeId(analyseLocale.id);
    onUpdateStateFromTests({
      variantes: toutesMaj,
      rapportsViabilite: [...campagne.rapportsViabilite, ...rapportsViabilite],
      rapportsInteret: [...campagne.rapportsInteret, ...rapportsInteret],
      campagnesSelection: [campagne, ...campagnesSelection],
      analysesGemini: [analyseLocale, ...analysesGemini],
    });
    setMessageSucces(
      nbExplo > 0
        ? `${nbExplo} nouvelles variantes V0.4 générées et Campagne V0.4 terminée !`
        : 'Campagne V0.4 terminée !'
    );
    setTimeout(() => setMessageSucces(''), 6000);
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
          'Campagne VM Oracle Cloud V0.4 exécutée avec succès et synthèse Gemini mise à jour !'
        );
        setTimeout(() => setMessageSucces(''), 6000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback
    }
    await handleRunCampagneV04(nbNouvellesExplorationsV04);
  };

  // Relancer une analyse Gemini sur la dernière campagne V0.4
  const handleRelancerAnalyseGemini = async (campagneId?: string) => {
    setEnCours(true);
    const idCible = campagneId || campagneActiveV04?.id;
    try {
      const resp = await fetch('/api/atelier/campaigns/analyze-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campagneId: idCible,
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
        setMessageSucces('Analyse Gemini V0.4 régénérée avec succès !');
        setTimeout(() => setMessageSucces(''), 5000);
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    const camp =
      campagnesSelection.find((c) => c.id === idCible) || campagneActiveV04;
    if (camp) {
      const ana = construireAnalyseCampagneStructurer(camp);
      setAnalyseSelectionneeId(ana.id);
      onUpdateStateFromTests({
        analysesGemini: [ana, ...analysesGemini],
      });
    }
    setEnCours(false);
  };

  // Instancier en 1 clic une variante hybride V0.4 recommandée par Gemini
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
        const score = data.variante.scoreInteretDernierTest ?? 92;
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
          rapportsInteret: data.state.rapportsInteret,
          varianteActiveId: data.variante.id,
          versionActiveId: data.variante.version || '0.4',
        });
        onSelectVariante(data.variante.id, data.variante.version || '0.4');
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
        `v04_hybride_${Date.now().toString(36)}`,
      version: hybride.varianteHybride?.version || '0.4',
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
      versionActiveId: nouv.version || '0.4',
    });
    onSelectVariante(nouv.id, nouv.version || '0.4');
    const msg = `Variante hybride « ${nouv.nom} » créée et activée (Score ${nouv.scoreInteretDernierTest}/100) !`;
    setMessageSucces(msg);
    setNotificationToast({
      id: nouv.id,
      nom: nouv.nom,
      score: nouv.scoreInteretDernierTest ?? 92,
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

  // Ajouter une nouvelle planification VM Oracle Cloud V0.4
  const handleAddScheduleVM = async () => {
    if (!nouveauNomVM.trim()) return;
    const nouv: ScheduledCampaignVM = {
      id: `vm_sched_${Date.now().toString(36)}`,
      nom: nouveauNomVM.trim(),
      cibleExecution: 'vm_oracle_cloud',
      cronExpression: nouveauCronVM,
      actif: true,
      nbVariantesAGenerer: Math.max(2, nbNouvellesExplorationsV04),
      nbPartiesViabilite: nbPartiesViab,
      nbPartiesInteret: nbPartiesInteret,
      eliminerNonViablesAuto: true,
      autoCommitGithub: false,
      versionsCibles: ['0.4'],
      inclureBotsPointe: true,
      testerEquilibre36J: true,
      prochaineExecutionEstimee: 'Cette nuit à 02:00 (VM Oracle Cloud)',
      statut: 'planifiee',
      journalVM: [
        `[${new Date().toLocaleTimeString('fr-FR')}] Tâche planifiée V0.4 Pur Placement (+${Math.max(
          2,
          nbNouvellesExplorationsV04
        )} explorations) enregistrée pour le démon VM Oracle Cloud (scripts/vm-worker.ts).`,
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

  const nbElimineesV04 = variantesV04.filter(
    (v) => v.statutViabilite === 'eliminee'
  ).length;
  const nbViablesV04 = variantesV04.filter(
    (v) => v.statutViabilite === 'viable'
  ).length;
  const nbElimineesTotal = toutesVariantes.filter(
    (v) => v.statutViabilite === 'eliminee'
  ).length;

  const listeEquilibre36: BilanJoueurs36[] =
    rapportInteretActif?.equilibreParJoueurs
      ? ([3, 4, 5, 6] as const).map(
          (n) => rapportInteretActif.equilibreParJoueurs![n]
        )
      : [];

  return (
    <div className="space-y-6">
      {/* En-tête épuré centré exclusivement sur la Version 0.4 */}
      <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#16211B]">
              Tests V0.4 — Pur Placement, 6 Topologies, Tension des Choix & Équilibre 3–6J
            </h2>
            <p className="text-xs text-[#55645B] mt-0.5">
              Évaluez la pertinence stratégique du Pur Placement (anticipation multi-coups, tension des choix, mouvements contrariés Options 1·2·4) de 3 à 6 joueurs.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tabular">
            <div>
              Variantes V0.4 Viables :{' '}
              <strong className="text-[#256B45]">{nbViablesV04}</strong>
            </div>
            <div>
              Éliminées V0.4 :{' '}
              <strong className="text-[#C2412D]">{nbElimineesV04}</strong>
            </div>
            {nbElimineesTotal > 0 && (
              <button
                onClick={handlePurgerEliminees}
                disabled={enCours}
                className="px-3 py-1.5 rounded-lg bg-[#C2412D] text-white font-sans font-semibold hover:bg-red-800 whitespace-nowrap shrink-0"
              >
                Purger les {nbElimineesTotal} éliminées
              </button>
            )}
          </div>
        </div>

        {/* Guide rapide : Comment se déclenchent les tests V0.4 */}
        <div className="pt-3 border-t border-[#EAECE4] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#55645B]">
          <div>
            <strong className="text-[#16211B]">
              1. Campagne Exploratoire V0.4 (Onglet 3.3) :
            </strong>{' '}
            Génère automatiquement de nouvelles variantes V0.4 (topologies, nb de défenseurs, Options 1·2·4) puis lance le banc comparatif complet.
          </div>
          <div>
            <strong className="text-[#16211B]">
              2. Inspection Détaillée (Onglet 3.2) :
            </strong>{' '}
            Mesure sur une variante précise l’échelle des 9 Bots, le Gain de Planification, la Tension des Choix et le banc 3 à 6 joueurs.
          </div>
          <div>
            <strong className="text-[#16211B]">
              3. Coupe-Circuit Rapide (Onglet 3.1) :
            </strong>{' '}
            Vérifie en quelques secondes qu’une variante respecte les 5 invariants de survie avant de l’inclure au palmarès.
          </div>
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

      {/* Navigation des 4 sous-sections V0.4 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8DFD5] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('selection_vm_33')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'selection_vm_33'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.3 Campagne & Palmarès V0.4
          </button>
          <button
            onClick={() => setSubTab('interet_32')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'interet_32'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.2 Détail Variante (9 Bots, Tension & 3–6J)
          </button>
          <button
            onClick={() => setSubTab('viabilite_31')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'viabilite_31'
                ? 'bg-[#1E3528] text-white'
                : 'bg-white text-[#16211B] border border-[#D8DFD5] hover:bg-[#EAECE4]'
            }`}
          >
            3.1 Coupe-Circuit Viabilité
          </button>
          <button
            onClick={() => setSubTab('analyse_gemini_34')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'analyse_gemini_34'
                ? 'bg-[#256B45] text-white'
                : 'bg-emerald-50 text-[#1E3528] border border-[#256B45]/40 hover:bg-emerald-100'
            }`}
          >
            3.4 Synthèse & Hybrides V0.4 ({analysesV04.length})
          </button>
        </div>

        {/* Sélecteur de la variante V0.4 inspectée */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#55645B] font-medium">
            Variante V0.4 inspectée :
          </span>
          <select
            value={varianteActive.id}
            onChange={(e) => onSelectVariante(e.target.value)}
            className="px-2.5 py-1.5 border border-[#D8DFD5] rounded-lg bg-white font-semibold text-[#16211B] max-w-[320px]"
          >
            <optgroup label={`Variantes Version 0.4 (${variantesV04.length})`}>
              {variantesV04.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.statutViabilite === 'eliminee' ? '✗ ' : '✓ '}
                  {v.nom}
                </option>
              ))}
            </optgroup>
            {varianteActive.version !== '0.4' && (
              <optgroup label="Archive consultée (V0.1–V0.3)">
                <option value={varianteActive.id}>
                  [V{varianteActive.version}] {varianteActive.nom}
                </option>
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* =====================================================================
          SOUS-ONGLET 3.1 : TESTS DE VIABILITÉ & ÉLIMINATION DIRECTE V0.4
          ===================================================================== */}
      {subTab === 'viabilite_31' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular text-[#256B45] font-semibold">
                3.1 — Filtre Coupe-Circuit de Viabilité (Version {varianteActive.version || '0.4'})
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                {varianteActive.nom} ·{' '}
                {libelleGeometrieCourt(varianteActive.geometriePlateau)}
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
                {enCours
                  ? 'Test en cours...'
                  : 'Tester la viabilité de cette variante'}
              </button>
              <button
                onClick={() => handleGenererEtFiltrerLotV04(4)}
                disabled={enCours}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
              >
                + Générer & Filtrer 4 variantes V0.4
              </button>
            </div>
          </div>

          {rapportViabActif ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div
                className={`lg:col-span-4 rounded-xl p-5 border flex flex-col justify-between ${
                  rapportViabActif.viable
                    ? 'bg-emerald-50/70 border-[#256B45]'
                    : 'bg-red-50/80 border-[#C2412D]'
                }`}
              >
                <div>
                  <div className="text-xs font-mono-tabular font-bold text-[#55645B]">
                    Verdict du Coupe-Circuit 3.1
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
                  <span>
                    Parties testées : {rapportViabActif.nbPartiesTestees}
                  </span>
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
          ) : (
            <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] text-center">
              <p className="text-sm text-[#55645B] mb-3">
                Aucun rapport de viabilité 3.1 n’a encore été exécuté sur «{' '}
                <strong>{varianteActive.nom}</strong> ».
              </p>
              <button
                onClick={handleRunViabiliteActive}
                disabled={enCours}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637]"
              >
                Lancer le test de viabilité 3.1 maintenant
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SOUS-ONGLET 3.2 : INTÉRÊT STRATÉGIQUE (9 BOTS), TENSION V0.4 & BANC 3–6J
          ===================================================================== */}
      {subTab === 'interet_32' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular text-[#256B45] font-semibold">
                3.2 — Évaluation Détaillée : 9 Bots, Tension du Placement V0.4 & Banc 3–6 Joueurs
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                {varianteActive.nom} ·{' '}
                {libelleGeometrieCourt(varianteActive.geometriePlateau)} ·{' '}
                {libelleRegleContrarieCourt(
                  varianteActive.regleMouvementContrarie
                )}
              </h3>
              <p className="text-xs text-[#55645B] mt-0.5">
                Mesure le gain d’anticipation (IS-MCTS vs Réflexe), la tension de chaque choix de placement, les mouvements contrariés et la stabilité de 3 à 6 joueurs.
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
                  : 'Évaluer cette variante (9 Bots + 3–6J)'}
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
              {/* Indicateurs Métriques V0.4 (Pur Placement, Tension des Choix & Mouvements Contrariés) au 1er plan */}
              {rapportInteretActif.metriquesPlacementV04 && (
                <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#165B36]">
                      Métriques V0.4 — Qualité Stratégique du Pur Placement & Contrariétés
                    </span>
                    <span className="text-xs font-mono-tabular font-semibold text-[#165B36]">
                      {libelleGeometrieCourt(varianteActive.geometriePlateau)} ·{' '}
                      {varianteActive.defenseursParJoueur} Déf./J ·{' '}
                      {libelleRegleContrarieCourt(
                        varianteActive.regleMouvementContrarie
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <div className="text-[11px] text-[#55645B] font-medium leading-tight">
                        Gain Planification Multi-Coups
                      </div>
                      <div className="font-mono-tabular text-lg font-bold text-[#256B45] mt-1">
                        +{rapportInteretActif.metriquesPlacementV04.gainPlanificationPct}%
                      </div>
                      <div className="text-[10px] text-[#55645B] mt-0.5">
                        Écart IS-MCTS vs Réflexe
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <div className="text-[11px] text-[#55645B] font-medium leading-tight">
                        Tension des Choix de Placement
                      </div>
                      <div className="font-mono-tabular text-lg font-bold text-[#16211B] mt-1">
                        {rapportInteretActif.metriquesPlacementV04.tensionDecisionsPct}%
                      </div>
                      <div className="text-[10px] text-[#55645B] mt-0.5">
                        Dilemme entre options
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-rose-200">
                      <div className="text-[11px] text-rose-900 font-medium leading-tight">
                        Taux Mouvements Contrariés
                      </div>
                      <div className="font-mono-tabular text-lg font-bold text-rose-700 mt-1">
                        {rapportInteretActif.metriquesPlacementV04.tauxMouvementsContrariesPct}%
                      </div>
                      <div className="text-[10px] text-[#55645B] mt-0.5">
                        Plans brisés en cascade
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-sky-200">
                      <div className="text-[11px] text-sky-900 font-medium leading-tight">
                        Coalitions 2 Peuples Réussies
                      </div>
                      <div className="font-mono-tabular text-lg font-bold text-sky-700 mt-1">
                        {rapportInteretActif.metriquesPlacementV04.tauxCoalitionsReussiesPct}%
                      </div>
                      <div className="text-[10px] text-[#55645B] mt-0.5">
                        Coupes bloquées à deux
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                      <div className="text-[11px] text-amber-900 font-medium leading-tight">
                        Barrages d’Entrée Efficaces
                      </div>
                      <div className="font-mono-tabular text-lg font-bold text-amber-700 mt-1">
                        {rapportInteretActif.metriquesPlacementV04.tauxBarragesEfficacesPct}%
                      </div>
                      <div className="text-[10px] text-[#55645B] mt-0.5">
                        Machines repoussées
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bandeau des 3 Axes Prioritaires de Conception */}
              {rapportInteretActif.troisAxesPrioritaires && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular font-bold text-[#256B45]">
                        1. Intérêt Stratégique
                      </span>
                      <span className="font-mono-tabular text-xl font-bold text-[#16211B]">
                        {rapportInteretActif.troisAxesPrioritaires.interetStrategique}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5">
                      {rapportInteretActif.troisAxesPrioritaires.detailStrategie}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular font-bold text-[#256B45]">
                        2. Lisibilité & Ergonomie
                      </span>
                      <span className="font-mono-tabular text-xl font-bold text-[#16211B]">
                        {rapportInteretActif.troisAxesPrioritaires.lisibiliteErgonomie}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5">
                      {rapportInteretActif.troisAxesPrioritaires.detailErgonomie}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#D8DFD5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-tabular font-bold text-[#256B45]">
                        3. Équilibre 3 à 6 Joueurs
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
                      Escalier de progression depuis le Bot Inerte jusqu’aux algorithmes Expectimax Bayésien, Beam Rollout et IS-MCTS.
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
                      {rapportInteretActif.troisAxesPrioritaires?.equilibreJoueurs36 ?? 88}/100
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                          <th className="py-2 pr-3">Configuration</th>
                          <th className="py-2 px-3">Survie Moyenne Forêt</th>
                          <th className="py-2 px-3">Pire Décile (D1)</th>
                          <th className="py-2 px-3">Coalitions / Neutralisations</th>
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
          SOUS-ONGLET 3.3 : CAMPAGNE D'EXPLORATION V0.4 & PALMARÈS DU PLACEMENT
          ===================================================================== */}
      {subTab === 'selection_vm_33' && (
        <div className="space-y-6">
          {/* Lancement en 1 clic d'une campagne exploratoire V0.4 */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#256B45] font-semibold">
                  3.3 — Campagne Globale V0.4 : Exploration Topologique, Contrariétés & Évaluation 9 Bots
                </div>
                <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                  Génération Exploratoire V0.4 + Banc Comparatif (6 Topologies · 3 à 6 Joueurs · Options 1, 2 & 4)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Enrichit le catalogue de nouvelles variantes V0.4 paramétriques puis évalue toutes les variantes V0.4 viables sur l’échelle des 9 bots et le banc 3–6 joueurs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handleRunCampagneV04(nbNouvellesExplorationsV04)}
                  disabled={enCours}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
                >
                  {enCours
                    ? 'Exploration & Simulation V0.4 en cours...'
                    : nbNouvellesExplorationsV04 > 0
                    ? `Générer +${nbNouvellesExplorationsV04} Variantes V0.4 & Lancer la Campagne`
                    : 'Lancer la Campagne sur le Catalogue V0.4'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAECE4] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#16211B]">
                    Nouvelles variantes V0.4 à générer avant la campagne :
                  </span>
                  <select
                    value={nbNouvellesExplorationsV04}
                    onChange={(e) =>
                      setNbNouvellesExplorationsV04(Number(e.target.value))
                    }
                    className="px-2.5 py-1 border border-[#D8DFD5] rounded-lg bg-[#F4F5F0] font-mono-tabular font-semibold text-[#16211B]"
                  >
                    <option value={0}>0 (Tester uniquement le catalogue V0.4 actuel)</option>
                    <option value={2}>+2 nouvelles variantes V0.4 exploratoires</option>
                    <option value={4}>+4 nouvelles variantes V0.4 exploratoires (Recommandé)</option>
                    <option value={6}>+6 nouvelles variantes V0.4 exploratoires</option>
                    <option value={8}>+8 nouvelles variantes V0.4 exploratoires</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={inclureBotsPointe}
                    onChange={(e) => setInclureBotsPointe(e.target.checked)}
                  />
                  <span>9 Bots (dont IS-MCTS / Beam / Bayes)</span>
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

          {/* Palmarès V0.4 mettant les métriques du Pur Placement au 1er plan */}
          {campagneActiveV04 && (
            <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#16211B]">
                    Palmarès V0.4 — {campagneActiveV04.nom}
                  </h4>
                  <p className="text-xs text-[#55645B]">
                    {campagneActiveV04.nbVariantesViables} variantes V0.4 viables classées sur{' '}
                    {campagneActiveV04.nbVariantesEntree} évaluées · Métriques de Placement, Anticipation et Contrariétés au 1er plan.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab('analyse_gemini_34')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1E3528] text-white hover:bg-black whitespace-nowrap shrink-0"
                >
                  Ouvrir la Synthèse Gemini & Hybrides V0.4 →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                      <th className="py-2 pr-2">Rang</th>
                      <th className="py-2 px-2">Variante V0.4</th>
                      <th className="py-2 px-2">Topologie & Règle Contrariée</th>
                      <th className="py-2 px-2 text-right">Gain Planif.</th>
                      <th className="py-2 px-2 text-right">Tension Choix</th>
                      <th className="py-2 px-2 text-right">Mouv. Contrariés</th>
                      <th className="py-2 px-2 text-right">Coalitions / Barrages</th>
                      <th className="py-2 px-2 text-right">Équilibre 3–6J</th>
                      <th className="py-2 px-2 text-right">Score Global</th>
                      <th className="py-2 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECE4]">
                    {campagneActiveV04.rapportsInteret.map((r, i) => {
                      const varObj = mapVariantes.get(r.varianteId);
                      const mV04 = r.metriquesPlacementV04;
                      const gainPlanif =
                        mV04?.gainPlanificationPct ??
                        r.indicateurs.gainPlanificationPct ??
                        Math.round(
                          (r.indicateurs.gainBotsPointeSurDeductif || 4) +
                            (r.indicateurs.gainDeductionSequentielle || 6) * 0.6
                        );
                      const tensionPct = mV04?.tensionDecisionsPct ?? 82;
                      const contrariesPct =
                        mV04?.tauxMouvementsContrariesPct ?? 12;
                      const coalitionsPct =
                        mV04?.tauxCoalitionsReussiesPct ?? 64;
                      const barragesPct = mV04?.tauxBarragesEfficacesPct ?? 72;

                      return (
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
                          <td className="py-2.5 px-2 font-semibold text-[#16211B]">
                            {r.varianteNom}
                          </td>
                          <td className="py-2.5 px-2 text-[#55645B]">
                            <div className="font-medium text-[#16211B]">
                              {libelleGeometrieCourt(r.geometriePlateau)}
                            </div>
                            <div className="text-[11px] font-mono-tabular text-[#55645B]">
                              {varObj?.defenseursParJoueur ?? 2} Déf./J ·{' '}
                              {libelleRegleContrarieCourt(
                                varObj?.regleMouvementContrarie
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right font-bold text-[#256B45]">
                            +{gainPlanif}%
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right font-semibold text-[#16211B]">
                            {tensionPct}%
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right font-semibold text-rose-700">
                            {contrariesPct}%
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right text-[#55645B]">
                            <span className="text-sky-700 font-semibold">
                              {coalitionsPct}%
                            </span>{' '}
                            /{' '}
                            <span className="text-amber-700 font-semibold">
                              {barragesPct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right font-semibold">
                            {r.troisAxesPrioritaires?.equilibreJoueurs36 ?? 88}
                            /100
                          </td>
                          <td className="py-2.5 px-2 font-mono-tabular text-right font-bold text-[#1E3528]">
                            {r.scoreInteretGlobal}/100
                          </td>
                          <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                onSelectVariante(r.varianteId, '0.4');
                                setSubTab('interet_32');
                              }}
                              className="text-xs font-semibold text-[#256B45] hover:underline mr-2.5"
                            >
                              Détail 3.2
                            </button>
                            <button
                              onClick={() => {
                                onSelectVariante(r.varianteId, '0.4');
                                if (onNavigateTab) onNavigateTab('proto');
                              }}
                              className="text-xs font-semibold text-[#16211B] hover:underline"
                            >
                              Proto →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Planificateur VM Oracle Cloud centré sur V0.4 */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-sm font-bold text-[#16211B]">
                  Automatisation VM Oracle Cloud — Campagnes Longues V0.4 (`scripts/vm-worker.ts`)
                </h4>
                <p className="text-xs text-[#55645B]">
                  Lancez ou planifiez des campagnes intensives d’exploration paramétrique V0.4 sur votre VM.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nouveauNomVM}
                  onChange={(e) => setNouveauNomVM(e.target.value)}
                  placeholder="Nom de la tâche VM V0.4"
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
                  + Planifier Tâche V0.4
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campagnesVMV04.map((cvm) => (
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
                      Version : V0.4 · +{cvm.nbVariantesAGenerer} explorations/run ·
                      Viabilité : {cvm.nbPartiesViabilite}p · Intérêt :{' '}
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
                      Exécuter maintenant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SOUS-ONGLET 3.4 : SYNTHÈSE GEMINI V0.4 & RECOMMANDATIONS D'HYBRIDES
          ===================================================================== */}
      {subTab === 'analyse_gemini_34' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular text-[#256B45] font-semibold">
                3.4 — Synthèse Analytique V0.4 & Configurations Hybrides Recommandées
              </div>
              <h3 className="font-display text-base font-bold text-[#16211B] mt-0.5">
                Diagnostic V0.4 : Pur Placement, 6 Topologies, Options Contrariées 1·2·4 & Équilibre 3–6J
              </h3>
              <p className="text-xs text-[#55645B]">
                Synthèse des campagnes V0.4 et instanciation en 1 clic des meilleures combinaisons de règles V0.4.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {analysesV04.length > 1 && (
                <select
                  value={analyseActiveV04?.id || ''}
                  onChange={(e) => setAnalyseSelectionneeId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  {analysesV04.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.campagneNom} (
                      {new Date(a.dateCreation).toLocaleTimeString('fr-FR')})
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() =>
                  handleRelancerAnalyseGemini(campagneActiveV04?.id)
                }
                disabled={enCours}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
              >
                {enCours
                  ? 'Analyse Gemini en cours...'
                  : 'Actualiser l’Analyse Gemini V0.4'}
              </button>
              {analyseActiveV04 && (
                <button
                  onClick={() => handleDownloadMarkdown(analyseActiveV04)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
                >
                  Télécharger le Rapport (.md)
                </button>
              )}
            </div>
          </div>

          {analyseActiveV04 && (
            <>
              {/* Résumé exécutif & 3 Axes Prioritaires */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAECE4] pb-3">
                  <div>
                    <span className="text-xs font-mono-tabular text-[#256B45] font-bold">
                      Campagne V0.4 analysée : {analyseActiveV04.campagneNom}
                    </span>
                    <div className="text-[11px] text-[#55645B] font-mono-tabular">
                      Moteur d’analyse : {analyseActiveV04.modeleUtilise} ·
                      Périmètre : Version 0.4 (Pur Placement)
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#16211B] leading-relaxed font-medium">
                  {analyseActiveV04.resumeExecutif}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      1. Intérêt Stratégique & Planification
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActiveV04.diagnosticStrategie}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      2. Lisibilité & Ergonomie des 6 Topologies
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActiveV04.diagnosticLisibiliteErgonomie}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs font-mono-tabular font-bold text-[#256B45] mb-1.5">
                      3. Équilibre de 3 à 6 Joueurs
                    </div>
                    <p className="text-xs text-[#16211B] leading-relaxed">
                      {analyseActiveV04.diagnosticEquilibre36J}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparatif des Architectures Géométriques de Plateau V0.4 */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
                <h4 className="font-display text-sm font-bold text-[#16211B] mb-3">
                  Matrice Comparative des Topologies de Plateau en Version 0.4
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                        <th className="py-2 pr-3">Architecture Géométrique</th>
                        <th className="py-2 px-3">Intérêt Stratégique</th>
                        <th className="py-2 px-3">Lisibilité & Ergonomie</th>
                        <th className="py-2 px-3">Équilibre 3–6 Joueurs</th>
                        <th className="py-2 pl-3">Verdict Analytique V0.4</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAECE4]">
                      {analyseActiveV04.comparatifGeometries.map((g) => (
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

              {/* Recommandations d'Hybridation V0.4 avec instanciation en 1 clic */}
              <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#16211B]">
                    Configurations V0.4 Recommandées (Instanciation & Évaluation en 1 Clic)
                  </h4>
                  <p className="text-xs text-[#55645B]">
                    Cliquez sur « Créer & Tester en 1 clic » pour ajouter la configuration au catalogue V0.4, lancer son évaluation 9 bots + 3–6J et l’ouvrir dans l’Atelier.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {analyseActiveV04.hybridesRecommandes.map((hyb, idx) => {
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
                            ? 'bg-emerald-50/90 border-emerald-600'
                            : existante
                            ? 'bg-[#F9FBF8] border-emerald-400'
                            : 'bg-emerald-50/40 border-[#256B45]/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono-tabular font-bold text-[#256B45]">
                              Recommandation #{idx + 1} · {hyb.inspirationVersions}
                            </span>
                            {existante && (
                              <span className="text-[11px] font-bold text-emerald-700 font-mono-tabular">
                                ✓ Actif ({existante.scoreInteretDernierTest ?? 92}/100)
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
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  onSelectVariante(
                                    existante.id,
                                    existante.version || '0.4'
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
                                    existante.version || '0.4'
                                  );
                                  setSubTab('interet_32');
                                }}
                                className="py-1.5 px-2 rounded-lg bg-[#16211B] text-white text-xs font-semibold hover:bg-black text-center"
                              >
                                Voir Détail 3.2
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreerHybrideUnClic(hyb)}
                            disabled={enCours}
                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition-all ${
                              estEnCoursCeBouton
                                ? 'bg-amber-600 cursor-wait'
                                : 'bg-[#256B45] hover:bg-[#1E5637]'
                            }`}
                          >
                            {estEnCoursCeBouton
                              ? 'Évaluation 9 bots & banc 3–6J...'
                              : '+ Créer & Tester cette configuration V0.4'}
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
                    onClick={() => handleDownloadMarkdown(analyseActiveV04)}
                    className="text-xs font-semibold text-[#256B45] hover:underline"
                  >
                    Exporter en fichier .md
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] text-xs font-mono-tabular text-[#16211B] whitespace-pre-wrap overflow-x-auto max-h-[420px]">
                  {analyseActiveV04.rapportMarkdown}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TIROIR D'ARCHIVES EN BAS DE PAGE : VERSIONS HISTORIQUES V0.1 · V0.2 · V0.3
          ===================================================================== */}
      <details className="bg-[#F4F5F0] rounded-xl border border-[#D8DFD5] overflow-hidden">
        <summary className="px-5 py-3.5 cursor-pointer select-none flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#55645B] hover:text-[#16211B] hover:bg-[#EAECE4]/60 transition-colors">
          <span>
            Archives des Tests & Campagnes Historiques (Versions 0.1 · 0.2 · 0.3) — Consultation à la demande
          </span>
          <span className="font-mono-tabular text-[11px] text-[#55645B]">
            {campagnesHistoriques.length} campagne(s) ·{' '}
            {analysesHistoriques.length} rapport(s) ·{' '}
            {variantesHistoriques.length} variantes archivées
          </span>
        </summary>

        <div className="p-5 border-t border-[#D8DFD5] bg-white space-y-6">
          <p className="text-xs text-[#55645B]">
            Ces résultats et variantes issus des cycles de conception V0.1 (Socle), V0.2 (Éclaireur & Peuples) et V0.3 (Nouveaux Plateaux) sont conservés pour mémoire et référence comparative.
          </p>

          {/* 1. Anciennes campagnes V0.1 - V0.3 */}
          {campagnesHistoriques.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-sm font-bold text-[#16211B]">
                Palmarès des Campagnes Archivées (V0.1 · V0.2 · V0.3)
              </h4>
              {campagnesHistoriques.map((campHist) => (
                <div
                  key={campHist.id}
                  className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#16211B]">
                        {campHist.nom}
                      </span>
                      <span className="ml-2 text-[11px] font-mono-tabular text-[#55645B]">
                        ({campHist.nbVariantesViables} viables /{' '}
                        {campHist.nbVariantesEntree} testées)
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr className="border-b border-[#D8DFD5] text-[#55645B] font-mono-tabular text-[11px]">
                          <th className="py-2 px-2">Rang</th>
                          <th className="py-2 px-2">Ver.</th>
                          <th className="py-2 px-2">Variante Archivée</th>
                          <th className="py-2 px-2">Géométrie</th>
                          <th className="py-2 px-2 text-right">Stratégie</th>
                          <th className="py-2 px-2 text-right">Ergonomie</th>
                          <th className="py-2 px-2 text-right">Équilibre 3–6J</th>
                          <th className="py-2 px-2 text-right">Score Global</th>
                          <th className="py-2 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAECE4]">
                        {campHist.rapportsInteret.map((r, idx) => (
                          <tr key={r.varianteId} className="hover:bg-[#F4F5F0]">
                            <td className="py-2 px-2 font-mono-tabular font-bold">
                              #{idx + 1}
                            </td>
                            <td className="py-2 px-2 font-mono-tabular text-[#55645B]">
                              V{r.version || '0.1'}
                            </td>
                            <td className="py-2 px-2 font-medium text-[#16211B]">
                              {r.varianteNom}
                            </td>
                            <td className="py-2 px-2 text-[#55645B]">
                              {libelleGeometrieCourt(r.geometriePlateau)}
                            </td>
                            <td className="py-2 px-2 font-mono-tabular text-right">
                              {r.troisAxesPrioritaires?.interetStrategique ??
                                r.scoreInteretGlobal}
                              /100
                            </td>
                            <td className="py-2 px-2 font-mono-tabular text-right">
                              {r.troisAxesPrioritaires?.lisibiliteErgonomie ??
                                80}
                              /100
                            </td>
                            <td className="py-2 px-2 font-mono-tabular text-right">
                              {r.troisAxesPrioritaires?.equilibreJoueurs36 ??
                                82}
                              /100
                            </td>
                            <td className="py-2 px-2 font-mono-tabular text-right font-bold">
                              {r.scoreInteretGlobal}/100
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                onClick={() => {
                                  onSelectVariante(
                                    r.varianteId,
                                    (r.version as GameVersionId) || '0.3'
                                  );
                                  setSubTab('interet_32');
                                }}
                                className="text-xs font-semibold text-[#256B45] hover:underline"
                              >
                                Consulter 3.2
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Rapports Gemini Historiques V0.1-V0.3 */}
          {analysesHistoriques.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-display text-sm font-bold text-[#16211B]">
                Rapports d’Analyse Historiques (V0.1 · V0.2 · V0.3)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysesHistoriques.map((ah) => (
                  <div
                    key={ah.id}
                    className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#16211B]">
                        {ah.campagneNom}
                      </div>
                      <div className="text-[11px] text-[#55645B] font-mono-tabular mt-0.5">
                        Versions :{' '}
                        {(ah.versionsAnalysees || [])
                          .map((v) => `V${v}`)
                          .join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadMarkdown(ah)}
                      className="px-3 py-1.5 rounded bg-white border border-[#D8DFD5] font-semibold text-[#16211B] hover:bg-[#EAECE4] shrink-0"
                    >
                      Télécharger .md
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Liste des variantes archivées V0.1-V0.3 et Tâches VM historiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5] space-y-2">
              <div className="text-xs font-bold text-[#16211B]">
                Variantes Archivées V0.1 · V0.2 · V0.3 ({variantesHistoriques.length})
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#D8DFD5] text-xs">
                {variantesHistoriques.map((vh) => (
                  <div
                    key={vh.id}
                    className="py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-[#16211B]">
                      <strong className="font-mono-tabular text-[#55645B]">
                        [V{vh.version}]
                      </strong>{' '}
                      {vh.nom}
                    </span>
                    <button
                      onClick={() => {
                        onSelectVariante(vh.id, vh.version);
                        setSubTab('interet_32');
                      }}
                      className="text-[11px] font-semibold text-[#256B45] hover:underline shrink-0"
                    >
                      Inspecter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {campagnesVMHistoriques.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5] space-y-2">
                <div className="text-xs font-bold text-[#16211B]">
                  Anciennes Tâches Planifiées VM (V0.1–V0.3)
                </div>
                <div className="space-y-2 text-xs">
                  {campagnesVMHistoriques.map((cvm) => (
                    <div
                      key={cvm.id}
                      className="p-2.5 rounded bg-white border border-[#D8DFD5] flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-[#55645B]">{cvm.nom}</span>
                      <span className="font-mono-tabular text-[11px] text-[#55645B] shrink-0">
                        Archivée
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </details>

      {/* Toast flottant pour confirmer la création d'un hybride V0.4 */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#1E3528] text-white shadow-2xl border border-emerald-500/60 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono-tabular text-emerald-400 font-bold">
                ✓ CONFIGURATION V0.4 CRÉÉE ET ACTIVÉE
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {notificationToast.nom}
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Score Global :{' '}
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
                onSelectVariante(notificationToast.id, '0.4');
                if (onNavigateTab) onNavigateTab('proto');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
            >
              Tester dans le Proto →
            </button>
            <button
              onClick={() => {
                onSelectVariante(notificationToast.id, '0.4');
                setSubTab('interet_32');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-700"
            >
              Voir Détail 3.2
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
