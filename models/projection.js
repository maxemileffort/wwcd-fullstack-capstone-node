'use strict';

const mongoose = require('mongoose');

// this is our schema to represent scraped projections
const projectionSchema = mongoose.Schema({
  season: {type: Number},
  week: {type: Number},
  players: { type: Array }
  
});
  
  
const Projection = mongoose.model('Projection', projectionSchema);

module.exports = {Projection}