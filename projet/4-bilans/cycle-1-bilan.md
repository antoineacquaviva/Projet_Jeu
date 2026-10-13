# Bilan du cycle 1 : de la V0.3 à la V0.4 proposée

*13 oct. 2026, 23 h 30 (heure de Paris). Étape g du [plan vers la V1](../3-pilotage/plan-vers-v1.md), rédigée par Claude (tâche « analyse de fin de cycle »). Source : le rapport automatique `cycles/c1/rapport.md` (branche `resultats`). Les détails par taille de table, les types de fin et l'usage des actions viennent de `cycles/c1/confirmation.json` et `controle.json`, relus pour vérifier les points douteux. Plan du cycle : `cycles/c1.json`.*

*Bots. Criblage et exploration : trois gloutons (rêve 0, 0,5 et 1 carte par tour ; on garde le meilleur à chaque taille). Confirmation : bot fort MC64R (MC 64 chacun pour soi, suites qui rêvent une carte par tour). Manche 1 : 12 candidats et l'ancre, 4 parties par table. Manche 2 : 6 candidats, 8 parties par table, soit 48 / 32 / 24 / 16 / 8 parties de 2 à 6 joueurs. Contrôle : MC 256 à portefeuille, 3 finalistes et l'ancre, 4 parties par table. L'**ancre** est la V0.3. Toutes les comparaisons sont appariées par graine.*

## En bref
- **La durée est réglée.** Avec chacune des six meilleures variantes, aucune partie ne finit avant la mi-partie, à aucune taille de table, ni avec le bot fort ni avec le bot de contrôle. La V0.3 en avait 62 à 71 % à 2 joueurs. Ce verdict est **mesuré et stable** entre les deux bots, et il est obtenu sans règle de prix nouvelle : l'alerte A peut être levée pour la durée.
- **La difficulté baisse, mais le verdict dépend du bot.** Avec la meilleure variante, le bot fort garde 58 à 84 % de la forêt (V0.3 : 89 à 99 %), soit −20 points en apparié (sûr). Le bot de contrôle, lui, garde encore 77 à 95 % (−8 points, sûr). L'écart est donc sûr dans les deux cas et va dans le même sens, mais son ampleur change du simple au triple. **Pour un joueur qui choisit son rythme de rêve, le jeu reste trop facile à 3, 5 et 6 joueurs.**
- **Le bot fort n'est plus le plus fort.** Sur la V0.3, les deux bots font jeu égal ; sur les variantes, le bot de contrôle garde 10 à 19 points de forêt de plus. Le rythme de rêve imposé à MC64R (une carte par tour) ne convient plus quand le rêve est ralenti. *Décision technique de Claude* : le bot fort sera recalibré au début du cycle 2.
- **Nouveau point à surveiller** : à 2 et 3 joueurs, le rêve n'aboutit presque plus (96 à 100 % des parties finissent par la nuit). Le dilemme « défendre ou rêver » doit être remesuré en priorité au cycle 2.
- **Proposition : V0.4 = la variante classée première par le bot fort dans les deux manches.** Elle compte 6 réglages, dont 2 propres au nombre de joueurs. Elle contient trois formes de règles que l'auteur doit accepter explicitement (section 7).
- **Pas de passage à la validation.** Les objectifs 1 à 3 n'ont pas été mesurés sur les candidates, et la difficulté reste orange ou rouge pour le bot de contrôle.

## 1. Ce que le cycle a fait (mesuré)
| Étape | Contenu | Durée (UTC, 13 oct.) |
|---|---|---|
| Criblage | Morris, 24 trajectoires sur 13 variables, gloutons, 2 à 6 joueurs | jusqu'à 14 h 18 |
| Exploration | MAP-Elites, 10 générations, arrêt par stagnation (17,84 → 17,97 sur les trois dernières) | 14 h 18 → 14 h 58 |
| Confirmation | manche 1 (12 + ancre), manche 2 (6 + ancre), MC64R | 14 h 58 → 18 h 33 |
| Contrôle | 3 finalistes + ancre, MC 256 à portefeuille | 18 h 33 → 20 h 58 |
| Rapport | `rapport.md` ; aucune alerte selon la règle automatique | 20 h 59 |

- **MAP-Elites bat l'étalon au hasard** à budget égal : score de la carte 17,97 contre 13,1. La méthode de recherche est donc validée sur ce cycle.
- **Durée du cycle** : 6 h 45 au lieu des 5 h 20 prévues. Le contrôle a pris 2 h 25 au lieu d'une heure environ : le coût de MC 256 était sous-estimé (estimé à 600 s-cœur par partie). *Choix technique* : ce coût sera recalé sur cette étape au cycle 2.

## 2. Criblage : ce qui fait bouger quoi (gloutons, indice)
| Variable | Durée | Difficulté | Lecture |
|---|---|---|---|
| tours | 0,36 | 0,12 | allonge la partie |
| avance de l'esprit (`reves_par_pas`) | 0,33 | 0,22 | le frein du rêve le plus net |
| lunes | 0,29 | 0,09 | frein du rêve, surtout aux grandes tables |
| ordres du Méchant par étape | 0,00 | **0,38** | le levier de difficulté le plus fort ; ne touche pas la durée |
| pions de présence | 0,00 | 0,24 | difficulté |
| Machines en jeu, escalade | ≈ 0 | 0,12 à 0,13 | difficulté |
| seuil du Cercle, taille de la main | 0,08 / 0,00 | 0,04 / 0,11 | faibles |
| Hanter, Immobiliser, Voir, traces | ≈ 0 | ≈ 0 | sans effet *pour les gloutons* |

*Supposé* : les gloutons ne communiquent pas et jouent les pouvoirs simplement. L'absence d'effet des traces et de Voir décrit donc les bots, pas le jeu.

## 3. Les objectifs par taille de table

**V0.3 (ancre) et V0.4 proposée.** Forêt gardée et fins avant la mi-partie, deux bots. Pour le bot fort, la manche 2 est retenue (deux fois plus de parties que la manche 1, dont les valeurs sont proches).

| Joueurs | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| Parties (bot fort, manche 2 / contrôle) | 48 / 24 | 32 / 16 | 24 / 12 | 16 / 8 | 8 / 4 |
| **V0.3, bot fort** : forêt, fins avant mi-partie | 89 %, **65 %** | 95 %, 19 % | 95 %, 8 % | 96 %, 0 % | 99 %, 0 % |
| **V0.3, contrôle** | 93 %, **62 %** | 98 %, 31 % | 96 %, 8 % | 96 %, 0 % | 94 %, 0 % |
| **V0.4, bot fort** | 70 %, 0 % | 84 %, 0 % | 58 %, 0 % | 77 %, 0 % | 80 %, 0 % |
| **V0.4, contrôle** | 84 %, 0 % | 95 %, 0 % | 77 %, 0 % | 93 %, 0 % | 94 %, 0 % |
| V0.4, tour moyen de fin (bot fort / contrôle) | 6,0 / 5,9 | 6,0 / 6,0 | 5,5 / 5,2 | 5,6 / 5,6 | 5,6 / 6,0 |
| V0.4, fins par la nuit (bot fort / contrôle) | 100 / 96 % | 97 / 100 % | 46 / 42 % | 25 / 50 % | 38 / 75 % |

**Verdicts par objectif.**

| Objectif | Mesure | V0.3 | V0.4 proposée | Stable entre bots ? | Statut |
|---|---|---|---|---|---|
| 4. Jusqu'au dénouement | fins avant la mi-partie (vert ≤ 20 %, rouge > 40 %) | rouge à 2 j. ; vert ou orange à 3 j. ; vert à 4 à 6 j. | **vert à toutes les tailles** | oui | mesuré |
| 4. Jusqu'au dénouement | partie jouée d'avance, incertitude restante, menace croissante | – | non mesurées dans le cycle | – | à mesurer (cycle 2) |
| Difficulté (cible provisoire 50 à 80 %, pas une bande gelée) | forêt gardée | trop facile partout (89 à 99 %) | bot fort : vert à 2, 4, 5 j. ; orange à 3 (84 %) et 6 j. (80 %, 8 parties) ; contrôle : vert à 4 j. seulement, 84 % à 2 j., **93 à 95 % à 3, 5 et 6 j.** | **non** | mesuré, verdict dépendant du bot |
| Garde-fou : plancher | forêt du pire décile ≥ 40 % | – | non calculé par le rapport ; minimum par taille 58 % | – | supposé tenu |
| 1. Menace lisible | concentration, surprise, tape-taupe | – | non mesurées | – | à mesurer |
| 2. Dilemme | meilleur taux de rêve fixe, gain du bot libre | – | non mesurées ; voir l'alerte E | – | à mesurer, en priorité |
| 3. Chaque peuple compte | Shapley, duos, pire table | – | non mesurées | – | à mesurer |

**Qualité (score provisoire du cycle, le plus faible de durée et difficulté à la pire taille)** : V0.4 à 0,70 et 0,73 au bot fort (manches 1 et 2), contre 0,02 au contrôle ; V0.3 à 0 partout.

**Écarts appariés à l'ancre** (forêt, toutes tailles ; « sûr » = intervalle à 95 % qui exclut zéro, `foret/stats.py`) :

| Variante | Manche 1 (64 paires) | Manche 2 (128 paires) | Contrôle (64 paires) |
|---|---|---|---|
| **V0.4 proposée (A)** | −18,8 [−22,2 ; −15,4] sûr | −20,2 [−22,8 ; −17,5] sûr | −7,7 [−10,6 ; −5,0] sûr |
| B (main 6, 7 tours, 11 réglages) | −18,2 sûr | −18,0 [−20,9 ; −15,2] sûr | −5,3 [−7,6 ; −3,1] sûr |
| C (5 tours, 9 réglages) | −13,8 sûr | −11,8 [−14,4 ; −9,1] sûr | −5,0 [−7,3 ; −2,8] sûr |

Les 12 candidates de la manche 1 ont toutes un écart sûr, de −7,6 à −18,8 points. Les écarts par taille de table ne sont pas appariés dans le rapport : à 5 et 6 joueurs (8 et 4 parties par variante au contrôle), les valeurs par taille sont des **indices**.

## 4. Les deux bots : ce qui est stable, ce qui ne l'est pas
- **Stable** : la durée (0 % de fins précoces avec les deux bots) ; le sens de l'effet sur la difficulté (tous les écarts sont sûrs et négatifs) ; la taille la plus dure, 4 joueurs, avec les deux bots.
- **Instable** : l'ampleur de la difficulté (−20 contre −8 points) et le classement des finalistes. Au contrôle, B passe devant A (qualité 0,06 contre 0,02), mais l'écart est dans le bruit : 4 parties par table, et la pire taille est 3 ou 4 joueurs selon la variante.
- **Pourquoi (supposé)** : sur la V0.3, les deux bots sont proches (de −5 à +4 points selon la taille). Sur la V0.4, le bot de contrôle garde 10 à 19 points de plus à chaque taille. MC64R joue ses suites en rêvant une carte par tour, un rythme taillé pour la V0.3. Quand il faut deux rêves pour un pas de l'esprit et 4 cases de Cercle par joueur, ce rythme gaspille des actions. Le bot à portefeuille choisit son rythme : il rêve moins (59 % des rêves offerts pris, contre 72 % sur la V0.3). Le budget compte aussi (256 suites contre 64) ; le cycle ne permet pas de séparer les deux effets.
- **Conséquence (décision technique de Claude, règle du 13 oct.)** : au début du cycle 2 (étape a), une courte calibration sur la V0.4 (2 à 6 joueurs, apparié) opposera MC64R, MCP64, MC 64 à rêve 0,5 et MC 256 à portefeuille. Le meilleur à coût raisonnable devient le bot fort du cycle 2, et la difficulté se lira sur le plus fort des deux bots. Un jeu réglé contre un bot qui joue mal serait trop facile pour de bons joueurs.

## 5. Mesuré et supposé
**Mesuré** (deux bots, apparié) :
- fins avant la mi-partie à 0 % de 2 à 6 joueurs pour les 6 finalistes ;
- forêt gardée par taille et écarts appariés ci-dessus ;
- influence des variables au criblage (gloutons) ;
- MAP-Elites meilleur que le hasard.

**Indices** (peu de parties ou un seul bot) :
- valeurs à 5 et 6 joueurs ;
- usage des actions : Saboter est pris 42 à 53 % des fois offert sur les variantes, contre 31 à 40 % sur la V0.3 ;
- part des fins par la nuit.

**Supposé** :
- MC64R joue mal la V0.4 à cause de son rythme de rêve imposé ;
- le plancher est tenu ;
- les traces et les pouvoirs Voir, Hanter et Immobiliser n'ont « pas d'effet » seulement parce que les gloutons les jouent mal ;
- la marche de 1 à 2 ordres du Méchant à 4 joueurs explique pourquoi 4 joueurs est la taille la plus dure.

## 6. Alertes de conception
La règle automatique n'a levé aucune alerte. Lecture de Claude :

- **A. Le rêve se paie trop tard → résolue pour la durée, par les paramètres.** Les leviers existants (lunes à 3, sablier des rêves à 2, Cercle à 4 cases à 2 et 3 joueurs) ramènent les fins avant la mi-partie de 62-71 % à 0 %. Aucun prix supplémentaire n'est nécessaire pour la durée. *Recommandation* : lever l'alerte A si la V0.4 est adoptée.
- **E (nouvelle, à surveiller). À 2 et 3 joueurs, le rêve n'aboutit presque plus.**
  - *Mesuré* : avec la V0.4, 96 à 100 % des parties finissent par la nuit à 2 et 3 joueurs, contre 4 à 33 % sur la V0.3 selon le bot et la manche. Le réveil et le long sommeil y deviennent rares.
  - *Supposé* : si rêver ne termine plus la partie, une carte jouée en rêve ne vaut que par son effet en route. On risque alors de passer d'un rêve trop rentable à un rêve inutile, et l'objectif 2 (« défendre ou rêver reste un dilemme ») passerait au rouge. Les bots rêvent encore souvent, mais ce n'est pas une preuve.
  - *Suite* : le meilleur taux de rêve fixe et le gain du bot libre seront mesurés sur la V0.4 en ouverture du cycle 2. Si le meilleur taux est 0, l'alerte sera confirmée. Le levier de correction serait alors le seuil du Cercle à 2 et 3 joueurs (4 → 3), sans règle nouvelle.
- **D (nouvelle, à surveiller). Difficulté pour un joueur qui adapte son rythme.**
  - *Mesuré* : le bot de contrôle garde 93 à 95 % de la forêt à 3, 5 et 6 joueurs.
  - *Suite* : le cycle 2 vise d'abord ces tailles, avec les ordres du Méchant, les pions de présence et les Machines, et avec un bot fort recalibré. Si aucune variante ne descend sous 80 % au meilleur bot sans casser la durée, l'alerte sera confirmée, et Claude proposera des formes de règles à l'auteur.
- **Écart entre les tailles de table** : 4 joueurs est la taille la plus dure (58 % au bot fort, 77 % au contrôle) et 3 joueurs la plus facile, avec 26 points d'écart au bot fort. Ce n'est pas un défaut de conception : le réglage taille par taille est prévu (plan, section 7 bis, recherche en deux temps).
- **B. Saboter** : son usage monte avec la durée (indice). Cela va dans le sens de l'hypothèse du plan (« effet de la durée »). Le jeu restreint sur la V0.4 tranchera.
- **C. « Solitaire à plusieurs »** : non remesuré ; inchangé.

## 7. Proposition : la V0.4
**La variante A**, classée première par le bot fort dans les deux manches, avec un écart sûr à l'ancre pour les deux bots.

| N° | Réglage | V0.3 | V0.4 proposée | Nature |
|---|---|---|---|---|
| 1 | Seuil du Cercle (cases par joueur) | 3 | **4 à 2 et 3 joueurs, 3 à partir de 4** | paramètre existant (D6), **propre à la table** |
| 2 | Lunes | 2 | **3** | paramètre existant (D9) |
| 3 | Avance de l'esprit | 1 rêve vers le sommeil = 1 pas | **2 rêves pour un pas**, comptés sur un sablier public remis à zéro à chaque pas | **forme de règle nouvelle** (étape 0.4) : à accepter |
| 4 | Ordres du Méchant par étape | 1 | **1 à 2 et 3 joueurs, 2 à partir de 4** | **forme de règle nouvelle**, **propre à la table** : à accepter, avec sa modélisation (les ordres supplémentaires ont des dés neufs ; ni le présage, ni Voir, ni Hanter, ni les embuscades ne les concernent ; les barrages de l'étape, si) |
| 5 | Machines en jeu au départ | 3 (2 au chantier) | **5** (les cinq ; chantier vide au départ) | nombre d'éléments (E2) |
| 6 | Escalade du soir | sans | **à partir du tour 5** | module de l'atelier (A4), jamais adopté jusqu'ici : à accepter |

- **Inchangé** : 6 tours, 5 cartes en main, 2 traces par joueur (D8), 3 pions de présence, pouvoirs.
- **Éléments propres au nombre de joueurs : 2** (au plus 4, décision du 13 oct.). Le tableau du livret serait :

  | Joueurs | 2 | 3 | 4 | 5 | 6 |
  |---|---|---|---|---|---|
  | Cases du Cercle par joueur | 4 | 4 | 3 | 3 | 3 |
  | Ordres du Méchant par étape | 1 | 1 | 2 | 2 | 2 |

- **Code d'atelier** : `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5,A4|p:escalade=5,lunes=3`.
- **Réglages hors atelier** : `{"regles": {"cercle_par_joueur": {"2": 4, "4": 3}, "machines_en_jeu": 5, "ordres_par_etape": {"2": 1, "4": 2}, "reves_par_pas": 2}}`.
- *Vérifié* : le moteur 1.8 charge ce code et ces réglages sur la base V0.3, et donne les mêmes règles que la variante jouée dans le cycle.

**Pourquoi A plutôt que B** :
- A est première au bot fort dans les deux manches ;
- elle a moitié moins de changements (6 contre 11) ;
- elle garde 6 tours (B en a 7 : une partie plus longue autour de la table) et 2 traces (B passe à 1 trace, ce qui revient sur la décision D8) ;
- au contrôle, elle est à égalité avec B dans les marges.

**Alternatives pour l'auteur** :
- **B** : un peu meilleure au contrôle (−5,3 contre −7,7 points d'écart, dans le bruit), avec 7 tours, 6 cartes, 1 trace et 4 éléments propres à la table ;
- **refuser les ordres supplémentaires** (n° 4) : aucune finaliste ne s'en passe, et c'est le premier levier de difficulté. Sans eux, la V0.4 garderait la durée mais redeviendrait trop facile. Le cycle 2 devrait alors chercher la difficulté ailleurs (présence, Machines).

**Pourquoi pas la validation** : la durée est verte, mais les objectifs 1 à 3 ne sont pas mesurés sur la V0.4, la difficulté reste rouge au contrôle à 3, 5 et 6 joueurs, et l'alerte E est ouverte.

## 8. Si la V0.4 est adoptée : le cycle 2
1. **Étape a (Claude)** :
   - `maquettes/v0.4.json`, tests et conformité ;
   - **protocole P3** : la ligne de base P2 rejouée sur la V0.4, avec l'ancre V0.3, plus les mesures des objectifs 1 à 3 (concentration, surprise, tape-taupe, meilleur taux de rêve fixe, Shapley, duos) ;
   - calibration du bot fort (section 4) ;
   - coût de MC 256 recalé.
2. **Priorités du cycle 2** :
   - l'intérêt des choix et la profondeur (plan) ;
   - le dilemme du rêve à 2 et 3 joueurs (alerte E) ;
   - la difficulté à 3, 5 et 6 joueurs (alerte D), par un réglage taille par taille.
