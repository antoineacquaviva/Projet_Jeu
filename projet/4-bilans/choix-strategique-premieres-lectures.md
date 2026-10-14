# Tests du choix stratégique : premières lectures (étape 3 quater, a à c)

*14 oct. 2026, 15 h. Décisions C2 à C4 de l'auteur ; méthode : [choix-strategique.md](../3-pilotage/choix-strategique.md) ; tri : [avant-ou-apres-v1.md](../3-pilotage/avant-ou-apres-v1.md). Lecture seule : aucune mesure ne juge, aucune règle ne change. Toutes les valeurs sont des **indices** (4 parties par table pour la bibliothèque, 4 pour le bot fort).*

## En bref
- **Le code est en place**, et le cycle 2 jouera ces tests sans réglage :
  - T1 : la fréquence des mécanismes voulus, dans chaque étape et dans le rapport, avec une alerte ;
  - T2 et T3 léger : les horaires et les réflexes de rêve, dans l'étape `boucles` ;
  - T4 et T5 : le profil de Δ et la lisibilité, à partir des décisions que le bot fort juge en entier pendant la dernière manche de confirmation.
- **T1 confirme le défaut et montre que le rêve disputé le corrige.** Avec le bot fort, le tir à la corde se produit 0,03 fois par partie (V0.3) et 0,05 fois (V0.4). Avec la règle du cauchemar (V0.4rd), la bibliothèque le voit 1,35 fois par partie, contre 0,21 sur la V0.4 avec les mêmes bots. Le présage détourné par un rêve reste rare partout (0,05 à 0,25) : alerte maintenue.
- **T3 léger : aucune règle simple de rêve ne bat la meilleure politique d'horloge**, ni en V0.3, ni en V0.4, ni en V0.4rd, à aucune taille de table. Les écarts vont de 0 à −32 points. Pour un joueur moyen, juger quand rêver ne rapporte rien aujourd'hui, ce qui est cohérent avec la leçon du rêve. Sur la V0.4rd, ce verdict ne vaut que pour ces bots ; le bot fort tranchera (T3 complet et T4).
- **T4 et T5 (bot fort, campagnes 22 à 24)** :
  - le témoin V0.3 donne le bon sens (rêver l'emporte trois fois plus souvent), mais un régime « indifférent » : le seuil par décision est trop haut ;
  - le témoin V0.4 rate, à cause de l'instrument : MC64R rêve dans ses suites, ce qui pousse à rêver ; une vérification est lancée ;
  - **le rêve disputé, joué par le bot fort, redevient un rêve dominant** : sommeil au tour 3,7 dans 81 % des parties, tir à la corde 0,16 par partie ;
  - saboter ou barrer en V0.4 est le choix le plus proche d'un vrai choix, et il se lit sur la menace de l'étape.

## 1. T1 : fréquence des mécanismes voulus (par partie)
| Mécanisme (idée notée 8) | V0.3, MC64R (C16) | V0.4, bots forts (C18) | V0.3, bibliothèque | V0.4, bibliothèque | **V0.4rd**, bibliothèque |
|---|---|---|---|---|---|
| Tir à la corde (et recul par le cauchemar) | **0,03** | **0,05** | **0,19** | **0,21** | 1,35 |
| Ordre annulé : les dés tombent sur un esprit | **0,41** | 0,52 | 0,70 | 1,10 | 0,87 |
| Un rêve détourne le présage | **0,13** | **0,05** | **0,20** | **0,10** | **0,25** |
| Une tactique oubliée en 12 | 0,58 | **0,33** | 0,73 | 0,77 | 0,78 |
| Rêver (esprit qui entre ou avance, Cercle) | 4,50 | 1,72 | 4,36 | 3,06 | 4,92 |

*En gras : sous le seuil d'alerte (0,5 par partie). « Bibliothèque » : les 130 stratégies répétées, les gloutons, les horaires et les réflexes, ensemble ; 9 984 parties par version, calcul local. C16 et C18 : campagnes 16 et 18, bots forts, 64 et 256 parties.*

Lecture :
- Le cauchemar rend le tir à la corde réel : environ six fois plus fréquent qu'en V0.4 avec les mêmes bots. Le mécanisme passe donc le test T1.
- Le **rêve sur le présage** reste rare, même en V0.4rd. Pourtant la proposition en fait la réponse au cas « zone menacée hors de portée ». Soit la situation est rare, soit les bots ne la saisissent pas. Le réflexe « présage devant un esprit » ne bat pas l'horloge (section 2). À regarder avec le bot fort.

## 2. T3 léger : une règle simple de rêve bat-elle l'horloge ?
Meilleure règle de rêve qui lit la situation, moins meilleure politique d'horloge (taux fixes et horaires), en points de forêt, apparié :

| Joueurs | V0.3 | V0.4 | V0.4rd |
|---|---|---|---|
| 2 | −10,9 (sûr) | 0,0 (négligeable) | 0,0 (négligeable) |
| 3 | −9,5 (sûr) | +0,3 (négligeable) | −6,0 (sûr) |
| 4 | −6,4 (sûr) | −13,1 (sûr) | −22,6 (sûr) |
| 5 | −3,6 (sûr) | −8,9 (incertain) | −20,2 (sûr) |
| 6 | −2,4 (incertain) | −17,9 (sûr) | −32,1 (sûr) |

- **Partout, la meilleure façon de rêver pour ces bots est une affaire d'horloge**, et les règles simples (rêver quand un esprit est proche, quand rien n'est à défendre, quand la menace est hors de portée, sur le présage) font moins bien.
- Les règles simples rêvent moins souvent que l'horloge. Une partie de l'écart vient donc du rythme, pas seulement de la lecture.
- Sur la V0.4, les **horaires** (rêver à partir du tour 2 ou 3) sont la meilleure boucle à 5 joueurs (79,2 %, à 10 points du bot fort). Le moment compte plus que la situation : c'est le signe d'un choix d'horloge (principe 7).

## 3. T4 et T5 : les témoins avec le bot fort (campagnes 22 à 24)
MC64R juge une décision sur quatre (16 suites appariées par option), sur l'échantillon P2, 2 parties par table, 32 parties par version. Une situation compte pour une option si elle gagne de plus de 2 points **et** de plus de deux erreurs types ; sinon elle est neutre ou incertaine.

| Version (forêt, fin) | Choix | Situations | A gagne | B gagne | Neutre | Δ moyen | Régime calculé | Lisibilité : hasard → 1 indice → 2 indices |
|---|---|---|---|---|---|---|---|---|
| V0.3 (94 %, tour 4,2) | rêver ou défendre | 66 | 27 % | 9 % | 64 % | +1,0 | indifférent | 75 → 71 → 71 % |
| | saboter ou barrer | 51 | 12 % | 18 % | 71 % | −0,9 | indifférent | 60 → 40 → 33 % (n = 15) |
| | moitié haute ou basse | 154 | 9 % | 7 % | 84 % | +0,3 | indifférent | 58 → 75 → 58 % |
| V0.4 (67 %, tour 5,9) | rêver ou défendre | 64 | 22 % | 8 % | 70 % | +1,0 | indifférent | 74 → 63 → 63 % |
| | **saboter ou barrer** | 111 | **24 %** | **14 %** | 61 % | +0,6 | indifférent, le plus proche d'un choix disputé | **63 → 79 → 77 %** (menace maximale ≤ 0,6 : saboter) |
| | moitié haute ou basse | 295 | 6 % | 7 % | 88 % | 0,0 | indifférent | 46 → 62 → 62 % |
| **V0.4rd** (90 %, tour 3,7, sommeil 81 %) | rêver ou défendre | 44 | **50 %** | **2 %** | 48 % | +4,0 | **dominé par rêver** | 96 → 83 → 83 % |
| | saboter ou barrer | 37 | 16 % | 14 % | 70 % | −0,4 | indifférent | – (n = 11) |
| | moitié haute ou basse | 152 | 13 % | 5 % | 82 % | +0,6 | indifférent | 70 → 70 → 70 % |

**Les témoins.**
- **V0.3 : témoin à moitié réussi.** Le sens est juste : quand le choix compte, rêver l'emporte trois fois plus souvent que défendre (27 % contre 9 %). Mais le régime calculé est « indifférent », parce que deux décisions sur trois changent le résultat de moins de 2 points. La domination du rêve en V0.3 (7 points sur une partie) s'accumule sur cinq rêves environ, d'à peu près un point chacun. **Le seuil de 2 points par décision est trop haut pour un seul choix** : à recalibrer (choix technique de Claude, à faire sur les témoins, pas sur la version jugée).
- **V0.4 : témoin raté, et l'explication est l'instrument.** À l'échelle de la partie, ne jamais rêver vaut un peu mieux (73,3 % contre 70,6 %, protocole P3). Pourtant, décision par décision, MC64R juge rêver meilleur dans 22 % des situations et défendre dans 8 % seulement. Or les suites de MC64R rêvent une carte par tour : elles estiment la valeur d'un rêve *en supposant qu'on rêvera ensuite*, ce qui compte avec le sablier (deux rêves pour un pas). C'est la règle de méthode 4 (l'instrument contient la réponse), observée. **Vérification lancée** : les mêmes campagnes avec des suites qui ne rêvent jamais (`choix_instrument`, lancements 25 à 27). Si le signe change, le profil de Δ du bot fort n'est lisible qu'avec deux politiques de suites.
- **V0.4rd : le rêve disputé, joué par le bot fort, redevient un rêve dominant.** Rêver l'emporte dans 50 % des situations et défendre dans 2 %. La forêt remonte à 90 %, et la partie finit par le sommeil au tour 3,7 dans 81 % des cas : c'est le régime de la V0.3. Le tir à la corde et le cauchemar se produisent 0,16 fois par partie avec le bot fort, contre 1,35 avec la bibliothèque. Le bot fort court au sommeil avant que le cauchemar ait le temps de jouer. La campagne 21 (ligne de base sur la V0.4rd) dit la même chose : 87,5 %, tour 4,0, sommeil 67 %. **Cet indice pèse contre l'adoption du rêve disputé dans ses réglages actuels** (étape 3 ter d'ETAT.md). Il désigne aussi les leviers à essayer : moins de lunes, ou un cauchemar plus fort.

**L'instrument : vérification faite (campagnes 25 et 26, suites du bot qui ne rêvent jamais).**
| Version | Suites qui rêvent une carte par tour (MC64R) | Suites qui ne rêvent jamais |
|---|---|---|
| V0.3 | forêt 94,3 % ; rêve à 4,2 tours en moyenne ; rêver l'emporte dans 27 % des situations, défendre dans 9 % | forêt 88,5 % ; **le bot ne rêve plus du tout** (0 carte, 100 % de fins par la nuit) |
| V0.4 | forêt 67,0 % ; rêver l'emporte dans 22 % des situations, défendre dans 8 % | forêt 74,4 % ; **le bot ne rêve plus du tout** |

- **Le choix « rêver ou défendre » vu par le bot fort dépend entièrement de ce que ses suites supposent pour la suite de la partie.** Avec des suites qui rêvent, rêver paraît souvent meilleur, même en V0.4 où ne pas rêver vaut mieux. Avec des suites qui ne rêvent pas, le bot ne prend plus de lune, et le choix ne se pose même plus. Un rêve isolé ne vaut que par les rêves qui suivent (le sablier, puis la course vers le sommeil). C'est exactement la règle de méthode 4 : l'instrument contient la réponse.
- Les deux versions, jouées sans rêver, confirment au passage le sens attendu des témoins : ne jamais rêver coûte 6 points en V0.3 (rêver domine) et en rapporte 7 en V0.4.
- *Saboter ou barrer* et *moitié haute ou basse*, qui ne dépendent pas d'un rythme, gardent à peu près le même profil avec les deux instruments. Pour ces choix, la mesure est donc fiable.

**Choix technique (Claude, 14 oct., 15 h 55).**
- Pour un choix dont la valeur dépend de ce qu'on fera ensuite, comme le rêve, T4 se mesure avec le **bot à portefeuille** (MCP64). Ses suites suivent la politique de rêve qu'il juge la meilleure pour la situation, au lieu d'une politique imposée. Les deux bots à politique fixe (rêve 0 et rêve 1) sont gardés comme bornes.
- Campagne `choix_portefeuille` lancée sur v0.3, v0.4 et v0.4rd (lancements 28 à 30).
- Le seuil par décision et la règle des régimes seront recalibrés sur ces témoins, pas sur la version jugée.
- Pour les choix sans rythme (saboter ou barrer, moitié), MC64R reste l'instrument du cycle.

**Les autres choix.**
- *Saboter ou barrer* en V0.4 est le choix le plus proche d'un vrai choix. Chaque option gagne nettement dans une part notable des situations (24 % et 14 %), et une seule règle lisible bat le hasard de 16 points : « saboter si la menace maximale de l'étape est faible, barrer sinon ». Un deuxième indice n'ajoute rien. Ce choix est lisible, mais il n'offre pas encore de profondeur.
- *Moitié haute ou basse* est indifférente partout (82 à 88 % de situations neutres). Cela confirme le constat des « choix morts » : la plupart des pouvoirs ne changent pas assez le résultat d'une décision.

**T1 avec le bot fort (mêmes campagnes).** Tir à la corde : 0 (V0.3), 0,22 (V0.4), 0,16 (V0.4rd) ; présage détourné par un rêve : 0,28, 0,09, 0. Les deux mécanismes restent sous le seuil d'alerte pour le bot fort, y compris avec le cauchemar.

## 4. Ce qui reste (étape 3 quater, d)
- Les fiches du choix.
- Le contrôle des fausses découvertes.
- La distribution des résultats.
- La stabilité de la version proposée.
- La lecture des objectifs hors score sur les finalistes.
- La vitesse du pipeline.

## Méthode
- Bibliothèque : `campagnes/boucles_v03.json`, `boucles_v04.json`, `boucles_v04rd.json` (`python -m foret.sim …`), puis `python -m foret.boucles analyser --boucles … --fort …`. Résultats : `resultats/boucles/`.
- T1 : `python -m foret.mecanismes <synthèse>`.
- Code : `foret/mecanismes.py`, `foret/choix.py`, `foret/boucles.py`, `foret/bots/glouton.py` (`tours_reve`, `reve_si`), `foret/bots/mc.py` (jugements étiquetés), `foret/sim.py` (synthèse `choix`), `foret/cycle.py` (étapes et rapport) ; tests : `tests/test_choix_strategique.py`.
