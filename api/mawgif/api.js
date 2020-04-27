const request = require("request");
const MAWGIF_API_BASE = require("../../config/main").MAWGIF_API_BASE;
const MAWGIF_API_BASE_TOKEN = require("../../config/main").MAWGIF_API_BASE_TOKEN;
const MAWGIF_AUTHORIZATION_PARAMS = require("../../config/main").mawgif_smtp;

/**
 * OSES API Authentication
 * @returns {Promise}
 */
const getAuthorization = function() {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    // Configure the request
    const options = {
        url: MAWGIF_API_BASE_TOKEN,
        method: 'POST',
        headers: headers,
        form: MAWGIF_AUTHORIZATION_PARAMS,
    };

    return new Promise(function(resolve, reject) {
        request(options, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                    resolve(parsedBody);
                } catch (err) {
                    reject(new Error(`Mawgif AUTH API Exception: Can't parse response!
                        ${response.request.method}: ${response.request.href},
                        statusCode: ${response.statusCode},
                        body: ${response.body}
                    `));
                }
            } else {
                console.log('postFromMawgifAuth: ', error);
                reject(new Error(`Mawgif AUTH API Exception: ${JSON.stringify(error)}
                    ${response.request.method}: ${response.request.href},
                    statusCode: ${response.statusCode},
                    body: ${response.body}
                `));
            }
        });
    });
};

/**
 * data must be contain the following field:
     - headers : headers params of the request
     - url : end of api url
     - body : body params
 * @param data
 * @returns {Promise}
 */
const postFromMawgif = async (data) => {
    let auth, options;
    try {
        auth = await getAuthorization();
        let headers = data.headers;
        headers.Authorization = `bearer ${auth.access_token}`;

        options = {
            url: `${MAWGIF_API_BASE}/${data.url}`,
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data.body),
            json: false
        };
    } catch (err) {
        throw err;
    }

    return new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (!error) {
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                    resolve(parsedBody);
                } catch (err) {
                    reject(new Error(`Mawgif API POST Exception: Can't parse response!
                        ${response.request.method}: ${response.request.href},
                        statusCode: ${response.statusCode},
                        body: ${response.body}
                    `));
                }
            } else {
                console.log('postFromMawgif: ', error);
                reject(new Error(`Mawgif API POST Exception: ${JSON.stringify(error)}
                    ${response.request.method}: ${response.request.href},
                    statusCode: ${response.statusCode},
                    body: ${response.body}
                `));
            }
        });
    });
};

/**
 *
 * @param data
 * @returns {Promise}
 */
const putFromMawgif = async (data) => {
    let auth, options;
    try {
        auth = await getAuthorization();
        let headers = data.headers;
        headers.Authorization = `bearer ${auth.access_token}`;

        options = {
            url: `${MAWGIF_API_BASE}/${data.url}`,
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data.body),
            json: false
        };
    } catch (err) {
        throw err;
    }

    return new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (!error) {
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                    resolve(parsedBody);
                } catch (err) {
                    reject(new Error(`Mawgif API PUT Exception: Can't parse response!
                        ${response.request.method}: ${response.request.href},
                        statusCode: ${response.statusCode},
                        body: ${response.body}
                    `));
                }
            } else {
                console.log('putFromMawgif: ', error);
                reject(new Error(`Mawgif API PUT Exception: ${JSON.stringify(error)}
                    ${response.request.method}: ${response.request.href},
                    statusCode: ${response.statusCode},
                    body: ${response.body}
                `));
            }
        });
    });
};

/**
 * data must be contain the following field:
     - headers : headers params of the request
     - url : end of api url
     - qs : parameter of request {'key1': 'xxx', 'key2': 'yyy'}
 * @param data
 * @returns {Promise}
 */
const getFromMawgif = async (data) => {
    let auth, options;
    try {
        auth = await getAuthorization();
        let headers = data.headers;
        headers.Authorization = `bearer ${auth.access_token}`;

        options = {
            url: `${MAWGIF_API_BASE}/${data.url}`,
            method: 'GET',
            headers: headers,
            qs: data.qs
        };
    } catch (err) {
        throw err;
    }

    return new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (!error) {
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                    resolve(parsedBody);
                } catch (err) {
                    reject(new Error(`Mawgif API GET Exception: Can't parse response!
                        ${response.request.method}: ${response.request.href},
                        statusCode: ${response.statusCode},
                        body: ${response.body}
                    `));
                }
            } else {
                console.log('getFromMawgif: ', error);
                reject(new Error(`Mawgif API GET Exception: ${JSON.stringify(error)}
                    ${response.request.method}: ${response.request.href},
                    statusCode: ${response.statusCode},
                    body: ${response.body}
                `));
            }
        });
    });
};

exports.post = postFromMawgif;
exports.put = putFromMawgif;
exports.get = getFromMawgif;
