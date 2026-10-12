# Moteur de règles v1 : conformité et campagne de référence

*Statut (11 oct. 2026) : maquette v1 rédigée, moteur refondu et audité règle par règle, campagne de référence rejouée sur v0 et sur v1, plus une campagne qui mesure l'effet de chaque décision. 296 700 parties, aucune erreur. Comme en v0, les chiffres servent à repérer des problèmes de règles, pas à équilibrer le jeu.*
*Voir aussi : « Règles de la maquette v1 » (les règles numérotées R1.1 à R8.2), « Moteur de règles v0 - lacunes et incohérences » (le point de départ).*

## En bref
- **Les règles v1 sont écrites, numérotées et plus courtes** : 43 règles. Chacune renvoie au code qui l'applique et à au moins un test ; un contrôle automatique le vérifie (43 sur 43).
- **L'audit de conformité a trouvé quatre écarts**, tranchés par l'auteur (Tenir, Renverser, reptiles, embuscade). Il a aussi trouvé **deux bugs dans Parler**. Le premier existait déjà en v0, sans être détecté : un insecte pouvait se retrouver avec deux cartes sur une même étape, dans 15 % des parties au hasard.
- **Le nouveau moteur reproduit l'ancien** : sur la maquette v0, la même campagne donne les mêmes résultats à 0,1 point près. Les écarts entre v0 et v1 viennent donc des règles, pas de la refonte.
- **Les décisions ont fait leur effet.** Il n'y a plus de sommeil causé par un échec, ni d'esprit poussé par un échec. Le barrage contourné tombe de 39 % à 3 % des parties gloutonnes, les égalités tranchées au numéro de zone sont divisées par quatre, et plus aucune partie ne finit au tour 1 (contre 25 % des parties gloutonnes en v0).
- **Le rêve reste la stratégie dominante.** Avec un rêve par tour, des gloutons endorment le Méchant dans 92 % des parties, vers le tour 3, en gardant 86 % de la forêt. En défendant sans rêver, ils n'en gardent que 67 %. Le silence, lui, ne s'obtient presque qu'avec les mammifères.

## 1. Ce qui a été fait

**Les règles v1** (document « Règles de la maquette v1 ») intègrent les dix décisions et les précisions de l'audit. La rédaction a été simplifiée :
- Barrer tient en une phrase qui règle tous les cas d'échec (R3.3, R4.4), et Tenir la réutilise ;
- une seule définition de la réussite vaut pour tous les ordres (R4.6) ;
- apprendre tient en un geste et une exception (R5.2) ;
- les trois spécialistes des Machines sont réunis en une règle (R6.1) ;
- toutes les égalités sont dans une seule section (R7) ;
- il reste trois actions au lieu de quatre, puisque rêver devient une façon de jouer la carte.

Les choix que j'ai faits moi-même à la rédaction sont listés à part, à confirmer.

**Le moteur v1** a été refondu pour être générique et facile à faire évoluer :
- **Les règles sont des données.** Une maquette JSON par version. La v1 hérite de la v0 et n'écrit que ses différences ; une v2 fera de même. Les variantes sont déclarées dans la maquette, et une clé mal orthographiée est refusée au chargement.
- **Les mécaniques sont dans des registres.** Critères des tactiques, ordres de chantier, pouvoirs des peuples : en ajouter un, c'est écrire une fonction et la citer par son nom dans la maquette.
- **Les joueurs ne font que répondre à des questions.** Le moteur pose des questions typées (où poser un pion, quelle carte, quelle action…) avec la liste des réponses permises. Un bot qui ne connaît pas une question répond au hasard : une règle nouvelle ne casse aucun bot.
- **Les observateurs reçoivent tout ce que le moteur signale** : lacunes, incohérences, statistiques, journal. Un nouveau détecteur de cas problématique s'y branche sans toucher au moteur.
- **Les campagnes sont des fichiers JSON.** Chacune croise variantes, bots et tables, et se rejoue sur n'importe quelle maquette. Un comparateur met deux campagnes côte à côte.

## 2. Audit de conformité

**Méthode.** J'ai confronté le moteur v0 au texte de la synthèse du 11 oct., phrase par phrase. Les écarts qui relevaient d'un choix de conception ont été soumis à l'auteur. Puis chaque règle v1 a reçu un identifiant, un renvoi dans le code et au moins un test. Le contrôle `foret.conformite` signale toute règle sans test et tout renvoi vers une règle disparue.

### Écarts entre le moteur v0 et le texte

| Point | Le texte | Le moteur v0 | v1 |
|---|---|---|---|
| Tenir | « une zone où ils sont présents fait barrage » | Seulement la zone où agit une carte | La carte barre toutes les zones des mammifères (R6.4) |
| Renverser | « ils neutralisent les chenilles et piègent sans allié » | Seuls : les chenilles uniquement | Seuls : n'importe quel organe (R6.1) |
| Reptiles | « ils contrent sans détruire » | Ils sabotaient en alliance | Ils ne sabotent jamais (R6.12) |
| Embuscade | « il faut un peuple des Machines pour achever ce qu'ils immobilisent » | Immobilisée pour l'étape seulement | Immobilisée jusqu'à la fin du tour (R6.6) |
| Hanter | « faire rêver tout de suite » | Annulation automatique, dés lancés quand même | Au choix, sans lancer les dés (R6.11) |
| Actions | Quatre actions : Aller, Barrer, Saboter, Rêver | Une cinquième action, « rester pour servir d'allié » | Supprimée : Barrer joue ce rôle |
| Parler | « une carte encore cachée » | Pouvait déplacer une carte de Voir, face visible | Interdit (R6.10) |

### Bugs trouvés
1. **Parler pouvait mettre deux cartes d'un même joueur sur une étape.** Il suffisait de déplacer une carte vers une étape où son joueur avait déjà glissé une carte d'insecte, ou d'emmener une carte d'insecte glissée vers une étape que l'insecte occupait déjà. Le moteur v0 ne le vérifiait pas. Le nouveau contrôle montre que cela touchait 15 % des parties aléatoires en v0. Correction : ce déplacement n'est plus permis (R6.10), et le moteur vérifie à chaque étape qu'aucun joueur n'a deux cartes.
2. **Parler pouvait déplacer une carte de Voir.** Cela détachait la carte des dés déjà lancés pour son étape. C'est maintenant interdit (voir le tableau).

### Non-régression
La campagne de référence a été rejouée sur la maquette v0 avec le nouveau moteur et les mêmes bots. Les résultats sont identiques à 0,1 point près sur tous les indicateurs : fins, tour de fin, ordres réussis, cartes en rêve. Partie par partie, le bot glouton retrouve exactement les mêmes parties, sauf quand les entités hantent (Hanter ne lance plus les dés, ce qui décale le tirage).

## 3. La même campagne sur v1

Même campagne qu'en v0 : 112 350 parties, mêmes bots, mêmes tables, mêmes graines, 13 variantes. Aucune erreur. Le tableau compare la v0 et la v1 jouées par le même moteur.

| Bloc | Indicateur | v0 | v1 |
|---|---|---|---|
| Aléatoire, toutes tables (18 900) | Sommeil / nuit / silence | 36 / 64 / 0,1 % | 15 / 84 / 0,6 % |
| | Ordres réussis | 86 % | 74 % |
| | Forêt restante | 58 % | 54 % |
| Aléatoire, 13 variantes (40 950) | Sommeil | 9,0 % | 0,8 % |
| Gloutons, duos et trios (30 000) | Sommeil / nuit / silence | 72 / 26 / 1,8 % | 60 / 38 / 1,5 % |
| | Fin au tour 1 | 25 % | 0 % |
| | Tour de fin | 3,3 | 4,2 |
| | Ordres réussis | 63 % | 51 % |
| Gloutons, 5 variantes (22 500) | Sommeil / nuit / silence | 47 / 51 / 1,6 % | 41 / 57 / 2,2 % |

Selon le nombre de cartes que les gloutons envoient en rêve :

| Rêves par tour | v0 : fin, tour, forêt | v1 : fin, tour, forêt |
|---|---|---|
| 0 | nuit 94 %, silence 5 %, forêt 78 % | nuit 96 %, silence 4 %, forêt 67 % |
| 0,5 | sommeil 88 %, tour 3,9, forêt 81 % | sommeil 56 %, tour 5,1, forêt 73 % |
| 1 | sommeil 99 %, tour 2,4, forêt 88 % | sommeil 92 %, tour 2,9, forêt 86 % |
| 3 (limité à 1 en v1) | sommeil 100 %, tour 1,0, forêt 94 % | comme 1 |

*Attention à la ligne 0 :* la baisse de forêt (78 → 67 %) ne vient pas surtout des règles. Le glouton place mal sa présence : posée au hasard, avec le même bot, la forêt remonte à 77 %. La piste fixe pèse aussi (voir section 4).

**Incohérences, gloutons (part des parties concernées)**

| Incohérence | v0 | v1 |
|---|---|---|
| Barrage contourné | 39 % | 3 % |
| Esprit poussé par un échec | 27 % | 0 |
| Sommeil causé par un échec | 6,6 % | 0 |
| Voir trahi (la case vue a changé de tuile) | 6,3 % | 6,4 % |

**Lacunes, gloutons (par partie)** : égalités tranchées au numéro de zone 2,2 → 0,5 ; chemins multiples 0,35 → 0,04. En revanche, les égalités entre Machines passent de 2,9 à 5,5, Représailles sans attaque de 0,5 à 1,2, et Percée au bout du plateau de 0,2 à 0,8.

## 4. Effet de chaque décision
La maquette v1 a été rejouée en ramenant une seule décision à sa forme v0, avec des gloutons sur les 15 duos (72 000 parties). Écarts par rapport à la v1 :

| Décision ramenée à v0 | Sans rêve : forêt | Un rêve par tour : sommeil, forêt | Ce que ça dit |
|---|---|---|---|
| 1. Barrage contourné | −9 pts | −3 pts de sommeil, −4 pts de forêt | La décision la plus efficace pour la défense : les ordres réussis passent de 47 à 58 % sans elle |
| 2. Échec qui pousse l'esprit | 0 | +5 pts de sommeil | Elle retire les sommeils « par accident » |
| 3a. Rêves illimités (3 par tour) | – | sommeil au tour 1 dans 60 % des parties | Sans la limite, la partie se termine au premier tour |
| 3b. Un esprit au départ | 0 | sommeil 99 %, tour 3,0 au lieu de 3,4 | Le départ sans esprit retarde le sommeil d'un tiers de tour |
| 5. Réussite littérale | 0 | 0 | Sans effet mesurable |
| 7. Hanter et embuscade illimités | +1 pt | 0 | Peu d'effet ici, car le glouton les utilise peu (environ 1 fois par partie, contre 10 en v0) |
| 8. Plateau v0 | −6 pts | −4 pts de forêt | Le nouveau plateau divise par 4 les égalités tranchées au numéro (3,9 → 0,9 par partie) |
| 9a. Piste au hasard | +5 pts | +2 pts | La piste fixe, avec Cupidité au centre, est plus dure que la moyenne des tirages |
| 9b. Présence au hasard | +9 pts | 0 | Le glouton place moins bien que le hasard : c'est une limite du bot |
| 10. Fin vérifiée en fin de tour | 0 | sommeil 50 %, −14 pts de forêt | La fin immédiate est indispensable dès qu'on rêve |
| Renverser limité aux chenilles | +2 pts, silence 3,6 → 0,1 % | +1 pt de forêt | Presque tous les silences viennent du nouveau Renverser |
| Tenir, reptiles, action « soutenir » | 0 | 0 | Non testé : le glouton ne joue jamais Tenir et barre toujours |

## 5. Ce que révèle la v1

1. **Le rêve reste dominant.** La limite d'un rêve par tour supprime la fin au tour 1 mais ne change pas la hiérarchie : rêver une carte par tour garde 86 % de la forêt, défendre seulement 67 %. Avec deux joueurs, il faut six rêves (entrer en 12, puis cinq pas) ; le sommeil tombe donc presque toujours au tour 3. Pistes : une piste plus longue côté rêve, un coût au rêve, ou un rêve qui n'avance pas à chaque fois.
2. **Barrer est devenu l'arme principale.** Chez des gloutons qui ne rêvent pas, 8 ordres sur 17 par partie échouent sur un barrage, et le Méchant ne réussit plus que 47 % de ses ordres. Barrer ne coûte rien et chaque carte peut le faire. Cela ne crée pas de bug, mais c'est à surveiller : la profondeur du choix « où barrer ? » dépend maintenant de critères en tension.
3. **Le silence repose sur les mammifères.** Sans eux, il est presque impossible (0 à 1,3 % des duos). Avec eux, il monte jusqu'à 22 % (mammifères et insectes). Le bruit, en suspens, était prévu pour équilibrer ce pouvoir.
4. **La zone visée n'est pas toujours la zone abattue.** Une Machine à deux zones ou plus de sa cible abat en chemin, environ une fois par partie. Barrer la zone visée ne protège alors rien (16 % des parties aléatoires). Les joueurs doivent lire la Machine, pas l'ordre : c'est une question de lisibilité.
5. **Nouvelles lacunes fréquentes** :
   - le conflit de Parler avec les cartes glissées (17 % des parties aléatoires), désormais réglé par R6.10 ;
   - un ordre qui désigne une Machine immobilisée (10 à 21 % des parties) : elle reste désignée et l'ordre échoue, choix à confirmer ;
   - Représailles qui vise une attaque ancienne (30 à 58 % des parties), faute de limite de temps.
6. **Les égalités entre Machines restent nombreuses** (4 à 6 par partie). R7.2 les tranche, mais c'est autant de petites vérifications pour les joueurs.
7. **Les bots sont trop pauvres pour certaines règles.** Le glouton place sa présence moins bien que le hasard, ne joue presque jamais Tenir (0,07 zone barrée par partie) et réagit toujours de la même façon. Une partie des nouvelles règles (Tenir, les limites de Hanter et de l'embuscade) n'a donc pas encore été vraiment éprouvée.

## 6. Pour la campagne suivante (bots diversifiés)
Ce que le moteur offre déjà :
- une interface de bot unique (une méthode par type de question) ;
- un registre où déclarer un nouveau bot ;
- des paramètres de style sur le glouton : rêves par tour, cartes gardées en main, seuil de menace, moitiés préférées, placement de la présence ;
- des campagnes en JSON qui croisent bots, variantes et tables ;
- des observateurs pour brancher de nouveaux détecteurs.

Ce qu'il faudra ajouter :
- des tables qui mêlent plusieurs bots (aujourd'hui, un même bot joue tous les sièges ; l'extension est localisée dans `sim.py`) ;
- des bots qui jouent Tenir, placent leur présence de façon variée et lisent la piste ;
- des indicateurs de cas problématiques : stratégie dominante, partie jouée d'avance, choix forcés (aujourd'hui, 45 % des choix d'action n'ont qu'une option chez le glouton v1).

## 7. Mode d'emploi
Le code est dans l'archive `foret_moteur_v1.zip` (README détaillé). En bref :
- `python -m foret.partie --peuples oiseaux insectes --graine 3` : une partie commentée ;
- `python -m foret.sim reference` puis `--maquette v0` : la campagne de référence (environ 7 min chacune) ;
- `python -m foret.sim ablation_v1` : l'effet de chaque décision ;
- `python -m foret.comparer resultats/reference__v0 resultats/reference__v1 --noms v0 v1` : la comparaison ;
- `python -m foret.conformite` et `python -m pytest -q tests` : conformité et 67 tests.

Pour une v2 : `maquettes/v2.json` avec `"base": "v1"`, puis les mêmes commandes avec `--maquette v2`.
