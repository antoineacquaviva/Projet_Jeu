# Campagne placement_voisinage

38 variantes, 48 parties par bot et par variante (graines appariées). Bots : sentinelle, marquage, regroupement, reflexe, glouton, glouton_aveugle, glouton_immobile, mc, mc_immobile. Méchant : hasard.

## Les meilleures variantes (score = la note la plus faible)

| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |
|---|---|---|---|---|---|---|---|---|---|---|
| largeur=6 | 6x5 | 1.00 | 55.3 | 28.4 | 8.6 | 9.6 | 5.9 | 6.6 | 19 | – |
| hauteur=6 | 5x6 | 1.00 | 56.4 | 25.7 | 8.5 | 5.9 | 5.7 | 6.8 | 22 | – |
| tours=10 | tours=10 | 1.00 | 57.2 | 25.0 | 8.3 | 9.2 | 7.4 | 5.8 | 27 | – |
| portee=2 | portee=2 | 1.00 | 60.9 | 22.5 | 7.6 | 8.7 | 5.2 | 6.0 | 20 | – |
| profil="bosquets" | profil=bosquets | 1.00 | 59.4 | 28.0 | 6.5 | 9.2 | 9.5 | 5.3 | 24 | – |
| entree="bords" | entree=bords | 1.00 | 55.2 | 26.8 | 9.6 | 7.0 | 8.2 | 4.7 | 18 | – |
| annonces=3 | annonces=3 | 1.00 | 62.5 | 33.1 | 11.2 | 11.6 | 5.9 | 4.4 | 8 | – |
| annonces=4 | annonces=4 | 1.00 | 59.9 | 30.5 | 7.9 | 6.5 | 6.0 | 7.7 | 16 | – |
| annonces=6 | annonces=6 | 1.00 | 59.2 | 29.3 | 8.2 | 9.8 | 7.2 | 4.2 | 22 | – |
| annonces=7 | annonces=7 | 1.00 | 53.9 | 22.7 | 6.6 | 7.2 | 5.5 | 4.2 | 30 | – |
| tactiques={"cupidite":1,"percee":2,"opportunisme":1,"represailles":1} | tactiques=cup1,opp1,per2,rep1 | 1.00 | 57.4 | 23.4 | 5.9 | 8.2 | 7.8 | 4.8 | 21 | – |
| tactiques={"percee":1,"opportunisme":1,"represailles":1} | tactiques=opp1,per1,rep1 | 0.93 | 55.6 | 23.4 | 7.3 | 7.0 | 8.6 | 3.8 | 23 | – |
| hauteur=4 | 5x4 | 0.92 | 61.5 | 28.0 | 9.0 | 8.2 | 4.7 | 6.6 | 24 | – |
| individus=2 | individus=2 | 0.92 | 53.9 | 23.0 | 7.3 | 4.7 | 6.1 | 6.0 | 21 | – |
| individus=4 | individus=4 | 0.88 | 64.1 | 34.4 | 6.1 | 7.4 | 4.8 | 3.6 | 20 | – |

## Bandes sur l'ensemble des variantes

| Mesure | vert | orange | rouge |
|---|---|---|---|
| lecture | 37 | 1 | 0 |
| profondeur | 34 | 4 | 0 |
| info | 31 | 6 | 1 |
| placement | 24 | 11 | 3 |
| maitrise | 25 | 10 | 3 |
| difficulte | 37 | 1 | 0 |

## Effet des paramètres (moyenne par niveau)

**aller_garder**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| false | 37 | 0.69 | 58.5 | 25.7 | 7.4 | 8.2 | 5.7 |
| true | 1 | 0.00 | 72.5 | 42.3 | 16.3 | 14.5 | 22.1 |

**annonces**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 0.00 | 45.4 | 16.0 | 3.0 | – | 3.3 |
| 3 | 1 | 1.00 | 62.5 | 33.1 | 11.2 | 11.6 | 5.9 |
| 4 | 1 | 1.00 | 59.9 | 30.5 | 7.9 | 6.5 | 6.0 |
| 5 | 33 | 0.66 | 59.2 | 26.2 | 7.7 | 8.3 | 6.2 |
| 6 | 1 | 1.00 | 59.2 | 29.3 | 8.2 | 9.8 | 7.2 |
| 7 | 1 | 1.00 | 53.9 | 22.7 | 6.6 | 7.2 | 5.5 |

**arbres**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 1 | 0.40 | 59.6 | 29.4 | 7.7 | 6.9 | 2.6 |
| 3 | 36 | 0.68 | 58.8 | 26.0 | 7.7 | 8.4 | 6.3 |
| 4 | 1 | 0.82 | 59.4 | 27.9 | 7.2 | 8.1 | 4.3 |

**entree**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "bords" | 1 | 1.00 | 55.2 | 26.8 | 9.6 | 7.0 | 8.2 |
| "front" | 37 | 0.67 | 58.9 | 26.2 | 7.6 | 8.4 | 6.1 |

**garde_portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 37 | 0.69 | 58.3 | 26.6 | 7.3 | 8.4 | 6.3 |
| 1 | 1 | 0.00 | 79.2 | 11.3 | 19.5 | 4.3 | 0.7 |

**hauteur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 1 | 0.92 | 61.5 | 28.0 | 9.0 | 8.2 | 4.7 |
| 5 | 36 | 0.66 | 58.8 | 26.1 | 7.6 | 8.4 | 6.2 |
| 6 | 1 | 1.00 | 56.4 | 25.7 | 8.5 | 5.9 | 5.7 |

**individus**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 1 | 0.92 | 53.9 | 23.0 | 7.3 | 4.7 | 6.1 |
| 3 | 36 | 0.66 | 58.8 | 26.0 | 7.7 | 8.5 | 6.2 |
| 4 | 1 | 0.88 | 64.1 | 34.4 | 6.1 | 7.4 | 4.8 |

**k**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 0.71 | 70.8 | 37.2 | 6.2 | 15.6 | 4.4 |
| 2 | 37 | 0.68 | 58.5 | 25.9 | 7.7 | 8.1 | 6.2 |

**largeur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 1 | 0.40 | 57.0 | 27.7 | 7.0 | 11.8 | 9.9 |
| 5 | 36 | 0.68 | 59.0 | 26.1 | 7.6 | 8.2 | 6.0 |
| 6 | 1 | 1.00 | 55.3 | 28.4 | 8.6 | 9.6 | 5.9 |

**machines**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 1 | 0.63 | 53.6 | 28.5 | 7.0 | 3.5 | 5.5 |
| 3 | 36 | 0.70 | 59.0 | 26.1 | 7.8 | 8.3 | 6.1 |
| 4 | 1 | 0.00 | 60.0 | 28.4 | 4.9 | 15.8 | 7.6 |

**n**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 37 | 0.68 | 58.8 | 26.1 | 7.7 | 8.3 | 6.1 |
| 4 | 1 | 0.45 | 58.7 | 30.2 | 5.7 | 10.2 | 6.6 |

**portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 37 | 0.67 | 58.8 | 26.3 | 7.7 | 8.3 | 6.1 |
| 2 | 1 | 1.00 | 60.9 | 22.5 | 7.6 | 8.7 | 5.2 |

**profil**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "bosquets" | 1 | 1.00 | 59.4 | 28.0 | 6.5 | 9.2 | 9.5 |
| "coeur" | 1 | 0.67 | 59.9 | 7.7 | 9.0 | 11.3 | 13.0 |
| "uniforme" | 36 | 0.67 | 58.8 | 26.6 | 7.7 | 8.2 | 5.8 |

**sabotage**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "allie" | 1 | 0.66 | 43.0 | 12.8 | 5.2 | 3.6 | 5.7 |
| "aucun" | 1 | 0.66 | 44.5 | 14.3 | 6.8 | 3.6 | 5.7 |
| "echappe" | 35 | 0.70 | 59.4 | 26.9 | 7.7 | 8.6 | 6.3 |
| "fige" | 1 | 0.00 | 68.6 | 27.1 | 8.5 | 9.1 | 0.5 |

**tactiques**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| {"cupidite": 1, "opportunisme": 1, "percee": 1, "represailles": 1} | 30 | 0.66 | 59.1 | 26.0 | 7.9 | 8.5 | 6.2 |
| {"cupidite": 1, "opportunisme": 1, "percee": 1, "represailles": 2} | 1 | 0.82 | 65.1 | 28.8 | 6.2 | 7.2 | 4.3 |
| {"cupidite": 1, "opportunisme": 1, "percee": 1} | 1 | 0.86 | 49.7 | 28.3 | 7.9 | 4.4 | 9.4 |
| {"cupidite": 1, "opportunisme": 1, "percee": 2, "represailles": 1} | 1 | 1.00 | 57.4 | 23.4 | 5.9 | 8.2 | 7.8 |
| {"cupidite": 1, "opportunisme": 1, "represailles": 1} | 1 | 0.00 | 58.3 | 28.4 | 6.1 | 9.2 | 0.9 |
| {"cupidite": 1, "opportunisme": 2, "percee": 1, "represailles": 1} | 1 | 0.63 | 49.9 | 24.3 | 3.5 | 7.4 | 5.2 |
| {"cupidite": 1, "percee": 1, "represailles": 1} | 1 | 0.75 | 66.9 | 29.0 | 10.4 | 9.5 | 5.3 |
| {"cupidite": 2, "opportunisme": 1, "percee": 1, "represailles": 1} | 1 | 0.80 | 59.0 | 30.1 | 6.8 | 10.3 | 4.8 |
| {"opportunisme": 1, "percee": 1, "represailles": 1} | 1 | 0.93 | 55.6 | 23.4 | 7.3 | 7.0 | 8.6 |

**tours**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 1 | 1.00 | 57.2 | 25.0 | 8.3 | 9.2 | 7.4 |
| 6 | 1 | 0.44 | 61.5 | 29.7 | 7.3 | 8.3 | 2.8 |
| 8 | 36 | 0.67 | 58.8 | 26.1 | 7.6 | 8.3 | 6.2 |

**voisinage**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 37 | 0.68 | 58.8 | 26.3 | 7.8 | 8.4 | 6.1 |
| 8 | 1 | 0.50 | 61.7 | 22.4 | 3.0 | 5.2 | 4.9 |
