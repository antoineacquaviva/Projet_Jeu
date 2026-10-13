# Rapport automatique du cycle c1 (v0.3)

*Écrit par `foret/cycle.py` le 2026-10-13T20:59:07+00:00 ; à analyser par Claude (étape g). Tout ce qui suit est mesuré par les bots indiqués ; la qualité est provisoire (docstring de foret/cycle.py).*

## Alertes de conception

- Aucune selon la règle automatique.

## Criblage : influence des variables (μ*, effet élémentaire absolu moyen)

| Variable | Qualité | Durée | Difficulté | Tour moyen | Écart entre tailles | Retenue |
|---|---|---|---|---|---|---|
| tours | 0,25 | 0,36 | 0,12 | 1,14 | 3,3 | oui |
| ordres | 0,26 | 0,00 | 0,38 | 0,16 | 8,9 | oui |
| pas_esprit | 0,15 | 0,33 | 0,22 | 1,42 | 6,0 | oui |
| lunes | 0,15 | 0,29 | 0,09 | 0,72 | 6,7 | oui |
| presence | 0,14 | 0,00 | 0,24 | 0,10 | 6,2 | oui |
| machines | 0,11 | 0,04 | 0,13 | 0,07 | 5,6 | oui |
| escalade | 0,11 | 0,00 | 0,12 | 0,03 | 2,9 | oui |
| cercle | 0,03 | 0,08 | 0,04 | 0,29 | 3,3 | oui |
| main | 0,03 | 0,00 | 0,11 | 0,33 | 4,0 | oui |
| hanter | 0,02 | 0,00 | 0,02 | 0,02 | 1,2 | oui |
| immobiliser | 0,02 | 0,00 | 0,02 | 0,04 | 1,4 |  |
| traces | 0,00 | 0,00 | 0,00 | 0,00 | 0,0 |  |
| voir | 0,00 | 0,00 | 0,00 | 0,00 | 0,0 |  |

## Exploration

- Score de la carte (MAP-Elites) par génération : [11.378, 11.788, 11.83, 12.438, 14.544, 15.544, 15.607, 17.84, 17.882, 17.914, 17.974]
- Étalon au hasard, même budget : [0, 6.861, 8.3, 9.575, 9.644, 10.528, 11.775, 11.849, 11.902, 12.934, 13.105]

## Confirmation, manche 1 (bot : fort)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| regles.cercle_par_joueur={"2":4,"4":3}, regles.escalade=5, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2 | 0,70 | 74 / 82 / 67 / 74 / 85 | 0 % | 5,6 | -18,8 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=4, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=7 | 0,64 | 76 / 85 / 74 / 59 / 74 | 0 % | 6,6 | -18,2 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=5, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=7 | 0,56 | 77 / 87 / 71 / 58 / 74 | 0 % | 6,4 | -18,3 (sûr) |
| pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.escalade=4, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, regles.traces_par_joueur=1, tours=5 | 0,51 | 87 / 87 / 63 / 74 / 75 | 0 % | 4,5 | -13,8 (sûr) |
| pouvoirs.attendre.par_tour=2, presence.pions=2, regles.escalade=5, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, regles.traces_par_joueur=1, tours=5 | 0,46 | 87 / 88 / 59 / 80 / 80 | 0 % | 4,6 | -13,2 (sûr) |
| cartes.main=6, regles.cercle_par_joueur=5, regles.escalade=4, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, tours=5 | 0,26 | 80 / 91 / 74 / 86 / 90 | 0 % | 4,5 | -10,7 (sûr) |
| cartes.main=6, regles.cercle_par_joueur={"2":5,"4":4,"6":3}, regles.escalade=5, regles.lunes=1, regles.ordres_par_etape={"2":1,"4":2}, tours=7 | 0,26 | 86 / 91 / 72 / 78 / 86 | 0 % | 6,1 | -10,3 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, pouvoirs.voir.par_tour=1, regles.cercle_par_joueur=4, regles.escalade=4, regles.lunes=3, regles.ordres_par_etape={"2":1,"5":2}, regles.reves_par_pas=3, regles.traces_par_joueur=1, tours=7 | 0,17 | 76 / 86 / 92 / 56 / 76 | 0 % | 7,0 | -15,0 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=5, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=5 | 0,12 | 84 / 93 / 75 / 75 / 88 | 0 % | 4,9 | -10,3 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, pouvoirs.voir.par_tour=2, regles.cercle_par_joueur={"2":4,"4":3}, regles.escalade=4, regles.ordres_par_etape={"2":1,"5":2}, regles.reves_par_pas=2, tours=7 | 0,04 | 82 / 87 / 94 / 68 / 87 | 0 % | 7,0 | -9,9 (sûr) |
| regles.cercle_par_joueur={"2":5,"4":4,"6":3}, regles.escalade=4, regles.lunes={"2":1,"4":2,"6":3}, regles.ordres_par_etape={"2":1,"5":2}, regles.reves_par_pas=3, tours=5 | 0,01 | 84 / 91 / 95 / 84 / 65 | 0 % | 5,0 | -7,6 (sûr) |
| cartes.main=4, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=2, regles.escalade=4, regles.lunes="n-2", regles.ordres_par_etape={"2":1,"5":2}, regles.reves_par_pas=3 | 0,01 | 85 / 93 / 95 / 67 / 79 | 0 % | 6,0 | -7,8 (sûr) |
| ancre (maquette de départ) | 0,00 | 92 / 96 / 94 / 96 / 92 | 71 % | 4,9 | – |

## Confirmation, manche 2 (bot : fort)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| regles.cercle_par_joueur={"2":4,"4":3}, regles.escalade=5, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2 | 0,73 | 70 / 84 / 58 / 77 / 80 | 0 % | 5,7 | -20,2 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=4, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=7 | 0,61 | 76 / 86 / 63 / 62 / 83 | 0 % | 6,5 | -18,0 (sûr) |
| pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.escalade=4, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, regles.traces_par_joueur=1, tours=5 | 0,57 | 86 / 86 / 64 / 79 / 86 | 0 % | 4,5 | -11,8 (sûr) |
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=5, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=7 | 0,56 | 78 / 87 / 70 / 62 / 65 | 0 % | 6,5 | -17,1 (sûr) |
| pouvoirs.attendre.par_tour=2, presence.pions=2, regles.escalade=5, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, regles.traces_par_joueur=1, tours=5 | 0,52 | 87 / 85 / 62 / 76 / 85 | 0 % | 4,6 | -12,4 (sûr) |
| cartes.main=6, regles.cercle_par_joueur=5, regles.escalade=4, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, tours=5 | 0,41 | 80 / 89 / 64 / 85 / 88 | 0 % | 4,7 | -12,4 (sûr) |
| ancre (maquette de départ) | 0,00 | 89 / 95 / 95 / 96 / 99 | 65 % | 5,0 | – |

## Contrôle (bot : contrôle)

| Variante | Qualité | Forêt 2 / 3 / 4 / 5 / 6 j. | Fins avant mi-partie (max) | Tour moyen | Écart apparié à l'ancre |
|---|---|---|---|---|---|
| cartes.main=6, pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.cercle_par_joueur=4, regles.escalade=4, regles.lunes="n-1", regles.machines_en_jeu={"2":3,"4":4,"6":5}, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas={"2":2,"5":3}, regles.traces_par_joueur=1, tours=7 | 0,06 | 91 / 92 / 84 / 94 / 85 | 0 % | 6,5 | -5,3 (sûr) |
| regles.cercle_par_joueur={"2":4,"4":3}, regles.escalade=5, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2 | 0,02 | 84 / 95 / 77 / 93 / 94 | 0 % | 5,7 | -7,7 (sûr) |
| ancre (maquette de départ) | 0,00 | 93 / 98 / 96 / 96 / 94 | 62 % | 5,0 | – |
| pouvoirs.attendre.par_tour=2, pouvoirs.hanter.par_tour=2, regles.escalade=4, regles.lunes=3, regles.machines_en_jeu=5, regles.ordres_par_etape={"2":1,"4":2}, regles.reves_par_pas=2, regles.traces_par_joueur=1, tours=5 | 0,00 | 90 / 95 / 79 / 93 / 98 | 0 % | 4,5 | -5,0 (sûr) |

## Étapes

- 2026-10-13T14:18:40+00:00 : exploration 1
- 2026-10-13T14:22:56+00:00 : exploration 2
- 2026-10-13T14:25:48+00:00 : exploration 3
- 2026-10-13T14:30:00+00:00 : exploration 4
- 2026-10-13T14:33:41+00:00 : exploration 5
- 2026-10-13T14:37:54+00:00 : exploration 6
- 2026-10-13T14:41:51+00:00 : exploration 7
- 2026-10-13T14:46:02+00:00 : exploration 8
- 2026-10-13T14:50:14+00:00 : exploration 9
- 2026-10-13T14:54:34+00:00 : exploration 10
- 2026-10-13T14:58:01+00:00 : confirmation 1
- 2026-10-13T16:51:01+00:00 : confirmation 2
- 2026-10-13T18:32:54+00:00 : controle 1
- 2026-10-13T20:58:07+00:00 : rapport 
