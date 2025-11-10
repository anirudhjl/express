// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

app.use(express.json());

// Proxy /api/chat -> n8n inside Docker
app.use(
  '/api/chat',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5678',
    changeOrigin: false,
    pathRewrite: { '^/api/chat': '/webhook/data' },
    onProxyReq(proxyReq, req) {
      if (req.body) {
        const body = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
        proxyReq.write(body);
      }
    }
  })
);

app.listen(PORT, () => {
  console.log('Express proxy running on port', PORT);
});
