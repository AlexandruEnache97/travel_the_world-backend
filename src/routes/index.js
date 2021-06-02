const authRoutes = require('./auth-routes');
const accountRoutes = require('./account-routes');
const commentsRoutes = require('./comments-routes');
const likesRoutes = require('./likes-routes');
const postsRoutes = require('./posts-routes');
const repliesRoutes = require('./replies-routes');
const savePosts = require('./savePosts-routes');

module.exports = (app) => {
    authRoutes(app);
    accountRoutes(app);
    postsRoutes(app);
    likesRoutes(app);
    commentsRoutes(app);
    repliesRoutes(app);
    savePosts(app);
}