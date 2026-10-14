# Protocole P3 : analyse de la V0.4 contre son ancre V0.3 (étape a.3)

*14 oct. 2026, 13 h 30. Lancements : campagne 19 (ligne_base_p2 sur v0.4, 480 parties), campagne 20 (ligne_base_p2 sur v0.3, ancre, 544 parties), batterie 7 (programme p3, 1 336 parties, 0 erreur). Moteur 1.8. Bot fort : MC64R. Les valeurs sont des **indices** (4 parties par table ; intervalles à 95 %).*

## En bref
- **La V0.4 garde nettement moins de forêt que la V0.3 : de −17 à −31 points selon la taille de table, écart sûr dans chaque taille.** Le tour de fin moyen reste proche du dernier tour (5 à 6).
- **Le rêve ne domine plus** : en V0.3, rêver chaque tour est le meilleur choix ; en V0.4, rêver 0 et rêver 1 sont à égalité. Le problème est donc levé, mais le choix de rêver paraît sans enjeu (alerte E).
- **Les autres mesures** : la surprise et la concentration restent vertes. Deux mesures virent à l'orange en V0.4 (contribution des peuples, spectateur), et le gain du bot libre passe au rouge.
- **Décision de l'auteur (14 oct., 13 h 28)** : la baisse de la forêt est acceptable.

## 1. Forêt par taille de table (bot fort MC64R, apparié)

| Taille | 2 j. | 3 j. | 4 j. | 5 j. | 6 j. |
|---|---|---|---|---|---|
| V0.3 (ancre) | 89,7 % (tour 3,8) | 96,4 % (tour 3,8) | 92,5 % (tour 5,1) | 93,5 % (tour 5,8) | 98,8 % (tour 6,0) |
| V0.4 | 72,8 % (tour 6,0) | 80,1 % (tour 6,0) | 61,1 % (tour 5,3) | 73,8 % (tour 5,9) | 82,2 % (tour 5,8) |

**Écart apparié V0.4 − V0.3** (points de forêt ; mêmes tables et mêmes graines ; intervalle à 95 % apparié) :

| Taille | Paires | Écart | Intervalle 95 % | Verdict |
|---|---|---|---|---|
| toutes | 64 | -19,8 | [-23.81, -15.85] | sûr |
| 2 j. | 24 | -16,9 | [-22.82, -10.91] | sûr |
| 3 j. | 16 | -16,4 | [-21.43, -11.61] | sûr |
| 4 j. | 12 | -31,4 | [-44.45, -18.26] | sûr |
| 5 j. | 8 | -19,6 | [-28.57, -10.72] | sûr |
| 6 j. | 4 | -16,7 | [-28.57, -4.76] | sûr |

Lecture : la baisse existe à toutes les tailles, la plus forte à 4 joueurs (−31 points). Le tour de fin ne change guère : la V0.4 rend les parties plus difficiles, sans les rallonger de façon nette.

## 2. Mesures de la batterie 7 (objectifs 1 à 3)

| Mesure | V0.3 (ancre) | V0.4 | Verdict V0.4 |
|---|---|---|---|
| Concentration | 75,4 % (± 2,2) | 73,6 % (± 2,2) | vert |
| Surprise | 42,6 % (589 ordres) | 36,5 % (1 291 ordres) | vert |
| Tape-taupe (écart fort − parer au plus probable) | 4,6 points (taux de rêve 1) | 4,6 points (taux de rêve 0) | orange |
| Gain du bot libre sur le meilleur taux fixe | +2,4 points (orange) | −1,3 point | rouge |
| Meilleur taux de rêve fixe (duos et trios) | 1,0 (89,8 %) | 0 (73,3 %), 1,0 à égalité (70,6 %) | rouge |
| Incertitude (variance au tour 5) | rouge (80 % des parties finies avant le tour 5) | 1,21 | vert |
| Répartition des contributions (Shapley) | vert (écart max 0,12) | écart max 0,49 : insectes 0,51, mammifères et reptiles 1,35 | orange |
| Effet du spectateur | 0,79 | 0,29 | orange |
| Prévisibilité | 62 % | 54,5 % | vert |

Ces verdicts sont ceux du rapport automatique (`batterie/run7_p3/rapport.json`). Ils restent des indices.

## 3. Lecture
- **Pourquoi la forêt baisse.** La V0.4 ajoute les ordres supplémentaires du Méchant et le sablier des rêves (décision du 13 oct.). La baisse est cohérente avec le cycle 1, qui avait choisi la V0.4 pour freiner le rêve. Elle était attendue dans son ordre de grandeur, pas dans son ampleur.
- **Le rêve.** La dominance est levée : c'est le résultat recherché au cycle 1. Mais rêver ne rapporte plus rien non plus, et l'équipe pourrait ne pas avoir de dilemme sur ce point.
- **Les contributions.** Les peuples n'apportent pas la même chose : les insectes pèsent deux fois moins que les mammifères et les reptiles. C'est un point de déséquilibre, à traiter au cycle 2 (priorité « équilibre des peuples »).
- **Le spectateur** a moins d'impact en V0.4 : un joueur inactif compte moins qu'avant. À surveiller.

## 4. Alerte E : décision à prendre par l'auteur
Définition (ETAT, section 5) : si le meilleur taux de rêve fixe vaut 0 à 2 et 3 joueurs, l'alerte est confirmée et devient une décision de l'auteur.
- Résultat : le meilleur taux est **0** (et 1,0 fait jeu égal), sur les duos et les trios. **L'alerte est confirmée.**
- Options : (A) accepter que le rêve soit peu intéressant et le traiter au cycle 2 par un prix supplémentaire (proposition déjà écrite dans l'alerte A) ; (B) imposer un coût au rêve dès le cycle 2 ; (C) garder la V0.4 en l'état et tester les deux autres options au cycle 2.
- **Recommandation de Claude : A.** Le cycle 2 peut tester un prix du rêve sans changer de version, et les autres effets (forêt, difficulté) sont déjà jugés acceptables par l'auteur.

## 5. Limites
- 4 parties par table : les intervalles restent larges, surtout à 5 et 6 joueurs (4 à 8 paires).
- Le bot fort est le même pour les deux versions : une version pourrait être jouée par un autre bot de façon différente. La calibration de la V0.4 (campagne 18) avait déjà montré que MC 256 à portefeuille est plus fort que MC64R (+13,8 points) : le constat sur la forêt est donc un majorant pour le joueur moyen, pas pour l'expert.
- La mesure « surprise » est calculée par la batterie, pas par les campagnes.

## Méthode
`scripts/analyse_p3.py <synthese V0.4> <synthese V0.3>` : mêmes tables et mêmes graines pour les deux versions, écart apparié par `foret.stats.ecart_apparie`, forêt par taille par `foret.cycle.metriques_variantes`. Le rapport de la batterie 7 est publié sur la branche `resultats` (`batterie/run7_p3/`).
