"""Assemble la page jouable du kit avec les pistes du Méchant (« Couronne aux deux pistes ») en un seul fichier HTML.

    python3 maquettes-numeriques/pistes/construire.py

Entrées : page.html (gabarit et règles), moteur.js, bots.js, ui.js. Sortie : maquettes-numeriques/pistes/pistes.html.
"""
import pathlib

ICI = pathlib.Path(__file__).resolve().parent


def script(texte):
    return texte.replace("</script", "<\\/script")


def main():
    page = (ICI / "page.html").read_text(encoding="utf-8")
    for cle, nom in (("/*MOTEUR*/", "moteur.js"), ("/*BOTS*/", "bots.js"), ("/*UI*/", "ui.js")):
        assert page.count(cle) == 1, cle
        page = page.replace(cle, script((ICI / nom).read_text(encoding="utf-8")))
    (ICI / "pistes.html").write_text(page, encoding="utf-8")
    print(f"pistes.html : {len(page) // 1024} Ko")


if __name__ == "__main__":
    main()
