# Modèle « Couronne aux deux pistes », étude 3 : évaluation structurelle (Campagne 3)

*16 oct. 2026, 23 h 27. Campagne 3 du modèle d'étude (`maquettes-numeriques/pistes/`, proposition `projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md`). Outil : `maquettes-numeriques/pistes/campagne.js`, plan `campagnes/pistes_campagne3.json` (21 variantes × 24 parties appariées × 11 bots, plus tests $T_1$ et $T_4$). Résultats complets : `resultats/pistes/pistes_campagne3_synthese.json`, `resultats/pistes/pistes_campagne3_rapport.md` et tableau de bord interactif `maquettes-numeriques/pistes/laboratoire.html`.*

## En bref

1. **Sans présage, programmer 2 étapes à l'aveugle sur les seules pistes brouille trop le second ordre (`J3_base` : score 0,00).** Le taux de parade tombe à 29,3 %, 10,4 % des ordres sont perdus en route, et une heuristique immédiate (`Réflexe`, 30,4 %) fait aussi bien que le bot `Prévoyant` (Profondeur = −1,0 🔴, Plan à 2 étapes = +1,6 pt).
2. **Avec le Présage sur la Vague 1 (`presage=true`), les deux étapes prennent tout leur sens (`J3_presage` : score 0,77, en tête).** Connaître les dés de la Vague 1 (tout en lisant la Vague 2 sur les pistes après apprentissage) fait passer :
   - le **taux de parade** de 29,3 % à **42,2 % 🟢** (et 40,6 % à 4 joueurs) ;
   - la **Lecture** (contre la meilleure boucle) de 4,0 🟠 à **16,8 pts 🟢** ;
   - la **Profondeur** (`Prévoyant − Réflexe`) de −1,0 🔴 à **+8,0 pts 🟢** (+9,8 pts à 4 joueurs, +11,9 pts à 6 joueurs) ;
   - l'**Information** (lire les pistes vs pistes uniformes) de 4,0 🟠 à **+14,6 pts 🟢** ;
   - le **gain du Plan à 2 étapes** (`Prévoyant − Myope`) de +1,6 pt à **+9,7 pts** ;
   - les **ordres perdus** de 10,4 % à **2,8 %**.
3. **Deux étapes par tour sauvent le déplacement par rapport à une seule étape (`J3_1ordre_8tours`).** Avec 1 seul ordre par tour sur les pistes, se déplacer coûte toute l'action du tour : le gain du `Placement` tombe à **0,0 pt 🔴** (0 % de décisions où se placer l'emporte dans $T_4$). Avec 2 étapes et le présage, le combo *Aller + Garder/Saboter* redonne un rôle au déplacement (Placement à 3,3 pts à 3 joueurs et 7,3 pts à 6 joueurs ; 15 à 23 % de situations favorables au déplacement dans $T_4$).
4. **L'apprentissage des deux pistes pèse fortement (mesuré : −9,2 points de parade).** Sans apprentissage (`J3_sans_apprentissage`), le taux de parade remonte de 29,3 % à 38,5 %. En moyenne, le Méchant effectue **51 échanges de tuiles par partie** à 3 joueurs.
5. **Le rythme d'apprentissage `vague` est plus lisible que `lancer` quand on joue sans présage.** Attendre la fin de la vague pour échanger les tuiles (`J3_rythme_vague`) fait passer le taux de parade de 29,3 % à 33,3 %, la Maîtrise de 1,7 à **5,0 pts 🟢** et le Plan à 2 étapes de 1,6 à **6,1 pts**.
6. **Le garde-fou des boucles (`C1`) révèle pourquoi le Sabotage fort doit exiger une Synergie (Palier 1) :**
   - Dans la variante `J3_sabotage_fige` (où une Machine sabotée reste sur place au lieu de s'échapper), la boucle aveugle **`marquage`** (s'asseoir sur une Machine et la saboter en boucle sans lire les pistes) monte à **38,4 % de parades**, presque à égalité avec le bot fort (39,9 %, Lecture = 1,6 🔴) !
   - De plus, le **Couplage inter-tuiles** reste faible dans toutes les variantes actuelles (**1,4 % à 14,3 %**).
   - **Conclusion pour le Palier 1 :** un joueur seul ne doit pas pouvoir figer une Machine en boucle ; en revanche, réserver l'effet fort du sabotage (neutralisation / mise hors service / renvoi au chantier) à une **action coordonnée à deux (Synergie / Alliance)** empêchera la boucle solitaire `marquage` tout en forçant les joueurs à se regrouper entre tuiles voisines (augmentant mécaniquement le couplage).

---

## Tableau récapitulatif des variantes clés (24 parties appariées, 11 bots)

| Variante | Score | Taux fort | Forêt | Lecture | Profondeur | Info | Placement | Maîtrise | Plan 2 ét. | Gain Sabot. | Perdus | Couplage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **J3_presage** | **0,77** | 42,2 % 🟢 | 74,0 % | 16,8 🟢 | 8,0 🟢 | 14,6 🟢 | 3,3 🟠 | 4,0 🟢 | 9,7 | 7,1 | 2,8 % | 8,2 % |
| **J4_presage** | **0,36** | 40,6 % 🟢 | 75,7 % | 15,6 🟢 | 9,8 🟢 | 13,8 🟢 | 2,1 🟠 | 2,9 🟢 | 9,9 | 4,6 | 4,3 % | 14,3 % |
| **J6_presage** | **0,00** | 37,3 % 🟢 | 76,9 % | 13,1 🟢 | 11,9 🟢 | 12,2 🟢 | 7,3 🟢 | 0,3 🔴 | 10,6 | 5,7 | 2,3 % | 13,3 % |
| **J6_rythme_vague** | **0,41** | 30,9 % 🟢 | 75,1 % | 5,9 🟠 | 2,5 🟠 | 6,7 🟢 | 2,9 🟠 | 1,6 🟠 | 4,5 | 2,2 | 9,1 % | 7,2 % |
| **J3_rythme_vague** | **0,00** | 33,3 % 🟢 | 71,4 % | 5,7 🟠 | 1,9 🟠 | 4,0 🟠 | 0,7 🔴 | 5,0 🟢 | 6,1 | 3,1 | 10,6 % | 6,7 % |
| **J3_base** | **0,00** | 29,3 % 🟢 | 70,3 % | 4,0 🟠 | −1,0 🔴 | 4,0 🟠 | 1,4 🟠 | 1,7 🟠 | 1,6 | 4,2 | 10,4 % | 2,8 % |
| **J3_sans_apprentissage** | **0,00** | 38,5 % 🟢 | 72,9 % | 7,6 🟠 | 1,9 🟠 | 9,5 🟢 | 0,9 🔴 | 1,2 🟠 | 3,3 | 4,7 | 9,2 % | 5,1 % |
| **J3_1ordre_8tours** | **0,00** | 36,3 % 🟢 | 72,3 % | 2,8 🔴 | −0,0 🔴 | 4,5 🟢 | 0,0 🔴 | 3,5 🟢 | 3,5 | 11,1 | 0,0 % | 1,2 % |
| **J3_sabotage_fige** | **0,00** | 39,9 % 🟢 | 73,3 % | 1,6 🔴 | 2,6 🟠 | 7,6 🟢 | −0,5 🔴 | 4,9 🟢 | 3,6 | 11,6 | 4,7 % | 3,0 % |
| **J3_sabotage_chantier** | **0,00** | 30,6 % 🟢 | 70,6 % | 5,0 🟠 | 1,7 🟠 | 5,6 🟢 | −1,4 🔴 | 2,1 🟢 | 2,8 | 5,0 | 10,8 % | 0,9 % |

---

## Analyse de la première partie humaine sur la maquette (`graine 60041`, 3 joueurs)

Partie jouée par l'auteur le 16 oct. (`J1` humain + `J2, J3` bots `Prévoyant`, sans présage, rythme `lancer`) :
- **Résultat mesuré :** 55 / 84 arbres sauvés (65 %), **3 parades sur 24 ordres (12,5 %)**, 3 ordres perdus. Sur la même graine `60041`, 3 bots `Réflexe` ou `Glouton` font exactement le même score (3 / 24 parades, 55 arbres) et 3 bots `Prévoyant` font 5 / 24 parades (57 arbres).
- **Trois causes identifiées :**
  1. **Le piège du combo « Carte 1 : Aller sur une Machine → Carte 2 : la Saboter »** (Tours 1 et 2 de J1) : la Machine visée s'active pendant la Vague 1 et quitte la case avant l'Étape 2, rendant le Sabotage de la Carte 2 perdu. De même, programmer deux fois `Saboter` sur la même Machine (J3 au Tour 1) échoue au second ordre car une Machine sabotée en Vague 1 se déplace quand même (`sabotage = échappe`).
  2. **Concentration des doubles au Tour 1 (4 doubles sur 6 lancers)** et percée rapide vers le Cœur (`case 0`) et l'anneau intérieur (`A1..A3`) pendant que les pions restaient sur les anneaux extérieur et médian.
  3. **Biais de passivité des bots `Glouton` / `Prévoyant` (corrigé le 16 oct.)** : une pénalité `-0.001 * nbCartes` dans `bots.js` faisait préférer `rien` (`null`) aux bots quand leurs échantillons ne touchaient pas immédiatement leurs cases.

---

## Propositions soumises à l'auteur (en attente de décision)

### 1. Feuille de route en 6 paliers (validée dans son principe le 16 oct., 23 h 12)
1. **Palier 0 (Fait)** : Outil d'évaluation automatisé (`maquettes-numeriques/pistes/campagne.js` + `laboratoire.html`) et **Campagne 3**.
2. **Palier 1** : **Synergie (être à deux sur une Machine) & revalorisation du Sabotage** — placé *avant* la communication pour créer un besoin réel de coordination et faire monter le couplage ($> 25\,\%$) sans tomber dans la boucle solitaire `marquage`.
3. **Palier 2** : **Différenciation des 6 Machines** (résistance/organes, déplacement, capacité de coupe, comportement au chantier).
4. **Palier 3** : **Phase de communication entre joueurs** (Conseil de la calebasse : visions privées + parole qui engage, `projet/2-maquettes/proposition-conseil-calebasse.md`).
5. **Palier 4** : **Mécanisme du Rêve et fins de jeu provoquées**, conçu comme un choix situationnel disputé ($T_4$ vert, ex. direction D1 « le rêve détourne »).
6. **Palier 5** : **Spécialisation des peuples** (exceptions aux règles communes / règles brisées, identité des individus, et **cartes d'aide en main liées au peuple**).

### 2. Choix ouverts sur le socle (Campagne 3) et le Palier 1 (Synergie)
- **Question S1 (Socle Pistes)** : Activer ou non **le Présage sur la Vague 1 (`presage=true`)** (ou le rythme `vague`) comme réglage de référence pour profiter du saut de profondeur (+8 pts), de lecture (16,8 pts) et de la chute des ordres perdus (de 10,4 % à 2,8 %) ?
- **Question S2 (Palier 1 — Forme de la Synergie à deux sur une Machine)** :
  - *Piste A (Remorquage / Mise HS à deux)* : Saboter **seul** pare la menace mais la Machine s'échappe (règle actuelle) ; Saboter **à deux** (deux individus sur la Machine, ou 1 Saboter soutenu par un allié présent sur la case) **renvoie la Machine au Chantier** (ou la fige pour tout le tour) + la fait reculer de 2 crans sur la piste des Machines.
  - *Piste B (Garde seul vs Sabotage à deux)* : **Garder** se joue seul (protège une case), mais **Saboter** une Machine exige toujours la présence de **2 individus** sur la case et produit un effet fort (Machine figée pour toute la vague / organe détruit + recul doublé).
  - *Piste C* : Autre mécanique de synergie souhaitée par l'auteur.

### 3. Proposition sur le mode d'exécution Hybride Local / Cloud (GitHub Actions)
- **Constat :** `campagne.js` tourne en local sur tous les cœurs CPU (pratique pour des sondes rapides de 3 à 10 variantes en 1 à 3 minutes sans committer). Pour des criblages larges (50 à 200 variantes ou confirmations à 160 parties) ou pour libérer/éteindre le PC de l'auteur, le dépôt dispose déjà de GitHub Actions (`.github/workflows/placement.yml`, jusqu'à 20 machines virtuelles gratuites en parallèle, publication automatique sur la branche `resultats`).
- **Proposition technique :** Ajouter les options `--lot i/N` et `--fusionner` à `maquettes-numeriques/pistes/campagne.js` et autoriser les plans `pistes_*` dans le workflow GitHub Actions pour disposer des deux modes avec le même code JS.

---

## Nouveau besoin exprimé par l'auteur (17 oct. 2026, 11 h 31) : Mode didactique et résolution très décomposée sur la maquette

**Besoin :** Disposer sur la maquette (`maquettes-numeriques/pistes/pistes.html`) d'un **mode beaucoup plus didactique**, qui montre de manière détaillée toutes les actions et les explique, en particulier lors de la **phase de résolution**, qui doit être **très décomposée avec des focus visuels sur les éléments qui s'activent et bougent**.

**Spécification fonctionnelle à implémenter à la reprise :**
1. **Contrôleur de résolution pas-à-pas didactique** (bandeau dédié au-dessus ou à côté du plateau, avec boutons `⏮️ Début du tour`, `◀️ Sous-étape précédente`, `▶️ Sous-étape suivante`, `⏯️ Lecture auto (vitesse réglable)`, et un encadré pédagogique **« Ce qui se passe maintenant »** en gros caractères).
2. **Décomposition granulaire de chaque Étape en micro-focus visuels successifs :**
   - **Micro-étape A — Révélation des cartes des joueurs (Étape 1 ou 2) :**
     - Focus successif sur chaque joueur : zoom/halo sur le pion concerné, flèche de déplacement animée s'il joue `Aller`, pose visible du bouclier `🛡️` (`Garder`) ou de la clé `🔧` (`Saboter`), ou alerte explicite `⚠️ Ordre perdu (explication : la Machine X a quitté la case pendant la Vague 1)`.
   - **Micro-étape B — Pour chaque lancer de dé de la Vague ($1 \dots L$), décomposé en 4 temps :**
     1. **Lancer des 2 dés (`d1, d2`)** : affichage visuel des deux dés, calcul explicite `Somme = d1 + d2` et `Écart = |d1 - d2|`.
     2. **Focus sur les deux pistes** : mise en lumière simultanée de la tuile **Somme** sur la *Piste des pensées* (qui donne la **Tactique**) et de la tuile **Écart** sur la *Piste des Machines* (qui désigne la **Machine**), avec explication en français de la règle de ciblage de cette tactique.
     3. **Focus sur le plateau (Action de la Machine)** :
        - Halo lumineux sur la Machine désignée (ou sur le *Chantier* si elle entre en jeu) et sur toutes les cases de son rayon d'action ;
        - Affichage du pourquoi telle case cible est choisie par la tactique (ex. *« Cupidité : vise B4 car elle a 3 arbres »* ou *« Percée : vise A2 car elle se rapproche du Cœur »*) ;
        - Animation du mouvement de la Machine et résolution de l'impact : soit **Parée par Garde `🛡️`** (la Machine est repoussée et reste sur sa case), soit **Parée par Sabotage `🔧`** (l'arbre est sauvé, mais la Machine glisse sur la case cible), soit **Arbre abattu `🪓`** (animation de l'arbre qui devient souche `🪵`).
     4. **Focus sur l'Apprentissage (Échange sur les pistes)** :
        - Explication claire du verdict (*« Échec de la Machine → la tactique et la Machine reculent vers les bords rares »* ou *« Réussite : un arbre est tombé → la tactique se rapproche du 7 central et la Machine avance vers la gauche probable »*) et animation visuelle de l'échange des deux tuiles avec leurs voisines sur les pistes.

