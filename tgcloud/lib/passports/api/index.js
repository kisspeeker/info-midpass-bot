import {
  LEGACY_TYPE_UID_MAX_LENGTH,
  PASSPORT_TYPE,
} from '../../core/constants.js';
import { getPassport } from './http.js';

const BIOMETRIC_UID_PATTERN = /^\d{25}$/;
const LEGACY_UID_PATTERN = /^\d+$/;

export async function fetchPassport(input) {
  const {
    type,
    uid,
    allowPending = false,
  } = input;

  if (!Object.values(PASSPORT_TYPE).includes(type)) {
    throw new Error('Unknown passport type');
  }

  if (
    type === PASSPORT_TYPE.BIOMETRIC
    && !BIOMETRIC_UID_PATTERN.test(uid)
  ) {
    throw new Error('Invalid biometric passport UID');
  }

  if (
    type === PASSPORT_TYPE.LEGACY_TYPE
    && (!LEGACY_UID_PATTERN.test(uid) || uid.length > LEGACY_TYPE_UID_MAX_LENGTH)
  ) {
    throw new Error('Invalid legacy type passport UID');
  }

  return getPassport({ type, uid, allowPending });
}
