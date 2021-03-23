const serverConfig = require('../config/config')
const { Account } = require('../models')
const auth = require('../utils/auth-utils')
const cors = require('cors')

module.exports = (app) => {

    app.use(cors());

/**
       /api/sign-up
        req.body: 
            email: String unique
            username: String unique
            password: String
            country: String
        res:
            token: String
            accountId: String
*/
    app.post(`${serverConfig.BASE_URL}/sign-up`, cors(), async (req, res) => {
        try {
            if(!req.body.username || !req.body.email || !req.body.password || !req.body.country) {
                return res.status(400).send('Data is not provided correctly');
            }

            const hashPassword = await auth.hashPassword(req.body.password);

            const account = new Account({
                username: req.body.username,
                email: req.body.email,
                password: hashPassword,
                profileImage: req.body.profileImage,
                country: req.body.country,
            });

            const doc = await account.save();
            const token = auth.createToken(doc);

            res.status(200).json({
                success: true,
                accountId: doc._id,
                token: token,
                msg: 'Account created'
            });
        } catch (error) {
            console.log(error)
            if(error.code === 11000) {
                if(error.keyValue.username) {
                    return res.status(409).json({
                        success: false,
                        msg: 'Username already exist'
                    })
                } else if(error.keyValue.email) {
                    return res.status(409).json({
                        success: false,
                        msg: 'Email already exist'
                    })
                }
            }
            res.status(500).send('Something went wrong');
        }
    });

/**
       /api/sign-in
        req.body: 
            username: String unique
            password: String
        res:
            token: String
            accountId: String
*/
    app.post(`${serverConfig.BASE_URL}/sign-in`, cors(), async (req, res) => {
        try {
            if(!req.body.username || !req.body.password) {
                return res.status(400).send('Data is not provided correctly');
            }
    
            const username = req.body.username;
            const password = req.body.password;

    
            const doc = await Account.findOne({ username }).exec();
            if(!doc) return res.status(404).send('Invalid credentials!');
            
            const checkPassword = await auth.comparePassword(password, doc.password);
            if(!checkPassword) return res.status(404).send('Invalid credentials!');

            const token = auth.createToken(doc);
    
            return res.status(200).json({
                accountId: doc._id,
                token: token
            });
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    });

/**
       /api/accounts/:accountId
        req.params:
            accountId: String
        res:
            accountId: String
            username: String
            profileImage: String
            email: String
            country: String
*/   
    app.get(`${serverConfig.BASE_URL}/accounts/:accountId`, cors(), auth.validateToken, async (req, res) => {
        try {
            const doc = await Account.findById(req.params.accountId).exec();

            if(!doc) return res.status(404).send('This account does not exist');

            res.status(200).json({
                accountId: doc._id,
                username: doc.username,
                profileImage: doc.profileImage,
                email: doc.email,
                country: doc.country,
            });
        } catch (error) {
            res.status(500).send('Something went wrong!');
        }
    })
}