<template>
    <div class="container mt-5">
      <div v-if="loading">Načítám detaily receptu...</div>
      <div v-if="errorMessage" class="text-danger">{{ errorMessage }}</div>
      <div v-if="recipe">
        <h1>{{ recipe.title }}</h1>
        <img v-if="recipe.image" :src="recipe.image" alt="Obrázek receptu" class="recipe-image" />
        <p>{{ recipe.description }}</p>
  
        <h2>Ingredience:</h2>
        <ul>
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.name">
            {{ ingredient.name }} - {{ ingredient.amount }}
          </li>
        </ul>
  
        <h2>Postup:</h2>
        <ol>
          <li v-for="step in recipe.instructions" :key="step.step_number">
            {{ step.instruction }}
          </li>
        </ol>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        recipe: null, // Výchozí hodnota je null
        loading: true,
        errorMessage: '',
      };
    },
    async created() {
      const recipeId = this.$route.params.id; // Získání ID receptu z URL
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
  };
  </script>
  
  <style scoped>
  .container {
    text-align: center;
  }
  
  .recipe-image {
    max-width: 100%;
    height: auto;
    margin: 20px 0;
  }
  </style>
  