<template>
  <div class="container mt-5">
    <!-- Vyhledávací pole -->
    <div class="search-bar">
      <div class="input-group mb-3">
        <!-- Dropdown pro ingredience -->
        <select v-model="searchIngredients" class="form-control">
          <option value="">Vyberte ingredienci</option>
          <option v-for="ingredient in allIngredients" :key="ingredient" :value="ingredient">
            {{ ingredient }}
          </option>
        </select>
        <input
          type="text"
          v-model="searchTitle"
          class="form-control"
          placeholder="Zadejte název receptu"
        />
        <button @click="filterRecipes" class="btn btn-primary">Hledat recepty</button>
        <button @click="loadRandomRecipes" class="btn btn-secondary">Zobrazit všechny recepty</button>
      </div>
    </div>

    <!-- Zpráva o chybě -->
    <div v-if="errorMessage" class="text-center text-danger">{{ errorMessage }}</div>

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
          class="card recipe-card"
          @click="navigateToRecipe(recipe.id)"
        >
          <div
            class="recipe-image card-img-top"
            :style="{ backgroundImage: `url(${recipe.image})` }"
          >
            <div class="recipe-title">{{ recipe.title }}</div>
          </div>
          <div class="card-body">
            <!-- Ingredience receptu -->
            <ul class="list-unstyled recipe-ingredients">
              <li v-for="(ingredient, index) in (recipe.ingredients ? recipe.ingredients.split(',') : [])" 
                  :key="`${ingredient.trim()}-${index}`">  <!-- Unikátní key pro každou ingredienci -->
                {{ ingredient.trim() }}
              </li>
            </ul>
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
      recipes: [], // Pole všech receptů
      filteredRecipes: [], // Filtrované recepty
      searchIngredients: '', // Zadané ingredience
      searchTitle: '', // Zadaný název receptu
      loading: false,
      errorMessage: '',
      allIngredients: [] // Ingredience z databáze
    };
  },
  methods: {
    navigateToRecipe(recipeId) {
      // Přesměrování na stránku detailů receptu
      this.$router.push({ name: "receptdetails", params: { id: recipeId } });
    },
    async filterRecipes() {
      const ingredients = this.searchIngredients.split(',').map((ing) => ing.trim()).filter(Boolean);
      const title = this.searchTitle.trim().toLowerCase();

      this.loading = true;
      this.errorMessage = ''; // Resetování chybové zprávy

      if (ingredients.length === 0 && title === '') {
        this.errorMessage = 'Zadejte alespoň jednu ingredienci nebo název receptu.';
        this.loading = false;
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/filter-recipes?ingredients=${ingredients.join(',')}&title=${title}`
        );
        
        if (!response.ok) {
          throw new Error('Chyba při filtrování receptů.');
        }

        const data = await response.json();
        console.log(data); // Debugging: vypíše data pro kontrolu

        // Pokud server vrátí prázdný seznam, nastavíme chybovou zprávu
        if (data.length === 0) {
          this.errorMessage = `Žádný recept s názvem "${title}" nebo požadovanými ingrediencemi nebyl nalezen.`;
        } else {
          this.filteredRecipes = data;
        }
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
    async loadRandomRecipes() {
      this.loading = true;
      this.errorMessage = ''; // Resetování chybové zprávy

      try {
        const response = await fetch('http://localhost:3000/random-recipes');
        if (!response.ok) {
          throw new Error('Chyba při načítání receptů.');
        }
        const data = await response.json();

        this.filteredRecipes = data; // Zobrazí všechny recepty
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
      // Získání všech ingrediencí z backendu
      const ingredientsResponse = await fetch('http://localhost:3000/ingredients');
      if (!ingredientsResponse.ok) {
        throw new Error('Chyba při načítání ingrediencí.');
      }
      const ingredientsData = await ingredientsResponse.json();
      this.allIngredients = ingredientsData.map(item => item.name); // Uložení názvů ingrediencí do pole

      // Získání všech receptů
      const response = await fetch('http://localhost:3000/random-recipes');
      if (!response.ok) {
        throw new Error('Chyba při načítání receptů.');
      }
      const data = await response.json();
      console.log(data); // Debugging: vypíše data pro kontrolu

      this.recipes = data;
      this.filteredRecipes = this.recipes; // Zobrazí všechny recepty
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style scoped>
.container {
  text-align: center;
}

.recipe-image {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
  border-radius: 10px 10px 0 0;
}

.recipe-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  height: auto;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease; /* Přidání plynulého efektu pro pohyb */
}

.recipe-card:hover {
  transform: scale(1.05); /* Při hoveru karta mírně zvětší */
}

.recipe-title {
  width: 100%;
  text-align: center;
  font-size: 1.2em;
  color: white;
  padding: 10px 0;
  background: rgba(0, 0, 0, 0.5);
  transition: color 0.3s ease; /* Plynulý přechod pro změnu barvy */
}

.recipe-card:hover .recipe-title {
  color: orange; /* Oranžová barva při hoveru */
}

.recipe-ingredients {
  list-style: none;
  padding: 0;
  font-size: 0.9em;
  text-align: left;
}

.recipe-ingredients li {
  margin: 0;
  padding: 0;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input,
.search-bar button {
  margin-bottom: 10px;
}

.search-bar input {
  max-width: 400px;
}

.text-danger {
  padding-bottom: 20px;
}
</style>
