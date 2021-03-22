const serverConfig = require('../config/config')
const { Posts } = require('../models')
const cors = require('cors')

module.exports = (app) => {

    app.use(cors());

/**
       /api/post
        req.body: 
            username: String required
            title: String required
            text: String required
            location: String required
            category: String required
            postImage: String
            likes: Number default 0
            shares: Number default 0
        res:
            postId: String
*/

    app.post(`${serverConfig.BASE_URL}/post`, cors(), async (req, res) => {
        try {
            if(!req.body.username || !req.body.title || !req.body.text || !req.body.location || !req.body.category) {
                return res.status(400).send('Data is not provided correctly');
            }
            const posts = new Posts({
                username: req.body.username,
                title: req.body.title,
                text: req.body.text,
                location: req.body.location,
                category: req.body.category,
                postImage: req.body.postImage,
                likes: req.body.likes,
                shares: req.body.shares,
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
*/
    app.get(`${serverConfig.BASE_URL}/post/:postId`, cors(), async (req, res) => {
        try {
            const doc = await Posts.findById(req.params.postId).exec();

            if(!doc) return res.status(404).send('This post does not exist');

            res.status(200).json({
                postId: doc._id,
                username: doc.username,
                title: doc.title,
                text: doc.text,
                location: doc.location,
                category: doc.category,
                postImage: doc.postImage,
                likes: doc.likes,
                shares: doc.shares,
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

            const results = await Posts.count({});
            if(results <= ((pageNumber - 1) * 10)) {
                return res.status(404).send('Posts not found');
            }

            const doc = await Posts.find({})
                .limit(10)
                .skip((pageNumber - 1) * 10).exec();
            
            if(!doc) return res.status(404).send('There are no posts available');

            res.status(200).json({ 'posts' : doc, 'totalResults' : results });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })
}