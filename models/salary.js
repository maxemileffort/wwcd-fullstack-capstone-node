'use strict';

const mongoose = require('mongoose');

// this is our schema to represent a player salary with some stats
const salarySchema = mongoose.Schema({
  season: {type: Number},
  week: {type: Number},
  salaries: {type: Array}
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


const Salary = mongoose.model('Salary', salarySchema);


module.exports = {Salary};