<template>
  <div class="d-flex justify-content-center align-items-center mt-5 pt-5">
    <div class="card p-4 shadow w-100" style="max-width: 800px;">
      <h2 class="text-center mb-4">Vytvořit nový recept</h2>

      <!-- Stepper -->
      <b-form @submit.prevent="submitRecipe">
        <b-form-group>
          <b-tabs v-model="currentStep" class="mb-3">
            <b-tab title="Základní informace" active>
              <div v-if="currentStep === 0">
                <!-- Obsah prvního kroku -->
                 <br>
                <b-form-group label="Název receptu" label-for="title">
                  <b-form-input id="title" v-model="recipe.title" required></b-form-input>
                </b-form-group>
                <b-form-group label="Popis" label-for="description">
                  <b-form-textarea id="description" v-model="recipe.description" rows="3" required></b-form-textarea>
                </b-form-group>
                <b-form-group label="Obrázek URL" label-for="image">
                  <b-form-input id="image" v-model="recipe.image"></b-form-input>
                </b-form-group>
              </div>
            </b-tab>
            <b-tab title="Ingredience">
              <div v-if="currentStep === 1">
                <!-- Obsah druhého kroku -->
                 <br>
                <b-form-group label="Ingredience">
                  <div v-for="(ingredient, index) in ingredients" :key="index" class="input-group mb-3">
                    <b-form-select v-model="ingredient.name" :options="allIngredients" required>
                      <template #first>
                        <option disabled value="">Ingredience</option>
                      </template>
                    </b-form-select>
                    <b-form-input v-model="ingredient.amount" placeholder="Množství" required></b-form-input>
                    <b-button @click="removeIngredient(index)" variant="danger">Odstranit</b-button>
                  </div>
                  <b-button @click="addIngredient" variant="primary">Přidat ingredienci</b-button>
                </b-form-group>
              </div>
            </b-tab>
            <b-tab title="Postup">
              <div v-if="currentStep === 2">
                <!-- Obsah třetího kroku -->
                 <br>
                <b-form-group label="Postup">
                  <div v-for="(instruction, index) in instructions" :key="index" class="mb-3">
                    <b-row>
                      <b-col cols="12" md="8">
                        <b-form-textarea v-model="instruction.text" placeholder="Popis kroku" rows="2" required></b-form-textarea>
                      </b-col>
                      <b-col cols="12" md="4" class="d-flex align-items-center">
                        <b-button @click="toggleTimer(index)" variant="primary" class="mb-2 w-100">
                          <i class="bi" :class="instruction.showTimer ? 'bi-dash' : 'bi-plus'"></i> {{ instruction.showTimer ? 'Odstranit časovač' : 'Přidat časovač' }}
                        </b-button>
                      </b-col>
                    </b-row>
                    <div v-if="instruction.showTimer" class="mt-2">
                      <b-form-group label="Časovač">
                        <b-row>
                          <b-col>
                            <b-form-input v-model="instruction.timer.hours" type="number" min="0" placeholder="Hodiny"></b-form-input>
                          </b-col>
                          <b-col>
                            <b-form-input v-model="instruction.timer.minutes" type="number" min="0" placeholder="Minuty"></b-form-input>
                          </b-col>
                          <b-col>
                            <b-form-input v-model="instruction.timer.seconds" type="number" min="0" placeholder="Sekundy"></b-form-input>
                          </b-col>
                        </b-row>
                      </b-form-group>
                    </div>
                    <b-button @click="removeInstruction(index)" variant="danger" class="mt-2">Odstranit krok</b-button>
                  </div>
                  <b-button @click="addInstruction" variant="primary">Přidat krok</b-button>
                </b-form-group>
              </div>
            </b-tab>
            <b-tab title="Typ jídla a kategorie">
              <div v-if="currentStep === 3">
                <!-- Obsah čtvrtého kroku -->
                 <br>
                <b-form-group label="Typ jídla">
                  <b-form-select v-model="selectedMealType" :options="allMealtypes"></b-form-select>
                </b-form-group>
                <b-form-group label="Kategorie">
                  <b-form-select v-model="selectedCategory" :options="allCategories"></b-form-select>
                </b-form-group>
              </div>
            </b-tab>
          </b-tabs>
        </b-form-group>

        <!-- Navigační tlačítka -->
        <div class="d-flex justify-content-between">
          <b-button @click="prevStep" :disabled="currentStep === 0">Předchozí</b-button>
          <b-button @click="nextStep" :disabled="currentStep === 3">Další</b-button>
          <b-button type="submit" v-if="currentStep === 3">Odeslat</b-button>
        </div>
      </b-form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentStep: 0,
      recipe: { title: '', description: '', image: '' },
      ingredients: [{ name: '', amount: '' }],
      instructions: [{ text: '', timer: { hours: 0, minutes: 0, seconds: 0 }, showTimer: false }],
      selectedMealType: null,
      selectedCategory: null,
      allMealtypes: [],
      allCategories: [],
      allIngredients: [],
      errorMessage: ''
    };
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
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    nextStep() {
      if (this.currentStep < 3) {
        this.currentStep++;
      }
    },
    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },
    addIngredient() {
      this.ingredients.push({ name: '', amount: '' });
    },
    removeIngredient(index) {
      this.ingredients.splice(index, 1);
    },
    addInstruction() {
      this.instructions.push({ text: '', timer: { hours: 0, minutes: 0, seconds: 0 }, showTimer: false });
    },
    removeInstruction(index) {
      this.instructions.splice(index, 1);
    },
    toggleTimer(index) {
      this.instructions[index].showTimer = !this.instructions[index].showTimer;
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

        this.$router.push('/');
      } catch (error) {
        console.error('Chyba při odesílání receptu:', error);
        this.errorMessage = error.message;
      }
    },
    validateForm() {
      // Implement your form validation logic here
      return true;
    }
  }
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