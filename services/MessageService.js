let wsUserConnection = new (require('../models/WSUserConnection'))();
let Message = require('../models/Message');

let UserService = require('./UserService');

class MessageService
{
    static async changeMessageType(chatId, messageId, type, io)
    {
      let connections = await wsUserConnection.getChatConnections(chatId, null, null);

      await Message.I.setMessageType(messageId, type);

      connections.forEach(function (connection) {
        io.to(connection.socket_id).emit('changeMessageStatus', {
          type: type,
          messageId: messageId,
        });
        UserService.emitUpdateUserState(connection.user_id, io, connection.socket_id);
      });
    }

    static async deleteMessage(chatId, messageId, io) {
        await MessageService.changeMessageType(chatId, messageId, Message.TYPE.DELETED, io);
    }

    static async sendMessage(io, data, expectSocketId)
    {
        if (!data) {
            return;
        }

        let message = Object.assign({}, data);
        let connections = await wsUserConnection.getChatConnections(message.chat_id, null, expectSocketId);

        if (message.data && message.data instanceof Object) {
            message.data = JSON.stringify(message.data);
        }

        if (!message.created_at) {
            message.created_at = new Date();
        }

        let newMessage = await Message.I.insert(message);

        let formatMessageData = await Message.I.formatReceivedMessage(newMessage.id);

        connections.forEach(function (connection) {
            io.to(connection.socket_id).emit('receivedMessage', formatMessageData);
            UserService.emitUpdateUserState(connection.user_id, io, connection.socket_id);
        });
    }
}

module.exports = MessageService;