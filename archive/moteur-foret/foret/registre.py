"""Registres : critères, ordres de chantier, pouvoirs, bots.

Ajouter une mécanique = écrire une fonction ou une classe et la déclarer avec
le décorateur du registre ; la maquette (JSON) y fait ensuite référence par son
nom. Le moteur refuse une maquette qui cite un nom inconnu.
"""


class Registre(dict):
    def __init__(self, quoi):
        super().__init__()
        self.quoi = quoi

    def __call__(self, nom):
        def deco(obj):
            if nom in self:
                raise ValueError(f"{self.quoi} déjà déclaré : {nom}")
            self[nom] = obj
            return obj
        return deco
