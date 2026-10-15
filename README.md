# La Forêt qui rêve

Un jeu de société coopératif en cours de conception. La forêt amazonienne affronte les Machines d'un patron de chantier, le Méchant, sur le plateau et dans ses rêves. Le Méchant n'est joué par personne : ses ordres sortent d'une piste de pensées et de deux dés, et il apprend de ce qui marche contre l'équipe.

Ce dépôt réunit deux choses :
- **les documents de conception** : les idées, les maquettes de règles, le plan de travail et les bilans ;
- **le moteur de simulation** `foret` : il joue les règles sans interface, avec des joueurs virtuels, pour trouver les failles des règles et mesurer les variantes.

**Orientation du 15 oct. 2026 :** la conception se concentre sur la **mécanique de base seule** (un Méchant à n actions, un Gentil à k actions, déplacement et placement ; [docs/regles_placement.md](docs/regles_placement.md), code dans `placement/`). Pistes, apprentissage, rêve, peuples et communication sont **différés** : voir [projet/1-idees/parties-differees.md](projet/1-idees/parties-differees.md), qui consigne notamment l'idée du conseil de la calebasse. Le texte ci-dessous décrit l'état de la V0.4, toujours la dernière version adoptée.

Où en est le projet (13 oct. 2026) : les phases 1 (mesures), 2 (le bot fort) et 3 (diagnostic, [projet/4-bilans/diagnostic-v1-options-v2.md](projet/4-bilans/diagnostic-v1-options-v2.md)) sont faites. Le jeu en est à la **V0.4** (adoptée à la fin du cycle 1, [bilan](projet/4-bilans/cycle-1-bilan.md)) ; la suite suit le [plan vers la V1](projet/3-pilotage/plan-vers-v1.md) : trois cycles au plus de simulation, puis une V1.0 testée par des joueurs. L'état du travail, les étapes restantes et le journal des passages automatiques sont dans [ETAT.md](ETAT.md).

## Les versions du jeu

| Version | Ancien nom | Maquette (`maquettes/`) | Statut |
|---|---|---|---|
| V0.1 | v0 | `v0.json` | historique |
| V0.2 | v1 (livret publié) | `v1.json` | étalon figé, cité pour contraste |
| V0.3 | v2 fixée (13 oct.) : « V2 proposée » + lunes | `v0.3.json` | point de départ du plan, ancre du cycle 2 ; « V2 proposée » = `v2.json` ou `v0.3` variante `sans_lunes` |
| **V0.4** | variante A du cycle 1 | `v0.4.json` | **adoptée le 13 oct.** ; point de départ du cycle 2 |
| V0.5, V0.6 | – | une par cycle | à venir |
| V1.0 | – | – | la version gelée pour les tests humains |

La version du jeu (V0.3) et celle du moteur (1.7.1) sont deux numérotations distinctes. Les anciens fichiers et codes d'atelier restent valides : les résultats passés se relisent tels quels.

## Carte du dépôt

```
projet/                  Documents de conception et de pilotage (à lire en premier)
  1-idees/                 Les idées du jeu et leurs notes, le panel de joueurs visé
  2-maquettes/             Les maquettes de règles : v1 (livret HTML) et l'atelier v2
  3-pilotage/              Le plan d'action, les objectifs et le catalogue, le choix du calcul
  4-bilans/                Ce que les simulations ont montré, phase par phase
docs/                    Documentation technique du moteur (lue en partie par le code)
foret/                   Le moteur de simulation (Python pur)
maquettes/               Les règles en données : v0 (V0.1), v1 (V0.2), v2, v0.3 (V0.3), v0.4 (V0.4) ; chacune hérite de la précédente
maquettes-numeriques/     Le noyau N1 jouable (15 oct.) : moteur et bots en JavaScript, page animée, tests Node ; règles dans docs/regles_noyau.md
placement/               Le modèle « placement » (15 oct.) : la mécanique de base seule, ses bots et ses campagnes ; règles dans docs/regles_placement.md
campagnes/               Les campagnes de simulation, en JSON
tests/                   Les tests : chaque règle, nœud ou mesure a au moins le sien
outils/tableau/          Le générateur du tableau de bord de la batterie
scripts/                 Petits scripts des workflows
resultats/               Résultats de référence conservés (synthèses, rapports, tableau)
.github/workflows/       Tests à chaque envoi ; campagnes par lots à la demande
```

## Les documents de conception (`projet/`)

Pour découvrir le jeu, lire dans l'ordre : la synthèse des idées, puis le livret de la maquette v1, puis l'atelier v2.

| Dossier | Document | Contenu |
|---|---|---|
| `1-idees` | [Synthèse des idées](projet/1-idees/synthese-des-idees.md) | **Le document de référence** : toutes les idées, notées par l'auteur (11 oct.) |
| | [Mécanique du Méchant](projet/1-idees/mecanique-du-mechant.md) | La machine qui apprend, première simulation (10 oct.) |
| | [Dynamique d'ensemble](projet/1-idees/dynamique-d-ensemble.md) | Le rythme de la bataille, le Méchant qui rêve (10 oct.) |
| | [Panel de joueurs virtuels](projet/1-idees/panel-de-joueurs-virtuels.md) | Les profils de joueurs visés et ce qu'ils attendent |
| `2-maquettes` | [Index des maquettes](projet/2-maquettes/index-maquettes.md) | Où trouver quoi pour la v1 et la v2 |
| | [Maquette v1](projet/2-maquettes/maquette_v1.html) (HTML) | Le contenu de la boîte et le livret de règles complet |
| | [Règles de la maquette v1](docs/regles_v1.md) | Les 45 règles numérotées (R1.1…), référence du moteur |
| | [Maquette de conception v2](projet/2-maquettes/maquette-de-conception-v2.md) | Le plan du Méchant à deux pistes, les trois fins, le conseil par traces |
| | [Atelier v2](projet/2-maquettes/atelier_v2.html) (HTML interactif) | L'arbre des variantes, avec le livret assemblé à la volée |
| | [Règles du noyau N1](docs/regles_noyau.md) et [maquette jouable](https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV) | Le jeu recentré sur ses idées fortes, rêve qui détourne (15 oct., proposition non adoptée) |
| | [Règles du modèle « placement »](docs/regles_placement.md) | La mécanique de base seule : grille, menaces annoncées, k ordres du Gentil, perte du tour entre n − k et n (15 oct., modèle d'étude) |
| | [Forêt en couronne](https://claude.ai/artifact/Y8uxpq492aWUdXN3h1uRps) (maquette jouable, sources `maquettes-numeriques/kit/`) | Le kit par joueur de 2 à 6 joueurs : couronne de tuiles, humains ou bots expliqués, parties enregistrées (15 oct.) |
| | [Modèle placement, étude 2](projet/4-bilans/placement-etude-2-kit.md) | Le kit par joueur de 2 à 6 joueurs : la couronne règle le placement ; le réglage qui tient à toutes les tailles |
| `3-pilotage` | [Plan d'action](projet/3-pilotage/plan-d-action.md) | Les six phases : cadrer, mesurer, bots, diagnostic, exploration, validation |
| | [Objectifs, invariants et catalogue](projet/3-pilotage/objectifs-invariants-catalogue.md) | Les quatre objectifs d'expérience, leurs bandes, ce qui ne change pas, les variables |
| | [Cahier des charges du calcul](projet/3-pilotage/cahier-des-charges-calcul.md) | Où faire tourner les campagnes : GitHub Actions (décision 10) |
| | [Journal des décisions](projet/3-pilotage/journal-des-decisions.md) | Toutes les décisions de l'auteur (A1 à A13, B1 à B4, C1, D1 à D9, plan vers la V1) |
| | [Avant ou après la V1](projet/3-pilotage/avant-ou-apres-v1.md) | Ce qui s'applique dès les cycles en cours (M1 à M11), à chaque version adoptée, ou après la V1 |
| | [Campagne de profondeur](projet/3-pilotage/campagne-de-profondeur.md) | La campagne qui suivra la V1 : bots renforcés, courbe d'apprentissage, failles, vitesse |
| | [Ce qui fait un choix stratégique](projet/3-pilotage/choix-strategique.md) | La leçon du rêve (14 oct.) : choix dominé, indifférent ou disputé ; principes de conception, tests T1 à T5, règles de méthode |
| | [Diviser le Gentil : 1 à 6 joueurs](projet/3-pilotage/nombre-de-joueurs-pistes.md) | Pistes structurelles pour le nombre de joueurs (règle générique, une Machine par joueur, tuiles en couronne, jeu constant partagé) et sondes chiffrées (15 oct.) |
| | [Garde-fou « aucune boucle gagnante »](projet/3-pilotage/garde-fou-boucles-gagnantes.md) | Aucune action ni suite d'actions répétée, ni convention de table, ne doit gagner (décision C1, 14 oct.) |
| `4-bilans` | [Moteur v0 : lacunes et incohérences](projet/4-bilans/moteur-v0-lacunes.md) | Le premier moteur et ce qu'il a révélé |
| | [Moteur v1 : conformité et campagne de référence](projet/4-bilans/moteur-v1-conformite.md) | L'audit règle par règle, v0 contre v1 |
| | [Phase 1 : avancement](projet/4-bilans/phase1-avancement.md) | Copie d'état, communication, v2 dans le moteur |
| | [Batterie d'évaluation (phase 1)](projet/4-bilans/batterie-evaluation-phase1.md) | **Le livrable de la phase 1** : les mesures, les témoins, les verdicts |
| | [Bots : échelle et validation (phase 2)](projet/4-bilans/bots-echelle-validation.md) | **Le livrable de la phase 2** : le bot fort, l'échelle des bots, défendre ou rêver, le devin, le chef unique |
| | [Diagnostic de la v1 et options de la v2 (phase 3)](projet/4-bilans/diagnostic-v1-options-v2.md) | **Le livrable de la phase 3** : verdicts du bot fort, jeu restreint, options de la v2, robustesse, recommandations |
| | [Ligne de base P2 : la V0.3 de 2 à 6 joueurs](projet/4-bilans/ligne-de-base-p2.md) | Étape 0.11 du plan vers la V1 |
| | [Bilan du cycle 1 : de la V0.3 à la V0.4 proposée](projet/4-bilans/cycle-1-bilan.md) | Durée réglée, difficulté selon le bot, proposition de V0.4, alertes D et E |
| | [Tests du choix stratégique : premières lectures](projet/4-bilans/choix-strategique-premieres-lectures.md) | T1 : le tir à la corde absent en V0.3 et V0.4, réel avec le cauchemar ; T3 léger : aucune règle simple de rêve ne bat l'horloge |
| | [Garde-fou « aucune boucle gagnante » : première lecture](projet/4-bilans/garde-fou-boucles-ligne-de-base.md) | V0.3 rouge (une boucle égale le bot fort), V0.4 orange (6 points à 4 joueurs) |
| | [Le modèle « placement » : étude 1](projet/4-bilans/placement-etude-1.md) | Viable par construction ; intéressant dans une zone étroite ; le choix « protéger ou se placer » disputé ; m = n le plus profond (15 oct.) |
| | [Historique des campagnes et des passages](projet/4-bilans/campagnes-et-passages-historique.md) | Tableau complet des lancements GitHub et journal des passages (hors `ETAT.md`) |
| `5-visuels` | [Visuels : méthode et techniques](projet/5-visuels/methode-et-techniques.md) | Dossier de cadre de l’auteur, révisé : flux hybride (fait main, 3D, code, IA guidée), principes, pièces, flux par famille, agents, impression, provenance, phasage (14 oct.) |

Les fichiers HTML s'ouvrent dans un navigateur, après téléchargement. Les documents citent parfois des chemins `claude/moteur-v1/…` : ce sont ceux de l'espace de travail d'origine, qui correspondent ici à la racine du dépôt.

## Le moteur de simulation

Python 3.10 ou plus, sans dépendance ; pytest pour les tests. Tout se lance depuis la racine du dépôt.

```bash
python -m pip install pytest

# Une partie commentée, étape par étape
python -m foret.partie --peuples oiseaux insectes --bot glouton --graine 3
python -m foret.partie --maquette v0.3 --peuples reptiles entites --bot glouton

# Une campagne (5 % des parties pour un essai)
python -m foret.sim reference --echelle 0.05

# La batterie d'évaluation de la phase 1 (environ 35 min sur 2 cœurs)
python -m foret.batterie phase1
python -m foret.batterie rapport

# La même batterie par lots (une machine par lot), puis la fusion
python -m foret.batterie phase1 --lot 0/8 --sortie lots/
python -m foret.batterie phase1 --fusionner lots/

# Garde-fou « aucune boucle gagnante » : la bibliothèque de stratégies répétées, appariée au bot fort
python -m foret.boucles campagne --maquette v0.4 --tables-de campagnes/calibration_v04.json --sortie campagnes/boucles_v04.json
python -m foret.sim campagnes/boucles_v04.json --sortie boucles_v04/
python -m foret.boucles analyser --boucles boucles_v04/synthese.json --fort <synthese du bot fort>

# Modèle « placement » : une partie commentée, une campagne, son analyse, le choix disputé
python -m placement.partie --bot mc --graine 3
python -m placement.campagne campagnes/placement_temoins.json --sortie res/
python -m placement.analyse res/synthese.json --md rapport.md
python -m placement.dispute --parties 40 --param annonces=3

# Contrôles : conformité règles, nœuds et mesures ↔ code ↔ tests
python -m foret.conformite
python -m foret.conformite --v2
python -m foret.conformite --mesures
python -m pytest -q tests
```

La documentation complète (architecture, maquettes, communication, v2, batterie, manière d'étendre le moteur) est dans [docs/moteur.md](docs/moteur.md). Les autres documents techniques : [noeuds_v2.md](docs/noeuds_v2.md) (les nœuds de l'atelier tels que le moteur les joue), [mesures.md](docs/mesures.md) (les mesures et leurs témoins), [conformite_v1.md](docs/conformite_v1.md) (la matrice règle → code → tests).

## Les campagnes sur GitHub Actions

- **Tests** (`tests.yml`) : à chaque envoi, la conformité et les tests tournent sous Python 3.10 et 3.12.
- **Batterie** (`batterie.yml`) : onglet **Actions** → **Batterie** → **Run workflow**. On choisit l'échelle, le nombre de lots et, si on veut, quelques configurations. Les lots sont joués en parallèle, fusionnés, puis le rapport, le tableau de bord et un résumé sont publiés sur la branche `resultats`, dans `batterie/run<n>/`. Si un lot échoue, « Re-run failed jobs » ne rejoue que lui et la fusion.
- **Placement** (`placement.yml`) : onglet **Actions** → **Placement** → **Run workflow**, avec un plan `campagnes/placement_*.json`. Synthèse et rapport publiés sur la branche `resultats`, dans `placement/<plan>_run<n>/`.
- **Campagne** (`campagne.yml`) : onglet **Actions** → **Campagne** → **Run workflow**. On choisit la campagne (un fichier de `campagnes/`), la maquette, l'échelle et le nombre de lots. Les lots sont joués en parallèle, puis fusionnés. La synthèse est publiée sur la branche [`resultats`](https://github.com/antoineacquaviva/Projet_Jeu/tree/resultats), dans `campagnes/<campagne>_run<n>/`.

Les résultats bruts de la batterie (`resultats/batterie/`, environ 280 Mo) ne sont pas versionnés : `python -m foret.batterie phase1`, ou le workflow Batterie, les régénère à l'identique (graines reproductibles). Le rapport et le tableau de bord qui en sont tirés sont dans `resultats/`.

## Méthode

- Chaque phase se termine par un document de `projet/` et une décision de l'auteur.
- Après chaque changement de règle ou de code : mettre à jour les documents, ajouter un test qui cite la règle, puis lancer les contrôles de conformité et les tests.
- Chaque mesure porte une étiquette (*mesure*, *indice*, *humain seulement*) et a été validée sur des variantes témoins, cassées exprès, avant de juger le jeu.
- La simulation propose, l'auteur décide, les tests humains jugent l'expérience.
