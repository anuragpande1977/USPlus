// === USPlus® — Single-Parameter Table Comparator (robust) ===

// Expose CONFIG on window for debugging in Console.
window.CONFIG = {
  parameters: [
    { key:"usp_verified",           label:"USP Verified",                           type:"boolean" },
    { key:"clinical_study",         label:"Clinical Study Availability",            type:"boolean" },
    { key:"unique_claims",          label:"Unique Claims (Yes/No)",                 type:"boolean" },
    { key:"solvent_free",           label:"Solvent-Free Extraction",                type:"boolean" },
    { key:"monograph_compliance",   label:"Monograph Compliance",                   type:"boolean" },
    { key:"time_to_benefit_weeks",  label:"Clinically Meaningful Benefits (weeks)", type:"number"  },
    { key:"capsules_to_benefit",    label:"Capsules Needed for Benefit",            type:"number"  }
  ],
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
  console.log('[USPlus Comparator] DOMContentLoaded');

  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const form       = document.getElementById('form');
  const selectEl   = document.getElementById('paramSelect');
  const errBox     = document.getElementById('errBox');
  const results    = document.getElementById('results');
  const tableWrap  = document.getElementById('tableWrap');
  const paramTitle = document.getElementById('paramTitle');
  const paramDebug = document.getElementById('paramDebug');

  if (!form)       { console.error('Form #form not found'); }
  if (!selectEl)   { console.error('Select #paramSelect not found'); }
  if (!tableWrap)  { console.error('Div #tableWrap not found'); }

  // If the select element is missing, show a visible error
  if (!selectEl) {
    if (errBox) { errBox.textContent = 'Setup error: parameter dropdown missing (id="paramSelect").'; errBox.style.display = 'block'; }
    return;
  }

  // Populate dropdown safely
  try {
    const params = (window.CONFIG && Array.isArray(window.CONFIG.parameters)) ? window.CONFIG.parameters : [];
    console.log('[USPlus Comparator] parameters found:', params.length, params);

    selectEl.innerHTML = '<option value="">Select…</option>';

    params.forEach(p => {
      if (!p || !p.key || !p.label) return;
      const opt = document.createElement('option');
      opt.value = p.key;
      opt.textContent = p.label;
      selectEl.appendChild(opt);
    });

    // Visible debug if 0 options (beyond the "Select…" placeholder)
    const optionCount = selectEl.querySelectorAll('option').length - 1;
    if (paramDebug) {
      paramDebug.style.display = 'block';
      paramDebug.textContent = `Loaded ${optionCount} parameters`;
    }
    if (optionCount <= 0) {
      console.warn('No parameters inserted into dropdown. Check window.CONFIG.parameters.');
      if (errBox) { errBox.textContent = 'No parameters available. Please check app.js CONFIG.'; errBox.style.display = 'block'; }
      return;
    }
  } catch (e) {
    console.error('Failed to populate dropdown:', e);
    if (errBox) { errBox.textContent = 'Could not build parameter list.'; errBox.style.display = 'block'; }
    return;
  }

  const fmt = (v, type) => {
    if (v === "" || v === undefined || v === null) return "—";
    if (type === "boolean") return (Number(v) === 1 ? "Yes" : "No");
    return v;
    };

  function renderParamTable(paramKey) {
    const params = window.CONFIG.parameters || [];
    const param = params.find(p => p.key === paramKey);
    if (!param) return;

    if (paramTitle) paramTitle.textContent = `Results • ${param.label}`;

    const brands = window.CONFIG.products || [];
    // Build header row
    const head = ['<th>Parameter</th>', ...brands.map(b => `<th>${b.name}</th>`)].join('');
    // Build single data row
    const row  = [`<td>${param.label}</td>`,
      ...brands.map(b => `<td>${fmt((b.specs||{})[param.key], param.type)}</td>`)].join('');

    tableWrap.innerHTML = `
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody><tr>${row}</tr></tbody>
      </table>
    `;
    if (results) results.style.display = 'block';
  }

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

  // Quick console helper:
  window.show = (key) => { selectEl.value = key; form.dispatchEvent(new Event('submit', { cancelable:true })); };
});
