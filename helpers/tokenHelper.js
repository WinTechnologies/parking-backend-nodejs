/**
 * This is for auto-refresh JWTs created
 *  using https://github.com/auth0/node-jsonwebtoken.
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const getTokenConfigs = require('./../config/auth');

// use 'utf8' to get string instead of byte array  (512 bit key)
// const aPrivateKEY  = fs.readFileSync(path.resolve(AccessToken_PrivateKey_FileName), 'utf8');
// const aPublicKEY  = fs.readFileSync(path.resolve(AccessToken_PublicKey_FileName), 'utf8');
// const rPrivateKEY  = fs.readFileSync(path.resolve(RefreshToken_PrivateKey_FileName), 'utf8');
// const rPublicKEY  = fs.readFileSync(path.resolve(RefreshToken_PublicKey_FileName), 'utf8');

module.exports = {
    /**
     * @param payload
     * @param options
     * @returns {*}
     */
    sign: async (payload, options = {}) => {
        const { AccessToken_PrivateKey_FileName, Issuer, Subject, Audience } = await getTokenConfigs();
        const aPrivateKEY  = fs.readFileSync(path.resolve(AccessToken_PrivateKey_FileName), 'utf8');
        const defaultOptions = {
            issuer: Issuer,
            subject: Subject,
            audience: Audience,
        };

        const signOptions = {
            ...defaultOptions,
            algorithm: 'RS256',
            expiresIn: options.expiresIn,
        };
        return jwt.sign(payload, aPrivateKEY, signOptions);
    },

    /**
     * @param payload
     * @param options
     * @returns {*}
     */
    signRefreshToken: async (payload, options = {}) => {
        const { RefreshToken_PrivateKey_FileName, Issuer, Subject, Audience } = await getTokenConfigs();
        const rPrivateKEY  = fs.readFileSync(path.resolve(RefreshToken_PrivateKey_FileName), 'utf8');
        const defaultOptions = {
            issuer: Issuer,
            subject: Subject,
            audience: Audience,
        };

        const signOptions = {
            ...defaultOptions,
            algorithm: 'RS256',
            expiresIn: options.expiresIn,
        };
        return jwt.sign(payload, rPrivateKEY, signOptions);
    },

    /**
     * @param token
     * @param options
     * @returns {*}
     */
    refresh: async (token, options) => {
        try {
            const { AccessToken_PrivateKey_FileName, AccessToken_PublicKey_FileName, Issuer, Subject, Audience }
                = await getTokenConfigs();
            const aPrivateKEY  = fs.readFileSync(path.resolve(AccessToken_PrivateKey_FileName), 'utf8');
            const aPublicKEY  = fs.readFileSync(path.resolve(AccessToken_PublicKey_FileName), 'utf8');

            const defaultOptions = {
                issuer: Issuer,
                subject: Subject,
                audience: Audience,
            };

            const payload = jwt.verify(token, aPublicKEY, {
                ...defaultOptions,
                algorithm: ['RS256'],
                expiresIn: options.expiresIn,
            });
            const {iat, exp, nbf, jti, ...payloadContent} = payload;

            // We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions
            // The first signing converted all needed options into claims, they are already in the payload
            return jwt.sign(payloadContent, aPrivateKEY, {
                ...defaultOptions,
                expiresIn: options.expiresIn,
                jwtid: options.jwtid,
            });
        } catch (err) {
            return false;
        }
    },

    /**
     *
     * @param token
     * @param options
     * @returns {*}
     */
    verify: async (token, options = {}) => {
        const { AccessToken_PublicKey_FileName, Issuer, Subject, Audience }
            = await getTokenConfigs();
        const aPublicKEY  = fs.readFileSync(path.resolve(AccessToken_PublicKey_FileName), 'utf8');
        const defaultOptions = {
            issuer: Issuer,
            subject: Subject,
            audience: Audience,
        };

        const verifyOptions = {
            ...defaultOptions,
            algorithm: ['RS256'],
            expiresIn: options.expiresIn,
        };
        try {
            return jwt.verify(token, aPublicKEY, verifyOptions);
        } catch (err) {
            return false;
        }
    },

    /**
     * @param token
     * @param callback function
     * @returns {*}
     */
    verifyAsync: async (token, callback) => {
        const { AccessToken_PublicKey_FileName, Issuer, Subject, Audience }
            = await getTokenConfigs();
        const aPublicKEY  = fs.readFileSync(path.resolve(AccessToken_PublicKey_FileName), 'utf8');

        return jwt.verify(token, aPublicKEY, callback);
    },

    /**
     *
     * @param token
     * @param options
     * @returns {*}
     */
    verifyRefreshToken: async (token, options = {}) => {
        const { RefreshToken_PublicKey_FileName, Issuer, Subject, Audience }
            = await getTokenConfigs();
        const rPublicKEY  = fs.readFileSync(path.resolve(RefreshToken_PublicKey_FileName), 'utf8');
        const defaultOptions = {
            issuer: Issuer,
            subject: Subject,
            audience: Audience,
        };

        const verifyOptions = {
            ...defaultOptions,
            algorithm: ['RS256'],
            expiresIn: options.expiresIn,
        };
        try {
            return jwt.verify(token, rPublicKEY, verifyOptions);
        } catch (err) {
            throw err;
            // return false;
        }
    },

    /**
     * @param token
     * @param callback function
     * @returns {*}
     */
    verifyRefreshTokenAsync: async (token, callback) => {
        const { RefreshToken_PublicKey_FileName, Issuer, Subject, Audience }
            = await getTokenConfigs();
        const rPublicKEY  = fs.readFileSync(path.resolve(RefreshToken_PublicKey_FileName), 'utf8');

        return jwt.verify(token, rPublicKEY, callback);
    },

    /**
     * @param token
     * @returns {*} null if token is invalid
     */
    decode: (token) => {
        return jwt.decode(token, {complete: true});
    },
};

// function TokenGenerator (secretOrPrivateKey, secretOrPublicKey, options) {
//     this.secretOrPrivateKey = secretOrPrivateKey;
//     this.secretOrPublicKey = secretOrPublicKey;
//     // this.secretOrPrivateKey  = fs.readFileSync('./private.key', 'utf8');
//     // this.secretOrPublicKey  = fs.readFileSync('./public.key', 'utf8');
//
//     this.options = {
//         issuer: 'Datategy',
//         subject: 'sr.frontenddev210@gmail.com',
//         audience: 'http://datategy.net', // this should be provided by client
//         algorithm:  'RS256',
//         ...options, //algorithm + keyid + noTimestamp + expiresIn + notBefore
//     };
// }
//
// TokenGenerator.prototype.sign = function(payload, signOptions) {
//     return jwt.sign(payload, this.secretOrPrivateKey, {
//         ...this.options,
//         ...signOptions,
//     });
// };
//
// // refreshOptions.verify = options you would use with verify function
// // refreshOptions.jwtid = contains the id for the new token
// TokenGenerator.prototype.refresh = function(token, refreshOptions) {
//     const payload = jwt.verify(token, this.secretOrPublicKey, refreshOptions.verify);
//     delete payload.iat;
//     delete payload.exp;
//     delete payload.nbf;
//     delete payload.jti; //We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions
//     // The first signing converted all needed options into claims, they are already in the payload
//     return jwt.sign(payload, this.secretOrPrivateKey, {
//         ...this.options,
//         jwtid: refreshOptions.jwtid,
//     });
// };
//
// module.exports = TokenGenerator;
