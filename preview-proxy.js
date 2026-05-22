// Tiny reverse proxy: forwards all requests to FastAPI on port 8000
const http = require("http");

const TARGET_PORT = 8000;
const PROXY_PORT = 5174;

const server = http.createServer((req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on("error", (err) => {
    res.writeHead(502);
    res.end(`Backend not reachable: ${err.message}\nMake sure FastAPI is running on port ${TARGET_PORT}`);
  });

  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`Designpipe proxy listening on http://localhost:${PROXY_PORT} → http://localhost:${TARGET_PORT}`);
});
