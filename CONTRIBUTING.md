# Contributing to indo-g2p

Thanks for taking the time. This is a small library with one job: turn
Indonesian text into phonemes, exactly the way the upstream Python
implementation does.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [The parity contract](#the-parity-contract)
- [Making Changes](#making-changes)
- [Homograph rules](#homograph-rules)
- [Regenerating model data](#regenerating-model-data)
- [Code Quality](#code-quality)
- [Developer Certificate of Origin](#developer-certificate-of-origin)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Cutting a release](#cutting-a-release)
- [Reporting Issues](#reporting-issues)

## Getting Started

Good first contributions:

- A failing test for a word that comes out wrong
- A homograph rule with a citable source (see [below](#homograph-rules))
- Documentation that was unclear when you first read it

## Development Setup

Requires [Bun](https://bun.sh). Python 3.11+ is only needed to regenerate model
data, which is rare.

```bash
git clone https://github.com/snowfluke/indo-g2p.git
cd indo-g2p
bun install
bun test
```

The full gate, which is what CI runs:

```bash
bun run fmt          # oxfmt --check
bun run lint         # oxlint
bun run type-check   # tsc --noEmit
bun test
bun run build        # emits lib/ for npm
```

## The parity contract

`toPhoneme(...).phonemes` must match
[Wikidepia/g2p-id](https://github.com/Wikidepia/g2p-id) byte for byte on its
default settings. `tests/fixtures/parity.json` holds 886 recorded input/output
pairs from the Python original, and `tests/parity.test.ts` asserts every one.

`syllables` is the documented exception. Upstream feeds the CRF a schwa it was
never trained on, which suppresses boundary prediction; this port folds `ə` to
`e` for tagging. That divergence is pinned by property assertions rather than
by upstream's strings. Widening it needs the same sign-off as any other output
change.

If your change alters that output, the parity tests will fail. That is the
tests working, not a flake. Either fix the change, or make a deliberate case in
the pull request for why the port should diverge, and update the fixtures with
`scripts/dump-fixtures.py`.

Opt-in behaviour, such as `resolveSchwa`, sits outside the contract because it
is off by default.

## Making Changes

Branch from `main`, keep the change focused, and add a test that fails without
it.

What we accept:

- Bug fixes with a regression test
- Homograph rules backed by a source
- Performance work with numbers in the pull request
- Documentation and typing improvements

What we are cautious about:

- New dependencies. The package has none at runtime and that is a feature.
- Anything that changes default `toPhoneme` output.
- New public API. Two ways to do one thing is worse than one.

## Homograph rules

There are two tables. `data/homographs-verified.tsv` holds the readings, and
every row needs evidence. `data/homographs-collocations.tsv` holds the trigger
words that select a non-default reading; those are ordinary collocations
rather than dictionary data, so they need a speaker's judgement and a test.

A trigger that also occurs around the other sense is a bug: `pagi` was dropped
from `apel` because _makan apel setiap pagi_ is fruit, not a roll call.

The readings themselves still need a source. The bar is a source that marks the pepet vowel explicitly, such as
the Indonesian entry on [en.wiktionary.org](https://en.wiktionary.org), where
`ê` is `/ə/` while `é` and `è` are not.

A rule also has to survive contact with the tagger. `tests/no-regression.test.ts`
holds a natural sentence for the common sense of every rule and asserts the
resolver leaves it alone. A linguistically correct rule that the tagger
misfires on does not ship; see `pening` in
[docs/homograph-review.md](./docs/homograph-review.md) for a worked example.

`scripts/verify-homographs.py` re-runs the whole audit against Wiktionary and
prints a verdict per word, so the shipped set is reproducible rather than
asserted. Note that KBBI publishes no pronunciation field, so it cannot settle
a schwa question.

After editing the table:

```bash
python3 scripts/dump-pos.py .        # regenerates src/data/homographs.ts
bun scripts/gen-homograph-doc.ts     # regenerates docs/homograph-review.md
bun test
```

## Regenerating model data

Everything under `src/data/` is generated and should never be hand-edited. The
generators are dev-only and need a checkout of the upstream project:

```bash
uv run --with python-crfsuite scripts/dump-model.py    ../g2p-id
uv run --with python-crfsuite scripts/dump-fixtures.py ../g2p-id
python3 scripts/dump-pos.py .
```

## Code Quality

- TypeScript strict mode, no `any`, no non-null assertions, no unsafe casts.
- Every exported symbol needs an explicit type and a JSDoc comment. JSR scores
  this, and `bunx jsr publish --dry-run` fails on slow types.
- Source files are capped at 300 lines, excluding blanks and comments. Split
  into focused modules past that. Generated data files are exempt.
- Every file carries an `SPDX-License-Identifier: MIT` header.
- The [anti-slop](https://github.com/dmmulroy/anti-slop) oxlint rules are on.
  They reject the patterns a tired author reaches for when unsure of a type:
  widening a value you already know, `unknown` in a signature, `Reflect.get`,
  runtime `typeof` narrowing, and assertions without a `SAFETY:` comment. Fix
  the type rather than the lint.
- Comments explain why, not what.

## Developer Certificate of Origin

Contributions are accepted under the [DCO](https://developercertificate.org/).
Sign off each commit to certify you wrote the patch or have the right to submit
it:

```bash
git commit -s -m "fix: keep the dictionary reading of pening"
```

## Submitting a Pull Request

1. Run the full gate above. CI runs the same commands.
2. Use [Conventional Commits](https://www.conventionalcommits.org) for the
   title: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `perf:`,
   `ci:`, `style:`, `build:`, `revert:`.
3. Fill in the pull request template. Say what changed and why.
4. Keep `package.json` and `jsr.json` versions in lockstep. The pre-commit hook
   checks this, along with `src/version.ts`.

## Cutting a release

Maintainers only:

```bash
bun scripts/bump.ts patch    # or minor, major
# fill in the CHANGELOG entry, commit, tag, and publish the GitHub release
```

Publishing to npm and JSR happens in CI on a published release, with provenance
and an attached SBOM. See [GOVERNANCE.md](./GOVERNANCE.md).

## Reporting Issues

Use the issue templates. For a wrong pronunciation, include the input text, the
output you got, the output you expected, and a source for the expected reading
if you have one.

Security reports go through [SECURITY.md](./SECURITY.md), not the issue tracker.
