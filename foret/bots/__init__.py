"""Bots : un registre (BOTS) et une fabrique (fabriquer).

Pour ajouter un bot : créer un module dans ce dossier, y déclarer une classe
avec @BOTS("nom"), et l'importer ci-dessous. Les campagnes le désignent par son
nom : {"type": "nom", "params": {...}}.
"""
from .base import Bot, BOTS, fabriquer
from . import aleatoire, glouton, inerte  # noqa: F401  (déclaration dans le registre)
from .aleatoire import Aleatoire
from .glouton import Glouton
from .inerte import Inerte

__all__ = ["Bot", "BOTS", "fabriquer", "Aleatoire", "Glouton", "Inerte"]
