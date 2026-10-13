## Campagne « essai_confirmation_m2 » sur v0.3

- **Parties** : 6 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 2 s-cœur
- **Vitesse** : 2.7 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| confirmation | 6 | 0 | 33,3 | 16,7 | 0,0 | 50,0 | 5,17 | 0,0 | 81,0 | 58,9 | 7,00 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| confirmation (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2}} | 2 | -16,7 | -28,6 à -4,8 | -31,1 à -2,2 | sûr |
| confirmation (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2},"tours":7} | 2 | -19,1 | -28,6 à -9,5 | -31,2 à -6,9 | sûr |
