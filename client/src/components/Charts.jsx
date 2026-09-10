// Lightweight dependency-free SVG charts used across dashboards.

let sparkSeq = 0;
export function MiniSpark({ values = [], type = 'bar', color = '#6366f1', accent, rounded = false, width = 96, height = 42 }) {
  const nums = values.map(Number).filter((v) => !Number.isNaN(v));
  if (nums.length === 0) return null;
  const max = Math.max(...nums, 1);
  const min = Math.min(...nums, 0);
  const range = max - min || 1;

  if (type === 'bar') {
    const gap = 3;
    const bw = (width - gap * (nums.length - 1)) / nums.length;
    const rx = rounded ? Math.min(bw / 2, 3.5) : 0;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {nums.map((v, i) => {
          const h = Math.max(3, ((v - min) / range) * (height - 4));
          const isAccent = accent && i >= nums.length - 2; // last two bars accented
          return <rect key={i} x={i * (bw + gap)} y={height - h} width={bw} height={h} rx={rx} fill={isAccent ? accent : color} />;
        })}
      </svg>
    );
  }

  // area = filled wave (line + visible gradient fill)
  const stepX = width / (nums.length - 1);
  const pts = nums.map((v, i) => [i * stepX, height - 4 - ((v - min) / range) * (height - 8)]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  const id = `ms-${(sparkSeq += 1)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Stacked (or grouped) bar chart by category (e.g. months).
export function BarChart({ data = [], series = [], height = 260, yTicks = 4, fill = false }) {
  const W = 760;
  const padL = 34, padB = 26, padT = 12;
  const chartH = height - padB - padT;
  const svgProps = fill
    ? { style: { width: '100%', height: '100%', display: 'block' }, preserveAspectRatio: 'none' }
    : { style: { width: '100%', height: 'auto' } };
  const totals = data.map((d) => series.reduce((s, se) => s + (Number(d.values[se.key]) || 0), 0));
  const rawMax = Math.max(1, ...totals);
  // Tight headroom (~8%) so the tallest bars nearly fill the chart height.
  const niceMax = Math.max(rawMax + 1, Math.ceil(rawMax * 1.08));
  const stepX = (W - padL) / data.length;
  const barW = Math.min(34, stepX * 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} {...svgProps}>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + (chartH * i) / yTicks;
        const val = Math.round(niceMax - (niceMax * i) / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W} y2={y} stroke="#eef0f6" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + stepX * i + stepX / 2;
        let acc = 0;
        return (
          <g key={i}>
            {series.map((se) => {
              const v = Number(d.values[se.key]) || 0;
              const h = (v / niceMax) * chartH;
              const y = padT + chartH - acc - h;
              acc += h;
              return <rect key={se.key} x={cx - barW / 2} y={y} width={barW} height={Math.max(0, h)} fill={se.color} rx="2" />;
            })}
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart with center label.
export function Donut({ segments = [], size = 180, thickness = 26, centerValue, centerLabel }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f6" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{centerValue}</div>
            <div className="tiny muted">{centerLabel}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 120 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1 }} className="muted">{s.label}</span>
            <span className="cell-strong">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
