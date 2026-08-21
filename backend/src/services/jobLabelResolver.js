import CANONICAL_WORKER_JOBS from '../constants/jobOptions.js';

const JOB_LABELS_BY_LOCALE = {
  en: {
    nanny: 'Nanny', elderly_caregiver: 'Elderly Caregiver', nurse: 'Nurse', driver: 'Driver',
    security_guard: 'Security Guard', bodyguard: 'Bodyguard', plumber: 'Plumber', carpenter: 'Carpenter',
    electrician: 'Electrician', cleaner: 'Cleaner', cook: 'Cook', tutor: 'Tutor', gardener: 'Gardener',
    portrait_painter: 'Portrait Painter', interior_designer: 'Interior Designer', dog_trainer: 'Dog Trainer',
    cat_trainer: 'Cat Trainer', housekeeping: 'Housekeeping', personal_assistant: 'Personal Assistant',
    event_planner: 'Event Planner', fitness_trainer: 'Fitness Trainer', psychotherapist: 'Psychotherapist', other: 'Other'
  },
  ar: {
    nanny: 'مربية أطفال', elderly_caregiver: 'مقدم رعاية مسنين', nurse: 'ممرض', driver: 'سائق',
    security_guard: 'حارس أمن', bodyguard: 'حارس شخصي', plumber: 'سباك', carpenter: 'نجار', electrician: 'كهربائي',
    cleaner: 'عامل نظافة', cook: 'طباخ', tutor: 'معلم', gardener: 'بستاني', portrait_painter: 'فنان رسام',
    interior_designer: 'مصمم داخلي', dog_trainer: 'مدرب كلاب', cat_trainer: 'مدرب قطط', housekeeping: 'خدمات المنزل',
    personal_assistant: 'مساعد شخصي', event_planner: 'منظم فعاليات', fitness_trainer: 'مدرب لياقة',
    psychotherapist: 'معالج نفسي', other: 'أخرى'
  },
  fr: {
    nanny: 'Nounou', elderly_caregiver: 'Aide aux personnes âgées', nurse: 'Infirmier', driver: 'Chauffeur',
    security_guard: 'Agent de sécurité', bodyguard: 'Garde du corps', plumber: 'Plombier', carpenter: 'Menuisier',
    electrician: 'Électricien', cleaner: 'Agent de nettoyage', cook: 'Cuisinier', tutor: 'Tuteur', gardener: 'Jardinier',
    portrait_painter: 'Portraitmaler', interior_designer: 'Designer d’intérieur', dog_trainer: 'Dresseur de chiens',
    cat_trainer: 'Dresseur de chats', housekeeping: 'Ménage à domicile', personal_assistant: 'Assistant personnel',
    event_planner: 'Organisateur d’événements', fitness_trainer: 'Coach sportif', psychotherapist: 'Psychothérapeute', other: 'Autre'
  },
  ru: {
    nanny: 'Няня', elderly_caregiver: 'Сиделка для пожилых', nurse: 'Медсестра', driver: 'Водитель',
    security_guard: 'Охранник', bodyguard: 'Охранник-телохранитель', plumber: 'Сантехник', carpenter: 'Плотник',
    electrician: 'Электрик', cleaner: 'Уборщик', cook: 'Повар', tutor: 'Репетитор', gardener: 'Садовник',
    portrait_painter: 'Художник-портретист', interior_designer: 'Дизайнер интерьера', dog_trainer: 'Кинолог',
    cat_trainer: 'Дрессировщик кошек', housekeeping: 'Уборка дома', personal_assistant: 'Личный помощник',
    event_planner: 'Организатор мероприятий', fitness_trainer: 'Фитнес-тренер', psychotherapist: 'Психотерапевт', other: 'Другое'
  },
  tr: {
    nanny: 'Dadı', elderly_caregiver: 'Yaşlı Bakıcısı', nurse: 'Hemşire', driver: 'Şoför',
    security_guard: 'Güvenlik Görevlisi', bodyguard: 'Koruma Görevlisi', plumber: 'Tesisatçı', carpenter: 'Marangoz',
    electrician: 'Elektrikçi', cleaner: 'Temizlikçi', cook: 'Aşçı', tutor: 'Özel Öğretmen', gardener: 'Bahçıvan',
    portrait_painter: 'Portre Sanatçısı', interior_designer: 'İç Mimar', dog_trainer: 'Köpek Eğitmeni',
    cat_trainer: 'Kedi Eğitmeni', housekeeping: 'Ev Hizmetleri', personal_assistant: 'Kişisel Asistan',
    event_planner: 'Etkinlik Planlayıcısı', fitness_trainer: 'Fitness Eğitmeni', psychotherapist: 'Psikoterapist', other: 'Diğer'
  },
  de: {
    nanny: 'Kindermädchen', elderly_caregiver: 'Altenpfleger', nurse: 'Pflegekraft', driver: 'Fahrer',
    security_guard: 'Sicherheitskraft', bodyguard: 'Bodyguard', plumber: 'Klempner', carpenter: 'Tischler',
    electrician: 'Elektriker', cleaner: 'Reinigungskraft', cook: 'Koch', tutor: 'Privatlehrer', gardener: 'Gärtner',
    portrait_painter: 'Porträtmaler', interior_designer: 'Innenarchitekt', dog_trainer: 'Hundetrainer',
    cat_trainer: 'Katzentrainer', housekeeping: 'Haushaltsführung', personal_assistant: 'Persönlicher Assistent',
    event_planner: 'Veranstaltungsplaner', fitness_trainer: 'Fitnesstrainer', psychotherapist: 'Psychotherapeut', other: 'Andere'
  }
};

const normalizeJobLabel = (value) => {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLocaleLowerCase();
};

const LABEL_TO_CANONICAL = new Map();

for (const labels of Object.values(JOB_LABELS_BY_LOCALE)) {
  for (const canonicalJob of CANONICAL_WORKER_JOBS) {
    const label = labels[canonicalJob];
    if (label) LABEL_TO_CANONICAL.set(normalizeJobLabel(label), canonicalJob);
  }
}

export const resolveCanonicalJobLabel = (input) => {
  const normalized = normalizeJobLabel(input);
  return normalized ? LABEL_TO_CANONICAL.get(normalized) || null : null;
};

export { normalizeJobLabel };
