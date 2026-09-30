const http = require("http");

const PORT = process.env.PORT || 10000;
const ORIGIN = "http://189.75.136.46:8000";

function proxy(url, req, res) {
  const u = new URL(url);

  const r = http.request({
    hostname: u.hostname,
    port: u.port,
    path: u.pathname + u.search,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": ORIGIN + "/",
      "Range": req.headers.range || ""
    }
  }, response => {

    let type = response.headers["content-type"] || "";

    if (u.pathname.endsWith(".m3u8") || type.includes("mpegurl")) {
      let data = "";

      response.setEncoding("utf8");

      response.on("data", x => data += x);

      response.on("end", () => {
        data = data.split(/\r?\n/).map(line => {

          if (!line || line.startsWith("#")) {
            return line.replace(/URI="([^"]+)"/g, (m, x) =>
              `URI="/proxy?url=${encodeURIComponent(new URL(x, u).href)}"`
            );
          }

          return "/proxy?url=" +
            encodeURIComponent(new URL(line, u).href);

        }).join("\n");

        res.writeHead(response.statusCode || 200, {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*"
        });

        res.end(data);
      });

      return;
    }

    res.writeHead(response.statusCode || 200, {
      "Content-Type": type || "application/octet-stream",
      "Access-Control-Allow-Origin": "*"
    });

    response.pipe(res);
  });

  r.on("error", e => {
    res.writeHead(502, {
      "Access-Control-Allow-Origin": "*"
    });

    res.end("Erro: " + e.message);
  });

  r.end();
}

const server = http.createServer((req, res) => {

  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    return res.end("PROXY HLS ONLINE");
  }

  if (req.url === "/" || req.url === "/playlist.m3u8") {
    return proxy(ORIGIN + "/playlist.m3u8", req, res);
  }

  if (req.url.startsWith("/proxy?url=")) {
    const u = new URL(req.url, "http://localhost");
    return proxy(u.searchParams.get("url"), req, res);
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("PROXY HLS ONLINE");
});
