import { BIOMETRIC_FINAL_STATUS_FRAGMENTS, LEGACY_TYPE_READY_STATUS_FRAGMENT, PASSPORT_TYPE } from '../../constants.js';
import { includesStatus } from '../../helpers/text.js';

const BIOMETRIC_STATUS_FIELDS = [
  'sourceUid',
  'receptionDate',
  'passportStatusId',
  'passportStatusName',
  'passportStatusDescription',
  'passportStatusColor',
  'passportStatusSubscription',
  'internalStatusName',
  'internalStatusPercent',
];

export function hasPassportChanged(order, next) {
  const fields = order.type === PASSPORT_TYPE.LEGACY_TYPE ? ['statusText'] : BIOMETRIC_STATUS_FIELDS;

  return fields.some((field) => Object.hasOwn(next, field) && order[field] !== next[field]);
}

export function isFinalPassportStatus(order) {
  if (order.type === PASSPORT_TYPE.LEGACY_TYPE) {
    return includesStatus(order.statusText, LEGACY_TYPE_READY_STATUS_FRAGMENT);
  }

  if (order.type !== PASSPORT_TYPE.BIOMETRIC || order.internalStatusPercent !== 0) {
    return false;
  }

  return BIOMETRIC_FINAL_STATUS_FRAGMENTS.some((fragment) => (
    includesStatus(order.internalStatusName, fragment)
  ));
}
