<template>
  <div class="container home mt-5">
    <header class="home-header text-center py-5 bg-warning">
      <h1>Vítejte na Receptovém portálu</h1>
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
</template>

<script>
export default {
  name: 'HomePage',
};
</script>

<style scoped>
.home-header {
  background-color: #ffcc99;
}

.text-warning {
  color: #f7c600;
}
</style>
