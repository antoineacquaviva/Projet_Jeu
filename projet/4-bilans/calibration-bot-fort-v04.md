# Calibration du bot fort sur la V0.4 (cycle 2, étape a.2)

Source : Campagne 18 (`calibration_v04`, branche `resultats`, `campagnes/calibration_v04_run18/`), 256 parties, 0 erreur, 64 tables (échantillon P2, 4 parties par table, graines appariées). Mesure : forêt restante en %, écart apparié au bot MC64R, intervalle à 95 %.

| Bot | Forêt moyenne | Écart à MC64R (toutes tailles) | 2 j. | 3 j. | 4 j. | 5 j. | 6 j. |
|---|---|---|---|---|---|---|---|
| MC64R (bot fort du cycle 1) | 73,1 % | – | – | – | – | – | – |
| MCP64 (portefeuille, 64 suites) | 76,4 % | +3,3 ± 4,5 | +0,8 | +7,4 | +7,5 | −3,0 | +1,2 |
| MC 64, rêve 0,5 | 71,0 % | −2,2 ± 4,8 | −3,4 | +2,1 | −12,3 | +2,4 | +9,5 |
| MC 256 à portefeuille | 87,0 % | **+13,8 ± 3,8** | +9,1 | +15,5 | +21,4 | +15,5 | +9,5 |

Lecture. MCP64 et MC 64 à rêve 0,5 ne se distinguent pas de MC64R (intervalles qui contiennent 0). Seul MC 256 à portefeuille est nettement plus fort, à toutes les tailles (intervalles larges à 4 à 6 joueurs : peu de tables).

Coût. Le calcul cumulé est de 282 549 s-cœur pour 64 jeux de 4 bots. MC64R coûte environ 230 s par partie ; en supposant des coûts voisins pour les deux autres bots de budget 64, MC 256 à portefeuille coûte environ 3 700 s par partie (**estimation**, la synthèse ne donne pas le temps par bot), soit une quinzaine de fois MC64R pour +14 points. L'ancienne valeur de `COUT["mc256"]` (600 s) était très sous-estimée.

## Décision technique (Claude, 14 oct. 2026)

- **Bot fort du cycle 2 : MC64R reste le bot fort** des étapes de criblage et de confirmation (aucun bot de budget 64 ne fait mieux, et MC 256 coûte trop cher pour une confirmation par manches).
- **MC 256 à portefeuille reste le bot de contrôle** (il est nettement plus fort : il sert à vérifier que les finalistes tiennent face à un meilleur joueur). Le cycle 2 le joue sur peu de parties.
- `COUT["mc256"]` recalé de 600 à 3 700 s dans `foret/cycle.py` ; le plan `cycles/c2.json` devra en tenir compte pour l'estimation de la durée du cycle (un contrôle de même taille qu'au cycle 1 durera bien plus que 2 h 25 si le nombre de parties n'est pas réduit : à vérifier à l'étape a.4 avec l'estimateur).
- Aucun fichier de campagne ou règle modifiés.
