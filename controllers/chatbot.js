const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const dotenv = require('dotenv');
const Vonage = require('./sms');
const news = require('./news');

dotenv.config();

const assistant = new AssistantV2({
    authenticator: new IamAuthenticator({ apikey: process.env.IBM_API_KEY }),
    serviceUrl: process.env.IBM_SERVICE_URL,
    version: '2018-09-19'
});

exports.handleIncomingMsg = async(to, textMsg, language, country) => {
    await Vonage.sendSMS(textMsg, '16479983024');
    if (textMsg.toLowerCase().split(" ")[0] === "keyword"){
        await news.getArticle(to, textMsg, language, country);
        return;
    }
    assistant.createSession({assistantId: process.env.ASSISTANT_ID})
        .then(res => {
            assistant.message(
                {
                    input: { text: textMsg },
                    assistantId: process.env.ASSISTANT_ID,
                    sessionId: res.session_id,
                })
                .then(response => {
                    const intents = response.output.intents;
                    intents.forEach(intent => {
                        if (intent.intent === "greeting"){
                            Vonage.sendSMS("Hello. Welcome! Ask me for news.... or search up articles with a keyword by typing \"Keyword [your keyword]\"", '16479983024');
                        }else if (intent.intent === "get-news"){
                            news.getArticle(to, "", language, country);
                        }
                    })
                    console.log(JSON.stringify(response.result, null, 2));
                })
                .catch(err => {
                    console.log(err);
                });
        })

};

