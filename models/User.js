let Model = require('./BaseModel');
let Message = require('./Message');

/**
 * @class User
 *
 * @property {Number} id
 * @property {Number} login_attempts
 * @property {String} email
 * @property {String} password
 * @property {String} first_name
 * @property {String} last_name
 * @property {Number} gender
 * @property {Number} age
 * @property {String} phone_number
 * @property {Number} last_account_type
 *
 * @inheritDoc Model
 */
class User extends Model
{

    getTableName() {
        return 'user';
    }

    async getChatsByUserId(userId) {
        return await this._getChatsData(function (select) {
            select
                .where({'uc.user_id': userId});
        });
    }

    async _getChatsData(onSelectBuild) {
        let select = this.qb
            .select([
                'c.*',
                '(SELECT COUNT(_uc_count.user_id) FROM user_chat _uc_count WHERE _uc_count.chat_id = c.id) AS `user_count`',
            ], false)
            .from('chat c')
            .join('user_chat uc', 'uc.chat_id = c.id')
            .having('user_count >', 1)
            .group_by('c.id');

        if (onSelectBuild instanceof Function) {
            onSelectBuild(select);
        }

        return await select.get();
    }

    async getChatDataById(chatId) {
        return await this._getChatsData(function (select) {
            select
                .where({'c.id': chatId})
                .limit(1);
        });
    }

    async getUsersByChats(chatIds) {
        if (!chatIds || chatIds.length === 0) {
            return [];
        }

        return await this.qb
            .select([
                'uc.user_id as user_id',
                'uc.chat_id as chat_id',
                'uc.user_role as user_role',
                'u.online as online',
                'u.first_name as first_name',
                'u.last_name as last_name',
                'u.email as email',
                'u.role as role',
                'u.phone as phoneNumber',
                `(SELECT _o.logo FROM organisation _o
                    INNER JOIN user_organisation _uo ON _uo.organisation_id = _o.id
                    WHERE _uo.user_id = u.id
                    LIMIT 1) as org_logo`,
                'v.logo as vol_logo',
                // `IF (u.role = 2,
                //     IF(org_logo, concat('${process.env.AWS_RESOURCE_BASE_PATH}/images/logo/organisation/', org_logo), null),
                //     IF(v.logo, concat('${process.env.AWS_RESOURCE_BASE_PATH}/images/logo/volunteer/', v.logo), null)) as avatar_url`,
            ], false)
            .from('user_chat uc')
            .join('user u', 'u.id = uc.user_id')
            .join('volunteer v', 'v.id = uc.user_id', 'left')
            // .join('searcher_profiles sp', 'sp.id = u.id', 'left')
            // .join('super_user_profile sup', 'sup.id = u.id', 'left')
            .where_in('uc.chat_id', chatIds)
            .get();

    }

    async getUnreadMessages(userId) {
        let result = await this.qb
            .select(['COUNT(m.id) as count'], false)
            .from('chat_message m')
            .join('user_chat uc', 'uc.chat_id = m.chat_id')
            .join('user u', 'u.id = uc.user_id')
            .where({
                'm.status <>': Message.STATUS.SEEN,
                'uc.user_id': userId,
                'm.user_id <>': userId,
            })
            .get();

        if (!result) {
            return 0;
        }

        return result[0].count;
    }

    async getAvailableParticipants(userId) {
        return await this.qb
            .select([
                'u.id',
                'CONCAT(first_name, " ", last_name) as name',
            ], false)
            .from(this.getTableName() + ' as u')
            .where({
                'u.id <>': userId,
            })
            .get();
    }

    async getOnlineInterlocutors(userId) {
        return await this.qb.query(`
            SELECT wsuc.socket_id FROM ws_user_connection wsuc
            LEFT JOIN user u ON u.id = wsuc.user_id
            LEFT JOIN user_chat uc ON uc.user_id = u.id
            WHERE uc.chat_id IN (SELECT c.id
                                 FROM chat c
                                          LEFT JOIN user_chat uc ON uc.chat_id = c.id
                                 WHERE user_id = ${userId}) AND uc.user_id <> ${userId}
                                 AND u.online = ${User.ONLINE.YES}
            GROUP BY wsuc.socket_id
         `);
    }

}

User.ONLINE = {
    NO: 1,
    YES: 2
};

module.exports = User;