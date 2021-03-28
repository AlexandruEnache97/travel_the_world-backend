const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentsSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    createdDate: {
        type: Date,
        required: true,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        default: []
    }]
});

module.exports = mongoose.model('Comments', commentsSchema);