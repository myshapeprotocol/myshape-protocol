// PM2 daemon wrapper — First Node Alert Monitor
const { spawn } = require("child_process");

const child = spawn("npx", ["tsx", "daemon.ts", "--daemon", "60"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env },
  shell: true,
  windowsHide: true,
});

child.on("exit", (code) => {
  console.log("[first-node-alert] Exited with code", code);
});
