# Campagne placement_kit

119 variantes, 64 parties par bot et par variante (graines appariées). Bots : sentinelle, marquage, regroupement, reflexe, glouton, glouton_aveugle, glouton_immobile, mc, mc_immobile. Méchant : hasard.

## Les meilleures variantes (score = la note la plus faible)

| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |
|---|---|---|---|---|---|---|---|---|---|---|
| reference_grille_m=n | annonces=3 | 1.00 | 63.6 | 32.6 | 7.9 | 11.3 | 6.0 | 9.2 | 7 | – |
| J2_M+1_q1_t3x3_i2 | individus=4 annonces=3 | 1.00 | 59.6 | 26.4 | 6.3 | 6.9 | 19.8 | 7.9 | 10 | – |
| J2_M+1_q1_t3x3_i3 | individus=6 annonces=3 | 1.00 | 65.4 | 32.6 | 7.5 | 6.8 | 17.4 | 8.0 | 9 | – |
| J2_M+1_q1_t3x4_i2 | individus=4 annonces=3 | 1.00 | 54.5 | 22.9 | 7.2 | 5.3 | 18.7 | 10.0 | 10 | – |
| J2_M+1_q2_t3x3_i2 | individus=4 n=6 annonces=6 | 1.00 | 63.6 | 35.2 | 15.1 | 5.4 | 9.0 | 5.4 | 15 | – |
| J2_M+2_q1_t3x3_i2 | machines=4 individus=4 n=4 annonces=4 | 1.00 | 65.7 | 24.5 | 5.8 | 11.8 | 19.5 | 5.7 | 7 | – |
| J2_M+2_q1_t3x3_i3 | machines=4 individus=6 n=4 annonces=4 | 1.00 | 67.5 | 26.1 | 7.7 | 13.0 | 19.6 | 4.2 | 7 | – |
| J2_M+2_q1_t3x4_i2 | machines=4 individus=4 n=4 annonces=4 | 1.00 | 58.0 | 23.8 | 5.2 | 9.5 | 22.3 | 5.0 | 10 | – |
| J2_M+2_q1_t3x4_i3 | machines=4 individus=6 n=4 annonces=4 | 1.00 | 61.3 | 26.3 | 6.2 | 9.7 | 21.1 | 6.2 | 9 | – |
| J2_M+2_q1_t4x4_i2 | machines=4 individus=4 n=4 annonces=4 | 1.00 | 56.1 | 27.6 | 7.1 | 7.9 | 22.6 | 7.5 | 8 | – |
| J2_M+2_q1_t4x4_i3 | machines=4 individus=6 n=4 annonces=4 | 1.00 | 59.3 | 28.4 | 8.5 | 7.9 | 22.3 | 4.9 | 11 | – |
| J2_M+2_q2_t4x4_i3 | machines=4 individus=6 n=8 annonces=8 | 1.00 | 55.6 | 40.2 | 14.0 | 5.6 | 11.8 | 4.5 | 14 | – |
| J3_M+1_q1_t3x3_i2 | machines=4 individus=6 n=4 k=3 annonces=4 | 1.00 | 59.1 | 27.4 | 5.9 | 8.3 | 18.3 | 7.2 | 8 | – |
| J3_M+1_q1_t3x3_i3 | machines=4 individus=9 n=4 k=3 annonces=4 | 1.00 | 61.9 | 30.3 | 6.8 | 7.8 | 16.0 | 6.2 | 9 | – |
| J3_M+2_q1_t3x3_i2 | machines=5 individus=6 n=5 k=3 | 1.00 | 61.4 | 29.4 | 6.6 | 9.2 | 20.1 | 5.3 | 7 | – |

## Bandes sur l'ensemble des variantes

| Mesure | vert | orange | rouge |
|---|---|---|---|
| lecture | 119 | 0 | 0 |
| profondeur | 82 | 37 | 0 |
| info | 56 | 60 | 3 |
| placement | 117 | 2 | 0 |
| maitrise | 70 | 46 | 3 |
| difficulte | 119 | 0 | 0 |

## Effet des paramètres (moyenne par niveau)

**annonces**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 12 | 0.39 | 52.7 | 34.7 | 11.2 | 4.1 | 9.8 |
| 12 | 12 | 0.37 | 51.2 | 34.5 | 11.0 | 3.8 | 10.0 |
| 14 | 12 | 0.23 | 49.4 | 34.0 | 9.9 | 3.8 | 10.1 |
| 16 | 6 | 0.39 | 49.8 | 33.8 | 10.5 | 3.7 | 9.8 |
| 3 | 7 | 0.80 | 59.8 | 28.3 | 7.3 | 5.7 | 16.2 |
| 4 | 12 | 0.95 | 58.6 | 26.3 | 6.1 | 7.8 | 19.5 |
| 5 | 12 | 0.73 | 56.0 | 29.8 | 4.5 | 6.1 | 18.5 |
| 6 | 18 | 0.63 | 55.0 | 32.0 | 7.1 | 5.2 | 15.6 |
| 7 | 12 | 0.50 | 53.3 | 33.2 | 3.0 | 5.2 | 17.1 |
| 8 | 16 | 0.39 | 53.7 | 35.3 | 8.8 | 4.9 | 13.6 |

**individus**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 12 | 0.44 | 50.5 | 31.2 | 6.6 | 4.7 | 14.6 |
| 12 | 24 | 0.47 | 52.0 | 33.2 | 7.0 | 4.5 | 13.5 |
| 15 | 12 | 0.42 | 53.4 | 34.3 | 7.2 | 4.8 | 13.6 |
| 18 | 12 | 0.39 | 52.4 | 36.1 | 6.7 | 4.2 | 12.6 |
| 3 | 1 | 1.00 | 63.6 | 32.6 | 7.9 | 11.3 | 6.0 |
| 4 | 11 | 0.82 | 56.5 | 29.3 | 9.3 | 6.1 | 16.7 |
| 6 | 23 | 0.62 | 57.0 | 31.4 | 9.4 | 5.5 | 15.1 |
| 8 | 12 | 0.51 | 51.2 | 30.4 | 6.5 | 4.9 | 14.8 |
| 9 | 12 | 0.55 | 57.3 | 32.8 | 9.3 | 5.6 | 13.7 |

**joueurs**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 1.00 | 63.6 | 32.6 | 7.9 | 11.3 | 6.0 |
| 2 | 22 | 0.75 | 58.6 | 30.9 | 10.2 | 6.2 | 15.9 |
| 3 | 24 | 0.56 | 55.5 | 31.5 | 8.6 | 5.2 | 14.4 |
| 4 | 24 | 0.56 | 53.2 | 32.2 | 7.4 | 4.9 | 14.0 |
| 5 | 24 | 0.43 | 51.9 | 32.8 | 6.9 | 4.8 | 14.1 |
| 6 | 24 | 0.36 | 50.6 | 34.2 | 6.2 | 4.2 | 13.1 |

**k**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 2 | 23 | 0.76 | 58.8 | 31.0 | 10.1 | 6.4 | 15.5 |
| 3 | 24 | 0.56 | 55.5 | 31.5 | 8.6 | 5.2 | 14.4 |
| 4 | 24 | 0.56 | 53.2 | 32.2 | 7.4 | 4.9 | 14.0 |
| 5 | 24 | 0.43 | 51.9 | 32.8 | 6.9 | 4.8 | 14.1 |
| 6 | 24 | 0.36 | 50.6 | 34.2 | 6.2 | 4.2 | 13.1 |

**machines**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 13 | 0.66 | 57.9 | 31.2 | 10.2 | 4.7 | 13.6 |
| 4 | 22 | 0.71 | 56.5 | 30.5 | 9.0 | 6.5 | 16.0 |
| 5 | 24 | 0.56 | 54.3 | 32.2 | 7.8 | 5.1 | 14.1 |
| 6 | 24 | 0.53 | 52.9 | 32.6 | 7.4 | 5.0 | 14.1 |
| 7 | 24 | 0.37 | 51.3 | 33.6 | 6.4 | 4.5 | 13.6 |
| 8 | 12 | 0.37 | 51.6 | 34.3 | 6.5 | 4.4 | 13.1 |

**menaces_par_machine**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 1.00 | 63.6 | 32.6 | 7.9 | 11.3 | 6.0 |
| 1 | 60 | 0.69 | 55.7 | 30.3 | 4.5 | 6.0 | 18.1 |
| 2 | 58 | 0.37 | 51.9 | 34.5 | 11.3 | 4.0 | 10.3 |

**n**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 12 | 0.39 | 52.7 | 34.7 | 11.2 | 4.1 | 9.8 |
| 12 | 12 | 0.37 | 51.2 | 34.5 | 11.0 | 3.8 | 10.0 |
| 14 | 12 | 0.23 | 49.4 | 34.0 | 9.9 | 3.8 | 10.1 |
| 16 | 6 | 0.39 | 49.8 | 33.8 | 10.5 | 3.7 | 9.8 |
| 3 | 7 | 0.80 | 59.8 | 28.3 | 7.3 | 5.7 | 16.2 |
| 4 | 12 | 0.95 | 58.6 | 26.3 | 6.1 | 7.8 | 19.5 |
| 5 | 12 | 0.73 | 56.0 | 29.8 | 4.5 | 6.1 | 18.5 |
| 6 | 18 | 0.63 | 55.0 | 32.0 | 7.1 | 5.2 | 15.6 |
| 7 | 12 | 0.50 | 53.3 | 33.2 | 3.0 | 5.2 | 17.1 |
| 8 | 16 | 0.39 | 53.7 | 35.3 | 8.8 | 4.9 | 13.6 |

**plateau**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "couronne" | 118 | 0.53 | 53.9 | 32.4 | 7.8 | 5.0 | 14.3 |
| "grille" | 1 | 1.00 | 63.6 | 32.6 | 7.9 | 11.3 | 6.0 |

**tuile_l**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 79 | 0.59 | 56.2 | 33.0 | 8.1 | 5.9 | 14.0 |
| 4 | 40 | 0.43 | 49.5 | 31.1 | 7.2 | 3.5 | 14.7 |

**tuile_p**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 38 | 0.62 | 60.9 | 34.3 | 8.9 | 6.8 | 12.6 |
| 4 | 81 | 0.49 | 50.7 | 31.4 | 7.3 | 4.3 | 14.9 |
