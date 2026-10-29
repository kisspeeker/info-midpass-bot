import { api } from 'sdk';

export const telegram = {
  answerCallback(payload) {
    return api.answerCallbackQuery(payload);
  },

  deleteChatCommands(chatId) {
    return api.deleteMyCommands({
      scope: { type: 'chat', chat_id: chatId },
    });
  },

  setCommands(payload) {
    return api.setMyCommands(payload);
  },

  setDescription(payload) {
    return api.setMyDescription(payload);
  },

  setShortDescription(payload) {
    return api.setMyShortDescription(payload);
  },

  editMessage(payload) {
    return api.editMessageText(withoutLinkPreview(payload));
  },

  copyMessage(payload) {
    return api.copyMessage(payload);
  },

  forwardMessage(payload) {
    return api.forwardMessage(payload);
  },

  sendMessage(payload) {
    return api.sendMessage(withoutLinkPreview(payload));
  },
};

function withoutLinkPreview(payload) {
  return {
    link_preview_options: { is_disabled: true },
    ...payload,
  };
}
