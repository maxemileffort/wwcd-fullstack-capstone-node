'use strict';
const express       = require('express');
const passport      = require('passport');
const bodyParser    = require('body-parser');
const async         = require('async');
const bcrypt 		= require('bcryptjs');
const jwt 			= require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const { User }      = require('../models/user');

const router = express.Router();

router.use(bodyParser.json());

const jwtAuth = passport.authenticate('jwt', {session: false});

// this endpoint is here to move some code out of server.js
// to make it a little easier to sift through
router.post("/user/login/", (req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    
    User.findOne({ 
        email 
    })
   .then(user=> {
    	if (user === null || user === undefined){
            return res.status(200).json({message: "User doesn't exist."});
        }
        //validate password
        console.log('validating password...');
        let hash = user.password;
        bcrypt.compare(password, hash)
        .then(result=>{
            if (!result){
                console.log('Passwords did not match')
                return res.status(401).json({
                    message: "Auth failed"
                });
            } else {
				console.log("Passwords match, signing token...")
                const token = jwt.sign({
                    email: user.email,
                    username: user.username,
                    accountType: user.accountType
                },
                JWT_SECRET,
                {
                    expiresIn: JWT_EXPIRY
                });
                return res.status(200).json({
                    message: "Auth successful",
                    token: "Bearer "+token,
                    user: user
                });
            }
        })
        .catch(err=>{
            console.log(err)
            return res.status(401).json({
                message: "Auth failed"
            });
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Error logging you in." })
    })
})


// Update account info
router.put("/user/update", jwtAuth, (req, res) => {
    let currentEmail = req.body.accountCurrentEmail;
    let accountType = req.body.accountType; 
    let newEmail = req.body.accountNewEmail;
    let newPassword1 = req.body.accountNewPassword1;
    let newPassword2 = req.body.accountNewPassword2;
    let currentPassword = req.body.accountCurrentPassword;
    let newsletter = req.body.newsletter;
    console.log(req.headers)
    let updateObj = {
        newsletter,
        accountType
    };
    if (newEmail){
        updateObj.email = newEmail;
    }
    if (newPassword1 && newPassword2 && newPassword1 === newPassword2){
        updateObj.password = bcrypt.hashSync(newPassword1, 10);
    }
	// console.log(updateObj)
    let _user;
    async.series([
        function(callback) {
            User.findOne(
                {email: currentEmail}
            )
            .then(user=>{
                if (user === null || user === undefined){
                    return res.status(200).json({message: "User doesn't exist."});
                }
                //validate password
                console.log('validating password...');
                let hash = user.password;
                bcrypt.compare(currentPassword, hash)
                .then(result=>{
                    if (!result){
                        console.log('Passwords did not match')
                        return res.status(401).json({
                            message: "Auth failed"
                        });
                    } 
                    else {
                        console.log("Passwords match, beginning update...")
                        _user = user
                        callback(null, _user)
                    }
                })
                .catch(err=>{
                    console.log(err)
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                })
            })	
        },
        function(callback) {
            User.update(
                {email: currentEmail},
                updateObj,
                {
                    returnNewDocument: true
                }
            )
            .then(user=> {
                res.status(200).json({
                    message: "Update successful",
                    user: user
                });
                // console.log("User post-update")
                // console.log(user)
                callback(null, user);
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ message: "Error updating your account." })
            })
        }
    ],
    // optional callback
    function(err, results) {
        if(err){
            console.log(err)
            res.status(500).json({ message: "Error updating your account." })
        }
        // console.log(results)
    });
});

// Delete account
router.delete("/user/delete/:email/", jwtAuth, (req, res)=>{
    console.log(req.headers)
    let email = req.params.email
    //find and remove user
    User.findOneAndRemove({
        email
    })
    .then(user => {
        // console.log(user);
        res.status(200).json({ message: `Sorry to see you go, ${user.username}.` })
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({message: `Something went wrong trying to remove user. Error: ${err}`})
    })
});

module.exports = {router};
