# Moteur de règles : « Le Méchant qui rêve »

*Documentation technique du moteur (version 1.5). Pour la carte du dépôt et les documents de conception, voir le [README](../README.md) à la racine. Les commandes se lancent depuis la racine du dépôt.*

Moteur sans interface du jeu coopératif, avec ses maquettes de règles, ses bots et ses
campagnes de simulation. Il sert à trouver les bugs, incohérences et lacunes des règles,
et à comparer des versions de règles entre elles.

Python 3.10 ou plus, sans dépendance (pytest pour les tests).

## Démarrage

```bash
# Une partie commentée, étape par étape
python -m foret.partie --peuples oiseaux insectes --bot glouton --graine 3
python -m foret.partie --maquette v0 --variante fin_de_tour --peuples reptiles entites --bot aleatoire
python -m foret.partie --peuples mammiferes humains --params '{"reves_par_tour": 1}'
python -m foret.partie --peuples oiseaux humains --decisions decisions.jsonl   # + journal des décisions
python -m foret.partie --variante comm_partage --peuples oiseaux mammiferes humains

# Une campagne (JSON dans campagnes/), sur la maquette qu'elle indique ou une autre
python -m foret.sim reference                      # 112 350 parties, ~8 min sur 2 cœurs
python -m foret.sim reference --maquette v0
python -m foret.sim reference --echelle 0.05       # 5 % des parties, pour un essai

# Comparer deux campagnes
python -m foret.comparer resultats/reference__v0 resultats/reference__v1 --noms v0 v1 --detail

# Conformité règles ↔ code ↔ tests, et tests
python -m foret.conformite
python -m pytest -q tests
```

Une partie plantée pendant une campagne est notée dans `erreurs.jsonl` avec sa maquette,
sa variante, ses peuples, son bot et sa graine : `foret.partie` la rejoue à l'identique.

## Campagnes par lots, et sur GitHub Actions

Une campagne se découpe en lots indépendants, joués sur des machines différentes puis fusionnés :

```bash
python -m foret.sim reference --echelle 0.05 --lot 3/16 --sortie lots/    # le lot 3 sur 16
python -m foret.sim reference --echelle 0.05 --fusionner lots/ --sortie resultats/essai
```

La fusion refuse un jeu de lots incomplet ou en double, et rend la même synthèse qu'une
exécution unique (hors date et durée). Les workflows de `.github/workflows/` font cela dans le cloud :

| Workflow | Rôle |
|---|---|
| `tests.yml` | À chaque push : conformité (règles v1, nœuds v2, mesures) et tests, sous Python 3.10 et 3.12 |
| `campagne.yml` | Lancement manuel : une campagne, une maquette, une échelle, N lots en parallèle, puis fusion. La synthèse est publiée sur la branche `resultats` (`campagnes/<campagne>_run<n>/`, avec un `resume.md` écrit par `scripts/resume_campagne.py`) et en artefact `synthese-<campagne>-<n>` |

Pour lancer une campagne : onglet **Actions** → **Campagne** → **Run workflow**.

## Organisation

```
maquettes/*.json ──charger──▶ Partie (moteur.py) ──decider(type, options)──▶ bot (bots/)
   (règles en données)          │   ▲                                       (choisit une option)
                                │   └── registres : criteres.py, chantier.py, pouvoirs.py
                                └── signaler ──▶ observateurs (lacunes, incohérences, stats, journal)
campagnes/*.json ──sim.py──▶ resultats/<campagne>__<maquette>/synthese.json ──comparer.py──▶ tableau
docs/regles_v1.md ◀──conformite.py──▶ renvois « R4.4 » dans foret/ et tests/
```

| Fichier | Rôle |
|---|---|
| `maquettes/v0.json`, `v1.json`, `v2.json` | Les règles et le matériel en données ; v1 n'écrit que ses différences avec v0, v2 avec v1 ; chaque maquette déclare ses variantes (v2 : aussi par code d'atelier) |
| `docs/regles_v1.md` | Les règles écrites de la maquette v1, numérotées (R1.1…) |
| `foret/maquette.py` | Chargement, héritage, variantes, validation stricte (une clé inconnue est une erreur) |
| `foret/moteur.py` | La partie : mise en place, conseil, résolution, piste, fins, invariants, bilan |
| `foret/plateau.py` | Zones, liaisons, rivières, distances |
| `foret/criteres.py` | Critères des tactiques (registre `CRITERES`) |
| `foret/chantier.py` | Ordres de chantier (registre `CHANTIER`) |
| `foret/pouvoirs.py` | Règles brisées des peuples (registre `POUVOIRS`, points d'accroche) |
| `foret/decisions.py` | Catalogue des décisions demandées aux joueurs |
| `foret/lacunes.py` | Registre des lacunes et incohérences que le moteur compte |
| `foret/observateurs.py` | Ce qui reçoit les signaux du moteur (compteurs, journal, journal des décisions, vos détecteurs) |
| `foret/bots/` | Interface de bot, registre `BOTS`, bots `aleatoire` et `glouton` |
| `foret/sim.py`, `campagnes/` | Campagnes décrites en JSON, exécution en parallèle, synthèse |
| `foret/comparer.py` | Tableau de comparaison entre deux synthèses |
| `foret/conformite.py` | Matrice règle → code → tests |
| `tests/` | Un test par règle (cité dans la docstring), outillage, modes hérités de v0, copie et journal des décisions (`test_copie_journal.py`) |

## Copier une partie en cours, journal des décisions (moteur 1.1, phase 1)

Outils pour les mesures et les bots chercheurs ; ils ne changent aucune règle (campagne de
référence identique au chiffre près).

**Segments et points sûrs.** Une partie avance par segments : `("conseil", tour)`,
`("etape", tour, étape)`, `("fin_tour", tour)` (`partie.position`). Au début de chaque
segment, les observateurs qui ont une méthode `point(partie, segment)` sont appelés.

**`partie.copie(bots=None, hasard=None, imposer=(), journal=False, observateurs=(), reprises=False)`**
rend une partie indépendante, que l'on joue jusqu'au bout avec `copie.jouer()`.
- Où : avant `jouer()`, depuis `point()` (copie directe de l'état), ou pendant une décision,
  depuis un bot (la copie repart de la dernière photo, ou du début de la partie, et rejoue
  les décisions déjà prises : elle n'atteint le point de copie qu'une fois lancée).
- `bots` : un bot par siège ; par défaut des copies des bots actuels. Avec le même hasard, la
  copie finit alors exactement comme l'original (vérifié par les tests).
- `hasard` : un entier pour tirer un autre avenir (dés à venir) à partir du point de copie ;
  le passé, y compris les dés déjà vus (Voir), ne change pas.
- `imposer` : indices des options à prendre pour les prochaines décisions, à commencer par la
  décision en cours (pour évaluer chaque option d'une décision).
- `Partie(..., reprises=True)` prend une photo au début de chaque segment : chaque copie
  faite pendant une décision coûte alors moins de rejeu, mais la partie est 2 à 3,5 fois
  plus lente. À réserver aux bots qui copient beaucoup.
- La copie voit tout (mains, paquets) : un bot qui ne doit pas tout savoir devra tirer au
  sort ce qu'il ignore (phase 2).

Coûts mesurés (1 cœur, glouton, octobre 2026) : copie directe 2 ms en duo, 5 ms à six ;
copie pendant une décision 0,5 ms (depuis le début) à 2 ms (depuis la photo), plus le rejeu
(environ 3 ms en duo depuis le début) ; finir la partie depuis le tour 3 coûte 10 ms en duo,
29 ms à six avec le glouton.

**Journal des décisions.** `JournalDecisions()` (observateur) note chaque décision prise par
un bot ou imposée : tour, étape, siège, peuple, type, options offertes, indice et option
prise, contexte, forcée (une seule option), imposée. `resume()` donne par type le nombre de
décisions, la part forcée et le nombre moyen d'options ; `ecrire(chemin)` écrit un JSONL ;
`JournalDecisions(options=False)` ne garde que le nombre d'options. Chaque partie garde
aussi la suite de ses décisions sous forme `(type, indice)` (`partie._decisions`), ce qui
suffit à la rejouer.

**Bots et copies.** Un bot qui garde un plan d'un appel à l'autre doit le rattacher à
`partie.lignee` (commun à une partie et à ses copies) et désigner les cartes par leur
identifiant (`carte.uid`), pas par l'objet : c'est ce que fait le glouton depuis la 1.1.

## Communication et présage (moteur 1.2, phase 1b)

Le conseil suit le livret (R2.1) : Voir, la communication (R2.5), le présage (R2.6), puis la
programmation en silence. La forme de communication est une règle de la maquette
(`regles.communication`) :

| Valeur | Ce que font les joueurs | Décisions |
|---|---|---|
| `parle` (v1, livret) | Conseil parlé, approché par des traces non datées : « ce tour, j'agirai ici » (3 par joueur) | `trace` |
| `traces` (v2) | Traces datées, 2 par joueur (`traces_par_joueur`, `traces_datees`) ; `traces_engagent` les rend obligatoires | `trace` |
| `partage` (v2, façon The Gang) | Deux jetons par Machine en marche, pris au centre ou à un autre joueur (`partage_max` devant soi) | `partage` |
| `aucun_signe` (témoin) | Rien | — |
| `tout_dire` (témoin) | Une trace datée par étape, et les programmes déjà faits visibles (`programmes_visibles()`) | `trace` |

« Sans ordre de tour » est modélisé par des rondes dans l'ordre des joueurs, jusqu'à ce que
rien ne bouge (`rondes_conseil`, 3 au plus). Les bots lisent les signes avec `partie.signes()`
et les dés déjà vus (présage, Voir) avec `partie.ordre_connu(etape)`.

Variantes de la v1 : `sans_presage` ; `reference_1_0` (ni communication ni présage : avec le
glouton réglé `communique: "non"`, `des_connus: false`, rejoue la référence publiée le 11 oct.,
vérifié sur 192 parties par `tests/test_communication.py`) ; `comm_aucun_signe`, `comm_traces`,
`comm_traces_engagent`, `comm_partage`, `comm_tout_dire`. Campagne : `campagnes/communication.json`.

Le glouton : `communique` = `"non"`, `"annonce"` (par défaut : il annonce ses intentions sans
se servir de celles des autres) ou `"complet"` (il s'en sert pour saboter avec un allié annoncé
et le rejoindre) ; `des_connus` (par défaut vrai) : il se sert des dés déjà vus pour l'étape.
Un bot qui rend `None` là où ce n'est pas permis (trace qui engage) reçoit la première option.

## La maquette v2 (moteur 1.3, phase 1c)

`maquettes/v2.json` hérite de la v1 et joue le préréglage « V2 proposée » de l'atelier
(« Atelier de la Forêt qui rêve ») : deux pistes « qui et où » (la somme des dés désigne une
tactique, l'écart une Machine sur la piste des Machines ; la tactique choisit une zone dans le
rayon de la Machine), cycle des Machines (au chantier elle entre, hors service elle est
remorquée), doublé du favori, traces, présage, deux voies du rêve au choix (le sommeil ou le
Cercle), trois fins (sommeil, réveil de la forêt, nuit ; plus de silence du chantier), bilan
sans bonus.

Toute variante de l'atelier se joue par son **code** :

```bash
python -m foret.atelier --presets                          # codes des préréglages
python -m foret.atelier "c:A2a,d_bb,C2a,D2v_choix|m:C3,D5|p:lunes=3"   # ce que le code change
python -m foret.partie --maquette v2 --variante "code:c:A2b,d_fav,C2a,D2v_choix|m:C3|p:" --peuples oiseaux humains
python -m foret.sim v2_options                             # une option changée à la fois
python -m foret.conformite --v2                            # nœuds de l'atelier ↔ code ↔ tests
```

| Fichier | Rôle |
|---|---|
| `foret/plans.py` | Les plans de la v2 : « qui et où » (piste des Machines, rayon, flèches, cycle, doublé, escalade), « où et comment » (manœuvres), menace sur les 21 paires de dés, apprentissage des deux pistes |
| `foret/atelier.py` | Lecteur du code de variante (`c:…|m:…|p:…`), préréglages, exigences entre nœuds |
| `docs/noeuds_v2.md` | Les nœuds de l'atelier tels que le moteur les joue, avec les choix de modélisation à confirmer |
| `tests/test_v2.py` | Au moins un test par nœud codé, cité `[v2:<nœud>]` ; dont le calcul exact de l'atelier (0,83 forêt par plan, 6/36 entrées, 53 % sur deux zones) |

Nouvelles règles de maquette (toutes présentes, avec la valeur v1 par défaut) : `plan`, `double`,
`portee`, `machine_hs_designee`, `escalade`, `voies_reve`, `cercle_par_joueur`,
`silence_du_chantier`, `bonus_fin`, `reves_par_tour_table`, `lunes`, `egarer`, `barrage_sortie` ;
sections `manoeuvres`, `machines.sixieme`, `plateau.fleches`, champ `entree` des Machines.
Nouvelles décisions : `lune` ; la décision `reve` peut offrir `("reveil",)`. Le bilan donne
`resultat` (forêt + bonus selon la fin) et le Cercle ; la synthèse d'une campagne donne
`resultat_pct` et la marge `foret_pct_ic95`.

Le glouton joue la v2 avec des règles simples : `voie` (`auto` : la voie la plus proche de sa
fin), il prend une lune s'il prévoit de rêver, et lit la menace avec le plan de la maquette.
Non codés : les modules B4 (peuples des plans au conseil) et les idées verrouillées (A6, A7, B5),
le gabarit de plateau g1.

## La batterie d'évaluation (moteur 1.4, phase 1d)

Les mesures des niveaux 1 et 2 du plan, celles des objectifs d'expérience qui ne demandent pas
le bot fort, le volet coordination, et leurs témoins. Détail : `docs/mesures.md`.

```bash
python -m foret.batterie plan                 # parties par configuration
python -m foret.batterie phase1               # tout le plan (une expérience déjà faite n'est pas rejouée)
python -m foret.batterie phase1 --echelle 0.2 # essai
python -m foret.batterie rapport              # resultats/batterie/rapport.json
python -m foret.batterie phase1 --lot 3/8 --sortie lots/   # le lot 3 sur 8 (une machine par lot)
python -m foret.batterie phase1 --fusionner lots/          # rassemble les lots, puis le rapport
python -m foret.conformite --mesures          # chaque mesure : code, test, témoin
```

| Fichier | Rôle |
|---|---|
| `foret/mesures.py` | `Mesureur` (observateur : menace avant chaque étape, ordres tirés, décisions, temps estimé, piste finale), `Sondeur` (copies jouées depuis un point, avec un autre hasard), fonctions d'agrégation (Shapley, synergies, bandes…), registre `MESURES` (étiquette, bandes provisoires, témoins) |
| `foret/batterie.py` | Le plan de la phase 1 (configurations et expériences : équipes, spectateur, taux de rêve, coordination, échelle des bots), l'exécution en parallèle, le rapport |
| `foret/bots/inerte.py` | Bot qui ne joue rien : valeur de l'équipe vide v(∅) pour Shapley, siège spectateur |
| `docs/mesures.md` | Définitions, protocole, témoins |
| `tests/test_mesures.py` | Tests des mesures, cités `[mesure:<id>]` |

Nouveautés du moteur, sans effet sur les règles (référence publiée rejouée à l'identique) :
- les observateurs peuvent avoir une méthode `ordre(partie, info, reussite, abattues)`, appelée
  pour chaque ordre exécuté, avant l'apprentissage ;
- deux règles de **témoin** (jamais des règles du jeu) : `des_fixes` (dés truqués : `[a, b]`) et
  `apprentissage` (`false` : le Méchant n'apprend plus) ; tous les lancers passent par
  `partie.lancer_des()` ;
- les variantes témoins `temoin_*` de `maquettes/v1.json` et `v2.json`.

### Moteur 1.5 (décisions de fin de phase 1, 12 oct.)
- B4 : « voir_trahi » n'est plus une incohérence (stat `voir_detourne`, R6.2) ; en v1, abattre en chemin
  quand la cible est barrée est permis (stat `coupe_en_chemin_cible_barree`, R4.3) ; le barrage v0 garde
  son incohérence. Tests : `tests/test_decisions_phase1.py`. Les empreintes de la référence 1.0 sont
  comparées après avoir remis ces compteurs sous leur ancien nom.
- B2 : synergie = duos qui battent leur meilleur peuple seul (vert ≥ 12 sur 15) ; tétraèdre par la
  synergie relative entre duos (`duo_contre_meilleur_seul`, `synergies_relatives`).
- B3 : siège spectateur tenu par le bot inerte. B1 : bandes gelées (`MESURES`).

### Moteur 1.6 : la batterie par lots (12 oct.)
Aucune règle ne change. Toutes les parties du plan sont numérotées dans un ordre fixe ; le lot i sur n
joue les parties i, i+n, i+2n… et les écrit, compressées, dans `<sortie>/batterie_lot_XXXX_sur_YYYY.jsonl.gz`
(avec un `.meta.json`). La fusion vérifie que tous les lots viennent du même plan (même empreinte :
configurations, échelle, moteur), qu'aucun lot ni aucune partie ne manque ou n'est en double, puis écrit
exactement les fichiers d'un calcul d'un seul tenant : le rapport est identique (vérifié sur le petit
plan de `tests/test_batterie_lots.py`, et à la main sur v1_g1 et v2_g0 à l'échelle 0,05). Un lot déjà
écrit pour le même plan n'est pas rejoué : relancer la même commande ne refait que les lots manquants.
Le workflow **Batterie** (`.github/workflows/batterie.yml`) joue les lots en parallèle sur GitHub, fusionne,
calcule le rapport et le tableau de bord, et les publie sur la branche `resultats` (`batterie/run<n>/`,
avec un `resume.md` écrit par `scripts/resume_batterie.py`).

## Faire évoluer

**Une nouvelle itération des règles.** Créer `maquettes/v3.json` avec `"base": "v2"` et
n'y écrire que ce qui change ; décrire ses règles dans `docs/` comme pour les versions
précédentes. Les campagnes existantes tournent telles quelles : `python -m foret.sim reference --maquette v3`, puis
`foret.comparer`.

**Une variante** (pour la tester sans changer la maquette). L'ajouter dans la section
`variantes` de la maquette : c'est un morceau de maquette fusionné par-dessus
(`{"regles": {"barrage": "v0"}}`). Une variante héritée se retire avec `null`.

**Un réglage existant.** Toutes les règles paramétrables sont listées et vérifiées dans
`REGLES` (`maquette.py`) ; les paramètres des pouvoirs sont dans la section `pouvoirs`
(`par_tour`, `actif`, `mode`, `organes`…). L'annexe de `docs/regles_v1.md` dit où régler quoi.

**Un critère de tactique, un ordre de chantier.** Écrire une fonction dans `criteres.py` ou
`chantier.py` avec le décorateur du registre, puis la citer par son nom dans `tuiles`.

**Un pouvoir de peuple.** Écrire une classe dans `pouvoirs.py` avec `@POUVOIRS("nom")` et
n'implémenter que les points d'accroche utiles (`conseil`, `destinations`, `differe`,
`sabotage_seul`, `apres_action`, `machine_hs`, `invisible`, `barres_passives`…) ; l'attribuer
à une moitié de carte dans `peuples`. `Pouvoir.utiliser()` gère les pouvoirs limités par tour
et demande au joueur s'il les utilise.

**Une décision nouvelle.** La déclarer dans `decisions.py` puis l'appeler par
`partie.decider(siege, "type", options, **contexte)`. Les bots qui ne la connaissent pas
choisissent au hasard : rien ne casse.

**Un bot.** Hériter de `Bot` (`bots/base.py`), déclarer `PARAMS` (paramètres et valeurs par
défaut), écrire une méthode `d_<type>` par décision traitée, déclarer la classe avec
`@BOTS("nom")` et l'importer dans `bots/__init__.py`. Une campagne l'appelle par
`{"type": "nom", "params": {...}}`. Le glouton a déjà des réglages de style
(`reves_par_tour`, `garde`, `seuil_menace`, `preferences`, `presence`…).

**Une campagne.** Un fichier JSON dans `campagnes/` : des blocs qui croisent variantes, bots et
tables (`{"tailles": [2, 3]}` ou `{"liste": [[...]]}`), avec un nombre de parties.
Pour mêler plusieurs bots à une même table, il suffira d'étendre `jouer_une` (`sim.py`), qui
applique aujourd'hui une même spécification à tous les sièges.

**Un détecteur de cas problématique.** Écrire un `Observateur` (`observateurs.py`) qui
reçoit tous les signaux du moteur et peut compléter le bilan ; ou ajouter un code au
registre `lacunes.py` et le signaler depuis le moteur.

**Après tout changement de règle** : mettre à jour `docs/regles_vN.md`, ajouter un test qui
cite la règle, puis `python -m foret.conformite` (aucune règle sans test, aucun renvoi
orphelin) et `python -m pytest -q tests`.

## Ce que le moteur ne modélise pas
- La parole libre : le conseil parlé est approché par des traces non datées (R2.5). Un bot
  peut lire l'état public, les signes et les dés déjà vus, mais pas les cartes programmées par
  les autres (sauf en « tout dire ») ; rien ne l'empêche techniquement de lire les mains.
- Les pouvoirs propres aux personnages (porter, semer), le bruit et le dernier sursaut (présents
  mais désactivés), l'escalade, l'échelle de résultats du bilan.
