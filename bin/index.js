#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const args = require('args');
const _ = require('lodash');
const glob = require('glob');
/* const yesno = require('yesno');
 * */
args
    .option('file', 'the csproj file you want to sync')
/* .option('autofix', 'automatic fix csproj file')*/
    .option('configFile', 'the config for scan files need include in csproj');

const flags = args.parse(process.argv);

console.log('running csproj file sync by file:', flags.file);

let checkPathConfig;

getCsprojFile(flags.file)
    .then(fixCsprojFile)
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

function getCsprojFile(filePath) {
    var parser = new xml2js.Parser({
        preserveChildrenOrder: true,
    });

    return new Promise((res, rej) => {
        fs.readFile(path.resolve(process.cwd(), filePath), (err, data) => {
            if (err) {
                return rej(err);
            }

            parser.parseString(data, (parserErr, result) => {
                if (parserErr) {
                    return rej(err);
                }

                res(result);
            });
        });
    });
}

function fixCsprojFile(csprojData) {
    removeNotExistItem(csprojData);
    fs.readFile(flags.configFile, (err, data) => {
        if (err) {
            console.error(err);
            process.exit(1);
        } else {
            try {
                checkPathConfig = JSON.parse(data);
                syncFilesToCsproj(csprojData);
            } catch(e) {
                process.exit(1);
            }
        }
    });
}

function syncFilesToCsproj(data){
    const allIncludedFiles = [];
    findContentItem(data, ({ filePath }) => allIncludedFiles.push(filePath));

    getScanFileList()
        .then(files => {
            const groupedFiles =  _.groupBy(files, file => _.includes(allIncludedFiles, file));
            const missingFilesInCsproj = groupedFiles.false;
            if (_.isEmpty(missingFilesInCsproj)) {
                console.log('all good for csproj-sync');
                process.exit(0);
            }

            const itemGroupForMissingFiles = findItemGroupByFilePath(data, groupedFiles.true[0]);

            console.log('missing below files in csproj');
            missingFilesInCsproj.forEach(item => console.log(item));

            if (flags.autoFix) {
                addMissingFileToCsproj(data, missingFilesInCsproj, itemGroupForMissingFiles);
                return;
            }

            process.exit(1);
        });
}

function removeNotExistItem(data, autoFix = false) {
    findContentItem(data, ({ items, filePath, contentItem }) => {
        fs.access(filePath, err => {
            if (err) {
                if (autoFix) {
                    const result = _.remove(items, contentItem);
                    console.log(`Item ${result[0].$.Include} deleted from csproj`);
                } else {
                    console.log(`File ${filePath} is not exist`);
                    process.exit(1);
                }
            }
        });
    });
}

function findItemGroupByFilePath(data, filePath) {
    const csprojDir = path.parse(path.resolve(flags.file));
    return _.find(data.Project.ItemGroup, items => {
        if (!items.Content) {
            return false;
        }

        return !_.isEmpty(_.find(items.Content, content => {
            const currentPath = path.join(csprojDir.dir, content.$.Include);
            return currentPath === filePath;
        }));
    });
}

function findContentItem(data, cb) {
    const csprojDir = path.parse(path.resolve(flags.file));
    data.Project.ItemGroup.forEach(items => {
        _.forEach(items.Content, contentItem => {
            const include = contentItem.$.Include;
            const filePath = path.join(csprojDir.dir, include);

            cb({
                items: items.Content,
                contentItem,
                filePath,
            });
        });
    });

    return data;
}

function globArrayToString(arr) {
    return `{${arr.join(',')}}`;
}

function getScanFileList() {
    return new Promise((res, rej) => {
        glob(
            globArrayToString(checkPathConfig.checkPath),
            { ignore: checkPathConfig.ignorePath  },
            (err, files) => {
                if (err) {
                    rej(err);
                } else {
                    res(files.map(filePath => path.join(process.cwd(), filePath)));
                }
            }
        );
    });
}

function addMissingFileToCsproj(data, missingFilesInCsproj, itemGroupForMissingFiles) {
    const content = itemGroupForMissingFiles.Content;
    console.log('added missing files to csproj file');
    const projFileDir = path.parse(path.resolve(flags.file)).dir + '\\';

    missingFilesInCsproj.forEach(filePath => {
        content.push({ $: { Include: filePath.replace(projFileDir, '') } });
    });

    itemGroupForMissingFiles.Content = _.sortBy(content, contentItem => contentItem.$.Include);

    saveUpdatedFile(data);
}

function saveUpdatedFile(data) {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(data);

    fs.writeFile(flags.file, xml.replace(/\/>/g, ' />').replace('&#xD;', ''), (err) => {
        if (err) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    });
}
