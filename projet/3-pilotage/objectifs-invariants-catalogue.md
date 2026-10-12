# Objectifs, invariants et catalogue (phase 0)

*Statut (12 oct. 2026) : phase 0 du plan d'action, arbitrée par l'auteur (décisions A1 à A13, section 8), **mise à jour pour la maquette de conception v2** (« Atelier de la Forêt qui rêve », https://claude.ai/artifact/WJiQMwXDJEDwVvAERsDWss). **Validée par l'auteur le 12 oct. 2026.** **Bandes définitives depuis la fin de la phase 1 (décisions B1 à B4 du 12 oct., section 8)** : les bandes provisoires ont été passées sur les variantes témoins (« Batterie d'évaluation (phase 1) ») et gelées telles quelles pour le cycle, sauf la synergie, redéfinie.*
*Sources : « Synthèse des idées - revue du 11 oct. 2026 » (notes), « Maquette de conception v2 - plan du Méchant, fins, conseil » et l'atelier v2, code du moteur v1, livret de la maquette HTML v1, « Plan d'action - évaluer et explorer les variantes par la simulation », « Panel de joueurs virtuels - ébauche ».*

## En bref
- **Deux maquettes à évaluer.** La v1 reste la référence publiée du moteur. La v2 est un arbre de variantes (l'atelier) avec neuf décisions encore ouvertes. Le catalogue suit désormais cet arbre : *socle*, *choix* (une option exactement), *modules*, *paramètres*. La simulation sert à éclairer ces décisions en phase 3, avant que l'auteur fixe la v2 (A13).
- **Cinq statuts pour la recherche** : *invariant*, *libre*, *module*, *témoin* (valeur connue pour être mauvaise, gardée pour valider les mesures), *hors recherche*. S'y ajoute, pour la v2, *à trancher en phase 3* : un choix que la simulation compare et que l'auteur fixe ensuite. Les notes de la synthèse donnent le statut (A1) : 9-10 invariant, 8 invariant de principe, 6-7 libre, 5 module, 0 exclu.
- **Le résultat est la forêt restante, sans bonus (A12, remplace A3).** Le bot fort cherche à maximiser les arbres sauvés, en v1 comme en v2. La robustesse des conclusions est vérifiée avec un bonus de 10 et de 25 %.
- **La v1 de référence suit le livret (A2)** : conseil en trois temps, avec le présage. Une variante `sans_presage` rejoue la référence publiée.
- **Quatre objectifs, pas de cinquième (A4)** ; la communication, des traces en v2, est le volet coordination de l'objectif 3. Les grilles des profils servent à lire, pas à trier (A10).
- **La v2 répond déjà à deux constats de la phase 0** : la menace concentrée au départ (53 % sur les deux zones les plus menacées selon l'atelier, contre 100 % en v1 ; calcul fait dans la discussion de conception, à revérifier avec le moteur) et la limite de rêves qui grandit avec la table (les lunes).

## 1. Statuts et règle de passage (A1, A11, A13)

| Note de l'auteur | Statut |
|---|---|
| 9-10 | Invariant |
| 8 | Invariant de principe : le principe reste, ses réglages chiffrés sont libres |
| 6-7 | Libre : réglages et alternatives |
| 5 | Module, désactivé par défaut |
| 1-4 sur une forme précise | Libre et prioritaire : explorer d'autres formes (exemple : la liste des critères, notée 4) |
| 1-4 sur une piste écartée ou remplacée | Hors recherche (le sac, le paquet, l'inversion oiseaux/insectes) |
| 0 | Hors recherche |

Compléments :
- **Les dix décisions du 11 oct. sont des invariants** ; leur ancienne forme v0 devient un *témoin*. Pour une limite (rêves, Hanter, embuscade), c'est l'existence de la limite qui est invariante ; sa valeur reste libre (A11).
- **Les détails techniques sont hors recherche** (départages, zones rasées non visées, premier joueur tournant, pas d'action « soutenir », organes d'Enrayer et d'Égarer). Seule leur charge pour les joueurs est mesurée (A11).
- **Les choix ouverts de l'atelier sont « à trancher en phase 3 »** (A13). La simulation compare leurs options autour du préréglage « V2 proposée » ; l'auteur fixe ensuite la v2. L'option retenue devient le socle ; les autres deviennent des alternatives que la recherche n'explore pas, sauf décision contraire. Les paramètres de la v2 restent libres pour la phase 4.

## 2. Objectifs d'expérience et bandes provisoires
Bandes : **vert** (sain), **orange** (entre les deux), **rouge** (défaut). Étiquettes : *mesure* (calculée directement), *indice* (dépend d'un bot ou d'un modèle, à confirmer par des humains), *humain seulement*. Méthode (A5) : la phase 1 joue chaque mesure sur ses témoins, sur la v1 et sur « V2 proposée ». Un témoin connu pour être mauvais qui ne tombe pas en rouge signale une mesure à revoir, pas un seuil à déplacer. **Fin de la phase 1 (B1, 12 oct.) : les bandes ci-dessous sont définitives et gelées pour tout le cycle.** Aucun témoin raté ne demandait de déplacer un seuil.

**Une seule définition pour les deux maquettes.** Les mesures sont écrites pour ne pas dépendre de la forme du plan du Méchant. La menace d'une étape se calcule en jouant les 36 tirages de dés sur une copie de l'état, sans défense : elle vaut pour la piste unique de la v1 comme pour les deux pistes de la v2.

### Objectif 1 : la menace est lisible mais jamais résolue (A6)
| Mesure | Étiquette | Vert | Rouge |
|---|---|---|---|
| Concentration : part de la menace d'une étape portée par les *k* zones les plus menacées (*k* = nombre de joueurs), moyenne sur les étapes jouées | mesure | 50 à 80 % | moins de 35 % (illisible) ou plus de 90 % (résolue) |
| Surprise : part des ordres tirés hors des deux tactiques les plus probables au moment du tirage. En v2, la même part est donnée pour la Machine désignée, à titre d'information | mesure | 20 à 45 % | moins de 10 % ou plus de 60 % |
| Tape-taupe : écart entre un bot qui pare toujours la menace la plus probable et le bot fort | indice (bot fort) | écart ≥ 10 % | écart < 3 % |

### Objectif 2 : défendre ou rêver reste un dilemme (A7)
| Mesure | Étiquette | Vert | Rouge |
|---|---|---|---|
| Meilleur taux de rêve fixe (0 ; 0,5 ; 1 ; 2 cartes par tour…), bot fort contraint. En v2, mesuré aussi par voie (sommeil, réveil) | mesure (bot fort) | intermédiaire | 0 ou le maximum permis |
| Gain du bot fort libre sur le meilleur taux fixe | indice | ≥ 5 % | < 1 % |
| Dilemmes parmi les décisions non forcées | indice (bot fort, sur échantillon) | ≥ 30 % | < 10 % |

### Objectif 3 : chaque peuple compte, aucun ne suffit, et l'on se coordonne sans tout se dire (A8)
| Mesure | Étiquette | Vert | Rouge |
|---|---|---|---|
| Contributions de Shapley des six peuples | mesure | toutes entre 0,7 et 1,3 fois la moyenne | une hors de 0,5 à 1,5 |
| Synergies (B2) : duos qui battent leur meilleur peuple joué seul ; et, pour le tétraèdre, synergie relative entre duos (écart de chaque duo à ce qu'annoncent ses deux peuples dans les autres duos) | mesure | au moins 12 duos sur 15 ; et les 3 duos complets dans le premier tiers de la synergie relative | moins de 8 duos sur 15 |
| Pire table / meilleure table | mesure | ≥ 70 % | < 50 % |
| Aucun spectateur : impact de chaque siège (perte quand il ne fait plus rien, bot inerte, B3) | indice | chaque siège ≥ 50 % de l'impact moyen | un siège < 25 % |
| *Coordination* : part de l'écart entre les témoins « aucun signe » et « tout dire » récupérée par la communication de la variante (conseil parlé en v1, traces ou partage en v2) | indice | 40 à 80 % | < 20 % (la limite frustre) ou > 95 % (elle ne limite rien) |
| *Coordination* : gain d'un chef unique sur « chacun pour soi » | indice | 5 à 20 % | < 2 % (solitaire à plusieurs) ou > 35 % (effet leader) |

### Objectif 4 : la bataille se joue jusqu'au dénouement (A9)
| Mesure | Étiquette | Vert | Rouge |
|---|---|---|---|
| Partie jouée d'avance : issue (au-dessus ou au-dessous de la médiane) prédite depuis l'état à la fin du tour 2 sur 6 | mesure | précision < 65 % | > 80 % |
| Incertitude restante au début du dernier tiers (simulations depuis l'état ; copie d'état requise) | mesure | ≥ la moitié de l'incertitude initiale | < le quart |
| Fins avant la mi-partie (bot fort) | mesure | ≤ 20 % | > 40 % |
| Menace croissante : ordres réussis et Machines actives, dernier tiers / premier tiers | mesure | ≥ 1 | < 2/3 |

### Garde-fou : aucun effort n'est vain (A9)
| Mesure | Étiquette | Vert | Rouge |
|---|---|---|---|
| Plancher : forêt gardée par le pire décile, bot fort | mesure | ≥ 40 % | < 25 % |
| Échelle des bots : aléatoire < glouton < MCTS faible < MCTS fort | mesure | chaque marche significative | une marche nulle ou inversée |

**La durée** n'est jamais un filtre. Elle est mesurée (tours joués, décisions par joueur, temps estimé) et sert d'axe de lecture de la carte. Elle ne pèse contre une variante que si le jeu ne se termine pas, ou si le temps est vide (attente élevée, densité de décisions faible). Le temps estimé est un *indice* : un temps par décision non forcée, un temps par décision forcée, et un temps de conseil par tour qui dépend du nombre de traces ou d'annonces, à recaler sur les premiers tests humains.

## 3. Échelle de résultats (A12, remplace A3)
**Résultat = forêt restante, quelle que soit la fin**, en v1 comme en v2. Une fin précoce rapporte déjà les arbres qu'elle protège. Le bonus selon la fin reste une variable : les conclusions des phases 3 à 5 sont vérifiées avec +10 % et +25 % de la forêt initiale pour une fin provoquée (sommeil et silence en v1, sommeil et réveil en v2). Si elles changent, ce sera dit.

## 4. Invariants

| Invariant | Note | Ce que la recherche ne peut pas changer |
|---|---|---|
| Le thème et la bataille sur deux plans | 10 | Un plateau (Machines, forêt) et une tête du Méchant (piste des pensées) |
| Coopératif asymétrique, sans joueur Méchant | 9 | Le Méchant et ses Machines sont automatiques |
| La piste des pensées | 9 | 11 cases de 2 à 12, lues avec la somme de deux dés ; une tuile par case ; publique ; apprendre = échanger avec une voisine. La v2 y ajoute une piste des Machines lue par l'écart des dés (choix à trancher) |
| Le tétraèdre | 9 | 4 compartiments, 6 peuples, chacun sur une paire unique ; l'attribution actuelle des paires est conservée |
| Chaque peuple brise une règle | 9 | Une règle brisée par moitié de carte ; pas de bonus chiffrés à la place ; les pouvoirs restent actifs (sans pouvoirs = témoin) |
| Pas de défaite | 9 | Le résultat est la forêt restante ; la nuit termine la journée ; les autres fins sont provoquées par les joueurs (sommeil et silence en v1 ; sommeil et réveil de la forêt en v2, le silence étant retiré à la demande de l'auteur) |
| Défendre ou rêver | 9 | Le rêve existe et coûte de la défense ; aucune variante sans rêve |
| *Principes notés 8* | 8 | Actions de base pour tous ; alliance ; on n'attaque que les Machines ; apprentissage par renforcement ; mémoire publique ; côtés éveil et rêve, oubli en 12 ; tir à la corde ; trois façons d'agir ; les reptiles contrent sans détruire |
| *Décisions du 11 oct.* | – | Barrage qui fait échouer l'ordre ; échec face à un esprit qui reste en place ; une limite de rêves (sa valeur est libre) ; réussite = l'ordre a eu un effet ; une limite à Hanter et à l'embuscade (sa valeur est libre) ; plateau sans symétrie ; présence posée par les joueurs ; fin immédiate ; présage après la communication (A2) |

**Point de vigilance sur les trois façons d'agir.** Sans le silence du chantier, désarmer ne mène plus à une fin : saboter ne vaut plus que par le temps gagné (une Machine remorquée repart de la lisière). Le jeu restreint de la phase 3 mesurera ce que coûte l'interdiction de Saboter en v2. Si la perte est faible, le principe « désarmer » (noté 8) est menacé.

## 5. Catalogue des variables, selon l'arbre de l'atelier
Colonnes : **Nœud** (identifiant dans l'atelier) ; **Type** (socle, choix, option, module, paramètre) ; **Valeurs** (la valeur proposée de la v2 en gras) ; **En v1** (ce que fait la maquette v1) ; **Statut** dans le plan ; **Moteur** (codé, partiel, à coder). Les neuf décisions ouvertes de la v2 sont notées D1 à D9, dans l'ordre du document de conception.

*Mise à jour du 12 oct. (phase 1c, moteur 1.3) : la colonne « Moteur » date de la phase 0. Depuis, tous les nœuds et réglages de l'atelier sont codés, sauf le module B4 (peuples des plans au conseil), les idées verrouillées (A6, A7, B5), le module retiré D7 et le gabarit de plateau g1. Détail et choix de modélisation : `claude/moteur-v1/docs/noeuds_v2.md`.*

### 5.A Le Méchant et ses Machines
| Nœud | Type | Valeurs | En v1 | Statut | Moteur |
|---|---|---|---|---|---|
| A1 Piste des pensées | socle | placement **fixe** ou au hasard ; esprits au départ **0** ou 1 | identique (disposition avec Renfort et Réparer) | invariant ; placement libre ; esprits = difficulté | codé |
| A2 Plan du Méchant (D1) | choix | **A2a qui et où** (l'écart désigne une Machine, la tactique choisit dans son rayon) ; A2b où et comment (l'écart désigne une manœuvre) ; A2c une seule piste | A2c | à trancher en phase 3 | A2c codé ; A2a, A2b à coder |
| A2a_d Doublé, écart 0 (D2) | choix | **le favori** (Machine de la case 1) ; branle-bas ; il hésite ; une sixième Machine | – | à trancher en phase 3 | à coder |
| Portée des tactiques (D3) | paramètre | **le rayon de la Machine** ; tout le plateau | tout le plateau | à trancher en phase 3 | à coder |
| Machine hors service désignée (D4) | paramètre | **remorquée au chantier** ; réparée d'un organe ; rien | sans objet (Réparer est une tuile) | à trancher en phase 3 | à coder |
| A3 Les quatre tactiques | socle | Cupidité, Opportunisme, Représailles, Percée (flèche imprimée en v2) | critères v1 | libre, prioritaire (liste notée 4) ; nouveaux critères proposés par l'auteur ou Claude | partiel |
| Représailles vise (D3) | paramètre | **la zone la plus défendue** ; la dernière zone attaquée | la dernière zone attaquée | à trancher en phase 3 | à coder |
| Disposition de départ | paramètre | v2 : 2 Percée, 3 Représailles, 4 Percée, 5 Représailles, 6 Opportunisme, 7 Cupidité, 8 Opportunisme, 9 Représailles, 10 Percée, 11 Cupidité, 12 Cupidité ; Machines sur la case de leur numéro | R1.3 | libre | v1 codé ; v2 à coder |
| A4 L'escalade du soir | module (exige A2a) | **absent** ; début au tour 4 ou **5** | – | module | à coder |
| A5 Le bruit | module | **absent** | absent (codé) | module | codé (v1) |
| A6 Les obsessions | module | idée verrouillée | retirées | hors recherche jusqu'à rédaction | – |
| A7 Pouvoirs des peuples sur les pistes | module | idée verrouillée | – | hors recherche jusqu'à rédaction | – |

### 5.B Les peuples et leurs actions
| Nœud | Type | Valeurs | En v1 | Statut | Moteur |
|---|---|---|---|---|---|
| B1 Peuples, personnages, présence | socle | main 4, **5**, 6 ; paquet 5, 6, **7** ; présence 2, **3**, 4 | identique | invariant de principe ; valeurs libres | codé |
| B2 Trois actions et l'alliance | socle | barrage : **entrer, sortir, abattre** ou entrer et abattre ; alliance : **même zone et même étape** ou saboter ensemble | barrage complet | invariant de principe ; barrage et alliance libres (contourner = témoin) | barrage partiel ; alliance codée |
| B3 Les règles brisées | socle | Voir : cartes par tour **sans limite**, 1, 2 ; Hanter : **1**, 2 par tour ; immobilisations : **1**, 2 par tour ; formes adaptées aux deux pistes | formes v1 | invariant (règles brisées) ; réglages libres ; formes nouvelles proposées par l'auteur | formes v1 codées ; adaptations v2 à coder |
| B4 Les peuples des plans au conseil | module (exige les traces) | **absent** | – | module (à rédiger et tester) | à coder |
| B5 Les effets propres des personnages | module | idée verrouillée | – | hors recherche jusqu'à la fin du travail de l'auteur | – |

### 5.C Le tour et le conseil
| Nœud | Type | Valeurs | En v1 | Statut | Moteur |
|---|---|---|---|---|---|
| C1 Le tour de jeu | socle | tours 4, 5, **6**, 7, 8 ; étapes 2, **3**, 4 | identique | libre (durée non pénalisée) | codé |
| C2 Communication au conseil (D8) | choix | **C2a les traces** ; C2b le partage (exige A2a) ; C2c le conseil parlé (table seulement) ; C2d aucun signe ; C2e tout dire | C2c | C2a, C2b à trancher en phase 3 ; C2d, C2e témoins | à coder |
| Traces : nombre posé par joueur | paramètre | 1, **2**, 3 | – | libre | à coder |
| Traces numérotées par étape | paramètre | **oui**, non | – | libre | à coder |
| Une trace engage | paramètre | **non**, oui | – | libre | à coder |
| Partage : jetons par joueur | paramètre | 1, **2** | – | libre | à coder |
| C3 Le présage | module | **présent** dans « V2 proposée » | présent (A2) | invariant de principe (A2) ; à mesurer (valeur du présage) | à coder |

Le conseil parlé (C2c) n'est pas modélisable tel quel. Le moteur l'approchera par des traces non numérotées, en nombre libre : elles disent « j'agirai ici » sans dire à quelle étape, comme le permet le livret v1. C'est une approximation, signalée comme telle dans les résultats.

### 5.D Le moteur des rêves et les fins
| Nœud | Type | Valeurs | En v1 | Statut | Moteur |
|---|---|---|---|---|---|
| D1 Rêver | socle | limite **un par joueur et par tour** ; deux ou trois par tour pour la table | un par joueur et par tour | invariant (la limite) ; valeur libre ; sans limite = témoin | codé (par joueur) |
| D2 Les deux voies du rêve | socle v2 | voie du sommeil (règle v1) et voie du réveil (le Cercle) | sommeil seulement | invariant de principe pour la v2 (demande de l'auteur) | à coder |
| D2v Comment un rêve nourrit les voies (D5) | choix | **au choix** ; les deux à la fois | – | à trancher en phase 3 | à coder |
| Seuil du Cercle (D6) | paramètre | 2, **3**, 4 cases par joueur | – | à trancher en phase 3, puis libre | à coder |
| D3 Les trois fins | socle | long sommeil, **réveil de la forêt**, nuit ; immédiates | sommeil, silence, nuit | invariant (pas de défaite) | partiel |
| D4 Le bilan (D7) | socle | bonus **0** ; 10 % ; 25 % | forêt seule (A12) | décidé (A12) ; 10 et 25 % pour la robustesse | à coder |
| D5 Les lunes (D9) | module | **absent** jusqu'à trois joueurs, présent au-delà (proposition) ; 1, **2**, 3 lunes par tour | – | à trancher en phase 3 | à coder |
| D6 Le dernier sursaut | module | **absent** ; 1 à **3** plans | absent (codé) | module | codé (v1) |
| D7 Le silence du chantier | module | retiré en v2 | présent | v1 seulement | codé |

### 5.E Le plateau et les Machines
| Nœud | Type | Valeurs | En v1 | Statut | Moteur |
|---|---|---|---|---|---|
| E1 Le plateau | socle | **v1 (7 zones)** ; gabarits à dessiner ; flèches de percée en v2 | v1 | libre par gabarits | codé (flèches à coder) |
| E2 Les Machines | socle | organes R1.2 ; zones d'entrée (v2) ; Machines au chantier au départ 0, 1, **2** | 3 en jeu, 2 en réserve | difficulté ; effets des organes libres | codé (zones d'entrée à coder) |

### 5.F Variables propres à la v1 (piste unique)
Elles ne servent qu'à la v1 et au préréglage « Héritage v1 » : tuiles Réparer (avec ou sans Machine HS) et Renfort ; critères v1 (Représailles sur la dernière attaque, fenêtre sans limite ou ce tour ; Percée devant la plus avancée) ; sens de « défendue » (pions visibles, ou cartes jouées, barrages…) ; silence avec une réserve non vide ; effets des organes ; Tenir (zones de présence, passif, barrer en plus ; formes v0 = témoins) ; Renverser (tous les organes ou les chenilles). Statut : libres pour la v1, sans recherche prévue tant que la v2 n'est pas tranchée.

### 5.G Difficulté, hors recherche, témoins
- **Difficulté** (pour les modes) : Machines au chantier au départ, esprits au départ, forêt initiale, nombre de tours, escalade du soir, lunes.
- **Hors recherche** : le sac et le paquet (remplacés par la piste) ; les rivières volantes, les lucioles, les cartes Faille (notées 0) ; l'inversion oiseaux/insectes (4) ; les alternatives sur le nombre d'ordres (3) ; la mémoire masquée (contredit la mémoire publique) ; la mémoire conservée en campagne (mode secondaire) ; les détails techniques (section 1) ; les idées verrouillées de l'atelier (A6, A7, B5) jusqu'à leur rédaction.
- **Témoins** (pour valider les mesures, jamais proposés). Déjà dans le moteur : barrage contourné, échec qui pousse l'esprit, rêves sans limite, réussite = forêt abattue, fin vérifiée en fin de tour, sans pouvoirs, présence au hasard, formes v0 de Tenir. À créer en phase 1 : aucun signe et tout dire (C2d, C2e), pouvoir qui ne fait rien, pouvoir qui gagne seul, dés truqués, Méchant qui n'apprend plus.

## 6. Grilles des profils (A10)
Elles servent à lire la carte des variantes (phase 4) et à commenter les finalistes (phase 5). Elles n'entrent pas dans le score de la recherche, qui reste le plus faible des quatre objectifs. Une variante « convient » à un profil si ses mesures sont en vert ; elle lui « déplaît » si l'une est en rouge.

| Profil | Ce qu'il lit | Vert provisoire | Reste aux humains |
|---|---|---|---|
| Hélène | Profondeur (gain du MCTS fort sur le glouton) ; part du hasard ; objectif 1 ; aucune stratégie dominante ; variété des arcs | profondeur ≥ 15 % ; hasard ≤ 40 % des écarts ; au moins 4 arcs fréquents | Clarté des règles |
| Malik | Objectif 4 ; variété des fins ; moments rares | chaque fin ≥ 15 % des parties (sommeil, réveil, nuit en v2) ; un sauvetage au dernier ordre dans ≥ 10 % des parties | Accord du thème et des mécaniques, beauté |
| Camille | Volet coordination de l'objectif 3 ; alliances par partie ; aucun spectateur ; attente | bandes de l'objectif 3 | Qualité de la discussion, ou des traces |
| Bastien | Asymétrie (le bot fort joue chaque peuple autrement) ; variété selon la composition | seuil à calibrer en phase 1 | Sentiment de nouveauté |
| Jean-Marc | Difficulté ; Méchant qui s'adapte (pistes finales différentes selon l'équipe) ; surprise | bot fort ≤ 75 % de la forêt ; surprise dans la bande de l'objectif 1 | Avoir battu quelque chose d'intelligent |
| Sophie | Durée estimée et charge de règles (exigence propre) ; plancher ; coût d'un joueur faible ; difficulté réglable | durée estimée ≤ 60 min ; un joueur bruité coûte ≤ 15 % | Temps d'explication, engagement des enfants |
| Thomas | Jouable par un seul bot qui pilote 2 ou 3 peuples ; aucune communication indispensable | résultat solo ≥ 90 % de celui de la même table à plusieurs | Mise en place |
| Nadia | Coût d'un novice ; sa contribution propre ; part de décisions simples ; coût d'une trace ou d'une annonce non suivie | sa contribution ≥ 50 % de celle d'un siège moyen | Se sentir perdue ou dirigée |

## 7. Ce que la phase 1 doit coder
Dans l'ordre (A13) :
1. **Outils** : copie d'état d'une partie en cours ; journal des décisions avec les options proposées (point d'accroche : `Partie.decider`).
2. **Communication et présage**, sous la forme de la v2 : décision « annonce » au conseil, avec les traces, le partage, et les témoins aucun signe et tout dire ; le conseil parlé de la v1 approché par des traces non numérotées ; le présage en module ; R2.1 de la v1 réécrite comme le livret ; variante `sans_presage` (test de non-régression sur la référence publiée).
3. **La v2 dans le moteur**, nœud par nœud : piste des Machines, rayon, flèches, cycle des Machines, quatre formes du doublé, où et comment ; Représailles « la plus défendue » ; barrage « entrer et abattre » ; deux voies du rêve et Cercle ; fins et bilan ; lunes ; escalade du soir ; adaptations de Voir, Tromper, Attendre, Égarer. La conformité passe par les identifiants des nœuds de l'atelier (A2a, D2…), puisque les numéros du livret changent avec la variante. Le moteur lit un **code de variante de l'atelier** et le traduit en maquette (`maquettes/v2.json`, qui hérite de la v1).
4. **Bilan** sans bonus, avec le bonus en paramètre.
5. **Module de mesures** des niveaux 1 et 2, plus la coordination, chacune avec son étiquette et au moins un témoin.
6. **Témoins** et tests automatiques.
7. **Tableau de bord** : la v1 et « V2 proposée » côte à côte.

## 8. Décisions de l'auteur
| N° | Date | Question | Décision |
|---|---|---|---|
| A1 | 11 oct. | Règle de passage notes → statuts | 9-10 invariant ; 8 invariant de principe (réglages libres) ; 6-7 libre ; 5 module ; 1-4 libre prioritaire sur une forme, hors recherche sur une piste écartée ; 0 hors recherche ; statut *témoin* ajouté |
| A2 | 11 oct. | La v1 de référence a-t-elle un présage ? | Oui : aligner moteur et règle R2.1 sur le livret ; variante `sans_presage` pour la référence publiée |
| A3 | 11 oct. | Bonus de fin | +10 % pour sommeil et silence. **Remplacée par A12** |
| A4 | 11 oct. | Communication | Volet coordination de l'objectif 3, pas de cinquième objectif |
| A5 | 11 oct. | Méthode des seuils | Bandes provisoires, recalées une fois en fin de phase 1 sur les témoins, puis gelées pour le cycle |
| A6 | 11 oct. | Bandes de l'objectif 1 | Validées telles que proposées |
| A7 | 11 oct. | Bandes de l'objectif 2 | Validées telles que proposées |
| A8 | 11 oct. | Bandes de l'objectif 3 et du volet coordination | Validées telles que proposées |
| A9 | 11 oct. | Bandes de l'objectif 4 et du garde-fou | Validées, avec des fins avant la mi-partie tolérées jusqu'à 20 % (rouge au-dessus de 40 %) |
| A10 | 11 oct. | Rôle et seuils des profils | Lecture seule, seuils proposés |
| A11 | 11 oct. | Réglages fixés | Décisions du 11 oct. = invariants (forme v0 = témoin) ; détails techniques = hors recherche |
| A12 | 12 oct. | Bonus de fin, pour la v1 et la v2 | 0 : le résultat est la forêt restante ; robustesse vérifiée à 10 et 25 %. Tranche aussi la décision 7 de la maquette v2 |
| A13 | 12 oct. | Place de la v2 dans le plan | La simulation éclaire les décisions ouvertes de la v2 : outils puis v2 dans le moteur en phase 1 ; diagnostic de la v1 et comparaison des options de la v2 en phase 3 ; l'auteur fixe la v2 ; la recherche de la phase 4 porte sur la v2 |
| B1 | 12 oct. | Bandes définitives (A5), fin de la phase 1 | Les bandes provisoires sont gelées telles quelles pour le cycle, sauf la synergie (B2) |
| B2 | 12 oct. | Définition des synergies | La synergie additive est négative par construction (le jeu s'adapte au nombre de joueurs). « Aucun ne suffit » : le duo bat son meilleur peuple seul (vert ≥ 12 duos sur 15, rouge < 8) ; le tétraèdre : les 3 duos complets dans le premier tiers de la synergie relative entre duos |
| B3 | 12 oct. | Siège spectateur | Le siège est remplacé par le bot inerte (il ne fait rien), et non par le bot aléatoire, qui rêve |
| B4 | 12 oct. | Deux incohérences du moteur | « voir_trahi » (R6.2) et « barrage_contourne » en v1 (R4.3) deviennent des cas permis, comptés à part ; le barrage contourné reste une incohérence pour le témoin v0. Moteur 1.5 |
