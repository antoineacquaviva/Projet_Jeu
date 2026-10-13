## Campagne « essai_criblage » sur v0.3

- **Parties** : 36 (0 en erreur)
- **Lots** : 4 ; durée du plus long : 0 s ; calcul cumulé : 3 s-cœur
- **Vitesse** : 12.3 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| criblage | 36 | 0 | 36,1 | 41,7 | 0,0 | 22,2 | 5,33 | 0,0 | 72,2 | 60,9 | 6,50 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| criblage (réf. defaut) | patch:{"tours":7} | 4 | 0,0 | +0,0 à +0,0 | -7,6 à +7,6 | négligeable |
| criblage (réf. defaut) | patch:{"regles":{"lunes":"n-1"},"tours":7} | 4 | -7,1 | -14,3 à +0,0 | -19,1 à +4,8 | incertain |
| criblage (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"lunes":" | 4 | -10,7 | -21,4 à +0,0 | -26,0 à +4,5 | incertain |
| criblage (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"lunes":1 | 4 | -13,1 | -17,9 à -7,1 | -23,0 à -3,2 | sûr |
| criblage (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"lunes":1 | 4 | -15,5 | -21,4 à -8,3 | -28,5 à -2,4 | sûr |
| criblage (réf. defaut) | patch:{"regles":{"lunes":"n-1","reves_par_pas":2},"tours":7} | 4 | -16,7 | -19,1 à -11,9 | -22,3 à -11,0 | sûr |
| criblage (réf. defaut) | patch:{"regles":{"cercle_par_joueur":4,"lunes":"n-1","reves_ | 4 | -23,8 | -28,6 à -19,1 | -33,7 à -13,9 | sûr |
| criblage (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"lunes":" | 4 | -23,8 | -28,6 à -19,1 | -33,7 à -13,9 | sûr |
