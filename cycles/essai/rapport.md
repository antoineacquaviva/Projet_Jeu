# Rapport automatique du cycle essai (v0.3)

*Écrit par `foret/cycle.py` le 2026-10-13T13:27:41+00:00 ; à analyser par Claude (étape g). Tout ce qui suit est mesuré par les bots indiqués ; la qualité est provisoire (docstring de foret/cycle.py).*

## Alertes de conception

- Aucune selon la règle automatique.

## Criblage : influence des variables (μ*, effet élémentaire absolu moyen)

| Variable | Qualité | Durée | Difficulté | Tour moyen | Écart entre tailles | Retenue |
|---|---|---|---|---|---|---|
| pas_esprit | 1,00 | 1,00 | 0,54 | 2,12 | 15,5 | oui |
| lunes | 0,50 | 0,50 | 0,27 | 1,50 | 11,9 | oui |
| tours | 0,00 | 0,00 | 0,00 | 0,12 | 2,4 | oui |
| cercle | 0,00 | 0,00 | 0,00 | 0,25 | 7,1 |  |

## Exploration

- Score de la carte (MAP-Elites) par génération : [3.0, 4.0, 4.0]
- Étalon au hasard, même budget : [0, 1.0, 3.0]

## Confirmation, manche 1 (bot : fort)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| regles.lunes="n-1", regles.reves_par_pas=2, tours=7 | 1,00 | 52 / 76 / – / – / – | 0 % | 6,5 | -21,4 (sûr) |
| regles.lunes="n-1", regles.reves_par_pas=2 | 0,94 | 52 / 81 / – / – / – | 0 % | 6,0 | -19,1 (sûr) |
| regles.cercle_par_joueur={"2":4,"4":3}, regles.lunes=1 | 0,62 | 57 / 86 / – / – / – | 0 % | 6,0 | -14,3 (sûr) |
| ancre (maquette de départ) | 0,00 | 81 / 90 / – / – / – | 100 % | 3,0 | – |

## Confirmation, manche 2 (bot : fort)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| regles.lunes="n-1", regles.reves_par_pas=2, tours=7 | 0,62 | 62 / 86 / – / – / – | 0 % | 6,5 | -19,1 (sûr) |
| regles.lunes="n-1", regles.reves_par_pas=2 | 0,30 | 62 / 90 / – / – / – | 0 % | 6,0 | -16,7 (sûr) |
| ancre (maquette de départ) | 0,00 | 90 / 95 / – / – / – | 100 % | 3,0 | – |

## Contrôle (bot : contrôle)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| regles.lunes="n-1", regles.reves_par_pas=2, tours=7 | 0,94 | 57 / 81 / – / – / – | 0 % | 7,0 | -9,5 (sûr) |
| ancre (maquette de départ) | 0,00 | 67 / 90 / – / – / – | 100 % | 4,5 | – |

## Étapes

- 2026-10-13T13:23:41+00:00 : exploration 1
- 2026-10-13T13:24:14+00:00 : exploration 2
- 2026-10-13T13:25:03+00:00 : confirmation 1
- 2026-10-13T13:25:48+00:00 : confirmation 2
- 2026-10-13T13:26:36+00:00 : controle 1
- 2026-10-13T13:27:21+00:00 : rapport 
