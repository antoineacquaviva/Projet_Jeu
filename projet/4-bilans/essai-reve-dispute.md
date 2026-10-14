# Essai « le rêve disputé » : bilan et grille de réglage

*14 oct. 2026, 17 h 50. Rédigé par Claude. Proposition : [proposition-le-reve-dispute.md](../2-maquettes/proposition-le-reve-dispute.md) ; méthode du test : [choix-strategique-premieres-lectures.md](choix-strategique-premieres-lectures.md), section 3. La section 3 de ce bilan sera complétée à la lecture de la grille (ETAT.md, étape 3 ter).*

## En bref
- **Dans ses réglages d'origine, le rêve disputé ne crée pas de dilemme.** Joué par le bot fort, rêver redevient dominant (+11,5 points, sûr) et décider à chaque tour ne rapporte rien (−3,4, incertain). Le critère de la proposition (au moins 5 points gagnés en décidant tour par tour) n'est pas atteint.
- **Le mécanisme existe, mais il a trop peu de temps pour agir.** Avec les bots simples, le tir à la corde passe de 0,21 à 1,35 par partie. Avec le bot fort, il tombe à 0,16 à 0,20, parce que le bot atteint le long sommeil vers le tour 4, avant que le cauchemar ait le temps de jouer.
- **Décision de l'auteur (14 oct., 17 h 47)** : avant de juger la règle, tester ses réglages sur une grille complète, avec le test qui fait foi pour le rêve. MAP-Elites n'interviendra qu'ensuite, et seulement si la grille montre une zone prometteuse.

## 1. Ce qui a été mesuré (réglages d'origine : 3 lunes, cauchemar d'une case, un rêve pour un pas)
| Lecture | V0.4 | V0.4rd | Source |
|---|---|---|---|
| Rêve 1 − rêve 0 (bot fort, partie entière) | −7,4 (sûr) : défendre domine | **+11,5 (sûr) : rêver domine** | campagnes 23 à 30 |
| Libre − meilleur fixe | +1,6 (incertain) | −3,4 (incertain) | idem |
| Tir à la corde et cauchemar, par partie (bots simples) | 0,21 | 1,35 | bibliothèque, calcul local |
| Idem, bot fort | – | 0,16 à 0,20 | campagnes 21 et 24 |
| Sommeil vers le tour 4 (bot fort) | – | 67 à 81 % des parties | idem |
| Une règle simple de rêve bat-elle l'horloge ? (T3 léger) | non | non | bibliothèque |

## 2. Grille de réglage (lancée le 14 oct., 18 h)
**Pourquoi une grille plutôt que MAP-Elites.** L'espace est petit (trois leviers à deux valeurs). Le critère, le gain du jugement, ne se mesure qu'en partie entière avec le bot fort, et l'instrument bon marché (glouton) est justement celui qui a trompé les premières lectures. MAP-Elites, rempli au glouton, chercherait les réglages qui trompent le mieux cet instrument.

**Plan factoriel 2 × 2 × 2** sur `v0.4rd` (campagne `campagnes/reve_dispute_grille.json`) :
| Levier | Valeurs | Idée |
|---|---|---|
| Lunes | 3 (d'origine), 2 | moins de rêveurs par tour : la course au sommeil ralentit |
| Cauchemar | 1 case (d'origine), 2 cases (`cauchemar_cases`, ajouté au moteur) | chaque réussite côté rêve repousse plus fort l'esprit |
| Rêves pour un pas | 1 (d'origine), 2 (retour du sablier) | l'esprit avance moins vite, le cauchemar a le temps d'agir |

Chaque réglage est joué par les trois instruments du test T3 complet, validé sur les témoins V0.3 et V0.4 : MC64R, MC 64 dont les suites ne rêvent jamais, et MCP64 à portefeuille (le bot « libre »). Échantillon P2 : 16 tables de 2 à 6 joueurs, 2 parties par table, mêmes tables et graines pour tout. Soit 768 parties.

**Critères (ceux de la proposition, section 6)** : un réglage est retenu s'il remplit les trois.
1. Gain du jugement (libre − meilleur fixe) **sûr et d'au moins 5 points**.
2. Au moins **un recul d'esprit par partie** (tir à la corde et cauchemar).
3. Long sommeil avant le tour 4 dans **moins de 20 %** des parties.

Lecture : `python scripts/analyse_grille_reve.py <synthèse>`.

**Suite selon le résultat.**
- **Un ou plusieurs réglages retenus** : les rejouer avec le bot de contrôle (MC 256 à portefeuille) sur un échantillon plus grand, pour que le verdict ne dépende pas de l'instrument. Puis, si un compromis se dessine, MAP-Elites autour de cette zone, avec le test T3 complet sur les finalistes seulement. La règle réglée est alors soumise à l'auteur pour le cycle 2.
- **Aucun réglage retenu, mais un gain qui monte avec un levier** : prolonger la grille sur ce levier (une lune, cauchemar de trois cases…).
- **Aucun réglage ne s'approche du seuil** : c'est la règle elle-même qu'il faut revoir ; aucun algorithme d'exploration ne réglera le problème. Retour à la conception.

## 3. Résultats de la grille
*À compléter à la lecture (passage suivant).*

## 4. Décision attendue
Après la grille : **DÉCISION UTILISATEUR** sur le rêve disputé (adopter un réglage pour le cycle 2, prolonger la recherche, ou écarter la règle).
