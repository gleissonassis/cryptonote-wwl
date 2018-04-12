var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    address: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: false
    },
    extra: {
      anonymity: {
        type: Number,
        required: false
      },
      paymentId: {
        type: String,
        required: false
      }
    },
    isEnabled: {
      type: Boolean,
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
  });

  model = model ? model : mongoose.model('contacts', schema);

  return model;
};
