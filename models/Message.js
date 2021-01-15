const moment = require('moment');
let Model = require('./BaseModel');

/**
 * @class Message
 *
 * @property {Number} id
 * @property {Number} user_id
 * @property {Number} chat_id
 * @property {Number} type
 * @property {Number} status
 * @property {String} message
 * @property {String} ip
 * @property {String} created_at
 *
 * @inheritDoc Model
 */
class Message extends Model
{
    getTableName()
    {
        return 'chat_message';
    }

    async insert(data)
    {
        data.created_at = new moment().format('YYYY-MM-DD HH:mm:ss');

        let result = await super.insert(data);

        data.id = result.insertId;
        return data;
    }

    async setMessageType(messageId, type)
    {
        return await this.update({type: type}, {id: messageId});
    }

    async formatReceivedMessage(messageId)
    {
        let result = await this.qb
            .select([
                'm.*',
                'u.first_name',
                'u.last_name',
            ], false)
            .join('user u', 'u.id = m.user_id')
            .where({'m.id': messageId})
            .limit(1)
            .get('chat_message m');

        if (!result) {
            return false;
        }

        if (result[0].data) {
            result[0].data = JSON.parse(result[0].data);
        }

        return result[0];
    }

    async getLastMessageByChatId(chatId)
    {
        let result = await this.qb
            .select([
                'm.*',
            ], false)
            .join('chat c', 'c.id = m.chat_id')
            .where({'c.id': chatId})
            .order_by('m.id', 'desc')
            .limit(1)
            .get('chat_message m');

        if (!result.length) {
            return null;
        }

        return result[0];
    }

    async getUnreadMessagesByChatIdAndUserId(chatId, userId)
    {
        let result = await this.qb
            .select([
                'count(m.id) as count',
            ], false)
            .join('chat c', 'c.id = m.chat_id')
            .where({
                'c.id': chatId,
                'm.user_id <>': userId,
                'm.status <>': Message.STATUS.SEEN,
            })
            .get('chat_message m');


        if (!result) {
            return false;
        }

        return result[0];
    }

}

Message.I = new Message();

Message.STATUS = {
    SEND: 0,
    CREATED: 1,
    SEEN: 2,
};

Message.TYPE = {
    TEXT: 1,
    DELETED: 10,
};

module.exports = Message;