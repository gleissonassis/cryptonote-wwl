var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    address: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: false
    },
    isEnabled: {
      type: Boolean,
      required: true
    },
    balance: {
      available: {
        type: Number,
        required: true
      },
      locked: {
        type: Number,
        required: true
      }
    }
  });

  model = model ? model : mongoose.model('address', schema);

  return model;
};
