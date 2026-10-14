# Batterie d'évaluation : les mesures (moteur 1.7)

*Bandes définitives depuis le 12 oct. (décisions B1 à B4 de l'auteur, fin de la phase 1) : les bandes provisoires de la phase 0 sont gelées, sauf la synergie, redéfinie (B2).*

Ce document décrit les mesures que calcule le moteur (`foret/mesures.py`, `foret/batterie.py`), comment elles sont calculées, et les variantes témoins qui servent à les valider. Les bandes provisoires viennent de « Objectifs, invariants et catalogue » (section 2). Contrôle : `python -m foret.conformite --mesures` (chaque mesure a un renvoi dans le code, un test et, si elle juge, un témoin).

## Étiquettes
- **mesure** : calculée directement sur les parties, sans modèle de joueur au-delà du bot qui joue.
- **indice** : dépend d'un modèle (temps par décision, bot qui communique…). À confirmer par des humains.
- **humain seulement** : hors de portée de la simulation.

**Avertissement.** En phase 1, tout est joué par le glouton. Une mesure qui dépend du jeu des joueurs (presque toutes) décrit donc aussi le glouton. Les verdicts sont des *indices sur le jeu* tant que le bot fort (phase 2) ne les a pas refaits.

## Population et protocole
- **Configuration** : une maquette, une variante, un bot (le même à tous les sièges).
- **Population de référence** : les 15 duos et les 20 trios des six peuples, N parties chacun (60 pour la v1 et la v2, 30 pour les témoins), graines 0 à N-1 (mêmes dés d'une équipe à l'autre au début de la partie).
- **Équipes** (Shapley, synergies) : les 63 équipes de 1 à 6 peuples, plus « personne » : un peuple joué par le bot inerte, qui ne fait rien. Sa forêt restante (environ 24 %) est la valeur de l'équipe vide v(∅).
- **Résultat** : la forêt restante en % de la forêt initiale (bonus de fin à 0, A12).

## Niveau 1 : jouabilité
| Mesure | Calcul | Étiquette |
|---|---|---|
| Robustesse | Parties plantées (exceptions) et incohérences connues par partie. Vert : zéro. Depuis la décision B4 (moteur 1.5), « voir_trahi » (R6.2) et l'abattage en chemin quand la cible est barrée (R4.3, v1) sont des cas permis, comptés en stats (`voir_detourne`, `coupe_en_chemin_cible_barree`). | mesure |
| Lacunes | Questions que la table se posera (registre `lacunes.py`), par partie. Descriptive. | mesure |
| Couverture | Part des parties où chaque compteur du moteur est non nul (pouvoirs, Tenir, embuscades, oublis, entrées…). Une règle presque jamais appliquée coûte à apprendre pour rien. | indice (dépend du bot) |
| Charge de règles | Départages et cas particuliers que le moteur tranche par partie : égalités de critère, de Machine, de chemin, de rayon, percée sur zone rasée, Représailles sans attaque… | mesure |
| Durée estimée | Modèle de temps (ci-dessous). Jamais un filtre. | indice |
| Attente et densité | Attente : part du temps où un joueur regarde les autres résoudre (décisions prises l'une après l'autre). Densité : décisions non forcées par joueur et par heure estimée. | indice |
| Choix forcés | Part des décisions à une seule option, par type. | indice |

**Modèle de temps** (hypothèses à recaler sur les premiers tests humains, `TEMPS` dans `mesures.py`) : 15 s par décision non forcée, 2 s par décision forcée, 60 s d'ouverture du conseil par tour, 5 s par trace ou jeton, 20 s par étape pour le Méchant (dés, ordre, apprentissage), 5 min de mise en place. Les décisions du conseil (programmer, Voir, traces, partage, lunes) sont simultanées : on compte le joueur le plus lent. Celles de la résolution (aller, agir, embuscade, pouvoirs, voie du rêve, Parler, Tromper) se suivent : on les additionne.

## Objectif 1 : la menace est lisible mais jamais résolue
- **Concentration** (mesure). Avant chaque étape, la menace de chaque zone est l'espérance de forêts abattues par l'ordre à venir, sans compter les barrages (`partie.prevision()` : 11 cases de la piste en v1, 21 paires de dés en v2). On prend la part portée par les *k* zones les plus menacées (*k* = nombre de joueurs), moyenne sur les étapes de la partie. Vert 50 à 80 %, rouge sous 35 % ou au-dessus de 90 %.
- **Surprise** (mesure). Part des ordres tirés dont la tuile n'est pas l'une des deux plus probables au moment du tirage (ex aequo du deuxième rang compris). En v2, la même part pour la Machine désignée, à titre d'information. Vert 20 à 45 %.
- **Tape-taupe** (indice, bot fort et glouton, étape 3.3). Écart, en points de forêt, entre le bot fort (MC 64 chacun pour soi) et le glouton, qui pare toujours la menace la plus probable (saboter si possible, sinon barrer la zone la plus menacée), pris à son meilleur taux de rêve fixe (0 ; 0,5 ; 1), sur les mêmes tables. Vert ≥ 10 points, rouge < 3. Petit écart : parer au plus probable suffit, les critères du Méchant ne sont pas en tension. Programme `mesures3` : sur les duos (2 parties du bot fort, 4 du glouton par taux) ; le glouton joue aussi les 5 trios, pour comparer aux tables du plan réduit.

## Objectif 2 : défendre ou rêver reste un dilemme
- **Meilleur taux de rêve fixe** (indice). Le glouton à taux fixes (0 ; 0,25 ; 0,5 ; 0,75 ; 1 carte par tour, la limite des maquettes ; 0 à 3 sans limite), duos et trios. En v2, aussi par voie (sommeil seul, réveil seul). Rouge si le meilleur taux est 0 ou le plus haut permis.
- **Gain du bot libre** (indice, bot fort, étape 3.3). 100 (libre − meilleur fixe) / meilleur fixe : le bot fort libre contre le même bot à taux de rêve fixe (0 ; 0,5 ; 1, réglage `reves_par_tour` du bot MC), sur les mêmes tables. Vert ≥ 5 %, rouge < 1 %. Calculé dans le plan réduit (« tables » contre « reves ») et sur le témoin sans rêve.
- **Dilemmes** (indice, bot fort, sur échantillon, étape 3.3). Le bot MC juge en entier une décision cherchée sur quatre (réglage `juger` = 0,25) : chaque option est estimée par 16 suites, sur les mêmes hasards (forêt finale moyenne, en %). Classement (`classer_decision`) : *forcée* (une option) ; *indifférente* (la meilleure et la pire à moins de 3 points) ; *dilemme* (au moins deux options à moins de 1 point de la meilleure) ; *évidente* (sinon). Part des dilemmes parmi les décisions non forcées, hors mise en place et hors traces et partage (13 oct. : sans le réglage `annonces`, le bot ne lit pas les annonces dans ses suites, toutes leurs options se valent) ; détail par type de décision. Vert ≥ 30 %, rouge < 10 %. **Les seuils de 1 et 3 points sont provisoires** (13 oct.) : à confirmer par l'auteur au vu des premiers résultats. Programme `mesures3` : les 15 duos, 2 parties.

## Objectif 3 : chaque peuple compte, aucun ne suffit
- **Shapley** (mesure, avec ce bot). Valeur de Shapley exacte à partir des 64 valeurs d'équipe ; rapport de chaque peuple à la moyenne. Intervalle à 95 % par rééchantillonnage des parties (200 tirages). Vert : tous entre 0,7 et 1,3 ; rouge : un hors de 0,5 à 1,5.
- **Synergies** (mesure, décision B2). Le jeu s'adapte au nombre de joueurs : un peuple seul garde déjà l'essentiel de la forêt, et la synergie additive v(i, j) − v(i) − v(j) + v(∅) est négative par construction (elle reste affichée à titre d'information). « Aucun ne suffit » : nombre de duos qui gardent plus de forêt que le meilleur de leurs deux peuples joué seul. Vert ≥ 12 sur 15, rouge < 8. Le tétraèdre : synergie relative entre duos, v(i, j) − v̄i − v̄j + v̄ (v̄i : moyenne des duos de i) ; les trois duos complets (oiseaux-insectes, mammifères-humains, reptiles-entités) doivent être parmi les 5 premiers.
- **Pire table** (mesure). Forêt de la pire équipe / celle de la meilleure, parmi les duos et parmi les trios ; on garde le plus faible des deux rapports. Vert ≥ 70 %.
- **Aucun spectateur** (indice, décision B3). Pour chaque duo et trio, un siège est tenu par le bot inerte, qui ne fait rien ; l'impact d'un peuple est la perte moyenne de forêt. Rapport à l'impact moyen. Vert : chaque peuple ≥ 0,5. Le remplacement par le bot aléatoire (prévu par le plan) reste affiché pour information : ce bot rêve, ce qui rapporte en soi.
- **Coordination** (indice). Mêmes tables avec la communication « aucun signe », celle de la maquette (conseil parlé en v1, traces en v2) et « tout dire ». Part de l'écart récupérée = (forme − aucun signe) / (tout dire − aucun signe). Calculée seulement si l'écart est positif et plus grand que sa marge à 95 % ; sinon « non mesurable avec ce bot ». Le glouton y joue en « annonce » (il annonce sans lire) et en « complet » (il s'appuie sur les annonces des autres).
- **Chef unique** (indice, bot fort, étape 3.3). 100 (central − chacun pour soi) / chacun pour soi : le bot MC 64 qui voit tout et décide pour tous, contre le même bot qui ne sait que ce que sait son siège, annonce ses intentions et lit celles des autres, avec la communication de la maquette. Vert 5 à 20 %, rouge < 2 % (solitaire à plusieurs) ou > 35 % (effet leader). Calculé sur la campagne `coordination_mc_2` (`chef_depuis_synthese`, résumé de la campagne), avec la part de l'écart récupérée (`coordination_depuis_synthese`). Témoin : avec « tout dire », chacun pour soi sait tout ce que sait le chef, le gain doit être rouge.

## Objectif 4 : la bataille se joue jusqu'au dénouement
- **Partie jouée d'avance** (mesure, avec ce bot). Sur les duos (8 parties par duo), au début du tour 3, 16 copies de la partie sont jouées jusqu'au bout avec un autre hasard ; leur moyenne prédit l'issue. Exactitude équilibrée de la règle « prédiction au-dessus de la médiane des issues » ; AUC donnée en plus. Une partie finie avant le tour 3 est prédite exactement. Vert < 65 %, rouge > 80 %.
- **Incertitude restante** (mesure). Variance des issues des 16 copies jouées depuis le début du tour 5 (0 si la partie est déjà finie), rapportée à la variance des issues d'un même duo d'une partie à l'autre. Vert ≥ 0,5, rouge < 0,25.
- **Fins avant la mi-partie** (mesure). Part des parties finies par le sommeil, le silence ou le réveil aux tours 1 à 3. Vert ≤ 20 %, rouge > 40 %.
- **Menace croissante** (mesure). Sur les parties qui atteignent le tour 5 : ordres réussis par étape, et Machines en marche par étape, aux tours 5-6 rapportés aux tours 1-2 ; on garde le plus faible des deux rapports. Vert ≥ 1, rouge < 2/3. La part des parties qui atteignent le tour 5 est donnée à côté : si elle est faible, la mesure porte sur peu de parties.

## Garde-fou et lecture
- **Plancher** (mesure). Forêt moyenne du pire dixième des parties. Vert ≥ 40 %, rouge < 25 %.
- **Échelle des bots** (mesure). Aléatoire < glouton, écart significatif. Les marches MCTS viendront en phase 2.
- **Équilibre des fins** (lecture). Part de chaque fin.
- **Tactiques et Machines** (lecture). Part des ordres, part réussie, forêts abattues par ordre, par tactique et (v2) par Machine.
- **Le Méchant apprend-il cette équipe ?** (lecture, niveau 3). Distance (cases différentes) entre pistes finales de deux équipes différentes, moins celle entre deux parties de la même équipe.

## Le plan réduit de la phase 3 (bot fort, moteur 1.7)
Décisions de l'auteur du 13 oct. : bot de référence MC 64 chacun pour soi ; 15 duos et 5 trios, 4 parties par table. `python -m foret.batterie phase3` (par lots : `--lot i/n`, puis `--fusionner`) ; sur GitHub, workflow Batterie avec `programme = phase3`. Configurations `p3_v1` et `p3_v2` (`PLAN3` dans `foret/batterie.py`), 338 parties chacune :
- **tables** : les 6 peuples seuls, les 15 duos, 5 trios, et « personne » (bot inerte) ; 4 parties par table. Les trios sont les 4 « triangles » (oiseaux-reptiles-humains, mammifères-reptiles-insectes, oiseaux-mammifères-entités, insectes-humains-entités : un compartiment sans spécialiste) et une « étoile » (oiseaux-humains-entités : le compartiment du Méchant) ;
- **sondes** (prédictibilité, incertitude) sur 2 parties par duo, mais les 16 copies sont jouées par le glouton (`Sondeur(politique=...)`) : elles prédisent l'issue d'une partie que le bot fort a menée jusqu'au tour 2 ou 5, continuée par le glouton. C'est une approximation, à lire comme telle ;
- **siège spectateur** : chaque siège des duos et des trios tenu à son tour par le bot inerte, 2 parties ;
- **taux de rêve fixes** : 0 ; 0,5 ; 1 carte par tour (`reves_par_tour` du bot MC), duos et trios, 2 parties.
- **Shapley restreint** (`shapley_restreint`) : sans les équipes de 4 à 6 peuples, la valeur de Shapley est remplacée par celle du jeu arrêté aux tables de deux, φ_i = ½ [v(i) − v(∅)] + ½ moyenne_j [v(i, j) − v(j)]. Elle coïncide avec Shapley quand les tables plus grandes n'ajoutent rien de propre à chaque peuple. Les bandes restent celles de Shapley ; le rapport l'indique (`methode`). Les synergies (B2) et le tétraèdre ne demandent que les seuls et les duos : inchangés.
- Ni coordination ni échelle des bots : elles ont leurs campagnes (`coordination_mc_2`, `echelle_bots`).
- Coût estimé : environ 4 heures-cœur pour la v1 et 10 pour la V2 (moteur 1.7).

## Les mesures du bot fort (programme mesures3, étape 3.3)
`python -m foret.batterie mesures3` (par lots comme les autres ; sur GitHub, workflow Batterie avec `programme = mesures3`). Configurations (`PLAN_M3`), 1 020 parties :
- `m3_v1`, `m3_v2` : le bot fort libre sur les duos (2 parties), le glouton à taux fixes sur les duos et les 5 trios (4 parties) pour le tape-taupe, le bot fort qui juge (2 parties par duo) pour les dilemmes ;
- `m3_v1_une_tactique` : témoin du tape-taupe ; la menace est résolue, parer au plus probable doit suffire : écart plus petit que dans la v1 ;
- `m3_v1_sans_reve` : témoin du gain du bot libre (variante `temoin_sans_reve`, aucun rêve programmable) : tous les taux se valent, gain rouge ;
- `m3_v1_essoufflement` : témoin des dilemmes ; le Méchant s'essouffle, on *suppose* que les choix comptent moins : plus de décisions indifférentes que dans la v1. C'est une attente non démontrée : si le témoin rate, on regarde la mesure avant de conclure.
Le chef unique a sa campagne (`coordination_mc_2`). Depuis l'étape 3.3, le workflow publie aussi les parties (`parties.tar.gz`, sauf pour la phase 1) avec le rapport, pour refaire l'analyse sans rejouer.

## Le jeu restreint (étape 3.4)
- **Jeu restreint** (indice, bot fort, lecture du niveau 3 : actions sans intérêt). On interdit une action (Saboter, Barrer, Aller) ou une moitié de carte (donc son pouvoir) à tous les joueurs, et on mesure la forêt perdue par le bot fort par rapport au même bot sans restriction, sur les mêmes duos (4 parties par duo, graines appariées). Perte nulle : l'élément est inutile ou remplaçable ; perte énorme : il est indispensable, peut-être dominant. Descriptive (pas de bande) ; la fréquence d'usage se lit dans les compteurs de la référence.
- Moteur : règle `interdits` (liste de « action:<nom> », « aller », « moitie:<pouvoir> », « reve »), appliquée dans `Partie.decider` à tous les joueurs et dans les copies (les suites du bot respectent la restriction). Une décision dont toutes les options seraient interdites reste libre (lacune `interdit_intenable`). Un bot qui choisirait une option interdite est remplacé par la première option permise (compteur `choix_interdit_remplace`).
- Campagnes `jeu_restreint` (v1, MC 64) et `jeu_restreint_v2` (V2, MC 64 dont les suites rêvent) : un bloc « reference », un bloc « actions » (15 duos), un bloc par peuple pour ses deux moitiés (les 5 duos qui le comptent) ; 480 parties chacune. Variantes « interdire:<a>[+<b>] » (`charger`). Lecture : `python scripts/resume_campagne.py <dossier>` (`jeu_restreint_depuis_synthese`).
- Campagne `v2_options_mc` : les 16 variantes de `v2_options` (une option changée à la fois autour de « V2 proposée ») jouées par le bot fort de la V2, 15 duos, 4 parties ; 960 parties.

## Robustesse au bonus de fin (A12, étape 3.5)
Le résultat est la forêt restante, sans bonus de fin (A12) ; la robustesse des conclusions est vérifiée avec un bonus de 10 et 25 % de la forêt initiale pour une fin par un rêve. Campagnes `robustesse_v1` (bot de référence libre et à taux fixes, bonus 0, 10 et 25 %, variantes « regles:bonus_fin=… ») et `robustesse_v2` (les 16 variantes de `v2_options_mc` avec le réglage `bonus` de l'atelier à 10 puis 25), mêmes duos et mêmes graines que les campagnes de référence : comparaisons appariées. Une recommandation qui change avec le bonus est signalée comme fragile.

## Choix morts et gain d'apprentissage du Méchant (plan vers la V1, étapes 0.5 et 0.6)
- **Choix morts** (`choix_morts`, indice, objectif 2 : l'intérêt de tous les choix). L'observateur `Usage` (`foret/observateurs.py`), branché dans toutes les campagnes et la batterie, compte pour chaque élément de choix (action, moitié de carte désignée par son pouvoir, rêve, déplacement, embuscade) les fois où il est offert et pris par une décision non forcée. Un élément est **mort** si le bot fort le prend moins de 5 % des fois offert (au moins 20 occasions), ou si l'interdire ne coûte rien (perte au jeu restreint « négligeable » au sens des statistiques appariées). Bande provisoire (Claude, règle de décision du 13 oct.) : vert aucun, rouge 3 ou plus. Témoin : V0.2 « mammifères sans pouvoir », Tenir et Renverser doivent compter comme morts. Lu au bot fort ; avec le glouton, l'usage décrit surtout sa politique.
- **Gain d'apprentissage du Méchant** (`apprentissage_mechant`, indice, objectif 1). Écart apparié (mêmes tables, mêmes graines) entre le témoin « Méchant qui n'apprend plus » (`temoin_sans_apprentissage`) et la maquette : les points de forêt que l'apprentissage fait gagner au Méchant. Bande provisoire : vert 5 points ou plus, rouge moins de 1 point. Témoin : la V0.3 à une seule tactique doit donner un gain plus petit. La mesure `apprentissage` (distance des pistes) reste descriptive à côté.
- Témoins (ligne de base P2, 13 oct.) : gain d'apprentissage **réussi** (une seule tactique : +0,6 contre +1,7) ; choix morts **partiel** (Renverser détecté, Tenir non : le témoin retire les deux pouvoirs, le bot garde une moitié par défaut ; à refaire avec un seul pouvoir retiré). `projet/4-bilans/ligne-de-base-p2.md`.
- **Coordination de la V0.2** : réétiquetée « humain seulement » (le moteur approche le conseil parlé par des traces non datées).

## Statistiques appariées (plan vers la V1, étape 0.3)
Code : `foret/stats.py` ; tests : `tests/test_stats.py`.
- **Paires.** Deux variantes jouées avec les mêmes peuples, la même graine et le même bot forment une paire : seule la règle changée les distingue. L'écart apparié (variante − référence) annule le hasard commun, si bien que sa marge est bien plus étroite que la différence de deux moyennes. Les campagnes jouent déjà des graines appariées ; la synthèse le calcule désormais.
- **Marges.** Intervalle à 95 % par rééchantillonnage (bootstrap percentile, 2 000 tirages, graine fixe : reproductible), sans hypothèse de loi normale. La synthèse donne aussi, pour comparer, la marge qu'on aurait sans apparier.
- **Règle de l'écart sûr.** « Sûr » : l'intervalle exclut 0. « Négligeable » : il tient entièrement dans ± 1 point de forêt. « Incertain » : sinon, et il faut plus de parties. Seuls les écarts « sûrs » fondent une recommandation ; un écart « incertain » est un indice.
- **Référence d'un bloc.** Clé `reference` du bloc, sinon de la campagne, sinon `defaut` si le bloc la joue, sinon sa première variante.
- **Dans la synthèse.** `apparie` (par bloc et par bot : référence et écarts) et `parties_compactes` (une ligne par partie : bloc, variante, bot, peuples, graine, forêt en %, tour, fin, cartes en rêve), qui permettent de réanalyser une campagne sans la rejouer, par exemple par taille de table. Le résumé Markdown affiche les 40 premiers écarts.
- **Pourquoi c'est un gain.** *Supposé, à mesurer sur le premier cycle* : la part de hasard commune aux deux parties d'une paire (dés, mains) est grande dans ce jeu. Sur un témoin synthétique avec une forte variance commune, la marge appariée est plus de 4 fois plus étroite (test).

## Garde-fou « aucune boucle gagnante » (décision C1 de l'auteur, 14 oct. ; lecture seule)
Une action, une suite d'actions répétée ou une convention de table appliquée sans lire le jeu ne doit pas constituer une stratégie gagnante (spécification : `projet/3-pilotage/garde-fou-boucles-gagnantes.md`). Code : `foret/bots/repete.py` (le bot qui applique un script), `foret/boucles.py` (bibliothèque, campagne, analyse), étape `boucles` de `foret/cycle.py`. **Les quatre mesures sont descriptives** (`descriptive=True`, bandes rangées dans `bandes_proposees`) tant que l'auteur n'a pas confirmé les bandes : elles sont rapportées avec la couleur qu'elles auraient, peuvent lever une alerte de conception, mais n'entrent pas dans la qualité d'une variante.
- **Bibliothèque** (`bibliotheque(n)`, 130 stratégies par taille de table) : une action partout (3 ordres de priorité × zone fixe ou zone la plus menacée au départ × moitié Machines ou plateau × rêve 0 ou 1) ; toujours la moitié haute ou basse ; 33 motifs de rêve primitifs de longueur 1 à 3, rêves en début ou en fin de tour ; 6 motifs d'étapes laissées vides ; Tromper toujours ou jamais, voie du réveil ou alternée ; 6 réflexes (ils lisent la menace du moment : ce ne sont pas des boucles ouvertes) ; 10 conventions de table (un seul rêveur, un seul saboteur, relais du rêveur, alliance perpétuelle, barrage et sabotage couplés). Le même script à tous les sièges est aussi la convention « miroir ».
- **Appariement** : la campagne de la bibliothèque reprend les tables, les parties et les graines d'une campagne du bot fort (`python -m foret.boucles campagne --tables-de …`) ; dans un cycle, celles de la dernière manche de confirmation. Les gloutons du cycle (rêve 0, 0,5, 1) jouent dans la même campagne comme réflexe de référence. Le **bot fort de référence** est le plus fort des bots MC qui couvrent les mêmes parties (le chef unique, qui voit tout, est exclu).
- **Écart à la meilleure boucle** [mesure:boucle_gagnante] : forêt du bot fort − forêt de la meilleure stratégie de la bibliothèque, apparié, à chaque taille de table ; on garde la pire taille. Proposé : vert ≥ 10 points, rouge < 3.
- **Aucune convention de table ne suffit** [mesure:convention_table] : même écart pour la meilleure convention, composition par composition ; on garde la pire. Avec 4 à 8 parties par composition, le minimum est biaisé vers le bas : à lire comme un signal, pas comme un verdict.
- **Une action ne suffit pas** [mesure:action_suffit] : la meilleure stratégie « X partout » (X = saboter, barrer, soutenir en premier), rapportée au bot fort. Proposé : vert si elle garde au plus 90 % de la forêt du bot fort, rouge si elle est à moins de 3 points.
- **Échelle de la lecture** [mesure:echelle_lecture] : marches meilleure boucle ouverte → meilleur réflexe → bot fort. Proposé : vert si chaque marche ≥ 3 points, rouge si une marche < 1 point.
- **Alerte** (lecture seule) : la meilleure boucle, ou la meilleure convention, à moins de 3 points du bot fort.
- À venir (campagne de profondeur) : « répétition punie » (le Méchant qui apprend doit faire payer la répétition, témoin `temoin_sans_apprentissage`), recherche automatique de la meilleure boucle, boucles de règles.

## Témoins
Variantes cassées exprès (préfixe `temoin_`, dans `maquettes/v1.json` et `v2.json`), jamais proposées comme règles :

| Témoin | Ce qu'il casse | Mesures qui doivent le voir |
|---|---|---|
| `temoin_une_tactique` | Les 11 tuiles sont Cupidité | Concentration (rouge), surprise (rouge), tactiques |
| `temoin_des_fixes` | Chaque lancer donne 3 et 4 (règle `des_fixes`) | Prédictibilité, incertitude (rouge) |
| `temoin_sans_apprentissage` | Le Méchant n'apprend plus (règle `apprentissage`) | Apprentissage (distance nulle) |
| `temoin_essoufflement` | v1 : ni Réparer ni Renfort ; v2 : Machine HS désignée sans effet, chantier vide | Menace croissante (rouge) |
| `temoin_assaut` (v1) | Les 5 Machines en jeu dès le départ | Plancher (plus bas) |
| `temoin_hanter_illimite` | Hanter sans limite par tour | Shapley, synergies, pire table |
| `temoin_mammiferes_sans_pouvoir` (v1) | Tenir et Renverser désactivés | Shapley (mammifères sous la moyenne) |
| `temoin_spectateur` (v1) | Humains sans action ni pouvoir | Aucun spectateur (rouge) |
| `retour_v0_reves_illimites` (v1), glouton qui rêve 3 cartes | Limite de rêves retirée | Meilleur taux de rêve (rouge), fins précoces (rouge) |
| `retour_v0_barrage` (v1) | Barrage contourné | Robustesse (incohérence) |
| `sans_pouvoirs` (v1) | Aucun pouvoir | Couverture (pouvoirs à 0 %) |
| `comm_aucun_signe`, `comm_tout_dire` | Les deux bouts de l'échelle de communication | Coordination ; chef unique (rouge avec « tout dire ») |
| `temoin_sans_reve` (v1) | Aucun rêve programmable (limite de rêves à 0) | Gain du bot libre (rouge) |

Un témoin qui ne tombe pas là où il doit signale une mesure à revoir (ou un bot qui ne sait pas exploiter le défaut), pas un seuil à déplacer (A5).

## Relancer
```bash
python -m foret.batterie plan                      # nombre de parties par configuration
python -m foret.batterie phase1                    # tout (reprend les configurations déjà faites)
python -m foret.batterie phase1 --echelle 0.2      # essai
python -m foret.batterie rapport                   # resultats/batterie/rapport.json
python -m foret.batterie phase1 --lot 3/8 --sortie lots/   # le lot 3 sur 8 (une machine par lot)
python -m foret.batterie phase1 --fusionner lots/          # rassemble les lots, puis le rapport
python -m foret.batterie plan --programme mesures3         # les autres programmes : phase3, mesures3
```
Sur GitHub : onglet **Actions** → **Batterie** → **Run workflow** (échelle, nombre de lots, configurations).
