import { GST_RATE, EMERGENCY_SURCHARGE, APPOINTMENT_TYPE } from './constants.js';

export function computeCharges(baseFee, type = APPOINTMENT_TYPE.REGULAR) {
  const fee = Number(baseFee) || 0;
  const emergencySurcharge = type === APPOINTMENT_TYPE.EMERGENCY ? EMERGENCY_SURCHARGE : 0;
  const subtotal = fee + emergencySurcharge;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  return { fee, emergencySurcharge, subtotal, gstRate: GST_RATE, gst, total };
}

export function makeInvoiceNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${ymd}-${rand}`;
}

export function makeTxnId() {
  return `pay_${Math.random().toString(36).slice(2, 12)}`;
}
