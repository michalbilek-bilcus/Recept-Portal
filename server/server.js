const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // Import bcrypt
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
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Chyba při šifrování hesla:', err);
            return res.status(500).json({ error: "Nastala chyba při registraci." });
        }
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        connection.query(query, [name, email, hashedPassword], (err, results) => {
            if (err) {
                console.error('Chyba při vkládání uživatele:', err);
                return res.status(500).json({ error: "Nastala chyba při registraci." });
            }
            res.status(201).json({ message: "Registrace úspěšná", userId: results.insertId });
        });
    });
});

// Endpoint pro přihlášení
app.post('/prihlaseni', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email a heslo jsou povinné." });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Chyba při přihlašování uživatele:', err);
            return res.status(500).json({ error: "Nastala chyba při přihlašování." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Neplatné přihlašovací údaje." });
        }

        const user = results[0];

        // Porovnání hesla s šifrovaným heslem v databázi
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Chyba při ověřování hesla:', err);
                return res.status(500).json({ error: "Nastala chyba při ověřování hesla." });
            }

            if (!isMatch) {
                return res.status(401).json({ error: "Neplatné přihlašovací údaje." });
            }

            res.status(200).json({ message: "Přihlášení úspěšné", user: user });
        });
    });
});

// Endpoint pro přidání receptu
app.post('/recipes', (req, res) => {
    const { userId, title, description, image, instructions, ingredients, mealtypes, categories } = req.body;

    // Validace povinných polí
    if (!title || !userId || instructions.length === 0 || ingredients.length === 0) {
        return res.status(400).json({ error: "Název, instrukce a ingredience jsou povinné." });
    }

    // Uložení receptu
    const query = 'INSERT INTO recipes (user_id, title, description, image) VALUES (?, ?, ?, ?)';
    connection.query(query, [userId, title, description, image], (err, result) => {
        if (err) {
            console.error('Chyba při ukládání receptu:', err);
            return res.status(500).json({ error: "Nastala chyba při ukládání receptu." });
        }

        const recipeId = result.insertId;

        // Uložení instrukcí
        instructions.forEach((instruction, index) => {
            const timerInSeconds = instruction.timer || 0; // Pokud není nastaven časovač, uložíme 0
            const hours = Math.floor(timerInSeconds / 3600); // Vypočítat hodiny
            const minutes = Math.floor((timerInSeconds % 3600) / 60); // Vypočítat minuty
            const seconds = timerInSeconds % 60; // Vypočítat sekundy

            const instructionQuery = 'INSERT INTO recipe_instructions (recipe_id, step_number, instruction, timer_hours, timer_minutes, timer_seconds) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(instructionQuery, [recipeId, index + 1, instruction.text, hours, minutes, seconds], (err) => {
                if (err) {
                    console.error('Chyba při ukládání instrukce:', err);
                }
            });
        });

        // Uložení ingrediencí a vztahů mezi receptem a ingrediencemi
        ingredients.forEach((ingredient) => {
            const ingredientQuery = 'SELECT id FROM ingredients WHERE name = ?';
            connection.query(ingredientQuery, [ingredient.name], (err, result) => {
                if (err) {
                    console.error('Chyba při hledání ingredience:', err);
                    return res.status(500).json({ error: "Nastala chyba při hledání ingredience." });
                }

                let ingredientId;
                if (result.length > 0) {
                    ingredientId = result[0].id;
                } else {
                    const insertIngredientQuery = 'INSERT INTO ingredients (name) VALUES (?)';
                    connection.query(insertIngredientQuery, [ingredient.name], (err, result) => {
                        if (err) {
                            console.error('Chyba při ukládání ingredience:', err);
                            return res.status(500).json({ error: "Nastala chyba při ukládání ingrediencí." });
                        }
                        ingredientId = result.insertId;
                    });
                }

                const recipeIngredientQuery = 'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)';
                connection.query(recipeIngredientQuery, [recipeId, ingredientId, ingredient.amount], (err) => {
                    if (err) {
                        console.error('Chyba při ukládání vztahu mezi receptem a ingrediencí:', err);
                        return res.status(500).json({ error: "Nastala chyba při ukládání vztahu mezi receptem a ingrediencí." });
                    }
                });
            });
        });

        // Uložení mealtypes (typy jídel)
        mealtypes.forEach((mealtypeName) => {
            const mealtypeQuery = 'SELECT id FROM mealtypes WHERE name = ?';
            connection.query(mealtypeQuery, [mealtypeName], (err, result) => {
                if (err) {
                    console.error('Chyba při hledání typu jídla:', err);
                    return res.status(500).json({ error: "Nastala chyba při hledání typu jídla." });
                }

                let mealtypeId;
                if (result.length > 0) {
                    mealtypeId = result[0].id;
                } else {
                    console.log(`Typ jídla "${mealtypeName}" neexistuje, přeskočeno.`);
                    return;
                }

                const recipeMealtypeQuery = 'INSERT INTO recipe_mealtypes (recipe_id, mealtype_id) VALUES (?, ?)';
                connection.query(recipeMealtypeQuery, [recipeId, mealtypeId], (err) => {
                    if (err) {
                        console.error('Chyba při ukládání vztahu mezi receptem a typem jídla:', err);
                        return res.status(500).json({ error: "Nastala chyba při ukládání vztahu mezi receptem a typem jídla." });
                    }
                });
            });
        });

        // Uložení categories (kategorie)
        categories.forEach((categoryName) => {
            const categoryQuery = 'SELECT id FROM categories WHERE name = ?';
            connection.query(categoryQuery, [categoryName], (err, result) => {
                if (err) {
                    console.error('Chyba při hledání kategorie:', err);
                    return res.status(500).json({ error: "Nastala chyba při hledání kategorie." });
                }

                let categoryId;
                if (result.length > 0) {
                    categoryId = result[0].id;
                } else {
                    console.log(`Kategorie "${categoryName}" neexistuje, přeskočeno.`);
                    return;
                }

                const recipeCategoryQuery = 'INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)';
                connection.query(recipeCategoryQuery, [recipeId, categoryId], (err) => {
                    if (err) {
                        console.error('Chyba při ukládání vztahu mezi receptem a kategorií:', err);
                        return res.status(500).json({ error: "Nastala chyba při ukládání vztahu mezi receptem a kategorií." });
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

            // Dotaz pro načtení kroků receptu včetně času
            const instructionsQuery = `
                SELECT ri.step_number, ri.instruction, ri.timer_hours, ri.timer_minutes, ri.timer_seconds
                FROM recipe_instructions ri
                WHERE ri.recipe_id = ?
            `;

            connection.query(instructionsQuery, [recipeId], (err, instructionResults) => {
                if (err) {
                    console.error('Chyba při načítání instrukcí:', err);
                    return res.status(500).json({ error: "Chyba při načítání instrukcí." });
                }

                // Dotaz pro načtení mealtypes
                const mealtypesQuery = `
                    SELECT mt.name
                    FROM recipe_mealtypes rmt
                    JOIN mealtypes mt ON rmt.mealtype_id = mt.id
                    WHERE rmt.recipe_id = ?
                `;

                connection.query(mealtypesQuery, [recipeId], (err, mealtypeResults) => {
                    if (err) {
                        console.error('Chyba při načítání mealtypes:', err);
                        return res.status(500).json({ error: "Chyba při načítání mealtypes." });
                    }

                    // Dotaz pro načtení kategorií
                    const categoriesQuery = `
                        SELECT c.name
                        FROM recipe_categories rc
                        JOIN categories c ON rc.category_id = c.id
                        WHERE rc.recipe_id = ?
                    `;

                    connection.query(categoriesQuery, [recipeId], (err, categoryResults) => {
                        if (err) {
                            console.error('Chyba při načítání kategorií:', err);
                            return res.status(500).json({ error: "Chyba při načítání kategorií." });
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
                                instruction: instruction.instruction,
                                timer_hours: instruction.timer_hours,
                                timer_minutes: instruction.timer_minutes,
                                timer_seconds: instruction.timer_seconds
                            })),
                            mealtypes: mealtypeResults.map(mealtype => mealtype.name),
                            categories: categoryResults.map(category => category.name)
                        };

                        res.status(200).json(response);
                    });
                });
            });
        });
    });
});

app.post('/ratings', (req, res) => {
    const { userId, recipeId, favourite } = req.body;

    // Validate required fields
    if (userId === undefined || recipeId === undefined || favourite === undefined) {
        return res.status(400).json({ error: "userId, recipeId and favourite are required." });
    }

    // Check if the rating already exists for the user and recipe
    const checkQuery = 'SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?';
    connection.query(checkQuery, [userId, recipeId], (err, result) => {
        if (err) {
            console.error('Error checking rating:', err);
            return res.status(500).json({ error: "Error checking rating." });
        }
        
        if (result.length > 0) {
            // If rating exists, update the favourite
            const updateQuery = 'UPDATE ratings SET favourite = ? WHERE user_id = ? AND recipe_id = ?';
            connection.query(updateQuery, [favourite, userId, recipeId], (err) => {
                if (err) {
                    console.error('Error updating rating:', err);
                    return res.status(500).json({ error: "Error updating rating." });
                }
        
                res.status(200).json({ message: "Rating updated." });
            });
        } else {
            // If rating does not exist, insert new rating with default rating (e.g., 3)
            const insertQuery = 'INSERT INTO ratings (user_id, recipe_id, favourite, rating) VALUES (?, ?, ?, ?)';
            connection.query(insertQuery, [userId, recipeId, favourite, 3], (err) => {
                if (err) {
                    console.error('Error saving rating:', err);
                    return res.status(500).json({ error: "Error saving rating." });
                }
        
                res.status(201).json({ message: "Rating saved." });
            });
        }
    });
});

app.get('/ratings', (req, res) => {
    const { userId, recipeId } = req.query;

    if (!userId || !recipeId) {
        return res.status(400).json({ error: "userId and recipeId are required." });
    }

    const query = 'SELECT favourite FROM ratings WHERE user_id = ? AND recipe_id = ?';
    connection.query(query, [userId, recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching favourite:', err);
            return res.status(500).json({ error: "Error fetching favourite." });
        }

        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ favourite: 0 });
        }
    });
});

app.get('/random-recipes', (req, res) => {
    // Dotaz na všechny recepty včetně mealtypes a kategorií
    const query = `
        SELECT 
            r.id, 
            r.title, 
            r.description, 
            r.image, 
            r.created_at,
            GROUP_CONCAT(DISTINCT i.name) AS ingredients,
            GROUP_CONCAT(DISTINCT mt.name) AS mealtypes,
            GROUP_CONCAT(DISTINCT c.name) AS categories
        FROM recipes r
        LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
        LEFT JOIN recipe_mealtypes rmt ON r.id = rmt.recipe_id
        LEFT JOIN mealtypes mt ON rmt.mealtype_id = mt.id
        LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
        LEFT JOIN categories c ON rc.category_id = c.id
        GROUP BY r.id
        ORDER BY RAND()
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Chyba při načítání receptů: ', err);
            return res.status(500).json({ error: 'Chyba při načítání receptů.' });
        }

        // Zpracování výsledků a transformace do požadovaného formátu
        const formattedResults = results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            image: recipe.image,
            created_at: recipe.created_at,
            ingredients: recipe.ingredients ? recipe.ingredients.split(',') : [],
            mealtypes: recipe.mealtypes ? recipe.mealtypes.split(',') : [],
            categories: recipe.categories ? recipe.categories.split(',') : []
        }));

        res.json(formattedResults); // Vrátí všechny recepty v náhodném pořadí
    });
});

  // Backend: API pro filtrování receptů
  app.get('/filter-recipes', (req, res) => {
    const { ingredients, title, mealType, category } = req.query;
  
    let sqlQuery = `
      SELECT r.id, r.title, r.description, r.image, 
             GROUP_CONCAT(DISTINCT mt.name) AS mealtypes, 
             GROUP_CONCAT(DISTINCT c.name) AS categories,
             GROUP_CONCAT(DISTINCT i.name) AS ingredients
                FROM recipes r
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
                LEFT JOIN ingredients i ON ri.ingredient_id = i.id
                LEFT JOIN recipe_mealtypes rmt ON r.id = rmt.recipe_id
                LEFT JOIN mealtypes mt ON rmt.mealtype_id = mt.id
                LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
                LEFT JOIN categories c ON rc.category_id = c.id
    `;
  
    const conditions = [];
    const queryParams = [];
  
    // Filtr podle ingrediencí
    if (ingredients && ingredients.trim() !== '') {
      const ingredientsArray = ingredients.split(',').map(ing => ing.trim());
      conditions.push("i.name IN (?)");
      queryParams.push(ingredientsArray);
    }
  
    // Filtr podle názvu
    if (title && title.trim() !== '') {
      conditions.push("r.title LIKE ?");
      queryParams.push(`%${title}%`);
    }
  
    // Filtr podle typu jídla
    if (mealType && mealType.trim() !== '') {
      conditions.push("mt.name = ?");
      queryParams.push(mealType);
    }
  
    // Filtr podle kategorie
    if (category && category.trim() !== '') {
      conditions.push("c.name = ?");
      queryParams.push(category);
    }
  
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }
  
    sqlQuery += " GROUP BY r.id";
  
    // Přidáme podmínku, že recept musí mít všechny vybrané ingredience
    if (ingredients && ingredients.trim() !== '') {
      const ingredientsArray = ingredients.split(',').map(ing => ing.trim());
      sqlQuery += ` HAVING COUNT(DISTINCT i.name) = ?`;
      queryParams.push(ingredientsArray.length); // Zajistíme, že bude mít všechny ingredience
    }
  
    connection.query(sqlQuery, queryParams, (err, results) => {
      if (err) {
        console.error('Chyba při dotazu na databázi:', err);
        return res.status(500).send('Chyba serveru');
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: "Žádný recept s těmito kritérii nebyl nalezen." });
      }
  
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
  
        const recipesWithIngredients = results.map(recipe => {
          const recipeIngredients = ingredientsResults
            .filter(ingredient => ingredient.recipe_id === recipe.id)
            .map(ingredient => ingredient.name)
            .join(', ');
  
          return {
            ...recipe,
            ingredients: recipeIngredients
          };
        });
  
        res.json(recipesWithIngredients);
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

  app.get('/mealtypes', (req, res) => {
    connection.query('SELECT name FROM mealtypes', (err, results) => {
      if (err) {
        console.error('Error fetching mealtypes:', err);
        return res.status(500).json({ error: 'Error fetching mealtypes.' });
      }
      res.json(results); // Vrátí seznam mealtypes
    });
  });

  app.get('/categories', (req, res) => {
    connection.query('SELECT name FROM categories', (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ error: 'Error fetching categories.' });
      }
      res.json(results); // Vrátí seznam kategorii
    });
  });

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});