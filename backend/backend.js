const http = require('http');
const url = require("url");

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    let respJson = '{}';

    let path = url.parse(req.url).pathname;
    if (path === "/currency/rates" && req.method === "GET") {
        res.statusCode = 200;
        respJson = '{"hello": "world"}';
    }

    res.end(respJson + '\n');
});

server.listen(port, hostname, () => {
    console.log(`AcceptNano backend running at http://${hostname}:${port}/`);
});
