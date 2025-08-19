const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log the error details
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
    });

    // Set the response status code
    res.status(err.statusCode || 500);

    // Send the error response
    res.json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? null : err.stack, // Hide stack trace in production
    });
}


module.exports = errorHandler;