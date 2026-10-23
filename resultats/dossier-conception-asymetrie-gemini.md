# DOSSIER MAÎTRE DE CONCEPTION : L'ASYMÉTRIE DES 6 PEUPLES
## Projet « La Forêt qui Rêve » (Défenseurs de la Forêt — Ancré sur la Variante Recommandée V0.5)
*Document de cadrage complet pour session de travail itérative avec Gemini (et consultable directement dans l'Atelier)*

---

## 0. PROMPT D'INITIALISATION POUR LA DISCUSSION GEMINI

> **Instructions pour Gemini (à copier en préambule de la nouvelle discussion) :**
> 
> *« Bonjour Gemini. Tu es mon co-auteur et game designer senior pour finaliser le système d'asymétrie de mon jeu de société coopératif "La Forêt qui Rêve".*
> 
> *Tu trouveras ci-dessous l'intégralité du contexte du projet, calé sur la **Variante Recommandée de la Version 0.5** (`v05_2c_lineaire_1def_surplace` — Score d'intérêt 97/100), conçue pour être jouée de **3 à 6 joueurs** avec un intérêt constant quelle que soit la taille de la table :*
> *1. Le cadre méthodologique et le lexique formel que j'ai défini (Spécificité, Mécanique spécifique, Synergies 3.1 & 3.2, Échelle d'Avantages de 1 à 5).*
> *2. Le socle de règles arrêté de la Variante Recommandée V0.5 (3 à 6 joueurs) sur Plateau Double Face Fixe (Recto 3–4J à 9 zones / 38 arbres · Verso 5–6J à 13 zones / 54 arbres) :*
> *   - **Pur Placement libre (3 à 6J)** : 1 pion Défenseur par joueur, 1 gobelet 2D6 par joueur, 2 déplacements programmés (Déplacement I puis II), zéro carte Action, zéro Mouvement Contrarié et capacité illimitée des zones.*
> *   - **Réserve du Chantier toujours active (3 à 6J)** : 3 Machines en lisière (et 3 au Chantier) à 3 joueurs ; **4 Machines en lisière (et 2 au Chantier M4, M5) à 4, 5 et 6 joueurs**. Le Chantier n'est jamais vide au départ, garantissant une valeur constante aux pouvoirs d'expulsion au Chantier de 3 à 6 joueurs.*
> *   - **Bilan positif sans défaite à 0 arbre** : La partie dure toujours 4 tours complets sans condition de « Game Over » prématuré (même si le Cœur perd ses arbres, la partie continue). Plus de la moitié de la forêt survit mathématiquement toujours, et l'équipe évalue sa performance sur une échelle positive d'harmonie forestière.*
> *   - **Curseur 1B (Séquence Linéaire en fin de tour)** : tous les Défenseurs exécutent leurs Déplacements I puis II ; ensuite on révèle les gobelets 2D6 **un par un** (de 1 à N joueurs), et chaque Machine se déplace vers sa cible, résout immédiatement son verdict de coupe et fait évoluer ses deux pistes avant le gobelet suivant.*
> *   - **Curseur 2A + 3A (Règle unique de Parade)** : aucun Barrage d'entrée. Au moment où la Machine veut couper, si **au moins 1 Défenseur** occupe sa zone, la coupe est annulée, la Machine **reste sur place** et ses tuiles reculent sur les deux pistes ; sinon elle abat 1 arbre et ses tuiles avancent vers le 7 et vers la gauche (case 1).*
> *   - **3 Tactiques épurées** sur la piste 2–12 : Cupidité (+ d'arbres), Percée (vers le Cœur) et Opportunisme (zone la moins gardée).*
> *3. La boîte à outils des mécaniques déportées dans l'Asymétrie V0.5 : le Barrage d'entrée exclusif, le Déplacement réactif après révélation d'un gobelet, le renvoi au Chantier d'une Machine parée (au lieu de rester sur place), et le "2e mouvement programmé contrarié" (inspiré de Colt Express et adapté au coopératif, où le 2e pas ou pouvoir programmé peut tomber dans le vide comme contrepartie d'équilibrage d'un pouvoir fort ou d'une synergie).*
> *4. La matrice mathématique intégralement préservée des 6 Peuples et des 4 Secteurs (36 points, 9 points par Secteur, Famille A Spécialistes 5-1 / 4-2 / 3-3 et Famille B Polyvalents 4-1-1 / 3-2-1 / 2-2-2).*
> *5. Le fonctionnement arrêté pour la mécanique spécifique partagée du "Rêve" (Entités Magiques à 4 pts vs Humains Chamanes à 3 pts).*
> *6. L'anthologie de mes idées et inspirations thématiques.*
> 
> *Notre objectif de travail : Affiner et formaliser chaque règle et avantage associé aux Peuples, case par case de la matrice, de manière itérative et collaborative sur ce socle V0.5 recommandé (jouable de 3 à 6 joueurs).*
> 
> *RÈGLES D'INTERACTION STRICTES :*
> *- Ne génère PAS une solution globale d'un coup.*
> *- Travaille de façon incrémentale, une seule case (ou un seul Peuple) à la fois, selon mes directives.*
> *- Respecte scrupuleusement le budget de points (exactement 6 points par Peuple, 9 points par Secteur) et les définitions du lexique.*
> *- Pose-moi des questions ciblées et propose des arbitrages concrets sur chaque règle étudiée.*
> 
> *Confirme-moi que tu as bien assimilé ce dossier complet V0.5 et indique-moi quand tu es prêt à attaquer la première case de la matrice que je te désignerai ! »*

---

## 1. CADRE MÉTHODOLOGIQUE & LEXIQUE FORMEL (100 % CONSERVÉ)

Ce système d'asymétrie repose sur 3 concepts exclusifs et une échelle de valeur stricte :

### 1.1. Les Trois Concepts
1. **Spécificité :** Liée à un Peuple, elle forme un ensemble thématique et mécanique cohérent propre à son identité, qui accorde $n$ Avantages (répartis sur 2 ou 3 Secteurs distincts) à ce Peuple et à la table.
2. **Mécanique spécifique :** Spécificité reposant sur une **nouvelle mécanique qui vient se greffer au cœur du jeu**, pouvant nécessiter un matériel de jeu ad hoc (piste dédiée, réserve de jetons personnels, dés altérés, etc.). Elle correspond obligatoirement aux **Avantages Forts (4 ou 5 points)**.
3. **Synergie (deux types distincts) :**
   - **Synergie 3.1 (Ouverte / Collective) :** Mécanique spécifique ou avantage qui implique les autres joueurs (sans nécessiter un Peuple particulier à la table) et génère un intérêt accru à collaborer (ex. offrir une ressource à un allié, transporter un pion allié, méditer pour faire avancer le Rêve).
   - **Synergie 3.2 (Croisée / Inter-Peuples) :** Combinaison de spécificités entre deux Peuples précis (sans nécessiter que ce soient des mécaniques spécifiques) qui s'avère nettement plus avantageuse jouée ensemble que séparément.

### 1.2. Échelle de Puissance des Avantages (1 à 5 points)
- **Avantages Forts (4 ou 5 points) :** De véritables mécaniques qui s'ajoutent (sous-système greffé, matériel propre) — régulées en V0.5 par une contrepartie de programmation (notamment le *2e mouvement programmé contrarié* type *Colt Express*).
- **Avantages Moyens (2 ou 3 points) :** Modifient une mécanique existante du socle V0.5 recommandé de manière significative (portée, condition d'activation, moment de résolution ou sort de la Machine contrée).
- **Avantages Faibles (1 point) :** Bonus ponctuels (une fois par partie) ou récurrents légers, servant principalement de **passerelles synergiques** avec les coéquipiers.

---

## 2. LE SOCLE ARRÊTÉ : LA VARIANTE RECOMMANDÉE V0.5 (`Curseur 1B · 2A · 3A` — 3 à 6 Joueurs)

À l'issue des campagnes comparatives V0.5, la **Variante Recommandée** (`v05_2c_lineaire_1def_surplace`) constitue désormais le socle de référence unique pour **3 à 6 joueurs** sur lequel se greffent les 6 Peuples. Elle se résume en **5 règles fondamentales** :

### 2.1. Les 5 Piliers de la Variante Recommandée V0.5 (Échelle 3 à 6 Joueurs)

| Pilier du Socle V0.5 | Règle retenue dans la Variante Recommandée (3 à 6 Joueurs) | Ouverture offerte à l'Asymétrie des 6 Peuples |
| :--- | :--- | :--- |
| **1. Plateau, Chantier & Fin de Partie** | **Plateau Double Face Fixe** (Recto 3–4J : 9 zones, 38 arbres · Verso 5–6J : 13 zones, 54 arbres). **1 Défenseur/joueur**, **1 gobelet 2D6/joueur**, **4 tours**.<br>• **Chantier harmonisé (3–6J)** : 3 Machines en lisière (+3 au Chantier) à 3J ; **4 Machines en lisière (+2 au Chantier M4, M5) à 4, 5 et 6J**.<br>• **Zéro défaite à 0 arbre** : pas de Game Over si le Cœur tombe à 0 ; bilan final positif d'harmonie forestière au terme des 4 tours. | • Le Chantier contient toujours au moins 2 Machines en réserve de 3 à 6J $\to$ l'expulsion au Chantier garde la même valeur à 3, 4, 5 ou 6 joueurs.<br>• 1 pion/joueur $\to$ valorise le transport d'allié (Oiseaux) et l'Essaim (Insectes). |
| **2. Tête du Méchant & 3 Tactiques** | Chacun lance **2D6 secrets** sous son gobelet en début de tour. **Somme (2–12)** = Tactique parmi **3 Tactiques épurées** (*Cupidité* = + d'arbres, *Percée* = vers le Cœur, *Opportunisme* = moins de Défenseurs). **Écart (0–5)** = Machine sur la piste statistique `1 – 2 – 3 – 0 – 4 – 5`. | • Lecture immédiate des probabilités $\to$ laisse toute la place mentale au **Versant du Rêve** (cases 8–12) des Entités et des Chamanes Humains. |
| **3. Programmation Pur Placement** | **Zéro carte Action, zéro Mouvement Contrarié** dans le socle. Deux tours de table horaires publics : chacun annonce le **Déplacement I** (0 ou 1 zone adjacente), puis le **Déplacement II** (à partir de la zone atteinte en I). | • La trajectoire choisie est le seul signal silencieux.<br>• Le *Mouvement Contrarié* est réservé comme contrepartie des pouvoirs forts. |
| **4. Curseur 1B — Séquence Linéaire en 5 étapes** | 1) Lecture secrète des 2D6 $\to$ 2) Programmation I puis II $\to$ 3) Exécution du Déplacement I $\to$ 4) Exécution immédiate du Déplacement II $\to$ 5) **Révélation des gobelets 2D6 un par un (de J1 à JN)** : chaque Machine se déplace vers sa cible, résout son verdict et met à jour les pistes **avant** le gobelet suivant. | • Crée un enchaînement dynamique entre les gobelets d'un même tour.<br>• Rend exceptionnel le pouvoir des **Reptiles (Secteur B)** qui jouent leur 2e pas *après* le déplacement d'une Machine ! |
| **5. Curseurs 2A & 3A — Règle unique de Parade** | **Zéro Barrage d'entrée** : la Machine entre toujours librement sur sa cible. Au moment où elle veut couper :<br>• **Seuil 2A (≥ 1 Défenseur)** : si au moins 1 Défenseur occupe la zone, la coupe est **annulée** et les 2 pistes reculent d'un cran (vers 2/12 et vers la droite `case 5`).<br>• **Sort 3A (Sur place)** : la Machine parée **reste sur sa zone** pour le tour suivant.<br>• Sinon : **-1 arbre** et les 2 pistes avancent (vers `7` et vers la gauche `case 1`). | • Puisque la Machine parée reste sur place dans le socle, **l'expulsion au Chantier** (Reptiles / Mammifères ou synergie à 2 Peuples) et le **Barrage d'entrée** (Mammifères) deviennent de vrais pouvoirs asymétriques majeurs ! |

---

## 3. BOÎTE À OUTILS ASYMÉTRIQUE ISSUE DE L'ÉPURATION V0.5

Le choix de la variante recommandée (`Curseur 1B · 2A · 3A`) dégage **4 leviers mécaniques exclusifs** qui n'existent plus dans le socle de base et deviennent la signature des Peuples :

### 3.1. Le « 2e Mouvement Programmé Contrarié » (Effet *Colt Express* Coopératif)
*   **Origine :** Dans *Colt Express*, la programmation à l'avance fait qu'une action spéciale peut « tomber dans le vide » si la situation a changé au moment de sa résolution.
*   **Fonctionnement concret sur le socle V0.5 :**
    1. Les déplacements ordinaires des Défenseurs ne sont **jamais** contrariés.
    2. En revanche, lorsqu'un joueur programme l'activation d'un **pouvoir fort (4 ou 5 pts)** ou d'une **synergie exigeante** sur son **2e mouvement programmé (Déplacement II)**, cette action spéciale requiert une condition spatiale stricte à l'instant précis de sa résolution (ex. *présence effective d'une Machine sur la zone*, *présence d'un allié d'un autre Peuple sur la zone*, ou *clairière non rasée*).
    3. **Verdict « Colt Express » :** Si la condition n'est pas remplie (la Machine a bifurqué à cause d'un gobelet précédent ou l'allié attendu n'est pas là), **le 2e mouvement/pouvoir programmé est contrarié et tombe dans le vide** (le pion reste sur sa case de l'Étape I ou perd l'effet de son pouvoir).

### 3.2. Le « Barrage d'Entrée Exclusif » (Secteur D — Mammifères)
*   Puisqu'en V0.5 les Machines entrent toujours librement sur leur zone cible, la capacité d'**interdire l'entrée d'une zone aux Machines** (ou d'y poser une *Écorce durable* protégeant les arbres même après le départ du pion) devient le privilège exclusif des **Mammifères (4 pts)**.

### 3.3. L'Expulsion vers le Chantier & l'Enrayage sur Place (Secteur D — Reptiles, Mammifères, Insectes)
*   Puisque dans la variante recommandée (**Curseur 3A**), une Machine contrée par 1 Défenseur **reste sur place** et continue de menacer le voisinage au tour suivant, la capacité de **renvoyer physiquement une Machine au Chantier (Réserve)** ou de **l'enrayer durablement sur place** devient un levier stratégique de premier plan (incarné par l'*Étreinte* des Reptiles, la *Force du Réveil* des Mammifères et la *Corrosion* des Insectes).

### 3.4. Le « Déplacement Réactif post-Gobelet » (Secteur B — Reptiles)
*   Puisque dans la variante recommandée (**Curseur 1B Linéaire**), tous les Défenseurs terminent leurs Déplacements I et II *avant* qu'on ne soulève le moindre gobelet 2D6, le pouvoir des **Reptiles (Secteur B — 3 pts : *L'Embuscade à Sang Froid*)** de **retenir son Déplacement II pour l'exécuter en réaction APRÈS le déplacement d'une Machine** (juste avant son verdict de coupe) offre un filet de sécurité unique autour de la table.

---

## 4. LES 4 SECTEURS DU JEU SUR LA VARIANTE RECOMMANDÉE V0.5 (9 POINTS CHACUN)

Les 4 secteurs du modèle mathématique s'articulent directement sur les 4 compartiments de la Variante Recommandée V0.5 :
*   **Secteur A — Le Méchant & les Pistes 2D6 (9 pts) :** Piste Tactique (cases 2 à 12 à 3 Tactiques), Piste Machine (`1–2–3–0–4–5`), dés 2D6 sous gobelets révélés un par un, apprentissage immédiat après chaque gobelet, Versant du Rêve (cases 8–12) et Esprits.
*   **Secteur B — La Programmation & le Timing Linéaire 1B (9 pts) :** Ordre du tour, programmation publique des Déplacements I et II, dérogation à la séquence linéaire 1B (action réactive post-gobelet des Reptiles), communication et pactes d'alliance, gestion du risque de *2e mouvement programmé contrarié*.
*   **Secteur C — Les Défenseurs sur le Plateau Double Face (9 pts) :** Mobilité sur les 9 ou 13 zones du Plateau Double Face (vol d'un bout à l'autre, saut, transport d'allié), réserve de ressources forestières (Graines de Vie / Sève), démultiplication de présence (alors que chaque joueur n'a qu'1 pion Défenseur dans le socle).
*   **Secteur D — La Parade (Curseurs 2A/3A) & l'Interaction Machines (9 pts) :** Renvoi d'une Machine parée au Chantier (dérogeant au maintien sur place du Curseur 3A), **Barrage d'entrée exclusif**, protection durable d'arbres sans pion (Écorce), corrosion et immobilisation des Machines restées en forêt.

---

## 5. LA MATRICE VALIDÉE : 6 PEUPLES × 4 SECTEURS (36 POINTS)
*Architecture intégralement conservée : Option A (Duel d'Experts sur le Rêve en Secteur A) + Oiseaux en Hyper-Spécialiste (5-1 en Secteur C)*

Chaque Peuple cumule **exactement 6 points** sur 2 ou 3 secteurs. Chaque Secteur cumule **exactement 9 points**.
- **Famille A — Les Spécialistes (2 secteurs investis) :** Profils `5-1`, `4-2`, `3-3`.
- **Famille B — Les Polyvalents (3 secteurs investis) :** Profils `4-1-1`, `3-2-1`, `2-2-2`.
*(Garantit mathématiquement 95 % de couverture des 4 Secteurs à 3 joueurs et 100 % à 4 et 5 joueurs).*

| Peuple | Profil Mathématique | Secteur A *(Méchant)* | Secteur B *(Program.)* | Secteur C *(Défenseurs)* | Secteur D *(Résolution)* | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Oiseaux** | **5 - 1** *(Spécialiste)* | **1 pt** *(Présage)* | — | **5 pts** *(Graines/Sève & Vol)* | — | **6 pts** |
| **2. Entités Magiques** | **4 - 2** *(Spécialiste)* | **4 pts** *(Rêve : Esprits)* | **2 pts** *(Pas Spectral)* | — | — | **6 pts** |
| **3. Reptiles** | **3 - 3** *(Spécialiste)* | — | **3 pts** *(Embuscade Réactive)* | — | **3 pts** *(Étreinte/Chantier)*| **6 pts** |
| **4. Mammifères** | **4 - 1 - 1** *(Polyvalent)* | **1 pt** *(Rugissement)* | — | **1 pt** *(Bond Jaguar)* | **4 pts** *(Barrage Exclusif / Écorce & Réveil)* | **6 pts** |
| **5. Humains** | **3 - 2 - 1** *(Polyvalent)* | **3 pts** *(Rêve : Transe)* | **2 pts** *(Parole & Pacte)* | **1 pt** *(Sentier Guide)* | — | **6 pts** |
| **6. Insectes** | **2 - 2 - 2** *(Polyvalent)* | — | **2 pts** *(Essaim)* | **2 pts** *(Infiltration)* | **2 pts** *(Corrosion)* | **6 pts** |
| **Total Secteur** | *15 Avantages au total* | **9 pts** *(4, 3, 1, 1)* | **9 pts** *(3, 2, 2, 2)* | **9 pts** *(5, 2, 1, 1)* | **9 pts** *(4, 3, 2)* | **36 pts** |

---

## 6. FOCUS MAJEUR : LE RÊVE, MÉCANIQUE SPÉCIFIQUE PARTAGÉE
*(Validée pour Entités Magiques à 4 pts vs Humains Chamanes à 3 pts sur la Variante Recommandée V0.5)*

La mécanique du Rêve s'active dès qu'au moins l'un de ces deux Peuples est présent autour de la table.

### 6.1. Le Socle Matériel Commun
- **3 tuiles Esprit** physiques.
- La moitié droite de la Piste Tactique (cases 8 à 12) est déclarée **Versant du Rêve**.
- **Effet lors de la révélation séquentielle (Étape 5 Linéaire 1B) :** Lorsqu'on soulève un gobelet 2D6, si la somme `d1 + d2` tombe sur une case occupée par un Esprit, **l'activation de la Machine est immédiatement annulée** (elle s'égare dans le Rêve : ni déplacement, ni coupe). En revanche, chaque fois qu'une Machine parvient à couper un arbre lors de la révélation d'un gobelet, l'Esprit le plus avancé recule d'une case vers 12 (*Tir à la corde*).

### 6.2. Différenciation Entités (4 pts) vs Humains (3 pts)
*   **Entités Magiques (Avantage A = 4 pts — L'Incarnation Onirique / *Hanter*) :**
    - Elles contrôlent la **profondeur d'invasion des Esprits** sur la Piste Tactique.
    - Quand une Entité pare une Machine (ou la pare en présence d'un allié) ou qu'un allié médite au Cœur (*Synergie 3.1*), un Esprit entre en case 12 ou avance d'une case vers le centre.
    - **Victoire par Long Sommeil :** Seules les Entités peuvent pousser un Esprit **jusqu'en case 7**. Si un Esprit tient la case 7 à la fin d'un tour sans qu'aucune coupe n'ait eu lieu, le Méchant s'endort définitivement.
*   **Humains / Chamanes (Avantage A = 3 pts — La Transe Chamanique / *Faire Rêver*) :**
    - Ils contrôlent **l'inflexion des dés 2D6 vers le Rêve**.
    - Ils maintiennent jusqu'à 2 Esprits sur les cases 8 à 12 (bouclier d'annulation), mais ne peuvent pas franchir seuls la case 7.
    - **Tambour de Transe :** 1 fois par tour, au moment où l'on soulève un gobelet 2D6 à l'Étape 5, si le Chamane est sur une clairière intacte, il peut **décaler la somme 2D6 de $\pm 1$** (ou **inverser un jet d'Éveil en son miroir de Rêve**, ex. $4 \to 10$) *pour forcer le dé à atterrir sur une case occupée par un Esprit*.

### 6.3. Fonctionnement en Synergie 3.2 (Quand les deux jouent ensemble)
- **Plafond anti-emballement :** Jamais plus de 3 tuiles Esprit en jeu, et 1 seule case d'avancée maximum par étape.
- **Complémentarité qualitative :** L'Entité déploie et fait monter les Esprits sur les cases centrales (9, 8, 7) ; le Chamane Humain oriente les gobelets 2D6 lors de leur révélation séquentielle pour qu'ils tombent pile sur les Esprits de l'Entité.

---

## 7. ANTHOLOGIE DES IDÉES & PISTES THÉMATIQUES (CALÉES SUR LA VARIANTE RECOMMANDÉE V0.5)

Ce réservoir d'idées sert de matière première pour affiner chaque case de la matrice sur la base `Curseur 1B · 2A · 3A` :

*   **Inspirations culturelles :** Davi Kopenawa (*La Chute du ciel*, chamanisme yanomami : les Blancs ne rêvent que d'eux-mêmes, la forêt les fait rêver d'autre chose) ; le folklore brésilien (*Curupira* aux pieds inversés qui égare les bûcherons).
*   **Oiseaux (« Le Regard » — 5-1) :** Voler d'un bout à l'autre du Plateau Double Face, transporter un allié (la Harpie porte un Défenseur allié), semer/replanter des Graines de Vie / Sève (l'Ara), Présage sur un gobelet (avec contrepartie de *2e mouvement contrarié* si la cible de livraison ou de semis est perturbée).
*   **Mammifères (« La Force » — 4-1-1) :** Seul peuple capable d'ériger un **Barrage d'entrée** ou une **Écorce durable** (le Tapir), bond offensif (le Jaguar), force du Réveil qui expulse les engins au **Chantier** au lieu de les laisser sur place (avec risque de *2e mouvement programmé contrarié façon Colt Express* si la Machine visée n'est plus sur la zone au moment de l'impact).
*   **Reptiles (« L'Embuscade » — 3-3) :** Programmation réactive unique dérogeant au **Curseur 1B Linéaire** (jouer son 2e déplacement **après** la révélation d'un gobelet Machine), et *Étreinte du constricteur* en Secteur D dérogeant au **Curseur 3A** (renvoie la Machine parée directement au **Chantier** au lieu de la laisser sur place !).
*   **Insectes (« L'Essaim » — 2-2-2) :** Greffer son déplacement sur celui d'un allié sans dépenser d'ordre (Essaim en B), *Infiltration / Démultiplication* en C (permettant de couvrir une 2e zone alors que le socle V0.5 ne donne qu'1 Défenseur par joueur), et *Corrosion silencieuse* en D (sabote sur place une Machine laissée en forêt par le Curseur 3A pour l'empêcher de bouger au tour suivant ou accentuer son recul vers l'Écart 5).
*   **Humains (« La Parole » — 3-2-1) :** Transe Chamanique sur les gobelets 2D6 lors de leur révélation un par un, rompre le silence de la programmation (Parole & Pacte), Sentier Guide.

---

## 8. FEUILLE DE ROUTE DE LA SESSION DE TRAVAIL CASE PAR CASE (SUR SOCLE V0.5 RECOMMANDÉ)

Voici l'ordre structuré pour affiner chaque règle et la tester au cas par cas sur la Variante Recommandée V0.5 (`Curseur 1B · 2A · 3A`) :

1.  **Bloc 1 — Le Secteur A (Le Méchant & les Pistes — 9 pts) :**
    - Finaliser la rédaction exacte du *Rêve des Entités* (A = 4 pts) et du *Rêve des Humains* (A = 3 pts) lors de la révélation séquentielle gobelet par gobelet (Étape 5 Linéaire).
    - Définir le bonus *Présage* des Oiseaux (A = 1 pt) et le *Rugissement* des Mammifères (A = 1 pt) sur la piste `1–2–3–0–4–5` et les 3 Tactiques.
2.  **Bloc 2 — Le Secteur C (Les Défenseurs sur le Plateau Double Face — 9 pts) :**
    - Définir la Mécanique Spécifique des Oiseaux : *Graines de Vie / Sève & Vol* (C = 5 pts) et sa contrepartie de prudence (*2e mouvement programmé contrarié*).
    - Définir les *Infiltrations d'Essaim* des Insectes (C = 2 pts) dans un socle à 1 Défenseur par joueur.
    - Préciser les passerelles de 1 pt (*Bond du Jaguar* pour Mammifères, *Sentier Guide* pour Humains).
3.  **Bloc 3 — Le Secteur B (La Programmation & le Timing Linéaire 1B — 9 pts) :**
    - Définir *L'Embuscade Réactive* des Reptiles (B = 3 pts) qui déroge à la séquence linéaire 1B en intervenant après la révélation d'un gobelet.
    - Définir *La Parole / Pacte d'Alliance* des Humains (B = 2 pts).
    - Définir *La Greffe d'Essaim* des Insectes (B = 2 pts) et le *Pas Spectral* des Entités (B = 2 pts).
4.  **Bloc 4 — Le Secteur D (La Parade 2A/3A & l'Interaction Machines — 9 pts) :**
    - Définir la Mécanique Spécifique des Mammifères : *Barrage d'Entrée Exclusif / Écorce Durable & Force du Réveil* (D = 4 pts) avec sa contrepartie *Colt Express*.
    - Définir *L'Étreinte / Renvoi au Chantier* des Reptiles (D = 3 pts) dérogeant au maintien sur place du Curseur 3A.
    - Définir *La Corrosion Silencieuse* des Insectes (D = 2 pts) sur les Machines restées en forêt.
5.  **Bloc 5 — Revue de Synthèse des Synergies 3.1 & 3.2 et du Contrepoids « Colt Express » :**
    - Validation des 3 duos complets à 2 joueurs (Oiseaux+Insectes, Mammifères+Humains, Reptiles+Entités) et de l'expérience à 3, 4 et 5 joueurs sur la Variante Recommandée V0.5.
