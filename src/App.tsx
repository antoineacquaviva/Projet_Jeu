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
  resoudreVarianteParId,
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
  const [versionActiveId, setVersionActiveId] = useState<GameVersionId>('0.5');
  const [variantes, setVariantes] = useState<VariantV01[]>(
    VARIANTES_INITIALES_V01
  );
  const [varianteActiveId, setVarianteActiveId] =
    useState<string>('v05_comb_018');
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
              const initParId = new Map(
                VERSIONS_JEU_INITIALES.map((v) => [v.id, v])
              );
              const versionsMaj = data.versions.map((v: GameVersionSpec) =>
                initParId.has(v.id) ? initParId.get(v.id)! : v
              );
              const existVerIds = new Set(
                versionsMaj.map((v: GameVersionSpec) => v.id)
              );
              const verManquantes = VERSIONS_JEU_INITIALES.filter(
                (v) => !existVerIds.has(v.id)
              );
              setVersions([...verManquantes, ...versionsMaj]);
            }

            let variantesChargees = VARIANTES_INITIALES_V01;
            if (Array.isArray(data.variantes) && data.variantes.length > 0) {
              const initVarParId = new Map(
                VARIANTES_INITIALES_V01.map((v) => [v.id, v])
              );
              const varMaj = data.variantes.map((v: VariantV01) =>
                initVarParId.has(v.id) ? { ...initVarParId.get(v.id)!, ...v } : v
              );
              const existIds = new Set(varMaj.map((v: VariantV01) => v.id));
              const manquantes = VARIANTES_INITIALES_V01.filter(
                (v) => !existIds.has(v.id)
              );
              variantesChargees = [...varMaj, ...manquantes];
            }

            const campagnesExistantes: CampagneSelection33[] = Array.isArray(
              data.campagnesSelection
            )
              ? data.campagnesSelection
              : [];

            // Synchroniser d'emblée la variante n°1 de la campagne V0.5 dans la liste et la sélection active
            const campV05 = campagnesExistantes.find((c) =>
              (c.versionsCibles || []).includes('0.5')
            );
            const bestId =
              campV05?.meilleureVarianteId ||
              campV05?.rapportsInteret?.[0]?.varianteId;
            if (bestId) {
              const rapBest = campV05?.rapportsInteret?.find(
                (r) => r.varianteId === bestId
              );
              const varResolue = resoudreVarianteParId(
                bestId,
                variantesChargees,
                rapBest
              );
              if (varResolue) {
                variantesChargees = [
                  varResolue,
                  ...variantesChargees.filter((v) => v.id !== varResolue.id),
                ];
                setVarianteActiveId(varResolue.id);
              }
            }

            setVariantes(variantesChargees);
            if (Array.isArray(data.rapportsViabilite)) {
              setRapportsViabilite(data.rapportsViabilite);
            }
            if (Array.isArray(data.rapportsInteret)) {
              setRapportsInteret(data.rapportsInteret);
            }
            if (campagnesExistantes.length > 0) {
              setCampagnesSelection(campagnesExistantes);
            }
            if (Array.isArray(data.analysesGemini)) {
              setAnalysesGemini(data.analysesGemini);
            }
            if (Array.isArray(data.campagnesPlanifieesVM)) {
              setCampagnesVM(data.campagnesPlanifieesVM);
            }
            if (Array.isArray(data.ideesLabo) && data.ideesLabo.length > 0) {
              setIdeesLabo(data.ideesLabo);
            }
            return;
          }
        }
      } catch (_err) {
        // Initialisation locale si hors-ligne
      }
      if (!ignore) {
        const cibles = VARIANTES_INITIALES_V01.filter(
          (v) => v.version === '0.5' && v.statutViabilite !== 'eliminee'
        );
        const { campagne } = executerCampagneSelection33(
          cibles,
          'Campagne Comparative V0.5 — Cœur Épuré',
          4,
          4,
          ['0.5']
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

  // Variante recommandée par les campagnes de tests (priorité au #1 Pareto de la campagne active)
  const varianteRecommandee = useMemo(() => {
    const campagneVActive = campagnesSelection.find((c) =>
      (c.versionsCibles || []).includes(versionActiveId)
    );
    const meilleureCampagneId =
      campagneVActive?.meilleureVarianteId ||
      campagnesSelection[0]?.meilleureVarianteId;

    if (meilleureCampagneId) {
      const rapGagnant = campagneVActive?.rapportsInteret?.find(
        (r) => r.varianteId === meilleureCampagneId
      );
      const gagnante = resoudreVarianteParId(
        meilleureCampagneId,
        variantes,
        rapGagnant
      );
      if (gagnante) return gagnante;
    }

    const viablesVersion = variantes.filter(
      (v) =>
        v.statutViabilite === 'viable' &&
        (v.version || '0.1') === versionActiveId
    );
    const pool =
      viablesVersion.length > 0
        ? viablesVersion
        : variantes.filter((v) => v.statutViabilite === 'viable');
    if (pool.length === 0) return variantes[0];

    return [...pool].sort(
      (a, b) =>
        (b.scoreInteretDernierTest ?? 0) - (a.scoreInteretDernierTest ?? 0)
    )[0];
  }, [variantes, campagnesSelection, versionActiveId]);

  const versionActive = useMemo(
    () =>
      versions.find((v) => v.id === versionActiveId) ||
      versions.find((v) => v.id === '0.5') ||
      versions[0],
    [versions, versionActiveId]
  );

  // Variantes appartenant à la version active du Jeu
  const variantesDeLaVersion = useMemo(() => {
    const filtrees = variantes.filter(
      (v) => (v.version || '0.1') === versionActive.id
    );
    return filtrees.length > 0 ? filtrees : variantes;
  }, [variantes, versionActive]);

  const varianteActive = useMemo(() => {
    const resolue = resoudreVarianteParId(varianteActiveId, variantes);
    if (resolue) return resolue;
    return varianteRecommandee || variantesDeLaVersion[0] || variantes[0];
  }, [variantes, varianteActiveId, varianteRecommandee, variantesDeLaVersion]);

  const handleSelectVersion = (nouvelleVersionId: GameVersionId) => {
    setVersionActiveId(nouvelleVersionId);
    if ((varianteRecommandee?.version || '0.5') === nouvelleVersionId) {
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
    const varCible = resoudreVarianteParId(id, variantes);
    if (varCible && !variantes.some((v) => v.id === id)) {
      setVariantes((prev) => [varCible, ...prev.filter((v) => v.id !== id)]);
    }
    const ver = versionId || varCible?.version || '0.5';
    if (ver !== versionActiveId) {
      setVersionActiveId(ver);
    }
    setVarianteActiveId(id);
    setEtatProtoExterne(null);
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

  const estRecommandeeSelectionnee =
    varianteRecommandee && varianteActive.id === varianteRecommandee.id;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F0] text-[#16211B]">
      {/* BARRE SUPÉRIEURE ÉPURÉE : Marque | 6 Onglets | Sélecteur Version & Variante */}
      <header className="bg-white border-b border-[#D8DFD5] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Zone 1 : Identité */}
        <a
          href="#atelier"
          onClick={(e) => {
            e.preventDefault();
            setOngletActif('jeu');
          }}
          className="font-display text-base font-bold tracking-tight text-[#16211B] whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span>Les Gardiens de la Forêt</span>
          <span className="text-xs font-mono font-normal text-[#55645B]">
            · Atelier V{versionActive.id}
          </span>
        </a>

        {/* Zone 2 : Navigation principale */}
        <nav className="flex items-center gap-5 text-sm font-medium text-[#55645B] overflow-x-auto">
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

        {/* Zone 3 : Sélecteurs compacts Version + Variante */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {varianteRecommandee && !estRecommandeeSelectionnee && (
            <button
              type="button"
              onClick={() =>
                handleSelectVarianteGlobale(
                  varianteRecommandee.id,
                  varianteRecommandee.version || '0.5'
                )
              }
              className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-400 hover:bg-amber-200 transition-colors whitespace-nowrap"
              title={`Revenir à la variante #1 des tests : ${varianteRecommandee.nom}`}
            >
              ★ Activer #1 Pareto
            </button>
          )}

          <select
            aria-label="Sélectionner la version du Jeu"
            value={versionActive.id}
            onChange={(e) => handleSelectVersion(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-md border border-[#1E3528] bg-[#1E3528] text-white"
          >
            <optgroup label="Version Active">
              {versions
                .filter((ver) => ver.statut !== 'archivee')
                .map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    V{ver.id}
                  </option>
                ))}
            </optgroup>
            {versions.some((ver) => ver.statut === 'archivee') && (
              <optgroup label="Archives (V0.1 – V0.4)">
                {versions
                  .filter((ver) => ver.statut === 'archivee')
                  .map((ver) => (
                    <option key={ver.id} value={ver.id}>
                      [Archive] V{ver.id}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          <select
            aria-label="Sélectionner la variante active sur tous les onglets"
            value={varianteActive.id}
            onChange={(e) => handleSelectVarianteGlobale(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] max-w-[330px] truncate"
          >
            {variantesDeLaVersion.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === varianteRecommandee?.id ? '★ [#1 PARETO] ' : ''}
                {v.statutViabilite === 'eliminee' ? '[ÉLIMINÉE] ' : ''}
                {v.nom}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Bandeau contextuel discret sur une seule ligne (synchronisé sur les 6 onglets) */}
      <div className="bg-[#EAECE4]/80 border-b border-[#D8DFD5] px-6 py-1.5 text-xs text-[#55645B] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {estRecommandeeSelectionnee && (
            <span className="font-mono font-bold text-[#256B45]">
              ★ #1 Pareto ({varianteActive.scoreInteretDernierTest ?? 94}/100)
            </span>
          )}
          <strong className="text-[#16211B]">{varianteActive.nom}</strong>
        </div>

        <div className="font-mono-tabular text-[11px] flex flex-wrap items-center gap-2">
          <span>
            Plateau Double-Face (3–4J Recto 9 zones / 5–6J Verso 13 zones)
          </span>
          <span>·</span>
          <span>{varianteActive.defenseursParJoueur} Déf./J</span>
          <span>·</span>
          <span>{varianteActive.machinesInitiales} Machines (4–6J) / 3 (3J)</span>
          <span>·</span>
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
