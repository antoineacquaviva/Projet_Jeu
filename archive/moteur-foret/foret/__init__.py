"""Moteur de règles du jeu coopératif « Le Méchant qui rêve »."""
from .erreurs import ErreurMoteur, ErreurMaquette, FinDePartie
from .maquette import charger, lire, fusionner
from .moteur import Partie, VERSION
from .bots import Bot, BOTS, fabriquer, Aleatoire, Glouton
from .observateurs import Observateur, JournalDecisions

__all__ = ["ErreurMoteur", "ErreurMaquette", "FinDePartie", "charger", "lire", "fusionner",
           "Partie", "VERSION", "Bot", "BOTS", "fabriquer", "Aleatoire", "Glouton", "Observateur",
           "JournalDecisions"]
