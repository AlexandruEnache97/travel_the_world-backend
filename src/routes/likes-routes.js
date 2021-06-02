const serverConfig = require('../config/config')
const { Posts } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {
    app.use(cors());

    /**
            /api/likedPosts/:pageNumber
            req.params: 
                pageNumber: Number
    
            validateToken:
                user: String
    
            res:
                likedPosts: Array(post)
    */
    app.get(`${serverConfig.BASE_URL}/likedPosts/:pageNumber`, cors(), auth.validateToken, async (req, res) => {
        try {
            const pageNumber = req.params.pageNumber;
            let likes = [];

            await Posts.find({}, { userLikes: 1 })
                .limit(10)
                .skip((pageNumber - 1) * 10)
                .sort({ 'createdDate': -1 }).exec((err, results) => {
                    if (results) {
                        results.map((result) => {
                            if (result.userLikes[0] !== undefined) {
                                result.userLikes.map((item) => {
                                    if (item == req.user) {
                                        likes.push(result._id);
                                    }
                                })
                            }
                        });
                        return res.status(200).json({ 'likedPosts': likes });
                    }
                    if (err) {
                        return res.status(404).send("Posts not found")
                    }
                });
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    })

    /**
            /api/userLikes/:postId/:pageNumber
            req.params: 
                postId: String
                pageNumber: Number
    
            res:
                userLikes: Array({profileImage, username}), limit 10
    */
    app.get(`${serverConfig.BASE_URL}/userLikes/:postId/:pageNumber`, cors(), async (req, res) => {
        try {
            Posts.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(req.params.postId)
                    }
                },
                {
                    $lookup: {
                        from: "accounts",
                        localField: "userLikes",
                        foreignField: "_id",
                        as: 'userLikes'
                    }
                },
                {
                    $project: {
                        '_id': 0,
                        "userLikes": {
                            $slice: ['$userLikes', (req.params.pageNumber - 1) * 10, 10],
                        },
                    }
                },
                {
                    $project: {
                        'userLikes': {
                            'username': 1,
                            'profileImage': 1
                        }
                    }
                }
            ]).exec((err, result) => {
                if (result) {
                    res.status(200).json(result[0]);
                }
                if (err) {
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
            /api/likePost
            req.body: 
                postId: String
    
            validateToken:
                user: String
    
            res:
                success: true
    */
    app.put(`${serverConfig.BASE_URL}/likePost`, cors(), auth.validateToken, async (req, res) => {
        try {

            if (!req.body.postId) {
                return res.status(400).send('Data is not provided correctly');
            }
            const postId = mongoose.Types.ObjectId(req.body.postId);
            const userId = mongoose.Types.ObjectId(req.user);

            Posts.findByIdAndUpdate(postId, {
                $push: { "userLikes": userId },
                $inc: { "likes": 1 }
            }, (err, result) => {
                if (err) return res.status(404).send('Post not found');
                if (result) return res.status(200).json({
                    success: true,
                    msg: "Post liked successfully"
                });
            });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })

    /**
            /api/unlikePost
            req.body: 
                postId: String
    
            validateToken:
                user: String
    
            res:
                success: true
    */
    app.put(`${serverConfig.BASE_URL}/unlikePost`, cors(), auth.validateToken, async (req, res) => {
        try {

            if (!req.body.postId) {
                return res.status(400).send('Data is not provided correctly');
            }
            const postId = mongoose.Types.ObjectId(req.body.postId);
            const userId = mongoose.Types.ObjectId(req.user);

            Posts.findByIdAndUpdate(postId, {
                $pull: { "userLikes": userId },
                $inc: { "likes": -1 }
            }, (err, result) => {
                if (err) return res.status(404).send('Post not found');
                if (result) return res.status(200).json({
                    success: true,
                    msg: "Post unlike successfully"
                });
            });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })
}