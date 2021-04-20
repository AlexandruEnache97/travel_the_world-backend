const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postsSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    profileImage: {
        type: String,
        required: true,
    },
    username: {
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
    location: {
        type: String,
        required: true,
    },
    coordinates: { 
        lat: {
            type: Number,
            required: true,
        },
        lng: {
            type: Number,
            required: true,
        },
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
    },
    createdDate: {
        type: Date,
        required: true,
    },
    userLikes: [{
        type: Schema.Types.ObjectId,
        default: []
    }]
});

module.exports = mongoose.model('Posts', postsSchema);