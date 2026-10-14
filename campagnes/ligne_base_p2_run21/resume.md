## Campagne « ligne_base_p2 » sur v0.4rd

- **Parties** : 480 (0 en erreur)
- **Lots** : 14 ; durée du plus long : 1749 s ; calcul cumulé : 79839 s-cœur
- **Vitesse** : 0.0 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bots | 128 | 0 | 32,0 | 67,2 | 0,0 | 0,8 | 4,00 | 0,0 | 87,5 | 32,5 | 4,23 |
| temoins | 256 | 0 | 16,4 | 83,6 | 0,0 | 0,0 | 3,55 | 0,0 | 91,1 | 28,5 | 5,27 |
| soi | 72 | 0 | 23,6 | 13,9 | 0,0 | 62,5 | 3,99 | 0,0 | 84,5 | 45,6 | 4,83 |
| central | 24 | 0 | 66,7 | 33,3 | 0,0 | 0,0 | 5,62 | 0,0 | 79,4 | 39,2 | 2,29 |

- **Coordination** (part de l'écart récupérée) : – % (aucun signe 88,1, maquette 77,0, tout dire 88,3 ; écart 0,2 ± 2,4) : non mesurable
- **Chef unique** : 3,1 % ± 9,1 (central 79,4, chacun pour soi 77,0) : orange
- **Chef unique, témoin « tout dire »** : -10,1 % ± 5,5 (central 79,4, chacun pour soi 88,3) : rouge

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| temoins (réf. defaut) | temoin_sans_apprentissage | 64 | 5,7 | +3,0 à +8,6 | +2,5 à +8,8 | sûr |
| temoins (réf. defaut) | patch:{"piste":{"disposition":["Cupidite","Cupidite","Cupidi | 64 | 5,1 | +2,6 à +7,7 | +1,9 à +8,4 | sûr |
| temoins (réf. defaut) | temoin_une_tactique | 64 | -0,5 | -2,9 à +1,9 | -4,5 à +3,6 | incertain |
| soi (réf. defaut) | comm_tout_dire | 24 | 11,3 | +5,8 à +17,1 | +6,0 à +16,6 | sûr |
| soi (réf. defaut) | comm_aucun_signe | 24 | 11,1 | +6,2 à +16,3 | +5,8 à +16,4 | sûr |
