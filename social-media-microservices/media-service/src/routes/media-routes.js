const express = require('express');
const multer = require('multer');
const mediaController = require('../controllers/media-controller');
const { authenticateRequest } = require('../middlewares/authMiddleware');
const router = express.Router();
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({ storage: storage , limits : { fileSize: 10 * 1024 * 1024 } }).single('file'); // 10Mb

// Route to upload media
router.post('/upload', authenticateRequest, (req, res, next) => {

    // console.log("upload  log : ",req.body, req);
    logger.info('Media upload request received:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    upload(req, res, (err) => {
        if (err) {
            logger.error('Error uploading file:', err);
            return res.status(400).json({ error: true, message: 'File upload failed', details: err.message });
        }
        next();
    });
}, mediaController.uploadMedia);

module.exports = router;

