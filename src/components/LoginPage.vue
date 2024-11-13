<template>
  <div class="d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-sm" style="width: 22rem;">
      <h2 class="text-center mb-4">Přihlášení</h2>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label for="email" class="form-label">Email:</label>
          <input type="email" id="email" v-model="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Heslo:</label>
          <input type="password" id="password" v-model="password" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Přihlásit se</button>
      </form>
      <button @click="goHome" class="btn btn-link w-100 mt-3">Domů</button>
      <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await fetch('http://localhost:3000/prihlaseni', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        if (!response.ok) {
          throw new Error(`Chyba ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Přihlášení úspěšné', data);

        localStorage.setItem('user', JSON.stringify(data.user));

        // Zavoláme metodu updateLoginStatus v App.vue pro změnu isLoggedIn na true
        this.$root.updateLoginStatus(true);

        this.$router.push('/homepage');
      } catch (error) {
        console.error('Chyba při přihlášení:', error);
        this.errorMessage = error.message;
      }
    },
    goHome() {
      this.$router.push('/homepage');
    }
  }
};
</script>
