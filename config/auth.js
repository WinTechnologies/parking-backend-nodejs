/**
 * 10 minutes: 600, '600s', '10m', '60000ms',
 * 1 day: 86400, '1d'
 */
// const Web_AccessToken_LifeTime = process.env.Web_AccessToken_LifeTime;
// const Mobile_AccessToken_LifeTime =  process.env.Mobile_AccessToken_LifeTime;
// const RefreshToken_LifeTime =  process.env.RefreshToken_LifeTime;

let Web_AccessToken, Mobile_AccessToken, RefreshToken;
const TOKEN_NAMES = Object.freeze({
    WEB_ACCESS_TOKEN: 'Web_AccessToken',
    MOBILE_ACCESS_TOKEN: 'Mobile_AccessToken',
    MOBILE_REFRESH_TOKEN: 'Mobile_RefreshToken',
});
const { getAllTokens } = require('../api/pg/token-config/controller');

const loadTokenConfigFromDB = async () => {
    try {
        const tokens = await getAllTokens();

        Web_AccessToken = tokens.filter(el => el.token_name === TOKEN_NAMES.WEB_ACCESS_TOKEN);
        Mobile_AccessToken = tokens.filter(el => el.token_name === TOKEN_NAMES.MOBILE_ACCESS_TOKEN);
        RefreshToken = tokens.filter(el => el.token_name === TOKEN_NAMES.MOBILE_REFRESH_TOKEN);

        if (!Web_AccessToken.length || !Mobile_AccessToken.length || !RefreshToken.length) {
            process.exit(1);
            throw new Error('All tokens are not configured in database');
        }
        Web_AccessToken = Web_AccessToken[0];
        Mobile_AccessToken = Mobile_AccessToken[0];
        RefreshToken = RefreshToken[0];

        if (isNaN(Web_AccessToken.lifetime) || isNaN(Mobile_AccessToken.lifetime) || isNaN(RefreshToken.lifetime)) {
            throw new Error('Token lifetimes are not incorrect');
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = async () => {
    if (!Web_AccessToken || !Mobile_AccessToken || !RefreshToken) {
        await loadTokenConfigFromDB();
    }
    return {
        /**
         * 10 minutes: 600, '600s', '10m', '60000ms',
         * 1 day: 86400, '1d'
         */
        Web_AccessToken_LifeTime: parseInt(Web_AccessToken.lifetime),
        Mobile_AccessToken_LifeTime: parseInt(Mobile_AccessToken.lifetime),
        RefreshToken_LifeTime: parseInt(RefreshToken.lifetime),

        AccessToken_PrivateKey_FileName: process.env.AccessToken_PrivateKey_FileName,
        AccessToken_PublicKey_FileName: process.env.AccessToken_PublicKey_FileName,

        RefreshToken_PrivateKey_FileName: process.env.RefreshToken_PrivateKey_FileName,
        RefreshToken_PublicKey_FileName: process.env.RefreshToken_PublicKey_FileName,

        Issuer: process.env.Token_Issuer,
        Subject: process.env.Token_Subject,
        Audience: process.env.Token_Audience,
        Algorithm: process.env.Token_Algorithm,
    }
};
