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
          <button @click="toggleRecipeDetails(recipe.id)" class="btn btn-info me-2">
            {{ expandedRecipe === recipe.id ? 'Skrýt podrobnosti' : 'Zobrazit celý recept' }}
          </button>
          <button @click="deleteRecipe(recipe.id)" class="btn btn-danger">
            Odstranit recept
          </button>

          <div v-if="expandedRecipe === recipe.id" class="recipe-details mt-3">
            <h6 class="text-center">Popis:</h6>
            <p class="text-center">{{ recipeDetails.description }}</p>

            <div v-if="recipeDetails.image">
              <img :src="recipeDetails.image" alt="Obrázek receptu" class="img-fluid mb-3" />
            </div>

            <h6 class="text-start">Kroky:</h6>
            <ol class="text-start">
              <li v-for="step in recipeDetails.instructions" :key="step.step_number">
                {{ step.instruction }}
              </li>
            </ol>

            <h6 class="text-start">Ingredience:</h6>
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
        this.recipeDetails = {}; // Resetuje detailní informace
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);
        if (!response.ok) {
          throw new Error("Nepodařilo se načíst detaily receptu.");
        }

        this.recipeDetails = await response.json();
        console.log('Podrobnosti receptu:', this.recipeDetails); // Pro ověření
        this.expandedRecipe = recipeId;
      } catch (error) {
        console.error(error.message);
      }
    },
    async deleteRecipe(recipeId) {
      if (!confirm("Opravdu chcete odstranit tento recept?")) {
        return; // Zrušení akce
      }
      try {
        const response = await fetch(`http://localhost:3000/deleterecipe/${recipeId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Nepodařilo se smazat recept.");
        }
        this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId); // Aktualizace seznamu receptů
        alert("Recept byl úspěšně odstraněn.");
      } catch (error) {
        console.error(error.message);
        alert("Nastala chyba při mazání receptu.");
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
  text-align: left;
}

.text-center {
  text-align: center;
}
</style>
