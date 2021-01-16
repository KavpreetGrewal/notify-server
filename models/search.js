const mongoose = require('mongoose');

// Schema for Searches
const searchSchema = new mongoose.Schema({
    date: {
        type: String,
        trim: true,
        required: true
    },
    q: {
        type: String,
        trim: true,
        required: false,
    },
    category: {
        type: String,
        trim: true,
        required: false,
    },
    language: {
        type: String,
        trim: true,
        required: true,
    },
    country: {
        type: String,
        trim: true,
        required: true,
    },
    articles: {
        type: Array,
        required: true,
    }
});

const Search = mongoose.model('Search', searchSchema);
module.exports = Search;