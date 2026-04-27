import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import MyToolsView from '../views/MyToolsView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import ToolDetailsView from '../views/ToolDetailsView.vue'
import { authReady, isAuthenticated } from '../store/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { guestOnly: true },
    },
    {
      path: '/my-tools',
      name: 'my-tools',
      component: MyToolsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tools/:id',
      name: 'tool-details',
      component: ToolDetailsView,
    },
  ],
})

router.beforeEach(async (to) => {
  await authReady

  const authed = isAuthenticated.value

  if (to.meta?.requiresAuth && !authed) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }

  if (to.meta?.guestOnly && authed) {
    return { name: 'home' }
  }
})

export default router
