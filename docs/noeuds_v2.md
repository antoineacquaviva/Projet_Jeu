# Maquette v2 : les nœuds de l'atelier dans le moteur

*Statut (12 oct. 2026, moteur 1.3) : la maquette de conception v2 (« Atelier de la Forêt qui rêve », https://claude.ai/artifact/WJiQMwXDJEDwVvAERsDWss) telle que le moteur la joue. Chaque nœud de l'atelier porte son identifiant ([v2:A2a]…), cité dans le code et dans les tests ; `python -m foret.conformite --v2` vérifie que chaque nœud codé a au moins un renvoi dans le code et un test. Les numéros du livret de l'atelier changent avec la variante : on cite les nœuds, pas les numéros.*

`maquettes/v2.json` est le préréglage « V2 proposée » (code `c:A2a,d_fav,C2a,D2v_choix|m:C3|p:`). Toute autre variante se charge par son code d'atelier : `charger("v2", "code:<code>")`, ou `"code:<code>"` dans la liste des variantes d'une campagne (`foret/atelier.py`). Les zones gardent leurs noms du moteur : Z1 Lisière, Z2 Clairière, Z3 Várzea, Z4 Igapó, Z5 Sources, Z6 Colline aux aras, Z7 Samaúma.

Les règles de la v1 (docs/regles_v1.md) s'appliquent pour tout ce que ces nœuds ne changent pas.

## A. Le Méchant et ses Machines

**[v2:A1] La piste des pensées.** Comme en v1 (R5) ; en v2, sans Réparer ni Renfort : 2 Percée, 3 Représailles, 4 Percée, 5 Représailles, 6 Opportunisme, 7 Cupidité, 8 Opportunisme, 9 Représailles, 10 Percée, 11 Cupidité, 12 Cupidité. Réglages : `piste_place` (fixe, hasard), `esprits_depart` (1 : un esprit en 12 à la place de la troisième Cupidité).

**[v2:A2] Le plan du Méchant (choix).** Qui et où (A2a), où et comment (A2b), une seule piste (A2c). Règle `plan` : `qui_ou`, `ou_comment`, `une_piste`.

**[v2:A2a] Deux pistes : qui et où.** La somme des dés désigne une tactique sur la piste des pensées ; l'écart (plus grand moins plus petit) désigne une case de la piste des Machines (cases 1 à 5 ; chaque Machine part sur la case de son numéro). Selon l'état de la Machine désignée : au chantier, elle entre par sa zone d'entrée (barrée : échec) ; hors service, réglage `hs` : remorquée au chantier et remise en état (`remorquee`), réparée d'un organe, moteur puis chenilles puis phares (`organe`), ou rien, le plan échoue (`rien`) ; en marche, elle exécute la tactique. Portée `rayon` (proposée) : la tactique choisit une zone du rayon (sa zone et les voisines qui ont encore de la forêt) ; la Machine y entre et y abat ; barrage, embuscade ou mammifères : le plan échoue. Portée `plateau` : la tactique vise une zone sur tout le plateau, la Machine désignée fait un pas puis abat (comme R4.3). Réussite = l'ordre a eu un effet (forêt abattue, Machine entrée, remorquée ou réparée). Les deux tuiles apprennent du même verdict ; sur la piste des Machines, réussite : vers la case 1 (en 1, elle reste) ; échec : vers la case 5 (en 5, elle reste). Une case sans Machine (moins de Machines au chantier) : le plan échoue, la tactique apprend l'échec. Un esprit tiré : pas d'ordre, rien n'apprend.
*Choix de modélisation, à confirmer : le remorquage n'est pas gêné par un barrage ; rayon sans forêt : la Machine choisit sa zone et le plan échoue (lacune `rayon_sans_foret`).*

**[v2:A2a_d] Le doublé (choix).** Écart 0, une fois sur six. Règle `double`.

**[v2:d_fav] Le favori.** La Machine de la case 1 obéit.

**[v2:d_bb] Branle-bas.** Toutes les Machines en marche exécutent la tactique, l'une après l'autre, de la case 1 à la case 5 (chacune choisit sa zone au moment d'agir). Seule la tactique apprend : réussite si au moins une forêt tombe.

**[v2:d_hes] Il hésite.** Pas d'ordre, rien n'apprend.

**[v2:d_six] Une sixième Machine.** La case 0 porte Zizanie, au chantier au départ ; elle apprend comme les autres ; en 0, une Machine qui échoue reste en place ; en 0, une réussite la fait passer en 1.
*Choix de modélisation, à confirmer : Zizanie a un moteur et des chenilles, et entre par la Clairière (l'atelier ne les donne pas).*

**[v2:A2b] Deux pistes : où et comment.** La somme désigne une tactique, qui vise une zone sur tout le plateau (critères v1, R4.2) ; l'écart désigne une manœuvre sur la piste des manœuvres (0 Encercler, 1 Avancer, 2 Foncer, 3 Raser, 4 Réparer, 5 Renfort) ; la Machine en marche la plus proche de la zone visée l'exécute. Encercler : chaque Machine en marche fait un pas vers la zone visée, puis la plus proche abat ; Avancer : un pas puis abattre (R4.3) ; Foncer : deux pas puis abattre ; Raser : deux forêts là où elle est (au plus ce qui reste) ; Réparer : un organe de la Machine la plus endommagée ; Renfort : la première Machine du chantier entre (par sa zone d'entrée). Les manœuvres apprennent comme la piste des Machines. Une Machine égarée quitte le plateau (comme en v1).

**[v2:A2c] Une seule piste (v1).** Les règles R4 de la v1, piste avec Renfort et Réparer, Égarer comme en v1, avec les fins de la v2. Préréglage « Héritage v1 ».

**[v2:A3] Les quatre tactiques.** Dans le rayon : Cupidité, la plus boisée ; Opportunisme, la moins défendue (présences visibles) ; Représailles, la plus défendue (`represailles=defendue`) ou la dernière zone du rayon où un organe a été neutralisé, sinon comme Cupidité (`attaque`) ; Percée, la zone indiquée par la flèche de sa zone (Lisière → Igapó, Clairière → Sources, Várzea → Sources, Igapó → Colline aux aras, Sources → Samaúma ; au cœur, sa zone). Égalité : sa propre zone si elle en fait partie, puis la plus boisée, puis le plus petit numéro. Sur tout le plateau (A2b, A2c, portée plateau) : critères v1, Représailles « défendue » = la zone boisée la plus défendue.
*Choix de modélisation, à confirmer : flèche vers une zone rasée, la Machine reste dans sa zone et y abat (lacune `percee_rasee`).*

**[v2:A4] L'escalade du soir.** À partir du tour choisi (`escalade` : 4 ou 5), un doublé fait obéir toutes les Machines en marche (comme le branle-bas). Demande A2a.

**[v2:A5] Le bruit.** Une Machine mise hors service par Renverser ou par un sabotage en alliance fait reculer d'une case l'esprit le plus proche du 7 (Enrayer et Égarer sont silencieux). Règle `bruit`.

**[v2:A6] Les obsessions.** *(non codé)* Idée verrouillée dans l'atelier.

**[v2:A7] Les pouvoirs des peuples sur les pistes.** *(non codé)* Idée verrouillée dans l'atelier.

## B. Les peuples et leurs actions

**[v2:B1] Peuples, personnages, présence.** Comme en v1 (R1.4, R1.5). Réglages `main`, `paquet`, `presence`.

**[v2:B2] Trois actions et l'alliance.** Comme en v1 (R3). Réglage `barrage` : `tout` (une Machine ne peut ni entrer dans la zone barrée, ni en sortir, ni y abattre) ou `entree` (elle peut en sortir) ; `alliance` : `presence` ou `conjointe`.

**[v2:B3] Les règles brisées.** Comme en v1 (R6), avec : Tromper inverse le verdict des deux tuiles ; Attendre peut immobiliser la Machine désignée si elle est dans une zone des reptiles ou va y entrer (zone d'entrée comprise) ; avec la piste des Machines (A2a), une Machine mise hors service alors que ses phares sont égarés rentre aussitôt au chantier, remise en état, et fait rêver le Méchant (rêve gratuit, voie au choix, hors limite). Réglages `voir` (cartes par tour), `hanter`, `immob`.

**[v2:B4] Les peuples des plans au conseil.** *(non codé)* Module proposé ; le lecteur de code le refuse tant qu'il n'est pas codé.

**[v2:B5] Les effets propres des personnages.** *(non codé)* Idée verrouillée.

## C. Le tour et le conseil

**[v2:C1] Le tour de jeu.** Comme en v1 (R2) ; réglages `tours`, `etapes`. Le conseil : Voir, la communication, (les lunes,) le présage, puis la programmation en silence (R2.1).

**[v2:C2] La communication au conseil (choix).** Règle `communication` (R2.5).

**[v2:C2a] Les traces.** R2.5 : 2 traces numérotées par joueur (`traces_n`, `traces_datees`), qui engagent ou non (`traces_eng`).

**[v2:C2b] Le partage (façon The Gang).** R2.5 : deux jetons par Machine en marche (`partage_max` devant soi). Demande A2a.

**[v2:C2c] Le conseil parlé (v1).** R2.5 : approché par 3 traces non datées par joueur.

**[v2:C2d] Aucun signe.** Témoin : personne ne communique.

**[v2:C2e] Tout dire.** Témoin : une trace datée par étape, programmes déjà faits visibles.

**[v2:C3] Le présage.** R2.6.

## D. Le moteur des rêves et les fins

**[v2:D1] Rêver.** Une carte en travers part en rêve (R3.6). Réglage `reves_limite` : un par joueur et par tour (`joueur`), ou deux ou trois par tour pour la table (`table2`, `table3`).
*Choix de modélisation, à confirmer : avec une limite de table et une programmation simultanée, les rêves se font dans l'ordre des étapes et des joueurs ; les cartes en trop ne rêvent pas et reviennent en main à la fin du tour (lacune `reves_table_depasses`) ; la limite de table remplace la limite par joueur.*

**[v2:D2] Les deux voies du rêve.** Voie du sommeil : un esprit entre en 12 ou avance (R5.3). Voie du réveil : le rêve rejoint le Cercle, qui compte `seuil` cases par joueur ; rien ne le fait reculer. Règle `voies_reve`, `cercle_par_joueur`.

**[v2:D2v] Comment un rêve nourrit les voies (choix).**

**[v2:D2v_choix] Au choix.** Chaque rêve choisit sa voie (décision « reve », option `("reveil",)`).

**[v2:D2v_deux] Les deux à la fois.** Chaque rêve fait entrer ou avancer un esprit, puis rejoint le Cercle.

**[v2:D3] Les trois fins.** Le long sommeil (un esprit au 7), le réveil de la forêt (le Cercle est plein), la nuit (fin du dernier tour) ; la partie s'arrête aussitôt. Le silence du chantier est retiré (règle `silence_du_chantier` à false).

**[v2:D4] Le bilan.** Le résultat est la forêt restante ; réglage `bonus` (0 proposé, décision A12) : 10 ou 25 % de la forêt initiale en plus pour le sommeil ou le réveil (contrôles de robustesse). Le bilan du moteur donne `foret` et `resultat`.

**[v2:D5] Les lunes.** Au conseil, après la communication, `lunes` lunes sont posées au centre ; chacun peut en prendre une (au centre ou devant un autre joueur ; une au plus devant soi) ou la rendre ; seul un joueur qui tient une lune peut poser une carte en travers ce tour (une au plus).
*Choix de modélisation : la prise des lunes suit la communication au lieu de se faire en même temps ; des rondes comme pour les traces.*

**[v2:D6] Le dernier sursaut.** Quand un esprit atteint le 7, on lance encore les dés, jusqu'à `sursaut` fois, et on exécute ces plans, jusqu'à ce qu'un esprit soit tiré (sans apprentissage).

**[v2:D7] Le silence du chantier.** *(non codé)* Retiré le 12 octobre ; la v1 le garde.

## E. Le plateau et les Machines

**[v2:E1] Le plateau.** Le plateau v1, avec une flèche de percée par zone non centrale (`plateau.fleches`). Le gabarit g1 n'est pas dessiné : refusé.

**[v2:E2] Les Machines.** Grosse Gueule (moteur, chenilles ; Lisière), Rapiat (moteur, chenilles, phares ; Clairière), Mâchoire (moteur, phares ; Várzea) en jeu ; Tonton Débard (moteur, chenilles ; entrée Lisière) et Ripaille (moteur, chenilles, phares ; entrée Várzea) au chantier. Réglage `m_chantier` (0, 1, 2) : Machines au chantier au départ.
