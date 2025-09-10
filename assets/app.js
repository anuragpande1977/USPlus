// === USPlus® — Single-Parameter Table Comparator (frontend) ===
// No consent, no notes, no logging — clean and simple.

const CONFIG = {
  parameters: [
    { key:"usp_verified",           label:"USP Verified",                           type:"boolean" },
    { key:"clinical_study",         label:"Clinical Study Availability",            type:"boolean" },
    { key:"unique_claims",          label:"Unique Claims (Yes/No)",                 type:"boolean" },
    { key:"solvent_free",           label:"Solvent-Free Extraction",                type:"boolean" },
    { key:"monograph_compliance",   label:"Monograph Compliance",                   type:"boolean" },
    { key:"time_to_benefit_weeks",  label:"Clinically Meaningful Benefits (weeks)", type:"number"  },
    { key:"capsules_to_benefit",    label:"Capsules Needed for Benefit",            type:"number"  }
  ],
  // Order: USPlus, ViSPO, Flowens, SabalSelect, Permixon
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

document.addEventListener('DOMContentLoaded', () => {
  // Basic handles
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const form       = document.getElementById('form');
  const selectEl   = document.getElementById('paramSelect');
  const errBox     = document.getElementById('errBox');
  const results    = document.getElementById('results');
  const tableWrap  = document.getElementById('tableWrap');
  const paramTitle = document.getElementById('paramTitle');

  if (!selectEl) {
    console.error('Missing <select id="paramSelect"> in index.html');
    if (errBox) { errBox.textContent = 'Setup error: parameter dropdown missing.'; errBox.style.display = 'block'; }
    return;
  }

  if (errBox) errBox.style.display = 'none';
  if (results) results.style.display = 'none';

  // Populate dropdown (robust)
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
  const fmt = (v, type) => {
    if (v === "" || v === undefined || v === null) return "—";
    if (type === "boolean") return (Number(v) === 1 ? "Yes" : "No");
    return v;
  };

  // Render table for one parameter
  function renderParamTable(paramKey) {
    const param = CONFIG.parameters.find(p => p.key === paramKey);
    if (!param) return;

    if (paramTitle) paramTitle.textContent = `Results • ${param.label}`;

    // header: brands as columns
    const head = ['<th>Parameter</th>', ...CONFIG.products.map(b => `<th>${b.name}</th>`)].join('');
    // single row: selected parameter values per brand
    const row  = [`<td>${param.label}</td>`, ...CONFIG.products.map(b => `<td>${fmt(b.specs[param.key], param.type)}</td>`)].join('');

    tableWrap.innerHTML = `
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody><tr>${row}</tr></tbody>
      </table>
    `;

    if (results) results.style.display = 'block';
  }

  // Submit: validate & render
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errBox) errBox.style.display = 'none';
    if (results) results.style.display = 'none';

    const emailVal = (form.email?.value || '').trim();
    const paramKey = selectEl.value;

    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      if (errBox) { errBox.textContent = 'Please enter a valid email address.'; errBox.style.display = 'block'; }
      return;
    }
    if (!paramKey) {
      if (errBox) { errBox.textContent = 'Please choose a parameter.'; errBox.style.display = 'block'; }
      return;
    }

    renderParamTable(paramKey);
  });

  // Convenience for quick test in console: window.show('usp_verified')
  window.show = (k)=>{ selectEl.value = k; form.dispatchEvent(new Event('submit', {cancelable:true})); };
});

