// Temporary i18n parity check for the doctorSchedule block (6 languages).
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./src/i18n/index.js', import.meta.url), 'utf8');

const langs = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
const langSection = {};
for (let i = 0; i < langs.length; i++) {
  const start = src.indexOf(`const ${langs[i]} = {`);
  const end = i + 1 < langs.length ? src.indexOf(`const ${langs[i + 1]} = {`) : src.indexOf('const resources');
  langSection[langs[i]] = { start, end };
}

const flatKeys = (obj, prefix = '', out = new Set()) => {
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object') flatKeys(obj[k], path, out);
    else out.add(path);
  }
  return out;
};

const extractBlock = (text) => {
  const idx = text.indexOf('doctorSchedule: {');
  if (idx < 0) return null;
  let depth = 0;
  let i = text.indexOf('{', idx);
  const startI = i;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return text.slice(startI, i + 1);
};

const parseObject = (blockText) =>
  // eslint-disable-next-line no-new-func
  Function(`"use strict"; return (${blockText});`)();

const perLang = {};
for (const lang of langs) {
  const { start, end } = langSection[lang];
  const blockText = extractBlock(src.slice(start, end));
  perLang[lang] = flatKeys(parseObject(blockText), 'doctorSchedule');
}

const enKeys = perLang.en;
console.log(`blocks: ${langs.filter((l) => perLang[l]).length} | en keys: ${enKeys.size}`);
for (const lang of langs) {
  const missing = [...enKeys].filter((k) => !perLang[lang].has(k));
  const extra = [...perLang[lang]].filter((k) => !enKeys.has(k));
  console.log(
    `  ${lang}: ${perLang[lang].size} | missing: ${missing.length ? missing.join(',') : 'none'} | extra: ${extra.length ? extra.join(',') : 'none'}`
  );
}

// Keys referenced by DoctorSchedule.jsx
const page = fs.readFileSync(new URL('./src/pages/DoctorSchedule.jsx', import.meta.url), 'utf8');
const used = new Set();
for (const m of page.matchAll(/t\(\s*['`]([^'`]+)['`]/g)) used.add(m[1]);
const resolved = [];
for (const key of used) {
  if (key.includes('${')) {
    const prefix = key.slice(0, key.indexOf('${'));
    const hits = [...enKeys].filter((k) => k.startsWith(prefix));
    resolved.push([key, hits.length > 0]);
  } else {
    resolved.push([key, enKeys.has(key)]);
  }
}
const unresolved = resolved.filter(([, ok]) => !ok);
console.log(
  `used keys: ${resolved.length} | unresolved: ${unresolved.length ? unresolved.map(([k]) => k).join(', ') : 'none'}`
);
