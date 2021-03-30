const serverConfig = require('../config/config')
const { Comments } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {
    app.use(cors());

/**
        /api/createReply
        req.body: 
            text: String
            postId: String

        validateToken:
            user: String

        res:
            success: true
*/
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

/**
        /api/getComments/:commentId/:pageNumber
        req.params: 
            postId: String
            pageNumber: Number

        res:
            id: String
            text: String
            postId: String
            createdDate: Date
            userData: {
                username: String
                profileImage: String
            }
*/ 
    app.get(`${serverConfig.BASE_URL}/getComments/:postId/:pageNumber`, cors(), async (req, res) => {
        try {
            const totalResults = await Comments.countDocuments({"postId": req.params.postId});
            if(totalResults <= ((req.params.pageNumber - 1) * 10)) {
                return res.status(404).send('Comments not found');
            }
            
            Comments.aggregate([
                {$match: {
                    postId: mongoose.Types.ObjectId(req.params.postId)
                }},
                {$lookup: {
                    from: 'accounts',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }},
                {$unwind: '$userData'},
                {$project: {
                    '_id': 1,
                    'text': 1,
                    'postId': 1,
                    'createdDate': 1,
                    'userData': {
                        'username': 1,
                        'profileImage': 1
                    }
                }},
                {$sort: {
                    'createdDate': -1
                }},
                {$skip: (req.params.pageNumber - 1) * 10},
                {$limit: 10}
            ]).exec((err, result) => {
                    if(result) {
                        return res.status(200).json({
                            'results': result,
                            'totalResults': totalResults
                        });
                    }
                    if(err) res.status(404).send('Post not found');
            });
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    });

/**
        /api/deleteComment
        req.body: 
            commentId: String

        res:
            success: true
*/ 
    app.delete(`${serverConfig.BASE_URL}/deleteComment`, cors(), auth.validateToken, async (req, res) => {
        try {
            if(!req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }

            const userId = mongoose.Types.ObjectId(req.user);
            const commentId = mongoose.Types.ObjectId(req.body.commentId);

            const comment = await Comments.findOneAndDelete({
                '_id': commentId,
                'userId': userId
            })

            if(comment) {
                return res.status(200).json({
                    success:true,
                    msg: 'Comment deleted successfully'
                })
            } else {
                return res.status(404).send('Comment not found');
            }
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    })
}