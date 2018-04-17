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
      host: 'host',
      port: 465,
      secure: true,
      auth: {
          user: 'user',
          pass: 'pass'
      }
    },
    cdal: {
      baseUrl: util.format('http://%s/v1', process.env.CDAL_ADDRESS || 'localhost:4000')
    }
};
