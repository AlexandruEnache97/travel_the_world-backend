const serverConfig = require('../config/config')
const { Comments } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {
    app.use(cors());

    app.put(`${serverConfig.BASE_URL}/createComment`, cors(), auth.validateToken, async (req, res) => {
        try {

            if(!req.body.text || !req.body.postId) {
                return res.status(400).send('Data is not provided correctly');
            }
            const postId = mongoose.Types.ObjectId(req.body.postId);
            const userId = mongoose.Types.ObjectId(req.user);
    
            const comment = new Comments({
                text: req.body.text,
                postId: postId,
                userId: userId,
                likes: [],
                replies: [],
            });

            const doc = await comment.save();

            return res.status(200).json({
                success: true,
                commentId: doc._id,
                msg: 'Comment created'
            });
        } catch (error) {
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    });

    app.put(`${serverConfig.BASE_URL}/createReply`, cors(), auth.validateToken, async (req, res) => {
        try {

            if(!req.body.text || !req.body.postId || !req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }
            const postId = mongoose.Types.ObjectId(req.body.postId);
            const commentId = mongoose.Types.ObjectId(req.body.commentId);
            const userId = mongoose.Types.ObjectId(req.user);

            // const reply = await Posts.findById(postId, {comments: {text: 1}}).where({text: "Comment"});
            const reply = await Comments.findOneAndUpdate({'_id': commentId, 'postId': postId}, {
                $push: {
                "replies": {
                    'textReply': req.body.text,
                    'userId': userId
                }}
            });
            console.log(reply)
            if(reply === null) {
                return res.status(400).send('Comment not found')
            }

            return res.status(200).json({
                success: true,
                msg: "Reply created successfully"
            })
    
            // Posts.findByIdAndUpdate(postId, {
            //     $push: {"comments": {
            //         text: req.body.text,
            //         userId,
            //     }}
            // }, (err, result) => {
            //     if(err) return res.status(404).send('Post not found');
            //     console.log(result)
            //     if(result) return res.status(200).json({
            //         success: true,
            //         msg: "Comment created successfully"
            //     })
            // })
        } catch (error) {
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    });
}