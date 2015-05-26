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

config.blogPath = '/www/CantangoHome/blog/';
config.mdBlogPath = '/www/Posts/md/';

module.exports = config;