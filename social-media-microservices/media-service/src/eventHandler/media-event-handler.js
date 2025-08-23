const Media = require('../models/Media');
const logger = require('../utils/logger');
const {deleteMediaCloudinary} = require('../utils/cloudinary');
const handlePostDeleted = async(event)=>{
    console.log("Post deleted event received in media service:", event);
    try{
        const mediaIds = event.mediaIds;
        if(!mediaIds || mediaIds.length === 0){
            console.log("No media IDs found in the event data.");
            return;
        }
        console.log("Media IDs to be deleted:", mediaIds);
        const allMedias = await Media.find({_id : {$in : mediaIds}});
        console.log("Media IDs found in the event data.", allMedias);
        for(let media of allMedias){
            await deleteMediaCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id);
            logger.info(`Media with ID ${media} deleted due to post deletion.`);
        }
    }
    catch(error){

        logger.error("Error handling post deleted event:", error);
    }
}
module.exports = {handlePostDeleted};