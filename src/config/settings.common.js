var util      = require('util');

module.exports = {
    mongoUrl : util.format('mongodb://%s/%s',
                      process.env.DB_SERVER || 'localhost',
                      process.env.DB_NAME   || 'wwl-services'),
    servicePort : process.env.PORT || 3001,
    isMongoDebug : true,
    jwt: {
      secret: 'secret',
      expiresIn: '1h'
    },
    mailOptions: {
      host: process.env.MAIL_HOST || 'host',
      port: process.env.MAIL_PORT || 465,
      secure: process.env.MAIL_SECURE || true,
      auth: {
          user: process.env.MAIL_USERNAME || 'user',
          pass: process.env.MAIL_PASSWORD || 'pass'
      }
    },
    cdal: {
      baseUrl: util.format('http://%s/v1', process.env.CDAL_ADDRESS || 'localhost:4000')
    },
    twoFactorAuth: {
      name: 'NBR Wallet',
      issuer: 'Nióbio Cash'
    },
    maximumUsers: 64
};
