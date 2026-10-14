# Campagne de profondeur : tester la V1 en profondeur, l'optimiser, mesurer la courbe d'apprentissage

*13 oct. 2026, 20 h 45 ; renommé le 14 oct. (auparavant « Campagne P3 » : dans le dépôt, « P3 » désigne le protocole du cycle 2). Rédigé par Claude à la demande de l'auteur. Les étapes de la campagne sont notées CP.0 à CP.6. **Document en réserve** : il prépare la campagne qui suivra le [plan vers la V1](plan-vers-v1.md), une fois la V1.0 gelée, jouée, testée et améliorée par l'auteur (V1.x). Rien n'est lancé ni codé. Les seuils proposés sont provisoires ; les choix marqués « auteur » lui reviennent le moment venu (règle de décision du 13 oct.).*

> **Mise à jour du 14 oct., 14 h 30.** Une partie de ce document est **avancée avant la V1**, dans les cycles en cours, à la demande de l'auteur : voir [avant-ou-apres-v1.md](avant-ou-apres-v1.md). On y trouve le tri entre ce qui s'applique maintenant (M1 à M11 : tests du choix stratégique T1 à T5, discipline statistique, distribution des résultats, stabilité, vitesse du pipeline), ce qui se fait à chaque version adoptée, et ce qui attend la V1. La décision 9 de la section 9 est prise (C1, bandes confirmées). La leçon du rêve ([choix-strategique.md](choix-strategique.md)) remplace la proposition de la section 3.1 pour la mesure des dilemmes.

## En bref
- **Changer de logique** : la campagne actuelle *explore et sélectionne* (criblage, MAP-Elites, des centaines de variantes au glouton). La campagne de profondeur *éprouve et affine* une seule version : beaucoup de parties, des bots plus forts et plus variés, des réglages fins autour de la V1.x.
- **Capitaliser** : moteur, mesures, bandes, statistiques appariées, pipeline GitHub autonome, rapports et alertes restent. La V1.0 rejouée sous P2 sert d'**ancre**.
- **Cinq chantiers, plus un pilote IA** (section 4 bis : modèle de langage comme joueur de conseil et juge à l'aveugle, en petits volumes) :
  1. critères d'évaluation affinés (distribution des résultats, moments décisifs, diversité des stratégies, coût des règles) ;
  2. bots renforcés : vrai MCTS à plusieurs coups, puis bot appris par **itération d'expert** (une forme d'apprentissage par renforcement adaptée au moteur) ;
  3. **nouveau critère : la courbe d'apprentissage**, pour un jeu intéressant à la découverte et qui le reste pour des initiés ;
  4. recherche active de failles (stratégies dominantes, règles fragiles), dont le critère **« aucune action ni suite d'actions répétée ne gagne »** (section 6 bis) : aujourd'hui couvert seulement pour le rêve et pour « parer au plus probable » ;
  5. optimisation fine sur quelques paramètres, puis kit de test humain révisé.
- **Conçue pour la vitesse dès le départ** (section 8 bis) : profilage d'abord, parallélisme au grain de la partie avec résultats identiques quel que soit le nombre de processus, reprise après coupure, mémoire des résultats, arrêt séquentiel, et une **file de nuit** où tournent seules les tâches qui n'attendent aucune décision. Le temps d'attente d'une réponse humaine est traité comme un coût au même titre que le calcul.
- **Le lien avec les tests de l'auteur est central** : ses parties de la V1 servent à calibrer les bots « débutants » et à vérifier les indices de la courbe d'apprentissage.

## 1. Quand lancer la campagne de profondeur : conditions d'entrée
| Condition | Pourquoi |
|---|---|
| V1.0 gelée, puis jouée et amendée par l'auteur (V1.x), règles écrites dans le livret | la campagne teste une version stable ; un changement de règle en cours de campagne invalide les comparaisons |
| Moteur conforme à la V1.x (`foret.conformite`, tests verts), règles citées par les tests | même règle de travail qu'aujourd'hui |
| **Journal des parties humaines** de l'auteur : pour chaque partie, table, peuples, rang de la partie pour chaque joueur (1re, 2e…), forêt finale, tour de fin, durée réelle, hésitations notées | c'est la seule source pour calibrer les bots débutants et la courbe d'apprentissage (section 5) |
| Liste des points qui ont gêné l'auteur à la table | la campagne les cible en priorité |

*Recommandation* : dès les premières parties de la V1, que l'auteur remplisse la fiche d'observation du kit, avec une colonne « rang de la partie pour ce joueur ». C'est peu de travail et c'est ce qui rendra la campagne utile.

## 2. Ce qui change par rapport aux cycles en cours
| Aspect | Cycles V0.3 → V0.6 (protocoles P2 à P4) | Campagne de profondeur |
|---|---|---|
| Question | quelle variante garder ? | cette version tient-elle partout, pour tous les niveaux de joueurs, et peut-on l'affiner ? |
| Variantes | des centaines (criblage, MAP-Elites) | une version, son voisinage immédiat (± un cran par paramètre), ses niveaux de difficulté |
| Bot de recherche | glouton (bon marché), MC64R en confirmation | bots forts partout ; glouton seulement comme niveau de joueur |
| Tables | échantillon (6 duos, 4 trios, 3 quatuors, 2 quintettes, 1 table de six) | **les 57 compositions** (15 + 20 + 15 + 6 + 1) |
| Précision | 4 parties par table, marges de 3 à 4 points | ± 1 point par taille de table, ± 2 points par table, à la demande (course d'élimination conservée) |
| Bots | MC64R, contrôle à portefeuille | une échelle de 6 à 7 niveaux, dont un MCTS et un bot appris |
| Critères | 4 objectifs, garde-fou, bandes gelées (B1) | les mêmes, plus des mesures affinées et la courbe d'apprentissage |
| Sortie | une version proposée | un **rapport de validation**, quelques réglages fins proposés, des niveaux de difficulté calibrés, un kit humain révisé |

**Ce qui est réutilisé sans changement** : moteur `foret`, registre `MESURES`, statistiques appariées (`foret/stats.py`), rapports et alertes (`foret/cycle.py`), orchestrateur `cycle.yml` et surveillance, tâches planifiées (Sonnet courant, Opus d'analyse), branche `resultats`, règle de décision.

**Ce qui est ajouté** : un **protocole de profondeur** versionné. Il rejoue la V1.0 sous le dernier protocole des cycles et sous le sien (ancre), comme le prévoit le plan pour chaque nouveau protocole.

## 3. Des critères d'évaluation affinés
### 3.1 Solidifier les mesures fragiles
| Mesure | État en P2 | Proposition |
|---|---|---|
| Dilemmes | indice descriptif, témoin raté | recalculer avec le bot le plus fort (MCTS) sur un échantillon plus grand ; un dilemme = deux options dont l'écart de valeur est inférieur au bruit de l'estimation, avec un nombre de suites suffisant pour que ce bruit soit petit ; nouveau témoin : une variante où une option est toujours meilleure |
| Coordination (traces) | nulle pour les bots | le bot chacun pour soi ne sait pas *profiter* d'une information. Mesurer d'abord la **valeur de l'information** : bot qui voit les mains des autres contre bot qui ne voit que les traces. Si l'écart est nul, la communication ne peut pas compter, quel que soit le bot (constat de conception, pas de mesure) |
| Choix morts | témoin partiel | refaire le témoin avec un seul pouvoir retiré ; mesurer par **contexte** (un pouvoir rare mais décisif dans 5 % des parties n'est pas mort) |
| Apprentissage du Méchant | +1,7 point, orange | le mesurer par niveau de joueur : un Méchant qui apprend devrait peser plus contre un joueur fort, qui le pousse à s'adapter |

### 3.2 Mesures nouvelles
| Mesure | Ce qu'elle dit | Étiquette | Proposition de bande |
|---|---|---|---|
| **Distribution des résultats** : écart-type et forme (une seule bosse, deux bosses), pas seulement la moyenne | une moyenne de 70 % peut cacher des parties à 95 % et d'autres à 40 % | mesure | à décrire d'abord, pas de bande |
| **Moments décisifs** : part des parties où une seule décision change le résultat de 5 points ou plus (estimé par copie d'état) | le « sauvetage au dernier ordre » de Malik ; l'impression que les choix comptent | indice | vert 20 à 60 % des parties, au moins un moment décisif dans le dernier tiers dans 10 % des parties |
| **Diversité des stratégies** : regrouper les parties du bot fort par profil d'usage (actions, rêves, zones) ; nombre de groupes qui gagnent à peu près autant | « aucune stratégie dominante » (Hélène), « l'arc toujours identique » (Vin d'jeu sur *Spirit Island*) | indice | vert ≥ 3 groupes à moins de 3 points du meilleur |
| **Variété des arcs** : courbe de la menace tour par tour, regroupée en formes | rejouabilité, récit | indice | vert ≥ 4 arcs fréquents (grille d'Hélène) |
| **Coût des règles** : pour chaque règle du livret, part des parties où elle sert, et effet de sa suppression sur les objectifs | une règle rare qui ne change rien est un coût d'apprentissage sans bénéfice | mesure | signaler toute règle utilisée dans moins de 5 % des parties et sans effet mesurable : candidate à la simplification (décision de l'auteur) |
| **Paralysie** : options légales par décision et part des décisions où les deux meilleures options sont proches | attente, analyse lourde | indice | à calibrer sur les durées réelles des parties de l'auteur |
| **Effet leader** : gain d'un pilote unique sur des joueurs indépendants de même niveau, et par niveau (section 5.4) | Camille, Nadia | indice | bandes du chef unique actuelles |

### 3.3 Discipline statistique
- Avec cinq tailles de table et une trentaine de mesures, des fausses alertes apparaîtront par hasard. Les rapports de la campagne contrôleront le **taux de fausses découvertes** (méthode de Benjamini-Hochberg) et sépareront les verdicts « sûrs » des « à revoir ».
- Taille d'échantillon fixée par calcul de puissance à partir des écarts appariés mesurés en P2. *Supposé* : si l'écart-type d'une différence appariée est de 8 points, environ 250 paires suffisent pour ± 1 point. À mesurer sur les données de la campagne 16.
- Chaque verdict est donné **par bot** : il n'est retenu comme fait du jeu que s'il est le même avec au moins deux bots de familles différentes.

## 4. Des bots renforcés
### 4.1 L'échelle des bots de la campagne
| Niveau | Bot | Rôle |
|---|---|---|
| N0 | aléatoire légal | plancher |
| N1 | **débutant** : règles simples qu'on donne à la première partie (parer la menace visible, ne rêver qu'avec une carte faible), avec du bruit calibré sur les parties humaines | le joueur qui découvre |
| N2 | glouton | le joueur qui a compris le tour |
| N3 | MC 16 | le joueur de quelques parties |
| N4 | MC64R | l'initié (bot fort actuel) |
| N5 | **MCTS à plusieurs coups** (arbre sur la décision et les deux ou trois suivantes, déterminisation des mains cachées) | le joueur expérimenté qui anticipe |
| N6 | **bot appris** (section 4.2), éventuellement guidant le MCTS | le meilleur joueur qu'on sache construire ; sert de plafond |
| Borne | bot omniscient qui pilote toute la table | ce qu'aucun humain n'atteint : mesure la marge restante |

Chaque bot est validé comme aujourd'hui : chaque marche de l'échelle doit être significative (garde-fou), et sur les témoins (V0.2, « pouvoir qui ne fait rien »).

### 4.2 L'apprentissage par renforcement, de façon réaliste
**Contrainte** : le moteur est en Python pur, une suite coûte 5 à 15 ms, et le calcul tourne sur des processeurs GitHub, sans carte graphique. Un apprentissage « à la AlphaZero » entièrement par auto-jeu est hors de portée en l'état (supposé, ordre de grandeur).

**Voie proposée, par étapes, chacune utile seule** :
1. **Évaluation apprise.** Enregistrer des millions d'états des parties existantes avec leur forêt finale, et apprendre une fonction qui prédit le résultat depuis l'état (régression sur des traits lisibles, puis petit réseau). Le bot MC s'en sert pour couper ses suites : à budget égal, il devrait voir plus loin. Coût faible, gain probable.
2. **Itération d'expert** : le MCTS guidé joue, une politique apprend à imiter ses choix, puis guide le MCTS suivant, et ainsi de suite. C'est la forme d'apprentissage par renforcement la mieux adaptée à un moteur lent, parce qu'elle tire parti de la recherche existante.
3. **Auto-jeu pur** (gradient de politique, une seule politique partagée par les sièges, le peuple en entrée) : seulement si les étapes 1 et 2 plafonnent.

**Ce que le bot appris apporte au jeu, au-delà de la force** :
- il **découvre** des stratégies qu'aucune politique écrite ne contient, et donc les éventuelles stratégies dominantes ;
- sa **courbe d'apprentissage** (résultat en fonction du nombre de parties jouées) donne un indice de la courbe humaine (section 5.3) ;
- ses choix, résumés en un court arbre de décision, donnent des **conseils de jeu** lisibles, utiles au livret et à la mesure de la chaîne de compétences (section 5.2).

**Préalables techniques** (choix de Claude le moment venu) : dépendances nouvelles (numpy au minimum) et peut-être une accélération des parties chaudes du moteur ; modèles sauvegardés par étapes pour respecter les 6 h par tâche ; ou, si le volume l'exige, l'environnement décrit dans le « Cahier des charges - environnement de calcul cloud ». Un coût payant éventuel reviendrait à l'auteur.

### 4.3 Des bots « humains »
- **Débutant calibré** : le bruit et les biais du bot N1 (myopie, réticence à rêver, préférence pour la zone la plus visible) sont ajustés pour reproduire les résultats des premières parties humaines du journal de l'auteur.
- **Styles du panel** : Malik (choisit parfois le beau geste), Jean-Marc (offensif), Sophie (prudente). Ils servent à vérifier qu'aucun style raisonnable n'est puni au point de rendre la partie pénible.

## 4 bis. L'IA dans la campagne : un pilote avant tout budget
*Ajouté le 13 oct., 22 h 35, à la demande de l'auteur. « IA » désigne ici un modèle de langage (comme Claude) appelé par programme, à distinguer des bots Monte-Carlo et du bot appris de la section 4.*

### Verdict en une ligne
- **Jouer fort : non.** Une partie compte environ 50 à 150 décisions ; chaque appel porte l'état du jeu en texte. Soit quelques centaines de milliers de jetons par partie (estimation), c'est lent, cher à l'échelle de milliers de parties, et un modèle de langage calcule moins bien qu'un Monte-Carlo sur un problème tactique. Le MCTS et le bot appris restent la bonne voie pour la force.
- **Ce que les bots ne savent pas faire : oui, en petits volumes.** Parler, lire les règles comme un humain, juger ce qui ne se compte pas.

### Cas d'usage 1 : le comportement des bots
| Usage | Ce qu'il apporte | Ce qu'il remplace ou comble | Volume |
|---|---|---|---|
| **Table qui délibère** : des modèles jouent chacun un peuple et discutent au conseil (rôles inspirés du panel : un « Hélène » qui tend à diriger, une « Nadia » qui suit) | un indice sur la coordination, l'effet leader et l'alerte C (« solitaire à plusieurs »), aujourd'hui « humain seulement » parce que le moteur ne sait pas faire parler les joueurs | comble un trou | quelques dizaines de parties de duo et de trio |
| **Débutant sur livret** : un modèle qui ne connaît que le livret écrit, sans aide | révèle ambiguïtés, erreurs de première partie, règles oubliées ; bot N1 plus crédible qu'un glouton bruité | complète le bot N1 de la section 4.1 (calibré sur les parties de l'auteur) | 20 à 30 parties |
| **Choix expliqués** : le modèle justifie ses décisions clés | matière pour la chaîne de compétences (section 5.2) et les conseils du livret | – | échantillon de parties |

*Conduite* : un petit modèle pour jouer, un modèle plus grand pour analyser les journaux. Le moteur appelle le modèle seulement aux décisions non forcées et à la phase de conseil, avec un état du jeu mis en texte et les actions légales numérotées ; toute réponse hors liste est refusée et redemandée une fois, puis le bot retombe sur le glouton (compté dans le rapport).

### Cas d'usage 2 : l'évaluation « sensible »
Un appel par partie ou par paire de parties, à partir du journal raconté (le moteur sait déjà produire le journal des décisions). Le modèle peut juger :
- la tension et l'arc de la partie ;
- les moments mémorables ;
- l'accord entre le thème et les mécaniques ;
- la clarté du livret (lecture critique des règles écrites) ;
- « Malik, Sophie ou Jean-Marc aimeraient-ils cette partie ? » (grilles du panel).

**Garde-fous, tous obligatoires** :
1. **Comparaison à l'aveugle** (partie A ou B, laquelle a le plus de tension ?), ordre tiré au hasard, plutôt que des notes absolues, que les modèles gonflent.
2. **Témoins** : une variante connue pour être mauvaise (V0.2 « résolue », jeu à un seul truc, section 5.6) doit perdre la comparaison. Sinon, le juge est écarté.
3. **Calibration humaine** : le juge doit retrouver ce que la table de l'auteur a ressenti sur les parties jouées (journal de la section 1). Pas d'accord, pas de juge.
4. **Étiquette « indice IA »**, ajoutée à mesure, indice et humain seulement. Jamais un critère de sélection automatique : il trie les parties à regarder et suggère des hypothèses.
5. **Reproductibilité** : version du modèle figée, consignes versionnées, sorties conservées avec la graine de la partie, deux évaluations par paire pour mesurer l'accord du juge avec lui-même.

### Le pilote proposé (CP.1 bis)
| Volet | Contenu | Critère de réussite |
|---|---|---|
| A. Juge à l'aveugle | 50 paires de parties MC64R (V1.x contre des témoins et contre elle-même), 2 jugements par paire | le juge classe les témoins connus comme mauvais dans au moins 80 % des paires ; accord avec lui-même d'au moins 75 % |
| B. Calibration | les parties humaines de l'auteur, racontées en journal, jugées par le modèle | le classement du modèle recoupe l'impression de l'auteur sur au moins 2 parties sur 3 |
| C. Table qui délibère | 20 parties de duo avec conseil parlé entre modèles, comparées à « aucun signe » et « tout dire » | l'écart entre les deux témoins est visible (sinon la communication ne peut pas compter, constat de conception) |
| D. Débutant sur livret | 20 parties avec un modèle qui n'a que le livret | au moins 5 erreurs de règle distinctes relevées, ou la preuve que le livret tient |

- **Coût** : à mesurer pendant le pilote (jetons réellement consommés par partie et par jugement), puis à extrapoler. Je ne chiffre pas en euros ici : les tarifs changent.
- **Décision d'arrêt** : si le volet A échoue, on abandonne l'évaluation sensible par IA ; si le volet C ne montre aucun écart, on abandonne la table qui délibère. Chaque volet est indépendant.
- **Où ça tourne** : les appels partent de GitHub Actions, donc avec une clé d'API stockée dans les secrets du dépôt (jamais dans le code ni les résultats du dépôt public). Aucune donnée personnelle n'entre dans les consignes.

### Ce que l'IA ne remplace pas
Les modèles partagent les mêmes biais et jugent le plausible plutôt que le vrai. Ils ne remplacent ni la table humaine (plaisir, clarté vécue, qualité de la discussion), ni les mesures chiffrées. Ils préparent de meilleurs tests humains.

## 5. Nouveau critère : la courbe d'apprentissage
**L'objectif de l'auteur** : le jeu doit être intéressant à la découverte et rester intéressant pour des initiés. Traduit en simulation, cela donne cinq exigences.

### 5.1 La courbe des niveaux
On joue la V1.x avec chaque niveau de l'échelle (N0 à N6), à toutes les tailles de table, graines appariées, et on trace le résultat en fonction du niveau.

| Exigence | Mesure | Étiquette | Vert proposé | Rouge proposé |
|---|---|---|---|---|
| **Accueil** : un débutant ne vit pas une soirée gâchée | forêt gardée par N1 en mode « découverte » ; part de ses parties sous le plancher | indice | N1 ≥ 50 % ; moins de 10 % des parties sous 40 % | N1 < 35 % |
| **Progrès visible** : on sent qu'on s'améliore dès les premières parties | écart N1 → N3 | indice | ≥ 8 points | < 3 points |
| **Marge de maîtrise** : l'initié a encore à apprendre | écart N4 → N6 | indice | ≥ 8 points | < 3 points (jeu « résolu » pour l'initié) |
| **Courbe régulière** : pas un seul « truc » qui débloque tout | aucune marche de l'échelle ne porte plus de la moitié de l'écart total N1 → N6 | indice | aucune marche > 50 % | une marche > 70 % |
| **Part de la compétence** : le meilleur joueur gagne souvent, pas toujours | probabilité qu'un niveau batte le niveau inférieur sur une même graine | indice | 60 à 85 % | < 55 % (le hasard décide) ou > 95 % (aucun suspense) |

### 5.2 La chaîne de compétences
Un jeu qui garde ses initiés offre une **suite de leçons**, chacune rentable : « parer la menace la plus probable », puis « garder une carte pour la dernière étape », puis « lire la piste des pensées pour prévoir la tactique »… On peut la mesurer :
- partir du bot N1 et lui ajouter une à une des heuristiques lisibles, extraites du bot fort (section 4.2) ;
- compter combien d'heuristiques successives apportent chacune au moins 2 points.

*Proposé* : vert ≥ 4 maillons ; rouge ≤ 1 (une fois le premier conseil appris, il n'y a plus rien à apprendre). La liste des maillons sert aussi à écrire les **conseils stratégiques** du livret, du plus simple au plus fin.

### 5.3 La courbe d'un apprenant
Le bot appris (section 4.2) apprend à partir de zéro ; on suit son résultat en fonction du nombre de parties jouées :
- **découverte** : parties 1 à 10 de l'apprenant ;
- **initié** : jusqu'à environ 100 ;
- **maîtrise** : au-delà.

Les mesures : nombre de parties pour atteindre le niveau du glouton, puis 90 % du plateau ; pente encore positive après la phase « initié ».

*Limite importante* : un algorithme n'apprend pas comme un humain (il lui faut des milliers de parties là où un humain en joue dix). On compare donc des **formes de courbe**, pas des nombres de parties. C'est un indice ; les parties de l'auteur, rangées par rang de partie, en donnent la version humaine.

### 5.4 Les tables mixtes
Un coopératif réunit souvent un initié et des débutants. Deux risques : le débutant ne sert à rien, ou l'initié joue à sa place (effet leader).
| Mesure | Étiquette | Vert proposé |
|---|---|---|
| Contribution propre de N1 assis avec des N4 (perte quand il ne fait plus rien, bot inerte) | indice | ≥ 50 % de celle d'un siège moyen (grille de Nadia) |
| Gain obtenu si un N4 pilote toute la table, par rapport à N4 + N1 indépendants | indice | ≤ 20 % (au-delà, la tentation de diriger est forte) |
| Écart entre une table d'initiés et une table mixte | indice | ≤ 15 points (un débutant ne condamne pas la partie) |

### 5.5 Les niveaux de difficulté
Les niveaux de difficulté prolongent l'intérêt des initiés et accueillent les débutants (avis sur *Pandémie* et *L'Île interdite* dans le panel). La campagne propose de les **calibrer** plutôt que de les deviner :
- 4 niveaux (par exemple découverte, normal, expert, héroïque), réglés uniquement par les éléments de difficulté existants (Machines au chantier au départ, esprits au départ, forêt initiale, escalade du soir, lunes, ordres par étape) ;
- chaque niveau met **un niveau de joueur** dans la bande cible de 50 à 80 % de forêt gardée : découverte pour N1, normal pour N3, expert pour N5, héroïque pour N6 ;
- l'écart entre deux niveaux est assez grand pour être ressenti (au moins 8 points pour un même bot).

*Auteur* : les niveaux de difficulté sont une règle nouvelle (même s'ils n'utilisent que des éléments existants) ; leur nombre et leurs noms lui reviennent.

### 5.6 Les témoins
Comme toute mesure, celles-ci se valident sur des variantes dont on connaît le verdict :
| Témoin | Construction | Verdict attendu |
|---|---|---|
| Jeu « résolu » | V0.2 (la menace y est résolue, un peuple suffit) | marge de maîtrise rouge |
| Jeu de hasard | variante où les choix pèsent peu (règles brisées retirées, une seule action permise) | part de la compétence rouge (< 55 %) |
| Jeu fermé | V1.x avec deux ordres de plus par étape | accueil rouge |
| Jeu à un seul truc | variante où une heuristique unique suffit (par exemple, rêver sans limite) | courbe régulière rouge |

## 6. Chercher les failles
Le temps de calcul libéré par la fin de l'exploration sert à essayer de **casser** la version :
- **Stratégies dominantes** : le bot appris et le MCTS, récompensés seulement par la forêt gardée, cherchent librement ; toute stratégie qui dépasse nettement les autres est examinée (est-elle amusante ? est-elle un détournement de règle ?).
- **Stabilité** : chaque paramètre est bougé d'un cran, un à la fois puis par paires ; la V1.x doit rester verte. Un objectif qui bascule au moindre cran signale une règle fragile, donc un réglage à revoir ou à protéger dans le livret.
- **États limites** : parties forcées vers des situations rares (toutes les Machines au même endroit, main vide tôt, Méchant aux esprits nombreux), pour vérifier que les règles y restent claires et que le moteur et le livret disent la même chose.
- **Compositions** : les 57 tables, pour trouver la pire et vérifier qu'aucune n'est injouable.

## 6 bis. Aucune action ni suite d'actions répétée ne doit gagner
*Mise à jour du 14 oct., 8 h 30 : **adopté par l'auteur (décision C1) et mis en œuvre en lecture seule dans le dépôt**. La spécification à jour est `projet/3-pilotage/garde-fou-boucles-gagnantes.md` (130 stratégies par taille de table, étape `boucles` jouée à chaque cycle, mesures descriptives). Première lecture (`projet/4-bilans/garde-fou-boucles-ligne-de-base.md`) : V0.3 **rouge** (une boucle ouverte fait jeu égal avec le bot fort à 4 joueurs, le glouton le dépasse à 4 et 5 joueurs), V0.4 **orange** (6 points d'écart à 4 joueurs). Le texte ci-dessous est la proposition d'origine ; là où il diffère, la spécification du dépôt fait foi.*
*Ajouté le 14 oct., 8 h, à la demande de l'auteur : « une action joueur ou une suite d'actions répétées ne doit pas constituer une stratégie gagnante ». Cette section dit d'abord ce que les tests actuels couvrent (d'après les documents du projet, pas d'après une relecture du code), puis consigne l'exigence pour les tests à venir.*

### 6 bis.1 Ce que les tests actuels évaluent déjà, et ce qu'ils n'évaluent pas
| Test existant | Ce qu'il couvre de l'exigence | Ce qu'il laisse de côté |
|---|---|---|
| **Meilleur taux de rêve fixe** (objectif 2 : glouton à 0 ; 0,25 ; 0,5 ; 0,75 ; 1 carte par tour, en V2 aussi par voie ; rouge si le meilleur est 0 ou le maximum) et **gain du bot libre** | **Une** action répétée : rêver. C'est le seul test qui cherche explicitement « une stratégie pure qui domine ». Il a fonctionné : V2 rouge, « le maximum » | toutes les autres actions et tous les motifs de rythme |
| **Tape-taupe** (objectif 1 : écart entre le bot fort et le glouton qui pare toujours la menace la plus probable, à son meilleur taux de rêve fixe) | **Une** politique répétée : « parer au plus probable ». Mesure : v1 11,1 points (vert), V2 4,4 (orange) | une seule politique, choisie à la main |
| **Jeu restreint**, **choix morts** | l'inverse : ce qui est inutile ou indispensable quand on l'enlève | pas la dominance d'un usage répété |
| **Échelle des bots** (aléatoire < glouton < MC) | aucune politique répétée n'est supposée battre le bot fort | elle ne cherche pas à le vérifier |
| **Apprentissage du Méchant** (+1,7 point) | mesure d'ensemble de ce que le Méchant gagne à apprendre | pas ce qu'il gagne face à un joueur qui se répète |
| **Ce document**, sections 3.2 (diversité des stratégies) et 6 (stratégies dominantes) | prévus : le bot appris et le MCTS « cherchent librement » | rien de systématique sur les stratégies répétées, et le bot appris n'existera qu'en CP.4 |

**Conclusion : oui pour deux cas particuliers (le rêve, « parer au plus probable »), non pour le reste.** Il n'existe pas de bibliothèque de stratégies répétées, ni de recherche de la meilleure d'entre elles, ni de test des motifs sur plusieurs tours ou sur les trois étapes.

**Pourquoi c'est un vrai risque, pas une précaution.** Trois indices, tous dans le diagnostic de la phase 3 :
- en V2, le bot fort dont les suites ne rêvent pas garde 82 % de la forêt, moins que le glouton qui rêve une carte par tour (86 %) : **une action répétée a battu le « bot fort »**. On ne l'a vu que parce que la mesure du taux de rêve existait ;
- en v1, rêver ne compte pas pour le bot fort, mais avec un bonus de fin de 10 % rêver à chaque tour devient nettement meilleur (92,7 contre 84,0) : la dominance d'une action répétée peut dépendre d'un réglage ;
- le bot fort est à un coup : il ne découvre pas une stratégie que sa politique ne joue jamais. Une stratégie répétée qu'il ne connaît pas lui reste invisible.

### 6 bis.2 Ce qu'on appelle une stratégie répétée, et « gagner »
- **Stratégie répétée** = une politique qui ne lit pas (ou presque pas) l'état de la partie, c'est-à-dire en boucle ouverte :
  - *stationnaire* : le même choix à chaque décision de même type (« toujours Barrer », « toujours rêver une carte », « toujours la zone la plus ancienne ») ;
  - *périodique* : un motif de 2 ou 3 tours, ou de 3 étapes, qui se répète (« rêver aux tours 1 et 2, défendre ensuite », « même carte aux étapes 1 et 3 ») ;
  - *script d'équipe* : chaque peuple répète son meilleur geste, sans coordination autre que le script ;
  - *boucle collective* (précision du 14 oct.) : une **convention de table** décidée avant la partie, identique d'une partie à l'autre, que tous les sièges appliquent sans lire l'état (alliance, relais, spécialisation, couplage d'actions entre sièges). C'est ce que de vrais joueurs feraient en se disant « on fait toujours comme ça ». Elle est jouée de deux façons : par des sièges indépendants qui suivent la convention, et par un pilote unique qui l'exécute pour tous (la borne, comme le chef unique). Une convention qui lit l'état ou qui s'appuie sur les traces n'est plus une boucle ouverte : elle relève de la coordination (objectif 3), pas de ce garde-fou.
- **Gagner** = se rapprocher du bot fort, ou le dépasser, sans avoir besoin de lire le jeu. Le critère est **relatif** : le jeu actuel est « trop facile » pour tous (90 à 99 % de forêt gardée), et un critère absolu mélangerait dominance et difficulté. Le niveau absolu est donné à côté, à titre d'information.

### 6 bis.3 La bibliothèque de stratégies répétées (bots de boucle ouverte)
| Famille | Exemples | Ordre de grandeur |
|---|---|---|
| Une action partout | toujours Barrer, toujours Saboter, toujours Aller, toujours Voir, toujours Hanter, toujours S'unir… (repli sur une autre action si elle est impossible) | 10 à 15 |
| Un pouvoir par peuple | chaque peuple joue en boucle sa moitié de carte la plus forte | quelques dizaines |
| Une zone | garder toujours la zone la plus menacée au départ, la plus centrale, la même zone | 5 à 10 |
| Rythme de rêve | taux fixes (déjà fait), mais aussi motifs de longueur 1 à 3 : tout en défense, rêve 1, rêve 2, mixte | 64 motifs de longueur 3 |
| Motif sur les trois étapes | même carte aux trois étapes, A-B-A, programme identique à chaque tour | une dizaine |
| Exploiter le Méchant | toujours la même tactique contrée, toujours échouer volontairement pour pousser la piste, toujours la même zone sacrifiée (à vérifier dans les règles V1.x : la règle « une zone détruite fait entrer un esprit » est apparue dans les premières versions et la question « aucune perte ne doit devenir tentante » était restée ouverte) | une dizaine |
| Script d'équipe (indépendant) | combinaison des familles précédentes, un script par peuple, chaque siège le suit sans lire les autres | quelques dizaines |
| **Boucles collectives** (convention de table, ajoutée le 14 oct.) | *alliance perpétuelle* (les deux mêmes peuples se retrouvent dans la même zone à la même étape à chaque tour) ; *relais* (un siège rêve, les autres défendent, le rôle tourne chaque tour) ; *spécialisation* (un seul siège rêve, ou un seul sabote, tout le tour) ; *miroir* (tous font la même chose) ; *barrage et sabotage couplés* (l'un barre la zone que l'autre sabote) ; *remorquage en chaîne* (un siège remorque, l'autre sabote la même Machine, en boucle) | 30 à 60 par composition de table |

Chaque bot est un petit script déclaratif (une priorité d'actions, une règle de zone, un motif), pas un nouveau programme. *Supposé* : leur coût par partie est du même ordre que celui du glouton.

### 6 bis.4 La recherche automatique de la meilleure stratégie répétée
Une bibliothèque écrite à la main ne trouvera que ce qu'on imagine. Pour la compléter :
1. **Paramétrer** les stratégies répétées (priorités d'actions, règle de zone, motif de rêve, motif d'étapes) en un petit vecteur, **avec un rôle par siège** (un vecteur par peuple, plus un motif partagé : relais, couplage, alliance), pour que la recherche puisse trouver des boucles collectives.
2. **Chercher** la meilleure par une recherche locale ou évolutionnaire (quelques centaines de candidats, graines appariées), évaluée aux tables de toutes les tailles.
3. **Reprendre** les cinq meilleures comme politique des suites du bot fort : si MC64R part d'une stratégie répétée, vaut-il plus qu'elle ? Cela évite que la limite « un bot à un coup ne découvre pas ce que sa politique ne joue pas » masque une dominance.
4. **Expliquer** : pour la meilleure stratégie, retirer chaque élément à tour de rôle (ablation) pour savoir ce qui la fait gagner (une action, un rythme, une zone).

*Estimation du coût* (au débit mesuré de la batterie 1, 96 200 parties en 2,5 min sur 16 lots) : bibliothèque d'environ 150 stratégies sur les 57 tables à 20 parties, soit 171 000 parties ; recherche de 20 générations de 40 candidats à 10 parties par table, soit 456 000 parties : au total quelques dizaines de minutes de calcul. La reprise par le bot fort, limitée à un échantillon (cinq stratégies, 15 tables, 6 parties, 450 parties de 228 s-cœur), représente environ 28 heures-cœur. Tout cela est de classe A (file de nuit, section 8 bis.4).

### 6 bis.5 Mesures et bandes proposées
*Étiquette : indice (dépend de la bibliothèque et de la recherche : un résultat vert prouve seulement qu'on n'a pas trouvé de stratégie gagnante). Bandes provisoires, à valider par l'auteur. Placement proposé : un **garde-fou « aucune boucle gagnante »**, à côté du garde-fou « aucun effort n'est vain », ce qui évite de rouvrir la structure à quatre objectifs (A4). Autre option : l'étendre à l'objectif 2, dont c'est la généralisation (« aucune stratégie pure ne domine », aujourd'hui limitée au rêve).*
| Mesure | Définition | Vert proposé | Rouge proposé |
|---|---|---|---|
| **Écart à la meilleure boucle** | forêt du bot fort moins forêt de la meilleure stratégie répétée (bibliothèque et recherche), pris à chaque taille de table ; on garde la pire taille | ≥ 10 points (la bande du tape-taupe, par cohérence) | < 3 points |
| **Aucune convention de table ne suffit** (boucles collectives, ajouté le 14 oct.) | forêt de la meilleure boucle collective, **composition par composition** (une boucle peut ne gagner qu'avec une paire de peuples, par exemple un duo complet du tétraèdre) ; on garde la pire composition | écart au bot fort ≥ 10 points pour chaque composition testée | < 3 points pour une composition |
| **Une action ne suffit pas** | pour chaque action, forêt de la meilleure stratégie « X partout » rapportée à celle du bot fort | aucune ne dépasse 90 % du bot fort | une action approche le bot fort à 3 points près |
| **Échelle de la lecture** | écarts successifs boucle ouverte → glouton (réactif simple) → bot fort | chaque marche ≥ 3 points | une marche < 1 point (la lecture du jeu ne sert à rien) |
| **Répétition punie** | gain d'apprentissage du Méchant (écart avec le témoin « Méchant qui n'apprend plus ») face à la meilleure boucle, comparé à celui face au bot fort ; et perte de forêt de la boucle entre les tours 1-2 et 5-6 | gain face à la boucle au moins deux fois celui face au bot fort | gain nul (le Méchant ne punit pas la répétition) |
| **Boucles de règles** | recherche de situations où une séquence de décisions rejouée gagne sans limite (par exemple remorquer puis saboter la même Machine en boucle) : jeu aléatoire à biais de répétition, avec les invariants du moteur vérifiés | aucune trouvée | une trouvée (alerte de conception, section 6 du plan vers la V1) |

La mesure **Répétition punie** est la plus utile pour la conception : l'apprentissage du Méchant est un principe noté 8, et l'on attend de lui qu'il « finisse par jouer ce qui marche contre cette équipe ». Le gain actuel (+1,7 point) suggère qu'il ne punit pas grand-chose.

### 6 bis.6 Témoins
| Témoin | Construction | Verdict attendu |
|---|---|---|
| V2 proposée (sans lunes) | le rêve à chaque tour y est le meilleur taux | écart à la meilleure boucle **rouge** |
| `retour_v0_reves_illimites` | rêves sans limite (déjà dans le moteur) | rouge ; « une action ne suffit pas » rouge pour rêver |
| **Action gagnante** (à créer) | variante où Barrer annule tout, sans limite | « une action ne suffit pas » rouge pour Barrer |
| **Combo gagnant** (à créer) | variante où l'alliance de deux peuples précis, répétée chaque tour, annule toute la menace | « aucune convention de table ne suffit » rouge pour cette paire seulement (vérifie aussi que la mesure voit une boucle propre à une composition) |
| `temoin_sans_apprentissage` | le Méchant n'apprend plus | « répétition punie » rouge |
| V0.2 | un peuple suffit, la menace est résolue | écart à la meilleure boucle rouge |

### 6 bis.7 Calendrier proposé
- **Fait le 14 oct. : dès le cycle 2 du plan vers la V1, en lecture seule** (sans bande, sans effet sur la sélection) : la bibliothèque écrite à la main, jouée au glouton sur la V0.3 puis sur la version candidate. Coût faible, et la V2 a déjà montré qu'une boucle peut dominer. Les bandes étant gelées pour le cycle (B1), elle ne juge pas ; l'auteur l'a voulue dès maintenant (14 oct.).
- **CP.2** : bandes validées, recherche automatique, reprise par le bot fort, témoins.
- **CP.4** : le bot appris (section 4.2) rejoue la recherche sans bibliothèque : tout écart avec la meilleure boucle trouvée à la main signale une stratégie manquée.
- **Relation avec les autres mesures** : la *diversité des stratégies* (section 3.2) demande qu'il existe plusieurs bonnes façons de jouer ; la présente exigence demande qu'aucune ne soit une simple répétition. Les deux se complètent : un jeu peut échouer à l'une et réussir à l'autre.

## 7. Optimiser finement
- **Peu de paramètres, de petits pas.** Après les sections 3 à 6, on ne retouche que les quelques paramètres que les tests désignent, dans une plage étroite autour de la V1.x.
- **Méthode** : une optimisation par modèle (bayésienne) ou une recherche locale, chaque candidat jugé en course d'élimination avec graines appariées, plutôt que MAP-Elites, conçu pour l'exploration large.
- **Score** : le plus faible des objectifs, pris à la pire taille de table (règle actuelle), **auquel s'ajoute la courbe d'apprentissage**. Le front de Pareto reste montré à l'auteur pour voir les compromis.
- **Garde-fou** : aucun réglage n'est proposé s'il améliore les bots forts au détriment du débutant, ou l'inverse, sans que ce soit dit.
- La sortie est une **V1.(x+1)** proposée, que l'auteur adopte ou non.

## 8. Déroulé et coût
| Étape | Contenu | Qui | Estimation |
|---|---|---|---|
| CP.0 | Moteur à jour de la V1.x, ancre V1.0 sous le dernier protocole des cycles et le protocole de profondeur, journal humain saisi ; **profilage et outillage de vitesse** (section 8 bis : graines indépendantes de l'ordonnancement, reprise, mémoire des résultats, file de nuit) | Claude, auteur | 2 à 3 sessions |
| CP.1 | Échelle des bots : bot débutant calibré, MCTS, évaluation apprise ; validation | Claude, GitHub | 2 à 3 sessions, quelques jours de calcul |
| CP.1 bis | **Pilote IA** (section 4 bis) : juge à l'aveugle, calibration, table qui délibère, débutant sur livret | Claude, GitHub, auteur (clé d'API et parties humaines) | 1 à 2 sessions, petit volume |
| CP.2 | Mesures nouvelles (sections 3, 5 et 6 bis : bibliothèque de stratégies répétées, recherche de la meilleure, témoins) | Claude, GitHub | 2 à 3 sessions |
| CP.3 | Grande campagne : 57 tables × niveaux × précision cible | GitHub, seul | 1 à 3 jours |
| CP.4 | Bot appris par itération d'expert ; recherche de failles ; courbe de l'apprenant | GitHub, seul | plusieurs jours, en tâche de fond |
| CP.5 | Rapport de validation ; optimisation fine ; niveaux de difficulté | Claude, GitHub | 2 sessions |
| CP.6 | Décisions de l'auteur ; livret et kit humain révisés | auteur, Claude | 1 à 2 sessions |

**Ordre de grandeur du calcul** (supposé, à recaler) : MC64R coûte en moyenne 228 secondes-cœur par partie (campagne 16). Si un exécuteur GitHub dispose de 4 cœurs, un lancement de 20 lots de 6 h offre environ 1,7 million de secondes-cœur, soit quelque 7 000 parties de MC64R. Les 57 tables à 30 parties chacune (1 710 parties) tiennent donc dans un quart de lancement ; les bots plus forts (MCTS, budgets de 256 à 1 024) coûtent 4 à 16 fois plus et se joueront sur un échantillon de tables. Le nombre réel de cœurs est enregistré dans les synthèses depuis l'étape 0.10.

**Organisation** : celle du plan vers la V1 (orchestrateur, une étape à la fois, rapports lus plutôt que données, Opus pour les analyses). Les entraînements longs passent par des étapes enchaînées avec sauvegarde du modèle sur la branche `resultats`.

## 8 bis. Concevoir pour aller vite : parallélisme, reprise, travail de nuit
*Ajouté le 13 oct., 23 h, à la demande de l'auteur. Principe : la campagne est conçue dès le départ pour que **ni le calcul, ni l'attente d'une personne ne soient sur le chemin critique**. Rien n'est modifié dans le pipeline du cycle 1 en cours ; ce qui suit s'applique à la campagne de profondeur et, pour les points peu risqués, aux cycles suivants. Les gains annoncés sont des estimations à confirmer par le profilage (8 bis.1).*

### 8 bis.1 Mesurer avant d'optimiser
Le plan ne dit pas encore où le temps passe. Dès CP.0, chaque étape écrit dans `etat_pipeline.json` et dans sa synthèse :
- durée réelle de chaque lot, **taux d'occupation des cœurs** (temps de calcul divisé par cœurs × durée), temps de démarrage de l'exécuteur, temps d'attente avant démarrage (file des 20 tâches), temps de publication ;
- **durée entre « résultat prêt » et « décision prise »** : c'est le temps humain, à ne pas confondre avec le temps machine ;
- profil Python d'une partie type (`cProfile` sur une partie MC64R), pour savoir si le coût est dans la copie d'état, la simulation des suites ou la mesure.

*Constat déjà mesuré (ETAT, section 9)* : les campagnes 11 à 15 ont duré 75 à 101 min pour un lot le plus lent de 23 à 34 min, parce qu'elles se partageaient les 20 tâches simultanées. *Supposé* : sur un cycle complet, **l'attente d'une réponse de l'auteur pèse plus que le calcul** (le plan estime 3 à 5 h de calcul pour 1 à 2 jours par cycle). Optimiser le calcul seul a donc un gain limité ; le gros levier est de ne jamais attendre (8 bis.4).

### 8 bis.2 Parallélisme à l'intérieur des scripts Python
Le moteur utilise déjà `Pool(os.cpu_count())` dans chaque lot. La campagne y ajoute :
| Mesure | Pourquoi | Détail |
|---|---|---|
| **Grain = la partie**, pas la suite | une suite coûte 5 à 15 ms : la répartir entre processus coûterait plus en échanges qu'en calcul | une tâche du pool = une partie (ou un groupe de parties d'une même table) ; pas de parallélisme à l'intérieur d'une décision |
| **Graine par partie, indépendante de l'ordonnancement** | le résultat ne doit pas dépendre du nombre de processus ni de l'ordre d'arrivée | graine = fonction de (campagne, table, bot, numéro de partie). **Test automatique** : 1 processus et N processus donnent les mêmes résultats, bit à bit |
| **`imap_unordered` avec petits morceaux, tâches les plus coûteuses d'abord** | une table de six coûte 4 à 5 fois un duo (plan, section 7 bis) ; placer les grosses tâches en premier évite qu'un cœur finisse seul | ordre décroissant du coût estimé (le modèle de `foret/cycle.py`, recalé sur la campagne 16) |
| **Écriture au fil de l'eau** | un lot coupé (6 h, erreur, arrêt de l'exécuteur) ne doit rien perdre | chaque partie terminée est ajoutée à un fichier de reprise ; au relancement, les parties déjà faites sont sautées |
| **Mémoire modeste par processus** | les exécuteurs ont peu de mémoire par cœur | pas de copie globale de l'état en partage ; mesurer le pic par processus au profilage |
| **Tests en parallèle** | les 3 minutes de tests et de conformité reviennent à chaque étape | `pytest-xdist` ; à adopter seulement si les tests restent déterministes |

### 8 bis.3 Faire moins de calcul vaut mieux que le faire plus vite
Ces mesures économisent souvent plus que la parallélisation :
- **Arrêt séquentiel.** Chaque comparaison s'arrête dès que son intervalle (apparié) tranche : écart sûr au-dessus ou en dessous du seuil. La course d'élimination du plan en est la version par manches ; la campagne l'applique aussi à l'intérieur d'une table. *Gain à mesurer ; il est fort quand les écarts sont nets, nul quand ils sont serrés.*
- **Mémoire des résultats.** Une partie est identifiée par (version du moteur, empreinte de la maquette, bot et paramètres, table, graine). Un résultat déjà calculé n'est jamais rejoué : l'ancre V1.0, les témoins et les tables inchangées entre deux candidates sont réutilisés. Condition : toute modification du moteur qui change une partie change la version, et les tests de non-régression (`reference_1_0.json`) le vérifient.
- **Graines communes** entre candidates (déjà prévues, statistiques appariées) : à écart égal, moins de parties.
- **Le bon bot au bon moment** : le glouton pour filtrer, le MC64R pour confirmer, les bots coûteux (MCTS profond, bot appris) seulement sur les finalistes et un échantillon de tables.
- **Accélération du cœur du moteur** : seulement si le profilage montre un point chaud net (par exemple la copie d'état). Pistes à évaluer ensuite, sans promesse : structures plus simples à copier, extension compilée. Chaque piste exige la non-régression bit à bit.

### 8 bis.4 Ne jamais attendre une personne
**Ce qui compte n'est pas la nuit** : les calculs GitHub tournent à toute heure. Ce qui compte, c'est de classer chaque tâche :
| Classe | Définition | Exemples | Règle |
|---|---|---|---|
| **A, autonome** | n'a besoin d'aucune réponse de l'auteur | criblage, ablations, validation sur les 57 tables, entraînement du bot appris, robustesse (bonus 10 et 25 %), recherche de failles, calcul du pilote IA une fois la clé fournie | peut tourner à toute heure ; **va dans la file de nuit** |
| **B, à décision** | dépend d'un choix de conception de l'auteur | adopter une version, une règle nouvelle, un niveau de difficulté | jamais lancée avant la réponse |
| **C, spéculative** | dépend d'un choix de l'auteur, mais le nombre de branches possibles est petit | si la réponse peut être « oui » ou « non », calculer les deux | lancée avant la réponse ; le résultat de la branche non retenue est jeté ou archivé |

Conséquences pour la conception :
1. **File d'attente de tâches** (`file_attente.json` sur la branche `resultats`) : identifiant, classe, priorité, dépendances, coût estimé en heures-cœur, état. Un workflow de nuit (déclenchement planifié, par exemple vers 21 h, heure de Paris, plus la fin de chaque étape) prend les tâches de classe A, une étape à la fois, dans la limite d'un **budget par nuit** (à fixer : le plan s'est engagé à des volumes raisonnables sur le dépôt public et à aucun lancement continu). Les tâches se ré-enchaînent seules tant que le budget le permet.
2. **Décisions groupées.** Les questions à l'auteur sont accumulées et posées **en un seul lot** à heure fixe (par exemple le soir), avec la recommandation de Claude, plutôt que une par une. Le matin, les réponses déclenchent les tâches de classe B pendant que la file de nuit a déjà livré les classes A et C.
3. **Aucune décision de conception par défaut.** Ni l'absence de réponse, ni l'heure, ne valent accord (règle de décision du 13 oct. : règle nouvelle, adoption d'une version, bandes, invariants restent à l'auteur). Seules les décisions techniques sont tranchées seules.
4. **Analyse prête au réveil.** Quand le rapport d'un cycle est prêt la nuit, l'analyse de fin de cycle (Opus) est armée pour le début de matinée, pour que l'auteur trouve le bilan et la proposition de version à son lever. *Limite* : un workflow GitHub ne peut pas déclencher la tâche planifiée de Claude ; c'est la tâche « réveil » qui est armée à l'heure voulue (elle compte dans le plafond de 12 passages par semaine).
5. **Reprise sans personne.** Un lot en échec est relancé une fois ; la surveillance quotidienne relance une étape bloquée et ouvre une issue au deuxième échec (déjà en place). Un problème qui exige une décision est mis de côté et **n'arrête pas** le reste de la file.

*Limites connues* : GitHub peut retarder un déclenchement planifié aux heures de pointe, et désactive les déclenchements planifiés d'un dépôt public sans activité depuis longtemps (à vérifier dans la documentation avant de compter dessus ; un commit régulier ou un lancement manuel suffit à les réactiver). L'ordinateur de l'auteur, lié à cette session, pourrait servir de renfort, mais il peut être éteint ou en veille : il n'est pas retenu pour le chemin critique.

### 8 bis.5 Découpage des lots
- **Plus de lots, plus petits.** Aujourd'hui, 14 à 20 lots longs, dont le plus lent fixe la durée. Une matrice peut aller jusqu'à 256 tâches, avec 20 en même temps : des **lots courts (10 à 30 min de calcul)** s'équilibrent d'eux-mêmes, car une tâche libérée prend le lot suivant. Contrepartie : chaque tâche paie un temps de démarrage (récupération du code, installation) ; le profilage (8 bis.1) fixe la taille minimale qui rend ce coût négligeable.
- **Une seule file** pour les 20 tâches (orchestrateur déjà en place) : pas de campagnes concurrentes qui se bloquent.
- **Exemple d'ordre de grandeur** (supposé) : les 1 710 parties de MC64R sur les 57 tables représentent environ 390 000 secondes-cœur (228 s par partie en moyenne, campagne 16), soit 108 heures-cœur. Avec 20 tâches de 4 cœurs, bien équilibrées, cela fait environ 1 h 20. Le nombre de cœurs par exécuteur est à vérifier (il est enregistré dans les synthèses depuis l'étape 0.10).

### 8 bis.6 Ce que cela change dans le déroulé
Au lieu de « préparer, attendre, analyser, décider » en série, chaque cycle de la campagne est un **flux** : le jour, Claude prépare le code des étapes suivantes et l'auteur répond au lot de décisions ; la nuit, la file de classe A et les branches spéculatives de classe C tournent seules ; le matin, bilans et propositions sont prêts. L'objectif est de ramener le temps d'un cycle vers la somme de ses temps de calcul incompressibles, sans journée perdue à attendre.

## 9. Les décisions qui reviendront à l'auteur
1. **Les bandes du critère « courbe d'apprentissage »** (section 5), proposées ici et à geler avant la grande campagne, comme en B1.
2. **Le public de la découverte** : qui est le débutant de référence ? Nadia (sans culture ludique) ou Sophie et ses adolescents ? Cela fixe le bot N1 et le mode « découverte ».
3. **Les niveaux de difficulté** : leur nombre, leurs noms, et s'ils entrent dans le livret de base.
4. **Les règles signalées comme coûteuses** (section 3.2) : simplifier, garder, ou réserver à un mode avancé.
5. **Le calcul** : rester sur GitHub (gratuit, limité) ou payer un environnement plus puissant si l'apprentissage le demande.
6. **L'adoption de la V1.(x+1)** et le protocole des nouveaux tests humains.
7. **Le pilote IA** (section 4 bis) : le lancer ou non, le plafond de dépense, et la fourniture d'une clé d'API (paiement à part du forfait Pro). Les seuils de réussite des volets A à D sont à valider. Recommandation de Claude : le lancer, avec un plafond bas fixé d'avance, et arrêter chaque volet qui rate son critère.
8. **Le budget de la file de nuit** (section 8 bis.4) : heures-cœur par nuit sur le dépôt public, heure du lot de décisions du soir, heure d'arrivée de l'analyse du matin. Recommandation de Claude : un budget modeste au début, relevé si le profilage montre que les volumes restent raisonnables.
9. *(Prise le 14 oct. : décision C1, bandes confirmées.)* **Le critère « aucune boucle gagnante »** (section 6 bis) : sa place (garde-fou, ou extension de l'objectif 2), ses bandes (10 et 3 points proposés, par cohérence avec le tape-taupe), et si l'on veut une lecture seule dès le cycle 2. Recommandation de Claude : garde-fou, bandes proposées, lecture seule dès le cycle 2 (coût faible, et la V2 a déjà montré le risque).

## 10. Limites
- Les bots ne jugent ni le plaisir, ni la clarté des règles, ni la qualité de la discussion : ces points restent « humain seulement ». Le juge IA de la section 4 bis ne fait qu'ajouter un indice, étiqueté comme tel.
- La courbe d'un algorithme n'est pas celle d'un humain : elle sert à repérer des formes (plateau précoce, marche unique), pas à prédire le nombre de parties qu'il faut à une personne.
- Le bot débutant ne vaut que ce que vaut sa calibration : avec peu de parties humaines, il restera approximatif.
- Un critère de stratégie répétée ne prouve jamais l'absence de boucle gagnante : il prouve qu'on n'en a pas trouvé avec la bibliothèque, la recherche et les bots disponibles. Seuls les tests humains écartent le risque qu'un joueur invente un détournement de règle auquel aucun bot n'a pensé.
- Les coûts et durées de ce document sont des estimations ; ils seront recalés sur la campagne 16 et sur le cycle 1.

## Sources
- « Plan vers la V1 jouable » (13 oct.), « Ligne de base P2 - la V0.3 de 2 à 6 joueurs », « ETAT - reprise automatique », « Objectifs, invariants et catalogue », « Panel de joueurs virtuels - ébauche » (v4) : documents de ce projet.
