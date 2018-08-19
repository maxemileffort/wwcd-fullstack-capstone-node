'use strict';

const express = require('express');
const mongoose = require('mongoose');

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

//====================
//GET endpoints
//====================
app.get("/", (req, res) => {
  //serves landing page
  res.status(200).sendFile(__dirname + "/public/index.html");
});

//====================
//POST endpoints
//====================
app.post("/", (req, res) => {
});

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
