const authRoutes = require('./auth-routes');
const commentsRoutes = require('./comments-routes');
const likesRoutes = require('./likes-routes');
const postsRoutes = require('./posts-routes');

module.exports = (app) => {
    authRoutes(app);
    postsRoutes(app);
    likesRoutes(app);
    commentsRoutes(app);
}