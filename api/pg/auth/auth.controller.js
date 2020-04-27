const employeeModel = require('./auth.model');
const projectEmployeeModel = require('../project_employee/project_employee.model');
const getTokenConfigs = require('./../../../config/auth');

const tokenHelper = require('../../../helpers/tokenHelper');

const emailSender = require('../../../helpers/emailSender');
const generatePassword = require('password-generator');

const uuidv1 = require('uuid/v1');

const authenticate = async (req, res, next, AccessToken_LifeTime, RefreshToken_LifeTime) => {
    const mobileIMEI = req.body.mobileIMEI;
    const identityInfo = {
        userAgent: req.get('user-agent'),
        userIP: (req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress).split(',')[0],
        mobileIMEI,
    };

    try {
        const result = await employeeModel.getByUsername(req.body);
        if (!result || result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Username not found!' });
        }
        const myuser = result.rows[0];

        const checkPassword = await employeeModel.checkPassword(req.body, myuser);
        if (!checkPassword || checkPassword.rowCount === 0) {
            return res.status(400).json({ success: false, message: 'Invalid Username or Password!' });
        }

        if (accountIsExpired(myuser)) {
            return res.status(400).json({ success: false, message: 'Your Account Got Expired!' });
        }

        /* only for mobile authentication*/
        const doubleLogin = await isDoubleLogin(myuser, identityInfo);
        if (!!mobileIMEI && doubleLogin) {
            // emailSender.resetPassword(employee);
            if (!!req.body.forceLogin && req.body.forceLogin === 'true') {
            } else {
                return res.status(401).json({
                    success: false,
                    type: 'Double login',
                    message: 'You have already logged in with another device, do you want to log out of all devices?',
                });
            }
        }

        const loginId = uuidv1();
        const tokenPayLoad = {
            id: myuser.employee_id,
            loginId: mobileIMEI ? loginId : undefined,
            mobileIMEI: mobileIMEI ? identityInfo.mobileIMEI : undefined,
            userAgent: identityInfo.userAgent,
            userIP: identityInfo.userIP,
        };

        const token = await tokenHelper.sign(tokenPayLoad, { expiresIn: AccessToken_LifeTime });
        const refreshToken = await tokenHelper.signRefreshToken(tokenPayLoad, { expiresIn: RefreshToken_LifeTime });

        if (!!mobileIMEI) {
            await employeeModel.update({
                employee_id: myuser.employee_id,
                login_id: loginId,
                mobile_imei: identityInfo.mobileIMEI,
                refresh_token: refreshToken,
            });
        }
        const projects = await projectEmployeeModel.getEmployeeAssignedProjects(myuser.employee_id);

        return res.status(200).json({
            success: true,
            message: 'Login successfully',
            token,
            refreshToken,
            user: {
                id: myuser.id,
                employee_id: myuser.employee_id,
                username: myuser.username,
                firstname: myuser.firstname,
                lastname: myuser.lastname,
                usertype: myuser.job_type,
                job_type: myuser.job_type,
                job_position: myuser.job_position,
                projects: projects.rows,
                login_id: loginId,
                mobile_imei: identityInfo.mobileIMEI,
            }
        });
    } catch (e) {
        return next(e);
    }
};

/**
 * checking expiration
 * @param employee
 * @returns {boolean}
 */
const accountIsExpired = (employee) => {
    const now = new Date();
    const endDate = new Date(employee.date_end);
    return !!employee.date_end && endDate < now;
};

/**
 *  Checking if this login attempt is doubled from another device.
 * @param employee
 * @param identityInfo
 * @param callback
 * @returns {boolean}
 */
const isDoubleLogin = async (employee, identityInfo, callback) => {
    try {
        // tokenHelper.verifyRefreshTokenAsync(employee.refresh_token, async function(error, decoded) {});
        const decoded = await tokenHelper.verifyRefreshToken(employee.refresh_token); // { expiresIn: RefreshToken_LifeTime }
        if (!decoded || (!decoded.userAgent && !decoded.userIP && !decoded.mobileIMEI)) {
            // Can't verify RefreshToken case1: first login, Expired, ..., old identity not found,
            return false;
        } else {
            return !(identityInfo && decoded.userAgent === identityInfo.userAgent
                && decoded.userIP === identityInfo.userIP && decoded.mobileIMEI === identityInfo.mobileIMEI);
        }
    } catch (err) {
        return false;
    }
};

exports.webAuth = async (req, res, next) => {
    const { Web_AccessToken_LifeTime, RefreshToken_LifeTime } = await getTokenConfigs();
    await authenticate(req, res, next, Web_AccessToken_LifeTime, RefreshToken_LifeTime);
};

exports.mobileAuth = async (req, res, next) => {
    if (!req.body.mobileIMEI || req.body.mobileIMEI === '') {
        return res.status(400).json({ success: false, message: 'Bad Request!' });
    }
    const { Mobile_AccessToken_LifeTime, RefreshToken_LifeTime } = await getTokenConfigs();
    await authenticate(req, res, next, Mobile_AccessToken_LifeTime, RefreshToken_LifeTime);
};

/**
 * Refresh Mobile Access Token
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.refreshAccessToken = async (req, res, next) => {
    const body = req.body;
    const mobileIMEI = body.mobileIMEI;
    const refreshToken = body.refreshToken;
    if (!refreshToken || !mobileIMEI) {
        return res.status(400).send({ success: false, message: 'Invalid Request!' });
    }
    const identityInfo = {
        userAgent: req.get('user-agent'),
        userIP: (req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress).split(',')[0],
        mobileIMEI,
    };

    await tokenHelper.verifyRefreshTokenAsync(refreshToken, async function(err, decoded) {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({success: false, type: err.name, message: 'Refresh Token Has Expired, Please Login Again!'});
            } else{
                return res.status(401).json({success: false, type: err.name, message: 'Unauthorized Request!'});
            }
        }

        if (decoded && decoded.mobileIMEI !== mobileIMEI) {
            return res.status(401).json({ success: false, type: 'OtherDevice', message: 'Refresh Request From Other Device!' });
        }

        try {
            const checkRefreshToken = await employeeModel.getByRefreshToken(refreshToken);
            if (!checkRefreshToken || checkRefreshToken.rowCount === 0) {
                // TODO: log malicious refresh token history
                return res.status(400).json({ success: false, message: 'Invalid Refresh Token!' });
            }

            const myuser =  checkRefreshToken.rows[0];
            const loginId = uuidv1();
            const tokenPayLoad = {
                id: myuser.employee_id,
                loginId: loginId,
                mobileIMEI: identityInfo.mobileIMEI,
                userAgent: identityInfo.userAgent,
                userIP: identityInfo.userIP,
            };
            const { Mobile_AccessToken_LifeTime } = await getTokenConfigs();
            const newAccessToken = await tokenHelper.sign(tokenPayLoad, { expiresIn: Mobile_AccessToken_LifeTime });

            await employeeModel.update({
                employee_id: myuser.employee_id,
                login_id: loginId,
            });

            return res.status(200).json({ success: true, newAccessToken });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Unknown Error!' });
        }
    });
};

exports.resetPassword = async (req, res, next) => {

    if(!req.body.username){
        return res.status(400).json({message: 'Username is missing'});
    }

    const result = await employeeModel.getByUsername({username: req.body.username.trim()});
    if (result && result.rows && result.rows[0]) {
        let employee = result.rows[0];
        employee.password = generatePassword(12, false);

        try {
            await employeeModel.resetPassword(employee);
            const mailResult = await emailSender.resetPassword(employee, req);
            return res.status(200).json({
                success: true,
                message: 'Reset Password Email has been sent to your email address! Please check your inbox.',
                mailResult: mailResult,
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }

    } else {
        return res.status(200).json({
            success: false,
            message: 'Username does not exist'
        });
    }
};

/**
 * Mobile Logout
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.logout = async (req, res, next) => {
    const body = req.body;
    const username = body.username;
    const refreshToken = body.refreshToken;
    const mobileIMEI = body.mobileIMEI;

    if(!username || !refreshToken || !mobileIMEI){
        return res.status(400).json({ success: false, message: 'Invalid Request!'});
    }

    await tokenHelper.verifyRefreshTokenAsync(refreshToken, async function(err, decoded) {
        if (err && err.name !== 'TokenExpiredError') {
            return res.status(401).json({ success: false, type: err.name, message: 'Unauthorized Request!' });
        }
        if (decoded && decoded.mobileIMEI !== mobileIMEI) {
            return res.status(401).json({ success: false, type: 'OtherDevice', message: 'Logout Request From Other Device!' });
        }

        employeeModel.getByUsernameAndRefreshToken(username, refreshToken).then(result => {
            if (result && result.rows && result.rows[0]) {
                let employee = result.rows[0];
                employeeModel.setRefreshToken(username, 'logout').then(dbResult => {
                    return res.status(200).json({ success: true, message: 'Logged Out!' });
                }).catch(err => {
                    return res.status(500).json({ success: false, message: err.message });
                });
            } else {
                return res.status(404).json({ success: false, message: 'Employee Session Not Found!' });
            }
        });
    });
};
