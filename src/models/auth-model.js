const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    profileImage: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    password: String,
    country: String
});

module.exports = mongoose.model('Account', accountSchema);