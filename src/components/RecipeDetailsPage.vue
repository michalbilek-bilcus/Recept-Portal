<template>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet">

  <div class="container mt-5">
    <div v-if="loading" class="alert alert-info text-center">Načítám detaily receptu...</div>
    <div v-if="errorMessage" class="alert alert-danger text-center">{{ errorMessage }}</div>

    <div v-if="recipe">
      <!-- Recipe Header -->
      <div class="row mb-4">
        <!-- Div pro obrázek -->
        <div class="col-md-6">
          <img 
            v-if="recipe.image" 
            :src="recipe.image" 
            alt="Obrázek receptu" 
            class="img-fluid rounded shadow"
          />
        </div>

        <!-- Div pro popis -->
        <div class="col-md-6 d-flex flex-column justify-content-center">
          <h1 class="display-4">{{ recipe.title }}</h1>
          <i 
            :class="['bi', isFavourite ? 'bi-star-fill' : 'bi-star', 'fs-2', 'text-warning']" 
            @click="toggleFavourite"
            style="cursor: pointer;">
          </i>
          <p class="mt-3">{{ recipe.description }}</p>
        </div>
      </div>

      <!-- Ingredients and Instructions -->
      <div class="row">
        <div class="col-md-6">
          <h2 class="mb-3">Ingredience</h2>
          <ul class="list-group">
            <li 
              v-for="ingredient in recipe.ingredients" 
              :key="ingredient.name" 
              class="list-group-item d-flex justify-content-between align-items-center">
              {{ ingredient.name }}
              <span class="badge bg-primary rounded-pill">{{ ingredient.amount }}</span>
            </li>
          </ul>
        </div>
        <div class="col-md-6">
          <!-- Nadpis "Postup" s tlačítkem -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="mb-0">Postup</h2>
            <button 
              v-if="!isCooking" 
              @click="startCooking" 
              class="btn btn-primary btn-lg">
              Spustit průvodce
            </button>
          </div>
          <ol class="list-group list-group-numbered">
            <li 
              v-for="step in recipe.instructions" 
              :key="step.step_number" 
              class="list-group-item">
              {{ step.instruction }}
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Cooking Guide -->
    <div v-if="isCooking" class="modal fade show" style="display: block; background-color: rgba(0, 0, 0, 0.8);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Průvodce receptem</h5>
            <button type="button" class="btn-close" @click="closeGuide"></button>
          </div>
          <div class="modal-body">
            <h3 class="text-center mb-4">{{ recipe.instructions[currentStepIndex].instruction }}</h3>

            <div v-if="hours !== 0 || minutes !== 0 || seconds !== 0" class="text-center mb-4">
              <div class="input-group justify-content-center">
                <input type="number" v-model="hours" min="0" class="form-control text-center" style="max-width: 80px;">
                <span class="input-group-text">:</span>
                <input type="number" v-model="minutes" min="0" max="59" class="form-control text-center" style="max-width: 80px;">
                <span class="input-group-text">:</span>
                <input type="number" v-model="seconds" min="0" max="59" class="form-control text-center" style="max-width: 80px;">
              </div>

              <div class="mt-3">
                <button @click="startTimer" :disabled="isTimerRunning" class="btn btn-success me-2">Start</button>
                <button @click="stopTimer" :disabled="!isTimerRunning" class="btn btn-danger me-2">Stop</button>
                <button @click="resetTimer" class="btn btn-warning">Reset</button>
              </div>
            </div>

            <div class="d-flex justify-content-between">
              <button 
                @click="previousStep" 
                :disabled="currentStepIndex === 0" 
                class="btn btn-secondary">
                Krok zpátky
              </button>
              <button 
                @click="nextStep" 
                :disabled="currentStepIndex === recipe.instructions.length - 1" 
                class="btn btn-primary">
                Další krok
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              v-if="currentStepIndex === recipe.instructions.length - 1" 
              @click="finishCooking" 
              class="btn btn-success w-100">
              Dokončit
            </button>
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
      recipe: null,
      loading: true,
      errorMessage: '',
      isCooking: false,
      currentStepIndex: 0,
      hours: 0,
      minutes: 5,
      seconds: 0,
      initialHours: 0,
      initialMinutes: 5,
      initialSeconds: 0,
      isTimerRunning: false,
      timerInterval: null,
      isFavourite: false
    };
  },
  async created() {
  const recipeId = this.$route.params.id;
  try {
    const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);
    if (!response.ok) {
      throw new Error('Chyba při načítání detailů receptu.');
    }
    this.recipe = await response.json();

    // Pokud má recept atribut pro oblíbenost, nastavíme ho
    this.isFavourite = this.recipe.is_favourite || 0; // Předpokládáme, že na serveru je hodnota 1 nebo 0 pro oblíbenost

    this.recipe.instructions.forEach(step => {
      step.timer_hours = step.timer_hours || 0;
      step.timer_minutes = step.timer_minutes || 0;
      step.timer_seconds = step.timer_seconds || 0;
    });
  } catch (error) {
    this.errorMessage = error.message;
  } finally {
    this.loading = false;
  }
},
  methods: {
    async toggleFavourite() {
  try {
    const response = await fetch(`http://localhost:3000/recipe/${this.recipe.id}/favourite`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        favourite: this.isFavourite ? 0 : 1
      })
    });

    if (!response.ok) {
      throw new Error('Chyba při aktualizaci oblíbeného stavu receptu.');
    }

    // Změna stavu oblíbenosti na základě odpovědi
    this.isFavourite = !this.isFavourite;
  } catch (error) {
    console.error(error);
  }
},
    startCooking() {
      this.isCooking = true;
      this.currentStepIndex = 0;

      this.hours = this.recipe.instructions[this.currentStepIndex].timer_hours;
      this.minutes = this.recipe.instructions[this.currentStepIndex].timer_minutes;
      this.seconds = this.recipe.instructions[this.currentStepIndex].timer_seconds;

      this.initialHours = this.hours;
      this.initialMinutes = this.minutes;
      this.initialSeconds = this.seconds;
    },
    nextStep() {
      if (this.currentStepIndex < this.recipe.instructions.length - 1) {
        this.currentStepIndex++;

        const currentStep = this.recipe.instructions[this.currentStepIndex];
        this.hours = currentStep.timer_hours;
        this.minutes = currentStep.timer_minutes;
        this.seconds = currentStep.timer_seconds;

        this.initialHours = this.hours;
        this.initialMinutes = this.minutes;
        this.initialSeconds = this.seconds;
      }
    },
    previousStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;

        const currentStep = this.recipe.instructions[this.currentStepIndex];
        this.hours = currentStep.timer_hours;
        this.minutes = currentStep.timer_minutes;
        this.seconds = currentStep.timer_seconds;

        this.initialHours = this.hours;
        this.initialMinutes = this.minutes;
        this.initialSeconds = this.seconds;
      }
    },
    finishCooking() {
      this.isCooking = false;
      alert('Recept dokončen!');
    },
    startTimer() {
      this.isTimerRunning = true;
      this.timerInterval = setInterval(() => {
        if (this.seconds > 0) {
          this.seconds--;
        } else if (this.minutes > 0) {
          this.minutes--;
          this.seconds = 59;
        } else if (this.hours > 0) {
          this.hours--;
          this.minutes = 59;
          this.seconds = 59;
        }
        if (this.hours === 0 && this.minutes === 0 && this.seconds === 0) {
          this.stopTimer();
          alert('Čas na tento krok vypršel!');
        }
      }, 1000);
    },
    stopTimer() {
      if (this.isTimerRunning) {
        clearInterval(this.timerInterval);
        this.isTimerRunning = false;
      }
    },
    resetTimer() {
      this.hours = this.initialHours;
      this.minutes = this.initialMinutes;
      this.seconds = this.initialSeconds;
      if (this.isTimerRunning) {
        this.stopTimer();
      }
    },
    closeGuide() {
      this.isCooking = false;
      this.stopTimer();
      this.currentStepIndex = 0;
    }
  }
};
</script>

<style scoped>
.modal.fade.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.8);
}
.modal-content {
  border-radius: 10px;
}
.container {
  padding-bottom: 20px;
}
.modal.fade.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.8);
}
.modal-content {
  border-radius: 10px;
}
.container {
  padding-bottom: 20px;
}

/* Řešení pro text uvnitř divu */
div {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}
</style>
