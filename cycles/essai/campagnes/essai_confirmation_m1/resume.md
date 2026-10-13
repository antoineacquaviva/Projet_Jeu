## Campagne « essai_confirmation_m1 » sur v0.3

- **Parties** : 8 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 2 s-cœur
- **Vitesse** : 4.9 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| confirmation | 8 | 0 | 37,5 | 25,0 | 0,0 | 37,5 | 5,38 | 0,0 | 72,0 | 66,0 | 6,75 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| confirmation (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"lunes":1 | 2 | -14,3 | -23,8 à -4,8 | -29,3 à +0,8 | sûr |
| confirmation (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2}} | 2 | -19,1 | -28,6 à -9,5 | -34,1 à -4,0 | sûr |
| confirmation (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2},"tours":7} | 2 | -21,4 | -28,6 à -14,3 | -34,2 à -8,6 | sûr |
