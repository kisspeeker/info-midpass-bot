import { getSettingDefinition } from '../settings-registry.js';
import { saveSetting } from '../../repository/settings.js';

export async function configureSettings(input) {
  const settings = input?.settings;

  if (!isValidSettingsInput(settings)) {
    throw new Error('Invalid settings');
  }

  const normalizedSettings = Object.entries(settings).map(([key, value]) => {
    const definition = getSettingDefinition(key);

    if (!definition) {
      throw new Error(`Unknown setting: ${key}`);
    }

    return [key, definition.normalize(value)];
  });

  for (const [key, value] of normalizedSettings) {
    await saveSetting(key, value);
  }

  return { ok: true, configured: normalizedSettings.map(([key]) => key) };
}

function isValidSettingsInput(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  if (Array.isArray(settings)) {
    return false;
  }

  return Object.keys(settings).length > 0;
}
