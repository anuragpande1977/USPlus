// === USPlus® — Single-Parameter Table Comparator (frontend) ===
// Optional: paste a Google Apps Script Web App URL here to log each compare.
// Leave empty ("") to disable logging.
const SCRIPT_URL = "";

/** PARAMETERS (fixed) **/
const CONFIG = {
  parameters: [
    { key:"clinical_study",         label:"Clinical Study Availability",            type:"boolean" },
    { key:"usp_verified",           label:"USP Verified",                           type:"boolean" },
    { key:"unique_claims",          label:"Unique Claims Strength (0–5)",           type:"number"  },
    { key:"std_to_bio_fatty_acids", label:"Standardized to Bioactive Fatty Acids",  type:"boolean" },
    { key:"solvent_free",           label:"Solvent-Free Extraction",                type:"boolean" },
    { key:"monograph_compliance",   label:"Monograph Compliance",                   type:"boolean" },
    { key:"time_to_benefit_weeks",  label:"Clinically Meaningful Benefits (weeks)", type:"number"  }, // lower is better (info only)
    { key:"capsules_to_benefit",    label:"Capsules Needed for Benefit",            type:"number"  }  // lower is better (info only)
  ],
  // Fill values (1 = Yes, 0 = No for booleans; numbers for number fields)
  products: [
    { id:"usplus",    name:"USPlus®",  specs:{ clinical_study:"1", usp_verified:"1", unique_claims:"1", std_to_bio_fatty_acids:"1", solvent_free:"1", monograph_compliance:"1", time_to_benefit_weeks:"4", capsules_to_benefit:"30" } },
    { id:"weider",    name:"Weider",   specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"flowens",   name:"Flowens®", specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"vispo",     name:"ViSPO®",   specs:{ clinical_study:"1", usp_verified:"0", unique_claims:"0", std_to_bio_fatty_acids:"0", solvent_free:"0", monograph_compliance:"0", time_to_benefit_weeks:"12", capsules_to_benefit:"90" } },
    { id:"flomentum", name:"Flomentum",specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } },
    { id:"trunature", name:"Trunature",specs:{ clinical_study:"", usp_verified:"", unique_claims:"", std_to_bio_fatty_acids:"", solvent_free:"", monograph_compliance:"", time_to_benefit_weeks:"", capsules_to_benefit:"" } }
  ]
};

/* ---------- DOM ---------- */
document.getElementById('yr').textContent = new Date().getFullYear();
const form       = document.getElementById('form');
const selectEl   = document.getElementById('paramSelect');
const okBox      = document.getElementById('okBox');
const errBox     = document.getElementById('errBox');
const results    = document.getElementById('results');
const tableWrap  = document.getElementById('tableWrap');
const paramTitle = document.getElementById('paramTitle');

okBox.style.display = 'none';
errBox.style.display = 'none';
results.style.display = 'none';

/* ---------- helpers ---------- */
function boolToNum(v){
  if (v==="1"||v===1||v===true||v==="true"||v==="yes") return 1;
  if (v==="0"||v===0||v===false||v==="false"||v==="no") return 0;
  return NaN;
}
function fmt(v, type){
  if (v==="" || v===undefined || v===null) return "—";
  return type==="boolean" ? (boolToNum(v)===1 ? "Yes" : "No") : v;
}

/* ---------- build parameter dropdown ---------- */
selectEl.innerHTML = '<option value="">Select…</option>';
CONFIG.parameters.forEach(p=>{
  const opt = document.createElement('option');
  opt.value = p.key;
  opt.textContent = p.label;
  selectEl.appendChild(opt);
});

/* ---------- core: render a one-row table under each brand ---------- */
function renderParamTable(paramKey){
  const param = CONFIG.parameters.find(p=>p.key===paramKey);
  if (!param) return;

  paramTitle.textContent = `Results • ${param.label}`;

  // Build header with brands (USPlus first)
  const brands = [...CONFIG.products]; // already ordered: USPlus, then competitors
  const headCells = ['<th>Parameter</th>'].concat(brands.map(b=>`<th>${b.name}</th>`)).join('');

  // Single row with values under each brand
  const rowCells = [`<td>${param.label}</td>`].concat(
    brands.map(b=>`<td>${fmt(b.specs[param.key], param.type)}</td>`)
  ).join('');

  tableWrap.innerHTML = `
    <table>
      <thead><tr>${headCells}</tr></thead>
      <tbody><tr>${rowCells}</tr></tbody>
    </table>
  `;

  results.style.display = 'block';
}

/* ---------- submit ---------- */
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  okBox.style.display='none';
  errBox.style.display='none';
  results.style.display='none';

  const paramKey = selectEl.value;
  const consent  = document.getElementById('consent').checked;

  if (!paramKey || !consent){
    errBox.textContent = 'Please choose a parameter and accept consent.';
    errBox.style.display = 'block';
    return;
  }

  // render the table
  renderParamTable(paramKey);

  // optional logging
  if (SCRIPT_URL){
    const payload = {
      parameter: paramKey,
      timestamp: new Date().toISOString(),
      email: (form.email?.value || '').trim(),
      notes: (form.notes?.value || '').trim(),
      values: CONFIG.products.map(p=>({ brand:p.name, value:p.specs[paramKey] }))
    };
    try{
      await fetch(SCRIPT_URL, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      okBox.style.display='block';
    }catch{}
  }
});

// quick console helper: window.show('clinical_study')
window.show = (k)=>{ selectEl.value=k; renderParamTable(k); };

