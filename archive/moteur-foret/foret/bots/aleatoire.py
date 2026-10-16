"""Bot aléatoire : choix au hasard parmi les options légales, avec quelques
probabilités réglables pour ne pas passer son temps à laisser des étapes vides
ou à tout envoyer en rêve. Sert à faire passer le moteur par le plus de
situations possibles."""
from .base import Bot, BOTS


@BOTS("aleatoire")
class Aleatoire(Bot):
    nom = "aleatoire"
    PARAMS = {
        "p_vide": 0.15,      # laisser une étape vide
        "p_reve": 0.15,      # envoyer la carte en rêve (si permis)
        "p_hote": 0.3,       # insectes : se glisser sous une autre carte
        "p_voir": 0.2,       # oiseaux : engager une carte en Voir, par étape
        "p_aller": 0.35,     # se déplacer plutôt qu'agir sur place
        "p_tromper": 0.5,    # humains : inverser l'apprentissage
        "p_pouvoir": 0.5,    # utiliser un pouvoir limité (Hanter)
    }

    def _parmi(self, options):
        reels = [o for o in options if o is not None]
        return self.rng.choice(reels) if reels else None

    def d_voir(self, partie, siege, options, etape):
        return self._parmi(options) if self.rng.random() < self.p["p_voir"] else None

    def d_programmer_carte(self, partie, siege, options, etape):
        return None if self.rng.random() < self.p["p_vide"] else self._parmi(options)

    def d_programmer_mode(self, partie, siege, options, etape, carte):
        if "reve" in options and self.rng.random() < self.p["p_reve"]:
            return "reve"
        moities = [o for o in options if o != "reve"]
        return self.rng.choice(moities) if moities else options[0]

    def d_hote(self, partie, siege, options, etape):
        return self._parmi(options) if self.rng.random() < self.p["p_hote"] else None

    def d_aller(self, partie, siege, options, jeu):
        return self._parmi(options) if self.rng.random() < self.p["p_aller"] else None

    def d_tromper(self, partie, siege, options, reussite):
        return self.rng.random() < self.p["p_tromper"]

    def d_pouvoir(self, partie, siege, options, **ctx):
        return self.rng.random() < self.p["p_pouvoir"]
