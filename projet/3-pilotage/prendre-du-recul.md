# Prendre du recul : bilan, risque et pistes de fond

*15 oct. 2026, 9 h. Rédigé par Claude (Opus) à la demande de l'auteur, qui pose trois questions : le bilan d'étape est-il juste et complet ? Le risque de défauts de conception encore masqués est-il réel ? Quelles pistes de fond pour repartir sur de meilleures bases ? Sources : ETAT.md, les bilans de `projet/4-bilans/`, `choix-strategique.md`, et une relecture des synthèses des campagnes 18 à 20 (branche `resultats`). **Aucune règle n'est changée.** Un défaut de l'instrument a été corrigé en passant (section 1.3, choix technique). Les décisions demandées sont regroupées en section 4.*

## En bref
- **Le bilan de l'auteur est juste.** Il lui manque quatre points : les autres signaux rouges déjà mesurés, la fragilité des instruments (un défaut de mesure a été trouvé ce matin), l'empilement des règles, et l'absence de toute partie humaine.
- **Le risque est réel, et élevé.** Le défaut du rêve n'est pas un accident isolé. C'est le symptôme d'une architecture faite de **courses parallèles** : l'esprit vers le 7, le Cercle, l'horloge, la forêt qui s'use. Les actions des joueurs touchent chacune une seule course, et une seule ressource les relie, des cartes toutes identiques. D'autres choix du jeu ont la même structure ; on peut prédire lesquels (section 2.3).
- **P1 ne peut pas réparer cela.** Une recherche de paramètres déplace des moyennes ; elle ne crée pas un dilemme (principe 3). Ses instruments, des bots Monte-Carlo à un coup qui raisonnent siège par siège, sont justement aveugles aux stratégies de long terme et aux engagements collectifs, c'est-à-dire au rêve et au Cercle. P1 détecte bien, mais il conçoit mal.
- **Proposition : concevoir le noyau avant de le régler.** Suspendre le cycle 2, faire un audit structurel des choix (une session), tester des mécanismes sur un modèle jouet avant le moteur, et faire jouer un prototype papier par l'auteur. P1 ne reprend qu'après une porte de conception explicite (section 3.1).
- **Quatre directions de conception** pour le cœur du jeu (section 3.4). Deux touchent des idées verrouillées ou des invariants, et reviennent donc à l'auteur.

## 1. Le bilan, vérifié et complété

### 1.1 Ce qui est juste
- L'atelier décrit un arbre de variantes. P1 devait l'explorer, l'évaluer et sélectionner une V1.
- P1 a été amélioré en cours de route : statistiques appariées, garde-fou « aucune boucle gagnante », tests T1 à T5 du choix stratégique.
- La réflexion sur P2 (la campagne de profondeur) a produit des outils, dont une partie est déjà appliquée (`avant-ou-apres-v1.md`).
- Le choix « rêver ou défendre » bloque, et trois essais de mécanisme n'ont rien donné : le rêve disputé, sa grille de réglage, puis le somnambule.

### 1.2 Deux précisions
- **P1 a peu exploré l'arbre.** La phase 3 a comparé les options de la v2 une à une, autour d'une version qui finissait au tour 3. Le diagnostic prévenait que ses verdicts seraient « à revérifier une fois la durée corrigée ». L'auteur a ensuite fixé la V0.3, et un seul cycle de recherche a tourné, sur 13 paramètres, avec des gloutons. Les choix de structure ont donc été figés tôt, sur des mesures faites dans un régime qui n'est plus celui du jeu.
- **Le problème du rêve n'est pas « présent dans toutes les variantes » par malchance.** Il vient de la structure : la valeur d'un rêve ne dépend que du temps qui reste (`choix-strategique.md`, section 3). Aucune variante de paramètres ne pouvait l'éviter.

### 1.3 Ce qui manque
**a. Les autres signaux déjà mesurés.** Ils sont dispersés dans les bilans et n'ont jamais été lus ensemble.

| Signal | Mesure | Source |
|---|---|---|
| Quatre des huit mécanismes centraux mesurés (notés 8) passent sous le seuil de T1 en V0.4, avec le bot fort | tir à la corde 0,05 par partie ; rêve sur le présage 0,04 ; oubli en 12 : 0,33 ; ordre annulé par un esprit : 0,49 | campagne 19, relue ce matin (`python -m foret.mecanismes`) |
| À 2 joueurs, le rêve n'existe plus pour aucun bot fort | 0 à 0,5 carte en rêve par partie, 100 % de fins par la nuit, pour MC64R, MCP64 et MC 256 | campagnes 18 et 19, duos |
| Saboter pèse peu | 1 point en V0.3 (alerte B) | diagnostic |
| La communication n'apporte rien aux bots, et le chef unique non plus | +0,7 % (alerte C) | ligne de base P2 |
| Les traces sont pourtant la décision la plus fréquente | 74 décisions de trace par partie (V0.4, MC64R) | campagne 19 |
| Des moitiés de carte presque mortes | Voler 4 % des fois offert ; Se fondre 14 % | campagne 19 |
| Un peuple pèse deux fois moins | insectes 0,51 en Shapley (V0.4) | protocole P3 |
| Parer au plus probable vaut presque le bot fort | tape-taupe 4,6 points (orange) | protocole P3 |
| À 5 et 6 joueurs, lire le jeu ne rapporte rien aux gloutons | échelle de la lecture rouge | garde-fou, ligne de base |

**b. La fragilité des instruments.** Plusieurs verdicts changent avec le bot :
- en v1, le rêve domine pour le glouton et ne compte pas pour MC 64 ;
- en V0.4, la forêt gardée vaut 71 à 76 % selon le bot de MC 64, et 87 % avec MC 256 à portefeuille (campagne 18) ;
- l'écart de difficulté du cycle 1 varie du simple au triple entre les deux bots ;
- l'avantage du rêve dans T3 dépend des suites du bot (MC64R rêve à horloge fixe dans ses suites).

**Défaut trouvé ce matin, corrigé.** Dans `maquettes/v2.json`, les témoins de communication « aucun signe » et « tout dire » étaient écrits comme des codes d'atelier complets. Hérités par la V0.3, la V0.4 et la V0.4rd, ils remplaçaient toute la version : plus de lunes, plus d'escalade, et un Cercle à 3 cases par joueur. En V0.4, la mesure de coordination comparait donc la V0.4 à un autre jeu, la V2 proposée sans lunes. En duo, ce jeu-là finit au tour 3 par le réveil, avec 88 % de forêt.
- J'ai d'abord pris ce chiffre pour une stratégie dominante cachée, la « ruée vers le Cercle ». C'est en vérifiant les règles chargées que le défaut est apparu.
- **Conséquences.** Aucune décision n'a été prise sur ces chiffres : ceux de la V0.4 n'avaient jamais été lus. En V0.3 et en duo, l'écart est sans effet, puisque 2 lunes à deux joueurs reviennent à un rêve par joueur.
- **Correction.** Les deux variantes ne changent plus que la communication. `tests/test_variantes_heritees.py` vérifie qu'une variante de mesure ne change que sa cible, sur la v2 et ses descendantes.
- **Leçon.** Une chaîne de mesure de cette taille peut se tromper en silence, et un analyste pressé peut tirer une conclusion de conception d'un artefact. C'est un argument de plus pour vérifier le mécanisme avant de croire au résultat.

**c. L'empilement des règles.** Depuis la v1 se sont ajoutés :
- le plan « qui et où », le rayon, le favori et le remorquage ;
- les deux voies du rêve et le Cercle ;
- les lunes, les traces et le présage ;
- le sablier, les ordres supplémentaires, l'escalade, et des réglages par taille de table ;
- pour les essais, le cauchemar et le somnambule.

Chaque correction a ajouté une règle, et les défauts de fond sont restés. La charge de règles (profil Sophie : 60 minutes au plus) n'est pas mesurée.

**d. Aucune partie humaine.** Toutes les conclusions viennent des bots. Le plaisir, la lisibilité, la coordination réelle et les stratégies qu'une table trouve en parlant ne se mesurent qu'avec des humains. Le plan les repousse à la V1.0.

### 1.4 Ce qui va bien (à garder)
- **Le côté du Méchant est sain en V0.4.** La concentration de la menace et la surprise sont vertes. Le Méchant qui apprend pèse désormais : sans apprentissage, les joueurs gardent 6,3 points de forêt de plus (campagne 19, sûr), contre 1,7 en V0.3. La réforme « qui et où » a marché.
- **Le plancher est vert** : aucun effort n'est vain.
- **L'outillage est un très bon détecteur.** Moteur conforme, statistiques appariées, T1, garde-fou, pipeline autonome : c'est lui qui a trouvé le défaut du rêve. Il faut le garder comme banc d'essai et comme contrôle de non-régression.

## 2. Le risque : d'autres défauts structurels masqués ?

### 2.1 Verdict
**Oui, le risque est réel et élevé.** Continuer les cycles de P1 maintenant, c'est surtout régler un arbre dont le tronc n'est pas validé.

### 2.2 Pourquoi
1. **Une architecture de courses parallèles.** Le jeu fait avancer quatre compteurs presque indépendants :
   - l'esprit vers le 7 (le long sommeil) ;
   - le Cercle (le réveil, sans adversaire) ;
   - l'horloge (la nuit) ;
   - la forêt qui s'use.

   Défendre agit localement sur la forêt ; rêver fait avancer l'une des deux autres courses. Le seul lien entre les deux, c'est le budget de cartes. Or les cartes d'un peuple sont identiques, donc ce budget ne vaut que le temps qui reste. Le mécanisme qui devait opposer le Méchant au rêve, le tir à la corde, ne se produit pas, pour une raison de géométrie. Quand des sous-systèmes ne se touchent pas, la meilleure politique se découpe en horaires indépendants. On obtient alors des choix dominés ou indifférents, et des boucles. C'est exactement ce qu'on a vu sur le rêve ; rien ne protège les autres choix.
2. **Les seuils tout-ou-rien.** Le long sommeil et le réveil se déclenchent à un seuil. Un investissement partiel ne vaut rien, d'où des politiques en tout ou rien (« ruée » ou « jamais »). Le Cercle demande en plus un engagement collectif : si un seul joueur y rêve, son rêve est perdu. C'est un jeu de coordination (une chasse au cerf). Une table humaine le résout en une phrase (« on met tous nos rêves au Cercle »), alors qu'un bot qui raisonne siège par siège ne le résout pas. Un défaut de ce type peut donc échapper à tous nos bots et apparaître dès la première partie humaine.
3. **Les instruments et la recherche.** MAP-Elites sur des paramètres déplace des moyennes (principe 3) et sacrifie ce qui n'est pas dans le score (effet Goodhart du cycle 1). Le bot de référence, un Monte-Carlo à un coup avec des suites scriptées, ne voit ni les effets différés, ni les plans collectifs, ni la valeur de l'information. C'est pourtant le cœur du thème : le rêve, le Cercle, les traces. P1 peut donc non seulement coûter cher, mais aussi **rassurer à tort**. La durée « réglée » de la V0.4, par exemple, repose sur des bots qui ne cherchent jamais de stratégie collective.

### 2.3 Prédictions : les choix qui ont la même signature
| Choix | Signature à risque | Ce qu'on attend |
|---|---|---|
| Voie du sommeil ou du réveil | deux courses à seuil, le Cercle sans adversaire | tout ou rien ; un horaire collectif qui domine selon la taille de table |
| Prendre une lune | ne vaut que si le rêve vaut | indifférent tant que le rêve l'est |
| Voir, Hanter (une fois par tour) | ressource renouvelée chaque tour | « dès que possible » : un horaire |
| Saboter ou barrer | sans le silence du chantier, saboter n'achète que du temps | Saboter dominé (alerte B) |
| Moitié haute ou basse | une moitié meilleure pour chaque peuple, quelle que soit la situation | des moitiés mortes (Voler, Se fondre) |
| Où poser une trace | les bots n'en tirent rien | coût de décision sans valeur (alerte C), à juger par des humains |

Chacune de ces lignes se vérifie à peu de frais, avec les données déjà produites et la fiche du choix. C'est l'audit proposé en 3.2.

### 2.4 Nuance
- Le risque joue dans les deux sens : des défauts réels peuvent rester masqués, mais certains rouges peuvent n'être que des artefacts de bots. La coordination nulle en est un exemple probable. Les deux cas appellent le même remède : vérifier le noyau par des moyens plus directs que la recherche massive.
- Le travail fait n'est pas perdu. Il change de rôle : de concepteur, l'outillage devient banc d'essai.

## 3. Pistes de fond

### 3.1 Changer l'ordre : le noyau d'abord, le réglage ensuite
Je propose d'insérer une phase **P0, concevoir le noyau**, avant toute reprise de P1.
1. **Partir du cœur.** Garder le plus petit jeu qui porte le thème (le préréglage « le cœur seul » de l'atelier), sans lunes, Cercle, traces, escalade ni ordres supplémentaires.
2. **Faire marcher son choix central**, puis ajouter les modules un par un. Chaque module passe par sa fiche du choix et ne doit pas casser la porte. L'arbre combinatoire laisse place à un empilement validé.
3. **La porte de conception.** P1 reprend seulement quand le noyau la passe :
   - **T1** : chaque mécanisme noté 8 ou 9 se produit au moins 0,5 fois par partie, au bot fort ;
   - **T3** : le gain du jugement est sûr et d'au moins 5 points, avec deux instruments de nature différente ;
   - **garde-fou** : aucune boucle ni aucun horaire, y compris collectif (tous les sièges au même horaire), à moins de 3 points du bot fort ;
   - **jeu restreint** : retirer une action ou un pouvoir coûte au moins 3 points (« chaque choix compte ») ;
   - **humain** : sur trois parties papier, l'auteur note au moins un vrai dilemme par tour.
4. **Ensuite seulement P1** (réglage des paramètres, tailles de table, difficulté), puis P2.

### 3.2 Des outils de conception rapides, avant le moteur
- **Audit structurel** (une session de Claude, presque sans calcul). Pour chacun des dix choix du jeu : fiche du choix, couplages (quel indice public renverse le choix ? quelle option il pénalise en même temps), signature (horloge seule, seuil, seuil collectif). On y croise les données existantes : T1, usage des options, jeu restreint. Le livrable est un registre des défauts latents, classés.
- **Modèle jouet.** Un script de cinquante lignes qui abstrait le choix (menace de l'étape, portée de la défense, rêve, seuil), résolu exactement en quelques secondes. Il dit si un mécanisme *peut* créer un choix disputé avant qu'on le code dans le moteur. Les trois essais du rêve y auraient été écartés en quelques minutes.
- **Prototype papier.** L'auteur joue seul, deux puis trois mains, la variante candidate, avec une fiche d'observation : où j'ai hésité, ce qui était évident, ce qui m'a ennuyé. Une heure de jeu humain vaut ici plus qu'une campagne. C'est le seul moyen de voir les stratégies collectives et la lisibilité.

### 3.3 Des instruments plus neutres
- **Contrôle des variantes** (fait aujourd'hui pour les variantes de mesure) : chaque rapport liste ce qu'une variante change par rapport à sa référence.
- **Un bot d'équipe** qui choisit un plan commun parmi quelques plans de table (défendre, ruée vers le sommeil, ruée vers le Cercle, rêver sur le présage, mixtes par tour), puis joue les actions en Monte-Carlo. Il imite une table qui se concerte et teste les seuils collectifs. Coût : une session de code.
- **Une règle de lecture** : un verdict qui change entre deux instruments raisonnables est rapporté « non établi ».
- **Plus tard**, un vrai MCTS ou l'itération d'expert de la campagne de profondeur, une fois le noyau choisi.

### 3.4 Directions de conception pour le cœur
Quatre principes à viser, en complément des sept de `choix-strategique.md` :
- **une ressource partagée et hétérogène** : ce qu'on sacrifie a un coût lisible et variable ;
- **un même objet disputé** : rêver et défendre agissent sur la même chose (la même menace, la même tuile, la même zone) ;
- **des effets progressifs plutôt que des seuils** : chaque rêve rapporte un peu tout de suite, et les fins sont des conséquences, pas des cibles ;
- **pas de seuil collectif sans adversaire.**

| Direction | Idée (une phrase) | Pourquoi elle traite la cause | Risques | Touche |
|---|---|---|---|---|
| **D1. Le rêve détourne** | Une carte en rêve sur une étape endort la tactique que les dés désignent à cette étape (l'ordre est annulé) et fait avancer l'esprit ; la fin par le sommeil devient une conséquence. | Défendre vaut quand la menace est à portée de mes pions ; rêver vaut quand elle est hors de portée. La géographie, lue sur le présage, tranche à chaque étape. C'est le « témoin disputé » imaginé dans `choix-strategique.md` (section 6), promu en règle. | Seule la première étape est connue ; le rêve peut devenir une défense à distance trop sûre. | une règle (accord de l'auteur) |
| **D2. Des cartes qui ne se valent pas** | Chaque personnage porte une marque (une tactique, une zone ou une force) ; rêver avec une carte endort la tactique de sa marque, ou agit selon sa force. | Le coût d'un rêve dépend de la carte et de la situation, plus seulement du temps (principe 5), comme les cartes de ville de *Pandemic*. | Plus de lecture ; touche l'idée verrouillée B5. | B5 (auteur) |
| **D3. Une seule fin provoquée, disputée** | Les deux voies se fondent en une balance : les rêves la poussent vers le sommeil, les ordres réussis la tirent vers l'éveil. Ou bien le Cercle reçoit un adversaire : un rêve se pose sur une zone boisée et disparaît si elle est abattue. | Une course de moins ; plus de seuil sans adversaire ; la riposte frappe à chaque ordre. | Touche la piste des esprits ou le Cercle. | invariant de principe (auteur) |
| **D4. Repartir du cœur** | Retirer les modules, faire passer la porte au cœur seul avec D1 (ou D2), puis réintroduire les modules un par un. | Isole les défauts ; mesure ce qu'apporte chaque module. | Retour en arrière apparent sur la V0.4. | méthode |

**Ma recommandation** : D4 comme cadre, D1 d'abord, sur le modèle jouet puis sur papier. D2 si l'auteur accepte d'ouvrir B5 a minima. D3 en réserve.

### 3.5 Plan proposé
| Étape | Qui | Coût | Livrable |
|---|---|---|---|
| 1. Audit structurel des dix choix | Claude | une session, sans campagne | registre des défauts latents |
| 2. Modèle jouet ; D1 à D3 évalués dessus | Claude | une session | fiche par direction : régime prédit (dominé, indifférent, disputé) |
| 3. Prototype papier du cœur avec la direction retenue | auteur | 1 à 2 h | fiche d'observation |
| 4. La direction retenue dans le moteur (variante) ; T1 et T3 avec deux instruments | Claude | une session, une campagne | bilan, puis décision de l'auteur |
| 5. Porte de conception passée : reprise de P1 | les deux | – | plan du cycle 2 refondu |

## 4. Décisions demandées à l'auteur (avec recommandation)
1. **Suspendre le lancement du cycle 2** jusqu'à ce que le noyau passe la porte de conception. *Recommandé.*
2. **Somnambule** (décision en attente) : A, l'écarter et revenir à la conception. *Recommandé* : c'est cohérent avec ce qui précède.
3. **Adopter la démarche « noyau d'abord »** (section 3.1) et la porte de conception, avec ses critères à confirmer. *Recommandé.*
4. **Directions à explorer** sur le modèle jouet : D1 et D4. *Recommandé.* D2 seulement si l'auteur accepte d'ouvrir B5 a minima, D3 en réserve, puisqu'elles touchent une idée verrouillée ou un invariant de principe.
5. **Prototype papier avant tout nouveau code de règle**, joué par l'auteur. *Recommandé.*

*Pour information (choix technique déjà fait, sans décision à prendre) : correction des variantes de communication héritées et test associé (section 1.3).*
