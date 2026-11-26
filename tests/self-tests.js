#!/usr/bin/env node
/* self-tests — Repair. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Done-means: a model search returns THAT model's guides and parts and never a neighbour's guide as though it
 * were the same; every guide carries one of three verdicts and mains appliances are marked not a home
 * repair; a symptom-only search returns guides for at least two models and names each model. */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var R = require(path.join(ROOT, "docs", "play", "repair-core.js"));
var passed = 0, failed = [], group = "";
function section(n) { group = n; }
function ok(n, c, d) { if (c) { passed++; return; } failed.push(group + " :: " + n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }

section("done means — a model search returns that model's guides");
var m = R.forModel("MIX-450");
eq("the search succeeds", m.ok, true);
eq("two guides for MIX-450", m.guides.length, 2);
ok("every guide is for that model", m.guides.every(function (g) { return g.model === "MIX-450"; }));
eq("and it is marked exact", m.exact, true);
eq("a lower-case model works too", R.forModel("mix-450").guides.length, 2);

section("done means — a neighbouring model's guide is NOT returned as though it were the same");
var near = R.forModel("MIX-470");
eq("the search does not succeed", near.ok, false);
eq("no guides are offered", near.guides.length, 0);
ok("the neighbouring models are named", near.near.indexOf("MIX-450") >= 0 && near.near.indexOf("MIX-460") >= 0, JSON.stringify(near.near));
ok("and it says a neighbour is a different machine", /different machine|different model/.test(near.reason), near.reason);
ok("MIX-460's guides are never shown for MIX-450", R.forModel("MIX-450").guides.every(function (g) { return g.model === "MIX-450"; }));
eq("an empty model search is refused", R.forModel("  ").field, "model");

section("done means — every guide carries one of the three verdicts");
R.models().forEach(function (model) {
  R.forModel(model).guides.forEach(function (g) {
    ok(model + " / " + g.title + " carries a verdict", R.VERDICTS.indexOf(g.verdict) >= 0, g.verdict);
  });
});
eq("there are exactly three verdicts", R.VERDICTS.length, 3);

section("done means — mains-powered appliances are marked not a home repair");
var kettle = R.forModel("KET-1200").guides;
eq("the kettle's base guide is not a home repair", kettle.filter(function (g) { return g.title === "Open the base"; })[0].verdict, "not a home repair");
eq("and it is flagged as mains", kettle.filter(function (g) { return g.title === "Open the base"; })[0].mainsWarning, true);
ok("with the reason given", /mains-powered and sealed/.test(kettle.filter(function (g) { return g.title === "Open the base"; })[0].why));
var mw = R.forModel("OVN-2000").guides[0];
eq("the microwave is not a home repair either", mw.verdict, "not a home repair");
ok("and says why a microwave is worse than it looks", /high voltage even unplugged/.test(mw.why), mw.why);
ok("a mains guide offers no steps", mw.steps.length === 0 && kettle.filter(function (g) { return g.title === "Open the base"; })[0].steps.length === 0);
eq("the iron's cord is not a home repair", R.forModel("IRN-300").guides.filter(function (g) { return g.title === "Replace the cord"; })[0].verdict, "not a home repair");

section("done means — a symptom-only search returns guides for at least two models and names each");
var s = R.forSymptom("wobbles");
eq("the search succeeds", s.ok, true);
ok("at least two models", s.modelCount >= 2, s.modelCount);
eq("the two mixer models", s.models.join(","), "MIX-450,MIX-460");
ok("every guide names its model", s.guides.every(function (g) { return g.model && g.model.length > 3; }));
ok("and the app says it is not a diagnosis", /not a diagnosis/.test(s.disclaimer), s.disclaimer);
var hums = R.forSymptom("hums");
ok("a second symptom also spans models", hums.ok && hums.guides.length >= 2, hums.guides.length);
eq("an unmatched symptom is refused", R.forSymptom("smells of fish").ok, false);
ok("and no fault is guessed", /will not name/.test(R.forSymptom("smells of fish").reason), R.forSymptom("smells of fish").reason);

section("must-not — it must not diagnose a fault it cannot see");
var core = read("docs/play/repair-core.js");
ok("no diagnosis field anywhere", !/\b(diagnosis|diagnose|likelyCause|probably|causeIs)\s*[:=]/i.test(core.replace(/not a diagnosis|does not diagnose|no diagnosis/g, "")));
ok("the symptom search returns guides, not a cause", !/rootCause|faultIs/i.test(core));
ok("no network call", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(core + read("docs/play/app.js")));
ok("the page forbids connections", /connect-src 'none'/.test(read("docs/play/index.html")));
ok("the page says a mains warning is not a challenge", /not a challenge; it is a warning/.test(read("docs/play/index.html")));

section("parts are listed against a model, never a family");
var parts = R.partsFor("MIX-450");
eq("parts are found for the exact model", parts.ok, true);
ok("every part names the model", parts.parts.every(function (p) { return p.model === "MIX-450"; }));
ok("and the app says so", /never against a family/.test(parts.says), parts.says);
eq("no parts for an unknown model", R.partsFor("MIX-999").ok, false);

section("storage");
var bad = R.parseState("{ broken bookmarks");
eq("a broken file is reported", bad.ok, false);
eq("it is marked unreadable", bad.unreadable, true);
ok("it was not replaced with an empty list", /NOT replaced with an empty list/.test(bad.reason), bad.reason);
eq("nothing saved yet is distinguished", R.parseState("").empty, true);
var thrown = R.exportFile("bookmarks", { bookmarks: [] }, { when: "26/11/2026" }, function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; });
eq("a failed write is reported", thrown.ok, false);

section("shape — every script the page loads exists beside it");
var page = read("docs/play/index.html");
var srcs = (page.match(/<script[^>]+src="([^"]+)"/g) || []).map(function (t) { return t.replace(/.*src="([^"]+)"/, "$1"); });
srcs.forEach(function (x) { ok("script src resolves: " + x, fs.existsSync(path.join(ROOT, "docs", "play", x.replace(/^\.\//, "")))); });
ok("the landing page exists", fs.existsSync(path.join(ROOT, "docs", "index.html")));
ok("the page manifest exists", fs.existsSync(path.join(ROOT, "PAGES.json")));
ok("the web manifest exists", fs.existsSync(path.join(ROOT, "docs", "play", "manifest.webmanifest")));

var total = passed + failed.length;
if (!total) { console.error("self-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("self-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.slice(0, 12).forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("self-tests: " + passed + "/" + total + " assertions passed");
