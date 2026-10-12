## Batterie d'évaluation (moteur 1.7, 2026-10-12 22:17)

- **Configurations** : 4 ; **parties** : 4508 (0 en erreur)
- **Lots** : 4 ; échelle 0.05 ; plus long lot : 8 s ; calcul cumulé : 113 s-cœur (40.0 parties/s/cœur)
- **Témoins réussis** : 0 sur 26

Verdicts (indices du bot qui a joué) :

| Mesure | v1, rêve | v1, sans rêve | V2, rêve | V2, sans rêve |
|---|---|---|---|---|
| Robustesse : parties plantées et incohérences | 🟢 | 🟢 | 🟢 | 🟢 |
| Concentration de la menace sur les k zones les plus menacées | 🔴 97,5 | 🔴 95,4 | 🟠 83,7 | 🟠 84,4 |
| Surprise : ordres hors des deux tactiques les plus probables | 🟢 35,4 | 🟢 33 | 🟠 46,6 | 🟢 33,6 |
| Meilleur taux de rêve fixe | 🔴 | – | 🔴 | – |
| Contributions de Shapley des six peuples (rapport à la moyenne) | 🟠 | 🟠 | 🟢 | 🔴 |
| Synergies : duos qui battent leur meilleur peuple seul (décision B2) | 🟠 10 | 🔴 2 | 🟠 11 | 🟠 8 |
| Pire table / meilleure table (duos et trios) | 🟠 52,5 | 🟢 74 | 🟢 87,7 | 🟠 63,8 |
| Aucun spectateur : perte quand un peuple ne fait rien | 🟢 0,52 | 🔴 0,19 | 🟢 0,68 | 🔴 -1,14 |
| Partie jouée d'avance : issue prédite à la fin du tour 2 | 🔴 100 | 🟢 55,6 | 🔴 100 | 🔴 83,3 |
| Incertitude restante au début du dernier tiers | 🔴 0,05 | 🟠 0,43 | 🔴 0 | 🟠 0,30 |
| Fins avant la mi-partie (tours 1 à 3) | 🔴 85,7 | 🟢 0 | 🔴 100 | 🟢 0 |
| Menace croissante : dernier tiers / premier tiers | 🔴 0,55 | 🔴 0,58 | – | 🟠 0,96 |
| Plancher : forêt gardée par le pire décile | 🟢 49,5 | 🟢 53,8 | 🟢 77,1 | 🟢 55,7 |
| Échelle des bots : aléatoire < glouton (< MCTS en phase 2) | 🟢 | 🟢 | 🟢 | 🟢 |

Témoins ratés :

- concentration sur v1_une_tactique : attendu rouge (résolue) (configuration absente)
- concentration sur v2_une_tactique : attendu rouge (résolue) (configuration absente)
- surprise sur v1_une_tactique : attendu rouge (aucune surprise) (configuration absente)
- surprise sur v2_une_tactique : attendu rouge (aucune surprise) (configuration absente)
- tactiques sur v1_une_tactique : attendu une seule tactique tirée (configuration absente)
- predictibilite sur v1_des_fixes : attendu rouge (tout est joué) (configuration absente)
- predictibilite sur v2_des_fixes : attendu rouge (tout est joué) (configuration absente)
- incertitude sur v1_des_fixes : attendu rouge (plus rien à décider) (configuration absente)
- incertitude sur v2_des_fixes : attendu rouge (plus rien à décider) (configuration absente)
- apprentissage sur v1_sans_apprentissage : attendu la piste bouge 10 fois moins (seuls les esprits) (configuration absente)
- apprentissage sur v2_sans_apprentissage : attendu la piste bouge 10 fois moins (seuls les esprits) (configuration absente)
- apprentissage sur v1_sans_apprentissage : attendu « propre à l'équipe » plus bas qu'avec apprentissage (configuration absente)
- menace_croissante sur v1_essoufflement : attendu rouge (le Méchant s'essouffle) (configuration absente)
- menace_croissante sur v2_essoufflement : attendu rouge (le Méchant s'essouffle) (configuration absente)
- plancher sur v1_assaut : attendu plus bas que la v1 (même bot) (configuration absente)
- shapley sur v1_hanter_illimite : attendu rouge, entités en tête (configuration absente)
- shapley sur v2_hanter_illimite : attendu rouge, entités en tête (configuration absente)
- shapley sur v1_mammiferes_sans_pouvoir : attendu mammifères sous la moyenne et plus bas que dans la v1 (configuration absente)
- synergies sur v1_hanter_illimite : attendu rouge (un peuple suffit) (configuration absente)
- pire_table sur v1_hanter_illimite : attendu hors du vert (configuration absente)
- spectateur sur v1_spectateur : attendu rouge (les humains ne font rien) (configuration absente)
- reve_fixe sur v1_reves_illimites : attendu rouge (le plus haut taux gagne) (configuration absente)
- fins_precoces sur v1_reves_illimites : attendu rouge (configuration absente)
- fins sur v1_reves_illimites : attendu la nuit presque disparaît (moins de 10 %) (configuration absente)
- robustesse sur v1_barrage_v0 : attendu beaucoup plus d'incohérences (barrage contourné) (configuration absente)
- couverture sur v1_sans_pouvoirs : attendu aucun pouvoir appliqué (configuration absente)
