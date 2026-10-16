# Règles de la maquette v1

*Statut (12 oct. 2026) : règles jouables de la maquette, implémentées par le moteur v1. Elles intègrent les dix décisions du 11 oct. et les précisions de l'audit de conformité (voir en fin de document). Le 12 oct. (moteur 1.2, décision A2 de la phase 0), le conseil est aligné sur le livret de la maquette HTML : communication, présage, puis programmation en silence (R2.1, R2.5, R2.6). Le 12 oct. au soir (moteur 1.5, décision B4 de fin de phase 1), R4.3 et R6.2 précisent deux cas permis. Les valeurs chiffrées, le plateau et la piste de départ sont provisoires.*
*Voir aussi : « Synthèse des idées - revue du 11 oct. 2026 » (les idées et leurs notes), « Moteur de règles v1 - conformité et campagne de référence » (résultats).*

Chaque règle porte un identifiant (R1.1, R1.2…). Le moteur et ses tests y renvoient ; le contrôle de conformité signale toute règle sans test.

## 0. En une phrase
Chacun à la tête d'un peuple de la forêt, les joueurs défendent ensemble la forêt contre les Machines du Méchant pendant une journée de 6 tours : ils font échouer ses ordres, mettent ses Machines hors service ou l'endorment.

## 1. Mise en place

**R1.1 Plateau.** Des zones numérotées, chacune avec des forêts. Les zones voisines sont reliées ; certaines liaisons sont des rivières. Chaque zone a une profondeur : lisière (côté chantier), milieu, cœur.

Plateau provisoire (forêts entre parenthèses ; 21 forêts) :
```
  Z1 (2) ───── Z2 (1) ───── Z3 (2)     lisière
    │        ╱        ╲        ≈
    │      ╱            ╲      ≈
  Z4 (3) ──────────────── Z5 (4)       milieu
    ≈            ╱             ≈
    ≈          ╱               ≈
  Z6 (4) ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ Z7 (5)       cœur
```
Liaisons : Z1-Z2, Z2-Z3, Z1-Z4, Z2-Z4, Z2-Z5, Z3-Z5, Z4-Z5, Z4-Z6, Z5-Z6, Z5-Z7, Z6-Z7. Les liaisons ≈ forment une rivière : Z3-Z5-Z7-Z6-Z4.

**R1.2 Machines.** Chaque Machine a 2 ou 3 organes parmi moteur, chenilles, phares. Trois Machines commencent en lisière, une par zone : (1) Bouteur, moteur + chenilles, en Z1 ; (2) Abatteuse, moteur + chenilles + phares, en Z2 ; (3) Pelleteuse, moteur + phares, en Z3. Deux attendent en réserve : (4) Débardeuse, moteur + chenilles ; (5) Broyeuse, moteur + chenilles + phares.

**R1.3 Piste des pensées.** 11 cases numérotées de 2 à 12, une tuile par case. Disposition de départ, fixe et sans esprit :

| Case | 2 | 3 | 4 | 5 | 6 | **7** | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tuile | Renfort | Réparer | Percée | Représailles | Opportunisme | **Cupidité** | Opportunisme | Représailles | Percée | Cupidité | Cupidité |

Chances de départ sur 36 : Opportunisme 10, Cupidité 9, Représailles 8, Percée 6, Réparer 2, Renfort 1. Le Méchant est cupide : Cupidité tient le centre et a une troisième tuile, en 12, la première que le rêve lui fera oublier.

**R1.4 Cartes.** Chaque joueur prend un peuple. Son paquet compte 7 personnages ; il en tire 5 au hasard, qui forment sa main pour toute la partie (pas de pioche).

**R1.5 Présence.** Chaque peuple a 3 pions de présence. À tour de rôle, en commençant par le premier joueur, chacun pose un pion dans la zone de son choix, jusqu'à ce que tous soient posés. Plusieurs pions peuvent partager une zone.

## 2. Le tour
Une partie dure 6 tours de 3 étapes.

**R2.1 Conseil.** Le conseil suit cet ordre : Voir (oiseaux, R6.2) ; la communication (R2.5) ; le présage (R2.6) ; puis la programmation, en silence : chacun, en secret et en même temps, pose au plus une carte face cachée sur chacune des 3 étapes (il peut en laisser vides autant qu'il veut). Chaque carte est orientée, moitié haute ou basse, ou part en rêve.

**R2.2 Un rêve par tour.** Chaque joueur envoie au plus une carte en rêve par tour.

**R2.3 Résolution.** Les étapes se résolvent l'une après l'autre. Pour chaque étape :
1. On révèle les cartes de l'étape (les embuscades restent cachées, R6.6).
2. Les personnages qui vont ailleurs (Aller) se déplacent, dans l'ordre des joueurs.
3. Les cartes en rêve font rêver le Méchant (R5.3).
4. Les autres personnages choisissent leur zone et leur action, dans l'ordre des joueurs ; puis les barrages et les sabotages s'appliquent.
5. On lance les deux dés : le Méchant donne son ordre (R4).
6. Les embuscades se révèlent et agissent.
7. La Machine exécute l'ordre, puis le Méchant apprend (R5.2).

**R2.4 Fin du tour.** On reprend en main les cartes jouées, sauf celles parties en rêve. Le rôle de premier joueur passe au joueur suivant.

**R2.5 Communication.** Avant de programmer, les joueurs communiquent sous la forme que fixe la maquette ; ils ne montrent jamais leur main.
- *Le conseil parlé* (maquette v1, livret) : on parle des zones, des tactiques, des Machines et de ses intentions (« je m'occupe de la Clairière »), sans dire quelle moitié ni quelle étape on jouera. Le moteur l'approche par des traces non datées : jusqu'à 3 par joueur, chacune dit « ce tour, j'agirai dans cette zone » (ou « je rêve »).
- *Les traces* (maquette v2) : chaque joueur pose jusqu'à 2 traces numérotées par étape, sur une zone ou sur le rêve : « à cette étape, j'agirai ici » (ou « je rêve »). Sans ordre de tour, on pose, reprend et déplace jusqu'à ce que plus rien ne bouge ; les traces sont alors figées. Elles n'engagent à rien, sauf si la maquette le dit : une trace qui engage oblige à poser une carte à cette étape, à la faire agir dans cette zone (ou rêver) ; si c'est impossible, la carte est libre.
- *Le partage* (façon The Gang) : deux jetons par Machine en marche ; sans ordre de tour, chacun prend un jeton au centre ou devant un autre joueur (au plus 2 devant soi, un seul par Machine), ou en rend un. Un jeton dit « ce tour, je m'occupe de cette Machine ».
- *Aucun signe* (témoin) : personne ne communique.
- *Tout dire* (témoin) : mains ouvertes ; chacun annonce zone et étape de chacune de ses cartes, et voit les programmes déjà faits.
Les traces et les jetons ne comptent pas comme des présences et sont retirés à la fin du tour. Modèle du moteur pour « sans ordre de tour » : des rondes dans l'ordre des joueurs (au plus 3), jusqu'à ce que plus rien ne bouge.

**R2.6 Le présage.** Quand la communication est close, on lance les dés de la première étape et on les pose sur la case Présage : tout le monde voit le premier plan du Méchant. Ils serviront à la première étape. S'ils y sont déjà (un oiseau les a lancés, R6.2), on ne relance pas. La tuile est lue au moment de l'ordre : un rêve de la première étape peut changer ce que le présage annonçait.

## 3. Les personnages

**R3.1 Agir.** Une carte révélée agit dans une zone où son peuple est présent. Son joueur choisit la zone et l'action au moment de la révélation, à découvert. Il y a trois actions : Aller, Barrer, Saboter.

**R3.2 Aller.** Déplacer un pion de présence vers une zone voisine. Le personnage agit alors dans la zone d'arrivée.

**R3.3 Barrer.** Pendant l'étape, aucune Machine ne peut entrer dans la zone, en sortir, ni y abattre.

**R3.4 Saboter.** Neutraliser un organe intact d'une Machine de la zone. Il faut un allié dans la zone, sauf pour un spécialiste (R6.1). Les reptiles ne sabotent jamais (R6.12).

**R3.5 Alliance.** Deux personnages de peuples différents qui agissent dans la même zone à la même étape sont alliés, quel que soit l'ordre de leurs choix. Chacun fait sa propre action : deux alliés qui sabotent neutralisent deux organes.

**R3.6 Rêver.** Une carte envoyée en rêve quitte la main pour le reste de la partie et fait rêver le Méchant (R5.3).

**R3.7 Moitiés de carte.** Chaque moitié d'une carte correspond à l'un des deux compartiments du peuple. La moitié choisie active la règle que le peuple brise dans ce compartiment (R6), en plus de l'action de base. Exception : l'invisibilité des reptiles est permanente (R6.7).

**R3.8 Machine HS.** Une Machine dont tous les organes sont neutralisés est hors service : elle reste sur le plateau, inerte.

## 4. L'ordre du Méchant

**R4.1 Tirage.** La tuile de la case désignée par les dés donne l'ordre. Si c'est un esprit, le Méchant rêve : pas d'ordre, pas d'apprentissage.

**R4.2 Tactiques.** Une tactique désigne une zone boisée selon son critère :
- *Cupidité* : la plus boisée ;
- *Opportunisme* : la moins défendue (le moins de pions de présence visibles) ;
- *Représailles* : la dernière zone où un organe a été neutralisé (s'il n'y en a pas encore : comme Cupidité) ;
- *Percée* : devant la Machine en marche la plus avancée, c'est-à-dire une zone voisine plus profonde (s'il n'y en a pas, sa propre zone).

**R4.3 Exécution.** La Machine en marche la plus proche de la zone visée fait un pas vers elle (sauf si elle y est déjà), puis abat 1 forêt dans la zone où elle se trouve. Si la zone visée est barrée mais que la Machine n'y entre pas à ce pas, elle abat là où elle s'arrête : barrer la zone visée ne protège pas d'une Machine encore à deux pas (décision B4 du 12 oct.).

**R4.4 Ordre empêché.** Si un barrage l'empêche de faire son pas ou d'abattre (R3.3), ou si elle est immobilisée (R6.6), la Machine ne fait rien : l'ordre échoue. Quand plusieurs pas sont possibles, elle prend une zone non barrée.

**R4.5 Ordres de chantier.** *Réparer* : un organe de la Machine la plus endommagée est remis en état, même si elle est HS (moteur d'abord, puis chenilles, puis phares). *Renfort* : la première Machine de la réserve entre en lisière (zone choisie selon R7.1).

**R4.6 Réussite.** Un ordre réussit s'il a eu un effet : forêt abattue, organe réparé, Machine entrée. Sinon il échoue.

## 5. La piste des pensées

**R5.1 Les côtés.** Cases 2 à 6 : l'éveil. Case 7 : le centre. Cases 8 à 12 : le rêve.

**R5.2 Apprendre.** Après chaque ordre, sa tuile échange sa place avec une voisine :
- s'il a réussi, celle du côté du 7 (au 7, elle reste) ; si c'est un esprit, il recule (le tir à la corde) ;
- s'il a échoué, celle du côté du bord (du 7, elle passe en 8 ; en 2 ou en 12, elle reste) ; si c'est un esprit, la tuile reste en place.

**R5.3 Faire rêver.** Soit un esprit entre en case 12 (la tuile qui s'y trouvait est oubliée : retirée du jeu), soit un esprit déjà sur la piste avance d'une case vers le 7, en échangeant sa place avec la tuile voisine. Un esprit n'avance pas sur un autre esprit ; si le 12 est déjà occupé par un esprit, il faut en faire avancer un.

**R5.4 Le long sommeil.** Dès qu'un esprit atteint le 7, le Méchant s'endort.

## 6. Les peuples
Chaque peuple intervient dans deux compartiments et y brise une règle.

| Peuple | Moitié haute | Moitié basse |
|---|---|---|
| Oiseaux | Méchant : *Voir* | plateau : *Voler* |
| Mammifères | plateau : *Tenir* | Machines : *Renverser* |
| Reptiles | plans : *Attendre* | plateau : *Se fondre* |
| Insectes | plans : *S'unir* | Machines : *Enrayer* |
| Humains | Méchant : *Tromper* | plans : *Parler* |
| Entités | Méchant : *Hanter* | Machines : *Égarer* |

**R6.1 Les spécialistes des Machines.** Joués sur leur moitié Machines, ils sabotent seuls : les mammifères n'importe quel organe (*Renverser* : ils piègent sans allié), les insectes le moteur (*Enrayer*), les entités les phares (*Égarer*).

**R6.2 Voir (oiseaux).** Pendant le conseil, avant la programmation, l'oiseau peut poser des cartes face visible, moitié haute, sur ses étapes ; pour chacune, on lance aussitôt les dés de l'étape, et ce tirage sera celui de son ordre. Comme pour le présage, la tuile est lue au moment de l'ordre : un rêve de l'étape peut changer ce que l'oiseau a vu (décision B4 du 12 oct.).

**R6.3 Voler (oiseaux).** Aller vers n'importe quelle zone.

**R6.4 Tenir (mammifères).** La carte barre toutes les zones où les mammifères sont présents, pendant son étape, en plus de son action.

**R6.5 Égarer (entités).** Une Machine mise HS alors que ses phares ont été égarés quitte le plateau et fait rêver le Méchant (R5.3), sans compter dans la limite de R2.2.

**R6.6 Attendre (reptiles).** La carte est en embuscade : elle reste cachée à la révélation, puis agit après le tirage des dés, avant que la Machine bouge. Elle peut Aller ou Barrer, ou bien immobiliser la Machine désignée par l'ordre, si celle-ci est dans une zone où les reptiles sont présents ou va y entrer : jusqu'à la fin du tour, cette Machine ne bouge plus et n'abat plus (R4.4). Une immobilisation par tour.

**R6.7 Se fondre (reptiles).** En permanence, leur présence est invisible aux critères du Méchant. Moitié plateau : Aller le long d'une rivière, aussi loin que voulu.

**R6.8 S'unir (insectes).** À la programmation, l'insecte peut glisser sa carte sous l'étape d'un autre joueur. Elle agit alors dans la zone de la carte de ce joueur, et ils sont alliés, même si les insectes n'y sont pas présents. Si ce joueur n'a pas joué de carte à cette étape (ou l'a envoyée en rêve), elle agit seule.

**R6.9 Tromper (humains).** Au moment où le Méchant apprend, à l'étape de la carte, l'humain peut inverser ce qu'il apprend : une réussite compte comme un échec, et inversement.

**R6.10 Parler (humains).** Quand la carte agit, l'humain peut déplacer une carte encore cachée d'une étape suivante (la sienne ou celle d'un autre joueur) vers une autre étape suivante ; si ce joueur a déjà une carte sur cette étape, les deux cartes s'échangent. Une carte d'insecte glissée suit sa carte. Un déplacement qui mettrait deux cartes d'un même joueur sur une étape n'est pas permis.

**R6.11 Hanter (entités).** Quand la carte agit, l'entité peut annuler l'ordre de l'étape : on ne lance pas les dés. Une fois par tour.

**R6.12 Contrer sans détruire (reptiles).** Les reptiles ne sabotent jamais, même en alliance : il faut un autre peuple pour achever ce qu'ils immobilisent.

## 7. Égalités
**R7.1 Zones.** Entre plusieurs zones : la plus boisée, puis la plus proche d'une Machine en marche, puis le plus petit numéro.

**R7.2 Machines.** Entre plusieurs Machines (à même distance de la zone visée, aussi avancées, aussi endommagées) : la plus avancée, puis le plus petit numéro.

## 8. Fin de partie
**R8.1 Trois fins.** La partie s'arrête aussitôt :
- *le long sommeil* : un esprit atteint le 7 ;
- *le silence du chantier* : plus aucune Machine ne tourne sur le plateau ;
- sinon *la nuit*, à la fin du 6e tour : le Méchant rentre chez lui et reviendra.

**R8.2 Bilan.** On compte la forêt restante. Il n'y a pas de défaite.

---

## Ce qui change depuis la maquette v0

| Point | v0 | v1 |
|---|---|---|
| Barrage | La Machine contourne : un barrage seul n'arrête jamais un ordre lointain | Bloquer son pas ou sa zone fait échouer l'ordre (R3.3, R4.4) |
| Échec face à un esprit | L'esprit avance (et peut endormir le Méchant) | La tuile reste en place (R5.2) |
| Rêves | Sans limite, un esprit au départ | Un par joueur et par tour (R2.2), aucun esprit au départ (R1.3) |
| Réussite | « Forêt abattue » : les ordres de chantier échouaient toujours | « L'ordre a eu un effet » (R4.6) |
| Obsessions | Déclencheur en 6-7-8, impossible avec 2 tuiles par tactique | Retirées de la maquette |
| Hanter | Annule l'ordre à chaque carte | Au choix, une fois par tour (R6.11) |
| Embuscade | Immobilise pour l'étape, sans limite ; les reptiles sabotent en alliance | Immobilise jusqu'à la fin du tour, une fois par tour (R6.6) ; les reptiles ne sabotent jamais (R6.12) |
| Tenir | Une Machine qui entre dans la zone de la carte s'arrête | Toutes les zones des mammifères sont barrées (R6.4) |
| Renverser | Seuls : les chenilles | Seuls : n'importe quel organe (R6.1) |
| Égalités | Plateau symétrique, deux Machines dans la même zone | Plateau asymétrique, une Machine par zone, règle unique (R7) |
| Mise en place | Piste et présence au hasard | Piste fixe (R1.3), présence posée par les joueurs (R1.5) |
| Fin de partie | Vérifiée en fin de tour (texte) | Immédiate (R8.1) |
| Action « ne rien faire » | Possible (servir d'allié sans agir) | Supprimée : Barrer joue ce rôle sans inconvénient |

## Simplifications de rédaction
- **Barrer dit tout** : « aucune Machine ne peut entrer dans la zone, en sortir, ni y abattre » (R3.3). Une seule phrase règle ensuite tous les cas d'échec (R4.4), et Tenir réutilise Barrer au lieu d'introduire un « arrêt » (R6.4).
- **Une seule définition de la réussite** pour tous les ordres : « il a eu un effet » (R4.6).
- **Apprendre tient en un geste** et une exception (R5.2).
- **Les trois spécialistes des Machines sont réunis** en une règle (R6.1).
- **Toutes les égalités sont dans une seule section** (R7).
- **Hanter n'invoque plus le rêve** : on ne lance simplement pas les dés (R6.11).
- **Trois actions au lieu de quatre** : Rêver devient une façon de jouer la carte (R2.1, R3.6), et l'action « ne rien faire » disparaît.

## Décisions du 12 oct. 2026 (fin de phase 1, décision B4)
Deux cas que le moteur comptait comme incohérences sont permis par les règles écrites ; ils sont comptés à part, comme le présage détourné :
- une Machine encore à deux pas de sa cible barrée fait un pas libre et abat là où elle s'arrête (R4.3) ;
- un rêve de l'étape peut changer la tuile qu'un oiseau a vue avec Voir : les dés restent, la tuile est lue au moment de l'ordre (R6.2).

## Décisions du 12 oct. 2026 (phase 0, décision A2)
Le conseil suit le livret : communication, présage, programmation en silence (R2.1, R2.5, R2.6). La référence publiée le 11 oct. (moteur 1.0, sans communication ni présage) se rejoue avec la variante `reference_1_0` et le glouton réglé comme en 1.0 (`communique` et `des_connus` à false) ; la variante `sans_presage` ne retire que le présage. Variantes de mesure : `comm_aucun_signe`, `comm_traces`, `comm_traces_engagent`, `comm_partage`, `comm_tout_dire`.

## Décisions du 11 oct. 2026
1. Barrage = ordre échoué (bloquer le pas ou la zone de la Machine).
2. Une tactique qui échoue ne fait jamais avancer un esprit : elle reste en place.
3. Au plus un rêve par joueur et par tour ; pas d'esprit au départ.
4. Toute carte fait une action de base ; la moitié choisie active la règle brisée ; action et zone choisies à la révélation.
5. Réussite d'un ordre = il a eu un effet.
6. Obsessions retirées de la maquette (l'idée reste dans la synthèse).
7. Hanter : une fois par tour. Embuscade : une immobilisation par tour.
8. Plateau asymétrique, Machines séparées au départ, règle d'égalité unique.
9. Piste de départ fixe, présence posée par les joueurs.
10. Fin de partie immédiate.

**Précisions de l'audit de conformité (11 oct., réponses de l'auteur)** : Tenir barre toutes les zones des mammifères (R6.4) ; Renverser permet aux mammifères de saboter seuls n'importe quel organe (R6.1) ; une tactique qui échoue face à un esprit reste en place (R5.2) ; les reptiles ne sabotent jamais, et la Machine prise en embuscade reste immobile jusqu'à la fin du tour (R6.6, R6.12).

**Choix faits à la rédaction, à confirmer** : l'embuscade agit après les dés et avant la Machine, avec les actions de base (R6.6) ; l'invisibilité des reptiles est permanente (R6.7) ; les étapes vides sont libres (R2.1) ; deux alliés font chacun leur action (R3.5) ; Hanter est un choix du joueur (R6.11) ; une Machine immobilisée reste désignée par les ordres, qui échouent (R4.4) ; Parler ne peut pas mettre deux cartes d'un joueur sur une étape (R6.10) ; la troisième tuile Cupidité (R1.3).

## Points encore ouverts
Ces points ont un choix par défaut dans le moteur, qui en compte les occurrences ; ils restent à trancher.
- **Main de départ** : 5 cartes tirées au hasard sur 7 ; les 2 autres ne servent pas.
- **Critères** : Représailles (« viennent d'être attaquées » : depuis quand ?), Percée (« droit devant » sur un plateau non orienté), Opportunisme (que compte « défendue » ?). La liste des critères est notée 4.
- **Silence avec une réserve non vide** : atteint aujourd'hui.
- **Joueur sans carte** : il ne joue plus.
- **Hanter** : « faire rêver tout de suite » est interprété comme l'annulation de l'ordre.
- **Zone visée, zone abattue** : une Machine à deux zones ou plus de sa cible abat en chemin (R4.3) ; barrer la zone visée ne protège alors rien. Permis (décision B4 du 12 oct.) ; reste à savoir si c'est lisible pour des joueurs.
- **Représailles** : sans limite de temps, elles visent souvent une attaque d'un tour précédent.

Hors maquette pour l'instant : le bruit (5), le dernier sursaut (6), l'escalade de fin de partie (à repenser), les pouvoirs propres aux personnages (porter, semer), l'échelle de résultats du bilan.

## Annexe : où régler quoi
Toute la maquette est décrite dans `maquettes/v1.json`, qui n'écrit que ses différences avec `maquettes/v0.json`. Une nouvelle itération se fait en créant `v2.json` avec `"base": "v1"`.

| Règle | Réglage |
|---|---|
| R1.1-R1.3 | `plateau`, `machines`, `piste` (`placement` fixe ou hasard), `tuiles` |
| R1.4, R1.5 | `cartes`, `presence` |
| R2.2 | `regles.reves_par_joueur_et_tour` |
| R2.5 | `regles.communication` (`parle` ; `traces`, `partage`, `aucun_signe`, `tout_dire`), `traces_par_joueur`, `traces_datees`, `traces_engagent`, `partage_max`, `rondes_conseil` |
| R2.6 | `regles.presage` |
| R3.3, R4.4 | `regles.barrage` (`bloque` ; `v0` = la Machine contourne) |
| R3.4, R6.12 | `peuples.<peuple>.actions` |
| R3.5 | `regles.alliance` (`presence` ; `conjointe` = l'allié doit aussi saboter) |
| R4.2 | `tuiles.<tuile>.critere` et `params` |
| R4.6 | `regles.reussite` |
| R5.2 | `regles.echec_face_esprit` |
| R6 | `peuples` (quel pouvoir sur quelle moitié), `pouvoirs.<pouvoir>` (paramètres, `par_tour`, `actif`) |
| R7 | `regles.departage_zones`, `regles.departage_machines` |
| R8.1 | `regles.fin_de_partie`, `regles.silence_reserve_vide` |
| Témoins de mesure (moteur 1.4, jamais des règles du jeu) | `regles.des_fixes` (dés truqués), `regles.apprentissage` (`false` : le Méchant n'apprend plus) ; variantes `temoin_*` (voir `docs/mesures.md`) |
