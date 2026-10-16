# Garde-fou « aucune boucle gagnante » : première lecture sur la V0.3 et la V0.4

*14 oct. 2026, 8 h 30. Décision C1 de l'auteur (ETAT.md, section 8) ; spécification : [garde-fou-boucles-gagnantes.md](../3-pilotage/garde-fou-boucles-gagnantes.md). Moteur 1.8 avec le bot `repete` et `foret/boucles.py`. **Lecture seule** : les bandes sont proposées, pas confirmées ; rien ne juge. Toutes les valeurs sont des **indices** (4 parties par table, 4 à 24 parties par taille).*

## Méthode
- **Bibliothèque** : 130 stratégies répétées par taille de table (une action partout, moitié fixe, 33 motifs de rêve, motifs d'étapes, Tromper, voie du rêve, 6 réflexes, 10 conventions de table), plus les trois gloutons du cycle comme réflexe de référence. 8 512 parties par version, jouées en 26 à 33 s sur 2 cœurs (calcul local, reproductible : `python -m foret.sim campagnes/boucles_v04.json`, puis `python -m foret.boucles analyser`).
- **Appariement au bot fort** : mêmes 16 tables (échantillon P2) et mêmes graines que la Campagne 18 (`calibration_v04`, quatre bots forts candidats) pour la V0.4, et que la Campagne 16 (`ligne_base_p2`, MC64R) pour la V0.3. Le bot fort de référence est le plus fort qui couvre les mêmes parties : **MC 256 à portefeuille** sur la V0.4, **MC64R** sur la V0.3.
- Mesures et JSON : `resultats/boucles/boucles_v04_analyse.json`, `boucles_v03_analyse.json`.

## Résultats
**Écart entre le bot fort et la meilleure stratégie répétée** (points de forêt, apparié ; intervalle à 95 %). Les gloutons comptent parmi les stratégies répétées : « parer au plus probable à rythme de rêve fixe » est une politique répétée (le tape-taupe en est le cas particulier).

| Joueurs | V0.3 : bot fort | V0.3 : meilleure boucle | V0.3 : écart | V0.4 : bot fort | V0.4 : meilleure boucle | V0.4 : écart |
|---|---|---|---|---|---|---|
| 2 | 89,7 | glouton, 1 rêve par tour : 84,7 | +5,0 [1,4 ; 8,7] | 81,9 | barrer au plus menacé, sans rêver (réflexe) : 68,0 | +13,9 [5,4 ; 22,2] |
| 3 | 96,4 | glouton, 1 rêve par tour : 91,4 | +5,1 [1,2 ; 9,2] | 95,5 | glouton sans rêve : 83,9 | +11,6 [6,0 ; 17,9] |
| 4 | 92,5 | glouton, 0,5 rêve par tour : 93,7 | **−1,2** [−6,4 ; 3,6] | 82,5 | barrer au plus menacé, 1 rêve par tour (réflexe) : 76,6 | **+6,0** [0,0 ; 12,3] |
| 5 | 93,5 | glouton, 0,5 rêve par tour : 96,4 | **−3,0** [−8,9 ; 4,2] | 89,3 | saboter, zone la plus menacée au départ, moitié plateau, 1 rêve : 73,8 | +15,5 [1,8 ; 31,6] |
| 6 | 98,8 | glouton, 1 rêve par tour : 98,8 | 0,0 [−3,6 ; 3,6] | 91,7 | même script : 82,1 | +9,5 [0,0 ; 19,1] |

Sur la V0.3, la meilleure **boucle ouverte** (qui ne lit pas la menace : saboter dans la zone la plus menacée au départ, rêver une carte par tour) est elle-même à 0,4 point du bot fort à 4 joueurs.

| Mesure (bandes proposées) | V0.3 | V0.4 |
|---|---|---|
| Écart à la meilleure boucle, pire taille (vert ≥ 10, rouge < 3) | **rouge** : −3,0 à 5 joueurs (le glouton fait mieux que MC64R) | **orange** : +6,0 à 4 joueurs |
| Aucune convention de table ne suffit, pire composition | rouge : l'alliance perpétuelle avec 1 rêve fait jeu égal (−1,2) sur une table de 4 | vert : +15,5 (4 parties par composition : signal faible) |
| Une action ne suffit pas | **rouge** : « saboter partout » à 0,4 point du bot fort (4 joueurs) | vert, de justesse : « saboter partout » à 90 % du bot fort (6 joueurs) |
| Échelle de la lecture, plus petite marche (vert ≥ 3, rouge < 1) | rouge : le réflexe bat le bot fort à 4 et 5 joueurs | rouge : à 5 et 6 joueurs, la boucle ouverte vaut le réflexe |

## Lecture
- **Le garde-fou voit le défaut connu de la V0.3** : une boucle ouverte (saboter dans la zone la plus menacée au départ, rêver une carte par tour) y fait jeu égal avec le bot fort à 4 joueurs, et le glouton à rythme de rêve fixe fait mieux que MC64R à 4 et 5 joueurs. C'est cohérent avec le diagnostic (le rêve à chaque tour domine, le jeu est trop facile) et avec le bilan du cycle 1 (MC64R joue mal quand son rythme de rêve imposé ne convient pas) : **la V0.3 sert de témoin réussi** (rouge attendu, rouge obtenu).
- **La V0.4 éloigne les boucles** : l'écart passe de 0,4 à 6,0 points à 4 joueurs, et dépasse 9 points ailleurs. Aucune alerte ne se lève. Mais 4 joueurs reste en orange, et l'intervalle touche 0 : à remesurer avec plus de parties au cycle 2.
- **À 5 et 6 joueurs, lire la menace ne rapporte rien aux gloutons** : une boucle ouverte vaut le réflexe. Le bot fort garde 10 à 16 points d'avance : la profondeur existe, mais la marche intermédiaire manque (un joueur moyen ne gagne rien à lire le jeu). C'est un indice, pas un défaut confirmé.
- **Ce qu'on ne sait pas encore** : les conventions de table sont jugées sur 4 parties par composition ; la recherche automatique de la meilleure boucle et la mesure « répétition punie » sont prévues pour la campagne de profondeur.

## Suite
- **Cycle 2** : l'étape `boucles` est désormais jouée automatiquement après le contrôle (`foret/cycle.py`), sur les finalistes et l'ancre, appariée au bot fort de la dernière manche ; son bloc figure dans le rapport, et une alerte se lève si une boucle ou une convention arrive à moins de 3 points du bot fort.
- **Bandes** : à confirmer par l'auteur (vert ≥ 10 points, rouge < 3). La V0.3 rouge et la V0.4 orange vont dans le sens attendu.
