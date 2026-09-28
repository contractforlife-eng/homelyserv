// scripts/i18n-audit.mjs — temporary audit utility (safe to delete)
// Loads the real i18n module with DOM stubs and verifies that every doctor-*
// translation key referenced in Doctor page files exists in every language
// bundle (en, ar, fr, ru, tr, de).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const frontendDir = path.join(repoRoot, 'frontend');

globalThis.document = {
  documentElement: { classList: { add() {}, remove() {} } },
  addEventListener() {},
  removeEventListener() {}
};
globalThis.window = {
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  addEventListener() {},
  removeEventListener() {}
};
globalThis.localStorage = globalThis.window.localStorage;

process.chdir(frontendDir);
const i18nModule = await import(pathToFileURL(path.join(frontendDir, 'src/i18n/index.js')).href);
const i18n = i18nModule.default;

const pageDir = path.join(frontendDir, 'src/pages');
const compDirs = [
  path.join(frontendDir, 'src/components/doctor'),
  path.join(frontendDir, 'src/components/layout')
];
const files = [
  ...fs.readdirSync(pageDir)
    .filter((f) => /^Doctor|^(MedicalProfile|PatientPrescriptions|PrintablePrescription)/.test(f))
    .map((f) => path.join(pageDir, f)),
  ...compDirs.flatMap((d) => fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.jsx')).map((f) => path.join(d, f)) : [])
];

const usedKeys = new Set();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z][a-zA-Z0-9_.]+)'/g)) {
    usedKeys.add(m[1]);
  }
}

const langs = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
// i18next stores resources under services.resourceStore.data.<lng>.translation
const store = i18n.services?.resourceStore?.data || {};
const bundles = Object.fromEntries(langs.map((l) => [l, store[l]?.translation || {}]));
const hasKey = (bundle, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle) !== undefined;
const doctorKeys = [...usedKeys].filter((k) => k.startsWith('doctor') || k.startsWith('medicalProfile'));

let totalMissing = 0;
for (const lang of langs) {
  const missing = doctorKeys.filter((k) => !hasKey(bundles[lang], k));
  if (missing.length) {
    console.log(`\n[${lang}] missing ${missing.length} keys:`);
    missing.forEach((k) => console.log('  ', k));
    totalMissing += missing.length;
  }
}
if (totalMissing === 0) {
  console.log(`OK: all ${doctorKeys.length} doctor-* keys present in all ${langs.length} languages.`);
} else {
  console.log(`\nTOTAL MISSING: ${totalMissing}`);
  process.exitCode = 1;
}
