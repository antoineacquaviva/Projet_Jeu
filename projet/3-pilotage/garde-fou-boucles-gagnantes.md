# Garde-fou « aucune boucle gagnante »

*Statut (14 oct. 2026) : **adopté par l'auteur le 14 oct., 7 h 55** (ETAT.md, section 8). Spécification autonome, tirée de la section 6 bis du document « Campagne P3 - tester la V1 en profondeur et courbe d'apprentissage » (projet Claude « Idée de jeu de société »). Bandes provisoires, à confirmer par l'auteur au vu des premiers résultats. Les noms « protocole P2 / P3 » de ce dépôt désignent les protocoles des cycles ; ce document dit « campagne de profondeur » pour la campagne qui suivra la V1.0.*

## 1. Exigence (auteur)
Une action d'un joueur, ou une suite d'actions répétées, y compris à plusieurs joueurs, ne doit pas constituer une stratégie gagnante.

## 2. Ce que les tests couvraient avant (mesuré dans les documents, 14 oct.)
- **Une action répétée : rêver.** Meilleur taux de rêve fixe et gain du bot libre (objectif 2). V2 : le meilleur taux est le maximum (rouge).
- **Une politique répétée : parer au plus probable.** Tape-taupe (objectif 1) : 11,1 points en v1 (vert), 4,4 en V2 (orange).
- **Rien d'autre** : ni les autres actions répétées, ni les motifs sur plusieurs tours ou sur les trois étapes, ni les conventions de table à plusieurs sièges, ni l'exploitation du Méchant, ni recherche de la meilleure stratégie répétée.
- **Pourquoi c'est un risque réel** : en V2, le bot fort dont les suites ne rêvent pas (82 %) a perdu contre le glouton qui rêve une carte par tour (86 %) ; le bot fort est à un coup et ne découvre pas ce que sa politique ne joue pas (diagnostic de la phase 3, sections 1, 8 et 10).

## 3. Définitions
- **Stratégie répétée** = politique en boucle ouverte, qui ne lit pas l'état de la partie :
  - *stationnaire* : le même choix à chaque décision de même type ;
  - *périodique* : un motif de 2 ou 3 tours, ou de 3 étapes, qui se répète ;
  - *script d'équipe* : chaque siège suit son script, sans lire les autres ;
  - *boucle collective* : une **convention de table** décidée avant la partie, identique d'une partie à l'autre, appliquée par tous les sièges sans lire l'état (alliance perpétuelle, relais, spécialisation, miroir, barrage et sabotage couplés, remorquage en chaîne). Jouée par des sièges indépendants (table mixte, `fabriquer_table`) et par un pilote unique (borne).
- Une convention qui lit l'état ou s'appuie sur les traces n'est plus une boucle ouverte : elle relève de la coordination (objectif 3).
- **Gagner** = se rapprocher du bot fort ou le dépasser sans lire le jeu. Critère **relatif** (le jeu est « trop facile » à tous, 90 à 99 %) ; le niveau absolu est donné à titre d'information.

## 4. Bibliothèque de stratégies répétées (bot `repete`, déclaratif)
Un bot paramétré par un script (priorité d'actions, règle de zone, motif de rêve, motif d'étapes), un script par siège, plus un motif partagé pour les conventions collectives.
| Famille | Exemples | Ordre de grandeur |
|---|---|---|
| Une action partout | toujours Barrer, Saboter, Aller, Voir, Hanter, S'unir… (repli si impossible) | 10 à 15 |
| Un pouvoir par peuple | chaque peuple joue en boucle sa moitié de carte la plus forte | quelques dizaines |
| Une zone | la plus menacée au départ, la plus centrale, toujours la même | 5 à 10 |
| Rythme de rêve | taux fixes (existent), motifs de longueur 1 à 3 : défense seule, rêve 1, rêve 2, mixte | 64 motifs de longueur 3 |
| Motif sur les trois étapes | même carte aux trois étapes, A-B-A, programme identique à chaque tour | une dizaine |
| Exploiter le Méchant | toujours la même tactique contrée, échouer volontairement pour pousser la piste, sacrifier toujours la même zone (vérifier ce que font les règles de la version testée) | une dizaine |
| Script d'équipe indépendant | combinaisons des familles précédentes, un script par peuple | quelques dizaines |
| **Boucles collectives** | alliance perpétuelle ; relais (un siège rêve, les autres défendent, le rôle tourne) ; spécialisation (un seul siège rêve ou sabote) ; miroir ; barrage et sabotage couplés ; remorquage en chaîne | 30 à 60 par composition |

## 5. Mesures et bandes (provisoires)
Étiquette : **indice** (un vert prouve seulement qu'on n'a pas trouvé de boucle gagnante). Placement : **garde-fou**, à côté de « aucun effort n'est vain » ; pas de cinquième objectif (A4).
| Mesure | Définition | Vert | Rouge |
|---|---|---|---|
| **Écart à la meilleure boucle** | forêt du bot fort moins forêt de la meilleure stratégie répétée, par taille de table ; on garde la pire taille | ≥ 10 points (bande du tape-taupe) | < 3 points |
| **Aucune convention de table ne suffit** | forêt de la meilleure boucle collective, **composition par composition** ; on garde la pire composition | ≥ 10 points pour chaque composition testée | < 3 points pour une composition |
| **Une action ne suffit pas** | forêt de « X partout » rapportée à celle de la meilleure stratégie | aucune ne dépasse 90 % de la meilleure | une seule approche la meilleure à 3 points près |
| **Échelle de la lecture** | écarts boucle ouverte → glouton → bot fort | chaque marche ≥ 3 points | une marche < 1 point |
| **Répétition punie** | gain d'apprentissage du Méchant face à la meilleure boucle, comparé à celui face au bot fort ; perte de forêt de la boucle entre les tours 1-2 et 5-6 | gain face à la boucle ≥ 2 fois celui face au bot fort | gain nul |
| **Boucles de règles** | jeu aléatoire à biais de répétition, invariants du moteur vérifiés, pour trouver une séquence rejouée qui gagne sans limite | aucune trouvée | une trouvée (alerte de conception) |

## 6. Témoins
| Témoin | Construction | Verdict attendu |
|---|---|---|
| V2 proposée (sans lunes) | rêver à chaque tour y est le meilleur taux | écart à la meilleure boucle rouge |
| `retour_v0_reves_illimites` (existe) | rêves sans limite | rouge ; « une action ne suffit pas » rouge pour rêver |
| **Action gagnante** (à créer) | Barrer annule tout, sans limite | « une action ne suffit pas » rouge pour Barrer |
| **Combo gagnant** (à créer) | l'alliance de deux peuples précis, répétée chaque tour, annule toute la menace | « aucune convention de table ne suffit » rouge pour cette paire seulement |
| `temoin_sans_apprentissage` (existe) | le Méchant n'apprend plus | « répétition punie » rouge |
| V0.2 | un peuple suffit, la menace est résolue | écart à la meilleure boucle rouge |

## 7. Mise en œuvre
**Dès le cycle 2, en lecture seule** (décision de l'auteur, 14 oct.) : aucune bande, aucun effet sur la sélection ni sur le score des variantes ; un bloc « boucles » dans le rapport.
1. `foret/bots/repete.py` : bot déclaratif (script par siège, motif partagé), enregistré dans `BOTS` ; tests citant la règle de repli.
2. `foret/batterie.py` : programme `boucles` (bibliothèque écrite à la main, jouée au coût d'un glouton) sur la V0.4, avec la V0.3 en ancre, toutes tailles de table (2 à 6), graines appariées ; les compositions pour les boucles collectives (au moins un duo complet du tétraèdre par taille).
3. `foret/mesures.py` : les mesures du tableau 5, **étiquetées indice et descriptives** (pas de verdict tant que l'auteur n'a pas confirmé les bandes) ; `python -m foret.conformite --mesures` ne doit rien lister en attente.
4. Rapport du cycle (`foret/cycle.py`) : bloc « boucles » avec la meilleure boucle par taille, le détail des familles, et une **alerte de conception** si l'écart à la meilleure boucle est inférieur à 3 points.
5. Coût estimé : bibliothèque d'environ 150 stratégies sur les 57 compositions à 20 parties, 171 000 parties, au débit mesuré de la batterie 1 (96 200 parties en 2,5 min sur 16 lots) : quelques dizaines de minutes de calcul (estimation, à recaler).

**Campagne de profondeur (après la V1.0)** : bandes confirmées et gelées ; recherche automatique de la meilleure boucle (vecteur par siège, recherche locale ou évolutionnaire, graines appariées) ; reprise des cinq meilleures comme politique des suites du bot fort (échantillon : 15 tables, 6 parties, environ 28 heures-cœur) ; ablation de la meilleure boucle ; rejeu par le bot appris sans bibliothèque (tout écart signale une stratégie manquée).

## 8. Limites
Un vert ne prouve jamais l'absence de boucle gagnante : il dit qu'on n'en a pas trouvé avec la bibliothèque, la recherche et les bots disponibles. Seuls les tests humains écartent le risque d'un détournement de règle auquel aucun bot n'a pensé.
