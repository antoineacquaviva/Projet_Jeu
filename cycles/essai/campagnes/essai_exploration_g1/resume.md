## Campagne « essai_exploration_g1 » sur v0.3

- **Parties** : 24 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 2 s-cœur
- **Vitesse** : 10.0 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| exploration | 24 | 0 | 20,8 | 37,5 | 0,0 | 41,7 | 5,12 | 0,0 | 74,4 | 60,8 | 6,50 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| exploration (réf. defaut) | patch:{"regles":{"lunes":"n-1"},"tours":7} | 4 | -7,1 | -14,3 à +0,0 | -19,1 à +4,8 | incertain |
| exploration (réf. defaut) | patch:{"regles":{"lunes":"n-1"}} | 4 | -7,1 | -14,3 à +0,0 | -19,1 à +4,8 | incertain |
| exploration (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2}} | 4 | -14,3 | -17,9 à -10,7 | -20,7 à -7,8 | sûr |
| exploration (réf. defaut) | patch:{"regles":{"cercle_par_joueur":4,"lunes":1},"tours":7} | 4 | -15,5 | -21,4 à -8,3 | -28,5 à -2,4 | sûr |
| exploration (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2},"tours":7} | 4 | -16,7 | -19,1 à -11,9 | -22,3 à -11,0 | sûr |
