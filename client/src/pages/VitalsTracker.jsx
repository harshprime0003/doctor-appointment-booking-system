import { useEffect, useState } from 'react';
import { VitalsApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Field, Input, Loading, EmptyState, StatCard } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate, todayStr } from '../utils/format.js';

const METRICS = [
  { key: 'systolic', label: 'Blood Pressure', unit: 'mmHg', color: '#f43f5e', get: (v) => Number(String(v.bp || '').split('/')[0]) || null },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', color: '#6366f1', get: (v) => v.pulse },
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#0d9488', get: (v) => v.weight },
  { key: 'sugar', label: 'Blood Sugar', unit: 'mg/dL', color: '#f59e0b', get: (v) => v.sugar },
  { key: 'spo2', label: 'SpO₂', unit: '%', color: '#0ea5e9', get: (v) => v.spo2 },
];

function LineChart({ points, color }) {
  const W = 760, H = 240, pad = 34;
  const vals = points.map((p) => p.y).filter((y) => typeof y === 'number' && !Number.isNaN(y));
  if (vals.length < 2) return <div className="empty-state"><p className="muted">Add at least two readings to see a trend.</p></div>;
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const stepX = (W - pad * 2) / (points.length - 1);
  const xy = points.map((p, i) => [pad + i * stepX, H - pad - ((p.y - min) / range) * (H - pad * 2)]);
  const line = xy.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${xy[0][0]},${H - pad} ${line} ${xy[xy.length - 1][0]},${H - pad}`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => H - pad - f * (H - pad * 2));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="vgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((y, i) => <line key={i} x1={pad} y1={y} x2={W - pad} y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
      <polygon points={area} fill="url(#vgrad)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={p[0]} y={H - 12} textAnchor="middle" fontSize="10" fill="#94a3b8">{points[i].label}</text>
        </g>
      ))}
      <text x={pad - 6} y={gridY[4] + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{min}</text>
      <text x={pad - 6} y={gridY[0] + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{max}</text>
    </svg>
  );
}

export default function VitalsTracker() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('systolic');
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    VitalsApi.list().then((r) => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (v) => {
    try { await VitalsApi.remove(v.id); toast.success('Reading removed'); load(); } catch (err) { toast.error(err.message); }
  };

  const m = METRICS.find((x) => x.key === metric);
  const points = data.map((v) => ({ label: formatDate(v.date).slice(0, 6), y: m.get(v) })).filter((p) => p.y != null);
  const latest = data[data.length - 1] || {};

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Vitals Tracker' }]} />
      <PageHeader
        title="Vitals Tracker"
        subtitle="Log your readings and watch your health trends over time."
        actions={<Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add reading</Button>}
      />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Blood Pressure" value={latest.bp || '—'} meta="mmHg" icon="heart" color="rose" />
            <StatCard label="Pulse" value={latest.pulse ?? '—'} meta="bpm" icon="activity" color="indigo" />
            <StatCard label="Weight" value={latest.weight ?? '—'} meta="kg" icon="trendingUp" color="teal" />
            <StatCard label="Blood Sugar" value={latest.sugar ?? '—'} meta="mg/dL" icon="dollar" color="amber" />
          </div>

          <Section
            title="Trend"
            actions={
              <div className="lang-switch">
                {METRICS.map((mm) => (
                  <button key={mm.key} className={metric === mm.key ? 'active' : ''} onClick={() => setMetric(mm.key)}>{mm.label.split(' ')[0]}</button>
                ))}
              </div>
            }
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{m.label} <span className="muted tiny">({m.unit})</span></div>
            <LineChart points={points} color={m.color} />
          </Section>

          <Section title="History" flush>
            <DataTable
              rows={[...data].reverse()}
              empty={<EmptyState icon="activity" title="No readings yet" message="Add your first reading to start tracking." />}
              columns={[
                { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
                { key: 'bp', header: 'BP', render: (r) => r.bp || '—' },
                { key: 'pulse', header: 'Pulse', align: 'right', className: 'num', render: (r) => r.pulse ?? '—' },
                { key: 'weight', header: 'Weight', align: 'right', className: 'num', render: (r) => r.weight ?? '—' },
                { key: 'sugar', header: 'Sugar', align: 'right', className: 'num', render: (r) => r.sugar ?? '—' },
                { key: 'spo2', header: 'SpO₂', align: 'right', className: 'num', render: (r) => (r.spo2 != null ? `${r.spo2}%` : '—') },
                { key: 'actions', header: '', render: (r) => <div className="row-actions"><Button size="sm" variant="danger" icon="trash" onClick={() => remove(r)} /></div> },
              ]}
            />
          </Section>
        </>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddModal({ onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ date: todayStr(), bp: '', pulse: '', weight: '', sugar: '', temp: '', spo2: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try { await VitalsApi.add(form); toast.success('Reading added'); onDone(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Add a reading" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save reading'}</Button></>}>
      <div className="form-grid">
        <Field label="Date" full><Input type="date" value={form.date} onChange={set('date')} /></Field>
        <Field label="Blood pressure"><Input value={form.bp} onChange={set('bp')} placeholder="120/80" /></Field>
        <Field label="Pulse (bpm)"><Input type="number" value={form.pulse} onChange={set('pulse')} placeholder="72" /></Field>
        <Field label="Weight (kg)"><Input type="number" value={form.weight} onChange={set('weight')} placeholder="65" /></Field>
        <Field label="Blood sugar (mg/dL)"><Input type="number" value={form.sugar} onChange={set('sugar')} placeholder="95" /></Field>
        <Field label="Temperature (°F)"><Input type="number" value={form.temp} onChange={set('temp')} placeholder="98.6" /></Field>
        <Field label="SpO₂ (%)"><Input type="number" value={form.spo2} onChange={set('spo2')} placeholder="98" /></Field>
      </div>
    </Modal>
  );
}
