# Diagnostic de la v1 et options de la v2 (phase 3)

*Statut (13 oct. 2026, midi) : livrable des étapes 3.5 et 3.6 du « Plan d'action ». Décision de l'auteur du 13 oct. : les recommandations de la section 9 sont validées (v2 fixée = V2 proposée + lunes à toutes les tailles de table). Moteur 1.7 et 1.7.1. Bot fort : Monte-Carlo à un coup, 64 suites par décision, chacun pour soi (MC 64). En v1, ses suites ne rêvent pas ; en V2, elles rêvent une carte par tour (voir « Le bot fort de la V2 »). Plan réduit décidé le 13 oct. : les 6 peuples seuls, les 15 duos, 5 trios, 4 parties par table. Toutes les valeurs sont des **indices** : elles décrivent le jeu joué par ce bot, sur peu de parties (marges de 2 à 6 points).*

## En bref
- **v1 : la menace est lue et contrée.** Le Méchant concentre 96 % de sa menace sur autant de zones qu'il y a de joueurs, et le bot fort fait échouer quatre ordres sur cinq. Ce verdict ne dépend pas du bot (rouge aussi avec le glouton). C'est le défaut le plus solide de la v1.
- **v1 : rêver ne compte plus pour un bon joueur.** Les taux de rêve 0 ; 0,5 et 1 carte par tour donnent la même forêt (85,0 ; 84,2 ; 84,5 %), et le bot libre ne fait pas mieux (gain de 0,6 %). Le dilemme « défendre ou rêver » n'existe pas pour lui (objectif 2 rouge). Avec le glouton, c'était l'inverse : rêver dominait.
- **v1 : un peuple suffit.** Joués seuls par le bot fort, les reptiles gardent 99 % de la forêt ; seuls 4 duos sur 15 font mieux que leur meilleur peuple seul (objectif 3 rouge). Les insectes et les mammifères pèsent peu (spectateur 0,23 et 0,36).
- **V2 proposée : le rêve domine et la partie finit au tour 3.** Avec le bot fort qui rêve, 81 % des parties finissent avant la mi-partie, par le réveil (60 %) ou le sommeil (40 %), et l'issue est connue dès le tour 3 (incertitude nulle). Le meilleur taux de rêve est le maximum permis (objectifs 2 et 4 rouges). C'est le premier problème de la V2.
- **V2 proposée : l'équipe fonctionne.** Shapley, synergies, pire table et aucun spectateur sont verts, et les traces numérotées récupèrent 66 % de la coordination. Mais la partie est si courte que chaque table s'en sort bien : ces verts sont à revérifier une fois la durée corrigée.
- **Aucune option de la V2, seule, ne corrige la durée** (section 7). Le seuil du Cercle bascule d'une voie trop rapide à l'autre ; les lunes ralentissent un peu ; les autres options déplacent la forêt de 1 à 3 points. Les conclusions sur la V2 tiennent avec un bonus de fin de 10 ou 25 % ; celle de la v1 sur le rêve, non (section 8).
- **Jeu restreint** (section 6) : en v1, Voir, l'embuscade, Hanter et Barrer portent le jeu, Saboter n'aide pas ce bot ; en V2, presque rien ne pèse, Saboter compris (1 point), parce que la partie finit avant que les actions comptent.
- **Témoins du bot fort** : trois sur quatre tombent où il faut ; celui des dilemmes rate (section 5) : la mesure des dilemmes reste à confirmer.
- **Recommandation** (section 9) : garder les options proposées de la V2, ajouter les lunes à toutes les tailles de table, et consacrer la phase 4 à freiner le rêve (seuil du Cercle, lunes, pas de l'esprit, coût du rêve).

## 1. Méthode
- **Configurations** (`foret/batterie.py`) : `p3_v1` (v1, MC 64), `p3_v2r` (V2 proposée, MC 64 qui rêve), et `p3_v2` (V2, MC 64 qui ne rêve pas, gardé pour comparaison). Les mesures du bot fort viennent du programme `mesures3` (`m3_v1`, `m3_v2r`, témoins). Les campagnes 9 et 10 donnent la coordination et le chef unique ; 11 et 12 le jeu restreint ; 13 les options de la v2 ; 14 et 15 la robustesse au bonus de fin.
- **Comparaison avec le glouton** : chaque verdict est comparé à celui de la batterie de la phase 1 (glouton qui rêve une carte par tour, `v1_g1`, `v2_g1`, et glouton qui ne rêve pas, `v1_g0`, `v2_g0`). Un verdict qui change avec le bot décrit les bots, pas le jeu ; un verdict stable est un défaut (ou une qualité) du jeu.
- **Sources** : branche `resultats`, `batterie/run3_phase3`, `run4_mesures3`, `run5_phase3`, `run6_mesures3` (rapports et parties) ; `campagnes/coordination_mc_2_run9` et `_run10`, `jeu_restreint_run11`, `jeu_restreint_v2_run12`, `v2_options_mc_run13`, `robustesse_v1_run14`, `robustesse_v2_run15` (synthèses ; `python scripts/resume_campagne.py <dossier>`).

### Le bot fort de la V2
En V2, le bot de référence dont les suites ne rêvent pas garde 82 % de la forêt, moins que le glouton qui rêve une carte par tour (86 %) : il ne découvre pas seul l'intérêt de rêver (limite connue d'un bot à un coup). Avec des suites qui rêvent, le même bot garde 92 %. Le bot fort de la V2 est donc MC 64 chacun pour soi dont les suites rêvent (décision technique du 13 oct., signalée à l'auteur). En v1, c'est l'inverse : ses suites ne rêvent pas, et c'est là qu'il est le plus fort. Les campagnes de coordination (9 et 10) ont été jouées avec le bot qui ne rêve pas.

## 2. Tableau des verdicts : glouton et bot fort

| Mesure (bande verte) | v1 glouton qui rêve / sans rêve | **v1 bot fort** | V2 glouton qui rêve / sans rêve | **V2 bot fort** |
|---|---|---|---|---|
| Forêt gardée, duos et trios | 87 % / 68 % | **85,5 %** | 90 % / 78 % | **91,8 %** |
| Concentration de la menace (50-80 %) | 🔴 97,5 / 🔴 94,7 | 🔴 **95,9** | 🟠 81,8 / 🟠 84,0 | 🟢 **75,2** |
| Surprise (20-45 %) | 🟢 39,5 / 🟢 39,3 | 🟢 34,0 | 🟢 37,9 / 🟢 34,0 | 🟠 46,3 |
| Tape-taupe (≥ 10 points) | – | 🟢 **11,1** (± 6,3) | – | 🟠 **4,4** (± 2,3) |
| Meilleur taux de rêve (intermédiaire) | 🔴 le maximum | 🔴 **tous égaux** | 🔴 le maximum | 🔴 **le maximum** |
| Gain du bot libre (≥ 5 %) | – | 🔴 **0,6 %** | – | 🔴 **−0,1 %** |
| Dilemmes (≥ 30 %, seuils provisoires) | – | 🟠 27,6 % | – | 🟠 20,7 % |
| Shapley (0,7 à 1,3) | 🟠 / 🟠 | 🟠 0,59 à 1,47 | 🟢 / 🔴 | 🟢 0,90 à 1,15 |
| Synergies (≥ 12 duos sur 15) | 🟢 15 / 🔴 4 | 🔴 **4** | 🟠 11 / 🟠 11 | 🟢 12 |
| Pire table (≥ 70 %) | 🟢 78,5 / 🟢 76,9 | 🟢 71,1 | 🟢 85,7 / 🟠 66,0 | 🟢 83,1 |
| Aucun spectateur (≥ 0,5) | 🟢 0,77 / 🔴 | 🔴 **0,23** (insectes) | 🟢 0,77 / 🔴 | 🟢 0,74 |
| Coordination (40-80 %) | – | 🔴 7 % (indice faible) | – | 🟢 66 % (bot qui ne rêve pas) |
| Chef unique (5-20 %) | – | 🟢 7,1 % | – | 🔴 0,2 % (bot qui ne rêve pas) |
| Partie jouée d'avance (≤ 65 %) | 🔴 99 / 🟠 70,6 | 🟠 80,0 | 🔴 100 / 🔴 81,9 | 🟠 72,9 |
| Incertitude restante (≥ 0,5) | 🔴 0,03 / 🔴 0,21 | 🔴 **0,18** | 🔴 0 / 🟠 0,27 | 🔴 **0** |
| Fins avant la mi-partie (≤ 20 %) | 🔴 94 / 🟢 2 | 🟢 0 | 🔴 100 / 🟢 0 | 🔴 **81** |
| Menace croissante (≥ 1) | 🟠 0,82 / 🟠 0,87 | 🟠 0,71 | – / 🟠 0,94 | 🟠 0,75 (7 % des parties au tour 5) |
| Plancher (≥ 40 %) | 🟢 61,9 / 🟢 49,5 | 🟢 61,9 | 🟢 76,7 / 🟢 55,1 | 🟢 82,1 |
| Fins | sommeil 95 % / nuit 80 % | nuit 89 %, silence 9 %, sommeil 3 % | sommeil 57 %, réveil 43 % / nuit 100 % | réveil 60 %, sommeil 40 %, tour 3,2 |

*Les marges sont de l'ordre de ± 3 à 4 points sur les forêts, de ± 5 % sur les gains relatifs. Le plan réduit calcule Shapley sur les tables de 1 et 2 peuples (`docs/mesures.md`). Le glouton est mesuré sur 60 parties par équipe, le bot fort sur 4.*

**Ce qui tient quel que soit le bot** (défauts du jeu) :
- v1 : la concentration (rouge), le meilleur taux de rêve (rouge, pour des raisons opposées), l'incertitude restante (rouge), la menace qui ne croît pas (orange), le plancher et la pire table (verts).
- V2 : le meilleur taux de rêve est le maximum et le rêve termine la partie tôt dès qu'on rêve (rouge avec le glouton qui rêve comme avec le bot fort) ; l'incertitude disparaît (rouge).

**Ce qui change avec le bot** (et décrit donc surtout les bots) :
- v1 : les fins avant la mi-partie (le glouton qui rêve finit au tour 3, le bot fort ne rêve pas et va au tour 6) ; les synergies et le spectateur (verts quand on rêve, rouges quand on défend : défendre se fait seul, rêver se fait à plusieurs) ; la prédictibilité.
- V2 : la concentration (orange → vert), Shapley et les synergies (meilleurs avec le bot fort).

## 3. La v1, problème par problème (du plus grave au moins grave)
1. **La menace est résolue (objectif 1).** 96 % de la menace d'une étape tient dans les zones les plus menacées (autant que de joueurs), avec tous les bots. Le bot fort fait échouer 77 à 83 % des ordres de chaque tactique, et aucun ordre de Débardeuse n'a réussi. Le tape-taupe est pourtant vert (11 points) : le glouton qui pare la zone la plus menacée garde 75 % de la forêt, le bot fort 86 %. Lire la menace ne suffit donc pas, il faut aussi la contrer avec méthode (saboter, s'allier) ; mais une fois la méthode trouvée, la menace ne surprend plus.
2. **Défendre ou rêver n'est plus un dilemme (objectif 2).** Pour le bot fort, rêver ne rapporte rien et ne coûte rien : les trois taux font jeu égal, le bot libre aussi. La part de dilemmes (27,6 %) vient surtout de la programmation (quelle carte, 41 % de dilemmes ; quelle moitié, 36 %) et des déplacements, très peu des actions (10 %). Avec le glouton, rêver dominait. Le rêve de la v1 est donc un raccourci pour un joueur moyen, pas un vrai choix pour un bon joueur.
3. **Un peuple suffit (objectif 3).** Seuls, les reptiles gardent 99 % de la forêt, les oiseaux 85 %, les mammifères 83 %, les humains 81 % ; les insectes (62 %) et les entités (68 %) sont loin derrière. Quand un siège ne fait rien, les insectes ne coûtent que 3 points et les mammifères 5, contre 24 pour les reptiles. Shapley (orange) le confirme : reptiles 1,47, insectes 0,59.
4. **L'issue se décide tôt (objectif 4).** Au début du tour 5, il reste 18 % de l'incertitude du départ (rouge) ; la menace ne croît pas (0,71).
5. **La communication parlée, telle que modélisée, aide peu** (7 % de l'écart récupéré). Indice faible : le moteur ne sait pas jouer un conseil parlé.

Qualités : aucune partie plantée, plancher à 62 %, pire table à 71 %, surprise verte, chef unique dans la bande verte (7 %).

## 4. La V2 proposée, problème par problème
1. **Le rêve domine et raccourcit la partie (objectifs 2 et 4).** Le bot fort rêve une carte par tour, finit au tour 3,2 en moyenne (81 % avant la mi-partie) et garde 92 % de la forêt ; rêver moins fait perdre 9 points (taux 0 : 83,3 %, taux 0,5 : 82,9 %). L'incertitude disparaît : au tour 5, presque toutes les parties sont finies. Les leviers sont dans les décisions ouvertes de la V2 (seuil du Cercle, limite des rêves, lunes, D1 à D6) : c'est l'objet de la campagne `v2_options_mc` (étape 3.6).
2. **Le bot fort fait à peine mieux que le glouton qui rêve** (tape-taupe 4,4 points, orange) : la profondeur de jeu est faible tant que rêver vite suffit.
3. **Le chef unique n'apporte rien** (0,2 %, mesuré avec le bot qui ne rêve pas) : avec les traces numérotées, chacun pour soi joue aussi bien qu'un cerveau central. Ce n'est pas un effet leader ; c'est plutôt un « solitaire à plusieurs », à observer avec des humains.

Qualités : la contribution des peuples est équilibrée (Shapley 0,90 à 1,15 ; aucun spectateur 0,74 ; 12 duos sur 15 battent leur meilleur peuple seul) ; la concentration est verte (75 %) ; les traces récupèrent 66 % de la coordination. À relire après correction de la durée : en trois tours, toutes les équipes s'en sortent.

## 5. Les mesures du bot fort et leurs témoins
| Mesure | v1 | V2 (bot qui rêve) | Témoin | Résultat du témoin |
|---|---|---|---|---|
| Tape-taupe | 11,1 points (vert) | 4,4 (orange) | une seule tactique : écart plus petit que la v1 | **réussi** : −9,2 points (le glouton garde 100 %) |
| Gain du bot libre | 0,6 % (rouge) | −0,1 % (rouge) | aucun rêve possible : rouge | **réussi** : 0,4 % |
| Dilemmes | 27,6 % (orange) | 20,7 % (orange) | essoufflement : plus d'indifférentes que la v1 (attente supposée) | **raté** : 31,0 % de dilemmes, 40,8 % d'indifférentes contre 42,5 % |
| Chef unique | 7,1 % (vert) | 0,2 % (rouge) | « tout dire » : rouge | **réussi** : −2,2 % et −3,3 % |

- **Dilemmes** : la part est calculée hors mise en place et hors traces (13 oct. : le bot sans annonces ne les valorise pas ; avec elles, la part tombait à 25 et 18 %). Le témoin rate : quand le Méchant s'essouffle (ni Réparer ni Renfort), les choix ne deviennent pas plus indifférents pour ce bot. Soit l'attente était fausse (le Méchant reste dangereux sans Réparer), soit la mesure ne voit pas l'enjeu. Les seuils (1 et 3 points) et le témoin sont à revoir avec l'auteur ; d'ici là, la mesure est un indice descriptif.
- **Gain du bot libre** : en v1, calculé à partir du rapport du plan réduit (moyenne des tables du bot libre contre le meilleur taux fixe) ; les marges sont d'environ ± 4 %.

## 6. Le jeu restreint
On interdit à tous les joueurs (et dans les suites du bot) une action ou une moitié de carte, et l'on mesure la forêt perdue par le bot fort, sur les mêmes duos (campagnes 11 et 12, 480 parties chacune ; 4 parties par duo ; une moitié n'est jouée qu'aux 5 duos de son peuple, d'où des marges de ± 3 à 10 points). Perte positive : l'élément sert ; nulle : il est inutile ou remplaçable ; négative : s'en passer aide le bot.

| Interdit | Perte v1 (points) | Perte V2 (points) |
|---|---|---|
| Voir (oiseaux) | **16,0** ± 9,8 | **5,7** ± 3,5 |
| Attendre, l'embuscade (reptiles) | **11,9** ± 7,2 | **5,7** ± 3,4 |
| Hanter (entités) | **10,5** ± 8,2 | 4,0 ± 3,6 |
| Barrer | **8,1** ± 5,1 | 2,6 ± 2,0 |
| S'unir (insectes) | 6,0 ± 8,4 | 0,5 ± 3,5 |
| Enrayer (insectes) | 4,8 ± 9,6 | 2,6 ± 4,6 |
| Tromper (humains) | 4,0 ± 9,4 | 0,2 ± 3,2 |
| Tenir (mammifères) | 3,3 ± 7,2 | 1,5 ± 3,6 |
| Aller | 2,7 ± 4,8 | 1,1 ± 2,0 |
| Parler (humains) | 0,9 ± 7,8 | −0,5 ± 3,6 |
| Égarer (entités) | 0,8 ± 7,2 | 0,9 ± 2,9 |
| Se fondre (reptiles) | −0,2 ± 6,2 | 0,9 ± 3,0 |
| Voler (oiseaux) | −1,9 ± 7,3 | 0,0 ± 3,0 |
| **Saboter** | **−4,1** ± 4,2 | 1,1 ± 2,1 |
| Renverser (mammifères) | −5,7 ± 6,1 | −1,4 ± 4,0 |

Lecture (indices) :
- **v1 : Voir, l'embuscade, Hanter et Barrer portent le jeu.** Ce sont les outils qui lisent ou annulent la menace : ils confirment le défaut n° 1 (la menace se lit et se contre).
- **v1 : Saboter n'aide pas ce bot, et l'interdire lui fait même gagner 4 points** (à la limite de la marge). Ses suites sabotent dès que c'est possible (politique du glouton) : l'interdire supprime aussi ce réflexe. Saboter est donc, au mieux, remplaçable par Barrer ; au pire, un piège. À vérifier avec un bot dont la politique ne sabote pas d'office.
- **v1 : la moitié des pouvoirs ne change rien de mesurable** (Parler, Égarer, Se fondre, Voler, Renverser, et Tenir, Aller dans la marge). Avec 5 duos et 4 parties, une perte de moins de 5 points ne se distingue pas de zéro : ces pouvoirs sont « sans effet mesurable », pas « inutiles ».
- **V2 : presque tout est sans effet**, Saboter compris (1,1 point, alors que Saboter ne mène plus à une fin en V2 : c'était la vérification prioritaire du plan). Seuls Voir, l'embuscade et Hanter pèsent encore. La raison est la durée : la partie finit au tour 3 par le rêve, avant que les actions comptent. Le jeu restreint de la V2 est à refaire quand la durée sera corrigée.

## 7. Les options de la v2
Campagne 13 (`v2_options_mc`, 960 parties) : « V2 proposée », les préréglages de l'atelier, et une option changée à la fois pour chaque décision ouverte, jouées par le bot fort de la V2 sur les 15 duos, 4 parties chacun, mêmes graines. Marges d'environ ± 1,5 point sur la forêt (non appariées ; les écarts entre variantes sont mieux mesurés qu'elles ne le disent).

| Décision | Option | Forêt | Tour de fin | Finies au tour 3 ou avant | Fins | Ordres réussis |
|---|---|---|---|---|---|---|
| — | **V2 proposée** | **91,3 %** | 3,2 | 88 % | réveil 80, sommeil 20 | 44 % |
| D1 plan du Méchant | où et comment (A2b) | 88,3 | 3,3 | 82 % | réveil 75, sommeil 22, nuit 3 | 39 % |
| D2 doublé | branle-bas | 88,1 | 3,2 | 85 % | réveil 82, sommeil 18 | 56 % |
| | il hésite | 90,2 | 3,5 | 72 % | réveil 55, sommeil 40, nuit 5 | 43 % |
| | sixième Machine | 91,3 | 3,3 | 77 % | réveil 83, sommeil 15, nuit 2 | 48 % |
| D3 Représailles | la plus attaquée | 90,8 | 3,2 | 88 % | réveil 73, sommeil 25, nuit 2 | 47 % |
| D4 Machine HS désignée | réparée d'un organe | 90,1 | 3,1 | 88 % | réveil 72, sommeil 28 | 50 % |
| | rien | 90,5 | 3,2 | 85 % | réveil 67, sommeil 32, nuit 2 | 46 % |
| D5 voies du rêve | un rêve nourrit les deux | 93,3 | 3,1 | 90 % | réveil 100 | 44 % |
| D6 seuil du Cercle | 2 cases par joueur | 95,4 | **2,2** | 98 % | réveil 100 | 44 % |
| | 4 cases par joueur | 89,0 | 3,5 | 70 % | sommeil 97, nuit 3 | 55 % |
| D8 communication | le partage | 90,3 | 3,2 | 85 % | réveil 80, sommeil 20 | 47 % |
| D9 limite des rêves | les lunes | 90,4 | 3,6 | 67 % | réveil 68, sommeil 23, nuit 8 | 45 % |
| Préréglages | le cœur seul (sans présage) | 89,9 | 3,4 | 80 % | réveil 68, sommeil 25, nuit 7 | 46 % |
| | façon The Gang (partage, lunes) | 90,4 | 3,6 | 65 % | réveil 77, sommeil 20, nuit 3 | 48 % |
| | héritage v1 (une piste, conseil parlé, bonus 10) | 88,4 (résultat 98,4 avec le bonus) | 3,9 | 63 % | réveil 87, sommeil 13 | 31 % |

**Le constat principal : aucune option, seule, ne corrige la durée.** Avec chacune, le bot fort finit la partie par un rêve entre les tours 2 et 4, dans 63 à 98 % des parties avant la mi-partie (bande verte : 20 % au plus). Les options déplacent la forêt de 1 à 4 points et le partage entre réveil et sommeil, pas la durée.
- **D6, le seuil du Cercle, est le levier le plus fort**, dans les deux sens : à 2 cases, la partie finit au tour 2 ; à 4 cases, le Cercle ne se remplit plus et c'est le long sommeil qui gagne, au tour 3,5. Les deux voies sont trop rapides : relever le seuil ne fait que basculer vers l'autre.
- **D9, les lunes, et les préréglages qui les contiennent (façon The Gang)** ralentissent un peu (tour 3,6, deux tiers des parties finies au tour 3) : limiter les rêves de la table est la piste la plus prometteuse, à condition d'aller plus loin.
- **D5 « un rêve nourrit les deux voies »** accélère le réveil : à écarter si l'on veut allonger la partie.
- **D1, D2, D3, D4, D8** : écarts de 0 à 3 points, sans effet sur la durée. Le plan « qui et où » (D1) et le doublé « favori » ou « sixième Machine » (D2) gardent le plus de forêt ; « branle-bas » rend le Méchant plus efficace (56 % d'ordres réussis) mais coûte 3 points. Ces décisions peuvent se trancher sur d'autres critères (lisibilité, goût), la simulation ne les départage guère.

## 8. Robustesse au bonus de fin (A12)
Le résultat est la forêt restante, sans bonus. On vérifie que les conclusions tiennent si une fin par le rêve rapportait 10 ou 25 % de la forêt initiale (campagnes 14 et 15, mêmes duos, mêmes graines).
- **V2 : tout tient.** Les 16 variantes gardent la même forêt (à 1 point près), la même durée (tour 2,1 à 3,9) et presque le même classement : seuil 2, « un rêve nourrit les deux voies », V2 proposée et sixième Machine restent en tête ; seuil 4 et branle-bas en queue. Le bot fort finissait déjà par un rêve : le bonus ne change pas sa façon de jouer.
- **v1 : la conclusion « rêver ne compte pas » ne tient pas.** Avec un bonus de 10 %, rêver une carte par tour devient nettement meilleur (résultat 92,7 contre 84,0 sans rêver ; 106 contre 84 avec 25 %) et la partie finit au tour 4 par le sommeil. Le verdict de l'objectif 2 reste rouge dans tous les cas, mais pour des raisons opposées : sans bonus, tous les taux se valent ; avec un bonus, rêver domine. Le dilemme de la v1 est donc fragile dans les deux sens. (Le bot libre ne profite pas du bonus : ses suites ne rêvent pas.)

## 9. Recommandations pour fixer la v2 (décision 3.7 de l'auteur)
La simulation départage peu les options une à une ; elle dit surtout que **la V2 a un problème de rythme que ses options ne règlent pas** : le rêve finit la partie au tour 3. Recommandations de Claude :

| Décision | Recommandation | Raison (mesurée ou supposée) |
|---|---|---|
| D1 plan du Méchant | **qui et où** (inchangé) | 3 points de forêt de plus que « où et comment », même durée (mesuré, à la marge) |
| D2 doublé | **le favori** (inchangé) ; la sixième Machine en réserve | même forêt ; la sixième finit un peu moins tôt (77 % contre 88 %), écart dans le bruit (mesuré) ; le favori est plus simple (supposé) |
| D3 Représailles | **la plus défendue** (inchangé) | aucun écart mesurable : la simulation ne départage pas |
| D4 Machine HS désignée | **remorquée au chantier** (inchangé) | aucun écart mesurable ; mais Saboter ne vaut qu'un point en V2 (jeu restreint) : le principe « trois façons d'agir » est menacé et devra être revu quand la durée sera corrigée |
| D5 voies du rêve | **le rêve choisit sa voie** (inchangé) | « nourrir les deux » accélère encore le réveil (mesuré) |
| D6 seuil du Cercle | **garder 3 pour l'instant, et en faire un axe de la phase 4** | le seuil seul bascule d'une voie trop rapide à l'autre (2 : tour 2 ; 4 : le sommeil gagne au tour 3,5) (mesuré) |
| D8 communication | **les traces** (inchangé) | 66 % de la coordination récupérée, vert ; le partage ne fait pas mieux (mesuré) |
| D9 limite des rêves | **les lunes à toutes les tailles de table**, nombre de lunes en axe de la phase 4 | c'est la seule option qui ralentit (tour 3,6, deux tiers de fins avant la mi-partie au lieu de 88 %) (mesuré) ; insuffisant seul |

**Et pour la phase 4** : explorer en priorité ce qui freine le rêve (seuil du Cercle, nombre de lunes, pas de l'esprit vers le long sommeil, coût d'un rêve), avec la durée (fins avant la mi-partie) comme premier objectif, puis le dilemme défendre ou rêver. Pour la v1 (si elle sert encore de référence), la menace résolue et le peuple qui suffit sont les deux défauts à corriger.

## 10. Limites
- **Peu de parties** : 4 par table pour le bot fort ; les écarts de moins de 4 points ne sont pas sûrs.
- **Un bot à un coup** ne découvre pas une stratégie que sa politique ne joue jamais (d'où le bot qui rêve en V2).
- **Les sondes** (prédictibilité, incertitude) sont jouées par la politique du bot, pas par le bot fort.
- **Shapley restreint** aux tables de 1 et 2 peuples.
- **Le conseil parlé de la v1** est approché par des traces sans étape.
- **Les campagnes 9 et 10, et les batteries 3 et 4**, ont été jouées avant la correction du tirage au sort des programmes cachés (moteur 1.7.1) ; l'effet attendu est minime.
