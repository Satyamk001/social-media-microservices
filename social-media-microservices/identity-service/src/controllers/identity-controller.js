const logger = require('../utils/logger');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
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

const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate user credentials
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            logger.warn('Invalid username or password:', username);
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        logger.info('User logged in successfully:', username);
        const { accessToken, refreshToken } = await generateToken(user);
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: { user, accessToken, refreshToken }
        });
    } catch (error) {
        logger.error('Error logging in user:', error.message);
        next(error); // Pass the error to the error handler middleware
    }
}

const refreshTokenHandler = async (req, res, next) => {
    try {
        const {refreshToken} = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token is required');
            return res.status(400).json({success: false, message: 'Refresh token is required'});
        }

        const storedToken = await RefreshToken.findOne({token: refreshToken});
        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn('Invalid refresh token');
            return res.status(401).json({success: false, message: 'Invalid refresh token'});
        }

        const user = await User.findById(storedToken.user);
        if (!user) {
            logger.warn('User not found for refresh token');
            return res.status(404).json({success: false, message: 'User not found'});
        }

        const {accessToken, refreshToken: newRefreshToken} = await generateToken(user);

        await RefreshToken.deleteOne({_id: storedToken._id});

        logger.info('Refresh token generated successfully for user:', user.username);
        res.status(200).json({
            success: true,
            message: 'Refresh token generated successfully',
            data: {accessToken, refreshToken: newRefreshToken}
        });
    } catch (error) {
        logger.error('Error refreshing token:', error.message);
        next(error); // Pass the error to the error handler middleware
    }
}

module.exports = { registerUser, loginUser, refreshTokenHandler };