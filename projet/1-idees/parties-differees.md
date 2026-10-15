# Parties du jeu différées

*Créé le 15 oct. 2026, 17 h, à la demande de l'auteur. Ce registre dit ce qui est **mis de côté volontairement** pendant que la conception se concentre sur la mécanique de base. Rien n'y est abandonné : chaque ligne garde son document, et sa condition de reprise.*

## L'orientation du 15 oct. 2026

L'auteur recentre la conception sur **une seule mécanique de base** : un jeu de déplacement et de placement entre un Méchant qui programme n actions par un hasard contrôlé et un « Gentil » qui en programme k (tous les peuples réunis en une seule entité). La résolution est automatique, la partie dure t tours, on compte les arbres restants r, avec r > 0 garanti. La question posée est double : ce noyau est-il **viable**, et est-il **stratégiquement intéressant** ? Elle se traite par simulation (campagnes d'exploration, évaluation, élection, optimisation des actions, de la taille et de la disposition du plateau, de n et de k), avec un Méchant-bot de force réglable.

- Règles et code du modèle : `docs/regles_placement.md`, `placement/`, `tests/test_placement.py`, campagnes `campagnes/placement_*.json`.
- **Mis de côté pour l'instant** : les pistes (pensées, Machines), l'apprentissage du Méchant, le rêve et le long sommeil, les peuples et leurs règles brisées, **la communication au conseil**.

## Ce qui est différé, et ce qui permettra d'y revenir

| Partie du jeu | Où elle est consignée | Statut | Condition de reprise |
|---|---|---|---|
| **Le conseil de la calebasse** (communication limitée : visions privées, parole qui n'engage que soi, calebasse qui passe) | `projet/2-maquettes/proposition-conseil-calebasse.md` | **Idée retenue par l'auteur comme intéressante ; sa conception est différée à plus tard** (15 oct., 17 h). Rien n'est adopté, aucune règle ni maquette ne la contient. | La mécanique de base est jugée viable et intéressante ; un conseil a alors quelque chose à coordonner. Le texte reste à reprendre tel quel, avec ses risques (section 6) et ses quatre validations en attente. |
| Le rêve qui détourne (D1) et le noyau N1 | `docs/regles_noyau.md`, `projet/3-pilotage/prendre-du-recul.md`, maquette `maquettes-numeriques/noyau/` | Proposition non adoptée ; la maquette reste jouable comme référence, mais n'est plus la ligne de travail active. | Après la mécanique de base : réintroduire le rêve comme module, un à la fois, avec la porte de conception (T1, T3, restreint, papier). |
| Pistes (pensées, Machines), apprentissage du Méchant | `projet/1-idees/mecanique-du-mechant.md`, `docs/noeuds_v2.md` | Remplacés dans le modèle de base par un hasard contrôlé réglable. | Quand le noyau de placement tient : le Méchant du jeu sera « pistes + dés + apprentissage ». |
| Peuples et règles brisées | `projet/1-idees/synthese-des-idees.md` | Réduits à un Gentil unique. | Après la mécanique de base. |
| Cercle, lunes, traces, escalade | `projet/4-bilans/cycle-1-bilan.md`, `docs/noeuds_v2.md` | Déjà retirés du noyau N1. | Seulement si un défaut précis du noyau le demande. |
| Cycle 2 de la V0.4 et campagnes P1 | `ETAT.md`, sections 4 et 5 | Suspendu (décision du 15 oct., 9 h 50). | Porte de conception passée. |

## Règle de lecture pour toutes les discussions du projet

1. **Avant de proposer une règle ou un module d'une partie différée, le dire** : l'auteur a choisi de ne pas en traiter la conception maintenant.
2. **Ne pas supprimer ces idées** : une idée différée est consignée, datée, et rendue retrouvable ici.
3. **Une nouvelle idée sur une partie différée** s'ajoute à son document et à ce registre, sans ouvrir de chantier.
