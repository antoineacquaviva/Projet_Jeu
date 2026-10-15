# Proposition : le Gentil réparti entre 2 et 6 joueurs

*15 oct. 2026, 21 h 30. Réponse à l'auteur : une seule proposition synthétique, qui change le moins d'éléments possible du modèle « placement » (`docs/regles_placement.md`) et laisse des réglages pour plus tard. **Statut : retenue par l'auteur le 15 oct., 21 h 47, comme modèle de la campagne 2** (modèle d'étude ; aucune règle du jeu adoptée). Codée dans `placement/` (P1.1 bis, P1.3 bis, P1.4 bis, P2.1 bis de `docs/regles_placement.md`). Elle reprend les pistes 1 à 3 de `projet/3-pilotage/nombre-de-joueurs-pistes.md` (le « kit par joueur »).*

## Le principe
Chaque joueur apporte son kit : **une tuile de forêt, deux individus et une Machine**. Le Méchant ajoute une Machine. Il n'y a rien d'autre à régler selon le nombre de joueurs.

## Ce qui change (quatre points)

| | Modèle codé (étude 1) | Proposition |
|---|---|---|
| 1. Plateau (P1.1) | une grille fixe de 5 × 5 cases | **une tuile de 3 × 4 cases par joueur**, posées en couronne autour d'une case **Cœur** commune ; la rangée intérieure touche le Cœur, la rangée extérieure est la lisière, les colonnes de bord touchent les tuiles voisines |
| 2. Gentil (P1.4, P3.1) | 3 individus, 2 ordres par tour pour toute la table | **chaque joueur a 2 individus et donne 1 ordre par tour, à l'un des siens** (en secret, en même temps que les autres). Les individus partent sur la tuile de leur joueur, puis vont où ils veulent |
| 3. Machines (P1.3) | 3 Machines | **une Machine par joueur, plus une** : chacune entre sur la lisière de sa tuile, la Machine en plus sur une lisière tirée au dé |
| 4. Menaces (P2) | 5 menaces annoncées (Machine au dé, tactique tirée), dont 3 partent | **chaque Machine fait une menace par tour** : on retourne une carte de tactique devant chacune (l'annonce), et seul l'ordre d'exécution reste caché |

## Ce qui ne change pas
Les trois ordres (Garder, Aller, Saboter), la résolution automatique et ses tactiques (P4), le rayon et le repli, le sabotage qui laisse la Machine s'échapper, 3 arbres par case, 8 tours, le décompte de la forêt restante. La borne du tour (P5.1) tient toujours : n = J + 1 menaces contre k = J ordres, donc au moins un arbre tombe à chaque tour.

## Ce que cela donne selon la table

| Joueurs | Cases (avec le Cœur) | Individus | Ordres par tour | Machines = menaces par tour |
|---|---|---|---|---|
| 2 | 25 | 4 | 2 | 3 |
| 3 | 37 | 6 | 3 | 4 |
| 4 | 49 | 8 | 4 | 5 |
| 5 | 61 | 10 | 5 | 6 |
| 6 | 73 | 12 | 6 | 7 |

À deux joueurs, on retrouve presque le modèle codé : 25 cases, 2 ordres, 3 Machines, 3 menaces. Il n'y a qu'un individu de plus, et l'annonce dit exactement quelles menaces partiront.

## Les réglages laissés pour plus tard
- **Machines** : J + 1 (proposé), J + 2, ou J. Avec J Machines, il faut deux menaces par Machine, sinon on peut parer toutes les menaces et le plancher d'un arbre par tour disparaît (P5.1).
- **Menaces par Machine** : 1 (proposé) ou 2 (n = 2J + 2). La sonde montre qu'une pression plus forte rend le placement plus utile et la forêt plus disputée.
- **Taille de la tuile** : 3 × 3, 3 × 4 (proposé), 4 × 4. Elle règle le couplage entre voisins.
- **Le Cœur** : une case, ou une petite tuile, avec plus d'arbres.
- **Individus par joueur** : 2 (proposé) ou 3. Il en faut plus que d'ordres : avec un seul, l'annonce ne sert plus dès 3 joueurs (sonde, `projet/3-pilotage/nombre-de-joueurs-pistes.md`, section 4).
- Arbres par case, tours, annonce partielle (m = n + 1, en cachant une carte).

## Ce qui est mesuré et ce qui ne l'est pas
- **Mesuré** (famille F de la sonde, plateau rectangulaire d'environ 12 cases par joueur) : de 2 à 6 joueurs, l'annonce reste utile (7 à 11 points), la lecture et la profondeur sont vertes, la difficulté est stable (57 à 66 % de parades pour le meilleur bot).
- **Point faible** : l'intérêt de se déplacer est orange (2 à 4,5 points).
- **Non mesuré** : la couronne et le Cœur, et la règle « une menace par Machine ». C'est le premier travail de la campagne 2 :
  - coder la géométrie en tuiles ;
  - jouer de 2 à 6 joueurs avec les mesures de l'étude 1, plus l'agence (chaque joueur sauve-t-il des arbres ?) et le couplage (part des parades faites hors de sa tuile) ;
  - comparer Machines = J + 1 et J + 2, et 1 ou 2 menaces par Machine.
