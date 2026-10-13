# La Forêt qui rêve

Un jeu de société coopératif en cours de conception. La forêt amazonienne affronte les Machines d'un patron de chantier, le Méchant, sur le plateau et dans ses rêves. Le Méchant n'est joué par personne : ses ordres sortent d'une piste de pensées et de deux dés, et il apprend de ce qui marche contre l'équipe.

Ce dépôt réunit deux choses :
- **les documents de conception** : les idées, les maquettes de règles, le plan de travail et les bilans ;
- **le moteur de simulation** `foret` : il joue les règles sans interface, avec des joueurs virtuels, pour trouver les failles des règles et mesurer les variantes.

Où en est le projet (13 oct. 2026) : les phases 1 (mesures) et 2 (le bot fort, moteur 1.7) sont faites. Le diagnostic de la phase 3 est fait ([projet/4-bilans/diagnostic-v1-options-v2.md](projet/4-bilans/diagnostic-v1-options-v2.md)) : la v2 est fixée (13 oct. : « V2 proposée » plus les lunes) ; la phase 4 (exploration) commence. L'état du travail, les étapes restantes et le journal des passages automatiques sont dans [ETAT.md](ETAT.md).

## Carte du dépôt

```
projet/                  Documents de conception et de pilotage (à lire en premier)
  1-idees/                 Les idées du jeu et leurs notes, le panel de joueurs visé
  2-maquettes/             Les maquettes de règles : v1 (livret HTML) et l'atelier v2
  3-pilotage/              Le plan d'action, les objectifs et le catalogue, le choix du calcul
  4-bilans/                Ce que les simulations ont montré, phase par phase
docs/                    Documentation technique du moteur (lue en partie par le code)
foret/                   Le moteur de simulation (Python pur)
maquettes/               Les règles en données : v0, v1, v2 (chacune hérite de la précédente)
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
| `3-pilotage` | [Plan d'action](projet/3-pilotage/plan-d-action.md) | Les six phases : cadrer, mesurer, bots, diagnostic, exploration, validation |
| | [Objectifs, invariants et catalogue](projet/3-pilotage/objectifs-invariants-catalogue.md) | Les quatre objectifs d'expérience, leurs bandes, ce qui ne change pas, les variables |
| | [Cahier des charges du calcul](projet/3-pilotage/cahier-des-charges-calcul.md) | Où faire tourner les campagnes : GitHub Actions (décision 10) |
| `4-bilans` | [Moteur v0 : lacunes et incohérences](projet/4-bilans/moteur-v0-lacunes.md) | Le premier moteur et ce qu'il a révélé |
| | [Moteur v1 : conformité et campagne de référence](projet/4-bilans/moteur-v1-conformite.md) | L'audit règle par règle, v0 contre v1 |
| | [Phase 1 : avancement](projet/4-bilans/phase1-avancement.md) | Copie d'état, communication, v2 dans le moteur |
| | [Batterie d'évaluation (phase 1)](projet/4-bilans/batterie-evaluation-phase1.md) | **Le livrable de la phase 1** : les mesures, les témoins, les verdicts |
| | [Bots : échelle et validation (phase 2)](projet/4-bilans/bots-echelle-validation.md) | **Le livrable de la phase 2** : le bot fort, l'échelle des bots, défendre ou rêver, le devin, le chef unique |
| | [Diagnostic de la v1 et options de la v2 (phase 3)](projet/4-bilans/diagnostic-v1-options-v2.md) | **Le livrable de la phase 3** : verdicts du bot fort, jeu restreint, options de la v2, robustesse, recommandations |

Les fichiers HTML s'ouvrent dans un navigateur, après téléchargement. Les documents citent parfois des chemins `claude/moteur-v1/…` : ce sont ceux de l'espace de travail d'origine, qui correspondent ici à la racine du dépôt.

## Le moteur de simulation

Python 3.10 ou plus, sans dépendance ; pytest pour les tests. Tout se lance depuis la racine du dépôt.

```bash
python -m pip install pytest

# Une partie commentée, étape par étape
python -m foret.partie --peuples oiseaux insectes --bot glouton --graine 3
python -m foret.partie --maquette v2 --peuples reptiles entites --bot glouton

# Une campagne (5 % des parties pour un essai)
python -m foret.sim reference --echelle 0.05

# La batterie d'évaluation de la phase 1 (environ 35 min sur 2 cœurs)
python -m foret.batterie phase1
python -m foret.batterie rapport

# La même batterie par lots (une machine par lot), puis la fusion
python -m foret.batterie phase1 --lot 0/8 --sortie lots/
python -m foret.batterie phase1 --fusionner lots/

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
- **Campagne** (`campagne.yml`) : onglet **Actions** → **Campagne** → **Run workflow**. On choisit la campagne (un fichier de `campagnes/`), la maquette, l'échelle et le nombre de lots. Les lots sont joués en parallèle, puis fusionnés. La synthèse est publiée sur la branche [`resultats`](https://github.com/antoineacquaviva/Projet_Jeu/tree/resultats), dans `campagnes/<campagne>_run<n>/`.

Les résultats bruts de la batterie (`resultats/batterie/`, environ 280 Mo) ne sont pas versionnés : `python -m foret.batterie phase1`, ou le workflow Batterie, les régénère à l'identique (graines reproductibles). Le rapport et le tableau de bord qui en sont tirés sont dans `resultats/`.

## Méthode

- Chaque phase se termine par un document de `projet/` et une décision de l'auteur.
- Après chaque changement de règle ou de code : mettre à jour les documents, ajouter un test qui cite la règle, puis lancer les contrôles de conformité et les tests.
- Chaque mesure porte une étiquette (*mesure*, *indice*, *humain seulement*) et a été validée sur des variantes témoins, cassées exprès, avant de juger le jeu.
- La simulation propose, l'auteur décide, les tests humains jugent l'expérience.
