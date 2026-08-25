<!--
Thanks for opening a PR against indo-g2p. Keep it short; a couple of sentences
per section is fine for small changes.
-->

## What

<!--
What does this PR change, in plain language? Link an issue if there is one:
"Fixes #123".
-->

## Why

<!--
Why is this worth merging? For a bug fix, describe the symptom and the root
cause. For a pronunciation fix, cite your source.
-->

## Checklist

- [ ] `bun run fmt`, `bun run lint`, `bun run type-check`, and `bun test` pass
- [ ] Added a test that fails without this change
- [ ] Commits are signed off (`git commit -s`)

## Output changes

<!--
Does this change what `toPhoneme` returns for input that already worked?

If yes, say so explicitly and explain why the port should diverge from
Wikidepia/g2p-id. Downstream TTS pipelines depend on exact phoneme strings, so
this needs a maintainer's sign-off. If no, write "No".
-->

## Homograph rules

<!--
Only if you touched data/homographs-verified.tsv. Give the source for each
reading, e.g. the Wiktionary headword showing where the pepet vowel falls.
Delete this section otherwise.
-->
