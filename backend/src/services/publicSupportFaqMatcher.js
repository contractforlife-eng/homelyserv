const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

const normalizeArabic = (value) => value
  .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
  .replace(/\u0640/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي');

export function normalizeFaqText(text, language = 'en') {
  let value = String(text || '').toLocaleLowerCase(language === 'tr' ? 'tr' : undefined).normalize('NFKC');
  if (language === 'ar' || /\p{Script=Arabic}/u.test(value)) value = normalizeArabic(value);
  else value = value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');
  return value
    .replace(/[’'`´]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const intentAliases = {
  en:{
    how:['how homelyserv works','how does homelyserv work','what is homelyserv','tell me about homelyserv'],
    register:['how do i sign up','how can i register','create account','create an account','make an account','i need an account','i want to register','join homelyserv','sign up','register'],
    employer:['employer account','register as employer','sign up as employer','i am an employer'],
    worker:['worker registration','worker account','register as worker','register as a worker','sign up as worker','sign up as a worker','become a worker','i am a worker'],
    find:['find a worker','find workers','search for a worker','search workers','hire a worker','where can i find workers'],
    verify:['verify email','email verification','confirm my email','verification email','did not receive verification'],
    premium:['premium','premium account','premium plan','what is premium'],
    payment:['payment help','payment problem','how to pay','payment options','pay commission','payments'],
    password:['forgot password','forgot my password','reset password','cannot log in','cant log in','login help','sign in help'],
  },
  ar:{
    how:['كيف تعمل homelyserv','ازاي homelyserv بتشتغل','ما هي homelyserv','ما هو homelyserv','عايز اعرف homelyserv'],
    register:['ازاي اسجل حساب','ازاي اسجل','عايز اسجل','عاوز اسجل','عايز اعمل حساب','عاوز اعمل حساب','اعمل حساب ازاي','ازاي اعمل اكونت','عايز اعمل اكونت','عاوز اعمل اكونت','التسجيل ازاي','طريقه التسجيل','كيفية التسجيل','كيفيه التسجيل','انشاء حساب','فتح حساب','حساب جديد','سجل حساب'],
    employer:['حساب صاحب عمل','التسجيل كصاحب عمل','اسجل صاحب عمل','عايز حساب صاحب عمل','انا صاحب عمل'],
    worker:['تسجيل عامل','حساب عامل','التسجيل كعامل','اسجل كعامل','عايز اشتغل كعامل','انشاء ملف عامل','انا عامل'],
    find:['العثور علي عامل','العثور على عامل','ابحث عن عامل','البحث عن عامل','ازاي الاقي عامل','عايز عامل','عاوز عامل','اختيار عامل'],
    verify:['تفعيل البريد','تاكيد البريد','التحقق من البريد','رساله التفعيل','كود التفعيل','البريد مش متفعل'],
    premium:['premium','بريميوم','الحساب المميز','الاشتراك المميز'],
    payment:['مساعده في الدفع','مشكله في الدفع','ازاي ادفع','طريقه الدفع','خيارات الدفع','المدفوعات','دفع العموله'],
    password:['نسيت كلمه المرور','اعاده تعيين كلمه المرور','مش عارف ادخل','مشكله تسجيل الدخول','مساعده في الدخول','الباسورد'],
  },
  fr:{
    how:['comment fonctionne homelyserv','comment marche homelyserv','qu est ce que homelyserv','parlez moi de homelyserv'],
    register:['comment puis je creer un compte','comment creer un compte','comment m inscrire','je veux m inscrire','je veux creer un compte','creer un compte','ouvrir un compte','inscription','m inscrire'],
    employer:['compte employeur','inscription employeur','m inscrire comme employeur','je suis employeur'],
    worker:['inscription travailleur','compte travailleur','m inscrire comme travailleur','devenir travailleur','je suis travailleur'],
    find:['trouver un travailleur','chercher un travailleur','rechercher des travailleurs','embaucher un travailleur','ou trouver un travailleur'],
    verify:['verifier mon email','verification email','confirmer mon email','email de verification','courriel de verification'],
    premium:['premium','compte premium','offre premium','abonnement premium'],
    payment:['aide paiement','probleme de paiement','comment payer','options de paiement','paiements','payer la commission'],
    password:['mot de passe oublie','reinitialiser le mot de passe','impossible de me connecter','aide connexion','probleme de connexion'],
  },
  ru:{
    how:['как работает homelyserv','что такое homelyserv','расскажите о homelyserv'],
    register:['как зарегистрироваться','как мне зарегистрироваться','хочу зарегистрироваться','создать аккаунт','создать учетную запись','как создать аккаунт','регистрация','открыть аккаунт'],
    employer:['аккаунт работодателя','регистрация работодателя','зарегистрироваться как работодатель','я работодатель'],
    worker:['регистрация работника','аккаунт работника','зарегистрироваться как работник','стать работником','я работник'],
    find:['найти работника','поиск работников','искать работника','нанять работника','где найти работника'],
    verify:['подтвердить email','подтверждение почты','проверка email','письмо подтверждения','верификация почты'],
    premium:['premium','премиум','премиум аккаунт','премиум план'],
    payment:['помощь с оплатой','проблема с оплатой','как оплатить','способы оплаты','платежи','оплатить комиссию'],
    password:['забыл пароль','забыла пароль','сбросить пароль','не могу войти','помощь со входом','проблема со входом'],
  },
  tr:{
    how:['homelyserv nasil calisir','homelyserv nedir','homelyserv hakkinda bilgi'],
    register:['nasil kayit olabilirim','nasil kayit olurum','kayit olmak istiyorum','hesap olusturmak istiyorum','hesap olustur','yeni hesap','kayit'],
    employer:['isveren hesabi','isveren kaydi','isveren olarak kayit','ben isverenim'],
    worker:['calisan kaydi','calisan hesabi','calisan olarak kayit','calisan olmak istiyorum','ben calisanim'],
    find:['calisan bul','bir calisan bul','calisan ara','calisanlari ara','nerede calisan bulabilirim','calisan ise al'],
    verify:['e posta dogrulama','e postami dogrula','dogrulama e postasi','hesap dogrulama'],
    premium:['premium','premium hesap','premium plan','premium uyelik'],
    payment:['odeme yardimi','odeme sorunu','nasil odeme yaparim','odeme secenekleri','odemeler','komisyon odemesi'],
    password:['sifremi unuttum','sifre sifirlama','giris yapamiyorum','giris yardimi','giris sorunu'],
  },
  de:{
    how:['wie funktioniert homelyserv','was ist homelyserv','erzahle mir von homelyserv'],
    register:['wie kann ich mich registrieren','wie registriere ich mich','ich mochte mich registrieren','konto erstellen','ein konto erstellen','ich mochte ein konto erstellen','anmelden','registrierung'],
    employer:['arbeitgeberkonto','als arbeitgeber registrieren','arbeitgeber registrierung','ich bin arbeitgeber'],
    worker:['arbeitnehmer registrierung','arbeitnehmerkonto','als arbeitnehmer registrieren','arbeitnehmer werden','ich bin arbeitnehmer'],
    find:['arbeitnehmer finden','einen arbeitnehmer finden','arbeitnehmer suchen','wo finde ich arbeitnehmer','arbeitnehmer einstellen'],
    verify:['email bestatigen','e mail bestatigen','e mail bestatigung','bestatigungs email','konto verifizieren'],
    premium:['premium','premium konto','premium plan','premium mitgliedschaft'],
    payment:['hilfe bei zahlung','zahlungsproblem','wie bezahle ich','zahlungsoptionen','zahlungen','provision bezahlen'],
    password:['passwort vergessen','passwort zurucksetzen','kann mich nicht anmelden','hilfe bei anmeldung','anmeldeproblem'],
  },
};

const keywordGroups = {
  en:{register:['register','account','signup'],worker:['worker','profile','register'],find:['find','search','hire','worker'],verify:['verify','email','confirm'],payment:['payment','pay','commission'],password:['password','login','reset']},
  ar:{register:['اسجل','تسجيل','حساب','اكونت'],worker:['عامل','تسجيل','حساب'],find:['عامل','الاقي','ابحث','العثور'],verify:['بريد','تفعيل','تاكيد','تحقق'],payment:['دفع','مدفوعات','عموله'],password:['مرور','باسورد','دخول','نسيت']},
  fr:{register:['inscrire','inscription','compte','creer'],worker:['travailleur','inscription','compte'],find:['trouver','chercher','travailleur'],verify:['verification','email','confirmer'],payment:['paiement','payer','commission'],password:['mot','passe','connexion']},
  ru:{register:['регистрироваться','регистрация','аккаунт','создать'],worker:['работник','регистрация','аккаунт'],find:['найти','поиск','работник'],verify:['подтвердить','почта','email'],payment:['оплата','платеж','комиссия'],password:['пароль','войти','сбросить']},
  tr:{register:['kayit','hesap','olustur'],worker:['calisan','kayit','hesap'],find:['calisan','bul','ara'],verify:['dogrulama','posta','dogrula'],payment:['odeme','ode','komisyon'],password:['sifre','giris','unuttum']},
  de:{register:['registrieren','registrierung','konto','erstellen'],worker:['arbeitnehmer','registrierung','konto'],find:['arbeitnehmer','finden','suchen'],verify:['email','bestatigen','verifizieren'],payment:['zahlung','bezahlen','provision'],password:['passwort','anmelden','zurucksetzen']},
};

const escalationAliases = {
  en:['customer support','human support','human','agent','admin','speak to someone','support person'],
  ar:['دعم العملاء','موظف دعم','عايز اكلم حد','عاوز اكلم حد','اكلم انسان','خدمه العملاء','مسوول','ادمن','دعم'],
  fr:['service client','assistance humaine','parler a un humain','parler a quelqu un','conseiller','agent humain'],
  ru:['служба поддержки','нужна поддержка','живой оператор','поговорить с человеком','сотрудник поддержки','администратор'],
  tr:['musteri hizmetleri','canli destek','insanla konusmak','temsilci','destek gorevlisi'],
  de:['kundendienst','menschlicher support','mit einem menschen sprechen','mitarbeiter','support agent'],
};

const normalizedAliases = (language, aliases) => aliases.map((alias) => normalizeFaqText(alias, language));

function phraseScore(text, aliases) {
  let best = 0;
  for (const phrase of aliases) {
    if (!phrase || !text.includes(phrase)) continue;
    const wordCount = phrase.split(' ').length;
    best = Math.max(best, 4 + Math.min(wordCount, 4) / 10);
  }
  return best;
}

function keywordScore(text, keywords = []) {
  const tokens = new Set(text.split(' '));
  return keywords.reduce((score, keyword) => score + (tokens.has(keyword) ? 1 : 0), 0);
}

export function matchFaqIntent(text, language = 'en') {
  const selectedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  const normalized = normalizeFaqText(text, selectedLanguage);
  if (!normalized) return null;

  const escalationScore = phraseScore(normalized, normalizedAliases(selectedLanguage, escalationAliases[selectedLanguage]));
  if (escalationScore >= 4) return 'escalation';

  const candidates = Object.entries(intentAliases[selectedLanguage]).map(([intent, aliases]) => {
    const phrases = normalizedAliases(selectedLanguage, aliases);
    const strong = phraseScore(normalized, phrases);
    const keywords = keywordScore(normalized, (keywordGroups[selectedLanguage]?.[intent] || []).map((word) => normalizeFaqText(word, selectedLanguage)));
    return { intent, score:Math.max(strong, keywords), strong };
  }).filter((candidate) => candidate.score >= 2).sort((left, right) => right.score - left.score);

  if (!candidates.length) return null;
  const [best, second] = candidates;
  if (best.strong < 4 && best.score < 2) return null;
  if (second && Math.abs(best.score - second.score) < 0.05) return null;
  return best.intent;
}
