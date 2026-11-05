# Fonts

The stylesheet editor ships two coding fonts, both under the SIL Open Font License 1.1 (license texts alongside each).

- [Maple Mono](https://font.subf.dev/) v7.9 by the Maple Mono Project Authors: upstream variable fonts, converted to WOFF2.
- [Iosevka](https://typeof.net/Iosevka/) v34.9.1 by Renzhi Li (Belleve Invis): a custom build (`tools/iosevka-build-plan.toml`) with chosen letterforms and the fuller ligature set, minus hyphen chains so CSS custom properties keep their `--`, cut to Latin, punctuation, arrows, math and box-drawing characters.

`tools/build-fonts.sh` rebuilds this folder: Maple Mono from its release, Iosevka from source via `tools/build-iosevka.sh`.
