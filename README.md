# La Forêt qui rêve

Un jeu de société coopératif en cours de conception. La forêt amazonienne affronte les Machines d'un patron de chantier, le Méchant, qui n'est joué par personne : ses ordres sortent de deux pistes publiques lues par deux dés, et il apprend de ce qui marche contre l'équipe. À terme, on pourra aussi l'endormir en le faisant rêver.

**Où en est la conception (16 oct. 2026).** Depuis le 15 oct., le travail porte sur la **mécanique de base seule** : un jeu de déplacement et de placement où chaque joueur défend sa tuile de forêt, posée en couronne autour d'un Cœur, contre les Machines du Méchant. Les deux pistes du Méchant et son apprentissage ont été réintroduits le 16 oct. ; le rêve, les esprits, les peuples et la communication au conseil sont **différés** ([registre](projet/1-idees/parties-differees.md)). Aucune version n'a été adoptée depuis la V0.4 du jeu complet, aujourd'hui archivée. L'état du travail, l'étape suivante et le journal sont dans [ETAT.md](ETAT.md).

## Carte du dépôt

```
ETAT.md                  Le journal : orientation, étape suivante, décisions attendues, passages
projet/                  Documents de conception (à lire en premier)
  1-idees/                 Les idées du jeu, le panel de joueurs visé, le registre des parties différées
  2-maquettes/             Les propositions en cours et les pistes en réserve
  3-pilotage/              Journal des décisions, objectifs et invariants, principes de méthode
  4-bilans/                Les études du modèle « placement »
  5-visuels/               Méthode de production des visuels
docs/regles_placement.md Les règles du modèle « placement » (P1 à P6, et la couronne)
docs/infrastructure_calcul.md Guide et accès à la VM de calcul Oracle Cloud (OCI)
placement/               Le moteur Python du modèle « placement » : règles, bots, campagnes, analyse
maquettes-numeriques/    Les maquettes jouables en JavaScript
  kit/                     « Forêt en couronne » : le kit par joueur, de 2 à 6 joueurs
  pistes/                  « Couronne aux deux pistes » : le Méchant lu sur ses pistes, deux cartes par joueur
campagnes/               Les plans de campagne du modèle « placement » (JSON)
resultats/placement/     Rapports et synthèses de référence des campagnes « placement »
tests/                   Les tests du modèle « placement »
scripts/                 Publication des résultats sur la branche resultats
archive/                 Le jeu complet V0.1 à V0.4 (moteur foret, plans, bilans) et le noyau N1 : voir archive/LISEZMOI.md
.github/workflows/       Tests à chaque envoi ; campagnes « placement » à la demande
```

## Les documents de conception

| Document | Contenu |
|---|---|
| **Ligne active** | |
| [Règles du modèle « placement »](docs/regles_placement.md) | La mécanique de base : grille ou couronne, menaces, ordres du Gentil, résolution automatique |
| [Le Gentil réparti entre 2 et 6 joueurs](projet/2-maquettes/proposition-gentil-reparti.md) | Le kit par joueur (retenu le 15 oct.) |
| [Le Méchant lu sur ses pistes, deux ordres par joueur](projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md) | Le modèle de la campagne 3 (accord de l'auteur le 16 oct.) |
| [Étude 1 du modèle « placement »](projet/4-bilans/placement-etude-1.md) | Viable par construction ; intéressant dans une zone étroite ; m = n le plus profond |
| [Étude 2 : le kit par joueur](projet/4-bilans/placement-etude-2-kit.md) | La couronne règle le placement ; le réglage robuste de 2 à 6 joueurs |
| [Diviser le Gentil : 1 à 6 joueurs](projet/3-pilotage/nombre-de-joueurs-pistes.md) | Pistes structurelles pour le nombre de joueurs, et sondes chiffrées |
| [Infrastructure de calcul VM Cloud](docs/infrastructure_calcul.md) | Fiche technique, accès SSH et commandes d'exécution sur la VM OCI |
| **Le jeu visé et ses principes** | |
| [Synthèse des idées](projet/1-idees/synthese-des-idees.md) | Toutes les idées du jeu, notées par l'auteur (11 oct.) |
| [Mécanique du Méchant](projet/1-idees/mecanique-du-mechant.md) et [Dynamique d'ensemble](projet/1-idees/dynamique-d-ensemble.md) | La machine qui apprend ; le rythme de la bataille, le Méchant qui rêve (10 oct.) |
| [Panel de joueurs virtuels](projet/1-idees/panel-de-joueurs-virtuels.md) | Les profils de joueurs visés |
| [Maquette de conception v2](projet/2-maquettes/maquette-de-conception-v2.md) et [atelier v2](projet/2-maquettes/atelier_v2.html) | Le Méchant à deux pistes, d'où viennent les pistes réintroduites |
| [Objectifs, invariants et catalogue](projet/3-pilotage/objectifs-invariants-catalogue.md) | Les objectifs d'expérience, leurs bandes, ce qui ne change pas |
| [Ce qui fait un choix stratégique](projet/3-pilotage/choix-strategique.md) | Choix dominé, indifférent ou disputé ; principes et tests T1 à T5 (adoptés le 14 oct.) |
| [Garde-fou « aucune boucle gagnante »](projet/3-pilotage/garde-fou-boucles-gagnantes.md) | Aucune action répétée ne doit gagner (décision C1) |
| [Prendre du recul](projet/3-pilotage/prendre-du-recul.md) | La démarche « noyau d'abord » et la porte de conception (15 oct.) |
| [Journal des décisions](projet/3-pilotage/journal-des-decisions.md) | Toutes les décisions de l'auteur |
| **En réserve (différé)** | |
| [Parties différées](projet/1-idees/parties-differees.md) | Ce qui est mis de côté, où c'est consigné, quand y revenir |
| [Le conseil de la calebasse](projet/2-maquettes/proposition-conseil-calebasse.md) | Communication limitée au conseil : idée retenue, conception différée |
| [Le rêve disputé : problème et pistes](projet/2-maquettes/reve-dispute-problematique-et-pistes.md) | Les pistes encore ouvertes pour un rêve qui soit un vrai choix |
| [Visuels : méthode et techniques](projet/5-visuels/methode-et-techniques.md) | Flux hybride de production du matériel (14 oct.) |

Les fichiers HTML s'ouvrent dans un navigateur, après téléchargement. Les maquettes jouables publiées : [Forêt en couronne](https://claude.ai/artifact/Y8uxpq492aWUdXN3h1uRps) et [Couronne aux deux pistes](https://claude.ai/artifact/RL3rYyXRXAtiUKZgp3Frnk) (pages privées du propriétaire du dépôt).

## Le modèle « placement »

Python 3.10 ou plus, sans dépendance ; pytest pour les tests. Tout se lance depuis la racine du dépôt.

```bash
python -m pip install pytest
python -m placement.partie --bot mc --graine 3                      # une partie commentée
python -m placement.campagne campagnes/placement_temoins.json --sortie res/
python -m placement.analyse res/synthese.json --md rapport.md
python -m placement.dispute --parties 40 --param annonces=3          # le choix « protéger ou se placer » est-il disputé ?
python -m pytest -q tests
node maquettes-numeriques/kit/test_moteur.js                         # la maquette du kit rejoue le moteur Python
node maquettes-numeriques/pistes/test_moteur.js
```

## Les workflows GitHub

- **Tests** (`tests.yml`) : à chaque envoi qui touche au code, les tests du modèle et des deux maquettes.
- **Placement** (`placement.yml`) : onglet **Actions** → **Placement** → **Run workflow**, avec un plan `campagnes/placement_*.json`. Les lots sont joués en parallèle, fusionnés, puis la synthèse et le rapport sont publiés sur la branche [`resultats`](https://github.com/antoineacquaviva/Projet_Jeu/tree/resultats), dans `placement/<plan>_run<n>/`. Lancement par l'API REST (commande dans `ETAT.md`).

## Méthode

- La simulation propose, l'auteur décide, les tests humains jugent l'expérience.
- Après chaque changement de règle ou de code : mettre à jour les documents, ajouter un test qui cite la règle, lancer les tests.
- Toujours distinguer le mesuré (campagne, bot fort, écart sûr) du supposé (indice local, bots faibles).
- Une partie mise de côté est consignée dans le registre des parties différées, jamais supprimée.
