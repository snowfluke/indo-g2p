# indo-g2p

[![npm version](https://img.shields.io/npm/v/indo-g2p)](https://www.npmjs.com/package/indo-g2p) [![JSR](https://jsr.io/badges/@snowfluke/indo-g2p)](https://jsr.io/@snowfluke/indo-g2p) [![NPM downloads](https://img.shields.io/npm/dw/indo-g2p)](https://www.npmjs.com/package/indo-g2p) [![Provenance](https://img.shields.io/badge/npm-signed%20provenance-blue?logo=npm)](https://www.npmjs.com/package/indo-g2p#provenance) [![License: MIT](https://img.shields.io/npm/l/indo-g2p)](./LICENSE) [![CI](https://github.com/snowfluke/indo-g2p/actions/workflows/ci.yml/badge.svg)](https://github.com/snowfluke/indo-g2p/actions/workflows/ci.yml) [![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/snowfluke/indo-g2p/badge)](https://scorecard.dev/viewer/?uri=github.com/snowfluke/indo-g2p) [![Socket Badge](https://socket.dev/api/badge/npm/package/indo-g2p)](https://socket.dev/npm/package/indo-g2p) [![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)

Indonesian grapheme-to-phoneme conversion and syllabification, in TypeScript.

A port of [Wikidepia/g2p-id](https://github.com/Wikidepia/g2p-id). Output matches
the Python original exactly: the test suite asserts byte-for-byte parity over
886 recorded cases, and the POS tagger over 4,470 recorded tags.

- Zero runtime dependencies. No native modules, no model downloads.
- Runs on Node.js, Bun, Deno, and in the browser.
- Optional POS-driven homograph resolution, also zero dependency.
- Ships to both [npm](https://www.npmjs.com/package/indo-g2p) and
  [JSR](https://jsr.io/@snowfluke/indo-g2p), with npm provenance and a
  per-release SBOM.

```ts
import { toPhoneme } from "indo-g2p";

const { phonemes } = toPhoneme("Tak seorang pun boleh ditangkap.");
// "taʔ seoraŋ pun boleh ditaŋkap."
```

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Homographs](#homographs)
- [API](#api)
- [How it works](#how-it-works)
- [Known limits](#known-limits)
- [Development](#development)
- [License](#license)

## Install

```bash
bun add indo-g2p        # npm i indo-g2p
deno add jsr:@snowfluke/indo-g2p
```

## Usage

```ts
import { toPhoneme } from "indo-g2p";

const { phonemes, syllables } = toPhoneme(
  "Tak seorang pun boleh ditangkap, ditahan atau dibuang dengan sewenang-wenang."
);

console.log(phonemes);
// taʔ seoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan sewenaŋ-wənaŋ.

console.log(syllables.slice(0, 6));
// [ "taʔ", " ", "se", "o", "raŋ", " " ]
```

Text is lowercased first. Punctuation, digits, and spacing pass through
unchanged. Each word in `syllables` is followed by a single `" "`.

### Abbreviations

A word with no valid consonant/vowel shape is read letter by letter, but only
when you ask for it:

```ts
toPhoneme("tv").phonemes; // "tf"
toPhoneme("tv", { expandAbbr: true }).phonemes; // "téfé"
```

### Syllables on their own

```ts
import { toSyllables } from "indo-g2p";

toSyllables("sekolah"); // [ "se", "ko", "lah" ]
```

### Back to spelling

```ts
import { toGrapheme } from "indo-g2p";

toGrapheme("ditaŋkap"); // "ditangkap"
```

This is best-effort. Both `/ə/` and `/e/` spell as `e`, and a glottal stop
always spells as `k`, so the round trip is lossy.

## Homographs

`apel` is `/apəl/` as a noun (the fruit) and `/apel/` as a verb (roll call).
Telling them apart needs the sentence, so it lives behind its own entry point:

```ts
import { toPhoneme } from "indo-g2p";
import { resolveHomographs } from "indo-g2p/homographs";

toPhoneme("setiap senin kami apel di lapangan", {
  resolveSchwa: resolveHomographs,
}).phonemes;
```

`resolveHomographs` tags the sentence with an averaged-perceptron POSP tagger
ported from [Bookbot's g2p_id](https://github.com/bookbot-kids/g2p_id), then
picks the reading whose part of speech matches. It knows **11 words**: every
rule was checked against the Indonesian entry on
[en.wiktionary.org](https://en.wiktionary.org), which marks the pepet vowel
(`ê` is `/ə/`, `é` and `è` are not). Anything unverified is left to the schwa
dictionary, and a sentence with no homograph never runs the tagger at all.

The tagger is 3.3 MB, so importing `indo-g2p` alone never pulls it in.

See [docs/homograph-review.md](./docs/homograph-review.md) for every rule and
its source. [`data/homographs-verified.tsv`](./data/homographs-verified.tsv) is
the table you edit.

Any function of the same shape works, so you can bring your own model:

```ts
import type { SchwaResolver } from "indo-g2p";

// Return the resolved spelling per word, or undefined to use the dictionary.
const myResolver: SchwaResolver = (words) => words.map(() => undefined);
```

## API

| Export                                       | Signature                                                 |
| -------------------------------------------- | --------------------------------------------------------- |
| `toPhoneme`                                  | `(text: string, options?: ToPhonemeOptions) => G2PResult` |
| `toSyllables`                                | `(word: string) => string[]`                              |
| `toGrapheme`                                 | `(text: string) => string`                                |
| `applySchwa`                                 | `(word: string) => string`                                |
| `VERSION`                                    | `string`                                                  |
| `resolveHomographs` <sub>`/homographs`</sub> | `(words: readonly string[]) => (string \| undefined)[]`   |
| `knownHomographs` <sub>`/homographs`</sub>   | `() => string[]`                                          |

`G2PResult` is `{ phonemes: string; syllables: string[] }`.
`ToPhonemeOptions` is `{ expandAbbr?: boolean; resolveSchwa?: SchwaResolver }`.
`SchwaResolver` is `(words: readonly string[]) => readonly (string | undefined)[]`.

## How it works

| Step         | What it does                                                           |
| ------------ | ---------------------------------------------------------------------- |
| Schwa lookup | 17,888-word dictionary decides which `e` is `/ə/` and which is `/e/`   |
| Glottal stop | A final `k`, or a `k` between a vowel and a consonant, becomes `/ʔ/`   |
| Phoneme map  | `ng→ŋ`, `ny→ɲ`, `sy→ʃ`, `c→tʃ`, `j→dʒ`, `kh→x`, `v→f`, `y→j`, `x→ks`   |
| Syllabify    | A CRF tagger labels each character as continuing or closing a syllable |
| Diphthongs   | Inside a syllable, `ai→aɪ`, `au→aʊ`, `oi→ɔɪ`                           |

Every model ships as plain weights in `src/data/`, unpacked from its upstream
binary. Nothing is fetched at runtime.

| Table            | Size   | Loaded                                                            |
| ---------------- | ------ | ----------------------------------------------------------------- |
| Schwa dictionary | 206 KB | on first `toPhoneme` with an `e`                                  |
| CRF syllabifier  | 295 KB | on first `toSyllables`                                            |
| POSP tagger      | 3.3 MB | only via `indo-g2p/homographs`, and only when a homograph appears |

## Known limits

These are upstream behaviours the port reproduces rather than fixes:

- Words containing `ə` or `ŋ` can confuse the syllabifier, which was trained on
  plain letters, so `dəŋan` comes back as one syllable.
- Only `[a-z]` runs are converted. Accented input is left alone.
- Homographs are off by default and cover 11 words. Upstream ships 102 entries;
  45 have identical readings or share a part of speech, and of the 57 that
  remain, 27 have no pepet-marked Wiktionary entry, 16 turn out to have one
  pronunciation across every sense, and 3 contradict the upstream mapping.
  `python3 scripts/verify-homographs.py` reproduces every verdict. Guessing on
  the unverifiable ones made the output worse, not better.
- The tagger is the weak link, not the rules. 42 of the upstream homographs
  never appear in the POSP corpus the tagger was trained on, so it emits its
  unknown-word default for them. The resolver therefore requires the tag to
  match one of an entry's two verified classes and abstains otherwise. A larger
  model does not help: a fine-tuned transformer tagger labels `apel` and
  `ganteng` exactly the same way.
- Rare senses stay unreachable. `pening` really does mean both "dizzy" and "tax
  plate", but the tagger reads the common adjective as a noun, so only the
  adjective side ships.
- The resolver sees words only, not punctuation, so context differs slightly
  from a tagger fed a full tokenizer stream.

## Development

```bash
bun install
bun test          # includes the Python parity fixtures
bun run lint
bun run fmt
bun run type-check
bun run build     # emits lib/ for npm
```

`src/data/` is generated. Regenerate with the dev-only scripts:

```bash
uv run --with python-crfsuite scripts/dump-model.py    ../g2p-id
uv run --with python-crfsuite scripts/dump-fixtures.py ../g2p-id
python3 scripts/dump-pos.py .
```

[CONTRIBUTING.md](./CONTRIBUTING.md) covers the parity contract and the bar for
a homograph rule. [SECURITY.md](./SECURITY.md) covers reporting and release
verification. [GOVERNANCE.md](./GOVERNANCE.md) covers who decides what.

## License

MIT. See [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md).

The CRF weights and schwa dictionary come from
[Wikidepia/g2p-id](https://github.com/Wikidepia/g2p-id) (MIT). The perceptron
POS tagger and homograph table come from
[bookbot-kids/g2p_id](https://github.com/bookbot-kids/g2p_id) (Apache-2.0).
