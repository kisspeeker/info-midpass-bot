const SENSITIVE_KEY = /authorization|password|secret|token|body|text/i;
const UID_KEY = /uid/i;
const BASIC_CREDENTIALS = /Basic\s+[A-Za-z0-9+/]+={0,2}/g;
const BEARER_CREDENTIALS = /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const TELEGRAM_BOT_TOKEN = /\bbot\d+:[A-Za-z0-9_-]+\b/g;
const BIOMETRIC_UID = /\b(2000)\d{15}(\d{6})\b/g;

export const logger = Object.freeze({
  debug(event, details = {}) {
    write('debug', event, details);
  },
  info(event, details = {}) {
    write('info', event, details);
  },
  warn(event, details = {}) {
    write('warn', event, details);
  },
  error(event, error, details = {}) {
    write('error', event, {
      ...details,
      error: normalizeError(error),
    });
  },
});

function write(level, event, details) {
  const output = JSON.stringify({
    level,
    event,
    ...sanitize(details),
  });

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else if (level === 'info') {
    console.info(output);
  } else {
    console.log(output);
  }
}

function normalizeError(error) {
  return {
    name: error?.name ?? 'Error',
    code: error?.code ?? null,
    message: sanitizeString(error?.message ?? 'Unknown error'),
    stack: sanitizeString(error?.stack ?? '').slice(0, 2_000) || null,
  };
}

function sanitize(value, key = '', depth = 0) {
  if (SENSITIVE_KEY.test(key)) {
    return '[REDACTED]';
  }

  if (UID_KEY.test(key)) {
    return shortenUid(value);
  }

  if (depth > 4) {
    return '[TRUNCATED]';
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitize(item, '', depth + 1));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitize(childValue, childKey, depth + 1),
      ]),
    );
  }

  return typeof value === 'string' ? sanitizeString(value) : value;
}

function sanitizeString(value) {
  return String(value)
    .replace(BASIC_CREDENTIALS, 'Basic [REDACTED]')
    .replace(BEARER_CREDENTIALS, 'Bearer [REDACTED]')
    .replace(TELEGRAM_BOT_TOKEN, 'bot[REDACTED]')
    .replace(BIOMETRIC_UID, '$1…$2');
}

function shortenUid(value) {
  const uid = String(value ?? '');

  return uid.length > 6 ? `…${uid.slice(-6)}` : uid;
}
