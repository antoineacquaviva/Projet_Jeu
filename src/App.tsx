import React, { useState, useEffect, useMemo } from 'react';
import {
  AnalyseGeminiCampagne,
  AtelierComponentId,
  CampagneSelection33,
  EtatJeuV01,
  GameVersionId,
  GameVersionSpec,
  LabIdea,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from './shared/types';
import { VARIANTES_INITIALES_V01 } from './shared/moteur';
import { VERSIONS_JEU_INITIALES } from './shared/versions-registry';
import {
  CAMPAGNES_VM_INITIALES,
  IDEES_INITIALES_LABO,
} from './shared/labo-initial';
import {
  construireAnalyseCampagneStructurer,
  executerCampagneSelection33,
} from './shared/tests-engine';
import { JeuView } from './components/JeuView';
import { DemoView } from './components/DemoView';
import { ProtoView } from './components/ProtoView';
import { TestsView } from './components/TestsView';
import { MoteurBotsView } from './components/MoteurBotsView';
import { LaboView } from './components/LaboView';

export const App: React.FC = () => {
  const [ongletActif, setOngletActif] = useState<AtelierComponentId>('jeu');
  const [versions, setVersions] = useState<GameVersionSpec[]>(
    VERSIONS_JEU_INITIALES
  );
  const [versionActiveId, setVersionActiveId] = useState<GameVersionId>('0.3');
  const [variantes, setVariantes] = useState<VariantV01[]>(
    VARIANTES_INITIALES_V01
  );
  const [varianteActiveId, setVarianteActiveId] = useState<string>(
    'v03_double_plateau_reference'
  );
  const [rapportsViabilite, setRapportsViabilite] = useState<
    RapportViabilite31[]
  >([]);
  const [rapportsInteret, setRapportsInteret] = useState<RapportInteret32[]>(
    []
  );
  const [campagnesSelection, setCampagnesSelection] = useState<
    CampagneSelection33[]
  >([]);
  const [campagnesVM, setCampagnesVM] = useState<ScheduledCampaignVM[]>(
    CAMPAGNES_VM_INITIALES
  );
  const [analysesGemini, setAnalysesGemini] = useState<AnalyseGeminiCampagne[]>(
    []
  );
  const [ideesLabo, setIdeesLabo] = useState<LabIdea[]>(IDEES_INITIALES_LABO);
  const [etatProtoExterne, setEtatProtoExterne] = useState<EtatJeuV01 | null>(
    null
  );

  // Charger l'état persisté depuis le serveur d'Atelier (/api/atelier/state)
  useEffect(() => {
    let ignore = false;
    async function fetchState() {
      try {
        const resp = await fetch('/api/atelier/state');
        if (resp.ok) {
          const data = await resp.json();
          if (!ignore && data) {
            if (Array.isArray(data.versions) && data.versions.length > 0) {
              const existVerIds = new Set(
                data.versions.map((v: GameVersionSpec) => v.id)
              );
              const verManquantes = VERSIONS_JEU_INITIALES.filter(
                (v) => !existVerIds.has(v.id)
              );
              setVersions([...data.versions, ...verManquantes]);
            }
            if (Array.isArray(data.variantes) && data.variantes.length > 0) {
              const existIds = new Set(
                data.variantes.map((v: VariantV01) => v.id)
              );
              const manquantes = VARIANTES_INITIALES_V01.filter(
                (v) => !existIds.has(v.id)
              );
              setVariantes([...data.variantes, ...manquantes]);
            }
            if (Array.isArray(data.rapportsViabilite)) {
              setRapportsViabilite(data.rapportsViabilite);
            }
            if (Array.isArray(data.rapportsInteret)) {
              setRapportsInteret(data.rapportsInteret);
            }
            if (Array.isArray(data.campagnesSelection)) {
              setCampagnesSelection(data.campagnesSelection);
            }
            if (Array.isArray(data.campagnesPlanifieesVM)) {
              setCampagnesVM(data.campagnesPlanifieesVM);
            }
            if (Array.isArray(data.analysesGemini)) {
              setAnalysesGemini(data.analysesGemini);
            }
            if (Array.isArray(data.ideesLabo) && data.ideesLabo.length > 0) {
              const existIdeaIds = new Set(
                data.ideesLabo.map((i: LabIdea) => i.id)
              );
              const ideesManquantes = IDEES_INITIALES_LABO.filter(
                (i) => !existIdeaIds.has(i.id)
              );
              setIdeesLabo([...data.ideesLabo, ...ideesManquantes]);
            }
            return;
          }
        }
      } catch (_err) {
        // Initialisation locale isomorphe si hors-ligne
      }
      if (!ignore) {
        const cibles = VARIANTES_INITIALES_V01.filter(
          (v) => v.statutViabilite !== 'eliminee'
        );
        const { campagne } = executerCampagneSelection33(
          cibles,
          'Campagne Initiale V0.1 · V0.2 · V0.3 (9 Bots + Banc 3–6J)',
          5,
          5,
          ['0.1', '0.2', '0.3']
        );
        setRapportsViabilite(campagne.rapportsViabilite);
        setRapportsInteret(campagne.rapportsInteret);
        setCampagnesSelection([campagne]);
        setAnalysesGemini([construireAnalyseCampagneStructurer(campagne)]);
      }
    }
    fetchState();
    return () => {
      ignore = true;
    };
  }, []);

  // Variante recommandée par les campagnes de tests (meilleur score d'intérêt parmi les variantes viables)
  const varianteRecommandee = useMemo(() => {
    const viables = variantes.filter((v) => v.statutViabilite === 'viable');
    if (viables.length === 0) return variantes[0];

    const premiereCampagneId = campagnesSelection[0]?.meilleureVarianteId;
    return [...viables].sort((a, b) => {
      const scoreA =
        (a.scoreInteretDernierTest ?? 0) +
        (a.id === premiereCampagneId ? 3 : 0) +
        (a.version === '0.3' ? 1 : 0);
      const scoreB =
        (b.scoreInteretDernierTest ?? 0) +
        (b.id === premiereCampagneId ? 3 : 0) +
        (b.version === '0.3' ? 1 : 0);
      return scoreB - scoreA;
    })[0];
  }, [variantes, campagnesSelection]);

  const versionActive = useMemo(
    () => versions.find((v) => v.id === versionActiveId) || versions[0],
    [versions, versionActiveId]
  );

  // Variantes appartenant à la version active du Jeu
  const variantesDeLaVersion = useMemo(() => {
    const filtrees = variantes.filter(
      (v) => (v.version || '0.1') === versionActive.id
    );
    return filtrees.length > 0 ? filtrees : variantes;
  }, [variantes, versionActive]);

  const varianteActive = useMemo(
    () =>
      variantesDeLaVersion.find((v) => v.id === varianteActiveId) ||
      variantesDeLaVersion[0] ||
      variantes[0],
    [variantesDeLaVersion, variantes, varianteActiveId]
  );

  const handleSelectVersion = (nouvelleVersionId: GameVersionId) => {
    setVersionActiveId(nouvelleVersionId);
    if ((varianteRecommandee?.version || '0.3') === nouvelleVersionId) {
      setVarianteActiveId(varianteRecommandee.id);
      return;
    }
    const premiereVar = variantes.find(
      (v) => (v.version || '0.1') === nouvelleVersionId
    );
    if (premiereVar) {
      setVarianteActiveId(premiereVar.id);
    }
  };

  const handleSelectVarianteGlobale = (
    id: string,
    versionId?: GameVersionId
  ) => {
    const ver =
      versionId || variantes.find((v) => v.id === id)?.version || '0.3';
    if (ver !== versionActiveId) {
      setVersionActiveId(ver);
    }
    setVarianteActiveId(id);
  };

  const handleSaveVariante = async (
    nouvelleOuMaj: VariantV01,
    estNouvelle: boolean
  ) => {
    try {
      const resp = await fetch('/api/atelier/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouvelleOuMaj),
      });
      if (resp.ok) {
        const data = await resp.json();
        setVariantes(data.state.variantes);
        if (nouvelleOuMaj.version) {
          setVersionActiveId(nouvelleOuMaj.version);
        }
        setVarianteActiveId(nouvelleOuMaj.id);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    setVariantes((prev) => {
      if (estNouvelle || !prev.some((v) => v.id === nouvelleOuMaj.id)) {
        return [nouvelleOuMaj, ...prev];
      }
      return prev.map((v) => (v.id === nouvelleOuMaj.id ? nouvelleOuMaj : v));
    });
    if (nouvelleOuMaj.version) {
      setVersionActiveId(nouvelleOuMaj.version);
    }
    setVarianteActiveId(nouvelleOuMaj.id);
  };

  const handleCreateNewVersion = async (
    nouvelleVersion: GameVersionSpec,
    varianteSocle: VariantV01,
    ideesPromuesIds: string[]
  ) => {
    setVersions((prev) => [
      ...prev.filter((v) => v.id !== nouvelleVersion.id),
      nouvelleVersion,
    ]);
    setVariantes((prev) => [varianteSocle, ...prev]);
    setVersionActiveId(nouvelleVersion.id);
    setVarianteActiveId(varianteSocle.id);

    setIdeesLabo((prev) =>
      prev.map((idee) =>
        ideesPromuesIds.includes(idee.id)
          ? {
              ...idee,
              versionCible: nouvelleVersion.id,
              varianteLieeId: varianteSocle.id,
            }
          : idee
      )
    );

    try {
      await fetch('/api/atelier/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: nouvelleVersion,
          varianteSocle,
          ideesPromuesIds,
        }),
      });
    } catch (_e) {
      // Conservé en mémoire locale
    }
  };

  const handleSaveIdeeLabo = async (idee: LabIdea) => {
    try {
      const resp = await fetch('/api/atelier/labo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idee),
      });
      if (resp.ok) {
        const data = await resp.json();
        setIdeesLabo(data.state.ideesLabo);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    setIdeesLabo((prev) => {
      const idx = prev.findIndex((i) => i.id === idee.id);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = idee;
        return clone;
      }
      return [idee, ...prev];
    });
  };

  const handleDeleteIdeeLabo = async (id: string) => {
    try {
      const resp = await fetch(`/api/atelier/labo/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        const data = await resp.json();
        setIdeesLabo(data.state.ideesLabo);
        return;
      }
    } catch (_e) {
      // Fallback local
    }
    setIdeesLabo((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F0] text-[#16211B]">
      {/* BARRE SUPÉRIEURE DE L'ATELIER : Marque | Onglets sans numérotation | Sélecteur de Version & Variante */}
      <header className="bg-white border-b border-[#D8DFD5] px-6 py-3.5 flex flex-wrap items-center justify-between gap-6">
        {/* Zone 1 : Identité de l'Atelier */}
        <a
          href="#atelier"
          onClick={(e) => {
            e.preventDefault();
            setOngletActif('jeu');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#16211B] whitespace-nowrap shrink-0"
        >
          Atelier de conception
        </a>

        {/* Zone 2 : Navigation principale ordonnée et sans numérotation */}
        <nav className="flex items-center gap-6 text-sm font-medium text-[#55645B] overflow-x-auto">
          {(
            [
              { id: 'jeu', label: 'Le Jeu' },
              { id: 'demo', label: 'Démo' },
              { id: 'proto', label: 'Proto' },
              { id: 'moteur_bots', label: 'Moteur & Bots' },
              { id: 'tests', label: 'Tests' },
              { id: 'labo', label: 'Labo' },
            ] as { id: AtelierComponentId; label: string }[]
          ).map((item) => {
            const actif = ongletActif === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setOngletActif(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  actif
                    ? 'text-[#16211B] font-semibold border-[#256B45]'
                    : 'text-[#55645B] border-transparent hover:text-[#16211B]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3 : Sélecteur de Version du Jeu + Sélecteur de Variante + Accès rapide Recommandée */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {varianteRecommandee &&
            varianteActive.id !== varianteRecommandee.id && (
              <button
                type="button"
                onClick={() =>
                  handleSelectVarianteGlobale(
                    varianteRecommandee.id,
                    varianteRecommandee.version || '0.3'
                  )
                }
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-400 hover:bg-amber-200 transition-colors whitespace-nowrap"
                title={`Revenir à la variante recommandée par les tests : ${varianteRecommandee.nom}`}
              >
                ★ Variante recommandée
              </button>
            )}

          {varianteRecommandee &&
            varianteActive.id === varianteRecommandee.id && (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-100 text-[#165B36] border border-emerald-300 whitespace-nowrap">
                ★ Recommandée par les tests
              </span>
            )}

          <select
            aria-label="Sélectionner la version du Jeu"
            value={versionActive.id}
            onChange={(e) => handleSelectVersion(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#1E3528] bg-[#1E3528] text-white"
          >
            {versions.map((ver) => (
              <option key={ver.id} value={ver.id}>
                Jeu V{ver.id}
                {varianteRecommandee?.version === ver.id ? ' ★' : ''}
              </option>
            ))}
          </select>

          <select
            aria-label="Sélectionner la variante de la version active"
            value={varianteActive.id}
            onChange={(e) => setVarianteActiveId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] max-w-[300px] truncate"
          >
            {variantesDeLaVersion.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === varianteRecommandee?.id ? '★ [RECOMMANDÉE] ' : ''}
                {v.statutViabilite === 'eliminee' ? '[ÉLIMINÉE] ' : ''}
                {v.nom}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Sous-barre de contexte de la Version et Variante actives */}
      <div className="bg-[#EAECE4] border-b border-[#D8DFD5] px-6 py-2 text-xs text-[#55645B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span>
            Le Jeu :{' '}
            <strong className="text-[#16211B]">
              {versionActive.nomJeu} (Version {versionActive.id})
            </strong>
          </span>
          <span className="mx-2">·</span>
          <span>
            Variante :{' '}
            <strong className="text-[#16211B]">{varianteActive.nom}</strong>
          </span>
          <span className="mx-2">·</span>
          <span>
            Statut :{' '}
            <strong
              className={
                varianteActive.statutViabilite === 'viable'
                  ? 'text-[#256B45]'
                  : varianteActive.statutViabilite === 'eliminee'
                  ? 'text-[#C2412D]'
                  : 'text-amber-700'
              }
            >
              {varianteActive.statutViabilite === 'viable'
                ? 'Viable'
                : varianteActive.statutViabilite === 'eliminee'
                ? 'Éliminée (Non viable)'
                : 'À tester'}
            </strong>
          </span>
        </div>

        <div className="font-mono-tabular">
          <span>
            Plateau :{' '}
            <strong className="text-[#16211B]">
              {varianteActive.geometriePlateau === 'double_plateau_34_56'
                ? 'Double-Face 3–4J/5–6J'
                : varianteActive.geometriePlateau === 'hex_couronne_19'
                ? 'Hexagonal 19 cases'
                : varianteActive.geometriePlateau === 'clairieres_sentiers'
                ? 'Clairières & Sentiers'
                : 'Modulaire Secteurs'}
            </strong>
          </span>
          <span className="mx-2">·</span>
          <span>{varianteActive.nbJoueurs} Joueurs</span>
          <span className="mx-2">·</span>
          <span>{varianteActive.defenseursParJoueur} Déf./J</span>
          <span className="mx-2">·</span>
          <span>{varianteActive.machinesInitiales}/6 Machines</span>
          <span className="mx-2">·</span>
          <span>{varianteActive.nbTours} Tours</span>
        </div>
      </div>

      {/* Contenu principal (1440px max-width centré) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6">
        {ongletActif === 'jeu' && (
          <JeuView
            versions={versions}
            versionActive={versionActive}
            variantesVersion={variantesDeLaVersion}
            varianteActive={varianteActive}
            varianteRecommandee={varianteRecommandee}
            ideesLabo={ideesLabo}
            onSelectVersion={handleSelectVersion}
            onSelectVariante={(id, ver) => handleSelectVarianteGlobale(id, ver)}
            onNavigateTab={(tab) => setOngletActif(tab)}
            onCreateNewVersion={handleCreateNewVersion}
            onUpdateVarianteOption={(maj) => handleSaveVariante(maj, false)}
          />
        )}

        {ongletActif === 'demo' && (
          <DemoView
            variante={varianteActive}
            versionSpec={versionActive}
            onOpenInProto={(etatDemo) => {
              setEtatProtoExterne(etatDemo);
              setOngletActif('proto');
            }}
          />
        )}

        {ongletActif === 'proto' && (
          <ProtoView
            variante={varianteActive}
            etatInitialExterne={etatProtoExterne}
            onClearEtatExterne={() => setEtatProtoExterne(null)}
          />
        )}

        {ongletActif === 'tests' && (
          <TestsView
            varianteActive={varianteActive}
            variantes={variantesDeLaVersion}
            toutesVariantes={variantes}
            rapportsViabilite={rapportsViabilite}
            rapportsInteret={rapportsInteret}
            campagnesSelection={campagnesSelection}
            campagnesVM={campagnesVM}
            analysesGemini={analysesGemini}
            onSelectVariante={(id, ver) => {
              handleSelectVarianteGlobale(id, ver);
            }}
            onNavigateTab={(tab) => setOngletActif(tab)}
            onUpdateStateFromTests={(payload) => {
              if (payload.variantes) setVariantes(payload.variantes);
              if (payload.rapportsViabilite)
                setRapportsViabilite(payload.rapportsViabilite);
              if (payload.rapportsInteret)
                setRapportsInteret(payload.rapportsInteret);
              if (payload.campagnesSelection)
                setCampagnesSelection(payload.campagnesSelection);
              if (payload.campagnesVM) setCampagnesVM(payload.campagnesVM);
              if (payload.analysesGemini)
                setAnalysesGemini(payload.analysesGemini);
              if (payload.versionActiveId)
                setVersionActiveId(payload.versionActiveId);
              if (payload.varianteActiveId)
                setVarianteActiveId(payload.varianteActiveId);
            }}
          />
        )}

        {ongletActif === 'moteur_bots' && (
          <MoteurBotsView
            varianteActive={varianteActive}
            onSaveVariante={handleSaveVariante}
          />
        )}

        {ongletActif === 'labo' && (
          <LaboView
            idees={ideesLabo}
            variantes={variantes}
            versions={versions}
            onSaveIdee={handleSaveIdeeLabo}
            onDeleteIdee={handleDeleteIdeeLabo}
            onSelectVariante={(id) => {
              handleSelectVarianteGlobale(id);
              setOngletActif('proto');
            }}
            onSelectVersion={(verId) => {
              handleSelectVersion(verId);
              setOngletActif('jeu');
            }}
          />
        )}
      </main>
    </div>
  );
};
