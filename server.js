const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper functions
function readDB() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// GET all family members
app.get('/api/family', (req, res) => {
    try {
        const db = readDB();
        res.json(db.family);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// GET single family member
app.get('/api/family/:id', (req, res) => {
    try {
        const db = readDB();
        const member = db.family.find(m => m.id === parseInt(req.params.id));
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ error: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST new family member
app.post('/api/family', (req, res) => {
    try {
        const db = readDB();
        const newMember = {
            id: db.family.length > 0 ? Math.max(...db.family.map(m => m.id)) + 1 : 1,
            name: req.body.name,
            ttl: req.body.ttl,
            address: req.body.address,
            hp: req.body.hp,
            ktp: req.body.ktp,
            photo: req.body.photo || `https://i.pravatar.cc/100?u=${Date.now()}`,
            role: req.body.role,
            parentId: req.body.parentId || null,
            spouseId: req.body.spouseId || null,
            generation: req.body.generation || 1
        };
        db.family.push(newMember);
        writeDB(db);
        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// PUT update family member
app.put('/api/family/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.family.findIndex(m => m.id === parseInt(req.params.id));
        if (index !== -1) {
            db.family[index] = {
                ...db.family[index],
                name: req.body.name || db.family[index].name,
                ttl: req.body.ttl || db.family[index].ttl,
                address: req.body.address || db.family[index].address,
                hp: req.body.hp || db.family[index].hp,
                ktp: req.body.ktp || db.family[index].ktp,
                photo: req.body.photo || db.family[index].photo,
                role: req.body.role || db.family[index].role,
                parentId: req.body.parentId !== undefined ? req.body.parentId : db.family[index].parentId,
                spouseId: req.body.spouseId !== undefined ? req.body.spouseId : db.family[index].spouseId,
                generation: req.body.generation || db.family[index].generation
            };
            writeDB(db);
            res.json(db.family[index]);
        } else {
            res.status(404).json({ error: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// DELETE family member
app.delete('/api/family/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.family.findIndex(m => m.id === parseInt(req.params.id));
        if (index !== -1) {
            const deleted = db.family.splice(index, 1);
            writeDB(db);
            res.json(deleted[0]);
        } else {
            res.status(404).json({ error: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html in your browser`);
});
