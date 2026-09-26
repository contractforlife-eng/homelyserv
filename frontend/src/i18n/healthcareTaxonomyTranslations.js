// src/i18n/healthcareTaxonomyTranslations.js
// Complete centralized translations for canonical Healthcare specialties, services, countries, and major standardized regions/cities.
// Supports: en, ar, fr, ru, tr, de.

export const HEALTHCARE_TAXONOMY_TRANSLATIONS = {
  // -------------------------------------------------------------
  // 1. COUNTRIES (All 10 distinct countries in HomelyServ dataset)
  // -------------------------------------------------------------
  countries: {
    'Bahrain': {
      en: 'Bahrain',
      ar: 'البحرين',
      fr: 'Bahreïn',
      ru: 'Бахрейн',
      tr: 'Bahreyn',
      de: 'Bahrain'
    },
    'Egypt': {
      en: 'Egypt',
      ar: 'مصر',
      fr: 'Égypte',
      ru: 'Египет',
      tr: 'Mısır',
      de: 'Ägypten'
    },
    'Jordan': {
      en: 'Jordan',
      ar: 'الأردن',
      fr: 'Jordanie',
      ru: 'Иордания',
      tr: 'Ürdün',
      de: 'Jordanien'
    },
    'Kuwait': {
      en: 'Kuwait',
      ar: 'الكويت',
      fr: 'Koweït',
      ru: 'Кувейт',
      tr: 'Kuveyt',
      de: 'Kuwait'
    },
    'Lebanon': {
      en: 'Lebanon',
      ar: 'لبنان',
      fr: 'Liban',
      ru: 'Ливан',
      tr: 'Lübnan',
      de: 'Libanon'
    },
    'Oman': {
      en: 'Oman',
      ar: 'سلطنة عمان',
      fr: 'Oman',
      ru: 'Оман',
      tr: 'Umman',
      de: 'Oman'
    },
    'Qatar': {
      en: 'Qatar',
      ar: 'قطر',
      fr: 'Qatar',
      ru: 'Катар',
      tr: 'Katar',
      de: 'Katar'
    },
    'United Arab Emirates': {
      en: 'United Arab Emirates',
      ar: 'الإمارات العربية المتحدة',
      fr: 'Émirats arabes unis',
      ru: 'Объединенные Арабские Эмираты',
      tr: 'Birleşik Arap Emirlikleri',
      de: 'Vereinigte Arabische Emirate'
    },
    'United Kingdom': {
      en: 'United Kingdom',
      ar: 'المملكة المتحدة',
      fr: 'Royaume-Uni',
      ru: 'Великобритания',
      tr: 'Birleşik Krallık',
      de: 'Vereinigtes Königreich'
    },
    'United States': {
      en: 'United States',
      ar: 'الولايات المتحدة',
      fr: 'États-Unis',
      ru: 'Соединенные Штаты',
      tr: 'Amerika Birleşik Devletleri',
      de: 'Vereinigte Staaten'
    }
  },

  // -------------------------------------------------------------
  // 2. SPECIALTIES (All 75 canonical specialties in the dataset)
  // -------------------------------------------------------------
  specialties: {
    'Acute Care - Department of Defense': {
      en: 'Acute Care - Department of Defense',
      ar: 'الرعاية الحادة - وزارة الدفاع',
      fr: 'Soins aigus - Ministère de la Défense',
      ru: 'Неотложная помощь - Министерство обороны',
      tr: 'Akut Bakım - Savunma Bakanlığı',
      de: 'Akutversorgung - Verteidigungsministerium'
    },
    'Acute Care - Veterans Administration': {
      en: 'Acute Care - Veterans Administration',
      ar: 'الرعاية الحادة - شؤون المحاربين القدامى',
      fr: 'Soins aigus - Anciens combattants',
      ru: 'Неотложная помощь - Ветераны',
      tr: 'Akut Bakım - Gaziler İdaresi',
      de: 'Akutversorgung - Veteranenverwaltung'
    },
    'Acute Care Hospitals': {
      en: 'Acute Care Hospitals',
      ar: 'مستشفيات الرعاية الحادة',
      fr: 'Hôpitaux de soins aigus',
      ru: 'Больницы неотложной помощи',
      tr: 'Akut Bakım Hastaneleri',
      de: 'Akutkrankenhäuser'
    },
    'CardioVascular': {
      en: 'Cardiovascular',
      ar: 'أمراض القلب والأوعية الدموية',
      fr: 'Cardiovasculaire',
      ru: 'Сердечно-сосудистые заболевания',
      tr: 'Kardiyovasküler',
      de: 'Kardiovaskulär'
    },
    'Cardiology': {
      en: 'Cardiology',
      ar: 'أمراض القلب',
      fr: 'Cardiologie',
      ru: 'Кардиология',
      tr: 'Kardiyoloji',
      de: 'Kardiologie'
    },
    'Cardiology, Catheters': {
      en: 'Cardiology, Catheters',
      ar: 'أمراض القلب وقسطرة القلب',
      fr: 'Cardiologie et cathétérisme',
      ru: 'Кардиология и катетеризация',
      tr: 'Kardiyoloji ve Kateter',
      de: 'Kardiologie und Katheterisierung'
    },
    'Cardiology, Catheters, Surgery': {
      en: 'Cardiology, Catheters, Surgery',
      ar: 'أمراض القلب والقسطرة وجراحة القلب',
      fr: 'Cardiologie, cathétérisme et chirurgie cardiaque',
      ru: 'Кардиология, катетеризация и кардиохирургия',
      tr: 'Kardiyoloji, Kateter ve Kalp Cerrahisi',
      de: 'Kardiologie, Katheter und Herzchirurgie'
    },
    'Chest Diseases': {
      en: 'Chest Diseases',
      ar: 'الأمراض الصدرية والجهاز التنفسي',
      fr: 'Pneumologie (Maladies respiratoires)',
      ru: 'Пульмонология (Грудные болезни)',
      tr: 'Göğüs Hastalıkları',
      de: 'Pneumologie (Brustkrankheiten)'
    },
    'Childrens': {
      en: "Children's Health",
      ar: 'صحة الأطفال',
      fr: 'Santé infantile',
      ru: 'Детское здоровье',
      tr: 'Çocuk Sağlığı',
      de: 'Kindergesundheit'
    },
    'Critical Access Hospitals': {
      en: 'Critical Access Hospitals',
      ar: 'مستشفيات الوصول الحرج والطوارئ',
      fr: 'Hôpitaux d’accès critique',
      ru: 'Больницы критического доступа',
      tr: 'Kritik Erişim Hastaneleri',
      de: 'Krankenhäuser für Notfallgrundversorgung'
    },
    'Dentistry': {
      en: 'Dentistry',
      ar: 'طب وجراحة الأسنان',
      fr: 'Dentisterie',
      ru: 'Стоматология',
      tr: 'Diş Hekimliği',
      de: 'Zahnmedizin'
    },
    'Dermatology': {
      en: 'Dermatology',
      ar: 'الأمراض الجلدية والتناسلية',
      fr: 'Dermatologie',
      ru: 'Дерматология',
      tr: 'Dermatoloji',
      de: 'Dermatologie'
    },
    'Ear, Nose, Throat': {
      en: 'Ear, Nose & Throat (ENT)',
      ar: 'الأنف والأذن والحنجرة',
      fr: 'Oto-rhino-laryngologie (ORL)',
      ru: 'Оториноларингология (ЛОР)',
      tr: 'Kulak Burun Boğaz (KBB)',
      de: 'Hals-Nasen-Ohren-Heilkunde (HNO)'
    },
    'Endemic diseases': {
      en: 'Endemic Diseases',
      ar: 'الأمراض المتوطنة والمعدية',
      fr: 'Maladies endémiques',
      ru: 'Эндемические заболевания',
      tr: 'Endemik Hastalıklar',
      de: 'Endemische Krankheiten'
    },
    'General Practice & Family Medicine': {
      en: 'General Practice & Family Medicine',
      ar: 'الطب العام وطب الأسرة',
      fr: 'Médecine générale et familiale',
      ru: 'Общая практика и семейная медицина',
      tr: 'Genel Pratisyenlik ve Aile Hekimliği',
      de: 'Allgemein- und Familienmedizin'
    },
    'General Surgery': {
      en: 'General Surgery',
      ar: 'الجراحة العامة',
      fr: 'Chirurgie générale',
      ru: 'Общая хирургия',
      tr: 'Genel Cerrahi',
      de: 'Allgemeinchirurgie'
    },
    'General Surgery , Oncology': {
      en: 'General Surgery & Oncology',
      ar: 'الجراحة العامة وجراحة الأورام',
      fr: 'Chirurgie générale et oncologie',
      ru: 'Общая хирургия и онкология',
      tr: 'Genel Cerrahi ve Onkoloji',
      de: 'Allgemeinchirurgie und Onkologie'
    },
    'General Surgery, Endoscopy': {
      en: 'General Surgery & Endoscopy',
      ar: 'الجراحة العامة والمناظير',
      fr: 'Chirurgie générale et endoscopie',
      ru: 'Общая хирургия и эндоскопия',
      tr: 'Genel Cerrahi ve Endoskopi',
      de: 'Allgemeinchirurgie und Endoskopie'
    },
    'General Surgery, Plastic Surgery': {
      en: 'General Surgery & Plastic Surgery',
      ar: 'الجراحة العامة وجراحة التجميل',
      fr: 'Chirurgie générale et plastique',
      ru: 'Общая хирургия и пластическая хирургия',
      tr: 'Genel Cerrahi ve Plastik Cerrahi',
      de: 'Allgemeinchirurgie und Plastische Chirurgie'
    },
    'General Surgery,Oncology, Endoscopy': {
      en: 'General Surgery, Oncology & Endoscopy',
      ar: 'الجراحة العامة والأورام والمناظير',
      fr: 'Chirurgie générale, oncologie et endoscopie',
      ru: 'Общая хирургия, онкология и эндоскопия',
      tr: 'Genel Cerrahi, Onkoloji ve Endoskopi',
      de: 'Allgemeinchirurgie, Onkologie und Endoskopie'
    },
    'Hospital': {
      en: 'Hospital Services',
      ar: 'خدمات المستشفيات',
      fr: 'Services hospitaliers',
      ru: 'Больничные услуги',
      tr: 'Hastane Hizmetleri',
      de: 'Krankenhausleistungen'
    },
    'Internal Medicine': {
      en: 'Internal Medicine',
      ar: 'الطب الباطني',
      fr: 'Médecine interne',
      ru: 'Внутренняя медицина',
      tr: 'İç Hastalıkları',
      de: 'Innere Medizin'
    },
    'Internal Medicine and Neurosurgery': {
      en: 'Internal Medicine & Neurosurgery',
      ar: 'الطب الباطني وجراحة المخ والأعصاب',
      fr: 'Médecine interne et neurochirurgie',
      ru: 'Внутренняя медицина и нейрохирургия',
      tr: 'İç Hastalıkları ve Beyin Cerrahisi',
      de: 'Innere Medizin und Neurochirurgie'
    },
    'Internal Medicine, Cardiology': {
      en: 'Internal Medicine & Cardiology',
      ar: 'الطب الباطني وأمراض القلب',
      fr: 'Médecine interne et cardiologie',
      ru: 'Внутренняя медицина и кардиология',
      tr: 'İç Hastalıkları ve Kardiyoloji',
      de: 'Innere Medizin und Kardiologie'
    },
    'Internal Medicine, Cardiology, Diabetes': {
      en: 'Internal Medicine, Cardiology & Diabetes',
      ar: 'الطب الباطني والقلب والسكري',
      fr: 'Médecine interne, cardiologie et diabète',
      ru: 'Внутренняя медицина, кардиология и диабет',
      tr: 'İç Hastalıkları, Kardiyoloji ve Diyabet',
      de: 'Innere Medizin, Kardiologie und Diabetes'
    },
    'Internal Medicine, Cardiology, Nephrology': {
      en: 'Internal Medicine, Cardiology & Nephrology',
      ar: 'الطب الباطني والقلب وأمراض الكلى',
      fr: 'Médecine interne, cardiologie et néphrologie',
      ru: 'Внутренняя медицина, кардиология и нефрология',
      tr: 'İç Hastalıkları, Kardiyoloji ve Nefroloji',
      de: 'Innere Medizin, Kardiologie und Nephrologie'
    },
    'Internal Medicine, Chest Diseases': {
      en: 'Internal Medicine & Chest Diseases',
      ar: 'الطب الباطني والأمراض الصدرية',
      fr: 'Médecine interne et pneumologie',
      ru: 'Внутренняя медицина и пульмонология',
      tr: 'İç Hastalıkları ve Göğüs Hastalıkları',
      de: 'Innere Medizin und Pneumologie'
    },
    'Internal Medicine, Chest Diseases, Pediatrics Chest Diseases': {
      en: 'Internal Medicine & Pediatric Chest Diseases',
      ar: 'الطب الباطني والأمراض الصدرية للأطفال',
      fr: 'Médecine interne et pneumologie pédiatrique',
      ru: 'Внутренняя медицина и детская пульмонология',
      tr: 'İç Hastalıkları ve Pediatrik Göğüs Hastalıkları',
      de: 'Innere Medizin und pädiatrische Pneumologie'
    },
    'Internal Medicine, Endocrinology, Diabetes': {
      en: 'Internal Medicine, Endocrinology & Diabetes',
      ar: 'الطب الباطني والغدد الصماء والسكري',
      fr: 'Médecine interne, endocrinologie et diabète',
      ru: 'Внутренняя медицина, эндокринология и диабет',
      tr: 'İç Hastalıkları, Endokrinoloji ve Diyabet',
      de: 'Innere Medizin, Endokrinologie und Diabetes'
    },
    'Internal Medicine, Gastroenterology': {
      en: 'Internal Medicine & Gastroenterology',
      ar: 'الطب الباطني والجهاز الهضمي والكبد',
      fr: 'Médecine interne et gastro-entérologie',
      ru: 'Внутренняя медицина и гастроэнтерология',
      tr: 'İç Hastalıkları ve Gastroenteroloji',
      de: 'Innere Medizin und Gastroenterologie'
    },
    'Internal Medicine, Hematology': {
      en: 'Internal Medicine & Hematology',
      ar: 'الطب الباطني وأمراض الدم',
      fr: 'Médecine interne et hématologie',
      ru: 'Внутренняя медицина и гематология',
      tr: 'İç Hastalıkları ve Hematoloji',
      de: 'Innere Medizin und Hämatologie'
    },
    'Internal Medicine, Nephrology': {
      en: 'Internal Medicine & Nephrology',
      ar: 'الطب الباطني وأمراض الكلى',
      fr: 'Médecine interne et néphrologie',
      ru: 'Внутренняя медицина и нефрология',
      tr: 'İç Hastalıkları ve Nefroloji',
      de: 'Innere Medizin und Nephrologie'
    },
    'Internal Medicine, Urology': {
      en: 'Internal Medicine & Urology',
      ar: 'الطب الباطني والمسالك البولية',
      fr: 'Médecine interne et urologie',
      ru: 'Внутренняя медицина и урология',
      tr: 'İç Hastalıkları ve Üroloji',
      de: 'Innere Medizin und Urologie'
    },
    'Internal Medicine,Digestive system and Diabetes': {
      en: 'Internal Medicine, Digestive System & Diabetes',
      ar: 'الطب الباطني والجهاز الهضمي والسكري',
      fr: 'Médecine interne, système digestif et diabète',
      ru: 'Внутренняя медицина, пищеварительная система и диабет',
      tr: 'İç Hastalıkları, Sindirim Sistemi ve Diyabet',
      de: 'Innere Medizin, Verdauungssystem und Diabetes'
    },
    'Internal Medicine,Kidney diseases': {
      en: 'Internal Medicine & Kidney Diseases',
      ar: 'الطب الباطني وأمراض الكلى',
      fr: 'Médecine interne et néphrologie',
      ru: 'Внутренняя медицина и болезни почек',
      tr: 'İç Hastalıkları ve Böbrek Hastalıkları',
      de: 'Innere Medizin und Nierenerkrankungen'
    },
    'Laboratory': {
      en: 'Medical Laboratory',
      ar: 'المختبرات والتحاليل الطبية',
      fr: 'Laboratoire d’analyses médicales',
      ru: 'Медицинская лаборатория',
      tr: 'Tıbbi Laboratuvar',
      de: 'Medizinisches Labor'
    },
    'Liver Diseases': {
      en: 'Liver Diseases & Hepatology',
      ar: 'أمراض الكبد والجهاز الهضمي',
      fr: 'Hépatologie (Maladies du foie)',
      ru: 'Гепатология (Болезни печени)',
      tr: 'Karaciğer Hastalıkları (Hepatoloji)',
      de: 'Hepatologie (Lebererkrankungen)'
    },
    'Long-term': {
      en: 'Long-term Care',
      ar: 'الرعاية الممتدة وطويلة الأجل',
      fr: 'Soins de longue durée',
      ru: 'Долговременный уход',
      tr: 'Uzun Süreli Bakım',
      de: 'Langzeitpflege'
    },
    'Multidisciplinary': {
      en: 'Multidisciplinary',
      ar: 'تخصصات متعددة',
      fr: 'Multidisciplinaire',
      ru: 'Многопрофильный',
      tr: 'Multidisipliner',
      de: 'Multidisziplinär'
    },
    'Nephrology, Renal Dialysis': {
      en: 'Nephrology & Renal Dialysis',
      ar: 'أمراض الكلى والغسيل الكلوي',
      fr: 'Néphrologie et dialyse rénale',
      ru: 'Нефрология и диализ',
      tr: 'Nefroloji ve Diyaliz',
      de: 'Nephrologie und Nierendialyse'
    },
    'Nephrology, Urology': {
      en: 'Nephrology & Urology',
      ar: 'أمراض الكلى والمسالك البولية',
      fr: 'Néphrologie et urologie',
      ru: 'Нефрология и урология',
      tr: 'Nefroloji ve Üroloji',
      de: 'Nephrologie und Urologie'
    },
    'Neurospine': {
      en: 'Neurospine Surgery',
      ar: 'جراحة العمود الفقري والأعصاب',
      fr: 'Chirurgie du rachis et neurologie',
      ru: 'Хирургия позвоночника и неврология',
      tr: 'Omurga Cerrahisi ve Nöroloji',
      de: 'Wirbelsäulenchirurgie und Neurologie'
    },
    'Neurospine, Sleep Medicine': {
      en: 'Neurospine & Sleep Medicine',
      ar: 'جراحة العمود الفقري وطب النوم',
      fr: 'Chirurgie du rachis et médecine du sommeil',
      ru: 'Хирургия позвоночника и медицина сна',
      tr: 'Omurga Cerrahisi ve Uyku Tıbbı',
      de: 'Wirbelsäulenchirurgie und Schlafmedizin'
    },
    'Neurosurgery': {
      en: 'Neurosurgery',
      ar: 'جراحة المخ والأعصاب',
      fr: 'Neurochirurgie',
      ru: 'Нейрохирургия',
      tr: 'Beyin ve Sinir Cerrahisi',
      de: 'Neurochirurgie'
    },
    'Neurosurgery, Psychiatry': {
      en: 'Neurosurgery & Psychiatry',
      ar: 'جراحة الأعصاب والطب النفسي',
      fr: 'Neurochirurgie et psychiatrie',
      ru: 'Нейрохирургия и психиатрия',
      tr: 'Beyin Cerrahisi ve Psikiyatri',
      de: 'Neurochirurgie und Psychiatrie'
    },
    'Neurosurgery, Spine Surgery': {
      en: 'Neurosurgery & Spine Surgery',
      ar: 'جراحة المخ والأعصاب والعمود الفقري',
      fr: 'Neurochirurgie et chirurgie du rachis',
      ru: 'Нейрохирургия и хирургия позвоночника',
      tr: 'Beyin ve Omurga Cerrahisi',
      de: 'Neurochirurgie und Wirbelsäulenchirurgie'
    },
    'Obstetrics, Gynecology': {
      en: 'Obstetrics & Gynecology',
      ar: 'النساء والتوليد',
      fr: 'Gynécologie et obstétrique',
      ru: 'Акушерство и гинекология',
      tr: 'Kadın Hastalıkları ve Doğum',
      de: 'Gynäkologie und Geburtshilfe'
    },
    'Obstetrics, Gynecology, General Surgery, ENT ( In Patient Only )': {
      en: 'Obstetrics, Gynecology, Surgery & ENT (Inpatient)',
      ar: 'النساء والتوليد والجراحة والأنف والأذن (إقامة داخلية)',
      fr: 'Gynécologie, chirurgie et ORL (hospitalisation)',
      ru: 'Гинекология, хирургия и ЛОР (стационар)',
      tr: 'Kadın Doğum, Cerrahi ve KBB (Yatarak)',
      de: 'Gynäkologie, Chirurgie und HNO (stationär)'
    },
    'Obstetrics, Infertility': {
      en: 'Obstetrics & Infertility',
      ar: 'النساء والتوليد وعلاج العقم وتأخر الإنجاب',
      fr: 'Obstétrique et infertilité',
      ru: 'Акушерство и лечение бесплодия',
      tr: 'Doğum ve Kısırlık Tedavisi',
      de: 'Geburtshilfe und Unfruchtbarkeitsbehandlung'
    },
    'Oncology': {
      en: 'Oncology',
      ar: 'علاج الأورام والسرطان',
      fr: 'Oncologie',
      ru: 'Онкология',
      tr: 'Onkoloji',
      de: 'Onkologie'
    },
    'Oncology , Generaal Surgery': {
      en: 'Oncology & General Surgery',
      ar: 'جراحة الأورام والجراحة العامة',
      fr: 'Oncologie et chirurgie générale',
      ru: 'Онкология и общая хирургия',
      tr: 'Onkoloji ve Genel Cerrahi',
      de: 'Onkologie und Allgemeinchirurgie'
    },
    'Ophthalmology': {
      en: 'Ophthalmology',
      ar: 'طب وجراحة العيون',
      fr: 'Ophtalmologie',
      ru: 'Офтальмология',
      tr: 'Göz Hastalıkları (Oftalmoloji)',
      de: 'Augenheilkunde (Ophthalmologie)'
    },
    'Ophthalmology Surgery': {
      en: 'Ophthalmology Surgery',
      ar: 'جراحات العيون والليزك',
      fr: 'Chirurgie ophtalmologique',
      ru: 'Офтальмологическая хирургия',
      tr: 'Göz Cerrahisi',
      de: 'Augenchirurgie'
    },
    'Optics': {
      en: 'Optics',
      ar: 'البصريات',
      fr: 'Optique',
      ru: 'Оптика',
      tr: 'Optik',
      de: 'Optik'
    },
    'Orthopedic Sugery': {
      en: 'Orthopedic Surgery',
      ar: 'جراحة العظام والمفاصل',
      fr: 'Chirurgie orthopédique',
      ru: 'Ортопедическая хирургия',
      tr: 'Ortopedi ve Travmatoloji',
      de: 'Orthopädische Chirurgie'
    },
    'Orthopedic Sugery , Physiotherapy': {
      en: 'Orthopedic Surgery & Physiotherapy',
      ar: 'جراحة العظام والعلاج الطبيعي',
      fr: 'Chirurgie orthopédique et physiothérapie',
      ru: 'Ортопедическая хирургия и физиотерапия',
      tr: 'Ortopedik Cerrahi ve Fizik Tedavi',
      de: 'Orthopädische Chirurgie und Physiotherapie'
    },
    'Orthopedic and knee surgery and sports injuries': {
      en: 'Orthopedics, Knee Surgery & Sports Injuries',
      ar: 'جراحة العظام والركبة وإصابات الملاعب',
      fr: 'Orthopédie, chirurgie du genou et traumatologie du sport',
      ru: 'Ортопедия, хирургия колена и спортивные травмы',
      tr: 'Ortopedi, Diz Cerrahisi ve Spor Yaralanmaları',
      de: 'Orthopädie, Kniechirurgie und Sportverletzungen'
    },
    'Orthopedics': {
      en: 'Orthopedics',
      ar: 'طب وجراحة العظام',
      fr: 'Orthopédie',
      ru: 'Ортопедия',
      tr: 'Ortopedi',
      de: 'Orthopädie'
    },
    'Orthopedics, Spine Surgery': {
      en: 'Orthopedics & Spine Surgery',
      ar: 'جراحة العظام والعمود الفقري',
      fr: 'Orthopédie et chirurgie du rachis',
      ru: 'Ортопедия и хирургия позвоночника',
      tr: 'Ortopedi ve Omurga Cerrahisi',
      de: 'Orthopädie und Wirbelsäulenchirurgie'
    },
    'Orthopedics, Spine Surgery, Pain Management': {
      en: 'Orthopedics, Spine Surgery & Pain Management',
      ar: 'جراحة العظام والعمود الفقري وعلاج الألم',
      fr: 'Orthopédie, chirurgie du rachis et traitement de la douleur',
      ru: 'Ортопедия, хирургия позвоночника и лечение боли',
      tr: 'Ortopedi, Omurga Cerrahisi ve Ağrı Tedavisi',
      de: 'Orthopädie, Wirbelsäulenchirurgie und Schmerztherapie'
    },
    'Pediatric Surgery, General Surgery': {
      en: 'Pediatric Surgery & General Surgery',
      ar: 'جراحة الأطفال والجراحة العامة',
      fr: 'Chirurgie pédiatrique et générale',
      ru: 'Детская и общая хирургия',
      tr: 'Çocuk Cerrahisi ve Genel Cerrahi',
      de: 'Kinderchirurgie und Allgemeinchirurgie'
    },
    'Pediatrics': {
      en: 'Pediatrics',
      ar: 'طب الأطفال وحديثي الولادة',
      fr: 'Pédiatrie',
      ru: 'Педиатрия',
      tr: 'Çocuk Sağlığı ve Hastalıkları (Pediatri)',
      de: 'Pädiatrie (Kinderheilkunde)'
    },
    'Pediatrics, Internal Medicine,Gyna': {
      en: 'Pediatrics, Internal Medicine & Gynecology',
      ar: 'طب الأطفال والباطنة والنساء',
      fr: 'Pédiatrie, médecine interne et gynécologie',
      ru: 'Педиатрия, терапия и гинекология',
      tr: 'Pediatri, Dahiliye ve Jinekoloji',
      de: 'Pädiatrie, Innere Medizin und Gynäkologie'
    },
    'Pediatrics, Neonates': {
      en: 'Pediatrics & Neonatology',
      ar: 'طب الأطفال ورعاية حديثي الولادة والمبتسرين',
      fr: 'Pédiatrie et néonatalogie',
      ru: 'Педиатрия и неонатология',
      tr: 'Pediatri ve Yenidoğan',
      de: 'Pädiatrie und Neonatologie'
    },
    'Pharmacy': {
      en: 'Pharmacy & Pharmaceutical Care',
      ar: 'الصيدلة وخدمات الدواء',
      fr: 'Pharmacie et soins pharmaceutiques',
      ru: 'Аптека и фармпомощь',
      tr: 'Eczane ve İlaç Hizmetleri',
      de: 'Pharmazie und Arzneimittelversorgung'
    },
    'Physiotherapy': {
      en: 'Physiotherapy & Physical Rehabilitation',
      ar: 'العلاج الطبيعي والتأهيل الحركي',
      fr: 'Physiothérapie et rééducation',
      ru: 'Физиотерапия и реабилитация',
      tr: 'Fizyoterapi ve Rehabilitasyon',
      de: 'Physiotherapie und Rehabilitation'
    },
    'Psychiatric': {
      en: 'Psychiatry & Mental Health',
      ar: 'الطب النفسي والصحة النفسية',
      fr: 'Psychiatrie et santé mentale',
      ru: 'Психиатрия и ментальное здоровье',
      tr: 'Psikiyatri ve Ruh Sağlığı',
      de: 'Psychiatrie und psychische Gesundheit'
    },
    'Radiology': {
      en: 'Radiology & Medical Imaging',
      ar: 'الأشعة والتصوير الطبي',
      fr: 'Radiologie et imagerie médicale',
      ru: 'Радиология и медицинская визуализация',
      tr: 'Radyoloji ve Tıbbi Görüntüleme',
      de: 'Radiologie und Bildgebung'
    },
    'Rural Emergency Hospital': {
      en: 'Rural Emergency Hospital',
      ar: 'مستشفى الطوارئ الريفي',
      fr: 'Hôpital d’urgence rural',
      ru: 'Сельская больница скорой помощи',
      tr: 'Kırsal Acil Hastanesi',
      de: 'Ländliches Notfallkrankenhaus'
    },
    'Scan': {
      en: 'Diagnostic Scan & Imaging',
      ar: 'الأشعة التشخيصية والتصوير المقطعي',
      fr: 'Imagerie et scanner diagnostique',
      ru: 'Диагностическое сканирование и томография',
      tr: 'Tanısal Tarama ve Görüntüleme',
      de: 'Diagnostischer Scan und Bildgebung'
    },
    'Scan, Laboratory': {
      en: 'Diagnostic Scan & Laboratory',
      ar: 'مركز أشعة وتحاليل معملية',
      fr: 'Centre de scanner et laboratoire',
      ru: 'Диагностический центр и лаборатория',
      tr: 'Görüntüleme ve Tıbbi Laboratuvar',
      de: 'Diagnosezentrum und Labor'
    },
    'Spine, joints and Neurology': {
      en: 'Spine, Joints & Neurology',
      ar: 'أمراض العمود الفقري والمفاصل والأعصاب',
      fr: 'Rachis, articulations et neurologie',
      ru: 'Позвоночник, суставы и неврология',
      tr: 'Omurga, Eklem ve Nöroloji',
      de: 'Wirbelsäule, Gelenke und Neurologie'
    },
    'Surgeries': {
      en: 'Surgical Specialties',
      ar: 'العمليات والتدخلات الجراحية',
      fr: 'Spécialités chirurgicales',
      ru: 'Хирургические специальности',
      tr: 'Cerrahi Uzmanlıklar',
      de: 'Chirurgische Fachgebiete'
    },
    'Urology': {
      en: 'Urology',
      ar: 'المسالك البولية والتناسلية',
      fr: 'Urologie',
      ru: 'Урология',
      tr: 'Üroloji',
      de: 'Urologie'
    },
    'Varicose Veins Treatment': {
      en: 'Varicose Veins Treatment',
      ar: 'علاج الدوالي والأوعية الدموية',
      fr: 'Traitement des varices',
      ru: 'Лечение варикозного расширения вен',
      tr: 'Varis Tedavisi',
      de: 'Krampfaderbehandlung'
    }
  },

  // -------------------------------------------------------------
  // 3. SERVICES (All canonical service tags in dataset)
  // -------------------------------------------------------------
  services: {
    'ER': {
      en: 'Emergency Room (ER)',
      ar: 'قسم الطوارئ',
      fr: 'Service des urgences',
      ru: 'Отделение неотложной помощи',
      tr: 'Acil Servis (ER)',
      de: 'Notaufnahme'
    },
    'Inpatient': {
      en: 'Inpatient Care',
      ar: 'إقامة داخلية',
      fr: 'Hospitalisation',
      ru: 'Стационар',
      tr: 'Yatarak Tedavi',
      de: 'Stationäre Versorgung'
    },
    'Outpatient services': {
      en: 'Outpatient Services',
      ar: 'عيادات خارجية',
      fr: 'Consultations externes',
      ru: 'Амбулаторные услуги',
      tr: 'Ayakta Tedavi',
      de: 'Ambulante Versorgung'
    },
    'Outpatient services and Emergency': {
      en: 'Outpatient & Emergency',
      ar: 'عيادات خارجية وطوارئ',
      fr: 'Consultations externes et urgences',
      ru: 'Амбулаторные услуги и скорая',
      tr: 'Ayakta Tedavi ve Acil',
      de: 'Ambulante Versorgung & Notaufnahme'
    },
    'isolation': {
      en: 'Isolation Unit',
      ar: 'عزل طبي',
      fr: 'Unité d’isolement',
      ru: 'Изолятор',
      tr: 'Karantina / İzolasyon',
      de: 'Isolierstation'
    },
    'Multidisciplinary': {
      en: 'Multidisciplinary',
      ar: 'تخصصات متعددة',
      fr: 'Multidisciplinaire',
      ru: 'Многопрофильный',
      tr: 'Multidisipliner',
      de: 'Multidisziplinär'
    },
    'Optics': {
      en: 'Optics',
      ar: 'البصريات',
      fr: 'Optique',
      ru: 'Оптика',
      tr: 'Optik',
      de: 'Optik'
    }
  },

  // -------------------------------------------------------------
  // 4. STANDARDIZED REGIONS / GOVERNORATES / EMIRATES / STATES
  // (Top regional entities in the Middle East & standardized locations)
  // -------------------------------------------------------------
  regions: {
    // Egypt Governorates & Regions
    'Cairo': {
      en: 'Cairo',
      ar: 'القاهرة',
      fr: 'Le Caire',
      ru: 'Каир',
      tr: 'Kahire',
      de: 'Kairo'
    },
    'Giza': {
      en: 'Giza',
      ar: 'الجيزة',
      fr: 'Gizeh',
      ru: 'Гиза',
      tr: 'Gize',
      de: 'Gizeh'
    },
    'Alexandria': {
      en: 'Alexandria',
      ar: 'الإسكندرية',
      fr: 'Alexandrie',
      ru: 'Александрия',
      tr: 'İskenderiye',
      de: 'Alexandria'
    },
    'Qalubiya': {
      en: 'Qalyubia',
      ar: 'القليوبية',
      fr: 'Qalyubiya',
      ru: 'Кальюбия',
      tr: 'Kalyubiye',
      de: 'Qalyubia'
    },
    'Dakahlia': {
      en: 'Dakahlia',
      ar: 'الدقهلية',
      fr: 'Dakhleya',
      ru: 'Дакахлия',
      tr: 'Dakahliye',
      de: 'Dakahlia'
    },
    'Daqahleya': {
      en: 'Dakahlia',
      ar: 'الدقهلية',
      fr: 'Dakhleya',
      ru: 'Дакахлия',
      tr: 'Dakahliye',
      de: 'Dakahlia'
    },
    'Gharbia': {
      en: 'Gharbia',
      ar: 'الغربية',
      fr: 'Gharbeya',
      ru: 'Гарбия',
      tr: 'Garbiye',
      de: 'Gharbia'
    },
    'Sharqia': {
      en: 'Sharqia',
      ar: 'الشرقية',
      fr: 'Charkia',
      ru: 'Шаркия',
      tr: 'Şarkiye',
      de: 'Scharqiyya'
    },
    'Sharkia': {
      en: 'Sharqia',
      ar: 'الشرقية',
      fr: 'Charkia',
      ru: 'Шаркия',
      tr: 'Şarkiye',
      de: 'Scharqiyya'
    },
    'Sharqiya': {
      en: 'Sharqia',
      ar: 'الشرقية',
      fr: 'Charkia',
      ru: 'Шаркия',
      tr: 'Şarkiye',
      de: 'Scharqiyya'
    },
    'Tanta': {
      en: 'Tanta',
      ar: 'طنطا',
      fr: 'Tanta',
      ru: 'Танта',
      tr: 'Tanta',
      de: 'Tanta'
    },
    'Menoufia': {
      en: 'Monufia',
      ar: 'المنوفية',
      fr: 'Menufiya',
      ru: 'Минуфия',
      tr: 'Menufiye',
      de: 'Menofia'
    },
    'Beheira': {
      en: 'Beheira',
      ar: 'البحيرة',
      fr: 'Beheira',
      ru: 'Бухейра',
      tr: 'Buheyre',
      de: 'Beheira'
    },
    'Damietta': {
      en: 'Damietta',
      ar: 'دمياط',
      fr: 'Damiette',
      ru: 'Дамиетта',
      tr: 'Dimyat',
      de: 'Damiette'
    },
    'Kafr Al Sheikh': {
      en: 'Kafr El Sheikh',
      ar: 'كفر الشيخ',
      fr: 'Kafr el-Cheik',
      ru: 'Кафр-эш-Шейх',
      tr: 'Kefr el-Şeyh',
      de: 'Kafr asch-Schaich'
    },
    'Fayoum': {
      en: 'Faiyum',
      ar: 'الفيوم',
      fr: 'Fayoum',
      ru: 'Файюм',
      tr: 'Feyyum',
      de: 'Faiyum'
    },
    'Beni Suef': {
      en: 'Beni Suef',
      ar: 'بني سويف',
      fr: 'Beni Souef',
      ru: 'Бени-Суэйф',
      tr: 'Beni Suef',
      de: 'Bani Suwaif'
    },
    'Minya': {
      en: 'Minya',
      ar: 'المنيا',
      fr: 'Al-Minya',
      ru: 'Эль-Минья',
      tr: 'Minye',
      de: 'al-Minya'
    },
    'Assiut': {
      en: 'Asyut',
      ar: 'أسيوط',
      fr: 'Assiout',
      ru: 'Асьют',
      tr: 'Asyut',
      de: 'Asyut'
    },
    'Sohag': {
      en: 'Sohag',
      ar: 'سوهاج',
      fr: 'Sohag',
      ru: 'Сохаг',
      tr: 'Suhac',
      de: 'Sohag'
    },
    'Qena': {
      en: 'Qena',
      ar: 'قنا',
      fr: 'Qena',
      ru: 'Кена',
      tr: 'Kina',
      de: 'Qina'
    },
    'Luxor': {
      en: 'Luxor',
      ar: 'الأقصر',
      fr: 'Louxor',
      ru: 'Луксор',
      tr: 'Luksor',
      de: 'Luxor'
    },
    'Aswan': {
      en: 'Aswan',
      ar: 'أسوان',
      fr: 'Assouan',
      ru: 'Асуан',
      tr: 'Aswan',
      de: 'Assuan'
    },
    'Red Sea': {
      en: 'Red Sea',
      ar: 'البحر الأحمر',
      fr: 'Mer Rouge',
      ru: 'Красное Море',
      tr: 'Kızıldeniz',
      de: 'Rotes Meer'
    },
    'Hurghada': {
      en: 'Hurghada',
      ar: 'الغردقة',
      fr: 'Hurghada',
      ru: 'Хургада',
      tr: 'Hurgada',
      de: 'Hurghada'
    },
    'South Sinai': {
      en: 'South Sinai',
      ar: 'جنوب سيناء',
      fr: 'Sinaï Sud',
      ru: 'Южный Синай',
      tr: 'Güney Sina',
      de: 'Süd-Sinai'
    },
    'North Sinai': {
      en: 'North Sinai',
      ar: 'شمال سيناء',
      fr: 'Sinaï Nord',
      ru: 'Северный Синай',
      tr: 'Kuzey Sina',
      de: 'Nord-Sinai'
    },
    'Port Said': {
      en: 'Port Said',
      ar: 'بورسعيد',
      fr: 'Port-Saïd',
      ru: 'Порт-Саид',
      tr: 'Port Said',
      de: 'Port Said'
    },
    'Suez': {
      en: 'Suez',
      ar: 'السويس',
      fr: 'Suez',
      ru: 'Суэц',
      tr: 'Süveyş',
      de: 'Sues'
    },
    'Ismailia': {
      en: 'Ismailia',
      ar: 'الإسماعيلية',
      fr: 'Ismaïlia',
      ru: 'Исмаилия',
      tr: 'İsmailiye',
      de: 'Ismailia'
    },
    'Matrouh': {
      en: 'Matrouh',
      ar: 'مطروح',
      fr: 'Matruh',
      ru: 'Матрух',
      tr: 'Matruh',
      de: 'Matruh'
    },
    'Al Wadi Al Gadid': {
      en: 'New Valley',
      ar: 'الوادي الجديد',
      fr: 'Nouvelle-Vallée',
      ru: 'Новая Долина',
      tr: 'Yeni Vadi',
      de: 'Neues Tal'
    },

    // UAE Emirates
    'Abu Dhabi': {
      en: 'Abu Dhabi',
      ar: 'أبو ظبي',
      fr: 'Abou Dabi',
      ru: 'Абу-Даби',
      tr: 'Abu Dabi',
      de: 'Abu Dhabi'
    },
    'Dubai': {
      en: 'Dubai',
      ar: 'دبي',
      fr: 'Dubaï',
      ru: 'Дубай',
      tr: 'Dubai',
      de: 'Dubai'
    },
    'Sharjah': {
      en: 'Sharjah',
      ar: 'الشارقة',
      fr: 'Charjah',
      ru: 'Шарджа',
      tr: 'Şarika',
      de: 'Schardscha'
    },
    'Ajman': {
      en: 'Ajman',
      ar: 'عجمان',
      fr: 'Ajman',
      ru: 'Аджман',
      tr: 'Acman',
      de: 'Adschman'
    },
    'Ras al Khaimah': {
      en: 'Ras Al Khaimah',
      ar: 'رأس الخيمة',
      fr: 'Ras el Khaïmah',
      ru: 'Рас-эль-Хайма',
      tr: 'Resü\'l-Hayme',
      de: 'Ras al-Chaima'
    },
    'Fujairah': {
      en: 'Fujairah',
      ar: 'الفجيرة',
      fr: 'Fujaïrah',
      ru: 'Эль-Фуджайра',
      tr: 'Füceyre',
      de: 'Fudschaira'
    },
    'Umm Al Quwain': {
      en: 'Umm Al Quwain',
      ar: 'أم القيوين',
      fr: 'Oumm al Qaïwaïn',
      ru: 'Умм-эль-Кайвайн',
      tr: 'Ummül-Kayveyn',
      de: 'Umm al-Qaiwain'
    },

    // GCC Major Regions
    'Kuwait City': {
      en: 'Kuwait City',
      ar: 'مدينة الكويت',
      fr: 'Koweït (Ville)',
      ru: 'Эль-Кувейт',
      tr: 'Kuveyt Şehri',
      de: 'Kuwait-Stadt'
    },
    'Hawally': {
      en: 'Hawalli',
      ar: 'حولي',
      fr: 'Hawalli',
      ru: 'Хавалли',
      tr: 'Havalli',
      de: 'Hawalli'
    },
    'Farwaniya': {
      en: 'Farwaniya',
      ar: 'الفروانية',
      fr: 'Farwaniya',
      ru: 'Эль-Фарвания',
      tr: 'Fervaniye',
      de: 'al-Farwaniyya'
    },
    'Al Ahmadi': {
      en: 'Al Ahmadi',
      ar: 'الأحمدي',
      fr: 'Al Ahmadi',
      ru: 'Эль-Ахмади',
      tr: 'Ahmedi',
      de: 'al-Ahmadi'
    },
    'Jahra': {
      en: 'Al Jahra',
      ar: 'الجهراء',
      fr: 'Al Jahra',
      ru: 'Эль-Джахра',
      tr: 'Cehre',
      de: 'al-Dschahra'
    },
    'Mubarak Al Kabeer': {
      en: 'Mubarak Al-Kabeer',
      ar: 'مبارك الكبير',
      fr: 'Mubarak Al-Kabeer',
      ru: 'Мубарак аль-Кабир',
      tr: 'Mübarek El Kebir',
      de: 'Mubarak al-Kabir'
    },
    'Muscat': {
      en: 'Muscat',
      ar: 'مسقط',
      fr: 'Mascate',
      ru: 'Маскат',
      tr: 'Maskat',
      de: 'Maskat'
    },
    'Dhofar': {
      en: 'Dhofar',
      ar: 'ظفار',
      fr: 'Dhofar',
      ru: 'Дофар',
      tr: 'Zufar',
      de: 'Dhofar'
    },
    'Al Doha': {
      en: 'Doha',
      ar: 'الدوحة',
      fr: 'Doha',
      ru: 'Доха',
      tr: 'Doha',
      de: 'Doha'
    },
    'Al Rayyan': {
      en: 'Al Rayyan',
      ar: 'الريان',
      fr: 'Al Rayyan',
      ru: 'Эр-Райян',
      tr: 'El Reyyan',
      de: 'ar-Rayyan'
    },
    'Al Wakrah': {
      en: 'Al Wakrah',
      ar: 'الوكرة',
      fr: 'Al Wakrah',
      ru: 'Эль-Вакра',
      tr: 'El Vakra',
      de: 'al-Wakra'
    },
    'Manama': {
      en: 'Manama',
      ar: 'المنامة',
      fr: 'Manama',
      ru: 'Манама',
      tr: 'Manama',
      de: 'Manama'
    },
    'Muharraq': {
      en: 'Muharraq',
      ar: 'المحرق',
      fr: 'Muharraq',
      ru: 'Мухаррак',
      tr: 'Muharrak',
      de: 'al-Muharraq'
    },
    'Amman': {
      en: 'Amman',
      ar: 'عمّان',
      fr: 'Amman',
      ru: 'Амман',
      tr: 'Amman',
      de: 'Amman'
    },
    'Beirut': {
      en: 'Beirut',
      ar: 'بيروت',
      fr: 'Beyrouth',
      ru: 'Бейрут',
      tr: 'Beyrut',
      de: 'Beirut'
    },

    // GCC & Middle East Regional Entities in Dataset
    'Al Batinah Region north': {
      en: 'North Al Batinah',
      ar: 'شمال الباطنة',
      fr: 'Al Batinah Nord',
      ru: 'Северная Эль-Батина',
      tr: 'Kuzey El Batinah',
      de: 'Nord-al-Batina'
    },
    'Al Batinah Region south': {
      en: 'South Al Batinah',
      ar: 'جنوب الباطنة',
      fr: 'Al Batinah Sud',
      ru: 'Южная Эль-Батина',
      tr: 'Güney El Batinah',
      de: 'Süd-al-Batina'
    },
    'Al Buraymi': {
      en: 'Al Buraimi',
      ar: 'البريمي',
      fr: 'Al Buraymi',
      ru: 'Эль-Бурайми',
      tr: 'El Buraymi',
      de: 'al-Buraimi'
    },
    'Al Dhahirah': {
      en: 'Al Dhahirah',
      ar: 'الظاهرة',
      fr: 'Ad-Dhahirah',
      ru: 'Эз-Захира',
      tr: 'Ez-Zahira',
      de: 'az-Zahirah'
    },
    'Al Sharqiyah North': {
      en: 'North Ash Sharqiyah',
      ar: 'شمال الشرقية',
      fr: 'Ash Sharqiyah Nord',
      ru: 'Северная Эш-Шаркия',
      tr: 'Kuzey Şarkiye',
      de: 'Nord-asch-Scharqiyya'
    },
    'Al Sharqiyah South': {
      en: 'South Ash Sharqiyah',
      ar: 'جنوب الشرقية',
      fr: 'Ash Sharqiyah Sud',
      ru: 'Южная Эш-Шаркия',
      tr: 'Güney Şarkiye',
      de: 'Süd-asch-Scharqiyya'
    },
    'Dakhiliyah': {
      en: 'Ad Dakhiliyah',
      ar: 'الداخلية',
      fr: 'Ad-Dakhiliyah',
      ru: 'Эд-Дахилия',
      tr: 'Ed-Dahiliye',
      de: 'ad-Dachiliyya'
    },
    'Mahboula': {
      en: 'Mahboula',
      ar: 'المهبولة',
      fr: 'Mahboula',
      ru: 'Махбула',
      tr: 'Mahbula',
      de: 'Mahboula'
    },
    'Northen': {
      en: 'Northern Governorate',
      ar: 'المحافظة الشمالية',
      fr: 'Gouvernorat septentrional',
      ru: 'Северная мухафаза',
      tr: 'Kuzey Valiliği',
      de: 'Nördliches Gouvernement'
    },
    'Sourthen': {
      en: 'Southern Governorate',
      ar: 'المحافظة الجنوبية',
      fr: 'Gouvernorat méridional',
      ru: 'Южная мухафаза',
      tr: 'Güney Valiliği',
      de: 'Südliches Gouvernement'
    },
    'Bahrain': {
      en: 'Bahrain',
      ar: 'البحرين',
      fr: 'Bahreïn',
      ru: 'Бахрейн',
      tr: 'Bahreyn',
      de: 'Bahrain'
    },
    'Oman': {
      en: 'Oman',
      ar: 'سلطنة عمان',
      fr: 'Oman',
      ru: 'Оман',
      tr: 'Umman',
      de: 'Oman'
    },
    'Qatar': {
      en: 'Qatar',
      ar: 'قطر',
      fr: 'Qatar',
      ru: 'Катар',
      tr: 'Katar',
      de: 'Katar'
    },

    // US State Abbreviations & Territories
    'AK': { en: 'Alaska', ar: 'ألاسكا', fr: 'Alaska', ru: 'Аляска', tr: 'Alaska', de: 'Alaska' },
    'AL': { en: 'Alabama', ar: 'ألاباما', fr: 'Alabama', ru: 'Алабама', tr: 'Alabama', de: 'Alabama' },
    'AR': { en: 'Arkansas', ar: 'أركنساس', fr: 'Arkansas', ru: 'Арканзас', tr: 'Arkansas', de: 'Arkansas' },
    'AS': { en: 'American Samoa', ar: 'ساموا الأمريكية', fr: 'Samoa américaines', ru: 'Американское Самоа', tr: 'Amerikan Samoası', de: 'Amerikanisch-Samoa' },
    'AZ': { en: 'Arizona', ar: 'أريزونا', fr: 'Arizona', ru: 'Аризона', tr: 'Arizona', de: 'Arizona' },
    'CA': { en: 'California', ar: 'كاليفورنيا', fr: 'Californie', ru: 'Калифорния', tr: 'Kaliforniya', de: 'Kalifornien' },
    'CO': { en: 'Colorado', ar: 'كولورادو', fr: 'Colorado', ru: 'Колорадо', tr: 'Kolorado', de: 'Colorado' },
    'CT': { en: 'Connecticut', ar: 'كونيتيكت', fr: 'Connecticut', ru: 'Коннектикут', tr: 'Connecticut', de: 'Connecticut' },
    'DC': { en: 'District of Columbia', ar: 'واشنطن العاصمة', fr: 'District de Columbia', ru: 'Округ Колумбия', tr: 'Kolombiya Bölgesi', de: 'District of Columbia' },
    'DE': { en: 'Delaware', ar: 'ديلاوير', fr: 'Delaware', ru: 'Делавэр', tr: 'Delaware', de: 'Delaware' },
    'FL': { en: 'Florida', ar: 'فلوريدا', fr: 'Floride', ru: 'Флорида', tr: 'Florida', de: 'Florida' },
    'GA': { en: 'Georgia', ar: 'جورجيا', fr: 'Géorgie', ru: 'Джорджия', tr: 'Georgia', de: 'Georgia' },
    'GU': { en: 'Guam', ar: 'غوام', fr: 'Guam', ru: 'Гуам', tr: 'Guam', de: 'Guam' },
    'HI': { en: 'Hawaii', ar: 'هاواي', fr: 'Hawaï', ru: 'Гавайи', tr: 'Hawaii', de: 'Hawaii' },
    'IA': { en: 'Iowa', ar: 'أيوا', fr: 'Iowa', ru: 'Айова', tr: 'Iowa', de: 'Iowa' },
    'ID': { en: 'Idaho', ar: 'أيداهو', fr: 'Idaho', ru: 'Айдахо', tr: 'Idaho', de: 'Idaho' },
    'IL': { en: 'Illinois', ar: 'إلينوي', fr: 'Illinois', ru: 'Иллинойс', tr: 'Illinois', de: 'Illinois' },
    'IN': { en: 'Indiana', ar: 'إنديانا', fr: 'Indiana', ru: 'Индиана', tr: 'Indiana', de: 'Indiana' },
    'KS': { en: 'Kansas', ar: 'كانساس', fr: 'Kansas', ru: 'Канзас', tr: 'Kansas', de: 'Kansas' },
    'KY': { en: 'Kentucky', ar: 'كنتاكي', fr: 'Kentucky', ru: 'Кентукки', tr: 'Kentucky', de: 'Kentucky' },
    'LA': { en: 'Louisiana', ar: 'لويزيانا', fr: 'Louisiane', ru: 'Луизиана', tr: 'Louisiana', de: 'Louisiana' },
    'MA': { en: 'Massachusetts', ar: 'ماساتشوستس', fr: 'Massachusetts', ru: 'Массачусетс', tr: 'Massachusetts', de: 'Massachusetts' },
    'MD': { en: 'Maryland', ar: 'ماريلاند', fr: 'Maryland', ru: 'Мэриленд', tr: 'Maryland', de: 'Maryland' },
    'ME': { en: 'Maine', ar: 'مين', fr: 'Maine', ru: 'Мэн', tr: 'Maine', de: 'Maine' },
    'MI': { en: 'Michigan', ar: 'ميشيغان', fr: 'Michigan', ru: 'Мичиган', tr: 'Michigan', de: 'Michigan' },
    'MN': { en: 'Minnesota', ar: 'مينيسوتا', fr: 'Minnesota', ru: 'Миннесота', tr: 'Minnesota', de: 'Minnesota' },
    'MO': { en: 'Missouri', ar: 'ميزوري', fr: 'Missouri', ru: 'Миссури', tr: 'Missouri', de: 'Missouri' },
    'MP': { en: 'Northern Mariana Islands', ar: 'جزر ماريانا الشمالية', fr: 'Îles Mariannes du Nord', ru: 'Северные Марианские острова', tr: 'Kuzey Mariana Adaları', de: 'Nördliche Marianen' },
    'MS': { en: 'Mississippi', ar: 'مسيسيبي', fr: 'Mississippi', ru: 'Миссисипи', tr: 'Mississippi', de: 'Mississippi' },
    'MT': { en: 'Montana', ar: 'مونتانا', fr: 'Montana', ru: 'Монтана', tr: 'Montana', de: 'Montana' },
    'NC': { en: 'North Carolina', ar: 'كارولاينا الشمالية', fr: 'Caroline du Nord', ru: 'Северная Каролина', tr: 'Kuzey Karolina', de: 'North Carolina' },
    'ND': { en: 'North Dakota', ar: 'داكوتا الشمالية', fr: 'Dakota du Nord', ru: 'Северная Дакота', tr: 'Kuzey Dakota', de: 'North Dakota' },
    'NE': { en: 'Nebraska', ar: 'نبراسكا', fr: 'Nebraska', ru: 'Небраска', tr: 'Nebraska', de: 'Nebraska' },
    'NH': { en: 'New Hampshire', ar: 'نيوهامبشير', fr: 'New Hampshire', ru: 'Нью-Гэмпшир', tr: 'New Hampshire', de: 'New Hampshire' },
    'NJ': { en: 'New Jersey', ar: 'نيوجيرسي', fr: 'New Jersey', ru: 'Нью-Джерси', tr: 'New Jersey', de: 'New Jersey' },
    'NM': { en: 'New Mexico', ar: 'نيومكسيكو', fr: 'Nouveau-Mexique', ru: 'Нью-Мексико', tr: 'New Mexico', de: 'New Mexico' },
    'NV': { en: 'Nevada', ar: 'نيفادا', fr: 'Nevada', ru: 'Невада', tr: 'Nevada', de: 'Nevada' },
    'NY': { en: 'New York', ar: 'نيويورك', fr: 'New York', ru: 'Нью-Йорк', tr: 'New York', de: 'New York' },
    'OH': { en: 'Ohio', ar: 'أوهايو', fr: 'Ohio', ru: 'Огайо', tr: 'Ohio', de: 'Ohio' },
    'OK': { en: 'Oklahoma', ar: 'أوكلاهوما', fr: 'Oklahoma', ru: 'Оклахома', tr: 'Oklahoma', de: 'Oklahoma' },
    'OR': { en: 'Oregon', ar: 'أوريغون', fr: 'Oregon', ru: 'Орегон', tr: 'Oregon', de: 'Oregon' },
    'PA': { en: 'Pennsylvania', ar: 'بنسيلفانيا', fr: 'Pennsylvanie', ru: 'Пенсильвания', tr: 'Pensilvanya', de: 'Pennsylvania' },
    'PR': { en: 'Puerto Rico', ar: 'بورتوريكو', fr: 'Porto Rico', ru: 'Пуэрто-Рико', tr: 'Porto Riko', de: 'Puerto Rico' },
    'RI': { en: 'Rhode Island', ar: 'رود آيلاند', fr: 'Rhode Island', ru: 'Род-Айленд', tr: 'Rhode Island', de: 'Rhode Island' },
    'SC': { en: 'South Carolina', ar: 'كارولاينا الجنوبية', fr: 'Caroline du Sud', ru: 'Южная Каролина', tr: 'Güney Karolina', de: 'South Carolina' },
    'SD': { en: 'South Dakota', ar: 'داكوتا الجنوبية', fr: 'Dakota du Sud', ru: 'Южная Дакота', tr: 'Güney Dakota', de: 'South Dakota' },
    'TN': { en: 'Tennessee', ar: 'تينيسي', fr: 'Tennessee', ru: 'Теннесси', tr: 'Tennessee', de: 'Tennessee' },
    'TX': { en: 'Texas', ar: 'تكساس', fr: 'Texas', ru: 'Техас', tr: 'Teksas', de: 'Texas' },
    'UT': { en: 'Utah', ar: 'يوتا', fr: 'Utah', ru: 'Юта', tr: 'Utah', de: 'Utah' },
    'VA': { en: 'Virginia', ar: 'فرجينيا', fr: 'Virginie', ru: 'Виргиния', tr: 'Virginia', de: 'Virginia' },
    'VI': { en: 'Virgin Islands', ar: 'الجزر العذراء الأمريكية', fr: 'Îles Vierges des États-Unis', ru: 'Виргинские острова', tr: 'Virjin Adaları', de: 'Amerikanische Jungferninseln' },
    'VT': { en: 'Vermont', ar: 'فيرمونت', fr: 'Vermont', ru: 'Вермонт', tr: 'Vermont', de: 'Vermont' },
    'WA': { en: 'Washington', ar: 'واشنطن', fr: 'Washington', ru: 'Вашингтон', tr: 'Washington', de: 'Washington' },
    'WI': { en: 'Wisconsin', ar: 'ويسكونسن', fr: 'Wisconsin', ru: 'Висконсин', tr: 'Wisconsin', de: 'Wisconsin' },
    'WV': { en: 'West Virginia', ar: 'فرجينيا الغربية', fr: 'Virginie-Occidentale', ru: 'Западная Виргиния', tr: 'Batı Virginia', de: 'West Virginia' },
    'WY': { en: 'Wyoming', ar: 'وايومنغ', fr: 'Wyoming', ru: 'Вайоминг', tr: 'Wyoming', de: 'Wyoming' }
  },

  // -------------------------------------------------------------
  // 5. STANDARDIZED CITIES (Common major municipal centers in dataset)
  // -------------------------------------------------------------
  cities: {
    'Cairo': {
      en: 'Cairo',
      ar: 'القاهرة',
      fr: 'Le Caire',
      ru: 'Каир',
      tr: 'Kahire',
      de: 'Kairo'
    },
    'Giza': {
      en: 'Giza',
      ar: 'الجيزة',
      fr: 'Gizeh',
      ru: 'Гиза',
      tr: 'Gize',
      de: 'Gizeh'
    },
    'Alexandria': {
      en: 'Alexandria',
      ar: 'الإسكندرية',
      fr: 'Alexandrie',
      ru: 'Александрия',
      tr: 'İskenderiye',
      de: 'Alexandria'
    },
    'Nasr City': {
      en: 'Nasr City',
      ar: 'مدينة نصر',
      fr: 'Nasr City',
      ru: 'Наср-Сити',
      tr: 'Nasr City',
      de: 'Nasr City'
    },
    'Heliopolis': {
      en: 'Heliopolis',
      ar: 'مصر الجديدة',
      fr: 'Héliopolis',
      ru: 'Гелиополис',
      tr: 'Heliopolis',
      de: 'Heliopolis'
    },
    'Maadi': {
      en: 'Maadi',
      ar: 'المعادي',
      fr: 'Maadi',
      ru: 'Маади',
      tr: 'Maadi',
      de: 'Maadi'
    },
    'Dokki': {
      en: 'Dokki',
      ar: 'الدقي',
      fr: 'Dokki',
      ru: 'Докки',
      tr: 'Dokki',
      de: 'Dokki'
    },
    'Mohandessin': {
      en: 'Mohandessin',
      ar: 'المهندسين',
      fr: 'Mohandessin',
      ru: 'Мохандессин',
      tr: 'Mohandessin',
      de: 'Mohandessin'
    },
    '6th October City': {
      en: '6th of October City',
      ar: 'مدينة السادس من أكتوبر',
      fr: 'Ville du 6 Octobre',
      ru: 'Город имени 6 Октября',
      tr: '6 Ekim Şehri',
      de: 'Stadt des 6. Oktober'
    },
    'Sheikh Zayed': {
      en: 'Sheikh Zayed City',
      ar: 'مدينة الشيخ زايد',
      fr: 'Cheikh Zayed',
      ru: 'Шейх Заид',
      tr: 'Şeyh Zayed',
      de: 'Scheich-Zayid-Stadt'
    },
    'New Cairo': {
      en: 'New Cairo',
      ar: 'القاهرة الجديدة',
      fr: 'Nouveau Caire',
      ru: 'Новый Каир',
      tr: 'Yeni Kahire',
      de: 'Neu-Kairo'
    },
    '5th Settlement': {
      en: '5th Settlement',
      ar: 'التجمع الخامس',
      fr: '5e Rassemblement',
      ru: '5-й Сеттлмент',
      tr: '5. Bölge',
      de: '5. Siedlung'
    },
    '10th of Ramadan City': {
      en: '10th of Ramadan City',
      ar: 'مدينة العاشر من رمضان',
      fr: 'Ville du 10 Ramadan',
      ru: 'Город имени 10 Рамадана',
      tr: '10 Ramazan Şehri',
      de: 'Stadt des 10. Ramadan'
    },
    'Shubra': {
      en: 'Shubra',
      ar: 'شبرا',
      fr: 'Choubra',
      ru: 'Шубра',
      tr: 'Şubra',
      de: 'Schubra'
    },
    'Shoubra El Khimah': {
      en: 'Shubra El Kheima',
      ar: 'شبرا الخيمة',
      fr: 'Choubra El Kheïma',
      ru: 'Шубра-эль-Хейма',
      tr: 'Şubra el-Hayme',
      de: 'Schubra al-Chaima'
    },
    'Tanta': {
      en: 'Tanta',
      ar: 'طنطا',
      fr: 'Tanta',
      ru: 'Танта',
      tr: 'Tanta',
      de: 'Tanta'
    },
    'Mansoura': {
      en: 'Mansoura',
      ar: 'المنصورة',
      fr: 'Mansourah',
      ru: 'Мансура',
      tr: 'Mansura',
      de: 'Mansura'
    },
    'Zagazig': {
      en: 'Zagazig',
      ar: 'الزقازيق',
      fr: 'Zagazig',
      ru: 'Эз-Заказик',
      tr: 'Zekazik',
      de: 'Zagazig'
    },
    'Ismailia': {
      en: 'Ismailia',
      ar: 'الإسماعيلية',
      fr: 'Ismaïlia',
      ru: 'Исмаилия',
      tr: 'İsmailiye',
      de: 'Ismailia'
    },
    'Suez': {
      en: 'Suez',
      ar: 'السويس',
      fr: 'Suez',
      ru: 'Суэц',
      tr: 'Süveyş',
      de: 'Sues'
    },
    'Port Said': {
      en: 'Port Said',
      ar: 'بورسعيد',
      fr: 'Port-Saïd',
      ru: 'Порт-Саид',
      tr: 'Port Said',
      de: 'Port Said'
    },
    'Assiut': {
      en: 'Asyut',
      ar: 'أسيوط',
      fr: 'Assiout',
      ru: 'Асьют',
      tr: 'Asyut',
      de: 'Asyut'
    },
    'Aswan': {
      en: 'Aswan',
      ar: 'أسوان',
      fr: 'Assouan',
      ru: 'Асуан',
      tr: 'Aswan',
      de: 'Assuan'
    },
    'Luxor': {
      en: 'Luxor',
      ar: 'الأقصر',
      fr: 'Louxor',
      ru: 'Луксор',
      tr: 'Luksor',
      de: 'Luxor'
    },
    'Hurghada': {
      en: 'Hurghada',
      ar: 'الغردقة',
      fr: 'Hurghada',
      ru: 'Хургада',
      tr: 'Hurgada',
      de: 'Hurghada'
    },
    'Sharm El Sheikh': {
      en: 'Sharm El Sheikh',
      ar: 'شرم الشيخ',
      fr: 'Charm el-Cheikh',
      ru: 'Шарм-эль-Шейх',
      tr: 'Şarm El-Şeyh',
      de: 'Scharm asch-Schaich'
    },
    'Abu Dhabi': {
      en: 'Abu Dhabi',
      ar: 'أبو ظبي',
      fr: 'Abou Dabi',
      ru: 'Абу-Даби',
      tr: 'Abu Dabi',
      de: 'Abu Dhabi'
    },
    'Dubai': {
      en: 'Dubai',
      ar: 'دبي',
      fr: 'Dubaï',
      ru: 'Дубай',
      tr: 'Dubai',
      de: 'Dubai'
    },
    'Sharjah': {
      en: 'Sharjah',
      ar: 'الشارقة',
      fr: 'Charjah',
      ru: 'Шарджа',
      tr: 'Şarika',
      de: 'Schardscha'
    },
    'Ajman': {
      en: 'Ajman',
      ar: 'عجمان',
      fr: 'Ajman',
      ru: 'Аджман',
      tr: 'Acman',
      de: 'Adschman'
    },
    'Ras al Khaimah': {
      en: 'Ras Al Khaimah',
      ar: 'رأس الخيمة',
      fr: 'Ras el Khaïmah',
      ru: 'Рас-эль-Хайма',
      tr: 'Resü\'l-Hayme',
      de: 'Ras al-Chaima'
    },
    'Fujairah': {
      en: 'Fujairah',
      ar: 'الفجيرة',
      fr: 'Fujaïrah',
      ru: 'Эль-Фуджайра',
      tr: 'Füceyre',
      de: 'Fudschaira'
    },
    'Umm Al Quwain': {
      en: 'Umm Al Quwain',
      ar: 'أم القيوين',
      fr: 'Oumm al Qaïwaïn',
      ru: 'Умм-эль-Кайвайн',
      tr: 'Ummül-Kayveyn',
      de: 'Umm al-Qaiwain'
    },
    'Al Ain': {
      en: 'Al Ain',
      ar: 'العين',
      fr: 'Al-Aïn',
      ru: 'Эль-Айн',
      tr: 'El Ayn',
      de: 'al-Ain'
    },
    'Doha': {
      en: 'Doha',
      ar: 'الدوحة',
      fr: 'Doha',
      ru: 'Доха',
      tr: 'Doha',
      de: 'Doha'
    },
    'Manama': {
      en: 'Manama',
      ar: 'المنامة',
      fr: 'Manama',
      ru: 'Манама',
      tr: 'Manama',
      de: 'Manama'
    },
    'Kuwait City': {
      en: 'Kuwait City',
      ar: 'مدينة الكويت',
      fr: 'Koweït (Ville)',
      ru: 'Эль-Кувейт',
      tr: 'Kuveyt Şehri',
      de: 'Kuwait-Stadt'
    },
    'Muscat': {
      en: 'Muscat',
      ar: 'مسقط',
      fr: 'Mascate',
      ru: 'Маскат',
      tr: 'Maskat',
      de: 'Maskat'
    },
    'Amman': {
      en: 'Amman',
      ar: 'عمّان',
      fr: 'Amman',
      ru: 'Амман',
      tr: 'Amman',
      de: 'Amman'
    },
    'Beirut': {
      en: 'Beirut',
      ar: 'بيروت',
      fr: 'Beyrouth',
      ru: 'Бейрут',
      tr: 'Beyrut',
      de: 'Beirut'
    },
    'London': {
      en: 'London',
      ar: 'لندن',
      fr: 'Londres',
      ru: 'Лондон',
      tr: 'Londra',
      de: 'London'
    },
    'Manchester': {
      en: 'Manchester',
      ar: 'مانشستر',
      fr: 'Manchester',
      ru: 'Манчестер',
      tr: 'Manchester',
      de: 'Manchester'
    },
    'Birmingham': {
      en: 'Birmingham',
      ar: 'برمنغهام',
      fr: 'Birmingham',
      ru: 'Бирмингем',
      tr: 'Birmingham',
      de: 'Birmingham'
    },
    'New York': {
      en: 'New York',
      ar: 'نيويورك',
      fr: 'New York',
      ru: 'Нью-Йорк',
      tr: 'New York',
      de: 'New York'
    },
    'Chicago': {
      en: 'Chicago',
      ar: 'شيكاغو',
      fr: 'Chicago',
      ru: 'Чикаго',
      tr: 'Chicago',
      de: 'Chicago'
    },
    'Los Angeles': {
      en: 'Los Angeles',
      ar: 'لوس أنجلوس',
      fr: 'Los Angeles',
      ru: 'Лос-Анджелес',
      tr: 'Los Angeles',
      de: 'Los Angeles'
    },
    'Houston': {
      en: 'Houston',
      ar: 'هيوستن',
      fr: 'Houston',
      ru: 'Хьюстон',
      tr: 'Houston',
      de: 'Houston'
    },

    // -------------------------------------------------------------
    // Additional Standardized Cities (Egypt, Gulf & Levant)
    // -------------------------------------------------------------
    '15th May City': { en: '15th of May City', ar: 'مدينة 15 مايو', fr: 'Ville du 15 Mai', ru: 'Город 15 Мая', tr: '15 Mayıs Şehri', de: 'Stadt des 15. Mai' },
    '1st Settlement': { en: '1st Settlement', ar: 'التجمع الأول', fr: '1er Rassemblement', ru: '1-й Сеттлмент', tr: '1. Bölge', de: '1. Siedlung' },
    '3rd Settlement': { en: '3rd Settlement', ar: 'التجمع الثالث', fr: '3e Rassemblement', ru: '3-й Сеттлмент', tr: '3. Bölge', de: '3. Siedlung' },
    'Giza Square': { en: 'Giza Square', ar: 'ميدان الجيزة', fr: 'Place de Gizeh', ru: 'Площадь Гиза', tr: 'Gize Meydanı', de: 'Gizeh-Platz' },
    'Imbaba': { en: 'Imbaba', ar: 'إمبابة', fr: 'Imbaba', ru: 'Имбаба', tr: 'İmbaba', de: 'Imbaba' },
    'Embaba': { en: 'Imbaba', ar: 'إمبابة', fr: 'Imbaba', ru: 'Имбаба', tr: 'İmbaba', de: 'Imbaba' },
    'Port Fouad': { en: 'Port Fouad', ar: 'بورفؤاد', fr: 'Port-Fouad', ru: 'Порт-Фуад', tr: 'Port Fuad', de: 'Port Fuad' },
    'PortTawfik': { en: 'Port Tawfik', ar: 'بورتوفيق', fr: 'Port Tewfik', ru: 'Порт-Тауфик', tr: 'Port Tevfik', de: 'Port Taufiq' },
    'Al Ayat': { en: 'Al Ayat', ar: 'العياط', fr: 'Al Ayat', ru: 'Эль-Аят', tr: 'El Ayat', de: 'al-Ayat' },
    'Al Arish': { en: 'Arish', ar: 'العريش', fr: 'El-Arich', ru: 'Эль-Ариш', tr: 'Ariş', de: 'al-Arisch' },
    'Agamy': { en: 'Agami', ar: 'العجمي', fr: 'Agami', ru: 'Агами', tr: 'Agami', de: 'Agami' },
    'Agouza': { en: 'Agouza', ar: 'العجوزة', fr: 'Agouza', ru: 'Агуза', tr: 'Agouza', de: 'Agouza' },
    'Ain Shams': { en: 'Ain Shams', ar: 'عين شمس', fr: 'Aïn Chams', ru: 'Айн-Шамс', tr: 'Ayn Şems', de: 'Ain Schams' },
    'Ain Sokhna': { en: 'Ain Sokhna', ar: 'العين السخنة', fr: 'Ain Soukhna', ru: 'Айн-Сохна', tr: 'Ayn Suhna', de: 'Ain Suchna' },
    'Badr City': { en: 'Badr City', ar: 'مدينة بدر', fr: 'Ville de Badr', ru: 'Город Бадр', tr: 'Bedir Şehri', de: 'Badr-Stadt' },
    'Banha': { en: 'Banha', ar: 'بنها', fr: 'Benha', ru: 'Бенха', tr: 'Benha', de: 'Banha' },
    'Bani Suef': { en: 'Beni Suef', ar: 'بني سويف', fr: 'Beni Souef', ru: 'Бени-Суэйف', tr: 'Beni Suef', de: 'Bani Suwaif' },
    'Borg Al Arab': { en: 'Borg El Arab', ar: 'برج العرب', fr: 'Borg El Arab', ru: 'Борг-эль-Араб', tr: 'Burc el-Arap', de: 'Burdsch al-Arab' },
    'Damanhour': { en: 'Damanhur', ar: 'دمنهور', fr: 'Damanhour', ru: 'Даманхур', tr: 'Damanhur', de: 'Damanhur' },
    'Damietta': { en: 'Damietta', ar: 'دمياط', fr: 'Damiette', ru: 'Дамиетта', tr: 'Dimyat', de: 'Damiette' },
    'Edfu': { en: 'Edfu', ar: 'إدفو', fr: 'Edfou', ru: 'Эдфу', tr: 'Edfu', de: 'Edfu' },
    'Eddfo': { en: 'Edfu', ar: 'إدفو', fr: 'Edfou', ru: 'Эдфу', tr: 'Edfu', de: 'Edfu' },
    'El Gouna': { en: 'El Gouna', ar: 'الجونة', fr: 'El Gouna', ru: 'Эль-Гуна', tr: 'El Gouna', de: 'El Gouna' },
    'El Khanka': { en: 'El Khanka', ar: 'الخانكة', fr: 'El Khanka', ru: 'Эль-Ханка', tr: 'El Hanka', de: 'al-Chanka' },
    'El Rehab City': { en: 'Al Rehab City', ar: 'مدينة الرحاب', fr: 'Ville d\'Al-Rehab', ru: 'Город Эль-Рехаб', tr: 'Rehab Şehri', de: 'al-Rehab-Stadt' },
    'Faisal': { en: 'Faisal', ar: 'فيصل', fr: 'Faisal', ru: 'Фейсал', tr: 'Faysal', de: 'Faisal' },
    'Fakous': { en: 'Faqous', ar: 'فاقوس', fr: 'Faqous', ru: 'Факус', tr: 'Fakus', de: 'Faqus' },
    'Faqous': { en: 'Faqous', ar: 'فاقوس', fr: 'Faqous', ru: 'Факус', tr: 'Fakus', de: 'Faqus' },
    'Fayoum': { en: 'Faiyum', ar: 'الفيوم', fr: 'Fayoum', ru: 'Файюм', tr: 'Feyyum', de: 'Faiyum' },
    'Gerga': { en: 'Girga', ar: 'جرجا', fr: 'Girga', ru: 'Гирга', tr: 'Circe', de: 'Girga' },
    'gerga': { en: 'Girga', ar: 'جرجا', fr: 'Girga', ru: 'Гирга', tr: 'Circe', de: 'Girga' },
    'Hadayek Al Ahram': { en: 'Hadayek Al Ahram', ar: 'حدائق الأهرام', fr: 'Hadayek Al Ahram', ru: 'Хадайек аль-Ахрам', tr: 'Hadayek Al Ahram', de: 'Hadayek al-Ahram' },
    'Haram': { en: 'Al Haram', ar: 'الهرم', fr: 'Al Haram', ru: 'Эль-Харам', tr: 'El Haram', de: 'al-Haram' },
    'Helwan': { en: 'Helwan', ar: 'حلوان', fr: 'Hélouan', ru: 'Хелуан', tr: 'Helvan', de: 'Helwan' },
    'Kafr Al Sheikh': { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', fr: 'Kafr el-Cheik', ru: 'Кафр-эш-Шейх', tr: 'Kefr el-Şeyh', de: 'Kafr asch-Schaich' },
    'Kafr El Sheikh': { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', fr: 'Kafr el-Cheik', ru: 'Кафр-эш-Шейх', tr: 'Kefr el-Şeyh', de: 'Kafr asch-Schaich' },
    'Kafr al sheikh': { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', fr: 'Kafr el-Cheik', ru: 'Кафр-эш-Шейх', tr: 'Kefr el-Şeyh', de: 'Kafr asch-Schaich' },
    'Kafr El Zayat': { en: 'Kafr El Zayat', ar: 'كفر الزيات', fr: 'Kafr El Zayat', ru: 'Кафр-эз-Зайят', tr: 'Kefr ez-Zeyyat', de: 'Kafr az-Zayyat' },
    'Kafr Sakr': { en: 'Kafr Saqr', ar: 'كفر صقر', fr: 'Kafr Saqr', ru: 'Кафр-Сакр', tr: 'Kefr Sakr', de: 'Kafr Saqr' },
    'Kafr Saqr': { en: 'Kafr Saqr', ar: 'كفر صقر', fr: 'Kafr Saqr', ru: 'Кафр-Сакр', tr: 'Kefr Sakr', de: 'Kafr Saqr' },
    'Kerdasa': { en: 'Kerdasa', ar: 'كرداسة', fr: 'Kerdassa', ru: 'Кердаса', tr: 'Kirdase', de: 'Kirdasa' },
    'Koum Hamada': { en: 'Kom Hamada', ar: 'كوم حمادة', fr: 'Kom Hamada', ru: 'Ком-Хамада', tr: 'Kom Hamada', de: 'Kom Hamada' },
    'Koum Ombo': { en: 'Kom Ombo', ar: 'كوم أمبو', fr: 'Kôm Ombo', ru: 'Ком-Омбо', tr: 'Kom Ombo', de: 'Kom Ombo' },
    'Mallawi': { en: 'Mallawi', ar: 'ملوي', fr: 'Mallaoui', ru: 'Маллави', tr: 'Mellavi', de: 'Mallawi' },
    'Malawi': { en: 'Mallawi', ar: 'ملوي', fr: 'Mallaoui', ru: 'Маллави', tr: 'Mellavi', de: 'Mallawi' },
    'Manzala': { en: 'El Manzala', ar: 'المنزلة', fr: 'El Manzala', ru: 'Эль-Манзала', tr: 'Menzile', de: 'al-Manzala' },
    'Marsa Alam': { en: 'Marsa Alam', ar: 'مرسى علم', fr: 'Marsa Alam', ru: 'Марса-эль-Алам', tr: 'Marsa Alam', de: 'Marsa Alam' },
    'Marsa Matrouh': { en: 'Marsa Matruh', ar: 'مرسى مطروح', fr: 'Marsa Matruh', ru: 'Мерса-Матрух', tr: 'Mersa Matruh', de: 'Marsa Matruh' },
    'Mataria': { en: 'El Matareya', ar: 'المطرية', fr: 'El Matareya', ru: 'Эль-Матария', tr: 'Matariye', de: 'al-Matariyya' },
    'Minya': { en: 'Minya', ar: 'المنيا', fr: 'Al-Minya', ru: 'Эль-Минья', tr: 'Minye', de: 'al-Minya' },
    'Menia': { en: 'Minya', ar: 'المنيا', fr: 'Al-Minya', ru: 'Эль-Минья', tr: 'Minye', de: 'al-Minya' },
    'Mit Ghamr': { en: 'Mit Ghamr', ar: 'ميت غمر', fr: 'Mit Ghamr', ru: 'Мит-Гамр', tr: 'Mit Gamr', de: 'Mit Ghamr' },
    'Mokatam': { en: 'Mokattam', ar: 'المقطم', fr: 'Mokattam', ru: 'Мокаттам', tr: 'Mukattam', de: 'al-Muqattam' },
    'Mostorod': { en: 'Mostorod', ar: 'مسطرد', fr: 'Mostorod', ru: 'Мостород', tr: 'Mostorod', de: 'Mostorod' },
    'Nag Hammadi': { en: 'Nag Hammadi', ar: 'نجع حمادي', fr: 'Nag Hammadi', ru: 'Наг-Хаммади', tr: 'Nac Hammadi', de: 'Nag Hammadi' },
    'Nasser City': { en: 'Nasser City', ar: 'مدينة ناصر', fr: 'Ville de Nasser', ru: 'Город Насер', tr: 'Nasır Şehri', de: 'Nasser-Stadt' },
    'New Damietta': { en: 'New Damietta', ar: 'دمياط الجديدة', fr: 'Nouvelle-Damiette', ru: 'Новая Дамиетта', tr: 'Yeni Dimyat', de: 'Neu-Damiette' },
    'New Minya': { en: 'New Minya', ar: 'المنيا الجديدة', fr: 'Nouvelle-Minya', ru: 'Новая Минья', tr: 'Yeni Minye', de: 'Neu-Minya' },
    'Obour City': { en: 'Obour City', ar: 'مدينة العبور', fr: 'Ville d\'El Obour', ru: 'Город Эль-Убур', tr: 'Ubur Şehri', de: 'al-Ubur-Stadt' },
    'Qena': { en: 'Qena', ar: 'قنا', fr: 'Qena', ru: 'Кена', tr: 'Kina', de: 'Qina' },
    'Qous': { en: 'Qus', ar: 'قوص', fr: 'Qous', ru: 'Кус', tr: 'Kus', de: 'Qus' },
    'Ras Ghareeb': { en: 'Ras Gharib', ar: 'رأس غارب', fr: 'Ras Gharib', ru: 'Рас-Гариб', tr: 'Ras Garib', de: 'Ras Gharib' },
    'Rashid': { en: 'Rosetta (Rashid)', ar: 'رشيد', fr: 'Rosette', ru: 'Розетта (Рашид)', tr: 'Reşid', de: 'Rosette' },
    'Rasheed': { en: 'Rosetta (Rashid)', ar: 'رشيد', fr: 'Rosette', ru: 'Розетта (Рашид)', tr: 'Reşid', de: 'Rosette' },
    'Safaga': { en: 'Safaga', ar: 'سفاجا', fr: 'Safaga', ru: 'Сафага', tr: 'Safaga', de: 'Safaga' },
    'Samalout': { en: 'Samalut', ar: 'سمالوط', fr: 'Samalout', ru: 'Самалут', tr: 'Samalut', de: 'Samalut' },
    'Sohag': { en: 'Sohag', ar: 'سوهاج', fr: 'Sohag', ru: 'Сохаг', tr: 'Suhac', de: 'Sohag' },
    'South Sinai': { en: 'South Sinai', ar: 'جنوب سيناء', fr: 'Sinaï Sud', ru: 'Южный Синай', tr: 'Güney Sina', de: 'Süd-Sinai' },
    'South sinai': { en: 'South Sinai', ar: 'جنوب سيناء', fr: 'Sinaï Sud', ru: 'Южный Синай', tr: 'Güney Sina', de: 'Süd-Sinai' },
    'Tala': { en: 'Tala', ar: 'تلا', fr: 'Tala', ru: 'Тала', tr: 'Tala', de: 'Tala' },
    'Talkha': { en: 'Talkha', ar: 'طلخا', fr: 'Talkha', ru: 'Талха', tr: 'Talha', de: 'Talcha' },
    'Tama': { en: 'Tima', ar: 'طما', fr: 'Tima', ru: 'Тима', tr: 'Tima', de: 'Tima' },
    'tama': { en: 'Tima', ar: 'طما', fr: 'Tima', ru: 'Тима', tr: 'Tima', de: 'Tima' },
    'Toukh': { en: 'Toukh', ar: 'طوخ', fr: 'Toukh', ru: 'Тух', tr: 'Tuh', de: 'Tuch' },
    'Wadi Al Natroon': { en: 'Wadi El Natrun', ar: 'وادي النطرون', fr: 'Ouadi Natroun', ru: 'Вади-эн-Натрун', tr: 'Vadi Natrun', de: 'Wadi Natrun' },
    'Zamalek': { en: 'Zamalek', ar: 'الزمالك', fr: 'Zamalek', ru: 'Замалек', tr: 'Zamalek', de: 'Zamalek' },
    'Zefta': { en: 'Zifta', ar: 'زفتى', fr: 'Zifta', ru: 'Зифта', tr: 'Zifta', de: 'Zifta' },
    'Zahraa Al Maadi': { en: 'Zahraa El Maadi', ar: 'زهراء المعادي', fr: 'Zahraa El Maadi', ru: 'Захраа Эль-Маади', tr: 'Zahraa El Maadi', de: 'Zahraa al-Maadi' },
    'Zahraa El Maadi': { en: 'Zahraa El Maadi', ar: 'زهراء المعادي', fr: 'Zahraa El Maadi', ru: 'Захраа Эль-Маади', tr: 'Zahraa El Maadi', de: 'Zahraa al-Maadi' },
    'Abbasya': { en: 'Abbassia', ar: 'العباسية', fr: 'Abbassia', ru: 'Аббасия', tr: 'Abbasiye', de: 'Abbassia' },
    'Abdeen': { en: 'Abdeen', ar: 'عابدين', fr: 'Abdeen', ru: 'Абдин', tr: 'Abdin', de: 'Abdin' },
    'Abo Hammad': { en: 'Abu Hammad', ar: 'أبو حماد', fr: 'Abou Hammad', ru: 'Абу-Хаммад', tr: 'Ebu Hammad', de: 'Abu Hammad' },
    'Abo Kebeer': { en: 'Abu Kabir', ar: 'أبو كبير', fr: 'Abou Kabir', ru: 'Абу-Кабир', tr: 'Ebu Kebir', de: 'Abu Kabir' },
    'Abu Kebeer': { en: 'Abu Kabir', ar: 'أبو كبير', fr: 'Abou Kabir', ru: 'Абу-Кабир', tr: 'Ebu Kebir', de: 'Abu Kabir' },
    'Abo Keer': { en: 'Abu Qir', ar: 'أبو قير', fr: 'Aboukir', ru: 'Абу-Кир', tr: 'Ebukir', de: 'Abukir' },
    'Abo Simble': { en: 'Abu Simbel', ar: 'أبو سمبل', fr: 'Abou Simbel', ru: 'Абу-Симбел', tr: 'Ebu Simbel', de: 'Abu Simbel' },
    'Abo Teeg': { en: 'Abu Tig', ar: 'أبو تيج', fr: 'Abou Tig', ru: 'Абу-Тиг', tr: 'Ebu Tic', de: 'Abu Tig' },
    'Akhmim': { en: 'Akhmim', ar: 'أخميم', fr: 'Akhmîm', ru: 'Ахмим', tr: 'Ahmim', de: 'Achmim' },
    'Al Badrasheen': { en: 'Al Badrashein', ar: 'البدرشين', fr: 'Al-Badrashein', ru: 'Эль-Бадрашейн', tr: 'Bedraşeyin', de: 'al-Badraschain' },
    'Badrasheen': { en: 'Al Badrashein', ar: 'البدرشين', fr: 'Al-Badrashein', ru: 'Эль-Бадрашейн', tr: 'Bedraşeyin', de: 'al-Badraschain' },
    'Al Beliana': { en: 'Al Balyana', ar: 'البلينا', fr: 'Al-Balyana', ru: 'Эль-Бальяна', tr: 'Belyena', de: 'al-Balyana' },
    'Al Dabaa': { en: 'El Dabaa', ar: 'الضبعة', fr: 'El Dabaa', ru: 'Эд-Дабъа', tr: 'Daba', de: 'ad-Dabaa' },
    'Al Kharga': { en: 'El Kharga', ar: 'الخارجة', fr: 'Al-Kharga', ru: 'Эль-Харга', tr: 'Harge', de: 'al-Chariga' },
    'Al Mahla Al Kobra': { en: 'El Mahalla El Kubra', ar: 'المحلة الكبرى', fr: 'El-Mahalla El-Koubra', ru: 'Эль-Махалла-эль-Кубра', tr: 'Mahalla el-Kübra', de: 'al-Mahalla al-Kubra' },
    'Al Manial': { en: 'El Manial', ar: 'المنيل', fr: 'El-Manyal', ru: 'Эль-Маньяль', tr: 'Manyal', de: 'al-Manyal' },
    'Al Qalg': { en: 'Al Qalag', ar: 'القلج', fr: 'Al Qalag', ru: 'Эль-Калаг', tr: 'Kalac', de: 'al-Qaladsch' },
    'Al Sadat': { en: 'Sadat City', ar: 'مدينة السادات', fr: 'Ville de Sadate', ru: 'Город Садат', tr: 'Sedat Şehri', de: 'Sadat-Stadt' },
    'Al Shourook': { en: 'Al Shorouk', ar: 'مدينة الشروق', fr: 'Al Shorouk', ru: 'Эш-Шурук', tr: 'Şuruk Şehri', de: 'asch-Schuruq' },
    'Armant': { en: 'Armant', ar: 'أرمنت', fr: 'Armant', ru: 'Армант', tr: 'Armant', de: 'Armant' },
    'Ashmon': { en: 'Ashmoun', ar: 'أشمون', fr: 'Achmoun', ru: 'Ашмун', tr: 'Eşmun', de: 'Aschmun' },
    'Atfeeh': { en: 'Atfih', ar: 'أطفيح', fr: 'Atfih', ru: 'Атфих', tr: 'Atfih', de: 'Atfih' },
    'Awseem': { en: 'Oseem', ar: 'أوسيم', fr: 'Osim', ru: 'Усим', tr: 'Usim', de: 'Usim' },
    'Basyoun': { en: 'Basyoun', ar: 'بسيون', fr: 'Basyoun', ru: 'Басьюн', tr: 'Besyun', de: 'Basyun' },
    'Beba': { en: 'Biba', ar: 'ببا', fr: 'Biba', ru: 'Беба', tr: 'Biba', de: 'Biba' },
    'Belbis': { en: 'Bilbeis', ar: 'بلبيس', fr: 'Bilbéis', ru: 'Бильбейс', tr: 'Bilbeys', de: 'Bilbais' },
    'Belkas': { en: 'Bilqas', ar: 'بلقاس', fr: 'Belqas', ru: 'Билькас', tr: 'Bilkâs', de: 'Bilqas' },
    'Dekernis': { en: 'Dikirnis', ar: 'دكرنس', fr: 'Dikirnis', ru: 'Дикирнис', tr: 'Dikirnis', de: 'Dikirnis' },
    'Desouk': { en: 'Desouk', ar: 'دسوق', fr: 'Dessouk', ru: 'Десук', tr: 'Desuk', de: 'Disuq' },
    'Edku': { en: 'Idku', ar: 'إدكو', fr: 'Edkou', ru: 'Идку', tr: 'İdku', de: 'Idku' },
    'El Daher': { en: 'El Daher', ar: 'الظاهر', fr: 'El Daher', ru: 'Эз-Захир', tr: 'El Zahir', de: 'az-Zahir' },
    'El Marg': { en: 'El Marg', ar: 'المرج', fr: 'El Marg', ru: 'Эль-Марг', tr: 'El Marc', de: 'al-Mardsch' },
    'El Warrak': { en: 'El Warraq', ar: 'الوراق', fr: 'El Warraq', ru: 'Эль-Варрак', tr: 'El Varrak', de: 'al-Warraq' },
    'El Zeitoun': { en: 'El Zeitoun', ar: 'الزيتون', fr: 'El-Zeitoun', ru: 'Эль-Зейтун', tr: 'Zeytun', de: 'az-Zaitun' },
    'Essna': { en: 'Esna', ar: 'إسنا', fr: 'Esna', ru: 'Эсна', tr: 'İsna', de: 'Esna' },
    'Faraskour': { en: 'Faraskur', ar: 'فارسكور', fr: 'Faraskour', ru: 'Фараскур', tr: 'Faraskur', de: 'Faraskur' },
    'Hadayek October': { en: 'October Gardens', ar: 'حدائق أكتوبر', fr: 'Jardins d\'Octobre', ru: 'Сады Октября', tr: 'Ekim Bahçeleri', de: 'Oktober-Gärten' },
    'Kafr Saad': { en: 'Kafr Saad', ar: 'كفر سعد', fr: 'Kafr Saad', ru: 'Кафр-Саад', tr: 'Kefr Saad', de: 'Kafr Saad' },
    'Kafr Shoukr': { en: 'Kafr Shukr', ar: 'كفر شكر', fr: 'Kafr Choukr', ru: 'Кафр-Шукр', tr: 'Kefr Şükür', de: 'Kafr Schukr' },
    'Kaha': { en: 'Qaha', ar: 'قها', fr: 'Qaha', ru: 'Каха', tr: 'Kaha', de: 'Qaha' },
    'Khanka': { en: 'El Khanka', ar: 'الخانكة', fr: 'El Khanka', ru: 'Эль-Ханка', tr: 'El Hanka', de: 'al-Chanka' },
    'Madinty': { en: 'Madinaty', ar: 'مدينتي', fr: 'Madinaty', ru: 'Мадинати', tr: 'Madinaty', de: 'Madinaty' },
    'Maghagha': { en: 'Maghagha', ar: 'مغاغة', fr: 'Maghagha', ru: 'Магага', tr: 'Megağa', de: 'Maghagha' },
    'New Nozha': { en: 'El Nozha El Gedida', ar: 'النزهة الجديدة', fr: 'Nouvelle Nozha', ru: 'Новая Нузха', tr: 'Yeni Nüzhe', de: 'Neu-Nuzha' },
    'New Salhia': { en: 'New Salhia', ar: 'الصالحية الجديدة', fr: 'Nouvelle Salhia', ru: 'Новая Сальхия', tr: 'Yeni Salihiye', de: 'Neu-Salhia' },
    'North Coast': { en: 'North Coast (Sahel)', ar: 'الساحل الشمالي', fr: 'Côte Nord', ru: 'Северное побережье', tr: 'Kuzey Sahili', de: 'Nordküste' },
    'Qaliub': { en: 'Qalyub', ar: 'قليوب', fr: 'Qalyoub', ru: 'Кальюб', tr: 'Kalyub', de: 'Qalyub' },
    'Quesna': { en: 'Quesna', ar: 'قويسنا', fr: 'Quesna', ru: 'Кувесна', tr: 'Kuesna', de: 'Quwaisina' },
    'Ramsis': { en: 'Ramses', ar: 'رمسيس', fr: 'Ramsès', ru: 'Рамзес', tr: 'Ramses', de: 'Ramses' },
    'Rod El Farag': { en: 'Rod El Farag', ar: 'روض الفرج', fr: 'Rod El Farag', ru: 'Род-эль-Фараг', tr: 'Rod el-Farag', de: 'Raud al-Faradsch' },
    'Samanoud': { en: 'Samanoud', ar: 'سمنود', fr: 'Samanoud', ru: 'Саманнуд', tr: 'Semennud', de: 'Samannud' },
    'Sayeda Zainab': { en: 'Sayeda Zeinab', ar: 'السيدة زينب', fr: 'Sayeda Zeinab', ru: 'Сейида Зейнаб', tr: 'Seyyide Zeynep', de: 'Sayyida Zainab' },
    'Senbelaween': { en: 'El Senbellawein', ar: 'السنبلاوين', fr: 'Simbellaouein', ru: 'Эс-Симбиллавейн', tr: 'Sinbilaweyn', de: 'as-Sinbillawain' },
    'Shebein El Kawm': { en: 'Shibin El Kom', ar: 'شبين الكوم', fr: 'Chibin El Kom', ru: 'Шибин-эль-Ком', tr: 'Şibin el-Kevm', de: 'Schibin al-Kaum' },
    'Tahta': { en: 'Tahta', ar: 'طهطا', fr: 'Tahta', ru: 'Тахта', tr: 'Tahta', de: 'Tahta' },

    // Kuwait Localities
    'Hawally': { en: 'Hawalli', ar: 'حولي', fr: 'Hawalli', ru: 'Хавалли', tr: 'Havalli', de: 'Hawalli' },
    'Farwaniya': { en: 'Farwaniya', ar: 'الفروانية', fr: 'Farwaniya', ru: 'Эль-Фарвания', tr: 'Fervaniye', de: 'al-Farwaniyya' },
    'FARWANIYA': { en: 'Farwaniya', ar: 'الفروانية', fr: 'Farwaniya', ru: 'Эль-Фарвания', tr: 'Fervaniye', de: 'al-Farwaniyya' },
    'Salmiya': { en: 'Salmiya', ar: 'السالمية', fr: 'Salmiya', ru: 'Эс-Сальмия', tr: 'Salmiye', de: 'as-Salmiyya' },
    'Al Ahmadi': { en: 'Al Ahmadi', ar: 'الأحمدي', fr: 'Al Ahmadi', ru: 'Эль-Ахмади', tr: 'Ahmedi', de: 'al-Ahmadi' },
    'Jahra': { en: 'Al Jahra', ar: 'الجهراء', fr: 'Al Jahra', ru: 'Эль-Джахра', tr: 'Cehre', de: 'al-Dschahra' },
    'Al Jahra': { en: 'Al Jahra', ar: 'الجهراء', fr: 'Al Jahra', ru: 'Эль-Джахра', tr: 'Cehre', de: 'al-Dschahra' },
    'Mubarak Al Kabeer': { en: 'Mubarak Al-Kabeer', ar: 'مبارك الكبير', fr: 'Mubarak Al-Kabeer', ru: 'Мубарак аль-Кабир', tr: 'Mübarek El Kebir', de: 'Mubarak al-Kabir' },
    'Fahaheel': { en: 'Fahaheel', ar: 'الفحيحيل', fr: 'Fahaheel', ru: 'Эль-Фахахиль', tr: 'Fahaheel', de: 'al-Fahaihil' },
    'Jabriya': { en: 'Jabriya', ar: 'الجابرية', fr: 'Jabriya', ru: 'Эль-Джабрия', tr: 'Cabriye', de: 'al-Dschabriyya' },
    'Sabah Al Salem': { en: 'Sabah Al Salem', ar: 'صباح السالم', fr: 'Sabah Al-Salem', ru: 'Сабах ас-Салем', tr: 'Sabah el-Salim', de: 'Sabah al-Salim' },
    'Khaitan': { en: 'Khaitan', ar: 'خيطان', fr: 'Khaitan', ru: 'Хайтан', tr: 'Haytan', de: 'Chaitan' },
    'Mahboula': { en: 'Mahboula', ar: 'المهبولة', fr: 'Mahboula', ru: 'Махбула', tr: 'Mahbula', de: 'Mahboula' },
    'Mangaf': { en: 'Mangaf', ar: 'المنقف', fr: 'Mangaf', ru: 'Мангаф', tr: 'Mangaf', de: 'al-Manqaf' },
    'Fintas': { en: 'Fintas', ar: 'الفنطاس', fr: 'Fintas', ru: 'Финтас', tr: 'Fintas', de: 'al-Fintas' },
    'Sharq': { en: 'Sharq', ar: 'الشرق', fr: 'Chark', ru: 'Шарк', tr: 'Şark', de: 'Scharq' },

    // Bahrain Localities
    'Muharraq': { en: 'Muharraq', ar: 'المحرق', fr: 'Muharraq', ru: 'Мухаррак', tr: 'Muharrak', de: 'al-Muharraq' },
    'Riffa': { en: 'Riffa', ar: 'الرفاع', fr: 'Riffa', ru: 'Риффа', tr: 'Riffa', de: 'ar-Rifa' },
    'RIFFA': { en: 'Riffa', ar: 'الرفاع', fr: 'Riffa', ru: 'Риффа', tr: 'Riffa', de: 'ar-Rifa' },
    'Hamad Town': { en: 'Hamad Town', ar: 'مدينة حمد', fr: 'Madinat Hamad', ru: 'Хамад-Таун', tr: 'Hamad Şehri', de: 'Madinat Hamad' },
    'HAMAD TOWN': { en: 'Hamad Town', ar: 'مدينة حمد', fr: 'Madinat Hamad', ru: 'Хамад-Таун', tr: 'Hamad Şehri', de: 'Madinat Hamad' },
    'Madinat Hamad': { en: 'Hamad Town', ar: 'مدينة حمد', fr: 'Madinat Hamad', ru: 'Хамад-Таун', tr: 'Hamad Şehri', de: 'Madinat Hamad' },
    'Isa Town': { en: 'Isa Town', ar: 'مدينة عيسى', fr: 'Madinat Isa', ru: 'Иса-Таун', tr: 'İsa Şehri', de: 'Madinat Isa' },
    'ISA TOWN': { en: 'Isa Town', ar: 'مدينة عيسى', fr: 'Madinat Isa', ru: 'Иса-Таун', tr: 'İsa Şehri', de: 'Madinat Isa' },
    'Budaiya': { en: 'Budaiya', ar: 'البديع', fr: 'Budaiya', ru: 'Будайя', tr: 'Budeyye', de: 'Budaiya' },
    'BUDAIYA': { en: 'Budaiya', ar: 'البديع', fr: 'Budaiya', ru: 'Будайя', tr: 'Budeyye', de: 'Budaiya' },
    'Hidd': { en: 'Al Hidd', ar: 'الحد', fr: 'Al Hidd', ru: 'Эль-Хидд', tr: 'Hidd', de: 'al-Hidd' },
    'HIDD': { en: 'Al Hidd', ar: 'الحد', fr: 'Al Hidd', ru: 'Эль-Хидд', tr: 'Hidd', de: 'al-Hidd' },
    'Juffair': { en: 'Juffair', ar: 'الجفير', fr: 'Juffair', ru: 'Джуффейр', tr: 'Cüffeyr', de: 'Dschuffair' },
    'Seef': { en: 'Seef', ar: 'السيف', fr: 'Seef', ru: 'Сееф', tr: 'Seef', de: 'Seef' },
    'SEEF': { en: 'Seef', ar: 'السيف', fr: 'Seef', ru: 'Сееф', tr: 'Seef', de: 'Seef' },
    'Saar': { en: 'Saar', ar: 'سار', fr: 'Saar', ru: 'Саар', tr: 'Saar', de: 'Saar' },
    'Sitra': { en: 'Sitra', ar: 'سترة', fr: 'Sitra', ru: 'Ситра', tr: 'Sitra', de: 'Sitra' },
    'Tubli': { en: 'Tubli', ar: 'توبلي', fr: 'Tubli', ru: 'Тубли', tr: 'Tubli', de: 'Tubli' },
    'Zinj': { en: 'Zinj', ar: 'الزنج', fr: 'Zinj', ru: 'Зиндж', tr: 'Zinc', de: 'Zindsch' },
    'ZINJ': { en: 'Zinj', ar: 'الزنج', fr: 'Zinj', ru: 'Зиндж', tr: 'Zinc', de: 'Zindsch' },
    'Aali': { en: 'A\'ali', ar: 'عالي', fr: 'A\'ali', ru: 'Аали', tr: 'Aali', de: 'Aali' },
    'A\'Ali': { en: 'A\'ali', ar: 'عالي', fr: 'A\'ali', ru: 'Аали', tr: 'Aali', de: 'Aali' },
    'A\'ali': { en: 'A\'ali', ar: 'عالي', fr: 'A\'ali', ru: 'Аали', tr: 'Aali', de: 'Aali' },
    'Arad': { en: 'Arad', ar: 'عراد', fr: 'Arad', ru: 'Арад', tr: 'Arad', de: 'Arad' },
    'Busaiteen': { en: 'Busaiteen', ar: 'البسيتين', fr: 'Bousaïtin', ru: 'Бусайтин', tr: 'Buseytin', de: 'Busaiteen' },
    'Sanad': { en: 'Sanad', ar: 'سند', fr: 'Sanad', ru: 'Санад', tr: 'Sanad', de: 'Sanad' },
    'Salmabad': { en: 'Salmabad', ar: 'سلماباد', fr: 'Salmabad', ru: 'Сальмабад', tr: 'Selmabad', de: 'Salmabad' },
    'Zayed Town': { en: 'Zayed Town', ar: 'مدينة زايد', fr: 'Ville de Zayed', ru: 'Заид-Таун', tr: 'Zayed Şehri', de: 'Zayed-Stadt' },

    // Lebanon Localities
    'Tripoli': { en: 'Tripoli', ar: 'طرابلس', fr: 'Tripoli', ru: 'Триполи', tr: 'Trablusşam', de: 'Tripolis' },
    'TRIPOLI': { en: 'Tripoli', ar: 'طرابلس', fr: 'Tripoli', ru: 'Триполи', tr: 'Trablusşam', de: 'Tripolis' },
    'Saida': { en: 'Sidon (Saida)', ar: 'صيدا', fr: 'Saïda', ru: 'Сайда', tr: 'Sayda', de: 'Sidon' },
    'SAIDA': { en: 'Sidon (Saida)', ar: 'صيدا', fr: 'Saïda', ru: 'Сайда', tr: 'Sayda', de: 'Sidon' },
    'Sour': { en: 'Tyre (Sour)', ar: 'صور', fr: 'Tyr', ru: 'Сур (Тир)', tr: 'Sur', de: 'Tyros' },
    'Tyr': { en: 'Tyre (Sour)', ar: 'صور', fr: 'Tyr', ru: 'Сур (Тир)', tr: 'Sur', de: 'Tyros' },
    'Zahle': { en: 'Zahle', ar: 'زحلة', fr: 'Zahlé', ru: 'Захле', tr: 'Zahle', de: 'Zahle' },
    'Jounieh': { en: 'Jounieh', ar: 'جونيه', fr: 'Jounieh', ru: 'Джуния', tr: 'Cuniye', de: 'Dschuniyah' },
    'Jbeil': { en: 'Byblos (Jbeil)', ar: 'جبيل', fr: 'Byblos', ru: 'Джубейль (Библ)', tr: 'Cübeyl', de: 'Byblos' },
    'Baabda': { en: 'Baabda', ar: 'بعبدا', fr: 'Baabda', ru: 'Баабда', tr: 'Baabda', de: 'Baabda' },
    'Baalbeck': { en: 'Baalbek', ar: 'بعلبك', fr: 'Baalbeck', ru: 'Баальбек', tr: 'Baalbek', de: 'Baalbek' },
    'Nabatieh': { en: 'Nabatieh', ar: 'النبطية', fr: 'Nabatieh', ru: 'Эн-Набатия', tr: 'Nebatiye', de: 'an-Nabatiyya' },
    'Zgharta': { en: 'Zgharta', ar: 'زغرتا', fr: 'Zghorta', ru: 'Згарта', tr: 'Zgarta', de: 'Zgharta' },
    'Batroun': { en: 'Batroun', ar: 'البترون', fr: 'Batroun', ru: 'Батрун', tr: 'Batrun', de: 'Batrun' },
    'Aley': { en: 'Aley', ar: 'عاليه', fr: 'Aley', ru: 'Алей', tr: 'Aley', de: 'Aley' },
    'Chouf': { en: 'Chouf', ar: 'الشوف', fr: 'Chouf', ru: 'Шуф', tr: 'Şuf', de: 'Schuf' },
    'Sin El Fil': { en: 'Sin El Fil', ar: 'سن الفيل', fr: 'Sin El Fil', ru: 'Син-эль-Филь', tr: 'Sin el-Fil', de: 'Sin al-Fil' },
    'Bourj Hammoud': { en: 'Bourj Hammoud', ar: 'برج حمود', fr: 'Bourj Hammoud', ru: 'Бурдж-Хаммуд', tr: 'Burç Hammud', de: 'Burdj Hammud' },
    'Hazmieh': { en: 'Hazmieh', ar: 'الحازمية', fr: 'Hazmieh', ru: 'Хазмие', tr: 'Hazmiye', de: 'Hazmiyeh' },
    'Hadath': { en: 'Hadath', ar: 'الحدث', fr: 'Hadath', ru: 'Хадат', tr: 'Hadet', de: 'Hadath' },

    // Oman Localities
    'Salalah': { en: 'Salalah', ar: 'صلالة', fr: 'Salalah', ru: 'Салала', tr: 'Salalah', de: 'Salala' },
    'Sohar': { en: 'Sohar', ar: 'صحار', fr: 'Sohar', ru: 'Сухар', tr: 'Sohar', de: 'Sohar' },
    'Nizwa': { en: 'Nizwa', ar: 'نزوى', fr: 'Nizwa', ru: 'Низва', tr: 'Nizva', de: 'Nizwa' },
    'Sur': { en: 'Sur', ar: 'صور', fr: 'Sour', ru: 'Сур', tr: 'Sur', de: 'Sur' },
    'Seeb': { en: 'Seeb', ar: 'السيب', fr: 'Seeb', ru: 'Эс-Сиб', tr: 'Sib', de: 'as-Sib' },
    'Barka': { en: 'Barka', ar: 'بركاء', fr: 'Barka', ru: 'Барка', tr: 'Barka', de: 'Barka' },
    'Rustaq': { en: 'Rustaq', ar: 'الرستاق', fr: 'Rostaq', ru: 'Эр-Рустак', tr: 'Rüstak', de: 'ar-Rustaq' },
    'Buraimi': { en: 'Al Buraimi', ar: 'البريمي', fr: 'Al Buraimi', ru: 'Эль-Бурайми', tr: 'El Buraymi', de: 'al-Buraimi' },
    'Ibri': { en: 'Ibri', ar: 'عبري', fr: 'Ibri', ru: 'Ибри', tr: 'İbri', de: 'Ibri' },
    'Khasab': { en: 'Khasab', ar: 'خصب', fr: 'Khasab', ru: 'Хасаб', tr: 'Hasab', de: 'Chasab' },
    'Duqum': { en: 'Duqm', ar: 'الدقم', fr: 'Duqm', ru: 'Дукм', tr: 'Dukm', de: 'ad-Duqm' },

    // Qatar Localities
    'Al Rayyan': { en: 'Al Rayyan', ar: 'الريان', fr: 'Al Rayyan', ru: 'Эр-Райян', tr: 'El Reyyan', de: 'ar-Rayyan' },
    'Al Wakrah': { en: 'Al Wakrah', ar: 'الوكرة', fr: 'Al Wakrah', ru: 'Эль-Вакра', tr: 'El Vakra', de: 'al-Wakra' },
    'Al Wakra': { en: 'Al Wakrah', ar: 'الوكرة', fr: 'Al Wakrah', ru: 'Эль-Вакра', tr: 'El Vakra', de: 'al-Wakra' },
    'Al Khor': { en: 'Al Khor', ar: 'الخور', fr: 'Al Khor', ru: 'Эль-Хаур', tr: 'El Hor', de: 'al-Chaur' },
    'Al Ruwais': { en: 'Al Ruwais', ar: 'الرويس', fr: 'Ar Ru\'ays', ru: 'Эр-Рувайс', tr: 'Er-Ruveys', de: 'ar-Ruwais' },
    'Dukhan': { en: 'Dukhan', ar: 'دخان', fr: 'Dukhan', ru: 'Духан', tr: 'Duhan', de: 'Duchan' }
  }
};

// -------------------------------------------------------------
// 6. HEALTHCARE PROVIDER NAMES (Frontend-only verified translations)
// Canonical names remain intact in DB; this layer handles display localization
// -------------------------------------------------------------
export const PROVIDER_NAME_TRANSLATIONS = {
  'Alexandria University Hospitals': {
    en: 'Alexandria University Hospitals',
    ar: 'مستشفيات جامعة الإسكندرية',
    fr: 'Hôpitaux universitaires d\'Alexandrie',
    ru: 'Университетские больницы Александрии',
    tr: 'İskenderiye Üniversitesi Hastaneleri',
    de: 'Universitätskliniken Alexandria'
  },
  'Cairo University Hospitals': {
    en: 'Cairo University Hospitals',
    ar: 'مستشفيات جامعة القاهرة',
    fr: 'Hôpitaux universitaires du Caire',
    ru: 'Университетские больницы Каира',
    tr: 'Kahire Üniversitesi Hastaneleri',
    de: 'Universitätskliniken Kairo'
  },
  'Egyptian Red Crescent': {
    en: 'Egyptian Red Crescent',
    ar: 'الهلال الأحمر المصري',
    fr: 'Croissant-Rouge égyptien',
    ru: 'Египетский Красный Полумесяц',
    tr: 'Mısır Kızılayı',
    de: 'Ägyptischer Roter Halbmond'
  },
  'American University of Beirut Medical Center': {
    en: 'American University of Beirut Medical Center',
    ar: 'المركز الطبي للجامعة الأمريكية في بيروت',
    fr: 'Centre médical de l\'Université américaine de Beyrouth',
    ru: 'Медицинский центр Американского университета в Бейруте',
    tr: 'Beyrut Amerikan Üniversitesi Tıp Merkezi',
    de: 'Medizinisches Zentrum der Amerikanischen Universität Beirut'
  },
  'Arab Contractors Medical Center': {
    en: 'Arab Contractors Medical Center',
    ar: 'المركز الطبي للمقاولون العرب',
    fr: 'Centre médical des Arab Contractors',
    ru: 'Медицинский центр Араб Контракторс',
    tr: 'Arab Contractors Tıp Merkezi',
    de: 'Medizinisches Zentrum der Arab Contractors'
  },
  'Maadi Armed Forces Compound Hospital': {
    en: 'Maadi Armed Forces Compound Hospital',
    ar: 'مجمع مستشفيات القوات المسلحة بالمعادي',
    fr: 'Hôpital du complexe des forces armées de Maadi',
    ru: 'Больничный комплекс Вооружённых сил в Маади',
    tr: 'Maadi Silahlı Kuvvetler Kompleks Hastanesi',
    de: 'Militärkrankenhauskomplex Maadi'
  },
  'Al Mokhtabar Lab. ( Moamena Kamel )': {
    en: 'Al Mokhtabar Laboratories (Moamena Kamel)',
    ar: 'معامل المختبر (مؤمنة كامل)',
    fr: 'Laboratoires Al Mokhtabar (Moamena Kamel)',
    ru: 'Лаборатории Аль Мохтабар (Моамена Камель)',
    tr: 'Al Mokhtabar Laboratuvarları (Moamena Kamel)',
    de: 'Al Mokhtabar Labore (Moamena Kamel)'
  },
  'Al Mokhtabar Lab.': {
    en: 'Al Mokhtabar Laboratories',
    ar: 'معامل المختبر',
    fr: 'Laboratoires Al Mokhtabar',
    ru: 'Лаборатории Аль Мохтабар',
    tr: 'Al Mokhtabar Laboratuvarları',
    de: 'Al Mokhtabar Labore'
  },
  'Al Mokhtabar Scan Center': {
    en: 'Al Mokhtabar Scan Center',
    ar: 'مركز أشعة المختبر',
    fr: 'Centre de radiologie Al Mokhtabar',
    ru: 'Диагностический центр Аль Мохтабар',
    tr: 'Al Mokhtabar Görüntüleme Merkezi',
    de: 'Al Mokhtabar Scan-Zentrum'
  },
  'Al Borg Lab.': {
    en: 'Al Borg Laboratories',
    ar: 'معامل البرج',
    fr: 'Laboratoires Al Borg',
    ru: 'Лаборатории Аль Борг',
    tr: 'Al Borg Laboratuvarları',
    de: 'Al Borg Labore'
  },
  'Al Borg Scan': {
    en: 'Al Borg Scan Center',
    ar: 'مركز البرج سكان للأشعة',
    fr: 'Centre d\'imagerie Al Borg Scan',
    ru: 'Диагностический центр Аль Борг Скан',
    tr: 'Al Borg Scan Görüntüleme Merkezi',
    de: 'Al Borg Scan-Zentrum'
  },
  'Alfa Lab.': {
    en: 'Alfa Laboratories',
    ar: 'معامل ألفا',
    fr: 'Laboratoires Alfa',
    ru: 'Лаборатории Альфа',
    tr: 'Alfa Laboratuvarları',
    de: 'Alfa Labore'
  },
  'Alfa Laboratories': {
    en: 'Alfa Laboratories',
    ar: 'معامل ألفا',
    fr: 'Laboratoires Alfa',
    ru: 'Лаборатории Альфа',
    tr: 'Alfa Laboratuvarları',
    de: 'Alfa Labore'
  },
  'EL Ezaby Pharmacy': {
    en: 'El Ezaby Pharmacy',
    ar: 'صيدليات العزبي',
    fr: 'Pharmacie El Ezaby',
    ru: 'Аптека Эль Эзаби',
    tr: 'El Ezaby Eczanesi',
    de: 'El Ezaby Apotheke'
  },
  'El Ezaby Chain Pharmacies': {
    en: 'El Ezaby Chain Pharmacies',
    ar: 'سلسلة صيدليات العزبي',
    fr: 'Chaîne de pharmacies El Ezaby',
    ru: 'Сеть аптек Эль Эзаби',
    tr: 'El Ezaby Eczane Zinciri',
    de: 'El Ezaby Apothekenkette'
  },
  'Care Chain Pharmacies': {
    en: 'Care Chain Pharmacies',
    ar: 'صيدليات كير',
    fr: 'Pharmacies Care',
    ru: 'Сеть аптек Care',
    tr: 'Care Eczaneleri',
    de: 'Care Apotheken'
  },
  'Misr Pharmacy': {
    en: 'Misr Pharmacies',
    ar: 'صيدليات مصر',
    fr: 'Pharmacies Misr',
    ru: 'Аптеки Миср',
    tr: 'Mısır Eczaneleri',
    de: 'Misr Apotheken'
  },
  'Al Shams Lab.': {
    en: 'Al Shams Laboratories',
    ar: 'معامل الشمس',
    fr: 'Laboratoires Al Shams',
    ru: 'Лаборатории Аль Шамс',
    tr: 'Al Shams Laboratuvarları',
    de: 'Al Shams Labore'
  },
  'Royal Lab.': {
    en: 'Royal Laboratories',
    ar: 'معامل رويال',
    fr: 'Laboratoires Royal',
    ru: 'Лаборатории Роял',
    tr: 'Royal Laboratuvarları',
    de: 'Royal Labore'
  },
  'Cairo Scan Center': {
    en: 'Cairo Scan Center',
    ar: 'مركز كايرو سكان للأشعة والتحاليل',
    fr: 'Centre de radiologie Cairo Scan',
    ru: 'Диагностический центр Каир Скан',
    tr: 'Cairo Scan Görüntüleme Merkezi',
    de: 'Cairo Scan Zentrum'
  },
  'Techno Scan': {
    en: 'Techno Scan Center',
    ar: 'مركز تكنوسكان للأشعة',
    fr: 'Centre Techno Scan',
    ru: 'Диагностический центр Техно Скан',
    tr: 'Techno Scan Görüntüleme Merkezi',
    de: 'Techno Scan Zentrum'
  },
  'Nile Scan & Lab.': {
    en: 'Nile Scan & Lab',
    ar: 'نايل سكان ولاب',
    fr: 'Nile Scan & Lab',
    ru: 'Нイル Скан и Лаб',
    tr: 'Nile Scan & Lab',
    de: 'Nile Scan & Lab'
  },
  'Hassab Lab.': {
    en: 'Hassab Laboratories',
    ar: 'معامل حاسب',
    fr: 'Laboratoires Hassab',
    ru: 'Лаборатории Хассаб',
    tr: 'Hassab Laboratuvarları',
    de: 'Hassab Labore'
  },
  'Speed Lab.': {
    en: 'Speed Medical Laboratories',
    ar: 'معامل سبيد ميديكال',
    fr: 'Laboratoires Speed',
    ru: 'Лаборатории Спид',
    tr: 'Speed Laboratuvarları',
    de: 'Speed Labore'
  },
  'Dar Al Fouad Hospital': {
    en: 'Dar Al Fouad Hospital',
    ar: 'مستشفى دار الفؤاد',
    fr: 'Hôpital Dar Al Fouad',
    ru: 'Больница Дар Аль-Фуад',
    tr: 'Dar Al Fouad Hastanesi',
    de: 'Dar Al Fouad Krankenhaus'
  },
  'As-Salam International Hospital': {
    en: 'As-Salam International Hospital',
    ar: 'مستشفى السلام الدولي',
    fr: 'Hôpital international As-Salam',
    ru: 'Международная больница Ас-Салам',
    tr: 'As-Salam Uluslararası Hastanesi',
    de: 'Internationales As-Salam Krankenhaus'
  },
  'Saudi German Hospital': {
    en: 'Saudi German Hospital',
    ar: 'المستشفى السعودي الألماني',
    fr: 'Hôpital saoudien allemand',
    ru: 'Саудовско-немецкая больница',
    tr: 'Suudi Alman Hastanesi',
    de: 'Saudi-German-Krankenhaus'
  },
  'Andalusia Hospital': {
    en: 'Andalusia Hospital',
    ar: 'مستشفيات أندلسية',
    fr: 'Hôpital Andalusia',
    ru: 'Больница Андалусия',
    tr: 'Andalusia Hastanesi',
    de: 'Andalusia Krankenhaus'
  },
  'Cleopatra Hospital': {
    en: 'Cleopatra Hospital',
    ar: 'مستشفى كليوباترا',
    fr: 'Hôpital Cléopâtre',
    ru: 'Больница Клеопатра',
    tr: 'Kleopatra Hastanesi',
    de: 'Kleopatra Krankenhaus'
  },
  'Magrabi Eye and Ear Hospital': {
    en: 'Magrabi Eye and Ear Hospital',
    ar: 'مستشفى مغربي للعيون والأذن',
    fr: 'Hôpital ophtalmologique et ORL Magrabi',
    ru: 'Офтальмологическая и ЛОР больница Маграби',
    tr: 'Magrabi Göz ve KBB Hastanesi',
    de: 'Magrabi Augen- und Hals-Nasen-Ohren-Klinik'
  },
  'Magrabi Optical': {
    en: 'Magrabi Optical',
    ar: 'مغربي للبصريات',
    fr: 'Magrabi Optique',
    ru: 'Маграби Оптика',
    tr: 'Magrabi Optik',
    de: 'Magrabi Optik'
  },
  'Baraka Optics': {
    en: 'Baraka Optics',
    ar: 'بركة للبصريات',
    fr: 'Baraka Optique',
    ru: 'Барака Оптика',
    tr: 'Baraka Optik',
    de: 'Baraka Optik'
  },
  'Tabarak Hospital': {
    en: 'Tabarak Hospital',
    ar: 'مستشفى تبارك للأطفال والولادة',
    fr: 'Hôpital Tabarak',
    ru: 'Больница Табарак',
    tr: 'Tabarak Hastanesi',
    de: 'Tabarak Krankenhaus'
  },
  'Dawi Clinics Center': {
    en: 'Dawi Clinics',
    ar: 'عيادات داوي',
    fr: 'Cliniques Dawi',
    ru: 'Клиники Дави',
    tr: 'Dawi Klinikleri',
    de: 'Dawi Kliniken'
  },
  'First Dental Center Of Egypt': {
    en: 'First Dental Center of Egypt',
    ar: 'المركز الأول لطب وجراحة الأسنان بمصر',
    fr: 'Premier centre dentaire d\'Égypte',
    ru: 'Первый стоматологический центр Египта',
    tr: 'Mısır Birinci Diş Merkezi',
    de: 'Erstes Zahnmedizinisches Zentrum Ägyptens'
  },
  'Swiss Dental Center': {
    en: 'Swiss Dental Center',
    ar: 'المركز السويسري للأسنان',
    fr: 'Centre dentaire suisse',
    ru: 'Швейцарский стоматологический центр',
    tr: 'İsviçre Diş Merkezi',
    de: 'Schweizer Zahnzentrum'
  },
  'European Hospital': {
    en: 'European Hospital',
    ar: 'المستشفى الأوروبي',
    fr: 'Hôpital européen',
    ru: 'Европейская больница',
    tr: 'Avrupa Hastanesi',
    de: 'Europäisches Krankenhaus'
  },
  'German Medical Healthcare Corporation': {
    en: 'German Medical Healthcare Corporation',
    ar: 'المؤسسة الطبية الألمانية للرعاية الصحية',
    fr: 'Société médicale allemande de soins de santé',
    ru: 'Немецкая медицинская корпорация',
    tr: 'Alman Tıbbi Sağlık Şirketi',
    de: 'Deutsche Medizinische Gesundheitsgesellschaft'
  },
  'Eye Subspecialty Center': {
    en: 'Eye Subspecialty Center',
    ar: 'مركز عيون التخصصي',
    fr: 'Centre spécialisé en ophtalmologie',
    ru: 'Специализированный офтальмологический центр',
    tr: 'Göz İhtisas Merkezi',
    de: 'Spezialisiertes Augenzentrum'
  }
};

