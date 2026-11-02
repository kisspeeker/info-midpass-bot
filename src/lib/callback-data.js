import { CALLBACK_ACTION, CALLBACK_DATA_MAX_LENGTH } from '../config.js';

export function callbackPattern(action) {
  if (!Object.values(CALLBACK_ACTION).includes(action)) {
    throw new Error('Unknown callback action');
  }

  return new RegExp(`^${RegExp.escape(action)}:([\\x20-\\x7E]{1,${CALLBACK_DATA_MAX_LENGTH - action.length - 1}})$`);
}

export function createCallbackData(action, value) {
  const data = `${action}:${value}`;

  if (!callbackPattern(action).test(data)) {
    throw new Error('Invalid callback data');
  }

  return data;
}
