const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Db } = require('mongodb');
const passportLocalMongoose = require('passport-local-mongoose');
const requesterSchema = new mongoose.Schema({
    _id: String,

    country: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: [true, 'Please enter your first name.']
    },
    lastName: {type: String, 
        required: [true, 'Please enter your last name.']
    },  
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)){
                throw new Error('Email format wrong!');
            }
        }
    },
    password: {
        type: String,
        minlength: [8, 'Password at least 8 characters!'],
        required: true,
    },
    address: {
        type: Array,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postCode: {
        type: Number
    },
    mobileNumber: {
        type: Number,
        validate: {
            validator: function(v) {
              return /\d{3}\d{3}\d{3}/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    resetLink: {
        data: String,
        default: ''
    }
},{timestamps: true});
const requesterSchemaSimplified = new mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
});
requesterSchema.pre('save', function(next){
    const self = this;
    if (!self.isModified('password')) return next();
    //create a new salt
    bcrypt.genSalt(5, function(err, salt) {
        if (err) return next(err);
        //combine salt, create hash
        bcrypt.hash(self.password, salt, function(error, hash) {
            if (err) return next(error);
            //cover original password by using hash
            self.password = hash;
            next();
        });
    });
});
requesterSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if(err) 
            return cb(err);
        else{
            if(!isMatch)
                return cb(null, isMatch);
            return cb(null, this);
        }
    });
};
requesterSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName
    };

    return jwt.sign(payload, process.env.JWT_SECERT, {
        expiresIn: parseInt(expirationDate.getTime() / 1000, 10)
    })
}
requesterSchema.methods.generatePasswordReset = function() {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000;
}
module.exports = mongoose.model('requester', requesterSchema);