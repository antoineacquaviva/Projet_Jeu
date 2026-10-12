# Mécanique du Méchant : le Méchant qui apprend

*Statut : concept validé dans ses grandes lignes, premier test par simulation fait (10 oct. 2026). Méthode de conception/test définie (10 oct. 2026). Vocabulaire fixé (10 oct. 2026). À approfondir.*
*Voir aussi : « Dynamique d'ensemble - le rythme de la bataille ».*

## Lexique (fixé par l'auteur, 10 oct. 2026)
- **Le Méchant** : le patron d'une entreprise mafieuse qui déforeste. Antipathique, caractériel, cupide. Il supervise le chantier sans être au contact. C'est lui qui apprend : le sac est sa mémoire.
- **Les Machines** : les engins de chantier de tout genre (bulldozers, abatteuses, tronçonneuses, terrassement…). Sans conducteurs humains dans leur représentation ; quelques traits humanoïdes possibles, façon *Cars*. Elles exécutent les ordres du Méchant.
- **Pas de nom fixé pour l'ensemble des deux** (« les adversaires » ou autre terme à déterminer).
- Ancien nom de cette mécanique : « la machine qui apprend ».

## Contexte du jeu
- Jeu coopératif asymétrique.
- Thème : sauver un morceau de forêt amazonienne face aux Machines du Méchant (inspiration : *Rio 2*).
- 6 factions envisagées : oiseaux, mammifères, reptiles, insectes, humains, entités magiques.
- Structure : phase de programmation (y compris celle du Méchant), puis phase de résolution.
- Souhait : des synergies fortes entre factions.

## Problème de départ
Programmer le Méchant de façon « intelligente » sans demander aux joueurs de jouer contre leur propre camp.

## L'idée : le Méchant apprend au lieu de réfléchir
Inspirée de MENACE (Donald Michie, 1961 : boîtes d'allumettes et perles qui apprennent le morpion).

1. **Programmation** : on tire 3 jetons Tactique d'un sac, posés face cachée sur la piste du Méchant (étapes 1-2-3). Les joueurs programment en parallèle.
2. **Résolution** : à chaque étape, les joueurs agissent, puis le jeton se révèle. Il donne un **critère** appliqué au plateau tel qu'il est à cet instant, pas une cible fixe. Exemples : *Cupidité* (zone la plus boisée), *Opportunisme* (la moins défendue), *Représailles* (là où les Machines viennent d'être attaquées), *Percée* (droit devant la Machine la plus avancée).
3. **Apprentissage** : une tactique qui a détruit quelque chose retourne dans le sac avec une copie. Une tactique contrée en sort.

Le contenu du sac est **public** : l'intelligence des joueurs sert à lire les tendances du Méchant, sans conflit d'intérêt.

## Garde-fous envisagés
- Toujours au moins 1 jeton par tactique.
- Seuil : si une tactique atteint N jetons, un événement majeur se déclenche. **Mis à jour** : c'est désormais une *obsession* (règle permanente qui durcit la partie, sans défaite), voir « Dynamique d'ensemble ».
- Critères lisibles d'un coup d'œil, une seule règle de départage des égalités.
- En campagne : le sac peut être conservé d'une partie à l'autre.

## Décision prise
**3 étapes sur la piste du Méchant.** Raison : environ un tiers du sac est tiré par manche, ce qui garde de l'incertitude tout en laissant le contenu du sac informatif. À retester avec 2 et 4 en prototype.
Alternatives notées, non retenues pour l'instant : découpler les étapes joueurs/Méchant ; nombre de tirages variable (égal au nombre de Machines, ou croissant au fil des manches) pour une escalade indépendante de l'apprentissage.

## Résultats de la simulation (Monte Carlo, modèle abstrait)
Modèle : 4 tactiques, 2 jetons chacune au départ, 3 tirages/manche, 8 manches, +1/-1 par succès/échec, plancher 1, seuil 5. 20 000 parties par scénario. Valable pour les tendances, **pas pour l'équilibrage**.

1. **Il apprend vraiment.** Face à une équipe avec une faille (mauvaise contre Opportunisme), cette tactique finit en tête dans 83 % des parties. Sa part passe de 25 % à environ 35 % dès la manche 2, puis 47 % en fin de partie.
2. **Effet modeste sur les dégâts** : +13 % sur la partie (environ +20 % en fin de partie). L'apprentissage décide surtout *où* les Machines frappent, pas *combien*. L'escalade de menace doit venir d'ailleurs.
3. **Il apprend aussi le hasard.** Face à une équipe sans faille, le seuil est atteint par pure chance dans 43 % des parties (départ 2, seuil 5). Ce qui compte est **l'écart départ → seuil** : avec un écart de 4 (ex. départ 2, seuil 6 ou départ 3, seuil 7), environ 20 % de fausses alertes, et le seuil reste atteint dans environ 59 % des parties face à une vraie faille.
4. **Lire le sac permet de le battre.** Une équipe qui renforce sa défense contre la tactique la plus présente subit environ 8 % de dégâts en moins qu'avec un sac fixe. La tactique en tête change environ 4 fois en 8 manches.

## Risque principal identifié
Si lire le Méchant suffit à le contrer, son « intelligence » devient une faiblesse (jeu de tape-taupe). Dans la simulation, se concentrer sur une tactique ne coûtait rien aux joueurs.
**Piste de solution :** concevoir les critères en **tension mutuelle**, pour que contrer la tactique dominante ouvre une faille pour une autre (ex. se regrouper contre la Percée nourrit l'Opportunisme). Lire le Méchant donne alors un dilemme, pas une solution.

## Méthode de conception, test et affinage (discussion du 10 oct. 2026)

### Plan retenu
1. Poursuivre l'élaboration d'une **première version du jeu** (règles complètes, même provisoires).
2. Ensuite, Claude en crée une **version virtuelle testable et hautement paramétrable** : de nombreux paramètres réglables, ajustés en analysant des parties simulées.
3. Plus tard seulement : implémentation soignée (BGA Studio ou autre), une fois les règles figées.

### Paliers de fidélité croissante
On ne paie le coût d'un palier que quand le précédent est stable.
1. **Simulations abstraites** (comme celle du sac) : rapides, jetables, valident un mécanisme isolé.
2. **Moteur de règles sans interface** (Python ou TypeScript), plateau réduit. Règles codées fidèlement, graine aléatoire reproductible, paramètres dans un fichier de config (jetons, critères, zones, seuils…). Permet des **balayages de paramètres** (écart départ/seuil, nombre d'étapes, taille du sac…).
3. **Bots de niveaux différents** : aléatoire, glouton (heuristique), puis bot qui lit le sac et s'adapte. L'écart de résultats entre niveaux mesure la profondeur du jeu : nul = les décisions ne comptent pas ; énorme = casse-tête à solution unique.
4. **Tests humains** au plus tôt, en papier ou sur table virtuelle (Tabletop Simulator, Tabletopia, Screentop), même en solo en incarnant toutes les factions.
5. **BGA Studio** (ou équivalent) une fois les règles figées. Peu adapté à la phase d'itération : chaque changement de règle demande de réécrire du code, et ce n'est a priori pas conçu pour lancer des milliers de parties sans interface (à vérifier dans leur doc).

### Ce que la simulation peut et ne peut pas dire
- **Peut** : équilibre numérique, stratégies dominantes, effets boule de neige, durée, variance, et surtout le comportement du Méchant (cœur du jeu).
- **Ne peut pas** : plaisir, lisibilité, fluidité, temps morts, effet « leader » (un joueur qui dicte tout aux autres, piège classique du coopératif). Un bot qui contrôle toute l'équipe ignore aussi la communication limitée et l'asymétrie des rôles.
- Donc : les simulations dégrossissent les chiffres, les humains jugent l'expérience.

### Principes de conception
- **Commencer petit** : 2 factions, plateau de 5 à 7 zones, le Méchant et son sac. Ajouter les factions une par une en mesurant l'effet de chacune (6 factions avec synergies = explosion combinatoire).
- **Tester d'abord l'hypothèse la plus risquée** : les critères forment-ils un réseau de tensions, ou le Méchant devient-il un tape-taupe ?
- **Fixer 3-4 objectifs d'expérience** (ex. « la menace est lisible mais jamais résolue »), chacun associé à une métrique mesurable en simulation.

### Rôle de Claude
Écrire le moteur, les bots et les scripts de balayage, les exécuter et rendre les résultats (tableaux, graphiques) ; critiquer les règles ; préparer des fiches papier à imprimer ; analyser les retours de tests humains.

## Questions ouvertes / prochaines étapes
- **En cours (côté auteur)** : élaborer une première version complète du jeu.
- Définir le plateau (nombre de zones, adjacences), ou partir d'un plateau provisoire de 7 zones proposé par Claude.
- Modéliser les vrais critères sur ce petit plateau et vérifier qu'ils forment un réseau de tensions.
- Formuler 3-4 objectifs d'expérience et leurs métriques.
- Choisir écart départ/seuil (recommandation provisoire : écart de 4). Ce que déclenche le seuil : réglé (obsessions).
- Définir la taille et la composition du sac de départ, et le nombre de tirages selon le nombre de joueurs.
- Escalade de menace indépendante de l'apprentissage : piste retenue, la lutte contre le sommeil (voir « Dynamique d'ensemble »).
- Plus tard : interférences des factions avec la mémoire du Méchant (idées déjà esquissées : oiseaux regardent un jeton, humains échangent deux jetons, insectes glissent des jetons Bug, entités magiques faussent la mémoire, mammifères bloquent, reptiles servent d'appât). Volontairement mises de côté pour l'instant.
- Ensuite : version virtuelle paramétrable (moteur + bots + balayages), puis prototype papier et tests humains.
