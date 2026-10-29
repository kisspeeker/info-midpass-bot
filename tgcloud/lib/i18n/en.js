export default {
  bot: {
    shortDescription: 'Tracking Russian passport applications since 2022',
    description: [
      'I track applications for legacy and biometric Russian passports',
      '',
      'I automatically notify you when the status changes and let you check it manually',
      '',
      'For a biometric passport, send the 25-digit application number or its QR-code link. For a legacy passport, send the application number',
      '',
      'Sources: info.midpass.ru and passportzu.kdmid.ru',
      '',
      'This bot is not an official service of the Russian Ministry of Foreign Affairs',
    ].join('\n'),
  },
  commands: {
    admin: 'Bot statistics',
    start: 'Start bot',
    menu: 'Open menu',
    support: 'Ask a question',
    delete: 'Delete my data',
  },
  admin: {
    stats: ({ users, orders, subscriptions }) => [
      'Database status',
      `Users: ${users}`,
      `Applications: ${orders}`,
      `Subscriptions: ${subscriptions}`,
    ].join('\n'),
  },
  account: {
    deletePrompt: 'Delete your subscriptions and user data? This action cannot be undone.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
    deleted: 'Your subscriptions and user data have been deleted',
  },
  menu: {
    title: 'Choose an action:',
    subscriptions: 'My subscriptions',
    statuses: 'About statuses',
    faq: 'FAQ',
    language: 'Language',
    back: 'Back',
    main: 'Menu',
  },
  language: {
    title: 'Choose a language:',
  },
  passport: {
    legacyType: 'Legacy type (5 years)',
    biometric: 'Biometric',
    legacyTypePrompt: 'Enter the application number for a legacy type passport:',
    biometricPrompt: 'Enter the application number or QR code link:',
    legacyInput: '1234567890',
    biometricInput: '2000123456789012345678901 or https://info.midpass.ru/?id=2000123456789012345678901',
    added: 'Application added to tracking',
    fetchFailed: 'Could not retrieve the status. Check the application number',
    applicationNotFound: 'Application not found',
    refreshed: 'Status refreshed manually',
    recent: 'Status is already up to date',
    refreshFailed: 'Could not refresh the status. Try again later',
    changed: 'The application status has changed',
    applicationTitle: '<b>Application</b>',
    applicationLine: (uid) => `<code>${uid}</code>`,
    updatedLine: (date) => `<b>Checked:</b> ${date}`,
    statusLine: (status) => status,
    summary: ({ percent, status }) => `<b>${percent}% · ${status}</b>`,
    pendingTitle: '<b>Status pending</b>',
    pending: 'not available yet; the application will be checked later',
    receptionDate: (date) => `<b>Submission date:</b> ${date}`,
  },
  subscriptions: {
    empty: 'You have no active subscriptions',
    choose: 'Choose an application:',
    refresh: 'Refresh',
    unsubscribe: 'Unsubscribe',
    unsubscribePrompt: (shortUid) => `Delete the subscription to application *${shortUid}?`,
    unsubscribeConfirm: 'Delete',
    unsubscribeCancel: 'Cancel',
    removed: 'Subscription removed',
    alreadyTracked: 'This application is already being tracked',
    limit: (count) => `You can track up to ${count} applications`,
    notFound: 'Subscription not found',
  },
  support: {
    prompt: 'Send a message:',
    retry: (seconds) => `You can contact support again in ${seconds} sec`,
    sent: 'Message sent to support',
    unavailable: 'Support is temporarily unavailable',
    adminMessage: 'New support request',
    answer: 'Reply',
    actionUnavailable: 'Action unavailable',
    replyPrompt: (userId) => `Reply to user ${userId}:`,
    replyPlaceholder: 'Reply to user',
    replySent: 'Reply sent to the user',
    replyFailed: 'Could not send the reply to the user',
  },
  polling: {
    summary: ({ checked, changed, notified, failed }) => [
      'Check completed',
      `Checked: ${checked}`,
      `Changed: ${changed}`,
      `Notified: ${notified}`,
      `Errors: ${failed}`,
    ].join('\n'),
  },
  faq: {
    usage: [
      'The bot checks passport application statuses and notifies you about changes',
      '',
      '1. Choose the passport type',
      '2. Reply to the bot with the application number',
      '3. Manage tracking under “My subscriptions”',
      '💬 Ask a question: /support',
      '',
      'Stored user data:',
      '• public user_id',
      '• application subscriptions',
      '• selected language',
      '',
      linksLine(),
      '',
      donationLine(),
    ].join('\n'),
    statuses: [
      'The biometric passport percentage represents a processing stage:',
      '',
      '0% — initial or final status; refer to the status text',
      '5–30% — application intake and checks',
      '60–70% — approval and personalization',
      '80–90% — delivery to the consulate',
      '100% — passport is ready for collection',
    ].join('\n'),
  },
  donations: {
    text: donationLine(),
  },
  crypto: {
    open: 'Support with crypto',
    text: cryptoText,
    copy: (symbol) => `Copy ${symbol}`,
  },
};

function linksLine() {
  return [
    '🔗 <b>Links:</b>',
    '<a href="https://github.com/kisspeeker/info-midpass-bot">GitHub</a>',
    '//',
    '<a href="https://t.me/kisspeeker">Telegram</a>',
  ].join(' ');
}

function donationLine() {
  return [
    '💳 <b>Support:</b>',
    '<a href="https://ko-fi.com/kisspeeker">Ko-fi</a>',
    '//',
    '<a href="https://donationalerts.com/r/kisspeeker">DonationAlerts</a>',
  ].join(' ');
}

function cryptoText(wallets) {
  return [
    '<b>Crypto</b>',
    '',
    ...Object.entries(wallets).flatMap(([symbol, wallet]) => [
      `${symbol} · ${wallet.network}`,
      `<code>${wallet.address}</code>`,
      '',
    ]),
  ].slice(0, -1).join('\n');
}
