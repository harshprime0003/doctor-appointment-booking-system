import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { Button, Loading, Alert } from './ui.jsx';
import Icon from './Icon.jsx';
import { PaymentApi } from '../api/endpoints.js';
import { currency } from '../utils/format.js';

const METHODS = [
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: 'zap' },
  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: 'creditCard' },
  { id: 'netbanking', label: 'Net Banking', sub: 'All major banks', icon: 'building' },
  { id: 'wallet', label: 'Wallet', sub: 'Paytm, Amazon Pay', icon: 'dollar' },
];

// Razorpay-style checkout (dummy). Collects a method and simulates a payment,
// then hands control back so the caller can create the booking.
export default function PaymentModal({ doctorId, type, onClose, onPaid }) {
  const [quote, setQuote] = useState(null);
  const [method, setMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    PaymentApi.quote({ doctorId, type })
      .then((q) => active && setQuote(q))
      .catch((err) => active && setError(err.message || 'Could not load payment details'));
    return () => {
      active = false;
    };
  }, [doctorId, type]);

  const pay = async () => {
    setProcessing(true);
    // Simulate gateway latency for a realistic demo.
    await new Promise((r) => setTimeout(r, 900));
    onPaid(method);
  };

  return (
    <Modal title="" onClose={onClose}>
      <div className="pay-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon name="shield" size={18} />
          <div>
            <div style={{ fontWeight: 700 }}>MediPay Secure</div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Test mode · no real charge</div>
          </div>
        </div>
        {quote && <div className="pay-amount">{currency(quote.total)}</div>}
      </div>

      {error ? (
        <>
          <Alert variant="error">{error}</Alert>
          <Button className="btn-block" onClick={onClose}>Close</Button>
        </>
      ) : !quote ? (
        <Loading />
      ) : (
        <>
          <div className="pay-breakdown">
            <div className="pay-row"><span>Consultation fee</span><span>{currency(quote.fee)}</span></div>
            {quote.emergencySurcharge > 0 && (
              <div className="pay-row"><span>Emergency priority</span><span>{currency(quote.emergencySurcharge)}</span></div>
            )}
            <div className="pay-row"><span>GST ({Math.round(quote.gstRate * 100)}%)</span><span>{currency(quote.gst)}</span></div>
            <div className="pay-row total"><span>Total payable</span><span>{currency(quote.total)}</span></div>
          </div>

          <div className="field-label">Select payment method</div>
          <div className="pay-methods">
            {METHODS.map((m) => (
              <div
                key={m.id}
                className={`pay-method${method === m.id ? ' selected' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                <span className="pm-icon"><Icon name={m.icon} size={18} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 650 }}>{m.label}</div>
                  <div className="tiny muted">{m.sub}</div>
                </div>
                {method === m.id && <Icon name="checkCircle" size={18} style={{ color: 'var(--primary)' }} />}
              </div>
            ))}
          </div>

          <Button variant="primary" className="btn-block btn-lg" style={{ marginTop: 18 }} onClick={pay} disabled={processing}>
            {processing ? 'Processing payment…' : `Pay ${currency(quote.total)}`}
          </Button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
            By paying you agree to the cancellation policy. Consultation fees are non-refundable.
          </p>
        </>
      )}
    </Modal>
  );
}
