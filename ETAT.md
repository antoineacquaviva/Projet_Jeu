# ETAT : reprendre le travail à froid

Ce fichier suffit à une session neuve, sans accès aux conversations passées, pour reprendre les tests du jeu. Il est lu au début de chaque passage automatique et mis à jour à la fin. **L'auteur** (le propriétaire du dépôt) y répond aux décisions dans la section « Réponses de l'auteur ».

## 1. Objectif

« La Forêt qui rêve » est un jeu de société coopératif en conception. Les joueurs, chacun à la tête d'un peuple de la forêt, défendent la forêt contre les Machines d'un Méchant automatique, qui apprend sur une piste de pensées et qu'on peut endormir en rêvant. Le moteur `foret` (Python pur) joue les règles avec des joueurs virtuels (bots). Il sert à mesurer les variantes des règles, puis à en choisir une.

Les tests suivent le plan d'action (`projet/3-pilotage/plan-d-action.md`), en six phases :
- 0. cadrer (fait) ;
- 1. mesurer (fait) ;
- 2. bots (fait) ;
- 3. diagnostiquer la v1 et comparer les options de la v2 ;
- 4. explorer les variantes de la v2 fixée ;
- 5. valider les finalistes.

Le résultat d'une partie est la forêt restante. La simulation propose, l'auteur décide, les tests humains jugent l'expérience.

Documents à lire avant de travailler :
- `README.md` : carte du dépôt ;
- `projet/3-pilotage/plan-d-action.md` : le plan, les mesures, les bots ;
- `projet/3-pilotage/objectifs-invariants-catalogue.md` : les objectifs, les bandes vert/orange/rouge, ce qui ne change jamais, les variables ;
- `projet/4-bilans/batterie-evaluation-phase1.md` et `projet/4-bilans/bots-echelle-validation.md` : les deux derniers livrables ;
- `docs/moteur.md`, `docs/mesures.md`, `docs/noeuds_v2.md` : documentation technique.

## 2. Décisions déjà prises (résumé)

- **Phase 0.** Quatre objectifs d'expérience : la menace est lisible mais jamais résolue ; défendre ou rêver reste un dilemme ; chaque peuple compte et aucun ne suffit ; la bataille se joue jusqu'au dénouement. S'y ajoute un garde-fou : aucun effort n'est vain. Les bandes sont gelées (B1). Le résultat est la forêt restante, sans bonus de fin (A12), avec une robustesse vérifiée à 10 et 25 %. La durée n'est jamais un filtre. Les invariants sont dans le catalogue (section 4).
- **v1 et v2.** La v1 est la référence publiée. La v2 (« V2 proposée », `maquettes/v2.json`) a 8 décisions de conception encore ouvertes (D1 à D6, D8, D9 du document `projet/2-maquettes/maquette-de-conception-v2.md`) ; la simulation les éclaire en phase 3, puis l'auteur fixe la v2 (A13).
- **Phase 1 (B1 à B4).** Bandes gelées. Synergie = duos qui battent leur meilleur peuple seul. Siège spectateur tenu par le bot inerte. `voir_trahi` et l'abattage en chemin (v1) sont des cas permis.
- **Calcul (décision 10).** Les campagnes tournent sur GitHub Actions dans ce dépôt public : volumes raisonnables, pas de lancements en continu, aucune donnée personnelle.
- **Algorithme de la phase 4.** MAP-Elites, avec une recherche au hasard comme étalon (décision 4).
- **Règles de travail.**
  - Après tout changement de règle ou de code : mettre à jour les documents, ajouter un test qui cite la règle, puis lancer `python -m foret.conformite` (avec `--v2` et `--mesures`) et `python -m pytest -q tests`.
  - Chaque mesure porte une étiquette (mesure, indice, humain seulement) et est validée sur des témoins.
  - Toujours distinguer le mesuré du supposé.
  - Les arbitrages (statuts, seuils, choix de conception) reviennent à l'auteur.

## 3. Comment travailler

- **Installation** : `python -m pip install pytest` (Python 3.10 ou plus, aucune autre dépendance).
- **Contrôles** : `python -m foret.conformite && python -m foret.conformite --v2 && python -m foret.conformite --mesures && python -m pytest -q tests` (environ 3 minutes).
- **Lancer une campagne** (fichier `campagnes/<nom>.json`). La commande `gh workflow run` échoue (elle passe par GraphQL) : utiliser l'API REST.
  ```bash
  gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/workflows/campagne.yml/dispatches \
    -f ref=main -f 'inputs[campagne]=<nom>' -f 'inputs[maquette]=v1' -f 'inputs[echelle]=1' -f 'inputs[lots]=20'
  ```
- **Lancer la batterie** :
  ```bash
  gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/workflows/batterie.yml/dispatches \
    -f ref=main -f 'inputs[echelle]=1' -f 'inputs[lots]=16' -f 'inputs[seulement]='
  ```
- **Suivre un lancement** :
  ```bash
  gh api repos/antoineacquaviva/Projet_Jeu/actions/runs --jq '.workflow_runs[:5][] | {name, run_number, id, status, conclusion}'
  ```
- **Lire les résultats.** Ils sont publiés sur la branche `resultats`, dans `campagnes/<nom>_run<n>/` (`synthese.json`, `resume.md`) ou `batterie/run<n>/` (`rapport.json`, `resume.md`, `tableau.html`). Le téléchargement des artefacts et des journaux est bloqué depuis les sessions. Lecture :
  ```bash
  gh api "repos/antoineacquaviva/Projet_Jeu/contents/campagnes/<dossier>/synthese.json?ref=resultats" \
    -H "Accept: application/vnd.github.raw" > synthese.json
  ```
  Les agrégats par bot et par variante sont dans `detail` ; il n'y a pas de résultat partie par partie.
- **Limites GitHub.**
  - 20 tâches à la fois : deux campagnes lancées ensemble se partagent les exécuteurs, et la seconde attend.
  - 6 h au plus par lot.
  - Les lancements se lancent sur `main` : committer et pousser le code avant.
- **Coût du bot fort** (moteur 1.7, un cœur ; une suite = une copie de la partie jouée jusqu'au bout) : une suite coûte 5 à 15 ms. Une partie de duo : MC 32 environ 30 s (v1) à 1 min 30 (v2) ; MC 128 de 2 à 6 min. Sur GitHub, une campagne de 240 parties de MC 64 sur 20 lots a pris 22 min (v1) à 47 min (v2). Les trios coûtent environ 1,5 fois plus.

## 4. Étapes restantes

Une étape tient en un passage de quelques heures. Statuts : À FAIRE, EN COURS, FAIT, DÉCISION UTILISATEUR. Chaque livrable est un fichier Markdown du dépôt, commité. Les petites tables Markdown suffisent ; pas de page publiée.

### Phase 3 : diagnostiquer la v1 et comparer les options de la v2

**3.1 Le bot qui communique** (À FAIRE)
- **Quoi.** Le bot `mc` en mode `savoir="soi"` n'annonce rien et ne lit pas les annonces (voir `projet/4-bilans/bots-echelle-validation.md`, section 5). Il faut :
  - (a) que ses traces et jetons du partage (décisions `trace`, `partage`) annoncent ses intentions, par exemple en les déléguant au glouton en mode « annonce » (paramètre `ignorer` du bot) et en s'y tenant en programmant ;
  - (b) que `Partie.brouiller` ne tire au sort que des programmes compatibles avec les traces datées des autres. Une trace « (étape, rêve) » impose un rêve ; une trace « (étape, zone) » impose une carte qui ne rêve pas. On peut s'appuyer sur la logique de `trace_engageante` dans `_programmer`.
- **Commandes.**
  - Tests nouveaux dans `tests/test_mc.py`, puis les contrôles.
  - Campagne `campagnes/coordination_mc_2.json` (copie de `coordination_mc.json`, avec le nouveau réglage), sur v1 puis v2.
- **Critère de fin.** Tests verts. La campagne donne un écart entre « aucun signe » et « tout dire » plus grand que sa marge, ou on constate qu'il ne l'est pas.
- **Livrable.** Une section « Coordination » ajoutée à `projet/4-bilans/bots-echelle-validation.md`, avec la part de l'écart récupérée par la forme de la maquette (bande verte : 40 à 80 %).

**3.2 La batterie du bot fort, plan réduit** (À FAIRE)
- **Quoi.** Ajouter à `foret/batterie.py` un plan « phase3 », à côté de `PLAN` (phase 1), avec :
  - configurations v1 et V2 proposée, bot MC 64 chacun pour soi ;
  - les 15 duos et 5 trios choisis (dont les 4 « triangles » et 1 « étoile » du tétraèdre), 4 parties par table ;
  - Shapley et synergies sur une sélection d'équipes de 1 à 3 peuples : les 6 seuls, les 15 duos et les trios choisis. Approximation à documenter dans `docs/mesures.md`.
  - Les sondes (prédictibilité, incertitude) doivent jouer leurs copies avec le glouton, pas avec le bot fort : sinon le coût explose. Ajouter un réglage au `Sondeur`.
  - Commande : `python -m foret.batterie phase3 --lot i/n` (même mécanique que `phase1`) et le choix du plan dans le workflow Batterie (nouvelle entrée `plan`).
  - Essai à l'échelle 0,1 sur GitHub.
- **Critère de fin.** Tests verts. L'essai tourne sur GitHub, et l'estimation de la durée du plan complet est notée dans le tableau des campagnes.
- **Livrable.** `docs/mesures.md` complété (le plan réduit et son coût).

**3.3 DÉCISION UTILISATEUR : valider le bot fort et le plan réduit**
- Questions (détail et recommandations : `projet/4-bilans/bots-echelle-validation.md`, section 8) :
  1. le bot de référence MC 64 chacun pour soi (MC 128 pour les contrôles) ;
  2. le plan réduit de 3.2 et son coût estimé ;
  3. le bot qui communique de 3.1.
- Tant que l'auteur n'a pas répondu dans la section 8, les passages s'arrêtent ici.

**3.4 Batterie du bot fort sur la v1** (À FAIRE, après 3.3)
- **Commande.** Workflow Batterie, plan « phase3 », configurations v1, échelle 1. Si le plan dépasse 6 h par lot avec 20 lots, le découper en plusieurs lancements (par configuration).
- **Critère de fin.** Rapport publié sur la branche `resultats` ; verdicts comparés à ceux du glouton. Une mesure qui change de verdict décrit les bots, pas le jeu.
- **Livrable.** `projet/4-bilans/diagnostic-v1-options-v2.md`, section v1 (créer le fichier).

**3.5 Batterie du bot fort sur « V2 proposée »** (À FAIRE)
- Comme 3.4, configurations V2. Livrable : la section V2 du même document.

**3.6 Les mesures qui attendaient le bot fort** (À FAIRE)
- **Quoi.** Coder et jouer quatre mesures (définitions dans `projet/3-pilotage/objectifs-invariants-catalogue.md`, section 2 ; registre `MESURES` dans `foret/mesures.py`, aujourd'hui en attente) :
  - tape-taupe : un bot qui pare toujours la menace la plus probable, contre le bot fort ;
  - gain du bot libre sur le meilleur taux fixe ;
  - part de dilemmes parmi les décisions (le bot évalue chaque option sur un échantillon de décisions) ;
  - chef unique : MC tout contre MC soi.

  Chaque mesure a son témoin et son test.
- **Critère de fin.** `python -m foret.conformite --mesures` ne liste plus ces mesures en attente.
- **Livrable.** Section « Objectifs 1 à 3, mesures du bot fort » du document de diagnostic.

**3.7 Le jeu restreint** (À FAIRE)
- **Quoi.** Interdire au bot fort une action ou un pouvoir à la fois, et mesurer la perte de forêt :
  - Saboter (prioritaire en v2, où il ne mène plus à aucune fin) ;
  - Barrer ;
  - Aller ;
  - chaque règle brisée.

  Implémentation : un paramètre du bot `mc` qui retire des options, ou une variante de maquette.
- **Commande.** Campagne `campagnes/jeu_restreint.json`, v1 et v2, duos, MC 64.
- **Livrable.** Section « Jeu restreint » du diagnostic. Une perte nulle signale un élément inutile ; une perte énorme, un élément dominant.

**3.8 Les options de la v2** (À FAIRE ; peut demander deux passages)
- **Quoi.** Les variantes à une option près autour de « V2 proposée », comme dans `campagnes/v2_options.json` (déjà écrites en codes d'atelier), jouées par le bot fort sur les duos. Pour chaque décision ouverte (D1 à D6, D8, D9), lire les mesures clés : forêt, concentration, meilleur taux de rêve, fins avant mi-partie, chef unique.
- **Commande.** `campagnes/v2_options_mc.json`, environ 16 variantes × 60 parties, en plusieurs lancements si besoin (vérifier le temps estimé).
- **Livrable.** Section « Options de la v2 » du diagnostic : un tableau par décision, avec la recommandation de Claude.

**3.9 Robustesse au bonus de fin** (À FAIRE)
- **Quoi.** Vérifier que les conclusions de 3.4 à 3.8 tiennent avec un bonus de 10 et 25 % (paramètre `bonus` de l'atelier ; `bonus_fin` des règles) ; le bonus change le résultat que maximise le bot.
- **Livrable.** Une section du diagnostic.

**3.10 Rédiger le diagnostic** (À FAIRE)
- **Quoi.** Terminer `projet/4-bilans/diagnostic-v1-options-v2.md` :
  - en bref ;
  - problèmes de la v1 classés par gravité ;
  - options de la v2 comparées ;
  - recommandations ;
  - limites (mesuré ou supposé).

  Mettre à jour le README et le plan d'action.
- **Critère de fin.** Document complet et poussé.

**3.11 DÉCISION UTILISATEUR : fixer la v2**
- L'auteur tranche les décisions ouvertes de la v2 à partir du diagnostic. Claude écrit ensuite `maquettes/v2.json` (ou une v3) selon ses réponses, et met à jour les documents de conception.

### Phase 4 : explorer la v2 fixée

**4.1 Criblage (plan de Morris)** (À FAIRE, après 3.11)
- **Quoi.** Coder `foret/criblage.py` : quelques centaines de variantes tirées selon un plan de Morris sur les paramètres libres du catalogue (section 5), jouées par le glouton (bot rapide). Classer les variables par influence sur chaque objectif.
- **Commande.** Un workflow ou une campagne par lots.
- **Livrable.** `projet/4-bilans/criblage.md`, avec les 8 à 12 variables influentes.

**4.2 DÉCISION UTILISATEUR : axes de la carte MAP-Elites**
- Claude propose deux axes (par exemple part du hasard × durée) et la liste des variables retenues ; l'auteur choisit.

**4.3 MAP-Elites et recherche au hasard** (À FAIRE)
- **Quoi.** Coder `foret/exploration.py` : MAP-Elites sur les variables retenues.
  - Filtre : niveau 1 de la batterie.
  - Qualité : le plus faible des objectifs normalisés.
  - Course d'élimination, avec les mêmes graines pour toutes les variantes.
  - Étalon : recherche au hasard à budget égal.
- **Livrable.** Code, tests, essai court sur GitHub.

**4.4 Faire tourner l'exploration** (À FAIRE ; plusieurs passages)
- **Quoi.** Générations par lots sur GitHub. L'état de la carte est enregistré dans le dépôt (`resultats/exploration/`) pour reprendre d'un passage à l'autre.
- **Critère de fin.** La carte se stabilise, ou le budget fixé à l'étape 4.2 est atteint.

**4.5 Carte des variantes et candidats** (À FAIRE)
- **Livrable.** `projet/4-bilans/carte-des-variantes.md` :
  - la carte ;
  - ce qui fait bouger chaque objectif ;
  - 3 à 5 candidats commentés, avec leur code d'atelier ;
  - candidats pour les modes famille et expert.

**4.6 DÉCISION UTILISATEUR : présélectionner les finalistes**

### Phase 5 : valider

**5.1 Finalistes et bots de contrôle** (À FAIRE)
- **Quoi.** Rejouer les finalistes :
  - toutes compositions de tables ;
  - plus de parties ;
  - un bot de contrôle jamais utilisé pendant la recherche (par exemple MC dont la politique est l'aléatoire bruité, ou MC 256).
- **Livrable.** Section « Finalistes » de `projet/4-bilans/candidats-v3.md`.

**5.2 Ablation des finalistes** (À FAIRE)
- **Quoi.** Pour chaque finaliste, annuler ses changements un par un (comme `campagnes/ablation_v1.json`) pour expliquer ce qui compte.
- **Livrable.** Section du même document.

**5.3 Lecture par profil et fiches papier** (À FAIRE)
- **Quoi.** Grilles des profils (catalogue, section 6), tables mixtes avec le bot bruité (Nadia), un seul bot qui pilote plusieurs peuples (Thomas) ; fiches de règles à imprimer pour les tests humains.
- **Livrable.** `projet/4-bilans/candidats-v3.md` complété, et `projet/2-maquettes/fiches-test-v3.md`.

**5.4 DÉCISION UTILISATEUR : choisir la v3 et ses modes**

## 5. Étape suivante

**3.1 Le bot qui communique.**

## 6. Verrou

(vide)

## 7. Compteur de passages

- Semaine en cours : depuis le lundi 12 oct. 2026, 22 h (heure de Paris).
- Passages ayant réellement travaillé cette semaine : **0** (plafond : 6).
- Règle : le compteur est remis à zéro au premier passage qui suit un lundi 22 h. Un passage qui s'arrête aussitôt (décision attendue, verrou, campagne en cours, plafond) ne compte pas.

## 8. Réponses de l'auteur

*L'auteur écrit ici ses réponses aux DÉCISIONS UTILISATEUR, avec la date ; le passage suivant les applique et repart.*

- 3.3 (valider le bot fort et le plan réduit) : *en attente*

## 9. Campagnes GitHub

Durées mesurées de la création du lancement à la fin de la dernière tâche.

| Lancement | Contenu | Lots | Durée totale | Lot le plus lent | Statut |
|---|---|---|---|---|---|
| Campagne 1 | reference, v2, échelle 0,05 (essai du dépôt), 2 485 parties | 4 | 0,6 min | 0,2 min | réussi |
| Batterie 1 | batterie de la phase 1 complète, glouton, 96 200 parties | 16 | 2,5 min | 1,8 min | réussi |
| Campagne 2 | echelle_bots, v1 : aléatoire, glouton, MC 8 / 32 / 128, 330 parties | 16 | 10,8 min | 10,4 min | réussi |
| Campagne 3 | echelle_bots, v2 | 16 | 22,7 min | 17,8 min | réussi (a attendu la 2) |
| Campagne 4 | echelle_bots_2, v1 : MC 128 taux de rêve 0 / 1 / libre, devin MC 32, 150 parties | 20 | 12,3 min | 11,9 min | réussi |
| Campagne 5 | echelle_bots_2, v2 | 20 | 26,0 min | 18,4 min | réussi (a attendu la 4) |
| Campagne 6 | coordination_mc, v1 : MC 64 soi × 3 communications + central, 240 parties | 20 | 21,9 min | 18,2 min | réussi |
| Campagne 7 | coordination_mc, v2 | 20 | 47,2 min | 27,6 min | réussi (a attendu la 6) |
| Campagne 8 | reference, v1, échelle 0,02 (essai des workflows Node 24) | 3 | 0,5 min | 0,2 min | réussi |
| Batterie 2 | batterie phase 1, 4 configurations principales, échelle 0,05 (essai des workflows Node 24) | 4 | 0,7 min | 0,3 min | réussi |

*Les campagnes 2 à 7 ont été jouées avec le moteur avant l'accélération (moteur 1.7 : prévision deux fois plus rapide) : les mêmes campagnes prendraient aujourd'hui environ moitié moins de temps.*

## 10. Journal des passages

| Date | Début | Durée | Statut | Résumé |
|---|---|---|---|---|
| 13 oct. 2026 | – | – | terminé | Mise en place (session interactive) : phase 2 terminée, ETAT.md créé, workflows en Node 24, tâche planifiée créée. Pas compté dans le plafond. |

## 11. Reprendre la main

- **Débloquer une décision.** Écrire la réponse dans la section 8, sous la décision concernée, avec la date, puis committer (depuis GitHub, « Edit this file », cela suffit). Le passage suivant applique la réponse et repart.
- **Mettre en pause.** Écrire « PAUSE » dans la section 6 (Verrou) : les passages s'arrêtent tant que le mot y est.
- **Changer l'étape suivante.** Modifier la section 5.
- **Reprendre à la main dans une conversation.** Demander à Claude de lire ETAT.md : tout ce qu'il faut est dans le dépôt.
