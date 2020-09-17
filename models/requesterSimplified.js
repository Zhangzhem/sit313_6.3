const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const requesterSimplified = new mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
})
requesterSimplified.plugin(passportLocalMongoose);
module.exports = mongoose.model('requesterSimplified', requesterSimplified);