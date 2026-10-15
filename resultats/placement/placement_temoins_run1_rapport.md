# Campagne placement_temoins

5 variantes, 40 parties par bot et par variante (graines appariées). Bots : aleatoire, sentinelle, marquage, regroupement, reflexe, glouton, glouton_aveugle, glouton_immobile, oracle, mc. Méchant : hasard.

## Les meilleures variantes (score = la note la plus faible)

| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |
|---|---|---|---|---|---|---|---|---|---|---|
| base | (base) | 1.00 | 57.3 | 27.5 | 8.8 | 7.0 | 6.1 | 5.0 | 19 | -1.7 |
| temoin_boucle_gagnante | 3x3 voisinage=8 garde_portee=1 | 0.00 | 98.9 | -0.3 | 15.0 | 0.0 | 0.0 | -0.3 | 8 | -0.2 |
| temoin_annonce_inutile | annonces=0 | 0.00 | 48.0 | 17.3 | 3.3 | – | 2.2 | 2.8 | 44 | 10.6 |
| temoin_teleportation | portee=8 aller_garder=True | 0.00 | 79.5 | 37.7 | 10.0 | 18.4 | 34.2 | -0.9 | 21 | 8.3 |
| temoin_resolu | annonces=3 portee=8 aller_garder=True garde_portee=1 | 0.00 | 99.8 | 29.2 | 11.4 | 5.3 | 21.4 | 0.2 | 1 | -0.8 |

## Taux de parade par bot (points)

| Variante | aleatoire | sentinelle | marquage | regroupement | reflexe | glouton | glouton_aveugle | glouton_immobile | oracle | mc |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 5.5 | 25.2 | 29.8 | 28.3 | 48.6 | 52.3 | 45.3 | 46.2 | 50.6 | 57.3 |
| temoin_boucle_gagnante | 20.2 | 99.2 | 33.1 | 93.8 | 83.9 | 99.2 | 99.2 | 99.2 | 99.1 | 98.9 |
| temoin_annonce_inutile | 5.5 | 28.4 | 30.6 | 28.1 | 44.7 | 45.2 | 45.2 | 43.0 | 55.8 | 48.0 |
| temoin_teleportation | 9.7 | 25.2 | 32.8 | 41.9 | 69.5 | 80.5 | 62.0 | 46.2 | 88.8 | 79.5 |
| temoin_resolu | 20.6 | 68.1 | 31.9 | 70.6 | 88.4 | 99.7 | 94.4 | 78.3 | 98.9 | 99.8 |

## Bandes sur l'ensemble des variantes

| Mesure | vert | orange | rouge |
|---|---|---|---|
| lecture | 4 | 0 | 1 |
| profondeur | 4 | 1 | 0 |
| info | 3 | 0 | 2 |
| placement | 3 | 1 | 1 |
| maitrise | 1 | 1 | 3 |
| difficulte | 2 | 1 | 2 |

## Effet des paramètres (moyenne par niveau)

**aller_garder**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| false | 3 | 0.33 | 68.1 | 14.8 | 9.0 | 3.5 | 2.8 |
| true | 2 | 0.00 | 89.7 | 33.4 | 10.7 | 11.9 | 27.8 |

**annonces**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 0.00 | 48.0 | 17.3 | 3.3 | – | 2.2 |
| 3 | 1 | 0.00 | 99.8 | 29.2 | 11.4 | 5.3 | 21.4 |
| 5 | 3 | 0.33 | 78.6 | 21.6 | 11.2 | 8.5 | 13.4 |

**garde_portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 3 | 0.33 | 61.6 | 27.5 | 7.3 | 12.7 | 14.2 |
| 1 | 2 | 0.00 | 99.4 | 14.5 | 13.2 | 2.7 | 10.7 |

**hauteur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 1 | 0.00 | 98.9 | -0.3 | 15.0 | 0.0 | 0.0 |
| 5 | 4 | 0.25 | 71.2 | 27.9 | 8.4 | 10.3 | 16.0 |

**largeur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 1 | 0.00 | 98.9 | -0.3 | 15.0 | 0.0 | 0.0 |
| 5 | 4 | 0.25 | 71.2 | 27.9 | 8.4 | 10.3 | 16.0 |

**portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 0.33 | 68.1 | 14.8 | 9.0 | 3.5 | 2.8 |
| 8 | 2 | 0.00 | 89.7 | 33.4 | 10.7 | 11.9 | 27.8 |

**voisinage**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 4 | 4 | 0.25 | 71.2 | 27.9 | 8.4 | 10.3 | 16.0 |
| 8 | 1 | 0.00 | 98.9 | -0.3 | 15.0 | 0.0 | 0.0 |
