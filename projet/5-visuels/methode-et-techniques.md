# Dossier de cadre méthodologique et technique
## Illustrer *La Forêt qui rêve* par un flux de travail hybride, assisté par l'IA

*Version révisée par Claude le 14 oct. 2026, à partir du dossier complet de l'auteur (13 h 35, archivé tel quel dans `claude/archive/`) et du brainstorm « Identité visuelle ». Dépôt : `projet/5-visuels/methode-et-techniques.md` ; en cas d'écart, le dépôt fait foi. La structure et les flux de l'auteur sont conservés ; les apports de Claude sont signalés par **Révision** (correction ou précision d'un point existant) ou **Ajout** (point absent). Les choix de direction artistique restent des pistes tant que l'auteur ne les a pas tranchés (brainstorm, section 5). Les points juridiques sont indicatifs : Claude n'est pas juriste.*

### Ce que la révision change, en bref
1. **Le pilier « provenance légale de tout actif » est intenable tel quel** : SDXL et Flux ont été entraînés sur des images du web, dont des œuvres d'artistes vivants. Il est remplacé par trois engagements tenables (2.1).
2. **Deux sources d'inspiration posent un problème culturel** : la vannerie et le perlage (5.2) ; et un problème d'identité, les portraits gravés de personnes réelles pour le Méchant (5.3 B).
3. **Trois réglages techniques sont corrigés** : le scan de texture en image de départ ne laisse pas la profondeur 3D s'exprimer (5.1) ; le Méchant doit garder le même visage sous six expressions (5.3 B) ; le « directeur artistique virtuel » ne peut pas juger seul la palette ni boucler sans garde-fou (6.2).
4. **La moitié du matériel n'avait pas de flux** : plateau, piste des pensées, jetons, icônes, cartes, peuples et personnages. Il est ajouté (5.4 à 5.8), avec la mise en page des cartes à partir des données du moteur.
5. **Contraintes ajoutées** : impression, écran (BGA), calendrier du jeu, rangement des fichiers (le dépôt est public), registre de provenance, contrôle qualité, phasage (sections 8 à 13).

---

## 1. Besoins et périmètre

### 1.1 Objectif général
Concevoir le matériel visuel d'un jeu de société immersif à partir d'un profil de créateur « non-illustrateur », en s'appuyant sur des compétences avancées en développement informatique et en ingénierie de chaînes numériques.

**Révision : deux temps distincts.**
1. **Prototype** (d'aujourd'hui à la V1.0) : un matériel **lisible, cohérent et explicitement provisoire**, pour les tests humains de la V1.0 et pour présenter le jeu. Il doit pouvoir être régénéré à chaque version des règles.
2. **Édition** (après la V1.0, si publication) : le matériel final. Le flux hybride peut le produire en tout ou partie, ou préparer le travail d'un illustrateur (brainstorm, 4 bis et 4 ter).

Le jeu est en V0.4, avec deux cycles de simulation encore prévus : un nombre de Machines, de zones ou de cases peut changer. Ne pas finaliser d'illustration avant que les règles soient stables.

### 1.2 Identité graphique et direction artistique
- **Thématique** : écosystème amazonien, confrontation entre la nature, les esprits et l'industrialisation. Plus précisément : sauver un morceau de forêt des Machines d'un Méchant cupide, qu'on vainc aussi en le faisant rêver.
- **Esthétique (auteur)** : peinture naïve, registre onirique et surréaliste, teintes vives, compositions épurées ou symboliques.

**Révision : alignement sur le brainstorm** (à confirmer par l'auteur).
- **Ton** : un mélange assumé du comique et de l'onirique, qui penche vers l'onirique adulte (décision de l'auteur, 13 oct.). Le registre visé porte un nom : le **réalisme magique**. « Surréaliste » reste juste pour la technique du collage (Max Ernst), moins pour le ton d'ensemble.
- **« Peinture naïve »** désigne ici la peinture populaire naïve, pas les arts autochtones : les appeler « naïfs » serait réducteur, et ils relèvent d'une collaboration, pas d'un style à emprunter (brainstorm 2.3).
- **Deux mondes, deux écritures** (proposition 3A du brainstorm) : le **monde de la forêt** en aplats naïfs et teintes vives (verts profonds, rouge terre, noir, éclats d'oiseaux) ; le **monde du Méchant** en caricature satirique modelée (jaune chantier délavé, rouille, gris fumée, blanc cassé, **or**) ; le **rêve**, seul lieu où elles se mêlent, en bleu nuit et violet avec des points lumineux. « Teintes vives » vaut donc pour la forêt, pas pour tout le matériel.
- **Conséquence pour ce dossier** : le dossier d'origine applique un style naïf unique partout, y compris au Méchant et aux Machines. Si les deux écritures sont retenues, il faut **deux LoRA** (« forêt » et « Méchant »), pas un. Les flux ci-dessous sont écrits pour fonctionner dans les deux cas.

### 1.3 Typologie des productions
Liste de l'auteur :
1. **Fonds et décors d'ambiance** : compositions spacieuses et peu chargées (forêt dense, lisières, chantiers) servant de supports de cartes ou de plateau.
2. **Motifs répétitifs et éléments modulaires** : volutes de fumée, frises géométriques, trames *(voir la révision de 2.1, pilier 3, sur les trames « inspirées des tissages et du perlage »)*.
3. **Sujets et entités** : portrait du Méchant ; engins de chantier agressifs, hybridés et stylisés ; faune, flore, éléments naturels et esprits.

**Ajout : la liste réelle des pièces**, tirée du matériel actuel du jeu (V0.4) et des fichiers du moteur. Elle bouge avec les règles : la nomenclature (section 10) en est la version tenue à jour.

| Famille | Pièces | Quantité indicative | Exigence principale | Flux |
|---|---|---|---|---|
| Méchant | Portrait à états : calcule, ricane, fulmine, somnole, dort, ébloui | 1 visage, 5 à 6 expressions | Le même visage d'une expression à l'autre | 5.3 B |
| Piste des pensées | Ruban de fumée, cases 2 à 12, côté éveil et côté rêve | 1 (2 formes à prototyper) | Cases nettes sur fond de fumée | 5.5 |
| Tuiles de la piste | Percée, Représailles, Opportunisme, Cupidité | 4 genres, 11 cases | Genre reconnaissable sans lire | 5.6 |
| Machines | Grosse Gueule, Rapiat, Mâchoire, Tonton Débard, Ripaille, Zizanie (sixième, selon la table) ; 2 ou 3 organes chacune (moteur, chenilles, phares) ; surcouches Panne | 5 à 6 cartes + surcouches | Anatomie = mécanique ; organe neutralisé visible | 5.3 A |
| Plateau | 7 zones, 21 forêts, rivière ; cadastre sous la forêt | 1 | Lisibilité des jetons posés dessus | 5.5 |
| Jetons | Forêt (recto peint, verso souche et prix), présences, traces, Panne, lunes | une centaine | Reconnaissables à 15 mm | 5.6 |
| Peuples | Oiseaux, mammifères, reptiles, insectes, humains, entités | 6 cartes | Une silhouette forte par peuple | 5.4 |
| Personnages | Cartes à deux moitiés, aux couleurs des compartiments | quelques dizaines | Orientation lisible d'un coup d'œil | 5.4, 5.7 |
| Esprits | Tuiles et figures (dont Curupira, Iara, Boto, Mapinguari) | une dizaine | Étranges, pas mignons ; relecture culturelle | 5.3 C |
| Temps | Ciel de l'aube à la nuit (compteur de tours), lunes | 1 | Lisible du coin de l'œil | 5.5 |
| Icônes | 4 compartiments, actions, effets | 20 à 40 | Vectorielles, lisibles à 5 mm | 5.6 |
| Habillage | Dos de cartes, bordures, frises, emblème (samaúma et fumée), boîte, livret | – | Motifs denses aux bordures et aux dos seulement | 5.2 |

---

## 2. Principes fondateurs et engagements éthiques

### 2.1 Les trois piliers

**Pilier 1, respect du droit d'auteur (auteur)** : garantie de la provenance légale de tout actif utilisé (*datasets*, images de départ, textures) ; exclusion de tout scraping d'artistes vivants sans consentement.

**Révision.** Le pilier est juste dans son intention, mais il contredit l'infrastructure de la section 6 : les modèles de base prévus (SDXL, Flux) ont eux-mêmes été entraînés sur des milliards d'images collectées sur le web, dont des œuvres d'artistes vivants, sans leur consentement. Un LoRA entraîné sur un jeu de données irréprochable ne change pas cette origine : il s'ajoute au modèle, il ne le remplace pas. Promettre une provenance garantie « de tout actif » exposerait le projet à un reproche fondé. Trois engagements tenables à la place :
- **Ce que l'on fournit soi-même est propre** : images de départ, textures, jeux d'entraînement, références de style (domaine public vérifié, créations de l'auteur, licences explicites).
- **Aucun nom d'artiste vivant, aucune œuvre d'un tiers** dans les invites, les références de style (IP-Adapter et apparentés) ou les jeux d'entraînement.
- **Le modèle de base est un choix documenté**, et l'IA est placée là où elle pèse le moins sur l'image : au milieu de la chaîne, sur une composition humaine ou procédurale (section 3). Pour l'édition, examiner les modèles qui revendiquent un entraînement sur des données sous licence ou du domaine public, et vérifier leur licence d'usage commercial au moment du choix.

**Pilier 2, respect des créateurs et artistes (auteur)** : l'IA comme outil d'assistance à la concrétisation d'une vision personnelle, et non de spoliation d'identité artistique.

**Ajout.** Si une illustratrice ou un illustrateur est sollicité (brainstorm 4 bis), ses œuvres ne servent **jamais** de jeu d'entraînement ni de référence de style sans un accord écrit qui le prévoit. Le flux hybride et l'illustrateur se répartissent des pièces ; ils ne se recopient pas.

**Pilier 3, respect des peuples autochtones (auteur)** : prudence sur les motifs sacrés ou identitaires ; réinterprétation géométrique abstraite, hommage et stylisation poétique plutôt qu'appropriation de symboles réservés.

**Révision.** Le dossier vise lui-même deux sources sensibles : « les tissages et la marqueterie de perles » (1.3) et « les formes de vannerie » (5.2). Chez plusieurs peuples d'Amazonie, ces motifs géométriques (kené des Shipibo-Conibo, peintures corporelles, vannerie, perlage) portent une identité, un clan, un récit ou un chant. Une « réinterprétation géométrique abstraite » qui en reste reconnaissable demeure un emprunt, et la géométrie est justement ce qui se reconnaît. Règles proposées :
- **Les trames et frises sont inventées** à partir du lexique du jeu : nervures, plumes, écailles, empreintes, gouttes, engrenages, chiffres du cadastre, fumée. Ni vannerie, ni perlage, ni peinture corporelle comme point de départ.
- **Aucune invite, aucun jeu d'entraînement** ne vise le style d'un peuple.
- **Aucune planche ethnographique coloniale** pour représenter des personnes.
- **Toute inspiration autochtone assumée passe par une collaboration** rémunérée et créditée (brainstorm 2.3).
- **Relecture par des personnes concernées** avant toute diffusion pour les humains, les entités (Curupira, Iara, Boto, Mapinguari) et le tabac chamanique.

### 2.2 Ajout : transparence et protection
- **Tout est tracé** dans un registre de provenance (section 11) : source, licence, transformations ; pour l'IA, modèle, LoRA, invite, graine et réglages (ComfyUI les enregistre dans le PNG).
- **Déclaration** : plusieurs plateformes de financement participatif imposent de déclarer l'usage de l'IA générative (Kickstarter depuis 2023), et une partie du public des jeux de société y est hostile. Le registre rend la déclaration exacte et facile. Conditions à revérifier au moment de publier.
- **Protection** : en France comme aux États-Unis, une image n'est en principe protégée que par l'apport créatif humain qu'elle porte ; une sortie brute d'IA l'est mal ou pas. Plus la composition, le dessin, le collage et la retouche sont humains et documentés, mieux le matériel est protégé. À vérifier avec un juriste avant publication.

### 2.3 Ajout : trois contraintes absentes du dossier d'origine
- **Le jeu change** : tout visuel du prototype doit pouvoir être régénéré ou remplacé à partir des données des règles (5.7).
- **L'impression** : formats, résolution, fonds perdus, conversion CMJN (section 8).
- **L'écran** : le portage BGA envisagé impose une lisibilité en petit et des éléments séparables (section 8.4).

---

## 3. Analyse critique des pistes

Le tableau de l'auteur est conservé ; la colonne de droite est révisée ou complétée.

| Piste | Atouts | Risques et limites | Arbitrage (auteur, puis **révision**) |
|:---|:---|:---|:---|
| **IA, synthèse pure** | Rapidité, variété | Perte de contrôle de la composition, aspect générique, risque éthique | Stylisation contrôlée (ControlNet, img2img) ou prototypage rapide. **Révision** : jamais pour une pièce finale ; en recherche d'ambiance, vignettes jetables uniquement. Ajouter aux risques : cohérence difficile sur des dizaines de cartes, provenance des modèles, protection faible |
| **Domaine public** | Légalité, matières historiques | Imagerie coloniale, décalage avec le thème moderne | Base de textures, gravures, collages. **Révision** : « légalité totale » est trop fort. Le domaine public dépend de la date de décès de l'auteur (70 ans en France), et chaque bibliothèque numérique fixe ses conditions de réutilisation commerciale. Vérifier source par source (section 11) |
| **3D (Blender)** | Contrôle des perspectives et des volumes | Rendu natif froid | Structure des Machines et des décors. **Révision** : aussi le support du portrait à états (5.3 B) et du portage BGA ; exporter plusieurs passes (profondeur, contours, normales) et pas seulement la profondeur |
| **LoRA** | Style propre et cohérent | Jeu de données propre et cohérent nécessaire | Micro-LoRA sur le domaine public et les créations de l'auteur. **Révision** : un LoRA par écriture (forêt, Méchant), pas un par pièce ; 20 à 60 images cohérentes chacun ; vigilance sur le corpus « naïf » du domaine public (6.1) |
| **Collages scannés** | Matière, imperfection, « fait main » | Chronophage seul | Matière première de texture et d'assemblage. **Révision** : aussi la meilleure source des jeux d'entraînement des LoRA, et le meilleur gage de protection |
| **Ajout : génératif non-IA** (code) | Contrôle total, aucune question de provenance, régénérable | Abstrait seulement | Fumée, frises, trames, ciel, cadastre, plateau, bordures, icônes |
| **Ajout : illustrateur** | Qualité, cohérence, accueil du public, protection | Coût, calendrier | Voie de l'édition, au moins pour le rêve et les peuples (brainstorm 4 ter) |

**Ajout : principe directeur du flux.** *La composition est humaine ou procédurale ; la matière peut être assistée.* L'IA intervient au milieu de la chaîne (fusion, unification, variations), jamais au début (inventer l'image) ni à la fin (sans retouche humaine). C'est déjà l'esprit des flux de l'auteur : la révision en fait une règle.

---

## 4. Légende des niveaux d'intervention

Légende de l'auteur, conservée :

- 🛠️ **[DEV]** : développements informatiques (scripts, API, workflows ComfyUI, environnement).
- 🎨 **[MAN-PHYS]** : créations manuelles physiques (collages, découpages, peinture, scans).
- 🖱️ **[MAN-NUM]** : créations numériques manuelles (assemblage 2D, vectoriel sous Inkscape, Krita, GIMP).
- 🏛️ **[CURATION]** : recherche et sélection de matières existantes (domaine public, textures libres).
- 📐 **[3D-SYNTH]** : modélisation et rendu sous Blender.
- 🤖 **[IA-SYNTH]** : génération ou stylisation par IA (Stable Diffusion, ControlNet, LoRA).
- 🔄 **[TRANSFO-NUM]** : transformations numériques (vectorisation, filtres, détourage, retouches).
- 🧠 **[AGENTIC]** : assistance par LLM (Claude, Gemini, par script ou interface).

**Ajout** :
- ⚙️ **[PROC]** : génération procédurale par code, sans IA (SVG, bruit, simulation). Elle était rangée sous [AGENTIC] dans le flux 2 ; or c'est le code qui produit l'image, pas l'agent qui l'écrit.
- ✅ **[CONTRÔLE]** : vérification humaine obligatoire avant l'étape suivante.

---

## 5. Pipeline de production par type d'illustration

### 5.0 Ajout : étapes communes, avant toute pièce
1. 🖱️✅ **Bible graphique** (une à deux pages) : palettes des écritures et du rêve (valeurs RVB et CMJN), épaisseurs de trait, typographies, règles de dosage des motifs, règles de ton (brainstorm 4, cinq règles). Elle sert de référence à tous les contrôles, humains et automatiques.
2. 🛠️ **Gabarits** : formats des cartes, tuiles, jetons et plateau, avec fonds perdus et zones sûres (section 8).
3. 🛠️ **Nomenclature et registre de provenance** (sections 10 et 11), créés avant la première image.
4. 🎨🏛️ **Banque de matières** : papiers, encres, gouaches, écorces, feuilles, fumées photographiées, gravures vérifiées, numérisées à 600 ppp.
5. 🎨🤖✅ **LoRA** (si retenus) : jeux d'entraînement légendés, entraînement court ; test sur des sujets absents du jeu d'entraînement, pour vérifier qu'il généralise sans recopier.

### 5.1 Flux 1 : fonds et décors d'ambiance (forêts, chantiers)

```
[3D-SYNTH] Maquette Blender (perspective) ─┐
                                           ├──> [IA-SYNTH] SD + ControlNet + LoRA ──> [MAN-NUM] Retouches
[MAN-PHYS] Scans de textures papier/encre ─┘
```

Étapes de l'auteur :
1. 📐 **Blocage spatial** : scène Blender très simple (cubes pour les zones de déforestation, cônes et cylindres pour la forêt), caméra de jeu placée.
2. 🔄 **Export des guides** : carte de profondeur et contours *Freestyle*.
3. 🎨 **Textures d'ambiance** : fonds à l'encre, à la gouache, papiers froissés ou découpés, numérisés en haute résolution.
4. 🤖 **Fusion et stylisation** dans ComfyUI : profondeur par ControlNet ; scan de texture en image de départ (img2img, débruitage 0,4 à 0,55) ; LoRA « Peinture naïve ».
5. 🖱️ **Finalisation** sous Krita : les zones de cartes restent lisibles et non saturées.

**Révision de l'étape 4 (le point technique principal).** Avec un scan de texture plat en image de départ et un débruitage de 0,4 à 0,55, l'image de départ fixe déjà l'essentiel des grandes masses et des valeurs : la profondeur de la scène 3D aura du mal à s'imposer, et l'on obtiendra une texture vaguement structurée plutôt qu'une forêt en perspective. Deux corrections possibles :
- **(recommandé) Composer avant l'IA** : dans Blender, plaquer les scans sur les primitives (papier vert sur les cônes, papier ocre au sol, encre sur le ciel), puis rendre une **passe couleur**. Cette image, qui porte à la fois la perspective et la matière, devient l'image de départ ; le débruitage de 0,35 à 0,55 convient alors, guidé par ControlNet profondeur et contours (*Freestyle* → ControlNet *lineart* ou *canny*). Bonus : le résultat ressemble à un collage en relief, ce qui sert la piste « collage » du brainstorm.
- *(alternative)* Générer d'abord depuis la profondeur seule (débruitage élevé), puis appliquer les textures scannées par-dessus, en mode de fusion, dans Krita.

**Révision de l'étape 1.** Remplacer les cubes et les cônes par des **cartes alpha** (plans portant des silhouettes de feuillage découpées dans le papier scanné) dès que la composition est fixée : la forêt amazonienne est faite d'étages et de feuilles, pas de volumes pleins ; et la brume volumétrique de Blender donne la profondeur atmosphérique.

**Ajouts.**
- Réserver dès le blocage la **zone calme** où se poseront le texte et les jetons, en la marquant dans la scène (un plan neutre), plutôt que de la nettoyer après.
- **Les chantiers** restent sobres (brainstorm 4, règle 3, « la perte n'est jamais drôle ») : souches, terre nue, silence, plutôt qu'engins en action.
- 🔄 **Agrandissement par tuiles** jusqu'à la résolution d'impression (section 8.1) ; 🖱️ harmonisation sur la palette de la bible ; ✅ test sur carte complète (texte et icônes posés), à taille réelle et en petit.

### 5.2 Flux 2 : motifs répétitifs et trames (volutes, frises, bordures)

```
[PROC] Code SVG de trames ──┐
                            ├──> [MAN-NUM] Assemblage Inkscape ──> [TRANSFO-NUM] Vectorisation & export
[MAN-PHYS] Encre de Chine ──┘
```

Étapes de l'auteur :
1. 🧠🛠️ **Génération procédurale** : scripts Python/SVG écrits avec l'aide d'un LLM, créant des trames géométriques symétriques « inspirées des formes de vannerie ».
2. 🎨 **Tracés organiques** : volutes de fumée et courbes à l'encre de Chine, puis scan.
3. 🔄 **Vectorisation** : `potrace` ou Inkscape.
4. 🖱️ **Compositing vectoriel** : assemblage des motifs du code et des volutes manuelles en bordures et modules SVG.

**Révision de l'étape 1.** Remplacer « inspirées des formes de vannerie » par un **vocabulaire de motifs propre au jeu** (2.1, pilier 3). Proposition de départ, une famille par monde :
- **forêt** : nervures, plumes, écailles, gouttes, empreintes de pattes (qui rejoignent les « traces » du conseil, brainstorm 3H) ;
- **Méchant** : engrenages, rivets, chenilles, quadrillage du cadastre, chiffres et pointillés de coupe ;
- **rêve** : volutes, spirales de fumée, constellations de points lumineux.

Le code (étiquette [PROC]) doit produire des **tuiles sans couture** et des bordures paramétrées (couleur et icône du compartiment), pour que les cartes à deux moitiés se fabriquent automatiquement (5.7).

**Ajouts.**
- La **fumée** a deux états (brainstorm 3C) : grise, nette et géométrique côté éveil ; bleue et défaite en volutes côté rêve. L'encre de Chine convient au premier ; pour le second, photographier de la fumée réelle sur fond noir (encens) et la détourer, ou la simuler par code (champ de bruit, advection).
- `potrace` produit des courbes très denses : simplifier les chemins avant l'export, sinon les SVG deviennent lourds pour l'impression et pour BGA.
- ✅ Les motifs n'entrent jamais dans une zone de lecture (texte, case, jeton).

### 5.3 Flux 3 : sujets, personnages, animaux et engins

#### A. Les Machines

Étapes de l'auteur :
1. 📐 **Grayboxing animalier** : machine aux proportions de prédateur (par exemple une excavatrice en mante religieuse).
2. 🏛️ **Matières industrielles** : photos de rouille et de métal du domaine public.
3. 🤖 **Rendu stylisé** : ControlNet profondeur + LoRA « Surréalisme naïf », pour une peinture menaçante mais poétique.

**Révision.**
- L'idée de l'animal-prédateur rejoint exactement la proposition « l'anatomie est la mécanique » du brainstorm (3D) : **phares = yeux, chenilles = pattes, moteur = ventre**, la lame ou le godet comme gueule. Pas d'yeux dans le pare-brise (écarté : *Cars*).
- **Un animal par Machine, tiré de son nom et de sa devise** : Grosse Gueule (bulldozer, « pousse d'abord, réfléchit jamais »), un hippopotame ou un sanglier ; Mâchoire (pelleteuse), la mante ou le crocodile ; Rapiat (abatteuse), un insecte xylophage ; Tonton Débard (débardeur), un scarabée bousier ; Ripaille, un glouton ; Zizanie, à définir. *Pistes de Claude, à valider.*
- **Une famille** : même pose de trois quarts, même focale et même éclairage pour toutes ; la teinte commune (jaune délavé taché d'huile) et le **monogramme du Méchant** sont posés **après** l'IA, à la main ou par calque, pour être identiques partout. L'IA ne reproduit jamais deux fois le même logo.
- **Matières** : des photos personnelles de rouille et d'engins (une casse, un chantier) sont plus simples à documenter que des photos « du domaine public », rares pour ce sujet ; à défaut, des banques de textures sous licence CC0.
- **Nom du LoRA** : « Surréalisme naïf » ici, « Peinture naïve » en 5.1. Si les deux écritures sont retenues, ce sera le LoRA « Méchant ». Sinon, un seul LoRA pour tout, sous un seul nom.
- **Ton** : « menaçante mais poétique » convient ; le brainstorm ajoute **grotesque et vorace**, des bêtes d'acier plutôt que des peluches (règle 2 : satire, pas gag).

**Ajouts.**
- 📐 Rendre les passes **profondeur, contours et normales** : la profondeur seule laisse l'IA inventer les détails mécaniques.
- 🖱️ **Surcouches Panne** par organe (œil bandé, patte cassée, ventre qui tousse noir), en calques transparents calés sur chaque carte ; variantes des gestes des peuples (Machine renversée, essaim dans le ventre, phares qui louchent).
- ✅ Les Machines côte à côte : une famille, cinq ou six caractères ; l'organe neutralisé se voit à un mètre.

#### B. Le Méchant (portrait)

Étapes de l'auteur :
1. 🏛️ **Recherche iconographique** : portraits gravés du XIXe siècle, du domaine public.
2. 🖱️ **Photobashing, collage numérique** : assemblage du visage, proportions naïves, formes géométriques pour le costume.
3. 🤖 **Unification picturale** : img2img léger (débruitage d'environ 0,35) pour fondre les raccords et uniformiser la texture.

**Révision : deux problèmes et une exigence manquante.**
1. **Le visage d'une personne réelle.** Un portrait gravé du XIXe représente presque toujours une personne identifiable (notable, industriel, homme politique). En faire le visage du « Méchant » attribue la cupidité à cette personne, et ce visage reste reconnaissable par un descendant ou un historien. Le brainstorm l'exclut déjà (« sans visage de personne réelle identifiable »). Correction : **composer le visage à partir de fragments de plusieurs sources** (ici un œil, là une moustache, ailleurs une oreille), aucun fragment ne portant l'identité, ou le dessiner à la main d'après une silhouette de caricature. Les gravures servent pour le **costume** (lin blanc, panama, chaîne de montre) et pour la **texture du trait**, ce qui correspond bien à l'ancrage « baron du caoutchouc » du brainstorm (3B).
2. **Le codage ethnique** (brainstorm 2.1) : la cupidité se lit dans le costume et les attributs (or, bagues, cigare, montre), pas dans les traits du visage.
3. **Exigence manquante : le portrait à états.** Le jeu demande le même visage sous cinq ou six expressions (calcule, ricane, fulmine, somnole, dort, ébloui ; brainstorm 3F), qui racontent l'arc de la partie, de la morgue au sommeil. Un img2img lancé séparément sur six collages donnera six visages légèrement différents. Méthode proposée :
   - 🖱️ un **collage maître** unique, en calques séparés (paupières, sourcils, bouche, joues, cigare, fumée) ;
   - 🖱️ les expressions obtenues en **déformant ces calques** (marionnette à la Terry Gilliam), pas en refaisant le collage ;
   - 🤖 l'unification img2img passe sur les six états avec **la même graine et les mêmes réglages**, avec ControlNet contours pour verrouiller le trait ;
   - 🖱️✅ retouche finale des yeux et de la bouche à la main, puis les six états côte à côte.
   *Alternative* : une tête modélisée et riguée dans Blender, si la piste 3D l'emporte pour le Méchant.
4. **Le registre.** Le dossier d'origine applique les « proportions naïves » au Méchant ; le brainstorm propose une **caricature satirique modelée** (Daumier, Searle) pour son monde. C'est à trancher (question 1 de la section 14). Le collage de gravures sert d'ailleurs très bien la satire.

**Ajout.** Les calques séparés servent aussi sur table (un portrait à paupières mobiles) et pour l'animation sur BGA. *Alternative en réserve* : le Méchant sans visage (mains, bord du chapeau, ombre ; brainstorm 3K), qui réduit ce flux à des mains et des accessoires.

#### C. Esprits et faune

Étapes de l'auteur :
1. 🖱️ **Formes naïves** : silhouettes hybrides simples dans Inkscape (par exemple un oiseau et des motifs d'eau).
2. 🎨 **Aplats de texture** : feuilles, écorce, papier de soie numérisés.
3. 🤖 **Passage LoRA** : style naïf, « aspect d'une gouache authentique ».

**Révision.**
- Le flux est bon pour les **esprits** : des hybrides étranges, construits en silhouettes, conviennent au registre du rêve (palette bleu nuit, points lumineux).
- Pour la **faune des peuples**, ajouter une étape 🏛️ de **documentation anatomique** (planches naturalistes du domaine public : Merian pour le Surinam, Gould, Haeckel ; Biodiversity Heritage Library) : on stylise mieux ce qu'on a observé. La planche sert de référence, pas d'image finale.
- **« Gouache authentique »** : préférer « aspect gouache ». L'image n'est pas une gouache, et si le prototype circule, le registre de provenance doit pouvoir le dire sans gêne. Mieux encore : faire entrer de **vraies gouaches de l'auteur** dans le jeu d'entraînement du LoRA « forêt ».
- **Ton** (brainstorm 4, règle 4) : des animaux dessinés comme des animaux, avec une présence et de la dignité ; pas d'anthropomorphisme à la *Rio* ; des esprits étranges, pas mignons.
- ✅ **Relecture culturelle** pour les entités tirées des traditions amazoniennes (Curupira aux pieds retournés, Iara, Boto, Mapinguari) et pour les humains, avant toute diffusion.

### 5.4 Ajout : peuples et personnages
1. 🖱️ **Une silhouette forte par peuple**, testée en noir plein à 10 mm (oiseaux, mammifères, reptiles, insectes, humains, entités).
2. 🎨🤖 **Peinture plate** (papier découpé ou gouache de l'auteur, unifiée si besoin par le LoRA « forêt »).
3. 🛠️ **Cartes à deux moitiés** : chaque moitié prend la couleur et l'icône de son compartiment (brainstorm 3I) ; montage automatique par les données (5.7).
4. ✅ Relecture culturelle pour les humains.

*Note* : c'est la famille où un illustrateur apporterait le plus à l'édition. Pour le prototype, des silhouettes propres suffisent.

### 5.5 Ajout : plateau, piste des pensées et ciel
1. ⚙️ **Plan généré depuis les données du moteur** (7 zones, 21 emplacements de forêt, rivière, flèches de passage) : un SVG exact, régénéré si les règles changent.
2. ⚙️ **Couche « cadastre »** sous la forêt : parcelles numérotées, prix, pointillés de coupe, en gravure grise (brainstorm 3E). Un jeton Forêt retiré révèle la souche et le prix.
3. 🎨🤖 **Couche « forêt »** peinte zone par zone (flux 5.1), découpée selon le plan.
4. ⚙️🎨 **Piste des pensées** : ruban de fumée (5.2) avec des cases vectorielles nettes posées par-dessus ; **deux formes à prototyper** (arc au-dessus du portrait, bande droite sous le portrait).
5. ⚙️ **Ciel compteur de tours** : dégradé de l'aube à la nuit, places des lunes (brainstorm 3G).
6. ✅ Essai sur table avec tous les jetons posés, et en capture réduite.

### 5.6 Ajout : jetons, tuiles et icônes
1. 🖱️ **Icônes** en vectoriel monochrome, dessinées sur une grille commune ; une icône **et** une couleur par compartiment, jamais la couleur seule.
2. 🖱️⚙️ **Tuiles de la piste** (Percée, Représailles, Opportunisme, Cupidité) : un pictogramme et une couleur par genre, lisibles sans texte.
3. 🖱️ **Jetons** : Forêt (recto peint, verso souche et prix), présences, traces (empreintes, plumes, écailles, fourmis, motifs, pieds retournés ; brainstorm 3H), Panne, lunes.
4. ✅ Reconnaissance à 15 mm et à un mètre ; test au simulateur de daltonisme.

### 5.7 Ajout : cartes montées automatiquement à partir des données
Le moteur décrit déjà le plateau, les Machines et leurs organes, les tuiles de la piste et les réglages dans ses fichiers de maquette (`maquettes/*.json`). Les cartes du prototype doivent en sortir **automatiquement**, pour suivre les versions du jeu sans travail manuel :
1. 🛠️ Un script lit les données (nom, compartiments, moitiés, effets) et remplit des **gabarits SVG** ; sorties : planches PDF à imprimer (A4 ou A3, traits de coupe) et PNG pour l'écran.
2. 🛠️ Les illustrations sont appelées par leur **identifiant de nomenclature**. Une illustration manquante est remplacée par un **marqueur visible** (silhouette grise et identifiant), jamais par une image au hasard.
3. 🛠️🧠 Contrôles automatiques : texte qui déborde, icône manquante, contraste insuffisant dans la zone de texte.
4. ✅ Impression d'une planche de contrôle à chaque version du jeu.

*Choix technique de Claude (consigné au journal des décisions, 7 bis)* : Python et SVG, cohérents avec le moteur et les maquettes HTML existantes ; export par Inkscape en ligne de commande.

### 5.8 Ajout : assemblage final et exports
1. 🖱️ **Fichiers source en calques** conservés (illustration, cadre, icônes, texte), jamais seulement l'export aplati.
2. 🔄 **Deux exports** : impression (CMJN, fonds perdus, PDF/X selon l'imprimeur) et écran (RVB, sprites et calques séparés pour BGA).
3. ✅ **Épreuve écran** avec le profil CMJN de l'imprimeur, puis **épreuve papier**.

---

## 6. Infrastructure technique et automatisation agentique

```
┌──────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE TECHNIQUE                       │
├──────────────────────────────────────────────────────────────────┤
│ 🛠️ [DEV]   Environnement local : SDXL / ComfyUI / Python, Blender │
│ 🛠️ [DEV]   Automatisation par l'API de ComfyUI (workflows JSON)   │
│ 🛠️ [DEV]   Montage des cartes par les données (SVG → PDF, PNG)    │
│ ⚙️ [PROC]  Contrôles mesurables : palette, contraste, netteté     │
│ 🧠 [AGENT] LLM : invites, code SVG et bpy                         │
│ 🧠 [AGENT] Multimodal : tri et pré-contrôle, jamais validation    │
│ ✅          Validation humaine et registre de provenance           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.1 Développements et infrastructure 🛠️

Points de l'auteur : ComfyUI avec SDXL ou Flux ; entraînement d'un LoRA de style sur un jeu de données éthique (peintures naïves du domaine public et créations de l'auteur) ; scripts Python pilotant l'API de ComfyUI pour des traitements par lots.

**Révision.**
- **Licences des modèles.** Celle de SDXL autorise l'usage commercial des images sous conditions d'usage ; celle de **Flux.1 [dev] est non commerciale par défaut**, l'éditeur proposant une licence commerciale payante. Pour un prototype, c'est sans conséquence ; pour l'édition, c'est une dépense ou un changement de modèle. À vérifier au moment du choix.
- **« Peintures naïves du domaine public » : le corpus est étroit et biaisé.** La peinture populaire naïve brésilienne date surtout du XXe siècle et reste protégée. Ce qui est réellement libre est surtout européen : Henri Rousseau (mort en 1910), dont les jungles sont célèbres, mais imaginées sans voyage, depuis le Jardin des plantes, donc un exotisme de regard extérieur ; Séraphine Louis ; Niko Pirosmani. Un LoRA nourri surtout de Rousseau produira du « Rousseau », reconnaissable et chargé de ce regard. Recommandation : **une majorité de créations de l'auteur** (au moins les deux tiers), le domaine public en appoint, sans dominante d'un seul peintre. En droit de l'Union, les reproductions fidèles d'œuvres d'art en deux dimensions tombées dans le domaine public ne créent pas de nouveaux droits ; les conditions des musées et des bibliothèques restent à lire.
- **Matériel** : une carte graphique d'environ 8 Go de mémoire vidéo suffit pour SDXL avec ControlNet ; l'entraînement de LoRA et Flux demandent davantage. Sinon, la location de calcul en ligne est une **dépense**, soumise à l'accord de l'auteur.
- **Reproductibilité** : chaque workflow ComfyUI est versionné (JSON), et le script de lots écrit la ligne correspondante du registre de provenance (modèle, LoRA, invite, graine, réglages, fichiers d'entrée) pour chaque image produite.

### 6.2 Intégration des agents IA 🧠

Trois agents dans le dossier de l'auteur : le **rédacteur d'invites**, le **développeur de code** (SVG, `bpy`) et le **directeur artistique virtuel** (multimodal) qui valide les images ou renvoie des paramètres ajustés au script.

**Révision.**
1. **Rédacteur d'invites** : utile, surtout s'il lit les **données du jeu** (nom de la carte, peuple, compartiment, devise de la Machine) plutôt qu'un concept libre ; il ne doit jamais citer d'artiste (2.1). Les invites produites sont gardées au registre.
2. **Développeur de code** : le meilleur usage des LLM dans ce flux (trames, plateau, gabarits, scripts Blender). Le code est relu et versionné comme le moteur.
3. **Directeur artistique virtuel : à recadrer en « tri et pré-contrôle ».**
   - **La palette et la lisibilité se mesurent mieux par le code** que par un modèle multimodal : écart de couleur entre l'image et la palette de la bible (ΔE), contraste dans la zone de texte, densité de détails dans la zone calme, netteté. Ces contrôles sont exacts, gratuits et reproductibles. → étiquette ⚙️.
   - **Le multimodal** sert à ce que le code ne voit pas : artefacts (mains, membres en trop, texte parasite), respect grossier du sujet, tri d'un lot en trois tas (rejeté, à revoir, prometteur). Les modèles multimodaux jugent mal la finesse esthétique et la cohérence de série : la **validation reste humaine**.
   - **La boucle automatique** (« réduire le débruitage de 0,10 ») a besoin de garde-fous : nombre d'essais plafonné par image, paramètres bornés, arrêt et signalement plutôt que dérive. Sans eux, elle optimise le juge, pas l'image, et elle consomme des appels payants.
   - Les **noms de modèles** cités (Gemini 1.5 Pro, Claude 3.5 Sonnet) sont dépassés : parler de « modèle multimodal récent » et figer le choix au moment de l'installation.
   - L'usage par API demande une **clé et un budget** : c'est l'auteur qui saisit la clé et fixe le plafond de dépense.

---

## 7. Synthèse du workflow global

Le schéma de l'auteur, complété (les étapes ajoutées sont en italique) :

1. **Idéation et bible graphique** [AGENTIC, MAN-NUM] : la bible est écrite et validée par l'auteur ; le LLM aide à la rédiger, pas à la décider.
2. ***Nomenclature, gabarits, registre de provenance*** [DEV].
3. **Production des squelettes et des formes** [3D-SYNTH, MAN-PHYS, MAN-NUM, CURATION, *PROC*].
4. **Génération et unification stylistique** [IA-SYNTH, DEV].
5. **Contrôle qualité et ajustements** [*PROC* mesurable, AGENTIC en tri, MAN-NUM ; *validation humaine*].
6. ***Relecture culturelle*** (pièces concernées).
7. ***Montage des cartes par les données*** [DEV].
8. ***Épreuves (écran, papier) et test sur table*** ; retours des testeurs.
9. **Export du matériel de jeu** (impression et écran).

*Révision de forme* : le schéma d'origine était écrit en formules LaTeX, qui ne s'affichent pas dans tous les lecteurs Markdown ; il est remplacé par une liste numérotée.

---

## 8. Ajout : contraintes techniques

### 8.1 Impression
- **Résolution** : 300 ppp à la taille finale (600 ppp pour les traits fins et le texte en image ; le texte reste vectoriel autant que possible).
- **Formats** : carte 63 × 88 mm ; fonds perdus de 3 mm par côté ; zone sûre de 3 à 4 mm à l'intérieur de la coupe. Une carte avec fonds perdus mesure 69 × 94 mm, soit environ 815 × 1 110 px à 300 ppp : la sortie native de SDXL suffit. Un plateau de 50 × 50 cm demande environ 5 900 px de côté : **agrandissement par tuiles** indispensable pour les fonds générés, ou plateau vectoriel (5.5).
- **Couleur** : les verts profonds, les bleus nuit et les violets lumineux du rêve sont souvent **hors du gamut CMJN** et ternissent à l'impression. Travailler en RVB, mais faire l'épreuve écran avec le profil de l'imprimeur (souvent un profil FOGRA en Europe, à lui demander) dès les premières pièces, pas à la fin.
- **Petits éléments** : traits d'au moins 0,25 pt ; texte d'au moins 6 à 7 pt ; icônes lisibles à 5 mm.

### 8.2 Lisibilité et accessibilité
- Les compartiments ne se lisent **jamais par la couleur seule** : couleur et icône. Vérifier au simulateur de daltonisme (le vert de la forêt et le rouge terre se confondent en deutéranopie et en protanopie).
- Test « à un mètre » : chaque jeton et chaque Machine se reconnaissent depuis la place d'un joueur.

### 8.3 Logiciels
ComfyUI, Blender, Krita, GIMP, Inkscape (et `potrace`), Scribus pour la mise en page d'impression ; Python pour les scripts.

### 8.4 Écran (BGA)
Calques séparés (portrait et paupières, Machines et surcouches, jetons) ; icônes vectorielles ; essai à la taille réelle d'un téléphone.

---

## 9. Ajout : où ranger les fichiers

Le dépôt `Projet_Jeu` est **public**. Y verser des illustrations reviendrait à les publier, ce qui demande l'accord de l'auteur.
- **Dans le dépôt public** : ce dossier, la bible graphique, la nomenclature, les scripts (montage des cartes, génération procédurale, automatisation de ComfyUI), les gabarits vides.
- **Hors du dépôt public** (dépôt privé, ou stockage local sauvegardé) : matières numérisées, jeux d'entraînement, LoRA, rendus, sources en calques, fichiers d'impression. Les fichiers lourds y passent par Git LFS ou un stockage dédié.

*Choix technique de Claude, consigné au journal des décisions (7 bis)* : aucune image du jeu dans le dépôt public sans décision de l'auteur.

## 10. Ajout : nomenclature des pièces
Un tableau unique, mis à jour à chaque version du jeu : identifiant (`MCH-grosse-gueule`, `PEU-oiseaux`, `JET-foret-recto`…), famille, format, quantité, flux, statut (*marqueur*, *prototype*, *validé*, *final*), version du jeu concernée, fichier source. Le montage des cartes (5.7) s'y réfère ; une pièce qui disparaît des règles y apparaît comme orpheline.

## 11. Ajout : registre de provenance
Pour chaque actif (matière, image de départ, sortie d'IA, pièce assemblée) :
- identifiant ;
- origine : création de l'auteur, domaine public, licence, IA ;
- pour une source externe : auteur, date de décès, institution, URL, licence et conditions de réutilisation commerciale, date de consultation ;
- pour l'IA : modèle de base et sa licence, LoRA, invite, graine, réglages ;
- transformations humaines ;
- relecture culturelle : faite, à faire, sans objet.

*Vigilance sur les sources* : certaines institutions publient leurs collections en CC0 (Rijksmuseum, Metropolitan Museum, Smithsonian) ; d'autres soumettent la réutilisation commerciale à des conditions ou à une redevance, selon les fonds ; Wikimedia Commons se vérifie fichier par fichier.

## 12. Ajout : contrôle qualité
Avant qu'une pièce passe au statut *validé* :
1. conforme à la bible (palette, trait, écriture du bon monde) ;
2. lisible : imprimée à taille réelle, à un mètre, en capture réduite, au simulateur de daltonisme ;
3. ton juste : satire pour le Méchant, gravité pour la forêt, la perte jamais drôle ;
4. provenance complète au registre ;
5. relecture culturelle faite, si la pièce l'exige ;
6. cohérente avec sa série, posée à côté des autres pièces de sa famille.

## 13. Ajout : phasage, aligné sur le plan vers la V1

| Moment du jeu | Visuels | Coût |
|---|---|---|
| **Maintenant** (cycle 2, V0.4 → V0.5) | Bible graphique ; gabarits ; nomenclature et registre ; montage des cartes par les données, avec marqueurs ; plateau généré depuis les données ; vocabulaire de motifs en code | Temps de développement seulement |
| **Cycle 3** (V0.5 → V0.6) | Installation de ComfyUI ; premiers LoRA ; essais de style sur une pièce par famille : Méchant (deux expressions), une Machine, une carte personnage à deux moitiés, une tuile Esprit, une zone de plateau, les deux formes de la piste | Matériel éventuel (dépense) |
| **V1.0** (tests humains) | Prototype complet, lisible, explicitement provisoire ; retours des testeurs sur la lisibilité | Impression des prototypes (dépense) |
| **Après la V1.0** | Décision d'édition : part du flux hybride, illustrateur(s), relecture culturelle, cadre juridique | À chiffrer |

L'essai sur trois pièces proposé à une illustratrice (brainstorm 4 bis) trouve sa place au cycle 3, si cette piste est suivie.

---

## 14. Questions pour l'auteur (avec la recommandation de Claude)
1. **Une écriture ou deux ?** Style naïf unique (dossier d'origine) ou deux écritures, naïf pour la forêt et satire modelée pour le Méchant (brainstorm 3A) ? *Recommandation : deux écritures, donc deux LoRA.*
2. **Le visage du Méchant** : collage de fragments sans identité, ou dessin d'après une silhouette de caricature ? *Recommandation : collage de fragments, gravures réservées au costume et au trait.*
3. **Le corpus des LoRA** : l'auteur peut-il produire 20 à 60 créations par écriture (gouaches, collages, encres) ? *Recommandation : au moins deux tiers de créations propres ; sinon, pas de LoRA et davantage de collage et de code.*
4. **Le directeur artistique virtuel** : tri et pré-contrôle seulement, avec des contrôles mesurables par le code ? *Recommandation : oui ; validation toujours humaine.*
5. **Le rangement** : dépôt privé séparé ou stockage local ? *Recommandation : dépôt privé séparé.*
6. **Le matériel** : une carte graphique est-elle disponible, ou faudra-t-il louer du calcul ? *Recommandation : décider au cycle 3, rien n'est nécessaire avant.*

## Historique
- 14 oct. 2026, 13 h 22 : première version de l'auteur, tronquée à la section 5.1 ; une première révision de Claude a été faite sur cette base.
- 14 oct. 2026, 13 h 35 : version complète de l'auteur (sections 1 à 7), archivée dans `claude/archive/`.
- 14 oct. 2026, après-midi : révision de Claude sur la version complète. Pilier 1 corrigé, pilier 3 précisé (vannerie, perlage), flux 5.1 corrigé (composer avant l'IA), portrait à états et visage du Méchant (5.3 B), Machines alignées sur le brainstorm, flux ajoutés (5.4 à 5.8), licences et corpus des LoRA, agents recadrés, contraintes, rangement, nomenclature, registre, contrôle qualité, phasage, questions.
