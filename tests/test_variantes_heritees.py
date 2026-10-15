"""Variantes héritées : une variante de mesure ne change que ce qu'elle mesure (15 oct. 2026).

Défaut trouvé le 15 oct. (projet/3-pilotage/prendre-du-recul.md, section 1.3) : dans maquettes/v2.json, les
témoins de communication « comm_aucun_signe » et « comm_tout_dire » étaient écrits comme des codes d'atelier
complets (« V2 proposée » + C2d ou C2e). Hérités par la V0.3, la V0.4 et la V0.4rd (« variantes_heritees »),
ils remplaçaient toute la version : sans lunes, sans escalade, Cercle à 3 cases par joueur. La mesure de
coordination (objectif 3) comparait donc deux jeux différents. Correction (choix technique de Claude) : les deux
variantes ne touchent plus que regles.communication [R2.5].
"""
import json

import pytest

from foret import charger

VERSIONS = ["v2", "v0.3", "v0.4", "v0.4rd"]
# ce qu'une variante de mesure a le droit de changer, chemin par chemin
PERMIS = {
    "comm_aucun_signe": {("regles", "communication")},
    "comm_tout_dire": {("regles", "communication")},
    "temoin_sans_apprentissage": {("regles", "apprentissage")},
    "temoin_des_fixes": {("regles", "des_fixes")},
    "temoin_une_tactique": {("piste", "disposition")},
}
IGNORES = {"variante", "variantes", "atelier", "description", "nom"}


def _plat(d, p=()):
    if isinstance(d, dict) and d:
        out = {}
        for k, v in d.items():
            out.update(_plat(v, p + (k,)))
        return out
    return {p: json.dumps(d, sort_keys=True)}


def _ecarts(base, variante):
    a, b = _plat(charger(base)), _plat(charger(base, variante))
    return {k for k in set(a) | set(b) if a.get(k) != b.get(k) and k[0] not in IGNORES}


@pytest.mark.parametrize("version", VERSIONS)
@pytest.mark.parametrize("variante", sorted(PERMIS))
def test_une_variante_de_mesure_ne_change_que_sa_cible(version, variante):
    ecarts = _ecarts(version, variante)
    hors = {k for k in ecarts if not any(k[:len(c)] == c for c in PERMIS[variante])}
    assert not hors, f"{version} / {variante} change aussi : {sorted(hors)}"


@pytest.mark.parametrize("version", ["v0.4", "v0.4rd"])
def test_les_temoins_de_communication_gardent_la_version(version):
    """[R2.5] les témoins « aucun signe » et « tout dire » jouent la même version que la référence."""
    r = charger(version)["regles"]
    for v, comm in (("comm_aucun_signe", "aucun_signe"), ("comm_tout_dire", "tout_dire")):
        rv = charger(version, v)["regles"]
        assert rv["communication"] == comm
        for cle in ("lunes", "escalade", "cercle_par_joueur", "reves_par_pas", "ordres_par_etape",
                    "machines_en_jeu"):
            assert rv.get(cle) == r.get(cle), (version, v, cle)
