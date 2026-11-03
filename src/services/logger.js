const metadataKeys = ['updateId', 'durationMs', 'telegramUserId', 'languageCode', 'type', 'changed', 'delivered', 'subscribers', 'checked', 'failed', 'notified', 'code', 'telegramCode', 'upstreamStatus'];
const errorCodes = new Set([
  'invalid_upstream_origin', 'request_queue_full', 'request_cancelled', 'upstream_timeout', 'upstream_unavailable',
  'upstream_http_error', 'invalid_upstream_json', 'invalid_passport_type', 'invalid_passport_uid',
  'passport_not_found', 'invalid_upstream_response',
  'EADDRINUSE', 'EACCES', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN',
]);

export const logger = Object.freeze({
  info: (event, details) => write('info', event, details),
  warn: (event, details) => write('warn', event, details),
  error(event, error, details) {
    let code = errorCodes.has(error?.code) || /^SQLITE_(BUSY|LOCKED|CONSTRAINT|ERROR|READONLY|IOERR|CORRUPT|FULL|CANTOPEN|NOTADB|MISUSE|NOMEM)(_[A-Z]+)?$/.test(error?.code ?? '')
      ? error.code : undefined;

    if (!code && ['AbortError', 'TimeoutError'].includes(error?.name)) {
      code = error.name;
    }

    write('error', event, {
      ...details, code,
      telegramCode: Number.isInteger(error?.error_code) ? error.error_code : undefined,
      upstreamStatus: Number.isInteger(error?.upstreamStatus) ? error.upstreamStatus : undefined,
      durationMs: Number.isFinite(error?.durationMs) ? error.durationMs : details?.durationMs,
    });
  },
});

function write(level, event, details = {}) {
  const metadata = Object.fromEntries(Object.entries(details).filter(([key, value]) => metadataKeys.includes(key)
    && ['string', 'number', 'boolean'].includes(typeof value)));

  if (typeof details.uid === 'string' && /^\d+$/.test(details.uid)) {
    metadata.orderRef = `*${details.uid.slice(Math.max(1, details.uid.length - 6))}`;
  }

  const line = JSON.stringify({ time: new Date().toISOString(), event, ...metadata });

  console[level](line);
}
