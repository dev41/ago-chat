'use strict';

let ChatService = require('../services/ChatService');
let MessageService = require('../services/MessageService');

class ChatController
{
    // when open chat page
    static async getChatList(socket, data, io) {
        let chatAndUsers = await ChatService.getListOfUsersAndChatsByUserId(data.userId);

        socket.emit('chatListResponse', chatAndUsers);
    }

    static async getChatMessages(socket, data, io) {
        let chatId = data.chatId,
            userId = data.userId;

        let messages = await ChatService.readChatMessages(chatId, userId, socket.id, io);

        socket.emit('getChatMessagesResponse', {
            messages: messages,
        });

        // await UserService.emitUpdateUserState(userId, io, socket.id);
    }

    static async sendMessage(socket, data, io) {
        data.ip = socket.request.connection.remoteAddress;
        await MessageService.sendMessage(io, data, [socket.id]);
    }

    static async createNewChat(socket, data, io) {
        let chatId = data.chatId,
            ownerId = data.ownerId;

        await ChatService.sendAddedToChatInfo(chatId, ownerId, io);
    }

}

module.exports = ChatController;