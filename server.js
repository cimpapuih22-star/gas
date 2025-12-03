
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    status TEXT,
    brand TEXT,
    model TEXT,
    serial_no TEXT,
    condition TEXT,
    notes TEXT,
    image TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    borrower TEXT,
    date_loan TEXT,
    status TEXT,
    notes TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    asset_id INTEGER,
    returned_by TEXT,
    date_return TEXT,
    condition TEXT,
    notes TEXT
  )`);
});

// Utility wrapper to run db operations with Promise
function all(sql, params=[]) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function get(sql, params=[]) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function run(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(err) { err ? reject(err) : resolve(this); }));
}

// Assets CRUD
app.get('/api/assets', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM assets ORDER BY id DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/assets', async (req, res) => {
  try {
    const a = req.body;
    const result = await run(`INSERT INTO assets (name, category, status, brand, model, serial_no, condition, notes, image)
      VALUES (?,?,?,?,?,?,?,?,?)`, [a.name,a.category,a.status,a.brand,a.model,a.serial_no,a.condition,a.notes,a.image||'']);
    const inserted = await get('SELECT * FROM assets WHERE id = ?', [result.lastID]);
    res.json(inserted);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const a = req.body;
    await run(`UPDATE assets SET name=?, category=?, status=?, brand=?, model=?, serial_no=?, condition=?, notes=?, image=? WHERE id=?`,
      [a.name,a.category,a.status,a.brand,a.model,a.serial_no,a.condition,a.notes,a.image||'', req.params.id]);
    const updated = await get('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await run('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.json({deleted: true});
  } catch (e) { res.status(500).json({error: e.message}); }
});

// Loans
app.get('/api/loans', async (req,res) => {
  try {
    const rows = await all('SELECT * FROM loans ORDER BY id DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/loans/:id', async (req,res) => {
  try {
    const row = await get('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/loans', async (req,res) => {
  try {
    const l = req.body;
    const result = await run('INSERT INTO loans (asset_id, borrower, date_loan, status, notes) VALUES (?,?,?,?,?)',
      [l.asset_id, l.borrower, l.date_loan, 'Dipinjam', l.notes||'']);
    await run('UPDATE assets SET status = ? WHERE id = ?', ['Dipinjam', l.asset_id]);
    const inserted = await get('SELECT * FROM loans WHERE id = ?', [result.lastID]);
    res.json(inserted);
  } catch (e) { res.status(500).json({error: e.message}); }
});

// Returns
app.post('/api/returns', async (req,res) => {
  try {
    const r = req.body;
    const result = await run('INSERT INTO returns (loan_id, asset_id, returned_by, date_return, condition, notes) VALUES (?,?,?,?,?,?)',
      [r.loan_id, r.asset_id, r.returned_by, r.date_return, r.condition, r.notes||'']);
    const newStatus = (r.condition && r.condition.toLowerCase().includes('rusak')) ? 'Tidak Berfungsi' : 'Tersedia';
    await run('UPDATE assets SET condition = ?, status = ? WHERE id = ?', [r.condition, newStatus, r.asset_id]);
    await run('UPDATE loans SET status = ? WHERE id = ?', ['Returned', r.loan_id]);
    const inserted = await get('SELECT * FROM returns WHERE id = ?', [result.lastID]);
    res.json(inserted);
  } catch (e) { res.status(500).json({error: e.message}); }
});

// Simple health
app.get('/api/health', (req,res)=> res.json({ok:true}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server started on port', PORT));
