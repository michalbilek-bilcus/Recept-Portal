<template>
  <div class="register-form container mt-5">
    <h2 class="text-center mb-4">Registrace</h2>
    <form @submit.prevent="register" class="bg-light p-5 rounded shadow-sm">
      <div class="form-group mb-3">
        <label for="username">Uživatelské jméno:</label>
        <input type="text" id="username" v-model="username" class="form-control" required />
      </div>
      <div class="form-group mb-3">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" class="form-control" required />
      </div>
      <div class="form-group mb-3">
        <label for="password">Heslo:</label>
        <input type="password" id="password" v-model="password" class="form-control" required />
      </div>
      <div class="form-group mb-3">
        <label for="confirmPassword">Potvrzení hesla:</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" class="form-control" required />
      </div>
      <button type="submit" class="btn btn-primary w-100">Registrovat</button>
      
      <button @click="goHome" class="btn btn-link w-100 mt-3">Domů</button>
      <p v-if="errorMessage" class="text-danger mt-3 text-center-error">{{ errorMessage }}</p>

    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      errorMessage: ''
    };
  },
  methods: {
  async register() {
    try {
      const passwordRequirements = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRequirements.test(this.password)) {
        this.errorMessage = "Heslo musí obsahovat alespoň jedno velké písmeno, jedno číslo a mít minimálně 8 znaků.";
        return; 
      }

      // Kontrola, jestli se hesla shodují
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Hesla se neshodují.";
        return;
      }

      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.username,
          email: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chyba ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Registrace úspěšná', data);

      // Uložení informací o uživatelském účtu do localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Zavoláme metodu updateLoginStatus v App.vue pro změnu isLoggedIn na true
      this.$root.updateLoginStatus(true);

      // Přesměrování na homepage po úspěšné registraci
      this.$router.push('/');
    } catch (error) {
      console.error('Chyba při registraci:', error);
      this.errorMessage = error.message;
    }
  },
  goHome() {
    // Přesměrování na domovskou stránku
    this.$router.push('/');
  },
},
};
</script>
