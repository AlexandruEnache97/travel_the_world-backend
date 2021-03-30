const serverConfig = require('../config/config')
const { Replies } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {
    app.use(cors());

    app.put(`${serverConfig.BASE_URL}/createReply`, cors(), auth.validateToken, async (req, res) => {
        try {

            if(!req.body.text || !req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }
            const commentId = mongoose.Types.ObjectId(req.body.commentId);
            const userId = mongoose.Types.ObjectId(req.user);

            const reply = new Replies({
                text: req.body.text,
                commentId: commentId,
                userId: userId,
                createdDate: Date.now(),
                likes: [],
            });

            const doc = await reply.save();

            return res.status(200).json({
                success: true,
                replyId: doc._id,
                msg: 'Reply created successfully'
            });
        } catch (error) {
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    });
}