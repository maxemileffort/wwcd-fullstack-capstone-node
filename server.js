'use strict';

const express   = require('express');
const mongoose  = require('mongoose');
const fs        = require('fs');
const csv       = require('csvtojson');
const Excel     = require('exceljs');
const bcrypt    = require('bcrypt');
const multer    = require('multer');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Salary } = require('./models/salary');
const { Projection } = require('./models/projection');
const { User } = require('./models/user');

const app = express();
const upload = multer();
app.use(express.json());
app.use(express.static('public'));

//====================
//GET endpoints
//====================
//serves landing page
app.get("/", (req, res) => {
  return res.status(200).sendFile(__dirname + "/public/html/index.html");
});

//check for emails to make sure accounts don't duplicate
app.get('/check-duplicate-email/:inputEmail', (req, res)=>{
  let inputEmail = req.params.inputEmail;
  // console.log(inputEmail);
  User
  .find({
    email: inputEmail
  })
  .then(function (entries) {
    res.status(200).json({
      entries
    });
  })
  .catch(function (err) {
    console.error(err);
    res.status(500).json({
      message: 'Unable to check for duplicate emails.'
    });
  });
})

//get projections for lineups
app.get("/get-projections", (req, res)=>{
  let season = req.body.season;
  let week = req.body.week;
  Projection.findOne(
    season,
    week
  )
  .then(projections=>{
    return res.status(200).json({projections})
  })
  .catch(err=>{
    return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
  })
});

//get salaries for lineups
app.get("/get-salaries", (req, res)=>{
  let season = req.body.season;
  let week = req.body.week;
  Salary.findOne(
    season,
    week
  )
  .then(salaries=>{
    return res.status(200).json({salaries})
  })
  .catch(err=>{
    return res.status(500).json({msg: 'Something went wrong retrieving player salaries.', err})
  })
  
});


//====================
//POST endpoints
//====================
// needed to abstract season and week away from salaries endpoint
// in order to process data type from ajax call differently
let season, week;

// area where admin updates projections every week
app.post("/send-stats-to-db/", (req, res)=>{
  //grab paylod
  season = req.body.season;
  week = req.body.week;
  console.log("Projections:")
  console.log("   Season:" + season)
  console.log("   Week:" + week)
  //regular season always ends at week 17, and with the way
  //loops work, the end variable is always 18
  // let end = 18; currently not implemented, 
  // but will be in the future as part of automating this update process
  let path = `/usr/local/src/data/${season}season-week${week}-projections.csv`
  
  //first check to see if there is an entry already so we don't duplicate data
  Projection
  .findOne({season: season, week: week})
  .then(result=>{
    //if there isn't one already, then add it
    //after converting csv to json
    if (result === null){ //if we can't find an entry
    if (fs.existsSync(path)) { //check to see if there's a scrape, and add it if it exists
    console.log("File exists")
    csv()
    .fromFile(path)
    .then((json)=>{
      //console.log(jsonObj);
      Projection.create({
        players: json,
        season,
        week
      }, (err)=>{
        if(err){
          console.log(err)
          return res.status(500).json({err})
        }
      });
      return res.status(200).json({msg: "Finished updating projectiosn in DB"})
    })
    .catch(err=>{
      return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
    })
  }
  else { // if there's no entry but also no scrape
  return res.status(200).json({msg: `No scrape for season - ${season}, week - ${week}.`})
}
} else { //if there is already an entry
  return res.status(200).json({msg: `Data for season - ${season}, week - ${week} already exists`})
} 
})
.catch(err=>{
  return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
})
})

// area where admin updates salaries every week
app.post("/send-salaries-to-db/", upload.single('salaries'), async (req, res)=>{
  const csvFile = req.file.buffer.toString();
  const rows = csvFile.split('\n');
  let data = [];
  console.log("here")
  for (let row of rows) {
    const columns = row.replace(/"\r/g, '').split(',');
    //console.log(columns);
    data.push(columns)
  }
  let keys = data[0]; // array of strings, where each string is a key
  let allPlayers = data.splice(1); // array of arrays, where each nested array represents a player
  let combinedArray = []; // array that holds items prior to being reduced to processedArray
  let item = [] //intermediary array to correctly structure data
  let processedArray = [] // cleaned and structured array of objects
  for (let i=0; i<allPlayers.length; i++){
    let player = allPlayers[i];
    for(let j=0; j<player.length; j++){
      item = []
      item.push(keys[j], player[j])
      combinedArray.push(item)
    }
    item = combinedArray.reduce(function(prev,curr){prev[curr[0]]=curr[1];return prev;},{})
    processedArray.push(item);
  }
  
  console.log(180);
  Salary
  .findOne({season: season, week: week})
  .then(result=>{
    console.log(184);
    if (result === null){ // if there isn't already an entry in the db
    console.log(186);
    Salary.create({
      salaries: processedArray,
      season: season,
      week: week
    }, 
    (err)=>{
      console.log(192);
      if(err){
        console.log(195);
        console.log(err)
        return res.status(500).json({err})
      }
    })
  } else {
    console.log(204);
    return false // means that we found an entry matching season and week already
  }
})
.catch(err=>{
  console.log(201);
  return res.status(500).json({err, msg: 'Something went wrong searching player salaries.'})
})

return res.status(200).json({msg: "Finished updating salaries in DB"}) // on success

})

// add user
app.post("/user/create/", (req, res) => {
  //take the paylod from the ajax api call
  let username = req.body.username || "";
  let email = req.body.email || "";
  let password = req.body.password || "";
  
  //exclude extra spaces from the payload
  username = username.trim();
  email = email.trim();
  password = password.trim();
  
  //create an encryption key
  bcrypt.genSalt(10, (err, salt) => {
    
    //if creating the key returns an error...
    if (err) {
      
      //display it
      return res.status(500).json({
        message: "Couldn't create salt."
      });
    }
    
    //using the encryption key above generate an encrypted pasword
    bcrypt.hash(password, salt, (err, hash) => {
      
      //if creating the ncrypted pasword returns an error..
      if (err) {
        
        //display it
        return res.status(500).json({
          message: "Couldn't create hash."
        });
      }
      
      //using the mongoose DB schema, connect to the database and create the new user
      User.create({
        username,
        email,
        password: hash,
      }, (err, user) => {
        
        //if creating a new user in the DB returns an error..
        if (err) {
          //display it
          return res.status(500).json({
            message: "Couldn't create user."
          });
        }
        //if creating a new user in the DB is succefull
        if (user) {
          
          //display the new user
          console.log(`User \`${email}\` created.`);
          return res.status(201).json(user);
        }
      });
    });
  });
});

// login user
app.post("/user/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let role;
  
  User.findOne(
    {email: email},
  )
  .then(user=> {
    if (user === null){
      return res.status(200).json({message: "User doesn't exist."});
    }
    //validate password
    let hash = user.password;
    bcrypt.compare(password, hash, (err, result)=>{
      if (result){
        res.status(200).json(user);
      } else {
        //if validation fails
        console.log(err)
        res.status(500).json({message: "Please check email and password and try again."})
      }
    })
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ message: "Please ask instructor for assistance." })
  })
});

// create lineup
app.post("/lineup/create", (req, res) => {
});

//====================
//PUT endpoints
//====================
// change account status
app.put("/user/update", (req, res) => {
  let newType = req.body.newType
  User.findOneAndUpdate({
    email: studentEmail
  }, {
    $set: {accountType: newType},
  }).then(user => {
    return res.status(200).json(user);
  }).catch(err => {
    console.log(err);
  })
});

// change lineups
app.put("/lineup/update", (req, res) => {
});

//====================
//DELETE endpoints
//====================
//delete account
app.delete("/user-delete/:email/", (req, res)=>{
  let email = req.params.email
  //find and remove user
  User.findOneAndRemove({
    email: email
  })
  .then(user => {
    // console.log(user);
    res.status(200).json({ message: `Sorry to see you go, ${user}.` })
  })
  .catch(err=>{
    console.log(err);
    res.status(500).json({message: `Something went wrong trying to remove user. Error: ${err}`})
  })
});

//delete lineup
app.delete("/lineup/delete", (req, res) => {
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
