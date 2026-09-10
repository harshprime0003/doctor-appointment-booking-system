import { useEffect, useState, useCallback } from 'react';
import { AdminApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Input, Select, Pagination, Badge, Avatar } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icon.jsx';
import { formatDateTime, titleCase } from '../utils/format.js';

export default function AdminAudit() {
  const [filters, setFilters] = useState({ search: '', entity: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.entity) params.entity = filters.entity;
      setResult(await AdminApi.auditLogs(params));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Audit Logs' }]} />
      <PageHeader title="Audit logs" subtitle="A complete trail of who changed what, and when." />
      <Section flush>
        <div className="toolbar">
          <div className="search"><Icon name="search" size={15} /><Input placeholder="Search actor or action" value={filters.search} onChange={set('search')} /></div>
          <Select value={filters.entity} onChange={set('entity')}>
            <option value="">All entities</option>
            <option value="appointment">Appointment</option>
            <option value="doctor">Doctor</option>
            <option value="branch">Branch</option>
            <option value="leave">Leave</option>
            <option value="prescription">Prescription</option>
            <option value="record">Record</option>
          </Select>
        </div>
        <DataTable
          loading={loading}
          rows={result.data}
          empty={<div className="empty-state"><h3>No activity yet</h3></div>}
          columns={[
            { key: 'when', header: 'When', render: (r) => formatDateTime(r.createdAt) },
            { key: 'actor', header: 'Actor', render: (r) => <div className="user-cell"><Avatar name={r.actorName} /><div><div className="name">{r.actorName}</div><div className="sub">{titleCase(r.actorRole || 'system')}</div></div></div> },
            { key: 'action', header: 'Action', render: (r) => <span className="mono">{r.action}</span> },
            { key: 'entity', header: 'Entity', render: (r) => <Badge variant="neutral">{titleCase(r.entity || '—')}</Badge> },
            { key: 'entityId', header: 'Ref', render: (r) => <span className="tiny mono muted">{r.entityId ? r.entityId.slice(0, 8) : '—'}</span> },
          ]}
        />
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>
    </div>
  );
}
