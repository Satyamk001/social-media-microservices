const logger = require('../utils/logger');
const Search = require('../models/Search');

const searchPosts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const results = await Search.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" }, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalResults = await Search.countDocuments({ $text: { $search: query } });
        const totalPages = Math.ceil(totalResults / limit);

        res.status(200).json({
            results,
            totalResults,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        logger.error('Error searching posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {searchPosts};