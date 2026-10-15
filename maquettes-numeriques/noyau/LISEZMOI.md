# Maquette numérique du noyau N1

Page jouable « Noyau de la Forêt qui rêve » : https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV (privée, ouverte au propriétaire du dépôt).
Règles : `docs/regles_noyau.md`. Contexte : `projet/3-pilotage/prendre-du-recul.md`.

| Fichier | Rôle |
|---|---|
| `moteur.js` | Les règles N1, sans interface : état, plan du Méchant, résolution, journal. Chaque choix passe par `decider()`. |
| `bots.js` | Les profils Lecteur, Défenseur, Rêveur, Hasard ; chaque décision porte sa raison (`pourquoi`). |
| `ui.js` | La page : plateau SVG animé, saisie des choix humains, pas à pas, séries, enregistrement, export. |
| `page.html` | Le gabarit (styles et structure). |
| `construire.py` | Assemble `noyau.html` (le fichier publié) : `python3 maquettes-numeriques/noyau/construire.py`. |
| `test_moteur.js` | Tests des règles et séries de contrôle : `node maquettes-numeriques/noyau/test_moteur.js`. |

**Parties enregistrées.** La page écrit dans la base de l'artefact : `parties/<id>` (une partie, avec tout son journal : réglages, graine, chaque décision avec ses options et, pour les bots, leur raison, les dés, les ordres, l'apprentissage), `series/<id>` (une série de parties de bots, une ligne par partie) et `index/<id>` (une ligne de résumé par document, pour la liste). Claude les relit avec l'outil de base de données de l'artefact ; l'auteur peut aussi tout exporter en JSON depuis l'onglet « Parties enregistrées ».

**Reproductibilité.** Une partie se rejoue à l'identique avec la même graine, les mêmes réglages et les mêmes choix humains.

**Mettre à jour la page.** Modifier les sources, lancer les tests, reconstruire, puis republier `noyau.html` à la même adresse.
