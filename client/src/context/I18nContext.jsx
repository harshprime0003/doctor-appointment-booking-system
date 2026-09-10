import { createContext, useContext, useState, useCallback } from 'react';

const DICT = {
  en: {
    // nav
    'nav.dashboard': 'Dashboard', 'nav.findDoctor': 'Find a Doctor', 'nav.symptomChecker': 'Symptom Checker',
    'nav.appointments': 'Appointments', 'nav.myAppointments': 'My Appointments', 'nav.records': 'Health Records',
    'nav.prescriptions': 'Prescriptions', 'nav.patients': 'Patients', 'nav.availability': 'Availability',
    'nav.leaves': 'My Leaves', 'nav.publicProfile': 'Public Profile', 'nav.queue': 'Live Queue',
    'nav.doctors': 'Doctors', 'nav.users': 'Users', 'nav.branches': 'Branches', 'nav.staff': 'Staff',
    'nav.audit': 'Audit Logs', 'nav.leaveRequests': 'Leave Requests', 'nav.profile': 'Profile',
    'nav.account': 'Account', 'nav.payments': 'Payments',
    'nav.vitals': 'Vitals Tracker', 'nav.billing': 'Billing & Wallet', 'nav.notifications': 'Notifications', 'nav.tips': 'Health Tips',
    'nav.labTests': 'Lab Tests', 'nav.pharmacy': 'Pharmacy', 'nav.support': 'Help & Support', 'section.services': 'Services',
    // sections
    'section.overview': 'Overview', 'section.management': 'Management', 'section.practice': 'Practice',
    'section.health': 'My Health',
    // greetings
    'greeting.patient': 'Patient workspace', 'greeting.doctor': 'Doctor workspace',
    'greeting.admin': 'Administrator workspace', 'greeting.receptionist': 'Reception desk',
    // common
    'common.signIn': 'Sign in', 'common.signOut': 'Sign out', 'common.book': 'Book appointment',
    'common.search': 'Search', 'common.viewAll': 'View all', 'common.today': 'Today',
    'common.yesterday': 'Yesterday', 'common.tomorrow': 'Tomorrow', 'common.save': 'Save',
    'common.cancel': 'Cancel', 'common.close': 'Close', 'common.edit': 'Edit', 'common.view': 'View',
    'common.update': 'Update', 'common.add': 'Add', 'common.clear': 'Clear', 'common.approve': 'Approve',
    'common.reject': 'Reject', 'common.all': 'All', 'common.from': 'From', 'common.to': 'To',
    'common.loading': 'Loading…', 'common.noRecords': 'No records found', 'common.tryAdjust': 'Try adjusting your filters or search.',
    'common.showing': 'Showing', 'common.of': 'of', 'common.page': 'Page', 'common.prev': 'Prev', 'common.next': 'Next',
    'common.print': 'Print / Save PDF', 'common.review': 'Review',
    // statuses
    'status.pending': 'Pending', 'status.confirmed': 'Confirmed', 'status.completed': 'Completed',
    'status.cancelled': 'Cancelled', 'status.no_show': 'No Show', 'status.active': 'Active',
    'status.inactive': 'Inactive', 'status.disabled': 'Disabled', 'status.approved': 'Approved',
    'status.rejected': 'Rejected', 'status.waiting': 'Waiting', 'status.called': 'Called',
    'status.in_consultation': 'In Consultation', 'status.booked': 'Booked', 'status.regular': 'Regular',
    'status.emergency': 'Emergency', 'status.paid': 'Paid',
    // columns
    'col.date': 'Date', 'col.time': 'Time', 'col.doctor': 'Doctor', 'col.patient': 'Patient',
    'col.status': 'Status', 'col.fee': 'Fee', 'col.reason': 'Reason', 'col.specialty': 'Specialty',
    'col.rating': 'Rating', 'col.amount': 'Amount', 'col.method': 'Method', 'col.invoice': 'Invoice',
    'col.type': 'Type', 'col.experience': 'Exp.', 'col.visits': 'Visits', 'col.revenue': 'Revenue',
    'col.role': 'Role', 'col.phone': 'Phone', 'col.joined': 'Joined', 'col.with': 'With',
    'col.gst': 'GST', 'col.user': 'User',
    // filters
    'filter.allStatuses': 'All statuses', 'filter.allSpecialties': 'All specialties',
    'filter.anyGender': 'Any gender', 'filter.anyLanguage': 'Any language', 'filter.anyFee': 'Any fee',
    'filter.anyRating': 'Any rating', 'filter.anyInsurance': 'Any insurance', 'filter.allRoles': 'All roles',
    'filter.allMethods': 'All methods',
    // dashboard
    'dash.totalAppointments': 'Total appointments', 'dash.upcoming': 'Upcoming', 'dash.completed': 'Completed',
    'dash.cancelled': 'Cancelled', 'dash.todaysAppointments': "Today's appointments", 'dash.pendingRequests': 'Pending requests',
    'dash.totalPatients': 'Total patients', 'dash.revenue': 'Revenue (completed)', 'dash.totalRevenue': 'Total revenue (completed)',
    'dash.waitingInQueue': 'Waiting in queue', 'dash.inConsultation': 'In consultation', 'dash.emergenciesToday': 'Emergencies today',
    'dash.activeDoctors': 'Active doctors', 'dash.patients': 'Patients', 'dash.appointments': 'Appointments',
    'dash.upcomingAppointments': 'Upcoming appointments', 'dash.recentActivity': 'Recent activity',
    'dash.todaysSchedule': "Today's schedule", 'dash.recentAppointments': 'Recent appointments',
    'dash.revenueByDay': 'Revenue & appointments by day', 'dash.earned': 'Earned', 'dash.expected': 'Expected',
    'dash.byStatus': 'By status', 'dash.topDoctors': 'Top doctors by revenue', 'dash.last7': 'Appointments · last 7 days',
    'dash.pendingApproval': 'pending approval', 'dash.allApproved': 'All approved',
    // pages
    'page.findDoctorSub': 'Search by name, disease, specialty, city, language, insurance and more.',
    'page.appointmentsSubPatient': 'Track and manage your bookings.',
    'page.appointmentsSubDoctor': 'Review requests and manage your calendar.',
    'page.appointmentsSubAdmin': 'Every appointment across the clinic.',
    'appt.mine': 'My Appointments', 'appt.all': 'All Appointments',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड', 'nav.findDoctor': 'डॉक्टर खोजें', 'nav.symptomChecker': 'लक्षण जाँच',
    'nav.appointments': 'अपॉइंटमेंट', 'nav.myAppointments': 'मेरे अपॉइंटमेंट', 'nav.records': 'स्वास्थ्य रिकॉर्ड',
    'nav.prescriptions': 'नुस्खे', 'nav.patients': 'मरीज़', 'nav.availability': 'उपलब्धता',
    'nav.leaves': 'मेरी छुट्टियाँ', 'nav.publicProfile': 'सार्वजनिक प्रोफ़ाइल', 'nav.queue': 'लाइव कतार',
    'nav.doctors': 'डॉक्टर', 'nav.users': 'उपयोगकर्ता', 'nav.branches': 'शाखाएँ', 'nav.staff': 'स्टाफ',
    'nav.audit': 'ऑडिट लॉग', 'nav.leaveRequests': 'छुट्टी अनुरोध', 'nav.profile': 'प्रोफ़ाइल',
    'nav.account': 'खाता', 'nav.payments': 'भुगतान',
    'nav.vitals': 'वाइटल ट्रैकर', 'nav.billing': 'बिलिंग और वॉलेट', 'nav.notifications': 'सूचनाएँ', 'nav.tips': 'स्वास्थ्य सुझाव',
    'nav.labTests': 'लैब टेस्ट', 'nav.pharmacy': 'फार्मेसी', 'nav.support': 'सहायता', 'section.services': 'सेवाएँ',
    'section.overview': 'अवलोकन', 'section.management': 'प्रबंधन', 'section.practice': 'प्रैक्टिस',
    'section.health': 'मेरा स्वास्थ्य',
    'greeting.patient': 'मरीज़ कार्यक्षेत्र', 'greeting.doctor': 'डॉक्टर कार्यक्षेत्र',
    'greeting.admin': 'प्रशासक कार्यक्षेत्र', 'greeting.receptionist': 'रिसेप्शन डेस्क',
    'common.signIn': 'साइन इन', 'common.signOut': 'साइन आउट', 'common.book': 'अपॉइंटमेंट बुक करें',
    'common.search': 'खोजें', 'common.viewAll': 'सभी देखें', 'common.today': 'आज',
    'common.yesterday': 'कल (बीता)', 'common.tomorrow': 'कल (आने वाला)', 'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें', 'common.close': 'बंद करें', 'common.edit': 'संपादित करें', 'common.view': 'देखें',
    'common.update': 'अपडेट करें', 'common.add': 'जोड़ें', 'common.clear': 'साफ़ करें', 'common.approve': 'स्वीकृत करें',
    'common.reject': 'अस्वीकार करें', 'common.all': 'सभी', 'common.from': 'से', 'common.to': 'तक',
    'common.loading': 'लोड हो रहा है…', 'common.noRecords': 'कोई रिकॉर्ड नहीं मिला', 'common.tryAdjust': 'फ़िल्टर या खोज बदलकर देखें।',
    'common.showing': 'दिखा रहे हैं', 'common.of': 'में से', 'common.page': 'पृष्ठ', 'common.prev': 'पिछला', 'common.next': 'अगला',
    'common.print': 'प्रिंट / PDF सहेजें', 'common.review': 'समीक्षा',
    'status.pending': 'लंबित', 'status.confirmed': 'पुष्ट', 'status.completed': 'पूर्ण',
    'status.cancelled': 'रद्द', 'status.no_show': 'अनुपस्थित', 'status.active': 'सक्रिय',
    'status.inactive': 'निष्क्रिय', 'status.disabled': 'अक्षम', 'status.approved': 'स्वीकृत',
    'status.rejected': 'अस्वीकृत', 'status.waiting': 'प्रतीक्षारत', 'status.called': 'बुलाया गया',
    'status.in_consultation': 'परामर्श में', 'status.booked': 'बुक किया', 'status.regular': 'सामान्य',
    'status.emergency': 'आपातकालीन', 'status.paid': 'भुगतान हुआ',
    'col.date': 'तारीख', 'col.time': 'समय', 'col.doctor': 'डॉक्टर', 'col.patient': 'मरीज़',
    'col.status': 'स्थिति', 'col.fee': 'शुल्क', 'col.reason': 'कारण', 'col.specialty': 'विशेषज्ञता',
    'col.rating': 'रेटिंग', 'col.amount': 'राशि', 'col.method': 'माध्यम', 'col.invoice': 'चालान',
    'col.type': 'प्रकार', 'col.experience': 'अनुभव', 'col.visits': 'विज़िट', 'col.revenue': 'आय',
    'col.role': 'भूमिका', 'col.phone': 'फ़ोन', 'col.joined': 'शामिल हुए', 'col.with': 'किसके साथ',
    'col.gst': 'जीएसटी', 'col.user': 'उपयोगकर्ता',
    'filter.allStatuses': 'सभी स्थितियाँ', 'filter.allSpecialties': 'सभी विशेषज्ञताएँ',
    'filter.anyGender': 'कोई भी लिंग', 'filter.anyLanguage': 'कोई भी भाषा', 'filter.anyFee': 'कोई भी शुल्क',
    'filter.anyRating': 'कोई भी रेटिंग', 'filter.anyInsurance': 'कोई भी बीमा', 'filter.allRoles': 'सभी भूमिकाएँ',
    'filter.allMethods': 'सभी माध्यम',
    'dash.totalAppointments': 'कुल अपॉइंटमेंट', 'dash.upcoming': 'आगामी', 'dash.completed': 'पूर्ण',
    'dash.cancelled': 'रद्द', 'dash.todaysAppointments': 'आज के अपॉइंटमेंट', 'dash.pendingRequests': 'लंबित अनुरोध',
    'dash.totalPatients': 'कुल मरीज़', 'dash.revenue': 'आय (पूर्ण)', 'dash.totalRevenue': 'कुल आय (पूर्ण)',
    'dash.waitingInQueue': 'कतार में प्रतीक्षारत', 'dash.inConsultation': 'परामर्श में', 'dash.emergenciesToday': 'आज आपातकालीन',
    'dash.activeDoctors': 'सक्रिय डॉक्टर', 'dash.patients': 'मरीज़', 'dash.appointments': 'अपॉइंटमेंट',
    'dash.upcomingAppointments': 'आगामी अपॉइंटमेंट', 'dash.recentActivity': 'हाल की गतिविधि',
    'dash.todaysSchedule': 'आज का शेड्यूल', 'dash.recentAppointments': 'हाल के अपॉइंटमेंट',
    'dash.revenueByDay': 'दिन अनुसार आय और अपॉइंटमेंट', 'dash.earned': 'अर्जित', 'dash.expected': 'अपेक्षित',
    'dash.byStatus': 'स्थिति अनुसार', 'dash.topDoctors': 'आय अनुसार शीर्ष डॉक्टर', 'dash.last7': 'अपॉइंटमेंट · पिछले 7 दिन',
    'dash.pendingApproval': 'अनुमोदन लंबित', 'dash.allApproved': 'सभी स्वीकृत',
    'page.findDoctorSub': 'नाम, बीमारी, विशेषज्ञता, शहर, भाषा, बीमा आदि से खोजें।',
    'page.appointmentsSubPatient': 'अपनी बुकिंग देखें और प्रबंधित करें।',
    'page.appointmentsSubDoctor': 'अनुरोध देखें और अपना कैलेंडर प्रबंधित करें।',
    'page.appointmentsSubAdmin': 'क्लिनिक के सभी अपॉइंटमेंट।',
    'appt.mine': 'मेरे अपॉइंटमेंट', 'appt.all': 'सभी अपॉइंटमेंट',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('mb_lang') || 'en');
  const change = useCallback((l) => { setLang(l); localStorage.setItem('mb_lang', l); }, []);
  const t = useCallback((key) => DICT[lang]?.[key] || DICT.en[key] || key, [lang]);
  return <I18nContext.Provider value={{ lang, setLang: change, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'hi' ? 'active' : ''} onClick={() => setLang('hi')}>हिं</button>
    </div>
  );
}

// Non-hook translator for status values, usable anywhere.
export function translateStatus(lang, status) {
  return DICT[lang]?.[`status.${status}`] || DICT.en[`status.${status}`] || status;
}
