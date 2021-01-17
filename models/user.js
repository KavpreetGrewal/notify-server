const mongoose = require('mongoose');

// Schema for Users
const userSchema = new mongoose.Schema({
    number: {
        type: String,
        trim: true,
        required: true
    },
    time: {
        type: String,
        trim: true,
        required: false,
    },
    keyword: {
        type: String,
        trim: true,
        required: false,
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;