var config = require('../../config');
var db = require('../utils/database');
var exec = require('sync-exec');
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

        // Confirm that request was sent from GitHub
        var signature = crypto.createHmac('sha1', config.githubSecret).update(JSON.stringify(req.body)).digest('hex');

	    var githubSignature = req.headers['x-hub-signature'].split('=')[1];

        if (!secureCompare(signature, githubSignature)) {
            res.send(500, 'Server Error');
            return;
        }

        // Update Posts from Github
        var execute = exec(__dirname + '/../../scripts/./fetch_posts.sh');

        var commits = req.body.commits;
        var gitAdded = [], gitRemoved = [], gitModified = [];

        // Get all added
        for (var i = 0; i < commits.length; i++) {

            // Skip if no additions in this commit
            if (commits[i].added.length == 0) {
                continue;
            }

            gitAdded = filterMd(commits[i].added);
        }

        // Get all removed
        for (var i = 0; i < commits.length; i++) {

            // Skip if no removals in this commit
            if (commits[i].removed.length == 0) {
                continue;
            }

            gitRemoved = filterMd(commits[i].removed);
        }

        // Get all modified
        for (var i = 0; i < commits.length; i++) {

            // Skip if no modifications in this commit
            if (commits[i].modified.length == 0) {
                continue;
            }

            gitModified = filterMd(commits[i].modified);
        }

/*
        // Remove posts
        for (var i = 0; i < gitRemoved.length; i++) {

            (function() {
                var postTitle = gitRemoved[i].split(".")[0].replace(/-/g, ' ');

                db.removePost(postTitle, function(err, results) {

                    if (err) {
                        res.send(500, 'Server Error.');
                        return;
                    }

                    // Delete md file
                    fs.unlink(conf.destRoot + config.destPostsDir + gitRemoved, function (err) {
                        if (err) {
                            res.send(500, 'Server Error.');
                            return;
                        }
                    });

                });
            })();

        }
*/

        var postsToAdd = gitAdded;

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

                // Extract blogtype metadata if it exists
                var category = 'blog';
                try {
                    category = postMeta.split('|')[3].split('=')[1];
                }
                catch (e) {
                    // No category tag
                    console.log(e);
                }

                var postTitle = postsToAdd[i].split(".")[0].replace(/-/g, ' ');
                var postDate = getCurrentDate();

                // Convert post preview to HTML
                var converter = new pagedown.Converter();
                var htmlPreview = converter.makeHtml(postPreview);

                // Insert new post
                db.addNewPost(authorName, postDate, imgName, postTitle, category, htmlPreview, function(err, results) {
                    if (err) {
                        res.send(500, 'Server Error.');
                        return;
                    }

                    // ------------- Create new post page ---------------- //

                    var postTitleHyphen = postTitle.replace(/\s+/g, '-');

                    var postTitleUrlEncoded = postTitle.replace(/\s+/g, '%20');

                    // Get template HTML file contents
                    var templateFileContents = fs.readFileSync(__dirname + '/../../post_template.html', 'utf8');

                    // Insert post title with hyphen for space
                    templateFileContents = templateFileContents.replace(/<!-- POST TITLE HYPHEN -->/g, postTitleHyphen);

                    // Insert post title with URL Encoded spaces
                    templateFileContents = templateFileContents.replace(/<!-- POST TITLE URLENCODED -->/g, postTitleUrlEncoded);

                    // Insert post image path
                    templateFileContents = templateFileContents.replace(/<!-- POST IMAGE -->/g, '<img class="img-responsive" src="./' + config.destImgsDir + imgName + '">');

                    // Insert post title
                    templateFileContents = templateFileContents.replace(/<!-- POST TITLE -->/g, postTitle);

                    // Insert post author
                    templateFileContents = templateFileContents.replace(/<!-- POST AUTHOR -->/g, authorName);

                    // Insert post date
                    templateFileContents = templateFileContents.replace(/<!-- POST DATE -->/g, postDate);

                    // Convert post to HTML
                    var htmlPostBody = converter.makeHtml(postFileContents);

                    // Insert HTML post body into post page
                    templateFileContents = templateFileContents.replace(/<!-- POST BODY -->/g, htmlPostBody);

                    // Create new HTML post file
                    var fd = fs.openSync(config.destRoot + config.destPostsDir + postTitle.replace(/\s+/g, '-') + '.html', 'w');
                    fs.writeSync(fd, templateFileContents);

                    // Copy post image file
                    var copyImg = exec('cp ' + config.srcRoot + config.srcImgsDir + imgName + ' ' + config.destRoot + config.destImgsDir);
                });

            })();

        }

	    res.send(req.body);

        // Wait for all posts to generate themselves
        setTimeout(function() {
            // Update CantangoHome with new posts
            var execute = exec(__dirname + '/../../scripts/./commit_post.sh');
        }, 5000);

    }

};

module.exports = new blogController();

// Remove all file updates apart from .md files
function filterMd (listOfFiles) {

    for (var i = 0; i < listOfFiles.length; i++) {

        var fileExtension = listOfFiles[i].substring(listOfFiles[i].lastIndexOf("."));

        if (fileExtension != '.md') {
            listOfFiles.splice(i, 1);
            i--;
        }

        // Split into file name
        else {
            var filename = listOfFiles[i].substring(listOfFiles[i].lastIndexOf("/") + 1);
            listOfFiles[i] = filename;
        }
    }

    return listOfFiles;
}

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

