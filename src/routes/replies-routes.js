const serverConfig = require('../config/config')
const { Replies } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {
    app.use(cors());

/**
        /api/createReply
        req.body: 
            text: String
            commentId: String

        validateToken:
            user: String

        res:
            success: true
*/  
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

/**
        /api/getReplies/:commentId/:pageNumber
        req.params: 
            commentId: String
            pageNumber: Number

        res:
            id: String
            text: String
            commentId: String
            createdDate: Date
            userData: {
                username: String
                profileImage: String
            }
*/ 
    app.get(`${serverConfig.BASE_URL}/getReplies/:commentId/:pageNumber`, cors(), async (req, res) => {
        try {
            const totalResults = await Replies.countDocuments({"commentId": req.params.commentId});
            if(totalResults <= ((req.params.pageNumber - 1) * 10)) {
                return res.status(404).send('Replies not found');
            }

            Replies.aggregate([
                {$match: {
                    commentId: mongoose.Types.ObjectId(req.params.commentId),
                }},
                {$lookup: {
                    from: 'accounts',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData',
                }},
                {$unwind: '$userData'},
                {$project: {
                    '_id': 1,
                    'text': 1,
                    'commentId': 1,
                    'nrOfLikes': 1,
                    'createdDate': 1,
                    'userData': {
                        'username': 1,
                        'profileImage': 1,
                    }
                }},
                {$sort: {
                    'createdDate': -1,
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
                if(err) res.status(404).send('Comment not found');
            })
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    });

/**
        /api/likeReply
        req.body: 
            replyId: String

        validateToken:
            user: String

        res:
            success: true
*/
app.put(`${serverConfig.BASE_URL}/likeReply`, cors(), auth.validateToken, async (req, res) => {
    try {
        if(!req.body.replyId) {
            return res.status(400).send('Data is not provided correctly');
        }

        const userId = mongoose.Types.ObjectId(req.user);
        const replyId = mongoose.Types.ObjectId(req.body.replyId);

        Replies.findByIdAndUpdate(replyId, {
            $push: {"likes": userId}, 
            $inc: {"nrOfLikes": 1}
        }, (err, result) => {
            if(err) return res.status(404).send('Reply not found');
            if(result) return res.status(200).json({
                success: true,
                msg: "Reply liked successfully"
            });
        })
    } catch (error) {
        res.status(500).send('Something went wrong!');
    }
})

/**
        /api/unlikeReply
        req.body: 
            replyId: String

        validateToken:
            user: String

        res:
            success: true
*/
app.put(`${serverConfig.BASE_URL}/unlikeReply`, cors(), auth.validateToken, async (req, res) => {
    try {
        if(!req.body.replyId) {
            return res.status(400).send('Data is not provided correctly');
        }

        const userId = mongoose.Types.ObjectId(req.user);
        const replyId = mongoose.Types.ObjectId(req.body.replyId);

        Replies.findByIdAndUpdate(replyId, {
            $pull: {"likes": userId}, 
            $inc: {"nrOfLikes": -1}
        }, (err, result) => {
            if(err) return res.status(404).send('Reply not found');
            if(result) return res.status(200).json({
                success: true,
                msg: "Reply unlike successfully"
            });
        })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong!');
    }
})

/**
        /api/replyLikes/:postId/:pageNumber
        req.params: 
            replyId: String
            pageNumber: Number

        res:
            userLikes: Array({profileImage, username}), limit 10
*/  
app.get(`${serverConfig.BASE_URL}/replyLikes/:replyId/:pageNumber`, cors(), async (req, res) => {
    try {
        Replies.aggregate([
            {$match: {
                _id: mongoose.Types.ObjectId(req.params.replyId)
            }},
            {$lookup: {
                from: "accounts",
                localField: "likes",
                foreignField: "_id",
                as: 'userLikes'
            }},
            {$project: {
                '_id': 0,
                'likes': 1,
                'userLikes' : {
                    $slice: ['$userLikes', (req.params.pageNumber - 1) * 10, 10],
                },
            }},
            {$project: {
                'userLikes': {
                    'username': 1,
                    'profileImage': 1
                }
            }}
        ]).exec((err, result) => {
            if(result) {
                res.status(200).json(result[0]);
            }
            if(err) {
                console.log(err)
                res.status(404).send('Comment likes not found');
            }
        });
    
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong!');
    }
})

/**
        /api/likedReplies/:pageNumber
        req.params: 
            pageNumber: Number
            commentId: String

        validateToken:
            user: String

        res:
            likedReplies: Array(post)
*/   
app.get(`${serverConfig.BASE_URL}/likedReplies/:commentId/:pageNumber`, cors(), auth.validateToken, async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        let likes = [];

        await Replies.find({
            commentId: mongoose.Types.ObjectId(req.params.commentId)}, 
            {likes: 1})
        .limit(10)
        .skip((pageNumber - 1) * 10)
        .sort({'createdDate': -1}).exec((err, results) => {
            if(results) {
                results.map((result) => {
                    if(result.likes[0] !== undefined) {
                        result.likes.map((item) => {
                            if(item == req.user) {
                                likes.push(result._id);
                            }
                        })
                    }
                });
                return res.status(200).json({'likedReplies': likes});
            }
            if(err) {
                return res.status(404).send("Comment not found")
            }
        });
    } catch (error) {
        return res.status(500).send('Something went wrong!');
    }
})
}