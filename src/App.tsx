import React, { useState, useEffect } from 'react';
import {
  AtelierComponentId,
  CampagneSelection33,
  EtatJeuV01,
  LabIdea,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from './shared/types';
import { VARIANTES_INITIALES_V01 } from './shared/moteur';
import {
  CAMPAGNES_VM_INITIALES,
  IDEES_INITIALES_LABO,
} from './shared/labo-initial';
import {
  evaluerInteretVariante32,
  evaluerViabiliteVariante31,
} from './shared/tests-engine';
import { DemoView } from './components/DemoView';
import { ProtoView } from './components/ProtoView';
import { TestsView } from './components/TestsView';
import { MoteurBotsView } from './components/MoteurBotsView';
import { LaboView } from './components/LaboView';

export const App: React.FC = () => {
  const [ongletActif, setOngletActif] = useState<AtelierComponentId>('proto');
  const [variantes, setVariantes] = useState<VariantV01[]>(
    VARIANTES_INITIALES_V01
  );
  const [varianteActiveId, setVarianteActiveId] = useState<string>(
    VARIANTES_INITIALES_V01[0].id
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
            if (Array.isArray(data.variantes) && data.variantes.length > 0) {
              setVariantes(data.variantes);
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
            if (Array.isArray(data.ideesLabo)) {
              setIdeesLabo(data.ideesLabo);
            }
            return;
          }
        }
      } catch (_err) {
        // Initialisation locale isomorphe si hors-ligne
      }
      if (!ignore) {
        setRapportsViabilite(
          VARIANTES_INITIALES_V01.map((v) => evaluerViabiliteVariante31(v, 8))
        );
        setRapportsInteret([
          evaluerInteretVariante32(VARIANTES_INITIALES_V01[0], 10),
        ]);
      }
    }
    fetchState();
    return () => {
      ignore = true;
    };
  }, []);

  const varianteActive =
    variantes.find((v) => v.id === varianteActiveId) || variantes[0];

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
    setVarianteActiveId(nouvelleOuMaj.id);
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
      {/* TOP BAR CONTRACT : 3 ZONES (Brand | 5 Navigation Links | 1 Primary Variant Selector) */}
      <header className="bg-white border-b border-[#D8DFD5] px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1 : Brand Wordmark (single text element) */}
        <a
          href="#atelier"
          onClick={(e) => {
            e.preventDefault();
            setOngletActif('proto');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#16211B] whitespace-nowrap shrink-0"
        >
          Atelier de conception V1
        </a>

        {/* Zone 2 : 5 Single-Line Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-[#55645B] overflow-x-auto">
          {(
            [
              { id: 'demo', label: '4. Démo' },
              { id: 'proto', label: '5. Proto' },
              { id: 'tests', label: '3. Tests' },
              { id: 'moteur_bots', label: '1–2. Moteur & Bots' },
              { id: 'labo', label: '6. Labo' },
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

        {/* Zone 3 : Sélecteur de Variante V0.1 */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Sélectionner la variante de Défenseurs de la forêt V0.1"
            value={varianteActive.id}
            onChange={(e) => setVarianteActiveId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] max-w-[270px] truncate"
          >
            {variantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.statutViabilite === 'eliminee' ? '[ÉLIMINÉE] ' : ''}
                {v.nom}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Sous-barre de contexte du Jeu actif : Défenseurs de la forêt V0.1 */}
      <div className="bg-[#EAECE4] border-b border-[#D8DFD5] px-6 py-2 text-xs text-[#55645B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span>
            Le Jeu : <strong className="text-[#16211B]">Défenseurs de la forêt (Version 0.1)</strong>
          </span>
          <span className="mx-2">·</span>
          <span>
            Variante active : <strong className="text-[#16211B]">{varianteActive.nom}</strong>
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
                ? 'Viable (3.1 OK)'
                : varianteActive.statutViabilite === 'eliminee'
                ? 'Éliminée (Non viable)'
                : 'À tester'}
            </strong>
          </span>
        </div>

        <div className="font-mono-tabular">
          <span>{varianteActive.nbJoueurs} Joueurs</span>
          <span className="mx-2">·</span>
          <span>{varianteActive.defenseursParJoueur} Déf./J</span>
          <span className="mx-2">·</span>
          <span>6 Machines (Piste 0–5)</span>
          <span className="mx-2">·</span>
          <span>Piste Tactique (2–12)</span>
        </div>
      </div>

      {/* Contenu principal (1440px max-width centré) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6">
        {ongletActif === 'demo' && (
          <DemoView
            variante={varianteActive}
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
            variantes={variantes}
            rapportsViabilite={rapportsViabilite}
            rapportsInteret={rapportsInteret}
            campagnesSelection={campagnesSelection}
            campagnesVM={campagnesVM}
            onSelectVariante={(id) => {
              setVarianteActiveId(id);
            }}
            onUpdateStateFromTests={(payload) => {
              if (payload.variantes) setVariantes(payload.variantes);
              if (payload.rapportsViabilite)
                setRapportsViabilite(payload.rapportsViabilite);
              if (payload.rapportsInteret)
                setRapportsInteret(payload.rapportsInteret);
              if (payload.campagnesSelection)
                setCampagnesSelection(payload.campagnesSelection);
              if (payload.campagnesVM) setCampagnesVM(payload.campagnesVM);
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
            onSaveIdee={handleSaveIdeeLabo}
            onDeleteIdee={handleDeleteIdeeLabo}
            onSelectVariante={(id) => {
              setVarianteActiveId(id);
              setOngletActif('proto');
            }}
          />
        )}
      </main>
    </div>
  );
};
