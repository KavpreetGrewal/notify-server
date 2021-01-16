const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const newsRouter = require('./routes/news');
const smsRouter = require('./routes/sms');

const PORT = process.env.PORT || 5000;
const server = express();
dotenv.config();

server.use(cors());
server.use(express.json());

// Establish MongoDB connection
require('./database/mongodb');

// Connect News Router for News API
server.use('/news', newsRouter);

// Connect SMS router for Vonage API
server.use('/webhooks/inbound-sms', smsRouter);

server.get('/', async (req, res) => {
    res.send('Hello World!');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});