import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Loading, EmptyState, Button } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { formatDateTime } from '../utils/format.js';

const COLOR = { indigo: 'si-indigo', teal: 'si-teal', rose: 'si-rose', sky: 'si-sky', amber: 'si-amber' };

export default function Notifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    NotificationApi.list().then((r) => { setItems(r.data); setUnread(r.unread); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markAll = async () => {
    try {
      await NotificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Notifications' }]} />
      <PageHeader
        title="Notifications"
        subtitle="Reminders and updates about your care."
        actions={unread > 0 ? <Button icon="checkCircle" onClick={markAll}>Mark all as read</Button> : null}
      />
      <Section flush>
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState icon="bell" title="You're all caught up" message="New reminders and updates will appear here." />
        ) : (
          <div style={{ padding: 8 }}>
            {items.map((n) => (
              <div className="notif-item" key={n.id} onClick={() => n.link && navigate(n.link)} style={!n.read ? { background: 'var(--primary-soft)' } : undefined}>
                <span className={`notif-ico ${COLOR[n.color] || 'si-slate'}`}><Icon name={n.icon} size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{n.title} {!n.read && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', marginLeft: 4, verticalAlign: 'middle' }} />}</div>
                  <div className="tiny muted">{n.text}</div>
                </div>
                <span className="tiny muted" style={{ whiteSpace: 'nowrap' }}>{n.time ? formatDateTime(n.time) : ''}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
