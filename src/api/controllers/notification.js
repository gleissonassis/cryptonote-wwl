var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('notification');

  return {
    sendNotification: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.sendNotification(req.body)
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
