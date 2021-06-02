const serverConfig = require('../config/config')
const { Account } = require('../models')
const mongoose = require('mongoose')
const auth = require('../utils/auth-utils')
const cors = require('cors')

module.exports = (app) => {
    app.use(cors());

    /**
        /api/savePost
        req.body: 
            postId: String
    
        validateToken:
            user: String
    
        res:
            success: true
    */
    app.put(`${serverConfig.BASE_URL}/savePost`, cors(), auth.validateToken, async (req, res) => {
        try {
            if (!req.body.postId) {
                return res.status(400).send('Post id not provided correctly!');
            }

            const postId = mongoose.Types.ObjectId(req.body.postId);
            const userId = mongoose.Types.ObjectId(req.user);

            Account.findByIdAndUpdate(userId, {
                $push: { "savedPosts": postId },
                $inc: { "totalSavedPosts": 1 }
            }, (err, result) => {
                if (err) return res.status(404).send('Post not saved');
                if (result) return res.status(200).json({
                    success: true,
                    msg: "Post saved successfully"
                });
            });
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    });

    /**
    /api/deleteSavedPost
    req.body: 
        postId: String

    validateToken:
        user: String

    res:
        success: true
    */
    app.put(`${serverConfig.BASE_URL}/deleteSavedPost`, cors(), auth.validateToken, async (req, res) => {
        try {
            if (!req.body.postId) {
                return res.status(400).send('Post id not provided correctly!');
            }

            const postId = mongoose.Types.ObjectId(req.body.postId);
            const userId = mongoose.Types.ObjectId(req.user);

            Account.findByIdAndUpdate(userId, {
                $pull: { "savedPosts": postId },
                $inc: { "totalSavedPosts": -1 }
            }, (err, result) => {
                if (err) return res.status(404).send('Post not unsaved');
                if (result) return res.status(200).json({
                    success: true,
                    msg: "Post unsaved successfully"
                });
            });
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    });

    /**
        /api/savedPosts/:pageNumber
        req.params: 
            pageNumber: Number
    
        res:
            userLikes: Array(post), limit 10
    */
    app.get(`${serverConfig.BASE_URL}/savedPosts/:pageNumber`, cors(), auth.validateToken, async (req, res) => {
        try {
            const pageNumber = req.params.pageNumber;
            const userId = mongoose.Types.ObjectId(req.user);
            const response = await Account.findById(userId, { totalSavedPosts: 1 });

            if (response.totalSavedPosts <= ((pageNumber - 1) * 10)) {
                return res.status(404).send('Posts saved not found');
            }

            Account.aggregate([
                {
                    $match: {
                        _id: userId
                    }
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "savedPosts",
                        foreignField: "_id",
                        as: 'savedPosts'
                    }
                },
                {
                    $project: {
                        '_id': 0,
                        "savedPosts": {
                            $slice: ['$savedPosts', (pageNumber - 1) * 10, 10],
                        },
                    }
                },
                {
                    $project: {
                        'savedPosts': 1
                    }
                }
            ]).exec((err, result) => {
                if (result) {
                    res.status(200).json(result[0]);
                }
                if (err) {
                    console.log(err)
                    res.status(404).send('Saved posts not found');
                }
            });

        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    })

}