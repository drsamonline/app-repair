/* repair-core — the engine behind Repair.
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * (c) 2026 Dr Sohil Momin
 *
 * ONE JOB: find the right-to-repair guide and the part for YOUR model, and be honest about what you should
 * not open.
 *
 * THREE VERDICTS, and every guide carries exactly one:
 *   'home repair'          — you can do this with ordinary tools
 *   'careful'              — doable, but a step will ruin it if you rush
 *   'not a home repair'    — mains, sealed, or gas. Do not open it.
 *
 * It does NOT diagnose. There is no symptom guessing and no "it is probably the capacitor" — a fault it
 * cannot see is a fault it will not name.
 *
 * A neighbouring model's guide is NOT returned as though it were the same: models match exactly, and a
 * near miss is shown as a near miss.
 *
 * Pure functions: no DOM, no network, no storage.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RepairCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  var VERDICTS = ["home repair", "careful", "not a home repair"];

  /* A starter set. Each guide belongs to exactly one model. */
  var GUIDES = [
    { model: "MIX-450", appliance: "mixer grinder", title: "Replace the coupler", verdict: "home repair", minutes: 20, symptom: "jar wobbles and the blade does not turn", tools: "screwdriver, new coupler", steps: ["unplug", "remove the jar", "take off the base plate", "swap the coupler"] },
    { model: "MIX-450", appliance: "mixer grinder", title: "Change the carbon brushes", verdict: "careful", minutes: 35, symptom: "smell of burning, motor slows", tools: "screwdriver, new brushes", steps: ["unplug", "open the body", "note the brush orientation", "replace both", "close and test"] },
    { model: "MIX-460", appliance: "mixer grinder", title: "Replace the coupler", verdict: "home repair", minutes: 20, symptom: "jar wobbles and the blade does not turn", tools: "screwdriver, new coupler", steps: ["unplug", "remove the jar", "take off the base plate", "swap the coupler"] },
    { model: "KET-1200", appliance: "electric kettle", title: "Descale the element", verdict: "home repair", minutes: 15, symptom: "kettle takes longer and clicks off early", tools: "citric acid", steps: ["fill to the mark", "add citric acid", "boil and stand", "rinse twice"] },
    { model: "KET-1200", appliance: "electric kettle", title: "Open the base", verdict: "not a home repair", minutes: 0, symptom: "no power at all", tools: "\u2014", steps: [], why: "mains-powered and sealed. The base carries live wiring and the element is not a serviceable part." },
    { model: "FAN-900", appliance: "table fan", title: "Clean and re-oil the bush", verdict: "home repair", minutes: 30, symptom: "fan hums and turns slowly", tools: "screwdriver, light oil", steps: ["unplug", "remove the guard and blade", "clean the shaft", "two drops of oil", "reassemble"] },
    { model: "FAN-900", appliance: "table fan", title: "Replace the capacitor", verdict: "careful", minutes: 25, symptom: "fan hums but will not start", tools: "screwdriver, same-rating capacitor", steps: ["unplug", "open the base", "discharge the capacitor", "swap like for like"] },
    { model: "OVN-2000", appliance: "microwave oven", title: "Replace the door latch", verdict: "not a home repair", minutes: 0, symptom: "door does not latch", tools: "\u2014", steps: [], why: "a microwave stores high voltage even unplugged. The latch also interlock-tests the door, and a wrong one leaks." },
    { model: "IRN-300", appliance: "clothes iron", title: "Clear the steam holes", verdict: "home repair", minutes: 10, symptom: "iron spits and leaves marks", tools: "vinegar, cloth", steps: ["cool the iron", "wipe the plate", "run vinegar through the steam", "flush with water"] },
    { model: "IRN-300", appliance: "clothes iron", title: "Replace the cord", verdict: "not a home repair", minutes: 0, symptom: "cord is cut or frayed", tools: "\u2014", steps: [], why: "the cord is the mains lead. A joint in a heat-cycled mains lead is how fires start." }
  ];

  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function norm(s) { return clean(s).toUpperCase().replace(/[^A-Z0-9-]/g, ""); }

  function models() {
    var out = [];
    GUIDES.forEach(function (g) { if (out.indexOf(g.model) < 0) out.push(g.model); });
    return out;
  }

  function verdictOf(guide) {
    return guide && guide.verdict ? guide.verdict : "not a home repair";
  }

  /* Model search: EXACT model only. A neighbouring model's guide is never returned as though it were the
   * same — it is named as a near miss, and the near miss carries its own model name. */
  function forModel(query) {
    var q = norm(query);
    if (!q) return { ok: false, field: "model", reason: "a search with no model number is refused", guides: [] };
    var exact = GUIDES.filter(function (g) { return g.model === q; });
    if (exact.length) {
      return {
        ok: true, model: q, guides: exact.map(present), exact: true,
        says: exact.length + " guide(s) for " + q + ". Every one carries its verdict."
      };
    }
    /* a neighbouring model is one in the same series: MIX-470 is not MIX-450, but they are the same family
     * and a person will mistake one for the other, so the near miss is named */
    var series = q.split("-")[0];
    var near = models().filter(function (m) { return m !== q && (m.indexOf(q) >= 0 || q.indexOf(m) >= 0 || m.split("-")[0] === series); });
    return {
      ok: false, noMatch: true, model: q, guides: [], near: near,
      reason: "no guide for " + q + "." + (near.length ? " " + near.join(" and ") + " is a different model, and its guides are not offered as though they were the same." : " No nearby model either.") +
        " A guide for a neighbouring model is a guide for a different machine."
    };
  }

  /* Symptom search: returns guides across models, and NAMES the model each belongs to. It does not guess at
   * a fault. */
  function forSymptom(query) {
    var q = clean(query).toLowerCase();
    if (!q) return { ok: false, field: "symptom", reason: "a search with no words in it is refused", guides: [] };
    var hits = GUIDES.filter(function (g) {
      return (g.symptom || "").toLowerCase().indexOf(q) >= 0 || (g.title || "").toLowerCase().indexOf(q) >= 0 || (g.appliance || "").toLowerCase().indexOf(q) >= 0;
    });
    if (!hits.length) return { ok: false, noMatch: true, guides: [], reason: "nothing in the guide set matches \u201c" + clean(query) + "\u201d. No fault is guessed at: a symptom this app cannot match is a symptom it will not name." };
    var byModel = {};
    hits.forEach(function (g) { byModel[g.model] = true; });
    var modelCount = Object.keys(byModel).length;
    return {
      ok: true, guides: hits.map(present), models: Object.keys(byModel), modelCount: modelCount,
      says: hits.length + " guide(s) across " + modelCount + " model(s): " + Object.keys(byModel).join(", ") + ". Each guide names its own model \u2014 none of them is a diagnosis.",
      disclaimer: "This is a guide, not a diagnosis. It does not guess what is wrong with your machine."
    };
  }

  function present(g) {
    return {
      model: g.model, appliance: g.appliance, title: g.title, verdict: verdictOf(g),
      minutes: g.minutes, symptom: g.symptom, tools: g.tools, steps: (g.steps || []).slice(), why: g.why || "",
      mainsWarning: g.verdict === "not a home repair"
    };
  }

  /* Parts, by model. A part for a neighbouring model is not offered as fitting. */
  function partsFor(model) {
    var q = norm(model);
    var m = models().indexOf(q);
    if (m < 0) return { ok: false, noMatch: true, parts: [], reason: "no parts listed for " + q + "." };
    return { ok: true, model: q, parts: [{ name: "coupler", model: q }, { name: "carbon brushes (pair)", model: q }].filter(function (p) {
      return GUIDES.some(function (g) { return g.model === q && g.title.toLowerCase().indexOf(p.name.split(" ")[0]) >= 0; });
    }), says: "Parts are listed against a model, never against a family." };
  }

  function serialize(bookmarks) { return JSON.stringify({ version: VERSION, format: "repair-1", bookmarks: (bookmarks || []).slice() }, null, 2); }
  function parseState(text) {
    var raw = String(text == null ? "" : text);
    if (!raw.trim()) return { ok: false, empty: true, reason: "nothing has been bookmarked on this device yet", raw: raw };
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, unreadable: true, reason: "The saved bookmarks cannot be read. They were NOT replaced with an empty list; export them to keep them.", raw: raw }; }
    if (!data || !Array.isArray(data.bookmarks)) return { ok: false, unreadable: true, reason: "The saved file holds no bookmarks. Nothing was started over it; export it to keep it.", raw: raw };
    return { ok: true, bookmarks: data.bookmarks.slice(), raw: raw };
  }
  function stamp(when) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(when || "")); return m ? m[3] + "-" + m[2] + "-" + m[1] : "undated"; }
  function exportFile(what, payload, meta, writer) {
    meta = meta || {};
    if (typeof writer !== "function") return { ok: false, reason: "the file was not written: no writer is available in this browser" };
    var name, body, mime = "application/json";
    if (what === "bookmarks") { name = "repair-bookmarks-" + stamp(meta.when) + ".json"; body = serialize(payload.bookmarks); }
    else if (what === "raw") { name = "repair-unreadable-" + stamp(meta.when) + ".txt"; body = String(payload.raw || ""); mime = "text/plain;charset=utf-8"; }
    else return { ok: false, reason: "nothing was written: unknown export \u201c" + what + "\u201d" };
    try {
      var wrote = writer(name, body, mime);
      if (wrote === false) return { ok: false, filename: name, reason: "the file was not written: the browser refused the save" };
      return { ok: true, filename: name, bytes: body.length };
    } catch (e) {
      var why = e && e.name === "QuotaExceededError" ? "storage is full" : (e && e.message ? e.message : "storage is unavailable");
      return { ok: false, filename: name, reason: "the file was not written: " + why };
    }
  }

  return { version: VERSION, VERDICTS: VERDICTS, models: models, forModel: forModel, forSymptom: forSymptom,
    partsFor: partsFor, serialize: serialize, parseState: parseState, exportFile: exportFile };
});
