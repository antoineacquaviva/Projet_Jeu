# Journal des décisions

*Journal unique des décisions de l'auteur, du 10 au 14 oct. 2026. Il remplace les tables de décisions qui étaient répétées dans « Objectifs, invariants et catalogue » (§8), « Plan d'action » (§10), « Maquette de conception v2 » (fin), « Moteur de règles v0 » (§6) et « Batterie d'évaluation » (§7). Les décisions les plus récentes et les consignes des passages automatiques restent dans `ETAT.md` du dépôt (§2 et §8) : **en cas d'écart, le dépôt fait foi.** À partir de maintenant, toute nouvelle décision s'écrit ici (une ligne) et, si elle concerne les passages automatiques, dans `ETAT.md` §8.*

*Dernière mise à jour : 14 oct. 2026, 14 h 30.*

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
| 14 oct., 17 h 47 | **Rêve disputé : grille de réglage avant MAP-Elites** : les réglages de la règle (lunes 3 ou 2, cauchemar d'une ou deux cases, un ou deux rêves pour un pas) sont testés sur une grille complète avec le test T3 complet (bot fort, partie entière) ; MAP-Elites seulement ensuite, autour d'une zone où juger rapporte ; bilan `projet/4-bilans/essai-reve-dispute.md` |
| 14 oct., 14 h 10 | Préférence de l'auteur : appliquer dès la phase de sélection (cycles en cours) tout ce qui peut l'être ; le tri est dans `avant-ou-apres-v1.md` |
| 14 oct., 9 h 14 | **Nettoyage du contexte du projet** : archivage (dépôt Git = historique, sinon `claude/archive/`), verdicts validés y compris quatre suppressions, instructions du projet (droits sans confirmation, grouper les validations), index unique et journal unique |

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
- Règles : « Règles de la maquette v1 ».
- Passages automatiques, campagnes, étape suivante : `ETAT.md` (dépôt).
