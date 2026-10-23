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

  const [configTableApercu, setConfigTableApercu] = useState<3 | 4 | 5 | 6>(4);

  const livretCompletVariante = useMemo(
    () => genererLivretPhysiqueVariante(varianteActive, configTableApercu),
    [varianteActive, configTableApercu]
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
    <div className="space-y-5">
      {/* En-tête unifié et allégé : Version active + Variante active/recommandée + Actions rapides */}
      <div className="bg-white rounded-xl p-5 border border-[#D8DFD5] shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#55645B]">
              <span className="font-bold text-[#256B45] uppercase">
                Version {versionActive.id}
              </span>
              <span>·</span>
              <span>
                {versionActive.optionsRegles.length} curseurs de règles ·{' '}
                {versionActive.parametresVariables.length} paramètres numériques
              </span>
              {versionsArchivees.length > 0 && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setAfficherArchives(!afficherArchives)}
                    className="underline hover:text-[#16211B] transition-colors"
                  >
                    {afficherArchives
                      ? 'Masquer les archives ▲'
                      : `Archives (${versionsArchivees.map((v) => `V${v.id}`).join(', ')}) ▼`}
                  </button>
                </>
              )}
            </div>
            <h1 className="font-display text-xl font-bold text-[#16211B]">
              {versionActive.nomJeu} — {versionActive.titreVersion}
            </h1>
            <p className="text-xs text-[#55645B] leading-relaxed">
              {versionActive.pitch}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setAfficherModalNouvelleVersion(!afficherModalNouvelleVersion)
              }
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-[#F4F5F0] text-[#16211B] hover:bg-[#EAECE4] transition-colors"
            >
              + Version X (Labo)
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('demo')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DFD5] bg-white text-[#16211B] hover:bg-stone-100 transition-colors"
            >
              Voir en Démo →
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('proto')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors"
            >
              Jouer dans Proto →
            </button>
          </div>
        </div>

        {/* Bandeau compact de la Variante active / Recommandée #1 Pareto */}
        <div
          className={`rounded-lg px-4 py-2.5 border flex flex-wrap items-center justify-between gap-3 text-xs ${
            estRecommandeeActive
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-[#1E3528]">
              {estRecommandeeActive
                ? `★ Variante #1 Pareto Active (${varianteActive.scoreInteretDernierTest ?? 94}/100) :`
                : 'Variante affichée :'}
            </span>
            <strong className="text-[#16211B]">{varianteActive.nom}</strong>
            <span className="text-[#55645B] hidden xl:inline">
              — {varianteActive.description}
            </span>
          </div>

          {varianteRecommandee && !estRecommandeeActive && (
            <button
              type="button"
              onClick={() =>
                onSelectVariante(
                  varianteRecommandee.id,
                  varianteRecommandee.version || '0.5'
                )
              }
              className="px-3 py-1 text-xs font-bold rounded bg-[#256B45] text-white hover:bg-[#1E5637] transition-colors whitespace-nowrap"
            >
              ★ Revenir à la variante #1 ({varianteRecommandee.nom.split(' ')[1] || '#1'})
            </button>
          )}
        </div>

        {/* Tiroir optionnel des versions archivées */}
        {afficherArchives && versionsArchivees.length > 0 && (
          <div className="pt-3 border-t border-dashed border-[#D8DFD5]">
            <div className="flex flex-wrap items-center gap-2">
              {versionsActives.map((ver) => (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => onSelectVersion(ver.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    ver.id === versionActive.id
                      ? 'bg-[#1E3528] text-white border-[#1E3528]'
                      : 'bg-white text-[#16211B] border-[#D8DFD5]'
                  }`}
                >
                  ★ V{ver.id} (Active) — {ver.titreVersion}
                </button>
              ))}
              {versionsArchivees.map((ver) => (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => onSelectVersion(ver.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    ver.id === versionActive.id
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-[#F4F5F0] text-[#55645B] border-[#D8DFD5] hover:bg-white'
                  }`}
                >
                  [Archive] V{ver.id} — {ver.titreVersion}
                </button>
              ))}
            </div>
          </div>
        )}
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
            <div className="space-y-1.5 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#1E3528] text-white text-xs font-bold uppercase tracking-wider">
                  📖 Livret de Règle Complète — Version {varianteActive.version || versionActive.id} (3 à 6 Joueurs)
                </span>
                {estRecommandeeActive && (
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-[#16211B] text-xs font-extrabold">
                    ★ Variante Recommandée (Référence V0.5)
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold">
                  Plateau Double-Face : Recto 3–4J (9 zones) / Verso 5–6J (13 zones)
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-[#16211B]">
                {varianteActive.nom}
              </h2>
              <p className="text-xs text-[#55645B] leading-relaxed">
                Règle intégrale universelle pour <strong>3 à 6 joueurs</strong>. Une variante définit le système de règles (mécanismes de programmation, parade et résolution) ; le matériel et la face du plateau s’adaptent au nombre de joueurs réunis autour de la table. Ce livret complet est également accessible pendant une partie dans l’onglet <strong>Proto → bouton « 📖 Règles »</strong>.
              </p>

              {/* Sélecteur interactif d'aperçu de configuration de table */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#16211B]">Aperçu matériel & mise en place pour :</span>
                {([3, 4, 5, 6] as const).map((nbJ) => (
                  <button
                    key={nbJ}
                    type="button"
                    onClick={() => setConfigTableApercu(nbJ)}
                    className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                      configTableApercu === nbJ
                        ? 'bg-[#256B45] text-white border-[#256B45] shadow-xs'
                        : 'bg-[#F4F5F0] text-[#16211B] border-[#D8DFD5] hover:bg-stone-200'
                    }`}
                  >
                    {nbJ} Joueurs {nbJ === 4 ? '(Standard)' : ''} · Face {nbJ <= 4 ? 'Recto (9 zones, 38 forêts)' : 'Verso (13 zones, 54 forêts)'}
                  </button>
                ))}
              </div>
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
