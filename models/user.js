'use strict';

const mongoose = require('mongoose');

// this is our schema to represent a player salary with some stats
const userSchema = mongoose.Schema({
  name: {type: String},
  email: {type: String},
  newsletter: {type: Boolean, default: false},
  accountType: {type: String, default: 'Free'},
});


// restaurantSchema.methods.serialize = function() {

//   return {
//     id: this._id,
//     name: this.name,
//     cuisine: this.cuisine,
//     borough: this.borough,
//     grade: this.grade,
//     address: this.addressString
//   };
// }


const User = mongoose.model('User', userSchema);


module.exports = {User};