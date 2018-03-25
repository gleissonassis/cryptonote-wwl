var settings              = require('../../../src/config/settings');
var SendMailHelper        = require('../../../src/helpers/sendMailHelper');
var nodemailer            = require('nodemailer');

describe('helpers', function(){
  describe('sendMailHelper', function(){
    it('should send an email to gleisson.assis@gmail.com', function() {
      this.timeout(5000);

      var sendMailHelper = new SendMailHelper(nodemailer);
      sendMailHelper.options = settings.mailOptions;

      return sendMailHelper.send({
        from: 'gleisson.assis@gdxconsulting.com.br',
        to: 'gleisson.assis@gmail.com',
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
      });
    });
  });
});
