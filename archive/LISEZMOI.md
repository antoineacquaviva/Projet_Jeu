# Archive

*Rangement du 16 oct. 2026. Rien ici n'est abandonné ni supprimé : ce sont les travaux qui ne sont plus sur la ligne active du projet (le modèle « placement », le kit par joueur et les deux pistes du Méchant), gardés pour être relus ou relancés. L'historique complet reste dans Git.*

## Ce qui est rangé ici

| Dossier | Contenu | Pourquoi archivé | Ce qui peut encore servir |
|---|---|---|---|
| `moteur-foret/` | Le moteur de simulation `foret` (moteur 1.8) du jeu complet V0.1 à V0.4 : règles en données (`moteur-foret/maquettes/`), campagnes, cycles, batterie, bots (glouton, Monte-Carlo, à portefeuille, `repete`), mesures, tests, workflows GitHub retirés, résultats de référence, documentation technique | La conception est recentrée depuis le 15 oct. sur la mécanique de base ; le cycle 2 est suspendu jusqu'à la porte de conception | Les pistes du Méchant et leur apprentissage (atelier v2, `moteur-foret/docs/noeuds_v2.md`) ; les mesures et leurs témoins (`moteur-foret/docs/mesures.md`) ; le bot Monte-Carlo ; le garde-fou « aucune boucle gagnante » ; la méthode des cycles (criblage, MAP-Elites, confirmation) |
| `conception-v0x/pilotage/` | Plan d'action, plan vers la V1, avant ou après la V1, campagne de profondeur, cahier des charges du calcul ; l'`ETAT.md` complet tel qu'il était le 16 oct. avant allègement | Plans de la phase V0.x, suspendus | La démarche (mesurer, bot fort, diagnostic, cycles) si la porte de conception est passée ; la décision 10 (calcul sur GitHub Actions) |
| `conception-v0x/maquettes/` | Livret de la maquette v1 (HTML), index des maquettes v1 et v2, proposition du rêve disputé | Versions du jeu complet, remplacées par la ligne active | Le livret v1 comme vue d'ensemble du jeu visé |
| `conception-v0x/bilans/` | Bilans des phases 1 à 3, du cycle 1, de la ligne de base, du protocole P3, des essais du rêve (disputé, somnambule), du garde-fou, du choix stratégique, des moteurs v0 et v1, historique des campagnes et des passages | Résultats sur des versions qui ne sont plus travaillées | Le diagnostic de la phase 3 (base des décisions D1 à D9) ; les leçons sur le rêve, déjà résumées dans `projet/3-pilotage/choix-strategique.md` |
| `noyau-n1/` | Règles du noyau N1 et sa maquette jouable (`maquette/`, https://claude.ai/artifact/495jtCyeRbmDCiWP54SpnV) | Proposition non adoptée du 15 oct., remplacée par le modèle « placement » | Le rêve qui détourne (D1), quand le rêve reviendra comme module |

Les liens internes des documents archivés citent souvent leurs anciens chemins (`projet/4-bilans/…`, `docs/…`, `foret/…`) : les fichiers correspondants sont dans les dossiers ci-dessus.

## Relancer le moteur archivé

Tout se lance depuis `archive/moteur-foret/` (le moteur cherche ses maquettes, campagnes et résultats à côté de son paquet) :

```bash
cd archive/moteur-foret
python -m pip install pytest
python -m foret.conformite && python -m foret.conformite --v2 && python -m foret.conformite --mesures
python -m pytest -q tests          # environ 3 minutes
python -m foret.partie --maquette v0.4 --peuples reptiles entites --bot glouton
```

Ses workflows GitHub (`batterie`, `campagne`, `cycle`, `surveillance`) sont rangés dans `moteur-foret/workflows/` et ne tournent plus. Pour les réactiver, il faut les remettre dans `.github/workflows/` et y préfixer les chemins par `archive/moteur-foret/` (ou y ajouter `working-directory`). Les résultats publiés des anciennes campagnes restent sur la branche `resultats` du dépôt.
