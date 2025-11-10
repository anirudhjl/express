// Minimal proxy that avoids Cloud Shell Google sign-in
// Node 18+ has global fetch

const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;
// n8n local base (do NOT use the cloudshell.dev URL)
const N8N_BASE = process.env.N8N_BASE || 'http://127.0.0.1:5678';
// your production webhook path from the node
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook/data';

app.use(express.json({ limit: '2mb' }));

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// chat endpoint your UI will call
app.post('/api/chat', async (req, res) => {
  try {
    const r = await fetch(`${N8N_BASE}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body ?? {})
    });

    // pass through status and body as json/text
    const ct = r.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await r.json() : await r.text();
    res.status(r.status);
    if (typeof body === 'string') res.send(body);
    else res.json(body);
  } catch (e) {
    res.status(502).json({ error: 'proxy_failed', detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on ${PORT}`);
});
