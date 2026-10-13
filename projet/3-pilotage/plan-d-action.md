# Plan d'action : évaluer et explorer les variantes par la simulation

*Statut (12 oct. 2026) : plan finalisé le 11 oct. (décisions 1 à 6 de la section 10), **mis à jour le 12 oct. pour la maquette de conception v2** (décisions 7 et 8). Phase 0 terminée et validée par l'auteur le 12 oct. (« Objectifs, invariants et catalogue ») ; phase 1 terminée le 12 oct. (« Batterie d'évaluation (phase 1) », moteur 1.5, 248 tests), mesures validées et bandes gelées par l'auteur (décision 9). Il reprend les quatre pistes de l'auteur (décliner le jeu en variantes, fonctions d'évaluation, bots plus avancés, sélection par algorithme génétique), les complète et les ordonne.*
*Voir aussi : « Objectifs, invariants et catalogue » (phase 0), « Maquette de conception v2 - plan du Méchant, fins, conseil » et l'atelier v2, « Moteur de règles v1 - conformité et campagne de référence » (point de départ technique), « Règles de la maquette v1 », « Synthèse des idées - revue du 11 oct. 2026 » (notes et invariants), « Panel de joueurs virtuels - ébauche » (profils), « Cahier des charges - environnement de calcul cloud ».*

## En bref
- **Les quatre pistes se tiennent, mais dans un ordre imposé** : on ne peut pas sélectionner des variantes avant de savoir les évaluer, ni les évaluer avant d'avoir des bots qui jouent assez bien. D'où six phases : cadrer, mesurer, renforcer les bots, diagnostiquer, explorer, valider.
- **Deux maquettes à évaluer (mise à jour du 12 oct.).** La v1 reste la référence publiée. La v2 est un arbre de variantes (l'atelier) dont neuf décisions restent ouvertes. La simulation éclaire ces décisions : la v2 est codée dans le moteur en phase 1, ses options sont comparées en phase 3 avec le bot fort, l'auteur la fixe, puis la recherche de la phase 4 porte sur ses paramètres.
- **Risque n° 1 : évaluer les bots au lieu du jeu.** Le glouton actuel place sa présence plus mal que le hasard et ne joue presque jamais Tenir : une mesure de stratégie faite avec lui décrit le glouton. Il faut un bot fort qui s'adapte seul à n'importe quelle variante, et des résultats qui tiennent quand on change de bot. C'est encore plus vrai pour la v2, que le glouton ne sait pas jouer (il choisirait au hasard la voie du rêve ou les traces).
- **Risque n° 2 : optimiser les chiffres au lieu du jeu.** Une recherche automatique exploite toute faiblesse de la mesure. Parades : invariants fixés par l'auteur, mesures validées sur des variantes témoins dont on connaît les défauts, bots de contrôle jamais utilisés pendant la recherche, et l'auteur qui choisit en dernier.
- **L'algorithme génétique est gardé, sous une forme adaptée.** Le génome existe déjà : un chemin dans l'arbre de l'atelier (choix, modules, paramètres), traduit en maquette JSON. Pas de score unique, mais un filtre éliminatoire puis plusieurs objectifs ; et plutôt qu'un gagnant, une carte de variantes diverses (MAP-Elites), qui peut fournir directement les modes famille et expert.
- **Diagnostiquer avant d'optimiser.** Les défauts structurels se corrigent à la main, comme de v0 à v1 et de v1 à v2. La recherche règle des curseurs et départage des alternatives ; elle n'invente pas de mécanique.
- **L'échelle de résultats est fixée** : la forêt restante, sans bonus selon la fin (décision 7) ; la robustesse est vérifiée avec un bonus de 10 et 25 %.

## 1. Les quatre pistes, revues

### 1.1 Décliner le jeu en variantes
**Déjà là.** Une maquette JSON qui hérite d'une autre et n'écrit que ses différences ; des registres où ajouter critères, ordres et pouvoirs ; une clé mal orthographiée refusée au chargement. C'est un génome tout prêt. L'atelier v2 lui donne une forme lisible par l'auteur : un arbre de socle, de choix, de modules et de paramètres, avec un code de variante.

**Ce qui change.**
- **Un catalogue des variables**, chacune avec un type (nombre, choix entre règles, structure, module à activer) et un statut : *invariant*, *libre*, *module*, *témoin*, *hors recherche*, et pour la v2 *à trancher en phase 3*. Les notes de la synthèse fixent ces statuts : une idée notée 9-10 devient un invariant, une idée notée 0 est exclue, et une note basse sur une forme précise (la liste des critères, notée 4) appelle au contraire à explorer des alternatives. Voir « Objectifs, invariants et catalogue ».
- **Un ordre de grandeur réaliste.** Une trentaine de variables à 3 ou 4 valeurs donnent plus de 10^15 combinaisons. On ne les énumère pas : on cherche d'abord lesquelles comptent (criblage), puis on explore celles-là.
- **Deux usages des variantes.** Les *variantes de conception* servent à choisir les règles ; les *variantes de jeu* (niveaux de difficulté, mode famille, mode expert) resteront dans la boîte. La même recherche peut produire les deux.
- **La recherche n'invente pas.** Une mécanique nouvelle (une autre forme de Voir, le bruit, le dernier sursaut, un nouveau critère) entre dans le catalogue comme alternative proposée par l'auteur ou par Claude, puis codée dans un registre. La recherche choisit entre alternatives et règle des valeurs.

### 1.2 Fonctions d'évaluation
**Ce qui change.**
- **Une hiérarchie plutôt qu'un score** : (1) des filtres éliminatoires (jouabilité) ; (2) des objectifs (les 4 objectifs d'expérience, l'équilibre, la stratégie) ; (3) des lectures par profil. Fondre tout cela trop tôt en un score unique imposerait des poids arbitraires et cacherait les compromis, alors que le panel montre que certains sont inévitables (Hélène contre Jean-Marc).
- **Une fiche par mesure** : définition, bot requis, coût de calcul, valeurs attendues, profils concernés, statut (*mesure*, *indice* à confirmer par des humains, ou *humain seulement*).
- **Des mesures validées avant usage**, sur des variantes témoins (section 3.6).
- **Des mesures indépendantes de la forme des règles** : la menace se calcule en jouant les 36 tirages de dés sur une copie de l'état, ce qui vaut pour la v1 comme pour la v2.
- **De la rigueur statistique** : intervalles de confiance ; mêmes graines pour toutes les variantes comparées, ce qui réduit fortement le bruit des comparaisons ; nombre de parties ajusté à la précision voulue.

Détail en section 3.

### 1.3 Des bots plus forts et plus variés
**Ce qui change.**
- **Deux besoins à ne pas confondre.** La *force* sert à mesurer la stratégie : une stratégie dominante ou une action inutile ne se voit qu'avec un joueur qui joue bien. La *variété* sert à mesurer l'expérience des profils : prudent, audacieux, novice.
- **Un bot fort indépendant des règles.** La recherche arborescente Monte-Carlo (MCTS) choisit en simulant la suite de la partie avec le moteur lui-même : elle joue n'importe quelle variante sans être réécrite, ce qui est indispensable quand l'algorithme génétique change les règles à chaque génération, et quand la v2 change le plan du Méchant. Les informations cachées (cartes face cachée, dés à venir) sont traitées en tirant plusieurs mondes possibles (déterminisation). Son niveau se règle par le nombre de simulations : on obtient une échelle de bots.
- **La question propre au coopératif.** Un bot unique qui décide pour toute l'équipe, c'est exactement le joueur dominant. On le compare à des bots qui décident chacun pour soi : l'écart mesure ce qu'un chef fait gagner, donc la tentation de l'effet leader.
- **Un prérequis moteur** : pouvoir copier un état en cours de partie (ou le rejouer à partir de la graine et des réponses déjà données) pour en simuler la suite. Fait le 12 oct. (moteur 1.1, `Partie.copie`).

Détail en section 4.

### 1.4 Campagnes et sélection génétique
**Ce qui change.**
- **Génome = un chemin dans l'arbre de l'atelier**, traduit en surcharge de maquette, limité aux variables libres du catalogue. Croisement : fusionner deux chemins. Mutation : changer une valeur, activer ou retirer un module.
- **Plusieurs objectifs.** Deux familles d'algorithmes génétiques s'y prêtent :
  - *NSGA-II* rend un front de compromis : les variantes qu'aucune autre ne bat sur tous les objectifs à la fois ;
  - *MAP-Elites* (« qualité-diversité ») rend une carte : on choisit deux caractéristiques comme axes (par exemple la part du hasard et la durée), et chaque case garde la meilleure variante de ce type. **Retenu** (décision 4) : il montre les compromis, garde la diversité et propose des candidats pour chaque profil et chaque mode.
- **Plusieurs fidélités.** Bots rapides pour trier des milliers de variantes ; bots forts pour quelques dizaines de finalistes.
- **Une course d'élimination** : peu de parties par variante au début, on écarte celles qui sont nettement mauvaises, on concentre les parties sur les autres.
- **Un étalon** : la recherche au hasard, à budget égal. Si l'algorithme génétique ne fait pas mieux, il ne sert à rien.
- **Des garde-fous** : bots et mesures de contrôle, parcimonie (à qualité égale, la variante la plus simple), veto de l'auteur.

Détail en section 5.

## 2. L'orchestration

```
Phase 0 ──► Phase 1 ─────────────────► Phase 2 ──► Phase 3 ─────────────────────► l'auteur fixe la v2
Cadrer      Mesurer + v2 dans le       Bots        Diagnostic v1 et comparaison         │
            moteur                                  des options de la v2                 ▼
            retour en phase 3 ◄── tests humains ◄── Phase 5 ◄─────────────────────── Phase 4
            (cycle suivant)                         Valider                         Explorer la v2
```

1. **Chaque phase se termine par un document du projet et une décision de l'auteur.**
2. **On ne paie un palier que quand le précédent est stable** (les paliers de fidélité déjà adoptés).
3. **Diagnostiquer avant d'optimiser** : une recherche menée sur un jeu qui a un défaut structurel règle tout autour du défaut au lieu de le corriger.
4. **Les phases 1 et 2 se chevauchent** : les mesures de jouabilité et d'équilibre tournent avec les bots actuels pendant que le bot fort se construit.
5. **La simulation propose, l'auteur décide, les humains jugent l'expérience.**

## 3. La batterie d'évaluation
*Les bandes provisoires de chaque mesure sont dans « Objectifs, invariants et catalogue », section 2.*

### 3.1 Niveau 1 : jouabilité (filtres éliminatoires)

| Mesure | Ce qu'elle dit | Comment |
|---|---|---|
| Robustesse | Le jeu ne se bloque pas | Erreurs, états impossibles, incohérences connues : zéro toléré (existe) |
| Lacunes | Questions que les joueurs se poseront à la table | Fréquence de chaque lacune par partie (existe) |
| Couverture des règles | Complexité sans effet | Part des parties où chaque règle (ou nœud de l'atelier) s'applique ; une règle presque jamais appliquée coûte à apprendre pour rien |
| Charge de règles | Fluidité | Départages, exceptions et vérifications par partie (aujourd'hui 4 à 6 égalités entre Machines en v1) |
| Durée *(mesure, jamais éliminatoire)* | Combien de temps dure une partie, et ce temps est-il rempli | Tours joués, décisions par joueur, temps de conseil estimé, fins prématurées, parties sans enjeu. Une partie de plus d'une heure n'est pas écartée : un jeu plus long est acceptable s'il est bon. La durée est exposée comme un axe de lecture (section 5.2) et jugée avec l'attente et la densité de décisions |
| Attente et densité | Temps morts ; un jeu long mais dense reste acceptable, un jeu long et creux non | Décisions prises l'une après l'autre pendant que les autres attendent ; décisions réelles (hors choix forcés) par joueur et par heure estimée |
| Choix forcés | Décisions qui n'en sont pas | Part des décisions à une seule option (45 % des choix d'action du glouton v1) |

### 3.2 Niveau 2 : équilibre

| Mesure | Ce qu'elle dit | Comment |
|---|---|---|
| Contribution de chaque peuple | Équilibre entre peuples | Valeur de Shapley : dans un jeu coopératif, la part équitable de chaque membre se calcule à partir des résultats de toutes les équipes possibles (63 pour 6 peuples, calculables en entier) |
| Synergies | « Des synergies fortes » | Pour chaque paire : résultat du duo moins ce qu'apportent les deux peuples séparément. Teste la prédiction du tétraèdre (les trois duos complets en tête) |
| Pire table | Aucune composition injouable | Résultat de la plus faible équipe, et écart avec la meilleure |
| Équilibre des fins | Les trois fins vivent | Répartition des fins par composition (sommeil, silence, nuit en v1 ; sommeil, réveil, nuit en v2), avec le bot fort ; puis un bot forcé de viser chaque fin : les voies doivent rapporter des résultats proches, avec des préférences selon la composition |
| Défendre ou rêver | Aucune stratégie pure ne domine | Bots à taux de rêve fixe (jamais, un tous les deux tours, un par tour), et en v2 par voie, contre le bot fort libre. Sain si le meilleur taux est intermédiaire et dépend de la situation |
| Tactiques du Méchant | Aucune tactique morte ou écrasante | Réussite et dégâts par tactique, et en v2 par Machine |

### 3.3 Niveau 3 : stratégie
Ces mesures demandent le bot fort.
- **Profondeur.** Résultats le long de l'échelle des bots (aléatoire, glouton, MCTS à budgets croissants). Un jeu profond récompense chaque gain de niveau ; un plafond atteint par un simple glouton signale un jeu vite résolu.
- **Actions sans intérêt (jeu restreint).** On interdit au bot fort une action, une moitié de carte ou un pouvoir, et on mesure ce qu'il perd. Perte nulle : l'élément est inutile ou remplaçable. Perte énorme : il est indispensable, peut-être dominant. Complété par la fréquence à laquelle le bot fort le choisit. En v2, à faire en priorité pour Saboter, qui ne mène plus à une fin.
- **Qualité des choix.** Sur un échantillon de décisions, le bot fort estime la valeur de chaque option. Chaque décision est classée : *forcée* (une option), *indifférente* (tout se vaut), *évidente* (une option écrase les autres), *dilemme* (au moins deux options proches de la meilleure, nettement au-dessus de la pire). On vise beaucoup de dilemmes et peu de décisions indifférentes.
- **Décidabilité et hasard.**
  - *Part du hasard* : on rejoue les mêmes graines avec des bots différents, et le même bot avec des graines différentes ; on en tire la part des écarts de résultat due aux décisions et celle due aux dés.
  - *Valeur de l'information* : écart entre le bot fort et un bot « devin » qui connaît les dés à l'avance. Petit : le hasard pèse peu. Grand : le hasard décide.
  - *Lisibilité du Méchant* : la piste donne les probabilités exactes de chaque ordre ; on en tire la concentration de la menace et une « surprise » (part des ordres hors des deux tactiques les plus probables).
- **Spirales.** Une boucle qui amplifie un retard (au sens strict, une rétroaction *positive* au profit du Méchant) se repère à trois signes : l'issue est prévisible très tôt à partir de l'état du plateau (dès le tour 2 sur 6 : partie jouée d'avance) ; les pertes s'accélèrent avec le retard ; les remontées sont rares. On mesure aussi l'inverse : les mécanismes qui ramènent la partie vers l'équilibre.
- **Tension et crescendo.** Après chaque tour, des simulations lancées depuis l'état courant estiment l'issue : on obtient une courbe d'incertitude. Esprit de bataille : incertitude élevée jusqu'au dernier tiers, menace croissante (ordres réussis, Machines actives), issue décidée tard.
- **Le Méchant apprend-il ?** Sa piste finale (ses pistes en v2) doit différer selon l'équipe (il apprend *cette* équipe) : on mesure une distance entre pistes finales. Test du tape-taupe : un bot qui contre la menace la plus probable ouvre-t-il une faille pour une autre ? Sinon, les critères ne sont pas en tension.
- **Variété des parties.** Les parties sont regroupées en « arcs » (courbe de la forêt, fin, tour de fin, tactique dominante). Peu d'arcs distincts : les parties se ressemblent, défaut reproché à *Spirit Island* par Vin d'jeu.

### 3.4 Niveau 4 : lecture par profil
Chaque profil devient une grille : quelques mesures et des seuils, fixés provisoirement en phase 0 (« Objectifs, invariants et catalogue », section 6). Les grilles servent à lire la carte et les finalistes ; elles n'entrent pas dans le score de la recherche.

| Profil | Critères mesurables | Ce qui reste aux humains |
|---|---|---|
| Hélène | Profondeur sans plafond ; part du hasard modérée ; Méchant lisible ; aucune stratégie dominante ; variété des arcs ; un curseur de difficulté efficace | Clarté des règles |
| Malik | Issue incertaine jusqu'au dernier tiers ; variété des fins ; moments rares (un esprit tiré au moment décisif, un sauvetage au dernier ordre) | Accord du thème et des mécaniques, beauté |
| Camille | Synergies ; fréquence des alliances ; gain du chef modéré ; contribution de chaque joueur (personne n'est spectateur) ; peu d'attente ; communication utile mais limitée (3.5) ; coordination réussie par convention après le présage | Qualité de la discussion |
| Bastien | Asymétrie profonde (le bot fort ne joue pas deux peuples de la même façon) ; variété selon les compositions ; aucune combinaison résolue vite | Sentiment de nouveauté |
| Jean-Marc | Difficulté réelle ; Méchant qui s'adapte ; surprise ; issue incertaine jusqu'au bout | Sentiment d'avoir battu quelque chose d'intelligent |
| Sophie | Durée courte et charge de règles faibles (exigence propre à ce profil, pas un filtre global) ; plancher élevé (une équipe faible n'est pas écrasée) ; coût limité d'un joueur faible ; difficulté réglable sans changer les règles | Temps d'explication, engagement des enfants |
| Thomas | Jouable par un seul bot qui pilote 2 ou 3 peuples ; défis gradués ; aucune information cachée indispensable ; aucune communication indispensable (en solo, elle n'a pas de sens) | Mise en place |
| Nadia | Coût d'un joueur novice (bot bruité) pour l'équipe ; sa contribution propre ; part de décisions simples ; coût d'une annonce mal comprise ou non suivie (3.5) | Se sentir perdue ou dirigée |

### 3.5 La communication entre joueurs
**Ce que disent les règles.** En v1 (livret), au conseil, on peut parler des zones, des tactiques, des Machines et de ses intentions (« je m'occupe de la Clairière »), sans montrer sa main, nommer un personnage, ni dire quelle moitié ou quelle étape on jouera ; puis vient le présage (le premier ordre du Méchant est révélé), après quoi on programme en silence. En v2, la parole est remplacée par des règles d'échange jouables sur BGA : les **traces** (jetons numérotés par étape, posés sur les zones sans ordre de tour) ou le **partage** (jetons par Machine, façon *The Gang*), puis le présage en module.

**Ce que le moteur ne fait pas encore.** Il ne modélise pas la communication : les bots programment sans rien se dire. Il faut un **canal de communication** : une décision « annonce » au conseil, dont la forme vient de la maquette (aucun signe, traces avec leurs paramètres, partage, tout dire), et le présage en module. Le conseil parlé de la v1 est approché par des traces non numérotées. Ces choix sont au catalogue.

**Les mesures.** Chacune compare des tables de bots identiques qui ne diffèrent que par le canal.

| Mesure | Ce qu'elle dit | Comment |
|---|---|---|
| Valeur de la communication | Communiquer change-t-il vraiment le résultat ? | Écart de résultat entre *aucun signe*, *la forme de la variante* et *tout dire* (cartes révélées). Un écart nul : la communication est décorative. Un écart énorme avec « tout dire » : le jeu se joue à main ouverte et l'effet leader menace |
| Part captée par la forme permise | Les règles d'échange sont-elles bien calibrées ? | Part de l'écart *aucun signe → tout dire* que la forme permise récupère (bande verte : 40 à 80 %). Trop faible : la limite frustre. Trop forte : elle ne limite rien |
| Interdépendance des programmations | Faut-il vraiment se coordonner ? | Pour les décisions de programmation, part de la valeur d'une carte qui dépend de ce que jouent les autres (le bot fort réévalue la même décision en changeant les choix des autres) |
| Échecs de coordination | Ce que coûte le silence | Sans signe : zones défendues deux fois, zones oubliées, sabotages sans allié (R3.4). Fréquence et coût en forêt |
| Débit utile | Combien de signes faut-il ? | Nombre de traces ou d'annonces minimal pour récupérer 80 % de l'écart ; sert aussi d'estimation du temps de conseil (donc de la durée) |
| Valeur du présage après la communication | La règle « communication puis présage » compte-t-elle ? | Écart de résultat entre présage avant, après, ou sans présage |
| Coordination par convention | Se comprendre sans parler après le présage | Réussite de bots qui n'ont que des conventions publiques (ex. « le plus proche prend la zone ») : c'est le « moment de coordination réussie sans se parler » de Camille |
| Robustesse aux malentendus | Ce que coûte un joueur qui ne suit pas | Traces ou annonces suivies avec une probabilité p (novice, distrait, saboteur) : coût en résultat, à lire avec la table mixte de Nadia |
| Équité de parole | Qui décide ? | Part des signes et des décisions suivies, par siège ; écart *chef qui décide de tout* et *chacun pour soi* (4.2) |

**Rattachement aux objectifs.** Ces mesures forment le volet coordination de l'objectif 3 (« chaque peuple compte, aucun ne suffit »), et nourrissent la lecture des profils Camille, Nadia, Hélène (effet leader) et Thomas (solo). Pas de cinquième objectif.

**Statut des mesures.** Ce sont des *indices* : des bots échangent des signes, ils ne conversent pas. La qualité réelle des échanges, la tricherie et le plaisir de communiquer relèvent des tests humains.

### 3.6 Valider les mesures avant de s'en servir
Une mesure doit reconnaître des défauts connus avant de juger des variantes inconnues.
- **Témoins existants** : la maquette v0 (barrage contourné, sommeil par échec), la v1 avec rêves illimités, la v1 avec fin vérifiée en fin de tour.
- **Témoins cassés exprès** : les formes de communication « aucun signe » et « tout dire » (la valeur de la communication doit les distinguer), un pouvoir qui ne fait rien (le jeu restreint doit le voir), un pouvoir qui gagne seul (la dominance doit le voir), des dés truqués (la part du hasard doit bouger), un Méchant qui n'apprend plus (le test d'apprentissage doit le voir).
- **Stabilité** : une mesure qui change de verdict quand on passe d'un bot fort à un autre décrit les bots, pas le jeu.

Ces témoins deviennent des tests automatiques, à côté des 67 tests actuels ; le contrôle de conformité s'étend aux mesures (chaque mesure a au moins un témoin).

## 4. Les bots

### 4.1 L'échelle

| Niveau | Bot | Sert à | Coût |
|---|---|---|---|
| 0 | Aléatoire | Robustesse, plancher | Négligeable |
| 1 | Glouton à styles | Variété, tri en masse | Faible |
| 2 | Glouton réglé | Ses poids sont optimisés pour chaque variante (par une petite recherche évolutionnaire, CMA-ES) : assez fort, et rapide une fois réglé | Moyen, à chaque variante |
| 3 | MCTS déterminisé | Force ; mesures de stratégie ; comparaison des options de la v2 | Élevé |
| 4 | Devin | MCTS qui connaît les dés : mesure du hasard | Élevé |
| Contrôle | Bot fort d'une autre famille | Vérifier les finalistes ; jamais utilisé pendant la recherche | Variable |

Le glouton a reçu en phase 1 des règles simples pour les décisions propres à la v2 (voie du rêve, traces, partage, lunes), assez pour un tableau de bord ; les comparaisons de la phase 3 reposent sur le bot fort. Constat de la phase 1 : avec le glouton, la forme de communication ne change pas le résultat (« Phase 1 - avancement »).

### 4.2 Trois façons de coopérer
- *Central* : un seul cerveau pour l'équipe (borne haute, et image du joueur dominant).
- *Chacun pour soi* : chaque bot décide avec ses propres priorités et quelques conventions publiques.
- *Communication partielle* : chacun pose ses traces (ou fait son annonce) avant de programmer, dans la forme permise par la règle (3.5). Les bots reçoivent ce canal : décision « annonce » au conseil, et lecture des signes des autres comme information publique.

L'écart entre central et chacun pour soi mesure ce que la coordination rapporte. À lire avec prudence : il faut que la coordination compte (Camille), sans qu'un seul joueur puisse tout calculer pour les autres (Hélène qui rechute). La taille du plan d'ensemble (le nombre de combinaisons qu'un chef devrait comparer) complète la mesure : plus elle est grande, moins un joueur humain peut diriger la table, ce qui rejoint l'argument d'Antoine Bauza sur *Ghost Stories*.

### 4.3 Les styles du panel (proposition)
Le glouton reçoit des réglages : prudence (seuil de menace), goût du rêve, sabotage ou barrage, préférence pour les alliances, et un bruit de décision (il choisit parfois une option moins bonne) pour les novices.

| Profil | Style de bot |
|---|---|
| Hélène | MCTS à fort budget |
| Jean-Marc | Audacieux : vise une fin provoquée, sabote plutôt que barrer |
| Malik | Audacieux, préfère les coups rares (alliances, pouvoirs) |
| Camille | Conventions de coordination, communication partielle |
| Sophie | Prudente, rêve volontiers |
| Nadia | Bruit élevé, suit les conventions des autres |
| Thomas | Un seul bot qui pilote deux ou trois peuples |

Des tables mixtes (déjà notées nécessaires) mesurent le coût d'un joueur faible.

### 4.4 Valider les bots
- Force croissante avec le budget, et nettement au-dessus du glouton.
- **Test de bon sens** : sans qu'on le lui dise, le bot fort doit redécouvrir que rêver domine en v1, jouer Tenir quand c'est utile et placer sa présence mieux que le hasard.
- Résultats stables entre deux séries de graines et entre deux budgets proches.

### 4.5 Coût de calcul
Le moteur v1 joue environ 330 parties par seconde sur 2 cœurs avec les bots simples (mesuré le 11 oct. : référence complète en 342 s ; glouton seul, 66 parties par seconde et par cœur en duo). Un MCTS qui simule quelques centaines de suites de partie à chaque décision sera des milliers de fois plus lent : de l'ordre de la minute par partie et par cœur (estimation, à mesurer en phase 2). D'où :
- le MCTS réservé au diagnostic, à la comparaison des options de la v2 et aux finalistes, et la qualité des choix calculée sur un échantillon de décisions ;
- le profilage et l'accélération du moteur, des parties en parallèle sur plusieurs cœurs ;
- le glouton réglé comme intermédiaire ;
- les longues campagnes sur les exécuteurs de GitHub (décision 10, « Cahier des charges - environnement de calcul cloud »). La comparaison des options de la v2 alourdit la phase 3 : environ 20 variantes à une option près autour de « V2 proposée », à estimer en phase 2.

## 5. L'exploration des variantes

### 5.1 Le catalogue des variables
Le catalogue complet est dans « Objectifs, invariants et catalogue » (section 5), organisé selon l'arbre de l'atelier v2 : le Méchant et ses Machines, les peuples, le tour et le conseil, le moteur des rêves et les fins, le plateau et les Machines, plus les variables propres à la v1, la difficulté, ce qui est hors recherche et les témoins.

### 5.2 Trois étages
1. **Criblage.** Quelques centaines de variantes tirées selon un plan de Morris (on fait varier les variables une à une à partir de nombreux points de départ), jouées par des bots rapides. On obtient le classement des variables par influence sur chaque objectif, et leurs interactions. Les variables sans effet sont fixées à leur valeur la plus simple. *Sous-produit utile même sans algorithme génétique : savoir ce qui fait bouger le jeu.*
2. **Recherche qualité-diversité (MAP-Elites)** sur les 8 à 12 variables influentes de la v2 fixée par l'auteur.
   - Filtre : niveau 1 de la batterie.
   - Qualité : le plus faible des objectifs d'expérience (normalisés), pour qu'aucun ne soit sacrifié aux autres.
   - Axes de la carte, au choix de l'auteur : par exemple part du hasard × durée, ou fin la plus fréquente × profondeur, ou valeur de la communication × durée. La durée étant un axe et non un filtre, la carte peut contenir des variantes longues à côté de variantes courtes.
   - Bruit : mêmes graines, course d'élimination, réévaluation des élites à chaque génération.
   - Étalon : recherche au hasard à budget égal.
3. **Réévaluation des finalistes** : bots forts et bots de contrôle, toutes les compositions, plus de parties ; jeu restreint et qualité des choix sur eux seuls ; explication de chaque finaliste par ablation (on annule ses changements un à un, comme la campagne « effet de chaque décision » de la v1).

### 5.3 Ce que la recherche rend
- Une carte des variantes, avec un tableau de bord pour la parcourir ; chaque variante a son code d'atelier, que l'auteur peut charger pour en lire le livret.
- Ce qui fait bouger chaque objectif.
- Trois à cinq candidats commentés, dont des candidats pour les modes famille et expert.

L'auteur choisit, la maquette suivante est écrite, les tests humains jugent.

## 6. Plan d'action

| Phase | Contenu | Livrable | Décision de l'auteur | Taille |
|---|---|---|---|---|
| 0. Cadrer | Objectifs d'expérience et leurs mesures ; échelle de résultats ; invariants ; catalogue des variables selon l'arbre de l'atelier ; grilles des profils avec seuils provisoires | « Objectifs, invariants et catalogue » (fait) | Valider | Légère, sans calcul |
| 1. Mesurer, et coder la v2 | a. Copie d'état ; journal des décisions avec les options proposées. b. Canal de communication sous la forme v2 (traces, partage, aucun signe, tout dire) et présage ; R2.1 alignée sur le livret. c. La v2 dans le moteur, nœud par nœud, avec une conformité par nœud de l'atelier et un lecteur du code de variante. d. Bilan sans bonus ; module de mesures (niveaux 1 et 2, coordination) ; témoins ; tableau de bord de la v1 et de « V2 proposée » | « Batterie d'évaluation (phase 1) » et tableau de bord (faits le 12 oct.) | Valider les mesures ; fixer les bandes définitives (fait : B1 à B4) | Lourde (le chantier v2 est du même ordre que la refonte v1) |
| 2. Bots | MCTS déterminisé et son échelle ; devin ; modes de coopération et annonces ; styles du panel ; tables mixtes ; validation | « Bots - échelle et validation » | Valider la force des bots | Lourde |
| 3. Diagnostiquer et trancher | Batterie entière avec les bots forts sur la v1 (15 duos et 20 trios) ; comparaison des options des décisions ouvertes de la v2, une à une autour de « V2 proposée » | « Diagnostic v1 et options v2 » : problèmes classés par gravité, options comparées | L'auteur fixe la v2 ; alternatives confiées à la recherche | Moyenne à lourde, calcul long |
| 4. Explorer | Criblage ; MAP-Elites sur la v2 fixée ; étalon au hasard | Carte des variantes, candidats | Choisir les axes ; présélectionner | Lourde, calcul long |
| 5. Valider | Finalistes avec bots de contrôle ; ablation ; lecture par profil ; fiches papier | « Candidats v3 » et fiches de test | Choisir la v3 et ses modes | Moyenne |

**Notes.**
- **Moteur** : depuis le 11 oct. au soir, le projet contient le moteur complet (`claude/moteur-v1/`, 31 fichiers identiques à l'archive `foret_moteur_v1.zip`). Joindre le zip le plus récent reste le moyen le plus simple de le relancer.
- **Copie d'état et journal des décisions (faits le 12 oct., moteur 1.1)** : `Partie.copie()` copie une partie en cours, au début d'un segment ou pendant une décision, avec un autre hasard ou des choix imposés ; `JournalDecisions` note chaque décision avec ses options. 106 tests ; campagne de référence complète rejouée à l'identique. Voir le README du moteur.
- **Communication et présage (faits le 12 oct., moteur 1.2)** : R2.1 alignée sur le livret, R2.5 (cinq formes) et R2.6 (présage) ; variante `reference_1_0` pour rejouer la référence publiée.
- **La v2 dans le moteur (faite le 12 oct., moteur 1.3)** : `maquettes/v2.json` (« V2 proposée », hérite de la v1) et lecteur du code de variante de l'atelier (`charger("v2", "code:…")`). La conformité s'appuie sur les identifiants des nœuds de l'atelier (`docs/noeuds_v2.md`, `python -m foret.conformite --v2`) : chaque nœud codé a son code et au moins un test. Non codés : B4, les idées verrouillées, le gabarit g1. Le moteur retrouve exactement les calculs de menace de l'atelier.
- **Batterie d'évaluation (faite le 12 oct., moteur 1.4)** : `foret/mesures.py`, `foret/batterie.py`, bot inerte, témoins `temoin_*` ; 28 mesures (4 attendent le bot fort), 21 témoins sur 26 réussis, 96 200 parties jouées par le glouton. Constats (indices) : le rêve domine en v1 comme en V2 ; la V2 concentre moins la menace et demande quinze fois moins de départages ; un peuple seul garde l'essentiel de la forêt, ce qui rend la synergie additive négative par construction (décision B2). Voir « Batterie d'évaluation (phase 1) ».
- **Phase 2 (faite le 13 oct., moteur 1.7)** : bot Monte-Carlo déterminisé (`foret/bots/mc.py`), modes central et chacun pour soi, devin, taux de rêve imposé, tables mixtes, bot bruité. Constats (indices) : le bot fort garde 94 % de la forêt en v1 et 88 % en v2 ; en v1, il fait mieux sans rêver ; le devin gagne 16 à 19 points ; le chef unique rapporte 2 à 5 points ; la coordination n'est pas encore mesurable. Voir « Bots - échelle et validation ». Validé par l'auteur le 13 oct. (MC 64 chacun pour soi, plan réduit, bot qui communique).
- **Phase 3 (diagnostic fait le 13 oct., moteur 1.7.1)** : bot qui communique, plan réduit du bot fort, mesures du bot fort (tape-taupe, gain du bot libre, dilemmes, chef unique), jeu restreint, options de la v2, robustesse au bonus ; 14 campagnes et batteries sur GitHub. Constats (indices) : en v1, la menace est résolue, rêver ne compte pas pour le bot fort et un peuple suffit ; en V2, le rêve finit la partie au tour 3 et aucune option seule ne corrige la durée ; les traces récupèrent 66 % de la coordination. Voir « Diagnostic de la v1 et options de la v2 ». **Décision de l'auteur attendue : fixer la v2 (3.7).**
- **Phase 3 (prévision d'origine)** : elle confirmera sans doute les problèmes déjà visibles en v1 (rêve dominant, Barrer devenu l'arme principale, silence qui repose sur les mammifères, menace concentrée au départ) et dira si la v2 les corrige. Elle compare les options des neuf décisions ouvertes de la v2 (sauf la septième, le bonus, déjà tranchée). Les corrections de structure reviennent à l'auteur ; les réglages et les alternatives vont à la phase 4.
- **Premier lot recommandé** : la phase 0, puis la phase 1, avec le début de la phase 2.
- **Cycle** : après les tests humains, on reprend en phase 3 avec la v3. Si une mesure contredit régulièrement les testeurs, on la revoit.

## 7. Phase 0 : objectifs et échelle retenus
Le détail (mesures, bandes provisoires, invariants, catalogue, profils, décisions A1 à A13) est dans « Objectifs, invariants et catalogue ».

### Objectifs d'expérience (validés le 11 oct.)

| Objectif | Mesures |
|---|---|
| **La menace est lisible mais jamais résolue** | Concentration de la menace dans une plage cible ; surprise ; test du tape-taupe |
| **Défendre ou rêver reste un dilemme** | Meilleur taux de rêve intermédiaire et variable selon la situation ; aucune stratégie pure au niveau du bot libre ; part de dilemmes |
| **Chaque peuple compte, aucun ne suffit** (avec le volet coordination) | Contributions de Shapley proches ; synergies positives ; aucun joueur spectateur ; communication utile mais limitée ; effet leader modéré |
| **La bataille se joue jusqu'au dénouement** | Issue incertaine jusqu'au dernier tiers ; menace croissante ; pas de spirale précoce |

Un garde-fou transverse, tiré des souhaits : *aucun effort n'est vain* (plancher de résultat, et chaque gain de niveau des bots améliore le résultat).

**Durée (modifié le 11 oct., soir).** Le garde-fou « 30 min à 1 h » est retiré : l'auteur est prêt à envisager un jeu plus long s'il est bon. La durée devient une mesure d'information et un axe de lecture de la carte de variantes. Elle ne joue contre une variante que de deux façons : un jeu qui ne se termine pas (filtre de robustesse), et un jeu long dont le temps est vide (attente élevée, densité de décisions faible), jugé dans la batterie du niveau 1.

### Échelle de résultats (modifiée le 12 oct.)
Le bot fort a besoin d'une valeur à maximiser : **la forêt restante, quelle que soit la fin**, en v1 comme en v2. Une fin précoce rapporte déjà les arbres qu'elle protège. Le bonus selon la fin (décidé à +10 % le 11 oct., ramené à 0 le 12 oct.) reste au catalogue : les conclusions sont vérifiées avec un bonus de 10 et 25 % pour une fin provoquée. Le plan « demain » (avec quoi le Méchant reviendra-t-il ?) reste à définir ; il nourrit l'épilogue, pas le résultat.

### Priorités du catalogue
Les quatre problèmes déjà visibles en v1 : le rêve dominant, Barrer devenu l'arme principale, le silence qui repose sur les mammifères, des critères qui ne forment pas encore un réseau de tensions. La v2 répond à plusieurs d'entre eux (silence retiré, tactiques dans le rayon de la Machine, lunes) ; la phase 3 dira dans quelle mesure.

## 8. Risques et parades

| Risque | Parade |
|---|---|
| Mesurer les bots au lieu du jeu | Bot fort indépendant des règles ; échelle de bots ; verdicts stables d'un bot fort à l'autre |
| Optimiser les chiffres au lieu du jeu | Invariants ; témoins ; bots de contrôle ; parcimonie ; veto de l'auteur |
| Coût de calcul | Criblage ; plusieurs fidélités ; course d'élimination ; MCTS réservé au diagnostic, aux options de la v2 et aux finalistes |
| Bot central = coordination parfaite | Comparer central et chacun pour soi ; tests humains |
| Fausse précision | Chaque mesure étiquetée (mesure, indice, humain seulement) ; intervalles de confiance |
| Perte de l'identité du jeu | Invariants ; mécaniques nouvelles seulement par l'auteur |
| Code qui grossit | Registres existants ; tests ; contrôle de conformité étendu aux nœuds de l'atelier et aux mesures |
| Écart entre l'atelier et le moteur | Le moteur lit le code de variante de l'atelier ; chaque nœud a son test ; une fiche de l'atelier dit si le moteur sait le jouer |

## 9. Ce que ce plan ne fait pas
- **Il ne juge pas le plaisir** : c'est le rôle des tests humains.
- **Il ne remplace pas la conception** : les mécaniques nouvelles viennent de l'auteur, la recherche choisit et règle.
- **Il ne juge pas la qualité des échanges réels** : des bots échangent des signes, ils ne discutent pas ; le ton, la tricherie et le plaisir de communiquer restent aux tests humains.
- **Il ne garantit pas l'équilibre réel** : les mesures décrivent des bots ; les tests humains les recalibrent.

## 10. Décisions de l'auteur
1. **(11 oct.) Ordre des phases : les défauts structurels sont corrigés à la main avant toute recherche.** Diagnostic avec un bot fort (phase 3), corrections de structure par l'auteur (v2), puis seulement criblage et recherche. Complétée par la décision 8.
2. **(11 oct.) Objectifs d'expérience : les quatre objectifs de la section 7 sont retenus, avec le garde-fou « aucun effort n'est vain ».** Ils restent révisables après la phase 1. Le garde-fou de durée (« 30 min à 1 h ») a été retiré le 11 oct. au soir : la durée est une mesure, jamais un filtre éliminatoire.
3. **(11 oct.) Échelle de résultats : forêt restante plus un bonus selon la fin.** Le bonus est une variable du catalogue ; les conclusions doivent tenir quand il varie. Sa valeur a été fixée à +10 % (A3), puis à 0 par la décision 7.
4. **(11 oct.) Algorithme : MAP-Elites**, avec la recherche au hasard à budget égal comme étalon.
5. **(11 oct.) Calcul : développement et essais dans l'espace de travail de Claude ; les grosses campagnes sont à héberger plus tard.** L'auteur souhaite chercher ensemble une solution cloud de capacité adaptée et de faible coût, à régler avant la phase 2 (premiers calculs lourds du bot fort). Voir « Cahier des charges - environnement de calcul cloud ».
6. **(11 oct.) Évaluation de la communication entre joueurs intégrée** (section 3.5), avec un canal de communication à ajouter au moteur ; elle forme le volet coordination de l'objectif 3 (A4).
7. **(12 oct.) Bonus de fin à 0, pour la v1 et la v2** (A12) : le résultat est la forêt restante ; robustesse vérifiée à 10 et 25 %. Tranche aussi la décision 7 de la maquette de conception v2.
8. **(12 oct.) La simulation éclaire les décisions ouvertes de la v2** (A13). La v2 est codée dans le moteur en phase 1, après les outils de mesure ; la phase 3 diagnostique la v1 et compare les options de la v2 ; l'auteur fixe ensuite la v2, sur laquelle porte la recherche de la phase 4.
9. **(12 oct.) Fin de la phase 1 : mesures validées, bandes gelées** (B1 à B4, « Batterie d'évaluation (phase 1) »). Bandes de la phase 0 gelées pour le cycle, sauf la synergie, redéfinie (le duo bat son meilleur peuple seul ; tétraèdre par la synergie relative) ; siège spectateur tenu par un bot qui ne fait rien ; « voir_trahi » et l'abattage en chemin (v1) deviennent des cas permis (moteur 1.5).
10. **(12 oct.) Calcul : les exécuteurs de GitHub (GitHub Actions)**, dans le dépôt public `Projet_Jeu` (règle la décision 5). Gratuit pour un dépôt public ; 20 tâches de 4 cœurs à la fois, 6 heures par tâche, soit environ 480 heures-cœur par vague. Risque à surveiller : les conditions d'usage de GitHub excluent le calcul sans rapport avec le projet logiciel ; volumes raisonnables et lanceur portable vers une machine louée. Voir « Cahier des charges - environnement de calcul cloud », section 10.

## Sources
- Jaffe, Miller, Andersen, Liu, Karlin, Popović (2012), « Evaluating Competitive Game Balance with Restricted Play », AIIDE. Le jeu restreint.
- Nielsen, Barros, Togelius, Nelson (2015), « General Video Game Evaluation Using Relative Algorithm Performance Profiles », EvoApplications. La profondeur mesurée par l'écart entre bots de niveaux différents.
- Cowling, Powley, Whitehouse (2012), « Information Set Monte Carlo Tree Search », IEEE TCIAIG. MCTS avec informations cachées.
- Mouret et Clune (2015), « Illuminating search spaces by mapping elites ». https://arxiv.org/abs/1504.04909
- Deb, Pratap, Agarwal, Meyarivan (2002), « A Fast and Elitist Multiobjective Genetic Algorithm: NSGA-II », IEEE TEC.
- Browne et Maire (2010), « Evolutionary Game Design », IEEE TCIAIG. Jeux conçus par évolution et critères esthétiques mesurés en simulation.
- Isaksen, Gopstein, Nealen (2015), « Exploring Game Space Using Survival Analysis », FDG. Exploration systématique des variantes d'un jeu.
- de Mesentier Silva, Lee, Togelius, Nealen (2017), « AI-based Playtesting of Contemporary Board Games », FDG. Bots de styles différents sur *Les Aventuriers du Rail*.
- Morris (1991), « Factorial Sampling Plans for Preliminary Computational Experiments », Technometrics. Le criblage.
- López-Ibáñez et al. (2016), « The irace package: Iterated racing for automatic algorithm configuration », Operations Research Perspectives. Les courses d'élimination.
- Hansen (2016), « The CMA Evolution Strategy: A Tutorial ». https://arxiv.org/abs/1604.00772
- Shapley (1953), « A Value for n-Person Games ».
- Elias, Garfield, Gutschera (2012), *Characteristics of Games*, MIT Press. Hasard et compétence.
