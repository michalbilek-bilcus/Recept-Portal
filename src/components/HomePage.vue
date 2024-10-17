<template>
  <div>
    <!-- Bootstrap Navbar s odkazy pomocí router-link -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <router-link class="navbar-brand ml-3" to="/">Receptový portál</router-link>
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
            <router-link class="nav-link" to="/">Domů</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/recepty">Recepty</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/kontakt">Kontakt</router-link>
          </li>
        </ul>
      </div>

      <!-- Uživatelský profil a odhlášení -->
      <div class="navbar-nav ml-auto d-flex align-items-center mr-3">
        <div class="nav-item d-flex align-items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/147/147144.png" alt="user-icon" width="30" height="30" class="mr-2" style="margin-right: 10px;">
        </div>
        <button class="btn btn-outline-danger ml-2">Odhlásit se</button>
      </div>
    </nav>

    <!-- Obsah domovské stránky -->
    <div class="container home mt-5">
      <header class="home-header text-center py-5 bg-warning">
        <h1>Vítejte na Receptovým portálu</h1>
        <p class="lead">Najděte a sdílejte své oblíbené recepty.</p>
      </header>

      <section class="features row text-center mt-5">
        <div class="feature col-md-4">
          <h2 class="text-warning">Vyhledávání receptů</h2>
          <p>Vyhledejte recept podle ingrediencí nebo typu pokrmu.</p>
        </div>
        <div class="feature col-md-4">
          <h2 class="text-warning">Interaktivní průvodce</h2>
          <p>Spusťte recept a postupně vařte podle kroků.</p>
        </div>
        <div class="feature col-md-4">
          <h2 class="text-warning">Hodnocení a komentáře</h2>
          <p>Ohodnoťte a komentujte své oblíbené recepty.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
};
</script>

<style scoped>
.navbar-brand {
  margin-left: 20px;
}

.navbar-nav.ml-auto {
  margin-right: 20px;
}

.home-header {
  background-color: #ffcc99;
}

.text-warning {
  color: #f7c600;
}

.navbar-nav {
  flex-direction: row;
  justify-content: center;
}
</style>
