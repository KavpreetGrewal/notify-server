const Vonage = require('@vonage/server-sdk');
const dotenv = require('dotenv');
dotenv.config();

const news = require('./news');

// Connects to Vonage
const vonage = new Vonage({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
});

// Fetches news articles based on the request
exports.replySMS = async (req, res) => {
    const params = Object.assign(req.query, req.body);
    console.log(params); // TODO

    // Gets the Info from the SMS
    const to = params.msisdn;
    const text = params.text;
    const info = getInfo(to);
    const language = info[0];
    const country = info[1];

    await news.getArticle(to, text, language, country);

    // Ends the Webhook
    res.status(200).end();
}

// Handles requests to send SMS to user
exports.sendSMS = async (text, to) => {
    const from = process.env.PHONE_NUM;

    vonage.message.sendSms(from, to, text, {
        type: "text"
    }, (err, responseData) => {
        if (err) {
            console.log(err);
        } else {
            if (responseData.messages[0]['status'] === "0") {
                console.log("Message sent successfully.");
            } else {
                console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
        }
    });
}

// TODO: connect with Vonage Insights
// Gets the country and language of the client based on number
const getInfo = (number) => {
    // get insights from number
    return ['en', 'us'];
}