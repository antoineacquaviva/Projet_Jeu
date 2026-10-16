## Garde-fou : aucune boucle gagnante (lecture seule)

*Décision C1 (14 oct.) ; spécification `projet/3-pilotage/garde-fou-boucles-gagnantes.md`. Bandes proposées, provisoires : elles ne jugent pas. Écart = bot fort − meilleure stratégie répétée, apparié (mêmes tables, mêmes graines) ; vert ≥ 10 points, rouge < 3. Indice : un vert dit seulement qu'aucune boucle de la bibliothèque ne gagne.*

### l'ancre (bot fort de référence : aucun ; 138 stratégies)

| Joueurs | Bot fort | Meilleure boucle | Écart apparié | Meilleure boucle ouverte | Meilleure convention | Réflexe | Marches ouverte → réflexe → fort |
|---|---|---|---|---|---|---|---|
| 2 | – | reflexe:barrer|reves:0 : 68,0 | – | action:saboter|zone:depart|mode:plateau|reves:1 : 56,8 | convention:barrage_sabotage|reves:0 : 51,2 | reflexe:barrer|reves:0 : 68,0 | – / – |
| 3 | – | reflexe:barrer|reves:1 : 91,4 | – | action:saboter|zone:depart|mode:plateau|reves:1 : 89,3 | convention:barrage_sabotage|reves:1 : 88,1 | reflexe:barrer|reves:1 : 91,4 | – / – |
| 4 | – | action:saboter|zone:depart|mode:plateau|reves:1 : 86,9 | – | action:saboter|zone:depart|mode:plateau|reves:1 : 86,9 | convention:barrage_sabotage|reves:1 : 76,2 | reflexe:barrer|reves:1 : 84,9 | – / – |
| 5 | – | action:barrer|zone:depart|mode:plateau|reves:1 : 94,6 | – | action:barrer|zone:depart|mode:plateau|reves:1 : 94,6 | convention:alliance|zone:depart|reves:1 : 88,7 | glouton:reves=1.0 : 93,5 | – / – |
| 6 | – | action:barrer|zone:depart|mode:machines|reves:1 : 97,6 | – | action:barrer|zone:depart|mode:machines|reves:1 : 97,6 | convention:alliance|zone:depart|reves:1 : 95,2 | glouton:reves=1.0 : 94,0 | – / – |

- **Réflexes de rêve, test T3 léger** (la meilleure règle simple qui lit la situation, contre la meilleure politique d'horloge, taux fixes et horaires ; apparié) : 2 j. : « jugement:si=esprit_proche|reves=1.0 » − « glouton:reves=0.0 » = +0,0 (négligeable) ; 3 j. : « jugement:si=calme|reves=1.0 » − « horaire:reves=1.0|tours=2-fin » = -6,0 (sûr) ; 4 j. : « jugement:si=calme|reves=1.0 » − « horaire:reves=1.0|tours=2-fin » = -22,6 (sûr) ; 5 j. : « jugement:si=esprit_proche|reves=1.0 » − « glouton:reves=1.0 » = -20,2 (sûr) ; 6 j. : « jugement:si=esprit_proche|reves=1.0 » − « glouton:reves=1.0 » = -32,1 (sûr).

**Alertes (lecture seule)** : aucune.

