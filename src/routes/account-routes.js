const serverConfig = require('../config/config')
const { Account } = require('../models')
const mongoose = require('mongoose')
const auth = require('../utils/auth-utils')
const cors = require('cors')

module.exports = (app) => {

    app.use(cors());

    /**
            /api/changeProfileImage
            req.body: 
                profileImage: String
    
            validateToken:
                user: String
    
            res:
                success: true
    */
    app.put(`${serverConfig.BASE_URL}/changeProfileImage`, cors(), auth.validateToken, async (req, res) => {
        try {
            if (!req.body.profileImage) {
                return res.status(400).send('Image not provided correctly!');
            }

            const userId = mongoose.Types.ObjectId(req.user);
            Account.findByIdAndUpdate(userId, {
                profileImage: req.body.profileImage
            }, (err, result) => {
                if (err) return res.status(404).send('Image not changed');
                if (result) return res.status(200).json({
                    success: true,
                    msg: "Image changed successfully"
                });
            });
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    });

    /**
            /api/changeProfileDetails
            req.body: 
                username: String
                email: String
                password: String
    
            validateToken:
                user: String
    
            res:
                success: true
    */
    app.put(`${serverConfig.BASE_URL}/changeProfileDetails`, cors(), auth.validateToken, async (req, res) => {
        try {
            if (!req.body.username && !req.body.email && !req.body.password) {
                return res.status(400).send('Image not provided correctly!');
            }

            const userId = mongoose.Types.ObjectId(req.user);
            const user = await Account.findById(userId);
            const passwordMatch = await auth.comparePassword(req.body.password, user.password);

            if (passwordMatch) {
                Account.findByIdAndUpdate(userId, {
                    username: req.body.username,
                    email: req.body.email,
                }, (err, result) => {
                    if (err) return res.status(404).send('Image not changed');
                    if (result) return res.status(200).json({
                        success: true,
                        msg: "Account details changed"
                    });
                });
            } else {
                return res.status(500).json({
                    success: false,
                    msg: "Password not correct"
                });
            }
        } catch (error) {
            console.log(error)
            res.status(500).send('Something went wrong!');
        }
    });
}