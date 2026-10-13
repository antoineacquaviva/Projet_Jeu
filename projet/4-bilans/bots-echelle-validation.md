# Bots : échelle et validation (phase 2)

*Statut (13 oct. 2026, nuit ; section 5 bis ajoutée le 13 oct. au matin, étape 3.3) : livrable de la phase 2 du « Plan d'action ». Moteur 1.7. Bot fort : Monte-Carlo à un coup, déterminisé. Toutes les campagnes ont tourné sur GitHub Actions (7 campagnes, 1 440 parties de bot fort, environ 94 heures-cœur). Les chiffres portent sur les 15 duos, avec 2 à 4 parties par duo et les mêmes graines pour tous les bots (comparaisons appariées). Les marges indiquées sont des intervalles à 95 % non appariés : les écarts entre bots sont mieux mesurés qu'elles ne le laissent croire, mais ce sont encore des indices.*
*Décision de l'auteur attendue : valider le bot fort et le plan réduit de la phase 3 (section 8).*

## En bref
- **Le bot fort existe et il est nettement plus fort que le glouton.** Avec 128 suites par décision, il garde 94 % de la forêt en v1 et 88 % en v2, contre 69 % et 73 % pour le glouton qui défend. La force croît avec le budget ; à 8 suites, le bot est trop bruité et ne bat pas le glouton.
- **« Le rêve domine » était en partie un effet du glouton.** En v1, le bot fort garde plus de forêt sans jamais rêver (94,8 %) qu'en rêvant une carte par tour (91,1 %). En v2, le rêve reste meilleur (92,1 % contre 87,8 %), et la partie finit au tour 3 par le réveil de la forêt.
- **Le risque principal change de nature.** Bien jouée, la défense neutralise presque le Méchant en v1 : 10 % de ses ordres réussissent. C'est le risque du tape-taupe : lire la menace suffit à la contrer.
- **Le hasard pèse lourd.** Le même bot qui connaîtrait les dés à l'avance (le devin) garde 16 à 19 points de forêt de plus.
- **Le chef unique rapporte peu.** Voir les cartes cachées des partenaires vaut 4,8 points en v1 et 1,7 en v2, ce qui reste dans la bande verte (5 à 20 %) ou juste en dessous.
- **Mise à jour du 13 oct. (étape 3.1, section 5 bis) : avec le bot qui communique, la coordination se mesure.** Les traces numérotées de la V2 récupèrent 66 % de l'écart entre « aucun signe » et « tout dire » (vert) ; le conseil parlé de la v1, tel que le moteur l'approche, seulement 7 % (rouge, mais l'approximation est grossière). Le chef unique rapporte 7 % en v1 (vert) et rien en V2 (rouge : les traces suffisent).
- **Le bot fort est lent** : de 30 secondes à 6 minutes de calcul par partie. La batterie complète est hors de portée ; la phase 3 doit utiliser un plan réduit.

## 1. Ce qui a été construit (moteur 1.7)
- **Le bot `mc`** (`foret/bots/mc.py`). Pour chaque décision à plusieurs options, il copie la partie, impose une option, joue la suite avec un autre hasard (les dés à venir sont tirés au sort : c'est la déterminisation) et le glouton à tous les sièges, puis garde l'option qui laisse le plus de forêt en moyenne. Le budget (suites par décision) est réparti par *sequential halving* : les options encore en lice sont jouées sur les mêmes dés, puis la moitié la moins bonne est écartée. Le bot ne connaît aucune règle : il joue la v1, la v2 et toute variante de l'atelier.
- **Ses réglages** :
  - le budget, curseur de force (l'échelle : MC 8, 32, 64, 128) ;
  - le mode « central » (il voit les programmes cachés des partenaires : un seul cerveau pour l'équipe) ou « chacun pour soi » (ce qu'il ne peut pas savoir est retiré au sort) ;
  - le devin (les suites gardent les vrais dés) ;
  - un taux de rêve imposé, comme le glouton.
- **L'information cachée** (`Partie.brouiller`). Dans le mode chacun pour soi, au début de chaque suite, les programmes encore cachés des autres joueurs (étapes à venir, moitiés, rêves, cartes glissées) sont défaits puis refaits par leur bot. Les cartes d'un même peuple ne diffèrent que par leur nom, puisque les effets propres ne sont pas joués : c'est bien tout ce qui est caché. Rien n'est caché en « tout dire ».
- **Les tables mixtes et le bot bruité** : un bot par siège dans une campagne, et un bot qui choisit parfois au hasard (la novice du panel). Prêts pour les lectures par profil ; pas encore mesurés.
- **Le moteur est deux fois plus rapide** pour le bot fort (prévision gardée pendant les traces), sans changer aucun résultat.
- **Contrôles** : 275 tests ; conformité sans écart ; la référence 1.0 se rejoue à l'identique.

## 2. L'échelle des bots
Forêt gardée, 15 duos (campagnes 2 et 3 ; 4 parties par duo, 2 pour MC 128).

| Bot | v1 | v2 | Ordres réussis du Méchant (v1 / v2) |
|---|---|---|---|
| Aléatoire | 39,8 % (± 3,2) | 45,0 % (± 2,9) | 80 % / 79 % |
| Glouton sans rêve | 68,8 % (± 2,0) | 72,8 % (± 3,0) | 43 % / 61 % |
| Glouton qui rêve (1 par tour) | 75,1 % (± 4,6) | 85,6 % (± 1,5) | 62 % / 74 % |
| MC 8 | 67,0 % (± 4,9) | 63,6 % (± 4,1) | 44 % / 57 % |
| MC 32 | 81,5 % (± 3,6) | 75,2 % (± 3,9) | 26 % / 44 % |
| MC 64 (campagnes 6 et 7) | 89,8 % (± 3,2) | 82,2 % (± 3,2) | 17 % / 36 % |
| MC 128 | **94,3 %** (± 2,6) | **87,8 %** (± 3,3) | 10 % / 33 % |

*Sur ces graines (0 à 3), le glouton qui rêve fait moins bien que sur la batterie (82 % sur 40 graines par duo en v1) : 4 graines par duo, c'est peu. Les comparaisons entre bots restent valables, parce qu'elles portent sur les mêmes graines.*

**Validation de la force** : chaque marche au-dessus de MC 8 est nette et dans le bon sens. MC 8 ne bat pas le glouton : avec plus d'options que de suites, son choix est surtout du bruit. **Critère du plan atteint** (force croissante, nettement au-dessus du glouton).

## 3. Défendre ou rêver, avec le bot fort (MC 128)
Campagnes 4 et 5, 2 parties par duo, graines appariées.

| MC 128 | v1 | v2 |
|---|---|---|
| Jamais de rêve (taux imposé 0) | **94,8 %** (± 2,3), nuit 83 %, silence 17 % | 87,8 % (± 2,8), nuit 100 % |
| Une carte par tour (taux imposé 1) | 91,1 % (± 2,7), sommeil 93 % au tour 3,6 | **92,1 %** (± 1,8), réveil 77 %, sommeil 23 %, au tour 3,1 |
| Libre, suites qui rêvent | 92,2 % (± 2,4), sommeil 100 % | **92,5 %** (± 1,5), réveil 73 % |
| Libre, suites qui ne rêvent pas | 94,3 % (± 2,6) ; 0,9 carte en rêve par partie | 87,8 % (± 3,3) ; 1,4 carte |

Lecture (indices) :
- **v1 : le meilleur taux fixe est 0.** La défense seule fait au moins aussi bien que le rêve. C'est le contraire du constat de la phase 1 (le glouton passait de 68 à 88 % en rêvant), et c'est aussi un rouge pour l'objectif 2 (le meilleur taux est un extrême).
- **v2 : le meilleur taux est le maximum permis**, et la partie finit au tour 3 : rouge pour l'objectif 2 et pour les fins avant la mi-partie. Le seuil du Cercle et la limite des rêves restent les leviers (décisions 6 et 9 de la maquette de conception v2).
- **Test de bon sens « il redécouvre que rêver domine en v1 »** : il ne s'applique pas tel quel, puisque le rêve ne domine plus pour un bot fort. Le bot laissé libre rêve peu quand ses suites ne rêvent pas ; quand elles rêvent, il rêve et fait aussi bien que le taux fixe. Limite connue : un bot à un coup ne découvre pas seul une stratégie que sa politique ne joue jamais.

## 4. La part du hasard : le devin
MC 32 dont les suites gardent les vrais dés à venir : **97,5 % en v1** (contre 81,5 % sans les dés), **94,0 % en v2** (contre 75,2 %). Connaître l'avenir rapporte 16 à 19 points : le hasard décide d'une grande partie de l'issue pour ce bot. La mesure de la phase 3 (part des écarts due aux décisions et part due aux dés) devra le préciser avec le bot de référence.

## 5. Le chef unique et la coordination (MC 64)
Campagnes 6 et 7, 4 parties par duo.

| MC 64 | v1 | v2 |
|---|---|---|
| Chacun pour soi, aucun signe | 83,6 % (± 3,1) | 79,8 % (± 3,6) |
| Chacun pour soi, communication de la maquette (conseil parlé en v1, traces en v2) | 85,0 % (± 3,2) | 80,5 % (± 3,2) |
| Chacun pour soi, tout dire | 89,1 % (± 3,2) | 82,2 % (± 3,2) |
| Central (il voit tout), communication de la maquette | 89,8 % (± 3,2) | 82,2 % (± 3,2) |

- **Chef unique** (central moins chacun pour soi, même communication) : **+4,8 points en v1** (5,6 % de la forêt de chacun pour soi : vert de justesse), **+1,7 en v2** (2,1 % : orange, bande verte 5 à 20 %). Voir les programmes des partenaires aide peu : l'effet leader aurait peu de prise.
- **Coordination : pas mesurable avec ce bot.** Les écarts entre « aucun signe », la forme de la maquette et « tout dire » ne mesurent pas la communication :
  - le bot ne pose aucune trace : dans ses suites, personne ne lit les annonces, donc toutes les traces se valent et il n'en pose pas ;
  - le tirage au sort des programmes des partenaires ne tient pas compte de leurs traces ;
  - « tout dire » supprime ce tirage au sort, donc il revient au mode central (en v2, les deux donnent la même partie) ;
  - les petits écarts entre aucun signe et la forme de la maquette viennent du hasard des suites.

  Il faut un bot qui annonce ses intentions et des déterminisations qui respectent les annonces des autres : c'est une étape de la phase 3.

## 5 bis. La coordination avec le bot qui communique (étape 3.1, 13 oct.)
Campagnes 9 (v1) et 10 (V2), `coordination_mc_2` : MC 64 chacun pour soi qui annonce ses intentions (traces et jetons de sa politique, le glouton, et il s'y tient en programmant) et dont les tirages au sort respectent les annonces des autres (une trace « je rêve à l'étape 2 » impose un rêve à l'étape 2). Les 15 duos, 4 parties chacun, mêmes graines que les campagnes 6 et 7.

| MC 64 qui annonce | v1 | V2 |
|---|---|---|
| Chacun pour soi, aucun signe | 83,6 % (± 3,1) | 79,8 % (± 3,6) |
| Chacun pour soi, communication de la maquette (conseil parlé en v1, traces en V2) | 84,2 % (± 3,6) | **85,8 %** (± 3,0) |
| Chacun pour soi, tout dire | 92,2 % (± 2,3) | 88,9 % (± 2,5) |
| Central (il voit tout), communication de la maquette | 90,2 % (± 2,6) | 86,0 % (± 2,7) |

*« Aucun signe » donne exactement les chiffres des campagnes 6 et 7 : sans trace, annoncer ne change rien, ce qui valide le montage. Une partie de la V2 (chacun pour soi, maquette) s'est arrêtée sur une erreur du bot, corrigée depuis (moteur 1.7.1, voir plus bas) ; la moyenne porte sur 59 parties.*

- **L'écart « tout dire » est maintenant mesurable** : 8,6 points en v1 et 9,1 en V2, au-delà de leur marge (3,8 et 4,3). Savoir ce que font les partenaires vaut près de 9 points de forêt pour ce bot.
- **Coordination, V2 : 66 % de l'écart récupéré par les traces numérotées** (vert, bande 40 à 80 %). Les traces disent à quelle étape on rêve ou on défend une zone : c'est l'essentiel de ce qui sert.
- **Coordination, v1 : 7 % récupérés** (rouge, moins de 20 %). Indice faible : le moteur approche le conseil parlé par des traces sans étape (« j'agirai ici »), ce que permet le livret, mais une table humaine dira plus. La mesure dit surtout que, sans dire *quand*, l'annonce sert peu à ce bot.
- **Chef unique** (central contre chacun pour soi, même communication) : **+7,1 % en v1** (± 5,3 ; vert, bande 5 à 20 %) et **+0,2 % en V2** (± 4,7 ; rouge, moins de 2 % : un chef n'apporte rien quand les traces disent déjà l'essentiel). Lecture prudente : les marges couvrent plusieurs bandes. Ce rouge de la V2 n'est pas un défaut au sens d'un « effet leader » ; il dit que les traces rendent le jeu « solitaire à plusieurs » pour ce bot, ce qui demandera à être regardé avec des humains.
- **Témoin du chef unique** (« tout dire » : chacun pour soi sait tout ce que sait le chef) : −2,2 % en v1, −3,3 % en V2, rouge comme attendu. Chacun pour soi en « tout dire » fait même un peu mieux que le central avec la communication de la maquette : sans trace qui engage, le bot garde plus de liberté.
- **Correction du bot (moteur 1.7.1).** L'erreur de la campagne 10 venait du tirage au sort des programmes cachés pendant la résolution : il pouvait vider ou remplir une étape, alors que la présence d'une carte face cachée se voit sur la table. Un pouvoir comme Parler (R6.10), choisi sur la table vue, visait alors une carte absente de la copie. Désormais, ce qui se voit est gardé (une carte à cette étape, ou rien ; les cartes glissées ne bougent pas) ; seuls la carte, sa moitié et le rêve sont retirés au sort. Les campagnes 9 et 10 et les batteries 3 et 4, lancées avant la correction, gardent l'ancien tirage : l'écart est minime (même information, seule la forme du tirage change), mais il est noté.

## 6. Validation des bots : bilan

| Critère du plan (section 4.4) | Résultat |
|---|---|
| Force croissante avec le budget, nettement au-dessus du glouton | **Atteint** (sauf MC 8) |
| Test de bon sens : rêver domine en v1 | Ne s'applique pas : le rêve ne domine plus pour ce bot (section 3) |
| Test de bon sens : jouer Tenir quand c'est utile, placer sa présence mieux que le hasard | **Non mesuré** (compteurs à lire en phase 3 ; le bot cherche aussi la présence, qui est une décision comme une autre) |
| Stabilité entre deux séries de graines et entre deux budgets proches | **Partiel** : MC 64 et MC 128 s'ordonnent comme attendu ; pas de seconde série de graines |
| Bot devin | **Fait** (section 4) |
| Modes de coopération | Central et chacun pour soi **faits** ; communication partielle **mesurée** avec le bot qui communique (section 5 bis) |
| Styles du panel, tables mixtes | **Outils faits**, mesures à faire en phase 3 |

## 7. Coût, et ce qu'il impose à la phase 3
- Une suite coûte 5 à 15 ms sur un cœur. Avec le moteur 1.7 (deux fois plus rapide que pendant ces campagnes), une partie de duo coûte environ 30 s (v1) à 1 min 30 (v2) pour MC 32, et 2 à 6 min pour MC 128. Les trios coûtent plus.
- Sur GitHub, une campagne de 150 à 330 parties de bot fort a pris 11 à 47 minutes avec 16 à 20 lots. Les lots les plus lents ont duré 10 à 28 minutes, loin de la limite de 6 heures. Deux campagnes lancées ensemble se partagent les 20 exécuteurs : la seconde attend.
- **Plan réduit proposé pour la phase 3** : bot de référence MC 64 en mode chacun pour soi (MC 128 pour quelques contrôles). Mesures sur les 15 duos et une sélection de trios, 4 parties par table. Shapley et les synergies sur une sélection d'équipes. La batterie entière reste au glouton, comme référence rapide.

## 8. Décisions de l'auteur à prendre
1. **Valider le bot fort** : MC 64 chacun pour soi comme bot de référence de la phase 3, et MC 128 pour les contrôles. *Recommandé.*
2. **Le plan réduit de la phase 3** (section 7). *Recommandé* : sans lui, une batterie au bot fort demanderait des milliers d'heures-cœur.
3. **Le bot qui communique** (annonces et lecture des annonces), à construire au début de la phase 3, avant la mesure de la coordination. *Recommandé.*

## Sources des chiffres
Branche `resultats` du dépôt, dossiers `campagnes/` : `echelle_bots_run2` (v1) et `_run3` (v2), `echelle_bots_2_run4` et `_run5`, `coordination_mc_run6` et `_run7`, `coordination_mc_2_run9` et `_run10`. Campagnes : `campagnes/echelle_bots.json`, `echelle_bots_2.json`, `coordination_mc.json`, `coordination_mc_2.json`. La part récupérée et le chef unique sont recalculés par `python scripts/resume_campagne.py <dossier>` (fonctions `coordination_depuis_synthese` et `chef_depuis_synthese` de `foret/mesures.py`).
