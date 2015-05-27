var config = require('../../config');
var db = require('../utils/database');
var sh = require('shelljs');
var fs = require('fs');
var pagedown = require('pagedown');
var crypto = require('crypto');

var blogController = function() {};

blogController.prototype = {

    /* Update Posts
       1) Update posts folder by fetching from GitHub
       2) Diff files in directory vs the posts in the DB and create list
       3) Get post metadata from preview tag
       4) Convert post preview to HTML
       5) Add new post to DB
       6) Create new post page
    */
    updatePosts : function (req, res) {	
/*
        // Confirm that request was sent from GitHub
        var signature = crypto.createHmac('sha1', config.githubSecret).update(JSON.stringify(req.body)).digest('hex');

	    var githubSignature = req.headers['x-hub-signature'].split('=')[1];

        if (!secureCompare(signature, githubSignature)) {
            res.send(500, 'Server Error');
            return;
        }

        // Fetch new posts from GitHub
        var execute = sh.exec(__dirname + '/../../scripts/./fetch_posts.sh');
*/
        // Get all post titles from DB
        db.getPostTitles(function(err, results) {
            if (err) {
                res.send(500, 'Server Error.');
                return;
            }

            var postFiles = fs.readdirSync(config.srcRoot + config.srcPostsDir);

            var postsToAdd = filterNewPosts(results, postFiles);

            // Iterate through new md files and add to blog
            for (var i = 0; i < postsToAdd.length; i++) {

                // Encapsulate in function due to db callbacks within the loop
                (function() {

                    // Get file contents as string
                    var postFileContents = fs.readFileSync(config.srcRoot + config.srcPostsDir + postsToAdd[i], 'utf8');

                    // Split new post based on summary tag
                    var postPreview = postFileContents.split('<!--')[0];                  // Contents before summary tag
                    var postMeta = postFileContents.split('<!--')[1].split('-->')[0];    // Contents within summary tag

                    // Extract Metadata
                    var authorName = postMeta.split('|')[0].split('=')[1];
                    var imgName = postMeta.split('|')[1].split('=')[1];
                    var postTags = postMeta.split('|')[2].split('=')[1].split(",");
                    var postTitle = postsToAdd[i].split(".")[0].replace(/-/g, ' ');
                    var postDate = getCurrentDate();

                    // Convert post preview to HTML
                    var converter = new pagedown.getSanitizingConverter();
                    var htmlPreview = converter.makeHtml(postPreview);

                    // Insert new post
                    db.addNewPost(authorName, postDate, imgName, postTitle, htmlPreview, function(err, results) {
                        if (err) {
                            res.send(500, 'Server Error.');
                            return;
                        }

                        // ------------- Create new post page ---------------- //

                        // Get template HTML file contents
                        var templateFileContents = fs.readFileSync(__dirname + '/../../post_template.html', 'utf8');

                        // Insert post image path
                        templateFileContents = templateFileContents.replace('<!-- POST IMAGE -->', '<img class="img-responsive" src="' + config.destImgsDir + imgName + '" alt="">');

                        // Insert post title
                        templateFileContents = templateFileContents.replace('<!-- POST TITLE -->', postTitle);

                        // Insert post author
                        templateFileContents = templateFileContents.replace('<!-- POST AUTHOR -->', authorName);

                        // Insert post date
                        templateFileContents = templateFileContents.replace('<!-- POST DATE -->', postDate);

                        // Convert post to HTML
                        var htmlPostBody = converter.makeHtml(postFileContents);

                        // Insert HTML post body into post page
                        templateFileContents = templateFileContents.replace('<!-- POST BODY -->', htmlPostBody);

                        // Create new HTML post file
                        var fd = fs.openSync(config.destRoot + config.destPostsDir + postTitle.replace(/\s+/g, '-') + '.html', 'a');
                        fs.writeSync(fd, templateFileContents);

                        // Copy post image file
                        var copyImg = sh.exec('cp ' + config.srcRoot + config.srcImgsDir + imgName + ' ' + config.destRoot + config.destImgsDir);
                    });

                })();

            }

	    res.send(req.body);

        });
    }

};

module.exports = new blogController();

function filterNewPosts (existingTitles, listOfFiles) {

    var postsToAdd = [];

    // Get list of posts to ignore
    var postsToIgnore = config.postsToIgnore.split(',');

    var omitList = existingTitles.concat(postsToIgnore);

    for (var i = 0; i < listOfFiles.length; i++) {

        // Skip temporary files
        if (listOfFiles[i].toString().indexOf("~") > -1) {
            continue;
        }

        var currentFile = listOfFiles[i].toString().replace(/-/g, ' ').split('.')[0];

        var postExists = false;

        for (var j = 0; j < omitList.length; j++) {
            if (currentFile === omitList[j]) {
                postExists = true;
            }
        }

        // Add post to list
        if (!postExists) {
            postsToAdd.push(listOfFiles[i]);
        }
    }

    return postsToAdd;
}

function getCurrentDate() {

    var fullMonth = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    var today = new Date();

    return fullMonth[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear();
}

function secureCompare (s1, s2) {

	if (s1.length !== s2.length) {
		return false;
	}
	var result = 0;
	for (var i = 0; i < s1.length; i++) {
		result |= (s1.charCodeAt(i) ^ s2.charCodeAt(i));
	}
	
	return (result === 0);
}

