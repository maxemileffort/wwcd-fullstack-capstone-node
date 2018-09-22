'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const async = require('async');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const router = express.Router();

router.use(bodyParser.json());

const localAuth = passport.authenticate('local', {session: false});
// User attempts to login
router.post('/user/login', localAuth, (req, res) => {

    let email = req.body.email;
    let password = req.body.password;
    
    User.findOne(
        {email: email},
        )
        .then(user=> {
            if (user === null || user === undefined){
                return res.status(200).json({message: "User doesn't exist."});
            }
            //validate password
            console.log('validating password...')
            let hash = user.password;
            bcrypt.compare(password, hash, (err, result)=>{
                if (err) {
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                }
                if (result) {
                    const token = jwt.sign({
                        user: user.serialize()
                    },
                    JWT_SECRET,
                    {
                        expiresIn: JWT_EXPIRY
                    });
                    return res.status(200).json({
                        message: "Auth successful",
                        token: "Bearer "+token,
                        user: user.serialize()
                    });
                }
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Error logging you in." })
        })
});

const jwtAuth = passport.authenticate('jwt', {session: false});

// Update account info
router.put("/user/update", jwtAuth, (req, res) => {
    let accountType = req.body.accountType; 
    let newEmail = req.body.accountNewEmail;
    let currentEmail = req.body.accountCurrentEmail;
    let newPassword1 = req.body.accountNewPassword1;
    let newPassword2 = req.body.accountNewPassword2;
    let currentPassword = req.body.accountCurrentPassword;
    let newsletter = req.body.newsletter;
    console.log(req.body)
    let updateObj = {};
    let _user;
    async.series([
        function(callback) {
            User.findOne(
                {email: currentEmail}
            )
            .then(user=>{
                console.log(user)
                if (user === null || user === undefined){
                    return res.status(200).json({message: "User doesn't exist."});
                }
                //validate password
                let hash = user.password;
                bcrypt.compare(currentPassword, hash, (err, result)=>{
                    if (err) { // passwords don't match
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                    }
                    if (result) { // passwords do match
                        //extract user info to outer function scope
                        _user = user
                        callback(null, _user);
                        console.log("user pre-update")
                        console.log(_user)
                    }
                })
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ message: "Error updating your account." })
            })
        },
        function(callback) {
            // Construct update object
            // update account type
            if(_user.accountType !== accountType){ // this is always submitted, so it needs to check against stored value
                console.log("Changing account type to " + accountType)
                updateObj.assign(updateObj, {accountType})
            }
            // update email
            if(newEmail){ // this is an optional value, so just need to see if exists
                console.log("Changing email to " + newEmail)
                Object.assign(updateObj, {email: newEmail})
            }
            // update password
            if (newPassword1 && newPassword2 && newPassword1 === newPassword2){
                console.log("Changing password...")
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
                    bcrypt.hash(newPassword1, salt, (err, hash) => {
                        //if creating the ncrypted pasword returns an error..
                        if (err) {
                            //display it
                            return res.status(500).json({
                                message: "Couldn't create hash."
                            });
                        }
                        Object.assign(updateObj, {password: hash})
                    });
                });
            }
            // update newsletter status
            if (_user.newsletter !== newsletter){
                console.log("Changing newsletter mailing status to " + newsletter)
                Object.assign(updateObj, {newsletter})
            }
    
            console.log(updateObj)
            callback(null, updateObj);
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
                console.log("User post-update")
                console.log(user)
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
        console.log(results)
    });
});

// Delete account
router.delete("/user/delete/:email/", jwtAuth, (req, res)=>{
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
