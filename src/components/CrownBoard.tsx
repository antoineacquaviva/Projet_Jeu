import React, { useMemo } from 'react';
import {
  ParametresCalcules,
  Plateau,
  EtatJeu,
  Carte,
  EvenementLancer,
} from '../types';
import * as K from '../game/engine';
import * as B from '../game/bots';

interface CrownBoardProps {
  p: ParametresCalcules;
  pl: Plateau;
  e: EtatJeu;
  phase: string;
  courant: number | null;
  slot: number;
  cartes: (Carte | null)[][];
  brouillon: (Carte | null)[] | null;
  selectedIndividu: number | null;
  dernier: EvenementLancer | null;
  aideActive: boolean;
  onSelectIndividu: (i: number) => void;
  onSelectCase: (c: number) => void;
}

export const CrownBoard: React.FC<CrownBoardProps> = ({
  p,
  pl,
  e,
  phase,
  courant,
  slot,
  cartes,
  brouillon,
  selectedIndividu,
  dernier,
  aideActive,
  onSelectIndividu,
  onSelectCase,
}) => {
  const geo = useMemo(() => K.geometrie(p, pl), [p, pl]);

  // Compute token positions
  const tokenPos = useMemo(() => K.positions(geo, e), [geo, e]);

  // Compute threat heatmap and arrows
  const { menace, cands, allers, actifMachine, cibleCase, pareCase, trajet } = useMemo(() => {
    let menaceArr: number[] | null = null;
    const candSet = new Set<number>();
    const allerList: [number, number, boolean][] = [];
    let actifM: number | null = null;
    let cibleC: number | null = null;
    let pareC: number | null = null;
    let traj: [number, number] | null = null;

    if (phase === 'cartes' && courant !== null) {
      const cs = cartes.map((x) => x.slice());
      if (brouillon) cs[courant] = brouillon.slice();
      const pos = K.positionsPrevues(p, e, cs, slot);

      if (aideActive) {
        const f = K.copie(e);
        f.individus = pos;
        if (!(slot === 0 && p.presage)) {
          const mpc = K.menaceParCase(p, pl, f);
          menaceArr = mpc.map((x) => 1 - Math.pow(1 - x, p.L));
        }
      }

      cs.forEach((playerCartes) => {
        playerCartes.forEach((c, v) => {
          if (c && c.o[0] === K.ALLER && typeof c.o[1] === 'number') {
            const fromPos = K.positionsPrevues(p, e, cs, v)[c.i];
            allerList.push([fromPos, c.o[1], v > 0]);
          }
        });
      });

      if (selectedIndividu !== null && pos[selectedIndividu] !== undefined) {
        const indPos = pos[selectedIndividu];
        candSet.add(indPos);
        pl.voisins[indPos]?.forEach((v) => candSet.add(v));
      }
    } else if (phase === 'vague' && dernier) {
      actifM = dernier.machine;
      if (dernier.issue === 'abattu') {
        cibleC = dernier.cible;
      } else {
        pareC = dernier.lieu !== undefined ? dernier.lieu : dernier.cible;
      }
      if (dernier.de >= 0 && dernier.de !== dernier.cible && dernier.issue !== 'gardee') {
        traj = [dernier.de, dernier.cible];
      }
    } else if (phase === 'inter') {
      if (aideActive) {
        const mpc = K.menaceParCase(p, pl, e);
        menaceArr = mpc.map((x) => 1 - Math.pow(1 - x, p.L));
      }
      cartes.forEach((cs) => {
        const c = cs[1];
        if (c && c.o[0] === K.ALLER && typeof c.o[1] === 'number') {
          allerList.push([e.individus[c.i], c.o[1], true]);
        }
      });
    }

    return {
      menace: menaceArr,
      cands: candSet,
      allers: allerList,
      actifMachine: actifM,
      cibleCase: cibleC,
      pareCase: pareC,
      trajet: traj,
    };
  }, [phase, courant, slot, cartes, brouillon, selectedIndividu, dernier, aideActive, p, pl, e]);

  const cliquableIndividus = useMemo(() => {
    if (phase !== 'cartes' || courant === null) return new Set<number>();
    return new Set(B.individusDe(p, courant));
  }, [phase, courant, p]);

  const renderFleche = (a: number, b: number, cls: string, key: string) => {
    const ga = geo.cells[a];
    const gb = geo.cells[b];
    if (!ga || !gb) return null;
    if (a === b) {
      return (
        <circle
          key={key}
          className={`fleche ${cls}`}
          cx={ga.cx}
          cy={ga.cy}
          r="14"
        />
      );
    }
    const mx = (ga.cx + gb.cx) / 2 + (K.CX - (ga.cx + gb.cx) / 2) * 0.12;
    const my = (ga.cy + gb.cy) / 2 + (K.CY - (ga.cy + gb.cy) / 2) * 0.12;
    return (
      <path
        key={key}
        className={`fleche ${cls}`}
        d={`M${ga.cx.toFixed(1)},${ga.cy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${gb.cx.toFixed(1)},${gb.cy.toFixed(1)}`}
        markerEnd={`url(#${cls.includes('aller') ? 'teteV' : 'tete'})`}
      />
    );
  };

  return (
    <div className="board">
      <svg id="plateau" viewBox="0 0 640 640" role="img" aria-label="La couronne : forêt et machines">
        <defs>
          <marker
            id="tete"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--danger)" />
          </marker>
          <marker
            id="teteV"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>

        {/* Cells */}
        <g id="gCells">
          <circle
            id="cell0"
            className={`cell a${Math.min(5, e.arbres[0])}${cands.has(0) ? ' cand' : ''}${
              cibleCase === 0 ? ' cible' : ''
            }${pareCase === 0 ? ' pare' : ''}`}
            cx={K.CX}
            cy={K.CY}
            r={K.RH}
            data-c="0"
            onClick={() => onSelectCase(0)}
          />
          {geo.cells.slice(1).map((x) => {
            const c = x.c;
            const treeCount = e.arbres[c] !== undefined ? Math.min(5, e.arbres[c]) : 0;
            return (
              <path
                key={c}
                id={`cell${c}`}
                className={`cell a${treeCount}${cands.has(c) ? ' cand' : ''}${
                  cibleCase === c ? ' cible' : ''
                }${pareCase === c ? ' pare' : ''}`}
                d={x.path || ''}
                data-c={c}
                onClick={() => onSelectCase(c)}
              />
            );
          })}
        </g>

        {/* Threat overlay heatmaps */}
        <g id="gThr">
          {geo.cells.map((x) => {
            const th = menace ? menace[x.c] || 0 : 0;
            const opacity = th > 0.01 ? Math.min(0.6, 0.12 + th * 0.75) : 0;
            if (x.c === 0) {
              return (
                <circle
                  key={0}
                  className="thr"
                  cx={K.CX}
                  cy={K.CY}
                  r={K.RH}
                  style={{ fillOpacity: opacity }}
                />
              );
            }
            return (
              <path
                key={x.c}
                className="thr"
                d={x.path || ''}
                style={{ fillOpacity: opacity }}
              />
            );
          })}
        </g>

        {/* Player sector separators & labels */}
        <g id="gSeps">
          {geo.seps.map(([x1, y1, x2, y2], idx) => (
            <line
              key={idx}
              className="tile-sep"
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
            />
          ))}
          {geo.noms.map(([x, y], t) => (
            <text
              key={t}
              className="tile-name"
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={`var(--j${t + 1})`}
            >
              Joueur {t + 1}
            </text>
          ))}
        </g>

        {/* Cell tree numbers and cell coordinate names */}
        <g id="gLabels">
          <text
            id="cn0"
            className={menace && menace[0] >= 0.1 ? 'cname thrtxt' : 'cname'}
            x={K.CX}
            y={K.CY - 30}
            textAnchor="middle"
          >
            {menace && menace[0] >= 0.1 ? `Cœur · ${B.pc(menace[0])}` : 'Cœur'}
          </text>
          <text id="nt0" className="ntree" x={K.CX} y={K.CY + 38} textAnchor="middle">
            {e.arbres[0]}
          </text>
          {geo.cells.slice(1).map((x) => {
            const c = x.c;
            const th = menace ? menace[c] || 0 : 0;
            const defaultNom = x.w > 30 && x.arc > 30 ? B.nomCase(p, pl, c) : '';
            return (
              <React.Fragment key={c}>
                <text
                  className="ntree"
                  x={x.nx.toFixed(1)}
                  y={x.ny.toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {e.arbres[c]}
                </text>
                <text
                  className={th >= 0.1 ? 'cname thrtxt' : 'cname'}
                  x={x.lx.toFixed(1)}
                  y={x.ly.toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {th >= 0.1 ? B.pc(th) : defaultNom}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Movement vectors and trajectory arrows */}
        <g id="gFleches">
          {allers.map(([fromC, toC, isStep2], idx) =>
            renderFleche(fromC, toC, `aller${isStep2 ? ' deux' : ''}`, `all-${idx}`)
          )}
          {trajet && renderFleche(trajet[0], trajet[1], '', 'traj')}
        </g>

        {/* Tokens (Machines & Individuals) */}
        <g id="gToks">
          {/* Machines */}
          {e.machines.map((c, mIdx) => {
            if (c < 0) return null;
            const pos = tokenPos['m' + mIdx];
            if (!pos) return null;
            const isActif = actifMachine === mIdx;
            return (
              <g
                key={`m-${mIdx}`}
                className={`tok mach${isActif ? ' actif' : ''}`}
                transform={`translate(${pos[0].toFixed(1)},${pos[1].toFixed(1)})`}
              >
                <rect x="-12" y="-9" width="24" height="18" rx="4" />
                <text textAnchor="middle" dominantBaseline="central">
                  {K.MACHINES[mIdx].court}
                </text>
              </g>
            );
          })}

          {/* Individuals */}
          {e.individus.map((c, iIdx) => {
            const pos = tokenPos['i' + iIdx];
            if (!pos) return null;
            const pj = K.proprietaire(p, iIdx);
            const isSel = selectedIndividu === iIdx;
            const isCliquable = cliquableIndividus.has(iIdx);
            return (
              <g
                key={`i-${iIdx}`}
                className={`tok ind${isSel ? ' sel' : ''}${isCliquable ? ' cliquable' : ''}`}
                transform={`translate(${pos[0].toFixed(1)},${pos[1].toFixed(1)})`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (isCliquable) onSelectIndividu(iIdx);
                }}
              >
                <circle r="8.5" fill={`var(--j${pj + 1})`} />
                <text textAnchor="middle" dominantBaseline="central">
                  {String.fromCharCode(97 + (iIdx % p.ipj))}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="legend">
        <span>
          <i style={{ background: 'var(--f3)' }} />
          case boisée (arbres)
        </span>
        <span>
          <i style={{ background: 'var(--f0)' }} />
          case rasée
        </span>
        <span>
          <i style={{ background: 'var(--machine)' }} />
          Machine sur le plateau
        </span>
        {menace && (
          <span>
            <i style={{ background: 'var(--danger)', opacity: 0.55 }} />
            chance qu'une menace frappe (dès 10 %)
          </span>
        )}
        <span>
          <i style={{ background: 'var(--accent)' }} />
          déplacement programmé
        </span>
      </div>
    </div>
  );
};
