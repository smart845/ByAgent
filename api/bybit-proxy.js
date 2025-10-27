// api/bybit-proxy.js
export default async function handler(req, res) {
  try {
    const endpoint = req.url.replace(/^\/api\/bybit-proxy/, '');
    const url = `https://api.bybit.com${endpoint}`;

    const bybitRes = await fetch(url, { method: 'GET' });
    const data = await bybitRes.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
}
