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
    location: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    postImage:{
        type: String,
    },
    likes: {
        type: Number,
        default: 0,
    },
    shares: {
        type: Number,
        default: 0,
    }
});

module.exports = mongoose.model('Posts', postsSchema);