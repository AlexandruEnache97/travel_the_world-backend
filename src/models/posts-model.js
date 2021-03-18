const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    postImage: String
});

module.exports = mongoose.model('Posts', postsSchema);