# Maquette de conception v2 : plan du Méchant, fins, conseil

*Statut (12 oct. 2026) : propositions de Claude sur les quatre demandes de l'auteur, rangées dans l'« Atelier de la Forêt qui rêve » (artefact HTML : https://claude.ai/artifact/WJiQMwXDJEDwVvAERsDWss ; source : `claude/maquette-html/atelier_v2.html`). La décision 7 (bonus) est tranchée ; les autres restent ouvertes et seront éclairées par la simulation (voir la dernière section). La maquette v1 reste la référence publiée du moteur.*

## 1. Le plan du Méchant : deux pistes, « qui » et « où »
**Demande** : rendre lisibles le mouvement et l'action des Machines ; ajouter une seconde piste 0-5 lue par l'écart des dés, qui apprend comme la première ; le plan combine les deux tuiles.

**Proposition (option « Deux pistes : qui et où »)**
- La somme désigne une tactique sur la piste des pensées (le « où ») ; l'écart désigne une Machine sur la **piste des Machines** (le « qui »). Le plan se lit comme une phrase : « Grosse Gueule, par cupidité ».
- **Portée locale** : la tactique choisit dans le **rayon** de la Machine (sa zone et les voisines boisées) ; la Machine y entre et y abat. Zone choisie = zone abattue. Égalité : sa zone, puis la plus boisée, puis le plus petit numéro.
- **Cycle des Machines** : au chantier → désignée, elle entre par sa zone d'entrée ; en marche → elle exécute ; hors service → désignée, elle est remorquée au chantier, remise en état. Les tuiles Réparer et Renfort disparaissent de la piste des pensées.
- **Apprentissage** : les deux tuiles apprennent du même verdict (réussite = l'ordre a eu un effet). Piste des Machines : réussite vers la case 1, échec vers la case 5.
- **Doublé (écart 0)** : la case 0 n'a pas de tuile ; proposé : le **favori** (la Machine de la case 1 obéit). Alternatives : branle-bas (toutes), il hésite (pas d'ordre), sixième Machine (Zizanie en case 0, qui apprend ; case collante).
- **Tactiques dans le rayon** : Cupidité (la plus boisée), Opportunisme (la moins défendue), Représailles (**la plus défendue**, au lieu de la dernière attaquée), Percée (flèche imprimée vers une voisine plus profonde : Lisière→Igapó, Clairière→Sources, Várzea→Sources, Igapó→Colline aux aras, Sources→Samaúma ; au cœur, reste).
- **Disposition de départ** : pensées 2 Percée, 3 Représailles, 4 Percée, 5 Représailles, 6 Opportunisme, 7 Cupidité, 8 Opportunisme, 9 Représailles, 10 Percée, 11 Cupidité, 12 Cupidité ; Machines : chaque Machine sur la case de son numéro (1 Grosse Gueule, 2 Rapiat, 3 Mâchoire sur la lisière ; 4 Tonton Débard, 5 Ripaille au chantier). Zones d'entrée : Lisière (Grosse Gueule, Tonton Débard), Clairière (Rapiat), Várzea (Mâchoire, Ripaille).

**Propriété de la pyramide** (calcul exact) : somme et écart ont la même parité. Une Machine en case *d* ne reçoit que les tactiques des cases 7 ± (5 − *d*), de deux en deux, **toutes équiprobables** : case 5 → toujours le 7 ; case 4 → 6 ou 8 ; case 3 → 5, 7, 9 ; case 2 → 4 à 10 pairs ; case 1 → 3 à 11 impairs ; doublé → 2 à 12 pairs. Les 21 couples (= les 21 paires de dés non ordonnées) se dessinent en pyramide sous la piste : c'est l'aide de lecture. Écart : 0 (6/36), 1 (10), 2 (8), 3 (6), 4 (4), 5 (2).

**Chiffres (plateau v1, départ, sans défense, calcul exact)** :

| Doublé | Forêts abattues par plan | Entrées de Machine | Part des 2 zones les plus menacées |
|---|---|---|---|
| Favori (proposé) | 0,83 | 6/36 | 53 % (60 % si Rapiat en case 1) |
| Branle-bas | 1,17 | 6/36 | 52 % |
| Il hésite | 0,67 | 6/36 | 50 % |
| v1 (piste unique) | 0,92 | 1/36 | 100 % (82 % sur les Sources) |

**Points de vigilance** : barrer la zone d'une Machine la paralyse pour l'étape (défense très lisible, peut-être trop forte ; à mesurer contre le tape-taupe) ; une Machine remorquée ou qui entre « réussit » et monte sur la piste (décision 5) ; Représailles change de sens.

**Alternatives rangées dans l'arbre** : « Où et comment » (l'écart donne une manœuvre : Encercler, Avancer, Foncer, Raser, Réparer, Renfort ; la Machine la plus proche exécute) ; « Une seule piste » (v1) ; portée « tout le plateau » ; Machine HS désignée réparée d'un organe ou sans effet.

## 2. Les fins : le moteur des rêves
**Demande** : retirer le silence du chantier (les Machines se recyclent) ; ajouter le **réveil de la forêt** (renforts en masse) provoqué par l'investissement dans le rêve, en écho au long sommeil ; trois fins ; le résultat se mesure toujours aux arbres sauvés.

**Proposition**
- Une carte en travers part en rêve (perdue pour la partie) et **choisit sa voie** :
  - **voie du sommeil** (règle v1) : un esprit entre en 12 ou avance ; contestée par le tir à la corde, mais protège tout de suite (esprit tiré = pas d'ordre ; esprit qui entre = oubli de la case 12) ; au moins 6 rêves sur le même esprit ;
  - **voie du réveil** : la carte rejoint le **Cercle** (3 cases par joueur, paramètre) ; rien ne la repousse, elle ne protège rien avant d'être pleine ; au plus tôt au tour 3.
- **Trois fins**, immédiates : long sommeil (esprit au 7), réveil de la forêt (Cercle plein), la nuit (fin du 6e tour).
- **Bilan** : forêts restantes, **bonus de fin à 0** (remplace la décision A3 ; tests à 10 et 25 % possibles).
- Silence du chantier retiré. Égarer : la Machine rentre aussitôt au chantier, remise en état, et fait rêver (rêve gratuit, voie au choix).
- Alternative : chaque rêve nourrit les deux voies à la fois.
- **Module des lunes** : un nombre fixe de rêves par tour pour toute la table (1 à 3), à se disputer au conseil comme les jetons de The Gang. Réponse au constat du 11 oct. sur les grandes tables.

**Vigilance** : le rêve dominait déjà en v1 (un rêve par tour : sommeil vers le tour 3, 86 % de forêt contre 67 %) ; une voie sans riposte le rend plus sûr. Leviers : seuil du Cercle, limite et coût des rêves.

## 3. Le conseil : des traces au lieu de la parole
**Demande** : encadrer l'échange d'informations (portage BGA) ; piste : placement ou révélation d'indices sans ordre de tour, comme The Gang.

**Proposition (option « Les traces »)** : 3 traces par peuple, numérotées 1-2-3 ; sans parler et sans ordre de tour, chacun en pose jusqu'à 2 sur des zones ou sur le Cercle, les reprend, les déplace ; une trace dit « à cette étape, j'agirai ici » (sur le Cercle : « je rêve ») ; figées quand tous sont prêts ; elles n'engagent pas et ne comptent pas comme présences. Puis présage (module), puis programmation silencieuse. Paramètres : nombre de traces, numérotées ou non, engageantes ou non.

**Alternatives** : « Le partage » (façon The Gang : deux jetons par Machine en marche, pris et repris, y compris devant un autre joueur ; demande la piste des Machines) ; « Le conseil parlé » (v1, table seulement) ; témoins « Aucun signe » et « Tout dire » pour la mesure de coordination (objectif 3 : 40 à 80 % de l'écart récupéré).

**Module (idée)** : les peuples des plans au conseil (humains : poser après « prêt » ; insectes : une trace qui suit celle d'un autre ; reptiles : traces face cachée).

## 4. La maquette de conception
L'atelier remplace la logique « boîte + livret » par un **arbre** : socle (toujours présent), choix (une option exactement), modules (on/off, idées verrouillées), paramètres (valeur proposée et plage, statut du catalogue). Préréglages : Le cœur seul, V2 proposée (cœur + présage), Façon The Gang (partage + lunes + présage), Héritage v1. Le livret de la variante s'assemble à la volée ; un code de variante permet de noter et recharger une configuration. Chaque fiche indique si le moteur sait déjà jouer le nœud.

**À coder dans le moteur, dans l'ordre** : piste des Machines avec rayon, flèches et cycle ; moteur des rêves à deux voies et Cercle ; fins et bilan sans bonus ; traces comme décision « annonce » des joueurs virtuels ; lunes. Une variante deviendra `maquettes/v2.json` avec `"base": "v1"`.

## Décisions à prendre (recommandation de Claude en gras)
1. Plan du Méchant : **qui et où** / où et comment.
2. Doublé : **le favori** / branle-bas / il hésite / sixième Machine.
3. Tactiques dans le rayon, Représailles = la plus défendue : **oui**.
4. Machine HS désignée : **remorquée au chantier** / réparée d'un organe / rien.
5. Un rêve **choisit sa voie** / nourrit les deux.
6. Seuil du Cercle : **3 cases par joueur**, à simuler.
7. Bonus de fin : **0** (remplace A3). *Tranché le 12 oct. : 0, pour la v1 et la v2 (décision A12 du catalogue).*
8. Communication : **les traces** (2 par joueur, numérotées) ; le partage à tester avec les lunes.
9. Limite des rêves : **un par joueur jusqu'à 3 joueurs, les lunes au-delà**.

## Suite donnée dans le plan de test (12 oct.)
Décision A13 de l'auteur (« Objectifs, invariants et catalogue », « Plan d'action ») : **la simulation éclaire les décisions 1 à 6, 8 et 9.**
- **Phase 1** : après la copie d'état et le journal des décisions, le moteur reçoit la communication sous la forme v2 (traces, partage, aucun signe, tout dire) et le présage, puis la v2 nœud par nœud. Il lit le code de variante de l'atelier. La conformité de la v2 s'appuie sur les identifiants des nœuds (A2a, D2…), puisque les numéros du livret changent avec la variante.
- **Phase 3** : avec le bot fort, la batterie compare les options de chaque décision ouverte, une à une autour du préréglage « V2 proposée », et diagnostique la v1 en parallèle. L'auteur fixe ensuite la v2.
- **Phase 4** : la recherche porte sur les paramètres de la v2 fixée.
- **Point de vigilance ajouté** : sans le silence du chantier, désarmer ne mène plus à une fin. Le jeu restreint de la phase 3 mesurera ce que coûte l'interdiction de Saboter en v2 ; une perte faible menacerait le principe « trois façons d'agir » (noté 8).
