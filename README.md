# indo-g2p

[![npm version](https://img.shields.io/npm/v/indo-g2p)](https://www.npmjs.com/package/indo-g2p) [![JSR](https://jsr.io/badges/@snowfluke/indo-g2p)](https://jsr.io/@snowfluke/indo-g2p) [![NPM downloads](https://img.shields.io/npm/dw/indo-g2p)](https://www.npmjs.com/package/indo-g2p) [![Provenance](https://img.shields.io/badge/npm-signed%20provenance-blue?logo=npm)](https://www.npmjs.com/package/indo-g2p#provenance) [![License: MIT](https://img.shields.io/npm/l/indo-g2p)](./LICENSE) [![CI](https://github.com/snowfluke/indo-g2p/actions/workflows/ci.yml/badge.svg)](https://github.com/snowfluke/indo-g2p/actions/workflows/ci.yml) [![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/snowfluke/indo-g2p/badge)](https://scorecard.dev/viewer/?uri=github.com/snowfluke/indo-g2p) [![Socket Badge](https://socket.dev/api/badge/npm/package/indo-g2p)](https://socket.dev/npm/package/indo-g2p) [![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json) [![Live demo](https://img.shields.io/badge/demo-live-7a3e12)](https://snowfluke.github.io/indo-g2p/)

Indonesian grapheme-to-phoneme conversion and syllabification, in TypeScript.

**[Try it in the browser](https://snowfluke.github.io/indo-g2p/)**, no install needed.

A port of [Wikidepia/g2p-id](https://github.com/Wikidepia/g2p-id) that
deliberately diverges from it where the original is wrong: see
[schwa in derived words](#schwa-in-derived-words), [glottal
stops](#glottal-stops) and [syllables](#syllables).

**It is not byte-for-byte compatible with the Python original, and no option
setting makes it so.** 34 of the 886 recorded fixtures differ under the
defaults, and 26 still differ with every optional layer switched off, because
the glottal-stop, digraph and homograph corrections are not optional. Each
divergence is listed by name in `tests/parity.test.ts`, so a 35th fails the
build. The port is faithful where the original is right, not where it is
wrong.

- Zero runtime dependencies. No native modules, no model downloads.
- Runs on Node.js, Bun, Deno, and in the browser.
- Optional POS-driven homograph resolution, also zero dependency.
- Ships to both [npm](https://www.npmjs.com/package/indo-g2p) and
  [JSR](https://jsr.io/@snowfluke/indo-g2p), with npm provenance and a
  per-release SBOM.

```ts
import { toPhoneme } from "indo-g2p";

const { phonemes } = toPhoneme("Tak seorang pun boleh ditangkap.");
// "taʔ səoraŋ pun boleh ditaŋkap."
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

Three entry points, so a bundle carries only the tables it uses:

| Entry point           | What it adds                          |
| --------------------- | ------------------------------------- |
| `indo-g2p/core`       | the converter, 235 KB gzipped         |
| `indo-g2p`            | the same, plus English word readings  |
| `indo-g2p/homographs` | the part-of-speech homograph resolver |

## Usage

```ts
import { toPhoneme } from "indo-g2p";

const { phonemes, syllables } = toPhoneme(
  "Tak seorang pun boleh ditangkap, ditahan atau dibuang dengan sewenang-wenang."
);

console.log(phonemes);
// taʔ səoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan səwənaŋ-wənaŋ.

console.log(syllables.slice(0, 6));
// [ "taʔ", " ", "sə", "o", "raŋ", " " ]
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

### Syllables

```ts
import { toSyllables } from "indo-g2p";

toSyllables("sekolah"); // [ "se", "ko", "lah" ]
```

Syllables are the one place this port deliberately differs from the Python
original, because upstream has a bug here that matters for text-to-speech.

The CRF syllabifier was trained on text with the digraphs already mapped, `ng`
to `ŋ`, but with no schwa marking. Upstream feeds it its own output, schwa
included, and the model responds by predicting almost no boundaries at all.
This port folds `ə` back to `e` for tagging only, and refuses a boundary
inside the two-character affricates `tʃ` and `dʒ`.

Measured over the 17,888-word schwa dictionary:

|                                 | upstream      | this port |
| ------------------------------- | ------------- | --------- |
| words collapsed to one syllable | 2,706 (15.6%) | 35 (0.2%) |
| boundary inside `tʃ` or `dʒ`    | 975           | 0         |

```
cerdas    tʃərdas    upstream: tʃərdas       here: tʃər|das
cerca     tʃərtʃa    upstream: tʃərt|ʃa      here: tʃər|tʃa
sekolah   səkolah    upstream: səko|lah      here: sə|ko|lah
```

`phonemes` is untouched by this and still matches upstream exactly.

### Back to spelling

```ts
import { toGrapheme } from "indo-g2p";

toGrapheme("ditaŋkap"); // "ditangkap"
```

This is best-effort. Both `/ə/` and `/e/` spell as `e`, and a glottal stop
always spells as `k`, so the round trip is lossy.

## Homographs

`apel` is `/apəl/` as a noun (the fruit) and `/apel/` as a verb (roll call).
Which one you get depends on the sentence, so resolution is **on by default**:

```ts
import { toPhoneme } from "indo-g2p";

toPhoneme("upacara apel di lapangan").phonemes; // "upatʃara apel di lapaŋan"
toPhoneme("dia makan apel merah").phonemes; // "dia makan apəl mərah"
```

The default resolver reads the words around each homograph. A rule fires only
when one of its trigger words is within four words in the same sentence;
otherwise the schwa dictionary decides. That makes a missing trigger free and
keeps the whole thing to a few kilobytes with no model.

The readings come from
[data/homographs-verified.tsv](./data/homographs-verified.tsv), each checked
against the Indonesian entry on [en.wiktionary.org](https://en.wiktionary.org),
which marks the pepet vowel (`ê` is `/ə/`, `é` and `è` are not). The trigger
lists live in
[data/homographs-collocations.tsv](./data/homographs-collocations.tsv).

Turn it off with `resolveSchwa: false`:

```ts
toPhoneme("upacara apel di lapangan", { resolveSchwa: false }).phonemes;
// "upatʃara apəl di lapaŋan"
```

### The part-of-speech resolver

`indo-g2p/homographs` swaps the collocation rules for an averaged-perceptron
POSP tagger ported from
[Bookbot's g2p_id](https://github.com/bookbot-kids/g2p_id). It covers 11 words
instead of 4, at the cost of a 3.3 MB table:

```ts
import { toPhoneme } from "indo-g2p";
import { resolveHomographs } from "indo-g2p/homographs";

toPhoneme(text, { resolveSchwa: resolveHomographs });
```

Measured on 176,038 tokens of Indonesian news text, the tagger changed the
output of **zero** sentences while the collocation rules corrected three. The
tagger has never seen 42 of the upstream homographs in training, so it emits
its unknown-word default for them and the resolver abstains. That is why it is
not the default. See
[docs/homograph-review.md](./docs/homograph-review.md).

Any function of the same shape works, so you can bring your own:

```ts
import type { SchwaResolver } from "indo-g2p";

// Return the resolved spelling per word, or undefined to use the dictionary.
const myResolver: SchwaResolver = (words) => words.map(() => undefined);
```

## Text for a speech model

A speech model has no phoneme for `5`, `%` or `°`, so those either fail or get
dropped. They are spelled out in Indonesian by default:

```ts
toPhoneme("harga Rp15.000 naik 5%").phonemes;
// "harga lima bəlas ribu rupiah naɪʔ lima pərsen"

toPhoneme("harga Rp15.000 naik 5%", { normalize: false }).phonemes;
// "harga rp15.000 naɪʔ 5%"
```

It handles digits with Indonesian grouping (`1.234,56`), currency, percentages,
degrees and arithmetic symbols, and folds typographic quotes and dashes onto
the plain ones. `.,!?;:'"()-` are kept, because that is what a model phrases
on; anything else with no reading is dropped.

Times and dates are deliberately not interpreted. `07.30` could be a time, a
version or a price, and guessing wrong is worse than reading the digits, so
`versi 1.2.3` becomes `versi satu titik dua titik tiga`.

Pass `normalize: false` to hand the text through untouched, which is what a
caller doing its own normalisation wants. `normalizeText` and `spellNumber`
are exported for use on their own.

## English words in Indonesian text

Indonesian writing borrows English freely, and reading those words with
Indonesian spelling rules gives `efent` for `event`. English words are read as
English instead, in the same phoneme set as everything else:

```ts
toPhoneme("event").phonemes; // "ifent"
toPhoneme("download").phonemes; // "daʊnlod"
toPhoneme("michael").phonemes; // "maɪkəl", not "mitʃael"
```

Two filters keep it away from Indonesian. A word is only eligible if no
Indonesian source places it, and if it is not one of the 2,102 names and
naturalised loanwords in
[data/indonesian-proper-nouns.tsv](./data/indonesian-proper-nouns.tsv). That
file is why `jakarta`, `april` and `islam` keep their Indonesian readings,
since English dictionaries carry those spellings too.

Names are included rather than filtered out, because Indonesian rules read
them badly: `denny` was `dennj`, a syllable with no vowel, and is now `deni`.

Pass `english: false` to switch it off, or import
[`indo-g2p/core`](#what-a-bundle-actually-costs) to leave the 2 MB table out of
the bundle entirely.

## What it covers

Every row below is generated by running the input through `toPhoneme` with
default options, so it cannot drift from what the library does. Regenerate with
`bun run coverage`.

### Words

| Covers                                                  | Input         | Output        |
| ------------------------------------------------------- | ------------- | ------------- |
| Ordinary vocabulary                                     | `sekolah`     | `səkolah`     |
| Schwa from the dictionary                               | `dengan`      | `dəŋan`       |
| Schwa in a derived word <sub>not in any word list</sub> | `tersebut`    | `tərsəbut`    |
| Schwa through a prefix                                  | `memperbaiki` | `məmpərbaiki` |
| Passive prefix                                          | `digelar`     | `digəlar`     |
| Syllables <sub>see the syllables column</sub>           | `cerdas`      | `tʃərdas`     |

### Sounds

| Covers                       | Input                  | Output               |
| ---------------------------- | ---------------------- | -------------------- |
| Digraphs                     | `nyanyi syarat khusus` | `ɲaɲi ʃarat xusus`   |
| Affricates                   | `cacing jajan`         | `tʃatʃiŋ dʒadʒan`    |
| Diphthongs                   | `pulau pandai amboi`   | `pulaʊ pandaɪ ambɔɪ` |
| Glottal stop                 | `rusak bakso rakyat`   | `rusaʔ baʔso raʔjat` |
| `kh` is not a glottal stop   | `akhir`                | `axir`               |
| `kr` and `kl` are not either | `demokrat iklan`       | `demokrat iklan`     |

### Ambiguity

| Covers                                             | Input                         | Output                                 |
| -------------------------------------------------- | ----------------------------- | -------------------------------------- |
| Homograph, by context                              | `upacara apel di lapangan`    | `upatʃara apel di lapaŋan`             |
| The same word, other sense                         | `dia makan apel merah`        | `dia makan apəl mərah`                 |
| Homograph with a number between                    | `apel 17 agustus di lapangan` | `apel tudʒuh bəlas agustus di lapaŋan` |
| Abbreviation, opt in <sub>`expandAbbr: true`</sub> | `tv`                          | `téfé`                                 |

### Numbers and symbols

| Covers                                                        | Input          | Output                                             |
| ------------------------------------------------------------- | -------------- | -------------------------------------------------- |
| Integer                                                       | `15000`        | `lima bəlas ribu`                                  |
| Indonesian digit grouping                                     | `1.234,56`     | `səribu dua ratus tiga puluh əmpat koma lima ənam` |
| Currency                                                      | `Rp250.000`    | `dua ratus lima puluh ribu rupiah`                 |
| Percentage                                                    | `naik 5%`      | `naɪʔ lima pərsen`                                 |
| Degrees                                                       | `50°C`         | `lima puluh dəradʒat tʃelsius`                     |
| Arithmetic                                                    | `3+4=7`        | `tiga plus əmpat sama dəŋan tudʒuh`                |
| Version, not a number <sub>deliberately not read as one</sub> | `versi 1.2.3`  | `fersi satu titiʔ dua titiʔ tiga`                  |
| Date, not interpreted <sub>no date parsing</sub>              | `1 April 2024` | `satu april dua ribu dua puluh əmpat`              |

### Foreign words

| Covers                                              | Input      | Output     |
| --------------------------------------------------- | ---------- | ---------- |
| English word                                        | `download` | `daʊnlod`  |
| English brand                                       | `iphone`   | `aɪfon`    |
| Western name                                        | `michael`  | `maɪkəl`   |
| Name Indonesian rules mangle <sub>was `dennj`</sub> | `denny`    | `deni`     |
| Indonesian place name <sub>kept Indonesian</sub>    | `jakarta`  | `dʒakarta` |
| Indonesian personal name <sub>kept Indonesian</sub> | `lukman`   | `luʔman`   |
| Month name <sub>kept Indonesian</sub>               | `april`    | `april`    |

### Text

| Covers                     | Input                    | Output                   |
| -------------------------- | ------------------------ | ------------------------ |
| Punctuation is kept        | `Halo, dunia! Benarkah?` | `halo, dunia! bənarkah?` |
| Typographic quotes folded  | `«kutipan»`              | `"kutipan"`              |
| Unreadable symbols dropped | `#tagar`                 | `tagar`                  |
| Case is folded             | `Jakarta`                | `dʒakarta`               |
| Non-letters pass through   | `email@situs.com`        | `email at situs.tʃom`    |

Syllables come back alongside the phonemes: `cerdas` → `tʃər · das`, `sekolah` → `sə · ko · lah`, `memperbaiki` → `məm · pər · ba · ik · i`, `beautiful` → `bju · tə · fəl`.

## Finding out why

Five sources can answer for a word, and when one of them is wrong the useful
question is which one spoke. `explain` answers it:

```ts
import { explain } from "indo-g2p";

explain("upacara apel di jakarta");
// [ { word: "upacara", phonemes: "upatʃara", source: "lexicon" },
//   { word: "apel",    phonemes: "apel",     source: "collocation" },
//   { word: "di",      phonemes: "di",       source: "lexicon" },
//   { word: "jakarta", phonemes: "dʒakarta", source: "rules" } ]
```

`source` is one of `override`, `dictionary`, `lexicon`, `affix`, `english`,
`collocation` or `rules`, and tells you where to go to fix a wrong reading:
a bad `dictionary` answer belongs in `data/schwa-overrides.tsv`, a bad
`collocation` in `data/homographs-collocations.tsv`, a wrongly-`english` word
in `data/indonesian-proper-nouns.tsv`. It takes the same options as
`toPhoneme`, so it reports what that call would really do.

## API

| Export                                       | Signature                                                 |
| -------------------------------------------- | --------------------------------------------------------- |
| `toPhoneme`                                  | `(text: string, options?: ToPhonemeOptions) => G2PResult` |
| `toSyllables`                                | `(word: string) => string[]`                              |
| `toGrapheme`                                 | `(text: string) => string`                                |
| `applySchwa`                                 | `(word: string) => string`                                |
| `normalizeText`                              | `(text: string) => string`                                |
| `spellNumber`                                | `(value: number) => string`                               |
| `spellDecimal`                               | `(whole: number, fraction: string) => string`             |
| `resolveCollocations`                        | `(words: readonly string[]) => (string \| undefined)[]`   |
| `collocationRules`                           | `() => { word: string; triggers: string[] }[]`            |
| `lookUpEnglish`                              | `(word: string) => string \| undefined`                   |
| `englishWords`                               | `() => string[]`                                          |
| `VERSION`                                    | `string`                                                  |
| `resolveHomographs` <sub>`/homographs`</sub> | `(words: readonly string[]) => (string \| undefined)[]`   |
| `knownHomographs` <sub>`/homographs`</sub>   | `() => string[]`                                          |

`G2PResult` is `{ phonemes: string; syllables: string[] }`.
`ToPhonemeOptions` is
`{ expandAbbr?: boolean; normalize?: boolean; english?: boolean; resolveSchwa?: SchwaResolver | false }`, where
`resolveSchwa` defaults to `resolveCollocations` and `false` disables
resolution entirely.
`SchwaResolver` is `(words: readonly string[]) => readonly (string | undefined)[]`.
`WordTrace` is `{ word: string; phonemes: string; source: PhonemeSource }`, and
`PhonemeSource` is a union of the seven layer names above.

## Schwa in derived words

Indonesian spelling writes `/e/` and `/ə/` with the same letter, so a word
list decides which is which. Upstream ships a 17,888-word one, but the
language builds most of its vocabulary by affixing roots, and the derived
forms are not listed. On 141,770 tokens of news text, **28% of all words**
were `e`-words it had never seen, and every one was read with a plain `/e/`.

Three sources answer instead, in order of how far each is trusted:

| Source                                                                   | Words       | Answers         |
| ------------------------------------------------------------------------ | ----------- | --------------- |
| Curated dictionary, plus `data/schwa-overrides.tsv`                      | 17,888      | 32.6% of tokens |
| [Bookbot's lexicon](https://github.com/bookbot-kids/g2p_id) (Apache-2.0) | 22,659 more | included above  |
| Affix rules, no word list at all                                         | n/a         | 1.9% of tokens  |
| Nothing places it, so it keeps a plain `/e/`                             |             | 6.0% of tokens  |

The dictionary outranks the lexicon because it is right on native vocabulary
where the lexicon is not: it reads `memang`, `desa`, `merah` and `bebas` with
a schwa, and the lexicon does not. The lexicon outranks the affix rules
because it is a word list rather than a guess, correcting both their misses
(`pəmerintah` to `pəmərintah`) and their overreach (`mədia` to `media`).

The prefixes `me-`, `se-`, `te-`, `be-`, `pe-`, `ke-`, `ber-`, `ter-`, `per-`
always carry a schwa. That is a fact about the language rather than about any
word list, so an unlisted word can still be read correctly:

```
tersebut     upstream: tersebut       here: tərsəbut
menjadi      upstream: menjadi        here: məndʒadi
mengatakan   upstream: mengatakan     here: məŋatakan
beberapa     upstream: beberapa       here: bəbərapa
```

The rules only run for words no list places, so every curated entry is
untouched. Scored against the dictionary itself, guessing each known word as
if it were missing, the prefix vowel comes out right **96.8%** of the time.

Loanwords that merely begin with a prefix's letters are the failure mode. Two
things hold them back: a root has to start with a legal Indonesian onset, so
`teknologi` is not read as `te` + `knologi`, and
[data/schwa-overrides.tsv](./data/schwa-overrides.tsv) pins the rest by hand.
That file is also where you correct the upstream dictionary itself, as it
carries `mental`, whose common sense is `/mental/` rather than `/məntal/`.

## Glottal stops

A `k` at the end of a word, or between a vowel and a consonant, is a glottal
stop: `rusak` is `/rusaʔ/` and `rakyat` is `/raʔjat/`. Two cases are excluded
where upstream applies the rule anyway.

`kh` is a digraph, not a `k` before a consonant. Upstream reads `akhir` as
`aʔhir`, which also means its `kh` to `/x/` mapping never sees the word:

```
akhir      upstream: aʔhir       here: axir
terakhir   upstream: təraʔhir    here: təraxir
makhluk    upstream: maʔhluʔ     here: maxluʔ
```

`kr` and `kl` are Latin onset clusters, and a native Indonesian root does not
form them across a syllable break, so a word that reaches them is borrowed:

```
demokrat   upstream: demoʔrat    here: demokrat
iklan      upstream: iʔlan       here: iklan
nuklir     upstream: nuʔlir      here: nuklir
```

The clitic `-lah` is the exception, because there the `k` really does end a
root: `tidaklah` stays `/tidaʔlah/`.

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
| English table    | 2.0 MB | only via `indo-g2p`, never via `indo-g2p/core`                    |

### What a bundle actually costs

`english: false` turns the English lookup off, but a static import cannot be
argued out of a bundle, so the data ships anyway. Import `indo-g2p/core`
instead and the table is never referenced:

| Import          | Minified | Gzipped | English words            |
| --------------- | -------- | ------- | ------------------------ |
| `indo-g2p`      | 2.69 MB  | 887 KB  | read as English          |
| `indo-g2p/core` | 0.72 MB  | 235 KB  | read by Indonesian rules |

Both entry points expose the same API, minus `lookUpEnglish` and
`englishWords`, and agree on every Indonesian word. `indo-g2p/core` is the
better default for a browser bundle; take the full entry point when the input
mixes in English, which Indonesian writing usually does.

The part-of-speech tagger is separate again: it lives behind
`indo-g2p/homographs` and reaches neither bundle above. Both figures come from
minifying a consumer that imports the whole public API of each entry point,
then checking the output for each table's symbols.

## Known limits

These are upstream behaviours the port reproduces rather than fixes:

- Only `[a-z]` runs are converted. Accented and non-ASCII input passes through
  like punctuation, so it belongs to no syllable.
- Digits and symbols are spelled out unless `normalize: false` is set.
- No stress marks are emitted. Indonesian stress is not contrastive, and a
  speech model learns the symbol set it is trained on, so adding them would
  enlarge the vocabulary for nothing.
- The name list has holes. Any place, brand or surname missing from
  `data/indonesian-proper-nouns.tsv` and present in the English dictionary
  gets an English reading. Adding one is a one-line edit.
- The syllabifier is still the upstream CRF and still gets words wrong, for
  example `dəŋ|an` rather than `də|ŋan`. It is a character model with no notion
  of Indonesian morphology.
- The default collocation rules cover 4 words. They only fire on a lexical
  trigger, so a syntactic case like _mereka tetap apel seperti biasa_ is left
  to the dictionary rather than guessed.
- The part-of-speech resolver covers 11 words. Upstream ships 102 entries;
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
bun run build       # emits lib/ for npm
bun run demo        # serves the demo at localhost:3000
bun run build:site  # emits site/ for GitHub Pages
```

The demo deploys to GitHub Pages from `.github/workflows/pages.yml` on every
push to `main`. Enable it once under Settings > Pages > Source: GitHub Actions.

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
