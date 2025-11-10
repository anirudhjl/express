const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());

// Manual proxy to n8n without any external library
app.post('/api/chat', (req, res) => {
  const body = JSON.stringify(req.body || {});

  const options = {
    hostname: '127.0.0.1',
    port: 5678,
    path: '/webhook/data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => (data += chunk));
    proxyRes.on('end', () => {
      try {
        res.set('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(data);
      } catch (err) {
        res.status(500).json({ error: 'Bad JSON from n8n' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  proxyReq.write(body);
  proxyReq.end();
});

app.listen(8080, () => {
  console.log('Proxy running on 8080');
});
