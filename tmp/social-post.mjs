import { Buffer } from 'node:buffer';

const MSG_TELEGRAM = `[Challenge] Implement CPS-0001 from spec — no source access

30–90 min · Any language · SHA-256 + Ed25519
3–5 developers wanted for blind implementation test.

github.com/myshapeprotocol/myshape-protocol
→ continuity-protocol/START_HERE.md`;

const MSG_BLUESKY = `Blind protocol test: can you implement CPS-0001 from spec alone?

Any language. SHA-256 + Ed25519. 30–90 min.
3–5 independent implementations wanted.
Pass or fail — both are data points.

github.com/myshapeprotocol/myshape-protocol`;

const MSG_DISCORD = `**[Challenge] Implement CPS-0001 from spec — no source access**

30–90 min · Any language · SHA-256 + Ed25519
3–5 developers wanted for blind implementation test.

https://github.com/myshapeprotocol/myshape-protocol
→ continuity-protocol/START_HERE.md`;

async function post(platform, url, opts) {
  try {
    const resp = await fetch(url, opts);
    const text = await resp.text();
    console.log(platform + ': ' + resp.status + ' ' + text.substring(0, 100));
    return true;
  } catch(e) {
    console.log(platform + ': FAIL — ' + e.message);
    return false;
  }
}

// Bluesky — auth then post
try {
  const authResp = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'myshapeprotocol.bsky.social', password: 'cw3a-3icz-mcfz-qf2g' })
  });
  const auth = await authResp.json();
  if (auth.accessJwt) {
    const now = new Date().toISOString();
    const record = {
      repo: auth.did,
      collection: 'app.bsky.feed.post',
      record: { text: MSG_BLUESKY, createdAt: now }
    };
    await post('Bluesky', 'https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth.accessJwt
      },
      body: JSON.stringify(record)
    });
  } else {
    console.log('Bluesky: AUTH FAILED — ' + JSON.stringify(auth).substring(0, 100));
  }
} catch(e) {
  console.log('Bluesky: AUTH ERROR — ' + e.message);
}

// Telegram
await post('Telegram', 'https://api.telegram.org/bot8725357641:AAFB1JR5IveHUEBDRQ51ZxrvKaRB0zfAeo8/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: '@myshapeprotocol', text: MSG_TELEGRAM })
});

// Discord
await post('Discord', 'https://discord.com/api/webhooks/1522608662001094716/wCjBu-4wkrG2kkRjx0POhutw2RX9iF0MBIhpcUYf_SuVXK_stCYipYUqDIrg4fBjbsjO', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: MSG_DISCORD })
});

console.log('Done');
