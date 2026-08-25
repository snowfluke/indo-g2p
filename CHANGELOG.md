# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions are published to npm as `indo-g2p` and to JSR as `@snowfluke/indo-g2p`
from the same tag. `bun scripts/bump.ts patch|minor|major` keeps package.json,
jsr.json and `src/version.ts` in lockstep; the pre-commit hook rejects drift.

## [Unreleased]

## [0.1.0] - 2026-08-22

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
- Digits, currency, percentages, degrees and arithmetic symbols are spelled
  out as Indonesian words, and typographic quotes and dashes are folded onto
  the plain ones, so text reaching a speech model contains only words and the
  punctuation it phrases on. **On by default**; pass `normalize: false` for
  the untouched behaviour. It changes 8 of the 886 parity fixtures, every one
  an improvement, and removes no characters from ordinary text.
  `normalizeText`, `spellNumber` and `spellDecimal` are exported on their own.
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
