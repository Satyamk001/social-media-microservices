const logger = require('../utils/logger');
const Media = require('../models/Media');
const { uploadMediaCloudinary } = require('../utils/cloudinary');

const uploadMedia = async (req, res) => {
    try {
        // console.log("Inside uploadMedia controller: ", req.file, req.user);
        if (!req.file) {
            return res.status(400).json({ message: 'No  file uploaded' });
        }
        const newMedia = new Media({
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            // url: req.file.secure_url,
            userId: req.user.userId
        });
        const cloudinaryUploadRes = await uploadMediaCloudinary(req.file);
        if (!cloudinaryUploadRes) {
            return res.status(500).json({ message: 'Failed to upload media to cloud' });
        }
        // console.log("Cloudinary upload response: ", cloudinaryUploadRes);
        newMedia.url = cloudinaryUploadRes.secure_url;
        newMedia.publicId = cloudinaryUploadRes.public_id;
        await newMedia.save();
        res.status(201).json({error : false, data : newMedia, message: 'Media uploaded successfully'});
    } catch (error) {
        logger.error('Error uploading media:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {uploadMedia};