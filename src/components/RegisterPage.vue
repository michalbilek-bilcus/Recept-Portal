<template>
    <div class="register-form">
      <h2>Registrace</h2>
      <form @submit.prevent="register">
        <div>
          <label for="username">Uživatelské jméno:</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div>
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div>
          <label for="password">Heslo:</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div>
          <label for="confirmPassword">Potvrzení hesla:</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required />
        </div>
        <button type="submit">Registrovat</button>
      </form>
      <p v-if="errorMessage">{{ errorMessage }}</p>
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
        const response = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json' // Ověřte, že tento header je správně nastaven
          },
          body: JSON.stringify({
            name: this.username,     // použijte this.username místo this.name
            email: this.email,
            password: this.password
          })
        });

        if (!response.ok) {
          throw new Error(`Chyba ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Registrace úspěšná', data);
      } catch (error) {
        console.error('Chyba při registraci:', error);
        this.errorMessage = error.message; // Nastavení chybové zprávy do komponenty
      }
    }
  }
};
</script>

  
  <style scoped>
  /* Tvůj CSS styl pro formulář */
  .register-form {
    /* Přidej styly podle potřeby */
  }
  </style>
  