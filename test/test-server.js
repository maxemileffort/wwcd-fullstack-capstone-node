const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const { PORT, 
    DATABASE_URL, } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Create a test user to use in later tests', function(){
    before(function() {
        return runServer(DATABASE_URL, PORT);
    });
    
    after(function() {
        return closeServer();
    });

    it('creates a new user', function() {
        let username = 'test'
        let inputEmail = 'testytesttest@testerville.com'
        let pw = 'test'
        return chai.request(app)
        .post(`/user/create`)
        .send({username, inputEmail, pw})
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res.message).to.equal("Your account has been created!");
        });
    });
})

describe('GET endpoints', function() {
    before(function() {
        return runServer(DATABASE_URL, PORT);
    });
    
    after(function() {
        return closeServer();
    });

    it('checks for duplicate emails', function() {
        let inputEmail = 'testytesttest@testerville.com'
        return chai.request(app)
        .get(`/check-duplicate-email/${inputEmail}`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });
    
    it('checks for projections', function() {
        let season = 2018;
        let week = 3;
        return chai.request(app)
        .get(`/get-projections/${season}/${week}`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });
    
    it('checks for salaries', function() {
        let season = 2018;
        let week = 3;
        return chai.request(app)
        .get(`/get-salaries/${season}/${week}`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });
    
});

describe('POST endpoints', function() {
    before(function() {
        return runServer(DATABASE_URL, PORT);
    });
    
    after(function() {
        return closeServer();
    });
    
    it('logs in an user', function() {
        let email = "testytesttest@testerville.com";
        let pw = "test";
        return chai.request(app)
        .post(`/auth/user/login`)
        .send({email, pw})
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res.message).to.equal("Auth successful");
        });
    });
    
    it('creates a salary entry', function() {
        let season = 2018;
        let week = 3;
        return chai.request(app)
        .post(`/get-salaries/${season}/${week}`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });

    it('creates a projection entry', function() {
        let season = 2018;
        let week = 3;
        return chai.request(app)
        .post(`/get-salaries/${season}/${week}`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });

    it('sends a message', function() {
        let username = 'messageTest';
        let email = 'messageTest@messageTest.com';
        let message = 'messageTest';
        let messageObj = {
            username, 
            email,
            message
        }
        return chai.request(app)
        .post(`/message/send`)
        .send(messageObj)
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res.message).to.equal(`Got the message: "${message}" from User: ${username}`);
        });
    });
    
});

describe('PUT endpoints', function() {
    before(function() {
        return runServer(DATABASE_URL, PORT);
    });
    
    after(function() {
        return closeServer();
    });
    
    it('updates user with submitted object', function() {
        let accountCurrentEmail = 'testytesttest@testerville.com';
        let accountNewEmail = 'testytesttest@tester.com';
        let accountType = 'Pro';
        let accountNewPassword1 = 'newtest';
        let accountNewPassword2 = 'newtest';
        let accountCurrentPassword = 'test';
        let newsletter = true;
        let updateObj = {
            accountCurrentEmail,
            accountNewEmail, 
            accountType, 
            accountNewPassword1, 
            accountNewPassword2, 
            accountCurrentPassword, 
            newsletter
        }
        return chai.request(app)
        .put(`/auth/user/update}`)
        .send(updateObj)
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res.message).to.equal("Update successful");
        });
    });
});

describe('DELETE endpoints', function() {
    before(function() {
        return runServer(DATABASE_URL, PORT);
    });
    
    after(function() {
        return closeServer();
    });
    
    // deletes updated test user
    it('deletes user by email', function() {
        let email = 'testytesttest@tester.com'
        return chai.request(app)
        .delete(`/user/delete/${email}/`)
        .then(function(res) {
            expect(res).to.have.status(200);
        });
    });
});