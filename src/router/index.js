import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../components/HomePage.vue";
import RegisterPage from "../components/RegisterPage.vue";
import LoginPage from "../components/LoginPage.vue";

const routes = [
  { path: "/homepage", component: HomePage, name: "homepage" },  // Přidání názvu trasy
  { path: "/registrace", component: RegisterPage, name: "registrace" }, // Přidání názvu trasy
  { path: "/prihlaseni", component: LoginPage, name: "prihlaseni" }, // Přidání názvu trasy
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
