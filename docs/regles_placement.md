# Le modèle « placement » : la mécanique de base seule

*15 oct. 2026. Demande de l'auteur : étudier une seule mécanique, le jeu de déplacement et de placement entre un Méchant qui programme n actions par un hasard contrôlé et un Gentil qui en programme k, sans pistes, sans apprentissage, sans rêve, avec un seul Gentil pour tous les peuples. **Statut : modèle d'étude, proposition de Claude. Aucune règle du jeu n'est adoptée ni changée** ; la V0.4 reste la dernière version adoptée et le noyau N1 reste une proposition. Code : `placement/` ; tests : `tests/test_placement.py` ; bilan : `projet/4-bilans/placement-etude-1.md`. Chaque règle porte un identifiant (P1.1…) que les tests citent.*

## 0. En une phrase
Sur une grille boisée, le Méchant annonce chaque tour quelques menaces dont n s'exécuteront ; le Gentil donne k ordres à ses individus pour garder, saboter ou se déplacer ; une menace non parée abat un arbre. On compte les arbres après t tours.

## 1. La configuration
**P1.1 Plateau.** Une grille de L × H cases, voisinage orthogonal (4) ou avec diagonales (8). Le **cœur** est le centre de la grille.

**P1.1 bis Le plateau en couronne** (réglage `plateau` = couronne ; le « kit par joueur », retenu par l'auteur le 15 oct. comme modèle de la campagne 2, `projet/2-maquettes/proposition-gentil-reparti.md`). Chaque joueur pose une tuile de `tuile_l` × `tuile_p` cases (3 × 4 par défaut) autour d'une case **Cœur** commune. Dans une tuile, la rangée intérieure touche le Cœur et la rangée extérieure est la lisière ; la dernière colonne d'une tuile touche la première colonne de la suivante, rangée par rangée. Le cœur des tactiques est la case Cœur (qui porte `coeur_arbres` arbres, autant que les autres cases par défaut).

**P1.2 Arbres.** Chaque case porte des arbres : a par case (profil uniforme), plus au cœur (profil cœur), ou répartis au hasard avec au moins un par case (bosquets). La forêt initiale vaut c0 = L × H × a dans les trois cas.

**P1.3 Machines.** M Machines entrent sur des cases de la lisière (rangée du haut, « front ») ou du bord (« bords »), tirées au hasard. Elles ne quittent jamais le plateau.

**P1.3 bis Sur la couronne**, la Machine j entre sur une case de la lisière de la tuile j, tirée au dé ; les Machines en plus (M > J) entrent sur une lisière tirée au dé.

**P1.4 Individus.** Le Gentil place p individus sur les cases de son choix. La **configuration** est l'ensemble plateau, arbres, Machines et individus.

**P1.4 bis Sur la couronne**, chaque individu part sur une case de la tuile de son joueur (P3.4 bis), puis va où il veut.

## 2. Le Méchant : un hasard contrôlé
**P2.1 L'annonce.** Au début du tour, le Méchant annonce m menaces (m ≥ n). Chaque menace est une Machine (tirée au dé) et une tactique, tirée selon la composition de son jeu de tactiques (réglage). Les menaces sont publiques.

**P2.1 bis Une menace par Machine** (réglage `menaces_par_machine` = q > 0). Chaque Machine fait q menaces par tour : on tire une tactique pour chacune et on les montre toutes (m = n = M × q). Seul l'ordre d'exécution reste caché.

**P2.2 L'exécution.** n des m menaces s'exécuteront, dans un ordre inconnu. Le Gentil ne sait pas lesquelles : chacune part avec la probabilité n / m. Variante « sans annonce » (m = 0) : les menaces sont tirées au moment de l'exécution, et le Gentil ne connaît que la composition du jeu du Méchant.

*Le réglage m règle la prise du Gentil : avec m = n, il sait tout sauf l'ordre ; plus m est grand, plus il doit couvrir large ; sans annonce, il joue à l'aveugle.*

## 3. Le Gentil : k ordres
**P3.1 Les ordres.** Le Gentil donne au plus k ordres par tour, au plus un par individu, en secret : le Méchant ne les voit pas (P2.2).

**P3.2 Les trois ordres.**
- **Garder** : l'individu garde sa case. La première menace qui viserait cette case est parée (la Machine n'y entre pas).
- **Aller** : l'individu se déplace d'au plus `portee` cases (réglage, 1 par défaut). Il ne pare rien ce tour-ci : **c'est un investissement**. Sa présence compte aussitôt pour les tactiques (P4.3).
- **Saboter** : l'individu est sur la case d'une Machine. La première menace de cette Machine est parée.
- *Variante « poster »* (`aller_garder`) : aller puis garder la case d'arrivée, en un seul ordre.
- *Variante « garde étendue »* (`garde_portee` 1) : la garde pare aussi une menace sur une case voisine (une seule parade en tout).

**P3.3 L'ordre des choses.** Les déplacements ont lieu d'abord ; puis gardes et sabotages sont posés ; puis les menaces s'exécutent.

**P3.4 Une parade par ordre.** Chaque ordre pare au plus une menace. Deux gardes sur la même case en parent deux.

**P3.4 bis Plusieurs joueurs (réglage `joueurs`, 0 par défaut).** *Outil d'étude du nombre de joueurs (15 oct.), pas une règle adoptée.* Avec J joueurs, les individus sont répartis en blocs aussi égaux que possible ; chaque joueur ne commande que les siens et donne au plus ⌈k / J⌉ ordres par tour (un seul dès que k ≤ J), toujours dans la limite de k ordres en tout. Les bots restent un Gentil parfaitement coordonné : la règle mesure le prix de la répartition, pas celui de la communication. Voir `projet/3-pilotage/nombre-de-joueurs-pistes.md`.

## 4. La résolution, sans aucun choix
**P4.1** Les n menaces s'exécutent une à une, dans l'ordre du tirage.

**P4.2 Le rayon.** Une Machine peut abattre dans sa case ou dans une case voisine qui a encore des arbres.

**P4.3 Les tactiques** choisissent la case dans le rayon, lue sur la configuration du moment (les menaces précédentes ont pu la changer) :
- *cupidité* : la plus boisée ;
- *percée* : la plus proche du cœur ;
- *opportunisme* : la moins défendue (le moins d'individus) ;
- *représailles* : la plus défendue.

Égalités : la plus boisée, puis la plus proche du cœur, puis la case de la Machine, puis le plus petit numéro.

**P4.4 Le repli.** Sans arbre dans le rayon, la Machine vise la case boisée la plus proche, où qu'elle soit.

**P4.5 Le sabotage** est regardé d'abord. Une Machine sabotée ne fait rien de sa première menace. Variantes de ce qu'elle devient : *échappe* (elle va quand même sur la case visée, sans abattre ; par défaut), *fige* (elle reste où elle est), *allié* (il faut deux saboteurs pour une parade, la Machine reste), *aucun* (pas de sabotage).

**P4.6 La garde.** Si la case visée est gardée (garde pas encore utilisée), la menace est parée : la Machine reste où elle est.

**P4.7 Sinon**, la Machine entre dans la case visée et y abat un arbre.

## 5. Bornes et fin
**P5.1 La borne du tour.** Une menace non parée abat exactement un arbre (P4.4 garantit qu'il en reste à abattre, P5.2) et un ordre pare au plus une menace. Donc la perte du tour vaut n − parades, entre n − k et n. Avec **k < n**, il tombe toujours au moins un arbre.

**P5.2 La fin.** La partie dure t tours. On compte la forêt restante r = c0 − n × t + S, où S est le nombre total de parades. On impose **c0 > n × t**, ce qui garantit r > 0 dans toutes les parties.

**P5.3 Le résultat.** Tout se résume au **taux de parade** S / (k × t), de 0 à 100 % : la part des ordres qui ont sauvé un arbre. C'est la mesure de toute l'étude ; la forêt restante s'en déduit.

## 6. Paramètres et variantes
| Paramètre | Rôle | Valeur de départ | Valeurs explorées |
|---|---|---|---|
| `largeur`, `hauteur` | taille du plateau | 5 × 5 | 4 × 4, 5 × 5, 6 × 6, 6 × 4, 7 × 7 |
| `voisinage` | 4 ou 8 voisins | 4 | 4, 8 |
| `arbres`, `profil` | forêt par case et répartition | 3, uniforme | 1 à 4 ; uniforme, cœur, bosquets |
| `machines`, `entree` | M, lieu d'entrée | 3, front | 2 à 5 ; front, bords |
| `individus` | p | 3 | k à k + 2 |
| `n`, `k` | menaces exécutées, ordres | 3, 2 | n de 2 à 5, k de 1 à n − 1 |
| `tours` | t | 8 | 6, 8, 10 |
| `annonces` | m (0 = sans annonce) | 5 | 0, n à n + 3 |
| `tactiques` | composition du jeu du Méchant | une de chaque | 5 compositions |
| `portee` | cases franchies par Aller | 1 | 1, 2 |
| `aller_garder` | ordre « poster » | non | non, oui |
| `sabotage` | forme du sabotage | échappe | aucun, fige, échappe, allié |
| `garde_portee` | garde étendue aux voisines | 0 | 0, 1 |
| `joueurs` | J, répartition des individus et des ordres (P3.4 bis) | 0 (Gentil unique) | 1 à 6 (sondes du nombre de joueurs) |
| `plateau`, `tuile_l`, `tuile_p`, `coeur_arbres` | grille ou couronne (P1.1 bis), taille des tuiles, arbres du Cœur | grille ; 3 × 4 ; comme les autres cases | couronne ; 3 × 3, 3 × 4, 4 × 4 (campagne 2) |
| `menaces_par_machine` | q menaces par Machine et par tour (P2.1 bis) | 0 (annonce classique) | 1, 2 (campagne 2) |

Contraintes de validité : k < n, k ≤ p, m = 0 ou m ≥ n, c0 > n × t.

## 7. Ce que l'étude mesure
Toutes les mesures sont des écarts de taux de parade, en points, entre bots joués sur les mêmes graines (appariés). Seuils de lecture **provisoires**, comme indices : ils ne jugent aucune version du jeu.

| Mesure | Question | Définition | Vert | Rouge |
|---|---|---|---|---|
| Lecture | lire le jeu bat-il toute boucle ? | bot fort − meilleure boucle ouverte (sentinelle, marquage, regroupement) | ≥ 10 | < 3 |
| Profondeur | une règle simple suffit-elle ? | bot fort − réflexe | ≥ 5 | < 1 |
| Information | l'annonce donne-t-elle une prise ? | glouton − glouton aveugle | ≥ 5 | < 1 |
| Placement | se déplacer compte-t-il ? | glouton − glouton immobile | ≥ 5 | < 1 |
| Maîtrise | voir plus loin que le tour compte-t-il ? | Monte-Carlo − glouton | ≥ 4 | < 1 |
| Difficulté | ni trivial ni impossible | taux du bot fort | 35 à 75 | < 20 ou > 90 |
| Investissement | le dilemme « protéger ou se placer » existe-t-il ? | part des décisions où le Monte-Carlo sacrifie une parade immédiate pour se placer | indice | – |
| Agence | chaque joueur compte-t-il ? | part des joueurs dont un ordre a paré au moins une menace dans la partie (bot fort) | indice | – |
| Couplage | les joueurs s'entraident-ils ? | part des parades faites hors de la tuile du joueur (Cœur compris), couronne seulement | indice | – |

Le **score d'intérêt** d'une variante est sa note la plus faible (même logique que la qualité des cycles : l'objectif le plus faible).

## 8. Ce que le modèle laisse de côté
Les pistes (pensées, rêve), l'apprentissage du Méchant, les peuples et leurs règles brisées, la communication. Le Méchant n'a pas d'intelligence propre dans le jeu (P2.2) ; dans les campagnes, un **Méchant-bot de force réglable** (β) choisit parmi les menaces annoncées celles qui sont le moins exposées aux individus, sans voir les ordres, et un **Méchant omniscient** qui les voit sert de borne.
