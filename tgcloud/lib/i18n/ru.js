export default {
  commands: {
    admin: 'Статистика',
    start: 'Начать работу',
    menu: 'Открыть меню',
    support: 'Задать вопрос',
    delete: 'Удалить мои данные',
  },
  admin: {
    stats: ({ users, orders, subscriptions }) => [
      'Состояние базы',
      `Пользователей: ${users}`,
      `Заявлений: ${orders}`,
      `Подписок: ${subscriptions}`,
    ].join('\n'),
  },
  account: {
    deletePrompt: 'Удалить ваши подписки и данные пользователя? Это действие нельзя отменить.',
    deleteConfirm: 'Удалить',
    deleteCancel: 'Отмена',
    deleted: 'Ваши подписки и данные удалены',
  },
  menu: {
    title: 'Выберите действие:',
    subscriptions: 'Мои подписки',
    statuses: 'О статусах',
    faq: 'FAQ',
    language: 'Язык',
    back: 'Назад',
    main: 'Меню',
  },
  language: {
    title: 'Выберите язык:',
  },
  passport: {
    legacyType: 'Старого образца (5-летний)',
    biometric: 'Биометрический',
    legacyTypePrompt: 'Введите номер заявления для паспорта старого образца:',
    biometricPrompt: 'Введите номер заявления или ссылку из QR-кода:',
    legacyInput: '1234567890',
    biometricInput: '2000123456789012345678901 или https://info.midpass.ru/?id=2000123456789012345678901',
    added: 'Заявление добавлено в отслеживание',
    fetchFailed: 'Не удалось получить статус. Проверьте номер заявления',
    applicationNotFound: 'Заявление не найдено',
    refreshed: 'Статус обновлён вручную',
    recent: 'Статус уже актуален',
    refreshFailed: 'Не удалось обновить статус. Попробуйте позже',
    changed: 'Статус заявления изменился',
    applicationTitle: '<b>Заявление</b>',
    applicationLine: (uid) => `<code>${uid}</code>`,
    updatedLine: (date) => `<b>Проверено:</b> ${date}`,
    statusLine: (status) => status,
    summary: ({ percent, status }) => `<b>${percent}% · ${status}</b>`,
    pendingTitle: '<b>Статус ожидается</b>',
    pending: 'пока недоступен; заявление будет проверено позже',
    receptionDate: (date) => `<b>Дата подачи:</b> ${date}`,
  },
  subscriptions: {
    empty: 'У вас нет активных подписок',
    choose: 'Выберите заявление:',
    refresh: 'Обновить',
    unsubscribe: 'Отписаться',
    unsubscribePrompt: (shortUid) => `Удалить подписку на заявление *${shortUid}?`,
    unsubscribeConfirm: 'Удалить',
    unsubscribeCancel: 'Отмена',
    removed: 'Подписка удалена',
    alreadyTracked: 'Заявление уже отслеживается',
    limit: (count) => `Можно отслеживать не более ${count} заявлений`,
    notFound: 'Подписка не найдена',
  },
  support: {
    prompt: 'Отправьте сообщение:',
    retry: (seconds) => `Следующее обращение можно отправить через ${seconds} сек`,
    sent: 'Сообщение отправлено в поддержку',
    unavailable: 'Поддержка временно недоступна',
    adminMessage: 'Новое обращение',
    answer: 'Ответить',
    actionUnavailable: 'Действие недоступно',
    replyPrompt: (userId) => `Ответ пользователю ${userId}:`,
    replyPlaceholder: 'Ответ пользователю',
    replySent: 'Ответ отправлен пользователю',
    replyFailed: 'Не удалось отправить ответ пользователю',
  },
  polling: {
    summary: ({ checked, changed, notified, failed }) => [
      'Проверка завершена',
      `Проверено: ${checked}`,
      `Изменено: ${changed}`,
      `Уведомлено: ${notified}`,
      `Ошибок: ${failed}`,
    ].join('\n'),
  },
  faq: {
    usage: [
      'Бот проверяет статус заявления на загранпаспорт и уведомляет об изменениях',
      '',
      '1. Выберите тип паспорта',
      '2. Отправьте номер заявления ответом на сообщение бота',
      '3. Управляйте отслеживанием через «Мои подписки»',
      '💬 Задать вопрос: /support',
      '',
      'Хранение данных пользователя:',
      '• публичный user_id',
      '• список подписок на заявления',
      '• выбранный язык',
      '',
      linksLine(),
      '',
      donationLine(),
    ].join('\n'),
    statuses: [
      'Процент для биометрического паспорта — технический этап обработки:',
      '',
      '0% — начальный или финальный статус; ориентируйтесь на текст',
      '5–30% — приём и проверки заявления',
      '60–70% — согласование и персонализация',
      '80–90% — доставка паспорта в консульство',
      '100% — паспорт готов к выдаче',
    ].join('\n'),
  },
  donations: {
    text: donationLine(),
  },
  crypto: {
    open: 'Поддержать криптовалютой',
    text: cryptoText,
    copy: (symbol) => `Скопировать ${symbol}`,
  },
};

function linksLine() {
  return [
    '🔗 <b>Ссылки:</b>',
    '<a href="https://github.com/kisspeeker/info-midpass-bot">GitHub</a>',
    '//',
    '<a href="https://t.me/kisspeeker">Telegram</a>',
  ].join(' ');
}

function donationLine() {
  return [
    '💳 <b>Поддержать:</b>',
    '<a href="https://ko-fi.com/kisspeeker">Ko-fi</a>',
    '//',
    '<a href="https://donationalerts.com/r/kisspeeker">DonationAlerts</a>',
  ].join(' ');
}

function cryptoText(wallets) {
  return [
    '<b>Криптовалюта</b>',
    '',
    ...Object.entries(wallets).flatMap(([symbol, wallet]) => [
      `${symbol} · ${wallet.network}`,
      `<code>${wallet.address}</code>`,
      '',
    ]),
  ].slice(0, -1).join('\n');
}
