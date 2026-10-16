# Moteur de règles v0 : lacunes et incohérences

*Statut (11 oct. 2026) : premier moteur exécutable de la maquette du 11 oct. ; 112 350 parties simulées avec des bots simplistes. Les chiffres servent à repérer des problèmes de règles, pas à équilibrer le jeu ni à juger son intérêt.*
*Mise à jour du 11 oct. au soir : les dix décisions de la section 6 sont prises. Elles sont intégrées dans « Règles de la maquette v1 » ; leurs effets sont mesurés dans « Moteur de règles v1 - conformité et campagne de référence ».*
*Voir aussi : « Synthèse des idées - revue du 11 oct. 2026 » (tour de jeu, piste des pensées, peuples).*

## En bref
- **Le moteur tourne sans erreur** sur 112 350 parties : toutes les combinaisons de 1 à 6 peuples, 13 variantes de règles, deux bots. Une seule erreur est apparue en cours de route (58 parties) ; elle venait d'un trou des règles, pas du code (voir incohérence 8).
- **Quatre incohérences touchent le cœur du jeu** et méritent d'être tranchées avant tout prototype : un seul barrage ne fait jamais échouer un ordre qui vise une autre zone ; contrer le Méchant peut l'endormir ; la vérification « en fin de tour » laisse des esprits traverser le centre ; Réparer et Renfort ne peuvent jamais réussir.
- **Le rêve court-circuite la partie** : avec un esprit de départ, cinq cartes en rêve suffisent à endormir le Méchant, et deux joueurs en ont dix. Les bots qui rêvent beaucoup finissent au tour 1.
- **Une trentaine de lacunes** : certaines surviennent plusieurs fois par partie (égalités, Représailles sans attaque, Percée au bout du plateau). Chacune a reçu un choix par défaut, modifiable.

## 1. Ce qui a été codé

Moteur Python sans interface, entièrement paramétrable (fichier de configuration), graine reproductible. Il couvre : plateau, Machines à organes et réserve, piste des pensées, tour complet, alliance, les douze règles brisées dans une première forme, Réparer et Renfort, les trois fins (sommeil, silence, nuit), le bilan. Après chaque étape, il vérifie que l'état reste cohérent (11 tuiles sur la piste, forêt dans ses bornes, aucune carte perdue ou dupliquée, présence conservée, fin de partie déclenchée quand elle doit l'être).

Non codé : effets des obsessions (seulement des détecteurs), escalade de fin de partie, communication entre joueurs, pouvoirs propres aux personnages (porter, semer), mode campagne, échelle de résultats.

### Le modèle d'interprétation retenu
La maquette ne dit pas comment la moitié d'une carte s'articule avec les quatre actions de base. Choix du moteur :
- toute carte jouée fait **une action de base** (Aller, Barrer, Saboter, ou rester dans une zone pour servir d'allié) ;
- **la moitié choisie active la règle brisée** du compartiment correspondant (ex. une carte d'insecte moitié Machines peut saboter seule, mais seulement le moteur) ;
- seuls l'étape, la carte et l'orientation sont programmés en secret ; l'action et la zone sont choisies à la révélation, à découvert, dans l'ordre des sièges.

### Mise en place provisoire
```
        Z1 (2)     Z2 (2)            lisière, côté chantier
   Z3 (3)    Z4 (3)    Z5 (3)        milieu
        Z6 (4)     Z7 (4)            cœur
```
21 forêts ; rivière Z1-Z3-Z6-Z7-Z5. Trois Machines en lisière (7 organes), deux en réserve. Piste : 4 tactiques × 2 tuiles, Réparer, Renfort, un esprit en case 12, le reste au hasard. Chaque peuple : 3 pions de présence au hasard, paquet de 7, main de 5.

## 2. Comment on a testé

| Campagne | Bots | Parties | Ce qu'elle cherche |
|---|---|---|---|
| Fuzz | aléatoires | 18 900 | Toutes les combinaisons de 1 à 6 peuples, choix au hasard : plantages, états impossibles, situations non prévues |
| Variantes | aléatoires | 40 950 | 13 variantes de règles (fin de tour, alliance conjointe, Tenir permanent, organes à effet partiel…) |
| Glouton | gloutons | 30 000 | Duos et trios, 0 / 0,5 / 1 / 3 cartes en rêve par tour |
| Glouton × variantes | gloutons | 22 500 | 5 variantes, avec et sans rêve |

Le bot aléatoire sert à passer partout ; le bot glouton (saboter si possible, sinon barrer la zone la plus menacée) sert à voir ce que produisent des choix cohérents. Aucun des deux ne joue bien : les écarts entre peuples ci-dessous mesurent les règles telles qu'interprétées, pas la force des peuples.

## 3. Incohérences

### 1. Un seul barrage ne fait jamais échouer un ordre qui vise une autre zone
Règle : la Machine avance d'une zone vers la cible, puis abat là où elle se trouve ; elle ne peut ni entrer dans une zone barrée ni y abattre.
- Barrer la zone suivante : la Machine reste sur place et abat sa propre zone.
- Barrer la zone de la Machine : elle en sort et abat la suivante.
- Vérification exhaustive sur le plateau : sur 294 cas où la cible n'est pas la zone de la Machine, **aucun** n'est stoppé par un barrage unique. Un barrage ne stoppe l'ordre que si la Machine est déjà sur sa cible (7 cas sur 49).
- En jeu : la cible barrée est contournée dans 27 % des parties aléatoires et 63 % des parties gloutonnes sans rêve.

Cela contredit le « cœur de la décision » (« deviner où frappera l'ordre pour barrer au bon endroit ») : le bon endroit est la zone de la Machine, ou deux zones à la fois. Seuls Tenir (mammifères) et l'embuscade (reptiles) arrêtent vraiment une Machine.

### 2. Contrer le Méchant peut l'endormir
Une tactique qui échoue s'éloigne du centre en échangeant sa place avec sa voisine. Côté rêve, si cette voisine est un esprit, l'esprit avance. En case 7, l'échec envoie la tactique en 8 : si un esprit s'y trouve, il arrive au centre et la partie se termine.
- Un esprit avance ainsi dans 32 % des parties aléatoires.
- La partie se termine de cette façon dans 6 % des parties, et dans 17 % des parties gloutonnes qui rêvent une carte tous les deux tours (près d'un sommeil sur cinq).
- Sans aucune carte en rêve, presque tous les sommeils viennent de là (0,9 % des parties sur 1,0 %).

C'est peut-être voulu (chaque échec fatigue le Méchant), mais ce n'est écrit nulle part, et c'est le contraire du tir à la corde (une réussite repousse l'esprit).

### 3. « On vérifie la fin de partie en fin de tour » laisse passer des esprits
Si un esprit atteint le centre en cours de tour, une tactique de la case 6 qui réussit ensuite prend sa place : l'esprit passe côté éveil, où aucune règle ne prévoit d'esprit. Avec la variante « fin de tour » et des bots qui rêvent : un esprit quitte le centre sans sommeil dans 33 % des parties, et passe côté éveil dans 23 %. Le moteur vérifie donc la fin **immédiatement** par défaut.

### 4. Réparer et Renfort ne peuvent jamais réussir
La règle d'apprentissage dit « forêt abattue = réussite ». Ces ordres n'abattent jamais : ils reculeraient à chaque tirage, puis seraient oubliés, ce qui contredit l'idée qu'« il apprend à réparer ». Le moteur compte comme réussite un ordre qui a eu un effet.

### 5. L'obsession en 6-7-8 ne peut pas se déclencher
Il faut trois tuiles d'une même tactique ; avec 11 cases, un esprit et deux ordres de chantier, il reste 8 cases pour 4 tactiques, soit 2 tuiles chacune. Aucune obsession sur 112 350 parties, sauf dans la variante qui donne trois tuiles à Cupidité (2,7 % de ses parties). Variante « deux cases sur trois » : 57 % des parties, dont **28 % dès la mise en place** si la piste est tirée au hasard.

### 6. Voir ne voit pas toujours juste
Adaptation retenue : les oiseaux engagent une carte pendant le conseil et les dés de cette étape sont lancés aussitôt. Mais la piste bouge entre-temps (rêves, apprentissage des étapes précédentes) : la case vue ne porte plus la même tuile au moment de l'ordre dans 24 % des parties aléatoires et environ 10 % des parties où l'on rêve.

### 7. Attendre contredit contrer
Les reptiles « se résolvent après l'ordre » mais « contrent » : après l'ordre, la forêt est déjà abattue. Le moteur les fait agir après le tirage et avant que la Machine bouge.

### 8. La piste peut bouger entre le tirage et l'apprentissage
Une embuscade peut mettre une Machine HS ; si elle était égarée (ou si le bruit est activé), un esprit entre ou bouge, et peut déplacer ou faire oublier la tuile qui vient d'être tirée. C'est la seule erreur rencontrée (58 parties, environ 1 sur 2 000). Le moteur applique désormais l'apprentissage à la tuile là où elle se trouve.

### 9. Un peuple seul ne peut rien mettre HS
Sans alliance possible, un peuple n'atteint que son propre organe (ou aucun). Le silence est impossible pour les six peuples joués seuls. À prévoir pour le jeu solo, qui suppose de piloter au moins deux peuples.

### 10. Une Machine sans moteur abat encore
Par défaut, un organe neutralisé n'a aucun effet avant la mise HS : le journal montre des Machines « moteur neutralisé » qui abattent. Probablement peu lisible pour des joueurs. Variante testée (chenilles HS = immobile, moteur HS = n'abat plus) : elle tourne sans problème.

## 4. Signaux structurels
*Pas de l'équilibrage : des propriétés qui découlent directement des règles et qu'aucun réglage fin ne corrigera.*

- **Le rêve court-circuite la partie.** De la case 12 au centre, il y a 5 cases. Avec un esprit de départ, 5 cartes en rêve suffisent ; deux joueurs ont 10 cartes et 6 emplacements par tour. Bots gloutons qui envoient 3 cartes en rêve au premier tour : sommeil au tour 1 dans 98 % des parties, avec 19,8 forêts sur 21. Une carte par tour : sommeil dans 99 % des parties, au tour 2,4 en moyenne, avec plus de forêt (18,4) qu'en défendant sans jamais rêver (16,3). Perdre une carte ne pèse pas assez face à une distance aussi courte.
- **Les pouvoirs sans coût neutralisent le Méchant.** Dans leur forme retenue, chez des gloutons qui ne rêvent pas, Hanter annule environ 10 ordres sur 18 dans les duos avec les entités, et l'embuscade des reptiles en immobilise environ 9 (les ordres ne réussissent plus que dans 19 à 33 % des cas). Ces pouvoirs ont besoin d'une limite ou d'un coût, quelle que soit leur forme finale.
- **Le silence est rare.** 1,7 % des parties gloutonnes. Il n'apparaît vraiment qu'avec deux spécialistes des Machines (mammifères + insectes : 16 %) ; les phares n'ont qu'un spécialiste et les Renforts ajoutent des organes.
- **Le Méchant apprend surtout des réussites.** 86 % des ordres réussissent avec les bots aléatoires, 52 % avec des gloutons qui défendent sans rêver. La piste ne se fige pas : 12 à 14 échanges par partie, 1 à 2 tirages sans mouvement.
- **Les égalités sont la règle, pas l'exception.** Par partie, 5 à 7 égalités entre zones et 4 à 6 entre Machines ; 2 à 4 ne se tranchent qu'au numéro de zone. En cause : un plateau symétrique et deux Machines qui partent de la même zone.

## 5. Lacunes

### Celles qui arrivent en jeu (comptées par le moteur)

| Lacune | Parties concernées (aléatoire) | Par partie (aléatoire / glouton défenseur) | Choix par défaut |
|---|---|---|---|
| Plusieurs zones satisfont le critère | 99 % | 5,1 / 6,5 | Plus de forêt, puis plus proche d'une Machine, puis numéro de zone |
| Plusieurs Machines « la plus proche » | 99 % | 4,1 / 5,7 | La plus avancée, puis l'ordre des cartes |
| Égalité tranchée au numéro de zone | 94 % | 2,5 / 4,3 | Plus petit numéro |
| Percée : la Machine est déjà au cœur | 61 % | 1,3 / 0,3 | Elle vise sa propre zone |
| Plusieurs chemins vers la cible | 59 % | 0,7 / 0,2 | Zones non barrées, puis départage |
| Représailles sans attaque préalable | 56 % | 1,4 / 0,7 | Repli sur Cupidité |
| Représailles vise une attaque d'un tour précédent | 34 % | 0,6 / 0,8 | Accepté |
| Insecte glissé sous une étape sans carte hôte | 18 % | 0,2 / 0 | La carte agit seule |
| Réparer relance une Machine HS | 5 % | 0,05 / 0,37 | Permis |
| Un joueur n'a plus de carte | 2 % | 0,02 / 0 | Il ne joue plus |
| Silence alors que la réserve n'est pas vide | presque tous les silences | | Silence atteint |
| Tuile déplacée entre tirage et apprentissage | 0,1 % | | Apprend là où elle est |

### Celles qu'on rencontre en codant

**Mise en place.** Plateau (zones, adjacences, forêt, rivière) ; nombre, organes et position des Machines, taille de la réserve ; composition et placement de la piste, esprits de départ ; nombre et placement des pions de présence, aucun moyen d'en ajouter ; paquet de 7 pour une main de 5 sans pioche, les deux cartes restantes ne servent jamais.

**Tour de jeu.** Lien entre moitié de carte et actions de base ; qui choisit l'action et la zone, et quand ; sens de « agissent ensemble » (un allié présent, ou un allié qui sabote aussi) ; ce qu'un spécialiste neutralise seul ou en alliance ; effet d'un organe neutralisé avant la mise HS, sort d'une Machine HS ; moment du contrôle de fin de partie ; effet d'un esprit tiré aux dés (aujourd'hui : aucun effet durable).

**Ordres du Méchant.** Réussite des ordres de chantier ; Réparer (quelle Machine, quel organe) ; Renfort (où entre la Machine) ; Représailles (« viennent d'être attaquées » : depuis quand ?) ; Percée (« droit devant » sur un plateau non orienté) ; Opportunisme (« la moins défendue » : pions, cartes, barrages ?).

**Peuples.** Voir (une carte face cachée ne peut rien révéler pendant le conseil) ; Hanter (« faire rêver tout de suite » sur la piste) ; Tromper (révélé avant les dés : choix au moment de l'apprentissage ?) ; Parler (quelles cartes, vers quelles étapes) ; S'unir (se glisser sous une carte posée en même temps, face cachée) ; Attendre et « immobiliser » ; Se fondre (permanent ou lié à la moitié plateau) ; Voler (portée ; porter et semer) ; Tenir (permanent ou par carte ; Machine déjà dans la zone) ; Égarer (« entièrement égarée » est impossible au sens strict, les entités ne neutralisant que les phares).

**Fin de partie.** Déclencheur d'obsession ; escalade ; échelle de résultats.

Le détail de chaque choix par défaut et de ses alternatives est dans `foret/lacunes.py`.

## 6. Décisions prises (11 oct. 2026)
Les dix questions posées ici ont été tranchées par l'auteur ; les règles qui en découlent sont dans « Règles de la maquette v1 ».
1. **Barrage** : si la Machine ne peut pas faire son pas ou se trouve dans une zone barrée, elle ne fait rien et l'ordre échoue.
2. **Échec face à un esprit** : la tactique reste en place ; un échec ne fait jamais avancer un esprit.
3. **Rêve** : au plus un rêve par joueur et par tour ; aucun esprit au départ.
4. **Moitié de carte et actions de base** : modèle confirmé.
5. **Ordres de chantier** : réussite = l'ordre a eu un effet.
6. **Obsessions** : retirées de la maquette.
7. **Hanter et embuscade** : une fois par tour chacun.
8. **Égalités** : plateau asymétrique, Machines séparées au départ, règle de départage fixe.
9. **Mise en place** : piste de départ fixe, présence posée par les joueurs.
10. **Fin de partie** : immédiate.

L'audit de conformité qui a suivi a ajouté quatre précisions : Tenir barre toutes les zones des mammifères ; les mammifères sabotent seuls n'importe quel organe ; les reptiles ne sabotent jamais ; une Machine prise en embuscade reste immobile jusqu'à la fin du tour.

## 7. Mode d'emploi
Ce moteur v0 est remplacé par le moteur v1 (archive `foret_moteur_v1.zip`), qui conserve ses règles sous forme de maquette (`maquettes/v0.json`) : `python -m foret.sim reference --maquette v0` rejoue la campagne ci-dessus.
