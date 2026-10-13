## Campagne « essai_controle_m1 » sur v0.3

- **Parties** : 4 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 2 s-cœur
- **Vitesse** : 2.5 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| controle | 4 | 0 | 75,0 | 25,0 | 0,0 | 0,0 | 5,75 | 0,0 | 73,8 | 51,6 | 6,00 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| controle (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2},"tours":7} | 2 | -9,5 | -9,5 à -9,5 | -26,4 à +7,3 | sûr |
