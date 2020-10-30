'use strict';

let wsUserConnection = new (require('../models/WSUserConnection'))();
let userModel = new (require('../models/User'))();
let SocketChatEvents = require('../utils/SocketChatEvents');

class ConnectionService
{

    static async resetConnections()
    {
        await wsUserConnection.deleteAll();
    }

    static async userConnect(userId, socket, io)
    {
        console.log('Connect user:', userId);

        const response = await wsUserConnection.addUserSocketId(userId, socket.id);

        if (response) {
            console.log(`User ${userId}:${socket.id} was connected.`);

            let interlocutors = await userModel.getOnlineInterlocutors(userId);

            interlocutors.forEach(function (interlocutor) {
                io.to(interlocutor.socket_id).emit(SocketChatEvents.USER_ONLINE, {id: userId});
            });
        } else {
            console.error(`Socket connection failed, for user Id ${userId}.`);
        }
    }

    static async userDisconnect(socket, io)
    {
        let user = await wsUserConnection.getUserBySocketId(socket.id);

        if (!user) {
            console.log(`User with socket id: ${socket.id} was disconnected.`);
            return;
        } else {
            console.log(`User ${user.id}:${socket.id} was disconnected.`);
        }

        let isUserTrueLogout = await wsUserConnection.userLogout(user.id, socket.id);

        if (isUserTrueLogout) {
            let interlocutors = await userModel.getOnlineInterlocutors(user.id);

            interlocutors.forEach(function (interlocutor) {
                io.to(interlocutor.socket_id).emit(SocketChatEvents.USER_OFFLINE, {id: user.id});
            });
        }
    }

}

module.exports = ConnectionService;