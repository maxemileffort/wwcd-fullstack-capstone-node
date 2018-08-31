'use strict';

const mongoose = require('mongoose');

// this is our schema to represent scraped projections
const projectionSchema = mongoose.Schema({
  season: {type: Number},
  week: {type: Number},
  players: { type: Array }
  
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
  
  
  const Projection = mongoose.model('Projection', projectionSchema);

  module.exports = {Projection}