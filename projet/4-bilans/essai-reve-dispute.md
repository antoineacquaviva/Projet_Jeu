# Essai « le rêve disputé » : bilan et grille de réglage

*14 oct. 2026, 17 h 50. Rédigé par Claude. Proposition : [proposition-le-reve-dispute.md](../2-maquettes/proposition-le-reve-dispute.md) ; méthode du test : [choix-strategique-premieres-lectures.md](choix-strategique-premieres-lectures.md), section 3. Section 3 complétée le 14 oct., 20 h 40 (grille lue).*

## En bref
- **Dans ses réglages d'origine, le rêve disputé ne crée pas de dilemme.** Joué par le bot fort, rêver redevient dominant (+11,5 points, sûr) et décider à chaque tour ne rapporte rien (−3,4, incertain). Le critère de la proposition (au moins 5 points gagnés en décidant tour par tour) n'est pas atteint.
- **Le mécanisme existe, mais il a trop peu de temps pour agir.** Avec les bots simples, le tir à la corde passe de 0,21 à 1,35 par partie. Avec le bot fort, il tombe à 0,16 à 0,20, parce que le bot atteint le long sommeil vers le tour 4, avant que le cauchemar ait le temps de jouer.
- **La grille (campagne 31, lue le 14 oct., 20 h 40) ne retient aucun réglage.** Le sablier brise la domination du rêve, mais le jugement ne rapporte jamais plus de +3 points, et cet écart est incertain. Les reculs d'esprit restent sous 0,25 par partie. Il faut revoir la règle, pas la régler (section 3).
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
*Lu le 14 oct. 2026, 20 h 40 (session interactive, Opus). Campagne 31, run 38596118170 : 768 parties, 128 lots, toutes les tâches réussies. Synthèse : `campagnes/reve_dispute_grille_run31/synthese.json` (branche resultats), lue par `scripts/analyse_grille_reve.py`.*

**Verdict : aucun réglage retenu, et aucun ne s'approche du seuil.** Le meilleur gain du jugement est de +3,0 points, incertain (3 lunes, cauchemar d'une case, sablier). Les reculs d'esprit restent entre 0,03 et 0,25 par partie, loin du « au moins un ». Seul le critère du sommeil tardif est rempli, par cinq réglages sur huit.

| Réglage | Rêve 1 − rêve 0 | Libre − meilleur fixe | Régime | Reculs / partie | Sommeil avant T4 | Forêt (libre) | Critères |
|---|---|---|---|---|---|---|---|
| 3 lunes, cauchemar 1, 2 rêve(s)/pas | -1,8 [-7,4 ; 3,7] (incertain) | +3,0 [-2,8 ; 9,5] (incertain) | indifférent | 0,07 | 0 % | 74,1 % | 1/3 (gain, recul manque) |
| 3 lunes, cauchemar 2, 2 rêve(s)/pas | -4,3 [-10,3 ; 1,8] (incertain) | +1,6 [-4,6 ; 8,5] (incertain) | indifférent | 0,12 | 0 % | 72,8 % | 1/3 (gain, recul manque) |
| 3 lunes, cauchemar 2, 1 rêve(s)/pas | +15,5 [6,4 ; 24,7] (sûr) | +0,7 [-5,5 ; 6,5] (incertain) | dominé par rêver | 0,16 | 34 % | 84,5 % | 0/3 (gain, recul, sommeil manque) |
| 2 lunes, cauchemar 2, 1 rêve(s)/pas | +11,3 [1,9 ; 20,2] (sûr) | -0,5 [-6,7 ; 5,7] (incertain) | dominé par rêver | 0,25 | 19 % | 79,2 % | 1/3 (gain, recul manque) |
| v0.4rd (3 lunes, cauchemar 1, 1 rêve/pas) | +22,9 [15,3 ; 31,2] (sûr) | -1,9 [-5,2 ; 1,6] (incertain) | dominé par rêver | 0,12 | 34 % | 88,4 % | 0/3 (gain, recul, sommeil manque) |
| 2 lunes, cauchemar 2, 2 rêve(s)/pas | -3,0 [-9,2 ; 3,7] (incertain) | -2,5 [-8,3 ; 3,7] (incertain) | indifférent | 0,03 | 0 % | 68,6 % | 1/3 (gain, recul manque) |
| 2 lunes, cauchemar 1, 2 rêve(s)/pas | +0,1 [-4,8 ; 5,1] (incertain) | -3,4 [-10,4 ; 3,4] (incertain) | indifférent | 0,08 | 0 % | 67,9 % | 1/3 (gain, recul manque) |
| 2 lunes, cauchemar 1, 1 rêve(s)/pas | +19,5 [12,8 ; 26,8] (sûr) | -5,1 [-9,8 ; -0,6] (sûr) | dominé par rêver | 0,22 | 21 % | 81,8 % | 0/3 (gain, recul, sommeil manque) |

Intervalles à 95 % entre crochets. Colonne « Critères » : nombre de critères remplis, puis ceux qui manquent.

**Effet moyen de chaque levier** (moyenne des quatre réglages avec le levier, moins celle des quatre sans) :
| Levier | Rêve 1 − rêve 0 | Libre − meilleur fixe | Reculs / partie | Sommeil avant T4 | Forêt (libre) |
|---|---|---|---|---|---|
| Sablier (2 rêves pour un pas) | −19,6 | +1,4 | −0,11 | −27 points | −12,6 points |
| Cauchemar de 2 cases | −5,3 | +1,7 | +0,02 | −0,5 point | −1,8 point |
| 2 lunes au lieu de 3 | −1,1 | −3,7 | +0,03 | −7 points | −5,6 points |

**Lecture.**
- **Le sablier est le seul levier qui brise la domination du rêve**, mais il ne fait pas payer le jugement. Avec lui, rêver n'est plus dominant (régime « indifférent »), la course au sommeil disparaît (0 % avant le tour 4) et la forêt baisse de 12 points. Aucun levier ne fait monter le gain du jugement de plus de 2 points en moyenne. Moins de lunes le fait même baisser.
- **Le cauchemar ne joue presque jamais avec le bot fort, quel que soit le réglage.** Le sablier devait lui laisser le temps d'agir. Il réduit au contraire les reculs : l'esprit avance moins, il y a donc moins à faire reculer. Le mécanisme central de la règle reste rare, ce qui va contre l'hypothèse de la proposition.
- **Réserves.** Avec 2 parties par table, les intervalles du gain font environ ±6 points. Le meilleur réglage (+3,0, intervalle de −2,8 à +9,5) ne peut donc pas être exclu du seuil. Le critère des reculs, lui, échoue d'un facteur 4 au moins partout, et un échantillon plus grand n'y changera rien. Dans les réglages d'origine, la domination du rêve mesure +22,9 ici, contre +11,5 dans les campagnes 28 à 30 : l'échantillon n'est pas le même (P2 à 2 parties contre l'échantillon du T3). Le sens est le même.

**Suite selon la règle de la section 2.** C'est le troisième cas : aucun réglage ne s'approche du seuil. Il faut revoir la règle elle-même, et ni MAP-Elites ni une grille prolongée n'y suppléeront. **Rien n'a été lancé**, et la confirmation au bot de contrôle est sans objet.

## 4. Décision attendue
**DÉCISION UTILISATEUR** sur le rêve disputé. Trois options :
- **A. Écarter la règle dans sa forme actuelle et revenir à la conception** (recommandé). Les deux enseignements sont à garder pour la suite. Le sablier est un vrai frein à la course au sommeil. En revanche, un mécanisme d'interaction qui ne se déclenche qu'en cours de route est court-circuité par le bot fort. Une nouvelle proposition devrait rendre la dispute fréquente par construction, et non par réglage.
- **B. Prolonger la grille sur le sablier et le cauchemar** (3 rêves pour un pas, cauchemar de 3 cases), avec 4 parties par table. Coût : une campagne d'environ 2 h. Faible espoir, puisque les reculs sont trop rares partout.
- **C. Adopter un réglage pour le cycle 2.** Déconseillé : aucun ne remplit les critères.
