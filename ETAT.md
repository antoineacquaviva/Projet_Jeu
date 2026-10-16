# ETAT : reprendre le travail à froid

Ce fichier suffit à une session neuve, sans accès aux conversations passées, pour reprendre la conception du jeu. Il est lu au début de chaque session de travail et mis à jour à la fin. **L'auteur** (le propriétaire du dépôt) y répond aux décisions dans la section 7.

*Allégé le 16 oct. 2026 (rangement du dépôt). L'`ETAT.md` complet de la phase V0.x (phase 3, plan vers la V1, cycle 2, consigne des passages automatiques, campagnes 1 à 32) est conservé tel quel dans [`archive/conception-v0x/pilotage/ETAT-jusqu-au-16-oct.md`](archive/conception-v0x/pilotage/ETAT-jusqu-au-16-oct.md).*

## 0. Orientation en vigueur : lire d'abord

**La conception se concentre sur la mécanique de base** (décision de l'auteur, 15 oct., 17 h) : un jeu de déplacement et de placement entre un Méchant qui programme ses menaces par un hasard contrôlé et un « Gentil » (les joueurs) qui programme ses ordres ; résolution automatique ; on compte les arbres restants. On étudie par simulation et par maquettes jouables si ce noyau est **viable** et **stratégiquement intéressant**.

Le chemin parcouru, en quatre pas :
1. **Modèle « placement »** (15 oct.) : un Gentil unique sur une grille ; viable, intéressant dans une zone étroite ([étude 1](projet/4-bilans/placement-etude-1.md)).
2. **Le kit par joueur** (15 oct.) : une tuile par joueur en couronne autour d'un Cœur, de 2 à 6 joueurs ; réglage robuste vert de 2 à 5 joueurs ([proposition](projet/2-maquettes/proposition-gentil-reparti.md), [étude 2](projet/4-bilans/placement-etude-2-kit.md), maquette [Forêt en couronne](https://claude.ai/artifact/Y8uxpq492aWUdXN3h1uRps)).
3. **Retour de l'auteur** (16 oct. matin) : la maquette fonctionne, mais on joue « réflexe » (parer la menace annoncée) et l'ordre d'exécution caché ne se sent pas.
4. **Le Méchant lu sur ses pistes, deux ordres par joueur** (16 oct.) : les menaces ne sont plus annoncées, elles sortent de deux pistes publiques et de deux dés, et le Méchant apprend ; chaque joueur programme deux cartes révélées en deux étapes ([proposition et décisions](projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md), maquette [Couronne aux deux pistes](https://claude.ai/artifact/RL3rYyXRXAtiUKZgp3Frnk), sources `maquettes-numeriques/pistes/`). C'est le **modèle de la campagne 3**.

**Différé, par choix de l'auteur** ([registre](projet/1-idees/parties-differees.md)) : le rêve et les esprits, les peuples et leurs règles brisées, la communication au conseil (dont le conseil de la calebasse, idée retenue). Le jeu complet V0.1 à V0.4, son moteur `foret` et le cycle 2 sont **archivés** (`archive/`, voir son [LISEZMOI](archive/LISEZMOI.md)) ; le noyau N1 aussi.

**Pour toute session** : ne pas proposer, coder ni tester de règle sur une partie différée sans que l'auteur le demande (le signaler, et consigner l'idée dans le registre) ; aucune règle du jeu n'est adoptée par les modèles d'étude : la V0.4 reste la dernière version adoptée du jeu complet.

## 1. Le projet en bref

« La Forêt qui rêve » est un jeu de société coopératif. Les joueurs défendent un morceau de forêt amazonienne contre les Machines d'un Méchant automatique, qui apprend de ce qui marche ; à terme, on pourra aussi l'endormir par les rêves. Le résultat d'une partie est la forêt restante. La simulation propose, l'auteur décide, les tests humains jugent l'expérience.

Documents à lire avant de travailler : `README.md` (carte du dépôt), `docs/regles_placement.md`, la proposition des pistes et les deux études (section 0), le [journal des décisions](projet/3-pilotage/journal-des-decisions.md).

## 2. Qui décide quoi, et règles de travail

- **Claude tranche seul** les choix techniques (outils, code, workflows, bots, mesures et seuils techniques, budgets de calcul) et les consigne au journal des décisions.
- **L'auteur tranche** les règles du jeu et leurs formes, l'adoption d'une version, les invariants et les bandes, les alertes de conception. Un défaut que les paramètres ne corrigent pas lui est signalé dès qu'il apparaît.
- **Jamais sans accord** : suppression définitive d'un document (par lot validé), modification d'une règle du jeu, adoption d'une version, changement des invariants ou des bandes, publication, message à l'extérieur, dépense, clé d'API.
- **Pas de blocage** : en cas d'ambiguïté, retenir l'hypothèse la plus raisonnable, la signaler en une ligne et continuer ; les demandes de validation sont regroupées en un seul lot en fin de session, avec une recommandation pour chacune. Chaque tour se termine par FAIT, ATTENTE DE L'AUTEUR ou RELANCE NÉCESSAIRE.
- **Calcul** (décision 10) : les campagnes lourdes tournent sur GitHub Actions dans ce dépôt public : volumes raisonnables, pas de lancements en continu, aucune donnée personnelle, aucune image du jeu sans décision de l'auteur.
- **Après tout changement de règle ou de code** : mettre à jour les documents, ajouter un test qui cite la règle, lancer `python -m pytest -q tests` et les tests Node des maquettes touchées. Toujours distinguer le mesuré du supposé.

## 3. Comment travailler

- **Installation** : `python -m pip install pytest` (Python 3.10 ou plus) ; Node 18 ou plus pour les maquettes.
- **Contrôles** (moins d'une minute) : `python -m pytest -q tests && node maquettes-numeriques/kit/test_moteur.js && node maquettes-numeriques/pistes/test_moteur.js`.
- **Lancer une campagne « placement »** (`gh workflow run` échoue, il passe par GraphQL : utiliser l'API REST ; committer et pousser le plan avant) :
  ```bash
  gh api -X POST repos/antoineacquaviva/Projet_Jeu/actions/workflows/placement.yml/dispatches \
    -f ref=main -f 'inputs[plan]=<placement_…>' -f 'inputs[echelle]=1' -f 'inputs[lots]=20'
  ```
- **Suivre un lancement** : `gh api repos/antoineacquaviva/Projet_Jeu/actions/runs --jq '.workflow_runs[:5][] | {name, run_number, id, status, conclusion}'`.
- **Lire les résultats** (branche `resultats`, dossier `placement/<plan>_run<n>/` ; les artefacts ne se téléchargent pas depuis les sessions) :
  ```bash
  gh api "repos/antoineacquaviva/Projet_Jeu/contents/placement/<dossier>/synthese.json?ref=resultats" \
    -H "Accept: application/vnd.github.raw" > synthese.json
  ```
- **Limites GitHub** : 20 tâches à la fois ; 6 h au plus par lot. Les campagnes « placement » sont courtes (1 à 15 min sur 20 lots).
- **Maquettes jouables** : modifier les sources de `maquettes-numeriques/<kit|pistes>/`, lancer leur test, reconstruire (`python3 maquettes-numeriques/<…>/construire.py`), puis republier le fichier HTML à la même adresse d'artefact. Les parties jouées par l'auteur sont enregistrées dans la base de l'artefact (`parties`, `series`, `index`).

## 4. Étape suivante

**Ligne active : la campagne 3, « le Méchant lu sur ses pistes ».**

1. **L'auteur joue** la maquette [Couronne aux deux pistes](https://claude.ai/artifact/RL3rYyXRXAtiUKZgp3Frnk) (**ATTENTE DE L'AUTEUR**) : quelques parties, puis ses impressions. *Indice local déjà connu* (bots faibles, 16 parties par case) : avec deux cartes, le meilleur bot pare 29 à 33 % des ordres, contre 61 à 68 % dans le kit avec l'annonce ; la perte d'information est nette, la campagne dira si la profondeur la compense.
2. **Relire les parties enregistrées** dans la base de l'artefact (Claude, à la demande de l'auteur).
3. **Étudier en détail avec l'auteur la piste des Machines** avant tout codage en Python (demande de l'auteur du 16 oct., 12 h 37).
4. **Campagne 3** : coder les pistes dans `placement/` (le moteur Python doit rejouer la maquette à l'identique, comme pour le kit), comparer les deux rythmes d'apprentissage (à chaque lancer, à la fin de la vague), puis criblage et confirmation sur GitHub ; bilan `projet/4-bilans/placement-etude-3-pistes.md`.

*Aucun passage automatique ne travaille sur ce projet* : les deux tâches planifiées sont désactivées ou ne se déclenchent qu'à la demande (section 5). Le travail avance en session avec l'auteur.

**Décisions en attente de l'auteur**
- Deux choix de Claude dans la maquette des pistes, à confirmer : une Machine qui sort du chantier sur une case gardée entre quand même, sans abattre ; sur le lancer qui la fait entrer, sa tuile tactique apprend du verdict comme l'autre (`maquettes-numeriques/pistes/LISEZMOI.md`).

## 5. Tâches planifiées

- « Forêt qui rêve · tests autonomes » (`trig_011udKReur3DBBjnHXU29nNe`) : **désactivée** depuis le 15 oct. Elle suivait la consigne des passages, archivée avec l'ancien `ETAT.md` ; réactivée telle quelle, elle s'arrêterait aussitôt (sa consigne lui dit de s'arrêter si la section « Consigne des passages » manque).
- « Forêt qui rêve · analyse de fin de cycle » (`trig_01VUxMg7UjXfZzUXczfz5ANX`) : ne se déclenche qu'à la demande, pour un cycle du moteur archivé ; sans objet tant que le cycle 2 est suspendu.
- La tâche « réveil » n'existe plus.

## 6. Verrou

*(vide)* — écrire EN COURS avec la date pendant une session, PAUSE pour tout arrêter.

## 7. Réponses de l'auteur

*L'auteur écrit ici ses réponses aux décisions attendues, avec la date. Les réponses antérieures au 15 oct., 16 h sont dans le journal des décisions et l'`ETAT.md` archivé.*

- **16 oct. 2026, 16 h 51 (rangement)** : l'auteur demande de ranger les documents du projet et le dépôt : garder ce qui correspond à l'exploration actuelle et les pistes encore pertinentes, restructurer ce qui reste, archiver ce qui n'est plus sur la trajectoire, supprimer le reste. Fait le 16 oct. (section 9) ; suppressions soumises en lot.
- **16 oct. 2026, 12 h 37 à 13 h 23 (pistes du Méchant)** : pistes et apprentissage réintroduits ; esprits, rêve, peuples et communication restent différés ; verdict de l'apprentissage **partagé** (13 h 09) ; **sixième Machine Zizanie** en case 0, piste imprimée 1 · 2 · 0 · 3 · 4 · 5 (13 h 11) ; **accord sur toutes les recommandations** de la proposition (13 h 23) : modèle de la campagne 3 ; le Gentil commence le tour ; min(J + 1, 6) Machines sur le plateau au départ, posées dans l'ordre 1, 2, 3, 4, 5, 0 ; les deux rythmes d'apprentissage codés et comparés ; maquette jouable demandée (faite, 14 h 30).
- **16 oct. 2026, matin (retour de partie sur le kit)** : la maquette semble fonctionnelle ; on cherche à chaque ordre un coup qui pare une menace annoncée ; l'ordre d'exécution caché ne semble pas influer.
- **15 oct. 2026, 21 h 47 (le Gentil réparti)** : le kit par joueur est retenu comme modèle de la campagne 2 ; feu vert pour la suite. Les questions A à E sur le nombre de joueurs sont tranchées par ce choix (géométrie variable autorisée ; 2 individus et 1 ordre par joueur ; 2 à 6 joueurs ; chacun agit à chaque tour).
- **15 oct. 2026, 17 h 50 (modèle « placement », étude 1)** : les six recommandations sont validées (hypothèses du modèle ; m = n et m = n + 1 candidates, m = n en tête ; quatre règles porteuses comme contraintes de conception ; seuils de lecture gardés comme indices ; campagne 2 ; maquette jouable). Demande : penser la division du Gentil en 1 à 6 joueurs avec des aménagements minimaux, et plus tard un temps d'attente qui ne croît pas avec le nombre de joueurs (à reprendre avec la coordination).
- **15 oct. 2026, 17 h (recentrage)** : conception concentrée sur la mécanique de base ; conseil de la calebasse retenu, conception différée.

## 8. Campagnes GitHub

Toutes les campagnes « placement » ont été lues et traitées. Aucun calcul en cours. Les lancements du moteur archivé (campagnes 1 à 32, batteries, cycle 1) sont dans l'`ETAT.md` archivé et dans `archive/conception-v0x/bilans/campagnes-et-passages-historique.md`.

| Lancement | Contenu | Lots | Durée | Statut |
|---|---|---|---|---|
| Placement 1 | placement_temoins : base et 4 témoins, 9 bots, 40 parties | 8 | 1 à 2 min | traité (étude 1) |
| Placement 2 | placement_election : 20 meilleures du criblage et la base, MC 256, 32 parties | 20 | 1 à 2 min | traité (étude 1, section 5) |
| Placement 3 | placement_voisinage : la base et 37 voisines à un cran, 48 parties | 20 | 2 min | traité (étude 1, section 5) |
| Placement 4 | placement_mechant, premier essai | 8 | – | échec de la fusion, corrigé, relancé en 6 |
| Placement 5 | placement_confirmation : 8 variantes, 160 parties | 20 | 1 min 20 | traité (étude 1, section 5) |
| Placement 6 | placement_mechant : 3 variantes × 5 forces × 3 bots, 64 parties | 12 | 2 min | traité (étude 1, section 7) |
| Placement 7 (run 38798736849) | placement_kit : le kit de 2 à 6 joueurs, 119 variantes × 64 parties × 9 bots | 20 | 14 min | traité (étude 2) |
| Placement 8 (run 38801163783) | placement_kit_confirmation : 4 réglages × 5 tailles × 160 parties | 20 | 10 min | traité (étude 2) |

## 9. Journal des sessions

Les sessions antérieures au 15 oct., 16 h sont dans l'`ETAT.md` archivé.

| Date | Début | Durée | Résumé |
|---|---|---|---|
| 15 oct. 2026 | 16:19 | 1 h | Modèle « placement » codé (`docs/regles_placement.md`, `placement/`, tests, workflow Placement) ; Placement 1 à 6 ; étude 1. |
| 15 oct. 2026 | 17:10 | 20 min | Recentrage sur la mécanique de base ; registre des parties différées ; calebasse différée. |
| 15 oct. 2026 | 17:50 | 55 min | Six décisions de l'étude 1 validées ; réflexion sur la division du Gentil (`projet/3-pilotage/nombre-de-joueurs-pistes.md`). |
| 15 oct. 2026 | 21:18 | 1 h 15 | Proposition du kit par joueur, retenue ; couronne codée ; Placement 7 et 8 ; étude 2. |
| 15 oct. 2026 | 22:35 | 1 h | Maquette « Forêt en couronne » écrite, testée (rejoue le moteur Python) et publiée. |
| 16 oct. 2026 | 09:27 | 5 h (avec pauses) | Retour de partie de l'auteur ; proposition « pistes et deux étapes » ; décisions sur la piste des Machines ; maquette « Couronne aux deux pistes » écrite, testée et publiée. |
| 16 oct. 2026 | 16:51 | 1 h 30 | **Rangement du dépôt et des documents du projet**, à la demande de l'auteur : jeu complet V0.x, moteur `foret`, plans et bilans V0.x, noyau N1 et quatre workflows (dont la surveillance quotidienne) déplacés dans `archive/` (moteur archivé vérifié : conformité et tests verts depuis son dossier) ; `ETAT.md`, `README.md`, registre des parties différées et journal des décisions réécrits pour la ligne active ; workflow Tests recentré (modèle « placement » et maquettes Node) ; copies de travail du projet rafraîchies et archivées. Aucune règle changée, aucun document supprimé (lot soumis à l'auteur). |

## 10. Reprendre la main

- **Débloquer une décision** : écrire la réponse dans la section 7 avec la date, puis committer (depuis GitHub, « Edit this file » suffit).
- **Mettre en pause** : écrire PAUSE dans la section 6.
- **Changer l'étape suivante** : modifier la section 4.
- **Reprendre dans une conversation** : demander à Claude de lire `ETAT.md` ; tout ce qu'il faut est dans le dépôt.
