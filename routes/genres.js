var express = require('express');
var router = express.Router();
//const Game = require('../models/genre');

// Require our controllers.
var genre_controller = require('../controllers/genreController'); 

/// genreS ROUTES ///

// GET genre home page.
router.get('/', genre_controller.genre_list);  

// GET request for creating a genre. NOTE This must come before route that displays genre (uses id).
router.get('/create', genre_controller.genre_create_get);

// POST request for creating genre.
router.post('/create', genre_controller.genre_create_post);

// GET request to delete genre.
router.get('/:id/delete', genre_controller.genre_delete_get);

// POST request to delete genre.
router.post('/:id/delete', genre_controller.genre_delete_post);

// GET request to update genre.
router.get('/:id/update', genre_controller.genre_update_get);

// POST request to update genre.
router.post('/:id/update', genre_controller.genre_update_post);

// GET request for one genre.
router.get('/:id', genre_controller.genre_detail);

module.exports = router;