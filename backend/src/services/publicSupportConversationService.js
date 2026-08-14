import { normalizeFaqText } from './publicSupportFaqMatcher.js';

export function answerConversation(text, language, copyByLanguage, aliasesByLanguage) {
  const aliases = aliasesByLanguage[language] || aliasesByLanguage.en;
  const normalized = normalizeFaqText(text, language);
  if (!normalized || normalized.split(' ').length > 6) return null;

  const greetings = (aliases.greeting || []).map((phrase) => normalizeFaqText(phrase, language));
  const wellbeing = (aliases.wellbeing || []).map((phrase) => normalizeFaqText(phrase, language));
  let intent = greetings.some((greeting) => wellbeing.some((question) => normalized === `${greeting} ${question}` || normalized === `${question} ${greeting}`))
    ? 'wellbeing'
    : null;

  if (!intent) {
    for (const [candidate, phrases] of Object.entries(aliases)) {
      if (phrases.some((phrase) => normalizeFaqText(phrase, language) === normalized)) {
        intent = candidate;
        break;
      }
    }
  }
  if (!intent) return null;

  const reply = (copyByLanguage[language] || copyByLanguage.en)[intent];
  if (!Array.isArray(reply)) return { intent, answer:reply };
  const selector = [...normalized].reduce((total, character) => total + character.codePointAt(0), 0);
  return { intent, answer:reply[selector % reply.length] };
}
