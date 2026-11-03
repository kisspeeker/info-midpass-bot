const MILLISECONDS_PER_SECOND = 1_000;

export function unixTimeNow() {
  return Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
}

export function millisecondsToSeconds(value) {
  return Math.ceil(value / MILLISECONDS_PER_SECOND);
}

export function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(typeof value === 'number' ? value * MILLISECONDS_PER_SECOND : value);
}
