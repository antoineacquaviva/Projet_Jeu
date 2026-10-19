import React from 'react';
import { ParametresCalcules, Plateau, Carte, SiegeType } from '../types';
import * as B from '../game/bots';
import { SIEGES_LABELS } from './ActionPanel';

interface PlayersTableProps {
  p: ParametresCalcules;
  pl: Plateau;
  sieges: SiegeType[];
  phase: string;
  courant: number | null;
  cartes: (Carte | null)[][];
  fait: number[];
  v: number;
  parJoueur: number[];
}

export const PlayersTable: React.FC<PlayersTableProps> = ({
  p,
  pl,
  sieges,
  phase,
  courant,
  cartes,
  fait,
  v,
  parJoueur,
}) => {
  const revele = (stepIdx: number) => phase !== 'cartes' && stepIdx <= v;

  return (
    <div className="box" id="plBox">
      <div className="eyebrow">À la table</div>
      <div className="players">
        {sieges.map((s, j) => {
          let cartesTxt: React.ReactNode;
          if (phase === 'cartes' && !fait.includes(j)) {
            cartesTxt = courant === j ? 'pose ses cartes…' : 'attend';
          } else {
            cartesTxt = cartes[j]?.map((c, stepIdx) => (
              <span
                key={stepIdx}
                className={phase !== 'cartes' && !revele(stepIdx) ? 'cache' : ''}
                style={{ marginRight: 6 }}
              >
                {p.E > 1 ? `${stepIdx + 1}. ` : ''}
                {c ? `${B.nomInd(p, c.i)} ${B.ordreTexte(p, pl, c.o)}` : 'rien'}
              </span>
            ));
          }

          return (
            <div key={j} className={`pl ${courant === j ? 'actif' : ''}`}>
              <span className="dot" style={{ background: `var(--j${j + 1})` }} />
              <span>
                Joueur {j + 1} <span className="who">{SIEGES_LABELS[s]}</span>
                <br />
                <span className="ord">{cartesTxt}</span>
              </span>
              <span className="num small">
                {parJoueur[j] || 0} parade{(parJoueur[j] || 0) > 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
