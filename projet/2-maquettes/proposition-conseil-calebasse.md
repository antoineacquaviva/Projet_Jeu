# Proposition : le conseil de la calebasse

> **Statut au 15 oct. 2026, 17 h : idée retenue par l'auteur comme très intéressante, dont la conception est DIFFÉRÉE à plus tard.** L'auteur recentre pour l'instant la conception sur la mécanique de base seule (modèle « placement », `docs/regles_placement.md`), sans communication. Ce document est conservé tel quel, comme réserve d'idées : il n'est ni développé, ni codé, ni testé, et rien n'y est adopté. Les « validations » de la fin de la proposition sont suspendues. Registre des parties différées : `projet/1-idees/parties-differees.md`.

*15 oct. 2026, 14 h. Réponse à la demande de l'auteur : un conseil plus intéressant, sans parole libre, avec une règle qui limite ce qu'on se dit. **Statut : proposition de Claude, rien n'est adopté.** Elle remplacerait N2.1 du noyau (`docs/regles_noyau.md`) et s'appuie sur la direction D1, « le rêve détourne ».*

## En bref

Le conseil actuel ne sert à rien. Toute l'information est publique, sauf la programmation : parler revient à faire jouer la table par un seul cerveau, et se taire revient à deviner. La proposition ajoute trois choses, une ligne chacune :

1. **Les visions** : chacun voit seul les dés d'une étape à venir. Il y a enfin quelque chose à dire.
2. **La calebasse** : on parle une fois chacun, quand on la reçoit, et on choisit à qui la passer. Il y a un ordre, et c'est un choix.
3. **La parole engage** : on ne dit que ce qu'on fera soi-même (un jeton sur une étape et une zone, ou sur le rêve), et on doit le faire. Personne ne peut dire aux autres quoi faire.

C'est ce que les tests n'ont jamais eu : une **information privée** qui vaut la peine d'être partagée, et un **canal étroit** pour la partager.

## 1. Pourquoi le conseil actuel ne sert à rien

**Il n'y a rien à apprendre aux autres.** Le présage, la piste des pensées, la piste des Machines, les pions et le nombre de cartes sont publics, et les mains sont identiques (N1.5). Seule la programmation est cachée. Un conseil libre ne fait donc circuler que des intentions. La table qui parle devient un seul joueur, et c'est l'effet leader, critique n° 1 du jeu coopératif selon le panel (`projet/1-idees/panel-de-joueurs-virtuels.md`). Les remèdes que cite le panel sont l'information cachée et une profondeur propre à chaque joueur.

**Les mesures le confirment.** Sur la V0.3, « aucun signe » donne 89,9 % de forêt, les traces 90,5 % et « tout dire » 90,5 % : l'écart entre ne rien dire et tout dire n'est que de 0,6 point (`projet/4-bilans/ligne-de-base-p2.md`). Le conseil parlé de la v1, approché par des traces, ne récupérait que 7 % de l'écart (`projet/4-bilans/diagnostic-v1-options-v2.md`). **Une limite de communication n'a d'intérêt que s'il y a quelque chose à dire et quelque chose à coordonner.** Aucun réglage de la limite ne crée ni l'un ni l'autre.

**Il y a pourtant à coordonner dans le noyau :**
- **l'alliance** : saboter demande un allié dans la même zone à la même étape (N4.2, N4.4) ;
- **les doublons** : deux barrages sur la même zone, ou deux rêves sur la même étape. À 2 joueurs, il n'y a qu'un ordre par étape : le deuxième rêve n'annule plus rien (N3.2) ;
- **qui paie le rêve** : la carte en rêve est perdue (N3.3).

**Il manque une information privée.** Note sur l'instrument : les bots de la maquette se concertent (`bots.js`, programmation de la table). Ils jouent donc aujourd'hui en « tout dire ».

## 2. Ce que les essais ont écarté

| Piste déjà essayée | Ce qu'elle a donné | À retenir |
|---|---|---|
| Parole libre (v1, livret) | non modélisable ; effet leader | c'est le témoin « tout dire », pas une règle |
| Les traces (v2 : 2 ou 3 jetons par joueur, déplaçables, en rondes simultanées, non engageantes) | 66 % de l'écart récupéré en v2 ; écart nul en V0.3 | le jeton posé sur une zone est une bonne forme ; les rondes et les reprises sont lourdes ; une trace qui n'engage pas ne vaut pas grand-chose |
| Le partage (jetons par Machine, façon *The Gang*) | pas mieux que les traces ; exige la piste des Machines | écarté |
| Les lunes (rêves de la table à se disputer) | une constante, qui déplace la moyenne (principe 3) | écarté du conseil |
| Le Cercle (rêve collectif à seuil) | tout ou rien, chasse au cerf | retiré du noyau |
| Le chef unique | +0,7 % | la communication n'apportait rien |

## 3. Repères culturels

**Le mambeadero.** Chez les Murui-Muina (Uitoto) et leurs voisins de l'Amazonie colombienne, les hommes se réunissent la nuit au mambeadero, dans la maloca, autour de la coca (le mambe) et du tabac (l'ambil). Trois traits servent directement :
- **La parole a un ordre.** L'ancien, assis sur le banc rituel, ordonne la parole. Le dialogue s'y tient toujours entre deux personnes, même quand d'autres écoutent. Celui qui offre l'ambil prend la parole, et l'autre répond, ou non, en offrant à son tour. Une calebasse d'ambil représente la parole du maître de la fête, et en l'offrant on peut dire « voici ma parole ».
- **La parole devient œuvre.** Le *rafue*, la « parole-œuvre », est ce qui se dit la nuit et doit devenir un fait le jour. Une parole n'est vraie que si elle se réalise.
- **On parle de soi.** Ce qu'on offre est sa propre parole, pas un ordre donné à l'autre.

**Le rêve qui fait voir loin.** Chez les Yanomami, Davi Kopenawa dit que les chamanes apprennent à rêver et que les esprits leur font « voir et savoir les choses lointaines ». C'est le fondement des visions : la forêt qui rêve voit venir les intentions du Méchant.

**Le bâton de parole** vient d'Amérique du Nord. On garde son idée, un objet qui donne la parole, sous une forme amazonienne : la calebasse.

**Précaution.** Ces pratiques sont vivantes et en partie sacrées. Le jeu en garde des formes générales (une calebasse, la nuit, la parole qui engage) sans reprendre de rituel précis ni de mot sacré. Avant toute édition, il faudra une relecture par une personne compétente, dans l'esprit du « soin prévu pour les cultures » de la synthèse des idées.

## 4. La règle proposée (remplacerait N2.1)

**N2.1 Le conseil de la calebasse.**

**a. Le présage** (inchangé). On lance les dés de la première étape, à la vue de tous.

**b. Les visions.** On lance en secret les dés de la deuxième étape, puis ceux de la troisième, chaque paire sous sa calebasse. En partant du premier joueur, chacun regarde à tour de rôle sous la calebasse 2, puis sous la 3, puis sous la 2, et ainsi de suite. Il garde sa vision pour lui. Ces dés serviront au premier ordre de leur étape, comme le présage.

**c. La calebasse passe.** Le premier joueur est le **maître de la parole** du tour. Celui qui tient la calebasse dit sa parole ou se tait, puis l'offre à un joueur qui ne l'a pas encore reçue. Chacun la reçoit une fois par tour. Le dernier la pose au centre.

**d. Une parole ne parle que de soi.** Une parole, c'est poser son jeton de parole sur l'un de deux emplacements :
- **une étape et une zone** où l'une de ses cartes pourra agir (une zone où son peuple est présent, ou une zone voisine par Aller) : « à l'étape 2, j'agirai aux Sources » ;
- **le rêve d'une étape** : « à l'étape 3, je rêve ».

Rien d'autre ne se dit sur le jeu : ni sa vision, ni ce que les autres devraient faire.

**e. La parole engage.** À la programmation, la carte de cette étape doit faire ce qui a été dit : agir dans cette zone, avec l'action de son choix, ou rêver. Si la parole ne peut pas être tenue au moment d'agir, par exemple si l'allié que les insectes devaient rejoindre n'est pas venu, la carte agit où elle peut.

**f. La programmation** suit, en silence et en secret, comme aujourd'hui (N2.2).

**Ce qui change ailleurs :**
- **N5.1 Oiseaux, Voir** : ils regardent sous les deux calebasses. Cela remplace « les dés de la deuxième étape sont lancés et affichés ». Ce sont les éclaireurs : ils en savent le plus, mais n'ont, comme chacun, qu'une seule parole.
- **N1.5** : le nombre de cartes en main est public (réponse à la question précédente de l'auteur). Il ne reste que deux vrais secrets : les visions et les cartes non engagées.

## 5. Ce que la règle doit produire

- **Chacun a une raison de parler, et personne ne peut tout planifier.** Le joueur qui voudrait diriger ignore les visions des autres, et il ne peut engager que lui-même. C'est un remède à l'effet leader par construction, pas par bonne volonté.
- **Une seule parole oblige à choisir la plus utile.** Dire où l'on agira appelle un allié ou évite un doublon. Dire que l'on rêve épargne une carte à un autre.
- **Les paroles se lisent.** « Il rêve à l'étape 3 » veut presque dire « il a vu l'étape 3, et elle est hors de portée ». « Il agira à Igapó à l'étape 2 » veut dire « une Machine y vient, ou il veut un allié ». Comme dans *Hanabi*, on déduit, mais sans convention à apprendre, puisque la parole dit d'abord ce qu'elle dit.
- **L'ordre de passage est un choix.** On offre la calebasse à celui dont la vision complète la sienne. Parler tôt, c'est s'engager sans savoir ; parler tard, c'est s'adapter.
- **Le choix entre rêver et défendre se joue à plusieurs.** Avec D1, un rêve annule un ordre où qu'il soit. Savoir qui a vu quoi et qui paie la carte devient le cœur du conseil.
- **Le matériel est léger** : un jeton par peuple, deux calebasses (ou deux gobelets), aucune ronde.

**Exemple à deux joueurs.** Mammifères aux Sources et à Várzea, insectes à Igapó. Le présage annonce que Grosse Gueule ira, par Cupidité, sur Lisière, à l'étape 1. Les mammifères ont vu l'étape 2 : Mâchoire, par Représailles, sur Várzea. Les insectes ont vu l'étape 3 : Rapiat, par Percée, sur Sources.
- Les mammifères, maîtres de la parole, posent « étape 2, Várzea ».
- Les insectes comprennent qu'une Machine y vient et que les mammifères y seront. Ils pourront s'y unir pour saboter sans aller sur place.
- Seuls les insectes ont vu l'étape 3. Avec leur unique parole, ils peuvent poser « étape 3, je rêve » pour annuler l'ordre en payant une carte. Ils peuvent aussi poser « étape 3, Sources » pour appeler les mammifères, qui y ont un pion, à barrer ou saboter avec eux.
- Les mammifères, qui ont déjà parlé, devront deviner ce que veut dire la parole des insectes. Le pari peut échouer, et c'est le jeu.

## 6. Risques, et comment les mesurer

1. **Les visions ne valent rien.** Si l'écart entre « tout dire » et « silence » reste de quelques dixièmes de point, le conseil reste décoratif, quelle que soit la règle. Il faut trois témoins dans la maquette :
   - **silence** : visions privées, aucune parole ;
   - **calebasse** ;
   - **tout dire** : visions publiques et programmes partagés.

   La bande du catalogue s'applique : la calebasse doit récupérer de 40 à 80 % de l'écart. Préalable proposé : un écart entre « tout dire » et « silence » d'au moins 4 points. Sinon, on renforce les visions, par exemple en ajoutant l'étape 2 et l'étape 3 entières, ou les deux ordres de chaque étape.
2. **La parole engage trop.** Si les joueurs se taisent plus d'une fois sur deux, on essaie la variante « la parole n'engage pas ».
3. **Les oiseaux deviennent trop forts**, puisqu'ils voient deux visions. On le saura en comparant les tables avec et sans oiseaux.
4. **En solo, la règle perd son sens.** C'est déjà noté au panel (Thomas). Dans la maquette, un joueur qui tient toute la table voit toutes les visions. Pour tester le conseil, il faut jouer un siège contre des bots, ou activer un écran de passage entre les sièges humains.
5. **Les bots.** Ils doivent passer d'une programmation concertée, équivalente à « tout dire », à des bots par siège, qui ne savent que leur vision et lisent les paroles avec des règles simples et affichées : « je rêve à l'étape 3 : ma vision montre Sources, hors de ma portée, et personne n'y a parlé ».

## 7. Pour l'essayer

La maquette recevrait un réglage « conseil » à quatre valeurs : libre (l'actuel, par défaut), calebasse, silence et tout dire. Il faudrait aussi :
- les visions par siège, avec un écran de passage entre humains ;
- le jeton de parole et le passage de la calebasse, animés ;
- le respect automatique des engagements à la programmation ;
- les bots par siège, avec leurs raisons ;
- le journal et l'enregistrement de la parole ;
- une série qui compare les quatre conseils.

Cela représente environ une session de travail. Aucune règle ne serait adoptée pour autant : ce serait un réglage d'étude.

## Sources

- Le mambeadero, l'ambil et la calebasse : article de la *Revista Anthropológicas* (UFPE), https://periodicos.ufpe.br/revistas/revistaanthropologicas/article/download/265181/49224/286604
- Le *rafue*, parole-œuvre : Juan Andrés Osorio, « *Rafue uai* : una revisión bibliográfica en la tradición múrui-muina », *Lingüística y Literatura*, n° 76, 2019, https://revistas.udea.edu.co/public/journals/recursos_html/lyl-Html/linli-n76/0120-5587-linli-76-192.html
- Davi Kopenawa, propos recueillis par Survival International, https://survivalinternational.org/articles/3511-Daviswords
- Projet : `projet/4-bilans/ligne-de-base-p2.md`, `projet/4-bilans/diagnostic-v1-options-v2.md`, `projet/2-maquettes/maquette-de-conception-v2.md`, `projet/3-pilotage/objectifs-invariants-catalogue.md` (C2, bande de coordination), `projet/1-idees/synthese-des-idees.md` (l'alliance, l'asymétrie d'information, les peuples), `projet/1-idees/panel-de-joueurs-virtuels.md` (effet leader).
