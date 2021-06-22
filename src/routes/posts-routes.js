const serverConfig = require('../config/config')
const { Posts } = require('../models')
const mongoose = require('mongoose')
const cors = require('cors')
const auth = require('../utils/auth-utils');

module.exports = (app) => {

    app.use(cors());

    /**
           /api/post
            req.body: 
                accountId: ObjectId required
                profileImage: String required
                username: String required
                title: String required
                text: String required
                country: String required
                location: String required
                coordinates: {
                    lat: Number 
                    lng: Number
                }
                category: String required
                postImage: String
                likes: Number default 0
                shares: Number default 0
                createdDate: Date required
            res:
                postId: String
    */

    app.post(`${serverConfig.BASE_URL}/post`, cors(), auth.validateToken, async (req, res) => {
        try {
            if (!req.body.profileImage || !req.body.username
                || !req.body.title || !req.body.text
                || !req.body.country || !req.body.location
                || !req.body.category || !req.body.createdDate) {
                return res.status(400).send('Data is not provided correctly');
            }
            const posts = new Posts({
                userId: req.user,
                profileImage: req.body.profileImage,
                username: req.body.username,
                title: req.body.title,
                text: req.body.text,
                country: req.body.country,
                location: req.body.location,
                coordinates: req.body.coordinates,
                category: req.body.category,
                postImage: req.body.postImage,
                likes: req.body.likes,
                shares: req.body.shares,
                createdDate: req.body.createdDate
            });

            const doc = await posts.save();

            res.status(200).json({
                success: true,
                postId: doc._id,
                msg: 'Post created'
            });
        } catch (error) {
            res.status(500).send('Something went wrong');
        }
    });

    /**
            /api/post/:postId
            req.params: 
                postId: String
    
            res:
                postId: String
                username: String 
                title: String 
                text: String 
                country: String required
                location: String required
                coordinates: {
                    lat: Number 
                    lng: Number
                }
                category: String 
                postImage: String
                likes: Number 
                shares: Number 
                createdDate: Date required
    */
    app.get(`${serverConfig.BASE_URL}/post/:postId`, cors(), async (req, res) => {
        try {
            const doc = await Posts.findById(req.params.postId).exec();

            if (!doc) return res.status(404).send('This post does not exist');

            res.status(200).json({
                postId: doc._id,
                userId: doc.userId,
                profileImage: doc.profileImage,
                username: doc.username,
                title: doc.title,
                text: doc.text,
                country: doc.country,
                location: doc.location,
                coordinates: doc.coordinates,
                category: doc.category,
                postImage: doc.postImage,
                likes: doc.likes,
                shares: doc.shares,
                createdDate: doc.createdDate
            });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })

    /**
            /api/allPosts/:pageNumber
            req.params: 
                pageNumber: Number
    
            res:
                posts: Array(post)
                totalResults: Number
    */
    app.get(`${serverConfig.BASE_URL}/allPosts/:pageNumber`, cors(), async (req, res) => {
        try {
            const pageNumber = req.params.pageNumber;

            const totalResults = await Posts.countDocuments({});
            if (totalResults <= ((pageNumber - 1) * 10)) {
                return res.status(404).send('Posts not found');
            }

            Posts.aggregate([
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                { $unwind: '$userData' },
                {
                    $project: {
                        '_id': 1,
                        'likes': 1,
                        'shares': 1,
                        'title': 1,
                        'text': 1,
                        'country': 1,
                        'location': 1,
                        'location': 1,
                        'coordinates': 1,
                        'category': 1,
                        'postImage': 1,
                        'createdDate': 1,
                        'userData': {
                            'username': 1,
                            'profileImage': 1,
                            '_id': 1
                        }
                    }
                },
                {
                    $sort: {
                        'createdDate': -1
                    }
                },
                { $skip: (pageNumber - 1) * 10 },
                { $limit: 10 }
            ]).exec((err, result) => {
                if (result) {
                    return res.status(200).json({
                        'posts': result,
                        'totalResults': totalResults
                    });
                }
                if (err) res.status(404).send('There are no posts available');
            })
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    })

    /**
            /api/userPosts/:pageNumber
            req.params: 
                pageNumber: Number
                userAccountId: String
    
            validateToken:
                user: String
    
            res:
                posts: Array(post)
                totalResults: Number
    */
    app.get(`${serverConfig.BASE_URL}/userPosts/:userAccountId/:pageNumber`, auth.validateToken, cors(), async (req, res) => {
        try {
            const pageNumber = req.params.pageNumber;
            const userId = mongoose.Types.ObjectId(req.params.userAccountId);

            const totalResults = await Posts.countDocuments({ 'userId': userId });
            if (totalResults <= ((pageNumber - 1) * 10)) {
                return res.status(404).send('Posts not found');
            }

            Posts.aggregate([
                {
                    $match: {
                        userId: userId
                    }
                },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                { $unwind: '$userData' },
                {
                    $project: {
                        '_id': 1,
                        'likes': 1,
                        'shares': 1,
                        'title': 1,
                        'text': 1,
                        'country': 1,
                        'location': 1,
                        'location': 1,
                        'coordinates': 1,
                        'category': 1,
                        'postImage': 1,
                        'createdDate': 1,
                        'userData': {
                            'username': 1,
                            'profileImage': 1,
                        }
                    }
                },
                {
                    $sort: {
                        'createdDate': -1
                    }
                },
                { $skip: (pageNumber - 1) * 10 },
                { $limit: 10 }
            ]).exec((err, result) => {
                if (result) {
                    return res.status(200).json({
                        'posts': result,
                        'totalResults': totalResults
                    });
                }
                if (err) res.status(404).send('There are no posts available');
            })
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    })

    /**
            /api/userLikedPosts/:pageNumber
            req.params: 
                pageNumber: Number
    
            validateToken:
                user: String
    
            res:
                likedPosts: Array(post)
    */
    app.get(`${serverConfig.BASE_URL}/userLikedPosts/:userAccountId/:pageNumber`, cors(), auth.validateToken, async (req, res) => {
        try {
            const pageNumber = req.params.pageNumber;
            let likes = [];

            const userId = mongoose.Types.ObjectId(req.params.userAccountId);

            await Posts.find({ 'userId': userId }, { userLikes: 1 })
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
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    })
}