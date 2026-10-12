# Cahier des charges : environnement de calcul pour les campagnes de simulation

*11 oct. 2026, mis à jour le 12 oct. (banc d'essai de la famille A, section 9 ; **décision de l'auteur, section 10 : la famille A, les exécuteurs de GitHub**). Document de travail pour choisir où faire tourner les campagnes du plan d'action (décision 5 : « développement dans l'environnement d'analyse, grosses campagnes hébergées ailleurs, solution cloud de capacité adaptée et de faible coût »).*
*Voir aussi : « Plan d'action - évaluer et explorer les variantes par la simulation » (sections 4.5, 5 et 6).*

## En bref
- **Décision (12 oct., fin de la phase 1) : les campagnes tournent sur les exécuteurs de GitHub (GitHub Actions), dans le dépôt public `Projet_Jeu`.** Quotas vérifiés le jour même dans la documentation de GitHub : gratuit pour un dépôt public, exécuteurs Linux de 4 cœurs et 16 Go, 20 tâches simultanées, 6 heures par tâche, 256 tâches par lancement. Cela fait 80 cœurs à la fois, de quoi jouer environ 1 000 heures-cœur en une douzaine d'heures. Un risque est à surveiller : les conditions d'usage de GitHub (section 10).
- **Le besoin est de la puissance de calcul brute, par à-coups** : des dizaines de cœurs pendant quelques heures, puis plus rien pendant des jours. Pas de GPU, pas de base de données, pas de service permanent.
- **Le travail se découpe sans effort** : une partie est indépendante des autres, rejouable à l'identique avec sa graine. On peut donc utiliser des machines bon marché qui peuvent être interrompues, à condition de sauvegarder souvent.
- **L'ordre de grandeur d'un cycle complet est de quelques centaines à un millier et demi d'heures-cœur**, dont l'essentiel pour le bot fort. C'est une estimation à remesurer en phase 2, quand la vitesse du bot fort sera connue.
- **Contrainte propre à ce projet** : l'environnement où le code est développé et les résultats analysés (l'« environnement d'analyse ») n'atteint en général que les registres de paquets et GitHub. **Vérifié le 12 oct. pour GitHub** : l'environnement d'analyse déclenche les campagnes et lit leurs résultats (section 9).
- **Premier banc d'essai fait (12 oct.) : la famille A fonctionne de bout en bout** avec les bots simples : environ 87 parties par seconde et par cœur, synthèse identique à celle d'un calcul local.

## 1. La charge de travail
Ce que le code actuel fait (lecture de `foret/sim.py`) :
- **Python pur**, version 3.10 ou plus, sans aucune dépendance ; pytest seulement pour les tests.
- **Parallélisme par processus** (`multiprocessing.Pool`, un processus par cœur disponible). Aucun GPU, aucune communication entre processus pendant le calcul.
- **Parties indépendantes et reproductibles** : une partie est définie par maquette, variante, peuples, bot et graine. Une partie qui plante est notée avec de quoi la rejouer.
- **Sorties légères** : une synthèse JSON et la liste des erreurs. Depuis le 12 oct., un lot écrit un fichier compressé de ses résultats ; la synthèse s'obtient en fusionnant les lots (section 5).
- **Vitesse mesurée en v1** : 112 350 parties en 7 à 8 minutes sur 2 cœurs avec des bots simples. **Remesurée le 12 oct. : environ 87 parties par seconde et par cœur sur les exécuteurs de GitHub** (section 9), environ 98 en local sur 2 cœurs.
- **Batterie d'évaluation (phase 1, moteur 1.5)** : 96 200 parties en environ 35 minutes sur 2 cœurs avec le glouton, dont des copies de parties pour les sondages (prédictibilité, incertitude).

Ce qui s'ajoutera (plan d'action) : un bot fort par recherche Monte-Carlo, qui simule des centaines de suites de partie à chaque décision. Il est donc des milliers de fois plus lent que le glouton. Sa vitesse n'est pas encore mesurée.

## 2. Volumes attendus
Estimation par phase, pour **un cycle complet**. Les hypothèses sont écrites : si l'une change, le chiffre change. *Les lignes « bots rapides » reposaient sur 120 parties par seconde et par cœur ; la mesure du 12 oct. donne 87, soit environ 38 % de temps en plus : criblage environ 3 heures-cœur, MAP-Elites environ 32 heures-cœur sans réglage du glouton.*

| Phase | Calcul | Hypothèses | Heures-cœur |
|---|---|---|---|
| 3. Diagnostic de la v1 | Batterie complète avec le bot fort, puis jeu restreint (une interdiction à la fois) | 35 tables × 100 parties × 30 s par partie ; ×10 pour les interdictions | 30 à 300 |
| 4. Criblage | Quelques centaines de variantes, bots rapides | 300 variantes × 30 tables × 100 parties à 87 parties/s/cœur | environ 3 |
| 4. MAP-Elites | Recherche de variantes, bots rapides | 10 000 évaluations × 1 000 parties ; ×10 si le glouton est réglé pour chaque variante | 32 à 320 |
| 5. Finalistes | Bot fort sur quelques dizaines de variantes | 30 variantes × 20 tables × 50 parties × 30 s par partie | environ 250 |
| **Total d'un cycle** | | | **environ 300 à 900, jusqu'à 1 500 si le bot fort est plus lent que prévu** |

Lecture : le temps réel dépend du nombre de cœurs disponibles en même temps. Avec la famille A (80 cœurs), 1 000 heures-cœur prennent environ 12 à 13 heures.

## 3. Exigences

### Indispensables
| Exigence | Pourquoi |
|---|---|
| Machines Linux x86-64 ou ARM64 avec Python 3.10+ | Le moteur est en Python pur |
| 32 à 64 cœurs disponibles à la demande, pour quelques heures à quelques jours | Une campagne se compte en centaines d'heures-cœur |
| Facturation à l'usage, **aucun coût quand rien ne tourne** | Le calcul se fait par à-coups |
| Stockage durable des résultats, indépendant des machines | Les machines de calcul disparaissent à l'arrêt |
| Reprise après interruption sans perdre plus de quelques minutes | Les machines les moins chères peuvent être coupées |
| Arrêt automatique en fin de travail et plafond de dépense paramétrable | Éviter une facture imprévue |
| Récupération des résultats vers le projet (téléchargement, ou dépôt GitHub) | Les analyses se font dans l'environnement d'analyse |

### Souhaitables
| Exigence | Pourquoi |
|---|---|
| Lancement d'une campagne en une commande ou un clic, répétable | L'auteur n'est pas administrateur système |
| Pilotage possible depuis GitHub (déclenchement et récupération des résultats) | Seul canal sûr d'accès pour l'environnement d'analyse |
| Localisation des données en Europe | Préférence, pas une contrainte : les données ne sont pas personnelles |
| Suivi de la progression et de la dépense en cours de calcul | Savoir si une campagne dérape |
| Mémoire d'environ 1 Go par cœur | Largement suffisant pour une partie ; à vérifier avec le bot fort |

### Inutiles ici
GPU, base de données, services toujours allumés, réseau très rapide entre machines, haute disponibilité.

## 4. Familles de solutions à comparer
Cette liste décrit des familles, pas des fournisseurs recommandés.

| Famille | Idée | Points forts attendus | Points faibles attendus |
|---|---|---|---|
| A. Exécuteurs de GitHub | Les campagnes tournent comme des tâches GitHub, découpées en lots parallèles | Se pilote depuis GitHub, donc accessible à l'environnement d'analyse ; aucune machine à gérer ; résultats rangés dans le dépôt | Durée maximale par tâche, nombre de tâches simultanées limité, conditions d'usage. **Retenue le 12 oct. (section 10)** |
| B. Machines virtuelles interruptibles chez un grand fournisseur | Louer 32 à 64 cœurs à tarif réduit pour quelques heures | Prix par heure-cœur très bas ; large choix de machines | Configuration plus technique ; interruptions à gérer ; risque de facture si on oublie d'éteindre |
| C. Services de traitement par lots | Le fournisseur démarre et éteint les machines à partir d'un fichier de description | Gestion automatique des machines, des relances et de l'arrêt | Mise en place plus lourde ; apprentissage |
| D. Conteneurs sans serveur | Chaque lot de parties tourne dans un conteneur facturé à la seconde | Aucun serveur à gérer ; coût nul au repos | Limites de durée et de cœurs par conteneur ; peut revenir plus cher par heure-cœur |
| E. Serveur dédié à forfait | Un serveur à nombreux cœurs loué au mois | Prix fixe, souvent le plus bas pour de gros volumes ; simple | Paiement même sans calcul ; un seul serveur ; sauvegardes à organiser |
| F. L'ordinateur de l'auteur | Les campagnes tournent chez lui | Aucun coût de location ; données chez lui | Nombre de cœurs limité ; l'environnement d'analyse ne peut pas surveiller un long calcul ; machine occupée |

## 5. Ce qu'il faudra adapter côté code (indépendamment du fournisseur)
*État au 12 oct. 2026.*
- **Écriture au fil de l'eau** : *partiel.* Chaque lot écrit ses résultats dans un fichier compressé, mais garde les parties de son lot en mémoire jusqu'à la fin. Suffisant tant qu'un lot reste de quelques dizaines de milliers de parties ; à reprendre si les lots grossissent.
- **Découpage en lots** reproductibles : *fait dans le dépôt GitHub (moteur 1.0).* `--lot i/n` joue les parties d'indice i, i+n, i+2n… ; les lots ont la même taille à une partie près. **À reporter dans le moteur 1.5 et à étendre à la batterie (`foret.batterie`).**
- **Reprise** : au redémarrage, ne rejouer que les lots absents : *à faire.*
- **Un lanceur unique**, identique en local et dans le cloud : *fait pour GitHub* (`python -m foret.sim`, mêmes options en local et dans le workflow).
- **Agrégation** des lots en une synthèse : *fait* (`--fusionner`).

## 6. Méthode de choix
*Appliquée le 12 oct. : l'auteur a retenu la famille A sans banc d'essai des autres familles (section 10).*
1. **Présélection** : retenir 3 ou 4 candidats qui respectent les exigences indispensables.
2. **Banc d'essai identique** pour chacun, 30 minutes environ.
3. **Grille de décision** : coût 30 %, simplicité de lancement 25 %, pilotage depuis GitHub 20 %, résistance aux interruptions 15 %, plafond de dépense 10 %.
4. **Décision** de l'auteur, avant la phase 2.

## 7. Questions ouvertes pour l'auteur
*Réglées par la décision du 12 oct. : la famille A est gratuite pour un dépôt public (budget nul, aucun compte payant), se lance d'un clic ou depuis l'environnement d'analyse, et sa fréquence n'est limitée que par les conditions d'usage (section 10). La localisation des données n'est pas maîtrisée (exécuteurs de GitHub), ce qui a été jugé acceptable : les données ne sont pas personnelles.*

## 8. Limites de ce document
- Les volumes de la section 2 sont des **estimations** ; la vitesse du bot fort est la grande inconnue et sera mesurée en phase 2.
- Les quotas de GitHub (section 10) sont ceux de la documentation du 12 oct. 2026 ; GitHub précise qu'ils peuvent changer.

## 9. Banc d'essai de la famille A : exécuteurs de GitHub (12 oct. 2026)

### Ce qui a été fait
Le moteur v1 est dans le dépôt GitHub `Projet_Jeu` (public). Deux workflows y sont installés :
- **Tests** : à chaque envoi de code, les tests et le contrôle de conformité tournent sous Python 3.10 et 3.12. Résultat : tout au vert, en 39 secondes.
- **Campagne** : lancement manuel, avec la campagne, la maquette, l'échelle (part des parties) et le nombre de lots. Un exécuteur joue chaque lot, puis une dernière tâche fusionne les lots en une synthèse.

### Résultats mesurés
| Mesure | Valeur |
|---|---|
| Campagne jouée | « reference » sur la maquette v1, échelle 0,05 : 5 869 parties, 4 lots, **0 erreur** |
| Durée | un lot : 7 à 12 s ; run complet (préparation, lots, fusion) : moins d'une minute |
| Vitesse | **environ 87 parties par seconde et par cœur** (calcul cumulé : 67 secondes-cœur) |
| Fidélité | la synthèse produite sur GitHub est **identique** à celle d'un calcul local (même échelle) |
| Extrapolation | la campagne de référence complète (112 350 parties) représente environ 21 minutes-cœur ; sur 16 lots, quelques minutes |

### Comment l'environnement d'analyse pilote GitHub
- **Déclencher** une campagne : possible, par l'interface de programmation REST de GitHub (la commande `gh workflow run` échoue : elle passe par GraphQL, refusé dans les sessions Claude).
- **Récupérer les résultats** : le téléchargement des « artefacts » et des journaux d'exécution est **bloqué**. Parade retenue : à la fin d'une campagne, le workflow dépose la synthèse sur une branche **`resultats`** du dépôt, dans `campagnes/<campagne>_run<n>/`.
- **Écrire** dans le dépôt, y compris les fichiers de workflow : possible.

## 10. Décision de l'auteur (12 oct. 2026) : la famille A
**Décision : les campagnes tournent sur les exécuteurs de GitHub (GitHub Actions), dans le dépôt public `Projet_Jeu`.**

### Quotas vérifiés le 12 oct. (documentation de GitHub)
| Point | Valeur | Conséquence |
|---|---|---|
| Coût | Gratuit pour les exécuteurs standard dans un dépôt public | Budget nul |
| Taille d'un exécuteur Linux, dépôt public | 4 cœurs, 16 Go de mémoire, 14 Go de disque (2 cœurs et 8 Go pour un dépôt privé) | 4 Go par cœur : largement assez |
| Tâches simultanées, compte gratuit | 20 | 80 cœurs à la fois |
| Durée d'une tâche | 6 heures au plus (la tâche est coupée et échoue au-delà) | Un lot doit tenir en moins de 6 heures : environ 24 heures-cœur par lot |
| Tâches par lancement | 256 | Jusqu'à 256 lots par campagne, joués 20 à la fois |
| Durée d'un lancement | 35 jours | Sans effet ici |
| Appels à l'interface de GitHub | 1 000 par heure et par dépôt pour le jeton du workflow | Sans effet ici |

**Capacité :** 80 cœurs pendant 6 heures font 480 heures-cœur par vague de 20 lots. Un cycle complet de 300 à 1 500 heures-cœur tient donc en 4 à 20 heures de temps réel, sans frais.

### Le risque à surveiller : les conditions d'usage de GitHub
Les conditions d'usage de GitHub Actions excluent, sur les exécuteurs de GitHub, « toute autre activité sans rapport avec la production, les tests, le déploiement ou la publication du projet logiciel » du dépôt. Elles excluent aussi toute activité qui impose aux serveurs une charge disproportionnée par rapport au bénéfice pour les utilisateurs. En cas d'abus, GitHub peut arrêter les tâches, restreindre Actions, désactiver le dépôt, voire suspendre le compte.

Nos campagnes testent le moteur et les règles qu'il contient : elles sont liées au projet du dépôt. Mais des centaines d'heures-cœur de simulation pourraient être lues comme du calcul général. C'est GitHub qui en juge, pas nous.

Parades retenues :
- **Volumes raisonnables.** On commence par des campagnes de taille moyenne, et on augmente seulement après avoir mesuré la vitesse du bot fort.
- **Pas de lancements en continu.**
- **Un lanceur qui reste portable.** Les mêmes lots (`--lot i/n`, `--fusionner`) tourneraient sur une machine louée (familles B ou E) si GitHub objectait.
- **Aucune donnée personnelle dans le dépôt.**

### Conséquence du dépôt public
Le code du moteur, les règles et les résultats sont visibles de tous. C'était déjà le cas depuis le banc d'essai du 12 oct.

### Reste à faire
1. **Mettre le dépôt à jour.** Il contient le moteur 1.0, avec les lots ; il faut y porter le moteur 1.5 sans perdre les lots, et vérifier les deux workflows.
2. **Découper la batterie en lots** (`python -m foret.batterie` par lots, puis fusion), pour qu'elle tourne sur GitHub.
3. **Ajouter la reprise** : ne relancer que les lots manquants.
4. **Mesurer une campagne complète sur GitHub**, puis, en phase 2, la vitesse du bot fort. Cela fixe la taille des lots (moins de 6 heures chacun).
