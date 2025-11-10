// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 8080;

// ======== CONFIG YOU EDIT ========
const CHAT_TOKEN = process.env.CHAT_TOKEN || 'replace-me';
const WEBHOOK_PATH = process.env.N8N_WEBHOOK_PATH || 'data'; 
// if your node path is /webhook/data, put 'data'. For test webhook, use 'webhook-test/data' temporarily.
// =================================

app.set('trust proxy', 1);          // Cloud Shell / IAP friendly
app.use(helmet());
app.use(morgan('tiny'));

// ---- CORS (only needed if your UI is on a different origin, e.g., localhost:3000) ----
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // add your Cloud Shell preview origin exactly as shown in the browser's address bar:
  // e.g. 'https://1234-8080.cs-asia-southeast1-bool.cloudshell.dev'
  process.env.ALLOW_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);               // same-origin or curl
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked for origin: ' + origin));
  },
  credentials: true                                    // allow cookies/headers for IAP
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Simple auth so your API isn’t open if someone learns the preview URL ----
app.use((req, res, next) => {
  const t = req.header('x-chat-token') || req.query.token; // allow ?token= for quick tests
  if (!t || t !== CHAT_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
});

// ---- Rate limiting (optional but recommended) ----
const limiter = new RateLimiterMemory({ points: 20, duration: 10 });
app.use(async (req, res, next) => {
  try { await limiter.consume(req.ip); next(); }
  catch { res.status(429).json({ error: 'too many requests' }); }
});

// ---- Proxy: /api/chat -> n8n local webhook ----
// Use the PRODUCTION webhook path when the workflow is active.
// For a test webhook, temporarily change pathRewrite to '/webhook-test/<path>'
app.use('/api/chat', createProxyMiddleware({
  target: 'http://127.0.0.1:5678',
  changeOrigin: false,
  xfwd: true,
  // IMPORTANT: stay on localhost, avoid cloudshell.dev URLs entirely
  pathRewrite: (path, req) => {
    return `/webhook/${WEBHOOK_PATH}`;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Ensure JSON content-type when forwarding
    if (!proxyReq.getHeader('content-type')) {
      proxyReq.setHeader('content-type', 'application/json');
    }
  }
}));

// ---- Static UI on same origin (recommended) ----
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`UI/Proxy on ${PORT}`));
