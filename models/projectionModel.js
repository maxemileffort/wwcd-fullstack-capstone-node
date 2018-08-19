'use strict';

const mongoose = require('mongoose');

// this is our schema to represent scraped projections
const projectionSchema = mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    team: {type: String, required: true},
    position: {type: String},
    age: {type: Number},
    exp: {type: Number},
    avgType: {type: String},
    points: {type: Number},
    posRank: {type: Number},
    dropOff: {type: Number},
    sdPoints: {type: Number},
    floor: {type: Number},
    ceiling: {type: Number},
    tier: {type: Number},
    pointsVor: {type: Number},
    rank: {type: Number},
    floorVor: {type: Number},
    floorRank: {type: Number},
    ceilingVor: {type: Number},
    ceilingRank: {type: Number},
    posEcr: {type: Number},
    sdEcr: {type: Number},
    ecr: {type: Number},
    risk: {type: Number},
    adp: {type: Number},
    adpDiff: {type: Number},
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