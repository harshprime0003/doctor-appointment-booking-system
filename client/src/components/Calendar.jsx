import { useState } from 'react';
import Icon from './Icon.jsx';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ymd(d) { return d.toISOString().slice(0, 10); }

export default function Calendar({ marked = new Set(), selected, onSelect }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = ymd(new Date());

  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const move = (delta) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="btn btn-ghost btn-sm" onClick={() => move(-1)} aria-label="Previous month"><Icon name="chevronLeft" size={16} /></button>
        <div className="cal-title">{MONTHS[month]} {year}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => move(1)} aria-label="Next month"><Icon name="chevronRight" size={16} /></button>
      </div>
      <div className="cal-grid cal-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="cal-cell empty" />;
          const key = ymd(new Date(year, month, d));
          const cls = ['cal-cell', key === today ? 'today' : '', key === selected ? 'selected' : '', marked.has(key) ? 'marked' : ''].filter(Boolean).join(' ');
          return (
            <button key={key} className={cls} onClick={() => onSelect && onSelect(key)}>
              {d}
              {marked.has(key) && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
