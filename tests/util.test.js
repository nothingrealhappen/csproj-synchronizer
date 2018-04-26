const utils = require('../lib/utils');

describe('utils testing', () => {
    describe('#groupFileByExistInList', () => {
        it('should get an array for unlisted files', () => {
            const result = utils.groupFileByExistInList(
                ['./source/web/a.js', './source/web/b.js'],
                ['./source/web/a.js', './source/web/b.js', './source/web/c.js']
            );

            expect(result.exist.length).toBe(2);
            expect(result.notExist.length).toBe(1);
        });
    });
});
