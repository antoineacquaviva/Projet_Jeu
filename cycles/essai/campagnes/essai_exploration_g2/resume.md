## Campagne « essai_exploration_g2 » sur v0.3

- **Parties** : 20 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 2 s-cœur
- **Vitesse** : 8.9 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| exploration | 20 | 0 | 40,0 | 10,0 | 0,0 | 50,0 | 5,60 | 0,0 | 70,5 | 58,7 | 6,70 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| exploration (réf. patch:{"regles":{"lunes":"n-1","reves_pa) | patch:{"regles":{"lunes":"n-1"}} | 4 | 7,1 | +0,0 à +14,3 | -4,2 à +18,4 | incertain |
| exploration (réf. patch:{"regles":{"lunes":"n-1","reves_pa) | patch:{"regles":{"reves_par_pas":2},"tours":7} | 4 | 4,8 | -4,8 à +14,3 | -2,7 à +12,2 | incertain |
| exploration (réf. patch:{"regles":{"lunes":"n-1","reves_pa) | patch:{"regles":{"lunes":1,"reves_par_pas":2}} | 4 | -4,8 | -9,5 à +0,0 | -8,8 à -0,8 | incertain |
| exploration (réf. patch:{"regles":{"lunes":"n-1","reves_pa) | patch:{"regles":{"lunes":1,"reves_par_pas":2},"tours":7} | 4 | -6,0 | -11,9 à +0,0 | -10,2 à -1,7 | incertain |
