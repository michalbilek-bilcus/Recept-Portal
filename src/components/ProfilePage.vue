<template>
  <div class="container mt-5">
    <h2>Vítejte na profilu!</h2>
    <p>Zde najdete informace o svém účtu.</p>

    <!-- Zobrazíme informace o uživatelském profilu -->
    <div v-if="user">
      <h4>{{ user.name }}</h4>
      <p>Email: {{ user.email }}</p>

      <!-- Seznam receptů vytvořených uživatelem -->
      <h5>Vaše recepty:</h5>
      <ul>
        <li v-for="recipe in recipes" :key="recipe.id">
          <router-link :to="'/recept/' + recipe.id">{{ recipe.title }}</router-link> 
          - {{ new Date(recipe.created_at).toLocaleDateString() }}
        </li>
      </ul>
    </div>

    <!-- Zobrazí se, pokud profil není načten -->
    <p v-if="loading">Načítám profil...</p>
    <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  name: "ProfilePage",
  data() {
    return {
      user: null, // data o uživatelském profilu
      recipes: [], // seznam receptů uživatele
      errorMessage: '',
      loading: true
    };
  },
  async mounted() {
    try {
      // Načteme údaje o uživatelském profilu z localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Pokud není uživatel přihlášen, zobrazíme chybovou zprávu
      if (!user) {
        this.errorMessage = 'Uživatel není přihlášen.';
        this.loading = false;
        return;
      }

      // Zavoláme API pro získání profilu a receptů uživatele
      const response = await fetch(`http://localhost:3000/datareceptprofile?userId=${user.id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json' // nebo jiný typ, pokud je potřeba
        },
    });


      if (!response.ok) {
        throw new Error('Chyba při načítání dat.');
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
  text-align: center;
}
</style>
