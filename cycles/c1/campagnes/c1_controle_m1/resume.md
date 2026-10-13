## Campagne « c1_controle_m1 » sur v0.3

- **Parties** : 256 (0 en erreur)
- **Lots** : 20 ; durée du plus long : 8666 s ; calcul cumulé : 517084 s-cœur
- **Vitesse** : 0.0 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| controle | 256 | 0 | 64,5 | 16,4 | 0,0 | 19,1 | 5,28 | 0,0 | 90,6 | 27,1 | 3,22 |

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| controle (réf. defaut) | patch:{"pouvoirs":{"attendre":{"par_tour":2},"hanter":{"par_ | 64 | -5,0 | -7,3 à -2,8 | -7,4 à -2,6 | sûr |
| controle (réf. defaut) | patch:{"cartes":{"main":6},"pouvoirs":{"attendre":{"par_tour | 64 | -5,3 | -7,6 à -3,0 | -7,5 à -3,0 | sûr |
| controle (réf. defaut) | patch:{"regles":{"cercle_par_joueur":{"2":4,"4":3},"escalade | 64 | -7,7 | -10,6 à -5,0 | -10,5 à -5,0 | sûr |
