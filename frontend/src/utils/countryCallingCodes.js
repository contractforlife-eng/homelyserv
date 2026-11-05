// Shared country calling codes for frontend components and utilities.
// Re-exports identical mapping from backend/src/utils/countryCallingCodes.js.

export const COUNTRY_CALLING_CODES = {
  EG: '20',   // Egypt
  SA: '966',  // Saudi Arabia
  AE: '971',  // United Arab Emirates
  KW: '965',  // Kuwait
  QA: '974',  // Qatar
  BH: '973',  // Bahrain
  OM: '968',  // Oman
  JO: '962',  // Jordan
  LB: '961',  // Lebanon
  PS: '970',  // Palestine
  IQ: '964',  // Iraq
  SY: '963',  // Syria
  YE: '967',  // Yemen
  LY: '218',  // Libya
  TN: '216',  // Tunisia
  DZ: '213',  // Algeria
  MA: '212',  // Morocco
  MR: '222',  // Mauritania
  SD: '249',  // Sudan
  SS: '211',  // South Sudan
  SO: '252',  // Somalia
  DJ: '253',  // Djibouti
  ER: '291',  // Eritrea
  ET: '251',  // Ethiopia
  KE: '254',  // Kenya
  TZ: '255',  // Tanzania
  UG: '256',  // Uganda
  RW: '250',  // Rwanda
  BI: '257',  // Burundi
  CD: '243',  // DR Congo
  CG: '242',  // Congo
  GA: '241',  // Gabon
  CM: '237',  // Cameroon
  NG: '234',  // Nigeria
  GH: '233',  // Ghana
  CI: '225',  // Ivory Coast
  SN: '221',  // Senegal
  ML: '223',  // Mali
  NE: '227',  // Niger
  TD: '235',  // Chad
  CF: '236',  // Central African Republic
  BJ: '229',  // Benin
  TG: '228',  // Togo
  BF: '226',  // Burkina Faso
  GW: '245',  // Guinea-Bissau
  GN: '224',  // Guinea
  SL: '232',  // Sierra Leone
  LR: '231',  // Liberia
  GM: '220',  // Gambia
  ZA: '27',   // South Africa
  NA: '264',  // Namibia
  BW: '267',  // Botswana
  ZM: '260',  // Zambia
  ZW: '263',  // Zimbabwe
  MW: '265',  // Malawi
  MZ: '258',  // Mozambique
  MG: '261',  // Madagascar
  MU: '230',  // Mauritius
  US: '1',    // United States
  CA: '1',    // Canada
  MX: '52',   // Mexico
  UK: '44',   // United Kingdom (legacy code)
  GB: '44',   // United Kingdom
  FR: '33',   // France
  DE: '49',   // Germany
  IT: '39',   // Italy
  ES: '34',   // Spain
  PT: '351',  // Portugal
  NL: '31',   // Netherlands
  BE: '32',   // Belgium
  CH: '41',   // Switzerland
  AT: '43',   // Austria
  SE: '46',   // Sweden
  NO: '47',   // Norway
  DK: '45',   // Denmark
  FI: '358',  // Finland
  IE: '353',  // Ireland
  GR: '30',   // Greece
  TR: '90',   // Turkey
  RU: '7',    // Russia
  UA: '380',  // Ukraine
  PL: '48',   // Poland
  IN: '91',   // India
  PK: '92',   // Pakistan
  BD: '880',  // Bangladesh
  LK: '94',   // Sri Lanka
  CN: '86',   // China
  JP: '81',   // Japan
  KR: '82',   // South Korea
  ID: '62',   // Indonesia
  PH: '63',   // Philippines
  VN: '84',   // Vietnam
  TH: '66',   // Thailand
  MY: '60',   // Malaysia
  SG: '65',   // Singapore
  AU: '61',   // Australia
  NZ: '64',   // New Zealand
  BR: '55',   // Brazil
  AR: '54',   // Argentina
  CL: '56',   // Chile
  CO: '57',   // Colombia
  PE: '51',   // Peru
  VE: '58'    // Venezuela
};

export const getCallingCodeByCountry = (countryCode) => {
  if (!countryCode) return null;
  const upper = String(countryCode).toUpperCase().trim();
  return COUNTRY_CALLING_CODES[upper] || null;
};
