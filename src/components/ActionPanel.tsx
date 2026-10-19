import React from 'react';
import {
  ParametresCalcules,
  Plateau,
  EtatJeu,
  Carte,
  Ordre,
  Reglages,
  SiegeType,
  EvenementLancer,
  OrdrePerdu,
} from '../types';
import * as K from '../game/engine';
import * as B from '../game/bots';

export const SIEGES_LABELS: Record<SiegeType, string> = {
  humain: 'Humain',
  prevoyant: 'Bot prévoyant',
  reflexe: 'Bot réflexe',
  stratege: 'Bot glouton',
  hasard: 'Bot hasard',
};

interface ActionPanelProps {
  gameStarted: boolean;
  reglages: Reglages;
  sieges: SiegeType[];
  p: ParametresCalcules;
  pl: Plateau;
  e: EtatJeu;
  phase: string;
  courant: number | null;
  slot: number;
  cartes: (Carte | null)[][];
  brouillon: (Carte | null)[] | null;
  dernier: EvenementLancer | null;
  pose: {
    gardes: Record<number, number>;
    sab: Record<number, number>;
    quiG: Record<number, number[]>;
    quiS: Record<number, number[]>;
    perdus: OrdrePerdu[];
  } | null;
  vagueNum: number;
  pasNum: number;
  paradesTotales: number;
  perdusTotaux: number;
  horsTotaux: number;
  parJoueur: number[];
  aideActive: boolean;
  onUpdateReglages: (newR: Partial<Reglages>) => void;
  onUpdateSiege: (idx: number, type: SiegeType) => void;
  onNewSeed: () => void;
  onStartGame: () => void;
  onSetSlot: (slot: number) => void;
  onChooseOrder: (i: number, o: Ordre) => void;
  onRetirerCarte: () => void;
  onValiderCartes: () => void;
  onToggleAide: (val: boolean) => void;
  onLancerSuivant: () => void;
  onTouteLaVague: () => void;
  onJouerJusquAuBout: () => void;
  onRevelerEtapeSuivante: () => void;
  onDebutTourSuivant: () => void;
  onRejouerMemeGraine: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  gameStarted,
  reglages,
  sieges,
  p,
  pl,
  e,
  phase,
  courant,
  slot,
  cartes,
  brouillon,
  dernier,
  pose,
  vagueNum,
  pasNum,
  paradesTotales,
  perdusTotaux,
  horsTotaux,
  parJoueur,
  aideActive,
  onUpdateReglages,
  onUpdateSiege,
  onNewSeed,
  onStartGame,
  onSetSlot,
  onChooseOrder,
  onRetirerCarte,
  onValiderCartes,
  onToggleAide,
  onLancerSuivant,
  onTouteLaVague,
  onJouerJusquAuBout,
  onRevelerEtapeSuivante,
  onDebutTourSuivant,
  onRejouerMemeGraine,
}) => {
  // If game is not started, show preparation/setup form
  if (!gameStarted) {
    const J = reglages.joueurs;
    return (
      <div className="box ask">
        <div className="eyebrow">Nouvelle partie</div>
        <h2>Préparer la table</h2>
        <p className="ctx">
          Chaque siège est un joueur humain ou un bot. Un humain peut tenir plusieurs
          sièges : il pose alors les cartes de chacun, à tour de rôle.
        </p>

        <div className="params">
          <label htmlFor="pJ">
            Joueurs
            <select
              id="pJ"
              value={J}
              onChange={(ev) => onUpdateReglages({ joueurs: +ev.target.value })}
            >
              {[2, 3, 4, 5, 6].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="setup" id="seats">
          {Array.from({ length: J }).map((_, j) => (
            <div key={j} className="seat">
              <span className="dot" style={{ background: `var(--j${j + 1})` }} />
              <span>Joueur {j + 1}</span>
              <select
                value={sieges[j] || 'prevoyant'}
                onChange={(ev) => onUpdateSiege(j, ev.target.value as SiegeType)}
              >
                {Object.entries(SIEGES_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <details>
          <summary
            className="small"
            style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 800 }}
          >
            Réglages avancés
          </summary>
          <div className="params" style={{ marginTop: 8 }}>
            <label>
              Cartes par joueur et par tour
              <select
                value={reglages.etapes}
                onChange={(ev) => {
                  const E = +ev.target.value;
                  onUpdateReglages({ etapes: E, tours: E === 2 ? 4 : 8 });
                }}
              >
                <option value={2}>deux (deux étapes)</option>
                <option value={1}>une (témoin)</option>
              </select>
            </label>

            <label>
              Lancers par vague
              <select
                value={reglages.lancersEnPlus}
                onChange={(ev) => onUpdateReglages({ lancersEnPlus: +ev.target.value })}
              >
                <option value={1}>un de plus que de joueurs</option>
                <option value={2}>deux de plus que de joueurs</option>
              </select>
            </label>

            <label>
              Les pistes apprennent
              <select
                value={reglages.rythme}
                onChange={(ev) =>
                  onUpdateReglages({ rythme: ev.target.value as 'lancer' | 'vague' })
                }
              >
                <option value="lancer">après chaque lancer</option>
                <option value="vague">à la fin de chaque vague</option>
              </select>
            </label>

            <label>
              Présage
              <select
                value={reglages.presage ? 1 : 0}
                onChange={(ev) => onUpdateReglages({ presage: ev.target.value === '1' })}
              >
                <option value={0}>non</option>
                <option value={1}>les dés de la vague 1 sont montrés</option>
              </select>
            </label>

            <label>
              Tuile
              <select
                value={`${reglages.tuileL}x${reglages.tuileP}`}
                onChange={(ev) => {
                  const [l, q] = ev.target.value.split('x').map(Number);
                  onUpdateReglages({ tuileL: l, tuileP: q });
                }}
              >
                <option value="3x3">3 × 3 cases</option>
                <option value="3x4">3 × 4 cases</option>
                <option value="4x4">4 × 4 cases</option>
              </select>
            </label>

            <label>
              Individus par joueur
              <select
                value={reglages.individusParJoueur}
                onChange={(ev) =>
                  onUpdateReglages({ individusParJoueur: +ev.target.value })
                }
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>

            <label>
              Arbres par case
              <select
                value={reglages.arbres}
                onChange={(ev) => onUpdateReglages({ arbres: +ev.target.value })}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>

            <label>
              Tours
              <select
                value={reglages.tours}
                onChange={(ev) => onUpdateReglages({ tours: +ev.target.value })}
              >
                {(reglages.etapes === 2 ? [3, 4, 5] : [6, 8, 10]).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Graine (même graine, mêmes dés)
              <input
                type="number"
                min="1"
                value={reglages.graine}
                onChange={(ev) =>
                  onUpdateReglages({ graine: Math.max(1, +ev.target.value || 1) })
                }
              />
            </label>
          </div>
          <p className="small">
            Par défaut : deux cartes, un lancer de plus que de joueurs par vague, les
            pistes apprennent après chaque lancer, pas de présage, 4 tours.
          </p>
        </details>

        <div className="resume num">
          <span>
            <b>{1 + J * reglages.tuileL * reglages.tuileP}</b> cases
          </span>
          <span>
            <b>{p.I}</b> individus
          </span>
          <span>
            <b>{p.ordresParTour}</b> ordres par tour
          </span>
          <span>
            <b>{p.lancersParTour}</b> lancers par tour
          </span>
          <span>
            <b>{p.surPlateau}</b> Machines sur le plateau, {6 - p.surPlateau} au chantier
          </span>
          <span>
            <b>{p.c0}</b> arbres
          </span>
        </div>

        {p.erreurs.length > 0 && (
          <div className="hint warn">{p.erreurs.join(' ; ')}.</div>
        )}

        <div className="btn-row">
          <button className="btn" disabled={p.erreurs.length > 0} onClick={onStartGame}>
            Commencer la partie
          </button>
          <button className="btn sec" onClick={onNewSeed}>
            Autre graine
          </button>
        </div>
      </div>
    );
  }

  // Active game phases
  const auto = !sieges.includes('humain');

  if (phase === 'cartes' && courant !== null && brouillon) {
    const j = courant;
    const v = slot;
    const cs = cartes.map((x) => x.slice());
    cs[j] = brouillon.slice();
    const pos = K.positionsPrevues(p, e, cs, v);
    const lu = aideActive
      ? B.lectureEtape(
          p,
          pl,
          e,
          pos,
          v,
          p.presage ? { connus: [/* placeholder */] } : null
        )
      : null;

    const autres = cartes
      .map((playerCards, k) => (k === j ? null : playerCards[v]))
      .filter((c): c is Carte => c !== null);
    const dejaG = (c: number) =>
      autres.filter((x) => x.o[0] === K.GARDER && x.o[1] === c).length;
    const dejaS = (m: number) =>
      autres.filter((x) => x.o[0] === K.SABOTER && x.o[1] === m).length;

    const nbCards = brouillon.filter((c) => c !== null).length;

    return (
      <div className="box ask">
        <div className="eyebrow" style={{ color: `var(--j${j + 1})` }}>
          Joueur {j + 1} · à toi
        </div>
        <h2>{p.E > 1 ? 'Tes deux cartes du tour' : 'Ta carte du tour'}</h2>
        <p className="ctx">
          {p.E > 1
            ? 'La carte 1 est révélée avant la première vague de lancers, la carte 2 avant la seconde. Entre les deux, les Machines bougent et les pistes apprennent. '
            : ''}
          Clique un de tes pions puis sa case pour <b>garder</b>, ou une case voisine pour
          y <b>aller</b> ; ou choisis ci-dessous.
        </p>

        {p.E > 1 && (
          <div className="slots">
            {brouillon.map((c, k) => (
              <button
                key={k}
                className={`slot ${k === v ? 'on' : ''}`}
                aria-pressed={k === v}
                onClick={() => onSetSlot(k)}
              >
                <span className="eyebrow">
                  Carte {k + 1} · étape {k + 1}
                </span>
                <span>
                  {c
                    ? `${B.nomInd(p, c.i)} ${B.ordreTexte(p, pl, c.o)}`
                    : 'rien'}
                </span>
              </button>
            ))}
          </div>
        )}

        {B.individusDe(p, j).map((i) => {
          const curPos = pos[i];
          const ops = K.ordresPossibles(p, pl, e, i, curPos);
          const moved = curPos !== e.individus[i];

          return (
            <div key={i} className="indrow">
              <span className="pion" style={{ background: `var(--j${j + 1})` }}>
                {String.fromCharCode(97 + (i % p.ipj))}
              </span>
              <div>
                <div className="small">
                  <b>{B.nomInd(p, i)}</b>{' '}
                  {moved
                    ? `sera en ${B.nomCase(p, pl, curPos)} (après sa carte ${v})`
                    : `en ${B.nomCase(p, pl, curPos)}`}
                  , {e.arbres[curPos]} arbres
                </div>
                <div className="btn-row" style={{ marginTop: 4 }}>
                  {ops.map((o, oIdx) => {
                    const c = brouillon[v];
                    const isOn =
                      c && c.i === i && c.o[0] === o[0] && c.o[1] === o[1];
                    let aideTxt = '';
                    if (lu && typeof o[1] === 'number') {
                      if (o[0] === K.GARDER) {
                        aideTxt = B.pc(lu.garde(o[1], dejaG(o[1])));
                      } else if (o[0] === K.SABOTER) {
                        aideTxt = B.pc(lu.sabot(o[1], dejaS(o[1])));
                      } else if (o[0] === K.ALLER) {
                        aideTxt =
                          'menace ' + B.pc(1 - Math.pow(1 - lu.pr[o[1]], p.L));
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        className={`opt k-${o[0]}`}
                        aria-pressed={!!isOn}
                        onClick={() => onChooseOrder(i, o)}
                      >
                        {B.ordreTexte(p, pl, o)}
                        {aideTxt && <span className="val">{aideTxt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {lu && (
          <p className="small">
            Garder : chance qu'au moins une menace frappe la case. Saboter : chance que la
            Machine agisse dans la vague ({p.L} lancers).
          </p>
        )}

        <label className="small">
          <input
            type="checkbox"
            checked={aideActive}
            onChange={(ev) => onToggleAide(ev.target.checked)}
          />{' '}
          afficher les chances (aide à la lecture des pistes)
        </label>

        <div className="btn-row">
          <button className="btn" onClick={onValiderCartes}>
            {nbCards
              ? `Valider ${p.E > 1 ? 'mes cartes' : 'ma carte'}`
              : 'Ne rien faire ce tour'}
          </button>
          {brouillon[v] && (
            <button className="btn sec" onClick={onRetirerCarte}>
              Retirer cette carte
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'vague') {
    const ev = dernier;
    return (
      <div className="box ask">
        <div className="eyebrow">
          {p.E > 1 ? `Vague ${vagueNum + 1} · ` : ''}lancer{' '}
          {Math.min(pasNum + 1, p.L)} sur {p.L}
        </div>
        {ev ? (
          <>
            <h2>{ev.issue === 'abattu' ? 'Un arbre tombe' : 'Menace parée'}</h2>
            <p className="ctx">
              Dés {ev.d[0]} et {ev.d[1]} : somme {ev.somme},{' '}
              {K.NOMS_TACTIQUES[ev.tactique]} ; écart {ev.ecart},{' '}
              {K.MACHINES[ev.machine].nom}.{' '}
              {ev.issue === 'abattu'
                ? `${K.MACHINES[ev.machine].nom} abat un arbre en ${B.nomCase(
                    p,
                    pl,
                    ev.cible
                  )}.`
                : ev.issue === 'gardee'
                ? `Visait ${B.nomCase(p, pl, ev.cible)}, gardée par ${
                    ev.qui !== undefined ? B.nomInd(p, ev.qui) : ''
                  } : parée.`
                : `${K.MACHINES[ev.machine].nom} a été sabotée par ${
                    ev.qui !== undefined ? B.nomInd(p, ev.qui) : ''
                  }.`}
            </p>
            {ev.appris && (
              <p className="ctx">
                {ev.issue === 'abattu' ? 'Réussite' : 'Échec'}, il apprend :{' '}
                {ev.appris.pensees[1] !== null
                  ? `${K.NOMS_TACTIQUES[ev.tactique]} ${ev.appris.pensees[0]} → ${
                      ev.appris.pensees[1]
                    }`
                  : `${K.NOMS_TACTIQUES[ev.tactique]} reste`}{' '}
                ;{' '}
                {ev.appris.machines[1] !== null
                  ? `${K.MACHINES[ev.machine].nom} écart ${
                      K.ECARTS[ev.appris.machines[0]!]
                    } → ${K.ECARTS[ev.appris.machines[1]!]}`
                  : `${K.MACHINES[ev.machine].nom} reste`}
                .
              </p>
            )}
          </>
        ) : (
          <>
            <h2>Cartes {p.E > 1 ? vagueNum + 1 + ' ' : ''}révélées</h2>
            <p className="ctx">
              Les déplacements ont eu lieu, les gardes et les sabotages sont posés
              pour cette vague. Le Méchant lance les dés {p.L} fois : la somme désigne
              une tactique, l'écart une Machine.
            </p>
          </>
        )}

        {pose && pose.perdus.length > 0 && !ev && (
          <div className="hint warn">
            {pose.perdus.map((x, idx) => (
              <div key={idx}>
                {B.nomInd(p, x.i)} : {B.ordreTexte(p, pl, x.o)} perdu ({x.pourquoi}).
              </div>
            ))}
          </div>
        )}

        <div className="btn-row">
          <button className="btn" onClick={onLancerSuivant}>
            Lancer les dés
          </button>
          <button className="btn sec" onClick={onTouteLaVague}>
            Toute la vague
          </button>
          {auto && (
            <button className="btn sec" onClick={onJouerJusquAuBout}>
              Jouer jusqu'au bout
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'inter') {
    return (
      <div className="box ask">
        <div className="eyebrow">Vague {vagueNum + 1} terminée</div>
        <h2>Étape {vagueNum + 1} achevée</h2>
        <p className="ctx">
          Les gardes et sabotages de l'étape {vagueNum + 1} tombent. Les Machines ont
          bougé et les pistes ont appris : regarde ce qui a changé avant de révéler
          les cartes {vagueNum + 2}.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={onRevelerEtapeSuivante}>
            Révéler les cartes {vagueNum + 2}
          </button>
          {auto && (
            <button className="btn sec" onClick={onJouerJusquAuBout}>
              Jouer jusqu'au bout
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'entre') {
    return (
      <div className="box ask">
        <div className="eyebrow">Tour terminé</div>
        <h2>Bilan du tour</h2>
        <p className="ctx">
          Forêt restante : <b>{K.foret(e)}</b> arbres sur {p.c0}.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={onDebutTourSuivant}>
            Tour suivant
          </button>
          {auto && (
            <button className="btn sec" onClick={onJouerJusquAuBout}>
              Jouer jusqu'au bout
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'fin') {
    const r = K.foret(e);
    const mx = Math.max(1, ...parJoueur);
    return (
      <div className="box ask">
        <div className="eyebrow">Partie terminée</div>
        <h2>
          {r} arbres sauvés sur {p.c0} ({B.pc(r / p.c0)})
        </h2>
        <p className="ctx">
          {paradesTotales} parades pour {p.ordresParTour * p.tours} ordres, soit{' '}
          <b>{B.pc(paradesTotales / (p.ordresParTour * p.tours))}</b> des ordres qui ont
          sauvé un arbre. {perdusTotaux} ordre{perdusTotaux > 1 ? 's' : ''} perdu
          {perdusTotaux > 1 ? 's' : ''}.{' '}
          {paradesTotales > 0 &&
            `${B.pc(horsTotaux / paradesTotales)} des parades faites hors de sa propre tuile.`}
        </p>

        <div className="bars">
          {parJoueur.map((x, j) => (
            <div key={j} className="barl">
              <span>Joueur {j + 1}</span>
              <span className="bart">
                <span
                  style={{
                    width: `${((100 * x) / mx).toFixed(0)}%`,
                    background: `var(--j${j + 1})`,
                  }}
                />
              </span>
              <span className="num">{x}</span>
            </div>
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={onStartGame}>
            Nouvelle partie
          </button>
          <button className="btn sec" onClick={onRejouerMemeGraine}>
            Rejouer la même graine
          </button>
        </div>
      </div>
    );
  }

  return null;
};
