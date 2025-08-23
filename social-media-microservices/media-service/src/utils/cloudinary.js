const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadMediaCloudinary = async (filePath) => {
   return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (error) {
                logger.error('Cloudinary upload error:', error);
                return reject(error);
            }
            resolve(result);
        }).end(filePath.buffer);
   })
}

const deleteMediaCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                logger.error('Cloudinary delete error:', error);
                return reject(error);
            }
            resolve(result);
        });
    })
}

module.exports = {uploadMediaCloudinary, deleteMediaCloudinary};