"""Assemble la page jouable du noyau N1 en un seul fichier HTML.

    python3 maquettes-numeriques/noyau/construire.py

Entrées : page.html (gabarit), moteur.js, bots.js, ui.js, docs/regles_noyau.md.
Sortie : maquettes-numeriques/noyau/noyau.html (publiée comme artefact « Noyau de la Forêt qui rêve »).
"""
import json
import pathlib

ICI = pathlib.Path(__file__).resolve().parent
RACINE = ICI.parent.parent


def script(texte):
    return texte.replace("</script", "<\\/script")


def main():
    page = (ICI / "page.html").read_text(encoding="utf-8")
    regles = (RACINE / "docs" / "regles_noyau.md").read_text(encoding="utf-8")
    morceaux = {
        "/*MOTEUR*/": script((ICI / "moteur.js").read_text(encoding="utf-8")),
        "/*BOTS*/": script((ICI / "bots.js").read_text(encoding="utf-8")),
        "/*REGLES*/": "window.REGLES_NOYAU = " + json.dumps(regles, ensure_ascii=False).replace("</", "<\\/") + ";",
        "/*UI*/": script((ICI / "ui.js").read_text(encoding="utf-8")),
    }
    for cle, val in morceaux.items():
        assert page.count(cle) == 1, cle
        page = page.replace(cle, val)
    (ICI / "noyau.html").write_text(page, encoding="utf-8")
    print(f"noyau.html : {len(page) // 1024} Ko")


if __name__ == "__main__":
    main()
