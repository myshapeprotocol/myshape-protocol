import { NextResponse } from "next/server";

/**
 * POST /api/matrix/publish
 *
 * Dual-mode publish endpoint:
 * - Bluesky: full ATP protocol push via @atproto/api
 * - LinkedIn: placeholder (LinkedIn API v2 requires OAuth user token)
 * - LINK-type platforms are handled client-side (clipboard + window.open)
 *
 * Payload: { platform, content, title, url, publishType }
 */
export async function POST(request: Request) {
  try {
    const { platform, content, title, url } = await request.json();

    if (!platform || !content) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS: platform and content required" },
        { status: 400 },
      );
    }

    const result: Record<string, unknown> = {
      platform,
      title: title || "",
      content_length: content.length,
      timestamp: new Date().toISOString(),
    };

    // ── Bluesky ──
    if (platform === "bluesky") {
      const identifier = process.env.BLUESKY_IDENTIFIER || process.env.BLUESKY_HANDLE;
      const password = process.env.BLUESKY_PASSWORD;

      if (!identifier || !password) {
        result.status = "SKIPPED";
        result.error = "BLUESKY_CREDENTIALS_MISSING";
        console.log("[matrix/publish] Bluesky skipped — missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD");
        return NextResponse.json({ success: false, ...result });
      }

      try {
        // 自动检测代理
        let proxyUri = "http://127.0.0.1:15236";
        const { execSync } = await import("child_process");
        try {
          execSync('netstat -ano | findstr "127.0.0.1:7890.*LISTENING"', { timeout: 1000, stdio: "ignore" });
          proxyUri = "http://127.0.0.1:7890";
        } catch { /* VEE default */ }

        const { ProxyAgent, fetch: undiciFetch } = await import("undici");
        const dispatcher = new ProxyAgent(proxyUri);
        const bfetch = (url: string, init?: RequestInit) =>
          undiciFetch(url, { ...init, dispatcher } as Parameters<typeof undiciFetch>[1]);

        // ① 登录：POST /xrpc/com.atproto.server.createSession
        const loginRes = await bfetch(
          "https://bsky.social/xrpc/com.atproto.server.createSession",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }) },
        );
        if (!loginRes.ok) {
          const errText = await loginRes.text();
          throw new Error("Bluesky login failed: " + loginRes.status + " " + errText.slice(0, 100));
        }
        const session = await loginRes.json() as { accessJwt: string; did: string };

        // ② 发帖：POST /xrpc/com.atproto.repo.createRecord
        const truncated = content.length > 290 ? content.slice(0, 287) + "..." : content;
        const postBody = {
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: { text: truncated, createdAt: new Date().toISOString() },
        };
        const postRes = await bfetch(
          "https://bsky.social/xrpc/com.atproto.repo.createRecord",
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.accessJwt }, body: JSON.stringify(postBody) },
        );
        if (!postRes.ok) {
          const errText = await postRes.text();
          throw new Error("Bluesky post failed: " + postRes.status + " " + errText.slice(0, 100));
        }
        const postData = await postRes.json() as { uri: string; cid: string };

        result.status = "PUBLISHED";
        result.platform_post_id = postData.uri;
        console.log("[matrix/publish] Bluesky published:", postData.uri);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown Bluesky error";
        result.status = "FAILED";
        result.error = msg;
        console.error("[matrix/publish] Bluesky error:", msg);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── LinkedIn ──
    if (platform === "linkedin") {
      const userToken = process.env.LINKEDIN_USER_ACCESS_TOKEN;

      if (!userToken) {
        result.status = "SKIPPED";
        result.error = "LINKEDIN_USER_ACCESS_TOKEN not configured. Run /api/matrix/auth/linkedin to authorize.";
        console.log("[matrix/publish] LinkedIn skipped — no user access token");
        return NextResponse.json({ success: false, ...result });
      }

      try {
        // Get user info to find the member URN
        const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: "Bearer " + userToken },
        });
        if (!meRes.ok) throw new Error("LinkedIn userinfo failed: " + meRes.status);
        const me = await meRes.json() as { sub: string };
        const memberUrn = `urn:li:person:${me.sub}`;

        // Post using /v2/posts (LinkedIn Community Management API)
        const postBody = {
          author: memberUrn,
          commentary: content,
          visibility: "PUBLIC",
          distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        };

        const postRes = await fetch("https://api.linkedin.com/v2/posts", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + userToken,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202406",
          },
          body: JSON.stringify(postBody),
        });

        if (!postRes.ok) {
          const errText = await postRes.text();
          throw new Error("LinkedIn post failed: " + postRes.status + " " + errText.slice(0, 200));
        }

        const postId = postRes.headers.get("x-restli-id") || "unknown";
        result.status = "PUBLISHED";
        result.platform_post_id = postId;
        console.log("[matrix/publish] LinkedIn published:", postId);
        return NextResponse.json({ success: true, ...result });

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown LinkedIn error";
        result.status = "FAILED";
        result.error = msg;
        console.error("[matrix/publish] LinkedIn error:", msg);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── Farcaster ──
    if (platform === "farcaster") {
      const apiKey = process.env.NEYNAR_API_KEY;
      const signerUuid = process.env.FARCASTER_SIGNER_UUID;
      if (!apiKey || !signerUuid) {
        result.status = "SKIPPED";
        result.error = "FARCASTER_CREDENTIALS_MISSING (NEYNAR_API_KEY + FARCASTER_SIGNER_UUID in .env.local)";
        console.log("[matrix/publish] Farcaster skipped — missing credentials");
        return NextResponse.json({ success: false, ...result });
      }
      try {
        const castRes = await fetch("https://api.neynar.com/v2/farcaster/cast", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api_key": apiKey },
          body: JSON.stringify({ signer_uuid: signerUuid, text: content.slice(0, 320) }),
        });
        if (!castRes.ok) throw new Error("Farcaster: " + castRes.status + " " + (await castRes.text()).slice(0, 100));
        const castData = await castRes.json() as { cast?: { hash?: string } };
        result.status = "PUBLISHED";
        result.platform_post_id = castData.cast?.hash || "unknown";
        console.log("[matrix/publish] Farcaster published:", result.platform_post_id);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        result.status = "FAILED";
        result.error = err instanceof Error ? err.message : "Farcaster error";
        console.error("[matrix/publish] Farcaster error:", result.error);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── Discord ──
    if (platform === "discord") {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        result.status = "SKIPPED";
        result.error = "DISCORD_WEBHOOK_URL not configured in .env.local";
        console.log("[matrix/publish] Discord skipped — missing webhook URL");
        return NextResponse.json({ success: false, ...result });
      }
      try {
        const dcRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.slice(0, 2000), username: "MyShape Protocol" }),
        });
        if (!dcRes.ok) throw new Error("Discord: " + dcRes.status);
        result.status = "PUBLISHED";
        console.log("[matrix/publish] Discord published");
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        result.status = "FAILED";
        result.error = err instanceof Error ? err.message : "Discord error";
        console.error("[matrix/publish] Discord error:", result.error);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── Telegram ──
    if (platform === "telegram") {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !chatId) {
        result.status = "SKIPPED";
        result.error = "TELEGRAM_CREDENTIALS_MISSING (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env.local)";
        console.log("[matrix/publish] Telegram skipped — missing credentials");
        return NextResponse.json({ success: false, ...result });
      }
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: content.slice(0, 4096), parse_mode: "Markdown" }),
        });
        if (!tgRes.ok) throw new Error("Telegram: " + tgRes.status + " " + (await tgRes.text()).slice(0, 100));
        result.status = "PUBLISHED";
        console.log("[matrix/publish] Telegram published");
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        result.status = "FAILED";
        result.error = err instanceof Error ? err.message : "Telegram error";
        console.error("[matrix/publish] Telegram error:", result.error);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── Reddit ──
    if (platform === "reddit") {
      const clientId = process.env.REDDIT_CLIENT_ID;
      const clientSecret = process.env.REDDIT_CLIENT_SECRET;
      const username = process.env.REDDIT_USERNAME;
      const password = process.env.REDDIT_PASSWORD;
      if (!clientId || !clientSecret || !username || !password) {
        result.status = "SKIPPED";
        result.error = "REDDIT_CREDENTIALS_MISSING (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD)";
        console.log("[matrix/publish] Reddit skipped — missing credentials");
        return NextResponse.json({ success: false, ...result });
      }
      try {
        // ① Get access token (password grant for script apps)
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        });
        if (!tokenRes.ok) throw new Error("Reddit auth failed: " + tokenRes.status);
        const tokenData = await tokenRes.json() as { access_token?: string };
        if (!tokenData.access_token) throw new Error("Reddit: no access token returned");

        // ② Submit post to user's profile (r/u_username)
        const subreddit = process.env.REDDIT_SUBREDDIT || `u_${username}`;
        const postRes = await fetch(`https://oauth.reddit.com/api/submit`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MyShapeProtocol/1.0" },
          body: `sr=${subreddit}&title=${encodeURIComponent(title || "MyShape Protocol Update")}&kind=self&text=${encodeURIComponent(content.slice(0, 40000))}`,
        });
        if (!postRes.ok) throw new Error("Reddit post failed: " + postRes.status + " " + (await postRes.text()).slice(0, 100));
        const postData = await postRes.json() as { json?: { data?: { id?: string } } };
        result.status = "PUBLISHED";
        result.platform_post_id = postData.json?.data?.id || "unknown";
        console.log("[matrix/publish] Reddit published:", result.platform_post_id);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        result.status = "FAILED";
        result.error = err instanceof Error ? err.message : "Reddit error";
        console.error("[matrix/publish] Reddit error:", result.error);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── X (Twitter) ──
    if (platform === "x" || platform === "twitter") {
      const apiKey = process.env.X_API_KEY;
      const apiSecret = process.env.X_API_SECRET;
      const accessToken = process.env.X_ACCESS_TOKEN;
      const accessSecret = process.env.X_ACCESS_SECRET;

      if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        result.status = "SKIPPED";
        result.error = "X_CREDENTIALS_MISSING (X_API_KEY + X_API_SECRET + X_ACCESS_TOKEN + X_ACCESS_SECRET)";
        console.log("[matrix/publish] X/Twitter skipped — missing credentials");
        return NextResponse.json({ success: false, ...result });
      }

      try {
        // Auto-detect proxy
        let proxyUri = "http://127.0.0.1:15236";
        const { execSync } = await import("child_process");
        try {
          execSync('netstat -ano | findstr "127.0.0.1:7890.*LISTENING"', { timeout: 1000, stdio: "ignore" });
          proxyUri = "http://127.0.0.1:7890";
        } catch { /* VEE default */ }

        const { TwitterApi } = await import("twitter-api-v2");
        const { ProxyAgent, fetch: undiciFetch } = await import("undici");
        const dispatcher = new ProxyAgent(proxyUri);

        // Override global fetch for twitter.com requests to go through proxy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const origFetch = (globalThis as any).fetch;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).fetch = (url: string, init?: RequestInit) => {
          if (typeof url === "string" && url.includes("twitter.com")) {
            return undiciFetch(url, { ...init, dispatcher } as never) as unknown as Response;
          }
          return origFetch(url, init);
        };

        const client = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessSecret,
        });

        const truncated = content.length > 270 ? content.slice(0, 267) + "..." : content;
        const tweet = await client.v2.tweet(truncated);

        result.status = "PUBLISHED";
        result.platform_post_id = tweet.data.id;
        console.log("[matrix/publish] X/Twitter published:", tweet.data.id);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown X/Twitter error";
        result.status = "FAILED";
        result.error = msg;
        console.error("[matrix/publish] X/Twitter error:", msg);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── Unknown / LINK-type platforms ──
    result.status = "PREVIEW";
    result.note = "LINK-type platform — handled client-side via clipboard + window.open";
    console.log("[matrix/publish] Preview for", platform, ":", JSON.stringify({ title, content_length: content.length }));
    return NextResponse.json({ success: true, ...result });

  } catch (err) {
    console.error("[matrix/publish] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
