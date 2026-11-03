import { LEGACY_TYPE_UID_MAX_LENGTH, PASSPORT_TYPE } from '../../constants.js';

const BIOMETRIC_UID_IN_TEXT_PATTERN = /\b\d{25}\b/;
const UID_PATTERNS = {
  [PASSPORT_TYPE.BIOMETRIC]: /^\d{25}$/,
  [PASSPORT_TYPE.LEGACY_TYPE]: new RegExp(`^\\d{1,${LEGACY_TYPE_UID_MAX_LENGTH}}$`),
};

export function isPassportUid(uid, type) {
  return typeof uid === 'string' && Object.hasOwn(UID_PATTERNS, type) && UID_PATTERNS[type].test(uid);
}

export function passportUidFromText(text, type) {
  const value = String(text ?? '').trim();

  if (type !== PASSPORT_TYPE.BIOMETRIC) {
    return value;
  }

  return BIOMETRIC_UID_IN_TEXT_PATTERN.exec(value)?.[0] ?? value;
}
