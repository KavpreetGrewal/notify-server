const express = require('express');
const news = require('../controllers/news');

const router = express.Router();

// Handles GET request for News
router.get('/', news.getNews);

module.exports = router;