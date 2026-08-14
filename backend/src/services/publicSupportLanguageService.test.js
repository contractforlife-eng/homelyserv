import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDetectedConversationLanguage, detectSupportedLanguage } from './publicSupportLanguageService.js';

const fixtures = {
  ar:'كيف يمكنني تسجيل حساب جديد',
  fr:'Comment créer un nouveau compte',
  ru:'Как зарегистрировать новый аккаунт',
  tr:'Nasıl yeni hesap kaydı yapabilirim',
  de:'Wie kann ich ein Konto registrieren',
  en:'How do I create an account',
};

for (const [language, message] of Object.entries(fixtures)) {
  test(`detects ${language} with reasonable confidence`, () => {
    assert.deepEqual(detectSupportedLanguage(message, 'en'), { language, confident:true });
  });
}

test('ambiguous short input retains the conversation language', () => {
  assert.deepEqual(detectSupportedLanguage('ok', 'fr'), { language:'fr', confident:false });
});

test('distinctive greetings can provide confident language evidence', () => {
  const fixtures = [['hello','en'],['bonjour','fr'],['مرحبا','ar'],['привет','ru'],['merhaba','tr'],['hallo','de']];
  for (const [message, language] of fixtures) {
    assert.deepEqual(detectSupportedLanguage(message, 'en'), { language, confident:true }, message);
  }
});

test('generic short and emoji-only messages never switch language', () => {
  for (const message of ['hi','ok','👍','🙂🙂']) {
    assert.deepEqual(detectSupportedLanguage(message, 'fr'), { language:'fr', confident:false }, message);
  }
});

test('a confident language change persists on the conversation object', () => {
  const conversation = { language:'en' };
  applyDetectedConversationLanguage(conversation, fixtures.ar);
  assert.equal(conversation.language, 'ar');
  applyDetectedConversationLanguage(conversation, 'ok');
  assert.equal(conversation.language, 'ar');
});
