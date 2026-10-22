# Rapport d'Analyse Paramétrique V0.4 — Pur Placement & Coalition Inter-Peuples
**Campagne** : [VM Oracle Cloud] Campagne Exploratoire V0.4 — Pur Placement, 6 Topologies, Options Contrariées & Banc 3–6J  
**Date** : 21/10/2026 20:45:55  
**Versions analysées** : V0.4  
**Protocole** : Échelle à 9 Bots (Inerte → IS-MCTS) × Banc complet 3, 4, 5 et 6 Joueurs × Balayage Paramétrique Multi-Axes

---

## 1. Résumé Exécutif
Le programme de test approfondi de la Version 0.4 (« Pur Placement & Coalition ») portant sur 4 variantes paramétriques évaluées sur les 9 algorithmes de bots et de 3 à 6 joueurs valide pleinement le passage au « Tout-Placement ». La suppression des cartes Action au profit du couple « Barrage individuel à l’entrée (≥ 1 Défenseur) + Coalition Inter-Peuples contre la coupe (≥ 2 Peuples distincts) » porte le score d’intérêt global à 95/100 sur la variante « V0.4 Programmation Réactive (Déplacement I Barrage → Machines → Déplacement II Coalition) ».

---

## 2. Enseignements Clés du Programme de Tests V0.4

### A. Intérêt Stratégique : Barrage (Étape I) vs Coalition Inter-Peuples (Étape II)
En V0.4, la contrainte des « 2 Peuples différents » pour bloquer une Machine déjà sur place crée un fossé spectaculaire (+6,8 à +9,4 pts de forêt sauvée) entre un jeu égoïste (Bot Glouton, qui ne peut former une Coalition seul avec ses 2 pions du même Peuple) et un jeu coordonné (Bots Déductif, Expectimax Bayésien et IS-MCTS). Par ailleurs, la nouvelle 4e tactique « Acharnement » (ciblant la forêt la plus entamée > 0) et l’option « 3 Tactiques sans Représailles » éliminent tout paradoxe avec le Barrage d’entrée.

### B. Comparaison des Options V0.4 (Barrage, Coalition, Tactiques)
- **Barrage d'entrée** : *Annulation stricte* (94/100) offre la meilleure récompense à la déduction des dés 2D6 ; *Report sur cible libre* (91/100) crée un jeu plus nerveux qui se marie idéalement avec le *Renvoi au Chantier*.
- **Effet de la Coalition (2 Peuples)** : *Bloquer la coupe seule* (94/100) maintient une pression constante sur le plateau, tandis que *Renvoyer au Chantier* (92/100) est recommandé lorsque les Machines contournent les barrages ou sont nombreuses (5–6 Machines).
- **Profil de la Piste Tactique (2–12)** : La nouvelle 4e tactique **« Acharnement »** (94/100) et l'option **« 3 Tactiques sans Représailles »** (93/100) surpassent nettement l'ancienne tactique Représailles.

### C. Lisibilité & Équilibre 3–6 Joueurs
Sur table, l’abandon des paquets de 5 cartes Action par joueur au profit d’un pur jeu de déplacement en 2 temps (Déplacement I avant ciblage = Barrage ; Déplacement II après ciblage = Coalition) fait bondir la note d’ergonomie à 97/100 sur le Plateau Double Face.
La règle « 2 Peuples distincts = Coalition » s’équilibre naturellement de 3 à 6 joueurs sur le Plateau Double Face (Recto 9 zones à 3–4J / Verso 13 zones à 5–6J), maintenant une survie moyenne comprise entre 71 % et 77 % sur toute la plage de joueurs.

---

## 3. Comparatif des Architectures Géométriques en V0.4

| Architecture de Plateau | Intérêt Stratégique | Lisibilité & Ergonomie | Équilibre 3–6 Joueurs | Verdict Analytique V0.4 |
| :--- | :---: | :---: | :---: | :--- |
| **Plateau Double Face Fixe (Recto 3–4J 9 zones / Verso 5–6J 13 zones)** | 94/100 | 97/100 | 85/100 | Socle de référence V0.4 : les diagonales Lisière ↔ 2 Clairières permettent à deux Peuples voisins de converger en 1 pas pour former une Coalition tout en maintenant un Barrage aéré. |
| **Réseau de Clairières & Sentiers (13 zones · 3 Cols)** | 93/100 | 94/100 | 91/100 | Idéal avec l’Option 4 (Interception par Machine active) : converger à 2 peuples par les cols pour neutraliser une Machine crée une tension coopérative maximale. |
| **Sentiers à Goulots Stricts (15 zones · 4 Cols Goulots Cap. 1)** | 94/100 | 92/100 | 91/100 | Terrain d’excellence pour l’Option 2 (Goulots limités à 1 pion) : oblige à anticiper l’ordre de passage dans les 4 cols sous peine de mouvement contrarié en cascade. |
| **Micro-Plateau Compact (9 zones · Haute Tension)** | 91/100 | 95/100 | 88/100 | Forte densité et tension maximale à 3 et 4 joueurs : chaque case est vitale et aucune erreur de placement n’est anodine. |
| **Grand Réseau Étendu (21 zones · 5–6J & 3 Déf./J)** | 90/100 | 87/100 | 93/100 | Taillé pour 5–6 joueurs ou 3 Défenseurs par joueur : valorise la planification multi-coups (+15% d’écart en faveur d’IS-MCTS). |
| **Grille Hexagonale Fixe à 19 Cases** | 89/100 | 89/100 | 88/100 | Pavage hexagonal à 6 voisins offrant de multiples voies de contournement. |

---

## 4. Configurations V0.4 Recommandées (Instanciables en 1 clic)

### 1. Noyau Recommandé V0.4 — Double Plateau + Barrage Annulation + Coalition Bloque Coupe + Acharnement
- **Architecture** : Noyau V0.4 Pur Placement + Tactique Acharnement + Pose Alternée
- **Analyse** : Configuration la plus pure, lisible et équilibrée de la V0.4 : la distinction entre Barrage préventif en Étape I (1 pion empêche l’entrée) et Coalition Inter-Peuples en Étape II (2 Peuples différents empêchent la coupe d’une Machine sur place) fonctionne sans aucune carte Action.
- **Points forts** : Zéro carte Action : 100 % de l’attention est portée sur le plateau, les gobelets 2D6 et les déplacements des coéquipiers. · Écart maximal entre le Bot Glouton (individuel) et les Bots Déductif / IS-MCTS (qui forment des Coalitions inter-peuples). · La nouvelle tactique « Acharnement » punit les forêts déjà entamées, obligeant à défendre les clairières blessées.

### 2. Variante Épurée V0.4 — 3 Tactiques (Sans Représailles) + Déplacement II Réactif après Ciblage
- **Architecture** : V0.4 Pur Placement + 3 Tactiques Épurées + Déplacement II Réactif
- **Analyse** : Pour une prise en main immédiate et un dialogue coopératif encore plus lisible : 3 tactiques pures (Cupidité, Percée, Opportunisme) et un 2e déplacement programmé après avoir vu où les Machines ont atterri.
- **Points forts** : Lecture probabiliste limpide de la Piste Tactique (3 tactiques au lieu de 4). · Phase de Coalition (Déplacement II) ultra-tactique en réaction directe aux entrées des Machines.

### 3. Variante Haute Tension V0.4 — Clairières & Sentiers (3 Cols) + Barrage Report + Coalition Renvoi Chantier
- **Architecture** : V0.4 Pur Placement + Clairières & Sentiers + Report & Renvoi Chantier
- **Analyse** : Lorsque le Barrage dévie la Machine vers la seconde meilleure case libre (« Report »), les Machines entrent plus souvent sur le plateau ; en contrepartie, former une Coalition de 2 Peuples renvoie la Machine au Chantier !
- **Points forts** : Dynamique très nerveuse : les Machines contournent les barrages isolés mais sont expulsées au Chantier par les Coalitions. · Mise en valeur spectaculaire des 3 Cols de Vallée.
