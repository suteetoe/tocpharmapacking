import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import MainLayout from '../layouts/MainLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { layout: 'empty' }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: DashboardView,
      meta: { layout: MainLayout, requiresAuth: true }
    },
    {
      path: '/packing',
      name: 'Packing',
      component: () => import('../views/packing/PackingView.vue'),
      meta: { layout: MainLayout, requiresAuth: true }
    },
    {
      path: '/print/packing/:id',
      name: 'PrintPacking',
      component: () => import('../views/packing/PrintView.vue'),
      meta: { layout: 'div', requiresAuth: true }
    }
  ]
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
