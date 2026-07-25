# Contributing to MyShape Protocol

Thanks for your interest in contributing! This project is a research-driven protocol with multiple contribution paths.

## Ways to Contribute

### 1. Protocol Implementations (CPS-0001)

The CPS-0001 standard is designed to be **engine-independent**. You can build:

- **Engine implementations** that produce CPS-0001 receipts from different sensor modalities
- **Verifier implementations** in other languages (the reference is in TypeScript with @noble/hashes)

See [continuity-protocol/IMPLEMENT.md](continuity-protocol/IMPLEMENT.md) for the complete implementation guide.

### 2. Research Contributions

We welcome research collaborations on:

- Entropy scoring models (PES improvements)
- Attack model validation (C0-C3)
- Cross-modal binding (camera + IMU + other sensors)
- Continuity failure conditions (CFCs)

See [docs/](docs/) for research papers and experimental designs.

### 3. Bug Reports & Feature Requests

- Use the issue templates (Bug Report / Feature Request)
- For security issues, follow [SECURITY.md](SECURITY.md)

## Development Setup

```bash
# Clone
git clone https://github.com/myshapeprotocol/myshape-protocol.git
cd myshape-protocol

# Install
npm install

# Run tests
npm test

# Run dev server
npm run dev
```

## Pull Request Process

1. Fork the repo and create your branch from `master`
2. Write tests for any new functionality (80%+ coverage target)
3. Ensure all tests pass (`npm test`)
4. Run the conformance suite if modifying protocol code
5. Update documentation as needed
6. Submit a PR using the pull request template

## Code Standards

- TypeScript `strict: true` — no implicit `any`, no `null`-unsafe operations
- Components: PascalCase files, explicit prop interfaces
- CSS: `@keyframes` go in `src/styles/animations.css` (single source)
- No hardcoded secrets — all keys from `process.env`, validated at runtime

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

## Questions?

Open a [Discussion](https://github.com/myshapeprotocol/myshape-protocol/discussions) or reach out to **research@thecontinuitylab.org**.
