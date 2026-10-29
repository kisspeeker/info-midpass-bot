const MILLISECONDS_PER_SECOND = 1_000;

export function unixTimeNow() {
  return Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
}

export function millisecondsToSeconds(value) {
  return Math.ceil(value / MILLISECONDS_PER_SECOND);
}

export function toUnixTime(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return value > 10_000_000_000
      ? Math.floor(value / MILLISECONDS_PER_SECOND)
      : Math.floor(value);
  }

  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(value);

  return Number.isFinite(milliseconds)
    ? Math.floor(milliseconds / MILLISECONDS_PER_SECOND)
    : null;
}

export function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(typeof value === 'number' ? value * MILLISECONDS_PER_SECOND : value);
}
