import React, { useState, useEffect } from 'react';
import {
  EffetProteger,
  EffetSaboter,
  GeometriePlateau,
  ModeProgrammation,
  ModeResolution,
  PorteeTactiques,
  RythmeApprentissage,
  VariantV01,
} from '../shared/types';
import { CATALOGUE_BOTS_V01 } from '../shared/bots';
import { evaluerViabiliteVariante31 } from '../shared/tests-engine';

interface MoteurBotsViewProps {
  varianteActive: VariantV01;
  onSaveVariante: (variante: VariantV01, estNouvelle: boolean) => void;
}

export const MoteurBotsView: React.FC<MoteurBotsViewProps> = ({
  varianteActive,
  onSaveVariante,
}) => {
  const [form, setForm] = useState<VariantV01>(varianteActive);
  const [messageConfirmation, setMessageConfirmation] = useState<string>('');

  useEffect(() => {
    setForm(varianteActive);
  }, [varianteActive]);

  const handleSave = (creerNouvelle: boolean) => {
    const cible: VariantV01 = creerNouvelle
      ? {
          ...form,
          id: `v${(form.version || '0.3').replace('.', '')}_custom_${Date.now().toString(36)}`,
          nom: `${form.nom} (Copie)`,
          origine: 'utilisateur',
        }
      : { ...form };

    // Vérifier immédiatement la viabilité 3.1 lors de l'enregistrement
    const rapViab = evaluerViabiliteVariante31(cible, 12);
    cible.statutViabilite = rapViab.viable ? 'viable' : 'eliminee';
    cible.motifElimination = rapViab.motifElimination;
    cible.bandeSante = rapViab.viable ? 'vert' : 'rouge';

    onSaveVariante(cible, creerNouvelle);
    setMessageConfirmation(
      rapViab.viable
        ? `Variante enregistrée et validée VIABLE par le filtre 3.1 !`
        : `Variante enregistrée mais marquée NON VIABLE (${rapViab.motifElimination})`
    );
    setTimeout(() => setMessageConfirmation(''), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            Moteur & Bots — Configurateur de Variantes (V{form.version || '0.1'}) & 9 Joueurs Virtuels
          </h2>
          <p className="text-xs text-[#55645B]">
            Configurez la géométrie du plateau (V0.3), le séquencement, les règles d’actions et éprouvez-les face aux 6 bots classiques et 3 algorithmes de pointe (Expectimax Bayésien, Beam Search, IS-MCTS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] whitespace-nowrap shrink-0"
          >
            Mettre à jour & Tester la viabilité
          </button>
          <button
            onClick={() => handleSave(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#16211B] text-white hover:bg-black whitespace-nowrap shrink-0"
          >
            Dupliquer comme nouvelle variante V{form.version || '0.1'}
          </button>
        </div>
      </div>

      {messageConfirmation && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-[#256B45] text-xs font-semibold text-[#16211B]">
          {messageConfirmation}
        </div>
      )}

      {/* Éditeur complet d'une variante */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Colonne Gauche (7 cols) : Options de règles (Plateau, Séquencement & Actions) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-[#16211B] mb-3">
              1. Composant MOTEUR — Géométrie du Plateau, Séquencement & Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Nom de la variante
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Description synthétique
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                />
              </div>
            </div>

            {/* A0. Architecture Géométrique du Plateau (V0.3 & Hybrides) */}
            <div className="p-4 rounded-lg bg-emerald-50/60 border border-[#256B45]/40 space-y-2.5 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono-tabular font-bold text-[#256B45]">
                  ARCHITECTURE & GÉOMÉTRIE DU PLATEAU (NOUVEAUTÉ V0.3)
                </div>
                <span className="text-[11px] font-mono-tabular text-[#55645B]">
                  Priorités : Stratégie · Lisibilité · Équilibre 3–6J
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Topologie physique du plateau
                </label>
                <select
                  value={form.geometriePlateau || 'modulaire_secteurs'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      geometriePlateau: e.target.value as GeometriePlateau,
                    })
                  }
                  className="w-full px-2.5 py-2 text-xs font-semibold border border-[#256B45] rounded-lg bg-white text-[#16211B]"
                >
                  <option value="double_plateau_34_56">
                    Plateau Double-Face Fixe : Recto 3–4J (9 zones) / Verso 5–6J (13 zones)
                  </option>
                  <option value="hex_couronne_19">
                    Grille Hexagonale Fixe à 19 Cases en 3 Couronnes (Cœur + 6 + 12)
                  </option>
                  <option value="clairieres_sentiers">
                    Réseau de Clairières & Sentiers Forestiers (1 Sanctuaire + 3 Cols + 6 Lisières)
                  </option>
                  <option value="modulaire_secteurs">
                    Plateau Modulaire V0.1 (1 Tuile Cœur + 2×N Tuiles Secteurs)
                  </option>
                </select>
              </div>
            </div>

            {/* A. Séquencement de la Programmation & de la Résolution */}
            <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-3 mb-4">
              <div className="text-xs font-mono-tabular font-bold text-[#256B45]">
                A. OPTIONS DE SÉQUENCEMENT (PROGRAMMATION & RÉSOLUTION DU TOUR)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Mode de Programmation des Défenseurs
                  </label>
                  <select
                    value={form.modeProgrammation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        modeProgrammation: e.target.value as ModeProgrammation,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="sequentielle_2_ordres">
                      Séquentielle : 2 actions posées d’affilée par joueur (Réf.)
                    </option>
                    <option value="alternee_1_par_1">
                      Alternée : Tour de table Action I, puis Tour de table Action II
                    </option>
                    <option value="2e_apres_ciblage">
                      Réactive : Action I → Ciblage Machines → Programmation Action II
                    </option>
                    <option value="un_seul_ordre">
                      Épurée : 1 seule action par Défenseur et par tour
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Mode de Résolution & Moment de la Coupe
                  </label>
                  <select
                    value={form.modeResolution}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        modeResolution: e.target.value as ModeResolution,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="entrelacee_coupe_fin">
                      Entrelacée : Act. I → Ciblage Machines → Act. II → Coupes (Réf.)
                    </option>
                    <option value="deux_vagues_completes">
                      Deux Vagues complètes (Coupe dès la Vague I puis Vague II)
                    </option>
                    <option value="machines_avant_actions">
                      Machines d’abord : Ciblage Machines → Actions → Coupes
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* B. Options sur la nature des Actions en elles-mêmes */}
            <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-3 mb-4">
              <div className="text-xs font-mono-tabular font-bold text-[#256B45]">
                B. OPTIONS SUR LES ACTIONS DES DÉFENSEURS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Effet de l’action « Protéger la case »
                  </label>
                  <select
                    value={form.effetProteger}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        effetProteger: e.target.value as EffetProteger,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="coupe_seule">
                      Bloque uniquement la coupe de Forêt ce tour (Réf.)
                    </option>
                    <option value="barrage_entree_et_coupe">
                      Barrage complet : bloque l’entrée des Machines ET la coupe
                    </option>
                    <option value="protection_collective">
                      Protection collective : exige 2 Défenseurs pour bloquer la coupe
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Effet & Condition de « Saboter une Machine »
                  </label>
                  <select
                    value={form.effetSaboter}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        effetSaboter: e.target.value as EffetSaboter,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="individuel_chantier">
                      Individuel : 1 Défenseur renvoie la Machine au Chantier (Réf.)
                    </option>
                    <option value="alliance_requise">
                      Alliance requise : exige 2 Défenseurs sur la case → Chantier
                    </option>
                    <option value="immobiliser_sur_place">
                      Enrayer sur place : couche la Machine pour le tour sans la retirer
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[#16211B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.actionReplanterActive}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        actionReplanterActive: e.target.checked,
                      })
                    }
                  />
                  <span>
                    Activer la 4e carte Action « Replanter » (+1 Forêt sur zone libre)
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#16211B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.deplacementDoubleActif}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deplacementDoubleActif: e.target.checked,
                      })
                    }
                  />
                  <span>Activer le « Déplacement à 2 zones » (Éclaireur)</span>
                </label>
              </div>
            </div>

            {/* C. Paramètres numériques et Automate du Méchant */}
            <div className="p-4 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5] space-y-3">
              <div className="text-xs font-mono-tabular font-bold text-[#256B45]">
                C. PARAMÈTRES DU PLATEAU (3 À 6 JOUEURS) & AUTOMATE DU MÉCHANT
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Joueurs (3 à 6)
                  </label>
                  <select
                    value={form.nbJoueurs}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nbJoueurs: Number(e.target.value) as 3 | 4 | 5 | 6,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value={3}>3 Joueurs</option>
                    <option value={4}>4 Joueurs</option>
                    <option value={5}>5 Joueurs</option>
                    <option value={6}>6 Joueurs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Défenseurs / Joueur
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={form.defenseursParJoueur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        defenseursParJoueur: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Forêts / Zone
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={form.foretsParCaseSecteur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        foretsParCaseSecteur: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Forêts Cœur Central
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={form.foretsCoeur}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        foretsCoeur: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Nombre de Tours
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={8}
                    value={form.nbTours}
                    onChange={(e) =>
                      setForm({ ...form, nbTours: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Machines au départ (/6)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={form.machinesInitiales}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        machinesInitiales: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Rythme Apprentissage
                  </label>
                  <select
                    value={form.rythmeApprentissage}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        rythmeApprentissage: e.target
                          .value as RythmeApprentissage,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="chaque_machine">Après chaque Machine</option>
                    <option value="fin_de_tour">En fin de tour</option>
                    <option value="aucun">Aucun (Témoin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#16211B] mb-1">
                    Portée Tactiques
                  </label>
                  <select
                    value={form.porteeTactiques}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        porteeTactiques: e.target.value as PorteeTactiques,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white"
                  >
                    <option value="voisinage">Zone actuelle + voisines</option>
                    <option value="plateau_entier">Tout le plateau</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite (5 cols) : Composant 2 (BOTS — 6 Classiques + 3 Algorithmes de Pointe) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-[#D8DFD5] space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#16211B]">
              2. Composant BOTS — Échelle des 9 Joueurs Virtuels (dont 3 IA de Pointe)
            </h3>
            <p className="text-xs text-[#55645B]">
              L’échelle complète mesure à la fois le plancher naïf et le plafond stratégique (Inférence Bayésienne, Beam Rollout multi-tours et IS-MCTS).
            </p>
          </div>

          <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
            {CATALOGUE_BOTS_V01.map((bot, idx) => (
              <div
                key={bot.id}
                className={`p-3.5 rounded-lg border ${
                  bot.estPointe
                    ? 'bg-emerald-50/70 border-[#256B45]'
                    : 'bg-[#F4F5F0] border-[#D8DFD5]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-semibold text-xs text-[#16211B]">
                    {idx + 1}. {bot.nom}
                  </div>
                  <span className="text-[10px] font-mono-tabular text-[#256B45] font-semibold">
                    {bot.estPointe ? 'ALGO DE POINTE' : 'SOCLE'}
                  </span>
                </div>
                {bot.algorithme && (
                  <div className="text-[11px] font-mono-tabular text-[#16211B] mb-1">
                    Méthode : {bot.algorithme}
                  </div>
                )}
                <p className="text-xs text-[#55645B] leading-relaxed">
                  {bot.description}
                </p>
                <div className="mt-1.5 text-[11px] text-[#256B45] font-medium">
                  Rôle en test : {bot.roleDansTests}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
