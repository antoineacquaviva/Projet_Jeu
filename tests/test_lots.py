"""Calcul par lots : découper une campagne puis fusionner donne la même synthèse."""
import pytest

from foret.sim import lire_campagne, lancer, lancer_lot, fusionner_lots

ECHELLE = 0.01


def _sans_date(syn):
    meta = {k: v for k, v in syn["meta"].items()
            if k not in ("date", "duree_s", "lots", "duree_cumulee_coeurs_s", "parties_par_s_par_coeur")}
    return {**syn, "meta": meta}


def test_lots_identiques_a_une_execution_unique(tmp_path):
    c = lire_campagne("reference")
    unique, _ = lancer(c, echelle=ECHELLE, sortie=str(tmp_path / "unique"), processus=1, bavard=False)
    for i in range(3):
        lancer_lot(c, i, 3, echelle=ECHELLE, sortie=str(tmp_path / "lots"), processus=1, bavard=False)
    fusion = fusionner_lots(c, str(tmp_path / "lots"), echelle=ECHELLE, sortie=str(tmp_path / "fusion"), bavard=False)
    assert _sans_date(fusion) == _sans_date(unique)
    assert fusion["meta"]["lots"] == 3 and fusion["meta"]["erreurs"] == 0


def test_fusion_refuse_des_lots_incomplets(tmp_path):
    c = lire_campagne("reference")
    for i in (0, 2):                                   # il manque le lot 1
        lancer_lot(c, i, 3, echelle=ECHELLE, sortie=str(tmp_path), processus=1, bavard=False)
    with pytest.raises(SystemExit, match="manquante"):
        fusionner_lots(c, str(tmp_path), echelle=ECHELLE, sortie=str(tmp_path / "x"), bavard=False)


def test_fusion_refuse_un_lot_en_double(tmp_path):
    c = lire_campagne("reference")
    lancer_lot(c, 0, 2, echelle=ECHELLE, sortie=str(tmp_path / "a"), processus=1, bavard=False)
    lancer_lot(c, 0, 2, echelle=ECHELLE, sortie=str(tmp_path / "b"), processus=1, bavard=False)
    with pytest.raises(SystemExit, match="deux fois"):
        fusionner_lots(c, str(tmp_path), echelle=ECHELLE, sortie=str(tmp_path / "x"), bavard=False)


def test_lot_invalide(tmp_path):
    c = lire_campagne("reference")
    with pytest.raises(SystemExit):
        lancer_lot(c, 3, 3, sortie=str(tmp_path), bavard=False)
