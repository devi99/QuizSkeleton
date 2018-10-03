const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const game_controller = require('../controllers/gameController'); 

// GET game home page.
router.get('/', game_controller.game_index);  

module.exports = router;