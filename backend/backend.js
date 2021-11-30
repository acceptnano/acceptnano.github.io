const http = require('http');
const https = require('https');
const url = require('url');
const currencies = require('./currencies.json');

const hostname = '0.0.0.0';
const port = 3000;

let exchangeRates = null;
let exchangeRatesLastRefresh = new Date(0);

function errorResponse(res) {
    res.statusCode = 500;
    res.end('{}\n');
}

function currencyRatesResponse(res, resObj, refreshOnly) {
    res.statusCode = 200;
    if (refreshOnly) {
        res.end('{}\n');
        return;
    }

    let jsonString = JSON.stringify(resObj);
    res.end(jsonString);
}

function getCurrencyRates(inReq, inRes) {

    let parsedUrl = url.parse(inReq.url, true)
    const refreshOnly = 'refresh' in parsedUrl.query
    const now = new Date();
    const hoursSince = Math.abs(exchangeRatesLastRefresh - now) / (60*60*1000);
    if (!refreshOnly && hoursSince < 1) {
        currencyRatesResponse(inRes, exchangeRates, refreshOnly)
        return;
    }

    console.log("refreshing FIAT exchange rates")
    const options = {
        hostname: 'api.exchangerate.host',
        path: '/latest?base=USD',
    }

    https.get(options, res => {
        let json = '';
        res.on('data', function (chunk) {
            json += chunk;
        });

        res.on('end', function () {
            if (res.statusCode === 200) {
                try {
                    inRes.statusCode = 200;
                    exchangeRates = JSON.parse(json);
                    exchangeRatesLastRefresh = new Date();
                    currencyRatesResponse(inRes, exchangeRates, refreshOnly);
                } catch (e) {
                    console.log('Error parsing JSON!' + e);
                    errorResponse(inRes);
                }
            } else {
                console.log('Status:', res.statusCode);
                errorResponse(inRes);
            }
        });

    }).on('error', function (err) {
        console.log('Error:', err);
        errorResponse(inRes);
    });
}

const server = http.createServer((req, res) => {
    let parsedUrl = url.parse(req.url)
    let path = parsedUrl.pathname;
    res.setHeader('Content-Type', 'application/json');

    if (path === "/currency/rates" && req.method === "GET") {
        getCurrencyRates(req, res);
        return;
    }

    res.statusCode = 404;
    res.end('{}\n');
});

server.listen(port, hostname, () => {
    console.log(`AcceptNano backend running at http://${hostname}:${port}/`);
});