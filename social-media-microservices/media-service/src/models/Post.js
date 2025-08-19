const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
        mediaIds: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    },
    {
        timestamp: Date,
    })

postSchema.index({content: 'text'});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;