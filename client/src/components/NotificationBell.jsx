import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { NotificationApi } from '../api/endpoints.js';
import { formatDateTime } from '../utils/format.js';

const COLOR = { indigo: 'si-indigo', teal: 'si-teal', rose: 'si-rose', sky: 'si-sky', amber: 'si-amber' };

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const load = useCallback(() => {
    NotificationApi.list()
      .then((r) => { setItems(r.data || []); setCount(r.unread || 0); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (link) => {
    setOpen(false);
    navigate(link || '/app/notifications');
  };

  const markAll = async () => {
    try {
      await NotificationApi.markAllRead();
      setCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="menu" ref={ref}>
      <button className="btn btn-ghost bell-btn" onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-label="Notifications">
        <Icon name="bell" size={18} />
        {count > 0 && <span className="bell-dot">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="menu-panel" style={{ width: 340, maxHeight: 420, overflowY: 'auto', padding: 0 }}>
          <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
            <strong>Notifications</strong>
            {count > 0 ? (
              <button className="btn btn-ghost btn-sm" style={{ height: 24 }} onClick={markAll}>Mark all read</button>
            ) : (
              <span className="badge badge-neutral">All read</span>
            )}
          </div>
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div className="es-icon"><Icon name="bell" size={20} /></div>
              <p className="muted tiny" style={{ margin: 0 }}>You're all caught up.</p>
            </div>
          ) : (
            <div style={{ padding: 6 }}>
              {items.slice(0, 8).map((n) => (
                <button key={n.id} className="notif-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }} onClick={() => go(n.link)}>
                  <span className={`notif-ico ${COLOR[n.color] || 'si-slate'}`}><Icon name={n.icon} size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{n.title}</div>
                    <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.text}</div>
                    {n.time && <div className="tiny muted" style={{ marginTop: 2 }}>{formatDateTime(n.time)}</div>}
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, alignSelf: 'center' }} />}
                </button>
              ))}
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', padding: 8 }}>
            <button className="btn btn-ghost btn-block btn-sm" onClick={() => go('/app/notifications')}>View all notifications</button>
          </div>
        </div>
      )}
    </div>
  );
}
