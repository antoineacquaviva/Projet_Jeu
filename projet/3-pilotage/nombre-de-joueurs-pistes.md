# Diviser le Gentil : un jeu de 1 à 6 joueurs avec un minimum d'aménagements

*15 oct. 2026, 18 h. Réponse à la demande de l'auteur (17 h 50) : réfléchir, avant la campagne 2 du modèle « placement », à la division du Gentil unique en plusieurs joueurs. **Statut : réflexion et pistes de Claude, rien n'est adopté.** Modèle de référence : `docs/regles_placement.md` ; étude 1 : `projet/4-bilans/placement-etude-1.md` ; sondes chiffrées : `campagnes/placement_joueurs_sonde.json` et `placement_joueurs_sonde2.json`, résultats `resultats/placement/joueurs_sonde_*` et `joueurs_sonde2_*` (local, 37 variantes, 64 parties appariées chacune, 9 bots, environ 21 000 parties).*

## En bref

- **Le principe** : quand on divise le Gentil, ce qui doit rester constant, ce sont les *rapports* du jeu (pression k / n, choix de l'acteur, densité, enjeu) ; ce qui doit grandir, ce sont les *quantités*. La règle la plus économe est celle où **chaque joueur apporte sa part** : rien n'est alors à régler par taille de table.
- **Cinq pistes** : une règle générique (n = J + 1) ; une Machine par joueur plus une, qui agissent chacune une fois ; un plateau en tuiles posées en couronne autour d'un cœur commun ; un jeu constant partagé entre les joueurs ; un hybride à fonds commun.
- **La sonde chiffrée (bots parfaitement coordonnés, de 1 à 6 joueurs)** donne trois résultats nets :
  1. **« un individu et un ordre par joueur » ne tient pas** : dès 3 joueurs, l'annonce ne sert presque plus (l'information passe de 13 points à 1 joueur à 0 à 3 points), parce que chaque individu garde sa case par réflexe. Il faut **plus d'individus que d'ordres** à chaque joueur ;
  2. **« deux individus et un ordre par joueur »** rend l'annonce utile à toutes les tailles (information 7 à 11, lecture 31 à 36). Le maillon faible devient **le placement**, orange de 2 à 6 joueurs (2 à 4,5 points) ; garder la pression constante (n = 2J) le remonte (3,6 à 6,8) et stabilise la forêt (67 à 72 %) ;
  3. **le jeu constant partagé** (6 individus, 3 ordres, 4 menaces, réparties entre J joueurs) garde **toutes ses mesures de 1 à 6 joueurs** (tout vert sauf à 3 joueurs, orange sur le placement) : la répartition elle-même coûte environ 4 points de parade au plus. Son défaut n'est pas mesurable ici : à 6 joueurs, la moitié de la table ne donne pas d'ordre à chaque tour.
- **La difficulté ne casse à aucune taille** (taux du bot fort de 48 à 68 % de 2 à 6 joueurs).
- **Ma recommandation** : porter deux candidats dans la campagne 2, *le kit par joueur* (deux individus, un ordre, une Machine de plus que de joueurs, une tuile de territoire en couronne) et *le jeu constant partagé* ; écarter « un individu par joueur ». Le plateau en couronne, la piste la plus structurelle, reste à coder et à mesurer.
- **Cinq questions à l'auteur** en section 7, dont la révision de la décision du 13 oct. « un seul plateau ».

## 1. La demande, et ce qui avait déjà été décidé

L'auteur veut :
1. un jeu **structurellement intéressant jusqu'à 6 joueurs** ;
2. des **aménagements minimaux** de mise en place et de règles selon le nombre de joueurs ;
3. des pistes **structurelles**, pas seulement une table de paramètres par taille : plateau à géométrie variable, valeurs constantes réparties entre les joueurs, règles génériques du type n = joueurs + 1 ;
4. plus tard, un **temps d'attente** par joueur qui ne croît pas en proportion du nombre de joueurs. Ce point dépend de la coordination entre joueurs (communication, conseil de la calebasse), qui est différée ; il n'est qu'esquissé ici (section 6).

Deux décisions du 13 oct., prises pour l'ancien jeu, touchent la question (ETAT, section 8) :
- *un seul plateau pour toutes les tailles de table* ;
- *au plus 4 éléments propres au nombre de joueurs*, dans un petit tableau du livret.

La seconde va dans le sens de la demande. La première s'oppose à la piste du plateau à géométrie variable : il faudra la confirmer ou la réviser (question A, section 7).

## 2. Ce que la division change, en termes de structure

Le modèle placement se résume à quelques **rapports**, qui font la sensation du jeu, et à des **quantités**, qui font sa taille. Dans la configuration de départ (5 × 5, 3 Machines, 3 individus, n = 3, k = 2) :

| Rapport | Valeur de départ | Ce qu'il règle |
|---|---|---|
| pression k / n | 2 / 3 | la part des menaces qu'on peut parer au mieux |
| plancher n − k | 1 arbre par tour | la perte garantie, quoi qu'on fasse |
| choix de l'acteur k / individus | 2 / 3 | il faut choisir *qui* agit |
| densité | 3 individus et 3 Machines pour 25 cases | la distance aux Machines, donc le prix du placement |
| enjeu c0 / (n · t) | 75 / 24 | la part de la forêt en jeu |
| précision de l'annonce m / n | 5 / 3 (m = n en tête depuis la décision 2) | la prise du Gentil sur le tour |

Diviser le Gentil en J joueurs ajoute quatre grandeurs qui n'existaient pas :
- **l'agence** : combien d'ordres chaque joueur donne par tour, et à quelle fréquence l'un d'eux sauve un arbre. À 6 joueurs avec k = 2, quatre joueurs ne font rien du tour ;
- **le couplage** : à combien d'autres joueurs les choix d'un joueur sont liés. S'il est nul, on joue J parties solitaires côte à côte ; s'il est total, un seul joueur peut tout diriger (l'effet leader) ;
- **la charge** : le nombre d'options qu'un joueur examine ;
- **l'attente** : le temps où il n'a rien à décider.

**Le principe qui en découle.** Ce qui doit rester constant quand J change, ce sont les rapports ; ce qui doit grandir, ce sont les quantités. La règle la plus économe est celle où les quantités grandissent *d'elles-mêmes*, parce que chaque joueur apporte sa part du matériel. Il n'y a alors rien à régler par taille : la table de paramètres disparaît.

Une règle générique ne garde pas tous les rapports à la fois. Avec « un ordre par joueur, n = J + 1 », la pression k / n passe de 1/2 (1 joueur) à 6/7 (6 joueurs) : le plancher reste d'un arbre par tour pendant que la menace totale grandit. La sonde (section 4) mesure ce que cela coûte.

## 3. Les pistes

Chaque piste est jugée sur quatre questions : quels rapports tient-elle ? quel couplage donne-t-elle ? combien d'éléments propres au nombre de joueurs demande-t-elle ? que fait-elle à l'attente ?

### Piste 1. Une règle générique : « le Méchant a toujours une menace d'avance »

*Chaque joueur commande ses individus et donne un ordre par tour ; le Méchant exécute n = J + 1 menaces.*

- **Pour.** Une phrase au livret, aucun tableau. Le plancher d'un arbre par tour est garanti à toutes les tailles. Chaque joueur agit à chaque tour.
- **Contre.** La pression k / n tend vers 1 : à 6 joueurs, on peut parer 6 menaces sur 7. Sur un plateau fixe, la densité d'individus monte avec J et le placement perd son prix. Il faut donc l'associer à un plateau qui grandit (piste 3) ou accepter que le jeu devienne plus facile à grande table.
- **Variante « rapport constant »** : n = 2J. La pression reste à 1/2, mais le plancher monte à J arbres par tour, et la forêt doit grandir en proportion.
- **Éléments propres au nombre de joueurs** : aucun (la formule) ou un (la taille du plateau).

### Piste 2. Une Machine par joueur, plus une ; chaque Machine agit une fois

*Il y a J + 1 Machines ; à chaque tour, chacune exécute une menace, avec une tactique tirée et montrée face visible ; seul l'ordre d'exécution reste caché.*

C'est la piste 1 rendue matérielle : n = J + 1 n'est plus une formule à retenir, c'est le nombre de Machines posées sur le plateau. Le hasard contrôlé devient simple à jouer : une carte de tactique retournée devant chaque Machine. On retrouve exactement le réglage m = n mis en tête par la décision 2 (le Gentil sait tout, sauf l'ordre). On perd le dé qui désigne la Machine ; il faudra vérifier que le jeu n'y perd pas de profondeur.

- **Éléments propres au nombre de joueurs** : aucun (« une Machine de plus que de joueurs »).

### Piste 3. Le plateau à géométrie variable : chacun apporte son territoire

*Chaque joueur pose une tuile de territoire (une dizaine de cases, ses arbres, ses individus, une Machine à sa lisière). Les tuiles se placent en couronne autour d'une clairière commune, le cœur de la forêt.*

C'est la piste la plus structurelle, et celle qui règle le plus de choses à la fois :
- **les rapports sont constants par construction** : cases, arbres, individus et Machines par joueur ne dépendent pas de J ;
- **le couplage est local et constant** : chaque tuile touche deux voisines et le cœur. Un joueur coopère surtout avec ses deux voisins, à 3 comme à 6. La charge par joueur ne grandit pas avec la table ;
- **l'enjeu commun est au centre** : la tactique *percée*, l'une des quatre règles porteuses de l'étude 1, mène les Machines vers le cœur, qui appartient à tous. Les Machines franchissent les frontières, et un individu peut aller aider son voisin ;
- **l'attente** : chaque joueur programme sur sa tuile, en même temps que les autres. La résolution peut se faire tuile par tuile, en parallèle, tant que les Machines n'ont pas franchi de frontière ;
- **la mise en place** se lit sur la table : « chaque joueur prend une tuile ».

Les risques :
- **les solitaires côte à côte.** Si une tuile est trop grande, ou si les Machines restent chez elles, on joue J parties séparées. Le couplage se règle par la taille des tuiles, la portée des Machines et l'attrait du cœur ;
- **le solo et le duo** : une couronne de 1 ou 2 tuiles n'est pas une couronne. Le joueur seul peut tenir deux tuiles, ou le cœur peut être plus petit à petite table (un élément propre au nombre de joueurs) ;
- **la décision du 13 oct.** (« un seul plateau ») est à réviser.

**Variante sans tuiles : un plateau fixe en 6 secteurs**, autour d'un cœur. Chaque joueur reçoit un ou plusieurs secteurs (6 / J, voir piste 4). On garde un seul plateau, au prix de secteurs partagés à 4 et 5 joueurs.

### Piste 4. Les constantes réparties : un seul jeu, partagé entre les joueurs

*Le jeu est le même à toutes les tailles (par exemple 6 individus, k ordres, n menaces) ; les joueurs se répartissent les individus. Seul seul, on les commande tous ; à six, chacun en a un.*

- **Pour.** L'équilibre est réglé une seule fois, puisque le jeu ne change pas. Le nombre total de décisions par tour est constant, donc la durée du tour aussi : **c'est la seule piste qui règle l'attente par construction**, quel que soit J.
- **Contre.**
  - 6 se partage bien en 1, 2, 3 et 6, mal en 4 et 5 (2 + 2 + 1 + 1, 2 + 1 + 1 + 1 + 1). Des individus « communs », que n'importe qui peut commander, comblent le reste, mais introduisent une négociation.
  - L'agence baisse à grande table : avec k < 6 ordres pour 6 individus, certains joueurs ne font rien à certains tours. Qui agit devient le cœur du jeu, ce qui le rapproche de la coordination différée (calebasse).
  - À 1 joueur, la charge est maximale (6 individus).
- **Éléments propres au nombre de joueurs** : aucun, sauf la répartition des individus (un petit tableau).

### Piste 5. Un hybride : une part fixe et une part par joueur

*Chaque joueur a un individu et un ordre par tour ; la table partage en plus un petit fonds commun (par exemple un ordre et un individu communs).*

Le fonds commun ne grandit pas avec J. Il garde un choix collectif à toutes les tailles (« qui joue l'ordre commun ? ») et donne au joueur seul un deuxième ordre, ce qui lui rend le choix de l'acteur. C'est un moyen de corriger la piste 1 à petite table sans tableau. À grande table, il est un point de coordination unique, donc le premier objet d'une future règle de communication.

### Pistes écartées pour l'instant
- **Des peuples asymétriques** (un rôle par joueur) : différés par l'auteur avec les peuples.
- **Un ordre par joueur et par tour, mais des tours plus courts à grande table** : cela change la durée de partie et pas la structure ; c'est un réglage.
- **Des menaces qui ciblent un joueur** (« le Méchant s'en prend à toi ») : cela donne de l'agence à chacun, mais casse la coopération en duels parallèles.

## 4. Une première sonde chiffrée

**Ce qui est mesuré.** Les bots restent un Gentil unique, parfaitement coordonné. La sonde mesure donc la *structure* à chaque taille de table, avec la meilleure coordination possible, pas le coût de la communication (différée). Un nouveau réglage d'étude, `joueurs` (P3.4 bis de `docs/regles_placement.md`), impose que chaque joueur ne commande que ses individus et donne au plus ⌈k / J⌉ ordres. Les mesures sont celles de l'étude 1 (en points de taux de parade, seuils de lecture provisoires gardés comme indices, décision 4) ; annonce m = n (décision 2). 64 parties appariées par variante : **la marge d'erreur est d'environ ± 2 à 3 points**, donc seuls les écarts plus grands comptent.

**Les six familles**, de J = 1 à 6 joueurs :

| Famille | Plateau | Machines | Individus | Ordres k | Menaces n | Piste |
|---|---|---|---|---|---|---|
| A | fixe, 5 × 5 | 3 | J | J | J + 1 | 1, plateau fixe |
| B | ≈ 12 cases par joueur (4 × 3 … 9 × 8) | J + 1 | J | J | J + 1 | 1 et 2, plateau qui grandit |
| E | comme B | J + 1 | J | J | 2J | 1, pression constante |
| F | comme B | J + 1 | 2J | J (un par joueur) | J + 1 | 1, 2, 3 : le kit par joueur |
| G | comme B | J + 1 | 2J | J (un par joueur) | 2J | kit, pression constante |
| H | fixe, 6 × 6 | 4 | 6 | 3 | 4 | 4 : le jeu constant partagé |

*Le plateau qui grandit est un rectangle : il imite les tuiles par la surface, pas par la forme. La couronne n'est pas encore codée.*

**L'information (glouton − glouton aveugle ; vert ≥ 5, rouge < 1)** : l'annonce donne-t-elle une prise ?

| J | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| A : 1 individu, plateau fixe | 13,1 | 6,5 | −0,2 | 2,2 | 3,9 | 0,3 |
| B : 1 individu, plateau qui grandit | 6,1 | 6,5 | 2,5 | 2,5 | 3,6 | 2,5 |
| E : 1 individu, n = 2J | 6,1 | 4,5 | 3,8 | 2,6 | 5,9 | 3,2 |
| F : 2 individus, n = J + 1 | 15,2 | 7,0 | 10,0 | 10,8 | 9,3 | 11,0 |
| G : 2 individus, n = 2J | 15,2 | 9,0 | 10,5 | 9,8 | 8,6 | 9,8 |
| H : jeu partagé | 15,4 | 16,0 | 10,0 | 12,1 | 12,8 | 15,4 |

**Le placement (glouton − glouton immobile ; vert ≥ 5, rouge < 1)** : se déplacer compte-t-il ?

| J | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| A | 7,4 | 8,4 | 5,1 | 6,5 | 4,8 | 2,5 |
| B | 6,4 | 8,4 | 5,9 | 3,2 | 4,9 | 2,4 |
| E | 6,4 | 6,3 | 7,5 | 3,9 | 5,3 | 4,4 |
| F | 5,5 | 2,1 | 4,5 | 3,0 | 3,8 | 3,1 |
| G | 5,5 | 6,1 | 4,6 | 3,6 | 6,4 | 6,8 |
| H | 7,7 | 7,7 | 4,5 | 6,1 | 5,2 | 7,7 |

**La difficulté et l'enjeu** (taux de parade du Monte-Carlo, vert de 35 à 75 % ; forêt restante en fin de partie) :

| J | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| A : taux / forêt | 64 / 86 % | 56 / 80 % | 52 / 74 % | 48 / 67 % | 48 / 62 % | 49 / 57 % |
| B | 66 / 70 % | 56 / 80 % | 49 / 81 % | 51 / 84 % | 49 / 83 % | 48 / 85 % |
| E | 66 / 70 % | 57 / 70 % | 52 / 67 % | 52 / 68 % | 50 / 64 % | 49 / 66 % |
| F | 78 / 73 % | 66 / 82 % | 60 / 84 % | 60 / 86 % | 57 / 85 % | 58 / 87 % |
| G | 78 / 73 % | 68 / 72 % | 60 / 69 % | 62 / 70 % | 60 / 67 % | 60 / 69 % |
| H | 64 / 85 % | 64 / 85 % | 60 / 84 % | 61 / 84 % | 63 / 84 % | 64 / 85 % |

**Score** (la plus basse des notes, 1 = tout vert) : A 1,00 à 1 et 2 joueurs, puis 0,00 à 0,74 ; B 0,34 à 0,66 dès 3 joueurs ; E 0,41 à 1,00 ; F 0,29 à 0,87 ; G 0,64 à 1,00 ; **H 1,00 partout sauf 0,87 à 3 joueurs**. La lecture (bot fort − meilleure boucle) reste verte partout (18 à 41 points) ; la profondeur aussi (6 à 16). La maîtrise (voir plus loin que le tour) faiblit à 5 et 6 joueurs avec n = 2J (3,4, orange, et 4,0). Détail : `resultats/placement/joueurs_sonde_rapport.md` et `joueurs_sonde2_rapport.md`.

**Contrôles.** Des variantes identiques par construction donnent des chiffres identiques : B et E à 1 joueur ; A et B à 2 joueurs ; F et H à 3 joueurs (mêmes paramètres) ; H à 1 et à 6 joueurs (la contrainte de répartition ne change rien quand chacun a un seul individu, ou quand un seul joueur a tout).

## 5. Ce que j'en retiens

**1. Chaque joueur doit avoir plus d'individus que d'ordres.** C'est le résultat le plus net (*mesuré*). Avec un individu et un ordre par joueur, l'annonce cesse de servir dès 3 joueurs : comme chaque individu agit à chaque tour, garder sa case devient un réflexe, avec ou sans annonce. Avec deux individus et un ordre, la question « lequel des deux agit ? » revient, et l'information reste verte à toutes les tailles. *Supposé* : c'est le même mécanisme que dans l'étude 1 (le choix de l'acteur, k < individus), qui faisait déjà partie de la configuration de départ.

**2. Le placement est la mesure à surveiller à grande table.** Il baisse avec J dans presque toutes les familles. Deux causes possibles, non départagées (*supposé*) : à pression k / n proche de 1, garder rapporte presque toujours, et se déplacer devient rarement le meilleur coup ; sur un plateau qui grandit en rectangle, les distances grandissent et un déplacement d'une case compte moins. Garder la pression constante (n = 2J) remonte le placement et l'investissement du Monte-Carlo (14 à 23 % des décisions), au prix d'une maîtrise plus faible à 5 et 6 joueurs. Le plateau en couronne, où la distance au cœur ne grandit pas avec J, est la réponse naturelle à la seconde cause : c'est ce que la campagne 2 doit mesurer.

**3. Le jeu constant partagé est le plus robuste, structurellement.** Le jeu ne change pas avec J, donc ses mesures non plus ; la contrainte « chacun ne commande que ses individus » coûte environ 4 points de parade au plus (de 64 à 60 %), à 3 et 4 joueurs, là où les parts sont inégales ou contraignantes. Ses défauts sont humains, donc hors de portée de la sonde :
- l'agence : avec 3 ordres pour 6 joueurs, trois joueurs ne donnent pas d'ordre à chaque tour ;
- le solo commande 6 individus ;
- qui donne les ordres devient une négociation, c'est-à-dire la communication qu'on a différée.

**4. La difficulté se règle d'elle-même.** Toutes les familles restent entre 48 et 68 % de taux de parade de 2 à 6 joueurs. Le solo avec le kit (F, G à 1 joueur : 78 %) est un peu trop facile et sa maîtrise est orange (2,9) : le joueur seul pourrait tenir deux kits, comme on l'avait supposé pour les tuiles.

**5. L'enjeu en arbres dépend de la formule de n.** Avec n = J + 1 sur un plateau qui grandit, la forêt finale monte vers 85 % : chaque arbre compte peu (même limite que dans l'étude 1). Avec n = 2J, elle reste vers 67 à 72 % à toutes les tailles. Cela plaide pour une pression qui suit le nombre de joueurs.

**Ce que je propose.** Garder deux candidats pour la campagne 2, très différents dans l'esprit :
- **le kit par joueur** (pistes 1, 2 et 3 réunies) : chacun apporte une tuile de territoire, deux individus, un ordre par tour et une Machine ; le Méchant a une Machine de plus que de joueurs, chacune agit une fois par tour (n = J + 1), ou deux fois (n = 2J) ; les tuiles en couronne autour d'un cœur commun. Aucun tableau par taille, sauf peut-être pour le solo ;
- **le jeu constant partagé** (piste 4) : un seul plateau en 6 secteurs, 6 individus répartis, un nombre d'ordres fixe. Aucun réglage par taille, temps de tour constant.

La piste 5 (fonds commun) servira de variante à l'un ou à l'autre si l'agence ou le solo posent problème. **Le premier travail de la campagne 2 serait de coder le plateau en couronne** (une géométrie de tuiles, un cœur, des lisières par tuile), puis de jouer les deux candidats de 1 à 6 joueurs avec les mesures de l'étude 1, plus deux mesures nouvelles : l'agence (part des joueurs dont l'ordre a paré au moins une menace dans la partie) et le couplage (part des parades obtenues hors de sa propre tuile).

## 6. Le temps d'attente, en avance

Le modèle a déjà une propriété utile : **les ordres sont donnés en secret et en même temps**. L'attente pendant la programmation ne grandit donc pas avec J. Ce qui grandit, ce sont deux choses :
- **la résolution** : n = J + 1 menaces à dérouler une par une. Elle est automatique et rapide à jouer si chaque menace se lit d'un coup d'œil (une carte de tactique devant chaque Machine, piste 2). Sur un plateau en couronne (piste 3), les menaces qui restent dans leur tuile peuvent se résoudre en même temps ;
- **la concertation** : c'est elle qui fera l'attente réelle à grande table. Une règle à couplage local (piste 3 : on parle surtout à ses voisins) ou à décisions constantes (piste 4) la borne. Ce point sera repris avec la communication.

## 7. Questions à l'auteur

Je regroupe ici les décisions, chacune avec ma recommandation. Aucune ne change une règle adoptée : elles orientent la campagne 2.

**A. Plateau à géométrie variable.** Le 13 oct., vous aviez demandé un seul plateau pour toutes les tailles de table. Le plateau en tuiles posées en couronne contredit cette décision. *Recommandé : l'autoriser comme candidat, à égalité avec le plateau fixe en 6 secteurs du jeu partagé, et choisir sur mesures.*

**B. La part de chaque joueur.** Chaque joueur ne commande que ses individus (règle d'étude P3.4 bis) et en a plus qu'il ne donne d'ordres. *Recommandé : oui, comme hypothèse de travail ; « un individu par joueur » est écarté par la sonde.*

**C. Le solo.** Le jeu doit-il se jouer seul ? La sonde suggère qu'un joueur seul avec un seul kit trouve le jeu facile. *Recommandé : viser 2 à 6 joueurs, et traiter le solo comme « un joueur qui tient deux kits » (un seul élément propre au nombre de joueurs).*

**D. L'agence.** Accepte-t-on qu'à grande table certains joueurs ne donnent pas d'ordre à chaque tour (jeu partagé) ? C'est une question de goût, que la simulation ne tranche pas. *Recommandé : préférer que chacun agisse à chaque tour, donc le kit en tête, et garder le jeu partagé comme témoin et comme alternative.*

**E. Les candidats de la campagne 2.** *Recommandé : le kit par joueur (couronne de tuiles, n = J + 1 et n = 2J) et le jeu constant partagé, de 1 à 6 joueurs, avec les mesures nouvelles d'agence et de couplage ; puis la maquette jouable (décision 6) sur le candidat retenu.*
