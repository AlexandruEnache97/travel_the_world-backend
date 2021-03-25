const authRoutes = require('./auth-routes');
const likesRoutes = require('./likes-routes');
const postsRoutes = require('./posts-routes');

module.exports = (app) => {
    authRoutes(app);
    postsRoutes(app);
    likesRoutes(app);
}