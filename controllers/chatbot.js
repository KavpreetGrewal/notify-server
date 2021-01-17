let schedule = require('node-schedule');
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const dotenv = require('dotenv');
dotenv.config();

const Vonage = require('./sms');
const news = require('./news');
const User = require('../models/user');

const assistant = new AssistantV2({
    authenticator: new IamAuthenticator({ apikey: process.env.IBM_API_KEY }),
    serviceUrl: process.env.IBM_SERVICE_URL,
    version: '2018-09-19'
});


exports.handleIncomingMsg = async(to, textMsg, language, country) => {

    if (textMsg.substring(0, 4).toLowerCase() === "news"){
        await Vonage.sendSMS(`Checking news about ${textMsg.substring(5).toLowerCase()}...`, to);
        await delay(1500);
        await news.sendNews(to, textMsg.substring(5), language, country); // removes the "!news" part of the message
        return;
    } else if (textMsg.substring(0, 8).toLowerCase() === "schedule") {
        let time = textMsg.split(" ")[1].toLowerCase() || "daily";
        let keyword = textMsg.split(" ")[2].toLowerCase() || "business";
        let num = to;
        await Vonage.sendSMS(`Scheduling ${time} updates about ${keyword}`, to);
        await scheduleUpdates(num, time, keyword);
        return;
    }

    let text = "Hello. Welcome to the notify bot! Ask me for news or search up articles with a keyword by " +
        "typing:"
    let prompt =  "!news [your search query]";
    let schedule = "Or schedule updates by typing: \n !schedule [daily/weekly/monthly] [your search query]"

    assistant.createSession({assistantId: process.env.ASSISTANT_ID})
        .then(async res => {
            assistant.message({
                    input: { text: textMsg },
                    assistantId: process.env.ASSISTANT_ID,
                    sessionId: res.result.session_id,
                })
                .then(async response => {
                    const intents = response.result.output.intents
                    const intent = intents[0];

                    if (intent.intent === "greeting") {
                        console.log('greeting');

                        await Vonage.sendSMS(text, to);
                        await delay(2000);
                        await Vonage.sendSMS(prompt, to);
                        await delay(2000);
                        await Vonage.sendSMS(schedule, to);
                    } else if (intent.intent === "get-news") {
                        console.log('news');
                        await Vonage.sendSMS('Checking the top news...', to);
                        await delay(1500);
                        await news.sendNews(to, 'business', language, country);
                    } else {
                        console.log('other');
                        await Vonage.sendSMS(text, to);
                        await delay(2000);
                        await Vonage.sendSMS(prompt, to);
                        await delay(2000);
                        await Vonage.sendSMS(schedule, to);
                    }
                })
                .catch(async err => {
                    console.log('msg error');
                    console.log(err);
                    await Vonage.sendSMS(text, to);
                    await delay(2000);
                    await Vonage.sendSMS(prompt, to);
                    await delay(2000);
                    await Vonage.sendSMS(schedule, to);
                });
        }).catch(async err => {
        console.log('cs error');
            console.log(err);
            await Vonage.sendSMS(text, to);
            await delay(2000);
            await Vonage.sendSMS(prompt, to);
            await delay(2000);
            await Vonage.sendSMS(schedule, to);
    });
}

const delay = ms => new Promise(res => setTimeout(res, ms));


// Schedule updates
const scheduleUpdates = async (number, time, keyword) => {
    // Creates user to be saved in DB
    console.log(typeof number);
    const user = new User({
        number: number.toString(),
        time: time,
        keyword: keyword
    });

    // Saves user in DB
    await user.save(err => {
        if (err != null) {
            console.log("User was not saved");
            console.log(err);
        }
    });
}



const updateDaily = () => {
    User.find().exec(async (err, users) => {
        for (const user of users) {
            let time = user.time;
            if (time === "daily") {
                await Vonage.sendSMS(`Checking news about ${user.keyword}...`, user.number);
                await delay(1500);
                await news.sendNews(user.number, user.keyword, 'en', 'us');
            }
        }
    });
}

const updateWeekly = () => {
    User.find().exec(async (err, users) => {
        for (const user of users) {
            let time = user.time;
            if (time === "weekly") {
                await Vonage.sendSMS(`Checking news about ${user.keyword}...`, user.number);
                await delay(1500);
                await news.sendNews(user.number, user.keyword, 'en', 'us');
            }
        }
    });
}

const updateMonthly = () => {
    User.find().exec(async (err, users) => {
        for (const user of users) {
            let time = user.time;
            if (time === "monthly") {
                await Vonage.sendSMS(`Checking news about ${user.keyword}...`, user.number);
                await delay(1500);
                await news.sendNews(user.number, user.keyword, 'en', 'us');
            }
        }
    });
}

// Runs updates
let daily = schedule.scheduleJob('0 8 * * *', updateDaily());
let weekly = schedule.scheduleJob('0 8 * * 1', updateWeekly());
let monthly = schedule.scheduleJob('0 8 1 * *', updateMonthly());

