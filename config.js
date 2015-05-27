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

// Blog Directories
config.srcRoot = '/www/Posts/';
config.srcImgsDir = 'img/';
config.srcPostsDir = 'md/';
config.destRoot = '/www/CantangoHome/public/';
config.destImgsDir = 'blog/blog_imgs/';
config.destPostsDir = 'blog/blog_posts/';

config.postsToIgnore = 'Post Example,Post Test';

module.exports = config;