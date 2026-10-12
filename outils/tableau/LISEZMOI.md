# Tableau de bord de la batterie

    python outils/tableau/construire.py resultats/batterie/rapport.json /tmp/donnees.json
    python -c "import sys;g=open('outils/tableau/gabarit.html',encoding='utf-8').read();d=open('/tmp/donnees.json',encoding='utf-8').read();open('resultats/tableau_batterie_phase1.html','w',encoding='utf-8').write(g.replace('__DONNEES__',d))"

`construire.py` lit le rapport de `python -m foret.batterie rapport` et en tire les cellules, les témoins et les séries des graphiques ; `gabarit.html` est la page (publiée comme artefact « Batterie de la Forêt qui rêve »). Les explications des témoins ratés sont écrites à la main dans `construire.py` (dictionnaire `EXPL`).
