import { useEffect, useState } from 'react';
import { DoctorApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Loading, Button, Select, Input, Alert, Badge } from '../components/ui.jsx';
import { WEEKDAY_LABELS } from '../utils/weekdays.js';
import { formatDate, todayStr } from '../utils/format.js';

const SLOT_OPTIONS = [15, 20, 30, 45, 60];
const TABS = [
  { id: 'hours', label: 'Working hours' },
  { id: 'breaks', label: 'Breaks & lunch' },
  { id: 'blocked', label: 'Holidays & vacation' },
];

export default function DoctorSchedule() {
  const toast = useToast();
  const [tab, setTab] = useState('hours');
  const [blocks, setBlocks] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newDate, setNewDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    DoctorApi.myProfile()
      .then((res) => {
        setBlocks(res.doctor.availability || []);
        setBreaks(res.doctor.breaks || []);
        setBlockedDates(res.doctor.blockedDates || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await DoctorApi.updateMyProfile({
        availability: blocks.map((b) => ({ day: Number(b.day), startTime: b.startTime, endTime: b.endTime, slotMinutes: Number(b.slotMinutes) })),
        breaks: breaks.map((b) => ({ day: Number(b.day), startTime: b.startTime, endTime: b.endTime })),
        blockedDates,
      });
      toast.success('Schedule saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Availability' }]} />
      <PageHeader
        title="Schedule & availability"
        subtitle="Working hours, breaks and time off. Slots are generated automatically."
        actions={<Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save schedule'}</Button>}
      />

      <div className="tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`tab${tab === tb.id ? ' active' : ''}`} onClick={() => setTab(tb.id)}>{tb.label}</button>
        ))}
      </div>

      {tab === 'hours' && (
        <>
          {blocks.length === 0 && <Alert variant="info">No working hours set. Add time blocks so patients can book.</Alert>}
          {WEEKDAY_LABELS.map((label, day) => {
            const dayBlocks = blocks.map((b, i) => ({ ...b, _i: i })).filter((b) => Number(b.day) === day);
            return (
              <Section key={day} title={label} flush actions={<Button size="sm" icon="plus" onClick={() => setBlocks((b) => [...b, { day, startTime: '09:00', endTime: '13:00', slotMinutes: 30 }])}>Add block</Button>}>
                {dayBlocks.length === 0 ? (
                  <div className="section-body"><span className="muted tiny">Not available on {label}.</span></div>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>From</th><th>To</th><th>Slot length</th><th></th></tr></thead>
                      <tbody>
                        {dayBlocks.map((b) => (
                          <tr key={b._i}>
                            <td><Input type="time" value={b.startTime} onChange={(e) => setBlocks((c) => c.map((x, i) => (i === b._i ? { ...x, startTime: e.target.value } : x)))} style={{ width: 130 }} /></td>
                            <td><Input type="time" value={b.endTime} onChange={(e) => setBlocks((c) => c.map((x, i) => (i === b._i ? { ...x, endTime: e.target.value } : x)))} style={{ width: 130 }} /></td>
                            <td><Select value={b.slotMinutes} onChange={(e) => setBlocks((c) => c.map((x, i) => (i === b._i ? { ...x, slotMinutes: e.target.value } : x)))} style={{ width: 140 }}>{SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}</Select></td>
                            <td className="num"><Button size="sm" variant="danger" icon="trash" onClick={() => setBlocks((c) => c.filter((_, i) => i !== b._i))}>Remove</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            );
          })}
        </>
      )}

      {tab === 'breaks' && (
        <Section title="Breaks & lunch" flush actions={<Button size="sm" icon="plus" onClick={() => setBreaks((b) => [...b, { day: 1, startTime: '13:00', endTime: '14:00' }])}>Add break</Button>}>
          {breaks.length === 0 ? (
            <div className="section-body"><span className="muted tiny">No breaks configured. Add lunch or break windows to remove those slots.</span></div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Day</th><th>From</th><th>To</th><th></th></tr></thead>
                <tbody>
                  {breaks.map((b, i) => (
                    <tr key={i}>
                      <td><Select value={b.day} onChange={(e) => setBreaks((c) => c.map((x, idx) => (idx === i ? { ...x, day: e.target.value } : x)))} style={{ width: 150 }}>{WEEKDAY_LABELS.map((d, di) => <option key={di} value={di}>{d}</option>)}</Select></td>
                      <td><Input type="time" value={b.startTime} onChange={(e) => setBreaks((c) => c.map((x, idx) => (idx === i ? { ...x, startTime: e.target.value } : x)))} style={{ width: 130 }} /></td>
                      <td><Input type="time" value={b.endTime} onChange={(e) => setBreaks((c) => c.map((x, idx) => (idx === i ? { ...x, endTime: e.target.value } : x)))} style={{ width: 130 }} /></td>
                      <td className="num"><Button size="sm" variant="danger" icon="trash" onClick={() => setBreaks((c) => c.filter((_, idx) => idx !== i))}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {tab === 'blocked' && (
        <Section title="Holidays, vacation & days off">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <label className="field-label">Block a date</label>
              <Input type="date" value={newDate} min={todayStr()} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <Button icon="plus" onClick={() => { if (newDate && !blockedDates.includes(newDate)) setBlockedDates((d) => [...d, newDate].sort()); }}>Add date</Button>
          </div>
          {blockedDates.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No blocked dates. Patients can book on all working days.</p>
          ) : (
            <div className="inline-list">
              {blockedDates.map((d) => (
                <span key={d} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {formatDate(d)}
                  <button className="btn btn-ghost btn-sm" style={{ height: 20, padding: 0, width: 20 }} onClick={() => setBlockedDates((cur) => cur.filter((x) => x !== d))}>×</button>
                </span>
              ))}
            </div>
          )}
          <Alert variant="info" style={{ marginTop: 16 }}>Approved leave requests also block dates automatically.</Alert>
        </Section>
      )}
    </div>
  );
}
