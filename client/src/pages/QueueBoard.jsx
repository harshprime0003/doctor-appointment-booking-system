import { useEffect, useState, useCallback } from 'react';
import { AppointmentApi, DoctorApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Select, Input, Loading, EmptyState, Badge, StatCard } from '../components/ui.jsx';
import ConsultationModal from '../components/ConsultationModal.jsx';
import Icon from '../components/Icon.jsx';
import { todayStr, titleCase } from '../utils/format.js';

function EcgLine() {
  // Seamless scrolling heartbeat: repeat a 120px-wide cycle several times so the
  // -120px translate loops without a visible seam.
  const cycle = [
    [0, 34], [40, 34], [48, 34], [54, 12], [60, 52], [66, 22], [72, 34], [120, 34],
  ];
  const points = [];
  for (let c = 0; c < 7; c += 1) {
    const o = c * 120;
    cycle.forEach(([x, y]) => points.push(`${x + o},${y}`));
  }
  return (
    <div className="ns-ecg" aria-hidden="true">
      <svg width="840" height="56" viewBox="0 0 840 56">
        <polyline className="ns-ecg-line" points={points.join(' ')} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const NEXT_ACTION = {
  booked: { to: 'waiting', label: 'Check in', icon: 'checkCircle', variant: '' },
  waiting: { to: 'called', label: 'Call', icon: 'bell', variant: 'accent' },
  called: { to: 'in_consultation', label: 'Start', icon: 'play', variant: 'primary' },
  in_consultation: { to: 'completed', label: 'Complete', icon: 'check', variant: 'success' },
};

export default function QueueBoard() {
  const { user } = useAuth();
  const toast = useToast();
  const isReception = user.role === 'receptionist';
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consult, setConsult] = useState(null);
  const isDoctor = user.role === 'doctor';

  useEffect(() => {
    if (isReception) {
      DoctorApi.list({ pageSize: 100, sort: 'name' }).then((r) => {
        setDoctors(r.data);
        if (r.data[0]) setDoctorId(r.data[0].id);
      });
    }
  }, [isReception]);

  const load = useCallback(async () => {
    if (isReception && !doctorId) return;
    try {
      const params = { date };
      if (isReception) params.doctorId = doctorId;
      const res = await AppointmentApi.queue(params);
      setData(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [isReception, doctorId, date]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Live refresh every 8 seconds.
  useEffect(() => {
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async (item) => {
    const action = NEXT_ACTION[item.trackStatus];
    if (!action) return;
    try {
      await AppointmentApi.track(item.id, action.to);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openConsult = async (item) => {
    try {
      const res = await AppointmentApi.get(item.id);
      setConsult(res.appointment);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Live Queue' }]} />
      <PageHeader
        title="Live Queue & Token Board"
        subtitle="Real-time patient flow. Auto-refreshes every few seconds."
        actions={
          <span className="badge badge-success"><span className="dot" /> Live</span>
        }
      />

      <Section flush>
        <div className="toolbar">
          {isReception && (
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} style={{ minWidth: 220 }}>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>)}
            </Select>
          )}
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
          <span className="toolbar-spacer" />
          <Button size="sm" variant="ghost" icon="refresh" onClick={load}>Refresh</Button>
        </div>
      </Section>

      {loading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="In queue" value={data.counts.waiting} icon="clock" color="amber" />
            <StatCard label="Completed today" value={data.counts.completed} icon="check" color="emerald" />
            <StatCard label="Total today" value={data.counts.total} icon="ticket" color="indigo" />
            <StatCard label="Est. wait / patient" value="~15 min" icon="activity" color="sky" />
          </div>

          <div className="token-board">
            <div className="now-serving">
              <div className="ns-live"><span className="ns-live-dot" /> LIVE</div>
              <div className="label">Now Serving</div>
              {data.nowServing != null ? (
                <div className="ns-token-wrap">
                  <span className="ns-ring" />
                  <span className="ns-ring r2" />
                  <span className="ns-ring r3" />
                  <div className="token-num ns-token-num" key={data.nowServing}>#{data.nowServing}</div>
                </div>
              ) : (
                <div className="ns-idle">
                  <div className="ns-dots"><span /><span /><span /></div>
                  <div className="tiny" style={{ opacity: 0.85 }}>Waiting for next patient</div>
                </div>
              )}
              <div className="patient">{data.servingPatient || 'No patient in consultation'}</div>
              <div className="ns-doc">{data.doctorName}</div>
              <EcgLine />
            </div>

            <Section title="Queue" flush>
              {data.queue.length === 0 ? (
                <EmptyState icon="ticket" title="No patients today" message="Bookings for this date will appear here." />
              ) : (
                <div className="queue-list" style={{ padding: 12 }}>
                  {data.queue.map((item) => {
                    const action = NEXT_ACTION[item.trackStatus];
                    const isCurrent = item.trackStatus === 'in_consultation' || item.trackStatus === 'called';
                    return (
                      <div className={`queue-item${isCurrent ? ' current' : ''}`} key={item.id}>
                        <span className="queue-token">{item.token}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cell-strong">
                            {item.patientName}
                            {item.type === 'emergency' && <Badge variant="danger">Emergency</Badge>}
                          </div>
                          <div className="tiny muted">
                            {item.startTime} · {titleCase(item.trackStatus)}
                            {item.estimatedWaitMin > 0 && ` · ~${item.estimatedWaitMin} min wait`}
                          </div>
                        </div>
                        {isDoctor && item.trackStatus === 'in_consultation' ? (
                          <Button size="sm" variant="primary" icon="stethoscope" onClick={() => openConsult(item)}>Consult</Button>
                        ) : action ? (
                          <Button size="sm" variant={action.variant} icon={action.icon} onClick={() => advance(item)}>{action.label}</Button>
                        ) : (
                          <Badge variant="success">Done</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        </>
      )}

      {consult && (
        <ConsultationModal
          appointment={consult}
          onClose={() => setConsult(null)}
          onCompleted={() => { setConsult(null); load(); }}
        />
      )}
    </div>
  );
}
