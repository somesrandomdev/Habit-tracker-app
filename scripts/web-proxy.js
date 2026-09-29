/**
 * Dev-only reverse proxy that adds COOP/COEP headers to every response.
 *
 * The Expo dev server serves the web app HTML without Cross-Origin-Opener-Policy /
 * Cross-Origin-Embedder-Policy, so the page is not cross-origin isolated and
 * SharedArrayBuffer is unavailable — which expo-sqlite's synchronous web API requires.
 *expo start` runs this on port 3000; native clients keep using 8081 directly.
 *
 * Usage: node scripts/web-proxy.js
 */
const http = require('http');
const net = require('net');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = process.env.TARGET_PORT || 8081;
const PROXY_PORT = process.env.PROXY_PORT || 3000;

const ISOLATION_HEADERS = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const server = http.createServer((req, res) => {
  const upstream = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
    },
    (upRes) => {
      const headers = { ...upRes.headers, ...ISOLATION_HEADERS };
      res.writeHead(upRes.statusCode ?? 502, upRes.statusMessage, headers);
      upRes.pipe(res);
    },
  );
  upstream.on('error', (error) => {
    res.writeHead(502, ISOLATION_HEADERS);
    res.end(`Proxy error: ${error.message}`);
  });
  req.pipe(upstream);
});

// Tunnel websocket upgrades (Metro HMR) straight through.
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST, () => {
    const requestLines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      requestLines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    }
    upstream.write(requestLines.join('\r\n') + '\r\n\r\n');
    if (head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(PROXY_PORT, () => {
  console.log(`FastHabit web proxy: http://localhost:${PROXY_PORT} -> http://localhost:${TARGET_PORT} (COOP/COEP headers injected)`);
});
