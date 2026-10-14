# Tests du choix stratégique : premières lectures (étape 3 quater, a à c)

*14 oct. 2026, 15 h. Décisions C2 à C4 de l'auteur ; méthode : [choix-strategique.md](../3-pilotage/choix-strategique.md) ; tri : [avant-ou-apres-v1.md](../3-pilotage/avant-ou-apres-v1.md). Lecture seule : aucune mesure ne juge, aucune règle ne change. Toutes les valeurs sont des **indices** (4 parties par table pour la bibliothèque, 4 pour le bot fort).*

## En bref
- **Le code est en place**, et le cycle 2 jouera ces tests sans réglage :
  - T1 : la fréquence des mécanismes voulus, dans chaque étape et dans le rapport, avec une alerte ;
  - T2 et T3 léger : les horaires et les réflexes de rêve, dans l'étape `boucles` ;
  - T4 et T5 : le profil de Δ et la lisibilité, à partir des décisions que le bot fort juge en entier pendant la dernière manche de confirmation.
- **T1 confirme le défaut et montre que le rêve disputé le corrige.** Avec le bot fort, le tir à la corde se produit 0,03 fois par partie (V0.3) et 0,05 fois (V0.4). Avec la règle du cauchemar (V0.4rd), la bibliothèque le voit 1,35 fois par partie, contre 0,21 sur la V0.4 avec les mêmes bots. Le présage détourné par un rêve reste rare partout (0,05 à 0,25) : alerte maintenue.
- **T3 léger : aucune règle simple de rêve ne bat la meilleure politique d'horloge**, ni en V0.3, ni en V0.4, ni en V0.4rd, à aucune taille de table. Les écarts vont de 0 à −32 points. Pour un joueur moyen, juger quand rêver ne rapporte rien aujourd'hui, ce qui est cohérent avec la leçon du rêve. Sur la V0.4rd, ce verdict ne vaut que pour ces bots ; le bot fort tranchera (T3 complet et T4).
- **T4 et T5 attendent leurs témoins** : la campagne `choix_temoins` (MC64R qui juge une décision sur quatre) est lancée sur v0.3, v0.4 et v0.4rd (ETAT.md, section 9).

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

## 3. T4 et T5 : en attente
Le code est prêt et testé :
- le bot `mc` note, pour chaque décision jugée, le nom des options, les 16 suites appariées et dix indices publics ;
- la synthèse calcule le profil de Δ et la lisibilité pour trois choix (rêver ou défendre, saboter ou barrer, moitié haute ou basse).

Les témoins seront lus dès que la campagne `choix_temoins` aura tourné :
- V0.3 : rêver doit dominer ;
- V0.4 : défendre doit dominer, ou le choix doit être indifférent ;
- V0.4rd : le résultat que la proposition espère, un choix disputé.

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
