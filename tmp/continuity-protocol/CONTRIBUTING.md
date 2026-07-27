# Contributing

## Ways to Contribute

### Implement CPS-0001

The protocol is engine-independent. Build a compatible producer or verifier in any language.

→ [IMPLEMENT.md](IMPLEMENT.md)

### Report Issues

- Bug reports → [Issue tracker](https://github.com/ContinuityLab-Org/continuity-protocol/issues/new/choose)
- Security issues → [SECURITY.md](SECURITY.md)

### Improve the Protocol

- Open a discussion for semantic changes
- Submit PRs for bug fixes, test vector additions, or documentation

## Conformance

Any implementation claiming CPS-0001 compatibility must pass the conformance suite:

```bash
npx vitest run continuity-protocol/conformance/
```

## License

Apache 2.0. By contributing, you agree to license your work under the same terms.
