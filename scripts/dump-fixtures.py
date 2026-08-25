"""Run the upstream Python g2p-id over a corpus and record its exact output.

The TypeScript port must reproduce this byte for byte. Dev-only:

    uv run --with python-crfsuite scripts/dump-fixtures.py <path-to-g2p-id-checkout>
"""

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 snowfluke
import csv
import json
import random
import sys
from pathlib import Path

CHECKOUT = Path(sys.argv[1])
sys.path.insert(0, str(CHECKOUT))

from g2p_id import G2P  # noqa: E402

SENTENCES = [
    "Tak seorang pun boleh ditangkap, ditahan atau dibuang dengan sewenang-wenang.",
    "Saya pergi ke sekolah naik sepeda motor pada pukul enam pagi.",
    "Nyanyian syahdu itu menggema di seluruh ruangan yang gelap.",
    "PT KAI mengumumkan jadwal baru KRL Jabodetabek mulai 1 Januari.",
    "Khusus hari ini, harga bakso dan mie ayam turun 50%!",
    "Anak-anak bermain layang-layang di pantai ketika matahari terbenam.",
    "Dia menjawab, \"Tidak!\" lalu pergi begitu saja.",
    "Universitas Indonesia menyelenggarakan seminar tentang teknologi kecerdasan buatan.",
    "",
    "   ",
    "12345",
    "e",
    "k",
    "aiaiai auau oioi",
]


def main() -> None:
    g2p = G2P()
    rng = random.Random(20260822)

    words = []
    with (CHECKOUT / "g2p_id" / "data" / "schwa_dict.csv").open(encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        words = [row[0] for row in reader]

    corpus = list(SENTENCES)
    corpus += rng.sample(words, 400)
    # Words that miss the schwa dictionary exercise the plain rules.
    corpus += ["bakso", "rokok", "periksa", "yakin", "taksi", "eksklusif", "xilofon",
               "warung", "tunggu", "bebek", "tante", "pojok", "khusus", "syarat",
               "nyamuk", "cakar", "jauh", "pulau", "amboi", "kakak", "duduk"]
    corpus += ["abcdefghijklmnopqrstuvwxyz", "kpk", "dpr", "tv", "sms", "pt", "cv", "id"]

    cases = []
    for text in corpus:
        for expand_abbr in (False, True):
            phonemes, syllables = g2p.to_phoneme(text, expand_abbr=expand_abbr)
            cases.append({
                "text": text,
                "expandAbbr": expand_abbr,
                "phonemes": phonemes,
                "syllables": syllables,
                "grapheme": g2p.to_grapheme(phonemes),
            })

    out = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "parity.json"
    out.write_text(json.dumps(cases, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"wrote {len(cases)} cases to {out}")


if __name__ == "__main__":
    main()
