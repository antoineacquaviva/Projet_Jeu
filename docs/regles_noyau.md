# Règles du noyau N1

*15 oct. 2026. Maquette d'étude simplifiée, demandée par l'auteur après le recul du jour (`projet/3-pilotage/prendre-du-recul.md`, décisions 1 à 5 acceptées). Elle applique la démarche « noyau d'abord » (D4) et la direction D1, « le rêve détourne ». **Statut : proposition de Claude, à jouer et à juger. Rien n'est adopté** : la V0.4 reste la dernière version adoptée. Maquette jouable : https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV (sources : `maquettes-numeriques/noyau/`). Chaque règle porte un identifiant (N1.1…), que le code cite.*

## Ce qui est gardé, ce qui est retiré
| Gardé (idées fortes, mécanismes jugés solides) | Retiré pour l'instant (modules à réintroduire un par un) |
|---|---|
| Deux plans : le plateau et la tête du Méchant | Le Cercle et la voie du réveil |
| Le plan « qui et où » : la somme des dés désigne la tactique, l'écart désigne la Machine (concentration et surprise vertes en V0.4) | Les lunes, les traces, l'escalade, les ordres supplémentaires |
| Le Méchant apprend : une tuile échange sa place avec une voisine | Les deux moitiés de carte (un seul pouvoir par peuple) |
| Les esprits, l'oubli en 12, le long sommeil au 7 | Les réglages propres au nombre de joueurs |
| Programmation secrète sur trois étapes ; Aller, Barrer, Saboter ; l'alliance | La rivière |
| Le présage | |
| Chaque peuple brise une règle | |
| Pas de défaite : on compte la forêt restante | |
| **Nouveau (D1)** : rêver annule l'ordre de l'étape | |

## 0. En une phrase
Chacun à la tête d'un peuple, les joueurs défendent ensemble la forêt pendant six tours contre les Machines d'un Méchant qui apprend ; à chaque étape, ils peuvent parer l'ordre sur le plateau, là où ils sont, ou le détourner en faisant rêver le Méchant, à n'importe quel endroit, au prix d'une carte perdue.

## 1. Mise en place
**N1.1 Plateau.** Sept zones ; les forêts entre parenthèses (21 en tout).

| Zone | Profondeur | Forêts | Voisines | Flèche de percée |
|---|---|---|---|---|
| 1 Lisière | lisière | 2 | 2, 4 | → 4 |
| 2 Clairière | lisière | 1 | 1, 3, 4, 5 | → 5 |
| 3 Várzea | lisière | 2 | 2, 5 | → 5 |
| 4 Igapó | milieu | 3 | 1, 2, 5, 6 | → 6 |
| 5 Sources | milieu | 4 | 2, 3, 4, 6, 7 | → 7 |
| 6 Colline aux aras | cœur | 4 | 4, 5, 7 | – |
| 7 Samaúma | cœur | 5 | 5, 6 | – |

**N1.2 Machines.** Cinq Machines, chacune avec 2 ou 3 organes et une zone d'entrée :

| Case de départ | Machine | Organes | Zone d'entrée |
|---|---|---|---|
| 1 | Grosse Gueule | moteur, chenilles | 1 Lisière |
| 2 | Rapiat | moteur, chenilles, phares | 2 Clairière |
| 3 | Mâchoire | moteur, phares | 3 Várzea |
| 4 | Tonton Débard | moteur, chenilles | 1 Lisière |
| 5 | Ripaille | moteur, chenilles, phares | 3 Várzea |

Les Machines 1 à 3 commencent sur leur zone d'entrée ; les Machines 4 et 5 attendent au chantier. Le nombre de Machines en jeu au départ est un réglage (3 par défaut).

**N1.3 Piste des pensées** (cases 2 à 12, publique) : 2 Percée, 3 Représailles, 4 Percée, 5 Représailles, 6 Opportunisme, 7 Cupidité, 8 Opportunisme, 9 Représailles, 10 Percée, 11 Cupidité, 12 Cupidité. Aucun esprit au départ. Les cases 2 à 6 sont le côté de l'éveil, les cases 8 à 12 le côté du rêve.

**N1.4 Piste des Machines** (cases 1 à 5, publique) : chaque Machine sur la case de son numéro.

**N1.5 Peuples.** De 2 à 6 joueurs, un peuple chacun. Chaque peuple a 3 pions de présence et une main de cartes de personnages identiques (4 par défaut, réglage), pour toute la partie : il n'y a pas de pioche.

**N1.6 Présence.** À tour de rôle, en commençant par le premier joueur, chacun pose un pion dans la zone de son choix, jusqu'à ce que tous soient posés.

## 2. Le tour
Une partie dure 6 tours (réglage) de 3 étapes.

**N2.1 Le conseil.** On lance les dés de la première étape et on les laisse visibles : c'est le **présage**. On affiche le plan qu'ils donnent (quelle Machine, quelle tactique, quelle zone). Si les oiseaux sont à la table, on lance aussi les dés de la deuxième étape (N5.1). Les joueurs parlent librement, sans montrer leur main.

**N2.2 La programmation.** Chacun, en secret et en même temps, pose au plus une carte sur chacune des trois étapes. Chaque carte est posée pour **agir** ou pour **rêver**. Une étape peut rester vide.

**N2.3 Un rêve par tour.** Chaque joueur envoie au plus une carte en rêve par tour (réglage).

**N2.4 La résolution, étape par étape.**
1. On révèle les cartes de l'étape.
2. **Les rêves** (N3) : chaque carte en rêve fait rêver le Méchant. Si au moins une carte rêve, l'ordre de l'étape est annulé.
3. **Les actions** : les cartes qui agissent choisissent leur action, à découvert, dans l'ordre des joueurs à partir du premier joueur. Les insectes choisissent après les autres (N5.4) ; les reptiles attendent les dés (N5.3).
4. **Les sabotages** s'appliquent (N4.3).
5. **Les dés** : le Méchant donne **autant d'ordres que la moitié du nombre de joueurs, arrondie au-dessus** (1 ordre à 2 joueurs, 2 à 3 et 4 joueurs, 3 à 5 et 6 joueurs). Chaque ordre a ses dés ; le premier utilise les dés déjà connus (présage, Voir).
6. Les reptiles agissent.
7. Les Machines exécutent les ordres un par un (N6.4), et le Méchant apprend après chacun (N6.5).

**N2.5 Fin du tour.** Chacun reprend en main ses cartes qui ont agi ; les cartes parties en rêve sont perdues pour la partie. Les barrages prennent fin. Le rôle de premier joueur passe au joueur suivant.

## 3. Rêver
**N3.1 Faire rêver.** Une carte en rêve fait rêver le Méchant : un esprit entre en case 12 (la tuile qui s'y trouvait est **oubliée** : retirée du jeu), ou un esprit déjà sur la piste avance d'une case vers le 7, en échangeant sa place avec la tuile voisine. Un esprit n'avance pas sur un autre esprit. Le joueur choisit ; s'il n'y a pas d'esprit, un esprit entre.

**N3.1 bis Le rêve prend racine.** Un même esprit bouge au plus une fois par tour (entrer compte). Les rêves de plus, dans le même tour, font entrer de nouveaux esprits ; s'il n'y a plus de place, ils n'ont pas d'effet sur la piste (ils annulent quand même un ordre).

**N3.2 Le rêve détourne (D1).** Chaque carte en rêve annule un ordre de son étape, le premier d'abord (celui du présage ou de Voir). Le Méchant rêve au lieu d'agir : on ne lance pas les dés de cet ordre, sauf s'ils sont déjà connus. Ce qui est annulé n'apprend rien. *Réglage : « le rêve annule l'ordre » (oui par défaut), pour comparer avec l'ancienne règle.*

**N3.3 Le prix.** La carte en rêve n'agit pas à cette étape, et elle quitte la main pour le reste de la partie.

**N3.4 Le long sommeil.** Dès qu'un esprit atteint la case 7, le Méchant s'endort : la partie s'arrête aussitôt.

## 4. Agir
**N4.1 Où agit une carte.** Une carte qui agit agit dans une zone où son peuple a un pion de présence (sauf les insectes, N5.4).

**N4.2 Les trois actions.** Chaque carte qui agit fait une seule action :
- **Aller** : déplacer un de ses pions vers une zone voisine. La carte agit alors dans la zone d'arrivée.
- **Barrer** : pendant l'étape, aucune Machine ne peut entrer dans la zone ni y abattre. Une Machine peut quitter une zone barrée pour aller abattre ailleurs (forme « entrer et abattre » du catalogue, B2 ; *réglage : forme complète, qui interdit aussi d'en sortir*).
- **Saboter** : neutraliser un organe intact d'une Machine en marche de la zone. Il faut un allié dans la zone (N4.4), sauf pour les mammifères et les entités (N5.2, N5.6). Les reptiles ne sabotent pas.

**N4.3 Les sabotages s'appliquent** une fois toutes les actions choisies (avant les dés) : un sabotage sans allié échoue. Une Machine dont tous les organes sont neutralisés est **hors service** : elle reste sur le plateau, inerte.

**N4.4 L'alliance.** Deux cartes de peuples différents qui agissent dans la même zone à la même étape sont alliées, quel que soit l'ordre de leurs choix.

## 5. Les peuples (chacun brise une règle)
**N5.1 Oiseaux, Voir.** Au conseil, les dés de la deuxième étape sont lancés et affichés, en plus du présage.

**N5.2 Mammifères, Renverser.** Ils sabotent seuls, sans allié.

**N5.3 Reptiles, Attendre.** Leurs cartes choisissent leur action après les dés, quand on sait où va la Machine (Aller ou Barrer seulement).

**N5.4 Insectes, S'unir.** Leur carte peut agir dans la zone de n'importe quelle autre carte qui agit à la même étape, même sans y être présente ; elles sont alliées. Ils choisissent après les autres cartes.

**N5.5 Humains, Tromper.** Quand une carte humaine a agi à l'étape, l'humain peut inverser ce qu'apprend le Méchant : une réussite compte comme un échec, et inversement.

**N5.6 Entités, Égarer.** Elles sabotent seules. Une Machine qu'elles mettent hors service s'égare : elle quitte le jeu et fait rêver le Méchant (N3.1, sans annuler l'ordre et sans coûter de carte).

## 6. L'ordre du Méchant
**N6.1 Le plan.** On lance deux dés. La **somme** désigne une case de la piste des pensées : sa tuile donne la tactique. L'**écart** désigne une case de la piste des Machines : sa Machine exécute ; un double désigne la case 1 (le favori). Si la tuile est un esprit, le Méchant rêve : pas d'ordre, pas d'apprentissage. Si la case désignée n'a plus de Machine (égarée), il n'y a pas d'ordre.

**N6.2 Ce que fait la Machine désignée.**
- **Au chantier** : elle entre sur sa zone d'entrée.
- **Hors service** : elle est remorquée au chantier et remise en état.
- **En marche** : elle choisit une zone selon la tactique, parmi sa zone et ses voisines qui ont encore de la forêt (son **rayon**), y va et y abat une forêt.

**N6.3 Les tactiques**, dans le rayon :
- *Cupidité* : la zone la plus boisée ;
- *Opportunisme* : la moins défendue (le moins de pions de présence) ;
- *Représailles* : la plus défendue (le plus de pions) ;
- *Percée* : la zone que montre la flèche de sa zone ; sans flèche ou sans forêt au bout, sa propre zone (si elle n'a plus de forêt : la plus boisée du rayon).

Égalités : la plus boisée, puis la zone de la Machine, puis le plus petit numéro. Si aucune zone du rayon n'a de forêt, l'ordre n'a pas d'effet.

**N6.4 L'exécution.** L'ordre échoue si un barrage empêche la Machine d'entrer dans la zone ou d'y abattre. Le plan est relu au moment d'exécuter : un ordre précédent de la même étape peut l'avoir changé. Il **réussit** s'il a eu un effet : une forêt abattue, une Machine entrée, une Machine remorquée.

**N6.5 Le Méchant apprend.** Après chaque ordre exécuté, réussi ou non :
- la tuile de la tactique échange sa place avec une voisine : vers le 7 si l'ordre a réussi (au 7, elle reste), vers le bord s'il a échoué (du 7, elle passe en 8 ; en 2 ou en 12, elle reste). Si l'ordre a réussi et que cette voisine est un esprit, l'esprit est repoussé : c'est le **tir à la corde**. Un ordre qui échoue ne fait jamais avancer un esprit : si la voisine côté bord est un esprit, la tuile reste en place. Un ordre sans effet faute de forêt compte comme un échec ;
- la Machine échange sa place avec une voisine sur la piste des Machines : vers la case 1 si l'ordre a réussi, vers la case 5 s'il a échoué.

## 7. Fin de partie
**N7.1 Deux fins.** Le **long sommeil** (un esprit atteint le 7) arrête la partie aussitôt ; sinon, **la nuit** tombe à la fin du dernier tour.

**N7.2 Bilan.** On compte la forêt restante. Il n'y a pas de défaite.

## 8. Réglages de la maquette
Ce sont des réglages d'étude, modifiables dans la page : nombre de tours (6), main (4 cartes), pions de présence (3), Machines en jeu au départ (3), ordres par étape (la moitié des joueurs, arrondie au-dessus ; ou 1, ou « n-1 »), avances d'un esprit par tour (1), rêves par joueur et par tour (1), forme du barrage (entrer et abattre), « le rêve annule l'ordre » (oui), présage (oui).

**Comment les valeurs par défaut ont été choisies (15 oct., indices).** Un calibrage local aux bots de la maquette (30 tables de 2 à 6 joueurs, 8 parties chacune, 24 combinaisons de réglages) a montré deux défauts dans la première écriture : avec le barrage complet et un ordre par étape, une table qui ne rêve jamais gardait 97 % de la forêt ; avec des esprits sans limite d'avance, rêver à heure fixe menait au sommeil dans 90 à 100 % des parties. Avec les valeurs ci-dessus, le bot qui lit le jeu garde 79 % de la forêt, contre 71 % pour la table qui ne rêve jamais et 47 % pour celle qui rêve à heure fixe : juger rapporte environ 9 points. Ce sont des **indices** (des bots simples, peu de parties) : à confirmer en jouant, puis au moteur Python.

## 9. Ce que la maquette automatise
Tout ce qui n'est pas un choix est fait par la page et affiché dans le journal : lancer les dés, calculer le plan, déplacer la Machine, abattre, appliquer barrages et sabotages, faire apprendre le Méchant, compter la forêt. Les choix restent aux joueurs : poser ses pions, programmer, choisir l'action de chaque carte, choisir l'esprit qui avance, Tromper ou non.

## 10. Pourquoi ce noyau (à vérifier en jouant)
Le choix « rêver ou défendre » doit maintenant dépendre de la situation. **Défendre** est bon marché (la carte revient) mais local : il faut être présent dans la zone de la Machine ou dans celle qu'elle vise. **Rêver** est cher (la carte est perdue) mais agit partout. On rêve donc quand l'ordre annoncé est hors de portée de la table, et on défend quand il est à portée. Le présage, Voir et la position des pions renseignent ce choix. La fin par le sommeil devient une conséquence des rêves, pas un objectif à atteindre à heure fixe. Questions à regarder en jouant : rêver devient-il une défense trop sûre ? La main de 4 cartes rend-elle les premiers rêves gratuits ? Une table qui ne rêve jamais fait-elle aussi bien qu'une table qui lit le présage ?
