'use strict';

class CommonHelper
{
    static camelToSnakeCase(str)
    {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}

module.exports = CommonHelper;