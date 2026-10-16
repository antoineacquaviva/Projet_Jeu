# Proposition : le Méchant lu sur ses pistes, et deux ordres par joueur

*16 oct. 2026, 12 h. Demande de l'auteur (12 h 01) : 1. rapprocher l'annonce du modèle « placement » du mécanisme du Méchant envisagé (piste des pensées lue par la somme de 2D6, piste des Machines lue par l'écart, apprentissage par échanges), du point de vue de ce que savent les joueurs quand ils programment ; 2. reconsidérer « un ordre par joueur et par tour » pour donner plus d'intérêt à la programmation, avec une résolution alternée à la Colt Express. **Statut : proposition de Claude, rien n'est adopté ni codé.** Base : la maquette « Forêt en couronne » au réglage robuste (`maquettes-numeriques/kit/`, `projet/4-bilans/placement-etude-2-kit.md`). Mécanisme du Méchant repris de l'atelier v2 (nœuds A1, A2a, A2a_d ; `docs/noeuds_v2.md`).*

## En une phrase
Les joueurs ne voient plus les menaces, seulement les deux pistes du Méchant ; chacun programme deux ordres d'un coup, qui se révèlent en deux étapes, chacune suivie d'une vague de lancers du Méchant.

## 1. Le Méchant : une menace, c'est un lancer

**Les deux pistes**, publiques, celles de l'atelier v2 :
- **piste des pensées**, cases 2 à 12, une tactique par case, désignée par la **somme** des deux dés. Disposition de départ de l'atelier : 2 Percée · 3 Représailles · 4 Percée · 5 Représailles · 6 Opportunisme · 7 Cupidité · 8 Opportunisme · 9 Représailles · 10 Percée · 11 Cupidité · 12 Cupidité. Pas d'esprit (le rêve reste différé) ;
- **piste des Machines**, six cases, une Machine par case, désignée par l'**écart** des dés (0 à 5). **Décidé par l'auteur le 16 oct., 13 h 11 : le doublé (écart 0) désigne une sixième Machine, Zizanie, la scie à grappin** (option `d_six` de l'atelier). Les cases s'impriment **dans l'ordre des probabilités : 1 · 2 · 0 · 3 · 4 · 5**, soit 10, 8, 6, 6, 4 et 2 chances sur 36. Le numéro d'écart est écrit sur chaque case ; la position sur la piste est la probabilité, sans exception.

**Une menace = un lancer.** Somme → tactique ; écart → Machine ; la Machine applique la tactique dans son rayon (règles P4.2 à P4.7 inchangées). Les dés sont lancés **à la résolution**, jamais avant la programmation.

**Ce que savent les joueurs en programmant** : exactement les deux pistes, donc la probabilité de chaque tactique, de chaque Machine et de chacun des 21 plans (la pyramide de l'atelier, imprimable sous les pistes). C'est le mécanisme envisagé, sans écart.

**Apprendre** (règle de l'atelier, sans esprits). Après chaque menace, les deux tuiles désignées s'échangent avec une voisine, selon le même verdict :
- réussite (un arbre est tombé) : vers le 7 sur la piste des pensées (au 7, elle reste), vers le côté probable de la piste des Machines, c'est-à-dire d'une case vers la gauche de l'ordre 1 · 2 · 0 · 3 · 4 · 5 (en tête, elle reste) ;
- échec (la menace est parée) : vers le bord (en 2 ou 12, elle reste ; au 7, elle passe en 8), d'une case vers la droite, côté rare (en queue, elle reste). Le sens se lit sur la piste imprimée, jamais sur le numéro d'écart : la case 0 n'est donc pas collante.

Les pistes changent donc **pendant le tour** : la seconde vague ne se lit plus comme la première, et les joueurs peuvent l'anticiper. Parer une tactique, c'est aussi la faire reculer.

**Les Machines, toujours six.** La pression ne vient plus du nombre de Machines mais du nombre de lancers : le nombre de Machines n'a plus à suivre J. Il y a toujours 6 Machines sur la piste (Grosse Gueule 1, Rapiat 2, Zizanie 0, Mâchoire 3, Tonton Débard 4, Ripaille 5, les noms de l'atelier) ; au départ, min(J + 1, 6) sont sur le plateau, sur la lisière de la tuile de leur joueur, les autres attendent au chantier. *Choix de Claude, à confirmer* : on les met sur le plateau dans l'ordre 1, 2, 3, 4, 5, 0 (Zizanie arrive en dernier, comme dans l'atelier) ; à 6 joueurs, les six sont sur le plateau et le chantier est vide. **Une Machine appelée au chantier entre** sur une case de lisière tirée au dé **et y abat un arbre** (une garde sur cette case la pare). Ainsi chaque lancer abat un arbre s'il n'est pas paré, et la borne du tour tient.

## 2. Le Gentil : deux ordres, deux étapes

**Programmation.** Chaque joueur pose deux cartes d'ordre face cachée, numérotées 1 et 2, chacune sur l'un de ses individus (le même individu peut recevoir les deux : aller puis garder, au prix de deux ordres). Tous en même temps, en secret.

**Résolution du tour** :
1. **Étape 1** : on révèle toutes les cartes 1 ; déplacements, puis gardes et sabotages (P3.3) ;
2. **Vague 1** : le Méchant lance J + 1 fois les dés, une menace après l'autre ;
3. **Étape 2** : on révèle toutes les cartes 2 ;
4. **Vague 2** : J + 1 lancers.

Une garde ou un sabotage posé à une étape vaut pour la vague qui la suit, puis tombe. Il pare au plus une menace (P3.4 inchangée).

**Un ordre devenu impossible est perdu** (comme à Colt Express) : par exemple, saboter une Machine qui a quitté la case pendant la vague 1. C'est le seul cas, car un individu ne bouge que par ses propres ordres.

**La partie dure 4 tours.** Chaque joueur donne donc 8 ordres et le Méchant fait 8 (J + 1) menaces, comme dans la maquette actuelle à J + 1 Machines et 8 tours. Le volume de la partie ne change pas : seuls changent ce qu'on sait et quand on décide.

**La borne.** À chaque vague, J ordres font face à J + 1 menaces : au moins un arbre tombe par vague. La forêt initiale reste au-dessus de la menace totale (tuile 3 × 3 : 27 J + 3 arbres pour 8 J + 8 menaces).

## 3. Ce qui change par rapport à la maquette « Forêt en couronne »

| | Maquette actuelle | Proposition |
|---|---|---|
| Ce que sait le Gentil | toutes les menaces (Machine et tactique) ; seul l'ordre est caché | les deux pistes, donc des probabilités |
| Une menace | une carte de tactique devant chaque Machine | un lancer de 2D6 : somme → tactique, écart → Machine |
| Machines | J + 2, une menace chacune | 6 sur la piste des Machines ; min(J + 1, 6) au départ sur le plateau, les autres au chantier |
| Apprentissage | aucun | échanges sur les deux pistes après chaque menace |
| Ordres | 1 par joueur et par tour | 2 par joueur, programmés ensemble, révélés en deux étapes |
| Résolution | ordres posés, puis toutes les menaces | étape 1 → vague 1 → étape 2 → vague 2 |
| Tours | 8 | 4 |

**Ce qui ne change pas** : la couronne et les tuiles 3 × 3, le Cœur, 3 individus par joueur, les trois ordres, les tactiques dans le rayon, le repli, le sabotage qui laisse la Machine s'échapper, une parade par ordre, le décompte de la forêt.

## 4. Un ordre ou deux : les arguments

**Pourquoi un ordre avait été retenu** (15 oct., `projet/3-pilotage/nombre-de-joueurs-pistes.md` et la proposition du kit) : la simplicité du kit (une carte par joueur) ; chaque joueur agit à chaque tour ; l'attente reste courte ; la pression se lit d'un coup (J ordres contre J + 1 menaces). Aucune mesure n'a jamais écarté deux ordres. La seule leçon mesurée qui s'en approche est **« plus d'individus que d'ordres »** : elle reste respectée, car à chaque étape chaque joueur donne un ordre pour trois individus.

**Ce que deux ordres apportent** :
- programmer devient un **plan** : le second ordre se décide sans savoir ce que fera la vague 1. C'est l'anticipation des positions successives que tu cherches ;
- le **sabotage** gagne un risque : sûr à l'étape 1, pari à l'étape 2 ;
- le déplacement trouve un usage naturel : « aller puis garder », qui coûte deux ordres (la leçon de l'étude 1, « se déplacer coûte l'action », est respectée) ;
- l'apprentissage entre dans le tour : on peut parer une tactique à l'étape 1 pour qu'elle recule avant la vague 2.

**Les risques** :
- **trop de chaos** : si la vague 1 bouleverse trop souvent le plan, la lecture ne paie plus. L'étude 2 met en garde : deux menaces par Machine avaient fait baisser la maîtrise et l'information. Le cas est différent (ici, les ordres s'intercalent), mais c'est la mesure à surveiller ;
- **moins d'information** : sans annonce, le Gentil ne sait plus où frapperont les Machines. L'étude 1 a montré que plus l'annonce est précise, plus le jeu est profond, et que sans annonce la profondeur tombe à l'orange. Les pistes donnent bien plus qu'un tirage uniforme (le 7 sort six fois plus que le 2), mais il faut le mesurer ;
- **la charge et la coordination** : deux cartes à choisir, en secret, sans voir celles des autres. Les bots sont parfaitement coordonnés : le coût de la communication n'est pas mesuré (elle reste différée).

## 5. Réglages laissés pour plus tard
- **Lancers par vague** : J + 1 (proposé), J + 2 (la pression du réglage robuste) ou J.
- **Qui commence le tour** : le Gentil (proposé) ou le Méchant. Ta séquence (vague → ordres 1 → vague → ordres 2 → vague) revient à « le Méchant commence » : la garde de l'étape 2 vaut alors pour la première vague du tour suivant. Le premier ordre devient aussi un pari, donc plus de chaos. Je propose de commencer par le Gentil : son premier ordre se joue sur une situation connue, et aucun ordre ne déborde sur le tour suivant.
- **Ordres par joueur** : 2 (proposé), 1 (la maquette actuelle, comme témoin) ou 3.
- **Présage** : les dés de la vague 1 sont lancés et montrés avant la programmation. C'est l'annonce actuelle pour la première vague, les pistes seules pour la seconde. Ce levier est à garder en réserve si l'information manque. Plus tard, il pourrait devenir un pouvoir (les oiseaux, « Voir »).
- **Le verdict de l'apprentissage** : **partagé, décidé par l'auteur le 16 oct., 13 h 09** (les deux tuiles, celle de la tactique et celle de la Machine, apprennent à chaque menace, parée ou non, comme dans l'atelier). L'auteur privilégie le meilleur apprentissage du Méchant, même quand la Machine est parée. Écarté : le verdict ciblé (une garde ferait échouer la tactique seule, un sabotage la Machine seule), qui laissait une tuile immobile à chaque parade. Conséquence : garder et saboter ont le même effet sur l'apprentissage ; ils ne diffèrent que par leur condition et leur effet sur le tour.
- **Le doublé** : **décidé, une sixième Machine en case 0** (16 oct., 13 h 11). Écartés : le favori, branle-bas, il hésite.
- **Nombre de tours** : 4 (proposé), 3 ou 5.

## 6. Ce qu'il faut mesurer (campagne 3, si tu retiens la proposition)
Coder dans `placement/` les pistes et leurs échanges, les deux étapes et le chantier, puis comparer de 2 à 6 joueurs, aux mêmes graines :
- **référence** : la maquette actuelle (un ordre, annonce) ;
- **pistes seules** : un ordre par tour, menaces lues sur les pistes, sans apprentissage puis avec ;
- **la proposition** : pistes et deux ordres ;
- **la proposition avec présage**.

Les mesures sont celles de l'étude 2. L'information est redéfinie : glouton qui lit les pistes, moins glouton qui suppose les pistes uniformes. On ajoute une mesure du plan : MC qui choisit ses deux ordres ensemble, moins MC qui choisit le second au hasard parmi les bons coups. Les bots devront programmer deux ordres à l'avance, ce qui demande un MC à deux étapes (choix technique de Claude).

*Supposé, à vérifier* : les pistes coûtent de l'information, les deux étapes en rendent par la profondeur. C'est l'objet de la campagne.
