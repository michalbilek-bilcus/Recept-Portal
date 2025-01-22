import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

// Import BootstrapVue 3
import BootstrapVue3 from 'bootstrap-vue-3';

// Create the app
const app = createApp(App);

// Use BootstrapVue 3
app.use(BootstrapVue3);

// Use the router
app.use(router);

// Mount the app
app.mount('#app');