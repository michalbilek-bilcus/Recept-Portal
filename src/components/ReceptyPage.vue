<template>
  <div class="container mt-5">
    <h2>Vítejte na receptech!</h2>
    <p>Zde najdete recepty.</p>

    <div v-if="loading">Načítám recepty...</div>
    <div v-if="errorMessage" class="text-danger">{{ errorMessage }}</div>

    <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card card mb-4">
      <div class="card-body">
        <h5 class="card-title">{{ recipe.title }}</h5>
        <button @click="toggleRecipeDetails(recipe.id)" class="btn btn-primary">
          {{ expandedRecipe === recipe.id ? 'Skrýt podrobnosti' : 'Zobrazit celý recept' }}
        </button>

        <div v-if="expandedRecipe === recipe.id" class="recipe-details mt-3">
          <h6>Popis:</h6>
          <p>{{ recipe.description }}</p>
          <img v-if="recipe.image" :src="recipe.image" alt="Obrázek receptu" class="recipe-image img-fluid" />
          
          <h6 class="mt-3">Kroky:</h6>
          <ol>
            <li v-for="step in recipe.instructions" :key="step.step_number">
              {{ step.instruction }}
            </li>
          </ol>

          <h6 class="mt-3">Ingredience:</h6>
          <ul>
            <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
              {{ ingredient.name }} - {{ ingredient.amount }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recipes: [],
      expandedRecipe: null,
      loading: true,
      errorMessage: ''
    };
  },
  methods: {
    async toggleRecipeDetails(recipeId) {
      // Pokud je recept již rozkliknutý, skrytí jeho podrobností
      if (this.expandedRecipe === recipeId) {
        this.expandedRecipe = null;
        return;
      }

      // Načítání detailů receptu z API
      try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst detaily receptu.');
        }
        const recipeDetails = await response.json();

        // Přidání detailů k receptu
        const recipe = this.recipes.find(r => r.id === recipeId);
        recipe.description = recipeDetails.description;
        recipe.instructions = recipeDetails.instructions;
        recipe.ingredients = recipeDetails.ingredients;

        this.expandedRecipe = recipeId;  // Zobrazení podrobností
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  },
  async mounted() {
    try {
      const response = await fetch('http://localhost:3000/random-recipes');
      if (!response.ok) {
        throw new Error('Chyba při načítání receptů.');
      }
      this.recipes = await response.json();
      this.loading = false;
    } catch (error) {
      this.errorMessage = error.message;
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.container {
  text-align: center;
}

.recipe-card {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
}

.recipe-details {
  text-align: left;
  margin-top: 15px;
}

.recipe-image {
  width: 100%;
  max-width: 300px;
  margin-bottom: 15px;
}

h6 {
  margin-top: 10px;
}

.card-title {
  font-weight: bold;
}

button {
  margin-top: 10px;
}
</style>
