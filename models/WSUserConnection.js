const moment = require('moment');
let Model = require('./BaseModel');

let User = require('./User');
let userModel = new User();

/**
 * Class WSUserConnection
 *
 * @property {Number} user_id
 * @property {String} socket_id
 * @property {String} created_at
 */
class WSUserConnection extends Model
{
    getTableName()
    {
        return 'ws_user_connection';
    }

    async getUserBySocketId(socketId)
    {
        let result = await this.qb
            .select(['u.*'], false)
            .from('user u')
            .join('ws_user_connection wsuc', 'wsuc.user_id = u.id', 'inner')
            .where({'wsuc.socket_id': socketId})
            .limit(1)
            .get();

        if (result.length === 0) {
            return false;
        }

        return result[0];
    }

    async addUserSocketId(userId, socketId)
    {
        let insertResult = await this.insert({
            user_id: userId,
            socket_id: socketId,
            created_at: new moment().format('YYYY-MM-DD HH:mm:ss'),
        });

        await userModel.update({
            online: User.ONLINE.YES
        }, {
            id: userId
        });

        return insertResult;
    }

    async getUserConnections(userId)
    {
        return await this.qb
            .select(['uc.*'], false)
            .from(this.getTableName() + ' uc')
            .where({'user_id': userId})
            .get();
    }

    async getChatConnections(chatId, exceptUserIds, exceptSocketIds)
    {
        let query = this.qb
            .select(['wsuc.socket_id as socket_id', 'GROUP_CONCAT(wsuc.user_id) as user_id'], false)
            .from(this.getTableName() + ' wsuc')
            .join('user u', 'u.id = wsuc.user_id')
            .join('user_chat uc', 'uc.user_id = u.id')
            .where({
                'uc.chat_id': chatId,
            })
            .group_by('wsuc.socket_id')
        ;

        if (exceptUserIds) {
            query.where_not_in('uc.user_id', exceptUserIds);
        }
        if (exceptSocketIds) {
            query.where_not_in('wsuc.socket_id', exceptSocketIds);
        }

        return await query.get();
    }

    /**
     * @param {Number} userId
     * @param {Number} socketId
     * @returns {Boolean} true - if the user is logged out from all connections, false - if the user is still online
     */
    async userLogout(userId, socketId)
    {
        this.delete({
            'socket_id': socketId,
        });

        let userConnections = await this.getUserConnections(userId);

        if (userConnections.length === 0) {
            await userModel.update({
                online: User.ONLINE.NO
            }, {
                id: userId
            });

            return true;
        }

        return false;
    }
}

module.exports = WSUserConnection;