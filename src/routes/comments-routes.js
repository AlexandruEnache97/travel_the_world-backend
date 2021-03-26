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
                createdDate: Date.now(),
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

    app.get(`${serverConfig.BASE_URL}/postComments/:postId/:pageNumber`, cors(), async (req, res) => {
        try {
            const totalResults = await Comments.countDocuments({});
            if(totalResults <= ((req.params.pageNumber - 1) * 10)) {
                return res.status(404).send('Comments not found');
            }

            const comments = await Comments.find({"postId": req.params.postId})
            .skip((req.params.pageNumber - 1) * 10)
            .limit(10)
            .sort({'createdDate': -1}).exec();

            if(!comments) return res.status(404).send('Comments not found');

            return res.status(200).json({'comments': comments, 'totalResults': totalResults});
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

            const reply = await Comments.findOneAndUpdate({'_id': commentId, 'postId': postId}, {
                $push: {
                "replies": {
                    'textReply': req.body.text,
                    'userId': userId
                }}
            });
            if(reply === null) {
                return res.status(400).send('Comment not found')
            }

            return res.status(200).json({
                success: true,
                msg: "Reply created successfully"
            })
        } catch (error) {
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    });
}