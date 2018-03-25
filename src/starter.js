var UserBO                = require('./business/userBO');
var MailTemplateBO        = require('./business/mailTemplateBO');
var DAOFactory            = require('./daos/daoFactory');
var ModelParser           = require('./models/modelParser');
var JWTHelper             = require('./helpers/jwtHelper');
var UserHelper            = require('./helpers/userHelper');
var md5                   = require('./helpers/md5');
var Promise               = require('promise');

module.exports = function() {
  var modelParser = new ModelParser();

  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: modelParser,
    jwtHelper: new JWTHelper(),
    userHelper: new UserHelper()
  });

  return {
    createMailTemplates: function() {
      if (process.env.NODE_ENV && process.env.NODE_ENV === 'test') {
        return Promise.resolve();
      } else {
        var mailtemplateBO = new MailTemplateBO({
          mailTemplateDAO: DAOFactory.getDAO('mailTemplate'),
          modelParser: new ModelParser()
        });

        var newUserMailTemplate = {
          key: 'new-user',
          from: 'CryptoNote WWL <gleisson.assis@gdxconsulting.com.br>',
          subject: 'New User',
          textTemplate: 'Hello ${user.name},\n\n ${user.id} ${user.email} ${user.confirmation.key}',
          htmlTemplate: 'Hello <b>${user.name}</b>,\n\n ${user.id} ${user.email} ${user.confirmation.key}'
        };

        var resetPasswordMailTemplate = {
          key: 'reset-password',
          from: 'CryptoNote WWL <gleisson.assis@gdxconsulting.com.br>',
          subject: 'New User',
          textTemplate: 'Hello ${user.name},\n\n ${user.id} ${user.email} ${user.confirmation.key} ${user.internalKey}',
          htmlTemplate: 'Hello ${user.name},\n\n ${user.id} ${user.email} ${user.confirmation.key} ${user.internalKey}'
        };

        var p = [mailtemplateBO.save(newUserMailTemplate),
                mailtemplateBO.save(resetPasswordMailTemplate)];

        return Promise.all(p);
      }
    },

    createAdminUser: function() {
      return new Promise(function(resolve, reject) {
        // in TEST environment there is no need to create a default admin user
        if (process.env.NODE_ENV && process.env.NODE_ENV === 'test') {
          resolve();
        } else {
          userBO.createUserWithoutValidations({
            name: 'Administrator',
            email: 'admin@cryptonotewwl.com',
            password: '123456',
            role: 'admin',
            confirmation: {
              key: md5('.'),
              isConfirmed: false
            },
            internalKey: md5('.')
          })
          .then(resolve)
          .catch(function(error) {
            if (error.status === 409) {
              resolve();
            } else {
              reject(error);
            }
          });
        }
      });
    },

    configureApplication: function() {
      var self = this;
      self.createAdminUser();
      self.createMailTemplates();
    }
  };
};
