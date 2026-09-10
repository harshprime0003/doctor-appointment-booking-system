import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SymptomApi, MetaApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { Section, Button, Textarea, Loading, Alert, Avatar, Stars } from '../components/ui.jsx';
import SpecialtyChip from '../components/SpecialtyChip.jsx';
import Icon from '../components/Icon.jsx';
import { titleCase, currency } from '../utils/format.js';
import { doctorAvatar } from '../utils/doctor.js';

const COMMON = ['fever', 'headache', 'cough', 'cold', 'sore throat', 'body ache', 'fatigue', 'chest pain', 'shortness of breath', 'abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'acidity', 'skin rash', 'itching', 'joint pain', 'back pain', 'dizziness', 'anxiety', 'insomnia', 'blurred vision', 'toothache', 'ear pain'];

const URGENCY_LABEL = { low: 'Low urgency', medium: 'Moderate urgency', high: 'High urgency', emergency: 'Emergency' };

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  const toggle = (s) => setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const analyze = async () => {
    const symptoms = [...selected];
    if (text.trim()) symptoms.push(text.trim());
    if (symptoms.length === 0) return;
    setLoading(true);
    setRecs(null);
    try {
      setResult(await SymptomApi.check({ symptoms }));
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (specialty) => {
    setRecLoading(true);
    try {
      const res = await SymptomApi.recommend({ specialty });
      setRecs(res.recommendations);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: 'Symptom Checker' }]} />
      <PageHeader title="AI Symptom Checker" subtitle="Describe how you feel and get an instant triage suggestion." />

      <Alert variant="info">
        This is an automated triage aid, not a medical diagnosis. In an emergency, call your local emergency number immediately.
      </Alert>

      <div className="grid-2">
        <Section title="Select your symptoms">
          <div className="symptom-pills">
            {COMMON.map((s) => (
              <span key={s} className={`symptom-pill${selected.includes(s) ? ' selected' : ''}`} onClick={() => toggle(s)}>
                {selected.includes(s) && <Icon name="check" size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                {s}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="field-label">Or describe in your own words</label>
            <Textarea placeholder="e.g. I have a fever with headache and a dry cough since yesterday" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <Button variant="primary" className="btn-block btn-lg" style={{ marginTop: 12 }} onClick={analyze} disabled={loading || (selected.length === 0 && !text.trim())}>
            <Icon name="activity" size={16} /> {loading ? 'Analysing…' : 'Analyse symptoms'}
          </Button>
        </Section>

        <div>
          {!result && !loading && (
            <Section title="How it works">
              <ol className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                <li>Pick the symptoms you're experiencing.</li>
                <li>Our engine matches them to likely conditions.</li>
                <li>Get a recommended specialist and urgency level.</li>
                <li>Book the best-matched doctor in one click.</li>
              </ol>
            </Section>
          )}
          {loading && <Section title="Analysing"><Loading label="Evaluating your symptoms…" /></Section>}

          {result && (
            <>
              <div className={`urgency-banner urgency-${result.urgency}`}>
                <Icon name={result.emergency ? 'zap' : 'alert'} size={22} />
                <div>
                  <div style={{ fontWeight: 750 }}>{URGENCY_LABEL[result.urgency]}</div>
                  <div className="tiny">
                    {result.emergency ? 'Seek emergency care immediately.' : `Recommended specialist: ${result.recommendedSpecialty}`}
                  </div>
                </div>
              </div>

              <Section title="Possible conditions" flush>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.conditions.length === 0 && <p className="muted" style={{ margin: 0 }}>No specific match. Consult a General Physician.</p>}
                  {result.conditions.map((c) => (
                    <div className="condition-card" key={c.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div className="cell-strong">{c.name}</div>
                        <SpecialtyChip specialty={c.specialist} />
                      </div>
                      <div className="tiny muted" style={{ marginTop: 4 }}>
                        Matches: {c.matchedSymptoms.join(', ')} · {URGENCY_LABEL[c.urgency]}
                      </div>
                      <div className="confidence-bar"><span style={{ width: `${c.confidence}%` }} /></div>
                      <div className="tiny muted" style={{ marginTop: 3 }}>{c.confidence}% match confidence</div>
                    </div>
                  ))}
                </div>
              </Section>

              {result.homeCare?.length > 0 && (
                <Section title="Home care suggestions">
                  <ul className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                    {result.homeCare.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </Section>
              )}

              <Section title="Recommended next step" flush>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="primary" onClick={() => navigate(`/app/doctors?specialty=${encodeURIComponent(result.recommendedSpecialty)}`)}>
                      <Icon name="stethoscope" size={15} /> Find {result.recommendedSpecialty}
                    </Button>
                    <Button variant="accent" onClick={() => getRecommendations(result.recommendedSpecialty)} disabled={recLoading}>
                      <Icon name="star" size={15} /> {recLoading ? 'Finding…' : 'AI recommend a doctor'}
                    </Button>
                  </div>

                  {recs && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {recs.length === 0 && <p className="muted">No active doctors found for this specialty yet.</p>}
                      {recs.map((r) => (
                        <div className="queue-item" key={r.doctor.id}>
                          <Avatar name={r.doctor.name} src={doctorAvatar(r.doctor)} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="cell-strong">{r.doctor.name}</div>
                            <div className="tiny muted">{r.reasons.join(' · ') || r.doctor.specialty}</div>
                            <div style={{ marginTop: 2 }}><Stars value={r.doctor.rating} size={12} /> <span className="tiny muted">· {currency(r.doctor.consultationFee)}</span></div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="badge badge-primary">Match {r.score}</div>
                            <div style={{ marginTop: 6 }}>
                              <Button size="sm" variant="primary" onClick={() => navigate(`/app/doctors/${r.doctor.id}`)}>Book</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
