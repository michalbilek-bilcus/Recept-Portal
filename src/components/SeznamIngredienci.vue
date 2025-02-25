<template>
  <div class="modal fade show" style="display: block;">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Seznam Ingrediencí</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <ul class="list-group">
            <li v-for="(ingredient, index) in ingredients" :key="ingredient.name" class="list-group-item d-flex justify-content-between align-items-center">
              <span>{{ ingredient.name }} - {{ ingredient.amount }}</span>
              <button class="btn btn-danger btn-sm" @click="removeIngredient(index)">Odstranit</button>
            </li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="downloadShoppingList">Stáhnout nákupní košík</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    ingredients: {
      type: Array,
      required: true
    }
  },
  methods: {
    removeIngredient(index) {
      this.$emit('remove-ingredient', index);
    },
    downloadShoppingList() {
      const shoppingList = this.ingredients.map(ingredient => `${ingredient.name} - ${ingredient.amount}`).join('\n');
      const blob = new Blob([shoppingList], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'nakupni_kosik.txt';
      link.click();
      URL.revokeObjectURL(link.href);
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
.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>