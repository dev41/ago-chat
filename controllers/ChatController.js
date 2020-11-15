'use strict';

let ChatService = require('../services/ChatService');
let MessageService = require('../services/MessageService');
let SocketChatEvents = require('../utils/SocketChatEvents');

class ChatController
{
    // when open chat page
    static async getChatList(socket, data, io) {
        let chatAndUsers = await ChatService.getListOfUsersAndChatsByUserId(data.userId);

        socket.emit(SocketChatEvents.EMITTER.CHAT_LIST_RESPONSE, chatAndUsers);
    }

    static async getChatMessages(socket, data, io) {
        let chatId = data.chatId,
            userId = data.userId;

        let messages = await ChatService.readChatMessages(chatId, userId, socket.id, io);

        socket.emit(SocketChatEvents.EMITTER.GET_CHAT_MESSAGES_RESPONSE, {
            messages: messages,
        });

        // await UserService.emitUpdateUserState(userId, io, socket.id);
    }

    static async closeChat(socket, data, io) {
        let chatId = data.id;

        await ChatService.closeChat(chatId, io);
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

    static async setChatTitle(socket, data, io) {
        let chatId = data.chatId,
            title = data.title;

        await ChatService.setChatTitle(chatId, title, io, socket);
    }

}

module.exports = ChatController;