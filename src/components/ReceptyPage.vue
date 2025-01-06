<template>
  <div class="container mt-5">
    <!-- Vyhledávací pole -->
    <div class="search-bar mb-4">
      <div class="row g-3 align-items-center">
        <div class="col-auto position-relative">
          <!-- Dropdown pro ingredience -->
          <button 
            class="btn btn-info" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#ingredientList" 
            aria-expanded="false" 
            aria-controls="ingredientList"
          >
            Vybrat ingredience
          </button>

          <div 
            class="collapse position-absolute bg-white border rounded shadow" 
            id="ingredientList" 
            style="width: 500px; max-height: calc(1.5em * 10 + 1rem); z-index: 1050; top: 100%; left: 0; overflow-y: auto; padding: 0.5rem;"
          >
            <div 
              class="grid-container"
              style="
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                grid-auto-rows: 1.5em; 
                gap: 0.5rem;
              "
            >
              <div 
                v-for="ingredient in allIngredients" 
                :key="ingredient" 
                class="form-check d-flex align-items-center"
              >
                <input
                  type="checkbox"
                  :value="ingredient"
                  v-model="searchIngredients"
                  class="form-check-input me-1"
                  id="ingredient-{{ingredient}}"
                />
                <label class="form-check-label" :for="`ingredient-${ingredient}`">{{ ingredient }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="col">
          <select v-model="searchMealType" class="form-select">
            <option value="">Vyberte typ jídla</option>
            <option v-for="mealType in allMealTypes" :key="mealType" :value="mealType">
              {{ mealType }}
            </option>
          </select>
        </div>

        <div class="col">
          <select v-model="searchCategory" class="form-select">
            <option value="">Vyberte kategorii</option>
            <option v-for="category in allCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="col">
          <input
            type="text"
            v-model="searchTitle"
            class="form-control"
            placeholder="Zadejte název receptu"
          />
        </div>

        <div class="col-auto">
          <button @click="filterRecipes" class="btn btn-primary">Hledat recepty</button>
          <button @click="loadRandomRecipes" class="btn btn-secondary">Zobrazit všechny recepty</button>
          <button @click="filterHomeRecipes" class="btn btn-success">Recept z domova</button>
        </div>
      </div>
    </div>

    <!-- Zpráva o chybě -->
    <div v-if="errorMessage" class="alert alert-danger text-center">{{ errorMessage }}</div>

    <!-- Recepty -->
    <div v-if="filteredRecipes.length === 0 && !loading && !errorMessage" class="text-center">
      <p>Žádné recepty nevyhovují vašemu hledání.</p>
    </div>

    <div class="row">
      <div
        v-for="(recipe, index) in filteredRecipes"
        :key="`${recipe.id}-${index}`"
        class="col-md-4 mb-4"
      >
        <div
          class="card h-100 recipe-card"
          @click="navigateToRecipe(recipe.id)"
        >
          <div
            class="recipe-image card-img-top"
            :style="{ backgroundImage: `url(${recipe.image})` }"
          >
            <div class="recipe-title text-white bg-dark bg-opacity-50 p-2 text-center">{{ recipe.title }}</div>
          </div>
          <div class="card-body d-flex flex-column justify-content-between">
            <ul class="list-unstyled recipe-ingredients mb-2">
              <li
                v-for="(ingredient, index) in (Array.isArray(recipe.ingredients) ? recipe.ingredients : recipe.ingredients ? recipe.ingredients.split(',') : [])"
                :key="`${ingredient.trim()}-${index}`"
              >
                {{ ingredient.trim() }}
              </li>
            </ul>

            <div class="recipe-details">
              <p v-if="recipe.mealtypes" class="meal-types">
                <strong>Typ jídla:</strong> {{ Array.isArray(recipe.mealtypes) ? recipe.mealtypes.join(', ') : recipe.mealtypes }}
              </p>
              <p v-if="recipe.categories" class="categories">
                <strong>Kategorie:</strong> {{ Array.isArray(recipe.categories) ? recipe.categories.join(', ') : recipe.categories }}
              </p>
            </div>
          </div>
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
      filteredRecipes: [],
      searchIngredients: [],
      searchMealType: '',
      searchCategory: '',
      searchTitle: '',
      availableIngredients: ["mouka"], // Zde nahraďte skutečnými ingrediencemi
      loading: false,
      errorMessage: '',
      allIngredients: [],
      allMealTypes: [],
      allCategories: []
    };
  },
  methods: {
    navigateToRecipe(recipeId) {
      this.$router.push({ name: "receptdetails", params: { id: recipeId } });
    },
    async filterHomeRecipes() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(`http://localhost:3000/filter-recipes?ingredients=${this.availableIngredients.join(',')}`);
        if (!response.ok) {
          throw new Error('Nebyl nalezen žádný recept s dostupnými ingrediencemi.');
        }
        const data = await response.json();
        this.filteredRecipes = data;
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
    async filterRecipes() {
      const ingredients = this.searchIngredients.map((ing) => ing.trim()).filter(Boolean);
      const title = this.searchTitle.trim().toLowerCase();
      const mealType = this.searchMealType;
      const category = this.searchCategory;

      this.loading = true;
      this.errorMessage = '';

      if (ingredients.length === 0 && title === '' && !mealType && !category) {
        this.errorMessage = 'Zadejte alespoň jednu ingredienci, název receptu, typ jídla nebo kategorii.';
        this.loading = false;
        return;
      }

      try {
        const params = new URLSearchParams({
          ingredients: ingredients.join(','),
          title: this.searchTitle.trim().toLowerCase() || '',
          mealType: this.searchMealType || '',
          category: this.searchCategory || '',
        });

        const response = await fetch(`http://localhost:3000/filter-recipes?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Nebyl nalezen žádný recept odpovídající zadaným kritériím.');
        }

        const data = await response.json();
        this.filteredRecipes = data;
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
    async loadRandomRecipes() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch('http://localhost:3000/random-recipes');
        if (!response.ok) {
          throw new Error('Chyba při načítání receptů.');
        }
        const data = await response.json();

        this.filteredRecipes = data;
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    }
  },
  async mounted() {
    this.loading = true;

    try {
      const ingredientsResponse = await fetch('http://localhost:3000/ingredients');
      if (!ingredientsResponse.ok) {
        throw new Error('Chyba při načítání ingrediencí.');
      }
      const ingredientsData = await ingredientsResponse.json();
      this.allIngredients = ingredientsData.map(item => item.name);

      const mealTypesResponse = await fetch('http://localhost:3000/mealtypes');
      if (!mealTypesResponse.ok) {
        throw new Error('Chyba při načítání typů jídel.');
      }
      const mealTypesData = await mealTypesResponse.json();
      this.allMealTypes = mealTypesData.map(item => item.name);

      const categoriesResponse = await fetch('http://localhost:3000/categories');
      if (!categoriesResponse.ok) {
        throw new Error('Chyba při načítání kategorií.');
      }
      const categoriesData = await categoriesResponse.json();
      this.allCategories = categoriesData.map(item => item.name);

      const response = await fetch('http://localhost:3000/random-recipes');
      if (!response.ok) {
        throw new Error('Chyba při načítání receptů.');
      }
      const data = await response.json();

      this.recipes = data;
      this.filteredRecipes = this.recipes;
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style scoped>
.recipe-image {
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.recipe-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.recipe-card:hover {
  transform: scale(1.05);
}
</style>
