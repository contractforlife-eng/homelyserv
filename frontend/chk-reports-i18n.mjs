// Temporary i18n parity check for the Doctor CMS (doctorCms) block —
// CMS_EN/AR/FR/RU/TR/DE (merged with CLINIC_PATIENT_TRANSLATIONS, which
// lands in the same `doctorCms` namespace) + keys used by DoctorCmsReports.
import {
  CMS_EN, CMS_AR, CMS_FR, CMS_RU, CMS_TR, CMS_DE,
  CLINIC_PATIENT_TRANSLATIONS
} from './src/i18n/doctorCms.js';
import fs from 'node:fs';

const cms = {
  en: CMS_EN,
  ar: CMS_AR,
  fr: CMS_FR,
  ru: CMS_RU,
  tr: CMS_TR,
  de: CMS_DE
};

// Same merge order as i18n/index.js: CMS block first, clinic-patient on top.
const merged = {};
for (const lang of Object.keys(cms)) {
  merged[lang] = { ...cms[lang], ...(CLINIC_PATIENT_TRANSLATIONS[lang] || {}) };
}

const flatKeys = (obj, prefix = '', out = new Set()) => {
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object') flatKeys(obj[k], path, out);
    else out.add(path);
  }
  return out;
};

const enKeys = flatKeys(merged.en);
console.log(`blocks: ${Object.keys(merged).length} | en keys: ${enKeys.size}`);
for (const lang of Object.keys(merged)) {
  const keys = flatKeys(merged[lang]);
  const missing = [...enKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !enKeys.has(k));
  console.log(
    `  ${lang}: ${keys.size} | missing: ${missing.length ? missing.join(',') : 'none'} | extra: ${extra.length ? extra.join(',') : 'none'}`
  );
}

// Keys referenced by the audited pages (Reports + HomelyServ module +
// Employer search doctor cards)
const PAGES = [
  './src/pages/DoctorCmsReports.jsx',
  './src/pages/DoctorHomelyServ.jsx',
  './src/pages/DoctorHomelyServRequests.jsx',
  './src/pages/DoctorHomelyServProfile.jsx',
  './src/pages/EmployerSearch.jsx'
];
const used = new Set();
for (const pagePath of PAGES) {
  const page = fs.readFileSync(new URL(pagePath, import.meta.url), 'utf8');
  for (const m of page.matchAll(/t\(\s*['`]([^'`${]+)['`]/g)) used.add(m[1]);
}
const indexSrc = fs.readFileSync(new URL('./src/i18n/index.js', import.meta.url), 'utf8');

let unresolved = 0;
for (const key of [...used].sort()) {
  let ok;
  if (key.startsWith('doctorCms.')) {
    ok = enKeys.has(key.slice('doctorCms.'.length));
  } else if (key.includes('.')) {
    // e.g. doctorSchedule.types.X / doctorNav.premium — resolved in index.js
    const leaf = key.split('.').pop();
    ok = indexSrc.includes(`${leaf}:`);
  } else {
    ok = indexSrc.includes(`${key}:`);
  }
  if (!ok) unresolved += 1;
  console.log(`  ${ok ? 'OK  ' : 'MISS'} ${key}`);
}
console.log(`used keys: ${used.size} | unresolved: ${unresolved}`);

// Template keys used with interpolation (t(`doctorCms.${labelKey}`))
const templateKeyCheck = ['periodAllTime', 'periodToday', 'periodLast7', 'last30Days', 'periodThisMonth'];
const missingTemplates = templateKeyCheck.filter((k) => !enKeys.has(k));
console.log(`  template doctorCms.<period labelKey> missing: ${missingTemplates.length ? missingTemplates.join(',') : 'none'}`);

const typeKeys = ['doctorSchedule.types.CLINIC', 'doctorSchedule.types.HOME_VISIT', 'doctorSchedule.types.ONLINE'];
const missingTypes = typeKeys.filter((k) => !indexSrc.includes(`${k.split('.').pop()}:`));
console.log(`  doctorSchedule.types.* missing: ${missingTypes.length ? missingTypes.join(',') : 'none'}`);
