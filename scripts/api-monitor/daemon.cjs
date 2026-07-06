// PM2 daemon wrapper — API Error Monitor
const { spawn } = require("child_process");

const child = spawn("npx", ["tsx", "index.ts", "--daemon", "60"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env },
  shell: true,
  windowsHide: true,
});

child.on("exit", (code) => {
  console.log("[api-monitor] Exited with code", code);
});
