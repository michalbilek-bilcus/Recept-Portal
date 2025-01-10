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
      <!-- Recipe Rating -->
      <div class="row mt-4">
        <div class="col-md-12">
          <h3>Hodnocení receptu</h3>
          <div class="rating-options">
            <div v-for="(ratingText, index) in ratingOptions" :key="index" class="form-check">
              <input 
                class="form-check-input" 
                type="radio" 
                :id="'rating' + index" 
                :value="index + 1" 
                v-model="selectedRating"
                @change="submitRating"
              />
              <label class="form-check-label" :for="'rating' + index">
                {{ ratingText }}
              </label>
            </div>
          </div>
        </div>
      </div>
      <!-- Recipe Comments -->
      <div class="col-md-6">
          <h3>Komentáře</h3>
          <div class="comments-section">
            <div v-for="comment in comments" :key="comment.id" class="comment">
              <p><strong>{{ comment.user_name }}:</strong> {{ comment.comment }}</p>
            </div>
          </div>
          <div class="add-comment">
            <textarea v-model="newComment" placeholder="Napište komentář..." class="form-control"></textarea>
            <button @click="submitComment" class="btn btn-primary mt-2">Přidat komentář</button>
          </div>
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
      isFavourite: false,
      ratingOptions: ['Skvělý', 'Dobrý', 'Dá se', 'Špatný', 'Odpad'],
      selectedRating: null,
      comments: [],
      newComment: ''
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
      
      // Načtení hodnoty favourite
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const favouriteResponse = await fetch(`http://localhost:3000/favourite?userId=${user.id}&recipeId=${recipeId}`);
        if (favouriteResponse.ok) {
          const favouriteData = await favouriteResponse.json();
          this.isFavourite = favouriteData.favourite === 1;
        }

        const ratingResponse = await fetch(`http://localhost:3000/rating?userId=${user.id}&recipeId=${recipeId}`);
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          this.selectedRating = ratingData.rating;
        }
      }

      // Načtení komentářů
      const commentsResponse = await fetch(`http://localhost:3000/comments?recipeId=${recipeId}`);
      if (commentsResponse.ok) {
        this.comments = await commentsResponse.json();
      }
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async toggleFavourite() {
      // Get the logged-in user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        this.errorMessage = "Musíte být přihlášeni, abyste mohli přidat hodnocení.";
        return;
      }

      // Toggle the favourite state
      const favourite = this.isFavourite ? 0 : 1;

      try {
        const favouriteData = {
          userId: user.id,
          recipeId: this.recipe.id,
          favourite: favourite,
        };

        const response = await fetch('http://localhost:3000/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(favouriteData),
        });

        if (!response.ok) {
          throw new Error(`Chyba ${response.status}: ${response.statusText}`);
        }

        this.isFavourite = favourite;
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async submitRating() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        this.errorMessage = "Musíte být přihlášeni, abyste mohli přidat hodnocení.";
        return;
      }

      try {
        const ratingData = {
          userId: user.id,
          recipeId: this.recipe.id,
          rating: this.selectedRating
        };

        const response = await fetch('http://localhost:3000/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ratingData),
        });

        if (!response.ok) {
          throw new Error(`Chyba ${response.status}: ${response.statusText}`);
        }

        console.log('Hodnocení bylo úspěšně uloženo.');
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async submitComment() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        this.errorMessage = "Musíte být přihlášeni, abyste mohli přidat komentář.";
        return;
      }

      try {
        const commentData = {
          userId: user.id,
          recipeId: this.recipe.id,
          comment: this.newComment
        };

        const response = await fetch('http://localhost:3000/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commentData),
        });

        if (!response.ok) {
          throw new Error(`Chyba ${response.status}: ${response.statusText}`);
        }

        // Přidání nového komentáře do seznamu komentářů
        this.comments.push({
          user_name: user.name,
          comment: this.newComment
        });

        // Vyprázdnění pole pro nový komentář
        this.newComment = '';
      } catch (error) {
        this.errorMessage = error.message;
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
