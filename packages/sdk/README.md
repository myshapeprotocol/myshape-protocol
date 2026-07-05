# @myshapeprotocol/sdk

MyShape Protocol SDK — integrate sovereign identity verification in 5 lines of code.

```bash
npm install @myshapeprotocol/sdk
```

## Quick Start

```typescript
import { MyShapeClient } from '@myshapeprotocol/sdk';

const client = new MyShapeClient({ apiKey: 'ms_live_...' });

// 1. Capture motion (use your own camera pipeline)
const motion = await captureMotionFromCamera();

// 2. Verify presence — WASM-powered, all on-device
const result = await client.verifyPresence(motion, 'medium');

console.log(result.valid
  ? `✅ Human present (PES: ${result.pes.toFixed(3)})`
  : `❌ ${result.rejectionReason}`
);
```

## Features

- **On-device verification** — WASM engine runs entirely in the browser
- **Zero data upload** — raw motion data never leaves the device
- **ZK-presence proof** — ~250 byte proof, verifiable in <10ms
- **Calibration-aware** — population statistics for sub-1% EER
- **5 lines of code** — designed for rapid integration

## API Reference

### `new MyShapeClient(config)`

| Param | Type | Description |
|:---|:---|:---|
| `config.apiKey` | `string` | Your MyShape API key |
| `config.baseUrl` | `string?` | API base URL (default: `https://api.myshape.com`) |

### `client.verifyPresence(motion, riskLevel?)`

Verify human presence from a motion sequence.

| Param | Type | Default | Description |
|:---|:---|:---|:---|
| `motion` | `MotionSequence` | — | Motion data from camera capture |
| `riskLevel` | `"low" \| "medium" \| "high"` | `"medium"` | FAR tolerance |

Returns `Promise<VerificationResult>`.

### `client.createEnrollment(samples, userId, device)`

Create an enrollment from multiple motion samples (3-5 recommended).

Returns `Promise<Enrollment>` — store this server-side.

### `client.validate(enrollmentId, proof)`

Server-side validation of a presence proof.

Returns `Promise<ValidateResponse>`.

## Browser Support

| Chrome | Firefox | Safari | Edge |
|:---|:---|:---|:---|
| 90+ | 90+ | 15+ | 90+ |

Requires WebAssembly and `crypto.getRandomValues()`.

## License

MIT
