45 règles dans docs/regles_v1.md

| Règle | Code | Tests |
|---|---|---|
| R1.1 Plateau | lacunes | 1 test(s) |
| R1.2 Machines | moteur._init_machines | 1 test(s) |
| R1.3 Piste des pensées | lacunes, moteur._init_piste | 1 test(s) |
| R1.4 Cartes | moteur._init_sieges | 1 test(s) |
| R1.5 Présence | decisions, moteur._init_presence | 1 test(s) |
| R2.1 Conseil | decisions, moteur.conseil, moteur.poser | 5 test(s) |
| R2.2 Un rêve par tour | decisions, moteur.modes_autorises | 2 test(s) |
| R2.3 Résolution | moteur.resoudre_etape | 1 test(s) |
| R2.4 Fin du tour | moteur.fin_de_tour | 1 test(s) |
| R2.5 Communication | base.decider, decisions, glouton, glouton.Glouton, lacunes, maquette, moteur.__init__, moteur._engagement, moteur._partager, moteur._poser_traces, moteur._programmer, moteur.communiquer, moteur.conseil, moteur.controler, moteur.declarer, moteur.embuscade, moteur.programmes_visibles, moteur.resoudre_etape, moteur.signes, moteur.trace_engageante | 10 test(s) |
| R2.6 Le présage | glouton, glouton.Glouton, maquette, moteur.__init__, moteur.conseil, moteur.presager, moteur.programmes_visibles, moteur.tirer_ordre | 5 test(s) |
| R3.1 Agir | decisions, moteur.actions_permises, moteur.options_agir | 1 test(s) |
| R3.2 Aller | decisions, moteur.options_aller | 1 test(s) |
| R3.3 Barrer | moteur.options_agir | 1 test(s) |
| R3.4 Saboter | moteur.neutraliser, moteur.options_agir, moteur.resoudre_sabotage | 1 test(s) |
| R3.5 Alliance | moteur.allie | 1 test(s) |
| R3.6 Rêver | moteur.resoudre_etape | 1 test(s) |
| R3.7 Moitiés de carte | moteur._init_pouvoirs | 1 test(s) |
| R3.8 Machine HS | moteur.hs, moteur.neutraliser | 1 test(s) |
| R4.1 Tirage | moteur.tirer_ordre | 1 test(s) |
| R4.2 Tactiques | criteres, lacunes, moteur.cible, moteur.defense | 1 test(s) |
| R4.3 Exécution | lacunes, moteur._abattre, moteur.machine_pour, moteur.pas_suivant | 3 test(s) |
| R4.4 Ordre empêché | conformite, lacunes, moteur.executer, moteur.pas_suivant | 1 test(s) |
| R4.5 Ordres de chantier | chantier, lacunes | 1 test(s) |
| R4.6 Réussite | moteur.executer_et_apprendre | 1 test(s) |
| R5.1 Les côtés | moteur | 1 test(s) |
| R5.2 Apprendre | moteur.apprendre | 1 test(s) |
| R5.3 Faire rêver | decisions, moteur.options_reve, moteur.resoudre_etape | 1 test(s) |
| R5.4 Le long sommeil | moteur.verifier_sommeil | 1 test(s) |
| R6.1 Les spécialistes des Machines | pouvoirs.Specialiste | 1 test(s) |
| R6.2 Voir (oiseaux) | decisions, glouton.Glouton, lacunes, moteur.__init__, moteur._tirer_ordre_v2, moteur.poser_voir, moteur.tirer_ordre, pouvoirs.Voir | 2 test(s) |
| R6.3 Voler (oiseaux) | pouvoirs.Voler | 1 test(s) |
| R6.4 Tenir (mammifères) | pouvoirs.Tenir | 1 test(s) |
| R6.5 Égarer (entités) | moteur.neutraliser, pouvoirs.Egarer | 1 test(s) |
| R6.6 Attendre (reptiles) | decisions, lacunes, moteur.__init__, moteur.embuscade, moteur.executer, moteur.fin_de_tour, plans.zones_de_l_ordre, pouvoirs.Attendre | 1 test(s) |
| R6.7 Se fondre (reptiles) | pouvoirs.Invisible, pouvoirs.SeFondre | 1 test(s) |
| R6.8 S'unir (insectes) | decisions, lacunes, moteur.Jeu, moteur.conseil, pouvoirs.SUnir | 1 test(s) |
| R6.9 Tromper (humains) | decisions, moteur.executer_et_apprendre, plans.executer_et_apprendre_v2, pouvoirs.Tromper | 1 test(s) |
| R6.10 Parler (humains) | decisions, moteur.options_parler, pouvoirs.Parler | 1 test(s) |
| R6.11 Hanter (entités) | decisions, moteur.tirer_ordre, pouvoirs.Hanter | 1 test(s) |
| R6.12 Contrer sans détruire (reptiles) | moteur.actions_permises | 1 test(s) |
| R7.1 Zones | criteres, lacunes, moteur.cible, moteur.departager | 2 test(s) |
| R7.2 Machines | lacunes, moteur.departager_machines, moteur.machine_pour | 1 test(s) |
| R8.1 Trois fins | moteur.neutraliser, moteur.terminer, moteur.verifier_silence, moteur.verifier_sommeil | 1 test(s) |
| R8.2 Bilan | moteur.bilan | 1 test(s) |

Règles sans test : aucune
Règles sans renvoi dans le code : aucune
Renvois vers des règles absentes : aucun
