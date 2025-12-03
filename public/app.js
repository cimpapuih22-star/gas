
const api = (p, opts) => fetch('/api'+p, opts).then(r=>r.json());

function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

// Navigation
$all('.sidebar button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $all('.sidebar button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    $all('.view').forEach(v=>v.classList.add('hidden'));
    document.getElementById(btn.dataset.view).classList.remove('hidden');
    if(btn.dataset.view==='assets') loadAssets();
    if(btn.dataset.view==='loans') loadLoans();
    if(btn.dataset.view==='returns') loadReturns();
  });
});

// initial
window.addEventListener('load', ()=> document.querySelector('.sidebar button[data-view="assets"]').click());

// Load assets grid
async function loadAssets(){
  const data = await api('/assets');
  const grid = $('#grid'); grid.innerHTML = '';
  data.forEach(a=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${a.image || 'https://picsum.photos/400/240'}" alt="">
      <div class="body">
        <h3>${a.name}</h3>
        <div class="small">${a.brand} • ${a.model}</div>
        <div class="small">Status: <strong>${a.status}</strong></div>
        <div style="margin-top:8px" class="row">
          <button class="btn" onclick='openEdit(${a.id})'>Edit</button>
          <button class="btn ghost" onclick='openDelete(${a.id})'>Hapus</button>
          <button class="btn primary" onclick='openLoan(${a.id})'>Pinjam</button>
        </div>
      </div>`;
    grid.appendChild(el);
  });
}

// Add asset modal
$('#btnAdd').addEventListener('click', ()=>{
  const modal = createModal(`<h3>Tambah Asset</h3>
    <label>Nama<input id="m_name" class="input"></label>
    <label>Category<input id="m_cat" class="input"></label>
    <label>Brand<input id="m_brand" class="input"></label>
    <label>Model<input id="m_model" class="input"></label>
    <label>Image URL<input id="m_image" class="input" placeholder="https://... or leave blank"></label>
    <div style="text-align:right;margin-top:8px">
      <button class="btn" onclick="closeModal()">Batal</button>
      <button class="btn primary" id="saveNew">Simpan</button>
    </div>`);
  $('#saveNew').addEventListener('click', async ()=>{
    const body = { name:$('#m_name').value, category:$('#m_cat').value, brand:$('#m_brand').value, model:$('#m_model').value, status:'Tersedia', image:$('#m_image').value };
    await api('/assets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    closeModal(); loadAssets();
  });
});

// Edit
window.openEdit = async (id)=>{
  const a = await api('/assets/'+id);
  const modal = createModal(`<h3>Edit Asset</h3>
    <label>Nama<input id="e_name" class="input" value="${a.name}"></label>
    <label>Category<input id="e_cat" class="input" value="${a.category||''}"></label>
    <label>Brand<input id="e_brand" class="input" value="${a.brand||''}"></label>
    <label>Model<input id="e_model" class="input" value="${a.model||''}"></label>
    <label>Status<input id="e_status" class="input" value="${a.status||''}"></label>
    <label>Image URL<input id="e_image" class="input" value="${a.image||''}"></label>
    <div style="text-align:right;margin-top:8px">
      <button class="btn" onclick="closeModal()">Batal</button>
      <button class="btn primary" id="saveEdit">Simpan</button>
    </div>`);
  $('#saveEdit').addEventListener('click', async ()=>{
    const body = { name:$('#e_name').value, category:$('#e_cat').value, brand:$('#e_brand').value, model:$('#e_model').value, status:$('#e_status').value, image:$('#e_image').value };
    await api('/assets/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    closeModal(); loadAssets();
  });
}

// Delete
window.openDelete = (id) =>{
  const modal = createModal(`<h3>Hapus Asset</h3><p>Yakin akan menghapus asset ID ${id}?</p>
    <div style="text-align:right"><button class="btn" onclick="closeModal()">Batal</button>
    <button class="btn danger" id="confirmDel">Hapus</button></div>`);
  $('#confirmDel').addEventListener('click', async ()=>{
    await api('/assets/'+id, { method:'DELETE' });
    closeModal(); loadAssets();
  });
}

// Loan flow
window.openLoan = async (assetId) => {
  const modal = createModal(`<h3>Pinjam Asset</h3>
    <label>Asset ID <input id="loan_asset" class="input" value="${assetId}" readonly></label>
    <label>Nama Peminjam <input id="loan_borrower" class="input"></label>
    <label>Tanggal <input id="loan_date" type="date" class="input"></label>
    <div style="text-align:right;margin-top:8px"><button class="btn" onclick="closeModal()">Batal</button>
    <button class="btn primary" id="confirmLoan">Pinjam</button></div>`);
  $('#confirmLoan').addEventListener('click', async ()=>{
    const body = { asset_id: $('#loan_asset').value, borrower: $('#loan_borrower').value, date_loan: $('#loan_date').value };
    await api('/loans', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    closeModal(); loadAssets();
  });
};

async function loadLoans(){
  const data = await api('/loans');
  const list = $('#loanList'); list.innerHTML = '';
  data.filter(l=> l.status!=='Returned').forEach(l=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<div class="body"><strong>Loan ${l.id}</strong><div class="small">Asset ${l.asset_id} — ${l.borrower}</div>
      <div style="margin-top:8px" class="row">
        <button class="btn" onclick="prefillReturn(${l.id})">Pilih untuk Kembali</button>
      </div></div>`;
    list.appendChild(el);
  });
}

// Returns
async function loadReturns(){
  // prepare return loans list
  const loans = await api('/loans');
  const sel = $('#returnLoan'); sel.innerHTML = '<option value="">-- pilih peminjaman --</option>';
  loans.filter(l=> l.status!=='Returned').forEach(l => sel.insertAdjacentHTML('beforeend', `<option value="${l.id}">Loan ${l.id} — Asset ${l.asset_id} — ${l.borrower}</option>`));
}

// Prefill return form
window.prefillReturn = async (loanId) => {
  document.querySelector('.sidebar button[data-view="returns"]').click();
  const sel = $('#returnLoan'); sel.value = loanId;
};

// handle return form
$('#returnForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const loanId = $('#returnLoan').value;
  if(!loanId) return alert('Pilih peminjaman');
  const loan = await api('/loans/'+loanId);
  const body = { loan_id: loanId, asset_id: loan.asset_id, returned_by: $('#returnBy').value, date_return: $('#returnDate').value, condition: $('#returnCondition').value };
  await api('/returns', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  alert('Pengembalian tercatat');
  loadAssets(); loadLoans(); loadReturns();
});

// modal helpers
function createModal(innerHTML){
  const wrapper = document.createElement('div'); wrapper.className='modal';
  const panel = document.createElement('div'); panel.className='panel'; panel.innerHTML = innerHTML;
  wrapper.appendChild(panel);
  $('#modals').appendChild(wrapper);
  return wrapper;
}
function closeModal(){ const m = $('#modals'); m.innerHTML = ''; }

// search
$('#search').addEventListener('input', async (e)=>{
  const q = e.target.value.toLowerCase();
  const data = await api('/assets');
  const filtered = data.filter(a=> (a.name||'').toLowerCase().includes(q) || (a.brand||'').toLowerCase().includes(q) || (a.model||'').toLowerCase().includes(q));
  const grid = $('#grid'); grid.innerHTML = '';
  filtered.forEach(a=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${a.image || 'https://picsum.photos/400/240'}" alt="">
      <div class="body">
        <h3>${a.name}</h3>
        <div class="small">${a.brand} • ${a.model}</div>
        <div class="small">Status: <strong>${a.status}</strong></div>
        <div style="margin-top:8px" class="row">
          <button class="btn" onclick='openEdit(${a.id})'>Edit</button>
          <button class="btn ghost" onclick='openDelete(${a.id})'>Hapus</button>
          <button class="btn primary" onclick='openLoan(${a.id})'>Pinjam</button>
        </div>
      </div>`;
    grid.appendChild(el);
  });
});
