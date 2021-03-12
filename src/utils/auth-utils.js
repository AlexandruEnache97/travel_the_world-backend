const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createToken = (user) => {
    return jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.GENERATOR_TOKEN);
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
};