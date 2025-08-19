const express = require('express');
const router = express.Router();
const postController = require('../controllers/post-controller');
const { authenticateRequest } = require('../middlewares/authMiddleware');

// Route to create a new post
router.post('/', authenticateRequest, postController.createPost);

module.exports = router;