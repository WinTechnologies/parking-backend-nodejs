const toStream = require('buffer-to-stream');
const { MAWGIF_FTP } = require('../config/main');
const COMMON_FUNC = require('../api/services/util/common');
const PromiseFtp = require('promise-ftp');
const { Base64Encode } = require('base64-stream');
const multiparty = require('multiparty');
const fs = require('fs');;

exports.downloadImageAsBase64 = async (req, res, next) => {
    try {
        const url = req.query.url;
        const extension = url.split('.').pop();
        let imageHeader = `data:image/${extension};base64,`;
        const ftp = new PromiseFtp();

        ftp.connect(MAWGIF_FTP)
            .then(() => {
                return ftp.get(url);
            }).then((stream) => {
                return new Promise((resolve, reject) => {
                    res.type('json');
                    let base64 = '';
                    stream.once('error', reject);
                    stream.pipe(new Base64Encode({ prefix: imageHeader }))
                    .on('data', (row) => {
                        base64 += row;
                    })
                    .on('error', (err) => {
                        return res.status(500).send(err);
                    })
                    .on('end', () => {
                       return res.status(200).json(base64);
                    })

                });
            }).catch(e => {
                return res.status(404).json(e);
            }).finally(() => {
                return ftp.end();
            });
    } catch (e) {
        next(e);
    }
};

exports.uploadImage = async (req, res, next) => {
    try {
        const base64 = req.body.base64;
        const datetimestamp = Date.now();
        const fileName = `${datetimestamp}.jpg`;
        const uploadUri = COMMON_FUNC.ftpUploadUri('mawgifpic');
        const destFile = `${uploadUri}/${fileName}`;
        const imageBuffer = COMMON_FUNC.decodeBase64Image(base64);
        let readableStream = toStream(imageBuffer.data);
        const ftp = new PromiseFtp();

        ftp.connect(MAWGIF_FTP)
        .then( () => {
            return ftp.put(readableStream, destFile);
        }).then( () => {
            return ftp.end();
        });

        return res.status(200).json(destFile);
    } catch (e) {
        next(e);
    }
};

exports.replaceImage = async (req, res, next) => {
    try {
        const form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            const originalImageUrl = fields.original_image_url;
            const originalPath = originalImageUrl[0].replace(/(.*?)[^/]*\..*$/, '$1');
            const datetimestamp = Date.now();
            const extension = originalImageUrl[0].split('.').pop();
            const newUrl = `${originalPath}${datetimestamp}.${extension}`;

            const uploadFile = files.upload;
            const ftp = new PromiseFtp();
            ftp.connect(MAWGIF_FTP)
            .then( () => {
                // Create Directory with today on the mawgif ftp server
                return ftp.mkdir(originalPath, true);
            }).then( () => {
                // Upload the new image into the dest directory
                const readableStream = fs.createReadStream(`${uploadFile[0].path}`);
                return ftp.put(readableStream, newUrl);
            }).then( () => {
                // Remove the original file
                return ftp.delete(originalImageUrl);
            }).then( () => {
                // Rename from new to original url
                return ftp.rename(newUrl, originalImageUrl);
            }).then( () => {
                return ftp.end();
            });

            return res.status(200).json(originalImageUrl);
        });
    } catch (e) {
        next(e);
    }
};