# Le rêve disputé : la problématique et des pistes de conception

*14 oct. 2026, 21 h 30. Rédigé par Claude à la demande de l'auteur, après la grille de réglage (campagne 31, [bilan](../../archive/conception-v0x/bilans/essai-reve-dispute.md)). **Document de travail pour la recherche commune** : aucune règle n'est changée ni codée. Les pistes sont des propositions soumises à l'auteur.*

*Suite (14 oct., 22 h 55) : l'auteur retient la piste 1, puis la piste 1 avec la piste 4, et donne son accord pour coder les variantes d'essai. Codé le 14 oct., 23 h : règles `somnambule`, `somnambule_apprend` et `presages`, campagne `archive/moteur-foret/campagnes/reve_somnambule.json`. Choix de modélisation de Claude : la tuile dépassée s'exécute après les barrages et sabotages de l'étape, avec le favori (case 1 de la piste des Machines) ; elle n'apprend que dans la variante « qui apprend » ; le sommeil attend l'exécution de la dernière tuile dépassée.*

## 1. La problématique en une phrase
**Le rêve n'a pas d'adversaire au moment où il se joue.** Le meilleur plan est donc un horaire : défendre d'abord, puis rêver en rafale à la fin. Cet horaire ne dépend pas de ce que la table voit, et un choix qui ne dépend pas de la situation n'est pas un dilemme.

## 2. Ce que montrent les mesures
| Constat | Chiffre | Source |
|---|---|---|
| Le cauchemar se déclenche (tactique du côté du rêve qui réussit) | environ 1,2 fois par partie | campagne 31, réglage d'origine, bot libre |
| … mais il n'a aucun effet | 9 fois sur 10 (1,09 sans effet, 0,12 recul) | idem |
| Pourquoi sans effet, dans les parties du bot fort | aucun esprit encore sur la piste : 61 % ; esprit en 12, qui ne peut pas reculer : 22 % ; esprit bloqué par un autre : 7 % ; recul possible : 11 % | 20 parties locales, MC 32, 2 et 3 joueurs, v0.4rd (46 déclenchements) : indice |
| Avec un bot faible (glouton), le cauchemar agit | 1,0 recul par partie | 240 parties locales, glouton à un rêve par tour |

**Lecture.** Le bot faible rêve tôt et régulièrement : ses esprits restent longtemps sur la piste, et le cauchemar les frappe. Le bot fort défend d'abord et rêve tard, d'un coup. Quand une tactique du côté du rêve réussit, la piste est le plus souvent encore vide. **Le joueur fort a trouvé comment esquiver la riposte, et cela ne lui coûte rien.**

## 3. Un exemple (simplifié, à trois joueurs, réglage d'origine)
- **Tours 1 et 2.** Les trois joueurs défendent. Les dés tombent deux fois du côté du rêve, sur Représailles en 9 puis Percée en 10. Une des deux réussit, mais il n'y a aucun esprit à repousser : le cauchemar ne fait rien.
- **Tour 3.** Les trois lunes partent en rêve. Un esprit entre en 12, puis avance en 11, puis en 10. Trois cartes quittent la main, à un moment où il ne reste que trois tours à défendre.
- **Tour 4.** Encore trois rêves : l'esprit passe en 9, en 8, puis en 7. C'est le long sommeil, avant même la fin du tour.
- **Bilan.** L'esprit n'a été exposé que pendant 4 ou 5 ordres. Pour qu'il recule, il aurait fallu que les dés tombent sur une tactique du côté du rêve (environ 1 fois sur 3), qu'elle réussisse malgré la défense (1 fois sur 2 ou 3), et qu'il puisse reculer. Même dans ce cas, un rêve suffit à rattraper le recul.

Rien dans cet exemple n'a dépendu de la position des Machines, du présage ou des zones menacées. **Seul le tour comptait.** C'est la signature d'un horaire.

Avec le sablier (deux rêves pour un pas), il faut 12 rêves au lieu de 6. La rafale ne tient plus dans la limite des lunes, et rêver ne mène plus à rien : c'est le régime « indifférent » de la grille. Le sablier change la vitesse de la course, il ne crée pas d'adversaire.

## 4. Les trois causes à traiter
1. **La rafale.** Six rêves suffisent, et la table peut en faire trois par tour. L'esprit n'est exposé qu'un tour ou deux.
2. **La riposte est conditionnelle.** Elle exige à la fois des dés côté rêve, une défense qui échoue et un esprit qui peut reculer. Une bonne défense protège donc aussi le rêve : défendre et rêver s'additionnent au lieu de s'opposer.
3. **Le coût d'un rêve ne dépend que du tour.** Une carte vaut le nombre de tours qui restent à défendre, et rien d'autre. Les cartes d'un même peuple sont identiques, et leurs effets propres sont une idée verrouillée (B5).

Pour qu'il y ait dispute, la riposte doit **frapper à chaque rêve**, et son poids doit **se lire sur le plateau avant de choisir**. Un réglage ne peut pas obtenir cela, il faut un mécanisme (principe 3 de [choix-strategique.md](../3-pilotage/choix-strategique.md)).

## 5. Pistes de conception
| Piste | La règle (une phrase) | Cause traitée | Ce qui se lit avant de choisir | Risques |
|---|---|---|---|---|
| **1. Le somnambule** | Quand un esprit avance, la tuile qu'il dépasse s'exécute aussitôt : le Méchant agit dans son sommeil. | 1, 2, 3 | la tuile devant chaque esprit et la zone qu'elle viserait | plus d'abattage ; rêver peut devenir trop cher |
| **2. Le rêve prend racine** | Un esprit avance d'une case au plus par tour. | 1 | la position des esprits | redevient un horaire (« rêver dès le tour 1 ») si la riposte reste rare ; à combiner avec 1 ou 3 |
| **3. Le Méchant se retourne dans son sommeil** | Dès que les dés désignent une tactique du côté du rêve, réussie ou non, l'esprit de tête recule. | 2 | le présage | moins lisible au-delà de la première étape ; un frein qui reste en partie aléatoire |
| **4. Plus de présages** | Les dés des deux premières étapes (ou des trois) sont connus au conseil. | 3 | où frapperont les ordres | moins de surprise ; temps de réflexion |
| **5. La balance** | Une jauge à la place de la course : chaque rêve la pousse vers le sommeil, chaque ordre réussi la tire vers l'éveil. | 1, 2 | quels ordres ma carte peut empêcher | touche des invariants (piste des esprits, oubli en 12) : décision de l'auteur |

**Piste 1, détail.** Elle retourne le défaut de géométrie en moteur du jeu. Les tactiques fortes montent vers le 7, devant l'esprit. En dormant, le Méchant les exécute justement là. Plus l'esprit s'approche du sommeil, plus ce qu'il libère est dangereux, et la rafale finale devient la phase la plus risquée au lieu d'être la plus sûre. Le choix devient lisible :
- **rêver vaut** quand la tuile devant l'esprit vise une zone déjà barrée, défendue ou sans forêt ;
- **défendre vaut** quand elle frapperait une zone ouverte ;
- **la coordination naît d'elle-même** : un joueur barre la cible, un autre rêve (objectif 3).

Les invariants sont tenus : défendre ou rêver, piste publique, oubli en 12, lunes, trois fins.

**Piste 4, détail.** Le seul usage du rêve qui dépende déjà de la situation, c'est rêver sur le présage pour annuler un ordre hors de portée. Il est mesuré à 0,25 fois par partie. Avec plus de présages, ce coup devient un choix de chaque tour. La piste 4 se combine bien avec la piste 1.

## 6. Comment trancher sans coder trop tôt
1. **Remplir la fiche du choix** pour chaque piste retenue par l'auteur : options, indices qui tranchent, situations où chacune gagne, règle du débutant et jeu de l'initié.
2. **Test T1 (fréquence)**, en local au glouton : la riposte frappe-t-elle à chaque rêve, et combien de forêt coûte-t-elle ?
3. **Test T3 complet** au bot fort, sur GitHub, comme pour la grille : gain du jugement sûr et d'au moins 5 points.

**Recommandation de Claude** : tester d'abord la piste 1 seule, puis la piste 1 avec la piste 4. Garder la piste 5 en réserve si les deux échouent : c'est la plus radicale.
