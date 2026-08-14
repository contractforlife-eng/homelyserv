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
  assert.equal(answer.escalate, true);
  assert.equal(answer.matched, null);
});

test('short social and acknowledgement messages do not false-match FAQ intents', () => {
  for (const message of ['ok','hello','thanks','yes','no']) {
    const result = answerFaq(message, 'en');
    assert.equal(result.matched, null, message);
    assert.equal(result.escalate, true);
  }
});
