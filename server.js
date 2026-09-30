const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 10000;
const ORIGIN = "http://189.75.136.46:8000";
const ORIGIN_HOST = "189.75.136.46";

function proxyUrl(url) {
  return "/proxy?url=" + encodeURIComponent(url);
}

function rewritePlaylist(text, baseUrl) {
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return line;

    // Tags HLS que possuem URI="..."
    if (line.startsWith("#")) {
      return line.replace(/URI="([^"]+)"/g, (match, uri) => {
        const absolute = new URL(uri, baseUrl).toString();
        return `URI="${proxyUrl(absolute)}"`;
      });
    }

    // Segmentos ou sub-playlists
    const absolute = new URL(line.trim(), baseUrl).toString();
    return proxyUrl(absolute);
  }).join("\n");
}

function fetchOrigin(urlString, req, res) {
  let target;

  try {
    target = new URL(urlString);
  } catch {
    res.writeHead(400, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    return res.end("URL inválida");
  }

  // Permite somente o servidor da playlist
  if (
    target.hostname !== ORIGIN_HOST ||
    !["http:", "https:"].includes(target.protocol)
  ) {
    res.writeHead(403, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    return res.end("Origem não permitida");
  }

  const client = target.protocol === "https:" ? https : http;

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "*/*",
    "Referer": ORIGIN + "/"
  };

  // Suporte a requisições por faixa
  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  const request = client.request({
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: target.pathname + target.search,
    method: "GET",
    headers
  }, (response) => {

   
