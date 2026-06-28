#!/usr/bin/env node
/**
 * Agnes API Diagnostic — test all request format variations
 */
const axios = require("axios");
const KEY = "sk-NXYlKfhNEpYhkT0hPJOfInyNDPxUFs2RBlGKghYsi95hljeZ";
const BASE = "https://api.agnes-ai.com";

const models = ["deepseek-v4-pro", "deepseek-v4-pro".replace(/-/g, "_"), "gpt-4o", "claude-3-opus"];
const paths = ["/api/v1/chat/completions", "/v1/chat/completions", "/chat/completions"];
const authFormats = [
  { name: "Bearer", h: (k) => ({ Authorization: "Bearer " + k }) },
  { name: "Bearer-no-space", h: (k) => ({ Authorization: "Bearer" + k }) },
  { name: "Token", h: (k) => ({ Authorization: "Token " + k }) },
  { name: "x-api-key", h: (k) => ({ "x-api-key": k }) },
  { name: "X-API-Key", h: (k) => ({ "X-API-Key": k }) },
];

async function test(config) {
  const url = BASE + config.path;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...config.auth.h(KEY),
  };
  const body = {
    model: config.model,
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 10,
    stream: false,
  };

  try {
    const res = await axios.post(url, body, {
      headers,
      timeout: 15000,
      validateStatus: () => true,
    });
    return {
      status: res.status,
      statusText: res.statusText,
      body: JSON.stringify(res.data).slice(0, 300),
      headers: JSON.stringify(res.headers).slice(0, 200),
    };
  } catch (e) {
    return {
      status: e.response?.status || e.code,
      statusText: e.response?.statusText || e.message,
      body: JSON.stringify(e.response?.data || {}).slice(0, 300),
      headers: "",
    };
  }
}

(async () => {
  console.log("Agnes API Diagnostics\n" + "=".repeat(60) + "\n");

  // First: test all path/auth combinations with main model
  console.log("--- Phase 1: Path + Auth combinations ---");
  for (const path of paths) {
    for (const auth of authFormats) {
      const r = await test({ path, auth, model: "deepseek-v4-pro" });
      const marker = r.status === 200 ? "✅" : r.status === 401 ? "🔑" : r.status === 404 ? "🚫" : "❓";
      console.log(marker + " " + path + " | " + auth.name.padEnd(14) + " | " + r.status + " | " + r.body.slice(0, 80));
      if (r.status === 200) {
        console.log("\n*** SUCCESS! Full response body: ***");
        console.log(r.body);
        process.exit(0);
      }
    }
  }

  // Phase 2: try different models on the /api/v1 path that returned 401
  console.log("\n--- Phase 2: Model variations on /api/v1/chat/completions ---");
  for (const model of models) {
    const r = await test({ path: "/api/v1/chat/completions", auth: authFormats[0], model });
    console.log("Model: " + model.padEnd(24) + " | " + r.status + " | " + r.body.slice(0, 100));
  }

  // Phase 3: check if there's a /models or /health endpoint
  console.log("\n--- Phase 3: Discovery endpoints ---");
  const discoverEndpoints = ["/api/v1/models", "/v1/models", "/health", "/api/health", "/"];
  for (const ep of discoverEndpoints) {
    try {
      const url = BASE + ep;
      const res = await axios.get(url, {
        headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
        timeout: 10000,
        validateStatus: () => true,
      });
      console.log((res.status === 200 ? "✅" : "❓") + " GET " + ep + " -> " + res.status + " | " + JSON.stringify(res.data).slice(0, 200));
    } catch (e) {
      console.log("❌ GET " + ep + " -> " + (e.response?.status || e.code));
    }
  }

  // Phase 4: Try OpenAI-compatible format (different body structure)
  console.log("\n--- Phase 4: OpenAI-compatible body formats ---");
  const altBodies = [
    { messages: [{ role: "user", content: "Hi" }], max_tokens: 10 },
    { prompt: "Hi", max_tokens: 10 },
    { messages: [{ role: "user", content: "Hi" }], max_completion_tokens: 10 },
    { input: "Hi", parameters: { max_new_tokens: 10 } },
  ];
  for (const body of altBodies) {
    try {
      const res = await axios.post(BASE + "/api/v1/chat/completions", { model: "deepseek-v4-pro", ...body }, {
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
        timeout: 10000,
        validateStatus: () => true,
      });
      const txt = typeof res.data === "string" ? res.data.slice(0, 100) : JSON.stringify(res.data).slice(0, 100);
      console.log((res.status === 200 ? "✅" : "❓") + " " + res.status + " | " + txt);
    } catch (e) {
      console.log("❌ " + (e.response?.status || e.code));
    }
  }

  console.log("\nDone. If all 401: the API key needs account-level activation on the Agnes dashboard.");
  console.log("If any 200: update cruise.js with the winning combination.\n");
})();
