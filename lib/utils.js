const _ = require('lodash');

module.exports.groupFileByExistInList = (list, files) => {
    return _.groupBy(files, file => _.includes(list, file) ? 'exist' : 'notExist');
};
