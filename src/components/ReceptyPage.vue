<template>
    <div class="d-flex justify-content-center align-items-start vh-100">
      <div class="card p-4 shadow-sm w-100">
        <h2 class="text-center mb-4">Vytvořit nový recept</h2>
        <form @submit.prevent="submitRecipe">
          <!-- Flex container for 4 sections -->
          <div class="d-flex justify-content-between">
            <!-- First div: Title and Description -->
            <div class="form-section">
              <div class="mb-3">
                <label for="title" class="form-label">Název receptu:</label>
                <input type="text" id="title" v-model="recipe.title" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Popis:</label>
                <textarea id="description" v-model="recipe.description" class="form-control" rows="4"></textarea>
              </div>
            </div>
  
            <!-- Second div: Instructions -->
            <div class="form-section">
              <div class="mb-3">
                <label class="form-label">Instrukce:</label>
                <div v-for="(instruction, index) in instructions" :key="index" class="input-group mb-2">
                  <span class="input-group-text">Krok {{ index + 1 }}</span>
                  <input
                    type="text"
                    v-model="instruction.text"
                    placeholder="Zadejte instrukci"
                    class="form-control"
                    required
                  />
                  <button @click="removeInstruction(index)" type="button" class="btn btn-danger">Odstranit</button>
                </div>
                <button @click="addInstruction" type="button" class="btn btn-secondary mt-2">Přidat krok</button>
              </div>
            </div>
  
            <!-- Third div: Ingredients -->
            <div class="form-section">
              <div class="mb-3">
                <label class="form-label">Ingredience:</label>
                <div v-for="(ingredient, index) in ingredients" :key="index" class="input-group mb-2">
                  <input
                    type="text"
                    v-model="ingredient.name"
                    placeholder="Název ingredience"
                    class="form-control"
                    required
                  />
                  <input
                    type="text"
                    v-model="ingredient.amount"
                    placeholder="Množství"
                    class="form-control"
                  />
                  <button @click="removeIngredient(index)" type="button" class="btn btn-danger">Odstranit</button>
                </div>
                <button @click="addIngredient" type="button" class="btn btn-secondary mt-2">Přidat ingredienci</button>
              </div>
            </div>
  
            <!-- Fourth div: Image -->
            <div class="form-section">
              <div class="mb-3">
                <label for="image" class="form-label">Obrázek:</label>
                <input type="text" id="image" v-model="recipe.image" class="form-control" placeholder="URL obrázku" />
                <div v-if="recipe.image" class="mt-2 text-center">
                  <img :src="recipe.image" alt="Recipe Image" class="img-fluid" style="max-height: 200px; object-fit: cover;" />
                </div>
              </div>
            </div>
          </div>
  
          <button type="submit" class="btn btn-primary w-100 mt-4">Vytvořit recept</button>
        </form>
        <button @click="goHome" class="btn btn-link w-100 mt-3">Domů</button>
        <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        recipe: {
          title: '',
          description: '',
          image: ''
        },
        instructions: [{ text: '' }],
        ingredients: [{ name: '', amount: '' }],
        errorMessage: ''
      };
    },
    methods: {
      addInstruction() {
        this.instructions.push({ text: '' });
      },
      removeInstruction(index) {
        this.instructions.splice(index, 1);
      },
      addIngredient() {
        this.ingredients.push({ name: '', amount: '' });
      },
      removeIngredient(index) {
        this.ingredients.splice(index, 1);
      },
      async submitRecipe() {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          if (!user) {
            this.errorMessage = "Musíte být přihlášeni, abyste mohli přidat recept.";
            return;
          }
  
          const recipeData = {
            userId: user.id,
            ...this.recipe,
            instructions: this.instructions.map((instruction, index) => ({
              step_number: index + 1,
              text: instruction.text
            })),
            ingredients: this.ingredients.map(ingredient => ({
              name: ingredient.name,
              amount: ingredient.amount
            }))
          };
  
          const response = await fetch('http://localhost:3000/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData)
          });
  
          if (!response.ok) {
            throw new Error(`Chyba ${response.status}: ${response.statusText}`);
          }
  
          const data = await response.json();
          console.log('Recept byl úspěšně vytvořen:', data);
  
          this.recipe = { title: '', description: '', image: '' };
          this.ingredients = [{ name: '', amount: '' }];
          this.instructions = [{ text: '' }];
          alert('Recept byl úspěšně vytvořen!');
  
          this.$router.push('/homepage');
        } catch (error) {
          console.error('Chyba při odesílání receptu:', error);
          this.errorMessage = error.message;
        }
      },
      goHome() {
        this.$router.push('/homepage');
      }
    }
  };
  </script>
  
  <style scoped>
  .card {
    max-width: 100%;
    text-align: left;
  }
  
  .form-group label {
    font-weight: bold;
  }
  
  .d-flex {
    flex-wrap: wrap;
  }
  
  .form-section {
    width: 24%; /* Each div takes 25% of the screen */
    margin-bottom: 1rem;
  }
  
  .form-section img {
    max-width: 100%;
    height: auto;
  }
  
  @media (max-width: 768px) {
    .form-section {
      width: 100%; /* Stacks sections vertically on smaller screens */
    }
  }
  </style>
  