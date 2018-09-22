'use strict';

const express       = require('express');
const mongoose      = require('mongoose');
const fs            = require('fs');
const morgan        = require('morgan');
const csv           = require('csvtojson');
const bcrypt        = require('bcrypt');
const multer        = require('multer');
const async         = require('async');
const passport      = require('passport');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRY } = require('./config');
const { Salary } = require('./models/salary');
const { Projection } = require('./models/projection');
const { User } = require('./models/user');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

const app = express();

// Logging
app.use(morgan('common'));

// router for protected endpoints
app.use('/auth/', authRouter);

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
    next();
});

// for uploading csv files
const upload = multer();

app.use(express.json());
app.use(express.static('public'));

//====================
//GET endpoints
//====================
//check for emails to make sure accounts don't duplicate
app.get('/check-duplicate-email/:inputEmail', (req, res)=>{
    let inputEmail = req.params.inputEmail;
    console.log(inputEmail);
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
app.get("/get-projections/:season/:week", (req, res)=>{
    let projectionSeason = req.params.season;
    let projectionWeek = req.params.week;
    Projection.findOne({
        season: projectionSeason,
        week: projectionWeek
    })
    .then(obj=>{
        if (obj){
            // console.log(obj.players.filter(item=>{return item.position === 'QB'}))
            return res.status(200).json(obj.players)
        } else {
            return res.status(200).json({msg: "Projections don't exist for that week yet."})
        }
    })
    .catch(err=>{
        return res.status(500).json({msg: 'Something went wrong retrieving player stats.', err})
    })
});

//get salaries for lineups
app.get("/get-salaries/:season/:week", (req, res)=>{
    let salarySeason = req.params.season;
    let salaryWeek = req.params.week;
    Salary.findOne({
        season: salarySeason,
        week: salaryWeek
    })
    .then(obj=>{
        if (obj){
            console.log(obj)
            return res.status(200).json(obj.salaries)
        } else {
            return res.status(200).json({msg: "Salaries don't exist for that week yet."})
        }
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
    
    Salary
    .findOne({season: season, week: week})
    .then(result=>{
        if (result === null){ // if there isn't already an entry in the db
        Salary.create({
            salaries: processedArray,
            season: season,
            week: week
        }, 
        (err, result)=>{
            if(err){
                console.log(err)
                return res.status(500).json({err})
            } else if (result){
                return res.status(201).json({msg: "Added new salary entry."})
            }
        })
    } else { // means that we found an entry matching season and week already
        return res.status(200).json({msg: "Salary data exists for that period already."})
    }
})
.catch(err=>{
    return res.status(500).json({err, msg: 'Something went wrong searching player salaries.'})
})
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
                    return res.status(201).json({user});
                }
            });
        });
    });
});

// login user
// app.post("/user/login", (req, res) => {
//     let email = req.body.email;
//     let password = req.body.password;
    
//     User.findOne(
//         {email: email},
//         )
//         .then(user=> {
//             if (user === null || user === undefined){
//                 return res.status(200).json({message: "User doesn't exist."});
//             }
//             //validate password
//             console.log('validating password...')
//             let hash = user.password;
//             bcrypt.compare(password, hash, (err, result)=>{
//                 if (err) {
//                     return res.status(401).json({
//                         message: "Auth failed"
//                     });
//                 }
//                 if (result) {
//                     const token = jwt.sign({
//                         email: user.email,
//                         username: user.username,
//                         accountType: user.accountType
//                     },
//                     JWT_SECRET,
//                     {
//                         expiresIn: JWT_EXPIRY
//                     });
//                     return res.status(200).json({
//                         message: "Auth successful",
//                         token: token,
//                         user: user
//                     });
//                 }
//             })
//         })
//         .catch(err => {
//             console.log(err);
//             res.status(500).json({ message: "Error logging you in." })
//         })
// });
    
// create lineup
// add as a feature later
// app.post("/lineup/create", (req, res) => {
//   res.status(200)
// }); 

//====================
//PUT endpoints
//====================
// update account info
// app.put("/user/update", (req, res) => {
//     let accountType = req.body.accountType; 
//     let newEmail = req.body.accountNewEmail;
//     let currentEmail = req.body.accountCurrentEmail;
//     let newPassword1 = req.body.accountNewPassword1;
//     let newPassword2 = req.body.accountNewPassword2;
//     let currentPassword = req.body.accountCurrentPassword;
//     let newsletter = req.body.newsletter;
//     console.log(req.body)
//     let updateObj = {};
//     let _user;
//     async.series([
//         function(callback) {
//             User.findOne(
//                 {email: currentEmail}
//             )
//             .then(user=>{
//                 console.log(user)
//                 if (user === null || user === undefined){
//                     return res.status(200).json({message: "User doesn't exist."});
//                 }
//                 //validate password
//                 let hash = user.password;
//                 bcrypt.compare(currentPassword, hash, (err, result)=>{
//                     if (err) { // passwords don't match
//                     return res.status(401).json({
//                         message: "Auth failed"
//                     });
//                     }
//                     if (result) { // passwords do match
//                         //extract user info to outer function scope
//                         _user = user
//                         callback(null, _user);
//                         console.log("user pre-update")
//                         console.log(_user)
//                     }
//                 })
//             })
//             .catch(err => {
//                 console.log(err);
//                 res.status(500).json({ message: "Error updating your account." })
//             })
//         },
//         function(callback) {
//             // Construct update object
//             // update account type
//             if(_user.accountType !== accountType){ // this is always submitted, so it needs to check against stored value
//                 console.log("Changing account type to " + accountType)
//                 updateObj.assign(updateObj, {accountType})
//             }
//             // update email
//             if(newEmail){ // this is an optional value, so just need to see if exists
//                 console.log("Changing email to " + newEmail)
//                 Object.assign(updateObj, {email: newEmail})
//             }
//             // update password
//             if (newPassword1 && newPassword2 && newPassword1 === newPassword2){
//                 console.log("Changing password...")
//                 //create an encryption key
//                 bcrypt.genSalt(10, (err, salt) => {
//                     //if creating the key returns an error...
//                     if (err) {
//                         //display it
//                         return res.status(500).json({
//                             message: "Couldn't create salt."
//                         });
//                     }
//                     //using the encryption key above generate an encrypted pasword
//                     bcrypt.hash(newPassword1, salt, (err, hash) => {
//                         //if creating the ncrypted pasword returns an error..
//                         if (err) {
//                             //display it
//                             return res.status(500).json({
//                                 message: "Couldn't create hash."
//                             });
//                         }
//                         Object.assign(updateObj, {password: hash})
//                     });
//                 });
//             }
//             // update newsletter status
//             if (_user.newsletter !== newsletter){
//                 console.log("Changing newsletter mailing status to " + newsletter)
//                 Object.assign(updateObj, {newsletter})
//             }
    
//             console.log(updateObj)
//             callback(null, updateObj);
//         },
//         function(callback) {
//             User.update(
//                 {email: currentEmail},
//                 updateObj,
//                 {
//                     returnNewDocument: true
//                 }
//             )
//             .then(user=> {
//                 res.status(200).json({
//                     message: "Update successful",
//                     user: user
//                 });
//                 console.log("User post-update")
//                 console.log(user)
//                 callback(null, user);
//             })
//             .catch(err => {
//                 console.log(err);
//                 res.status(500).json({ message: "Error updating your account." })
//             })
//         }
//     ],
//     // optional callback
//     function(err, results) {
//         if(err){
//             console.log(err)
//             res.status(500).json({ message: "Error updating your account." })
//         }
//         console.log(results)
//     });
// });

// change lineups
// add as a feature later
// app.put("/lineup/update", (req, res) => {
//   res.status(200)
// });

//====================
//DELETE endpoints
//====================
//delete account
// app.delete("/user/delete/:email/", (req, res)=>{
//     let email = req.params.email
//     //find and remove user
//     User.findOneAndRemove({
//         email
//     })
//     .then(user => {
//         // console.log(user);
//         res.status(200).json({ message: `Sorry to see you go, ${user.username}.` })
//     })
//     .catch(err=>{
//         console.log(err);
//         res.status(500).json({message: `Something went wrong trying to remove user. Error: ${err}`})
//     })
// });


//delete lineup
// add as a feature later
// app.delete("/lineup/delete", (req, res) => {
//   res.status(200)
// });
    
    
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

