# Comparaison v0 → v1

- **v0** : campagne reference, maquette v0, moteur 1.0, 112350 parties, 0 erreurs
- **v1** : campagne reference, maquette v1, moteur 1.0, 112350 parties, 0 erreurs

## Par bloc

| Bloc | Indicateur | v0 | v1 | Écart |
|---|---|---|---|---|
| fuzz | Parties | 18900 | 18900 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 63,8 | 84,4 | +20,6 |
|  | Sommeil % | 36,1 | 15,0 | -21,1 |
|  | Silence % | 0,1 | 0,6 | +0,5 |
|  | Tour de fin | 5,46 | 5,85 | +0,39 |
|  | Fin au tour 1 % | 0,2 | 0,0 | -0,2 |
|  | Forêt restante % | 58,2 | 53,5 | -4,7 |
|  | Ordres réussis % | 86,4 | 73,8 | -12,6 |
|  | Cartes en rêve | 5,77 | 5,49 | -0,28 |
| glouton | Parties | 30000 | 30000 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 26,3 | 38,4 | +12,1 |
|  | Sommeil % | 72,0 | 60,1 | -11,9 |
|  | Silence % | 1,8 | 1,5 | -0,3 |
|  | Tour de fin | 3,31 | 4,22 | +0,91 |
|  | Fin au tour 1 % | 24,9 | 0,0 | -24,9 |
|  | Forêt restante % | 85,1 | 78,1 | -7,0 |
|  | Ordres réussis % | 62,6 | 51,3 | -11,3 |
|  | Cartes en rêve | 3,53 | 4,35 | +0,83 |
| glouton_variantes | Parties | 22500 | 22500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 51,0 | 56,9 | +5,9 |
|  | Sommeil % | 47,4 | 40,9 | -6,5 |
|  | Silence % | 1,6 | 2,2 | +0,6 |
|  | Tour de fin | 4,41 | 4,76 | +0,35 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 80,0 | 73,6 | -6,4 |
|  | Ordres réussis % | 57,2 | 50,5 | -6,7 |
|  | Cartes en rêve | 2,49 | 2,98 | +0,50 |
| variantes | Parties | 40950 | 40950 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 91,0 | 99,2 | +8,2 |
|  | Sommeil % | 9,0 | 0,8 | -8,2 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,91 | 6,00 | +0,09 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,0 | 42,2 | -3,8 |
|  | Ordres réussis % | 85,0 | 79,2 | -5,8 |
|  | Cartes en rêve | 3,79 | 3,36 | -0,44 |

## Par bloc, variante et bot

| Bloc | variante | bot | Indicateur | v0 | v1 | Écart |
|---|---|---|---|---|
| fuzz | defaut | aleatoire | {} | Parties | 18900 | 18900 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 63,8 | 84,4 | +20,6 |
|  | Sommeil % | 36,1 | 15,0 | -21,1 |
|  | Silence % | 0,1 | 0,6 | +0,5 |
|  | Tour de fin | 5,46 | 5,85 | +0,39 |
|  | Fin au tour 1 % | 0,2 | 0,0 | -0,2 |
|  | Forêt restante % | 58,2 | 53,5 | -4,7 |
|  | Ordres réussis % | 86,4 | 73,8 | -12,6 |
|  | Cartes en rêve | 5,77 | 5,49 | -0,28 |
| variantes | sans_pouvoirs | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 91,4 | 98,9 | +7,5 |
|  | Sommeil % | 8,6 | 1,1 | -7,5 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,93 | 6,00 | +0,07 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 38,9 | 35,9 | -3,0 |
|  | Ordres réussis % | 86,9 | 84,1 | -2,8 |
|  | Cartes en rêve | 3,96 | 3,54 | -0,42 |
| variantes | fin_de_tour | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 93,0 | 99,6 | +6,6 |
|  | Sommeil % | 7,0 | 0,4 | -6,6 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,92 | 6,00 | +0,08 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,3 | 41,8 | -4,5 |
|  | Ordres réussis % | 85,6 | 80,0 | -5,6 |
|  | Cartes en rêve | 3,81 | 3,34 | -0,47 |
| variantes | alliance_conjointe | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,5 | 99,3 | +8,8 |
|  | Sommeil % | 9,5 | 0,7 | -8,8 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,10 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,5 | 41,3 | -5,2 |
|  | Ordres réussis % | 85,8 | 80,3 | -5,5 |
|  | Cartes en rêve | 3,77 | 3,34 | -0,43 |
| variantes | tenir_passive | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 88,0 | 99,2 | +11,2 |
|  | Sommeil % | 12,0 | 0,8 | -11,2 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,88 | 6,00 | +0,12 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 53,4 | 48,6 | -4,8 |
|  | Ordres réussis % | 77,2 | 71,5 | -5,7 |
|  | Cartes en rêve | 3,75 | 3,33 | -0,42 |
| variantes | effets_organes | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 89,6 | 99,3 | +9,7 |
|  | Sommeil % | 10,4 | 0,7 | -9,7 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,89 | 6,00 | +0,11 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 49,9 | 46,5 | -3,4 |
|  | Ordres réussis % | 81,8 | 74,1 | -7,7 |
|  | Cartes en rêve | 3,75 | 3,33 | -0,43 |
| variantes | chantier_litteral | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,1 | 99,4 | +9,3 |
|  | Sommeil % | 9,9 | 0,6 | -9,3 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,89 | 6,00 | +0,11 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 45,6 | 41,5 | -4,1 |
|  | Ordres réussis % | 87,3 | 80,2 | -7,1 |
|  | Cartes en rêve | 3,76 | 3,34 | -0,42 |
| variantes | reparer_sans_hs | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,9 | 99,4 | +8,5 |
|  | Sommeil % | 9,1 | 0,6 | -8,5 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,10 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,9 | 41,8 | -5,1 |
|  | Ordres réussis % | 85,5 | 79,8 | -5,7 |
|  | Cartes en rêve | 3,77 | 3,34 | -0,43 |
| variantes | silence_reserve_vide | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,9 | 99,4 | +8,5 |
|  | Sommeil % | 9,1 | 0,6 | -8,5 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,10 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,9 | 41,8 | -5,1 |
|  | Ordres réussis % | 85,6 | 80,0 | -5,6 |
|  | Cartes en rêve | 3,77 | 3,33 | -0,44 |
| variantes | hanter_off | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 91,1 | 99,0 | +7,9 |
|  | Sommeil % | 8,9 | 1,0 | -7,9 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,09 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 41,2 | 39,6 | -1,6 |
|  | Ordres réussis % | 85,1 | 79,7 | -5,4 |
|  | Cartes en rêve | 3,76 | 3,36 | -0,41 |
| variantes | sursaut_et_bruit | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 91,0 | 99,4 | +8,4 |
|  | Sommeil % | 9,0 | 0,6 | -8,4 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,10 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 46,3 | 41,7 | -4,6 |
|  | Ordres réussis % | 85,6 | 80,0 | -5,6 |
|  | Cartes en rêve | 3,77 | 3,33 | -0,44 |
| variantes | paquet_repioche | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,1 | 99,3 | +9,2 |
|  | Sommeil % | 9,9 | 0,7 | -9,2 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,91 | 6,00 | +0,09 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 47,2 | 42,1 | -5,1 |
|  | Ordres réussis % | 85,6 | 79,8 | -5,8 |
|  | Cartes en rêve | 3,85 | 3,39 | -0,45 |
| variantes | zones_rasees_visees | aleatoire | {} | Parties | 3150 | 3150 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 90,8 | 99,4 | +8,6 |
|  | Sommeil % | 9,2 | 0,6 | -8,6 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,90 | 6,00 | +0,10 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 47,1 | 42,1 | -5,0 |
|  | Ordres réussis % | 85,4 | 79,7 | -5,7 |
|  | Cartes en rêve | 3,77 | 3,33 | -0,44 |
| glouton | defaut | glouton | {"reves_par_tour": 0.0} | Parties | 7500 | 7500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 93,7 | 96,2 | +2,5 |
|  | Sommeil % | 1,0 | 0,0 | -1,0 |
|  | Silence % | 5,4 | 3,8 | -1,6 |
|  | Tour de fin | 5,85 | 5,97 | +0,12 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 77,8 | 67,4 | -10,4 |
|  | Ordres réussis % | 51,7 | 46,1 | -5,6 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton | defaut | glouton | {"reves_par_tour": 0.5} | Parties | 7500 | 7500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 10,7 | 41,8 | +31,1 |
|  | Sommeil % | 87,7 | 56,3 | -31,4 |
|  | Silence % | 1,6 | 1,9 | +0,3 |
|  | Tour de fin | 3,92 | 5,14 | +1,22 |
|  | Fin au tour 1 % | 0,1 | 0,0 | -0,1 |
|  | Forêt restante % | 80,9 | 72,8 | -8,1 |
|  | Ordres réussis % | 66,9 | 52,1 | -14,8 |
|  | Cartes en rêve | 4,20 | 5,38 | +1,18 |
| glouton | defaut | glouton | {"reves_par_tour": 1.0} | Parties | 7500 | 7500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 0,7 | 7,8 | +7,1 |
|  | Sommeil % | 99,3 | 92,0 | -7,3 |
|  | Silence % | 0,0 | 0,2 | +0,2 |
|  | Tour de fin | 2,42 | 2,88 | +0,45 |
|  | Fin au tour 1 % | 1,7 | 0,0 | -1,7 |
|  | Forêt restante % | 87,6 | 86,2 | -1,4 |
|  | Ordres réussis % | 79,3 | 58,7 | -20,6 |
|  | Cartes en rêve | 4,81 | 6,02 | +1,21 |
| glouton | defaut | glouton | {"reves_par_tour": 3.0} | Parties | 7500 | 7500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 0,2 | 7,8 | +7,6 |
|  | Sommeil % | 99,8 | 92,0 | -7,8 |
|  | Silence % | 0,0 | 0,2 | +0,2 |
|  | Tour de fin | 1,03 | 2,88 | +1,84 |
|  | Fin au tour 1 % | 97,7 | 0,0 | -97,7 |
|  | Forêt restante % | 94,3 | 86,2 | -8,1 |
|  | Ordres réussis % | 89,6 | 58,7 | -30,9 |
|  | Cartes en rêve | 5,09 | 6,02 | +0,92 |
| glouton_variantes | fin_de_tour | glouton | {"reves_par_tour": 0.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 95,9 | 96,8 | +0,9 |
|  | Sommeil % | 0,8 | 0,0 | -0,8 |
|  | Silence % | 3,3 | 3,2 | -0,1 |
|  | Tour de fin | 5,91 | 5,98 | +0,06 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 75,8 | 66,2 | -9,6 |
|  | Ordres réussis % | 52,2 | 47,1 | -5,1 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton_variantes | fin_de_tour | glouton | {"reves_par_tour": 1.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 26,7 | 46,9 | +20,2 |
|  | Sommeil % | 72,2 | 51,6 | -20,6 |
|  | Silence % | 1,1 | 1,6 | +0,5 |
|  | Tour de fin | 3,65 | 4,49 | +0,84 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 74,5 | 67,3 | -7,2 |
|  | Ordres réussis % | 75,3 | 65,5 | -9,8 |
|  | Cartes en rêve | 5,53 | 6,00 | +0,46 |
| glouton_variantes | alliance_conjointe | glouton | {"reves_par_tour": 0.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 98,7 | 96,4 | -2,3 |
|  | Sommeil % | 0,7 | 0,0 | -0,7 |
|  | Silence % | 0,6 | 3,6 | +3,0 |
|  | Tour de fin | 5,98 | 5,97 | -0,01 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 75,7 | 67,0 | -8,7 |
|  | Ordres réussis % | 52,1 | 46,2 | -5,9 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton_variantes | alliance_conjointe | glouton | {"reves_par_tour": 1.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 1,0 | 12,0 | +11,0 |
|  | Sommeil % | 99,0 | 87,8 | -11,2 |
|  | Silence % | 0,0 | 0,3 | +0,3 |
|  | Tour de fin | 2,76 | 3,37 | +0,61 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 85,3 | 81,6 | -3,7 |
|  | Ordres réussis % | 78,0 | 63,0 | -15,0 |
|  | Cartes en rêve | 4,89 | 5,97 | +1,08 |
| glouton_variantes | effets_organes | glouton | {"reves_par_tour": 0.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 95,8 | 95,1 | -0,7 |
|  | Sommeil % | 0,9 | 0,0 | -0,9 |
|  | Silence % | 3,3 | 4,9 | +1,6 |
|  | Tour de fin | 5,90 | 5,96 | +0,06 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 84,7 | 71,5 | -13,2 |
|  | Ordres réussis % | 39,1 | 41,2 | +2,1 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton_variantes | effets_organes | glouton | {"reves_par_tour": 1.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 0,4 | 7,2 | +6,8 |
|  | Sommeil % | 99,6 | 92,7 | -6,9 |
|  | Silence % | 0,0 | 0,1 | +0,1 |
|  | Tour de fin | 2,69 | 3,21 | +0,52 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 87,8 | 87,5 | -0,3 |
|  | Ordres réussis % | 69,5 | 47,7 | -21,8 |
|  | Cartes en rêve | 4,79 | 5,93 | +1,14 |
| glouton_variantes | chantier_litteral | glouton | {"reves_par_tour": 0.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 95,6 | 96,2 | +0,6 |
|  | Sommeil % | 0,9 | 0,0 | -0,9 |
|  | Silence % | 3,5 | 3,8 | +0,3 |
|  | Tour de fin | 5,91 | 5,97 | +0,06 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 75,6 | 66,0 | -9,6 |
|  | Ordres réussis % | 51,5 | 47,4 | -4,1 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton_variantes | chantier_litteral | glouton | {"reves_par_tour": 1.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 0,4 | 11,3 | +10,9 |
|  | Sommeil % | 99,6 | 88,4 | -11,2 |
|  | Silence % | 0,0 | 0,3 | +0,3 |
|  | Tour de fin | 2,69 | 3,35 | +0,66 |
|  | Fin au tour 1 % | 0,2 | 0,0 | -0,2 |
|  | Forêt restante % | 85,5 | 81,6 | -3,9 |
|  | Ordres réussis % | 78,9 | 62,7 | -16,2 |
|  | Cartes en rêve | 4,79 | 5,96 | +1,17 |
| glouton_variantes | hanter_off | glouton | {"reves_par_tour": 0.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 94,0 | 96,4 | +2,4 |
|  | Sommeil % | 1,6 | 0,0 | -1,6 |
|  | Silence % | 4,4 | 3,6 | -0,8 |
|  | Tour de fin | 5,88 | 5,97 | +0,09 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 69,8 | 65,7 | -4,1 |
|  | Ordres réussis % | 53,1 | 47,2 | -5,9 |
|  | Cartes en rêve | 0,00 | 0,00 | 0,00 |
| glouton_variantes | hanter_off | glouton | {"reves_par_tour": 1.0} | Parties | 2250 | 2250 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 1,1 | 11,2 | +10,1 |
|  | Sommeil % | 98,9 | 88,4 | -10,5 |
|  | Silence % | 0,0 | 0,3 | +0,3 |
|  | Tour de fin | 2,74 | 3,35 | +0,61 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | 84,9 | 81,6 | -3,3 |
|  | Ordres réussis % | 78,3 | 63,2 | -15,1 |
|  | Cartes en rêve | 4,87 | 5,96 | +1,10 |

Présentes d'un seul côté : variantes | sans_esprit_depart | aleatoire | {} ; variantes | un_esprit_depart | aleatoire | {}

## Lacunes


**fuzz** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| egalite_machine | 99,4 ; 4,04 | 99,7 ; 4,37 |
| egalite_critere | 98,8 ; 5,13 | 97,5 ; 5,45 |
| egalite_arbitraire | 94,4 ; 2,48 | 60,4 ; 1,38 |
| percee_au_bout | 61,8 ; 1,32 | 66,2 ; 1,45 |
| represailles_ancienne | 33,9 ; 0,60 | 58,5 ; 1,25 |
| chemin_multiple | 58,0 ; 0,69 | 19,0 ; 0,20 |
| represailles_sans_attaque | 56,3 ; 1,37 | 54,7 ; 1,39 |
| unir_sans_hote | 18,1 ; 0,23 | 19,9 ; 0,25 |
| parler_conflit_glissee | 15,4 ; 0,20 | 17,4 ; 0,23 |
| reparer_relance_hs | 4,5 ; 0,05 | 12,3 ; 0,14 |
| ordre_contre_immobile | 5,4 ; 0,06 | 10,3 ; 0,18 |
| main_vide | 1,7 ; 0,03 | 0,3 ; 0,00 |
| silence_avec_reserve | 0,1 ; 0,00 | 0,6 ; 0,01 |
| tuile_deplacee_avant_apprentissage | – | 0,0 ; 0,00 |

**glouton** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| egalite_machine | 95,0 ; 2,88 | 100,0 ; 5,51 |
| egalite_critere | 94,2 ; 3,45 | 93,1 ; 3,54 |
| egalite_arbitraire | 86,1 ; 2,17 | 31,2 ; 0,50 |
| represailles_sans_attaque | 27,8 ; 0,48 | 63,2 ; 1,21 |
| percee_au_bout | 10,7 ; 0,17 | 40,9 ; 0,77 |
| chemin_multiple | 32,8 ; 0,35 | 3,6 ; 0,04 |
| represailles_ancienne | 18,3 ; 0,34 | 30,1 ; 0,50 |
| ordre_contre_immobile | 25,4 ; 1,13 | 21,3 ; 0,56 |
| reparer_relance_hs | 8,5 ; 0,14 | 8,3 ; 0,11 |
| silence_avec_reserve | 1,6 ; 0,02 | 1,5 ; 0,01 |
| unir_sans_hote | 1,4 ; 0,02 | 0,4 ; 0,00 |
| tuile_deplacee_avant_apprentissage | 0,1 ; 0,00 | – |

**glouton_variantes** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| egalite_machine | 98,7 ; 4,13 | 100,0 ; 5,97 |
| egalite_critere | 98,6 ; 5,13 | 96,9 ; 4,48 |
| egalite_arbitraire | 92,0 ; 3,16 | 38,8 ; 0,65 |
| represailles_sans_attaque | 32,9 ; 0,70 | 64,3 ; 1,36 |
| percee_au_bout | 20,1 ; 0,32 | 52,0 ; 1,11 |
| represailles_ancienne | 29,0 ; 0,57 | 41,4 ; 0,72 |
| chemin_multiple | 32,9 ; 0,35 | 5,1 ; 0,05 |
| ordre_contre_immobile | 29,9 ; 1,70 | 19,2 ; 0,54 |
| reparer_relance_hs | 10,6 ; 0,17 | 9,7 ; 0,13 |
| silence_avec_reserve | 1,5 ; 0,01 | 2,2 ; 0,02 |
| sans_machine | 0,4 ; 0,01 | 0,6 ; 0,01 |
| tuile_deplacee_avant_apprentissage | 0,1 ; 0,00 | – |
| unir_sans_hote | 0,0 ; 0,00 | – |

**variantes** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| egalite_critere | 100,0 ; 7,49 | 100,0 ; 7,76 |
| egalite_machine | 100,0 ; 5,26 | 100,0 ; 4,84 |
| egalite_arbitraire | 98,4 ; 3,71 | 86,4 ; 2,55 |
| percee_au_bout | 74,0 ; 1,73 | 78,3 ; 1,90 |
| represailles_sans_attaque | 75,8 ; 2,37 | 72,4 ; 2,38 |
| chemin_multiple | 69,5 ; 0,88 | 22,1 ; 0,23 |
| represailles_ancienne | 23,0 ; 0,46 | 42,3 ; 0,98 |
| unir_sans_hote | 9,2 ; 0,12 | 8,9 ; 0,12 |
| ordre_contre_immobile | 3,7 ; 0,04 | 6,1 ; 0,13 |
| parler_conflit_glissee | 3,3 ; 0,04 | 3,8 ; 0,05 |
| reparer_relance_hs | 1,4 ; 0,02 | 3,6 ; 0,04 |
| main_vide | 2,3 ; 0,04 | 0,3 ; 0,00 |
| tuile_deplacee_avant_apprentissage | 0,0 ; 0,00 | – |

## Incohérences


**fuzz** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| esprit_pousse_par_echec | 31,7 ; 0,39 | – |
| barrage_contourne | 27,2 ; 0,33 | 16,4 ; 0,17 |
| voir_trahi | 21,1 ; 0,28 | 24,8 ; 0,33 |
| silence_impossible | 9,5 ; 0,10 | 7,9 ; 0,08 |
| sommeil_par_echec | 6,3 ; 0,06 | – |
| tactique_disparue | 2,6 ; 0,03 | 0,6 ; 0,01 |

**glouton** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| barrage_contourne | 39,2 ; 0,71 | 2,8 ; 0,03 |
| esprit_pousse_par_echec | 27,1 ; 0,37 | – |
| sommeil_par_echec | 6,6 ; 0,07 | – |
| voir_trahi | 6,3 ; 0,07 | 6,4 ; 0,07 |

**glouton_variantes** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| barrage_contourne | 51,3 ; 1,03 | 4,0 ; 0,04 |
| esprit_pousse_par_echec | 35,7 ; 0,52 | – |
| sommeil_par_echec | 6,5 ; 0,07 | – |
| voir_trahi | 4,6 ; 0,05 | 2,4 ; 0,03 |
| centre_quitte_sans_sommeil | 3,3 ; 0,04 | 3,9 ; 0,04 |
| esprit_cote_eveil | 2,2 ; 0,16 | 2,2 ; 0,17 |

**variantes** (% des parties concernées ; par partie)

| Code | v0 | v1 |
|---|---|---|
| esprit_pousse_par_echec | 30,4 ; 0,39 | – |
| silence_impossible | 28,6 ; 0,29 | 24,2 ; 0,24 |
| barrage_contourne | 22,9 ; 0,27 | 8,4 ; 0,09 |
| voir_trahi | 13,4 ; 0,19 | 13,3 ; 0,17 |
| sommeil_par_echec | 2,3 ; 0,02 | – |
| tactique_disparue | 0,7 ; 0,01 | 0,2 ; 0,00 |
| centre_quitte_sans_sommeil | 0,2 ; 0,00 | 0,0 ; 0,00 |
| esprit_cote_eveil | 0,1 ; 0,00 | 0,0 ; 0,00 |
