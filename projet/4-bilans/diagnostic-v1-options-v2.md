# Diagnostic de la v1 et options de la v2 (phase 3)

*Statut (13 oct. 2026, matin) : brouillon de l'étape 3.5. Moteur 1.7 et 1.7.1. Bot fort : Monte-Carlo à un coup, 64 suites par décision, chacun pour soi (MC 64). En v1, ses suites ne rêvent pas ; en V2, elles rêvent une carte par tour (voir « Le bot fort de la V2 »). Plan réduit décidé le 13 oct. : les 6 peuples seuls, les 15 duos, 5 trios, 4 parties par table. Toutes les valeurs sont des **indices** : elles décrivent le jeu joué par ce bot, sur peu de parties (marges de 2 à 6 points). Les sections « jeu restreint », « options de la v2 » et « robustesse » viendront avec les campagnes 11 à 15 (étapes 3.5 et 3.6).*

## En bref
- **v1 : la menace est lue et contrée.** Le Méchant concentre 96 % de sa menace sur autant de zones qu'il y a de joueurs, et le bot fort fait échouer quatre ordres sur cinq. Ce verdict ne dépend pas du bot (rouge aussi avec le glouton). C'est le défaut le plus solide de la v1.
- **v1 : rêver ne compte plus pour un bon joueur.** Les taux de rêve 0 ; 0,5 et 1 carte par tour donnent la même forêt (85,0 ; 84,2 ; 84,5 %), et le bot libre ne fait pas mieux (gain de 0,6 %). Le dilemme « défendre ou rêver » n'existe pas pour lui (objectif 2 rouge). Avec le glouton, c'était l'inverse : rêver dominait.
- **v1 : un peuple suffit.** Joués seuls par le bot fort, les reptiles gardent 99 % de la forêt ; seuls 4 duos sur 15 font mieux que leur meilleur peuple seul (objectif 3 rouge). Les insectes et les mammifères pèsent peu (spectateur 0,23 et 0,36).
- **V2 proposée : le rêve domine et la partie finit au tour 3.** Avec le bot fort qui rêve, 81 % des parties finissent avant la mi-partie, par le réveil (60 %) ou le sommeil (40 %), et l'issue est connue dès le tour 3 (incertitude nulle). Le meilleur taux de rêve est le maximum permis (objectifs 2 et 4 rouges). C'est le premier problème de la V2.
- **V2 proposée : l'équipe fonctionne.** Shapley, synergies, pire table et aucun spectateur sont verts, et les traces numérotées récupèrent 66 % de la coordination. Mais la partie est si courte que chaque table s'en sort bien : ces verts sont à revérifier une fois la durée corrigée.
- **Témoins du bot fort** : trois sur quatre tombent où il faut ; celui des dilemmes rate (section 5) : la mesure des dilemmes reste à confirmer.

## 1. Méthode
- **Configurations** (`foret/batterie.py`) : `p3_v1` (v1, MC 64), `p3_v2r` (V2 proposée, MC 64 qui rêve), et `p3_v2` (V2, MC 64 qui ne rêve pas, gardé pour comparaison). Les mesures du bot fort viennent du programme `mesures3` (`m3_v1`, `m3_v2r`, témoins). Les campagnes 9 et 10 donnent la coordination et le chef unique.
- **Comparaison avec le glouton** : chaque verdict est comparé à celui de la batterie de la phase 1 (glouton qui rêve une carte par tour, `v1_g1`, `v2_g1`, et glouton qui ne rêve pas, `v1_g0`, `v2_g0`). Un verdict qui change avec le bot décrit les bots, pas le jeu ; un verdict stable est un défaut (ou une qualité) du jeu.
- **Sources** : branche `resultats`, `batterie/run3_phase3`, `run4_mesures3`, `run5_phase3`, `run6_mesures3` (rapports et parties) ; `campagnes/coordination_mc_2_run9` et `_run10`.

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
*À venir (campagnes `jeu_restreint` et `jeu_restreint_v2`).*

## 7. Les options de la v2
*À venir (étape 3.6, campagne `v2_options_mc` et robustesse).*

## 8. Limites
- **Peu de parties** : 4 par table pour le bot fort ; les écarts de moins de 4 points ne sont pas sûrs.
- **Un bot à un coup** ne découvre pas une stratégie que sa politique ne joue jamais (d'où le bot qui rêve en V2).
- **Les sondes** (prédictibilité, incertitude) sont jouées par la politique du bot, pas par le bot fort.
- **Shapley restreint** aux tables de 1 et 2 peuples.
- **Le conseil parlé de la v1** est approché par des traces sans étape.
- **Les campagnes 9 et 10, et les batteries 3 et 4**, ont été jouées avant la correction du tirage au sort des programmes cachés (moteur 1.7.1) ; l'effet attendu est minime.
