import { useEffect, useState } from 'react';
import { DoctorApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Avatar } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { Input } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate } from '../utils/format.js';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    DoctorApi.myPatients()
      .then((res) => setPatients(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => p.patientName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Patients' }]} />
      <PageHeader title="Patients" subtitle="Everyone who has booked an appointment with you." />
      <Section flush>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={15} />
            <Input placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable
          loading={loading}
          rows={filtered}
          rowKey="patientId"
          columns={[
            {
              key: 'name',
              header: 'Patient',
              render: (r) => (
                <div className="user-cell">
                  <Avatar name={r.patientName} />
                  <span className="name">{r.patientName}</span>
                </div>
              ),
            },
            { key: 'visits', header: 'Visits', align: 'right', className: 'num', render: (r) => r.visits },
            { key: 'lastVisit', header: 'Last visit', render: (r) => formatDate(r.lastVisit) },
          ]}
        />
      </Section>
    </div>
  );
}
