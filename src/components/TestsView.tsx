import React, { useState } from 'react';
import {
  CampagneSelection33,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from '../shared/types';
import {
  evaluerInteretVariante32,
  evaluerViabiliteVariante31,
  executerCampagneSelection33,
  genererVariantesExploratoiresV01,
} from '../shared/tests-engine';

interface TestsViewProps {
  varianteActive: VariantV01;
  variantes: VariantV01[];
  rapportsViabilite: RapportViabilite31[];
  rapportsInteret: RapportInteret32[];
  campagnesSelection: CampagneSelection33[];
  campagnesVM: ScheduledCampaignVM[];
  onSelectVariante: (id: string) => void;
  onUpdateStateFromTests: (payload: {
    variantes?: VariantV01[];
    rapportsViabilite?: RapportViabilite31[];
    rapportsInteret?: RapportInteret32[];
    campagnesSelection?: CampagneSelection33[];
    campagnesVM?: ScheduledCampaignVM[];
  }) => void;
}

type TestsSubTab = 'viabilite_31' | 'interet_32' | 'selection_vm_33';

export const TestsView: React.FC<TestsViewProps> = ({
  varianteActive,
  variantes,
  rapportsViabilite,
  rapportsInteret,
  campagnesSelection,
  campagnesVM,
  onSelectVariante,
  onUpdateStateFromTests,
}) => {
  const [subTab, setSubTab] = useState<TestsSubTab>('viabilite_31');
  const [enCours, setEnCours] = useState<boolean>(false);
  const [nbPartiesViab, setNbPartiesViab] = useState<number>(16);
  const [nbPartiesInteret, setNbPartiesInteret] = useState<number>(24);

  // Formulaire nouvelle tâche planifiée VM Oracle Cloud
  const [nouveauNomVM, setNouveauNomVM] = useState<string>(
    'Criblage Nocturne VM Oracle Cloud — Variantes Séquencement V0.1'
  );
  const [nouveauCronVM, setNouveauCronVM] = useState<string>('0 2 * * *');

  const rapportViabActif =
    rapportsViabilite.find((r) => r.varianteId === varianteActive.id) || null;
  const rapportInteretActif =
    rapportsInteret.find((r) => r.varianteId === varianteActive.id) || null;

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
    const majVars = variantes.map((v) =>
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

  // Générer 4 nouvelles variantes exploratoires et éliminer immédiatement les non-viables
  const handleGenererEtFiltrerLot = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/variants/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nbVariantes: 4, filtrerImmediatement: true }),
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
      // Fallback isomorphe
    }
    const nouvelles = genererVariantesExploratoiresV01(4, variantes.length + 1);
    const nouveauxRapports: RapportViabilite31[] = [];
    for (const v of nouvelles) {
      const r = evaluerViabiliteVariante31(v, 14);
      nouveauxRapports.push(r);
      v.statutViabilite = r.viable ? 'viable' : 'eliminee';
      v.motifElimination = r.motifElimination;
      v.bandeSante = r.viable ? 'vert' : 'rouge';
    }
    onUpdateStateFromTests({
      variantes: [...nouvelles, ...variantes],
      rapportsViabilite: [...nouveauxRapports, ...rapportsViabilite],
    });
    setEnCours(false);
  };

  // Purger toutes les variantes éliminées (non viables)
  const handlePurgerEliminees = async () => {
    try {
      const resp = await fetch('/api/atelier/variants/eliminated', {
        method: 'DELETE',
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({ variantes: data.state.variantes });
        return;
      }
    } catch (_e) {
      // Fallback
    }
    onUpdateStateFromTests({
      variantes: variantes.filter((v) => v.statutViabilite !== 'eliminee'),
    });
  };

  // 3.2 : Tester l'intérêt stratégique de la variante active
  const handleRunInteretActive = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/tests/interet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          varianteId: varianteActive.id,
          nbPartiesParBot: nbPartiesInteret,
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
      // Fallback isomorphe
    }
    const rap = evaluerInteretVariante32(varianteActive, nbPartiesInteret);
    const majVars = variantes.map((v) =>
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

  // 3.3 : Exécuter une campagne complète de sélection multi-variantes
  const handleRunSelection33 = async () => {
    setEnCours(true);
    try {
      const resp = await fetch('/api/atelier/tests/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nbPartiesViabilite: nbPartiesViab,
          nbPartiesInteret: nbPartiesInteret,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        onUpdateStateFromTests({
          variantes: data.state.variantes,
          rapportsViabilite: data.state.rapportsViabilite,
          rapportsInteret: data.state.rapportsInteret,
          campagnesSelection: data.state.campagnesSelection,
        });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback isomorphe
    }
    const cibles = variantes.filter((v) => v.statutViabilite !== 'eliminee');
    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      `Campagne Sélection V0.1`,
      nbPartiesViab,
      nbPartiesInteret
    );
    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    onUpdateStateFromTests({
      variantes: variantes.map((v) => mapMaj.get(v.id) || v),
      rapportsViabilite: [...campagne.rapportsViabilite, ...rapportsViabilite],
      rapportsInteret: [...campagne.rapportsInteret, ...rapportsInteret],
      campagnesSelection: [campagne, ...campagnesSelection],
    });
    setEnCours(false);
  };

  // Ajouter une tâche planifiée VM Oracle Cloud
  const handleAddScheduleVM = async (e: React.FormEvent) => {
    e.preventDefault();
    const nouv: ScheduledCampaignVM = {
      id: `vm_${Date.now().toString(36)}`,
      nom: nouveauNomVM,
      cibleExecution: 'vm_oracle_cloud',
      cronExpression: nouveauCronVM,
      actif: true,
      nbPartiesViabilite: nbPartiesViab,
      nbPartiesInteret: nbPartiesInteret,
      eliminerNonViablesAuto: true,
      autoCommitGithub: true,
      statut: 'planifiee',
      prochaineExecutionEstimee: `Planifié sur VM Oracle Cloud (${nouveauCronVM})`,
      journalVM: [
        `[${new Date().toLocaleTimeString('fr-FR')}] Tâche planifiée enregistrée pour la VM Oracle Cloud.`,
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
    onUpdateStateFromTests({
      campagnesVM: [nouv, ...campagnesVM],
    });
  };

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
        });
        setEnCours(false);
        return;
      }
    } catch (_e) {
      // Fallback
    }
    await handleRunSelection33();
    setEnCours(false);
  };

  const nbViables = variantes.filter((v) => v.statutViabilite === 'viable').length;
  const nbEliminees = variantes.filter(
    (v) => v.statutViabilite === 'eliminee'
  ).length;

  return (
    <div className="space-y-6">
      {/* En-tête du composant Tests (3.1, 3.2, 3.3 & VM Oracle Cloud) */}
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            3. Tests — Viabilité (3.1), Intérêt (3.2), Sélection (3.3) & Planification VM Oracle Cloud
          </h2>
          <p className="text-xs text-[#55645B]">
            Catalogue V0.1 : <strong className="text-[#256B45]">{nbViables} variantes viables</strong> ·{' '}
            <strong className="text-[#C2412D]">{nbEliminees} variantes éliminées</strong> ·{' '}
            Variante active : <strong className="text-[#16211B]">{varianteActive.nom}</strong>
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
          <button
            onClick={() => setSubTab('viabilite_31')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'viabilite_31'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            3.1 Viabilité & Élimination
          </button>
          <button
            onClick={() => setSubTab('interet_32')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'interet_32'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            3.2 Évaluation de l’intérêt
          </button>
          <button
            onClick={() => setSubTab('selection_vm_33')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'selection_vm_33'
                ? 'bg-[#256B45] text-white'
                : 'text-[#16211B] hover:bg-white'
            }`}
          >
            3.3 Sélection & VM Oracle Cloud
          </button>
        </div>
      </div>

      {/* SOUS-ONGLET 3.1 : VIABILITÉ & ÉLIMINATION DIRECTE DES NON-VIABLES */}
      {subTab === 'viabilite_31' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D8DFD5]">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  3.1 Filtre Coupe-Circuit de Viabilité (Élimination rapide des variantes défectueuses)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Teste en quelques secondes si la variante est jouable, équilibrée et exempte de boucle gagnante triviale avant tout calcul lourd.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunViabiliteActive}
                  disabled={enCours}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {enCours
                    ? 'Test en cours...'
                    : `Tester la viabilité de « ${varianteActive.nom.slice(0, 28)}… »`}
                </button>
                <button
                  onClick={handleGenererEtFiltrerLot}
                  disabled={enCours}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#16211B] text-white hover:bg-black disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  + Générer 4 variantes V0.1 & Éliminer les non-viables
                </button>
                {nbEliminees > 0 && (
                  <button
                    onClick={handlePurgerEliminees}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-300 text-[#C2412D] hover:bg-red-50 whitespace-nowrap shrink-0"
                  >
                    Purger les {nbEliminees} variantes éliminées
                  </button>
                )}
              </div>
            </div>

            {/* Diagnostic 3.1 de la variante sélectionnée */}
            {rapportViabActif && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[#16211B]">
                    Verdict 3.1 pour « {rapportViabActif.varianteNom} » :{' '}
                    <span
                      className={
                        rapportViabActif.viable
                          ? 'text-[#256B45]'
                          : 'text-[#C2412D]'
                      }
                    >
                      {rapportViabActif.viable
                        ? 'VIABLE (Qualifiée pour 3.2)'
                        : 'ÉLIMINÉE — NON VIABLE'}
                    </span>
                  </div>
                  <div className="text-xs font-mono-tabular text-[#55645B]">
                    {rapportViabActif.nbPartiesTestees} parties simulées en{' '}
                    {rapportViabActif.dureeMs} ms
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8DFD5] text-[#55645B]">
                        <th className="py-2 pr-3 font-semibold">Critère 3.1</th>
                        <th className="py-2 px-3 font-semibold">Statut</th>
                        <th className="py-2 px-3 font-semibold">Mesure observée</th>
                        <th className="py-2 px-3 font-semibold">Seuil requis</th>
                        <th className="py-2 pl-3 font-semibold">Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8DFD5]">
                      {rapportViabActif.criteres.map((c) => (
                        <tr key={c.code} className="hover:bg-[#F4F5F0]/50">
                          <td className="py-2.5 pr-3 font-medium text-[#16211B]">
                            {c.intitule}
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular font-semibold">
                            <span
                              className={
                                c.valide ? 'text-[#256B45]' : 'text-[#C2412D]'
                              }
                            >
                              {c.valide ? 'CONFORME' : 'ÉCHEC'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#16211B]">
                            {c.valeurObservee}
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#55645B]">
                            {c.seuilAttendu}
                          </td>
                          <td className="py-2.5 pl-3 text-[#55645B]">
                            {c.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Liste complète des variantes V0.1 avec statut de viabilité et élimination */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <h3 className="font-display text-base font-semibold text-[#16211B] mb-3">
              État du Catalogue des Variantes V0.1 (Tri Viables / Éliminées)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D8DFD5] text-[#55645B]">
                    <th className="py-2 pr-3 font-semibold">Variante V0.1</th>
                    <th className="py-2 px-3 font-semibold">Séquencement (Prog. / Résol.)</th>
                    <th className="py-2 px-3 font-semibold">Options d’Actions</th>
                    <th className="py-2 px-3 font-semibold">Statut 3.1</th>
                    <th className="py-2 pl-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DFD5]">
                  {variantes.map((v) => {
                    const estElim = v.statutViabilite === 'eliminee';
                    return (
                      <tr
                        key={v.id}
                        className={`${
                          estElim ? 'bg-red-50/30 opacity-80' : 'hover:bg-[#F4F5F0]/60'
                        }`}
                      >
                        <td className="py-2.5 pr-3">
                          <div
                            className={`font-semibold ${
                              estElim
                                ? 'line-through text-[#C2412D]'
                                : 'text-[#16211B]'
                            }`}
                          >
                            {v.nom}
                          </div>
                          {v.motifElimination && (
                            <div className="text-[11px] text-[#C2412D] mt-0.5">
                              {v.motifElimination}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular text-[#55645B]">
                          {v.modeProgrammation} · {v.modeResolution}
                        </td>
                        <td className="py-2.5 px-3 text-[#55645B]">
                          Prot: {v.effetProteger} · Sab: {v.effetSaboter}
                          {v.actionReplanterActive ? ' · +Replanter' : ''}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular font-semibold">
                          <span
                            className={
                              v.statutViabilite === 'viable'
                                ? 'text-[#256B45]'
                                : v.statutViabilite === 'eliminee'
                                ? 'text-[#C2412D]'
                                : 'text-amber-700'
                            }
                          >
                            {v.statutViabilite === 'viable'
                              ? 'VIABLE'
                              : v.statutViabilite === 'eliminee'
                              ? 'ÉLIMINÉE'
                              : 'À TESTER'}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            onClick={() => onSelectVariante(v.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] hover:bg-white whitespace-nowrap shrink-0"
                          >
                            Inspecter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 3.2 : ÉVALUATION DE L'INTÉRÊT STRATÉGIQUE SUR L'ÉCHELLE DES 6 BOTS */}
      {subTab === 'interet_32' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D8DFD5]">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  3.2 Évaluation de l’Intérêt Stratégique — Échelle des 6 Bots (« {varianteActive.nom} »)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Mesure la profondeur de jeu : écart entre Réflexe et Lecture des pistes, gain de la déduction séquentielle et garde-fou contre les boucles.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-[#55645B] flex items-center gap-1.5">
                  <span>Parties/Bot :</span>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={nbPartiesInteret}
                    onChange={(e) => setNbPartiesInteret(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-[#D8DFD5] rounded font-mono-tabular text-xs text-[#16211B]"
                  />
                </label>
                <button
                  onClick={handleRunInteretActive}
                  disabled={enCours}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {enCours
                    ? 'Simulation des 6 Bots...'
                    : 'Lancer la batterie d’intérêt 3.2'}
                </button>
              </div>
            </div>

            {rapportInteretActif ? (
              <div className="mt-4 space-y-5">
                {/* 4 KPIs d'intérêt stratégique */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs text-[#55645B]">
                      Score Global d’Intérêt (3.2)
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#16211B] mt-1">
                      {rapportInteretActif.scoreInteretGlobal} / 100 ·{' '}
                      <span
                        className={
                          rapportInteretActif.bandeSante === 'vert'
                            ? 'text-[#256B45]'
                            : rapportInteretActif.bandeSante === 'orange'
                            ? 'text-amber-700'
                            : 'text-[#C2412D]'
                        }
                      >
                        {rapportInteretActif.bandeSante.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs text-[#55645B]">
                      Marge Garde-fou Anti-Boucle
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#16211B] mt-1">
                      {rapportInteretActif.indicateurs.margeGardeFouBoucle >= 0
                        ? '+'
                        : ''}
                      {rapportInteretActif.indicateurs.margeGardeFouBoucle} pts
                    </div>
                    <div className="text-[11px] text-[#55645B]">
                      Déductif vs Boucle fixe (Seuil ≥ +5 pts)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs text-[#55645B]">
                      Gain Lecture des 2 Pistes
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#256B45] mt-1">
                      +{rapportInteretActif.indicateurs.gainLecturePistes} pts
                    </div>
                    <div className="text-[11px] text-[#55645B]">
                      Glouton (Pistes+2D6) vs Réflexe
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                    <div className="text-xs text-[#55645B]">
                      Gain Déduction Séquentielle
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#256B45] mt-1">
                      +{rapportInteretActif.indicateurs.gainDeductionSequentielle} pts
                    </div>
                    <div className="text-[11px] text-[#55645B]">
                      Déductif (Poses alliées) vs Glouton
                    </div>
                  </div>
                </div>

                {/* Tableau comparatif des 6 Bots */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8DFD5] text-[#55645B]">
                        <th className="py-2 pr-3 font-semibold">Joueur Virtuel (Bot)</th>
                        <th className="py-2 px-3 font-semibold text-right">Forêt Sauvée (%)</th>
                        <th className="py-2 px-3 font-semibold text-right">Écart-type</th>
                        <th className="py-2 px-3 font-semibold text-right">Pire Décile</th>
                        <th className="py-2 px-3 font-semibold text-right">Coupes subies</th>
                        <th className="py-2 px-3 font-semibold text-right">Parades</th>
                        <th className="py-2 px-3 font-semibold text-right">Sabotages</th>
                        <th className="py-2 pl-3 font-semibold text-right">
                          Répartition Actions (Dépl / Prot / Sab)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8DFD5] font-mono-tabular">
                      {rapportInteretActif.echelleBots.map((row) => (
                        <tr key={row.botId} className="hover:bg-[#F4F5F0]/60">
                          <td className="py-2.5 pr-3 font-sans font-semibold text-[#16211B]">
                            {row.botNom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#256B45]">
                            {row.foretSauveeMoyennePct.toFixed(1)} %
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#55645B]">
                            ±{row.ecartTypePct.toFixed(1)} %
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#16211B]">
                            {row.pireDecilePct.toFixed(1)} %
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#C2412D]">
                            {row.arbresCoupesMoyen.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#16211B]">
                            {row.paradesMoyennes.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#16211B]">
                            {row.sabotagesMoyens.toFixed(1)}
                          </td>
                          <td className="py-2.5 pl-3 text-right text-[#55645B]">
                            {row.tauxUsageActions.deplacer}% /{' '}
                            {row.tauxUsageActions.proteger}% /{' '}
                            {row.tauxUsageActions.saboter}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Synthèse analytique */}
                <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                  <div className="text-xs font-semibold text-[#16211B] mb-1.5">
                    Conclusions analytiques sur la variante :
                  </div>
                  <ul className="space-y-1 text-xs text-[#55645B]">
                    {rapportInteretActif.syntheseAnalytique.map((ligne, i) => (
                      <li key={i}>• {ligne}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-6 text-center text-xs text-[#55645B] bg-[#F4F5F0] rounded-lg">
                Aucun rapport 3.2 disponible pour cette variante. Cliquez sur « Lancer la batterie d’intérêt 3.2 » ci-dessus.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 3.3 : SÉLECTION DE VARIANTES & PLANIFICATION SUR LA VM ORACLE CLOUD */}
      {subTab === 'selection_vm_33' && (
        <div className="space-y-5">
          {/* Classement 3.3 des meilleures variantes viables */}
          <div className="bg-white rounded-xl p-5 border border-[#D8DFD5]">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D8DFD5]">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  3.3 Sélection des Variantes les plus intéressantes (Pipeline 3.1 → 3.2 → Classement)
                </h3>
                <p className="text-xs text-[#55645B]">
                  Élimine les variantes non viables puis trie les variantes survivantes par score d’intérêt stratégique.
                </p>
              </div>
              <button
                onClick={handleRunSelection33}
                disabled={enCours}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {enCours
                  ? 'Exécution du pipeline 3.1 + 3.2...'
                  : 'Lancer la sélection comparative sur toutes les variantes'}
              </button>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D8DFD5] text-[#55645B]">
                    <th className="py-2 pr-3 font-semibold">Rang</th>
                    <th className="py-2 px-3 font-semibold">Variante V0.1 (Viables uniquement)</th>
                    <th className="py-2 px-3 font-semibold">Séquencement & Actions</th>
                    <th className="py-2 px-3 font-semibold text-right">Score d’Intérêt</th>
                    <th className="py-2 px-3 font-semibold text-right">Bande</th>
                    <th className="py-2 pl-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DFD5]">
                  {variantes
                    .filter((v) => v.statutViabilite !== 'eliminee')
                    .sort(
                      (a, b) =>
                        (b.scoreInteretDernierTest || 0) -
                        (a.scoreInteretDernierTest || 0)
                    )
                    .map((v, idx) => (
                      <tr key={v.id} className="hover:bg-[#F4F5F0]/60">
                        <td className="py-2.5 pr-3 font-mono-tabular font-bold text-[#16211B]">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#16211B]">
                          {v.nom}
                        </td>
                        <td className="py-2.5 px-3 text-[#55645B]">
                          {v.modeProgrammation} · {v.modeResolution} · Prot:{v.effetProteger} · Sab:{v.effetSaboter}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-[#16211B]">
                          {v.scoreInteretDernierTest ?? '—'} / 100
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">
                          <span
                            className={
                              v.bandeSante === 'vert'
                                ? 'text-[#256B45]'
                                : v.bandeSante === 'orange'
                                ? 'text-amber-700'
                                : 'text-[#55645B]'
                            }
                          >
                            {(v.bandeSante || 'à évaluer').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            onClick={() => onSelectVariante(v.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#16211B] text-white whitespace-nowrap shrink-0"
                          >
                            Adopter dans Proto
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planificateur & Runner VM Oracle Cloud */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  Campagnes Planifiées sur la VM Oracle Cloud
                </h3>
                <p className="text-xs text-[#55645B]">
                  Ordonnancement automatique des campagnes d’exploration V0.1 (génération de variantes, élimination 3.1, évaluation 3.2 et synchronisation GitHub).
                </p>
              </div>

              <div className="space-y-3">
                {campagnesVM.map((cvm) => (
                  <div
                    key={cvm.id}
                    className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-[#16211B]">
                          {cvm.nom}
                        </div>
                        <div className="text-xs font-mono-tabular text-[#55645B]">
                          Cron : <strong>{cvm.cronExpression}</strong> ·{' '}
                          {cvm.prochaineExecutionEstimee} · Viabilité:{' '}
                          {cvm.nbPartiesViabilite}p / Intérêt: {cvm.nbPartiesInteret}p
                        </div>
                      </div>
                      <button
                        onClick={() => handleRunVMNow(cvm.id)}
                        disabled={enCours}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        Exécuter ce lot maintenant
                      </button>
                    </div>

                    {cvm.journalVM.length > 0 && (
                      <div className="p-2.5 rounded bg-white border border-[#D8DFD5] font-mono-tabular text-[11px] text-[#55645B] space-y-1">
                        {cvm.journalVM.slice(0, 3).map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-col justify-between space-y-4">
              <form onSubmit={handleAddScheduleVM} className="space-y-3">
                <h3 className="font-display text-base font-semibold text-[#16211B]">
                  Ajouter une Planification VM Oracle Cloud
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Intitulé de la campagne planifiée
                  </label>
                  <input
                    type="text"
                    value={nouveauNomVM}
                    onChange={(e) => setNouveauNomVM(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Expression Cron (VM Oracle Cloud)
                  </label>
                  <input
                    type="text"
                    value={nouveauCronVM}
                    onChange={(e) => setNouveauCronVM(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap"
                >
                  Enregistrer la tâche planifiée VM
                </button>
              </form>

              <div className="p-3.5 rounded-lg bg-[#1E3528] text-emerald-100 text-xs space-y-1.5">
                <div className="font-semibold text-white">
                  Commande Worker sur votre VM Oracle Cloud :
                </div>
                <div className="font-mono-tabular text-[11px] bg-black/30 p-2 rounded select-all">
                  npm run vm:worker -- --generate=8 --viabilite=24 --interet=60 --push
                </div>
                <div className="text-[11px] text-emerald-200/80">
                  Crontab VM recommandé :{' '}
                  <code className="font-mono-tabular">
                    0 2 * * * cd ~/Projet_Jeu && npm run vm:worker -- --push
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
