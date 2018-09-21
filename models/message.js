'use strict';

const mongoose = require('mongoose');

// this is our schema to represent a player salary with some stats
const messageSchema = mongoose.Schema({
  username: {type: String},
  email: {type: String},
  message: {type: String},
  read: {type: Boolean, default: false},
  timeStamp: {type: String},
});


messageSchema.methods.serialize = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    message: this.message,
    timeStamp: this.timeStamp,
    read: this.read
  };
}


const Message = mongoose.model('Message', messageSchema);


module.exports = {Message};