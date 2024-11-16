<template>
  <div class="container mt-5">
    <h2 class="text-center">Vítejte na profilu!</h2>
    <p class="text-center">Zde najdete informace o svém účtu.</p>

    <div v-if="user" class="text-center">
      <h4>{{ user.name }}</h4>
      <p>Email: {{ user.email }}</p>

      <h5>Vaše recepty:</h5>
      <div v-for="recipe in recipes" :key="recipe.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title">{{ recipe.title }}</h6>
          <button @click="toggleRecipeDetails(recipe.id)" class="btn btn-info">
            {{ expandedRecipe === recipe.id ? 'Skrýt podrobnosti' : 'Zobrazit celý recept' }}
          </button>

          <div v-if="expandedRecipe === recipe.id" class="recipe-details mt-3">
            <h6 class="text-center">Popis:</h6> <!-- Zarovnáno na střed -->
            <p class="text-center">{{ recipeDetails.description }}</p> <!-- Zarovnáno na střed -->

            <div v-if="recipeDetails.image">
              <img :src="recipeDetails.image" alt="Obrázek receptu" class="img-fluid mb-3" />
            </div>

            <h6 class="text-start">Kroky:</h6> <!-- Zarovnáno vlevo -->
            <ol class="text-start">
              <li v-for="step in recipeDetails.instructions" :key="step.step_number">
                {{ step.instruction }}
              </li>
            </ol>

            <h6 class="text-start">Ingredience:</h6> <!-- Zarovnáno vlevo -->
            <ul class="text-start">
              <li v-for="ingredient in recipeDetails.ingredients" :key="ingredient.name">
                {{ ingredient.name }} - {{ ingredient.amount }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <p v-if="loading" class="text-center">Načítám profil...</p>
    <p v-if="errorMessage" class="text-danger text-center">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: null,
      recipes: [],
      recipeDetails: {},
      expandedRecipe: null,
      loading: true,
      errorMessage: ""
    };
  },
  methods: {
    async toggleRecipeDetails(recipeId) {
      if (this.expandedRecipe === recipeId) {
        this.expandedRecipe = null;
        this.recipeDetails = {};  // Resetuje detailní informace
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);
        if (!response.ok) {
          throw new Error("Nepodařilo se načíst detaily receptu.");
        }

        this.recipeDetails = await response.json();
        console.log('Podrobnosti receptu:', this.recipeDetails);  // Pro ověření
        this.expandedRecipe = recipeId;
      } catch (error) {
        console.error(error.message);
      }
    }
  },
  async mounted() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        this.errorMessage = "Uživatel není přihlášen.";
        this.loading = false;
        return;
      }

      const response = await fetch(`http://localhost:3000/datareceptprofile?userId=${user.id}`);
      if (!response.ok) {
        throw new Error("Chyba při načítání profilu.");
      }

      const data = await response.json();
      this.user = data.user;
      this.recipes = data.recipes;
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
  max-width: 800px;
}

.recipe-card {
  border-radius: 10px;
}

.recipe-details {
  margin-top: 15px;
}

.recipe-image {
  width: 100%;
  max-width: 300px;
  margin-bottom: 15px;
}

.text-start {
  text-align: left;  /* Zarovnání textu vlevo */
}

.text-center {
  text-align: center;  /* Zarovnání textu na střed */
}
</style>
