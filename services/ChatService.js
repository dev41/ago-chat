let userModel = new (require('../models/User'))();
let chatModel = new (require('../models/Chat'))();
let wsUserModel = new (require('../models/WSUserConnection'))();
let messageModel = new (require('../models/Message'))();
let SocketChatEvents = require('../utils/SocketChatEvents');
// let BaseModel = require('../models/BaseModel');

let UserService = require('./UserService');

class ChatService
{
    static async getListOfUsersAndChatsByUserId(userId, chats = null)
    {
        let chatIds = [];

        chats = chats || (await userModel.getChatsByUserId(userId));

        if (chats instanceof Object) {
            chats = Object.values(chats);
        }

        for (let key in chats) {
            chats[key].users = [];
            chats[key].typing = false;

            let unrMessages = await messageModel.getUnreadMessagesByChatIdAndUserId(chats[key].id, userId);
            chats[key].unread_messages = unrMessages ? unrMessages.count : 0;

            chats[key].last_message = await messageModel.getLastMessageByChatId(chats[key].id);
            chatIds.push(chats[key].id);
        }

        let chatUsers = await userModel.getUsersByChats(chatIds),
            chatUsersWithIdKeys = {};

        for (let key in chatUsers) {
            let chatId = chatUsers[key].chat_id;

            let chat = chats.find(function(c) {
                return c.id === chatId;
            });

            chat.users.push(chatUsers[key]);
            chatUsersWithIdKeys[chatUsers[key].user_id] = chatUsers[key];
        }

        for (let key in chats) {
            if (chats[key].users.length === 2) {
                if (Number(chats[key].users[0].user_id) === Number(userId)) {
                    chats[key].name = chats[key].users[1].first_name + ' ' + chats[key].users[1].last_name;
                    chats[key].user = chats[key].users[0];
                    chats[key].second_user = chats[key].users[1];
                } else {
                    chats[key].name = chats[key].users[0].first_name + ' ' + chats[key].users[0].last_name;
                    chats[key].user = chats[key].users[1];
                    chats[key].second_user = chats[key].users[0];
                }
            }
        }

        let availableParticipants = await userModel.getAvailableParticipants(userId);

        return {
            chats: chats,
            users: chatUsersWithIdKeys,
            availableParticipants: availableParticipants,
        }
    }

    static async setChatIsReadByUser(chatId, userId, socketId, io)
    {
        await chatModel.setChatIsReadByUser(chatId, userId);

        let connections = await wsUserModel.getChatConnections(chatId, null, [socketId]);
        await UserService.emitUpdateUserState(userId, io, socketId);

        if (connections.length > 0) {
            connections.forEach(function (connection) {
                UserService.emitUpdateUserState(connection.user_id, io, connection.socket_id);
                io.to(connection.socket_id).emit('chatIsRead', {chatId: chatId});
            });
        }
    }

    static async changeChatState(chatId, chatData, io)
    {
        let connections = await wsUserModel.getChatConnections(chatId, null, null);

        connections.forEach(function (connection) {
            io.to(connection.socket_id).emit('changeChatState', {
                chatId: chatId,
                data: chatData,
            });
        });
    }

    static async readChatMessages(chatId, userId, socketId, io)
    {
        let lastMessage = await messageModel.getLastMessageByChatId(chatId);

        if (lastMessage && lastMessage.user_id != userId) {
            await ChatService.setChatIsReadByUser(chatId, userId, socketId, io);
        }

        let messages = (await chatModel.getMessages(chatId)) || [];

        if (messages.length === 1 && messages[0].id === null) {
            return [];
        }

        messages.forEach(function (message) {
            if (message.data) {
                message.data = JSON.parse(message.data);
            }
        });

        return messages;
    }

    static async createNewChat(chatId, ownerId, io)
    {
        let connections = await wsUserModel.getChatConnections(chatId, [ownerId]);

        if (!connections.length) {
            return;
        }

        // try to get second user in chat - only for chats between 2 people
        let toUserId = connections[0].user_id;
        let chat = await userModel.getChatDataById(chatId);
        let chatAndUsers = await ChatService.getListOfUsersAndChatsByUserId(toUserId, chat);

        connections.forEach(function (connection) {
            io.to(connection.socket_id).emit('addedToChat', chatAndUsers);
            UserService.emitUpdateUserState(connection.user_id, io, connection.socket_id);
        });

    }

    static async closeChat(chatId, io)
    {
        let connections = await wsUserModel.getChatConnections(chatId);

        await chatModel.closeChat(chatId);

        if (!connections.length) {
            return;
        }

        connections.forEach(function (connection) {
            io.to(connection.socket_id).emit(SocketChatEvents.EMITTER.CHAT_CLOSED, {id: chatId});
        });
    }

    static async setChatTitle(chatId, title, io, socket)
    {
        let connections = await wsUserModel.getChatConnections(chatId, null, [socket.id]);

        await chatModel.setChatTitle(chatId, title);

        if (!connections.length) {
            return;
        }

        connections.forEach(function (connection) {
            io.to(connection.socket_id).emit(SocketChatEvents.EMITTER.CHAT_TITLE_CHANGED,
                {
                    id: chatId,
                    title,
                });
        });
    }

    static async sendAddedToChatInfo(chatId, fromUserId, io)
    {
        let connections = await wsUserModel.getChatConnections(chatId);

        if (!connections.length) {
            return;
        }

        let connectionsByUserId = {},
            chatAndUsers = {};
        let chat = await userModel.getChatDataById(chatId);

        for (let connection of connections) {
            if (!connectionsByUserId[connection.user_id]) {
                connectionsByUserId[connection.user_id] = [];
                // clone not the same object
                let chatData = chat.map((c) => Object.assign({}, c));
                chatAndUsers[connection.user_id] = await ChatService.getListOfUsersAndChatsByUserId(connection.user_id, chatData);
            }

            connectionsByUserId[connection.user_id].push(connection);
        }

        for (let toUserId in connectionsByUserId) {
            if (!connectionsByUserId.hasOwnProperty(toUserId)) {
                continue;
            }

            connectionsByUserId[toUserId].forEach(function (connection) {
                io.to(connection.socket_id).emit('addedToChat', chatAndUsers[toUserId]);
            });
        }
    }

}

module.exports = ChatService;