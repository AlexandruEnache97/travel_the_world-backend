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
}