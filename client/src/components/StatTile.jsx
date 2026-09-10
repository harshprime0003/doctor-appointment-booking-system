import Icon from './Icon.jsx';
import { MiniSpark } from './Charts.jsx';

const HEX = {
  indigo: '#6366f1', violet: '#8b5cf6', teal: '#14b8a6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', sky: '#0ea5e9', slate: '#64748b',
};

// Preclinic-style KPI tile: colored icon, value, delta badge, subtext, mini chart.
export default function StatTile({ label, value, icon, color = 'indigo', delta, deltaUp = true, sub, spark, sparkType = 'bar' }) {
  const hex = HEX[color] || HEX.indigo;
  return (
    <div className="stat-tile">
      <div className="stat-tile-top">
        <span className="st-icon" style={{ background: `${hex}1a`, color: hex }}>
          <Icon name={icon} size={20} />
        </span>
        {spark && <MiniSpark values={spark} type={sparkType} color={hex} />}
      </div>
      <div className="st-label">{label}</div>
      <div className="stat-tile-bottom">
        <div className="st-value">{value}</div>
        {delta != null && (
          <span className={`st-delta ${deltaUp ? 'up' : 'down'}`}>
            <Icon name={deltaUp ? 'trendingUp' : 'trendingUp'} size={11} style={deltaUp ? undefined : { transform: 'scaleY(-1)' }} />
            {delta}
          </span>
        )}
      </div>
      {sub && <div className="st-sub">{sub}</div>}
    </div>
  );
}
