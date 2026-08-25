# Notices

`indo-g2p` is MIT licensed. It bundles data derived from two upstream projects.

## Wikidepia/g2p-id: MIT

<https://github.com/Wikidepia/g2p-id>, Copyright (c) 2026 Akmal.

- `src/data/syllabifier-model.ts`: CRF syllabifier weights, unpacked from
  `syllabifier.crfsuite`.
- `src/data/schwa-dict.ts`: the schwa dictionary.

The phoneme rules in `src/g2p.ts` and `src/constants.ts` are a port of that
project's `g2p.py`.

## bookbot-kids/g2p_id: Apache-2.0

<https://github.com/bookbot-kids/g2p_id>, Copyright 2023 PT BOOKBOT INDONESIA
(<https://bookbot.id/>). This product includes software developed at PT BOOKBOT
INDONESIA. A copy of the Apache License 2.0 is in
[licenses/bookbot-Apache-2.0.txt](./licenses/bookbot-Apache-2.0.txt).

- `src/data/pos-model.ts`: averaged-perceptron POSP tagger weights, unpacked
  from `id_posp_tagger.pickle`.
- `src/data/homographs.ts`: the homograph table, reduced to schwa bitmasks,
  then filtered down to the rules verified against Wiktionary. The curated
  result lives in `data/homographs-verified.tsv`.

The tagger in `src/pos/tagger.ts` reimplements NLTK's `PerceptronTagger`
feature set, which those weights were trained against.

## en.wiktionary.org: CC BY-SA 4.0

Pronunciations in `data/homographs-verified.tsv` were checked against the
Indonesian entries on <https://en.wiktionary.org>. The evidence column
paraphrases the marked headwords; no Wiktionary text is redistributed.
