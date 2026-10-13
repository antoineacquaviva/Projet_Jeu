"""Analyse de la ligne de base P2 (plan vers la V1, étape 0.11).

    python scripts/analyse_ligne_base.py <synthese ligne_base_p2> <synthese ligne_base_p2_v02>

Écrit en Markdown, sur la sortie standard : la V0.3 par taille de table (bot fort), la validation du bot à
portefeuille, le gain d'apprentissage et son témoin, la coordination et le chef unique au bot fort, les
choix morts et leur témoin sur la V0.2.
"""
import gzip
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from foret.cycle import metriques_variantes, TAILLES  # noqa: E402
from foret.mesures import choix_morts, coordination_depuis_synthese, chef_depuis_synthese, verdict  # noqa: E402
from foret.stats import ecart_apparie  # noqa: E402


def lire(p):
    op = gzip.open if p.endswith(".gz") else open
    with op(p, "rt", encoding="utf-8") as f:
        return json.load(f)


def fr(x, f=".1f"):
    return "–" if x is None else format(x, f).replace(".", ",")


def lignes(syn, bloc=None, variante=None, bot_params=None):
    pc = syn["parties_compactes"]
    col = {c: i for i, c in enumerate(pc["colonnes"])}
    out = [l for l in pc["lignes"] if (bloc is None or l[col["campagne"]] == bloc)
           and (variante is None or l[col["variante"]] == variante)
           and (bot_params is None or l[col["bot_params"]] == bot_params)]
    return {"colonnes": pc["colonnes"], "lignes": out}, col


def par_table(pc, col):
    return {f"{l[col['peuples']]}#{l[col['graine']]}": l[col["foret_pct"]] for l in pc["lignes"]}


def tableau_tailles(titre, mets):
    L = [f"**{titre}**", "", "| Variante | " + " | ".join(f"{n} j." for n in TAILLES) + " | Fins avant mi-partie (max) | Tour moyen |",
         "|---|" + "---|" * len(TAILLES) + "---|---|"]
    for v, m in mets.items():
        cells = []
        for n in TAILLES:
            t = m["tailles"].get(str(n))
            cells.append(f"{fr(t['foret'], '.0f')} % (tour {fr(t['tour'])}, {fr(t['precoces'], '.0f')} % tôt)" if t else "–")
        L.append(f"| {v[:50]} | " + " | ".join(cells) + f" | {fr(m['precoces_max'], '.0f')} % | {fr(m['tour_moyen'])} |")
    return L + [""]


def main(p2, v02):
    S, V = lire(p2), lire(v02)
    out = ["# Ligne de base P2 : résultats bruts (étape 0.11)", ""]
    # 1. bots
    bp = sorted({l[-1] for l in S["parties_compactes"]["lignes"] if l[0] == "bots"})
    noms = {b: ("MCP64 (portefeuille)" if "portefeuille" in b else "MC64R (rêve 1)") for b in bp}
    pcs = {b: lignes(S, "bots", "defaut", b) for b in bp}
    out += tableau_tailles("V0.3, forêt gardée par taille de table (bot fort)",
                           {noms[b]: metriques_variantes(pc, meilleur_bot=False)["defaut"] for b, (pc, col) in pcs.items()})
    if len(bp) == 2:
        b = next((x for x in bp if "portefeuille" in x), bp[1])
        a = next(x for x in bp if x != b)
        e = ecart_apparie(par_table(*pcs[a]), par_table(*pcs[b]))
        out += [f"- **Portefeuille − MC64R (apparié)** : {fr(e['ecart'], '+.1f')} points, intervalle {e['ic95']}, {e['verdict']} ({e['paires']} paires)."]
    for k, d in S["detail"].items():
        if k.startswith("bots") and "portefeuille" in k:
            pol = {x[len('portefeuille_'):]: v for x, v in d.get("stats_par_partie", {}).items() if x.startswith("portefeuille_")}
            out += [f"- Politiques choisies par MCP64 en V0.3 (par partie) : {pol}"]
    for k, d in V["detail"].items():
        if k.startswith("portefeuille") and "portefeuille" in k.split(" | ", 1)[1]:
            pol = {x[len('portefeuille_'):]: v for x, v in d.get("stats_par_partie", {}).items() if x.startswith("portefeuille_")}
            out += [f"- Politiques choisies par MCP64 en V0.2 (par partie) : {pol} (témoin : surtout « reve0 »)"]
    vb = sorted({l[-1] for l in V["parties_compactes"]["lignes"] if l[0] == "portefeuille"})
    if len(vb) == 2:
        pa = [lignes(V, "portefeuille", "defaut", b) for b in vb]
        ia = 0 if "portefeuille" not in vb[0] else 1
        e = ecart_apparie(par_table(*pa[ia]), par_table(*pa[1 - ia]))
        out += [f"- V0.2, portefeuille − MC64 (apparié) : {fr(e['ecart'], '+.1f')} points, {e['ic95']}, {e['verdict']}."]
    out.append("")
    # 2. témoins
    ap = next((v for k, v in S["apparie"].items() if k.startswith("temoins")), None)
    if ap:
        E = ap["ecarts"]
        g = E.get("temoin_sans_apprentissage")
        out += ["**Gain d'apprentissage du Méchant (témoin sans apprentissage − V0.3, apparié)**", ""]
        out += [f"- V0.3 : {fr(g['ecart'], '+.1f')} points {g['ic95']} ({g['verdict']}) → verdict {verdict('apprentissage_mechant', g['ecart'])}"]
        pcs_t = {v: lignes(S, "temoins", v) for v in ("temoin_une_tactique",)}
        une = pcs_t["temoin_une_tactique"]
        patch = [v for v in E if v.startswith("patch:")]
        if patch:
            pt = lignes(S, "temoins", patch[0])
            e2 = ecart_apparie(par_table(*une), par_table(*pt))
            out += [f"- Témoin (une seule tactique) : {fr(e2['ecart'], '+.1f')} points {e2['ic95']} ({e2['verdict']}) ; attendu : plus petit que la V0.3."]
        s = E.get("sans_lunes")
        if s:
            out += [f"- Sans lunes − V0.3 : {fr(s['ecart'], '+.1f')} points {s['ic95']} ({s['verdict']})."]
        out += [""]
        mets_t = metriques_variantes(lignes(S, "temoins")[0], meilleur_bot=False)
        out += tableau_tailles("Témoins par taille de table (MC64R)", mets_t)
    # 3. coordination et chef unique
    co = coordination_depuis_synthese(S, "soi")
    ch = chef_depuis_synthese(S, "defaut")
    out += ["**Coordination et chef unique (V0.3, duos, MC64R avec annonces)**", ""]
    if co:
        out += [f"- Part de l'écart récupérée par les traces : {fr(co['part'])} % (aucun signe {fr(co['aucun_signe'])}, traces {fr(co['forme'])}, "
                f"tout dire {fr(co['tout_dire'])}) : {co['verdict']}"]
    if ch:
        out += [f"- Chef unique : {fr(ch['gain'])} % ± {fr(ch['marge'])} : {ch['verdict']}"]
    out.append("")
    # 4. choix morts
    out += ["**Choix morts**", ""]
    for k, d in S["detail"].items():
        if k.startswith("temoins | defaut"):
            r = choix_morts(d.get("usage"))
            out += [f"- V0.3 (MC64R, usage seul) : {r['n']} morts : {r['detail']}"]
            us = d.get("usage", {})
            out += ["- Usage V0.3 (taux pris quand offert) : " + ", ".join(f"{x} {fr(u['taux'], '.0f')} %" for x, u in sorted(us.items()))]
    apv = next((v for k, v in V["apparie"].items() if k.startswith("choix_morts")), None)
    if apv:
        pertes = {}
        for v, e in apv["ecarts"].items():
            nom = json.loads(v[len("patch:"):])["regles"]["interdits"][0]
            pertes[nom] = e["verdict"]
            out += [f"- Témoin V0.2 : interdire {nom} (mammifères sans pouvoir) : {fr(e['ecart'], '+.1f')} points {e['ic95']} ({e['verdict']})"]
        usage_t = next((d.get("usage") for k, d in V["detail"].items() if k.startswith("choix_morts | temoin_mammiferes")), None)
        r = choix_morts(usage_t, {k: ("négligeable" if v == "négligeable" else v) for k, v in pertes.items()})
        out += [f"- Verdict du témoin : morts = {r['morts']} (attendu : moitie:tenir et moitie:renverser)"]
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
