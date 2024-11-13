const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:8080'
}));
app.use(express.json());

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'receptportal'
});

connection.connect((err) => {
    if (err) {
        console.error('Chyba při připojení k databázi:', err);
        return;
    }
    console.log('Připojení k databázi bylo úspěšné.');
});

// Endpoint pro registraci
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Všechna pole jsou povinná." });
    }

    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    connection.query(query, [name, email, password], (err, results) => {
        if (err) {
            console.error('Chyba při vkládání uživatele:', err);
            return res.status(500).json({ error: "Nastala chyba při registraci." });
        }
        res.status(201).json({ message: "Registrace úspěšná", userId: results.insertId });
    });
});

// Endpoint pro přihlášení
app.post('/prihlaseni', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email a heslo jsou povinné." });
    }

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Chyba při přihlašování uživatele:', err);
            return res.status(500).json({ error: "Nastala chyba při přihlašování." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Neplatné přihlašovací údaje." });
        }

        res.status(200).json({ message: "Přihlášení úspěšné", user: results[0] });
    });
});

app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
