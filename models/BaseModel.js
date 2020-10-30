let settings = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    pool_size: 50
};

let qb = require('node-querybuilder');
qb = new qb(settings);

class BaseModel {

    constructor(attributes)
    {
        this.qb = qb;
        this.setAttributes(attributes);
    }

    static getSql(query)
    {
        return query.get_compiled_select();
    }

    static getPropertiesByPrefix(prefix, data, deleteOriginals)
    {
        let props = {};

        for (let key in data) {
            if (key.indexOf(prefix) === 0) {
                props[key.slice(prefix.length)] = data[key];

                if (deleteOriginals) {
                    delete data[key];
                }
            }
        }

        return props;
    }

    static parseParams(paramsData)
    {
        let params = {};

        if (!paramsData) {
            return params;
        }

        paramsData = paramsData.split('&&');

        if (!paramsData.length) {
            return params;
        }

        paramsData.forEach(function (data) {
            let parts = data.split(String.fromCharCode(4));

            if (!parts || parts.length < 3) {
                return;
            }

            if (!params[parts[0]]) {
                params[parts[0]] = {
                    paramId: parts[0],
                    values: []
                };
            }

            params[parts[0]].values.push({
                value: parts[1] === String.fromCharCode(3) ? null : parts[1],
                tooltip: parts[2] === String.fromCharCode(3) ? null : parts[2],
            });
        });

        return params;
    }

    setAttributes(attributes)
    {
        attributes = attributes || [];
        if (attributes.length === 0) {
            return;
        }

        attributes = BaseModel.filterAttributes(attributes, this.getFillableAttributes());

        for (let attributeName in attributes) {
            this[attributeName] = attributes[attributeName];
        }
    }

    static filterAttributes(attributes, available)
    {
        available = available || [];

        for (let name in attributes) {
            if (available.indexOf(name) === -1) {
                delete attributes[name];
            }
        }

        return attributes;
    }

    async update(values, where, callback)
    {
        return await this.qb.update(this.getTableName(), values, where, callback);
    }

    async insert(data)
    {
        return await this.qb.insert(this.getTableName(), data);
    }

    async delete(where)
    {
        return await this.qb.delete(this.getTableName(), where);
    }

    async deleteAll()
    {
        return await this.qb.empty_table(this.getTableName());
    }

    getTableName()
    {
        return '';
    }

    getFillableAttributes()
    {
        return [];
    }
}

module.exports = BaseModel;