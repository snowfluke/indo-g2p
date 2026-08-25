// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * The only phoneme outputs allowed to differ from the Python original, keyed
 * by upstream's string.
 *
 * There are two causes, both deliberate:
 *
 * - The affix rules in `src/affix.ts`, and Bookbot's lexicon, recover a schwa
 *   upstream misses: `seoraŋ` becomes `səoraŋ`, `terbenam` becomes `tərbənam`
 *   and `meɲeleŋgarakan` becomes `məɲələŋgarakan`.
 * - The glottal-stop rule no longer fires before `r` and `l`, which are Latin
 *   onset clusters, so `biroʔratismə` becomes `birokratismə`.
 * - A native speaker corrected six homograph defaults, so `dʒədʒər` becomes
 *   `dʒedʒer`. See data/schwa-overrides.tsv.
 * - English words are read as English, so `the` is `də` rather than `tə`.
 *   Pass `english: false` for the Indonesian-rules behaviour.
 * - Normalisation is on by default, so digits and symbols are spelled out:
 *   `1 dʒanuari` becomes `satu dʒanuari` and `50%` becomes `lima puluh
 *   pərsen`. Pass `normalize: false` for the untouched behaviour.
 *
 * Listing them explicitly means a new divergence fails this test instead of
 * slipping through.
 */
export const KNOWN_IMPROVEMENTS: readonly (readonly [string, string])[] = [
  [
    "taʔ seoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan sewenaŋ-wənaŋ.",
    "taʔ səoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan səwənaŋ-wənaŋ.",
  ],
  [
    "ɲaɲian ʃahdu itu meŋgema di səluruh ruaŋan jaŋ gəlap.",
    "ɲaɲian ʃahdu itu məŋgəma di səluruh ruaŋan jaŋ gəlap.",
  ],
  [
    "pt kaɪ meŋumumkan dʒadwal baru krl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
    "pt kaɪ məŋumumkan dʒadwal baru krl dʒabodetabəʔ mulaɪ satu dʒanuari.",
  ],
  [
    "pété kaɪ meŋumumkan dʒadwal baru kaèrèl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
    "pété kaɪ məŋumumkan dʒadwal baru kaèrèl dʒabodetabəʔ mulaɪ satu dʒanuari.",
  ],
  [
    "xusus hari ini, harga baʔso dan miə ajam turun 50%!",
    "xusus hari ini, harga baʔso dan miə ajam turun lima puluh pərsen!",
  ],
  [
    "anaʔ-anaʔ bermain lajaŋ-lajaŋ di pantaɪ kətika matahari terbenam.",
    "anaʔ-anaʔ bərmain lajaŋ-lajaŋ di pantaɪ kətika matahari tərbənam.",
  ],
  [
    'dia mendʒawab, "tidaʔ!" lalu pərgi bəgitu sadʒa.',
    'dia məndʒawab, "tidaʔ!" lalu pərgi bəgitu sadʒa.',
  ],
  [
    "unifərsitas indonesia meɲeleŋgarakan səminar təntaŋ teʔnologi ketʃerdasan buatan.",
    "unifərsitas indonesia məɲələŋgarakan səminar təntaŋ teʔnologi kətʃərdasan buatan.",
  ],
  ["   ", " "],
  ["12345", "dua bəlas ribu tiga ratus əmpat puluh lima"],
  ["dʒədʒər", "dʒedʒer"],
  ["mempermanènkan", "məmpərmanènkan"],
  ["nuʔleotidasə", "nukleotidasə"],
  ["səʔlub", "səklub"],
  ["deʔristənisasi", "dekristənisasi"],
  ["ko.reh", "ko.re"],
  ["pətiʔrah", "pətikrah"],
  ["biroʔratismə", "birokratismə"],
];
