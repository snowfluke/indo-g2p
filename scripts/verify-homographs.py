"""Check every upstream homograph against Wiktionary and print a verdict.

This is the audit behind data/homographs-verified.tsv. It answers one question
per word: does en.wiktionary.org show two readings that split along the two
parts of speech the upstream table claims?

Wiktionary marks the pepet vowel in Indonesian headwords, so the evidence is
machine-readable: "ê" is /ə/, while "é" and "è" are not. A headword that still
has a bare "e" is unmarked, and proves nothing either way.

    python3 scripts/verify-homographs.py <path-to-bookbot-homographs_id.tsv>

Verdicts:
  confirmed    both classes match a marked Wiktionary reading; the rule ships
  half         one class matches; only that side ships
  single       every marked sense reads the same, so no POS rule can apply
  contradicted marked readings do not split along these classes
  unverified   no pepet-marked Indonesian entry to check against
"""

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 snowfluke

import json
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

UA = "indo-g2p-homograph-audit/1.0 (https://github.com/snowfluke/indo-g2p)"
POS_HEADS = ("Noun", "Verb", "Adjective", "Adverb", "Particle", "Numeral",
             "Preposition", "Interjection", "Proper noun", "Classifier")
# Bookbot's coarse letters mapped onto the Wiktionary part-of-speech headings.
CLASS = {"N": {"Noun", "Proper noun"}, "V": {"Verb"}, "A": {"Adjective"},
         "P": {"Particle", "Preposition"}, "M": set()}


def fetch(word: str) -> str:
    url = ("https://en.wiktionary.org/w/api.php?action=parse&page="
           f"{urllib.parse.quote(word)}&prop=wikitext&format=json&formatversion=2")
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.load(response).get("parse", {}).get("wikitext", "")
    except Exception:
        return ""


def language_section(text: str, language: str) -> str:
    import re
    start = text.find(f"=={language}==")
    if start < 0:
        return ""
    nxt = re.search(r"\n==[A-Z][^=\n]*==\n", text[start + 5:])
    return text[start:start + 5 + nxt.start()] if nxt else text[start:]


def etymologies(section: str) -> list[dict]:
    import re
    parts = re.split(r"\n===Etymology \d+===", section)
    parts = parts[1:] if len(parts) > 1 else [section]
    out = []
    for part in parts:
        heads = set()
        for pattern in (r"head=([^\|\}\n]+)", r"\{\{id-pr\|([^\|\}\n=]+)"):
            heads.update(m.group(1).strip() for m in re.finditer(pattern, part))
        pos = [h for h in POS_HEADS if re.search(rf"\n=+{h}=+\n", part)]
        if heads or pos:
            out.append({"heads": sorted(heads), "pos": pos})
    return out


def bare(text: str) -> str:
    text = text.replace(".", "").replace("-", "")
    return "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn").lower()


def read_head(word: str, head: str):
    """Return (schwa bitmask, count of unmarked `e`s), or None if it is not this word."""
    normalised = unicodedata.normalize("NFC", head.replace(".", "").replace("-", ""))
    if bare(normalised) != word:
        return None
    mask = unknown = index = 0
    for char in normalised:
        if bare(char) != "e":
            continue
        if char == "ê":
            mask |= 1 << index
        elif char not in ("é", "è"):
            unknown += 1
        index += 1
    return mask, unknown


def schwa_mask(phonemes: str) -> int:
    mask = 0
    for i, token in enumerate(t for t in phonemes.split() if t in ("e", "ə")):
        if token == "ə":
            mask |= 1 << i
    return mask


def verdict(word: str, class_1: str, class_2: str, mask_1: int, mask_2: int) -> tuple[str, str]:
    text = fetch(word)
    marked = []
    unmarked = 0
    for language in ("Indonesian", "Malay"):
        for ety in etymologies(language_section(text, language)):
            best = None
            for head in ety["heads"]:
                got = read_head(word, head)
                if got and got[1] == 0:
                    best = got[0]
                    break
            if best is None:
                unmarked += 1
            else:
                marked.append((best, frozenset(ety["pos"])))

    if not marked:
        return "unverified", "no pepet-marked entry"

    def evidence(cls: str) -> set:
        return {m for m, pos in marked if pos & CLASS[cls]}

    e1, e2 = evidence(class_1), evidence(class_2)
    ok1, ok2 = e1 == {mask_1} and len(e1) == 1, e2 == {mask_2} and len(e2) == 1
    caveat = f", {unmarked} sense(s) unmarked" if unmarked else ""

    if ok1 and ok2:
        return "confirmed", "both classes match" + caveat
    if len({m for m, _ in marked}) == 1:
        return "single", "every marked sense reads the same" + caveat
    if ok1 or ok2:
        return "half", f"{class_1 if ok1 else class_2} matches only" + caveat
    return "contradicted", "readings do not split by these classes" + caveat


def main() -> None:
    rows = Path(sys.argv[1]).read_text(encoding="utf-8").splitlines()
    counts = Counter()
    for row in rows:
        word, phone_1, phone_2, pos_1, pos_2 = row.split("\t")
        if pos_1 == pos_2 or phone_1 == phone_2:
            continue  # not resolvable by part of speech at all
        name, why = verdict(word.lower(), pos_1, pos_2,
                            schwa_mask(phone_1), schwa_mask(phone_2))
        counts[name] += 1
        print(f"{word:12s} {name:13s} {why}", flush=True)
        time.sleep(0.25)  # be polite to the API

    print("\n" + "  ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    print(f"total resolvable candidates: {sum(counts.values())}")


if __name__ == "__main__":
    main()
