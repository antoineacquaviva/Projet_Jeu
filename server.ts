import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  AnalyseGeminiCampagne,
  CampagneSelection33,
  GameVersionId,
  GameVersionSpec,
  HybrideRecommandeGemini,
  LabIdea,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from './src/shared/types';
import { VARIANTES_INITIALES_V01 } from './src/shared/moteur';
import { VERSIONS_JEU_INITIALES } from './src/shared/versions-registry';
import {
  construireAnalyseCampagneStructurer,
  evaluerInteretVariante32,
  evaluerViabiliteVariante31,
  executerCampagneSelection33,
  genererVariantesExploratoiresV01,
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

const STATE_FILE_PATH = path.resolve(
  process.cwd(),
  'resultats',
  'atelier-v1-state.json'
);

export function sauvegarderRapportMarkdownGemini(
  analyse: AnalyseGeminiCampagne
): void {
  try {
    const dir = path.resolve(process.cwd(), 'resultats');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const mdPath = path.join(dir, `analyse-gemini-${analyse.campagneId}.md`);
    fs.writeFileSync(mdPath, analyse.rapportMarkdown, 'utf-8');
    const latestPath = path.join(dir, 'derniere-analyse-gemini.md');
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
      versionsCibles: campagne.versionsCibles || ['0.1', '0.2', '0.3'],
      nbVariantesEntree: campagne.nbVariantesEntree,
      nbVariantesViables: campagne.nbVariantesViables,
      nbVariantesEliminees: campagne.nbVariantesEliminees,
      classementVariantes: campagne.rapportsInteret.slice(0, 8).map((r) => ({
        varianteId: r.varianteId,
        nom: r.varianteNom,
        version: r.version || '0.1',
        geometriePlateau: r.geometriePlateau || 'modulaire_secteurs',
        scoreGlobal: r.scoreInteretGlobal,
        troisAxesPrioritaires: r.troisAxesPrioritaires,
        indicateurs: r.indicateurs,
        equilibreParJoueurs: r.equilibreParJoueurs,
      })),
    };

    const prompt = `Tu es un auteur et analyste senior de jeux de société coopératifs modernes.
Analyse les résultats expérimentaux de la campagne de tests suivante pour le jeu « La Forêt qui Rêve / Défenseurs de la Forêt » (versions V0.1, V0.2, V0.3) :
${JSON.stringify(resumeDonnees, null, 2)}

Les 3 priorités absolues du créateur pour la version 0.3 et ses variantes de plateau sont :
1. L'intérêt stratégique (évalué par une échelle de 9 bots allant du Bot Inerte jusqu'à Expectimax Bayésien, Beam Search Rollout et IS-MCTS).
2. La lisibilité et l'ergonomie sur table (remplacer l'assemblage fastidieux d'une tuile par joueur par un Plateau Double Face 3-4J / 5-6J, une Grille Hexagonale à 19 cases ou un Réseau de Clairières & Sentiers à 3 Cols).
3. L'équilibre selon le nombre de joueurs (stabilité de la difficulté et de l'entraide à 3, 4, 5 et 6 joueurs).

Rédige en français :
- Un résumé exécutif précis citant les scores observés.
- Un diagnostic approfondi sur l'intérêt stratégique (apport des bots de pointe IS-MCTS, Beam Rollout, Expectimax Bayésien).
- Un diagnostic sur la lisibilité et l'ergonomie des géométries de plateau V0.3.
- Un diagnostic sur l'équilibre de 3 à 6 joueurs.
- Un rapport Markdown complet et structuré présentant le comparatif V0.1 / V0.2 / V0.3 et les recommandations d'hybridation.`;

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

        // 1. Fusionner les nouvelles versions du registre de code (dont V0.3)
        if (!Array.isArray(parsed.versions) || parsed.versions.length === 0) {
          parsed.versions = [...VERSIONS_JEU_INITIALES];
          modified = true;
        } else {
          const existingVersionIds = new Set(
            parsed.versions.map((v) => v.version || v.id)
          );
          for (const ver of VERSIONS_JEU_INITIALES) {
            if (!existingVersionIds.has(ver.id)) {
              parsed.versions.push(ver);
              modified = true;
            }
          }
        }

        // 2. Fusionner les nouvelles variantes initiales de code (dont V0.3)
        const existingVariantIds = new Set(parsed.variantes.map((v) => v.id));
        for (const varInit of VARIANTES_INITIALES_V01) {
          if (!existingVariantIds.has(varInit.id)) {
            parsed.variantes.push(varInit);
            modified = true;
          }
        }

        // 3. Fusionner les nouvelles idées initiales du Labo
        if (!Array.isArray(parsed.ideesLabo)) {
          parsed.ideesLabo = [...IDEES_INITIALES_LABO];
          modified = true;
        } else {
          const existingIdeaIds = new Set(parsed.ideesLabo.map((i) => i.id));
          for (const ideaInit of IDEES_INITIALES_LABO) {
            if (!existingIdeaIds.has(ideaInit.id)) {
              parsed.ideesLabo.push(ideaInit);
              modified = true;
            }
          }
        }

        // 4. Fusionner les nouvelles campagnes planifiées VM
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

        // 5. Initialiser les analyses Gemini si absentes
        if (!Array.isArray(parsed.analysesGemini)) {
          parsed.analysesGemini = [];
          modified = true;
        }

        const aCampagneV03 =
          Array.isArray(parsed.campagnesSelection) &&
          parsed.campagnesSelection.some((c) =>
            (c.versionsCibles || []).includes('0.3')
          );

        if (!aCampagneV03) {
          const ciblesInit = parsed.variantes.filter(
            (v) => v.statutViabilite !== 'eliminee'
          );
          const { campagne, variantesMisesAJour } = executerCampagneSelection33(
            ciblesInit,
            'Campagne Comparative Initiale V0.1 · V0.2 · V0.3 (9 Bots + Banc 3–6J)',
            6,
            6,
            ['0.1', '0.2', '0.3']
          );
          const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
          parsed.variantes = parsed.variantes.map((v) => mapMaj.get(v.id) || v);
          for (const rv of campagne.rapportsViabilite) {
            parsed.rapportsViabilite = [
              rv,
              ...(parsed.rapportsViabilite || []).filter(
                (r) => r.varianteId !== rv.varianteId
              ),
            ];
          }
          for (const ri of campagne.rapportsInteret) {
            parsed.rapportsInteret = [
              ri,
              ...(parsed.rapportsInteret || []).filter(
                (r) => r.varianteId !== ri.varianteId
              ),
            ];
          }
          parsed.campagnesSelection = [
            campagne,
            ...(parsed.campagnesSelection || []),
          ];
          const analyseInit = construireAnalyseCampagneStructurer(campagne);
          parsed.analysesGemini = [analyseInit, ...(parsed.analysesGemini || [])];
          sauvegarderRapportMarkdownGemini(analyseInit);
          modified = true;
        }

        const aCampagneV04 =
          Array.isArray(parsed.campagnesSelection) &&
          parsed.campagnesSelection.some((c) =>
            (c.versionsCibles || []).includes('0.4')
          );

        if (!aCampagneV04) {
          const ciblesV04 = parsed.variantes.filter(
            (v) => v.version === '0.4' && v.statutViabilite !== 'eliminee'
          );
          const { campagne: campV04, variantesMisesAJour: varsV04 } =
            executerCampagneSelection33(
              ciblesV04,
              'Campagne de Référence V0.4 — Pur Placement, 6 Topologies, Options 1·2·4 Contrariées & Banc 3–6J',
              6,
              6,
              ['0.4']
            );
          const mapMajV04 = new Map(varsV04.map((v) => [v.id, v]));
          parsed.variantes = parsed.variantes.map(
            (v) => mapMajV04.get(v.id) || v
          );
          for (const rv of campV04.rapportsViabilite) {
            parsed.rapportsViabilite = [
              rv,
              ...(parsed.rapportsViabilite || []).filter(
                (r) => r.varianteId !== rv.varianteId
              ),
            ];
          }
          for (const ri of campV04.rapportsInteret) {
            parsed.rapportsInteret = [
              ri,
              ...(parsed.rapportsInteret || []).filter(
                (r) => r.varianteId !== ri.varianteId
              ),
            ];
          }
          parsed.campagnesSelection = [
            campV04,
            ...(parsed.campagnesSelection || []),
          ];
          const analyseV04 = construireAnalyseCampagneStructurer(campV04);
          parsed.analysesGemini = [
            analyseV04,
            ...(parsed.analysesGemini || []),
          ];
          sauvegarderRapportMarkdownGemini(analyseV04);
          modified = true;
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
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    state.derniereSauvegarde = new Date().toISOString();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde atelier-v1-state.json :', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  let state = chargerEtatAtelier();

  // GET état global de l'Atelier V1
  app.get('/api/atelier/state', (_req, res) => {
    res.json(state);
  });

  // POST créer ou mettre à jour une Version du Jeu (ex. V0.2, V0.3 depuis le Labo)
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

  // POST créer ou modifier une variante
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

  // POST générer un lot de variantes exploratoires (V0.1 / V0.3) et exécuter immédiatement le filtre coupe-circuit 3.1
  app.post('/api/atelier/variants/generate', (req, res) => {
    const {
      nbVariantes = 4,
      filtrerImmediatement = true,
      versionCible = '0.3',
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

  // DELETE purger les variantes éliminées (non viables)
  app.delete('/api/atelier/variants/eliminated', (_req, res) => {
    const avant = state.variantes.length;
    state.variantes = state.variantes.filter(
      (v) => v.statutViabilite !== 'eliminee'
    );
    const supprimees = avant - state.variantes.length;
    sauvegarderEtatAtelier(state);
    res.json({ supprimees, state });
  });

  // POST Test 3.1 : Viabilité & Élimination directe sur une variante
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

  // POST Test 3.2 : Évaluation de l'intérêt sur l'échelle des 9 Bots + Banc 3-6 Joueurs
  app.post('/api/atelier/tests/interet', (req, res) => {
    const { varianteId, nbPartiesParBot = 16 } = req.body || {};
    const variante = state.variantes.find((v) => v.id === varianteId);
    if (!variante) {
      res.status(404).json({ error: 'Variante introuvable' });
      return;
    }
    const rapport = evaluerInteretVariante32(
      variante,
      Number(nbPartiesParBot)
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

  // POST Test 3.3 : Campagne complète de criblage et sélection de variantes (V0.4 par défaut, avec génération exploratoire intégrée)
  app.post('/api/atelier/tests/selection', async (req, res) => {
    const {
      nomCampagne = `Campagne d'Exploration V0.4 (${new Date().toLocaleTimeString('fr-FR')})`,
      nbPartiesViabilite = 12,
      nbPartiesInteret = 14,
      inclureDejaEliminees = false,
      versionsCibles = ['0.4'],
      nbNouvellesExplorationsV04 = 0,
      lancerAnalyseGemini = true,
    } = req.body || {};

    const versionsList =
      Array.isArray(versionsCibles) && versionsCibles.length > 0
        ? (versionsCibles as GameVersionId[])
        : (['0.4'] as GameVersionId[]);

    // Si demandé, générer un lot de variantes exploratoires V0.4 avant de lancer la campagne
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
      versionsList
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

  // POST 3.4 : Analyse Gemini à la demande sur une campagne existante (ou la dernière campagne)
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

  // POST 3.4 : Instancier en 1 clic une variante hybride recommandée par Gemini et l'évaluer immédiatement
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
        `v03_hybride_${Date.now().toString(36)}`,
      version: hybride.varianteHybride.version || '0.3',
      origine: 'hybride_gemini',
      statutViabilite: 'viable',
    };

    if (evaluerImmediatement) {
      // Évaluation réactive et rapide (4 parties/bot) pour instanciation 1-clic fluide
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

  // POST Planification VM Oracle Cloud : ajouter ou modifier une tâche planifiée
  app.post('/api/atelier/vm/schedule', (req, res) => {
    const schedule = req.body as ScheduledCampaignVM;
    if (!schedule || !schedule.id) {
      res.status(400).json({ error: 'Planification VM invalide' });
      return;
    }
    const idx = state.campagnesPlanifieesVM.findIndex(
      (c) => c.id === schedule.id
    );
    if (idx >= 0) {
      state.campagnesPlanifieesVM[idx] = schedule;
    } else {
      state.campagnesPlanifieesVM.unshift(schedule);
    }
    sauvegarderEtatAtelier(state);
    res.json({ schedule, state });
  });

  // POST Exécuter immédiatement une campagne planifiée VM Oracle Cloud (avec bots de pointe, banc 3-6J et synthèse Gemini)
  app.post('/api/atelier/vm/run-now', async (req, res) => {
    const { scheduleId } = req.body || {};
    const schedule = state.campagnesPlanifieesVM.find(
      (c) => c.id === scheduleId
    );
    if (!schedule) {
      res.status(404).json({ error: 'Tâche planifiée VM introuvable' });
      return;
    }

    schedule.statut = 'en_cours';
    const versionsCibles =
      schedule.versionsCibles && schedule.versionsCibles.length > 0
        ? schedule.versionsCibles
        : (['0.1', '0.2', '0.3'] as GameVersionId[]);

    const cibles = schedule.eliminerNonViablesAuto
      ? state.variantes.filter((v) => v.statutViabilite !== 'eliminee')
      : state.variantes;

    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      `[VM Oracle Cloud] ${schedule.nom}`,
      schedule.nbPartiesViabilite,
      schedule.nbPartiesInteret,
      versionsCibles
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

    const analyse = await genererAnalyseGeminiOuFallback(campagne);
    state.analysesGemini = [
      analyse,
      ...(state.analysesGemini || []).filter(
        (a) => a.campagneId !== campagne.id
      ),
    ];

    schedule.statut = 'terminee';
    schedule.derniereExecution = new Date().toISOString();
    schedule.dernierResultatId = campagne.id;
    schedule.journalVM.unshift(
      `[${new Date().toLocaleTimeString('fr-FR')}] Exécution VM terminée (${versionsCibles.map((v) => `V${v}`).join('+')}) : ${campagne.nbVariantesViables}/${campagne.nbVariantesEntree} viables retenues. Meilleure : ${campagne.rapportsInteret[0]?.varianteNom || 'aucune'} (${campagne.rapportsInteret[0]?.scoreInteretGlobal || 0}/100). Analyse Gemini générée.`
    );

    sauvegarderEtatAtelier(state);
    res.json({ campagne, analyseGemini: analyse, schedule, state });
  });

  // POST Créer ou modifier une idée dans le Labo
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

  // DELETE Supprimer une idée du Labo
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
      `Atelier de conception V1 (Défenseurs de la forêt V0.1/V0.2/V0.3) démarré sur http://0.0.0.0:${PORT}`
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
