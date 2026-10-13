# Ligne de base du protocole P2 : la V0.3 de 2 à 6 joueurs (étape 0.11)

*13 oct. 2026, 16 h 30. Livrable de l'étape 0.11 du [plan vers la V1](../3-pilotage/plan-vers-v1.md). Campagnes 16 (`ligne_base_p2`, 544 parties, 48 min) et 17 (`ligne_base_p2_v02`, 108 parties) ; branche `resultats`, `campagnes/ligne_base_p2_run16` et `ligne_base_p2_v02_run17` ; script `scripts/analyse_ligne_base.py`. Bot fort : MC 64 chacun pour soi dont les suites rêvent une carte par tour (MC64R). Échantillon : 6 duos, 4 trios, 3 quatuors, 2 quintettes, la table de six ; 4 parties par table, graines appariées. Toutes les valeurs sont des **indices** (4 parties par table, 4 à 24 parties par taille).*

## En bref
- **Les lunes font l'essentiel à 4 joueurs et plus, presque rien à 2 et 3.** Avec 2 lunes (V0.3), aucune partie à 4, 5 ou 6 joueurs ne finit avant la mi-partie, et elles vont aux tours 5 à 6. Sans lunes, la table de six finit au tour 1. Mais à 2 et 3 joueurs, 54 à 56 % des parties finissent encore avant la mi-partie (rouge au-dessus de 40 %) : 2 lunes ne limitent rien quand on est deux. La règle « lunes selon la taille de la table » (accord du 13 oct.) vise exactement ce point.
- **Le jeu est trop facile pour le bot fort, à toutes les tailles** : 90 à 99 % de la forêt gardée (profil Jean-Marc : 75 % au plus ; cible provisoire du cycle : 50 à 80 %). Le cycle 1 cherche aussi à durcir le Méchant (ordres par étape, Machines en jeu).
- **Le bot à portefeuille n'est pas validé** : −1,6 point face à MC64R (intervalle −4,1 à +0,7, apparié, 64 paires), et il ne découvre pas de rythme de rêve net (V0.3 : « rêve 0 » et « rêve 1 » à parts presque égales). **Décision technique : MC64R reste le bot fort du cycle 1** ; le bot à portefeuille sert de bot de contrôle (256 suites), là où il apporte une stratégie différente.
- **L'apprentissage du Méchant pèse peu** : 1,7 point de forêt (sûr ; orange, vert à 5). Le témoin à une seule tactique donne moins (0,6, incertain), comme attendu.
- **La communication ne sert à rien au bot fort en V0.3** : aucun signe 89,9 %, traces 90,5 %, tout dire 90,5 % ; chef unique +0,7 % (rouge). L'alerte C du plan (« solitaire à plusieurs ») se confirme pour les bots ; elle reste à juger avec des humains.
- **Choix morts en V0.3** : seul Voler (oiseaux) est presque jamais pris (3 %) ; Se fondre est limite (5 %). Saboter est pris 32 % des fois offert : vivant pour ce bot.

## 1. La V0.3 par taille de table (MC64R)

| Joueurs | Forêt | Tour moyen de fin | Fins avant la mi-partie | Fins (réveil / sommeil / nuit) |
|---|---|---|---|---|
| 2 | 90 % | 3,8 | 54 % (rouge) | 16 / 6 / 2 |
| 3 | 96 % | 3,8 | 56 % (rouge) | 0 / 15 / 1 |
| 4 | 92 % | 5,1 | 0 % (vert) | 0 / 7 / 5 |
| 5 | 93 % | 5,8 | 0 % (vert) | 0 / 1 / 7 |
| 6 | 99 % | 6,0 | 0 % (vert) | 0 / 1 / 3 |

« Sans lunes » (« V2 proposée ») : 92 % et 81 % de fins avant la mi-partie à 2 et 3 joueurs, 25 % à 4 et 5, 100 % à 6 (fin au tour 1). Les lunes ralentissent donc fortement les grandes tables, et la V0.3 a réglé la durée à partir de 4 joueurs. Ce n'était pas visible au diagnostic, mesuré sur des duos seulement.

## 2. Les bots
- **MCP64 contre MC64R (V0.3)** : 87 / 95 / 94 / 93 / 92 % contre 90 / 96 / 92 / 93 / 99 % de 2 à 6 joueurs ; écart apparié −1,6 point, incertain. Politiques choisies par tour : rêve 0 (9,4 par partie), rêve 1 (7,6), rêve 0,5 (2,3), voies imposées (0,6).
- **Témoin V0.2** : MCP64 − MC64 = −1,6 point (incertain) ; il choisit rêve 0 et rêve 1 à parts presque égales. *Le témoin était mal posé* : en V0.2, le diagnostic avait montré que les taux de rêve font jeu égal pour le bot fort ; un choix sans préférence est donc cohérent.
- **Lecture (supposé)** : choisir une politique par tour avec 12 suites par politique est trop bruité pour départager des politiques proches, et coûte des suites qui manquent ensuite à la décision. Piste pour plus tard : un portefeuille par partie plutôt que par tour, ou plus de suites. Pas prioritaire.

## 3. Les mesures nouvelles et leurs témoins
| Mesure | V0.3 | Témoin | Résultat du témoin |
|---|---|---|---|
| Gain d'apprentissage du Méchant | +1,7 point (sûr) : orange | une seule tactique : gain plus petit | **réussi** : +0,6 (incertain) |
| Choix morts | 1 (Voler) : orange | V0.2, mammifères sans pouvoir : Tenir et Renverser morts | **partiel** : Renverser détecté (0 %) ; Tenir non, car, ses deux moitiés étant sans pouvoir, le bot en garde une par défaut ; l'interdire revient à jouer l'autre (−5 points, incertain). Témoin à refaire avec un seul pouvoir retiré |

Les deux mesures restent des **indices**.

## 4. Coordination et chef unique (duos, MC64R qui annonce)
- Part récupérée : non mesurable (l'écart entre « aucun signe » et « tout dire » n'est que de 0,6 point).
- Chef unique : +0,7 % ± 3,6 (rouge, bande verte 5 à 20 %).
- La coordination de la V0.2 (7 %) est réétiquetée « humain seulement » : le moteur n'y joue pas le conseil parlé.

## 5. Décisions techniques (règle de décision du 13 oct.)
1. Bot fort du cycle 1 : **MC64R** (`cycles/c1.json`, inchangé). Bot de contrôle : le bot à portefeuille à 256 suites.
2. Coût d'une partie de MC64R mesuré : 228 secondes-cœur en moyenne sur l'échantillon (1 cœur ; les tables de 5 et 6 coûtent le plus). Le modèle de durée de `foret/cycle.py` est recalé (150 s pour un duo).
3. Le cycle 1 est lancé tel que prévu : criblage sur les 13 variables, avec la durée à 2 et 3 joueurs et la difficulté comme cibles.

## 6. À signaler à l'auteur
- **Difficulté** : le jeu est trop facile pour le bot fort (90 à 99 %). Le cycle vise 50 à 80 % de forêt gardée (choix provisoire de Claude, à partir du profil Jean-Marc et du plancher de 40 %). C'est une cible de conception : l'auteur peut la changer.
- **Alerte C confirmée pour les bots** : la communication et le chef unique ne valent rien au bot fort en V0.3. Rien à faire en simulation ; à observer en test humain.
