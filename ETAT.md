# ETAT : reprendre le travail à froid

Ce fichier suffit à une session neuve, sans accès aux conversations passées, pour reprendre les tests du jeu. Il est lu au début de chaque passage automatique et mis à jour à la fin. **L'auteur** (le propriétaire du dépôt) y répond aux décisions dans la section « Réponses de l'auteur ».

## 0. Orientation en vigueur (15 oct. 2026, 17 h) : lire d'abord

**La conception se concentre sur la mécanique de base seule**, à la demande de l'auteur : un jeu de déplacement et de placement entre un Méchant qui programme n actions (hasard contrôlé) et un « Gentil » unique (tous les peuples réunis) qui en programme k ; résolution automatique ; t tours ; on compte les arbres restants r > 0. On étudie par simulation si ce noyau est **viable** et **stratégiquement intéressant** (variantes, paramètres, élection, optimisation ; Méchant-bot de force réglable). Règles et code : `docs/regles_placement.md`, `placement/`, `tests/test_placement.py`, `campagnes/placement_*.json` (modèle codé, criblé et étudié le 15 oct. dans une conversation parallèle ; bilan : `projet/4-bilans/placement-etude-1.md` ; six décisions en attente, section 5, P0 bis).

**Différé à plus tard, par choix de l'auteur** (registre : `projet/1-idees/parties-differees.md`) : les pistes et l'apprentissage du Méchant, le rêve, les peuples et leurs règles brisées, et **la communication au conseil**, dont l'idée « du conseil de la calebasse » (`projet/2-maquettes/proposition-conseil-calebasse.md`) est retenue comme très intéressante mais **pas à concevoir maintenant**. Le noyau N1 et sa maquette jouable restent disponibles comme référence ; ils ne sont plus la ligne de travail active. Le cycle 2 reste suspendu.

**Pour toute session ou passage automatique** : ne pas proposer, coder ni tester de règle de communication, de rêve, de piste ou de peuple sans que l'auteur l'ait demandé ; ne pas lancer le cycle 2 ; ne lancer de campagne « placement » que si la section 5 ou l'auteur le demande. Aucune règle du jeu n'est adoptée par cette orientation : la V0.4 reste la dernière version adoptée.

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

## 3 bis. Consigne des passages

*Lue à la lettre par les tâches planifiées « Forêt qui rêve · tests autonomes » et « Forêt qui rêve · réveil » (13 oct. 2026, 14 h 45). Modifier cette section suffit pour changer leur comportement.*

**Les trois tâches planifiées** (décision de l'auteur du 13 oct., 14 h 45 : Sonnet pour les passages courants, Opus pour les analyses de fin de cycle)

| Tâche | Identifiant | Modèle | Quand | Rôle |
|---|---|---|---|---|
| Forêt qui rêve · tests autonomes | `trig_011udKReur3DBBjnHXU29nNe` | Sonnet | 9 h 35 chaque jour (depuis le 13 oct., étape 0.10) | les étapes courantes : code, lancements, suivi |
| Forêt qui rêve · réveil | `trig_016BFvRNtLMbFYYZX6Le9wcE` | Sonnet | une seule fois, à l'heure armée par un passage | même rôle, au moment où un calcul GitHub doit finir |
| Forêt qui rêve · analyse de fin de cycle | `trig_01VUxMg7UjXfZzUXczfz5ANX` | Opus | déclenchée par un passage | l'étape g d'un cycle : bilan, proposition de version, alertes |

**Consigne**
1. Lis d'abord `etat_pipeline.json` sur la branche `resultats` (quelques lignes : `gh api "repos/antoineacquaviva/Projet_Jeu/contents/etat_pipeline.json?ref=resultats" -H "Accept: application/vnd.github.raw"`), puis ce fichier en entier, puis `projet/3-pilotage/plan-vers-v1.md` si l'étape le demande.
   - **Cycle en cours sur GitHub** (`statut` « en cours ») : il s'enchaîne seul (workflow Cycle) ; n'y touche pas. Arme le réveil une heure après `fin_estimee` (c'est la fin de l'étape en cours, pas du cycle), vide le Verrou et arrête-toi ; ce passage ne compte pas.
   - **Rapport prêt** (`statut` « rapport prêt ») et pas encore analysé : point 5.
   - **Échec** (`statut` « échec ») : diagnostique l'étape (onglet Actions, `gh api …/actions/runs`), corrige si c'est technique, relance le workflow Cycle ; sinon DÉCISION UTILISATEUR.
   - **Lancer un cycle** : quand l'étape suivante le demande, `gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/workflows/cycle.yml/dispatches -f ref=main -f 'inputs[cycle]=<cycle>' -f 'inputs[lots]=20'`, puis arme le réveil 5 h plus tard (durée estimée d'un cycle : 3 à 5 h).
2. Arrête-toi immédiatement, sans rien faire d'autre, dans les cas suivants :
   - le Verrou (section 6) contient PAUSE (pas de notification ; ce passage ne compte pas) ;
   - le Verrou indique EN COURS depuis moins de 6 h ;
   - tout est terminé, ou l'étape suivante est une DÉCISION UTILISATEUR encore sans réponse : envoie seulement une notification qui la rappelle ;
   - le compteur de passages (section 7) a atteint le plafond ;
   - un calcul lancé par un passage précédent est encore en cours sur GitHub : vérifie que la tâche « réveil » est armée après sa fin prévue (sinon, arme-la, voir point 6), puis arrête-toi ; ce passage ne compte pas.
3. Si le Verrou indique EN COURS depuis plus de 6 h, considère le passage précédent comme abandonné : note-le dans le journal (avec la raison si elle est visible), reprends l'étape et signale-le dans la notification.
4. Avant de travailler, inscris EN COURS avec la date et l'heure de Paris (`TZ=Europe/Paris date '+%Y-%m-%d %H:%M'`) dans le Verrou, commite et pousse.
5. **Fin de cycle.** Si un rapport de fin de cycle est prêt et pas encore analysé, ne l'analyse pas toi-même : déclenche la tâche « analyse de fin de cycle » avec l'outil `fire_trigger` (à charger via ToolSearch) et l'identifiant ci-dessus, note-le dans le journal, vide le Verrou et arrête-toi.
6. Sinon, traite d'abord les résultats des calculs terminés, puis réalise uniquement l'étape suivante. Commite et pousse régulièrement, pour qu'une interruption (limite d'usage, erreur) ne fasse rien perdre.
7. **Calculs GitHub** (les calculs lourds tournent sur GitHub Actions, jamais dans la session) :
   - lance-les par l'API REST (`gh api -X POST …/dispatches`, section 3), jamais par `gh workflow run` ; estime d'abord la durée à partir du tableau de la section 9 ;
   - s'ils doivent finir dans les 15 minutes, attends-les avec une seule commande de surveillance (une vérification par minute), puis traite les résultats dans le même passage ;
   - sinon, **arme le réveil** : `update_trigger` sur la tâche « réveil », avec `run_once_at` = fin estimée + 15 min (RFC 3339, en UTC). Note le numéro du lancement, l'heure du réveil et ce qu'il faudra faire des résultats dans la section 9, vide le Verrou et arrête-toi ;
   - ne crée jamais de nouvelle tâche planifiée ; ne change jamais leur modèle ;
   - si un calcul échoue, relance-le une fois ; en cas de second échec, note l'erreur, marque l'étape DÉCISION UTILISATEUR avec ton diagnostic et signale-le ;
   - complète le tableau de la section 9 à chaque calcul terminé.
8. Règles pendant tout le passage :
   - ne pose jamais de question. Suis la règle de décision de la section 2 (13 oct., 14 h) : tranche seul ce qui est technique et consigne-le ; un vrai choix de conception (règle nouvelle, adoption d'une version, alerte) devient une DÉCISION UTILISATEUR : pousse et arrête-toi ;
   - n'agis que dans le dépôt, ses workflows GitHub et les deux tâches planifiées ci-dessus : pas de page publiée, pas de message envoyé, pas de téléchargement hors des registres de paquets habituels ;
   - les livrables sont des fichiers Markdown commités dans le dépôt ;
   - commandes non interactives seulement, chacune avec un délai maximal adapté ;
   - après tout changement de code : `python -m pip install pytest`, puis `python -m foret.conformite`, `--v2`, `--mesures` et `python -m pytest -q tests`.
9. En fin d'étape : vide le Verrou, mets à jour l'étape suivante (section 5), incrémente le compteur, complète le journal, commite et pousse. Le dernier message est la notification : trois lignes, en français (ce qui a été fait, où est le livrable, l'étape suivante ou la décision attendue).

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
- 0.1 Versions renommées ; 0.2 V0.3 dans le moteur (FAIT le 13 oct. : `maquettes/v0.3.json`, `tests/test_v03.py`).
- 0.3 Statistiques appariées (FAIT le 13 oct. : `foret/stats.py`, synthèses `apparie` et `parties_compactes`, docs/mesures.md).
- 0.4 Leviers du rêve et de la taille de table (FAIT le 13 oct. : `reves_par_pas`, `ordres_par_etape`, `machines_en_jeu`, valeurs par taille de table ou formule « n-1 » pour lunes, Cercle, main, tours… ; `tests/test_par_table.py`). Indice (glouton, 24 parties par case) : un ordre de plus par étape fait perdre 15 à 20 points de forêt ; tout combiné, le duo va au tour 6 mais tombe à 23 % : de la matière pour le criblage.
- 0.5 Mesure « choix morts » ; 0.6 mesure « apprentissage du Méchant » (FAIT le 13 oct. : observateur `Usage` dans toutes les campagnes, `choix_morts`, `gain_apprentissage`, bandes provisoires et témoins déclarés ; validation des témoins avec P2 en 0.11).
- 0.7 Bot à portefeuille ; 0.8 bot de contrôle (FAIT le 13 oct. : paramètre `portefeuille` du bot `mc`, `MCP64` et `CONTROLE` dans `foret/batterie.py`, moteur 1.8 ; **validation à faire en 0.11** au budget réel : en V0.3, MCP64 ≥ MC64R apparié ; en V0.2, choix surtout « reve0 »).
- 0.9 Criblage et exploration (FAIT le 13 oct. : `foret/cycle.py` réunit criblage de Morris, MAP-Elites et étalon au hasard, confirmation en manches, contrôle, rapport et alertes ; plan du cycle 1 : `cycles/c1.json`, 13 variables).
- 0.10 Orchestrateur et surveillance (FAIT le 13 oct. : workflows `cycle.yml` et `surveillance.yml`, `scripts/publier_resultats.sh` ; essai complet réussi : cycle « essai », 7 lancements enchaînés seuls en 4 min, rapport et issue n° 1 ; tâche « tests autonomes » passée à un passage par jour).
- 0.11 Ligne de base P2 (FAIT le 13 oct. : `projet/4-bilans/ligne-de-base-p2.md`. MCP64 non validé (−1,6 point, incertain) : **MC64R reste le bot fort** ; gain d'apprentissage +1,7 (orange), témoin réussi ; choix morts : Voler seul, témoin partiel ; coordination et chef unique nuls au bot fort ; durée réglée à 4 joueurs et plus par les lunes, rouge à 2 et 3 ; jeu trop facile partout, 90 à 99 %).

**Cycle 1** (FAIT le 13 oct. : rapport `cycles/c1/rapport.md`, branche resultats ; bilan `projet/4-bilans/cycle-1-bilan.md`). **DÉCISION UTILISATEUR : adopter la version V0.4** (FAIT le 13 oct., 23 h 27 : V0.4 adoptée, section 8).

**Cycles 1 à 3** (V0.3 → V0.4 → V0.5 → V0.6) : préparer (Claude) → criblage, exploration, confirmation, contrôle, rapport (GitHub, seul) → analyser et proposer (Claude) → **DÉCISION UTILISATEUR : adopter la version**. Priorités : cycle 1 la durée ; cycle 2 l'intérêt des choix et la profondeur ; cycle 3 l'équilibre fin. Arrêt anticipé si plus aucun objectif rouge (bot fort et bot de contrôle).

**Validation et V1.0** : validation complète de la candidate, livret, fiches à imprimer, kit de test humain → **DÉCISION UTILISATEUR : geler la V1.0**.

## 5. Étape suivante

**Orientation du 15 oct., 17 h (voir la section 0) : la ligne active est l'étude de la mécanique de base « placement »** (`docs/regles_placement.md`, conversation parallèle de l'auteur ; plans dans `campagnes/placement_*.json`, workflow « Placement »). Étude 1 faite, lancements Placement 1 à 6 en section 9, décisions en attente : voir **P0 bis** ci-dessous. La suite P0 ci-dessous est **mise en attente** (la porte de conception reste le critère avant de reprendre P1) ; le conseil de la calebasse est différé.

**P0 : concevoir le noyau (depuis le 15 oct., 9 h 50 ; décisions de l'auteur en section 8). En attente depuis le 15 oct., 17 h.** Le cycle 2 est suspendu jusqu'à ce que le noyau passe la porte de conception (`projet/3-pilotage/prendre-du-recul.md`, section 3.1). Le somnambule est écarté. La suite :
1. **Maquette numérique du noyau N1** (FAIT le 15 oct., 10 h 20, session interactive) : règles `docs/regles_noyau.md` ; page jouable https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV (sources et tests : `maquettes-numeriques/noyau/`). L'auteur y joue seul ou avec des bots ; chaque partie est enregistrée dans la base de l'artefact (`parties`, `series`, `index`).
2. **L'auteur joue et note ses impressions** (ATTENTE DE L'AUTEUR) : quelques parties à 2 et 3 peuples, en humain, et au moins une série de comparaison des profils.
3. **Analyse des parties enregistrées** (Claude, à la demande de l'auteur) : relire la base de l'artefact, profil des choix (rêver ou défendre selon la situation), mécanismes voulus (T1), puis proposition de réglages ou de règles.
4. Audit structurel des dix choix et modèle jouet (décisions 3 et 4) : sur le noyau, au fil des retours de l'auteur.
5. Porte de conception passée : retour au moteur Python (le noyau y est codé, conformité et tests), puis reprise de P1.

*Les passages automatiques ne préparent ni ne lancent le cycle 2 tant que la porte n'est pas passée, et ne travaillent pas sur le noyau N1 ni sur la communication tant que l'auteur ne le demande pas (section 0).*

**P0 bis : le modèle « placement » (depuis le 15 oct., 16 h 20, demande de l'auteur).** L'auteur isole la mécanique de base : plateau en grille, arbres, Machines d'un Méchant qui programme n actions par un hasard contrôlé, individus d'un Gentil unique qui en programme k, résolution automatique, perte du tour entre n − k et n, r > 0 ; sans pistes, sans apprentissage, sans rêve. Modèle d'étude, **aucune règle du jeu adoptée ni changée**.
1. **Modèle, bots, campagnes** (FAIT le 15 oct., 17 h, session interactive) : règles `docs/regles_placement.md` (P1 à P6) ; package `placement/` (moteur, bots du Gentil de l'aléatoire au Monte-Carlo, trois boucles ouvertes, témoins aveugle, immobile et oracle ; Méchant au hasard, adverse de force β, omniscient ; campagnes par lots ; analyse, élection et voisinage ; mesure du choix disputé `placement.dispute`) ; `tests/test_placement.py` ; workflow **Placement** (`.github/workflows/placement.yml`, résultats sur la branche `resultats`, dossier `placement/`).
2. **Étude 1** (FAIT le 15 oct., 17 h) : témoins, criblage de 400 variantes, élection, voisinage, confirmation, force du Méchant, T4 et T5. Bilan : `projet/4-bilans/placement-etude-1.md` ; rapports dans `resultats/placement/`.
3. **DÉCISION UTILISATEUR** (en attente) : les six décisions de la section 10 du bilan (hypothèses du modèle ; m = n ou m = n + 1 ; règles porteuses ; seuils de lecture provisoires ; campagne 2, dont l'ordre d'essai *Éclairer* ; maquette jouable publiée).
4. Campagne 2 du modèle (section 9 du bilan) : après les réponses. Les choix techniques (instruments, volumes, plans) sont de Claude.

*Les passages automatiques ne lancent rien sur le modèle placement : il avance en session interactive avec l'auteur.*

**Cycle 2, étape a : préparer (EN COURS : a.1 et a.2 FAITES ; reste a.3 puis a.4).** La V0.4 est adoptée (section 8, 13 oct., 23 h 27). Détail des priorités et des alertes : `projet/4-bilans/cycle-1-bilan.md`, sections 4, 6 et 8. Une sous-étape par passage, dans cet ordre :

1. **V0.4 dans le moteur** (FAIT le 13 oct., 23 h 45 : `maquettes/v0.4.json`, `tests/test_v04.py`, `docs/noeuds_v2.md`, plan et README à jour ; conformité et 361 tests verts) :
   - `maquettes/v0.4.json` (base `v0.3`, code d'atelier et réglages de la section 8) ;
   - tests citant la décision (`tests/test_v04.py`), documents (`docs/noeuds_v2.md` : la modélisation des ordres supplémentaires n'est plus « à confirmer ») ;
   - `projet/3-pilotage/plan-vers-v1.md` (section 1 : V0.4 adoptée ; section 6 : alerte A levée pour la durée, alertes D et E) ;
   - contrôles complets.
2. **Recalibrer le bot fort sur la V0.4** (FAIT le 14 oct., passage planifié : MC 256 à portefeuille +13,8 ± 3,8 points sur MC64R, les autres bots à égalité ; MC64R reste le bot fort, MC 256 le contrôle ; `COUT["mc256"]` 600 → 3 700 s ; `projet/4-bilans/calibration-bot-fort-v04.md`. Rappel de la consigne : (LANCÉE le 13 oct., 23 h 45 : Campagne 18, `campagnes/calibration_v04.json`, 256 parties, 20 lots ; durée estimée 1 h environ, le lot le plus lent fixe la fin. *À faire au passage suivant* : lire `campagnes/calibration_v04_run18/synthese.json` sur la branche resultats ; comparer les quatre bots en apparié par taille de table (forêt, fins, tour ; `scripts/analyse_ligne_base.py` sert de modèle) ; retenir le plus fort à coût raisonnable comme bot fort du cycle 2, l'écrire dans le futur `cycles/c2.json` et dans `foret/batterie.py` si besoin ; recaler `COUT["mc256"]` dans `foret/cycle.py` sur la durée mesurée ; consigner la décision au journal) (décision technique de Claude, bilan section 4) : campagne appariée de 2 à 6 joueurs opposant MC64R, MCP64, MC 64 à rêve 0,5 et MC 256 à portefeuille. Le meilleur à coût raisonnable devient le bot fort du cycle 2. Recaler aussi le coût de MC 256 dans `foret/cycle.py`.
3. **Protocole P3 et sa ligne de base** (FAIT le 14 oct., 13 h 30 : calculs terminés, analyse apparie écrite dans `projet/4-bilans/protocole-p3-analyse.md` avec `scripts/analyse_p3.py` ; l'alerte E est confirmée et attend la décision de l'auteur) : P2 rejoué sur la V0.4 avec l'ancre V0.3, plus les mesures des objectifs 1 à 3 (concentration, surprise, tape-taupe, meilleur taux de rêve fixe et gain du bot libre, Shapley, duos). Le meilleur taux de rêve fixe tranche l'alerte E : s'il vaut 0 à 2 et 3 joueurs, l'alerte est confirmée et devient une DÉCISION UTILISATEUR.
3 bis. **Garde-fou « aucune boucle gagnante », en lecture seule** (FAIT le 14 oct., 8 h 30, session interactive ; décision de l'auteur, section 8 ; spécification `projet/3-pilotage/garde-fou-boucles-gagnantes.md`) : bot `repete`, `foret/boucles.py` (130 stratégies par taille de table, campagne appariée, analyse), quatre mesures descriptives, **étape `boucles` du cycle** entre le contrôle et le rapport (rien à faire pour l'activer au cycle 2 : elle est jouée par défaut ; `"boucles": false` dans le plan la saute). Première lecture, appariée aux Campagnes 16 et 18 : V0.3 rouge, V0.4 orange (+6 points à 4 joueurs) ; `projet/4-bilans/garde-fou-boucles-ligne-de-base.md`. Bandes confirmées par l'auteur le 14 oct., 11 h 50 (option A, à réexaminer après le cycle 2) : les mesures ne jugent pas et n'entrent pas dans la qualité.
3 ter. **Essai « le rêve disputé »** (LANCÉ le 14 oct., 14 h 02 ; accord de l'auteur, section 8). Calculs : batterie 8 (programme `rd`) et campagne 21 (ligne_base_p2 sur `v0.4rd`), section 9. *À faire au passage suivant* :
   - `python scripts/analyse_p3.py <synthese campagne 21> <synthese campagne 19> V0.4rd V0.4` (forêt par taille, apparié) ;
   - comparer `batterie/run8_rd/rapport.json` (config `rd_v04rd`) à `batterie/run7_p3/rapport.json` (config `pro3_v04`) : **gain du bot libre**, meilleur taux de rêve fixe, tape-taupe, Shapley, surprise ;
   - dans les synthèses : `tir_a_la_corde`, `cauchemar_recul`, fins (sommeil avant le tour 4), rêves par voie ;
   - juger sur les critères de la proposition (section 6) : gain du bot libre ≥ 5 points, meilleur taux fixe intermédiaire, au moins un recul d'esprit par partie, sommeil avant le tour 4 dans moins de 20 % des parties ;
   - **lectures complémentaires** (14 oct., 14 h 30, choix techniques de Claude ; `projet/3-pilotage/choix-strategique.md`, sections 6 et 7) : signaler dans le bilan que MC64R rêve à horloge fixe dans ses suites (l'instrument peut écraser le gain du bot libre) ; si le gain libre est sous 5 points, le remesurer avec MC 256 à portefeuille sur un échantillon (duos et trios, 2 parties) avant de conclure ; ajouter au garde-fou « boucles » une famille d'horaires (rêver à partir du tour *k*, jusqu'au tour *k*) ; enregistrer dans les jugements du bot `mc` le nom des options et quelques indices publics (tour, case de l'esprit le plus avancé, tactiques en 8 à 12, menace maximale, présage connu), pour le profil de Δ (T4) et la lisibilité (T5), en lecture seule ;
   - **T3 complet sur la V0.4rd** (14 oct., 16 h 30, campagnes 24, 27, 30) : rêver domine de +11,5 points (sûr), juger ne rapporte rien (−3,4, incertain) ; le critère « gain du bot libre ≥ 5 points » de la proposition n'est pas atteint dans ces réglages ; leviers avant de juger la règle : moins de lunes, cauchemar de deux cases, sablier à deux rêves ;
   - **lu le 14 oct., 15 h 25 avec le bot fort** (campagnes 21 et 24) : **le rêve redevient dominant** (rêver l'emporte dans 50 % des situations jugées, défendre dans 2 % ; forêt 87 à 90 %, sommeil au tour 3,7 à 4,0 dans 67 à 81 % des parties) ; tir à la corde et cauchemar 0,16 à 0,20 par partie seulement : le bot fort court au sommeil avant que le cauchemar ne joue ; à reprendre dans le bilan de l'essai, avec les leviers possibles (moins de lunes, cauchemar plus fort) ;
   - **déjà lu le 14 oct., 15 h** (bibliothèque, calcul local, à reprendre dans le bilan) : T1, le tir à la corde passe de 0,21 (V0.4) à 1,35 par partie (V0.4rd) avec les mêmes bots ; le présage détourné reste rare (0,25) ; T3 léger, aucune règle simple de rêve ne bat l'horloge en V0.4rd ; T4 et T5 du bot fort sur la V0.4rd : lancement `choix_temoins` sur v0.4rd ;
   - **grille de réglage** (décision de l'auteur, 14 oct., 17 h 47, section 8 ; bilan commencé : `projet/4-bilans/essai-reve-dispute.md`) : plan 2 × 2 × 2 sur v0.4rd (lunes 3 ou 2 ; cauchemar d'une ou deux cases, nouveau paramètre `cauchemar_cases` ; un ou deux rêves pour un pas), trois instruments du test T3 complet, campagne `reve_dispute_grille` (768 parties), section 9. *À faire au passage suivant* : récupérer la synthèse sur la branche resultats, lancer `python scripts/analyse_grille_reve.py <synthese.json> --md /tmp/grille.md`, recopier le tableau dans la section 3 du bilan avec deux phrases de lecture (quel levier fait monter le gain du jugement), appliquer la « suite selon le résultat » de la section 2 du bilan : si un réglage remplit les trois critères, préparer sans la lancer sa confirmation au bot de contrôle (MC 256 à portefeuille) et le signaler ; sinon, ne rien lancer ; puis **DÉCISION UTILISATEUR** ; MAP-Elites seulement après, autour d'une zone prometteuse ; **FAIT le 14 oct., 20 h 40 (session interactive, Opus)** : aucun réglage retenu ni proche du seuil (meilleur gain du jugement +3,0, incertain ; reculs 0,03 à 0,25 par partie ; le sablier brise la domination du rêve sans faire payer le jugement) ; cas « revoir la règle » de la section 2 du bilan, rien lancé ; section 3 et options de décision dans `projet/4-bilans/essai-reve-dispute.md` ;
   - puis **DÉCISION UTILISATEUR (RÉPONDUE le 14 oct., 22 h 55 : chercher une autre forme de la règle ; voir le point suivant)** : A écarter la règle et revenir à la conception (recommandé par Claude), B prolonger la grille (3 rêves pour un pas, cauchemar de 3 cases), C adopter un réglage (déconseillé) ; détail : bilan, section 4. L'auteur a choisi le 14 oct., 20 h 52, de chercher une solution avec Claude (pistes : `projet/2-maquettes/reve-dispute-problematique-et-pistes.md`).
   - **essai « le somnambule »** (accord de l'auteur du 14 oct., 22 h 55, section 8 ; pistes : `projet/2-maquettes/reve-dispute-problematique-et-pistes.md`). FAIT le 14 oct., 23 h (session interactive) : règles `somnambule`, `somnambule_apprend` et `presages` (fausses ou à 1 par défaut ; V0.4 et v0.4rd inchangées), `tests/test_somnambule.py`, campagne `campagnes/reve_somnambule.json` (6 réglages sur v0.4rd : référence, somnambule, avec 2 ou 3 présages, qui apprend, qui apprend avec 3 présages ; trois instruments du T3 complet ; P2, 2 parties : 576 parties), `scripts/analyse_grille_reve.py` généralisé (critère de riposte : reculs + ordres du somnambule ≥ 1 par partie) ; 415 tests verts, conformité OK. T1 local au glouton (60 parties par réglage) : 5 ordres du somnambule par partie quand on rêve à chaque tour, dont 4 réussis ; forêt du rêveur 82 % → 62 % (qui apprend : 31 %), forêt sans rêver 66 % → 63 % ; sommeil avant le tour 4 inchangé (85 %) sauf qui apprend (23 %).
     - **FAIT le 15 oct., 2 h 06 (réveil, Sonnet)** : campagne 32 lue, bilan `projet/4-bilans/essai-somnambule.md`, aucun réglage retenu ; **DÉCISION UTILISATEUR** en attente (A écarter, recommandé ; B prolonger « qui apprend » ; C adopter). Ancienne consigne, pour mémoire : lancer la campagne (FAIT) : lancer la campagne (le jeton `gh` manquait à la session interactive) : `gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/workflows/campagne.yml/dispatches -f ref=main -f 'inputs[campagne]=reve_somnambule' -f 'inputs[echelle]=1' -f 'inputs[lots]=96'` ; noter le numéro dans la section 9 ; durée estimée 1 h 30 à 2 h 30 ; armer le réveil à la fin estimée + 15 min ;
     - **puis, au passage d'après** : récupérer la synthèse (`campagnes/reve_somnambule_run<N>/synthese.json`, branche resultats), lancer `python scripts/analyse_grille_reve.py <synthèse> --md /tmp/somnambule.md`, écrire le bilan `projet/4-bilans/essai-somnambule.md` (tableau, deux phrases de lecture : le somnambule fait-il naître un gain du jugement, les présages l'augmentent-ils, l'apprentissage rend-il le rêve dominé ; part des ordres du somnambule réussis), appliquer la même suite que la grille (un réglage retenu : préparer sans la lancer sa confirmation au MC 256 à portefeuille ; sinon rien), puis **DÉCISION UTILISATEUR** sur le somnambule.
3 quater. **Tests du choix stratégique et compléments avant la V1** (a à c FAITS le 14 oct., 15 h, session interactive : `foret/mecanismes.py`, `foret/choix.py`, horaires et réflexes de rêve dans `foret/boucles.py` et le glouton, jugements étiquetés du bot `mc`, étapes du cycle et rapport, `tests/test_choix_strategique.py` ; premières lectures : `projet/4-bilans/choix-strategique-premieres-lectures.md` ; *à faire au passage suivant* : lire les trois lancements `choix_temoins` (section 9 ; `syn["choix"]` de chaque synthèse, `python -m foret.mecanismes`) et compléter la section 3 du bilan (FAIT le 14 oct., 15 h 25 : V0.3 bon sens mais « indifférent », seuil de 2 points par décision trop haut ; V0.4 raté à cause de l'instrument, vérification par les campagnes 25 à 27 ; V0.4rd dominé par rêver) ; 25 à 30 lues (14 oct., 16 h 30) ; **choix techniques** : pour un choix de rythme (le rêve), le test qui fait foi est T3 complet au niveau de la partie (`foret.choix.gain_jugement`, campagne réutilisable `jugement_reve`, une fois par version adoptée et pour chaque essai de règle sur le rêve), validé sur les témoins V0.3 et V0.4 ; T4 reste pour les choix sans rythme (seuil de 2 points inchangé, témoins propres à construire) ; le cycle garde `juger_confirmation` à 0,1 ; c est FAIT ; d reste À FAIRE ; décisions C2 à C4 du 14 oct., 14 h 10 ; détail : `projet/3-pilotage/avant-ou-apres-v1.md`, section 2 ; choix techniques de Claude, lecture seule, aucune règle ni bande modifiée). Une sous-étape par passage, dans cet ordre :
   - a. **M1 (T1)** : registre des mécanismes voulus (tir à la corde, recul par le cauchemar, ordre annulé par un esprit, oubli en 12, alliance, embuscade, rêve sur le présage…) relié aux compteurs du moteur (en ajouter s'il en manque) ; fréquence par partie dans le rapport de chaque étape du cycle ; alerte sous 0,5 par partie pour un mécanisme noté 8 ou 9 ;
   - b. **M2 et M3** : horaires (rêver à partir du tour *k*, jusqu'au tour *k*) et réflexes de rêve (règles simples qui lisent la situation) dans la bibliothèque de l'étape `boucles` ; lecture « une règle simple bat-elle le meilleur taux fixe ? » ;
   - c. **M4 et M5 (T4, T5)** : jugements du bot `mc` avec noms d'options et indices publics ; le bot juge une décision sur dix en manche 2 de la confirmation ; profil de Δ et lisibilité dans le rapport ; T4 remplace la mesure des dilemmes dans le registre (l'ancienne reste lisible) ; témoins V0.3 (dominé) et V0.4 (presque indifférent) ;
   - d. **M6 à M11** (pendant le cycle si besoin) : fiches du choix, contrôle des fausses découvertes, distribution des résultats, stabilité de la version proposée, objectifs hors score lus sur les finalistes ou signalés, vitesse du pipeline (profilage, lots courts, reprise, mémoire des résultats).
   Les sous-étapes a à c sont à faire **avant le lancement du cycle 2** ; elles servent aussi à juger l'essai du rêve disputé (3 ter).
4. **Plan `cycles/c2.json` et lancement du cycle 2** (V0.4 → V0.5), après la décision sur l'essai. Priorités : l'intérêt des choix et la profondeur ; le dilemme du rêve à 2 et 3 joueurs (alerte E) ; la difficulté à 3, 5 et 6 joueurs (alerte D), avec un réglage taille par taille et au plus 4 éléments propres au nombre de joueurs.

**Incident GitHub (13 oct.).** Le groupe de concurrence des fusions (`publication-resultats`) ne garde qu'une tâche en attente et annule les autres : les fusions des campagnes 12 et 13 ont été annulées, puis relancées avec `gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/runs/<id>/rerun-failed-jobs` (une seule à la fois). Corrigé pour les lancements suivants : plus de groupe, la publication réessaie. Les lots de campagne sont gardés 3 jours (1 jour avant la correction).

**Bot fort de la V2 (13 oct., décision technique de Claude, signalée à l'auteur).** En V2, le bot de référence MC 64 dont les suites ne rêvent pas rêve peu et perd contre le glouton qui rêve (tape-taupe −5 points). Le bot fort de la V2 est donc MC 64 chacun pour soi dont les suites rêvent une carte par tour (`MC64R` dans `foret/batterie.py`) : configurations `p3_v2r` et `m3_v2r`, campagnes de la V2 de l'étape 3.4 et de la robustesse. En v1, la référence reste MC 64 (ses suites ne rêvent pas : c'est là qu'il est le plus fort).

## 6. Verrou


## 7. Compteur de passages

- Semaine en cours : depuis le lundi 12 oct. 2026, 22 h (heure de Paris).
- Passages ayant réellement travaillé cette semaine : **4** (plafond : 12, décision du 13 oct.).
- Règle : le compteur est remis à zéro au premier passage qui suit un lundi 22 h. Un passage qui s'arrête aussitôt (décision attendue, verrou, campagne en cours, plafond) ne compte pas.

## 8. Réponses de l'auteur

*L'auteur écrit ici ses réponses aux DÉCISIONS UTILISATEUR, avec la date ; le passage suivant les applique et repart.*

- **15 oct. 2026, 17 h (recentrage sur la mécanique de base ; idée de la calebasse différée)** : l'auteur recentre la conception sur une mécanique de base seule (Méchant à n actions, Gentil à k actions, résolution automatique, t tours, r > 0 ; sans pistes, apprentissage, rêve ni peuples), à étudier par simulation (modèle « placement », conversation parallèle). Il trouve l'idée du **conseil de la calebasse** très intéressante et **diffère à plus tard sa conception**. Consigné : `projet/1-idees/parties-differees.md` (nouveau), statut de `projet/2-maquettes/proposition-conseil-calebasse.md`, section 0 de ce fichier, journal des décisions, README. Aucune règle adoptée. *Hypothèse de Claude, à confirmer : le noyau N1 et sa maquette restent disponibles comme référence mais ne sont plus la ligne active ; les quatre validations de la calebasse sont suspendues.*
- **15 oct. 2026, 9 h 50 (recul sur la démarche, `projet/3-pilotage/prendre-du-recul.md`, section 4)** : l'auteur répond oui aux cinq décisions : (1) cycle 2 suspendu jusqu'à la porte de conception ; (2) somnambule écarté ; (3) démarche « noyau d'abord » et porte de conception adoptées, critères à confirmer ; (4) directions D1 et D4 explorées d'abord ; (5) jeu humain avant tout nouveau code de règle. Il ajoute : repartir d'une maquette très simplifiée, centrée sur les idées fortes et les mécanismes les plus solides, sous forme **numérique et animée** (pas un rendu de boîte), jouable en incarnant tous les peuples ou avec des bots, avec les règles automatisées montrées à l'écran, des bots dont on comprend les choix, et des parties enregistrées pour l'analyse. Fait : noyau N1 (section 5, P0).

- **14 oct. 2026, 22 h 55 (rêve disputé, après la grille)** : l'auteur choisit de chercher une solution avec Claude plutôt que d'écarter ou de régler la règle ; il retient le somnambule, puis le somnambule avec plus de présages, et donne son accord pour coder les variantes d'essai. Fait (étape 3 ter, essai « le somnambule »).
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
- **13 oct. 2026, 14:45** : réveil au bon moment (une tâche « réveil » réarmée par chaque passage à la fin prévue des calculs) ; **Sonnet pour les passages courants, Opus pour les analyses de fin de cycle** (demande explicite de l'auteur). Consigne des passages déplacée dans la section 3 bis.
- **13 oct. 2026, 23:27 (adopter la V0.4, fin du cycle 1)** : l'auteur valide la proposition de V0.4 du bilan du cycle 1 (`projet/4-bilans/cycle-1-bilan.md`, section 7), soit la variante A : code d'atelier `c:A2a,d_fav,C2a,D2v_choix|m:C3,D5,A4|p:escalade=5,lunes=3` et réglages `{"regles": {"cercle_par_joueur": {"2": 4, "4": 3}, "machines_en_jeu": 5, "ordres_par_etape": {"2": 1, "4": 2}, "reves_par_pas": 2}}`. Sont acceptées avec elle les trois formes de règles qu'elle contient : le sablier des rêves (2 rêves pour un pas de l'esprit) ; les ordres supplémentaires du Méchant avec leur modélisation (dés neufs ; ni présage, ni Voir, ni Hanter, ni embuscade ; barrages oui) ; le module A4 (escalade du soir dès le tour 5). L'alerte A est levée pour la durée ; les alertes D et E restent à surveiller au cycle 2, comme le propose le bilan (section 6).
- **14 oct. 2026, 14:10 (C2 à C4)** : l'auteur adopte les trois propositions de `projet/3-pilotage/choix-strategique.md` (principes et règles de méthode ; profil de Δ et lisibilité en lecture seule ; fréquence des mécanismes voulus dans les rapports) et préfère appliquer dès la phase de sélection tout ce qui peut l'être. Traduit dans `projet/3-pilotage/avant-ou-apres-v1.md` et l'étape 3 quater (section 5).
- **14 oct. 2026, 8:06** : l'auteur demande à Claude de relire et vérifier ce qui a été produit, de trancher lui-même les deux questions laissées ouvertes (Claude a choisi : coder le garde-fou tout de suite ; renommer « Campagne P3 » en « Campagne de profondeur » dans le projet, pour éviter la confusion avec le protocole P3 du cycle 2) et de faire en sorte que le garde-fou s'applique dès les prochains tests. Fait (section 5, étape 3 bis).
- **14 oct. 2026, 7:55 (garde-fou « aucune boucle gagnante »)** : l'auteur demande qu'une action ou une suite d'actions répétée, y compris à plusieurs joueurs, ne constitue pas une stratégie gagnante, et accepte « dès à présent » la recommandation de Claude : garde-fou (pas de cinquième objectif), bandes proposées (écart à la meilleure boucle : vert ≥ 10 points, rouge < 3), conventions de table à plusieurs sièges incluses, lecture seule dès le cycle 2. Les bandes restent provisoires : à confirmer par l'auteur avant qu'elles jugent. Traduit dans `projet/3-pilotage/garde-fou-boucles-gagnantes.md`, le catalogue (décision C1), le plan (alerte F) et la section 5 (étape 3 bis).
- **14 oct. 2026, 11:50 (bandes du garde-fou « aucune boucle gagnante », option A)** : l'auteur confirme les bandes provisoires : écart à la meilleure boucle **vert ≥ 10 points, rouge < 3** (et, par cohérence, les autres bandes de `projet/3-pilotage/garde-fou-boucles-gagnantes.md`, section 5). Elles sont **à réexaminer après le cycle 2**, au vu d'un échantillon plus grand. Elles ne jugent toujours rien dans le score des variantes ; elles fixent le seuil de l'alerte de conception du rapport du cycle 2. Première lecture : V0.3 rouge, V0.4 orange (+6,0 à 4 joueurs, IC 95 % de 0,0 à 12,3).
- **14 oct. 2026, 13 h 28 (baisse de la forêt en V0.4)** : l'auteur répond que la baisse de la forêt gardée (92 % en V0.3, 72 % en V0.4) est **acceptable**. Alerte E (le meilleur taux de rêve fixe est 0 à 2 et 3 joueurs) : **confirmée** par l'analyse, décision de l'auteur **en attente**. Précision de l'auteur (14 oct., 13 h 43) : le dilemme exige que rêver soit meilleur dans certaines situations et défendre dans d'autres ; la mesure qui compte est le gain du bot libre (V0.3 +2,4, V0.4 −1,3). Proposition de conception de Claude, en remplacement de l'option A : `projet/2-maquettes/proposition-le-reve-dispute.md` (un rêve, un pas ; le cauchemar repousse le rêve), à tester en variante avec l'accord de l'auteur.
- **14 oct. 2026, 17 h 47 (rêve disputé : grille de réglage)** : l'auteur accepte la proposition de Claude : tester les réglages du rêve disputé sur une grille complète (lunes, force du cauchemar, sablier) avec le test T3 complet, plutôt qu'avec MAP-Elites ; MAP-Elites seulement ensuite, autour d'une zone prometteuse ; consigner et mettre en œuvre. Fait (étape 3 ter).
- **14 oct. 2026, 13 h 53 (alerte E : essai du rêve disputé)** : l'auteur accepte de **tester** la proposition `projet/2-maquettes/proposition-le-reve-dispute.md` selon ses modalités (variante, campagne appariée, décision au vu des résultats). Rien n'est adopté : la V0.4 reste la version de référence. Choix techniques de Claude : maquette `v0.4rd` (V0.4 + `reves_par_pas` 1 + règle `cauchemar`) ; la réussite qui déclenche le cauchemar est celle qu'apprend le Méchant (après Tromper) ; pas de second recul quand le tir à la corde a déjà repoussé l'esprit ; V0.4 non rejouée (graines identiques, moteur inchangé pour elle : comparaison appariée à la batterie 7 et à la campagne 19).

## 9. Campagnes GitHub

Durées de référence, mesurées de la création du lancement à la fin de la dernière tâche (pour estimer une durée avant un lancement). **Aucun calcul en cours au 14 oct. 2026, 10 h.** Le tableau complet des lancements 1 à 18, batteries et cycle « essai » est dans [`projet/4-bilans/campagnes-et-passages-historique.md`](projet/4-bilans/campagnes-et-passages-historique.md) ; ajouter ici les calculs en cours ou à traiter, et y déplacer les lignes une fois traitées.

| Lancement | Contenu | Lots | Durée totale | Lot le plus lent | Statut |
|---|---|---|---|---|---|
| Batterie 1 | batterie de la phase 1 complète, glouton, 96 200 parties | 16 | 2,5 min | 1,8 min | réussi |
| Campagne 7 | coordination_mc, v2 | 20 | 47,2 min | 27,6 min | réussi (a attendu la 6) |
| Campagne 13 | v2_options_mc, 16 variantes, MC 64 qui rêve, 960 parties | 20 | 82 min | 17 min | fusion annulée, relancée : réussi ; traité (section 7) |
| Campagne 15 | robustesse_v2, 16 variantes × bonus 10 et 25, 1 920 parties | 20 | 101 min (attentes comprises) | 34 min environ | réussi ; traité (diagnostic, section 8) |
| Campagne 16 | ligne_base_p2 (V0.3, 2 à 6 joueurs) : MC64R contre MCP64, témoins, coordination ; 544 parties | 14 | 48 min | 48 min (228 s-cœur par partie en moyenne) | réussi ; traité (ligne de base P2) |
| Cycle 1 | c1 : criblage (336 variantes, gloutons, 2 à 6 joueurs), exploration MAP-Elites (10 générations), confirmation MC64R (2 manches), contrôle MC 256 à portefeuille | 20 | 6 h 45 (estimé 5 h 20) | contrôle : 2 h 25 | réussi ; traité (bilan du cycle 1) |
| Campagne 18 | calibration_v04 (V0.4, 2 à 6 joueurs) : MC64R, MCP64, MC 64 rêve 0,5, MC 256 à portefeuille ; 256 parties, échantillon P2 | 20 | 86 min | 86 min | réussi (5 184 s pour le lot le plus lent ; 282 549 s-cœur) ; traité (a.2) |
| Campagne 19 | ligne_base_p2 sur **V0.4** (protocole P3, bot fort MC64R) ; 480 parties (la variante `sans_lunes` est ignorée en V0.4) | 14 | réussi, traité (a.3) | – | lancée le 14 oct. 9 h 30 UTC ; maquette vérifiée dans la synthèse (v0.4, moteur 1.8, 0 erreur) |
| Campagne 20 | ligne_base_p2 sur **V0.3** (ancre P3) ; 544 parties | 14 | réussi, traité (a.3) | 45 min | maquette vérifiée (v0.3, moteur 1.8, 0 erreur) |
| Batterie 7 | programme **p3** (pro3_v04 et pro3_v03, 1 336 parties : tables de 2 et 3, spectateur, taux de rêve, tape-taupe, gain du bot libre sur les duos) | 16 | réussi, traité (a.3) | 30 min | lancée le 14 oct. 9 h 30 UTC ; résultats dans `batterie/run7_p3/` (rapport.json, resume.md). Première lecture (14 oct., 13 h 25) : V0.4 foret 72,4 % contre 91,9 % en V0.3 ; meilleur taux de rêve fixe 0 en V0.4 (écart non significatif avec 1,0), 1,0 en V0.3 ; alerte E à trancher par l'auteur après l'analyse en apparié |
| Batterie 8 | programme **rd** (rd_v04rd : V0.4 + rêve disputé, 668 parties, mêmes graines que pro3_v04 de la batterie 7) | 16 | en cours | – | lancée le 14 oct. 12 h 02 UTC ; résultats attendus dans `batterie/run8_rd/` |
| Campagne 21 | ligne_base_p2 sur **v0.4rd** (rêve disputé), MC64R et portefeuille, témoins ; environ 480 parties ; appariée à la campagne 19 | 14 | en cours | – | lancée le 14 oct. 12 h 02 UTC ; fin estimée vers 14 h UTC (30 lots pour 20 emplacements) |
| Campagnes 22, 23, 24 | **choix_temoins** sur v0.3, v0.4 et v0.4rd : MC64R qui juge une décision sur quatre (jugements étiquetés), échantillon P2, 2 parties, 32 parties chacune ; témoins de T4 et T5 | 16 | 8 à 13 min | – | réussi ; traité (`projet/4-bilans/choix-strategique-premieres-lectures.md`, section 3) |
| Campagnes 25, 26, 27 | **choix_instrument** sur v0.3, v0.4 et v0.4rd : suites du bot qui ne rêvent jamais | 16 | 25 et 26 : environ 15 min ; 27 en cours | – | 25 et 26 réussies, traitées (bilan, section 3 : sans rêve dans ses suites, le bot ne rêve plus du tout ; le profil du rêve dépend de l'instrument) ; 27 à lire avec les suivantes |
| Campagne 27 | choix_instrument sur v0.4rd | 16 | environ 20 min | – | réussi ; traité (bilan, section 3) |
| Campagnes 28, 29, 30 | **choix_portefeuille** sur v0.3, v0.4 et v0.4rd : MCP64 qui juge une décision sur quatre | 16 | 15 à 25 min | – | réussi ; traité : le profil du rêve décision par décision ne sépare pas les témoins ; T3 complet (rêve 1, rêve 0, libre, apparié) les sépare : V0.3 dominé par rêver +5,8, V0.4 dominé par défendre −7,4, V0.4rd dominé par rêver +11,5 |
| Campagne 31 | **reve_dispute_grille** sur v0.4rd : grille 2 × 2 × 2 (lunes 3 ou 2, cauchemar d'une ou deux cases, un ou deux rêves pour un pas) × trois instruments du test T3 complet (MC64R, MC 64 sans rêve dans ses suites, MCP64), échantillon P2, 2 parties : 768 parties ; lancée le 14 oct., 18 h 12 (run 38596118170, 128 lots) | 128 | estimée 3 à 4 h (fin vers 22 h 15) ; réveil armé pour 22 h 30 (20:30 UTC) | 2 h 01 (fin 20 h 13) ; 130 tâches réussies | lue le 14 oct., 20 h 40 : aucun réglage retenu ; `projet/4-bilans/essai-reve-dispute.md`, section 3 |
| Campagne 32 (run 38639000435) | **reve_somnambule** sur v0.4rd : référence, somnambule, somnambule avec 2 ou 3 présages, somnambule qui apprend (avec ou sans 3 présages) × trois instruments du T3 complet, échantillon P2, 2 parties : 576 parties ;  | 96 | 1 h 30 à 2 h 30 | – | terminée le 14 oct. à 22:27 UTC (1 h 11 de calcul), lue le 15 oct. à 2 h 06 ; bilan : `projet/4-bilans/essai-somnambule.md` |
| Placement 1 | **placement_temoins** (modèle placement) : base et 4 témoins, 9 bots, 40 parties | 8 | 1 à 2 min | – | réussi ; résultats identiques au calcul local ; traité (`projet/4-bilans/placement-etude-1.md`) |
| Placement 2 | **placement_election** : les 20 meilleures du criblage (local, 400 variantes) et la base, avec le MC 256, 32 parties | 20 | 1 à 2 min | – | réussi ; traité (bilan, section 5) |
| Placement 3 | **placement_voisinage** : la base et 37 voisines à un cran, 48 parties | 20 | 2 min | – | réussi ; traité (bilan, section 5) |
| Placement 4 | **placement_mechant**, premier essai | 8 | – | – | échec de la fusion (analyse sans bot de référence) ; corrigé, relancé en Placement 6 |
| Placement 5 | **placement_confirmation** : 8 variantes, 160 parties | 20 | 1 min 20 | – | réussi ; traité (bilan, section 5) |
| Placement 6 | **placement_mechant** : 3 variantes × 5 forces × 3 bots, 64 parties | 12 | 2 min | – | réussi ; traité (bilan, section 7) |

*Les campagnes 2 à 7 ont été jouées avec le moteur avant l'accélération (moteur 1.7 : prévision deux fois plus rapide) : les mêmes campagnes prendraient aujourd'hui environ moitié moins de temps.*

## 10. Journal des passages

Les derniers passages. Les précédents (13 et 14 oct.) sont dans [`projet/4-bilans/campagnes-et-passages-historique.md`](projet/4-bilans/campagnes-et-passages-historique.md) : y déplacer les plus anciens quand ce tableau dépasse cinq lignes.

| Date | Début | Durée | Statut | Résumé |
|---|---|---|---|---|
| 15 oct. 2026 | 02:06 | 10 min | terminé | Réveil (Sonnet) : campagne 32 lue (réussie), bilan `projet/4-bilans/essai-somnambule.md` : aucun réglage ne remplit les trois critères (meilleur : « qui apprend », gain +7,3 sûr, riposte manque). DÉCISION UTILISATEUR sur le somnambule. Compté dans le plafond (4/12). |
| 15 oct. 2026 | 08:42 | 45 min | terminé | Session interactive (Opus, avec l'auteur) : recul sur la démarche, `projet/3-pilotage/prendre-du-recul.md` (bilan complété, risque, pistes, décisions groupées). Relecture des campagnes 18 à 20 : T1 sur la V0.4 (4 mécanismes centraux sur 8 sous le seuil), le rêve absent en duo pour tous les bots forts. Défaut d'instrument trouvé et corrigé : les témoins de communication hérités de la v2 remplaçaient la version (`maquettes/v2.json`, `tests/test_variantes_heritees.py`) ; aucune décision n'avait été prise sur ces chiffres. Conformité OK, tests verts. Aucune règle changée, aucun lancement GitHub. Pas compté dans le plafond. |
| 15 oct. 2026 | 09:50 | 35 min | terminé | Session interactive (Opus, avec l'auteur) : décisions du recul consignées ; noyau N1 écrit (`docs/regles_noyau.md`, proposition non adoptée) et maquette numérique jouable publiée (https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV ; `maquettes-numeriques/noyau/`, tests Node). Calibrage local aux bots (24 puis 24 réglages, 30 tables) : la première écriture était trop facile (97 % sans rêver) et le rêve à heure fixe menait au sommeil ; valeurs par défaut retenues (barrage « entrer et abattre », ordres = moitié des joueurs, un mouvement d'esprit par tour), indices : Lecteur 76 %, Défenseur 68 %, Rêveur 45 %. Aucune règle adoptée, aucun lancement GitHub. Pas compté dans le plafond. |
| 15 oct. 2026 | 14:05 | 30 min | terminé | Session interactive (Opus, avec l'auteur) : à sa demande, proposition d'un conseil à communication limitée, `projet/2-maquettes/proposition-conseil-calebasse.md` (visions privées des dés des étapes 2 et 3, calebasse qui passe, une parole par joueur qui n'engage que soi ; repères : mambeadero murui-muina, *rafue*). Diagnostic : sans information privée, aucune limite de parole ne peut valoir (écart « tout dire » − « aucun signe » de 0,6 point en V0.3) ; les bots de la maquette se concertent, donc jouent « tout dire ». Rien d'adopté, aucun lancement GitHub. Pas compté dans le plafond. |
| 15 oct. 2026 | 16:19 | 1 h | terminé | Session interactive (Opus, avec l'auteur) : à sa demande, **modèle « placement »**, la mécanique de base seule (`docs/regles_placement.md`, `placement/`, `tests/test_placement.py`, workflow Placement). Témoins validés ; criblage local de 400 variantes ; élection, voisinage, confirmation et force du Méchant sur GitHub (Placement 1 à 6) ; T4 et T5 en local. Bilan `projet/4-bilans/placement-etude-1.md` : viable par construction ; intéressant dans une zone étroite autour de la base (critères verts, choix « protéger ou se placer » disputé) ; m = n le plus profond. Six décisions proposées. Aucune règle du jeu changée. Pas compté dans le plafond. |
| 15 oct. 2026 | 17:10 | 20 min | terminé | Session interactive (Sonnet, avec l'auteur) : recentrage sur la mécanique de base seule (modèle « placement », conversation parallèle) ; conseil de la calebasse consigné comme idée retenue dont la conception est différée ; registre `projet/1-idees/parties-differees.md` ; section 0 d'ETAT.md, section 5, section 8, journal des décisions, README mis à jour. Aucune règle adoptée, aucun lancement GitHub. Pas compté dans le plafond. |

## 11. Reprendre la main

- **Débloquer une décision.** Écrire la réponse dans la section 8, sous la décision concernée, avec la date, puis committer (depuis GitHub, « Edit this file », cela suffit). Le passage suivant applique la réponse et repart.
- **Mettre en pause.** Écrire « PAUSE » dans la section 6 (Verrou) : les passages s'arrêtent tant que le mot y est.
- **Changer l'étape suivante.** Modifier la section 5.
- **Reprendre à la main dans une conversation.** Demander à Claude de lire ETAT.md : tout ce qu'il faut est dans le dépôt.
