const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const validateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        logger.warn('No token provided');
        return res.status(401).json({ success : false , message: 'Unauthorized or \'No token provided\'' });
    }

    // Here you would typically verify the token with your auth service
    // For example, using a JWT library or making a request to an auth service
    // For now, we'll just log the token and proceed
    logger.info('Token received:', token);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            logger.warn('Token verification failed:', err.message);
            return res.status(403).json({ success : false , message: 'Forbidden' });
        }
        req.user = decoded; // Attach user info to request object
        next();
    })
}

module.exports = { validateToken };