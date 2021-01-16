const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config();

const ENDPOINT = process.env.DB_ENDPOINT;

mongoose.connect(ENDPOINT, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
}).catch(err => {
    console.log("Was not able to connect to database");
    console.log(err);
});

mongoose.connection.once('open', () => {
    console.log(`Connected to database at ${ENDPOINT}`);
});