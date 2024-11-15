import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../components/HomePage.vue";
import RegisterPage from "../components/RegisterPage.vue";
import LoginPage from "../components/LoginPage.vue";
import ProfilePage from "../components/ProfilePage.vue"; // Import ProfilePage
import ReceptyPage from "@/components/ReceptyPage.vue";

const routes = [
  { path: "/homepage", component: HomePage, name: "homepage" },
  { path: "/registrace", component: RegisterPage, name: "registrace" },
  { path: "/prihlaseni", component: LoginPage, name: "prihlaseni" },
  { path: "/profil", component: ProfilePage, name: "profil" },
  { path: "/recepty", component: ReceptyPage, name: "recepty"}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
