# Ce qui fait un choix stratégique : la leçon du rêve

*14 oct. 2026, 14 h 30. Rédigé par Claude à la demande de l'auteur, à partir de l'échange sur l'alerte E (« défendre ou rêver ») et de l'historique du dépôt. Les chiffres viennent des documents cités ; ce sont des indices. Les principes et mesures proposés ici ne changent aucune règle ni aucune bande : ils sont soumis à l'auteur (section 7).*

## En bref
- **L'erreur** : on a traité « défendre ou rêver » comme une question de *prix* du rêve (trop rentable en V0.3, plus assez en V0.4). Or un dilemme n'est pas un prix bien réglé. C'est un choix dont **la meilleure réponse change selon la situation**, et que le joueur peut lire. Le régler « dans l'absolu » ne peut produire qu'un choix gagnant ou un choix indifférent.
- **Pourquoi elle est arrivée** : le mécanisme prévu pour créer ce dilemme, le tir à la corde, ne se produit presque jamais (0,05 à 0,09 fois par partie) pour une raison de géométrie de la piste. Et comme les cartes d'un peuple sont identiques, le coût d'un rêve ne dépend que du temps qui reste. Le rêve était donc une course séparée, réglée par l'horloge.
- **Pourquoi personne ne l'a vu** : chaque analyse regardait une moyenne ou une situation isolée, jamais la manière dont la réponse change d'une situation à l'autre. La mesure des « dilemmes » comptait même l'indifférence comme un dilemme. Le cycle 1 optimisait la durée et la difficulté et ne mesurait pas l'objectif 2. Il a donc choisi un frein fixe (le sablier), qui déplace la moyenne sans créer de choix.
- **La généralisation** : un choix est stratégique s'il est **disputé** : chaque option est la meilleure dans des situations fréquentes, l'écart compte, et la frontière se lit sur des indices publics sans se réduire à une règle unique. Un paramètre ne déplace que la moyenne de l'écart entre les options ; seul un mécanisme qui lit l'état crée sa dispersion. D'où sept principes de conception, cinq tests et six règles de méthode.

## 1. Ce qui s'est passé
| Version | Rêver à chaque tour contre ne jamais rêver (bot fort) | Gain du bot libre (juger avant de rêver) | Lecture faite alors |
|---|---|---|---|
| V0.3 | 89,8 % contre 82,6 % : **rêver domine** | +2,4 points (orange) | « le rêve est trop rentable » |
| V0.4 | 70,6 % contre 73,3 % : **ne pas rêver vaut un peu mieux** | −1,3 point (rouge) | « le rêve ne paie plus, il ne domine pas » |

*Sources : protocole P3 (`archive/conception-v0x/bilans/protocole-p3-analyse.md`), proposition « le rêve disputé ».*

Entre les deux versions, l'avantage **moyen** du rêve est passé d'environ +7 points à environ −3. Pourtant le gain d'un joueur qui *juge* la situation est resté proche de zéro. On a traversé le point d'équilibre sans jamais créer de dilemme. L'auteur l'a formulé ainsi : si une option est toujours meilleure, l'autre n'a pas d'intérêt ; si les deux s'équilibrent dans toutes les situations, il n'y a plus de choix. **Toute l'intelligence stratégique est dans l'appréciation de la situation.**

## 2. Ce qui fait réellement un choix stratégique
Pour une situation *s*, on note **Δ(s)** l'écart de valeur entre les deux options (par exemple la forêt finale attendue si l'on rêve, moins celle si l'on défend).

| Régime | Δ selon les situations | Ce que vit le joueur | Exemple |
|---|---|---|---|
| **Dominé** | toujours du même signe | une option gagnante, l'autre inutile | rêver en V0.3 |
| **Indifférent** | proche de 0 partout | le choix ne compte pas | rêver en V0.4 (presque) |
| **Disputé** | change de signe selon les situations, avec de vrais écarts | il faut lire la situation : c'est le dilemme | l'intention d'origine |

**La valeur du jugement** résume les trois régimes en un nombre : ce que gagne un joueur qui choisit au cas par cas, par rapport à la meilleure règle fixe.

> valeur du jugement = moyenne des max(A, B) situation par situation − max(moyenne de A, moyenne de B)

Elle est **nulle quand le choix est dominé, et nulle aussi quand il est indifférent**. Elle n'est grande que si Δ change de signe *et* si les écarts sont grands. Le « gain du bot libre » de l'objectif 2 en est l'estimation. C'était la bonne mesure : elle était déjà rouge ou orange au diagnostic de la phase 3.

**Les quatre conditions d'un choix disputé** :
1. **Renversement** : chaque option est la meilleure dans une part notable des situations rencontrées (pas seulement dans des cas rares).
2. **Enjeu** : là où l'on se trompe, on perd vraiment (l'écart moyen |Δ| dépasse le bruit d'une partie).
3. **Lisibilité** : le signe de Δ se devine à partir d'indices publics (la piste, le présage, les Machines, le temps qui reste).
4. **Profondeur** : une règle simple donne une partie de la réponse, pas toute. Il faut combiner au moins deux indices pour bien choisir. C'est ce qui crée la courbe d'apprentissage (débutant, joueur moyen, initié).

## 3. Pourquoi l'erreur de conception
**Dans le jeu.**
1. **Le mécanisme du dilemme ne se produit pas.** L'intention d'origine (« Le tir à la corde », noté 8) faisait se disputer le centre de la piste entre le rêve et l'apprentissage du Méchant. Mais l'esprit entre en 12 et avance vers le 7, alors que les tactiques qui réussissent montent elles aussi vers le 7 : elles sont toujours *devant* lui. Résultat : 0,05 à 0,09 tir à la corde par partie.
2. **Le coût du rêve ne dépend que de l'horloge.** Un rêve retire une carte de la main pour la partie (R3.6). Les cartes d'un peuple sont identiques dans le moteur (les effets propres des personnages sont une idée verrouillée, B5), donc ce que l'on sacrifie ne dépend que du nombre de tours qui restent.
3. **La valeur du rêve ne dépend que d'une course.** Rien ne s'oppose à l'avance des esprits, ni à celle du Cercle (la voie du réveil, ajoutée en v2, n'a aucun adversaire). La seule question est : la course est-elle gagnable avant la nuit ?
4. **Conséquence.** Les deux côtés du choix dépendent du temps, presque pas de la situation. La meilleure politique est alors un **horaire** (« rêver tant que… », « rêver à partir du tour… »), c'est-à-dire une boucle. Une telle structure ne connaît que deux régimes, la course trop courte (V0.3) ou trop longue (V0.4).

**Dans la manière de concevoir.**
5. **Le cadrage « prix ».** L'alerte A (13 oct.) a posé le problème ainsi : « le rêve se paie trop tard ». Elle a conduit à chercher le bon prix ou le bon frein : seuil du Cercle, lunes, sablier, taille de la main. Tous sont des constantes. **Une constante déplace la moyenne de Δ ; elle ne crée pas sa dispersion.** Le sablier a même supprimé le seul effet immédiat et situationnel du rêve : rêver sur le présage pour annuler un ordre.
6. **L'optimiseur a fait ce qu'on lui demandait.** Le score du cycle 1 ne comptait que la durée et la difficulté. Il a trouvé le moyen le plus simple de tenir la durée : un frein fixe. C'est un effet Goodhart : ce qui n'est pas dans le score est sacrifié.

## 4. Pourquoi elle est passée au travers des analyses
| Étape | Ce qu'elle voyait | Son angle mort |
|---|---|---|
| Phase 0 : objectif 2 | « aucune stratégie pure ne domine ; sain si le meilleur taux est intermédiaire **et dépend de la situation** » (plan d'action, 3.2) | la bonne intuition, mais « dépend de la situation » n'a jamais reçu de mesure propre |
| Phase 1 : mesure des « dilemmes » | part des décisions où deux options sont à moins d'un point de la meilleure | **elle compte l'indifférence comme un dilemme.** Un dilemme ne se voit pas dans une situation, il se voit *entre* les situations. Son témoin a raté (« essoufflement ») ; on l'a reléguée en indice descriptif sans trouver pourquoi |
| Le compteur `tir_a_la_corde` | le moteur le compte dans chaque partie (`stats_par_partie` des synthèses) ; « à simuler » figurait dans la synthèse des idées | aucune mesure ne regardait si les mécanismes voulus *se produisent*. La couverture des règles est descriptive, sans seuil |
| Phase 3 : diagnostic | gain du bot libre rouge (0,6 % en v1, −0,1 % en V2) | attribué à la durée (« les choix ne se mesurent bien qu'une fois la partie assez longue », plan, section 7). Cette **hypothèse causale n'a jamais été testée** ; l'objectif a été reporté au cycle 2 |
| Les bots | MC64R, dont les suites rêvent une carte par tour | l'instrument contenait une réponse : il estime la valeur d'un rêve en supposant qu'on rêvera ensuite à horloge fixe |
| Cycle 1 | durée et difficulté, mesurées et stables | objectifs 1 à 3 « non mesurés » sur les candidates (bilan du cycle 1, section 3). La contrainte « aucun autre objectif ne passe au rouge » ne pouvait pas jouer : l'objectif 2 était déjà rouge, et il n'était pas mesuré |
| Protocole P3 | meilleur taux fixe = 0, gain libre −1,3 | lecture « dans l'absolu » (« le rêve ne vaut plus rien »), et retour au cadrage prix (option A) |
| Garde-fou « boucles » (ce matin) | aucune boucle ne gagne en V0.4 | il teste la **dominance**, pas l'indifférence. Son « échelle de la lecture » était pourtant rouge à 5 et 6 joueurs : lire le jeu n'apporte rien au glouton. C'était le même symptôme |

**Le point commun** : on a toujours comparé des **moyennes** (un taux fixe contre un autre, une version contre une autre) ou des **décisions isolées**. On n'a jamais mesuré **comment la meilleure réponse varie d'une situation à l'autre**, alors que c'est la définition même d'un choix.

## 5. Généralisation : sept principes de conception
1. **Penser en Δ(situation), pas en valeur.** Avant de régler une option, écrire dans quelles situations elle doit être la meilleure, et dans lesquelles elle doit perdre.
2. **Trois régimes, pas deux.** Toujours vérifier qu'on n'échange pas un choix dominé contre un choix indifférent.
3. **Un réglage déplace la moyenne ; un mécanisme crée la dispersion.** On ne confie jamais un dilemme à la seule recherche de paramètres. Les constantes servent à placer la frontière, pas à la créer.
4. **Coupler les options.** Le même indice public doit rendre une option meilleure *et* l'autre moins bonne (un tir à la corde, un présage, une Machine hors de portée). Deux options pilotées par des variables séparées deviennent deux courses parallèles.
5. **Le coût aussi doit dépendre de la situation.** Un prix fixe (le sablier, une carte toujours identique) ne crée pas de choix. Ce qu'on sacrifie doit valoir plus ou moins selon le moment.
6. **Un mécanisme qui ne se produit pas n'existe pas.** Chaque interaction voulue (notée 8 ou 9) doit arriver assez souvent dans les parties ordinaires, et pas seulement en principe. On vérifie la géométrie et la fréquence avant le résultat.
7. **L'horloge n'est pas une situation.** Si la bonne réponse ne dépend que du tour, la meilleure stratégie est un horaire, donc une boucle. Les indices qui tranchent doivent varier d'une partie à l'autre, pas seulement au fil de la partie.

## 6. Généralisation : comment tester un choix
**La fiche du choix** (à remplir avant de proposer ou de coder une règle) : les options ; les indices publics censés trancher ; le mécanisme qui couple les options ; la fréquence attendue des situations où chaque option gagne ; la règle simple du débutant et ce que l'initié fait de mieux.

**Cinq tests, du moins cher au plus cher :**
| Test | Ce qu'il vérifie | Comment | Proposition de seuil (à valider) |
|---|---|---|---|
| T1. Mécanisme | les interactions voulues se produisent | compteurs du moteur, au glouton | au moins 1 par partie en moyenne pour un mécanisme central |
| T2. Dominance | aucune règle fixe ni aucun horaire ne gagne | meilleur taux fixe, garde-fou « boucles », **en ajoutant des horaires** (rêver à partir du tour *k*, jusqu'au tour *k*) | inchangé (objectif 2, garde-fou C1) |
| T3. Valeur du jugement | juger rapporte | gain du bot libre sur la meilleure règle fixe, **avec un bot dont les suites n'imposent pas le choix**, et vérifié avec un second bot | inchangé : vert ≥ 5 %, rouge < 1 % |
| T4. Profil de Δ | le choix est disputé, ni dominé ni indifférent | sur un échantillon de décisions, chaque option estimée par des suites appariées : part des situations où A gagne de plus de *s* points, où B gagne de plus de *s* points, et zone neutre | chaque côté ≥ 20 % des situations, zone neutre ≤ 50 %, *s* = 2 points |
| T5. Lisibilité et profondeur | la frontière se lit et s'apprend | un petit arbre de décision sur les indices publics prédit le signe de Δ : à un indice, nettement mieux que le hasard ; à deux indices, mieux qu'à un ; jamais parfait | précision à un indice ≥ 65 % ; gain du deuxième indice ≥ 5 points ; plafond < 95 % |

T4 **remplace** la mesure actuelle des « dilemmes », qui confond indifférence et dilemme. T5 donne aussi, gratuitement, les conseils stratégiques du livret et la chaîne de compétences de la campagne de profondeur.

**Témoins de ces tests** : la V0.3 (dominé), la V0.4 (presque indifférent), et une variante construite pour être disputée (par exemple : un rêve annule l'ordre en cours seulement si les dés du présage désignent une zone hors de portée de l'équipe). Elle doit passer T3 à T5.

**Six règles de méthode :**
1. Un objectif rouge reporté sur une hypothèse (« la durée réglée rendra le dilemme ») s'accompagne du test de cette hypothèse, au plus tard au cycle suivant.
2. Tout objectif absent du score d'un cycle est mesuré au moins grossièrement sur les finalistes. Sinon le rapport le signale comme risque : l'optimiseur sacrifie ce qu'il ne voit pas.
3. Un témoin qui rate impose de comprendre pourquoi avant de garder la mesure, même comme indice.
4. L'instrument ne doit pas contenir la réponse : un bot dont les suites rêvent à horloge fixe ne peut pas juger la valeur situationnelle du rêve.
5. Mesurer le mécanisme avant le résultat (T1 avant T3).
6. Toujours répondre à « dans quelles situations ? », jamais « dans l'absolu ».

## 7. Application immédiate
**À l'essai du rêve disputé (batterie 8, campagne 21, en cours).** Ses critères couvrent T1 (au moins un recul d'esprit par partie), T2 (meilleur taux fixe intermédiaire) et T3 (gain du bot libre ≥ 5 points). Il manque :
- T4 et T5 ;
- la neutralité de l'instrument : MC64R rêve une carte par tour dans ses suites, alors que MC 256 à portefeuille est plus fort sur la V0.4 (+13,8 points, campagne 18).

Sans ces deux points, un gain libre faible pourrait venir du bot et non de la règle. Lectures complémentaires techniques (Claude, sans attendre de décision) : ETAT.md, section 5, étape 3 ter.

**Aux autres choix du jeu**, à passer par la fiche du choix au cycle 2 :
| Choix | Indices censés trancher | Risque à vérifier |
|---|---|---|
| Moitié haute ou basse d'une carte | Machines à portée, zone menacée | une moitié dominante par peuple (choix morts déjà en partie mesurés) |
| Saboter ou barrer | Machine à portée, allié présent, menace de l'étape | Saboter vaut peu en V0.3 (alerte B) : dominé ? |
| Voie du sommeil ou du réveil | côté du rêve hostile ou calme, Cercle presque plein | le Cercle sans adversaire : choix d'horloge |
| Prendre une lune | qui a la meilleure occasion de rêver | indifférent si le rêve l'est |
| Voir, Hanter (pouvoirs limités) | moment où l'ordre compte le plus | à jouer dès que possible : horaire ? |
| Où poser une trace | ce que l'autre ignore | coordination nulle chez les bots (alerte C) |

## 8. Décisions (adoptées par l'auteur le 14 oct., 14 h 10 : C2, C3, C4)
*Mise en œuvre : dès le cycle 2, selon [avant-ou-apres-v1.md](../../archive/conception-v0x/pilotage/avant-ou-apres-v1.md) (M1 à M6, M10).*
1. **Adopter les sept principes et les six règles de méthode**, et la fiche du choix comme préalable à toute nouvelle règle. *Recommandation : oui.* Ils ne changent aucune règle du jeu et auraient évité les deux tours de réglage du rêve.
2. **Remplacer la mesure des « dilemmes » par le profil de Δ (T4) et ajouter la lisibilité (T5)**, d'abord en lecture seule, avec les seuils proposés ci-dessus. *Recommandation : oui, en lecture seule jusqu'à la confirmation des seuils sur les témoins*, comme pour le garde-fou C1.
3. **Ajouter T1 (fréquence des mécanismes voulus) au rapport de chaque cycle**, avec un seuil d'alerte (moins de 0,5 occurrence par partie pour un mécanisme noté 8 ou 9). *Recommandation : oui.* C'est le test le moins cher, et il aurait révélé le défaut dès la phase 1.
