# Repair

Right-to-repair guides and part sources for your appliance — **for your exact model**, with a verdict on
every guide.

- **Demo:** https://drsamonline.github.io/app-repair/play/index.html
- **Landing page:** https://drsamonline.github.io/app-repair/
- **Release:** https://github.com/drsamonline/app-repair/releases/tag/app-latest
- **Plan row:** #31 of 37 in `drsamonline/forge` → `QUEUE/PLAN.json`
- **Specs absorbed:** `app-repair` (lead)
- **Licence:** PolyForm Noncommercial 1.0.0
- **Sponsor:** [github.com/sponsors/drsamonline](https://github.com/sponsors/drsamonline) — free, offline, no account

## Status

| | |
|---|---|
| **Built** | Exact model search; a near miss named as a near miss; symptom search across models; three verdicts on every guide; mains appliances marked with a reason and no steps; parts by model. |
| **Release** | Windows EXE, Android APK and Linux binary, built from this source by `app-builder` in CI. |
| **Not built** | **A full guide library.** Five appliances, ten guides — a demonstration of the structure, and every guide says what it is. |
| **Untested** | Whether these steps match any particular revision of any machine. They are a starter set written to demonstrate the shape of the app, not a service manual, and NOTICE says so. |

## The spec's "done means", counted

| The spec says | The test |
|---|---|
| a model search returns **that model's** guides and parts | MIX-450 → exactly 2 guides, both `model === "MIX-450"` |
| a neighbouring model's guide is not returned as though it were the same | MIX-470 → 0 guides, and MIX-450/MIX-460 named as different models |
| every guide carries one of three verdicts | every guide in the set checked against `VERDICTS` |
| mains appliances are marked **not a home repair** | the kettle base, the microwave and the iron cord — each with a reason and **no steps** |
| a symptom-only search returns guides for ≥ 2 models and names each | "wobbles" → MIX-450 and MIX-460, each guide naming its model |

## The rule that shapes the app

**A guide for a neighbouring model is a guide for a different machine.** The search matches the model exactly
and, when it misses, *names* the near models so the person can see what they nearly picked — rather than
quietly returning something close, which is how someone takes a kettle apart with a mixer's instructions.

## What it will not do

- **Diagnose a fault it cannot see** — no symptom guessing.
- **Encourage you into a mains appliance** — those guides carry a reason and no steps.
- **Return a neighbour's guide as though it were the same.**
- **Use the internet.**

## When things go wrong

| Case | Behaviour |
|---|---|
| **Bad input** | An empty model or symptom search is refused with the field named. |
| **No match** | The model search names any neighbouring models; the symptom search says no fault is guessed at. |
| **No network** | Nothing changes; the set is bundled. |
| **Corrupt saved state** | Reported and offered for export, never replaced with an empty list. |

## Tests

```bash
npm test                      # all three suites
node tests/self-tests.js      # engine — 58 assertions
node tests/ui-tests.js        # the page in jsdom — 16 assertions
node tests/page-smoke.js      # every local src/href resolves, nothing off-origin
```

Mutation-tested six ways on 26/11/2026, all red: a neighbour's guides returned (crash), mains not flagged (1
failure), a symptom search returning one model (3), a verdict defaulted away (3), a broken file starting
empty (3), and a mains guide offering steps (1).

**One mutation did nothing at all** — my anchor did not match the file, so the "survivor" was a no-op. It is
the third time that has happened in this project, and it is worth naming again: a mutation that does not
apply looks exactly like a test that cannot catch it.

## Two test mistakes, both mine

1. `#guideList li` counted the **nested step list items** as guides — 11 rows for a two-guide model. It is
   `#guideList > li` now.
2. A mutation anchor with the wrong escaping, which changed nothing and read as a survivor.

## Layout

```
docs/index.html            landing page
docs/play/index.html       the app — model search, symptom search, the guides
docs/play/app.js           DOM wiring: search, render the guides with their verdicts
docs/play/repair-core.js   the engine — the guide set, verdicts, search rules, parts
docs/play/web-kit.js       vendored kit (unmodified)
docs/play/export-kit.js    vendored kit (unmodified)
tests/self-tests.js        engine suite (58)
tests/ui-tests.js          page suite (16, jsdom)
tests/page-smoke.js        shape on disk
PAGES.json                 landing = docs/index.html, app = docs/play/index.html
```

## Where the spec was silent, and what was chosen

- **A near miss is named, not hidden.** The person should see that MIX-460 exists and is not theirs, rather than wonder why nothing came back.
- **A mains guide carries no steps at all.** A warning with instructions after it is not a warning.
- **The symptom search names models in its own sentence**, not only on each row — the count of models is the point of that search.
- **The three verdicts are a closed list**, checked in a test, so a fourth cannot appear without someone deciding to add it.
- **Parts are keyed to a model**, never a family, for the same reason as the guides.

## What is not built, and why

**A full guide library.** That needs real service manuals and a technician's review. What ships is the
structure — exact model matching, verdicts, mains warnings, symptom search across models — with ten guides
that demonstrate it, and a NOTICE that says plainly what they are not.
