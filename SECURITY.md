# Security Policy

## Supported Versions

Only the latest published minor version receives security fixes. `indo-g2p`
follows semantic versioning; see [CHANGELOG.md](./CHANGELOG.md).

| Version        | Supported |
| -------------- | --------- |
| Latest minor   | Yes       |
| Anything older | No        |

## Reporting a Vulnerability

Report privately through GitHub's
[private vulnerability reporting](https://github.com/snowfluke/indo-g2p/security/advisories/new).
Do not open a public issue for a suspected vulnerability.

Include what you have: affected version, a reproduction, and the impact you
believe it has. You should get an acknowledgement within 7 days and an
assessment within 14.

## Scope

`indo-g2p` is a pure-computation library. It has no runtime dependencies, opens
no sockets, reads no files at runtime, spawns no processes, and executes no
code from its input. Its whole attack surface is the strings you pass in and
the strings it returns.

In scope:

- Input that causes unbounded memory growth, a hang, or a crash
- Any path that escapes pure computation, such as unexpected filesystem or
  network access
- A supply-chain problem in the published artifact, for example a tarball whose
  contents do not match this repository

Out of scope:

- Wrong phonemes. Incorrect output is a correctness bug, not a vulnerability.
  Open a normal issue.
- Vulnerabilities in development dependencies that never ship to consumers
- Denial of service that requires input the calling application controls and
  could bound itself

## Verifying a release

Every release is published from CI with npm provenance, so the tarball is
cryptographically linked to the workflow run and commit that produced it:

```bash
npm view indo-g2p --json | grep -A5 provenance
npm audit signatures
```

A CycloneDX SBOM is attached to each GitHub release as
`indo-g2p-sbom.cyclonedx.json`.

## Dependencies

The published package has no runtime dependencies. Development dependencies are
kept current by Dependabot and scanned on every pull request by OSV-Scanner;
CodeQL runs static analysis on every push to `main`.

## Vulnerability remediation policy

| Severity        | Target                             |
| --------------- | ---------------------------------- |
| Critical        | Patched and released within 7 days |
| High            | Within 14 days                     |
| Moderate or low | Next scheduled release             |

## Disclosure Policy

We aim to publish a GitHub Security Advisory once a fix is released. Reporters
are credited unless they ask not to be. We ask that you give us a reasonable
window to ship a fix before disclosing publicly.
