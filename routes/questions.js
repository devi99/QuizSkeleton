var express = require('express');
var router = express.Router();
//const Game = require('../models/question');

// Require our controllers.
var question_controller = require('../controllers/questionController'); 

/// QUESTIONS ROUTES ///

// GET question home page.
router.get('/', question_controller.question_list);  

// GET request for creating a Question. NOTE This must come before route that displays question (uses id).
router.get('/create', question_controller.question_create_get);

// POST request for creating Question.
router.post('/create', question_controller.question_create_post);

// GET request to delete question.
router.get('/:id/delete', question_controller.question_delete_get);

// POST request to delete question.
router.post('/:id/delete', question_controller.question_delete_post);

// GET request to update question.
router.get('/:id/update', question_controller.question_update_get);

// POST request to update question.
router.post('/:id/update', question_controller.question_update_post);

// GET request for one question.
router.get('/:id', question_controller.question_detail);

module.exports = router;