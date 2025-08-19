const logger = require('../utils/logger');
const Post = require('../models/Post');

const createPost = async (req, res) => {
    try {
        const { content, mediaIds } = req.body;
        const newPost = new Post({ user : req.user.userId, content, mediaIds });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'username');
        res.status(200).json(posts);
    } catch (error) {
        logger.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user', 'username');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        logger.error('Error fetching post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
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