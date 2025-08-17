const logger = require('../utils/logger');
const User = require('../models/User');
const { validateRegistration } = require('../utils/userValidator');
const errorHandler = require('../middlewares/errorHandler');
const {generateToken} = require("../utils/tokenGenerator");

const registerUser = async (req, res, next) => {
   try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.error('Validation error:', error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { username, password, email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            logger.warn('User already exists:', username);
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        // Create new user
        const newUser = new User({ username, password, email });
        await newUser.save();

        logger.info('User registered successfully:', username);

        const {accessToken , refreshToken } = await generateToken(newUser);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {user: newUser, accessToken, refreshToken}
        });
    }
    catch (error) {
        logger.error('Error registering user:', error.message);
        next(error); // Pass the error to the error handler middleware
    }
}

module.exports = { registerUser };