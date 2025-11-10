const http = require('http');

const PROXY_PORT = 8080;

// Simple JSON helper
function readJson(req, callback) {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(data || '{}'));
    } catch {
      callback({});
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {

    readJson(req, body => {
      const out = JSON.stringify(body || {});

      const options = {
        hostname: '127.0.0.1',
        port: 5678,
        path: '/webhook/data',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(out)
        }
      };

      const forward = http.request(options, r => {
        let responseData = '';
        r.on('data', chunk => responseData += chunk);
        r.on('end', () => {
          res.writeHead(r.statusCode || 200, {
            'Content-Type': 'application/json'
          });
          res.end(responseData);
        });
      });

      forward.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      forward.write(out);
      forward.end();
    });

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PROXY_PORT, () => {
  console.log('Pure Node proxy running on', PROXY_PORT);
});
