# Homograph review

Some Indonesian words are spelled alike but read differently, and the
difference is which `e` is a schwa. `apel` is `/apəl/` as the fruit and
`/apel/` as a military roll call.

`indo-g2p/homographs` resolves a word only when its part-of-speech tag matches
a reading verified against the Indonesian entry on
[en.wiktionary.org](https://en.wiktionary.org), which marks the pepet vowel
explicitly: `ê` is `/ə/`, while `é` and `è` are not. Everything else is left
to the schwa dictionary.

## What survived

Bookbot's upstream table has 102 entries. 45 are unusable, because both
readings share a part of speech or the readings are identical. Reproduce the
verdicts on the remaining 57 with:

```bash
python3 scripts/verify-homographs.py <path-to>/homographs_id.tsv
```

| Verdict        | Count | Meaning                                                                  |
| -------------- | ----- | ------------------------------------------------------------------------ |
| `confirmed`    | 5     | both classes match a marked Wiktionary reading; the rule ships both ways |
| `half`         | 6     | one class matches; only that side ships                                  |
| `single`       | 16    | every marked sense reads the same, so no part-of-speech rule can apply   |
| `contradicted` | 3     | the marked readings do not split along these classes                     |
| `unverified`   | 27    | no pepet-marked Indonesian entry exists to check against                 |

That leaves 11 rules shipping and 46 dropped.

The `single` group matters more than its name suggests. `ganteng`, `relai` and
`semi` are marked identically in every sense with nothing left unmarked, so
their upstream rules were simply wrong. The dictionary already spells them
`gantəng`, `rəlai` and `səmi`, matching Wiktionary, so dropping those rules
made the output more correct rather than less.

### The unverified group, settled by review

The `unverified` words have no pepet-marked entry anywhere, so no measurement
can place them. They were read by a native speaker on 2026-08-25 instead. Six
had the wrong default and are corrected in
[data/schwa-overrides.tsv](../data/schwa-overrides.tsv); the other 21 were
already right. `tests/no-regression.test.ts` records both halves, so a later
data change cannot quietly undo the review.

### Why the other sources do not help

KBBI, the official dictionary, splits homographs into numbered entries but
publishes no pronunciation field at all, so it cannot say which `e` is a
schwa. Bookbot's own 27,411-word lexicon keeps homographs in a separate file,
so only one of these 57 words appears in it. That leaves Wiktionary as the
only machine-checkable source, and the `unverified` group is the set of words
it has never marked.

## The kept rules

"abstains" marks a side that could not be verified, or was verified but proved
unsafe. That side always falls through to the schwa dictionary.

| word     | class A               | class B                | dictionary | evidence                                                                                                         |
| -------- | --------------------- | ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `apel`   | abstains              | verb to `apel`         | `apəl`     | apêl (n, apple) vs apèl (n/v, roll call)                                                                         |
| `ketel`  | abstains              | adjective to `kətəl`   | `kətel`    | ketèl (n, kettle) vs kêtêl (adj, thick)                                                                          |
| `letak`  | adjective to `letak`  | noun to `lətak`        | `lətak`    | lêtak (n, placement) vs letak (adj, weak)                                                                        |
| `leter`  | adjective to `leter`  | abstains               | `letər`    | leter (adj, chatter) vs letêr (n, letter)                                                                        |
| `pening` | adjective to `pəning` | abstains               | `pəning`   | pêning (adj, dizzy) vs pening (n, tax plate); noun side dropped, the tagger reads the common adjective as a noun |
| `pepet`  | verb to `pepet`       | noun to `pəpət`        | `pəpət`    | pêpêt (n, schwa) vs pepet (v, to close)                                                                          |
| `per`    | noun to `per`         | particle/prep to `pər` | `pər`      | per (n, spring) vs pêr (prep, per/through)                                                                       |
| `rebak`  | adjective to `rebak`  | abstains               | `rəbak`    | rebak (adj, torn) vs rêbak (v, to melt)                                                                          |
| `rembes` | adjective to `rembes` | abstains               | `rembəs`   | rembes (adj, runny) vs rêmbês (v, to ooze)                                                                       |
| `seret`  | verb to `seret`       | abstains               | `sərət`    | seret (v, to drag) vs sêrêt (adj, stiff)                                                                         |
| `terapi` | noun to `terapi`      | adjective to `tərapi`  | `terapi`   | terapi (n, therapy) vs têrapi (adj, tidiest)                                                                     |

## Why a verified rule can still be dropped

`pening` is a real homograph: `pêning` (adjective, dizzy) against `pening`
(noun, a tax plate). The noun is archaic, and the tagger labels the common
adjective as a noun, so the rule fired the wrong way on ordinary sentences like
_kepala saya pening sekali_. Its noun side is dropped for that reason, not for
lack of evidence.

`tests/no-regression.test.ts` holds a sentence for the common sense of every
kept word and asserts the resolver leaves it alone. Add a rule to
`data/homographs-verified.tsv` and that test decides whether it may ship.

## Editing the table

`data/homographs-verified.tsv` is the source of truth:

```bash
python3 scripts/dump-pos.py .        # regenerates src/data/homographs.ts
bun scripts/gen-homograph-doc.ts     # regenerates this file
bun test
```
