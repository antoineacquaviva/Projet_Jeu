import React, { useState } from 'react';
import { Reglages, SerieLigne } from '../types';
import * as B from '../game/bots';

interface BotSeriesProps {
  reglages: Reglages;
  onSaveSerie: (lignes: SerieLigne[], parties: number) => void;
}

export const BotSeries: React.FC<BotSeriesProps> = ({ reglages, onSaveSerie }) => {
  const [partiesCount, setPartiesCount] = useState<number>(6);
  const [tailleMode, setTailleMode] = useState<'all' | 'cur'>('all');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressTxt, setProgressTxt] = useState<string>('');
  const [results, setResults] = useState<{
    lignes: SerieLigne[];
    Js: number[];
  } | null>(null);

  const lancerSerie = () => {
    if (isRunning) return;
    const N = partiesCount;
    const Js = tailleMode === 'all' ? [2, 3, 4, 5, 6] : [reglages.joueurs];
    const bots: (keyof typeof B.BOTS)[] = ['hasard', 'reflexe', 'stratege', 'prevoyant'];
    const taches: [number, number, keyof typeof B.BOTS][] = [];
    for (const J of Js) {
      for (let g = 1; g <= N; g++) {
        for (const b of bots) {
          taches.push([J, g, b]);
        }
      }
    }

    const acc: Record<
      string,
      {
        J: number;
        b: string;
        n: number;
        taux: number;
        foret: number;
        agence: number;
        couplage: number;
        perdus: number;
      }
    > = {};

    let k = 0;
    setIsRunning(true);

    const pas = () => {
      const t0 = performance.now();
      while (k < taches.length && performance.now() - t0 < 35) {
        const [J, g, b] = taches[k++];
        const reg = Object.assign({}, reglages, { joueurs: J, graine: 1000 + g });
        const r = B.partieAuto(reg, b);
        const key = `${J}|${b}`;
        const a = (acc[key] = acc[key] || {
          J,
          b,
          n: 0,
          taux: 0,
          foret: 0,
          agence: 0,
          couplage: 0,
          perdus: 0,
        });
        a.n++;
        a.taux += r.taux;
        a.foret += r.foret;
        a.agence += r.agence;
        a.couplage += r.couplage;
        a.perdus += r.perdus;
      }

      setProgressTxt(
        `${Math.floor(k / bots.length)} / ${taches.length / bots.length} tables`
      );

      if (k < taches.length) {
        setTimeout(pas, 0);
      } else {
        setIsRunning(false);
        const lignes: SerieLigne[] = Object.values(acc).map((a) => ({
          joueurs: a.J,
          bot: a.b,
          parties: a.n,
          taux: a.taux / a.n,
          foret: a.foret / a.n,
          agence: a.agence / a.n,
          couplage: a.couplage / a.n,
          perdus: a.perdus / a.n,
        }));
        setResults({ lignes, Js });
        onSaveSerie(lignes, N);
      }
    };

    pas();
  };

  const NB: Record<string, string> = {
    hasard: 'Hasard',
    reflexe: 'Réflexe',
    stratege: 'Glouton',
    prevoyant: 'Prévoyant',
  };

  return (
    <div className="table">
      <div className="box setup">
        <h2>Comparer les bots</h2>
        <p className="ctx">
          Les bots jouent beaucoup de parties sans animation, sur les mêmes dés pour
          chaque bot (comparaisons appariées). Les réglages sont ceux de la préparation
          de partie. Les bots qui prévoient prennent quelques secondes par table à 5 et 6
          joueurs.
        </p>
        <div className="params">
          <label htmlFor="serN">
            Parties par bot et par taille
            <select
              id="serN"
              value={partiesCount}
              onChange={(ev) => setPartiesCount(+ev.target.value)}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </label>
          <label htmlFor="serJ">
            Tailles de table
            <select
              id="serJ"
              value={tailleMode}
              onChange={(ev) => setTailleMode(ev.target.value as 'all' | 'cur')}
            >
              <option value="cur">celle de la préparation</option>
              <option value="all">de 2 à 6 joueurs</option>
            </select>
          </label>
        </div>
        <div className="btn-row">
          <button className="btn" disabled={isRunning} onClick={lancerSerie}>
            {isRunning ? 'Simulation en cours…' : 'Lancer la série'}
          </button>
          <span className="small num" id="serieProg">
            {progressTxt}
          </span>
        </div>
      </div>

      <div className="side">
        <div className="box" id="serieRes">
          {results ? (
            <>
              <div className="eyebrow">Résultats</div>
              <h2>Ordres qui ont paré une menace</h2>
              <div className="tw">
                <table className="res num">
                  <thead>
                    <tr>
                      <th>Joueurs</th>
                      {Object.values(NB).map((n) => (
                        <th key={n}>{n}</th>
                      ))}
                      <th>Forêt*</th>
                      <th>Perdus*</th>
                      <th>Agence*</th>
                      <th>Couplage*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.Js.map((J) => {
                      const L = (b: string) =>
                        results.lignes.find((x) => x.joueurs === J && x.bot === b);
                      const pv = L('prevoyant');
                      return (
                        <tr key={J}>
                          <td>{J}</td>
                          {Object.keys(NB).map((b) => (
                            <td key={b}>{B.pc(L(b)?.taux || 0)}</td>
                          ))}
                          <td>{B.pc(pv?.foret || 0)}</td>
                          <td>{B.f1(pv?.perdus || 0)}</td>
                          <td>{B.pc(pv?.agence || 0)}</td>
                          <td>{B.pc(pv?.couplage || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="small">
                * pour le bot prévoyant. Forêt : arbres restants en fin de partie.
                Perdus : ordres perdus par partie (un sabotage dont la Machine est
                partie). Agence : part des joueurs qui ont paré au moins une menace.
                Couplage : part des parades faites hors de sa tuile.
              </p>
              <div className="verdict">
                Prévoyant moins Réflexe :{' '}
                {results.Js.map((J) => {
                  const a = results.lignes.find(
                    (x) => x.joueurs === J && x.bot === 'prevoyant'
                  );
                  const b = results.lignes.find(
                    (x) => x.joueurs === J && x.bot === 'reflexe'
                  );
                  const diff = 100 * ((a?.taux || 0) - (b?.taux || 0));
                  return `${J} joueurs ${diff >= 0 ? '+' : ''}${B.f1(diff)} pt`;
                }).join(' · ')}
                . C'est ce que rapporte de prévoir la vague suivante et le tour suivant.
              </div>
            </>
          ) : (
            <div className="empty">
              Les résultats s'afficheront ici : pour chaque bot et chaque taille de
              table, la part des ordres qui ont paré une menace, la forêt restante, les
              ordres perdus, l'agence (part des joueurs qui ont sauvé au moins un arbre) et
              le couplage (part des parades faites hors de sa tuile).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
