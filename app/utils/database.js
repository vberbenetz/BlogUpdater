var mysql = require('mysql');
var config = require('../../config.js');

var pool = mysql.createPool({
    connectionLimit : 50,
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPass,
    database: config.database
});

exports.getPostTitles = function(callback) {

    var sqlQuery =
        'SELECT title ' +
        'FROM Posts';

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log(err);
            callback(true);
            return;
        }

        connection.query(sqlQuery, function(err, results) {

            // Release Connection
            connection.release();

            if (err) {
                console.log(err);
                callback(true);
                return;
            }

            callback(false, results);
        })
    });
};

exports.addNewPost = function(authorName, postDate, imgname, title, category, preview, callback) {

    var getAuthorIdQuery =
        'SELECT id ' +
        'FROM Authors ' +
        'WHERE name = ?';

    var newPostQuery =
        'INSERT INTO Posts (datetime, authorId, imgname, title, preview, category) ' +
        'VALUES (?, ?, ?, ?, ?, ?)';

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log(err);
            callback(true);
            return;
        }

        // Get the Author's Id
        connection.query(getAuthorIdQuery, [authorName], function (err, authorId) {

            // Release connection
            connection.release();

            if (err) {
                console.log(err);
                callback(true);
                return;
            }

            // Insert new post
            pool.getConnection(function(err, connection) {

                if (err) {
                    console.log(err);
                    callback(true);
                    return;
                }

                connection.query(newPostQuery, [postDate, authorId[0].id, imgname, title, preview, category],
                    function (err, results) {

                        // Release connection
                        connection.release();

                        if (err) {
                            console.log(err);
                            callback(true);
                            return;
                        }

                        callback(false, results);
                    });
            });

        });

    });

};
