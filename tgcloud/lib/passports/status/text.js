export function includesStatus(value, fragment) {
  return normalizeStatus(value).includes(normalizeStatus(fragment));
}

function normalizeStatus(value) {
  return String(value ?? '').trim().toLocaleLowerCase('ru-RU');
}
