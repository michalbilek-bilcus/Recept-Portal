import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../components/HomePage.vue";
import RegisterPage from "../components/RegisterPage.vue"; // Nový import
import LoginPage from "../components/LoginPage.vue";       // Nový import

const routes = [
  { path: "/", component: HomePage },
  { path: "/registrace", component: RegisterPage },        // Přidaná cesta pro registraci
  { path: "/prihlaseni", component: LoginPage },           // Přidaná cesta pro přihlášení
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
