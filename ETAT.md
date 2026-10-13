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
- **13 oct., 14 h : plan vers la V1 et règle de décision.** Les versions sont renommées (V0.3 = v2 fixée) et la suite suit `projet/3-pilotage/plan-vers-v1.md`. **Claude tranche seul** les choix techniques (outils, code, workflows, calibrage des mesures et des témoins, seuils techniques, axes de la carte, bots, budgets) en appliquant sa recommandation et en l'inscrivant au journal ; **l'auteur tranche** les règles nouvelles et leurs formes, l'adoption de chaque version, les invariants et les bandes, les alertes de conception et le gel de la V1.0. Un défaut que les paramètres ne corrigent pas est signalé à l'auteur dès qu'il apparaît.
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

**3.5 Diagnostic : batterie, mesures, jeu restreint** (FAIT le 13 oct. : `projet/4-bilans/diagnostic-v1-options-v2.md`, sections 1 à 6)
- **Quoi.** Traiter les résultats de la batterie phase3 (3.2), des mesures (3.3) et du jeu restreint (3.4). Comparer chaque verdict à celui du glouton : une mesure qui change de verdict décrit les bots, pas le jeu.
- **Fin d'étape.** Lancer la vérification de robustesse : les campagnes clés rejouées avec un bonus de fin de 10 et de 25 % (réglage `bonus` de l'atelier).
- **Livrable.** `projet/4-bilans/diagnostic-v1-options-v2.md` (créer le fichier), sections v1, V2, mesures du bot fort, jeu restreint.

**3.6 Les options de la v2, et le diagnostic complet** (FAIT le 13 oct. : diagnostic terminé, sections 7 à 10 ; README et plan d'action à jour)
- **Quoi.** Traiter `v2_options_mc` et la robustesse. Pour chaque décision ouverte (D1 à D6, D8, D9), un tableau des mesures clés (forêt, concentration, meilleur taux de rêve, fins avant la mi-partie, chef unique) et la recommandation de Claude.
- **Livrable.** Le diagnostic terminé : en bref, problèmes de la v1 classés par gravité, options de la v2, recommandations, limites. README et plan d'action à jour.

**3.7 DÉCISION UTILISATEUR : fixer la v2** (FAIT le 13 oct. : réponse en section 8)
- L'auteur tranche les décisions ouvertes de la v2 à partir du diagnostic. Le passage suivant écrit `maquettes/v2.json` (ou une v3) selon ses réponses et met à jour les documents de conception.

### Plan vers la V1 (remplace les phases 4 et 5 ; décision de l'auteur du 13 oct., 14 h)
Le détail est dans `projet/3-pilotage/plan-vers-v1.md`. Noms des versions : V0.1 = v0, V0.2 = v1 (étalon figé, plus de campagne), **V0.3 = v2 fixée** (point de départ), puis V0.4, V0.5, V0.6 (un cycle chacune, trois au plus), V1.0 (gelée pour les tests humains). Moteur 1.7.1 ≠ version du jeu.

**Étape 0 : l'outillage** (À FAIRE ; une étape par passage, dans cet ordre, sauf dépendance)
- 0.1 Versions renommées (README, documents, `maquettes/v0.3.json`) ; 0.2 V0.3 dans le moteur, tests, conformité.
- 0.3 Statistiques appariées et intervalles par rééchantillonnage dans les résumés.
- 0.4 Leviers du rêve en paramètres : avance de l'esprit (case d'entrée, pas), lunes selon la taille de la table, taille de la main ; aucune règle nouvelle (réponse de l'auteur du 13 oct., 14:20).
- 0.5 Mesure « choix morts » ; 0.6 mesure « apprentissage du Méchant » ; chacune avec son témoin.
- 0.7 Bot à portefeuille (validé sur V0.3 et V0.2) ; 0.8 bot de contrôle.
- 0.9 `foret/criblage.py` (Morris, glouton) et `foret/exploration.py` (MAP-Elites, étalon au hasard).
- 0.10 Orchestrateur `cycle.yml` (une étape à la fois, enchaînement par `workflow_dispatch`, relance automatique, surveillance quotidienne, `resultats/etat_pipeline.json`, issue de fin de cycle) et rapport automatique.
- 0.11 Mesures fragiles réétiquetées ; coordination et chef unique remesurés au bot fort sur V0.3 ; protocole P2 et sa ligne de base (ancre V0.3). Puis lancer le cycle 1.

**Cycles 1 à 3** (V0.3 → V0.4 → V0.5 → V0.6) : préparer (Claude) → criblage, exploration, confirmation, contrôle, rapport (GitHub, seul) → analyser et proposer (Claude) → **DÉCISION UTILISATEUR : adopter la version**. Priorités : cycle 1 la durée ; cycle 2 l'intérêt des choix et la profondeur ; cycle 3 l'équilibre fin. Arrêt anticipé si plus aucun objectif rouge (bot fort et bot de contrôle).

**Validation et V1.0** : validation complète de la candidate, livret, fiches à imprimer, kit de test humain → **DÉCISION UTILISATEUR : geler la V1.0**.

## 5. Étape suivante

**0.1 et 0.2** : renommer les versions et écrire la V0.3 dans le moteur (le préréglage « V2 proposée » plus le module des lunes, code `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5|p:`, avec « V2 proposée » gardée comme variante nommée « V0.3-sans-lunes »). Bot fort de cette maquette : `MC64R` jusqu'à ce que le bot à portefeuille (0.7) le remplace.


**Incident GitHub (13 oct.).** Le groupe de concurrence des fusions (`publication-resultats`) ne garde qu'une tâche en attente et annule les autres : les fusions des campagnes 12 et 13 ont été annulées, puis relancées avec `gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/runs/<id>/rerun-failed-jobs` (une seule à la fois). Corrigé pour les lancements suivants : plus de groupe, la publication réessaie. Les lots de campagne sont gardés 3 jours (1 jour avant la correction).

**Bot fort de la V2 (13 oct., décision technique de Claude, signalée à l'auteur).** En V2, le bot de référence MC 64 dont les suites ne rêvent pas rêve peu et perd contre le glouton qui rêve (tape-taupe −5 points). Le bot fort de la V2 est donc MC 64 chacun pour soi dont les suites rêvent une carte par tour (`MC64R` dans `foret/batterie.py`) : configurations `p3_v2r` et `m3_v2r`, campagnes de la V2 de l'étape 3.4 et de la robustesse. En v1, la référence reste MC 64 (ses suites ne rêvent pas : c'est là qu'il est le plus fort).

## 6. Verrou

EN COURS (13 oct. 2026, 14 h) : conversation interactive avec l'auteur. À vider à la fin de la conversation.


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
- **13 oct. 2026, 12:57 (3.7, fixer la v2)** : l'auteur valide les recommandations de la section 9 du diagnostic. La v2 fixée est « V2 proposée » plus le module des lunes à toutes les tailles de table : D1 qui et où ; D2 le favori ; D3 Représailles = la plus défendue ; D4 Machine HS désignée remorquée au chantier ; D5 le rêve choisit sa voie ; D6 seuil du Cercle 3 cases par joueur (axe de la phase 4) ; D8 les traces (2 par joueur, numérotées) ; D9 les lunes (2 lunes, nombre en axe de la phase 4). Code d'atelier : `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5|p:`. La phase 4 cherche d'abord à freiner le rêve (seuil du Cercle, nombre de lunes, avance de l'esprit vers le long sommeil, coût d'un rêve), avec la durée comme premier objectif.
- Seuils provisoires des dilemmes (1 et 3 points) et leur témoin raté (diagnostic, section 5) : *confiés à Claude par la règle de décision du 13 oct., 14 h (seuil technique) : recalibrage à l'étape 0.11* ; d'ici là, la mesure des dilemmes est un indice descriptif.
- **13 oct. 2026, 14:04 (suite de la phase 3)** : l'auteur valide toutes les recommandations du point du 13 oct. (pistes J1 à J3, T1 à T7) et demande : versions renommées (V0.3 = v2 fixée, objectif V1.0 jouable pour des tests humains) ; trois cycles « campagne → version du jeu → version du protocole » au plus ; traitements GitHub autonomes, parallèles, sans blocage ; peu de consommation d'IA ; signalement immédiat des défauts de conception que les paramètres ne corrigent pas ; amélioration du jeu (équilibre des peuples, profondeur, durée, synergies, Méchant, intérêt de tous les choix) et des méthodes (évaluation, test, sélection, algorithme génétique, bots) ; Claude tranche les choix techniques sans demander. Traduit dans `projet/3-pilotage/plan-vers-v1.md`.
- **13 oct. 2026, 14:20 (alerte A du plan)** : pour l'auteur, le prix du rêve est le principe « une carte côté rêve prive d'une action » (déjà dans les règles : R3.6, carte perdue pour la partie). Pas de prix supplémentaire pour l'instant : le cycle 1 corrige l'équilibre avec les paramètres existants (seuil du Cercle, lunes selon la taille de la table, accepté, par exemple une de moins que de joueurs ; avance de l'esprit ; menace des premiers tours ; taille de la main ; tours). Si le criblage ne suffit pas, Claude propose des formes de prix supplémentaires à l'auteur.
- **13 oct. 2026, 14:27 (critère ajouté)** : le jeu doit tenir tous ses objectifs à 2, 3, 4, 5 et 6 joueurs ; des règles propres au nombre de joueurs sont acceptées, en particulier sur le nombre d'éléments. Traduit dans le plan, section 7 bis : qualité = objectif le plus faible à la taille de table la plus faible ; paramètres par taille ; mesures adaptées, bandes inchangées.
- **13 oct. 2026, 14:31** : un seul plateau pour toutes les tailles de table (des gabarits par taille seulement si une alerte le demande) ; **au plus 4 éléments** propres au nombre de joueurs, dans un petit tableau du livret. « Go » pour la suite.

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
| Batterie 5 | phase3, p3_v2r (V2, bot fort qui rêve), 338 parties | 10 | – | – | réussi ; traité (diagnostic, sections 2 et 4) |
| Batterie 6 | mesures3, m3_v2r, 300 parties | 10 | 8 min environ | 1,3 min | réussi ; à traiter en 3.5 |
| Campagne 11 | jeu_restreint, v1, MC 64, 480 parties | 20 | 77 min (attentes comprises) | 23 min | réussi ; traité (diagnostic, section 6) |
| Campagne 12 | jeu_restreint_v2, V2, MC 64 qui rêve, 480 parties | 20 | 80 min | 8 min | fusion annulée par le groupe de concurrence, relancée (rerun-failed-jobs) : réussi ; traité |
| Campagne 13 | v2_options_mc, 16 variantes, MC 64 qui rêve, 960 parties | 20 | 82 min | 17 min | fusion annulée, relancée : réussi ; traité (section 7) |
| Campagne 14 | robustesse_v1, bonus 0/10/25, 720 parties | 20 | 75 min | 28 min | réussi ; traité (section 8) |
| Campagne 15 | robustesse_v2, 16 variantes × bonus 10 et 25, 1 920 parties | 20 | 101 min (attentes comprises) | 34 min environ | réussi ; traité (diagnostic, section 8) |

*Les campagnes 2 à 7 ont été jouées avec le moteur avant l'accélération (moteur 1.7 : prévision deux fois plus rapide) : les mêmes campagnes prendraient aujourd'hui environ moitié moins de temps.*

## 10. Journal des passages

| Date | Début | Durée | Statut | Résumé |
|---|---|---|---|---|
| 13 oct. 2026 | – | – | terminé | Mise en place (session interactive) : phase 2 terminée, ETAT.md créé, workflows en Node 24 (tests verts), tâche planifiée « Forêt qui rêve · tests autonomes » créée (3 h 35, 9 h 35, 15 h 35). Pas compté dans le plafond. |
| 13 oct. 2026 | 08:27 | 3 h 35 | terminé | Session interactive avec l'auteur : décisions de fin de phase 2 (section 8), planification revue ; étapes 3.1 à 3.6 faites (moteur 1.7.1, bot fort de la V2 qui rêve, mesures du bot fort, jeu restreint, options de la v2, robustesse ; campagnes 9 à 15 et batteries 3 à 6). Livrable : `projet/4-bilans/diagnostic-v1-options-v2.md`. Étape suivante : 3.7, décision de l'auteur. Pas compté dans le plafond. |
| 13 oct. 2026 | 13:00 | en cours | en cours | Session interactive avec l'auteur : point de situation, pistes d'amélioration, plan vers la V1 (`projet/3-pilotage/plan-vers-v1.md`), versions renommées, règle de décision ; ETAT réorganisé (étapes 0.1 à 0.11, cycles). Pas compté dans le plafond. |

## 11. Reprendre la main

- **Débloquer une décision.** Écrire la réponse dans la section 8, sous la décision concernée, avec la date, puis committer (depuis GitHub, « Edit this file », cela suffit). Le passage suivant applique la réponse et repart.
- **Mettre en pause.** Écrire « PAUSE » dans la section 6 (Verrou) : les passages s'arrêtent tant que le mot y est.
- **Changer l'étape suivante.** Modifier la section 5.
- **Reprendre à la main dans une conversation.** Demander à Claude de lire ETAT.md : tout ce qu'il faut est dans le dépôt.
