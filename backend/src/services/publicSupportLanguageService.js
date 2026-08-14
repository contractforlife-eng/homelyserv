export const SUPPORTED_PUBLIC_SUPPORT_LANGUAGES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

const wordSets = {
  en:new Set(['the','and','how','what','where','account','help','support','worker','employer','register','password','payment','please']),
  fr:new Set(['le','la','les','et','comment','quel','quelle','compte','aide','assistance','travailleur','employeur','inscription','mot','passe','paiement','bonjour']),
  tr:new Set(['ve','nasıl','nedir','hesap','yardım','destek','çalışan','işveren','kayıt','şifre','ödeme','lütfen','merhaba']),
  de:new Set(['der','die','das','und','wie','was','konto','hilfe','support','arbeitnehmer','arbeitgeber','registrieren','passwort','zahlung','bitte','hallo']),
  ru:new Set(['как','что','где','аккаунт','помощь','поддержка','работник','работодатель','регистрация','пароль','оплата','пожалуйста','здравствуйте']),
  ar:new Set(['كيف','ما','أين','حساب','مساعدة','دعم','عامل','صاحب','عمل','تسجيل','كلمة','المرور','دفع','من','فضلك','مرحبا']),
};

const normalizeWords = (text) => String(text || '').toLocaleLowerCase().match(/[\p{L}]+/gu) || [];

const strongGreetingLanguages = new Map([
  ['hello','en'], ['bonjour','fr'], ['مرحبا','ar'], ['مرحباً','ar'],
  ['привет','ru'], ['здравствуйте','ru'], ['merhaba','tr'], ['hallo','de'],
]);

export function detectSupportedLanguage(text, fallbackLanguage = 'en') {
  const fallback = SUPPORTED_PUBLIC_SUPPORT_LANGUAGES.includes(fallbackLanguage) ? fallbackLanguage : 'en';
  const value = String(text || '').trim();
  const words = normalizeWords(value);
  const greetingLanguage = strongGreetingLanguages.get(words.join(' '));
  if (greetingLanguage) return { language:greetingLanguage, confident:true };
  if (value.length < 4 || words.length < 2) return { language:fallback, confident:false };

  if (/\p{Script=Arabic}/u.test(value)) return { language:'ar', confident:true };
  if (/\p{Script=Cyrillic}/u.test(value)) return { language:'ru', confident:true };
  if (/[ğüşöçıİ]/i.test(value)) return { language:'tr', confident:true };
  if (/[äöüß]/i.test(value)) return { language:'de', confident:true };
  if (/[àâçéèêëîïôùûüÿœ]/i.test(value)) return { language:'fr', confident:true };

  const scores = Object.fromEntries(['en','fr','tr','de'].map((language) => [language, words.reduce((score, word) => score + (wordSets[language].has(word) ? 1 : 0), 0)]));
  const ranked = Object.entries(scores).sort((a,b) => b[1] - a[1]);
  if (ranked[0][1] >= 2 && ranked[0][1] > ranked[1][1]) return { language:ranked[0][0], confident:true };
  return { language:fallback, confident:false };
}

export function applyDetectedConversationLanguage(conversation, text) {
  const result = detectSupportedLanguage(text, conversation?.language);
  if (result.confident && conversation) conversation.language = result.language;
  return result;
}
