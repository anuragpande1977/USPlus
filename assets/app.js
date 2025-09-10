// === USPlus® — Comparison Tool (frontend) ===
// Optional logging to Google Sheet (leave "" to disable)
const SCRIPT_URL = ""; // e.g., "https://script.google.com/macros/s/AKfyc.../exec"

// Parameters (your list) — type & weight control scoring
// positive weight = higher is better; negative = lower is better
const CONFIG = {
  brandAnchorId: "usplus",
  parameters: [
    { key: "clinical_study",         label: "Clinical Study Availability",             type: "boolean", weight: 0.18 },
    { key: "usp_verified",           label: "USP Verified",                            type: "boolean", weight: 0.16 },
    { key: "unique_claims",          label: "Unique Claims Strength (0–5)",            type: "number",  weight: 0.14 },
    { key: "std_to_bio_fatty_acids", label: "Standardized to Bioactive Fatty Acids",   type: "boolean", weight: 0.14 },
    { key: "solvent_free",           label: "Solvent-Free Extraction",                  type: "boolean", weight: 0.12 },
    { key: "monograph_compliance",   label: "Monograph Compliance",                    type: "boolean", weight: 0.12 },
    { key: "time_to_benefit_weeks",  label: "Clinically Meaningful Benefits (weeks)",  type: "number",  weight: -0.10 }, // lower is better
    { key: "capsules_to_benefit",    label: "Capsules Needed for Benefit",             type: "number",  weight: -0.04 }  // lower is better
  ],

  // Fill these defaults once (1=Yes, 0=No for booleans; numbers for number fields)
  products: [
    {
      id: "usplus",
      name: "USPlus®",
      specs: {
        clinical_study: "",           // 1 or 0
        usp_verified: "",
        unique_claims: "",            // 0..5
        std_to_bio_fatty_acids: "",
        solvent_free: "",
        monograph_compliance: "",
        time_to_benefit_weeks: "",    // e.g., 8
        capsules_to_benefit: ""       // e.g., 2
      }
    },
    { id: "trunature",        name: "Trunature",        specs: { clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id: "flomentum_weider", name: "Flomentum Weider", specs: { clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id: "flowens",          name: "Flowens®",         specs: { clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id: "vispo",            name: "VisPO®",           specs: { clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } }
  ]
};

// ---------- UI bindings ----------
document.getElementById('yr').textContent = new Date().getFullYear();
const form       = document.getElementById('form');
const competitor = document.getElementById('competitor');
const paramWrap  = document.getElementById('paramFields');
const okBox      = document.getElementById('okBox');
const errBox     = document.getElementById('errBox');
const results    = document.getElementById('results');
const summary    = document.getElementById('summary');
const tableWrap  = document.getElementById('tableWrap');
const insights   = document.getElementById('insights');
const submitBtn  = document.getElementById('submitBtn');

okBox.style.display = 'none';
errBox.style.display = 'none';
results.style.display = 'none';

// ---------- Helpers ----------
const getProduct = id => CONFIG.products.find(p => p.id === id);
const getAnchor  = () => getProduct(CONFIG.brandAnchorId);

// Boolean helpers
const boolToNum = (v) => (v==="1"||v===1||v===true||v==="true"||v==="yes") ? 1
                       : (v==="0"||v===0||v===false||v==="false"||v==="no") ? 0
                       : NaN;
const fmtBool = (v) => (boolToNum(v)===1 ? "Yes" : boolToNum(v)===0 ? "No" : "—");

// Normalize to 0..1
function normalize(val, min, max){
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  if (min === max) return 0.5;
  return (n - min) / (max - min);
}

// Build competitor dropdown
(function populateCompetitors(){
  competitor.innerHTML = '<option value="">Select…</option>';
  CONFIG.products.filter(p => p.id !== CONFIG.brandAnchorId).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    competitor.appendChild(opt);
  });
})();

// Build parameter inputs (for USPlus override)
(function buildParamFields(){
  paramWrap.innerHTML = "";
  CONFIG.parameters.forEach(p => {
    const div = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.textContent = p.label;

    let input;
    if (p.type === "boolean") {
      input = document.createElement('select');
      input.name = p.key;
      input.innerHTML = `
        <option value="">Use default</option>
        <option value="1">Yes</option>
        <option value="0">No</option>
      `;
    } else {
      input = document.createElement('input');
      input.type = "number";
      input.step = "any";
      input.placeholder = "leave blank to use default";
      input.name = p.key;
    }

    div.appendChild(lbl);
    div.appendChild(input);
    paramWrap.appendChild(div);
  });
})();

// Compute score using available params only
function computeScore(specs, peers){
  const pool = peers.concat([specs]);
  let total = 0, used = 0;

  CONFIG.parameters.forEach(p => {
    // collect values across pool
    const vals = pool.map(x => {
      const raw = x[p.key];
      if (raw === "" || raw === undefined) return NaN;
      return p.type === "boolean" ? boolToNum(raw) : Number(raw);
    }).filter(v => !Number.isNaN(v));

    if (vals.length < 2) return;

    const min = Math.min(...vals), max = Math.max(...vals);
    const raw = specs[p.key];
    const my  = p.type === "boolean" ? boolToNum(raw) : Number(raw);
    if (Number.isNaN(my)) return;

    const norm = normalize(my, min, max);
    if (norm === null) return;

    const w = Number(p.weight) || 0;
    const contrib = w >= 0 ? norm * w : (1 - norm) * Math.abs(w);
    total += contrib; used += Math.abs(w);
  });

  if (used === 0) return 50; // neutral if nothing to compare
  return Math.round((total / used) * 100);
}

function renderTable(anchorSpecs, compSpecs, compName){
  let html = `<table>
    <thead><tr><th>Parameter</th><th>USPlus®</th><th>${compName}</th></tr></thead>
    <tbody>`;
  CONFIG.parameters.forEach(p => {
    const s = p.type === "boolean" ? fmtBool(anchorSpecs[p.key]) : (anchorSpecs[p.key] ?? "—");
    const c = p.type === "boolean" ? fmtBool(compSpecs[p.key])   : (compSpecs[p.key] ?? "—");
    html += `<tr><td>${p.label}</td><td>${s}</td><td>${c}</td></tr>`;
  });
  html += `</tbody></table>`;
  tableWrap.innerHTML = html;
}

// ---------- Submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  okBox.style.display = 'none';
  errBox.style.display = 'none';
  results.style.display = 'none';

  if (!competitor.value || !document.getElementById('consent').checked) {
    errBox.textContent = 'Please select a competitor and accept consent.';
    errBox.style.display = 'block';
    return;
  }

  const comp   = getProduct(competitor.value);
  const anchor = getAnchor();

  // Build USPlus runtime specs (use defaults if blank)
  const runtimeSpecs = {};
  CONFIG.parameters.forEach(p => {
    const raw = form[p.key]?.value?.trim();
    runtimeSpecs[p.key] = (raw === "" || raw === undefined) ? anchor.specs[p.key]
                        : (p.type === "boolean" ? raw : Number(raw));
  });

  // Scores
  const usScore   = computeScore(runtimeSpecs, [comp.specs]);
  const compScore = computeScore(comp.specs, [runtimeSpecs]);

  // Render
  summary.innerHTML = `
    <p><strong>Competitor:</strong> ${comp.name}</p>
    <p><strong>Overall Score (0–100):</strong> USPlus <b>${usScore}</b> vs ${comp.name} <b>${compScore}</b></p>
  `;
  renderTable(runtimeSpecs, comp.specs, comp.name);

  // Insights
  const diffs = [];
  CONFIG.parameters.forEach(p => {
    const s = p.type === "boolean" ? boolToNum(runtimeSpecs[p.key]) : Number(runtimeSpecs[p.key]);
    const c = p.type === "boolean" ? boolToNum(comp.specs[p.key])   : Number(comp.specs[p.key]);
    if (!Number.isNaN(s) && !Number.isNaN(c) && s !== c) {
      const better = (p.weight >= 0 ? (s > c) : (s < c)) ? "↑ better" : "↓ worse";
      const showS  = p.type === "boolean" ? (s===1?"Yes":"No") : s;
      const showC  = p.type === "boolean" ? (c===1?"Yes":"No") : c;
      diffs.push(`${p.label}: USPlus ${showS} vs ${showC} (${better})`);
    }
  });
  insights.innerHTML = diffs.length
    ? `<h3>Key Differences</h3><ul>${diffs.map(d=>`<li>${d}</li>`).join('')}</ul>`
    : `<p class="muted">No notable differences for the selected parameters.</p>`;

  results.style.display = 'block';

  // Optional logging
  const email = (form.email?.value || '').trim();
  const notes = (form.notes?.value || '').trim();
  if (SCRIPT_URL) {
    const payload = {
      email, notes,
      competitor: comp.name,
      anchor: "USPlus",
      usSpecs: runtimeSpecs,
      compSpecs: comp.specs,
      usScore, compScore,
      timestamp: new Date().toISOString()
    };
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      okBox.style.display = 'block';
    } catch {}
  }
});
