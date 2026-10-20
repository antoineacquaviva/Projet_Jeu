# Architecture Générique de l'Atelier de Conception & Contrat Multi-Versions du Jeu

Ce document consigne les invariants de fonctionnement de l'**Atelier de conception** afin qu'il ne soit jamais nécessaire de les réexpliquer lors de la création d'une nouvelle version du Jeu (`V0.2`, `V0.3`, `V1.0`...).

---

## 1. Les 6 Onglets Permanents de l'Atelier (Sans numérotation)

1. **Le Jeu** (`src/components/JeuView.tsx`) :
   - Vue générale sur le Jeu et ses différentes **Versions** (`Version 0.1`, `Version 0.2`, `Version X`).
   - Permet de basculer d'une version à l'autre ou d'initialiser une nouvelle version directement à partir d'une sélection de post-it du **Labo**.
   - Présente de manière déclarative **toutes les options de règles possibles** de la version active (choix possibles, description, impact sur la table physique), **tous les paramètres numériques variables** (plages `[Min – Max]`, valeur de référence, impact matériel) et la matrice des variantes de cette version.
2. **Démo** (`src/components/DemoView.tsx`) :
   - Doit toujours comporter trois volets :
     1. **Contenu de la boîte de jeu** (lu dynamiquement depuis la version et la variante actives).
     2. **Mise en place initiale sur la table** (étapes physiques pas-à-pas).
     3. **Démo guidée pas-à-pas d'un tour de jeu**.
3. **Proto** (`src/components/ProtoView.tsx`) :
   - Prototype jouable permettant de manipuler la version et la variante actives en se projetant sur le matériel physique (encart des gestes sur la table physique, gobelets 2D6 secrets, livret de règles physiques dynamique).
4. **Moteur & Bots** (`src/components/MoteurBotsView.tsx`) :
   - Configurateur permettant d'activer/désactiver les options de règles, régler les paramètres variables, dupliquer une variante et inspecter les profils de joueurs virtuels (`inerte`, `hasard`, `boucle`, `reflexe`, `glouton`, `deductif`).
5. **Tests** (`src/components/TestsView.tsx`) :
   - Dispositif d'évaluation en 3 étapes :
     - **Viabilité & Élimination directe** (filtre coupe-circuit éliminant les variantes buguées, submergées ou à boucle gagnante),
     - **Intérêt stratégique** (échelle des 6 bots, gain de déduction, impact de l'apprentissage du Méchant),
     - **Sélection de variantes & Planification**.
6. **Labo** (`src/components/LaboView.tsx`) :
   - **Mur de Post-it / Cartes d'idées** pleine largeur pour le Jeu et l'Atelier, avec indicateurs de **Priorité**, **Maturité**, **Intérêt (1–10)** et **Version cible** (`V0.1`, `V0.2`, `V0.3`...).

---

## 2. Comment introduire une nouvelle Version `X` du Jeu dans l'Atelier

Toute version du Jeu est décrite par un contrat unique `GameVersionSpec` dans `src/shared/versions-registry.ts` :

- `id` : identifiant de version (ex. `'0.1'`, `'0.2'`, `'0.3'`).
- `titreVersion` & `pitch` : synthèse des objectifs de cette version.
- `ideesLaboIds` : identifiants des post-it du Labo intégrés dans cette version.
- `optionsRegles` (`RuleOptionSpec[]`) : catalogue déclaratif des options de règles de la version.
- `parametresVariables` (`VariableParameterSpec[]`) : catalogue déclaratif des paramètres numériques réglables.
- `composantsBoite` (`BoxComponentSpec[]`) : inventaire physique affiché automatiquement dans **Démo**.
- `etapesMiseEnPlace` (`SetupStepSpec[]`) : protocole d'installation affiché automatiquement dans **Démo**.

Dès qu'une entrée `GameVersionSpec` et ses variantes (`VariantV01` avec `version: '0.x'`) sont ajoutées (soit dans `src/shared/versions-registry.ts`, soit via le bouton **« + Préparer une Version X (depuis le Labo) »** de l'onglet **Le Jeu**), l'ensemble de l'Atelier la prend en charge automatiquement.
