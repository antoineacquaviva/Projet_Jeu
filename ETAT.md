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

**Ligne active : Campagne 3 (« Couronne aux deux pistes ») terminée en local ; implémentation du mode didactique décomposé sur la maquette et attente des décisions de l'auteur sur les propositions.**

1. **Nouveau besoin prioritaire sur la maquette (exprimé par l'auteur le 17 oct., 11 h 31)** :
   - Ajouter dans `maquettes-numeriques/pistes/` un **mode didactique très décomposé** qui montre et explique pas à pas chaque micro-action, en particulier pendant la **phase de résolution** avec des **focus visuels sur les éléments qui s'activent et bougent** :
     1. Révélation et exécution détaillée des cartes des joueurs (déplacements `Aller`, pose des `Garder` / `Saboter`, explication des éventuels ordres perdus) ;
     2. Pour chaque lancer de dé d'une vague, décomposition en 4 focus successifs : (a) lancer des 2 dés (`Somme` et `Écart`), (b) focus sur la tuile de la *Piste des pensées* et la tuile de la *Piste des Machines* désignées, (c) focus sur le plateau (rayon de la Machine, choix de la case cible selon la tactique, mouvement ou entrée du Chantier, parade ou coupe d'arbre), (d) focus animé sur l'apprentissage (échange des tuiles sur les deux pistes selon réussite/échec).
   - Cahier des charges détaillé consigné dans [`projet/4-bilans/placement-etude-3-pistes.md`](projet/4-bilans/placement-etude-3-pistes.md).
2. **Résultats de la Campagne 3 (16 oct. soir, `projet/4-bilans/placement-etude-3-pistes.md`)** :
   - Outil d'évaluation multi-cœurs construit dans `maquettes-numeriques/pistes/campagne.js`, plan `campagnes/pistes_campagne3.json` (21 variantes × 24 parties appariées × 11 bots, tests $T_1$ et $T_4$), rapport `resultats/pistes/pistes_campagne3_rapport.md` et tableau de bord interactif `maquettes-numeriques/pistes/laboratoire.html`.
   - **Constats mesurés :**
     - Sans présage (`J3_base`), programmer 2 étapes à l'aveugle sur les seules pistes donne peu de prise au second ordre (taux fort 29,3 %, 10,4 % d'ordres perdus, Profondeur −1,0 🔴, Plan 2 étapes +1,6 pt).
     - Avec le **Présage sur la Vague 1 (`J3_presage`)**, le score passe en tête (**0,77** : taux fort **42,2 % 🟢**, Lecture **16,8 pts 🟢**, Profondeur **+8,0 pts 🟢**, Info **14,6 pts 🟢**, Plan 2 étapes **+9,7 pts**, ordres perdus **2,8 %**). Sans présage, le rythme `vague` (`J3_rythme_vague`) améliore la Maîtrise (5,0 pts 🟢) et le Plan 2 étapes (+6,1 pts).
     - La programmation en 2 étapes est indispensable au déplacement (`Placement` = 0,0 🔴 en 1 ordre/tour `J3_1ordre_8tours`, contre 3,3 à 7,3 pts en 2 étapes avec présage).
     - L'apprentissage des deux pistes pèse **−9,2 pts** de taux de parade (`J3_base` 29,3 % contre `J3_sans_apprentissage` 38,5 %, ~51 échanges/partie).
     - Le témoin `J3_sabotage_fige` fait bondir la boucle aveugle `marquage` à 38,4 % (Lecture 1,6 🔴), prouvant qu'un joueur **seul** ne doit pas pouvoir figer une Machine en boucle, mais que cet effet fort doit exiger d'**être à deux (Synergie, Palier 1)**, ce qui forcera aussi le **Couplage** inter-tuiles (actuellement bas : 2,8 % à 14,3 %) à monter.
3. **Feuille de route en 6 paliers convenue avec l'auteur (16 oct., 23 h 12)** :
   - **Palier 0 (Fait)** : Outil de campagne automatisé + Campagne 3 sur le modèle `pistes`.
   - **Palier 1** : Synergie (être à deux sur une Machine) & revalorisation du Sabotage.
   - **Palier 2** : Différenciation des 6 Machines (résistance/organes, déplacement, capacité de coupe).
   - **Palier 3** : Phase de communication entre joueurs (Conseil de la calebasse, `projet/2-maquettes/proposition-conseil-calebasse.md`).
   - **Palier 4** : Mécanisme du Rêve disputé et fins de jeu provoquées.
   - **Palier 5** : Spécialisation des peuples (exceptions aux règles communes, identité des individus, cartes d'aide en main liées au peuple).

**Décisions et propositions en attente de l'auteur (aucune décision prise au 17 oct., 11 h 31)**
- **Socle Campagne 3** : Activer par défaut le Présage (`presage=true`) et/ou le rythme `vague` dans la maquette ?
- **Palier 1 (Synergie à deux sur une Machine)** : Choisir les pistes à tester en simulation (Piste A : Saboter seul = échappe, Saboter à deux = remorquage au Chantier / HS + recul doublé ; Piste B : Garder seul, Saboter exige 2 individus sur la case et fige/détruit un organe ; ou autre piste).
- **Exécution Hybride Local / Cloud (GitHub Actions)** : Ajouter `--lot i/N` et `--fusionner` à `maquettes-numeriques/pistes/campagne.js` et brancher `.github/workflows/placement.yml` pour lancer les petites sondes en local (< 5 min) et les gros criblages sur 20 machines GitHub Actions en parallèle (PC éteint).
- Deux choix initiaux de la maquette des pistes à confirmer : une Machine qui sort du chantier sur une case gardée entre quand même, sans abattre ; sur le lancer qui la fait entrer, sa tuile tactique apprend du verdict comme l'autre (`maquettes-numeriques/pistes/LISEZMOI.md`).

## 5. Tâches planifiées

- « Forêt qui rêve · tests autonomes » (`trig_011udKReur3DBBjnHXU29nNe`) : **désactivée** depuis le 15 oct. Elle suivait la consigne des passages, archivée avec l'ancien `ETAT.md` ; réactivée telle quelle, elle s'arrêterait aussitôt (sa consigne lui dit de s'arrêter si la section « Consigne des passages » manque).
- « Forêt qui rêve · analyse de fin de cycle » (`trig_01VUxMg7UjXfZzUXczfz5ANX`) : ne se déclenche qu'à la demande, pour un cycle du moteur archivé ; sans objet tant que le cycle 2 est suspendu.
- La tâche « réveil » n'existe plus.

## 6. Verrou

*(vide)* — écrire EN COURS avec la date pendant une session, PAUSE pour tout arrêter.

## 7. Réponses de l'auteur

*L'auteur écrit ici ses réponses aux décisions attendues, avec la date. Les réponses antérieures au 15 oct., 16 h sont dans le journal des décisions et l'`ETAT.md` archivé.*

- **17 oct. 2026, 11 h 31 (clôture de session & nouveau besoin)** : l'auteur ne prend pas de décision sur les règles pour l'instant (il étudiera les résultats de la Campagne 3 et les propositions à part) ; il demande de tout consigner (résultats, propositions sur le jeu et sur l'exécution hybride local/cloud) et exprime un **nouveau besoin pour la maquette : un mode beaucoup plus didactique** montrant et expliquant en détail toutes les actions, en particulier une phase de résolution très décomposée avec des focus sur les éléments qui s'activent et bougent.
- **16 oct. 2026, 19 h 30 à 23 h 30 (ergonomie de la maquette, analyse de partie, feuille de route et Campagne 3)** : validation des améliorations visuelles de `maquettes-numeriques/pistes/pistes.html` (arbres/souches SVG, réserve du Chantier, noms des cases agrandis au survol, flèches d'intention colorées par tactique d'épaisseur constante affichées au survol uniquement, croisement 21 plans masquable, menu radial, export JSON automatique) ; analyse de la partie humaine (`couronne-pistes-pmvbfmu561ss.json`) et accord pour corriger le biais de passivité des bots dans `bots.js` ; accord sur l'ordre des 6 paliers du plan d'action et sur le lancement immédiat de l'outil d'évaluation et de la Campagne 3 ; précision consignée sur les « cartes événements » (= cartes d'aide en main propres au peuple, Palier 5).
- **16 oct. 2026, 16 h 51 (rangement)** : l'auteur demande de ranger les documents du projet et le dépôt : garder ce qui correspond à l'exploration actuelle et les pistes encore pertinentes, restructurer ce qui reste, archiver ce qui n'est plus sur la trajectoire, supprimer le reste. Fait le 16 oct. (section 9) ; suppressions soumises en lot.
- **16 oct. 2026, 12 h 37 à 13 h 23 (pistes du Méchant)** : pistes et apprentissage réintroduits ; esprits, rêve, peuples et communication restent différés ; verdict de l'apprentissage **partagé** (13 h 09) ; **sixième Machine Zizanie** en case 0, piste imprimée 1 · 2 · 0 · 3 · 4 · 5 (13 h 11) ; **accord sur toutes les recommandations** de la proposition (13 h 23) : modèle de la campagne 3 ; le Gentil commence le tour ; min(J + 1, 6) Machines sur le plateau au départ, posées dans l'ordre 1, 2, 3, 4, 5, 0 ; les deux rythmes d'apprentissage codés et comparés ; maquette jouable demandée (faite, 14 h 30).
- **16 oct. 2026, matin (retour de partie sur le kit)** : la maquette semble fonctionnelle ; on cherche à chaque ordre un coup qui pare une menace annoncée ; l'ordre d'exécution caché ne semble pas influer.
- **15 oct. 2026, 21 h 47 (le Gentil réparti)** : le kit par joueur est retenu comme modèle de la campagne 2 ; feu vert pour la suite. Les questions A à E sur le nombre de joueurs sont tranchées par ce choix (géométrie variable autorisée ; 2 individus et 1 ordre par joueur ; 2 à 6 joueurs ; chacun agit à chaque tour).
- **15 oct. 2026, 17 h 50 (modèle « placement », étude 1)** : les six recommandations sont validées (hypothèses du modèle ; m = n et m = n + 1 candidates, m = n en tête ; quatre règles porteuses comme contraintes de conception ; seuils de lecture gardés comme indices ; campagne 2 ; maquette jouable). Demande : penser la division du Gentil en 1 à 6 joueurs avec des aménagements minimaux, et plus tard un temps d'attente qui ne croît pas avec le nombre de joueurs (à reprendre avec la coordination).
- **15 oct. 2026, 17 h (recentrage)** : conception concentrée sur la mécanique de base ; conseil de la calebasse retenu, conception différée.

## 8. Campagnes GitHub et Locales

Toutes les campagnes ont été lues et traitées. Aucun calcul en cours. Les lancements du moteur archivé (campagnes 1 à 32, batteries, cycle 1) sont dans l'`ETAT.md` archivé et dans `archive/conception-v0x/bilans/campagnes-et-passages-historique.md`.

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
| **Campagne 3 (local, `pistes_campagne3`)** | Couronne aux deux pistes : 21 variantes × 24 parties × 11 bots + $T_1, T_4$ (`campagnes/pistes_campagne3.json`) | 7 workers | 7 min 42 s | traité ([étude 3](projet/4-bilans/placement-etude-3-pistes.md), `resultats/pistes/`, `laboratoire.html`) |

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
| 16 oct. 2026 | 16:51 | 1 h 30 | **Rangement du dépôt et des documents du projet**, à la demande de l'auteur : jeu complet V0.x, moteur `foret`, plans et bilans V0.x, noyau N1 et quatre workflows déplacés dans `archive/` ; `ETAT.md`, `README.md`, registre des parties différées et journal des décisions réécrits pour la ligne active. |
| 16–17 oct. 2026 | 19:30 | 4 h (avec pause nuit) | **Refonte ergonomique de `pistes.html`, analyse de partie humaine, outil d'évaluation automatisé et Campagne 3** : amélioration visuelle et interactive de `maquettes-numeriques/pistes/` ; export JSON automatique ; analyse de la partie `couronne-pistes-pmvbfmu561ss.json` et correction de la passivité des bots dans `bots.js` ; plan d'action en 6 paliers ; création de `maquettes-numeriques/pistes/campagne.js` et `laboratoire.html` ; exécution et bilan de la Campagne 3 (`projet/4-bilans/placement-etude-3-pistes.md`) ; consignation des propositions et du nouveau besoin de mode didactique décomposé. |

## 10. Reprendre la main

- **Débloquer une décision** : écrire la réponse dans la section 7 avec la date, puis committer (depuis GitHub, « Edit this file » suffit).
- **Mettre en pause** : écrire PAUSE dans la section 6.
- **Changer l'étape suivante** : modifier la section 4.
- **Reprendre dans une conversation** : demander à l'assistant de lire `ETAT.md` ; tout ce qu'il faut est dans le dépôt.
