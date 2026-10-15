# Modèle placement, étude 2 : le kit par joueur, de 2 à 6 joueurs

*15 oct. 2026, 22 h 40. Campagne 2 du modèle « placement », après le feu vert de l'auteur (21 h 47) sur la proposition `projet/2-maquettes/proposition-gentil-reparti.md`. Règles codées : P1.1 bis, P1.3 bis, P1.4 bis, P2.1 bis et P3.4 bis de `docs/regles_placement.md`. Calculs : Placement 7 (`campagnes/placement_kit.json`, 119 variantes × 64 parties × 9 bots, 14 min sur GitHub) et Placement 8 (`placement_kit_confirmation.json`, 20 variantes × 160 parties, graines neuves) ; test du choix disputé (T4) en local. Résultats : `resultats/placement/placement_kit_run7_*`, `placement_kit_confirmation_run8_*`, `dispute_kit*_J*.json`. **Modèle d'étude : aucune règle du jeu adoptée.** Seuils de lecture provisoires, gardés comme indices (décision 4).*

## En bref
- **La couronne règle le placement.** Se déplacer vaut 15 à 20 points à toutes les tailles de table, contre 2 à 4,5 sur les plateaux rectangulaires de la sonde. C'était le point faible attendu ; il disparaît.
- **Chaque joueur compte** : dans 99 à 100 % des parties, chaque joueur a paré au moins une menace.
- **Le nouveau point faible est la profondeur à grande table** : avec les réglages proposés (tuile 3 × 4, 2 individus, J + 1 Machines), une règle simple (« garder là où l'annonce frappe ») joue presque aussi bien que le bot fort dès 3 joueurs (1,8 à 3,4 points, orange ; vert à 5).
- **Un réglage tient de 2 à 6 joueurs**, confirmé à 160 parties : **J + 2 Machines, une menace par Machine, tuile 3 × 3, 3 individus par joueur.** Tous les critères sont verts de 2 à 5 joueurs ; à 6 joueurs, la profondeur est à 4,7 ± 0,7, juste sous le vert. La structure reste celle de la proposition ; seuls trois réglages bougent.
- **Deux menaces par Machine, c'est trop** : la maîtrise et l'information baissent, et la forêt finale tombe à 27 à 63 %.
- **À surveiller** :
  - **le couplage est faible** : 7 à 15 % des parades seulement sont faites hors de sa tuile. On défend surtout chez soi : c'est le risque des « solitaires côte à côte » ;
  - **l'enjeu baisse avec la taille de la table** : la forêt finale passe de 63 % à 2 joueurs à 79 % à 6 joueurs.

## 1. Ce qui a été codé
Le plateau en couronne (une tuile par joueur autour d'une case Cœur), les Machines qui entrent chacune sur la lisière de sa tuile, les individus qui partent sur la tuile de leur joueur, une menace par Machine et par tour (toutes annoncées, seul l'ordre est caché), un ordre par joueur à l'un de ses individus. Deux mesures nouvelles, en indices :
- **l'agence** : la part des joueurs qui ont paré au moins une menace dans la partie ;
- **le couplage** : la part des parades faites hors de la tuile du joueur, Cœur compris.

Le comportement de la grille de l'étude 1 est inchangé : c'est vérifié sur une empreinte de parties. Tests : 474 verts.

## 2. Le criblage (Placement 7)
Cinq facteurs : J de 2 à 6 ; Machines J + 1 ou J + 2 ; 1 ou 2 menaces par Machine ; tuile 3 × 3, 3 × 4 ou 4 × 4 ; 2 ou 3 individus par joueur. Cela fait 118 variantes ; 2 sont écartées parce que la forêt initiale ne dépasse pas n × t. La grille de l'étude 1 sert de référence.

**Effets moyens** (moyenne sur les autres facteurs) :

| Facteur | Niveau | Taux du bot fort | Profondeur | Info | Placement | Maîtrise | Forêt finale | Couplage | Variantes tout vert |
|---|---|---|---|---|---|---|---|---|---|
| Joueurs | 2 | 59 | 10,2 | 6,2 | 15,9 | 6,5 | 60 % | 10 % | 11 / 22 |
| | 4 | 53 | 7,4 | 4,9 | 14,0 | 3,9 | 66 % | 10 % | 2 / 24 |
| | 6 | 51 | 6,2 | 4,2 | 13,1 | 3,6 | 70 % | 10 % | 0 / 24 |
| Menaces par Machine | 1 | 56 | 4,5 | 6,0 | 18,1 | 5,6 | 81 % | 11 % | 17 / 60 |
| | 2 | 52 | 11,3 | 4,0 | 10,3 | 3,0 | 50 % | 9 % | 2 / 58 |
| Tuile | 3 × 3 | 61 | 8,9 | 6,8 | 12,6 | 4,0 | 59 % | 9 % | 12 / 38 |
| | 3 × 4 | 52 | 7,5 | 4,9 | 15,5 | 4,1 | 65 % | 10 % | 4 / 40 |
| | 4 × 4 | 50 | 7,2 | 3,5 | 14,7 | 4,8 | 73 % | 10 % | 3 / 40 |
| Machines | J + 1 | 53 | 7,7 | 4,4 | 13,9 | 4,7 | 69 % | 11 % | 7 / 60 |
| | J + 2 | 55 | 8,0 | 5,7 | 14,6 | 3,9 | 62 % | 9 % | 12 / 58 |

Ce qui limite les variantes qui ne sont pas toutes vertes : la profondeur (36 fois), la maîtrise (35 fois, surtout avec deux menaces par Machine) et l'information (28 fois). Le placement, la lecture et la difficulté ne limitent jamais. **Une tuile plus petite rend l'annonce plus utile.** *Supposé* : sur une tuile 3 × 3, chaque case est à deux pas au plus des autres, donc presque chaque menace annoncée est à portée d'un individu.

## 3. La confirmation (Placement 8, 160 parties, graines neuves)

**Le réglage robuste : J + 2 Machines, une menace par Machine, tuile 3 × 3, 3 individus par joueur.**

| Joueurs | Taux du bot fort | Lecture | Profondeur | Info | Placement | Maîtrise | Forêt finale | Agence | Couplage | Score |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | 68 | 32,6 | 7,7 | 11,3 | 17,4 | 6,1 | 63 % | 100 % | 7 % | 1,00 |
| 3 | 66 | 34,9 | 6,1 | 7,8 | 17,4 | 5,2 | 71 % | 100 % | 7 % | 1,00 |
| 4 | 63 | 34,6 | 5,9 | 6,8 | 15,6 | 5,5 | 75 % | 100 % | 9 % | 1,00 |
| 5 | 62 | 39,7 | 5,5 | 7,1 | 15,9 | 4,1 | 77 % | 100 % | 8 % | 1,00 |
| 6 | 61 | 41,3 | 4,7 ± 0,7 | 7,7 | 16,0 | 4,4 | 79 % | 100 % | 9 % | 0,93 |

**Les réglages de la proposition (J + 1 Machines, tuile 3 × 4, 2 individus) :** score 1,00 à 2 joueurs, puis 0,59, 0,36, 0,21 et 0,36 de 3 à 6 joueurs. La profondeur tombe à 1,8 à 3,4.

**Deux réglages intermédiaires** sont verts jusqu'à 3 ou 4 joueurs :
- J + 1 Machines, tuile 3 × 3, 3 individus : score de 0,71 à 0,80 à 5 et 6 joueurs ;
- J + 1 Machines, tuile 3 × 3, 2 individus : score de 0,56 à 0,69 dès 4 joueurs.

**Lecture.** Les trois réglages agissent dans le même sens, et chacun compte :
- une tuile plus petite resserre le jeu ;
- un individu de plus redonne le choix de l'acteur ;
- une Machine de plus élargit l'annonce.

Les trois ensemble gardent une règle simple loin derrière le bon joueur, à toutes les tailles de table.

## 4. Le choix « protéger ou se placer » (T4)
On compare, à chaque décision du bot fort, le meilleur programme sans déplacement au meilleur programme qui contient un déplacement (6 parties, 48 décisions par taille).

| Réglage | 2 joueurs | 4 joueurs | 6 joueurs |
|---|---|---|---|
| robuste | se placer 35 %, protéger 50 %, neutre 15 % | 67 / 15 / 19 | 71 / 8 / 21 |
| proposition | 46 / 31 / 23 | 67 / 10 / 23 | 67 / 10 / 23 |
| grille de l'étude 1 (rappel) | 22 / 56 / 22 | – | – |

À 2 joueurs, le choix est disputé, et plus équilibré que sur la grille. À 4 et 6 joueurs, il penche vers « se placer ». **Limite de l'instrument** : il compare des programmes de toute l'équipe. Avec 4 à 6 ordres, il y a presque toujours un ordre qui ne pare rien et qui gagne à se déplacer. La question qui compte à grande table est celle de *chaque joueur* (garder ou bouger son propre individu). Elle demande un T4 par joueur, à écrire.

## 5. Ce qui reste à surveiller
1. **Le couplage, faible (7 à 15 %).** Les joueurs défendent surtout leur tuile. C'est sain pour l'agence et pour l'attente, mais la coopération reste pauvre. Pistes, toutes des réglages ou des formes à essayer plus tard :
   - un Cœur plus boisé, qui attire la percée vers le centre commun ;
   - des Machines en plus qui entrent au hasard sur n'importe quelle lisière (c'est déjà le cas) ;
   - plus tard, la communication.
2. **L'enjeu baisse à grande table.** La forêt finale passe de 63 à 79 %, car la forêt grandit avec J plus vite que la menace. Un réglage par taille (moins de tours, ou un arbre de moins par case à 5 et 6 joueurs) serait un élément propre au nombre de joueurs. Il est à garder en réserve, le jeu tient sans.
3. **Les bots** restent un Gentil parfaitement coordonné. Le coût de la coordination entre joueurs n'est pas mesuré (communication différée).
4. **Les seuils** sont des indices. Aucune partie humaine n'a encore été jouée.

## 6. Suite
- **Maquette jouable** (décision 6, validée) : le kit en couronne, réglages modifiables (joueurs, Machines J + 1 ou J + 2, menaces par Machine, tuile, individus par joueur), le réglage robuste par défaut, des sièges humains ou des bots expliqués, des parties enregistrées.
- **Plus tard** : un T4 par joueur ; l'essai d'un Cœur plus boisé pour le couplage ; l'ordre *Éclairer*, sans objet tant que toutes les menaces annoncées partent (m = n).
