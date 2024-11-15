<template>
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card p-4 shadow-sm" style="width: 22rem;">
        <h2 class="text-center mb-4">Vytvořit nový recept</h2>
        <form @submit.prevent="submitRecipe">
          <div class="mb-3">
            <label for="title" class="form-label">Název receptu:</label>
            <input type="text" id="title" v-model="recipe.title" class="form-control" required />
          </div>
          <div class="mb-3">
            <label for="description" class="form-label">Popis:</label>
            <textarea id="description" v-model="recipe.description" class="form-control"></textarea>
          </div>
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
          <div class="mb-3">
            <label for="image" class="form-label">Obrázek:</label>
            <input type="text" id="image" v-model="recipe.image" class="form-control" placeholder="URL obrázku" />
          </div>
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
          // Get the logged-in user
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
  
          // Reset form
          this.recipe = { title: '', description: '', image: '' };
          this.ingredients = [{ name: '', amount: '' }];
          this.instructions = [{ text: '' }];
          alert('Recept byl úspěšně vytvořen!');
  
          // Redirect to homepage after successful recipe creation
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
    max-width: 600px;
    text-align: left;
  }
  .form-group label {
    font-weight: bold;
  }
  </style>
  