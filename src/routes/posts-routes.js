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
            location: String required
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
            if(!req.body.profileImage || !req.body.username
                || !req.body.title || !req.body.text || !req.body.location 
                || !req.body.category || !req.body.createdDate) {
                return res.status(400).send('Data is not provided correctly');
            }
            const posts = new Posts({
                userId: req.user,
                profileImage: req.body.profileImage,
                username: req.body.username,
                title: req.body.title,
                text: req.body.text,
                location: req.body.location,
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
            location: String 
            category: String 
            postImage: String
            likes: Number 
            shares: Number 
            createdDate: Date required
*/
    app.get(`${serverConfig.BASE_URL}/post/:postId`, cors(), async (req, res) => {
        try {
            const doc = await Posts.findById(req.params.postId).exec();

            if(!doc) return res.status(404).send('This post does not exist');

            res.status(200).json({
                postId: doc._id,
                userId: doc.userId,
                profileImage: doc.profileImage,
                username: doc.username,
                title: doc.title,
                text: doc.text,
                location: doc.location,
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
        /api/post/:postId
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
            if(totalResults <= ((pageNumber - 1) * 10)) {
                return res.status(404).send('Posts not found');
            }

            const posts = await Posts.find({},{userLikes: 0})
                .limit(10)
                .skip((pageNumber - 1) * 10)
                .sort({'createdDate': -1}).exec();

            if(!posts) return res.status(404).send('There are no posts available');

            return res.status(200).json({ 'posts' : posts, 'totalResults' : totalResults });
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    })
}