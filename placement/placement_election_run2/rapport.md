# Campagne placement_election

21 variantes, 32 parties par bot et par variante (graines appariées). Bots : sentinelle, marquage, regroupement, reflexe, glouton, glouton_aveugle, glouton_immobile, mc, mc_immobile. Méchant : hasard.

## Les meilleures variantes (score = la note la plus faible)

| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |
|---|---|---|---|---|---|---|---|---|---|---|
| base | (base) | 1.00 | 58.8 | 29.9 | 8.2 | 9.6 | 8.6 | 5.3 | 20 | – |
| c0095 | 6x6 machines=2 entree=bords n=2 k=1 tours=6 annonces=4 portee=2 sabotage=aucun tactiques=cup1,opp1,per3,rep1 | 1.00 | 45.8 | 16.7 | 13.0 | 8.9 | 6.2 | 13.0 | 8 | – |
| c0194 | 6x6 arbres=1 profil=bosquets machines=5 individus=2 k=1 tours=10 annonces=6 sabotage=aucun tactiques=cup2,per2 | 1.00 | 54.1 | 30.3 | 7.5 | 5.6 | 11.2 | 7.2 | 4 | – |
| c0237 | 7x7 voisinage=8 profil=coeur machines=4 individus=1 n=2 k=1 annonces=4 aller_garder=True sabotage=aucun tactiques=cup1,opp1,per1 | 1.00 | 62.1 | 16.0 | 10.9 | 9.4 | 53.1 | 7.4 | 18 | – |
| c0307 | 6x6 arbres=2 machines=4 individus=6 n=5 k=4 annonces=7 aller_garder=True sabotage=aucun tactiques=cup1,opp1,per1 | 1.00 | 62.5 | 47.8 | 16.7 | 8.7 | 34.8 | 4.9 | 27 | – |
| c0234 | 7x7 voisinage=8 arbres=2 profil=bosquets machines=5 entree=bords individus=4 n=4 tours=6 annonces=7 aller_garder=True tactiques=cup1,opp1,per3,rep1 | 0.80 | 74.2 | 50.3 | 19.0 | 10.9 | 30.7 | 3.4 | 16 | – |
| c0254 | 6x4 voisinage=8 arbres=4 machines=5 entree=bords individus=2 n=5 tours=6 annonces=8 portee=2 tactiques=cup2,per2 | 0.79 | 67.4 | 17.7 | 12.5 | 4.2 | 8.1 | 5.7 | 9 | – |
| c0038 | 6x4 voisinage=8 machines=4 entree=bords individus=4 n=4 k=3 tours=6 aller_garder=True sabotage=fige tactiques=cup1,opp1,per1 | 0.76 | 78.6 | 46.5 | 10.8 | 9.9 | 15.1 | 3.8 | 22 | – |
| c0148 | 6x6 voisinage=8 machines=5 entree=bords n=4 tours=6 annonces=6 tactiques=cup2,per2 | 0.73 | 54.7 | 22.7 | 7.8 | 3.9 | 13.3 | 5.2 | 10 | – |
| c0373 | 7x7 arbres=2 profil=bosquets machines=5 n=4 k=3 tours=6 aller_garder=True sabotage=aucun tactiques=cup2,per2 | 0.53 | 73.3 | 42.9 | 16.0 | 3.1 | 37.7 | 5.2 | 16 | – |
| c0092 | arbres=2 profil=bosquets machines=4 individus=4 n=5 k=4 portee=2 sabotage=fige garde_portee=1 tactiques=cup1,opp1,per3,rep1 | 0.34 | 77.0 | 9.4 | 19.2 | 2.3 | 3.1 | 4.1 | 12 | – |
| c0233 | 6x6 machines=4 portee=2 aller_garder=True sabotage=allie tactiques=cup1,opp1,per1 | 0.32 | 65.8 | 36.9 | 11.7 | 19.1 | 38.9 | 2.0 | 14 | – |
| c0349 | 6x4 arbres=1 profil=bosquets machines=5 individus=4 tours=6 annonces=4 aller_garder=True sabotage=allie tactiques=cup1,opp1,per3,rep1 | 0.27 | 83.3 | 42.2 | 13.8 | 19.5 | 25.3 | 1.8 | 19 | – |
| c0220 | 7x7 individus=4 n=4 k=3 garde_portee=1 tactiques=cup2,per2 | 0.24 | 71.7 | 12.4 | 30.1 | 6.1 | 2.0 | 3.6 | 12 | – |
| c0278 | 7x7 voisinage=8 arbres=1 profil=coeur machines=5 entree=bords individus=1 n=4 k=1 tours=10 aller_garder=True | 0.22 | 75.3 | 52.5 | 19.4 | 1.9 | 43.1 | 5.9 | 15 | – |

## Bandes sur l'ensemble des variantes

| Mesure | vert | orange | rouge |
|---|---|---|---|
| lecture | 20 | 1 | 0 |
| profondeur | 21 | 0 | 0 |
| info | 13 | 6 | 2 |
| placement | 19 | 2 | 0 |
| maitrise | 11 | 8 | 2 |
| difficulte | 14 | 7 | 0 |

## Effet des paramètres (moyenne par niveau)

**aller_garder**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| false | 7 | 0.73 | 61.4 | 19.9 | 14.1 | 5.8 | 7.5 |
| true | 14 | 0.37 | 73.1 | 40.7 | 15.8 | 8.0 | 39.3 |

**annonces**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 5 | 0.45 | 68.5 | 25.8 | 15.8 | 10.1 | 38.8 |
| 5 | 8 | 0.42 | 72.5 | 35.9 | 16.1 | 6.5 | 24.3 |
| 6 | 3 | 0.58 | 57.4 | 30.3 | 10.8 | 1.4 | 19.8 |
| 7 | 3 | 0.61 | 69.6 | 44.1 | 16.0 | 9.6 | 31.4 |
| 8 | 2 | 0.49 | 74.5 | 34.4 | 15.4 | 8.2 | 30.4 |

**arbres**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 0.30 | 71.1 | 44.0 | 14.3 | 4.4 | 32.1 |
| 2 | 4 | 0.67 | 71.7 | 37.6 | 17.7 | 6.3 | 26.6 |
| 3 | 8 | 0.65 | 64.9 | 29.0 | 13.9 | 9.9 | 23.7 |
| 4 | 4 | 0.21 | 72.7 | 26.5 | 16.5 | 6.5 | 36.5 |

**entree**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "bords" | 9 | 0.48 | 69.6 | 37.5 | 14.7 | 6.6 | 26.2 |
| "front" | 12 | 0.49 | 68.8 | 31.0 | 15.6 | 7.7 | 30.5 |

**garde_portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 19 | 0.51 | 68.6 | 36.1 | 14.2 | 7.6 | 31.5 |
| 1 | 2 | 0.29 | 74.3 | 10.9 | 24.7 | 4.2 | 2.5 |

**hauteur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 5 | 0.37 | 76.1 | 36.0 | 14.7 | 10.7 | 24.4 |
| 5 | 5 | 0.30 | 70.6 | 28.6 | 16.1 | 4.2 | 32.7 |
| 6 | 5 | 0.81 | 56.6 | 30.9 | 11.4 | 9.2 | 20.9 |
| 7 | 6 | 0.46 | 72.6 | 38.5 | 18.1 | 5.2 | 35.4 |

**individus**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 0.41 | 67.0 | 35.5 | 15.8 | 2.0 | 43.7 |
| 2 | 5 | 0.36 | 69.0 | 30.8 | 12.6 | 4.2 | 31.6 |
| 3 | 6 | 0.63 | 63.3 | 33.4 | 12.5 | 9.5 | 26.2 |
| 4 | 6 | 0.40 | 77.3 | 33.4 | 19.5 | 9.9 | 20.2 |
| 6 | 1 | 1.00 | 62.5 | 47.8 | 16.7 | 8.7 | 34.8 |

**k**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 0.64 | 60.2 | 30.7 | 13.6 | 4.1 | 29.7 |
| 2 | 10 | 0.41 | 70.9 | 35.7 | 13.5 | 9.1 | 31.6 |
| 3 | 4 | 0.38 | 75.7 | 35.3 | 20.2 | 7.5 | 24.9 |
| 4 | 2 | 0.67 | 69.7 | 28.6 | 18.0 | 5.5 | 18.9 |

**largeur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 2 | 0.02 | 75.6 | 36.9 | 18.2 | 9.9 | 36.9 |
| 5 | 5 | 0.30 | 70.6 | 28.6 | 16.1 | 4.2 | 32.7 |
| 6 | 8 | 0.73 | 64.0 | 32.6 | 11.7 | 10.0 | 19.1 |
| 7 | 6 | 0.46 | 72.6 | 38.5 | 18.1 | 5.2 | 35.4 |

**machines**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 0.33 | 60.5 | 23.1 | 15.9 | 1.9 | 35.1 |
| 3 | 5 | 0.29 | 74.1 | 38.0 | 18.8 | 7.8 | 30.8 |
| 4 | 6 | 0.57 | 69.7 | 31.8 | 13.6 | 9.8 | 29.0 |
| 5 | 7 | 0.62 | 68.9 | 36.9 | 13.7 | 7.0 | 24.2 |

**n**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 2 | 1.00 | 54.0 | 16.3 | 12.0 | 9.1 | 29.7 |
| 3 | 6 | 0.43 | 68.9 | 35.1 | 12.0 | 9.3 | 32.3 |
| 4 | 8 | 0.41 | 71.3 | 38.1 | 18.0 | 5.2 | 27.7 |
| 5 | 5 | 0.47 | 72.1 | 32.0 | 15.8 | 7.3 | 25.5 |

**portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 15 | 0.52 | 69.7 | 37.1 | 15.5 | 7.7 | 29.1 |
| 2 | 6 | 0.41 | 67.9 | 25.4 | 14.5 | 6.1 | 27.7 |

**profil**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "bosquets" | 7 | 0.45 | 74.7 | 38.0 | 16.8 | 9.2 | 29.4 |
| "coeur" | 4 | 0.30 | 72.2 | 35.0 | 15.3 | 3.3 | 51.6 |
| "uniforme" | 10 | 0.59 | 64.1 | 30.3 | 14.0 | 7.4 | 19.1 |

**sabotage**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "allie" | 6 | 0.13 | 74.3 | 37.1 | 17.1 | 9.8 | 43.5 |
| "aucun" | 5 | 0.91 | 59.6 | 30.7 | 12.8 | 7.1 | 28.6 |
| "echappe" | 8 | 0.48 | 69.2 | 34.6 | 15.3 | 5.7 | 22.6 |
| "fige" | 2 | 0.55 | 77.8 | 28.0 | 15.0 | 6.1 | 9.1 |

**tactiques**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| {"cupidite": 1, "opportunisme": 1, "percee": 1, "represailles": 1} | 3 | 0.41 | 65.9 | 40.1 | 14.9 | 2.1 | 28.9 |
| {"cupidite": 1, "opportunisme": 1, "percee": 1} | 7 | 0.47 | 70.7 | 35.3 | 14.0 | 10.1 | 41.1 |
| {"cupidite": 1, "opportunisme": 1, "percee": 3, "represailles": 1} | 5 | 0.48 | 71.9 | 31.6 | 17.8 | 10.5 | 22.1 |
| {"cupidite": 2, "percee": 2} | 6 | 0.55 | 66.7 | 30.5 | 14.6 | 3.8 | 19.7 |

**tours**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 4 | 0.31 | 68.4 | 32.9 | 14.1 | 4.6 | 36.8 |
| 6 | 9 | 0.54 | 68.9 | 35.2 | 14.9 | 7.3 | 24.0 |
| 8 | 8 | 0.51 | 69.8 | 32.6 | 16.1 | 8.4 | 29.9 |

**voisinage**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 14 | 0.41 | 68.5 | 32.3 | 15.8 | 7.1 | 27.6 |
| 8 | 7 | 0.64 | 70.6 | 36.7 | 14.1 | 7.5 | 30.9 |
