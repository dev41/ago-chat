
class SocketChatEvents
{
}

SocketChatEvents.EMITTER = {
    USER_CONNECT: 'userConnect',
    USER_DISCONNECT: 'userDisconnect',
    USER_ONLINE: 'userOnline',
    USER_OFFLINE: 'userOffline',
    RECEIVED_MESSAGE: 'receivedMessage',
    ADDED_TO_CHAT: 'addedToChat',
    CHAT_CLOSED: 'chatClosed',
    CHAT_LIST_RESPONSE: 'chatListResponse',
    GET_CHAT_MESSAGES_RESPONSE: 'getChatMessagesResponse',
    CHAT_TITLE_CHANGED: 'chatTitleChanged',
};

SocketChatEvents.SUBSCRIBER = {
    GET_CHAT_LIST: 'getChatList',
    CLOSE_CHAT: 'closeChat',
    GET_CHAT_MESSAGES: 'getChatMessages',
    SET_CHAT_TITLE: 'setChatTitle',
};

module.exports = SocketChatEvents;