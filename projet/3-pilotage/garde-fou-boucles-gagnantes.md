# Garde-fou « aucune boucle gagnante »

*Statut (14 oct. 2026) : **adopté par l'auteur le 14 oct., 7 h 55** (ETAT.md, section 8) ; **mis en œuvre le 14 oct., 8 h 30, en lecture seule** (section 7) ; première lecture : [garde-fou-boucles-ligne-de-base.md](../4-bilans/garde-fou-boucles-ligne-de-base.md). Spécification autonome, tirée de la section 6 bis du document « Campagne de profondeur - tester la V1, courbe d'apprentissage, garde-fous » (projet Claude « Idée de jeu de société », anciennement « Campagne P3 »). Bandes provisoires, à confirmer par l'auteur au vu des premiers résultats. Les noms « protocole P2 / P3 » de ce dépôt désignent les protocoles des cycles ; ce document dit « campagne de profondeur » pour la campagne qui suivra la V1.0.*

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
  - *boucle collective* : une **convention de table** décidée avant la partie, identique d'une partie à l'autre, appliquée par tous les sièges sans lire l'état (alliance perpétuelle, relais, spécialisation, miroir, barrage et sabotage couplés, remorquage en chaîne). Jouée par des sièges indépendants (table mixte, `fabriquer_table`) ; le pilote unique qui l'exécute pour tous (borne) est à venir.
- Une convention qui lit l'état ou s'appuie sur les traces n'est plus une boucle ouverte : elle relève de la coordination (objectif 3).
- **Gagner** = se rapprocher du bot fort ou le dépasser sans lire le jeu. Critère **relatif** : la difficulté change d'une version à l'autre (V0.3 : 89 à 99 % de forêt gardée ; V0.4 : 58 à 95 % selon la taille et le bot), et un critère absolu mélangerait dominance et difficulté. Le niveau absolu est donné à titre d'information.
- Les **gloutons** (parer au plus probable, rythme de rêve fixe) comptent parmi les stratégies répétées : c'est la politique du tape-taupe.

## 4. Bibliothèque de stratégies répétées (bot `repete`, déclaratif)
Un bot paramétré par un script (`foret/bots/repete.py`) : priorité d'actions, règle de zone (fixe, la plus menacée au départ, ou la plus menacée maintenant pour les réflexes), déplacement (jamais, ou vers une zone cible commune), moitié jouée, motif de rêve, relais, motif d'étapes, voie du rêve, Tromper, Voir, Hanter. Un script par siège pour les conventions collectives (table mixte). La bibliothèque (`foret/boucles.py`, `bibliotheque(n)`) compte **130 stratégies par taille de table** :
| Famille | Contenu | Nombre |
|---|---|---|
| Une action partout | saboter, barrer ou soutenir en premier × zone fixe ou la plus menacée au départ × moitié Machines ou plateau × rêve 0 ou 1 par tour | 24 |
| Une moitié | toujours la moitié haute, ou basse × rêve 0 ou 1 | 4 |
| Rythme de rêve | les 33 motifs primitifs de 0, 1 ou 2 rêves par tour, de longueur 1 à 3, rêves en début ou en fin de tour | 66 |
| Motif sur les trois étapes | 6 motifs d'étapes laissées vides × rêve 0 ou 1 | 12 |
| Exploiter le Méchant | Tromper toujours ou jamais × rêve 0 ou 1 ; voie du réveil ou alternée × 1 ou 2 rêves | 8 |
| Réflexes (pas des boucles ouvertes) | saboter ou barrer au plus menacé × rêve 0, 1 ou 0-1 | 6 |
| **Conventions de table** | un seul rêveur (1 ou 2 rêves) ; un seul saboteur ; relais du rêveur (1 ou 2) ; alliance perpétuelle (zone de départ avec 0 ou 1 rêve, zone fixe) ; barrage et sabotage couplés (0 ou 1 rêve) | 10 |

Le même script à tous les sièges est la convention « miroir ». Les trois gloutons du cycle (rêve 0, 0,5, 1) jouent dans la même campagne. *À venir* (campagne de profondeur) : échouer volontairement pour pousser la piste, sacrifier toujours la même zone, remorquage en chaîne, et la recherche automatique de la meilleure boucle.

## 5. Mesures et bandes (provisoires)
Étiquette : **indice** (un vert prouve seulement qu'on n'a pas trouvé de boucle gagnante). Placement : **garde-fou**, à côté de « aucun effort n'est vain » ; pas de cinquième objectif (A4).
| Mesure | Définition | Vert | Rouge |
|---|---|---|---|
| **Écart à la meilleure boucle** | forêt du bot fort moins forêt de la meilleure stratégie répétée, par taille de table ; on garde la pire taille | ≥ 10 points (bande du tape-taupe) | < 3 points |
| **Aucune convention de table ne suffit** | forêt de la meilleure boucle collective, **composition par composition** ; on garde la pire composition | ≥ 10 points pour chaque composition testée | < 3 points pour une composition |
| **Une action ne suffit pas** | forêt de la meilleure stratégie « X partout » rapportée à celle du bot fort | aucune ne dépasse 90 % du bot fort | une approche le bot fort à 3 points près |
| **Échelle de la lecture** | écarts boucle ouverte → glouton → bot fort | chaque marche ≥ 3 points | une marche < 1 point |
| **Répétition punie** *(à venir)* | gain d'apprentissage du Méchant face à la meilleure boucle, comparé à celui face au bot fort ; perte de forêt de la boucle entre les tours 1-2 et 5-6 | gain face à la boucle ≥ 2 fois celui face au bot fort | gain nul |
| **Boucles de règles** *(à venir)* | jeu aléatoire à biais de répétition, invariants du moteur vérifiés, pour trouver une séquence rejouée qui gagne sans limite | aucune trouvée | une trouvée (alerte de conception) |

## 6. Témoins
| Témoin | Construction | Verdict attendu |
|---|---|---|
| **V0.3** (mesuré le 14 oct.) | rêver à chaque tour y domine, le jeu est trop facile | écart à la meilleure boucle rouge : **obtenu** (−3,0 points à 5 joueurs ; boucle ouverte à 0,4 point à 4 joueurs) |
| V2 proposée (sans lunes) | rêver à chaque tour y est le meilleur taux | écart à la meilleure boucle rouge |
| `retour_v0_reves_illimites` (existe) | rêves sans limite | rouge ; « une action ne suffit pas » rouge pour rêver |
| **Action gagnante** (à créer) | Barrer annule tout, sans limite | « une action ne suffit pas » rouge pour Barrer |
| **Combo gagnant** (à créer) | l'alliance de deux peuples précis, répétée chaque tour, annule toute la menace | « aucune convention de table ne suffit » rouge pour cette paire seulement |
| `temoin_sans_apprentissage` (existe) | le Méchant n'apprend plus | « répétition punie » rouge |
| V0.2 | un peuple suffit, la menace est résolue | écart à la meilleure boucle rouge |

## 7. Mise en œuvre
**Fait le 14 oct., en lecture seule** (décision de l'auteur : « dès à présent ») : aucune bande ne juge, rien n'entre dans le score des variantes.
1. `foret/bots/repete.py` : le bot déclaratif, enregistré sous le nom `repete`.
2. `foret/boucles.py` : la bibliothèque, la campagne appariée (`python -m foret.boucles campagne --maquette … --tables-de <campagne du bot fort>`), l'analyse (`python -m foret.boucles analyser --boucles … --fort …`), les alertes et le bloc Markdown.
3. `foret/mesures.py` : quatre mesures descriptives (`boucle_gagnante`, `convention_table`, `action_suffit`, `echelle_lecture`), étiquette indice, bandes rangées dans `bandes_proposees` ; `docs/mesures.md`, section « Garde-fou ».
4. `foret/cycle.py` : **étape `boucles`** entre le contrôle et le rapport, jouée automatiquement à chaque cycle (`"boucles": false` dans le plan pour la sauter). Elle joue les finalistes et l'ancre sur les tables et les graines de la dernière manche de confirmation, ce qui l'apparie au bot fort ; le rapport reçoit un bloc « Garde-fou » et une **alerte de conception** si une boucle ou une convention arrive à moins de 3 points du bot fort.
5. `tests/test_boucles.py` : bot, bibliothèque, campagne appariée, analyse, enchaînement du cycle.
6. **Coût mesuré** : 8 512 parties (130 stratégies et 3 gloutons, 16 tables, 4 parties) en 26 à 33 s sur 2 cœurs. L'étape du cycle (finalistes et ancre, 8 parties par table) coûte quelques minutes.
7. **Première lecture** : V0.3 et V0.4, appariées aux Campagnes 16 et 18 ([bilan](../4-bilans/garde-fou-boucles-ligne-de-base.md)).

**Campagne de profondeur (après la V1.0)** : bandes confirmées et gelées ; recherche automatique de la meilleure boucle (vecteur par siège, recherche locale ou évolutionnaire, graines appariées) ; « répétition punie » ; boucles de règles ; reprise des cinq meilleures comme politique des suites du bot fort (échantillon : 15 tables, 6 parties, environ 28 heures-cœur) ; rejeu par le bot appris sans bibliothèque (tout écart signale une stratégie manquée).

## 8. Limites
Un vert ne prouve jamais l'absence de boucle gagnante : il dit qu'on n'en a pas trouvé avec la bibliothèque, la recherche et les bots disponibles. Seuls les tests humains écartent le risque d'un détournement de règle auquel aucun bot n'a pensé.
