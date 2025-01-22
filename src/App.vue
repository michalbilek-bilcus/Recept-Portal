<template>
  <div id="app" class="app-background">
    <div class="overlay"></div>
    <!-- Zobrazí navbar pouze na stránkách, které nejsou 'login' nebo 'register' -->
    <nav v-if="!isAuthPage" class="navbar navbar-expand-lg navbar-light bg-light">
      <router-link class="navbar-brand" to="/" style="margin-left: 40px;">Receptový portál</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse d-flex justify-content-center" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link class="nav-link" to="/recepty">Recepty</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/kontakt">Kontakt</router-link>
          </li>
        </ul>
      </div>

      <div class="navbar-nav ml-auto d-flex align-items-center" style="margin-right: 30px;">
        <div v-if="isLoggedIn" class="nav-item d-flex align-items-center">
          <!-- Kliknutí na ikonu přesměruje na ProfilePage -->
          <router-link to="/profil">
            <img src="https://cdn-icons-png.flaticon.com/512/147/147144.png" alt="user-icon" width="30" height="30" class="mr-2" style="margin-right: 15px; cursor: pointer;">
          </router-link>
        </div>
        <router-link v-if="isLoggedIn" to="/createrecept" class="btn btn-outline-primary ml-3">Vytvořit recept</router-link>

        <router-link v-if="!isLoggedIn" to="/registrace" class="btn btn-outline-primary ml-3">Registrovat se</router-link>
        <router-link v-if="!isLoggedIn" to="/prihlaseni" class="btn btn-outline-success ml-3">Přihlásit se</router-link>
        
        <button v-if="isLoggedIn" @click="logout" class="btn btn-outline-danger ml-3">Odhlásit se</button>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false
    };
  },
  computed: {
    isAuthPage() {
      return this.$route.name === 'prihlaseni' || this.$route.name === 'registrace';
    }
  },
  mounted() {
    // Načítání stavu přihlášení uživatele z localStorage
    this.isLoggedIn = !!localStorage.getItem('user');
  },
  methods: {
    logout() {
      localStorage.removeItem('user');
      this.isLoggedIn = false;
      this.$router.push('/prihlaseni');
    },

    // Metoda pro změnu stavu přihlášení
    updateLoginStatus(status) {
      this.isLoggedIn = status;
    }
  }
};
</script>

<style scoped>
.navbar-nav {
  display: flex;
  justify-content: flex-end;
  margin-right: 30px;
}

.navbar-nav .btn {
  margin-left: 20px; /* Přidání mezery mezi tlačítky */
}

.navbar-nav .btn-outline-primary {
  margin-right: 10px; /* Pro větší mezeru mezi prvním tlačítkem a druhým */
}

.app-background {
  position: relative;
  background-image: url('@/assets/Obrázek WhatsApp, 2025-01-22 v 12.07.27_c7c15541.jpg');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Tmavší překryvná vrstva */
  z-index: 1;
}

#app > *:not(.overlay) {
  position: relative;
  z-index: 2;
}
</style>