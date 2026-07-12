#!/usr/bin/env node
/**
 * MyShape Protocol — HTTPS Development Proxy
 *
 * Usage: node scripts/https-dev-proxy.js [port] [https-port]
 * Default: proxies localhost:3000 → https://0.0.0.0:3443
 *
 * Required for iPhone testing — iOS requires HTTPS for DeviceMotionEvent.
 * Self-signed cert is auto-generated on first run.
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TARGET_PORT = parseInt(process.argv[2] || "3000", 10);
const HTTPS_PORT = parseInt(process.argv[3] || "3443", 10);
const CERT_DIR = path.join(__dirname, "..", ".certs");
const KEY_PATH = path.join(CERT_DIR, "key.pem");
const CERT_PATH = path.join(CERT_DIR, "cert.pem");

// ── Generate self-signed cert if missing ──

if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
  console.log("Generating self-signed certificate...");
  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -nodes -subj "//CN=localhost"`,
      { stdio: "pipe" }
    );
    console.log("Certificate generated.");
  } catch (e) {
    console.error("OpenSSL failed. Install OpenSSL or run: winget install OpenSSL.OpenSSL");
    process.exit(1);
  }
}

const cert = fs.readFileSync(CERT_PATH);
const key = fs.readFileSync(KEY_PATH);

// ── Start HTTPS proxy ──

https
  .createServer({ key, cert }, (req, res) => {
    const opts = {
      hostname: "127.0.0.1",
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxy = http.request(opts, (pres) => {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    });
    proxy.on("error", () => {
      res.writeHead(502);
      res.end("Backend not running. Start the Next.js server first.");
    });
    req.pipe(proxy);
  })
  .listen(HTTPS_PORT, "0.0.0.0", () => {
    const os = require("os");
    const ifaces = os.networkInterfaces();
    console.log("");
    console.log("  HTTPS Development Proxy");
    console.log("  ───────────────────────");
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          console.log(`  📱  https://${iface.address}:${HTTPS_PORT}/research/action-password`);
        }
      }
    }
    console.log("");
    console.log("  Safari: 'Show Details' → 'visit this website' to accept the cert.");
    console.log("  Ctrl+C to stop.");
    console.log("");
  });
