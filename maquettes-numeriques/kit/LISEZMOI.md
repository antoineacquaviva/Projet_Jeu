# Maquette numérique du kit par joueur : « Forêt en couronne »

Page jouable : https://claude.ai/artifact/Y8uxpq492aWUdXN3h1uRps (privée, ouverte au propriétaire du dépôt).
Règles : `docs/regles_placement.md` (P1.1 bis, P1.3 bis, P1.4 bis, P2.1 bis, P3.4 bis). Proposition : `projet/2-maquettes/proposition-gentil-reparti.md`. Étude : `projet/4-bilans/placement-etude-2-kit.md`.

| Fichier | Rôle |
|---|---|
| `moteur.js` | Les règles du kit, sans interface : couronne, mise en place, annonce, ordres, résolution menace par menace. |
| `bots.js` | Les bots Prévoyant, Réflexe, Glouton, Hasard ; chaque décision porte sa raison. `partieAuto` pour les séries. |
| `ui.js` | La page : couronne SVG animée, ordres des humains, pas à pas, séries de bots, enregistrement, export. |
| `page.html` | Le gabarit (styles, structure, règles). |
| `construire.py` | Assemble `couronne.html` (le fichier publié) : `python3 maquettes-numeriques/kit/construire.py`. |
| `generer_reference.py` | Parties de référence du moteur Python (`reference.json`). |
| `test_moteur.js` | `node maquettes-numeriques/kit/test_moteur.js` : rejoue les parties Python à l'identique, puis contrôle la couronne, les bornes du tour et les bots. |

**Parties enregistrées.** La page écrit dans la base de l'artefact : `parties/<id>` (réglages, sièges, état de départ, et pour chaque tour l'annonce, l'ordre d'exécution, les ordres avec leur auteur et la raison des bots, les événements, les parades), `series/<id>` (une série de bots, une ligne par bot et par taille de table) et `index/<id>` (résumé pour la liste). Claude les relit avec l'outil de base de données de l'artefact.

**Reproductibilité.** Tous les tirages du jeu sont faits au début de la partie à partir de la graine ; les bots ont leur propre graine par tour. Même graine, mêmes réglages et mêmes choix humains : même partie.

**Mettre à jour la page.** Modifier les sources, lancer les tests, reconstruire, puis republier `couronne.html` à la même adresse.
