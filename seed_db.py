
import sqlite3, os
db_file = os.path.join(os.path.dirname(__file__), 'data.db')
if os.path.exists(db_file):
    os.remove(db_file)
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.executescript('''
CREATE TABLE assets(
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
);
CREATE TABLE loans(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    borrower TEXT,
    date_loan TEXT,
    status TEXT,
    notes TEXT
);
CREATE TABLE returns(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    asset_id INTEGER,
    returned_by TEXT,
    date_return TEXT,
    condition TEXT,
    notes TEXT
);
''')

assets = [
('Laptop Dell XPS 13', 'Laptop', 'Tersedia', 'Dell', 'XPS 13', 'SN12345', 'Sesuai', '', 'https://picsum.photos/seed/laptop/400/240'),
('Projector Epson', 'AV', 'Tersedia', 'Epson', 'EB-X', 'PJ9876', 'Sesuai', '', 'https://picsum.photos/seed/projector/400/240'),
('Kamera Canon', 'Foto', 'Dipinjam', 'Canon', 'EOS M50', 'CAM2020', 'Sesuai', '', 'https://picsum.photos/seed/camera/400/240')
]

c.executemany('INSERT INTO assets(name,category,status,brand,model,serial_no,condition,notes,image) VALUES (?,?,?,?,?,?,?,?,?)', assets)
conn.commit()
conn.close()
print('Seeded data.db')
