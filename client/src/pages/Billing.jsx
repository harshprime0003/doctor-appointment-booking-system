import { useEffect, useState } from 'react';
import { PaymentApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, StatCard, Badge, Button } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import InvoiceSheet from '../components/InvoiceSheet.jsx';
import Icon from '../components/Icon.jsx';
import { currency, formatDateTime, titleCase } from '../utils/format.js';

export default function Billing() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalSpent: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    PaymentApi.mine().then((r) => { setData(r.data); setSummary(r.summary); }).finally(() => setLoading(false));
  }, []);

  const openInvoice = async (p) => {
    if (!p.appointmentId) return toast.error('Invoice unavailable');
    try { setInvoice(await PaymentApi.invoice(p.appointmentId)); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Billing & Wallet' }]} />
      <PageHeader title="Billing & Wallet" subtitle="Your payment history and downloadable GST invoices." />

      <div className="stat-grid">
        <StatCard label="Total spent" value={currency(summary.totalSpent)} icon="dollar" color="emerald" />
        <StatCard label="Transactions" value={summary.count} icon="creditCard" color="indigo" />
        <StatCard label="Last payment" value={summary.lastPayment ? currency(summary.lastPayment.total) : '—'} icon="clock" color="amber" meta={summary.lastPayment ? titleCase(summary.lastPayment.method) : ''} />
        <StatCard label="Invoices" value={summary.count} icon="fileText" color="sky" />
      </div>

      <Section title="Payment history" flush>
        <DataTable
          loading={loading}
          rows={data}
          empty={<div className="empty-state"><div className="es-icon"><Icon name="creditCard" size={22} /></div><h3>No payments yet</h3><p className="muted">Your consultation payments will appear here.</p></div>}
          columns={[
            { key: 'invoiceNo', header: 'Invoice', render: (r) => <span className="mono">{r.invoiceNo}</span> },
            { key: 'when', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
            { key: 'doctorName', header: 'Doctor', className: 'cell-strong' },
            { key: 'method', header: 'Method', render: (r) => <Badge variant="neutral">{titleCase(r.method)}</Badge> },
            { key: 'total', header: 'Amount', align: 'right', className: 'num', render: (r) => <span className="cell-strong">{currency(r.total)}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{titleCase(r.status)}</Badge> },
            { key: 'actions', header: '', render: (r) => <div className="row-actions"><Button size="sm" icon="fileText" onClick={() => openInvoice(r)}>Invoice</Button></div> },
          ]}
        />
      </Section>

      {invoice && (
        <Modal title="Tax Invoice" size="lg" onClose={() => setInvoice(null)} footer={<><Button variant="ghost" onClick={() => setInvoice(null)}>Close</Button><Button variant="primary" icon="printer" onClick={() => window.print()}>Print / Save PDF</Button></>}>
          <InvoiceSheet appointment={invoice.appointment} payment={invoice.payment} />
        </Modal>
      )}
    </div>
  );
}
