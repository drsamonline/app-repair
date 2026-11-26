# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates: dd/mm/yyyy.

## [Unreleased]

## [1.0.0] — 26/11/2026

### Added
- **Model search** that matches exactly, and names a **neighbouring model as a near miss** instead of lending
  its guide — a guide for a different machine is a guide for a different machine.
- **Symptom search** across models, naming the model each guide belongs to, with an explicit note that it is
  not a diagnosis.
- **Three verdicts** on every guide: `home repair`, `careful`, `not a home repair`.
- **Mains appliances** marked `not a home repair` with the reason and **no steps** — a microwave stores high
  voltage after it is unplugged.
- **Parts** listed against a model, never against a family.
- Refusals: an empty model or symptom search; a model with no guide; an unmatched symptom, where **no fault
  is guessed at**.
- An unreadable bookmark file is reported and offered for export, never replaced with an empty list.
- PWA shell, CI (58 engine assertions + 16 in jsdom + page smoke), and the app-builder pipeline pinned to the
  canonical SHA for the EXE/APK/Linux release.

### Not built
- A full guide library: five appliances and ten guides, demonstrating the structure.
