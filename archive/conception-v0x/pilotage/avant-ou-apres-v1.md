# Avant ou après la V1 : ce qui s'applique dès maintenant

*14 oct. 2026, 14 h 30. Rédigé par Claude à la demande de l'auteur, après les décisions C2 à C4 (journal des décisions, section 7). Il répartit tout ce qui a été proposé pour la « campagne de profondeur » ([campagne-de-profondeur.md](campagne-de-profondeur.md)) et pour la leçon du rêve ([choix-strategique.md](choix-strategique.md)) entre trois moments. Les coûts sont des estimations ; ils seront recalés sur les premiers lancements.*

## En bref
- **L'auteur préfère appliquer dès la phase de sélection** tout ce qui peut l'être. C'est là que les défauts de structure coûtent le moins cher à corriger, puisque les règles changent encore.
- **Maintenant (cycle 2)** : tout ce qui change le choix des variantes, coûte peu (au coût d'un glouton, ou en relisant des données déjà produites) et ne demande ni version stable ni parties humaines. Cela couvre les cinq tests du choix stratégique (T1 à T5), la discipline statistique et les gains de vitesse du pipeline.
- **À chaque version adoptée** : les mesures au bot fort qui coûtent quelques heures. On les fait une fois par version, dans le protocole, et pas pour chaque variante.
- **Après la V1** : ce qui demande des règles stables (un bot appris serait à réentraîner à chaque changement), des parties humaines (débutant calibré, courbe d'apprentissage), ou une précision de validation (± 1 point sur les 57 compositions).

## 1. Le tri
| Moment | Conditions | Pourquoi |
|---|---|---|
| **Maintenant, à chaque cycle** | change la sélection ; coût faible ; ni version stable, ni données humaines | un défaut de structure trouvé à la sélection évite un cycle perdu, comme pour le rêve |
| **À chaque version adoptée** (protocole P3, P4…) | demande le bot fort sur plusieurs configurations, quelques heures de calcul | trop cher pour chaque variante, indispensable pour chaque version |
| **Après la V1** (campagne de profondeur) | demande des règles stables, des parties humaines, ou une grande précision | à faire plus tôt, ce serait à refaire à chaque changement de règle |

## 2. Maintenant : à intégrer au cycle 2 (choix techniques de Claude, sauf mention)
**État au 14 oct., 15 h : M1 à M5 faits** (étape 3 quater, a à c ; premières lectures : [choix-strategique-premieres-lectures.md](../4-bilans/choix-strategique-premieres-lectures.md)) ; M4 : témoins lus le 14 oct. (campagnes 22 à 30) ; pour le rêve, choix de rythme, le test de référence est T3 complet au niveau de la partie (campagne `jugement_reve`), validé sur V0.3 et V0.4 ; T4 reste pour les choix sans rythme. M6 à M11 restent.

Dans l'ordre de mise en œuvre. Ce sont toutes des **lectures** : elles alimentent le rapport et les alertes. Les bandes nouvelles ne jugent qu'après confirmation sur leurs témoins (décision C3).

| N° | Quoi | D'où | Où dans le pipeline | Coût |
|---|---|---|---|---|
| M1 | **T1, fréquence des mécanismes voulus** : un registre des interactions voulues par la conception (tir à la corde, recul par le cauchemar, ordre annulé par un esprit, oubli en 12, alliance, embuscade, rêve sur le présage…), chacune liée à un compteur du moteur (existant, ou ajouté s'il manque) ; alerte sous 0,5 occurrence par partie pour un mécanisme noté 8 ou 9 | C4 | rapport de chaque étape du cycle, depuis les compteurs déjà présents dans les synthèses | nul |
| M2 | **T2, horaires** dans la bibliothèque du garde-fou (rêver à partir du tour *k*, jusqu'au tour *k*, *k* = 2 à 5) | choix stratégique, principe 7 | étape `boucles` | quelques minutes |
| M3 | **T3 léger, réflexes de rêve** : des règles simples qui lisent la situation (rêver si un esprit est à un pas du centre, si le présage désigne la case devant un esprit, si aucune zone menacée n'est à portée), comparées au meilleur taux fixe. Si une règle simple bat tous les taux fixes, juger rapporte, même pour un joueur moyen | choix stratégique, T3 | étape `boucles` | quelques minutes |
| M4 | **T4 et T5, profil de Δ et lisibilité** : le bot fort juge une décision sur dix pendant la manche 2 de la confirmation, et note le nom des options et quelques indices publics. Le rapport donne, pour le choix du rêve puis pour les autres choix, la part des situations où chaque option gagne, la zone neutre, et la précision d'un arbre à un puis deux indices | C3 | manche 2 de la confirmation, puis rapport | à peu près neutre (juger une décision coûte autant que la chercher) |
| M5 | **Remplacer la mesure des « dilemmes »** par T4 dans le registre des mesures, l'ancienne restant lisible pour comparaison | C3 | `foret/mesures.py` | nul |
| M6 | **Fiche du choix** pour chaque règle que Claude propose (d'abord le rêve disputé, rétrospectivement), puis pour les six choix du jeu (moitié de carte, saboter ou barrer, voie du rêve, lune, Voir et Hanter, traces) à partir des données de M1 à M4 | C2 | bilans de cycle | nul |
| M7 | **Discipline statistique** : contrôle du taux de fausses découvertes (Benjamini-Hochberg) dans les rapports ; nombre de parties fixé par calcul de puissance à partir des écarts appariés déjà mesurés | campagne de profondeur, 3.3 | rapports, plans de cycle | nul |
| M8 | **Distribution des résultats** (écart-type, deux bosses ou une) à côté de chaque moyenne | campagne de profondeur, 3.2 | rapport, depuis les parties compactes | nul |
| M9 | **Stabilité de la version proposée** : chaque paramètre bougé d'un cran, au glouton ; une version qui bascule au moindre cran est signalée | campagne de profondeur, 6 | étape `boucles` ou bilan de cycle | quelques minutes |
| M10 | **Règle de méthode 2** : tout objectif absent du score est lu sur les finalistes (objectif 2 par M3 et M4), sinon il est signalé comme risque dans le rapport | C2 | rapport | nul |
| M11 | **Vitesse du pipeline** : profilage (temps par étape, occupation des cœurs) ; lots plus courts et plus nombreux ; reprise d'un lot coupé ; mémoire des résultats (ne jamais rejouer l'ancre ni un témoin déjà joué) | campagne de profondeur, 8 bis | workflows, `foret/sim.py`, `foret/cycle.py` | gain de temps attendu : le cycle 1 a duré 6 h 45 au lieu de 5 h 20 |

**Pour l'essai du rêve disputé (en cours)**, les lectures complémentaires sont déjà inscrites à l'étape 3 ter d'ETAT.md : instrument (second bot), horaires et réflexes, profil de Δ dès que M4 existe.

## 3. À chaque version adoptée (protocole de la version)
| Quoi | Pourquoi pas plus souvent | Coût |
|---|---|---|
| **T3 complet** : gain du bot libre sur la meilleure règle fixe, avec deux bots (MC64R et MC 256 à portefeuille), pour que le verdict ne dépende pas de l'instrument | le bot fort joue chaque configuration de rêve (libre, 0, 0,5, 1) | quelques heures sur GitHub |
| **T4 et T5 sur toutes les décisions**, pas seulement sur le rêve | échantillon de décisions plus grand qu'en confirmation | inclus dans le programme du protocole |
| **Jeu restreint** sur la version (déjà fait sur la V0.3) | une configuration par action ou pouvoir interdit | environ 500 parties du bot fort |
| **Valeur de l'information** (bot qui voit les mains contre bot qui ne voit que les traces) : si l'écart est nul, la communication ne peut pas compter | une campagne par version | modeste |
| **Répétition punie** : le Méchant qui apprend fait-il payer les meilleures boucles ? (témoin `temoin_sans_apprentissage`) | utile au cycle 3, qui règle le Méchant | faible, au coût d'un glouton |

## 4. Après la V1 : campagne de profondeur
| Quoi | Pourquoi attendre |
|---|---|
| Bot appris (itération d'expert), évaluation apprise, MCTS à plusieurs coups | l'entraînement est à refaire à chaque changement de règle ; à avancer seulement si T3 montre que le bot fort fausse un verdict de sélection |
| Recherche automatique de la meilleure boucle, boucles de règles | elle cherche des failles fines dans une version stable |
| Courbe d'apprentissage complète : niveaux N0 à N6, apprenant, tables mixtes, niveaux de difficulté | demande le bot appris et des parties humaines ; T5 et l'échelle des bots en donnent un avant-goût dès maintenant |
| Débutant calibré, styles du panel | demande les parties humaines de l'auteur |
| Pilote IA (juge à l'aveugle, table qui délibère, débutant sur livret) | demande un livret stable, une clé d'API (décision de l'auteur) et des parties humaines pour la calibration |
| Moments décisifs, diversité des stratégies, variété des arcs, paralysie, effet leader par niveau | coûteux en copies d'état, ou dépendant de bots variés et forts |
| Les 57 compositions à ± 1 point, états limites | précision de validation (plan vers la V1, section 10) |
| Optimisation fine, file de nuit | par définition, sur une version stable |

## 5. Ce qui change dans ETAT.md
L'étape **3 quater** (section 5) reprend M1 à M11 dans cet ordre, avant le lancement du cycle 2 (étape 4). M1 à M5 sont prioritaires : ils servent aussi à juger l'essai du rêve disputé. M6 à M11 peuvent suivre pendant le cycle. Rien de cela ne change une règle du jeu ni une bande en vigueur.
