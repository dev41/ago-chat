let Model = require('./BaseModel');
let userModel = require('./User');

/**
 * @class Chat
 *
 * @property {Number} id
 * @property {String} name
 *
 * @inheritDoc Model
 */
class Chat extends Model
{
    getTableName()
    {
        return 'chat';
    }

    async getMessages(chatId) {
        return await this.qb.query(
            `SELECT m.*,
                   u.id as user_id,
                   u.first_name,
                   u.last_name
            FROM chat c
                     LEFT JOIN chat_message m ON m.chat_id = c.id
                     LEFT JOIN user u ON u.id = m.user_id
            WHERE c.id = ${chatId}
            ORDER BY m.created_at;
        `);
    }

    async setChatIsReadByUser(chatId, userId)
    {
        let notMyMessageIds = await this.qb.query(`
            SELECT m.id FROM chat_message m
            LEFT JOIN chat c ON m.chat_id = c.id
            LEFT JOIN user_chat uc ON c.id = uc.chat_id
            WHERE c.id = ${chatId} AND uc.user_id <> ${userId}
        `);

        if (!notMyMessageIds) {
            return false;
        }

        let ids = [];
        for (let key in notMyMessageIds) {
            ids.push(notMyMessageIds[key].id);
        }

        return await this.qb.update('chat_message', {status: 2}, {id: ids});
    }

    async getOnlineUsers(chatId, exceptUserIds)
    {
        let query = this.qb
            .select(['u.*'], false)
            .from('user u')
            .join('user_chat uc', 'uc.user_id = u.id')
            .where({
                'u.online': userModel.ONLINE.YES,
                'uc.chat_id': chatId,
            });

        if (exceptUserIds) {
            query.where_not_in('uc.user_id', exceptUserIds);
        }

        return await query.get();
    }

}

module.exports = Chat;