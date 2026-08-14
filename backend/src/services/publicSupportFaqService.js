import { answerConversation } from './publicSupportConversationService.js';
import { matchExplicitSupportIntent, matchFaqIntent } from './publicSupportFaqMatcher.js';

const conversationalCopy = {
  en:{
    greeting:['Hello! Welcome to HomelyServ. How can I help you today? You can ask about accounts, workers, Premium, or payments.','Hi there! How can I help with HomelyServ? I can answer questions about creating an account, finding a worker, Premium, and payments.','Hi! Welcome to HomelyServ. How can I help you today? You can ask me about creating an account, finding a worker, Premium, payments, or anything else about HomelyServ.'],
    capability:'I can help with HomelyServ registration, Employer and Worker accounts, finding workers, Premium, payments, login or password issues, and email verification. You can also ask to speak with Support.',
    identity:'I’m the HomelyServ automated assistant. I can answer common questions, and if you need a person, I can connect you with our Support team.',
    wellbeing:'I’m doing well, thank you! How can I help you with HomelyServ?',
    thanks:'You’re welcome! Is there anything else I can help you with?',
    acknowledgement:'Got it. What else can I help you with?',
    farewell:'Goodbye! Feel free to come back if you need help with HomelyServ.',
  },
  ar:{
    greeting:['مرحبًا! أنا مساعد HomelyServ. أقدر أساعدك في التسجيل، البحث عن عامل، Premium، والمدفوعات. تحب تسأل عن إيه؟','أهلًا بيك! إزاي أقدر أساعدك في HomelyServ؟ ممكن تسألني عن الحسابات، العمال، Premium، أو المدفوعات.','أهلاً بيك! أنا مساعد HomelyServ. أقدر أساعدك في التسجيل، البحث عن عامل، Premium، المدفوعات، أو أي سؤال عن HomelyServ. تحب تسأل عن إيه؟'],
    capability:'أقدر أساعدك في التسجيل في HomelyServ، حسابات أصحاب العمل والعمال، البحث عن عامل، Premium، المدفوعات، مشاكل تسجيل الدخول أو كلمة المرور، وتأكيد البريد الإلكتروني. وتقدر كمان تطلب التحدث مع الدعم.',
    identity:'أنا مساعد HomelyServ الآلي، مش إنسان. أقدر أجاوب عن الأسئلة الشائعة عن HomelyServ، وتقدر تطلب التحدث مع الدعم لو محتاج شخص يساعدك.',
    wellbeing:'أنا بخير، شكرًا لك! كيف يمكنني مساعدتك في HomelyServ؟',
    thanks:'العفو! هل يمكنني مساعدتك في شيء آخر؟',
    acknowledgement:'حسنًا. كيف يمكنني مساعدتك أيضًا؟',
    farewell:'مع السلامة! يمكنك العودة في أي وقت إذا احتجت إلى مساعدة في HomelyServ.',
  },
  fr:{
    greeting:['Bonjour ! Bienvenue sur HomelyServ. Je peux vous aider à créer un compte, trouver un travailleur, comprendre Premium ou effectuer un paiement. Quelle est votre question ?','Salut ! Je suis l’assistant HomelyServ. Posez-moi vos questions sur les comptes, la recherche de travailleurs, Premium ou les paiements.','Bienvenue ! Comment puis-je vous aider aujourd’hui ? Vous pouvez me poser toute question sur HomelyServ, notamment sur l’inscription, les travailleurs, Premium et les paiements.'],
    capability:'Je peux vous aider avec l’inscription à HomelyServ, les comptes Employeur et Travailleur, la recherche de travailleurs, Premium, les paiements, la connexion ou le mot de passe et la vérification de l’e-mail. Vous pouvez aussi demander à parler à l’assistance.',
    identity:'Je suis l’assistant automatisé HomelyServ, pas une personne. Je peux répondre aux questions courantes sur HomelyServ, et vous pouvez demander à parler à l’assistance humaine.',
    wellbeing:'Je vais bien, merci ! Comment puis-je vous aider avec HomelyServ ?',
    thanks:'Avec plaisir ! Puis-je vous aider avec autre chose ?',
    acknowledgement:'D’accord. Puis-je vous aider avec autre chose ?',
    farewell:'Au revoir ! Revenez quand vous voulez si vous avez besoin d’aide avec HomelyServ.',
  },
  ru:{
    greeting:['Здравствуйте! Добро пожаловать в HomelyServ. Я помогу с регистрацией, поиском работника, Premium и платежами. Что вас интересует?','Привет! Я помощник HomelyServ. Можете спросить меня об аккаунтах, поиске работников, Premium или платежах.','Добро пожаловать! Чем я могу помочь сегодня? Задайте любой вопрос о HomelyServ, включая регистрацию, работников, Premium и платежи.'],
    capability:'Я могу помочь с регистрацией в HomelyServ, аккаунтами работодателей и работников, поиском работников, Premium, платежами, входом или паролем и подтверждением электронной почты. Вы также можете попросить связать вас с поддержкой.',
    identity:'Я автоматический помощник HomelyServ, а не человек. Я отвечаю на распространённые вопросы о HomelyServ, а при необходимости вы можете попросить связать вас с поддержкой.',
    wellbeing:'У меня всё хорошо, спасибо! Чем я могу помочь вам с HomelyServ?',
    thanks:'Пожалуйста! Могу ли я помочь ещё чем-нибудь?',
    acknowledgement:'Понятно. Чем ещё я могу помочь?',
    farewell:'До свидания! Возвращайтесь, если вам понадобится помощь с HomelyServ.',
  },
  tr:{
    greeting:['Merhaba! HomelyServ’e hoş geldiniz. Kayıt, çalışan bulma, Premium ve ödemeler konusunda yardımcı olabilirim. Ne sormak istersiniz?','Selam! Ben HomelyServ Asistanıyım. Hesaplar, çalışan arama, Premium veya ödemeler hakkında bana soru sorabilirsiniz.','Hoş geldiniz! Bugün size nasıl yardımcı olabilirim? Kayıt, çalışanlar, Premium, ödemeler veya HomelyServ ile ilgili başka bir şey sorabilirsiniz.'],
    capability:'HomelyServ kaydı, İşveren ve Çalışan hesapları, çalışan bulma, Premium, ödemeler, giriş veya şifre sorunları ve e-posta doğrulama konularında yardımcı olabilirim. Ayrıca Destek ekibiyle görüşmek isteyebilirsiniz.',
    identity:'Ben otomatik HomelyServ Asistanıyım, insan değilim. HomelyServ hakkındaki yaygın soruları yanıtlayabilirim; isterseniz Destek ekibiyle görüşmeyi de talep edebilirsiniz.',
    wellbeing:'İyiyim, teşekkür ederim! HomelyServ konusunda size nasıl yardımcı olabilirim?',
    thanks:'Rica ederim! Başka bir konuda yardımcı olabilir miyim?',
    acknowledgement:'Anladım. Başka nasıl yardımcı olabilirim?',
    farewell:'Hoşça kalın! HomelyServ ile ilgili yardıma ihtiyacınız olursa tekrar bekleriz.',
  },
  de:{
    greeting:['Hallo! Willkommen bei HomelyServ. Ich helfe Ihnen bei der Kontoerstellung, der Arbeitnehmersuche, Premium und Zahlungen. Was möchten Sie wissen?','Guten Tag! Ich bin der HomelyServ-Assistent. Fragen Sie mich gern zu Konten, zur Arbeitnehmersuche, zu Premium oder zu Zahlungen.','Willkommen! Wie kann ich Ihnen heute helfen? Sie können alles über HomelyServ fragen, zum Beispiel zu Registrierung, Arbeitnehmern, Premium und Zahlungen.'],
    capability:'Ich helfe bei der HomelyServ-Registrierung, Arbeitgeber- und Arbeitnehmerkonten, der Arbeitnehmersuche, Premium, Zahlungen, Anmeldung oder Passwort und der E-Mail-Bestätigung. Sie können auch darum bitten, mit dem Support zu sprechen.',
    identity:'Ich bin der automatisierte HomelyServ-Assistent, kein Mensch. Ich beantworte häufige Fragen zu HomelyServ; bei Bedarf können Sie darum bitten, mit dem Support zu sprechen.',
    wellbeing:'Mir geht es gut, danke! Wie kann ich Ihnen bei HomelyServ helfen?',
    thanks:'Gern geschehen! Kann ich Ihnen noch bei etwas anderem helfen?',
    acknowledgement:'Verstanden. Wobei kann ich Ihnen noch helfen?',
    farewell:'Auf Wiedersehen! Kommen Sie gern wieder, wenn Sie Hilfe mit HomelyServ benötigen.',
  },
};

const conversationalAliases = {
  en:{greeting:['hi','hello','hey','hi there','hello there','good morning','good afternoon','good evening'],capability:['can you help me','help','what can you help me with','what can i ask you','what do you do'],identity:['who are you','are you a bot','are you human',"what's your name",'what is your name'],wellbeing:['how are you','how are you doing','how is it going',"how's it going",'how are things'],thanks:['thanks','thank you','thx','appreciate it','thanks a lot','thank you so much'],acknowledgement:['ok','okay','got it','understood','yes','no','alright','great'],farewell:['bye','goodbye','see you','see you later','good night','thanks bye','thank you bye','thanks goodbye']},
  ar:{greeting:['مرحبا','مرحبًا','اهلا','أهلا','سلام','السلام عليكم','صباح الخير','مساء الخير'],capability:['ممكن تساعدني','ساعدني','بتساعد في ايه','بتعرف تعمل ايه','انت بتعمل ايه','ممكن اسألك عن ايه'],identity:['انت مين','إنت مين','اسمك ايه','انت بوت','إنت بوت','انت روبوت','إنت روبوت','انت انسان','إنت إنسان'],wellbeing:['كيف حالك','عامل ايه','اخبارك ايه','ازيك','إزيك'],thanks:['شكرا','شكرًا','شكرا ليك','متشكر','تسلم'],acknowledgement:['اوك','حسنا','حسنًا','تمام','فهمت','نعم','لا','ماشي'],farewell:['باي','مع السلامة','وداعا','وداعًا','اشوفك بعدين','تصبح على خير']},
  fr:{greeting:['bonjour','salut','bonsoir','coucou'],capability:['pouvez vous m aider','aidez moi','comment pouvez vous m aider','que puis je vous demander','que faites vous'],identity:['qui etes vous','etes vous un bot','etes vous humain','comment vous appelez vous'],wellbeing:['comment allez vous','comment vas tu','comment ca va','ca va','ca roule'],thanks:['merci','merci beaucoup','merci bien','je vous remercie'],acknowledgement:['ok','d accord','compris','oui','non','tres bien'],farewell:['au revoir','a bientot','salut','bonne nuit']},
  ru:{greeting:['привет','здравствуйте','добрый день','доброе утро','добрый вечер'],capability:['можете мне помочь','помогите','чем вы можете помочь','что я могу спросить','что вы умеете'],identity:['кто вы','ты кто','вы бот','вы человек','как вас зовут'],wellbeing:['как дела','как твои дела','как вы','как ты','как поживаете'],thanks:['спасибо','большое спасибо','благодарю','благодарю вас'],acknowledgement:['хорошо','понятно','ладно','да','нет','ясно'],farewell:['пока','до свидания','до встречи','спокойной ночи']},
  tr:{greeting:['merhaba','selam','gunaydin','günaydın','iyi aksamlar','iyi akşamlar'],capability:['bana yardim edebilir misin','bana yardım edebilir misin','yardim et','yardım et','ne konuda yardim edebilirsin','ne konuda yardım edebilirsin','sana ne sorabilirim','ne yapiyorsun','ne yapıyorsun'],identity:['sen kimsin','siz kimsiniz','bot musun','insan misin','insan mısın','adin ne','adın ne'],wellbeing:['nasilsin','nasılsın','nasilsiniz','nasılsınız','nasil gidiyor','nasıl gidiyor'],thanks:['tesekkurler','teşekkürler','cok tesekkurler','çok teşekkürler','tesekkur ederim','teşekkür ederim','sag ol','sağ ol','sag olun','sağ olun'],acknowledgement:['tamam','anladim','anladım','peki','evet','hayir','hayır'],farewell:['hosca kal','hoşça kal','gorusuruz','görüşürüz','gule gule','güle güle','iyi geceler']},
  de:{greeting:['hallo','hi','guten morgen','guten tag','guten abend'],capability:['konnen sie mir helfen','können sie mir helfen','hilf mir','wobei konnen sie helfen','wobei können sie helfen','was kann ich sie fragen','was machen sie'],identity:['wer sind sie','wer bist du','sind sie ein bot','sind sie ein mensch','wie heissen sie','wie heißen sie'],wellbeing:['wie geht es dir','wie geht es ihnen','wie gehts',"wie geht's"],thanks:['danke','vielen dank','danke schon','danke sehr','herzlichen dank'],acknowledgement:['ok','okay','verstanden','alles klar','ja','nein','gut'],farewell:['tschuss','auf wiedersehen','bis bald','gute nacht']},
};

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
  const supportIntent = matchExplicitSupportIntent(text, language);
  if (supportIntent) return { escalate:true, answer:copy.fallback, matched:supportIntent };
  const conversationResult = answerConversation(text, language, conversationalCopy, conversationalAliases);
  if (conversationResult) return { escalate:false, answer:conversationResult.answer, matched:conversationResult.intent };
  const faqIntent = matchFaqIntent(text, language);
  if (faqIntent) return { escalate:false, answer:copy[faqIntent], matched:faqIntent };
  return { escalate:false, answer:copy.fallback, matched:null };
}

export function welcomeFaq(language = 'en') { return (faq[language] || faq.en).welcome; }
export function transferredFaq(language = 'en') { return (faq[language] || faq.en).transferred; }
