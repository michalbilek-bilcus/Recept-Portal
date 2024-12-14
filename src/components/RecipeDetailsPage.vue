<template>
  <div class="container mt-5">
    <div v-if="loading">Načítám detaily receptu...</div>
    <div v-if="errorMessage" class="text-danger">{{ errorMessage }}</div>
    <div v-if="recipe" class="recipe-container">
      <div class="top-left">
        <h1>{{ recipe.title }}</h1>
        <img v-if="recipe.image" :src="recipe.image" alt="Obrázek receptu" class="recipe-image" />
      </div>

      <div class="top-right">
        <button v-if="!isCooking" @click="startCooking" class="btn btn-primary">Spustit průvodce</button>
      </div>

      <div class="bottom-left">
        <h2>Ingredience:</h2>
        <ul>
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
            {{ ingredient.name }} - {{ ingredient.amount }}
          </li>
        </ul>
      </div>

      <div class="bottom-right">
        <h2>Postup:</h2>
        <ol>
          <li v-for="step in recipe.instructions" :key="step.step_number">
            {{ step.instruction }}
          </li>
        </ol>
      </div>
    </div>

    <!-- Průvodce -->
    <div v-if="isCooking" class="guide-overlay">
      <div class="guide-container">
        <button @click="closeGuide" class="close-btn">×</button>
        <div class="guide-steps">
          <h3>{{ recipe.instructions[currentStepIndex].instruction }}</h3>
          <div class="timer">
            <div class="timer-edit">
              <input type="number" v-model="hours" min="0" class="timer-input" />
              <label>:</label>
              <input type="number" v-model="minutes" min="0" max="59" class="timer-input" />
              <label>:</label>
              <input type="number" v-model="seconds" min="0" max="59" class="timer-input" />
            </div>
            <!--<p>{{ hours }} : {{ minutes < 10 ? '0' + minutes : minutes }} : {{ seconds < 10 ? '0' + seconds : seconds }}</p>-->
            <button @click="startTimer" :disabled="isTimerRunning" class="btn btn-success">Start Timer</button>
            <button @click="stopTimer" :disabled="!isTimerRunning" class="btn btn-danger">Stop Timer</button>
            <button @click="resetTimer" class="btn btn-warning">Reset Timer</button>
          </div>
        </div>
        <button @click="previousStep" :disabled="currentStepIndex === 0" class="btn btn-secondary">Krok zpátky</button>
        <button @click="nextStep" :disabled="currentStepIndex === recipe.instructions.length - 1" class="btn btn-primary">Další krok</button>
        <button v-if="currentStepIndex === recipe.instructions.length - 1" @click="finishCooking" class="btn btn-success">Dokončit</button>
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
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    startCooking() {
      this.isCooking = true;
      this.currentStepIndex = 0;
      this.initialHours = this.hours;
      this.initialMinutes = this.minutes;
      this.initialSeconds = this.seconds;
    },
    nextStep() {
      if (this.currentStepIndex < this.recipe.instructions.length - 1) {
        this.currentStepIndex++;
      }
    },
    previousStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
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
    },
  },
};
</script>

<style scoped>
/* Styly zůstávají stejné */
.container {
  text-align: center;
}

.recipe-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 20px;
}

.top-left, .top-right, .bottom-left, .bottom-right {
  flex: 1 1 45%;
  margin: 10px;
}

.top-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.recipe-image {
  max-width: 100%;
  height: auto;
  margin-top: 10px;
}

.top-right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.bottom-left, .bottom-right {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

button {
  margin-top: 10px;
}

h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

ul, ol {
  text-align: left;
  list-style-position: inside;
  padding-left: 0;
}

li {
  margin-bottom: 5px;
}

.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.guide-container {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: -10px;
  right: 10px;
  font-size: 30px;
  background: transparent;
  border: none;
  color: #000;
  cursor: pointer;
  padding: 5px;
}

.guide-steps {
  margin-top: 40px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.timer {
  margin-bottom: 20px;
  margin-top: 30px;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

.timer-edit {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
}

.timer-input {
  width: 100px;
  padding: 5px;
  font-size: 16px;
  margin-left: 10px;
  text-align: center;
}

.timer {
  margin-bottom: 20px;
}
</style>
