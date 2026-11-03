import PQueue from 'p-queue';

import { PASSPORT_UPSTREAM_POLICY, PASSPORT_UPSTREAMS, UPSTREAM_HEADERS } from '../constants.js';

const queues = new Map(Object.values(PASSPORT_UPSTREAMS).map(({ baseUrl }) => [new URL(baseUrl).origin, new PQueue({
  concurrency: 1,
  intervalCap: 1,
  interval: PASSPORT_UPSTREAM_POLICY.minRequestStartIntervalMs,
  strict: true,
})]));

export async function requestJson(input) {
  const startedAt = Date.now();
  const target = new URL(input.path.replace(/^\//, ''), input.origin);
  const queue = queues.get(target.origin);
  const deadline = AbortSignal.timeout(PASSPORT_UPSTREAM_POLICY.totalDeadlineMs);
  const signal = input.signal ? AbortSignal.any([input.signal, deadline]) : deadline;

  if (!queue) {
    throw new PassportServiceError({ code: 'invalid_upstream_origin', status: 400 });
  }

  for (const [name, value] of Object.entries(input.searchParams ?? {})) {
    target.searchParams.set(name, value);
  }

  if (queue.size + queue.pending >= PASSPORT_UPSTREAM_POLICY.maxPendingRequests) {
    throw new PassportServiceError({ code: 'request_queue_full', status: 503 });
  }

  try {
    return await queue.add(() => fetchJson(target, input.referer, signal), { signal });
  } catch (error) {
    const failure = error instanceof PassportServiceError ? error
      : new PassportServiceError({
        code: input.signal?.aborted ? 'request_cancelled'
          : signal.aborted || error.name === 'TimeoutError' ? 'upstream_timeout' : 'upstream_unavailable',
        status: input.signal?.aborted ? 499 : 502,
        cause: error,
      });

    failure.upstream = target.origin;
    failure.durationMs = Date.now() - startedAt;

    throw failure;
  }
}

async function fetchJson(target, referer, signal) {
  const response = await fetch(target, {
    headers: { ...UPSTREAM_HEADERS, Referer: referer },
    redirect: 'manual',
    signal: AbortSignal.any([signal, AbortSignal.timeout(PASSPORT_UPSTREAM_POLICY.requestDeadlineMs)]),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new PassportServiceError({ code: 'upstream_http_error', status: 502, upstreamStatus: response.status });
  }

  try {
    return await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    // JSON.parse errors may contain fragments of the private upstream response.
    throw new PassportServiceError({ code: 'invalid_upstream_json', status: 502 });
  }
}

export class PassportServiceError extends Error {
  constructor({ code, status, cause, upstreamStatus }) {
    super(code, { cause });
    this.name = 'PassportServiceError';
    this.code = code;
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
}
