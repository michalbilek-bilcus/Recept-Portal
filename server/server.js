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

    // 1. dotaz na recepty podle filtrů
    let sqlQuery = `
      SELECT r.id, r.title, r.description, r.image
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    `;
    
    const conditions = [];
    const queryParams = [];

    // Filtr podle ingrediencí, pokud je zadaný
    if (ingredients && ingredients.trim() !== '') {
      conditions.push("i.name IN (?)");
      queryParams.push(ingredients.split(',').map(ing => ing.trim())); // Seznam ingrediencí
    }

    // Filtr podle názvu receptu, pokud je zadaný
    if (title && title.trim() !== '') {
      conditions.push("r.title LIKE ?");
      queryParams.push(`%${title}%`);
    }

    // Přidání podmínek pro filtraci, pokud existují
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    // Přidání GROUP BY pro zajištění, že každý recept bude vypsán jen jednou
    sqlQuery += " GROUP BY r.id";

    // Spuštění dotazu pro vyhledání receptů
    connection.query(sqlQuery, queryParams, (err, results) => {
      if (err) {
        console.error('Chyba při dotazu na databázi:', err);
        return res.status(500).send('Chyba serveru');
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Žádný recept s těmito kritérii nebyl nalezen." });
      }

      // 2. dotaz pro ingredience pro všechny recepty
      const recipeIds = results.map(recipe => recipe.id);
      const ingredientsQuery = `
        SELECT ri.recipe_id, i.name
        FROM ingredients i
        JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
        WHERE ri.recipe_id IN (?)
      `;

      connection.query(ingredientsQuery, [recipeIds], (err, ingredientsResults) => {
        if (err) {
          console.error('Chyba při dotazu na ingredience:', err);
          return res.status(500).send('Chyba serveru');
        }

        // Sestavení receptů s ingrediencemi, každý recept se objeví pouze jednou
        const recipesWithIngredients = results.map(recipe => {
          // Filtrace ingrediencí pro konkrétní recept a spojení do jednoho řetězce
          const recipeIngredients = ingredientsResults
            .filter(ingredient => ingredient.recipe_id === recipe.id)
            .map(ingredient => ingredient.name)
            .join(', ');

          return {
            ...recipe,
            ingredients: recipeIngredients
          };
        });

        res.json(recipesWithIngredients); // Vrátí recepty s ingrediencemi
      });
    });
});


app.get('/ingredients', (req, res) => {
    connection.query('SELECT name FROM ingredients', (err, results) => {
      if (err) {
        console.error('Error fetching ingredients:', err);
        return res.status(500).json({ error: 'Error fetching ingredients.' });
      }
      res.json(results); // Vrátí seznam ingrediencí
    });
  });

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});