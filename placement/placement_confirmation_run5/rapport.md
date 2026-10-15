# Campagne placement_confirmation

8 variantes, 160 parties par bot et par variante (graines appariées). Bots : sentinelle, marquage, regroupement, reflexe, glouton, glouton_aveugle, glouton_immobile, mc, mc_immobile. Méchant : hasard.

## Les meilleures variantes (score = la note la plus faible)

| Variante | Ce qui change | Score | Taux fort | Lecture | Profondeur | Info | Placement | Maîtrise | Investit | Incertitude |
|---|---|---|---|---|---|---|---|---|---|---|
| base | (base) | 1.00 | 59.1 | 29.8 | 6.4 | 10.5 | 7.3 | 4.3 | 20 | – |
| 6x5 | 6x5 | 1.00 | 55.9 | 27.1 | 7.8 | 8.9 | 7.7 | 4.9 | 19 | – |
| 5x6 | 5x6 | 1.00 | 56.1 | 28.9 | 6.8 | 8.6 | 6.8 | 5.2 | 19 | – |
| tours=10 | tours=10 | 1.00 | 57.1 | 28.1 | 6.2 | 10.0 | 8.8 | 4.9 | 20 | – |
| annonces=3 | annonces=3 | 1.00 | 64.7 | 36.3 | 8.6 | 10.1 | 5.7 | 8.9 | 6 | – |
| bosquets | profil=bosquets | 1.00 | 58.5 | 27.6 | 5.7 | 10.1 | 9.9 | 4.5 | 21 | – |
| portee=2 | portee=2 | 1.00 | 61.8 | 23.2 | 5.7 | 10.6 | 7.8 | 6.4 | 23 | – |
| annonces=4 | annonces=4 | 0.79 | 59.8 | 29.9 | 6.8 | 10.9 | 7.7 | 3.4 | 18 | – |

## Taux de parade par bot (points)

| Variante | sentinelle | marquage | regroupement | reflexe | glouton | glouton_aveugle | glouton_immobile | mc | mc_immobile |
|---|---|---|---|---|---|---|---|---|---|
| base | 29.2 | 28.3 | 27.0 | 52.7 | 54.8 | 44.3 | 47.5 | 59.1 | 55.2 |
| 6x5 | 25.2 | 28.8 | 22.9 | 48.0 | 51.0 | 42.1 | 43.2 | 55.9 | 52.0 |
| 5x6 | 26.7 | 27.1 | 27.2 | 49.2 | 50.9 | 42.3 | 44.1 | 56.1 | 52.4 |
| tours=10 | 27.1 | 28.0 | 29.0 | 50.8 | 52.2 | 42.2 | 43.3 | 57.1 | 53.4 |
| annonces=3 | 28.4 | 28.3 | 27.9 | 56.2 | 55.8 | 45.7 | 50.1 | 64.7 | 61.5 |
| bosquets | 25.9 | 30.9 | 24.3 | 52.7 | 54.0 | 43.9 | 44.1 | 58.5 | 55.8 |
| portee=2 | 29.2 | 31.2 | 38.6 | 56.1 | 55.3 | 44.7 | 47.5 | 61.8 | 59.4 |
| annonces=4 | 29.9 | 28.2 | 26.6 | 52.9 | 56.4 | 45.5 | 48.7 | 59.8 | 56.8 |

## Bandes sur l'ensemble des variantes

| Mesure | vert | orange | rouge |
|---|---|---|---|
| lecture | 8 | 0 | 0 |
| profondeur | 8 | 0 | 0 |
| info | 8 | 0 | 0 |
| placement | 8 | 0 | 0 |
| maitrise | 7 | 1 | 0 |
| difficulte | 8 | 0 | 0 |

## Effet des paramètres (moyenne par niveau)

**annonces**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 3 | 1 | 1.00 | 64.7 | 36.3 | 8.6 | 10.1 | 5.7 |
| 4 | 1 | 0.79 | 59.8 | 29.9 | 6.8 | 10.9 | 7.7 |
| 5 | 6 | 1.00 | 58.0 | 27.5 | 6.5 | 9.8 | 8.1 |

**hauteur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 5 | 7 | 0.97 | 59.5 | 28.9 | 6.8 | 10.1 | 7.9 |
| 6 | 1 | 1.00 | 56.1 | 28.9 | 6.8 | 8.6 | 6.8 |

**largeur**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 5 | 7 | 0.97 | 59.6 | 29.1 | 6.6 | 10.1 | 7.7 |
| 6 | 1 | 1.00 | 55.9 | 27.1 | 7.8 | 8.9 | 7.7 |

**portee**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 1 | 7 | 0.97 | 58.7 | 29.7 | 6.9 | 9.9 | 7.7 |
| 2 | 1 | 1.00 | 61.8 | 23.2 | 5.7 | 10.6 | 7.8 |

**profil**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| "bosquets" | 1 | 1.00 | 58.5 | 27.6 | 5.7 | 10.1 | 9.9 |
| "uniforme" | 7 | 0.97 | 59.2 | 29.0 | 6.9 | 9.9 | 7.4 |

**tours**

| niveau | n | score | taux fort | lecture | profondeur | info | placement |
|---|---|---|---|---|---|---|---|
| 10 | 1 | 1.00 | 57.1 | 28.1 | 6.2 | 10.0 | 8.8 |
| 8 | 7 | 0.97 | 59.4 | 29.0 | 6.8 | 9.9 | 7.6 |
