const http = require('http');
const httpProxy = require('http-proxy');

// 1. Get command line arguments (e.g., node proxy.js http://a.com [port])
const targetUrl = process.argv[2];
const port = process.argv[3] || 8010; // Default to 8010 if not provided

if (!targetUrl) {
    console.error('Error: Please provide a target URL argument.\nUsage: node proxy.js http://target-site.com [port]');
    process.exit(1);
}

console.log(`[CORS Proxy] Starting...`);
console.log(`[Target]  ${targetUrl}`);
console.log(`[Local]   http://localhost:${port}`);

// 2. Create proxy instance
const proxy = httpProxy.createProxyServer({});

// Error handling: Prevent local crash if target is down
proxy.on('error', (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    if (res.headersSent) { return; }
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
});

// 3. Core logic: Handle proxy response headers
// Even for forwarded GET/POST requests, we must ensure CORS headers are present
// so the browser accepts the response.
proxy.on('proxyRes', (proxyRes, req, res) => {
    const requestOrigin = req.headers.origin;

    // Forcefully override/add CORS headers to the response from the target
    if (requestOrigin) {
        proxyRes.headers['access-control-allow-origin'] = requestOrigin;
        proxyRes.headers['access-control-allow-credentials'] = 'true';
    }
});

// 4. Create server
const server = http.createServer((req, res) => {
    const requestOrigin = req.headers.origin;

    // --- Logging ---
    // Log every request with timestamp, method, and URL
    const time = new Date().toISOString().split('T')[1].split('.')[0]; // HH:mm:ss
    console.log(`[${time}] ${req.method} ${req.url}`);

    // --- Handle OPTIONS preflight requests ---
    if (req.method === 'OPTIONS') {
        // Reflect the Origin if present
        if (requestOrigin) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
            // Fallback for non-browser tools or weird cases
            res.setHeader('Access-Control-Allow-Origin', '*');
        }

        // Allow common methods and headers
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        // Allow whatever headers the client is asking for
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With');

        res.writeHead(200);
        res.end();
        return; // End OPTIONS request here, do not forward
    }

    // --- Handle normal requests (GET, POST, etc.) ---
    // 'changeOrigin: true' changes the Host header to the target's host.
    // This is critical for virtual hosts or CDNs.
    proxy.web(req, res, {
        target: targetUrl,
        changeOrigin: true,
        autoRewrite: true // Rewrite redirects (3xx) to local address
    });
});

server.listen(port, () => {
    console.log(`[Ready] Listening on port ${port}`);
});
