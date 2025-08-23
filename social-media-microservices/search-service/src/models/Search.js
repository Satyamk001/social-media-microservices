const mongoose = require('mongoose');
const { Schema } = mongoose;

const SearchSchema = new Schema({
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

SearchSchema.index({ createdAt: -1 });
SearchSchema.index({ content: 'text' });

module.exports = mongoose.model('Search', SearchSchema);