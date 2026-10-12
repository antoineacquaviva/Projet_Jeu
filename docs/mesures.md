# Batterie d'évaluation : les mesures (moteur 1.6)

*Bandes définitives depuis le 12 oct. (décisions B1 à B4 de l'auteur, fin de la phase 1) : les bandes provisoires de la phase 0 sont gelées, sauf la synergie, redéfinie (B2).*

Ce document décrit les mesures que calcule le moteur (`foret/mesures.py`, `foret/batterie.py`), comment elles sont calculées, et les variantes témoins qui servent à les valider. Les bandes provisoires viennent de « Objectifs, invariants et catalogue » (section 2). Contrôle : `python -m foret.conformite --mesures` (chaque mesure a un renvoi dans le code, un test et, si elle juge, un témoin).

## Étiquettes
- **mesure** : calculée directement sur les parties, sans modèle de joueur au-delà du bot qui joue.
- **indice** : dépend d'un modèle (temps par décision, bot qui communique…). À confirmer par des humains.
- **humain seulement** : hors de portée de la simulation.

**Avertissement.** En phase 1, tout est joué par le glouton. Une mesure qui dépend du jeu des joueurs (presque toutes) décrit donc aussi le glouton. Les verdicts sont des *indices sur le jeu* tant que le bot fort (phase 2) ne les a pas refaits.

## Population et protocole
- **Configuration** : une maquette, une variante, un bot (le même à tous les sièges).
- **Population de référence** : les 15 duos et les 20 trios des six peuples, N parties chacun (60 pour la v1 et la v2, 30 pour les témoins), graines 0 à N-1 (mêmes dés d'une équipe à l'autre au début de la partie).
- **Équipes** (Shapley, synergies) : les 63 équipes de 1 à 6 peuples, plus « personne » : un peuple joué par le bot inerte, qui ne fait rien. Sa forêt restante (environ 24 %) est la valeur de l'équipe vide v(∅).
- **Résultat** : la forêt restante en % de la forêt initiale (bonus de fin à 0, A12).

## Niveau 1 : jouabilité
| Mesure | Calcul | Étiquette |
|---|---|---|
| Robustesse | Parties plantées (exceptions) et incohérences connues par partie. Vert : zéro. Depuis la décision B4 (moteur 1.5), « voir_trahi » (R6.2) et l'abattage en chemin quand la cible est barrée (R4.3, v1) sont des cas permis, comptés en stats (`voir_detourne`, `coupe_en_chemin_cible_barree`). | mesure |
| Lacunes | Questions que la table se posera (registre `lacunes.py`), par partie. Descriptive. | mesure |
| Couverture | Part des parties où chaque compteur du moteur est non nul (pouvoirs, Tenir, embuscades, oublis, entrées…). Une règle presque jamais appliquée coûte à apprendre pour rien. | indice (dépend du bot) |
| Charge de règles | Départages et cas particuliers que le moteur tranche par partie : égalités de critère, de Machine, de chemin, de rayon, percée sur zone rasée, Représailles sans attaque… | mesure |
| Durée estimée | Modèle de temps (ci-dessous). Jamais un filtre. | indice |
| Attente et densité | Attente : part du temps où un joueur regarde les autres résoudre (décisions prises l'une après l'autre). Densité : décisions non forcées par joueur et par heure estimée. | indice |
| Choix forcés | Part des décisions à une seule option, par type. | indice |

**Modèle de temps** (hypothèses à recaler sur les premiers tests humains, `TEMPS` dans `mesures.py`) : 15 s par décision non forcée, 2 s par décision forcée, 60 s d'ouverture du conseil par tour, 5 s par trace ou jeton, 20 s par étape pour le Méchant (dés, ordre, apprentissage), 5 min de mise en place. Les décisions du conseil (programmer, Voir, traces, partage, lunes) sont simultanées : on compte le joueur le plus lent. Celles de la résolution (aller, agir, embuscade, pouvoirs, voie du rêve, Parler, Tromper) se suivent : on les additionne.

## Objectif 1 : la menace est lisible mais jamais résolue
- **Concentration** (mesure). Avant chaque étape, la menace de chaque zone est l'espérance de forêts abattues par l'ordre à venir, sans compter les barrages (`partie.prevision()` : 11 cases de la piste en v1, 21 paires de dés en v2). On prend la part portée par les *k* zones les plus menacées (*k* = nombre de joueurs), moyenne sur les étapes de la partie. Vert 50 à 80 %, rouge sous 35 % ou au-dessus de 90 %.
- **Surprise** (mesure). Part des ordres tirés dont la tuile n'est pas l'une des deux plus probables au moment du tirage (ex aequo du deuxième rang compris). En v2, la même part pour la Machine désignée, à titre d'information. Vert 20 à 45 %.
- **Tape-taupe** : attend le bot fort (phase 2).

## Objectif 2 : défendre ou rêver reste un dilemme
- **Meilleur taux de rêve fixe** (indice). Le glouton à taux fixes (0 ; 0,25 ; 0,5 ; 0,75 ; 1 carte par tour, la limite des maquettes ; 0 à 3 sans limite), duos et trios. En v2, aussi par voie (sommeil seul, réveil seul). Rouge si le meilleur taux est 0 ou le plus haut permis.
- **Gain du bot libre, dilemmes** : attendent le bot fort.

## Objectif 3 : chaque peuple compte, aucun ne suffit
- **Shapley** (mesure, avec ce bot). Valeur de Shapley exacte à partir des 64 valeurs d'équipe ; rapport de chaque peuple à la moyenne. Intervalle à 95 % par rééchantillonnage des parties (200 tirages). Vert : tous entre 0,7 et 1,3 ; rouge : un hors de 0,5 à 1,5.
- **Synergies** (mesure, décision B2). Le jeu s'adapte au nombre de joueurs : un peuple seul garde déjà l'essentiel de la forêt, et la synergie additive v(i, j) − v(i) − v(j) + v(∅) est négative par construction (elle reste affichée à titre d'information). « Aucun ne suffit » : nombre de duos qui gardent plus de forêt que le meilleur de leurs deux peuples joué seul. Vert ≥ 12 sur 15, rouge < 8. Le tétraèdre : synergie relative entre duos, v(i, j) − v̄i − v̄j + v̄ (v̄i : moyenne des duos de i) ; les trois duos complets (oiseaux-insectes, mammifères-humains, reptiles-entités) doivent être parmi les 5 premiers.
- **Pire table** (mesure). Forêt de la pire équipe / celle de la meilleure, parmi les duos et parmi les trios ; on garde le plus faible des deux rapports. Vert ≥ 70 %.
- **Aucun spectateur** (indice, décision B3). Pour chaque duo et trio, un siège est tenu par le bot inerte, qui ne fait rien ; l'impact d'un peuple est la perte moyenne de forêt. Rapport à l'impact moyen. Vert : chaque peuple ≥ 0,5. Le remplacement par le bot aléatoire (prévu par le plan) reste affiché pour information : ce bot rêve, ce qui rapporte en soi.
- **Coordination** (indice). Mêmes tables avec la communication « aucun signe », celle de la maquette (conseil parlé en v1, traces en v2) et « tout dire ». Part de l'écart récupérée = (forme − aucun signe) / (tout dire − aucun signe). Calculée seulement si l'écart est positif et plus grand que sa marge à 95 % ; sinon « non mesurable avec ce bot ». Le glouton y joue en « annonce » (il annonce sans lire) et en « complet » (il s'appuie sur les annonces des autres).
- **Chef unique** : attend les modes de coopération (phase 2).

## Objectif 4 : la bataille se joue jusqu'au dénouement
- **Partie jouée d'avance** (mesure, avec ce bot). Sur les duos (8 parties par duo), au début du tour 3, 16 copies de la partie sont jouées jusqu'au bout avec un autre hasard ; leur moyenne prédit l'issue. Exactitude équilibrée de la règle « prédiction au-dessus de la médiane des issues » ; AUC donnée en plus. Une partie finie avant le tour 3 est prédite exactement. Vert < 65 %, rouge > 80 %.
- **Incertitude restante** (mesure). Variance des issues des 16 copies jouées depuis le début du tour 5 (0 si la partie est déjà finie), rapportée à la variance des issues d'un même duo d'une partie à l'autre. Vert ≥ 0,5, rouge < 0,25.
- **Fins avant la mi-partie** (mesure). Part des parties finies par le sommeil, le silence ou le réveil aux tours 1 à 3. Vert ≤ 20 %, rouge > 40 %.
- **Menace croissante** (mesure). Sur les parties qui atteignent le tour 5 : ordres réussis par étape, et Machines en marche par étape, aux tours 5-6 rapportés aux tours 1-2 ; on garde le plus faible des deux rapports. Vert ≥ 1, rouge < 2/3. La part des parties qui atteignent le tour 5 est donnée à côté : si elle est faible, la mesure porte sur peu de parties.

## Garde-fou et lecture
- **Plancher** (mesure). Forêt moyenne du pire dixième des parties. Vert ≥ 40 %, rouge < 25 %.
- **Échelle des bots** (mesure). Aléatoire < glouton, écart significatif. Les marches MCTS viendront en phase 2.
- **Équilibre des fins** (lecture). Part de chaque fin.
- **Tactiques et Machines** (lecture). Part des ordres, part réussie, forêts abattues par ordre, par tactique et (v2) par Machine.
- **Le Méchant apprend-il cette équipe ?** (lecture, niveau 3). Distance (cases différentes) entre pistes finales de deux équipes différentes, moins celle entre deux parties de la même équipe.

## Témoins
Variantes cassées exprès (préfixe `temoin_`, dans `maquettes/v1.json` et `v2.json`), jamais proposées comme règles :

| Témoin | Ce qu'il casse | Mesures qui doivent le voir |
|---|---|---|
| `temoin_une_tactique` | Les 11 tuiles sont Cupidité | Concentration (rouge), surprise (rouge), tactiques |
| `temoin_des_fixes` | Chaque lancer donne 3 et 4 (règle `des_fixes`) | Prédictibilité, incertitude (rouge) |
| `temoin_sans_apprentissage` | Le Méchant n'apprend plus (règle `apprentissage`) | Apprentissage (distance nulle) |
| `temoin_essoufflement` | v1 : ni Réparer ni Renfort ; v2 : Machine HS désignée sans effet, chantier vide | Menace croissante (rouge) |
| `temoin_assaut` (v1) | Les 5 Machines en jeu dès le départ | Plancher (plus bas) |
| `temoin_hanter_illimite` | Hanter sans limite par tour | Shapley, synergies, pire table |
| `temoin_mammiferes_sans_pouvoir` (v1) | Tenir et Renverser désactivés | Shapley (mammifères sous la moyenne) |
| `temoin_spectateur` (v1) | Humains sans action ni pouvoir | Aucun spectateur (rouge) |
| `retour_v0_reves_illimites` (v1), glouton qui rêve 3 cartes | Limite de rêves retirée | Meilleur taux de rêve (rouge), fins précoces (rouge) |
| `retour_v0_barrage` (v1) | Barrage contourné | Robustesse (incohérence) |
| `sans_pouvoirs` (v1) | Aucun pouvoir | Couverture (pouvoirs à 0 %) |
| `comm_aucun_signe`, `comm_tout_dire` | Les deux bouts de l'échelle de communication | Coordination |

Un témoin qui ne tombe pas là où il doit signale une mesure à revoir (ou un bot qui ne sait pas exploiter le défaut), pas un seuil à déplacer (A5).

## Relancer
```bash
python -m foret.batterie plan                      # nombre de parties par configuration
python -m foret.batterie phase1                    # tout (reprend les configurations déjà faites)
python -m foret.batterie phase1 --echelle 0.2      # essai
python -m foret.batterie rapport                   # resultats/batterie/rapport.json
python -m foret.batterie phase1 --lot 3/8 --sortie lots/   # le lot 3 sur 8 (une machine par lot)
python -m foret.batterie phase1 --fusionner lots/          # rassemble les lots, puis le rapport
```
Sur GitHub : onglet **Actions** → **Batterie** → **Run workflow** (échelle, nombre de lots, configurations).
