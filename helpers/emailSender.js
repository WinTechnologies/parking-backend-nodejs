var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');
var mailConfig = require('../config/main').smtp;
const date = require('date-and-time');
const useragent = require('express-useragent');

var transport = nodemailer.createTransport(
  smtpPool({
    host: mailConfig.host,
    port: mailConfig.port,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: mailConfig.user,
      pass: mailConfig.password
    },
    maxConnections: 3,
    maxMessages: 300
  })
);

exports.welcome = user => {
  var message = '';
  message += 'Hi ' + user.first_name;
  message +=
    '\nCongratulations! Your account has been created successfully you can now log in';
  message += '\n- Username: ' + user.username;
  message += '\n- Password: ' + user.password;

  var mail_object = {
    from: mailConfig.sender,
    to: user.email,
    subject: 'Welcome',
    text: message
  };

  transport.sendMail(mail_object, (error, info) => {
    if (error) {
    }
  });
};

exports.resetPassword = (user, req) => {
    const changed = date.format(new Date(), 'D/M/YYYY HH:mm', true);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '-';
    const agent = useragent.parse(req.headers['user-agent'] || '');

    let account = user.username
    if (user.username.length > 2) {
        const asterisks = Array(user.username.length - 1).join('*');
        account = `${user.username[0]}${user.username[1]}${asterisks}`;
    }

    let message = `
    Hello,<br>
    Your password <b>${user.password}</b> for the M.A.P.S account <b>${account}</b> (username) was changed on ${changed} (GMT).<br>
    If this was you, then you can safely ignore this email.<br>
    <br>
    Security info used: ${user.email}<br>
    Platform: ${agent.platform}<br>
    Browser: ${agent.browser}<br>
    IP address: ${ip}<br>
    <br>
    If this wasn't you, your account has been compromised. Please consider resetting your password.<br>
    <br>
    Thanks,<br>
    The M.A.P.S account team
    `;

    const mail_object = {
        from: mailConfig.sender,
        to: user.email,
        subject: 'M.A.P.S account password change',
        html: message,
    };

    transport.sendMail(mail_object, (error, info) => {
        if (error) {
            return error;
        } else {
            return info;
        }
    });
};
