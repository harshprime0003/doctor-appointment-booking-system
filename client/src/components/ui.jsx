import Icon from './Icon.jsx';
import { statusBadgeClass, titleCase, initials } from '../utils/format.js';
import { useI18n } from '../context/I18nContext.jsx';

export function Button({ variant = 'default', size, icon, children, className = '', ...props }) {
  const cls = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'danger' && 'btn-danger',
    variant === 'ghost' && 'btn-ghost',
    size === 'sm' && 'btn-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...props}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}
      {children}
    </button>
  );
}

export function Badge({ variant = 'neutral', children, dot }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  const dot = ['pending', 'confirmed', 'active'].includes(status);
  return (
    <span className={`badge ${statusBadgeClass(status)}`}>
      {dot && <span className="dot" />}
      {t(`status.${status}`)}
    </span>
  );
}

export function Avatar({ name, src, size = 'md' }) {
  const cls = `avatar${size === 'lg' ? ' avatar-lg' : size === 'xl' ? ' avatar-xl' : ''}`;
  return <span className={cls}>{src ? <img src={src} alt={name || ''} loading="lazy" /> : initials(name) || '?'}</span>;
}

export function Field({ label, optional, hint, error, children, full }) {
  return (
    <div className={`field${full ? ' full' : ''}`}>
      {label && (
        <label className="field-label">
          {label} {optional && <span className="optional">(optional)</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export function Input({ error, ...props }) {
  return <input className={`input${error ? ' has-error' : ''}`} {...props} />;
}

export function Select({ error, children, ...props }) {
  return (
    <select className={`select${error ? ' has-error' : ''}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Spinner() {
  return <span className="spinner" />;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-block">
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon = 'list' }) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon name={icon} size={22} />
      </div>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

const ALERT_ICON = { info: 'alert', success: 'checkCircle', warning: 'alert', error: 'alert' };
export function Alert({ variant = 'info', children }) {
  return (
    <div className={`alert alert-${variant}`}>
      <Icon name={ALERT_ICON[variant]} size={16} />
      <div>{children}</div>
    </div>
  );
}

export function Section({ title, actions, children, flush }) {
  return (
    <section className="section">
      {(title || actions) && (
        <div className="section-head">
          <h3>{title}</h3>
          {actions}
        </div>
      )}
      <div className={`section-body${flush ? ' flush' : ''}`}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, meta, icon, color = 'teal' }) {
  return (
    <div className="stat-card">
      {icon && (
        <div className={`stat-icon si-${color}`}>
          <Icon name={icon} size={20} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        {meta && <div className="meta">{meta}</div>}
      </div>
    </div>
  );
}

export function Stars({ value = 0, count, size = 14, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={`stars${onChange ? ' input' : ''}`}>
      {stars.map((s) => (
        <Icon
          key={s}
          name="star"
          size={size}
          style={{ color: s <= Math.round(value) ? '#d97706' : '#d1d5db' }}
          onClick={onChange ? () => onChange(s) : undefined}
        />
      ))}
      {count != null && <span className="muted tiny" style={{ marginLeft: 4 }}>({count})</span>}
    </span>
  );
}

export function Pagination({ pagination, onChange }) {
  const { t } = useI18n();
  if (!pagination) return null;
  const { page, totalPages, total, pageSize } = pagination;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="pagination">
      <span>
        {t('common.showing')} <strong>{start}</strong>–<strong>{end}</strong> {t('common.of')} <strong>{total}</strong>
      </span>
      <div className="pager">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} icon="chevronLeft">
          {t('common.prev')}
        </Button>
        <span className="tiny muted">
          {t('common.page')} {page} / {totalPages}
        </span>
        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          {t('common.next')}
          <Icon name="chevronRight" size={14} />
        </Button>
      </div>
    </div>
  );
}
