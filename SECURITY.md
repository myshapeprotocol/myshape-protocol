# Security Policy

## Reporting a Vulnerability

The MyShape Protocol project takes security seriously. We appreciate responsible disclosure of security vulnerabilities.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

📧 **security@thecontinuitylab.org**

You should receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity, and we will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous).

## Scope

Security issues in the following areas are in scope:

- **CPS-0001 Protocol**: Receipt verification logic, signature validation, replay protection
- **PES Engine**: Entropy scoring, threat assessment, attack model bypasses
- **SDK v2**: `verify()`, `getReceipt()`, `checkContinuity()` interfaces
- **API Endpoints**: Verification endpoints, rate limiter bypasses
- **Cryptography**: Ed25519 implementation misuse, hash collision vectors

## Out of Scope

- Issues in dependencies that are not specific to our usage (report these upstream)
- Theoretical attacks that require physical device access
- Social engineering attacks
- DOS attacks that don't bypass rate limiting

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| v1.0-RC | ✅ Full support    |
| < v1.0   | ❌ No longer supported |

## Disclosure Policy

- Reporter submits vulnerability via email
- We acknowledge receipt within 48 hours
- We investigate and develop a fix
- We release the fix and publish a security advisory
- We credit the reporter (unless anonymity requested)

## Security Advisories

Published security advisories will be available in the [Security Advisories](https://github.com/myshapeprotocol/myshape-protocol/security/advisories) section of this repository.
