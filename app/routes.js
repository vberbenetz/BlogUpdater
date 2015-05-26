// app.routes.js

var blogController = require('./controllers/blog_controller');

module.exports = function(app) {

    app.post('/api/blog/new-post', function(req, res) {
        blogController.updatePosts(req, res);
    });

    // Send to angular if no route found ==============================================================================/
    app.get('*', function(req, res) {
        res.send(404, 'Page Not Found');
    });

};