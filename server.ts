import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  CampagneSelection33,
  GameVersionSpec,
  LabIdea,
  RapportInteret32,
  RapportViabilite31,
  ScheduledCampaignVM,
  VariantV01,
} from './src/shared/types';
import { VARIANTES_INITIALES_V01 } from './src/shared/moteur';
import { VERSIONS_JEU_INITIALES } from './src/shared/versions-registry';
import {
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
  ideesLabo: LabIdea[];
}

const STATE_FILE_PATH = path.resolve(
  process.cwd(),
  'resultats',
  'atelier-v1-state.json'
);

export function chargerEtatAtelier(): AtelierPersistedState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as AtelierPersistedState;
      if (parsed && Array.isArray(parsed.variantes)) {
        if (!Array.isArray(parsed.versions) || parsed.versions.length === 0) {
          parsed.versions = [...VERSIONS_JEU_INITIALES];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erreur lecture atelier-v1-state.json, réinitialisation :', err);
  }

  // Générer un premier bilan initial sur le socle V0.1 pour que l'interface ait immédiatement des données réelles
  const rapViabInitiales = VARIANTES_INITIALES_V01.map((v) =>
    evaluerViabiliteVariante31(v, 10)
  );
  const rapInteretInitial = evaluerInteretVariante32(
    VARIANTES_INITIALES_V01[0],
    14
  );

  const etatInitial: AtelierPersistedState = {
    derniereSauvegarde: new Date().toISOString(),
    versions: [...VERSIONS_JEU_INITIALES],
    variantes: [...VARIANTES_INITIALES_V01],
    rapportsViabilite: rapViabInitiales,
    rapportsInteret: [rapInteretInitial],
    campagnesSelection: [],
    campagnesPlanifieesVM: [...CAMPAGNES_VM_INITIALES],
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

  // POST générer un lot de variantes exploratoires V0.1 et exécuter immédiatement le filtre coupe-circuit 3.1
  app.post('/api/atelier/variants/generate', (req, res) => {
    const { nbVariantes = 4, filtrerImmediatement = true } = req.body || {};
    const nouvelles = genererVariantesExploratoiresV01(
      Math.min(12, Math.max(1, Number(nbVariantes))),
      state.variantes.length + 1
    );

    if (filtrerImmediatement) {
      for (const v of nouvelles) {
        const rapV = evaluerViabiliteVariante31(v, 14);
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

  // POST Test 3.2 : Évaluation de l'intérêt sur l'échelle des 6 Bots
  app.post('/api/atelier/tests/interet', (req, res) => {
    const { varianteId, nbPartiesParBot = 20 } = req.body || {};
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

  // POST Test 3.3 : Campagne complète de criblage et sélection de variantes
  app.post('/api/atelier/tests/selection', (req, res) => {
    const {
      nomCampagne = `Campagne Sélection V0.1 (${new Date().toLocaleTimeString('fr-FR')})`,
      nbPartiesViabilite = 14,
      nbPartiesInteret = 18,
      inclureDejaEliminees = false,
    } = req.body || {};

    const cibles = inclureDejaEliminees
      ? state.variantes
      : state.variantes.filter((v) => v.statutViabilite !== 'eliminee');

    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      nomCampagne,
      Number(nbPartiesViabilite),
      Number(nbPartiesInteret)
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
    sauvegarderEtatAtelier(state);
    res.json({ campagne, state });
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

  // POST Exécuter immédiatement une campagne planifiée VM Oracle Cloud
  app.post('/api/atelier/vm/run-now', (req, res) => {
    const { scheduleId } = req.body || {};
    const schedule = state.campagnesPlanifieesVM.find(
      (c) => c.id === scheduleId
    );
    if (!schedule) {
      res.status(404).json({ error: 'Tâche planifiée VM introuvable' });
      return;
    }

    schedule.statut = 'en_cours';
    const cibles = schedule.eliminerNonViablesAuto
      ? state.variantes.filter((v) => v.statutViabilite !== 'eliminee')
      : state.variantes;

    const { campagne, variantesMisesAJour } = executerCampagneSelection33(
      cibles,
      `[VM Oracle Cloud] ${schedule.nom}`,
      schedule.nbPartiesViabilite,
      schedule.nbPartiesInteret
    );

    const mapMaj = new Map(variantesMisesAJour.map((v) => [v.id, v]));
    state.variantes = state.variantes.map((v) => mapMaj.get(v.id) || v);
    state.campagnesSelection.unshift(campagne);

    schedule.statut = 'terminee';
    schedule.derniereExecution = new Date().toISOString();
    schedule.dernierResultatId = campagne.id;
    schedule.journalVM.unshift(
      `[${new Date().toLocaleTimeString('fr-FR')}] Exécution terminée : ${campagne.nbVariantesViables}/${campagne.nbVariantesEntree} variantes viables retenues, ${campagne.nbVariantesEliminees} éliminées. Meilleure : ${campagne.rapportsInteret[0]?.varianteNom || 'aucune'} (${campagne.rapportsInteret[0]?.scoreInteretGlobal || 0}/100).`
    );

    sauvegarderEtatAtelier(state);
    res.json({ campagne, schedule, state });
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
      `Atelier de conception V1 (Défenseurs de la forêt V0.1) démarré sur http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
