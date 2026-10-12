# Batterie d'évaluation (phase 1)

*Statut (12 oct. 2026) : livrable de la phase 1 du « Plan d'action - évaluer et explorer les variantes par la simulation ». Moteur 1.5. Tableau de bord : artefact « Batterie de la Forêt qui rêve » (https://claude.ai/artifact/9K122xkH4XH7xYodfVAbVG). **Mesures validées et bandes définitives : décisions B1 à B4 de l'auteur, prises le 12 oct. (section 7) ; la batterie a été rejouée avec le moteur 1.5 qui les applique.***
*Sources : « Objectifs, invariants et catalogue » (bandes provisoires, A5 à A10), « Phase 1 - avancement », code et documents du moteur (`claude/moteur-v1/`, en particulier `docs/mesures.md`), rapport brut `claude/moteur-v1/resultats/batterie_phase1_rapport.json`.*

## En bref
- **La batterie existe et elle est validée en grande partie.** 28 mesures sont définies. 24 sont calculées dès maintenant ; 4 attendent le bot fort (tape-taupe, gain du bot libre, dilemmes, chef unique). 21 témoins sur 26 tombent là où ils doivent. Les 5 ratés viennent surtout du glouton, qui n'exploite pas les défauts introduits exprès. Aucun ne demande de déplacer un seuil.
- **Tout a été joué par le glouton : 96 200 parties.** Les verdicts sont des indices sur le jeu, pas des conclusions. Deux styles de glouton sont montrés : il rêve une carte par tour, ou il ne rêve jamais.
- **Le rêve écrase encore la partie, dans la v1 comme dans la V2.** Le meilleur taux de rêve fixe est le maximum permis, une carte par tour. La partie finit entre les tours 2 et 3, et l'issue est jouée dès la fin du tour 2. Côté objectif 4, tout est rouge pour ce glouton.
- **« V2 proposée » corrige une partie de ce que la v1 ratait :**
  - menace moins résolue : 82 à 84 % sur les *k* zones les plus menacées, contre 95 à 98 % ;
  - environ quinze fois moins de départages par partie ;
  - forêt plus haute sans rêve : 77 % contre 69 %.
  
  Elle reste hors de la bande verte pour la concentration (50 à 80 %).
- **Un peuple seul garde déjà l'essentiel de la forêt.** Le jeu s'adapte au nombre de joueurs : seul, un peuple sauve 40 à 88 % de la forêt, contre 23 % quand personne ne joue. La synergie additive de la phase 0 était donc négative par construction. Elle est redéfinie (B2) : un duo compte s'il bat son meilleur peuple joué seul. Verdict : vert pour la v1 avec rêve (15 duos sur 15), orange pour la V2 (11 sur 15), rouge pour la v1 sans rêve (4 sur 15). La prédiction du tétraèdre n'est confirmée nulle part (0 à 2 duos complets sur 3 en tête).
- **Les reptiles pèsent le plus, les insectes le moins.** C'est vrai dans les quatre cas joués. En V2 sans rêve, l'écart tombe dans le rouge (Shapley de 1,74 contre 0,46). Une partie de la faiblesse des insectes vient du glouton : sans rêve, un siège d'insectes qui ne fait rien garde plus de forêt que le glouton qui les joue.
- **La communication n'est pas mesurable avec ce bot.** « Aucun signe » et « tout dire » donnent le même résultat. Le volet coordination attend le bot fort, comme prévu.

## 1. Ce qui a été construit (moteurs 1.4 et 1.5)
- **`foret/mesures.py`**, qui regroupe :
  - le `Mesureur`, qui relève à chaque étape la menace (36 tirages de dés, sans défense), les ordres tirés et leur réussite, les décisions, le temps estimé et la piste finale ;
  - le `Sondeur`, qui joue des copies de la partie avec un autre hasard depuis un point donné ;
  - les fonctions d'agrégation : Shapley exact, synergies, exactitude équilibrée, AUC, bandes ;
  - le registre `MESURES` : l'étiquette, les bandes et les témoins de chaque mesure.
- **`foret/batterie.py`** : le plan de la phase 1. Il compte 20 configurations, chacune faite d'une maquette, d'une variante et d'un bot. Il en tire les expériences suivantes :
  - les 63 équipes, plus « personne » ;
  - le siège spectateur ;
  - les taux de rêve fixes ;
  - la coordination ;
  - l'échelle des bots.
  
  Le module exécute ces expériences en parallèle et produit le rapport. Une expérience déjà jouée n'est pas rejouée.
- **Le bot `inerte`**, qui ne joue rien. Il donne la valeur de l'équipe vide pour Shapley, et le siège spectateur.
- **Les témoins** : les variantes `temoin_*` de la v1 et de la V2, et deux règles de témoin, `des_fixes` (dés truqués) et `apprentissage` (le Méchant n'apprend plus). Ce ne sont jamais des règles du jeu.
- **Le moteur** : les observateurs reçoivent chaque ordre exécuté, et tous les lancers passent par `partie.lancer_des()`. Aucune règle ne change. La référence publiée se rejoue à l'identique, ce que vérifie le test de non-régression sur 192 parties.
- **Contrôles** :
  - 248 tests passés (moteur 1.5) ;
  - conformité de 45 règles v1 sur 45 et des 35 nœuds v2 codés ;
  - `python -m foret.conformite --mesures` : chaque mesure a un renvoi dans le code et un test ; chaque mesure qui juge a un témoin.
- **Le tableau de bord**, avec son gabarit et son script, dans `outils/tableau/`.

## 2. Comment lire les résultats
- **Étiquettes.** Une *mesure* est calculée directement sur les parties. Un *indice* dépend d'un modèle : le temps par décision, ou un bot qui communique.
- **Bot.** Avec le glouton, toute mesure qui dépend du jeu des joueurs décrit aussi le glouton. Le bot fort de la phase 2 refera la batterie.
- **Population.** Les mesures portent sur les 15 duos et les 20 trios, 60 parties par équipe pour la v1 et la V2, et 30 par équipe pour les témoins. Shapley et les synergies utilisent les 63 équipes de 1 à 6 peuples, plus « personne » (un peuple joué par le bot inerte : 23 % de forêt).
- **Résultat.** La forêt restante, sans bonus (A12).
- Définitions complètes : `docs/mesures.md`.

## 3. Les verdicts

| Mesure | Bande verte | v1, rêve | v1, sans rêve | V2, rêve | V2, sans rêve |
|---|---|---|---|---|---|
| Forêt restante (lecture) | – | 88,2 % | 68,7 % | 89,5 % | 76,9 % |
| Robustesse (après B4) | 0 | vert : 0 plantage, 0 incohérence | vert | vert | vert |
| Concentration de la menace | 50-80 % | rouge 97,5 | rouge 94,7 | orange 81,8 | orange 84,0 |
| Surprise | 20-45 % | vert 39,5 | vert 39,3 | vert 37,9 | vert 34,0 |
| Meilleur taux de rêve fixe | intermédiaire | rouge : 1 (le max.) | – | rouge : 1 (le max.) | – |
| Shapley (rapport à la moyenne) | 0,7-1,3 | orange 0,69-1,36 | orange 0,51-1,38 | vert 0,84-1,23 | rouge 0,46-1,74 |
| Synergies (B2) : duos qui battent leur meilleur peuple seul | ≥ 12 sur 15 | vert 15 | rouge 4 | orange 11 | orange 11 |
| Tétraèdre : duos complets dans le premier tiers (B2) | 3 sur 3 | 2 | 0 | 1 | 1 |
| Pire / meilleure table | ≥ 70 % | vert 78,5 | vert 76,9 | vert 85,7 | orange 66,0 |
| Aucun spectateur | ≥ 0,5 | vert 0,77 | rouge (insectes) | vert 0,77 | rouge (insectes) |
| Coordination | 40-80 % | non mesurable | – | non mesurable | – |
| Partie jouée d'avance (tour 2) | < 65 % | rouge 99 | orange 70,6 | rouge 100 | rouge 81,9 |
| Incertitude au dernier tiers | ≥ 0,5 | rouge 0,03 | rouge 0,21 | rouge 0 | orange 0,27 |
| Fins avant la mi-partie | ≤ 20 % | rouge 94 | vert 2 | rouge 100 | vert 0 |
| Menace croissante | ≥ 1 | orange 0,82 (5 % des parties) | orange 0,87 | aucune partie au tour 5 | orange 0,94 |
| Plancher (pire dixième) | ≥ 40 % | vert 61,9 | vert 49,5 | vert 76,7 | vert 55,1 |
| Échelle des bots (aléatoire → glouton) | marche nette | vert 49 → 88 | vert 49 → 69 | vert 50 → 90 | vert 50 → 77 |
| Durée estimée (lecture) | – | 24 min | 52 min | 23 min | 59 min |
| Attente (lecture) | – | 10 % | 21 % | 14 % | 22 % |
| Départages par partie (lecture) | – | 5,8 | 17,5 | 0,4 | 1,0 |

Le taux de rêve fixe et la coordination ne sont joués qu'une fois par maquette, avec le glouton qui rêve. D'où les tirets dans les colonnes sans rêve.

## 4. La validation par les témoins
Les 21 témoins réussis :
- la concentration et la surprise voient le témoin « une seule tactique », en v1 et en V2 ;
- la prédictibilité et l'incertitude voient les dés truqués, en v1 et en V2 ;
- la menace croissante voit le Méchant qui s'essouffle, en V2 : 0,44 ;
- le plancher voit les cinq Machines d'emblée : 44,9 % contre 49,5 % ;
- Shapley voit Hanter sans limite en v1 : les entités passent de 1,05 à 1,60 ;
- le siège spectateur voit les humains sans action : 0,06 ;
- le meilleur taux de rêve et les fins précoces voient les rêves sans limite : la nuit tombe à 4 % ;
- la robustesse voit le barrage contourné de la v0 ;
- la couverture voit l'absence de pouvoirs ;
- la mesure d'apprentissage voit le Méchant qui n'apprend plus : la piste bouge 20 à 30 fois moins.

**Les 5 ratés, et ce qu'ils disent :**
1. **Le Méchant apprend-il cette équipe ?** Le témoin donne 0,17 case, avec ou sans apprentissage. Avec le glouton, les pistes finales ne dépendent pas de l'équipe. Cette partie de la mesure n'est pas validée.
2. **Menace croissante, v1 qui s'essouffle.** Le témoin donne 0,74, contre 0,87 pour la v1 : orange, pas rouge. La mesure va dans le bon sens, mais les parties où toutes les Machines tombent finissent par le silence avant le tour 5 et sortent de la mesure. À revoir.
3. **Shapley, V2 avec Hanter sans limite.** Le verdict est bien rouge, mais à cause des reptiles (1,61), déjà rouges sans le témoin. Les entités montent de 0,73 à 1,29. Le glouton n'utilise pas Hanter à chaque étape.
4. **Shapley, mammifères sans pouvoir.** Les mammifères *montent*, de 0,83 à 1,02. Seuls, ils gardent 69 % de la forêt sans pouvoirs, contre 52 % avec. Le glouton joue Tenir dans moins de 1 % des parties, et Renverser l'entraîne à saboter, ce qui lui coûte de la forêt. C'est un défaut du bot, mais il confirme un constat de la phase 1b : avec ce bot, saboter rapporte moins que barrer.
5. **Pire table, v1 avec Hanter sans limite.** Le résultat est de 72 %, donc vert. Le glouton ne profite pas assez du pouvoir cassé pour creuser l'écart entre tables.

**Un témoin réussi mais peu probant.** Après B2, le témoin des synergies (Hanter sans limite en v1) tombe bien en rouge (4 duos sur 15), mais la v1 sans rêve, sans témoin, donne aussi 4 : il ne distingue rien. Le témoin de robustesse, lui, distingue toujours la v0 (0,88 incohérence par partie) de la v1 (0).

**Révisions faites après le passage des témoins.** Je les signale parce qu'elles ont été décidées en voyant les résultats. Aucune ne touche un seuil :
- **Le siège spectateur.** Le plan remplaçait le siège par le bot aléatoire. Mais ce bot rêve, ce qui rapporte en soi, et son « impact » sortait négatif. Le siège est désormais tenu par le bot inerte, qui ne fait rien. Le remplacement au hasard reste affiché à titre d'information.
- **Le meilleur taux de rêve.** Un optimum « intermédiaire » doit battre les deux taux extrêmes au-delà de la marge à 95 %. Sans cette règle, les rêves sans limite passaient au vert : 2 cartes par tour donnent 91,8 %, 3 cartes 91,2 %, un écart dans le bruit.
- **Toutes les issues égales.** Avec les dés truqués en v1, toutes les parties finissent à 100 % : la prédictibilité n'était pas définie. Elle vaut désormais 100 % quand les copies annoncent l'issue, et l'incertitude vaut 0.
- **Méchant qui n'apprend plus.** L'attente « piste inchangée » était fausse : les esprits la font encore bouger. La mesure attend maintenant une piste qui bouge dix fois moins.

## 5. Ce que disent les mesures (indices du glouton)
**Objectif 1, la menace lisible mais jamais résolue.**
- La v1 concentre presque toute la menace : 95 à 98 % sur les *k* zones les plus menacées.
- La V2 la répartit mieux (82 à 84 %), sans atteindre le vert. L'atelier annonçait 53 % au départ : c'était un calcul sans défense. Avec la présence posée, Opportunisme vise ailleurs et le départ monte à 80 %.
- La surprise est saine partout, entre 34 et 40 %.
- En V2, Représailles (« la plus défendue ») est la tactique la moins efficace : 45 à 50 % des ordres réussissent, contre 77 à 81 % pour Opportunisme.
- Les Machines du chantier (Tonton Débard, Ripaille) abattent peu, 0,1 forêt par ordre : leurs premiers ordres servent à entrer.

**Objectif 2, défendre ou rêver.**
- Le rêve domine dans les deux maquettes.
- Taux de rêve 0, puis 1 carte par tour : de 68 à 88 % en v1, de 78 à 90 % en V2.
- En V2, les deux voies se valent : sommeil seul 89,0 %, réveil seul 86,8 %.

C'est le constat du 11 oct., confirmé pour la V2. Les leviers prévus par le document de conception sont le seuil du Cercle, la limite et le coût des rêves. Ce sont des décisions de la phase 3.

**Objectif 3, chaque peuple compte, aucun ne suffit.**
- Le jeu s'adapte au nombre de joueurs. Seul, un peuple garde 40 à 88 % de la forêt selon le peuple et le bot. Chaque peuple ajouté apporte peu : en v1 sans rêve, on passe de 65 % pour un peuple à 77 % pour six.
- La synergie redéfinie (B2), « le duo bat son meilleur peuple seul », donne 15 duos sur 15 en v1 avec rêve, 4 en v1 sans rêve, 11 en V2. Sans rêve, en v1, la plupart des duos font moins bien que leur meilleur peuple seul : un peuple fort (les reptiles) suffit presque.
- La synergie relative entre duos ne met jamais les trois duos complets du tétraèdre en tête (0 à 2 sur 3) : la prédiction du tétraèdre n'est pas confirmée avec ce bot.
- Les reptiles sont en tête partout. Seuls, ils gardent 79 à 88 % de la forêt sans rêve.
- Les insectes sont en queue. Le pire duo est insectes-mammifères en v1, entités-insectes en V2.

**Objectif 4, la bataille jusqu'au dénouement.**
- Avec le glouton qui rêve, tout est joué à la fin du tour 2.
- Sans rêve, les parties vont au bout. Pourtant, l'issue est déjà prévisible à 71 % (v1) et 82 % (V2) à la fin du tour 2, et l'incertitude restante au début du dernier tiers n'est plus que le quart de l'incertitude initiale.
- La menace ne croît pas : rapport de 0,87 à 0,94. Les Machines ne montent pas en puissance au fil de la partie.

**Garde-fou.**
- Le plancher est sain partout, entre 50 et 77 %.
- Le glouton bat nettement l'aléatoire, de 20 à 40 points.

**Jouabilité.**
- Aucune partie plantée.
- La V2 est bien plus simple à arbitrer. Elle a 0,4 à 1 départage par partie, contre 6 à 17 en v1, où les égalités entre Machines et entre zones se tranchent à la table.
- Durée estimée : environ 55 minutes pour une partie de six tours, environ 24 minutes quand le rêve l'abrège. C'est un indice, avec 15 s par décision.
- Quelques règles ne s'appliquent presque jamais avec ce bot : Tenir (0 à 1 % des parties en v1), et Hanter et Égarer quand le glouton rêve (1 à 3 %).

## 6. Ce qui attend le bot fort (phase 2)
- **Les mesures en attente :** tape-taupe, gain du bot libre, dilemmes, chef unique.
- **Le volet coordination :** avec le glouton, l'écart entre « aucun signe » et « tout dire » est nul.
- **Les mesures non validées :**
  - « le Méchant apprend cette équipe » ;
  - la menace croissante face au témoin v1, qui reste orange ;
  - le siège spectateur sans rêve, que fausse le glouton qui joue mal les insectes.
- **La reprise de toute la batterie** avec le bot fort, puis la comparaison des verdicts. Une mesure qui change de verdict d'un bot à l'autre décrit les bots, pas le jeu (plan, section 3.6).
- **Le choix de l'environnement de calcul**, avant les grosses campagnes : voir le « Cahier des charges - environnement de calcul cloud ». La batterie complète a pris environ 35 minutes sur 2 cœurs avec le glouton. Avec un MCTS, il faudra un autre ordre de grandeur.

## 7. Décisions de l'auteur (12 oct.)
Posées une par une ; l'auteur a suivi les quatre recommandations.
- **B1. Les bandes définitives (A5).** Aucun raté ne demandait de déplacer un seuil. **Décision : les bandes provisoires sont gelées telles quelles pour tout le cycle, sauf la synergie (B2).**
- **B2. La définition des synergies.** La synergie additive est négative par construction dans un jeu qui s'adapte au nombre de joueurs. **Décision : « aucun ne suffit » se mesure par « le duo bat son meilleur peuple seul » (vert : au moins 12 duos sur 15 ; rouge : moins de 8) ; le tétraèdre se teste par la synergie relative entre duos (vert : les trois duos complets dans le premier tiers).**
- **B3. Le siège spectateur.** **Décision : le siège est tenu par le bot inerte, qui ne fait rien, à la place du bot aléatoire prévu par le plan, parce que ce dernier rêve.**
- **B4. Deux incohérences du moteur.**
  - « voir_trahi » : un rêve change la tuile qu'un oiseau a vue avant l'ordre.
  - « barrage_contourne » en v1 : la Machine, encore à deux pas, abat en chemin alors que sa cible est barrée.
  
  Les règles écrites semblent permettre les deux : R6.2 garde les dés, pas la tuile, et R4.3 fait abattre là où la Machine s'arrête. **Décision : les deux deviennent des cas permis, comptés à part (`voir_detourne`, `coupe_en_chemin_cible_barree`), comme le présage détourné ; le barrage contourné reste une incohérence pour le témoin v0. R4.3 et R6.2 sont précisées dans « Règles de la maquette v1 » ; moteur 1.5. La robustesse passe au vert dans les quatre configurations.**

## 8. Relancer
```bash
python -m foret.batterie plan        # parties par configuration
python -m foret.batterie phase1      # tout (environ 35 min sur 2 cœurs)
python -m foret.batterie rapport     # resultats/batterie/rapport.json
python -m foret.conformite --mesures
```
Le moteur complet est dans `claude/moteur-v1/` ; l'archive `foret_moteur_1_5.zip` est le moyen le plus simple de le relancer dans une autre discussion.
