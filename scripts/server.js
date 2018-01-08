/* eslint no-console: "off" */

const http = require('http');
const portscanner = require('portscanner');
const nodeStatic = require('node-static');

const files = new nodeStatic.Server(process.cwd(), {cache: false});

const server = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-cache,must-revalidate');

  request.addListener('end', () => {
    files.serve(request, response, (err) => {
      if (err) {
        response.writeHead(err.status, err.headers);
        response.end('Not Found');
      }

      console.log([
        (new Date()).toISOString(),
        `[${response.statusCode}]`,
        request.url
      ].join(' '));
    });
  }).resume();
});

portscanner.findAPortNotInUse(9999, 10999).then((port) => {
  server.listen(port, '0.0.0.0');
  console.log(`serving "." at http://0.0.0.0:${port}`);
}).catch((err) => {
  console.log('could not find an open port: ', err);
  process.exit(1);
});
