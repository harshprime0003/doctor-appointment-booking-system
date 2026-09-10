import { useEffect, useState } from 'react';
import { PrescriptionApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, StatusBadge } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PrescriptionSheet from '../components/PrescriptionSheet.jsx';
import SpecialtyChip from '../components/SpecialtyChip.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate } from '../utils/format.js';

export default function Prescriptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);

  useEffect(() => {
    PrescriptionApi.list().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Prescriptions' }]} />
      <PageHeader title="Prescriptions" subtitle="Digital prescriptions issued by your doctors." />

      <Section flush>
        <DataTable
          loading={loading}
          rows={data}
          empty={<div className="empty-state"><div className="es-icon"><Icon name="pill" size={22} /></div><h3>No prescriptions yet</h3><p className="muted">Prescriptions from completed visits will appear here.</p></div>}
          columns={[
            { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
            { key: 'doctorName', header: 'Doctor', render: (r) => <div><div className="cell-strong">{r.doctorName}</div><div style={{ marginTop: 3 }}><SpecialtyChip specialty={r.specialty} /></div></div> },
            { key: 'diagnosis', header: 'Diagnosis', render: (r) => <span className="cell-muted">{r.diagnosis || '—'}</span> },
            { key: 'meds', header: 'Medicines', align: 'right', className: 'num', render: (r) => (r.medicines || []).length },
            { key: 'actions', header: '', render: (r) => <div className="row-actions"><Button size="sm" onClick={() => setView(r)} icon="fileText">View</Button></div> },
          ]}
        />
      </Section>

      {view && (
        <Modal
          title="Prescription"
          size="lg"
          onClose={() => setView(null)}
          footer={<><Button variant="ghost" onClick={() => setView(null)}>Close</Button><Button variant="primary" icon="printer" onClick={() => window.print()}>Print / Save PDF</Button></>}
        >
          <PrescriptionSheet rx={view} />
        </Modal>
      )}
    </div>
  );
}
