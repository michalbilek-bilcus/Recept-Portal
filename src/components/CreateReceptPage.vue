<template>
  <div class="d-flex justify-content-center align-items-center">
    <div class="card p-4 shadow-sm w-100">
      <h2 class="text-center mb-4">Vytvořit nový recept</h2>

      <!-- Zobrazení aktuálního kroku -->
      <div v-if="currentStep === 1">
        <!-- Div 1: Název receptu a popis -->
        <div class="mb-3">
          <label for="title" class="form-label">Název receptu:</label>
          <input type="text" id="title" v-model="recipe.title" class="form-control" required />
          <p v-if="errors.title" class="text-danger">Název receptu je povinný.</p>
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">Popis:</label>
          <textarea id="description" v-model="recipe.description" class="form-control" rows="4"></textarea>
        </div>
      </div>

      <div v-if="currentStep === 2">
        <!-- Div 2: Instrukce -->
        <div>
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
          <p v-if="errors.instructions" class="text-danger">Každý krok musí obsahovat text.</p>
          <button @click="addInstruction" type="button" class="btn btn-secondary mt-2">Přidat krok</button>
        </div>
      </div>

      <div v-if="currentStep === 3">
        <!-- Div 3: Ingredience -->
        <div>
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
          <p v-if="errors.ingredients" class="text-danger">Každá ingredience musí mít název a množství.</p>
          <button @click="addIngredient" type="button" class="btn btn-secondary mt-2">Přidat ingredienci</button>
        </div>
      </div>

      <div v-if="currentStep === 4">
        <!-- Div 4: Obrázek -->
        <div>
          <div class="mb-3">
            <label for="image" class="form-label">Obrázek:</label>
            <input type="text" id="image" v-model="recipe.image" class="form-control" placeholder="URL obrázku" />
            <div v-if="recipe.image" class="mt-2 text-center">
              <img :src="recipe.image" alt="Recipe Image" class="img-fluid" style="max-height: 200px; object-fit: cover;" />
            </div>
          </div>
        </div>
        <button @click="submitRecipe" class="btn btn-primary w-100 mt-4">Vytvořit recept</button>
      </div>

      <!-- Navigační tlačítka -->
      <div class="d-flex justify-content-between mt-4">
        <button @click="prevStep" class="btn btn-secondary" :disabled="currentStep === 1">Zpět</button>
        <button @click="nextStep" class="btn btn-primary" :disabled="currentStep === 4">Další</button>
      </div>

      <button @click="goHome" class="btn btn-link w-100 mt-3">Domů</button>
      <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 1, // Určuje aktuální krok
      recipe: {
        title: '',
        description: '',
        image: ''
      },
      instructions: [{ text: '' }],
      ingredients: [{ name: '', amount: '' }],
      errorMessage: '',
      errors: {
        title: false,
        instructions: false,
        ingredients: false
      }
    };
  },
  methods: {
    validateForm() {
      // Validace jednotlivých částí
      this.errors.title = !this.recipe.title.trim();
      this.errors.instructions = this.instructions.some(
        (instruction) => !instruction.text.trim()
      );
      this.errors.ingredients = this.ingredients.some(
        (ingredient) => !ingredient.name.trim()
      );

      // Pokud některá část není validní, vrátíme false
      return !this.errors.title && !this.errors.instructions && !this.errors.ingredients;
    },
    nextStep() {
      this.errorMessage = ''; // Vyčistíme chyby
      this.currentStep++;
    },
    prevStep() {
      this.errorMessage = ''; // Vyčistíme chyby
      this.currentStep--;
    },
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
      // Spustíme validaci formuláře
      if (!this.validateForm()) {
        this.errorMessage = 'Vyplňte prosím všechna povinná pole.';
        return;
      }

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

        // Reset formuláře
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
  position: relative;
  max-width: 50%;
  text-align: left;
  overflow: visible;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
