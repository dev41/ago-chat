'use strict';

let ConnectionService = require('../services/ConnectionService');

class ConnectionController
{
    // when user login
    static userConnect(socket, data, io)
    {
        ConnectionService.userConnect(data.userId, socket, io);
    }

    // when user logout
    static userDisconnect(socket, data, io)
    {
        ConnectionService.userDisconnect(socket, io);
    }

    // default socket event
    static disconnect(socket, data, io)
    {
        ConnectionService.userDisconnect(socket, io);
    }
}

module.exports = ConnectionController;