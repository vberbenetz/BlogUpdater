var config = {};

// App Related
config.serverPort = 19991;

// Database Related
config.dbHost = 'localhost';
config.database = 'cantangoblog';
config.dbUser = 'bloguser';
config.dbPass = 'Bl0gU$3r';

// Secret used to validate payload from GitHub
config.githubSecret = 'NewBlogPost';

config.blogPostPath = '/www/CantangoHome/blog/';

module.exports = config;