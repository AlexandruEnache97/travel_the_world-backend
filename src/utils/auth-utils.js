const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createToken = (user) => {
    return jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.GENERATOR_TOKEN);
}

const validateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if(token === null) return res.sendStatus(401);

    jwt.verify(token, process.env.GENERATOR_TOKEN, (err, user) => {
        if(err) return res.sendStatus(403);
        req.email = user.email;
        req.user = user.userId;
        next();
    })
}

const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

const comparePassword = async (password, hashPassword) => {
    return await bcrypt.compare(password, hashPassword);
}

module.exports = {
    hashPassword,
    comparePassword,
    createToken,
    validateToken,
};