const SENSITIVE_KEY = /authorization|password|secret|token|body|text/i;
const UID_KEY = /uid/i;
const BASIC_CREDENTIALS = /Basic\s+[A-Za-z0-9+/]+={0,2}/g;
const BEARER_CREDENTIALS = /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const TELEGRAM_BOT_TOKEN = /\b(?:bot)?\d{5,}:[A-Za-z0-9_-]{20,}\b/g;
const BIOMETRIC_UID = /\b\d{19}(\d{6})\b/g;
const PASSPORT_REQUEST_UID = /(\/api\/request\/|[?&]folderId=)\d+/g;

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
    time: new Date().toISOString(),
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

function normalizeError(error, depth = 0) {
  const cause = error?.cause ?? error?.error;

  return {
    name: error?.name ?? 'Error',
    code: error?.code ?? null,
    message: sanitizeString(error?.message ?? 'Unknown error'),
    ...(error?.status != null ? { status: error.status } : {}),
    ...(error?.upstream ? { upstream: error.upstream, durationMs: error.durationMs } : {}),
    ...(error?.upstreamStatus != null ? { upstreamStatus: error.upstreamStatus } : {}),
    ...(depth === 0 && error?.name !== 'PassportServiceError'
      ? { stack: sanitizeString(error?.stack ?? '').slice(0, 2_000) || null } : {}),
    ...(cause && depth < 3 ? { cause: normalizeError(cause, depth + 1) } : {}),
    ...(Array.isArray(error?.errors) && depth < 3
      ? { errors: error.errors.slice(0, 5).map((item) => normalizeError(item, depth + 1)) } : {}),
  };
}

function sanitize(value, key = '', depth = 0) {
  if (SENSITIVE_KEY.test(key)) {
    return '[REDACTED]';
  }

  if (UID_KEY.test(key)) {
    return shortenUid(value);
  }

  if (depth > 8) {
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
    .replace(PASSPORT_REQUEST_UID, '$1[REDACTED]')
    .replace(BIOMETRIC_UID, '…$1');
}

function shortenUid(value) {
  const uid = String(value ?? '');

  return uid.length > 6 ? `…${uid.slice(-6)}` : uid;
}
