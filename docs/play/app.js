/* app — the Repair page. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Wiring only: the guide set, the verdicts and the search rules live in repair-core.js. */
(function () {
  "use strict";
  var R = window.RepairCore;
  var $ = function (id) { return document.getElementById(id); };

  var els = { status: $("status"), model: $("model"), modelBtn: $("modelBtn"), models: $("models"),
    symptom: $("symptom"), symptomBtn: $("symptomBtn"), guideSays: $("guideSays"), guideList: $("guideList") };

  function setStatus(k, m) { els.status.className = "status show " + k; els.status.textContent = m; }
  function node(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  function render(out) {
    els.guideList.textContent = "";
    els.guideSays.textContent = out.ok ? out.says : out.reason;
    if (!out.ok) { setStatus("warn", out.reason); return; }
    out.guides.forEach(function (g) {
      var cls = g.verdict === "not a home repair" ? "mains" : (g.verdict === "careful" ? "careful" : "");
      var li = node("li", cls);
      var head = node("div");
      head.appendChild(node("span", "verdict", g.verdict));
      head.appendChild(document.createTextNode("  " + g.title));
      li.appendChild(head);
      li.appendChild(node("span", "meta", g.model + " \u00b7 " + g.appliance + (g.minutes ? " \u00b7 " + g.minutes + " min" : "") + (g.tools && g.tools !== "\u2014" ? " \u00b7 " + g.tools : "")));
      if (g.verdict === "not a home repair") {
        li.appendChild(node("div", null, g.why));
      } else {
        var ol = node("ol", "steps");
        g.steps.forEach(function (st) { ol.appendChild(node("li", null, st)); });
        li.appendChild(ol);
      }
      els.guideList.appendChild(li);
    });
    setStatus("ok", out.says);
  }

  function byModel() {
    render(R.forModel(els.model.value));
  }
  function bySymptom() {
    render(R.forSymptom(els.symptom.value));
  }

  els.modelBtn.addEventListener("click", byModel);
  els.symptomBtn.addEventListener("click", bySymptom);
  els.model.addEventListener("keydown", function (e) { if (e.key === "Enter") byModel(); });
  els.symptom.addEventListener("keydown", function (e) { if (e.key === "Enter") bySymptom(); });

  els.models.textContent = "In the guide set: " + R.models().join(", ") + ".";
  els.guideSays.textContent = "Search a model or a symptom.";

  if (window.Loom && window.Loom.pwa) window.Loom.pwa.register("sw.js");
})();
