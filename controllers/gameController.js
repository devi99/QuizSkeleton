var Game = require('../models/game');
var async = require('async');

exports.game_index = function(req, res) {
/*     async.parallel({
        Game_count: function(callback) {
            Game.countDocuments(callback);
        },
    }, function(err, results) {
        res.render('game_index', { title: 'Let us play a Quiz', error: err, data: results });
    }); */
    res.render('game_index', { title: 'Let us play a Quiz' });
};

exports.game_create_get = function(req, res, next) {
    console.log("game_create_get");
    res.render('game_create', { title: 'Create Game' });
};

// Handle game create on POST.
exports.game_create_post = [
    
    // Validate fields.
    //body('game', 'game must not be empty.').isLength({ min: 1 }).trim(),
    //body('correctAnswer', 'correctAnswer must not be empty.').isLength({ min: 1 }).trim(),

  
    // Sanitize fields.
    //sanitizeBody('*').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Game object with escaped and trimmed data.
        var game = new Game(
          { gameId: ( Math.random() * 100000 ) | 0,
            gameStatus: 'Not started',
            gameType:'0',
            numberOfPlayers:2
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({

            }, function(err, results) {
                if (err) { return next(err); }
                console.log("game render"),
                res.render('game_form', { title: 'Create Game',game: game, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save game.
            game.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new game record.
                   res.redirect(game.url);
                });
        }
    }
];
