import {
  PASSPORT_UPSTREAMS,
  PASSPORT_TYPE,
  STATUS_TEXT_MAX_LENGTH,
  shutdown,
} from '../config.js';
import { requestJson, PassportServiceError } from './client.js';
import { isPassportUid } from '../lib/passport-uid.js';
import { includesStatus } from '../lib/text.js';

const LEGACY_NOT_FOUND = 'заявление с таким номером не было сохранено';

export async function fetchPassport(input) {
  const { type, uid, allowPending = false } = input;

  if (!Object.hasOwn(PASSPORT_UPSTREAMS, type)) {
    throw new PassportServiceError({ code: 'invalid_passport_type', status: 400 });
  }

  if (!isPassportUid(uid, type)) {
    throw new PassportServiceError({ code: 'invalid_passport_uid', status: 400 });
  }

  const config = PASSPORT_UPSTREAMS[type];
  const legacy = type === PASSPORT_TYPE.LEGACY_TYPE;
  const data = await requestJson({
    origin: config.baseUrl,
    path: legacy ? config.path : `${config.path}/${uid}`,
    searchParams: legacy ? { folderId: uid } : undefined,
    referer: config.referer,
    signal: shutdown.signal,
  });

  return legacy ? parseLegacyPassport(data) : parseBiometricPassport(data, allowPending);
}

function parseLegacyPassport(data) {
  const statusText = readText(data?.StatusText);

  if (!statusText || includesStatus(statusText, LEGACY_NOT_FOUND)) {
    throw new PassportServiceError({ code: 'passport_not_found', status: 404 });
  }

  return { statusText };
}

function parseBiometricPassport(data, allowPending) {
  if (Array.isArray(data) && data.length === 0) {
    if (allowPending) {
      return {};
    }

    throw new PassportServiceError({ code: 'passport_not_found', status: 404 });
  }

  return normalizeBiometricPassport(Array.isArray(data) ? data[0] : data);
}

function normalizeBiometricPassport(value) {
  const passportStatusName = readText(value?.passportStatus?.name);
  const internalStatusName = readText(value?.internalStatus?.name);
  const internalStatusPercent = value?.internalStatus?.percent;

  if (!passportStatusName || !internalStatusName
    || !Number.isInteger(internalStatusPercent)
    || internalStatusPercent < 0
    || internalStatusPercent > 100) {
    throw new PassportServiceError({ code: 'invalid_upstream_response', status: 502 });
  }

  return {
    sourceUid: readText(value?.sourceUid),
    receptionDate: readText(value?.receptionDate),
    passportStatusId: Number.isInteger(value?.passportStatus?.id)
      ? value.passportStatus.id
      : null,
    passportStatusName,
    passportStatusDescription: readText(value?.passportStatus?.description),
    passportStatusColor: readText(value?.passportStatus?.color),
    passportStatusSubscription: typeof value?.passportStatus?.subscription === 'boolean'
      ? value.passportStatus.subscription
      : null,
    internalStatusName,
    internalStatusPercent,
  };
}


function readText(value) {
  return typeof value === 'string'
    ? value.trim().slice(0, STATUS_TEXT_MAX_LENGTH) || null
    : null;
}
