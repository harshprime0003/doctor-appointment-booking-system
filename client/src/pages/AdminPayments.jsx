import { useEffect, useState, useCallback } from 'react';
import { AdminApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Pagination, StatCard, Badge } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icon.jsx';
import { currency, formatDateTime, titleCase } from '../utils/format.js';

export default function AdminPayments() {
  const [filters, setFilters] = useState({ search: '', method: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null, summary: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.method) params.method = filters.method;
      setResult(await AdminApi.payments(params));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const s = result.summary || { totalCollected: 0, totalGst: 0, count: 0, todayCollected: 0 };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Payments' }]} />
      <PageHeader title="Payments & Revenue" subtitle="All transactions collected across the clinic." />

      <div className="stat-grid">
        <StatCard label="Total collected" value={currency(s.totalCollected)} icon="dollar" color="emerald" />
        <StatCard label="Collected today" value={currency(s.todayCollected)} icon="trendingUp" color="teal" />
        <StatCard label="GST collected" value={currency(s.totalGst)} icon="fileText" color="amber" />
        <StatCard label="Transactions" value={s.count} icon="creditCard" color="indigo" />
      </div>

      <Section flush>
        <div className="toolbar">
          <div className="search"><Icon name="search" size={15} /><Input placeholder="Search patient, doctor or invoice" value={filters.search} onChange={set('search')} /></div>
          <Select value={filters.method} onChange={set('method')}>
            <option value="">All methods</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
          </Select>
        </div>
        <DataTable
          loading={loading}
          rows={result.data}
          empty={<div className="empty-state"><div className="es-icon"><Icon name="dollar" size={22} /></div><h3>No payments yet</h3></div>}
          columns={[
            { key: 'invoiceNo', header: 'Invoice', render: (r) => <span className="mono">{r.invoiceNo}</span> },
            { key: 'when', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
            { key: 'patientName', header: 'Patient', className: 'cell-strong' },
            { key: 'doctorName', header: 'Doctor', render: (r) => <span className="cell-muted">{r.doctorName}</span> },
            { key: 'method', header: 'Method', render: (r) => <Badge variant="neutral">{titleCase(r.method)}</Badge> },
            { key: 'gst', header: 'GST', align: 'right', className: 'num', render: (r) => currency(r.gst) },
            { key: 'total', header: 'Amount', align: 'right', className: 'num', render: (r) => <span className="cell-strong">{currency(r.total)}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{titleCase(r.status)}</Badge> },
          ]}
        />
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>
    </div>
  );
}
