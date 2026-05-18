/**
 * TableroRo.tsx — página principal del tablero semanal.
 * Placeholder S1 — implementación completa en S2 (board + DnD).
 */

import { useBoardContext } from '../contexts/BoardContext';
import { MONTHS_SHORT, DAYS_SHORT } from '../types/board';

function mondayLabel(d: Date): string {
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} — ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

export default function TableroRo() {
  const { state, dispatch } = useBoardContext();
  const { weekStart } = state;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <main className="tr-main" id="wboard" tabIndex={-1}>
      {/* Topbar placeholder */}
      <nav className="tr-topbar" aria-label="Barra de herramientas">
        <h1 className="tr-month">{MONTHS_SHORT[weekStart.getMonth()].toUpperCase()} {weekStart.getFullYear()}</h1>
        <div className="tr-wnav" aria-label="Navegación semanal">
          <button className="tr-wnav-btn" onClick={() => dispatch({ type: 'GO_WEEK', dir: -1 })} aria-label="Semana anterior">←</button>
          <button className="tr-wnav-btn tr-wnav-today" onClick={() => dispatch({ type: 'GO_TODAY' })} aria-label="Ir a semana actual">Hoy</button>
          <span className="tr-wnav-label" aria-live="polite">{mondayLabel(weekStart)}</span>
          <button className="tr-wnav-btn" onClick={() => dispatch({ type: 'GO_WEEK', dir: 1 })} aria-label="Semana siguiente">→</button>
        </div>
      </nav>

      {/* Board skeleton — S2 implementa WeekBoard + EventCard + DnD */}
      <div className="tr-board-skeleton">
        {days.map((d, i) => {
          const iso = d.toISOString().slice(0, 10);
          const dayEvents = state.events.filter((e) => e.iso === iso && !state.hidden.has(e.cal));
          return (
            <div key={iso} className="tr-day-col-skeleton">
              <div className="tr-day-header">
                <span className="tr-day-name">{DAYS_SHORT[d.getDay()]}</span>
                <span className="tr-day-num">{d.getDate()}</span>
                <span className="tr-day-count">{dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="tr-day-body" id={`wb-${iso}`} aria-label={`${DAYS_SHORT[d.getDay()]} ${d.getDate()}, ${dayEvents.length} eventos`}>
                {dayEvents.length === 0 ? (
                  <div className="tr-day-empty">Sin eventos</div>
                ) : (
                  dayEvents
                    .slice()
                    .sort((a, b) => (a.time ?? '00:00') < (b.time ?? '00:00') ? -1 : 1)
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className={`tr-card tr-card--${ev.cal}`}
                        style={{ borderLeftColor: `var(--cal-${ev.cal})` }}
                      >
                        {ev.time && <span className="tr-card-time">{ev.time}</span>}
                        <span className="tr-card-title">{ev.title}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="tr-s1-note" aria-hidden="true">
        S1 andamio — S2 implementa DnD, modales y BuJo.
      </p>
    </main>
  );
}
