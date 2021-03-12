const serverConfig = require('../config/config')
const { Account } = require('../models')

module.exports = (app) => {

/**
       /api/sign-up
        req.body: 
            email: String unique
            username: String unique
            password: String
            country: String
*/
    app.post(`${serverConfig.BASE_URL}/sign-up`, async (req, res) => {
        try {
            if(!req.body.username || !req.body.email || !req.body.password || !req.body.country) {
                return res.status(400).send('Data is not provided correctly');
            }

            const account = new Account({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                country: req.body.country,
            });

            console.log(account)
            const doc = await account.save();
            console.log(doc)

            res.status(200).json({
                success: true,
                accountId: doc._id,
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
*/
    app.post(`${serverConfig.BASE_URL}/sign-in`, async (req, res) => {
        try {
            if(!req.body.username || !req.body.password) {
                return res.status(400).send('Data is not provided correctly');
            }
    
            const username = req.body.username;
            const password = req.body.password;
    
            const doc = await Account.findOne({ username }).exec();
            if(!doc || doc.password !== password) {
                return res.status(404).send('Invalid credentials!');
            }  
    
            return res.status(200).json({
                accountId: doc._id,
            });
        } catch (error) {
            return res.status(500).send('Something went wrong!');
        }
    });
}