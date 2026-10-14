# Proposition de conception : le rêve disputé

*14 oct. 2026, 14 h. Rédigée par Claude à la demande de l'auteur (alerte E, protocole P3). **Proposition seulement** : rien n'est codé ni adopté. Les deux changements de règle reviennent à l'auteur. Les chiffres viennent des campagnes 19 (V0.4) et 20 (V0.3) ; ce sont des indices.*

## 1. Ce que doit être le dilemme (rappel de l'auteur, 14 oct.)
Défendre ou rêver n'est un choix stratégique que si **chacun des deux est le meilleur dans certaines situations**, et si le joueur peut lire laquelle il a devant lui. Un choix toujours meilleur, ou deux choix équivalents partout, tuent tous deux le dilemme.

La bonne mesure n'est donc pas la forêt à taux de rêve fixe (elle ne voit qu'une moyenne), mais le **gain du bot libre** : ce que gagne un joueur qui décide à chaque tour s'il rêve, par rapport au meilleur taux fixe. C'est la valeur de l'appréciation de la situation.

| | V0.3 | V0.4 |
|---|---|---|
| Gain du bot libre sur le meilleur taux fixe | +2,4 points (orange) | −1,3 point (rouge) |

**Dans les deux versions, juger la situation avant de rêver ne rapporte presque rien.** La V0.3 et la V0.4 ne sont pas deux réglages d'un bon dilemme : ce sont deux réglages d'un dilemme absent.

## 2. Pourquoi : le rêve est une course à part
Dans l'intention d'origine (« Le tir à la corde », noté 8), le rêve et l'apprentissage du Méchant **se disputent le centre de la piste** : une tactique qui réussit repousse un esprit. Les données montrent que cette dispute n'a presque jamais lieu.

| Par partie (bot fort MC64R) | V0.3 | V0.4 |
|---|---|---|
| Esprit repoussé par une tactique (tir à la corde) | 0,05 | 0,09 |
| Ordre annulé parce que les dés tombent sur un esprit | 0,5 | 0,9 |
| Rêves faits avec une carte | environ 4,8 | environ 1,8 |
| Fins par le sommeil ou le réveil | 72 % | 16 % |

**Pourquoi la dispute ne joue pas.** Une tactique ne repousse un esprit que si elle est juste derrière lui, du côté du bord. Or l'esprit entre en 12 et avance vers le 7 : derrière lui, il n'y a que les cases les moins probables (12, 11, 10) et les tactiques qui ont échoué. Les tactiques fortes, qui montent vers le 7, sont toujours *devant* l'esprit. La géométrie empêche la rencontre.

**Conséquence.** Le rêve avance sur une piste où rien ne lui résiste. Sa valeur ne dépend que d'une chose : la course contre la nuit (6 tours) est-elle gagnable ? C'est une question de réglage global, pas de situation. Les paramètres ne peuvent donc produire que deux régimes :
- **course trop courte** (V0.3) : rêver gagne toujours, la partie finit au tour 3 ou 4 ;
- **course trop longue** (V0.4, avec le sablier de deux rêves par pas) : rêver ne mène nulle part, la nuit tombe dans 84 % des parties.

Le sablier aggrave le défaut : c'est un **frein fixe**. Il ralentit le rêve de la même façon quelle que soit la situation, et il supprime le seul effet immédiat qu'avait un rêve.

## 3. La proposition : remplacer un frein fixe par un frein qui dépend de la situation
Un principe et deux changements de règle. Tout reste dans le vocabulaire du jeu : la piste, les esprits, l'apprentissage, le tir à la corde.

**Principe.** Le rêve se joue sur la piste, comme la défense se joue sur le plateau. Sa valeur se lit dans la tête du Méchant, comme celle de la défense se lit dans la position des Machines.

### Changement 1 : un rêve, un pas (retrait du sablier)
Chaque rêve fait entrer ou avancer un esprit tout de suite, comme dans la règle d'origine (R5.3, `reves_par_pas` = 1).

Ce que cela rend possible : **rêver sur le présage**. Les règles le permettent déjà (R2.6 : un rêve de la première étape est résolu avant que la tuile soit lue). Si les dés du présage désignent la case juste devant un esprit, un rêve à la première étape y amène l'esprit, et l'ordre est annulé. Le rêve devient alors la bonne réponse **précisément quand l'équipe ne peut pas atteindre la zone menacée**. Avec le sablier, il faut deux rêves pour un pas : le coup est impossible.

### Changement 2 : le cauchemar repousse le rêve (tir à la corde rendu réel)
> **Quand une tactique du côté du rêve (cases 8 à 12) réussit, l'esprit le plus avancé recule d'une case.**

Elle remplace la condition actuelle (« la tuile voisine »), qui ne joue presque jamais. Le côté éveil (2 à 6) et le centre ne repoussent rien : ce que le Méchant *calcule* ne touche pas ses rêves, ce qu'il *rêve* les combat.

Le cycle complet devient le suivant, et il relie enfin les trois façons d'agir (principe noté 8) :
1. **contrer** une tactique du côté du rêve protège les esprits, car elle ne réussit pas ;
2. une tactique qui échoue **dérive vers le 12** (R5.2, règle existante) ;
3. le prochain esprit qui entre en 12 **l'oublie** (R5.3, règle existante) ;
4. **désarmer** retire les Machines qui donnent aux tactiques leurs réussites.

La voie du réveil (le Cercle) ne change pas : rien ne la repousse. Elle devient la **valeur refuge**, plus lente que le sommeil quand le côté du rêve est calme, plus sûre quand il est hostile.

## 4. Pourquoi cela pose un vrai dilemme de situation
Chaque carte défend ou rêve ; elle ne fait pas les deux. Avec le cauchemar, ces deux choix ne se mesurent plus sur des pistes séparées, et la réponse dépend de ce qu'on voit.

| Ce que la table voit | Ce qui vaut le plus | Pourquoi |
|---|---|---|
| Côté du rêve calme (les tactiques fortes sont côté éveil), esprit à deux ou trois pas du 7 | **rêver**, voie du sommeil | le rêve tient, la fin est à portée |
| Tactique forte en 8 ou 9, prête à frapper | **contrer cette tactique** avant de rêver | sinon elle réussit et défait le rêve ; si elle échoue, elle dérive vers le 12 et sera oubliée |
| Présage sur la case devant l'esprit, zone menacée hors de portée | **rêver à la première étape** | le rêve annule l'ordre que la défense ne peut pas atteindre |
| Côté du rêve hostile, et plusieurs tours à tenir | **défendre**, ou rêver dans le **Cercle** | le sommeil reculerait ; le Cercle ne recule pas |
| Fin de partie proche (escalade du soir, module A4) | rêver si la fin est atteignable avant le tour 5, défendre sinon | la menace monte : finir tôt vaut d'autant plus |

Aucune ligne n'est vraie partout. C'est la condition du dilemme : la décision dépend d'une lecture **publique** de la piste (mémoire publique, principe noté 9), que l'équipe peut discuter au conseil.

Elle ouvre aussi une **chaîne de compétences**, utile au critère de courbe d'apprentissage : le débutant rêve quand il ne sait pas quoi faire ; le joueur moyen rêve quand le côté du rêve est calme ; l'initié contre d'abord la tactique qui menace son esprit, puis rêve, et garde un rêve pour le présage.

## 5. Ce que la proposition ne change pas
- Les invariants : défendre ou rêver, pas de défaite, les trois fins, la piste publique, l'oubli en 12, la limite de rêves (les lunes).
- Le Cercle et ses seuils, les ordres du Méchant, les Machines, l'escalade du soir.

Elle **renforce** un principe noté 8 (le tir à la corde) au lieu d'en ajouter un. La règle tient en une phrase.

## 6. Risques, et comment les vérifier avant toute décision
| Risque | Signe dans la simulation | Réglage de repli |
|---|---|---|
| Le cauchemar punit trop : le rêve redevient inutile | meilleur taux fixe = 0, gain du bot libre ≤ 0 | ne repousser que sur les cases 9 à 12, ou un recul par tour au plus |
| Sans le sablier, le rêve redevient trop rapide (comme en V0.3) | fin par le sommeil avant le tour 4 dans plus de 20 % des parties | une lune de moins ; ou un esprit au départ de moins |
| Le Cercle devient le seul refuge, et domine | part des rêves dans le Cercle > 80 %, gain du bot libre faible | seuil du Cercle relevé |
| Le bot fort ne sait pas juger la situation, et mesure mal le dilemme | le bot à portefeuille et le contrôle (MC 256) trouvent un gain du bot libre très différent | juger le dilemme au bot de contrôle |

**Critères de réussite proposés** (à valider) : gain du bot libre ≥ 5 points ; meilleur taux de rêve fixe intermédiaire (ni 0 ni le maximum) ; tir à la corde au moins une fois par partie en moyenne ; rêves plus fréquents quand le côté du rêve est calme que quand il est hostile.

## 7. Suite proposée
1. **Coder les deux changements comme une variante** du moteur (`reves_par_pas` = 1 et règle `cauchemar`), avec ses tests ; rien ne change dans la V0.4. *Décision technique, mais elle prépare une règle nouvelle : à faire seulement avec l'accord de l'auteur.*
2. **Campagne appariée** V0.4 contre V0.4 + rêve disputé, de 2 à 6 joueurs : forêt, fins, taux de rêve fixes, gain du bot libre, fréquence du tir à la corde ; au bot fort et au bot de contrôle. Ordre de grandeur : une campagne de la taille de la ligne de base (environ 1 000 parties, une à deux heures sur GitHub).
3. **Décision de l'auteur** au vu des résultats : adopter la règle, la régler, ou l'écarter. Si elle est retenue, elle entre au cycle 2 comme forme de règle, et ses réglages deviennent des axes du criblage.
