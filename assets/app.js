// === USPlus® — Single-Parameter Table Comparator (frontend) ===
// Optional: set a Google Apps Script Web App URL to log submissions; leave "" to disable logging.
const SCRIPT_URL = "";

/** Fixed parameter list per your spec **/
const CONFIG = {
  // One-row table with these brands as columns, in this order:
  brandsOrder: ["USPlus", "ViSPO", "Flowens", "SabalSelect", "Permixon"],

  parameters: [
    { key:"usp_verified",           label:"USP Verified",                           type:"boolean" },
    { key:"clinical_study",         label:"Clinical Study Availability",            type:"boolean" },
    { key:"unique_claims",          label:"Unique Claims (Yes/No)",                 type:"boolean" },
    { key:"solvent_free",           label:"Solvent-Free Extraction",                type:"boolean" },
    { key:"monograph_compliance",   label:"Monograph Compliance",                   type:"boolean" },
    { key:"time_to_benefit_weeks",  label:"Clinically Meaningful Benefits (weeks)", type:"number"  },
    { key:"capsules_to_benefit",    label:"Capsules Needed for Benefit",            type:"number"  }
  ],

  // Prefilled brand values from your message (1 = Yes, 0 = No for booleans)
  products: [
    {
      id:"usplus", name:"USPlus",
      specs:{
        usp_verified:1,
        clinical_study:1,
        unique_claims:1,
        solvent_free:1,
        monograph_compliance:1,
        time_to_benefit_weeks:4,
        capsules_to_benefit:30
      }
    },
    {
      id:"vispo", name:"ViSPO",
      specs:{
        usp_verified:0,
        clinical_study:1,
        unique_claims:0,
        solvent_free:0,
        monograph_compliance:0,
        time_to_benefit_weeks:12,
        capsules_to_benefit:90
      }
    },
    {
      id:"flowens", name:"Flowens",
      specs:{
        usp_verified:0,
        clinical_study:1,
        unique_claims:0,
        solvent_free:0,
        monograph_compliance:0,
        time_to_benefit_weeks:24,
        capsules_to_benefit:180
      }
    },
    {
      id:"sabalselect", name:"SabalSelect",
      specs:{
        usp_verified:0,
        clinical_study:1,
        unique_claims:0,
        solvent_free:0,
        monograph_compliance:0,
        time_to_benefit_weeks:12,
        capsules_to_benefit:90
      }
    },
    {
      id:"permixon", name:"Permixon",
      specs:{
        usp_verified:0,
        clinical_study:1,
        unique_claims:0,
        solvent_free:0,
        monograph_compliance:0,
        time_to_benefit_weeks:12,
        capsules_to_benefit:90
      }
    }
  ]
};

/* ---------- DOM boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const form       = document.getElementById('form');
  const selectEl   = document.getElementById('paramSelect');
  const okBox      = document.getElementById('okBox');
  const errBox     = document.getElementById('errBox');
  const results    = document.getElementById('results');
  const tableWrap  = document.getElementById('tableWrap');
  const paramTitle = document.getElementById('paramTitle');
  const submitBtn  = document.getElementById('submitBtn');

  if (!selectEl) {
    console.error('Missing <select id="paramSelect"> in index.html');
    if (errBox) { errBox.textContent = 'Setup error: parameter dropdown missing.'; errBox.style.display = 'block'; }
    return;
  }

  if (okBox) okBox.style.display = 'none';
  if (errBox) errBox.style.display = 'none';
  if (results) results.style.display = 'none';

  // Build parameter dropdown
  selectEl.innerHTML = '<option value="">Select…</option>';
  CONFIG.parameters.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.label;
    selectEl.appendChild(opt);
  });

  // Helper formatting
  const fmt = (v, type) => {
    if (v === "" || v === undefined || v === null) return "—";
    if (type === "boolean") return (Number(v) === 1 ? "Yes" : "No");
    return v;
  };

  // Ensure brands are displayed in the requested order
  const brands = CONFIG.brandsOrder.map(name => {
    const match = CONFIG.products.find(p => p.name.toLowerCase() === name.toLowerCase());
    return match || { id:name.toLowerCase(), name, specs:{} };
  });

  // Render table for one parameter
  function renderParamTable(paramKey) {
    const param = CONFIG.parameters.find(p => p.key === paramKey);
    if (!param) return;

    if (paramTitle) paramTitle.textContent = `Results • ${param.label}`;

    const head = ['<th>Parameter</th>', ...brands.map(b => `<th>${b.name}</th>`)].join('');
    const row  = [`<td>${param.label}</td>`, ...brands.map(b => `<td>${fmt(b.specs[param.key], param.type)}</td>`)].join('');

    tableWrap.innerHTML = `<table>
      <thead><tr>${head}</tr></thead>
      <tbody><tr>${row}</tr></tbody>
    </table>`;

    if
