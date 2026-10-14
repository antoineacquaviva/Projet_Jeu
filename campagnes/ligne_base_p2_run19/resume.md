## Campagne « ligne_base_p2 » sur v0.4

- **Parties** : 480 (0 en erreur)
- **Lots** : 14 ; durée du plus long : 4940 s ; calcul cumulé : 210080 s-cœur
- **Vitesse** : 0.0 parties par seconde et par cœur

| Bloc | Parties | Erreurs | Nuit % | Sommeil % | Silence % | Réveil % | Tour de fin | Fin au tour 1 % | Forêt restante % | Ordres réussis % | Cartes en rêve |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bots | 128 | 0 | 85,2 | 8,6 | 0,0 | 6,2 | 5,84 | 0,0 | 74,8 | 34,9 | 2,91 |
| temoins | 256 | 0 | 75,4 | 24,6 | 0,0 | 0,0 | 5,77 | 0,0 | 78,2 | 32,2 | 4,25 |
| soi | 72 | 0 | 34,7 | 0,0 | 0,0 | 65,3 | 4,08 | 0,0 | 83,8 | 43,9 | 4,10 |
| central | 24 | 0 | 100,0 | 0,0 | 0,0 | 0,0 | 6,00 | 0,0 | 81,9 | 35,3 | 0,42 |

- **Coordination** (part de l'écart récupérée) : – % (aucun signe 87,7, maquette 75,2, tout dire 88,5 ; écart 0,8 ± 2,6) : non mesurable
- **Chef unique** : 8,9 % ± 8,8 (central 81,9, chacun pour soi 75,2) : vert
- **Chef unique, témoin « tout dire »** : -7,5 % ± 5,4 (central 81,9, chacun pour soi 88,5) : rouge

Écarts appariés à la référence (points de forêt ; mêmes tables, mêmes graines ; intervalle à 95 % par rééchantillonnage ; « sûr » : l'intervalle exclut 0, « négligeable » : il tient dans ± 1 point) :

| Groupe | Variante | Paires | Écart | Intervalle apparié | Sans apparier | Verdict |
|---|---|---|---|---|---|---|
| temoins (réf. defaut) | patch:{"piste":{"disposition":["Cupidite","Cupidite","Cupidi | 64 | 9,4 | +5,2 à +13,7 | +4,5 à +14,4 | sûr |
| temoins (réf. defaut) | temoin_sans_apprentissage | 64 | 6,2 | +2,5 à +10,1 | +0,9 à +11,6 | sûr |
| temoins (réf. defaut) | temoin_une_tactique | 64 | 4,6 | +0,7 à +8,7 | -1,1 à +10,3 | sûr |
| soi (réf. defaut) | comm_tout_dire | 24 | 13,3 | +8,7 à +18,1 | +8,5 à +18,1 | sûr |
| soi (réf. defaut) | comm_aucun_signe | 24 | 12,5 | +8,1 à +16,7 | +7,5 à +17,5 | sûr |
