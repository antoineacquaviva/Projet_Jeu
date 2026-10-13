# Plan d'action : de la V0.3 à une V1 jouable

*13 oct. 2026, 14 h. Rédigé par Claude à la demande de l'auteur. Ce plan remplace les phases 4 et 5 du « Plan d'action » (`plan-d-action.md`), qui reste la référence pour les méthodes (mesures, bandes, bots). Il applique les recommandations du point du 13 oct. (pistes J1 à J3, T1 à T7), validées par l'auteur, et ses sept souhaits.*

## En bref
- **But** : une **V1.0** que l'auteur teste avec d'autres personnes : règles complètes, fiches à imprimer, kit d'observation.
- **Chemin** : trois cycles au plus, chacun « campagne → nouvelle version du jeu → nouvelle version du protocole ». V0.3 → V0.4 → V0.5 → V0.6, puis validation et gel en V1.0.
- **Les calculs s'enchaînent seuls sur GitHub** : criblage, exploration, confirmation et rapport, sans session Claude et sans attente.
- **Claude n'intervient qu'aux charnières**, soit environ deux sessions par cycle et une dizaine en tout (estimation), au lieu de passages trois fois par jour.
- **Toutes les tailles de table** : le jeu doit tenir ses objectifs de 2 à 6 joueurs ; c'est la plus faible taille qui compte (section 7 bis).
- **Défauts de conception** : signalés dès qu'ils apparaissent, par une alerte automatique dans le rapport et une issue GitHub. Une première alerte est déjà levée : **le rêve se paie trop tard** (section 6).
- **Règle de décision** : Claude tranche seul les choix techniques. L'auteur tranche la conception du jeu (section 9).

## 1. Les noms des versions
| Nouveau nom | Ancien nom | Fichier | Statut |
|---|---|---|---|
| V0.1 | v0 | `maquettes/v0.json` | historique |
| V0.2 | v1 (livret publié) | `maquettes/v1.json` | **étalon figé** : sert de contraste, aucune nouvelle campagne |
| V0.3 | v2 fixée (« V2 proposée » + lunes à toutes les tailles de table), décision 3.7 | `maquettes/v0.3.json` (à créer) | **point de départ** |
| V0.3-sans-lunes | « V2 proposée » | variante nommée | comparaison |
| V0.4, V0.5, V0.6 | – | une maquette par cycle | candidates |
| V1.0 | – | la candidate validée et gelée | tests humains |

- La version du **moteur** (1.7.1) est distincte de la version du **jeu** : on écrira toujours « moteur 1.7.1 » et « jeu V0.3 ».
- Les anciens fichiers et codes d'atelier restent valides : les anciens résultats restent lisibles.
- Le **protocole** d'évaluation est versionné lui aussi : P1 est le protocole actuel (batterie phase3 et mesures3). Chaque nouvelle version du protocole rejoue la version précédente du jeu comme **ancre**, pour que les chiffres restent comparables d'un cycle à l'autre.

## 2. La boucle d'un cycle
```
 (Claude) préparer ──► (GitHub, seul) criblage ─► exploration ─► confirmation ─► contrôle ─► rapport + alertes
     ▲                                                                                          │
     └────── (auteur) adopter la version V0.n+1 ◄── (Claude) analyser, proposer ◄──────────────┘
```
| Étape | Qui | Contenu | Coût estimé |
|---|---|---|---|
| a. Préparer | Claude, 1 session | appliquer la version décidée ; mettre le protocole à jour ; tests ; lancer le cycle | – |
| b. Criblage | GitHub | plan de Morris sur les paramètres libres, joué par le glouton : quelles variables bougent quels objectifs | moins de 30 min |
| c. Exploration | GitHub | MAP-Elites, au glouton, avec la durée comme premier objectif ; recherche au hasard à budget égal comme étalon ; générations enchaînées jusqu'à stabilisation | 1 à 3 h |
| d. Confirmation | GitHub | 12 meilleures variantes et l'ancre, au bot fort, en course d'élimination (4 parties, on garde la moitié, 8 de plus…) | 1 à 2 h |
| e. Contrôle | GitHub | 3 finalistes avec un bot de contrôle jamais utilisé dans la recherche, et une ablation légère | environ 1 h |
| f. Rapport | GitHub | `rapport.md` écrit par Python : objectifs et bandes, verdicts stables ou non entre bots, candidats, alertes ; ouverture d'une issue GitHub | quelques minutes |
| g. Analyser | Claude, 1 session | lire le rapport et non les données brutes ; bilan court ; proposer V0.n+1 | – |
| h. Adopter | auteur | accepter, amender ou refuser la version proposée ; répondre aux alertes | – |

**Arrêts.**
- On passe directement à la validation dès qu'une version n'a plus aucun objectif en rouge, ni avec le bot fort ni avec le bot de contrôle.
- On s'arrête après trois cycles dans tous les cas.
- On suspend le cycle si une alerte de conception rend la recherche inutile (section 6).

**Durée estimée** (supposée) :
- outillage : 2 à 3 jours ;
- un cycle : 1 à 2 jours, dont une demi-journée de GitHub et le délai de réponse de l'auteur ;
- validation : 2 jours.

Une V1.0 est donc possible en deux à trois semaines.

## 3. Étape 0 : l'outillage, avant le premier cycle
| N° | Travail | Pourquoi |
|---|---|---|
| 0.1 | **Versions renommées** : README, ETAT, documents, `maquettes/v0.3.json` | souhait de l'auteur |
| 0.2 | **V0.3 dans le moteur** (ancienne étape 4.1, première moitié), tests, conformité | point de départ |
| 0.3 | **Statistiques appariées** (T1) : écarts par graine, intervalles par rééchantillonnage dans les résumés ; une règle écrite de ce qu'est un « écart sûr » | marges plus étroites sans partie de plus |
| 0.4 | **Leviers du rêve en paramètres** : avance de l'esprit (case d'entrée, pas), lunes selon la taille de la table, taille de la main ; aucune règle nouvelle (section 6) | la phase 4 doit d'abord freiner le rêve (décision 3.7) |
| 0.5 | **Mesure « choix morts »** : part d'usage de chaque action et de chaque pouvoir par le bot fort, et perte au jeu restreint ; témoin « pouvoir qui ne fait rien » | intérêt de tous les choix |
| 0.6 | **Mesure « apprentissage du Méchant »** : écart entre le Méchant qui apprend et le témoin « Méchant qui n'apprend plus » | efficacité et apprentissage du Méchant |
| 0.7 | **Bot à portefeuille** (T3) : ses suites tirent leur politique dans un portefeuille (rêve 0 ou 1 par tour, défenseur, saboteur, bruité) et il garde le meilleur coup. Validé sur deux témoins : en V0.3, il doit égaler `MC64R` sans qu'on lui souffle de rêver ; en V0.2, il doit retrouver qu'il vaut mieux ne pas rêver | un bot qui découvre la stratégie au lieu de la recevoir |
| 0.8 | **Bot de contrôle** : MC 256 à portefeuille, ou MC dont la politique est l'aléatoire bruité | vérifier que les finalistes ne sont pas taillés pour un seul bot |
| 0.9 | **Criblage et exploration** codés (`foret/criblage.py`, `foret/exploration.py`) ; carte sauvegardée sur la branche `resultats` | étapes b et c |
| 0.10 | **Pipeline GitHub autonome** (section 4) et **rapport automatique** (étape f) | souhaits 2 et 4 |
| 0.11 | **Mesures fragiles réétiquetées** : dilemmes en indice descriptif, avec le témoin recalibré par Claude ; coordination de la V0.2 en « humain seulement » ; coordination et chef unique remesurés au bot fort sur la V0.3 | distinguer le mesuré du supposé |

Les étapes 0.3 à 0.8 sont rejouées une fois sur la V0.3 pour former le **protocole P2** et sa ligne de base. Le cycle 1 est ensuite lancé.

## 4. GitHub : autonome, parallèle, sans blocage (souhaits 2 et 4)
**Constat (mesuré, section 9 d'ETAT)** : les campagnes 11 à 15 ont duré 75 à 101 min alors que leur lot le plus lent prenait 23 à 34 min. Lancées ensemble, elles se partageaient les 20 tâches simultanées permises et s'attendaient l'une l'autre. Une fusion a aussi été annulée par un groupe de concurrence.

**Organisation retenue.**
- **Un orchestrateur, une seule file.** Un workflow `cycle.yml` lit le plan du cycle (`cycles/V0.n/plan.json`) et lance une étape à la fois. À la fin de chaque étape, la publication lance l'étape suivante (`workflow_dispatch` émis par le `GITHUB_TOKEN`, l'une des deux exceptions où ce jeton peut déclencher un workflow). Il n'y a donc jamais deux campagnes en concurrence pour les 20 tâches simultanées.
- **Toutes les ressources d'un lot.** Chaque lot utilise déjà tous les cœurs de son exécuteur (`Pool(os.cpu_count())`). Le nombre de cœurs sera enregistré dans la synthèse pour suivre le débit.
- **Des lots équilibrés par coût estimé** (un trio coûte 1,5 fois un duo, le bot fort 50 fois le glouton) plutôt que par nombre de parties : le lot le plus lent fixe la durée. Une étape qui dépasserait 5 h par lot est découpée automatiquement (limite : 6 h par tâche).
- **Le bon marché d'abord.** Le glouton (96 200 parties en 2,5 min) crible et explore ; le bot fort ne joue que les 12 meilleures variantes, en course d'élimination.
- **Reprise sans Claude.**
  - Un lot en échec est relancé une fois automatiquement.
  - La publication sur `resultats` réessaie, sans groupe de concurrence qui annule.
  - Un workflow quotidien de surveillance relance une étape bloquée et ouvre une issue si cela échoue deux fois.
- **Limites respectées** : 20 tâches simultanées, 256 tâches par matrice, 6 h par tâche, 1 000 appels d'API par heure pour le jeton (documentation GitHub, vérifiée le 13 oct.). L'orchestrateur reste loin de ces plafonds.
- **Volumes raisonnables** sur le dépôt public : une étape à la fois, un cycle à la fois, aucun lancement continu, et des résultats compacts (agrégats, parties compressées seulement pour la confirmation).
- **Fin d'étape signalée** dans un petit fichier `resultats/etat_pipeline.json` et, en fin de cycle ou en cas d'alerte, par une **issue GitHub**, qui envoie un courriel à l'auteur.

## 5. Économiser l'IA (souhait 3)
- **Claude ne surveille plus les calculs.** La tâche planifiée passe de trois passages par jour à **un passage par jour**. Elle lit d'abord `etat_pipeline.json` (quelques lignes) et s'arrête aussitôt s'il n'y a ni rapport neuf ni réponse de l'auteur.
- **Claude lit des rapports, pas des données.** Le rapport automatique fait le travail de tableau (bandes, comparaisons, alertes). L'analyse ne reprend les synthèses brutes que pour vérifier un point douteux.
- **Sessions attendues** (estimation) :
  - outillage : 2 à 3 ;
  - chaque cycle : 2 (préparer, analyser), plus 1 en cas d'alerte ;
  - validation et fiches : 2.

  Cela fait environ 11 à 14 sessions en tout, au lieu du plafond actuel de 12 par semaine.
- **Pas de question technique à l'auteur** (section 9) : moins d'allers-retours.

## 6. Alertes de conception (souhait 5)
**Règle automatique** (dans le rapport de chaque cycle). Un objectif est déclaré **hors de portée des paramètres** dans deux cas :
- aucune variante explorée ne le sort du rouge sans faire passer un autre objectif au rouge ;
- le criblage ne trouve aucune variable qui le fasse bouger nettement.

L'alerte nomme alors l'objectif, ce qui a été essayé et la piste de conception que Claude propose. Elle ouvre une issue « conception ». Claude la signale aussi à l'auteur dès la session suivante, sans attendre la fin du cycle.

**Alertes déjà levées (13 oct.)**

**A. Le rêve se paie trop tard.** Probable et important. Reformulée le 13 oct., 14 h 20, après la réponse de l'auteur.
- *Le principe (auteur)* : la tension tient au choix de jouer une carte côté rêve ou côté action, si bien que rêver prive d'une action.
- *Ce que disent les règles* : ce prix existe déjà, et il est même plus lourd. Une carte en rêve ne fait pas son action, et surtout elle quitte la main **pour le reste de la partie** (R3.6). La main compte 5 cartes pour toute la partie, sans pioche (R1.4), pour 3 étapes par tour.
- *Mesuré (diagnostic, sections 4, 6 et 7)* :
  - la partie finit au tour 3,2 ;
  - en V0.3, interdire une action ne coûte que 0 à 6 points (jeu restreint) ;
  - aucune des 16 options testées ne ramène les fins avant la mi-partie sous 63 %, pour une bande verte à 20 % au plus.
- *Supposé (lecture de Claude)* : le prix d'un rêve se paie en actions **futures**, puisque la main se vide, mais le rêve termine la partie avant que ce futur arrive. Les actions perdues au tour 1 ou 2 valent aussi peu, parce que la menace est encore faible. La tension existe donc dans le principe, mais elle est déséquilibrée : rêver ne coûte presque rien précisément parce que rêver va vite.
- *Correction dans l'esprit du principe, sans règle nouvelle* : rendre l'action plus précieuse au moment où l'on renonce, ou rendre la fin par le rêve plus lointaine pour que la main vidée se fasse sentir. Les leviers sont déjà des paramètres ou des réglages de règles existantes :
  - le seuil du Cercle ;
  - les lunes, selon la taille de la table (accepté par l'auteur : par exemple une de moins que de joueurs) ;
  - l'avance de l'esprit (case d'entrée, pas) ;
  - la menace des premiers tours (Machines au chantier au départ, escalade) ;
  - la taille de la main (5 cartes) ;
  - le nombre de tours.

  Le cycle 1 les explore en priorité.
- *Si le criblage montre que cela ne suffit pas*, l'alerte sera confirmée et Claude proposera à l'auteur des formes de prix supplémentaires (rêver prive aussi de l'étape suivante, rendement décroissant du Cercle…). Rien n'est codé avant son accord.

**B. « Trois façons d'agir » : Saboter ne pèse presque rien.** À surveiller.
- *Mesuré* : Saboter coûte 1 point en V0.3.
- *Supposé* : c'est un effet de la durée. Le verdict n'est possible qu'une fois la durée corrigée (cycle 1). Si Saboter reste sans poids, le principe « désarmer » (noté 8) demandera une règle.

**C. Coordination : un « solitaire à plusieurs ».** À surveiller.
- *Mesuré* : le chef unique n'apporte rien en V0.3 (0,2 %), mais avec un bot qui ne rêve pas.
- La mesure sera refaite au bot fort à l'étape 0.11. La réponse définitive appartient aux tests humains.

## 7. Améliorer le jeu : objectifs, mesures, leviers (souhait 6)
| Ce que l'auteur veut | Mesures (étiquette) | Leviers explorés | État de la V0.3 |
|---|---|---|---|
| **Durée maîtrisée** (priorité du cycle 1) | fins avant la mi-partie, tour de fin, incertitude restante, partie jouée d'avance (mesure) | seuil du Cercle, lunes, limite des rêves, avance de l'esprit, coût du rêve, tours | rouge : fin au tour 3 |
| **Équilibre des peuples** | Shapley (calculé sur les tables de 1 et 2 peuples, étendu aux trios pour les finalistes), aucun spectateur, pire table (mesure) | réglages des règles brisées (B3), Machines, plateau | vert, à revérifier après la durée |
| **Profondeur de stratégie** | gain du bot fort sur le glouton (tape-taupe), gain du bot à portefeuille sur une politique fixe (indice) | tous, en lecture | orange (4,4 points) |
| **Synergies des actions des joueurs** | duos qui battent leur meilleur peuple seul, alliances par partie, coordination (mesure ; coordination = indice) | alliance, barrage, traces | vert, à revérifier |
| **Efficacité et apprentissage du Méchant** | ordres réussis, concentration, surprise, menace croissante, gain d'apprentissage (nouveau) | plan du Méchant, doublé, Représailles, Machines au chantier | concentration verte, menace croissante orange |
| **Intérêt de tous les choix** | choix morts (nouveau), jeu restreint, dilemmes (indice descriptif) | coût des actions, réglages des pouvoirs | Saboter et la moitié des pouvoirs sans effet mesurable |

**Ordre de priorité de la recherche.**
- Cycle 1 : la durée, sous contrainte qu'aucun autre objectif ne passe au rouge.
- Cycle 2 : l'intérêt de tous les choix et la profondeur, qui ne se mesurent bien qu'une fois la partie assez longue.
- Cycle 3 : l'équilibre fin des peuples et du Méchant.

La qualité d'une variante reste le plus faible de ses objectifs normalisés (plan d'action, section 5).

## 7 bis. Toutes les tailles de table, de 2 à 6 joueurs (critère ajouté le 13 oct., 14 h 27)
**Le critère.** Le jeu doit tenir tous ses objectifs à 2, 3, 4, 5 et 6 joueurs. La qualité d'une variante devient **le plus faible de ses objectifs, pris à la taille de table où il est le plus faible**. Une variante excellente à 3 joueurs et rouge à 6 est donc rouge.

L'auteur accepte des règles propres au nombre de joueurs, en particulier sur le **nombre d'éléments**. Les règles nouvelles restent à sa décision (section 9).

**Indice de départ** (mesuré à la phase 1 avec le glouton, sur « V2 proposée » sans lunes, environ 60 parties par équipe) : la forêt gardée monte avec le nombre de joueurs.

| Joueurs | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Glouton qui rêve | 82 % | 85 % | 93 % | 95 % | 96 % | 98 % |
| Glouton qui ne rêve pas | 63 % | 73 % | 80 % | 89 % | 93 % | 95 % |

- *Supposé* : la menace du Méchant ne croît pas avec la table (3 Machines en jeu, 2 en réserve, 7 zones, 21 forêts, un ordre par étape), si bien qu'à 4 joueurs et plus la partie est presque gagnée d'avance et chaque joueur pèse moins.
- C'est un **défaut probable, corrigeable par les nombres d'éléments** : à confirmer avec le bot fort au cycle 1.
- Toutes les mesures de la phase 3 avec le bot fort ne portaient que sur 2 et 3 joueurs.

**Les paramètres qui dépendent de la table.** Chacun prend une valeur par taille de table, ou une formule simple, par exemple « une de moins que de joueurs » :
- lunes (accepté), cases du Cercle (déjà « par joueur ») ;
- Machines en jeu et en réserve, forêts par zone, ordres du Méchant par étape ;
- cartes en main, tours, esprits au départ.

**Méthode** (choix techniques de Claude).
- **Mesures adaptées à la table, bandes inchangées (B1).**
  - La concentration compte les *k* zones les plus menacées, avec *k* plafonné pour rester lisible sur 7 zones ; sinon la mesure sature à 6 joueurs.
  - « Chaque peuple compte » se mesure par l'apport du dernier peuple ajouté : une table de *n* bat sa meilleure sous-table de *n* − 1.
  - Shapley, aucun spectateur et pire table se calculent à chaque taille.
- **Compositions échantillonnées.** Il existe 15 duos, 20 trios, 15 quatuors, 6 quintettes et 1 table de six. Le glouton les joue toutes, puisqu'il ne coûte presque rien. Le bot fort joue un échantillon équilibré par peuple (par exemple 15, 6, 6, 6 et 1) en course d'élimination.
- **Recherche en deux temps.**
  1. Les paramètres communs sont explorés en même temps que des formules simples pour les paramètres de table.
  2. Une fois les paramètres communs fixés, chaque taille de table est réglée à part sur ses seuls paramètres, ce qui ajoute peu de calcul.
- **Coût.** Une partie à 6 joueurs coûte environ 4 à 5 fois une partie de duo au bot fort (estimation, à mesurer à l'étape 0.10). Les lots sont équilibrés par coût estimé (section 4).
- **Rapport.** Chaque objectif est présenté par taille de table, et l'alerte de conception s'applique taille par taille.
- **Livret.** Les règles propres au nombre de joueurs tiendront dans un petit tableau. Sa taille maximale est à fixer par l'auteur (section 9).

## 8. Améliorer la méthode (souhait 6)
| Domaine | Aujourd'hui | Amélioration | Quand |
|---|---|---|---|
| **Fonctions d'évaluation** | quatre objectifs, bandes gelées ; dilemmes et coordination fragiles | durée en premier objectif au cycle 1 (jamais un filtre éliminatoire, décision de la phase 0) ; deux mesures nouvelles (choix morts, apprentissage du Méchant) ; dilemmes recalibrés sur un témoin qui réussit | 0.5, 0.6, 0.11 |
| **Méthode de test** | 4 parties par table, marges de 3 à 4 points non appariées | graines appariées et intervalles par rééchantillonnage ; course d'élimination (plus de parties seulement là où l'écart est serré) ; ancre rejouée à chaque nouveau protocole ; verdict comparé entre deux bots | 0.3, étapes d et e |
| **Méthode de sélection** | choix manuel sur tableau | rapport à front de Pareto (aucune variante meilleure partout) en plus du score minimal, pour que l'auteur voie les compromis | 0.10 |
| **Algorithme génétique** | MAP-Elites prévu, étalon au hasard (décision 4) | mutation adaptée au type de variable (pas pour les nombres, saut pour les choix), croisement entre élites voisines, arrêt quand le score de la carte stagne 3 générations ; axes choisis par Claude après le criblage, parmi les variables les plus influentes | 0.9 |
| **Bots** | MC 64 à un coup, stratégie de rêve écrite à la main | bot à portefeuille ; bot de contrôle ; à la validation, bot bruité (Nadia) et bot unique qui pilote plusieurs peuples (Thomas) | 0.7, 0.8, validation |

## 9. Qui décide quoi (souhait 7)
**Claude tranche seul**, applique la recommandation qu'il aurait proposée et l'inscrit au journal d'ETAT.md :
- outils, code, workflows, organisation des calculs, budgets ;
- calibrage des mesures et de leurs témoins, seuils techniques (comme ceux des dilemmes), étiquettes ;
- axes de la carte, variables retenues après le criblage, nombre de générations ;
- choix des bots ;
- ordre des travaux.

**L'auteur tranche** (une question à la fois, avec la recommandation de Claude) :
- toute **règle nouvelle** ou toute **forme** de règle, par exemple un prix supplémentaire du rêve ;
- l'**adoption de chaque version** V0.4, V0.5, V0.6 ;
- les **invariants** et les **bandes des objectifs** (gelées, B1) ;
- les réponses aux **alertes de conception** ;
- le **gel de la V1.0** et le protocole des tests humains.

## 10. La validation et la V1.0
1. **Validation de la candidate.** Toutes les tailles de table, de 2 à 6 joueurs, et toutes les compositions, plus de parties (marge visée de ± 2 points), bot fort et bot de contrôle, ablation de chaque changement depuis la V0.3, lecture par profil (catalogue, section 6).
2. **Le livret de règles V1.0** et les **fiches à imprimer** : mise en place, aide de jeu par peuple, résumé du tour.
3. **Le kit de test humain** :
   - un protocole : nombre de tables, compositions, durée ;
   - une fiche d'observation, pour la durée réelle, les moments de discussion et les hésitations ;
   - un court questionnaire, centré sur les mesures étiquetées « humain seulement » : clarté des règles, qualité de la discussion, sentiment d'avoir battu quelque chose d'intelligent, beauté du thème, temps d'explication.
4. **Décision de l'auteur** : gel de la V1.0. Les retours des tests humains ouvrent ensuite la V1.1.

## 11. Ce que ce plan ne fait pas
- Il ne rejoue pas la V0.2 : elle reste un étalon figé, citée pour contraste.
- Il ne remplace pas les tests humains : la simulation propose, l'auteur décide, les humains jugent l'expérience.
- Il ne change aucune règle sans l'accord de l'auteur, y compris pour corriger une alerte.
- Il n'élargit pas la recherche aux idées verrouillées de l'atelier (A6, A7, B5).

## Sources
- `ETAT.md` (sections 2, 8 et 9) ; `projet/4-bilans/diagnostic-v1-options-v2.md` ; `projet/3-pilotage/objectifs-invariants-catalogue.md` (sections 4 et 5) ; `maquettes/v2.json`.
- Limites de GitHub Actions : [Actions limits, GitHub Docs](https://docs.github.com/en/actions/reference/limits). Pour le déclenchement par `GITHUB_TOKEN` : documentation GitHub « Triggering a workflow from a workflow ».
