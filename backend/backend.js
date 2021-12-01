const http = require('http');
const https = require('https');
const url = require('url');
const currencies = require('./currencies.json');

const hostname = '0.0.0.0';
const port = 3000;

let exchangeRates = null;
let exchangeRatesLastRefresh = new Date(0);

let nanoRate = null;
let nanoRateLastRefresh = new Date(0);

function errorResponse(res) {
    res.statusCode = 500;
    res.end('{}\n');
}

function objectResponse(res, resObj, refreshOnly) {
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
        objectResponse(inRes, exchangeRates, refreshOnly)
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
                    objectResponse(inRes, exchangeRates, refreshOnly);
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

function getNanoRate(inReq, inRes) {
    let parsedUrl = url.parse(inReq.url, true)
    const refreshOnly = 'refresh' in parsedUrl.query
    const now = new Date();
    const minutesSince = Math.abs(nanoRateLastRefresh - now) / (60*1000);
    if (!refreshOnly && minutesSince < 5) {
        objectResponse(inRes, nanoRate, false)
        return;
    }

    console.log("refreshing NANO exchange rates")
    const options = {
        hostname: 'api.coingecko.com',
        path: '/api/v3/simple/price?ids=NANO&vs_currencies=USD',
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
                    nanoRate = JSON.parse(json);
                    nanoRateLastRefresh = new Date();
                    objectResponse(inRes, nanoRate, refreshOnly);
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
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (path === "/currency/rates" && req.method === "GET") {
        getCurrencyRates(req, res);
        return;
    } else if (path === "/currency/nano" && req.method === "GET") {
        getNanoRate(req, res);
        return;
    }

    res.statusCode = 404;
    res.end('{}\n');
});

server.listen(port, hostname, () => {
    console.log(`AcceptNano backend running at http://${hostname}:${port}/`);
});