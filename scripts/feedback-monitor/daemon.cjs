// PM2 daemon wrapper — Feedback Monitor
const { spawn } = require("child_process");
const path = require("path");

const tsx = path.join(__dirname, "node_modules", ".bin", "tsx");
const child = spawn(tsx, ["src/index.ts", "--daemon"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env },
  shell: true,
  windowsHide: true,
});

child.on("exit", (code) => {
  console.log("[daemon] Feedback monitor exited with code", code);
});
