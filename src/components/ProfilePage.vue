<template>
  <div class="container mt-5">
    <div class="card shadow-lg">
      <div class="card-body text-center">
        <h2 class="card-title">Vítejte na profilu!</h2>
      </div>
    </div>

    <div v-if="user" class="mt-4">
      <div class="card shadow-sm mb-4">
        <div class="card-body text-center">
          <h4 class="card-title">{{ user.name }}</h4>
          <p class="card-text">Email: {{ user.email }}</p>
        </div>
      </div>

      <h5 class="text-center mb-4" style="color: white;">Moje recepty:</h5>

      <div v-for="recipe in recipes" :key="recipe.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="card-title mb-0">{{ recipe.title }} <span class="badge bg-primary">{{ getRatingText(recipe.averageRating) }}</span></h6>
            <div>
              <button
                @click="toggleRecipeDetails(recipe.id)"
                class="btn btn-info btn-sm me-2"
              >
                {{ expandedRecipe === recipe.id ? 'Skrýt podrobnosti' : 'Zobrazit celý recept' }}
              </button>
              <button
                @click="deleteRecipe(recipe.id)"
                class="btn btn-danger btn-sm"
              >
                Odstranit recept
              </button>
            </div>
          </div>

          <div v-if="expandedRecipe === recipe.id" class="recipe-details mt-3">
            <h6 class="text-center">Popis:</h6>
            <p class="text-center">{{ recipeDetails.description }}</p>

            <div v-if="recipeDetails.image" class="text-center">
              <img
                :src="recipeDetails.image"
                alt="Obrázek receptu"
                class="img-fluid rounded shadow-sm mb-3"
              />
            </div>

            <h6>Kroky:</h6>
            <ol class="list-group list-group-numbered">
              <li
                v-for="step in recipeDetails.instructions"
                :key="step.step_number"
                class="list-group-item"
              >
                {{ step.instruction }}
              </li>
            </ol>

            <h6 class="mt-3">Ingredience:</h6>
            <ul class="list-group">
              <li
                v-for="ingredient in recipeDetails.ingredients"
                :key="ingredient.name"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ ingredient.name }}</span>
                <span class="badge bg-primary rounded-pill">{{ ingredient.amount }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="d-flex justify-content-center align-items-center mt-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Načítám...</span>
      </div>
    </div>

    <p v-if="errorMessage" class="text-danger text-center mt-3">{{ errorMessage }}</p>
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
      errorMessage: "",
      ratingOptions: ['Žádný', 'Skvělý', 'Dobrý', 'Dá se', 'Špatný', 'Odpad']
    };
  },
  methods: {
    async toggleRecipeDetails(recipeId) {
      if (this.expandedRecipe === recipeId) {
        this.expandedRecipe = null;
        this.recipeDetails = {};
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);
        if (!response.ok) {
          throw new Error("Nepodařilo se načíst detaily receptu.");
        }

        this.recipeDetails = await response.json();
        console.log("Podrobnosti receptu:", this.recipeDetails);
        this.expandedRecipe = recipeId;
      } catch (error) {
        console.error(error.message);
      }
    },
    async deleteRecipe(recipeId) {
      if (!confirm("Opravdu chcete odstranit tento recept?")) {
        return;
      }
      try {
        const response = await fetch(`http://localhost:3000/deleterecipe/${recipeId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Nepodařilo se smazat recept.");
        }
        this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
        alert("Recept byl úspěšně odstraněn.");
      } catch (error) {
        console.error(error.message);
        alert("Nastala chyba při mazání receptu.");
      }
    },
    async fetchAverageRating(recipeId) {
      try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}/average-rating`);
        if (!response.ok) {
          throw new Error("Nepodařilo se načíst průměrné hodnocení.");
        }
        const data = await response.json();
        return data.averageRating;
      } catch (error) {
        console.error(error.message);
        return 0;
      }
    },
    getRatingText(rating) {
      return this.ratingOptions[rating] || 'Žádný';
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
      this.recipes = await Promise.all(data.recipes.map(async recipe => {
        const averageRating = await this.fetchAverageRating(recipe.id);
        return { ...recipe, averageRating };
      }));
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
.recipe-details {
  margin-top: 15px;
}
</style>