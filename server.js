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
  res.status(200).sendFile(__dirname + "/public/html/index.html");
});

//====================
//POST endpoints
//====================
app.post("/", (req, res) => {
});

app.post("/get-stats", (req, res)=>{
  let season = req.body.season;
  let week = req.body.week;
  const period = {
    season: 2018,
    week: 0
  };
  
  //1) added Rscript to path
  //2) granted write permissions to R folder
  //3) added mirror repo from example startup for R profiles to .Rprofile
    
  async.parallel([
    function(callback) {
      rscript.call('./scripts/script-scrape-QBRBprojections.R', period)
      .then(table1=>{
        callback(null, table1);
      }).catch(err => {
          console.log('err = ', err);
          callback(null, err);
          res.status(500).json(err)
        });
    },
    function(callback) {
      rscript.call('./scripts/script-scrape-WRTEprojections.R', period)
      .then(table2=>{
        callback(null, table2);
      }).catch(err => {
        console.log('err = ', err);
        callback(null, err);
        res.status(500).json(err)
      });
    },
    function(callback) {
      rscript.call('./scripts/script-scrape-KDSTprojections.R', period)
      .then(table3=>{
        callback(null, table3);
      }).catch(err => {
        console.log('err = ', err);
        callback(null, err);
        res.status(500).json(err)
      });
    }
  ],
  // optional callback
  function(err, results) {
    if (err){
      console.log('err = ', err);
      return res.status(500).json(err)
    } else {
      console.log(results);
      return res.status(200).json(results)
    }
  });
  
  
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
