#!/usr/bin/env node
/* ui-tests — the Repair page in a real DOM (jsdom). SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin */
"use strict";
var fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
var ROOT = path.join(__dirname, ".."), PLAY = path.join(ROOT, "docs", "play");
var passed = 0, failed = [];
function ok(n, c, d) { if (c) { passed++; return; } failed.push(n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function build() {
  var dom = new JSDOM(fs.readFileSync(path.join(PLAY, "index.html"), "utf8"), { url: "https://example.test/play/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  var w = dom.window;
  w.URL.createObjectURL = function () { return "blob:x"; }; w.URL.revokeObjectURL = function () {};
  w.HTMLAnchorElement.prototype.click = function () {};
  ["web-kit.js", "export-kit.js", "repair-core.js", "app.js"].forEach(function (f) { w.eval(fs.readFileSync(path.join(PLAY, f), "utf8")); });
  return dom;
}
var dom = build(), w = dom.window, d = w.document, $ = function (id) { return d.getElementById(id); };
ok("the engine loaded", !!w.RepairCore);
ok("the guide set is listed", /MIX-450/.test($("models").textContent), $("models").textContent);

$("model").value = "MIX-450"; $("modelBtn").click();
eq("two guides are shown", d.querySelectorAll("#guideList > li").length, 2);
ok("the verdict is on each", /home repair/.test($("guideList").textContent) && /careful/.test($("guideList").textContent));
ok("with steps", d.querySelectorAll("#guideList ol.steps li").length >= 4);

$("model").value = "MIX-470"; $("modelBtn").click();
eq("a neighbour returns no guides", d.querySelectorAll("#guideList > li").length, 0);
ok("and says a neighbour is a different machine", /different machine|different model/.test($("status").textContent), $("status").textContent);

$("model").value = "OVN-2000"; $("modelBtn").click();
eq("the microwave guide is shown", d.querySelectorAll("#guideList > li").length, 1);
ok("marked not a home repair", /not a home repair/.test($("guideList").textContent));
ok("and it is flagged on screen", /mains/.test(d.querySelector("#guideList li").className), d.querySelector("#guideList li").className);
ok("with its reason", /high voltage even unplugged/.test($("guideList").textContent));
eq("and no steps are offered", d.querySelectorAll("#guideList ol.steps").length, 0);

$("symptom").value = "wobbles"; $("symptomBtn").click();
ok("a symptom search spans models", /across 2 model/.test($("guideSays").textContent), $("guideSays").textContent);
ok("and names each model", /MIX-450/.test($("guideList").textContent) && /MIX-460/.test($("guideList").textContent));

$("symptom").value = "smells of fish"; $("symptomBtn").click();
eq("an unmatched symptom returns nothing", d.querySelectorAll("#guideList > li").length, 0);
ok("and no fault is guessed", /will not name/.test($("status").textContent), $("status").textContent);

var total = passed + failed.length;
if (!total) { console.error("ui-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("ui-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("ui-tests: " + passed + "/" + total + " assertions passed");
