# indo-g2p for AI agents

A compact, complete reference for an agent choosing and calling this library.
Everything below is real output from version 0.1.0.

## What this library does, and does not

Converts Indonesian text to IPA phonemes and syllables. It is a deterministic
rule and dictionary system: same input, same output, no model, no network, no
GPU. Zero runtime dependencies.

**It is not** a text-to-speech engine, a translator, a language detector, or a
tokenizer for a language model. It emits phonemes for a downstream acoustic
model to speak.

## Pick an entry point

| Import                | Use when                                                         | Gzipped |
| --------------------- | ---------------------------------------------------------------- | ------- |
| `indo-g2p/core`       | Indonesian only, or bundle size matters                          | 235 KB  |
| `indo-g2p`            | the text mixes in English, which Indonesian writing usually does | 887 KB  |
| `indo-g2p/homographs` | you want part-of-speech homograph resolution as well             | +921 KB |

Same API in all three, except `indo-g2p` also exports `lookUpEnglish` and
`englishWords`. `indo-g2p/homographs` exports only `resolveHomographs` and
`knownHomographs`, to pass into the option below.

## Minimal call

```ts
import { toPhoneme } from "indo-g2p";

toPhoneme("Saya beli 2 apel.");
// { phonemes: "saja bəli dua apəl.",
//   syllables: ["sa","ja"," ","bəl","i"," ","du","a"," ","a","pəl"," "] }
```

`syllables` puts a single `" "` after each word. Punctuation, spacing and any
character outside `a-z` pass through `phonemes` unchanged.

## Options

All four are optional. The defaults are the right choice for feeding a speech
model; change them only for the reasons given.

| Option         | Default           | Effect                                                                                                               |
| -------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `normalize`    | `true`            | Spell out digits, currency, percentages and symbols. `false` only if you normalise text yourself.                    |
| `english`      | `true`            | Read English loanwords as English. `false` for Indonesian spelling rules.                                            |
| `resolveSchwa` | collocation rules | Resolve homographs from surrounding words. `false` to always take the dictionary reading, or pass your own resolver. |
| `expandAbbr`   | `false`           | Spell unpronounceable letter runs out, `tv` to `téfé`.                                                               |

```ts
toPhoneme("2 apel", { normalize: false }).phonemes; // "2 apəl"
toPhoneme("event", { english: false }).phonemes; // "efent"
toPhoneme("tv", { expandAbbr: true }).phonemes; // "téfé"

toPhoneme("upacara apel").phonemes; // "upatʃara apel"
toPhoneme("upacara apel", { resolveSchwa: false }).phonemes; // "upatʃara apəl"
```

## Full export list

```ts
toPhoneme(text, options?)   // → { phonemes, syllables }   the main call
explain(text, options?)     // → WordTrace[]               why each word read that way
toSyllables("səkolah")      // → ["sə","ko","lah"]         phonemes in, syllables out
toGrapheme("saja pərgi")    // → "saya pergi"              best-effort inverse
applySchwa("sekolah")       // → "səkolah"                 schwa only, no other rules
normalizeText("Rp15.000")   // → "lima belas ribu rupiah"  text stays text
spellNumber(2026)           // → "dua ribu dua puluh enam"
spellDecimal(3, "14")       // → "tiga koma satu empat"
VERSION                     // → "0.1.0"
```

## Diagnosing a wrong reading

`explain` names the layer that answered, so you can report a bug against the
right file instead of guessing.

```ts
explain("apel merah");
// [ { word: "apel",  phonemes: "apəl",  source: "dictionary" },
//   { word: "merah", phonemes: "mərah", source: "dictionary" } ]
```

`source` is one of `override`, `dictionary`, `lexicon`, `affix`, `english`,
`collocation`, or `rules`, in the order the layers are consulted. `rules` means
no word list placed it and the letter-to-sound rules ran.

## Rules for an agent using this

1. **Do not post-process `phonemes` with your own letter substitutions.** The
   output is already in the target phoneme set. Rewriting it reintroduces the
   bugs the library exists to fix.
2. **Do not call it on non-Indonesian text** and expect sense. It has no
   language detector. Detect first, then route.
3. **Feed it whole sentences, not single words.** Homograph resolution reads
   the surrounding words; one word at a time discards that context.
4. **Leave `normalize` on** unless you have already spelled out digits. A
   speech model has no phoneme for `5` or `%`.
5. **Treat the output as bytes, not as display text.** It contains `ə ʔ ŋ ɲ ʃ x
tʃ dʒ aɪ aʊ ɔɪ`. Normalise to NFC and do not strip diacritics.
6. **Check `explain` before filing a bug.** A wrong reading from `dictionary`
   is a data fix; one from `rules` is a missing entry.

## Known failure modes

- Words outside `[a-z]` after normalisation pass through untouched.
- No stress marks are emitted; Indonesian stress is not contrastive.
- Syllable boundaries are a CRF model's output and are sometimes wrong, more
  often on borrowed words than native ones.
- Names missing from `data/indonesian-proper-nouns.tsv` may be read as English.
- Homograph coverage is deliberately narrow: 4 words by the default rules, 11
  by the opt-in tagger. An unresolved homograph keeps its dictionary reading
  rather than guessing.

## Determinism

No randomness, no clock, no locale lookup, no network. The same input string
and options always produce the same output on every platform and runtime. Safe
to cache and to snapshot-test.
