import Icon from './Icon.jsx';

const STEPS = [
  { key: 'booked', label: 'Booked', icon: 'calendar' },
  { key: 'waiting', label: 'Checked in', icon: 'clock' },
  { key: 'called', label: 'Called', icon: 'bell' },
  { key: 'in_consultation', label: 'In consultation', icon: 'stethoscope' },
  { key: 'completed', label: 'Completed', icon: 'check' },
];

export default function TrackTimeline({ trackStatus }) {
  if (trackStatus === 'cancelled') {
    return (
      <div className="alert alert-warning" style={{ marginBottom: 0 }}>
        <Icon name="x" size={16} /> This appointment was cancelled.
      </div>
    );
  }
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.key === trackStatus));
  return (
    <div className="track">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : '';
        return (
          <div className={`track-step ${state}`} key={step.key}>
            <span className="dot">
              <Icon name={i < currentIndex ? 'check' : step.icon} size={13} />
            </span>
            <span className="lbl">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
