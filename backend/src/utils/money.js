import { isSupportedCurrency, normalizeCurrencyCode } from './currencyMetadata.js';

// ISO 4217 exceptions represented by HomelyServ's supported-currency
// metadata. All other supported currencies use two fractional digits.
const ZERO_MINOR_UNIT_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KRW', 'RWF', 'UGX', 'VND', 'XAF', 'XOF',
]);
const THREE_MINOR_UNIT_CURRENCIES = new Set([
  'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND',
]);

const decimalParts = (value) => {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('Money amount must be finite');
  }
  const source = String(value).trim();
  const match = source.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) throw new TypeError('Money amount must be a plain decimal');
  const fraction = match[3] || '';
  return {
    negative: match[1] === '-',
    coefficient: BigInt(`${match[2]}${fraction}`),
    scale: fraction.length,
  };
};

export const getCurrencyMinorUnit = (currency) => {
  const code = normalizeCurrencyCode(currency);
  if (!code || !isSupportedCurrency(code)) {
    throw new TypeError(`Unsupported currency minor unit: ${String(currency)}`);
  }
  if (ZERO_MINOR_UNIT_CURRENCIES.has(code)) return 0;
  if (THREE_MINOR_UNIT_CURRENCIES.has(code)) return 3;
  return 2;
};

const divideRounded = (numerator, denominator) => {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
};

const minorToNumber = (minorAmount, minorUnit) => {
  const factor = 10n ** BigInt(minorUnit);
  const whole = minorAmount / factor;
  const fraction = (minorAmount % factor).toString().padStart(minorUnit, '0');
  return Number(minorUnit ? `${whole}.${fraction}` : String(whole));
};

export const toMinorUnits = (amount, currency) => {
  const minorUnit = getCurrencyMinorUnit(currency);
  const { negative, coefficient, scale } = decimalParts(amount);
  const scaledNumerator = coefficient * (10n ** BigInt(minorUnit));
  const minorAmount = divideRounded(scaledNumerator, 10n ** BigInt(scale));
  const signed = negative ? -minorAmount : minorAmount;
  const numeric = Number(signed);
  if (!Number.isSafeInteger(numeric)) throw new RangeError('Money amount exceeds safe minor-unit range');
  return numeric;
};

export const roundMoney = (amount, currency) => {
  const minorUnit = getCurrencyMinorUnit(currency);
  return minorToNumber(BigInt(toMinorUnits(amount, currency)), minorUnit);
};

export const multiplyMoneyByRatio = (amount, numerator, denominator, currency) => {
  const minorUnit = getCurrencyMinorUnit(currency);
  const parts = decimalParts(amount);
  if (parts.negative) throw new RangeError('Money amount must not be negative');
  const ratioNumerator = BigInt(numerator);
  const ratioDenominator = BigInt(denominator);
  if (ratioNumerator < 0n || ratioDenominator <= 0n) throw new RangeError('Invalid monetary ratio');
  const scaledNumerator = parts.coefficient * ratioNumerator * (10n ** BigInt(minorUnit));
  const scaledDenominator = (10n ** BigInt(parts.scale)) * ratioDenominator;
  return minorToNumber(divideRounded(scaledNumerator, scaledDenominator), minorUnit);
};

export const multiplyMoneyByDecimal = (amount, multiplier, currency) => {
  const parts = decimalParts(multiplier);
  if (parts.negative) throw new RangeError('Money multiplier must not be negative');
  return multiplyMoneyByRatio(amount, parts.coefficient, 10n ** BigInt(parts.scale), currency);
};

export const addMoney = (amounts, currency) => {
  const totalMinor = amounts.reduce((sum, amount) => sum + BigInt(toMinorUnits(amount, currency)), 0n);
  return minorToNumber(totalMinor, getCurrencyMinorUnit(currency));
};

export const formatMoneyDecimal = (amount, currency) => {
  const minorUnit = getCurrencyMinorUnit(currency);
  return roundMoney(amount, currency).toFixed(minorUnit);
};
