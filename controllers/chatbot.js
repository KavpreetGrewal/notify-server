const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const dotenv = require('dotenv');
dotenv.config();

const Vonage = require('./sms');
const news = require('./news');

const assistant = new AssistantV2({
    authenticator: new IamAuthenticator({ apikey: process.env.IBM_API_KEY }),
    serviceUrl: process.env.IBM_SERVICE_URL,
    version: '2018-09-19'
});


exports.handleIncomingMsg = async(to, textMsg, language, country) => {
    console.log(textMsg.substring(5));

    if (textMsg.substring(0, 4).toLowerCase() === "news"){
        await Vonage.sendSMS(`Checking news about ${textMsg.substring(5).toLowerCase()}...`, to);
        await delay(1500);
        await news.sendNews(to, textMsg.substring(5), language, country); // removes the "!news" part of the message
        return;
    }
    // TODO: add project name
    let text = "Hello. Welcome! Ask me for news or search up articles with a keyword by " +
        "typing:"
    let prompt =  "\"!news [your search query]\"";

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
                        await delay(1500);
                        await Vonage.sendSMS(prompt, to);
                    } else if (intent.intent === "get-news") {
                        console.log('news');
                        await Vonage.sendSMS('Checking the top news...', to);
                        await delay(1500);
                        await news.sendNews(to, 'business', language, country);
                    } else {
                        console.log('other');
                        await Vonage.sendSMS(text, to);
                        await delay(1500);
                        await Vonage.sendSMS(prompt, to);
                    }
                })
                .catch(async err => {
                    console.log('msg error');
                    console.log(err);
                    await Vonage.sendSMS(text, to);
                    await delay(1500);
                    await Vonage.sendSMS(prompt, to);
                });
        }).catch(async err => {
        console.log('cs error');
            console.log(err);
            await Vonage.sendSMS(text, to);
            await delay(1500);
            await Vonage.sendSMS(prompt, to);
    });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

