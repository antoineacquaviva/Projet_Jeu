# Maquette v1 - index : où trouver quoi
*Mis à jour le 12 oct. 2026 (maquette de conception v2 et sa place dans le plan de test ; phase 1 terminée, moteur 1.5). Point d'entrée pour toute discussion qui reprend la v1 ou la v2.*

## Nouveau (12 oct., fin de journée) : la batterie d'évaluation
- **Batterie d'évaluation (phase 1)** (doc du projet) : les mesures, leur validation par les témoins, les verdicts sur la v1 et « V2 proposée » (indices du glouton), les décisions B1 à B4 de l'auteur.
- **Batterie de la Forêt qui rêve** (artefact, tableau de bord) : https://claude.ai/artifact/9K122xkH4XH7xYodfVAbVG . Copie du source : `claude/moteur-v1/resultats/tableau_batterie_phase1.html` ; rapport brut : `claude/moteur-v1/resultats/batterie_phase1_rapport.json`.
- **Phase 1 - avancement** (doc du projet) : le journal des étapes 1a à 1d.
- Moteur 1.5 dans `claude/moteur-v1/` (248 tests ; `python -m foret.batterie phase1` rejoue toute la batterie en 35 minutes environ sur 2 cœurs).

## La maquette de conception v2 (12 oct.)
- **Atelier de la Forêt qui rêve** (artefact) : https://claude.ai/artifact/WJiQMwXDJEDwVvAERsDWss . Arbre des variantes (socle, choix, modules, paramètres), préréglages, livret de la variante assemblé à la volée, notes sur les quatre chantiers du 12 oct. (plan du Méchant à deux pistes, moteur des rêves et trois fins, conseil par traces, structure de la maquette), décisions à prendre. Source : `claude/maquette-html/atelier_v2.html`.
- **Maquette de conception v2 - plan du Méchant, fins, conseil** (doc du projet) : les propositions en texte, les chiffres et les décisions à prendre.
- **Place dans le plan de test** (décision du 12 oct.) : la v2 sera codée dans le moteur en phase 1, après les outils de mesure ; la phase 3 comparera les options de ses décisions ouvertes avec le bot fort ; l'auteur fixera ensuite la v2. Le bonus de fin est tranché : 0, pour la v1 comme pour la v2. Voir « Plan d'action » et « Objectifs, invariants et catalogue » (catalogue organisé selon l'arbre de l'atelier).
- La v1 ci-dessous reste la référence publiée du moteur ; la v2 est codée depuis le moteur 1.3 (voir plus bas).

## Les règles
- **Règles de la maquette v1** (doc du projet) : 43 règles numérotées R1.1 à R8.2, ce qui change depuis la v0, les décisions, les points ouverts, l'annexe « où régler quoi ». C'est la référence du moteur. Copie identique lue par le moteur : `claude/moteur-v1/docs/regles_v1.md`. À aligner sur le livret en phase 1 : le conseil en trois temps avec le présage (décision A2).
- **Maquette HTML v1** (artefact) : https://claude.ai/artifact/YFB14SaH8yknVvBY9VBDqS . Contenu de la boîte (plateau, piste, tuiles, Machines, plateaux de peuple, cartes), livret de règles avec exemples, notes de conception. Une copie du source est dans `claude/maquette-html/maquette_v1.html` (à ouvrir dans un navigateur).
- **Maquette v1 en données** : `claude/moteur-v1/maquettes/v1.json` (hérite de `v0.json`, n'écrit que ses différences). C'est ce que lit le moteur.

## Le moteur de simulation (Python 3.10 ou plus, seul pytest en dépendance)
**Moteur 1.3 (12 oct., phase 1c) : la v2 est codée.** `maquettes/v2.json` joue « V2 proposée » ; toute variante de l'atelier se charge par son code (`charger("v2", "code:…")`, `python -m foret.atelier`). Les nœuds de l'atelier tels que le moteur les joue, et les choix de modélisation à confirmer : `claude/moteur-v1/docs/noeuds_v2.md`. 220 tests ; conformité v1 45/45 et v2 par nœud (`python -m foret.conformite --v2`). Archive à joindre pour relancer : `foret_moteur_1_3.zip`. Premiers chiffres v1 contre v2 : « Phase 1 - avancement (copie d'état, communication, v2) ».

**Moteur 1.2 (12 oct., phase 1b)** : le conseil suit le livret (communication puis présage, R2.1, R2.5, R2.6) ; la v1 par défaut joue donc avec le conseil parlé (approché par des traces) et le présage. La variante `reference_1_0` rejoue la référence publiée. 147 tests, conformité 45/45. Archive à joindre pour relancer : `foret_moteur_1_2.zip`. Détails et premiers chiffres : « Phase 1 - avancement (copie d'état, communication, v2) ».

**Moteur 1.1 (12 oct., phase 1a)** : copie d'une partie en cours (`Partie.copie`) et journal des décisions (`JournalDecisions`, option `--decisions` de `foret.partie`). Aucune règle ne change : la campagne de référence complète (112 350 parties) est identique au chiffre près. 106 tests (67 + 39 dans `tests/test_copie_journal.py`), conformité 43/43. Fichiers modifiés dans le projet : `foret/moteur.py`, `observateurs.py`, `__init__.py`, `partie.py`, `bots/base.py`, `bots/glouton.py` (plan rattaché à la partie et à ses copies), `README.md`, et le nouveau `tests/test_copie_journal.py`. Le reste ci-dessous décrit la 1.0.

**Le projet contient le moteur complet** : les 31 fichiers de l'archive `foret_moteur_v1.zip`, à l'identique (réalignés sur l'archive le 11 oct. au soir), sous `claude/moteur-v1/` :
- `README.md` (architecture et manière d'étendre) ;
- `foret/` : moteur, plateau, critères, chantier, pouvoirs, décisions, lacunes, observateurs, maquettes, simulation, comparaison, conformité, `partie.py`, `erreurs.py`, `registre.py`, et `foret/bots/` (`base.py`, `aleatoire.py`, `glouton.py`) ;
- `tests/` (`__init__.py` vide, `outils.py`, `test_outillage.py`, `test_regles_v1.py` : 67 tests) ;
- `maquettes/` (`v0.json`, `v1.json`), `campagnes/` (`reference.json`, `ablation_v1.json`), `docs/` (`regles_v1.md`, `conformite_v1.md`).

**Pour le relancer dans une nouvelle discussion**, au choix :
1. joindre l'archive zip la plus récente (le plus simple) ;
2. ou recréer l'arborescence à partir des fichiers du projet (retirer le préfixe `claude/moteur-v1/`), puis `pip install pytest`.

Ensuite : `python -m pytest -q tests`, `python -m foret.conformite`, `python -m foret.sim reference --echelle 0.05`.

### Vérification du 11 oct. au soir (espace de travail de Claude)
- 67 tests passés ; conformité 43 règles sur 43 (aucune règle sans test, aucun renvoi orphelin).
- Campagne de référence complète rejouée (112 350 parties, 0 erreur) : synthèse **identique** à celle de l'archive, au chiffre près (seules la date et la durée diffèrent). Le moteur est déterministe et reproduit les résultats publiés.
- Machine : 2 cœurs (Intel Xeon 2,8 GHz), 7 Go de mémoire, Python 3.13.
- Vitesse mesurée : campagne de référence en 342 s sur 2 cœurs, soit **330 parties/s** (443 s documentées sur une machine plus lente) ; campagne réduite (`--echelle 0.05`, 5 869 parties) en 18 s sur 2 cœurs et 34 s sur 1 cœur (gain de 1,9 avec 2 cœurs).
- Vitesse par bot, sur 1 cœur, parties complètes : aléatoire 350 parties/s en duo (234 à 6 peuples) ; glouton sans rêve 66 parties/s en duo, 49 en trio, 21 à 6 peuples (il est 5 fois plus lent que l'aléatoire, à cause de ses calculs de menace) ; glouton qui rêve 150 à 220 parties/s (parties courtes).
- Un glouton qui ne rêve pas prend environ 180 décisions par partie de duo (tous sièges confondus), dont 39 % des choix d'action sont forcés.

## Les résultats
- **Moteur de règles v1 - conformité et campagne de référence** (doc du projet) : audit de conformité (43 règles sur 43 reliées au code et à un test), non-régression, campagne de référence, comparaison v0 / v1, ablation décision par décision.
- **Moteur de règles v0 - lacunes et incohérences** (doc du projet) : lacunes et incohérences trouvées en v0, avec l'état de chacune.
- `claude/moteur-v1/resultats/comparaison_reference_v0_v1.md` et `non_regression_v0.md` : rapports détaillés.
- Non conservés ici (trop volumineux, 2 Mo) : les fichiers `synthese.json` des campagnes. Ils se régénèrent avec les JSON de `campagnes/` (graines reproductibles, vérifié le 11 oct.).

## Choix faits à la rédaction de la maquette HTML v1, à confirmer
- Zones renumérotées et renommées : Lisière, Clairière, Várzea, Igapó, Sources, Colline aux aras, Samaúma (noms provisoires).
- Machines : 5 cartes, organes alignés sur le moteur ; Zizanie laissée de côté.
- Effets propres des 36 personnages : conservés sur les cartes, non joués en v1.
- Présage et silence du conseil conservés dans le livret ; le moteur ne les modélise pas (à coder en phase 1, décision A2).
- Somnolence et dernier sursaut mis de côté.
- Écart à régler : le livret donne 5 personnages de base plus un 6e ★, le moteur tire 5 cartes sur 7.

## Suite
Voir « Plan d'action - évaluer et explorer les variantes par la simulation ». Phase 0 validée ; phase 1 terminée (« Batterie d'évaluation (phase 1) »), décisions B1 à B4 prises le 12 oct. Ensuite : choix de l'environnement de calcul (« Cahier des charges - environnement de calcul cloud »), puis phase 2 (bot fort).
