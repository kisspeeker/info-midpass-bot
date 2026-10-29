import { CALLBACK_DATA_MAX_LENGTH } from './constants.js';

const CALLBACK_DATA_PATTERN = /^[\x20-\x7E]+$/;

export function createCallbackData(action, value) {
  const data = `${action}:${value}`;

  if (!isValidCallbackData(data)) {
    throw new Error('Invalid callback data');
  }

  return data;
}

export function parseCallbackData(data) {
  const value = String(data ?? '');
  const separator = value.indexOf(':');

  if (separator < 1 || !isValidCallbackData(value)) {
    return null;
  }

  return {
    action: value.slice(0, separator),
    value: value.slice(separator + 1),
  };
}

function isValidCallbackData(value) {
  return value.length <= CALLBACK_DATA_MAX_LENGTH && CALLBACK_DATA_PATTERN.test(value);
}
