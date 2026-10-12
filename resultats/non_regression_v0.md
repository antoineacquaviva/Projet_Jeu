# Comparaison moteur v0 → moteur v1 (maquette v0)

- **moteur v0** : campagne ?, maquette ?, moteur ?, ? parties, ? erreurs
- **moteur v1 (maquette v0)** : campagne reference, maquette v0, moteur 1.0, 112350 parties, 0 erreurs

## Par bloc

| Bloc | Indicateur | moteur v0 | moteur v1 (maquette v0) | Écart |
|---|---|---|---|---|
| fuzz | Parties | 18900 | 18900 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 63,9 | 63,8 | -0,1 |
|  | Sommeil % | 36,0 | 36,1 | +0,1 |
|  | Silence % | 0,1 | 0,1 | 0,0 |
|  | Tour de fin | 5,46 | 5,46 | 0,00 |
|  | Fin au tour 1 % | 0,2 | 0,2 | 0,0 |
|  | Forêt restante % | – | 58,2 |  |
|  | Ordres réussis % | 86,3 | 86,4 | +0,1 |
|  | Cartes en rêve | 5,75 | 5,77 | +0,02 |
| glouton | Parties | 30000 | 30000 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 26,3 | 26,3 | 0,0 |
|  | Sommeil % | 72,0 | 72,0 | 0,0 |
|  | Silence % | 1,7 | 1,8 | +0,1 |
|  | Tour de fin | 3,31 | 3,31 | -0,00 |
|  | Fin au tour 1 % | 24,9 | 24,9 | 0,0 |
|  | Forêt restante % | – | 85,1 |  |
|  | Ordres réussis % | 62,7 | 62,6 | -0,1 |
|  | Cartes en rêve | 3,53 | 3,53 | -0,00 |
| glouton_variantes | Parties | 22500 | 22500 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 50,9 | 51,0 | +0,1 |
|  | Sommeil % | 47,4 | 47,4 | 0,0 |
|  | Silence % | 1,6 | 1,6 | 0,0 |
|  | Tour de fin | 4,41 | 4,41 | +0,00 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | – | 80,0 |  |
|  | Ordres réussis % | 57,2 | 57,2 | 0,0 |
|  | Cartes en rêve | 2,49 | 2,49 | -0,00 |
| variantes | Parties | 40950 | 40950 |  |
|  | Erreurs | 0 | 0 |  |
|  | Nuit % | 91,1 | 91,0 | -0,1 |
|  | Sommeil % | 8,9 | 9,0 | +0,1 |
|  | Silence % | 0,0 | 0,0 | 0,0 |
|  | Tour de fin | 5,91 | 5,91 | -0,00 |
|  | Fin au tour 1 % | 0,0 | 0,0 | 0,0 |
|  | Forêt restante % | – | 46,0 |  |
|  | Ordres réussis % | 85,0 | 85,0 | 0,0 |
|  | Cartes en rêve | 3,79 | 3,79 | +0,00 |

## Lacunes


**fuzz** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| egalite_machine | 99,5 ; 4,05 | 99,4 ; 4,04 |
| egalite_critere | 99,0 ; 5,13 | 98,8 ; 5,13 |
| egalite_arbitraire | 94,4 ; 2,49 | 94,4 ; 2,48 |
| percee_au_bout | 61,1 ; 1,32 | 61,8 ; 1,32 |
| chemin_multiple | 58,5 ; 0,70 | 58,0 ; 0,69 |
| represailles_sans_attaque | 56,4 ; 1,37 | 56,3 ; 1,37 |
| represailles_ancienne | 33,7 ; 0,60 | 33,9 ; 0,60 |
| unir_sans_hote | 17,8 ; 0,22 | 18,1 ; 0,23 |
| parler_conflit_glissee | – | 15,4 ; 0,20 |
| ordre_contre_immobile | – | 5,4 ; 0,06 |
| reparer_relance_hs | 4,6 ; 0,05 | 4,5 ; 0,05 |
| main_vide | 1,7 ; 0,02 | 1,7 ; 0,03 |
| silence_avec_reserve | 0,1 ; 0,00 | 0,1 ; 0,00 |

**glouton** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| egalite_machine | 95,0 ; 2,88 | 95,0 ; 2,88 |
| egalite_critere | 94,2 ; 3,45 | 94,2 ; 3,45 |
| egalite_arbitraire | 86,1 ; 2,17 | 86,1 ; 2,17 |
| chemin_multiple | 32,7 ; 0,35 | 32,8 ; 0,35 |
| represailles_sans_attaque | 27,8 ; 0,48 | 27,8 ; 0,48 |
| ordre_contre_immobile | – | 25,4 ; 1,13 |
| represailles_ancienne | 18,4 ; 0,34 | 18,3 ; 0,34 |
| percee_au_bout | 10,7 ; 0,17 | 10,7 ; 0,17 |
| reparer_relance_hs | 8,5 ; 0,14 | 8,5 ; 0,14 |
| silence_avec_reserve | 1,6 ; 0,01 | 1,6 ; 0,02 |
| unir_sans_hote | 1,4 ; 0,02 | 1,4 ; 0,02 |
| tuile_deplacee_avant_apprentissage | 0,1 ; 0,00 | 0,1 ; 0,00 |

**glouton_variantes** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| egalite_machine | 98,7 ; 4,13 | 98,7 ; 4,13 |
| egalite_critere | 98,6 ; 5,13 | 98,6 ; 5,13 |
| egalite_arbitraire | 92,0 ; 3,16 | 92,0 ; 3,16 |
| chemin_multiple | 33,0 ; 0,35 | 32,9 ; 0,35 |
| represailles_sans_attaque | 32,9 ; 0,70 | 32,9 ; 0,70 |
| ordre_contre_immobile | – | 29,9 ; 1,70 |
| represailles_ancienne | 29,0 ; 0,57 | 29,0 ; 0,57 |
| percee_au_bout | 20,2 ; 0,32 | 20,1 ; 0,32 |
| reparer_relance_hs | 10,6 ; 0,17 | 10,6 ; 0,17 |
| silence_avec_reserve | 1,5 ; 0,01 | 1,5 ; 0,01 |
| sans_machine | 0,4 ; 0,01 | 0,4 ; 0,01 |
| tuile_deplacee_avant_apprentissage | 0,1 ; 0,00 | 0,1 ; 0,00 |
| unir_sans_hote | 0,0 ; 0,00 | 0,0 ; 0,00 |

**variantes** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| egalite_critere | 100,0 ; 7,51 | 100,0 ; 7,49 |
| egalite_machine | 100,0 ; 5,29 | 100,0 ; 5,26 |
| egalite_arbitraire | 98,5 ; 3,74 | 98,4 ; 3,71 |
| represailles_sans_attaque | 75,6 ; 2,36 | 75,8 ; 2,37 |
| percee_au_bout | 74,2 ; 1,74 | 74,0 ; 1,73 |
| chemin_multiple | 68,9 ; 0,88 | 69,5 ; 0,88 |
| represailles_ancienne | 22,6 ; 0,45 | 23,0 ; 0,46 |
| unir_sans_hote | 9,3 ; 0,11 | 9,2 ; 0,12 |
| ordre_contre_immobile | – | 3,7 ; 0,04 |
| parler_conflit_glissee | – | 3,3 ; 0,04 |
| main_vide | 2,1 ; 0,03 | 2,3 ; 0,04 |
| reparer_relance_hs | 1,5 ; 0,02 | 1,4 ; 0,02 |
| tuile_deplacee_avant_apprentissage | 0,0 ; 0,00 | 0,0 ; 0,00 |

## Incohérences


**fuzz** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| esprit_pousse_par_echec | 31,6 ; 0,39 | 31,7 ; 0,39 |
| barrage_contourne | 26,8 ; 0,32 | 27,2 ; 0,33 |
| voir_trahi | 24,1 ; 0,32 | 21,1 ; 0,28 |
| silence_impossible | 9,5 ; 0,10 | 9,5 ; 0,10 |
| sommeil_par_echec | 5,6 ; 0,06 | 6,3 ; 0,06 |
| tactique_disparue | 2,4 ; 0,02 | 2,6 ; 0,03 |

**glouton** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| barrage_contourne | 39,2 ; 0,71 | 39,2 ; 0,71 |
| esprit_pousse_par_echec | 27,2 ; 0,37 | 27,1 ; 0,37 |
| sommeil_par_echec | 6,6 ; 0,07 | 6,6 ; 0,07 |
| voir_trahi | 6,3 ; 0,07 | 6,3 ; 0,07 |

**glouton_variantes** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| barrage_contourne | 51,3 ; 1,03 | 51,3 ; 1,03 |
| esprit_pousse_par_echec | 35,6 ; 0,52 | 35,7 ; 0,52 |
| sommeil_par_echec | 6,4 ; 0,06 | 6,5 ; 0,07 |
| voir_trahi | 4,6 ; 0,05 | 4,6 ; 0,05 |
| centre_quitte_sans_sommeil | 3,3 ; 0,04 | 3,3 ; 0,04 |
| esprit_cote_eveil | 2,2 ; 0,16 | 2,2 ; 0,16 |

**variantes** (% des parties concernées ; par partie)

| Code | moteur v0 | moteur v1 (maquette v0) |
|---|---|---|
| esprit_pousse_par_echec | 30,4 ; 0,39 | 30,4 ; 0,39 |
| silence_impossible | 28,6 ; 0,29 | 28,6 ; 0,29 |
| barrage_contourne | 22,8 ; 0,27 | 22,9 ; 0,27 |
| voir_trahi | 13,9 ; 0,19 | 13,4 ; 0,19 |
| sommeil_par_echec | 2,3 ; 0,02 | 2,3 ; 0,02 |
| tactique_disparue | 0,7 ; 0,01 | 0,7 ; 0,01 |
| centre_quitte_sans_sommeil | 0,2 ; 0,00 | 0,2 ; 0,00 |
| esprit_cote_eveil | 0,1 ; 0,00 | 0,1 ; 0,00 |
