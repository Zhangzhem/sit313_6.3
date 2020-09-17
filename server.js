const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const https = require('https');
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox68a6792d7ac84a289d0371a1f965b0a4.mailgun.org";
const mg = mailgun({apiKey: "ef9415d727697bb5ee5824bb6d0a9061-d5e69b0b-9e9dc61e", domain: DOMAIN});

//mongo database
const mongoose = require('mongoose');

//load bcrypt module
const bcrypt = require('bcrypt');
const validator = require('validator');
mongoose.connect('mongodb://localhost:27017/iCrowdTaskDB', {useNewUrlParser: true});

//passport
const passport = require('passport');
const session = require('express-session');
const Requester = require('./models/requester.js');
const RequesterSimplified = require('./models/requesterSimplified.js');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(session({
    cookie: {maxAge: 120000},
    resave: false,
    saveUninitialized: false,
    secret: 'iCrowdTaskSecret'
}))
app.use(passport.initialize());
app.use(passport.session());

const port = 8080;
const base = `${__dirname}/public`;

passport.use(RequesterSimplified.createStrategy());
passport.serializeUser(RequesterSimplified.serializeUser());
passport.deserializeUser(RequesterSimplified.deserializeUser());

//app.get
app.get('/', (req, res) => {
    res.sendFile(`${base}/index.html`);
});
app.get('/signup', (req, res) => {
    res.sendFile(`${base}/register.html`)
});
app.get('/reset', (req, res) => {
    res.sendFile(`${base}/forgot.html`)
});
app.get('/success', (req, res) => {
    if(req.isAuthenticated()){
        res.send({
            
        })
    } else {
        res.redirect('/');
    }
})
//put
app.post('/forgot-password', async(req, res) => {
    const mEmail = req.body.inputEmail;

    try{
        const requester = await Requester.findOne({email: mEmail});
        if(!requester) {
            return res.status(400).send({
                massage: 'email does not exist.'
            });
        }
        nodemailer.createTestAccount((err, account) => {
            if(err) {
                console.log(err);
            } 
            const transportor = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: account.user,
                    pass: account.pass,
                }
            });

            const message = {
                from: '<sender@example.com>',
                to: 'zhangzhem@deakin.edu.au',
                subject: 'none',
                text: 'test',
                html: ``
            };

            let info = transportor.sendMail({
                from: '"Fred Foo 👻" <foo@example.com>', // sender address
                to: "bar@example.com, baz@example.com", // list of receivers
                subject: "Hello ✔", // Subject line
                text: "Hello world?", // plain text body
                html: "<b>Hello world?</b>", // html body            
            })
        });

        /*
        const token = jwt.sign({_id: requester._id}, 'resetpasswordkey', {expiresIn: '20m'});
        const data = {
            from: 'zhangzhem@deakin.edu.au',
            to: email,
            subject: 'Reset password link',
            html: `
            <h1>Please click the link</h1>
            <p>${process.env.CLIENT_URL}/reset/${token}</p>
            `
        };
        return Requester.updateOne({resetLink: token}, (err, success) => {
            if(err) {
                return res.send({
                    message: 'Reset password link error'
                })
            } else {
                mg.message().send(data, function(error, body) {
                    if(error) {
                        return res.send({
                            message: 'mg error'
                        })
                    }
                    return res.send({
                        message: 'Email has been sent'
                    })
                })
            }
        })
        */
    } catch (error) {

    }
})
//sign up
app.post('/signup', (req, res) => {
    res.redirect('/signup');
})
app.post('/forgot', (req, res) => {
    res.redirect('/reset');
})
app.post('/login', async(req, res) => {
    const mEmail = req.body.inputEmail;
    const password = req.body.inputPassword;
    const check = req.body.inputCheckbox;

    try{
        const requester = await Requester.findOne({email: mEmail});
        if(!requester) {
            return res.status(400).send({
                massage: 'email does not exist.'
            });
        }
        if(!bcrypt.compareSync(password, requester.password)){
            return res.status(400).send({
                message: 'password wrong.'
            });
        }
        res.send({
            message: 'login successfully.'
        })
        if(check){
            RequesterSimplified.register({username: mEmail}, password, (err, requester) => {
                if(err) {
                    console.log(err);
                } else {
                    passport.authenticate('localhost:8080')(req, res, () => {
                        console.log('authenticated successfully.')
                    });
                }
            })
        }
    }catch(error){
        res.status(500).send({
            message: 'wrong.'
        });
    }

});
app.post('/create_account', async(req, res) => {
    var mCountry = req.body.country;
    var first_name = req.body.firstName;
    var last_name = req.body.lastName;
    var mEmail = req.body.email;
    var mPassword = req.body.password;
    var mCPassword = req.body.cPassword;
    var mAddress = req.body.address;
    var mCity = req.body.city;
    var mState = req.body.state;
    var mPostCode = req.body.postCode;
    var mMobileNumber = req.body.mobileNumber;

    var id = '';
    for (var i = 0; i < 5 ; i++){
        id += Math.floor(Math.random() * 16).toString(16);
    }
    if (mPassword != mCPassword){
        throw new Error('Password wrong!');
    }
    if (!validator.isEmail(mEmail)){
        throw new Error('Email wrong!');
    }

    const mRequester = await Requester.create ({
        _id: id,
        country: mCountry,
        firstName: first_name,
        lastName: last_name,
        email: mEmail,
        password: mPassword,
        address: mAddress,
        city: mCity,
        state: mState,
        postCode: mPostCode,
        mobileNumber: mMobileNumber
    });

    mRequester.save((err) => {
        if (err){
            console.log(err);
        } else {
            console.log('Inserted successfully');
        }
    });
});
app.listen(port, () =>{
    console.log(`Listening on port ${port}`);
});