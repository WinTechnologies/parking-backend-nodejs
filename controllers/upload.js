const multer = require("multer");
const fs = require("fs");
const COMMON_FUNC = require('../api/services/util/common');
const makeDir = require('make-dir');

const prepareStorage = (dir) => {

    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, dir);
        },
        filename: function (req, file, cb) {
            const datetimestamp = Date.now();
            cb(
                null,
                `${file.fieldname}-${datetimestamp}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`
            );
        }
    });
};

// directories config
const uploadDirConfig = {
    mobile: {
        path: './uploads/mobile',
        section: {
            contraventions: {
                path: './uploads/mobile/contraventions',
                storage: prepareStorage('./uploads/mobile/contraventions')
            },
            jobs: {
                path: './uploads/mobile/jobs',
                storage: prepareStorage('./uploads/mobile/jobs')
            },
            incidents: {
                path: './uploads/mobile/incidents',
                storage: prepareStorage('./uploads/mobile/incidents')
            },
            accidents: {
                path: './uploads/mobile/accidents',
                storage: prepareStorage('./uploads/mobile/accidents')
            }
        }
    },
    web: {
        path: './uploads/web',
        section: {
            projects: {
                path: './uploads/web/projects',
                sub: {
                    general: {
                        path: './uploads/web/projects/general',
                        storage: prepareStorage('./uploads/web/projects/general')
                    },
                    carpark: {
                        path: './uploads/web/projects/carpark',
                        storage: prepareStorage('./uploads/web/projects/carpark')
                    },
                    onStreet: {
                        path: './uploads/web/projects/onStreet',
                        storage: prepareStorage('./uploads/web/projects/onStreet')
                    },
                    enforcement: {
                        path: './uploads/web/projects/enforcement',
                        storage: prepareStorage('./uploads/web/projects/enforcement')
                    }
                }
            },
            violations: {
                path: './uploads/web/violations',
                storage: prepareStorage('./uploads/web/violations')
            },
            assets: {
                path: './uploads/web/assets',
            },
            employees: {
                path: './uploads/web/employees',
                storage: prepareStorage('./uploads/web/employees')
            },
            tariff: {
                path: './uploads/web/tariff',
                sub: {
                    valueadded: {
                        path: './uploads/web/tariff/valueadded',
                        storage: prepareStorage('./uploads/web/tariff/valueadded')
                    },
                    promotion: {
                        path: './uploads/web/tariff/promotion',
                        storage: prepareStorage('./uploads/web/tariff/promotion')
                    }
                }
            },
            default_values: {
                path: './uploads/web/default_values',
                sub: {
                    incidents: {
                        path: './uploads/web/incidents',
                        storage: prepareStorage('./uploads/web/incidents')
                    },
                    root: {
                        path: './uploads/web/default_values',
                        storage: prepareStorage('./uploads/web/default_values'),
                    }
                }
            }
        }
    }
};

const createSubDir = async (path) => {
    const uploadDir = COMMON_FUNC.uploadUri(path);
    await makeDir(uploadDir);
    return uploadDir;
}

const saveFile = (dir) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const datetimestamp = Date.now();
            cb(
                null,
                `${file.fieldname}-${datetimestamp}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`
            );
        }
    });
}


const uploadMany = (req, res, next) => {
    const { app, section, sub } = req.params;
    let upload;
    let path = "";

    if (sub) {
        path = uploadDirConfig[app].section[section].sub[sub].path;
    } else {
        path = uploadDirConfig[app].section[section].path;
    }

    createSubDir(path)
        .then(dest => {
            const storage = saveFile(dest);
            upload = multer({ storage }).array("uploads", 12);

            upload(req, res, (err) => {
                if (err) {
                    return res.status(422)
                        .send('an Error occured');
                }
                let result_path = [];

                const files = req.files;
                let index, len;
                // Loop through all the uploaded images and display them on frontend
                for (index = 0, len = files.length; index < len; ++index) {
                    result_path.push(files[index].path);
                }

                return res.json(result_path);
            });
        });
};

const uploadOne = (req, res, next) => {
    const { app, section, sub } = req.params;
    let upload;
    let path = "";

    if (sub) {
        path = uploadDirConfig[app].section[section].sub[sub].path;
    } else {
        path = uploadDirConfig[app].section[section].path;
    }

    createSubDir(path)
        .then(dest => {
            const storage = saveFile(dest);
            upload = multer({ storage }).single('upload', 12);

            upload(req, res, (err) => {
                if (err) {
                    return res.status(422)
                        .send('an Error occured');
                }
                if (req.file && req.file.path) {
                    path = req.file.path;
                }
                return res.json(path);
            });
        });
};

const getUploaded = (req, res, next) => {
    try {
        const isResource = (/true/i).test(req.query.r);
        const path = isResource ? `./resource/images${req.query.path}` : `.${req.query.path}`;

        const fileReadStream = fs.createReadStream(path, { flags: 'r', autoClose: true });
        fileReadStream.on('data', (data) => {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        });
    } catch (e) {
        return res.json({ message: e });
    }
}

const replaceImage = (req, res, next) => {
    try {
        const originalFile = req.params.originalFile;
        const originalUrl = originalFile.split(' ').join('/');

        const originalFileInfo = getPathAndFile(originalUrl);
        const originalPath = originalFileInfo.path;

        fs.access(originalUrl, fs.F_OK, (err) => {
            if (err) {
                res.json({ message: err });
            }
            // file exists
            const storage = saveFile(originalPath);
            upload = multer({ storage }).single('upload', 12);
            upload(req, res, function (err) {
                if (err) {
                    return res.status(422)
                        .send('an Error occured');
                }

                if (req.file && req.file.path) {
                    path = req.file.path;
                }

                fs.rename(path, originalUrl, (err) => {
                    if (err) {
                        next(err);
                    }
                });
            });
            return res.json(originalUrl);
        });
    } catch (e) {
        res.json({ message: e });
    }
}

const getPathAndFile = (url) => {
    // get File Name
    const fileName = url.replace(/^.*[\\\/]/, '');
    // get the upload Path
    const path = url.replace(/(.*?)[^/]*\..*$/, '$1');
    return { file: fileName, path: path};
}

exports.getUploaded = getUploaded;
exports.uploadMany = uploadMany;
exports.uploadOne = uploadOne;
exports.replaceImage = replaceImage;