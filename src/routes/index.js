const authRoutes = require('./auth-routes');
const postsRoutes = require('./posts-routes');

module.exports = (app) => {
    authRoutes(app);
    postsRoutes(app);
}