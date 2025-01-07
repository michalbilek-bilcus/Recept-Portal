<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card p-4 shadow w-100" style="max-width: 800px;">
      <h2 class="text-center mb-4">Vytvořit nový recept</h2>

      <!-- Zobrazení aktuálního kroku -->
      <div v-if="currentStep === 1">
        <div class="mb-3">
          <label for="title" class="form-label">Název receptu:</label>
          <input type="text" id="title" v-model="recipe.title" class="form-control" placeholder="Zadejte název receptu" required />
          <p v-if="errors.title" class="text-danger">Název receptu je povinný.</p>
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">Popis:</label>
          <textarea id="description" v-model="recipe.description" class="form-control" rows="4" placeholder="Popište recept..."></textarea>
        </div>
      </div>

      

      <div v-if="currentStep === 2">
        <div>
          <label class="form-label">Ingredience:</label>
          <div v-for="(ingredient, index) in ingredients" :key="index" class="input-group mb-2">
            <select v-model="ingredient.name" class="form-control" required>
              <option value="">Vyberte ingredienci</option>
              <option v-for="ingredientOption in allIngredients" :key="ingredientOption" :value="ingredientOption">
                {{ ingredientOption }}
              </option>
            </select>
            <input type="text" v-model="ingredient.amount" class="form-control" placeholder="Množství" />
            <button @click="removeIngredient(index)" type="button" class="btn btn-outline-danger">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <button @click="addIngredient" type="button" class="btn btn-outline-primary mt-2">Přidat ingredienci</button>
        </div>
      </div>

      <div v-if="currentStep === 3">
        <div>
          <label class="form-label">Instrukce:</label>
          <div v-for="(instruction, index) in instructions" :key="'instruction-' + index" class="mb-3">
            <div class="input-group">
              <span class="input-group-text">Krok {{ index + 1 }}</span>
              <input
                type="text"
                v-model="instruction.text"
                class="form-control"
                required
              />
              <button @click="removeInstruction(index)" type="button" class="btn btn-outline-danger">
                <i class="bi bi-x"></i>
              </button>
            </div>

            <!-- Tlačítko pro zobrazení časovače -->
            <button 
              @click="toggleTimer(index)" 
              type="button" 
              class="btn btn-outline-secondary mt-2"
            >
              <i class="bi bi-plus"></i> Časovač
            </button>

            <!-- Div s časovačem, zobrazí se po kliknutí na tlačítko -->
            <div v-if="instruction.showTimer" class="input-group mt-2">
              <div class="input-group-prepend">
                <label for="hours-input-{{ index }}" class="input-group-text">Hodiny</label>
              </div>
              <input 
                id="hours-input-{{ index }}"
                type="number" 
                v-model.number="instruction.timer.hours" 
                class="form-control" 
                min="0" 
              />
              
              <div class="input-group-prepend">
                <label for="minutes-input-{{ index }}" class="input-group-text">Minuty</label>
              </div>
              <input 
                id="minutes-input-{{ index }}"
                type="number" 
                v-model.number="instruction.timer.minutes" 
                class="form-control" 
                min="0" 
                max="59" 
              />
              
              <div class="input-group-prepend">
                <label for="seconds-input-{{ index }}" class="input-group-text">Sekundy</label>
              </div>
              <input 
                id="seconds-input-{{ index }}"
                type="number" 
                v-model.number="instruction.timer.seconds" 
                class="form-control" 
                min="0" 
                max="59" 
              />
            </div>
          </div>
          <button @click="addInstruction" type="button" class="btn btn-outline-primary mt-2">Přidat krok</button>
        </div>
      </div>

      <div v-if="currentStep === 4">
        <div class="mb-3">
          <label class="form-label">Typ jídla:</label>
          <select v-model="selectedMealType" class="form-select" required>
            <option value="">Vyberte typ jídla</option>
            <option v-for="mealtypeOption in allMealtypes" :key="mealtypeOption" :value="mealtypeOption">
              {{ mealtypeOption }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Kategorie:</label>
          <select v-model="selectedCategory" class="form-select" required>
            <option value="">Vyberte kategorii</option>
            <option v-for="categoryOption in allCategories" :key="categoryOption" :value="categoryOption">
              {{ categoryOption }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="currentStep === 5">
        <div class="mb-3">
          <label for="image" class="form-label">Obrázek:</label>
          <input
            type="text"
            id="image"
            v-model="recipe.image"
            class="form-control"
            placeholder="URL obrázku"
          />
          <div v-if="recipe.image" class="mt-2 text-center">
            <img
              :src="recipe.image"
              alt="Recipe Image"
              class="img-fluid rounded"
              style="max-height: 200px; object-fit: cover;"
            />
          </div>
        </div>
        <button @click="submitRecipe" class="btn btn-primary w-100 mt-4">Vytvořit recept</button>
      </div>

      <!-- Navigační tlačítka -->
      <div class="d-flex justify-content-between mt-4">
        <button @click="prevStep" class="btn btn-secondary" :disabled="currentStep === 1">Zpět</button>
        <button @click="nextStep" class="btn btn-primary" :disabled="currentStep === 5">Další</button>
      </div>

      <button @click="goHome" class="btn btn-link w-100 mt-3">Domů</button>
      <p v-if="errorMessage" class="text-danger mt-3 text-center">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 1,
      recipe: {
        title: '',
        description: '',
        image: '',
      },
      instructions: [
        { text: '', timer: { hours: 0, minutes: 0, seconds: 0 }, showTimer: false },
      ],
      ingredients: [{ name: '', amount: '' }],
      selectedMealType: '',
      selectedCategory: '',
      allMealtypes: [],
      allCategories: [],
      errorMessage: '',
      errors: {
        title: false,
        instructions: false,
        ingredients: false,
      },
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
      this.errors.mealtypes = !this.selectedMealType; // Validace pro mealtype
      this.errors.categories = !this.selectedCategory; // Validace pro category

      // Pokud některá část není validní, vrátíme false
      return !this.errors.title && !this.errors.instructions && !this.errors.ingredients && !this.errors.mealtypes && !this.errors.categories;
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
      this.instructions.push({
        text: '',
        timer: { hours: 0, minutes: 0, seconds: 0 }, // Inicializace nového časovače
        showTimer: false, // Inicializace viditelnosti časovače
      });
    },
    removeInstruction(index) {
      this.instructions.splice(index, 1);
    },
    toggleTimer(index) {
      this.instructions[index].showTimer = !this.instructions[index].showTimer;
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

        // Prepare recipe data
        const recipeData = {
          userId: user.id,
          ...this.recipe,
          instructions: this.instructions.map((instruction, index) => {
            // Calculate timer in seconds from hours, minutes, and seconds
            const timerInSeconds = (instruction.timer.hours * 3600) + (instruction.timer.minutes * 60) + instruction.timer.seconds;

            return {
              step_number: index + 1,
              text: instruction.text,
              timer: timerInSeconds, // Odesíláme čas v sekundách
            };
          }),
          ingredients: this.ingredients.map(ingredient => ({
            name: ingredient.name,
            amount: ingredient.amount
          })),
          mealtypes: this.selectedMealType ? [this.selectedMealType] : [],  // Ensure it's an array
          categories: this.selectedCategory ? [this.selectedCategory] : []  // Ensure it's an array
        };

        // Send POST request to the server
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

        // Reset form fields after successful creation
        this.recipe = { title: '', description: '', image: '' };
        this.ingredients = [{ name: '', amount: '' }];
        this.instructions = [{ text: '', timer: { hours: 0, minutes: 0, seconds: 0 }, showTimer: false }];
        this.selectedMealtypes = []; // Reset selected meal types
        this.selectedCategories = []; // Reset selected categories

        alert('Recept byl úspěšně vytvořen!');
        this.$router.push('/');
      } catch (error) {
        console.error('Chyba při odesílání receptu:', error);
        this.errorMessage = error.message;
      }
    },
  },
  async mounted() {
    this.loading = true;
    try {
      // Načtení všech typů jídel (mealtypes)
      const mealtypesResponse = await fetch('http://localhost:3000/mealtypes');
      if (!mealtypesResponse.ok) {
        throw new Error('Chyba při načítání typů jídel.');
      }
      const mealtypesData = await mealtypesResponse.json();
      this.allMealtypes = mealtypesData.map(item => item.name); // Uložení názvů typů jídel do pole

      // Načtení všech kategorií (categories)
      const categoriesResponse = await fetch('http://localhost:3000/categories');
      if (!categoriesResponse.ok) {
        throw new Error('Chyba při načítání kategorií.');
      }
      const categoriesData = await categoriesResponse.json();
      this.allCategories = categoriesData.map(item => item.name); // Uložení názvů kategorií do pole

      // Načtení všech ingrediencí
      const ingredientsResponse = await fetch('http://localhost:3000/ingredients');
      if (!ingredientsResponse.ok) {
        throw new Error('Chyba při načítání ingrediencí.');
      }
      const ingredientsData = await ingredientsResponse.json();
      this.allIngredients = ingredientsData.map(item => item.name); // Uložení názvů ingrediencí do pole

      // Načtení všech receptů
      const recipesResponse = await fetch('http://localhost:3000/random-recipes');
      if (!recipesResponse.ok) {
        throw new Error('Chyba při načítání receptů.');
      }
      const recipesData = await recipesResponse.json();
      console.log(recipesData); // Debugging: vypíše data pro kontrolu

      this.recipes = recipesData;
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
.card {
  max-width: 100%;
  text-align: left;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.input-group .form-control {
  margin-right: 5px;
}
.input-group.mb-3 {
  margin-top: 10px;
}
.input-group .input-group-text {
  margin-right: -1px;
}
</style>