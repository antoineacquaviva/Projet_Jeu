## Campagne « ligne_base_p2 » sur v0.3

- **Parties** : 544 (0 en erreur)
- **Lots** : 14 ; durée du plus long : 2878 s ; calcul cumulé : 123970 s-cœur
- **Vitesse** : 0.0 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bots | 128 | 0 | 39,1 | 44,5 | 0,0 | 16,4 | 4,64 | 0,0 | 92,2 | 34,0 | 4,02 |
| temoins | 320 | 0 | 34,1 | 49,7 | 0,0 | 16,2 | 4,46 | 1,2 | 93,5 | 30,7 | 4,75 |
| soi | 72 | 0 | 4,2 | 13,9 | 0,0 | 81,9 | 3,49 | 0,0 | 90,3 | 49,5 | 5,79 |
| central | 24 | 0 | 8,3 | 16,7 | 0,0 | 75,0 | 3,67 | 0,0 | 91,1 | 45,0 | 5,42 |

- **Coordination** (part de l'écart récupérée) : – % (aucun signe 89,9, maquette 90,5, tout dire 90,5 ; écart 0,6 ± 3,5) : non mesurable
- **Chef unique** : 0,7 % ± 3,6 (central 91,1, chacun pour soi 90,5) : rouge
- **Chef unique, témoin « tout dire »** : 0,7 % ± 4,1 (central 91,1, chacun pour soi 90,5) : rouge

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| temoins (réf. defaut) | temoin_sans_apprentissage | 64 | 1,7 | +0,1 à +3,4 | -0,3 à +3,7 | sûr |
| temoins (réf. defaut) | sans_lunes | 64 | 1,0 | -0,6 à +2,7 | -1,0 à +3,0 | incertain |
| temoins (réf. defaut) | patch:{"piste":{"disposition":["Cupidite","Cupidite","Cupidi | 64 | 0,3 | -1,8 à +2,3 | -1,9 à +2,5 | incertain |
| temoins (réf. defaut) | temoin_une_tactique | 64 | -0,3 | -2,3 à +1,6 | -2,6 à +2,0 | incertain |
| soi (réf. defaut) | comm_tout_dire | 24 | 0,0 | -2,8 à +2,4 | -3,3 à +3,3 | incertain |
| soi (réf. defaut) | comm_aucun_signe | 24 | -0,6 | -3,2 à +2,0 | -3,5 à +2,4 | incertain |
