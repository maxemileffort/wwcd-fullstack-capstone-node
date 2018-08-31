'use strict';

// R script debugger
(function() {
  var childProcess = require("child_process");
  var oldSpawn = childProcess.spawn;
  function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
  }
  childProcess.spawn = mySpawn;
})();
//end debugger

const express   = require('express');
const mongoose  = require('mongoose');
const rscript   = require('./custom_modules/node-run-r');
const async     = require('async');
const fs        = require('fs');
const csv       =require('csvtojson')

// Mongoose internally uses a promise-like object,
// but its better to make Mongoose use built in es6 promises
mongoose.Promise = global.Promise;

// config.js is where we control constants for entire
// app like PORT and DATABASE_URL
const { PORT, DATABASE_URL } = require('./config');
const { Salary } = require('./models/salary')
const { Projection } = require('./models/projection')
const { User } = require('./models/user')

const app = express();
app.use(express.json());
app.use(express.static('public'));

const queue = async.queue;
//====================
//GET endpoints
//====================
app.get("/", (req, res) => {
  //serves landing page
  return res.status(200).sendFile(__dirname + "/public/html/index.html");
});



//====================
//POST endpoints
//====================
app.post("/", (req, res) => {
});

app.post("/send-stats-to-db", (req, res)=>{
  //grab paylod
  let season = req.body.season;
  let week = req.body.week;
  console.log("Season:" + season)
  console.log("Week:" + week)
  //regular season always ends at week 17, and with the way
  //loops work, the end is always 18
  let end = 18;
  let path = `/usr/local/src/data/${season}season-week${week}-projections.csv`
  
  //first check to see if there is one already so we don't duplicate data
  Projection
  .findOne({season: season, week: week})
  .then(result=>{
    //if there isn't one already, then add it
    //after converting csv value
    if (result === null){ //if we can't find an entry
      if (fs.existsSync(path)) { //check to see if there's a scrape, and add it if it exists
        console.log("File exists")
        csv()
        .fromFile(path)
        .then((jsonObj)=>{
          //console.log(jsonObj);
          Projection.insertOne({
            players: jsonObj,
            season,
            week
          });
          return res.status(200).json({msg: "Finished updating DB"})
        })
        .catch(err=>{
          return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
        })
      }
      else { // if there's no entry but also no scrape
        return res.status(200).json({msg: `No scrape for season - ${season}, week - ${week}.`})
      }
    } else { //if there is an entry
      return res.status(200).json({msg: `Data for season - ${season}, week - ${week} already exists`})
    } 
  })
  .catch(err=>{
    return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
  })
})



//====================
//PUT endpoints
//====================
app.put("/", (req, res) => {
});

//====================
//DELETE endpoints
//====================
app.delete("/", (req, res) => {
});


//====================
//Catchall endpoint
//====================
app.get('/*', function (req, res) {
  let message = "Page not found."
  res.status(404).send(message);
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
