import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import ReceptyPage from '../components/ReceptyPage.vue';
import KontaktPage from '../components/KontaktPage.vue';

const routes = [
  { path: '/', component: HomePage, name: 'Home' },
  { path: '/recepty', component: ReceptyPage, name: 'Recepty' },
  { path: '/kontakt', component: KontaktPage, name: 'Kontakt' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;