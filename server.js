const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 10000;
const SOURCE = "http://189.75.136.46:8000/playlist.m3u8";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });
    return res.end("PROXY HLS ONLINE");
  }

  const target = new URL(SOURCE);

  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "*/*",
      "Referer": "http://189.75.136.46:8000/"
    }
  };

  const request = http.request(options, (response) => {
    res.writeHead(response.statusCode || 502, {
      "Content-Type":
        response.headers["content-type"] ||
        "application/octet-stream",
      "Access-Control-Allow-Origin": "*"
    });

    response.pipe(res);
  });

  request.on("error", (error) => {
    res.writeHead(502, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    res.end("Erro na origem: " + error.message);
  });

  request.end();
});

server.listen(PORT, () => {
  console.log("Proxy HLS ativo na porta " + PORT);
});
