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

// Endpoint pro přidání receptu
app.post('/recipes', (req, res) => {
    const { userId, title, description, image, instructions, ingredients } = req.body;

    if (!title || !userId || instructions.length === 0 || ingredients.length === 0) {
        return res.status(400).json({ error: "Název, instrukce a ingredience jsou povinné." });
    }

    const query = 'INSERT INTO recipes (user_id, title, description, image) VALUES (?, ?, ?, ?)';
    connection.query(query, [userId, title, description, image], (err, result) => {
        if (err) {
            console.error('Chyba při ukládání receptu:', err);
            return res.status(500).json({ error: "Nastala chyba při ukládání receptu." });
        }

        const recipeId = result.insertId;

        instructions.forEach((instruction, index) => {
            const instructionQuery = 'INSERT INTO recipe_instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)';
            connection.query(instructionQuery, [recipeId, index + 1, instruction.text], (err) => {
                if (err) {
                    console.error('Chyba při ukládání instrukce:', err);
                    return res.status(500).json({ error: "Nastala chyba při ukládání instrukcí." });
                }
            });
        });

        ingredients.forEach((ingredient) => {
            const ingredientQuery = 'INSERT INTO ingredients (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name';
            connection.query(ingredientQuery, [ingredient.name], (err, result) => {
                if (err) {
                    console.error('Chyba při ukládání ingredience:', err);
                    return res.status(500).json({ error: "Nastala chyba při ukládání ingrediencí." });
                }

                const ingredientId = result.insertId || result[0].id;

                const recipeIngredientQuery = 'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)';
                connection.query(recipeIngredientQuery, [recipeId, ingredientId, ingredient.amount], (err) => {
                    if (err) {
                        console.error('Chyba při ukládání vztahu mezi receptem a ingrediencí:', err);
                        return res.status(500).json({ error: "Nastala chyba při ukládání vztahu mezi receptem a ingrediencí." });
                    }
                });
            });
        });

        res.status(201).json({ message: "Recept byl úspěšně uložen.", recipeId });
    });
});

// Endpoint pro odstranění receptu
app.delete('/deleterecipe/:id', (req, res) => {
    const recipeId = req.params.id;

    // Mazání závislých dat: každý DELETE se provede samostatně
    connection.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId], (err) => {
        if (err) {
            console.error('Chyba při mazání závislých dat (recipe_ingredients):', err);
            return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (recipe_ingredients).' });
        }

        connection.query('DELETE FROM recipe_instructions WHERE recipe_id = ?', [recipeId], (err) => {
            if (err) {
                console.error('Chyba při mazání závislých dat (recipe_instructions):', err);
                return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (recipe_instructions).' });
            }

            // Mazání samotného receptu
            connection.query('DELETE FROM recipes WHERE id = ?', [recipeId], (err) => {
                if (err) {
                    console.error('Chyba při mazání receptu:', err);
                    return res.status(500).json({ error: 'Nastala chyba při mazání receptu.' });
                }

                res.status(200).json({ message: 'Recept byl úspěšně odstraněn.' });
            });
        });
    });
});


// Endpoint pro získání uživatelského profilu a jeho receptů
app.get('/datareceptprofile', (req, res) => {
    const userId = req.query.userId; // nebo z tokenu, pokud používáte autentifikaci pomocí JWT

    if (!userId) {
        return res.status(400).json({ error: "ID uživatele je povinné." });
    }

    const userQuery = 'SELECT id, name, email FROM users WHERE id = ?';
    connection.query(userQuery, [userId], (err, userResults) => {
        if (err) {
            console.error('Chyba při načítání uživatele:', err);
            return res.status(500).json({ error: "Chyba při načítání uživatele." });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: "Uživatel nenalezen." });
        }

        const user = userResults[0];

        const recipesQuery = 'SELECT id, title, created_at FROM recipes WHERE user_id = ?';
        connection.query(recipesQuery, [userId], (err, recipesResults) => {
            if (err) {
                console.error('Chyba při načítání receptů:', err);
                return res.status(500).json({ error: "Chyba při načítání receptů." });
            }

            res.status(200).json({
                user: user,
                recipes: recipesResults
            });
        });
    });
});

// Endpoint pro načtení detailů receptu podle jeho ID
app.get('/recipe/:recipeId', (req, res) => {
    const recipeId = req.params.recipeId;

    if (!recipeId) {
        return res.status(400).json({ error: "ID receptu je povinné." });
    }

    // Dotaz pro získání základních informací o receptu
    const recipeQuery = `
        SELECT r.id, r.title, r.description, r.image, r.created_at, u.name AS author
        FROM recipes r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    `;

    connection.query(recipeQuery, [recipeId], (err, recipeResults) => {
        if (err) {
            console.error('Chyba při načítání receptu:', err);
            return res.status(500).json({ error: "Chyba při načítání receptu." });
        }

        if (recipeResults.length === 0) {
            return res.status(404).json({ error: "Recept nenalezen." });
        }

        const recipe = recipeResults[0];

        // Dotaz pro načtení ingrediencí receptu
        const ingredientsQuery = `
            SELECT i.name, ri.amount
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
        `;

        connection.query(ingredientsQuery, [recipeId], (err, ingredientResults) => {
            if (err) {
                console.error('Chyba při načítání ingrediencí:', err);
                return res.status(500).json({ error: "Chyba při načítání ingrediencí." });
            }

            // Dotaz pro načtení kroků receptu
            const instructionsQuery = `
                SELECT ri.step_number, ri.instruction
                FROM recipe_instructions ri
                WHERE ri.recipe_id = ?

            `;

            connection.query(instructionsQuery, [recipeId], (err, instructionResults) => {
                if (err) {
                    console.error('Chyba při načítání instrukcí:', err);
                    return res.status(500).json({ error: "Chyba při načítání instrukcí." });
                }

                // Sestavení odpovědi do JSON formátu
                const response = {
                    id: recipe.id,
                    title: recipe.title,
                    description: recipe.description,
                    image: recipe.image,
                    created_at: recipe.created_at,
                    author: recipe.author,
                    ingredients: ingredientResults.map(ingredient => ({
                        name: ingredient.name,
                        amount: ingredient.amount
                    })),
                    instructions: instructionResults.map(instruction => ({
                        step_number: instruction.step_number,
                        instruction: instruction.instruction
                    }))
                };

                res.status(200).json(response);
            });
        });
    });
});

app.get('/random-recipes', (req, res) => {
    // Dotaz na všechny recepty a jejich ingredience
    const query = `
        SELECT recipes.*, GROUP_CONCAT(ingredients.name) AS ingredients
        FROM recipes
        LEFT JOIN recipe_ingredients ON recipes.id = recipe_ingredients.recipe_id
        LEFT JOIN ingredients ON recipe_ingredients.ingredient_id = ingredients.id
        GROUP BY recipes.id
        ORDER BY RAND()
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Chyba při načítání receptů: ', err);
            return res.status(500).json({ error: 'Chyba při načítání receptů.' });
        }
        res.json(results);  // Vrátí všechny recepty v náhodném pořadí, včetně ingrediencí
    });
});



app.get('/filter-recipes', (req, res) => {
    const { ingredients, title } = req.query;
    console.log('Received ingredients:', ingredients);  // Log pro kontrolu
    console.log('Received title:', title);  // Log pro kontrolu

    let query = `
        SELECT DISTINCT r.id, r.title, r.description, GROUP_CONCAT(i.name) AS ingredients
        FROM recipes r
        LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    `;
    const queryParams = [];
    const conditions = [];

    if (title) {
        conditions.push(`r.title LIKE ?`);
        queryParams.push(`%${title}%`);
    }

    if (ingredients) {
        const ingredientList = ingredients.split(',').map(ing => ing.trim());
        const placeholders = ingredientList.map(() => '?').join(', ');

        conditions.push(`i.name IN (${placeholders})`);
        queryParams.push(...ingredientList);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (ingredients) {
        const ingredientCount = ingredients.split(',').length;
        query += `
            GROUP BY r.id
            HAVING COUNT(DISTINCT i.id) = ?  -- Počet ingrediencí se musí přesně shodovat
        `;
        queryParams.push(ingredientCount);
    }

    query += ' GROUP BY r.id'; // Přidání GROUP BY pro správné agregování ingrediencí

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error retrieving recipes:', err);
            return res.status(500).json({ error: 'Error retrieving recipes.' });
        }

        res.json(results); // Vrací recepty s ingrediencemi
    });
});





// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
