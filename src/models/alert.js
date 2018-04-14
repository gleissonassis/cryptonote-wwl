var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    userId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
    },
    systemMessage: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      required: true
    },
    createdAt: {
      type: Date,
      required: true
    },
    updatedAt: {
      type: Date,
      required: false
    },
    read: {
      isRead: {
        type: Boolean,
        required: true,
      },
      readAt: {
        type: Date,
      },
      info: {
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        }
      }
    }
  });

  model = model ? model : mongoose.model('alerts', schema);

  return model;
};
