# Journal des décisions

*Journal unique des décisions de l'auteur, depuis le 10 oct. 2026. Il remplace les tables de décisions qui étaient répétées dans « Objectifs, invariants et catalogue » (§8), « Plan d'action » (§10), « Maquette de conception v2 » (fin), « Moteur de règles v0 » (§6) et « Batterie d'évaluation » (§7). Les décisions les plus récentes et les consignes des passages automatiques restent dans `ETAT.md` du dépôt (§2 et §8) : **en cas d'écart, le dépôt fait foi.** À partir de maintenant, toute nouvelle décision s'écrit ici (une ligne) et, si elle concerne les passages automatiques, dans `ETAT.md` §8.*

*Dernière mise à jour : 18 oct. 2026, 20 h 00. Les documents cités sous `projet/4-bilans/`, `docs/` ou `archive/moteur-foret/foret` qui ne relèvent pas du modèle « placement » sont rangés dans `archive/` depuis le 16 oct. (voir `archive/LISEZMOI.md`).*

## 1. Règles de décision en vigueur
- **Claude tranche seul** (13 oct., 14 h) : les choix techniques (outils, code, workflows, calibrage des mesures et des témoins, seuils techniques, axes de la carte, bots, budgets). Il applique sa recommandation et la consigne ici ou dans `ETAT.md`.
- **L'auteur tranche** : les règles nouvelles et leurs formes, l'adoption de chaque version, les invariants et les bandes, les alertes de conception, le gel de la V1.0.
- **Un défaut que les paramètres ne corrigent pas** est signalé à l'auteur dès qu'il apparaît.
- **Jamais sans accord** (instructions du projet, 14 oct.) : suppression définitive d'un document (par lot validé), modification d'une règle du jeu, adoption d'une version, changement des invariants ou des bandes, publication, message à l'extérieur, dépense, clé d'API.
- **Pas de blocage** : en cas d'ambiguïté, on retient l'hypothèse la plus raisonnable, on la signale en une ligne et on continue ; les demandes de validation sont regroupées en un seul lot, avec une recommandation pour chacune.
- **Organisation des passages** (13 oct.) : un passage n'attend jamais un calcul de plus de 15 minutes ; plafond de 12 passages qui travaillent par semaine ; Sonnet pour les passages courants, Opus pour les analyses de fin de cycle.

## 2. Règles du jeu : décisions du 11 oct. (moteur v0 → v1)
Elles sont intégrées dans « Règles de la maquette v1 ».

| N° | Décision |
|---|---|
| 1 | Barrage : si la Machine ne peut pas faire son pas ou se trouve dans une zone barrée, elle ne fait rien et l'ordre échoue |
| 2 | Échec face à un esprit : la tactique reste en place ; un échec ne fait jamais avancer un esprit |
| 3 | Rêve : au plus un rêve par joueur et par tour ; aucun esprit au départ |
| 4 | Moitié de carte et actions de base : toute carte fait une action de base ; la moitié choisie active la règle brisée |
| 5 | Ordres de chantier : réussite = l'ordre a eu un effet |
| 6 | Obsessions retirées de la maquette (l'idée reste dans la synthèse) |
| 7 | Hanter et embuscade : une fois par tour chacun |
| 8 | Égalités : plateau asymétrique, Machines séparées au départ, règle de départage fixe |
| 9 | Mise en place : piste de départ fixe, présence posée par les joueurs |
| 10 | Fin de partie immédiate |

Précisions de l'audit de conformité : Tenir barre toutes les zones des mammifères ; les mammifères sabotent seuls n'importe quel organe ; les reptiles ne sabotent jamais ; une Machine prise en embuscade reste immobile jusqu'à la fin du tour.

## 3. Phase 0 : cadrer (A1 à A13)

| N° | Date | Question | Décision |
|---|---|---|---|
| A1 | 11 oct. | Règle de passage notes → statuts | 9-10 invariant ; 8 invariant de principe (réglages libres) ; 6-7 libre ; 5 module ; 1-4 libre prioritaire sur une forme, hors recherche sur une piste écartée ; 0 hors recherche ; statut *témoin* ajouté |
| A2 | 11 oct. | La v1 de référence a-t-elle un présage ? | Oui : aligner moteur et règle R2.1 sur le livret ; variante `sans_presage` pour la référence publiée |
| A3 | 11 oct. | Bonus de fin | +10 % pour sommeil et silence. **Remplacée par A12** |
| A4 | 11 oct. | Communication | Volet coordination de l'objectif 3, pas de cinquième objectif |
| A5 | 11 oct. | Méthode des seuils | Bandes provisoires, recalées une fois en fin de phase 1 sur les témoins, puis gelées pour le cycle |
| A6 | 11 oct. | Bandes de l'objectif 1 | Validées telles que proposées |
| A7 | 11 oct. | Bandes de l'objectif 2 | Validées telles que proposées |
| A8 | 11 oct. | Bandes de l'objectif 3 et du volet coordination | Validées telles que proposées |
| A9 | 11 oct. | Bandes de l'objectif 4 et du garde-fou | Validées, avec des fins avant la mi-partie tolérées jusqu'à 20 % (rouge au-dessus de 40 %) |
| A10 | 11 oct. | Rôle et seuils des profils | Lecture seule, seuils proposés |
| A11 | 11 oct. | Réglages fixés | Décisions du 11 oct. = invariants (forme v0 = témoin) ; détails techniques = hors recherche |
| A12 | 12 oct. | Bonus de fin, pour la v1 et la v2 | 0 : le résultat est la forêt restante ; robustesse vérifiée à 10 et 25 %. Tranche aussi D7 |
| A13 | 12 oct. | Place de la v2 dans le plan | La simulation éclaire les décisions ouvertes de la v2 ; l'auteur fixe la v2 ; la recherche de la phase 4 porte sur elle |

Décisions du plan d'action (11-12 oct.) qui ne portent pas de numéro A : ordre des phases (défauts structurels corrigés à la main avant toute recherche) ; algorithme de la phase 4 = MAP-Elites, avec la recherche au hasard comme étalon ; durée = une mesure, jamais un filtre éliminatoire (le garde-fou « 30 min à 1 h » est retiré le 11 oct. au soir) ; calcul = exécuteurs de GitHub Actions dans le dépôt public `Projet_Jeu` (12 oct., volumes raisonnables, pas de lancements en continu, aucune donnée personnelle).

## 4. Phase 1 : batterie d'évaluation (B1 à B4, 12 oct.)

| N° | Question | Décision |
|---|---|---|
| B1 | Bandes définitives (A5) | Les bandes provisoires sont gelées telles quelles pour le cycle, sauf la synergie (B2) |
| B2 | Définition des synergies | La synergie additive est négative par construction. « Aucun ne suffit » : le duo bat son meilleur peuple seul (vert ≥ 12 duos sur 15, rouge < 8) ; tétraèdre : les 3 duos complets dans le premier tiers de la synergie relative |
| B3 | Siège spectateur | Tenu par le bot inerte (il ne fait rien), et non par le bot aléatoire, qui rêve |
| B4 | Deux incohérences du moteur | « voir_trahi » (R6.2) et « barrage_contourne » en v1 (R4.3) deviennent des cas permis, comptés à part ; le barrage contourné reste une incohérence pour le témoin v0. Moteur 1.5 |

## 5. Phase 2 : bots (13 oct.)
1. Bot de référence : MC 64 chacun pour soi ; MC 128 pour les contrôles.
2. Plan réduit de la phase 3 : 15 duos et 5 trios, 4 parties par table.
3. Le bot qui communique est construit en premier.
4. Organisation : un passage n'attend jamais un calcul de plus de 15 minutes ; plafond de 12 passages par semaine.

## 6. Phase 3 : la v2 fixée (D1 à D9, 13 oct., 12 h 57)
L'auteur valide les recommandations du diagnostic. La v2 fixée est « V2 proposée » plus les lunes à toutes les tailles de table. Code d'atelier : `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5|p:`.

| N° | Décision |
|---|---|
| D1 | Plan du Méchant : qui et où |
| D2 | Doublé : le favori (la sixième Machine en réserve) |
| D3 | Représailles = la plus défendue |
| D4 | Machine HS désignée : remorquée au chantier |
| D5 | Le rêve choisit sa voie |
| D6 | Seuil du Cercle : 3 cases par joueur (axe de la phase 4) |
| D7 | Bonus de fin : 0 (voir A12) |
| D8 | Communication : les traces (2 par joueur, numérotées) |
| D9 | Les lunes à toutes les tailles de table, 2 lunes (nombre en axe de la phase 4) |

La phase 4 cherche d'abord à freiner le rêve (seuil du Cercle, nombre de lunes, avance de l'esprit vers le long sommeil, coût d'un rêve), avec la durée comme premier objectif. Point de vigilance : interdire Saboter ne coûte qu'un point en V2 ; le principe « trois façons d'agir » est à revoir quand la durée sera corrigée.

## 7. Plan vers la V1 (13-14 oct.)

| Date | Décision |
|---|---|
| 13 oct., 14 h 04 | Toutes les recommandations du point validées (pistes J1 à J3, T1 à T7). Versions renommées : **V0.1 = v0, V0.2 = v1, V0.3 = v2 fixée**, objectif **V1.0** jouable pour des tests humains. Au plus trois cycles « campagne → version du jeu → version du protocole ». Traitements GitHub autonomes, parallèles, sans blocage ; peu de consommation d'IA ; signalement immédiat des défauts de conception que les paramètres ne corrigent pas |
| 13 oct., 14 h 20 | Alerte A : le prix du rêve est le principe « une carte côté rêve prive d'une action » (R3.6). Pas de prix supplémentaire pour l'instant ; le cycle 1 corrige l'équilibre avec les paramètres existants. Si le criblage ne suffit pas, Claude propose des formes de prix à l'auteur |
| 13 oct., 14 h 27 | Le jeu doit tenir tous ses objectifs à 2, 3, 4, 5 et 6 joueurs ; des règles propres au nombre de joueurs sont acceptées. Qualité = objectif le plus faible à la taille de table la plus faible |
| 13 oct., 14 h 31 | Un seul plateau pour toutes les tailles de table ; au plus 4 éléments propres au nombre de joueurs, dans un petit tableau du livret |
| 13 oct., 14 h 45 | Réveil au bon moment (tâche « réveil » réarmée par chaque passage) ; Sonnet pour les passages courants, Opus pour les analyses de fin de cycle ; consigne des passages dans `ETAT.md` §3 bis |
| 13 oct., 23 h 27 | **V0.4 adoptée** (variante A du bilan du cycle 1) : `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5,A4|p:escalade=5,lunes=3` et `{"regles": {"cercle_par_joueur": {"2": 4, "4": 3}, "machines_en_jeu": 5, "ordres_par_etape": {"2": 1, "4": 2}, "reves_par_pas": 2}}`. Acceptés avec elle : le sablier des rêves, les ordres supplémentaires du Méchant, le module A4 (escalade du soir dès le tour 5). Alerte A levée ; alertes D et E à surveiller au cycle 2 |
| 14 oct., 7 h 55 | **C1 : garde-fou « aucune boucle gagnante »** : une action ou une suite d'actions répétée, y compris à plusieurs joueurs, ne doit pas être une stratégie gagnante. Garde-fou (pas de cinquième objectif), bandes proposées (écart à la meilleure boucle : vert ≥ 10 points, rouge < 3), lecture seule dès le cycle 2. Bandes à confirmer par l'auteur avant qu'elles jugent. Spécification : `garde-fou-boucles-gagnantes.md` (dépôt) |
| 14 oct., 8 h 06 | Claude relit et vérifie, tranche seul les questions ouvertes : garde-fou codé tout de suite ; « Campagne P3 » renommée « Campagne de profondeur » |
| 14 oct., 14 h 10 | **C2 : principes du choix stratégique** : les sept principes de conception et les six règles de méthode de `choix-strategique.md` sont adoptés ; la fiche du choix est un préalable à toute nouvelle règle |
| 14 oct., 14 h 10 | **C3 : profil de Δ et lisibilité** : la mesure des « dilemmes » est remplacée par le profil de Δ (T4) ; la lisibilité (T5) est ajoutée ; lecture seule jusqu'à confirmation des seuils sur leurs témoins |
| 14 oct., 14 h 10 | **C4 : fréquence des mécanismes voulus** (T1) dans le rapport de chaque cycle, alerte sous 0,5 occurrence par partie pour un mécanisme noté 8 ou 9 |
| 14 oct., 17 h 47 | **Rêve disputé : grille de réglage avant MAP-Elites** : les réglages de la règle (lunes 3 ou 2, cauchemar d'une ou deux cases, un ou deux rêves pour un pas) sont testés sur une grille complète avec le test T3 complet (bot fort, partie entière) ; MAP-Elites seulement ensuite, autour d'une zone où juger rapporte ; bilan `archive/conception-v0x/bilans/essai-reve-dispute.md` |
| 14 oct., 14 h 10 | Préférence de l'auteur : appliquer dès la phase de sélection (cycles en cours) tout ce qui peut l'être ; le tri est dans `avant-ou-apres-v1.md` |
| 14 oct., 9 h 14 | **Nettoyage du contexte du projet** : archivage (dépôt Git = historique, sinon `claude/archive/`), verdicts validés y compris quatre suppressions, instructions du projet (droits sans confirmation, grouper les validations), index unique et journal unique |
| 15 oct., 9 h | *Choix technique de Claude* : les témoins de communication « aucun signe » et « tout dire » de `archive/moteur-foret/maquettes/v2.json` ne changent plus que `regles.communication` (ils remplaçaient toute la version chez les descendantes : sans lunes ni escalade, Cercle à 3) ; test `archive/moteur-foret/tests/test_variantes_heritees.py`. Recul sur la démarche et décisions proposées : `prendre-du-recul.md` |
| 15 oct., 9 h 50 | **Recul sur la démarche : oui aux cinq décisions** (cycle 2 suspendu jusqu'à la porte de conception ; somnambule écarté ; « noyau d'abord » ; D1 et D4 d'abord ; jeu humain avant tout code de règle). Demande de l'auteur : une maquette numérique très simplifiée, animée, jouable en humain ou avec des bots expliqués, parties enregistrées. Réponse : noyau N1 (`archive/noyau-n1/regles_noyau.md`, proposition non adoptée) et sa page jouable |
| 15 oct., 17 h | **Recentrage sur la mécanique de base seule ; la calebasse est différée.** L'auteur concentre la conception sur un jeu de déplacement et de placement (Méchant à n actions par hasard contrôlé, Gentil unique à k actions, résolution automatique, t tours, r > 0), étudié par simulation (modèle « placement », `docs/regles_placement.md`) ; pistes, apprentissage, rêve, peuples et communication sont mis de côté. Il juge l'idée du **conseil de la calebasse** très intéressante et en **diffère la conception à plus tard** (`projet/2-maquettes/proposition-conseil-calebasse.md`, registre `projet/1-idees/parties-differees.md`). Aucune règle adoptée. |
| 15 oct., 17 h 50 | **Modèle « placement » : les six recommandations de l'étude 1 sont validées** (hypothèses du modèle ; m = n et m = n + 1 candidates, m = n en tête ; quatre règles porteuses retenues comme contraintes ; seuils de lecture gardés comme indices ; campagne 2 avec l'essai d'*Éclairer* ; maquette jouable après la décision 2). Avant la campagne 2 : réflexion sur la division du Gentil en 1 à 6 joueurs avec des aménagements minimaux (`projet/3-pilotage/nombre-de-joueurs-pistes.md`). Aucune règle du jeu adoptée. |
| 15 oct., 21 h 47 | **Le Gentil réparti : le « kit par joueur » est retenu** comme modèle de la campagne 2 (une tuile 3 × 4 par joueur en couronne autour d'un Cœur ; 2 individus et 1 ordre par joueur ; J + 1 Machines, réglable ; une menace par Machine et par tour, réglable). Feu vert pour la campagne 2. Modèle d'étude : aucune règle du jeu adoptée. `projet/2-maquettes/proposition-gentil-reparti.md` |
| 16 oct., 12 h 37 | **Les deux pistes du Méchant et leur apprentissage sont réintroduits** dans le modèle d'étude (piste des pensées lue par la somme, piste des Machines lue par l'écart, échanges avec une voisine) ; esprits, rêve, peuples et communication restent différés. La forme de la piste des Machines est à étudier en détail avec l'auteur avant tout codage. Proposition en cours d'examen : `projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md`. Aucune règle du jeu adoptée. |
| 16 oct., 13 h 09 | **Verdict de l'apprentissage : partagé.** À chaque menace, parée ou non, les deux tuiles (tactique et Machine) apprennent du même verdict, comme dans l'atelier v2 ; l'auteur privilégie le meilleur apprentissage du Méchant, même quand la Machine est parée. Le verdict ciblé est écarté. Aucune règle du jeu adoptée. |
| 16 oct., 13 h 11 | **Piste des Machines : six cases, une sixième Machine (Zizanie) en case 0**, piste imprimée dans l'ordre des probabilités 1 · 2 · 0 · 3 · 4 · 5 (10, 8, 6, 6, 4, 2 chances sur 36). Le favori, branle-bas et « il hésite » sont écartés. Aucune règle du jeu adoptée. |
| 16 oct., 13 h 23 | **Accord sur toutes les recommandations de la proposition « pistes et deux étapes »** : modèle de la campagne 3 ; le Gentil commence le tour ; min(J + 1, 6) Machines sur le plateau au départ (ordre 1, 2, 3, 4, 5, 0) ; rythme d'apprentissage de la piste des Machines codé à chaque lancer et à la fin de la vague, pour comparaison. Demande d'une maquette jouable qui part de « Forêt en couronne » et ajoute les deux pistes. Aucune règle du jeu adoptée. |
| 16 oct., 16 h 51 | **Rangement du dépôt et des documents du projet** (demande de l'auteur) : garder la ligne active et les pistes encore pertinentes, archiver ce qui n'est plus sur la trajectoire, supprimer le reste par lot validé. *Choix techniques de Claude* : le jeu complet V0.x (moteur `foret`, maquettes, campagnes, cycles, tests, résultats, documentation technique, workflows Batterie, Campagne, Cycle et Surveillance) va dans `archive/moteur-foret/`, exécutable sur place ; plans et bilans V0.x dans `archive/conception-v0x/` ; noyau N1 dans `archive/noyau-n1/` ; le workflow Tests ne teste plus que le modèle « placement » et les maquettes Node ; `ETAT.md` allégé, l'ancien conservé en archive ; dans le projet, les copies périmées du moteur v1 et des maquettes HTML sont proposées à la suppression. Aucune règle du jeu changée. |
| 16 oct., 23 h 12 | **Plan d'action en 6 paliers validé par l'auteur** : Palier 0 (Outil d'évaluation automatisé + Campagne 3 sur le modèle `pistes`) → Palier 1 (Synergie / être à deux sur une Machine & revalorisation du Sabotage) → Palier 2 (Différenciation des 6 Machines : résistance, déplacement, coupe) → Palier 3 (Phase de communication / Conseil de la calebasse) → Palier 4 (Mécanisme du Rêve disputé et fins provoquées) → Palier 5 (Spécialisation des peuples, exceptions aux règles, identité des individus, cartes d'aide en main liées au peuple). *Choix techniques* : correction de la passivité des bots dans `maquettes-numeriques/pistes/bots.js` ; création de `maquettes-numeriques/pistes/campagne.js` et `laboratoire.html` ; exécution de la Campagne 3 (`projet/4-bilans/placement-etude-3-pistes.md`). |
| 17 oct., 11 h 31 | **Résultats de la Campagne 3 et propositions mis en réserve (aucune décision prise sur les règles) ; nouveau besoin exprimé pour la maquette : mode didactique très décomposé.** L'auteur étudiera à part les résultats de la Campagne 3 et les propositions (socle Présage/rythme vague, pistes A/B de Synergie au Palier 1, mode d'exécution hybride local + GitHub Actions, consignés dans `projet/4-bilans/placement-etude-3-pistes.md` et `ETAT.md`). Il demande pour la suite un **mode beaucoup plus didactique sur la maquette** qui montre et explique de manière détaillée toutes les actions, en particulier une phase de résolution très décomposée avec des focus visuels sur les éléments qui s'activent et bougent. |
| 17 oct., 16 h 30 | **Choix de la mécanique de communication 1B (Attaques Croisées et programmation couplée).** Après évaluation comparative et tests de 3 pistes (1A Jetons secrets/présages cachés avec sac, 1B Attaques Croisées et programmation couplée, 1C Signaux/déduction pure sans jetons), l'auteur retient la mécanique **1B**. Motif déterminant : simplicité et ergonomie physique supérieure (évite la lourdeur d'un sac opaque et de manipulations de jetons masqués sur table). Le démonstrateur comparatif est nettoyé. |
| 17–18 oct. | **Refonte didactique de la maquette `pistes.html` et outillage de test d'interface.** Intégration de la mécanique 1B ; séparation spatiale entre tapis de jeu physique (table) et pupitre d'interaction numérique (style BGA) ; résolution en 4 micro-temps pas-à-pas ; simulateur interactif des 5 gestes physiques sur table ; visite guidée (6 étapes) et partie exemple animée (9 scènes). *Choix technique de Claude* : création d'un banc de test automatisé headless (`test_ui.js` pilotant Chrome via DevTools Protocol) pour auditer l'affichage, les superpositions CSS et la géométrie des éléments sans régression. |
| 18 oct., 12 h 30 | **Clarification majeure des deux besoins et priorité au « Besoin 1 » (incarnation physique concrète).** L'auteur recadre la démarche : la maquette précédente mélangeait compréhension et jeu interactif. Deux besoins distincts sont formalisés : **Besoin 1 (prioritaire)** = comprendre le jeu, sa mécanique, l'incarnation physique et les gestes concrets exacts sur le matériel (règle écrite rédigée comme un jeu de société moderne, table de jeu avec matériel physique, animation pas-à-pas rigoureusement cohérente de la mise en place et d'un tour avec focus sur la règle correspondante, conservation stricte des transitions d'état) ; **Besoin 2** = jouer, comprendre les choix et suivre les événements. Les demandes antérieures redeviennent des idées à considérer et non des exigences. Les textes doivent être allégés. |
| 18 oct., 15 h 00 | **Réflexion sur le matériel de tirage des attaques.** L'auteur exprime une réserve sur le couplage somme/différence des deux dés pour déterminer les attaques. Piste technique retenue pour étude : deux paquets de cartes de « Rang » séparés (18 cartes Machine numérotées Case 1..6 et 36 cartes Tactique numérotées Case 2..12) permettant de décorréler totalement le tirage tout en préservant exactement les lois de probabilité marginales triangulaires/décroissantes des pistes imprimées. |
| 18 oct., 22 h 00 | *Choix technique de Claude* : **Infrastructure de calcul Cloud OCI** pour les campagnes de tests intensives (essai 300 $). Mise en place d'une VM haute performance (`141.145.218.127`, VCN dédié `VCN-Tests-Jeu`, clé SSH locale), protocole d'exécution asynchrone `tmux` multi-processus (`--processus $(nproc)`), budget sous alerte automatique et transition prévue vers l'Always Free Ampere A1 (4 cœurs, 24 Go RAM). Fiche de référence consignée dans `docs/infrastructure_calcul.md`. |

## 7 bis. Visuels (14 oct.)
- **Choix techniques de Claude** (14 oct., révision de « Visuels : méthode et techniques », `projet/5-visuels/methode-et-techniques.md`) : aucune image du jeu dans le dépôt public tant que l'auteur ne l'a pas décidé (verser une image ici reviendrait à la publier) ; seuls les documents, la charte, la nomenclature, les scripts et les gabarits vides y vont. Mise en page du prototype par les données : Python + SVG, export PDF de planches et PNG. Les choix de direction artistique restent à l'auteur.

## 8. Annexe : effet de chaque décision du 11 oct. (v1 contre v0)
La maquette v1 a été rejouée en ramenant une seule décision à sa forme v0 (gloutons, 15 duos, 72 000 parties). Écarts par rapport à la v1 :

| Décision ramenée à v0 | Sans rêve : forêt | Un rêve par tour : sommeil, forêt | Ce que ça dit |
|---|---|---|---|
| 1. Barrage contourné | −9 pts | −3 pts de sommeil, −4 pts de forêt | La plus efficace pour la défense : les ordres réussis passent de 47 à 58 % sans elle |
| 2. Échec qui pousse l'esprit | 0 | +5 pts de sommeil | Elle retire les sommeils « par accident » |
| 3a. Rêves illimités (3 par tour) | – | sommeil au tour 1 dans 60 % des parties | Sans la limite, la partie se termine au premier tour |
| 3b. Un esprit au départ | 0 | sommeil 99 %, tour 3,0 au lieu de 3,4 | Le départ sans esprit retarde le sommeil d'un tiers de tour |
| 5. Réussite littérale | 0 | 0 | Sans effet mesurable |
| 7. Hanter et embuscade illimités | +1 pt | 0 | Peu d'effet, le glouton les utilise peu |
| 8. Plateau v0 | −6 pts | −4 pts de forêt | Le plateau v1 divise par 4 les égalités tranchées au numéro |
| 9a. Piste au hasard | +5 pts | +2 pts | La piste fixe est plus dure que la moyenne des tirages |
| 9b. Présence au hasard | +9 pts | 0 | Le glouton place moins bien que le hasard : limite du bot |
| 10. Fin vérifiée en fin de tour | 0 | sommeil 50 %, −14 pts de forêt | La fin immédiate est indispensable dès qu'on rêve |
| Renverser limité aux chenilles | +2 pts, silence 3,6 → 0,1 % | +1 pt | Presque tous les silences viennent du nouveau Renverser |
| Tenir, reptiles, action « soutenir » | 0 | 0 | Non testé : le glouton ne joue jamais Tenir |

## Où sont les détails
- Bandes, invariants, catalogue : `projet/3-pilotage/objectifs-invariants-catalogue.md` (dépôt) et sa copie « Objectifs, invariants et catalogue ».
- Règles du modèle d'étude : `docs/regles_placement.md` ; règles de la maquette v1 (jeu complet, archivées) : `archive/moteur-foret/docs/regles_v1.md`.
- Campagnes, étape suivante, décisions attendues : `ETAT.md` (dépôt) ; l'ancienne consigne des passages automatiques : `archive/conception-v0x/pilotage/ETAT-jusqu-au-16-oct.md`.
