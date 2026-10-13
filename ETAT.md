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

Une étape tient en un passage. Statuts : À FAIRE, EN COURS, FAIT, DÉCISION UTILISATEUR. Chaque livrable est un fichier Markdown du dépôt, commité ; pas de page publiée.

**Organisation (13 oct., pour finir au plus tôt sur le forfait Pro).** Les calculs tournent sur GitHub ; la session ne fait que le code, l'analyse et la rédaction.
- **Pas d'attente.** Un passage n'attend jamais un calcul de plus de 15 minutes : il lance la campagne, note son numéro et ce qu'il faudra en faire (section 9), vide le Verrou et s'arrête. Le passage suivant traite les résultats.
- **Pas de temps mort.** Chaque étape commence par traiter les résultats des campagnes terminées et se termine, autant que possible, en lançant la campagne qui servira plus tard. Ainsi les calculs tournent pendant que les passages dorment.
- **Plafond.** 12 passages qui travaillent par semaine (décision du 13 oct.).

### Phase 3 : diagnostiquer la v1 et comparer les options de la v2
Bot de référence : MC 64 chacun pour soi (`{"type": "mc", "params": {"budget": 64, "savoir": "soi"}}`), MC 128 pour les contrôles. Plan réduit : 15 duos et 5 trios, 4 parties par table (décisions du 13 oct., section 8).

**3.1 Le bot qui communique** (FAIT le 13 oct. : moteur 1.7, `annonces` et `brouiller` conditionné ; campagnes 9 et 10)
- **Quoi.** Le bot `mc` chacun pour soi annonce ses intentions et tient compte de celles des autres :
  - (a) ses traces et jetons (décisions `trace`, `partage`) annoncent ce qu'il compte faire ;
  - (b) `Partie.brouiller` ne tire au sort que des programmes compatibles avec les traces datées des autres. Une trace « (étape, rêve) » impose un rêve ; une trace « (étape, zone) » impose une carte qui ne rêve pas.
- **Fin d'étape.** Tests verts ; lancer `campagnes/coordination_mc_2.json` sur v1 et v2.
- **Livrable.** Code, tests, et la campagne lancée. Le traitement de ses résultats se fait en 3.3.

**3.2 La batterie du bot fort, plan réduit** (FAIT le 13 oct. : `python -m foret.batterie phase3`, 676 parties ; lancée en Batterie 3, sans essai préalable à l'échelle 0,1 : le plan a été joué en entier au glouton dans les tests)
- **Quoi.** Un plan « phase3 » dans `foret/batterie.py`, à côté de `PLAN` (phase 1) :
  - configurations v1 et V2 proposée, bot de référence ;
  - les 15 duos et 5 trios, 4 parties par table. Les trios : les 4 « triangles » (trois peuples autour d'un même coin du tétraèdre) et une « étoile » (les trois peuples d'un même compartiment) ;
  - Shapley et synergies sur les équipes de 1 à 3 peuples jouées (les 6 seuls, les 15 duos, les 5 trios) ; approximation à documenter dans `docs/mesures.md` ;
  - les sondes jouent leurs copies avec le glouton (réglage du `Sondeur`) ;
  - le choix du plan dans le workflow Batterie (nouvelle entrée `plan`).
- **Fin d'étape.** Tests verts ; essai à l'échelle 0,1 sur GitHub (moins de 15 min) ; puis lancer le plan complet (v1 et V2), en plusieurs lancements si un lot risque de dépasser 6 h.
- **Livrable.** `docs/mesures.md` complété ; durée estimée et réelle dans la section 9.

**3.3 Les mesures qui attendaient le bot fort** (FAIT le 13 oct. : coordination et chef unique traités, section 5 bis du bilan des bots ; tape-taupe, gain du bot libre, dilemmes codés, programme `mesures3` lancé en Batterie 4 ; moteur 1.7.1, correction du tirage au sort)
- **Quoi.** D'abord, traiter `coordination_mc_2` : section « Coordination » de `projet/4-bilans/bots-echelle-validation.md`, avec la part de l'écart récupérée (bande verte 40 à 80 %). Ensuite, coder les quatre mesures en attente du registre `MESURES` (`foret/mesures.py` ; définitions dans `projet/3-pilotage/objectifs-invariants-catalogue.md`, section 2), chacune avec son témoin et son test :
  - tape-taupe : un bot qui pare toujours la menace la plus probable, contre le bot fort ;
  - gain du bot libre sur le meilleur taux fixe ;
  - part de dilemmes sur un échantillon de décisions ;
  - chef unique : MC tout contre MC soi.
- **Fin d'étape.** `python -m foret.conformite --mesures` ne liste plus de mesure en attente ; lancer leur campagne (v1 et V2, duos).

**3.4 Le jeu restreint et les options de la v2** (FAIT le 13 oct. : règle `interdits`, variantes « interdire:… » et « regles:… » ; campagnes `jeu_restreint`, `jeu_restreint_v2`, `v2_options_mc` lancées, et la robustesse de 3.5 aussi, `robustesse_v1` et `robustesse_v2`)
- **Quoi.** Écrire deux campagnes :
  - `campagnes/jeu_restreint.json` : interdire au bot une action ou un pouvoir à la fois (Saboter d'abord, puis Barrer, Aller et chaque règle brisée), avec un paramètre du bot `mc` qui retire des options ;
  - `campagnes/v2_options_mc.json` : les variantes à une option près autour de « V2 proposée » (codes d'atelier de `campagnes/v2_options.json`), jouées par le bot de référence sur les duos.
- **Fin d'étape.** Tests verts ; lancer les deux campagnes. Si leur durée estimée dépasse 6 h par lot, les découper.

**3.5 Diagnostic : batterie, mesures, jeu restreint** (EN COURS, session interactive du 13 oct. ; la robustesse est déjà lancée)
- **Quoi.** Traiter les résultats de la batterie phase3 (3.2), des mesures (3.3) et du jeu restreint (3.4). Comparer chaque verdict à celui du glouton : une mesure qui change de verdict décrit les bots, pas le jeu.
- **Fin d'étape.** Lancer la vérification de robustesse : les campagnes clés rejouées avec un bonus de fin de 10 et de 25 % (réglage `bonus` de l'atelier).
- **Livrable.** `projet/4-bilans/diagnostic-v1-options-v2.md` (créer le fichier), sections v1, V2, mesures du bot fort, jeu restreint.

**3.6 Les options de la v2, et le diagnostic complet** (À FAIRE)
- **Quoi.** Traiter `v2_options_mc` et la robustesse. Pour chaque décision ouverte (D1 à D6, D8, D9), un tableau des mesures clés (forêt, concentration, meilleur taux de rêve, fins avant la mi-partie, chef unique) et la recommandation de Claude.
- **Livrable.** Le diagnostic terminé : en bref, problèmes de la v1 classés par gravité, options de la v2, recommandations, limites. README et plan d'action à jour.

**3.7 DÉCISION UTILISATEUR : fixer la v2**
- L'auteur tranche les décisions ouvertes de la v2 à partir du diagnostic. Le passage suivant écrit `maquettes/v2.json` (ou une v3) selon ses réponses et met à jour les documents de conception.

### Phase 4 : explorer la v2 fixée

**4.1 Écrire la v2 fixée et le criblage** (À FAIRE, après 3.7)
- **Quoi.** Appliquer les réponses de 3.7 (maquette, documents, tests). Coder `foret/criblage.py` : quelques centaines de variantes tirées selon un plan de Morris sur les paramètres libres du catalogue (section 5), jouées par le glouton.
- **Fin d'étape.** Lancer le criblage par lots sur GitHub.

**4.2 Résultats du criblage et proposition des axes** (À FAIRE)
- **Quoi.** Classer les variables par influence sur chaque objectif ; retenir les 8 à 12 influentes ; proposer deux axes pour la carte (par exemple part du hasard × durée).
- **Livrable.** `projet/4-bilans/criblage.md`.

**4.3 DÉCISION UTILISATEUR : axes de la carte et variables retenues**

**4.4 MAP-Elites et recherche au hasard** (À FAIRE)
- **Quoi.** Coder `foret/exploration.py` : MAP-Elites sur les variables retenues.
  - Filtre : niveau 1 de la batterie.
  - Qualité : le plus faible des objectifs normalisés.
  - Course d'élimination, avec les mêmes graines pour toutes les variantes.
  - Étalon : recherche au hasard à budget égal.
  - La carte est enregistrée dans le dépôt (`resultats/exploration/`) pour reprendre d'un passage à l'autre.
- **Fin d'étape.** Tests verts ; lancer les premières générations.

**4.5 Faire tourner l'exploration** (À FAIRE ; un passage par vague de générations)
- **Quoi.** Intégrer la vague terminée, puis lancer la suivante, jusqu'à ce que la carte se stabilise ou que le budget fixé en 4.3 soit atteint.

**4.6 Carte des variantes et candidats** (À FAIRE)
- **Livrable.** `projet/4-bilans/carte-des-variantes.md` :
  - la carte ;
  - ce qui fait bouger chaque objectif ;
  - 3 à 5 candidats commentés, avec leur code d'atelier ;
  - candidats pour les modes famille et expert.

**4.7 DÉCISION UTILISATEUR : présélectionner les finalistes**

### Phase 5 : valider

**5.1 Finalistes, bot de contrôle et ablation** (À FAIRE)
- **Quoi.** Écrire et lancer deux campagnes :
  - les finalistes avec toutes les compositions de tables, plus de parties, et un bot de contrôle jamais utilisé pendant la recherche (par exemple MC 256, ou MC dont la politique est l'aléatoire bruité) ;
  - l'ablation de chaque finaliste, en annulant ses changements un par un (comme `campagnes/ablation_v1.json`).

**5.2 Lecture par profil, fiches papier et candidats v3** (À FAIRE)
- **Quoi.** Traiter les résultats. Lire les grilles des profils (catalogue, section 6), avec des tables mixtes et le bot bruité (Nadia) et un seul bot qui pilote plusieurs peuples (Thomas). Préparer les fiches de règles à imprimer.
- **Livrable.** `projet/4-bilans/candidats-v3.md` et `projet/2-maquettes/fiches-test-v3.md`.

**5.3 DÉCISION UTILISATEUR : choisir la v3 et ses modes**

## 5. Étape suivante

**3.5 Diagnostic** (en cours dans la session interactive du 13 oct. ; si le Verrou est vidé sans que l'étape soit marquée FAIT, reprendre là). Données : batteries 3 à 6, campagnes 11 et 12 (jeu restreint) ; puis 3.6 avec les campagnes 13 à 15.

**Bot fort de la V2 (13 oct., décision technique de Claude, signalée à l'auteur).** En V2, le bot de référence MC 64 dont les suites ne rêvent pas rêve peu et perd contre le glouton qui rêve (tape-taupe −5 points). Le bot fort de la V2 est donc MC 64 chacun pour soi dont les suites rêvent une carte par tour (`MC64R` dans `foret/batterie.py`) : configurations `p3_v2r` et `m3_v2r`, campagnes de la V2 de l'étape 3.4 et de la robustesse. En v1, la référence reste MC 64 (ses suites ne rêvent pas : c'est là qu'il est le plus fort).

## 6. Verrou

EN COURS depuis le 2026-10-13 08:27 (heure de Paris) : session interactive avec l'auteur (étapes 3.1 et suivantes).

## 7. Compteur de passages

- Semaine en cours : depuis le lundi 12 oct. 2026, 22 h (heure de Paris).
- Passages ayant réellement travaillé cette semaine : **0** (plafond : 12, décision du 13 oct.).
- Règle : le compteur est remis à zéro au premier passage qui suit un lundi 22 h. Un passage qui s'arrête aussitôt (décision attendue, verrou, campagne en cours, plafond) ne compte pas.

## 8. Réponses de l'auteur

*L'auteur écrit ici ses réponses aux DÉCISIONS UTILISATEUR, avec la date ; le passage suivant les applique et repart.*

- **13 oct. 2026 (validation du bot fort, fin de la phase 2)** :
  1. bot de référence : MC 64 chacun pour soi, MC 128 pour les contrôles ;
  2. plan réduit : 15 duos et 5 trios, 4 parties par table ;
  3. le bot qui communique est construit en premier ;
  4. organisation : un passage n'attend jamais un calcul de plus de 15 minutes (il lance, note et s'arrête) ; plafond de 12 passages qui travaillent par semaine.
- 3.7 (fixer la v2) : *en attente*

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
| Campagne 9 | coordination_mc_2, v1 : MC 64 soi qui annonce × 3 communications + central, 240 parties | 20 | 19,2 min | 11,9 min | réussi ; traité (bilan des bots, section 5 bis) |
| Campagne 10 | coordination_mc_2, v2 | 20 | 31,5 min | 13,3 min | réussi, 1 partie en erreur (corrigée : moteur 1.7.1) ; traité |
| Batterie 3 | batterie phase3 (plan réduit), MC 64 soi, p3_v1 et p3_v2, 676 parties ; résultats dans `batterie/run3_phase3/` | 20 | 29,1 min | 13 min | réussi ; à traiter en 3.5 |
| Batterie 4 | programme mesures3 : tape-taupe, dilemmes (v1, V2), témoins (une tactique, sans rêve, essoufflement), 1 020 parties dont 330 de MC 64 environ ; résultats et parties dans `batterie/run4_mesures3/` | 20 | 17,9 min | 8 min | réussi (témoins : 2 sur 3) ; à traiter en 3.5 (tape-taupe : comparer aussi le glouton par table aux valeurs d'équipe de la Batterie 3 ; témoins ; seuils des dilemmes à faire confirmer par l'auteur) |
| Batterie 5 | phase3, p3_v2r (V2, bot fort qui rêve), 338 parties | 10 | – | – | lancée le 13 oct. 10:02 ; à traiter en 3.5 |
| Batterie 6 | mesures3, m3_v2r, 300 parties | 10 | 8 min environ | 1,3 min | réussi ; à traiter en 3.5 |
| Campagnes 11 à 15 | jeu_restreint (v1, 480 parties), jeu_restreint_v2 (480), v2_options_mc (960), robustesse_v1 (720), robustesse_v2 (1 920), dans l'ordre de lancement probable (vérifier le nom des dossiers `campagnes/<nom>_run<n>`) | 20 chacune | – | – | lancées le 13 oct. entre 10:08 et 10:10 ; jeu restreint en 3.5, le reste en 3.6 |

*Les campagnes 2 à 7 ont été jouées avec le moteur avant l'accélération (moteur 1.7 : prévision deux fois plus rapide) : les mêmes campagnes prendraient aujourd'hui environ moitié moins de temps.*

## 10. Journal des passages

| Date | Début | Durée | Statut | Résumé |
|---|---|---|---|---|
| 13 oct. 2026 | – | – | terminé | Mise en place (session interactive) : phase 2 terminée, ETAT.md créé, workflows en Node 24 (tests verts), tâche planifiée « Forêt qui rêve · tests autonomes » créée (3 h 35, 9 h 35, 15 h 35). Pas compté dans le plafond. |
| 13 oct. 2026 | 08:27 | – | en cours | Session interactive avec l'auteur : décisions de fin de phase 2 prises (section 8), planification revue, étape 3.1 en cours. |

## 11. Reprendre la main

- **Débloquer une décision.** Écrire la réponse dans la section 8, sous la décision concernée, avec la date, puis committer (depuis GitHub, « Edit this file », cela suffit). Le passage suivant applique la réponse et repart.
- **Mettre en pause.** Écrire « PAUSE » dans la section 6 (Verrou) : les passages s'arrêtent tant que le mot y est.
- **Changer l'étape suivante.** Modifier la section 5.
- **Reprendre à la main dans une conversation.** Demander à Claude de lire ETAT.md : tout ce qu'il faut est dans le dépôt.
