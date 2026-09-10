import Icon from './Icon.jsx';
import { MiniSpark } from './Charts.jsx';

const HEX = {
  indigo: '#6366f1', violet: '#8b5cf6', teal: '#14b8a6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', sky: '#0ea5e9',
};

export default function KpiCard({ label, value, icon, color = 'indigo', chartColor, chartType = 'bar', accent, rounded = false, delta, deltaUp = true, sub = 'in last 7 days', spark }) {
  const iconHex = HEX[color] || color || HEX.indigo;
  const chartHex = HEX[chartColor] || chartColor || iconHex;
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-ico" style={{ background: iconHex }}><Icon name={icon} size={20} /></span>
        <div className="kpi-topr">
          {delta != null && (
            <span className={`kpi-delta ${deltaUp ? 'up' : 'down'}`}>
              <Icon name="trendingUp" size={11} style={deltaUp ? undefined : { transform: 'scaleY(-1)' }} /> {delta}
            </span>
          )}
          <span className="kpi-sub">{sub}</span>
        </div>
      </div>
      <div className="kpi-bot">
        <div>
          <div className="kpi-num">{value}</div>
          <div className="kpi-lab">{label}</div>
        </div>
        {spark && <MiniSpark values={spark} type={chartType} color={chartHex} accent={accent} rounded={rounded} width={100} height={44} />}
      </div>
    </div>
  );
}
