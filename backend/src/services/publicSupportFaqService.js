import { matchFaqIntent } from './publicSupportFaqMatcher.js';

const faq = {
  en:{
    welcome:'Hello! I can help with HomelyServ accounts, finding workers, registration, Premium, payments, and login help.',
    how:'HomelyServ connects employers with workers. Employers can search worker profiles and manage hiring, while workers can create profiles and find opportunities.',
    register:'Choose Create an account, select Employer or Worker, complete your details, and verify your email.',
    employer:'Employer accounts can search for workers, manage jobs and hires, and use platform messaging after the applicable contact requirements are met.',
    worker:'Worker accounts can create a professional profile, browse opportunities, manage applications and offers, and communicate through HomelyServ.',
    find:'Create or sign in to an Employer account, then use Find Workers to search available worker profiles.',
    verify:'After registration, open the verification message sent to your email and follow its link. Check spam or junk folders if needed.',
    premium:'Premium is an optional account entitlement. Sign in and open the Premium area to see the currently available plan information for your role.',
    payment:'Payment availability and currencies depend on the action and your account. Sign in to view the options currently offered for that transaction.',
    password:'Use Forgot Password on the login page. HomelyServ will send reset instructions to the registered email address.',
    fallback:'I could not find a reliable answer for that. You can try one of the quick questions or contact support.',
    transferred:'Your conversation has been transferred to the HomelyServ support queue. A staff member can reply here.',
  },
  ar:{
    welcome:'مرحبًا! يمكنني المساعدة بشأن حسابات HomelyServ والعثور على العمال والتسجيل وPremium والمدفوعات وتسجيل الدخول.',
    how:'تربط HomelyServ أصحاب العمل بالعمال. يمكن لأصحاب العمل البحث في ملفات العمال وإدارة التوظيف، ويمكن للعمال إنشاء ملفات والعثور على فرص.',
    register:'اختر إنشاء حساب، ثم اختر صاحب عمل أو عامل، وأكمل بياناتك وتحقق من بريدك الإلكتروني.',
    employer:'تتيح حسابات أصحاب العمل البحث عن العمال وإدارة الوظائف والتعيينات واستخدام المراسلة بعد استيفاء متطلبات التواصل.',
    worker:'تتيح حسابات العمال إنشاء ملف مهني واستعراض الفرص وإدارة الطلبات والعروض والتواصل عبر HomelyServ.',
    find:'أنشئ حساب صاحب عمل أو سجّل الدخول، ثم استخدم البحث عن العمال.',
    verify:'افتح رسالة التحقق المرسلة إلى بريدك بعد التسجيل واتبع الرابط. تحقق من البريد غير المرغوب فيه عند الحاجة.',
    premium:'Premium استحقاق اختياري. سجّل الدخول وافتح قسم Premium لمعرفة معلومات الخطة المتاحة حاليًا لدورك.',
    payment:'تعتمد خيارات الدفع والعملات على العملية والحساب. سجّل الدخول لرؤية الخيارات المتاحة للمعاملة.',
    password:'استخدم نسيت كلمة المرور في صفحة الدخول، وستصلك تعليمات إعادة التعيين على البريد المسجل.',
    fallback:'لم أجد إجابة موثوقة. جرّب أحد الأسئلة السريعة أو تواصل مع الدعم.',
    transferred:'تم تحويل محادثتك إلى قائمة دعم HomelyServ. يمكن لأحد الموظفين الرد هنا.',
  },
  fr:{
    welcome:'Bonjour ! Je peux vous aider avec les comptes HomelyServ, la recherche de travailleurs, l’inscription, Premium, les paiements et la connexion.',
    how:'HomelyServ met en relation employeurs et travailleurs. Les employeurs recherchent des profils et gèrent les recrutements, tandis que les travailleurs créent leur profil et trouvent des opportunités.',
    register:'Choisissez Créer un compte, sélectionnez Employeur ou Travailleur, complétez vos informations et vérifiez votre e-mail.',
    employer:'Les comptes Employeur permettent de rechercher des travailleurs, gérer les offres et recrutements et utiliser la messagerie lorsque les conditions de contact sont remplies.',
    worker:'Les comptes Travailleur permettent de créer un profil, consulter les opportunités, gérer candidatures et offres et communiquer sur HomelyServ.',
    find:'Créez un compte Employeur ou connectez-vous, puis utilisez Rechercher des travailleurs.',
    verify:'Ouvrez l’e-mail de vérification envoyé après l’inscription et suivez le lien. Vérifiez aussi les courriers indésirables.',
    premium:'Premium est un droit de compte facultatif. Connectez-vous et ouvrez l’espace Premium pour voir les informations disponibles pour votre rôle.',
    payment:'Les options et devises dépendent de l’action et du compte. Connectez-vous pour voir les options proposées pour la transaction.',
    password:'Utilisez Mot de passe oublié sur la page de connexion pour recevoir les instructions à l’adresse enregistrée.',
    fallback:'Je n’ai pas trouvé de réponse fiable. Essayez une question rapide ou contactez l’assistance.',
    transferred:'Votre conversation a été transférée à la file d’assistance HomelyServ. Un membre du personnel peut répondre ici.',
  },
  ru:{
    welcome:'Здравствуйте! Я помогу с аккаунтами HomelyServ, поиском работников, регистрацией, Premium, платежами и входом.',
    how:'HomelyServ связывает работодателей и работников. Работодатели ищут профили и управляют наймом, а работники создают профили и находят возможности.',
    register:'Выберите «Создать аккаунт», укажите роль работодателя или работника, заполните данные и подтвердите email.',
    employer:'Аккаунт работодателя позволяет искать работников, управлять вакансиями и наймом и использовать сообщения после выполнения условий контакта.',
    worker:'Аккаунт работника позволяет создать профессиональный профиль, искать возможности, управлять заявками и общаться через HomelyServ.',
    find:'Создайте аккаунт работодателя или войдите и используйте поиск работников.',
    verify:'Откройте письмо подтверждения после регистрации и перейдите по ссылке. При необходимости проверьте спам.',
    premium:'Premium — необязательное право аккаунта. Войдите и откройте раздел Premium, чтобы увидеть актуальную информацию для вашей роли.',
    payment:'Способы оплаты и валюты зависят от операции и аккаунта. Войдите, чтобы увидеть доступные варианты.',
    password:'Используйте «Забыли пароль?» на странице входа. Инструкции придут на зарегистрированный email.',
    fallback:'Мне не удалось найти надежный ответ. Выберите быстрый вопрос или обратитесь в поддержку.',
    transferred:'Разговор передан в очередь поддержки HomelyServ. Сотрудник сможет ответить здесь.',
  },
  tr:{
    welcome:'Merhaba! HomelyServ hesapları, çalışan bulma, kayıt, Premium, ödemeler ve giriş konularında yardımcı olabilirim.',
    how:'HomelyServ işverenlerle çalışanları buluşturur. İşverenler profilleri arayıp işe alımları yönetir; çalışanlar profil oluşturup fırsat bulur.',
    register:'Hesap oluştur’u seçin, İşveren veya Çalışan rolünü belirleyin, bilgilerinizi tamamlayın ve e-postanızı doğrulayın.',
    employer:'İşveren hesapları çalışan arayabilir, işleri ve işe alımları yönetebilir ve iletişim koşulları karşılandığında mesajlaşmayı kullanabilir.',
    worker:'Çalışan hesapları profesyonel profil oluşturabilir, fırsatları inceleyebilir, başvuru ve teklifleri yönetebilir ve HomelyServ üzerinden iletişim kurabilir.',
    find:'Bir İşveren hesabı oluşturun veya giriş yapın, ardından Çalışan Bul’u kullanın.',
    verify:'Kayıttan sonra gönderilen doğrulama e-postasındaki bağlantıyı açın. Gerekirse spam klasörünü kontrol edin.',
    premium:'Premium isteğe bağlı bir hesap hakkıdır. Giriş yapıp Premium alanından rolünüz için güncel plan bilgilerini görebilirsiniz.',
    payment:'Ödeme seçenekleri ve para birimleri işleme ve hesaba bağlıdır. Mevcut seçenekleri görmek için giriş yapın.',
    password:'Giriş sayfasındaki Şifremi Unuttum seçeneğini kullanın; talimatlar kayıtlı e-postaya gönderilir.',
    fallback:'Güvenilir bir yanıt bulamadım. Hızlı sorulardan birini deneyin veya desteğe başvurun.',
    transferred:'Görüşmeniz HomelyServ destek kuyruğuna aktarıldı. Bir görevli buradan yanıt verebilir.',
  },
  de:{
    welcome:'Hallo! Ich helfe bei HomelyServ-Konten, Arbeitersuche, Registrierung, Premium, Zahlungen und Anmeldung.',
    how:'HomelyServ verbindet Arbeitgeber und Arbeitnehmer. Arbeitgeber suchen Profile und verwalten Einstellungen; Arbeitnehmer erstellen Profile und finden Möglichkeiten.',
    register:'Wählen Sie Konto erstellen, dann Arbeitgeber oder Arbeitnehmer, vervollständigen Sie Ihre Angaben und bestätigen Sie Ihre E-Mail.',
    employer:'Arbeitgeberkonten können Arbeitnehmer suchen, Stellen und Einstellungen verwalten und nach Erfüllung der Kontaktbedingungen Nachrichten nutzen.',
    worker:'Arbeitnehmerkonten können ein Profil erstellen, Möglichkeiten ansehen, Bewerbungen und Angebote verwalten und über HomelyServ kommunizieren.',
    find:'Erstellen Sie ein Arbeitgeberkonto oder melden Sie sich an und verwenden Sie Arbeitnehmer finden.',
    verify:'Öffnen Sie nach der Registrierung die Bestätigungs-E-Mail und folgen Sie dem Link. Prüfen Sie bei Bedarf den Spam-Ordner.',
    premium:'Premium ist eine optionale Kontoberechtigung. Melden Sie sich an und öffnen Sie den Premium-Bereich für die Informationen zu Ihrer Rolle.',
    payment:'Zahlungsoptionen und Währungen hängen von Vorgang und Konto ab. Melden Sie sich an, um die verfügbaren Optionen zu sehen.',
    password:'Nutzen Sie Passwort vergessen auf der Anmeldeseite. Die Anleitung wird an die registrierte E-Mail gesendet.',
    fallback:'Ich konnte keine verlässliche Antwort finden. Nutzen Sie eine Schnellfrage oder kontaktieren Sie den Support.',
    transferred:'Ihre Unterhaltung wurde an die HomelyServ-Supportwarteschlange übertragen. Ein Mitarbeiter kann hier antworten.',
  },
};

const patterns = {
  register:/register|create.*account|sign ?up|تسجيل|إنشاء حساب|inscri|créer.*compte|регистр|создать аккаунт|kayıt|hesap oluştur|registrier|konto erstellen/i,
  employer:/employer|صاحب عمل|employeur|работодатель|işveren|arbeitgeber/i,
  find:/find.*worker|search.*worker|العثور.*عامل|البحث.*عامل|trouver.*travailleur|recherch.*travailleur|найти.*работ|поиск.*работ|çalışan.*bul|ara.*çalışan|arbeitnehmer.*finden|such.*arbeitnehmer/i,
  worker:/worker|عامل|travailleur|работник|çalışan|arbeitnehmer/i,
  verify:/verify|verification|email.*confirm|تحقق|تأكيد البريد|vérif|confirmation.*mail|подтверж|doğrula|bestätig/i,
  premium:/premium|بريميوم|премиум/i,
  payment:/payment|pay|دفع|مدفوعات|paiement|оплат|ödeme|zahlung/i,
  password:/password|login|كلمة المرور|تسجيل الدخول|mot de passe|connexion|парол|вход|şifre|giriş|passwort|anmeld/i,
  how:/what is homelyserv|how.*work|ما هو|كيف تعمل|qu.?est.*homelyserv|comment.*fonction|что такое|как.*работ|homelyserv nedir|nasıl.*çalış|was ist homelyserv|wie.*funktion/i,
};

const escalationPattern = /customer support|human|agent|admin|support|speak to someone|دعم|إنسان|موظف|مسؤول|parler.*quelqu|assistance|conseiller|humain|поддерж|оператор|человек|destek|insan|temsilci|müşteri hizmet|kundendienst|mitarbeiter|mensch/i;

export function answerFaq(text, language = 'en') {
  const copy = faq[language] || faq.en;
  const intent = matchFaqIntent(text, language);
  if (intent === 'escalation') return { escalate:true, answer:copy.fallback, matched:intent };
  return intent ? { escalate:false, answer:copy[intent], matched:intent } : { escalate:true, answer:copy.fallback, matched:null };
}

export function welcomeFaq(language = 'en') { return (faq[language] || faq.en).welcome; }
export function transferredFaq(language = 'en') { return (faq[language] || faq.en).transferred; }
