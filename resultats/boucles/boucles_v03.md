## Garde-fou : aucune boucle gagnante (lecture seule)

*Décision C1 (14 oct.) ; spécification `projet/3-pilotage/garde-fou-boucles-gagnantes.md`. Bandes proposées, provisoires : elles ne jugent pas. Écart = bot fort − meilleure stratégie répétée, apparié (mêmes tables, mêmes graines) ; vert ≥ 10 points, rouge < 3. Indice : un vert dit seulement qu'aucune boucle de la bibliothèque ne gagne.*

### l'ancre (bot fort de référence : fort:MC64R1 ; 138 stratégies)

| Joueurs | Bot fort | Meilleure boucle | Écart apparié | Meilleure boucle ouverte | Meilleure convention | Réflexe | Marches ouverte → réflexe → fort |
|---|---|---|---|---|---|---|---|
| 2 | 89,7 | glouton:reves=1.0 : 84,7 | +5,0 [1,4 ; 8,7] | voie:reveil|reves:1 : 84,3 | convention:barrage_sabotage|reves:1 : 70,4 | glouton:reves=1.0 : 84,7 | +0,4 / +5,0 |
| 3 | 96,4 | glouton:reves=1.0 : 91,4 | +5,1 [1,2 ; 9,2] | action:saboter|zone:depart|mode:plateau|reves:1 : 90,2 | convention:alliance|zone:depart|reves:1 : 88,1 | glouton:reves=1.0 : 91,4 | +1,2 / +5,1 |
| 4 | 92,5 | glouton:reves=0.5 : 93,7 | -1,2 [-6,3 ; 3,6] | action:saboter|zone:depart|mode:plateau|reves:1 : 92,1 | convention:alliance|zone:depart|reves:1 : 87,7 | glouton:reves=0.5 : 93,7 | +1,6 / -1,2 |
| 5 | 93,5 | glouton:reves=0.5 : 96,4 | -3,0 [-8,9 ; 4,2] | action:saboter|zone:depart|mode:machines|reves:1 : 90,5 | convention:alliance|zone:depart|reves:1 : 90,5 | glouton:reves=0.5 : 96,4 | +6,0 / -3,0 |
| 6 | 98,8 | glouton:reves=1.0 : 98,8 | +0,0 [-3,6 ; 3,6] | action:saboter|zone:depart|mode:machines|reves:1 : 92,9 | convention:alliance|zone:depart|reves:1 : 92,9 | glouton:reves=1.0 : 98,8 | +6,0 / +0,0 |

- **Écart à la meilleure boucle** (pire taille, 5 joueurs) : -3,0 points → rouge (proposé).
- **Aucune convention de table ne suffit** (pire composition, mammiferes+reptiles+humains+entites, 4 parties) : « convention:alliance|zone:depart|reves:1 », -1,2 points → rouge (proposé).
- **Une action ne suffit pas** (la plus proche : saboter partout, 4 joueurs) : +0,4 points, 100 % du bot fort → rouge (proposé).
- **Échelle de la lecture** (plus petite marche) : -3,0 points → rouge (proposé).
- **Réflexes de rêve, test T3 léger** (la meilleure règle simple qui lit la situation, contre la meilleure politique d'horloge, taux fixes et horaires ; apparié) : 2 j. : « jugement:si=esprit_proche|reves=1.0 » − « glouton:reves=1.0 » = -10,9 (sûr) ; 3 j. : « jugement:si=hors_portee|reves=1.0 » − « glouton:reves=1.0 » = -9,5 (sûr) ; 4 j. : « jugement:si=calme|reves=1.0 » − « glouton:reves=0.5 » = -6,3 (sûr) ; 5 j. : « jugement:si=esprit_proche|reves=1.0 » − « glouton:reves=0.5 » = -3,6 (sûr) ; 6 j. : « jugement:si=calme|reves=1.0 » − « glouton:reves=1.0 » = -2,4 (incertain).

**Alertes (lecture seule)** : 

- **boucle gagnante (garde-fou C1, lecture seule)** : l'ancre, à 5 joueurs, la stratégie répétée « glouton:reves=0.5 » est à -3,0 points du bot fort.
- **convention de table gagnante (C1, lecture seule)** : l'ancre, table mammiferes+reptiles+humains+entites, « convention:alliance|zone:depart|reves:1 » à -1,2 points du bot fort (4 parties).

