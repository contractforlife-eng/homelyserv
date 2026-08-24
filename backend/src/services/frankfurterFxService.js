const FRANKFURTER_API_BASE_URL = 'https://api.frankfurter.dev/v2';
const DEFAULT_TIMEOUT_MS = 5000;

export class FrankfurterFxError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FrankfurterFxError';
    this.code = code;
  }
}

const isDecimal = (value) => (
  typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim())
);

const toPlainDecimal = (value) => {
  const text = String(value ?? '').trim();
  if (isDecimal(text)) return text;
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i);
  if (!match) return text;
  const sign = match[1] === '-' ? '-' : '';
  const digits = `${match[2]}${match[3] || ''}`;
  const decimalPosition = match[2].length + Number(match[4]);
  if (decimalPosition <= 0) return `${sign}0.${'0'.repeat(-decimalPosition)}${digits}`;
  if (decimalPosition >= digits.length) return `${sign}${digits}${'0'.repeat(decimalPosition - digits.length)}`;
  return `${sign}${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
};

const isWorkingDay = (date) => {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
};

export const workingDaysSince = (effectiveDate, nowDate) => {
  const cursor = new Date(Date.UTC(
    effectiveDate.getUTCFullYear(),
    effectiveDate.getUTCMonth(),
    effectiveDate.getUTCDate(),
  ));
  const end = new Date(Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
  ));
  let workingDays = 0;
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor)) workingDays += 1;
  }
  return workingDays;
};

export const validateFrankfurterQuote = ({ quote, sourceCurrency, now = Date.now(), maxWorkingDays = 3 } = {}) => {
  const source = String(sourceCurrency || '').trim().toUpperCase();
  const effectiveDate = typeof quote?.effectiveAt === 'string'
    ? new Date(quote.effectiveAt)
    : new Date('invalid');
  const nowDate = new Date(now);

  if (!quote || quote.base !== source || quote.quote !== 'USD') {
    throw new FrankfurterFxError('INVALID_PROVIDER_QUOTE', 'Frankfurter returned an unexpected currency pair');
  }
  const normalizedRate = toPlainDecimal(quote.rate);
  if (!isDecimal(normalizedRate) || !/[1-9]/.test(normalizedRate)) {
    throw new FrankfurterFxError('INVALID_PROVIDER_QUOTE', 'Frankfurter returned an invalid rate');
  }
  if (!Number.isFinite(effectiveDate.getTime()) || effectiveDate > nowDate) {
    throw new FrankfurterFxError('INVALID_PROVIDER_QUOTE', 'Frankfurter returned an invalid effective date');
  }
  if (workingDaysSince(effectiveDate, nowDate) > maxWorkingDays) {
    throw new FrankfurterFxError('STALE_PROVIDER_QUOTE', 'Frankfurter quote is stale');
  }

  return Object.freeze({
    base: source,
    quote: 'USD',
    rate: normalizedRate,
    effectiveAt: effectiveDate.toISOString(),
    fetchedAt: quote.fetchedAt || nowDate.toISOString(),
    source: quote.source || 'Frankfurter',
    version: quote.version || 'v2',
  });
};

export const fetchFrankfurterQuote = async (sourceCurrency, {
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  now = Date.now(),
  baseUrl = FRANKFURTER_API_BASE_URL,
} = {}) => {
  const source = String(sourceCurrency || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(source) || source === 'USD') {
    throw new FrankfurterFxError('INVALID_SOURCE_CURRENCY', 'Invalid Frankfurter source currency');
  }
  if (!String(baseUrl).startsWith('https://')) {
    throw new FrankfurterFxError('INSECURE_PROVIDER_URL', 'Frankfurter provider URL must use HTTPS');
  }
  if (typeof fetchImpl !== 'function') {
    throw new FrankfurterFxError('PROVIDER_UNAVAILABLE', 'Frankfurter provider is unavailable');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, '')}/rate/${source}/USD`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response?.ok) {
      throw new FrankfurterFxError('PROVIDER_HTTP_ERROR', 'Frankfurter provider request failed');
    }
    let body;
    try {
      body = await response.json();
    } catch {
      throw new FrankfurterFxError('INVALID_PROVIDER_RESPONSE', 'Frankfurter provider response was invalid');
    }
    return validateFrankfurterQuote({
      quote: {
        base: body?.base,
        quote: body?.quote,
        rate: String(body?.rate ?? ''),
        effectiveAt: body?.date,
        fetchedAt: new Date(now).toISOString(),
        source: 'Frankfurter',
        version: 'v2',
      },
      sourceCurrency: source,
      now,
    });
  } catch (error) {
    if (error instanceof FrankfurterFxError) throw error;
    throw new FrankfurterFxError(
      error?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
      'Frankfurter provider is unavailable',
    );
  } finally {
    clearTimeout(timeout);
  }
};

export default fetchFrankfurterQuote;
