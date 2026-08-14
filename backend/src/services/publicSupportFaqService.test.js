import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFaq, welcomeFaq } from './publicSupportFaqService.js';

const expectIntent = (language, intent, messages) => {
  for (const message of messages) assert.equal(answerFaq(message, language).matched, intent, `${language}: ${message}`);
};

test('FAQ provides non-empty welcome copy for all supported languages', () => {
  for (const language of ['en','ar','fr','ru','tr','de']) assert.ok(welcomeFaq(language).length > 10);
});

test('recognizes Egyptian and standard Arabic registration phrasing', () => {
  expectIntent('ar', 'register', ['ازاي اسجل','ازاي اسجل حساب','عايز اعمل حساب','عاوز اعمل اكونت','طريقة التسجيل','كيفية إنشاء حساب']);
});

test('recognizes natural English registration phrasing', () => {
  expectIntent('en', 'register', ['how do I sign up','make an account','I want to register']);
});

test('recognizes natural French registration phrasing', () => {
  expectIntent('fr', 'register', ['comment puis-je créer un compte ?','comment m\'inscrire ?','je veux créer un compte']);
});

test('recognizes natural Russian registration phrasing', () => {
  expectIntent('ru', 'register', ['как зарегистрироваться','хочу зарегистрироваться','как создать аккаунт']);
});

test('recognizes natural Turkish registration phrasing', () => {
  expectIntent('tr', 'register', ['nasıl kayıt olabilirim','kayıt olmak istiyorum','hesap oluşturmak istiyorum']);
});

test('recognizes natural German registration phrasing', () => {
  expectIntent('de', 'register', ['wie kann ich mich registrieren','ich möchte mich registrieren','ich möchte ein Konto erstellen']);
});

test('recognizes natural variants for all other FAQ intents', () => {
  const fixtures = {
    worker:[['en','register as a worker'],['ar','تسجيل عامل'],['fr','inscription travailleur'],['ru','регистрация работника'],['tr','çalışan kaydı'],['de','Arbeitnehmer Registrierung']],
    find:[['en','where can I find workers'],['ar','ازاي الاقي عامل'],['fr','trouver un travailleur'],['ru','где найти работника'],['tr','nerede çalışan bulabilirim'],['de','Arbeitnehmer finden']],
    premium:[['en','what is Premium'],['ar','الحساب المميز'],['fr','offre Premium'],['ru','премиум аккаунт'],['tr','Premium üyelik'],['de','Premium Mitgliedschaft']],
    payment:[['en','payment help'],['ar','مشكلة في الدفع'],['fr','problème de paiement'],['ru','помощь с оплатой'],['tr','ödeme sorunu'],['de','Zahlungsproblem']],
    password:[['en','forgot my password'],['ar','نسيت كلمة المرور'],['fr','mot de passe oublié'],['ru','забыл пароль'],['tr','şifremi unuttum'],['de','Passwort vergessen']],
    verify:[['en','email verification'],['ar','تأكيد البريد'],['fr','vérifier mon email'],['ru','подтверждение почты'],['tr','e-posta doğrulama'],['de','E-Mail bestätigen']],
    how:[['en','how does HomelyServ work'],['ar','كيف تعمل HomelyServ'],['fr','comment fonctionne HomelyServ'],['ru','как работает HomelyServ'],['tr','HomelyServ nasıl çalışır'],['de','wie funktioniert HomelyServ']],
  };
  for (const [intent, cases] of Object.entries(fixtures)) for (const [language, message] of cases) assert.equal(answerFaq(message, language).matched, intent, `${language}: ${message}`);
});

test('human and customer-support variants remain multilingual', () => {
  const fixtures = [['en','speak to someone'],['ar','عايز اكلم حد'],['fr','service client'],['ru','живой оператор'],['tr','müşteri hizmetleri'],['de','mit einem Menschen sprechen']];
  for (const [language, message] of fixtures) assert.equal(answerFaq(message, language).matched, 'escalation', `${language}: ${message}`);
});

test('unknown questions use the safe fallback instead of inventing an answer', () => {
  const answer = answerFaq('What is the guaranteed price in Atlantis?', 'en');
  assert.equal(answer.escalate, false);
  assert.equal(answer.matched, null);
});

test('one unknown message does not automatically trigger the contact form', () => {
  const result = answerFaq('Can HomelyServ arrange travel to Atlantis?', 'en');
  assert.equal(result.matched, null);
  assert.equal(result.escalate, false);
  assert.match(result.answer, /quick questions|contact support/i);
});

test('English social and acknowledgement messages get conversational replies without escalation', () => {
  const fixtures = { greeting:['hi','hello','hey','hi there','good morning','good afternoon','good evening'], wellbeing:['how are you',"how's it going?",'how are things?'], thanks:['thanks','thank you','thx','appreciate it','thank you so much'], acknowledgement:['ok','got it','yes','no'], farewell:['goodbye','see you later','thanks bye'] };
  for (const [intent, messages] of Object.entries(fixtures)) for (const message of messages) {
    const result = answerFaq(message, 'en');
    assert.equal(result.matched, intent, message);
    assert.equal(result.escalate, false, message);
    assert.ok(result.answer.length > 10, message);
  }
});

test('basic conversation is handled in every supported language', () => {
  const fixtures = [
    ['ar','مرحبا','greeting'], ['ar','سلام','greeting'], ['ar','إزيك','wellbeing'], ['ar','اخبارك ايه','wellbeing'], ['ar','شكرا ليك','thanks'], ['ar','اوك','acknowledgement'], ['ar','باي','farewell'],
    ['fr','comment vas-tu ?','wellbeing'], ['fr','merci bien','thanks'], ['ru','благодарю вас','thanks'], ['ru','как твои дела','wellbeing'],
    ['tr','günaydın','greeting'], ['tr','nasılsınız','wellbeing'], ['tr','çok teşekkürler','thanks'], ['tr','tamam','acknowledgement'],
    ['de',"wie geht's?",'wellbeing'], ['de','herzlichen Dank','thanks'], ['de','auf wiedersehen','farewell'],
  ];
  for (const [language, message, intent] of fixtures) {
    const result = answerFaq(message, language);
    assert.equal(result.matched, intent, `${language}: ${message}`);
    assert.equal(result.escalate, false, `${language}: ${message}`);
  }
});

test('a greeting combined with a real FAQ question still answers the FAQ', () => {
  const result = answerFaq('Hello, how do I sign up?', 'en');
  assert.equal(result.matched, 'register');
  assert.equal(result.escalate, false);
});

test('explicit support requests take priority over conversational wording', () => {
  const result = answerFaq('Hello, I want to speak to someone', 'en');
  assert.equal(result.matched, 'escalation');
  assert.equal(result.escalate, true);
});

test('explicit customer Support request still escalates', () => {
  const result = answerFaq('I want to talk to customer support', 'en');
  assert.equal(result.matched, 'escalation');
  assert.equal(result.escalate, true);
});

test('explicit Arabic Support request still escalates', () => {
  const result = answerFaq('عايز أتكلم مع الدعم', 'ar');
  assert.equal(result.matched, 'escalation');
  assert.equal(result.escalate, true);
});

test('greeting variants can produce natural response variation', () => {
  const replies = ['hi','hello','good morning'].map((message) => answerFaq(message, 'en').answer);
  assert.ok(new Set(replies).size > 1);
});

test('combined greeting and wellbeing messages stay conversational', () => {
  for (const message of ['Hi, how are you?', "Hello, how's it going?"]) {
    const result = answerFaq(message, 'en');
    assert.equal(result.matched, 'wellbeing', message);
    assert.equal(result.escalate, false, message);
  }
});

test('help and capability questions return localized guidance without escalation', () => {
  const fixtures = [
    ['en','can you help me?'], ['en','help'], ['en','what can you help me with?'], ['en','what can I ask you?'], ['en','what do you do?'],
    ['ar','ممكن تساعدني'], ['ar','ساعدني'], ['ar','بتساعد في ايه'], ['ar','بتعرف تعمل ايه'], ['ar','انت بتعمل ايه'], ['ar','ممكن اسألك عن ايه'],
    ['fr','que puis-je vous demander ?'], ['ru','чем вы можете помочь?'], ['tr','ne konuda yardım edebilirsin?'], ['de','wobei können Sie helfen?'],
  ];
  for (const [language, message] of fixtures) {
    const result = answerFaq(message, language);
    assert.equal(result.matched, 'capability', `${language}: ${message}`);
    assert.equal(result.escalate, false, `${language}: ${message}`);
    assert.ok(result.answer.length > 20, `${language}: ${message}`);
  }
});

test('identity questions transparently identify the automated assistant without escalation', () => {
  const fixtures = [
    ['en','who are you?'], ['en','are you a bot?'], ['en','are you human?'], ['en',"what's your name?"],
    ['ar','انت مين'], ['ar','إنت مين'], ['ar','اسمك ايه'], ['ar','انت بوت'], ['ar','انت روبوت'], ['ar','انت انسان'],
    ['fr','êtes-vous un bot ?'], ['ru','вы человек?'], ['tr','insan mısın?'], ['de','sind Sie ein Mensch?'],
  ];
  for (const [language, message] of fixtures) {
    const result = answerFaq(message, language);
    assert.equal(result.matched, 'identity', `${language}: ${message}`);
    assert.equal(result.escalate, false, `${language}: ${message}`);
    assert.ok(result.answer.length > 20, `${language}: ${message}`);
  }
});

test('every conversational intent is supported in every active language', () => {
  const fixtures = {
    en:{greeting:'hello',capability:'help',identity:'who are you?',wellbeing:'how are things?',thanks:'appreciate it',acknowledgement:'understood',farewell:'goodbye'},
    ar:{greeting:'مرحبا',capability:'ممكن تساعدني',identity:'انت روبوت',wellbeing:'اخبارك ايه',thanks:'شكرا ليك',acknowledgement:'اوك',farewell:'مع السلامة'},
    fr:{greeting:'bonjour',capability:'que puis-je vous demander ?',identity:'êtes-vous un bot ?',wellbeing:'comment vas-tu ?',thanks:'merci beaucoup',acknowledgement:'compris',farewell:'au revoir'},
    ru:{greeting:'привет',capability:'чем вы можете помочь?',identity:'вы человек?',wellbeing:'как твои дела',thanks:'благодарю вас',acknowledgement:'понятно',farewell:'до свидания'},
    tr:{greeting:'merhaba',capability:'ne konuda yardım edebilirsin?',identity:'insan mısın?',wellbeing:'nasılsınız',thanks:'çok teşekkürler',acknowledgement:'anladım',farewell:'görüşürüz'},
    de:{greeting:'hallo',capability:'wobei können Sie helfen?',identity:'sind Sie ein Mensch?',wellbeing:"wie geht's?",thanks:'herzlichen Dank',acknowledgement:'alles klar',farewell:'auf Wiedersehen'},
  };
  for (const [language, intents] of Object.entries(fixtures)) for (const [intent, message] of Object.entries(intents)) {
    const result = answerFaq(message, language);
    assert.equal(result.matched, intent, `${language}/${intent}: ${message}`);
    assert.equal(result.escalate, false, `${language}/${intent}: ${message}`);
    assert.ok(result.answer.length > 10, `${language}/${intent}: ${message}`);
  }
});

test('minimum Arabic conversational spellings are regression tested directly', () => {
  const fixtures = [
    ['اهلا','greeting'], ['السلام عليكم','greeting'], ['ازيك','wellbeing'], ['شكرا','thanks'],
    ['مع السلامة','farewell'], ['ممكن تساعدني','capability'], ['انت مين','identity'], ['تمام','acknowledgement'],
  ];
  for (const [message, intent] of fixtures) {
    const result = answerFaq(message, 'ar');
    assert.equal(result.matched, intent, message);
    assert.equal(result.escalate, false, message);
  }
});

test('standalone Arabic سلام greets while clear farewell phrases remain farewells', () => {
  const greetingAnswers = new Set([
    answerFaq('سلام', 'ar').answer,
    answerFaq('السلام عليكم', 'ar').answer,
  ]);
  const farewellAnswer = answerFaq('مع السلامة', 'ar').answer;

  for (const message of ['سلام', 'السلام عليكم']) {
    const result = answerFaq(message, 'ar');
    assert.equal(result.matched, 'greeting', message);
    assert.equal(result.escalate, false, message);
    assert.ok(greetingAnswers.has(result.answer), message);
  }

  for (const message of ['مع السلامة', 'باي']) {
    const result = answerFaq(message, 'ar');
    assert.equal(result.matched, 'farewell', message);
    assert.equal(result.escalate, false, message);
    assert.equal(result.answer, farewellAnswer, message);
  }
});

test('conversational messages never use the unknown fallback or request contact', () => {
  for (const message of ['hi','hello','thanks','ok','who are you?','help','bye']) {
    const result = answerFaq(message, 'en');
    assert.notEqual(result.matched, null, message);
    assert.equal(result.escalate, false, message);
    assert.notEqual(result.answer, answerFaq('unanswerable Atlantis question', 'en').answer, message);
  }
});
