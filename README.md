const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(express.json());

// Proxy browser -> n8n(localhost)
app.use('/api/chat', createProxyMiddleware({
  target: 'http://127.0.0.1:5678',
  changeOrigin: false,
  pathRewrite: { '^/api/chat': '/webhook/data' },
}));

// Simple health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(8080, () => console.log('Proxy listening on 8080'));
