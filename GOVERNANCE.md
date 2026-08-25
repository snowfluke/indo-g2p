# Governance

`indo-g2p` is a small, single-purpose library. Governance is deliberately
lightweight, and this document says who decides what.

## Maintainers

| Handle                                     | Role            |
| ------------------------------------------ | --------------- |
| [@snowfluke](https://github.com/snowfluke) | Lead maintainer |

Maintainers are listed in [.github/CODEOWNERS](./.github/CODEOWNERS), which
drives automatic review requests.

## Roles and permissions

| Role        | May                             | Granted by           |
| ----------- | ------------------------------- | -------------------- |
| Contributor | Open issues and pull requests   | Anyone               |
| Triager     | Label, close, and reopen issues | A maintainer         |
| Maintainer  | Review, merge, and cut releases | Existing maintainers |

Only maintainers hold npm and JSR publish rights. Releases are published from
CI through OIDC trusted publishing, so no long-lived registry token exists.

## Granting escalated permissions

A contributor with a track record of merged, well-scoped pull requests may be
offered triager and then maintainer status. Any existing maintainer may
nominate; the lead maintainer confirms. Permissions are removed on request, or
after a long absence, and may be restored the same way.

## Decision making

Most decisions are made in the open on the relevant issue or pull request, by
lazy consensus: if nobody objects within a reasonable time, the change goes in.

Changes that affect published output need explicit maintainer approval, because
downstream text-to-speech pipelines depend on exact phoneme strings:

- Anything that alters `toPhoneme` output for existing input
- Adding, removing, or editing a rule in `data/homographs-verified.tsv`
- Regenerating any file under `src/data/`

Disagreements that lazy consensus cannot settle are decided by the lead
maintainer, who is expected to explain the reasoning in the thread.

## Changing this document

Open a pull request. Changes need approval from the lead maintainer.
