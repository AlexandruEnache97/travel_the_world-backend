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
                    'nrOfLikes': 1,
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

/**
        /api/editComment
        req.body: 
            commentId: String
            text: String

        res:
            success: true
*/ 
    app.put(`${serverConfig.BASE_URL}/editComment`, cors(), auth.validateToken, async (req, res) => {
        try {
            if(!req.body.text || !req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }

            const userId = mongoose.Types.ObjectId(req.user);
            const commentId = mongoose.Types.ObjectId(req.body.commentId);

            const comment = await Comments.findOneAndUpdate({
                '_id': commentId,
                'userId': userId
            }, {
                text: req.body.text
            });

            if(comment) {
                return res.status(200).json({
                    success: true,
                    msg: 'Comment edited successfully!'
                })
            } else {
                return res.status(404).send('Comment not found');
            }
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    });

/**
        /api/likeComment
        req.body: 
            commentId: String

        validateToken:
            user: String

        res:
            success: true
*/
    app.put(`${serverConfig.BASE_URL}/likeComment`, cors(), auth.validateToken, async (req, res) => {
        try {
            if(!req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }
    
            const userId = mongoose.Types.ObjectId(req.user);
            const commentId = mongoose.Types.ObjectId(req.body.commentId);
    
            Comments.findByIdAndUpdate(commentId, {
                $push: {"likes": userId}, 
                $inc: {"nrOfLikes": 1}
            }, (err, result) => {
                if(err) return res.status(404).send('Comment not found');
                if(result) return res.status(200).json({
                    success: true,
                    msg: "Comment liked successfully"
                });
            })
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })
    
/**
        /api/unlikeComment
        req.body: 
            commentId: String

        validateToken:
            user: String

        res:
            success: true
*/
    app.put(`${serverConfig.BASE_URL}/unlikeComment`, cors(), auth.validateToken, async (req, res) => {
        try {
            if(!req.body.commentId) {
                return res.status(400).send('Data is not provided correctly');
            }

            const userId = mongoose.Types.ObjectId(req.user);
            const commentId = mongoose.Types.ObjectId(req.body.commentId);

            Comments.findByIdAndUpdate(commentId, {
                $pull: {"likes": userId}, 
                $inc: {"nrOfLikes": -1}
            }, (err, result) => {
                if(err) return res.status(404).send('Comment not found');
                if(result) return res.status(200).json({
                    success: true,
                    msg: "Comment unlike successfully"
                });
            })
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })

/**
        /api/commentLikes/:postId/:pageNumber
        req.params: 
            commentId: String
            pageNumber: Number

        res:
            userLikes: Array({profileImage, username}), limit 10
*/  
app.get(`${serverConfig.BASE_URL}/commentLikes/:commentId/:pageNumber`, cors(), async (req, res) => {
    try {
        Comments.aggregate([
            {$match: {
                _id: mongoose.Types.ObjectId(req.params.commentId)
            }},
            {$lookup: {
                from: "accounts",
                localField: "likes",
                foreignField: "_id",
                as: 'commentLikes'
            }},
            {$project: {
                '_id': 0,
                'likes': 1,
                'commentLikes' : {
                    $slice: ['$commentLikes', (req.params.pageNumber - 1) * 10, 10],
                },
            }},
            {$project: {
                'commentLikes': {
                    'username': 1,
                    'profileImage': 1
                }
            }},
            {$unwind: '$commentLikes'}
        ]).exec((err, result) => {
            if(result) {
                res.status(200).json(result[0]);
            }
            if(err) {
                console.log(err)
                res.status(404).send('Post likes not found');
            }
        });
    
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong!');
    }
})

/**
        /api/likedPosts/:pageNumber
        req.params: 
            pageNumber: Number

        validateToken:
            user: String

        res:
            likedPosts: Array(post)
*/   
app.get(`${serverConfig.BASE_URL}/likedComments/:postId/:pageNumber`, cors(), auth.validateToken, async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        let likes = [];

        await Comments.find({
            postId: mongoose.Types.ObjectId(req.params.postId)}, 
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
                return res.status(200).json({'likedComments': likes});
            }
            if(err) {
                return res.status(404).send("Post not found")
            }
        });
    } catch (error) {
        return res.status(500).send('Something went wrong!');
    }
})
}