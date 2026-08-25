# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions are published to npm as `indo-g2p` and to JSR as `@snowfluke/indo-g2p`
from the same tag. `bun scripts/bump.ts patch|minor|major` keeps package.json,
jsr.json and `src/version.ts` in lockstep; the pre-commit hook rejects drift.

## [0.1.2] - 2026-08-25

Supply chain and correctness of the packaging. No behaviour changed: every
export returns exactly what it did in 0.1.0.

### Added

- Property-based tests with fast-check. Seven invariants, 11,425 assertions
  per run: `toPhoneme` never throws under any combination of options, it is
  deterministic, syllables rejoin to the phonemes they came from, every
  syllable of a vowel-bearing word has a nucleus, normalisation leaves no
  ASCII digit, and `toGrapheme` emits no phoneme-only characters.
- Release tarballs now carry SLSA build provenance as a `.intoto.jsonl`
  attestation alongside the existing cosign signature.

### Fixed

- `LICENSE` had an attribution paragraph between the copyright line and the
  MIT grant, so no license detector matched the file. It is now verbatim MIT.
  The attribution was already in `NOTICE.md`, and g2p-id's MIT text is
  vendored in full at `licenses/g2p-id-MIT.txt`, so the notice obligation is
  met by inclusion rather than by reference.
- `toSyllables` returns a syllable with no vowel for input that contains no
  vowel at all, such as `f`. Found by the new property tests. Not reachable
  from Indonesian text, and now pinned as documented degradation rather than
  left for a caller to discover.
- The release workflow installed `npm@latest` to satisfy trusted publishing.
  Node 24 already bundles npm 11.17.0, past the 11.5.1 that OIDC needs, so
  the step now asserts the version instead of installing one. That removes an
  unpinnable dependency from the release path and fails loudly if the bundled
  npm ever regresses, rather than silently publishing without provenance.

## [0.1.1] - 2026-08-25

Documentation and packaging only. No behaviour changed: `toPhoneme` and every
other export return exactly what they did in 0.1.0.

### Added

- `docs/agents.md`, a one-page reference for an agent or a pipeline calling
  the library: entry points, every export with real output, why each option
  default is the default, how to read `explain`, the failure modes, and the
  determinism guarantee. It ships inside the package on both registries.
- A project banner, `assets/banner.png`, also used as the social preview and
  as the `og:image` on the demo site, which now carries link-preview tags.

### Changed

- The README leads with what the library does and why Indonesian G2P is hard,
  and the reference material follows. It no longer opens by comparing itself
  to the Python project it started from: indo-g2p is developed on its own
  terms, and g2p-id is credited as the starting point rather than treated as
  a specification to match.
- The module doc, which is what JSR renders on the package overview, now
  describes the library rather than its origin.

### Fixed

- The OpenSSF Scorecard badge pointed at `api.securityscorecards.dev`, which
  returns 404 for this repository. It now reads `api.scorecard.dev`, where the
  score is published.
- The proper-noun stoplist was described as 2,102 words. It is 2,082, counted
  the way `scripts/dump-english.py` counts it.
- Every workflow failed at `bun install --frozen-lockfile`, because `bun.lock`
  is lockfile version 2 and the pinned Bun 1.3.14 cannot parse it. Pinned to
  1.4.0. No release before this one ever ran the CI gates.
- `bun run coverage` and the checked-in README disagreed on table padding and
  on one blank line, so the coverage gate could never pass. The generator now
  produces the checked-in form and is idempotent.
- `build:site` cleans its output directory and copies the banner, which Bun
  does not follow from a meta tag.

## [0.1.0] - 2026-08-25

The initial release, published to npm as `indo-g2p` and to JSR as
`@snowfluke/indo-g2p`.

Three commits changed what `toPhoneme` returns by default and are breaking for
anyone who tracked the repository before release: text normalisation, English
word readings, and collocation-based homograph resolution all became the
default. Only the first was marked `feat!:` at the time.

### Entry points

`indo-g2p/core` is the converter without the English table: 235 KB gzipped
against 887 KB for the main entry point. It exports the same API bar
`lookUpEnglish` and `englishWords`, and agrees on every Indonesian word; only
English words differ, since `core` reads them by Indonesian rules.
`english: false` still works on the main entry point but cannot remove the
data from a bundle.

### Added

- Initial TypeScript port of [Wikidepia/g2p-id](https://github.com/Wikidepia/g2p-id).
- `toPhoneme`, `toSyllables`, `toGrapheme`, and `applySchwa`.
- CRF syllabifier unpacked from `syllabifier.crfsuite` into plain weights.
- 17,888-word schwa dictionary packed as a per-`e` bitmask.
- Byte-for-byte `phonemes` parity with the Python original: 886 recorded
  fixtures in CI, plus a 53,776-case fuzz sweep against the reference.
- Syllable segmentation fixed relative to upstream. The CRF was trained
  without schwa marking, and being fed `ə` stopped it predicting boundaries:
  15.6% of ordinary words came back as a single syllable. Folding `ə` to `e`
  for tagging drops that to 0.2%, and boundaries are no longer allowed inside
  `tʃ` or `dʒ` (975 such splits, now none). `phonemes` output is unchanged.
- `explain(text, options?)` reports which of the seven layers answered for each
  word, so a wrong reading can be traced to the file that needs editing rather
  than to the source. It takes the same options as `toPhoneme` and is asserted
  never to disagree with it.
- The English table is searched in place rather than parsed into a `Map`. It
  is already sorted, so a binary search over the packed string needs no setup:
  first call falls from 24 ms to 3.2 ms, heap from 27 MB to 13 MB, and a memo
  on the result leaves steady-state throughput slightly better than before at
  roughly 107,000 words per second.
- A spelled-out number no longer spends the collocation window. Normalisation
  turns `17` into `tujuh belas` and `12345` into eight words, which pushed a
  homograph's trigger out of range and silently gave the wrong reading:
  `apel 17 agustus di lapangan` read as the fruit rather than the roll call.
- Every syllable now has a vowel. The syllabifier was trained on Indonesian and
  is fed English phonemes for words the English table answers, where it cut
  `beautiful` into `b|ju|tə|fəl`. A piece with no nucleus now joins its
  neighbour.
- Digits, currency, percentages, degrees and arithmetic symbols are spelled
  out as Indonesian words, and typographic quotes and dashes are folded onto
  the plain ones, so text reaching a speech model contains only words and the
  punctuation it phrases on. **On by default**; pass `normalize: false` for
  the untouched behaviour. It changes 8 of the 886 parity fixtures, every one
  an improvement, and removes no characters from ordinary text.
  `normalizeText`, `spellNumber` and `spellDecimal` are exported on their own.
- English words are read as English rather than through Indonesian spelling
  rules, so `event` is `ifent` and `michael` is `maɪkəl`. Pronunciations come
  from ipa-dict (MIT), mapped onto the phoneme set this library already emits.
  Three filters keep it away from Indonesian: a word must be placed by no
  Indonesian source, must be a common English word rather than part of the
  125,000-word tail that is mostly names, and must not be in
  `data/indonesian-proper-nouns.tsv`. That last file is why `jakarta`, `april`
  and `islam` are untouched. On by default; pass `english: false` to disable.
- 66 more names blocked from the English layer: 41 Indonesian place names that
  English dictionaries also carry, and 25 Indonesian and Arabic personal names.
  `dwi` was being read as the spelled-out initialism `didəbəjuaɪ`. Place names
  that are also common English words, such as `metro` and `bone`, are
  deliberately left English.
- Foreign names are read as names. ipa-dict already carried them, and dropping
  the common-word filter lets them through: `denny` was `dennj`, a syllable
  with no vowel, and is now `deni`. 113,140 entries.
- Fixed a bug where the single-vowel rules ate half of a diphthong, so
  `michael` came out `maikəl` rather than `maɪkəl`.
- `ch` is read as a single `/tʃ/`. Mapping `c` first left `tʃh`, a sound
  Indonesian cannot make, in every borrowed name carrying it: `manchester` was
  `mantʃhester` and is now `mantʃester`. Only three dictionary words contain
  `ch`, all of them foreign names, and `kh` is unaffected.
- The `ny` digraph now needs a following vowel. Indonesian words do not end
  in `ny`, so upstream's unconditional mapping turned borrowed names into a
  syllable with no vowel: `denny` became `denɲ`. Such names are still not read
  correctly by any grapheme rule; the fix only removes a sequence the language
  cannot produce. `sy` and `ng` are unguarded, since `musyrik` is `/muʃrik/`
  and `uang` is `/uaŋ/`.
- Glottal stops no longer swallow the `kh` digraph. Upstream reads `akhir` as
  `aʔhir`, so its own `kh` to `/x/` mapping never fires; the word is `axir`.
  Affects `akhir`, `terakhir`, `akhirnya`, `makhluk`, `ikhlas`.
- Glottal stops no longer fire before `r` and `l`. Those are Latin onset
  clusters that a native root does not form across a syllable break, so every
  word reaching them is borrowed: `demokrat`, `sekretaris`, `iklan`, `nuklir`,
  `akrab`. The clitic `-lah` is excepted, since its `k` ends a root, so
  `tidaklah` stays `tidaʔlah`.
- The passive prefix `di-` exposes its root to the schwa rules. It has no
  vowel of its own, so it can only add information: `digelar` becomes
  `digəlar` and `diselenggarakan` becomes `disələŋgarakan`, while `dingin` and
  `dinas` are untouched. 1,368 tokens of the news corpus.
- Bookbot's 27,411-word Indonesian lexicon (Apache-2.0) fills the gaps the
  curated dictionary leaves, adding 22,659 words. It sits below the dictionary,
  which is right on native vocabulary where the lexicon is not (`memang`,
  `desa`, `merah`, `bebas`), and above the affix rules, which it corrects in
  both directions: `pəmerintah` becomes `pəmərintah`, and `mədia` becomes
  `media`. Tokens with no schwa evidence fall from 9.3% to 6.0%; 2.05% of all
  tokens change reading.
- Schwa is now recovered in derived words the dictionary does not list. The
  17,888-word dictionary covers roots, but Indonesian affixes them, so 28% of
  running text missed it and was read with a plain `/e/`. The prefixes `me-`,
  `se-`, `te-`, `be-`, `pe-`, `ke-`, `ber-`, `ter-` and `per-` always carry a
  schwa, which recovers 63% of those tokens at 96.8% precision on a held-out
  scoring against the dictionary. Curated entries always win, a root must
  start with a legal Indonesian onset, and `data/schwa-overrides.tsv` pins the
  loanwords that slip through. This diverges from the Python original's
  `phonemes` for 8 of the 886 fixtures, each listed in the parity test.
- The 27 homographs no source could settle were reviewed by a native speaker.
  Six had the wrong default reading (`keset`, `kere`, `jejer`, `teleng`,
  `keder`, `kelepak`) and are corrected; the other 21 were already right.
- `data/schwa-overrides.tsv` corrects the upstream dictionary itself. It
  carries `mental`, whose common sense is `/mental/` rather than `/məntal/`.
- Homograph resolution is on by default, driven by collocation rules: a word
  keeps its dictionary reading unless one of its trigger words is within four
  words in the same sentence. Under 1 KB, no model, deterministic. Disable with
  `resolveSchwa: false`. On 176,038 tokens of news text it corrects three
  sentences and disturbs none of the 886 parity fixtures.
- `indo-g2p/homographs`: opt-in homograph resolution for 11 words, driven by an
  averaged-perceptron POSP tagger ported from Bookbot's g2p_id (Apache-2.0).
  Parity-tested against the Python tagger over 4,470 recorded tags.
- Every homograph rule is verified against en.wiktionary.org, which marks the
  pepet vowel. Rules the source contradicts, or that the tagger cannot apply
  safely, are dropped rather than guessed. The resolver now abstains unless the
  tag matches one of an entry's two verified classes, so it can no longer
  override curated dictionary data on an unknown-word default.
  See docs/homograph-review.md and data/homographs-verified.tsv.
- `resolveSchwa` option and the `SchwaResolver` type, so a model-backed
  resolver can replace the built-in one without an API change.
- `VERSION` export, `scripts/bump.ts`, and this changelog.
- Project governance and supply-chain tooling: CONTRIBUTING, GOVERNANCE,
  SECURITY and CODE_OF_CONDUCT, issue and pull-request templates, CODEOWNERS
  and Dependabot.
- CI runs formatting, lint, type-check, tests, build, a JSR dry run, an
  OSV-Scanner dependency scan, and a check that `src/data/` still matches its
  generator. CodeQL and OpenSSF Scorecard run separately.
- Releases publish to npm with provenance and to JSR over OIDC, then attach a
  CycloneDX SBOM and a keyless cosign signature to the GitHub release.
- Every source file carries an `SPDX-License-Identifier: MIT` header.

[0.1.2]: https://github.com/snowfluke/indo-g2p/releases/tag/v0.1.2
[0.1.1]: https://github.com/snowfluke/indo-g2p/releases/tag/v0.1.1
[0.1.0]: https://github.com/snowfluke/indo-g2p/releases/tag/v0.1.0
