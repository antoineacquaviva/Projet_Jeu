## Batterie d'évaluation (moteur 1.6, 2026-10-12 20:09)

- **Configurations** : 20 ; **parties** : 96200 (0 en erreur)
- **Lots** : 16 ; échelle 1.0 ; plus long lot : 95 s ; calcul cumulé : 5364 s-cœur (17.9 parties/s/cœur)
- **Témoins réussis** : 21 sur 26

Verdicts (indices du bot qui a joué) :

| Mesure | v1, rêve | v1, sans rêve | V2, rêve | V2, sans rêve |
|---|---|---|---|---|
| Robustesse : parties plantées et incohérences | 🟢 | 🟢 | 🟢 | 🟢 |
| Concentration de la menace sur les k zones les plus menacées | 🔴 97,5 | 🔴 94,7 | 🟠 81,8 | 🟠 84,0 |
| Surprise : ordres hors des deux tactiques les plus probables | 🟢 39,5 | 🟢 39,3 | 🟢 37,9 | 🟢 34,0 |
| Meilleur taux de rêve fixe | 🔴 | – | 🔴 | – |
| Contributions de Shapley des six peuples (rapport à la moyenne) | 🟠 | 🟠 | 🟢 | 🔴 |
| Synergies : duos qui battent leur meilleur peuple seul (décision B2) | 🟢 15,0 | 🔴 4,00 | 🟠 11,0 | 🟠 11,0 |
| Pire table / meilleure table (duos et trios) | 🟢 78,5 | 🟢 76,9 | 🟢 85,7 | 🟠 66,0 |
| Aucun spectateur : perte quand un peuple ne fait rien | 🟢 0,77 | 🔴 -2,11 | 🟢 0,77 | 🔴 -0,73 |
| Partie jouée d'avance : issue prédite à la fin du tour 2 | 🔴 99,0 | 🟠 70,6 | 🔴 100,0 | 🔴 81,9 |
| Incertitude restante au début du dernier tiers | 🔴 0,03 | 🔴 0,21 | 🔴 0,00 | 🟠 0,27 |
| Fins avant la mi-partie (tours 1 à 3) | 🔴 94,1 | 🟢 2,00 | 🔴 100,0 | 🟢 0,00 |
| Menace croissante : dernier tiers / premier tiers | 🟠 0,82 | 🟠 0,87 | – | 🟠 0,94 |
| Plancher : forêt gardée par le pire décile | 🟢 61,9 | 🟢 49,5 | 🟢 76,7 | 🟢 55,1 |
| Échelle des bots : aléatoire < glouton (< MCTS en phase 2) | 🟢 | 🟢 | 🟢 | 🟢 |

Témoins ratés :

- apprentissage sur v1_sans_apprentissage : attendu « propre à l'équipe » plus bas qu'avec apprentissage
- menace_croissante sur v1_essoufflement : attendu rouge (le Méchant s'essouffle)
- shapley sur v2_hanter_illimite : attendu rouge, entités en tête
- shapley sur v1_mammiferes_sans_pouvoir : attendu mammifères sous la moyenne et plus bas que dans la v1
- pire_table sur v1_hanter_illimite : attendu hors du vert
