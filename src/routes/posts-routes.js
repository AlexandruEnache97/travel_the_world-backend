const serverConfig = require('../config/config')
const { Posts } = require('../models')
const cors = require('cors')
const multer = require('multer');
const bodyParser = require('body-parser').json();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './postImages/')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') 
        cb(null, true);
    else
        cb(null, false);
}

const upload = multer({
    storage: storage, 
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

module.exports = (app) => {

    app.use(cors());

/**
       /api/post
        req.body: 
            accountId: String required
            title: String required
            text: String required
            country: String required
            postImage: String
*/

    app.post(`${serverConfig.BASE_URL}/post`, upload.single('postImage'), bodyParser, cors(), async (req, res) => {
        try {
            console.log(req.file)
            if(!req.body.accountId || !req.body.title || !req.body.text || !req.body.country) {
                return res.status(400).send('Data is not provided correctly');
            }
            const posts = new Posts({
                accountId: req.body.accountId,
                title: req.body.title,
                text: req.body.text,
                country: req.body.country,
                postImage: req.file.path 
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
    
    app.get(`${serverConfig.BASE_URL}/post/:postId`, upload.single('postImage'), bodyParser, cors(), async (req, res) => {
        try {
            const doc = await Posts.findById(req.params.postId).exec();

            if(!doc) return res.status(404).send('This account does not exist');

            res.status(200).json({
                postId: doc._id,
                accountId: doc.accountId,
                title: doc.title,
                text: doc.text,
                country: doc.country,
                postImage: doc.postImage
            });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })
}