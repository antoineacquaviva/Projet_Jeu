import React from 'react';
import { Enregistrement } from '../types';

interface ArchivesProps {
  records: Enregistrement[];
  onExport: (record: Enregistrement) => void;
  onExportAll: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const Archives: React.FC<ArchivesProps> = ({
  records,
  onExport,
  onExportAll,
  onDeleteRecord,
}) => {
  return (
    <div className="box">
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <h2>Parties enregistrées</h2>
        <div className="btn-row">
          <button
            className="btn sec"
            disabled={records.length === 0}
            onClick={onExportAll}
          >
            Exporter tout (JSON)
          </button>
        </div>
      </div>

      <p className="ctx" id="dbState">
        Chaque partie terminée et chaque série sont enregistrées avec leur journal
        complet (paramètres, graine, dés, cartes, raisons des bots, lancers, parades et
        échanges sur les pistes). Vous pouvez les relire ou les exporter.
      </p>

      <div className="saved" id="saved">
        {records.length > 0 ? (
          records.map((r) => (
            <div key={r.id} className="sv">
              <span>
                {r.titre}
                <br />
                <span className="m">
                  {new Date(r.date).toLocaleString('fr-FR')} ·{' '}
                  {r.type === 'serie' ? 'série' : 'partie'}
                </span>
              </span>
              <div className="btn-row">
                <button
                  className="opt"
                  onClick={() => onExport(r)}
                  title="Exporter au format JSON"
                >
                  Exporter
                </button>
                {onDeleteRecord && (
                  <button
                    className="opt"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => onDeleteRecord(r.id)}
                    title="Supprimer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            Aucune partie enregistrée pour l'instant. Les parties terminées et les séries
            de bots apparaîtront ici.
          </div>
        )}
      </div>
    </div>
  );
};
