const authRoutes = require('./auth-routes');

module.exports = (app) => {
    authRoutes(app);
}