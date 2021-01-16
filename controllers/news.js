const Vonage = require('./sms');
const dotenv = require('dotenv');
dotenv.config();

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

const Search = require('../models/search');

const dt = new Date();

// Returns news articles for a GET request
exports.getNews = async (req, res) => {
    try {
        let title = "No articles found ";
        let description = "Please try again or try a new search";

        // Checks if the search has already been done
        const searched = await checkDB(req.query.q, req.query.category, req.query.language, req.query.country);

        if (!searched) {
            let articlesArray = [];

            newsapi.v2.everything({
                q: req.query.q,
                category: req.query.category,
                language: req.query.language,
                country: req.query.country,
                sortBy: 'popularity'
            }).then(async response => {
                articlesArray = response.articles;

                // Loops over articles and sends a max of 3
                for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                    title = articlesArray[i].title;
                    description = articlesArray[i].description;

                    await send(title, description, req.query.number);
                }

                // Creates search to be saved in DB
                const search = new Search({
                    date: dt.toDateString(),
                    q: req.query.q,
                    category: req.query.category,
                    language: req.query.language,
                    country: req.query.country,
                    articles: articlesArray
                });

                // Saves search in DB
                await search.save(err => {
                    if (err != null) {
                        console.log("Search was not saved");
                        console.log(err);
                    }
                });

                // Sends default SMS if there are no news articles found
                if (articlesArray.length == 0) {
                    Vonage.sendSMS("There were no articles matching your requests, please try again", req.query.number);
                    res.status(200).send({
                        articles: [
                            {
                                title: title,
                                description: description
                            }
                        ]
                    });
                } else {
                    // Loops over articles and sends a max of 3
                    let articles = [];
                    for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                        articles.push({
                            title: articlesArray[i].title,
                            description: articlesArray[i].description
                        });
                    }
                    res.status(200).send({
                        articles: articles
                    });
                }

            }).catch(err => {
                console.log("Could not fetch news articles");
                console.log(err);
            });


        } else {
            const search = await Search.findOne({
                date: dt.toDateString(),
                q: req.query.q,
                category: req.query.category,
                language: req.query.language,
                country: req.query.country
            }).catch(err => {
                console.log("There was an error retrieving search from database");
                console.log(err);
            });

            articlesArray = search.articles;

            // Loops over articles and sends a max of 3
            for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                title = articlesArray[i].title;
                description = articlesArray[i].description;

                await send(title, description, req.query.number);
            }


            // Sends default SMS if there are no news articles found
            if (articlesArray.length == 0) {
                Vonage.sendSMS("There were no articles matching your requests, please try again", req.query.number);
                res.status(200).send({
                    articles: [
                        {
                            title: title,
                            description: description
                        }
                    ]
                });
            } else {
                // Loops over articles and sends a max of 3
                let articles = [];
                for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                    articles.push({
                        title: articlesArray[i].title,
                        description: articlesArray[i].description
                    });
                }
                res.status(200).send({
                    articles: articles
                });
            }
        }

    } catch (e) {
        res.status(500).send(e.message);
    }
};




exports.getArticle = async (to, keyword, language, country) => {
    try {
        let title = "No articles found ";
        let description = "Please try again or try a new search";

        if (!(await checkDB(keyword, '', language, country))) {
            let articlesArray = [];

            newsapi.v2.everything({
                q: keyword,
                category: '',
                language: language,
                country: country,
                sortBy: 'popularity'
            }).then(async response => {
                articlesArray = response.articles;

                // Loops over articles and sends a max of 3
                for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                    title = articlesArray[i].title;
                    description = articlesArray[i].description;

                    await send(title, description, to);
                }

                // Sends default SMS if there are no news articles found
                if (articlesArray.length == 0) {
                    Vonage.sendSMS("There were no articles matching your requests, please try again", req.query.number);
                }

                // Creates search to be saved in DB
                const search = new Search({
                    date: dt.toDateString(),
                    q: keyword,
                    category: '',
                    language: language,
                    country: country,
                    articles: articlesArray
                });

                // Saves search in DB
                await search.save(err => {
                    if (err != null) {
                        console.log("Search was not saved");
                        console.log(err);
                    }
                });

            }).catch(err => {
                console.log("Could not fetch news articles");
                console.log(err);
            });


        } else {
            const search = await Search.findOne({
                date: dt.toDateString(),
                q: keyword,
                category: '',
                language: language,
                country: country
            }).catch(err => {
                console.log("There was an error retrieving search from database");
                console.log(err);
            });

            articlesArray = search.articles;

            // Loops over articles and sends a max of 3
            for (let i = 0; i < Math.min(articlesArray.length, 3); i++) {
                title = articlesArray[i].title;
                description = articlesArray[i].description;

                await send(title, description, to);
            }

            // Sends default SMS if there are no news articles found
            if (articlesArray.length == 0) {
                Vonage.sendSMS("There were no articles matching your requests, please try again", req.query.number);
            }
        }

    } catch (e) {
        console.log(e);
    }
};

// Checks if the search is already saved in the database
const checkDB = async (keyword, category, language, country) => {
    const exists = await Search.exists({
        date: dt.toDateString(),
        q: keyword,
        category: category,
        language: language,
        country: country
    }).catch(err => {
        console.log("Could not search database");
        console.log(err);
    });

    return exists;
}

// Helper to send the sms
const send = async (title, description, to) => {
    // Send Title
    Vonage.sendSMS(`Title: ${title}`, to);
    await delay(1500);
    // Send Summary
    Vonage.sendSMS(`Summary: ${description}`, to);
    await delay(1500);
    // Send Line Break
    Vonage.sendSMS(`- - - - -`, to);
    await delay(1500);
}


const delay = ms => new Promise(res => setTimeout(res, ms));