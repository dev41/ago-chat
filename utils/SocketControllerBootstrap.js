'use strict';

const controllers = [
    require('../controllers/ConnectionController'),
    require('../controllers/ChatController'),
    require('../controllers/MessageController'),
];

class SocketControllerBootstrap
{
    static bootstrap(io, socket)
    {
        controllers.forEach(function (c) {
            let actions = SocketControllerBootstrap._getActions(c);

            // each action run as socket event that can call action's function
            actions.forEach(function (a) {
                socket.on(a, async (data) => {
                    c[a](socket, data, io);
                });
            });
        });
    }

    /**
     * get all controller Public methods as actions
     * @param controller
     * @returns {string[]}
     * @private
     */
    static _getActions(controller)
    {
        return  Object.getOwnPropertyNames(controller)
            .filter(prop => ((controller[prop] instanceof Function) && prop[0] !== '_'));
    }
}


module.exports = SocketControllerBootstrap;

