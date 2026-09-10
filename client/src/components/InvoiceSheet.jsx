import { currency, formatDate, formatDateTime, titleCase } from '../utils/format.js';

export default function InvoiceSheet({ appointment, payment }) {
  return (
    <div className="rx-sheet invoice-sheet" id="invoice-print">
      <div className="rx-head" style={{ borderColor: 'var(--primary)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="app-brand" style={{ fontSize: 18 }}>
              <span className="mark">M</span> MediBook
            </span>
          </div>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            {appointment.branchName || 'MediBook Clinic'}
            <br />
            GSTIN: {payment.gstNumber}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 750 }}>TAX INVOICE</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>
            {payment.invoiceNo}
            <br />
            {formatDateTime(payment.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
        <div>
          <div className="tiny muted">Billed to</div>
          <div className="cell-strong">{appointment.patientName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tiny muted">Payment</div>
          <div className="cell-strong">{titleCase(payment.method)} · {payment.status.toUpperCase()}</div>
          <div className="tiny muted mono">{payment.txnId}</div>
        </div>
      </div>

      <table className="rx-meds">
        <thead>
          <tr>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Consultation — {appointment.doctorName}
              <div className="tiny muted">{appointment.specialty} · {formatDate(appointment.date)} {appointment.startTime}</div>
            </td>
            <td style={{ textAlign: 'right' }}>{currency(payment.fee)}</td>
          </tr>
          {payment.emergencySurcharge > 0 && (
            <tr>
              <td>Emergency priority surcharge</td>
              <td style={{ textAlign: 'right' }}>{currency(payment.emergencySurcharge)}</td>
            </tr>
          )}
          <tr>
            <td>GST @ {Math.round(payment.gstRate * 100)}%</td>
            <td style={{ textAlign: 'right' }}>{currency(payment.gst)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 750 }}>Total paid</td>
            <td style={{ textAlign: 'right', fontWeight: 750 }}>{currency(payment.total)}</td>
          </tr>
        </tbody>
      </table>

      <p className="tiny muted" style={{ marginTop: 20 }}>
        This is a computer-generated invoice. Consultation fees are non-refundable as per the cancellation policy.
      </p>
    </div>
  );
}
