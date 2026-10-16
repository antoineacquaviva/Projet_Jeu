# Maquette numérique « Couronne aux deux pistes »

Page jouable : https://claude.ai/artifact/RL3rYyXRXAtiUKZgp3Frnk (privée, ouverte au propriétaire du dépôt).
Proposition et décisions : `projet/2-maquettes/proposition-mechant-pistes-deux-etapes.md` (décisions du 16 oct., journal des décisions). Base : la maquette du kit (`maquettes-numeriques/kit/`), dont elle reprend la couronne, les ordres et la résolution d'une menace.

**Ce qui change par rapport au kit.** L'annonce disparaît : chaque menace est un lancer de deux dés lu sur deux pistes publiques (piste des pensées, cases 2 à 12, lue par la somme ; piste des Machines, six cases imprimées 1 · 2 · 0 · 3 · 4 · 5, lue par l'écart ; six Machines, dont min(J + 1, 6) sur le plateau au départ, les autres au chantier). Les deux tuiles désignées apprennent du même verdict (verdict partagé). Chaque joueur pose deux cartes, révélées en deux étapes, chacune suivie d'une vague de J + 1 lancers ; 4 tours. Réglages : une carte (témoin, 8 tours), J + 2 lancers, apprentissage à la fin de la vague, présage.

| Fichier | Rôle |
|---|---|
| `moteur.js` | Les règles, sans interface : pistes, lancers, chantier, apprentissage, deux étapes, ordres perdus, lecture des probabilités. |
| `bots.js` | Réflexe, Glouton, Prévoyant, Hasard ; ils ne voient pas les dés (sauf le présage) et lisent les pistes ; chaque décision porte sa raison. `partieAuto` pour les séries. |
| `ui.js` | La page : couronne SVG, pistes animées, deux cartes par joueur, résolution lancer par lancer, aide à la lecture (chances), séries de bots, enregistrement, export. |
| `page.html` | Le gabarit (styles, structure, règles). |
| `construire.py` | Assemble `pistes.html` (le fichier publié) : `python3 maquettes-numeriques/pistes/construire.py`. |
| `test_moteur.js` | `node maquettes-numeriques/pistes/test_moteur.js` : probabilités des pistes, sens des échanges, bornes de chaque vague, permutations, bots, reproductibilité. |

*Choix de Claude, à confirmer* : une Machine qui sort du chantier et dont la case d'entrée est gardée entre quand même, sans abattre ; sur un lancer, la tactique est sans objet pour une Machine qui entre, mais sa tuile apprend du verdict comme l'autre.

**Pas de moteur Python de référence** : les pistes ne sont pas encore codées dans `placement/`. Ce sera le premier travail de la campagne 3 ; le moteur Python devra alors rejouer cette page à l'identique, comme pour le kit.

**Parties enregistrées.** Base de l'artefact : `parties/<id>` (réglages, sièges, état de départ, et pour chaque tour les dés, les cartes avec la raison des bots, les ordres perdus, chaque lancer et les échanges sur les pistes), `series/<id>`, `index/<id>`.

**Mettre à jour la page.** Modifier les sources, lancer les tests, reconstruire, puis republier `pistes.html` à la même adresse.
