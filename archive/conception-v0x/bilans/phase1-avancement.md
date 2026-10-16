# Phase 1 : avancement (copie d'état, communication, v2)

*Journal de la phase 1 du « Plan d'action - évaluer et explorer les variantes par la simulation ». Mis à jour à chaque étape. Le livrable de la phase est « Batterie d'évaluation (phase 1) », avec le tableau de bord « Batterie de la Forêt qui rêve » (https://claude.ai/artifact/9K122xkH4XH7xYodfVAbVG). Dernière mise à jour : 12 oct. 2026, fin de la phase 1 : décisions B1 à B4 de l'auteur prises, moteur 1.5.*

## Où en est la phase 1

| Étape | Contenu | État |
|---|---|---|
| 1a | Copie d'état d'une partie en cours ; journal des décisions | Fait (moteur 1.1) |
| 1b | Communication au conseil (conseil parlé, traces, partage, aucun signe, tout dire) et présage ; R2.1 alignée sur le livret | Fait (moteur 1.2) |
| 1c | La v2 dans le moteur, nœud par nœud, avec conformité par nœud de l'atelier et lecteur du code de variante | Fait (moteur 1.3) |
| 1d | Bilan sans bonus ; mesures (niveaux 1 et 2, coordination) ; témoins ; tableau de bord v1 et « V2 proposée » | Fait (moteurs 1.4 et 1.5) ; décisions B1 à B4 prises |

Moteur 1.5 : 248 tests ; conformité 45 règles v1 sur 45 ; les 35 nœuds v2 codés ont chacun code et test ; les 24 mesures calculées ont chacune code, test et (si elles jugent) témoin. Code dans `claude/moteur-v1/` (synchronisé le 12 oct. après-midi) ; archive `foret_moteur_1_5.zip` (à joindre pour relancer le moteur dans une autre discussion).

## 1a. Copie d'état et journal des décisions (moteur 1.1)

- `Partie.copie()` : copie indépendante d'une partie en cours, au début d'un segment (conseil, étape, fin de tour) ou pendant une décision. On la joue avec les mêmes bots ou d'autres, le même hasard ou un autre à partir du point de copie, et on peut imposer les prochains choix.
- **Vérifié** : une copie jouée avec les mêmes bots et le même hasard finit exactement comme l'original (testé à des dizaines de points, à 2, 3 et 6 peuples, maquettes v0 et v1).
- `JournalDecisions` : chaque décision avec les options offertes, le choix, le moment, le contexte ; option `--decisions` de `foret.partie`.
- Aucune règle ne change : campagne de référence complète (112 350 parties) identique au chiffre près.
- **Coûts mesurés** (1 cœur) : copie 2 ms (duo) à 5 ms (six peuples) ; finir une partie depuis le tour 3 avec le glouton : 10 ms en duo, 29 ms à six. Le glouton sera le goulot d'un MCTS (phase 2).
- **Limite** : une copie voit tout (mains, paquets). Le bot fort devra tirer au sort ce qu'il ignore (phase 2).

## 1b. Communication et présage (moteur 1.2)

### Ce qui change dans les règles
- **R2.1** : le conseil suit le livret : Voir, la communication (**R2.5**), le présage (**R2.6**), puis la programmation en silence. C'est la décision A2 de la phase 0.
- **R2.5, les formes** (règle `communication` de la maquette) :
  - conseil parlé (v1, défaut) : approché par 3 traces non datées par joueur (« ce tour, j'agirai ici ») ;
  - traces (v2) : 2 traces datées par joueur, qui engagent ou non ;
  - partage (v2, façon The Gang) : deux jetons par Machine en marche ;
  - aucun signe, et tout dire (témoins).
- **R2.6, le présage** : on lance les dés de l'étape 1 après la communication ; pas de relance si un oiseau les a déjà lancés.
- **Variantes de la v1** :
  - `sans_presage` ;
  - `reference_1_0` (ni communication ni présage) : avec le glouton réglé comme en 1.0, elle rejoue la référence publiée le 11 oct. (vérifié sur 192 parties) ;
  - `comm_aucun_signe`, `comm_traces`, `comm_traces_engagent`, `comm_partage`, `comm_tout_dire`.

### Choix de modélisation (à confirmer par l'auteur s'il le souhaite)
1. « Sans ordre de tour » : des rondes dans l'ordre des joueurs, où chacun repose ses traces (ou prend ou rend un jeton), jusqu'à ce que rien ne bouge, au plus 3 rondes.
2. Le conseil parlé : 3 traces non datées par joueur, qui disent une zone ou « je rêve », jamais l'étape.
3. Tout dire : une trace datée par étape, et les programmes des joueurs précédents visibles.
4. Le présage n'est pas « trahi » quand un rêve de l'étape 1 change la tuile annoncée : c'est une conséquence permise des règles (compté à part : `presage_detourne`).

### Le glouton et la communication
- Trois niveaux (`communique`) :
  - `non` ;
  - `annonce`, le défaut : il annonce ses intentions sans se servir de celles des autres ;
  - `complet` : il compte sur les alliés annoncés pour saboter, et les rejoint quand rien n'est menacé là où il est.
- `des_connus` : il se sert des dés déjà vus (présage, Voir) pour l'étape en cours.

### Premier essai chiffré (indices, glouton, campagne `communication`)
40 000 parties : 15 duos × 40 parties et 20 trios × 20 parties, par case. Marge d'un écart entre deux cases : environ ±1 point de forêt.

| Forme | Glouton sans rêve, « annonce » | Glouton sans rêve, « complet » | Glouton qui rêve, « annonce » | Glouton qui rêve, « complet » |
|---|---|---|---|---|
| Référence 1.0 (ni communication ni présage) | 67,1 % | 67,1 % | 85,5 % | 85,5 % |
| Sans présage (conseil parlé) | 67,2 % | 67,2 % | 85,5 % | 85,5 % |
| Aucun signe, avec présage | 67,4 % | 67,4 % | 85,6 % | 85,6 % |
| Conseil parlé + présage (v1, défaut) | 67,4 % | 67,4 % | 85,6 % | 85,6 % |
| Traces datées | 67,4 % | 63,8 % | 85,6 % | 85,1 % |
| Traces qui engagent | 67,6 % | 66,5 % | 83,6 % | 83,4 % |
| Partage | 67,4 % | 60,4 % | 85,6 % | 84,2 % |
| Tout dire | 67,4 % | 63,1 % | 85,6 % | 84,8 % |

*Forêt restante moyenne. En « complet », le conseil parlé ne change rien : une trace non datée ne dit pas l'étape, le glouton ne s'y fie pas pour une alliance.*

**Lecture** (indices, pas mesures : le glouton n'est pas le bot fort) :
- **Avec le glouton par défaut, la forme de communication ne change rien** (67,4 % partout). C'est attendu : le glouton choisit sa zone et son action à la révélation, en voyant ce qu'ont fait les joueurs précédents, et n'utilise pas les signes des autres.
- **Le glouton qui se sert des signes pour coordonner ses sabotages perd de la forêt** : de 3,6 à 7 points selon la forme. Il met pourtant davantage de Machines hors service (de 1,8 à 2,0-2,1 par partie). C'est l'autre face d'un problème déjà vu en v1 : Barrer domine, et coordonner les sabotages coûte plus de forêt que cela n'en sauve. À vérifier avec le bot fort.
- **Le présage ne rapporte rien au glouton** (+0,2 point, dans le bruit). Il change seulement sa manière de jouer : deux fois plus de fins par silence du chantier (de 10 à 20 %), à forêt égale.
- **Les traces qui engagent coûtent 2 points au glouton qui rêve** : elles l'obligent à suivre ses annonces.

**Conséquence pour la suite** : avec le glouton, l'écart « aucun signe → tout dire » est nul. On ne peut donc pas calculer la part récupérée par la forme permise (bande verte de 40 à 80 %, objectif 3). Le volet coordination du tableau de bord (1d) affichera « non mesurable avec ce bot ». La mesure attend le bot fort de la phase 2. C'était prévu par le plan ; c'est maintenant constaté.

## 1c. La v2 dans le moteur (moteur 1.3)

### Ce qui est codé
- **`maquettes/v2.json`** : le préréglage « V2 proposée ». Il hérite de la v1 et n'écrit que ses différences.
- **Toute autre variante de l'atelier se charge par son code** : `charger("v2", "code:c:…|m:…|p:…")`, ou `"code:…"` dans une campagne. Le lecteur (`foret/atelier.py`) :
  - refuse les combinaisons interdites par l'atelier (partage ou escalade sans la piste des Machines) ;
  - refuse ce qui n'est pas encore codé.
- **Les nœuds codés, chacun relié à son code et à au moins un test** (contrôle `python -m foret.conformite --v2`) :
  - le plan « qui et où » : piste des Machines, rayon, flèches de percée, cycle (entrer, remorquer), portée, réglage hs ;
  - les quatre doublés et l'escalade ;
  - le plan « où et comment », avec ses six manœuvres ;
  - la piste unique de la v1, avec les fins v2 ;
  - les tactiques dans le rayon (Représailles « défendue » ou « attaque ») ;
  - les deux voies du rêve (au choix ou les deux) et le Cercle ;
  - les trois fins, sans silence du chantier ;
  - le bilan avec bonus réglable ;
  - les limites de rêves pour la table et les lunes ;
  - le dernier sursaut et le bruit ;
  - Égarer, Attendre et Tromper adaptés aux deux pistes ;
  - les réglages de l'atelier (main, présence, tours, étapes, barrage, Machines au chantier…).
- **Non codés** :
  - le module B4 (peuples des plans au conseil), refusé par le lecteur ;
  - les idées verrouillées A6, A7, B5 et le module retiré D7 ;
  - le gabarit de plateau g1.
- **Moteur** : 220 tests ; conformité 45 règles v1 sur 45, et les 35 nœuds v2 codés (sur 40) ont tous un renvoi dans le code et un test. La référence du 11 oct. se rejoue toujours à l'identique, et la v1 joue exactement comme en 1.2 (360 parties comparées).
- **Le moteur retrouve au centième les calculs exacts de l'atelier** (plateau v1, départ, sans défense) : 0,83 forêt abattue par plan, 6 chances sur 36 qu'une Machine entre, 53 % de la menace sur les deux zones les plus menacées ; branle-bas 1,17, il hésite 0,67 ; v1 0,92 et 100 %. Le code de l'atelier et celui du moteur ont été écrits séparément : cet accord confirme que le moteur joue la v2 telle que l'atelier la décrit.
- **Le glouton joue la v2** :
  - sa voie du rêve : « auto », la plus proche de sa fin ;
  - les lunes : il en prend une s'il prévoit de rêver ;
  - la menace : il la lit avec le plan de la maquette.
- **Vitesse** (1 cœur, glouton) :
  - v2 : 25 parties par seconde en duo, 9 à six ;
  - v1 : 44 en duo et 15 à six, plus lente qu'en 1.0 à cause des annonces du conseil parlé.

### Choix de modélisation à confirmer (détail dans `docs/noeuds_v2.md`)
1. **Zizanie** (sixième Machine) : moteur et chenilles, entrée par la Clairière. L'atelier ne les donne pas.
2. **Remorquage** : il n'est pas gêné par un barrage.
3. **Percée vers une zone rasée** : la Machine reste dans sa zone et y abat.
4. **Rayon sans forêt** : le plan échoue.
5. **Limite de table** : les cartes en travers en trop ne rêvent pas et reviennent en main. La limite de table remplace la limite par joueur.
6. **Les lunes** : on les prend après la communication, et non en même temps.

### Premier essai chiffré (indices, glouton, campagne `v2_options`)
10 752 parties : 15 duos × 12 parties, 20 trios × 6 et 6 tables de cinq × 6, par case. Marge à 95 % : environ ±1,5 point pour le glouton sans rêve, ±0,7 pour le glouton qui rêve.

| Variante | Glouton sans rêve | Glouton qui rêve (1 par tour) | Fins du glouton qui rêve |
|---|---|---|---|
| V2 proposée | 78,1 % | 89,2 % | réveil 54 %, sommeil 46 %, tour 2,6 |
| Le cœur seul (sans présage) | 75,7 % | 89,2 % | idem |
| Façon The Gang | 78,1 % | 89,2 % | idem, tour 3,0 |
| Héritage v1 | 67,9 % | 87,0 % | |
| Où et comment | 75,8 % | 87,8 % | |
| Doublé : branle-bas | 69,5 % | 88,3 % | |
| Doublé : il hésite | 87,0 % | 92,4 % | |
| Doublé : sixième Machine | 84,5 % | 92,1 % | |
| Représailles : dernière attaque | 78,5 % | 91,0 % | |
| Machine HS : réparée d'un organe | 78,0 % | 89,2 % | |
| Machine HS : rien | 79,5 % | 89,3 % | |
| Rêve : les deux voies à la fois | 78,2 % | 89,9 % | sommeil 90 % |
| Cercle : 2 cases par joueur | 78,1 % | 92,6 % | réveil 89 %, tour 2,0 |
| Cercle : 4 cases par joueur | 78,2 % | 87,7 % | sommeil 92 %, tour 2,9 |
| Partage | 78,1 % | 89,2 % | |
| Lunes (2) | 78,1 % | 89,2 % | tour 3,0 |

Pour comparer : la v1 avec le glouton sans rêve, 67 à 68 %.

**Lecture** (indices) :
- **La v2 est plus clémente pour le défenseur** : 78 % de forêt contre 67-68 % en v1 et en « Héritage v1 ». Le Méchant local, qui doit faire entrer ses Machines et les remorquer, abat moins.
- **Le présage compte en v2** : +2,4 points pour le glouton (contre +0,2 en v1). Le plan annoncé vise une zone précise du rayon : la barrer suffit.
- **Le doublé est le réglage le plus fort de la grille** : de −8,6 points (branle-bas) à +8,9 (il hésite) pour le défenseur. Cela correspond à l'écart de menace calculé par l'atelier (de 0,67 à 1,17 forêt par plan).
- **Le rêve domine toujours** : 89 % contre 78 %, avec une fin vers le tour 2,6. Le seuil du Cercle règle la vitesse : 2 cases par joueur, fin au tour 2 par le réveil ; 4 cases, retour au sommeil. C'était le point de vigilance du document de conception ; il se confirme avec ce bot.
- **La communication, le partage et les lunes ne changent rien pour le glouton**, comme en v1. Les lunes ralentissent seulement la fin (tour 3,0), en limitant les rêves de la table.
- **Ce que l'on ne peut pas encore dire** : pour les décisions où le jeu du joueur compte (hs, Représailles, voies, communication), le glouton ne joue pas assez bien pour départager les options. La phase 3 le fera avec le bot fort.

## 1d. Batterie d'évaluation (moteur 1.4)
Détail et résultats : « Batterie d'évaluation (phase 1) ». En résumé :
- `foret/mesures.py` (Mesureur, Sondeur, agrégations, registre de 28 mesures dont 4 attendent le bot fort), `foret/batterie.py` (plan de 20 configurations, 96 200 parties en environ 35 minutes sur 2 cœurs), bot `inerte`, variantes `temoin_*`, règles de témoin `des_fixes` et `apprentissage` ; aucune règle du jeu ne change.
- 21 témoins sur 26 tombent juste ; les 5 ratés viennent surtout du glouton. Quatre révisions faites après le passage des témoins (siège spectateur tenu par le bot inerte ; optimum de rêve significatif ; issues toutes égales ; attente du témoin d'apprentissage corrigée), aucune sur un seuil.
- Indices principaux : le rêve domine encore en v1 et en V2 (fin entre les tours 2 et 3, issue jouée au tour 2) ; la V2 concentre moins la menace (82-84 % contre 95-98 %) et demande quinze fois moins de départages ; un peuple seul garde déjà 40 à 88 % de la forêt (synergie additive négative par construction) ; reptiles en tête, insectes en queue ; communication non mesurable avec le glouton.

## Suite
- **Décisions de l'auteur, prises le 12 oct.** (« Batterie d'évaluation », section 7) : B1 bandes gelées, sauf la synergie ; B2 synergie = duos qui battent leur meilleur peuple seul (vert ≥ 12 sur 15), tétraèdre par la synergie relative ; B3 siège spectateur tenu par le bot inerte ; B4 « voir_trahi » et l'abattage en chemin (v1) deviennent des cas permis (moteur 1.5, R4.3 et R6.2 précisées). La batterie a été rejouée en 1.5 : mêmes parties, robustesse au vert, 21 témoins sur 26.
- **Phase 2** : choix de l'environnement de calcul (cahier des charges), puis bot fort (MCTS déterminisé) et reprise de la batterie.
