import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  AnalyseGeminiCampagne,
  CampagneSelection33,
  EtatJobCampagneVM,
  GameVersionId,
  GameVersionSpec,
  HybrideRecommandeGemini,
  JournalPartieJSONL,
  LabIdea,
  PoidsCriteresEvaluation,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from './src/shared/types';
import { VARIANTES_INITIALES_V01 } from './src/shared/moteur';
import { VERSIONS_JEU_INITIALES } from './src/shared/versions-registry';
import {
  POIDS_CRITERES_DEFAUT,
  construireAnalyseCampagneStructurer,
  evaluerInteretVariante32,
  evaluerViabiliteVariante31,
  executerCampagneSelection33,
  genererGrilleCombinatoireExhaustive,
  genererVariantesExploratoiresV01,
  marquerFrontPareto,
  resoudreVarianteParId,
} from './src/shared/tests-engine';
import {
  CAMPAGNES_VM_INITIALES,
  IDEES_INITIALES_LABO,
} from './src/shared/labo-initial';

export interface AtelierPersistedState {
  derniereSauvegarde: string;
  versions: GameVersionSpec[];
  variantes: VariantV01[];
  rapportsViabilite: RapportViabilite31[];
  rapportsInteret: RapportInteret32[];
  campagnesSelection: CampagneSelection33[];
  campagnesPlanifieesVM: ScheduledCampaignVM[];
  analysesGemini: AnalyseGeminiCampagne[];
  ideesLabo: LabIdea[];
}

const RESULTS_DIR = path.resolve(process.cwd(), 'resultats');
const LOGS_DIR = path.resolve(RESULTS_DIR, 'logs');
const STATE_FILE_PATH = path.resolve(RESULTS_DIR, 'atelier-v1-state.json');
export const JOB_STATUS_FILE_PATH = path.resolve(
  RESULTS_DIR,
  'campaign-job-status.json'
);

function ensureDirs(): void {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

export function creerEtatJobInitial(): EtatJobCampagneVM {
  return {
    jobId: 'idle',
    campagneId: 'camp_idle',
    nomCampagne: 'Aucune campagne en cours',
    versionCible: '0.4',
    sourceLancement: 'web_ui',
    statut: 'inactif',
    etapeNumero: 1,
    etapeLibelle: 'Prêt pour lancement à la demande',
    calibrePartiesParVariante: 500,
    poidsCriteres: { ...POIDS_CRITERES_DEFAUT },
    variantesTotales: 120,
    variantesTesteesViabilite: 0,
    variantesViablesRetenues: 0,
    variantesEvalueesProfondeur: 0,
    partiesSimulees: 0,
    partiesTotalesPrevues: 60000,
    partiesJournaliseesJSONL: 0,
    debitPartiesParSeconde: 0,
    dateDebut: new Date().toISOString(),
    dureeEcouleeSecondes: 0,
    etaSecondes: 0,
    cheminFichierJSONL: 'resultats/logs/campagne-v04.jsonl',
    tailleFichierJSONLOctets: 0,
    journalTempsReel: [],
  };
}

let currentJobStatus: EtatJobCampagneVM = creerEtatJobInitial();
let demandeArretJob = false;

export function sauvegarderStatutJobVM(status: EtatJobCampagneVM): void {
  try {
    ensureDirs();
    currentJobStatus = status;
    fs.writeFileSync(
      JOB_STATUS_FILE_PATH,
      JSON.stringify(status, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Erreur sauvegarde statut job VM :', err);
  }
}

export function chargerStatutJobVM(): EtatJobCampagneVM {
  try {
    if (fs.existsSync(JOB_STATUS_FILE_PATH)) {
      const raw = fs.readFileSync(JOB_STATUS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as EtatJobCampagneVM;
      if (parsed && parsed.jobId) {
        if (currentJobStatus.statut === 'en_cours') {
          return currentJobStatus;
        }
        return parsed;
      }
    }
  } catch (_e) {
    // Ignorer
  }
  return currentJobStatus;
}

export function sauvegarderRapportMarkdownGemini(
  analyse: AnalyseGeminiCampagne
): void {
  try {
    ensureDirs();
    const mdPath = path.join(
      RESULTS_DIR,
      `analyse-gemini-${analyse.campagneId}.md`
    );
    fs.writeFileSync(mdPath, analyse.rapportMarkdown, 'utf-8');
    const latestPath = path.join(RESULTS_DIR, 'derniere-analyse-gemini.md');
    fs.writeFileSync(latestPath, analyse.rapportMarkdown, 'utf-8');
  } catch (err) {
    console.error('Erreur écriture rapport Markdown Gemini :', err);
  }
}

export async function genererAnalyseGeminiOuFallback(
  campagne: CampagneSelection33
): Promise<AnalyseGeminiCampagne> {
  const baseDeterministe = construireAnalyseCampagneStructurer(
    campagne,
    process.env.GEMINI_API_KEY
      ? 'gemini-3-flash-preview (Google GenAI SDK)'
      : 'Synthèse Analytique Multi-Critères Gemini (Moteur Expert Local / VM)'
  );

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sauvegarderRapportMarkdownGemini(baseDeterministe);
    return baseDeterministe;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const resumeDonnees = {
      nomCampagne: campagne.nom,
      versionsCibles: campagne.versionsCibles || ['0.4'],
      calibrePartiesParVariante: campagne.calibrePartiesParVariante || 500,
      totalPartiesSimulees: campagne.totalPartiesSimulees || 0,
      poidsCriteres: campagne.poidsCriteres || POIDS_CRITERES_DEFAUT,
      nbVariantesEntree: campagne.nbVariantesEntree,
      nbVariantesViables: campagne.nbVariantesViables,
      nbVariantesEliminees: campagne.nbVariantesEliminees,
      classementVariantes: campagne.rapportsInteret.slice(0, 10).map((r) => ({
        varianteId: r.varianteId,
        nom: r.varianteNom,
        version: r.version || '0.4',
        geometriePlateau: r.geometriePlateau || 'double_plateau_34_56',
        scoreGlobal: r.scoreInteretGlobal,
        cinqCriteresPonderes: r.cinqCriteresPonderes,
        troisAxesPrioritaires: r.troisAxesPrioritaires,
        indicateurs: r.indicateurs,
        equilibreParJoueurs: r.equilibreParJoueurs,
      })),
    };

    const prompt = `Tu es un auteur et analyste senior de jeux de société coopératifs modernes.
Analyse les résultats expérimentaux de la campagne de tests combinatoire exhaustive suivante pour le jeu « La Forêt qui Rêve / Défenseurs de la Forêt » :
${JSON.stringify(resumeDonnees, null, 2)}

Chaque variante a été évaluée selon 5 critères pondérés utilisant des algorithmes dédiés :
1. Profondeur Stratégique (écart de performance des bots de pointe IS-MCTS, Expectimax Bayésien 2D6 et Beam Rollout face aux bots naïfs + garde-fou anti-boucle).
2. Tension & Criticité des Choix (Entropie de Shannon normalisée sur les coups candidats et Regret Contrefactuel moyen par tour).
3. Dynamique Coopérative & Frictions Spatiales (Synergie de Shapley coopérative, équilibre Barrage/Coalition et fenêtre optimale de mouvements contrariés 8%–22%).
4. Équilibre Multi-Joueurs 3–6J & Robustesse CVaR 10% (stabilité du score moyen entre 3, 4, 5 et 6 joueurs et résilience du pire décile D1).
5. Ergonomie Physique & Lisibilité sur Table (degré moyen du graphe topologique et charge de manipulation physique).

Rédige en français :
- Un résumé exécutif précis citant les scores observés, le front de Pareto et la volumétrie simulée.
- Un diagnostic approfondi sur la profondeur stratégique et la tension des choix (MCTS, Expectimax, Entropie & Regret).
- Un diagnostic sur la dynamique coopérative (mouvements contrariés, coalitions, barrages) et l'ergonomie des topologies de plateau.
- Un diagnostic sur l'équilibre de 3 à 6 joueurs et la robustesse CVaR 10%.
- Un rapport Markdown complet et structuré présentant le classement des meilleures variantes du front de Pareto et leurs avantages respectifs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumeExecutif: { type: Type.STRING },
            diagnosticStrategie: { type: Type.STRING },
            diagnosticLisibiliteErgonomie: { type: Type.STRING },
            diagnosticEquilibre36J: { type: Type.STRING },
            rapportMarkdown: { type: Type.STRING },
          },
          required: [
            'resumeExecutif',
            'diagnosticStrategie',
            'diagnosticLisibiliteErgonomie',
            'diagnosticEquilibre36J',
            'rapportMarkdown',
          ],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      const enrichie: AnalyseGeminiCampagne = {
        ...baseDeterministe,
        modeleUtilise: 'gemini-3-flash-preview',
        resumeExecutif: parsed.resumeExecutif || baseDeterministe.resumeExecutif,
        diagnosticStrategie:
          parsed.diagnosticStrategie || baseDeterministe.diagnosticStrategie,
        diagnosticLisibiliteErgonomie:
          parsed.diagnosticLisibiliteErgonomie ||
          baseDeterministe.diagnosticLisibiliteErgonomie,
        diagnosticEquilibre36J:
          parsed.diagnosticEquilibre36J ||
          baseDeterministe.diagnosticEquilibre36J,
        rapportMarkdown:
          parsed.rapportMarkdown || baseDeterministe.rapportMarkdown,
      };
      sauvegarderRapportMarkdownGemini(enrichie);
      return enrichie;
    }
  } catch (err) {
    console.warn(
      'Appel API Gemini indisponible ou erreur réseau, bascule sur la synthèse analytique déterministe :',
      err
    );
  }

  sauvegarderRapportMarkdownGemini(baseDeterministe);
  return baseDeterministe;
}

export function chargerEtatAtelier(): AtelierPersistedState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as AtelierPersistedState;
      if (parsed && Array.isArray(parsed.variantes)) {
        let modified = false;

        if (!Array.isArray(parsed.versions) || parsed.versions.length === 0) {
          parsed.versions = [...VERSIONS_JEU_INITIALES];
          modified = true;
        } else {
          for (const ver of VERSIONS_JEU_INITIALES) {
            const idx = parsed.versions.findIndex(
              (v) => (v.version || v.id) === ver.id
            );
            if (idx === -1) {
              parsed.versions.unshift(ver);
              modified = true;
            } else if (ver.id === '0.5') {
              parsed.versions[idx] = ver;
              modified = true;
            }
          }
        }

        for (const varInit of VARIANTES_INITIALES_V01) {
          const idx = parsed.variantes.findIndex((v) => v.id === varInit.id);
          if (idx === -1) {
            if (varInit.version === '0.5') {
              parsed.variantes.push(varInit);
            } else {
              parsed.variantes.push(varInit);
            }
            modified = true;
          } else if (varInit.version === '0.5') {
            parsed.variantes[idx] = {
              ...varInit,
              scoreInteretDernierTest:
                parsed.variantes[idx].scoreInteretDernierTest ??
                varInit.scoreInteretDernierTest,
              bandeSante:
                parsed.variantes[idx].bandeSante ?? varInit.bandeSante,
            };
            modified = true;
          }
        }

        if (!Array.isArray(parsed.ideesLabo)) {
          parsed.ideesLabo = [...IDEES_INITIALES_LABO];
          modified = true;
        } else {
          for (const ideaInit of IDEES_INITIALES_LABO) {
            const idx = parsed.ideesLabo.findIndex((i) => i.id === ideaInit.id);
            if (idx === -1) {
              parsed.ideesLabo.push(ideaInit);
              modified = true;
            } else if (
              ideaInit.id === 'idea-asymetrie-6-peuples-4-secteurs' ||
              ideaInit.versionCible === '0.5'
            ) {
              parsed.ideesLabo[idx] = ideaInit;
              modified = true;
            }
          }
        }

        if (!Array.isArray(parsed.campagnesPlanifieesVM)) {
          parsed.campagnesPlanifieesVM = [...CAMPAGNES_VM_INITIALES];
          modified = true;
        } else {
          const existingVmIds = new Set(
            parsed.campagnesPlanifieesVM.map((c) => c.id)
          );
          for (const vmInit of CAMPAGNES_VM_INITIALES) {
            if (!existingVmIds.has(vmInit.id)) {
              parsed.campagnesPlanifieesVM.unshift(vmInit);
              modified = true;
            }
          }
        }

        if (!Array.isArray(parsed.analysesGemini)) {
          parsed.analysesGemini = [];
          modified = true;
        }

        const aCampagneV05 =
          Array.isArray(parsed.campagnesSelection) &&
          parsed.campagnesSelection.some((c) =>
            (c.versionsCibles || []).includes('0.5')
          );

        if (!aCampagneV05) {
          const ciblesV05 = parsed.variantes.filter(
            (v) => v.version === '0.5' && v.statutViabilite !== 'eliminee'
          );
          const { campagne: campV05, variantesMisesAJour: varsV05 } =
            executerCampagneSelection33(
              ciblesV05,
              'Campagne Comparative V0.5 — Cœur Épuré sans Barrage d’Entrée : Option 2C Linéaire vs 2B Seuil Pur vs 2A Coalition (Poids fort Simplicité)',
              6,
              6,
              ['0.5']
            );
          const mapMajV05 = new Map(varsV05.map((v) => [v.id, v]));
          parsed.variantes = parsed.variantes.map(
            (v) => mapMajV05.get(v.id) || v
          );
          for (const rv of campV05.rapportsViabilite) {
            parsed.rapportsViabilite = [
              rv,
              ...(parsed.rapportsViabilite || []).filter(
                (r) => r.varianteId !== rv.varianteId
              ),
            ];
          }
          for (const ri of campV05.rapportsInteret) {
            parsed.rapportsInteret = [
              ri,
              ...(parsed.rapportsInteret || []).filter(
                (r) => r.varianteId !== ri.varianteId
              ),
            ];
          }
          parsed.campagnesSelection = [
            campV05,
            ...(parsed.campagnesSelection || []),
          ];
          const analyseV05 = construireAnalyseCampagneStructurer(campV05);
          parsed.analysesGemini = [
            analyseV05,
            ...(parsed.analysesGemini || []),
          ];
          sauvegarderRapportMarkdownGemini(analyseV05);
          modified = true;
        } else {
          // Garantir que la variante #1 de la campagne V0.5 active est bien promue dans parsed.variantes
          const campV05Existante = parsed.campagnesSelection.find((c) =>
            (c.versionsCibles || []).includes('0.5')
          );
          const bestId =
            campV05Existante?.meilleureVarianteId ||
            campV05Existante?.rapportsInteret?.[0]?.varianteId;
          if (bestId && !parsed.variantes.some((v) => v.id === bestId)) {
            const rapBest = campV05Existante?.rapportsInteret?.find(
              (r) => r.varianteId === bestId
            );
            const resolue = resoudreVarianteParId(
              bestId,
              parsed.variantes,
              rapBest
            );
            if (resolue) {
              parsed.variantes.unshift(resolue);
              modified = true;
            }
          }
        }

        if (modified) {
          sauvegarderEtatAtelier(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture atelier-v1-state.json, réinitialisation :', err);
  }

  const variantesInit = [...VARIANTES_INITIALES_V01];
  const { campagne: campV04Init, variantesMisesAJour } = executerCampagneSelection33(
    variantesInit.filter((v) => v.statutViabilite !== 'eliminee'),
    'Campagne de Référence V0.4 — Pur Placement, 6 Topologies, Options 1·2·4 Contrariées & Banc 3–6J',
    6,
    6,
    ['0.4']
  );
  const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
  const variantesFinales = variantesInit.map((v) => mapMaj.get(v.id) || v);
  const analyseInitiale = construireAnalyseCampagneStructurer(campV04Init);
  sauvegarderRapportMarkdownGemini(analyseInitiale);

  const etatInitial: AtelierPersistedState = {
    derniereSauvegarde: new Date().toISOString(),
    versions: [...VERSIONS_JEU_INITIALES],
    variantes: variantesFinales,
    rapportsViabilite: campV04Init.rapportsViabilite,
    rapportsInteret: campV04Init.rapportsInteret,
    campagnesSelection: [campV04Init],
    campagnesPlanifieesVM: [...CAMPAGNES_VM_INITIALES],
    analysesGemini: [analyseInitiale],
    ideesLabo: [...IDEES_INITIALES_LABO],
  };

  sauvegarderEtatAtelier(etatInitial);
  return etatInitial;
}

export function sauvegarderEtatAtelier(state: AtelierPersistedState): void {
  try {
    ensureDirs();
    state.derniereSauvegarde = new Date().toISOString();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde atelier-v1-state.json :', err);
  }
}

export interface OptionsCampagneExhaustiveVM {
  versionCible: GameVersionId;
  calibrePartiesParVariante: number;
  poidsCriteres: PoidsCriteresEvaluation;
  nomCampagne?: string;
  sourceLancement?: 'web_ui' | 'cli_vm_ssh';
  inclureVariantesRegisteExistantes?: boolean;
}

/**
 * Exécuteur asynchrone non-bloquant (Web ou CLI) d'une campagne combinatoire exhaustive.
 * Journalise chaque partie simulée dans un fichier .jsonl sur disque et met à jour le statut temps réel.
 */
export async function executerJobCampagneExhaustiveAsync(
  options: OptionsCampagneExhaustiveVM,
  onStateUpdated?: (newState: AtelierPersistedState) => void
): Promise<{
  campagne: CampagneSelection33;
  analyseGemini: AnalyseGeminiCampagne;
  state: AtelierPersistedState;
}> {
  ensureDirs();
  demandeArretJob = false;

  const versionCible = options.versionCible || '0.4';
  const calibre = Math.max(
    120,
    Math.min(5000, Number(options.calibrePartiesParVariante) || 500)
  );
  const poids = options.poidsCriteres || POIDS_CRITERES_DEFAUT;

  const nbPartiesViab = Math.max(8, Math.round(calibre * 0.035));
  const nbPartiesParBot = Math.max(
    8,
    Math.round((calibre - 3 * nbPartiesViab) / 11.4)
  );

  const jobId = `job_${Date.now().toString(36)}`;
  const campagneId = `camp_${Date.now().toString(36)}`;
  const relativeJsonlPath = `resultats/logs/campagne-${campagneId}.jsonl`;
  const absoluteJsonlPath = path.resolve(process.cwd(), relativeJsonlPath);

  fs.writeFileSync(absoluteJsonlPath, '', 'utf-8');

  const state = chargerEtatAtelier();

  // Étape 1 : Génération de la grille combinatoire exhaustive sans doublon
  const grilleCombinatoire = genererGrilleCombinatoireExhaustive(versionCible);
  const grilleIds = new Set(grilleCombinatoire.map((v) => v.id));
  const prefixeComb = `v${versionCible.replace('.', '')}_comb_`;
  const variantesExistantesVersion =
    options.inclureVariantesRegisteExistantes !== false
      ? state.variantes.filter(
          (v) =>
            (v.version || '0.1') === versionCible &&
            !grilleIds.has(v.id) &&
            !v.id.startsWith(prefixeComb)
        )
      : [];

  const poolVariantes: VariantV01[] = [
    ...variantesExistantesVersion,
    ...grilleCombinatoire,
  ];

  const nbTotalVariantes = poolVariantes.length;
  const partiesTotalesEstimees = Math.round(nbTotalVariantes * calibre * 0.88);
  const tStart = Date.now();

  const nomCampagne =
    options.nomCampagne ||
    `Campagne Combinatoire Exhaustive V${versionCible} (${nbTotalVariantes} variantes × ~${calibre} parties/var.)`;

  const status: EtatJobCampagneVM = {
    jobId,
    campagneId,
    nomCampagne,
    versionCible,
    sourceLancement: options.sourceLancement || 'web_ui',
    statut: 'en_cours',
    etapeNumero: 2,
    etapeLibelle: 'Criblage Coupe-Circuit & Évaluation Multi-Critères',
    calibrePartiesParVariante: calibre,
    poidsCriteres: poids,
    variantesTotales: nbTotalVariantes,
    variantesTesteesViabilite: 0,
    variantesViablesRetenues: 0,
    variantesEvalueesProfondeur: 0,
    partiesSimulees: 0,
    partiesTotalesPrevues: partiesTotalesEstimees,
    partiesJournaliseesJSONL: 0,
    debitPartiesParSeconde: 0,
    dateDebut: new Date().toISOString(),
    dureeEcouleeSecondes: 0,
    etaSecondes: 0,
    cheminFichierJSONL: relativeJsonlPath,
    tailleFichierJSONLOctets: 0,
    journalTempsReel: [
      `[${new Date().toLocaleTimeString('fr-FR')}] [Étape 1/5] Grille combinatoire exhaustive V${versionCible} générée : ${nbTotalVariantes} variantes (${grilleCombinatoire.length} combinaisons cartésiennes + ${variantesExistantesVersion.length} variantes de référence).`,
      `[${new Date().toLocaleTimeString('fr-FR')}] Fichier de journalisation JSONL ouvert : ${relativeJsonlPath}`,
    ],
  };
  sauvegarderStatutJobVM(status);

  let bufferJsonl: string[] = [];
  let tailleOctetsJsonl = 0;
  const echantillonPartiesRemarquables: JournalPartieJSONL[] = [];

  const flushJsonlBuffer = () => {
    if (bufferJsonl.length === 0) return;
    const chunk = bufferJsonl.join('\n') + '\n';
    try {
      fs.appendFileSync(absoluteJsonlPath, chunk, 'utf-8');
      tailleOctetsJsonl += Buffer.byteLength(chunk, 'utf-8');
      status.tailleFichierJSONLOctets = tailleOctetsJsonl;
    } catch (err) {
      console.error('Erreur écriture JSONL :', err);
    }
    bufferJsonl = [];
  };

  const handlePartieLog = (log: JournalPartieJSONL) => {
    const enrichi: JournalPartieJSONL = {
      ...log,
      campagneId,
    };
    bufferJsonl.push(JSON.stringify(enrichi));
    status.partiesSimulees += 1;
    status.partiesJournaliseesJSONL += 1;

    if (bufferJsonl.length >= 120) {
      flushJsonlBuffer();
    }

    if (
      echantillonPartiesRemarquables.length < 80 &&
      status.partiesSimulees %
        Math.max(1, Math.floor(partiesTotalesEstimees / 70)) ===
        0
    ) {
      echantillonPartiesRemarquables.push(enrichi);
    }
  };

  const updateTelemetry = () => {
    const elapsedSec = Math.max(0.2, (Date.now() - tStart) / 1000);
    status.dureeEcouleeSecondes = Math.round(elapsedSec * 10) / 10;
    status.debitPartiesParSeconde =
      Math.round((status.partiesSimulees / elapsedSec) * 10) / 10;
    const restantes = Math.max(
      0,
      status.partiesTotalesPrevues - status.partiesSimulees
    );
    status.etaSecondes =
      status.debitPartiesParSeconde > 0
        ? Math.round(restantes / status.debitPartiesParSeconde)
        : 0;
    sauvegarderStatutJobVM(status);
  };

  const rapportsViabilite: RapportViabilite31[] = [];
  const rapportsInteret: RapportInteret32[] = [];
  const variantesMisesAJour: VariantV01[] = [];

  for (let i = 0; i < poolVariantes.length; i++) {
    if (demandeArretJob) {
      status.statut = 'interrompu';
      status.journalTempsReel.unshift(
        `[${new Date().toLocaleTimeString('fr-FR')}] Arrêt gracieux demandé à la variante ${i + 1}/${poolVariantes.length}. Sauvegarde des résultats partiels...`
      );
      break;
    }

    const v = { ...poolVariantes[i] };
    status.varianteCouranteId = v.id;
    status.varianteCouranteNom = v.nom;
    status.etapeNumero = 2;
    status.etapeLibelle = 'Coupe-circuit de viabilité (5 invariants)';

    const rapV = evaluerViabiliteVariante31(
      v,
      nbPartiesViab,
      campagneId,
      handlePartieLog
    );
    rapportsViabilite.push(rapV);
    status.variantesTesteesViabilite = i + 1;

    if (!rapV.viable) {
      v.statutViabilite = 'eliminee';
      v.motifElimination = rapV.motifElimination;
      v.bandeSante = 'rouge';
      variantesMisesAJour.push(v);
    } else {
      status.etapeNumero = 3;
      status.etapeLibelle =
        'Simulation intensive 9 Bots (MCTS/Expectimax) & Banc 3–6J';
      const rapI = evaluerInteretVariante32(
        v,
        nbPartiesParBot,
        poids,
        campagneId,
        handlePartieLog
      );
      rapportsInteret.push(rapI);
      status.variantesEvalueesProfondeur += 1;

      if (rapI.indicateurs.margeGardeFouBoucle < 5) {
        v.statutViabilite = 'eliminee';
        v.motifElimination = `Éliminée en évaluation profonde : Marge garde-fou anti-boucle insuffisante (${rapI.indicateurs.margeGardeFouBoucle} pts < 5 pts).`;
        v.bandeSante = 'rouge';
      } else {
        v.statutViabilite = 'viable';
        v.motifElimination = undefined;
        v.scoreInteretDernierTest = rapI.scoreInteretGlobal;
        v.bandeSante = rapI.bandeSante;
        status.variantesViablesRetenues += 1;

        if (
          !status.meilleureVarianteProvisoire ||
          rapI.scoreInteretGlobal > status.meilleureVarianteProvisoire.score
        ) {
          status.meilleureVarianteProvisoire = {
            id: v.id,
            nom: v.nom,
            score: rapI.scoreInteretGlobal,
          };
        }
      }
      variantesMisesAJour.push(v);
    }

    flushJsonlBuffer();

    if ((i + 1) % 10 === 0 || i + 1 === poolVariantes.length || i === 0) {
      status.journalTempsReel.unshift(
        `[${new Date().toLocaleTimeString('fr-FR')}] Progression ${i + 1}/${poolVariantes.length} variantes (${status.variantesViablesRetenues} viables) — ${status.partiesSimulees.toLocaleString('fr-FR')} parties journalisées (${status.debitPartiesParSeconde} parties/s).`
      );
      if (status.journalTempsReel.length > 40) {
        status.journalTempsReel.length = 40;
      }
    }

    updateTelemetry();

    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  flushJsonlBuffer();

  // Étape 4 : Classement multi-critères & Front de Pareto
  status.etapeNumero = 4;
  status.etapeLibelle = 'Agrégation des 5 Critères & Extraction du Front de Pareto';
  const idsViablesFinaux = new Set(
    variantesMisesAJour
      .filter((v) => v.statutViabilite === 'viable')
      .map((v) => v.id)
  );
  const rapportsInteretViables = rapportsInteret.filter((r) =>
    idsViablesFinaux.has(r.varianteId)
  );
  marquerFrontPareto(rapportsInteretViables);
  rapportsInteretViables.sort(
    (a, b) => b.scoreInteretGlobal - a.scoreInteretGlobal
  );

  const meilleure = rapportsInteretViables[0];
  const dureeTotaleSecondes =
    Math.round(((Date.now() - tStart) / 1000) * 10) / 10;

  const campagne: CampagneSelection33 = {
    id: campagneId,
    nom: nomCampagne,
    dateExecution: new Date().toISOString(),
    versionsCibles: [versionCible],
    nbVariantesEntree: poolVariantes.length,
    nbVariantesViables: idsViablesFinaux.size,
    nbVariantesEliminees: poolVariantes.length - idsViablesFinaux.size,
    meilleureVarianteId: meilleure?.varianteId || null,
    rapportsViabilite,
    rapportsInteret: rapportsInteretViables,
    calibrePartiesParVariante: calibre,
    totalPartiesSimulees: status.partiesSimulees,
    dureeTotaleSecondes,
    cheminFichierJSONL: relativeJsonlPath,
    tailleFichierJSONLOctets: tailleOctetsJsonl,
    poidsCriteres: poids,
    echantillonPartiesRemarquables,
  };

  // Étape 5 : Synthèse IA Gemini
  status.etapeNumero = 5;
  status.etapeLibelle = 'Synthèse Analytique IA Gemini & Hybrides';
  status.statut = 'analyse_ia';
  status.journalTempsReel.unshift(
    `[${new Date().toLocaleTimeString('fr-FR')}] [Étape 5/5] Génération de la synthèse analytique Gemini et extraction du Front de Pareto...`
  );
  sauvegarderStatutJobVM(status);

  const analyseGemini = await genererAnalyseGeminiOuFallback(campagne);

  const topGrilleIds = new Set(
    rapportsInteretViables.slice(0, 12).map((r) => r.varianteId)
  );
  const variantesRetenuesPourRegistre = variantesMisesAJour.filter(
    (v) => !v.id.startsWith(prefixeComb) || topGrilleIds.has(v.id)
  );

  const mapMaj = new Map(variantesRetenuesPourRegistre.map((v) => [v.id, v]));
  const autresVariantes = state.variantes.filter(
    (v) => !mapMaj.has(v.id) && !v.id.startsWith(prefixeComb)
  );
  state.variantes = [...variantesRetenuesPourRegistre, ...autresVariantes];

  for (const rv of rapportsViabilite.slice(0, 60)) {
    state.rapportsViabilite = [
      rv,
      ...state.rapportsViabilite.filter((r) => r.varianteId !== rv.varianteId),
    ];
  }
  for (const ri of rapportsInteretViables) {
    state.rapportsInteret = [
      ri,
      ...state.rapportsInteret.filter((r) => r.varianteId !== ri.varianteId),
    ];
  }

  state.campagnesSelection = [
    campagne,
    ...state.campagnesSelection.filter((c) => c.id !== campagne.id),
  ];
  state.analysesGemini = [
    analyseGemini,
    ...(state.analysesGemini || []).filter((a) => a.campagneId !== campagne.id),
  ];

  sauvegarderEtatAtelier(state);
  if (onStateUpdated) {
    onStateUpdated(state);
  }

  status.statut = demandeArretJob ? 'interrompu' : 'termine';
  status.etapeLibelle = 'Campagne terminée';
  status.dateFin = new Date().toISOString();
  status.etaSecondes = 0;
  status.journalTempsReel.unshift(
    `[${new Date().toLocaleTimeString('fr-FR')}] Campagne terminée en ${dureeTotaleSecondes}s : ${campagne.nbVariantesViables}/${campagne.nbVariantesEntree} variantes viables, ${status.partiesSimulees.toLocaleString('fr-FR')} parties écrites dans ${relativeJsonlPath}. N°1 : ${meilleure?.varianteNom || 'N/A'} (${meilleure?.scoreInteretGlobal || 0}/100).`
  );
  sauvegarderStatutJobVM(status);

  return { campagne, analyseGemini, state };
}

export function lireJournauxPartiesJSONL(
  campagneId?: string,
  varianteId?: string,
  botId?: string,
  nbJoueurs?: number,
  limit = 60
): JournalPartieJSONL[] {
  try {
    ensureDirs();
    let targetFile = '';
    if (campagneId) {
      const candidate = path.resolve(LOGS_DIR, `campagne-${campagneId}.jsonl`);
      if (fs.existsSync(candidate)) targetFile = candidate;
    }
    if (!targetFile) {
      const files = fs
        .readdirSync(LOGS_DIR)
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => ({
          name: f,
          fullPath: path.resolve(LOGS_DIR, f),
          mtime: fs.statSync(path.resolve(LOGS_DIR, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);
      if (files.length > 0) {
        targetFile = files[0].fullPath;
      }
    }
    if (!targetFile || !fs.existsSync(targetFile)) {
      return [];
    }

    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const resultats: JournalPartieJSONL[] = [];

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]) as JournalPartieJSONL;
        if (varianteId && parsed.varianteId !== varianteId) continue;
        if (botId && parsed.botId !== botId) continue;
        if (nbJoueurs && parsed.nbJoueurs !== nbJoueurs) continue;
        resultats.push(parsed);
        if (resultats.length >= limit) break;
      } catch (_e) {
        // Ignorer ligne malformée
      }
    }
    return resultats;
  } catch (_err) {
    return [];
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  let state = chargerEtatAtelier();

  app.get('/api/atelier/state', (_req, res) => {
    state = chargerEtatAtelier();
    res.json(state);
  });

  app.get('/api/atelier/campaign/status', (_req, res) => {
    const jobStatus = chargerStatutJobVM();
    res.json({ jobStatus });
  });

  app.post('/api/atelier/campaign/start', (req, res) => {
    const current = chargerStatutJobVM();
    if (current.statut === 'en_cours') {
      res.status(409).json({
        error: 'Une campagne est déjà en cours d’exécution sur la VM.',
        jobStatus: current,
      });
      return;
    }

    const {
      versionCible = '0.4',
      calibrePartiesParVariante = 500,
      poidsCriteres = POIDS_CRITERES_DEFAUT,
      nomCampagne,
    } = req.body || {};

    executerJobCampagneExhaustiveAsync(
      {
        versionCible: versionCible as GameVersionId,
        calibrePartiesParVariante: Number(calibrePartiesParVariante) || 500,
        poidsCriteres,
        nomCampagne,
        sourceLancement: 'web_ui',
      },
      (updatedState) => {
        state = updatedState;
      }
    ).catch((err) => {
      console.error('Erreur job campagne exhaustive :', err);
      currentJobStatus.statut = 'erreur';
      currentJobStatus.etapeLibelle = `Erreur : ${String(err)}`;
      sauvegarderStatutJobVM(currentJobStatus);
    });

    res.json({
      started: true,
      jobStatus: chargerStatutJobVM(),
    });
  });

  app.post('/api/atelier/campaign/stop', (_req, res) => {
    demandeArretJob = true;
    res.json({
      stopping: true,
      jobStatus: chargerStatutJobVM(),
    });
  });

  app.get('/api/atelier/campaign/logs', (req, res) => {
    const { campagneId, varianteId, botId, nbJoueurs, limit } = req.query;
    const logs = lireJournauxPartiesJSONL(
      campagneId ? String(campagneId) : undefined,
      varianteId ? String(varianteId) : undefined,
      botId ? String(botId) : undefined,
      nbJoueurs ? Number(nbJoueurs) : undefined,
      limit ? Math.min(200, Number(limit)) : 60
    );

    if (logs.length === 0) {
      const camp = campagneId
        ? state.campagnesSelection.find((c) => c.id === String(campagneId))
        : state.campagnesSelection[0];
      const fallback = (camp?.echantillonPartiesRemarquables || []).filter(
        (p) =>
          (!varianteId || p.varianteId === String(varianteId)) &&
          (!botId || p.botId === String(botId)) &&
          (!nbJoueurs || p.nbJoueurs === Number(nbJoueurs))
      );
      res.json({ logs: fallback.slice(0, 60) });
      return;
    }

    res.json({ logs });
  });

  app.get('/api/atelier/campaign/download-jsonl/:campagneId', (req, res) => {
    const { campagneId } = req.params;
    const filePath = path.resolve(LOGS_DIR, `campagne-${campagneId}.jsonl`);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="campagne-${campagneId}.jsonl"`
      );
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    const camp = state.campagnesSelection.find((c) => c.id === campagneId);
    if (camp && camp.echantillonPartiesRemarquables) {
      const content =
        camp.echantillonPartiesRemarquables
          .map((l) => JSON.stringify(l))
          .join('\n') + '\n';
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="campagne-${campagneId}-echantillon.jsonl"`
      );
      res.send(content);
      return;
    }
    res.status(404).json({ error: 'Fichier JSONL introuvable pour cette campagne.' });
  });

  app.get('/api/atelier/dossier-asymetrie', (_req, res) => {
    const dossierPath = path.resolve(
      process.cwd(),
      'resultats',
      'dossier-conception-asymetrie-gemini.md'
    );
    try {
      if (fs.existsSync(dossierPath)) {
        const contenuMarkdown = fs.readFileSync(dossierPath, 'utf-8');
        res.json({
          chemin: 'resultats/dossier-conception-asymetrie-gemini.md',
          contenuMarkdown,
        });
        return;
      }
      res.status(404).json({ error: 'Dossier maître d’asymétrie introuvable.' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/atelier/versions', (req, res) => {
    const { version, varianteSocle, ideesPromuesIds } = req.body as {
      version: GameVersionSpec;
      varianteSocle?: VariantV01;
      ideesPromuesIds?: string[];
    };
    if (!version || !version.id) {
      res.status(400).json({ error: 'Version invalide' });
      return;
    }
    const idx = state.versions.findIndex((v) => v.id === version.id);
    if (idx >= 0) {
      state.versions[idx] = version;
    } else {
      state.versions.push(version);
    }
    if (varianteSocle && varianteSocle.id) {
      state.variantes.unshift(varianteSocle);
    }
    if (Array.isArray(ideesPromuesIds) && ideesPromuesIds.length > 0) {
      state.ideesLabo = state.ideesLabo.map((idee) =>
        ideesPromuesIds.includes(idee.id)
          ? {
              ...idee,
              versionCible: version.id,
              varianteLieeId: varianteSocle?.id || idee.varianteLieeId,
            }
          : idee
      );
    }
    sauvegarderEtatAtelier(state);
    res.json({ version, state });
  });

  app.post('/api/atelier/variants', (req, res) => {
    const variante = req.body as VariantV01;
    if (!variante || !variante.id) {
      res.status(400).json({ error: 'Variante invalide' });
      return;
    }
    const idx = state.variantes.findIndex((v) => v.id === variante.id);
    if (idx >= 0) {
      state.variantes[idx] = variante;
    } else {
      state.variantes.unshift(variante);
    }
    sauvegarderEtatAtelier(state);
    res.json({ variante, state });
  });

  app.post('/api/atelier/variants/generate', (req, res) => {
    const {
      nbVariantes = 4,
      filtrerImmediatement = true,
      versionCible = '0.4',
    } = req.body || {};
    const nouvelles = genererVariantesExploratoiresV01(
      Math.min(12, Math.max(1, Number(nbVariantes))),
      state.variantes.length + 1,
      versionCible as GameVersionId
    );

    if (filtrerImmediatement) {
      for (const v of nouvelles) {
        const rapV = evaluerViabiliteVariante31(v, 12);
        state.rapportsViabilite = [
          rapV,
          ...state.rapportsViabilite.filter((r) => r.varianteId !== v.id),
        ];
        if (!rapV.viable) {
          v.statutViabilite = 'eliminee';
          v.motifElimination = rapV.motifElimination;
          v.bandeSante = 'rouge';
        } else {
          v.statutViabilite = 'viable';
          v.bandeSante = 'vert';
        }
      }
    }

    state.variantes = [...nouvelles, ...state.variantes];
    sauvegarderEtatAtelier(state);
    res.json({ nouvelles, state });
  });

  app.delete('/api/atelier/variants/eliminated', (_req, res) => {
    const avant = state.variantes.length;
    state.variantes = state.variantes.filter(
      (v) => v.statutViabilite !== 'eliminee'
    );
    const supprimees = avant - state.variantes.length;
    sauvegarderEtatAtelier(state);
    res.json({ supprimees, state });
  });

  app.post('/api/atelier/tests/viabilite', (req, res) => {
    const { varianteId, nbParties = 16 } = req.body || {};
    const variante = state.variantes.find((v) => v.id === varianteId);
    if (!variante) {
      res.status(404).json({ error: 'Variante introuvable' });
      return;
    }
    const rapport = evaluerViabiliteVariante31(variante, Number(nbParties));
    variante.statutViabilite = rapport.viable ? 'viable' : 'eliminee';
    variante.motifElimination = rapport.motifElimination;
    if (!rapport.viable) variante.bandeSante = 'rouge';

    state.rapportsViabilite = [
      rapport,
      ...state.rapportsViabilite.filter((r) => r.varianteId !== variante.id),
    ];
    sauvegarderEtatAtelier(state);
    res.json({ rapport, state });
  });

  app.post('/api/atelier/tests/interet', (req, res) => {
    const { varianteId, nbPartiesParBot = 16, poidsCriteres } = req.body || {};
    const variante = state.variantes.find((v) => v.id === varianteId);
    if (!variante) {
      res.status(404).json({ error: 'Variante introuvable' });
      return;
    }
    const rapport = evaluerInteretVariante32(
      variante,
      Number(nbPartiesParBot),
      poidsCriteres || POIDS_CRITERES_DEFAUT
    );
    variante.scoreInteretDernierTest = rapport.scoreInteretGlobal;
    variante.bandeSante = rapport.bandeSante;
    if (rapport.indicateurs.margeGardeFouBoucle < 5) {
      variante.statutViabilite = 'eliminee';
      variante.motifElimination =
        'Éliminée en 3.2 : Garde-fou anti-boucle insuffisant (< 5 pts).';
    } else {
      variante.statutViabilite = 'viable';
    }

    state.rapportsInteret = [
      rapport,
      ...state.rapportsInteret.filter((r) => r.varianteId !== variante.id),
    ];
    sauvegarderEtatAtelier(state);
    res.json({ rapport, state });
  });

  app.post('/api/atelier/tests/selection', async (req, res) => {
    const {
      nomCampagne = `Campagne d'Exploration V0.4 (${new Date().toLocaleTimeString('fr-FR')})`,
      nbPartiesViabilite = 12,
      nbPartiesInteret = 14,
      inclureDejaEliminees = false,
      versionsCibles = ['0.4'],
      nbNouvellesExplorationsV04 = 0,
      lancerAnalyseGemini = true,
      poidsCriteres = POIDS_CRITERES_DEFAUT,
    } = req.body || {};

    const versionsList =
      Array.isArray(versionsCibles) && versionsCibles.length > 0
        ? (versionsCibles as GameVersionId[])
        : (['0.4'] as GameVersionId[]);

    const nbExplo = Math.min(8, Math.max(0, Number(nbNouvellesExplorationsV04) || 0));
    if (nbExplo > 0 && versionsList.includes('0.4')) {
      const nouvellesV04 = genererVariantesExploratoiresV01(
        nbExplo,
        state.variantes.length + 1,
        '0.4'
      );
      state.variantes = [...nouvellesV04, ...state.variantes];
    }

    const cibles = inclureDejaEliminees
      ? state.variantes
      : state.variantes.filter((v) => v.statutViabilite !== 'eliminee');

    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      nomCampagne,
      Number(nbPartiesViabilite),
      Number(nbPartiesInteret),
      versionsList,
      poidsCriteres
    );

    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    state.variantes = state.variantes.map((v) => mapMaj.get(v.id) || v);

    for (const rv of campagne.rapportsViabilite) {
      state.rapportsViabilite = [
        rv,
        ...state.rapportsViabilite.filter((r) => r.varianteId !== rv.varianteId),
      ];
    }
    for (const ri of campagne.rapportsInteret) {
      state.rapportsInteret = [
        ri,
        ...state.rapportsInteret.filter((r) => r.varianteId !== ri.varianteId),
      ];
    }

    state.campagnesSelection.unshift(campagne);

    let analyseGemini: AnalyseGeminiCampagne | null = null;
    if (lancerAnalyseGemini) {
      analyseGemini = await genererAnalyseGeminiOuFallback(campagne);
      state.analysesGemini = [
        analyseGemini,
        ...(state.analysesGemini || []).filter(
          (a) => a.campagneId !== campagne.id
        ),
      ];
    }

    sauvegarderEtatAtelier(state);
    res.json({ campagne, analyseGemini, state });
  });

  app.post('/api/atelier/campaigns/analyze-gemini', async (req, res) => {
    const { campagneId } = req.body || {};
    const campagne = campagneId
      ? state.campagnesSelection.find((c) => c.id === campagneId)
      : state.campagnesSelection[0];

    if (!campagne) {
      res.status(404).json({ error: 'Aucune campagne disponible à analyser' });
      return;
    }

    const analyse = await genererAnalyseGeminiOuFallback(campagne);
    state.analysesGemini = [
      analyse,
      ...(state.analysesGemini || []).filter(
        (a) => a.campagneId !== campagne.id
      ),
    ];
    sauvegarderEtatAtelier(state);
    res.json({ analyse, state });
  });

  app.post('/api/atelier/variants/from-gemini-recommendation', (req, res) => {
    const { hybride, evaluerImmediatement = true } = req.body as {
      hybride: HybrideRecommandeGemini;
      evaluerImmediatement?: boolean;
    };
    if (!hybride || !hybride.varianteHybride) {
      res.status(400).json({ error: 'Recommandation hybride invalide' });
      return;
    }

    const nouvelleVariante: VariantV01 = {
      ...hybride.varianteHybride,
      id:
        hybride.varianteHybride.id ||
        `v04_hybride_${Date.now().toString(36)}`,
      version: hybride.varianteHybride.version || '0.4',
      origine: 'hybride_gemini',
      statutViabilite: 'viable',
    };

    if (evaluerImmediatement) {
      const rapViab = evaluerViabiliteVariante31(nouvelleVariante, 4);
      state.rapportsViabilite = [
        rapViab,
        ...state.rapportsViabilite.filter(
          (r) => r.varianteId !== nouvelleVariante.id
        ),
      ];
      const rapInt = evaluerInteretVariante32(nouvelleVariante, 4);
      nouvelleVariante.scoreInteretDernierTest = rapInt.scoreInteretGlobal;
      nouvelleVariante.bandeSante = rapInt.bandeSante;
      state.rapportsInteret = [
        rapInt,
        ...state.rapportsInteret.filter(
          (r) => r.varianteId !== nouvelleVariante.id
        ),
      ];
    }

    const existIdx = state.variantes.findIndex(
      (v) => v.id === nouvelleVariante.id
    );
    if (existIdx >= 0) {
      state.variantes[existIdx] = nouvelleVariante;
    } else {
      state.variantes.unshift(nouvelleVariante);
    }

    sauvegarderEtatAtelier(state);
    res.json({ variante: nouvelleVariante, state });
  });

  app.post('/api/atelier/vm/run-exhaustive-v04', async (req, res) => {
    const { calibrePartiesParVariante = 180, poidsCriteres = POIDS_CRITERES_DEFAUT } =
      req.body || {};
    const result = await executerJobCampagneExhaustiveAsync(
      {
        versionCible: '0.4',
        calibrePartiesParVariante: Number(calibrePartiesParVariante) || 180,
        poidsCriteres,
        sourceLancement: 'web_ui',
      },
      (updated) => {
        state = updated;
      }
    );
    res.json(result);
  });

  app.post('/api/atelier/labo', (req, res) => {
    const idee = req.body as LabIdea;
    if (!idee || !idee.id || !idee.titre) {
      res.status(400).json({ error: 'Idée invalide' });
      return;
    }
    const idx = state.ideesLabo.findIndex((i) => i.id === idee.id);
    if (idx >= 0) {
      state.ideesLabo[idx] = {
        ...idee,
        dateMaj: new Date().toISOString().slice(0, 10),
      };
    } else {
      state.ideesLabo.unshift({
        ...idee,
        dateCreation: new Date().toISOString().slice(0, 10),
        dateMaj: new Date().toISOString().slice(0, 10),
      });
    }
    sauvegarderEtatAtelier(state);
    res.json({ idee, state });
  });

  app.delete('/api/atelier/labo/:id', (req, res) => {
    const { id } = req.params;
    state.ideesLabo = state.ideesLabo.filter((i) => i.id !== id);
    sauvegarderEtatAtelier(state);
    res.json({ state });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Atelier de conception V1 (Défenseurs de la forêt V0.4) démarré sur http://0.0.0.0:${PORT}`
    );
  });
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js'))
) {
  startServer();
}
