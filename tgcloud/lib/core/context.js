import { telegram as defaultTelegram } from './telegram.js';
import { createI18n } from '../i18n/index.js';

export function createContextFactory(telegram) {
  return {
    createMessage(message) {
      return createUpdateContext({
        sourceMessage: message,
        from: message?.from,
        text: message?.text,
        replyToText: message?.reply_to_message?.text,
      }, telegram);
    },

    createCallback(callbackQuery) {
      return createUpdateContext({
        sourceMessage: callbackQuery?.message,
        from: callbackQuery?.from,
        text: callbackQuery?.data,
        callbackQuery,
      }, telegram);
    },

    createChat(chatId, i18n) {
      return buildChatContext({ chatId, i18n, telegram });
    },
  };
}

const defaultContexts = createContextFactory(defaultTelegram);

export const createMessageContext = defaultContexts.createMessage;
export const createCallbackContext = defaultContexts.createCallback;
export const createChatContext = defaultContexts.createChat;

function createUpdateContext(input, telegram) {
  const {
    sourceMessage,
    from,
    text,
    replyToText = '',
    callbackQuery = null,
  } = input;

  let answered = false;

  if (
    !sourceMessage?.chat
    || !Number.isSafeInteger(sourceMessage.chat.id)
    || !Number.isSafeInteger(from?.id)
    || from.id <= 0
  ) {
    return null;
  }

  const ctx = {
    ...buildChatContext({
      chatId: sourceMessage.chat.id,
      i18n: createI18n(from.language_code),
      telegram,
    }),
    from,
    isPrivate: sourceMessage.chat.type === 'private',
    isCallback: Boolean(callbackQuery),
    messageText: String(sourceMessage.text ?? sourceMessage.caption ?? ''),
    messageId: sourceMessage.message_id,
    replyToText,
    text: String(text ?? '').trim(),
    answer(text, extra = {}) {
      if (!callbackQuery || answered) {
        return;
      }

      answered = true;

      return telegram.answerCallback({
        callback_query_id: callbackQuery.id,
        ...(text ? { text } : {}),
        ...extra,
      });
    },

    notify(text) {
      return ctx.answer(text);
    },

    alert(text) {
      return ctx.answer(text, { show_alert: true });
    },

    edit(text, extra = {}) {
      return telegram.editMessage({
        chat_id: ctx.chatId,
        message_id: ctx.messageId,
        text,
        ...extra,
      });
    },
  };

  return ctx;
}

function buildChatContext(input) {
  const { chatId, i18n, telegram } = input;

  return {
    chatId,
    i18n,

    reply(text, extra = {}) {
      return telegram.sendMessage({
        chat_id: chatId,
        text,
        reply_markup: { remove_keyboard: true },
        ...extra,
      });
    },
  };
}
