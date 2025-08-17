const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generateToken = async (user)=>{
    const accessToken = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // await RefreshToken.create({
    //     token: refreshToken,
    //     user: user._id,
    //     expiresAt: expiresAt
    // });

    return { accessToken, refreshToken };
}

module.exports = { generateToken };