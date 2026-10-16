# Essai « le somnambule » : bilan

Campagne 32 (`reve_somnambule`, run 38639000435, 576 parties, v0.4rd, échantillon P2 à 2 parties, trois instruments du T3 complet). Lecture faite par le réveil du 15 oct. (Sonnet) avec `scripts/analyse_grille_reve.py`. Critères de la proposition : gain du bot libre ≥ 5 points sur le meilleur taux fixe, au moins un recul ou ordre du somnambule par partie, sommeil avant le tour 4 dans moins de 20 % des parties.

## 1. Tableau

| Réglage | Rêve 1 − rêve 0 | Libre − meilleur fixe | Régime | Reculs / partie | Somnambule / partie (réussis) | Sommeil avant T4 | Forêt (libre) | Critères |
|---|---|---|---|---|---|---|---|---|
| v0.4rd + somnambule, qui apprend | -2,4 [-9,4 ; 5,4] (incertain) | +7,3 [0,5 ; 14,7] (sûr) | disputé (juger rapporte) | 0,07 | 0,47 (0,08) | 5 % | 75,0 % | 2/3 (riposte manque) |
| v0.4rd + somnambule, qui apprend, 3 présages | -11,0 [-18,2 ; -3,4] (sûr) | +3,0 [-3,7 ; 9,5] (incertain) | dominé par défendre | 0,14 | 0,49 (0,08) | 5 % | 77,2 % | 1/3 (gain, riposte manque) |
| v0.4rd + somnambule | +4,8 [-3,0 ; 12,8] (incertain) | +2,2 [-4,8 ; 8,5] (incertain) | indifférent | 0,17 | 1,47 (0,38) | 16 % | 77,1 % | 2/3 (gain manque) |
| v0.4rd + somnambule, 2 présages | +6,4 [-1,6 ; 15,0] (incertain) | +2,1 [-5,4 ; 9,4] (incertain) | indifférent | 0,12 | 1,49 (0,55) | 19 % | 78,1 % | 2/3 (gain manque) |
| v0.4rd + somnambule, 3 présages | +7,6 [-0,1 ; 15,5] (incertain) | +0,3 [-6,8 ; 7,3] (incertain) | indifférent | 0,15 | 1,14 (0,48) | 15 % | 76,3 % | 2/3 (gain manque) |
| v0.4rd (3 lunes, cauchemar 1, 1 rêve/pas) | +22,9 [15,3 ; 31,2] (sûr) | -1,9 [-5,2 ; 1,6] (incertain) | dominé par rêver | 0,12 | 0,00 (0,00) | 34 % | 88,4 % | 0/3 (gain, riposte, sommeil manque) |

## 2. Lecture

**Le somnambule fait naître un gain du jugement faible et incertain.** Seul « qui apprend » atteint un gain sûr (+7,3 points, intervalle 0,5 à 14,7) et un sommeil précoce rare (5 %), mais ses ordres sont presque absents (0,47 par partie, 0,08 réussi) : le critère de riposte manque, et le rêve n'y est plus dominé (écart rêve 1 − rêve 0 : −2,4, incertain). Les variantes sans apprentissage ont assez d'ordres (1,1 à 1,5 par partie) et un sommeil précoce acceptable (15 à 19 %), mais leur gain du jugement reste entre +0,3 et +2,2, incertain.

**Les présages n'augmentent pas le gain** (de +2,2 à +2,1 puis +0,3 avec 0, 2, 3 présages) ; avec l'apprentissage, 3 présages font basculer le régime vers « dominé par défendre » (rêve 1 − rêve 0 : −11,0, sûr). L'apprentissage rend le somnambule trop discret pour peser, sauf à rendre le rêve peu rentable.

**Aucun réglage ne remplit les trois critères** : le meilleur compromis est « qui apprend » (2/3, riposte manque). Mesuré : ces chiffres, au bot fort MC64R (suites qui rêvent à horloge fixe). Supposé : un bot qui lit les ordres du somnambule jouerait mieux la riposte ; non mesuré.

## 3. Suite

Aucun réglage retenu : pas de confirmation à préparer au MC 256 à portefeuille, rien lancé. Piste à discuter avec l'auteur : « qui apprend » avec un somnambule plus agressif au début (le gain sûr est le seul signal positif).

**DÉCISION UTILISATEUR** : A écarter le somnambule et revenir à la conception (recommandé par Claude : trois grilles et un essai sans réglage retenu) ; B prolonger « qui apprend » avec plus d'ordres au début, sans présages supplémentaires ; C adopter un réglage (déconseillé). Il faut aussi trancher entre V0.4 sans rêve disputé et nouvelle forme de la règle avant le plan du cycle 2.
