// === USPlus® — Single-Parameter Table Comparator (robust) ===
const SCRIPT_URL = ""; // optional logging

const CONFIG = {
  parameters: [
    { key:"clinical_study",         label:"Clinical Study Availability",            type:"boolean" },
    { key:"usp_verified",           label:"USP Verified",                           type:"boolean" },
    { key:"unique_claims",          label:"Unique Claims Strength (0–5)",           type:"number"  },
    { key:"std_to_bio_fatty_acids", label:"Standardized to Bioactive Fatty Acids",  type:"boolean" },
    { key:"solvent_free",           label:"Solvent-Free Extraction",                type:"boolean" },
    { key:"monograph_compliance",   label:"Monograph Compliance",                   type:"boolean" },
    { key:"time_to_benefit_weeks",  label:"Clinically Meaningful Benefits (weeks)", type:"number"  },
    { key:"capsules_to_benefit",    label:"Capsules Needed for Benefit",            type:"number"  }
  ],
  products: [
    { id:"usplus",    name:"USPlus®",  specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"weider",    name:"Weider",   specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"flowens",   name:"Flowens®", specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"vispo",     name:"ViSPO®",   specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"flomentum", name:"Flomentum",specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"trunature", name:"Trunature",specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  // Basic elements
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const form       = document.getElementById('form');
  const selectEl   = document.getElementById('paramSelect');
  const okBox      = document.getElementById('okBox');
  const errBox     = document.getElementById('errBox');
  const results    = document.getElementById('results');
  const tableWrap  = document.getElementById('tableWrap');
  const paramTitle = document.getElementById('paramTitle');

  // Guard: if select not found, show a clear message
  if (!selectEl) {
    console.error('paramSelect element not found. Check your index.html: <select id="paramSelect">…</select>');
    if (errBox) { errBox.textContent = 'Setup error: parameter dropdown missing (id="paramSelect").'; errBox.style.display = 'block'; }
    return;
  }

  if (okBox) okBox.style.display = 'none';
  if (errBox) errBox.style.display = 'none';
  if (results) results.style.display = 'none';

  // Populate dropdown
  try {
    selectEl.innerHTML = '<option value="">Select…</option>';
    CONFIG.parameters.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.key;
      opt.textContent = p.label;
      selectEl.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to populate dropdown:', e);
    if (errBox) { errBox.textContent = 'Could not build parameter list.'; errBox.style.display = 'block'; }
    return;
  }

  // Helpers
  const boolToNum = (v) => (v==="1"||v===1||v===true||v==="true"||v==="yes") ? 1
                       : (v==="0"||v===0||v===false||v==="false"||v==="no") ? 0 : NaN;
  const fmt = (v,type) => (v===""||v===undefined||v===null) ? "—" : (type==="boolean" ? (boolToNum(v)===1?"Yes":"No") : v);

  // Render table for chosen param
  function renderParamTable(paramKey){
    const param = CONFIG.parameters.find(p=>p.key===paramKey);
    if (!param) return;
    if (paramTitle) paramTitle.textContent = `Results • ${param.label}`;

    const brands = [...CONFIG.products]; // USPlus first by design
    const th = ['<th>Parameter</th>', ...brands.map(b=>`<th>${b.name}</th>`)].join('');
    const tr = [`<td>${param.label}</td>`, ...brands.map(b=>`<td>${fmt(b.specs[param.key], param.type)}</td>`)].join('');

    tableWrap.innerHTML = `<table><thead><tr>${th}</tr></thead><tbody><tr>${tr}</tr></tbody></table>`;
    if (results) results.style.display = 'block';
  }

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (okBox) okBox.style.display = 'none';
    if (errBox) errBox.style.display = 'none';
    if (results) results.style.display = 'none';

    const paramKey = selectEl.value;
    const consent  = document.getElementById('consent')?.checked;

    if (!paramKey || !consent) {
      if (errBox) { errBox.textContent = 'Please choose a parameter and accept consent.'; errBox.style.display = 'block'; }
      return;
    }

    renderParamTable(paramKey);

    if (SCRIPT_URL) {
      const payload = {
        parameter: paramKey,
        timestamp: new Date().toISOString(),
        email: (form.email?.value || '').trim(),
        notes: (form.notes?.value || '').trim(),
        values: CONFIG.products.map(p=>({ brand:p.name, value:p.specs[paramKey] }))
      };
      try {
        await fetch(SCRIPT_URL, {
          method:'POST', mode:'no-cors',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if (okBox) okBox.style.display = 'block';
      } catch {}
    }
  });

  // Quick console helper
  window.show = (k)=>{ selectEl.value = k; form.dispatchEvent(new Event('submit', {cancelable:true})); };
});
