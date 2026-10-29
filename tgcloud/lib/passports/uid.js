import { PASSPORT_TYPE } from '../core/constants.js';

const BIOMETRIC_UID_IN_TEXT_PATTERN = /\b2000\d{21}\b/;

export function passportUidFromText(text, type) {
  const value = String(text ?? '').trim();

  if (type !== PASSPORT_TYPE.BIOMETRIC) {
    return value;
  }

  return BIOMETRIC_UID_IN_TEXT_PATTERN.exec(value)?.[0] ?? value;
}
