import React, { useState, useMemo, useEffect } from 'react';
import {
  GameVersionId,
  GameVersionSpec,
  LabIdea,
  LabIdeaCible,
  LabIdeaMaturite,
  LabIdeaPriorite,
  VariantV01,
} from '../shared/types';

interface LaboViewProps {
  idees: LabIdea[];
  variantes: VariantV01[];
  versions?: GameVersionSpec[];
  onSaveIdee: (idee: LabIdea) => void;
  onDeleteIdee: (id: string) => void;
  onSelectVariante?: (id: string) => void;
  onSelectVersion?: (versionId: GameVersionId) => void;
}

export const LaboView: React.FC<LaboViewProps> = ({
  idees,
  variantes,
  versions = [],
  onSaveIdee,
  onDeleteIdee,
  onSelectVariante,
  onSelectVersion,
}) => {
  const [filtreCible, setFiltreCible] = useState<'Tous' | LabIdeaCible>('Tous');
  const [filtreMaturite, setFiltreMaturite] = useState<
    'Toutes' | LabIdeaMaturite
  >('Toutes');
  const [filtreVersion, setFiltreVersion] = useState<'Toutes' | string>(
    'Toutes'
  );
  const [triPar, setTriPar] = useState<'interet' | 'priorite'>('interet');
  const [formulaireOuvert, setFormulaireOuvert] = useState<boolean>(false);
  const [idEnEdition, setIdEnEdition] = useState<string | null>(null);

  // Dossier Maître d'Asymétrie V0.5 (resultats/dossier-conception-asymetrie-gemini.md)
  const [dossierAsymetrieMd, setDossierAsymetrieMd] = useState<string>('');
  const [dossierOuvert, setDossierOuvert] = useState<boolean>(false);
  const [dossierCopie, setDossierCopie] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/atelier/dossier-asymetrie')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.contenuMarkdown) {
          setDossierAsymetrieMd(data.contenuMarkdown);
        }
      })
      .catch(() => {});
  }, []);

  const copierDossierAsymetrie = async () => {
    if (!dossierAsymetrieMd) return;
    try {
      await navigator.clipboard.writeText(dossierAsymetrieMd);
      setDossierCopie(true);
      setTimeout(() => setDossierCopie(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  // État du formulaire de création / édition de post-it
  const [titre, setTitre] = useState<string>('');
  const [cible, setCible] = useState<LabIdeaCible>('Jeu');
  const [versionCible, setVersionCible] = useState<string>('0.5');
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
      .filter((i) =>
        filtreVersion === 'Toutes'
          ? true
          : (i.versionCible || '0.1') === filtreVersion
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
  }, [idees, filtreCible, filtreMaturite, filtreVersion, triPar]);

  const ouvrirNouveauPostIt = () => {
    setIdEnEdition(null);
    setTitre('');
    setCible('Jeu');
    setVersionCible('0.2');
    setCategorie('Séquencement & Tour');
    setDescription('');
    setAuteur('Auteur');
    setPriorite('Haute');
    setMaturite('Prête à tester');
    setInteret(8);
    setFormulaireOuvert(true);
  };

  const ouvrirEditionPostIt = (idee: LabIdea) => {
    setIdEnEdition(idee.id);
    setTitre(idee.titre);
    setCible(idee.cible);
    setVersionCible(idee.versionCible || '0.2');
    setCategorie(idee.categorie);
    setDescription(idee.description);
    setAuteur(idee.auteur);
    setPriorite(idee.priorite);
    setMaturite(idee.maturite);
    setInteret(idee.interet);
    setFormulaireOuvert(true);
  };

  const handleSubmitPostIt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const existante = idEnEdition
      ? idees.find((i) => i.id === idEnEdition)
      : undefined;

    const nouvelle: LabIdea = {
      id: existante ? existante.id : `idea_${Date.now().toString(36)}`,
      titre: titre.trim(),
      cible,
      versionCible,
      categorie,
      description:
        description.trim() || 'À détailler lors des prochains essais.',
      auteur,
      priorite,
      maturite,
      interet,
      varianteLieeId: existante?.varianteLieeId,
      dateCreation: existante ? existante.dateCreation : today,
      dateMaj: today,
    };
    onSaveIdee(nouvelle);
    setTitre('');
    setDescription('');
    setIdEnEdition(null);
    setFormulaireOuvert(false);
  };

  // Style visuel type Post-it d'atelier selon maturité et cible
  const getPostItStyle = (idee: LabIdea) => {
    if (idee.cible === 'Atelier') {
      return {
        cardBg: 'bg-[#EEF5F9] border-[#BBD4E5]',
        tapeBg: 'bg-[#3B6E8C] text-white',
        accentText: 'text-[#234B63]',
      };
    }
    if (idee.maturite.startsWith('Intégrée')) {
      return {
        cardBg: 'bg-[#ECF6EE] border-[#B6DBC0]',
        tapeBg: 'bg-[#256B45] text-white',
        accentText: 'text-[#1E3528]',
      };
    }
    if (idee.maturite === 'Différée') {
      return {
        cardBg: 'bg-[#F3EFEA] border-[#D8CFC4]',
        tapeBg: 'bg-[#6E6256] text-white',
        accentText: 'text-[#554A40]',
      };
    }
    // Post-it jaune paille / ambre chaleureux pour les idées actives (Idée brute, En étude, Prête à tester)
    return {
      cardBg: 'bg-[#FFFBE6] border-[#E8D78C]',
      tapeBg: 'bg-[#B45309] text-white',
      accentText: 'text-[#78350F]',
    };
  };

  return (
    <div className="space-y-6">
      {/* Encart Dossier Maître d'Asymétrie V0.5 (resultats/dossier-conception-asymetrie-gemini.md) */}
      <div className="bg-[#ECF6EE] rounded-xl p-5 border border-[#B6DBC0] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#256B45] text-white">
                Dossier Maître d’Asymétrie V0.5
              </span>
              <code className="text-xs font-mono-tabular text-[#1E3528] bg-white/80 px-2 py-0.5 rounded border border-[#B6DBC0]">
                resultats/dossier-conception-asymetrie-gemini.md
              </code>
            </div>
            <h2 className="font-display text-base font-bold text-[#16211B] mt-1.5">
              Transposition intégrale V0.4 → V0.5 : 6 Peuples × 4 Secteurs (36 pts), Le Rêve partagé & Boîte à outils asymétrique (Effet « Colt Express », Barrage d’entrée, Timing Reptiles)
            </h2>
            <p className="text-xs text-[#2B3730] mt-0.5">
              100 % du travail de conception sur l’asymétrie est conservé et ancré sur le Cœur Unifié V0.5 (3 Curseurs sur Plateau Double Face). Prêt à être repris case par case.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copierDossierAsymetrie}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#1E3528] text-white hover:bg-[#16211B] transition-colors shadow-xs"
            >
              {dossierCopie
                ? '✓ Dossier V0.5 copié dans le presse-papiers'
                : 'Copier le Dossier Maître V0.5'}
            </button>
            <button
              type="button"
              onClick={() => setDossierOuvert(!dossierOuvert)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-[#1E3528] border border-[#256B45]/40 hover:bg-[#F4F5F0] transition-colors"
            >
              {dossierOuvert ? 'Replier le dossier ▲' : 'Consulter le dossier complet ▼'}
            </button>
          </div>
        </div>

        {dossierOuvert && dossierAsymetrieMd && (
          <div className="bg-white rounded-lg border border-[#B6DBC0] p-4 max-h-[520px] overflow-y-auto">
            <pre className="text-xs font-mono-tabular whitespace-pre-wrap text-[#16211B] leading-relaxed">
              {dossierAsymetrieMd}
            </pre>
          </div>
        )}
      </div>

      {/* Barre supérieure du Mur de Post-it : Filtres + Bouton Nouveau Post-it */}
      <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="font-display text-xl font-bold text-[#16211B]">
            Labo — Mur de Post-it (Idées pour Le Jeu & L’Atelier)
          </h1>
          <p className="text-xs text-[#55645B] mt-0.5">
            {ideesFiltrees.length} post-it affichés sur {idees.length} · Notez vos pistes de règles, évaluez leur priorité/maturité et embarquez-les dans les versions successives du Jeu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtre Cible */}
          <div className="flex items-center gap-1 bg-[#F4F5F0] p-1 rounded-lg border border-[#D8DFD5]">
            {(['Tous', 'Jeu', 'Atelier'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFiltreCible(c)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  filtreCible === c
                    ? 'bg-[#1E3528] text-white'
                    : 'text-[#16211B] hover:bg-white'
                }`}
              >
                {c === 'Tous' ? 'Tout le mur' : c === 'Jeu' ? 'Le Jeu' : 'L’Atelier'}
              </button>
            ))}
          </div>

          {/* Filtre Version Cible */}
          <select
            value={filtreVersion}
            onChange={(e) => setFiltreVersion(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold border border-[#D8DFD5] rounded-lg bg-white text-[#16211B]"
          >
            <option value="Toutes">Toutes versions</option>
            <option value="0.5">Cible : Version 0.5</option>
            <option value="0.4">Cible : Version 0.4</option>
            <option value="0.3">Cible : Version 0.3</option>
            <option value="0.2">Cible : Version 0.2</option>
            <option value="0.1">Cible : Version 0.1</option>
          </select>

          {/* Filtre Maturité */}
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
            <option value="Intégrée V0.5">Intégrée V0.5</option>
            <option value="Intégrée V0.4">Intégrée V0.4</option>
            <option value="Intégrée V0.3">Intégrée V0.3</option>
            <option value="Intégrée V0.2">Intégrée V0.2</option>
            <option value="Intégrée V0.1">Intégrée V0.1</option>
            <option value="Différée">Différée</option>
          </select>

          {/* Tri */}
          <select
            value={triPar}
            onChange={(e) => setTriPar(e.target.value as 'interet' | 'priorite')}
            className="px-2.5 py-1.5 text-xs border border-[#D8DFD5] rounded-lg bg-white text-[#16211B]"
          >
            <option value="interet">Tri : Intérêt (10 → 1)</option>
            <option value="priorite">Tri : Priorité</option>
          </select>

          {/* Bouton Nouveau Post-it */}
          <button
            onClick={() =>
              formulaireOuvert ? setFormulaireOuvert(false) : ouvrirNouveauPostIt()
            }
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors shadow-xs whitespace-nowrap"
          >
            {formulaireOuvert ? 'Fermer l’éditeur ✕' : '+ Nouveau Post-it'}
          </button>
        </div>
      </div>

      {/* Tiroir repliable pour écrire ou modifier un Post-it (n'écrase jamais la largeur du mur) */}
      {formulaireOuvert && (
        <form
          onSubmit={handleSubmitPostIt}
          className="bg-[#FFFBE6] border-2 border-[#E8D78C] rounded-xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E8D78C] pb-3">
            <h2 className="font-display text-base font-bold text-[#16211B]">
              {idEnEdition
                ? 'Modifier le Post-it sur le mur du Labo'
                : 'Coller un nouveau Post-it sur le mur du Labo'}
            </h2>
            <span className="text-xs text-[#78350F] font-medium">
              Auteur : {auteur} · Cible : {cible} (V{versionCible})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Titre de l’idée
              </label>
              <input
                type="text"
                required
                placeholder="Ex. Sabotage à distance par l’Éclaireur..."
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white text-[#16211B]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Catégorie
              </label>
              <select
                value={categorie}
                onChange={(e) =>
                  setCategorie(e.target.value as LabIdea['categorie'])
                }
                className="w-full px-2.5 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white text-[#16211B]"
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Cible & Version
              </label>
              <div className="flex gap-1.5">
                <select
                  value={cible}
                  onChange={(e) => setCible(e.target.value as LabIdeaCible)}
                  className="w-1/2 px-2 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white"
                >
                  <option value="Jeu">Jeu</option>
                  <option value="Atelier">Atelier</option>
                </select>
                <input
                  type="text"
                  value={versionCible}
                  onChange={(e) => setVersionCible(e.target.value)}
                  placeholder="0.2"
                  title="Version cible (ex. 0.1, 0.2, 0.3)"
                  className="w-1/2 px-2 py-2 text-xs font-mono-tabular border border-[#D8CFC4] rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Auteur
              </label>
              <select
                value={auteur}
                onChange={(e) =>
                  setAuteur(e.target.value as 'Auteur' | 'Gemini')
                }
                className="w-full px-2.5 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white"
              >
                <option value="Auteur">Auteur</option>
                <option value="Gemini">Gemini</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Description concrète (règle, geste matériel ou comportement)
              </label>
              <textarea
                rows={2}
                placeholder="Décrivez comment cette idée se traduit sur la table de jeu ou dans l’Atelier..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white text-[#16211B]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Priorité
              </label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as LabIdeaPriorite)}
                className="w-full px-2.5 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white"
              >
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Basse">Basse</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Maturité
              </label>
              <select
                value={maturite}
                onChange={(e) => setMaturite(e.target.value as LabIdeaMaturite)}
                className="w-full px-2.5 py-2 text-xs border border-[#D8CFC4] rounded-lg bg-white"
              >
                <option value="Idée brute">Idée brute</option>
                <option value="En étude">En étude</option>
                <option value="Prête à tester">Prête à tester</option>
                <option value="Intégrée V0.5">Intégrée V0.5</option>
                <option value="Intégrée V0.4">Intégrée V0.4</option>
                <option value="Intégrée V0.3">Intégrée V0.3</option>
                <option value="Intégrée V0.2">Intégrée V0.2</option>
                <option value="Intégrée V0.1">Intégrée V0.1</option>
                <option value="Différée">Différée</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <div className="w-20">
                <label className="block text-xs font-semibold text-[#16211B] mb-1">
                  Note /10
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={interet}
                  onChange={(e) => setInteret(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs font-mono-tabular border border-[#D8CFC4] rounded-lg bg-white"
                />
              </div>
              <button
                type="submit"
                className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637]"
              >
                {idEnEdition ? 'Enregistrer' : 'Épingler'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MUR DE POST-IT SUR TOUTE LA LARGEUR (1 à 3 ou 4 colonnes fluides) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ideesFiltrees.map((item) => {
          const style = getPostItStyle(item);
          const varLiee = variantes.find((v) => v.id === item.varianteLieeId);
          const versionAssociee = versions.find(
            (ver) => ver.id === (item.versionCible || '0.1')
          );

          return (
            <article
              key={item.id}
              className={`rounded-xl border-2 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${style.cardBg}`}
            >
              {/* En-tête du Post-it : Bandeau adhésif + Note d'intérêt */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${style.tapeBg}`}
                    >
                      {item.cible === 'Jeu' ? 'Le Jeu' : 'L’Atelier'} ·{' '}
                      {item.categorie}
                    </span>
                    {item.versionCible && (
                      <button
                        type="button"
                        onClick={() =>
                          versionAssociee &&
                          onSelectVersion &&
                          onSelectVersion(versionAssociee.id)
                        }
                        className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-white/80 border border-black/15 text-[#16211B] hover:bg-white"
                        title="Version cible du Jeu"
                      >
                        V{item.versionCible}
                      </button>
                    )}
                  </div>

                  {/* Pastille Note d'Intérêt */}
                  <div className="flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-black/10 shrink-0">
                    <span className="text-[10px] text-[#55645B] font-medium">
                      Intérêt
                    </span>
                    <select
                      aria-label="Note d'intérêt"
                      value={item.interet}
                      onChange={(e) =>
                        onSaveIdee({
                          ...item,
                          interet: Number(e.target.value),
                        })
                      }
                      className="text-xs font-mono-tabular font-bold text-[#256B45] bg-transparent cursor-pointer"
                    >
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n}/10
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Titre du Post-it */}
                <h3 className="font-display text-base font-bold text-[#16211B] leading-snug">
                  {item.titre}
                </h3>

                {/* Corps de texte du Post-it */}
                <p className="text-xs text-[#2B3730] mt-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Lien direct vers la variante si existante */}
                {varLiee && onSelectVariante && (
                  <div className="mt-3">
                    <button
                      onClick={() => onSelectVariante(varLiee.id)}
                      className="text-xs font-semibold text-[#256B45] bg-white/80 hover:bg-white px-2.5 py-1 rounded border border-[#256B45]/30 inline-flex items-center gap-1"
                    >
                      <span>▶ Tester dans Proto : {varLiee.nom}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pied du Post-it : Contrôles directs de Priorité, Maturité et Actions */}
              <div className="mt-4 pt-3 border-t border-black/10 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#55645B] mb-0.5">
                      Priorité
                    </label>
                    <select
                      value={item.priorite}
                      onChange={(e) =>
                        onSaveIdee({
                          ...item,
                          priorite: e.target.value as LabIdeaPriorite,
                        })
                      }
                      className="w-full bg-white/85 border border-black/15 rounded px-2 py-1 text-xs font-semibold text-[#16211B]"
                    >
                      <option value="Haute">Haute priorité</option>
                      <option value="Moyenne">Priorité moyenne</option>
                      <option value="Basse">Priorité basse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#55645B] mb-0.5">
                      Maturité
                    </label>
                    <select
                      value={item.maturite}
                      onChange={(e) =>
                        onSaveIdee({
                          ...item,
                          maturite: e.target.value as LabIdeaMaturite,
                        })
                      }
                      className="w-full bg-white/85 border border-black/15 rounded px-2 py-1 text-xs font-semibold text-[#16211B]"
                    >
                      <option value="Idée brute">Idée brute</option>
                      <option value="En étude">En étude</option>
                      <option value="Prête à tester">Prête à tester</option>
                      <option value="Intégrée V0.5">Intégrée V0.5</option>
                      <option value="Intégrée V0.4">Intégrée V0.4</option>
                      <option value="Intégrée V0.3">Intégrée V0.3</option>
                      <option value="Intégrée V0.2">Intégrée V0.2</option>
                      <option value="Intégrée V0.1">Intégrée V0.1</option>
                      <option value="Différée">Différée</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#55645B] pt-1">
                  <span>
                    Par <strong className="text-[#16211B]">{item.auteur}</strong> ·{' '}
                    <span className="font-mono-tabular">{item.dateMaj}</span>
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => ouvrirEditionPostIt(item)}
                      className="font-semibold text-[#16211B] hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteIdee(item.id)}
                      className="font-semibold text-[#C2412D] hover:underline"
                    >
                      Décoller
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
