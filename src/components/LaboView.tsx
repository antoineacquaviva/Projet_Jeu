import React, { useState, useMemo } from 'react';
import {
  LabIdea,
  LabIdeaCible,
  LabIdeaMaturite,
  LabIdeaPriorite,
  VariantV01,
} from '../shared/types';

interface LaboViewProps {
  idees: LabIdea[];
  variantes: VariantV01[];
  onSaveIdee: (idee: LabIdea) => void;
  onDeleteIdee: (id: string) => void;
  onSelectVariante?: (id: string) => void;
}

export const LaboView: React.FC<LaboViewProps> = ({
  idees,
  variantes,
  onSaveIdee,
  onDeleteIdee,
  onSelectVariante,
}) => {
  const [filtreCible, setFiltreCible] = useState<'Tous' | LabIdeaCible>('Tous');
  const [filtreMaturite, setFiltreMaturite] = useState<'Toutes' | LabIdeaMaturite>('Toutes');
  const [triPar, setTriPar] = useState<'interet' | 'priorite'>('interet');

  // Formulaire de création d'une nouvelle idée
  const [titre, setTitre] = useState<string>('');
  const [cible, setCible] = useState<LabIdeaCible>('Jeu');
  const [categorie, setCategorie] =
    useState<LabIdea['categorie']>('Séquencement & Tour');
  const [description, setDescription] = useState<string>('');
  const [auteur, setAuteur] = useState<'Auteur' | 'Gemini'>('Auteur');
  const [priorite, setPriorite] = useState<LabIdeaPriorite>('Haute');
  const [maturite, setMaturite] = useState<LabIdeaMaturite>('Prête à tester');
  const [interet, setInteret] = useState<number>(8);

  const poidsPriorite: Record<LabIdeaPriorite, number> = {
    Haute: 3,
    Moyenne: 2,
    Basse: 1,
  };

  const ideesFiltrees = useMemo(() => {
    return idees
      .filter((i) => (filtreCible === 'Tous' ? true : i.cible === filtreCible))
      .filter((i) =>
        filtreMaturite === 'Toutes' ? true : i.maturite === filtreMaturite
      )
      .sort((a, b) => {
        if (triPar === 'interet') {
          if (b.interet !== a.interet) return b.interet - a.interet;
          return poidsPriorite[b.priorite] - poidsPriorite[a.priorite];
        }
        if (poidsPriorite[b.priorite] !== poidsPriorite[a.priorite]) {
          return poidsPriorite[b.priorite] - poidsPriorite[a.priorite];
        }
        return b.interet - a.interet;
      });
  }, [idees, filtreCible, filtreMaturite, triPar]);

  const handleSubmitNouvelleIdee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const nouvelle: LabIdea = {
      id: `idea_${Date.now().toString(36)}`,
      titre: titre.trim(),
      cible,
      categorie,
      description: description.trim() || 'À détailler lors des prochains essais.',
      auteur,
      priorite,
      maturite,
      interet,
      dateCreation: today,
      dateMaj: today,
    };
    onSaveIdee(nouvelle);
    setTitre('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* En-tête et filtres du Labo */}
      <div className="bg-white rounded-xl p-4 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#16211B]">
            6. Labo — Tableau Partagé d’Idées pour Le Jeu & L’Atelier
          </h2>
          <p className="text-xs text-[#55645B]">
            Consignez vos idées (Auteur ou Gemini) et pilotez leur Priorité, leur Maturité et leur Intérêt (1 à 10).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
            {(['Tous', 'Jeu', 'Atelier'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFiltreCible(c)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filtreCible === c
                    ? 'bg-[#256B45] text-white'
                    : 'text-[#16211B] hover:bg-white'
                }`}
              >
                {c === 'Tous' ? 'Tout voir' : `Cible : ${c}`}
              </button>
            ))}
          </div>

          <select
            value={filtreMaturite}
            onChange={(e) =>
              setFiltreMaturite(e.target.value as 'Toutes' | LabIdeaMaturite)
            }
            className="px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white text-[#16211B]"
          >
            <option value="Toutes">Toutes maturités</option>
            <option value="Idée brute">Idée brute</option>
            <option value="En étude">En étude</option>
            <option value="Prête à tester">Prête à tester</option>
            <option value="Intégrée V0.1">Intégrée V0.1</option>
            <option value="Différée">Différée</option>
          </select>

          <select
            value={triPar}
            onChange={(e) => setTriPar(e.target.value as 'interet' | 'priorite')}
            className="px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white text-[#16211B]"
          >
            <option value="interet">Trier par Intérêt (10 → 1)</option>
            <option value="priorite">Trier par Priorité</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Colonne Gauche (8 cols) : Tableau des idées */}
        <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-[#D8DFD5]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D8DFD5] text-[#55645B]">
                  <th className="py-2 pr-3 font-semibold">Idée & Description</th>
                  <th className="py-2 px-3 font-semibold">Cible · Catégorie</th>
                  <th className="py-2 px-3 font-semibold">Priorité</th>
                  <th className="py-2 px-3 font-semibold">Maturité</th>
                  <th className="py-2 px-3 font-semibold text-right">Intérêt</th>
                  <th className="py-2 pl-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8DFD5]">
                {ideesFiltrees.map((item) => {
                  const varLiee = variantes.find(
                    (v) => v.id === item.varianteLieeId
                  );
                  return (
                    <tr key={item.id} className="hover:bg-[#F4F5F0]/50 align-top">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sm text-[#16211B]">
                          {item.titre}
                        </div>
                        <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="text-[11px] text-[#55645B] mt-1.5">
                          Proposé par <strong>{item.auteur}</strong> · Mis à jour le{' '}
                          <span className="font-mono-tabular">{item.dateMaj}</span>
                          {varLiee && onSelectVariante && (
                            <>
                              {' · '}
                              <button
                                onClick={() => onSelectVariante(varLiee.id)}
                                className="text-[#256B45] underline font-semibold"
                              >
                                Variante liée : {varLiee.nom}
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#55645B] whitespace-nowrap">
                        <strong className="text-[#16211B]">{item.cible}</strong> ·{' '}
                        {item.categorie}
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={item.priorite}
                          onChange={(e) =>
                            onSaveIdee({
                              ...item,
                              priorite: e.target.value as LabIdeaPriorite,
                            })
                          }
                          className="bg-[#F4F5F0] border border-[#D8DFD5] rounded px-2 py-1 text-xs font-semibold text-[#16211B]"
                        >
                          <option value="Haute">Haute</option>
                          <option value="Moyenne">Moyenne</option>
                          <option value="Basse">Basse</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={item.maturite}
                          onChange={(e) =>
                            onSaveIdee({
                              ...item,
                              maturite: e.target.value as LabIdeaMaturite,
                            })
                          }
                          className="bg-[#F4F5F0] border border-[#D8DFD5] rounded px-2 py-1 text-xs font-medium text-[#16211B]"
                        >
                          <option value="Idée brute">Idée brute</option>
                          <option value="En étude">En étude</option>
                          <option value="Prête à tester">Prête à tester</option>
                          <option value="Intégrée V0.1">Intégrée V0.1</option>
                          <option value="Différée">Différée</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right font-mono-tabular">
                        <select
                          value={item.interet}
                          onChange={(e) =>
                            onSaveIdee({
                              ...item,
                              interet: Number(e.target.value),
                            })
                          }
                          className="bg-[#F4F5F0] border border-[#D8DFD5] rounded px-2 py-1 text-xs font-bold text-[#256B45]"
                        >
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n}/10
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 pl-3 text-right">
                        <button
                          onClick={() => onDeleteIdee(item.id)}
                          className="text-xs text-[#C2412D] hover:underline whitespace-nowrap"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Droite (4 cols) : Formulaire d'écriture d'une idée sur le tableau Labo */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-[#D8DFD5]">
          <form onSubmit={handleSubmitNouvelleIdee} className="space-y-3.5">
            <h3 className="font-display text-base font-semibold text-[#16211B]">
              Inscrire une nouvelle idée au Labo
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Titre de l’idée
              </label>
              <input
                type="text"
                required
                placeholder="Ex. Option de sabotage à distance..."
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Cible
                </label>
                <select
                  value={cible}
                  onChange={(e) => setCible(e.target.value as LabIdeaCible)}
                  className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  <option value="Jeu">Le Jeu</option>
                  <option value="Atelier">L’Atelier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Auteur
                </label>
                <select
                  value={auteur}
                  onChange={(e) =>
                    setAuteur(e.target.value as 'Auteur' | 'Gemini')
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  <option value="Auteur">Auteur</option>
                  <option value="Gemini">Gemini</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Catégorie
              </label>
              <select
                value={categorie}
                onChange={(e) =>
                  setCategorie(e.target.value as LabIdea['categorie'])
                }
                className="w-full px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
              >
                <option value="Séquencement & Tour">Séquencement & Tour</option>
                <option value="Défenseurs & Actions">Défenseurs & Actions</option>
                <option value="Méchant & Pistes">Méchant & Pistes</option>
                <option value="Matériel Physique">Matériel Physique</option>
                <option value="Tests & VM">Tests & VM</option>
                <option value="Différé (Rêve / Peuples)">
                  Différé (Rêve / Peuples)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Priorité
                </label>
                <select
                  value={priorite}
                  onChange={(e) =>
                    setPriorite(e.target.value as LabIdeaPriorite)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Maturité
                </label>
                <select
                  value={maturite}
                  onChange={(e) =>
                    setMaturite(e.target.value as LabIdeaMaturite)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                >
                  <option value="Idée brute">Idée brute</option>
                  <option value="En étude">En étude</option>
                  <option value="Prête à tester">Prête à tester</option>
                  <option value="Intégrée V0.1">Intégrée V0.1</option>
                  <option value="Différée">Différée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Intérêt (1–10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={interet}
                  onChange={(e) => setInteret(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs font-mono-tabular border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Description & hypothèse de conception
              </label>
              <textarea
                rows={3}
                placeholder="Décrivez comment cette idée se traduit sur la table physique ou dans l’Atelier..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D8DFD5] rounded-lg bg-[#F4F5F0]"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors whitespace-nowrap"
            >
              Ajouter l’idée au tableau Labo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
