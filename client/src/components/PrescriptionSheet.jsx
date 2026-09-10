import { formatDate } from '../utils/format.js';

export default function PrescriptionSheet({ rx }) {
  const v = rx.vitals || {};
  return (
    <div className="rx-sheet" id="rx-print">
      <div className="rx-head">
        <div>
          <div className="cell-strong" style={{ fontSize: 16 }}>{rx.doctorName}</div>
          <div className="tiny muted">{rx.doctorQualifications} · {rx.specialty}</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>MediBook Clinic</div>
        </div>
        <div className="rx-symbol">℞</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <div className="tiny muted">Patient</div>
          <div className="cell-strong">{rx.patientName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tiny muted">Date</div>
          <div className="cell-strong">{formatDate(rx.date)}</div>
        </div>
      </div>

      {(v.bp || v.pulse || v.temp || v.weight) && (
        <div className="inline-list" style={{ marginBottom: 14 }}>
          {v.bp && <span className="chip">BP: {v.bp}</span>}
          {v.pulse && <span className="chip">Pulse: {v.pulse}</span>}
          {v.temp && <span className="chip">Temp: {v.temp}</span>}
          {v.weight && <span className="chip">Weight: {v.weight}</span>}
        </div>
      )}

      {rx.diagnosis && (
        <div style={{ marginBottom: 14 }}>
          <div className="tiny muted">Diagnosis</div>
          <div>{rx.diagnosis}</div>
        </div>
      )}

      <table className="rx-meds">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {(rx.medicines || []).map((m, i) => (
            <tr key={i}>
              <td>
                <div className="cell-strong">{m.name}</div>
                {m.notes && <div className="tiny muted">{m.notes}</div>}
              </td>
              <td>{m.dosage || '—'}</td>
              <td>{m.frequency || '—'}</td>
              <td>{m.duration || '—'}</td>
            </tr>
          ))}
          {(!rx.medicines || rx.medicines.length === 0) && (
            <tr><td colSpan={4} className="muted">No medicines prescribed.</td></tr>
          )}
        </tbody>
      </table>

      {rx.advice && (
        <div style={{ marginTop: 14 }}>
          <div className="tiny muted">Advice</div>
          <div>{rx.advice}</div>
        </div>
      )}
      {rx.followUpDate && (
        <div style={{ marginTop: 10 }}>
          <span className="chip chip-primary">Follow-up: {formatDate(rx.followUpDate)}</span>
        </div>
      )}

      <div className="rx-sign">
        <div className="line">{rx.signature}</div>
      </div>
    </div>
  );
}
