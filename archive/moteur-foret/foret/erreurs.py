class ErreurMoteur(Exception):
    """Choix illégal, état incohérent : c'est un bug (du moteur ou d'un bot)."""


class ErreurMaquette(ErreurMoteur):
    """Maquette ou variante invalide (clé inconnue, référence manquante…)."""


class FinDePartie(Exception):
    """Interrompt la résolution dès qu'une fin de partie est atteinte."""
