## Garde-fou : aucune boucle gagnante (lecture seule)

*Décision C1 (14 oct.) ; spécification `projet/3-pilotage/garde-fou-boucles-gagnantes.md`. Bandes proposées, provisoires : elles ne jugent pas. Écart = bot fort − meilleure stratégie répétée, apparié (mêmes tables, mêmes graines) ; vert ≥ 10 points, rouge < 3. Indice : un vert dit seulement qu'aucune boucle de la bibliothèque ne gagne.*

### l'ancre (bot fort de référence : fort:MC256P ; 138 stratégies)

| Joueurs | Bot fort | Meilleure boucle | Écart apparié | Meilleure boucle ouverte | Meilleure convention | Réflexe | Marches ouverte → réflexe → fort |
|---|---|---|---|---|---|---|---|
| 2 | 81,9 | reflexe:barrer|reves:0 : 68,0 | +13,9 [5,4 ; 22,2] | tromper:toujours|reves:0 : 51,8 | convention:barrage_sabotage|reves:0 : 51,2 | reflexe:barrer|reves:0 : 68,0 | +16,3 / +13,9 |
| 3 | 95,5 | glouton:reves=0.0 : 83,9 | +11,6 [6,0 ; 17,9] | action:saboter|zone:depart|mode:plateau|reves:0 : 60,4 | convention:saboteur_unique : 54,5 | glouton:reves=0.0 : 83,9 | +23,5 / +11,6 |
| 4 | 82,5 | reflexe:barrer|reves:1 : 76,6 | +6,0 [0,0 ; 12,3] | action:barrer|zone:depart|mode:machines|reves:1 : 68,7 | convention:barrage_sabotage|reves:1 : 62,7 | reflexe:barrer|reves:1 : 76,6 | +7,9 / +6,0 |
| 5 | 89,3 | action:saboter|zone:depart|mode:plateau|reves:1 : 73,8 | +15,5 [1,8 ; 31,6] | action:saboter|zone:depart|mode:plateau|reves:1 : 73,8 | convention:alliance|zone:depart|reves:1 : 65,5 | glouton:reves=1.0 : 73,2 | -0,6 / +16,1 |
| 6 | 91,7 | action:saboter|zone:depart|mode:plateau|reves:1 : 82,1 | +9,5 [0,0 ; 19,1] | action:saboter|zone:depart|mode:plateau|reves:1 : 82,1 | convention:alliance|zone:depart|reves:1 : 72,6 | reflexe:saboter|reves:1 : 81,0 | -1,2 / +10,7 |

- **Écart à la meilleure boucle** (pire taille, 4 joueurs) : +6,0 points → orange (proposé).
- **Aucune convention de table ne suffit** (pire composition, humains+entites, 4 parties) : « convention:saboteur_unique », +15,5 points → vert (proposé).
- **Une action ne suffit pas** (la plus proche : saboter partout, 6 joueurs) : +9,5 points, 90 % du bot fort → vert (proposé).
- **Échelle de la lecture** (plus petite marche) : -1,2 points → rouge (proposé).

**Alertes (lecture seule)** : aucune.

