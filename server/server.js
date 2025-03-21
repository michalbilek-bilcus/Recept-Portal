require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:8080'
}));
app.use(express.json());

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME 
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
            const timerInSeconds = instruction.timer || 0;
            const hours = Math.floor(timerInSeconds / 3600);
            const minutes = Math.floor((timerInSeconds % 3600) / 60); 
            const seconds = timerInSeconds % 60;

            const instructionQuery = 'INSERT INTO recipe_instructions (recipe_id, step_number, instruction, timer_hours, timer_minutes, timer_seconds) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(instructionQuery, [recipeId, index + 1, instruction.text, hours, minutes, seconds], (err) => {
                if (err) {
                    console.error('Chyba při ukládání instrukce:', err);
                }
            });
        });
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

            connection.query('DELETE FROM recipe_mealtypes WHERE recipe_id = ?', [recipeId], (err) => {
                if (err) {
                    console.error('Chyba při mazání závislých dat (recipe_mealtypes):', err);
                    return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (recipe_mealtypes).' });
                }

                connection.query('DELETE FROM recipe_categories WHERE recipe_id = ?', [recipeId], (err) => {
                    if (err) {
                        console.error('Chyba při mazání závislých dat (recipe_categories):', err);
                        return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (recipe_categories).' });
                    }

                    connection.query('DELETE FROM ratings WHERE recipe_id = ?', [recipeId], (err) => {
                        if (err) {
                            console.error('Chyba při mazání závislých dat (ratings):', err);
                            return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (ratings).' });
                        }

                        connection.query('DELETE FROM comments WHERE recipe_id = ?', [recipeId], (err) => {
                            if (err) {
                                console.error('Chyba při mazání závislých dat (comments):', err);
                                return res.status(500).json({ error: 'Nastala chyba při mazání závislých dat (comments).' });
                            }
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
            });
        });
    });
});

// Endpoint pro získání uživatelského profilu a jeho receptů
app.get('/datareceptprofile', (req, res) => {
    const userId = req.query.userId;

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

// Endpoint pro ukládání oblíbených receptů
app.post('/favourites', (req, res) => {
    const { userId, recipeId, favourite } = req.body;

    if (userId === undefined || recipeId === undefined || favourite === undefined) {
        return res.status(400).json({ error: "userId, recipeId and favourite are required." });
    }

    const checkQuery = 'SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?';
    connection.query(checkQuery, [userId, recipeId], (err, result) => {
        if (err) {
            console.error('Error checking favourite:', err);
            return res.status(500).json({ error: "Error checking favourite." });
        }
        
        if (result.length > 0) {
            const updateQuery = 'UPDATE ratings SET favourite = ? WHERE user_id = ? AND recipe_id = ?';
            connection.query(updateQuery, [favourite, userId, recipeId], (err) => {
                if (err) {
                    console.error('Error updating favourite:', err);
                    return res.status(500).json({ error: "Error updating favourite." });
                }
        
                res.status(200).json({ message: "Favourite updated." });
            });
        } else {
            const insertQuery = 'INSERT INTO ratings (user_id, recipe_id, favourite, rating) VALUES (?, ?, ?, ?)';
            connection.query(insertQuery, [userId, recipeId, favourite, 0], (err) => {
                if (err) {
                    console.error('Error saving favourite:', err);
                    return res.status(500).json({ error: "Error saving favourite." });
                }
        
                res.status(201).json({ message: "Favourite saved." });
            });
        }
    });
});

// Endpoint pro ukládání hodnocení
app.post('/ratings', (req, res) => {
    const { userId, recipeId, rating } = req.body;

    if (userId === undefined || recipeId === undefined || rating === undefined) {
        return res.status(400).json({ error: "userId, recipeId and rating are required." });
    }

    const checkQuery = 'SELECT * FROM ratings WHERE user_id = ? AND recipe_id = ?';
    connection.query(checkQuery, [userId, recipeId], (err, result) => {
        if (err) {
            console.error('Error checking rating:', err);
            return res.status(500).json({ error: "Error checking rating." });
        }
        
        if (result.length > 0) {
            const updateQuery = 'UPDATE ratings SET rating = ? WHERE user_id = ? AND recipe_id = ?';
            connection.query(updateQuery, [rating, userId, recipeId], (err) => {
                if (err) {
                    console.error('Error updating rating:', err);
                    return res.status(500).json({ error: "Error updating rating." });
                }
        
                res.status(200).json({ message: "Rating updated." });
            });
        } else {
            const insertQuery = 'INSERT INTO ratings (user_id, recipe_id, favourite, rating) VALUES (?, ?, ?, ?)';
            connection.query(insertQuery, [userId, recipeId, 0, rating], (err) => {
                if (err) {
                    console.error('Error saving rating:', err);
                    return res.status(500).json({ error: "Error saving rating." });
                }
        
                res.status(201).json({ message: "Rating saved." });
            });
        }
    });
});

// Endpoint pro získání hodnoty favourite
app.get('/favourite', (req, res) => {
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

// Endpoint pro získání hodnoty rating
app.get('/rating', (req, res) => {
    const { userId, recipeId } = req.query;

    if (!userId || !recipeId) {
        return res.status(400).json({ error: "userId and recipeId are required." });
    }

    const query = 'SELECT rating FROM ratings WHERE user_id = ? AND recipe_id = ?';
    connection.query(query, [userId, recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching rating:', err);
            return res.status(500).json({ error: "Error fetching rating." });
        }

        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ rating: null });
        }
    });
});

// Endpoint pro přidání nového komentáře
app.post('/comments', (req, res) => {
    const { userId, recipeId, comment } = req.body;

    if (!userId || !recipeId || !comment) {
        return res.status(400).json({ error: "userId, recipeId and comment are required." });
    }

    const query = 'INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())';
    connection.query(query, [userId, recipeId, comment], (err, result) => {
        if (err) {
            console.error('Error saving comment:', err);
            return res.status(500).json({ error: "Error saving comment." });
        }

        res.status(201).json({ message: "Comment saved.", id: result.insertId });
    });
});

app.get('/comments', (req, res) => {
    const { recipeId } = req.query;

    if (!recipeId) {
        return res.status(400).json({ error: "recipeId is required." });
    }

    const query = 'SELECT c.id, c.comment, c.created_at, u.name AS user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.recipe_id = ? ORDER BY c.created_at ASC';
    connection.query(query, [recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ error: "Error fetching comments." });
        }

        res.status(200).json(results);
    });
});

// Endpoint pro přidání nového komentáře
app.post('/comments', (req, res) => {
    const { userId, recipeId, comment } = req.body;

    if (!userId || !recipeId || !comment) {
        return res.status(400).json({ error: "userId, recipeId and comment are required." });
    }

    const query = 'INSERT INTO comments (user_id, recipe_id, comment) VALUES (?, ?, ?)';
    connection.query(query, [userId, recipeId, comment], (err, result) => {
        if (err) {
            console.error('Error saving comment:', err);
            return res.status(500).json({ error: "Error saving comment." });
        }

        res.status(201).json({ message: "Comment saved." });
    });
});


app.get('/random-recipes', (req, res) => {
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

        res.json(formattedResults); 
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
  
    
    if (ingredients && ingredients.trim() !== '') {
      const ingredientsArray = ingredients.split(',').map(ing => ing.trim());
      sqlQuery += ` HAVING COUNT(DISTINCT i.name) = ?`;
      queryParams.push(ingredientsArray.length);
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
      res.json(results);
    });
  });

  app.get('/mealtypes', (req, res) => {
    connection.query('SELECT name FROM mealtypes', (err, results) => {
      if (err) {
        console.error('Error fetching mealtypes:', err);
        return res.status(500).json({ error: 'Error fetching mealtypes.' });
      }
      res.json(results);
    });
  });

  app.get('/categories', (req, res) => {
    connection.query('SELECT name FROM categories', (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ error: 'Error fetching categories.' });
      }
      res.json(results);
    });
  });

// Endpoint pro získání průměrného hodnocení receptu
app.get('/recipe/:id/average-rating', (req, res) => {
    const recipeId = req.params.id;

    const query = 'SELECT AVG(rating) as averageRating FROM ratings WHERE recipe_id = ?';
    connection.query(query, [recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching average rating:', err);
            return res.status(500).json({ error: "Error fetching average rating." });
        }

        const averageRating = results[0].averageRating ? Math.round(results[0].averageRating) : 0;
        res.status(200).json({ averageRating });
    });
});

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});