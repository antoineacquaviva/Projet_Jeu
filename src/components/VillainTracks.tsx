import React from 'react';
import {
  EtatJeu,
  EvenementLancer,
  EchangePiste,
  ParametresCalcules,
  Plateau,
} from '../types';
import * as K from '../game/engine';
import * as B from '../game/bots';

interface VillainTracksProps {
  p: ParametresCalcules;
  pl: Plateau;
  e: EtatJeu;
  dernier: EvenementLancer | null;
  appVague: EchangePiste[];
  presageDice?: [number, number][] | null;
}

export const VillainTracks: React.FC<VillainTracksProps> = ({
  p,
  pl,
  e,
  dernier,
  appVague,
  presageDice,
}) => {
  const ev = dernier;
  const ap = ev && ev.appris ? ev.appris : null;

  // Track which cases moved/swapped
  const bougeP = new Set<number>();
  const bougeM = new Set<number>();
  const allAppris = (ap ? [ap] : []).concat(appVague || []);
  for (const a of allAppris) {
    if (a.pensees[1] !== null) {
      bougeP.add(a.pensees[0]);
      bougeP.add(a.pensees[1]);
    }
    if (a.machines[1] !== null) {
      bougeM.add(a.machines[0]);
      bougeM.add(a.machines[1]);
    }
  }

  const prof = K.profils(e);

  const renderDie = (n: number) => {
    const P9: Record<number, number[]> = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9],
    };
    const pips = P9[n] || [5];
    return (
      <span className="die" role="img" aria-label={`Dé ${n}`}>
        {pips.map((k) => (
          <i
            key={k}
            style={{
              gridArea: `${1 + Math.floor((k - 1) / 3)} / ${1 + ((k - 1) % 3)}`,
            }}
          />
        ))}
      </span>
    );
  };

  const renderDice = (d: [number, number]) => (
    <span className="dp">
      {renderDie(d[0])}
      {renderDie(d[1])}
    </span>
  );

  return (
    <div className="box mech" aria-label="La tête du Méchant">
      <div className="eyebrow">La tête du Méchant</div>

      {/* Piste des pensées */}
      <div className="trk-h">
        <span className="eyebrow">Piste des pensées</span>
        <span className="small">
          la <b>somme</b> des deux dés désigne la tactique
        </span>
      </div>

      <div className="track trk-p">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => {
          const t = K.tactiqueEn(e, s);
          const ch = K.CHANCES_SOMME(s);
          const isVise = ev && ev.somme === s;
          const isBouge = bougeP.has(s);
          return (
            <div
              key={s}
              className={`tc ${isVise ? 'vise' : ''} ${isBouge ? 'bouge' : ''} ${
                s === 7 ? 'sept' : ''
              }`}
            >
              <span className="n">{s}</span>
              <span className="dots" aria-label={`${ch} chances sur 36`}>
                {Array.from({ length: ch }).map((_, i) => (
                  <i key={i} />
                ))}
              </span>
              <span className={`tile ${t}`} title={K.NOMS_TACTIQUES[t]}>
                {K.COURT_TACTIQUE[t]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="small sens">
        Réussite : vers le 7. Échec : vers le bord (au 7, vers le 8).
      </p>

      {/* Piste des Machines */}
      <div className="trk-h">
        <span className="eyebrow">Piste des Machines</span>
        <span className="small">
          l'<b>écart</b> des deux dés désigne la Machine
        </span>
      </div>

      <div className="track trk-m">
        {K.ECARTS.map((d, pos) => {
          const m = e.pisteM[pos];
          const pr = prof[m];
          const lieu =
            e.machines[m] < 0 ? 'au chantier' : 'en ' + B.nomCase(p, pl, e.machines[m]);
          const isVise = ev && ev.ecart === d;
          const isBouge = bougeM.has(pos);
          const probInWave = K.auMoinsUneFois(K.CHANCES_ECART[d], p.L);

          return (
            <div
              key={pos}
              className={`tc mc ${isVise ? 'vise' : ''} ${isBouge ? 'bouge' : ''}`}
            >
              <span className="n">écart {d}</span>
              <span className="ch num">{K.CHANCES_ECART[d]}/36</span>
              <span className={`mtag ${e.machines[m] < 0 ? 'off' : ''}`}>
                {K.MACHINES[m].court}
              </span>
              <span className="mn">{K.MACHINES[m].nom}</span>
              <span className="lieu">{lieu}</span>
              <span className="pbar" aria-label="tactiques possibles">
                {K.TACTIQUES.filter((t) => pr.tactiques[t] > 0).map((t) => (
                  <span
                    key={t}
                    className={t}
                    style={{ flex: pr.tactiques[t] }}
                    title={`${K.NOMS_TACTIQUES[t]} ${pr.tactiques[t]}/36`}
                  />
                ))}
              </span>
              <span className="agit">{B.pc(probInWave)} dans la vague</span>
            </div>
          );
        })}
      </div>
      <p className="small sens">
        ← côté probable · réussite vers la gauche, échec vers la droite · côté rare →
      </p>

      {/* Tactique Legend */}
      <div className="tleg">
        {K.TACTIQUES.map((t) => (
          <span key={t}>
            <span className={`tile ${t}`}>{K.COURT_TACTIQUE[t]}</span>{' '}
            {K.NOMS_TACTIQUES[t]}
          </span>
        ))}
        <span className="small">
          La barre sous chaque Machine : les tactiques qu'elle peut recevoir.
        </span>
      </div>

      {/* Présage */}
      {presageDice && presageDice.length > 0 && (
        <div className="presage">
          <span className="eyebrow">Présage · les dés de la vague 1</span>
          <div className="dl">
            {presageDice.map((d, idx) => {
              const L = K.lire(e, d);
              return (
                <span key={idx} className="dp">
                  {renderDice(d)}
                  <span className="small">
                    {K.COURT_TACTIQUE[L.tactique]} · {K.MACHINES[L.machine].court}
                  </span>
                </span>
              );
            })}
          </div>
          <p className="small">
            Lus sur les pistes actuelles.{' '}
            {p.rythme === 'lancer'
              ? 'Les pistes bougent après chaque lancer : la lecture des derniers dés peut changer.'
              : "Les pistes ne bougent qu'à la fin de la vague : cette lecture tiendra."}
          </p>
        </div>
      )}

      {/* Dernier lancer */}
      {ev && (
        <div className="dernier">
          <span className="dl">{renderDice(ev.d)}</span>
          <span>
            somme <b>{ev.somme}</b> : {K.NOMS_TACTIQUES[ev.tactique]} · écart{' '}
            <b>{ev.ecart}</b> : {K.MACHINES[ev.machine].nom}
          </span>
        </div>
      )}
    </div>
  );
};
