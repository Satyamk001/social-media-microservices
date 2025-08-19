const logger = require('../utils/logger');

const authenticateRequest = (req, res, next) => {
    const token = req.headers['x-user-id'];
    if (!token) {
        logger.error('No token provided');
        return res.status(401).json({ success : false, message: 'Unauthorized' });
    }

    // Here you would typically verify the token and extract user information
    // For simplicity, let's assume the token is valid and contains userId
    try {
        const userId = token; // In a real scenario, decode the token to get userId
        req.user = { userId }; // Attach user info to request object
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = { authenticateRequest };