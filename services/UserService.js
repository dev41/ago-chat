let userModel = new (require('../models/User'))();

class UserService
{
    static async emitUpdateUserState(userId, io, socketId)
    {
        let userState = {
            unread_message_count: await userModel.getUnreadMessages(userId),
        };

        io.to(socketId).emit('getUserStateResponse', userState);
    };
}

module.exports = UserService;