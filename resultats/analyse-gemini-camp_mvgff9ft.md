# Rapport d'Analyse Stratégique & Recommandations d'Hybridation (Gemini)
**Campagne** : Campagne Comparative Initiale V0.1 · V0.2 · V0.3 (9 Bots + Banc 3–6J)  
**Date** : 20/10/2026 08:33:47  
**Versions analysées** : V0.1, V0.2, V0.3  
**Protocole** : Échelle à 9 Bots (Inerte → IS-MCTS) × Banc complet 3, 4, 5 et 6 Joueurs

---

## 1. Résumé Exécutif
La campagne multi-versions (0.1, 0.2, 0.3) portant sur 11 variantes évaluées sur l'échelle des 9 bots (jusqu'à IS-MCTS) et sur le banc 3, 4, 5 et 6 joueurs met en évidence la supériorité nette des architectures de plateau fixes de la V0.3 sur la couronne modulable historique. La variante « V0.2 Peuples Asymétriques & Alliance de Sabotage » arrive en tête (87/100).

---

## 2. Diagnostic selon vos 3 Priorités de Conception

### A. Intérêt Stratégique & Profondeur Algorithmique
L'introduction des trois algorithmes de pointe (Expectimax Bayésien, Beam Rollout et IS-MCTS) révèle un gain supplémentaire de +3,5 à +6,8 points de forêt sauvée par rapport au bot Déductif classique, particulièrement sur la Grille Hexagonale 19 cases et le Réseau de Clairières & Sentiers où l'anticipation des goulets d'étranglement et l'inférence des dés alliés font la différence.

### B. Lisibilité & Ergonomie Physique sur Table
Sur le plan ergonomique, le Plateau Double Face (Recto 3–4J / Verso 5–6J) et le Réseau de Clairières & Sentiers éliminent totalement le fastidieux assemblage d'une tuile par joueur tout en offrant des repères visuels immédiats (les 4 ou 6 clairières croisées d'un côté, les 3 Cols de Vallée de l'autre).

### C. Équilibre selon le Nombre de Joueurs (3, 4, 5 et 6 Joueurs)
Dans la couronne modulable V0.1, passer de 3 à 6 joueurs dilate le périmètre (de 7 à 13 tuiles), ce qui pénalise l'entraide latérale à 5 et 6 joueurs. Le Plateau Double Face V0.3 corrige structurellement ce biais en introduisant des liaisons diagonales Lisière ↔ 2 Clairières, stabilisant le taux de survie dans un couloir resserré de 3 à 6 joueurs.

---

## 3. Comparatif des 4 Architectures Géométriques de Plateau

| Architecture de Plateau | Intérêt Stratégique | Lisibilité & Ergonomie | Équilibre 3–6 Joueurs | Verdict Analytique |
| :--- | :---: | :---: | :---: | :--- |
| **Plateau Double Face Fixe (Recto 3–4J / Verso 5–6J)** | 65/100 | 94/100 | 82/100 | Meilleur compromis global : stabilité remarquable de 3 à 6 joueurs grâce aux deux faces dédiées et aux diagonales d’entraide. |
| **Réseau de Clairières & Sentiers (3 Cols)** | 90/100 | 91/100 | 88/100 | Très haute tension coopérative : les 3 Cols de Vallée créent des points de rendez-vous naturels idéaux pour les alliances de sabotage. |
| **Grille Hexagonale Fixe à 19 Cases** | 49/100 | 86/100 | 85/100 | Plafond stratégique maximal pour les bots IS-MCTS et Beam Rollout grâce aux 6 adjacences par hexagone, au prix d’une lecture un peu plus dense. |
| **Couronne Modulable Historique (1 Secteur/Joueur)** | 82/100 | 74/100 | 88/100 | Base saine à 4 joueurs mais souffre d’un étirement des distances à 5–6 joueurs et d’une manipulation de tuiles au montage. |

---

## 4. Recommandations d'Hybridations (Instanciables en 1 clic dans l'Atelier)

### 1. Hybride V0.3 × V0.2 — Plateau Double Face (3–4J/5–6J) + Jeton Éclaireur + Pose Alternée
- **Sources fusionnées** : V0.3 (Double Plateau) + V0.2 (Jeton Éclaireur) + V0.1 (Pose Alternée)
- **Justification** : Combine la meilleure architecture ergonomique et équilibrée 3–6J de la V0.3 (Plateau Double Face à diagonales d’entraide) avec le Jeton Éclaireur de la V0.2 et la Pose Alternée de la V0.1.
- **Bénéfices attendus** : Équilibre quasi invariant entre 3, 4, 5 et 6 joueurs (écart < 3,5 %). · Mise en place instantanée sans assemblage de tuiles. · Signalisation silencieuse d’une Lisière critique via le Jeton Éclaireur.

### 2. Hybride V0.3 × V0.1 — Clairières & Sentiers (3 Cols) + Sabotage en Alliance + Programmation Réactive
- **Sources fusionnées** : V0.3 (Clairières & Sentiers) + V0.1 (Sabotage en Alliance & Réaction)
- **Justification** : Le réseau de Clairières & Sentiers concentre les trajectoires des Machines sur 3 Cols de Vallée, ce qui rend la condition de Sabotage en Alliance (2 Défenseurs requis) naturelle et lisible de 3 à 6 joueurs.
- **Bénéfices attendus** : Forte prime à la coordination implicite (gain IS-MCTS / Expectimax maximal). · Verrous géographiques lisibles d’un seul coup d’œil autour de la table.

### 3. Hybride V0.3 × V0.2 — Grille Hexagonale 19 Cases + Peuples Asymétriques
- **Sources fusionnées** : V0.3 (Grille Hexagonale 19) + V0.2 (Peuples Asymétriques)
- **Justification** : La grille hexagonale à 19 cases offre 6 degrés de liberté aux hexagones intérieurs, valorisant pleinement l’asymétrie de mouvement et de protection des Peuples de la V0.2.
- **Bénéfices attendus** : Profondeur tactique maximale pour les joueurs experts. · Aucune redondance de trajectoire entre les Défenseurs.
