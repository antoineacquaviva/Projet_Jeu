# Historique des campagnes GitHub et des passages (jusqu'au 14 oct. 2026)

*Déplacé hors de `ETAT.md` le 14 oct. 2026 (allègement du contexte). `ETAT.md` ne garde que des durées de référence et les trois derniers passages. Rien n'a été supprimé.*

## Campagnes GitHub

Durées mesurées de la création du lancement à la fin de la dernière tâche.

| Lancement | Contenu | Lots | Durée totale | Lot le plus lent | Statut |
|---|---|---|---|---|---|
| Campagne 1 | reference, v2, échelle 0,05 (essai du dépôt), 2 485 parties | 4 | 0,6 min | 0,2 min | réussi |
| Batterie 1 | batterie de la phase 1 complète, glouton, 96 200 parties | 16 | 2,5 min | 1,8 min | réussi |
| Campagne 2 | echelle_bots, v1 : aléatoire, glouton, MC 8 / 32 / 128, 330 parties | 16 | 10,8 min | 10,4 min | réussi |
| Campagne 3 | echelle_bots, v2 | 16 | 22,7 min | 17,8 min | réussi (a attendu la 2) |
| Campagne 4 | echelle_bots_2, v1 : MC 128 taux de rêve 0 / 1 / libre, devin MC 32, 150 parties | 20 | 12,3 min | 11,9 min | réussi |
| Campagne 5 | echelle_bots_2, v2 | 20 | 26,0 min | 18,4 min | réussi (a attendu la 4) |
| Campagne 6 | coordination_mc, v1 : MC 64 soi × 3 communications + central, 240 parties | 20 | 21,9 min | 18,2 min | réussi |
| Campagne 7 | coordination_mc, v2 | 20 | 47,2 min | 27,6 min | réussi (a attendu la 6) |
| Campagne 8 | reference, v1, échelle 0,02 (essai des workflows Node 24) | 3 | 0,5 min | 0,2 min | réussi |
| Batterie 2 | batterie phase 1, 4 configurations principales, échelle 0,05 (essai des workflows Node 24) | 4 | 0,7 min | 0,3 min | réussi |
| Campagne 9 | coordination_mc_2, v1 : MC 64 soi qui annonce × 3 communications + central, 240 parties | 20 | 19,2 min | 11,9 min | réussi ; traité (bilan des bots, section 5 bis) |
| Campagne 10 | coordination_mc_2, v2 | 20 | 31,5 min | 13,3 min | réussi, 1 partie en erreur (corrigée : moteur 1.7.1) ; traité |
| Batterie 3 | batterie phase3 (plan réduit), MC 64 soi, p3_v1 et p3_v2, 676 parties ; résultats dans `batterie/run3_phase3/` | 20 | 29,1 min | 13 min | réussi ; à traiter en 3.5 |
| Batterie 4 | programme mesures3 : tape-taupe, dilemmes (v1, V2), témoins (une tactique, sans rêve, essoufflement), 1 020 parties dont 330 de MC 64 environ ; résultats et parties dans `batterie/run4_mesures3/` | 20 | 17,9 min | 8 min | réussi (témoins : 2 sur 3) ; à traiter en 3.5 (tape-taupe : comparer aussi le glouton par table aux valeurs d'équipe de la Batterie 3 ; témoins ; seuils des dilemmes à faire confirmer par l'auteur) |
| Batterie 5 | phase3, p3_v2r (V2, bot fort qui rêve), 338 parties | 10 | – | – | réussi ; traité (diagnostic, sections 2 et 4) |
| Batterie 6 | mesures3, m3_v2r, 300 parties | 10 | 8 min environ | 1,3 min | réussi ; à traiter en 3.5 |
| Campagne 11 | jeu_restreint, v1, MC 64, 480 parties | 20 | 77 min (attentes comprises) | 23 min | réussi ; traité (diagnostic, section 6) |
| Campagne 12 | jeu_restreint_v2, V2, MC 64 qui rêve, 480 parties | 20 | 80 min | 8 min | fusion annulée par le groupe de concurrence, relancée (rerun-failed-jobs) : réussi ; traité |
| Campagne 13 | v2_options_mc, 16 variantes, MC 64 qui rêve, 960 parties | 20 | 82 min | 17 min | fusion annulée, relancée : réussi ; traité (section 7) |
| Campagne 14 | robustesse_v1, bonus 0/10/25, 720 parties | 20 | 75 min | 28 min | réussi ; traité (section 8) |
| Campagne 15 | robustesse_v2, 16 variantes × bonus 10 et 25, 1 920 parties | 20 | 101 min (attentes comprises) | 34 min environ | réussi ; traité (diagnostic, section 8) |
| Cycle « essai » | essai du pipeline (étape 0.10) : criblage, 2 générations, 2 manches, contrôle, rapport ; glouton, très petit | 4 | 4 min (7 lancements enchaînés seuls) | < 1 min | réussi ; issue n° 1 fermée |
| Campagne 16 | ligne_base_p2 (V0.3, 2 à 6 joueurs) : MC64R contre MCP64, témoins, coordination ; 544 parties | 14 | 48 min | 48 min (228 s-cœur par partie en moyenne) | réussi ; traité (ligne de base P2) |
| Campagne 17 | ligne_base_p2_v02 (V0.2) : MCP64 contre MC64, choix morts (mammifères sans pouvoir) ; 108 parties | 6 | 17 min | 17 min | réussi ; traité (ligne de base P2) |
| Cycle 1 | c1 : criblage (336 variantes, gloutons, 2 à 6 joueurs), exploration MAP-Elites (10 générations), confirmation MC64R (2 manches), contrôle MC 256 à portefeuille | 20 | 6 h 45 (estimé 5 h 20) | contrôle : 2 h 25 | réussi ; traité (bilan du cycle 1) |
| Campagne 18 | calibration_v04 (V0.4, 2 à 6 joueurs) : MC64R, MCP64, MC 64 rêve 0,5, MC 256 à portefeuille ; 256 parties, échantillon P2 | 20 | 86 min | 86 min | réussi (5 184 s pour le lot le plus lent ; 282 549 s-cœur) ; traité (a.2) |

*Les campagnes 2 à 7 ont été jouées avec le moteur avant l'accélération (moteur 1.7 : prévision deux fois plus rapide) : les mêmes campagnes prendraient aujourd'hui environ moitié moins de temps.*

## Journal des passages

| Date | Début | Durée | Statut | Résumé |
|---|---|---|---|---|
| 13 oct. 2026 | – | – | terminé | Mise en place (session interactive) : phase 2 terminée, ETAT.md créé, workflows en Node 24 (tests verts), tâche planifiée « Forêt qui rêve · tests autonomes » créée (3 h 35, 9 h 35, 15 h 35). Pas compté dans le plafond. |
| 13 oct. 2026 | 08:27 | 3 h 35 | terminé | Session interactive avec l'auteur : décisions de fin de phase 2 (section 8), planification revue ; étapes 3.1 à 3.6 faites (moteur 1.7.1, bot fort de la V2 qui rêve, mesures du bot fort, jeu restreint, options de la v2, robustesse ; campagnes 9 à 15 et batteries 3 à 6). Livrable : `projet/4-bilans/diagnostic-v1-options-v2.md`. Étape suivante : 3.7, décision de l'auteur. Pas compté dans le plafond. |
| 13 oct. 2026 | 13:00 | 3 h 35 | terminé | Session interactive avec l'auteur : point de situation ; plan vers la V1 (`projet/3-pilotage/plan-vers-v1.md`), versions renommées, règle de décision, critère des tailles de table ; trois tâches planifiées (Sonnet courant, Opus fin de cycle, réveil) ; étape 0 faite en entier (0.1 à 0.11, moteur 1.8, pipeline autonome essayé) ; ligne de base P2 ; cycle 1 lancé. Pas compté dans le plafond. |
| 13 oct. 2026 | 23:08 | 5 min | arrêté | Réveil : rapport du cycle 1 prêt (`cycles/c1/rapport.md`, branche resultats). Le déclenchement de la tâche « analyse de fin de cycle » (fire_trigger) a été refusé par le classificateur d'autorisations ; rien contourné. Analyse à lancer à la main. Pas compté. |
| 13 oct. 2026 | 23:10 | 35 min | terminé | Analyse de fin de cycle 1 (Opus, tâche « analyse de fin de cycle » lancée à la main) : bilan `projet/4-bilans/cycle-1-bilan.md`. Durée réglée (0 % de fins précoces, deux bots) ; difficulté −20 points au bot fort et −8 au contrôle (sûrs), verdict non stable ; nouvelles alertes D et E ; alerte A à lever. Décision technique : bot fort recalibré en ouverture du cycle 2. Proposition : V0.4 = variante A. DÉCISION UTILISATEUR : adopter la V0.4. README à jour. |
| 13 oct. 2026 | 23:27 | 20 min | terminé | Session interactive avec l'auteur : V0.4 adoptée (section 8). Étape a.1 faite : `maquettes/v0.4.json` (égale à la variante A jouée au cycle 1), `tests/test_v04.py`, docs, plan (alerte A levée, alertes D et E), README ; contrôles verts (361 tests). Étape a.2 lancée : Campagne 18, `calibration_v04`. Réveil non armé : le passage quotidien de 9 h 35 traitera les résultats. Pas compté dans le plafond. |
| 14 oct. 2026 | 08:00 | 20 min | terminé | Session interactive avec l'auteur : garde-fou « aucune boucle gagnante » adopté (section 8) et spécifié (`projet/3-pilotage/garde-fou-boucles-gagnantes.md`), catalogue (C1), plan (alerte F), étape 3 bis ajoutée à la section 5. Documents seulement : aucun code, aucun lancement. Pas compté dans le plafond. |
| 14 oct. 2026 | 08:08 | 35 min | terminé | Session interactive (Opus) : relecture et correction de la spécification ; garde-fou codé (`foret/bots/repete.py`, `foret/boucles.py`, mesures, étape `boucles` du cycle, `tests/test_boucles.py`) ; première lecture locale (2 × 8 512 parties, 1 min) appariée aux Campagnes 16 et 18 : V0.3 rouge, V0.4 orange ; étape 3 bis FAITE. Les étapes 2 à 4 du cycle 2 restent pour les passages suivants. Pas compté dans le plafond. |
| 14 oct. 2026 | 09:36 | 25 min | terminé | Passage planifié (Sonnet) : étape a.2. Campagne 18 lue et analysée en apparié (`projet/4-bilans/calibration-bot-fort-v04.md`) : MC 256 à portefeuille nettement plus fort (+13,8 ± 3,8), MCP64 et MC 64 rêve 0,5 indiscernables de MC64R. Décision technique : MC64R reste le bot fort, MC 256 le contrôle ; `COUT["mc256"]` recalé à 3 700 s (estimation). Étape suivante : a.3 (P3). |
