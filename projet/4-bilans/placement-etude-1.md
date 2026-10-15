# Le modèle « placement » : la mécanique de base est-elle viable et stratégiquement intéressante ?

*15 oct. 2026, session interactive (Claude, Opus). Demande de l'auteur : isoler la mécanique de base (un plateau en grille, des arbres, des Machines commandées par un Méchant qui programme n actions par un hasard contrôlé, des individus commandés par un Gentil unique qui programme k actions, une résolution automatique), sans pistes ni apprentissage, et vérifier par des campagnes si elle est viable et stratégiquement intéressante. Règles du modèle : `docs/regles_placement.md`. Code : `placement/`. **Aucune règle du jeu n'est adoptée ni changée** : c'est un modèle d'étude. Les chiffres sont des **mesures** au sens du projet (bots, graines appariées), sauf mention « indice ».*

## En bref
- **Viable, par construction.** La borne voulue par l'auteur (perte du tour entre n − k et n) découle de deux règles : une menace non parée abat exactement un arbre, un ordre pare au plus une menace. Alors r = c0 − n·t + S, où S est le nombre de parades : tout le jeu se résume au **taux de parade** S / (k·t). Avec k < n et c0 > n·t, il tombe au moins un arbre par tour et il en reste toujours (vérifié par assertion dans chaque partie simulée : près de 100 000 parties).
- **Stratégiquement intéressant, mais dans une zone précise.** Dans la configuration de départ (5 × 5, 3 arbres par case, 3 Machines, 3 individus, n = 3, k = 2, 8 tours, 5 menaces annoncées), le bot fort pare 59 % des ordres contre 29 % pour la meilleure boucle sans lecture et 53 % pour une règle simple. Tous les critères de lecture sont verts sur 160 parties appariées, et le choix « protéger ou se placer » est **disputé** (test T4 : se placer gagne dans 22 % des situations, protéger dans 56 %).
- **Mais la zone est étroite dans l'espace des règles.** Sur 400 variantes tirées au hasard, 14 seulement ont tous leurs critères verts et 305 en ont au moins un rouge. Le critère qui casse le plus souvent est la **prise donnée par l'annonce** (192 fois), puis la difficulté (165).
- **Quatre mécanismes portent la zone d'intérêt** (optimisation locale, 37 variantes voisines) :
  1. se déplacer doit **coûter l'action** : l'ordre « poster » (aller et garder d'un même ordre) rend la lecture à plus d'un tour inutile (maîtrise 0,7 point) ;
  2. la garde doit rester **sur sa case** : une garde étendue aux voisines rend le déplacement inutile (0,7 point) ;
  3. le sabotage doit laisser la Machine **s'échapper** : figée, elle reste près des gardes et le placement ne vaut plus rien (0,5 point) ; sans sabotage, la lecture tombe à 14 points ;
  4. la tactique **percée**, qui fait marcher les Machines vers le cœur, donne une direction au jeu : sans elle, le placement ne vaut plus rien (0,9 point).
- **Le hasard contrôlé : plus l'annonce est précise, plus le jeu est profond.** Avec m = n (le Gentil connaît les menaces du tour, pas leur ordre), la maîtrise passe de 4,3 à 8,9 points, le dilemme est le plus équilibré (34 % contre 47 %) et le plus lisible. C'est contre-intuitif mais cohérent avec la leçon du rêve : on ne peut juger que ce qu'on peut lire.
- **Les limites à connaître.** L'essentiel de la compétence est de *lire l'annonce* (+24 points sur les boucles). Voir plus loin que le tour ajoute 4 à 9 points, soit environ un arbre par partie. Et avec c0 = 75 arbres pour 24 menaces, la forêt finale ne varie qu'entre 68 et 89 % : l'enjeu se voit mal en arbres (section 8).

## 1. Le modèle
Les règles complètes sont dans `docs/regles_placement.md` (P1 à P6). Les choix de modélisation, pris pour coller à la demande et signalés à l'auteur :

| Élément de la demande | Traduction dans le modèle | Pourquoi |
|---|---|---|
| Configuration | grille L × H, arbres par case, M Machines, p individus | tel quel |
| n actions du Méchant, « hasard contrôlé » | le Méchant **annonce m menaces** (une Machine et une tactique chacune) ; n d'entre elles s'exécutent, sans que le Gentil sache lesquelles | m règle la prise : m = n, tout est connu sauf l'ordre ; sans annonce, le Gentil joue à l'aveugle |
| k actions du Gentil | k ordres, un au plus par individu : **garder** sa case, **aller** (investissement : ne pare rien ce tour-ci), **saboter** une Machine présente | le dilemme visé : protéger maintenant ou se placer pour plus tard |
| Résolution automatique | les menaces s'exécutent une à une ; chaque tactique (cupidité, percée, opportunisme, représailles) choisit une case du rayon de la Machine, lue sur la configuration du moment | reprise des tactiques-critères du jeu (synthèse des idées, note 7 à 8) |
| Perte entre n − k et n | une menace non parée abat exactement un arbre (avec repli sur la case boisée la plus proche) ; un ordre pare au plus une menace | la borne devient un invariant vérifié à chaque tour |
| c2 < c1 | k < n | au moins une menace passe toujours |
| r > 0 | c0 > n·t | garanti dans toutes les parties |
| Le Méchant peut être un bot de force réglable | **Méchant adverse** de force β : il choisit parmi les menaces annoncées celles qui sont le moins exposées aux individus, sans voir les ordres ; **Méchant omniscient** (il voit les ordres) comme borne | le vrai jeu reste le hasard (β = 0) |

## 2. La méthode, reprise des campagnes précédentes
**Les bots du Gentil** (`placement/bots.py`), du plus faible au plus fort :

| Bot | Ce qu'il fait | Rôle |
|---|---|---|
| aléatoire | ordres légaux au hasard | plancher |
| sentinelle, marquage, regroupement | trois **boucles ouvertes** : garder sa case sans bouger ; suivre « sa » Machine et la saboter ; se rejoindre au cœur et y garder | garde-fou « aucune boucle gagnante » (C1) |
| réflexe | lit l'annonce sur la configuration du moment et garde là où ça frappe, sinon se rapproche | la règle simple du débutant |
| glouton | maximise les parades attendues du tour (tirages simulés), puis se rapproche des Machines | le joueur myope |
| Monte-Carlo (MC 256) | évalue une douzaine de programmes en jouant le tour puis 3 tours de plus | le bot fort |
| témoins | glouton aveugle (ignore l'annonce), glouton et MC immobiles (n'ont pas le droit de bouger), oracle (sait quelles menaces partent) | mesurent ce que vaut chaque chose |

**Les mesures** sont des écarts de taux de parade entre bots joués sur les mêmes graines. Les seuils sont des **seuils de lecture provisoires**, inspirés des bandes du projet (garde-fou C1, tests T3 et T4), qui ne jugent aucune version du jeu :

| Mesure | Question | Définition | Vert | Rouge |
|---|---|---|---|---|
| Lecture | lire le jeu bat-il toute boucle ? | bot fort − meilleure boucle | ≥ 10 | < 3 |
| Profondeur | une règle simple suffit-elle ? | bot fort − réflexe | ≥ 5 | < 1 |
| Information | l'annonce donne-t-elle une prise ? | glouton − glouton aveugle | ≥ 5 | < 1 |
| Placement | se déplacer compte-t-il ? | glouton − glouton immobile | ≥ 5 | < 1 |
| Maîtrise | voir plus loin que le tour compte-t-il ? | MC − glouton | ≥ 4 | < 1 |
| Difficulté | ni trivial ni impossible | taux du bot fort | 35 à 75 | < 20 ou > 90 |

Le **score d'intérêt** d'une variante est sa note la plus faible, comme la qualité des cycles. Une variante sans annonce reçoit 0 en information : le modèle exige que le hasard donne une prise.

**Les témoins** (méthode, règle 3 : une mesure n'est gardée que si son témoin rate comme prévu) :

| Témoin | Construction | Mesure visée | Attendu | Obtenu (40 parties) |
|---|---|---|---|---|
| Boucle gagnante | plateau 3 × 3, 8 voisins, garde étendue | lecture | rouge | −0,3 : **rouge** |
| Annonce inutile | sans annonce | information, profondeur | rouge | information nulle par construction ; profondeur 3,3 : orange |
| Téléportation | portée 8 et ordre « poster » | maîtrise | rouge | −0,9 : **rouge** |
| Jeu résolu | téléportation, garde étendue, m = n | difficulté, maîtrise | rouge | 99,8 % et 0,2 : **rouges** |

Les quatre mesures ratent là où elles doivent rater. Le jeu résiste bien aux boucles : il a fallu un plateau de 3 × 3 cases pour en construire une qui gagne.

**Les campagnes** (outillage `placement/campagne.py`, `placement/analyse.py`, workflow GitHub **Placement**) :

| Étape | Plan | Contenu | Où |
|---|---|---|---|
| Témoins | `placement_temoins` | base et 4 témoins, 40 parties | local, puis GitHub (run 1, résultats identiques) |
| Criblage | `placement_criblage` | 400 variantes au hasard dans 15 paramètres et variantes de règles, 16 parties, 9 bots sans Monte-Carlo (57 600 parties) | local, 10 min |
| Élection | `placement_election` | les 20 meilleures et la base, avec le MC, 32 parties | GitHub, run 2 |
| Optimisation locale | `placement_voisinage` | la base et ses 37 voisines à un cran, 48 parties | GitHub, run 3 |
| Confirmation | `placement_confirmation` | les 8 meilleures, 160 parties | GitHub, run 5 |
| Force du Méchant | `placement_mechant` | 3 variantes × 5 forces × 3 bots, 64 parties | GitHub, run 6 |
| Choix disputé | `python -m placement.dispute` | T4 et T5 sur 5 variantes, 40 parties (320 décisions chacune) | local |

Calcul GitHub : 6 lancements de 1 à 2 minutes chacun. Résultats : branche `resultats`, dossier `placement/` ; copies des rapports dans `resultats/placement/` sur `main`.

## 3. Viabilité
- **La borne et r > 0** sont des assertions du moteur : aucune n'a sauté sur l'ensemble des campagnes.
- **Le résultat est un seul nombre.** Dans la base, r = 75 − 24 + S, avec S entre 0 et 16 : la forêt finale va de 51 à 67 arbres (68 à 89 %).
- **Les écarts entre parties** : l'écart-type du taux du bot fort est de 10 à 12 points d'une partie à l'autre. Le bot fort bat la règle simple sur une même graine dans 71 % des parties (bande « part de la compétence » de la campagne de profondeur : 60 à 85 %).

## 4. Le criblage : où le jeu est intéressant
Sur les 400 variantes, avec le glouton comme bot fort (sans Monte-Carlo, donc la profondeur est sous-estimée) :

| | Vert | Orange | Rouge |
|---|---|---|---|
| Lecture | 239 | 71 | 90 |
| Profondeur | 290 | 47 | 63 |
| Information | 114 | 115 | 171 |
| Placement | 240 | 79 | 81 |
| Difficulté | 153 | 121 | 126 |

**Ce que font les paramètres** (moyenne par niveau, les autres paramètres tirés au hasard) :
- **Poster** (aller et garder d'un même ordre) : le taux passe de 63 à 88 %, la lecture de 6 à 30 points. Le jeu devient facile, et c'est le seul ordre qui compte.
- **Garde étendue** : le taux passe de 60 à 87 %, l'information de 7 à 3 points, le placement de 21 à 10. Le jeu devient facile et la position compte moins.
- **Annonce** : sans annonce, information nulle par construction. Avec annonce, l'information baisse quand m s'éloigne de n : 8,0 points pour m = n, 5,6 pour m = n + 1, 3,6 pour m = n + 2 et n + 3.
- **Sabotage** : « échappe » donne le meilleur score moyen ; « fige » divise le placement par deux (9 contre 16 à 19).
- **Tactiques** : la composition sans représailles (cupidité, percée, opportunisme) donne le meilleur score moyen (0,18 contre 0,08 pour les quatre à égalité).
- **n = 3, k = 2, 4 individus et une portée de 1** donnent les meilleurs scores moyens. La taille du plateau, la forêt par case et le profil de forêt pèsent peu.

## 5. Élection, optimisation, confirmation
**L'élection** (les 20 meilleures du criblage rejouées avec le MC et de nouvelles graines) a fait tomber la plupart d'entre elles : le criblage à 16 parties favorise les variantes chanceuses. Seules 4 gardent un score de 1, aux côtés de la base. Trois d'entre elles ont un seul ordre par tour (k = 1) et de grands écarts entre parties (écart-type jusqu'à 22 points).

**L'optimisation locale** autour de la base (37 voisines à un cran, 48 parties) montre un **plateau** : 11 voisines sur 37 restent toutes vertes, 31 ont un score d'au moins 0,4. Les crans qui cassent le jeu sont nets et désignent les mécanismes porteurs :

| Cran | Ce qui casse | Valeur |
|---|---|---|
| ordre « poster » | maîtrise | 0,7 point (taux 72 %) |
| garde étendue | placement | 0,7 point (taux 79 %) |
| sabotage « fige » | placement | 0,5 point |
| tactiques sans percée | placement | 0,9 point |
| sans annonce | information, profondeur | 0 et 3,0 points |
| 4 Machines | maîtrise | 0,4 point |
| sans sabotage, ou sabotage à deux | lecture, difficulté | 13 à 14 points, taux 43 à 44 % |

**La confirmation** (160 parties appariées, IC à 95 % de ± 1,5 à 2,5 points) :

| Variante | Taux MC | Lecture | Profondeur | Information | Placement | Maîtrise | Score |
|---|---|---|---|---|---|---|---|
| **base** | 59,1 | 29,8 | 6,4 | 10,5 | 7,3 | 4,3 ± 1,8 | 1,00 |
| plateau 6 × 5 | 55,9 | 27,1 | 7,8 | 8,9 | 7,7 | 4,9 | 1,00 |
| plateau 5 × 6 | 56,1 | 28,9 | 6,8 | 8,6 | 6,8 | 5,2 | 1,00 |
| 10 tours | 57,1 | 28,1 | 6,2 | 10,0 | 8,8 | 4,9 | 1,00 |
| **m = n = 3** | **64,7** | **36,3** | **8,6** | 10,1 | 5,7 | **8,9 ± 1,8** | 1,00 |
| forêt en bosquets | 58,5 | 27,6 | 5,7 | 10,1 | 9,9 | 4,5 | 1,00 |
| portée 2 | 61,8 | 23,2 | 5,7 | 10,6 | 7,8 | 6,4 | 1,00 |
| m = 4 | 59,8 | 29,9 | 6,8 | 10,9 | 7,7 | 3,4 | 0,79 |

**L'échelle des bots de la base** (160 parties) : aléatoire 5,5 (40 parties) ; boucles 27 à 29 ; réflexe 52,7 ; glouton 54,8 ; MC 59,1. Le glouton aveugle fait 44,3 ; le glouton immobile 47,5 ; le MC immobile 55,2.

Seule m = n se détache nettement de la base. Les autres voisines sont équivalentes à la précision atteinte.

## 6. Le choix « protéger ou se placer » est-il disputé ? (T4, T5)
À chaque décision d'une partie du MC, on compare le meilleur programme sans déplacement et le meilleur programme avec au moins un déplacement, chacun estimé par 96 suites appariées. Δ = se placer − protéger, en parades ; zone neutre à ± 0,15 parade. 320 décisions par variante.

| Variante | Se placer gagne | Protéger gagne | Neutre | Valeur du jugement | T5 : un indice / majorité | Régime |
|---|---|---|---|---|---|---|
| base (m = 5) | 22 % | 56 % | 22 % | 5,3 points | 78 % / 72 % | **disputé** |
| m = 4 | 29 % | 53 % | 18 % | 7,5 points | 76 % / 65 % | **disputé** |
| m = n = 3 | 34 % | 47 % | 20 % | 9,3 points | 69 % / 58 % | **disputé, le plus équilibré** |
| ordre « poster » | 68 % | 23 % | 8 % | 7 points | 75 % / 74 % | presque dominé (se placer) |
| sabotage « fige » | 13 % | 72 % | 14 % | 2,9 points | 85 % / 84 % | dominé (protéger) |

*Valeur du jugement : ce que gagne celui qui choisit au cas par cas sur la meilleure option fixe, ramenée en points de taux de parade. T5 : précision du meilleur seuil sur un seul indice public (tour, menaces sur des cases occupées, distance aux Machines, Machines au contact), comparée à la réponse majoritaire.*

**Lecture.** Dans la base et ses variantes à annonce plus précise, chaque option gagne dans au moins 20 % des situations, et la zone neutre reste sous 50 % : c'est le régime « disputé » de `choix-strategique.md`. Les deux témoins tombent du bon côté : l'ordre « poster » pousse vers « se placer », le sabotage figé vers « protéger ». **Un seul indice n'explique qu'une partie de la réponse** : il apporte 6 à 11 points sur la majorité. C'est la condition « profondeur » du choix (indice, 40 parties).

## 7. Le Méchant de force réglable
Le même Gentil contre un Méchant qui choisit les menaces les moins exposées (64 parties, taux du MC) :

| Variante | Hasard (β = 0) | β = 1 | β = 3 | β = 10 | Omniscient |
|---|---|---|---|---|---|
| base (m = 5) | 59,7 | 52,3 | 45,1 | 43,8 | 25,4 |
| plateau 6 × 5 | 53,0 | 47,4 | 41,2 | 37,2 | 27,5 |
| m = 4 | 61,0 | 57,3 | 53,5 | 51,6 | 38,8 |

- β est un **bouton de difficulté continu** : de 9 à 16 points de taux entre le hasard et β = 10.
- **Plus le Méchant est fort, plus la compétence paie** : dans la base, l'écart entre le MC et le glouton passe de 3,0 points (hasard) à 7,5 (β = 3 et 10).
- Avec m = n, le Méchant n'a plus aucun choix : sa force ne joue plus. Pour garder ce bouton, il faut m > n.

## 8. Les limites
- **Le bot fort reste modeste** : Monte-Carlo à un coup, avec des suites jouées au réflexe. La maîtrise mesurée (4 à 9 points) est une borne basse de ce qu'un joueur qui anticipe peut gagner.
- **Le criblage juge au glouton** et à 16 parties. L'élection a montré qu'il faut le relire avec un bot plus fort et plus de parties.
- **Le choix disputé est un indice** : 40 parties, un seuil s choisi par Claude, et des indices publics encore pauvres pour T5.
- **L'enjeu en arbres se voit mal** : avec c0 = 75 et n·t = 24, toute la compétence du monde fait varier la forêt de 16 arbres. Pour qu'une table sente chaque arbre, il faut c0 juste au-dessus de n·t (par exemple 1 arbre par case : r va de 1 à 17). Le criblage montre que la forêt par case pèse peu sur les mesures : ce réglage est libre.
- **Aucune partie humaine.** Lisibilité, plaisir et temps de décision restent à juger à la table.

## 9. Suite proposée : la campagne 2 du modèle placement
1. **Des instruments plus forts** : MC dont les suites jouent au glouton, puis un MCTS sur deux tours ; validation de l'échelle sur les témoins. *Choix technique de Claude.*
2. **Le hasard contrôlé en détail** : m = n, n + 1 et n + 2 à 400 parties appariées, avec T4 et T5 à 120 parties et deux instruments ; indices T5 plus riches (menace la plus probable, Machine la plus avancée vers le cœur).
3. **Un mécanisme qui couple l'information et l'action** (à soumettre à l'auteur, c'est une règle d'essai) : *Éclairer*, un ordre qui ne pare rien mais retire de l'annonce une menace qui ne partira pas (le « Voir » des oiseaux). Il crée un troisième usage de l'ordre (se placer, protéger, savoir) et rend m variable en cours de tour.
4. **Rendre l'enjeu visible** : c0 proche de n·t.
5. **MAP-Elites dans la zone d'intérêt** (axes : information et placement), en ne gardant que les règles porteuses identifiées en section 5.
6. **Une maquette jouable** du modèle (sur le modèle de la page du noyau N1) pour une première partie humaine : c'est la porte « humain » de la conception.

## 10. Décisions proposées à l'auteur
1. **Valider les hypothèses de modélisation** (section 1 : annonce de m menaces, trois ordres, Aller sans parade, une parade par ordre, k < n, c0 > n·t). *Recommandé : oui.*
2. **Le réglage du hasard contrôlé** : m = n (le plus profond et le plus lisible, mais le tour est connu et la force du Méchant ne joue plus) ou m = n + 1 (un peu de doute, bouton de force conservé). *Recommandé : garder les deux en candidates pour la campagne 2, avec m = n en tête.*
3. **Les règles porteuses** : se déplacer coûte l'action (pas d'ordre « poster »), garde sur sa seule case, sabotage qui laisse la Machine s'échapper, percée dans le jeu du Méchant. *Recommandé : les retenir comme contraintes de conception du modèle.*
4. **Les seuils de lecture provisoires** (section 2) : les garder comme indices, sans valeur de bande. *Recommandé : oui, à revoir après la campagne 2.*
5. **Lancer la campagne 2** (section 9), y compris l'essai de l'ordre *Éclairer*. *Recommandé : oui.*
6. **Publier une maquette jouable** du modèle pour un test humain. *Recommandé : oui, après la décision 2.*

**Réponse de l'auteur (15 oct., 17 h 50) : les six recommandations sont validées.** Avant la campagne 2, il demande une réflexion sur la division du Gentil en plusieurs joueurs : `projet/3-pilotage/nombre-de-joueurs-pistes.md`.
