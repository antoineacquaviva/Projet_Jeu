import React, { useRef, useEffect } from 'react';
import { JournalEntry } from '../types';

interface GameJournalProps {
  journal: JournalEntry[];
  showWhy: boolean;
  onToggleWhy: (val: boolean) => void;
}

export const GameJournal: React.FC<GameJournalProps> = ({
  journal,
  showWhy,
  onToggleWhy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [journal]);

  return (
    <div className="box" id="jBox">
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <div className="eyebrow">Journal de la partie</div>
        <label className="small">
          <input
            type="checkbox"
            checked={showWhy}
            onChange={(ev) => onToggleWhy(ev.target.checked)}
          />{' '}
          raisons des bots
        </label>
      </div>
      <div className="journal" id="journal" aria-live="polite" ref={containerRef}>
        {journal.map((l, idx) => (
          <div key={idx} className={`jl k-${l.k}`}>
            {l.tag && <span className="tag">{l.tag}</span>}
            {l.txt}
            {showWhy && l.why && <span className="why">{l.why}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
