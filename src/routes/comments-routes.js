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
                        console.log(result)
                        return res.status(200).json({
                            'results': result,
                            'totalResults': totalResults
                        });
                    }
                    if(err) res.status(404).send('Post likes not found');
            });
        } catch (error) {
            console.log(error)
            return res.status(500).send('Something went wrong!');
        }
    });


}