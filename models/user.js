'use strict';

const mongoose = require('mongoose');

// this is our schema to represent a player salary with some stats
const userSchema = mongoose.Schema({
  username: {type: String},
  email: {type: String},
  password: {type: String},
  newsletter: {type: Boolean, default: false},
  accountType: {type: String, default: 'Free'},
});


userSchema.methods.serialize = function() {

  return { // add id field and remove password
    id: this._id,
    username: this.username,
    email: this.email,
    newsletter: this.newsletter,
    accountType: this.accountType
  };
}


const User = mongoose.model('User', userSchema);


module.exports = {User};