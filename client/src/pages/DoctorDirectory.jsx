import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DoctorApi, MetaApi } from '../api/endpoints.js';
import Breadcrumbs, { PageHeader } from '../components/Breadcrumbs.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { Section, Input, Select, Button, Loading, EmptyState, Stars, Pagination, Avatar } from '../components/ui.jsx';
import SpecialtyChip from '../components/SpecialtyChip.jsx';
import Icon from '../components/Icon.jsx';
import { currency } from '../utils/format.js';
import { doctorAvatar } from '../utils/doctor.js';

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function DoctorDirectory() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [meta, setMeta] = useState({ specialties: [], languages: [], insurances: [], branches: [] });
  const [filters, setFilters] = useState({ search: '', specialty: searchParams.get('specialty') || '', city: '', gender: '', language: '', insurance: '', maxFee: '', minRating: '', sort: 'rating' });
  const debouncedSearch = useDebounced(filters.search);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MetaApi.get().then(setMeta).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 9, sort: filters.sort };
      if (debouncedSearch) params.search = debouncedSearch;
      ['specialty', 'city', 'gender', 'language', 'insurance', 'maxFee', 'minRating'].forEach((k) => {
        if (filters[k]) params[k] = filters[k];
      });
      setResult(await DoctorApi.list(params));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filters.specialty, filters.city, filters.gender, filters.language, filters.insurance, filters.maxFee, filters.minRating, filters.sort]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/app' }, { label: t('nav.findDoctor') }]} />
      <PageHeader
        title={t('nav.findDoctor')}
        subtitle={t('page.findDoctorSub')}
        actions={
          <Link to="/app/symptom-checker" className="btn btn-accent">
            <Icon name="activity" size={15} /> {t('nav.symptomChecker')}
          </Link>
        }
      />

      <Section flush>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={15} />
            <Input placeholder="Search name, disease, symptom, hospital…" value={filters.search} onChange={set('search')} />
          </div>
          <Select value={filters.specialty} onChange={set('specialty')}>
            <option value="">{t('filter.allSpecialties')}</option>
            {meta.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.gender} onChange={set('gender')}>
            <option value="">{t('filter.anyGender')}</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </Select>
          <Select value={filters.language} onChange={set('language')}>
            <option value="">{t('filter.anyLanguage')}</option>
            {meta.languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
          <span className="toolbar-spacer" />
          <Select value={filters.sort} onChange={set('sort')}>
            <option value="rating">Top rated</option>
            <option value="experience">Most experienced</option>
            <option value="fee_asc">Fee: low to high</option>
            <option value="fee_desc">Fee: high to low</option>
            <option value="name">Name (A–Z)</option>
          </Select>
        </div>
        <div className="toolbar" style={{ borderBottom: '1px solid var(--border)' }}>
          <Select value={filters.insurance} onChange={set('insurance')}>
            <option value="">Any insurance</option>
            {meta.insurances.filter((i) => i !== 'None').map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
          <Select value={filters.maxFee} onChange={set('maxFee')}>
            <option value="">Any fee</option>
            <option value="500">Up to ₹500</option>
            <option value="800">Up to ₹800</option>
            <option value="1200">Up to ₹1,200</option>
          </Select>
          <Select value={filters.minRating} onChange={set('minRating')}>
            <option value="">Any rating</option>
            <option value="4">4★ &amp; above</option>
            <option value="4.5">4.5★ &amp; above</option>
          </Select>
          <Input placeholder="City" value={filters.city} onChange={set('city')} style={{ width: 160 }} />
        </div>

        <div className="section-body">
          {loading ? (
            <Loading />
          ) : result.data.length === 0 ? (
            <EmptyState icon="stethoscope" title="No doctors match your filters" message="Try broadening your search criteria." />
          ) : (
            <div className="doctor-list">
              {result.data.map((doc) => (
                <div className="doctor-card v2" key={doc.id}>
                  <div className="dc-banner" />
                  <div className="dc-head">
                    <img className="dc-photo" src={doctorAvatar(doc)} alt={doc.name} />
                    <span className="dc-avail"><span className="dot" /> Available</span>
                  </div>
                  <div className="dc-body">
                    <div className="cell-strong" style={{ fontSize: 15 }}>{doc.name}</div>
                    <div style={{ margin: '6px 0' }}><SpecialtyChip specialty={doc.specialty} /></div>
                    <Stars value={doc.rating} count={doc.ratingCount} size={13} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
                      <div className="meta-row"><Icon name="briefcase" size={13} /> {doc.experienceYears} yrs exp{typeof doc.successRate === 'number' ? ` · ${doc.successRate}% success` : ''}</div>
                      {doc.city && <div className="meta-row"><Icon name="mapPin" size={13} /> {doc.city}{doc.hospital ? ` · ${doc.hospital}` : ''}</div>}
                      {doc.languages?.length > 0 && <div className="meta-row"><Icon name="globe" size={13} /> {doc.languages.join(', ')}</div>}
                    </div>
                  </div>
                  <div className="foot">
                    <div>
                      <div className="tiny muted">Consultation</div>
                      <div className="cell-strong">{currency(doc.consultationFee)}</div>
                    </div>
                    <Link to={`/app/doctors/${doc.id}`} className="btn btn-primary btn-sm">View &amp; Book</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Pagination pagination={result.pagination} onChange={setPage} />
      </Section>
    </div>
  );
}
