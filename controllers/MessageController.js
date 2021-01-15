'use strict';

let MessageService = require('../services/MessageService');

class MessageController
{

    static async deleteMessage(socket, data, io) {
        let chatId = data.chatId,
            messageId = data.messageId;

        await MessageService.deleteMessage(chatId, messageId, io);
    }

}

module.exports = MessageController;
