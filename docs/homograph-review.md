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
readings share a part of speech or the readings are identical. Of the
remaining 57:

| Outcome            | Count | Why                                                                                    |
| ------------------ | ----- | -------------------------------------------------------------------------------------- |
| Rule kept          | 11    | Wiktionary marks two readings that split by part of speech                             |
| One pronunciation  | 3     | `ganteng`, `relai` and `semi` are marked the same in every sense, so no rule can apply |
| No marked evidence | 43    | Wiktionary has no pepet-marked Indonesian entry, so nothing can be checked             |

The dictionary already spells `ganteng` as `gantəng`, `relai` as `rəlai` and
`semi` as `səmi`, matching Wiktionary. Dropping those rules made the output
more correct, not less.

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
