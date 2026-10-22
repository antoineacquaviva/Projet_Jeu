import React, { useState, useMemo } from 'react';
import {
  AtelierComponentId,
  GameVersionId,
  GameVersionSpec,
  LabIdea,
  VariantV01,
} from '../shared/types';
import { creerNouvelleVersionDepuisLabo } from '../shared/versions-registry';
import { genererLivretPhysiqueVariante } from '../shared/moteur';

interface JeuViewProps {
  versions: GameVersionSpec[];
  versionActive: GameVersionSpec;
  variantesVersion: VariantV01[];
  varianteActive: VariantV01;
  varianteRecommandee?: VariantV01;
  ideesLabo: LabIdea[];
  onSelectVersion: (versionId: GameVersionId) => void;
  onSelectVariante: (varianteId: string, versionId?: GameVersionId) => void;
  onNavigateTab: (tab: AtelierComponentId) => void;
  onCreateNewVersion: (
    nouvelleVersion: GameVersionSpec,
    varianteSocle: VariantV01,
    ideesPromuesIds: string[]
  ) => void;
  onUpdateVarianteOption: (maj: VariantV01) => void;
}

export const JeuView: React.FC<JeuViewProps> = ({
  versions,
  versionActive,
  variantesVersion,
  varianteActive,
  varianteRecommandee,
  ideesLabo,
  onSelectVersion,
  onSelectVariante,
  onNavigateTab,
  onCreateNewVersion,
  onUpdateVarianteOption,
}) => {
  const [sectionActive, setSectionActive] = useState<
    'regle_complete' | 'synthese' | 'options_regles' | 'parametres' | 'variantes'
  >('regle_complete');

  const livretCompletVariante = useMemo(
    () => genererLivretPhysiqueVariante(varianteActive),
    [varianteActive]
  );
  const [afficherModalNouvelleVersion, setAfficherModalNouvelleVersion] =
    useState<boolean>(false);

  // Formulaire de création d'une nouvelle version du Jeu à partir des idées du Labo
  const [codeNouvVersion, setCodeNouvVersion] = useState<string>('0.3');
  const [titreNouvVersion, setTitreNouvVersion] = useState<string>(
    'Machines Spécialisées & Météo Forestière'
  );
  const [pitchNouvVersion, setPitchNouvVersion] = useState<string>(
    'Nouvelle version intégrant la caractérisation asymétrique des 6 Machines et les propositions retenues au Labo.'
  );
  const [ideesSelectionneesIds, setIdeesSelectionneesIds] = useState<string[]>([
    'idea-machines-differenciees-v02',
  ]);

  const [afficherArchives, setAfficherArchives] = useState<boolean>(false);
  const versionsActives = versions.filter((v) => v.statut !== 'archivee');
  const versionsArchivees = versions.filter((v) => v.statut === 'archivee');

  const ideesDuJeu = ideesLabo.filter((i) => i.cible === 'Jeu');

  const toggleIdeePourVersion = (id: string) => {
    setIdeesSelectionneesIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreerVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeNouvVersion.trim() || '0.3';
    const ideesChoisies = ideesLabo.filter((i) =>
      ideesSelectionneesIds.includes(i.id)
    );
    const { nouvelleVersion, varianteSocle } = creerNouvelleVersionDepuisLabo(
      code,
      titreNouvVersion.trim() || 'Nouvelle itération Labo',
      pitchNouvVersion.trim(),
      ideesChoisies,
      versionActive
    );
    onCreateNewVersion(nouvelleVersion, varianteSocle, ideesSelectionneesIds);
    setAfficherModalNouvelleVersion(false);
  };

  // Regrouper les options de règles par catégorie
  const categoriesOptions = Array.from(
    new Set(versionActive.optionsRegles.map((o) => o.categorie))
  );

  const estRecommandeeActive =
    varianteRecommandee && varianteActive.id === varianteRecommandee.id;

  return (
    <div className="space-y-6">
      {/* Encart permanent : Variante Recommandée par les Tests (sélectionnée par défaut et réactivable en 1 clic) */}
      {varianteRecommandee && (
        <div
          className={`rounded-xl p-4 border-2 flex flex-wrap items-center justify-between gap-4 ${
            estRecommandeeActive
              ? 'bg-emerald-50/90 border-[#256B45]'
              : 'bg-amber-50/90 border-amber-400'
          }`}
        >
          <div className="space-y-1 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#1E3528] text-amber-300 text-xs font-extrabold uppercase tracking-wide">
                ★ Variante Recommandée par les Tests
              </span>
              <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D8DFD5] text-[#16211B]">
                Version {varianteRecommandee.version || '0.3'} · Score d’intérêt{' '}
                {varianteRecommandee.scoreInteretDernierTest ?? 91}/100
              </span>
              {estRecommandeeActive ? (
                <span className="px-2.5 py-0.5 rounded bg-[#256B45] text-white text-xs font-bold">
                  ✓ Sélectionnée actuellement
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded bg-amber-200 text-amber-900 text-xs font-bold">
                  Une autre variante est actuellement affichée ({varianteActive.nom})
                </span>
              )}
            </div>
            <div className="font-display text-base font-bold text-[#16211B]">
              {varianteRecommandee.nom}
            </div>
            <p className="text-xs text-[#55645B] leading-relaxed">
              {varianteRecommandee.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!estRecommandeeActive && (
              <button
                type="button"
                onClick={() =>
                  onSelectVariante(
                    varianteRecommandee.id,
                    varianteRecommandee.version || '0.5'
                  )
                }
                className="px-4 py-2 text-xs font-extrabold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] shadow-xs transition-colors whitespace-nowrap"
              >
                ★ Resélectionner la variante recommandée
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onSelectVariante(
                  varianteRecommandee.id,
                  varianteRecommandee.version || '0.5'
                );
                setSectionActive('regle_complete');
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors whitespace-nowrap"
            >
              📖 Lire la règle complète
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectVariante(
                  varianteRecommandee.id,
                  varianteRecommandee.version || '0.5'
                );
                onNavigateTab('demo');
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-[#D8DFD5] text-[#16211B] hover:bg-stone-100 transition-colors whitespace-nowrap"
            >
              Voir en Démo →
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectVariante(
                  varianteRecommandee.id,
                  varianteRecommandee.version || '0.5'
                );
                onNavigateTab('proto');
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#16211B] text-white hover:bg-black transition-colors whitespace-nowrap"
            >
              Jouer dans Proto →
            </button>
          </div>
        </div>
      )}

      {/* Bandeau supérieur : Sélecteur des Versions du Jeu & Création d'une Version X */}
      <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#D8DFD5]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono-tabular uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#1E3528] text-white font-semibold">
                Le Jeu · Version {versionActive.id}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                  versionActive.statut === 'active'
                    ? 'bg-emerald-50 text-[#256B45] border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {versionActive.statut === 'active'
                  ? 'Version de référence active'
                  : 'Chantier issu du Labo'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#16211B] mt-2">
              {versionActive.nomJeu} — {versionActive.titreVersion}
            </h1>
            <p className="text-sm text-[#55645B] mt-1.5 max-w-4xl leading-relaxed">
              {versionActive.pitch}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() =>
                setAfficherModalNouvelleVersion(!afficherModalNouvelleVersion)
              }
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#256B45] text-[#256B45] bg-emerald-50/60 hover:bg-emerald-100/70 transition-colors"
            >
              + Préparer une Version X (depuis le Labo)
            </button>
            <button
              onClick={() => onNavigateTab('proto')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors"
            >
              Jouer la variante active dans Proto →
            </button>
          </div>
        </div>

        {/* Cartes de sélection de la Version Active (V0.4) + Tiroir optionnel des Archives (V0.1–V0.3) */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
              Version Active de l’Atelier ({versionsActives.length}) :
            </div>
            {versionsArchivees.length > 0 && (
              <button
                type="button"
                onClick={() => setAfficherArchives(!afficherArchives)}
                className="px-3 py-1 rounded-lg text-xs font-semibold border border-[#D8DFD5] bg-[#F4F5F0] text-[#55645B] hover:text-[#16211B] hover:bg-stone-200/70 transition-colors"
              >
                {afficherArchives
                  ? `Masquer les versions archivées (${versionsArchivees.map((v) => `V${v.id}`).join(', ')}) ▲`
                  : `📦 Voir les versions archivées (${versionsArchivees.map((v) => `V${v.id}`).join(', ')}) ▼`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {versionsActives.map((ver) => {
              const estActive = ver.id === versionActive.id;
              const contientRecommandee =
                (varianteRecommandee?.version || '0.4') === ver.id;
              return (
                <button
                  key={ver.id}
                  onClick={() => onSelectVersion(ver.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    estActive
                      ? 'bg-[#1E3528] text-white border-[#1E3528] shadow-sm'
                      : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-tabular text-xs font-bold uppercase px-2 py-0.5 rounded bg-black/15">
                        Version {ver.id} (Active)
                      </span>
                      {contientRecommandee && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-400 text-[#16211B]">
                          ★ Recommandée
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        estActive ? 'text-emerald-200' : 'text-[#55645B]'
                      }`}
                    >
                      {ver.optionsRegles.length} options ·{' '}
                      {ver.parametresVariables.length} paramètres
                    </span>
                  </div>
                  <div className="font-display font-semibold text-sm mt-2">
                    {ver.titreVersion}
                  </div>
                  <p
                    className={`text-xs mt-1 line-clamp-2 ${
                      estActive ? 'text-stone-200' : 'text-[#55645B]'
                    }`}
                  >
                    {ver.pitch}
                  </p>
                </button>
              );
            })}
          </div>

          {afficherArchives && versionsArchivees.length > 0 && (
            <div className="pt-2 border-t border-dashed border-[#D8DFD5]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                📦 Versions Archivées (V0.1, V0.2, V0.3 — consultables pour historique) :
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 opacity-85">
                {versionsArchivees.map((ver) => {
                  const estActive = ver.id === versionActive.id;
                  return (
                    <button
                      key={ver.id}
                      onClick={() => onSelectVersion(ver.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        estActive
                          ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                          : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-stone-500/20">
                          [Archive] V{ver.id}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {ver.optionsRegles.length} options
                        </span>
                      </div>
                      <div className="font-display font-semibold text-xs mt-1.5">
                        {ver.titreVersion}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tiroir de création d'une nouvelle version du Jeu à partir des idées du Labo */}
      {afficherModalNouvelleVersion && (
        <form
          onSubmit={handleCreerVersion}
          className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#16211B]">
                Initialiser une nouvelle Version du Jeu à partir du Labo
              </h3>
              <p className="text-xs text-[#55645B]">
                L’Atelier accueille automatiquement la nouvelle version avec le contrat complet (Contenu de boîte dans Démo, Plateau & Règles dans Proto, Éditeur dans Moteur & Bots, Campagnes dans Tests).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAfficherModalNouvelleVersion(false)}
              className="text-xs font-semibold text-[#55645B] hover:text-[#16211B]"
            >
              Fermer ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Numéro de Version
              </label>
              <input
                type="text"
                required
                value={codeNouvVersion}
                onChange={(e) => setCodeNouvVersion(e.target.value)}
                placeholder="Ex. 0.3"
                className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-[#D8DFD5] rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#16211B] mb-1">
                Titre de la Version
              </label>
              <input
                type="text"
                required
                value={titreNouvVersion}
                onChange={(e) => setTitreNouvVersion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D8DFD5] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#16211B] mb-1">
              Objectif et synopsis de cette version
            </label>
            <textarea
              rows={2}
              value={pitchNouvVersion}
              onChange={(e) => setPitchNouvVersion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#D8DFD5] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#16211B] mb-1.5">
              Post-it du Labo à intégrer dans cette version ({ideesSelectionneesIds.length} sélectionnés) :
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
              {ideesDuJeu.map((idee) => {
                const coche = ideesSelectionneesIds.includes(idee.id);
                return (
                  <label
                    key={idee.id}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                      coche
                        ? 'bg-emerald-50 border-[#256B45] text-[#16211B]'
                        : 'bg-white border-[#D8DFD5] text-[#55645B]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={coche}
                      onChange={() => toggleIdeePourVersion(idee.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-[#16211B]">
                        {idee.titre}
                      </div>
                      <div className="text-[11px] text-[#55645B]">
                        {idee.categorie} · Intérêt {idee.interet}/10
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAfficherModalNouvelleVersion(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-white text-[#55645B]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637]"
            >
              Créer et activer la Version {codeNouvVersion}
            </button>
          </div>
        </form>
      )}

      {/* Sous-navigation de la vue générale du Jeu */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-3 border border-[#D8DFD5]">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              {
                id: 'regle_complete',
                label: `📖 Règle Complète (${livretCompletVariante.length} chapitres)`,
              },
              {
                id: 'options_regles',
                label: `Options de Règles Possibles (${versionActive.optionsRegles.length})`,
              },
              {
                id: 'parametres',
                label: `Paramètres Variables (${versionActive.parametresVariables.length})`,
              },
              {
                id: 'variantes',
                label: `Variantes de la Version ${versionActive.id} (${variantesVersion.length})`,
              },
              {
                id: 'synthese',
                label: 'Invariants & Contrat Générique de l’Atelier',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSectionActive(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                sectionActive === tab.id
                  ? 'bg-[#256B45] text-white'
                  : 'bg-[#F4F5F0] text-[#16211B] hover:bg-[#EAECE4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#55645B]">
          Variante sélectionnée :{' '}
          <strong className="text-[#16211B]">{varianteActive.nom}</strong>
        </div>
      </div>

      {/* SECTION 0 : LIVRET DE RÈGLE COMPLÈTE DE LA VARIANTE SÉLECTIONNÉE */}
      {sectionActive === 'regle_complete' && (
        <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-5">
          <div className="border-b border-[#D8DFD5] pb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#1E3528] text-white text-xs font-bold uppercase tracking-wider">
                  📖 Livret de Règle Complète — Version {varianteActive.version || versionActive.id}
                </span>
                {estRecommandeeActive && (
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-[#16211B] text-xs font-extrabold">
                    ★ Variante Recommandée (Référence V0.5)
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-bold text-[#16211B]">
                {varianteActive.nom}
              </h2>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Règle intégrale et auto-suffisante générée dynamiquement pour la variante sélectionnée ({varianteActive.nbJoueurs} joueurs · {varianteActive.defenseursParJoueur} Défenseur{varianteActive.defenseursParJoueur > 1 ? 's' : ''}/joueur · {varianteActive.machinesInitiales}/6 Machines initiales · {varianteActive.nbTours} tours). Ce même livret est également consultable à tout moment pendant une partie dans l’onglet <strong>Proto → bouton « 📖 Règles »</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('demo')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] hover:bg-stone-200/70 transition-colors"
              >
                Voir le tour guidé en Démo →
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('proto')}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors"
              >
                Tester sur le plateau Proto →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {livretCompletVariante.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F4F5F0] border border-[#D8DFD5] flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display text-sm font-bold text-[#16211B] border-b border-[#D8DFD5] pb-1.5">
                    {sec.section}
                  </h3>
                  <div className="text-[11px] text-[#256B45] font-semibold bg-emerald-50/80 px-2.5 py-1 rounded border border-emerald-200/80">
                    Matériel : {sec.materielConcerne}
                  </div>
                  <p className="text-xs text-[#16211B] whitespace-pre-line leading-relaxed pt-1">
                    {sec.texteRegle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1 : TOUTES LES OPTIONS DE RÈGLES POSSIBLES */}
      {sectionActive === 'options_regles' && (
        <div className="space-y-6">
          {categoriesOptions.map((cat) => {
            const opts = versionActive.optionsRegles.filter(
              (o) => o.categorie === cat
            );
            return (
              <div
                key={cat}
                className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-4"
              >
                <div className="border-b border-[#D8DFD5] pb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[#16211B]">
                    {cat}
                  </h2>
                  <span className="text-xs text-[#55645B] font-mono-tabular">
                    {opts.length} {opts.length > 1 ? 'axes de règles' : 'axe de règle'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {opts.map((opt) => {
                    const valCourante = String(
                      varianteActive[opt.cleVariante] ?? 'false'
                    );
                    return (
                      <div
                        key={opt.id}
                        className="rounded-xl border border-[#D8DFD5] bg-[#F4F5F0]/70 p-4 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-base font-bold text-[#16211B]">
                              {opt.nom}
                            </h3>
                            <span className="text-[11px] font-mono-tabular px-2 py-0.5 rounded bg-white border border-[#D8DFD5] text-[#55645B]">
                              Introduit en V{opt.introduiteEnVersion}
                            </span>
                          </div>
                          <p className="text-xs text-[#55645B] mt-1">
                            {opt.description}
                          </p>
                        </div>

                        <div className="space-y-2 pt-1">
                          {opt.choix.map((ch) => {
                            const estActifDansVariante =
                              valCourante === ch.valeur;
                            return (
                              <div
                                key={ch.valeur}
                                onClick={() => {
                                  const rawVal =
                                    ch.valeur === 'true'
                                      ? true
                                      : ch.valeur === 'false'
                                      ? false
                                      : ch.valeur;
                                  onUpdateVarianteOption({
                                    ...varianteActive,
                                    [opt.cleVariante]: rawVal,
                                  });
                                }}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                  estActifDansVariante
                                    ? 'bg-white border-2 border-[#256B45] shadow-xs'
                                    : 'bg-white/60 border-[#D8DFD5] hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-xs text-[#16211B] flex items-center gap-2">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                                        estActifDansVariante
                                          ? 'bg-[#256B45]'
                                          : 'bg-stone-300'
                                      }`}
                                    />
                                    {ch.label}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {ch.estReference && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-[#55645B]">
                                        Socle
                                      </span>
                                    )}
                                    {estActifDansVariante && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#256B45]">
                                        Actif
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-[#55645B] mt-1 pl-4">
                                  {ch.description}
                                </p>
                                <div className="text-[11px] text-[#1E3528] mt-1.5 pl-4 font-medium">
                                  <span className="underline decoration-dotted">
                                    Sur la table physique :
                                  </span>{' '}
                                  {ch.impactPhysique}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2 : PARAMÈTRES VARIABLES */}
      {sectionActive === 'parametres' && (
        <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-5">
          <div className="border-b border-[#D8DFD5] pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#16211B]">
                Paramètres Numériques Variables — Version {versionActive.id}
              </h2>
              <p className="text-xs text-[#55645B]">
                Ajustez directement un paramètre ci-dessous pour mettre à jour la variante active ou inspecter son impact sur le matériel physique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {versionActive.parametresVariables.map((param) => {
              const valeurActuelle = Number(varianteActive[param.cleVariante]);
              return (
                <div
                  key={param.id}
                  className="rounded-xl border border-[#D8DFD5] bg-[#F4F5F0] p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[#16211B]">
                        {param.nom}
                      </h3>
                      <span className="font-mono-tabular text-xs font-bold px-2.5 py-0.5 rounded bg-[#1E3528] text-white">
                        {valeurActuelle} {param.unite}
                      </span>
                    </div>
                    <p className="text-xs text-[#55645B] mt-1.5 leading-relaxed">
                      {param.description}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-[#D8DFD5] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-tabular text-[#55645B]">
                      <span>Min : {param.min}</span>
                      <span>Réf. : {param.valeurReference}</span>
                      <span>Max : {param.max}</span>
                    </div>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.pas}
                      value={valeurActuelle}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        onUpdateVarianteOption({
                          ...varianteActive,
                          [param.cleVariante]: num,
                        });
                      }}
                      className="w-full accent-[#256B45]"
                    />
                    <div className="text-[11px] text-[#1E3528] pt-1 border-t border-[#D8DFD5]">
                      <strong>Matériel :</strong> {param.impactMateriel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3 : MATRICE DES VARIANTES DE LA VERSION ACTIVE */}
      {sectionActive === 'variantes' && (
        <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8DFD5] pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#16211B]">
                Catalogue des Variantes — Version {versionActive.id}
              </h2>
              <p className="text-xs text-[#55645B]">
                Chaque variante combine un réglage des options de règles et des paramètres variables ci-dessus.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('moteur_bots')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#256B45] text-white"
            >
              + Composer une nouvelle variante dans Moteur & Bots
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variantesVersion.map((v) => {
              const estSelectionnee = v.id === varianteActive.id;
              const estLaRecommandee = v.id === varianteRecommandee?.id;
              return (
                <div
                  key={v.id}
                  className={`rounded-xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                    estSelectionnee
                      ? 'bg-emerald-50/40 border-2 border-[#256B45]'
                      : 'bg-[#F4F5F0] border-[#D8DFD5]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {estLaRecommandee && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-amber-400 text-[#16211B]">
                            ★ Recommandée par les tests
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            v.statutViabilite === 'viable'
                              ? 'bg-emerald-100 text-[#256B45]'
                              : v.statutViabilite === 'eliminee'
                              ? 'bg-red-100 text-[#C2412D]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.statutViabilite === 'viable'
                            ? `Viable · Intérêt ${v.scoreInteretDernierTest ?? '—'}/100`
                            : v.statutViabilite === 'eliminee'
                            ? 'Éliminée (Non viable)'
                            : 'À tester'}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-xs text-[#55645B]">
                        {v.nbJoueurs}J · {v.defenseursParJoueur} Déf./J ·{' '}
                        {v.machinesInitiales} Mach. · {v.nbTours} Tours
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#16211B] mt-2">
                      {v.nom}
                    </h3>
                    <p className="text-xs text-[#55645B] mt-1">
                      {v.description}
                    </p>
                    {v.motifElimination && (
                      <p className="text-xs text-[#C2412D] font-medium mt-1.5 bg-red-50 p-2 rounded border border-red-200">
                        {v.motifElimination}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D8DFD5]">
                    <button
                      onClick={() => onSelectVariante(v.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        estSelectionnee
                          ? 'bg-[#1E3528] text-white'
                          : 'bg-white border border-[#D8DFD5] text-[#16211B] hover:bg-stone-100'
                      }`}
                    >
                      {estSelectionnee
                        ? '✓ Variante active'
                        : 'Sélectionner cette variante'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectVariante(v.id);
                          onNavigateTab('demo');
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-white border border-[#D8DFD5] hover:bg-stone-50"
                      >
                        Démo
                      </button>
                      <button
                        onClick={() => {
                          onSelectVariante(v.id);
                          onNavigateTab('proto');
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-white border border-[#D8DFD5] hover:bg-stone-50"
                      >
                        Proto
                      </button>
                      <button
                        onClick={() => {
                          onSelectVariante(v.id);
                          onNavigateTab('tests');
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-white border border-[#D8DFD5] hover:bg-stone-50"
                      >
                        Tests
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4 : INVARIANTS & CONTRAT PERMANENT DE L'ATELIER */}
      {sectionActive === 'synthese' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-4">
            <h2 className="font-display text-lg font-bold text-[#16211B]">
              Invariants et Nouveautés de la Version {versionActive.id}
            </h2>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#55645B] mb-2">
                Piliers de conception :
              </h3>
              <ul className="space-y-2 text-xs text-[#16211B]">
                {versionActive.invariantsConception.map((inv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#256B45] font-bold">●</span>
                    <span>{inv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#D8DFD5]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#55645B] mb-2">
                Apports de cette version :
              </h3>
              <ul className="space-y-2 text-xs text-[#16211B]">
                {versionActive.evolutionsDepuisPrecedente.map((ev, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">→</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#D8DFD5] space-y-4">
            <h2 className="font-display text-lg font-bold text-[#16211B]">
              Contrat Générique Permanent de l’Atelier de Conception
            </h2>
            <p className="text-xs text-[#55645B] leading-relaxed">
              Ce contrat est codifié dans <code>src/shared/versions-registry.ts</code> et documenté dans le dépôt. Toute nouvelle version <strong>V0.x</strong> ajoutée au registre bénéficie automatiquement et sans redéveloppement des 6 briques suivantes :
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                <strong className="text-[#16211B]">1. Le Jeu (Vue Générale) :</strong>{' '}
                Expose automatiquement la version, le catalogue déclaratif de ses options de règles, ses paramètres variables et ses variantes.
              </div>
              <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                <strong className="text-[#16211B]">2. Démo :</strong>{' '}
                Présente systématiquement (a) le contenu physique de la boîte de jeu de la version, (b) la mise en place pas-à-pas sur la table, et (c) la démonstration interactive d’un tour complet.
              </div>
              <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                <strong className="text-[#16211B]">3. Proto :</strong>{' '}
                Permet de jouer la version et ses variantes avec les consignes de manipulation physique et le livret de règles adapté dynamiquement.
              </div>
              <div className="p-3 rounded-lg bg-[#F4F5F0] border border-[#D8DFD5]">
                <strong className="text-[#16211B]">4. Moteur & Bots / Tests / Labo :</strong>{' '}
                Évalue la viabilité (3.1), l’intérêt stratégique (3.2) avec l’échelle des bots, et relie les post-it du Labo aux versions successives du Jeu.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
