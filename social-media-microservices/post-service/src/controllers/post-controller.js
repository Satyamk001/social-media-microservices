const logger = require('../utils/logger');
const Post = require('../models/Post');
const {publishEvent} = require('../utils/rabbitmq');
const invalidateCache = async (req)=>{
    const keys = req.redisClient.keys("posts:*");
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }

}

const createPost = async (req, res) => {
    try {
        const { content, mediaIds } = req.body;
        const newPost = new Post({ user : req.user.userId, content, mediaIds });
        await newPost.save();
        await invalidateCache(req);
        await publishEvent('post.created', { postId: newPost._id, content, userId: req.user.userId, createdAt: new Date() });
        res.status(201).json(newPost);
    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
            return res.status(200).json(JSON.parse(cachedPosts));
        }
        const posts = await Post.find()

            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);
        const response = {
            posts,
            totalPosts,
            totalPages,
            currentPage: page
        };
        await req.redisClient.set(cacheKey, JSON.stringify(response), 'EX', 60 * 5); // Cache for 5 minutes
        res.status(200).json(response);
    } catch (error) {
        logger.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user', 'username');
        if (!post) {
            return res.status(200).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        logger.error('Error fetching post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deletePost = async (req, res) => {
    try {
        console.log("deelete post called" , req.params.id);
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(200).json({ message: 'Post not found' });
        }
        await invalidateCache(req); // u can just delete the cache for this post rather than deleting all posts
        await publishEvent('post.deleted', { postId: req.params.id, mediaIds: post.mediaIds , userId: post.user});
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        logger.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createPost,
    getPosts,
    getPostById,
    deletePost
};