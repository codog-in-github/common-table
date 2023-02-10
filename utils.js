export function isFunction (val) {
    return Object.prototype.toString.call(val) === '[object Function]'
}

export function isArray (val) {
    return Object.prototype.toString.call(val) === '[object Array]'
}

export function isEmpty (val) {
    return val === null ||
        val === undefined ||
        val === 'null' ||
        val === 'undefined' ||
        JSON.stringify(val) === '{}' ||
        JSON.stringify(val) === '[]' ||
        val.toString() === ''
}
/**
 * 同路径跟新数据
 * @param {Object} obj 原始对象
 * @param {*} data 数据
 * @param {*} copy 是否深拷贝
 * @returns {Object}
 */
export function objectMerge(obj, data, copy = true) {
    const newObj = copy ? {} : obj
    for(const key in obj) {
        if(isObject(obj[key])) {
            if(data[key]!== undefined) {
                newObj[key] = objectMerge(obj[key], data[key], copy)
            } else if(copy) {
                newObj[key] = objectMerge(obj[key], {}, copy)
            }
        } else if(data[key] !== undefined) {
            newObj[key] = data[key]
        } else {
            newObj[key] = obj[key]
        }
    }
    return newObj
}
